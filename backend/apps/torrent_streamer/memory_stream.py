"""
Memory-based streaming for torrents.

Reads pieces directly from libtorrent's cache without waiting for disk writes.
This significantly reduces startup time and improves seeking performance.
"""

import asyncio
import logging
from typing import Optional, AsyncIterator, Tuple
from pathlib import Path
import time

from .libtorrent_shim import lt

logger = logging.getLogger(__name__)


class MemoryStreamReader:
    """Reads torrent data directly from memory/cache without disk I/O."""

    def __init__(self, handle: lt.torrent_handle, file_index: int):
        self.handle = handle
        self.file_index = file_index
        self.torrent_info = handle.torrent_file()

        if file_index >= self.torrent_info.num_files():
            raise ValueError(f"Invalid file index: {file_index}")

        self.file_entry = self.torrent_info.files().at(file_index)
        self.file_offset = self.file_entry.offset
        self.file_size = self.file_entry.size
        self.piece_length = self.torrent_info.piece_length()

        # Calculate piece range for this file
        self.first_piece = self.file_offset // self.piece_length
        self.last_piece = (self.file_offset + self.file_size - 1) // self.piece_length

        logger.info(f"[MEMORY_STREAM] Initialized for file {file_index}: "
                   f"size={self.file_size}, pieces={self.first_piece}-{self.last_piece}")

    def _read_piece_from_cache(self, piece_index: int) -> Optional[bytes]:
        """Read a single piece directly from libtorrent's cache."""
        try:
            # Check if piece is available
            if not self.handle.have_piece(piece_index):
                return None

            # Read piece directly from libtorrent
            # This reads from memory cache if available, avoiding disk I/O
            piece_data = self.handle.read_piece(piece_index)

            if piece_data is None:
                # Piece not in cache, trigger async read
                self.handle.read_piece_async(piece_index)
                return None

            return bytes(piece_data)

        except Exception as e:
            logger.error(f"[MEMORY_STREAM] Failed to read piece {piece_index}: {e}")
            return None

    async def read_range(self, start: int, end: int) -> AsyncIterator[bytes]:
        """
        Read a byte range from the file using memory cache.

        Args:
            start: Starting byte offset within the file
            end: Ending byte offset within the file (inclusive)

        Yields:
            Chunks of data from the requested range
        """
        if start < 0 or start >= self.file_size:
            raise ValueError(f"Invalid start offset: {start}")

        end = min(end, self.file_size - 1)

        absolute_start = self.file_offset + start
        absolute_end = self.file_offset + end

        start_piece = absolute_start // self.piece_length
        end_piece = absolute_end // self.piece_length

        logger.info(f"[MEMORY_STREAM] Reading range {start}-{end} (pieces {start_piece}-{end_piece})")

        position = start

        for piece_idx in range(start_piece, end_piece + 1):
            # Prioritize this piece
            self.handle.piece_priority(piece_idx, 7)
            try:
                self.handle.set_piece_deadline(piece_idx, 0, 0)
            except:
                pass

            # Wait for piece with timeout
            wait_start = time.time()
            max_wait = 10.0  # 10 second timeout per piece

            while not self.handle.have_piece(piece_idx):
                if time.time() - wait_start > max_wait:
                    logger.warning(f"[MEMORY_STREAM] Timeout waiting for piece {piece_idx}")
                    return

                await asyncio.sleep(0.05)

            # Read piece from cache
            piece_data = self._read_piece_from_cache(piece_idx)

            if piece_data is None:
                # Try reading from cache a few times
                for _ in range(5):
                    await asyncio.sleep(0.1)
                    piece_data = self._read_piece_from_cache(piece_idx)
                    if piece_data:
                        break

                if piece_data is None:
                    logger.error(f"[MEMORY_STREAM] Failed to read piece {piece_idx} from cache")
                    # Fall back to disk read if cache fails
                    piece_data = await self._read_piece_from_disk(piece_idx)
                    if piece_data is None:
                        return

            # Calculate offsets within the piece
            piece_start_abs = piece_idx * self.piece_length
            piece_end_abs = min(piece_start_abs + self.piece_length - 1,
                               self.file_offset + self.file_size - 1)

            # Calculate what part of this piece we need
            read_start = max(0, absolute_start - piece_start_abs)
            read_end = min(len(piece_data) - 1, absolute_end - piece_start_abs)

            if read_start <= read_end:
                chunk = piece_data[read_start:read_end + 1]
                position += len(chunk)
                yield chunk

    async def _read_piece_from_disk(self, piece_index: int) -> Optional[bytes]:
        """Fallback to read piece from disk if cache fails."""
        try:
            # Calculate file path and offset
            download_dir = Path(f"./backend/uploads/torrents/{self.handle.save_path()}")
            file_path = download_dir / self.file_entry.path

            if not file_path.exists():
                return None

            piece_start = piece_index * self.piece_length
            piece_size = min(self.piece_length,
                           self.file_offset + self.file_size - piece_start)

            # Read from disk
            with open(file_path, 'rb') as f:
                f.seek(piece_start - self.file_offset)
                return f.read(piece_size)

        except Exception as e:
            logger.error(f"[MEMORY_STREAM] Disk fallback failed for piece {piece_index}: {e}")
            return None

    def get_available_ranges(self) -> list[Tuple[int, int]]:
        """
        Get list of available byte ranges that can be streamed immediately.

        Returns:
            List of (start, end) tuples of available ranges within the file
        """
        ranges = []
        range_start = None

        for piece_idx in range(self.first_piece, self.last_piece + 1):
            if self.handle.have_piece(piece_idx):
                if range_start is None:
                    # Start new range
                    piece_start = max(0, piece_idx * self.piece_length - self.file_offset)
                    range_start = piece_start
            else:
                if range_start is not None:
                    # End current range
                    piece_end = min(self.file_size - 1,
                                  piece_idx * self.piece_length - self.file_offset - 1)
                    ranges.append((range_start, piece_end))
                    range_start = None

        # Close final range if needed
        if range_start is not None:
            ranges.append((range_start, self.file_size - 1))

        return ranges

    def estimate_buffered_seconds(self, bitrate: Optional[int] = None) -> float:
        """
        Estimate how many seconds of video are buffered from current position.

        Args:
            bitrate: Video bitrate in bytes/second (estimated if not provided)

        Returns:
            Estimated seconds of buffered content
        """
        if bitrate is None:
            # Estimate bitrate: assume 5 Mbps for HD video
            bitrate = 5 * 1024 * 1024 // 8

        available_ranges = self.get_available_ranges()
        if not available_ranges:
            return 0.0

        # Get total available bytes from start
        total_bytes = sum(end - start + 1 for start, end in available_ranges)

        return total_bytes / bitrate
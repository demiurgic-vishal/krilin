"""
Ultra-fast streaming that starts immediately without any buffering checks.
"""

import asyncio
import logging
from pathlib import Path
from typing import Optional, AsyncIterator
import time

from .libtorrent_shim import lt

logger = logging.getLogger(__name__)


class UltraFastStreamer:
    """Streams torrent data with zero startup delay."""

    def __init__(self, handle: lt.torrent_handle, file_index: int, user_id: int, info_hash: str):
        self.handle = handle
        self.file_index = file_index
        self.user_id = user_id
        self.info_hash = info_hash
        self.torrent_info = handle.torrent_file()

        if file_index >= self.torrent_info.num_files():
            raise ValueError(f"Invalid file index: {file_index}")

        self.file_entry = self.torrent_info.files().at(file_index)
        self.file_offset = self.file_entry.offset
        self.file_size = self.file_entry.size
        self.piece_length = self.torrent_info.piece_length()

        # File path
        self.download_dir = Path(f"./backend/uploads/torrents/{user_id}/{info_hash}")
        self.file_path = self.download_dir / self.file_entry.path

        # Calculate piece range
        self.first_piece = self.file_offset // self.piece_length
        self.last_piece = (self.file_offset + self.file_size - 1) // self.piece_length

        logger.info(f"[ULTRA_FAST] Initialized for {self.file_entry.path}")

    def prioritize_streaming(self, start_byte: int = 0):
        """Aggressively prioritize pieces for streaming."""
        absolute_start = self.file_offset + start_byte
        start_piece = absolute_start // self.piece_length

        # Priority levels:
        # 7 = immediate (first 10 pieces)
        # 6 = very high (next 20 pieces)
        # 5 = high (next 30 pieces)
        # 4 = normal (rest of file)

        for i, piece_idx in enumerate(range(start_piece, min(self.last_piece + 1, self.torrent_info.num_pieces()))):
            if i < 10:
                priority = 7
                deadline_ms = 0  # Immediate
            elif i < 30:
                priority = 6
                deadline_ms = 100 * i  # Staggered
            elif i < 60:
                priority = 5
                deadline_ms = 500 * i
            else:
                priority = 4
                deadline_ms = None

            self.handle.piece_priority(piece_idx, priority)

            if deadline_ms is not None:
                try:
                    self.handle.set_piece_deadline(piece_idx, deadline_ms, 0)
                except:
                    pass

        # Also set sequential download
        self.handle.set_sequential_download(True)

        logger.info(f"[ULTRA_FAST] Prioritized pieces from {start_piece}")

    async def stream_range(self, start: int, end: int) -> AsyncIterator[bytes]:
        """
        Stream a byte range with minimal latency.

        For seeks, ensures pieces are available at the seek position.
        """
        if start < 0 or start >= self.file_size:
            raise ValueError(f"Invalid start: {start}")

        end = min(end, self.file_size - 1)

        # Prioritize the range we're about to stream
        self.prioritize_streaming(start)

        # IMPORTANT: If this is a seek, wait for pieces at seek position
        if start > 1024 * 1024:  # Seeking past first 1MB
            logger.info(f"[ULTRA_FAST] Seek to byte {start} detected, ensuring pieces...")

            absolute_start = self.file_offset + start
            start_piece = absolute_start // self.piece_length

            # Need at least first 5 pieces at seek position for smooth playback
            seek_pieces_needed = []
            for i in range(start_piece, min(start_piece + 5, self.torrent_info.num_pieces())):
                if not self.handle.have_piece(i):
                    seek_pieces_needed.append(i)
                    # MAXIMUM priority for seek pieces
                    self.handle.piece_priority(i, 7)
                    try:
                        self.handle.set_piece_deadline(i, 0, 1)  # ALERT mode
                    except:
                        pass

            if seek_pieces_needed:
                logger.info(f"[ULTRA_FAST] Waiting for {len(seek_pieces_needed)} seek pieces: {seek_pieces_needed}")
                wait_start = time.time()
                max_wait = 20.0  # Wait up to 20 seconds

                while seek_pieces_needed and time.time() - wait_start < max_wait:
                    still_needed = []
                    for p in seek_pieces_needed:
                        if not self.handle.have_piece(p):
                            still_needed.append(p)
                            # Keep re-prioritizing
                            self.handle.piece_priority(p, 7)
                            try:
                                self.handle.set_piece_deadline(p, 0, 1)
                            except:
                                pass

                    seek_pieces_needed = still_needed
                    if seek_pieces_needed:
                        await asyncio.sleep(0.1)
                    else:
                        logger.info("[ULTRA_FAST] All seek pieces ready!")

                if seek_pieces_needed:
                    logger.error(f"[ULTRA_FAST] Critical seek pieces still missing: {seek_pieces_needed}")
                    # Continue anyway but warn about potential issues

        position = start
        chunks_sent = 0
        last_progress_log = time.time()

        # Create file if it doesn't exist (sparse file)
        if not self.file_path.exists():
            self.file_path.parent.mkdir(parents=True, exist_ok=True)
            # Create sparse file of correct size
            with open(self.file_path, 'wb') as f:
                f.seek(self.file_size - 1)
                f.write(b'\0')
            logger.info(f"[ULTRA_FAST] Created sparse file at {self.file_path}")

        # Open file for reading
        with open(self.file_path, 'rb') as f:
            while position <= end:
                # Calculate current piece
                absolute_pos = self.file_offset + position
                piece_idx = absolute_pos // self.piece_length

                # Calculate how much we can read from this piece
                piece_start = piece_idx * self.piece_length
                piece_end = min(piece_start + self.piece_length - 1,
                              self.file_offset + self.file_size - 1)

                # How much of this piece do we need?
                read_start = max(position, piece_start - self.file_offset)
                read_end = min(end, piece_end - self.file_offset)
                chunk_size = read_end - read_start + 1

                if chunk_size <= 0:
                    break

                # Check if piece is available
                if self.handle.have_piece(piece_idx):
                    # Read immediately
                    f.seek(position)
                    data = f.read(chunk_size)
                    if data:
                        position += len(data)
                        chunks_sent += 1
                        yield data

                        # Log progress periodically
                        if time.time() - last_progress_log > 2:
                            progress = ((position - start) / (end - start + 1)) * 100
                            logger.info(f"[ULTRA_FAST] Streaming progress: {progress:.1f}%")
                            last_progress_log = time.time()
                else:
                    # Piece not ready - determine if it's critical
                    is_critical = False

                    # First 10MB of file is critical (header)
                    if position < 10 * 1024 * 1024:
                        is_critical = True

                    # Last 10MB of file is critical (moov atom for MP4)
                    if position > self.file_size - 10 * 1024 * 1024:
                        is_critical = True

                    if is_critical:
                        # CRITICAL piece - MUST wait for it
                        logger.info(f"[ULTRA_FAST] Waiting for critical piece {piece_idx} at position {position}")

                        # Set maximum priority
                        self.handle.piece_priority(piece_idx, 7)
                        try:
                            self.handle.set_piece_deadline(piece_idx, 0, 1)
                        except:
                            pass

                        # Wait longer for critical pieces
                        wait_start = time.time()
                        max_wait = 30.0  # Wait up to 30 seconds for critical pieces

                        while time.time() - wait_start < max_wait:
                            if self.handle.have_piece(piece_idx):
                                break
                            await asyncio.sleep(0.1)

                        if self.handle.have_piece(piece_idx):
                            # Piece arrived, read it
                            f.seek(position)
                            data = f.read(chunk_size)
                            if data:
                                position += len(data)
                                yield data
                        else:
                            # Critical piece still missing - abort stream
                            logger.error(f"[ULTRA_FAST] Critical piece {piece_idx} not available after {max_wait}s wait")
                            raise Exception(f"Critical piece {piece_idx} not available")

                    else:
                        # Non-critical piece - wait briefly then skip if needed
                        wait_start = time.time()
                        max_wait = 2.0

                        while time.time() - wait_start < max_wait:
                            if self.handle.have_piece(piece_idx):
                                break
                            await asyncio.sleep(0.05)

                        if self.handle.have_piece(piece_idx):
                            # Piece arrived, read it
                            f.seek(position)
                            data = f.read(chunk_size)
                            if data:
                                position += len(data)
                                yield data
                        else:
                            # Non-critical - skip it (video might stutter but won't break)
                            logger.warning(f"[ULTRA_FAST] Skipping non-critical piece {piece_idx}")
                            position += chunk_size
                            # Don't send zeros - just skip

        logger.info(f"[ULTRA_FAST] Stream completed - sent {chunks_sent} chunks")

    def get_availability_percentage(self) -> float:
        """Get percentage of file that's available."""
        available_pieces = 0
        total_pieces = 0

        for piece_idx in range(self.first_piece, self.last_piece + 1):
            total_pieces += 1
            if self.handle.have_piece(piece_idx):
                available_pieces += 1

        return (available_pieces / total_pieces * 100) if total_pieces > 0 else 0
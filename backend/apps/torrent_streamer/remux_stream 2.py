"""
Real-time remuxing for MKV and other non-browser-compatible formats.

Uses FFmpeg to remux (not transcode) the video stream to MP4 format
that browsers can play. This is fast and uses minimal CPU since we're
just changing the container, not re-encoding the video.
"""

import asyncio
import logging
from pathlib import Path
from typing import AsyncIterator, Optional
import subprocess
import os
import signal

from .libtorrent_shim import lt

logger = logging.getLogger(__name__)


class RemuxStreamer:
    """Remuxes MKV/AVI files to MP4 on-the-fly for browser playback."""

    def __init__(self, handle: lt.torrent_handle, file_index: int, user_id: int, info_hash: str):
        self.handle = handle
        self.file_index = file_index
        self.user_id = user_id
        self.info_hash = info_hash
        self.torrent_info = handle.torrent_file()

        if file_index >= self.torrent_info.num_files():
            raise ValueError(f"Invalid file index: {file_index}")

        self.file_entry = self.torrent_info.files().at(file_index)
        self.file_size = self.file_entry.size
        self.file_offset = self.file_entry.offset
        self.piece_length = self.torrent_info.piece_length()

        # File path
        self.download_dir = Path(f"./backend/uploads/torrents/{user_id}/{info_hash}")
        self.file_path = self.download_dir / self.file_entry.path

        # Calculate piece range
        self.first_piece = self.file_offset // self.piece_length
        self.last_piece = (self.file_offset + self.file_size - 1) // self.piece_length

        logger.info(f"[REMUX] Initialized for {self.file_entry.path}")

    def ensure_pieces_ready(self, start_byte: int = 0, min_buffer_mb: int = 50) -> bool:
        """
        Ensure enough pieces are downloaded for smooth remuxing.

        Returns True if ready, False if more downloading needed.
        """
        # Calculate how many pieces we need buffered
        min_buffer_bytes = min_buffer_mb * 1024 * 1024
        absolute_start = self.file_offset + start_byte
        absolute_end = min(self.file_offset + start_byte + min_buffer_bytes,
                           self.file_offset + self.file_size - 1)

        start_piece = absolute_start // self.piece_length
        end_piece = absolute_end // self.piece_length

        # Check if pieces are available
        missing = []
        for p in range(start_piece, min(end_piece + 1, self.torrent_info.num_pieces())):
            if not self.handle.have_piece(p):
                missing.append(p)
                # Prioritize missing pieces
                self.handle.piece_priority(p, 7)
                try:
                    self.handle.set_piece_deadline(p, 0, 1)
                except:
                    pass

        if missing:
            logger.info(f"[REMUX] Waiting for {len(missing)} pieces: {missing[:10]}...")
            return False

        return True

    async def stream_remuxed(self, start: int = 0, end: Optional[int] = None) -> AsyncIterator[bytes]:
        """
        Stream the file remuxed to MP4 format using FFmpeg.

        This uses 'copy' codec to avoid transcoding - just changes container.
        """
        if end is None:
            end = self.file_size - 1

        # Ensure we have enough data buffered
        buffer_ready = await self.wait_for_buffer(start)
        if not buffer_ready:
            raise Exception("Failed to buffer enough data for remuxing")

        # Ensure file exists
        if not self.file_path.exists():
            raise Exception(f"File not found: {self.file_path}")

        # Check FFmpeg is available
        try:
            ffmpeg_check = await asyncio.create_subprocess_exec(
                'ffmpeg', '-version',
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            stdout, stderr = await ffmpeg_check.communicate()
            if ffmpeg_check.returncode != 0:
                logger.error(f"[REMUX] FFmpeg not working properly: {stderr.decode()}")
                raise Exception("FFmpeg is not working properly")
            logger.info(f"[REMUX] FFmpeg version: {stdout.decode().split('\\n')[0]}")
        except FileNotFoundError:
            logger.error("[REMUX] FFmpeg not found! Please install FFmpeg.")
            raise Exception("FFmpeg not installed. Please install FFmpeg to enable MKV/AVI playback.")

        # Build FFmpeg command for remuxing
        # -ss: seek to start position
        # -i: input file
        # -c:v copy: copy video codec (no re-encoding)
        # -c:a copy: copy audio codec (no re-encoding)
        # -movflags: optimize for streaming
        # -f mp4: output format
        # pipe:1: output to stdout

        seek_seconds = 0  # For now, start from beginning

        cmd = [
            'ffmpeg',
            '-hide_banner',
            '-loglevel', 'warning',  # Show warnings, not just errors
            '-i', str(self.file_path),
            '-c:v', 'copy',  # Copy video codec - no transcoding!
            '-c:a', 'copy',  # Copy audio codec - no transcoding!
            '-movflags', 'frag_keyframe+empty_moov+faststart',  # Optimize for streaming
            '-f', 'mp4',  # Output MP4 format
            'pipe:1'  # Output to stdout
        ]

        logger.info(f"[REMUX] Starting FFmpeg remux: {' '.join(cmd)}")
        logger.info(f"[REMUX] Input file: {self.file_path} (exists: {self.file_path.exists()}, size: {self.file_path.stat().st_size if self.file_path.exists() else 0})")

        # Start FFmpeg process
        process = await asyncio.create_subprocess_exec(
            *cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )

        try:
            # Stream the output
            chunk_size = 64 * 1024  # 64KB chunks
            total_sent = 0
            first_chunk = True
            error_output = []

            # Start reading stderr in background to capture errors
            async def read_stderr():
                while True:
                    line = await process.stderr.readline()
                    if not line:
                        break
                    error_output.append(line.decode())
                    logger.warning(f"[REMUX] FFmpeg: {line.decode().strip()}")

            stderr_task = asyncio.create_task(read_stderr())

            while True:
                try:
                    # Read chunk from FFmpeg output with timeout
                    chunk = await asyncio.wait_for(process.stdout.read(chunk_size), timeout=10.0)
                except asyncio.TimeoutError:
                    logger.error("[REMUX] FFmpeg output stalled for 10 seconds")
                    stderr_data = ''.join(error_output)
                    if stderr_data:
                        logger.error(f"[REMUX] FFmpeg errors so far: {stderr_data}")
                    break

                if not chunk:
                    break

                if first_chunk:
                    logger.info(f"[REMUX] First chunk received, size: {len(chunk)} bytes")
                    first_chunk = False

                total_sent += len(chunk)
                yield chunk

                # Log progress periodically
                if total_sent % (10 * 1024 * 1024) == 0:  # Every 10MB
                    logger.info(f"[REMUX] Streamed {total_sent / 1024 / 1024:.1f}MB")

            # Cancel stderr reader
            stderr_task.cancel()
            try:
                await stderr_task
            except asyncio.CancelledError:
                pass

            # Wait for process to complete
            await process.wait()

            if process.returncode != 0:
                stderr_data = ''.join(error_output)
                logger.error(f"[REMUX] FFmpeg failed with code {process.returncode}")
                if stderr_data:
                    logger.error(f"[REMUX] FFmpeg error output: {stderr_data}")
                raise Exception(f"FFmpeg failed: {stderr_data}")

            logger.info(f"[REMUX] Completed. Total sent: {total_sent / 1024 / 1024:.1f}MB")

        except asyncio.CancelledError:
            # Clean shutdown on cancel
            logger.info("[REMUX] Stream cancelled, terminating FFmpeg")
            process.terminate()
            await process.wait()
            raise

        except Exception as e:
            logger.error(f"[REMUX] Error during streaming: {e}")
            process.terminate()
            await process.wait()
            raise

    async def wait_for_buffer(self, start_byte: int, min_mb: int = 50, timeout: int = 30) -> bool:
        """
        Wait for enough pieces to be downloaded for smooth playback.
        """
        logger.info(f"[REMUX] Waiting for {min_mb}MB buffer at position {start_byte}")

        for _ in range(timeout):
            if self.ensure_pieces_ready(start_byte, min_mb):
                logger.info("[REMUX] Buffer ready!")
                return True
            await asyncio.sleep(1)

        logger.error(f"[REMUX] Buffer not ready after {timeout}s")
        return False

    def get_remuxed_size_estimate(self) -> int:
        """
        Estimate the size of the remuxed file.
        Usually very close to original for MKV->MP4 remux.
        """
        # Add 5% overhead for MP4 container (conservative estimate)
        return int(self.file_size * 1.05)
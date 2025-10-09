"""
Real-time remuxing for MKV and other non-browser-compatible formats.

Uses FFmpeg to remux the video stream to MP4 format that browsers can play.
Video is copied without re-encoding (fast), but audio is converted to AAC
for better browser compatibility with formats like EAC3/DTS.
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

    def calculate_adaptive_buffer_mb(self) -> int:
        """
        Calculate optimal buffer size based on download speed and file size.

        Strategy:
        - Fast downloads: smaller buffer (less waiting)
        - Slow downloads: larger buffer (more safety margin)
        - Small files: cap at percentage of file size
        - Large files: cap at absolute maximum

        Returns buffer size in MB.
        """
        status = self.handle.status()
        download_rate = status.download_rate  # bytes/sec

        # Constants
        MIN_BUFFER_MB = 50  # Absolute minimum
        MAX_BUFFER_MB = 300  # Absolute maximum
        TARGET_BUFFER_TIME_SEC = 30  # Want 90 seconds of buffer
        MAX_FILE_PERCENTAGE = 0.15  # Max 15% of file size

        # Calculate speed-based buffer (90 seconds worth of download)
        if download_rate > 0:
            speed_based_buffer_bytes = download_rate * TARGET_BUFFER_TIME_SEC
            speed_based_buffer_mb = speed_based_buffer_bytes / (1024 * 1024)
        else:
            # No download speed data, use conservative default
            speed_based_buffer_mb = 150

        # Calculate file-size-based cap (max 15% of file)
        file_size_mb = self.file_size / (1024 * 1024)
        file_based_cap_mb = file_size_mb * MAX_FILE_PERCENTAGE

        # Apply all constraints
        adaptive_buffer = max(
            MIN_BUFFER_MB,  # Never less than minimum
            min(
                speed_based_buffer_mb,  # Ideal based on speed
                file_based_cap_mb,  # Don't exceed file percentage
                MAX_BUFFER_MB  # Never more than maximum
            )
        )

        logger.info(
            f"[REMUX] Adaptive buffer calculation: "
            f"download_rate={download_rate/1024/1024:.2f}MB/s, "
            f"file_size={file_size_mb:.0f}MB, "
            f"speed_based={speed_based_buffer_mb:.0f}MB, "
            f"file_cap={file_based_cap_mb:.0f}MB, "
            f"chosen={int(adaptive_buffer)}MB"
        )

        return int(adaptive_buffer)

    def check_piece_availability_in_swarm(self) -> tuple[bool, float, float]:
        """
        Check if ALL pieces of the file are available (downloaded or in swarm).
        Returns (all_available, percentage_downloaded, percentage_available_in_swarm)
        """
        total_pieces = self.last_piece - self.first_piece + 1
        downloaded_pieces = 0
        available_in_swarm_pieces = 0

        # Get piece availability from peers
        status = self.handle.status()

        # Check if file is complete
        if status.is_seeding or status.progress >= 1.0:
            logger.info(f"[REMUX] File is complete (100% downloaded), all pieces available")
            return True, 100.0, 100.0

        # Get availability from the swarm
        avail = self.handle.piece_availability()  # List showing how many peers have each piece

        for p in range(self.first_piece, self.last_piece + 1):
            # Check if we have the piece downloaded
            if self.handle.have_piece(p):
                downloaded_pieces += 1
                available_in_swarm_pieces += 1  # If we have it, it's available
            # Check if piece is available from at least one peer in swarm
            elif p < len(avail) and avail[p] > 0:
                available_in_swarm_pieces += 1

        percentage_downloaded = (downloaded_pieces / total_pieces) * 100 if total_pieces > 0 else 0
        percentage_available = (available_in_swarm_pieces / total_pieces) * 100 if total_pieces > 0 else 0
        all_available = available_in_swarm_pieces == total_pieces

        logger.info(f"[REMUX] Piece availability - Downloaded: {downloaded_pieces}/{total_pieces} ({percentage_downloaded:.1f}%), "
                    f"Available in swarm: {available_in_swarm_pieces}/{total_pieces} ({percentage_available:.1f}%)")

        return all_available, percentage_downloaded, percentage_available

    def ensure_pieces_ready(self, start_byte: int = 0, min_buffer_mb: int = 200) -> bool:
        """
        Ensure enough CONTIGUOUS pieces are downloaded for smooth remuxing.
        FFmpeg needs contiguous data - it can't handle sparse files with holes.
        Default 200MB buffer for smooth playback.

        Returns True if ready, False if more downloading needed.
        """
        # Calculate how many pieces we need buffered
        min_buffer_bytes = min_buffer_mb * 1024 * 1024
        absolute_start = self.file_offset + start_byte
        absolute_end = min(self.file_offset + start_byte + min_buffer_bytes,
                           self.file_offset + self.file_size - 1)

        start_piece = absolute_start // self.piece_length
        end_piece = absolute_end // self.piece_length

        # Check if pieces are available CONTIGUOUSLY from start
        missing = []
        contiguous_bytes = 0

        for p in range(start_piece, min(end_piece + 1, self.torrent_info.num_pieces())):
            if not self.handle.have_piece(p):
                missing.append(p)
                # MAXIMUM PRIORITY for the blocking piece
                self.handle.piece_priority(p, 7)
                try:
                    self.handle.set_piece_deadline(p, 0, 1)  # Alert mode - immediate download
                    # If this is the first missing piece, force reannounce to get more peers
                    if len(missing) == 1:
                        self.handle.force_reannounce()
                        self.handle.force_dht_announce()
                        logger.info(f"[REMUX] Forced reannounce for critical piece {p}")
                except Exception as e:
                    logger.warning(f"[REMUX] Could not set deadline for piece {p}: {e}")
                # Stop counting contiguous bytes when we hit a missing piece
                break
            else:
                # Count how many contiguous bytes we have
                piece_start_abs = p * self.piece_length
                piece_end_abs = min((p + 1) * self.piece_length, self.file_offset + self.file_size)

                # Adjust for file boundaries
                if p == start_piece:
                    piece_start_abs = max(piece_start_abs, absolute_start)
                if p == end_piece:
                    piece_end_abs = min(piece_end_abs, absolute_end + 1)

                contiguous_bytes += piece_end_abs - piece_start_abs

        contiguous_mb = contiguous_bytes / (1024 * 1024)

        if missing:
            logger.info(f"[REMUX] Have {contiguous_mb:.1f}MB contiguous, need {min_buffer_mb}MB. Missing {len(missing)} pieces: {missing[:10]}...")
            return False

        logger.info(f"[REMUX] Have {contiguous_mb:.1f}MB contiguous data ready")
        return True

    def get_contiguous_bytes_available(self) -> int:
        """
        Calculate how many contiguous bytes are available from the start of the file.
        Also prioritizes the first missing piece to unblock the download.
        """
        contiguous_bytes = 0
        position = 0

        while position < self.file_size:
            absolute_pos = self.file_offset + position
            piece_idx = absolute_pos // self.piece_length

            if not self.handle.have_piece(piece_idx):
                # CRITICAL: Immediately prioritize the blocking piece with maximum priority
                self.handle.piece_priority(piece_idx, 7)  # Maximum priority
                try:
                    self.handle.set_piece_deadline(piece_idx, 0, 1)  # Immediate download with alert
                    # Also prioritize the next few pieces to keep the download flowing
                    for next_idx in range(piece_idx + 1, min(piece_idx + 10, self.last_piece + 1)):
                        self.handle.piece_priority(next_idx, 6)
                        self.handle.set_piece_deadline(next_idx, 100, 0)  # 100ms deadline
                    logger.info(f"[REMUX] Prioritized blocking piece {piece_idx} and next 10 pieces")
                except Exception as e:
                    logger.warning(f"[REMUX] Could not set deadline for piece {piece_idx}: {e}")
                break

            # Calculate bytes in this piece
            piece_start = piece_idx * self.piece_length
            piece_end = min((piece_idx + 1) * self.piece_length, self.file_offset + self.file_size)

            # Adjust for file boundaries
            if piece_idx == self.first_piece:
                piece_start = self.file_offset
            if piece_idx == self.last_piece:
                piece_end = self.file_offset + self.file_size

            bytes_in_piece = piece_end - piece_start
            contiguous_bytes += bytes_in_piece
            position += bytes_in_piece

        return contiguous_bytes

    async def stream_remuxed(self, start: int = 0, end: Optional[int] = None) -> AsyncIterator[bytes]:
        """
        Stream the file remuxed to MP4 format using FFmpeg.

        This uses 'copy' codec to avoid transcoding - just changes container.
        """
        if end is None:
            end = self.file_size - 1

        # Check if file is complete
        status = self.handle.status()
        is_complete = status.is_seeding or status.progress >= 1.0

        if is_complete:
            logger.info(f"[REMUX] File is 100% complete, skipping buffer wait")
        else:
            # Calculate adaptive buffer size and ensure we have enough data buffered
            adaptive_buffer_mb = self.calculate_adaptive_buffer_mb()
            buffer_ready = await self.wait_for_buffer(start, min_mb=adaptive_buffer_mb)
            if not buffer_ready:
                raise Exception("Failed to buffer enough data for remuxing")

        # Ensure file exists (create sparse file if needed)
        if not self.file_path.exists():
            logger.info(f"[REMUX] File doesn't exist, creating sparse file: {self.file_path}")
            self.file_path.parent.mkdir(parents=True, exist_ok=True)
            # Create sparse file of correct size
            with open(self.file_path, 'wb') as f:
                f.seek(self.file_size - 1)
                f.write(b'\0')
            logger.info(f"[REMUX] Created sparse file of size {self.file_size}")

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
            ffmpeg_version = stdout.decode().split('\n')[0]
            logger.info(f"[REMUX] FFmpeg version: {ffmpeg_version}")
        except FileNotFoundError:
            logger.error("[REMUX] FFmpeg not found! Please install FFmpeg.")
            raise Exception("FFmpeg not installed. Please install FFmpeg to enable MKV/AVI playback.")

        # Build FFmpeg command for remuxing
        # Calculate how much contiguous data we have
        contiguous_bytes = self.get_contiguous_bytes_available()
        contiguous_mb = contiguous_bytes / (1024 * 1024)
        logger.info(f"[REMUX] Have {contiguous_mb:.1f}MB contiguous data available for streaming")

        # Build FFmpeg command
        cmd = [
            'ffmpeg',
            '-hide_banner',
            '-loglevel', 'warning',  # Show warnings, not just errors
            '-analyzeduration', '10M',  # Analyze more data for codec parameters
            '-probesize', '10M',  # Increase probe size for better codec detection
            '-err_detect', 'ignore_err',  # Ignore errors in input
            '-fflags', '+genpts+igndts',  # Generate timestamps, ignore DTS errors
            '-i', str(self.file_path),
            '-map', '0:v:0?',  # Map first video stream (optional)
            '-map', '0:a:0?',  # Map first audio stream (optional)
            '-c:v', 'copy',  # Copy video codec - no transcoding!
            '-c:a', 'aac',  # Convert audio to AAC for better browser compatibility
            '-b:a', '192k',  # Audio bitrate
            '-movflags', '+faststart+frag_keyframe+empty_moov',  # Optimize for streaming
            '-f', 'mp4',  # Output MP4 format
            '-max_muxing_queue_size', '9999',  # Increase muxing queue size
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
                hole_detected = False
                while True:
                    line = await process.stderr.readline()
                    if not line:
                        break
                    line_str = line.decode().strip()
                    error_output.append(line.decode())

                    # Check for signs that FFmpeg hit a hole in the sparse file
                    if "0x00 at pos" in line_str and "invalid as first byte" in line_str:
                        if not hole_detected:
                            logger.info(f"[REMUX] FFmpeg hit a hole in sparse file, this is expected")
                            hole_detected = True
                    elif "corrupt decoded frame" in line_str or "Error submitting packet" in line_str:
                        if not hole_detected:
                            logger.info(f"[REMUX] FFmpeg hit missing pieces, will stop when buffer exhausted")
                            hole_detected = True
                    else:
                        logger.warning(f"[REMUX] FFmpeg: {line_str}")

            stderr_task = asyncio.create_task(read_stderr())

            # Background task to prioritize pieces ahead of playback
            async def prioritize_ahead():
                """Intelligently prioritize pieces ahead of current streaming position."""
                nonlocal total_sent
                bytes_sent_last = 0
                iteration = 0
                while True:
                    await asyncio.sleep(1)  # Check every second
                    iteration += 1

                    # Calculate which piece we're likely streaming from based on bytes sent
                    current_byte_position = start + total_sent
                    current_piece = (self.file_offset + current_byte_position) // self.piece_length

                    # Prioritize pieces immediately ahead: from current to +200 pieces (400MB buffer)
                    # This ensures smooth streaming by always having upcoming data ready
                    ahead_start = current_piece + 1
                    ahead_end = min(current_piece + 200, self.last_piece + 1)

                    pieces_prioritized = 0
                    # Set high priority for upcoming pieces with graduated priorities
                    for p in range(ahead_start, ahead_end):
                        if p <= self.last_piece:
                            try:
                                # Higher priority for pieces closer to playback position
                                if p < current_piece + 50:
                                    # Next 100MB - highest priority
                                    self.handle.piece_priority(p, 7)
                                    self.handle.set_piece_deadline(p, 500, 0)  # 500ms deadline
                                elif p < current_piece + 100:
                                    # Next 100-200MB - high priority
                                    self.handle.piece_priority(p, 6)
                                    self.handle.set_piece_deadline(p, 2000, 0)  # 2s deadline
                                else:
                                    # Next 200-400MB - medium priority
                                    self.handle.piece_priority(p, 5)
                                pieces_prioritized += 1
                            except:
                                pass

                    # Log every 5 iterations
                    if iteration % 5 == 0:
                        logger.info(f"[REMUX] Dynamic priority: current piece={current_piece}, prioritized {pieces_prioritized} pieces ahead (pieces {ahead_start}-{ahead_end}), streamed {total_sent / 1024 / 1024:.1f}MB")

                    # Check if streaming has stalled
                    if total_sent == bytes_sent_last and total_sent > 0:
                        logger.info(f"[REMUX] Streaming stalled, stopping prioritization task")
                        break
                    bytes_sent_last = total_sent

            priority_task = asyncio.create_task(prioritize_ahead())

            while True:
                try:
                    # Read chunk from FFmpeg output with shorter timeout
                    chunk = await asyncio.wait_for(process.stdout.read(chunk_size), timeout=2.0)
                except asyncio.TimeoutError:
                    # Check if we've sent enough data already
                    if total_sent > 1 * 1024 * 1024:  # If we've sent at least 1MB
                        logger.info(f"[REMUX] FFmpeg output stalled (likely hit sparse hole), completing stream gracefully after {total_sent / 1024 / 1024:.1f}MB")
                        break
                    else:
                        logger.error(f"[REMUX] FFmpeg output stalled too early, only sent {total_sent} bytes")
                        stderr_data = ''.join(error_output)
                        if stderr_data:
                            logger.error(f"[REMUX] FFmpeg errors: {stderr_data[:500]}")
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

            # Cancel background tasks
            priority_task.cancel()
            stderr_task.cancel()
            try:
                await priority_task
            except asyncio.CancelledError:
                pass
            try:
                await stderr_task
            except asyncio.CancelledError:
                pass

            # Terminate FFmpeg process if still running
            if process.returncode is None:
                logger.info("[REMUX] Terminating FFmpeg process")
                process.terminate()
                try:
                    await asyncio.wait_for(process.wait(), timeout=5.0)
                except asyncio.TimeoutError:
                    logger.warning("[REMUX] FFmpeg didn't terminate, killing it")
                    process.kill()
                    await process.wait()

            # Don't treat non-zero return code as error if we got data
            if process.returncode != 0 and total_sent > 1024 * 1024:  # Got at least 1MB
                logger.info(f"[REMUX] FFmpeg exited with code {process.returncode} but streamed {total_sent / 1024 / 1024:.1f}MB successfully")
            elif process.returncode != 0:
                stderr_data = ''.join(error_output)
                logger.error(f"[REMUX] FFmpeg failed with code {process.returncode}")
                if stderr_data:
                    logger.error(f"[REMUX] FFmpeg error output: {stderr_data}")
                raise Exception(f"FFmpeg failed: {stderr_data}")

            logger.info(f"[REMUX] Completed. Total sent: {total_sent / 1024 / 1024:.1f}MB")

        except asyncio.CancelledError:
            # Clean shutdown on cancel
            logger.info("[REMUX] Stream cancelled, terminating FFmpeg")
            priority_task.cancel()
            stderr_task.cancel()
            process.terminate()
            await process.wait()
            raise

        except Exception as e:
            logger.error(f"[REMUX] Error during streaming: {e}")
            priority_task.cancel()
            stderr_task.cancel()
            process.terminate()
            await process.wait()
            raise

    async def wait_for_buffer(self, start_byte: int, min_mb: int = 200, timeout: int = 180) -> bool:
        """
        Wait for enough CONTIGUOUS pieces for FFmpeg to start.
        FFmpeg needs contiguous data to avoid hitting sparse holes.
        Using 200MB minimum to give enough buffer for smooth playback.
        """
        logger.info(f"[REMUX] Waiting for {min_mb}MB contiguous buffer at position {start_byte}")

        for i in range(timeout):
            if self.ensure_pieces_ready(start_byte, min_mb):
                logger.info(f"[REMUX] Buffer ready after {i}s!")
                return True
            await asyncio.sleep(1)

            # Log progress every 5 seconds
            if i > 0 and i % 5 == 0:
                logger.info(f"[REMUX] Still waiting for buffer... ({i}/{timeout}s)")

        logger.error(f"[REMUX] Buffer not ready after {timeout}s")
        return False

    def get_remuxed_size_estimate(self) -> int:
        """
        Estimate the size of the remuxed file.
        Usually very close to original for MKV->MP4 remux.
        """
        # Add 5% overhead for MP4 container (conservative estimate)
        return int(self.file_size * 1.05)
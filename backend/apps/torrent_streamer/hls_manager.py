import os
import subprocess
import threading
import time
import logging
from pathlib import Path
from typing import Dict, Tuple, Optional

logger = logging.getLogger(__name__)


class HLSJob:
    def __init__(self, proc: subprocess.Popen, output_dir: Path):
        self.proc = proc
        self.output_dir = output_dir
        self.started_at = time.time()
        self.last_access = time.time()

    def touch(self):
        self.last_access = time.time()


class HLSManager:
    def __init__(self):
        self._jobs: Dict[Tuple[int, str, int], HLSJob] = {}
        self._lock = threading.Lock()

    def _output_dir(self, user_id: int, info_hash: str, file_index: int) -> Path:
        out = Path(f"./backend/uploads/hls/{user_id}/{info_hash}/{file_index}")
        out.mkdir(parents=True, exist_ok=True)
        return out

    def _is_running(self, key: Tuple[int, str, int]) -> bool:
        job = self._jobs.get(key)
        if not job:
            return False
        if job.proc.poll() is not None:
            return False
        return True

    def ensure_hls(self, user_id: int, info_hash: str, file_index: int, input_file: Path) -> Path:
        key = (user_id, info_hash, file_index)
        with self._lock:
            out_dir = self._output_dir(user_id, info_hash, file_index)
            master_pl = out_dir / "master.m3u8"
            media_pl = out_dir / "media.m3u8"
            init_seg = out_dir / "init.mp4"

            if self._is_running(key):
                self._jobs[key].touch()
                return out_dir

            # Clean any stale files
            try:
                for f in out_dir.glob("*"):
                    try:
                        f.unlink()
                    except Exception:
                        pass
            except Exception:
                pass

            # Spawn ffmpeg to remux as LL-HLS fMP4 (codec copy when possible)
            # Removed -re flag for faster processing (was causing slow segment generation)
            # Increased segment time to 6s for better scrubbing performance
            cmd = [
                "ffmpeg",
                "-hide_banner",
                "-nostdin",
                "-loglevel", "error",
                "-y",
                "-i", str(input_file),
                "-map", "0:v:0?",
                "-map", "0:a:0?",
                "-c", "copy",
                "-start_at_zero",
                "-hls_time", "6",  # Increased from 2s to 6s for fewer segments
                "-hls_playlist_type", "event",
                "-hls_flags", "independent_segments+omit_endlist+split_by_time",
                "-hls_segment_type", "fmp4",
                "-master_pl_name", "master.m3u8",
                "-hls_segment_filename", str(out_dir / "seg_%05d.m4s"),
                "-init_seg_name", "init.mp4",
                "-threads", "0",  # Use all available CPU threads
                "-preset", "ultrafast",  # Fastest encoding preset
                str(out_dir / "media.m3u8"),
            ]

            logger.info(f"[HLS] Spawning ffmpeg: {' '.join(cmd)}")
            proc = subprocess.Popen(cmd, cwd=str(out_dir))
            self._jobs[key] = HLSJob(proc=proc, output_dir=out_dir)
            return out_dir

    def get_output_dir(self, user_id: int, info_hash: str, file_index: int) -> Optional[Path]:
        job = self._jobs.get((user_id, info_hash, file_index))
        if job:
            job.touch()
            return job.output_dir
        # May exist from prior run
        out = Path(f"./backend/uploads/hls/{user_id}/{info_hash}/{file_index}")
        if out.exists():
            return out
        return None


_hls_manager: Optional[HLSManager] = None


def get_hls_manager() -> HLSManager:
    global _hls_manager
    if _hls_manager is None:
        _hls_manager = HLSManager()
    return _hls_manager



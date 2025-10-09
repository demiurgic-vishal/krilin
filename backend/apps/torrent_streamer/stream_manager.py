from __future__ import annotations

import asyncio
from dataclasses import dataclass
from typing import Dict, Tuple

from .libtorrent_shim import lt


@dataclass
class FileStreamState:
    info_hash: str
    file_index: int
    # last known playback offset in bytes (relative to file start)
    playback_offset: int = 0


class StreamSessionManager:
    def __init__(self):
        self._sessions: Dict[Tuple[str, int], FileStreamState] = {}

    def get_or_create(self, info_hash: str, file_index: int) -> FileStreamState:
        key = (info_hash, file_index)
        if key not in self._sessions:
            self._sessions[key] = FileStreamState(info_hash=info_hash, file_index=file_index)
        return self._sessions[key]

    def update_playback_offset(self, info_hash: str, file_index: int, offset: int):
        state = self.get_or_create(info_hash, file_index)
        state.playback_offset = max(0, offset)

    @staticmethod
    def compute_contiguous_available_bytes(handle: lt.torrent_handle, file_index: int) -> int:
        ti = handle.torrent_file()
        fe = ti.files().at(file_index)
        file_offset = fe.offset
        piece_length = ti.piece_length()
        first_piece = file_offset // piece_length
        last_available_piece = first_piece - 1

        for piece_idx in range(first_piece, ti.num_pieces()):
            if handle.have_piece(piece_idx):
                last_available_piece = piece_idx
            else:
                break

        if last_available_piece < first_piece:
            return 0

        abs_end = min(file_offset + fe.size - 1, (last_available_piece + 1) * piece_length - 1)
        return max(0, abs_end - file_offset + 1)


_manager: StreamSessionManager | None = None


def get_stream_session_manager() -> StreamSessionManager:
    global _manager
    if _manager is None:
        _manager = StreamSessionManager()
    return _manager



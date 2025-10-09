"""
Libtorrent import shim.

Tries multiple module names and provides a clear error if missing.
"""

from typing import Any

_lt: Any | None = None

try:
    import libtorrent as _lt  # type: ignore
except Exception:
    try:
        import lbry_libtorrent as _lt  # type: ignore
    except Exception:
        _lt = None


if _lt is None:
    raise ImportError(
        "libtorrent Python module not found. Install a compatible wheel via Poetry (e.g. libtorrent==2.0.9) or an OS package."
    )

# Re-export as lt for callers
lt = _lt



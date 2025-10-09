"""
Torrent Streamer App - Backend Logic

Hybrid approach:
- Frontend: WebTorrent P2P (browser-to-browser)
- Backend: libtorrent proxy (for desktop seeders)
"""
from typing import Dict, Any, List
from datetime import datetime
import logging
from .libtorrent_shim import lt
import os
import base64
import asyncio
import httpx
from pathlib import Path

from app.core.platform_context import PlatformContext

logger = logging.getLogger(__name__)

# Global libtorrent session (shared across all users)
_lt_session = None
_active_torrents = {}  # {info_hash: torrent_handle}

def get_lt_session():
    """Get or create libtorrent session."""
    global _lt_session
    if _lt_session is None:
        _lt_session = lt.session({'listen_interfaces': '0.0.0.0:6881'})
        logger.info("[TORRENT PROXY] libtorrent session created")
    return _lt_session


async def save_torrent_info(
    ctx: PlatformContext,
    name: str,
    info_hash: str,
    file_count: int,
    total_size: str
) -> Dict[str, Any]:
    """
    Save uploaded torrent metadata to database.

    Args:
        ctx: Platform context
        name: Torrent name
        info_hash: Torrent info hash
        file_count: Number of files in torrent
        total_size: Total size of torrent

    Returns:
        Created torrent record
    """
    try:
        torrent = await ctx.storage.insert("uploaded_torrents", {
            "name": name,
            "info_hash": info_hash,
            "file_count": file_count,
            "total_size": total_size,
            "uploaded_at": ctx.now().isoformat()
        })

        logger.info(f"[TORRENT STREAMER] Saved torrent: {name} ({info_hash})")

        # Send notification
        await ctx.notifications.send({
            "title": "Torrent Added",
            "message": f"'{name}' added to your library",
            "type": "success"
        })

        return torrent

    except Exception as e:
        logger.error(f"[TORRENT STREAMER] Save torrent error: {str(e)}")
        raise ValueError(f"Failed to save torrent: {str(e)}")


async def get_uploaded_torrents(
    ctx: PlatformContext,
    limit: int = 20
) -> List[Dict[str, Any]]:
    """
    Get user's uploaded torrent history.

    Args:
        ctx: Platform context
        limit: Number of recent uploads to return

    Returns:
        List of torrent records
    """
    try:
        torrents = await ctx.storage.query(
            "uploaded_torrents",
            order_by={"uploaded_at": "desc"},
            limit=limit
        )

        return torrents

    except Exception as e:
        logger.error(f"[TORRENT STREAMER] Get torrents error: {str(e)}")
        return []


async def delete_torrent(
    ctx: PlatformContext,
    torrent_id: str
) -> Dict[str, Any]:
    """
    Delete a torrent from history.

    Args:
        ctx: Platform context
        torrent_id: Torrent ID to delete

    Returns:
        Success response
    """
    try:
        # Verify torrent exists
        torrent = await ctx.storage.find_one("uploaded_torrents", {"id": torrent_id})

        if not torrent:
            raise ValueError(f"Torrent {torrent_id} not found")

        await ctx.storage.delete("uploaded_torrents", torrent_id)

        logger.info(f"[TORRENT STREAMER] Deleted torrent: {torrent_id}")

        return {
            "success": True,
            "message": "Torrent deleted"
        }

    except Exception as e:
        logger.error(f"[TORRENT STREAMER] Delete torrent error: {str(e)}")
        raise ValueError(f"Failed to delete torrent: {str(e)}")


async def start_backend_download(
    ctx: PlatformContext,
    torrent_data: str
) -> Dict[str, Any]:
    """
    Start downloading a torrent via backend (libtorrent).

    Args:
        ctx: Platform context
        torrent_data: Base64 encoded torrent file data

    Returns:
        Download status with info_hash and metadata
    """
    try:
        ses = get_lt_session()

        # Decode torrent data
        torrent_bytes = base64.b64decode(torrent_data)

        # Parse torrent to get info_hash and metadata
        torrent_info = lt.torrent_info(torrent_bytes)
        info_hash = str(torrent_info.info_hash())
        torrent_name = torrent_info.name()
        file_count = torrent_info.num_files()
        total_size = torrent_info.total_size()

        # Create download directory
        download_dir = Path(f"./backend/uploads/torrents/{ctx.user_id}/{info_hash}")
        download_dir.mkdir(parents=True, exist_ok=True)

        # Add torrent
        atp = lt.add_torrent_params()
        atp.ti = torrent_info
        atp.save_path = str(download_dir)

        # Use allocate mode - pre-allocates full file size on disk
        # This is required for HTTP range requests to work properly
        # The file will be the correct size immediately, and pieces are written as downloaded
        atp.storage_mode = lt.storage_mode_t.storage_mode_allocate

        handle = ses.add_torrent(atp)
        _active_torrents[info_hash] = handle

        # Enable sequential download immediately for streaming
        handle.set_sequential_download(True)

        # SMART: Prioritize all playable video files (including remuxable formats)
        # These formats can be played directly in HTML5 video element
        direct_play_extensions = ['.mp4', '.webm', '.ogg', '.mov', '.m4v']
        # These formats can be remuxed on-the-fly to MP4
        remuxable_extensions = ['.mkv', '.avi']
        # Combine both for prioritization
        playable_extensions = direct_play_extensions + remuxable_extensions
        # These formats are not supported even with remuxing
        non_playable_video = ['.flv', '.wmv']

        piece_length = torrent_info.piece_length()

        for i in range(torrent_info.num_files()):
            file_entry = torrent_info.files().at(i)
            file_name = file_entry.path.lower()

            # Only auto-prioritize if it's a PLAYABLE video file
            if any(file_name.endswith(ext) for ext in playable_extensions):
                file_offset = file_entry.offset
                file_size = file_entry.size
                first_piece = file_offset // piece_length
                last_piece = (file_offset + file_size - 1) // piece_length

                # Prioritize first 2MB and last 5MB of EACH video file
                # First 2MB (header)
                header_bytes = min(file_size, 2 * 1024 * 1024)
                header_end_piece = (file_offset + header_bytes - 1) // piece_length
                for p in range(first_piece, min(header_end_piece + 1, torrent_info.num_pieces())):
                    handle.piece_priority(p, 7)
                    try:
                        handle.set_piece_deadline(p, 0, 1)  # IMMEDIATE with alert
                    except:
                        pass

                # Last 5MB (moov atom for MP4)
                if file_size > 10 * 1024 * 1024:
                    tail_bytes = min(file_size, 5 * 1024 * 1024)
                    tail_start = (file_offset + file_size - tail_bytes) // piece_length
                    for p in range(tail_start, last_piece + 1):
                        handle.piece_priority(p, 7)
                        try:
                            handle.set_piece_deadline(p, 0, 1)  # IMMEDIATE
                        except:
                            pass

                logger.info(f"[TORRENT] Pre-prioritized PLAYABLE video {i}: {file_entry.path} (pieces {first_piece}-{header_end_piece} + tail)")
            elif any(file_name.endswith(ext) for ext in non_playable_video):
                logger.info(f"[TORRENT] Skipping non-playable video {i}: {file_entry.path} (requires transcoding)")

        # Force announce to get peers immediately
        try:
            handle.force_reannounce()
            handle.force_dht_announce()
        except:
            pass

        logger.info(f"[TORRENT PROXY] Started download with video pre-prioritization: {torrent_name} ({info_hash})")

        return {
            "success": True,
            "info_hash": info_hash,
            "name": torrent_name,
            "file_count": file_count,
            "total_size": total_size,
            "status": "downloading",
            "message": "Backend download started"
        }

    except Exception as e:
        logger.error(f"[TORRENT PROXY] Start download error: {str(e)}")
        raise ValueError(f"Failed to start download: {str(e)}")


async def get_download_status(
    ctx: PlatformContext,
    info_hash: str
) -> Dict[str, Any]:
    """
    Get download status for a torrent.

    Args:
        ctx: Platform context
        info_hash: Torrent info hash

    Returns:
        Download status and progress
    """
    try:
        if info_hash not in _active_torrents:
            return {
                "success": False,
                "error": "Torrent not found in active downloads"
            }

        handle = _active_torrents[info_hash]
        status = handle.status()

        return {
            "success": True,
            "info_hash": info_hash,
            "progress": status.progress * 100,
            "download_rate": status.download_rate,
            "upload_rate": status.upload_rate,
            "num_peers": status.num_peers,
            "num_seeds": status.num_seeds,
            "state": str(status.state),
            "total_download": status.total_download,
            "total_upload": status.total_upload
        }

    except Exception as e:
        logger.error(f"[TORRENT PROXY] Get status error: {str(e)}")
        return {
            "success": False,
            "error": str(e)
        }


async def list_torrent_files(
    ctx: PlatformContext,
    info_hash: str
) -> List[Dict[str, Any]]:
    """
    List files in a torrent.

    Args:
        ctx: Platform context
        info_hash: Torrent info hash

    Returns:
        List of files
    """
    try:
        if info_hash not in _active_torrents:
            # Attempt to rehydrate torrent from info_hash using a minimal magnet link
            logger.info(f"[TORRENT PROXY] Torrent {info_hash} not active; attempting re-add via magnet")
            ses = get_lt_session()
            # Create download directory first
            download_dir = Path(f"./backend/uploads/torrents/{ctx.user_id}/{info_hash}")
            download_dir.mkdir(parents=True, exist_ok=True)
            try:
                atp = lt.parse_magnet_uri(f"magnet:?xt=urn:btih:{info_hash}")
                atp.save_path = str(download_dir)
                atp.storage_mode = lt.storage_mode_t.storage_mode_allocate
                handle = ses.add_torrent(atp)
                handle.set_sequential_download(True)
                _active_torrents[info_hash] = handle
                # Wait briefly for metadata
                for _ in range(50):
                    if handle.has_metadata():
                        break
                    await asyncio.sleep(0.1)
            except Exception as e:
                logger.error(f"[TORRENT PROXY] Re-add via magnet failed: {e}")
                raise ValueError("Torrent not found")

        handle = _active_torrents[info_hash]
        torrent_info = handle.torrent_file()

        # When listing files, prioritize all playable formats (including remuxable)
        playable_extensions = ['.mp4', '.webm', '.ogg', '.mov', '.m4v', '.mkv', '.avi']
        piece_length = torrent_info.piece_length()

        files = []
        for i in range(torrent_info.num_files()):
            file_entry = torrent_info.files().at(i)
            file_name = file_entry.path.lower()

            # Only prioritize if it's a PLAYABLE video file
            if any(file_name.endswith(ext) for ext in playable_extensions):
                file_offset = file_entry.offset
                file_size = file_entry.size
                first_piece = file_offset // piece_length

                # Prioritize at least first 5MB
                header_bytes = min(file_size, 5 * 1024 * 1024)
                header_end_piece = (file_offset + header_bytes - 1) // piece_length

                for p in range(first_piece, min(header_end_piece + 1, torrent_info.num_pieces())):
                    if not handle.have_piece(p):
                        handle.piece_priority(p, 7)
                        try:
                            handle.set_piece_deadline(p, 0, 1)
                        except:
                            pass

            files.append({
                "index": i,
                "name": file_entry.path,
                "size": file_entry.size,
                "progress": handle.file_progress()[i] / file_entry.size * 100 if file_entry.size > 0 else 0
            })

        return files

    except Exception as e:
        logger.error(f"[TORRENT PROXY] List files error: {str(e)}")
        raise ValueError(f"Failed to list files: {str(e)}")


async def get_stream_url(
    ctx: PlatformContext,
    info_hash: str,
    file_index: int
) -> Dict[str, Any]:
    """
    Get streaming URL for a file with intelligent piece downloading.

    Args:
        ctx: Platform context
        info_hash: Torrent info hash
        file_index: File index in torrent

    Returns:
        Streaming URL with signed token
    """
    try:
        if info_hash not in _active_torrents:
            raise ValueError("Torrent not found")

        handle = _active_torrents[info_hash]
        torrent_info = handle.torrent_file()

        if file_index >= torrent_info.num_files():
            raise ValueError("Invalid file index")

        file_entry = torrent_info.files().at(file_index)

        # Prioritize this file
        handle.file_priority(file_index, 7)  # High priority

        # Enable sequential download for this torrent (downloads pieces in order)
        # This ensures the beginning of the file is downloaded first for streaming
        handle.set_sequential_download(True)

        # MAXIMUM AGGRESSIVE prioritization for INSTANT streaming
        try:
            piece_length = torrent_info.piece_length()
            file_offset = file_entry.offset
            file_size = file_entry.size
            first_piece = file_offset // piece_length
            last_piece = (file_offset + file_size - 1) // piece_length

            # CRITICAL: Download header AND tail FIRST (for MP4/MKV files)

            # 1. First 2MB - ABSOLUTE HIGHEST PRIORITY (contains file header)
            critical_bytes = min(file_size, 2 * 1024 * 1024)
            critical_end_piece = (file_offset + critical_bytes - 1) // piece_length

            # 2. Last 10MB - ALSO CRITICAL (MP4 moov atom is often at the end)
            tail_bytes = min(file_size, 10 * 1024 * 1024)
            tail_start_piece = max(critical_end_piece + 1, (file_offset + file_size - tail_bytes) // piece_length)

            # Set MAXIMUM priority for header pieces
            for i in range(first_piece, min(critical_end_piece + 1, torrent_info.num_pieces())):
                handle.piece_priority(i, 7)
                try:
                    handle.set_piece_deadline(i, 0, 1)  # ALERT MODE - highest urgency
                except:
                    pass

            # Set MAXIMUM priority for tail pieces (moov atom)
            for i in range(tail_start_piece, min(last_piece + 1, torrent_info.num_pieces())):
                handle.piece_priority(i, 7)
                try:
                    handle.set_piece_deadline(i, 0, 1)  # ALERT MODE for tail too!
                except:
                    pass

            # 3. Next 20MB after header gets high priority for buffering
            buffer_bytes = min(file_size, 22 * 1024 * 1024)
            buffer_end_piece = (file_offset + buffer_bytes - 1) // piece_length
            for i in range(critical_end_piece + 1, min(buffer_end_piece + 1, tail_start_piece)):
                handle.piece_priority(i, 7)
                try:
                    handle.set_piece_deadline(i, 100, 0)
                except:
                    pass

            # 4. Aggressive connection settings
            handle.set_max_connections(500)  # Maximum connections
            handle.set_max_uploads(-1)  # Unlimited uploads

            # 5. Force multiple announces
            try:
                handle.force_reannounce()
                handle.force_dht_announce()
                handle.scrape_tracker()  # Also scrape for more peers
            except:
                pass

            logger.info(f"[TORRENT] MAXIMUM priority: header {first_piece}-{critical_end_piece}, tail {tail_start_piece}-{last_piece}")
        except Exception as e:
            logger.warning(f"[TORRENT PROXY] Failed to prioritize header/tail pieces: {e}")

        logger.info(f"[TORRENT PROXY] Enabled sequential download for {info_hash}")

        # Get file path
        download_dir = Path(f"./backend/uploads/torrents/{ctx.user_id}/{info_hash}")
        file_path = download_dir / file_entry.path

        # Generate signed token for streaming
        from app.api.v1.apps import generate_stream_token
        token = generate_stream_token(ctx.user_id, info_hash, file_index)

        # Choose the right streaming endpoint based on file format
        file_ext = file_entry.path.lower().split('.')[-1] if '.' in file_entry.path else ''

        # MKV, AVI, FLV, WMV need remuxing to work in browsers
        needs_remux = file_ext in ['mkv', 'avi', 'flv', 'wmv']

        if needs_remux:
            # Use remux endpoint for formats that need container conversion
            stream_url = f"/api/v1/apps/torrent-streamer/remux-stream/{ctx.user_id}/{info_hash}/{file_index}?token={token}"
            logger.info(f"[TORRENT] Using remux stream for {file_ext} file")
        else:
            # Use fast-stream endpoint for directly playable formats
            stream_url = f"/api/v1/apps/torrent-streamer/fast-stream/{ctx.user_id}/{info_hash}/{file_index}?token={token}"

        return {
            "success": True,
            "stream_url": stream_url,
            "file_name": file_entry.path,
            "file_size": file_entry.size
        }

    except Exception as e:
        logger.error(f"[TORRENT PROXY] Get stream URL error: {str(e)}")
        raise ValueError(f"Failed to get stream URL: {str(e)}")


async def set_piece_priority(
    ctx: PlatformContext,
    info_hash: str,
    file_index: int,
    byte_offset: int
) -> Dict[str, Any]:
    """
    Set piece priority based on playback position (for seeking).

    Args:
        ctx: Platform context
        info_hash: Torrent info hash
        file_index: File index in torrent
        byte_offset: Current playback position in bytes

    Returns:
        Success status
    """
    try:
        if info_hash not in _active_torrents:
            raise ValueError("Torrent not found")

        handle = _active_torrents[info_hash]
        torrent_info = handle.torrent_file()

        if file_index >= torrent_info.num_files():
            raise ValueError("Invalid file index")

        # Get file info
        file_entry = torrent_info.files().at(file_index)
        file_offset = file_entry.offset
        piece_length = torrent_info.piece_length()

        # Calculate which piece corresponds to this byte offset
        absolute_offset = file_offset + byte_offset
        piece_index = absolute_offset // piece_length

        # Prioritize 20 pieces ahead (buffer ~20-40MB depending on piece size)
        buffer_pieces = 20

        logger.info(f"[TORRENT PROXY] Prioritizing pieces starting from {piece_index} for seek to {byte_offset}")

        # Set high priority for pieces around the seek position
        for i in range(max(0, piece_index - 2), min(torrent_info.num_pieces(), piece_index + buffer_pieces)):
            handle.piece_priority(i, 7)  # High priority

        # Set immediate priority for the exact piece we need
        if piece_index < torrent_info.num_pieces():
            handle.piece_priority(piece_index, 7)  # Immediate priority

        return {
            "success": True,
            "message": f"Prioritized pieces around offset {byte_offset}"
        }

    except Exception as e:
        logger.error(f"[TORRENT PROXY] Set piece priority error: {str(e)}")
        raise ValueError(f"Failed to set piece priority: {str(e)}")
# AGGRESSIVE seek prefetch - ensures smooth playback after seeking
async def seek_prefetch(
    ctx: PlatformContext,
    info_hash: str,
    file_index: int,
    byte_offset: int,
    window_bytes: int = 256 * 1024 * 1024  # 256MB window for seeks
) -> Dict[str, Any]:
    try:
        if info_hash not in _active_torrents:
            raise ValueError("Torrent not found")

        handle = _active_torrents[info_hash]
        torrent_info = handle.torrent_file()

        if file_index >= torrent_info.num_files():
            raise ValueError("Invalid file index")

        file_entry = torrent_info.files().at(file_index)
        file_offset = file_entry.offset
        piece_length = torrent_info.piece_length()
        file_size = file_entry.size

        # Calculate seek position pieces
        absolute_start = file_offset + max(0, byte_offset)
        start_piece = absolute_start // piece_length

        # CRITICAL: First 10 pieces at seek position MUST be downloaded immediately
        critical_pieces = 10
        for i in range(start_piece, min(start_piece + critical_pieces, torrent_info.num_pieces())):
            handle.piece_priority(i, 7)
            try:
                handle.set_piece_deadline(i, 0, 1)  # IMMEDIATE with ALERT mode
            except:
                pass

        # Next 50 pieces get high priority for smooth playback
        buffer_pieces = 50
        for i in range(start_piece + critical_pieces, min(start_piece + critical_pieces + buffer_pieces, torrent_info.num_pieces())):
            handle.piece_priority(i, 7)
            try:
                handle.set_piece_deadline(i, (i - start_piece) * 100, 0)  # Staggered deadlines
            except:
                pass

        # Also prefetch common seek points (25%, 50%, 75% of file) with lower priority
        common_seek_points = [
            int(file_size * 0.25),
            int(file_size * 0.50),
            int(file_size * 0.75),
        ]

        for seek_point in common_seek_points:
            if abs(seek_point - byte_offset) > window_bytes:  # Don't duplicate if near current seek
                point_start = file_offset + seek_point
                point_piece = point_start // piece_length
                # Prefetch 8 pieces (typically 16-32MB) at each common point
                for j in range(point_piece, min(point_piece + 8, torrent_info.num_pieces())):
                    current_priority = handle.piece_priority(j)
                    if current_priority < 4:  # Only update if not already high priority
                        handle.piece_priority(j, 4)

        logger.info(f"[TORRENT PROXY] Prefetch window pieces {start_piece}-{end_piece} for offset {byte_offset}, plus common seek points")

        return {"success": True, "message": "Seek prefetch with predictive buffering scheduled"}

    except Exception as e:
        logger.error(f"[TORRENT PROXY] Seek prefetch error: {str(e)}")
        raise ValueError(f"Failed to prefetch: {str(e)}")


# App initialization (called on first install)

async def search_torrents(
    ctx: PlatformContext,
    query: str,
    limit: int = 20
) -> List[Dict[str, Any]]:
    """
    Search for torrents using The Pirate Bay API.

    Args:
        ctx: Platform context
        query: Search query
        limit: Maximum number of results (default 20)

    Returns:
        List of torrent search results
    """
    try:
        # The Pirate Bay API endpoint
        api_url = f"https://apibay.org/q.php?q={query}"

        logger.info(f"[TORRENT SEARCH] Searching for: {query}")

        # Add browser-like headers to avoid being blocked
        headers = {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'application/json, text/plain, */*',
            'Accept-Language': 'en-US,en;q=0.9',
            'Referer': 'https://apibay.org/',
            'Origin': 'https://apibay.org'
        }

        async with httpx.AsyncClient(timeout=10.0, follow_redirects=True) as client:
            response = await client.get(api_url, headers=headers)
            response.raise_for_status()
            results = response.json()

        # Filter and format results
        torrents = []
        for item in results[:limit]:
            # Skip if no results (API returns [{"name": "No results returned"}])
            if item.get('name') == 'No results returned':
                break

            # Format size from bytes
            size_bytes = int(item.get('size', 0))
            size_gb = size_bytes / (1024 ** 3)
            size_mb = size_bytes / (1024 ** 2)

            if size_gb >= 1:
                size_str = f"{size_gb:.2f} GB"
            else:
                size_str = f"{size_mb:.2f} MB"

            torrents.append({
                "id": item.get('id'),
                "name": item.get('name'),
                "info_hash": item.get('info_hash'),
                "size": size_str,
                "size_bytes": size_bytes,
                "seeders": int(item.get('seeders', 0)),
                "leechers": int(item.get('leechers', 0)),
                "num_files": int(item.get('num_files', 0)),
                "category": item.get('category'),
                "added": item.get('added'),
                "magnet": f"magnet:?xt=urn:btih:{item.get('info_hash')}&dn={item.get('name')}"
            })

        logger.info(f"[TORRENT SEARCH] Found {len(torrents)} results for: {query}")

        return torrents

    except Exception as e:
        logger.error(f"[TORRENT SEARCH] Search error: {str(e)}")
        raise ValueError(f"Failed to search torrents: {str(e)}")


async def download_torrent_from_magnet(
    ctx: PlatformContext,
    magnet_link: str
) -> Dict[str, Any]:
    """
    Download a torrent file from a magnet link using libtorrent.

    Args:
        ctx: Platform context
        magnet_link: Magnet link

    Returns:
        Download info with info_hash
    """
    try:
        ses = get_lt_session()

        # Parse magnet link
        atp = lt.parse_magnet_uri(magnet_link)

        # Get info hash from magnet
        info_hash = str(atp.info_hash)

        # Create download directory
        download_dir = Path(f"./backend/uploads/torrents/{ctx.user_id}/{info_hash}")
        download_dir.mkdir(parents=True, exist_ok=True)

        atp.save_path = str(download_dir)

        # Use allocate mode - pre-allocates full file size on disk
        atp.storage_mode = lt.storage_mode_t.storage_mode_allocate

        # Add torrent
        handle = ses.add_torrent(atp)
        _active_torrents[info_hash] = handle

        # Enable sequential download immediately for streaming
        handle.set_sequential_download(True)

        logger.info(f"[TORRENT PROXY] Started download from magnet: {info_hash} for user {ctx.user_id}")
        logger.info(f"[TORRENT PROXY] Sequential download enabled for streaming")

        # Wait a bit for metadata to be downloaded
        logger.info(f"[TORRENT PROXY] Waiting for metadata...")
        for _ in range(50):  # Wait up to 5 seconds
            if handle.has_metadata():
                break
            await asyncio.sleep(0.1)

        if not handle.has_metadata():
            logger.warning(f"[TORRENT PROXY] Metadata not yet available for {info_hash}")
            return {
                "success": True,
                "info_hash": info_hash,
                "name": "Downloading metadata...",
                "file_count": 0,
                "total_size": 0,
                "status": "downloading_metadata",
                "message": "Torrent added, waiting for metadata"
            }

        # Get torrent info
        torrent_info = handle.torrent_file()
        torrent_name = torrent_info.name()
        file_count = torrent_info.num_files()
        total_size = torrent_info.total_size()

        return {
            "success": True,
            "info_hash": info_hash,
            "name": torrent_name,
            "file_count": file_count,
            "total_size": total_size,
            "status": "downloading",
            "message": "Download started from magnet link"
        }

    except Exception as e:
        logger.error(f"[TORRENT PROXY] Magnet download error: {str(e)}")
        raise ValueError(f"Failed to download from magnet: {str(e)}")


async def search_subtitles(
    ctx: PlatformContext,
    query: str,
    language: str = "en"
) -> List[Dict[str, Any]]:
    """
    Search for subtitles using OpenSubtitles.com API.

    Args:
        ctx: Platform context
        query: Movie/TV show name to search for
        language: Subtitle language code (default: en)

    Returns:
        List of subtitle search results
    """
    try:
        logger.info(f"[SUBTITLE SEARCH] Searching for: {query} (language: {language})")

        # Use opensubtitles.com REST API
        api_url = "https://rest.opensubtitles.org/search"

        headers = {
            'User-Agent': 'VLSub 0.10.2',
            'Accept': 'application/json'
        }

        params = {
            'query': query,
            'sublanguageid': language
        }

        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(api_url, headers=headers, params=params)

            if response.status_code != 200:
                logger.warning(f"[SUBTITLE SEARCH] API returned {response.status_code}")
                return []

            results = response.json()

        # Format and limit results
        subtitles = []
        for item in results[:20]:  # Limit to 20 results
            subtitles.append({
                "id": item.get('IDSubtitleFile'),
                "name": item.get('SubFileName'),
                "movie_name": item.get('MovieName'),
                "language": item.get('LanguageName'),
                "downloads": int(item.get('SubDownloadsCnt', 0)),
                "rating": float(item.get('SubRating', 0)),
                "download_link": item.get('SubDownloadLink'),
                "zip_download_link": item.get('ZipDownloadLink'),
                "format": item.get('SubFormat'),
                "release": item.get('MovieReleaseName')
            })

        logger.info(f"[SUBTITLE SEARCH] Found {len(subtitles)} subtitles")
        return subtitles

    except Exception as e:
        logger.error(f"[SUBTITLE SEARCH] Search error: {str(e)}")
        raise ValueError(f"Failed to search subtitles: {str(e)}")


async def download_subtitle(
    ctx: PlatformContext,
    download_link: str,
    subtitle_name: str
) -> Dict[str, Any]:
    """
    Download a subtitle file.

    Args:
        ctx: Platform context
        download_link: Subtitle download URL
        subtitle_name: Name for the subtitle file

    Returns:
        Subtitle content and metadata
    """
    try:
        logger.info(f"[SUBTITLE] Downloading subtitle: {subtitle_name}")

        headers = {
            'User-Agent': 'VLSub 0.10.2'
        }

        async with httpx.AsyncClient(timeout=15.0, follow_redirects=True) as client:
            response = await client.get(download_link, headers=headers)
            response.raise_for_status()

            # The content might be gzipped, httpx handles decompression automatically
            subtitle_content = response.text

        logger.info(f"[SUBTITLE] Downloaded subtitle successfully")

        return {
            "success": True,
            "name": subtitle_name,
            "content": subtitle_content,
            "size": len(subtitle_content)
        }

    except Exception as e:
        logger.error(f"[SUBTITLE] Download error: {str(e)}")
        raise ValueError(f"Failed to download subtitle: {str(e)}")


async def initialize_app(ctx: PlatformContext):
    """
    Initialize the app for a new user.

    Args:
        ctx: Platform context
    """
    logger.info(f"[TORRENT STREAMER] Initializing app for user {ctx.user_id}")

    # No initial data needed for this app
    # Tables are created automatically by the platform

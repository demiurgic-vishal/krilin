"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth/AuthContext";
import { executeAction } from "@/lib/api/apps";
import { Button } from "@/components/retroui/Button";
import { Card } from "@/components/retroui/Card";
import {
  Film, Upload, Play, Pause, Download, Home, Loader2,
  AlertCircle, Trash2, FileVideo, Folder, File, X, Subtitles
} from "lucide-react";

// Torrent file interface
interface TorrentFile {
  name: string;
  path: string;
  length: number;
  downloaded: number;
}

// Uploaded torrent interface
interface UploadedTorrent {
  id: string;
  name: string;
  info_hash: string;
  file_count: number;
  total_size: string;
  uploaded_at: string;
}

// WebTorrent types
declare global {
  interface Window {
    WebTorrent: any;
  }
}

export default function TorrentStreamerPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State
  const [uploadedTorrents, setUploadedTorrents] = useState<UploadedTorrent[]>([]);
  const [torrentFiles, setTorrentFiles] = useState<TorrentFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<TorrentFile | null>(null);

  // Backend mode only (P2P removed)
  const downloadMode = 'backend';

  // Streaming state
  const [streaming, setStreaming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadSpeed, setDownloadSpeed] = useState("0 KB/s");
  const [uploadSpeed, setUploadSpeed] = useState("0 KB/s");
  const [peers, setPeers] = useState(0);
  const [error, setError] = useState("");

  // Backend download state
  const [backendInfoHash, setBackendInfoHash] = useState<string | null>(null);
  const [backendStreamUrl, setBackendStreamUrl] = useState<string | null>(null);
  const [currentFileIndex, setCurrentFileIndex] = useState<number | null>(null);
  const statusPollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const backendInfoHashRef = useRef<string | null>(null);
  const streamCheckIdRef = useRef<number>(0);
  const sseRef = useRef<EventSource | null>(null);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  // Subtitle state
  const [subtitleSearchQuery, setSubtitleSearchQuery] = useState("");
  const [subtitleResults, setSubtitleResults] = useState<any[]>([]);
  const [searchingSubtitles, setSearchingSubtitles] = useState(false);
  const [loadedSubtitles, setLoadedSubtitles] = useState<any[]>([]);
  const [showSubtitleSearch, setShowSubtitleSearch] = useState(false);

  // Video player state
  const [videoError, setVideoError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<any>(null);
  const lastPriorityUpdateRef = useRef<number>(0);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
    }
  }, [user, authLoading, router]);

  // Auto-play when video URL is set
  useEffect(() => {
    if (backendStreamUrl && videoRef.current && streaming) {
      console.log('[STREAM] Video element ready, starting playback...');

      // Clean up any existing HLS instance
      if (playerRef.current && playerRef.current.destroy) {
        try { playerRef.current.destroy(); } catch {}
        playerRef.current = null;
      }

      // Configure for immediate playback
      videoRef.current.preload = 'auto';

      // The src might already be set by React, but ensure it's correct
      if (videoRef.current.src !== backendStreamUrl) {
        videoRef.current.src = backendStreamUrl;
      }

      // Load and try to auto-play
      videoRef.current.load();

      // Try to auto-play
      videoRef.current.play().then(() => {
        console.log('[STREAM] Playback started successfully!');
      }).catch((playError) => {
        console.log('[STREAM] Auto-play blocked, user needs to click play:', playError);
      });
    }
  }, [backendStreamUrl, streaming]);

  // Load uploaded torrents history
  useEffect(() => {
    if (user) {
      loadUploadedTorrents();
    }
  }, [user]);

  // Keep a ref of the latest info hash for safe polling updates
  useEffect(() => {
    backendInfoHashRef.current = backendInfoHash;
  }, [backendInfoHash]);

  // Cleanup when component unmounts
  useEffect(() => {
    return () => {
      if (statusPollRef.current) {
        clearInterval(statusPollRef.current);
        statusPollRef.current = null;
      }
      if (sseRef.current) {
        sseRef.current.close();
        sseRef.current = null;
      }
    };
  }, []);

  // Set up native video element event listeners
  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    const handleError = async (e: Event) => {
      console.error('[VIDEO] Error event:', e);

      // Test the stream URL directly to see what response we get
      if (backendStreamUrl) {
        try {
          const response = await fetch(backendStreamUrl, {
            method: 'HEAD',
            headers: { 'Range': 'bytes=0-1048575' }
          });
          console.error('[VIDEO] Stream URL HEAD response:', response.status, response.statusText);
          console.error('[VIDEO] Response headers:', Object.fromEntries(response.headers.entries()));
        } catch (err) {
          console.error('[VIDEO] Failed to fetch stream URL:', err);
        }
      }

      if (videoElement.error) {
        const errorCode = videoElement.error.code;
        const errorMessages: Record<number, string> = {
          1: 'Video loading aborted',
          2: 'Network error while loading video',
          3: 'Video decoding failed - file may be corrupt or unsupported format',
          4: 'Video format not supported by browser - check Network tab for HTTP status'
        };
        const errorMsg = errorMessages[errorCode] || `Unknown error (code ${errorCode})`;
        setVideoError(errorMsg + '. Check console for details.');
        console.error('[VIDEO] Error details:', videoElement.error);
        console.error('[VIDEO] Error message:', videoElement.error.message);
      }
    };

    const handleLoadStart = () => {
      console.log('[VIDEO] Load started');
      setVideoError(null);
    };

    const handleCanPlay = () => {
      console.log('[VIDEO] Can play - enough data buffered');
      setVideoError(null);
    };

    const handleLoadedMetadata = () => {
      console.log('[VIDEO] Metadata loaded - duration:', videoElement.duration);
    };

    const handleWaiting = () => {
      console.log('[VIDEO] Waiting for more data...');
    };

    const handlePlaying = () => {
      console.log('[VIDEO] Playback started');
    };

    // Seek-aware prioritization
    const sendPriorityUpdate = async () => {
      if (!backendInfoHash || currentFileIndex === null || !selectedFile) return;
      const now = Date.now();
      if (now - lastPriorityUpdateRef.current < 300) return; // throttle
      lastPriorityUpdateRef.current = now;

      const duration = videoElement.duration || 0;
      const currentTime = videoElement.currentTime || 0;
      if (!duration || duration <= 0) return;

      const ratio = Math.min(1, Math.max(0, currentTime / duration));
      const approxByteOffset = Math.floor(ratio * selectedFile.length);

      try {
        await executeAction('torrent-streamer', 'set_piece_priority', {
          info_hash: backendInfoHash,
          file_index: currentFileIndex,
          byte_offset: approxByteOffset
        });
      } catch (e) {
        // ignore
      }
    };

    const handleSeeking = () => {
      console.log('[VIDEO] Seeking to:', videoElement.currentTime);

      // Show buffering message during seek
      setVideoError('Buffering seek position...');

      // For direct HTTP streaming, immediately update piece priorities
      sendPriorityUpdate();

      // Aggressively prefetch around seek position for smooth scrubbing
      try {
        if (backendInfoHash && currentFileIndex !== null && selectedFile) {
          const duration = videoElement.duration || 0;
          const currentTime = videoElement.currentTime || 0;

          if (duration > 0) {
            const ratio = Math.min(1, Math.max(0, currentTime / duration));
            const approxByteOffset = Math.floor(ratio * selectedFile.length);

            console.log(`[VIDEO] Seek ratio: ${(ratio * 100).toFixed(1)}%, byte offset: ${approxByteOffset}`);

            // For direct HTTP, use even larger prefetch window for instant response
            executeAction('torrent-streamer', 'seek_prefetch', {
              info_hash: backendInfoHash,
              file_index: currentFileIndex,
              byte_offset: approxByteOffset,
              window_bytes: 256 * 1024 * 1024  // 256MB for direct HTTP streaming
            }).then(() => {
              console.log('[VIDEO] Seek prefetch initiated');
            }).catch((e) => {
              console.error('[VIDEO] Seek prefetch failed:', e);
            });
          }
        }
      } catch (e) {
        console.error('[VIDEO] Seek prefetch failed:', e);
      }
    };

    const handleSeeked = () => {
      console.log('[VIDEO] Seek complete at:', videoElement.currentTime);
      // Clear buffering message
      setVideoError(null);
      // Update priorities again after seek completes
      sendPriorityUpdate();
    };

    const handleTimeUpdate = () => {
      sendPriorityUpdate();
    };

    videoElement.addEventListener('error', handleError);
    videoElement.addEventListener('loadstart', handleLoadStart);
    videoElement.addEventListener('canplay', handleCanPlay);
    videoElement.addEventListener('loadedmetadata', handleLoadedMetadata);
    videoElement.addEventListener('waiting', handleWaiting);
    videoElement.addEventListener('playing', handlePlaying);
    videoElement.addEventListener('seeking', handleSeeking);
    videoElement.addEventListener('seeked', handleSeeked);
    videoElement.addEventListener('timeupdate', handleTimeUpdate);

    return () => {
      videoElement.removeEventListener('error', handleError);
      videoElement.removeEventListener('loadstart', handleLoadStart);
      videoElement.removeEventListener('canplay', handleCanPlay);
      videoElement.removeEventListener('loadedmetadata', handleLoadedMetadata);
      videoElement.removeEventListener('waiting', handleWaiting);
      videoElement.removeEventListener('playing', handlePlaying);
      videoElement.removeEventListener('seeking', handleSeeking);
      videoElement.removeEventListener('seeked', handleSeeked);
      videoElement.removeEventListener('timeupdate', handleTimeUpdate);
    };
  }, [backendStreamUrl, backendInfoHash, currentFileIndex, selectedFile]);

  const loadUploadedTorrents = async () => {
    try {
      const result = await executeAction('torrent-streamer', 'get_uploaded_torrents', {});
      if (result.success) {
        setUploadedTorrents(result.result);
      }
    } catch (err: any) {
      console.error('Failed to load torrents:', err);
    }
  };

  const pollBackendFiles = async (infoHash: string) => {
    try {
      const filesResult = await executeAction('torrent-streamer', 'list_torrent_files', {
        info_hash: infoHash
      });

      if (filesResult.success && filesResult.result) {
        const files: TorrentFile[] = filesResult.result.map((f: any) => ({
          name: f.name,
          path: f.name,
          length: f.size,
          downloaded: (f.progress / 100) * f.size
        }));
        setTorrentFiles(files);

        // Start polling for progress
        // Clear any previous polling interval before starting a new one
        if (statusPollRef.current) {
          clearInterval(statusPollRef.current);
          statusPollRef.current = null;
        }

        statusPollRef.current = setInterval(async () => {
          try {
            const statusResult = await executeAction('torrent-streamer', 'get_download_status', {
              info_hash: infoHash
            });

            if (statusResult.success && statusResult.result) {
              const status = statusResult.result;
              // Only apply updates if this is the current torrent
              if (backendInfoHashRef.current === infoHash) {
                setDownloadProgress(Math.round(status.progress));
                setDownloadSpeed(formatBytes(status.download_rate) + '/s');
                setUploadSpeed(formatBytes(status.upload_rate) + '/s');
                setPeers(status.num_peers);
              }

              if (status.progress >= 100) {
                if (statusPollRef.current) {
                  clearInterval(statusPollRef.current);
                  statusPollRef.current = null;
                }
              }
            }
          } catch (err) {
            console.error('[BACKEND] Poll error:', err);
          }
        }, 2000);
      }
    } catch (err: any) {
      console.error('[BACKEND] Failed to load files:', err);
      setError(err.message);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement> | { target: { files: any[] } }) => {
    const fileOrMagnet = e.target.files?.[0];
    if (!fileOrMagnet) return;

    setLoading(true);
    setError("");
    setTorrentFiles([]);
    setSelectedFile(null);

    try {
      // Read torrent file as base64
      const reader = new FileReader();
      reader.onload = async (event) => {
        const arrayBuffer = event.target?.result as ArrayBuffer;
        const bytes = new Uint8Array(arrayBuffer);
        const binary = String.fromCharCode(...bytes);
        const base64 = btoa(binary);

        console.log('[BACKEND] Sending torrent to backend...');

        // Start backend download - backend will extract info_hash
        const result = await executeAction('torrent-streamer', 'start_backend_download', {
          torrent_data: base64
        });

        console.log('[BACKEND] Backend response:', result);

        if (result.success && result.result) {
          const infoHash = result.result.info_hash;
          const torrentName = result.result.name || 'Unknown';
          const fileCount = result.result.file_count || 0;
          const totalSize = result.result.total_size || 0;

          setBackendInfoHash(infoHash);
          console.log('[BACKEND] Download started successfully for:', infoHash);

          // Poll for file list
          await pollBackendFiles(infoHash);

          // Save torrent info
          await executeAction('torrent-streamer', 'save_torrent_info', {
            name: torrentName,
            info_hash: infoHash,
            file_count: fileCount,
            total_size: formatBytes(totalSize)
          });

          loadUploadedTorrents();
        } else {
          setError(result.error || 'Failed to start backend download');
        }

        setLoading(false);
      };

      reader.readAsArrayBuffer(fileOrMagnet);
    } catch (err: any) {
      console.error('[BACKEND] Error:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  const handlePlayFile = async (file: TorrentFile, fileIndex?: number) => {
    console.log('[STREAM] handlePlayFile called with file:', file);

    // Check if it's a video file
    const ext = file.name.split('.').pop()?.toLowerCase();
    console.log('[STREAM] File extension:', ext);

    const videoExtensions = ['mp4', 'mkv', 'avi', 'webm', 'mov', 'flv', 'wmv', 'm4v'];

    if (!ext || !videoExtensions.includes(ext)) {
      console.error('[STREAM] Not a video file:', ext);
      setError(`Cannot stream ${ext} files. Only video files are supported.`);
      return;
    }

    if (!backendInfoHash || !user) {
      setError("No torrent loaded");
      return;
    }

    try {
      // Get file index
      const idx = fileIndex !== undefined ? fileIndex : torrentFiles.findIndex(f => f.path === file.path);

      // Get stream URL
      const result = await executeAction('torrent-streamer', 'get_stream_url', {
        info_hash: backendInfoHash,
        file_index: idx
      });

      console.log('[BACKEND] get_stream_url result:', result);

      if (result.success && result.result) {
        const streamUrl = result.result.stream_url;
        const fullUrl = `http://localhost:8001${streamUrl}`;
        console.log('[BACKEND] Stream URL:', streamUrl);
        console.log('[BACKEND] Full URL:', fullUrl);

        // Set state to render the video player (show it first)
        setSelectedFile(file);
        setCurrentFileIndex(idx);
        // Don't set streaming yet - wait until we have the URL
        setError("");

        // Check if critical pieces are ready with HEAD request
        console.log('[STREAM] Checking if video is ready...');
        setVideoError(null);

        // Check if this is a remux stream (MKV/AVI)
        const isRemuxStream = streamUrl.includes('/remux-stream/');
        if (isRemuxStream) {
          console.log('[STREAM] MKV/AVI file will be remuxed to MP4...');
          setVideoError('Preparing MKV/AVI for playback (remuxing to MP4)...');
        }

        // Do a quick HEAD check to ensure critical pieces are ready
        let retries = 0;
        const maxRetries = isRemuxStream ? 30 : 20; // Give more time for remux streams
        let videoReady = false;

        while (retries < maxRetries) {
          try {
            const response = await fetch(fullUrl, {
              method: 'HEAD'
            });

            if (response.status === 200) {
              console.log('[STREAM] Video ready! Critical pieces downloaded.');
              videoReady = true;
              break;
            } else if (response.status === 202) {
              // Still buffering
              const waitMessage = isRemuxStream
                ? `Buffering MKV/AVI file for remuxing... (${retries}s)`
                : `Downloading video metadata... (${retries}s)`;
              console.log('[STREAM] Still buffering...');
              setVideoError(waitMessage);
              await new Promise(resolve => setTimeout(resolve, 1000));
              retries++;
            } else if (response.status === 412) {
              // Precondition Failed - file is incomplete in swarm
              const errorText = await response.text();
              console.error('[STREAM] File incomplete:', errorText);
              setError(`⚠️ ${errorText || 'This MKV/AVI file is incomplete. Some pieces are missing from all peers and cannot be downloaded.'}`);
              setStreaming(false);
              setSelectedFile(null);
              return;
            } else {
              console.error('[STREAM] Unexpected status:', response.status);
              const errorText = await response.text();
              if (errorText) {
                setError(`Stream error: ${errorText}`);
              }
              break;
            }
          } catch (err) {
            console.error('[STREAM] HEAD check error:', err);
            break;
          }
        }

        if (!videoReady) {
          setError('Failed to buffer critical video pieces. The torrent may be slow or have no seeders.');
          setStreaming(false);
          return;
        }

        console.log('[STREAM] Starting playback...');
        setVideoError(null);

        // Start SSE stream status for smoother UI
        try {
          const token = streamUrl.split('token=')[1];
          const sseUrl = `http://localhost:8001/api/v1/apps/torrent-streamer/sse/${user.id}/${backendInfoHash}/${idx}?token=${token}`;
          if (sseRef.current) {
            sseRef.current.close();
          }
          const es = new EventSource(sseUrl);
          es.onmessage = (ev) => {
            try {
              const data = JSON.parse(ev.data);
              setDownloadProgress(Math.round(data.progress));
              setDownloadSpeed(formatBytes(data.download_rate) + '/s');
              setUploadSpeed(formatBytes(data.upload_rate) + '/s');
              setPeers(data.num_peers);
            } catch {}
          };
          es.onerror = () => {
            es.close();
          };
          sseRef.current = es;
        } catch {}

        // Set URL and streaming state - video will render with these
        console.log('[STREAM] Setting up instant playback...');
        setBackendStreamUrl(fullUrl);
        setStreaming(true);

        // The video element will be configured via useEffect when it renders
      } else {
        setError(result.error || 'Failed to get stream URL');
      }
    } catch (err: any) {
      console.error('[BACKEND] Stream error:', err);
      setError(err.message);
    }
  };

  const handleStopStreaming = () => {
    setStreaming(false);
    setSelectedFile(null);
    setBackendStreamUrl(null);
    setLoadedSubtitles([]);
    setDownloadProgress(0);
    setPeers(0);
    if (statusPollRef.current) {
      clearInterval(statusPollRef.current);
      statusPollRef.current = null;
    }
    streamCheckIdRef.current += 1; // cancel any in-flight HEAD check loop
  };

  const handleRemoveTorrent = () => {
    setTorrentFiles([]);
    setSelectedFile(null);
    setStreaming(false);
    setDownloadProgress(0);
    setPeers(0);
    setBackendInfoHash(null);
    setBackendStreamUrl(null);
    if (statusPollRef.current) {
      clearInterval(statusPollRef.current);
      statusPollRef.current = null;
    }
    streamCheckIdRef.current += 1;
  };

  const handleDeleteFromHistory = async (torrentId: string) => {
    try {
      await executeAction('torrent-streamer', 'delete_torrent', {
        torrent_id: torrentId
      });
      loadUploadedTorrents();
    } catch (err: any) {
      alert(`Failed to delete: ${err.message}`);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setSearching(true);
    setError("");

    try {
      const result = await executeAction('torrent-streamer', 'search_torrents', {
        query: searchQuery,
        limit: 20
      });

      if (result.success && result.result) {
        setSearchResults(result.result);
      } else {
        setError(result.error || 'Search failed');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSearching(false);
    }
  };

  const handleDownloadFromSearch = async (torrent: any) => {
    setLoading(true);
    setError("");

    try {
      const result = await executeAction('torrent-streamer', 'download_torrent_from_magnet', {
        magnet_link: torrent.magnet
      });

      if (result.success && result.result) {
        const infoHash = result.result.info_hash;
        setBackendInfoHash(infoHash);

        // Poll for file list
        await pollBackendFiles(infoHash);

        // Save torrent info
        await executeAction('torrent-streamer', 'save_torrent_info', {
          name: result.result.name,
          info_hash: infoHash,
          file_count: result.result.file_count,
          total_size: formatBytes(result.result.total_size)
        });

        loadUploadedTorrents();
        setSearchResults([]); // Clear search results
        setSearchQuery("");
      } else {
        setError(result.error || 'Failed to download torrent');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubtitleSearch = async () => {
    if (!subtitleSearchQuery.trim() && !selectedFile) return;

    setSearchingSubtitles(true);
    setError("");

    try {
      const query = subtitleSearchQuery.trim() || selectedFile?.name || "";
      const result = await executeAction('torrent-streamer', 'search_subtitles', {
        query: query,
        language: 'eng'
      });

      if (result.success && result.result) {
        setSubtitleResults(result.result);
      } else {
        setError(result.error || 'Subtitle search failed');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSearchingSubtitles(false);
    }
  };

  const handleLoadSubtitle = async (subtitle: any) => {
    try {
      setError("");

      const result = await executeAction('torrent-streamer', 'download_subtitle', {
        download_link: subtitle.download_link,
        subtitle_name: subtitle.name
      });

      if (result.success && result.result) {
        // Create a blob URL for the subtitle
        const blob = new Blob([result.result.content], { type: 'text/vtt' });
        const url = URL.createObjectURL(blob);

        setLoadedSubtitles([{
          name: subtitle.name,
          language: subtitle.language,
          language_code: subtitle.language,
          url: url
        }]);

        setShowSubtitleSearch(false);
        setSubtitleResults([]);
      } else {
        setError(result.error || 'Failed to load subtitle');
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getFileInfo = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase();

    // HTML5 video element natively supports these formats in most browsers
    const browserPlayable = ['mp4', 'webm', 'ogg'];
    const partialSupport = ['mov', 'm4v']; // Safari only
    const remuxSupported = ['mkv', 'avi']; // Can be remuxed to MP4 on-the-fly
    const notSupported = ['flv', 'wmv']; // May have codec issues even with remuxing

    if (!ext) {
      return {
        icon: <File className="text-gray-500" size={20} />,
        playable: false,
        tooltip: 'Unknown file type'
      };
    }

    // Fully supported formats - will play in all browsers
    if (browserPlayable.includes(ext)) {
      return {
        icon: <FileVideo className="text-green-500" size={20} />,
        playable: true,
        badge: <span className="text-xs bg-green-500 text-white px-1.5 py-0.5 rounded">✓ Direct Play</span>,
        tooltip: `${ext.toUpperCase()} - Plays directly in all browsers`
      };
    }

    // Partial support - may work in some browsers
    if (partialSupport.includes(ext)) {
      return {
        icon: <FileVideo className="text-yellow-500" size={20} />,
        playable: true,
        badge: <span className="text-xs bg-yellow-500 text-white px-1.5 py-0.5 rounded">⚠ Limited</span>,
        tooltip: `${ext.toUpperCase()} - May work (Safari has better support)`
      };
    }

    // Remux supported - will be converted on-the-fly
    if (remuxSupported.includes(ext)) {
      return {
        icon: <FileVideo className="text-blue-500" size={20} />,
        playable: true,
        badge: <span className="text-xs bg-blue-500 text-white px-1.5 py-0.5 rounded">⚡ Remux</span>,
        tooltip: `${ext.toUpperCase()} - Requires complete file. Will be converted to MP4 on-the-fly.`
      };
    }

    // Not supported even with remuxing
    if (notSupported.includes(ext)) {
      return {
        icon: <FileVideo className="text-red-500" size={20} />,
        playable: false,
        badge: <span className="text-xs bg-red-500 text-white px-1.5 py-0.5 rounded">✗ Not Supported</span>,
        tooltip: `${ext.toUpperCase()} - Cannot be played (incompatible codecs)`
      };
    }

    // Non-video files
    return {
      icon: <File className="text-gray-500" size={20} />,
      playable: false,
      tooltip: `${ext.toUpperCase()} file`
    };
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
        <div className="text-center">
          <div className="text-3xl font-[var(--font-head)] mb-4 uppercase">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Header */}
      <header className="border-b-4 border-[var(--border)] bg-[var(--card)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="icon">
                  <Home size={24} />
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-[var(--font-head)] uppercase tracking-wider flex items-center gap-3">
                  <Film size={32} className="text-[var(--primary)]" />
                  Torrent Streamer
                </h1>
                <p className="text-sm text-[var(--muted-foreground)] mt-1 uppercase">
                  Upload Torrent Files & Stream in Browser
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Video Player */}
        {streaming && selectedFile && (
          <Card className="mb-8">
            <Card.Header>
              <div className="flex items-center justify-between">
                <Card.Title>Now Playing: {selectedFile.name}</Card.Title>
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" onClick={handleStopStreaming}>
                    <X size={20} />
                  </Button>
                </div>
              </div>
            </Card.Header>
            <Card.Content>
              {/* Subtitles temporarily removed for troubleshooting */}

              {/* Video Player */}
              <div className="mb-4">
                {streaming && backendStreamUrl ? (
                  <div>
                    {videoError && (
                      <div className={`mb-2 p-3 border-2 border-[var(--border)] ${
                        videoError.includes('Buffering') || videoError.includes('downloading') ? 'bg-blue-500 text-white' : 'bg-red-500 text-white'
                      }`}>
                        <strong>{videoError.includes('Buffering') || videoError.includes('downloading') ? '⏳' : '⚠️'}</strong> {videoError}
                      </div>
                    )}

                    <video
                      ref={videoRef}
                      controls
                      playsInline
                      preload="auto"
                      className="w-full max-h-[600px] bg-black border-2 border-[var(--border)]"
                      style={{ maxWidth: '100%' }}
                      crossOrigin="anonymous"
                    >
                      Your browser does not support the video tag.
                    </video>
                  </div>
                ) : streaming ? (
                  // This should never show now since we set both states together
                  <div className="p-8 border-2 border-[var(--border)] text-center bg-blue-500 text-white">
                    <Loader2 size={48} className="mx-auto mb-4 animate-spin" />
                    <p className="text-lg font-bold">Loading stream...</p>
                  </div>
                ) : (
                  <div className="p-8 border-2 border-dashed border-[var(--border)] text-center text-[var(--muted-foreground)]">
                    <FileVideo size={48} className="mx-auto mb-2 opacity-50" />
                    <p>Select a video file to start streaming</p>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Download Progress: {downloadProgress}%</span>
                  <span>{peers} peers</span>
                </div>
                <div className="w-full bg-[var(--muted)] h-2 border-2 border-[var(--border)]">
                  <div
                    className="bg-[var(--primary)] h-full transition-all"
                    style={{ width: `${downloadProgress}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-xs text-[var(--muted-foreground)]">
                  <span>↓ {downloadSpeed}</span>
                  <span>↑ {uploadSpeed}</span>
                </div>
              </div>
            </Card.Content>
          </Card>
        )}

        {/* Search Section */}
        {downloadMode === 'backend' && (
          <Card className="mb-8">
            <Card.Header>
              <Card.Title>Search Torrents</Card.Title>
              <Card.Description>
                Search for torrents using The Pirate Bay API
              </Card.Description>
            </Card.Header>
            <Card.Content>
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="Search for movies, shows, games..."
                  className="flex-1 p-3 border-2 border-[var(--border)] bg-[var(--background)] text-[var(--foreground)]"
                  disabled={searching}
                />
                <Button
                  onClick={handleSearch}
                  disabled={searching || !searchQuery.trim()}
                  className="px-6"
                >
                  {searching ? 'Searching...' : 'Search'}
                </Button>
              </div>

              {searchResults.length > 0 && (
                <div className="space-y-2 max-h-[500px] overflow-y-auto">
                  {searchResults.map((torrent) => (
                    <div
                      key={torrent.id}
                      className="p-4 border-2 border-[var(--border)] hover:border-[var(--primary)] transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="font-semibold mb-1">{torrent.name}</div>
                          <div className="flex gap-4 text-sm text-[var(--muted-foreground)]">
                            <span>Size: {torrent.size}</span>
                            <span className="text-green-500">↑ {torrent.seeders} seeders</span>
                            <span className="text-red-500">↓ {torrent.leechers} leechers</span>
                            <span>Files: {torrent.num_files}</span>
                          </div>
                        </div>
                        <Button
                          onClick={() => handleDownloadFromSearch(torrent)}
                          disabled={loading}
                          size="sm"
                        >
                          Download
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card.Content>
          </Card>
        )}

        {/* Upload Section */}
        <Card className="mb-8">
          <Card.Header>
            <Card.Title>Add Torrent</Card.Title>
            <Card.Description>
              Upload a .torrent file or paste a magnet link
            </Card.Description>
          </Card.Header>
          <Card.Content>
            <div className="mb-4 p-4 bg-blue-500 border-2 border-[var(--border)]">
              <div className="font-bold mb-2">ℹ️ How It Works</div>
              <div className="text-sm">
                <strong>Server-Side Download:</strong>
                <br/>
                Torrents are downloaded on the server using libtorrent, which connects to ALL seeders (desktop clients).
                <br/><br/>
                <strong>Benefits:</strong> Works with any torrent, intelligent streaming with seek support, subtitle search.
                <br/><br/>
                <strong>Note:</strong> Files are stored on the server and streamed to your browser via HTTP with range request support.
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".torrent"
              onChange={handleFileSelect}
              className="hidden"
            />

            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 size={20} className="mr-2 animate-spin" />
                  ) : (
                    <Upload size={20} className="mr-2" />
                  )}
                  Choose Torrent File
                </Button>

                {backendInfoHash && (
                  <Button variant="outline" onClick={handleRemoveTorrent}>
                    <Trash2 size={20} className="mr-2" />
                    Remove Current
                  </Button>
                )}
              </div>
            </div>

            {error && (
              <div className="mt-4 p-4 bg-red-500 border-2 border-[var(--border)] flex items-center gap-2">
                <AlertCircle size={20} />
                <span>{error}</span>
              </div>
            )}
          </Card.Content>
        </Card>

        {/* File Browser */}
        {torrentFiles.length > 0 && (
          <Card className="mb-8">
            <Card.Header>
              <Card.Title>
                <Folder className="inline mr-2" size={20} />
                Files in Torrent ({torrentFiles.length})
              </Card.Title>
              <Card.Description>
                <div className="flex gap-4 mt-2 text-xs flex-wrap">
                  <span className="flex items-center gap-1">
                    <FileVideo className="text-green-500" size={14} />
                    Direct play
                  </span>
                  <span className="flex items-center gap-1">
                    <FileVideo className="text-blue-500" size={14} />
                    Auto-remux (MKV/AVI)
                  </span>
                  <span className="flex items-center gap-1">
                    <FileVideo className="text-yellow-500" size={14} />
                    Limited support
                  </span>
                  <span className="flex items-center gap-1">
                    <FileVideo className="text-red-500" size={14} />
                    Not supported
                  </span>
                </div>
              </Card.Description>
            </Card.Header>
            <Card.Content>
              <div className="space-y-2">
                {torrentFiles.map((file, idx) => {
                  const fileProgress = file.length > 0
                    ? Math.round((file.downloaded / file.length) * 100)
                    : 0;

                  const fileInfo = getFileInfo(file.name);
                  const ext = file.name.split('.').pop()?.toLowerCase();
                  const isVideo = ['mp4', 'mkv', 'avi', 'webm', 'mov', 'flv', 'wmv', 'm4v']
                    .includes(ext || '');

                  return (
                    <div
                      key={idx}
                      className="border-2 border-[var(--border)] bg-[var(--card)] p-4 hover:bg-[var(--muted)] transition-colors"
                      title={fileInfo.tooltip}
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          {fileInfo.icon}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <div className="font-medium truncate">{file.name}</div>
                              {isVideo && fileInfo.badge}
                            </div>
                            <div className="text-sm text-[var(--muted-foreground)]">
                              {formatBytes(file.length)} • {fileProgress}% downloaded
                              {isVideo && !fileInfo.playable && (
                                <span className="ml-2 text-red-500">
                                  (Requires conversion)
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        {isVideo && (
                          <Button
                            onClick={() => handlePlayFile(file, idx)}
                            disabled={!fileInfo.playable}
                            size="sm"
                            variant={fileInfo.playable ? "default" : "outline"}
                            title={!fileInfo.playable ? "This format cannot be played in the browser" : "Stream this video"}
                          >
                            <Play size={16} className="mr-1" />
                            {fileInfo.playable ? 'Stream' : 'Not Supported'}
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card.Content>
          </Card>
        )}

        {/* Upload History */}
        {uploadedTorrents.length > 0 && (
          <Card>
            <Card.Header>
              <Card.Title>Recent Uploads</Card.Title>
              <Card.Description>
                Your torrent upload history
              </Card.Description>
            </Card.Header>
            <Card.Content>
              <div className="space-y-2">
                {uploadedTorrents.map((torrent) => (
                  <div
                    key={torrent.id}
                    className="border-2 border-[var(--border)] bg-[var(--card)] p-4 flex items-center justify-between"
                  >
                    <div>
                      <div className="font-medium">{torrent.name}</div>
                      <div className="text-sm text-[var(--muted-foreground)]">
                        {torrent.file_count} files • {torrent.total_size} •
                        {new Date(torrent.uploaded_at).toLocaleDateString()}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteFromHistory(torrent.id)}
                    >
                      <Trash2 size={20} />
                    </Button>
                  </div>
                ))}
              </div>
            </Card.Content>
          </Card>
        )}
      </main>
    </div>
  );
}

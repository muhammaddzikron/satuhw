import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { 
  Play, 
  Pause, 
  Square,
  SkipForward, 
  SkipBack, 
  Volume2, 
  VolumeX, 
  Music, 
  ArrowLeft, 
  Search, 
  RefreshCw, 
  X, 
  Repeat, 
  Repeat1, 
  Shuffle, 
  Download, 
  Share2, 
  FileText, 
  Sparkles, 
  Check, 
  Disc, 
  Radio,
  Sliders
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { sheetsService } from '../services/sheetsService';
import { useAuthStore } from '../store/useAuthStore';
import { formatAudioUrl } from '../utils/audioUtils';
import { resolveTrackMetadata } from '../data/playlistCatalog';
import { copyToClipboard } from '../lib/utils';

export const PlaylistPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const isAdmin = Boolean(user) && (user?.role === 'admin' || user?.role === 'superadmin');

  // Instant initial playlist from local cache or mock
  const [rawPlaylist, setRawPlaylist] = useState<any[]>(() => {
    const cached = localStorage.getItem('contents');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        const pl = parsed.filter((c: any) => c.section === 'playlist');
        if (pl.length > 0) return pl;
      } catch (e) {}
    }
    return sheetsService.getMockContents ? sheetsService.getMockContents().filter((c: any) => c.section === 'playlist') : [];
  });
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Player state
  const [currentTrackIndex, setCurrentTrackIndex] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [loopMode, setLoopMode] = useState<'off' | 'one' | 'all'>('all');
  const [isShuffle, setIsShuffle] = useState(false);
  const [isPlayerModalOpen, setIsPlayerModalOpen] = useState(false);

  // Modals & UI feedback
  const [selectedTrackForLyrics, setSelectedTrackForLyrics] = useState<any | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedLyrics, setCopiedLyrics] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Fetch playlist data
  const fetchPlaylist = useCallback(async () => {
    try {
      const data = await sheetsService.getContents('playlist');
      if (Array.isArray(data) && data.length > 0) {
        setRawPlaylist(data);
      } else {
        const mock = sheetsService.getMockContents ? sheetsService.getMockContents().filter((c: any) => c.section === 'playlist') : [];
        setRawPlaylist(mock);
      }
    } catch (error) {
      console.error('Error fetching playlist:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const unsub = sheetsService.subscribeToContents((contents: any[]) => {
      const pl = contents.filter((c: any) => c.section === 'playlist');
      if (pl.length > 0) {
        setRawPlaylist(pl);
        setLoading(false);
      }
    });

    fetchPlaylist();

    return () => {
      if (unsub) unsub();
    };
  }, [fetchPlaylist]);

  // Normalized tracks with enriched metadata (Pencipta, Lirik, Tema)
  const tracks = useMemo(() => {
    return (rawPlaylist || []).map((t, idx) => {
      const meta = resolveTrackMetadata(t);
      return {
        ...meta,
        index: idx
      };
    });
  }, [rawPlaylist]);

  // Filtered tracks based on title, creator, or lyrics
  const filteredTracks = useMemo(() => {
    const q = (searchQuery || '').toLowerCase().trim();
    if (!q) return tracks;
    return tracks.filter(track => {
      return (
        track.title.toLowerCase().includes(q) ||
        track.creator.toLowerCase().includes(q) ||
        track.lyrics.toLowerCase().includes(q)
      );
    });
  }, [tracks, searchQuery]);

  const currentTrack = useMemo(() => {
    if (currentTrackIndex === null || !tracks[currentTrackIndex]) return null;
    return tracks[currentTrackIndex];
  }, [currentTrackIndex, tracks]);

  // Format time utility
  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || seconds < 0) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Play / Pause track
  const handlePlayTrack = (trackIndex: number, openModal: boolean = true) => {
    if (currentTrackIndex === trackIndex) {
      if (isPlaying) {
        audioRef.current?.pause();
        setIsPlaying(false);
      } else {
        audioRef.current?.play().then(() => {
          setIsPlaying(true);
        }).catch(err => {
          console.warn('Play error:', err);
          setIsPlaying(false);
        });
      }
    } else {
      setCurrentTrackIndex(trackIndex);
      setIsPlaying(true);
    }
    if (openModal) {
      setIsPlayerModalOpen(true);
    }
  };

  // Stop track completely
  const handleStopTrack = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlaying(false);
    setCurrentTime(0);
  };

  // Close player modal completely
  const handleClosePlayerModal = (stopAudio: boolean = false) => {
    if (stopAudio && audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
      setCurrentTime(0);
    }
    setIsPlayerModalOpen(false);
  };

  // Audio source change listener
  useEffect(() => {
    if (currentTrackIndex !== null && audioRef.current && tracks[currentTrackIndex]) {
      const track = tracks[currentTrackIndex];
      const streamUrl = formatAudioUrl(track.audioUrl, track.raw?.updatedAt || track.id);
      
      audioRef.current.src = streamUrl;
      audioRef.current.load();
      
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPlaying(true);
          })
          .catch(err => {
            console.warn('Playback initiation warning:', err);
            setIsPlaying(false);
          });
      }
    }
  }, [currentTrackIndex, tracks]);

  // Play next track logic
  const handleNextTrack = useCallback(() => {
    if (tracks.length === 0) return;
    if (isShuffle) {
      const randomIndex = Math.floor(Math.random() * tracks.length);
      handlePlayTrack(randomIndex, isPlayerModalOpen);
      return;
    }
    const nextIndex = currentTrackIndex === null ? 0 : (currentTrackIndex + 1) % tracks.length;
    handlePlayTrack(nextIndex, isPlayerModalOpen);
  }, [tracks, currentTrackIndex, isShuffle, isPlayerModalOpen]);

  // Play previous track logic
  const handlePrevTrack = useCallback(() => {
    if (tracks.length === 0) return;
    const prevIndex = currentTrackIndex === null 
      ? tracks.length - 1 
      : (currentTrackIndex - 1 + tracks.length) % tracks.length;
    handlePlayTrack(prevIndex, isPlayerModalOpen);
  }, [tracks, currentTrackIndex, isPlayerModalOpen]);

  // Handle track ending
  const handleAudioEnded = () => {
    if (loopMode === 'one') {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(err => {
          console.warn('Loop playback warning:', err);
        });
      }
    } else if (loopMode === 'all') {
      handleNextTrack();
    } else {
      setIsPlaying(false);
    }
  };

  // Seek bar change
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setCurrentTime(val);
    if (audioRef.current) {
      audioRef.current.currentTime = val;
    }
  };

  // Volume change
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (audioRef.current) {
      audioRef.current.volume = val;
      if (val === 0) {
        setIsMuted(true);
      } else if (isMuted) {
        setIsMuted(false);
      }
    }
  };

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  // Cycle loop modes: off -> all -> one -> off
  const toggleLoopMode = () => {
    if (loopMode === 'off') setLoopMode('all');
    else if (loopMode === 'all') setLoopMode('one');
    else setLoopMode('off');
  };

  // Copy song link / lyrics
  const handleCopyLink = async (track: any) => {
    const url = track.audioUrl || window.location.href;
    await copyToClipboard(url);
    setCopiedId(track.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCopyLyrics = async (lyricsText: string) => {
    await copyToClipboard(lyricsText);
    setCopiedLyrics(true);
    setTimeout(() => setCopiedLyrics(false), 2000);
  };

  // Download audio
  const handleDownload = (track: any) => {
    const downloadUrl = formatAudioUrl(track.audioUrl, track.raw?.updatedAt || track.id);
    if (!downloadUrl) return;
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = `${track.title.replace(/[^a-zA-Z0-9_-]/g, '_')}.mp3`;
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-gray-800 pb-28 selection:bg-hw-green selection:text-white">
      {/* Top Header */}
      <header className="bg-white/95 backdrop-blur-md border-b border-gray-200 sticky top-0 z-30 px-4 sm:px-6 py-4 shadow-2xs">
        <div className="max-w-4xl mx-auto flex flex-col gap-3.5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <button 
                onClick={() => navigate(-1)}
                className="p-2.5 sm:p-3 bg-gray-100 hover:bg-hw-green/10 hover:text-hw-green rounded-2xl text-gray-600 transition-all cursor-pointer shrink-0"
                title="Kembali"
              >
                <ArrowLeft size={18} />
              </button>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="text-lg sm:text-xl font-display font-black text-gray-900 tracking-tight truncate">
                    Playlist Lagu HW
                  </h1>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold border border-emerald-200 shrink-0">
                    {tracks.length} Lagu
                  </span>
                </div>
                <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wider mt-0.5 flex items-center gap-1.5 truncate">
                  <Music size={12} className="text-hw-green shrink-0" />
                  Koleksi Mars, Hymne & Lagu Kepanduan Hizbul Wathan
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={fetchPlaylist}
                className="p-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-2xl transition-all cursor-pointer"
                title="Muat Ulang Playlist"
              >
                <RefreshCw size={16} className={loading ? 'animate-spin text-hw-green' : ''} />
              </button>
              {isAdmin && (
                <button
                  onClick={() => navigate('/admin', { state: { defaultTab: 'konten', defaultSection: 'playlist' } })}
                  className="px-3.5 py-2 bg-hw-dark hover:bg-black text-white text-xs font-bold rounded-2xl flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                >
                  <Sparkles size={14} className="text-hw-yellow" />
                  <span className="hidden sm:inline">Kelola Playlist</span>
                </button>
              )}
            </div>
          </div>

          {/* Search Bar & Actions */}
          <div className="flex flex-col sm:flex-row items-stretch gap-2.5">
            <div className="relative flex-1">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input 
                type="text" 
                placeholder="Cari judul lagu, nama pencipta, atau lirik..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 focus:border-hw-green focus:bg-white rounded-2xl py-3 pl-11 pr-10 text-xs sm:text-sm font-bold text-gray-800 placeholder:text-gray-400 focus:ring-4 focus:ring-hw-green/10 outline-none transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 p-1 rounded-full hover:bg-gray-200/60 transition-all cursor-pointer"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Quick Play All & Shuffle */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  if (tracks.length > 0) {
                    handlePlayTrack(0, true);
                  }
                }}
                className="flex-1 sm:flex-initial px-4 py-3 bg-hw-green hover:bg-emerald-600 active:scale-95 text-white font-bold text-xs rounded-2xl flex items-center justify-center gap-2 shadow-md shadow-hw-green/20 transition-all cursor-pointer"
              >
                <Play size={15} fill="currentColor" />
                <span>Putar Semua</span>
              </button>
              <button
                onClick={() => {
                  setIsShuffle(!isShuffle);
                  if (tracks.length > 0) {
                    const rand = Math.floor(Math.random() * tracks.length);
                    handlePlayTrack(rand, true);
                  }
                }}
                className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                  isShuffle 
                    ? 'bg-emerald-500 text-white border-emerald-600 shadow-sm' 
                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
                title={isShuffle ? 'Acak Lagu: Aktif' : 'Acak Lagu: Nonaktif'}
              >
                <Shuffle size={16} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area - Strictly Centered */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-6">
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center gap-4 text-center">
            <div className="w-16 h-16 rounded-full border-4 border-emerald-100 border-t-hw-green animate-spin" />
            <div>
              <p className="text-sm font-black text-gray-800">Menyiapkan Koleksi Lagu HW...</p>
              <p className="text-xs text-gray-400 font-bold mt-1">Mengambil audio resmi dan informasi pencipta</p>
            </div>
          </div>
        ) : filteredTracks.length === 0 ? (
          <div className="py-20 text-center bg-white rounded-3xl border border-gray-200 p-8 space-y-4 shadow-xs">
            <div className="w-16 h-16 bg-emerald-50 text-hw-green rounded-3xl mx-auto flex items-center justify-center">
              <Music size={32} />
            </div>
            <div>
              <h3 className="text-base font-black text-gray-800">Lagu Tidak Ditemukan</h3>
              <p className="text-xs text-gray-500 font-medium max-w-md mx-auto mt-1">
                Tidak ada lagu atau mars yang cocok dengan kata kunci &quot;{searchQuery}&quot;. Coba cari judul lagu, nama pencipta, atau potongan lirik lainnya.
              </p>
            </div>
            <button
              onClick={() => setSearchQuery('')}
              className="px-5 py-2.5 bg-hw-green text-white rounded-xl text-xs font-bold hover:bg-emerald-600 transition-all cursor-pointer"
            >
              Reset Pencarian
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            
            {/* Active Now Playing Banner (Click to open centered player) */}
            {currentTrack && (
              <div 
                onClick={() => setIsPlayerModalOpen(true)}
                className="bg-linear-to-r from-slate-900 via-emerald-950 to-slate-900 text-white rounded-3xl p-4 sm:p-5 border border-emerald-500/30 shadow-lg cursor-pointer hover:border-emerald-400 transition-all group relative overflow-hidden"
              >
                <div className="flex items-center justify-between gap-3 relative z-10">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="relative shrink-0">
                      <div className={`w-12 h-12 rounded-2xl bg-linear-to-br ${currentTrack.theme.gradient} flex items-center justify-center shadow-md border border-white/20 overflow-hidden`}>
                        <Disc size={24} className={`text-white ${isPlaying ? 'animate-spin-slow' : ''}`} />
                      </div>
                      {isPlaying && (
                        <span className="absolute -top-1 -right-1 flex h-3 w-3">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                        </span>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[9px] font-black uppercase tracking-wider border border-emerald-500/30 flex items-center gap-1">
                          <Radio size={9} className={isPlaying ? 'animate-pulse' : ''} />
                          {isPlaying ? 'Sedang Diputar' : 'Terpilih'}
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-white truncate">
                        {currentTrack.title}
                      </h3>
                      <p className="text-[11px] text-emerald-400 font-semibold truncate">
                        Cipt: {currentTrack.creator}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePlayTrack(currentTrack.index, false);
                      }}
                      className="w-10 h-10 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex items-center justify-center shadow-md transition-all active:scale-95"
                      title={isPlaying ? "Jeda" : "Putar"}
                    >
                      {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" className="ml-0.5" />}
                    </button>
                    <span className="text-xs text-emerald-300 font-bold hidden sm:inline group-hover:underline">
                      Buka Pemutar Musik &rarr;
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Song Cards List: Ultra Clean & Responsive (No Overlapping on Mobile) */}
            <div className="space-y-3.5">
              {filteredTracks.map((track) => {
                const isCurrent = currentTrackIndex === track.index;
                const isThisPlaying = isCurrent && isPlaying;

                return (
                  <div
                    key={track.id || track.index}
                    className={`w-full rounded-2xl sm:rounded-3xl border transition-all duration-200 p-4 sm:p-5 ${
                      isCurrent
                        ? 'bg-linear-to-r from-emerald-50/95 via-white to-teal-50/70 border-emerald-400 shadow-md shadow-emerald-500/10 ring-2 ring-emerald-500/20'
                        : 'bg-white hover:bg-emerald-50/20 border-gray-200 hover:border-emerald-300 shadow-2xs hover:shadow-md'
                    }`}
                  >
                    {/* Top Row: Track Number + Disc + Full Title + Category + Creator */}
                    <div className="flex items-start gap-3.5 sm:gap-4">
                      {/* Number Index */}
                      <span className="w-5 text-center text-xs font-mono font-bold text-gray-400 pt-1 shrink-0">
                        #{track.index + 1}
                      </span>

                      {/* Vinyl Disc Icon */}
                      <div className="relative shrink-0">
                        <div className={`w-13 h-13 sm:w-16 sm:h-16 rounded-2xl bg-linear-to-br ${track.theme.gradient} flex items-center justify-center text-white shadow-md border border-white/20 overflow-hidden`}>
                          <Disc size={26} className={isThisPlaying ? 'animate-spin-slow' : ''} />
                        </div>
                        {isThisPlaying && (
                          <div className="absolute inset-0 bg-black/40 rounded-2xl flex items-center justify-center gap-0.5">
                            {[0.5, 0.8, 0.4, 0.9].map((h, i) => (
                              <motion.div
                                key={i}
                                animate={{ height: ['25%', '85%', '30%'] }}
                                transition={{ repeat: Infinity, duration: h, delay: i * 0.15 }}
                                className="w-1 bg-hw-yellow rounded-full"
                              />
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Text Column: Title, Creator */}
                      <div className="flex-1 min-w-0">
                        {/* Status when playing */}
                        {isThisPlaying && (
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md animate-pulse flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                              Sedang Diputar
                            </span>
                          </div>
                        )}

                        {/* Song Title (Wraps naturally without overflowing) */}
                        <h3 className={`text-sm sm:text-base font-display font-black leading-snug break-words ${isCurrent ? 'text-emerald-950' : 'text-gray-900'}`}>
                          {track.title}
                        </h3>

                        {/* Creator Info */}
                        <div className="mt-1.5 flex items-center">
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-emerald-50 text-emerald-900 text-xs font-bold border border-emerald-200/80">
                            <Sparkles size={11} className="text-amber-500 shrink-0" />
                            <span className="text-emerald-700 font-extrabold text-[10px] uppercase">Cipt:</span>
                            <span className="font-semibold text-gray-800 break-words">{track.creator}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Action Row: Clear separation, perfectly responsive */}
                    <div className="mt-3.5 pt-3 border-t border-gray-100 flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setSelectedTrackForLyrics(track)}
                          className="px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-emerald-100 hover:text-emerald-800 text-gray-700 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                          title="Lihat Lirik Lagu Lengkap"
                        >
                          <FileText size={14} />
                          <span>Lirik</span>
                        </button>
                        
                        <button
                          type="button"
                          onClick={() => handleCopyLink(track)}
                          className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-900 transition-all cursor-pointer"
                          title="Salin Link Lagu"
                        >
                          {copiedId === track.id ? <Check size={14} className="text-emerald-600" /> : <Share2 size={14} />}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDownload(track)}
                          className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-900 transition-all cursor-pointer"
                          title="Unduh File Audio"
                        >
                          <Download size={14} />
                        </button>
                      </div>

                      {/* Main Play Button for this Track */}
                      <button
                        type="button"
                        onClick={() => handlePlayTrack(track.index, true)}
                        className={`px-4 sm:px-5 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 shadow-xs ${
                          isThisPlaying
                            ? 'bg-hw-green text-white shadow-emerald-500/25 ring-2 ring-hw-green/30'
                            : isCurrent
                            ? 'bg-hw-dark text-white hover:bg-black'
                            : 'bg-emerald-50 hover:bg-hw-green text-emerald-900 hover:text-white border border-emerald-200/60'
                        }`}
                      >
                        {isThisPlaying ? (
                          <>
                            <Pause size={14} fill="currentColor" />
                            <span>Jeda</span>
                          </>
                        ) : (
                          <>
                            <Play size={14} fill="currentColor" className="ml-0.5" />
                            <span>Putar Lagu</span>
                          </>
                        )}
                      </button>
                    </div>

                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      {/* CENTERED MUSIC PLAYER MODAL (Pop-up di Tengah Layar dengan Tombol X / Close) */}
      <AnimatePresence>
        {isPlayerModalOpen && currentTrack && (
          <motion.div 
            key="playlist-player-modal-container"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md"
          >
            <div
              className="absolute inset-0"
              onClick={() => handleClosePlayerModal(false)}
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="bg-slate-950 text-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-emerald-500/30 flex flex-col relative z-10"
            >
              {/* Header with Title & Large Close Button */}
              <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between relative z-10">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-black uppercase tracking-wider border border-emerald-500/30 flex items-center gap-1.5">
                    <Radio size={12} className={isPlaying ? 'animate-pulse text-emerald-400' : ''} />
                    {isPlaying ? 'Memutar Audio' : 'Pemutar Musik'}
                  </span>
                </div>

                {/* X / CLOSE BUTTON */}
                <button
                  type="button"
                  onClick={() => handleClosePlayerModal(false)}
                  className="w-9 h-9 rounded-full bg-white/10 hover:bg-rose-600 text-gray-300 hover:text-white flex items-center justify-center transition-all cursor-pointer active:scale-90"
                  title="Tutup Pemutar Musik (X)"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Center Vinyl Disc Visualizer */}
              <div className="p-6 sm:p-8 flex flex-col items-center justify-center text-center relative overflow-hidden bg-radial from-emerald-950/40 to-slate-950">
                <div className="relative my-2">
                  {/* Outer Glow */}
                  <div className={`absolute -inset-4 rounded-full bg-emerald-500/20 blur-xl transition-opacity ${isPlaying ? 'opacity-100 animate-pulse' : 'opacity-20'}`} />
                  
                  {/* Vinyl Disc */}
                  <div className={`w-36 h-36 sm:w-44 sm:h-44 rounded-full bg-linear-to-br ${currentTrack.theme.gradient} flex items-center justify-center text-white shadow-2xl border-4 border-white/20 overflow-hidden relative`}>
                    <Disc size={84} className={isPlaying ? 'animate-spin-slow' : ''} />
                    <div className="absolute w-10 h-10 rounded-full bg-slate-950 border-2 border-white/30" />
                  </div>
                </div>

                {/* Song Title & Creator */}
                <div className="mt-5 space-y-1.5 max-w-xs">
                  <h3 className="text-lg sm:text-xl font-display font-black text-white leading-snug break-words">
                    {currentTrack.title}
                  </h3>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-bold">
                    <Sparkles size={12} className="text-amber-400 shrink-0" />
                    <span>Cipt:</span>
                    <span className="text-white">{currentTrack.creator}</span>
                  </div>
                </div>
              </div>

              {/* Progress Seek Bar */}
              <div className="px-6 space-y-1.5">
                <div className="relative flex items-center">
                  <input
                    type="range"
                    min={0}
                    max={duration || 100}
                    step={0.1}
                    value={currentTime}
                    onChange={handleSeek}
                    className="w-full h-2 bg-white/15 rounded-lg appearance-none cursor-pointer accent-emerald-400 hover:h-2.5 transition-all"
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] font-mono font-bold text-gray-400 px-1">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>

              {/* Playback Controls (Shuffle, Prev, Stop, Play/Pause, Next, Loop) */}
              <div className="p-6 pt-3 flex flex-col gap-4">
                <div className="flex items-center justify-center gap-3 sm:gap-4">
                  {/* Shuffle Toggle */}
                  <button
                    type="button"
                    onClick={() => setIsShuffle(!isShuffle)}
                    className={`p-2.5 rounded-2xl transition-all cursor-pointer ${
                      isShuffle ? 'text-emerald-400 bg-emerald-950/80 border border-emerald-500/40' : 'text-gray-400 hover:text-white'
                    }`}
                    title={isShuffle ? 'Shuffle Aktif' : 'Shuffle Nonaktif'}
                  >
                    <Shuffle size={18} />
                  </button>

                  {/* Previous */}
                  <button
                    type="button"
                    onClick={handlePrevTrack}
                    className="p-3 text-gray-300 hover:text-white active:scale-90 transition-transform cursor-pointer"
                    title="Lagu Sebelumnya"
                  >
                    <SkipBack size={22} fill="currentColor" />
                  </button>

                  {/* Stop Track */}
                  <button
                    type="button"
                    onClick={handleStopTrack}
                    className="w-11 h-11 bg-white/10 hover:bg-rose-500 active:scale-90 text-gray-300 hover:text-white rounded-2xl flex items-center justify-center border border-white/10 shadow-md transition-all cursor-pointer"
                    title="Hentikan Lagu (Stop)"
                  >
                    <Square size={16} fill="currentColor" />
                  </button>

                  {/* Main Play / Pause */}
                  <button
                    type="button"
                    onClick={() => handlePlayTrack(currentTrack.index, false)}
                    className="w-14 h-14 bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 rounded-2xl flex items-center justify-center shadow-xl shadow-emerald-500/30 transition-all cursor-pointer"
                    title={isPlaying ? "Jeda" : "Putar"}
                  >
                    {isPlaying ? (
                      <Pause size={24} fill="currentColor" />
                    ) : (
                      <Play size={24} fill="currentColor" className="ml-0.5" />
                    )}
                  </button>

                  {/* Next */}
                  <button
                    type="button"
                    onClick={handleNextTrack}
                    className="p-3 text-gray-300 hover:text-white active:scale-90 transition-transform cursor-pointer"
                    title="Lagu Selanjutnya"
                  >
                    <SkipForward size={22} fill="currentColor" />
                  </button>

                  {/* Loop Toggle */}
                  <button
                    type="button"
                    onClick={toggleLoopMode}
                    className={`p-2.5 rounded-2xl transition-all cursor-pointer ${
                      loopMode !== 'off' ? 'text-emerald-400 bg-emerald-950/80 border border-emerald-500/40' : 'text-gray-400 hover:text-white'
                    }`}
                    title={`Ulangi: ${loopMode === 'all' ? 'Semua' : loopMode === 'one' ? 'Satu Lagu' : 'Mati'}`}
                  >
                    {loopMode === 'one' ? <Repeat1 size={18} /> : <Repeat size={18} />}
                  </button>
                </div>

                {/* Footer Utility Row: Lirik, Unduh, Bagikan & Volume */}
                <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setSelectedTrackForLyrics(currentTrack)}
                      className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <FileText size={14} />
                      <span>Lirik</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDownload(currentTrack)}
                      className="p-2 bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white rounded-xl transition-all cursor-pointer"
                      title="Unduh MP3"
                    >
                      <Download size={15} />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleCopyLink(currentTrack)}
                      className="p-2 bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white rounded-xl transition-all cursor-pointer"
                      title="Salin Link"
                    >
                      {copiedId === currentTrack.id ? <Check size={15} className="text-emerald-400" /> : <Share2 size={15} />}
                    </button>
                  </div>

                  {/* Volume Control */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={toggleMute}
                      className="text-gray-400 hover:text-white transition-colors p-1 cursor-pointer"
                    >
                      {isMuted || volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
                    </button>
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.05}
                      value={isMuted ? 0 : volume}
                      onChange={handleVolumeChange}
                      className="w-16 h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-emerald-400"
                    />
                  </div>
                </div>

              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lyrics & Song Detail Modal Sheet - Centered */}
      <AnimatePresence>
        {selectedTrackForLyrics && (
          <motion.div 
            key="playlist-lyrics-modal-container"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          >
            <div
              className="absolute inset-0"
              onClick={() => setSelectedTrackForLyrics(null)}
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border border-gray-200 flex flex-col max-h-[85vh] relative z-10"
            >
              {/* Header with gradient theme */}
              <div className={`p-6 bg-linear-to-br ${selectedTrackForLyrics.theme.gradient} text-white relative`}>
                <button
                  type="button"
                  onClick={() => setSelectedTrackForLyrics(null)}
                  className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 rounded-full text-white transition-all cursor-pointer"
                  title="Tutup Modal (X)"
                >
                  <X size={18} />
                </button>

                <h3 className="text-xl sm:text-2xl font-display font-black text-white leading-tight">
                  {selectedTrackForLyrics.title}
                </h3>

                {/* Composer info in Modal */}
                <div className="mt-3 p-3 rounded-2xl bg-black/30 backdrop-blur-xs border border-white/20 flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-400/20 text-amber-300 flex items-center justify-center shrink-0">
                    <Sparkles size={16} />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] font-black uppercase text-amber-300 tracking-wider block">
                      Diciptakan / Digubah Oleh
                    </span>
                    <p className="text-xs sm:text-sm font-black text-white truncate">
                      {selectedTrackForLyrics.creator}
                    </p>
                  </div>
                </div>
              </div>

              {/* Lyrics Scrollable Body */}
              <div className="p-6 overflow-y-auto space-y-4 flex-1">
                <div className="flex items-center justify-between pb-2 border-b border-gray-150">
                  <h4 className="text-xs font-black uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                    <FileText size={14} className="text-hw-green" />
                    Lirik Lagu
                  </h4>
                  
                  <button
                    type="button"
                    onClick={() => handleCopyLyrics(selectedTrackForLyrics.lyrics)}
                    className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border border-emerald-200"
                  >
                    {copiedLyrics ? (
                      <>
                        <Check size={14} className="text-emerald-600" />
                        <span>Tersalin!</span>
                      </>
                    ) : (
                      <>
                        <Share2 size={14} />
                        <span>Salin Lirik</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="bg-gray-50 p-4 sm:p-5 rounded-2xl border border-gray-150">
                  <pre className="whitespace-pre-wrap font-sans text-xs sm:text-sm font-semibold text-gray-800 leading-relaxed">
                    {selectedTrackForLyrics.lyrics}
                  </pre>
                </div>
              </div>

              {/* Modal Footer Controls */}
              <div className="p-4 bg-gray-50 border-t border-gray-150 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => handleDownload(selectedTrackForLyrics)}
                  className="px-4 py-2.5 bg-white border border-gray-200 hover:bg-gray-100 text-gray-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Download size={14} />
                  <span>Unduh Lagu</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    handlePlayTrack(selectedTrackForLyrics.index, true);
                    setSelectedTrackForLyrics(null);
                  }}
                  className="px-5 py-2.5 bg-hw-green hover:bg-emerald-600 text-white rounded-xl text-xs font-black flex items-center gap-2 shadow-md shadow-hw-green/20 transition-all cursor-pointer"
                >
                  <Play size={14} fill="currentColor" />
                  <span>Putar Sekarang</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hidden Audio Element for Playback */}
      <audio 
        ref={audioRef}
        onTimeUpdate={() => {
          if (audioRef.current) {
            setCurrentTime(audioRef.current.currentTime);
          }
        }}
        onLoadedMetadata={() => {
          if (audioRef.current) {
            setDuration(audioRef.current.duration);
          }
        }}
        onEnded={handleAudioEnded}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onError={() => {
          setIsPlaying(false);
        }}
      />
    </div>
  );
};

export default PlaylistPage;

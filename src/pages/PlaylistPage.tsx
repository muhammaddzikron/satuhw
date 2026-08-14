import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { 
  Play, 
  Pause, 
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
  RotateCcw,
  RotateCw,
  Disc,
  Info,
  Radio
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { sheetsService } from '../services/sheetsService';
import { useAuthStore } from '../store/useAuthStore';
import { formatAudioUrl } from '../utils/audioUtils';
import { resolveTrackMetadata } from '../data/playlistCatalog';

export const PlaylistPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const isAdmin = Boolean(user) && (user?.role === 'admin' || user?.role === 'superadmin');

  const [rawPlaylist, setRawPlaylist] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Semua');

  // Player state
  const [currentTrackIndex, setCurrentTrackIndex] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [autoPlayEnabled, setAutoPlayEnabled] = useState(true);
  const [loopMode, setLoopMode] = useState<'off' | 'one' | 'all'>('all');
  const [isShuffle, setIsShuffle] = useState(false);

  // Modals & UI feedback
  const [selectedTrackForLyrics, setSelectedTrackForLyrics] = useState<any | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedLyrics, setCopiedLyrics] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Fetch playlist data
  const fetchPlaylist = useCallback(async () => {
    setLoading(true);
    try {
      const data = await sheetsService.getContents('playlist');
      if (Array.isArray(data) && data.length > 0) {
        setRawPlaylist(data);
      } else {
        // Fallback to default enriched mock list from service
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
    fetchPlaylist();
  }, [fetchPlaylist]);

  // Normalized tracks with enriched metadata (Pencipta, Kategori, Lirik, Tema)
  const tracks = useMemo(() => {
    return (rawPlaylist || []).map((t, idx) => {
      const meta = resolveTrackMetadata(t);
      return {
        ...meta,
        index: idx
      };
    });
  }, [rawPlaylist]);

  // Distinct categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    tracks.forEach(t => {
      if (t.category) set.add(t.category);
    });
    return ['Semua', ...Array.from(set)];
  }, [tracks]);

  // Filtered tracks
  const filteredTracks = useMemo(() => {
    const q = (searchQuery || '').toLowerCase().trim();
    return tracks.filter(track => {
      const matchQuery = !q || 
        track.title.toLowerCase().includes(q) ||
        track.creator.toLowerCase().includes(q) ||
        track.category.toLowerCase().includes(q) ||
        track.lyrics.toLowerCase().includes(q);

      const matchCat = selectedCategory === 'Semua' || track.category === selectedCategory;

      return matchQuery && matchCat;
    });
  }, [tracks, searchQuery, selectedCategory]);

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

  // Play a specific track
  const handlePlayTrack = (trackIndex: number) => {
    if (currentTrackIndex === trackIndex) {
      if (isPlaying) {
        audioRef.current?.pause();
        setIsPlaying(false);
      } else {
        audioRef.current?.play().catch(err => {
          console.warn('Play error:', err);
        });
        setIsPlaying(true);
      }
    } else {
      setCurrentTrackIndex(trackIndex);
      setIsPlaying(true);
    }
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
      handlePlayTrack(randomIndex);
      return;
    }
    const nextIndex = currentTrackIndex === null ? 0 : (currentTrackIndex + 1) % tracks.length;
    handlePlayTrack(nextIndex);
  }, [tracks, currentTrackIndex, isShuffle]);

  // Play previous track logic
  const handlePrevTrack = useCallback(() => {
    if (tracks.length === 0) return;
    const prevIndex = currentTrackIndex === null 
      ? tracks.length - 1 
      : (currentTrackIndex - 1 + tracks.length) % tracks.length;
    handlePlayTrack(prevIndex);
  }, [tracks, currentTrackIndex]);

  // Handle track ending
  const handleAudioEnded = () => {
    if (loopMode === 'one') {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play();
      }
    } else if (loopMode === 'all' || autoPlayEnabled) {
      handleNextTrack();
    } else {
      setIsPlaying(false);
    }
  };

  // Skip forward 10s
  const handleSkipForward = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.min(audioRef.current.currentTime + 10, duration);
    }
  };

  // Skip backward 10s
  const handleSkipBackward = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.max(audioRef.current.currentTime - 10, 0);
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
  const handleCopyLink = (track: any) => {
    const url = track.audioUrl || window.location.href;
    navigator.clipboard.writeText(url);
    setCopiedId(track.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCopyLyrics = (lyricsText: string) => {
    navigator.clipboard.writeText(lyricsText);
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
    <div className="min-h-screen bg-linear-to-b from-slate-50 via-gray-50 to-emerald-50/30 text-gray-800 pb-44 selection:bg-hw-green selection:text-white">
      {/* Top Header */}
      <header className="bg-white/90 backdrop-blur-md border-b border-gray-150 sticky top-0 z-30 px-4 sm:px-6 py-4 shadow-2xs">
        <div className="max-w-6xl mx-auto flex flex-col gap-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => navigate(-1)}
                className="p-2.5 sm:p-3 bg-gray-100/80 hover:bg-hw-green/10 hover:text-hw-green rounded-2xl text-gray-600 transition-all cursor-pointer"
                title="Kembali"
              >
                <ArrowLeft size={18} />
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg sm:text-xl font-display font-black text-gray-900 tracking-tight">
                    Playlist & Mars HW
                  </h1>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold border border-emerald-200">
                    {tracks.length} Audio
                  </span>
                </div>
                <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wider mt-0.5 flex items-center gap-1.5">
                  <Music size={12} className="text-hw-green" />
                  Mars, Hymne & Lagu Kepanduan Hizbul Wathan
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
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

          {/* Search Bar & Clear Filter */}
          <div className="flex flex-col sm:flex-row items-stretch gap-2.5">
            <div className="relative flex-1">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input 
                type="text" 
                placeholder="Cari judul lagu, nama pencipta (Muhammad Dzikron), atau lirik..."
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

            {/* Quick Play All button */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  if (tracks.length > 0) {
                    handlePlayTrack(0);
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
                  if (!isPlaying && tracks.length > 0) {
                    const rand = Math.floor(Math.random() * tracks.length);
                    handlePlayTrack(rand);
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

          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-hw-dark text-white shadow-xs scale-102'
                    : 'bg-gray-100/90 text-gray-600 hover:bg-gray-200/70'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-6">
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center gap-4 text-center">
            <div className="w-16 h-16 rounded-full border-4 border-emerald-100 border-t-hw-green animate-spin" />
            <div>
              <p className="text-sm font-black text-gray-800">Menyiapkan Koleksi Lagu HW...</p>
              <p className="text-xs text-gray-400 font-bold mt-1">Mengambil audio resmi dan informasi pencipta</p>
            </div>
          </div>
        ) : filteredTracks.length === 0 ? (
          <div className="py-20 text-center bg-white rounded-3xl border border-gray-200/80 p-8 space-y-4 shadow-xs">
            <div className="w-16 h-16 bg-emerald-50 text-hw-green rounded-3xl mx-auto flex items-center justify-center">
              <Music size={32} />
            </div>
            <div>
              <h3 className="text-base font-black text-gray-800">Lagu Tidak Ditemukan</h3>
              <p className="text-xs text-gray-500 font-medium max-w-md mx-auto mt-1">
                Tidak ada lagu atau mars yang cocok dengan kata kunci &quot;{searchQuery}&quot;. Coba cari judul lagu atau nama pencipta lainnya.
              </p>
            </div>
            <button
              onClick={() => { setSearchQuery(''); setSelectedCategory('Semua'); }}
              className="px-5 py-2.5 bg-hw-green text-white rounded-xl text-xs font-bold hover:bg-emerald-600 transition-all cursor-pointer"
            >
              Reset Pencarian
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Featured Now Playing Spotlight Hero if playing */}
            {currentTrack && (
              <div className="bg-linear-to-r from-slate-900 via-emerald-950 to-slate-900 text-white rounded-3xl p-5 sm:p-6 border border-emerald-500/20 shadow-xl relative overflow-hidden">
                <div className="absolute right-0 top-0 bottom-0 w-1/2 opacity-10 pointer-events-none flex items-center justify-end pr-6">
                  <Disc size={260} className={isPlaying ? 'animate-spin-slow text-white' : 'text-white'} />
                </div>

                <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="relative shrink-0">
                      <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-linear-to-br ${currentTrack.theme.gradient} flex items-center justify-center shadow-lg border border-white/20 overflow-hidden`}>
                        <Disc size={36} className={`text-white/90 ${isPlaying ? 'animate-spin-slow' : ''}`} />
                      </div>
                      {isPlaying && (
                        <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500"></span>
                        </span>
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 text-[10px] font-black uppercase tracking-widest border border-emerald-500/30 flex items-center gap-1">
                          <Radio size={10} className={isPlaying ? 'animate-pulse' : ''} />
                          {isPlaying ? 'Sedang Diputar' : 'Terpilih'}
                        </span>
                        <span className="text-[10px] text-gray-300 font-bold truncate">
                          {currentTrack.category}
                        </span>
                      </div>
                      <h2 className="text-base sm:text-xl font-display font-black text-white truncate drop-shadow-xs">
                        {currentTrack.title}
                      </h2>
                      
                      {/* Creator badge in Spotlight */}
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <span className="text-[11px] font-extrabold text-emerald-400 bg-emerald-950/80 px-2.5 py-0.5 rounded-lg border border-emerald-500/40 inline-flex items-center gap-1.5">
                          <Sparkles size={11} className="text-hw-yellow" />
                          <span>Ciptaan:</span>
                          <span className="text-white font-black">{currentTrack.creator}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end pt-2 sm:pt-0 border-t border-white/10 sm:border-t-0">
                    <button
                      onClick={() => setSelectedTrackForLyrics(currentTrack)}
                      className="px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer backdrop-blur-xs"
                    >
                      <FileText size={14} />
                      <span>Lirik Lagu</span>
                    </button>
                    <button
                      onClick={() => handlePlayTrack(currentTrack.index)}
                      className="px-5 py-2.5 rounded-xl bg-hw-green hover:bg-emerald-400 active:scale-95 text-slate-950 text-xs font-black flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-emerald-500/20"
                    >
                      {isPlaying ? (
                        <>
                          <Pause size={16} fill="currentColor" />
                          <span>Jeda</span>
                        </>
                      ) : (
                        <>
                          <Play size={16} fill="currentColor" />
                          <span>Putar</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Song Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTracks.map((track) => {
                const isCurrent = currentTrackIndex === track.index;
                const isThisPlaying = isCurrent && isPlaying;

                return (
                  <div
                    key={track.id || track.index}
                    className={`rounded-3xl border p-4 sm:p-5 transition-all duration-200 flex flex-col justify-between gap-4 group ${
                      isCurrent
                        ? 'bg-linear-to-br from-emerald-50/90 via-white to-teal-50/60 border-hw-green shadow-md shadow-hw-green/10 ring-2 ring-hw-green/20'
                        : 'bg-white hover:bg-gray-50/80 border-gray-150 hover:border-gray-300 shadow-2xs hover:shadow-md'
                    }`}
                  >
                    {/* Top Row: Disc cover + Title + Category */}
                    <div className="flex items-start gap-3.5">
                      {/* Vinyl / Cover badge */}
                      <div className="relative shrink-0">
                        <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-linear-to-br ${track.theme.gradient} flex items-center justify-center text-white shadow-md border border-white/20 transition-transform group-hover:scale-105 overflow-hidden`}>
                          <Disc size={28} className={isThisPlaying ? 'animate-spin-slow' : ''} />
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

                      {/* Info & Creator */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md border tracking-wider truncate ${track.theme.bgBadge}`}>
                            {track.category}
                          </span>
                          <span className="text-[10px] font-mono font-bold text-gray-400 shrink-0">
                            #{track.index + 1}
                          </span>
                        </div>

                        <h3 className={`text-sm sm:text-base font-display font-black leading-snug line-clamp-2 ${isCurrent ? 'text-emerald-950' : 'text-gray-900'}`}>
                          {track.title}
                        </h3>

                        {/* PROMINENT CREATOR DISPLAY (Nama Pencipta Lagu) */}
                        <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-linear-to-r from-emerald-50 to-teal-50 text-emerald-900 text-[11px] font-bold border border-emerald-200/80 shadow-2xs">
                            <Sparkles size={12} className="text-amber-500 shrink-0" />
                            <span className="text-emerald-700 font-extrabold text-[10px] uppercase tracking-wider">Cipt:</span>
                            <span className="font-black text-gray-900 truncate max-w-[180px]" title={track.creator}>
                              {track.creator}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Action Bar for Card */}
                    <div className="pt-3 border-t border-gray-150 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setSelectedTrackForLyrics(track)}
                          className="px-2.5 py-1.5 rounded-xl bg-gray-100 hover:bg-emerald-100/70 hover:text-emerald-800 text-gray-600 text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer"
                          title="Lihat Lirik Lagu Lengkap"
                        >
                          <FileText size={13} />
                          <span>Lirik</span>
                        </button>
                        
                        <button
                          type="button"
                          onClick={() => handleCopyLink(track)}
                          className="p-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-800 transition-all cursor-pointer"
                          title="Salin Link Lagu"
                        >
                          {copiedId === track.id ? <Check size={13} className="text-emerald-600" /> : <Share2 size={13} />}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDownload(track)}
                          className="p-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-800 transition-all cursor-pointer"
                          title="Unduh File Audio"
                        >
                          <Download size={13} />
                        </button>
                      </div>

                      {/* Play Button */}
                      <button
                        type="button"
                        onClick={() => handlePlayTrack(track.index)}
                        className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer active:scale-95 shadow-sm ${
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
                            <span>Putar</span>
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

      {/* Floating Modern Audio Player Bar */}
      <AnimatePresence>
        {currentTrack && (
          <motion.div 
            initial={{ y: 120, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 120, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 z-40 p-2 sm:p-4 pointer-events-none"
          >
            <div className="max-w-4xl mx-auto pointer-events-auto">
              <div className="bg-slate-950/95 text-white backdrop-blur-xl rounded-3xl p-3.5 sm:p-4 border border-emerald-500/30 shadow-2xl shadow-slate-950/70 flex flex-col gap-2.5">
                
                {/* Seek Bar Slider */}
                <div className="flex items-center gap-2.5 px-1">
                  <span className="text-[10px] font-mono font-bold text-gray-400 w-8 text-right shrink-0">
                    {formatTime(currentTime)}
                  </span>
                  
                  <div className="relative flex-1 flex items-center group cursor-pointer">
                    <input
                      type="range"
                      min={0}
                      max={duration || 100}
                      step={0.1}
                      value={currentTime}
                      onChange={handleSeek}
                      className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-emerald-400 hover:h-2 transition-all"
                    />
                  </div>

                  <span className="text-[10px] font-mono font-bold text-gray-400 w-8 shrink-0">
                    {formatTime(duration)}
                  </span>
                </div>

                {/* Main Player Row */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
                  
                  {/* Left: Track Details & Creator */}
                  <div className="flex items-center gap-3 min-w-0 w-full sm:w-1/3">
                    <div className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-linear-to-br ${currentTrack.theme.gradient} flex items-center justify-center text-white shrink-0 shadow-md border border-white/20 overflow-hidden`}>
                      <Disc size={22} className={isPlaying ? 'animate-spin-slow' : ''} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs sm:text-sm font-bold text-white truncate" title={currentTrack.title}>
                        {currentTrack.title}
                      </h4>
                      {/* Creator badge in bottom bar */}
                      <p className="text-[11px] text-emerald-400 font-bold truncate flex items-center gap-1 mt-0.5">
                        <Sparkles size={10} className="text-hw-yellow shrink-0" />
                        <span>Cipt:</span>
                        <span className="text-gray-200 font-semibold">{currentTrack.creator}</span>
                      </p>
                    </div>
                  </div>

                  {/* Center: Playback Controls */}
                  <div className="flex items-center justify-center gap-2 sm:gap-3 w-full sm:w-auto">
                    {/* Shuffle */}
                    <button
                      onClick={() => setIsShuffle(!isShuffle)}
                      className={`p-2 rounded-xl transition-all cursor-pointer ${
                        isShuffle ? 'text-emerald-400 bg-emerald-950/60' : 'text-gray-400 hover:text-white'
                      }`}
                      title={isShuffle ? 'Shuffle Aktif' : 'Shuffle Nonaktif'}
                    >
                      <Shuffle size={16} />
                    </button>

                    {/* Prev */}
                    <button
                      onClick={handlePrevTrack}
                      className="p-2 text-gray-300 hover:text-white transition-colors cursor-pointer"
                      title="Lagu Sebelumnya"
                    >
                      <SkipBack size={18} fill="currentColor" />
                    </button>

                    {/* 10s Rewind */}
                    <button
                      onClick={handleSkipBackward}
                      className="p-2 text-gray-400 hover:text-white transition-colors cursor-pointer"
                      title="Mundur 10 Detik"
                    >
                      <RotateCcw size={16} />
                    </button>

                    {/* Big Play / Pause */}
                    <button
                      onClick={() => handlePlayTrack(currentTrack.index)}
                      className="w-11 h-11 sm:w-12 sm:h-12 bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/30 transition-all cursor-pointer"
                    >
                      {isPlaying ? (
                        <Pause size={20} fill="currentColor" />
                      ) : (
                        <Play size={20} fill="currentColor" className="ml-0.5" />
                      )}
                    </button>

                    {/* 10s Forward */}
                    <button
                      onClick={handleSkipForward}
                      className="p-2 text-gray-400 hover:text-white transition-colors cursor-pointer"
                      title="Maju 10 Detik"
                    >
                      <RotateCw size={16} />
                    </button>

                    {/* Next */}
                    <button
                      onClick={handleNextTrack}
                      className="p-2 text-gray-300 hover:text-white transition-colors cursor-pointer"
                      title="Lagu Selanjutnya"
                    >
                      <SkipForward size={18} fill="currentColor" />
                    </button>

                    {/* Loop Toggle */}
                    <button
                      onClick={toggleLoopMode}
                      className={`p-2 rounded-xl transition-all cursor-pointer ${
                        loopMode !== 'off' ? 'text-emerald-400 bg-emerald-950/60' : 'text-gray-400 hover:text-white'
                      }`}
                      title={`Ulangi: ${loopMode === 'all' ? 'Semua' : loopMode === 'one' ? 'Satu Lagu' : 'Mati'}`}
                    >
                      {loopMode === 'one' ? <Repeat1 size={16} /> : <Repeat size={16} />}
                    </button>
                  </div>

                  {/* Right: Volume & Extra actions */}
                  <div className="flex items-center justify-end gap-2.5 w-full sm:w-1/3">
                    <button
                      onClick={() => setSelectedTrackForLyrics(currentTrack)}
                      className="px-2.5 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <FileText size={13} />
                      <span className="hidden sm:inline">Lirik</span>
                    </button>

                    <button
                      onClick={() => handleDownload(currentTrack)}
                      className="p-2 bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white rounded-xl transition-all cursor-pointer"
                      title="Unduh MP3"
                    >
                      <Download size={15} />
                    </button>

                    {/* Volume Slider */}
                    <div className="hidden sm:flex items-center gap-1.5">
                      <button
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
                        className="w-16 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-emerald-400"
                      />
                    </div>

                    <button
                      onClick={() => {
                        if (audioRef.current) {
                          audioRef.current.pause();
                        }
                        setIsPlaying(false);
                        setCurrentTrackIndex(null);
                      }}
                      className="p-1.5 text-gray-400 hover:text-red-400 transition-colors cursor-pointer"
                      title="Tutup Player"
                    >
                      <X size={16} />
                    </button>
                  </div>

                </div>

              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lyrics & Song Detail Modal Sheet */}
      <AnimatePresence>
        {selectedTrackForLyrics && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border border-gray-150 flex flex-col max-h-[85vh]"
            >
              {/* Header with gradient theme */}
              <div className={`p-6 bg-linear-to-br ${selectedTrackForLyrics.theme.gradient} text-white relative`}>
                <button
                  onClick={() => setSelectedTrackForLyrics(null)}
                  className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 rounded-full text-white transition-all cursor-pointer"
                >
                  <X size={18} />
                </button>

                <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-extrabold uppercase tracking-widest border border-white/30 inline-block mb-2">
                  {selectedTrackForLyrics.category}
                </span>

                <h3 className="text-xl sm:text-2xl font-display font-black text-white leading-tight">
                  {selectedTrackForLyrics.title}
                </h3>

                {/* Prominent Composer in Modal */}
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
                  onClick={() => handleDownload(selectedTrackForLyrics)}
                  className="px-4 py-2.5 bg-white border border-gray-200 hover:bg-gray-100 text-gray-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Download size={14} />
                  <span>Unduh Lagu</span>
                </button>

                <button
                  onClick={() => {
                    handlePlayTrack(selectedTrackForLyrics.index);
                    setSelectedTrackForLyrics(null);
                  }}
                  className="px-5 py-2.5 bg-hw-green hover:bg-emerald-600 text-white rounded-xl text-xs font-black flex items-center gap-2 shadow-md shadow-hw-green/20 transition-all cursor-pointer"
                >
                  <Play size={14} fill="currentColor" />
                  <span>Putar Sekarang</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Hidden Audio Element for Background Playback */}
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

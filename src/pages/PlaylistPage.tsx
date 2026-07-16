import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Pause, 
  SkipForward, 
  SkipBack, 
  Volume2, 
  Music, 
  ArrowLeft, 
  Search,
  RefreshCw,
  Layout
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { sheetsService } from '../services/sheetsService';
import { useAuthStore } from '../store/useAuthStore';

// Function to convert Drive Link to Direct Stream Link if possible
// Note: Drive direct links are tricky, usually: https://drive.google.com/uc?export=download&id=FILE_ID
const getDriveStreamUrl = (url: string) => {
  if (!url) return '';
  if (url.includes('drive.google.com')) {
    // Extract ID from /d/ID/ or id=ID or open?id=ID
    const match = url.match(/\/d\/(.+?)(\/|$|\?|#)/) || url.match(/[?&]id=(.+?)(&|$|#)/);
    if (match && match[1]) {
      // docs.google.com/uc?id= is often more reliable for audio hotlinking
      return `https://docs.google.com/uc?id=${match[1]}&export=download`;
    }
  }
  return url;
};

const PlaylistPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const [playlist, setPlaylist] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentTrackIndex, setCurrentTrackIndex] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [autoPlayEnabled, setAutoPlayEnabled] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const fetchPlaylist = async () => {
      try {
        const data = await sheetsService.getContents('playlist');
        setPlaylist(data || []);
      } catch (error) {
        console.error('Error fetching playlist:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchPlaylist();
  }, []);

  const filteredPlaylist = playlist.filter(track => 
    (track.field2 || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handlePlayTrack = (index: number) => {
    if (currentTrackIndex === index) {
      if (isPlaying) {
        audioRef.current?.pause();
        setIsPlaying(false);
      } else {
        audioRef.current?.play();
        setIsPlaying(true);
      }
    } else {
      setCurrentTrackIndex(index);
      setIsPlaying(true);
      // Actual play happens in useEffect of currentTrackIndex
    }
  };

  useEffect(() => {
    if (currentTrackIndex !== null && audioRef.current && playlist[currentTrackIndex]) {
      const streamUrl = getDriveStreamUrl(playlist[currentTrackIndex].field1);
      audioRef.current.src = streamUrl;
      audioRef.current.load(); // Force re-load
      audioRef.current.play().catch(err => {
        console.error('Play error:', err);
        setIsPlaying(false);
      });
    }
  }, [currentTrackIndex, playlist]);

  const handleNextTrack = () => {
    if (playlist.length === 0) return;
    const nextIndex = currentTrackIndex === null ? 0 : (currentTrackIndex + 1) % playlist.length;
    handlePlayTrack(nextIndex);
  };

  const handlePrevTrack = () => {
    if (playlist.length === 0) return;
    const prevIndex = currentTrackIndex === null ? playlist.length - 1 : (currentTrackIndex - 1 + playlist.length) % playlist.length;
    handlePlayTrack(prevIndex);
  };

  const handleAudioEnded = () => {
    if (autoPlayEnabled) {
      handleNextTrack();
    } else {
      setIsPlaying(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-30 px-6 py-6 pb-4">
        <div className="flex items-center gap-4 mb-6">
          <button 
            onClick={() => navigate(-1)}
            className="p-3 bg-gray-50 rounded-2xl text-gray-400 hover:text-hw-dark transition-all"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-xl font-display font-black text-gray-800">Playlist HW</h1>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">Mars, Hymne & Audio Motivasi</p>
          </div>
        </div>

        <div className="relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
          <input 
            type="text" 
            placeholder="Cari lagu atau mars..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-3.5 pl-12 pr-4 text-sm font-bold placeholder:text-gray-300 focus:ring-2 focus:ring-hw-green/20 outline-none"
          />
        </div>
      </div>

      <div className="p-6 space-y-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center pt-20 gap-4">
            <RefreshCw className="animate-spin text-hw-green" size={32} />
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Memuat Playlist...</p>
          </div>
        ) : filteredPlaylist.length === 0 ? (
          <div className="flex flex-col items-center justify-center pt-20 text-center space-y-4">
            <div className="w-20 h-20 bg-gray-100 rounded-[2.5rem] flex items-center justify-center text-gray-300">
              <Music size={40} />
            </div>
            <div>
              <p className="text-sm font-black text-gray-800">Playlist Kosong</p>
              <p className="text-[10px] text-gray-400 font-bold uppercase mt-1">Belum ada audio yang ditambahkan</p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredPlaylist.map((track, idx) => {
              const isCurrent = playlist.findIndex(p => p.id === track.id) === currentTrackIndex;
              return (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  key={track.id || idx}
                  className={`p-4 rounded-3xl border transition-all flex items-center gap-4 ${
                    isCurrent 
                      ? 'bg-hw-green/5 border-hw-green/20 shadow-lg shadow-hw-green/5' 
                      : 'bg-white border-gray-100'
                  }`}
                >
                  <button 
                    onClick={() => handlePlayTrack(playlist.findIndex(p => p.id === track.id))}
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
                      isCurrent && isPlaying
                        ? 'bg-hw-green text-white shadow-lg shadow-hw-green/30'
                        : 'bg-gray-50 text-hw-green hover:bg-hw-green hover:text-white'
                    }`}
                  >
                    {isCurrent && isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-0.5" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <h4 className={`text-sm font-bold truncate ${isCurrent ? 'text-hw-green' : 'text-gray-800'}`}>
                      {track.field2 || 'Untitled Audio'}
                    </h4>
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-0.5">Hizbul Wathan Audio</p>
                  </div>
                  {isCurrent && isPlaying && (
                    <div className="flex gap-0.5 items-end h-4 pr-2">
                       {[0.6, 0.4, 0.8, 0.5, 0.7].map((h, i) => (
                         <motion.div 
                           key={i}
                           autoFocus
                           animate={{ height: ['40%', '100%', '40%'] }}
                           transition={{ repeat: Infinity, duration: h + 0.5, delay: i * 0.1 }}
                           className="w-0.5 bg-hw-green rounded-full"
                         />
                       ))}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Floating Audio Player */}
      <AnimatePresence>
        {currentTrackIndex !== null && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-24 left-0 right-0 z-40"
          >
            <div className="max-w-md mx-auto px-4">
              <div className="bg-hw-dark text-white p-5 sm:p-6 rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl shadow-hw-dark/40 border border-white/10 backdrop-blur-xl pointer-events-auto">
              <div className="flex items-center gap-4 mb-4 sm:mb-6">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-white/10 flex items-center justify-center text-hw-green shrink-0">
                  <Music size={20} className="sm:w-6 sm:h-6" />
                </div>
                <div className="flex-1 min-w-0">
                   <p className="text-[7px] sm:text-[8px] font-black text-hw-green uppercase tracking-[0.2em] mb-0.5 sm:mb-1">Sedang Diputar</p>
                   <h3 className="text-xs sm:text-sm font-bold truncate pr-4">{playlist[currentTrackIndex]?.field2}</h3>
                </div>
                <button 
                  onClick={() => setAutoPlayEnabled(!autoPlayEnabled)}
                  className={`p-2 rounded-xl transition-all ${autoPlayEnabled ? 'bg-hw-green text-hw-dark' : 'bg-white/10 text-gray-400'}`}
                  title={autoPlayEnabled ? "Putar Otomatis: On" : "Putar Otomatis: Off"}
                >
                  <RefreshCw size={14} className={autoPlayEnabled ? 'animate-spin-slow' : ''} />
                </button>
              </div>

              <div className="flex items-center justify-center gap-6">
                <button 
                  onClick={handlePrevTrack}
                  className="p-2 sm:p-3 text-gray-400 hover:text-white transition-colors"
                >
                  <SkipBack size={24} fill="currentColor" />
                </button>
                <button 
                  onClick={() => handlePlayTrack(currentTrackIndex)}
                  className="w-12 h-12 sm:w-16 sm:h-16 bg-hw-green text-hw-dark rounded-full flex items-center justify-center shadow-lg shadow-hw-green/20 hover:scale-105 active:scale-95 transition-all"
                >
                  {isPlaying ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" className="ml-1" />}
                </button>
                <button 
                  onClick={handleNextTrack}
                  className="p-2 sm:p-3 text-gray-400 hover:text-white transition-colors"
                >
                  <SkipForward size={24} fill="currentColor" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>

      <audio 
        ref={audioRef}
        onEnded={handleAudioEnded}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onError={() => {
          console.error('Audio element failed to load source');
          setIsPlaying(false);
        }}
      />
    </div>
  );
};

export default PlaylistPage;

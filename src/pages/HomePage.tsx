import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User as UserIcon, 
  Image as ImageIcon, 
  Share2, 
  Heart, 
  BookOpen, 
  Phone,
  Book,
  Compass,
  Zap,
  MapPin,
  Clock,
  ExternalLink,
  ChevronRight,
  Search,
  X,
  Shield,
  GraduationCap,
  Layers,
  Award,
  Users,
  Languages,
  Instagram,
  Youtube,
  MessageCircle,
  Play,
  Pause,
  Music,
  SkipForward,
  SkipBack,
  RefreshCw,
  CreditCard,
  LogIn,
  UserPlus
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { prayerService } from '../services/prayerService';
import { sheetsService } from '../services/sheetsService';
import { PrayerTimes, Materi, Content } from '../types';
import { cn, formatDate, formatTime } from '../lib/utils';

const MenuCard = ({ to, icon: Icon, label, color, description, state }: { to: string, icon: any, label: string, color: string, description?: string, state?: any }) => (
  <Link to={to} state={state} className="group">
    <div className="bg-white p-3 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 h-full flex flex-col items-center text-center gap-2">
      <div className={cn("p-2.5 rounded-xl mb-0.5 group-hover:scale-110 transition-transform duration-300", color)}>
        <Icon className="text-white" size={18} />
      </div>
      <h3 className="font-display font-bold text-[10px] text-hw-dark leading-tight uppercase tracking-tight">{label}</h3>
    </div>
  </Link>
);

const FeatureCard = ({ to, icon: Icon, label, delay = 0 }: { to: string, icon: any, label: string, delay?: number }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ delay }}
  >
    <Link to={to} className="flex items-center gap-3 bg-white p-3 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all">
      <div className="p-2 bg-gray-50 rounded-lg text-hw-green">
        <Icon size={18} />
      </div>
      <span className="text-xs font-semibold text-gray-700 flex-1">{label}</span>
      <ChevronRight size={14} className="text-gray-300" />
    </Link>
  </motion.div>
);

export default function HomePage() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  const [prayerTimes, setPrayerTimes] = useState<PrayerTimes | null>(null);
  const [location, setLocation] = useState('Purwokerto');
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [materiList, setMateriList] = useState<Materi[]>([]);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [galleryItems, setGalleryItems] = useState<Content[]>([]);
  const [playlistItems, setPlaylistItems] = useState<Content[]>([]);
  const [sosmed, setSosmed] = useState<Content | null>(null);
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);
  
  // Audio Player State
  const [currentTrackIndex, setCurrentTrackIndex] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [autoPlayEnabled, setAutoPlayEnabled] = useState(true);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    
    const initializeLocationAndPrayers = async () => {
      try {
        const coords = await prayerService.getCurrentCoords();
        if (coords) {
          const city = await prayerService.getLocationName(coords.lat, coords.lon);
          setLocation(city);
          const times = await prayerService.getPrayerTimes({ lat: coords.lat, lon: coords.lon });
          setPrayerTimes(times);
        } else {
          const times = await prayerService.getPrayerTimes({ city: 'Purwokerto' });
          setPrayerTimes(times);
          setLocation('Purwokerto');
        }
      } catch (error) {
        const times = await prayerService.getPrayerTimes({ city: 'Purwokerto' });
        setPrayerTimes(times);
        setLocation('Purwokerto');
      }
    };
    
    const fetchAllData = async () => {
      try {
        const [contents, playlist] = await Promise.all([
          sheetsService.getContents(),
          sheetsService.getContents('playlist')
        ]);
        setGalleryItems(contents.filter(c => c.section === 'galeri'));
        setPlaylistItems(playlist || []);
        setSosmed(contents.find(c => c.section === 'sosmed') || null);

        // Fetch materi for search: Only show 'umum' and 'umum_pandu' materi on home page
        const rolesToFetch = ['umum', 'umum_pandu'];
        const mResults = await Promise.all(rolesToFetch.map(r => sheetsService.getMateri(r)));
        const flatMateri = (mResults || []).flat().filter(Boolean);
        const uniqueMateri = Array.from(new Map(flatMateri.map(item => [item.id, item])).values());
        // Extra safety filter to ensure only 'umum' or 'umum_pandu' materi is shown on home search
        setMateriList(uniqueMateri.filter(m => m && (m.kategori === 'umum' || m.kategori === 'umum_pandu')));
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    initializeLocationAndPrayers();
    fetchAllData();
    return () => clearInterval(timer);
  }, [isAuthenticated, user?.role]);

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
    }
  };

  const handleNextTrack = () => {
    if (playlistItems.length === 0) return;
    const nextIndex = currentTrackIndex === null ? 0 : (currentTrackIndex + 1) % playlistItems.length;
    handlePlayTrack(nextIndex);
  };

  const handlePrevTrack = () => {
    if (playlistItems.length === 0) return;
    const prevIndex = currentTrackIndex === null ? playlistItems.length - 1 : (currentTrackIndex - 1 + playlistItems.length) % playlistItems.length;
    handlePlayTrack(prevIndex);
  };

  const handleAudioEnded = () => {
    if (autoPlayEnabled) {
      handleNextTrack();
    } else {
      setIsPlaying(false);
    }
  };

  //@ts-ignore
  useEffect(() => {
    if (currentTrackIndex !== null && audioRef.current && playlistItems[currentTrackIndex]) {
      const streamUrl = getDriveStreamUrl(playlistItems[currentTrackIndex].field1);
      audioRef.current.src = streamUrl;
      audioRef.current.load(); // Force re-load
      audioRef.current.play().catch(err => {
        console.error('Play error:', err);
        setIsPlaying(false);
      });
    }
  }, [currentTrackIndex]);

  const VideoPreview = () => (
    <>
      {galleryItems.length === 0 ? (
        [1, 2, 3].map(i => (
          <div key={`skeleton-${i}`} className="min-w-[160px] h-28 bg-gray-100 rounded-3xl animate-pulse shrink-0" />
        ))
      ) : (
        galleryItems.map((item, i) => {
          const videoUrl = item.field1 || '';
          const videoTitle = item.field2 || 'Video HW';
          let videoId = '';
          try {
            if (videoUrl.includes('v=')) videoId = videoUrl.split('v=')[1]?.split('&')[0];
            else if (videoUrl.includes('youtu.be/')) videoId = videoUrl.split('youtu.be/')[1]?.split('?')[0];
            else videoId = videoUrl.split('/').pop() || '';
          } catch (e) {}

          const thumb = videoId ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg` : 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=400';

          return (
            <button 
              key={`home-video-${item.id}-${i}`}
              onClick={() => { if (videoId) setActiveVideoId(videoId); }}
              className="min-w-[160px] sm:min-w-[180px] bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm snap-start group text-left cursor-pointer"
            >
              <div className="relative h-24">
                <img src={thumb} alt={videoTitle} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                  <div className="w-8 h-8 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/30">
                    <Play fill="white" size={14} />
                  </div>
                </div>
              </div>
              <div className="p-2.5">
                <h4 className="text-[10px] font-bold text-gray-800 line-clamp-1">{videoTitle}</h4>
              </div>
            </button>
          );
        })
      )}
    </>
  );

  const PlaylistPreview = () => (
    <div className="space-y-3">
      {playlistItems.length === 0 ? (
        <div className="p-4 bg-white rounded-3xl border border-gray-100 flex items-center justify-center">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Belum ada playlist</p>
        </div>
      ) : (
        playlistItems.slice(0, 5).map((track, idx) => {
          const isCurrent = currentTrackIndex === idx;
          return (
            <div 
              key={track.id || idx}
              className={cn(
                "p-3 rounded-2xl border transition-all flex items-center gap-3",
                isCurrent ? "bg-hw-green/5 border-hw-green/10" : "bg-white border-gray-100"
              )}
            >
              <button 
                onClick={() => handlePlayTrack(idx)}
                className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center transition-all shadow-sm",
                  isCurrent && isPlaying ? "bg-hw-green text-white" : "bg-gray-50 text-hw-green hover:bg-hw-green hover:text-white"
                )}
              >
                {isCurrent && isPlaying ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" className="ml-0.5" />}
              </button>
              <div className="flex-1 min-w-0">
                <h4 className={cn("text-xs font-bold truncate", isCurrent ? "text-hw-green" : "text-gray-800")}>
                  {track.field2 || 'Untitled Audio'}
                </h4>
                <p className="text-[8px] font-black text-gray-400 uppercase tracking-tighter">Audio HW</p>
              </div>
              {isCurrent && isPlaying && (
                <div className="flex gap-0.5 items-end h-3 pr-2">
                  {[0.6, 0.4, 0.8, 0.5, 0.7].map((h, i) => (
                    <motion.div 
                      key={i}
                      animate={{ height: ['40%', '100%', '40%'] }}
                      transition={{ repeat: Infinity, duration: h + 0.5, delay: i * 0.1 }}
                      className="w-0.5 bg-hw-green rounded-full"
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })
      )}
      {playlistItems.length > 5 && (
        <Link to="/playlist" className="block text-center py-2 text-[9px] font-black text-hw-green uppercase tracking-widest bg-hw-green/5 rounded-xl border border-dashed border-hw-green/20">
          Lihat Semua {playlistItems.length} Audio
        </Link>
      )}
    </div>
  );

  useEffect(() => {
    if (searchQuery.trim().length > 1) {
      const q = searchQuery.toLowerCase();
      
    const filteredMateri = (materiList || []).filter(m => 
      m && m.kategori === 'umum' && (
        m.judul.toLowerCase().includes(q) ||
        m.konten.toLowerCase().includes(q)
      )
    ).map(item => ({ ...item, type: 'materi' }));

    const filteredVideos = (galleryItems || []).filter(v => 
      v && (v.field2 || '').toLowerCase().includes(q)
    ).map(item => ({ ...item, type: 'video' }));

    const filteredAudio = (playlistItems || []).filter(a => 
      a && (a.field2 || '').toLowerCase().includes(q)
    ).map(item => ({ ...item, type: 'audio' }));

      setSearchResults([...filteredMateri, ...filteredVideos, ...filteredAudio]);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery, materiList, galleryItems, playlistItems]);

  return (
    <div className="space-y-6 pb-20">
      {/* Greeting Section */}
      <section className="pt-4">
        <div className="flex flex-col">
          <h2 className="text-base font-display font-bold text-hw-dark">
            {isAuthenticated ? (
              `Assalamu'alaikum, ${user?.namaLengkap?.split(' ')[0] || 'Peserta'}`
            ) : (
              "Assalamu'alaikum Sahabat HW.."
            )}
          </h2>
          {isAuthenticated && (
            <div className="flex flex-col gap-1 mt-0.5">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-gray-400 font-medium tracking-tight">Anda masuk sebagai</span>
                <span className="text-[10px] text-hw-green font-black uppercase tracking-widest bg-hw-green/5 px-2 py-0.5 rounded-full">
                  {user?.role || 'Umum'}
                </span>
              </div>
              <Link to="/profile" className="flex items-center gap-1 text-[10px] text-hw-blue font-bold hover:underline">
                Silahkan update data diri anda disini <ChevronRight size={10} />
              </Link>
            </div>
          )}
        </div>
        <div className="space-y-0.5 mt-2 flex items-center justify-between">
          <div>
            <p className="text-[13px] font-medium text-gray-500">{formatDate(currentTime)}</p>
            {prayerTimes?.hijri && (
              <p className="text-[11px] text-hw-green font-bold uppercase tracking-wider">
                {prayerTimes.hijri.day} {prayerTimes.hijri.month} {prayerTimes.hijri.year} H
              </p>
            )}
          </div>
          {/* Quick Sosmed Badges */}
          <div className="flex gap-1.5">
            <a href={`https://instagram.com/${String(sosmed?.field1 || 'hw_pusat').replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="w-7 h-7 rounded-lg bg-white border border-gray-100 flex items-center justify-center text-rose-500 shadow-sm active:scale-95 transition-transform">
              <Instagram size={14} />
            </a>
            <a href={sosmed?.field3?.startsWith('http') ? sosmed.field3 : `https://youtube.com/channel/${sosmed?.field3 || ''}`} target="_blank" rel="noopener noreferrer" className="w-7 h-7 rounded-lg bg-white border border-gray-100 flex items-center justify-center text-red-600 shadow-sm active:scale-95 transition-transform">
              <Youtube size={14} />
            </a>
            <a href={sosmed?.field4 || 'https://chat.whatsapp.com/'} target="_blank" rel="noopener noreferrer" className="w-7 h-7 rounded-lg bg-white border border-gray-100 flex items-center justify-center text-green-500 shadow-sm active:scale-95 transition-transform">
              <MessageCircle size={14} />
            </a>
          </div>
        </div>
      </section>

      {/* Prayer Times Card */}
      <section className="gradient-bg p-5 rounded-[2rem] text-white shadow-xl shadow-hw-green/20 relative overflow-hidden">
        <div className="relative z-10 flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2 text-white/90">
              <MapPin size={14} />
              <span className="text-xs font-medium">{location}</span>
            </div>
            <div className="flex items-center gap-2 text-white/90">
              <Clock size={14} />
              <span className="text-xs font-mono font-bold tracking-widest">{formatTime(currentTime)}</span>
            </div>
          </div>
          
          <div className="grid grid-cols-5 gap-1 mt-2">
            {[
              { name: 'Shubuh', time: prayerTimes?.shubuh },
              { name: 'Dzuhur', time: prayerTimes?.dzuhur },
              { name: 'Ashar', time: prayerTimes?.ashar },
              { name: 'Maghrib', time: prayerTimes?.maghrib },
              { name: 'Isya', time: prayerTimes?.isya }
            ].map((p) => (
              <div key={p.name} className="flex flex-col items-center gap-1">
                <span className="text-[8px] uppercase tracking-tighter opacity-70 font-bold">{p.name}</span>
                <span className="text-[11px] font-bold">{p.time || '--:--'}</span>
              </div>
            ))}
          </div>
          <p className="text-[9px] text-white/60 text-center mt-2 italic font-medium">Referensi KHGT Muhammadiyah</p>
        </div>
        
        {/* Decorative Circles */}
        <div className="absolute top-[-20px] right-[-20px] w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
        <div className="absolute bottom-[-20px] left-[-20px] w-24 h-24 bg-hw-blue/20 rounded-full blur-xl"></div>
      </section>

      {/* Search Bar */}
      <section className="relative">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Cari materi, audio, video..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-gray-100 rounded-2xl py-3.5 pl-12 pr-12 focus:ring-2 focus:ring-hw-green/20 outline-none text-sm shadow-sm transition-all"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-hw-green transition-colors"
            >
              <X size={18} />
            </button>
          )}
        </div>
        
        {/* Live Search Results */}
        <AnimatePresence>
          {searchResults.length > 0 && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden bg-white rounded-2xl border border-gray-100 shadow-sm mt-3"
            >
              <div className="p-3 border-b border-gray-50 flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Hasil Pencarian</span>
                <span className="text-[10px] font-bold text-hw-green">{searchResults.length} Hasil ditemukan</span>
              </div>
              <div className="max-h-[400px] overflow-y-auto">
                {searchResults.map((m, index) => {
                  const isMateri = m.type === 'materi';
                  const isVideo = m.type === 'video';
                  const isAudio = m.type === 'audio';

                  return (
                    <div key={`${m.id}-${index}-${m.type}`} className="border-b border-gray-50 last:border-0 transition-colors">
                      {isMateri && (
                        <Link 
                          to="/materi" 
                          state={{ searchQuery: m.judul }}
                          className="flex items-center gap-3 p-3 hover:bg-gray-50 bg-white"
                        >
                          <div className="w-9 h-9 rounded-xl bg-hw-green/10 flex items-center justify-center text-hw-green shrink-0">
                            <BookOpen size={16} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-[11px] font-bold text-gray-800 truncate">{m.judul}</h4>
                            <p className="text-[9px] text-gray-400 line-clamp-1 italic uppercase font-black tracking-tighter">Materi Pelatihan / Umum</p>
                          </div>
                          <ChevronRight size={14} className="text-gray-300" />
                        </Link>
                      )}

                      {isVideo && (
                        <a 
                          href={m.field1}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 p-3 hover:bg-gray-50 bg-white"
                        >
                          <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center text-red-500 shrink-0">
                            <Youtube size={16} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-[11px] font-bold text-gray-800 truncate">{m.field2}</h4>
                            <p className="text-[9px] text-gray-400 line-clamp-1 italic uppercase font-black tracking-tighter">Video Tutorial / YouTube</p>
                          </div>
                          <ChevronRight size={14} className="text-gray-300" />
                        </a>
                      )}

                      {isAudio && (
                        <button 
                          onClick={() => {
                            const idx = playlistItems.findIndex(p => p.id === m.id);
                            if (idx !== -1) handlePlayTrack(idx);
                            setSearchQuery('');
                          }}
                          className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 bg-white"
                        >
                          <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500 shrink-0">
                            <Music size={16} />
                          </div>
                          <div className="flex-1 min-w-0 text-left">
                            <h4 className="text-[11px] font-bold text-gray-800 truncate">{m.field2}</h4>
                            <p className="text-[9px] text-gray-400 line-clamp-1 italic uppercase font-black tracking-tighter">Audio HW / MP3</p>
                          </div>
                          <ChevronRight size={14} className="text-gray-300" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
              {searchQuery.trim().length > 1 && (
                <div className="p-4 bg-hw-green/5 border-t border-hw-green/5 text-center">
                  <p className="text-[10px] text-gray-500 font-medium mb-2">Ingin materi Tingkat Jati/Jari/Sugli?</p>
                  <button 
                    onClick={() => navigate('/profile')}
                    className="w-full py-2 bg-hw-green text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-hw-green/10"
                  >
                    Upgrade Role Sekarang
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* Main Menu Grid */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-bold text-gray-800">Menu Utama</h3>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <MenuCard to="/about" icon={UserIcon} label="Profil HW" color="bg-orange-500" />
          <MenuCard to="/gallery" icon={ImageIcon} label="Galeri" color="bg-pink-500" />
          <MenuCard to="/sosmed" icon={Share2} label="Sosmed" color="bg-blue-600" />
          <MenuCard to="/doa" icon={Heart} label="Doa" color="bg-red-500" />
          <MenuCard to="/materi" icon={BookOpen} label="Materi HW" color="bg-hw-green" />
          <MenuCard to="/contact" icon={Phone} label="Kontak" color="bg-slate-700" />
        </div>
      </section>

      {/* Member Dashboard Section */}
      {isAuthenticated && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-bold text-gray-800">Dasbor Anggota</h3>
          </div>
          
          <div className="grid grid-cols-4 gap-2.5">
            <MenuCard to="/materi" state={{ filter: 'umum' }} icon={BookOpen} label="Umum" color="bg-hw-green" />
            <MenuCard to="/materi" state={{ filter: 'sugli' }} icon={Shield} label="Sugli" color="bg-orange-500" />
            <MenuCard to="/materi" state={{ filter: 'kwarda' }} icon={MapPin} label="Kwarda" color="bg-blue-500" />
            <MenuCard to="/pelatihan" icon={GraduationCap} label="Pelatihan" color="bg-emerald-700" />
            {(user?.role === 'admin' || user?.role === 'superadmin') && (
              <MenuCard to="/admin" icon={Shield} label="Admin" color="bg-hw-dark" />
            )}
            <MenuCard to="/upgrade" icon={Award} label="Upgrade" color="bg-cyan-500" />
            <MenuCard to="/profile" icon={Users} label="Profil" color="bg-rose-500" />
            <MenuCard to="/kta" icon={CreditCard} label="KTA Digital" color="bg-emerald-600" />
          </div>
        </section>
      )}

      {/* Conditional KTA & Training Banners based on authentication */}
      {!isAuthenticated ? (
        <section className="px-1">
          <div className="bg-slate-50 rounded-[2rem] border border-slate-200/60 p-6 shadow-sm space-y-5">
            <div className="space-y-4">
              {/* Option 1: Already has account */}
              <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-start gap-3.5">
                <div className="p-3 bg-gradient-to-br from-orange-500 to-amber-500 text-white rounded-2xl shadow-md shadow-orange-500/20 mt-0.5 shrink-0">
                  <LogIn size={18} />
                </div>
                <div className="space-y-1 flex-1">
                  <h4 className="text-[11px] font-black text-slate-800 uppercase tracking-wider font-display">Pendaftaran Pelatihan</h4>
                  <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
                    Sudah punya akun? Silahkan <Link to="/login" className="text-orange-600 hover:underline font-black">login</Link> dan Daftar Pelatihannya
                  </p>
                  <Link 
                    to="/login" 
                    className="inline-flex items-center gap-1 text-[10px] text-orange-600 font-extrabold hover:underline uppercase tracking-wider mt-1.5"
                  >
                    Masuk & Daftar Pelatihan <ChevronRight size={10} />
                  </Link>
                </div>
              </div>

              {/* Option 2: No account yet */}
              <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-start gap-3.5">
                <div className="p-3 bg-gradient-to-br from-hw-green to-emerald-600 text-white rounded-2xl shadow-md shadow-emerald-500/20 mt-0.5 shrink-0">
                  <UserPlus size={18} />
                </div>
                <div className="space-y-1 flex-1">
                  <h4 className="text-[11px] font-black text-slate-800 uppercase tracking-wider font-display">Belum Punya Akun?</h4>
                  <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
                    Jika belum punya akun, daftar dulu dengan membuat Kartu Anggota dibawah ini
                  </p>
                </div>
              </div>
            </div>

            {/* Attached KTA Banner */}
            <Link 
              to="/register" 
              className="relative overflow-hidden flex items-center justify-between bg-gradient-to-r from-hw-green via-emerald-700 to-emerald-800 text-white p-5 rounded-[1.75rem] shadow-md shadow-emerald-950/10 hover:shadow-lg hover:shadow-emerald-950/15 transition-all duration-300 border border-emerald-600/30 hover:scale-[1.01] active:scale-[0.99]"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl pointer-events-none -mr-10 -mt-10"></div>
              <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-emerald-400/10 rounded-full blur-xl pointer-events-none"></div>
              
              <div className="flex items-center gap-4 relative z-10">
                <div className="p-3 bg-white/10 backdrop-blur-sm rounded-2xl text-white border border-white/10 shadow-inner shrink-0">
                  <CreditCard size={22} className="animate-pulse" />
                </div>
                <div className="text-left space-y-1">
                  <div className="flex items-center gap-1.5">
                    <h4 className="text-sm font-black uppercase tracking-wider font-display">Buat KTA HW Jateng</h4>
                    <span className="bg-amber-400 text-slate-950 text-[8px] font-black uppercase px-1.5 py-0.5 rounded-md leading-none tracking-wider">
                      Wajib
                    </span>
                  </div>
                  <p className="text-[10px] text-emerald-100/90 font-medium leading-relaxed max-w-[210px]">
                    Daftar akun baru & dapatkan Kartu Anggota resmi
                  </p>
                </div>
              </div>
              <div className="p-1.5 bg-white/10 rounded-full hover:bg-white/20 transition-colors shrink-0">
                <ChevronRight size={18} className="text-white" />
              </div>
            </Link>
          </div>
        </section>
      ) : (
        <>
          {/* Elongated KTA Banner Button for Authenticated Users */}
          <section className="px-1">
            <Link 
              to="/kta" 
              className="flex items-center justify-between bg-gradient-to-r from-hw-green to-emerald-800 text-white p-4 rounded-3xl shadow-md shadow-emerald-900/10 hover:shadow-lg transition-all border border-emerald-700/50 hover:scale-[1.01] active:scale-[0.99] duration-200"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-white/10 rounded-2xl text-white">
                  <CreditCard size={20} />
                </div>
                <div className="text-left space-y-0.5">
                  <h4 className="text-xs font-black uppercase tracking-wider">Buat KTA HW Jateng</h4>
                  <p className="text-[9px] text-emerald-100 font-semibold leading-none">Ajukan & cetak Kartu Tanda Anggota Digital resmi sekarang</p>
                </div>
              </div>
              <ChevronRight size={16} className="text-emerald-200" />
            </Link>
          </section>

          {/* Elongated Training Banner Button for Authenticated Users */}
          <section className="px-1">
            <Link 
              to="/daftar-pelatihan" 
              className="flex items-center justify-between bg-gradient-to-r from-orange-600 to-yellow-500 text-white p-4 rounded-3xl shadow-md shadow-orange-600/20 hover:shadow-lg transition-all border border-orange-500/20 hover:scale-[1.01] active:scale-[0.99] duration-200"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-white/20 rounded-2xl text-white">
                  <GraduationCap size={20} />
                </div>
                <div className="text-left space-y-0.5">
                  <h4 className="text-xs font-black uppercase tracking-wider">Daftar Pelatihan JATI 1/ JATI 2/ JARI 1</h4>
                  <p className="text-[9px] text-orange-50 font-semibold leading-none">Ikuti pelatihan Kepanduan HW resmi & buka akses modul latih Anda</p>
                </div>
              </div>
              <ChevronRight size={16} className="text-orange-100" />
            </Link>
          </section>
        </>
      )}

      {/* Gallery Section Preview */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-display font-bold text-gray-800">Galeri Video</h3>
          <Link to="/gallery" className="text-[10px] font-black text-hw-green uppercase tracking-widest flex items-center gap-1 group">
            Lihat Semua <ChevronRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
        
        <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar snap-x">
          <VideoPreview />
        </div>
      </section>

      {/* Playlist Section Preview */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Music size={18} className="text-hw-green" />
            <h3 className="font-display font-bold text-hw-dark">Playlist HW</h3>
          </div>
          <Link to="/playlist" className="text-[10px] font-black text-hw-green uppercase tracking-widest flex items-center gap-1 group">
            Layar Penuh <ChevronRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
        <PlaylistPreview />
      </section>

      {/* Tools Section */}
      <section className="space-y-3">
        <h3 className="font-display font-bold text-gray-800">Fitur Tambahan</h3>
        <div className="grid grid-cols-1 gap-2">
          <FeatureCard to="/quran" icon={Book} label="Al-Qur'an (Api Kemenag)" delay={0.1} />
          <FeatureCard to="/tools?type=morse" icon={Zap} label="Translate Morse" delay={0.2} />
          <FeatureCard to="/tools?type=semafor" icon={Share2} label="Translate Semafor" delay={0.3} />
          <FeatureCard to="/tools?type=translate" icon={Languages} label="Translate Bahasa" delay={0.4} />
        </div>
      </section>

      {/* Floating Audio Player */}
      <AnimatePresence>
        {currentTrackIndex !== null && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-24 left-0 right-0 z-40 px-4"
          >
            <div className="max-w-[340px] mx-auto">
              <div className="bg-hw-dark/95 text-white p-4 rounded-[2rem] shadow-2xl shadow-hw-dark/40 border border-white/10 backdrop-blur-xl pointer-events-auto relative">
                {/* Close Button */}
                <button 
                  onClick={() => {
                    if (audioRef.current) {
                      audioRef.current.pause();
                      setIsPlaying(false);
                    }
                    setCurrentTrackIndex(null);
                  }}
                  className="absolute -top-2 -right-2 w-8 h-8 bg-hw-dark/80 text-white rounded-full flex items-center justify-center border border-white/10 shadow-lg hover:bg-red-500 transition-colors z-50 focus:outline-none"
                >
                  <X size={14} />
                </button>

                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-hw-green shrink-0">
                    <Music size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                     <p className="text-[7px] font-black text-hw-green uppercase tracking-[0.2em] mb-0.5">Sedang Diputar</p>
                     <h3 className="text-[11px] font-bold truncate pr-16">{playlistItems[currentTrackIndex]?.field2}</h3>
                  </div>
                  <button 
                    onClick={() => setAutoPlayEnabled(!autoPlayEnabled)}
                    className={`p-1.5 rounded-lg transition-all ${autoPlayEnabled ? 'bg-hw-green text-hw-dark' : 'bg-white/10 text-gray-400'}`}
                    title={autoPlayEnabled ? "Putar Otomatis: On" : "Putar Otomatis: Off"}
                  >
                    <RefreshCw size={12} className={autoPlayEnabled ? 'animate-spin-slow' : ''} />
                  </button>
                </div>

                <div className="flex items-center justify-center gap-4">
                  <button 
                    onClick={handlePrevTrack}
                    className="p-1.5 text-gray-400 hover:text-white transition-colors"
                  >
                    <SkipBack size={20} fill="currentColor" />
                  </button>
                  <button 
                    onClick={() => handlePlayTrack(currentTrackIndex)}
                    className="w-11 h-11 bg-hw-green text-hw-dark rounded-full flex items-center justify-center shadow-lg shadow-hw-green/20 hover:scale-105 active:scale-95 transition-all"
                  >
                    {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" className="ml-1" />}
                  </button>
                  <button 
                    onClick={handleNextTrack}
                    className="p-1.5 text-gray-400 hover:text-white transition-colors"
                  >
                    <SkipForward size={20} fill="currentColor" />
                  </button>
                </div>
              </div>
            </div>
        </motion.div>
      )}
    </AnimatePresence>

      {/* Video Modal Overlay */}
      {activeVideoId && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="relative w-full max-w-4xl flex flex-col gap-3">
            {/* Elegant Floating Close Button outside the iframe video space to prevent overlaps */}
            <div className="flex justify-end">
              <button 
                onClick={() => setActiveVideoId(null)}
                className="bg-white/10 hover:bg-white/20 active:scale-95 text-white px-4 py-2 rounded-full text-xs font-bold border border-white/10 transition-all flex items-center gap-1.5 backdrop-blur-sm shadow-md"
              >
                <span>Tutup</span>
                <X size={14} />
              </button>
            </div>
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full aspect-video bg-black rounded-2xl md:rounded-3xl overflow-hidden shadow-2xl relative border border-gray-800"
            >
              <iframe 
                width="100%" 
                height="100%" 
                src={`https://www.youtube.com/embed/${activeVideoId}?autoplay=1`} 
                title="YouTube video player" 
                frameBorder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                allowFullScreen 
                className="w-full h-full"
              />
            </motion.div>
          </div>
        </div>
      )}

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
}

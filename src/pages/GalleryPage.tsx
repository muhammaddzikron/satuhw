import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Play, ArrowLeft, Youtube, Search, X, Sparkles, Video, Film, RefreshCw, Radio } from 'lucide-react';
import { sheetsService } from '../services/sheetsService';
import { extractYoutubeId } from '../utils/activityUtils';

interface UnifiedVideoItem {
  id: string;
  title: string;
  url: string;
  videoId: string;
  category?: string;
  source?: 'galeri' | 'kegiatan' | 'pelatihan';
  date?: string;
  description?: string;
}

export default function GalleryPage() {
  const navigate = useNavigate();
  const [videoList, setVideoList] = useState<UnifiedVideoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);
  const [activeVideoTitle, setActiveVideoTitle] = useState<string>('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchAllVideos = async () => {
    try {
      const videos = await sheetsService.getGalleryVideos();
      if (Array.isArray(videos) && videos.length > 0) {
        setVideoList(videos);
      }
    } catch (e) {
      console.warn('Error loading gallery videos:', e);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAllVideos();

    // Subscribe to all real-time video sources
    const unsubContents = sheetsService.subscribeToContents(() => {
      fetchAllVideos();
    });

    const unsubActivities = sheetsService.subscribeToActivities(() => {
      fetchAllVideos();
    });

    return () => {
      unsubContents();
      unsubActivities();
    };
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchAllVideos();
  };

  // Derive categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    videoList.forEach(v => {
      if (v.category && v.category.trim()) {
        set.add(v.category.trim());
      }
    });
    return ['all', ...Array.from(set)];
  }, [videoList]);

  // Filter videos
  const filteredVideos = useMemo(() => {
    return videoList.filter(item => {
      const matchesSearch = 
        (item.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.category || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.description || '').toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = 
        selectedCategory === 'all' || 
        (item.category || '').toLowerCase() === selectedCategory.toLowerCase();

      return matchesSearch && matchesCategory;
    });
  }, [videoList, searchQuery, selectedCategory]);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button 
            id="btn-back-gallery"
            onClick={() => navigate('/')} 
            className="p-2.5 bg-white border border-gray-100 rounded-2xl text-gray-500 hover:text-hw-green hover:border-hw-green/30 shadow-sm transition-all active:scale-95"
            title="Kembali ke Beranda"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="p-3 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center shadow-xs">
            <Youtube size={22} />
          </div>
          <div>
            <h2 className="text-xl font-display font-black text-gray-800 tracking-tight">Galeri Video</h2>
            <p className="text-[11px] text-gray-400 font-medium">Dokumentasi & Video Resmi Hizbul Wathan ({videoList.length} video)</p>
          </div>
        </div>

        <button
          id="btn-refresh-gallery"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className={`p-2.5 bg-white border border-gray-100 rounded-2xl text-gray-400 hover:text-hw-green shadow-sm transition-all active:scale-95 ${isRefreshing ? 'animate-spin text-hw-green' : ''}`}
          title="Segarkan Data Video"
        >
          <RefreshCw size={16} />
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input 
          id="input-search-gallery"
          type="text" 
          placeholder="Cari video pandu, mars, dokumentasi..." 
          value={searchQuery || ''}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-white border border-gray-100 focus:ring-4 focus:ring-hw-green/10 focus:border-hw-green rounded-2xl py-3.5 pl-11 pr-10 text-xs sm:text-sm font-bold text-gray-800 shadow-xs transition-all placeholder:font-normal placeholder:text-gray-400" 
        />
        {searchQuery && (
          <button
            id="btn-clear-search-gallery"
            type="button"
            onClick={() => setSearchQuery('')}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-hw-green transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Category Pills (if multiple categories available) */}
      {categories.length > 2 && (
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          {categories.map((cat) => (
            <button
              key={`cat-${cat}`}
              id={`btn-cat-${cat}`}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-hw-dark text-white shadow-xs'
                  : 'bg-white text-gray-500 border border-gray-100 hover:bg-gray-50'
              }`}
            >
              {cat === 'all' ? 'Semua Video' : cat}
            </button>
          ))}
        </div>
      )}

      {/* Video Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(n => (
            <div key={`skeleton-${n}`} className="bg-white rounded-3xl p-3 border border-gray-100 animate-pulse space-y-3">
              <div className="w-full aspect-video bg-gray-100 rounded-2xl" />
              <div className="h-4 bg-gray-100 rounded-md w-3/4" />
              <div className="h-3 bg-gray-50 rounded-md w-1/2" />
            </div>
          ))}
        </div>
      ) : filteredVideos.length === 0 ? (
        <div className="bg-white rounded-3xl p-10 text-center border border-gray-100 shadow-xs space-y-3">
          <div className="w-14 h-14 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto">
            <Video size={24} />
          </div>
          <div>
            <h4 className="text-sm font-bold text-gray-800">
              {searchQuery ? 'Video Tidak Ditemukan' : 'Belum Ada Video'}
            </h4>
            <p className="text-xs text-gray-400 mt-1 max-w-xs mx-auto">
              {searchQuery 
                ? `Tidak ada video yang cocok dengan kata kunci "${searchQuery}".`
                : 'Video galeri dapat ditambahkan melalui menu Kelola Konten di Dasbor Admin.'}
            </p>
          </div>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition-all"
            >
              Reset Pencarian
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filteredVideos.map((item, index) => {
            const vId = item.videoId || extractYoutubeId(item.url);
            const thumbnail = vId 
              ? `https://img.youtube.com/vi/${vId}/hqdefault.jpg` 
              : 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=800';

            return (
              <motion.div
                key={`gallery-${item.id}-${index}`}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(index * 0.05, 0.4) }}
                className="bg-white rounded-3xl overflow-hidden shadow-xs border border-gray-100/80 group flex flex-col hover:shadow-md hover:border-gray-200 transition-all duration-300"
              >
                {/* Thumbnail Container */}
                <button
                  id={`btn-play-video-${item.id}`}
                  onClick={() => {
                    if (vId) {
                      setActiveVideoId(vId);
                      setActiveVideoTitle(item.title);
                    } else if (item.url) {
                      window.open(item.url, '_blank');
                    }
                  }}
                  className="relative aspect-video w-full bg-gray-900 overflow-hidden cursor-pointer block text-left"
                >
                  <img 
                    src={thumbnail} 
                    alt={item.title} 
                    loading="lazy"
                    decoding="async"
                    onError={(e) => {
                      // Fallback to mqdefault if hqdefault fails
                      if (vId && (e.currentTarget.src.includes('hqdefault.jpg'))) {
                        e.currentTarget.src = `https://img.youtube.com/vi/${vId}/mqdefault.jpg`;
                      }
                    }}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                  />
                  <div className="absolute inset-0 bg-black/25 group-hover:bg-black/45 transition-colors flex items-center justify-center">
                    <div className="w-12 h-12 bg-red-600/90 group-hover:bg-red-600 rounded-2xl flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-all border border-white/20">
                      <Play fill="white" size={20} className="ml-0.5" />
                    </div>
                  </div>

                  {/* Badge */}
                  {item.category && (
                    <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md text-white px-2.5 py-1 rounded-lg text-[9px] font-bold border border-white/10 uppercase tracking-wider">
                      {item.category}
                    </div>
                  )}

                  {item.source === 'kegiatan' && (
                    <div className="absolute bottom-3 right-3 bg-emerald-600/90 backdrop-blur-md text-white px-2 py-0.5 rounded-md text-[8px] font-bold">
                      Dokumentasi Kegiatan
                    </div>
                  )}
                </button>

                {/* Details */}
                <div className="p-4 flex flex-col justify-between flex-1 gap-2">
                  <div>
                    <h4 className="font-bold text-gray-800 text-xs sm:text-sm line-clamp-2 leading-snug group-hover:text-hw-green transition-colors">
                      {item.title}
                    </h4>
                    {item.description && (
                      <p className="text-[10px] text-gray-400 line-clamp-1 mt-1 font-medium">{item.description}</p>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-gray-50 text-[10px] text-gray-400">
                    <span className="flex items-center gap-1 text-red-600 font-bold">
                      <Youtube size={12} /> YouTube
                    </span>
                    <button
                      onClick={() => {
                        if (vId) {
                          setActiveVideoId(vId);
                          setActiveVideoTitle(item.title);
                        } else if (item.url) {
                          window.open(item.url, '_blank');
                        }
                      }}
                      className="text-hw-green font-bold hover:underline flex items-center gap-0.5 cursor-pointer"
                    >
                      Putar Video <Play size={10} className="fill-current" />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Video Modal Overlay */}
      <AnimatePresence>
        {activeVideoId && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
            <div className="relative w-full max-w-4xl flex flex-col gap-3">
              {/* Header inside modal */}
              <div className="flex items-center justify-between text-white">
                <h3 className="text-xs sm:text-sm font-bold truncate max-w-[80%]">
                  {activeVideoTitle || 'Pemutar Video'}
                </h3>
                <button 
                  id="btn-close-video-modal"
                  onClick={() => {
                    setActiveVideoId(null);
                    setActiveVideoTitle('');
                  }}
                  className="bg-white/10 hover:bg-white/20 active:scale-95 text-white px-3.5 py-1.5 rounded-full text-xs font-bold border border-white/10 transition-all flex items-center gap-1.5 backdrop-blur-sm cursor-pointer"
                >
                  <span>Tutup</span>
                  <X size={14} />
                </button>
              </div>
              
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full aspect-video bg-black rounded-2xl md:rounded-3xl overflow-hidden shadow-2xl relative border border-gray-800"
              >
                <iframe 
                  width="100%" 
                  height="100%" 
                  src={`https://www.youtube.com/embed/${activeVideoId}?autoplay=1&rel=0`} 
                  title={activeVideoTitle || "YouTube video player"} 
                  frameBorder="0" 
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                  allowFullScreen 
                  className="w-full h-full"
                />
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

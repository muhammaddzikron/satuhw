import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Image as ImageIcon, Play, ExternalLink, ArrowLeft, Youtube, Search, X } from 'lucide-react';
import { sheetsService } from '../services/sheetsService';
import { Content } from '../types';
import LoadingPage from './LoadingPage';

export default function GalleryPage() {
  const navigate = useNavigate();
  const [galleryItems, setGalleryItems] = useState<Content[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);

  useEffect(() => {
    const fetchGallery = async () => {
      try {
        const data = await sheetsService.getContents('galeri');
        setGalleryItems(data);
      } finally {
        setLoading(false);
      }
    };
    fetchGallery();
  }, []);

  if (loading) return <LoadingPage />;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button 
          onClick={() => navigate('/')} 
          className="p-2 bg-white border border-gray-100 rounded-xl text-gray-400 hover:text-hw-green transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="p-3 bg-pink-50 text-pink-500 rounded-2xl">
          <Youtube size={24} />
        </div>
        <h2 className="text-2xl font-display font-bold text-gray-800">Galeri Video</h2>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input 
          type="text" 
          placeholder="Cari video..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-white border border-gray-100 focus:ring-4 focus:ring-hw-green/10 focus:border-hw-green rounded-2xl py-3.5 pl-12 pr-4 text-sm font-medium shadow-sm transition-all" 
        />
      </div>

      <div className="grid grid-cols-1 gap-4">
        {galleryItems.filter(item => (item.field2 || '').toLowerCase().includes(searchQuery.toLowerCase())).length === 0 ? (
           <div className="p-10 text-center text-gray-400 text-sm italic col-span-full">
             {searchQuery ? `Tidak ada video yang cocok dengan "${searchQuery}"` : "Belum ada video tersedia"}
           </div>
        ) : galleryItems.filter(item => (item.field2 || '').toLowerCase().includes(searchQuery.toLowerCase())).map((item, index) => {
          const videoUrl = item.field1 || '';
          const videoTitle = item.field2 || 'Video Hizbul Wathan';
          
          let videoId = '';
          try {
            if (videoUrl.includes('v=')) {
              videoId = videoUrl.split('v=')[1]?.split('&')[0];
            } else if (videoUrl.includes('youtu.be/')) {
              videoId = videoUrl.split('youtu.be/')[1]?.split('?')[0];
            } else {
              videoId = videoUrl.split('/').pop() || '';
            }
          } catch (e) {
            videoId = '';
          }

          const thumbnail = videoId ? `https://img.youtube.com/vi/${videoId}/0.jpg` : 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=800';
          
          return (
            <motion.button
              key={`gallery-${item.id}-${index}`}
              onClick={() => { if (videoId) setActiveVideoId(videoId); }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100 group block w-full text-left cursor-pointer hover:shadow-md transition-shadow"
            >
              <div className="relative aspect-video">
                <img src={thumbnail} alt={videoTitle} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                  <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/30 group-hover:scale-110 transition-transform">
                    <Play fill="white" size={24} className="ml-1" />
                  </div>
                </div>
              </div>
              <div className="p-4 flex items-center justify-between">
                <div className="flex-1 min-w-0 mr-4">
                  <h4 className="font-bold text-gray-800 text-xs truncate">{videoTitle}</h4>
                  <p className="text-[10px] text-gray-400 truncate">{videoUrl}</p>
                </div>
                <div className="text-gray-300 group-hover:text-hw-green">
                  <Play size={16} />
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>

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
    </div>
  );
}

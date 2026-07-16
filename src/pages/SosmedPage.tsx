import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Share2, Instagram, Youtube, Facebook, MessageCircle, Twitter, ArrowLeft } from 'lucide-react';
import { sheetsService } from '../services/sheetsService';
import LoadingPage from './LoadingPage';

export default function SosmedPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [sosmed, setSosmed] = useState<any>(null);
  const [waLink, setWaLink] = useState('https://chat.whatsapp.com/L7r0U0u0U0u0U0u0U0u0');

  useEffect(() => {
    const fetchSosmed = async () => {
      try {
        const data = await sheetsService.getContents('sosmed');
        if (data.length > 0) {
          setSosmed(data[0]);
          if (data[0].field4) setWaLink(data[0].field4);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchSosmed();
  }, []);

  if (loading) return <LoadingPage />;

  const SOSMED_ITEMS = [
    { name: 'Instagram', handle: sosmed?.field1 || '@hw_pusat', icon: Instagram, color: 'bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-500', link: sosmed?.field1?.startsWith('http') ? sosmed.field1 : `https://instagram.com/${String(sosmed?.field1 || 'hw_pusat').replace('@', '')}` },
    { name: 'Tiktok', handle: sosmed?.field2 || '@hw_pusat', icon: Share2, color: 'bg-black', link: sosmed?.field2?.startsWith('http') ? sosmed.field2 : `https://tiktok.com/@${String(sosmed?.field2 || 'hw_pusat').replace('@', '')}` },
    { name: 'YouTube', handle: sosmed?.field3 || 'Hizbul Wathan TV', icon: Youtube, color: 'bg-red-600', link: sosmed?.field3?.startsWith('http') ? sosmed.field3 : `https://youtube.com/channel/${sosmed?.field3 || ''}` },
  ];

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center gap-3">
        <button 
          onClick={() => navigate('/')} 
          className="p-2 bg-white border border-gray-100 rounded-xl text-gray-400 hover:text-hw-green transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="p-3 bg-blue-50 text-blue-500 rounded-2xl">
          <Share2 size={24} />
        </div>
        <h2 className="text-2xl font-display font-bold text-gray-800">Media Sosial</h2>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {SOSMED_ITEMS.map((item, index) => (
          <motion.a
            key={item.name}
            href={item.link}
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex items-center gap-4 bg-white p-5 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-md transition-all active:scale-95"
          >
            <div className={`w-14 h-14 rounded-2xl ${item.color} text-white flex items-center justify-center shadow-lg`}>
              <item.icon size={28} />
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-gray-800">{item.name}</h4>
              <p className="text-xs text-gray-400 font-medium">{item.handle}</p>
            </div>
            <div className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center text-gray-300">
               <Share2 size={16} />
            </div>
          </motion.a>
        ))}
      </div>
      
      <div className="p-8 bg-gray-900 rounded-[2.5rem] mt-10 text-center space-y-4">
        <h3 className="text-white font-display font-bold">Join Community</h3>
        <p className="text-gray-400 text-xs px-6">Dapatkan info terbaru seputar HW langsung di genggamanmu.</p>
        <button 
          onClick={() => window.open(waLink, '_blank')}
          className="w-full py-4 gradient-bg text-white font-bold rounded-2xl shadow-xl flex items-center justify-center gap-2"
        >
          <MessageCircle size={18} />
          Gabung Grup WhatsApp
        </button>
      </div>
    </div>
  );
}

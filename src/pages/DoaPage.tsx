import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Heart, Search, ChevronRight, X, ArrowLeft } from 'lucide-react';
import { sheetsService } from '../services/sheetsService';
import { Content } from '../types';
import LoadingPage from './LoadingPage';

export default function DoaPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<any>(null);
  const [doaList, setDoaList] = useState<Content[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDoa = async () => {
      try {
        const data = await sheetsService.getContents('doa');
        setDoaList(data);
      } finally {
        setLoading(false);
      }
    };
    fetchDoa();
  }, []);

  const filteredDoa = doaList.filter(d => 
    (d.field2 || '').toLowerCase().includes(search.toLowerCase())
  );

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
        <div className="p-3 bg-red-50 text-red-500 rounded-2xl">
          <Heart size={24} />
        </div>
        <h2 className="text-2xl font-display font-bold text-gray-800">Kumpulan Doa</h2>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input 
          type="text" 
          placeholder="Cari doa harian..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-white border border-gray-100 rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-hw-green/20 outline-none text-sm shadow-sm"
        />
      </div>

      <div className="grid grid-cols-1 gap-3">
        {filteredDoa.length === 0 ? (
          <div className="p-10 text-center text-gray-400 text-sm italic">Belum ada doa tersedia</div>
        ) : filteredDoa.map((doa, i) => (
          <button
            key={`doa-${doa.id}-${i}`}
            onClick={() => setSelected(doa)}
            className="flex items-center justify-between bg-white p-5 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-md transition-all text-left"
          >
            <div>
              <h4 className="font-bold text-gray-800 text-sm">{doa.field2}</h4>
              <p className="text-[10px] text-gray-400 font-medium">Harian • Spiritual</p>
            </div>
            <ChevronRight size={18} className="text-gray-300" />
          </button>
        ))}
      </div>

      {selected && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white w-full max-w-sm rounded-[2.5rem] p-8 space-y-6 relative"
          >
            <button 
              onClick={() => setSelected(null)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400"
            >
              <X size={16} />
            </button>
            <div className="text-center space-y-4">
              <div className="w-12 h-12 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto">
                <Heart size={24} />
              </div>
              <h3 className="text-xl font-display font-bold text-gray-800">{selected.field2}</h3>
            </div>
            
            <div className="space-y-6 bg-gray-50 p-6 rounded-[2rem] border border-gray-100">
              <p className="text-2xl font-serif text-right text-hw-dark leading-loose">{selected.field1}</p>
              <div className="space-y-2">
                <p className="text-xs text-hw-green font-bold italic line-clamp-2">{selected.field3}</p>
                <div className="h-px bg-gray-200"></div>
                <p className="text-xs text-gray-600 leading-relaxed">"{selected.field4}"</p>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

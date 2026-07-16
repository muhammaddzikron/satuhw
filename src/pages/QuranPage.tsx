import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { Book, Search, ChevronRight, Volume2, Play, Pause, X, ArrowLeft } from 'lucide-react';
import { quranService } from '../services/quranService';
import { QuranSurah } from '../types';
import LoadingPage from './LoadingPage';

export default function QuranPage() {
  const navigate = useNavigate();
  const [surahs, setSurahs] = useState<QuranSurah[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selection, setSelection] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    const fetchSurahs = async () => {
      const data = await quranService.getSurahList();
      setSurahs(data);
      setLoading(false);
    };
    fetchSurahs();
  }, []);

  const handleSelect = async (nomor: number) => {
    setDetailLoading(true);
    const data = await quranService.getSurahDetail(nomor);
    setSelection(data);
    setDetailLoading(false);
  };

  const filteredSurahs = surahs.filter(s => 
    s.namaLatin.toLowerCase().includes(search.toLowerCase()) || 
    s.nomor.toString().includes(search)
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
        <div className="p-3 bg-hw-green/10 rounded-2xl text-hw-green">
          <Book size={24} />
        </div>
        <h2 className="text-2xl font-display font-bold text-gray-800">Al-Qur'an</h2>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input 
          type="text" 
          placeholder="Cari Surah..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-white border border-gray-100 rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-hw-green/20 outline-none text-sm shadow-sm"
        />
      </div>

      <div className="grid grid-cols-1 gap-3">
        {filteredSurahs.map((s, i) => (
          <button
            key={`${s.nomor}-${i}`}
            onClick={() => handleSelect(s.nomor)}
            className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all text-left group"
          >
            <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-hw-green font-bold text-xs border border-gray-100 group-hover:bg-hw-green group-hover:text-white transition-colors">
              {s.nomor}
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-gray-800 text-sm">{s.namaLatin}</h4>
              <p className="text-[10px] text-gray-400 font-medium">{s.jumlahAyat} Ayat • {s.nama}</p>
            </div>
            <ChevronRight size={16} className="text-gray-300 group-hover:text-hw-green transition-colors" />
          </button>
        ))}
      </div>

      {/* Detail Modal */}
      {selection && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm">
          <motion.div 
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            className="bg-white w-full max-w-md h-[90vh] sm:h-auto sm:max-h-[85vh] rounded-t-[2.5rem] sm:rounded-[2.5rem] flex flex-col overflow-hidden"
          >
            <div className="p-6 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <div>
                <h3 className="text-xl font-display font-bold text-gray-800">{selection.namaLatin}</h3>
                <p className="text-xs text-gray-500">{selection.arti} • {selection.jumlahAyat} Ayat</p>
              </div>
              <button 
                onClick={() => setSelection(null)}
                className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-8 pb-10">
              <div className="text-center bg-gray-50 p-6 rounded-3xl mb-8">
                <p className="text-3xl font-serif text-hw-dark leading-loose">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</p>
              </div>
              
              {(Array.isArray(selection?.ayat) ? selection.ayat : []).map((a: any, i: number) => (
                <div key={`${a.nomorAyat}-${i}`} className="space-y-4 border-b border-gray-50 pb-6">
                  <div className="flex justify-between items-start gap-4">
                    <div className="w-8 h-8 rounded-lg bg-hw-green/10 text-hw-green flex items-center justify-center text-[10px] font-bold shrink-0">
                      {a.nomorAyat}
                    </div>
                    <p className="text-2xl font-serif text-right text-hw-dark leading-[2.5]">{a.teksArab}</p>
                  </div>
                  <div className="space-y-1 pl-4 border-l-2 border-hw-green/20">
                    <p className="text-[10px] text-gray-400 italic">{a.teksLatin}</p>
                    <p className="text-xs text-gray-600 leading-relaxed">{a.teksIndonesia}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

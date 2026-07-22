import React, { useEffect, useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import { 
  BookOpen, 
  Search, 
  Filter, 
  Lock, 
  ChevronRight, 
  Clock, 
  Tag, 
  FileText,
  AlertCircle,
  ArrowLeft,
  X,
  Award,
  Download
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { sheetsService } from '../services/sheetsService';
import { Materi } from '../types';
import LoadingPage from './LoadingPage';
import { safeJsonParse } from '../lib/utils';

const ROLE_DISPLAY: Record<string, string> = {
  umum: 'Umum',
  kwarda: 'Kwarda',
  sugli: 'Sugli',
  jati1: 'Jati 1',
  jati2: 'Jati 2',
  jari1: 'Jari 1',
  umum_pandu: 'Umum Pandu'
};

const KATEGORI_COLORS: Record<string, string> = {
  umum: 'bg-blue-100 text-blue-600',
  kwarda: 'bg-purple-100 text-purple-600',
  sugli: 'bg-orange-100 text-orange-600',
  jati1: 'bg-green-100 text-green-600',
  jati2: 'bg-emerald-100 text-emerald-600',
  jari1: 'bg-yellow-100 text-yellow-600',
  umum_pandu: 'bg-teal-100 text-teal-600'
};

export default function MateriPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, activeRole } = useAuthStore();
  const [materi, setMateri] = useState<Materi[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('umum');
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (location.state?.searchQuery) {
      setSearch(location.state.searchQuery);
    }
    if (location.state?.filter) {
      setFilter(location.state.filter);
    }
  }, [location.state]);

  useEffect(() => {
    const fetchMateri = async () => {
      setLoading(true);
      try {
        // Collect all roles user has access to
        // Everyone has access to 'umum' and 'umum_pandu' (for display, though access is verified)
        let rolesToFetch = ['umum', 'umum_pandu'];
        
        if (isAuthenticated && user?.roles && Array.isArray(user.roles) && user.roles.length > 0) {
          rolesToFetch = Array.from(new Set(['umum', 'umum_pandu', ...user.roles]));
        } else if (isAuthenticated && activeRole) {
          rolesToFetch = Array.from(new Set(['umum', 'umum_pandu', activeRole]));
        }

        // Special case: admin/superadmin sees everything
        const isPrivileged = activeRole === 'admin' || activeRole === 'superadmin' || (user?.role === 'admin' || user?.role === 'superadmin');
        if (isPrivileged) {
          rolesToFetch = ['umum', 'umum_pandu', 'jati1', 'jati2', 'jari1', 'sugli', 'kwarda'];
        }

        const results = await Promise.all(rolesToFetch.map(r => sheetsService.getMateri(r)));
        const flatResults = results.flat().filter(Boolean);
        
        // Remove duplicates
        const uniqueResults = Array.from(new Map(flatResults.map(item => [item.id, item])).values());
        
        setMateri(uniqueResults);
      } catch (error) {
        console.error('Error fetching materi:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchMateri();
  }, [activeRole, user?.roles, isAuthenticated, user?.role]);

  const hasAccess = (cat: string) => {
    if (cat === 'umum_pandu') return isAuthenticated;
    if (!isAuthenticated) return cat === 'umum';
    const isPrivileged = activeRole === 'superadmin' || activeRole === 'admin' || user?.role === 'superadmin' || user?.role === 'admin';
    if (isPrivileged) return true;
    if (cat === 'semua' || cat === 'umum') return true;
    
    // Check if category is in user's roles
    if (user?.roles && user.roles.includes(cat as any)) return true;
    
    return activeRole === cat;
  };

  const filteredMateri = materi.filter(m => {
    const matchFilter = filter === 'semua' || m.kategori === filter || (filter === 'umum' && m.kategori === 'umum_pandu');
    const matchSearch = m.judul.toLowerCase().includes(search.toLowerCase()) || 
                       m.konten.toLowerCase().includes(search.toLowerCase());
    // 'umum_pandu' is visible inline in 'umum' list even to guests, but lock/download is restricted
    const isAccessible = m.kategori === 'umum_pandu' ? true : hasAccess(m.kategori);
    return matchFilter && matchSearch && isAccessible;
  });

  const handleUpgradeRequest = async (cat: string) => {
    if (!user) return;
    try {
      setLoading(true);
      await sheetsService.requestUpgrade(user.id, cat);
      alert('Permohonan upgrade telah dikirim. Silakan tunggu verifikasi admin.');
    } catch (error) {
      alert('Gagal mengirim permohonan upgrade');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingPage />;

  const noAccess = !hasAccess(filter);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/')} 
            className="p-2 bg-white border border-gray-100 rounded-xl text-gray-400 hover:text-hw-green transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-xl font-display font-bold text-gray-800">SATU HW JATENG</h2>
            <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">HIZBUL WATHAN SUPER APPS</p>
          </div>
        </div>
        {!isAuthenticated && (
          <div className="flex items-center gap-1 bg-yellow-50 text-yellow-700 px-3 py-1 rounded-full text-[10px] font-bold border border-yellow-100">
            <Lock size={12} /> Mode Terbatas
          </div>
        )}
      </div>



      {/* Search & Filter */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Cari materi..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white border border-gray-100 rounded-2xl py-4 pl-12 pr-12 focus:ring-2 focus:ring-hw-green/20 outline-none text-sm shadow-sm"
          />
          {search && (
            <button 
              onClick={() => setSearch('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-hw-green"
            >
              <X size={18} />
            </button>
          )}
        </div>
        
        <div className="flex flex-wrap gap-2 pb-2">
          {['umum', 'jati1', 'jati2', 'jari1', 'sugli', 'kwarda'].map((k) => (
            <button
              key={k}
              onClick={() => setFilter(k)}
              className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                filter === k 
                ? 'gradient-bg text-white shadow-md' 
                : 'bg-white text-gray-500 border border-gray-100'
              }`}
            >
              {ROLE_DISPLAY[k] || k}
            </button>
          ))}
        </div>

        {search && (
          <div className="px-1">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              Hasil Pencarian: <span className="text-hw-green">{filteredMateri.length}</span> materi ditemukan
            </p>
          </div>
        )}
      </div>

      {/* Materi List */}
      <div className="grid grid-cols-1 gap-4">
        {noAccess ? (
          <div className="bg-white rounded-3xl p-10 text-center space-y-6 shadow-sm border border-gray-100">
            <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-rose-100">
              <Lock size={40} />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-display font-bold text-gray-800">Maaf Belum mempunyai Akses</h3>
              <p className="text-sm text-gray-500 max-w-xs mx-auto">
                Materi kategori <span className="font-bold text-hw-green">{ROLE_DISPLAY[filter] || filter}</span> hanya tersedia untuk anggota dengan akses khusus.
              </p>
            </div>
            <button 
              onClick={() => handleUpgradeRequest(filter)}
              className="w-full max-w-xs mx-auto py-4 rounded-2xl bg-hw-green text-white font-bold shadow-lg shadow-hw-green/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              <Award size={20} />
              UPGRADE SEKARANG
            </button>
          </div>
        ) : filteredMateri.length > 0 ? (
          filteredMateri.map((item, index) => (
            <motion.div
              key={`materi-${item.id}-${index}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100 hover:shadow-md transition-all group flex items-center gap-4"
            >
              <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-gray-50 flex items-center justify-center border border-gray-100">
                <img 
                  src={item.coverImage || 'https://upload.wikimedia.org/wikipedia/id/b/ba/Logo_Hizbul_Wathan.png'} 
                  alt={item.judul} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                />
              </div>
              
              <div className="flex-1 min-w-0 py-1">
                <div className={`inline-block px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-tighter mb-1 ${KATEGORI_COLORS[item.kategori] || 'bg-gray-100 text-gray-600'}`}>
                  {ROLE_DISPLAY[item.kategori] || item.kategori}
                </div>
                <h3 className="font-display font-bold text-gray-800 text-sm leading-tight break-words group-hover:text-hw-green transition-colors">
                  {item.judul}
                </h3>
                <p className="text-gray-400 text-[10px] font-medium mt-1">
                  {new Date(item.tanggal).toLocaleDateString('id-ID')}
                </p>
              </div>

              <div className="flex items-center shrink-0 ml-auto mr-2">
                {item.kategori === 'umum_pandu' && !isAuthenticated ? (
                  <Link
                    to="/login"
                    className="flex flex-col items-center justify-center gap-1 p-3 bg-amber-50 text-amber-600 rounded-2xl hover:bg-amber-100 transition-all border border-amber-200 min-w-[80px]"
                    title="Login untuk mengakses materi ini"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Lock size={20} />
                    <span className="text-[9px] font-black uppercase tracking-tighter">Log In</span>
                  </Link>
                ) : item.driveUrl && (
                  <a 
                    href={item.driveUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex flex-col items-center justify-center gap-1 p-3 bg-hw-green/10 text-hw-green rounded-2xl hover:bg-hw-green hover:text-white transition-all border border-hw-green/20 min-w-[80px]"
                    title="Download / Buka Materi"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Download size={20} />
                    <span className="text-[9px] font-black uppercase tracking-tighter">Materi</span>
                  </a>
                )}
              </div>
            </motion.div>
          ))
        ) : (
          <div className="text-center py-20 px-10 space-y-4">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto text-gray-300">
              <FileText size={32} />
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-gray-800">Materi Tidak Ditemukan</h4>
              <p className="text-xs text-gray-500">Coba gunakan kata kunci lain atau filter kategori yang berbeda.</p>
            </div>
          </div>
        )}
      </div>

      {!isAuthenticated && (
        <div className="bg-hw-blue/10 p-5 rounded-3xl border border-hw-blue/20 flex gap-4 items-start">
          <AlertCircle className="text-hw-blue shrink-0" size={24} />
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-hw-blue">Akses Premium</h4>
            <p className="text-xs text-gray-600 leading-relaxed">Anda saat ini berada dalam mode umum. Silakan login untuk mendapatkan akses ke materi Jati, Jari, dan lainnya.</p>
            <Link to="/login" className="inline-block pt-1 text-xs font-black text-hw-blue hover:underline">MASUK SEKARANG &rarr;</Link>
          </div>
        </div>
      )}
    </div>
  );
}

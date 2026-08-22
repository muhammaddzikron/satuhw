import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
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
  Download,
  LogIn,
  ExternalLink,
  MessageCircle
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { sheetsService } from '../services/sheetsService';
import { ActivationModal } from '../components/ActivationModal';
import { Materi } from '../types';
import LoadingPage from './LoadingPage';
import { safeJsonParse, getCorsSafeUrl } from '../lib/utils';
import { normalizeTrainingKey } from '../utils/trainingUtils';

const ROLE_DISPLAY: Record<string, string> = {
  umum: 'Umum',
  umum_pandu: 'Umum Pandu',
  jati1: 'Jaya Melati 1',
  jayamelati1: 'Jaya Melati 1',
  jati2: 'Jaya Melati 2',
  jayamelati2: 'Jaya Melati 2',
  jari1: 'Jaya Matahari 1',
  jayamatahari1: 'Jaya Matahari 1',
  jari2: 'Jaya Matahari 2',
  jayamatahari2: 'Jaya Matahari 2',
  jawi: 'Jaya Pertiwi',
  jayapertiwi: 'Jaya Pertiwi',
  sugli: 'Dewan Sugli',
  kwarda: 'Kwarda'
};

const KATEGORI_COLORS: Record<string, string> = {
  umum: 'bg-blue-100 text-blue-600',
  umum_pandu: 'bg-teal-100 text-teal-600',
  kwarda: 'bg-purple-100 text-purple-600',
  sugli: 'bg-orange-100 text-orange-600',
  jati1: 'bg-green-100 text-green-600',
  jayamelati1: 'bg-green-100 text-green-600',
  jati2: 'bg-emerald-100 text-emerald-600',
  jayamelati2: 'bg-emerald-100 text-emerald-600',
  jari1: 'bg-yellow-100 text-yellow-600',
  jayamatahari1: 'bg-yellow-100 text-yellow-600',
  jari2: 'bg-amber-100 text-amber-600',
  jayamatahari2: 'bg-amber-100 text-amber-600',
  jawi: 'bg-rose-100 text-rose-600',
  jayapertiwi: 'bg-rose-100 text-rose-600'
};

const UPGRADE_FEES_DEFAULT: Record<string, string> = {
  jati1: 'Rp 50.000',
  jati2: 'Rp 50.000',
  jari1: 'Rp 50.000',
  jari2: 'Rp 50.000',
  jawi: 'Rp 50.000',
  sugli: 'Rp 0',
  kwarda: 'Rp 0'
};

const getUserRoleCategories = (user: any, apps: any[] = []): string[] => {
  if (!user) return ['umum'];
  const categories = new Set<string>(['umum', 'umum_pandu']);

  const isPrivileged = user.role === 'admin' || user.role === 'superadmin' || user.role === 'admin_diklat' || user.role === 'diklat' || user.activeRole === 'admin' || user.activeRole === 'superadmin' || (user as any).adminType === 'diklat';
  if (isPrivileged) {
    return ['umum', 'umum_pandu', 'jati1', 'jati2', 'jari1', 'jari2', 'jawi', 'sugli', 'kwarda'];
  }

  const addCategoryByText = (txt?: string) => {
    if (!txt) return;
    const norm = normalizeTrainingKey(txt);
    if (norm) {
      categories.add(norm);
    }
  };

  // 1. Check user.role & user.activeRole
  addCategoryByText(user.role);
  addCategoryByText(user.activeRole);
  if (user.role) categories.add(normalizeTrainingKey(user.role) || user.role);
  if (user.activeRole) categories.add(normalizeTrainingKey(user.activeRole) || user.activeRole);

  // 2. Check user.roles array
  if (user.roles && Array.isArray(user.roles)) {
    user.roles.forEach(r => {
      const norm = normalizeTrainingKey(r) || r;
      categories.add(norm);
      addCategoryByText(r);
    });
  }

  // 3. Check user.pelatihan
  if (user.pelatihan) {
    if (Array.isArray(user.pelatihan)) {
      user.pelatihan.forEach(p => addCategoryByText(p));
    } else if (typeof user.pelatihan === 'string') {
      addCategoryByText(user.pelatihan);
    }
  }

  // 4. Check user.golongan & pelatihGolongan
  addCategoryByText(user.golongan);
  addCategoryByText((user as any).pelatihGolongan);

  // 5. Check training applications
  if (apps && Array.isArray(apps)) {
    apps.forEach(app => {
      const isMatch = (app.email && user.email && app.email.toLowerCase() === user.email.toLowerCase()) ||
                      (app.userId && user.id && String(app.userId) === String(user.id));
      if (isMatch) {
        const normKey = normalizeTrainingKey(app.pelatihanAkanDiikuti);
        if (normKey === 'jati1') {
          // Auto-grant Jaya Melati 1 access for registered participants without needing manual upgrade
          categories.add('jati1');
        } else {
          const isApproved = app.status === 'approved' || app.status === 'terverifikasi' || app.status === 'disetujui' || app.statusPembayaran === 'Lunas' || app.statusKelulusan === 'Lulus';
          if (isApproved) {
            addCategoryByText(app.pelatihanAkanDiikuti);
          }
        }
      }
    });
  }

  return Array.from(categories);
};

export default function MateriPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, activeRole, updateUser } = useAuthStore();
  const [materi, setMateri] = useState<Materi[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('umum');
  const [search, setSearch] = useState('');
  const [selectedMateri, setSelectedMateri] = useState<Materi | null>(null);
  const [showLoginPromptModal, setShowLoginPromptModal] = useState<Materi | null>(null);
  const [showActivationModal, setShowActivationModal] = useState(false);
  const [activationFeatureName, setActivationFeatureName] = useState('Materi Premium');
  const [upgradeFees, setUpgradeFees] = useState<Record<string, string>>(UPGRADE_FEES_DEFAULT);
  const [waNumber, setWaNumber] = useState('6281234567890');

  const [trainingApps, setTrainingApps] = useState<any[]>([]);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const s = await sheetsService.getSettings();
        if (Array.isArray(s.upgradeFees)) {
          const map: Record<string, string> = { ...UPGRADE_FEES_DEFAULT };
          s.upgradeFees.forEach((fee: any) => {
            if (fee.id && fee.value) {
              map[fee.id] = fee.value;
            }
          });
          setUpgradeFees(map);
        }
        if (s.waConfirmation) {
          setWaNumber(s.waConfirmation);
        }
      } catch (e) {}
    };
    fetchSettings();
  }, []);

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
        let apps: any[] = [];
        try {
          apps = await sheetsService.getTrainingApplications();
          setTrainingApps(apps || []);
        } catch (e) {}

        const userCategories = getUserRoleCategories(user, apps);
        const isPrivileged = activeRole === 'admin' || activeRole === 'superadmin' || user?.role === 'admin' || user?.role === 'superadmin' || user?.role === 'admin_diklat' || user?.role === 'diklat';
        
        let rolesToFetch = isPrivileged
          ? ['umum', 'umum_pandu', 'jati1', 'jati2', 'jari1', 'jari2', 'jawi', 'sugli', 'kwarda']
          : Array.from(new Set(['umum', 'umum_pandu', ...userCategories, activeRole].filter(Boolean)));

        const results = await Promise.all(rolesToFetch.map(r => sheetsService.getMateri(r)));
        const flatResults = results.flat().filter(Boolean);
        
        // Remove duplicates safely
        const uniqueResults = Array.from(
          new Map(flatResults.map(item => [item?.id || item?.judul || String(Math.random()), item])).values()
        ).filter(Boolean);
        
        setMateri(uniqueResults);
      } catch (error) {
        console.error('Error fetching materi:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchMateri();
  }, [activeRole, user, isAuthenticated]);

  const isJati1Participant = Boolean(
    user && (
      (user.roles && (user.roles.includes('jati1') || user.roles.includes('Jaya Melati 1'))) ||
      (user.pelatihan && (user.pelatihan.includes('Jati 1') || user.pelatihan.includes('Jaya Melati 1'))) ||
      trainingApps.some(app => {
        const isMatch = (app.email && user.email && app.email.toLowerCase() === user.email.toLowerCase()) ||
                        (app.userId && user.id && String(app.userId) === String(user.id));
        return isMatch && normalizeTrainingKey(app.pelatihanAkanDiikuti) === 'jati1';
      })
    )
  );

  const isAccountActive = Boolean(
    user && (
      user.role === 'admin' || 
      user.role === 'superadmin' || 
      user.role === 'admin_diklat' || 
      user.role === 'diklat' || 
      user.statusAktivasi === 'Aktif' || 
      user.statusPembayaran === 'Lunas' || 
      user.isVerified === true ||
      isJati1Participant
    )
  );

  useEffect(() => {
    if (location.state?.selectedMateriId && materi.length > 0) {
      const found = materi.find(m => m && String(m.id) === String(location.state.selectedMateriId));
      if (found) {
        if (found.kategori !== 'umum' && !isAuthenticated) {
          setShowLoginPromptModal(found);
        } else if (found.kategori !== 'umum' && isAuthenticated && !isAccountActive) {
          setActivationFeatureName(`Materi: ${found.judul}`);
          setShowActivationModal(true);
        } else {
          setSelectedMateri(found);
        }
      }
    }
  }, [location.state?.selectedMateriId, materi, isAuthenticated, isAccountActive]);

  const hasAccess = (cat: string) => {
    if (!cat || cat === 'semua' || cat === 'umum') return true;
    if (cat === 'umum_pandu') return isAuthenticated && isAccountActive;
    if (!isAuthenticated || !isAccountActive) return false;
    const isPrivileged = activeRole === 'superadmin' || activeRole === 'admin' || user?.role === 'superadmin' || user?.role === 'admin' || user?.role === 'admin_diklat' || user?.role === 'diklat';
    if (isPrivileged) return true;
    
    const userCategories = getUserRoleCategories(user, trainingApps);
    return userCategories.includes(cat);
  };

  const filteredMateri = useMemo(() => {
    return (materi || []).filter(m => {
      if (!m) return false;
      const searchStr = String(search || '').toLowerCase().trim();
      const kat = String(m.kategori || 'umum').toLowerCase();
      
      const matchFilter = searchStr
        ? (filter === 'semua' || kat === filter || (filter === 'umum' && (kat === 'umum' || kat === 'umum_pandu')) || hasAccess(kat))
        : (filter === 'semua' || kat === filter || (filter === 'umum' && (kat === 'umum' || kat === 'umum_pandu')));

      const judul = String(m.judul || '').toLowerCase();
      const konten = String(m.konten || '').toLowerCase();
      const matchSearch = !searchStr || judul.includes(searchStr) || konten.includes(searchStr);

      const isAccessible = kat === 'umum' ? true : kat === 'umum_pandu' ? true : hasAccess(kat);
      return matchFilter && matchSearch && isAccessible;
    });
  }, [materi, filter, search, isAuthenticated, isAccountActive, activeRole, user?.roles, user?.role, trainingApps]);

  const handleItemClick = (item: Materi) => {
    if (!item) return;

    if (item.kategori !== 'umum' && !isAuthenticated) {
      setShowLoginPromptModal(item);
      return;
    }

    if (item.kategori !== 'umum' && isAuthenticated && !isAccountActive) {
      setActivationFeatureName(`Materi: ${item.judul}`);
      setShowActivationModal(true);
      return;
    }

    if (item.kategori !== 'umum' && item.kategori !== 'umum_pandu') {
      const isPrivileged = user?.role === 'superadmin' || user?.role === 'admin' || user?.role === 'admin_diklat' || user?.role === 'diklat';
      if (!isPrivileged) {
        const userCategories = getUserRoleCategories(user, trainingApps);
        if (!userCategories.includes(item.kategori)) {
          setFilter(item.kategori);
          return;
        }
      }
    }

    setSelectedMateri(item);
  };

  const userRequests: string[] = useMemo(() => {
    if (!user || !user.upgradeRequests) return [];
    if (Array.isArray(user.upgradeRequests)) return user.upgradeRequests;
    if (typeof user.upgradeRequests === 'string') {
      return safeJsonParse(user.upgradeRequests, []);
    }
    return [];
  }, [user]);

  const hasRequestedUpgrade = userRequests.includes(filter);
  const categoryFee = upgradeFees[filter] || 'Rp 50.000';

  const handleWhatsAppConfirm = (catKey: string, priceStr: string) => {
    const title = ROLE_DISPLAY[catKey] || catKey;
    let text = "";
    if (priceStr === 'Rp 0') {
      text = encodeURIComponent(`Assalamu'alaikum Admin, Saya telah mengajukan upgrade ke tingkat ${title}.\n\nNama: ${user?.namaLengkap || ''}\nEmail: ${user?.email || ''}\n\nMohon verifikasi pengajuan saya. Terima kasih.`);
    } else {
      text = encodeURIComponent(`Assalamu'alaikum Admin, Saya telah mengajukan upgrade ke tingkat ${title} dengan biaya ${priceStr}.\n\nNama: ${user?.namaLengkap || ''}\nEmail: ${user?.email || ''}\n\nMohon verifikasi pengajuan saya. Terima kasih.`);
    }
    window.open(`https://wa.me/${String(waNumber).replace(/[^0-9]/g, '')}?text=${text}`, '_blank');
  };

  const handleUpgradeRequest = async (cat: string) => {
    if (!user) {
      navigate('/login');
      return;
    }
    try {
      setLoading(true);
      const res = await sheetsService.requestUpgrade(user.id, cat, user);
      if (res.success || !res.error) {
        const currentRequests = Array.isArray(user.upgradeRequests)
          ? [...user.upgradeRequests]
          : typeof user.upgradeRequests === 'string'
            ? safeJsonParse(user.upgradeRequests, [])
            : [];
        if (!currentRequests.includes(cat)) {
          currentRequests.push(cat);
        }
        updateUser({ ...user, upgradeRequests: currentRequests });
        alert(`Pengajuan upgrade untuk ${ROLE_DISPLAY[cat] || cat} telah dikirim dengan biaya ${upgradeFees[cat] || 'Rp 50.000'}. Silakan tunggu proses verifikasi dari petugas.`);
      } else {
        alert(res.message || 'Gagal mengirim permohonan upgrade');
      }
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
            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-100 rounded-2xl text-gray-700 hover:text-hw-green transition-colors shadow-sm font-bold text-xs"
          >
            <ArrowLeft size={18} />
            <span>Kembali</span>
          </button>
          <div>
            <h2 className="text-lg font-display font-bold text-gray-800">SATU HW JATENG</h2>
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
            value={search || ''}
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
          {['umum', 'jati1', 'jati2', 'jari1', 'jari2', 'jawi', 'sugli', 'kwarda'].map((k) => (
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
          <div className="bg-white rounded-3xl p-8 sm:p-10 text-center space-y-6 shadow-sm border border-gray-100">
            <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-2 border border-rose-100">
              <Lock size={40} />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-display font-bold text-gray-800">Maaf Belum mempunyai Akses</h3>
              <p className="text-sm text-gray-500 max-w-xs mx-auto">
                Materi kategori <span className="font-bold text-hw-green">{ROLE_DISPLAY[filter] || filter}</span> hanya tersedia untuk anggota dengan akses khusus.
              </p>
            </div>

            {hasRequestedUpgrade ? (
              <div className="space-y-4 max-w-sm mx-auto pt-2">
                <div className="p-4 bg-amber-50 border border-amber-200/80 rounded-2xl text-left space-y-2 shadow-sm">
                  <div className="flex items-center gap-2 text-amber-800 font-bold text-xs">
                    <Clock size={18} className="text-amber-600 shrink-0" />
                    <span>Telah Mengajukan Upgrade</span>
                  </div>
                  <p className="text-xs text-amber-700 leading-relaxed">
                    Anda telah mengajukan upgrade untuk tingkat <span className="font-extrabold text-amber-900">{ROLE_DISPLAY[filter] || filter}</span> dengan biaya <span className="font-extrabold text-amber-900">{categoryFee}</span>. Silakan tunggu proses verifikasi dari petugas.
                  </p>
                </div>
                
                <div className="flex flex-col gap-2">
                  <button 
                    disabled
                    className="w-full py-3.5 rounded-2xl bg-amber-100 text-amber-800 font-bold text-xs flex items-center justify-center gap-2 cursor-not-allowed border border-amber-200"
                  >
                    <Clock size={16} />
                    Menunggu Verifikasi Petugas
                  </button>
                  {waNumber && (
                    <button
                      type="button"
                      onClick={() => handleWhatsAppConfirm(filter, categoryFee)}
                      className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-600/10 cursor-pointer"
                    >
                      <MessageCircle size={16} />
                      Konfirmasi via WhatsApp Admin
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <button 
                onClick={() => handleUpgradeRequest(filter)}
                className="w-full max-w-xs mx-auto py-4 rounded-2xl bg-hw-green text-white font-bold shadow-lg shadow-hw-green/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                <Award size={20} />
                UPGRADE SEKARANG
              </button>
            )}
          </div>
        ) : filteredMateri.length > 0 ? (
          filteredMateri.map((item, index) => (
            <motion.div
              key={`materi-${item.id}-${index}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => handleItemClick(item)}
              className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100 hover:shadow-md transition-all group flex items-center gap-4 cursor-pointer"
            >
              <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-gray-50 flex items-center justify-center border border-gray-100">
                <img 
                  src={getCorsSafeUrl(item.coverImage, item.updatedAt || item.id) || 'https://upload.wikimedia.org/wikipedia/id/b/ba/Logo_Hizbul_Wathan.png'} 
                  alt={item.judul} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                />
              </div>
              
              <div className="flex-1 min-w-0 py-1">
                <div className="flex items-center gap-1.5 flex-wrap mb-1">
                  <div className={`inline-block px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-tighter ${KATEGORI_COLORS[item.kategori] || 'bg-gray-100 text-gray-600'}`}>
                    {ROLE_DISPLAY[item.kategori] || item.kategori}
                  </div>
                  {item.kategori !== 'umum' && !isAuthenticated && (
                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[8px] font-black bg-amber-50 text-amber-600 border border-amber-200">
                      <Lock size={9} /> Perlu Login
                    </span>
                  )}
                  {item.kategori !== 'umum' && isAuthenticated && !isAccountActive && (
                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[8px] font-black bg-rose-50 text-rose-600 border border-rose-200">
                      <Lock size={9} /> Perlu Aktivasi
                    </span>
                  )}
                </div>
                <h3 className="font-display font-bold text-gray-800 text-sm leading-tight break-words group-hover:text-hw-green transition-colors">
                  {item.judul}
                </h3>
                <p className="text-gray-400 text-[10px] font-medium mt-1">
                  {item.tanggal ? new Date(item.tanggal).toLocaleDateString('id-ID') : 'Materi HW'}
                </p>
              </div>

              <div className="flex items-center shrink-0 ml-auto mr-1">
                {item.kategori !== 'umum' && !isAuthenticated ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowLoginPromptModal(item);
                    }}
                    className="flex flex-col items-center justify-center gap-1 p-2.5 bg-amber-50 text-amber-700 rounded-2xl hover:bg-amber-100 transition-all border border-amber-200 min-w-[76px] active:scale-95 cursor-pointer"
                    title="Login untuk mengakses materi ini"
                  >
                    <Lock size={18} />
                    <span className="text-[8px] font-black uppercase tracking-tighter">Log In</span>
                  </button>
                ) : item.kategori !== 'umum' && isAuthenticated && !isAccountActive ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActivationFeatureName(`Materi: ${item.judul}`);
                      setShowActivationModal(true);
                    }}
                    className="flex flex-col items-center justify-center gap-1 p-2.5 bg-rose-50 text-rose-600 rounded-2xl hover:bg-rose-100 transition-all border border-rose-200 min-w-[76px] active:scale-95 cursor-pointer"
                    title="Aktivasi Akun untuk membuka materi ini"
                  >
                    <Lock size={18} />
                    <span className="text-[8px] font-black uppercase tracking-tighter">Aktivasi</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleItemClick(item);
                    }}
                    className="flex flex-col items-center justify-center gap-1 p-2.5 bg-hw-green/10 text-hw-green rounded-2xl hover:bg-hw-green hover:text-white transition-all border border-hw-green/20 min-w-[76px] active:scale-95 cursor-pointer"
                    title="Buka / Baca Materi"
                  >
                    <BookOpen size={18} />
                    <span className="text-[8px] font-black uppercase tracking-tighter">Buka</span>
                  </button>
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

      {/* Lock Prompt Modal for 'umum_pandu' when guest */}
      <AnimatePresence>
        {showLoginPromptModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-5 border border-amber-100 relative text-center"
            >
              <button 
                onClick={() => setShowLoginPromptModal(null)}
                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 bg-gray-50 rounded-full"
              >
                <X size={18} />
              </button>

              <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto border border-amber-100 shadow-sm mt-2">
                <Lock size={32} />
              </div>

              <div className="space-y-2">
                <span className="inline-block px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-widest bg-teal-100 text-teal-700">
                  Kategori: Umum Pandu
                </span>
                <h3 className="text-base font-display font-bold text-gray-900 leading-snug">
                  {showLoginPromptModal.judul}
                </h3>
                <p className="text-xs text-gray-600 leading-relaxed pt-1">
                  Materi <span className="font-bold text-teal-700">Umum Pandu</span> hanya dapat dibuka dan dibaca setelah Anda melakukan login sebagai Anggota SATU HW JATENG.
                </p>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowLoginPromptModal(null)}
                  className="flex-1 py-3 bg-gray-100 text-gray-600 text-xs font-bold rounded-2xl hover:bg-gray-200 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowLoginPromptModal(null);
                    navigate('/login');
                  }}
                  className="flex-1 py-3 bg-amber-500 text-white text-xs font-bold rounded-2xl hover:bg-amber-600 transition-colors shadow-lg shadow-amber-500/20 flex items-center justify-center gap-1.5"
                >
                  <LogIn size={16} />
                  Login Sekarang
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Detail Materi Modal */}
      <AnimatePresence>
        {selectedMateri && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-6 max-w-lg w-full max-h-[85vh] overflow-y-auto shadow-2xl space-y-4 relative border border-gray-100"
            >
              <button 
                onClick={() => setSelectedMateri(null)}
                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 bg-gray-50 rounded-full"
              >
                <X size={18} />
              </button>

              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-[9px] font-extrabold uppercase tracking-widest ${KATEGORI_COLORS[selectedMateri.kategori] || 'bg-gray-100 text-gray-700'}`}>
                  {ROLE_DISPLAY[selectedMateri.kategori] || selectedMateri.kategori}
                </span>
                {selectedMateri.tanggal && (
                  <span className="text-[10px] text-gray-400 font-medium">
                    {new Date(selectedMateri.tanggal).toLocaleDateString('id-ID')}
                  </span>
                )}
              </div>

              <h3 className="text-lg font-display font-bold text-gray-900 leading-snug">
                {selectedMateri.judul}
              </h3>

              {selectedMateri.coverImage && (
                <div className="rounded-2xl overflow-hidden bg-gray-50 border border-gray-100 max-h-56">
                  <img 
                    src={getCorsSafeUrl(selectedMateri.coverImage, selectedMateri.updatedAt || selectedMateri.id)} 
                    alt={selectedMateri.judul} 
                    className="w-full h-full object-cover" 
                  />
                </div>
              )}

              <div className="text-xs text-gray-700 leading-relaxed whitespace-pre-line bg-gray-50 p-4 rounded-2xl border border-gray-100/60 max-h-60 overflow-y-auto">
                {selectedMateri.konten || 'Tidak ada uraian ringkas untuk materi ini.'}
              </div>

              {selectedMateri.driveUrl && (
                <a
                  href={selectedMateri.driveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3.5 bg-hw-green text-white text-xs font-bold rounded-2xl hover:bg-emerald-700 transition-all shadow-lg shadow-hw-green/20 flex items-center justify-center gap-2"
                >
                  <Download size={18} />
                  Buka File / Google Drive
                  <ExternalLink size={14} className="opacity-70" />
                </a>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Activation Modal */}
      <ActivationModal 
        isOpen={showActivationModal} 
        onClose={() => setShowActivationModal(false)} 
        featureName={activationFeatureName} 
      />
    </div>
  );
}


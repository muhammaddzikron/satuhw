import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calendar, 
  MapPin, 
  Tag, 
  Users, 
  CheckCircle2, 
  ChevronRight, 
  ArrowLeft, 
  Search, 
  Info, 
  Sparkles, 
  LogIn, 
  UserPlus, 
  CreditCard, 
  ShieldCheck, 
  Clock, 
  Loader2, 
  QrCode, 
  Check, 
  X,
  Share2,
  Award
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { sheetsService } from '../services/sheetsService';

export default function KegiatanPage() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();

  const [activities, setActivities] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Semua');

  const [selectedActivity, setSelectedActivity] = useState<any | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);

  // Quick Login Modal State inside registration flow if not logged in
  const [showQuickLogin, setShowQuickLogin] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Registration Form State
  const [formData, setFormData] = useState({
    namaLengkap: '',
    nik: '',
    jenisKelamin: 'L',
    tempatLahir: '',
    tanggalLahir: '',
    golongan: 'Pengenal',
    asalKwarda: 'Jawa Tengah',
    qabilah: '',
    noHp: '',
    email: '',
    alamat: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [regSuccess, setRegSuccess] = useState<any | null>(null);

  useEffect(() => {
    loadActivities();
  }, []);

  const loadActivities = async () => {
    setIsLoading(true);
    try {
      const list = await sheetsService.getActivities();
      setActivities(list || []);
    } catch (e) {
      console.error('Error loading activities:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user && isAuthenticated) {
      setFormData(prev => ({
        ...prev,
        namaLengkap: user.namaLengkap || prev.namaLengkap,
        nik: user.nik || prev.nik,
        jenisKelamin: user.jenisKelamin || prev.jenisKelamin,
        tempatLahir: (user as any).tempatLahir || prev.tempatLahir,
        tanggalLahir: (user as any).tanggalLahir || prev.tanggalLahir,
        golongan: user.golongan || prev.golongan,
        asalKwarda: user.asalKwarda || prev.asalKwarda,
        qabilah: user.qabilah || prev.qabilah,
        noHp: user.noHp || prev.noHp,
        email: user.email || prev.email,
        alamat: user.alamat || prev.alamat
      }));
    }
  }, [user, isAuthenticated]);

  const categories = ['Semua', 'Kemah Bakti', 'Jambore', 'Muswil', 'Pelatihan Khusus', 'Silaturahmi'];

  const filteredActivities = activities.filter(act => {
    const matchesSearch = (act.namaKegiatan || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (act.lokasi || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'Semua' || act.kategori === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleQuickLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setIsLoggingIn(true);
    try {
      const result = await sheetsService.login(loginEmail, loginPassword);
      if (result && result.user) {
        useAuthStore.getState().setAuth(result.user, result.token || 'mock-jwt-token');
        setShowQuickLogin(false);
        // Pre-fill form data
        setFormData(prev => ({
          ...prev,
          namaLengkap: result.user.namaLengkap || prev.namaLengkap,
          nik: result.user.nik || prev.nik,
          jenisKelamin: result.user.jenisKelamin || prev.jenisKelamin,
          golongan: result.user.golongan || prev.golongan,
          asalKwarda: result.user.asalKwarda || prev.asalKwarda,
          qabilah: result.user.qabilah || prev.qabilah,
          noHp: result.user.noHp || prev.noHp,
          email: result.user.email || prev.email,
          alamat: result.user.alamat || prev.alamat
        }));
      } else {
        setLoginError('Email atau password salah. Silakan coba lagi.');
      }
    } catch (err: any) {
      setLoginError(err.message || 'Gagal login');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedActivity) return;
    if (!formData.namaLengkap || !formData.noHp) {
      alert('Mohon isi Nama Lengkap dan No. WhatsApp/HP');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        activityId: selectedActivity.id,
        namaKegiatan: selectedActivity.namaKegiatan,
        userId: user?.id || `user-act-${Date.now()}`,
        ...formData,
        status: 'approved',
        tanggalDaftar: new Date().toISOString()
      };

      const result = await sheetsService.registerActivity(payload);
      setRegSuccess({
        id: result.id,
        activity: selectedActivity,
        participant: formData,
        ktaIssued: true
      });
    } catch (e: any) {
      alert('Gagal mendaftar kegiatan: ' + e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Bar */}
      <div className="flex items-center justify-between">
        <button 
          onClick={() => navigate('/')} 
          className="flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-hw-dark transition-colors bg-white px-3 py-2 rounded-xl border border-gray-100 shadow-xs cursor-pointer"
        >
          <ArrowLeft size={16} /> Beranda
        </button>
        <div className="text-right">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-hw-green">Agenda Resmi</span>
          <h2 className="text-base font-black text-hw-dark font-display leading-none">Kegiatan HW Jateng</h2>
        </div>
      </div>

      {/* Hero Banner */}
      <div className="relative rounded-[2rem] overflow-hidden bg-gradient-to-r from-hw-dark via-emerald-950 to-hw-green p-6 text-white shadow-xl">
        <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none transform translate-x-8 translate-y-8">
          <Sparkles size={200} />
        </div>
        <div className="relative z-10 space-y-3 max-w-md">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full border border-white/20 text-[10px] font-extrabold uppercase tracking-widest text-emerald-200">
            <Sparkles size={12} /> Kwartir Wilayah HW Jawa Tengah
          </div>
          <h1 className="text-xl font-black font-display leading-tight">
            Agenda & Kegiatan Pandu Hizbul Wathan
          </h1>
          <p className="text-xs text-emerald-100/90 leading-relaxed font-medium">
            Ikuti berbagai kegiatan resmi HW Jateng seperti Kemah Bakti, Jambore Wilayah, dan Musyawarah. Dapatkan KTA Digital resmi sebagai identitas peserta!
          </p>
        </div>
      </div>

      {/* Search & Category Filter */}
      <div className="space-y-3">
        <div className="relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder="Cari kegiatan atau lokasi..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-white border border-gray-150 rounded-2xl text-xs font-bold focus:ring-2 focus:ring-hw-green/20 outline-none shadow-xs"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-black whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat 
                  ? 'bg-hw-green text-white shadow-md shadow-hw-green/20' 
                  : 'bg-white text-gray-500 border border-gray-100 hover:border-gray-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Activity List */}
      {isLoading ? (
        <div className="py-12 text-center text-gray-400 space-y-2">
          <Loader2 size={32} className="animate-spin mx-auto text-hw-green" />
          <p className="text-xs font-bold">Memuat daftar kegiatan HW Jateng...</p>
        </div>
      ) : filteredActivities.length === 0 ? (
        <div className="py-12 bg-white rounded-3xl border border-gray-100 text-center p-6 space-y-3">
          <Info size={40} className="mx-auto text-gray-300" />
          <p className="text-xs font-bold text-gray-500">Belum ada kegiatan untuk kategori ini.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredActivities.map((activity) => (
            <motion.div
              key={activity.id}
              whileHover={{ y: -2 }}
              className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-all flex flex-col sm:flex-row"
            >
              <div className="sm:w-2/5 h-44 sm:h-auto relative bg-gray-100 shrink-0 overflow-hidden">
                <img 
                  src={activity.gambarUrl || 'https://images.unsplash.com/photo-1510312305653-8ed496efae75?auto=format&fit=crop&q=80&w=800'} 
                  alt={activity.namaKegiatan} 
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-3 left-3 bg-hw-dark/80 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full">
                  {activity.kategori || 'Kegiatan'}
                </div>
                <div className={`absolute top-3 right-3 text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full ${
                  activity.status === 'Tutup' ? 'bg-rose-500 text-white' : 'bg-emerald-500 text-white'
                }`}>
                  {activity.status || 'Buka'}
                </div>
              </div>

              <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                <div className="space-y-2">
                  <h3 className="text-sm font-black text-hw-dark font-display leading-snug">
                    {activity.namaKegiatan}
                  </h3>
                  <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                    {activity.deskripsi}
                  </p>
                  
                  <div className="grid grid-cols-2 gap-2 text-[11px] font-bold text-gray-600 pt-1">
                    <div className="flex items-center gap-1.5 text-emerald-700">
                      <Calendar size={14} className="shrink-0" />
                      <span className="truncate">{activity.tanggal}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-hw-dark">
                      <MapPin size={14} className="shrink-0 text-amber-600" />
                      <span className="truncate">{activity.lokasi}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-purple-700">
                      <Tag size={14} className="shrink-0" />
                      <span>Infaq: {activity.biaya || 'Gratis'}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-blue-700">
                      <Users size={14} className="shrink-0" />
                      <span>{activity.kuota || 'Terbuka'}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-gray-50">
                  <button
                    onClick={() => {
                      setSelectedActivity(activity);
                      setIsDetailModalOpen(true);
                    }}
                    className="flex-1 py-2.5 bg-hw-green hover:bg-emerald-700 text-white rounded-2xl text-xs font-black uppercase tracking-wider transition-all shadow-md shadow-hw-green/15 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    Detail & Daftar <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* DETAIL MODAL */}
      <AnimatePresence>
        {isDetailModalOpen && selectedActivity && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[2.5rem] border border-gray-100 shadow-2xl max-w-lg w-full overflow-hidden max-h-[90vh] flex flex-col"
            >
              <div className="relative h-48 bg-gray-900 shrink-0">
                <img 
                  src={selectedActivity.gambarUrl || 'https://images.unsplash.com/photo-1510312305653-8ed496efae75?auto=format&fit=crop&q=80&w=800'} 
                  alt={selectedActivity.namaKegiatan} 
                  className="w-full h-full object-cover opacity-80"
                />
                <button
                  onClick={() => setIsDetailModalOpen(false)}
                  className="absolute top-4 right-4 p-2 bg-black/40 hover:bg-black/60 text-white rounded-full transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
                <div className="absolute bottom-4 left-4 right-4 text-white space-y-1">
                  <span className="bg-hw-green text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full">
                    {selectedActivity.kategori}
                  </span>
                  <h3 className="text-base font-black font-display leading-tight">{selectedActivity.namaKegiatan}</h3>
                </div>
              </div>

              <div className="p-6 overflow-y-auto space-y-5 flex-1">
                <div className="grid grid-cols-2 gap-3 bg-gray-50 p-4 rounded-2xl border border-gray-100 text-xs">
                  <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Pelaksanaan</span>
                    <span className="font-black text-gray-800 flex items-center gap-1.5 mt-0.5">
                      <Calendar size={14} className="text-hw-green" /> {selectedActivity.tanggal}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Lokasi</span>
                    <span className="font-black text-gray-800 flex items-center gap-1.5 mt-0.5">
                      <MapPin size={14} className="text-amber-600" /> {selectedActivity.lokasi}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Infaq / Biaya</span>
                    <span className="font-black text-purple-700 flex items-center gap-1.5 mt-0.5">
                      <Tag size={14} /> {selectedActivity.biaya}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Penyelenggara</span>
                    <span className="font-black text-blue-800 flex items-center gap-1.5 mt-0.5">
                      <Award size={14} /> {selectedActivity.penyelenggara || 'Kwarwil HW Jateng'}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs font-black uppercase tracking-wider text-gray-400">Deskripsi Kegiatan</h4>
                  <p className="text-xs text-gray-600 leading-relaxed font-medium bg-white p-4 rounded-2xl border border-gray-100">
                    {selectedActivity.deskripsi}
                  </p>
                </div>

                {/* Identity / KTA Auto-issue notice */}
                <div className="p-4 bg-emerald-50/80 border border-emerald-200/60 rounded-2xl flex items-start gap-3">
                  <CreditCard size={20} className="text-emerald-700 shrink-0 mt-0.5" />
                  <div className="text-xs space-y-0.5">
                    <h5 className="font-black text-emerald-900">Termasuk KTA Digital Peserta</h5>
                    <p className="text-[11px] text-emerald-700 font-medium leading-relaxed">
                      Pendaftaran kegiatan otomatis menerbitkan KTA Digital sebagai bukti identitas peserta resmi.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-gray-50 border-t border-gray-100 flex gap-3">
                <button
                  onClick={() => setIsDetailModalOpen(false)}
                  className="px-5 py-3 bg-white border border-gray-200 text-gray-600 rounded-2xl text-xs font-bold hover:bg-gray-100 cursor-pointer"
                >
                  Tutup
                </button>
                <button
                  onClick={() => {
                    setIsDetailModalOpen(false);
                    setIsRegisterModalOpen(true);
                  }}
                  className="flex-1 py-3 bg-hw-green hover:bg-emerald-700 text-white rounded-2xl text-xs font-black uppercase tracking-wider shadow-lg shadow-hw-green/20 flex items-center justify-center gap-2 cursor-pointer"
                >
                  Daftar Kegiatan Sekarang <ChevronRight size={16} />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* REGISTRATION MODAL */}
      <AnimatePresence>
        {isRegisterModalOpen && selectedActivity && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[2.5rem] border border-gray-100 shadow-2xl max-w-lg w-full overflow-hidden max-h-[90vh] flex flex-col"
            >
              <div className="p-5 bg-hw-dark text-white flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400">Formulir Pendaftaran</span>
                  <h3 className="text-sm font-black font-display leading-tight">{selectedActivity.namaKegiatan}</h3>
                </div>
                <button 
                  onClick={() => { setIsRegisterModalOpen(false); setRegSuccess(null); }}
                  className="p-2 text-white/70 hover:text-white rounded-full cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {regSuccess ? (
                /* Registration Success Screen */
                <div className="p-6 text-center space-y-5 overflow-y-auto flex-1">
                  <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                    <CheckCircle2 size={36} />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-lg font-black text-hw-dark font-display">Pendaftaran Berhasil!</h3>
                    <p className="text-xs text-gray-500 font-medium">
                      Anda resmi terdaftar sebagai peserta <strong className="text-gray-800">{regSuccess.activity.namaKegiatan}</strong>.
                    </p>
                  </div>

                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-3xl space-y-3 text-left">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-emerald-600 text-white rounded-xl">
                        <CreditCard size={20} />
                      </div>
                      <div>
                        <span className="text-[10px] font-extrabold uppercase text-emerald-700">KTA Digital Peserta Diterbitkan</span>
                        <h4 className="text-sm font-black text-emerald-950">{regSuccess.participant.namaLengkap}</h4>
                      </div>
                    </div>
                    <div className="text-[11px] font-bold text-emerald-800 space-y-1 pt-2 border-t border-emerald-200/60">
                      <div>No. Reg: <span className="font-mono">{regSuccess.id}</span></div>
                      <div>Asal Daerah: {regSuccess.participant.asalKwarda}</div>
                      <div>Qabilah: {regSuccess.participant.qabilah || '-'}</div>
                    </div>
                  </div>

                  <div className="pt-2 flex gap-3">
                    <button
                      onClick={() => navigate('/kta')}
                      className="flex-1 py-3 bg-hw-green hover:bg-emerald-700 text-white rounded-2xl text-xs font-black uppercase tracking-wider shadow-md shadow-hw-green/20 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <CreditCard size={16} /> Lihat KTA Saya
                    </button>
                    <button
                      onClick={() => { setIsRegisterModalOpen(false); setRegSuccess(null); }}
                      className="px-5 py-3 bg-gray-100 text-gray-700 rounded-2xl text-xs font-bold hover:bg-gray-200 cursor-pointer"
                    >
                      Selesai
                    </button>
                  </div>
                </div>
              ) : (
                /* Registration Form */
                <form onSubmit={handleRegisterSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
                  {/* Auth Status & Pre-fill Banner */}
                  {isAuthenticated && user ? (
                    <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-black text-xs">
                          {user.namaLengkap?.charAt(0) || 'A'}
                        </div>
                        <div className="text-left">
                          <span className="text-[9px] font-extrabold uppercase tracking-wider text-emerald-700 block">Login Sebagai Member</span>
                          <span className="text-xs font-black text-emerald-950">{user.namaLengkap}</span>
                        </div>
                      </div>
                      <span className="text-[10px] font-black text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full flex items-center gap-1">
                        <Check size={12} /> Profil Otomatis
                      </span>
                    </div>
                  ) : (
                    <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between">
                      <div className="text-left">
                        <span className="text-[10px] font-bold text-amber-800 block">Sudah Punya Akun HW?</span>
                        <span className="text-xs font-black text-amber-950">Login untuk isi data otomatis</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowQuickLogin(!showQuickLogin)}
                        className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1 cursor-pointer"
                      >
                        <LogIn size={13} /> {showQuickLogin ? 'Batal' : 'Login'}
                      </button>
                    </div>
                  )}

                  {/* Inline Quick Login */}
                  {showQuickLogin && !isAuthenticated && (
                    <div className="p-4 bg-gray-50 border border-gray-200 rounded-2xl space-y-3">
                      <h4 className="text-xs font-black text-gray-800 uppercase tracking-wider">Login Akun HW</h4>
                      {loginError && <p className="text-[11px] font-bold text-rose-600">{loginError}</p>}
                      <input 
                        type="email" 
                        placeholder="Email" 
                        value={loginEmail}
                        onChange={e => setLoginEmail(e.target.value)}
                        className="w-full bg-white border border-gray-200 rounded-xl p-2.5 text-xs font-bold"
                      />
                      <input 
                        type="password" 
                        placeholder="Password" 
                        value={loginPassword}
                        onChange={e => setLoginPassword(e.target.value)}
                        className="w-full bg-white border border-gray-200 rounded-xl p-2.5 text-xs font-bold"
                      />
                      <button
                        type="button"
                        onClick={handleQuickLogin}
                        disabled={isLoggingIn}
                        className="w-full py-2.5 bg-hw-dark text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2"
                      >
                        {isLoggingIn ? <Loader2 size={14} className="animate-spin" /> : 'Masuk & Isi Otomatis'}
                      </button>
                    </div>
                  )}

                  <div className="space-y-3 pt-1">
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-wider text-gray-500 block mb-1">Nama Lengkap *</label>
                      <input 
                        type="text" 
                        required
                        value={formData.namaLengkap}
                        onChange={e => setFormData({ ...formData, namaLengkap: e.target.value })}
                        placeholder="Nama lengkap sesuai KTP/Identitas"
                        className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-3 text-xs font-bold outline-none focus:ring-2 focus:ring-hw-green/20"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-black uppercase tracking-wider text-gray-500 block mb-1">NIK / No KTP</label>
                        <input 
                          type="text" 
                          value={formData.nik}
                          onChange={e => setFormData({ ...formData, nik: e.target.value })}
                          placeholder="NIK (opsional)"
                          className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-3 text-xs font-bold outline-none focus:ring-2 focus:ring-hw-green/20"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-black uppercase tracking-wider text-gray-500 block mb-1">Jenis Kelamin</label>
                        <select
                          value={formData.jenisKelamin}
                          onChange={e => setFormData({ ...formData, jenisKelamin: e.target.value })}
                          className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-3 text-xs font-bold outline-none"
                        >
                          <option value="L">Laki-laki</option>
                          <option value="P">Perempuan</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-black uppercase tracking-wider text-gray-500 block mb-1">No. WhatsApp / HP *</label>
                        <input 
                          type="tel" 
                          required
                          value={formData.noHp}
                          onChange={e => setFormData({ ...formData, noHp: e.target.value })}
                          placeholder="08xxxxxxxxxx"
                          className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-3 text-xs font-bold outline-none focus:ring-2 focus:ring-hw-green/20"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-black uppercase tracking-wider text-gray-500 block mb-1">Email</label>
                        <input 
                          type="email" 
                          value={formData.email}
                          onChange={e => setFormData({ ...formData, email: e.target.value })}
                          placeholder="email@domain.com"
                          className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-3 text-xs font-bold outline-none focus:ring-2 focus:ring-hw-green/20"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-black uppercase tracking-wider text-gray-500 block mb-1">Asal Kwarda / Daerah</label>
                        <input 
                          type="text" 
                          value={formData.asalKwarda}
                          onChange={e => setFormData({ ...formData, asalKwarda: e.target.value })}
                          placeholder="Banyumas, Semarang, dll"
                          className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-3 text-xs font-bold outline-none focus:ring-2 focus:ring-hw-green/20"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-black uppercase tracking-wider text-gray-500 block mb-1">Qabilah / Sekolah</label>
                        <input 
                          type="text" 
                          value={formData.qabilah}
                          onChange={e => setFormData({ ...formData, qabilah: e.target.value })}
                          placeholder="Qabilah SMA HW..."
                          className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-3 text-xs font-bold outline-none focus:ring-2 focus:ring-hw-green/20"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-3.5 bg-hw-green hover:bg-emerald-700 text-white rounded-2xl text-xs font-black uppercase tracking-wider shadow-lg shadow-hw-green/20 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 size={16} className="animate-spin" /> Memproses...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 size={16} /> Kirim Pendaftaran & Terbitkan KTA
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

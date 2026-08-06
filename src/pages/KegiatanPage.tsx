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
  CreditCard, 
  ShieldCheck, 
  Clock, 
  Loader2, 
  Check, 
  X,
  Share2,
  Award,
  Send,
  UserCheck
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { sheetsService } from '../services/sheetsService';
import { KWARDA_QABILAH_JATENG } from './KTAPage';

export default function KegiatanPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [activities, setActivities] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Semua');

  const [selectedActivity, setSelectedActivity] = useState<any | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);

  // Kwarda list (Kabupaten/Kota se-Jateng) and Qabilah PTMA list
  const kwardaOptions = KWARDA_QABILAH_JATENG.slice(0, 35).map(item => item.name);
  const qabilahPtmaOptions = KWARDA_QABILAH_JATENG.slice(35).map(item => item.name);

  // Registration Form State
  const [formData, setFormData] = useState({
    namaLengkap: '',
    unsur: 'Kwarwil HW Jateng',
    utusan: 'Kabupaten Banyumas',
    qabilahPtma: 'Universitas Muhammadiyah Surakarta (UMS)',
    jabatan: 'Anggota',
    kategoriUndangan: 'Tidak Ada / Umum',
    noHp: ''
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
    if (user) {
      setFormData(prev => ({
        ...prev,
        namaLengkap: user.namaLengkap || prev.namaLengkap,
        noHp: user.noHp || prev.noHp,
        utusan: user.asalKwarda || prev.utusan,
        qabilahPtma: user.qabilah || prev.qabilahPtma
      }));
    }
  }, [user]);

  const categories = ['Semua', 'Rapat HW', 'Silaturahmi', 'Pelatihan', 'Perkemahan'];

  const filteredActivities = activities.filter(act => {
    const matchesSearch = (act.namaKegiatan || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (act.lokasi || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'Semua' || act.kategori === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedActivity) return;
    if (!formData.namaLengkap || !formData.noHp) {
      alert('Mohon isi Nama Lengkap dan Nomor WhatsApp');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        activityId: selectedActivity.id,
        namaKegiatan: selectedActivity.namaKegiatan,
        userId: user?.id || `user-act-${Date.now()}`,
        namaLengkap: formData.namaLengkap,
        unsur: formData.unsur,
        utusan: formData.unsur === 'Kwarda HW' ? formData.utusan : '',
        qabilahPtma: formData.unsur === 'Qabilah PTMA' ? formData.qabilahPtma : '',
        jabatan: formData.jabatan,
        kategoriUndangan: formData.kategoriUndangan,
        noHp: formData.noHp,
        asalKwarda: formData.unsur === 'Kwarda HW' ? formData.utusan : formData.unsur,
        qabilah: formData.unsur === 'Qabilah PTMA' ? formData.qabilahPtma : formData.unsur,
        status: 'approved',
        tanggalDaftar: new Date().toISOString()
      };

      const result = await sheetsService.registerActivity(payload);
      setRegSuccess({
        id: result.id || `actreg-${Date.now()}`,
        activity: selectedActivity,
        participant: payload
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
            Ikuti berbagai kegiatan resmi HW Jateng seperti Rapat HW, Silaturahmi, Pelatihan, dan Perkemahan. Dapatkan KTA Digital resmi sebagai identitas peserta!
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
              className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-all flex flex-col md:flex-row"
            >
              <div className="w-full md:w-2/5 h-48 md:h-auto relative bg-gray-100 shrink-0 overflow-hidden">
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

              <div className="p-5 flex-1 flex flex-col justify-between space-y-3.5">
                <div className="space-y-2">
                  <h3 className="text-sm md:text-base font-black text-hw-dark font-display leading-snug">
                    {activity.namaKegiatan}
                  </h3>
                  <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                    {activity.deskripsi}
                  </p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-bold text-gray-600 pt-1">
                    <div className="flex items-start gap-1.5 text-emerald-700">
                      <Calendar size={14} className="shrink-0 mt-0.5" />
                      <span className="leading-snug break-words">{activity.tanggal}</span>
                    </div>
                    <div className="flex items-start gap-1.5 text-hw-dark">
                      <MapPin size={14} className="shrink-0 text-amber-600 mt-0.5" />
                      <span className="leading-snug break-words font-extrabold">{activity.lokasi}</span>
                    </div>
                    <div className="flex items-start gap-1.5 text-purple-700">
                      <Tag size={14} className="shrink-0 mt-0.5" />
                      <span className="leading-snug">Infaq: {activity.biaya || 'Gratis'}</span>
                    </div>
                    <div className="flex items-start gap-1.5 text-blue-700">
                      <Users size={14} className="shrink-0 mt-0.5" />
                      <span className="leading-snug">{activity.kuota || 'Terbuka'}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                  <button
                    onClick={() => {
                      setSelectedActivity(activity);
                      setIsDetailModalOpen(true);
                    }}
                    className="flex-1 py-2.5 bg-hw-green hover:bg-emerald-700 text-white rounded-2xl text-xs font-black uppercase tracking-wider transition-all shadow-md shadow-hw-green/15 flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-gray-50 p-4 rounded-2xl border border-gray-100 text-xs">
                  <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Pelaksanaan</span>
                    <span className="font-black text-gray-800 flex items-start gap-1.5 mt-1 leading-snug break-words">
                      <Calendar size={14} className="text-hw-green shrink-0 mt-0.5" />
                      <span>{selectedActivity.tanggal}</span>
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Lokasi & Tempat</span>
                    <span className="font-black text-gray-900 flex items-start gap-1.5 mt-1 leading-snug break-words">
                      <MapPin size={14} className="text-amber-600 shrink-0 mt-0.5" />
                      <span>{selectedActivity.lokasi}</span>
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Infaq / Biaya</span>
                    <span className="font-black text-purple-700 flex items-start gap-1.5 mt-1 leading-snug break-words">
                      <Tag size={14} className="shrink-0 mt-0.5" />
                      <span>{selectedActivity.biaya}</span>
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Penyelenggara</span>
                    <span className="font-black text-blue-800 flex items-start gap-1.5 mt-1 leading-snug break-words">
                      <Award size={14} className="shrink-0 mt-0.5" />
                      <span>{selectedActivity.penyelenggara || 'Kwarwil HW Jateng'}</span>
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs font-black uppercase tracking-wider text-gray-400">Deskripsi Kegiatan</h4>
                  <p className="text-xs text-gray-600 leading-relaxed font-medium bg-white p-4 rounded-2xl border border-gray-100">
                    {selectedActivity.deskripsi}
                  </p>
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
                      Data pendaftaran Anda untuk kegiatan <strong className="text-gray-800">{regSuccess.activity.namaKegiatan}</strong> telah berhasil dikirim ke panitia.
                    </p>
                  </div>

                  {/* Summary Data Isian */}
                  <div className="p-4 bg-gray-50 border border-gray-200 rounded-2xl text-left space-y-1.5 text-xs text-gray-700">
                    <div className="flex justify-between border-b border-gray-200/80 pb-1">
                      <span className="text-gray-500 font-medium">Nama:</span>
                      <span className="font-black text-gray-900">{regSuccess.participant.namaLengkap}</span>
                    </div>
                    <div className="flex justify-between border-b border-gray-200/80 pb-1">
                      <span className="text-gray-500 font-medium">Unsur:</span>
                      <span className="font-bold text-gray-800">{regSuccess.participant.unsur}</span>
                    </div>
                    {regSuccess.participant.unsur === 'Kwarda HW' && (
                      <div className="flex justify-between border-b border-gray-200/80 pb-1">
                        <span className="text-gray-500 font-medium">Utusan Kwarda:</span>
                        <span className="font-bold text-emerald-700">{regSuccess.participant.utusan}</span>
                      </div>
                    )}
                    {regSuccess.participant.unsur === 'Qabilah PTMA' && (
                      <div className="flex justify-between border-b border-gray-200/80 pb-1">
                        <span className="text-gray-500 font-medium">Qabilah PTMA:</span>
                        <span className="font-bold text-emerald-700">{regSuccess.participant.qabilahPtma}</span>
                      </div>
                    )}
                    <div className="flex justify-between border-b border-gray-200/80 pb-1">
                      <span className="text-gray-500 font-medium">Jabatan:</span>
                      <span className="font-bold text-gray-800">{regSuccess.participant.jabatan}</span>
                    </div>
                    <div className="flex justify-between border-b border-gray-200/80 pb-1">
                      <span className="text-gray-500 font-medium">Kategori Undangan:</span>
                      <span className="font-bold text-gray-800">{regSuccess.participant.kategoriUndangan}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 font-medium">No. WhatsApp:</span>
                      <span className="font-mono font-bold text-gray-900">{regSuccess.participant.noHp}</span>
                    </div>
                  </div>

                  {/* Rekening Kwarwil HW Jateng Payment Banner */}
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-3xl text-left space-y-2.5">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 bg-emerald-600 text-white rounded-xl">
                        <CreditCard size={18} />
                      </div>
                      <div>
                        <span className="text-[10px] font-black uppercase text-emerald-800 tracking-wider">Rekening Pembayaran / Infaq</span>
                        <h4 className="text-xs font-black text-emerald-950">Kwarwil HW Jawa Tengah</h4>
                      </div>
                    </div>
                    <div className="bg-white p-3 rounded-2xl border border-emerald-100 space-y-1 shadow-xs">
                      <p className="text-[9px] uppercase tracking-wider text-gray-400 font-bold">Transfer Infaq Kegiatan ({regSuccess.activity.biaya || 'Sesuai ketentuan'})</p>
                      <p className="text-xs font-bold text-emerald-800">BSI (Bank Syariah Indonesia)</p>
                      <p className="text-sm font-black text-gray-900 tracking-wider font-mono">7307427448</p>
                      <p className="text-[10px] text-gray-600 font-semibold uppercase">a.n. Kwarwil HW Jateng</p>
                    </div>
                    <p className="text-[10px] text-emerald-800 leading-normal font-medium">
                      Silakan lakukan pembayaran / infaq kegiatan jika berlaku, kemudian kirimkan konfirmasi bukti transfer via WhatsApp ke Medkom HW Jateng.
                    </p>
                    <a 
                      href={`https://wa.me/6289688754000?text=${encodeURIComponent(
                        `Assalamu'alaikum Medkom HW Jateng, saya baru saja mendaftar kegiatan *${regSuccess.activity.namaKegiatan}*.\n\nNama: ${regSuccess.participant.namaLengkap}\nUnsur: ${regSuccess.participant.unsur}\nNo. WA: ${regSuccess.participant.noHp}\n\nMohon konfirmasi pendaftaran kegiatan saya. Terima kasih.`
                      )}`}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-center text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-all"
                    >
                      <Send size={14} /> Konfirmasi Pendaftaran via WhatsApp
                    </a>
                  </div>

                  {/* Question & Link KTA Registration */}
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-3xl text-left space-y-2">
                    <div className="flex items-center gap-2">
                      <UserCheck size={18} className="text-amber-700" />
                      <h4 className="text-xs font-black text-amber-900">Sudah punya akun / KTA HW Jateng?</h4>
                    </div>
                    <p className="text-[11px] text-amber-800 font-medium leading-relaxed">
                      Belum punya akun atau KTA digital HW Jateng? Dapatkan KTA resmi digital untuk kemudahan akses fitur dan histori kegiatan HW.
                    </p>
                    <button
                      onClick={() => {
                        setIsRegisterModalOpen(false);
                        setRegSuccess(null);
                        navigate('/register');
                      }}
                      className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer"
                    >
                      <Sparkles size={14} /> Daftar Akun & KTA HW Jateng di Sini
                    </button>
                  </div>

                  <div className="pt-2">
                    <button
                      onClick={() => { setIsRegisterModalOpen(false); setRegSuccess(null); }}
                      className="w-full py-3 bg-gray-100 text-gray-700 rounded-2xl text-xs font-bold hover:bg-gray-200 cursor-pointer"
                    >
                      Selesai
                    </button>
                  </div>
                </div>
              ) : (
                /* Registration Form */
                <form onSubmit={handleRegisterSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl">
                    <span className="text-[10px] font-bold text-emerald-800 block">Pendaftaran Langsung Peserta</span>
                    <span className="text-xs font-black text-emerald-950">Isi formulir di bawah ini untuk mendaftar kegiatan (Tanpa Perlu Login)</span>
                  </div>

                  <div className="space-y-3 pt-1">
                    {/* Nama Lengkap */}
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-wider text-gray-500 block mb-1">Nama Lengkap *</label>
                      <input 
                        type="text" 
                        required
                        value={formData.namaLengkap}
                        onChange={e => setFormData({ ...formData, namaLengkap: e.target.value })}
                        placeholder="Nama lengkap sesuai identitas"
                        className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-3 text-xs font-bold outline-none focus:ring-2 focus:ring-hw-green/20"
                      />
                    </div>

                    {/* Unsur */}
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-wider text-gray-500 block mb-1">Unsur *</label>
                      <select
                        value={formData.unsur}
                        onChange={e => setFormData({ ...formData, unsur: e.target.value })}
                        className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-3 text-xs font-bold outline-none focus:ring-2 focus:ring-hw-green/20 cursor-pointer"
                      >
                        <option value="Kwarwil HW Jateng">Kwarwil HW Jateng</option>
                        <option value="DSW HW Jateng">DSW HW Jateng</option>
                        <option value="Kwarda HW">Kwarda HW</option>
                        <option value="Qabilah PTMA">Qabilah PTMA</option>
                        <option value="Luar Jawa Tengah">Luar Jawa Tengah</option>
                      </select>
                    </div>

                    {/* Conditional: Utusan (If Unsur === Kwarda HW) */}
                    {formData.unsur === 'Kwarda HW' && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                      >
                        <label className="text-[10px] font-black uppercase tracking-wider text-emerald-700 block mb-1">Utusan Kwarda HW (Se-Jawa Tengah) *</label>
                        <select
                          value={formData.utusan}
                          onChange={e => setFormData({ ...formData, utusan: e.target.value })}
                          className="w-full bg-emerald-50/60 border border-emerald-200 rounded-2xl p-3 text-xs font-bold text-emerald-900 outline-none focus:ring-2 focus:ring-hw-green/20 cursor-pointer"
                        >
                          {kwardaOptions.map((k, idx) => (
                            <option key={idx} value={k}>{k}</option>
                          ))}
                        </select>
                      </motion.div>
                    )}

                    {/* Conditional: Qabilah PTMA (If Unsur === Qabilah PTMA) */}
                    {formData.unsur === 'Qabilah PTMA' && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                      >
                        <label className="text-[10px] font-black uppercase tracking-wider text-emerald-700 block mb-1">Daftar Qabilah PTMA (Se-Jawa Tengah) *</label>
                        <select
                          value={formData.qabilahPtma}
                          onChange={e => setFormData({ ...formData, qabilahPtma: e.target.value })}
                          className="w-full bg-emerald-50/60 border border-emerald-200 rounded-2xl p-3 text-xs font-bold text-emerald-900 outline-none focus:ring-2 focus:ring-hw-green/20 cursor-pointer"
                        >
                          {qabilahPtmaOptions.map((q, idx) => (
                            <option key={idx} value={q}>{q}</option>
                          ))}
                        </select>
                      </motion.div>
                    )}

                    {/* Jabatan & Kategori Undangan */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-black uppercase tracking-wider text-gray-500 block mb-1">Jabatan *</label>
                        <select
                          value={formData.jabatan}
                          onChange={e => setFormData({ ...formData, jabatan: e.target.value })}
                          className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-3 text-xs font-bold outline-none cursor-pointer"
                        >
                          <option value="Ketua">Ketua</option>
                          <option value="Wakil Ketua">Wakil Ketua</option>
                          <option value="Sekretaris">Sekretaris</option>
                          <option value="Wakil Sekretaris">Wakil Sekretaris</option>
                          <option value="Bendahara">Bendahara</option>
                          <option value="Wakil Bendahara">Wakil Bendahara</option>
                          <option value="Anggota">Anggota</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] font-black uppercase tracking-wider text-gray-500 block mb-1">Kategori Undangan *</label>
                        <select
                          value={formData.kategoriUndangan}
                          onChange={e => setFormData({ ...formData, kategoriUndangan: e.target.value })}
                          className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-3 text-xs font-bold outline-none cursor-pointer"
                        >
                          <option value="Tidak Ada / Umum">Tidak Ada / Umum</option>
                          <option value="Pelatih Nasional HW Jateng">Pelatih Nasional HW Jateng</option>
                          <option value="Pandu Senior">Pandu Senior</option>
                          <option value="Alumni Jati 2 HW Jateng di Klaten">Alumni Jati 2 HW Jateng di Klaten</option>
                        </select>
                      </div>
                    </div>

                    {/* Nomor Whatsapp */}
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-wider text-gray-500 block mb-1">Nomor Whatsapp *</label>
                      <input 
                        type="tel" 
                        required
                        value={formData.noHp}
                        onChange={e => setFormData({ ...formData, noHp: e.target.value })}
                        placeholder="Contoh: 081234567890"
                        className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-3 text-xs font-bold outline-none focus:ring-2 focus:ring-hw-green/20"
                      />
                    </div>
                  </div>

                  <div className="pt-3">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-3.5 bg-hw-green hover:bg-emerald-700 text-white rounded-2xl text-xs font-black uppercase tracking-wider shadow-lg shadow-hw-green/20 flex items-center justify-center gap-2 cursor-pointer transition-all hover:scale-[1.01]"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 size={16} className="animate-spin" /> Memproses Pendaftaran...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 size={16} /> Daftar Kegiatan
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

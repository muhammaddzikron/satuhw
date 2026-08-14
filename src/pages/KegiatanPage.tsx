import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { isParticipantOfActivity, isOnlyTrainingActivity, sortActivityAppsByDate } from '../utils/activityUtils';
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
  UserCheck,
  UserPlus,
  Plus,
  Edit3,
  Trash2,
  Music,
  Download,
  Volume2,
  Upload,
  FileText,
  MessageCircle,
  Copy,
  ExternalLink
} from 'lucide-react';
import { formatAudioUrl, handleAudioFileUpload } from '../utils/audioUtils';
import { formatDocumentUrl, handleDocumentFileUpload, handleDownloadDocument } from '../utils/documentUtils';
import { getCorsSafeUrl } from '../lib/utils';
import { ThemeSongPlayer } from '../components/ThemeSongPlayer';
import { useAuthStore } from '../store/useAuthStore';
import { sheetsService } from '../services/sheetsService';
import { KWARDA_QABILAH_JATENG } from './KTAPage';
import { CopyAccountButton } from '../components/CopyAccountButton';

export default function KegiatanPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const isAdmin = Boolean(user) || user?.role === 'admin' || user?.role === 'superadmin' || user?.activeRole === 'admin' || user?.activeRole === 'superadmin' || user?.roles?.includes('admin') || user?.roles?.includes('superadmin') || user?.email === 'muhammaddzikron@gmail.com' || user?.email === 'medkom@hwjateng.com' || user?.email === 'admin@hw.org';

  const [activities, setActivities] = useState<any[]>([]);
  const [activityApps, setActivityApps] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Semua');

  const [selectedActivity, setSelectedActivity] = useState<any | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);

  const [isParticipantsModalOpen, setIsParticipantsModalOpen] = useState(false);
  const [selectedActivityForParticipants, setSelectedActivityForParticipants] = useState<any | null>(null);

  // Add & Edit Activity Modal State
  const [isAddActivityModalOpen, setIsAddActivityModalOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<any | null>(null);
  const [newActivityForm, setNewActivityForm] = useState({
    namaKegiatan: '',
    kategori: 'Rapat HW',
    tanggal: '',
    lokasi: '',
    biaya: 'Gratis',
    kuota: 'Terbuka',
    penyelenggara: 'Kwartir Wilayah HW Jawa Tengah',
    gambarUrl: '',
    deskripsi: '',
    status: 'Buka',
    themeSongUrl: '',
    themeSongTitle: '',
    proposalUrl: '',
    rekeningPembayaran: 'Bank Syariah Indonesia (BSI) 7307427448 a.n. Kwarwil HW Jateng',
    konfirmasiPembayaran: '089688754000'
  });
  const [isSavingActivity, setIsSavingActivity] = useState(false);

  const handleDownloadThemeSong = async (url: string, fileName?: string) => {
    if (!url) return;
    try {
      const name = fileName || 'Themesong_Kegiatan.mp3';
      const cleanName = name.toLowerCase().endsWith('.mp3') ? name : `${name}.mp3`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Fetch failed');
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = cleanName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch (e) {
      const a = document.createElement('a');
      a.href = url;
      a.target = '_blank';
      a.download = fileName || 'Themesong_Kegiatan.mp3';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };
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

  const [activityCategoriesList, setActivityCategoriesList] = useState<string[]>(['Rapat HW', 'Silaturahmi', 'Perkemahan', 'Musyawarah']);

  useEffect(() => {
    setIsLoading(true);

    // Initial immediate fetch to show saved data right away without waiting
    sheetsService.getActivities().then(acts => {
      if (acts && Array.isArray(acts) && acts.length > 0) {
        setActivities(acts);
        setIsLoading(false);
      }
    }).catch(err => {
      console.warn('Initial activities load warning:', err);
    });

    sheetsService.getActivityApplications().then(apps => {
      if (apps && Array.isArray(apps) && apps.length > 0) {
        setActivityApps(apps);
      }
    }).catch(err => {
      console.warn('Initial activity applications load warning:', err);
    });

    const unsubCategories = sheetsService.subscribeToActivityCategories((cats: string[]) => {
      if (cats && Array.isArray(cats)) setActivityCategoriesList(cats);
    });

    const unsubActivities = sheetsService.subscribeToActivities((acts: any[]) => {
      if (acts && Array.isArray(acts)) {
        setActivities(acts);
      }
      setIsLoading(false);
    });

    const unsubApps = sheetsService.subscribeToActivityApplications((apps: any[]) => {
      if (apps && Array.isArray(apps)) setActivityApps(apps);
    });

    // Safety timeout ensuring spinner clears quickly
    const safetyTimer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => {
      clearTimeout(safetyTimer);
      unsubCategories();
      unsubActivities();
      unsubApps();
    };
  }, []);

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

  useEffect(() => {
    if (selectedActivity && activities.length > 0) {
      const updated = activities.find(a => a.id === selectedActivity.id);
      if (updated) {
        setSelectedActivity(updated);
      }
    }
  }, [activities]);

  const categories = useMemo(() => [
    'Semua', 
    'Kegiatan Saya', 
    ...activityCategoriesList.filter(c => c !== 'Semua' && c !== 'Kegiatan Saya' && c.toLowerCase() !== 'pelatihan' && c.toLowerCase() !== 'kegiatan pelatihan')
  ], [activityCategoriesList]);

  const participantCountMap = useMemo(() => {
    const map: Record<string, number> = {};
    if (!activities?.length || !activityApps?.length) return map;
    for (const act of activities) {
      if (act?.id) {
        map[act.id] = activityApps.filter(a => isParticipantOfActivity(a, act)).length;
      }
    }
    return map;
  }, [activities, activityApps]);

  const activeParticipantsList = useMemo(() => {
    if (!selectedActivityForParticipants || !activityApps?.length) return [];
    const filtered = activityApps.filter(app => isParticipantOfActivity(app, selectedActivityForParticipants));
    return sortActivityAppsByDate(filtered, true);
  }, [selectedActivityForParticipants, activityApps]);

  const filteredActivities = useMemo(() => {
    const q = (searchQuery || '').trim().toLowerCase();
    return activities.filter(act => {
      // Exclude training activities from Kegiatan Page
      if (isOnlyTrainingActivity(act)) return false;

      const matchesSearch = !q ||
                            (act.namaKegiatan || '').toLowerCase().includes(q) ||
                            (act.lokasi || '').toLowerCase().includes(q);
      if (!matchesSearch) return false;

      if (selectedCategory === 'Kegiatan Saya') {
        const isMine = act.createdBy === user?.email || 
                       act.creatorName === user?.namaLengkap || 
                       act.createdBy === 'muhammaddzikron@gmail.com' ||
                       !act.createdBy; // Include default activities as created by user
        return isMine;
      }
      return selectedCategory === 'Semua' || act.kategori === selectedCategory;
    });
  }, [activities, searchQuery, selectedCategory, user]);

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedActivity) return;
    if (!formData.namaLengkap || !formData.noHp) {
      alert('Mohon isi Nama Lengkap dan Nomor WhatsApp');
      return;
    }

    setIsSubmitting(true);
    try {
      const normP = (p: any) => {
        let str = String(p || '').replace(/\D/g, '');
        if (str.startsWith('0')) str = str.substring(1);
        else if (str.startsWith('62')) str = str.substring(2);
        return str;
      };
      const normN = (n: any) => String(n || '').toLowerCase().replace(/,?\s*(s\.pd|m\.pd|s\.h\.i\.|s\.ag|m\.ag|s\.kom|m\.kom|s\.e\.|m\.m\.|s\.st|dr\.|dra\.|drs\.|h\.|hj\.|ir\.|prof\.|ph\.d|lcm|s\.ip|m\.ip|s\.sos|m\.sos|s\.p|m\.p)\.?/gi, ' ').replace(/[^a-z0-9\s]/gi, ' ').trim();

      const reqPhone = normP(formData.noHp);
      const reqName = normN(formData.namaLengkap);

      const existingReg = activityApps.find((a: any) => {
        const aPhone = normP(a.noHp || a.noWa);
        const aName = normN(a.namaLengkap || a.nama);
        const sameAct = a.activityId === selectedActivity.id;

        const samePhoneAndName = reqPhone && aPhone && reqPhone === aPhone && reqPhone.length >= 7 && (reqName === aName || (reqName && aName && (reqName.includes(aName) || aName.includes(reqName))));
        const samePhoneAndAct = reqPhone && aPhone && reqPhone === aPhone && reqPhone.length >= 7 && sameAct;
        const sameNameAndAct = reqName && aName && reqName === aName && reqName.length >= 3 && sameAct;

        return samePhoneAndName || samePhoneAndAct || sameNameAndAct;
      });

      const payload = {
        id: existingReg?.id || `actreg-${Date.now()}`,
        activityId: selectedActivity.id,
        namaKegiatan: selectedActivity.namaKegiatan,
        userId: user?.id || `user-act-${Date.now()}`,
        namaLengkap: formData.namaLengkap,
        email: user?.email || '',
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
        id: result?.id || `actreg-${Date.now()}`,
        activity: selectedActivity,
        participant: payload
      });
      const updatedApps = await sheetsService.getActivityApplications();
      if (updatedApps) setActivityApps(updatedApps);
    } catch (e: any) {
      alert('Gagal mendaftar kegiatan: ' + (e.message || 'Terjadi kesalahan'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveNewActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      alert('Hanya Admin yang memiliki hak akses untuk menambah atau mengedit kegiatan.');
      return;
    }
    if (!newActivityForm.namaKegiatan.trim()) {
      alert('Nama Kegiatan wajib diisi.');
      return;
    }
    if (!newActivityForm.tanggal.trim()) {
      alert('Tanggal pelaksanaan wajib diisi.');
      return;
    }
    if (!newActivityForm.lokasi.trim()) {
      alert('Lokasi / Tempat kegiatan wajib diisi.');
      return;
    }

    setIsSavingActivity(true);
    try {
      const actId = editingActivity ? editingActivity.id : `keg-${Date.now()}`;
      const imgClean = newActivityForm.gambarUrl.trim();
      const payload = {
        ...(editingActivity || {}),
        ...newActivityForm,
        id: actId,
        namaKegiatan: newActivityForm.namaKegiatan,
        title: newActivityForm.namaKegiatan,
        tanggal: newActivityForm.tanggal,
        tanggalPelatihan: newActivityForm.tanggal,
        startDate: newActivityForm.tanggal,
        lokasi: newActivityForm.lokasi,
        lokasiPelatihan: newActivityForm.lokasi,
        location: newActivityForm.lokasi,
        biaya: newActivityForm.biaya,
        biayaPelatihan: newActivityForm.biaya,
        gambarUrl: imgClean,
        imageUrl: imgClean,
        gambar: imgClean,
        posterUrl: imgClean,
        coverImage: imgClean,
        proposal: newActivityForm.proposalUrl,
        proposalUrl: newActivityForm.proposalUrl,
        linkProposal: newActivityForm.proposalUrl,
        rekeningPembayaran: newActivityForm.rekeningPembayaran,
        rekeningPembiayaan: newActivityForm.rekeningPembayaran,
        konfirmasiPembayaran: newActivityForm.konfirmasiPembayaran,
        noWhatsappPanitia: newActivityForm.konfirmasiPembayaran,
        isPelatihan: false,
        createdBy: editingActivity?.createdBy || user?.email || 'muhammaddzikron@gmail.com',
        creatorName: editingActivity?.creatorName || user?.namaLengkap || 'Panitia HW Jateng',
        createdAt: editingActivity?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const saved = await sheetsService.saveActivity(payload);
      const freshActs = await sheetsService.getActivities();
      if (freshActs && freshActs.length > 0) {
        setActivities(freshActs);
      }
      if (selectedActivity && selectedActivity.id === actId) {
        setSelectedActivity(saved || payload);
      }
      alert(editingActivity ? 'Kegiatan berhasil diperbarui dan tersimpan ke Cloud Firestore!' : 'Kegiatan baru berhasil ditambahkan dan tersimpan ke Cloud Firestore!');
      setIsAddActivityModalOpen(false);
      setEditingActivity(null);
      setNewActivityForm({
        namaKegiatan: '',
        kategori: 'Rapat HW',
        tanggal: '',
        lokasi: '',
        biaya: 'Gratis',
        kuota: 'Terbuka',
        penyelenggara: 'Kwartir Wilayah HW Jawa Tengah',
        gambarUrl: '',
        deskripsi: '',
        status: 'Buka',
        themeSongUrl: '',
        themeSongTitle: '',
        proposalUrl: '',
        rekeningPembayaran: 'Bank Syariah Indonesia (BSI) 7307427448 a.n. Kwarwil HW Jateng',
        konfirmasiPembayaran: '089688754000'
      });
    } catch (err: any) {
      alert('Gagal menyimpan kegiatan: ' + (err.message || 'Error koneksi'));
    } finally {
      setIsSavingActivity(false);
    }
  };

  const handleEditActivity = (act: any) => {
    if (!isAdmin) {
      alert('Hanya Admin yang memiliki hak akses untuk mengedit kegiatan.');
      return;
    }
    setEditingActivity(act);
    setNewActivityForm({
      namaKegiatan: act.namaKegiatan || act.title || act.jenisPelatihan || '',
      kategori: act.kategori || act.category || 'Rapat HW',
      tanggal: act.tanggal || act.tanggalPelatihan || act.startDate || '',
      lokasi: act.lokasi || act.lokasiPelatihan || act.location || '',
      biaya: act.biaya || act.biayaPelatihan || 'Gratis',
      kuota: act.kuota || 'Terbuka',
      penyelenggara: act.penyelenggara || 'Kwartir Wilayah HW Jawa Tengah',
      gambarUrl: act.gambarUrl || act.imageUrl || act.gambar || act.posterUrl || act.coverImage || '',
      deskripsi: act.deskripsi || act.description || '',
      status: act.status || 'Buka',
      themeSongUrl: act.themeSongUrl || act.themeSong || '',
      themeSongTitle: act.themeSongTitle || act.themeSongName || '',
      proposalUrl: act.proposalUrl || act.proposal || act.linkProposal || '',
      rekeningPembayaran: act.rekeningPembayaran || act.rekeningPembiayaan || 'Bank Syariah Indonesia (BSI) 7307427448 a.n. Kwarwil HW Jateng',
      konfirmasiPembayaran: act.konfirmasiPembayaran || act.noWhatsappPanitia || act.kontakKonfirmasi || '089688754000'
    });
    setIsAddActivityModalOpen(true);
  };

  const handleDeleteActivity = async (actId: string, actTitle: string) => {
    if (!isAdmin) {
      alert('Hanya Admin yang memiliki hak akses untuk menghapus kegiatan.');
      return;
    }
    if (!confirm(`Apakah Anda yakin ingin menghapus kegiatan "${actTitle}"?`)) return;
    try {
      await sheetsService.deleteActivity(actId);
      alert('Kegiatan berhasil dihapus.');
    } catch (err: any) {
      alert('Gagal menghapus kegiatan: ' + err.message);
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

      {/* Action Bar: Quick Add Activity Button */}
      <div className="flex items-center justify-between bg-white p-3.5 rounded-2xl border border-gray-150 shadow-xs">
        <div className="flex items-center gap-2">
          <Calendar className="text-hw-green" size={18} />
          <span className="text-xs font-black text-gray-800 font-display">Agenda Terdaftar ({filteredActivities.length})</span>
        </div>
        {isAdmin && (
          <button
            onClick={() => {
              setEditingActivity(null);
              setNewActivityForm({
                namaKegiatan: '',
                kategori: activityCategoriesList.filter(c => c.toLowerCase() !== 'pelatihan')[0] || 'Rapat HW',
                tanggal: '',
                lokasi: '',
                biaya: 'Gratis',
                kuota: 'Terbuka',
                penyelenggara: 'Kwartir Wilayah HW Jawa Tengah',
                gambarUrl: '',
                deskripsi: '',
                status: 'Buka',
                themeSongUrl: '',
                themeSongTitle: '',
                proposalUrl: '',
                rekeningPembayaran: 'Bank Syariah Indonesia (BSI) 7307427448 a.n. Kwarwil HW Jateng',
                konfirmasiPembayaran: '089688754000'
              });
              setIsAddActivityModalOpen(true);
            }}
            className="px-4 py-2 bg-hw-green hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md shadow-hw-green/20 flex items-center gap-1.5 cursor-pointer active:scale-95"
          >
            <Plus size={16} /> Tambah Kegiatan Baru
          </button>
        )}
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
            className="w-full pl-11 pr-10 py-3 bg-white border border-gray-150 rounded-2xl text-xs font-bold focus:ring-2 focus:ring-hw-green/20 outline-none shadow-xs"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-hw-green transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>
          )}
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
              className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-all flex flex-col"
            >
              <div className="w-full h-48 sm:h-56 relative bg-gray-100 shrink-0 overflow-hidden">
                <img 
                  src={getCorsSafeUrl(activity.gambarUrl, activity.updatedAt || activity.id) || 'https://images.unsplash.com/photo-1510312305653-8ed496efae75?auto=format&fit=crop&q=80&w=800'} 
                  alt={activity.namaKegiatan} 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1510312305653-8ed496efae75?auto=format&fit=crop&q=80&w=800';
                  }}
                />
                <div className="absolute top-3 left-3 flex items-center gap-1.5 flex-wrap">
                  <div className="bg-hw-dark/80 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full">
                    {activity.kategori || 'Kegiatan'}
                  </div>
                  {(activity.createdBy === user?.email || activity.createdBy === 'muhammaddzikron@gmail.com' || !activity.createdBy) && (
                    <div className="bg-amber-500/90 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full flex items-center gap-1 shadow-xs">
                      <UserCheck size={12} /> Dibuat oleh Anda
                    </div>
                  )}
                  {activity.themeSongUrl && (
                    <div className="bg-emerald-600/95 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full flex items-center gap-1 shadow-xs border border-emerald-400/30">
                      <Music size={12} className="animate-pulse" /> Themesong MP3
                    </div>
                  )}
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

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-2 border-t border-gray-100">
                  <button
                    onClick={() => {
                      setSelectedActivity(activity);
                      setIsDetailModalOpen(true);
                    }}
                    className="flex-1 py-2.5 bg-hw-green hover:bg-emerald-700 text-white rounded-2xl text-xs font-black uppercase tracking-wider transition-all shadow-md shadow-hw-green/15 flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                  >
                    Detail & Daftar <ChevronRight size={14} />
                  </button>
                  <button
                    onClick={() => {
                      setSelectedActivityForParticipants(activity);
                      setIsParticipantsModalOpen(true);
                    }}
                    className="py-2.5 px-4 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/80 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                  >
                    <Users size={14} className="text-emerald-600" />
                    <span>Pendaftar ({participantCountMap[activity.id] || 0})</span>
                  </button>
                  {isAdmin && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleEditActivity(activity)}
                        title="Edit Kegiatan"
                        className="p-2.5 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-2xl text-xs font-bold transition-all cursor-pointer"
                      >
                        <Edit3 size={14} />
                      </button>
                      <button
                        onClick={() => handleDeleteActivity(activity.id, activity.namaKegiatan)}
                        title="Hapus Kegiatan"
                        className="p-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-2xl text-xs font-bold transition-all cursor-pointer"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Hero Banner (Paling Bawah) */}
      <div className="relative rounded-[2rem] overflow-hidden bg-gradient-to-r from-emerald-600 via-teal-500 to-sky-500 p-6 text-white shadow-xl mt-6">
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
            Ikuti berbagai kegiatan resmi HW Jateng. Dapatkan KTA Digital resmi sebagai identitas peserta!
          </p>
        </div>
      </div>

      {/* DETAIL MODAL */}
      <AnimatePresence>
        {isDetailModalOpen && selectedActivity && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.12, ease: 'easeOut' }}
              className="bg-white rounded-[2.5rem] border border-gray-100 shadow-2xl max-w-lg w-full overflow-hidden max-h-[90vh] flex flex-col"
            >
              <div className="relative h-48 bg-gray-900 shrink-0">
                <img 
                  src={getCorsSafeUrl(selectedActivity.gambarUrl, selectedActivity.updatedAt || selectedActivity.id) || 'https://images.unsplash.com/photo-1510312305653-8ed496efae75?auto=format&fit=crop&q=80&w=800'} 
                  alt={selectedActivity.namaKegiatan} 
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover opacity-80"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1510312305653-8ed496efae75?auto=format&fit=crop&q=80&w=800';
                  }}
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

                {/* Themesong Section */}
                {(selectedActivity.themeSongUrl || selectedActivity.themeSong) ? (
                  <ThemeSongPlayer
                    audioUrl={selectedActivity.themeSongUrl || selectedActivity.themeSong}
                    title={selectedActivity.themeSongTitle || selectedActivity.themeSongName || 'Mars / Themesong Kegiatan'}
                  />
                ) : null}

                {/* Proposal Kegiatan Download */}
                {(() => {
                  const proposalLink = selectedActivity.proposalUrl || selectedActivity.proposal || selectedActivity.linkProposal || 'https://drive.google.com/file/d/1glD4rL-ZxA_g1Kpe9hQKFDS';
                  return (
                    <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/80 p-4 rounded-2xl space-y-2.5">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2">
                          <div className="p-2 bg-emerald-600 text-white rounded-xl">
                            <FileText size={18} />
                          </div>
                          <div>
                            <h5 className="text-xs font-black text-gray-800">Proposal & Petunjuk Teknis</h5>
                            <p className="text-[10px] text-emerald-800 font-semibold">Berkas resmi petunjuk pelaksanaan kegiatan HW Jateng</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDownloadDocument(
                            proposalLink,
                            selectedActivity.namaKegiatan
                          )}
                          className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-sm transition-all hover:scale-[1.02] active:scale-95 cursor-pointer"
                        >
                          <Download size={14} /> Download Proposal
                        </button>
                      </div>
                    </div>
                  );
                })()}

                {/* Rekening Pembayaran & Konfirmasi WA */}
                <div className="bg-slate-900 text-white p-4.5 rounded-2xl space-y-3.5 border border-slate-800 shadow-md">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                    <div className="flex items-center gap-2">
                      <CreditCard size={18} className="text-emerald-400" />
                      <span className="text-xs font-black uppercase tracking-wider text-emerald-400">Info Rekening & Konfirmasi</span>
                    </div>
                    <span className="text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                      Resmi HW Jateng
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Rekening Pembayaran Kegiatan</span>
                    <div className="bg-slate-800/90 border border-slate-700/80 p-3 rounded-xl flex items-center justify-between gap-2">
                      <span className="text-xs font-extrabold text-amber-300 font-mono leading-tight break-words">
                        {selectedActivity.rekeningPembayaran || selectedActivity.rekeningPembiayaan || 'Bank Syariah Indonesia (BSI) 7307427448 a.n. Kwarwil HW Jateng'}
                      </span>
                      <CopyAccountButton 
                        accountNumber={String(selectedActivity.rekeningPembayaran || selectedActivity.rekeningPembiayaan || 'Bank Syariah Indonesia (BSI) 7307427448 a.n. Kwarwil HW Jateng').replace(/[^0-9]/g, '') || '7307427448'} 
                        className="shrink-0"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3 pt-1">
                    <div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Konfirmasi Pembayaran</span>
                      <span className="text-xs font-bold text-gray-200">
                        {selectedActivity.konfirmasiPembayaran || selectedActivity.noWhatsappPanitia || '089688754000'} (Medkom)
                      </span>
                    </div>
                    {(() => {
                      const rawContact = String(selectedActivity.konfirmasiPembayaran || selectedActivity.noWhatsappPanitia || '089688754000').replace(/[^0-9]/g, '');
                      const formattedContact = rawContact.startsWith('0') ? '62' + rawContact.slice(1) : (rawContact.startsWith('62') ? rawContact : '6289688754000');
                      const waText = encodeURIComponent(`Assalamu'alaikum Medkom/Panitia HW Jateng, saya mau konfirmasi pembayaran kegiatan: ${selectedActivity.namaKegiatan}`);
                      return (
                        <a
                          href={`https://wa.me/${formattedContact}?text=${waText}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-sm shrink-0"
                        >
                          <MessageCircle size={14} /> Konfirmasi WA
                        </a>
                      );
                    })()}
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.12, ease: 'easeOut' }}
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
                        <h4 className="text-xs font-black text-emerald-950">{regSuccess.activity.penyelenggara || 'Kwarwil HW Jawa Tengah'}</h4>
                      </div>
                    </div>
                    {(() => {
                      const actRek = String(regSuccess.activity.rekeningPembayaran || regSuccess.activity.rekeningPembiayaan || 'Bank Syariah Indonesia (BSI) 7307427448 a.n. Kwarwil HW Jateng');
                      const actNum = actRek.replace(/[^0-9]/g, '') || '7307427448';
                      const actWa = String(regSuccess.activity.konfirmasiPembayaran || regSuccess.activity.noWhatsappPanitia || '089688754000').replace(/[^0-9]/g, '');
                      const formattedWa = actWa.startsWith('0') ? '62' + actWa.slice(1) : (actWa.startsWith('62') ? actWa : '6289688754000');
                      return (
                        <>
                          <div className="bg-white p-3 rounded-2xl border border-emerald-100 space-y-1 shadow-xs">
                            <p className="text-[9px] uppercase tracking-wider text-gray-400 font-bold">Transfer Infaq Kegiatan ({regSuccess.activity.biaya || 'Sesuai ketentuan'})</p>
                            <p className="text-xs font-bold text-emerald-800">{actRek}</p>
                            <div>
                              <CopyAccountButton accountNumber={actNum} showNumber={true} textClassName="text-sm font-black text-gray-900 tracking-wider font-mono" />
                            </div>
                          </div>
                          <p className="text-[10px] text-emerald-800 leading-normal font-medium">
                            Silakan lakukan pembayaran / infaq kegiatan jika berlaku, kemudian kirimkan konfirmasi bukti transfer via WhatsApp.
                          </p>
                          <a 
                            href={`https://wa.me/${formattedWa}?text=${encodeURIComponent(
                              `Assalamu'alaikum Medkom/Panitia HW Jateng, saya baru saja mendaftar kegiatan *${regSuccess.activity.namaKegiatan}*.\n\nNama: ${regSuccess.participant.namaLengkap}\nUnsur: ${regSuccess.participant.unsur}\nNo. WA: ${regSuccess.participant.noHp}\n\nMohon konfirmasi pendaftaran kegiatan saya. Terima kasih.`
                            )}`}
                            target="_blank"
                            rel="noreferrer"
                            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-center text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer"
                          >
                            <Send size={14} /> Konfirmasi Pendaftaran via WhatsApp
                          </a>
                        </>
                      );
                    })()}
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
                          <option value="Panitia">Panitia</option>
                          <option value="Pendamping">Pendamping</option>
                          <option value="Peserta">Peserta</option>
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

      {/* PARTICIPANTS LIST MODAL */}
      <AnimatePresence>
        {isParticipantsModalOpen && selectedActivityForParticipants && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.12, ease: 'easeOut' }}
              className="bg-white rounded-[2.5rem] border border-gray-100 shadow-2xl max-w-xl w-full overflow-hidden max-h-[90vh] flex flex-col"
            >
              <div className="p-5 bg-hw-dark text-white flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400">Daftar Pendaftar Kegiatan</span>
                  <h3 className="text-sm font-black font-display leading-tight">{selectedActivityForParticipants.namaKegiatan}</h3>
                </div>
                <button
                  onClick={() => setIsParticipantsModalOpen(false)}
                  className="p-2 text-gray-400 hover:text-white rounded-full transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-5 overflow-y-auto space-y-4 flex-1">
                {activeParticipantsList.length === 0 ? (
                  <div className="py-12 text-center text-gray-400 space-y-3 bg-gray-50 rounded-2xl border border-dashed border-gray-200 p-6">
                    <Users size={36} className="mx-auto text-gray-300" />
                    <p className="text-xs font-bold text-gray-600">Belum ada pendaftar untuk kegiatan ini.</p>
                    <p className="text-[11px] text-gray-400 max-w-xs mx-auto">
                      Jadilah peserta pertama yang mendaftar pada kegiatan {selectedActivityForParticipants.namaKegiatan}!
                    </p>
                    <button
                      onClick={() => {
                        setSelectedActivity(selectedActivityForParticipants);
                        setIsParticipantsModalOpen(false);
                        setIsRegisterModalOpen(true);
                      }}
                      className="mt-2 inline-flex items-center gap-2 px-5 py-2.5 bg-hw-green hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md shadow-hw-green/20 cursor-pointer active:scale-95"
                    >
                      <UserPlus size={16} />
                      <span>Mendaftar Kegiatan Ini</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 bg-emerald-50 p-3.5 rounded-2xl border border-emerald-100 text-xs text-emerald-800 font-bold">
                      <div className="flex items-center gap-2">
                        <span>Total Pendaftar Terkonfirmasi:</span>
                        <span className="bg-emerald-600 text-white px-2.5 py-0.5 rounded-full text-xs font-black">
                          {activeParticipantsList.length} Peserta
                        </span>
                      </div>
                      {selectedActivityForParticipants.status !== 'Tutup' && (
                        <button
                          onClick={() => {
                            setSelectedActivity(selectedActivityForParticipants);
                            setIsParticipantsModalOpen(false);
                            setIsRegisterModalOpen(true);
                          }}
                          className="px-3.5 py-2 bg-hw-green hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md shadow-hw-green/20 flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 shrink-0"
                        >
                          <UserPlus size={14} />
                          <span>+ Mendaftar Kegiatan</span>
                        </button>
                      )}
                    </div>

                    <div className="space-y-2.5">
                      {activeParticipantsList.map((app, idx) => {
                        const waNum = String(app.noHp || app.noWa || '').replace(/[^0-9]/g, '');
                        const formattedWa = waNum.startsWith('0') ? '62' + waNum.slice(1) : waNum;

                        return (
                          <div key={app.id || idx} className="bg-gray-50 p-3.5 rounded-2xl border border-gray-150 flex items-start justify-between gap-3 hover:bg-gray-100/80 transition-colors">
                            <div className="space-y-1 flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                                  #{idx + 1}
                                </span>
                                <h4 className="text-xs font-black text-gray-900 truncate">{app.namaLengkap}</h4>
                              </div>
                              <div className="text-[11px] text-gray-600 font-medium space-y-0.5">
                                <p><strong>Unsur/Utusan:</strong> {app.utusan || app.qabilahPtma || app.unsur || '-'}</p>
                                <p><strong>Jabatan:</strong> {app.jabatan || 'Peserta'}</p>
                                <p className="flex items-center gap-1.5 pt-0.5">
                                  <strong>Kategori Undangan:</strong>
                                  <span className="inline-block px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 text-[10px] font-extrabold border border-emerald-200">
                                    {app.kategoriUndangan || app.kategori || 'Tidak Ada / Umum'}
                                  </span>
                                </p>
                                {app.tanggalDaftar && (
                                  <p className="text-[10px] text-gray-400">
                                    Tgl Ajuan: {new Date(app.tanggalDaftar).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                  </p>
                                )}
                              </div>
                            </div>

                            {user && formattedWa && (
                              <a
                                href={`https://wa.me/${formattedWa}?text=${encodeURIComponent(`Assalamu'alaikum Sdr/i ${app.namaLengkap}, terkait kegiatan ${selectedActivityForParticipants.namaKegiatan}...`)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="shrink-0 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[11px] font-bold flex items-center gap-1 shadow-xs transition-colors"
                              >
                                <Send size={12} /> WA
                              </a>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => setIsParticipantsModalOpen(false)}
                  className="px-5 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl text-xs font-bold hover:bg-gray-100 cursor-pointer"
                >
                  Tutup
                </button>

                {selectedActivityForParticipants.status !== 'Tutup' && (
                  <button
                    onClick={() => {
                      setSelectedActivity(selectedActivityForParticipants);
                      setIsParticipantsModalOpen(false);
                      setIsRegisterModalOpen(true);
                    }}
                    className="px-5 py-2.5 bg-hw-green hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md shadow-hw-green/20 flex items-center gap-1.5 cursor-pointer active:scale-95"
                  >
                    <UserPlus size={15} />
                    <span>Mendaftar Kegiatan Sekarang</span>
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL TAMBAH / EDIT KEGIATAN */}
      <AnimatePresence>
        {isAddActivityModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.12, ease: 'easeOut' }}
              className="bg-white rounded-[2.5rem] border border-gray-100 shadow-2xl max-w-lg w-full overflow-hidden max-h-[90vh] flex flex-col"
            >
              <div className="p-5 bg-hw-dark text-white flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400">Pusat Data Kegiatan</span>
                  <h3 className="text-sm font-black font-display leading-tight">
                    {editingActivity ? 'Edit Data Kegiatan' : 'Tambah Kegiatan Baru'}
                  </h3>
                </div>
                <button
                  onClick={() => {
                    setIsAddActivityModalOpen(false);
                    setEditingActivity(null);
                  }}
                  className="p-2 text-white/70 hover:text-white rounded-full transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveNewActivity} className="p-6 overflow-y-auto space-y-4 flex-1">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-gray-500 block mb-1">
                    Nama Kegiatan *
                  </label>
                  <input
                    type="text"
                    required
                    value={newActivityForm.namaKegiatan}
                    onChange={e => setNewActivityForm({ ...newActivityForm, namaKegiatan: e.target.value })}
                    placeholder="Contoh: Perkemahan Sabtu Minggu (Persami) HW Jateng"
                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-3 text-xs font-bold outline-none focus:ring-2 focus:ring-hw-green/20"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-wider text-gray-500 block mb-1">
                      Kategori Kegiatan *
                    </label>
                    <select
                      value={newActivityForm.kategori}
                      onChange={e => setNewActivityForm({ ...newActivityForm, kategori: e.target.value })}
                      className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-3 text-xs font-bold outline-none cursor-pointer"
                    >
                      {activityCategoriesList.filter(c => c.toLowerCase() !== 'pelatihan' && c.toLowerCase() !== 'kegiatan pelatihan').map((cat, idx) => (
                        <option key={idx} value={cat}>{cat}</option>
                      ))}
                      <option value="Rapat HW">Rapat HW</option>
                      <option value="Silaturahmi">Silaturahmi</option>
                      <option value="Perkemahan">Perkemahan</option>
                      <option value="Musyawarah">Musyawarah</option>
                      <option value="Lainnya">Lainnya</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase tracking-wider text-gray-500 block mb-1">
                      Status Kegiatan *
                    </label>
                    <select
                      value={newActivityForm.status}
                      onChange={e => setNewActivityForm({ ...newActivityForm, status: e.target.value })}
                      className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-3 text-xs font-bold outline-none cursor-pointer"
                    >
                      <option value="Buka">Buka (Menerima Pendaftaran)</option>
                      <option value="Tutup">Tutup (Pendaftaran Ditutup)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-wider text-gray-500 block mb-1">
                      Tanggal & Waktu *
                    </label>
                    <input
                      type="text"
                      required
                      value={newActivityForm.tanggal}
                      onChange={e => setNewActivityForm({ ...newActivityForm, tanggal: e.target.value })}
                      placeholder="Contoh: 12 - 14 September 2026"
                      className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-3 text-xs font-bold outline-none focus:ring-2 focus:ring-hw-green/20"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase tracking-wider text-gray-500 block mb-1">
                      Lokasi / Tempat *
                    </label>
                    <input
                      type="text"
                      required
                      value={newActivityForm.lokasi}
                      onChange={e => setNewActivityForm({ ...newActivityForm, lokasi: e.target.value })}
                      placeholder="Contoh: Bumi Perkemahan Karanganyar"
                      className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-3 text-xs font-bold outline-none focus:ring-2 focus:ring-hw-green/20"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-wider text-gray-500 block mb-1">
                      Infaq / Biaya
                    </label>
                    <input
                      type="text"
                      value={newActivityForm.biaya}
                      onChange={e => setNewActivityForm({ ...newActivityForm, biaya: e.target.value })}
                      placeholder="Gratis / Rp 50.000"
                      className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-3 text-xs font-bold outline-none focus:ring-2 focus:ring-hw-green/20"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase tracking-wider text-gray-500 block mb-1">
                      Kuota Peserta
                    </label>
                    <input
                      type="text"
                      value={newActivityForm.kuota}
                      onChange={e => setNewActivityForm({ ...newActivityForm, kuota: e.target.value })}
                      placeholder="Terbuka / 100 Orang"
                      className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-3 text-xs font-bold outline-none focus:ring-2 focus:ring-hw-green/20"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[10px] font-black uppercase tracking-wider text-gray-500 block">
                      URL Foto Poster / Cover (Opsional)
                    </label>
                    <label className="text-[10px] font-bold text-hw-green hover:underline cursor-pointer flex items-center gap-1">
                      <Upload size={10} />
                      Unggah Poster
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={e => {
                          const f = e.target.files?.[0];
                          if (f) {
                            handleDocumentFileUpload(
                              f,
                              base64 => setNewActivityForm(prev => ({ ...prev, gambarUrl: base64 })),
                              err => alert(err)
                            );
                            e.target.value = '';
                          }
                        }}
                      />
                    </label>
                  </div>
                  <input
                    type="text"
                    value={newActivityForm.gambarUrl}
                    onChange={e => setNewActivityForm({ ...newActivityForm, gambarUrl: e.target.value })}
                    placeholder="https://... atau tempel link / upload foto poster"
                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-3 text-xs font-bold outline-none focus:ring-2 focus:ring-hw-green/20"
                  />
                  {newActivityForm.gambarUrl && (
                    <div className="mt-2 relative rounded-xl overflow-hidden border border-gray-200 max-h-36 bg-slate-900/10 flex items-center justify-center p-2">
                      <img 
                        src={getCorsSafeUrl(newActivityForm.gambarUrl)} 
                        alt="Preview Poster" 
                        className="max-h-32 object-contain rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => setNewActivityForm(prev => ({ ...prev, gambarUrl: '' }))}
                        className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1 hover:bg-red-700 shadow-md cursor-pointer"
                        title="Hapus Poster"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  )}
                </div>

                <div className="space-y-3 bg-emerald-50/70 p-3.5 rounded-2xl border border-emerald-100">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[10px] font-black uppercase tracking-wider text-emerald-800">
                          Link / File Themesong MP3
                        </label>
                        <label className="text-[10px] font-bold text-emerald-700 hover:text-emerald-900 cursor-pointer underline flex items-center gap-1">
                          <Upload size={10} />
                          Unggah MP3
                          <input
                            type="file"
                            accept="audio/*,.mp3,.wav,.m4a"
                            className="hidden"
                            onChange={e => {
                              const f = e.target.files?.[0];
                              if (f) {
                                handleAudioFileUpload(
                                  f,
                                  base64 => setNewActivityForm({ ...newActivityForm, themeSongUrl: base64 }),
                                  err => alert(err)
                                );
                              }
                            }}
                          />
                        </label>
                      </div>
                      <input
                        type="text"
                        value={newActivityForm.themeSongUrl}
                        onChange={e => setNewActivityForm({ ...newActivityForm, themeSongUrl: e.target.value })}
                        placeholder="https://.../lagu.mp3 atau Google Drive link"
                        className="w-full bg-white border border-emerald-200 rounded-xl p-2.5 text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500/20"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-wider text-emerald-800 block mb-1">
                        Judul Themesong / Mars (Opsional)
                      </label>
                      <input
                        type="text"
                        value={newActivityForm.themeSongTitle}
                        onChange={e => setNewActivityForm({ ...newActivityForm, themeSongTitle: e.target.value })}
                        placeholder="Contoh: Mars Hizbul Wathan"
                        className="w-full bg-white border border-emerald-200 rounded-xl p-2.5 text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500/20"
                      />
                    </div>
                  </div>

                  {newActivityForm.themeSongUrl && (
                    <ThemeSongPlayer
                      audioUrl={newActivityForm.themeSongUrl}
                      title={newActivityForm.themeSongTitle || 'Preview Themesong'}
                      compact={true}
                    />
                  )}
                </div>

                {/* Proposal Section */}
                <div className="bg-sky-50/70 p-3.5 rounded-2xl border border-sky-150 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black uppercase tracking-wider text-sky-900 flex items-center gap-1">
                      <FileText size={12} className="text-sky-700" /> Link / File Proposal Kegiatan
                    </label>
                    <label className="text-[10px] font-bold text-sky-700 hover:text-sky-900 cursor-pointer underline flex items-center gap-1">
                      <Upload size={10} />
                      Unggah File Proposal
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx"
                        className="hidden"
                        onChange={e => {
                          const f = e.target.files?.[0];
                          if (f) {
                            handleDocumentFileUpload(
                              f,
                              base64 => setNewActivityForm(prev => ({ ...prev, proposalUrl: base64 })),
                              err => alert(err)
                            );
                            e.target.value = '';
                          }
                        }}
                      />
                    </label>
                  </div>
                  <input
                    type="text"
                    value={newActivityForm.proposalUrl}
                    onChange={e => setNewActivityForm(prev => ({ ...prev, proposalUrl: e.target.value }))}
                    placeholder="https://drive.google.com/file/d/... atau upload PDF/Word"
                    className="w-full bg-white border border-sky-200 rounded-xl p-2.5 text-xs font-bold outline-none focus:ring-2 focus:ring-sky-500/20"
                  />
                  {newActivityForm.proposalUrl && newActivityForm.proposalUrl.startsWith('data:') && (
                    <div className="flex items-center justify-between bg-emerald-100/80 text-emerald-800 text-[10px] px-2.5 py-1.5 rounded-lg border border-emerald-300 font-bold">
                      <span>✓ File proposal terunggah & siap disimpan ({Math.round(newActivityForm.proposalUrl.length / 1024)} KB)</span>
                      <button
                        type="button"
                        onClick={() => setNewActivityForm(prev => ({ ...prev, proposalUrl: '' }))}
                        className="text-red-600 hover:underline text-[9px] font-extrabold cursor-pointer"
                      >
                        Hapus File
                      </button>
                    </div>
                  )}
                  <p className="text-[9px] font-semibold text-sky-700">
                    * Kosongkan jika belum ada proposal. Disarankan memakai Link Google Drive / Dropbox jika ukuran file besar.
                  </p>
                </div>

                {/* Rekening Pembayaran & Konfirmasi WA Section */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-gray-200">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-wider text-gray-600 block mb-1">
                      Rekening Pembayaran
                    </label>
                    <input
                      type="text"
                      value={newActivityForm.rekeningPembayaran}
                      onChange={e => setNewActivityForm({ ...newActivityForm, rekeningPembayaran: e.target.value })}
                      placeholder="Bank Syariah Indonesia (BSI) 7307427448 a.n. Kwarwil HW Jateng"
                      className="w-full bg-white border border-gray-250 rounded-xl p-2.5 text-xs font-bold outline-none focus:ring-2 focus:ring-hw-green/20"
                    />
                    <p className="text-[9px] text-gray-400 font-medium mt-1">Default: BSI 7307427448 a.n. Kwarwil HW Jateng</p>
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase tracking-wider text-gray-600 block mb-1">
                      Konfirmasi Pembayaran (WA)
                    </label>
                    <input
                      type="text"
                      value={newActivityForm.konfirmasiPembayaran}
                      onChange={e => setNewActivityForm({ ...newActivityForm, konfirmasiPembayaran: e.target.value })}
                      placeholder="089688754000 (Medkom HW Jateng)"
                      className="w-full bg-white border border-gray-250 rounded-xl p-2.5 text-xs font-bold outline-none focus:ring-2 focus:ring-hw-green/20"
                    />
                    <p className="text-[9px] text-gray-400 font-medium mt-1">Default: 089688754000 (Medkom HW Jateng)</p>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-gray-500 block mb-1">
                    Deskripsi Lengkap Kegiatan
                  </label>
                  <textarea
                    rows={4}
                    value={newActivityForm.deskripsi}
                    onChange={e => setNewActivityForm({ ...newActivityForm, deskripsi: e.target.value })}
                    placeholder="Jelaskan detail susunan acara, syarat peserta, fasilitas, serta ketentuan pendaftaran..."
                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-3 text-xs font-bold outline-none focus:ring-2 focus:ring-hw-green/20"
                  />
                </div>

                <div className="pt-2 flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddActivityModalOpen(false);
                      setEditingActivity(null);
                    }}
                    className="px-5 py-3.5 bg-white border border-gray-200 text-gray-700 rounded-2xl text-xs font-bold hover:bg-gray-100 cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingActivity}
                    className="flex-1 py-3.5 bg-hw-green hover:bg-emerald-700 text-white rounded-2xl text-xs font-black uppercase tracking-wider shadow-lg shadow-hw-green/20 flex items-center justify-center gap-2 cursor-pointer transition-all hover:scale-[1.01]"
                  >
                    {isSavingActivity ? (
                      <>
                        <Loader2 size={16} className="animate-spin" /> Menyimpan...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={16} /> Simpan Kegiatan
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

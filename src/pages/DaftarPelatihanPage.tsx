import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import { 
  User as UserIcon, 
  Phone, 
  Mail, 
  Lock, 
  MapPin, 
  School, 
  GraduationCap, 
  ChevronRight, 
  ChevronLeft, 
  Loader2, 
  CheckCircle2, 
  ArrowLeft,
  Calendar,
  Layers,
  Award,
  AlertCircle,
  Check,
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { sheetsService } from '../services/sheetsService';

export default function DaftarPelatihanPage() {
  const navigate = useNavigate();
  const { user, isAuthenticated, setAuth } = useAuthStore();
  
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  const [allMembers, setAllMembers] = useState<any[]>([]);
  const [showLookup, setShowLookup] = useState(false);
  const [lookupQuery, setLookupQuery] = useState('');
  const [selectedMember, setSelectedMember] = useState<any | null>(null);

  const [settings, setSettings] = useState<any>({
    trainingLocations: [],
    trainingDates: [],
    trainingActivities: []
  });

  const [selectedActivityId, setSelectedActivityId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    namaLengkap: '',
    jenisKelamin: 'L',
    nik: '',
    tempatLahir: '',
    tanggalLahir: '',
    golongan: 'Pengenal',
    pelatihGolongan: 'Tunas Athfal',
    pelatihanAkanDiikuti: 'Jati 1',
    lokasiPelatihan: '',
    tanggalPelatihan: '',
    pendidikan: 'SMA/SMK/MA',
    asalKwarda: '',
    qabilah: '',
    alamat: '',
    noHp: '',
    sosmed: '',
    email: '',
    password: '12345',
    agreeChecked: false
  });

  const location = useLocation();
  const activityFromState = (location.state as any)?.activity;

  // Load existing members & KTA applications for lookup, settings & profile pre-population
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [list, s, ktaApps] = await Promise.all([
          sheetsService.getMembers().catch(() => []),
          sheetsService.getSettings().catch(() => ({} as any)),
          sheetsService.getKTAApplications().catch(() => [])
        ]);
        setAllMembers(list || []);

        let locations: string[] = [];
        let dates: string[] = [];
        let activities: any[] = [];

        if (s) {
          locations = Array.isArray(s.trainingLocations) ? s.trainingLocations : [];
          dates = Array.isArray(s.trainingDates) ? s.trainingDates : [];
          activities = Array.isArray(s.trainingActivities)
            ? s.trainingActivities
            : typeof s.trainingActivities === 'string'
              ? JSON.parse(s.trainingActivities || '[]')
              : [];

          setSettings({
            ...s,
            trainingLocations: locations,
            trainingDates: dates,
            trainingActivities: activities
          });
        }

        let prefillLocation = activityFromState?.lokasiPelatihan || locations[0] || '';
        let prefillDate = activityFromState?.tanggalPelatihan || dates[0] || '';
        let prefillTraining = activityFromState?.jenisPelatihan || activityFromState?.namaKegiatan || 'Jati 1';

        if (activityFromState?.id) {
          setSelectedActivityId(activityFromState.id);
        } else if (activities.length > 0) {
          const firstOpen = activities.find((a: any) => a.status !== 'Tutup') || activities[0];
          if (firstOpen) {
            setSelectedActivityId(firstOpen.id);
            prefillLocation = firstOpen.lokasiPelatihan || prefillLocation;
            prefillDate = firstOpen.tanggalPelatihan || prefillDate;
            prefillTraining = firstOpen.jenisPelatihan || firstOpen.namaKegiatan || prefillTraining;
          }
        }

        if (isAuthenticated && user) {
          const freshMember = (list || []).find((m: any) => m.id === user.id || (m.email && user.email && m.email.toLowerCase().trim() === user.email.toLowerCase().trim()));
          const ktaApp = (ktaApps || []).find((a: any) => a.userId === user.id || (a.email && user.email && a.email.toLowerCase().trim() === user.email.toLowerCase().trim()));

          setFormData(prev => ({
            ...prev,
            namaLengkap: freshMember?.namaLengkap || user.namaLengkap || ktaApp?.nama || prev.namaLengkap,
            jenisKelamin: freshMember?.jenisKelamin || user.jenisKelamin || (ktaApp?.jenisKelamin === 'Perempuan' ? 'P' : 'L') || prev.jenisKelamin,
            tempatLahir: freshMember?.tempatLahir || (user as any).tempatLahir || ktaApp?.tempatLahir || prev.tempatLahir,
            tanggalLahir: freshMember?.tanggalLahir || (user as any).tanggalLahir || ktaApp?.tanggalLahir || prev.tanggalLahir,
            golongan: freshMember?.golongan || user.golongan || ktaApp?.tingkatan || prev.golongan,
            pelatihGolongan: (freshMember as any)?.pelatihGolongan || (user as any).pelatihGolongan || prev.pelatihGolongan,
            pendidikan: freshMember?.pendidikan || user.pendidikan || prev.pendidikan,
            asalKwarda: freshMember?.asalKwarda || user.asalKwarda || ktaApp?.asalDaerah || prev.asalKwarda,
            qabilah: freshMember?.qabilah || user.qabilah || ktaApp?.qabilah || prev.qabilah,
            alamat: freshMember?.alamat || user.alamat || ktaApp?.alamat || prev.alamat,
            noHp: freshMember?.noHp || user.noHp || ktaApp?.noWa || prev.noHp,
            email: freshMember?.email || user.email || ktaApp?.email || prev.email,
            sosmed: freshMember?.sosmed || user.sosmed || ktaApp?.sosmed || prev.sosmed,
            nik: freshMember?.nik || (user as any).nik || ktaApp?.nik || prev.nik || '',
            pelatihanAkanDiikuti: prefillTraining,
            lokasiPelatihan: prefillLocation,
            tanggalPelatihan: prefillDate,
            agreeChecked: true // Auto-check for convenience for logged in user
          }));
        } else {
          setFormData(prev => ({
            ...prev,
            pelatihanAkanDiikuti: prefillTraining,
            lokasiPelatihan: prefillLocation,
            tanggalPelatihan: prefillDate
          }));
        }
      } catch (err) {
        console.error('Failed to load registered members and settings:', err);
      }
    };
    fetchData();
  }, [isAuthenticated, user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectActivity = (act: any) => {
    setSelectedActivityId(act.id);
    setFormData(prev => ({
      ...prev,
      pelatihanAkanDiikuti: act.jenisPelatihan || act.namaKegiatan || prev.pelatihanAkanDiikuti,
      lokasiPelatihan: act.lokasiPelatihan || prev.lokasiPelatihan,
      tanggalPelatihan: act.tanggalPelatihan || prev.tanggalPelatihan
    }));
  };

  const handleSelectTraining = (lvl: string) => {
    setFormData(prev => ({ ...prev, pelatihanAkanDiikuti: lvl }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.agreeChecked) {
      setErrorMsg('Anda harus mencentang persetujuan bahwa semua data sudah benar.');
      return;
    }
    setErrorMsg('');
    setIsLoading(true);

    try {
      let currentUserId = user?.id || selectedMember?.id;

      // 1. If not authenticated and no selectedMember, create user account first
      if (!isAuthenticated && !selectedMember) {
        const regRes = await sheetsService.register({
          namaLengkap: formData.namaLengkap,
          jenisKelamin: formData.jenisKelamin,
          golongan: formData.golongan,
          pelatihan: [], // Empty initially
          pendidikan: formData.pendidikan,
          asalKwarda: formData.asalKwarda,
          qabilah: formData.qabilah,
          alamat: formData.alamat,
          noHp: formData.noHp,
          sosmed: formData.sosmed,
          email: formData.email,
          password: formData.password
        });
        
        if (regRes && regRes.user) {
          currentUserId = regRes.user.id;
          // Log them in
          setAuth(regRes.user, regRes.token || 'mock-token');
        } else {
          throw new Error('Gagal mendaftarkan akun.');
        }
      }

      // 2. Submit training registration
      const trainingPayload = {
        userId: currentUserId || 'guest-' + Date.now(),
        nama: formData.namaLengkap,
        noWa: formData.noHp,
        email: formData.email,
        sosmed: formData.sosmed,
        tingkatan: formData.golongan,
        pelatihGolongan: formData.pelatihGolongan,
        asalDaerah: formData.asalKwarda,
        pelatihanAkanDiikuti: formData.pelatihanAkanDiikuti,
        lokasiPelatihan: formData.lokasiPelatihan || (Array.isArray(settings.trainingLocations) && settings.trainingLocations[0]) || '',
        tanggalPelatihan: formData.tanggalPelatihan || (Array.isArray(settings.trainingDates) && settings.trainingDates[0]) || '',
        nik: formData.nik,
        tempatLahir: formData.tempatLahir,
        tanggalLahir: formData.tanggalLahir,
        jenisKelamin: formData.jenisKelamin,
        qabilah: formData.qabilah,
        photo: '' // optional
      };

      await sheetsService.applyTraining(trainingPayload);
      setIsSuccess(true);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err?.message || 'Pendaftaran pelatihan gagal. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }} 
        animate={{ opacity: 1, scale: 1 }} 
        className="flex flex-col items-center justify-center min-h-[70vh] text-center p-4 space-y-6"
      >
        <div className="w-20 h-20 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center border border-emerald-500/20">
          <CheckCircle2 size={40} />
        </div>
        
        <div className="space-y-3 max-w-md">
          <h2 className="text-xl font-display font-bold text-gray-800">Pendaftaran Pelatihan Berhasil!</h2>
          <div className="bg-white p-5 rounded-[2rem] border border-gray-100 shadow-sm space-y-4 text-xs text-gray-600 leading-relaxed text-left">
            <p className="text-gray-700">
              Terima kasih <span className="font-bold text-hw-dark">{formData.namaLengkap}</span>, pendaftaran Anda untuk mengikuti pelatihan <span className="font-bold text-hw-green">{formData.pelatihanAkanDiikuti}</span> telah diterima oleh sistem dan sedang dalam proses verifikasi admin.
            </p>

            <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 space-y-1">
              <p className="text-[10px] uppercase font-black tracking-wider text-gray-400">Rincian Kegiatan:</p>
              <p className="font-bold text-gray-800 text-xs">📍 {formData.lokasiPelatihan}</p>
              <p className="font-medium text-gray-600 text-xs">📅 {formData.tanggalPelatihan}</p>
            </div>

            <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl text-emerald-800 space-y-3">
              <p className="font-bold text-emerald-900 text-xs">Instruksi Pembayaran & Aktivasi:</p>
              <p className="text-[11px] leading-normal">
                Silahkan lakukan pembayaran pendaftaran sebesar <span className="font-extrabold text-emerald-900">Rp 50.000,-</span> ke rekening resmi berikut:
              </p>
              <div className="bg-white p-3 rounded-xl border border-emerald-100 text-center font-mono">
                <span className="block text-[9px] uppercase tracking-wider text-gray-400 font-sans">Bank Syariah Indonesia (BSI)</span>
                <span className="text-base font-black text-hw-dark">7307427448</span>
                <span className="block text-[10px] text-gray-600 font-sans mt-0.5">an. Kwarwil HW Jateng</span>
              </div>
              <p className="text-[11px] leading-normal pt-1">
                Setelah transfer, kirimkan konfirmasi bukti pembayaran melalui WhatsApp ke nomor:
                <a href="https://wa.me/6289688754000" target="_blank" rel="noopener noreferrer" className="block text-center font-bold text-emerald-950 underline mt-1.5 bg-white py-2 rounded-xl border border-emerald-100">
                  Medkom HW Jateng (089688754000)
                </a>
              </p>
            </div>

            {!isAuthenticated && (
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 text-center">
                <p className="font-semibold text-gray-700 text-[10px] uppercase tracking-wider mb-1">Akses Akun Baru Anda</p>
                <p className="text-[10px]">Email: <span className="font-bold text-hw-green">{formData.email}</span></p>
                <p className="text-[10px]">Password default: <span className="font-mono font-bold text-hw-dark">12345</span></p>
              </div>
            )}

            <p className="text-[11px] italic text-gray-400 text-center mt-2">
              Hak akses ke materi pelatihan {formData.pelatihanAkanDiikuti} akan otomatis terbuka begitu pembayaran dikonfirmasi dan status disetujui.
            </p>
          </div>
        </div>

        <button 
          onClick={() => navigate('/pelatihan')}
          className="w-full max-w-xs py-3.5 rounded-2xl bg-hw-dark text-white font-bold text-xs shadow-lg flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
        >
          Kembali ke Portal Pelatihan
        </button>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button 
          onClick={() => navigate('/pelatihan')} 
          className="p-2 bg-white border border-gray-100 rounded-xl text-gray-400 hover:text-hw-green transition-colors cursor-pointer"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h2 className="text-xl font-display font-bold text-gray-800">Formulir Pendaftaran Pelatihan</h2>
          <p className="text-gray-500 text-[11px]">Pelatihan Jaya Melati 1/2 HW Jawa Tengah</p>
        </div>
      </div>

      {/* AGENDA PELATIHAN DARI ADMIN */}
      {Array.isArray(settings.trainingActivities) && settings.trainingActivities.length > 0 && (
        <div className="bg-white p-5 rounded-[2rem] border border-gray-100 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-gray-100 pb-2">
            <div className="flex items-center gap-2">
              <Calendar className="text-hw-green" size={18} />
              <h3 className="font-display font-bold text-gray-800 text-xs uppercase tracking-wider">Pilih Agenda Kegiatan Pelatihan</h3>
            </div>
            <span className="text-[9px] font-black bg-hw-green/10 text-hw-green px-2 py-0.5 rounded-full uppercase">
              Resmi HW Jateng
            </span>
          </div>

          <div className="space-y-2.5">
            {settings.trainingActivities.map((act: any) => {
              const isSelected = selectedActivityId === act.id || (
                formData.lokasiPelatihan === act.lokasiPelatihan && formData.tanggalPelatihan === act.tanggalPelatihan
              );

              return (
                <div
                  key={act.id}
                  onClick={() => act.status !== 'Tutup' && handleSelectActivity(act)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                    act.status === 'Tutup' 
                      ? 'bg-gray-50 border-gray-200 opacity-60 cursor-not-allowed'
                      : isSelected
                        ? 'bg-emerald-50/80 border-hw-green ring-2 ring-hw-green/20 shadow-xs'
                        : 'bg-gray-50/70 hover:bg-gray-100/80 border-gray-150'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                          {act.jenisPelatihan || 'Jaya Melati'}
                        </span>
                        {isSelected && (
                          <span className="text-[9px] font-bold text-hw-green flex items-center gap-1">
                            <Check size={12} /> Terpilih
                          </span>
                        )}
                      </div>
                      <h4 className="font-display font-bold text-gray-800 text-xs mt-1">{act.namaKegiatan}</h4>
                    </div>
                    <span className={`text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${
                      act.status === 'Tutup' ? 'bg-red-100 text-red-600' : 'bg-emerald-500 text-white'
                    }`}>
                      {act.status === 'Tutup' ? 'Tutup' : 'Buka'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-gray-600 font-medium mt-2 pt-2 border-t border-gray-200/50">
                    <div className="flex items-start gap-1">
                      <MapPin size={12} className="text-hw-green shrink-0 mt-0.5" />
                      <span className="break-words leading-tight">{act.lokasiPelatihan || '-'}</span>
                    </div>
                    <div className="flex items-start gap-1">
                      <Calendar size={12} className="text-hw-green shrink-0 mt-0.5" />
                      <span className="break-words leading-tight">{act.tanggalPelatihan || '-'}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Form Card */}
      <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
        {/* LOGGED IN MEMBER AUTO-PREFILLED CARD */}
        {(isAuthenticated && user) || selectedMember ? (
          <div className="p-6 space-y-5">
            <div className="p-4 bg-emerald-50 border border-emerald-200/70 rounded-2xl flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-hw-green text-white flex items-center justify-center shrink-0 shadow-sm">
                <CheckCircle2 size={22} />
              </div>
              <div className="space-y-1 flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-200/60 px-2 py-0.5 rounded-md">
                    ✓ Data Profil Terisi Otomatis
                  </span>
                  {selectedMember && (
                    <button 
                      type="button"
                      onClick={() => setSelectedMember(null)}
                      className="text-[10px] text-rose-600 font-bold underline"
                    >
                      Batal
                    </button>
                  )}
                </div>
                <h3 className="font-display font-bold text-gray-900 text-sm">
                  {formData.namaLengkap || user?.namaLengkap}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-[11px] text-gray-600 font-medium pt-1">
                  <p>NIK: <span className="font-mono text-gray-800 font-bold">{formData.nik || '-'}</span></p>
                  <p>Email: <span className="font-mono text-gray-800 font-bold">{formData.email || '-'}</span></p>
                  <p>WhatsApp: <span className="font-mono text-gray-800 font-bold">{formData.noHp || '-'}</span></p>
                  <p>Golongan: <span className="font-bold text-gray-800">{formData.golongan || '-'}</span></p>
                  <p>Kwarda: <span className="font-bold text-gray-800">{formData.asalKwarda || '-'}</span></p>
                  <p>Qabilah: <span className="font-bold text-gray-800">{formData.qabilah || '-'}</span></p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {errorMsg && (
                <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-700 text-xs flex items-start gap-2">
                  <AlertCircle size={16} className="mt-0.5 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Pelatih Golongan */}
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Pelatih Golongan Yang Dituju</label>
                <select 
                  name="pelatihGolongan" 
                  value={formData.pelatihGolongan} 
                  onChange={handleChange} 
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200/50 rounded-xl focus:ring-2 focus:ring-hw-green/20 outline-none text-xs font-semibold"
                >
                  {['Tunas Athfal', 'Athfal', 'Pengenal', 'Penghela', 'Penuntun'].map(g => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>

              {/* Pelatihan Yang Akan Diikuti Selection */}
              <div className="space-y-2 pt-1">
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Tingkat Pelatihan</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'Jati 1', label: 'Jati 1', desc: 'Jaya Melati 1' },
                    { id: 'Jati 2', label: 'Jati 2', desc: 'Jaya Melati 2' },
                    { id: 'Jari 1', label: 'Jari 1', desc: 'Jaya Matahari 1' }
                  ].map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleSelectTraining(p.id)}
                      className={`p-3 rounded-2xl flex flex-col items-center justify-center border-2 transition-all gap-1 text-center cursor-pointer ${
                        formData.pelatihanAkanDiikuti === p.id 
                          ? 'border-hw-green bg-hw-green/5 text-hw-green shadow-sm' 
                          : 'border-transparent bg-gray-50 text-gray-500 hover:bg-gray-100'
                      }`}
                    >
                      <GraduationCap size={16} className={formData.pelatihanAkanDiikuti === p.id ? 'text-hw-green' : 'text-gray-400'} />
                      <span className="text-xs font-bold leading-none">{p.label}</span>
                      <span className="text-[8px] opacity-75 leading-none">{p.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Pilihan Lokasi & Tanggal Pelaksanaan dari Admin */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider flex items-center gap-1">
                    📍 Lokasi Pelatihan (Input Admin)
                  </label>
                  {Array.isArray(settings.trainingLocations) && settings.trainingLocations.length > 0 ? (
                    <select 
                      name="lokasiPelatihan" 
                      value={formData.lokasiPelatihan} 
                      onChange={handleChange} 
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200/50 rounded-xl focus:ring-2 focus:ring-hw-green/20 outline-none text-xs font-semibold text-gray-700"
                    >
                      {settings.trainingLocations.map((loc: string) => (
                        <option key={loc} value={loc}>{loc}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      name="lokasiPelatihan"
                      value={formData.lokasiPelatihan}
                      onChange={handleChange}
                      placeholder="Contoh: Pusdiklat HW Jateng"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200/50 rounded-xl focus:ring-2 focus:ring-hw-green/20 outline-none text-xs font-semibold text-gray-700"
                    />
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider flex items-center gap-1">
                    📅 Tanggal Pelaksanaan (Input Admin)
                  </label>
                  {Array.isArray(settings.trainingDates) && settings.trainingDates.length > 0 ? (
                    <select 
                      name="tanggalPelatihan" 
                      value={formData.tanggalPelatihan} 
                      onChange={handleChange} 
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200/50 rounded-xl focus:ring-2 focus:ring-hw-green/20 outline-none text-xs font-semibold text-gray-700"
                    >
                      {settings.trainingDates.map((dt: string) => (
                        <option key={dt} value={dt}>{dt}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      name="tanggalPelatihan"
                      value={formData.tanggalPelatihan}
                      onChange={handleChange}
                      placeholder="Contoh: 12-14 Juli 2026"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200/50 rounded-xl focus:ring-2 focus:ring-hw-green/20 outline-none text-xs font-semibold text-gray-700"
                    />
                  )}
                </div>
              </div>

              {/* Statement Checklist */}
              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-150/50 flex items-start gap-3 mt-4">
                <input 
                  type="checkbox" 
                  id="agreeCheckedSelected"
                  name="agreeChecked"
                  checked={formData.agreeChecked}
                  onChange={(e) => setFormData(prev => ({ ...prev, agreeChecked: e.target.checked }))}
                  className="mt-0.5 rounded border-gray-300 text-hw-green focus:ring-hw-green shrink-0 w-4 h-4 cursor-pointer"
                />
                <label htmlFor="agreeCheckedSelected" className="text-[11px] text-gray-600 leading-normal select-none cursor-pointer font-medium">
                  Saya menyatakan data profil saya sudah sesuai dan saya siap mendaftar pada kegiatan pelatihan yang dipilih.
                </label>
              </div>

              <button 
                type="submit" 
                disabled={isLoading}
                className="w-full bg-hw-green hover:bg-emerald-700 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-hw-green/20 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 transition-all text-xs cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="animate-spin" size={18} /> Memproses pendaftaran...
                  </>
                ) : (
                  <>
                    Daftar Pelatihan Sekarang <ChevronRight size={18} />
                  </>
                )}
              </button>
            </form>
          </div>
        ) : (
          /* GUEST FORM (3 STEPS) */
          <div className="p-6 space-y-6">
            {/* Progress bar for guests */}
            <div className="flex gap-1.5 h-1.5">
              {[1, 2, 3].map(i => (
                <div 
                  key={`step-${i}`} 
                  className={`flex-1 rounded-full transition-all duration-300 ${step >= i ? 'bg-hw-green' : 'bg-gray-100'}`} 
                />
              ))}
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {errorMsg && (
                <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-700 text-xs flex items-start gap-2">
                  <AlertCircle size={16} className="mt-0.5 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Guest Lookup Option */}
              {!selectedMember && (
                <div className="bg-hw-green/5 border border-hw-green/10 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-extrabold text-hw-dark">Sudah Terdaftar di Aplikasi?</h4>
                      <p className="text-[10px] text-gray-500">Cari data Anda agar tidak perlu mengisi formulir dari awal.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowLookup(!showLookup)}
                      className="px-3 py-1.5 bg-hw-green text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all hover:bg-emerald-700 cursor-pointer"
                    >
                      {showLookup ? 'Batal' : 'Cari Data'}
                    </button>
                  </div>

                  {showLookup && (
                    <div className="space-y-2 pt-1 border-t border-gray-150/30">
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Ketik Nama, Email, atau No. WhatsApp Anda..."
                          value={lookupQuery}
                          onChange={(e) => setLookupQuery(e.target.value)}
                          className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-hw-green/20 outline-none text-xs font-semibold"
                        />
                      </div>
                      
                      {/* Results list */}
                      {lookupQuery.trim().length >= 2 && (
                        <div className="bg-white border border-gray-100 rounded-xl divide-y divide-gray-50 max-h-40 overflow-y-auto shadow-sm">
                          {allMembers.filter(m => 
                            m.namaLengkap?.toLowerCase().includes(lookupQuery.toLowerCase()) ||
                            m.email?.toLowerCase().includes(lookupQuery.toLowerCase()) ||
                            String(m.noHp || '').includes(lookupQuery)
                          ).length === 0 ? (
                            <p className="p-3 text-[11px] text-gray-400 font-bold text-center">Data anggota tidak ditemukan</p>
                          ) : (
                            allMembers.filter(m => 
                              m.namaLengkap?.toLowerCase().includes(lookupQuery.toLowerCase()) ||
                              m.email?.toLowerCase().includes(lookupQuery.toLowerCase()) ||
                              String(m.noHp || '').includes(lookupQuery)
                            ).map(m => (
                              <div key={m.id} className="p-3 flex items-center justify-between hover:bg-gray-50/50">
                                <div>
                                  <p className="text-xs font-extrabold text-gray-700">{m.namaLengkap}</p>
                                  <p className="text-[10px] text-gray-400 font-medium">{m.email} | {m.noHp || '-'}</p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedMember(m);
                                    setFormData(prev => ({
                                      ...prev,
                                      namaLengkap: m.namaLengkap || '',
                                      jenisKelamin: m.jenisKelamin || 'L',
                                      nik: m.nik || '',
                                      tempatLahir: m.tempatLahir || '',
                                      tanggalLahir: m.tanggalLahir || '',
                                      golongan: m.golongan || 'Pengenal',
                                      pelatihGolongan: (m as any).pelatihGolongan || 'Tunas Athfal',
                                      pendidikan: m.pendidikan || 'SMA/SMK/MA',
                                      asalKwarda: m.asalKwarda || '',
                                      qabilah: m.qabilah || '',
                                      alamat: m.alamat || '',
                                      noHp: m.noHp || '',
                                      email: m.email || '',
                                      sosmed: m.sosmed || '',
                                      agreeChecked: true
                                    }));
                                    setShowLookup(false);
                                    setLookupQuery('');
                                  }}
                                  className="px-2.5 py-1 bg-hw-green text-white rounded-lg text-[10px] font-black uppercase tracking-wider cursor-pointer"
                                >
                                  Pilih
                                </button>
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Guest User Step 1 */}
              {step === 1 && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                  <div className="border-b border-gray-100 pb-2 mb-2 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-hw-green text-white text-[9px] flex items-center justify-center font-bold">1</span>
                    <h3 className="font-bold text-sm text-gray-700">Biodata Anggota</h3>
                  </div>

                  {/* Nama Lengkap */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Nama Lengkap</label>
                    <input 
                      type="text" 
                      name="namaLengkap" 
                      required 
                      placeholder="Nama sesuai KTP/KTA"
                      value={formData.namaLengkap} 
                      onChange={handleChange} 
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200/50 rounded-xl focus:ring-2 focus:ring-hw-green/20 outline-none text-xs font-semibold" 
                    />
                  </div>

                  {/* Tempat & Tanggal Lahir */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Tempat Lahir</label>
                      <input 
                        type="text" 
                        name="tempatLahir" 
                        required 
                        placeholder="Contoh: Banyumas"
                        value={formData.tempatLahir} 
                        onChange={handleChange} 
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200/50 rounded-xl focus:ring-2 focus:ring-hw-green/20 outline-none text-xs font-semibold" 
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Tanggal Lahir</label>
                      <input 
                        type="date" 
                        name="tanggalLahir" 
                        required 
                        value={formData.tanggalLahir} 
                        onChange={handleChange} 
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200/50 rounded-xl focus:ring-2 focus:ring-hw-green/20 outline-none text-xs font-semibold" 
                      />
                    </div>
                  </div>

                  {/* Jenis Kelamin & Golongan */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Jenis Kelamin</label>
                      <select 
                        name="jenisKelamin" 
                        value={formData.jenisKelamin} 
                        onChange={handleChange} 
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200/50 rounded-xl focus:ring-2 focus:ring-hw-green/20 outline-none text-xs font-semibold"
                      >
                        <option value="L">Laki-laki</option>
                        <option value="P">Perempuan</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Golongan Anggota</label>
                      <select 
                        name="golongan" 
                        value={formData.golongan} 
                        onChange={handleChange} 
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200/50 rounded-xl focus:ring-2 focus:ring-hw-green/20 outline-none text-xs font-semibold"
                      >
                        {['Tunas Athfal', 'Athfal', 'Pengenal', 'Penghela', 'Penuntun', 'Dewasa'].map(g => (
                          <option key={g} value={g}>{g}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Pelatih Golongan Field */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Pelatih Golongan</label>
                    <select 
                      name="pelatihGolongan" 
                      value={formData.pelatihGolongan} 
                      onChange={handleChange} 
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200/50 rounded-xl focus:ring-2 focus:ring-hw-green/20 outline-none text-xs font-semibold"
                    >
                      {['Tunas Athfal', 'Athfal', 'Pengenal', 'Penghela', 'Penuntun'].map(g => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                    </select>
                  </div>

                  {/* Pelatihan Yang Akan Diikuti Selection */}
                  <div className="space-y-2 pt-2">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Pelatihan Yang Akan Diikuti</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'Jati 1', label: 'Jati 1', desc: 'Jaya Melati 1' },
                        { id: 'Jati 2', label: 'Jati 2', desc: 'Jaya Melati 2' },
                        { id: 'Jari 1', label: 'Jari 1', desc: 'Jaya Matahari 1' }
                      ].map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => handleSelectTraining(p.id)}
                          className={`p-3 rounded-2xl flex flex-col items-center justify-center border-2 transition-all gap-1 text-center cursor-pointer ${
                            formData.pelatihanAkanDiikuti === p.id 
                              ? 'border-hw-green bg-hw-green/5 text-hw-green shadow-sm' 
                              : 'border-transparent bg-gray-50 text-gray-500 hover:bg-gray-100'
                          }`}
                        >
                          <GraduationCap size={16} className={formData.pelatihanAkanDiikuti === p.id ? 'text-hw-green' : 'text-gray-400'} />
                          <span className="text-xs font-bold leading-none">{p.label}</span>
                          <span className="text-[8px] opacity-75 leading-none">{p.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Pilihan Lokasi & Tanggal Pelaksanaan */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider flex items-center gap-1">
                        📍 Pilih Lokasi Pelatihan
                      </label>
                      {Array.isArray(settings.trainingLocations) && settings.trainingLocations.length > 0 ? (
                        <select 
                          name="lokasiPelatihan" 
                          value={formData.lokasiPelatihan} 
                          onChange={handleChange} 
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200/50 rounded-xl focus:ring-2 focus:ring-hw-green/20 outline-none text-xs font-semibold text-gray-700"
                        >
                          {settings.trainingLocations.map((loc: string) => (
                            <option key={loc} value={loc}>{loc}</option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="text"
                          name="lokasiPelatihan"
                          value={formData.lokasiPelatihan}
                          onChange={handleChange}
                          placeholder="Pusdiklat HW Jateng"
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200/50 rounded-xl focus:ring-2 focus:ring-hw-green/20 outline-none text-xs font-semibold text-gray-700"
                        />
                      )}
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider flex items-center gap-1">
                        📅 Pilih Tanggal Pelaksanaan
                      </label>
                      {Array.isArray(settings.trainingDates) && settings.trainingDates.length > 0 ? (
                        <select 
                          name="tanggalPelatihan" 
                          value={formData.tanggalPelatihan} 
                          onChange={handleChange} 
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200/50 rounded-xl focus:ring-2 focus:ring-hw-green/20 outline-none text-xs font-semibold text-gray-700"
                        >
                          {settings.trainingDates.map((dt: string) => (
                            <option key={dt} value={dt}>{dt}</option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="text"
                          name="tanggalPelatihan"
                          value={formData.tanggalPelatihan}
                          onChange={handleChange}
                          placeholder="12-14 Juli 2026"
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200/50 rounded-xl focus:ring-2 focus:ring-hw-green/20 outline-none text-xs font-semibold text-gray-700"
                        />
                      )}
                    </div>
                  </div>

                  <button 
                    type="button" 
                    onClick={() => setStep(2)} 
                    className="w-full mt-4 bg-hw-dark text-white font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] transition-transform text-xs cursor-pointer"
                  >
                    Lanjut ke Alamat <ChevronRight size={16} />
                  </button>
                </motion.div>
              )}

              {/* Guest User Step 2 */}
              {step === 2 && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                  <div className="border-b border-gray-100 pb-2 mb-2 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-hw-green text-white text-[9px] flex items-center justify-center font-bold">2</span>
                    <h3 className="font-bold text-sm text-gray-700">Instansi & Alamat Rumah</h3>
                  </div>

                  {/* Pendidikan Terakhir */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Pendidikan Terakhir</label>
                    <select 
                      name="pendidikan" 
                      value={formData.pendidikan} 
                      onChange={handleChange} 
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200/50 rounded-xl focus:ring-2 focus:ring-hw-green/20 outline-none text-xs font-semibold"
                    >
                      {['SD', 'SMP/MTs', 'SMA/SMK/MA', 'D1/D2/D3', 'S1', 'S2', 'S3'].map(p => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </div>

                  {/* Asal Kwarda (Kabupaten/Daerah) */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Asal Kabupaten / Kwarda</label>
                    <input 
                      type="text" 
                      name="asalKwarda" 
                      required 
                      placeholder="Contoh: Banyumas"
                      value={formData.asalKwarda} 
                      onChange={handleChange} 
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200/50 rounded-xl focus:ring-2 focus:ring-hw-green/20 outline-none text-xs font-semibold" 
                    />
                  </div>

                  {/* Asal Qabilah (Sekolah / Pangkalan) */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Asal Qabilah (Sekolah / Pangkalan Kegiatan)</label>
                    <input 
                      type="text" 
                      name="qabilah" 
                      required 
                      placeholder="Contoh: SD Muhammadiyah 1 / SMA HW Solo"
                      value={formData.qabilah} 
                      onChange={handleChange} 
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200/50 rounded-xl focus:ring-2 focus:ring-hw-green/20 outline-none text-xs font-semibold" 
                    />
                  </div>

                  {/* Alamat Lengkap */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Alamat Lengkap Rumah</label>
                    <textarea 
                      name="alamat" 
                      required 
                      rows={3} 
                      placeholder="Dusun, RT/RW, Kelurahan, Kecamatan, Kabupaten, Kode Pos"
                      value={formData.alamat} 
                      onChange={handleChange} 
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200/50 rounded-xl focus:ring-2 focus:ring-hw-green/20 outline-none text-xs font-semibold resize-none" 
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <button 
                      type="button" 
                      onClick={() => setStep(1)} 
                      className="w-full bg-gray-100 text-gray-600 font-bold py-3 rounded-xl flex items-center justify-center gap-1.5 text-xs cursor-pointer"
                    >
                      <ChevronLeft size={16} /> Kembali
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setStep(3)} 
                      className="w-full bg-hw-dark text-white font-bold py-3 rounded-xl flex items-center justify-center gap-1.5 text-xs cursor-pointer"
                    >
                      Lanjut <ChevronRight size={16} />
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Guest User Step 3 */}
              {step === 3 && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                  <div className="border-b border-gray-100 pb-2 mb-2 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-hw-green text-white text-[9px] flex items-center justify-center font-bold">3</span>
                    <h3 className="font-bold text-sm text-gray-700">Kontak & Akun Anggota</h3>
                  </div>

                  {/* Whatsapp */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Nomor WhatsApp Aktif</label>
                    <input 
                      type="text" 
                      name="noHp" 
                      required 
                      placeholder="Contoh: 08123456789"
                      value={formData.noHp} 
                      onChange={handleChange} 
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200/50 rounded-xl focus:ring-2 focus:ring-hw-green/20 outline-none text-xs font-semibold" 
                    />
                  </div>

                  {/* Email */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Alamat Email</label>
                    <input 
                      type="email" 
                      name="email" 
                      required 
                      placeholder="nama@email.com"
                      value={formData.email} 
                      onChange={handleChange} 
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200/50 rounded-xl focus:ring-2 focus:ring-hw-green/20 outline-none text-xs font-semibold" 
                    />
                  </div>

                  {/* Sosmed */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Media Sosial (Instagram/FB/X)</label>
                    <input 
                      type="text" 
                      name="sosmed" 
                      placeholder="Contoh: @username"
                      value={formData.sosmed} 
                      onChange={handleChange} 
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200/50 rounded-xl focus:ring-2 focus:ring-hw-green/20 outline-none text-xs font-semibold" 
                    />
                  </div>

                  {/* Password info */}
                  <div className="p-3 bg-hw-green/5 border border-hw-green/10 rounded-xl text-[11px] text-gray-600 leading-normal">
                    <span className="font-bold text-hw-green">Catatan Pembuatan Akun:</span> Pendaftaran pelatihan ini sekaligus mendaftarkan Anda sebagai anggota resmi HW. Password masuk default Anda adalah <span className="font-mono font-bold text-hw-dark bg-white px-1 py-0.5 rounded border border-gray-100">12345</span>.
                  </div>

                  {/* Statement Checklist */}
                  <div className="p-4 bg-gray-50 rounded-2xl border border-gray-150/50 flex items-start gap-3">
                    <input 
                      type="checkbox" 
                      id="agreeCheckedGuest"
                      name="agreeChecked"
                      checked={formData.agreeChecked}
                      onChange={(e) => setFormData(prev => ({ ...prev, agreeChecked: e.target.checked }))}
                      className="mt-0.5 rounded border-gray-300 text-hw-green focus:ring-hw-green shrink-0 w-4 h-4 cursor-pointer"
                    />
                    <label htmlFor="agreeCheckedGuest" className="text-[11px] text-gray-600 leading-normal select-none cursor-pointer font-medium">
                      Saya menyatakan bahwa semua data pendaftaran diatas adalah benar, asli, dan dapat dipertanggungjawabkan keabsahannya.
                    </label>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <button 
                      type="button" 
                      onClick={() => setStep(2)} 
                      disabled={isLoading}
                      className="w-full bg-gray-100 text-gray-600 font-bold py-3 rounded-xl flex items-center justify-center gap-1.5 text-xs disabled:opacity-50 cursor-pointer"
                    >
                      <ChevronLeft size={16} /> Kembali
                    </button>
                    <button 
                      type="submit" 
                      disabled={isLoading}
                      className="w-full bg-hw-green hover:bg-emerald-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-1.5 text-xs shadow-md shadow-hw-green/10 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 transition-all cursor-pointer"
                    >
                      {isLoading ? (
                        <Loader2 className="animate-spin" size={16} />
                      ) : (
                        <>Daftar Pelatihan Sekarang</>
                      )}
                    </button>
                  </div>
                </motion.div>
              )}
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

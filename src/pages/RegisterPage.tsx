import React, { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, 
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
  Upload, 
  CreditCard, 
  Info, 
  Calendar, 
  UserSquare,
  Sparkles,
  Check,
  ArrowLeft
} from 'lucide-react';
import { sheetsService } from '../services/sheetsService';
import { KWARDA_QABILAH_JATENG } from './KTAPage';

export default function RegisterPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string>('');
  const [validationError, setValidationError] = useState<string>('');

  const [formData, setFormData] = useState({
    namaLengkap: '',
    jenisKelamin: 'L',
    golongan: 'Dewasa',
    pelatihan: [] as string[],
    pendidikan: 'SMA/SMK/MA',
    asalKwarda: 'Kabupaten Banyumas',
    qabilah: '',
    alamat: '',
    noHp: '',
    sosmed: '',
    email: '',
    password: '',
    nik: '',
    tempatLahir: '',
    tanggalLahir: '',
    jenisKta: 'Digital',
    photo: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (value: string) => {
    setFormData(prev => {
      const current = prev.pelatihan;
      if (current.includes(value)) {
        return { ...prev, pelatihan: current.filter(i => i !== value) };
      } else {
        return { ...prev, pelatihan: [...current, value] };
      }
    });
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert('Ukuran foto maksimal 10MB');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          // Downscale to max dimension 350px for fast loading & sheet compliance
          const maxDim = 350;
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
            setPhotoPreview(compressedBase64);
            setFormData(prev => ({ ...prev, photo: compressedBase64 }));
            setValidationError('');
          } else {
            const base64String = event.target?.result as string;
            setPhotoPreview(base64String);
            setFormData(prev => ({ ...prev, photo: base64String }));
            setValidationError('');
          }
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const validateStep = (currentStep: number) => {
    setValidationError('');
    
    if (currentStep === 1) {
      if (!formData.namaLengkap.trim()) {
        setValidationError('Nama lengkap wajib diisi');
        return false;
      }
      if (!formData.email.trim() || !formData.email.includes('@')) {
        setValidationError('Email tidak valid');
        return false;
      }
      if (!formData.password || formData.password.length < 5) {
        setValidationError('Password minimal terdiri dari 5 karakter');
        return false;
      }
      if (!formData.noHp.trim()) {
        setValidationError('Nomor WhatsApp wajib diisi');
        return false;
      }
    } else if (currentStep === 2) {
      if (!formData.nik || formData.nik.length !== 16) {
        setValidationError('NIK harus terdiri dari 16 digit angka');
        return false;
      }
      if (!formData.tempatLahir.trim()) {
        setValidationError('Tempat lahir wajib diisi');
        return false;
      }
      if (!formData.tanggalLahir) {
        setValidationError('Tanggal lahir wajib diisi');
        return false;
      }
      if (!formData.photo) {
        setValidationError('Foto Profil KTA wajib diunggah');
        return false;
      }
    } else if (currentStep === 3) {
      if (!formData.alamat.trim()) {
        setValidationError('Alamat lengkap wajib diisi');
        return false;
      }
      if (!formData.qabilah.trim()) {
        setValidationError('Asal Qabilah wajib diisi');
        return false;
      }
    }
    return true;
  };

  const nextStep = () => {
    if (validateStep(step)) {
      setStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    setValidationError('');
    setStep(prev => prev - 1);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep(3)) return;

    setIsLoading(true);
    setValidationError('');
    try {
      // 1. Check for duplicates (NIK, Email)
      const apps = await sheetsService.getKTAApplications();
      const isDup = apps.some((app: any) => {
        const appEmail = (app.email || '').trim().toLowerCase();
        const appNik = (app.nik || '').trim();
        return appEmail === formData.email.trim().toLowerCase() || appNik === formData.nik.trim();
      });

      if (isDup) {
        throw new Error('NIK atau Email ini sudah terdaftar dalam sistem pengajuan KTA.');
      }

      // 2. Register user account (isVerified = false)
      const userPayload = {
        namaLengkap: formData.namaLengkap,
        jenisKelamin: formData.jenisKelamin,
        golongan: formData.golongan,
        pendidikan: formData.pendidikan,
        asalKwarda: formData.asalKwarda,
        qabilah: formData.qabilah,
        alamat: formData.alamat,
        noHp: formData.noHp,
        sosmed: formData.sosmed,
        email: formData.email,
        password: formData.password || '12345hw',
        photo: formData.photo,
        pelatihan: formData.pelatihan
      };
      await sheetsService.register(userPayload);

      // 3. Create KTA Application
      const ktaPayload = {
        id: '',
        userId: 'user-' + formData.email.replace(/[^a-zA-Z0-9]/g, '_'),
        nama: formData.namaLengkap,
        alamat: formData.alamat,
        tingkatan: formData.golongan,
        asalDaerah: formData.asalKwarda,
        noWa: formData.noHp,
        email: formData.email,
        sosmed: formData.sosmed,
        photo: formData.photo,
        nik: formData.nik,
        tempatLahir: formData.tempatLahir,
        tanggalLahir: formData.tanggalLahir,
        jenisKelamin: formData.jenisKelamin,
        qabilah: formData.qabilah,
        jenisKta: formData.jenisKta
      };
      await sheetsService.applyKTA(ktaPayload);
      setIsSuccess(true);
    } catch (err: any) {
      setValidationError(err.message || 'Pendaftaran gagal. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    const paymentAmount = formData.jenisKta === 'Fisik' ? 'Rp 50.000,-' : 'Rp 10.000,-';
    const waText = `Assalamu'alaikum Medkom HW Jateng, saya baru saja mendaftar akun aplikasi HW Jateng dan mengajukan KTA.\n\nNama: ${formData.namaLengkap}\nNIK: ${formData.nik}\nJenis KTA: ${formData.jenisKta}\nKabupaten/Kota: ${formData.asalKwarda}\nEmail: ${formData.email}\n\nMohon diverifikasi pembayaran aktivasi KTA saya. Terima kasih.`;
    
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }} 
        animate={{ opacity: 1, scale: 1 }} 
        className="flex flex-col items-center justify-center min-h-[70vh] text-center p-4 space-y-6 max-w-md mx-auto"
      >
        <div className="w-20 h-20 bg-hw-green/10 text-hw-green rounded-full flex items-center justify-center border border-hw-green/20 shadow-inner">
          <CheckCircle2 size={44} className="stroke-[2.5]" />
        </div>
        
        <div className="space-y-2">
          <h2 className="text-xl font-display font-black text-gray-800">Pendaftaran KTA Berhasil!</h2>
          <p className="text-gray-500 text-xs">
            Akun Anda telah terdaftar dan pengajuan KTA sedang diproses.
          </p>
        </div>

        {/* ACCOUNT INFO CARD */}
        <div className="bg-white p-5 rounded-[2.5rem] border border-gray-100 shadow-sm w-full space-y-4 text-left">
          <div className="border-b border-gray-100 pb-3">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">DATA LOGIN ANDA</span>
            <div className="text-xs space-y-1 text-gray-600">
              <p>Email: <strong className="text-gray-800">{formData.email}</strong></p>
              <p>Password: <strong className="text-gray-800 font-mono">{(formData.password || '').replace(/./g, '*')} (Sesuai yang Anda input)</strong></p>
            </div>
          </div>

          {/* PAYMENT NOTIFICATION CARD */}
          <div className="bg-emerald-50/50 border border-emerald-100 rounded-3xl p-4 space-y-3">
            <div className="flex items-center gap-2 border-b border-emerald-100 pb-2">
              <div className="p-1 px-1.5 bg-hw-green text-white rounded-lg text-[8px] font-black uppercase">
                INSTRUKSI AKTIVASI & PEMBAYARAN
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div className="bg-white p-2.5 rounded-2xl border border-emerald-100/50 space-y-0.5 shadow-sm">
                <p className="text-[8px] uppercase tracking-wider text-gray-400 font-bold">Nominal Pembayaran KTA</p>
                <p className="text-sm font-black text-hw-green">
                  {paymentAmount}
                </p>
                <p className="text-[8.5px] text-gray-500 font-medium">
                  Jenis KTA: <strong className="text-gray-700">{formData.jenisKta}</strong> 
                  {formData.jenisKta === 'Fisik' ? ' (Sudah termasuk ongkos kirim ke seluruh Jateng)' : ' (KTA Digital Aktif Selamanya)'}
                </p>
              </div>

              <div className="bg-white p-2.5 rounded-2xl border border-emerald-100/50 space-y-0.5 shadow-sm">
                <p className="text-[8px] uppercase tracking-wider text-gray-400 font-bold">Transfer ke Rekening</p>
                <p className="text-[10px] font-bold text-emerald-800">BSI (Bank Syariah Indonesia)</p>
                <p className="text-xs font-black text-gray-800 tracking-wide font-mono">7307427448</p>
                <p className="text-[9px] text-gray-500 font-semibold uppercase">Atas Nama: Kwarwil HW Jateng</p>
              </div>

              <div className="text-[9px] text-emerald-800 leading-normal font-medium bg-emerald-50 p-2 rounded-xl border border-emerald-200 border-dashed">
                Demi ketertiban verifikasi, silakan kirim bukti transfer pembayaran Anda melalui WhatsApp ke Medkom HW Jateng (089688754000). Setelah admin menyetujui, akun Anda otomatis aktif sepenuhnya.
              </div>
            </div>

            <a 
              href={`https://wa.me/6289688754000?text=${encodeURIComponent(waText)}`}
              target="_blank"
              rel="noreferrer"
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-center text-xs font-bold leading-none flex items-center justify-center gap-1.5 shadow-md transition-all hover:scale-[1.01]"
            >
              Kirim Bukti Transfer WhatsApp
            </a>
          </div>
        </div>

        <button 
          onClick={() => navigate('/login')}
          className="w-full py-4 rounded-2xl bg-hw-dark text-white font-bold shadow-xl flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all"
        >
          Masuk ke Akun Aplikasi <ChevronRight size={18} />
        </button>
      </motion.div>
    );
  }

  return (
    <div className="pt-2 max-w-md mx-auto">
      <div className="flex items-center justify-between mb-4 px-2">
        <button 
          onClick={() => navigate('/')}
          className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-[10px] font-extrabold rounded-xl transition-colors flex items-center gap-1 cursor-pointer"
        >
          <ArrowLeft size={12} /> Kembali ke Beranda
        </button>
      </div>

      <div className="mb-4 text-center">
        <h2 className="text-xl font-display font-black text-gray-800 flex items-center justify-center gap-2">
          <Sparkles className="text-hw-green fill-hw-green/20" size={20} />
          Pendaftaran KTA HW
        </h2>
        <p className="text-gray-500 text-xs">Aktivasi KTA Resmi & Akun Aplikasi</p>
      </div>

      {/* Progress Bars */}
      <div className="flex gap-2 mb-6 px-2 h-1.5">
        {[1, 2, 3].map(i => (
          <div 
            key={`step-${i}`} 
            className={`flex-1 rounded-full transition-all duration-500 ${step >= i ? 'bg-hw-green' : 'bg-gray-200'}`} 
          />
        ))}
      </div>

      {validationError && (
        <div className="mb-4 p-3.5 bg-rose-50 border border-rose-100 rounded-2xl text-xs font-semibold text-rose-600 flex items-center gap-2">
          <span className="w-1.5 h-1.5 bg-rose-500 rounded-full shrink-0" />
          {validationError}
        </div>
      )}

      <form onSubmit={handleRegister} className="space-y-6 pb-12">
        <AnimatePresence mode="wait">
          {/* STEP 1: LOGIN INFO */}
          {step === 1 && (
            <motion.div 
              key="step1"
              initial={{ opacity: 0, x: 10 }} 
              animate={{ opacity: 1, x: 0 }} 
              exit={{ opacity: 0, x: -10 }}
              className="space-y-4"
            >
              <h3 className="font-bold text-sm text-gray-700 flex items-center gap-2 px-1">
                <span className="w-5 h-5 rounded-full bg-hw-green text-white text-[10px] flex items-center justify-center font-black">1</span>
                Informasi Login & Akun
              </h3>
              
              <div className="space-y-4 bg-white p-5 rounded-[2rem] border border-gray-100 shadow-sm">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 ml-1 uppercase tracking-wider">Nama Lengkap Sesuai KTP/Ijazah</label>
                  <div className="relative">
                    <User className="absolute left-4 top-3.5 text-gray-400" size={16} />
                    <input 
                      name="namaLengkap" 
                      value={formData.namaLengkap} 
                      onChange={handleChange} 
                      placeholder="Masukkan nama lengkap Anda" 
                      required 
                      className="w-full bg-gray-50 border-none rounded-2xl p-3.5 pl-11 text-xs font-semibold focus:ring-2 focus:ring-hw-green/20 outline-none" 
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 ml-1 uppercase tracking-wider">Email Utama</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-3.5 text-gray-400" size={16} />
                    <input 
                      name="email" 
                      type="email"
                      value={formData.email} 
                      onChange={handleChange} 
                      placeholder="nama@email.com" 
                      required 
                      className="w-full bg-gray-50 border-none rounded-2xl p-3.5 pl-11 text-xs font-semibold focus:ring-2 focus:ring-hw-green/20 outline-none" 
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 ml-1 uppercase tracking-wider">Password Baru</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-3.5 text-gray-400" size={16} />
                    <input 
                      name="password" 
                      type="password"
                      value={formData.password} 
                      onChange={handleChange} 
                      placeholder="Minimal 5 karakter" 
                      required 
                      className="w-full bg-gray-50 border-none rounded-2xl p-3.5 pl-11 text-xs font-semibold focus:ring-2 focus:ring-hw-green/20 outline-none" 
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 ml-1 uppercase tracking-wider">No. WhatsApp / Handphone</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-3.5 text-gray-400" size={16} />
                    <input 
                      name="noHp" 
                      value={formData.noHp} 
                      onChange={(e) => setFormData(prev => ({ ...prev, noHp: e.target.value.replace(/\D/g, '') }))}
                      placeholder="Contoh: 08123456789" 
                      required 
                      className="w-full bg-gray-50 border-none rounded-2xl p-3.5 pl-11 text-xs font-semibold focus:ring-2 focus:ring-hw-green/20 outline-none" 
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 ml-1 uppercase tracking-wider">Username Sosial Media (Instagram/FB)</label>
                  <input 
                    name="sosmed" 
                    value={formData.sosmed} 
                    onChange={handleChange} 
                    placeholder="Contoh: @username" 
                    className="w-full bg-gray-50 border-none rounded-2xl p-3.5 text-xs font-semibold focus:ring-2 focus:ring-hw-green/20 outline-none" 
                  />
                </div>
              </div>
              
              <button 
                type="button" 
                onClick={nextStep} 
                className="w-full bg-hw-dark hover:scale-[1.01] active:scale-[0.99] transition-all text-white font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 shadow-lg text-xs"
              >
                Lanjut ke Biodata KTA <ChevronRight size={16} />
              </button>
            </motion.div>
          )}

          {/* STEP 2: KTA DETAILS & PHOTO UPLOAD */}
          {step === 2 && (
            <motion.div 
              key="step2"
              initial={{ opacity: 0, x: 10 }} 
              animate={{ opacity: 1, x: 0 }} 
              exit={{ opacity: 0, x: -10 }}
              className="space-y-4"
            >
              <h3 className="font-bold text-sm text-gray-700 flex items-center gap-2 px-1">
                <span className="w-5 h-5 rounded-full bg-hw-green text-white text-[10px] flex items-center justify-center font-black">2</span>
                Identitas Anggota & KTA
              </h3>

              <div className="space-y-4 bg-white p-5 rounded-[2rem] border border-gray-100 shadow-sm">
                
                {/* Photo Upload Slot */}
                <div className="space-y-2 border-b border-gray-50 pb-4">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Foto Profil KTA (Wajib)</label>
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-20 rounded-xl bg-gray-50 border border-dashed border-gray-200 flex items-center justify-center overflow-hidden shrink-0 relative">
                      {photoPreview ? (
                        <img src={photoPreview} alt="Foto Profil" className="w-full h-full object-cover" />
                      ) : (
                        <UserSquare size={24} className="text-gray-300" />
                      )}
                    </div>
                    <div className="flex-1 space-y-1.5">
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handlePhotoChange}
                        ref={fileInputRef}
                        className="hidden"
                      />
                      <button 
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center gap-1.5 px-3 py-2 bg-gray-50 border border-gray-200 hover:bg-gray-100 transition-colors rounded-xl text-[11px] font-bold text-gray-600"
                      >
                        <Upload size={12} /> Pilih Foto Kepala
                      </button>
                      <p className="text-[8.5px] text-gray-400 leading-normal">Format JPG/PNG, Berbackground Putih, Dianjurkan Berseragam HW Lengkap, Maksimal File 2 MB (Rasio Portrait 3:4)</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 ml-1 uppercase tracking-wider">NIK / Nomor Induk Kependudukan (16 Digit)</label>
                  <input 
                    name="nik" 
                    maxLength={16}
                    value={formData.nik} 
                    onChange={(e) => setFormData(prev => ({ ...prev, nik: e.target.value.replace(/\D/g, '') }))}
                    placeholder="Masukkan 16 digit NIK sesuai KTP" 
                    required 
                    className="w-full bg-gray-50 border-none rounded-2xl p-3.5 text-xs font-semibold focus:ring-2 focus:ring-hw-green/20 outline-none font-mono" 
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 ml-1 uppercase tracking-wider">Tempat Lahir</label>
                    <input 
                      name="tempatLahir" 
                      value={formData.tempatLahir} 
                      onChange={handleChange} 
                      placeholder="Contoh: Banyumas" 
                      required 
                      className="w-full bg-gray-50 border-none rounded-2xl p-3.5 text-xs font-semibold focus:ring-2 focus:ring-hw-green/20 outline-none" 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 ml-1 uppercase tracking-wider">Tanggal Lahir</label>
                    <input 
                      name="tanggalLahir" 
                      type="date"
                      value={formData.tanggalLahir} 
                      onChange={handleChange} 
                      required 
                      className="w-full bg-gray-50 border-none rounded-2xl p-3.5 text-xs font-semibold focus:ring-2 focus:ring-hw-green/20 outline-none" 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 ml-1 uppercase tracking-wider">Jenis Kelamin</label>
                    <select 
                      name="jenisKelamin" 
                      value={formData.jenisKelamin} 
                      onChange={handleChange} 
                      className="w-full bg-gray-50 border-none rounded-2xl p-3.5 text-xs font-semibold outline-none"
                    >
                      <option value="L">Laki-laki</option>
                      <option value="P">Perempuan</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 ml-1 uppercase tracking-wider">Jenis KTA</label>
                    <select 
                      name="jenisKta" 
                      value={formData.jenisKta} 
                      onChange={handleChange} 
                      className="w-full bg-gray-50 border-none rounded-2xl p-3.5 text-xs font-semibold outline-none text-hw-green"
                    >
                      <option value="Digital">Digital (Rp 10.000)</option>
                      <option value="Fisik">Cetak Fisik (Rp 50.000)</option>
                    </select>
                  </div>
                </div>

                {/* PAYMENT NOTIFICATION IN REGISTER PROCESS */}
                <div className="bg-emerald-50/60 border border-emerald-100 rounded-2xl p-3.5 space-y-2 mt-2">
                  <div className="flex items-center gap-1.5 text-hw-green font-bold text-[11px]">
                    <CreditCard size={14} />
                    <span>Info Pembayaran KTA {formData.jenisKta}</span>
                  </div>
                  <div className="text-[10px] text-emerald-800 leading-normal space-y-1">
                    <p>
                      Biaya keanggotaan senilai <strong className="text-hw-green text-[11px]">{formData.jenisKta === 'Fisik' ? 'Rp 50.000' : 'Rp 10.000'}</strong> ditransfer ke:
                    </p>
                    <div className="bg-white/80 p-2 rounded-xl border border-emerald-100/50 space-y-0.5 font-sans">
                      <p className="font-bold text-gray-800 text-[10px]">Bank Syariah Indonesia (BSI)</p>
                      <p className="text-xs font-black text-gray-800 tracking-wide font-mono">7307427448</p>
                      <p className="text-[9px] text-gray-500 font-semibold uppercase">an. Kwarwil HW Jateng</p>
                    </div>
                    <p className="text-[9.5px]">
                      Setelah mendaftar, konfirmasi bukti transfer via WhatsApp ke <strong className="text-emerald-900">Medkom HW Jateng 089688754000</strong>.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button 
                  type="button" 
                  onClick={prevStep} 
                  className="w-full bg-gray-100 hover:bg-gray-200 transition-colors text-gray-600 font-bold py-3.5 rounded-2xl flex items-center justify-center gap-1.5 text-xs"
                >
                  <ChevronLeft size={16} /> Kembali
                </button>
                <button 
                  type="button" 
                  onClick={nextStep} 
                  className="w-full bg-hw-dark hover:scale-[1.01] active:scale-[0.99] transition-all text-white font-bold py-3.5 rounded-2xl flex items-center justify-center gap-1.5 text-xs shadow-lg"
                >
                  Lanjut <ChevronRight size={16} />
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 3: SCOUTING STRUCTURE & VERIFICATION */}
          {step === 3 && (
            <motion.div 
              key="step3"
              initial={{ opacity: 0, x: 10 }} 
              animate={{ opacity: 1, x: 0 }} 
              exit={{ opacity: 0, x: -10 }}
              className="space-y-4"
            >
              <h3 className="font-bold text-sm text-gray-700 flex items-center gap-2 px-1">
                <span className="w-5 h-5 rounded-full bg-hw-green text-white text-[10px] flex items-center justify-center font-black">3</span>
                Struktur Kepanduan & Wilayah
              </h3>

              <div className="space-y-4 bg-white p-5 rounded-[2rem] border border-gray-100 shadow-sm">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 ml-1 uppercase tracking-wider">Tingkatan HW</label>
                    <select 
                      name="golongan" 
                      value={formData.golongan} 
                      onChange={handleChange} 
                      className="w-full bg-gray-50 border-none rounded-2xl p-3.5 text-xs font-semibold outline-none"
                    >
                      {['Tunas Athfal', 'Athfal', 'Pengenal', 'Penghela', 'Penuntun', 'Dewasa'].map(g => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 ml-1 uppercase tracking-wider">Pendidikan Terakhir</label>
                    <select 
                      name="pendidikan" 
                      value={formData.pendidikan} 
                      onChange={handleChange} 
                      className="w-full bg-gray-50 border-none rounded-2xl p-3.5 text-xs font-semibold outline-none"
                    >
                      {['SD', 'SMP/MTs', 'SMA/SMK/MA', 'D1/D2/D3', 'S1', 'S2', 'S3'].map(p => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 ml-1 uppercase tracking-wider">Asal Kwarda (Kabupaten/Kota)</label>
                  <select 
                    name="asalKwarda" 
                    value={formData.asalKwarda} 
                    onChange={handleChange} 
                    className="w-full bg-gray-50 border-none rounded-2xl p-3.5 text-xs font-semibold outline-none text-gray-700"
                  >
                    {KWARDA_QABILAH_JATENG.map(item => (
                      <option key={item.code} value={item.name}>{item.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 ml-1 uppercase tracking-wider">Asal Qabilah (Sekolah/Tempat Latihan)</label>
                  <input 
                    name="qabilah" 
                    value={formData.qabilah} 
                    onChange={handleChange} 
                    placeholder="Contoh: Qabilah Ahmad Dahlan" 
                    required 
                    className="w-full bg-gray-50 border-none rounded-2xl p-3.5 text-xs font-semibold focus:ring-2 focus:ring-hw-green/20 outline-none" 
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 ml-1 uppercase tracking-wider">Alamat Lengkap Rumah</label>
                  <textarea 
                    name="alamat" 
                    value={formData.alamat} 
                    onChange={handleChange} 
                    rows={2} 
                    placeholder="Masukkan alamat domisili lengkap Anda"
                    required
                    className="w-full bg-gray-50 border-none rounded-2xl p-3.5 text-xs font-semibold focus:ring-2 focus:ring-hw-green/20 outline-none resize-none" 
                  />
                </div>

                {/* Pelatihan List */}
                <div className="space-y-2 pt-1 border-t border-gray-50">
                  <label className="text-[10px] font-black text-gray-400 ml-1 uppercase tracking-wider">Pelatihan HW yang Pernah Diikuti</label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {['Jati 1', 'Jati 2', 'Jari 1', 'Jari 2', 'Jawi'].map(p => {
                      const isSelected = formData.pelatihan.includes(p);
                      return (
                        <button 
                          key={p} 
                          type="button" 
                          onClick={() => handleCheckboxChange(p)}
                          className={`p-2.5 rounded-xl text-[11px] font-bold text-center border-2 transition-all flex items-center justify-between px-3 ${isSelected ? 'bg-hw-green/5 border-hw-green text-hw-green' : 'bg-gray-50 border-transparent text-gray-400'}`}
                        >
                          {p}
                          {isSelected && <Check size={10} className="stroke-[3]" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* PAYMENT BRIEF NOTICE */}
              <div className="bg-emerald-50/45 border border-emerald-100 rounded-3xl p-4 space-y-3">
                <div className="flex gap-2.5 items-start">
                  <CreditCard size={16} className="text-hw-green shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-[10px] text-emerald-800 leading-normal font-medium">
                      <strong>Aktivasi Pembayaran KTA:</strong> Pengajuan ini memerlukan pembayaran administrasi sebesar <strong>{formData.jenisKta === 'Fisik' ? 'Rp 50.000,-' : 'Rp 10.000,-'}</strong> sesuai pilihan KTA <strong>{formData.jenisKta}</strong> Anda.
                    </p>
                  </div>
                </div>
                <div className="bg-white/80 p-3 rounded-2xl border border-emerald-100/50 text-[10px] text-emerald-900 space-y-1">
                  <p className="font-semibold text-gray-500 text-[8px] uppercase tracking-wider">Transfer Pembayaran ke:</p>
                  <p className="font-bold text-emerald-800 text-[10px]">Bank Syariah Indonesia (BSI)</p>
                  <p className="text-xs font-black text-gray-800 tracking-wide font-mono">7307427448</p>
                  <p className="text-[9px] text-gray-500 font-semibold uppercase">an. Kwarwil HW Jateng</p>
                  <div className="pt-1.5 border-t border-emerald-100/50 mt-1 text-[9px] text-gray-600 leading-relaxed font-medium">
                    Konfirmasi Bukti Transfer WhatsApp ke <strong>Medkom HW Jateng 089688754000</strong> setelah mengirimkan pendaftaran.
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button 
                  type="button" 
                  onClick={prevStep} 
                  className="w-full bg-gray-100 hover:bg-gray-200 transition-colors text-gray-600 font-bold py-3.5 rounded-2xl flex items-center justify-center gap-1.5 text-xs"
                >
                  <ChevronLeft size={16} /> Kembali
                </button>
                <button 
                  type="submit" 
                  disabled={isLoading} 
                  className="w-full gradient-bg hover:scale-[1.01] active:scale-[0.99] transition-all text-white font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 shadow-lg text-xs"
                >
                  {isLoading ? (
                    <Loader2 className="animate-spin" size={16} />
                  ) : (
                    <>Kirim Pengajuan KTA <ChevronRight size={16} /></>
                  )}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </form>

      <div className="mt-2 text-center pb-12">
        <p className="text-gray-500 text-xs">
          Sudah memiliki akun?{' '}
          <Link to="/login" className="text-hw-green font-extrabold hover:underline">Masuk Aplikasi</Link>
        </p>
      </div>
    </div>
  );
}

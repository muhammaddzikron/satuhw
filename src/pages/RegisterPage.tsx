import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { User, Phone, Mail, Lock, MapPin, School, GraduationCap, ChevronRight, Loader2, CheckCircle2 } from 'lucide-react';
import { sheetsService } from '../services/sheetsService';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [formData, setFormData] = useState({
    namaLengkap: '',
    jenisKelamin: 'L',
    golongan: 'Pengenal',
    pelatihan: [] as string[],
    pendidikan: 'SMA/SMK/MA',
    asalKwarda: '',
    qabilah: '',
    alamat: '',
    noHp: '',
    sosmed: '',
    email: '',
    password: '12345'
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

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await sheetsService.register(formData);
      setIsSuccess(true);
    } catch (err) {
      alert('Pendaftaran gagal. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }} 
        animate={{ opacity: 1, scale: 1 }} 
        className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 space-y-8"
      >
        <div className="w-24 h-24 bg-hw-green/10 text-hw-green rounded-full flex items-center justify-center border border-hw-green/20">
          <CheckCircle2 size={48} />
        </div>
        
        <div className="space-y-4">
          <h2 className="text-2xl font-display font-bold text-gray-800">Pendaftaran Berhasil!</h2>
          <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-6 text-sm text-gray-600 leading-relaxed text-left">
            <p>
              Terima kasih, Anda telah berhasil melakukan pendaftaran menggunakan email <span className="font-bold text-hw-green">{formData.email}</span>
            </p>
            
            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex flex-col items-center">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Password Anda</span>
              <span className="text-2xl font-mono font-black text-hw-dark tracking-[0.5em]">12345</span>
            </div>

            <p>
              Silakan login ke website menggunakan password tersebut. Demi keamanan, kami menyarankan Anda untuk segera mengganti password setelah berhasil login.
            </p>
            
            <p className="font-bold pt-2">Terima kasih.</p>
          </div>
        </div>

        <button 
          onClick={() => navigate('/login')}
          className="w-full max-w-xs py-4 rounded-2xl bg-hw-dark text-white font-bold shadow-xl flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all"
        >
          Masuk Sekarang <ChevronRight size={20} />
        </button>
      </motion.div>
    );
  }

  return (
    <div className="pt-2">
      <div className="mb-6 text-center">
        <h2 className="text-2xl font-display font-bold text-gray-800">Daftar Anggota</h2>
        <p className="text-gray-500 text-sm">Bergabung dengan ekosistem HW</p>
      </div>

      {/* Progress Bars */}
      <div className="flex gap-2 mb-8 px-4 h-1.5">
        {[1, 2, 3].map(i => (
          <div key={`step-${i}`} className={`flex-1 rounded-full transition-all duration-500 ${step >= i ? 'bg-hw-green' : 'bg-gray-200'}`} />
        ))}
      </div>

      <form onSubmit={handleRegister} className="space-y-6">
        {step === 1 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
            <h3 className="font-bold text-lg text-gray-700 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-hw-green text-white text-[10px] flex items-center justify-center">1</span>
              Biodata Diri
            </h3>
            
            <div className="space-y-4 bg-white p-5 rounded-[2rem] border border-gray-100 shadow-sm">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 ml-1 uppercase">Nama Lengkap</label>
                <input name="namaLengkap" value={formData.namaLengkap} onChange={handleChange} placeholder="Contoh: Ahmad Dahlan" required className="w-full bg-gray-50 border-none rounded-2xl p-4 text-sm focus:ring-2 focus:ring-hw-green/20" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 ml-1 uppercase">Jenis Kelamin</label>
                  <select name="jenisKelamin" value={formData.jenisKelamin} onChange={handleChange} className="w-full bg-gray-50 border-none rounded-2xl p-4 text-sm outline-none">
                    <option value="L">Laki-laki</option>
                    <option value="P">Perempuan</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 ml-1 uppercase">Golongan</label>
                  <select name="golongan" value={formData.golongan} onChange={handleChange} className="w-full bg-gray-50 border-none rounded-2xl p-4 text-sm outline-none">
                    {['Tunas Athfal', 'Athfal', 'Pengenal', 'Penghela', 'Penuntun', 'Dewasa'].map(g => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 ml-1 uppercase">Pelatihan Yang Pernah Diikuti</label>
                <div className="grid grid-cols-2 gap-2">
                  {['Jati 1', 'Jati 2', 'Jari 1', 'Jari 2', 'Jawi'].map(p => (
                    <button 
                      key={p} type="button" 
                      onClick={() => handleCheckboxChange(p)}
                      className={`p-3 rounded-xl text-xs font-semibold text-center border-2 transition-all ${formData.pelatihan.includes(p) ? 'bg-hw-green/10 border-hw-green text-hw-green' : 'bg-gray-50 border-transparent text-gray-400'}`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            
            <button type="button" onClick={() => setStep(2)} className="w-full bg-hw-dark text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2">
              Lanjut <ChevronRight size={18} />
            </button>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
             <h3 className="font-bold text-lg text-gray-700 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-hw-green text-white text-[10px] flex items-center justify-center">2</span>
              Instansi & Alamat
            </h3>

            <div className="space-y-4 bg-white p-5 rounded-[2rem] border border-gray-100 shadow-sm">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 ml-1 uppercase">Pendidikan Terakhir</label>
                <select name="pendidikan" value={formData.pendidikan} onChange={handleChange} className="w-full bg-gray-50 border-none rounded-2xl p-4 text-sm outline-none">
                  {['SD', 'SMP/MTs', 'SMA/SMK/MA', 'D1/D2/D3', 'S1', 'S2', 'S3'].map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 ml-1 uppercase">Asal Kwarda</label>
                <input name="asalKwarda" value={formData.asalKwarda} onChange={handleChange} placeholder="Contoh: Banyumas" className="w-full bg-gray-50 border-none rounded-2xl p-4 text-sm" />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 ml-1 uppercase">Asal Qabilah</label>
                <input name="qabilah" value={formData.qabilah} onChange={handleChange} placeholder="Contoh: Qabilah Sudirman" className="w-full bg-gray-50 border-none rounded-2xl p-4 text-sm" />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 ml-1 uppercase">Alamat Lengkap</label>
                <textarea name="alamat" value={formData.alamat} onChange={handleChange} rows={3} className="w-full bg-gray-50 border-none rounded-2xl p-4 text-sm" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button type="button" onClick={() => setStep(1)} className="w-full bg-gray-200 text-gray-600 font-bold py-4 rounded-2xl">Kembali</button>
              <button type="button" onClick={() => setStep(3)} className="w-full bg-hw-dark text-white font-bold py-4 rounded-2xl">Lanjut</button>
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
             <h3 className="font-bold text-lg text-gray-700 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-hw-green text-white text-[10px] flex items-center justify-center">3</span>
              Kontak & Keamanan
            </h3>

            <div className="space-y-4 bg-white p-5 rounded-[2rem] border border-gray-100 shadow-sm">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 ml-1 uppercase">No. WhatsApp</label>
                <input name="noHp" value={formData.noHp} onChange={handleChange} placeholder="08xxxx" className="w-full bg-gray-50 border-none rounded-2xl p-4 text-sm" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 ml-1 uppercase">Sosial Media</label>
                <input name="sosmed" value={formData.sosmed} onChange={handleChange} placeholder="@username" className="w-full bg-gray-50 border-none rounded-2xl p-4 text-sm" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 ml-1 uppercase">Email</label>
                <input name="email" type="email" value={formData.email} onChange={handleChange} placeholder="email@anda.com" required className="w-full bg-gray-50 border-none rounded-2xl p-4 text-sm" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button type="button" onClick={() => setStep(2)} className="w-full bg-gray-200 text-gray-600 font-bold py-4 rounded-2xl">Kembali</button>
              <button type="submit" disabled={isLoading} className="w-full gradient-bg text-white font-bold py-4 rounded-2xl shadow-lg flex items-center justify-center gap-2">
                {isLoading ? <Loader2 className="animate-spin" /> : 'Selesai'}
              </button>
            </div>
          </motion.div>
        )}
      </form>

      <div className="mt-8 text-center pb-10">
        <p className="text-gray-500 text-sm">
          Sudah punya akun?{' '}
          <Link to="/login" className="text-hw-green font-bold hover:underline">Masuk</Link>
        </p>
      </div>
    </div>
  );
}

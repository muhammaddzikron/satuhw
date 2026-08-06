import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import { 
  Lock, 
  Mail, 
  Eye, 
  EyeOff, 
  Loader2, 
  ShieldCheck, 
  ChevronLeft, 
  MessageCircle, 
  Search, 
  CheckCircle2, 
  XCircle, 
  UserPlus,
  X
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { sheetsService } from '../services/sheetsService';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [resetEmail, setResetEmail] = useState('');
  const [resetFullName, setResetFullName] = useState('');
  const [waNumber, setWaNumber] = useState('6281234567890');
  const [showForgotModal, setShowForgotModal] = useState(false);
  
  // Cek Email Status states
  const [checkEmailInput, setCheckEmailInput] = useState('');
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [checkResult, setCheckResult] = useState<{
    checked: boolean;
    found: boolean;
    user?: any;
    emailSearched?: string;
  } | null>(null);

  const navigate = useNavigate();
  const { setAuth } = useAuthStore();

  React.useEffect(() => {
    const fetchSettings = async () => {
      try {
        const s = await sheetsService.getSettings();
        if (s.waConfirmation) {
          setWaNumber(s.waConfirmation);
        }
      } catch (error) {
        console.error('Error fetching settings:', error);
      }
    };
    fetchSettings();
  }, []);

  const handleCheckEmailStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = checkEmailInput.trim().toLowerCase();
    if (!cleanEmail) return;

    setIsCheckingEmail(true);
    try {
      const members = await sheetsService.getMembers();
      const found = members.find((m: any) => 
        (m.email && m.email.trim().toLowerCase() === cleanEmail) ||
        (m.id && String(m.id).trim().toLowerCase() === cleanEmail)
      );

      if (found) {
        setCheckResult({
          checked: true,
          found: true,
          user: found,
          emailSearched: cleanEmail
        });
        setEmail(found.email || cleanEmail);
      } else {
        setCheckResult({
          checked: true,
          found: false,
          emailSearched: cleanEmail
        });
      }
    } catch (err) {
      console.error('Error checking email status:', err);
    } finally {
      setIsCheckingEmail(false);
    }
  };

  const location = useLocation();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      const { user, token } = await sheetsService.login(email, password);
      setAuth(user, token);
      const redirectUrl = (location.state as any)?.redirectTo;
      const activityState = (location.state as any)?.activity;

      if (user.role === 'superadmin' || user.role === 'admin') {
        navigate('/admin');
      } else if (redirectUrl) {
        navigate(redirectUrl, { state: { activity: activityState } });
      } else {
        navigate('/');
      }
    } catch (err: any) {
      setError(err.message || 'Login gagal. Periksa kembali email dan password.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleWhatsAppReset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail || !resetFullName) return;
    
    const text = encodeURIComponent(`Assalamu'alaikum Medkom HW Jateng,
Saya mengajukan permohonan untuk melakukan reset password akun saya dengan data sebagai berikut:

Nama Lengkap : ${resetFullName}
Email : ${resetEmail}

Mohon bantuan untuk mereset password akun saya.
Atas perhatian dan bantuannya, saya ucapkan terima kasih.`);

    window.open(`https://wa.me/${String(waNumber).replace(/[^0-9]/g, '')}?text=${text}`, '_blank');
  };

  return (
    <div className="pt-4 pb-28 flex flex-col items-center max-w-md mx-auto px-4">
      <div className="w-full flex justify-start mb-6">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-gray-400 hover:text-hw-green transition-colors text-sm font-bold cursor-pointer"
        >
          <ChevronLeft size={20} />
          Kembali
        </button>
      </div>

      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-20 h-20 bg-hw-green/10 rounded-3xl flex items-center justify-center mb-6"
      >
        <Lock className="text-hw-green" size={32} />
      </motion.div>
      
      <div className="text-center mb-6">
        <h2 className="text-2xl font-display font-bold text-gray-800">
          {showForgotModal ? 'Reset Password' : 'Login Anggota HW'}
        </h2>
        <p className="text-gray-500 text-sm px-4">
          {showForgotModal 
            ? 'Lengkapi data dibawah untuk mengajukan reset password via WhatsApp' 
            : 'Masuk untuk mengakses materi & fitur lengkap aplikasi'}
        </p>
      </div>

      {!showForgotModal ? (
        <form onSubmit={handleLogin} className="w-full space-y-4">
          <div className="border-b border-gray-100 pb-2.5 mb-2 text-center">
            <h3 className="text-base font-extrabold font-display text-gray-800 flex items-center justify-center gap-2">
              <Lock size={18} className="text-hw-green" />
              Login Anggota HW
            </h3>
            <p className="text-xs text-gray-500 font-medium">Masukkan email/username dan password Anda di bawah ini</p>
          </div>

          {error && (
            <div className="bg-red-50 text-red-500 text-xs p-3 rounded-xl border border-red-100 mb-4">
              {error}
            </div>
          )}
          
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-600 ml-1 uppercase tracking-wider">Username / Email</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@email.com"
                required
                className="w-full bg-white border border-gray-200 rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-hw-green/20 focus:border-hw-green outline-none transition-all text-sm"
              />
            </div>
          </div>

          <div className="space-y-1">
            <div className="ml-1 flex items-center justify-between">
              <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Password</label>
              <button 
                type="button"
                onClick={() => {
                  setShowForgotModal(true);
                  if (email) setResetEmail(email);
                }}
                className="text-xs font-bold text-hw-green hover:underline cursor-pointer"
              >
                Lupa Password?
              </button>
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full bg-white border border-gray-200 rounded-2xl py-4 pl-12 pr-12 focus:ring-2 focus:ring-hw-green/20 focus:border-hw-green outline-none transition-all text-sm"
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Card Cek Status Akun / Email */}
          <div className="w-full bg-gradient-to-br from-emerald-50/90 via-white to-emerald-50/50 border border-emerald-200/90 rounded-3xl p-4 my-3 shadow-sm">
            <div className="flex items-center gap-2 mb-1 text-emerald-900">
              <Search size={16} className="text-emerald-700" />
              <h3 className="text-xs font-extrabold font-display">Cek Status Akun / Email</h3>
            </div>
            <p className="text-[11px] text-gray-600 mb-2.5 leading-relaxed">
              Ketik email Anda untuk mendeteksi apakah akun Anggota HW sudah aktif di aplikasi.
            </p>

            <div className="flex gap-2">
              <div className="relative flex-1">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                <input
                  type="email"
                  value={checkEmailInput}
                  onChange={(e) => {
                    setCheckEmailInput(e.target.value);
                    if (checkResult) setCheckResult(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleCheckEmailStatus(e);
                    }
                  }}
                  placeholder="nama@email.com"
                  className="w-full bg-white border border-emerald-200 rounded-xl py-2.5 pl-8 pr-7 text-xs font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none transition-all"
                />
                {checkEmailInput && (
                  <button
                    type="button"
                    onClick={() => {
                      setCheckEmailInput('');
                      if (checkResult) setCheckResult(null);
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-emerald-700 transition-colors cursor-pointer"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={(e) => handleCheckEmailStatus(e)}
                disabled={isCheckingEmail}
                className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-3.5 py-2.5 rounded-xl shadow-sm transition-all flex items-center justify-center gap-1 shrink-0 cursor-pointer"
              >
                {isCheckingEmail ? <Loader2 size={14} className="animate-spin" /> : 'Cek Status'}
              </button>
            </div>

            {checkResult && checkResult.checked && (
              <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="mt-3">
                {checkResult.found ? (
                  <div className="bg-emerald-50 border border-emerald-200/90 rounded-2xl p-3.5 text-xs text-emerald-950 space-y-2">
                    <div className="flex items-center gap-2 font-extrabold text-emerald-900 text-xs">
                      <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                      <span>Akun Anggota HW Aktif!</span>
                    </div>
                    <p className="text-gray-700 text-[11px] leading-relaxed">
                      Akun atas nama <strong className="text-emerald-950 font-black">{checkResult.user?.namaLengkap || 'Anggota HW'}</strong> ({checkResult.emailSearched}) terdeteksi <span className="bg-emerald-200 text-emerald-900 px-1.5 py-0.5 rounded font-extrabold">SUDAH AKTIF</span>.
                    </p>
                    <div className="pt-2 border-t border-emerald-200/60 flex flex-col gap-1.5">
                      <p className="text-[10px] text-gray-600">
                        👉 Email telah otomatis diisikan di form login di atas. Silakan masukkan password Anda untuk masuk.
                      </p>
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            setShowForgotModal(true);
                            setResetEmail(checkResult.user?.email || checkResult.emailSearched || '');
                            setResetFullName(checkResult.user?.namaLengkap || '');
                          }}
                          className="text-[11px] font-bold text-emerald-800 hover:text-emerald-950 underline flex items-center gap-1 cursor-pointer"
                        >
                          Lupa Password? Hubungi Admin
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-amber-50 border border-amber-200/90 rounded-2xl p-3.5 text-xs text-amber-950 space-y-2">
                    <div className="flex items-center gap-2 font-extrabold text-amber-900 text-xs">
                      <XCircle size={16} className="text-amber-600 shrink-0" />
                      <span>Akun Belum Terdaftar / Belum Aktif</span>
                    </div>
                    <p className="text-gray-700 text-[11px] leading-relaxed">
                      Email <span className="font-bold text-amber-900">{checkResult.emailSearched}</span> belum terdeteksi aktif di sistem aplikasi HW.
                    </p>
                    <div className="pt-2 border-t border-amber-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <span className="text-[10px] text-amber-900 font-medium">Silakan lakukan pendaftaran akun baru:</span>
                      <Link
                        to={`/register?email=${encodeURIComponent(checkResult.emailSearched || '')}`}
                        className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-3 py-1.5 rounded-xl text-[11px] shadow-sm transition-all flex items-center justify-center gap-1 shrink-0"
                      >
                        Daftar Sekarang <UserPlus size={12} />
                      </Link>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </div>

          <button 
            type="submit"
            disabled={isLoading}
            className="w-full gradient-bg text-white font-bold py-4 rounded-2xl shadow-lg shadow-hw-green/20 hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {isLoading ? <Loader2 className="animate-spin" size={20} /> : 'Login'}
          </button>
        </form>
      ) : (
        <form onSubmit={handleWhatsAppReset} className="w-full space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-600 ml-1 uppercase tracking-wider">Nama Lengkap</label>
            <div className="relative">
              <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text"
                value={resetFullName}
                onChange={(e) => setResetFullName(e.target.value)}
                placeholder="Nama sesuai pendaftaran"
                required
                className="w-full bg-white border border-gray-200 rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-hw-green/20 focus:border-hw-green outline-none transition-all text-sm"
              />
            </div>
          </div>
          
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-600 ml-1 uppercase tracking-wider">Email Terdaftar</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                placeholder="nama@email.com"
                required
                className="w-full bg-white border border-gray-200 rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-hw-green/20 focus:border-hw-green outline-none transition-all text-sm"
              />
            </div>
          </div>

          <button 
            type="submit"
            className="w-full bg-hw-green text-white font-bold py-4 rounded-2xl shadow-lg shadow-hw-green/20 hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <MessageCircle size={20} /> Hubungi Admin via WhatsApp
          </button>

          <button 
            type="button"
            onClick={() => {
              setShowForgotModal(false);
              setError('');
            }}
            className="w-full text-gray-500 text-sm font-medium py-2 hover:text-hw-green transition-colors cursor-pointer"
          >
            Kembali ke Login
          </button>
        </form>
      )}

      <div className="mt-8 mb-6 text-center flex flex-col gap-3 pt-5 border-t border-gray-100 w-full">
        <p className="text-gray-600 text-sm font-medium">
          Belum punya akun?{' '}
          <Link to="/register" className="text-hw-green font-extrabold hover:underline">
            Daftar Sekarang
          </Link>
        </p>
        {!showForgotModal && (
          <button 
            type="button"
            onClick={() => setShowForgotModal(true)}
            className="text-xs font-bold text-hw-green hover:text-emerald-800 hover:underline uppercase tracking-wider cursor-pointer py-1.5 px-3 bg-emerald-50/60 hover:bg-emerald-50 rounded-xl border border-emerald-100 transition-all inline-block mx-auto"
          >
            Lupa Password / Hubungi Admin
          </button>
        )}
      </div>
    </div>
  );
}


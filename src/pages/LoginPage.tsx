import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import { 
  Lock, 
  Mail, 
  Eye, 
  EyeOff, 
  Loader2, 
  ChevronLeft, 
  MessageCircle, 
  Search, 
  CheckCircle2, 
  XCircle, 
  UserPlus,
  X,
  Phone,
  Key,
  HelpCircle,
  ArrowRight
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { sheetsService } from '../services/sheetsService';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Forgot password states
  const [resetEmail, setResetEmail] = useState('');
  const [resetPhone, setResetPhone] = useState('');
  const [waNumber, setWaNumber] = useState('6281234567890');
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [isCheckingForgot, setIsCheckingForgot] = useState(false);
  const [forgotResult, setForgotResult] = useState<{
    checked: boolean;
    success: boolean;
    userName?: string;
    password?: string;
    message?: string;
    user?: any;
  } | null>(null);
  
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

  const handleLoginDirect = async (loginEmail: string, loginPass: string) => {
    setIsLoading(true);
    setError('');
    
    try {
      const { user, token } = await sheetsService.login(loginEmail, loginPass);
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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleLoginDirect(email, password);
  };

  const handleCheckForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = resetEmail.trim().toLowerCase();
    const cleanPhoneInput = resetPhone.replace(/[^0-9]/g, '');

    if (!cleanEmail || !cleanPhoneInput) {
      setForgotResult({
        checked: true,
        success: false,
        message: 'Silakan isi Email dan Nomor HP/WhatsApp terdaftar secara lengkap.'
      });
      return;
    }

    setIsCheckingForgot(true);
    setForgotResult(null);

    try {
      const members = await sheetsService.getMembers();
      
      const found = members.find((m: any) => {
        const mEmail = (m.email || '').trim().toLowerCase();
        const mId = String(m.id || '').trim().toLowerCase();
        const mPhone = String(m.noHp || m.noWa || m.telepon || m.nohp || '').replace(/[^0-9]/g, '');

        const isEmailMatch = cleanEmail && (mEmail === cleanEmail || mId === cleanEmail);
        
        let isPhoneMatch = false;
        if (mPhone && cleanPhoneInput) {
          if (mPhone === cleanPhoneInput) {
            isPhoneMatch = true;
          } else {
            const normM = mPhone.replace(/^62/, '0');
            const normInput = cleanPhoneInput.replace(/^62/, '0');
            if (normM === normInput) {
              isPhoneMatch = true;
            } else if (normM.length >= 8 && normInput.length >= 8 && normM.slice(-8) === normInput.slice(-8)) {
              isPhoneMatch = true;
            }
          }
        }

        return isEmailMatch && isPhoneMatch;
      });

      if (found) {
        const roles = Array.isArray(found.roles) ? found.roles : (found.role ? [found.role] : ['umum']);
        const isAdmin = found.role === 'superadmin' || found.role === 'admin' || roles.includes('superadmin') || roles.includes('admin');
        
        const isMedkom = (found.email && found.email.toLowerCase() === 'medkom@hwjateng.com') || found.id === '1777209184010';
        let detectedPassword = found.password;
        if (isMedkom) {
          detectedPassword = (found.password && found.password !== 'adnimku' && found.password !== 'admin') ? found.password : '12345hwhw';
        } else {
          detectedPassword = (found.password && found.password !== 'adnimku' && found.password !== 'admin') ? found.password : '12345hw';
        }

        setForgotResult({
          checked: true,
          success: true,
          userName: found.namaLengkap || found.nama || 'Anggota HW',
          password: detectedPassword || '12345hw',
          user: found
        });
      } else {
        setForgotResult({
          checked: true,
          success: false,
          message: 'Email atau Nomor HP/WhatsApp tidak cocok atau belum terdaftar.'
        });
      }
    } catch (err) {
      console.error('Error checking forgot password:', err);
      setForgotResult({
        checked: true,
        success: false,
        message: 'Gagal memverifikasi data. Silakan hubungi Admin atau lakukan pendaftaran jika belum terdaftar.'
      });
    } finally {
      setIsCheckingForgot(false);
    }
  };

  const handleOpenWhatsAppAdmin = () => {
    const text = encodeURIComponent(`Assalamu'alaikum Admin Medkom HW Jateng,
Saya mengalami kendala saat lupa password / reset password akun saya:

Email: ${resetEmail || email || '-'}
No HP: ${resetPhone || '-'}

Mohon bantuan verifikasi akun saya. Terima kasih.`);

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
          {showForgotModal ? 'Lupa Password' : 'Login Anggota HW'}
        </h2>
        <p className="text-gray-500 text-sm px-4">
          {showForgotModal 
            ? 'Masukkan Email dan Nomor HP terdaftar untuk mengecek password Anda' 
            : 'Masukkan Email dan Password yang telah terdaftar dalam keanggotaan untuk masuk'}
        </p>
      </div>

      {!showForgotModal ? (
        <form onSubmit={handleLogin} className="w-full space-y-4">
          {error && (
            <div className="bg-red-50 text-red-600 text-xs p-3 rounded-xl border border-red-200 mb-4 font-medium">
              {error}
            </div>
          )}
          
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-600 ml-1 uppercase tracking-wider">Email Terdaftar / ID Anggota</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Masukkan email atau ID anggota..."
                required
                className="w-full bg-white border border-gray-200 rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-hw-green/20 focus:border-hw-green outline-none transition-all text-sm font-medium"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-600 ml-1 uppercase tracking-wider">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full bg-white border border-gray-200 rounded-2xl py-4 pl-12 pr-12 focus:ring-2 focus:ring-hw-green/20 focus:border-hw-green outline-none transition-all text-sm font-medium"
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer p-1"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button 
            type="submit"
            disabled={isLoading || !email.trim() || !password.trim()}
            className="w-full gradient-bg text-white font-bold py-4 rounded-2xl shadow-lg shadow-hw-green/20 hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? <Loader2 className="animate-spin" size={20} /> : 'Masuk Sekarang'}
          </button>

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
                        👉 Email telah otomatis diisikan di form login di atas. Klik tombol <strong>"Masuk Sekarang"</strong> di atas untuk login.
                      </p>
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            setShowForgotModal(true);
                            setResetEmail(checkResult.user?.email || checkResult.emailSearched || '');
                            if (checkResult.user?.noHp) setResetPhone(checkResult.user.noHp);
                            setForgotResult(null);
                          }}
                          className="text-[11px] font-bold text-emerald-800 hover:text-emerald-950 underline flex items-center gap-1 cursor-pointer"
                        >
                          Lupa Password? Cek Di Sini
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
        </form>
      ) : (
        <div className="w-full space-y-4">
          {!forgotResult ? (
            <form onSubmit={handleCheckForgot} className="space-y-4">
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

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-600 ml-1 uppercase tracking-wider">Nomor HP / WhatsApp Terdaftar</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input 
                    type="tel"
                    value={resetPhone}
                    onChange={(e) => setResetPhone(e.target.value)}
                    placeholder="081234567890"
                    required
                    className="w-full bg-white border border-gray-200 rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-hw-green/20 focus:border-hw-green outline-none transition-all text-sm"
                  />
                </div>
              </div>

              <button 
                type="submit"
                disabled={isCheckingForgot}
                className="w-full gradient-bg text-white font-bold py-4 rounded-2xl shadow-lg shadow-hw-green/20 hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {isCheckingForgot ? <Loader2 className="animate-spin" size={20} /> : <><Key size={18} /> Cek Password Akun</>}
              </button>
            </form>
          ) : (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-4">
              {forgotResult.success ? (
                <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-5 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-100 text-emerald-700 rounded-2xl flex items-center justify-center shrink-0">
                      <CheckCircle2 size={24} />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-emerald-950">Password Ditemukan!</h3>
                      <p className="text-xs text-emerald-800">Assalamu'alaikum <strong>{forgotResult.userName}</strong></p>
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-2xl border border-emerald-200/80 text-center space-y-1 shadow-xs">
                    <p className="text-xs text-gray-600 font-medium">Password Akun Anda adalah:</p>
                    <div className="text-2xl font-mono font-black text-emerald-800 tracking-wider my-1 bg-emerald-50 py-2.5 px-4 rounded-xl border border-emerald-200 inline-block select-all">
                      {forgotResult.password || '12345hw'}
                    </div>
                    <p className="text-[11px] text-gray-500">Gunakan password di atas untuk login ke aplikasi HW.</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const targetEmail = forgotResult.user?.email || forgotResult.user?.id || resetEmail || email;
                      const targetPass = forgotResult.password || '12345hw';
                      setEmail(targetEmail);
                      setPassword(targetPass);
                      setShowForgotModal(false);
                      setForgotResult(null);
                      handleLoginDirect(targetEmail, targetPass);
                    }}
                    className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-3.5 rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer text-xs"
                  >
                    <span>Masuk Menggunakan Password Ini</span> <ArrowRight size={16} />
                  </button>
                </div>
              ) : (
                <div className="bg-amber-50 border border-amber-200 rounded-3xl p-5 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-amber-100 text-amber-700 rounded-2xl flex items-center justify-center shrink-0">
                      <XCircle size={24} />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-amber-950">Data Tidak Cocok / Belum Terdaftar</h3>
                      <p className="text-xs text-amber-800">Email dan Nomor HP/WhatsApp tidak terdeteksi cocok.</p>
                    </div>
                  </div>

                  <p className="text-xs text-gray-700 leading-relaxed bg-white p-3.5 rounded-2xl border border-amber-200/80 font-medium">
                    {forgotResult.message || 'Silakan hubungi Admin atau lakukan pendaftaran jika belum terdaftar.'}
                  </p>

                  <div className="flex flex-col gap-2 pt-1">
                    <Link
                      to="/register"
                      onClick={() => {
                        setShowForgotModal(false);
                        setForgotResult(null);
                      }}
                      className="w-full bg-hw-green hover:bg-hw-green/90 text-white font-bold py-3 rounded-2xl shadow-sm transition-all text-xs text-center flex items-center justify-center gap-2"
                    >
                      <UserPlus size={16} /> Daftar Akun Baru
                    </Link>
                    <button
                      type="button"
                      onClick={handleOpenWhatsAppAdmin}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-2xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer text-xs"
                    >
                      <MessageCircle size={16} /> Hubungi Admin via WhatsApp
                    </button>
                    <button
                      type="button"
                      onClick={() => setForgotResult(null)}
                      className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2.5 rounded-2xl transition-all text-xs cursor-pointer"
                    >
                      Coba Lagi
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* Button Bantuan Admin WhatsApp */}
          <div className="pt-3 border-t border-gray-100 space-y-2">
            <p className="text-xs text-gray-500 text-center">Jika ada kendala lain, hubungi Admin:</p>
            <button 
              type="button"
              onClick={handleOpenWhatsAppAdmin}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer text-xs"
            >
              <MessageCircle size={18} /> Chat Admin via WhatsApp
            </button>

            <button 
              type="button"
              onClick={() => {
                setShowForgotModal(false);
                setForgotResult(null);
                setError('');
              }}
              className="w-full text-gray-500 text-xs font-bold py-2 hover:text-hw-green transition-colors cursor-pointer text-center block"
            >
              Kembali ke Form Login
            </button>
          </div>
        </div>
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


import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Lock, Mail, Eye, EyeOff, Loader2, ShieldCheck, ChevronLeft, MessageCircle } from 'lucide-react';
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
  const [isResetting, setIsResetting] = useState(false);
  const [waNumber, setWaNumber] = useState('6281234567890');
  const [showForgotModal, setShowForgotModal] = useState(false);
  
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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      const { user, token } = await sheetsService.login(email, password);
      setAuth(user, token);
      if (user.role === 'superadmin' || user.role === 'admin') {
        navigate('/admin');
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
    <div className="pt-4 flex flex-col items-center">
      <div className="w-full flex justify-start mb-6">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-gray-400 hover:text-hw-green transition-colors text-sm font-bold"
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
      
      <div className="text-center mb-10">
        <h2 className="text-2xl font-display font-bold text-gray-800">
          {showForgotModal ? 'Reset Password' : 'Selamat Datang'}
        </h2>
        <p className="text-gray-500 text-sm px-4">
          {showForgotModal 
            ? 'Lengkapi data dibawah untuk mengajukan reset password via WhatsApp' 
            : 'Masuk untuk mengakses materi lengkap'}
        </p>
      </div>

      {showForgotModal ? (
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
            className="w-full bg-hw-green text-white font-bold py-4 rounded-2xl shadow-lg shadow-hw-green/20 hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <MessageCircle size={20} /> Ajukan via WhatsApp
          </button>

          <button 
            type="button"
            onClick={() => {
              setShowForgotModal(false);
              setError('');
            }}
            className="w-full text-gray-500 text-sm font-medium py-2 hover:text-hw-green transition-colors"
          >
            Kembali ke Login
          </button>
        </form>
      ) : (
        <form onSubmit={handleLogin} className="w-full space-y-4">
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
            <div className="ml-1">
              <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Password</label>
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
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button 
            type="submit"
            disabled={isLoading}
            className="w-full gradient-bg text-white font-bold py-4 rounded-2xl shadow-lg shadow-hw-green/20 hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            {isLoading ? <Loader2 className="animate-spin" size={20} /> : 'Login'}
          </button>
        </form>
      )}

      <div className="mt-10 text-center flex flex-col gap-3">
        <p className="text-gray-500 text-sm">
          Belum punya akun?{' '}
          <Link to="/register" className="text-hw-green font-bold hover:underline">
            Daftar Sekarang
          </Link>
        </p>
        {!showForgotModal && (
          <button 
            type="button"
            onClick={() => setShowForgotModal(true)}
            className="text-xs font-bold text-hw-green hover:underline uppercase tracking-wider"
          >
            Lupa Password?
          </button>
        )}
      </div>
    </div>
  );
}

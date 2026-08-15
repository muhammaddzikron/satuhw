/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { HashRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Home as HomeIcon, 
  User as UserIcon, 
  LogIn, 
  UserPlus, 
  LogOut, 
  Lock, 
  ChevronRight,
  Menu as MenuIcon,
  X,
  Bell,
  BookOpen,
  LayoutDashboard,
  Layout,
  Shield,
  ShieldCheck,
  GraduationCap,
  CreditCard,
  Calendar
} from 'lucide-react';
import { useAuthStore } from './store/useAuthStore';
import { cn } from './lib/utils';
import React, { useState, useEffect } from 'react';
import { sheetsService } from './services/sheetsService';

import { ErrorBoundary } from './components/ErrorBoundary';

// Pages (to be created)
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProfilePage from './pages/ProfilePage';
import MateriPage from './pages/MateriPage';
import QuranPage from './pages/QuranPage';
import ToolsPage from './pages/ToolsPage';
import ContactPage from './pages/ContactPage';
import AdminDashboard from './pages/AdminDashboard';
import DoaPage from './pages/DoaPage';
import GalleryPage from './pages/GalleryPage';
import SosmedPage from './pages/SosmedPage';
import UpgradePage from './pages/UpgradePage';
import AboutPage from './pages/AboutPage';
import PlaylistPage from './pages/PlaylistPage';
import KTAPage from './pages/KTAPage';
import DaftarPelatihanPage from './pages/DaftarPelatihanPage';
import PelatihanPage from './pages/PelatihanPage';
import KegiatanPage from './pages/KegiatanPage';
import PelatihNasionalPage from './pages/PelatihNasionalPage';

const Header = () => {
  const location = useLocation();
  const isFullWidth = location.pathname === '/admin';

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-100 px-4 py-3 shadow-xs">
      <div className={cn("mx-auto flex items-center justify-between", isFullWidth ? "max-w-7xl" : "max-w-md")}>
        <Link to="/" className="flex items-center gap-3 group">
          <img 
            src="https://upload.wikimedia.org/wikipedia/id/b/ba/Logo_Hizbul_Wathan.png" 
            alt="Logo HW" 
            className="h-10 w-auto group-hover:scale-105 transition-transform"
          />
          <div>
            <h1 className="text-lg font-display font-bold text-hw-dark leading-tight">SATU HW JATENG</h1>
            <p className="text-[10px] text-gray-500 font-medium tracking-wider uppercase">Hizbul Wathan Super Apps</p>
          </div>
        </Link>
        <div className="flex items-center gap-2">
          <button className="p-2 text-gray-400 hover:text-hw-green transition-colors cursor-pointer" title="Notifikasi">
            <Bell size={20} />
          </button>
        </div>
      </div>
    </header>
  );
};

const NavigationLink = ({ to, icon: Icon, label, active }: { to: string, icon: any, label: string, active?: boolean }) => (
  <Link 
    to={to} 
    className={cn(
      "flex flex-col items-center justify-center gap-1 py-1 px-2.5 transition-all duration-300 relative rounded-xl",
      active ? "text-white font-extrabold scale-105" : "text-emerald-100 hover:text-white font-medium opacity-80 hover:opacity-100"
    )}
  >
    <Icon size={20} strokeWidth={active ? 2.5 : 2} />
    <span className="text-[10px] tracking-tight">{label}</span>
    {active && (
      <motion.div 
        layoutId="nav-active"
        className="w-1.5 h-1.5 rounded-full bg-amber-300 mt-0.5 shadow-sm"
      />
    )}
  </Link>
);

const Navigation = () => {
  const { isAuthenticated, user, logout, activeRole } = useAuthStore();
  const location = useLocation();
  
  const canAccessAdmin = () => {
    if (!user) return false;
    const adminRoles = [
      'admin', 'superadmin', 'sugli', 'kwarda', 'admin_diklat', 'diklat',
      'jari1', 'jari2', 'jaya_matahari_1', 'jaya_matahari_2', 'pelatih', 'pelatih_nasional',
      'jati1', 'jati2', 'jaya_melati_1', 'jaya_melati_2', 'asisten_pelatih',
      'jaya matahari 1', 'jaya matahari 2', 'jaya melati 1', 'jaya melati 2',
      'pelatih kegiatan', 'asisten pelatih'
    ];

    const userRolesList = [
      ...(Array.isArray(user.roles) ? user.roles : []),
      user.role,
      ...(Array.isArray(user.pelatihan) ? user.pelatihan : [user.pelatihan]),
      (user as any).golonganPelatih,
      (user as any).tingkatan
    ].filter(Boolean).map(r => String(r).toLowerCase().trim());

    if (userRolesList.some(r => adminRoles.some(ar => r.includes(ar) || ar.includes(r)) || r.includes('matahari') || r.includes('melati 2') || r.includes('jati 2') || r.includes('jari'))) return true;
    if ((user as any).adminType === 'diklat') return true;

    try {
      let acts: any[] = [];
      const rawSettings = localStorage.getItem('hw_settings');
      if (rawSettings) {
        const settings = JSON.parse(rawSettings);
        if (Array.isArray(settings?.trainingActivities)) acts = [...acts, ...settings.trainingActivities];
      }
      if (typeof window !== 'undefined' && (window as any)?.hw_settings?.trainingActivities) {
        if (Array.isArray((window as any).hw_settings.trainingActivities)) {
          acts = [...acts, ...(window as any).hw_settings.trainingActivities];
        }
      }

      const userEmail = (user.email || '').toLowerCase().trim();
      const userName = (user.namaLengkap || user.nama || (user as any)?.name || '').toLowerCase().trim();
      const userNbm = ((user as any)?.nbm || (user as any)?.noNbm || (user as any)?.ktaNumber || (user as any)?.nomorKTA || '').toLowerCase().trim();

      return acts.some((act: any) => {
        if (!act) return false;
        const parseList = (val: any) => {
          if (Array.isArray(val)) return val;
          if (typeof val === 'string' && val.trim()) return val.split(/[,;]/).map((s: string) => s.trim());
          return [];
        };
        const pelatihList = parseList(act.pelatih);
        const asistenList = parseList(act.asistenPelatih);
        const allTrainers = [...pelatihList, ...asistenList].map((s: string) => String(s).toLowerCase().trim());

        return allTrainers.some(t => {
          if (!t) return false;
          if (userName && (t.includes(userName) || userName.includes(t))) return true;
          if (userNbm && userNbm.length >= 4 && t.includes(userNbm)) return true;
          if (userEmail && userEmail.length >= 4) {
            const prefix = userEmail.split('@')[0];
            if (prefix && prefix.length >= 3 && t.includes(prefix)) return true;
          }
          const nameWords = userName.split(/\s+/).filter(w => w.length >= 3);
          if (nameWords.length > 0) {
            const matchingWords = nameWords.filter(w => t.includes(w) || w.includes(t));
            if (nameWords.length >= 2 && matchingWords.length >= 2) return true;
            if (nameWords.length === 1 && matchingWords.length === 1 && nameWords[0].length >= 4) return true;
          }
          return false;
        });
      });
    } catch (e) {}

    return false;
  };

  const isDiklatAdmin = Boolean(
    user && ((user as any).adminType === 'diklat' || user.email === 'diklat' || user.email === 'diklat@hwjateng.com' || user.role === 'admin_diklat' || user.role === 'diklat')
  );

  const isMemberView = !canAccessAdmin() || activeRole === 'umum';

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 bg-gradient-to-r from-hw-green via-emerald-600 to-hw-blue border-t border-white/20 shadow-2xl safe-bottom pointer-events-auto">
      <div className="max-w-md mx-auto flex items-center justify-around py-2 px-2">
        {isAuthenticated && !isMemberView ? (
          /* Admin/Staff view */
          isDiklatAdmin ? (
            <>
              <NavigationLink 
                to="/" 
                icon={HomeIcon} 
                label="Home" 
                active={location.pathname === '/'} 
              />
              <NavigationLink 
                to="/admin?tab=pelatihan" 
                icon={GraduationCap} 
                label="Pelatihan" 
                active={location.pathname === '/admin'} 
              />
              <button 
                onClick={logout}
                className="flex flex-col items-center justify-center gap-1 py-1 px-3 text-rose-200 hover:text-white transition-colors cursor-pointer"
              >
                <LogOut size={20} />
                <span className="text-[10px] font-medium transition-all duration-300">Logout</span>
              </button>
            </>
          ) : (
            <>
              <NavigationLink 
                to="/" 
                icon={HomeIcon} 
                label="Home" 
                active={location.pathname === '/'} 
              />
              <NavigationLink 
                to="/admin?tab=anggota" 
                icon={LayoutDashboard} 
                label="Dasbor" 
                active={location.pathname === '/admin' && (new URLSearchParams(location.search).get('tab') === 'anggota' || !new URLSearchParams(location.search).get('tab'))} 
              />
              <NavigationLink 
                to="/admin?tab=kta" 
                icon={CreditCard} 
                label="KTA" 
                active={location.pathname === '/admin' && new URLSearchParams(location.search).get('tab') === 'kta'} 
              />
              <NavigationLink 
                to="/admin?tab=pelatihan" 
                icon={GraduationCap} 
                label="Pelatihan" 
                active={location.pathname === '/admin' && new URLSearchParams(location.search).get('tab') === 'pelatihan'} 
              />
              <NavigationLink 
                to="/admin?tab=kegiatan" 
                icon={Calendar} 
                label="Kegiatan" 
                active={location.pathname === '/admin' && new URLSearchParams(location.search).get('tab') === 'kegiatan'} 
              />
              <NavigationLink 
                to="/admin?tab=materi" 
                icon={BookOpen} 
                label="Materi" 
                active={location.pathname === '/admin' && new URLSearchParams(location.search).get('tab') === 'materi'} 
              />
              <button 
                onClick={logout}
                className="flex flex-col items-center justify-center gap-1 py-1 px-1 text-rose-200 hover:text-white transition-colors"
              >
                <LogOut size={20} />
                <span className="text-[10px] font-medium transition-all duration-300">Logout</span>
              </button>
            </>
          )
        ) : (
          /* Standard view (Unauthenticated or Member/Participant) */
          <>
            <NavigationLink 
              to="/" 
              icon={HomeIcon} 
              label="Home" 
              active={location.pathname === '/'} 
            />

            {isAuthenticated ? (
              /* Member/Participant view */
              <>
                <NavigationLink 
                  to="/kta" 
                  icon={CreditCard} 
                  label="KTA" 
                  active={location.pathname === '/kta'} 
                />
                <NavigationLink 
                  to="/pelatihan" 
                  icon={GraduationCap} 
                  label="Pelatihan" 
                  active={location.pathname === '/pelatihan'} 
                />
                <NavigationLink 
                  to="/materi" 
                  icon={BookOpen} 
                  label="Materi" 
                  active={location.pathname === '/materi'} 
                />
                <button 
                  onClick={logout}
                  className="flex flex-col items-center justify-center gap-1 py-1 px-2.5 text-rose-200 hover:text-white transition-colors"
                >
                  <LogOut size={20} />
                  <span className="text-[10px] font-medium transition-all duration-300">Logout</span>
                </button>
              </>
            ) : (
              /* Guest/Unauthenticated view */
              <>
                <NavigationLink 
                  to="/login" 
                  icon={LogIn} 
                  label="Masuk" 
                  active={location.pathname === '/login'} 
                />
                <NavigationLink 
                  to="/register" 
                  icon={UserPlus} 
                  label="Daftar" 
                  active={location.pathname === '/register'} 
                />
              </>
            )}
          </>
        )}
      </div>
    </nav>
  );
};

const PageTransition = ({ children, fullWidth }: { children: React.ReactNode, fullWidth?: boolean }) => (
  <div className={cn("pb-32 sm:pb-36 pt-4 px-4 mx-auto w-full", fullWidth ? "max-w-7xl" : "max-w-md")}>
    {children}
  </div>
);

const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location}>
        <Route path="/" element={<PageTransition><HomePage /></PageTransition>} />
        <Route path="/login" element={<PageTransition><LoginPage /></PageTransition>} />
        <Route path="/register" element={<PageTransition><RegisterPage /></PageTransition>} />
        <Route path="/profile" element={<PageTransition><ProfilePage /></PageTransition>} />
        <Route path="/about" element={<PageTransition><AboutPage /></PageTransition>} />
        <Route path="/materi" element={<PageTransition><MateriPage /></PageTransition>} />
        <Route path="/quran" element={<PageTransition><QuranPage /></PageTransition>} />
        <Route path="/tools" element={<PageTransition><ToolsPage /></PageTransition>} />
        <Route path="/contact" element={<PageTransition><ContactPage /></PageTransition>} />
        <Route path="/doa" element={<PageTransition><DoaPage /></PageTransition>} />
        <Route path="/gallery" element={<PageTransition><GalleryPage /></PageTransition>} />
        <Route path="/sosmed" element={<PageTransition><SosmedPage /></PageTransition>} />
        <Route path="/upgrade" element={<PageTransition><UpgradePage /></PageTransition>} />
        <Route path="/playlist" element={<PageTransition><PlaylistPage /></PageTransition>} />
        <Route path="/kta" element={<PageTransition><KTAPage /></PageTransition>} />
        <Route path="/daftar-pelatihan" element={<PageTransition><DaftarPelatihanPage /></PageTransition>} />
        <Route path="/pelatihan" element={<PageTransition><PelatihanPage /></PageTransition>} />
        <Route path="/kegiatan" element={<PageTransition><KegiatanPage /></PageTransition>} />
        <Route path="/pelatih-nasional" element={<PageTransition><PelatihNasionalPage /></PageTransition>} />
        <Route path="/admin" element={<PageTransition fullWidth><AdminDashboard /></PageTransition>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  );
};

export default function App() {
  const { isAuthenticated, user, updateUser } = useAuthStore();

  useEffect(() => {
    // Check API status for debugging in browser console
    const isApiActive = !sheetsService.isMock();
    console.log(`[MATERI HW] API Status: ${isApiActive ? 'ACTIVE (VITE_GSHEET_API_URL detected)' : 'MOCK MODE (VITE_GSHEET_API_URL missing or invalid)'}`);
    
    // Log helpful diagnostic info
    if (isApiActive) {
      console.log(`[MATERI HW] Endpoint: ${import.meta.env.VITE_GSHEET_API_URL}`);
    } else {
      console.log('[MATERI HW] Instructions: Please set VITE_GSHEET_API_URL in Settings > Environment Variables.');
      console.log('[MATERI HW] Also ensure the variable is prefixed with "VITE_" so the frontend can read it.');
    }
  }, []);

  // Real-time synchronization of current logged-in user profile from Firestore
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      const unsub = sheetsService.subscribeToMember(user.id, (freshUser) => {
        if (freshUser) {
          const currentUser = useAuthStore.getState().user;
          if (currentUser) {
            // Check if any profile property has changed
            const isChanged = 
              freshUser.namaLengkap !== currentUser.namaLengkap ||
              freshUser.photo !== currentUser.photo ||
              freshUser.noHp !== currentUser.noHp ||
              freshUser.alamat !== currentUser.alamat ||
              freshUser.qabilah !== currentUser.qabilah ||
              freshUser.asalKwarda !== currentUser.asalKwarda ||
              freshUser.role !== currentUser.role ||
              freshUser.isVerified !== currentUser.isVerified ||
              freshUser.statusAktivasi !== currentUser.statusAktivasi ||
              freshUser.statusPembayaran !== currentUser.statusPembayaran ||
              freshUser.tempatLahir !== currentUser.tempatLahir ||
              freshUser.tanggalLahir !== currentUser.tanggalLahir ||
              freshUser.ktaNumber !== currentUser.ktaNumber ||
              JSON.stringify(freshUser.roles) !== JSON.stringify(currentUser.roles) ||
              JSON.stringify(freshUser.upgradeRequests) !== JSON.stringify(currentUser.upgradeRequests);

            if (isChanged) {
              updateUser({
                ...currentUser,
                ...freshUser,
                namaLengkap: freshUser.namaLengkap || currentUser.namaLengkap,
                photo: freshUser.photo || currentUser.photo || '',
                statusAktivasi: freshUser.statusAktivasi || currentUser.statusAktivasi || 'Belum Aktif',
                statusPembayaran: freshUser.statusPembayaran || currentUser.statusPembayaran || 'Belum Bayar',
                tempatLahir: freshUser.tempatLahir || currentUser.tempatLahir || '',
                tanggalLahir: freshUser.tanggalLahir || currentUser.tanggalLahir || ''
              });
            }
          }
        }
      });
      return () => unsub();
    }
  }, [isAuthenticated, user?.id]);

  return (
    <Router>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header />
        <main className="flex-1 overflow-x-hidden">
          <ErrorBoundary>
            <AnimatedRoutes />
          </ErrorBoundary>
        </main>
        <Navigation />
      </div>
    </Router>
  );
}


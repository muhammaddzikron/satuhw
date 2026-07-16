/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
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
  GraduationCap
} from 'lucide-react';
import { useAuthStore } from './store/useAuthStore';
import { cn } from './lib/utils';
import React, { useState, useEffect } from 'react';
import { sheetsService } from './services/sheetsService';

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

const Header = () => {
  const { user, activeRole, setActiveRole } = useAuthStore();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const ROLE_DISPLAY: Record<string, string> = {
    umum: 'Anggota Umum',
    kwarda: 'Admin Kwarda',
    sugli: 'Dewan Sugli',
    jati1: 'Jaya Melati 1',
    jati2: 'Jaya Melati 2',
    jari1: 'Jaya Matahari 1',
    admin: 'Admin Petugas',
    superadmin: 'Super Admin'
  };
  
  return (
    <>
      {/* Role Switcher - Sticky at top for users with multiple roles */}
      {user && user.roles && user.roles.length > 1 && (
        <motion.div 
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="sticky top-0 z-[60] bg-hw-blue text-white shadow-xl overflow-hidden"
        >
          <div className="max-w-md mx-auto px-4 py-3 flex items-center gap-3">
            <div className="shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-white/20">
              <ShieldCheck size={18} className="text-hw-green" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/60 mb-0.5">Pilih Akses Materi</p>
              <div className="relative">
                <select 
                  value={activeRole || 'umum'}
                  onChange={(e) => setActiveRole(e.target.value as any)}
                  className="w-full bg-transparent border-none p-0 text-sm font-bold uppercase tracking-wide outline-none focus:ring-0 appearance-none cursor-pointer"
                >
                  {(Array.isArray(user.roles) ? user.roles : []).map(r => (
                    <option key={r} value={r} className="text-gray-800 py-2">
                      {ROLE_DISPLAY[r] || r}
                    </option>
                  ))}
                </select>
                <div className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none opacity-50">
                  <ChevronRight size={14} className="rotate-90" />
                </div>
              </div>
            </div>
          </div>
          <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-hw-green/50 to-transparent opacity-30" />
        </motion.div>
      )}

      <AnimatePresence>
        {isScrolled && (
          <motion.header 
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            transition={{ type: 'spring', damping: 20, stiffness: 100 }}
            className="fixed top-0 left-0 right-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-100 px-4 py-3"
            style={{ 
              top: user && user.roles && user.roles.length > 1 ? '56px' : '0' 
            }}
          >
            <div className="max-w-md mx-auto flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img 
                  src="https://upload.wikimedia.org/wikipedia/id/b/ba/Logo_Hizbul_Wathan.png" 
                  alt="Logo HW" 
                  className="h-10 w-auto"
                />
                <div>
                  <h1 className="text-lg font-display font-bold text-hw-dark leading-tight">SATU HW</h1>
                  <p className="text-[10px] text-gray-500 font-medium tracking-wider uppercase">Hizbul Wathan Super Apps</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="p-2 text-gray-400 hover:text-hw-green transition-colors">
                  <Bell size={20} />
                </button>
              </div>
            </div>
          </motion.header>
        )}
      </AnimatePresence>

    </>
  );
};

const NavigationLink = ({ to, icon: Icon, label, active }: { to: string, icon: any, label: string, active?: boolean }) => (
  <Link 
    to={to} 
    className={cn(
      "flex flex-col items-center justify-center gap-1 py-1 px-3 transition-all duration-300",
      active ? "text-hw-green" : "text-gray-400 hover:text-gray-600"
    )}
  >
    <Icon size={22} strokeWidth={active ? 2.5 : 2} />
    <span className="text-[10px] font-medium">{label}</span>
    {active && (
      <motion.div 
        layoutId="nav-active"
        className="w-1 h-1 rounded-full bg-hw-green mt-0.5"
      />
    )}
  </Link>
);

const Navigation = () => {
  const { isAuthenticated, user, logout } = useAuthStore();
  const location = useLocation();
  
  const canAccessAdmin = () => {
    if (!user) return false;
    const adminRoles = ['admin', 'superadmin', 'sugli', 'kwarda'];
    if (adminRoles.includes(user.role)) return true;
    if (user.roles?.some(r => adminRoles.includes(r))) return true;
    return false;
  };

  // Navigation should be shown on all pages as per user request
  // const isNoNavPage = location.pathname === '/login' || location.pathname === '/register';
  // if (isNoNavPage) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100 safe-bottom">
      <div className="max-w-md mx-auto flex items-center justify-around py-2 px-2">
        <NavigationLink 
          to="/" 
          icon={HomeIcon} 
          label="Home" 
          active={location.pathname === '/'} 
        />

        {isAuthenticated && (
          <NavigationLink 
            to="/pelatihan" 
            icon={GraduationCap} 
            label="Pelatihan" 
            active={location.pathname === '/pelatihan'} 
          />
        )}
        
        {isAuthenticated && canAccessAdmin() && (
          <NavigationLink 
            to="/admin?tab=anggota" 
            icon={LayoutDashboard} 
            label="Dasbor" 
            active={location.pathname === '/admin' && (new URLSearchParams(location.search).get('tab') === 'anggota' || !new URLSearchParams(location.search).get('tab'))} 
          />
        )}
        
        {isAuthenticated ? (
          <>
            {canAccessAdmin() ? (
              <>
                <NavigationLink 
                  to="/admin?tab=materi" 
                  icon={BookOpen} 
                  label="Materi" 
                  active={location.pathname === '/admin' && new URLSearchParams(location.search).get('tab') === 'materi'} 
                />
                <NavigationLink 
                  to="/admin?tab=konten" 
                  icon={Layout} 
                  label="Konten" 
                  active={location.pathname === '/admin' && new URLSearchParams(location.search).get('tab') === 'konten'} 
                />
              </>
            ) : (
              <NavigationLink 
                to="/profile" 
                icon={UserIcon} 
                label="Data Pribadi" 
                active={location.pathname === '/profile'} 
              />
            )}
            <button 
              onClick={logout}
              className="flex flex-col items-center justify-center gap-1 py-1 px-3 text-red-500"
            >
              <LogOut size={22} />
              <span className="text-[10px] font-medium transition-all duration-300">Logout</span>
            </button>
          </>
        ) : (
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
      </div>
    </nav>
  );
};

const PageTransition = ({ children, fullWidth }: { children: React.ReactNode, fullWidth?: boolean }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -10 }}
    transition={{ duration: 0.3 }}
    className={cn("pb-24 pt-4 px-4 mx-auto", fullWidth ? "max-w-7xl" : "max-w-md")}
  >
    {children}
  </motion.div>
);

export default function App() {
  const { isAuthenticated } = useAuthStore();

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

  return (
    <Router>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header />
        <main className="flex-1 overflow-x-hidden">
          <AnimatePresence mode="wait">
            <Routes>
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
              <Route path="/admin" element={<PageTransition fullWidth><AdminDashboard /></PageTransition>} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </AnimatePresence>
        </main>
        <Navigation />
      </div>
    </Router>
  );
}


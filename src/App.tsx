/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { 
  Home as HomeIcon, 
  User as UserIcon, 
  LogIn, 
  UserPlus, 
  LogOut, 
  Bell, 
  BookOpen, 
  LayoutDashboard, 
  GraduationCap, 
  CreditCard, 
  Calendar,
  Building2
} from 'lucide-react';
import { useAuthStore } from './store/useAuthStore';
import { cn } from './lib/utils';
import { sheetsService } from './services/sheetsService';
import { ErrorBoundary } from './components/ErrorBoundary';
import { NotificationBell } from './components/NotificationBell';

// Page components
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
import KwardaPtmaPage from './pages/KwardaPtmaPage';

const Header = React.memo(() => {
  const location = useLocation();
  const { isAuthenticated } = useAuthStore();
  const isFullWidth = location.pathname === '/admin' || location.pathname === '/kwarda-ptma';

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-100 px-4 py-2.5 shadow-xs isolate">
      <div className={cn("mx-auto flex items-center justify-between", isFullWidth ? "max-w-7xl" : "max-w-md")}>
        <Link to="/" className="flex items-center gap-3 group cursor-pointer touch-manipulation">
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
          <NotificationBell />
        </div>
      </div>
    </header>
  );
});

const NavigationLink = React.memo(({ to, icon: Icon, label, active }: { to: string, icon: any, label: string, active?: boolean }) => (
  <Link 
    to={to} 
    className={cn(
      "flex flex-col items-center justify-center gap-1 py-1 px-2.5 transition-all duration-100 relative rounded-xl touch-manipulation cursor-pointer select-none",
      active ? "text-white font-extrabold scale-105" : "text-emerald-100 hover:text-white font-medium opacity-85 hover:opacity-100 active:scale-95"
    )}
  >
    <Icon size={20} strokeWidth={active ? 2.5 : 2} />
    <span className="text-[10px] tracking-tight">{label}</span>
    {active && (
      <span className="w-1.5 h-1.5 rounded-full bg-amber-300 mt-0.5 shadow-xs block" />
    )}
  </Link>
));

const Navigation = () => {
  const { isAuthenticated, user, logout, activeRole } = useAuthStore();
  const location = useLocation();
  
  const canAccessAdmin = React.useMemo(() => {
    if (!user) return false;
    const isRealAdmin = 
      user.role === 'admin' || 
      user.role === 'superadmin' || 
      user.role === 'sugli' || 
      user.role === 'kwarda' || 
      user.role === 'admin_diklat' || 
      user.role === 'diklat' || 
      (user as any).adminType === 'diklat' ||
      user.email === 'diklat' ||
      user.email === 'diklat@hwjateng.com';

    if (isRealAdmin) return true;

    const userRolesList = [
      ...(Array.isArray(user.roles) ? user.roles : []),
      user.role,
      ...(Array.isArray(user.pelatihan) ? user.pelatihan : [user.pelatihan]),
      (user as any).golonganPelatih,
      (user as any).tingkatan
    ].filter(Boolean).map(r => String(r).toLowerCase().trim());

    const jayaMatahariIdentifiers = [
      'jari1', 'jari2', 'jari 1', 'jari 2',
      'jaya_matahari_1', 'jaya_matahari_2', 'jaya matahari 1', 'jaya matahari 2', 'jaya matahari',
      'pelatih', 'pelatih_nasional', 'pelatih nasional'
    ];

    const isJayaMatahariRole = userRolesList.some(r => 
      jayaMatahariIdentifiers.some(tr => r.includes(tr) || tr.includes(r)) ||
      r.includes('matahari') || r.includes('jari')
    );

    if (!isJayaMatahariRole) return false;

    // Check if user is assigned as trainer or assistant in any activity
    let cachedActsList: any[] = [];
    try {
      const rawLs = localStorage.getItem('hw_settings');
      if (rawLs) {
        const parsedLs = JSON.parse(rawLs);
        if (Array.isArray(parsedLs?.trainingActivities)) {
          cachedActsList = parsedLs.trainingActivities;
        }
      }
    } catch (e) {}

    const rawActsList = [
      ...cachedActsList,
      ...(Array.isArray((window as any)?.hw_settings?.trainingActivities) ? (window as any).hw_settings.trainingActivities : [])
    ];

    const userEmailStr = (user?.email || '').toLowerCase().trim();
    const userNameStr = (user?.namaLengkap || user?.nama || (user as any)?.name || '').toLowerCase().trim();
    const userNbmStr = ((user as any)?.nbm || (user as any)?.noNbm || (user as any)?.ktaNumber || (user as any)?.nomorKTA || '').toLowerCase().trim();

    return rawActsList.some((act: any) => {
      if (!act) return false;
      const parseList = (val: any) => {
        if (Array.isArray(val)) return val;
        if (typeof val === 'string' && val.trim()) return val.split(/[,;]/).map((s: string) => s.trim());
        return [];
      };
      const pelatihList = parseList(act.pelatih);
      const asistenList = parseList(act.asistenPelatih);
      const allTrainers = [...pelatihList, ...asistenList].map((s: string) => String(s).toLowerCase().trim());

      return allTrainers.some((t: string) => {
        if (!t) return false;
        if (userNameStr && (t.includes(userNameStr) || userNameStr.includes(t))) return true;
        if (userNbmStr && userNbmStr.length >= 4 && t.includes(userNbmStr)) return true;
        if (userEmailStr && userEmailStr.length >= 4 && t.includes(userEmailStr.split('@')[0])) return true;
        const nameWords = userNameStr.split(/\s+/).filter(w => w.length >= 3);
        if (nameWords.length > 0) {
          const matchingWords = nameWords.filter(w => t.includes(w) || w.includes(t));
          if (nameWords.length >= 2 && matchingWords.length >= 2) return true;
          if (nameWords.length === 1 && matchingWords.length === 1 && nameWords[0].length >= 4) return true;
        }
        return false;
      });
    });
  }, [user?.role, (user as any)?.roles, (user as any)?.adminType, user?.email, user?.namaLengkap]);

  const isDiklatAdmin = Boolean(
    user && ((user as any).adminType === 'diklat' || user.email === 'diklat' || user.email === 'diklat@hwjateng.com' || user.role === 'admin_diklat' || user.role === 'diklat')
  );

  const isPelatihOnly = React.useMemo(() => {
    if (!user) return false;
    if (user.role === 'superadmin' || user.role === 'admin' || isDiklatAdmin) return false;
    return canAccessAdmin;
  }, [user, isDiklatAdmin, canAccessAdmin]);

  const isMemberView = !canAccessAdmin || activeRole === 'umum';

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 bg-gradient-to-r from-hw-green via-emerald-600 to-hw-blue border-t border-white/20 shadow-2xl safe-bottom pointer-events-auto">
      <div className="max-w-md mx-auto flex items-center justify-around py-2 px-2">
        {isAuthenticated && !isMemberView ? (
          /* Admin/Staff view */
          (isDiklatAdmin || isPelatihOnly) ? (
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
              <NavigationLink 
                to="/profile" 
                icon={UserIcon} 
                label="Akun" 
                active={location.pathname === '/profile'} 
              />
              <button 
                onClick={logout}
                className="flex flex-col items-center justify-center gap-1 py-1 px-3 text-rose-200 hover:text-white transition-colors cursor-pointer touch-manipulation"
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
                to="/kwarda-ptma" 
                icon={Building2} 
                label="Kwarda" 
                active={location.pathname === '/kwarda-ptma' || (location.pathname === '/admin' && new URLSearchParams(location.search).get('tab') === 'kwarda-ptma')} 
              />
              <NavigationLink 
                to="/admin?tab=pelatihan" 
                icon={GraduationCap} 
                label="Pelatihan" 
                active={location.pathname === '/admin' && new URLSearchParams(location.search).get('tab') === 'pelatihan'} 
              />
              <NavigationLink 
                to="/admin?tab=materi" 
                icon={BookOpen} 
                label="Materi" 
                active={location.pathname === '/admin' && new URLSearchParams(location.search).get('tab') === 'materi'} 
              />
              <button 
                onClick={logout}
                className="flex flex-col items-center justify-center gap-1 py-1 px-1 text-rose-200 hover:text-white transition-colors cursor-pointer touch-manipulation"
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
                  to="/kwarda-ptma" 
                  icon={Building2} 
                  label="Kwarda" 
                  active={location.pathname === '/kwarda-ptma'} 
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
                  className="flex flex-col items-center justify-center gap-1 py-1 px-2.5 text-rose-200 hover:text-white transition-colors cursor-pointer touch-manipulation"
                >
                  <LogOut size={20} />
                  <span className="text-[10px] font-medium transition-all duration-300">Logout</span>
                </button>
              </>
            ) : (
              /* Guest/Unauthenticated view */
              <>
                <NavigationLink 
                  to="/materi" 
                  icon={BookOpen} 
                  label="Materi" 
                  active={location.pathname === '/materi'} 
                />
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
  <div className={cn("pb-24 sm:pb-28 pt-3 px-4 mx-auto w-full", fullWidth ? "max-w-7xl" : "max-w-md")}>
    {children}
  </div>
);

const AnimatedRoutes = () => {
  const location = useLocation();

  return (
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
      <Route path="/kwarda-ptma" element={<PageTransition fullWidth><KwardaPtmaPage /></PageTransition>} />
      <Route path="/admin" element={<PageTransition fullWidth><AdminDashboard /></PageTransition>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
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

    // One-time automatic reset of post-test data across client storage
    try {
      const stored = localStorage.getItem('training_applications');
      if (stored) {
        const apps = JSON.parse(stored);
        if (Array.isArray(apps) && apps.length > 0) {
          let hasPostData = false;
          const cleaned = apps.map((app: any) => {
            if (app && (app.postTestScore !== undefined || app.postTestData || app.postTestSubmittedAt || app.posttestscore || app.post_test_score)) {
              hasPostData = true;
              const copy = { ...app };
              delete copy.postTestScore;
              delete copy.postTestData;
              delete copy.postTestSubmittedAt;
              delete copy.posttestscore;
              delete copy.posttestdata;
              delete copy.posttestsubmittedat;
              delete copy.post_test_score;
              delete copy.post_test_data;
              delete copy.post_test_submitted_at;
              copy.statusKelulusan = 'Proses Pelatihan';
              copy.nilai = '';
              return copy;
            }
            return app;
          });
          if (hasPostData) {
            localStorage.setItem('training_applications', JSON.stringify(cleaned));
            window.dispatchEvent(new Event('training_applications_updated'));
          }
        }
      }
      localStorage.removeItem('offline_post_test_submissions');
      localStorage.removeItem('post_test_submissions');
    } catch (e) {}
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
      <div className="min-h-screen bg-gray-50 flex flex-col relative">
        <Header />
        <main className="flex-1 relative w-full">
          <ErrorBoundary>
            <AnimatedRoutes />
          </ErrorBoundary>
        </main>
        <Navigation />
      </div>
    </Router>
  );
}


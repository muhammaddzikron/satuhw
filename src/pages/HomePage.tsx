import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User as UserIcon, 
  Image as ImageIcon, 
  Share2, 
  Heart, 
  BookOpen, 
  Phone,
  Book,
  Compass,
  Zap,
  MapPin,
  Clock,
  ExternalLink,
  ChevronRight,
  Search,
  X,
  Shield,
  GraduationCap,
  Layers,
  Award,
  Users,
  Calendar,
  Languages,
  CheckCircle2,
  Lock,
  Instagram,
  Youtube,
  MessageCircle,
  Play,
  Pause,
  Music,
  SkipForward,
  SkipBack,
  RefreshCw,
  CreditCard,
  Globe,
  Mail,
  LogIn,
  UserPlus,
  Bell,
  LayoutGrid,
  Video,
  Sparkles,
  Smartphone,
  Plus,
  Download,
  Share,
  Disc,
  Radio,
  Square
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { prayerService } from '../services/prayerService';
import { sheetsService } from '../services/sheetsService';
import { CopyAccountButton } from '../components/CopyAccountButton';
import { PrayerTimes, Materi, Content } from '../types';
import { cn, formatDate, formatTime, getCorsSafeUrl, getDriveDirectLink } from '../lib/utils';
import { isOnlyTrainingActivity, isParticipantOfActivity, sortActivitiesNewestFirst } from '../utils/activityUtils';
import { resolveTrackMetadata } from '../data/playlistCatalog';

const MenuCard = ({ to, icon: Icon, label, color, description, state, onClick }: { to?: string, icon: any, label: string, color: string, description?: string, state?: any, onClick?: () => void }) => {
  if (onClick) {
    return (
      <button onClick={onClick} className="group w-full text-left cursor-pointer">
        <div className="bg-white p-3 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 h-full flex flex-col items-center text-center gap-2">
          <div className={cn("p-2.5 rounded-xl mb-0.5 group-hover:scale-110 transition-transform duration-300", color)}>
            <Icon className="text-white" size={18} />
          </div>
          <h3 className="font-display font-bold text-[10px] text-hw-dark leading-tight uppercase tracking-tight">{label}</h3>
        </div>
      </button>
    );
  }
  return (
    <Link to={to || '#'} state={state} className="group">
      <div className="bg-white p-3 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 h-full flex flex-col items-center text-center gap-2">
        <div className={cn("p-2.5 rounded-xl mb-0.5 group-hover:scale-110 transition-transform duration-300", color)}>
          <Icon className="text-white" size={18} />
        </div>
        <h3 className="font-display font-bold text-[10px] text-hw-dark leading-tight uppercase tracking-tight">{label}</h3>
      </div>
    </Link>
  );
};

const FeatureCard = ({ to, icon: Icon, label }: { to: string, icon: any, label: string }) => (
  <Link to={to} className="flex items-center gap-3 bg-white p-3 rounded-2xl border border-gray-100 shadow-2xs hover:shadow-md hover:border-emerald-200 transition-all">
    <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl">
      <Icon size={18} />
    </div>
    <span className="text-xs font-bold text-gray-800 flex-1">{label}</span>
    <ChevronRight size={14} className="text-gray-300" />
  </Link>
);

export default function HomePage() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  const [prayerTimes, setPrayerTimes] = useState<PrayerTimes | null>({
    shubuh: '04:32',
    dzuhur: '11:51',
    ashar: '15:10',
    maghrib: '17:50',
    isya: '19:01',
    hijri: { day: '25', month: "Sya'ban", year: '1447' }
  });
  const [location, setLocation] = useState('Purwokerto');
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [materiList, setMateriList] = useState<Materi[]>(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('hw_materi_cache_umum') || '[]');
      if (Array.isArray(stored) && stored.length > 0) return stored;
    } catch {}
    return [];
  });
  const [searchResults, setSearchResults] = useState<any[]>([]);
  
  // Pre-initialize contents from cached contents or fresh defaults for 100% instant render
  const [galleryItems, setGalleryItems] = useState<Content[]>(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('contents') || '[]');
      if (Array.isArray(stored) && stored.length > 0) {
        const gal = stored.filter((c: any) => c.section === 'galeri');
        if (gal.length > 0) {
          return gal.map((c: any) => c.field1?.includes('dQw4w9WgXcQ') ? { ...c, field1: 'https://www.youtube.com/watch?v=kR2rXyNf9V8', field2: 'Mars Gerakan Kepanduan Hizbul Wathan' } : c);
        }
      }
    } catch {}
    const initialContents = sheetsService.getMockContents ? sheetsService.getMockContents() : [];
    const gal = initialContents.filter((c: any) => c.section === 'galeri');
    if (gal.length > 0) return gal;
    return [
      { id: 'gal-1', section: 'galeri', field1: 'https://www.youtube.com/watch?v=kR2rXyNf9V8', field2: 'Mars Gerakan Kepanduan Hizbul Wathan' },
      { id: 'gal-2', section: 'galeri', field1: 'https://www.youtube.com/watch?v=mD03u6-T9u8', field2: 'Profil Kwartir Wilayah HW Jawa Tengah' }
    ];
  });

  const [playlistItems, setPlaylistItems] = useState<Content[]>(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('contents') || '[]');
      if (Array.isArray(stored) && stored.length > 0) {
        const pl = stored.filter((c: any) => c.section === 'playlist');
        if (pl.length > 0) return pl;
      }
    } catch {}
    const initialContents = sheetsService.getMockContents ? sheetsService.getMockContents() : [];
    const pl = initialContents.filter((c: any) => c.section === 'playlist');
    if (pl.length > 0) return pl;
    return [
      { id: 'pl-1', section: 'playlist', field1: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', field2: 'Mars Hizbul Wathan', field3: 'Haiban Hadjid', pencipta: 'Haiban Hadjid' },
      { id: 'pl-2', section: 'playlist', field1: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3', field2: 'Mars Athfal', field3: 'Kwarpus HW', pencipta: 'Kwarpus HW' }
    ];
  });

  const [sosmed, setSosmed] = useState<Content | null>(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('contents') || '[]');
      if (Array.isArray(stored) && stored.length > 0) {
        const sm = stored.find((c: any) => c.section === 'sosmed');
        if (sm) return sm;
      }
    } catch {}
    const initialContents = sheetsService.getMockContents ? sheetsService.getMockContents() : [];
    return initialContents.find((c: any) => c.section === 'sosmed') || {
      id: 'sosmed-1',
      section: 'sosmed',
      field1: '@hw_pusat',
      field2: '@hw_pusat',
      field3: 'UCHW-TV',
      field4: 'https://chat.whatsapp.com/L7r0U0u0U0u0U0u0U0u0'
    };
  });

  const [kontak, setKontak] = useState<Content | null>(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('contents') || '[]');
      if (Array.isArray(stored) && stored.length > 0) {
        const kt = stored.find((c: any) => c.section === 'kontak');
        if (kt) return kt;
      }
    } catch {}
    const initialContents = sheetsService.getMockContents ? sheetsService.getMockContents() : [];
    return initialContents.find((c: any) => c.section === 'kontak') || {
      id: 'kontak-1',
      section: 'kontak',
      field1: 'Kwartir Wilayah HW Jawa Tengah',
      field2: 'Semarang, Jawa Tengah',
      field3: '089688754000',
      field4: 'kwarwiljateng@gmail.com'
    };
  });

  const [showSosmedModal, setShowSosmedModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);
  const [runningText, setRunningText] = useState<string>(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('contents') || '[]');
      if (Array.isArray(stored) && stored.length > 0) {
        const rt = stored.find((c: any) => c.section === 'running-text');
        if (rt?.field1) return rt.field1;
      }
    } catch {}
    return 'Selamat Datang di Portal Resmi Gerakan Kepanduan Hizbul Wathan Jawa Tengah - Satu HW Jateng | Fastabiqul Khairat';
  });
  const [myKtaApp, setMyKtaApp] = useState<any | null>(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('hw_kta_applications') || '[]');
      if (Array.isArray(stored) && user?.email) {
        return stored.find((a: any) => a.email && a.email.toLowerCase().trim() === user.email.toLowerCase().trim()) || null;
      }
    } catch {}
    return null;
  });

  useEffect(() => {
    if (isAuthenticated && user) {
      sheetsService.getKTAApplications().then((apps) => {
        const userApp = (apps || []).find(
          (app: any) => app.userId === user.id || (app.email && user.email && app.email.toLowerCase().trim() === user.email.toLowerCase().trim())
        );
        if (userApp) {
          setMyKtaApp(userApp);
        }
      }).catch(e => console.error('Error fetching KTA app on home:', e));
    }
  }, [isAuthenticated, user?.id, user?.email]);

  const isRegistrationApproved = Boolean(
    user?.isVerified || 
    user?.statusAktivasi === 'Aktif' || 
    user?.statusPembayaran === 'Lunas'
  );
  const isKtaApproved = Boolean(
    myKtaApp?.status === 'approved' || 
    myKtaApp?.ktaNumber || 
    (user as any)?.ktaNumber
  );

  const shouldShowActivationCard = isAuthenticated && 
    user && 
    user.role !== 'admin' && 
    user.role !== 'superadmin' && 
    !isRegistrationApproved && 
    !isKtaApproved;
  
  // PWA Install States
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [activeDeviceTab, setActiveDeviceTab] = useState<'android' | 'ios'>('android');

  useEffect(() => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    if (isIOS) {
      setActiveDeviceTab('ios');
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    } else {
      setShowInstallModal(true);
    }
  };
  
  // Audio Player State
  const [currentTrackIndex, setCurrentTrackIndex] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [autoPlayEnabled, setAutoPlayEnabled] = useState(true);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  // Training Banner & Modal States
  const [trainingActivities, setTrainingActivities] = useState<any[]>(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('hw_training_activities') || '[]');
      if (Array.isArray(stored) && stored.length > 0) return stored;
    } catch {}
    return [
      { id: 'train-1', namaKegiatan: 'Pelatihan Jaya Melati 1 (JML 1)', title: 'Pelatihan Jaya Melati 1 (JML 1)', kategori: 'Pelatihan', status: 'Buka' },
      { id: 'train-2', namaKegiatan: 'Pelatihan Jaya Melati 2 (JML 2)', title: 'Pelatihan Jaya Melati 2 (JML 2)', kategori: 'Pelatihan', status: 'Buka' },
      { id: 'train-3', namaKegiatan: 'Pelatihan Jaya Matahari 1 (JMT 1)', title: 'Pelatihan Jaya Matahari 1 (JMT 1)', kategori: 'Pelatihan', status: 'Buka' },
      { id: 'train-4', namaKegiatan: 'Pelatihan Jaya Pertiwi', title: 'Pelatihan Jaya Pertiwi', kategori: 'Pelatihan', status: 'Buka' }
    ];
  });
  const [trainingLocations, setTrainingLocations] = useState<string[]>(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('hw_training_locations') || '[]');
      if (Array.isArray(stored) && stored.length > 0) return stored;
    } catch {}
    return ['Semarang', 'Surakarta', 'Banyumas', 'Pekalongan', 'Kebumen', 'Kudus', 'Magelang'];
  });
  const [showTrainingModal, setShowTrainingModal] = useState(false);
  const [selectedTrainingForReg, setSelectedTrainingForReg] = useState<any | null>(null);
  const [showRequirementModal, setShowRequirementModal] = useState(false);
  const [activitiesList, setActivitiesList] = useState<any[]>(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('hw_activities') || '[]');
      if (Array.isArray(stored) && stored.length > 0) return stored;
    } catch {}
    return [
      {
        id: 'keg-silaturahmi-pelatih',
        namaKegiatan: 'Pertemuan Silaturahmi Pelatih Nasional, Pandu Senior HW Jateng dan Alumni Jaya Melati 2',
        title: 'Pertemuan Silaturahmi Pelatih Nasional, Pandu Senior HW Jateng dan Alumni Jaya Melati 2',
        kategori: 'Silaturahmi',
        category: 'Silaturahmi',
        tanggal: '29-30 Agustus 2026',
        startDate: '2026-08-29',
        endDate: '2026-08-30',
        lokasi: 'Unimugo Kebumen',
        location: 'Unimugo Kebumen',
        biaya: 'Infaq: Rp 100.000 / Kwarda/Qabilah PTMA',
        status: 'Buka',
        kuota: '200 Orang',
        deskripsi: 'Pertemuan silaturahmi Pelatih Nasional, Pandu Senior HW Jateng, dan Alumni Jaya Melati 2 HW Jateng (di Klaten) - di Universitas Muhammadiyah Gombong',
        description: 'Pertemuan silaturahmi Pelatih Nasional, Pandu Senior HW Jateng, dan Alumni Jaya Melati 2 HW Jateng (di Klaten) - di Universitas Muhammadiyah Gombong',
        gambarUrl: 'https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&q=80&w=800',
        imageUrl: 'https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&q=80&w=800',
        isPublished: true,
        penyelenggara: 'Kwartir Wilayah HW Jawa Tengah'
      }
    ];
  });
  const [activityApps, setActivityApps] = useState<any[]>(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('hw_activity_applications') || '[]');
      if (Array.isArray(stored) && stored.length > 0) return stored;
    } catch {}
    return [];
  });

  // Subscribe to real-time activities, activity applications, contents, and settings so edited activities/contents in Admin immediately update on HomePage
  useEffect(() => {
    const unsubActivities = sheetsService.subscribeToActivities((acts: any[]) => {
      if (acts && acts.length > 0) {
        setActivitiesList(acts);
        try { localStorage.setItem('hw_activities', JSON.stringify(acts)); } catch (e) {}
      }
    });
    const unsubApps = sheetsService.subscribeToActivityApplications((apps: any[]) => {
      if (apps) {
        setActivityApps(apps);
        try { localStorage.setItem('hw_activity_applications', JSON.stringify(apps)); } catch (e) {}
      }
    });
    const unsubContents = sheetsService.subscribeToContents((contents: Content[]) => {
      if (contents && contents.length > 0) {
        const gal = contents.filter(c => c.section === 'galeri');
        if (gal.length > 0) setGalleryItems(gal);
        const pl = contents.filter(c => c.section === 'playlist');
        if (pl.length > 0) setPlaylistItems(pl);
        const sm = contents.find(c => c.section === 'sosmed');
        if (sm) setSosmed(sm);
        const kt = contents.find(c => c.section === 'kontak');
        if (kt) setKontak(kt);
        const rt = contents.find(c => c.section === 'running-text');
        if (rt?.field1) setRunningText(rt.field1);
      }
    });
    const unsubSettings = sheetsService.subscribeToSettings((sData: any) => {
      if (sData && sData.trainingActivities) {
        const acts = Array.isArray(sData.trainingActivities)
          ? sData.trainingActivities
          : typeof sData.trainingActivities === 'string'
            ? JSON.parse(sData.trainingActivities || '[]')
            : [];
        if (acts.length > 0) {
          setTrainingActivities(acts);
          try { localStorage.setItem('hw_training_activities', JSON.stringify(acts)); } catch (e) {}
        }
      }
    });
    return () => {
      unsubActivities();
      unsubApps();
      unsubContents();
      unsubSettings();
    };
  }, []);

  const homeActivityParticipantCountMap = React.useMemo(() => {
    const map: Record<string, number> = {};
    if (!activityApps?.length) return map;
    for (const app of activityApps) {
      const actId = String(app.activityId || app.activity_id || app.kegiatanId || app.idKegiatan || '').trim().toLowerCase();
      if (actId) {
        map[actId] = (map[actId] || 0) + 1;
        if (actId === 'keg-1') map['keg-silaturahmi-pelatih'] = (map['keg-silaturahmi-pelatih'] || 0) + 1;
        if (actId === 'keg-silaturahmi-pelatih') map['keg-1'] = (map['keg-1'] || 0) + 1;
      }
    }
    return map;
  }, [activityApps]);

  const activeTrainings = React.useMemo(() => {
    const map = new Map<string, any>();
    (trainingActivities || []).forEach((act: any) => {
      if (act && act.id && isOnlyTrainingActivity(act)) {
        map.set(act.id, act);
      }
    });
    (activitiesList || []).forEach((act: any) => {
      if (!act || !act.id) return;
      if (map.has(act.id) && isOnlyTrainingActivity(act)) {
        const prev = map.get(act.id) || {};
        const merged = { ...prev, ...act };
        const finalLoc = act.lokasi || act.lokasiPelatihan || act.location || prev.lokasi || prev.lokasiPelatihan || '';
        const finalDate = act.tanggal || act.tanggalPelatihan || act.startDate || prev.tanggal || prev.tanggalPelatihan || '';
        map.set(act.id, {
          ...merged,
          lokasi: finalLoc,
          location: finalLoc,
          lokasiPelatihan: finalLoc,
          tanggal: finalDate,
          startDate: finalDate,
          tanggalPelatihan: finalDate
        });
      }
    });
    return Array.from(map.values()).filter(isOnlyTrainingActivity);
  }, [trainingActivities, activitiesList]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    
    const initializeLocationAndPrayers = async () => {
      try {
        const coords = await prayerService.getCurrentCoords();
        if (coords) {
          const city = await prayerService.getLocationName(coords.lat, coords.lon);
          setLocation(city);
          const times = await prayerService.getPrayerTimes({ lat: coords.lat, lon: coords.lon });
          setPrayerTimes(times);
        } else {
          const times = await prayerService.getPrayerTimes({ city: 'Purwokerto' });
          setPrayerTimes(times);
          setLocation('Purwokerto');
        }
      } catch (error) {
        const times = await prayerService.getPrayerTimes({ city: 'Purwokerto' });
        setPrayerTimes(times);
        setLocation('Purwokerto');
      }
    };
    
    // Non-blocking parallel background fetches that update immediately without blocking UI
    const fetchAllData = () => {
      // 1. Contents & playlist
      sheetsService.getContents().then((contents) => {
        if (contents && contents.length > 0) {
          const gal = contents.filter(c => c.section === 'galeri');
          if (gal.length > 0) setGalleryItems(gal);
          const pl = contents.filter(c => c.section === 'playlist');
          if (pl.length > 0) setPlaylistItems(pl);
          const sm = contents.find(c => c.section === 'sosmed');
          if (sm) setSosmed(sm);
          const kt = contents.find(c => c.section === 'kontak');
          if (kt) setKontak(kt);
          const rt = contents.find(c => c.section === 'running-text');
          if (rt?.field1) setRunningText(rt.field1);
        }
      }).catch(e => console.warn('Background contents fetch warning:', e));

      // 2. Fresh activities
      sheetsService.getActivities().then((acts) => {
        if (acts && acts.length > 0) {
          setActivitiesList(acts);
          try { localStorage.setItem('hw_activities', JSON.stringify(acts)); } catch (e) {}
        }
      }).catch(e => console.warn('Background activities fetch warning:', e));

      // 3. Materi for search
      Promise.all(['umum', 'umum_pandu'].map(r => sheetsService.getMateri(r))).then((mResults) => {
        const flatMateri = (mResults || []).flat().filter(Boolean);
        const uniqueMateri = Array.from(new Map(flatMateri.map(item => [item.id, item])).values());
        const filtered = uniqueMateri.filter(m => m && (m.kategori === 'umum' || m.kategori === 'umum_pandu'));
        if (filtered.length > 0) {
          setMateriList(filtered);
          try { localStorage.setItem('hw_materi_cache_umum', JSON.stringify(filtered)); } catch (e) {}
        }
      }).catch(e => console.warn('Background materi fetch warning:', e));

      // 4. Training Settings
      sheetsService.getSettings().then((sData) => {
        if (sData) {
          if (sData.trainingActivities) {
            const acts = Array.isArray(sData.trainingActivities)
              ? sData.trainingActivities
              : typeof sData.trainingActivities === 'string'
                ? JSON.parse(sData.trainingActivities || '[]')
                : [];
            if (acts.length > 0) {
              setTrainingActivities(acts);
              try { localStorage.setItem('hw_training_activities', JSON.stringify(acts)); } catch (e) {}
            }
          }
          if (sData.trainingLocations) {
            const locs = Array.isArray(sData.trainingLocations)
              ? sData.trainingLocations
              : typeof sData.trainingLocations === 'string'
                ? JSON.parse(sData.trainingLocations || '[]')
                : [];
            if (locs.length > 0) {
              setTrainingLocations(locs);
              try { localStorage.setItem('hw_training_locations', JSON.stringify(locs)); } catch (e) {}
            }
          }
        }
      }).catch(e => console.warn('Background training settings fetch warning:', e));
    };

    initializeLocationAndPrayers();
    fetchAllData();
    return () => clearInterval(timer);
  }, [isAuthenticated, user?.role]);

  const getDriveStreamUrl = (url: string) => {
    if (!url) return '';
    if (url.includes('drive.google.com')) {
      // Extract ID from /d/ID/ or id=ID or open?id=ID
      const match = url.match(/\/d\/(.+?)(\/|$|\?|#)/) || url.match(/[?&]id=(.+?)(&|$|#)/);
      if (match && match[1]) {
        // docs.google.com/uc?id= is often more reliable for audio hotlinking
        return `https://docs.google.com/uc?id=${match[1]}&export=download`;
      }
    }
    return url;
  };

  const handlePlayTrack = (index: number) => {
    if (currentTrackIndex === index) {
      if (isPlaying) {
        audioRef.current?.pause();
        setIsPlaying(false);
      } else {
        audioRef.current?.play().catch(err => {
          console.warn('Playback resume warning:', err);
        });
        setIsPlaying(true);
      }
    } else {
      setCurrentTrackIndex(index);
      setIsPlaying(true);
    }
  };

  const handleClosePlayer = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setIsPlaying(false);
    setCurrentTrackIndex(null);
  };

  const handleStopTrack = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlaying(false);
  };

  const handleNextTrack = () => {
    if (playlistItems.length === 0) return;
    const nextIndex = currentTrackIndex === null ? 0 : (currentTrackIndex + 1) % playlistItems.length;
    handlePlayTrack(nextIndex);
  };

  const handlePrevTrack = () => {
    if (playlistItems.length === 0) return;
    const prevIndex = currentTrackIndex === null ? playlistItems.length - 1 : (currentTrackIndex - 1 + playlistItems.length) % playlistItems.length;
    handlePlayTrack(prevIndex);
  };

  const handleAudioEnded = () => {
    if (autoPlayEnabled) {
      handleNextTrack();
    } else {
      setIsPlaying(false);
    }
  };

  //@ts-ignore
  useEffect(() => {
    if (currentTrackIndex !== null && audioRef.current && playlistItems[currentTrackIndex]) {
      const streamUrl = getDriveStreamUrl(playlistItems[currentTrackIndex].field1);
      audioRef.current.src = streamUrl;
      audioRef.current.load(); // Force re-load
      audioRef.current.play().catch(err => {
        console.warn('Play warning:', err);
        setIsPlaying(false);
      });
    }
  }, [currentTrackIndex]);

  const VideoPreview = () => (
    <>
      {galleryItems.length === 0 ? (
        [1, 2, 3].map(i => (
          <div key={`skeleton-${i}`} className="min-w-[160px] h-28 bg-gray-100 rounded-3xl animate-pulse shrink-0" />
        ))
      ) : (
        galleryItems.map((item, i) => {
          const videoUrl = item.field1 || '';
          const videoTitle = item.field2 || 'Video HW';
          let videoId = '';
          try {
            if (videoUrl.includes('v=')) videoId = videoUrl.split('v=')[1]?.split('&')[0];
            else if (videoUrl.includes('youtu.be/')) videoId = videoUrl.split('youtu.be/')[1]?.split('?')[0];
            else videoId = videoUrl.split('/').pop() || '';
          } catch (e) {}

          const thumb = videoId ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg` : 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=400';

          return (
            <button 
              key={`home-video-${item.id}-${i}`}
              onClick={() => { if (videoId) setActiveVideoId(videoId); }}
              className="min-w-[160px] sm:min-w-[180px] bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm snap-start group text-left cursor-pointer"
            >
              <div className="relative h-24">
                <img src={thumb} alt={videoTitle} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                  <div className="w-8 h-8 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/30">
                    <Play fill="white" size={14} />
                  </div>
                </div>
              </div>
              <div className="p-2.5">
                <h4 className="text-[10px] font-bold text-gray-800 line-clamp-1">{videoTitle}</h4>
              </div>
            </button>
          );
        })
      )}
    </>
  );

  const PlaylistPreview = () => (
    <div className="space-y-2.5">
      {playlistItems.length === 0 ? (
        <div className="p-4 bg-white rounded-3xl border border-gray-100 flex items-center justify-center">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Belum ada playlist</p>
        </div>
      ) : (
        playlistItems.slice(0, 5).map((rawTrack, idx) => {
          const isCurrent = currentTrackIndex === idx;
          const track = resolveTrackMetadata(rawTrack);
          return (
            <div 
              key={track.id || idx}
              className={cn(
                "p-3 rounded-2xl border transition-all flex items-center gap-3 group",
                isCurrent 
                  ? "bg-emerald-50/80 border-emerald-300 shadow-xs ring-1 ring-hw-green/20" 
                  : "bg-white hover:bg-gray-50/80 border-gray-150 shadow-2xs hover:border-gray-300"
              )}
            >
              <button 
                type="button"
                onClick={() => handlePlayTrack(idx)}
                className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all shadow-xs cursor-pointer active:scale-95",
                  isCurrent && isPlaying 
                    ? "bg-hw-green text-white shadow-emerald-500/25 ring-2 ring-hw-green/30" 
                    : "bg-emerald-50 text-emerald-800 hover:bg-hw-green hover:text-white border border-emerald-200/60"
                )}
                title={isCurrent && isPlaying ? "Jeda" : "Putar"}
              >
                {isCurrent && isPlaying ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" className="ml-0.5" />}
              </button>

              <div className="flex-1 min-w-0">
                <h4 className={cn("text-xs font-bold truncate", isCurrent ? "text-emerald-950 font-black" : "text-gray-900")}>
                  {track.title}
                </h4>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[10px] text-emerald-700 font-bold bg-emerald-100/60 px-1.5 py-0.2 rounded border border-emerald-200/50 truncate max-w-[240px]">
                    Cipt: {track.creator}
                  </span>
                </div>
              </div>

              {isCurrent && isPlaying && (
                <div className="flex gap-0.5 items-end h-3.5 pr-1 shrink-0">
                  {[0.6, 0.4, 0.8, 0.5, 0.7].map((h, i) => (
                    <motion.div 
                      key={i}
                      animate={{ height: ['30%', '100%', '30%'] }}
                      transition={{ repeat: Infinity, duration: h + 0.4, delay: i * 0.1 }}
                      className="w-0.5 bg-hw-green rounded-full"
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })
      )}
      {playlistItems.length > 5 && (
        <Link to="/playlist" className="block text-center py-2 text-[9px] font-black text-emerald-800 uppercase tracking-widest bg-emerald-50 hover:bg-emerald-100/80 rounded-xl border border-dashed border-emerald-300 transition-all">
          Lihat Semua {playlistItems.length} Playlist Lagu HW
        </Link>
      )}
    </div>
  );

  useEffect(() => {
    try {
      if (searchQuery.trim().length > 1) {
        const q = searchQuery.trim().toLowerCase();
        
        const filteredMateri = (materiList || []).filter(m => 
          m && (m.kategori === 'umum' || m.kategori === 'umum_pandu') && (
            String(m.judul || '').toLowerCase().includes(q) ||
            String(m.konten || '').toLowerCase().includes(q)
          )
        ).map(item => ({ ...item, type: 'materi' }));

        const filteredVideos = (galleryItems || []).filter(v => 
          v && String(v.field2 || '').toLowerCase().includes(q)
        ).map(item => ({ ...item, type: 'video' }));

        const filteredAudio = (playlistItems || []).filter(a => 
          a && String(a.field2 || '').toLowerCase().includes(q)
        ).map(item => ({ ...item, type: 'audio' }));

        setSearchResults([...filteredMateri, ...filteredVideos, ...filteredAudio]);
      } else {
        setSearchResults([]);
      }
    } catch (e) {
      console.error('Error during search calculation:', e);
      setSearchResults([]);
    }
  }, [searchQuery, materiList, galleryItems, playlistItems]);

  // Removed redundant line - activeTrainings is memoized above

  const handleSelectTrainingForRegistration = (act: any) => {
    setShowTrainingModal(false);
    if (isAuthenticated) {
      navigate('/daftar-pelatihan', { state: { activity: act } });
    } else {
      setSelectedTrainingForReg(act);
      setShowRequirementModal(true);
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Greeting Section */}
      <section className="pt-1">
        <div className="flex flex-col">
          <h2 className="text-base font-display font-bold text-hw-dark">
            {isAuthenticated ? (
              `Assalamu'alaikum, ${user?.namaLengkap || 'Anggota'}`
            ) : (
              "Assalamu'alaikum Sahabat HW.."
            )}
          </h2>
          {isAuthenticated && (
            <div className="flex flex-col gap-1 mt-0.5">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-gray-400 font-medium tracking-tight">Anda masuk sebagai</span>
                <span className="text-[10px] text-hw-green font-black uppercase tracking-widest bg-hw-green/5 px-2 py-0.5 rounded-full">
                  {user?.role || 'Umum'}
                </span>
              </div>
              <Link to="/profile" className="flex items-center gap-1 text-[10px] text-hw-blue font-bold hover:underline">
                Silahkan update data diri anda disini <ChevronRight size={10} />
              </Link>
            </div>
          )}
        </div>
        <div className="space-y-0.5 mt-2 flex items-center justify-between">
          <div>
            <p className="text-[13px] font-medium text-gray-500">{formatDate(currentTime)}</p>
            {prayerTimes?.hijri && (
              <p className="text-[11px] text-hw-green font-bold uppercase tracking-wider">
                {prayerTimes.hijri.day} {prayerTimes.hijri.month} {prayerTimes.hijri.year} H
              </p>
            )}
          </div>
          {/* Quick Sosmed Badges */}
          <div className="flex gap-1.5">
            <button 
              onClick={handleInstallClick}
              title="Simpan Shortcut Layar HP"
              className="w-7 h-7 rounded-lg bg-white border border-gray-100 flex items-center justify-center text-hw-green shadow-sm active:scale-95 transition-transform cursor-pointer"
            >
              <Smartphone size={14} />
            </button>
            <a href={`https://instagram.com/${String(sosmed?.field1 || 'hw_pusat').replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="w-7 h-7 rounded-lg bg-white border border-gray-100 flex items-center justify-center text-rose-500 shadow-sm active:scale-95 transition-transform">
              <Instagram size={14} />
            </a>
            <a href={(typeof sosmed?.field3 === 'string' && sosmed.field3.startsWith('http')) ? sosmed.field3 : `https://youtube.com/channel/${sosmed?.field3 || ''}`} target="_blank" rel="noopener noreferrer" className="w-7 h-7 rounded-lg bg-white border border-gray-100 flex items-center justify-center text-red-600 shadow-sm active:scale-95 transition-transform">
              <Youtube size={14} />
            </a>
            <a href={sosmed?.field4 || 'https://chat.whatsapp.com/'} target="_blank" rel="noopener noreferrer" className="w-7 h-7 rounded-lg bg-white border border-gray-100 flex items-center justify-center text-green-500 shadow-sm active:scale-95 transition-transform">
              <MessageCircle size={14} />
            </a>
          </div>
        </div>
      </section>

      {/* Account Activation Card */}
      {shouldShowActivationCard && (
        <div className="bg-gradient-to-br from-amber-500 via-orange-600 to-emerald-700 text-white rounded-[2rem] p-5 shadow-xl shadow-orange-500/10 mb-5 relative overflow-hidden">
          <div className="relative z-10 space-y-3">
            <div className="flex items-center justify-between border-b border-white/20 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center text-amber-200">
                  <Lock size={18} />
                </div>
                <div>
                  <h3 className="font-black text-sm tracking-wide">Aktivasi Akun</h3>
                  <p className="text-[10px] text-amber-100 font-medium">Lengkapi pembayaran untuk membuka seluruh fitur</p>
                </div>
              </div>
              <span className="px-2.5 py-1 bg-amber-400 text-amber-950 font-black text-[10px] rounded-full uppercase tracking-wider shadow-xs">
                {user.statusAktivasi === 'Belum Aktif' ? 'Belum Aktif' : 'Belum Bayar'}
              </span>
            </div>

            <p className="text-xs text-white/90 leading-relaxed font-medium">
              Akun Anda telah berhasil terdaftar. Silakan melakukan pembayaran biaya aktivasi senilai <strong>Rp 10.000</strong> ke rekening atas nama <strong>Kwarwil HW Jateng</strong> di bawah ini agar admin dapat segera mengaktifkan akun Anda.
            </p>
            <p className="text-[11px] text-amber-100 font-semibold bg-white/10 px-3 py-2 rounded-xl border border-white/15 leading-snug">
              Biaya aktivasi termasuk biaya KTA Digital.
            </p>

            <div className="bg-white/10 backdrop-blur-md rounded-xl p-2.5 border border-white/15 space-y-1 text-center">
              <p className="text-[9px] uppercase tracking-wider text-amber-200 font-sans font-bold">Bank Syariah Indonesia (BSI)</p>
              <CopyAccountButton accountNumber="7307427448" showNumber={true} textClassName="text-sm font-black text-white font-mono" />
              <p className="text-[9.5px] text-white/80 font-sans">a.n. Kwarwil HW Jateng</p>
            </div>

            <div className="pt-1 flex flex-col sm:flex-row gap-2">
              <button 
                onClick={() => {
                  const text = encodeURIComponent(`Assalamu'alaikum Admin HW Jateng, saya telah melakukan pembayaran aktivasi akun.\n\nNama: ${user.namaLengkap}\nEmail: ${user.email}\nNo HP: ${user.noHp || '-'}\nMohon bantuannya untuk proses aktivasi akun. Terima kasih.`);
                  window.open(`https://wa.me/6289688754000?text=${text}`, '_blank');
                }}
                className="flex-1 bg-white text-orange-700 hover:bg-amber-50 font-black text-xs py-2.5 px-4 rounded-xl shadow-md active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <CheckCircle2 size={15} />
                Saya Sudah Bayar
              </button>
              <button 
                onClick={() => {
                  const text = encodeURIComponent(`Assalamu'alaikum Admin HW Jateng, saya ingin bertanya mengenai aktivasi akun KTA HW Jateng.\n\nNama: ${user.namaLengkap}\nEmail: ${user.email}`);
                  window.open(`https://wa.me/6289688754000?text=${text}`, '_blank');
                }}
                className="flex-1 bg-white/15 hover:bg-white/25 text-white font-bold text-xs py-2.5 px-4 rounded-xl border border-white/20 active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <MessageCircle size={15} />
                Hubungi Admin
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Prayer Times Card */}
      <section className="gradient-bg p-5 rounded-[2rem] text-white shadow-xl shadow-hw-green/20 relative overflow-hidden">
        <div className="relative z-10 flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2 text-white/90">
              <MapPin size={14} />
              <span className="text-xs font-medium">{location}</span>
            </div>
            <div className="flex items-center gap-2 text-white/90">
              <Clock size={14} />
              <span className="text-xs font-mono font-bold tracking-widest">{formatTime(currentTime)}</span>
            </div>
          </div>
          
          <div className="grid grid-cols-5 gap-1 mt-2">
            {[
              { name: 'Shubuh', time: prayerTimes?.shubuh },
              { name: 'Dzuhur', time: prayerTimes?.dzuhur },
              { name: 'Ashar', time: prayerTimes?.ashar },
              { name: 'Maghrib', time: prayerTimes?.maghrib },
              { name: 'Isya', time: prayerTimes?.isya }
            ].map((p) => (
              <div key={p.name} className="flex flex-col items-center gap-1">
                <span className="text-[8px] uppercase tracking-tighter opacity-70 font-bold">{p.name}</span>
                <span className="text-[11px] font-bold">{p.time || '--:--'}</span>
              </div>
            ))}
          </div>
          <p className="text-[9px] text-white/60 text-center mt-2 italic font-medium">Referensi KHGT Muhammadiyah</p>
        </div>
        
        {/* Decorative Circles */}
        <div className="absolute top-[-20px] right-[-20px] w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
        <div className="absolute bottom-[-20px] left-[-20px] w-24 h-24 bg-hw-blue/20 rounded-full blur-xl"></div>
      </section>

      {/* Running Announcement Text */}
      {runningText && (
        <div id="announcement-ticker" className="bg-emerald-100/90 border border-emerald-200/90 rounded-2xl p-2.5 flex items-center gap-3 overflow-hidden shadow-xs">
          <div className="flex items-center gap-1.5 bg-emerald-700 text-white px-2.5 py-1 rounded-xl shadow-xs shrink-0 font-bold text-xs">
            <Bell size={12} className="animate-bounce text-amber-300" />
            <span className="uppercase tracking-wider text-[9px] font-black">Info</span>
          </div>
          <div className="relative flex-1 overflow-hidden w-full h-4 flex items-center">
            <div className="animate-marquee inline-flex whitespace-nowrap text-xs text-emerald-900 font-bold italic leading-none">
              <span className="pr-12">{runningText}</span>
              <span className="pr-12">{runningText}</span>
            </div>
          </div>
        </div>
      )}

      {/* Search Bar */}
      <section className="relative">
        <form onSubmit={(e) => e.preventDefault()} className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
          <input 
            type="text" 
            placeholder="Cari materi, audio, video..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-gray-100 rounded-2xl py-3.5 pl-12 pr-12 focus:ring-2 focus:ring-hw-green/20 outline-none text-sm shadow-sm transition-all"
          />
          {searchQuery && (
            <button 
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-hw-green transition-colors"
            >
              <X size={18} />
            </button>
          )}
        </form>
        
        {/* Live Search Results */}
        <AnimatePresence>
          {searchQuery.trim().length > 1 && (
            <motion.div 
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.15 }}
              className="bg-white rounded-2xl border border-gray-100 shadow-md mt-3 overflow-hidden z-20 relative"
            >
              <div className="p-3 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
                <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Hasil Pencarian</span>
                <span className="text-[10px] font-bold text-hw-green">{searchResults.length} Hasil ditemukan</span>
              </div>

              {searchResults.length > 0 ? (
                <div className="max-h-[350px] overflow-y-auto divide-y divide-gray-50">
                  {searchResults.map((m, index) => {
                    const isMateri = m.type === 'materi';
                    const isVideo = m.type === 'video';
                    const isAudio = m.type === 'audio';
                    const itemKey = `search-${m.type}-${m.id || index}`;

                    return (
                      <div key={itemKey} className="transition-colors hover:bg-gray-50">
                        {isMateri && (
                          <Link 
                            to="/materi" 
                            state={{ searchQuery: m.judul, selectedMateriId: m.id, filter: m.kategori || 'umum' }}
                            className="flex items-center gap-3 p-3 bg-white hover:bg-gray-50 transition-colors"
                          >
                            <div className="w-9 h-9 rounded-xl bg-hw-green/10 flex items-center justify-center text-hw-green shrink-0">
                              <BookOpen size={16} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-[11px] font-bold text-gray-800 truncate">{m.judul || 'Tanpa Judul'}</h4>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className={`text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded ${m.kategori === 'umum_pandu' ? 'bg-teal-100 text-teal-700' : 'bg-blue-100 text-blue-700'}`}>
                                  {m.kategori === 'umum_pandu' ? 'Umum Pandu' : 'Umum'}
                                </span>
                                {m.kategori === 'umum_pandu' && !isAuthenticated && (
                                  <span className="text-[8px] text-amber-600 font-bold flex items-center gap-0.5">
                                    <Lock size={10} /> Perlu Login
                                  </span>
                                )}
                              </div>
                            </div>
                            <ChevronRight size={14} className="text-gray-300" />
                          </Link>
                        )}

                        {isVideo && (
                          <a 
                            href={m.field1 || '#'}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 p-3 bg-white hover:bg-gray-50 transition-colors"
                          >
                            <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center text-red-500 shrink-0">
                              <Youtube size={16} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-[11px] font-bold text-gray-800 truncate">{m.field2 || 'Video HW'}</h4>
                              <p className="text-[9px] text-gray-400 line-clamp-1 italic uppercase font-black tracking-tighter">Video Tutorial / YouTube</p>
                            </div>
                            <ChevronRight size={14} className="text-gray-300" />
                          </a>
                        )}

                        {isAudio && (
                          <button 
                            type="button"
                            onClick={() => {
                              const idx = playlistItems.findIndex(p => p.id === m.id);
                              if (idx !== -1) handlePlayTrack(idx);
                              setSearchQuery('');
                            }}
                            className="w-full flex items-center gap-3 p-3 bg-white hover:bg-gray-50 text-left transition-colors"
                          >
                            <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500 shrink-0">
                              <Music size={16} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-[11px] font-bold text-gray-800 truncate">{m.field2 || 'Audio HW'}</h4>
                              <p className="text-[9px] text-gray-400 line-clamp-1 italic uppercase font-black tracking-tighter">Audio HW / MP3</p>
                            </div>
                            <ChevronRight size={14} className="text-gray-300" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-6 text-center">
                  <p className="text-xs text-gray-500 font-medium">
                    Tidak ada materi, video, atau audio yang cocok dengan &quot;{searchQuery}&quot;
                  </p>
                </div>
              )}

              <div className="p-3 bg-hw-green/5 border-t border-hw-green/10 flex items-center justify-between">
                <p className="text-[10px] text-gray-500 font-medium">Ingin lihat semua materi?</p>
                <button 
                  type="button"
                  onClick={() => {
                    navigate('/materi');
                    setSearchQuery('');
                  }}
                  className="text-[10px] font-bold text-hw-green hover:underline flex items-center gap-1"
                >
                  Buka Halaman Materi <ChevronRight size={12} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* Main Menu Grid */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <LayoutGrid size={18} className="text-hw-green" />
            <h3 className="font-display font-bold text-gray-800">Menu Utama</h3>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <MenuCard to="/about" icon={UserIcon} label="Profil HW" color="bg-amber-500" />
          <MenuCard to="/gallery" icon={ImageIcon} label="Galeri" color="bg-pink-500" />
          <MenuCard to="/playlist" icon={Music} label="Musik" color="bg-rose-500" />
          <MenuCard to="/materi" icon={BookOpen} label="Materi HW" color="bg-hw-green" />
          <MenuCard to="/kegiatan" icon={Calendar} label="Kegiatan" color="bg-cyan-600" />
          <MenuCard onClick={() => setShowTrainingModal(true)} icon={GraduationCap} label="Pelatihan" color="bg-orange-500" />
          <MenuCard to={isAuthenticated ? "/kta" : "/register"} icon={CreditCard} label="KTA Digital" color="bg-purple-600" />
          <MenuCard onClick={() => setShowSosmedModal(true)} icon={Share2} label="Sosmed" color="bg-blue-500" />
          <MenuCard onClick={() => setShowContactModal(true)} icon={Phone} label="Kontak" color="bg-teal-600" />
        </div>
      </section>

      {/* Member Dashboard Section */}
      {isAuthenticated && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-bold text-gray-800">Dasbor Anggota</h3>
          </div>
          
          <div className="grid grid-cols-4 gap-2.5">
            <MenuCard to="/materi" state={{ filter: 'umum' }} icon={BookOpen} label="Umum" color="bg-hw-green" />
            <MenuCard to="/materi" state={{ filter: 'sugli' }} icon={Shield} label="Sugli" color="bg-orange-500" />
            <MenuCard to="/materi" state={{ filter: 'kwarda' }} icon={MapPin} label="Kwarda" color="bg-blue-500" />
            <MenuCard to="/pelatihan" icon={GraduationCap} label="Pelatihan" color="bg-emerald-700" />
            {(user?.role === 'admin' || user?.role === 'superadmin') && (
              <MenuCard to="/admin" icon={Shield} label="Admin" color="bg-hw-dark" />
            )}
            <MenuCard to="/upgrade" icon={Award} label="Upgrade" color="bg-cyan-500" />
            <MenuCard to="/profile" icon={Users} label="Profil" color="bg-rose-500" />
            <MenuCard to="/kta" icon={CreditCard} label="KTA Digital" color="bg-emerald-600" />
          </div>
        </section>
      )}

      {/* Gallery Section Preview */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Video size={18} className="text-hw-green" />
            <h3 className="font-display font-bold text-gray-800">Galeri Video</h3>
          </div>
          <Link to="/gallery" className="text-[10px] font-black text-hw-green uppercase tracking-widest flex items-center gap-1 group">
            Lihat Semua <ChevronRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
        
        <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar snap-x">
          <VideoPreview />
        </div>
      </section>

      {/* Playlist Section Preview */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Music size={18} className="text-hw-green" />
            <h3 className="font-display font-bold text-hw-dark">Playlist Lagu HW</h3>
          </div>
          <Link to="/playlist" className="text-[10px] font-black text-hw-green uppercase tracking-widest flex items-center gap-1 group">
            Layar Penuh <ChevronRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
        <PlaylistPreview />
      </section>

      {/* Banner Section - Semarak HW Jateng */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-teal-600" />
            <h3 className="font-display font-bold text-gray-800">Semarak HW Jateng</h3>
          </div>
        </div>

        <div className="space-y-2.5 px-1">
          {/* 1. Banner Pelatihan HW Jateng */}
          <button 
            onClick={() => setShowTrainingModal(true)}
            className="w-full text-left flex items-center justify-between bg-gradient-to-r from-emerald-600 via-teal-500 to-sky-500 text-white py-3 px-3.5 rounded-2xl shadow-md shadow-teal-600/15 hover:shadow-lg transition-all border border-white/20 hover:scale-[1.01] active:scale-[0.99] duration-200 cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-xl text-white border border-white/20 shrink-0">
                <GraduationCap size={18} />
              </div>
              <div className="text-left space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <h4 className="text-xs font-black uppercase tracking-wider font-display text-white">
                    Pelatihan HW Jateng
                  </h4>
                  <span className="bg-white text-teal-800 text-[8px] font-black uppercase px-1.5 py-0.5 rounded-md leading-none tracking-wider">
                    Resmi
                  </span>
                </div>
                <p className="text-[9px] text-emerald-100 font-semibold leading-none">
                  Jaya Melati 1, 2, Jaya Matahari 1 dan Jaya Pertiwi
                </p>
              </div>
            </div>
            <ChevronRight size={16} className="text-emerald-100 shrink-0" />
          </button>

          {/* 2. Banner KTA Digital HW Jateng */}
          <Link 
            to={isAuthenticated ? "/kta" : "/register"} 
            className="flex items-center justify-between bg-gradient-to-r from-emerald-600 via-teal-500 to-sky-500 text-white py-3 px-3.5 rounded-2xl shadow-md shadow-teal-600/15 hover:shadow-lg transition-all border border-white/20 hover:scale-[1.01] active:scale-[0.99] duration-200"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-xl text-white border border-white/20 shrink-0">
                <CreditCard size={18} />
              </div>
              <div className="text-left space-y-0.5">
                <h4 className="text-xs font-black uppercase tracking-wider text-white">KTA Digital HW Jateng</h4>
                <p className="text-[9px] text-emerald-100 font-semibold leading-none">Syarat Utama mengakses Materi Umum HW</p>
              </div>
            </div>
            <ChevronRight size={16} className="text-emerald-100 shrink-0" />
          </Link>

          {/* 3. Banner Pelatih Nasional HW Jateng */}
          <Link 
            to="/pelatih-nasional" 
            className="flex items-center justify-between bg-gradient-to-r from-emerald-600 via-teal-500 to-sky-500 text-white py-3 px-3.5 rounded-2xl shadow-md shadow-teal-600/15 hover:shadow-lg transition-all border border-white/20 hover:scale-[1.01] active:scale-[0.99] duration-200"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-xl text-white border border-white/20 shrink-0">
                <Award size={18} />
              </div>
              <div className="text-left space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <h4 className="text-xs font-black uppercase tracking-wider font-display text-white">
                    Pelatih Nasional HW Jateng
                  </h4>
                  <span className="bg-white text-teal-800 text-[8px] font-black uppercase px-1.5 py-0.5 rounded-md leading-none tracking-wider">
                    Direktori
                  </span>
                </div>
                <p className="text-[9px] text-emerald-100 font-bold leading-none">
                  Data Pelatih Kategori Jaya Matahari 1 & 2
                </p>
              </div>
            </div>
            <ChevronRight size={16} className="text-emerald-100 shrink-0" />
          </Link>

          {/* 4. Banner Kegiatan HW Jateng */}
          <Link 
            to="/kegiatan" 
            className="flex items-center justify-between bg-gradient-to-r from-emerald-600 via-teal-500 to-sky-500 text-white py-3 px-3.5 rounded-2xl shadow-md shadow-teal-600/15 hover:shadow-lg transition-all border border-white/20 hover:scale-[1.01] active:scale-[0.99] duration-200"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-xl text-white border border-white/20 shrink-0">
                <Calendar size={18} />
              </div>
              <div className="text-left space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <h4 className="text-xs font-black uppercase tracking-wider font-display text-white">Kegiatan HW Jateng</h4>
                  <span className="bg-white text-teal-800 text-[8px] font-black uppercase px-1.5 py-0.5 rounded-md leading-none tracking-wider">
                    Terbaru
                  </span>
                </div>
                <p className="text-[9px] text-emerald-100 font-semibold leading-none">Rapat, Silaturahmi, Pelatihan, Perkemahan, dll</p>
              </div>
            </div>
            <ChevronRight size={16} className="text-emerald-100 shrink-0" />
          </Link>
        </div>

        {/* Real-time Agenda & Kegiatan Terbaru Cards on Beranda */}
        {activitiesList && activitiesList.filter(a => a.isPublished !== false && !isOnlyTrainingActivity(a)).length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-100 space-y-2.5">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-1.5">
                <Calendar size={15} className="text-emerald-600" />
                <h4 className="text-xs font-black uppercase tracking-wider text-gray-800 font-display">Agenda & Kegiatan Terbaru</h4>
              </div>
              <Link to="/kegiatan" className="text-[10px] font-bold text-teal-600 hover:text-teal-700 flex items-center gap-0.5">
                Lihat Semua <ChevronRight size={12} />
              </Link>
            </div>

            <div className="space-y-2.5">
              {sortActivitiesNewestFirst(activitiesList.filter(a => a.isPublished !== false && !isOnlyTrainingActivity(a))).slice(0, 3).map((act: any, idx: number) => {
                const title = act.namaKegiatan || act.title || `Kegiatan HW ${idx + 1}`;
                const loc = act.lokasi || act.location || 'Jawa Tengah';
                const date = act.tanggal || act.startDate || 'Segera';
                const rawImg = act.gambarUrl || act.imageUrl || act.gambar || act.posterUrl || act.coverImage;
                const img = rawImg ? (getDriveDirectLink(rawImg) || rawImg) : '';
                const cat = act.kategori || act.category || 'Silaturahmi';

                const pCount = homeActivityParticipantCountMap[act.id] || 0;

                return (
                  <div key={act.id || idx} className="bg-white rounded-2xl p-3.5 border border-gray-100 shadow-xs hover:border-emerald-300 transition-all space-y-2.5">
                    {img && (
                      <div className="h-32 w-full rounded-xl overflow-hidden bg-gray-100 relative">
                        <img 
                          src={img} 
                          alt={title} 
                          loading="lazy"
                          decoding="async"
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover" 
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1510312305653-8ed496efae75?auto=format&fit=crop&q=80&w=800';
                          }}
                        />
                        <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-md text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-lg border border-white/20">
                          {cat}
                        </div>
                        {act.status && (
                          <div className={cn(
                            "absolute top-2 right-2 text-[9px] font-black uppercase px-2 py-0.5 rounded-lg border shadow-xs",
                            act.status === 'Buka' ? "bg-emerald-500 text-white border-emerald-400" : "bg-gray-800/80 text-white border-gray-600"
                          )}>
                            {act.status}
                          </div>
                        )}
                      </div>
                    )}
                    <div className="space-y-1">
                      {!img && (
                        <div className="flex items-center gap-2 mb-1">
                          <span className="bg-emerald-100 text-emerald-800 text-[9px] font-black uppercase px-2 py-0.5 rounded-md">
                            {cat}
                          </span>
                          {act.status && (
                            <span className={cn(
                              "text-[9px] font-black uppercase px-2 py-0.5 rounded-md",
                              act.status === 'Buka' ? "bg-emerald-500 text-white" : "bg-gray-200 text-gray-700"
                            )}>
                              {act.status}
                            </span>
                          )}
                        </div>
                      )}
                      <h5 className="text-xs font-black text-gray-800 leading-snug font-display line-clamp-2">
                        {title}
                      </h5>
                      {act.deskripsi && (
                        <p className="text-[11px] text-gray-500 line-clamp-2 leading-relaxed font-medium">
                          {act.deskripsi}
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[10px] font-bold text-gray-600 bg-gray-50 p-2 rounded-xl">
                      <div className="flex items-center gap-1 truncate">
                        <MapPin size={12} className="text-emerald-600 shrink-0" />
                        <span className="truncate">{loc}</span>
                      </div>
                      <div className="flex items-center gap-1 truncate">
                        <Calendar size={12} className="text-teal-600 shrink-0" />
                        <span className="truncate">{date}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[10px] font-extrabold bg-emerald-50/80 px-2.5 py-1.5 rounded-xl border border-emerald-100 text-emerald-800">
                      <div className="flex items-center gap-1.5">
                        <Users size={13} className="text-emerald-600" />
                        <span>Jumlah Pendaftar Realtime:</span>
                      </div>
                      <span className="bg-emerald-600 text-white px-2 py-0.5 rounded-md text-[10px]">
                        {pCount} Orang
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        navigate('/kegiatan', { state: { selectedActivityId: act.id, openDetail: true, activity: act } });
                      }}
                      className="w-full py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl text-[11px] font-black uppercase tracking-wider flex items-center justify-center gap-1 shadow-xs hover:from-emerald-700 hover:to-teal-700 active:scale-[0.99] transition-all cursor-pointer"
                    >
                      Buka Detail & Pendaftaran <ChevronRight size={13} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>

      {/* Tools Section */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles size={18} className="text-hw-green" />
          <h3 className="font-display font-bold text-gray-800">Fitur Tambahan</h3>
        </div>
        <div className="grid grid-cols-1 gap-2">
          <FeatureCard to="/quran" icon={Book} label="Al-Qur'an (Api Kemenag)" />
          <FeatureCard to="/tools?type=morse" icon={Zap} label="Translate Morse" />
          <FeatureCard to="/tools?type=semafor" icon={Share2} label="Translate Semafor" />
          <FeatureCard to="/tools?type=translate" icon={Languages} label="Translate Bahasa" />
        </div>
      </section>

      {/* Centered Floating Audio Player Modal */}
      <AnimatePresence>
        {currentTrackIndex !== null && playlistItems[currentTrackIndex] && (
          <motion.div 
            key="home-audio-player-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            {/* Background dismiss click listener */}
            <div 
              className="absolute inset-0"
              onClick={handleClosePlayer}
            />

            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full max-w-sm pointer-events-auto"
            >
              {(() => {
                const currentMeta = resolveTrackMetadata(playlistItems[currentTrackIndex]);
                return (
                  <div className="bg-linear-to-b from-slate-900 via-slate-950 to-emerald-950 text-white p-6 rounded-3xl shadow-2xl shadow-black/80 border border-emerald-500/30 relative overflow-hidden">
                    
                    {/* Background glow & disc watermarks */}
                    <div className="absolute -right-8 -top-8 w-40 h-40 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
                    
                    {/* Top Header: Badge & Close Button */}
                    <div className="flex items-center justify-between gap-2 mb-4 relative z-10">
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-black uppercase tracking-wider border border-emerald-500/30">
                        <Radio size={11} className={isPlaying ? 'animate-pulse text-emerald-400' : ''} />
                        <span>{isPlaying ? 'Sedang Diputar' : 'Musik HW'}</span>
                      </div>

                      {/* Close 'X' button to dismiss */}
                      <button 
                        type="button"
                        onClick={handleClosePlayer}
                        className="w-8 h-8 rounded-full bg-white/10 hover:bg-rose-500 text-gray-300 hover:text-white flex items-center justify-center transition-all cursor-pointer border border-white/10 shadow-md active:scale-90"
                        title="Tutup Pemutar Musik"
                      >
                        <X size={16} />
                      </button>
                    </div>

                    {/* Disc Vinyl Cover & Visualizer */}
                    <div className="flex flex-col items-center text-center my-3 relative z-10">
                      <div className="relative my-2">
                        <div className={`w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-linear-to-br ${currentMeta.theme.gradient} flex items-center justify-center text-white shadow-2xl border-4 border-slate-800 ring-2 ring-emerald-500/30 relative overflow-hidden`}>
                          <Disc size={54} className={isPlaying ? 'animate-spin-slow' : ''} />
                          {/* Center hole of vinyl */}
                          <div className="absolute w-6 h-6 rounded-full bg-slate-950 border-2 border-white/40 flex items-center justify-center">
                            <div className="w-2 h-2 rounded-full bg-hw-yellow" />
                          </div>
                        </div>
                      </div>

                      {/* Title & Category */}
                      <h3 className="text-base sm:text-lg font-display font-black text-white px-2 mt-2 line-clamp-2 leading-tight">
                        {currentMeta.title}
                      </h3>

                      {/* Prominent Creator Display */}
                      <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-950/90 text-emerald-300 text-xs font-bold border border-emerald-500/40 shadow-xs">
                        <Sparkles size={12} className="text-amber-400 shrink-0" />
                        <span className="text-emerald-400 font-extrabold uppercase tracking-wider text-[10px]">Cipt:</span>
                        <span className="text-white font-black truncate max-w-[200px]">
                          {currentMeta.creator}
                        </span>
                      </div>
                    </div>

                    {/* Equalizer animation when playing */}
                    {isPlaying && (
                      <div className="flex justify-center items-end gap-1 h-4 my-2">
                        {[0.4, 0.7, 0.3, 0.9, 0.5, 0.8, 0.6].map((h, i) => (
                          <motion.div
                            key={i}
                            animate={{ height: ['25%', '100%', '30%'] }}
                            transition={{ repeat: Infinity, duration: h + 0.3, delay: i * 0.1 }}
                            className="w-1 bg-hw-yellow rounded-full"
                          />
                        ))}
                      </div>
                    )}

                    {/* Playback Controls */}
                    <div className="flex items-center justify-center gap-2.5 sm:gap-3 mt-4 pt-4 border-t border-white/10 relative z-10">
                      {/* Auto play toggle */}
                      <button 
                        type="button"
                        onClick={() => setAutoPlayEnabled(!autoPlayEnabled)}
                        className={`p-2 rounded-xl transition-all cursor-pointer ${
                          autoPlayEnabled ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'text-gray-400 hover:text-white bg-white/5'
                        }`}
                        title={autoPlayEnabled ? "Putar Otomatis: Aktif" : "Putar Otomatis: Nonaktif"}
                      >
                        <RefreshCw size={14} className={autoPlayEnabled ? 'animate-spin-slow' : ''} />
                      </button>

                      {/* Prev */}
                      <button 
                        type="button"
                        onClick={handlePrevTrack}
                        className="p-2 text-gray-300 hover:text-white active:scale-90 transition-transform cursor-pointer"
                        title="Lagu Sebelumnya"
                      >
                        <SkipBack size={20} fill="currentColor" />
                      </button>

                      {/* Stop Button */}
                      <button 
                        type="button"
                        onClick={handleStopTrack}
                        className="w-10 h-10 bg-white/10 hover:bg-rose-500/80 active:scale-95 text-gray-300 hover:text-white rounded-full flex items-center justify-center border border-white/10 shadow-md transition-all cursor-pointer"
                        title="Hentikan Lagu (Stop)"
                      >
                        <Square size={16} fill="currentColor" />
                      </button>

                      {/* Main Play/Pause */}
                      <button 
                        type="button"
                        onClick={() => handlePlayTrack(currentTrackIndex)}
                        className="w-13 h-13 bg-hw-green hover:bg-emerald-400 active:scale-95 text-slate-950 rounded-full flex items-center justify-center shadow-xl shadow-emerald-500/30 transition-all cursor-pointer"
                        title={isPlaying ? "Jeda" : "Putar"}
                      >
                        {isPlaying ? (
                          <Pause size={22} fill="currentColor" />
                        ) : (
                          <Play size={22} fill="currentColor" className="ml-0.5" />
                        )}
                      </button>

                      {/* Next */}
                      <button 
                        type="button"
                        onClick={handleNextTrack}
                        className="p-2 text-gray-300 hover:text-white active:scale-90 transition-transform cursor-pointer"
                        title="Lagu Selanjutnya"
                      >
                        <SkipForward size={20} fill="currentColor" />
                      </button>

                      {/* Link to Full Playlist */}
                      <Link 
                        to="/playlist"
                        className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white transition-all cursor-pointer"
                        title="Buka Playlist Lengkap"
                      >
                        <Music size={14} />
                      </Link>
                    </div>

                  </div>
                );
              })()}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Video Modal Overlay */}
      {activeVideoId && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="relative w-full max-w-4xl flex flex-col gap-3">
            {/* Elegant Floating Close Button outside the iframe video space to prevent overlaps */}
            <div className="flex justify-end">
              <button 
                onClick={() => setActiveVideoId(null)}
                className="bg-white/10 hover:bg-white/20 active:scale-95 text-white px-4 py-2 rounded-full text-xs font-bold border border-white/10 transition-all flex items-center gap-1.5 backdrop-blur-sm shadow-md"
              >
                <span>Tutup</span>
                <X size={14} />
              </button>
            </div>
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full aspect-video bg-black rounded-2xl md:rounded-3xl overflow-hidden shadow-2xl relative border border-gray-800"
            >
              <iframe 
                width="100%" 
                height="100%" 
                src={`https://www.youtube.com/embed/${activeVideoId}?autoplay=1`} 
                title="YouTube video player" 
                frameBorder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                allowFullScreen 
                className="w-full h-full"
              />
            </motion.div>
          </div>
        </div>
      )}

      <audio 
        ref={audioRef}
        onEnded={handleAudioEnded}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onError={() => {
          setIsPlaying(false);
        }}
      />

      {/* Install App / Add to Home Screen Interactive Guide Modal */}
      <AnimatePresence>
        {showInstallModal && (
          <motion.div 
            key="home-install-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
          >
            <div className="absolute inset-0" onClick={() => setShowInstallModal(false)} />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-[2.25rem] border border-gray-100 max-w-sm w-full p-6 shadow-2xl relative space-y-4 z-10"
            >
              {/* Close Button */}
              <button 
                onClick={() => setShowInstallModal(false)}
                className="absolute right-4 top-4 p-2 text-gray-400 hover:text-gray-600 rounded-full bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>

              <div className="text-center space-y-1 pt-2">
                <div className="w-12 h-12 bg-hw-green/10 text-hw-green rounded-2xl flex items-center justify-center mx-auto mb-2">
                  <Smartphone size={24} />
                </div>
                <h3 className="font-display font-black text-gray-800 text-sm tracking-tight">Simpan di Layar Utama HP</h3>
                <p className="text-[10.5px] text-gray-500 font-medium">Buka SATU HW JATENG langsung dari layar HP Anda seperti aplikasi bawaan</p>
              </div>

              {/* Device Selector Tabs */}
              <div className="grid grid-cols-2 p-1 bg-gray-50 rounded-2xl border border-gray-100">
                <button
                  onClick={() => setActiveDeviceTab('android')}
                  className={cn(
                    "py-2 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all",
                    activeDeviceTab === 'android' ? "bg-white text-hw-green shadow-xs" : "text-gray-400 hover:text-gray-600"
                  )}
                >
                  Android
                </button>
                <button
                  onClick={() => setActiveDeviceTab('ios')}
                  className={cn(
                    "py-2 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all",
                    activeDeviceTab === 'ios' ? "bg-white text-hw-green shadow-xs" : "text-gray-400 hover:text-gray-600"
                  )}
                >
                  iPhone / iOS
                </button>
              </div>

              {/* Instructions Content */}
              <div className="space-y-3.5 py-1">
                {activeDeviceTab === 'android' ? (
                  <div className="space-y-3">
                    <div className="flex gap-3 items-start">
                      <div className="w-5 h-5 bg-hw-green/10 text-hw-green rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">1</div>
                      <p className="text-[11px] text-gray-600 leading-normal font-medium text-left">
                        Buka browser <strong className="text-gray-800">Google Chrome</strong> di HP Anda.
                      </p>
                    </div>
                    <div className="flex gap-3 items-start">
                      <div className="w-5 h-5 bg-hw-green/10 text-hw-green rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">2</div>
                      <p className="text-[11px] text-gray-600 leading-normal font-medium text-left">
                        Klik tombol menu <strong className="text-gray-800">titik tiga (⋮)</strong> di pojok kanan atas layar.
                      </p>
                    </div>
                    <div className="flex gap-3 items-start">
                      <div className="w-5 h-5 bg-hw-green/10 text-hw-green rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">3</div>
                      <p className="text-[11px] text-gray-600 leading-normal font-medium text-left">
                        Pilih menu <strong className="text-gray-800">&quot;Tambahkan ke Layar Utama&quot;</strong> atau <strong className="text-gray-800">&quot;Instal Aplikasi&quot;</strong>.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex gap-3 items-start">
                      <div className="w-5 h-5 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">1</div>
                      <p className="text-[11px] text-gray-600 leading-normal font-medium text-left">
                        Buka browser <strong className="text-gray-800">Safari</strong> di iPhone Anda.
                      </p>
                    </div>
                    <div className="flex gap-3 items-start">
                      <div className="w-5 h-5 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">2</div>
                      <div className="text-[11px] text-gray-600 leading-normal font-medium flex flex-wrap items-center gap-1 text-left">
                        Tap tombol <strong className="text-gray-800">Bagikan (Share)</strong> 
                        <div className="inline-flex p-1 bg-gray-50 border border-gray-100 rounded-lg text-hw-blue"><Share size={12} /></div>
                        di bagian bawah layar.
                      </div>
                    </div>
                    <div className="flex gap-3 items-start">
                      <div className="w-5 h-5 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">3</div>
                      <p className="text-[11px] text-gray-600 leading-normal font-medium text-left">
                        Gulir ke bawah, lalu pilih menu <strong className="text-gray-800">&quot;Tambahkan ke Layar Utama&quot;</strong>.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm / Action button */}
              <button 
                onClick={() => setShowInstallModal(false)}
                className="w-full bg-hw-green hover:bg-hw-green/95 text-white font-black py-3 rounded-2xl text-[11px] uppercase tracking-wider shadow-md transition-all active:scale-[0.98] cursor-pointer"
              >
                Mengerti & Selesai
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal Jenis Pelatihan HW Jateng */}
      <AnimatePresence>
        {showTrainingModal && (
          <motion.div 
            key="home-training-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <div className="absolute inset-0" onClick={() => setShowTrainingModal(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl border border-gray-100 flex flex-col max-h-[85vh] relative z-10"
            >
              {/* Header */}
              <div className="p-5 bg-gradient-to-r from-emerald-600 via-teal-500 to-sky-500 text-white flex items-center justify-between relative">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-white/20 rounded-2xl text-white backdrop-blur-md">
                    <GraduationCap size={22} />
                  </div>
                  <div>
                    <h3 className="font-display font-black text-base uppercase tracking-wider">Jenis Pelatihan HW Jateng</h3>
                    <p className="text-[10px] text-emerald-100 font-medium">Diatur & dikelola resmi dari Dasbor Admin HW Jateng</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowTrainingModal(false)}
                  className="p-2 bg-white/20 hover:bg-white/30 rounded-full text-white transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Body */}
              <div className="p-5 space-y-4 overflow-y-auto flex-1">
                <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-3.5 flex items-start gap-3">
                  <CreditCard size={18} className="text-amber-600 shrink-0 mt-0.5" />
                  <div className="text-xs text-amber-900 leading-relaxed">
                    <span className="font-black block uppercase tracking-wider text-[10px] text-amber-700">Persyaratan Utama</span>
                    Peserta wajib memiliki <strong>KTA Digital HW Jateng</strong>. Jika belum punya akun, sistem akan otomatis mengarahkan ke pembuatan KTA terlebih dahulu.
                  </div>
                </div>

                <div className="space-y-3">
                  {activeTrainings.length > 0 ? (
                    activeTrainings.map((act: any, idx: number) => {
                      const title = act.namaKegiatan || act.jenisPelatihan || `Pelatihan HW ${idx + 1}`;
                      const loc = act.lokasiPelatihan || 'Pusdiklat HW Jateng';
                      const date = act.tanggalPelatihan || 'Jadwal Aktif';

                      return (
                        <div key={act.id || idx} className="bg-gray-50/80 rounded-2xl p-4 border border-gray-100 space-y-3 hover:border-amber-300 hover:bg-white transition-all shadow-xs">
                          <div className="flex items-start justify-between gap-2">
                            <div className="space-y-0.5">
                              <span className="inline-block px-2 py-0.5 bg-orange-100 text-orange-700 font-black text-[9px] rounded-md uppercase tracking-wider">
                                {act.jenisPelatihan || act.tingkatan || 'Jaya Melati'}
                              </span>
                              <h4 className="text-sm font-black text-gray-800 leading-snug font-display">{title}</h4>
                            </div>
                          </div>

                          {act.deskripsi && (
                            <p className="text-xs text-gray-500 leading-relaxed line-clamp-2 font-medium">
                              {act.deskripsi}
                            </p>
                          )}

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-bold text-gray-600 bg-white p-2.5 rounded-xl border border-gray-100">
                            <div className="flex items-center gap-1.5 truncate">
                              <MapPin size={13} className="text-amber-600 shrink-0" />
                              <span className="truncate">{loc}</span>
                            </div>
                            <div className="flex items-center gap-1.5 truncate">
                              <Calendar size={13} className="text-emerald-600 shrink-0" />
                              <span className="truncate">{date}</span>
                            </div>
                          </div>

                          <button
                            onClick={() => handleSelectTrainingForRegistration(act)}
                            className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-md shadow-teal-600/15 flex items-center justify-center gap-1.5 cursor-pointer active:scale-98 transition-all"
                          >
                            <GraduationCap size={16} /> Daftar Pelatihan Ini <ChevronRight size={14} />
                          </button>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-8 px-4 bg-gray-50 rounded-2xl border border-dashed border-gray-200 space-y-2">
                      <GraduationCap className="mx-auto text-gray-300" size={40} />
                      <p className="text-xs font-bold text-gray-700">Belum Ada Pelatihan Aktif</p>
                      <p className="text-[11px] text-gray-500 max-w-xs mx-auto">
                        Saat ini belum ada data kegiatan pelatihan yang dibuka. Silakan tunggu informasi pembukaan pendaftaran dari Admin HW Jateng.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal Syarat KTA Otomatis */}
      <AnimatePresence>
        {showRequirementModal && (
          <motion.div 
            key="home-req-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <div className="absolute inset-0" onClick={() => setShowRequirementModal(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl border border-gray-100 p-6 space-y-5 text-center relative z-10"
            >
              <button
                onClick={() => setShowRequirementModal(false)}
                className="absolute top-4 right-4 p-1.5 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-500 transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>

              <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-amber-500 text-white rounded-3xl flex items-center justify-center mx-auto shadow-lg shadow-orange-500/20 border border-amber-300/30">
                <CreditCard size={30} />
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-black text-gray-800 font-display">
                  Persyaratan KTA HW Digital
                </h3>
                <p className="text-xs text-gray-600 leading-relaxed font-medium">
                  Untuk mendaftar <strong className="text-gray-900">{selectedTrainingForReg?.namaKegiatan || selectedTrainingForReg?.jenisPelatihan || 'Pelatihan HW'}</strong>, Anda wajib memiliki Kartu Tanda Anggota (KTA) Digital HW Jateng terlebih dahulu.
                </p>
              </div>

              <div className="space-y-2.5 pt-1">
                <button
                  onClick={() => {
                    setShowRequirementModal(false);
                    navigate('/register', { state: { redirectTo: '/daftar-pelatihan', activity: selectedTrainingForReg } });
                  }}
                  className="w-full py-3.5 bg-gradient-to-r from-hw-green to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white rounded-2xl text-xs font-black uppercase tracking-wider shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-98 transition-all"
                >
                  <UserPlus size={16} /> Belum Punya Akun? Buat KTA & Akun
                </button>

                <button
                  onClick={() => {
                    setShowRequirementModal(false);
                    navigate('/login', { state: { redirectTo: '/daftar-pelatihan', activity: selectedTrainingForReg } });
                  }}
                  className="w-full py-3.5 bg-white hover:bg-orange-50/50 text-orange-600 border border-orange-200 rounded-2xl text-xs font-extrabold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-all"
                >
                  <LogIn size={16} className="text-orange-500" /> Sudah Punya Akun? Login & Daftar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal Social Media HW */}
      <AnimatePresence>
        {showSosmedModal && (
          <motion.div 
            key="home-sosmed-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <div className="absolute inset-0" onClick={() => setShowSosmedModal(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl border border-gray-100 flex flex-col max-h-[85vh] relative z-10"
            >
              {/* Header */}
              <div className="p-5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white flex items-center justify-between relative">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-white/20 rounded-2xl text-white backdrop-blur-md">
                    <Share2 size={22} />
                  </div>
                  <div>
                    <h3 className="font-display font-black text-base uppercase tracking-wider">Media Sosial HW</h3>
                    <p className="text-[10px] text-blue-100 font-medium">Akun Resmi Hizbul Wathan Jawa Tengah</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowSosmedModal(false)}
                  className="p-2 bg-white/20 hover:bg-white/30 rounded-full text-white transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Body */}
              <div className="p-5 space-y-4 overflow-y-auto flex-1">
                <div className="grid grid-cols-1 gap-3">
                  {[
                    { 
                      name: 'Instagram', 
                      handle: sosmed?.field1 || '@hw_pusat', 
                      icon: Instagram, 
                      color: 'bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-500', 
                      link: (typeof sosmed?.field1 === 'string' && sosmed.field1.startsWith('http')) ? sosmed.field1 : `https://instagram.com/${String(sosmed?.field1 || 'hw_pusat').replace('@', '')}` 
                    },
                    { 
                      name: 'Tiktok', 
                      handle: sosmed?.field2 || '@hw_pusat', 
                      icon: Share2, 
                      color: 'bg-black', 
                      link: (typeof sosmed?.field2 === 'string' && sosmed.field2.startsWith('http')) ? sosmed.field2 : `https://tiktok.com/@${String(sosmed?.field2 || 'hw_pusat').replace('@', '')}` 
                    },
                    { 
                      name: 'YouTube', 
                      handle: sosmed?.field3 || 'Hizbul Wathan TV', 
                      icon: Youtube, 
                      color: 'bg-red-600', 
                      link: (typeof sosmed?.field3 === 'string' && sosmed.field3.startsWith('http')) ? sosmed.field3 : `https://youtube.com/channel/${sosmed?.field3 || ''}` 
                    },
                  ].map((item) => (
                    <a
                      key={item.name}
                      href={item.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 bg-gray-50/80 p-3.5 rounded-2xl border border-gray-100 hover:border-blue-300 hover:bg-white transition-all shadow-xs group"
                    >
                      <div className={`w-11 h-11 rounded-xl ${item.color} text-white flex items-center justify-center shadow-md shrink-0`}>
                        <item.icon size={22} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-gray-800 text-xs">{item.name}</h4>
                        <p className="text-[11px] text-gray-400 font-medium truncate">{item.handle}</p>
                      </div>
                      <div className="text-gray-300 group-hover:text-blue-600 transition-colors">
                        <ChevronRight size={18} />
                      </div>
                    </a>
                  ))}
                </div>

                <div className="p-4 bg-gray-900 rounded-2xl text-center space-y-3">
                  <h4 className="text-white font-display font-bold text-xs">Join Community HW Jateng</h4>
                  <p className="text-gray-400 text-[11px] leading-relaxed">
                    Dapatkan info terbaru seputar kegiatan & materi HW langsung di WhatsApp.
                  </p>
                  <a
                    href={sosmed?.field4 || 'https://chat.whatsapp.com/'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2.5 bg-gradient-to-r from-hw-green to-emerald-600 text-white font-bold text-xs rounded-xl shadow-lg flex items-center justify-center gap-2 active:scale-98 transition-all"
                  >
                    <MessageCircle size={16} /> Gabung Grup WhatsApp
                  </a>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal Kontak & Hubungi Kami */}
      <AnimatePresence>
        {showContactModal && (
          <motion.div 
            key="home-contact-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <div className="absolute inset-0" onClick={() => setShowContactModal(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl border border-gray-100 flex flex-col max-h-[85vh] relative z-10"
            >
              {/* Header */}
              <div className="p-5 bg-gradient-to-r from-slate-800 via-gray-800 to-slate-900 text-white flex items-center justify-between relative">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-white/10 rounded-2xl text-white backdrop-blur-md">
                    <Phone size={22} />
                  </div>
                  <div>
                    <h3 className="font-display font-black text-base uppercase tracking-wider">Hubungi Kami</h3>
                    <p className="text-[10px] text-gray-300 font-medium">Layanan Informasi Hizbul Wathan Jateng</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowContactModal(false)}
                  className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Body */}
              <div className="p-5 space-y-4 overflow-y-auto flex-1">
                <div className="space-y-2.5">
                  <a
                    href={`https://wa.me/${String(kontak?.field2 || '').replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 bg-gray-50/80 p-3.5 rounded-2xl border border-gray-100 hover:border-emerald-400 hover:bg-white transition-all shadow-xs group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-md shrink-0">
                      <MessageCircle size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-wider">WhatsApp Admin</p>
                      <p className="text-xs font-bold text-gray-800 truncate">{kontak?.field2 || "+62 812-3456-7890"}</p>
                    </div>
                    <div className="text-gray-300 group-hover:text-emerald-600 transition-colors">
                      <ChevronRight size={18} />
                    </div>
                  </a>

                  <div className="flex items-center gap-3 bg-gray-50/80 p-3.5 rounded-2xl border border-gray-100 shadow-xs">
                    <div className="w-10 h-10 rounded-xl bg-blue-500 text-white flex items-center justify-center shadow-md shrink-0">
                      <Phone size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-wider">Nama Kontak</p>
                      <p className="text-xs font-bold text-gray-800 truncate">{kontak?.field1 || "Admin HW Jateng"}</p>
                    </div>
                  </div>

                  {kontak?.field3 && (
                    <a
                      href={(typeof kontak.field3 === 'string' && kontak.field3.startsWith('http')) ? kontak.field3 : `https://${kontak.field3}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 bg-gray-50/80 p-3.5 rounded-2xl border border-gray-100 hover:border-blue-400 hover:bg-white transition-all shadow-xs group"
                    >
                      <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shrink-0">
                        <Globe size={20} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-wider">Website Resmi</p>
                        <p className="text-xs font-bold text-gray-800 truncate">{kontak.field3}</p>
                      </div>
                      <div className="text-gray-300 group-hover:text-blue-600 transition-colors">
                        <ChevronRight size={18} />
                      </div>
                    </a>
                  )}
                </div>

                <div className="bg-hw-dark p-5 rounded-2xl text-white space-y-3 relative overflow-hidden shadow-lg">
                  <div className="relative z-10 space-y-2 text-center">
                    <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center mx-auto text-amber-400">
                      <MapPin size={22} />
                    </div>
                    <div>
                      <h4 className="text-xs font-display font-bold">Kwarwil HW Jateng</h4>
                      <p className="text-[10px] text-white/70 leading-relaxed mt-0.5">
                        Jl. Singosari No.33, Wonodri, Kec. Semarang Sel., Kota Semarang, Jawa Tengah 50242
                      </p>
                    </div>
                    <a
                      href="https://maps.google.com/?q=Jl.+Singosari+No.33+Wonodri+Semarang"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block px-4 py-2 bg-white text-hw-dark font-bold text-[10px] rounded-lg shadow-sm hover:scale-105 transition-transform"
                    >
                      Buka di Google Maps
                    </a>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

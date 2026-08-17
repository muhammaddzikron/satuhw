import { safeStorageSet } from '../utils/safeStorage';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { KTACard } from '../components/KTACard';
import { formatTempatTanggalLahir, cleanTempatLahir } from '../lib/utils';
import { isOnlyTrainingActivity, isParticipantOfActivity, sortActivityAppsByDate } from '../utils/activityUtils';
import { syncRolesAndPelatihan, PELATIHAN_OPTIONS, isPelatihanSelected, normalizeTrainingKey } from '../utils/trainingUtils';

const getCurrentIndonesianDate = (): string => {
  const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  const d = new Date();
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
};

const formatIndonesianDate = (dateStr?: string, fallbackToCurrent: boolean = false): string => {
  if (!dateStr || dateStr === '-' || dateStr === 'null' || dateStr === 'undefined') {
    return fallbackToCurrent ? getCurrentIndonesianDate() : '-';
  }

  if (dateStr.includes('T')) {
    const parsed = new Date(dateStr);
    if (!isNaN(parsed.getTime())) {
      try {
        return new Intl.DateTimeFormat('id-ID', {
          timeZone: 'Asia/Jakarta',
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        }).format(parsed);
      } catch {
        // fallback
      }
    }
  }

  const cleanStr = dateStr.split('T')[0].split(' ')[0].trim();
  const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

  if (cleanStr.match(/^\d{4}[-/]\d{1,2}[-/]\d{1,2}$/)) {
    const parts = cleanStr.split(/[-/]/);
    const year = parts[0];
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    if (month >= 0 && month < 12 && !isNaN(day)) {
      return `${day} ${months[month]} ${year}`;
    }
  }

  if (cleanStr.match(/^\d{1,2}[-/]\d{1,2}[-/]\d{4}$/)) {
    const parts = cleanStr.split(/[-/]/);
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const year = parts[2];
    if (month >= 0 && month < 12 && !isNaN(day)) {
      return `${day} ${months[month]} ${year}`;
    }
  }

  const d = new Date(dateStr);
  if (!isNaN(d.getTime())) {
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
  }

  return cleanStr;
};

const DefaultSignatureKetua = () => (
  <svg viewBox="0 0 100 40" className="w-16 h-8 text-blue-700 opacity-80" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 25c10-2 20-15 25-15s5 20 15 5c5-5 15-10 20-5c5 5-2 15 5 15c5 0 15-10 20-15" />
    <path d="M15 18c15 0 35 12 50 12" />
  </svg>
);

const DefaultSignatureSekretaris = () => (
  <svg viewBox="0 0 100 40" className="w-16 h-8 text-blue-700 opacity-80" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 15c5 15 15 20 25 10c10-10 5-20 15-5s10 15 20 5s10-15 15-5" />
    <path d="M10 22c15 2 30-5 45-2" />
  </svg>
);

const DefaultStempel = ({ idSuffix }: { idSuffix: string }) => (
  <svg viewBox="0 0 100 100" className="w-10 h-10 text-blue-600/85 font-black uppercase tracking-wider relative rotate-[-12deg]">
    <circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" strokeWidth="1.5" />
    <circle cx="50" cy="50" r="41" fill="none" stroke="currentColor" strokeWidth="0.75" />
    <g transform="translate(50,50) scale(0.65)">
      <circle cx="0" cy="0" r="10" fill="none" stroke="currentColor" strokeWidth="1" />
      {[...Array(12)].map((_, i) => (
        <path key={i} d="M0 -15 L3 -25 L0 -21 L-3 -25 Z" fill="currentColor" transform={`rotate(${i * 30})`} />
      ))}
    </g>
    <path id={`stamp-path-top-${idSuffix}`} d="M 12 50 A 38 38 0 1 1 88 50" fill="none" stroke="none" />
    <path id={`stamp-path-bottom-${idSuffix}`} d="M 88 50 A 38 38 0 1 1 12 50" fill="none" stroke="none" />
    <text className="text-[6.5px] fill-current font-bold" letterSpacing="1.2">
      <textPath href={`#stamp-path-top-${idSuffix}`} startOffset="50%" textAnchor="middle">KWARWIL JAWA TENGAH</textPath>
    </text>
    <text className="text-[6.5px] fill-current font-bold" letterSpacing="1.2">
      <textPath href={`#stamp-path-bottom-${idSuffix}`} startOffset="50%" textAnchor="middle">HIZBUL WATHAN</textPath>
    </text>
  </svg>
);
import { TRAINING_PROGRAMS, DEFAULT_JATI1_36_MATERI } from './PelatihanPage';

const getNormalizedLevelKey = (str?: string): 'jati1' | 'jati2' | 'jari1' => {
  if (!str) return 'jati1';
  const clean = str.toLowerCase().trim();
  if (clean.includes('jati 2') || clean.includes('jati2') || clean.includes('jaya melati 2')) return 'jati2';
  if (clean.includes('jari 1') || clean.includes('jari1') || clean.includes('jaya rintisan 1') || clean.includes('jaya matahari 1')) return 'jari1';
  if (clean.includes('jati 1') || clean.includes('jati1') || clean.includes('jaya melati 1')) return 'jati1';
  return 'jati1';
};

const isApprovedParticipant = (app: any): boolean => {
  if (!app) return false;
  const st = (app.status || '').toLowerCase().trim();
  const kelulusan = (app.statusKelulusan || '').toLowerCase().trim();
  if (st === 'approved' || st === 'disetujui' || st === 'lulus' || st === 'lulus bersyarat' || st === 'aktif') return true;
  if (kelulusan === 'lulus' || kelulusan === 'lulus bersyarat') return true;
  return false;
};

const isMatchTrainingLevel = (app: any, targetLevel: string): boolean => {
  if (!app) return false;
  const appLevelKey = getNormalizedLevelKey(app.pelatihanAkanDiikuti || app.jenisPelatihan || app.namaKegiatan);
  const targetLevelKey = getNormalizedLevelKey(targetLevel);
  return appLevelKey === targetLevelKey;
};

const isSessionPresent = (attObj: any, sesId: string): boolean => {
  if (!attObj) return false;
  let val = attObj[sesId];
  if (val === undefined) {
    const numMatch = sesId.match(/\d+/);
    if (numMatch) {
      const num = numMatch[0];
      val = attObj[`Sesi ${num}`] ?? attObj[`sesi_${num}`] ?? attObj[`Materi ${num}`] ?? attObj[`materi_${num}`];
    }
  }
  if (val === undefined || val === null) return false;
  if (typeof val === 'boolean') return val;
  if (typeof val === 'string') {
    return val === 'hadir' || val === 'true' || val === 'Hadir';
  }
  if (typeof val === 'object' && val !== null) {
    return val.status === 'hadir' || val.status === 'Hadir';
  }
  return false;
};

import { 
  Users, 
  QrCode,
  FileText,
  User as UserIcon,
  BookOpen, 
  Layout, 
  Settings, 
  BarChart3, 
  Search, 
  Filter, 
  ArrowUpDown,
  Plus, 
  MoreVertical,
  RefreshCw,
  CheckCircle,
  XCircle,
  ArrowUpRight,
  Shield,
  Trash2,
  Edit2,
  Download,
  FileSpreadsheet,
  Eye,
  Database,
  Globe,
  Camera,
  Share2,
  Phone,
  Heart,
  MessageCircle,
  CreditCard,
  MapPin,
  LogOut,
  X,
  Youtube,
  Instagram,
  ArrowLeft,
  Award,
  GraduationCap,
  Check,
  Bell,
  Info,
  Music,
  Printer,
  UserPlus,
  CheckCircle2,
  Copy,
  Save,
  AlertTriangle,
  Pencil,
  Loader2,
  Image as ImageIcon,
  Calendar,
  Edit,
  Upload,
  RotateCcw,
  Sparkles,
  Link as LinkIcon
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { Navigate, Link, useSearchParams } from 'react-router-dom';
import { sheetsService } from '../services/sheetsService';
import { firestoreService, parseRolesField } from '../services/firestoreService';
import { User, Materi, Content } from '../types';
import LoadingPage from './LoadingPage';
import { cn, safeJsonParse, getDriveDirectLink, getCorsSafeUrl, safeHtml2Canvas, safeCanvasToDataURL } from '../lib/utils';
import { formatAudioUrl, handleAudioFileUpload } from '../utils/audioUtils';
import { handleDocumentFileUpload, handleDownloadDocument } from '../utils/documentUtils';
import { ThemeSongPlayer } from '../components/ThemeSongPlayer';
import { resolveTrackMetadata } from '../data/playlistCatalog';
import { codeGsText } from '../services/codeGsText';
import { KWARDA_QABILAH_JATENG, compareKtaNumbers, compareByKtaSequence, resequenceKtaNumbers, ensureUniqueKtaNumbers, deduplicateMembers } from '../utils/ktaUtils';
export { KWARDA_QABILAH_JATENG };

const KABUPATEN_KOTA_JATENG = KWARDA_QABILAH_JATENG.map(item => item.name);

const StatCard = ({ label, value, icon: Icon, color, subValue }: { label: string, value: string | number, icon: any, color: string, subValue?: string }) => (
  <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between">
    <div className="space-y-1">
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{label}</p>
      <h4 className="text-2xl font-display font-black text-gray-800">{value}</h4>
      {subValue && <p className="text-[9px] text-gray-400 font-medium">{subValue}</p>}
    </div>
    <div className={`p-3 rounded-2xl ${color} text-white`}>
      <Icon size={20} />
    </div>
  </div>
);

const DetailStatCard = ({ label, value, color, onClick }: { label: string, value: number, color: string, onClick?: () => void }) => (
  <button 
    onClick={onClick}
    className={`p-3 rounded-2xl border border-gray-100 flex flex-col items-center justify-center transition-all hover:scale-105 active:scale-95 text-center group bg-white ${onClick ? 'cursor-pointer hover:shadow-lg' : ''}`}
  >
    <div className={`w-8 h-8 rounded-xl ${color} flex items-center justify-center text-white mb-2 shadow-sm group-hover:rotate-12 transition-transform`}>
      <Users size={16} />
    </div>
    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-tight">{label}</span>
    <span className="text-sm font-black text-gray-800">{value}</span>
  </button>
);

const ROLE_LABELS: Record<string, string> = {
  superadmin: 'Super Admin',
  admin: 'Admin Petugas',
  diklat: 'Admin Pelatih',
  admin_diklat: 'Admin Pelatih',
  kwarda: 'Kwarda HW',
  admin_kwarda: 'Kwarda HW',
  sugli: 'Dewan Sugli',
  dewan_sugli: 'Dewan Sugli',
  sugli_daerah: 'Dewan Sugli',
  sugli_wilayah: 'Dewan Sugli',
  jati1: 'Jaya Melati 1',
  jaya_melati_1: 'Jaya Melati 1',
  jati2: 'Jaya Melati 2',
  jaya_melati_2: 'Jaya Melati 2',
  jari1: 'Jaya Matahari 1',
  jaya_matahari_1: 'Jaya Matahari 1',
  jari2: 'Jaya Matahari 2',
  jaya_matahari_2: 'Jaya Matahari 2',
  jawi: 'Jaya Pertiwi',
  jaya_pertiwi: 'Jaya Pertiwi',
  umum: 'Umum'
};

const ROLE_OPTIONS: { key: string; label: string }[] = [
  { key: 'superadmin', label: 'Super Admin' },
  { key: 'admin', label: 'Admin Petugas' },
  { key: 'diklat', label: 'Admin Pelatih' },
  { key: 'kwarda', label: 'Kwarda HW' },
  { key: 'umum', label: 'Umum' },
  { key: 'sugli', label: 'Dewan Sugli' },
  { key: 'jati1', label: 'Jaya Melati 1' },
  { key: 'jati2', label: 'Jaya Melati 2' },
  { key: 'jari1', label: 'Jaya Matahari 1' },
  { key: 'jari2', label: 'Jaya Matahari 2' },
  { key: 'jawi', label: 'Jaya Pertiwi' }
];

const truncateText = (text: string, maxLen: number): string => {
  if (!text) return '';
  return text.length > maxLen ? text.substring(0, maxLen - 3) + '...' : text;
};

export default function AdminDashboard() {
  const { user, isAuthenticated } = useAuthStore();
  const memberPhotoInputRef = React.useRef<HTMLInputElement>(null);

  const handleMemberPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
            setFormData(prev => ({ ...prev, photo: compressedBase64 }));
          } else {
            const base64String = event.target?.result as string;
            setFormData(prev => ({ ...prev, photo: base64String }));
          }
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const ktaPhotoInputRef = React.useRef<HTMLInputElement>(null);

  const handleKtaPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
            setEditingKtaApp(prev => prev ? ({ ...prev, photo: compressedBase64 }) : null);
          } else {
            const base64String = event.target?.result as string;
            setEditingKtaApp(prev => prev ? ({ ...prev, photo: base64String }) : null);
          }
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const [searchParams, setSearchParams] = useSearchParams();
  const isDiklatAdmin = (user as any)?.adminType === 'diklat' || user?.email === 'diklat' || user?.email === 'diklat@hwjateng.com' || user?.role === 'admin_diklat';

  const [settings, setSettings] = useState({
    appName: '',
    orgName: '',
    waConfirmation: '628',
    gSheetApiUrl: typeof window !== 'undefined' ? (localStorage.getItem('VITE_GSHEET_API_URL') || import.meta.env.VITE_GSHEET_API_URL || '') : '',
    lastBackup: '-',
    ktaTemplateFront: 'https://hwjateng.com/wp-content/uploads/2026/07/depan.png',
    ktaTemplateBack: 'https://hwjateng.com/wp-content/uploads/2026/07/Belakang.jpg',
    ktaKetuaNama: 'TAUFIQ',
    ktaKetuaNbm: 'NBM 1015096',
    ktaSekretarisNama: 'MUHAMMAD DZIKRON',
    ktaSekretarisNbm: 'NBM 1029863',
    ktaKotaPenerbit: 'Semarang',
    ktaTandaTanganKetua: '',
    ktaTandaTanganSekretaris: '',
    ktaStempelImage: '',
    trainingTypes: ['Jaya Melati 1', 'Jaya Melati 2', 'Jaya Matahari 1', 'Jaya Matahari 2'] as string[],
    trainingActivities: [] as any[],
    trainingLocations: [] as string[],
    trainingDates: [] as string[],
    upgradeFees: [
      { id: 'sugli', label: 'Dewan Sugli', value: 'Rp 0', note: 'Ajuan + SK via WhatsApp' },
      { id: 'kwarda', label: 'Kwarda', value: 'Rp 0', note: 'Ajuan + SK via WhatsApp' },
      { id: 'jati1', label: 'Jaya Melati 1', value: 'Rp 50.000', note: 'Konfirmasi Bayar' },
      { id: 'jati2', label: 'Jaya Melati 2', value: 'Rp 50.000', note: 'Konfirmasi Bayar' },
      { id: 'jari1', label: 'Jaya Matahari 1', value: 'Rp 50.000', note: 'Konfirmasi Bayar' },
    ],
    assignedTasks: [] as any[]
  });

  const userRolesList = [
    ...(Array.isArray(user?.roles) ? user.roles : []),
    user?.role,
    ...(Array.isArray(user?.pelatihan) ? user.pelatihan : [user?.pelatihan]),
    (user as any)?.golonganPelatih,
    (user as any)?.tingkatan
  ].filter(Boolean).map(r => String(r).toLowerCase().trim());

  const trainerRoleIdentifiers = [
    'jari1', 'jari2', 'jaya_matahari_1', 'jaya_matahari_2', 'pelatih', 'pelatih_nasional',
    'jati1', 'jati2', 'jaya_melati_1', 'jaya_melati_2', 'asisten_pelatih',
    'jaya matahari 1', 'jaya matahari 2', 'jaya melati 1', 'jaya melati 2',
    'pelatih kegiatan', 'asisten pelatih'
  ];

  const isJayaMatahariRole = userRolesList.some(r => 
    trainerRoleIdentifiers.some(tr => r.includes(tr) || tr.includes(r)) ||
    r.includes('matahari') || r.includes('melati 2') || r.includes('jati 2') || r.includes('jari')
  );

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
    ...(Array.isArray(settings?.trainingActivities) ? settings.trainingActivities : []),
    ...cachedActsList,
    ...(Array.isArray((window as any)?.hw_settings?.trainingActivities) ? (window as any).hw_settings.trainingActivities : [])
  ];

  const userEmailStr = (user?.email || '').toLowerCase().trim();
  const userNameStr = (user?.namaLengkap || user?.nama || (user as any)?.name || '').toLowerCase().trim();
  const userNbmStr = ((user as any)?.nbm || (user as any)?.noNbm || (user as any)?.ktaNumber || (user as any)?.nomorKTA || '').toLowerCase().trim();

  const isAssignedTrainerInAnyActivity = (Array.isArray(rawActsList) ? rawActsList : []).some((act: any) => {
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
      if (userEmailStr && userEmailStr.length >= 4) {
        const emailPrefix = userEmailStr.split('@')[0];
        if (emailPrefix && emailPrefix.length >= 3 && t.includes(emailPrefix)) return true;
      }
      const nameWords = userNameStr.split(/\s+/).filter(w => w.length >= 3);
      if (nameWords.length > 0) {
        const matchingWords = nameWords.filter(w => t.includes(w) || w.includes(t));
        if (nameWords.length >= 2 && matchingWords.length >= 2) return true;
        if (nameWords.length === 1 && matchingWords.length === 1 && nameWords[0].length >= 4) return true;
      }
      return false;
    });
  });

  const isPelatihUser = isJayaMatahariRole || isAssignedTrainerInAnyActivity;
  const isPelatihOnly = isPelatihUser && user?.role !== 'superadmin' && user?.role !== 'admin' && !isDiklatAdmin;

  const [activeTab, setActiveTabState] = useState(() => {
    if (isDiklatAdmin || isPelatihOnly) return 'pelatihan';
    return searchParams.get('tab') || 'anggota';
  });
  const [searchQuery, setSearchQuery] = useState('');

  const setActiveTab = (tab: string) => {
    setActiveTabState(tab);
    setSearchParams({ tab });
  };

  useEffect(() => {
    if ((isDiklatAdmin || isPelatihOnly) && activeTab !== 'pelatihan' && activeTab !== 'akun') {
      setActiveTabState('pelatihan');
      return;
    }
    const tab = searchParams.get('tab');
    if (tab && tab !== activeTab) {
      setActiveTabState(tab);
    }
  }, [searchParams, isDiklatAdmin, isPelatihOnly]);
  const [selectedFilters, setSelectedFilters] = useState<string[]>(['Semua']);
  const [loading, setLoading] = useState(false);
  
  // State for CRUD
  const [members, setMembers] = useState<any[]>([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  const [notifActiveTab, setNotifActiveTab] = useState<'pendaftaran' | 'upgrade' | 'kta' | 'pelatihan' | 'tugas'>('pendaftaran');
  const [editingMember, setEditingMember] = useState<any>(null);
  const [formData, setFormData] = useState({
    namaLengkap: '',
    email: '',
    role: 'umum',
    roles: ['umum'] as string[],
    jenisKelamin: 'L',
    golongan: 'Penghela',
    golonganPelatih: 'Penghela',
    pelatihan: [] as string[],
    pendidikan: 'SMA/SMK/MA',
    asalKwarda: '',
    qabilah: '',
    alamat: '',
    noHp: '',
    sosmed: '',
    password: '',
    isVerified: true,
    upgradeRequests: [] as string[],
    photo: '',
    tempatLahir: '',
    tanggalLahir: '',
    statusKta: 'approved',
    ktaNumber: '',
    jenisKta: 'Reguler'
  });

  const [materiList, setMateriList] = useState<Materi[]>([]);
  const [materiFilter, setMateriFilter] = useState('semua');
  const [materiSearch, setMateriSearch] = useState('');
  const [isMateriModalOpen, setIsMateriModalOpen] = useState(false);
  const [editingMateri, setEditingMateri] = useState<Materi | null>(null);
  const [materiFormData, setMateriFormData] = useState({
    judul: '',
    konten: '',
    kategori: 'umum',
    coverImage: 'https://upload.wikimedia.org/wikipedia/id/b/ba/Logo_Hizbul_Wathan.png',
    driveUrl: ''
  });

  // Kegiatan HW Jateng State
  const [activitiesList, setActivitiesList] = useState<any[]>([]);
  const [activityApplicationsList, setActivityApplicationsList] = useState<any[]>([]);
  const [activityCategoriesList, setActivityCategoriesList] = useState<string[]>(['Rapat HW', 'Silaturahmi', 'Perkemahan', 'Musyawarah']);
  const [newCategoryInput, setNewCategoryInput] = useState('');
  const [activitySubTab, setActivitySubTab] = useState<'kegiatan' | 'jenis' | 'peserta'>('kegiatan');
  const [isKegiatanModalOpen, setIsKegiatanModalOpen] = useState(false);
  const [editingKegiatan, setEditingKegiatan] = useState<any | null>(null);
  const [kegiatanFormData, setKegiatanFormData] = useState({
    namaKegiatan: '',
    kategori: 'Rapat HW',
    tanggal: '',
    lokasi: '',
    biaya: 'Gratis',
    status: 'Buka',
    kuota: '100 Peserta',
    deskripsi: '',
    gambarUrl: 'https://images.unsplash.com/photo-1510312305653-8ed496efae75?auto=format&fit=crop&q=80&w=800',
    youtubeUrl: '',
    themeSongUrl: '',
    themeSongTitle: '',
    penyelenggara: 'Kwartir Wilayah HW Jawa Tengah',
    rekeningPembiayaan: 'Bank Syariah Indonesia (BSI) 7307427448 a.n. Kwarwil HW Jateng',
    noWhatsappPanitia: '089688754000',
    proposalUrl: ''
  });
  const [selectedActivityForParticipants, setSelectedActivityForParticipants] = useState<string>('semua');

  const activityParticipantCountMap = useMemo(() => {
    const map: Record<string, number> = {};
    if (!activityApplicationsList?.length) return map;
    for (const app of activityApplicationsList) {
      const actId = String(app.activityId || app.activity_id || app.kegiatanId || app.idKegiatan || '').trim().toLowerCase();
      if (actId) {
        map[actId] = (map[actId] || 0) + 1;
        if (actId === 'keg-1') map['keg-silaturahmi-pelatih'] = (map['keg-silaturahmi-pelatih'] || 0) + 1;
        if (actId === 'keg-silaturahmi-pelatih') map['keg-1'] = (map['keg-1'] || 0) + 1;
      }
    }
    return map;
  }, [activityApplicationsList]);

  const displayedActivityApplications = useMemo(() => {
    if (!activityApplicationsList?.length) return [];
    if (selectedActivityForParticipants === 'semua') {
      return sortActivityAppsByDate(activityApplicationsList, true);
    }
    const targetAct = activitiesList.find(a => a.id === selectedActivityForParticipants) || { id: selectedActivityForParticipants };
    const filtered = activityApplicationsList.filter(app => isParticipantOfActivity(app, targetAct));
    return sortActivityAppsByDate(filtered, true);
  }, [activityApplicationsList, selectedActivityForParticipants, activitiesList]);

  const [selectedContentSection, setSelectedContentSection] = useState<string | null>(null);
  const [contents, setContents] = useState<Content[]>([]);
  const [contentList, setContentList] = useState<Content[]>([]);
  const [isContentModalOpen, setIsContentModalOpen] = useState(false);
  const [editingContent, setEditingContent] = useState<Content | null>(null);
  const [contentFormData, setContentFormData] = useState({
    field1: '',
    field2: '',
    field3: '',
    field4: '',
    field5: ''
  });

  const [passwordFormData, setPasswordFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState({ type: '', text: '' });
  
  const ktaFrontBg = settings.ktaTemplateFront || 'https://hwjateng.com/wp-content/uploads/2026/07/depan.png';
  const ktaBackBg = settings.ktaTemplateBack || 'https://hwjateng.com/wp-content/uploads/2026/07/Belakang.jpg';
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showAppsScriptGuide, setShowAppsScriptGuide] = useState(false);
  const [copiedScript, setCopiedScript] = useState(false);

  // KTA Management States
  const [ktaApps, setKtaApps] = useState<any[]>([]);
  const [ktaSearchQuery, setKtaSearchQuery] = useState('');
  const [ktaFilterStatus, setKtaFilterStatus] = useState('Semua');
  const [ktaFilterKwarda, setKtaFilterKwarda] = useState('Semua');
  const [ktaSortBy, setKtaSortBy] = useState<'kwarda' | 'ktaNumber' | 'nama' | 'tanggal' | 'status'>('kwarda');
  const [selectedKwardaModal, setSelectedKwardaModal] = useState<string | null>(null);
  const [kwardaModalSearch, setKwardaModalSearch] = useState('');
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [activeKtaSubTab, setActiveKtaSubTab] = useState<'summary' | 'stats' | 'kwarda' | 'template'>('summary');
  const [editingKtaApp, setEditingKtaApp] = useState<any | null>(null);
  const [isEditKtaModalOpen, setIsEditKtaModalOpen] = useState(false);
  const [isResequencingKta, setIsResequencingKta] = useState(false);
  const [previewFlipped, setPreviewFlipped] = useState(false);
  const [isViewKtaModalOpen, setIsViewKtaModalOpen] = useState(false);
  const [viewingKtaApp, setViewingKtaApp] = useState<any | null>(null);
  const [flippedAdmin, setFlippedAdmin] = useState(false);
  const [isGeneratingPdfAdmin, setIsGeneratingPdfAdmin] = useState(false);

  const handleDeleteKtaApp = async (id: string, name: string) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus pengajuan KTA untuk ${name}? Tindakan ini tidak dapat dibatalkan.`)) {
      try {
        setLoading(true);
        const res = await sheetsService.deleteKTAApplication(id);
        if (res.success || !res.error) {
          alert(`Berhasil menghapus pengajuan KTA untuk ${name}.`);
        } else {
          alert('Gagal menghapus pengajuan: ' + (res.message || 'Error'));
        }
        await fetchData();
      } catch (e: any) {
        console.error(e);
        alert('Gagal menghapus pengajuan: ' + (e.message || 'Error'));
      } finally {
        setLoading(false);
      }
    }
  };

  // Dynamic aggregations for Kwarda & Qabilah
  const kwardaStats = React.useMemo(() => {
    const counts: { [key: string]: { approved: number; pending: number; total: number } } = {};
    
    // Pre-populate with all 35 Kwardas from KWARDA_QABILAH_JATENG (code '01' to '35')
    KWARDA_QABILAH_JATENG.forEach(item => {
      const isPtma = parseInt(item.code, 10) >= 36;
      if (!isPtma) {
        counts[item.name] = { approved: 0, pending: 0, total: 0 };
      }
    });

    ktaApps.forEach(app => {
      const reg = app.asalDaerah || '';
      if (counts[reg]) {
        if (app.status === 'approved') counts[reg].approved++;
        else if (app.status === 'pending') counts[reg].pending++;
        counts[reg].total++;
      }
    });
    return Object.entries(counts)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => {
        const itemA = KWARDA_QABILAH_JATENG.find(item => item.name === a.name);
        const itemB = KWARDA_QABILAH_JATENG.find(item => item.name === b.name);
        const codeA = itemA ? parseInt(itemA.code, 10) : 999;
        const codeB = itemB ? parseInt(itemB.code, 10) : 999;
        return codeA - codeB;
      });
  }, [ktaApps]);

  const qabilahStats = React.useMemo(() => {
    const counts: { [key: string]: { approved: number; pending: number; total: number } } = {};
    
    // Pre-populate with all PTMA Qabilahs (code '36' onwards)
    KWARDA_QABILAH_JATENG.forEach(item => {
      const isPtma = parseInt(item.code, 10) >= 36;
      if (isPtma) {
        counts[item.name] = { approved: 0, pending: 0, total: 0 };
      }
    });

    ktaApps.forEach(app => {
      const reg = app.asalDaerah || '';
      const found = KWARDA_QABILAH_JATENG.find(item => item.name === reg);
      const isPtma = found ? parseInt(found.code, 10) >= 36 : false;
      
      if (isPtma && reg) {
        if (!counts[reg]) {
          counts[reg] = { approved: 0, pending: 0, total: 0 };
        }
        if (app.status === 'approved') counts[reg].approved++;
        else if (app.status === 'pending') counts[reg].pending++;
        counts[reg].total++;
      }
    });
    return Object.entries(counts)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => {
        const itemA = KWARDA_QABILAH_JATENG.find(item => item.name === a.name);
        const itemB = KWARDA_QABILAH_JATENG.find(item => item.name === b.name);
        const codeA = itemA ? parseInt(itemA.code, 10) : 999;
        const codeB = itemB ? parseInt(itemB.code, 10) : 999;
        return codeA - codeB;
      });
  }, [ktaApps]);

  // Filtered and Sorted KTA Applications
  const filteredKtaApps = React.useMemo(() => {
    const appsWithNumbers = ensureUniqueKtaNumbers([...(ktaApps || [])]);
    return appsWithNumbers
      .filter(app => {
        const query = ktaSearchQuery.toLowerCase().trim();
        const matchSearch = !query ||
          (app?.nama || '').toLowerCase().includes(query) ||
          (app?.email || '').toLowerCase().includes(query) ||
          (app?.asalDaerah || '').toLowerCase().includes(query) ||
          (app?.qabilah || '').toLowerCase().includes(query) ||
          (app?.ktaNumber || '').toLowerCase().includes(query);

        const matchStatus = ktaFilterStatus === 'Semua' || app?.status === ktaFilterStatus;
        
        const appKwarda = (app?.asalDaerah || app?.qabilah || '').toLowerCase().trim();
        const filterKwardaLower = ktaFilterKwarda.toLowerCase().trim();
        const matchKwarda = ktaFilterKwarda === 'Semua' ||
          appKwarda === filterKwardaLower ||
          (app?.asalDaerah || '').toLowerCase().trim() === filterKwardaLower ||
          (app?.qabilah || '').toLowerCase().trim() === filterKwardaLower;

        return matchSearch && matchStatus && matchKwarda;
      })
      .sort((a, b) => {
        if (ktaSortBy === 'kwarda') {
          return compareKtaNumbers(a, b);
        } else if (ktaSortBy === 'ktaNumber') {
          return compareByKtaSequence(a, b);
        } else if (ktaSortBy === 'nama') {
          return (a.nama || a.namaLengkap || '').localeCompare(b.nama || b.namaLengkap || '');
        } else if (ktaSortBy === 'tanggal') {
          const dateA = new Date(a.tanggalAjuan || a.createdAt || 0).getTime();
          const dateB = new Date(b.tanggalAjuan || b.createdAt || 0).getTime();
          return dateB - dateA;
        } else if (ktaSortBy === 'status') {
          return (a.status || '').localeCompare(b.status || '');
        }
        return 0;
      });
  }, [ktaApps, ktaSearchQuery, ktaFilterStatus, ktaFilterKwarda, ktaSortBy]);

  // Training Management States & Deduplication
  const [trainingAppsRaw, setTrainingAppsRaw] = useState<any[]>([]);

  const deduplicateTrainingApps = useCallback((apps: any[]) => {
    if (!Array.isArray(apps)) return [];
    const map = new Map<string, any>();
    for (const app of apps) {
      if (!app) continue;
      const name = (app.nama || app.namaLengkap || '').trim();
      if (!isValidName(name)) continue;

      const nbmStr = String(app.nbm || '').trim();
      const emailStr = String(app.email || '').toLowerCase().trim();
      const waDigits = String(app.noWa || '').replace(/[^0-9]/g, '');

      const personKey = (
        (app.userId && String(app.userId).trim()) ? `id_${String(app.userId).trim()}` :
        (nbmStr && nbmStr !== '-' && nbmStr.length >= 3) ? `nbm_${nbmStr}` :
        (emailStr && emailStr !== '-' && emailStr.includes('@')) ? `email_${emailStr}` :
        (waDigits && waDigits.length >= 6) ? `wa_${waDigits}` :
        (name && name !== 'tanpa nama' && name !== '-') ? `name_${name.toLowerCase()}` :
        `app_${app.id || Date.now()}`
      );
      const progKey = (app.pelatihanAkanDiikuti || 'jati1').toLowerCase().trim().replace(/\s+/g, '');
      const compositeKey = `${personKey}___${progKey}`;

      if (!map.has(compositeKey)) {
        map.set(compositeKey, app);
      } else {
        const existing = map.get(compositeKey);
        const statusScore = (s: string) => (s === 'approved' || s === 'terverifikasi' || s === 'disetujui') ? 3 : s === 'pending' ? 2 : 1;
        const scoreCurrent = statusScore(app.status);
        const scoreExisting = statusScore(existing.status);

        if (scoreCurrent > scoreExisting) {
          map.set(compositeKey, app);
        } else if (scoreCurrent === scoreExisting) {
          const currentRichness = (app.nbm ? 2 : 0) + (app.photo ? 2 : 0) + (app.tempatLahir ? 1 : 0);
          const existingRichness = (existing.nbm ? 2 : 0) + (existing.photo ? 2 : 0) + (existing.tempatLahir ? 1 : 0);
          if (currentRichness > existingRichness) {
            map.set(compositeKey, app);
          } else {
            const currentTime = new Date(app.tanggalAjuan || app.updatedAt || 0).getTime();
            const existingTime = new Date(existing.tanggalAjuan || existing.updatedAt || 0).getTime();
            if (currentTime > existingTime) {
              map.set(compositeKey, app);
            }
          }
        }
      }
    }
    return Array.from(map.values());
  }, []);

  const setTrainingApps = useCallback((data: any | ((prev: any[]) => any[])) => {
    if (typeof data === 'function') {
      setTrainingAppsRaw(prev => deduplicateTrainingApps(data(prev)));
    } else {
      setTrainingAppsRaw(deduplicateTrainingApps(data));
    }
  }, [deduplicateTrainingApps]);

  const trainingApps = trainingAppsRaw;
  const [trainingSearchQuery, setTrainingSearchQuery] = useState('');
  const [trainingFilterStatus, setTrainingFilterStatus] = useState('Semua');
  const [trainingFilterActivity, setTrainingFilterActivity] = useState('Semua');
  const [trainingRejectId, setTrainingRejectId] = useState<string | null>(null);
  const [trainingRejectReason, setTrainingRejectReason] = useState('');
  const [isTrainingRejectModalOpen, setIsTrainingRejectModalOpen] = useState(false);
  const [trainingMainTab, setTrainingMainTab] = useState<'manajemen' | 'kelola_jenis'>('manajemen');
  const [trainingSubTab, setTrainingSubTab] = useState<'peserta' | 'presensi' | 'penugasan' | 'penilaian' | 'piagam'>('peserta');

  useEffect(() => {
    if (isPelatihOnly && trainingMainTab !== 'manajemen') {
      setTrainingMainTab('manajemen');
    }
  }, [isPelatihOnly, trainingMainTab]);

  // Training Edit States
  const [editingTrainingApp, setEditingTrainingApp] = useState<any | null>(null);
  const [isEditTrainingModalOpen, setIsEditTrainingModalOpen] = useState(false);

  // Add participant states
  const [isAddParticipantModalOpen, setIsAddParticipantModalOpen] = useState(false);
  const [addParticipantMode, setAddParticipantMode] = useState<'select' | 'manual'>('select');
  const [addParticipantSelectedMemberId, setAddParticipantSelectedMemberId] = useState('');
  const [addParticipantLevel, setAddParticipantLevel] = useState<'Jati 1' | 'Jati 2' | 'Jari 1'>('Jati 1');
  const [addParticipantPelatihGolongan, setAddParticipantPelatihGolongan] = useState('Tunas Athfal');
  const [addParticipantLokasi, setAddParticipantLokasi] = useState('');
  const [addParticipantTanggal, setAddParticipantTanggal] = useState('');
  const [addParticipantSearchQuery, setAddParticipantSearchQuery] = useState('');
  const [isSubmittingAddParticipant, setIsSubmittingAddParticipant] = useState(false);
  const [addParticipantForm, setAddParticipantForm] = useState({
    nama: '',
    nbm: '',
    email: '',
    noWa: '',
    tempatLahir: '',
    tanggalLahir: '',
    jenisKelamin: 'L',
    asalDaerah: '',
    qabilah: '',
    pendidikan: '',
    photo: '',
    pelatihanAkanDiikuti: 'Jati 1',
    pelatihGolongan: 'Tunas Athfal',
    golonganAnggota: 'Pengenal',
    lokasiPelatihan: '',
    tanggalPelatihan: '',
    biayaPelatihan: 'Rp 50.000',
    rekeningPembiayaan: 'Bank Syariah Indonesia (BSI) 7307427448 a.n. Kwarwil HW Jateng',
    status: 'approved',
    statusPembayaran: 'Lunas'
  });

  // Activity Participant Edit States
  const [editingActivityParticipant, setEditingActivityParticipant] = useState<any | null>(null);
  const [isEditActivityParticipantModalOpen, setIsEditActivityParticipantModalOpen] = useState(false);

  // Grading Modal States
  const [isGradingModalOpen, setIsGradingModalOpen] = useState(false);
  const [selectedTrainingApp, setSelectedTrainingApp] = useState<any>(null);
  const [gradeInput, setGradeInput] = useState('');
  const [remarkInput, setRemarkInput] = useState('');
  const [graduationStatusInput, setGraduationStatusInput] = useState('Lulus');
  
  // Inputs for training settings (Type, Activity, Location, Date)
  const [newTypeInput, setNewTypeInput] = useState('');
  const [newLocationInput, setNewLocationInput] = useState('');
  const [newDateInput, setNewDateInput] = useState('');
  
  // Activity Modal State
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [editingActivityId, setEditingActivityId] = useState<string | null>(null);
  const [activityForm, setActivityForm] = useState({
    namaKegiatan: '',
    jenisPelatihan: 'Jaya Melati 1',
    lokasiPelatihan: '',
    tanggalPelatihan: '',
    status: 'Buka' as 'Buka' | 'Tutup',
    deskripsi: '',
    pelatih: [] as string[],
    asistenPelatih: [] as string[],
    biayaPelatihan: 'Rp 50.000',
    rekeningPembiayaan: 'Bank Syariah Indonesia (BSI) 7307427448 a.n. Kwarwil HW Jateng',
    noWhatsappPanitia: '089688754000',
    proposalUrl: ''
  });

  // Schedule Editing States
  const [editingScheduleAppId, setEditingScheduleAppId] = useState<string | null>(null);
  const [editLokasi, setEditLokasi] = useState<string>('');
  const [editTanggal, setEditTanggal] = useState<string>('');

  // Program Level Selectors for sub-tabs
  const [selectedPresensiProg, setSelectedPresensiProg] = useState<'Jati 1' | 'Jati 2' | 'Jari 1'>('Jati 1');
  const [selectedTugasProg, setSelectedTugasProg] = useState<'Jati 1' | 'Jati 2' | 'Jari 1'>('Jati 1');
  const [selectedTugasMateriId, setSelectedTugasMateriId] = useState<string>('all');
  const [showAssignTaskModal, setShowAssignTaskModal] = useState(false);
  const [assigningMateri, setAssigningMateri] = useState<Materi | null>(null);
  const [assignTaskInstruksi, setAssignTaskInstruksi] = useState('');
  const [assignTaskDeadline, setAssignTaskDeadline] = useState('');
  const [selectedGradeProg, setSelectedGradeProg] = useState<'Jati 1' | 'Jati 2' | 'Jari 1'>('Jati 1');
  const [selectedPiagamProg, setSelectedPiagamProg] = useState<'Jati 1' | 'Jati 2' | 'Jari 1'>('Jati 1');

  // Piagam Certificate Preview Modal
  const [isPiagamModalOpen, setIsPiagamModalOpen] = useState(false);
  const [piagamParticipant, setPiagamParticipant] = useState<any>(null);

  const handleAssignTask = async (task: any) => {
    try {
      const currentTasks = Array.isArray(settings.assignedTasks) ? settings.assignedTasks : [];
      const filtered = currentTasks.filter(t => !(t.level === task.level && t.materiId === task.materiId));
      const updatedTasks = [...filtered, task];
      
      const payload = {
        ...settings,
        assignedTasks: updatedTasks
      };
      
      await sheetsService.saveSettings(payload);
      setSettings(prev => ({ ...prev, assignedTasks: updatedTasks }));
      alert('Tugas berhasil diberikan!');
      setShowAssignTaskModal(false);
      setAssigningMateri(null);
      setAssignTaskInstruksi('');
      setAssignTaskDeadline('');
    } catch (error) {
      console.error('Gagal memberikan tugas:', error);
      alert('Gagal memberikan tugas.');
    }
  };

  const handleUnassignTask = async (level: string, materiId: string) => {
    if (!confirm('Apakah Anda yakin ingin menarik penugasan ini?')) return;
    try {
      const currentTasks = Array.isArray(settings.assignedTasks) ? settings.assignedTasks : [];
      const updatedTasks = currentTasks.filter(t => !(t.level === level && t.materiId === materiId));
      
      const payload = {
        ...settings,
        assignedTasks: updatedTasks
      };
      
      await sheetsService.saveSettings(payload);
      setSettings(prev => ({ ...prev, assignedTasks: updatedTasks }));
      alert('Penugasan berhasil ditarik.');
      setShowAssignTaskModal(false);
      setAssigningMateri(null);
      setAssignTaskInstruksi('');
      setAssignTaskDeadline('');
    } catch (error) {
      console.error('Gagal menarik tugas:', error);
      alert('Gagal menarik tugas.');
    }
  };

  const allTrainingActivitiesList = useMemo(() => {
    const map = new Map<string, any>();
    (settings.trainingActivities || []).filter(isOnlyTrainingActivity).forEach((a: any) => {
      if (a && a.id) map.set(a.id, a);
    });
    (activitiesList || []).filter(isOnlyTrainingActivity).forEach((a: any) => {
      if (a && a.id) {
        if (map.has(a.id)) {
          map.set(a.id, { ...map.get(a.id), ...a });
        } else {
          map.set(a.id, a);
        }
      }
    });
    return Array.from(map.values()).filter(isOnlyTrainingActivity);
  }, [settings.trainingActivities, activitiesList]);

  const getAvailableTrainingOptions = () => {
    const options: { id: string; name: string; label: string; act?: any }[] = [];
    const addedNames = new Set<string>();

    // 1. Registered training activities from settings & activitiesList
    allTrainingActivitiesList.forEach((act: any) => {
      const name = act.namaKegiatan || act.jenisPelatihan;
      if (name && !addedNames.has(name)) {
        addedNames.add(name);
        options.push({
          id: act.id || name,
          name: name,
          label: `${name} ${act.lokasiPelatihan ? `📍 ${act.lokasiPelatihan}` : ''} ${act.biayaPelatihan ? `(💰 ${act.biayaPelatihan})` : ''}`,
          act
        });
      }
    });

    // 2. Additional training types from settings or defaults
    const types = settings.trainingTypes || ['Jaya Melati 1', 'Jaya Melati 2', 'Jaya Matahari 1', 'Jaya Matahari 2', 'Jati 1', 'Jati 2', 'Jari 1', 'Jari 2'];
    types.forEach((t: string) => {
      if (!addedNames.has(t)) {
        addedNames.add(t);
        options.push({ id: t, name: t, label: t });
      }
    });

    return options;
  };

  const handleAddParticipantTrainingChange = (val: string) => {
    const activeActs = settings.trainingActivities || [];
    const matchingAct = activeActs.find((a: any) => 
      a.id === val || a.namaKegiatan === val || a.jenisPelatihan === val
    ) || (activitiesList || []).find((a: any) => 
      a.id === val || a.namaKegiatan === val || a.jenisPelatihan === val
    );

    if (matchingAct) {
      setAddParticipantForm(prev => ({
        ...prev,
        pelatihanAkanDiikuti: matchingAct.namaKegiatan || matchingAct.jenisPelatihan || val,
        lokasiPelatihan: matchingAct.lokasiPelatihan || matchingAct.lokasi || (settings.trainingLocations || [])[0] || 'Pusdiklat HW Jateng',
        tanggalPelatihan: matchingAct.tanggalPelatihan || matchingAct.tanggal || (settings.trainingDates || [])[0] || 'Jadwal Reguler',
        biayaPelatihan: matchingAct.biayaPelatihan || 'Rp 50.000',
        rekeningPembiayaan: matchingAct.rekeningPembiayaan || 'Bank Syariah Indonesia (BSI) 7307427448 a.n. Kwarwil HW Jateng'
      }));
    } else {
      setAddParticipantForm(prev => ({
        ...prev,
        pelatihanAkanDiikuti: val,
        lokasiPelatihan: prev.lokasiPelatihan || (settings.trainingLocations || [])[0] || 'Pusdiklat HW Jateng',
        tanggalPelatihan: prev.tanggalPelatihan || (settings.trainingDates || [])[0] || 'Jadwal Reguler',
        biayaPelatihan: prev.biayaPelatihan || 'Rp 50.000'
      }));
    }
  };

  const handleEditParticipantTrainingChange = (val: string) => {
    const activeActs = settings.trainingActivities || [];
    const matchingAct = activeActs.find((a: any) => 
      a.id === val || a.namaKegiatan === val || a.jenisPelatihan === val
    ) || (activitiesList || []).find((a: any) => 
      a.id === val || a.namaKegiatan === val || a.jenisPelatihan === val
    );

    if (matchingAct) {
      setEditingTrainingApp((prev: any) => ({
        ...prev,
        pelatihanAkanDiikuti: matchingAct.namaKegiatan || matchingAct.jenisPelatihan || val,
        lokasiPelatihan: matchingAct.lokasiPelatihan || matchingAct.lokasi || prev?.lokasiPelatihan || (settings.trainingLocations || [])[0] || 'Pusdiklat HW Jateng',
        tanggalPelatihan: matchingAct.tanggalPelatihan || matchingAct.tanggal || prev?.tanggalPelatihan || (settings.trainingDates || [])[0] || 'Jadwal Reguler',
        biayaPelatihan: matchingAct.biayaPelatihan || prev?.biayaPelatihan || 'Rp 50.000',
        rekeningPembiayaan: matchingAct.rekeningPembiayaan || prev?.rekeningPembiayaan || 'Bank Syariah Indonesia (BSI) 7307427448 a.n. Kwarwil HW Jateng'
      }));
    } else {
      setEditingTrainingApp((prev: any) => ({
        ...prev,
        pelatihanAkanDiikuti: val
      }));
    }
  };

  const handleAddParticipant = async () => {
    let member = members.find(m => String(m.id) === String(addParticipantSelectedMemberId));
    
    if (addParticipantMode === 'select' && !member) {
      alert('Silakan pilih anggota dari daftar terlebih dahulu.');
      return;
    }

    const nama = addParticipantMode === 'select' ? (member?.namaLengkap || member?.nama || addParticipantForm.nama) : addParticipantForm.nama;
    if (!nama.trim()) {
      alert('Nama lengkap peserta wajib diisi.');
      return;
    }

    // Auto-detect from ktaApps if member profile missing details
    const matchingKta = ktaApps.find(k => 
      (member && k.userId && String(k.userId) === String(member.id)) ||
      (member && k.email && member.email && String(k.email).toLowerCase().trim() === String(member.email).toLowerCase().trim()) ||
      (member && k.noWa && member.noHp && String(k.noWa).replace(/[^0-9]/g, '') === String(member.noHp).replace(/[^0-9]/g, '')) ||
      (member && k.nama && member.namaLengkap && String(k.nama).toLowerCase().trim() === String(member.namaLengkap).toLowerCase().trim())
    );

    const finalNbm = addParticipantForm.nbm || member?.nbm || (member as any)?.noNbm || matchingKta?.nbm || matchingKta?.ktaNumber || matchingKta?.nomorKTA || member?.ktaNumber || member?.nomorKTA || '';
    const finalTempatLahir = addParticipantForm.tempatLahir || member?.tempatLahir || matchingKta?.tempatLahir || '';
    const finalTanggalLahir = addParticipantForm.tanggalLahir || member?.tanggalLahir || matchingKta?.tanggalLahir || '';
    const finalJkRaw = addParticipantForm.jenisKelamin || member?.jenisKelamin || matchingKta?.jenisKelamin || 'L';
    const finalJenisKelamin = (finalJkRaw === 'Perempuan' || finalJkRaw === 'P') ? 'P' : 'L';
    const finalPhoto = addParticipantForm.photo || member?.photo || matchingKta?.photo || '';
    const finalAsalDaerah = addParticipantForm.asalDaerah || member?.asalKwarda || matchingKta?.asalDaerah || '';
    const finalQabilah = addParticipantForm.qabilah || member?.qabilah || matchingKta?.qabilah || '';
    const finalNoWa = addParticipantForm.noWa || member?.noHp || matchingKta?.noWa || '';
    const finalEmail = addParticipantForm.email || member?.email || matchingKta?.email || '';

    try {
      setIsSubmittingAddParticipant(true);
      
      const payload = {
        id: `training-${Date.now()}`,
        userId: member?.id || matchingKta?.userId || `user-manual-${Date.now()}`,
        nama: nama,
        nbm: finalNbm,
        noWa: finalNoWa,
        email: finalEmail,
        sosmed: member?.sosmed || matchingKta?.sosmed || '',
        golonganAnggota: addParticipantForm.golonganAnggota || member?.golongan || 'Pengenal',
        tingkatan: addParticipantForm.golonganAnggota || member?.golongan || 'Pengenal',
        pelatihGolongan: addParticipantForm.pelatihGolongan || addParticipantPelatihGolongan,
        asalDaerah: finalAsalDaerah,
        pelatihanAkanDiikuti: addParticipantForm.pelatihanAkanDiikuti || addParticipantLevel,
        lokasiPelatihan: addParticipantForm.lokasiPelatihan || addParticipantLokasi || (Array.isArray(settings.trainingLocations) && settings.trainingLocations[0]) || 'Pusdiklat HW Jateng',
        tanggalPelatihan: addParticipantForm.tanggalPelatihan || addParticipantTanggal || (Array.isArray(settings.trainingDates) && settings.trainingDates[0]) || 'Jadwal Reguler',
        biayaPelatihan: addParticipantForm.biayaPelatihan || 'Rp 50.000',
        rekeningPembiayaan: addParticipantForm.rekeningPembiayaan || 'Bank Syariah Indonesia (BSI) 7307427448 a.n. Kwarwil HW Jateng',
        tempatLahir: finalTempatLahir,
        tanggalLahir: finalTanggalLahir,
        jenisKelamin: finalJenisKelamin,
        qabilah: finalQabilah,
        pendidikan: addParticipantForm.pendidikan || member?.pendidikan || matchingKta?.pendidikan || '',
        photo: finalPhoto,
        status: addParticipantForm.status || 'approved',
        statusPembayaran: addParticipantForm.statusPembayaran || 'Lunas',
        agreeChecked: true,
        tanggalAjuan: new Date().toISOString()
      };

      const res = await sheetsService.saveTrainingApplicationAndSyncMember(payload);
      if (res.success || res.application || res.id) {
        const savedApp = res.application || payload;
        
        // Optimistic UI update so table immediately reflects the newly added participant
        setTrainingApps(prev => {
          const filtered = prev.filter(x => x && x.id !== savedApp.id);
          return [savedApp, ...filtered];
        });

        // Also update members list optimistically so new participant is immediately listed in members data
        setMembers(prev => {
          const isApprovedOrLunas = payload.status === 'approved' || payload.statusPembayaran === 'Lunas';
          const existingIdx = prev.findIndex(m => 
            (m.id && String(m.id) === String(payload.userId)) ||
            (m.email && payload.email && m.email.trim().toLowerCase() === payload.email.trim().toLowerCase()) ||
            (m.namaLengkap && payload.nama && m.namaLengkap.trim().toLowerCase() === payload.nama.trim().toLowerCase())
          );
          if (existingIdx >= 0) {
            const updated = [...prev];
            const m = updated[existingIdx];
            const pelList = Array.isArray(m.pelatihan) ? [...m.pelatihan] : [];
            if (payload.pelatihanAkanDiikuti && !pelList.includes(payload.pelatihanAkanDiikuti)) {
              pelList.push(payload.pelatihanAkanDiikuti);
            }
            updated[existingIdx] = {
              ...m,
              namaLengkap: payload.nama || m.namaLengkap,
              noHp: payload.noWa || m.noHp,
              email: payload.email || m.email,
              pelatihan: pelList,
              statusPembayaran: payload.statusPembayaran || (isApprovedOrLunas ? 'Lunas' : (m.statusPembayaran || 'Belum Bayar')),
              statusAktivasi: isApprovedOrLunas ? 'Aktif' : (m.statusAktivasi || 'Belum Aktif'),
              isVerified: isApprovedOrLunas ? true : m.isVerified
            };
            return updated;
          } else {
            const newM = {
              id: payload.userId || `user-manual-${Date.now()}`,
              namaLengkap: payload.nama,
              email: payload.email || '',
              noHp: payload.noWa || '',
              nbm: payload.nbm || '',
              tempatLahir: payload.tempatLahir || '',
              tanggalLahir: payload.tanggalLahir || '',
              jenisKelamin: payload.jenisKelamin || 'L',
              qabilah: payload.qabilah || '',
              asalKwarda: payload.asalDaerah || '',
              golongan: payload.golonganAnggota || 'Pengenal',
              pelatihan: payload.pelatihanAkanDiikuti ? [payload.pelatihanAkanDiikuti] : [],
              statusPembayaran: payload.statusPembayaran || (isApprovedOrLunas ? 'Lunas' : 'Belum Bayar'),
              statusAktivasi: isApprovedOrLunas ? 'Aktif' : 'Belum Aktif',
              isVerified: isApprovedOrLunas,
              statusKTA: 'Diproses',
              createdAt: new Date().toISOString()
            };
            return [newM, ...prev];
          }
        });

        alert('Berhasil mendaftarkan peserta ke pelatihan!');
        setIsAddParticipantModalOpen(false);
        setAddParticipantSelectedMemberId('');
        setAddParticipantForm({
          nama: '', nbm: '', email: '', noWa: '', tempatLahir: '', tanggalLahir: '',
          jenisKelamin: 'L', asalDaerah: '', qabilah: '', pendidikan: '', photo: '',
          pelatihanAkanDiikuti: 'Jaya Melati 1',
          pelatihGolongan: 'Tunas Athfal',
          golonganAnggota: 'Pengenal',
          lokasiPelatihan: '',
          tanggalPelatihan: '',
          biayaPelatihan: '',
          rekeningPembiayaan: '',
          status: 'approved',
          statusPembayaran: 'Lunas'
        });

        // Background sync to pull latest state
        try {
          const [tData, mData] = await Promise.all([
            sheetsService.getTrainingApplications(),
            sheetsService.getMembers()
          ]);
          if (tData && Array.isArray(tData)) {
            setTrainingApps(prev => {
              const map = new Map<string, any>();
              map.set(savedApp.id, savedApp);
              tData.forEach((item: any) => {
                if (item && item.id && !map.has(item.id)) {
                  map.set(item.id, item);
                }
              });
              return Array.from(map.values());
            });
          }
          if (mData && Array.isArray(mData)) {
            setMembers(mData);
          }
        } catch (e) {
          console.warn('Background sync error after adding participant:', e);
        }
      } else {
        alert(res.message || 'Gagal mendaftarkan peserta.');
      }
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Gagal mendaftarkan peserta.');
    } finally {
      setIsSubmittingAddParticipant(false);
    }
  };

  const handleApproveKTA = async (appId: string) => {
    try {
      const nowIso = new Date().toISOString();
      const targetApp = ktaApps.find(k => String(k.id) === String(appId) || (k.userId && String(k.userId) === String(appId)));
      const fallbackKtaNum = targetApp?.nomorKTA || targetApp?.ktaNumber || `KTA-HW-${Date.now().toString().slice(-6)}`;

      // 1. Optimistic instant local state update (0ms delay)
      setKtaApps(prev => prev.map(k => {
        if (String(k.id) === String(appId) || (k.userId && String(k.userId) === String(appId))) {
          return {
            ...k,
            status: 'approved',
            verifiedAt: nowIso,
            nomorKTA: k.nomorKTA || k.ktaNumber || fallbackKtaNum,
            ktaNumber: k.ktaNumber || k.nomorKTA || fallbackKtaNum
          };
        }
        return k;
      }));

      if (targetApp) {
        setMembers(prev => prev.map(m => {
          if ((targetApp.userId && String(m.id) === String(targetApp.userId)) ||
              (targetApp.email && m.email && m.email.trim().toLowerCase() === targetApp.email.trim().toLowerCase())) {
            return {
              ...m,
              isVerified: true,
              statusKta: 'approved',
              verifiedAt: nowIso
            };
          }
          return m;
        }));
      }

      alert('Pengajuan KTA berhasil disetujui!');

      // 2. Perform backend synchronization non-blockingly in background
      (async () => {
        await sheetsService.updateKTAStatus(appId, 'approved');
        await sheetsService.syncApprovedKtasToMembers();
        const [ktaData, membersData] = await Promise.all([
          sheetsService.getKTAApplications(),
          sheetsService.getMembers()
        ]);
        if (ktaData?.length) setKtaApps(ktaData);
        if (membersData?.length) setMembers(membersData);
      })().catch(err => console.warn('Background KTA approve sync warning:', err));

    } catch (e: any) {
      console.error(e);
      alert('Gagal menyetujui KTA: ' + (e.message || 'Cek koneksi'));
    }
  };

  const handleOpenRejectKTA = (appId: string) => {
    setRejectId(appId);
    setRejectReason('');
    setIsRejectModalOpen(true);
  };

  const handleRejectKTA = async () => {
    if (!rejectId) return;
    try {
      const curId = rejectId;
      const curReason = rejectReason;

      // 1. Optimistic update
      setKtaApps(prev => prev.map(k => String(k.id) === String(curId) ? { ...k, status: 'rejected', remark: curReason } : k));
      setIsRejectModalOpen(false);
      setRejectId(null);
      setRejectReason('');
      alert('Pengajuan KTA berhasil ditolak.');

      // 2. Background sync
      (async () => {
        await sheetsService.updateKTAStatus(curId, 'rejected', curReason);
        const [ktaData, membersData] = await Promise.all([
          sheetsService.getKTAApplications(),
          sheetsService.getMembers()
        ]);
        if (ktaData?.length) setKtaApps(ktaData);
        if (membersData?.length) setMembers(membersData);
      })().catch(err => console.warn('Background KTA reject sync warning:', err));

    } catch (e: any) {
      console.error(e);
      alert('Gagal menolak KTA: ' + (e.message || 'Cek koneksi'));
    }
  };

  const handleSaveEditKTA = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingKtaApp) return;
    try {
      const appToSave = { ...editingKtaApp };

      // 1. Optimistic update
      setKtaApps(prev => prev.map(k => String(k.id) === String(appToSave.id) ? appToSave : k));
      setIsEditKtaModalOpen(false);
      setEditingKtaApp(null);
      alert('Data KTA berhasil diperbarui!');

      // 2. Background save & sync
      (async () => {
        await sheetsService.saveKTAApplication(appToSave);
        if (appToSave.email || appToSave.userId) {
          const matchingMember = members.find(m => 
            (appToSave.userId && m.id === appToSave.userId) || 
            (m.email && appToSave.email && m.email.toLowerCase().trim() === appToSave.email.toLowerCase().trim())
          );
          if (matchingMember) {
            const updatedMember = {
              ...matchingMember,
              ...(appToSave.photo ? { photo: appToSave.photo } : {}),
              ...(appToSave.nama ? { namaLengkap: appToSave.nama } : {}),
              ...(appToSave.noWa ? { noHp: appToSave.noWa } : {}),
              ...(appToSave.asalDaerah ? { asalKwarda: appToSave.asalDaerah } : {}),
              ...(appToSave.qabilah ? { qabilah: appToSave.qabilah } : {})
            };
            await sheetsService.saveMember(updatedMember).catch(err => console.error("Sync member error:", err));
          }
        }
        const [ktaData, membersData] = await Promise.all([
          sheetsService.getKTAApplications(),
          sheetsService.getMembers()
        ]);
        if (ktaData?.length) setKtaApps(ktaData);
        if (membersData?.length) setMembers(membersData);
      })().catch(err => console.warn('Background edit KTA sync warning:', err));

    } catch (err: any) {
      console.error(err);
      alert('Gagal memperbarui data KTA: ' + (err.message || 'Cek koneksi'));
    }
  };

  const handleResequenceKTAs = async () => {
    if (!window.confirm("Apakah Anda yakin ingin merapikan dan menggeser urutan nomor KTA?\n\nProses ini akan menggeser nomor urut KTA di tiap Kwarda/Qabilah sehingga semua nomor urut anggota lengkap dari yang terkecil (11.XX.0001, 11.XX.0002, 11.XX.0003...) tanpa ada celah kosong.")) {
      return;
    }

    try {
      setIsResequencingKta(true);

      // 1. Optimistic local state update
      const resequencedKtas = resequenceKtaNumbers([...ktaApps]);
      const resequencedMembers = resequenceKtaNumbers([...members]);

      setKtaApps(resequencedKtas);
      setMembers(resequencedMembers);

      safeStorageSet('kta_applications', resequencedKtas);
      safeStorageSet('mock_members', resequencedMembers);

      // 2. Sync to Firestore in background
      await firestoreService.resequenceAndSaveAllKTAs();

      alert("Berhasil merapikan dan menggeser nomor KTA!\nSemua urutan anggota di tiap Kwarda/Qabilah kini lengkap dan rapat dari yang terkecil.");
    } catch (err: any) {
      console.error("Gagal merapikan nomor KTA:", err);
      alert("Gagal merapikan nomor KTA: " + (err?.message || "Terjadi kesalahan"));
    } finally {
      setIsResequencingKta(false);
    }
  };

  const handleDownloadPDFAdmin = async () => {
    if (!viewingKtaApp || isGeneratingPdfAdmin) return;
    setIsGeneratingPdfAdmin(true);
    try {
      const frontEl = (document.getElementById('kta-front-card-admin-view') || 
                       document.getElementById('kta-front-capture-admin') || 
                       document.querySelector('.kta-card-printable')) as HTMLElement | null;
      const backEl = (document.getElementById('kta-back-card-admin-view') || 
                      document.getElementById('kta-back-capture-admin') || 
                      document.querySelectorAll('.kta-card-printable')[1]) as HTMLElement | null;
      
      if (!frontEl || !backEl) {
        throw new Error("Elemen kartu tidak ditemukan");
      }

      // Helper to wait for all images inside an element to load
      const waitForImages = async (el: HTMLElement) => {
        const images = Array.from(el.querySelectorAll('img'));
        await Promise.all(
          images.map(img => {
            if (img.complete && img.naturalHeight !== 0) return Promise.resolve();
            return new Promise(resolve => {
              img.onload = resolve;
              img.onerror = resolve;
              setTimeout(resolve, 800);
            });
          })
        );
      };

      await Promise.all([waitForImages(frontEl), waitForImages(backEl)]);

      // Capture front card
      const frontCanvas = await safeHtml2Canvas(frontEl, {
        scale: 3, // 300 DPI high quality
        useCORS: true,
        allowTaint: true,
        backgroundColor: null
      });

      // Capture back card
      const backCanvas = await safeHtml2Canvas(backEl, {
        scale: 3, // 300 DPI high quality
        useCORS: true,
        allowTaint: true,
        backgroundColor: null
      });

      const frontImgData = safeCanvasToDataURL(frontCanvas);
      const backImgData = safeCanvasToDataURL(backCanvas);

      if (!frontImgData || !frontImgData.startsWith('data:image/')) {
        throw new Error("Gagal mengonversi kartu depan ke format gambar");
      }
      if (!backImgData || !backImgData.startsWith('data:image/')) {
        throw new Error("Gagal mengonversi kartu belakang ke format gambar");
      }

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // Title and Headers (A4 Portrait = 210mm x 297mm)
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(15);
      pdf.setTextColor(15, 118, 110); // hw-green color
      pdf.text('KARTU TANDA ANGGOTA DIGITAL', 105, 22, { align: 'center' });
      
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);
      pdf.setTextColor(100, 116, 139);
      pdf.text('Gerakan Kepanduan Hizbul Wathan Jawa Tengah', 105, 28, { align: 'center' });
      pdf.setFontSize(8);
      pdf.setTextColor(148, 163, 184);
      pdf.text('Standar Kartu Identitas ID-1 (85.60 mm × 53.98 mm) — Skala 1:1 (Actual Size)', 105, 32, { align: 'center' });

      // Divider line
      pdf.setDrawColor(226, 232, 240);
      pdf.setLineWidth(0.4);
      pdf.line(20, 36, 190, 36);

      // Standard ID-1 card dimensions (85.60 mm x 53.98 mm)
      const cardWidth = 85.60; 
      const cardHeight = 53.98;
      const xPos = (210 - cardWidth) / 2; // Exactly centered (62.20 mm)
      
      // FRONT CARD (Top)
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(8.5);
      pdf.setTextColor(71, 85, 105);
      pdf.text('TAMPILAN DEPAN (FRONT)', 105, 43, { align: 'center' });

      pdf.addImage(frontImgData, 'PNG', xPos, 46, cardWidth, cardHeight);
      pdf.setDrawColor(203, 213, 225);
      pdf.setLineWidth(0.2);
      pdf.rect(xPos, 46, cardWidth, cardHeight); // Cutting border guide

      // BACK CARD (Bottom)
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(8.5);
      pdf.setTextColor(71, 85, 105);
      pdf.text('TAMPILAN BELAKANG (BACK)', 105, 111, { align: 'center' });

      pdf.addImage(backImgData, 'PNG', xPos, 114, cardWidth, cardHeight);
      pdf.rect(xPos, 114, cardWidth, cardHeight); // Cutting border guide

      // Footer Print Guidelines
      pdf.setDrawColor(226, 232, 240);
      pdf.setFillColor(248, 250, 252);
      pdf.roundedRect(20, 180, 170, 48, 3, 3, 'FD');
      
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(8.5);
      pdf.setTextColor(15, 118, 110);
      pdf.text('PANDUAN CETAK & VERIFIKASI (SKALA 1:1):', 25, 187);

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(7.5);
      pdf.setTextColor(71, 85, 105);
      pdf.text('1. Cetak dokumen ini pada kertas A4 (Art Paper 230-300 gsm / PVC Card) dengan opsi "100% / Actual Size".', 25, 193);
      pdf.text('2. Ukuran hasil cetak sesuai standar kartu identitas nasional ID-1 (85.60 mm × 53.98 mm).', 25, 199);
      pdf.text('3. Potong mengikuti garis tepi tipis kartu depan dan belakang, lalu rekatkan atau lakukan press laminating.', 25, 205);
      pdf.text('4. QR Code di bagian belakang kartu berfungsi untuk verifikasi status keanggotaan resmi secara real-time.', 25, 211);
      pdf.text('5. Kartu ini merupakan dokumen resmi yang diterbitkan oleh Pimpinan Wilayah Hizbul Wathan Jawa Tengah.', 25, 217);

      const cleanFileName = (viewingKtaApp?.nama || 'Anggota').replace(/[^a-zA-Z0-9_-]/g, '_');
      pdf.save(`KTA_HW_${cleanFileName}.pdf`);
    } catch (err: any) {
      console.error('Error generating PDF:', err);
      alert('Gagal mengunduh KTA PDF: ' + (err?.message || 'Silakan coba kembali.'));
    } finally {
      setIsGeneratingPdfAdmin(false);
    }
  };

  const handleRejectMember = async (m: any) => {
    if (!window.confirm(`Apakah Anda yakin ingin menolak & menghapus pendaftaran anggota ${m.namaLengkap || 'ini'}?`)) return;
    try {
      // 1. Optimistic instant local removal
      setMembers(prev => prev.filter(mem => mem.id !== m.id));
      alert(`Pendaftaran ${m.namaLengkap || 'Anggota'} telah ditolak & dihapus dari antrean.`);

      // 2. Background delete & refresh
      (async () => {
        await sheetsService.deleteMember(m.id);
        const refreshed = await sheetsService.getMembers();
        if (refreshed?.length) setMembers(refreshed);
      })().catch(err => console.warn('Background delete member warning:', err));
    } catch (err: any) {
      console.error(err);
      alert('Gagal menolak pendaftaran: ' + (err.message || 'Error'));
    }
  };

  const handleApproveUpgrade = async (m: any, roleToApprove: string) => {
    try {
      let currentRoles: string[] = [];
      if (Array.isArray(m.roles)) {
        currentRoles = [...m.roles];
      } else if (m.role) {
        if (typeof m.role === 'string' && m.role.startsWith('[')) {
          try { currentRoles = JSON.parse(m.role); } catch { currentRoles = [m.role]; }
        } else {
          currentRoles = String(m.role).split(',').map((s: string) => s.trim()).filter(Boolean);
        }
      }
      if (!currentRoles.includes(roleToApprove)) {
        currentRoles.push(roleToApprove);
      }
      const synced = syncRolesAndPelatihan(currentRoles, m.pelatihan || []);
      const remainingRequests = (Array.isArray(m.upgradeRequests) ? m.upgradeRequests : []).filter((r: string) => r !== roleToApprove);
      const updatedMember = {
        ...m,
        role: synced.primaryRole,
        roles: synced.roles,
        pelatihan: synced.pelatihan,
        upgradeRequests: remainingRequests
      };

      // 1. Instantly update local members state
      setMembers(prev => prev.map(mem => mem.id === m.id ? updatedMember : mem));
      alert(`Permohonan upgrade ${ROLE_LABELS[roleToApprove] || roleToApprove} untuk ${m.namaLengkap || 'Anggota'} berhasil disetujui!`);

      // 2. Background save & refresh
      (async () => {
        await firestoreService.saveMember(updatedMember as User);
        await firestoreService.updateMember(m.id, updatedMember);
        await sheetsService.saveMember(updatedMember);
        const refreshed = await sheetsService.getMembers();
        if (refreshed?.length) setMembers(refreshed);
      })().catch(err => console.warn('Background approve upgrade sync warning:', err));

    } catch (err: any) {
      console.error(err);
      alert('Gagal menyetujui upgrade: ' + (err.message || 'Error'));
    }
  };

  const handleRejectUpgrade = async (m: any, roleToReject: string) => {
    try {
      const remainingRequests = (Array.isArray(m.upgradeRequests) ? m.upgradeRequests : []).filter((r: string) => r !== roleToReject);
      const updatedMember = {
        ...m,
        upgradeRequests: remainingRequests
      };

      // 1. Instantly update local members state
      setMembers(prev => prev.map(mem => mem.id === m.id ? updatedMember : mem));
      alert(`Permohonan upgrade ${ROLE_LABELS[roleToReject] || roleToReject} untuk ${m.namaLengkap || 'Anggota'} ditolak.`);

      // 2. Background save
      (async () => {
        await firestoreService.saveMember(updatedMember as User);
        await firestoreService.updateMember(m.id, updatedMember);
        await sheetsService.saveMember(updatedMember);
        const refreshed = await sheetsService.getMembers();
        if (refreshed?.length) setMembers(refreshed);
      })().catch(err => console.warn('Background reject upgrade sync warning:', err));

    } catch (err: any) {
      console.error(err);
      alert('Gagal menolak upgrade: ' + (err.message || 'Error'));
    }
  };

  // Training App Handlers
  const handleApproveTraining = async (appId: string) => {
    try {
      // 1. Optimistic local update
      setTrainingApps(prev => prev.map(t => {
        if (String(t.id) === String(appId)) {
          return {
            ...t,
            status: 'approved',
            statusPembayaran: 'Lunas'
          };
        }
        return t;
      }));

      const targetApp = trainingApps.find(t => String(t.id) === String(appId));
      if (targetApp) {
        setMembers(prev => prev.map(m => {
          if ((targetApp.userId && String(m.id) === String(targetApp.userId)) ||
              (targetApp.email && m.email && m.email.trim().toLowerCase() === targetApp.email.trim().toLowerCase())) {
            return {
              ...m,
              isVerified: true
            };
          }
          return m;
        }));
      }

      alert('Pendaftaran pelatihan berhasil disetujui!');

      // 2. Background save
      (async () => {
        await sheetsService.updateTrainingStatus(appId, 'approved');
        const [tApps, mData] = await Promise.all([
          sheetsService.getTrainingApplications(),
          sheetsService.getMembers()
        ]);
        if (tApps?.length) setTrainingApps(tApps);
        if (mData?.length) setMembers(mData);
      })().catch(err => console.warn('Background approve training sync warning:', err));

    } catch (e: any) {
      console.error(e);
      alert('Gagal menyetujui pendaftaran: ' + (e.message || 'Cek koneksi'));
    }
  };

  const handlePendingTraining = async (appId: string) => {
    try {
      // 1. Optimistic update
      setTrainingApps(prev => prev.map(t => String(t.id) === String(appId) ? { ...t, status: 'pending' } : t));
      alert('Status pendaftaran dikembalikan ke Menunggu!');

      // 2. Background sync
      (async () => {
        await sheetsService.updateTrainingStatus(appId, 'pending');
        const tApps = await sheetsService.getTrainingApplications();
        if (tApps?.length) setTrainingApps(tApps);
      })().catch(err => console.warn('Background pending training sync warning:', err));

    } catch (e: any) {
      console.error(e);
      alert('Gagal mengubah status pendaftaran ke Menunggu: ' + (e.message || 'Cek koneksi'));
    }
  };

  const handleSaveEditTraining = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTrainingApp) return;
    try {
      const appToSave = { ...editingTrainingApp };

      // 1. Optimistic update for both trainingApps AND members
      setTrainingApps(prev => prev.map(t => String(t.id) === String(appToSave.id) ? appToSave : t));
      setMembers(prev => prev.map(m => {
        if ((appToSave.userId && String(m.id) === String(appToSave.userId)) ||
            (appToSave.email && m.email && m.email.trim().toLowerCase() === appToSave.email.trim().toLowerCase()) ||
            (appToSave.nama && m.namaLengkap && m.namaLengkap.trim().toLowerCase() === appToSave.nama.trim().toLowerCase())) {
          const isApprovedOrLunas = appToSave.status === 'approved' || appToSave.statusPembayaran === 'Lunas';
          const pelList = Array.isArray(m.pelatihan) ? [...m.pelatihan] : [];
          if (appToSave.pelatihanAkanDiikuti && !pelList.includes(appToSave.pelatihanAkanDiikuti)) {
            pelList.push(appToSave.pelatihanAkanDiikuti);
          }
          return {
            ...m,
            namaLengkap: appToSave.nama || m.namaLengkap,
            noHp: appToSave.noWa || m.noHp,
            email: appToSave.email || m.email,
            pelatihan: pelList,
            statusPembayaran: appToSave.statusPembayaran || (isApprovedOrLunas ? 'Lunas' : (m.statusPembayaran || 'Belum Bayar')),
            statusAktivasi: isApprovedOrLunas ? 'Aktif' : (m.statusAktivasi || 'Belum Aktif'),
            isVerified: isApprovedOrLunas ? true : m.isVerified
          };
        }
        return m;
      }));

      setIsEditTrainingModalOpen(false);
      setEditingTrainingApp(null);
      alert('Data peserta pelatihan dan data anggota berhasil diperbarui!');

      // 2. Background save
      (async () => {
        await sheetsService.saveTrainingApplicationAndSyncMember(appToSave);
        const [tApps, mData] = await Promise.all([
          sheetsService.getTrainingApplications(),
          sheetsService.getMembers()
        ]);
        if (tApps?.length) setTrainingApps(tApps);
        if (mData?.length) setMembers(mData);
      })().catch(err => console.warn('Background save training edit sync warning:', err));

    } catch (err: any) {
      console.error(err);
      alert('Gagal menyimpan data: ' + (err.message || 'Cek koneksi'));
    }
  };

  const handleSaveSchedule = async (appId: string) => {
    try {
      const targetLokasi = editLokasi;
      const targetTanggal = editTanggal;

      // Optimistic update
      setTrainingApps(prev => prev.map(t => String(t.id) === String(appId) ? { ...t, lokasiPelatihan: targetLokasi, tanggalPelatihan: targetTanggal } : t));
      setEditingScheduleAppId(null);
      alert('Jadwal dan lokasi pelatihan berhasil diperbarui!');

      // Background save
      (async () => {
        await sheetsService.updateTrainingSchedule(appId, targetLokasi, targetTanggal);
        const tApps = await sheetsService.getTrainingApplications();
        if (tApps?.length) setTrainingApps(tApps);
      })().catch(err => console.warn('Background save schedule warning:', err));

    } catch (e: any) {
      console.error(e);
      alert('Gagal memperbarui jadwal: ' + (e.message || 'Cek koneksi'));
    }
  };

  const handleOpenRejectTraining = (appId: string) => {
    setTrainingRejectId(appId);
    setTrainingRejectReason('');
    setIsTrainingRejectModalOpen(true);
  };

  const handleRejectTraining = async () => {
    if (!trainingRejectId) return;
    try {
      const curId = trainingRejectId;
      const curReason = trainingRejectReason;

      // 1. Optimistic update
      setTrainingApps(prev => prev.map(t => String(t.id) === String(curId) ? { ...t, status: 'rejected', remark: curReason } : t));
      setIsTrainingRejectModalOpen(false);
      setTrainingRejectId(null);
      setTrainingRejectReason('');
      alert('Pendaftaran pelatihan berhasil ditolak.');

      // 2. Background sync
      (async () => {
        await sheetsService.updateTrainingStatus(curId, 'rejected', curReason);
        const tApps = await sheetsService.getTrainingApplications();
        if (tApps?.length) setTrainingApps(tApps);
      })().catch(err => console.warn('Background reject training sync warning:', err));

    } catch (e: any) {
      console.error(e);
      alert('Gagal menolak pendaftaran: ' + (e.message || 'Cek koneksi'));
    }
  };

  // Activity Handlers
  const handleOpenActivityModal = (activity?: any) => {
    if (activity) {
      setEditingKegiatan(activity);
      setKegiatanFormData({
        namaKegiatan: activity.namaKegiatan || activity.title || activity.jenisPelatihan || '',
        kategori: activity.kategori || activity.category || 'Rapat HW',
        tanggal: activity.tanggal || activity.tanggalPelatihan || activity.startDate || '',
        lokasi: activity.lokasi || activity.lokasiPelatihan || activity.location || '',
        biaya: activity.biaya || activity.biayaPelatihan || 'Gratis',
        status: activity.status || 'Buka',
        kuota: activity.kuota || '100 Peserta',
        deskripsi: activity.deskripsi || activity.description || '',
        gambarUrl: activity.gambarUrl || activity.imageUrl || 'https://images.unsplash.com/photo-1510312305653-8ed496efae75?auto=format&fit=crop&q=80&w=800',
        youtubeUrl: activity.youtubeUrl || activity.videoUrl || activity.youtube || activity.linkYoutube || '',
        themeSongUrl: activity.themeSongUrl || activity.themeSong || '',
        themeSongTitle: activity.themeSongTitle || activity.themeSongName || '',
        penyelenggara: activity.penyelenggara || 'Kwartir Wilayah HW Jawa Tengah',
        rekeningPembiayaan: activity.rekeningPembiayaan || activity.rekeningPembayaran || 'Bank Syariah Indonesia (BSI) 7307427448 a.n. Kwarwil HW Jateng',
        noWhatsappPanitia: activity.noWhatsappPanitia || activity.noKonfirmasi || activity.konfirmasiPembayaran || '089688754000',
        proposalUrl: activity.proposalUrl || activity.proposal || activity.linkProposal || ''
      });
    } else {
      setEditingKegiatan(null);
      setKegiatanFormData({
        namaKegiatan: '',
        kategori: 'Rapat HW',
        tanggal: '',
        lokasi: '',
        biaya: 'Gratis',
        status: 'Buka',
        kuota: '100 Peserta',
        deskripsi: '',
        gambarUrl: 'https://images.unsplash.com/photo-1510312305653-8ed496efae75?auto=format&fit=crop&q=80&w=800',
        youtubeUrl: '',
        themeSongUrl: '',
        themeSongTitle: '',
        penyelenggara: 'Kwartir Wilayah HW Jawa Tengah',
        rekeningPembiayaan: 'Bank Syariah Indonesia (BSI) 7307427448 a.n. Kwarwil HW Jateng',
        noWhatsappPanitia: '089688754000',
        proposalUrl: ''
      });
    }
    setIsKegiatanModalOpen(true);
  };

  const handleSaveActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!kegiatanFormData.namaKegiatan) {
      alert('Nama kegiatan wajib diisi');
      return;
    }
    try {
      setLoading(true);
      const actId = editingKegiatan ? editingKegiatan.id : `act-${Date.now()}`;
      const isPel = kegiatanFormData.kategori === 'Pelatihan' || 
                    kegiatanFormData.kategori === 'Diklat' || 
                    isOnlyTrainingActivity({
                      namaKegiatan: kegiatanFormData.namaKegiatan,
                      title: kegiatanFormData.namaKegiatan,
                      kategori: kegiatanFormData.kategori,
                      lokasi: kegiatanFormData.lokasi
                    });

      const payload = {
        ...(editingKegiatan || {}),
        ...kegiatanFormData,
        id: actId,
        namaKegiatan: kegiatanFormData.namaKegiatan,
        title: kegiatanFormData.namaKegiatan,
        tanggal: kegiatanFormData.tanggal,
        tanggalPelatihan: kegiatanFormData.tanggal,
        startDate: kegiatanFormData.tanggal,
        lokasi: kegiatanFormData.lokasi,
        lokasiPelatihan: kegiatanFormData.lokasi,
        location: kegiatanFormData.lokasi,
        biaya: kegiatanFormData.biaya,
        biayaPelatihan: kegiatanFormData.biaya,
        gambarUrl: kegiatanFormData.gambarUrl,
        imageUrl: kegiatanFormData.gambarUrl,
        gambar: kegiatanFormData.gambarUrl,
        posterUrl: kegiatanFormData.gambarUrl,
        coverImage: kegiatanFormData.gambarUrl,
        youtubeUrl: kegiatanFormData.youtubeUrl,
        videoUrl: kegiatanFormData.youtubeUrl,
        youtube: kegiatanFormData.youtubeUrl,
        linkYoutube: kegiatanFormData.youtubeUrl,
        themeSongUrl: kegiatanFormData.themeSongUrl,
        themeSong: kegiatanFormData.themeSongUrl,
        themeSongTitle: kegiatanFormData.themeSongTitle,
        themeSongName: kegiatanFormData.themeSongTitle,
        rekeningPembayaran: kegiatanFormData.rekeningPembiayaan,
        rekeningPembiayaan: kegiatanFormData.rekeningPembiayaan,
        nomorRekening: kegiatanFormData.rekeningPembiayaan,
        noWhatsappPanitia: kegiatanFormData.noWhatsappPanitia,
        konfirmasiPembayaran: kegiatanFormData.noWhatsappPanitia,
        noWaKonfirmasi: kegiatanFormData.noWhatsappPanitia,
        proposalUrl: kegiatanFormData.proposalUrl,
        proposal: kegiatanFormData.proposalUrl,
        linkProposal: kegiatanFormData.proposalUrl,
        isPelatihan: isPel,
        updatedAt: new Date().toISOString()
      };
      const saved = await sheetsService.saveActivity(payload);

      // Keep React settings state in sync so future saveSettings calls won't overwrite with stale data
      if (isPel) {
        const currentActs = [...(settings.trainingActivities || [])];
        const normTitle = (kegiatanFormData.namaKegiatan || '').trim().toLowerCase();
        const filteredActs = currentActs.filter((a: any) => {
          if (a.id === actId) return false;
          const aTitle = (a.namaKegiatan || a.title || a.jenisPelatihan || '').trim().toLowerCase();
          if (aTitle && normTitle && (aTitle === normTitle || aTitle.includes(normTitle) || normTitle.includes(aTitle))) return false;
          return true;
        });
        filteredActs.unshift(saved || payload);
        const locs = Array.isArray(settings.trainingLocations) ? [...settings.trainingLocations] : [];
        if (kegiatanFormData.lokasi && !locs.includes(kegiatanFormData.lokasi)) locs.push(kegiatanFormData.lokasi);
        const dts = Array.isArray(settings.trainingDates) ? [...settings.trainingDates] : [];
        if (kegiatanFormData.tanggal && !dts.includes(kegiatanFormData.tanggal)) dts.push(kegiatanFormData.tanggal);
        setSettings(prev => ({
          ...prev,
          trainingActivities: filteredActs,
          trainingLocations: locs,
          trainingDates: dts
        }));
      }

      alert(editingKegiatan ? 'Kegiatan berhasil diperbarui dan tersimpan ke Spreadsheet & Firebase!' : 'Kegiatan baru berhasil dibuat dan tersimpan ke Spreadsheet & Firebase!');
      setIsKegiatanModalOpen(false);
      const actData = await sheetsService.getActivities();
      setActivitiesList(actData || []);
    } catch (err: any) {
      alert('Gagal menyimpan kegiatan: ' + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteActivity = async (id: string, title?: string) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus kegiatan ini?')) return;
    try {
      setLoading(true);
      await sheetsService.deleteActivity(id, title);

      // Keep React settings state in sync
      const filteredActs = (settings.trainingActivities || []).filter((a: any) => a.id !== id && (!title || (a.namaKegiatan || a.title) !== title));
      setSettings(prev => ({ ...prev, trainingActivities: filteredActs }));

      alert('Kegiatan berhasil dihapus dari Cloud Firestore');
      const actData = await sheetsService.getActivities();
      setActivitiesList(actData || []);
    } catch (err: any) {
      alert('Gagal menghapus kegiatan: ' + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEditActivityParticipantModal = (participant: any) => {
    setEditingActivityParticipant({ ...participant });
    setIsEditActivityParticipantModalOpen(true);
  };

  const handleSaveActivityParticipant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingActivityParticipant) return;
    try {
      setLoading(true);
      await sheetsService.registerActivity(editingActivityParticipant);
      alert('Data peserta kegiatan berhasil diperbarui!');
      setIsEditActivityParticipantModalOpen(false);
      setEditingActivityParticipant(null);
      const updatedApps = await sheetsService.getActivityApplications();
      setActivityApplicationsList(updatedApps || []);
    } catch (err: any) {
      alert('Gagal memperbarui data peserta: ' + (err.message || 'Cek koneksi'));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteActivityParticipant = async (id: string) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus data peserta kegiatan ini?')) return;
    try {
      setLoading(true);
      await sheetsService.deleteActivityApplication(id);
      alert('Data peserta berhasil dihapus!');
      const updatedApps = await sheetsService.getActivityApplications();
      setActivityApplicationsList(updatedApps || []);
    } catch (err: any) {
      alert('Gagal menghapus data peserta: ' + (err.message || 'Cek koneksi'));
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateAttendance = async (appId: string, dayKey: string, isPresent: boolean) => {
    try {
      const app = trainingApps.find(a => String(a.id) === String(appId));
      if (!app) {
        throw new Error('Pendaftaran tidak ditemukan.');
      }
      
      let attObj: Record<string, any> = {};
      if (app.kehadiran) {
        attObj = safeJsonParse<Record<string, any>>(app.kehadiran, {});
      }
      
      const now = new Date();
      const dateStr = now.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' });
      const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

      if (isPresent) {
        attObj[dayKey] = {
          status: 'hadir',
          timestamp: `${dateStr} pukul ${timeStr} (Admin)`
        };
      } else {
        attObj[dayKey] = {
          status: 'absen',
          timestamp: `${dateStr} pukul ${timeStr} (Admin)`
        };
      }
      
      const kehadiranStr = JSON.stringify(attObj);
      
      await sheetsService.updateAttendance(appId, kehadiranStr);
      const updated = await sheetsService.getTrainingApplications();
      setTrainingApps(updated || []);
    } catch (err: any) {
      alert('Gagal update kehadiran: ' + err.message);
    }
  };

  const getCalculatedGrading = (app: any) => {
    const targetKey = getNormalizedLevelKey(app.pelatihanAkanDiikuti || app.jenisPelatihan);
    const prog = TRAINING_PROGRAMS.find(p => getNormalizedLevelKey(p.id) === targetKey) || TRAINING_PROGRAMS[0];
    const sessions = prog ? prog.sessions.map(s => s.id) : ['Sesi 1', 'Sesi 2', 'Sesi 3'];

    let attObj: Record<string, any> = {};
    if (app.kehadiran) {
      attObj = safeJsonParse<Record<string, any>>(app.kehadiran, {});
    }
    const totalSessions = sessions.length;
    const attendedSessions = sessions.filter(sesi => isSessionPresent(attObj, sesi)).length;
    const attendancePercentage = totalSessions > 0 
      ? Math.round((attendedSessions / totalSessions) * 100) 
      : 0;

    const assignedTasksForLevel = settings.assignedTasks?.filter((t: any) => t.level === app.pelatihanAkanDiikuti) || [];
    let submittedTasks: any[] = [];
    try {
      if (app.tugas) {
        submittedTasks = typeof app.tugas === 'string' ? JSON.parse(app.tugas) : app.tugas;
        if (!Array.isArray(submittedTasks)) submittedTasks = [submittedTasks];
      }
    } catch (e) {}

    const totalAssignedTasks = assignedTasksForLevel.length;
    const submittedAssignedCount = assignedTasksForLevel.filter((t: any) => 
      submittedTasks.some((sub: any) => String(sub.materiId) === String(t.materiId))
    ).length;

    const assignmentPercentage = totalAssignedTasks > 0 
      ? Math.round((submittedAssignedCount / totalAssignedTasks) * 100) 
      : attendancePercentage;

    const finalPercentage = Math.round((attendancePercentage + assignmentPercentage) / 2);

    let calculatedStatus = 'Tidak Lulus';
    if (finalPercentage >= 80) {
      calculatedStatus = 'Lulus';
    } else if (finalPercentage >= 51) {
      calculatedStatus = 'Lulus Bersyarat';
    }

    return {
      attendancePercentage,
      assignmentPercentage,
      finalPercentage,
      calculatedStatus,
      totalSessions,
      attendedSessions,
      totalAssignedTasks,
      submittedAssignedCount
    };
  };

  const handleOpenGradingModal = (app: any) => {
    setSelectedTrainingApp(app);
    const calc = getCalculatedGrading(app);
    setGradeInput(app.nilai || `${calc.finalPercentage}%`);
    setRemarkInput(app.remark || `Presensi: ${calc.attendancePercentage}% (${calc.attendedSessions}/${calc.totalSessions} Sesi), Tugas: ${calc.assignmentPercentage}% (${calc.submittedAssignedCount}/${calc.totalAssignedTasks} Tugas)`);
    setGraduationStatusInput(app.statusKelulusan || calc.calculatedStatus);
    setIsGradingModalOpen(true);
  };

  const handleSaveGradeAndRemark = async () => {
    if (!selectedTrainingApp) return;
    try {
      setLoading(true);
      await sheetsService.updateGrade(selectedTrainingApp.id, { 
        grade: gradeInput, 
        remark: remarkInput,
        statusKelulusan: graduationStatusInput || selectedTrainingApp.statusKelulusan || 'Lulus'
      });
      alert('Nilai & ulasan penugasan berhasil disimpan!');
      setIsGradingModalOpen(false);
      setSelectedTrainingApp(null);
      const updated = await sheetsService.getTrainingApplications();
      setTrainingApps(updated || []);
    } catch (err: any) {
      alert('Gagal simpan nilai: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const isValidName = (name?: string) => {
    if (!name) return false;
    const trimmed = name.trim().toLowerCase();
    return trimmed !== '' && trimmed !== 'tanpa nama' && trimmed !== '-' && trimmed !== 'null' && trimmed !== 'undefined' && trimmed !== 'kta-hw.jt.xxxx';
  };

  const isValidTrainingApp = (t: any) => {
    if (!t) return false;
    const name = (t?.nama || t?.namaLengkap || '').trim();
    const email = (t?.email || '').toLowerCase().trim();
    const sysEmails = ['admin@hwjateng.com', 'materihw@gmail.com', 'medkom@hwjateng.com', 'admin@hw.org'];
    if (sysEmails.includes(email)) return false;
    if (!name || name === '-' || name.toLowerCase() === 'tanpa nama' || name.includes('@') || !isValidName(name)) return false;
    const prog = (t?.pelatihanAkanDiikuti || '').trim();
    if (!prog || prog === '-') return false;
    if (t?.id && (String(t.id).startsWith('training-100') || String(t.id).startsWith('train-api-'))) return false;
    return true;
  };

  const fetchData = async () => {
    const isValidName = (name?: string) => {
      if (!name) return false;
      const trimmed = name.trim().toLowerCase();
      return trimmed !== '' && trimmed !== 'tanpa nama' && trimmed !== '-' && trimmed !== 'null' && trimmed !== 'undefined';
    };

    const isValidMember = (m: any) => {
      if (!m) return false;
      const name = m.namaLengkap || m.nama || '';
      const email = m.email || '';
      const phone = m.noHp || m.nowa || '';
      const kta = m.ktaNumber || '';
      return isValidName(name) || email !== '' || phone !== '' || kta !== '';
    };

    // 1. Instant cache pre-fill to render UI immediately without blank/spinner delay
    try {
      const cachedMembers = localStorage.getItem('mock_members');
      const cachedKtas = localStorage.getItem('kta_applications');
      const cachedTrainings = localStorage.getItem('training_applications');
      const cachedMateri = localStorage.getItem('materi');
      const cachedContents = localStorage.getItem('contents');
      const cachedActivities = localStorage.getItem('hw_activities');
      const cachedActRegs = localStorage.getItem('activity_applications');

      if (cachedMembers) { setMembers(safeJsonParse(cachedMembers, []).filter(isValidMember)); }
      if (cachedKtas) { setKtaApps(safeJsonParse(cachedKtas, []).filter((k: any) => isValidName(k?.nama || k?.namaLengkap))); }
      if (cachedTrainings) { setTrainingApps(safeJsonParse(cachedTrainings, []).filter((t: any) => isValidTrainingApp(t))); }
      if (cachedMateri) { setMateriList(safeJsonParse(cachedMateri, [])); }
      if (cachedContents) { setContents(safeJsonParse(cachedContents, [])); }
      if (cachedActivities) { setActivitiesList(safeJsonParse(cachedActivities, [])); }
      if (cachedActRegs) { setActivityApplicationsList(sortActivityAppsByDate(safeJsonParse(cachedActRegs, []), true)); }
    } catch (e) {
      console.warn('Cache prefill warning:', e);
    }

    // Set loading false right away so dashboard is always clickable and responsive
    setLoading(false);

    // Highly deferred background sync tasks so initial transition is silky smooth (4s delay)
    setTimeout(() => {
      if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
        (window as any).requestIdleCallback(() => {
          sheetsService.syncApprovedKtasToMembers().catch(err => console.warn('Silent auto-sync failed:', err));
          firestoreService.purgeEmptyData().catch(() => {});
        });
      } else {
        sheetsService.syncApprovedKtasToMembers().catch(err => console.warn('Silent auto-sync failed:', err));
        firestoreService.purgeEmptyData().catch(() => {});
      }
    }, 4000);

    // Progressive background fetch so slow endpoints never block others
    sheetsService.getMembers().then(members => {
      if (Array.isArray(members) && members.length > 0) {
        setMembers(members.filter(isValidMember));
      }
    }).catch(e => console.warn('getMembers error:', e));

    sheetsService.getKTAApplications().then(ktas => {
      if (ktas) setKtaApps((ktas || []).filter(k => isValidName(k?.nama || k?.namaLengkap)));
    }).catch(e => console.warn('getKTAApplications error:', e));

    sheetsService.getTrainingApplications().then(trainings => {
      if (trainings) setTrainingApps((trainings || []).filter(t => isValidTrainingApp(t)));
    }).catch(e => console.warn('getTrainingApplications error:', e));

    sheetsService.getActivities().then(activities => {
      if (activities) setActivitiesList(activities || []);
    }).catch(e => console.warn('getActivities error:', e));

    // Stagger non-critical UI datasets by 400ms to preserve frame rate
    setTimeout(() => {
      sheetsService.getMateri('admin').then(materi => {
        if (materi) setMateriList(materi);
      }).catch(e => console.warn('getMateri error:', e));

      sheetsService.getContents().then(contents => {
        if (contents) setContents(contents);
      }).catch(e => console.warn('getContents error:', e));

      sheetsService.getActivityApplications().then(actRegs => {
        if (actRegs) setActivityApplicationsList(sortActivityAppsByDate(actRegs || [], true));
      }).catch(e => console.warn('getActivityApplications error:', e));

      sheetsService.getSettings().then(settingsData => {
        if (settingsData) {
          setSettings(prev => ({
            ...prev,
            ...settingsData,
            gSheetApiUrl: prev.gSheetApiUrl,
            trainingTypes: Array.isArray(settingsData.trainingTypes) ? settingsData.trainingTypes : ['Jaya Melati 1', 'Jaya Melati 2', 'Jaya Matahari 1', 'Jaya Matahari 2'],
            trainingActivities: (Array.isArray(settingsData.trainingActivities) ? settingsData.trainingActivities : []).filter(isOnlyTrainingActivity),
            trainingLocations: Array.isArray(settingsData.trainingLocations) ? settingsData.trainingLocations : [],
            trainingDates: Array.isArray(settingsData.trainingDates) ? settingsData.trainingDates : [],
            assignedTasks: Array.isArray(settingsData.assignedTasks) 
              ? settingsData.assignedTasks 
              : safeJsonParse<any[]>(settingsData.assignedTasks, [])
          }));
        }
      }).catch(e => console.warn('getSettings error:', e));
    }, 400);
  };

  useEffect(() => {
    fetchData();

    const unsubMembers = sheetsService.subscribeToMembers((mList: any[]) => {
      const isValidName = (name?: string) => {
        if (!name) return false;
        const trimmed = name.trim().toLowerCase();
        return trimmed !== '' && trimmed !== 'tanpa nama' && trimmed !== '-' && trimmed !== 'null' && trimmed !== 'undefined';
      };
      if (Array.isArray(mList) && mList.length > 0) {
        setMembers((mList || []).filter(m => isValidName(m?.namaLengkap || (m as any)?.nama)));
      }
    });

    const unsubCategories = sheetsService.subscribeToActivityCategories((cats: string[]) => {
      setActivityCategoriesList(cats);
    });

    const unsubActivities = sheetsService.subscribeToActivities((acts: any[]) => {
      setActivitiesList(acts || []);
      if (Array.isArray(acts) && acts.length > 0) {
        const trainActs = acts.filter(isOnlyTrainingActivity);
        if (trainActs.length > 0) {
          setSettings(prev => {
            const m = new Map<string, any>();
            (prev.trainingActivities || []).filter(isOnlyTrainingActivity).forEach((a: any) => { if (a && a.id) m.set(a.id, a); });
            trainActs.forEach((a: any) => {
              if (a && a.id) {
                if (m.has(a.id)) {
                  m.set(a.id, { ...m.get(a.id), ...a });
                } else {
                  m.set(a.id, a);
                }
              }
            });
            const allActs = Array.from(m.values()).filter(isOnlyTrainingActivity);
            const locs = Array.isArray(prev.trainingLocations) ? [...prev.trainingLocations] : [];
            const dts = Array.isArray(prev.trainingDates) ? [...prev.trainingDates] : [];
            allActs.forEach((a: any) => {
              const loc = a.lokasiPelatihan || a.lokasi || a.location;
              if (loc && !locs.includes(loc)) locs.push(loc);
              const dt = a.tanggalPelatihan || a.tanggal || a.startDate;
              if (dt && !dts.includes(dt)) dts.push(dt);
            });
            return {
              ...prev,
              trainingActivities: allActs,
              trainingLocations: locs,
              trainingDates: dts
            };
          });
        }
      }
    });

    const unsubApps = sheetsService.subscribeToActivityApplications((apps: any[]) => {
      setActivityApplicationsList(sortActivityAppsByDate(apps || [], true));
    });

    const unsubTrainingApps = sheetsService.subscribeToTrainingApplications((tApps: any[]) => {
      if (Array.isArray(tApps) && tApps.length > 0) {
        setTrainingApps(tApps.filter(t => isValidTrainingApp(t)));
      }
    });

    return () => {
      unsubMembers();
      unsubCategories();
      unsubActivities();
      unsubApps();
      unsubTrainingApps();
    };
  }, []);

  const handleSelectSection = (section: string) => {
    setSelectedContentSection(section);
    // Filter contents for this section
    const sectionItems = contents.filter(c => c.section === section);
    setContentList(sectionItems);
  };

  const handleOpenContentModal = (content?: Content) => {
    if (content) {
      setEditingContent(content);
      const isPl = selectedContentSection === 'playlist' || content.section === 'playlist';
      const resolved = isPl ? resolveTrackMetadata(content) : null;
      setContentFormData({
        field1: content.field1 || (content as any).audioUrl || (content as any).audiourl || (resolved ? resolved.audioUrl : '') || '',
        field2: content.field2 || (content as any).judul || (content as any).title || (resolved ? resolved.title : '') || '',
        field3: content.field3 || (content as any).pencipta || (content as any).creator || (resolved && resolved.creator && resolved.creator !== 'Pandu Hizbul Wathan' ? resolved.creator : '') || '',
        field4: content.field4 || '',
        field5: content.field5 || content.lyrics || (content as any).lirik || (resolved && resolved.lyrics && !resolved.lyrics.includes('Lirik lagu belum tersedia') ? resolved.lyrics : '') || ''
      });
    } else {
      setEditingContent(null);
      setContentFormData({
        field1: '',
        field2: '',
        field3: '',
        field4: '',
        field5: ''
      });
    }
    setIsContentModalOpen(true);
  };

    const handleSaveContent = async () => {
      if (!selectedContentSection) return;
      
      // Simple validation for list types
      if (['galeri', 'playlist'].includes(selectedContentSection)) {
        if (selectedContentSection === 'galeri' && !contentFormData.field1) {
          alert('URL Video Youtube harus diisi');
          return;
        }
        if (selectedContentSection === 'playlist' && !contentFormData.field1) {
          alert('Link File Audio (Drive/URL) harus diisi');
          return;
        }
        if (selectedContentSection === 'playlist' && !contentFormData.field2) {
          alert('Judul harus diisi');
          return;
        }
      }
      
      try {
        setLoading(true);
        const isList = ['galeri', 'playlist'].includes(selectedContentSection);
      
      const payload: any = {
        section: selectedContentSection,
        type: isList ? 'list' : 'single',
        field1: (contentFormData.field1 || '').trim(),
        field2: (contentFormData.field2 || '').trim(),
        field3: (contentFormData.field3 || '').trim(),
        field4: '',
        field5: (contentFormData.field5 || '').trim(),
        lirik: (contentFormData.field5 || '').trim(),
        lyrics: (contentFormData.field5 || '').trim(),
        pencipta: (contentFormData.field3 || '').trim(),
        creator: (contentFormData.field3 || '').trim(),
        judul: (contentFormData.field2 || '').trim(),
        title: (contentFormData.field2 || '').trim(),
        audioUrl: (contentFormData.field1 || '').trim(),
        audiourl: (contentFormData.field1 || '').trim()
      };

      if (editingContent) {
        payload.id = editingContent.id;
      } else {
        // For single types, check if we already have one
        if (!isList && contentList.length > 0) {
          payload.id = contentList[0].id;
        } else {
          payload.id = selectedContentSection === 'playlist' ? `playlist-${Date.now()}` : Date.now().toString();
        }
      }

      const res = await sheetsService.saveContent(payload);
      if (res.error) throw new Error(res.error);
      
      // Refresh
      const allContents = await sheetsService.getContents();
      setContents(allContents);
      setContentList(allContents.filter(c => c.section === selectedContentSection));
      setIsContentModalOpen(false);
      
      // Reset form
      setContentFormData({
        field1: '',
        field2: '',
        field3: '',
        field4: '',
        field5: ''
      });
    } catch (error: any) {
      alert('Gagal menyimpan konten: ' + (error.message || 'Error tidak diketahui'));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteContent = async (id: string) => {
    if (confirm('Yakin ingin menghapus konten ini?')) {
      try {
        setLoading(true);
        await sheetsService.deleteContent(id);
        const allContents = await sheetsService.getContents();
        setContents(allContents);
        setContentList(allContents.filter(c => c.section === selectedContentSection));
      } catch (error) {
        alert('Gagal menghapus konten');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleOpenMateriModal = (materi?: Materi) => {
    if (materi) {
      setEditingMateri(materi);
      setMateriFormData({
        judul: materi.judul,
        konten: materi.konten,
        kategori: materi.kategori,
        coverImage: materi.coverImage || 'https://upload.wikimedia.org/wikipedia/id/b/ba/Logo_Hizbul_Wathan.png',
        driveUrl: materi.driveUrl || ''
      });
    } else {
      setEditingMateri(null);
      setMateriFormData({
        judul: '',
        konten: '',
        kategori: 'umum',
        coverImage: 'https://upload.wikimedia.org/wikipedia/id/b/ba/Logo_Hizbul_Wathan.png',
        driveUrl: ''
      });
    }
    setIsMateriModalOpen(true);
  };

  const handleSaveMateri = async () => {
    try {
      setLoading(true);
      if (editingMateri) {
        await sheetsService.saveMateri({ ...editingMateri, ...materiFormData });
      } else {
        await sheetsService.saveMateri({ 
          ...materiFormData, 
          id: Date.now().toString(),
          tanggal: new Date().toISOString()
        });
      }
      // Refresh list
      const data = await sheetsService.getMateri('admin');
      setMateriList(data);
      setIsMateriModalOpen(false);
    } catch (error) {
      alert('Gagal menyimpan materi');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMateri = async (id: string) => {
    if (confirm('Yakin ingin menghapus materi ini?')) {
      try {
        setLoading(true);
        await sheetsService.deleteMateri(id);
        const data = await sheetsService.getMateri('admin');
        setMateriList(data);
      } catch (error) {
        alert('Gagal menghapus materi');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleOpenModal = (member?: any, defaultRole: string = 'umum') => {
    if (member) {
      setEditingMember(member);
      
      const matchingKta = ktaApps.find((app: any) => 
        (member.id && app.userId === member.id) || 
        (app.email && member.email && String(app.email).toLowerCase().trim() === String(member.email).toLowerCase().trim())
      );

      const rawRoles = parseRolesField(member.roles, member.role);
      const pelatihanArr = Array.isArray(member.pelatihan) ? member.pelatihan : (typeof member.pelatihan === 'string' ? member.pelatihan.split(',').map((s: string) => s.trim()).filter(Boolean) : []);
      const synced = syncRolesAndPelatihan(rawRoles, pelatihanArr);

      setFormData({
        email: member.email || matchingKta?.email || '',
        namaLengkap: matchingKta?.nama || member.namaLengkap || member.nama || '',
        role: synced.primaryRole,
        roles: synced.roles,
        jenisKelamin: matchingKta?.jenisKelamin || member.jenisKelamin || 'L',
        golongan: matchingKta?.tingkatan || member.golongan || 'Penghela',
        golonganPelatih: (member as any)?.golonganPelatih || (['Athfal', 'Pengenal', 'Penghela', 'Penuntun'].includes(member?.golongan || '') ? member.golongan : 'Penghela'),
        pelatihan: synced.pelatihan,
        pendidikan: member.pendidikan || 'SMA/SMK/MA',
        asalKwarda: matchingKta?.asalDaerah || member.asalKwarda || '',
        qabilah: matchingKta?.qabilah || member.qabilah || '',
        alamat: matchingKta?.alamat || member.alamat || '',
        noHp: matchingKta?.noWa || member.noHp || '',
        sosmed: matchingKta?.sosmed || member.sosmed || '',
        password: '', // Always empty when opening for security, only update if typed
        isVerified: matchingKta?.status === 'approved' ? true : (member.isVerified ?? true),
        upgradeRequests: Array.isArray(member.upgradeRequests) ? member.upgradeRequests : [],
        photo: matchingKta?.photo || member.photo || member.foto || '',
        tempatLahir: matchingKta?.tempatLahir || member.tempatLahir || '',
        tanggalLahir: matchingKta?.tanggalLahir || member.tanggalLahir || '',
        statusKta: matchingKta?.status || (member.isVerified ? 'approved' : 'pending'),
        ktaNumber: matchingKta?.ktaNumber || member.ktaNumber || '',
        jenisKta: matchingKta?.jenisKta || 'Reguler'
      });
    } else {
      const syncedNew = syncRolesAndPelatihan([defaultRole], []);
      setEditingMember(null);
      setFormData({
        email: '',
        namaLengkap: '',
        role: syncedNew.primaryRole,
        roles: syncedNew.roles,
        jenisKelamin: 'L',
        golongan: 'Penghela',
        golonganPelatih: 'Penghela',
        pelatihan: syncedNew.pelatihan,
        pendidikan: 'SMA/SMK/MA',
        asalKwarda: '',
        qabilah: '',
        alamat: '',
        noHp: '',
        sosmed: '',
        password: '',
        isVerified: true,
        upgradeRequests: [],
        photo: '',
        tempatLahir: '',
        tanggalLahir: '',
        statusKta: 'approved',
        ktaNumber: '',
        jenisKta: 'Reguler'
      });
    }
    setIsModalOpen(true);
  };

  const handleSaveMember = async () => {
    try {
      setLoading(true);
      const synced = syncRolesAndPelatihan(formData.roles, formData.pelatihan);
      const isJM = synced.roles.includes('jari1') || synced.roles.includes('jari2') || synced.roles.includes('jaya_matahari_1') || synced.roles.includes('jaya_matahari_2') || synced.primaryRole === 'jari1' || synced.primaryRole === 'jari2';
      const memberId = editingMember?.id || Date.now().toString();
      const primaryRole = synced.primaryRole;

      const payload = editingMember 
        ? { 
            ...editingMember, 
            ...formData,
            id: memberId,
            role: primaryRole,
            roles: synced.roles && synced.roles.length > 0 ? synced.roles : [primaryRole],
            pelatihan: synced.pelatihan,
            photo: formData.photo,
            noHp: formData.noHp,
            asalKwarda: formData.asalKwarda,
            qabilah: formData.qabilah,
            alamat: formData.alamat,
            tempatLahir: formData.tempatLahir,
            tanggalLahir: formData.tanggalLahir,
            jenisKelamin: formData.jenisKelamin,
            ...(isJM ? {
              golongan: formData.golonganPelatih || formData.golongan,
              golonganPelatih: formData.golonganPelatih || formData.golongan
            } : {})
          }
        : { 
            ...formData, 
            id: memberId,
            role: primaryRole,
            roles: synced.roles && synced.roles.length > 0 ? synced.roles : [primaryRole],
            pelatihan: synced.pelatihan,
            photo: formData.photo,
            ...(isJM ? {
              golongan: formData.golonganPelatih || formData.golongan,
              golonganPelatih: formData.golonganPelatih || formData.golongan
            } : {})
          };
      
      // If editing and password is empty, don't update it
      if (editingMember && !formData.password) {
        delete (payload as any).password;
      }
      
      // Prevent non-superadmin from setting superadmin role
      if (user?.role !== 'superadmin' && payload.role === 'superadmin') {
        alert('Anda tidak memiliki izin untuk memberikan akses Super Admin');
        setLoading(false);
        return;
      }

      // Optimistically update local members state immediately
      setMembers(prev => prev.map(m => (m.id === payload.id || (m.email && payload.email && m.email.toLowerCase().trim() === payload.email.toLowerCase().trim())) ? { ...m, ...payload } : m));

      const res = await sheetsService.saveMember(payload);
      if (res.error) {
        throw new Error(res.error);
      }

      // Explicitly save and update member document directly in Firestore
      await firestoreService.saveMember(payload as User).catch(err => console.error("Firestore saveMember error:", err));
      if (payload.id) {
        await firestoreService.updateMember(payload.id, payload as User).catch(err => console.error("Firestore updateMember error:", err));
      }

      // Centralized KTA application update/create
      const matchingKta = ktaApps.find(app => 
        (payload.id && app.userId === payload.id) || 
        (app.email && payload.email && String(app.email).toLowerCase().trim() === String(payload.email).toLowerCase().trim())
      );

      const ktaPayload = {
        ...(matchingKta || {}),
        id: matchingKta?.id || `kta-${Date.now()}`,
        userId: payload.id,
        nama: payload.namaLengkap,
        email: payload.email,
        noWa: payload.noHp || formData.noHp || '',
        asalDaerah: payload.asalKwarda || formData.asalKwarda || '',
        qabilah: payload.qabilah || formData.qabilah || '',
        alamat: payload.alamat || formData.alamat || '',
        tempatLahir: formData.tempatLahir || payload.tempatLahir || '',
        tanggalLahir: formData.tanggalLahir || payload.tanggalLahir || '',
        jenisKelamin: payload.jenisKelamin || formData.jenisKelamin || 'L',
        tingkatan: payload.golongan || formData.golongan || 'Penghela',
        photo: payload.photo || formData.photo || '',
        jenisKta: formData.jenisKta || matchingKta?.jenisKta || 'Reguler',
        status: formData.statusKta || matchingKta?.status || (payload.isVerified ? 'approved' : 'pending'),
        ktaNumber: formData.ktaNumber || matchingKta?.ktaNumber || payload.ktaNumber || '',
        verifiedAt: matchingKta?.verifiedAt || (payload.isVerified ? new Date().toLocaleDateString('id-ID') : '')
      };

      try {
        await sheetsService.saveKTAApplication(ktaPayload);
      } catch (syncErr) {
        console.warn("KTA sync notice:", syncErr);
      }
      
      // If current logged-in user is being updated, sync authStore
      if (user && (user.id === payload.id || (user.email && payload.email && user.email.toLowerCase() === payload.email.toLowerCase()))) {
        useAuthStore.getState().updateUser(payload as Partial<User>);
      }

      // Refresh lists
      const [data, ktaData] = await Promise.all([
        sheetsService.getMembers(),
        sheetsService.getKTAApplications()
      ]);
      setMembers(data || []);
      setKtaApps(ktaData || []);
      setIsModalOpen(false);
      alert("Data anggota berhasil diperbarui.");
    } catch (error: any) {
      console.error('Save member error:', error);
      alert('Gagal menyimpan anggota: ' + (error.message || 'Error tidak diketahui'));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMember = async (id: string) => {
    if (confirm('Yakin ingin menghapus anggota ini?')) {
      try {
        await sheetsService.deleteMember(id);
        setMembers(members.filter(m => m.id !== id));
      } catch (error) {
        alert('Gagal menghapus anggota');
      }
    }
  };

  const handleChangeVerify = async (id: string) => {
    const member = members.find(m => m.id === id);
    if (!member) return;
    
    try {
      const newVerified = !member.isVerified;
      const updated = { 
        ...member, 
        isVerified: newVerified,
        statusAktivasi: newVerified ? 'Aktif' : (member.statusAktivasi || 'Belum Aktif'),
        statusPembayaran: newVerified ? 'Lunas' : (member.statusPembayaran || 'Belum Bayar')
      };

      // 1. Instantly update local members state
      setMembers(prev => prev.map(m => m.id === id ? updated : m));
      alert(`Status verifikasi ${member.namaLengkap || 'Anggota'} berhasil diperbarui menjadi: ${updated.isVerified ? 'TERVERIFIKASI' : 'PENDING'}`);

      // 2. Background save
      (async () => {
        await firestoreService.saveMember(updated as User);
        await firestoreService.updateMember(member.id, updated);
        await sheetsService.saveMember(updated);
        const data = await sheetsService.getMembers();
        if (data?.length) setMembers(data);
      })().catch(err => console.warn('Background verify sync warning:', err));

    } catch (error: any) {
      console.error(error);
      alert('Gagal mengubah status verifikasi: ' + (error.message || 'Error tidak diketahui'));
    }
  };

  const handleToggleActivation = async (id: string) => {
    const member = members.find(m => m.id === id);
    if (!member) return;
    
    try {
      const isCurrentlyActive = member.statusAktivasi === 'Aktif' || member.statusPembayaran === 'Lunas';
      const newStatusAktivasi = isCurrentlyActive ? 'Belum Aktif' : 'Aktif';
      const newStatusPembayaran = isCurrentlyActive ? 'Belum Bayar' : 'Lunas';

      const updated = { 
        ...member, 
        statusAktivasi: newStatusAktivasi,
        statusPembayaran: newStatusPembayaran,
        isVerified: !isCurrentlyActive ? true : member.isVerified
      };

      // 1. Instantly update local members state
      setMembers(prev => prev.map(m => m.id === id ? updated : m));
      alert(`Status aktivasi ${member.namaLengkap || 'Anggota'} berhasil diperbarui menjadi: ${newStatusAktivasi.toUpperCase()}`);

      // 2. Background save
      (async () => {
        await firestoreService.saveMember(updated as User);
        await firestoreService.updateMember(member.id, updated);
        await sheetsService.saveMember(updated);
        const data = await sheetsService.getMembers();
        if (data?.length) setMembers(data);
      })().catch(err => console.warn('Background toggle activation sync warning:', err));

    } catch (error: any) {
      console.error(error);
      alert('Gagal mengubah status aktivasi: ' + (error.message || 'Error tidak diketahui'));
    }
  };



  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordFormData.newPassword !== passwordFormData.confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'Konfirmasi password tidak cocok' });
      return;
    }
    if (passwordFormData.newPassword.length < 6) {
      setPasswordMessage({ type: 'error', text: 'Password minimal 6 karakter' });
      return;
    }

    try {
      setPasswordLoading(true);
      setPasswordMessage({ type: '', text: '' });
      
      // In a real app we would verify current password on backend
      // Here we just update the user record
      await sheetsService.saveMember({
        ...user,
        password: passwordFormData.newPassword
      });
      
      setPasswordMessage({ type: 'success', text: 'Password berhasil diperbarui' });
      setPasswordFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      setPasswordMessage({ type: 'error', text: 'Gagal memperbarui password' });
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleUpdateSettings = async (customSettings?: any) => {
    try {
      setIsSavingSettings(true);
      const payload = {
        ...settings,
        ...customSettings
      };
      
      if (payload.gSheetApiUrl !== undefined) {
        localStorage.setItem('VITE_GSHEET_API_URL', payload.gSheetApiUrl.trim());
        sheetsService.updateApiUrlFromStorage();
      }

      const res = await sheetsService.saveSettings(payload);
      if (res && res.settings) {
        const updatedSettings = { ...payload };
        for (const key in res.settings) {
          const val = res.settings[key];
          if (typeof val === 'string' && (val.startsWith('[') || val.startsWith('{'))) {
            try {
              updatedSettings[key] = JSON.parse(val);
            } catch (e) {
              updatedSettings[key] = val;
            }
          } else {
            updatedSettings[key] = val;
          }
        }
        setSettings(updatedSettings);
        safeStorageSet('hw_settings', updatedSettings);
      } else {
        setSettings(prev => ({ ...prev, ...payload }));
      }
      alert('Pengaturan berhasil disimpan');
    } catch (error) {
      alert('Gagal menyimpan pengaturan');
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleKtaImageUpload = (e: React.ChangeEvent<HTMLInputElement>, fieldName: string) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("Ukuran file tidak boleh melebihi 2MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setSettings((prev: any) => ({
          ...prev,
          [fieldName]: reader.result as string
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleResetKtaField = (fieldName: string) => {
    setSettings((prev: any) => ({
      ...prev,
      [fieldName]: ''
    }));
  };

  const handleBackupNow = async () => {
    if (!confirm('Yakin ingin membackup data sekarang?')) return;
    try {
      setLoading(true);
      const res = await sheetsService.backupNow();
      if (res.success) {
        setSettings(prev => ({ ...prev, lastBackup: new Date().toLocaleString('id-ID') }));
        alert(`Backup Berhasil!\n\nNama: ${res.name}\n\nSilakan cek di Google Drive Anda atau buka URL berikut:\n${res.url}`);
        window.open(res.url, '_blank');
      }
    } catch (error) {
      alert('Gagal melakukan backup');
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    const headers = ['No', 'Nama Lengkap', 'Nomor WA', 'Kwarda', 'Golongan'];
    const csvData = filteredMembers.map((m, idx) => [
      idx + 1,
      m.namaLengkap,
      m.noHp,
      m.asalKwarda,
      m.golongan
    ]);
    
    let csvContent = "data:text/csv;charset=utf-8,\ufeff" 
      + headers.join(",") + "\n"
      + csvData.map(e => e.map(cell => `"${cell}"`).join(",")).join("\n");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    const filterName = selectedFilters.join('_').replace(/\s+/g, '');
    link.setAttribute("download", `Data_HW_${filterName}_${new Date().toLocaleDateString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToPDF = () => {
    const doc = new jsPDF() as any;
    const headers = [['No', 'Nama Lengkap', 'Nomor WA', 'Kwarda', 'Golongan']];
    const data = filteredMembers.map((m, idx) => [
      idx + 1,
      m.namaLengkap,
      m.noHp,
      m.asalKwarda,
      m.golongan
    ]);

    doc.setFontSize(16);
    doc.text('Data Anggota Gerakan Kepanduan HW', 14, 15);
    doc.setFontSize(10);
    doc.text(`Filter: ${selectedFilters.join(', ')}`, 14, 22);
    doc.text(`Dicetak pada: ${new Date().toLocaleString('id-ID')}`, 14, 27);

    autoTable(doc, {
      head: headers,
      body: data,
      startY: 35,
      theme: 'grid',
      styles: { fontSize: 8 },
      headStyles: { fillColor: '#1a413d' }
    });

    const filterName = selectedFilters.join('_').replace(/\s+/g, '');
    doc.save(`Data_HW_${filterName}.pdf`);
  };

  const exportKTAToExcel = () => {
    const targetApps = filteredKtaApps;

    const headers = ['No', 'Nomor KTA', 'Nama Lengkap', 'Email', 'No. WhatsApp', 'Tempat Lahir', 'Tanggal Lahir', 'Jenis Kelamin', 'Tingkatan', 'Asal Kwarda', 'Qabilah', 'Alamat', 'Jenis KTA', 'Status', 'Tanggal Ajuan'];
    const data = targetApps.map((k, idx) => [
      idx + 1,
      k.ktaNumber || '-',
      k.nama || '-',
      k.email || '-',
      k.noWa ? `'${k.noWa}` : '-',
      k.tempatLahir || '-',
      k.tanggalLahir || '-',
      k.jenisKelamin || '-',
      k.tingkatan || '-',
      k.asalDaerah || '-',
      k.qabilah || '-',
      k.alamat || '-',
      k.jenisKta || 'Digital',
      k.status === 'pending' ? 'Menunggu' : k.status === 'approved' ? 'Disetujui' : 'Ditolak',
      k.tanggalAjuan ? new Date(k.tanggalAjuan).toLocaleDateString('id-ID') : '-'
    ]);
    
    let csvContent = "\ufeff" 
      + headers.join(",") + "\n"
      + data.map(e => e.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
      
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    const dateStr = new Date().toISOString().split('T')[0];
    const kwardaSuffix = ktaFilterKwarda !== 'Semua' ? `_${ktaFilterKwarda.replace(/\s+/g, '')}` : '';
    const statusSuffix = ktaFilterStatus !== 'Semua' ? `_${ktaFilterStatus}` : '';
    link.setAttribute("download", `Data_KTA_HW_Jateng${kwardaSuffix}${statusSuffix}_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const exportKTAToPDF = () => {
    const targetApps = filteredKtaApps;

    const doc = new jsPDF() as any;
    const headers = [['No', 'Nomor KTA', 'Nama Lengkap', 'Tingkatan', 'Kwarda / Qabilah', 'Status']];
    const data = targetApps.map((k, idx) => [
      idx + 1,
      k.ktaNumber || '-',
      k.nama || '-',
      k.tingkatan || '-',
      `${k.asalDaerah || '-'}${k.qabilah ? ` (${k.qabilah})` : ''}`,
      k.status === 'pending' ? 'Menunggu' : k.status === 'approved' ? 'Disetujui' : 'Ditolak'
    ]);

    doc.setFontSize(14);
    doc.text('Laporan Data Pendaftar KTA HW Jawa Tengah', 14, 15);
    doc.setFontSize(9);
    doc.text(`Kwartir Wilayah Hizbul Wathan Jawa Tengah - Dicetak: ${new Date().toLocaleString('id-ID')}`, 14, 21);
    doc.text(`Total Filter: ${targetApps.length} Pengajuan (Kwarda: ${ktaFilterKwarda}, Status: ${ktaFilterStatus === 'Semua' ? 'Semua Status' : ktaFilterStatus})`, 14, 26);

    autoTable(doc, {
      head: headers,
      body: data,
      startY: 32,
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: '#1a413d', textColor: '#ffffff', fontStyle: 'bold' }
    });

    const dateStr = new Date().toISOString().split('T')[0];
    doc.save(`Laporan_KTA_HW_Jateng_${dateStr}.pdf`);
  };

  const exportActivityParticipantsToExcel = () => {
    const rawList = activityApplicationsList.filter(app => {
      if (selectedActivityForParticipants === 'semua') return true;
      const targetAct = activitiesList.find(a => a.id === selectedActivityForParticipants) || { id: selectedActivityForParticipants };
      return isParticipantOfActivity(app, targetAct);
    });
    const list = sortActivityAppsByDate(rawList, true);
    
    let activityName = 'Semua_Kegiatan';
    if (selectedActivityForParticipants !== 'semua') {
      const selectedAct = activitiesList.find(a => a.id === selectedActivityForParticipants);
      if (selectedAct) {
        activityName = (selectedAct.namaKegiatan || 'Kegiatan').replace(/[^a-zA-Z0-9]/g, '_');
      }
    }

    const headers = ['No', 'Nama Lengkap', 'Nama Kegiatan', 'Unsur', 'Utusan / Qabilah', 'Jabatan', 'Kategori Undangan', 'No. WhatsApp', 'Tanggal Daftar'];
    const data = list.map((app, idx) => [
      idx + 1,
      app.namaLengkap || '-',
      app.namaKegiatan || '-',
      app.unsur || app.asalKwarda || '-',
      app.utusan || app.qabilahPtma || app.qabilah || '-',
      app.jabatan || '-',
      app.kategoriUndangan || '-',
      app.noHp ? `'${app.noHp}` : '-',
      app.tanggalDaftar ? new Date(app.tanggalDaftar).toLocaleDateString('id-ID') : '-'
    ]);

    let csvContent = "\ufeff" 
      + headers.join(",") + "\n"
      + data.map(e => e.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    const dateStr = new Date().toISOString().split('T')[0];
    link.setAttribute("download", `Daftar_Hadir_Peserta_${activityName}_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const exportActivityParticipantsToPDF = () => {
    const rawList = activityApplicationsList.filter(app => {
      if (selectedActivityForParticipants === 'semua') return true;
      const targetAct = activitiesList.find(a => a.id === selectedActivityForParticipants) || { id: selectedActivityForParticipants };
      return isParticipantOfActivity(app, targetAct);
    });
    const list = sortActivityAppsByDate(rawList, true);

    let activityTitle = 'Semua Kegiatan HW Jateng';
    let activityNameFile = 'Semua_Kegiatan';
    if (selectedActivityForParticipants !== 'semua') {
      const selectedAct = activitiesList.find(a => a.id === selectedActivityForParticipants);
      if (selectedAct) {
        activityTitle = selectedAct.namaKegiatan || 'Kegiatan HW';
        activityNameFile = (selectedAct.namaKegiatan || 'Kegiatan').replace(/[^a-zA-Z0-9]/g, '_');
      }
    }

    const doc = new jsPDF() as any;
    const headers = [['No', 'Nama Lengkap', 'Unsur', 'Utusan / Qabilah', 'Jabatan', 'Undangan', 'No. WA']];
    const data = list.map((app, idx) => [
      idx + 1,
      app.namaLengkap || '-',
      app.unsur || app.asalKwarda || '-',
      app.utusan || app.qabilahPtma || app.qabilah || '-',
      app.jabatan || '-',
      app.kategoriUndangan && app.kategoriUndangan !== 'Tidak Ada / Umum' ? app.kategoriUndangan : '-',
      app.noHp || '-'
    ]);

    doc.setFontSize(14);
    doc.text('DAFTAR HADIR / PESERTA KEGIATAN HW JATENG', 14, 15);
    doc.setFontSize(10);
    doc.text(`Kegiatan: ${activityTitle}`, 14, 21);
    doc.setFontSize(9);
    doc.text(`Kwartir Wilayah Hizbul Wathan Jawa Tengah - Dicetak: ${new Date().toLocaleString('id-ID')}`, 14, 26);
    doc.text(`Total Peserta: ${list.length} Orang`, 14, 31);

    autoTable(doc, {
      head: headers,
      body: data,
      startY: 36,
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: '#1a413d', textColor: '#ffffff', fontStyle: 'bold' }
    });

    const dateStr = new Date().toISOString().split('T')[0];
    doc.save(`Daftar_Hadir_Peserta_${activityNameFile}_${dateStr}.pdf`);
  };

  // =========================================================================
  // EXPORT FUNCTIONS FOR PELATIHAN (TRAINING MODULE)
  // =========================================================================

  // Helper for matching selected training activity across all tabs
  const isMatchSelectedActivity = (app: any, filterActivity: string, settingsActivities: any[]) => {
    if (!filterActivity || filterActivity === 'Semua') return true;
    const acts = settingsActivities || [];
    const selAct = acts.find((a: any) => String(a.id) === String(filterActivity) || a.namaKegiatan === filterActivity);
    if (!selAct) return true;

    const filterStr = (selAct.namaKegiatan || selAct.jenisPelatihan || filterActivity).toLowerCase();
    const prog = (app?.pelatihanAkanDiikuti || '').toLowerCase();
    const loc = (app?.lokasiPelatihan || '').toLowerCase();
    const dt = (app?.tanggalPelatihan || '').toLowerCase();

    const matchProg = isMatchTrainingLevel(app, selAct.jenisPelatihan || selAct.namaKegiatan) || prog.includes(filterStr);
    const matchLoc = !selAct.lokasiPelatihan || !loc || loc.includes(selAct.lokasiPelatihan.toLowerCase()) || selAct.lokasiPelatihan.toLowerCase().includes(loc);
    const matchDt = !selAct.tanggalPelatihan || !dt || dt.includes(selAct.tanggalPelatihan.toLowerCase()) || selAct.tanggalPelatihan.toLowerCase().includes(dt);

    return matchProg && matchLoc && matchDt;
  };

  // 1. Export Data Pelatihan (Kegiatan / Program Pelatihan)
  const exportTrainingActivitiesToExcel = () => {
    const rawActs = settings.trainingActivities || [];
    const acts = Array.isArray(rawActs) ? rawActs : (typeof rawActs === 'string' ? safeJsonParse(rawActs, []) : []);
    const list = acts.length > 0 ? acts : [
      { namaKegiatan: 'Pelatihan Jaya Melati 1 (Jati 1)', jenisPelatihan: 'Jaya Melati 1', lokasiPelatihan: 'Pusdiklat HW Jateng', tanggalPelatihan: 'Reguler', status: 'Buka', biayaPelatihan: 'Rp 50.000', noWhatsappPanitia: '089688754000' },
      { namaKegiatan: 'Pelatihan Jaya Melati 2 (Jati 2)', jenisPelatihan: 'Jaya Melati 2', lokasiPelatihan: 'Pusdiklat HW Jateng', tanggalPelatihan: 'Lanjutan', status: 'Buka', biayaPelatihan: 'Rp 75.000', noWhatsappPanitia: '089688754000' },
      { namaKegiatan: 'Pelatihan Jaya Rintisan 1 (Jari 1)', jenisPelatihan: 'Jaya Rintisan 1', lokasiPelatihan: 'Pusdiklat HW Jateng', tanggalPelatihan: 'Spesialis', status: 'Buka', biayaPelatihan: 'Rp 100.000', noWhatsappPanitia: '089688754000' }
    ];

    const headers = ['No', 'Nama Kegiatan / Program', 'Jenis Pelatihan', 'Lokasi Pelatihan', 'Tanggal Pelatihan', 'Pelatih (Jaya Matahari 1+)', 'Asisten Pelatih (Jaya Melati 2)', 'Status', 'Biaya Pelatihan', 'Rekening Pembiayaan', 'No. WA Panitia'];
    const data = list.map((a: any, idx: number) => [
      idx + 1,
      a.namaKegiatan || a.jenisPelatihan || '-',
      a.jenisPelatihan || '-',
      a.lokasiPelatihan || '-',
      a.tanggalPelatihan || '-',
      Array.isArray(a.pelatih) ? (a.pelatih.length > 0 ? a.pelatih.join('; ') : '-') : (a.pelatih || '-'),
      Array.isArray(a.asistenPelatih) ? (a.asistenPelatih.length > 0 ? a.asistenPelatih.join('; ') : '-') : (a.asistenPelatih || '-'),
      a.status || 'Buka',
      a.biayaPelatihan || 'Rp 50.000',
      a.rekeningPembiayaan || '-',
      a.noWhatsappPanitia ? `'${a.noWhatsappPanitia}` : '-'
    ]);

    let csvContent = "\ufeff" 
      + headers.join(",") + "\n"
      + data.map(e => e.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    const dateStr = new Date().toISOString().split('T')[0];
    link.setAttribute("download", `Data_Kegiatan_Pelatihan_HW_Jateng_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const exportTrainingActivitiesToPDF = () => {
    const rawActs = settings.trainingActivities || [];
    const acts = Array.isArray(rawActs) ? rawActs : (typeof rawActs === 'string' ? safeJsonParse(rawActs, []) : []);
    const list = acts.length > 0 ? acts : [
      { namaKegiatan: 'Pelatihan Jaya Melati 1 (Jati 1)', jenisPelatihan: 'Jaya Melati 1', lokasiPelatihan: 'Pusdiklat HW Jateng', tanggalPelatihan: 'Reguler', status: 'Buka', biayaPelatihan: 'Rp 50.000', noWhatsappPanitia: '089688754000' },
      { namaKegiatan: 'Pelatihan Jaya Melati 2 (Jati 2)', jenisPelatihan: 'Jaya Melati 2', lokasiPelatihan: 'Pusdiklat HW Jateng', tanggalPelatihan: 'Lanjutan', status: 'Buka', biayaPelatihan: 'Rp 75.000', noWhatsappPanitia: '089688754000' },
      { namaKegiatan: 'Pelatihan Jaya Rintisan 1 (Jari 1)', jenisPelatihan: 'Jaya Rintisan 1', lokasiPelatihan: 'Pusdiklat HW Jateng', tanggalPelatihan: 'Spesialis', status: 'Buka', biayaPelatihan: 'Rp 100.000', noWhatsappPanitia: '089688754000' }
    ];

    const doc = new jsPDF() as any;
    const headers = [['No', 'Nama Kegiatan / Program', 'Jenis', 'Lokasi', 'Tanggal', 'Biaya', 'Status']];
    const data = list.map((a: any, idx: number) => [
      idx + 1,
      a.namaKegiatan || a.jenisPelatihan || '-',
      a.jenisPelatihan || '-',
      a.lokasiPelatihan || '-',
      a.tanggalPelatihan || '-',
      a.biayaPelatihan || 'Rp 50.000',
      a.status || 'Buka'
    ]);

    doc.setFontSize(14);
    doc.text('DAFTAR KEGIATAN & PROGRAM PELATIHAN HW JATENG', 14, 15);
    doc.setFontSize(9);
    doc.text(`Kwartir Wilayah Hizbul Wathan Jawa Tengah - Dicetak: ${new Date().toLocaleString('id-ID')}`, 14, 21);
    doc.text(`Total Program Aktif: ${list.length} Kegiatan`, 14, 26);

    autoTable(doc, {
      head: headers,
      body: data,
      startY: 32,
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: '#1a413d', textColor: '#ffffff', fontStyle: 'bold' }
    });

    const dateStr = new Date().toISOString().split('T')[0];
    doc.save(`Laporan_Kegiatan_Pelatihan_HW_Jateng_${dateStr}.pdf`);
  };

  // 2. Export Data Peserta Pelatihan
  const exportTrainingParticipantsToExcel = () => {
    const list = trainingApps.filter(app => {
      const sysEmails = ['admin@hwjateng.com', 'materihw@gmail.com', 'medkom@hwjateng.com', 'admin@hw.org'];
      const name = (app?.nama || app?.namaLengkap || '').trim();
      const email = (app?.email || '').toLowerCase().trim();
      if (!name || name === '-' || name.toLowerCase() === 'tanpa nama' || name.includes('@') || sysEmails.includes(email)) return false;

      const matchSearch = 
        name.toLowerCase().includes(trainingSearchQuery.toLowerCase()) ||
        (app?.email || '').toLowerCase().includes(trainingSearchQuery.toLowerCase()) ||
        (app?.noWa || '').toLowerCase().includes(trainingSearchQuery.toLowerCase()) ||
        (app?.asalDaerah || '').toLowerCase().includes(trainingSearchQuery.toLowerCase());
      const matchStatus = trainingFilterStatus === 'Semua' || app?.status === trainingFilterStatus;

      let matchActivity = true;
      if (trainingFilterActivity !== 'Semua') {
        const acts = settings.trainingActivities || [];
        const selAct = acts.find((a: any) => String(a.id) === trainingFilterActivity || a.namaKegiatan === trainingFilterActivity);
        const filterStr = (selAct?.namaKegiatan || selAct?.jenisPelatihan || trainingFilterActivity).toLowerCase();
        const prog = (app?.pelatihanAkanDiikuti || '').toLowerCase();
        const loc = (app?.lokasiPelatihan || '').toLowerCase();
        const dt = (app?.tanggalPelatihan || '').toLowerCase();
        matchActivity = prog.includes(filterStr) || (selAct?.lokasiPelatihan && loc.includes(selAct.lokasiPelatihan.toLowerCase())) || (selAct?.tanggalPelatihan && dt.includes(selAct.tanggalPelatihan.toLowerCase()));
      }

      return matchSearch && matchStatus && matchActivity;
    });

    const headers = ['No', 'Nama Lengkap', 'Email', 'No. WhatsApp', 'Nomor KTA', 'Tempat Lahir', 'Tanggal Lahir', 'Jenis Kelamin', 'Asal Kwarda / Daerah', 'Qabilah', 'Program Pelatihan', 'Pelatih Golongan', 'Status Pendaftaran', 'Status Pembayaran', 'Tanggal Ajuan'];
    const data = list.map((app, idx) => {
      const matchMember = members.find(m => 
        (m.id && app.userId && String(m.id) === String(app.userId)) ||
        (m.email && app.email && String(m.email).toLowerCase().trim() === String(app.email).toLowerCase().trim()) ||
        (m.namaLengkap && app.nama && String(m.namaLengkap).toLowerCase().trim() === String(app.nama).toLowerCase().trim())
      );
      const matchKta = ktaApps.find(k => 
        (k.userId && app.userId && String(k.userId) === String(app.userId)) ||
        (k.email && app.email && String(k.email).toLowerCase().trim() === String(app.email).toLowerCase().trim()) ||
        (k.nama && app.nama && String(k.nama).toLowerCase().trim() === String(app.nama).toLowerCase().trim())
      );

      const dispTempat = app.tempatLahir || matchMember?.tempatLahir || matchKta?.tempatLahir || (matchMember?.alamat ? cleanTempatLahir(matchMember.alamat) : '') || '-';
      const dispTanggal = app.tanggalLahir || matchMember?.tanggalLahir || matchKta?.tanggalLahir || '-';
      const dispNbm = app.nbm || app.ktaNumber || app.nomorKTA || matchMember?.ktaNumber || matchMember?.nomorKTA || matchMember?.nbm || matchKta?.ktaNumber || matchKta?.nomorKTA || matchKta?.nbm || '-';
      const dispJkRaw = app.jenisKelamin || matchMember?.jenisKelamin || matchKta?.jenisKelamin || 'L';
      const dispJk = (dispJkRaw === 'P' || dispJkRaw === 'Perempuan') ? 'Perempuan' : 'Laki-Laki';

      return [
        idx + 1,
        app.nama || app.namaLengkap || '-',
        app.email || '-',
        app.noWa ? `'${app.noWa}` : '-',
        dispNbm,
        dispTempat,
        dispTanggal,
        dispJk,
        app.asalDaerah || matchMember?.asalKwarda || matchKta?.asalDaerah || '-',
        app.qabilah || matchMember?.qabilah || matchKta?.qabilah || '-',
        app.pelatihanAkanDiikuti || 'Jaya Melati 1',
        app.pelatihGolongan || '-',
        app.status === 'pending' ? 'Menunggu' : app.status === 'approved' ? 'Disetujui' : 'Ditolak',
        app.statusPembayaran || 'Lunas',
        app.createdAt ? new Date(app.createdAt).toLocaleDateString('id-ID') : '-'
      ];
    });

    let csvContent = "\ufeff" 
      + headers.join(",") + "\n"
      + data.map(e => e.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    const dateStr = new Date().toISOString().split('T')[0];
    const statusSuffix = trainingFilterStatus !== 'Semua' ? `_${trainingFilterStatus}` : '';
    link.setAttribute("download", `Data_Peserta_Pelatihan_HW_Jateng${statusSuffix}_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const exportTrainingParticipantsToPDF = () => {
    const list = trainingApps.filter(app => {
      const sysEmails = ['admin@hwjateng.com', 'materihw@gmail.com', 'medkom@hwjateng.com', 'admin@hw.org'];
      const name = (app?.nama || app?.namaLengkap || '').trim();
      const email = (app?.email || '').toLowerCase().trim();
      if (!name || name === '-' || name.toLowerCase() === 'tanpa nama' || name.includes('@') || sysEmails.includes(email)) return false;

      const matchSearch = 
        name.toLowerCase().includes(trainingSearchQuery.toLowerCase()) ||
        (app?.email || '').toLowerCase().includes(trainingSearchQuery.toLowerCase()) ||
        (app?.noWa || '').toLowerCase().includes(trainingSearchQuery.toLowerCase()) ||
        (app?.asalDaerah || '').toLowerCase().includes(trainingSearchQuery.toLowerCase());
      const matchStatus = trainingFilterStatus === 'Semua' || app?.status === trainingFilterStatus;

      let matchActivity = true;
      if (trainingFilterActivity !== 'Semua') {
        const acts = settings.trainingActivities || [];
        const selAct = acts.find((a: any) => String(a.id) === trainingFilterActivity || a.namaKegiatan === trainingFilterActivity);
        const filterStr = (selAct?.namaKegiatan || selAct?.jenisPelatihan || trainingFilterActivity).toLowerCase();
        const prog = (app?.pelatihanAkanDiikuti || '').toLowerCase();
        const loc = (app?.lokasiPelatihan || '').toLowerCase();
        const dt = (app?.tanggalPelatihan || '').toLowerCase();
        matchActivity = prog.includes(filterStr) || (selAct?.lokasiPelatihan && loc.includes(selAct.lokasiPelatihan.toLowerCase())) || (selAct?.tanggalPelatihan && dt.includes(selAct.tanggalPelatihan.toLowerCase()));
      }

      return matchSearch && matchStatus && matchActivity;
    });

    const doc = new jsPDF() as any;
    const headers = [['No', 'Nama Peserta', 'No. KTA / WA', 'Asal Daerah / Qabilah', 'Program Pelatihan', 'Status']];
    const data = list.map((app, idx) => {
      const matchMember = members.find(m => (m.id && app.userId && String(m.id) === String(app.userId)) || (m.email && app.email && String(m.email).toLowerCase().trim() === String(app.email).toLowerCase().trim()));
      const dispNbm = app.nbm || app.ktaNumber || app.nomorKTA || matchMember?.ktaNumber || matchMember?.nbm || '-';
      return [
        idx + 1,
        app.nama || app.namaLengkap || '-',
        `${dispNbm} / ${app.noWa || '-'}`,
        `${app.asalDaerah || '-'}${app.qabilah ? ` (${app.qabilah})` : ''}`,
        app.pelatihanAkanDiikuti || 'Jaya Melati 1',
        app.status === 'pending' ? 'Menunggu' : app.status === 'approved' ? 'Disetujui' : 'Ditolak'
      ];
    });

    doc.setFontSize(14);
    doc.text('LAPORAN DATA PESERTA PELATIHAN HW JATENG', 14, 15);
    doc.setFontSize(9);
    doc.text(`Kwartir Wilayah Hizbul Wathan Jawa Tengah - Dicetak: ${new Date().toLocaleString('id-ID')}`, 14, 21);
    doc.text(`Total Filter: ${list.length} Peserta (Status: ${trainingFilterStatus === 'Semua' ? 'Semua Status' : trainingFilterStatus})`, 14, 26);

    autoTable(doc, {
      head: headers,
      body: data,
      startY: 32,
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: '#1a413d', textColor: '#ffffff', fontStyle: 'bold' }
    });

    const dateStr = new Date().toISOString().split('T')[0];
    doc.save(`Laporan_Peserta_Pelatihan_HW_Jateng_${dateStr}.pdf`);
  };

  // 3. Export Data Presensi Pelatihan
  const exportTrainingAttendanceToExcel = () => {
    const targetKey = getNormalizedLevelKey(selectedPresensiProg);
    const prog = TRAINING_PROGRAMS.find(p => getNormalizedLevelKey(p.id) === targetKey) || TRAINING_PROGRAMS[0];
    const sessionList = prog ? prog.sessions : [];
    const sessions = sessionList.map(s => s.id);

    const sysEmails = ['admin@hwjateng.com', 'materihw@gmail.com', 'medkom@hwjateng.com', 'admin@hw.org'];
    const enrolled = trainingApps.filter(app => {
      const name = (app?.nama || app?.namaLengkap || '').trim();
      const email = (app?.email || '').toLowerCase().trim();
      if (!name || name === '-' || name.toLowerCase() === 'tanpa nama' || name.includes('@') || sysEmails.includes(email)) return false;
      return isApprovedParticipant(app) && isMatchTrainingLevel(app, selectedPresensiProg);
    });

    const sessionHeaders = sessionList.map(s => `${s.id} (${s.title})`);
    const headers = ['No', 'Nama Peserta', 'Nomor KTA / NBM', 'Program Pelatihan', 'Asal Daerah', 'Qabilah', ...sessionHeaders, 'Jumlah Hadir', 'Total Sesi', 'Persentase Kehadiran (%)'];

    const data = enrolled.map((app, idx) => {
      let attObj: Record<string, any> = {};
      if (app.kehadiran) {
        attObj = safeJsonParse<Record<string, any>>(app.kehadiran, {});
      }
      const totalSessions = sessions.length;
      const attendedSessions = sessions.filter(sesi => isSessionPresent(attObj, sesi)).length;
      const attendancePercentage = totalSessions > 0 ? Math.round((attendedSessions / totalSessions) * 100) : 0;

      const sessionStatuses = sessions.map(sesi => {
        const isPresent = isSessionPresent(attObj, sesi);
        const rawItem = attObj[sesi];
        if (isPresent) {
          const ts = typeof rawItem === 'object' && rawItem?.timestamp ? ` (${rawItem.timestamp})` : '';
          return `Hadir${ts}`;
        }
        if ((typeof rawItem === 'object' && rawItem?.status === 'izin') || (typeof rawItem === 'string' && rawItem === 'izin')) {
          return 'Izin';
        }
        return 'Absen';
      });

      const matchMember = members.find(m => (m.id && app.userId && String(m.id) === String(app.userId)) || (m.email && app.email && String(m.email).toLowerCase().trim() === String(app.email).toLowerCase().trim()));
      const dispNbm = app.nbm || app.ktaNumber || app.nomorKTA || matchMember?.ktaNumber || matchMember?.nbm || '-';

      return [
        idx + 1,
        app.nama || app.namaLengkap || '-',
        dispNbm,
        selectedPresensiProg,
        app.asalDaerah || '-',
        app.qabilah || '-',
        ...sessionStatuses,
        attendedSessions,
        totalSessions,
        `${attendancePercentage}%`
      ];
    });

    let csvContent = "\ufeff" 
      + headers.join(",") + "\n"
      + data.map(e => e.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    const dateStr = new Date().toISOString().split('T')[0];
    const progSuffix = selectedPresensiProg.replace(/\s+/g, '_');
    link.setAttribute("download", `Data_Presensi_Pelatihan_${progSuffix}_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const exportTrainingAttendanceToPDF = () => {
    const targetKey = getNormalizedLevelKey(selectedPresensiProg);
    const prog = TRAINING_PROGRAMS.find(p => getNormalizedLevelKey(p.id) === targetKey) || TRAINING_PROGRAMS[0];
    const sessionList = prog ? prog.sessions : [];
    const sessions = sessionList.map(s => s.id);

    const sysEmails = ['admin@hwjateng.com', 'materihw@gmail.com', 'medkom@hwjateng.com', 'admin@hw.org'];
    const enrolled = trainingApps.filter(app => {
      const name = (app?.nama || app?.namaLengkap || '').trim();
      const email = (app?.email || '').toLowerCase().trim();
      if (!name || name === '-' || name.toLowerCase() === 'tanpa nama' || name.includes('@') || sysEmails.includes(email)) return false;
      return isApprovedParticipant(app) && isMatchTrainingLevel(app, selectedPresensiProg);
    });

    const doc = new jsPDF() as any;
    const headers = [['No', 'Nama Peserta', 'Asal Daerah / Qabilah', 'Jumlah Hadir', 'Total Sesi', '% Kehadiran']];
    const data = enrolled.map((app, idx) => {
      let attObj: Record<string, any> = {};
      if (app.kehadiran) {
        attObj = safeJsonParse<Record<string, any>>(app.kehadiran, {});
      }
      const totalSessions = sessions.length;
      const attendedSessions = sessions.filter(sesi => isSessionPresent(attObj, sesi)).length;
      const attendancePercentage = totalSessions > 0 ? Math.round((attendedSessions / totalSessions) * 100) : 0;

      return [
        idx + 1,
        app.nama || app.namaLengkap || '-',
        `${app.asalDaerah || '-'}${app.qabilah ? ` (${app.qabilah})` : ''}`,
        attendedSessions,
        totalSessions,
        `${attendancePercentage}%`
      ];
    });

    doc.setFontSize(14);
    doc.text(`REKAPITULASI PRESENSI PELATIHAN ${selectedPresensiProg.toUpperCase()}`, 14, 15);
    doc.setFontSize(9);
    doc.text(`Kwartir Wilayah Hizbul Wathan Jawa Tengah - Dicetak: ${new Date().toLocaleString('id-ID')}`, 14, 21);
    doc.text(`Tingkat Pelatihan: ${selectedPresensiProg} | Total Peserta: ${enrolled.length} Orang | Jumlah Sesi Kurikulum: ${sessions.length}`, 14, 26);

    autoTable(doc, {
      head: headers,
      body: data,
      startY: 32,
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: '#1a413d', textColor: '#ffffff', fontStyle: 'bold' }
    });

    const dateStr = new Date().toISOString().split('T')[0];
    const progSuffix = selectedPresensiProg.replace(/\s+/g, '_');
    doc.save(`Rekap_Presensi_Pelatihan_${progSuffix}_${dateStr}.pdf`);
  };

  // 4. Export Data Kelulusan Pelatihan
  const exportTrainingGraduationToExcel = () => {
    const sysEmails = ['admin@hwjateng.com', 'materihw@gmail.com', 'medkom@hwjateng.com', 'admin@hw.org'];
    const enrolled = trainingApps.filter(app => {
      const name = (app?.nama || app?.namaLengkap || '').trim();
      const email = (app?.email || '').toLowerCase().trim();
      if (!name || name === '-' || name.toLowerCase() === 'tanpa nama' || name.includes('@') || sysEmails.includes(email)) return false;
      return isApprovedParticipant(app) && isMatchTrainingLevel(app, selectedGradeProg);
    });

    const headers = ['No', 'Nama Peserta', 'Nomor KTA / NBM', 'Program Pelatihan', 'Asal Daerah', 'Qabilah', 'Nilai / Predikat', 'Kehadiran (%)', 'Tugas (%)', 'Status Kelulusan', 'Catatan / Ulasan Pelatih'];
    const data = enrolled.map((app, idx) => {
      const calc = getCalculatedGrading(app);
      const matchMember = members.find(m => (m.id && app.userId && String(m.id) === String(app.userId)) || (m.email && app.email && String(m.email).toLowerCase().trim() === String(app.email).toLowerCase().trim()));
      const dispNbm = app.nbm || app.ktaNumber || app.nomorKTA || matchMember?.ktaNumber || matchMember?.nbm || '-';

      return [
        idx + 1,
        app.nama || app.namaLengkap || '-',
        dispNbm,
        selectedGradeProg,
        app.asalDaerah || '-',
        app.qabilah || '-',
        app.nilai || `${calc.finalPercentage}%`,
        `${calc.attendancePercentage}%`,
        `${calc.assignmentPercentage}%`,
        app.statusKelulusan || calc.calculatedStatus || 'Belum Diproses',
        app.remark || '-'
      ];
    });

    let csvContent = "\ufeff" 
      + headers.join(",") + "\n"
      + data.map(e => e.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    const dateStr = new Date().toISOString().split('T')[0];
    const progSuffix = selectedGradeProg.replace(/\s+/g, '_');
    link.setAttribute("download", `Data_Kelulusan_Pelatihan_${progSuffix}_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const exportTrainingGraduationToPDF = () => {
    const sysEmails = ['admin@hwjateng.com', 'materihw@gmail.com', 'medkom@hwjateng.com', 'admin@hw.org'];
    const enrolled = trainingApps.filter(app => {
      const name = (app?.nama || app?.namaLengkap || '').trim();
      const email = (app?.email || '').toLowerCase().trim();
      if (!name || name === '-' || name.toLowerCase() === 'tanpa nama' || name.includes('@') || sysEmails.includes(email)) return false;
      return isApprovedParticipant(app) && isMatchTrainingLevel(app, selectedGradeProg);
    });

    const doc = new jsPDF() as any;
    const headers = [['No', 'Nama Peserta', 'Asal Daerah / Qabilah', 'Nilai / Predikat', '% Presensi', '% Tugas', 'Status Kelulusan']];
    const data = enrolled.map((app, idx) => {
      const calc = getCalculatedGrading(app);
      return [
        idx + 1,
        app.nama || app.namaLengkap || '-',
        `${app.asalDaerah || '-'}${app.qabilah ? ` (${app.qabilah})` : ''}`,
        app.nilai || `${calc.finalPercentage}%`,
        `${calc.attendancePercentage}%`,
        `${calc.assignmentPercentage}%`,
        app.statusKelulusan || calc.calculatedStatus || 'Belum Diproses'
      ];
    });

    doc.setFontSize(14);
    doc.text(`LAPORAN KELULUSAN PELATIHAN ${selectedGradeProg.toUpperCase()}`, 14, 15);
    doc.setFontSize(9);
    doc.text(`Kwartir Wilayah Hizbul Wathan Jawa Tengah - Dicetak: ${new Date().toLocaleString('id-ID')}`, 14, 21);
    doc.text(`Tingkat: ${selectedGradeProg} | Total Peserta Evaluasi: ${enrolled.length} Orang`, 14, 26);

    autoTable(doc, {
      head: headers,
      body: data,
      startY: 32,
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: '#1a413d', textColor: '#ffffff', fontStyle: 'bold' }
    });

    const dateStr = new Date().toISOString().split('T')[0];
    const progSuffix = selectedGradeProg.replace(/\s+/g, '_');
    doc.save(`Laporan_Kelulusan_Pelatihan_${progSuffix}_${dateStr}.pdf`);
  };

  // 5. Export Piagam Tervalidasi
  const exportValidatedCertificatesToExcel = () => {
    const sysEmails = ['admin@hwjateng.com', 'materihw@gmail.com', 'medkom@hwjateng.com', 'admin@hw.org'];
    const graduates = trainingApps.filter(app => {
      const name = (app?.nama || app?.namaLengkap || '').trim();
      const email = (app?.email || '').toLowerCase().trim();
      if (!name || name === '-' || name.toLowerCase() === 'tanpa nama' || name.includes('@') || sysEmails.includes(email)) return false;
      const isGrad = app.statusKelulusan === 'Lulus' || app.statusKelulusan === 'Lulus Bersyarat' || getCalculatedGrading(app).calculatedStatus !== 'Tidak Lulus';
      return isApprovedParticipant(app) && isMatchTrainingLevel(app, selectedPiagamProg) && isGrad;
    });

    const headers = ['No', 'No. Seri Piagam', 'Nama Peserta', 'Nomor KTA / NBM', 'Program Pelatihan', 'Predikat Nilai', 'Asal Daerah', 'Qabilah', 'Status Validasi', 'Tanggal Terbit', 'URL Verifikasi'];
    const data = graduates.map((app, idx) => {
      const matchMember = members.find(m => (m.id && app.userId && String(m.id) === String(app.userId)) || (m.email && app.email && String(m.email).toLowerCase().trim() === String(app.email).toLowerCase().trim()));
      const dispNbm = app.nbm || app.ktaNumber || app.nomorKTA || matchMember?.ktaNumber || matchMember?.nbm || '-';
      const serialNo = `HW-JT/PLT/${new Date().getFullYear()}/${app.id.slice(0, 4).toUpperCase()}`;
      const verifyUrl = `${window.location.origin}/pelatihan?verify=${app.id}`;

      return [
        idx + 1,
        serialNo,
        app.nama || app.namaLengkap || '-',
        dispNbm,
        selectedPiagamProg,
        app.nilai || 'A',
        app.asalDaerah || '-',
        app.qabilah || '-',
        'Tervalidasi / Valid (Sah Kwarwil HW Jateng)',
        app.updatedAt ? new Date(app.updatedAt).toLocaleDateString('id-ID') : new Date().toLocaleDateString('id-ID'),
        verifyUrl
      ];
    });

    let csvContent = "\ufeff" 
      + headers.join(",") + "\n"
      + data.map(e => e.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    const dateStr = new Date().toISOString().split('T')[0];
    const progSuffix = selectedPiagamProg.replace(/\s+/g, '_');
    link.setAttribute("download", `Data_Piagam_Tervalidasi_${progSuffix}_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const exportValidatedCertificatesToPDF = () => {
    const sysEmails = ['admin@hwjateng.com', 'materihw@gmail.com', 'medkom@hwjateng.com', 'admin@hw.org'];
    const graduates = trainingApps.filter(app => {
      const name = (app?.nama || app?.namaLengkap || '').trim();
      const email = (app?.email || '').toLowerCase().trim();
      if (!name || name === '-' || name.toLowerCase() === 'tanpa nama' || name.includes('@') || sysEmails.includes(email)) return false;
      const isGrad = app.statusKelulusan === 'Lulus' || app.statusKelulusan === 'Lulus Bersyarat' || getCalculatedGrading(app).calculatedStatus !== 'Tidak Lulus';
      return isApprovedParticipant(app) && isMatchTrainingLevel(app, selectedPiagamProg) && isGrad;
    });

    const doc = new jsPDF() as any;
    const headers = [['No', 'No. Seri Piagam', 'Nama Peserta', 'Predikat', 'Asal Daerah / Qabilah', 'Status Validasi']];
    const data = graduates.map((app, idx) => {
      const serialNo = `HW-JT/PLT/${new Date().getFullYear()}/${app.id.slice(0, 4).toUpperCase()}`;
      return [
        idx + 1,
        serialNo,
        app.nama || app.namaLengkap || '-',
        app.nilai || 'A',
        `${app.asalDaerah || '-'}${app.qabilah ? ` (${app.qabilah})` : ''}`,
        'TERVALIDASI'
      ];
    });

    doc.setFontSize(14);
    doc.text(`DAFTAR PIAGAM KELULUSAN TERVALIDASI - ${selectedPiagamProg.toUpperCase()}`, 14, 15);
    doc.setFontSize(9);
    doc.text(`Kwartir Wilayah Hizbul Wathan Jawa Tengah - Dicetak: ${new Date().toLocaleString('id-ID')}`, 14, 21);
    doc.text(`Tingkat Pelatihan: ${selectedPiagamProg} | Total Piagam Sah: ${graduates.length} Sertifikat`, 14, 26);

    autoTable(doc, {
      head: headers,
      body: data,
      startY: 32,
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: '#1a413d', textColor: '#ffffff', fontStyle: 'bold' }
    });

    const dateStr = new Date().toISOString().split('T')[0];
    const progSuffix = selectedPiagamProg.replace(/\s+/g, '_');
    doc.save(`Laporan_Piagam_Tervalidasi_${progSuffix}_${dateStr}.pdf`);
  };

  const getMemberRegionalCodeIndex = (m: any): number => {
    const kwardaStr = (m.asalKwarda || '').trim().toLowerCase();
    const qabilahStr = (m.qabilah || '').trim().toLowerCase();

    for (let i = 0; i < 35; i++) {
      const item = KWARDA_QABILAH_JATENG[i];
      const itemName = item.name.toLowerCase();
      const cleanItemName = itemName.replace('kabupaten ', '').replace('kota ', '');

      if (kwardaStr) {
        if (
          kwardaStr === itemName ||
          kwardaStr === cleanItemName ||
          itemName.includes(kwardaStr) ||
          kwardaStr.includes(cleanItemName)
        ) {
          return parseInt(item.code, 10);
        }
      }
    }

    for (let i = 35; i < KWARDA_QABILAH_JATENG.length; i++) {
      const item = KWARDA_QABILAH_JATENG[i];
      const itemName = item.name.toLowerCase();
      const matchParen = item.name.match(/\(([^)]+)\)/);
      const acronym = matchParen ? matchParen[1].toLowerCase() : '';

      const checkStr = (val: string) => {
        if (!val) return false;
        return (
          val === itemName ||
          itemName.includes(val) ||
          val.includes(itemName) ||
          (acronym && val.includes(acronym)) ||
          (acronym && acronym.includes(val))
        );
      };

      if (checkStr(qabilahStr) || checkStr(kwardaStr)) {
        return parseInt(item.code, 10);
      }
    }

    return 999;
  };

  const deduplicatedMemberList = React.useMemo(() => {
    return deduplicateMembers(members || []);
  }, [members]);

  const filteredMembers = React.useMemo(() => {
    return deduplicatedMemberList
      .filter(m => {
        const matchesSearch = (
          (m.namaLengkap || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
          (m.asalKwarda || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
          (m.email || '').toLowerCase().includes(searchQuery.toLowerCase())
        );
        
        const isInternal = m.role === 'superadmin' || m.role === 'admin';
        if (isInternal) return false;

        if (selectedFilters.includes('Semua') || selectedFilters.length === 0) return matchesSearch;
        
        return matchesSearch && selectedFilters.some(filter => {
          if (filter === 'Pending Verifikasi') return !m.isVerified;
          if (filter === 'Laki-laki') return m.jenisKelamin === 'L';
          if (filter === 'Perempuan') return m.jenisKelamin === 'P';
          if (filter === 'Athfal') return (m.golongan === 'Athfal' || m.golongan === 'Tunas Athfal');
          if (filter === 'Pengenal') return m.golongan === 'Pengenal';
          if (filter === 'Penghela') return m.golongan === 'Penghela';
          if (filter === 'Penuntun') return m.golongan === 'Penuntun';

          const normRoles = parseRolesField(m.roles, m.role);
          const pList = Array.isArray(m.pelatihan) ? m.pelatihan.map((p: any) => String(p).toLowerCase()) : [];

          if (filter === 'Dewan Sugli') return normRoles.includes('sugli') || normRoles.includes('sugli_daerah') || normRoles.includes('sugli_wilayah') || (m.role || '').includes('sugli');
          if (filter === 'Kwarda') return normRoles.includes('kwarda') || normRoles.includes('admin_kwarda') || (m.role || '').includes('kwarda');

          if (filter === 'Jaya Melati 1') {
            return normRoles.includes('jati1') || pList.some(p => p.includes('jati 1') || p.includes('melati 1') || p.includes('jati1'));
          }
          if (filter === 'Jaya Melati 2') {
            return normRoles.includes('jati2') || pList.some(p => p.includes('jati 2') || p.includes('melati 2') || p.includes('jati2'));
          }
          if (filter === 'Jaya Matahari 1') {
            return normRoles.includes('jari1') || pList.some(p => p.includes('jari 1') || p.includes('matahari 1') || p.includes('jari1'));
          }
          return false;
        });
      })
      .sort((a, b) => {
        const codeA = getMemberRegionalCodeIndex(a);
        const codeB = getMemberRegionalCodeIndex(b);

        if (codeA !== codeB) {
          return codeA - codeB;
        }

        const nameA = (a.namaLengkap || '').trim();
        const nameB = (b.namaLengkap || '').trim();
        return nameA.localeCompare(nameB, 'id', { sensitivity: 'base' });
      });
  }, [deduplicatedMemberList, searchQuery, selectedFilters]);

  const stats = React.useMemo(() => {
    return {
      total: deduplicatedMemberList.filter(m => m.role !== 'superadmin' && m.role !== 'admin').length,
      laki: deduplicatedMemberList.filter(m => m.jenisKelamin === 'L' && m.role !== 'superadmin' && m.role !== 'admin').length,
      perempuan: deduplicatedMemberList.filter(m => m.jenisKelamin === 'P' && m.role !== 'superadmin' && m.role !== 'admin').length,
      verified: deduplicatedMemberList.filter(m => m.isVerified && m.role !== 'superadmin' && m.role !== 'admin').length,
      athfal: deduplicatedMemberList.filter(m => (m.golongan === 'Athfal' || m.golongan === 'Tunas Athfal') && m.role !== 'superadmin' && m.role !== 'admin').length,
      pengenal: deduplicatedMemberList.filter(m => m.golongan === 'Pengenal' && m.role !== 'superadmin' && m.role !== 'admin').length,
      penghela: deduplicatedMemberList.filter(m => m.golongan === 'Penghela' && m.role !== 'superadmin' && m.role !== 'admin').length,
      penuntun: deduplicatedMemberList.filter(m => m.golongan === 'Penuntun' && m.role !== 'superadmin' && m.role !== 'admin').length,
      sugli: deduplicatedMemberList.filter(m => {
        if (m.role === 'superadmin' || m.role === 'admin') return false;
        const normRoles = parseRolesField(m.roles, m.role);
        return normRoles.includes('sugli') || normRoles.includes('sugli_daerah') || normRoles.includes('sugli_wilayah') || (m.role || '').includes('sugli');
      }).length,
      kwarda: deduplicatedMemberList.filter(m => {
        if (m.role === 'superadmin' || m.role === 'admin') return false;
        const normRoles = parseRolesField(m.roles, m.role);
        return normRoles.includes('kwarda') || normRoles.includes('admin_kwarda') || (m.role || '').includes('kwarda');
      }).length,
      jm1: deduplicatedMemberList.filter(m => {
        if (m.role === 'superadmin' || m.role === 'admin') return false;
        const normRoles = parseRolesField(m.roles, m.role);
        const pList = Array.isArray(m.pelatihan) ? m.pelatihan.map((x: any) => String(x).toLowerCase()) : [];
        return normRoles.includes('jati1') || pList.some(x => x.includes('jati 1') || x.includes('melati 1') || x.includes('jati1'));
      }).length,
      jm2: deduplicatedMemberList.filter(m => {
        if (m.role === 'superadmin' || m.role === 'admin') return false;
        const normRoles = parseRolesField(m.roles, m.role);
        const pList = Array.isArray(m.pelatihan) ? m.pelatihan.map((x: any) => String(x).toLowerCase()) : [];
        return normRoles.includes('jati2') || pList.some(x => x.includes('jati 2') || x.includes('melati 2') || x.includes('jati2'));
      }).length,
      jm3: deduplicatedMemberList.filter(m => {
        if (m.role === 'superadmin' || m.role === 'admin') return false;
        const normRoles = parseRolesField(m.roles, m.role);
        const pList = Array.isArray(m.pelatihan) ? m.pelatihan.map((x: any) => String(x).toLowerCase()) : [];
        return normRoles.includes('jari1') || pList.some(x => x.includes('jari 1') || x.includes('matahari 1') || x.includes('jari1'));
      }).length
    };
  }, [deduplicatedMemberList]);

  // High-performance Pagination States
  const [memberPage, setMemberPage] = useState(1);
  const [memberPageSize, setMemberPageSize] = useState(25);

  const [ktaPage, setKtaPage] = useState(1);
  const [ktaPageSize, setKtaPageSize] = useState(25);

  const [trainingPage, setTrainingPage] = useState(1);
  const [trainingPageSize, setTrainingPageSize] = useState(25);

  const [activityPage, setActivityPage] = useState(1);
  const [activityPageSize, setActivityPageSize] = useState(25);

  // Auto reset page numbers when search / filter criteria change
  useEffect(() => {
    setMemberPage(1);
  }, [searchQuery, selectedFilters]);

  useEffect(() => {
    setKtaPage(1);
  }, [ktaSearchQuery, ktaFilterStatus, ktaFilterKwarda, ktaSortBy]);

  useEffect(() => {
    setTrainingPage(1);
  }, [trainingSearchQuery, trainingFilterStatus, trainingFilterActivity]);

  useEffect(() => {
    setActivityPage(1);
  }, [selectedActivityForParticipants]);

  // Paginated Slices & Totals
  const paginatedMembers = useMemo(() => {
    const start = (memberPage - 1) * memberPageSize;
    return filteredMembers.slice(start, start + memberPageSize);
  }, [filteredMembers, memberPage, memberPageSize]);

  const totalMemberPages = Math.max(1, Math.ceil(filteredMembers.length / memberPageSize));

  const paginatedKtaApps = useMemo(() => {
    const start = (ktaPage - 1) * ktaPageSize;
    return filteredKtaApps.slice(start, start + ktaPageSize);
  }, [filteredKtaApps, ktaPage, ktaPageSize]);

  const totalKtaPages = Math.max(1, Math.ceil(filteredKtaApps.length / ktaPageSize));

  // High-performance Memoized Lookup Maps for O(1) row queries
  const memberLookupMap = useMemo(() => {
    const map = new Map<string, any>();
    for (const m of members) {
      if (m.id) map.set(String(m.id), m);
      if (m.email) map.set(String(m.email).toLowerCase().trim(), m);
      if (m.namaLengkap) map.set(String(m.namaLengkap).toLowerCase().trim(), m);
    }
    return map;
  }, [members]);

  const ktaLookupMap = useMemo(() => {
    const map = new Map<string, any>();
    for (const k of ktaApps) {
      if (k.userId) map.set(String(k.userId), k);
      if (k.email) map.set(String(k.email).toLowerCase().trim(), k);
      if (k.nama) map.set(String(k.nama).toLowerCase().trim(), k);
    }
    return map;
  }, [ktaApps]);

  const filteredTrainingAppsList = useMemo(() => {
    const sysEmails = ['admin@hwjateng.com', 'materihw@gmail.com', 'medkom@hwjateng.com', 'admin@hw.org'];
    const query = trainingSearchQuery.toLowerCase().trim();

    return trainingApps.filter(app => {
      const name = (app?.nama || app?.namaLengkap || '').trim();
      const email = (app?.email || '').toLowerCase().trim();
      if (!name || name === '-' || name.toLowerCase() === 'tanpa nama' || name.includes('@') || sysEmails.includes(email)) return false;

      const matchSearch = !query ||
        name.toLowerCase().includes(query) ||
        (app?.email || '').toLowerCase().includes(query) ||
        (app?.noWa || '').toLowerCase().includes(query) ||
        (app?.asalDaerah || '').toLowerCase().includes(query);
      const matchStatus = trainingFilterStatus === 'Semua' || app?.status === trainingFilterStatus;

      let matchActivity = true;
      if (trainingFilterActivity !== 'Semua') {
        const acts = settings.trainingActivities || [];
        const selAct = acts.find((a: any) => String(a.id) === trainingFilterActivity || a.namaKegiatan === trainingFilterActivity);
        const filterStr = (selAct?.namaKegiatan || selAct?.jenisPelatihan || trainingFilterActivity).toLowerCase();
        const prog = (app?.pelatihanAkanDiikuti || '').toLowerCase();
        const loc = (app?.lokasiPelatihan || '').toLowerCase();
        const dt = (app?.tanggalPelatihan || '').toLowerCase();
        matchActivity = prog.includes(filterStr) || (selAct?.lokasiPelatihan && loc.includes(selAct.lokasiPelatihan.toLowerCase())) || (selAct?.tanggalPelatihan && dt.includes(selAct.tanggalPelatihan.toLowerCase()));
      }

      return matchSearch && matchStatus && matchActivity;
    }).sort((a, b) => {
      const timeA = new Date(a.tanggalAjuan || a.updatedAt || a.createdAt || 0).getTime();
      const timeB = new Date(b.tanggalAjuan || b.updatedAt || b.createdAt || 0).getTime();
      if (timeA !== timeB) return timeB - timeA;
      return String(b.id || '').localeCompare(String(a.id || ''));
    });
  }, [trainingApps, trainingSearchQuery, trainingFilterStatus, trainingFilterActivity, settings.trainingActivities]);

  const paginatedTrainingApps = useMemo(() => {
    const start = (trainingPage - 1) * trainingPageSize;
    return filteredTrainingAppsList.slice(start, start + trainingPageSize);
  }, [filteredTrainingAppsList, trainingPage, trainingPageSize]);

  const totalTrainingPages = Math.max(1, Math.ceil(filteredTrainingAppsList.length / trainingPageSize));

  const paginatedActivityApps = useMemo(() => {
    const start = (activityPage - 1) * activityPageSize;
    return displayedActivityApplications.slice(start, start + activityPageSize);
  }, [displayedActivityApplications, activityPage, activityPageSize]);

  const totalActivityPages = Math.max(1, Math.ceil(displayedActivityApplications.length / activityPageSize));

  const membersWithUpgradeRequests = members.filter(m => isValidName(m.namaLengkap || (m as any).nama) && Array.isArray(m.upgradeRequests) && m.upgradeRequests.length > 0);
  const pendingMembers = members.filter(m => isValidName(m.namaLengkap || (m as any).nama) && !m.isVerified && m.role !== 'superadmin' && m.role !== 'admin');
  const pendingKtaApps = ktaApps.filter(k => k && k.status === 'pending' && isValidName(k.nama || k.namaLengkap));
  const pendingTrainingApps = trainingApps.filter(t => t && t.status === 'pending' && isValidName(t.nama || t.namaLengkap));

  // Training apps with submitted tasks
  const parseAppTasks = (app: any) => {
    try {
      if (!app?.tugas) return [];
      const parsed = typeof app.tugas === 'string' ? JSON.parse(app.tugas) : app.tugas;
      return Array.isArray(parsed) ? parsed : [parsed];
    } catch (e) {
      return [];
    }
  };

  const submittedTaskApps = trainingApps.filter(t => t && isValidName(t.nama || t.namaLengkap) && parseAppTasks(t).length > 0);

  const totalNotifications = (isDiklatAdmin ? 0 : (membersWithUpgradeRequests.length + pendingMembers.length + pendingKtaApps.length)) + pendingTrainingApps.length + submittedTaskApps.length;

    // Simple RBAC check
  if (!isAuthenticated || (user?.role !== 'admin' && user?.role !== 'superadmin' && user?.role !== 'admin_diklat' && !(user as any)?.adminType && !isPelatihUser)) {
    return <Navigate to="/" />;
  }

  if (loading) return <LoadingPage />;

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-hw-dark text-white rounded-2xl shadow-lg shadow-hw-dark/20">
            <Shield size={28} />
          </div>
          <div>
            <h2 className="text-xl font-display font-black text-gray-800 tracking-tight">
              {isPelatihOnly ? 'Dashboard Pengelolaan Pelatihan' : (isDiklatAdmin ? 'Dashboard Admin Diklat' : 'Dashboard Admin')}
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="px-2 py-0.5 bg-hw-green/10 text-hw-green text-[9px] font-black uppercase rounded-lg tracking-wider">
                {isPelatihOnly ? 'Tim Pelatih / Asisten Pelatih' : (isDiklatAdmin ? 'Admin Diklat' : user?.role)}
              </span>
              <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                Gerakan Kepanduan HW
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {totalNotifications > 0 && (
            <button 
              onClick={() => {
                if (isDiklatAdmin || isPelatihOnly) {
                  if (pendingTrainingApps.length > 0) setNotifActiveTab('pelatihan');
                  else setNotifActiveTab('tugas');
                } else {
                  if (pendingMembers.length > 0) setNotifActiveTab('pendaftaran');
                  else if (membersWithUpgradeRequests.length > 0) setNotifActiveTab('upgrade');
                  else if (pendingKtaApps.length > 0) setNotifActiveTab('kta');
                  else if (pendingTrainingApps.length > 0) setNotifActiveTab('pelatihan');
                  else setNotifActiveTab('tugas');
                }
                setIsNotificationModalOpen(true);
              }}
              className="relative p-3 text-hw-blue bg-hw-blue/10 rounded-xl hover:bg-hw-blue/20 transition-all animate-pulse cursor-pointer"
              title="Notifikasi Pendaftaran Baru, Upgrade, KTA & Penugasan"
            >
              <Bell size={20} />
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white">
                {totalNotifications}
              </span>
            </button>
          )}
          <Link 
            to="/" 
            className="hidden sm:flex items-center gap-2 px-4 py-2 border border-gray-100 rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-50 transition-all"
          >
            <Layout size={16} /> Ke Tampilan Depan
          </Link>
          <button 
            onClick={() => useAuthStore.getState().logout()}
            className="p-3 text-red-500 bg-red-50 rounded-xl hover:bg-red-100 transition-all"
          >
            <LogOut size={20} />
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="w-full pb-3 sticky top-0 bg-gray-50 z-10 -mx-4 px-4 pt-2 border-b border-gray-200/60 flex justify-center">
        <div className="flex flex-wrap justify-center items-center gap-2 sm:gap-2.5 max-w-6xl mx-auto">
          {[
            (!isDiklatAdmin && !isPelatihOnly) && { id: 'anggota', label: 'Anggota', icon: Users, activeClass: 'bg-gradient-to-r from-emerald-500 via-teal-500 to-blue-600 text-white shadow-lg shadow-emerald-500/25 ring-2 ring-emerald-400', hoverClass: 'hover:border-emerald-300 hover:text-emerald-600' },
            (!isDiklatAdmin && !isPelatihOnly) && { id: 'kta', label: 'KTA', icon: CreditCard, activeClass: 'bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-lg shadow-emerald-600/25 ring-2 ring-emerald-500', hoverClass: 'hover:border-emerald-300 hover:text-emerald-600' },
            { id: 'pelatihan', label: 'Pelatihan', icon: GraduationCap, activeClass: 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg shadow-orange-500/25 ring-2 ring-amber-400', hoverClass: 'hover:border-amber-300 hover:text-orange-600' },
            (!isDiklatAdmin && !isPelatihOnly) && { id: 'kegiatan', label: 'Kegiatan', icon: Calendar, activeClass: 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/25 ring-2 ring-cyan-400', hoverClass: 'hover:border-cyan-300 hover:text-cyan-600' },
            (!isDiklatAdmin && !isPelatihOnly) && { id: 'materi', label: 'Materi', icon: BookOpen, activeClass: 'bg-gradient-to-r from-teal-600 to-cyan-700 text-white shadow-lg shadow-teal-600/25 ring-2 ring-teal-500', hoverClass: 'hover:border-teal-300 hover:text-teal-600' },
            (!isDiklatAdmin && !isPelatihOnly) && { id: 'konten', label: 'Konten', icon: Layout, activeClass: 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/25 ring-2 ring-purple-400', hoverClass: 'hover:border-purple-300 hover:text-purple-600' },
            (!isDiklatAdmin && !isPelatihOnly) && user?.role === 'superadmin' && { id: 'admin', label: 'Admin', icon: Shield, activeClass: 'bg-gradient-to-r from-indigo-600 to-blue-700 text-white shadow-lg shadow-indigo-500/25 ring-2 ring-indigo-400', hoverClass: 'hover:border-indigo-300 hover:text-indigo-600' },
            (!isDiklatAdmin && !isPelatihOnly) && user?.role === 'superadmin' && { id: 'pengaturan', label: 'Pengaturan', icon: Settings, activeClass: 'bg-gradient-to-r from-slate-700 to-slate-900 text-white shadow-lg shadow-slate-700/25 ring-2 ring-slate-600', hoverClass: 'hover:border-slate-300 hover:text-slate-800' },
            { id: 'akun', label: 'Akun Saya', icon: Users, activeClass: 'bg-gradient-to-r from-rose-500 to-pink-600 text-white shadow-lg shadow-rose-500/25 ring-2 ring-rose-400', hoverClass: 'hover:border-rose-300 hover:text-rose-600' }
          ].filter(Boolean).map((tab: any) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center justify-center gap-2 px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer active:scale-95 whitespace-nowrap ${
                activeTab === tab.id 
                ? tab.activeClass
                : `bg-white text-gray-600 border border-gray-200/80 ${tab.hoverClass}`
              }`}
            >
              <tab.icon size={16} className="shrink-0" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden min-h-[400px]"
        >
          {/* ANGGOTA TAB */}
          {activeTab === 'anggota' && (
            <div className="flex flex-col h-full">
              {/* Stats & Demographic Section specifically for Anggota Tab */}
              <div className="p-6 border-b border-gray-100 bg-gray-50/50 space-y-5">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatCard label="Total Anggota" value={stats.total} icon={Users} color="bg-gradient-to-r from-emerald-500 to-blue-600" subValue={`${stats.laki} L / ${stats.perempuan} P`} />
                  <StatCard label="Terverifikasi" value={stats.verified} icon={CheckCircle} color="bg-hw-green" subValue={`${Math.round((stats.verified/(stats.total || 1))*100)}% dari total`} />
                  <StatCard label="Total Materi" value={materiList.length} icon={BookOpen} color="bg-hw-dark" subValue="Aktif di aplikasi" />
                  <StatCard label="Admin Aktif" value={members.filter(m => m.role === 'admin' || m.role === 'superadmin').length} icon={Shield} color="bg-orange-500" subValue="Super & Petugas" />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between px-1">
                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Detail Demografi & Pelatihan</h3>
                    <span className="text-[10px] font-bold text-hw-dark/50">Klik kartu untuk menyaring data</span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    <DetailStatCard label="Laki-Laki" value={stats.laki} color="bg-blue-500" onClick={() => { setActiveTab('anggota'); setSelectedFilters(['Laki-laki']); }} />
                    <DetailStatCard label="Perempuan" value={stats.perempuan} color="bg-pink-500" onClick={() => { setActiveTab('anggota'); setSelectedFilters(['Perempuan']); }} />
                    <DetailStatCard label="Athfal" value={stats.athfal} color="bg-yellow-500" onClick={() => { setActiveTab('anggota'); setSelectedFilters(['Athfal']); }} />
                    <DetailStatCard label="Pengenal" value={stats.pengenal} color="bg-green-500" onClick={() => { setActiveTab('anggota'); setSelectedFilters(['Pengenal']); }} />
                    <DetailStatCard label="Penghela" value={stats.penghela} color="bg-red-500" onClick={() => { setActiveTab('anggota'); setSelectedFilters(['Penghela']); }} />
                    <DetailStatCard label="Penuntun" value={stats.penuntun} color="bg-purple-500" onClick={() => { setActiveTab('anggota'); setSelectedFilters(['Penuntun']); }} />
                    <DetailStatCard label="Dewan Sugli" value={stats.sugli} color="bg-hw-dark" onClick={() => { setActiveTab('anggota'); setSelectedFilters(['Dewan Sugli']); }} />
                    <DetailStatCard label="Kwarda" value={stats.kwarda} color="bg-orange-600" onClick={() => { setActiveTab('anggota'); setSelectedFilters(['Kwarda']); }} />
                    <DetailStatCard label="Jaya Melati 1" value={stats.jm1} color="bg-hw-green" onClick={() => { setActiveTab('anggota'); setSelectedFilters(['Jaya Melati 1']); }} />
                    <DetailStatCard label="Jaya Melati 2" value={stats.jm2} color="bg-hw-blue" onClick={() => { setActiveTab('anggota'); setSelectedFilters(['Jaya Melati 2']); }} />
                    <DetailStatCard label="Jaya Matahari 1" value={stats.jm3} color="bg-yellow-600" onClick={() => { setActiveTab('anggota'); setSelectedFilters(['Jaya Matahari 1']); }} />
                  </div>
                </div>
              </div>
              <div className="p-6 border-b border-gray-50 bg-gray-50/30 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex flex-col gap-1 flex-1 min-w-[200px]">
                    <div className="relative">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                      <input 
                        type="text" 
                        placeholder="Cari nama, email, atau kwarda..." 
                        value={searchQuery || ''}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-white border border-gray-100 focus:ring-4 focus:ring-hw-green/10 focus:border-hw-green rounded-2xl py-3 pl-12 pr-10 text-xs font-semibold shadow-sm outline-none" 
                      />
                      {searchQuery && (
                        <button
                          type="button"
                          onClick={() => setSearchQuery('')}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-hw-green transition-colors cursor-pointer"
                        >
                          <X size={16} />
                        </button>
                      )}
                    </div>
                    <div className="flex items-center gap-2 px-1">
                      <div className="flex items-center gap-1.5 py-1 px-2.5 bg-hw-green/10 text-hw-green rounded-full">
                        <Users size={10} />
                        <span className="text-[9px] font-black uppercase tracking-widest">Terpilih: {filteredMembers.length} Anggota</span>
                      </div>
                      {selectedFilters.length > 0 && !selectedFilters.includes('Semua') && (
                        <button 
                          onClick={() => setSelectedFilters(['Semua'])}
                          className="text-[9px] font-black text-rose-500 uppercase hover:underline"
                        >
                          Reset Filter
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button 
                      onClick={async () => {
                        try {
                          setLoading(true);
                          const res = await sheetsService.syncApprovedKtasToMembers();
                          if (res.success || !res.error) {
                            let msg = `Berhasil menyinkronkan data anggota & KTA! ${res.addedCount || 0} akun baru dibuat, ${res.updatedCount || 0} akun diperbarui.`;
                            if (res.deletedPendingCount && res.deletedPendingCount > 0) {
                              msg += ` ${res.deletedPendingCount} data pengajuan KTA terpending telah dibersihkan.`;
                            }
                            alert(msg);
                          } else {
                            throw new Error(res.message || 'Gagal sinkronisasi');
                          }
                          await fetchData();
                        } catch (err: any) {
                          alert('Gagal menyinkronkan data: ' + (err.message || 'Error'));
                        } finally {
                          setLoading(false);
                        }
                      }}
                      className="px-3.5 py-2.5 bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 rounded-xl flex items-center gap-1.5 text-xs font-bold transition-all cursor-pointer shadow-sm"
                      title="Sinkronkan otomatis semua data pendaftar KTA dengan daftar anggota"
                    >
                      <RefreshCw size={14} /> Sinkronkan Data
                    </button>
                    <button 
                      onClick={exportToCSV}
                      className="px-4 py-2 bg-white border border-gray-100 text-gray-600 rounded-xl flex items-center gap-2 text-[10px] font-bold hover:bg-gray-50 transition-all"
                    >
                      <Download size={14} /> Excel
                    </button>
                    <button 
                      onClick={exportToPDF}
                      className="px-4 py-2 bg-white border border-gray-100 text-gray-600 rounded-xl flex items-center gap-2 text-[10px] font-bold hover:bg-gray-50 transition-all"
                    >
                      <Database size={14} /> PDF
                    </button>
                    <button 
                      onClick={() => handleOpenModal()}
                      className="px-5 py-3 bg-hw-green text-white rounded-2xl shadow-lg shadow-hw-green/20 flex items-center gap-2 text-xs font-bold hover:scale-105 active:scale-95 transition-all"
                    >
                      <Plus size={16} /> Tambah Anggota
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 pb-2">
                  {['Semua', 'Pending Verifikasi', 'Laki-laki', 'Perempuan', 'Athfal', 'Pengenal', 'Penghela', 'Penuntun', 'Dewan Sugli', 'Kwarda', 'Jaya Melati 1', 'Jaya Melati 2', 'Jaya Matahari 1'].map((f) => {
                    const isSelected = selectedFilters.includes(f);
                    return (
                      <button
                        key={f}
                        onClick={() => {
                          if (f === 'Semua') {
                            setSelectedFilters(['Semua']);
                          } else {
                            const newFilters = selectedFilters.includes('Semua') 
                              ? [f] 
                              : isSelected 
                                ? selectedFilters.filter(item => item !== f)
                                : [...selectedFilters, f];
                            setSelectedFilters(newFilters.length === 0 ? ['Semua'] : newFilters);
                          }
                        }}
                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all whitespace-nowrap ${
                          isSelected 
                          ? 'bg-hw-dark text-white shadow-lg shadow-hw-dark/20' 
                          : 'bg-white text-gray-400 border border-gray-100 hover:border-gray-200'
                        }`}
                      >
                        {f}
                        {isSelected && f !== 'Semua' && <X size={10} className="inline ml-1 mb-0.5" />}
                      </button>
                    );
                  })}
                </div>
              </div>
              
              <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
                <table className="w-full text-left min-w-[1000px]">
                  <thead>
                    <tr className="bg-gray-50/80">
                      <th className="p-5 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-50">Nama & Asal</th>
                      <th className="p-5 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-50">Golongan</th>
                      <th className="p-5 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-50">Password</th>
                      <th className="p-5 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-50">Role</th>
                      <th className="p-5 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-50">Status</th>
                      <th className="p-5 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-50 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {paginatedMembers.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-12 text-center text-gray-400 font-bold uppercase tracking-wider text-xs">
                          Tidak ada data anggota yang sesuai dengan filter
                        </td>
                      </tr>
                    ) : (
                      paginatedMembers.map((row, i) => {
                        const itemIndex = (memberPage - 1) * memberPageSize + i;
                        return (
                          <tr key={`member-${row.id}-${itemIndex}`} className="hover:bg-gray-50/50 transition-colors">
                            <td className="p-5">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400 font-bold text-xs">
                                  {row.namaLengkap.charAt(0)}
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-sm font-bold text-gray-800">
                                    <span className="text-gray-400 font-mono text-xs font-bold mr-1.5">{itemIndex + 1}.</span>
                                    {row.namaLengkap}
                                  </span>
                                  <span className="text-[10px] text-gray-400 font-medium">{row.asalKwarda}, {row.jenisKelamin === 'L' ? 'Laki-laki' : 'Perempuan'}</span>
                                  {(() => {
                                    const reqs = Array.isArray(row.upgradeRequests) 
                                      ? row.upgradeRequests 
                                      : (typeof row.upgradeRequests === 'string' && row.upgradeRequests) 
                                      ? [row.upgradeRequests] 
                                      : [];
                                    return reqs.length > 0 ? (
                                      <span className="flex items-center gap-1 mt-1 text-[8px] font-black text-rose-500 uppercase tracking-tighter bg-rose-50 px-1.5 py-0.5 rounded-md border border-rose-100 w-fit">
                                        <ArrowUpRight size={8} /> Permohonan: {reqs.join(', ')}
                                      </span>
                                    ) : null;
                                  })()}
                                </div>
                              </div>
                            </td>
                            <td className="p-5">
                              <span className="text-xs font-bold text-gray-600">{row.golongan}</span>
                            </td>
                            <td className="p-5">
                              <span className="text-xs font-mono font-medium text-hw-blue/70">{row.password || '•••••'}</span>
                            </td>
                            <td className="p-5">
                              <div className="flex flex-wrap gap-1">
                                {parseRolesField(row.roles, row.role).map((r: string, idx: number) => (
                                  <span key={`${row.id}-role-${r}-${idx}`} className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-wider ${
                                    r === 'superadmin' || r === 'admin' ? 'bg-red-100 text-red-600' :
                                    r === 'sugli' ? 'bg-orange-100 text-orange-600' :
                                    r === 'kwarda' ? 'bg-blue-100 text-blue-600' :
                                    typeof r === 'string' && r.startsWith('ja') ? 'bg-hw-green/10 text-hw-green' :
                                    'bg-gray-100 text-gray-600'
                                  }`}>
                                    {ROLE_LABELS[r] || r}
                                  </span>
                                ))}
                              </div>
                            </td>
                            <td className="p-5">
                              {row.isVerified ? (
                                <button 
                                  onClick={() => handleChangeVerify(row.id)}
                                  className="flex items-center gap-1.5 text-hw-green hover:opacity-70 transition-opacity"
                                >
                                  <CheckCircle size={14} />
                                  <span className="text-[10px] font-black uppercase tracking-wider">Terverifikasi</span>
                                </button>
                              ) : (
                                <button 
                                  onClick={() => handleChangeVerify(row.id)}
                                  className="flex items-center gap-1.5 text-orange-500 hover:opacity-70 transition-opacity"
                                >
                                  <XCircle size={14} />
                                  <span className="text-[10px] font-black uppercase tracking-wider">Pending</span>
                                </button>
                              )}
                            </td>
                            <td className="p-5 text-center">
                              <div className="flex items-center justify-center gap-2">
                                {(user?.role === 'superadmin' || (row.role !== 'admin' && row.role !== 'superadmin')) && (
                                  <>
                                    <button 
                                      onClick={() => handleOpenModal(row)}
                                      className="p-2 text-gray-400 hover:text-hw-green hover:bg-hw-green/5 rounded-xl transition-all"
                                    >
                                      <Edit2 size={16} />
                                    </button>
                                    <button 
                                      onClick={() => handleDeleteMember(row.id)}
                                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                    >
                                      <Trash2 size={16} />
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
              
              <div className="p-6 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-gray-500 bg-gray-50/40">
                <div className="flex flex-wrap items-center gap-3 text-xs font-semibold">
                  <span>
                    Menampilkan <strong className="text-gray-800 font-bold">{filteredMembers.length > 0 ? (memberPage - 1) * memberPageSize + 1 : 0}</strong> - <strong className="text-gray-800 font-bold">{Math.min(memberPage * memberPageSize, filteredMembers.length)}</strong> dari <strong className="text-gray-800 font-bold">{filteredMembers.length}</strong> anggota (Total: {members.length})
                  </span>
                  <div className="flex items-center gap-1.5 ml-2">
                    <span className="text-[11px] text-gray-400">Per hal:</span>
                    <select
                      value={memberPageSize || 10}
                      onChange={(e) => {
                        setMemberPageSize(Number(e.target.value));
                        setMemberPage(1);
                      }}
                      className="bg-white border border-gray-200 rounded-lg px-2 py-1 text-xs font-bold text-gray-700 outline-none"
                    >
                      <option value={10}>10</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    disabled={memberPage <= 1}
                    onClick={() => setMemberPage(prev => Math.max(1, prev - 1))}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-black border border-gray-200 bg-white hover:bg-gray-100 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    Prev
                  </button>
                  <span className="text-xs font-bold text-gray-600 px-2">
                    Halaman <strong>{memberPage}</strong> dari <strong>{totalMemberPages}</strong>
                  </span>
                  <button
                    disabled={memberPage >= totalMemberPages}
                    onClick={() => setMemberPage(prev => Math.min(totalMemberPages, prev + 1))}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-black border border-gray-200 bg-white hover:bg-gray-100 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* MATERI TAB */}
          {activeTab === 'materi' && (
            <div className="flex flex-col h-full">
              <div className="p-6 border-b border-gray-50 flex items-center justify-between bg-gray-50/30">
                <div>
                  <h3 className="text-lg font-display font-black text-gray-800">Manajemen Materi</h3>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Total: {materiList.length} Materi Aktif</p>
                </div>
                <button 
                  onClick={() => handleOpenMateriModal()}
                  className="px-5 py-3 bg-hw-dark text-white rounded-2xl shadow-lg shadow-hw-dark/20 flex items-center gap-2 text-xs font-bold hover:scale-105 active:scale-95 transition-all"
                >
                  <Plus size={16} /> Buat Materi
                </button>
              </div>

              {/* Materi Filter & Search */}
              <div className="px-6 py-4 border-b border-gray-50 space-y-4">
                <div className="flex flex-wrap gap-2 pb-2">
                  {['semua', 'umum', 'umum_pandu', 'jati1', 'jati2', 'jari1', 'sugli', 'kwarda'].map((k) => (
                    <button
                      key={k}
                      onClick={() => setMateriFilter(k)}
                      className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all whitespace-nowrap ${
                        materiFilter === k 
                        ? 'bg-hw-green text-white shadow-lg shadow-hw-green/20' 
                        : 'bg-white text-gray-400 border border-gray-100 hover:border-gray-200'
                      }`}
                    >
                      {k === 'semua' ? 'Semua' : (k === 'umum_pandu' ? 'Umum Pandu' : (k === 'jati1' ? 'Jati 1' : k === 'jati2' ? 'Jati 2' : k === 'jari1' ? 'Jari 1' : k))}
                    </button>
                  ))}
                </div>

                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input 
                    type="text" 
                    placeholder="Cari judul materi..." 
                    value={materiSearch || ''}
                    onChange={(e) => setMateriSearch(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-100 focus:ring-4 focus:ring-hw-green/10 focus:border-hw-green rounded-2xl py-3 pl-12 pr-10 text-xs font-medium" 
                  />
                  {materiSearch && (
                    <button
                      type="button"
                      onClick={() => setMateriSearch('')}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-hw-green transition-colors cursor-pointer"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
              </div>

          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            {materiList
              .filter(m => {
                const matchFilter = materiFilter === 'semua' || m.kategori === materiFilter;
                const matchSearch = m.judul.toLowerCase().includes(materiSearch.toLowerCase());
                return matchFilter && matchSearch;
              })
              .map((m, i) => (
              <div key={`materi-card-${m.id}-${m.kategori}-${i}`} className="bg-gray-50/50 p-4 rounded-3xl border border-gray-100 flex items-center gap-4 group hover:bg-white hover:shadow-xl hover:shadow-hw-dark/5 transition-all">
                <div className="w-16 h-16 rounded-2xl bg-gray-200 overflow-hidden shrink-0">
                  <img src={getCorsSafeUrl(m.coverImage, m.updatedAt || m.id)} alt={m.judul} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 bg-hw-green/10 text-hw-green text-[8px] font-black uppercase rounded-lg">
                          {m.kategori === 'umum_pandu' ? 'Umum Pandu' : m.kategori === 'jati1' ? 'Jati 1' : m.kategori === 'jati2' ? 'Jati 2' : m.kategori === 'jari1' ? 'Jari 1' : m.kategori}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-gray-800 truncate">{m.judul}</h4>
                      <p className="text-[10px] text-gray-400 mt-1">Dibuat: {new Date(m.tanggal).toLocaleDateString('id-ID')}</p>
                    </div>
                    <div className="flex flex-col gap-1">
                      <button 
                        onClick={() => handleOpenMateriModal(m)}
                        className="p-2 text-gray-400 hover:text-hw-green transition-colors"
                      ><Edit2 size={14} /></button>
                      <button 
                        onClick={() => handleDeleteMateri(m.id)}
                        className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                      ><Trash2 size={14} /></button>
                    </div>
                  </div>
                ))}
                {materiList.filter(m => {
                    const matchFilter = materiFilter === 'semua' || m.kategori === materiFilter;
                    const matchSearch = m.judul.toLowerCase().includes(materiSearch.toLowerCase());
                    return matchFilter && matchSearch;
                  }).length === 0 && (
                  <div className="col-span-full py-12 text-center space-y-3">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto text-gray-300">
                      <BookOpen size={24} />
                    </div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Tidak ada materi ditemukan</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* KONTEN TAB */}
          {activeTab === 'konten' && (
            <div className="p-8">
              {!selectedContentSection ? (
                <>
                  <div className="mb-8">
                    <h3 className="text-lg font-display font-black text-gray-800">Manajemen Konten</h3>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Sesuaikan isi aplikasi Anda</p>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[
                      { id: 'profil', label: 'Halaman Profil', icon: Globe, desc: 'Ubah teks tentang HW' },
                      { id: 'galeri', label: 'Galeri Video', icon: Youtube, desc: 'Kelola video Youtube' },
                      { id: 'playlist', label: 'Playlist Audio', icon: Music, desc: 'Kelola file mp3/audio' },
                      { id: 'sosmed', label: 'Media Sosial', icon: Share2, desc: 'Update link sosmed' },
                      { id: 'kontak', label: 'Info Kontak', icon: Phone, desc: 'Update info qabilah' },
                      { id: 'running-text', label: 'Teks Berjalan', icon: FileText, desc: 'Update teks pengumuman berjalan' }
                    ].map((item) => (
                      <button 
                        key={item.id} 
                        onClick={() => handleSelectSection(item.id)}
                        className="bg-gray-50 p-6 rounded-[2rem] border border-gray-100 group hover:bg-white hover:shadow-xl hover:shadow-hw-dark/5 hover:-translate-y-1 transition-all text-left"
                      >
                        <div className="w-12 h-12 rounded-2xl bg-white border border-gray-100 shadow-sm flex items-center justify-center text-hw-dark mb-4 group-hover:bg-hw-dark group-hover:text-white transition-all">
                          <item.icon size={24} />
                        </div>
                        <h4 className="text-sm font-bold text-gray-800 mb-1">{item.label}</h4>
                        <p className="text-xs text-gray-500">{item.desc}</p>
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <div className="bg-white rounded-[2rem] border border-gray-100 overflow-hidden">
                  <div className="p-6 border-b border-gray-50 flex items-center justify-between bg-gray-50/30">
                    <div className="flex items-center gap-4">
                      <button 
                        onClick={() => setSelectedContentSection(null)}
                        className="p-3 bg-white rounded-2xl border border-gray-100 text-gray-400 hover:text-hw-dark transition-all shadow-sm"
                      >
                        <ArrowLeft size={18} />
                      </button>
                      <div>
                        <h3 className="text-lg font-display font-black text-gray-800 capitalize">
                          {String(selectedContentSection).replace('-', ' ')}
                        </h3>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Pengaturan Konten Aplikasi</p>
                      </div>
                    </div>
    {['galeri', 'playlist'].includes(selectedContentSection) && (
      <button 
        onClick={() => handleOpenContentModal()}
        className="px-5 py-3 bg-hw-dark text-white rounded-2xl shadow-lg shadow-hw-dark/20 flex items-center gap-2 text-xs font-bold"
      >
        <Plus size={16} /> Tambah Item
      </button>
    )}
                  </div>

                  <div className="p-8">
                    {selectedContentSection && (
                      <div className="space-y-6">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">
                            {contentList.length === 0 ? 'Belum ada data' : `Daftar Item (${contentList.length})`}
                          </h4>
          {['galeri', 'playlist'].includes(selectedContentSection) && (
            <button 
              onClick={() => handleOpenContentModal()}
              className="px-4 py-2 bg-hw-green text-white rounded-xl text-[10px] font-bold flex items-center gap-1.5 hover:scale-105 transition-all"
            >
              <Plus size={14} /> Tambah Baru
            </button>
          )}
                        </div>

                        {contentList.length === 0 ? (
                           <div className="p-10 text-center bg-gray-50 rounded-[2rem] border-2 border-dashed border-gray-100">
                             <p className="text-xs text-gray-400 font-medium">Belum ada konten untuk bagian ini.</p>
                             {['profil', 'sosmed', 'kontak', 'running-text'].includes(selectedContentSection) && (
                               <button 
                                 key="init-content-btn"
                                 onClick={() => {
                                   const emptyItem = { id: `init-${selectedContentSection}-${Date.now()}`, section: selectedContentSection, type: 'single' } as any;
                                   handleOpenContentModal(emptyItem);
                                 }}
                                 className="mt-4 px-6 py-2.5 bg-hw-dark text-white rounded-xl text-[10px] font-black"
                                >
                                  Inisialisasi Konten
                                </button>
                             )}
                             {!['profil', 'sosmed', 'kontak', 'running-text'].includes(selectedContentSection) && (
                               <button 
                                 key="add-first-item-btn"
                                 onClick={() => handleOpenContentModal()}
                                 className="mt-4 px-6 py-2.5 bg-hw-dark text-white rounded-xl text-[10px] font-black"
                               >
                                 Tambah Item Pertama
                               </button>
                             )}
                           </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {(Array.isArray(contentList) ? contentList : []).map((item, i) => (
                              <div key={`section-content-${selectedContentSection}-${item.id || i}`} className="bg-gray-50 p-4 rounded-3xl border border-gray-100 flex items-center gap-4 group hover:bg-white hover:shadow-xl transition-all">
                                {selectedContentSection === 'galeri' ? (
                                  <div className="w-20 h-14 rounded-xl bg-gray-200 overflow-hidden relative shrink-0">
                                    <img src={`https://img.youtube.com/vi/${item.field1?.split('v=')[1]?.split('&')[0] || item.field1?.split('/').pop() || ''}/0.jpg`} 
                                         alt="Youtube" className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center text-white">
                                      <Youtube size={20} />
                                    </div>
                                  </div>
                                ) : (
                                  <div className="w-12 h-12 rounded-2xl bg-hw-green/10 text-hw-green flex items-center justify-center font-black shrink-0 uppercase">
                                    {(item.field2 || item.field1 || item.section).charAt(0)}
                                  </div>
                                )}
                                <div className="flex-1 min-w-0">
                                  <h4 className="text-xs font-bold text-gray-800 truncate uppercase">
                                    {selectedContentSection === 'running-text' ? 'Teks Berjalan' : (selectedContentSection === 'galeri' ? (item.field2 || 'Video Youtube') : (item.field2 || item.field1 || item.section))}
                                  </h4>
                                  {selectedContentSection === 'playlist' ? (() => {
                                    const meta = resolveTrackMetadata(item);
                                    return (
                                      <div className="space-y-0.5">
                                        <p className="text-[11px] text-emerald-700 truncate font-bold">
                                          Cipt: {meta.creator || 'Muhammad Dzikron'}
                                        </p>
                                        {meta.lyrics && !meta.lyrics.includes('Lirik lagu belum tersedia') ? (
                                          <p className="text-[9px] text-gray-500 line-clamp-1 italic font-medium">
                                            Lirik: {meta.lyrics.substring(0, 60)}...
                                          </p>
                                        ) : (
                                          <p className="text-[9px] text-amber-600 font-medium italic">Lirik belum diisi</p>
                                        )}
                                      </div>
                                    );
                                  })() : (
                                    <p className="text-[9px] text-gray-400 truncate font-black tracking-widest uppercase">{item.field1 || item.section}</p>
                                  )}
                                </div>
                  <div className="flex gap-1">
                    <button 
                      onClick={() => handleOpenContentModal(item)}
                      className="p-2 text-gray-400 hover:text-hw-green transition-colors"
                    ><Edit2 size={16} /></button>
                    {['galeri', 'playlist'].includes(selectedContentSection) && (
                      <button 
                        onClick={() => handleDeleteContent(item.id)}
                        className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                      ><Trash2 size={16} /></button>
                    )}
                  </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ADMIN TAB */}
          {activeTab === 'admin' && (
            <div className="p-4 sm:p-8">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 sm:mb-8">
                <div>
                  <h3 className="text-lg font-display font-black text-gray-800">Manajemen Admin</h3>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Kelola hak akses administrator</p>
                </div>
                <button 
                  onClick={() => handleOpenModal(null, 'admin')}
                  className="w-full sm:w-auto justify-center px-5 py-3 bg-red-600 text-white rounded-2xl shadow-lg shadow-red-600/20 flex items-center gap-2 text-xs font-bold hover:scale-[1.02] active:scale-95 transition-all cursor-pointer"
                >
                  <Plus size={16} /> Tambah Staff Admin
                </button>
              </div>

              <div className="space-y-3 sm:space-y-4">
                {members
                  .filter(m => m.role === 'admin' || m.role === 'superadmin' || m.role === 'kwarda' || m.role === 'admin_kwarda')
                  .map((adm, idx) => (
                    <div key={`admin-row-${adm.id || idx}`} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-5 bg-gray-50 rounded-3xl border border-gray-100 group hover:bg-white hover:shadow-xl transition-all gap-3 sm:gap-4 w-full overflow-hidden">
                      <div className="flex items-center gap-3 sm:gap-4 min-w-0 w-full sm:w-auto">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-hw-dark font-black shrink-0">
                          {adm.namaLengkap?.charAt(0) || 'A'}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="text-sm font-bold text-gray-800 truncate">{adm.namaLengkap}</h4>
                          <p className="text-xs text-gray-500 truncate">{adm.email || 'Tanpa Email'}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-3 w-full sm:w-auto pt-2.5 sm:pt-0 border-t border-gray-200/60 sm:border-t-0">
                        <span className={`px-2.5 sm:px-3 py-1 text-[9px] font-black uppercase rounded-lg tracking-widest truncate ${
                          adm.role === 'superadmin' ? 'bg-red-600 text-white' : 
                          adm.role === 'admin' ? 'bg-hw-dark text-white' : 
                          'bg-blue-100 text-blue-600'
                        }`}>
                          {Array.isArray(adm.roles) ? adm.roles.map((r: string) => ROLE_LABELS[r] || r).join(', ') : (ROLE_LABELS[adm.role] || adm.role)}
                        </span>
                        <div className="flex items-center gap-1 shrink-0">
                          <button 
                            onClick={() => handleOpenModal(adm)}
                            className="p-2 text-gray-500 hover:text-hw-green hover:bg-hw-green/10 rounded-xl transition-colors cursor-pointer"
                            title="Edit Admin"
                          >
                            <Edit2 size={18} />
                          </button>
                          {adm.id !== user?.id && (
                            <button 
                              onClick={() => handleDeleteMember(adm.id)}
                              className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                              title="Hapus Admin"
                            >
                              <Trash2 size={18} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  {members.filter(m => m.role === 'admin' || m.role === 'superadmin' || m.role === 'kwarda' || m.role === 'admin_kwarda').length === 0 && (
                    <div className="text-center py-12 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                      <Shield size={32} className="mx-auto text-gray-200 mb-3" />
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Tidak ada staff admin ditemukan</p>
                    </div>
                  )}
              </div>
            </div>
          )}

          {/* PENGATURAN TAB */}
          {activeTab === 'pengaturan' && user?.role === 'superadmin' && (
            <div className="p-4 sm:p-8 space-y-8 sm:space-y-10">
              {/* App Names */}
              <div className="space-y-4">
                <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">Identitas Aplikasi</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-500 ml-1">Nama Aplikasi</label>
                    <input 
                      type="text" 
                      value={settings.appName || ''} 
                      onChange={(e) => setSettings({...settings, appName: e.target.value})}
                      className="w-full bg-gray-50 border-gray-100 focus:ring-hw-green/20 rounded-2xl px-4 py-3 text-xs font-bold" 
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-500 ml-1">Nama Organisasi</label>
                    <input 
                      type="text" 
                      value={settings.orgName || ''} 
                      onChange={(e) => setSettings({...settings, orgName: e.target.value})}
                      className="w-full bg-gray-50 border-gray-100 focus:ring-hw-green/20 rounded-2xl px-4 py-3 text-xs font-bold" 
                    />
                  </div>
                </div>
              </div>

              {/* Google Sheets API Config */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">Integrasi Database Google Sheets</h4>
                  <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase ${sheetsService.isMock() ? 'bg-amber-500/10 text-amber-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                    {sheetsService.isMock() ? 'Mode Simulasi' : 'Tersambung (Live)'}
                  </span>
                </div>
                <div className="bg-white p-6 rounded-[2rem] border border-gray-100 space-y-4 shadow-sm">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-500 ml-1">URL API Google Sheets (Apps Script Web App URL)</label>
                    <input 
                      type="text" 
                      placeholder="Contoh: https://script.google.com/macros/s/AKfycb.../exec"
                      value={settings.gSheetApiUrl || ''} 
                      onChange={(e) => setSettings({...settings, gSheetApiUrl: e.target.value})}
                      className="w-full bg-gray-50 border-gray-100 focus:ring-hw-green/20 rounded-2xl px-4 py-3 text-xs font-mono font-bold text-gray-800" 
                    />
                    <p className="text-[10px] text-gray-400 mt-1">
                      * Silakan salin URL Web App dari deployment Google Apps Script Anda. Tekan tombol <strong>"Simpan Semua Perubahan"</strong> di bagian bawah untuk menerapkan.
                    </p>
                  </div>
                </div>
              </div>

              {/* Upgrade Fees */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">Biaya Upgrade Role</h4>
                  <span className="text-[9px] font-black bg-hw-blue/10 text-hw-blue px-2 py-0.5 rounded-full uppercase">Konfigurasi Sistem</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {(Array.isArray(settings?.upgradeFees) ? settings.upgradeFees : []).map((fee, idx) => (
                    <div key={idx} className="bg-white p-5 rounded-3xl border border-gray-100 flex flex-col gap-4 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between">
                        <p className="text-[9px] font-black text-hw-green uppercase tracking-widest">{fee.label}</p>
                        <Settings size={12} className="text-gray-300" />
                      </div>
                      
                      <div className="space-y-3">
                        <div className="space-y-1">
                          <label className="text-[8px] font-black text-gray-400 uppercase tracking-tighter ml-1">Nominal Biaya</label>
                          <input 
                            type="text" 
                            value={fee.value || ''} 
                            onChange={(e) => {
                              const newFees = [...settings.upgradeFees];
                              newFees[idx] = { ...fee, value: e.target.value };
                              setSettings({ ...settings, upgradeFees: newFees });
                            }}
                            placeholder="Contoh: Rp 50.000 atau Gratis"
                            className="w-full bg-gray-50 border-gray-100 focus:ring-hw-green/20 rounded-xl px-3 py-2 text-xs font-bold text-gray-800" 
                          />
                        </div>
                        
                        <div className="space-y-1">
                          <label className="text-[8px] font-black text-gray-400 uppercase tracking-tighter ml-1">Syarat / Keterangan</label>
                          <input 
                            type="text" 
                            value={fee.note || ''} 
                            onChange={(e) => {
                              const newFees = [...settings.upgradeFees];
                              newFees[idx] = { ...fee, note: e.target.value };
                              setSettings({ ...settings, upgradeFees: newFees });
                            }}
                            placeholder="Contoh: Lampirkan KTA / Konfirmasi Bayar"
                            className="w-full bg-gray-50 border-gray-100 focus:ring-hw-green/20 rounded-xl px-3 py-2 text-[10px] font-medium text-gray-600" 
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-4 bg-orange-50 border border-orange-100 rounded-2xl flex items-start gap-3">
                  <Info size={16} className="text-orange-500 shrink-0 mt-0.5" />
                  <p className="text-[10px] text-orange-600 font-medium leading-relaxed">
                    <strong>PENTING:</strong> Data ini akan muncul di halaman Upgrade Role. Pastikan nominal dan syarat yang diinput sudah sesuai dengan kebijakan organisasi. Biaya <strong>Rp 0</strong> akan otomatis memicu form pengajuan dokumen SK di WhatsApp.
                  </p>
                </div>

                <div className="bg-white p-6 rounded-[2rem] border border-gray-100 space-y-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-xl bg-hw-green/10 flex items-center justify-center text-hw-green">
                      <MessageCircle size={18} />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-gray-800 uppercase tracking-widest">Nomor Konfirmasi WhatsApp</h4>
                      <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Tujuan konfirmasi upgrade anggota</p>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-500 ml-1">Nomor WhatsApp (Gunakan kode negara: 628...)</label>
                    <input 
                      type="text" 
                      placeholder="Contoh: 628123456789"
                      value={settings.waConfirmation || ''} 
                      onChange={(e) => setSettings({...settings, waConfirmation: e.target.value})}
                      className="w-full bg-gray-50 border-gray-100 focus:ring-hw-green/20 rounded-2xl px-4 py-3 text-sm font-bold text-hw-green" 
                    />
                    <p className="text-[10px] text-gray-400 italic ml-1">* Nomor ini akan digunakan sebagai link konfirmasi otomatis saat anggota klik tombol upgrade.</p>
                  </div>
                </div>
              </div>

              {/* Backup */}
              <div className="space-y-4">
                <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">Pusat Data</h4>
                <div className="bg-hw-blue/5 p-6 rounded-[2rem] border border-hw-blue/10 flex flex-wrap items-center justify-between gap-6">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-hw-blue text-white flex items-center justify-center shadow-lg shadow-hw-blue/20">
                      <Database size={28} />
                    </div>
                    <div>
                      <h5 className="text-sm font-bold text-gray-800">Backup Data Sistem</h5>
                      <p className="text-xs text-hw-blue font-medium mt-1">Terakhir backup: {settings.lastBackup}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <button 
                      onClick={async () => {
                        try {
                          setIsSyncing(true);
                          const res = await sheetsService.syncDatabase();
                          if (res.success) {
                            await fetchData();
                            alert('Database berhasil disinkronkan dan data UI diperbarui!');
                          } else {
                            alert('Sinkronisasi selesai namun ada status yang tidak terduga.');
                          }
                        } catch (error: any) {
                          alert('Gagal Sinkronisasi: ' + (error.message || 'Cek koneksi internet anda'));
                        } finally {
                          setIsSyncing(false);
                        }
                      }}
                      disabled={isSyncing}
                      className={`px-6 py-3 bg-white text-hw-blue border border-hw-blue/20 rounded-2xl text-xs font-bold hover:bg-hw-blue/5 transition-all flex items-center gap-2 ${isSyncing ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <RefreshCw size={16} className={isSyncing ? 'animate-spin' : ''} /> 
                      {isSyncing ? 'Syncing...' : 'Sync Database'}
                    </button>
                    <button 
                      onClick={handleBackupNow}
                      className="px-6 py-3 bg-hw-blue text-white rounded-2xl shadow-lg shadow-hw-blue/20 text-xs font-bold flex items-center gap-2 hover:scale-105 active:scale-95 transition-all"
                    >
                      <Download size={16} /> Backup Now
                    </button>
                  </div>
                </div>
              </div>

              {/* Google Sheets Apps Script Integration Guide */}
              <div className="space-y-4">
                <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">Google Sheets & Apps Script</h4>
                <div className="bg-emerald-500/5 p-6 rounded-[2rem] border border-emerald-500/10 space-y-4">
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20">
                        <Globe size={28} />
                      </div>
                      <div>
                        <h5 className="text-sm font-bold text-gray-800">Perbarui Google Apps Script</h5>
                        <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider mt-1">
                          Solusi Error "Action not found" atau "Aksi tidak ditemukan"
                        </p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setShowAppsScriptGuide(!showAppsScriptGuide)}
                      className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl text-xs font-bold transition-all shadow-md shadow-emerald-500/10 flex items-center gap-1.5"
                    >
                      {showAppsScriptGuide ? 'Sembunyikan Panduan' : 'Lihat Kode Apps Script'}
                    </button>
                  </div>

                  {showAppsScriptGuide && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="space-y-4 pt-4 border-t border-emerald-500/10 overflow-hidden"
                    >
                      <div className="p-4 bg-emerald-500/10 rounded-2xl text-[11px] text-emerald-800 leading-relaxed space-y-1 font-medium">
                        <p className="font-bold text-xs mb-1">💡 Cara Memperbarui Kode Apps Script Anda:</p>
                        <p>1. Buka file Google Sheet yang Anda gunakan sebagai database.</p>
                        <p>2. Klik menu <strong>Ekstensi (Extensions)</strong> &gt; <strong>Apps Script</strong>.</p>
                        <p>3. Hapus seluruh kode lama yang ada di editor Apps Script Anda.</p>
                        <p>4. Klik tombol <strong>"Salin Kode"</strong> di bawah ini, lalu tempel (paste) ke editor Apps Script Anda.</p>
                        <p>5. Klik tombol <strong>Simpan (Save/ikon disket)</strong> di Apps Script.</p>
                        <p>6. Klik <strong>Terapkan (Deploy)</strong> &gt; <strong>Kelola Penerapan (Manage Deployments)</strong> &gt; klik ikon pensil (edit) &gt; pilih versi <strong>Baru (New Version)</strong> &gt; klik <strong>Terapkan (Deploy)</strong> agar perubahan aktif.</p>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">backend/code.gs</span>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                const blob = new Blob([codeGsText], { type: 'text/plain;charset=utf-8' });
                                const url = URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = 'Code.gs';
                                document.body.appendChild(a);
                                a.click();
                                document.body.removeChild(a);
                                URL.revokeObjectURL(url);
                              }}
                              className="text-xs font-bold text-gray-700 hover:text-emerald-700 flex items-center gap-1 bg-white px-3 py-1.5 rounded-xl border border-gray-200 shadow-sm cursor-pointer"
                            >
                              <Download size={14} /> Unduh File Code.gs
                            </button>
                            <button 
                              type="button"
                              onClick={async () => {
                                try {
                                  if (navigator.clipboard && navigator.clipboard.writeText) {
                                    await navigator.clipboard.writeText(codeGsText);
                                  } else {
                                    throw new Error('Fallback');
                                  }
                                } catch {
                                  try {
                                    const textarea = document.createElement('textarea');
                                    textarea.value = codeGsText;
                                    document.body.appendChild(textarea);
                                    textarea.select();
                                    document.execCommand('copy');
                                    document.body.removeChild(textarea);
                                  } catch (e) {
                                    console.warn('Copy script error:', e);
                                  }
                                }
                                setCopiedScript(true);
                                setTimeout(() => setCopiedScript(false), 2000);
                              }}
                              className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 bg-white px-3 py-1.5 rounded-xl border border-emerald-500/20 shadow-sm cursor-pointer"
                            >
                              {copiedScript ? <><Check size={14} /> Tersalin!</> : <><Copy size={14} /> Salin Kode</>}
                            </button>
                          </div>
                        </div>
                        <div className="relative">
                          <pre className="w-full max-h-60 overflow-y-auto bg-gray-900 text-gray-100 text-[10px] p-5 rounded-2xl font-mono leading-relaxed select-all">
                            {codeGsText}
                          </pre>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button 
                  onClick={handleUpdateSettings}
                  disabled={isSavingSettings}
                  className="px-10 py-4 bg-hw-dark text-white rounded-2xl shadow-xl shadow-hw-dark/20 text-sm font-black hover:scale-105 active:scale-95 transition-all"
                >
                  {isSavingSettings ? 'Menyimpan...' : 'Simpan Semua Perubahan'}
                </button>
              </div>
            </div>
          )}
          {/* KTA TAB */}
          {activeTab === 'kta' && (
            <div className="flex flex-col h-full">
              {/* Header with Sub-Tabs */}
              <div className="p-6 border-b border-gray-50 bg-gray-50/30 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex flex-col gap-1">
                    <h3 className="text-sm font-black text-gray-800 uppercase tracking-wider">Pengelolaan KTA HW Jateng</h3>
                    <p className="text-xs text-gray-400 font-medium">Verifikasi pendaftaran, penerbitan Kartu Tanda Anggota, dan statistik KTA</p>
                  </div>
                  <button
                    onClick={handleResequenceKTAs}
                    disabled={isResequencingKta}
                    className="px-3.5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                    title="Merapikan dan menggeser nomor urut KTA yang kosong di tiap Kwarda/Qabilah agar urutan lengkap dari yang terkecil"
                  >
                    <RefreshCw size={15} className={isResequencingKta ? "animate-spin" : ""} />
                    <span>{isResequencingKta ? "Merapikan Nomor..." : "Rapikan & Geser Urutan KTA"}</span>
                  </button>
                </div>

                {/* Sub-tabs switcher */}
                <div className="flex border-b border-gray-150 gap-2 overflow-x-auto pt-2">
                  <button 
                    onClick={() => setActiveKtaSubTab('summary')}
                    className={`px-4 py-2.5 text-xs font-black border-b-2 transition-all whitespace-nowrap uppercase tracking-wider ${
                      activeKtaSubTab === 'summary'
                      ? 'border-hw-green text-hw-green'
                      : 'border-transparent text-gray-400 hover:text-gray-700'
                    }`}
                  >
                    1. Ringkasan & Aksi Cepat
                  </button>
                  <button 
                    onClick={() => setActiveKtaSubTab('kwarda')}
                    className={`px-4 py-2.5 text-xs font-black border-b-2 transition-all whitespace-nowrap uppercase tracking-wider ${
                      activeKtaSubTab === 'kwarda'
                      ? 'border-hw-green text-hw-green'
                      : 'border-transparent text-gray-400 hover:text-gray-700'
                    }`}
                  >
                    2. Daftar Kwarda & Qabilah
                  </button>
                  <button 
                    onClick={() => setActiveKtaSubTab('template')}
                    className={`px-4 py-2.5 text-xs font-black border-b-2 transition-all whitespace-nowrap uppercase tracking-wider ${
                      activeKtaSubTab === 'template'
                      ? 'border-hw-green text-hw-green'
                      : 'border-transparent text-gray-400 hover:text-gray-700'
                    }`}
                  >
                    3. Template KTA
                  </button>
                </div>
              </div>

              {/* Sub-tab content 0: Ringkasan & Aksi Cepat */}
              {activeKtaSubTab === 'summary' && (
                <div className="p-6 space-y-6">
                  {/* Grid metrics requested: pending KTA, total verified members, and official active KTA */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Metric 1: Pending KTA Applications */}
                    <div className="bg-amber-50/60 p-5 rounded-3xl border border-amber-100 flex flex-col justify-between shadow-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-amber-600 uppercase tracking-widest font-mono">Antrean Verifikasi KTA</span>
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-amber-200 text-amber-800">Menunggu</span>
                      </div>
                      <div className="flex items-baseline gap-2 mt-4">
                        <span className="text-4xl font-black text-amber-700 font-display">
                          {ktaApps.filter(k => k.status === 'pending').length}
                        </span>
                        <span className="text-[11px] text-amber-650 font-semibold font-sans">pengajuan aktif</span>
                      </div>
                      <p className="text-[10px] text-amber-600 mt-2 font-medium">Memerlukan peninjauan dan penomoran resmi sebelum diterbitkan.</p>
                    </div>

                    {/* Metric 2: Total Verified Members */}
                    <div className="bg-emerald-50/60 p-5 rounded-3xl border border-emerald-100 flex flex-col justify-between shadow-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest font-mono">Total Anggota Terverifikasi</span>
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-emerald-200 text-emerald-800">Aktif</span>
                      </div>
                      <div className="flex items-baseline gap-2 mt-4">
                        <span className="text-4xl font-black text-emerald-700 font-display">
                          {members.filter(m => m.isVerified).length}
                        </span>
                        <span className="text-[11px] text-emerald-650 font-semibold font-sans">anggota terdaftar</span>
                      </div>
                      <p className="text-[10px] text-emerald-600 mt-2 font-medium">Anggota yang telah terverifikasi dalam database sistem.</p>
                    </div>

                    {/* Metric 3: KTA Resmi Diterbitkan */}
                    <div className="bg-indigo-50/60 p-5 rounded-3xl border border-indigo-100 flex flex-col justify-between shadow-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-widest font-mono">KTA Resmi Diterbitkan</span>
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-indigo-200 text-indigo-800">Terbit</span>
                      </div>
                      <div className="flex items-baseline gap-2 mt-4">
                        <span className="text-4xl font-black text-indigo-700 font-display">
                          {ktaApps.filter(k => k.status === 'approved').length}
                        </span>
                        <span className="text-[11px] text-indigo-650 font-semibold font-sans">kartu aktif</span>
                      </div>
                      <div className="flex items-center gap-4 text-[10px] font-extrabold text-indigo-700 mt-2.5 pt-2 border-t border-indigo-100/50">
                        <div className="flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                          <span>Digital: {ktaApps.filter(k => k.status === 'approved' && (k.jenisKta === 'Digital' || !k.jenisKta)).length}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-violet-500"></span>
                          <span>Fisik: {ktaApps.filter(k => k.status === 'approved' && k.jenisKta === 'Fisik').length}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Beautiful & Compact KTA Statistics */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                    {/* Left: Tingkatan HW Penyebaran */}
                    <div className="lg:col-span-8 bg-white p-5 rounded-3xl border border-gray-100 shadow-sm space-y-3">
                      <div className="flex items-center gap-2 pb-1.5 border-b border-gray-50">
                        <Award size={14} className="text-hw-green" />
                        <h4 className="text-[10px] font-black text-gray-800 uppercase tracking-wider font-display">Distribusi Tingkatan HW</h4>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-2.5">
                        {['Tunas Athfal', 'Athfal', 'Pengenal', 'Penghela', 'Penuntun', 'Dewasa'].map((tingkatan) => {
                          const count = ktaApps.filter(k => k.tingkatan === tingkatan).length;
                          const approved = ktaApps.filter(k => k.tingkatan === tingkatan && k.status === 'approved').length;
                          const pending = ktaApps.filter(k => k.tingkatan === tingkatan && k.status === 'pending').length;
                          const maxCount = Math.max(...['Tunas Athfal', 'Athfal', 'Pengenal', 'Penghela', 'Penuntun', 'Dewasa'].map(t => ktaApps.filter(k => k.tingkatan === t).length), 1);
                          return (
                            <div key={tingkatan} className="space-y-1">
                              <div className="flex justify-between items-center text-[10px]">
                                <span className="text-gray-700 font-extrabold truncate max-w-[85px]">{tingkatan}</span>
                                <span className="text-gray-400 font-mono font-bold text-[9px]">{count} total <span className="text-green-600 font-extrabold">({approved} ✔)</span></span>
                              </div>
                              <div className="w-full bg-gray-50 h-1.5 rounded-full overflow-hidden flex border border-gray-100">
                                <div 
                                  style={{ width: `${(approved / maxCount) * 100}%` }} 
                                  className="bg-hw-green h-full rounded-l-full"
                                />
                                <div 
                                  style={{ width: `${(pending / maxCount) * 100}%` }} 
                                  className="bg-yellow-400 h-full rounded-r-full"
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Right: Ringkasan Status KTA */}
                    <div className="lg:col-span-4 bg-white p-5 rounded-3xl border border-gray-100 shadow-sm space-y-3 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-2 pb-1.5 border-b border-gray-50">
                          <Users size={14} className="text-hw-green" />
                          <h4 className="text-[10px] font-black text-gray-800 uppercase tracking-wider font-display">Ringkasan Status KTA</h4>
                        </div>
                        <div className="grid grid-cols-2 gap-2 pt-2.5">
                          <div className="bg-gray-50/50 p-2.5 rounded-2xl border border-gray-100 text-center">
                            <div className="text-[9px] text-gray-400 font-bold uppercase tracking-wider leading-none mb-1">Total Masuk</div>
                            <div className="text-base font-black text-gray-800 font-display">{ktaApps.length}</div>
                          </div>
                          <div className="bg-amber-50/30 p-2.5 rounded-2xl border border-amber-100/60 text-center">
                            <div className="text-[9px] text-amber-600 font-bold uppercase tracking-wider leading-none mb-1">Menunggu</div>
                            <div className="text-base font-black text-amber-700 font-display">{ktaApps.filter(k => k.status === 'pending').length}</div>
                          </div>
                          <div className="bg-emerald-50/30 p-2.5 rounded-2xl border border-emerald-100/60 text-center">
                            <div className="text-[9px] text-emerald-600 font-bold uppercase tracking-wider leading-none mb-1">Disetujui</div>
                            <div className="text-base font-black text-emerald-700 font-display">{ktaApps.filter(k => k.status === 'approved').length}</div>
                          </div>
                          <div className="bg-rose-50/30 p-2.5 rounded-2xl border border-rose-100/60 text-center">
                            <div className="text-[9px] text-rose-600 font-bold uppercase tracking-wider leading-none mb-1">Ditolak</div>
                            <div className="text-base font-black text-rose-700 font-display">{ktaApps.filter(k => k.status === 'rejected').length}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Quick-Action List for Reviewing and Printing */}
                  <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="p-5 border-b border-gray-50 bg-gray-50/20 flex flex-col sm:flex-row items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <Printer className="text-hw-green" size={18} />
                        <div>
                          <h4 className="text-xs font-black text-gray-800 uppercase tracking-wider font-display">Daftar Aksi Cepat Peninjauan & Cetak KTA</h4>
                          <p className="text-[10px] text-gray-400 font-medium">Tinjau, setujui secara instan, atau cetak KTA yang siap terbit langsung dari panel ini.</p>
                        </div>
                      </div>
                      <button
                        onClick={async () => {
                          if (window.confirm('Apakah Anda yakin ingin membersihkan antrean KTA dari data kosong/tidak valid?')) {
                            try {
                              setLoading(true);
                              const validKtas = ktaApps.filter(k => k && (k.nama || k.namaLengkap) && k.tingkatan);
                              safeStorageSet('kta_applications', validKtas);
                              setKtaApps(validKtas);
                              alert('Berhasil membersihkan data kosong dari antrean!');
                              await fetchData();
                            } catch (e: any) {
                              alert('Gagal membersihkan data: ' + e.message);
                            } finally {
                              setLoading(false);
                            }
                          }
                        }}
                        className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer shrink-0"
                      >
                        Bersihkan Data Kosong
                      </button>
                      <button
                        onClick={async () => {
                          const pendingCount = ktaApps.filter(k => k && k.status === 'pending').length;
                          if (pendingCount === 0) {
                            alert('Tidak ada data pengajuan KTA yang terpending.');
                            return;
                          }
                          if (window.confirm(`Apakah Anda yakin ingin menghapus ${pendingCount} data pengajuan KTA yang terpending?`)) {
                            try {
                              setLoading(true);
                              const res = await sheetsService.deletePendingKtaApplications();
                              alert(`Berhasil menghapus ${res.deletedCount || pendingCount} data pengajuan KTA terpending.`);
                              await fetchData();
                            } catch (e: any) {
                              alert('Gagal menghapus data terpending: ' + (e.message || 'Error'));
                            } finally {
                              setLoading(false);
                            }
                          }
                        }}
                        className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer shrink-0"
                      >
                        Hapus Data Terpending
                      </button>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse min-w-[700px]">
                        <thead>
                          <tr className="bg-gray-50/50 border-b border-gray-100 text-[10px] font-black uppercase text-gray-400 tracking-wider">
                            <th className="p-3.5 pl-5 w-14">Foto</th>
                            <th className="p-3.5">Anggota</th>
                            <th className="p-3.5">Kwarda / Qabilah</th>
                            <th className="p-3.5">Tingkatan</th>
                            <th className="p-3.5 w-32">Status</th>
                            <th className="p-3.5 pr-5 text-center w-56">Aksi Cepat</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 text-xs font-semibold text-gray-750">
                          {ktaApps.filter(app => app.status === 'pending').length === 0 ? (
                            <tr>
                              <td colSpan={6} className="p-12 text-center text-gray-400 font-bold uppercase tracking-wider bg-gray-50/5">
                                🎉 Tidak ada antrean KTA tertunda! Semua pengajuan telah diverifikasi.
                              </td>
                            </tr>
                          ) : (
                            ktaApps.filter(app => app.status === 'pending').slice(0, 8).map((app, idx) => (
                              <tr key={app.id} className="hover:bg-gray-50/30 transition-all">
                                <td className="p-3.5 pl-5">
                                  <div className="w-9 h-11 bg-gray-50 rounded-lg overflow-hidden border border-gray-200 shadow-2xs shrink-0">
                                    {app.photo ? (
                                      <img src={app.photo} alt="Foto KTA" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center text-gray-300">
                                        <UserIcon size={16} />
                                      </div>
                                    )}
                                  </div>
                                </td>
                                <td className="p-3.5">
                                  <div className="font-extrabold text-sm text-gray-800"><span className="text-gray-400 font-mono text-xs font-bold mr-1.5">{idx + 1}.</span>{app.nama}</div>
                                  <div className="text-[10px] text-gray-400 leading-none">{app.email || app.noWa}</div>
                                </td>
                                <td className="p-3.5">
                                  <div className="font-bold text-gray-700">{app.asalDaerah}</div>
                                  <div className="text-[10px] text-gray-400 font-medium">Qabilah: {app.qabilah || '-'}</div>
                                </td>
                                <td className="p-3.5">
                                  <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-100">
                                    {app.tingkatan}
                                  </span>
                                </td>
                                <td className="p-3.5">
                                  <span className="inline-flex items-center gap-1 bg-yellow-50 text-yellow-700 px-2 py-0.5 rounded-full text-[9px] font-black border border-yellow-100 uppercase tracking-widest">
                                    Pending
                                  </span>
                                </td>
                                <td className="p-3.5 text-center pr-5">
                                  <div className="flex items-center justify-center gap-1.5 flex-wrap">
                                    <button
                                      onClick={() => {
                                        setViewingKtaApp(app);
                                        setIsViewKtaModalOpen(true);
                                        setFlippedAdmin(false);
                                      }}
                                      className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200/80 hover:bg-emerald-100 rounded-lg font-bold text-[10px] uppercase tracking-wider transition-all shadow-2xs cursor-pointer active:scale-95"
                                      title="Preview KTA"
                                    >
                                      <Eye size={12} />
                                      <span>Preview</span>
                                    </button>
                                    <button
                                      onClick={() => handleApproveKTA(app.id)}
                                      className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-hw-green text-white hover:bg-emerald-700 rounded-lg font-black text-[10px] uppercase tracking-wider transition-all shadow-2xs cursor-pointer active:scale-95"
                                      title="Setujui KTA"
                                    >
                                      <CheckCircle2 size={12} />
                                      <span>Approve</span>
                                    </button>
                                    <button
                                      onClick={() => handleOpenRejectKTA(app.id)}
                                      className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-rose-50 text-rose-600 border border-rose-200/80 hover:bg-rose-100 rounded-lg font-bold text-[10px] uppercase tracking-wider transition-all shadow-2xs cursor-pointer active:scale-95"
                                      title="Tolak KTA"
                                    >
                                      <XCircle size={12} />
                                      <span>Tolak</span>
                                    </button>
                                    <button
                                      onClick={() => handleDeleteKtaApp(app.id, app.nama || 'Data Tidak Valid')}
                                      className="inline-flex items-center justify-center p-1.5 bg-rose-50 text-rose-600 border border-rose-200/80 hover:bg-rose-100 rounded-lg transition-all shadow-2xs cursor-pointer active:scale-95 shrink-0"
                                      title="Hapus KTA"
                                    >
                                      <Trash2 size={13} />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Manajemen KTA HW Card */}
                  <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="p-5 border-b border-gray-50 bg-gray-50/20 flex flex-col sm:flex-row items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <Users className="text-hw-green" size={18} />
                        <div>
                          <h4 className="text-xs font-black text-gray-800 uppercase tracking-wider font-display">Manajemen KTA HW</h4>
                          <p className="text-[10px] text-gray-400 font-medium">Kelola, saring, verifikasi, atau edit semua pengajuan KTA HW Jawa Tengah.</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={exportKTAToExcel}
                          className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 text-white hover:bg-emerald-700 rounded-xl font-black text-[11px] transition-all shadow-sm cursor-pointer active:scale-95"
                          title="Export Data KTA Terfilter ke format Excel / CSV"
                        >
                          <FileSpreadsheet size={14} />
                          Export Excel KTA
                        </button>
                        <button
                          onClick={exportKTAToPDF}
                          className="flex items-center gap-1.5 px-3.5 py-2 bg-rose-600 text-white hover:bg-rose-700 rounded-xl font-black text-[11px] transition-all shadow-sm cursor-pointer active:scale-95"
                          title="Export Laporan Data KTA Terfilter ke format PDF"
                        >
                          <FileText size={14} />
                          Export PDF KTA
                        </button>
                      </div>
                    </div>

                    {/* Search & Filter inside card */}
                    <div className="p-5 border-b border-gray-50 bg-gray-50/5 space-y-3">
                      <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
                        {/* Search Input */}
                        <div className="relative flex-1">
                          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                          <input 
                            type="text" 
                            placeholder="Cari nama, email, Kwarda, no. KTA, qabilah..." 
                            value={ktaSearchQuery || ''}
                            onChange={(e) => setKtaSearchQuery(e.target.value)}
                            className="w-full bg-white border border-gray-150 rounded-xl py-2.5 pl-11 pr-10 focus:ring-2 focus:ring-hw-green/20 outline-none text-xs font-semibold shadow-2xs"
                          />
                          {ktaSearchQuery && (
                            <button
                              type="button"
                              onClick={() => setKtaSearchQuery('')}
                              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-hw-green transition-colors cursor-pointer"
                            >
                              <X size={16} />
                            </button>
                          )}
                        </div>

                        {/* Dropdowns for Kwarda Filter & Sorting */}
                        <div className="flex flex-wrap items-center gap-2">
                          {/* Filter Kwarda Dropdown */}
                          <div className="flex items-center gap-1.5 bg-white border border-gray-150 rounded-xl px-3 py-2 shadow-2xs text-xs">
                            <MapPin size={14} className="text-hw-green shrink-0" />
                            <span className="font-bold text-gray-400 whitespace-nowrap text-[10px] uppercase tracking-wider">Kwarda:</span>
                            <select
                              value={ktaFilterKwarda || 'Semua'}
                              onChange={(e) => setKtaFilterKwarda(e.target.value)}
                              className="bg-transparent font-extrabold text-gray-800 outline-none text-xs cursor-pointer max-w-[190px] truncate"
                            >
                              <option value="Semua">Semua Kwarda & Qabilah ({ktaApps.length})</option>
                              <optgroup label="1. Kwarda (Kabupaten / Kota)">
                                {KWARDA_QABILAH_JATENG.slice(0, 35).map(k => {
                                  const count = ktaApps.filter(a => (a.asalDaerah || '').toLowerCase().trim() === k.name.toLowerCase().trim()).length;
                                  return (
                                    <option key={k.code} value={k.name}>
                                      {parseInt(k.code, 10)}. {k.name} ({count} Anggota)
                                    </option>
                                  );
                                })}
                              </optgroup>
                              <optgroup label="2. Qabilah PTMA">
                                {KWARDA_QABILAH_JATENG.slice(35).map(q => {
                                  const count = ktaApps.filter(a => (a.asalDaerah || a.qabilah || '').toLowerCase().trim() === q.name.toLowerCase().trim()).length;
                                  return (
                                    <option key={q.code} value={q.name}>
                                      {parseInt(q.code, 10)}. {q.name} ({count} Anggota)
                                    </option>
                                  );
                                })}
                              </optgroup>
                            </select>
                            {ktaFilterKwarda !== 'Semua' && (
                              <button
                                onClick={() => setKtaFilterKwarda('Semua')}
                                className="text-gray-400 hover:text-rose-500 transition-colors p-0.5"
                                title="Reset Filter Kwarda"
                              >
                                <X size={13} />
                              </button>
                            )}
                          </div>

                          {/* Sort By Dropdown */}
                          <div className="flex items-center gap-1.5 bg-white border border-gray-150 rounded-xl px-3 py-2 shadow-2xs text-xs">
                            <ArrowUpDown size={14} className="text-hw-green shrink-0" />
                            <span className="font-bold text-gray-400 whitespace-nowrap text-[10px] uppercase tracking-wider">Urutan:</span>
                            <select
                              value={ktaSortBy || 'kwarda'}
                              onChange={(e) => setKtaSortBy(e.target.value as any)}
                              className="bg-transparent font-extrabold text-gray-800 outline-none text-xs cursor-pointer"
                            >
                              <option value="kwarda">Urut Kwarda (A-Z) & No. KTA</option>
                              <option value="ktaNumber">Urut Penomoran KTA (Kode/Seq)</option>
                              <option value="nama">Urut Nama Anggota (A-Z)</option>
                              <option value="tanggal">Urut Tanggal Ajuan (Terbaru)</option>
                              <option value="status">Urut Status Verifikasi</option>
                            </select>
                          </div>
                        </div>

                        {/* Filter Status Buttons */}
                        <div className="flex gap-1 overflow-x-auto shrink-0">
                          {['Semua', 'pending', 'approved', 'rejected'].map((st) => (
                            <button
                              key={st}
                              onClick={() => setKtaFilterStatus(st)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize whitespace-nowrap transition-all border ${
                                ktaFilterStatus === st 
                                ? 'bg-hw-dark text-white border-hw-dark shadow-xs' 
                                : 'bg-white text-gray-500 border-gray-100 hover:border-gray-200 shadow-2xs'
                              }`}
                            >
                              {st === 'pending' ? 'Menunggu' : st === 'approved' ? 'Disetujui' : st === 'rejected' ? 'Ditolak' : 'Semua Status'}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Active Filter & KTA Sequence Info Bar */}
                      {(ktaFilterKwarda !== 'Semua' || ktaFilterStatus !== 'Semua' || ktaSearchQuery || ktaSortBy !== 'kwarda') && (
                        <div className="p-3 bg-emerald-50/90 border border-emerald-150 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 text-xs">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="px-2 py-0.5 rounded-md bg-emerald-600 text-white font-extrabold text-[10px] uppercase tracking-wider">
                              Ringkasan Filter KTA
                            </span>
                            <span className="font-extrabold text-emerald-950">
                              {ktaFilterKwarda !== 'Semua' ? `Kwarda: ${ktaFilterKwarda}` : 'Semua Kwarda'}
                            </span>
                            <span className="text-emerald-700 font-semibold">• Total: <strong>{filteredKtaApps.length}</strong> anggota</span>
                            <span className="text-emerald-700 font-semibold">• KTA Aktif (Resmi): <strong>{filteredKtaApps.filter(a => a.status === 'approved').length}</strong></span>
                            {(() => {
                              const approvedKtas = filteredKtaApps.filter(a => a.status === 'approved' && a.ktaNumber).map(a => a.ktaNumber).sort((a,b) => a.localeCompare(b, undefined, { numeric: true }));
                              if (approvedKtas.length > 0) {
                                return (
                                  <span className="text-emerald-800 font-bold font-mono bg-white/80 px-2 py-0.5 rounded border border-emerald-200 text-[10px]">
                                    KTA: {approvedKtas[0]} {approvedKtas.length > 1 ? `s/d ${approvedKtas[approvedKtas.length - 1]}` : ''}
                                  </span>
                                );
                              }
                              return null;
                            })()}
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setKtaFilterKwarda('Semua');
                              setKtaFilterStatus('Semua');
                              setKtaSearchQuery('');
                              setKtaSortBy('kwarda');
                            }}
                            className="px-2.5 py-1 bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 rounded-lg font-black text-[10px] uppercase transition-all cursor-pointer shrink-0"
                          >
                            Reset Filter
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Application List Table */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse min-w-[850px]">
                        <thead>
                          <tr className="bg-gray-50/50 border-b border-gray-100 text-[10px] font-black uppercase text-gray-400 tracking-wider">
                            <th className="p-3.5 pl-5 w-14">Foto</th>
                            <th className="p-3.5 min-w-[180px]">Nama & Kontak</th>
                            <th className="p-3.5 min-w-[130px]">Tingkatan & Jenis</th>
                            <th className="p-3.5 min-w-[160px]">Asal Kwarda / Qabilah</th>
                            <th className="p-3.5 min-w-[150px] w-[170px]">Status / No. KTA</th>
                            <th className="p-3.5 pr-5 text-center min-w-[200px] w-[220px]">Aksi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 text-xs font-semibold text-gray-750">
                          {paginatedKtaApps.length === 0 ? (
                            <tr>
                              <td colSpan={7} className="p-12 text-center text-gray-400 font-bold uppercase tracking-wider">
                                Belum ada pengajuan KTA yang sesuai kriteria filter
                              </td>
                            </tr>
                          ) : (
                            paginatedKtaApps.map((app, idx) => {
                              const itemIndex = (ktaPage - 1) * ktaPageSize + idx;
                              return (
                              <tr key={app.id} className="hover:bg-gray-50/30 transition-all">
                                <td className="p-3.5 pl-5">
                                  <div className="w-10 h-12 bg-gray-50 rounded-lg overflow-hidden border border-gray-200 shadow-2xs">
                                    {app.photo ? (
                                      <img src={app.photo} alt="Foto KTA" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-50">
                                        <UserIcon size={20} className="text-gray-400" />
                                      </div>
                                    )}
                                  </div>
                                </td>
                                <td className="p-3.5">
                                  <div className="font-extrabold text-sm text-gray-800"><span className="text-gray-400 font-mono text-xs font-bold mr-1.5">{itemIndex + 1}.</span>{app.nama}</div>
                                  <div className="text-[10px] text-gray-400 lowercase">{app.email}</div>
                                  <div className="text-[10px] text-hw-green font-mono">{app.noWa}</div>
                                </td>
                                <td className="p-3.5 space-y-1">
                                  <div>
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-100">
                                      {app.tingkatan}
                                    </span>
                                  </div>
                                  <span className="inline-block text-[10px] text-gray-450 font-bold">
                                    KTA: <strong className="text-hw-green uppercase">{app.jenisKta || 'Digital'}</strong>
                                  </span>
                                </td>
                                <td className="p-3.5">
                                  <div className="font-bold flex items-center gap-1 text-gray-800">
                                    <MapPin size={11} className="text-gray-450 shrink-0" />
                                    {app.asalDaerah}
                                  </div>
                                  <div className="text-[10px] text-gray-450 font-medium truncate max-w-[150px]" title={app.qabilah}>
                                    Qabilah: {app.qabilah || '-'}
                                  </div>
                                </td>
                                <td className="p-3.5">
                                  {app.status === 'pending' ? (
                                    <span className="inline-flex items-center gap-1 bg-yellow-50 text-yellow-700 px-2.5 py-1 rounded-full text-[10px] font-black border border-yellow-150 uppercase tracking-widest animate-pulse">
                                      Belum Verifikasi
                                    </span>
                                  ) : app.status === 'approved' ? (
                                    <div className="space-y-1">
                                      <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 px-2.5 py-0.5 rounded-full text-[10px] font-black border border-green-150 uppercase tracking-widest">
                                        Resmi Aktif
                                      </span>
                                      <div className="font-mono text-[9px] font-black text-gray-500 tracking-wider">
                                        {app.ktaNumber}
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="space-y-1">
                                      <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-700 px-2.5 py-0.5 rounded-full text-[10px] font-black border border-rose-150 uppercase tracking-widest">
                                        Ditolak
                                      </span>
                                      {app.remark && (
                                        <div className="text-[10px] text-rose-600 font-medium max-w-[150px] truncate italic" title={app.remark}>
                                          "{app.remark}"
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </td>
                                <td className="p-3.5 pr-5 text-center">
                                  <div className="flex items-center justify-center gap-1.5 flex-wrap">
                                    {app.status === 'pending' && (
                                      <>
                                        <button
                                          onClick={() => handleApproveKTA(app.id)}
                                          className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-hw-green hover:bg-emerald-700 text-white rounded-lg font-black text-[10px] uppercase tracking-wider transition-all shadow-2xs cursor-pointer active:scale-95"
                                          title="Setujui KTA"
                                        >
                                          <CheckCircle2 size={12} />
                                          <span>Setujui</span>
                                        </button>
                                        <button
                                          onClick={() => handleOpenRejectKTA(app.id)}
                                          className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200/80 rounded-lg font-bold text-[10px] uppercase tracking-wider transition-all cursor-pointer active:scale-95"
                                          title="Tolak KTA"
                                        >
                                          <XCircle size={12} />
                                          <span>Tolak</span>
                                        </button>
                                      </>
                                    )}
                                    
                                    <button
                                      onClick={() => {
                                        setEditingKtaApp(app);
                                        setIsEditKtaModalOpen(true);
                                      }}
                                      className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/80 rounded-lg font-bold text-[10px] uppercase tracking-wider transition-all cursor-pointer active:scale-95 shadow-2xs"
                                      title="Edit Data Anggota KTA"
                                    >
                                      <Pencil size={11} />
                                      <span>Edit</span>
                                    </button>

                                    <button
                                      onClick={() => {
                                        setViewingKtaApp(app);
                                        setIsViewKtaModalOpen(true);
                                        setFlippedAdmin(false);
                                      }}
                                      className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200/80 rounded-lg font-bold text-[10px] uppercase tracking-wider transition-all cursor-pointer active:scale-95 shadow-2xs"
                                      title="Preview KTA"
                                    >
                                      <Eye size={12} />
                                      <span>Preview</span>
                                    </button>

                                    <button
                                      onClick={() => handleDeleteKtaApp(app.id, app.nama || 'Pengajuan KTA')}
                                      className="inline-flex items-center justify-center p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200/80 rounded-lg transition-all cursor-pointer active:scale-95 shrink-0"
                                      title="Hapus KTA"
                                    >
                                      <Trash2 size={13} />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* KTA Table Pagination Footer */}
                    <div className="p-4 sm:p-5 border-t border-gray-150 flex flex-col sm:flex-row items-center justify-between gap-3 text-gray-500 bg-gray-50/50">
                      <div className="flex flex-wrap items-center gap-3 text-xs font-semibold">
                        <span>
                          Menampilkan <strong className="text-gray-800 font-bold">{filteredKtaApps.length > 0 ? (ktaPage - 1) * ktaPageSize + 1 : 0}</strong> - <strong className="text-gray-800 font-bold">{Math.min(ktaPage * ktaPageSize, filteredKtaApps.length)}</strong> dari <strong className="text-gray-800 font-bold">{filteredKtaApps.length}</strong> pengajuan KTA (Total: {ktaApps.length})
                        </span>
                        <div className="flex items-center gap-1.5 ml-2">
                          <span className="text-[11px] text-gray-400">Per hal:</span>
                          <select
                            value={ktaPageSize || 10}
                            onChange={(e) => {
                              setKtaPageSize(Number(e.target.value));
                              setKtaPage(1);
                            }}
                            className="bg-white border border-gray-200 rounded-lg px-2 py-1 text-xs font-bold text-gray-700 outline-none"
                          >
                            <option value={10}>10</option>
                            <option value={25}>25</option>
                            <option value={50}>50</option>
                            <option value={100}>100</option>
                          </select>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          disabled={ktaPage <= 1}
                          onClick={() => setKtaPage(prev => Math.max(1, prev - 1))}
                          className="px-3 py-1.5 rounded-xl text-xs font-black border border-gray-200 bg-white hover:bg-gray-100 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                        >
                          Prev
                        </button>
                        <span className="text-xs font-bold text-gray-600 px-2">
                          Halaman <strong>{ktaPage}</strong> dari <strong>{totalKtaPages}</strong>
                        </span>
                        <button
                          disabled={ktaPage >= totalKtaPages}
                          onClick={() => setKtaPage(prev => Math.min(totalKtaPages, prev + 1))}
                          className="px-3 py-1.5 rounded-xl text-xs font-black border border-gray-200 bg-white hover:bg-gray-100 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}


              {/* Sub-tab content 2: Daftar Kwarda & Qabilah PTMA */}
              {activeKtaSubTab === 'kwarda' && (
                <div className="p-6 space-y-6">
                  {/* Local Search inside Kwarda/Qabilah tab */}
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input 
                      type="text" 
                      placeholder="Cari berdasarkan nama Kwarda atau Qabilah..." 
                      value={ktaSearchQuery || ''}
                      onChange={(e) => setKtaSearchQuery(e.target.value)}
                      className="w-full bg-white border border-gray-150 rounded-xl py-3 pl-11 pr-10 focus:ring-2 focus:ring-hw-green/20 outline-none text-xs font-semibold"
                    />
                    {ktaSearchQuery && (
                      <button
                        type="button"
                        onClick={() => setKtaSearchQuery('')}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-hw-green transition-colors cursor-pointer"
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>

                  <div className="flex flex-col gap-6">
                    {/* Top Panel: Daftar Kwarda */}
                    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
                      <div className="p-4 border-b border-gray-50 bg-gray-50/20 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <MapPin size={15} className="text-hw-green" />
                          <h4 className="text-xs font-black text-gray-800 uppercase tracking-wider font-display">Daftar Kwarda (Kabupaten/Kota)</h4>
                        </div>
                        <span className="px-2.5 py-0.5 rounded-full bg-hw-green/10 text-hw-green text-[10px] font-black">
                          {kwardaStats.length} Kwarda
                        </span>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-gray-50 border-b border-gray-100 text-[9px] font-black uppercase text-gray-400 tracking-wider">
                              <th className="p-3 pl-5">Nama Kwarda</th>
                              <th className="p-3 text-center">Approved</th>
                              <th className="p-3 text-center">Pending</th>
                              <th className="p-3 text-center">Total</th>
                              <th className="p-3 text-center">Rentang No. KTA</th>
                              <th className="p-3 pr-5 text-center">Aksi / Verifikasi</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50 text-xs font-semibold text-gray-700">
                            {kwardaStats.filter(item => item.name.toLowerCase().includes(ktaSearchQuery.toLowerCase())).length === 0 ? (
                              <tr>
                                <td colSpan={6} className="p-8 text-center text-gray-400 font-bold uppercase text-[10px]">
                                  Kwarda tidak ditemukan
                                </td>
                              </tr>
                            ) : (
                              kwardaStats.filter(item => item.name.toLowerCase().includes(ktaSearchQuery.toLowerCase())).map((item) => {
                                const foundItem = KWARDA_QABILAH_JATENG.find(x => x.name === item.name);
                                const codeNum = foundItem ? parseInt(foundItem.code, 10) : '';
                                
                                const kwardaMembers = ktaApps.filter(a => (a.asalDaerah || '').toLowerCase().trim() === item.name.toLowerCase().trim());
                                const approvedKtas = kwardaMembers
                                  .filter(a => a.status === 'approved' && a.ktaNumber)
                                  .sort((a,b) => compareKtaNumbers(a, b))
                                  .map(a => a.ktaNumber);

                                return (
                                  <tr key={item.name} className="hover:bg-gray-50/40 transition-colors">
                                    <td className="p-3 pl-5 font-extrabold text-gray-800">
                                      {codeNum ? `${codeNum}. ` : ''}{item.name}
                                    </td>
                                    <td className="p-3 text-center">
                                      <span className="px-2 py-0.5 rounded bg-green-50 text-green-700 border border-green-100 font-mono text-[10px]">
                                        {item.approved}
                                      </span>
                                    </td>
                                    <td className="p-3 text-center">
                                      <span className="px-2 py-0.5 rounded bg-yellow-50 text-yellow-700 border border-yellow-100 font-mono text-[10px]">
                                        {item.pending}
                                      </span>
                                    </td>
                                    <td className="p-3 text-center font-black text-gray-800 font-mono">{item.total}</td>
                                    <td className="p-3 text-center font-mono text-[10px]">
                                      {approvedKtas.length > 0 ? (
                                        <span className="inline-block px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-150 font-bold">
                                          {approvedKtas[0]} {approvedKtas.length > 1 ? `s/d ${approvedKtas[approvedKtas.length - 1]}` : ''}
                                        </span>
                                      ) : (
                                        <span className="text-gray-300 italic text-[10px]">- Belum ada KTA -</span>
                                      )}
                                    </td>
                                    <td className="p-3 pr-5 text-center">
                                      <div className="flex items-center justify-center gap-1.5">
                                        <button
                                          onClick={() => {
                                            setKtaFilterKwarda(item.name);
                                            setActiveKtaSubTab('summary');
                                          }}
                                          className="px-2.5 py-1 bg-hw-dark hover:bg-black text-white rounded-lg text-[10px] font-extrabold transition-all shadow-2xs cursor-pointer active:scale-95"
                                          title={`Filter tabel utama untuk ${item.name}`}
                                        >
                                          Filter Tabel Utama
                                        </button>
                                        <button
                                          onClick={() => setSelectedKwardaModal(item.name)}
                                          className="px-2.5 py-1 bg-hw-green/10 hover:bg-hw-green text-hw-green hover:text-white rounded-lg text-[10px] font-extrabold transition-all border border-hw-green/20 cursor-pointer active:scale-95"
                                          title={`Lihat daftar anggota ${item.name}`}
                                        >
                                          Detail Anggota ({item.total})
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Bottom Panel: Daftar Asal Qabilah PTMA */}
                    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
                      <div className="p-4 border-b border-gray-50 bg-gray-50/20 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Users size={15} className="text-hw-green" />
                          <h4 className="text-xs font-black text-gray-800 uppercase tracking-wider font-display">Daftar Asal Qabilah PTMA</h4>
                        </div>
                        <span className="px-2.5 py-0.5 rounded-full bg-hw-green/10 text-hw-green text-[10px] font-black">
                          {qabilahStats.length} Qabilah
                        </span>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-gray-50 border-b border-gray-100 text-[9px] font-black uppercase text-gray-400 tracking-wider">
                              <th className="p-3 pl-5">Nama Qabilah/Pangkalan</th>
                              <th className="p-3 text-center whitespace-nowrap">Approved</th>
                              <th className="p-3 text-center whitespace-nowrap">Pending</th>
                              <th className="p-3 text-center whitespace-nowrap">Total</th>
                              <th className="p-3 text-center whitespace-nowrap">Rentang No. KTA</th>
                              <th className="p-3 pr-5 text-center whitespace-nowrap">Aksi / Verifikasi</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50 text-xs font-semibold text-gray-700">
                            {qabilahStats.filter(item => item.name.toLowerCase().includes(ktaSearchQuery.toLowerCase())).length === 0 ? (
                              <tr>
                                <td colSpan={6} className="p-8 text-center text-gray-400 font-bold uppercase text-[10px]">
                                  Qabilah tidak ditemukan
                                </td>
                              </tr>
                            ) : (
                              qabilahStats.filter(item => item.name.toLowerCase().includes(ktaSearchQuery.toLowerCase())).map((item) => {
                                const foundItem = KWARDA_QABILAH_JATENG.find(x => x.name === item.name);
                                const codeNum = foundItem ? parseInt(foundItem.code, 10) : '';

                                const qabilahMembers = ktaApps.filter(a => (a.asalDaerah || a.qabilah || '').toLowerCase().trim() === item.name.toLowerCase().trim());
                                const approvedKtas = qabilahMembers
                                  .filter(a => a.status === 'approved' && a.ktaNumber)
                                  .sort((a,b) => compareKtaNumbers(a, b))
                                  .map(a => a.ktaNumber);

                                return (
                                  <tr key={item.name} className="hover:bg-gray-50/40 transition-colors">
                                    <td className="p-3 pl-5 font-extrabold text-gray-800">
                                      {codeNum ? `${codeNum}. ` : ''}{item.name}
                                    </td>
                                    <td className="p-3 text-center whitespace-nowrap">
                                      <span className="px-2 py-0.5 rounded bg-green-50 text-green-700 border border-green-100 font-mono text-[10px]">
                                        {item.approved}
                                      </span>
                                    </td>
                                    <td className="p-3 text-center whitespace-nowrap">
                                      <span className="px-2 py-0.5 rounded bg-yellow-50 text-yellow-700 border border-yellow-100 font-mono text-[10px]">
                                        {item.pending}
                                      </span>
                                    </td>
                                    <td className="p-3 text-center font-black text-gray-800 font-mono whitespace-nowrap">{item.total}</td>
                                    <td className="p-3 text-center font-mono text-[10px] whitespace-nowrap">
                                      {approvedKtas.length > 0 ? (
                                        <span className="inline-block px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-150 font-bold">
                                          {approvedKtas[0]} {approvedKtas.length > 1 ? `s/d ${approvedKtas[approvedKtas.length - 1]}` : ''}
                                        </span>
                                      ) : (
                                        <span className="text-gray-300 italic text-[10px]">- Belum ada KTA -</span>
                                      )}
                                    </td>
                                    <td className="p-3 pr-5 text-center whitespace-nowrap">
                                      <div className="flex items-center justify-center gap-1.5">
                                        <button
                                          onClick={() => {
                                            setKtaFilterKwarda(item.name);
                                            setActiveKtaSubTab('summary');
                                          }}
                                          className="px-2.5 py-1 bg-hw-dark hover:bg-black text-white rounded-lg text-[10px] font-extrabold transition-all shadow-2xs cursor-pointer active:scale-95"
                                          title={`Filter tabel utama untuk ${item.name}`}
                                        >
                                          Filter Tabel Utama
                                        </button>
                                        <button
                                          onClick={() => setSelectedKwardaModal(item.name)}
                                          className="px-2.5 py-1 bg-hw-green/10 hover:bg-hw-green text-hw-green hover:text-white rounded-lg text-[10px] font-extrabold transition-all border border-hw-green/20 cursor-pointer active:scale-95"
                                          title={`Lihat daftar anggota ${item.name}`}
                                        >
                                          Detail Anggota ({item.total})
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              )}



              {/* Sub-tab content 4: Template KTA */}
              {activeKtaSubTab === 'template' && (
                <div className="p-6 space-y-6 flex-1 overflow-y-auto">
                  {/* Top Header & Save Bar */}
                  <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <ImageIcon size={18} className="text-hw-green" />
                        <h3 className="text-sm font-black text-gray-800 uppercase tracking-wider font-display">
                          PENGELOLAAN TEMPLATE KTA HW JATENG
                        </h3>
                      </div>
                      <p className="text-xs text-gray-500 font-medium">
                        Atur gambar latar belakang (background) Kartu Tanda Anggota untuk Tampilan Depan dan Tampilan Belakang secara terpisah.
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm('Yakin ingin mereset kedua template ke Master Template Default HW Jateng?')) {
                            setSettings((prev: any) => ({
                              ...prev,
                              ktaTemplateFront: 'https://hwjateng.com/wp-content/uploads/2026/07/depan.png',
                              ktaTemplateBack: 'https://hwjateng.com/wp-content/uploads/2026/07/Belakang.jpg'
                            }));
                          }
                        }}
                        className="px-3.5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-2xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5"
                      >
                        <RotateCcw size={14} />
                        <span>Reset Master Default</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleUpdateSettings()}
                        disabled={isSavingSettings}
                        className="px-5 py-2.5 bg-hw-green hover:bg-emerald-700 text-white rounded-2xl font-black text-xs uppercase tracking-wider transition-all cursor-pointer shadow-md shadow-emerald-800/15 flex items-center gap-2 disabled:opacity-50"
                      >
                        {isSavingSettings ? (
                          <>
                            <Loader2 size={15} className="animate-spin" />
                            <span>Menyimpan...</span>
                          </>
                        ) : (
                          <>
                            <Save size={15} />
                            <span>Simpan Perubahan</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Two Separate Cards Side-by-Side: Depan & Belakang */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* 1. TAMPILAN DEPAN (FRONT TEMPLATE) */}
                    <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm space-y-4 flex flex-col justify-between">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            <h4 className="text-xs font-black text-gray-800 uppercase tracking-wider font-display">
                              1. Tampilan Depan (Front View)
                            </h4>
                          </div>
                          <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-100 text-[10px] font-black uppercase rounded-full">
                            Template Depan
                          </span>
                        </div>

                        {/* Live Preview Front */}
                        <div className="flex justify-center py-3 bg-stone-900 rounded-2xl p-4 border border-stone-800 shadow-inner">
                          <div className="w-full max-w-[340px] aspect-[856/540]">
                            <KTACard 
                              application={{
                                ktaNumber: '11.02.0027',
                                nama: 'Catur Teddy Pamungkas',
                                tempatLahir: 'Banyumas',
                                tanggalLahir: '2012-09-17',
                                asalDaerah: 'Kabupaten Banyumas',
                                tingkatan: 'Pandu Pengenal',
                                alamat: 'Tambaksari Kidul RT 07 RW 03, Kembaran, Banyumas',
                                verifiedAt: '2026-07-13'
                              }} 
                              settings={settings} 
                              side="front" 
                              idSuffix="admin-template-front"
                            />
                          </div>
                        </div>

                        {/* Upload & Controls Front */}
                        <div className="space-y-3 pt-2">
                          <label className="block text-[11px] font-extrabold text-gray-700 uppercase tracking-wider">
                            Upload Gambar Template Depan
                          </label>
                          <div className="flex flex-col sm:flex-row gap-2">
                            <label className="flex-1 px-4 py-2.5 bg-gray-50 border border-dashed border-gray-300 hover:border-hw-green hover:bg-emerald-50/40 rounded-2xl cursor-pointer transition-all flex items-center justify-center gap-2 text-xs font-bold text-gray-600">
                              <Upload size={15} className="text-hw-green" />
                              <span>Pilih File Gambar Depan</span>
                              <input 
                                type="file" 
                                accept="image/*" 
                                onChange={(e) => handleKtaImageUpload(e, 'ktaTemplateFront')} 
                                className="hidden" 
                              />
                            </label>

                            <button
                              type="button"
                              onClick={() => {
                                setSettings(prev => ({
                                  ...prev,
                                  ktaTemplateFront: 'https://hwjateng.com/wp-content/uploads/2026/07/depan.png'
                                }));
                              }}
                              className="px-3.5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-2xl text-[10px] font-bold uppercase transition-all shrink-0 cursor-pointer"
                              title="Gunakan Master Template Depan Default"
                            >
                              Default Depan
                            </button>
                          </div>

                          <div className="space-y-1">
                            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                              URL Gambar / Base64 (Depan)
                            </label>
                            <input
                              type="text"
                              value={settings.ktaTemplateFront || ''}
                              onChange={(e) => setSettings({ ...settings, ktaTemplateFront: e.target.value })}
                              placeholder="https://... atau data:image/..."
                              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-mono text-gray-700 outline-none focus:ring-2 focus:ring-hw-green/20"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 2. TAMPILAN BELAKANG (BACK TEMPLATE) */}
                    <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm space-y-4 flex flex-col justify-between">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-purple-500 animate-pulse"></span>
                            <h4 className="text-xs font-black text-gray-800 uppercase tracking-wider font-display">
                              2. Tampilan Belakang (Back View)
                            </h4>
                          </div>
                          <span className="px-2.5 py-0.5 bg-purple-50 text-purple-700 border border-purple-100 text-[10px] font-black uppercase rounded-full">
                            Template Belakang
                          </span>
                        </div>

                        {/* Live Preview Back */}
                        <div className="flex justify-center py-3 bg-stone-900 rounded-2xl p-4 border border-stone-800 shadow-inner">
                          <div className="w-full max-w-[340px] aspect-[856/540]">
                            <KTACard 
                              application={{
                                ktaNumber: '11.02.0027',
                                nama: 'Catur Teddy Pamungkas'
                              }} 
                              settings={settings} 
                              side="back" 
                              idSuffix="admin-template-back"
                            />
                          </div>
                        </div>

                        {/* Upload & Controls Back */}
                        <div className="space-y-3 pt-2">
                          <label className="block text-[11px] font-extrabold text-gray-700 uppercase tracking-wider">
                            Upload Gambar Template Belakang
                          </label>
                          <div className="flex flex-col sm:flex-row gap-2">
                            <label className="flex-1 px-4 py-2.5 bg-gray-50 border border-dashed border-gray-300 hover:border-purple-500 hover:bg-purple-50/40 rounded-2xl cursor-pointer transition-all flex items-center justify-center gap-2 text-xs font-bold text-gray-600">
                              <Upload size={15} className="text-purple-600" />
                              <span>Pilih File Gambar Belakang</span>
                              <input 
                                type="file" 
                                accept="image/*" 
                                onChange={(e) => handleKtaImageUpload(e, 'ktaTemplateBack')} 
                                className="hidden" 
                              />
                            </label>

                            <button
                              type="button"
                              onClick={() => {
                                setSettings(prev => ({
                                  ...prev,
                                  ktaTemplateBack: 'https://hwjateng.com/wp-content/uploads/2026/07/Belakang.jpg'
                                }));
                              }}
                              className="px-3.5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-2xl text-[10px] font-bold uppercase transition-all shrink-0 cursor-pointer"
                              title="Gunakan Master Template Belakang Default"
                            >
                              Default Belakang
                            </button>
                          </div>

                          <div className="space-y-1">
                            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                              URL Gambar / Base64 (Belakang)
                            </label>
                            <input
                              type="text"
                              value={settings.ktaTemplateBack || ''}
                              onChange={(e) => setSettings({ ...settings, ktaTemplateBack: e.target.value })}
                              placeholder="https://... atau data:image/..."
                              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-mono text-gray-700 outline-none focus:ring-2 focus:ring-purple-500/20"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Guidance Box */}
                  <div className="bg-amber-50/70 border border-amber-200/80 p-4 rounded-3xl text-xs text-amber-900 font-semibold leading-relaxed flex items-start gap-3">
                    <Info size={18} className="text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-extrabold uppercase tracking-wider text-[11px] text-amber-800 mb-0.5">
                        💡 Panduan Dimensi & Format Template:
                      </p>
                      <p className="text-[11px] leading-relaxed">
                        Master Template KTA disarankan memiliki ukuran ideal <strong>1050 x 660 piksel</strong> (rasio ID card standar 856:540). Bagian tengah pada template depan sebaiknya bersih agar tulisan data anggota dapat dibaca dengan jelas. Setelah mengunggah file gambar baru, pastikan untuk menekan tombol <strong>Simpan Perubahan</strong> agar perubahan tersimpan di sistem.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          {/* KELOLA PELATIHAN TAB */}
          {activeTab === 'pelatihan' && (
            <div className="flex flex-col h-full">
              <div className="p-6 border-b border-gray-100 bg-gray-50/50 space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex flex-col gap-1">
                    <h3 className="text-base font-black text-gray-800 uppercase tracking-wider font-display flex items-center gap-2">
                      <span className="p-1.5 bg-hw-green text-white rounded-xl text-xs shadow-xs">🎖️</span>
                      Pengelolaan Pelatihan HW Jateng
                    </h3>
                    <p className="text-xs text-gray-500 font-medium">
                      Kelola data peserta, presensi, penugasan, penilaian, cetak piagam, dan pengaturan jenis pelatihan
                    </p>
                  </div>
                  
                  {/* Stats Counter */}
                  <div className="flex gap-2.5">
                    <div className="px-3.5 py-1.5 bg-yellow-50 text-yellow-700 rounded-2xl border border-yellow-200/80 flex flex-col items-center">
                      <span className="text-[9px] font-black text-yellow-600 uppercase tracking-wider">Menunggu</span>
                      <span className="text-xs font-black">{trainingApps.filter(t => t.status === 'pending').length}</span>
                    </div>
                    <div className="px-3.5 py-1.5 bg-emerald-50 text-emerald-700 rounded-2xl border border-emerald-200/80 flex flex-col items-center">
                      <span className="text-[9px] font-black text-emerald-600 uppercase tracking-wider">Disetujui</span>
                      <span className="text-xs font-black">{trainingApps.filter(t => t.status === 'approved').length}</span>
                    </div>
                    <div className="px-3.5 py-1.5 bg-rose-50 text-rose-700 rounded-2xl border border-rose-200/80 flex flex-col items-center">
                      <span className="text-[9px] font-black text-rose-600 uppercase tracking-wider">Ditolak</span>
                      <span className="text-xs font-black">{trainingApps.filter(t => t.status === 'rejected').length}</span>
                    </div>
                  </div>
                </div>

                {/* 2 UTAMA TAB MENU PELATIHAN */}
                <div className={cn(
                  "grid gap-3 bg-gray-200/70 p-1.5 rounded-3xl border border-gray-200/90 shadow-xs",
                  isPelatihOnly ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2"
                )}>
                  {/* MENU 1: MANAJEMEN PELATIHAN */}
                  <button
                    type="button"
                    onClick={() => setTrainingMainTab('manajemen')}
                    className={cn(
                      "flex items-center gap-3.5 py-3 px-4.5 rounded-2xl font-black text-xs uppercase tracking-wider transition-all duration-200 cursor-pointer text-left",
                      trainingMainTab === 'manajemen'
                        ? "bg-gradient-to-r from-hw-dark to-slate-900 text-white shadow-md shadow-hw-dark/20 scale-[1.01]"
                        : "text-gray-600 hover:text-gray-900 hover:bg-white/60"
                    )}
                  >
                    <div className={cn(
                      "w-9 h-9 rounded-xl flex items-center justify-center text-base shrink-0 transition-all font-black",
                      trainingMainTab === 'manajemen' ? "bg-hw-green text-white shadow-sm" : "bg-gray-300/80 text-gray-600"
                    )}>
                      📊
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-black tracking-wider truncate">Menu 1: Manajemen Pelatihan</span>
                      <span className={cn("text-[10px] font-semibold lowercase tracking-normal truncate opacity-90", trainingMainTab === 'manajemen' ? "text-emerald-300" : "text-gray-500")}>
                        Data Peserta, Presensi, Penugasan, Penilaian & Piagam
                      </span>
                    </div>
                  </button>

                  {/* MENU 2: KELOLA JENIS PELATIHAN (Sembunyikan untuk Pelatih / Jaya Matahari 1) */}
                  {!isPelatihOnly && (
                    <button
                      type="button"
                      onClick={() => setTrainingMainTab('kelola_jenis')}
                      className={cn(
                        "flex items-center gap-3.5 py-3 px-4.5 rounded-2xl font-black text-xs uppercase tracking-wider transition-all duration-200 cursor-pointer text-left",
                        trainingMainTab === 'kelola_jenis'
                          ? "bg-gradient-to-r from-emerald-800 to-teal-900 text-white shadow-md shadow-emerald-800/20 scale-[1.01]"
                          : "text-gray-600 hover:text-gray-900 hover:bg-white/60"
                      )}
                    >
                      <div className={cn(
                        "w-9 h-9 rounded-xl flex items-center justify-center text-base shrink-0 transition-all font-black",
                        trainingMainTab === 'kelola_jenis' ? "bg-amber-400 text-slate-950 shadow-sm" : "bg-gray-300/80 text-gray-600"
                      )}>
                        ⚙️
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-black tracking-wider truncate">Menu 2: Kelola Jenis Pelatihan</span>
                        <span className={cn("text-[10px] font-semibold lowercase tracking-normal truncate opacity-90", trainingMainTab === 'kelola_jenis' ? "text-amber-200" : "text-gray-500")}>
                          Pengaturan kegiatan, lokasi & jadwal pelatihan
                        </span>
                      </div>
                    </button>
                  )}
                </div>
              </div>

              {/* MAIN TAB 1: MANAJEMEN PELATIHAN */}
              {trainingMainTab === 'manajemen' && (
                <div className="space-y-4 p-6 flex-1">
                  {/* GLOBAL FILTER JENIS PELATIHAN */}
                  <div className="bg-gradient-to-r from-emerald-50 via-teal-50/60 to-emerald-100/50 border-2 border-emerald-200/90 p-4 rounded-3xl shadow-2xs space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <label className="text-[11px] font-black text-emerald-950 uppercase tracking-wider flex items-center gap-2">
                        <span className="p-1 bg-emerald-600 text-white rounded-lg text-xs">🏅</span>
                        <span>Filter Jenis & Kegiatan Pelatihan (Filter Utama)</span>
                      </label>
                      <span className="text-[9.5px] font-extrabold text-emerald-800 bg-emerald-100/90 px-2.5 py-0.5 rounded-full border border-emerald-200/80 self-start sm:self-auto">
                        ⚡ Mempengaruhi Semua Data: Peserta, Presensi, Penugasan, Penilaian & Piagam
                      </span>
                    </div>
                    
                    <div className="relative">
                      <select
                        value={trainingFilterActivity || 'Semua'}
                        onChange={(e) => {
                          const val = e.target.value;
                          setTrainingFilterActivity(val);
                          if (val !== 'Semua') {
                            const acts = settings.trainingActivities || [];
                            const selAct = acts.find((a: any) => String(a.id) === val || a.namaKegiatan === val);
                            if (selAct && selAct.jenisPelatihan) {
                              const normalizedProg = selAct.jenisPelatihan.includes('Jati 2') ? 'Jati 2' : selAct.jenisPelatihan.includes('Jari 1') ? 'Jari 1' : 'Jati 1';
                              setSelectedPresensiProg(normalizedProg as any);
                              setSelectedTugasProg(normalizedProg as any);
                              setSelectedGradeProg(normalizedProg as any);
                              setSelectedPiagamProg(normalizedProg as any);
                            }
                          }
                        }}
                        className="w-full bg-white border-2 border-emerald-300/80 text-emerald-950 rounded-2xl py-2.5 px-3.5 font-black text-xs sm:text-sm outline-none focus:ring-2 focus:ring-emerald-400 cursor-pointer shadow-2xs truncate"
                      >
                        <option value="Semua">🌐 SEMUA JENIS & KEGIATAN PELATIHAN (Semua Tempat & Tanggal)</option>
                        {[...(settings.trainingActivities || [])].reverse().map((act: any, idx: number) => {
                          const title = act.namaKegiatan || act.jenisPelatihan || `Kegiatan ${idx + 1}`;
                          const loc = act.lokasiPelatihan || 'Lokasi Belum Ditentukan';
                          const dt = act.tanggalPelatihan || 'Tanggal Belum Ditentukan';
                          return (
                            <option key={act.id || idx} value={act.id || title}>
                              📍 {title} • {loc} (📅 {dt})
                            </option>
                          );
                        })}
                      </select>
                    </div>
                  </div>

                  {/* 5 SUB-TAB NAVIGATION PILLS */}
                  <div className="flex border-b border-gray-150/80 overflow-x-auto scrollbar-none gap-2 px-1 pt-1">
                    {[
                      { id: 'peserta', label: '1. Data Peserta Pelatihan', desc: 'Verifikasi & Biodata', icon: '📋', activeClass: 'border-blue-600 text-blue-700 bg-blue-50 font-black shadow-xs' },
                      { id: 'presensi', label: '2. Presensi', desc: 'Absensi per Materi', icon: '📝', activeClass: 'border-emerald-600 text-emerald-700 bg-emerald-50 font-black shadow-xs' },
                      { id: 'penugasan', label: '3. Penugasan', desc: 'Ulasan Tugas', icon: '📚', activeClass: 'border-amber-500 text-amber-700 bg-amber-50 font-black shadow-xs' },
                      { id: 'penilaian', label: '4. Penilaian & Kelulusan', desc: 'Status Kelulusan', icon: '🎓', activeClass: 'border-purple-600 text-purple-700 bg-purple-50 font-black shadow-xs' },
                      { id: 'piagam', label: '5. Cetak Piagam', desc: 'Unduh Sertifikat', icon: '🏆', activeClass: 'border-rose-500 text-rose-700 bg-rose-50 font-black shadow-xs' },
                    ].map(sub => (
                      <button
                        key={sub.id}
                        onClick={() => setTrainingSubTab(sub.id as any)}
                        className={cn(
                          "flex flex-col items-start px-4 py-2.5 rounded-t-2xl text-xs transition-all border-b-2 font-bold whitespace-nowrap min-w-[160px] text-left cursor-pointer",
                          trainingSubTab === sub.id 
                            ? sub.activeClass
                            : "border-transparent text-gray-400 hover:text-gray-700 hover:bg-gray-50"
                        )}
                      >
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs">{sub.icon}</span>
                          <span className="tracking-tight">{sub.label}</span>
                        </div>
                        <span className="text-[9px] font-bold opacity-75 mt-0.5 tracking-wider uppercase">{sub.desc}</span>
                      </button>
                    ))}
                  </div>

                  {/* SUB-TAB CONTENTS */}
                  <div className="pt-2">
                    {/* 1. DATA PESERTA PELATIHAN SUB-TAB */}
                {trainingSubTab === 'peserta' && (
                  <div className="space-y-4">
                    {/* Search & Filter Bar */}
                    <div className="flex flex-col lg:flex-row gap-3 bg-white p-4 rounded-3xl border border-gray-100 shadow-sm items-stretch lg:items-center">
                      {/* Search Query Input */}
                      <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input 
                          type="text" 
                          placeholder="Cari berdasarkan nama, WhatsApp, asal daerah..." 
                          value={trainingSearchQuery || ''}
                          onChange={(e) => setTrainingSearchQuery(e.target.value)}
                          className="w-full bg-gray-50 border border-gray-150 rounded-2xl py-3 pl-11 pr-10 focus:ring-2 focus:ring-hw-green/20 outline-none text-xs font-bold"
                        />
                        {trainingSearchQuery && (
                          <button
                            type="button"
                            onClick={() => setTrainingSearchQuery('')}
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-hw-green transition-colors cursor-pointer"
                          >
                            <X size={16} />
                          </button>
                        )}
                      </div>

                      {/* Filter Jenis & Kegiatan Pelatihan (Memuat Tempat Pelaksanaan & Tanggal, Terbaru di Atas) */}
                      <div className="relative min-w-[260px] shrink-0">
                        <select
                          value={trainingFilterActivity || 'Semua'}
                          onChange={(e) => setTrainingFilterActivity(e.target.value)}
                          className="w-full bg-emerald-50/70 border border-emerald-200 text-emerald-950 rounded-2xl py-2.5 px-3.5 font-extrabold text-xs outline-none focus:ring-2 focus:ring-emerald-400 cursor-pointer shadow-2xs truncate"
                        >
                          <option value="Semua">🏅 Semua Jenis & Kegiatan Pelatihan</option>
                          {[...(settings.trainingActivities || [])].reverse().map((act: any, idx: number) => {
                            const title = act.namaKegiatan || act.jenisPelatihan || `Kegiatan ${idx + 1}`;
                            const loc = act.lokasiPelatihan || 'Lokasi -';
                            const dt = act.tanggalPelatihan || 'Tanggal -';
                            return (
                              <option key={act.id || idx} value={act.id || title}>
                                {title} • 📍 {loc} (📅 {dt})
                              </option>
                            );
                          })}
                        </select>
                      </div>

                      {/* Filter Status Pendaftaran */}
                      <div className="flex gap-1.5 overflow-x-auto shrink-0">
                        {['Semua', 'pending', 'approved', 'rejected'].map((st) => (
                          <button
                            key={st}
                            onClick={() => setTrainingFilterStatus(st)}
                            className={`px-3.5 py-2 rounded-xl text-xs font-black capitalize whitespace-nowrap transition-all border ${
                              trainingFilterStatus === st 
                              ? 'bg-hw-dark text-white border-hw-dark' 
                              : 'bg-white text-gray-500 border-gray-100 hover:border-gray-200'
                            }`}
                          >
                            {st === 'pending' ? 'Menunggu' : st === 'approved' ? 'Disetujui' : st === 'rejected' ? 'Ditolak' : 'Semua Status'}
                          </button>
                        ))}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2 shrink-0 self-start lg:self-center">
                        <button
                          onClick={exportTrainingParticipantsToExcel}
                          className="px-3.5 py-2.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                          title="Eksport Excel (CSV)"
                        >
                          <FileSpreadsheet size={14} /> Export Excel
                        </button>
                        <button
                          onClick={exportTrainingParticipantsToPDF}
                          className="px-3.5 py-2.5 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                          title="Eksport PDF"
                        >
                          <Download size={14} /> Export PDF
                        </button>
                        <button
                          onClick={() => {
                            setAddParticipantSelectedMemberId('');
                            setAddParticipantSearchQuery('');
                            setAddParticipantMode('select');

                            // Auto-detect training program, location, date, and fee from active activities/settings
                            const activeActs = settings.trainingActivities || [];
                            const firstAct = activeActs.find((a: any) => a.status !== 'Tutup') || activeActs[0];

                            const prefillTraining = firstAct?.namaKegiatan || firstAct?.jenisPelatihan || (settings.trainingTypes || [])[0] || 'Jaya Melati 1';
                            const prefillLocation = firstAct?.lokasiPelatihan || (settings.trainingLocations || [])[0] || 'Pusdiklat HW Jateng';
                            const prefillDate = firstAct?.tanggalPelatihan || (settings.trainingDates || [])[0] || 'Jadwal Reguler';
                            const prefillBiaya = firstAct?.biayaPelatihan || 'Rp 50.000';
                            const prefillRekening = firstAct?.rekeningPembiayaan || 'Bank Syariah Indonesia (BSI) 7307427448 a.n. Kwarwil HW Jateng';

                            setAddParticipantLokasi(prefillLocation);
                            setAddParticipantTanggal(prefillDate);

                            setAddParticipantForm({
                              nama: '', nbm: '', email: '', noWa: '', tempatLahir: '', tanggalLahir: '',
                              jenisKelamin: 'L', asalDaerah: '', qabilah: '', pendidikan: '', photo: '',
                              pelatihanAkanDiikuti: prefillTraining,
                              pelatihGolongan: 'Tunas Athfal',
                              golonganAnggota: 'Pengenal',
                              lokasiPelatihan: prefillLocation,
                              tanggalPelatihan: prefillDate,
                              biayaPelatihan: prefillBiaya,
                              rekeningPembiayaan: prefillRekening,
                              status: 'approved',
                              statusPembayaran: 'Lunas'
                            });

                            setIsAddParticipantModalOpen(true);
                          }}
                          className="px-4 py-2.5 bg-hw-green hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md shadow-hw-green/15 flex items-center gap-1.5 cursor-pointer"
                        >
                          <UserPlus size={14} /> Tambah Peserta
                        </button>
                      </div>
                    </div>

                    {/* Participant Table */}
                    <div className="overflow-x-auto bg-white rounded-3xl border border-gray-100 shadow-sm">
                      <table className="w-full text-left border-collapse min-w-[1100px]">
                        <thead>
                          <tr className="bg-gray-50 border-b border-gray-100 text-[10px] font-black uppercase text-gray-400 tracking-wider">
                            <th className="p-4 pl-6">Foto</th>
                            <th className="p-4">Peserta & Kontak</th>
                            <th className="p-4">Detail Anggota</th>
                            <th className="p-4">Program Pelatihan</th>
                            <th className="p-4">Asal Daerah / Qabilah</th>
                            <th className="p-4">Status</th>
                            <th className="p-4 text-right pr-6">Aksi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 text-xs font-semibold text-gray-700">
                          {paginatedTrainingApps.length === 0 ? (
                            <tr>
                              <td colSpan={7} className="p-12 text-center text-gray-400 font-bold uppercase tracking-wider">
                                Belum ada pendaftaran peserta yang sesuai kriteria
                              </td>
                            </tr>
                          ) : (
                            paginatedTrainingApps.map((app, idx) => {
                              const itemIndex = (trainingPage - 1) * trainingPageSize + idx;
                              const emailKey = String(app.email || '').toLowerCase().trim();
                              const nameKey = String(app.nama || app.namaLengkap || '').toLowerCase().trim();
                              const userIdKey = app.userId ? String(app.userId) : '';

                              const matchMember = userIdKey ? memberLookupMap.get(userIdKey) : (emailKey ? memberLookupMap.get(emailKey) : (nameKey ? memberLookupMap.get(nameKey) : null));
                              const matchKta = userIdKey ? ktaLookupMap.get(userIdKey) : (emailKey ? ktaLookupMap.get(emailKey) : (nameKey ? ktaLookupMap.get(nameKey) : null));

                              const dispTempat = app.tempatLahir || matchMember?.tempatLahir || matchKta?.tempatLahir || (matchMember?.alamat ? cleanTempatLahir(matchMember.alamat) : '') || '';
                              const dispTanggal = app.tanggalLahir || matchMember?.tanggalLahir || matchKta?.tanggalLahir || '';
                              const dispNbm = app.nbm || app.ktaNumber || app.nomorKTA || matchMember?.ktaNumber || matchMember?.nomorKTA || matchMember?.nbm || matchKta?.ktaNumber || matchKta?.nomorKTA || matchKta?.nbm || '-';
                              const dispJkRaw = app.jenisKelamin || matchMember?.jenisKelamin || matchKta?.jenisKelamin || 'L';
                              const dispJk = (dispJkRaw === 'P' || dispJkRaw === 'Perempuan') ? 'Perempuan' : 'Laki-Laki';
                              const dispPhoto = app.photo || matchMember?.photo || matchKta?.photo || '';

                              return (
                                <tr key={app.id} className="hover:bg-gray-50/50 transition-colors">
                                  <td className="p-4 pl-6">
                                    <div className="w-10 h-12 bg-gray-50 rounded-lg overflow-hidden border border-gray-200">
                                      {dispPhoto ? (
                                        <img src={dispPhoto} alt="Foto" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                      ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-50">
                                          <UserIcon size={20} className="text-gray-400" />
                                        </div>
                                      )}
                                    </div>
                                  </td>

                                  <td className="p-4">
                                    <div className="font-extrabold text-sm text-gray-800"><span className="text-gray-400 font-mono text-xs font-bold mr-1.5">{itemIndex + 1}.</span>{app.nama}</div>
                                    <div className="text-[10px] text-gray-400 lowercase">{app.email}</div>
                                    <div className="text-[10px] text-gray-500">Jenis Kelamin: <span className="font-bold">{dispJk}</span></div>
                                    <div className="text-[10px] text-hw-green font-mono flex items-center gap-1 mt-1">
                                      <a 
                                        href={`https://wa.me/${String(app.noWa || '').replace(/[^0-9]/g, '')}`} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="underline font-bold hover:text-emerald-700"
                                      >
                                        WhatsApp: {app.noWa}
                                      </a>
                                    </div>
                                  </td>

                                <td className="p-4">
                                  <div className="font-bold text-gray-800">{app.golonganAnggota || app.tingkatan || 'Golongan Tidak Ada'}</div>
                                  <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">Pelatih Golongan:</div>
                                  <span className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-[9px] font-black uppercase tracking-wider">
                                    {app.pelatihGolongan || 'Tunas Athfal'}
                                  </span>
                                </td>

                                <td className="p-4">
                                  <span className="px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-100 block w-fit">
                                    {app.pelatihanAkanDiikuti}
                                  </span>
                                  {editingScheduleAppId === app.id ? (
                                    <div className="space-y-1.5 mt-2 bg-gray-50 p-2 rounded-xl border border-gray-150 max-w-[200px]">
                                      <div className="space-y-0.5">
                                        <label className="text-[8px] font-black uppercase text-gray-400 tracking-wider">📍 Lokasi</label>
                                        <select
                                          value={editLokasi || ''}
                                          onChange={(e) => setEditLokasi(e.target.value)}
                                          className="w-full text-[10px] p-1 bg-white border border-gray-200 rounded-md outline-none font-bold text-gray-700"
                                        >
                                          <option value="">Belum ditentukan</option>
                                          {(settings.trainingLocations || []).map((loc: string) => (
                                            <option key={loc} value={loc}>{loc}</option>
                                          ))}
                                        </select>
                                      </div>
                                      <div className="space-y-0.5">
                                        <label className="text-[8px] font-black uppercase text-gray-400 tracking-wider">📅 Tanggal</label>
                                        <select
                                          value={editTanggal || ''}
                                          onChange={(e) => setEditTanggal(e.target.value)}
                                          className="w-full text-[10px] p-1 bg-white border border-gray-200 rounded-md outline-none font-bold text-gray-700"
                                        >
                                          <option value="">Belum ditentukan</option>
                                          {(settings.trainingDates || []).map((dt: string) => (
                                            <option key={dt} value={dt}>{dt}</option>
                                          ))}
                                        </select>
                                      </div>
                                      <div className="flex gap-1 mt-1">
                                        <button
                                          onClick={() => handleSaveSchedule(app.id)}
                                          className="px-2 py-1 bg-hw-green text-white text-[9px] font-black rounded hover:bg-emerald-700 uppercase tracking-wider transition-all"
                                        >
                                          Simpan
                                        </button>
                                        <button
                                          onClick={() => setEditingScheduleAppId(null)}
                                          className="px-2 py-1 bg-gray-200 text-gray-700 text-[9px] font-black rounded hover:bg-gray-300 uppercase tracking-wider transition-all"
                                        >
                                          Batal
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <>
                                      {app.lokasiPelatihan ? (
                                        <div className="text-[10px] text-gray-550 font-bold mt-1.5 flex items-center gap-1">
                                          <span>📍</span> <span className="text-gray-700 leading-tight">{app.lokasiPelatihan}</span>
                                        </div>
                                      ) : (
                                        <div className="text-[10px] text-gray-400 italic mt-1.5 flex items-center gap-1">
                                          <span>📍</span> <span className="leading-tight">Lokasi belum diatur</span>
                                        </div>
                                      )}
                                      {app.tanggalPelatihan ? (
                                        <div className="text-[10px] text-gray-550 font-bold flex items-center gap-1 mt-0.5">
                                          <span>📅</span> <span className="text-gray-600 leading-tight">{app.tanggalPelatihan}</span>
                                        </div>
                                      ) : (
                                        <div className="text-[10px] text-gray-400 italic flex items-center gap-1 mt-0.5">
                                          <span>📅</span> <span className="leading-tight">Tanggal belum diatur</span>
                                        </div>
                                      )}
                                      <button 
                                        onClick={() => {
                                          setEditingScheduleAppId(app.id);
                                          setEditLokasi(app.lokasiPelatihan || '');
                                          setEditTanggal(app.tanggalPelatihan || '');
                                        }}
                                        className="text-[8px] text-indigo-600 hover:text-indigo-800 font-extrabold mt-1.5 flex items-center gap-0.5 uppercase tracking-wider hover:underline"
                                      >
                                        ✏️ Edit Jadwal & Lokasi
                                      </button>
                                    </>
                                  )}
                                </td>

                                <td className="p-4">
                                  <div className="font-bold text-gray-850">{app.asalDaerah || '-'}</div>
                                  <div className="text-[10px] text-gray-400 font-bold uppercase mt-0.5">Qabilah: {app.qabilah || '-'}</div>
                                </td>

                                <td className="p-4 space-y-1.5">
                                  {/* Status Verifikasi */}
                                  <div>
                                    <div className="text-[8px] font-black uppercase text-gray-400 tracking-wider mb-0.5">Verifikasi:</div>
                                    {app.status === 'pending' ? (
                                      <span className="inline-flex items-center gap-1 bg-yellow-50 text-yellow-700 px-2 py-0.5 rounded-full text-[9px] font-black border border-yellow-200 uppercase tracking-wider">
                                        Menunggu
                                      </span>
                                    ) : app.status === 'approved' ? (
                                      <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full text-[9px] font-black border border-emerald-200 uppercase tracking-wider">
                                        Disetujui
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-700 px-2 py-0.5 rounded-full text-[9px] font-black border border-rose-200 uppercase tracking-wider">
                                        Ditolak
                                      </span>
                                    )}
                                  </div>

                                  {/* Status Pembayaran (Manual Toggle by Admin) */}
                                  <div>
                                    <div className="text-[8px] font-black uppercase text-gray-400 tracking-wider mb-0.5">Pembayaran:</div>
                                    <button
                                      type="button"
                                      onClick={async () => {
                                        const newStatusPembayaran = app.statusPembayaran === 'Lunas' ? 'Belum Lunas' : 'Lunas';
                                        const updatedApp = { ...app, statusPembayaran: newStatusPembayaran };
                                        setLoading(true);
                                        await sheetsService.saveTrainingApplicationAndSyncMember(updatedApp);
                                        const tApps = await sheetsService.getTrainingApplications();
                                        setTrainingApps(tApps || []);
                                        setLoading(false);
                                      }}
                                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black border transition-all cursor-pointer shadow-2xs hover:scale-105 active:scale-95 ${
                                        app.statusPembayaran === 'Lunas'
                                          ? 'bg-emerald-100/80 text-emerald-800 border-emerald-300 hover:bg-emerald-200'
                                          : 'bg-amber-100/80 text-amber-800 border-amber-300 hover:bg-amber-200'
                                      }`}
                                      title="Klik untuk ubah status Lunas / Belum Lunas"
                                    >
                                      <span>{app.statusPembayaran === 'Lunas' ? '💰 LUNAS' : '⏳ BELUM LUNAS'}</span>
                                    </button>
                                  </div>
                                </td>

                                <td className="p-4 text-right pr-6">
                                  <div className="flex flex-wrap gap-1.5 justify-end">
                                    {/* WhatsApp Tagihan Button */}
                                    {app.noWa && (
                                      <a
                                        href={`https://wa.me/${String(app.noWa || '').replace(/[^0-9]/g, '').replace(/^0/, '62')}?text=${encodeURIComponent(
                                          `Assalamu'alaikum Sdr/i ${app.nama}, konfirmasi tagihan pendaftaran pelatihan ${app.pelatihanAkanDiikuti} HW Jateng.\n\n📍 Lokasi: ${app.lokasiPelatihan || 'Pusdiklat HW Jateng'}\n📅 Tanggal: ${app.tanggalPelatihan || 'Jadwal Reguler'}\n💰 Biaya: ${app.biayaPelatihan || 'Rp 50.000'}\n💳 Status Pembayaran: ${app.statusPembayaran || (app.status === 'approved' ? 'Lunas' : 'Belum Lunas')}\n🏦 Rekening Transfer: ${app.rekeningPembiayaan || 'Bank BSI 7307427448 a.n. Kwarwil HW Jateng'}\n\nMohon informasi/konfirmasi pembayarannya. Terima kasih.`
                                        )}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="px-2 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-lg font-black text-[9px] uppercase tracking-wider transition-all flex items-center gap-1 shrink-0"
                                        title="Kirim Chat WA Tagihan Pembayaran"
                                      >
                                        <MessageCircle size={11} className="text-emerald-600" />
                                        <span>WA Tagihan</span>
                                      </a>
                                    )}
                                    {app.status !== 'approved' && (
                                      <button
                                        onClick={() => handleApproveTraining(app.id)}
                                        className="px-2 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-100 rounded-lg font-black text-[9px] uppercase tracking-wider transition-all hover:scale-105 active:scale-95"
                                      >
                                        Setujui
                                      </button>
                                    )}
                                    {app.status !== 'rejected' && (
                                      <button
                                        onClick={() => handleOpenRejectTraining(app.id)}
                                        className="px-2 py-1 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-100 rounded-lg font-black text-[9px] uppercase tracking-wider transition-all hover:scale-105 active:scale-95"
                                      >
                                        Ditolak
                                      </button>
                                    )}
                                    {app.status !== 'pending' && (
                                      <button
                                        onClick={() => handlePendingTraining(app.id)}
                                        className="px-2 py-1 bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-100 rounded-lg font-black text-[9px] uppercase tracking-wider transition-all hover:scale-105 active:scale-95"
                                      >
                                        Menunggu
                                      </button>
                                    )}
                                    <button
                                      onClick={() => {
                                        setEditingTrainingApp({ ...app });
                                        setIsEditTrainingModalOpen(true);
                                      }}
                                      className="px-2 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-100 rounded-lg font-black text-[9px] uppercase tracking-wider transition-all hover:scale-105 active:scale-95"
                                    >
                                      Edit
                                    </button>
                                    <button
                                      onClick={() => {
                                        alert(`Detail Pendaftaran Pelatihan:\n\nNama Lengkap: ${app.nama}\nEmail: ${app.email}\nWhatsApp: ${app.noWa}\nTempat, Tgl Lahir: ${app.tempatLahir || '-'}, ${app.tanggalLahir || '-'}\nJenis Kelamin: ${app.jenisKelamin === 'L' ? 'Laki-laki' : 'Perempuan'}\nAsal Kabupaten: ${app.asalDaerah || '-'}\nQabilah: ${app.qabilah || '-'}\nGolongan: ${app.golonganAnggota || '-'}\nPelatih Golongan: ${app.pelatihGolongan || '-'}\nPelatihan Yang Diikuti: ${app.pelatihanAkanDiikuti}\nStatus: ${app.status.toUpperCase()}`);
                                      }}
                                      className="px-2 py-1 bg-gray-50 text-gray-550 border border-gray-150 rounded-lg font-black text-[9px] uppercase tracking-wider hover:bg-gray-100"
                                    >
                                      Detail
                                    </button>
                                    <button
                                      onClick={async () => {
                                        if (confirm('Hapus rincian pendaftaran pelatihan ini? Ketika dihapus, data pelatihan akan terhapus namun data anggota KTA tetap aman.')) {
                                          try {
                                            setLoading(true);
                                            await sheetsService.updateTrainingStatus(app.id, 'deleted');
                                            alert('Data pendaftaran pelatihan berhasil dihapus!');
                                            const tApps = await sheetsService.getTrainingApplications();
                                            setTrainingApps(tApps || []);
                                          } catch (err: any) {
                                            alert('Gagal menghapus: ' + err.message);
                                          } finally {
                                            setLoading(false);
                                          }
                                        }
                                      }}
                                      className="p-1 px-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg border border-rose-100 shrink-0 flex items-center justify-center"
                                      title="Hapus Data"
                                    >
                                      <Trash2 size={12} />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Training Participant Pagination Footer */}
                    <div className="p-4 sm:p-5 border-t border-gray-150 flex flex-col sm:flex-row items-center justify-between gap-3 text-gray-500 bg-gray-50/50 rounded-2xl">
                      <div className="flex flex-wrap items-center gap-3 text-xs font-semibold">
                        <span>
                          Menampilkan <strong className="text-gray-800 font-bold">{filteredTrainingAppsList.length > 0 ? (trainingPage - 1) * trainingPageSize + 1 : 0}</strong> - <strong className="text-gray-800 font-bold">{Math.min(trainingPage * trainingPageSize, filteredTrainingAppsList.length)}</strong> dari <strong className="text-gray-800 font-bold">{filteredTrainingAppsList.length}</strong> peserta pelatihan (Total: {trainingApps.length})
                        </span>
                        <div className="flex items-center gap-1.5 ml-2">
                          <span className="text-[11px] text-gray-400">Per hal:</span>
                          <select
                            value={trainingPageSize || 10}
                            onChange={(e) => {
                              setTrainingPageSize(Number(e.target.value));
                              setTrainingPage(1);
                            }}
                            className="bg-white border border-gray-200 rounded-lg px-2 py-1 text-xs font-bold text-gray-700 outline-none"
                          >
                            <option value={10}>10</option>
                            <option value={25}>25</option>
                            <option value={50}>50</option>
                            <option value={100}>100</option>
                          </select>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          disabled={trainingPage <= 1}
                          onClick={() => setTrainingPage(prev => Math.max(1, prev - 1))}
                          className="px-3 py-1.5 rounded-xl text-xs font-black border border-gray-200 bg-white hover:bg-gray-100 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                        >
                          Prev
                        </button>
                        <span className="text-xs font-bold text-gray-600 px-2">
                          Halaman <strong>{trainingPage}</strong> dari <strong>{totalTrainingPages}</strong>
                        </span>
                        <button
                          disabled={trainingPage >= totalTrainingPages}
                          onClick={() => setTrainingPage(prev => Math.min(totalTrainingPages, prev + 1))}
                          className="px-3 py-1.5 rounded-xl text-xs font-black border border-gray-200 bg-white hover:bg-gray-100 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. PRESENSI SUB-TAB */}
                {trainingSubTab === 'presensi' && (
                  <div className="space-y-6">
                    {/* Level Selectors */}
                    <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-3xl border border-gray-100 shadow-sm">
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Pilih Tingkat Pelatihan</span>
                        <div className="flex gap-2">
                          {['Jati 1', 'Jati 2', 'Jari 1'].map((prog) => (
                            <button
                              key={prog}
                              onClick={() => setSelectedPresensiProg(prog as any)}
                              className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all border ${
                                selectedPresensiProg === prog 
                                  ? 'bg-hw-green text-white border-hw-green' 
                                  : 'bg-gray-50 text-gray-500 border-gray-100 hover:bg-gray-100/50'
                              }`}
                            >
                              {prog}
                            </button>
                          ))}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <div className="text-right border-r border-gray-100 pr-4 hidden sm:block">
                          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Jumlah Peserta Disetujui</span>
                          <span className="text-lg font-black text-hw-green">
                            {trainingApps.filter(app => isApprovedParticipant(app) && isMatchTrainingLevel(app, selectedPresensiProg)).length} Orang
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={exportTrainingAttendanceToExcel}
                            className="px-3.5 py-2.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                            title="Eksport Excel (CSV)"
                          >
                            <FileSpreadsheet size={14} /> Export Excel
                          </button>
                          <button
                            onClick={exportTrainingAttendanceToPDF}
                            className="px-3.5 py-2.5 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                            title="Eksport PDF"
                          >
                            <Download size={14} /> Export PDF
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Presensi Grid Table */}
                    {(() => {
                      const targetKey = getNormalizedLevelKey(selectedPresensiProg);
                      const prog = TRAINING_PROGRAMS.find(p => getNormalizedLevelKey(p.id) === targetKey) || TRAINING_PROGRAMS[0];
                      const sessionList = prog ? prog.sessions : [];
                      const sessions = sessionList.map(s => s.id);

                      const sysEmails = ['admin@hwjateng.com', 'materihw@gmail.com', 'medkom@hwjateng.com', 'admin@hw.org'];
                      const enrolled = trainingApps.filter(app => {
                        const name = (app?.nama || app?.namaLengkap || '').trim();
                        const email = (app?.email || '').toLowerCase().trim();
                        if (!name || name === '-' || name.toLowerCase() === 'tanpa nama' || name.includes('@') || sysEmails.includes(email)) return false;
                        return isApprovedParticipant(app) && isMatchTrainingLevel(app, selectedPresensiProg);
                      });

                      return enrolled.length === 0 ? (
                        <div className="bg-white p-12 text-center rounded-3xl border border-gray-100 text-gray-400 font-bold uppercase tracking-wider">
                          Belum ada peserta yang disetujui untuk pelatihan tingkat {selectedPresensiProg} ini.
                        </div>
                      ) : (
                        <div className="overflow-x-auto bg-white rounded-3xl border border-gray-100 shadow-sm">
                          <table className="w-full text-left border-collapse min-w-max">
                            <thead>
                              <tr className="bg-gray-50 border-b border-gray-100 text-[10px] font-black uppercase text-gray-400 tracking-wider">
                                <th className="p-4 pl-6 w-[260px] min-w-[260px] sticky left-0 bg-gray-50 z-20 border-r border-gray-100 shadow-[2px_0_5px_rgba(0,0,0,0.03)]">
                                  Nama Peserta
                                </th>
                                {sessionList.map((s, idx) => (
                                  <th key={s.id || idx} className="p-3 text-center min-w-[130px] max-w-[170px] border-r border-gray-100 last:border-r-0" title={s.title}>
                                    <div className="font-extrabold text-hw-green text-[10px] uppercase tracking-wider">{s.id || `Sesi ${idx + 1}`}</div>
                                    <div className="text-[9px] text-gray-600 font-semibold leading-tight mt-0.5 line-clamp-2">{s.title}</div>
                                  </th>
                                ))}
                                <th className="p-4 pr-6 text-center w-[120px] min-w-[120px] border-l border-gray-100">% Kehadiran</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 text-xs font-semibold text-gray-700">
                              {enrolled.map((app, idx) => {
                                let attObj: Record<string, any> = {};
                                if (app.kehadiran) {
                                  attObj = safeJsonParse<Record<string, any>>(app.kehadiran, {});
                                }

                                const totalSessions = sessions.length;
                                const attendedSessions = sessions.filter(sesi => isSessionPresent(attObj, sesi)).length;
                                const attendancePercentage = totalSessions > 0 
                                  ? Math.round((attendedSessions / totalSessions) * 100) 
                                  : 0;

                                return (
                                  <tr key={app.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="p-4 pl-6 sticky left-0 bg-white z-10 border-r border-gray-100 shadow-[2px_0_5px_rgba(0,0,0,0.03)]">
                                      <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-gray-50 border border-gray-200 overflow-hidden shrink-0">
                                          {app.photo ? (
                                            <img src={app.photo} alt="" className="w-full h-full object-cover" />
                                          ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-50">
                                              <UserIcon size={16} className="text-gray-400" />
                                            </div>
                                          )}
                                        </div>
                                        <div>
                                          <div className="font-extrabold text-gray-800 leading-snug"><span className="text-gray-400 font-mono text-xs font-bold mr-1.5">{idx + 1}.</span>{app.nama}</div>
                                          <div className="text-[9px] text-gray-400 uppercase tracking-tighter">{app.asalDaerah || 'Jawa Tengah'}</div>
                                        </div>
                                      </div>
                                    </td>
                                    
                                    {sessions.map((sesi) => {
                                      const isPresent = isSessionPresent(attObj, sesi);
                                      const rawItem = attObj[sesi];
                                      let statusText = 'Absen';
                                      let statusColor = 'text-gray-300 font-medium';
                                      if (isPresent) {
                                        statusText = 'Hadir';
                                        statusColor = 'text-hw-green font-extrabold';
                                      } else if (typeof rawItem === 'object' && rawItem?.status === 'izin') {
                                        statusText = 'Izin';
                                        statusColor = 'text-blue-500 font-bold';
                                      } else if (typeof rawItem === 'string' && rawItem === 'izin') {
                                        statusText = 'Izin';
                                        statusColor = 'text-blue-500 font-bold';
                                      }

                                      const timestamp = typeof rawItem === 'object' && rawItem?.timestamp ? rawItem.timestamp : null;

                                      return (
                                        <td key={sesi} className="p-3 text-center border-r border-gray-50 last:border-r-0 min-w-[85px]">
                                          <div className="flex flex-col items-center justify-center">
                                            <input 
                                              type="checkbox" 
                                              checked={isPresent}
                                              onChange={(e) => handleUpdateAttendance(app.id, sesi, e.target.checked)}
                                              className="w-5 h-5 rounded-lg border-gray-300 text-hw-green focus:ring-hw-green/20 cursor-pointer accent-hw-green"
                                            />
                                            <span className={`text-[9px] uppercase mt-1 ${statusColor}`}>
                                              {statusText}
                                            </span>
                                            {timestamp && (
                                              <span className="text-[7.5px] text-gray-400 font-mono mt-0.5 max-w-[90px] truncate" title={timestamp}>
                                                {timestamp}
                                              </span>
                                            )}
                                          </div>
                                        </td>
                                      );
                                    })}

                                    <td className="p-4 pr-6 text-center border-l border-gray-100 bg-gray-50/30">
                                      <div className="inline-flex flex-col items-center">
                                        <div className={`text-xs font-black px-2.5 py-1 rounded-full ${
                                          attendancePercentage >= 80 
                                            ? 'bg-emerald-50 text-hw-green' 
                                            : attendancePercentage >= 50 
                                              ? 'bg-amber-50 text-amber-600' 
                                              : 'bg-rose-50 text-rose-600'
                                        }`}>
                                          {attendancePercentage}%
                                        </div>
                                        <span className="text-[9px] font-bold text-gray-400 mt-1 uppercase tracking-tighter">
                                          {attendedSessions} / {totalSessions} Sesi
                                        </span>
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* 3. PENUGASAN SUB-TAB */}
                {trainingSubTab === 'penugasan' && (
                  <div className="space-y-6">
                    {/* Level Selectors */}
                    <div className="flex items-center justify-between bg-white p-4 rounded-3xl border border-gray-100 shadow-sm">
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Pilih Tingkat Pelatihan</span>
                        <div className="flex gap-2">
                          {['Jati 1', 'Jati 2', 'Jari 1'].map((prog) => (
                            <button
                              key={prog}
                              onClick={() => {
                                setSelectedTugasProg(prog as any);
                                setSelectedTugasMateriId('all'); // reset filter when level changes
                              }}
                              className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all border ${
                                selectedTugasProg === prog 
                                  ? 'bg-hw-green text-white border-hw-green' 
                                  : 'bg-gray-50 text-gray-500 border-gray-100 hover:bg-gray-100/50'
                              }`}
                            >
                              {prog}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Task Giving Button Panel */}
                    {(() => {
                      const progCatMap: Record<string, string> = {
                        'Jati 1': 'jati1',
                        'Jati 2': 'jati2',
                        'Jari 1': 'jari1'
                      };
                      const cat = progCatMap[selectedTugasProg] || 'jati1';
                      let categoryMaterials = materiList.filter(m => m.kategori === cat || (cat === 'jati1' && (m.kategori === 'Jati 1' || m.kategori === 'jati 1')));
                      if (cat === 'jati1' && categoryMaterials.length < 36) {
                        categoryMaterials = DEFAULT_JATI1_36_MATERI.map((defM, idx) => {
                          const matched = categoryMaterials.find(m => 
                            m.judul && (
                              m.judul.toLowerCase().includes(`materi ${idx + 1}:`) || 
                              m.judul.toLowerCase().includes(`sesi ${idx + 1}:`) ||
                              m.judul.toLowerCase().trim() === defM.judul.toLowerCase().trim()
                            )
                          );
                          return matched || defM;
                        });
                      }

                      return (
                        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-hw-green/10 flex items-center justify-center text-hw-green">
                              <BookOpen size={18} />
                            </div>
                            <div>
                              <h3 className="text-sm font-black text-gray-800 uppercase tracking-wider">Panel Pemberian Tugas Kurikulum Jaya Melati</h3>
                              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Pilih materi di bawah ini untuk memberikan/mengedit penugasan peserta</p>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                            {categoryMaterials.length === 0 ? (
                              <div className="text-xs text-gray-400 italic p-4 col-span-full border border-dashed border-gray-200 rounded-2xl text-center">
                                Belum ada data materi untuk tingkat {selectedTugasProg}. Silakan tambahkan materi kurikulum terlebih dahulu di menu Kelola Materi.
                              </div>
                            ) : (
                              categoryMaterials.map((mat) => {
                                const assignedTasks = Array.isArray(settings.assignedTasks) ? settings.assignedTasks : [];
                                const activeAssignment = assignedTasks.find(t => t.level === selectedTugasProg && String(t.materiId) === String(mat.id));
                                
                                return (
                                  <button
                                    key={mat.id}
                                    onClick={() => {
                                      setAssigningMateri(mat);
                                      setAssignTaskInstruksi(activeAssignment?.instruksi || '');
                                      setAssignTaskDeadline(activeAssignment?.deadline || '');
                                      setShowAssignTaskModal(true);
                                    }}
                                    className={`flex flex-col text-left p-4 rounded-2xl border transition-all hover:scale-[1.02] active:scale-[0.98] relative ${
                                      activeAssignment 
                                        ? 'bg-emerald-50/50 border-emerald-200 hover:bg-emerald-50' 
                                        : 'bg-gray-50/50 border-gray-150/60 hover:bg-gray-50'
                                    }`}
                                  >
                                    {activeAssignment && (
                                      <span className="absolute top-3 right-3 bg-emerald-500 text-white font-black text-[8px] uppercase tracking-wider px-2 py-0.5 rounded-full">
                                        DIBERIKAN
                                      </span>
                                    )}
                                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Materi Kurikulum</span>
                                    <span className="text-xs font-black text-gray-800 leading-tight pr-12 line-clamp-2">{mat.judul}</span>
                                    {activeAssignment && (
                                      <div className="mt-2 text-[10px] text-emerald-700 font-bold space-y-0.5">
                                        <span className="block truncate">📌 {activeAssignment.instruksi || 'Tanpa instruksi khusus'}</span>
                                        {activeAssignment.deadline && <span className="block text-[9px] text-emerald-600/80">🕒 Batas: {activeAssignment.deadline}</span>}
                                      </div>
                                    )}
                                  </button>
                                );
                              })
                            )}
                          </div>
                        </div>
                      );
                    })()}

                    {/* Filter Penugasan */}
                    {(() => {
                      const progCatMap: Record<string, string> = {
                        'Jati 1': 'jati1',
                        'Jati 2': 'jati2',
                        'Jari 1': 'jari1'
                      };
                      const cat = progCatMap[selectedTugasProg] || 'jati1';
                      let categoryMaterials = materiList.filter(m => m.kategori === cat || (cat === 'jati1' && (m.kategori === 'Jati 1' || m.kategori === 'jati 1')));
                      if (cat === 'jati1' && categoryMaterials.length < 36) {
                        categoryMaterials = DEFAULT_JATI1_36_MATERI.map((defM, idx) => {
                          const matched = categoryMaterials.find(m => 
                            m.judul && (
                              m.judul.toLowerCase().includes(`materi ${idx + 1}:`) || 
                              m.judul.toLowerCase().includes(`sesi ${idx + 1}:`) ||
                              m.judul.toLowerCase().trim() === defM.judul.toLowerCase().trim()
                            )
                          );
                          return matched || defM;
                        });
                      }
                      const sysEmails = ['admin@hwjateng.com', 'materihw@gmail.com', 'medkom@hwjateng.com', 'admin@hw.org'];
                      const enrolled = trainingApps.filter(app => {
                        const name = (app?.nama || app?.namaLengkap || '').trim();
                        const email = (app?.email || '').toLowerCase().trim();
                        if (!name || name === '-' || name.toLowerCase() === 'tanpa nama' || name.includes('@') || sysEmails.includes(email)) return false;
                        return isApprovedParticipant(app) && isMatchTrainingLevel(app, selectedTugasProg);
                      });

                      return enrolled.length === 0 ? (
                        <div className="bg-white p-12 text-center rounded-3xl border border-gray-100 text-gray-400 font-bold uppercase tracking-wider">
                          Belum ada peserta yang disetujui untuk tingkat {selectedTugasProg}.
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {/* Title & Filter Rekap Tugas */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-gray-100 shadow-sm">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-2xl bg-hw-green/10 flex items-center justify-center text-hw-green shrink-0">
                                <FileText size={20} />
                              </div>
                              <div>
                                <h3 className="text-base font-black text-gray-800 uppercase tracking-wider">Rekap Tugas</h3>
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Rekapitulasi pengumpulan tugas peserta tingkat {selectedTugasProg}</p>
                              </div>
                            </div>
                            
                            <div className="flex flex-wrap items-center gap-3">
                              <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-100">
                                <Filter size={14} className="text-gray-400 shrink-0" />
                                <div className="flex flex-col">
                                  <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Filter Materi</span>
                                  <select
                                    value={selectedTugasMateriId || 'all'}
                                    onChange={(e) => setSelectedTugasMateriId(e.target.value)}
                                    className="bg-transparent text-xs font-bold text-gray-700 outline-none cursor-pointer"
                                  >
                                    <option value="all">Semua Penugasan ({categoryMaterials.length})</option>
                                    {categoryMaterials.map(m => (
                                      <option key={m.id} value={m.id}>{m.judul}</option>
                                    ))}
                                  </select>
                                </div>
                              </div>
                              
                              <div className="text-right shrink-0 bg-emerald-50 px-3.5 py-1.5 rounded-xl border border-emerald-100">
                                <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest block">Jumlah Peserta</span>
                                <span className="text-xs font-black text-emerald-800">
                                  {enrolled.length} Orang
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="overflow-x-auto bg-white rounded-3xl border border-gray-100 shadow-sm">
                            <table className="w-full text-left border-collapse min-w-[800px]">
                              <thead>
                                <tr className="bg-gray-50 border-b border-gray-100 text-[10px] font-black uppercase text-gray-400 tracking-wider">
                                  <th className="p-4 pl-6 w-[240px]">Nama Peserta</th>
                                  <th className="p-4">Daftar Penugasan Peserta</th>
                                  <th className="p-4 text-center">Status Evaluasi</th>
                                  <th className="p-4 text-right pr-6">Tindakan</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-50 text-xs font-semibold text-gray-700">
                                {enrolled.map((app, idx) => {
                                  let tasks: any[] = [];
                                  try {
                                    if (app.tugas) {
                                      tasks = typeof app.tugas === 'string' ? JSON.parse(app.tugas) : app.tugas;
                                      if (!Array.isArray(tasks)) tasks = [tasks];
                                    }
                                  } catch (e) {}

                                  const isSpecificMaterial = selectedTugasMateriId !== 'all';
                                  const targetMaterial = categoryMaterials.find(m => String(m.id) === String(selectedTugasMateriId));
                                  const hasSubmittedTarget = isSpecificMaterial && tasks.some(t => String(t.materiId) === String(selectedTugasMateriId));

                                  return (
                                    <tr key={app.id} className="hover:bg-gray-50/50 transition-colors">
                                      <td className="p-4 pl-6">
                                        <div className="flex items-center gap-3">
                                          <div className="w-8 h-8 rounded-lg bg-gray-50 border border-gray-200 overflow-hidden shrink-0">
                                            {app.photo ? (
                                              <img src={app.photo} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                              <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-50">
                                                <UserIcon size={16} className="text-gray-400" />
                                              </div>
                                            )}
                                          </div>
                                          <div>
                                            <div className="font-extrabold text-gray-800 leading-snug"><span className="text-gray-400 font-mono text-xs font-bold mr-1.5">{idx + 1}.</span>{app.nama}</div>
                                            <div className="text-[9px] text-gray-400 uppercase tracking-tighter">{app.asalDaerah || 'Jawa Tengah'}</div>
                                          </div>
                                        </div>
                                      </td>

                                      <td className="p-4">
                                        {isSpecificMaterial ? (
                                          hasSubmittedTarget ? (
                                            <div className="space-y-1 max-w-md">
                                              {tasks.filter(t => String(t.materiId) === String(selectedTugasMateriId)).map((t, idx) => (
                                                <div key={idx} className="flex items-center justify-between p-2 rounded-xl bg-green-50/50 border border-green-100 text-[10px] font-bold">
                                                  <span className="text-emerald-800">✅ {t.title || targetMaterial?.judul}</span>
                                                  {t.link && (
                                                    <a 
                                                      href={t.link} 
                                                      target="_blank" 
                                                      rel="noopener noreferrer" 
                                                      className="text-hw-green hover:underline flex items-center gap-1 shrink-0"
                                                    >
                                                      Lihat Tugas <ArrowUpRight size={10} />
                                                    </a>
                                                  )}
                                                </div>
                                              ))}
                                            </div>
                                          ) : (
                                            <span className="text-rose-500 font-extrabold text-[10px] uppercase tracking-wider bg-rose-50 px-2.5 py-1 rounded-full">
                                              ❌ Belum Mengumpulkan {targetMaterial?.judul}
                                            </span>
                                          )
                                        ) : (
                                          tasks.length === 0 ? (
                                            <span className="text-gray-400 italic text-[11px] font-bold">Belum mengumpulkan tugas</span>
                                          ) : (
                                            <div className="space-y-1 max-w-md">
                                              {tasks.map((t, idx) => (
                                                <div key={idx} className="p-2 rounded-xl bg-gray-50 border border-gray-100 text-[10px] space-y-1">
                                                  <div className="flex items-center justify-between font-bold">
                                                    <div className="flex flex-col">
                                                      <span className="text-gray-750 font-black">{t.title}</span>
                                                      {t.submittedAt && (
                                                        <span className="text-[8px] text-gray-400">Dikirim: {new Date(t.submittedAt).toLocaleDateString('id-ID')}</span>
                                                      )}
                                                    </div>
                                                    {t.link && (
                                                      <a 
                                                        href={t.link} 
                                                        target="_blank" 
                                                        rel="noopener noreferrer" 
                                                        className="text-hw-green hover:underline flex items-center gap-1 shrink-0 font-extrabold"
                                                      >
                                                        Lihat Tugas <ArrowUpRight size={10} />
                                                      </a>
                                                    )}
                                                  </div>
                                                  {(t.pesan || t.message) && (
                                                    <div className="bg-white p-2 rounded-lg border border-gray-200 text-[9.5px] text-gray-600 font-medium italic">
                                                      💬 "{t.pesan || t.message}"
                                                    </div>
                                                  )}
                                                </div>
                                              ))}
                                            </div>
                                          )
                                        )}
                                      </td>

                                      <td className="p-4 text-center">
                                        {app.nilai ? (
                                          <div className="inline-flex flex-col items-center">
                                            <span className="px-2 py-0.5 bg-yellow-50 text-yellow-700 rounded-md text-[10px] font-black border border-yellow-100 uppercase tracking-wider">
                                              Nilai: {app.nilai}
                                            </span>
                                            {app.statusKelulusan && (
                                              <span className={`text-[9px] font-black uppercase mt-1 ${
                                                app.statusKelulusan === 'Lulus' 
                                                  ? 'text-green-600' 
                                                  : app.statusKelulusan === 'Lulus Bersyarat'
                                                    ? 'text-amber-600'
                                                    : 'text-rose-600'
                                              }`}>
                                                ({app.statusKelulusan})
                                              </span>
                                            )}
                                          </div>
                                        ) : (
                                          <span className="text-[10px] text-gray-400 italic font-medium">Belum Dinilai</span>
                                        )}
                                      </td>

                                      <td className="p-4 text-right pr-6">
                                        <button
                                          onClick={() => handleOpenGradingModal(app)}
                                          className="px-3 py-1.5 bg-hw-green text-white rounded-lg hover:bg-emerald-700 font-black text-[10px] uppercase tracking-wider transition-all hover:scale-105 active:scale-95"
                                        >
                                          Beri Nilai
                                        </button>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* 4. PENILAIAN & KELULUSAN SUB-TAB */}
                {trainingSubTab === 'penilaian' && (
                  <div className="space-y-6">
                    {/* Level Selectors */}
                    <div className="flex items-center justify-between bg-white p-4 rounded-3xl border border-gray-100 shadow-sm">
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Pilih Tingkat Pelatihan</span>
                        <div className="flex gap-2">
                          {['Jati 1', 'Jati 2', 'Jari 1'].map((prog) => (
                            <button
                              key={prog}
                              onClick={() => setSelectedGradeProg(prog as any)}
                              className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all border ${
                                selectedGradeProg === prog 
                                  ? 'bg-hw-green text-white border-hw-green' 
                                  : 'bg-gray-50 text-gray-500 border-gray-100 hover:bg-gray-100/50'
                              }`}
                            >
                              {prog}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={exportTrainingGraduationToExcel}
                          className="px-3.5 py-2.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                          title="Eksport Excel (CSV)"
                        >
                          <FileSpreadsheet size={14} /> Export Excel
                        </button>
                        <button
                          onClick={exportTrainingGraduationToPDF}
                          className="px-3.5 py-2.5 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                          title="Eksport PDF"
                        >
                          <Download size={14} /> Export PDF
                        </button>
                      </div>
                    </div>

                    {/* Grading Table */}
                    {(() => {
                      const sysEmails = ['admin@hwjateng.com', 'materihw@gmail.com', 'medkom@hwjateng.com', 'admin@hw.org'];
                      const enrolled = trainingApps.filter(app => {
                        const name = (app?.nama || app?.namaLengkap || '').trim();
                        const email = (app?.email || '').toLowerCase().trim();
                        if (!name || name === '-' || name.toLowerCase() === 'tanpa nama' || name.includes('@') || sysEmails.includes(email)) return false;
                        return isApprovedParticipant(app) && isMatchTrainingLevel(app, selectedGradeProg);
                      });

                      return enrolled.length === 0 ? (
                        <div className="bg-white p-12 text-center rounded-3xl border border-gray-100 text-gray-400 font-bold uppercase tracking-wider">
                          Belum ada peserta yang disetujui untuk tingkat {selectedGradeProg}.
                        </div>
                      ) : (
                        <div className="overflow-x-auto bg-white rounded-3xl border border-gray-100 shadow-sm">
                          <table className="w-full text-left border-collapse min-w-[800px]">
                            <thead>
                              <tr className="bg-gray-50 border-b border-gray-100 text-[10px] font-black uppercase text-gray-400 tracking-wider">
                                <th className="p-4 pl-6">Peserta</th>
                                <th className="p-4">Nilai Akhir (Predikat)</th>
                                <th className="p-4">Status Kelulusan</th>
                                <th className="p-4">Catatan / Ulasan Pelatih</th>
                                <th className="p-4 text-right pr-6">Tindakan</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 text-xs font-semibold text-gray-700">
                              {enrolled.map((app, idx) => {
                                const calc = getCalculatedGrading(app);
                                return (
                                  <tr key={app.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="p-4 pl-6">
                                      <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-gray-55 border border-gray-200 overflow-hidden shrink-0">
                                          {app.photo ? (
                                            <img src={app.photo} alt="" className="w-full h-full object-cover" />
                                          ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-50">
                                              <UserIcon size={16} className="text-gray-400" />
                                            </div>
                                          )}
                                        </div>
                                        <div>
                                          <div className="font-extrabold text-gray-800 leading-snug"><span className="text-gray-400 font-mono text-xs font-bold mr-1.5">{idx + 1}.</span>{app.nama}</div>
                                          <div className="text-[9px] text-gray-400 uppercase tracking-tighter">{app.asalDaerah || 'Jawa Tengah'}</div>
                                        </div>
                                      </div>
                                    </td>

                                    <td className="p-4">
                                      <div className="space-y-1">
                                        <span className="px-2.5 py-1 bg-yellow-50 text-yellow-700 rounded-lg text-xs font-black uppercase border border-yellow-100 inline-block">
                                          {app.nilai || `${calc.finalPercentage}%`}
                                        </span>
                                        <div className="text-[9px] text-gray-400 font-bold uppercase tracking-tight leading-none pt-0.5">
                                          Presensi: {calc.attendancePercentage}% | Tugas: {calc.assignmentPercentage}%
                                        </div>
                                      </div>
                                    </td>

                                    <td className="p-4">
                                      {app.statusKelulusan ? (
                                        <span className={cn(
                                          "px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border",
                                          app.statusKelulusan === 'Lulus' 
                                            ? "bg-green-50 border-green-100 text-green-700" 
                                            : app.statusKelulusan === 'Lulus Bersyarat'
                                              ? "bg-amber-50 border-amber-100 text-amber-700"
                                              : "bg-red-50 border-red-100 text-red-650"
                                        )}>
                                          {app.statusKelulusan}
                                        </span>
                                      ) : (
                                        <div className="space-y-1">
                                          <span className="text-[10px] text-gray-400 italic block">Belum Diproses</span>
                                          <span className={cn(
                                            "px-2 py-0.5 rounded text-[8px] font-extrabold uppercase border inline-block",
                                            calc.calculatedStatus === 'Lulus'
                                              ? "bg-green-50/30 border-green-100/50 text-green-600"
                                              : calc.calculatedStatus === 'Lulus Bersyarat'
                                                ? "bg-amber-50/30 border-amber-100/50 text-amber-650"
                                                : "bg-rose-50/30 border-rose-100/50 text-rose-600"
                                          )}>
                                            Saran: {calc.calculatedStatus}
                                          </span>
                                        </div>
                                      )}
                                    </td>

                                    <td className="p-4">
                                      {app.remark ? (
                                        <p className="text-[11px] text-gray-600 font-bold italic truncate max-w-xs" title={app.remark}>
                                          "{app.remark}"
                                        </p>
                                      ) : (
                                        <span className="text-[10px] text-gray-400">-</span>
                                      )}
                                    </td>

                                    <td className="p-4 text-right pr-6">
                                      <button
                                        onClick={() => handleOpenGradingModal(app)}
                                        className="px-3 py-1.5 bg-hw-green text-white rounded-lg hover:bg-emerald-700 font-black text-[10px] uppercase tracking-wider transition-all hover:scale-105 active:scale-95"
                                      >
                                        Beri Nilai & Kelulusan
                                      </button>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* 5. CETAK PIAGAM SUB-TAB */}
                {trainingSubTab === 'piagam' && (
                  <div className="space-y-6">
                    {/* Level Selectors */}
                    <div className="flex items-center justify-between bg-white p-4 rounded-3xl border border-gray-100 shadow-sm">
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Pilih Tingkat Pelatihan</span>
                        <div className="flex gap-2">
                          {['Jati 1', 'Jati 2', 'Jari 1'].map((prog) => (
                            <button
                              key={prog}
                              onClick={() => setSelectedPiagamProg(prog as any)}
                              className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all border ${
                                selectedPiagamProg === prog 
                                  ? 'bg-hw-green text-white border-hw-green' 
                                  : 'bg-gray-50 text-gray-500 border-gray-100 hover:bg-gray-100/50'
                              }`}
                            >
                              {prog}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={exportValidatedCertificatesToExcel}
                          className="px-3.5 py-2.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                          title="Eksport Excel (CSV)"
                        >
                          <FileSpreadsheet size={14} /> Export Excel
                        </button>
                        <button
                          onClick={exportValidatedCertificatesToPDF}
                          className="px-3.5 py-2.5 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                          title="Eksport PDF"
                        >
                          <Download size={14} /> Export PDF
                        </button>
                      </div>
                    </div>

                    {/* Piagam Table */}
                    {(() => {
                      const sysEmails = ['admin@hwjateng.com', 'materihw@gmail.com', 'medkom@hwjateng.com', 'admin@hw.org'];
                      const graduates = trainingApps.filter(app => {
                        const name = (app?.nama || app?.namaLengkap || '').trim();
                        const email = (app?.email || '').toLowerCase().trim();
                        if (!name || name === '-' || name.toLowerCase() === 'tanpa nama' || name.includes('@') || sysEmails.includes(email)) return false;
                        const isGrad = app.statusKelulusan === 'Lulus' || app.statusKelulusan === 'Lulus Bersyarat' || getCalculatedGrading(app).calculatedStatus !== 'Tidak Lulus';
                        return isApprovedParticipant(app) && isMatchTrainingLevel(app, selectedPiagamProg) && isGrad;
                      });

                      return graduates.length === 0 ? (
                        <div className="bg-white p-12 text-center rounded-3xl border border-gray-100 text-gray-400 font-bold uppercase tracking-wider">
                          Belum ada peserta tingkat {selectedPiagamProg} yang dinyatakan "Lulus" atau "Lulus Bersyarat". Silakan proses penilaian & kelulusan terlebih dahulu pada sub-tab Kelulusan.
                        </div>
                      ) : (
                        <div className="overflow-x-auto bg-white rounded-3xl border border-gray-100 shadow-sm">
                          <table className="w-full text-left border-collapse min-w-[800px]">
                            <thead>
                              <tr className="bg-gray-50 border-b border-gray-100 text-[10px] font-black uppercase text-gray-400 tracking-wider">
                                <th className="p-4 pl-6">Peserta</th>
                                <th className="p-4">Predikat Nilai</th>
                                <th className="p-4">No. Seri Piagam</th>
                                <th className="p-4">Asal Daerah / Qabilah</th>
                                <th className="p-4 text-right pr-6">Piagam Penghargaan</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 text-xs font-semibold text-gray-700">
                              {graduates.map((app, idx) => (
                                <tr key={app.id} className="hover:bg-gray-50/50 transition-colors">
                                  <td className="p-4 pl-6">
                                    <div className="flex items-center gap-3">
                                      <div className="w-8 h-8 rounded-lg bg-gray-50 border border-gray-200 overflow-hidden shrink-0">
                                        {app.photo ? (
                                          <img src={app.photo} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                          <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-50">
                                            <UserIcon size={16} className="text-gray-400" />
                                          </div>
                                        )}
                                      </div>
                                      <div>
                                        <div className="font-extrabold text-gray-800 leading-snug"><span className="text-gray-400 font-mono text-xs font-bold mr-1.5">{idx + 1}.</span>{app.nama}</div>
                                        <div className="text-[9px] text-gray-400 uppercase tracking-tighter">{app.email}</div>
                                      </div>
                                    </div>
                                  </td>

                                  <td className="p-4">
                                    <span className="px-2 py-0.5 bg-yellow-50 text-yellow-700 border border-yellow-100 rounded text-[10px] font-black uppercase">
                                      {app.nilai || 'A'}
                                    </span>
                                  </td>

                                  <td className="p-4 font-mono text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                                    HW-JT/PLT/{new Date().getFullYear()}/{app.id.slice(0, 4).toUpperCase()}
                                  </td>

                                  <td className="p-4">
                                    <div className="font-bold text-gray-800">{app.asalDaerah || '-'}</div>
                                    <div className="text-[9px] text-gray-400 uppercase">Qabilah: {app.qabilah || '-'}</div>
                                  </td>

                                  <td className="p-4 text-right pr-6">
                                    <button
                                      onClick={() => {
                                        setPiagamParticipant(app);
                                        setIsPiagamModalOpen(true);
                                      }}
                                      className="px-4 py-2 bg-hw-green hover:bg-emerald-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 justify-end ml-auto shadow-md shadow-hw-green/10"
                                    >
                                      <Award size={12} /> Lihat & Cetak Piagam
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* MAIN TAB 2: KELOLA JENIS PELATIHAN */}
          {trainingMainTab === 'kelola_jenis' && !isPelatihOnly && (
            <div className="p-6 flex-1 space-y-6">
                    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <h4 className="text-sm font-black text-gray-800 uppercase tracking-wider flex items-center gap-2 font-display">
                          <Settings className="text-hw-green" size={18} /> Kelola Jenis Pelatihan & Kegiatan HW Jateng
                        </h4>
                        <p className="text-xs text-gray-400 font-medium">
                          Kelola jenis pelatihan, daftar kegiatan pelatihan aktif (lokasi & tanggal pelaksanaan), serta opsi pilihan untuk formulir pendaftaran.
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
                        <button
                          type="button"
                          onClick={exportTrainingActivitiesToExcel}
                          className="px-3.5 py-2.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                          title="Eksport Excel (CSV)"
                        >
                          <FileSpreadsheet size={15} /> Export Excel
                        </button>
                        <button
                          type="button"
                          onClick={exportTrainingActivitiesToPDF}
                          className="px-3.5 py-2.5 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                          title="Eksport PDF"
                        >
                          <Download size={15} /> Export PDF
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingActivityId(null);
                            setActivityForm({
                              namaKegiatan: 'Pelatihan Jaya Melati 1/2 HW Jateng',
                              jenisPelatihan: (settings.trainingTypes || [])[0] || 'Jaya Melati 1',
                              lokasiPelatihan: (settings.trainingLocations || [])[0] || '',
                              tanggalPelatihan: (settings.trainingDates || [])[0] || '',
                              status: 'Buka',
                              deskripsi: 'Pelatihan Kepemimpinan Pembina Pandu Hizbul Wathan Jawa Tengah',
                              pelatih: [],
                              asistenPelatih: [],
                              biayaPelatihan: 'Rp 50.000',
                              rekeningPembiayaan: 'Bank Syariah Indonesia (BSI) 7307427448 a.n. Kwarwil HW Jateng',
                              noWhatsappPanitia: '089688754000',
                              proposalUrl: ''
                            });
                            setIsActivityModalOpen(true);
                          }}
                          className="px-4 py-2.5 bg-hw-green hover:bg-emerald-700 text-white rounded-2xl text-xs font-black uppercase tracking-wider transition-all shadow-md shadow-emerald-900/10 flex items-center gap-2 cursor-pointer"
                        >
                          <Plus size={16} /> Tambah Kegiatan Pelatihan
                        </button>
                      </div>
                    </div>

                    {/* DAFTAR KEGIATAN PELATIHAN HW JATENG */}
                    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h5 className="text-xs font-black text-gray-800 uppercase tracking-widest flex items-center gap-2">
                            <span>🗓️</span> Daftar Kegiatan Pelatihan HW Jateng
                          </h5>
                          <p className="text-[10px] text-gray-400 font-medium mt-0.5">
                            Kegiatan ini tampil di halaman depan portal pelatihan dan menentukan opsi waktu & tempat pada formulir pendaftaran.
                          </p>
                        </div>
                        <span className="text-[10px] bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full font-black">
                          {allTrainingActivitiesList.length} Kegiatan
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {allTrainingActivitiesList.length === 0 ? (
                          <div className="col-span-full py-8 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                            <p className="text-xs font-bold text-gray-400">Belum ada Kegiatan Pelatihan terdaftar.</p>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingActivityId(null);
                                setActivityForm({
                                  namaKegiatan: 'Pelatihan Jaya Melati 1/2 HW Jateng',
                                  jenisPelatihan: (settings.trainingTypes || [])[0] || 'Jaya Melati 1',
                                  lokasiPelatihan: (settings.trainingLocations || [])[0] || '',
                                  tanggalPelatihan: (settings.trainingDates || [])[0] || '',
                                  status: 'Buka',
                                  deskripsi: 'Pelatihan Kepemimpinan Pembina Pandu Hizbul Wathan Jawa Tengah',
                                  pelatih: [],
                                  asistenPelatih: [],
                                  biayaPelatihan: 'Rp 50.000',
                                  rekeningPembiayaan: 'Bank Syariah Indonesia (BSI) 7307427448 a.n. Kwarwil HW Jateng',
                                  noWhatsappPanitia: '089688754000',
                                  proposalUrl: ''
                                });
                                setIsActivityModalOpen(true);
                              }}
                              className="mt-2 text-xs text-hw-green font-black underline hover:text-emerald-700 cursor-pointer"
                            >
                              + Buat Kegiatan Pelatihan Pertama
                            </button>
                          </div>
                        ) : (
                          allTrainingActivitiesList.map((act: any, idx: number) => (
                            <div key={act.id || idx} className="p-4 bg-gray-50/80 rounded-2xl border border-gray-100 hover:border-emerald-200 transition-all space-y-3">
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <span className={cn(
                                    "inline-block px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider mb-1",
                                    act.status === 'Buka' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                                  )}>
                                    {act.jenisPelatihan || 'Jaya Melati 1'} • {act.status === 'Buka' ? 'Pendaftaran Buka' : 'Tutup'}
                                  </span>
                                  <h6 className="text-xs font-black text-gray-800 font-display">{act.namaKegiatan}</h6>
                                  {(act.proposalUrl || act.proposal || act.linkProposal) && (
                                    <div className="mt-1.5">
                                      <button
                                        type="button"
                                        onClick={() => handleDownloadDocument(act.proposalUrl || act.proposal || act.linkProposal, act.namaKegiatan)}
                                        className="inline-flex items-center gap-1.5 text-[10px] font-black text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg border border-emerald-200 transition-all cursor-pointer shadow-xs active:scale-95"
                                        title="Unduh Proposal Kegiatan"
                                      >
                                        <FileText size={12} /> Unduh Proposal
                                      </button>
                                    </div>
                                  )}
                                </div>
                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingActivityId(act.id || String(idx));
                                      setActivityForm({
                                        namaKegiatan: act.namaKegiatan || '',
                                        jenisPelatihan: act.jenisPelatihan || 'Jaya Melati 1',
                                        lokasiPelatihan: act.lokasiPelatihan || '',
                                        tanggalPelatihan: act.tanggalPelatihan || '',
                                        status: act.status || 'Buka',
                                        deskripsi: act.deskripsi || '',
                                        pelatih: Array.isArray(act.pelatih)
                                          ? act.pelatih
                                          : (typeof act.pelatih === 'string' && act.pelatih.trim() ? act.pelatih.split(',').map((s: string) => s.trim()) : []),
                                        asistenPelatih: Array.isArray(act.asistenPelatih)
                                          ? act.asistenPelatih
                                          : (typeof act.asistenPelatih === 'string' && act.asistenPelatih.trim() ? act.asistenPelatih.split(',').map((s: string) => s.trim()) : []),
                                        biayaPelatihan: act.biayaPelatihan || 'Rp 50.000',
                                        rekeningPembiayaan: act.rekeningPembiayaan || 'Bank Syariah Indonesia (BSI) 7307427448 a.n. Kwarwil HW Jateng',
                                        noWhatsappPanitia: act.noWhatsappPanitia || '089688754000',
                                        proposalUrl: act.proposalUrl || act.proposal || act.linkProposal || ''
                                      });
                                      setIsActivityModalOpen(true);
                                    }}
                                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                                    title="Edit Kegiatan"
                                  >
                                    <Pencil size={14} />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={async () => {
                                      if (confirm(`Hapus kegiatan "${act.namaKegiatan}"?`)) {
                                        const filtered = (settings.trainingActivities || []).filter((_: any, i: number) => i !== idx && _.id !== act.id);
                                        const updatedSettings = { ...settings, trainingActivities: filtered };
                                        setSettings(updatedSettings);
                                        try {
                                          setLoading(true);
                                          await sheetsService.saveSettings(updatedSettings);
                                          await sheetsService.deleteActivity(act.id || '', act.namaKegiatan || act.title || act.jenisPelatihan);
                                          alert('Kegiatan berhasil dihapus dari cloud!');
                                        } catch (e: any) {
                                          alert('Gagal menghapus kegiatan: ' + e.message);
                                        } finally {
                                          setLoading(false);
                                        }
                                      }
                                    }}
                                    className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                    title="Hapus"
                                  >
                                    <X size={14} />
                                  </button>
                                </div>
                              </div>

                              <div className="space-y-1 text-[11px] text-gray-600">
                                <p className="flex items-center gap-1.5 font-semibold">
                                  <span className="text-gray-400">📍 Tempat:</span>
                                  <strong className="text-gray-800">{act.lokasiPelatihan || '-'}</strong>
                                </p>
                                <p className="flex items-center gap-1.5 font-semibold">
                                  <span className="text-gray-400">📅 Tanggal:</span>
                                  <strong className="text-gray-800">{act.tanggalPelatihan || '-'}</strong>
                                </p>
                                <p className="flex items-center gap-1.5 font-semibold">
                                  <span className="text-gray-400">👨‍🏫 Pelatih:</span>
                                  <strong className="text-emerald-800 font-black">
                                    {Array.isArray(act.pelatih) ? (act.pelatih.length > 0 ? act.pelatih.join(', ') : '-') : (act.pelatih || '-')}
                                  </strong>
                                </p>
                                <p className="flex items-center gap-1.5 font-semibold">
                                  <span className="text-gray-400">🤝 Asisten Pelatih:</span>
                                  <strong className="text-blue-800 font-black">
                                    {Array.isArray(act.asistenPelatih) ? (act.asistenPelatih.length > 0 ? act.asistenPelatih.join(', ') : '-') : (act.asistenPelatih || '-')}
                                  </strong>
                                </p>
                                <p className="flex items-center gap-1.5 font-semibold">
                                  <span className="text-gray-400">💰 Biaya:</span>
                                  <strong className="text-emerald-700">{act.biayaPelatihan || 'Rp 50.000'}</strong>
                                </p>
                                <p className="flex items-center gap-1.5 font-semibold">
                                  <span className="text-gray-400">🏦 Rekening:</span>
                                  <strong className="text-gray-800">{act.rekeningPembiayaan || 'Bank BSI 7307427448 a.n. Kwarwil HW Jateng'}</strong>
                                </p>
                                <p className="flex items-center gap-1.5 font-semibold">
                                  <span className="text-gray-400">📱 WA Panitia:</span>
                                  <strong className="text-gray-800">{act.noWhatsappPanitia || '089688754000'}</strong>
                                </p>
                                {act.deskripsi && (
                                  <p className="text-[10px] text-gray-500 italic pt-1 border-t border-gray-100">
                                    "{act.deskripsi}"
                                  </p>
                                )}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-6">
                      {/* JENIS PELATIHAN CARD */}
                      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
                        <div className="flex items-center justify-between">
                          <h5 className="text-xs font-black text-gray-800 uppercase tracking-widest">
                            🏅 Jenis Pelatihan
                          </h5>
                          <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full font-black">
                            {(settings.trainingTypes || []).length} Jenis
                          </span>
                        </div>

                        <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                          {(settings.trainingTypes || []).length === 0 ? (
                            <p className="text-xs font-bold text-gray-400 py-6 text-center">
                              Belum ada jenis pelatihan.
                            </p>
                          ) : (
                            (settings.trainingTypes || []).map((typ, idx) => (
                              <div key={idx} className="flex items-center justify-between p-2.5 bg-gray-50 rounded-2xl border border-gray-100">
                                <span className="text-xs font-bold text-gray-750">{typ}</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const filtered = (settings.trainingTypes || []).filter((_, i) => i !== idx);
                                    setSettings(prev => ({ ...prev, trainingTypes: filtered }));
                                  }}
                                  className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                >
                                  <X size={14} />
                                </button>
                              </div>
                            ))
                          )}
                        </div>

                        <div className="pt-2 border-t border-gray-100 flex gap-2 max-w-md">
                          <input
                            type="text"
                            placeholder="Contoh: Jaya Melati 3..."
                            value={newTypeInput || ''}
                            onChange={(e) => setNewTypeInput(e.target.value)}
                            className="flex-1 bg-gray-50 border border-gray-150 rounded-xl px-3 py-2 font-bold text-xs outline-none focus:ring-4 focus:ring-hw-green/10 text-gray-700"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              if (!newTypeInput.trim()) return;
                              if ((settings.trainingTypes || []).includes(newTypeInput.trim())) {
                                alert('Jenis pelatihan sudah terdaftar.');
                                return;
                              }
                              setSettings(prev => ({
                                ...prev,
                                trainingTypes: [...(prev.trainingTypes || []), newTypeInput.trim()]
                              }));
                              setNewTypeInput('');
                            }}
                            className="px-3 py-2 bg-hw-green hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer"
                          >
                            Tambah
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* SAVE BUTTON */}
                    <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm flex justify-end">
                      <button
                        type="button"
                        onClick={() => handleUpdateSettings()}
                        disabled={isSavingSettings}
                        className="px-6 py-3 bg-hw-green hover:bg-emerald-700 text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-md shadow-hw-green/10 flex items-center gap-2 cursor-pointer"
                      >
                        {isSavingSettings ? 'Menyimpan...' : 'Simpan Semua Pengaturan Pelatihan'}
                      </button>
                    </div>
                  </div>
                )}
            </div>
          )}

          {/* KEGIATAN TAB */}
          {activeTab === 'kegiatan' && (
            <div className="p-6 md:p-8 space-y-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-r from-hw-dark to-slate-900 p-6 rounded-3xl text-white">
                <div>
                  <div className="flex items-center gap-2">
                    <Calendar className="text-emerald-400" size={20} />
                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Resmi HW Jateng</span>
                  </div>
                  <h3 className="text-lg font-black font-display mt-0.5">Manajemen Kegiatan HW Jateng</h3>
                  <p className="text-xs text-slate-300">Input dan kelola agenda kegiatan kepanduan wilayah Jawa Tengah</p>
                </div>

                <button
                  onClick={() => handleOpenActivityModal()}
                  className="px-5 py-3 bg-hw-green hover:bg-emerald-700 text-white rounded-2xl text-xs font-black uppercase tracking-wider transition-all shadow-lg shadow-hw-green/20 flex items-center gap-2 cursor-pointer"
                >
                  <Plus size={16} /> Tambah Kegiatan Baru
                </button>
              </div>

              {/* Sub-tab Navigation */}
              <div className="flex border-b border-gray-100 gap-6 text-xs font-black">
                <button
                  onClick={() => setActivitySubTab('kegiatan')}
                  className={`pb-3 transition-colors cursor-pointer border-b-2 ${
                    activitySubTab === 'kegiatan' ? 'border-hw-green text-hw-green' : 'border-transparent text-gray-400 hover:text-gray-600'
                  }`}
                >
                  Daftar Kegiatan ({activitiesList.filter(a => !isOnlyTrainingActivity(a)).length})
                </button>
                <button
                  onClick={() => setActivitySubTab('jenis')}
                  className={`pb-3 transition-colors cursor-pointer border-b-2 ${
                    activitySubTab === 'jenis' ? 'border-hw-green text-hw-green' : 'border-transparent text-gray-400 hover:text-gray-600'
                  }`}
                >
                  Jenis Kegiatan ({activityCategoriesList.length})
                </button>
                <button
                  onClick={() => setActivitySubTab('peserta')}
                  className={`pb-3 transition-colors cursor-pointer border-b-2 ${
                    activitySubTab === 'peserta' ? 'border-hw-green text-hw-green' : 'border-transparent text-gray-400 hover:text-gray-600'
                  }`}
                >
                  Peserta Terdaftar ({activityApplicationsList.length})
                </button>
              </div>

              {/* SUB TAB: JENIS KEGIATAN */}
              {activitySubTab === 'jenis' && (
                <div className="space-y-6">
                  <div className="bg-white p-6 rounded-3xl border border-gray-150 shadow-xs space-y-4">
                    <h4 className="text-sm font-extrabold text-gray-800">Tambah Jenis / Kategori Kegiatan Baru</h4>
                    <p className="text-xs text-gray-500">
                      Jenis kegiatan ini tersimpan secara permanen di Cloud Firestore dan langsung tersedia di seluruh perangkat.
                    </p>
                    <div className="flex gap-2 max-w-md">
                      <input
                        type="text"
                        value={newCategoryInput || ''}
                        onChange={(e) => setNewCategoryInput(e.target.value)}
                        placeholder="Contoh: Rapat HW, Bakti Sosial, Lomba,..."
                        className="flex-1 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-xs font-bold text-gray-800 outline-none focus:ring-2 focus:ring-hw-green/20 focus:border-hw-green"
                      />
                      <button
                        type="button"
                        onClick={async () => {
                          if (!newCategoryInput.trim()) return;
                          await sheetsService.saveActivityCategory(newCategoryInput.trim());
                          setNewCategoryInput('');
                        }}
                        className="px-5 py-3 bg-hw-green hover:bg-emerald-700 text-white font-extrabold text-xs rounded-2xl transition-all shadow-md shadow-hw-green/20 flex items-center gap-1.5 cursor-pointer shrink-0"
                      >
                        <Plus size={16} /> Tambah
                      </button>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-3xl border border-gray-150 shadow-xs space-y-4">
                    <h4 className="text-sm font-extrabold text-gray-800">Daftar Jenis Kegiatan Terdaftar ({activityCategoriesList.length})</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {activityCategoriesList.map((cat, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3.5 bg-gray-50 rounded-2xl border border-gray-200">
                          <span className="text-xs font-black text-gray-800">{cat}</span>
                          <button
                            type="button"
                            onClick={async () => {
                              if (window.confirm(`Hapus jenis kegiatan "${cat}"?`)) {
                                await sheetsService.deleteActivityCategory(cat);
                              }
                            }}
                            className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                            title="Hapus jenis kegiatan"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* SUB TAB 1: DAFTAR KEGIATAN */}
              {activitySubTab === 'kegiatan' && (
                <div>
                  {activitiesList.filter(a => !isOnlyTrainingActivity(a)).length === 0 ? (
                    <div className="py-12 text-center text-gray-400 space-y-3 bg-gray-50/50 rounded-3xl border border-dashed border-gray-200">
                      <Calendar size={40} className="mx-auto text-gray-300" />
                      <p className="text-xs font-bold">Belum ada kegiatan yang diinputkan.</p>
                      <button
                        onClick={() => handleOpenActivityModal()}
                        className="px-4 py-2 bg-hw-green text-white rounded-xl text-xs font-bold"
                      >
                        + Tambah Kegiatan Pertama
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {activitiesList.filter(a => !isOnlyTrainingActivity(a)).map((act) => (
                        <div key={act.id} className="bg-white rounded-3xl border border-gray-150 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
                          <div>
                            <div className="relative h-40 bg-gray-100 overflow-hidden">
                              <img src={getCorsSafeUrl(act.gambarUrl, act.updatedAt || act.id) || 'https://images.unsplash.com/photo-1510312305653-8ed496efae75?auto=format&fit=crop&q=80&w=800'} alt={act.namaKegiatan} className="w-full h-full object-cover" />
                              <div className="absolute top-3 left-3 bg-hw-dark/80 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full">
                                {act.kategori}
                              </div>
                              <span className={`absolute top-3 right-3 text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full ${
                                act.status === 'Tutup' ? 'bg-rose-500 text-white' : 'bg-emerald-500 text-white'
                              }`}>
                                {act.status || 'Buka'}
                              </span>
                            </div>

                            <div className="p-5 space-y-3">
                              <div>
                                <h4 className="font-display font-black text-sm text-gray-900 leading-snug">{act.namaKegiatan}</h4>
                                <p className="text-xs text-gray-500 line-clamp-2 mt-1">{act.deskripsi}</p>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-bold text-gray-600 bg-gray-50 p-3 rounded-2xl border border-gray-100">
                                <div className="break-words leading-snug">📅 {act.tanggal}</div>
                                <div className="break-words leading-snug">📍 {act.lokasi}</div>
                                <div className="break-words leading-snug">💰 {act.biaya || 'Gratis'}</div>
                                <div className="break-words leading-snug">👥 {act.kuota || 'Terbuka'}</div>
                              </div>
                            </div>
                          </div>

                          <div className="p-4 bg-gray-50 border-t border-gray-100 flex flex-wrap items-center justify-between gap-2">
                            <button
                              onClick={() => {
                                setSelectedActivityForParticipants(act.id);
                                setActivitySubTab('peserta');
                              }}
                              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                              title="Lihat pendaftar kegiatan ini"
                            >
                              <Users size={14} /> Cek Peserta ({activityParticipantCountMap[act.id] || 0})
                            </button>
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => handleOpenActivityModal(act)}
                                className="px-3 py-2 bg-white border border-gray-200 text-gray-700 hover:bg-gray-100 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer"
                              >
                                <Edit size={14} /> Edit
                              </button>
                              <button
                                onClick={() => handleDeleteActivity(act.id, act.namaKegiatan || act.title || act.jenisPelatihan)}
                                className="px-3 py-2 bg-rose-50 border border-rose-100 text-rose-600 hover:bg-rose-100 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer"
                              >
                                <Trash2 size={14} /> Hapus
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* SUB TAB 2: PESERTA TERDAFTAR / DAFTAR HADIR */}
              {activitySubTab === 'peserta' && (
                <div className="space-y-4">
                  {/* Filter & Export Action Bar - Fully Responsive for Mobile, iPad, Laptop, PC */}
                  <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 flex-1 min-w-0">
                      <span className="text-xs font-black text-gray-500 uppercase tracking-wider shrink-0">Pilih Kegiatan:</span>
                      <select
                        value={selectedActivityForParticipants || 'semua'}
                        onChange={(e) => setSelectedActivityForParticipants(e.target.value)}
                        className="bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-800 outline-none w-full sm:w-auto focus:ring-2 focus:ring-hw-green/20"
                      >
                        <option value="semua">Semua Kegiatan ({activityApplicationsList.length} Peserta)</option>
                        {activitiesList.map(a => (
                          <option key={a.id} value={a.id}>{a.namaKegiatan}</option>
                        ))}
                      </select>
                    </div>

                    {/* Export & Action Buttons */}
                    <div className="grid grid-cols-2 sm:flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => setIsAddParticipantModalOpen(true)}
                        className="col-span-2 sm:col-span-1 px-3.5 py-2.5 bg-hw-green hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-all active:scale-95 cursor-pointer"
                        title="Tambah / Mendaftar Peserta Baru Manual"
                      >
                        <UserPlus size={15} />
                        <span>+ Mendaftar Peserta</span>
                      </button>
                      <button
                        onClick={exportActivityParticipantsToExcel}
                        className="px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-all active:scale-95 cursor-pointer"
                        title="Export Daftar Hadir ke Excel (CSV)"
                      >
                        <FileSpreadsheet size={15} />
                        <span>Export Excel</span>
                      </button>
                      <button
                        onClick={exportActivityParticipantsToPDF}
                        className="px-3.5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-all active:scale-95 cursor-pointer"
                        title="Export Daftar Hadir ke PDF"
                      >
                        <FileText size={15} />
                        <span>Export PDF</span>
                      </button>
                    </div>
                  </div>

                  {/* Responsive Container */}
                  <div className="bg-white rounded-3xl border border-gray-150 overflow-hidden shadow-xs">
                    {/* 1. Mobile Card View (Visible on small screens) */}
                    <div className="block md:hidden divide-y divide-gray-100">
                      {paginatedActivityApps.map((app, index) => {
                        const itemIndex = (activityPage - 1) * activityPageSize + index;
                        return (
                          <div key={app.id || index} className="p-4 space-y-2 hover:bg-gray-50/80 transition-colors">
                            <div className="flex items-start justify-between gap-2">
                              <div className="space-y-0.5">
                                <span className="text-[10px] font-black text-emerald-700 uppercase tracking-wider block">#{itemIndex + 1} • {app.namaKegiatan || 'Kegiatan HW'}</span>
                                <h4 className="text-sm font-black text-gray-900">{app.namaLengkap}</h4>
                              </div>
                              <span className="text-[10px] text-gray-400 font-mono shrink-0">
                                {app.tanggalDaftar ? new Date(app.tanggalDaftar).toLocaleDateString('id-ID') : '-'}
                              </span>
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-gray-100">
                              <div>
                                <span className="text-[9px] font-bold text-gray-400 uppercase block">Unsur / Utusan</span>
                                <p className="font-bold text-gray-800">{app.unsur || app.asalKwarda || '-'}</p>
                                {(app.utusan || app.qabilahPtma) && (
                                  <p className="text-[10px] text-emerald-700 font-bold">{app.utusan || app.qabilahPtma}</p>
                                )}
                              </div>

                              <div>
                                <span className="text-[9px] font-bold text-gray-400 uppercase block">Jabatan</span>
                                <p className="font-bold text-gray-800">{app.jabatan || '-'}</p>
                                {app.kategoriUndangan && app.kategoriUndangan !== 'Tidak Ada / Umum' && (
                                  <span className="inline-block text-[9px] bg-emerald-50 text-emerald-800 px-1.5 py-0.5 rounded-md font-extrabold border border-emerald-200 mt-0.5">
                                    {app.kategoriUndangan}
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="pt-2 flex items-center justify-between text-xs border-t border-gray-100">
                              <span className="font-mono font-bold text-gray-900">{app.noHp || '-'}</span>
                              <div className="flex items-center gap-1.5">
                                <button
                                  onClick={() => handleOpenEditActivityParticipantModal(app)}
                                  className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                                >
                                  <Edit size={12} /> Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteActivityParticipant(app.id)}
                                  className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                                >
                                  <Trash2 size={12} /> Hapus
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}

                      {displayedActivityApplications.length === 0 && (
                        <div className="p-8 text-center text-gray-400 font-bold text-xs">
                          Belum ada pendaftar kegiatan.
                        </div>
                      )}
                    </div>

                    {/* 2. Desktop, Laptop, PC & iPad Table View */}
                    <div className="hidden md:block overflow-x-auto">
                      <table className="w-full text-left text-xs min-w-[700px]">
                        <thead className="bg-gray-50 text-gray-500 uppercase font-black text-[10px] tracking-wider border-b border-gray-100">
                          <tr>
                            <th className="p-4 w-12 text-center">No</th>
                            <th className="p-4">Peserta</th>
                            <th className="p-4">Kegiatan</th>
                            <th className="p-4">Unsur / Utusan</th>
                            <th className="p-4">Jabatan & Undangan</th>
                            <th className="p-4">No. HP / WA</th>
                            <th className="p-4">Tgl Daftar</th>
                            <th className="p-4 text-center">Aksi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {paginatedActivityApps.map((app, index) => {
                            const itemIndex = (activityPage - 1) * activityPageSize + index;
                            return (
                              <tr key={app.id || index} className="hover:bg-gray-50/80 transition-colors">
                                <td className="p-4 font-bold text-gray-400 text-center text-[11px]">
                                  {itemIndex + 1}
                                </td>
                                <td className="p-4 font-bold text-gray-900">
                                  {app.namaLengkap}
                                </td>
                                <td className="p-4 font-bold text-hw-green">
                                  {app.namaKegiatan || 'Kegiatan HW'}
                                </td>
                                <td className="p-4 text-xs font-semibold text-gray-700">
                                  <div>{app.unsur || app.asalKwarda || '-'}</div>
                                  {(app.utusan || app.qabilahPtma) && (
                                    <div className="text-[10px] text-emerald-700 font-bold">{app.utusan || app.qabilahPtma}</div>
                                  )}
                                </td>
                                <td className="p-4 text-xs text-gray-600">
                                  <div className="font-bold text-gray-800">{app.jabatan || '-'}</div>
                                  {app.kategoriUndangan && app.kategoriUndangan !== 'Tidak Ada / Umum' && (
                                    <span className="inline-block mt-0.5 text-[9px] bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-md font-extrabold border border-emerald-200">
                                      {app.kategoriUndangan}
                                    </span>
                                  )}
                                </td>
                                <td className="p-4 font-mono font-bold text-gray-800">
                                  {app.noHp || '-'}
                                </td>
                                <td className="p-4 text-gray-400 text-[11px]">
                                  {app.tanggalDaftar ? new Date(app.tanggalDaftar).toLocaleDateString('id-ID') : '-'}
                                </td>
                                <td className="p-4 text-center">
                                  <div className="flex items-center justify-center gap-1.5">
                                    <button
                                      onClick={() => handleOpenEditActivityParticipantModal(app)}
                                      className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                                      title="Edit Data Peserta"
                                    >
                                      <Edit size={13} /> Edit
                                    </button>
                                    <button
                                      onClick={() => handleDeleteActivityParticipant(app.id)}
                                      className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                                      title="Hapus Data Peserta"
                                    >
                                      <Trash2 size={13} /> Hapus
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                          {displayedActivityApplications.length === 0 && (
                            <tr>
                              <td colSpan={8} className="p-8 text-center text-gray-400 font-bold">
                                Belum ada pendaftar kegiatan.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Activity Participant Pagination Footer */}
                    <div className="p-4 sm:p-5 border-t border-gray-150 flex flex-col sm:flex-row items-center justify-between gap-3 text-gray-500 bg-gray-50/50 rounded-b-3xl">
                      <div className="flex flex-wrap items-center gap-3 text-xs font-semibold">
                        <span>
                          Menampilkan <strong className="text-gray-800 font-bold">{displayedActivityApplications.length > 0 ? (activityPage - 1) * activityPageSize + 1 : 0}</strong> - <strong className="text-gray-800 font-bold">{Math.min(activityPage * activityPageSize, displayedActivityApplications.length)}</strong> dari <strong className="text-gray-800 font-bold">{displayedActivityApplications.length}</strong> pendaftar
                        </span>
                        <div className="flex items-center gap-1.5 ml-2">
                          <span className="text-[11px] text-gray-400">Per hal:</span>
                          <select
                            value={activityPageSize || 10}
                            onChange={(e) => {
                              setActivityPageSize(Number(e.target.value));
                              setActivityPage(1);
                            }}
                            className="bg-white border border-gray-200 rounded-lg px-2 py-1 text-xs font-bold text-gray-700 outline-none"
                          >
                            <option value={10}>10</option>
                            <option value={25}>25</option>
                            <option value={50}>50</option>
                            <option value={100}>100</option>
                          </select>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          disabled={activityPage <= 1}
                          onClick={() => setActivityPage(prev => Math.max(1, prev - 1))}
                          className="px-3 py-1.5 rounded-xl text-xs font-black border border-gray-200 bg-white hover:bg-gray-100 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                        >
                          Prev
                        </button>
                        <span className="text-xs font-bold text-gray-600 px-2">
                          Halaman <strong>{activityPage}</strong> dari <strong>{totalActivityPages}</strong>
                        </span>
                        <button
                          disabled={activityPage >= totalActivityPages}
                          onClick={() => setActivityPage(prev => Math.min(totalActivityPages, prev + 1))}
                          className="px-3 py-1.5 rounded-xl text-xs font-black border border-gray-200 bg-white hover:bg-gray-100 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ACTIVITY FORM MODAL */}
          <AnimatePresence>
            {isKegiatanModalOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-white rounded-[2.5rem] border border-gray-100 shadow-2xl max-w-lg w-full overflow-hidden max-h-[90vh] flex flex-col"
                >
                  <div className="p-5 bg-hw-dark text-white flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400">Pusat Data Kegiatan</span>
                      <h3 className="text-sm font-black font-display">{editingKegiatan ? 'Edit Kegiatan' : 'Tambah Kegiatan Baru'}</h3>
                    </div>
                    <button onClick={() => setIsKegiatanModalOpen(false)} className="p-2 text-white/70 hover:text-white rounded-full cursor-pointer">
                      <X size={18} />
                    </button>
                  </div>

                  <form onSubmit={handleSaveActivity} className="p-6 overflow-y-auto space-y-4 flex-1">
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 block mb-1">Nama Kegiatan *</label>
                      <input 
                        type="text" 
                        required
                        value={kegiatanFormData.namaKegiatan || ''}
                        onChange={e => setKegiatanFormData({ ...kegiatanFormData, namaKegiatan: e.target.value })}
                        placeholder="Contoh: Rapat Kerja Wilayah HW Jateng 2026"
                        className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-3 text-xs font-bold outline-none focus:ring-2 focus:ring-hw-green/20"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 block mb-1">Kategori</label>
                        <select
                          value={kegiatanFormData.kategori || 'Pelatihan'}
                          onChange={e => setKegiatanFormData({ ...kegiatanFormData, kategori: e.target.value })}
                          className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-3 text-xs font-bold outline-none"
                        >
                          <option value="Pelatihan">Pelatihan</option>
                          <option value="Diklat">Diklat</option>
                          <option value="Rapat HW">Rapat HW</option>
                          <option value="Silaturahmi">Silaturahmi</option>
                          <option value="Perkemahan">Perkemahan</option>
                          <option value="Musyawarah">Musyawarah</option>
                          <option value="Lainnya">Lainnya</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 block mb-1">Status Pendaftaran</label>
                        <select
                          value={kegiatanFormData.status || 'Buka'}
                          onChange={e => setKegiatanFormData({ ...kegiatanFormData, status: e.target.value })}
                          className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-3 text-xs font-bold outline-none"
                        >
                          <option value="Buka">Buka (Terbuka)</option>
                          <option value="Tutup">Tutup (Ditutup)</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 block mb-1">Tanggal Pelaksanaan</label>
                        <input 
                          type="text" 
                          value={kegiatanFormData.tanggal || ''}
                          onChange={e => setKegiatanFormData({ ...kegiatanFormData, tanggal: e.target.value })}
                          placeholder="Contoh: 15-18 Oktober 2026"
                          className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-3 text-xs font-bold outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 block mb-1">Lokasi</label>
                        <input 
                          type="text" 
                          value={kegiatanFormData.lokasi || ''}
                          onChange={e => setKegiatanFormData({ ...kegiatanFormData, lokasi: e.target.value })}
                          placeholder="Contoh: Baturraden, Banyumas"
                          className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-3 text-xs font-bold outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 block mb-1">Infaq / Biaya</label>
                        <input 
                          type="text" 
                          value={kegiatanFormData.biaya || ''}
                          onChange={e => setKegiatanFormData({ ...kegiatanFormData, biaya: e.target.value })}
                          placeholder="Contoh: Rp 75.000 / Gratis"
                          className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-3 text-xs font-bold outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 block mb-1">Kuota Peserta</label>
                        <input 
                          type="text" 
                          value={kegiatanFormData.kuota || ''}
                          onChange={e => setKegiatanFormData({ ...kegiatanFormData, kuota: e.target.value })}
                          placeholder="Contoh: 500 Peserta"
                          className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-3 text-xs font-bold outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 block">
                          Gambar URL / Poster (Banner)
                        </label>
                        <label className="text-[10px] font-bold text-hw-green hover:underline cursor-pointer flex items-center gap-1">
                          <Upload size={10} />
                          Unggah Poster
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={e => {
                              const f = e.target.files?.[0];
                              if (f) {
                                handleDocumentFileUpload(
                                  f,
                                  base64 => setKegiatanFormData(prev => ({ ...prev, gambarUrl: base64 })),
                                  err => alert(err)
                                );
                                e.target.value = '';
                              }
                            }}
                          />
                        </label>
                      </div>
                      <input 
                        type="text" 
                        value={kegiatanFormData.gambarUrl || ''}
                        onChange={e => setKegiatanFormData({ ...kegiatanFormData, gambarUrl: e.target.value })}
                        placeholder="https://... atau upload foto poster"
                        className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-3 text-xs font-bold outline-none"
                      />
                      {kegiatanFormData.gambarUrl && (
                        <div className="mt-2 relative rounded-xl overflow-hidden border border-gray-200 max-h-36 bg-slate-900/10 flex items-center justify-center p-2">
                          <img 
                            src={getCorsSafeUrl(kegiatanFormData.gambarUrl)} 
                            alt="Preview Poster" 
                            className="max-h-32 object-contain rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={() => setKegiatanFormData(prev => ({ ...prev, gambarUrl: '' }))}
                            className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1 hover:bg-red-700 shadow-md cursor-pointer"
                            title="Hapus Poster"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 block mb-1">Nomor Rekening Pembayaran</label>
                        <input 
                          type="text" 
                          value={kegiatanFormData.rekeningPembiayaan || ''}
                          onChange={e => setKegiatanFormData({ ...kegiatanFormData, rekeningPembiayaan: e.target.value })}
                          placeholder="Contoh: Bank BSI 7307427448 a.n. Kwarwil HW Jateng"
                          className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-3 text-xs font-bold outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 block mb-1">Nomor Konfirmasi Pembayaran (WA)</label>
                        <input 
                          type="text" 
                          value={kegiatanFormData.noWhatsappPanitia || ''}
                          onChange={e => setKegiatanFormData({ ...kegiatanFormData, noWhatsappPanitia: e.target.value })}
                          placeholder="Contoh: 089688754000"
                          className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-3 text-xs font-bold outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 block">
                          Link / File Proposal Download
                        </label>
                        <label className="text-[10px] font-bold text-sky-700 hover:text-sky-900 cursor-pointer underline flex items-center gap-1">
                          <Upload size={10} />
                          Unggah File Proposal
                          <input
                            type="file"
                            accept=".pdf,.doc,.docx"
                            className="hidden"
                            onChange={e => {
                              const f = e.target.files?.[0];
                              if (f) {
                                handleDocumentFileUpload(
                                  f,
                                  base64 => setKegiatanFormData({ ...kegiatanFormData, proposalUrl: base64 }),
                                  err => alert(err)
                                );
                                e.target.value = '';
                              }
                            }}
                          />
                        </label>
                      </div>
                      <input 
                        type="text" 
                        value={kegiatanFormData.proposalUrl || ''}
                        onChange={e => setKegiatanFormData({ ...kegiatanFormData, proposalUrl: e.target.value })}
                        placeholder="Contoh: https://drive.google.com/file/d/... atau upload PDF"
                        className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-3 text-xs font-bold outline-none"
                      />
                      {kegiatanFormData.proposalUrl && kegiatanFormData.proposalUrl.startsWith('data:') && (
                        <div className="flex items-center justify-between bg-emerald-100/80 text-emerald-800 text-[10px] px-2.5 py-1 rounded-xl border border-emerald-300 font-bold mt-1">
                          <span>✓ File proposal terunggah ({Math.round(kegiatanFormData.proposalUrl.length / 1024)} KB)</span>
                          <button
                            type="button"
                            onClick={() => setKegiatanFormData({ ...kegiatanFormData, proposalUrl: '' })}
                            className="text-red-600 hover:underline text-[9px] font-extrabold cursor-pointer"
                          >
                            Hapus
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="space-y-3 bg-emerald-50/70 p-3.5 rounded-2xl border border-emerald-100">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-[10px] font-black uppercase tracking-wider text-emerald-800">
                              Link / File Themesong MP3
                            </label>
                            <label className="text-[10px] font-bold text-emerald-700 hover:text-emerald-900 cursor-pointer underline flex items-center gap-1">
                              <Upload size={10} />
                              Unggah MP3
                              <input
                                type="file"
                                accept="audio/*,.mp3,.wav,.m4a"
                                className="hidden"
                                onChange={e => {
                                  const f = e.target.files?.[0];
                                  if (f) {
                                    handleAudioFileUpload(
                                      f,
                                      base64 => setKegiatanFormData({ ...kegiatanFormData, themeSongUrl: base64 }),
                                      err => alert(err)
                                    );
                                  }
                                }}
                              />
                            </label>
                          </div>
                          <input 
                            type="text" 
                            value={kegiatanFormData.themeSongUrl || ''}
                            onChange={e => setKegiatanFormData({ ...kegiatanFormData, themeSongUrl: e.target.value })}
                            placeholder="https://.../lagu.mp3 atau Google Drive link"
                            className="w-full bg-white border border-emerald-200 rounded-xl p-2.5 text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500/20"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-black uppercase tracking-wider text-emerald-800 block mb-1">
                            Judul Themesong / Mars
                          </label>
                          <input 
                            type="text" 
                            value={kegiatanFormData.themeSongTitle || ''}
                            onChange={e => setKegiatanFormData({ ...kegiatanFormData, themeSongTitle: e.target.value })}
                            placeholder="Contoh: Mars Hizbul Wathan"
                            className="w-full bg-white border border-emerald-200 rounded-xl p-2.5 text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500/20"
                          />
                        </div>
                      </div>

                      {kegiatanFormData.themeSongUrl && (
                        <ThemeSongPlayer
                          audioUrl={kegiatanFormData.themeSongUrl}
                          title={kegiatanFormData.themeSongTitle || 'Preview Themesong'}
                          compact={true}
                        />
                      )}
                    </div>

                    {/* FITUR VIDEO YOUTUBE KEGIATAN */}
                    <div className="p-4 bg-rose-50/70 border border-rose-200/80 rounded-2xl space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-rose-700">
                          <Youtube size={16} />
                          <label className="text-xs font-black uppercase tracking-wider">Video YouTube Kegiatan (Opsional)</label>
                        </div>
                        <span className="text-[10px] font-bold text-rose-500 bg-rose-100/60 px-2 py-0.5 rounded-full">
                          Dapat diputar di Halaman Kegiatan
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-500 leading-relaxed">
                        Masukkan tautan / URL video YouTube (misal teaser, dokumentasi, atau siaran kegiatan). Jika dikosongkan, video tidak akan ditampilkan di halaman kegiatan.
                      </p>
                      <input 
                        type="text" 
                        value={kegiatanFormData.youtubeUrl || ''}
                        onChange={e => setKegiatanFormData({ ...kegiatanFormData, youtubeUrl: e.target.value })}
                        placeholder="Contoh: https://www.youtube.com/watch?v=... atau https://youtu.be/..."
                        className="w-full bg-white border border-rose-200 rounded-xl p-2.5 text-xs font-bold outline-none focus:ring-2 focus:ring-rose-500/20 text-gray-800"
                      />
                      {(() => {
                        const rawUrl = kegiatanFormData.youtubeUrl || '';
                        let videoId = '';
                        try {
                          if (rawUrl.includes('v=')) {
                            videoId = rawUrl.split('v=')[1]?.split('&')[0] || '';
                          } else if (rawUrl.includes('youtu.be/')) {
                            videoId = rawUrl.split('youtu.be/')[1]?.split('?')[0] || '';
                          } else if (rawUrl.includes('embed/')) {
                            videoId = rawUrl.split('embed/')[1]?.split('?')[0] || '';
                          } else if (rawUrl.trim().length === 11 && !rawUrl.includes('/')) {
                            videoId = rawUrl.trim();
                          }
                        } catch(e) {}

                        if (!videoId) return null;

                        return (
                          <div className="rounded-xl overflow-hidden border border-rose-200 aspect-video bg-black/90 relative mt-2">
                            <iframe
                              src={`https://www.youtube.com/embed/${videoId}`}
                              title="Preview Video Kegiatan"
                              className="w-full h-full border-0"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                            />
                          </div>
                        );
                      })()}
                    </div>

                    <div>
                      <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 block mb-1">Deskripsi Kegiatan</label>
                      <textarea 
                        rows={3}
                        value={kegiatanFormData.deskripsi || ''}
                        onChange={e => setKegiatanFormData({ ...kegiatanFormData, deskripsi: e.target.value })}
                        placeholder="Tuliskan ringkasan agenda kegiatan..."
                        className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-3 text-xs font-bold outline-none"
                      />
                    </div>

                    <div className="pt-2 flex gap-3">
                      <button
                        type="button"
                        onClick={() => setIsKegiatanModalOpen(false)}
                        className="px-5 py-3 bg-gray-100 text-gray-600 rounded-2xl text-xs font-bold hover:bg-gray-200 cursor-pointer"
                      >
                        Batal
                      </button>
                      <button
                        type="submit"
                        disabled={loading}
                        className="flex-1 py-3 bg-hw-green hover:bg-emerald-700 text-white rounded-2xl text-xs font-black uppercase tracking-wider shadow-lg shadow-hw-green/20 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {loading ? (
                          <>
                            <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Menyimpan ke Firebase...
                          </>
                        ) : (
                          'Simpan Kegiatan'
                        )}
                      </button>
                    </div>
                  </form>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* AKUN TAB */}
          {activeTab === 'akun' && (
            <div className="p-8 max-w-md mx-auto">
              <div className="text-center mb-8">
                <div className="w-20 h-20 bg-hw-green/10 text-hw-green rounded-[2rem] flex items-center justify-center mx-auto mb-4">
                  <Shield size={32} />
                </div>
                <h3 className="text-xl font-display font-black text-gray-800">Keamanan Akun</h3>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Ganti password Anda secara berkala</p>
              </div>

              <form onSubmit={handleUpdatePassword} className="space-y-6">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Password Baru</label>
                  <input 
                    type="password" 
                    required
                    value={passwordFormData.newPassword || ''}
                    onChange={(e) => setPasswordFormData({...passwordFormData, newPassword: e.target.value})}
                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-3 px-4 font-bold text-sm outline-none focus:ring-4 focus:ring-hw-green/10" 
                    placeholder="••••••••"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Konfirmasi Password</label>
                  <input 
                    type="password" 
                    required
                    value={passwordFormData.confirmPassword || ''}
                    onChange={(e) => setPasswordFormData({...passwordFormData, confirmPassword: e.target.value})}
                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-3 px-4 font-bold text-sm outline-none focus:ring-4 focus:ring-hw-green/10" 
                    placeholder="••••••••"
                  />
                </div>

                {passwordMessage.text && (
                  <div className={`p-4 rounded-2xl text-[10px] font-black uppercase tracking-wider text-center ${
                    passwordMessage.type === 'success' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                  }`}>
                    {passwordMessage.text}
                  </div>
                )}

                <button 
                  type="submit"
                  disabled={passwordLoading}
                  className="w-full py-4 bg-hw-dark text-white rounded-2xl shadow-xl shadow-hw-dark/20 font-black text-sm hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  {passwordLoading ? 'Memperbarui...' : 'Simpan Password Baru'}
                </button>
              </form>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Notification & Approval Modal */}
      <AnimatePresence>
        {isNotificationModalOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsNotificationModalOpen(false)}
              className="absolute inset-0 bg-hw-dark/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              {/* Header */}
              <div className="p-6 border-b border-gray-50 flex items-center justify-between bg-hw-blue/5">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-hw-blue text-white rounded-2xl">
                    <Bell size={20} />
                  </div>
                  <div>
                    <h3 className="font-display font-black text-gray-800">Pusat Notifikasi & Approval</h3>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Pendaftaran, Upgrade, KTA & Pelatihan</p>
                  </div>
                </div>
                <button onClick={() => setIsNotificationModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <X size={20} className="text-gray-400" />
                </button>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-gray-100 bg-gray-50/50 p-2 gap-1.5 overflow-x-auto no-scrollbar">
                <button
                  onClick={() => setNotifActiveTab('pendaftaran')}
                  className={`flex-1 min-w-[90px] py-2.5 text-[11px] font-black uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                    notifActiveTab === 'pendaftaran'
                      ? 'bg-white text-hw-dark shadow-sm ring-1 ring-black/5'
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  Daftar
                  {pendingMembers.length > 0 && (
                    <span className="px-1.5 py-0.5 bg-rose-500 text-white text-[8px] rounded-full font-black">
                      {pendingMembers.length}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setNotifActiveTab('upgrade')}
                  className={`flex-1 min-w-[90px] py-2.5 text-[11px] font-black uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                    notifActiveTab === 'upgrade'
                      ? 'bg-white text-hw-dark shadow-sm ring-1 ring-black/5'
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  Upgrade
                  {membersWithUpgradeRequests.length > 0 && (
                    <span className="px-1.5 py-0.5 bg-rose-500 text-white text-[8px] rounded-full font-black">
                      {membersWithUpgradeRequests.length}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setNotifActiveTab('kta')}
                  className={`flex-1 min-w-[90px] py-2.5 text-[11px] font-black uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                    notifActiveTab === 'kta'
                      ? 'bg-white text-hw-dark shadow-sm ring-1 ring-black/5'
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  KTA
                  {pendingKtaApps.length > 0 && (
                    <span className="px-1.5 py-0.5 bg-rose-500 text-white text-[8px] rounded-full font-black">
                      {pendingKtaApps.length}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setNotifActiveTab('pelatihan')}
                  className={`flex-1 min-w-[90px] py-2.5 text-[11px] font-black uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                    notifActiveTab === 'pelatihan'
                      ? 'bg-white text-hw-dark shadow-sm ring-1 ring-black/5'
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  Pelatihan
                  {pendingTrainingApps.length > 0 && (
                    <span className="px-1.5 py-0.5 bg-rose-500 text-white text-[8px] rounded-full font-black">
                      {pendingTrainingApps.length}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setNotifActiveTab('tugas')}
                  className={`flex-1 min-w-[90px] py-2.5 text-[11px] font-black uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                    notifActiveTab === 'tugas'
                      ? 'bg-white text-hw-dark shadow-sm ring-1 ring-black/5'
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  Tugas
                  {submittedTaskApps.length > 0 && (
                    <span className="px-1.5 py-0.5 bg-amber-500 text-white text-[8px] rounded-full font-black">
                      {submittedTaskApps.length}
                    </span>
                  )}
                </button>
              </div>

              {/* Body */}
              <div className="p-6 max-h-[50vh] overflow-y-auto space-y-4">
                {notifActiveTab === 'pendaftaran' ? (
                  pendingMembers.length === 0 ? (
                    <div className="text-center py-10 space-y-3">
                      <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto text-gray-200">
                        <Users size={32} />
                      </div>
                      <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Tidak ada pendaftaran baru</p>
                    </div>
                  ) : (
                    pendingMembers.map((m) => (
                      <div 
                        key={`pending-${m.id}`}
                        className="p-4 rounded-3xl border border-gray-100 bg-gray-50/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-hw-green text-white flex items-center justify-center font-black text-xs shrink-0">
                            {m.namaLengkap?.charAt(0) || 'U'}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-gray-800">{m.namaLengkap}</p>
                            <p className="text-[10px] text-gray-400 font-medium">
                              {m.email} • {m.asalKwarda || 'Kwarda -'}
                            </p>
                            <span className="mt-1 inline-block px-2 py-0.5 bg-gray-100 text-gray-500 rounded text-[8px] font-black uppercase tracking-wider">
                              Golongan: {m.golongan || 'Umum'}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                          <button 
                            onClick={() => {
                              setIsNotificationModalOpen(false);
                              handleOpenModal(m);
                            }}
                            className="p-2 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-100 transition-all flex items-center justify-center border border-emerald-100"
                            title="Tinjau Data Anggota"
                          >
                            <Eye size={15} />
                          </button>
                          <button 
                            onClick={async () => {
                              await handleChangeVerify(m.id);
                            }}
                            className="px-3 py-1.5 bg-hw-green text-white rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-emerald-700 hover:scale-105 active:scale-95 transition-all shadow-sm"
                          >
                            Setujui
                          </button>
                          <button 
                            onClick={async () => {
                              await handleRejectMember(m);
                            }}
                            className="px-3 py-1.5 bg-rose-50 text-rose-600 border border-rose-100 rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-rose-100 hover:scale-105 active:scale-95 transition-all shadow-sm"
                          >
                            Tolak
                          </button>
                        </div>
                      </div>
                    ))
                  )
                ) : notifActiveTab === 'upgrade' ? (
                  membersWithUpgradeRequests.length === 0 ? (
                    <div className="text-center py-10 space-y-3">
                      <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto text-gray-200">
                        <Bell size={32} />
                      </div>
                      <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Tidak ada ajuan upgrade baru</p>
                    </div>
                  ) : (
                    membersWithUpgradeRequests.map((m) => (
                      <div 
                        key={`req-${m.id}`}
                        className="p-4 rounded-3xl border border-gray-100 bg-gray-50/30 flex flex-col gap-3"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-hw-blue text-white flex items-center justify-center font-black text-xs shrink-0">
                              {m.namaLengkap?.charAt(0) || 'U'}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-gray-800">{m.namaLengkap}</p>
                              <p className="text-[10px] text-gray-400 font-medium">{m.email}</p>
                            </div>
                          </div>
                          <button 
                            onClick={() => {
                              setIsNotificationModalOpen(false);
                              handleOpenModal(m);
                            }}
                            className="p-2 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-100 transition-all border border-emerald-100 shrink-0"
                            title="Tinjau Data Lengkap"
                          >
                            <Eye size={15} />
                          </button>
                        </div>

                        <div className="space-y-2 pt-1 border-t border-gray-100">
                          {(Array.isArray(m.upgradeRequests) ? m.upgradeRequests : []).map((roleId: string) => (
                            <div key={roleId} className="flex items-center justify-between bg-white p-2.5 rounded-2xl border border-gray-100">
                              <span className="px-2 py-0.5 bg-rose-50 text-rose-600 border border-rose-100 rounded text-[9px] font-black uppercase tracking-wider">
                                {ROLE_LABELS[roleId] || roleId}
                              </span>
                              <div className="flex items-center gap-1.5">
                                <button
                                  onClick={() => handleApproveUpgrade(m, roleId)}
                                  className="px-2.5 py-1 bg-hw-green text-white rounded-lg text-[9px] font-black uppercase tracking-wider hover:bg-emerald-700 transition-all shadow-sm"
                                >
                                  Setujui
                                </button>
                                <button
                                  onClick={() => handleRejectUpgrade(m, roleId)}
                                  className="px-2.5 py-1 bg-rose-50 text-rose-600 border border-rose-100 rounded-lg text-[9px] font-black uppercase tracking-wider hover:bg-rose-100 transition-all shadow-sm"
                                >
                                  Tolak
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))
                  )
                ) : notifActiveTab === 'kta' ? (
                  pendingKtaApps.length === 0 ? (
                    <div className="text-center py-10 space-y-3">
                      <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto text-gray-200">
                        <CreditCard size={32} />
                      </div>
                      <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Tidak ada ajuan KTA baru</p>
                    </div>
                  ) : (
                    pendingKtaApps.map((app) => (
                      <div 
                        key={`kta-notif-${app.id}`}
                        className="p-4 rounded-3xl border border-gray-100 bg-gray-50/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-black text-xs shrink-0">
                            KTA
                          </div>
                          <div>
                            <p className="text-sm font-bold text-gray-800">{app.nama || app.namaLengkap || 'Tanpa Nama'}</p>
                            <p className="text-[10px] text-gray-400 font-medium">
                              {app.asalDaerah} • Qabilah: {app.qabilah || '-'}
                            </p>
                            <span className="mt-1 inline-block px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-100 rounded text-[8px] font-black uppercase tracking-wider">
                              Tingkatan: {app.tingkatan || '-'} ({app.jenisKta || 'Digital'})
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                          <button 
                            onClick={() => {
                              setViewingKtaApp(app);
                              setIsViewKtaModalOpen(true);
                              setFlippedAdmin(false);
                            }}
                            className="p-2 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-100 transition-all flex items-center justify-center border border-emerald-100"
                            title="Tinjau Kartu KTA"
                          >
                            <Eye size={15} />
                          </button>
                          <button 
                            onClick={async () => {
                              await handleApproveKTA(app.id);
                            }}
                            className="px-3.5 py-2 bg-hw-green text-white rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-emerald-700 hover:scale-105 active:scale-95 transition-all shadow-sm"
                          >
                            Setujui
                          </button>
                          <button 
                            onClick={() => {
                              handleOpenRejectKTA(app.id);
                            }}
                            className="px-3.5 py-2 bg-rose-50 text-rose-600 rounded-xl text-[10px] font-black uppercase tracking-wider border border-rose-100 hover:bg-rose-100 transition-all shadow-sm"
                          >
                            Tolak
                          </button>
                        </div>
                      </div>
                    ))
                  )
                ) : notifActiveTab === 'pelatihan' ? (
                  pendingTrainingApps.length === 0 ? (
                    <div className="text-center py-10 space-y-3">
                      <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto text-gray-200">
                        <GraduationCap size={32} />
                      </div>
                      <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Tidak ada pendaftaran pelatihan baru</p>
                    </div>
                  ) : (
                    pendingTrainingApps.map((app) => (
                      <div 
                        key={`train-notif-${app.id}`}
                        className="p-4 rounded-3xl border border-gray-100 bg-gray-50/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black text-xs shrink-0">
                            PLT
                          </div>
                          <div>
                            <p className="text-sm font-bold text-gray-800">{app.nama || 'Peserta'}</p>
                            <p className="text-[10px] text-gray-400 font-medium">
                              {app.asalDaerah || 'Kwarda'} • {app.noWa || app.email || '-'}
                            </p>
                            <span className="mt-1 inline-block px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded text-[8px] font-black uppercase tracking-wider">
                              Pelatihan: {app.pelatihanAkanDiikuti || 'Jaya Matahari 1'}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                          <button 
                            onClick={() => {
                              setEditingTrainingApp({ ...app });
                              setIsEditTrainingModalOpen(true);
                            }}
                            className="p-2 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-100 transition-all flex items-center justify-center border border-emerald-100"
                            title="Edit Data Pelatihan"
                          >
                            <Eye size={15} />
                          </button>
                          <button 
                            onClick={async () => {
                              await handleApproveTraining(app.id);
                            }}
                            className="px-3.5 py-2 bg-hw-green text-white rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-emerald-700 hover:scale-105 active:scale-95 transition-all shadow-sm"
                          >
                            Setujui
                          </button>
                          <button 
                            onClick={() => {
                              handleOpenRejectTraining(app.id);
                            }}
                            className="px-3.5 py-2 bg-rose-50 text-rose-600 rounded-xl text-[10px] font-black uppercase tracking-wider border border-rose-100 hover:bg-rose-100 transition-all shadow-sm"
                          >
                            Tolak
                          </button>
                        </div>
                      </div>
                    ))
                  )
                ) : (
                  submittedTaskApps.length === 0 ? (
                    <div className="text-center py-10 space-y-3">
                      <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto text-gray-200">
                        <FileText size={32} />
                      </div>
                      <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Belum ada pengumpulan tugas peserta</p>
                    </div>
                  ) : (
                    submittedTaskApps.map((app) => {
                      const userTasks = parseAppTasks(app);
                      return (
                        <div 
                          key={`task-notif-${app.id}`}
                          className="p-4 rounded-3xl border border-gray-100 bg-gray-50/30 flex flex-col gap-3"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-black text-xs shrink-0">
                                TGS
                              </div>
                              <div>
                                <p className="text-sm font-bold text-gray-800">{app.nama || 'Peserta'}</p>
                                <p className="text-[10px] text-gray-400 font-medium">
                                  {app.asalDaerah || 'Kwarda'} • {app.pelatihanAkanDiikuti || 'Jati 1'}
                                </p>
                              </div>
                            </div>
                            <button
                              onClick={() => {
                                setIsNotificationModalOpen(false);
                                setActiveTabState('pelatihan');
                                setTrainingSubTab('penugasan');
                                if (app.pelatihanAkanDiikuti?.includes('Jati 2')) {
                                  setSelectedTugasProg('Jati 2');
                                } else if (app.pelatihanAkanDiikuti?.includes('Jari 1')) {
                                  setSelectedTugasProg('Jari 1');
                                } else {
                                  setSelectedTugasProg('Jati 1');
                                }
                                handleOpenGradingModal(app);
                              }}
                              className="px-3 py-1.5 bg-hw-green text-white rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-emerald-700 transition-all shadow-sm"
                            >
                              Beri Nilai & Tinjau
                            </button>
                          </div>

                          <div className="space-y-1.5 pt-2 border-t border-gray-100">
                            <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider block">
                              Daftar Tugas Dikumpulkan ({userTasks.length}):
                            </span>
                            {userTasks.map((t: any, idx: number) => (
                              <div key={idx} className="bg-white p-2.5 rounded-2xl border border-gray-100 flex flex-col gap-1 text-[10px]">
                                <div className="flex items-center justify-between">
                                  <div className="flex flex-col">
                                    <span className="font-bold text-gray-800">{t.title}</span>
                                    {t.submittedAt && (
                                      <span className="text-[8px] text-gray-400">
                                        Dikirim: {new Date(t.submittedAt).toLocaleDateString('id-ID')}
                                      </span>
                                    )}
                                  </div>
                                  {t.link && (
                                    <a 
                                      href={t.link} 
                                      target="_blank" 
                                      rel="noopener noreferrer" 
                                      className="px-2 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-[9px] font-bold hover:underline flex items-center gap-1 shrink-0"
                                    >
                                      Lihat Tugas <ArrowUpRight size={10} />
                                    </a>
                                  )}
                                </div>
                                {(t.pesan || t.message) && (
                                  <p className="text-[9.5px] text-gray-600 bg-gray-50 p-2 rounded-xl border border-gray-150 italic mt-0.5">
                                    💬 "{t.pesan || t.message}"
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })
                  )
                )}
              </div>
              
              <div className="p-6 bg-gray-50 text-[10px] text-gray-400 font-bold text-center uppercase tracking-widest border-t border-gray-100">
                Pendaftaran baru & Ajuan KTA memerlukan verifikasi admin untuk aktif
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Member CRUD Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 py-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div className="p-8">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-2xl font-display font-black text-gray-800">
                    {editingMember ? 'Edit Anggota' : 'Tambah Anggota'}
                  </h3>
                  <button onClick={() => setIsModalOpen(false)} className="p-3 bg-gray-50 text-gray-400 rounded-2xl hover:bg-gray-100">
                    <X size={20} />
                  </button>
                </div>

                <div className="space-y-4 max-h-[60vh] overflow-y-auto px-1 scrollbar-none">
                  {/* Foto Profil Section */}
                  <div className="flex flex-col items-center justify-center py-4 bg-gray-50/50 rounded-3xl border border-dashed border-gray-200">
                    <div className="relative group w-24 h-24 rounded-2xl bg-gray-100 flex items-center justify-center border-4 border-white shadow-md overflow-hidden text-gray-300">
                      {formData.photo ? (
                        <img src={formData.photo} alt="Foto Profil" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <UserIcon size={40} />
                      )}
                      <button
                        type="button"
                        onClick={() => memberPhotoInputRef.current?.click()}
                        className="absolute inset-0 bg-black/40 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer animate-fade-in"
                        title="Ubah Foto Profil"
                      >
                        <Camera size={20} />
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => memberPhotoInputRef.current?.click()}
                      className="mt-3 px-4 py-1.5 bg-white border border-gray-200 rounded-xl text-[10px] font-black text-gray-600 hover:bg-gray-50 transition-all uppercase tracking-wider shadow-sm cursor-pointer"
                    >
                      Pilih Foto
                    </button>
                    <input 
                      type="file"
                      ref={memberPhotoInputRef}
                      onChange={handleMemberPhotoChange}
                      accept="image/*"
                      className="hidden"
                    />
                    <span className="text-[9px] text-gray-400 mt-1">Maksimal 10MB (Kapasitas optimal)</span>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nama Lengkap</label>
                    <input 
                      type="text" 
                      value={formData.namaLengkap || ''}
                      onChange={(e) => setFormData({...formData, namaLengkap: e.target.value})}
                      className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-3 px-4 font-bold text-sm focus:ring-4 focus:ring-hw-green/10 outline-none" 
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1 sm:col-span-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center justify-between">
                        <span>Nomor KTA</span>
                        <span className="text-emerald-600 font-extrabold lowercase text-[9px] bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">Otomatis & Permanen (11.xx.xxxx)</span>
                      </label>
                      <input 
                        type="text" 
                        readOnly
                        value={formData.ktaNumber || 'Dibuat otomatis oleh sistem (11.xx.xxxx)'}
                        className="w-full bg-gray-100/80 text-gray-700 font-mono font-black text-sm border border-gray-200 rounded-2xl py-3 px-4 outline-none cursor-not-allowed" 
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Tempat Lahir</label>
                      <input 
                        type="text" 
                        value={formData.tempatLahir || ''}
                        onChange={(e) => setFormData({...formData, tempatLahir: e.target.value})}
                        placeholder="Kota / Kabupaten"
                        className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-3 px-4 font-bold text-sm focus:ring-4 focus:ring-hw-green/10 outline-none" 
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Tanggal Lahir</label>
                      <input 
                        type="date" 
                        value={formData.tanggalLahir || ''}
                        onChange={(e) => setFormData({...formData, tanggalLahir: e.target.value})}
                        className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-3 px-4 font-bold text-sm focus:ring-4 focus:ring-hw-green/10 outline-none" 
                      />
                    </div>
                  </div>

                  {(() => {
                    const reqs = Array.isArray(formData.upgradeRequests) 
                      ? formData.upgradeRequests 
                      : (typeof formData.upgradeRequests === 'string' && formData.upgradeRequests) 
                      ? [formData.upgradeRequests] 
                      : [];
                    return reqs.length > 0 ? (
                      <div className="bg-rose-50 p-4 rounded-2xl border border-rose-100 space-y-3">
                         <h5 className="text-[10px] font-black text-rose-500 uppercase tracking-widest">Permohonan Upgrade Akses:</h5>
                         <div className="flex flex-col gap-2">
                           {reqs.map((req, idx) => (
                             <div key={`upgrade-${req}-${idx}`} className="flex items-center justify-between bg-white px-3 py-2 rounded-xl border border-rose-200 shadow-sm">
                               <div className="flex items-center gap-2">
                                 <Award size={14} className="text-rose-500" />
                                 <span className="text-xs font-bold text-gray-700 uppercase">{req}</span>
                               </div>
                               <div className="flex items-center gap-2">
                                 <button 
                                   onClick={() => {
                                     setFormData({
                                       ...formData, 
                                       role: req as any,
                                       upgradeRequests: reqs.filter(r => r !== req)
                                     });
                                   }}
                                   className="px-3 py-1 bg-hw-green text-white text-[10px] font-black rounded-lg hover:bg-hw-green-dark transition-colors flex items-center gap-1 cursor-pointer"
                                 >
                                   <Check size={10} /> APPROVE
                                 </button>
                                 <button 
                                   onClick={() => setFormData({...formData, upgradeRequests: reqs.filter(r => r !== req)})}
                                   className="p-1 text-gray-400 hover:text-rose-500 transition-colors cursor-pointer"
                                   title="Reject/Remove"
                                 >
                                   <X size={14} />
                                 </button>
                               </div>
                             </div>
                           ))}
                         </div>
                      </div>
                    ) : null;
                  })()}

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Email</label>
                    <input 
                      type="email" 
                      value={formData.email || ''}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      placeholder="nama@email.com"
                      className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-3 px-4 font-bold text-sm focus:ring-4 focus:ring-hw-green/10 outline-none" 
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-hw-blue uppercase tracking-widest ml-1 flex items-center gap-1">
                      <Shield size={10} /> Password {editingMember ? '(Kosongkan jika tidak diubah)' : ''}
                    </label>
                    <input 
                      type="text" 
                      value={formData.password || ''}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                      placeholder={editingMember ? "••••••••" : "Masukkan password awal..."}
                      className="w-full bg-gray-50 border border-hw-blue/10 rounded-2xl py-3 px-4 font-bold text-sm focus:ring-4 focus:ring-hw-blue/10 outline-none" 
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Jenis Kelamin</label>
                      <select 
                        value={formData.jenisKelamin || 'L'}
                        onChange={(e) => setFormData({...formData, jenisKelamin: e.target.value})}
                        className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-3 px-4 font-bold text-sm outline-none"
                      >
                        <option value="L">Laki-laki</option>
                        <option value="P">Perempuan</option>
                      </select>
                    </div>

                  {(() => {
                    const userNormRoles = parseRolesField(user?.roles, user?.role);
                    const canEditRoles = user?.role === 'superadmin' || user?.role === 'admin' || userNormRoles.includes('superadmin') || userNormRoles.includes('admin');
                    const isSuperAdmin = user?.role === 'superadmin' || userNormRoles.includes('superadmin');

                    return (
                      <>
                        <div className="space-y-2 col-span-1 sm:col-span-2">
                          <div className="flex items-center justify-between">
                            <div>
                              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Hak Akses (Role)</label>
                              <p className="text-[9px] text-gray-400 font-medium ml-1">
                                Menceklis role otomatis menyelaraskan dan mencentang data Pelatihan Diikuti.
                              </p>
                            </div>
                            {!canEditRoles ? (
                              <span className="text-[9px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                                Khusus Super Admin & Admin Petugas
                              </span>
                            ) : (
                              <span className="text-[9px] font-bold text-hw-green bg-hw-green/10 px-2 py-0.5 rounded-md border border-hw-green/20">
                                Terhubung otomatis
                              </span>
                            )}
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {ROLE_OPTIONS.map(({ key, label }) => {
                              // Skip superadmin role for non-superadmins
                              if (key === 'superadmin' && !isSuperAdmin) return null;

                              const normalizedCurrentRoles = (formData.roles || []).map(r => normalizeTrainingKey(r)).filter(Boolean);
                              const isSelected = normalizedCurrentRoles.includes(key) || (formData.roles || []).includes(key as any);
                              return (
                                <button
                                  key={`role-opt-${key}`}
                                  type="button"
                                  disabled={!canEditRoles}
                                  onClick={() => {
                                    if (!canEditRoles) return;
                                    let nextRoles: string[];
                                    let nextPelatihan = Array.isArray(formData.pelatihan) ? [...formData.pelatihan] : [];

                                    if (isSelected) {
                                      if (normalizedCurrentRoles.length > 1) {
                                        nextRoles = normalizedCurrentRoles.filter(k => k !== key && normalizeTrainingKey(k) !== key);
                                        // If removing training role, also clean from pelatihan
                                        if (key === 'jati1') nextPelatihan = nextPelatihan.filter(p => !isPelatihanSelected([p], 'Jati 1'));
                                        else if (key === 'jati2') nextPelatihan = nextPelatihan.filter(p => !isPelatihanSelected([p], 'Jati 2'));
                                        else if (key === 'jari1') nextPelatihan = nextPelatihan.filter(p => !isPelatihanSelected([p], 'Jari 1'));
                                        else if (key === 'jari2') nextPelatihan = nextPelatihan.filter(p => !isPelatihanSelected([p], 'Jari 2'));
                                        else if (key === 'jawi') nextPelatihan = nextPelatihan.filter(p => !isPelatihanSelected([p], 'Jawi'));
                                      } else {
                                        return; // Must have at least one role
                                      }
                                    } else {
                                      nextRoles = [...normalizedCurrentRoles, key];
                                      // Automatically add corresponding training to pelatihan
                                      if (key === 'jati1') {
                                        if (!isPelatihanSelected(nextPelatihan, 'Jati 1')) nextPelatihan.push('Jati 1');
                                      } else if (key === 'jati2') {
                                        if (!isPelatihanSelected(nextPelatihan, 'Jati 2')) nextPelatihan.push('Jati 2');
                                        if (!isPelatihanSelected(nextPelatihan, 'Jati 1')) nextPelatihan.push('Jati 1');
                                      } else if (key === 'jari1') {
                                        if (!isPelatihanSelected(nextPelatihan, 'Jari 1')) nextPelatihan.push('Jari 1');
                                      } else if (key === 'jari2') {
                                        if (!isPelatihanSelected(nextPelatihan, 'Jari 2')) nextPelatihan.push('Jari 2');
                                        if (!isPelatihanSelected(nextPelatihan, 'Jari 1')) nextPelatihan.push('Jari 1');
                                      } else if (key === 'jawi') {
                                        if (!isPelatihanSelected(nextPelatihan, 'Jawi')) nextPelatihan.push('Jawi');
                                      }
                                    }

                                    const synced = syncRolesAndPelatihan(nextRoles, nextPelatihan);
                                    setFormData({ 
                                      ...formData, 
                                      roles: synced.roles, 
                                      role: synced.primaryRole, 
                                      pelatihan: isSelected ? nextPelatihan : synced.pelatihan 
                                    });
                                  }}
                                  className={cn(
                                    "flex items-center gap-2 p-2.5 rounded-xl border text-[11px] font-bold transition-all text-left h-full cursor-pointer",
                                    !canEditRoles && "opacity-75 cursor-not-allowed",
                                    isSelected
                                      ? "bg-hw-green/10 border-hw-green/20 text-hw-green font-black"
                                      : "bg-gray-50 border-transparent text-gray-400 hover:bg-gray-100"
                                  )}
                                >
                                  <div className={cn(
                                    "w-4 h-4 rounded flex items-center justify-center border shrink-0",
                                    isSelected ? "bg-hw-green border-hw-green text-white" : "border-gray-200 bg-white"
                                  )}>
                                    {isSelected && <Check size={10} />}
                                  </div>
                                  <span className="leading-tight break-words">{label}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Conditional: Golongan Pelatih Ahli Pandu for Jaya Matahari 1 & 2 */}
                        {(formData.roles.includes('jari1') || formData.roles.includes('jari2') || formData.roles.includes('jaya_matahari_1') || formData.roles.includes('jaya_matahari_2') || formData.role === 'jari1' || formData.role === 'jari2') && (
                          <div className="space-y-2 col-span-1 sm:col-span-2 p-4 bg-amber-50/80 rounded-2xl border border-amber-200/80 animate-fade-in">
                            <label className="text-[10px] font-black text-amber-900 uppercase tracking-widest flex items-center gap-1.5">
                              <Award size={14} className="text-amber-600" />
                              Golongan Pelatih Ahli Pandu (Jaya Matahari)
                            </label>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                              {['Athfal', 'Pengenal', 'Penghela', 'Penuntun'].map((gol) => {
                                const isSelected = formData.golonganPelatih === gol || formData.golongan === gol;
                                return (
                                  <button
                                    key={`admin-gol-pelatih-${gol}`}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, golonganPelatih: gol, golongan: gol })}
                                    className={cn(
                                      "py-2.5 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer",
                                      isSelected
                                        ? "bg-amber-500 border-amber-600 text-amber-950 font-black shadow-sm"
                                        : "bg-white border-amber-200 text-gray-600 hover:bg-amber-100/50"
                                    )}
                                  >
                                    {isSelected && <Check size={12} />}
                                    {gol}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </>
                    );
                  })()}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Golongan</label>
                      <select 
                        value={formData.golongan || 'Pengenal'}
                        onChange={(e) => setFormData({...formData, golongan: e.target.value})}
                        className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-3 px-4 font-bold text-sm outline-none"
                      >
                        {['Tunas Athfal', 'Athfal', 'Pengenal', 'Penghela', 'Penuntun', 'Dewasa'].map(g => (
                          <option key={g} value={g}>{g}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Pendidikan</label>
                      <select 
                        value={formData.pendidikan || 'SMA/SMK/MA'}
                        onChange={(e) => setFormData({...formData, pendidikan: e.target.value})}
                        className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-3 px-4 font-bold text-sm outline-none"
                      >
                         {['SD', 'SMP/MTs', 'SMA/SMK/MA', 'D1/D2/D3', 'S1', 'S2', 'S3'].map(p => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Pelatihan Diikuti</label>
                      <span className="text-[9px] font-bold text-hw-green bg-hw-green/10 px-2 py-0.5 rounded-md border border-hw-green/20">
                        Otomatis terceklist sesuai Role
                      </span>
                    </div>
                    <p className="text-[9px] text-gray-400 font-medium ml-1">
                      Pelatihan yang dipilih otomatis memberikan hak akses (role) dan fasilitas materi terkait.
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                      {PELATIHAN_OPTIONS.map((item) => {
                        const currentList = Array.isArray(formData.pelatihan) ? formData.pelatihan : [];
                        const isSelected = isPelatihanSelected(currentList, item.key);

                        return (
                          <button 
                            key={item.key} 
                            type="button" 
                            onClick={() => {
                              let nextPelatihan: string[];
                              let nextRoles = Array.isArray(formData.roles) ? [...formData.roles] : [];

                              if (isSelected) {
                                nextPelatihan = currentList.filter((p: string) => !isPelatihanSelected([p], item.key));
                                if (item.roleKey) {
                                  if (nextRoles.length > 1) {
                                    nextRoles = nextRoles.filter(r => r !== item.roleKey);
                                  }
                                }
                              } else {
                                nextPelatihan = [...currentList, item.key];
                                if (item.roleKey) {
                                  if (!nextRoles.includes(item.roleKey)) {
                                    nextRoles.push(item.roleKey);
                                  }
                                }
                              }
                              const synced = syncRolesAndPelatihan(nextRoles, nextPelatihan);
                              setFormData({
                                ...formData, 
                                pelatihan: isSelected ? nextPelatihan : synced.pelatihan,
                                roles: isSelected ? nextRoles : synced.roles,
                                role: isSelected ? (nextRoles.find(r => r !== 'umum') || nextRoles[0] || 'umum') : synced.primaryRole
                              });
                            }}
                            className={cn(
                              "p-2.5 rounded-xl text-[10px] font-bold border transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer",
                              isSelected 
                                ? "bg-hw-green/10 border-hw-green text-hw-green font-black shadow-sm" 
                                : "bg-gray-50 border-transparent text-gray-400 hover:bg-gray-100"
                            )}
                          >
                            {isSelected && <Check size={12} />}
                            {item.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                      Asal Kwarda / Qabilah PTMA
                    </label>
                    <select
                      value={formData.asalKwarda || formData.qabilah || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        const found = KWARDA_QABILAH_JATENG.find(k => k.name === val);
                        if (found) {
                          const codeNum = parseInt(found.code, 10);
                          if (codeNum >= 36) {
                            setFormData({ ...formData, asalKwarda: val, qabilah: val });
                          } else {
                            setFormData({ ...formData, asalKwarda: val });
                          }
                        } else {
                          setFormData({ ...formData, asalKwarda: val, qabilah: val });
                        }
                      }}
                      className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-3 px-4 font-bold text-sm outline-none cursor-pointer"
                    >
                      <option value="">-- Pilih Asal Kwarda / Qabilah PTMA --</option>
                      <optgroup label="--- KWARDA (KABUPATEN / KOTA) ---">
                        {KWARDA_QABILAH_JATENG.slice(0, 35).map((item) => (
                          <option key={item.code} value={item.name}>
                            {item.code}. {item.name}
                          </option>
                        ))}
                      </optgroup>
                      <optgroup label="--- QABILAH PTMA (UNIVERSITAS / STIKES / POLITEKNIK) ---">
                        {KWARDA_QABILAH_JATENG.slice(35).map((item) => (
                          <option key={item.code} value={item.name}>
                            {item.code}. {item.name}
                          </option>
                        ))}
                      </optgroup>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Qabilah / Tempat Latihan (Opsional)</label>
                    <input 
                      type="text" 
                      value={formData.qabilah || ''}
                      onChange={(e) => setFormData({...formData, qabilah: e.target.value})}
                      placeholder="Contoh: Qabilah Ahmad Dahlan"
                      className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-3 px-4 font-bold text-sm outline-none" 
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Alamat Lengkap</label>
                    <textarea 
                      value={formData.alamat || ''}
                      onChange={(e) => setFormData({...formData, alamat: e.target.value})}
                      rows={2}
                      className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-3 px-4 font-bold text-sm focus:ring-4 focus:ring-hw-green/10 outline-none resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">No. HP/WA</label>
                      <input 
                        type="text" 
                        value={formData.noHp || ''}
                        onChange={(e) => setFormData({...formData, noHp: e.target.value})}
                        placeholder="08xxxx"
                        className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-3 px-4 font-bold text-sm outline-none" 
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Sosmed</label>
                      <input 
                        type="text" 
                        value={formData.sosmed || ''}
                        onChange={(e) => setFormData({...formData, sosmed: e.target.value})}
                        placeholder="@username"
                        className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-3 px-4 font-bold text-sm outline-none" 
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl mt-4">
                    <input 
                      type="checkbox" 
                      id="isVerified"
                      checked={formData.isVerified}
                      onChange={(e) => setFormData({...formData, isVerified: e.target.checked})}
                      className="w-5 h-5 rounded-lg accent-hw-green"
                    />
                    <label htmlFor="isVerified" className="text-xs font-bold text-gray-600 cursor-pointer">
                      Verifikasi Akun Otomatis
                    </label>
                  </div>
                </div>

                <div className="mt-8 flex gap-3">
                  <button 
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-4 bg-gray-100 text-gray-500 rounded-2xl font-black text-sm hover:bg-gray-200 transition-all"
                  >
                    Batal
                  </button>
                  <button 
                    onClick={handleSaveMember}
                    className="flex-[2] py-4 bg-hw-dark text-white rounded-2xl font-black text-sm shadow-xl shadow-hw-dark/20 hover:scale-[1.02] active:scale-95 transition-all"
                  >
                    Simpan Perubahan
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Materi CRUD Modal */}
      <AnimatePresence>
        {isMateriModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 py-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMateriModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div className="p-8">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-2xl font-display font-black text-gray-800">
                    {editingMateri ? 'Edit Materi' : 'Buat Materi Baru'}
                  </h3>
                  <button onClick={() => setIsMateriModalOpen(false)} className="p-3 bg-gray-50 text-gray-400 rounded-2xl hover:bg-gray-100">
                    <X size={20} />
                  </button>
                </div>

                <div className="space-y-4 max-h-[60vh] overflow-y-auto px-1 scrollbar-none">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Judul Materi</label>
                    <input 
                      type="text" 
                      value={materiFormData.judul || ''}
                      onChange={(e) => setMateriFormData({...materiFormData, judul: e.target.value})}
                      className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-3 px-4 font-bold text-sm focus:ring-4 focus:ring-hw-green/10 outline-none" 
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Kategori</label>
                    <select 
                      value={materiFormData.kategori || 'umum'}
                      onChange={(e) => setMateriFormData({...materiFormData, kategori: e.target.value})}
                      className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-3 px-4 font-bold text-sm outline-none"
                    >
                      <option value="umum">Umum</option>
                      <option value="umum_pandu">Umum Pandu</option>
                      <option value="kwarda">Kwarda</option>
                      <option value="sugli">Sugli</option>
                      <option value="jati1">Jati 1</option>
                      <option value="jati2">Jati 2</option>
                      <option value="jari1">Jari 1</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Isi Konten</label>
                    <textarea 
                      value={materiFormData.konten || ''}
                      onChange={(e) => setMateriFormData({...materiFormData, konten: e.target.value})}
                      rows={5}
                      className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-3 px-4 font-bold text-sm focus:ring-4 focus:ring-hw-green/10 outline-none resize-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">URL Gambar Cover</label>
                    <input 
                      type="text" 
                      value={materiFormData.coverImage || ''}
                      onChange={(e) => setMateriFormData({...materiFormData, coverImage: e.target.value})}
                      placeholder="https://..."
                      className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-3 px-4 font-bold text-sm outline-none" 
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">URL Google Drive (Download)</label>
                    <input 
                      type="text" 
                      value={materiFormData.driveUrl || ''}
                      onChange={(e) => setMateriFormData({...materiFormData, driveUrl: e.target.value})}
                      placeholder="https://drive.google.com/..."
                      className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-3 px-4 font-bold text-sm outline-none" 
                    />
                  </div>
                </div>

                <div className="mt-8 flex gap-3">
                  <button 
                    onClick={() => setIsMateriModalOpen(false)}
                    className="flex-1 py-4 bg-gray-100 text-gray-500 rounded-2xl font-black text-sm hover:bg-gray-200 transition-all"
                  >
                    Batal
                  </button>
                  <button 
                    onClick={handleSaveMateri}
                    className="flex-[2] py-4 bg-hw-dark text-white rounded-2xl font-black text-sm shadow-xl shadow-hw-dark/20 hover:scale-[1.02] active:scale-95 transition-all"
                  >
                    Simpan Materi
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL KONTEN (Galeri & Doa) */}
      <AnimatePresence>
        {isContentModalOpen && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsContentModalOpen(false)}
                className="absolute inset-0 bg-hw-dark/60 backdrop-blur-sm"
              />
              
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl overflow-hidden"
                onClick={e => e.stopPropagation()}
              >
                <div className="p-8">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h3 className="text-xl font-display font-black text-gray-800">
                        {editingContent ? 'Edit Item' : 'Tambah Item Baru'}
                      </h3>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Lengkapi data berikut</p>
                    </div>
                    <button 
                      onClick={() => setIsContentModalOpen(false)}
                      className="w-10 h-10 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-red-50 hover:text-red-500 transition-all"
                    >
                      <X size={20} />
                    </button>
                  </div>

                  <div className="space-y-4 max-h-[60vh] overflow-y-auto px-1 scrollbar-none">
                    {selectedContentSection === 'profil' && (
                      <div className="space-y-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">URL Gambar Header</label>
                          <input 
                            type="text"
                            value={contentFormData.field1 || ''}
                            onChange={(e) => setContentFormData({...contentFormData, field1: e.target.value})}
                            placeholder="https://..."
                            className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-3 px-4 font-bold text-sm outline-none focus:ring-2 focus:ring-hw-green/20" 
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Konten Profil</label>
                          <textarea 
                            rows={8}
                            value={contentFormData.field2 || ''}
                            onChange={(e) => setContentFormData({...contentFormData, field2: e.target.value})}
                            className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-3 px-4 font-bold text-sm h-48 outline-none focus:ring-2 focus:ring-hw-green/20"
                            placeholder="Isi konten profil..."
                          />
                        </div>
                      </div>
                    )}

                    {selectedContentSection === 'running-text' && (
                      <div className="space-y-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Teks Berjalan Beranda</label>
                          <textarea 
                            rows={4}
                            value={contentFormData.field1 || ''}
                            onChange={(e) => setContentFormData({...contentFormData, field1: e.target.value})}
                            className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-3 px-4 font-bold text-sm h-32 outline-none focus:ring-2 focus:ring-hw-green/20"
                            placeholder="Saat ini sedang migrasi data dari MATERIHW.COM ke aplikasi SATU HW JATENG, mohon dukungan dan supportnya, Salam HW!"
                          />
                          <p className="text-[10px] text-gray-400 mt-1">
                            * Teks ini akan berjalan di halaman depan tepat di atas kotak pencarian materi.
                          </p>
                        </div>
                      </div>
                    )}

                    {selectedContentSection === 'sosmed' && (
                      <div className="space-y-4">
                        {[
                          { label: 'Instagram Link/Username', field: 'field1', placeholder: '@username atau URL' },
                          { label: 'Tiktok Link/Username', field: 'field2', placeholder: '@username atau URL' },
                          { label: 'Youtube Link/ID', field: 'field3', placeholder: 'Channel ID atau URL' },
                          { label: 'Link Grup WhatsApp', field: 'field4', placeholder: 'https://chat.whatsapp.com/...' }
                        ].map((item) => (
                          <div key={`sosmed-modal-${item.field}`} className="space-y-1">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{item.label}</label>
                            <input 
                              type="text"
                              value={(contentFormData as any)[item.field] || ''}
                              onChange={(e) => setContentFormData({...contentFormData, [item.field]: e.target.value})}
                              placeholder={item.placeholder}
                              className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-3 px-4 font-bold text-sm outline-none focus:ring-2 focus:ring-hw-green/20" 
                            />
                          </div>
                        ))}
                      </div>
                    )}

                    {selectedContentSection === 'kontak' && (
                      <div className="space-y-4">
                        {[
                          { label: 'Nama Kontak', field: 'field1', placeholder: 'Kwarwil HW...' },
                          { label: 'Nomor WhatsApp', field: 'field2', placeholder: '628...' },
                          { label: 'Website', field: 'field3', placeholder: 'https://...' }
                        ].map((item) => (
                          <div key={`kontak-modal-${item.field}`} className="space-y-1">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{item.label}</label>
                            <input 
                              type="text"
                              value={(contentFormData as any)[item.field] || ''}
                              onChange={(e) => setContentFormData({...contentFormData, [item.field]: e.target.value})}
                              placeholder={item.placeholder}
                              className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-3 px-4 font-bold text-sm outline-none focus:ring-2 focus:ring-hw-green/20" 
                            />
                          </div>
                        ))}
                      </div>
                    )}

                    {selectedContentSection === 'galeri' && (
                      <div className="space-y-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Judul Video</label>
                          <input 
                            type="text" 
                            value={contentFormData.field2 || ''}
                            onChange={(e) => setContentFormData({...contentFormData, field2: e.target.value})}
                            placeholder="Judul Video..."
                            className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-3 px-4 font-bold text-sm outline-none focus:ring-2 focus:ring-hw-green/20" 
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">URL Video Youtube</label>
                          <input 
                            type="text" 
                            value={contentFormData.field1 || ''}
                            onChange={(e) => setContentFormData({...contentFormData, field1: e.target.value})}
                            placeholder="https://www.youtube.com/watch?v=..."
                            className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-3 px-4 font-bold text-sm outline-none focus:ring-2 focus:ring-hw-green/20" 
                          />
                        </div>
                      </div>
                    )}

                    {selectedContentSection === 'playlist' && (
                      <div className="space-y-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-gray-700 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                            <Music size={13} className="text-hw-green" />
                            Judul Audio / Lagu / Mars *
                          </label>
                          <input 
                            type="text" 
                            value={contentFormData.field2 || ''}
                            onChange={(e) => setContentFormData({...contentFormData, field2: e.target.value})}
                            placeholder="Contoh: Mars Hizbul Wathan"
                            className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-3 px-4 font-bold text-sm outline-none focus:ring-2 focus:ring-hw-green/20 focus:border-hw-green focus:bg-white transition-all" 
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-gray-700 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                            <Sparkles size={13} className="text-amber-500" />
                            Nama Pencipta / Penggubah
                          </label>
                          <input 
                            type="text" 
                            value={contentFormData.field3 || ''}
                            onChange={(e) => setContentFormData({...contentFormData, field3: e.target.value})}
                            placeholder="Contoh: Muhammad Dzikron / K.H. Siradj Dahlan"
                            className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-3 px-4 font-bold text-sm outline-none focus:ring-2 focus:ring-hw-green/20 focus:border-hw-green focus:bg-white transition-all" 
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-gray-700 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                            <LinkIcon size={13} className="text-blue-500" />
                            Link File Audio (Google Drive / Direct URL / MP3) *
                          </label>
                          <input 
                            type="text" 
                            value={contentFormData.field1 || ''}
                            onChange={(e) => setContentFormData({...contentFormData, field1: e.target.value})}
                            placeholder="https://drive.google.com/file/d/... atau https://domain.com/lagu.mp3"
                            className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-3 px-4 font-bold text-sm outline-none focus:ring-2 focus:ring-hw-green/20 focus:border-hw-green focus:bg-white transition-all" 
                          />
                          <p className="px-2 text-[9px] text-gray-400 font-bold italic">*Jika memakai Google Drive, pastikan link diatur &quot;Siapa saja yang memiliki link dapat melihat&quot;</p>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-gray-700 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                            <FileText size={13} className="text-emerald-600" />
                            Lirik Lagu (Teks Lirik Lengkap)
                          </label>
                          <textarea 
                            rows={7}
                            value={contentFormData.field5 || ''}
                            onChange={(e) => setContentFormData({...contentFormData, field5: e.target.value})}
                            placeholder="Tuliskan bait dan lirik lagu / mars secara lengkap per baris...&#10;&#10;Contoh:&#10;Hizbul Wathan yang bersemangat&#10;Menjunjung tinggi agama Islam..."
                            className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 font-medium text-xs sm:text-sm outline-none focus:ring-2 focus:ring-hw-green/20 focus:border-hw-green focus:bg-white font-mono leading-relaxed transition-all" 
                          />
                          <p className="px-2 text-[9px] text-emerald-700 font-medium">Lirik ini otomatis disinkronkan ke Spreadsheet dan langsung tampil pada tombol &quot;Lirik&quot; di pemutar musik.</p>
                        </div>
                      </div>
                    )}

                    <button 
                      onClick={handleSaveContent}
                      disabled={loading}
                      className="w-full py-4 bg-hw-green text-white rounded-2xl shadow-xl shadow-hw-green/20 font-black text-sm hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                    >
                      {loading ? 'Menyimpan...' : (editingContent ? 'Simpan Perubahan' : 'Tambahkan')}
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Reject KTA Remark Dialog */}
        <AnimatePresence>
          {isRejectModalOpen && (
            <div className="fixed inset-0 z-[150] flex items-center justify-center px-4 py-6">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsRejectModalOpen(false)}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden p-6 z-10"
              >
                <div className="space-y-4">
                  <div>
                    <h3 className="text-base font-black text-gray-800 uppercase tracking-wider">Alasan Penolakan KTA</h3>
                    <p className="text-xs text-gray-400 font-semibold leading-relaxed">
                      Silakan tuliskan penjelasan singkat mengapa dokumen pengajuan keanggotaan ini ditolak agar pengguna dapat mengunggah file revisi yang benar.
                    </p>
                  </div>
                  
                  <textarea 
                    value={rejectReason || ''}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Contoh: Foto kepala kurang jelas atau tidak portrait / Alamat Rumah tidak lengkap."
                    rows={3}
                    className="w-full p-3.5 bg-gray-50 border border-gray-250 rounded-xl focus:ring-2 focus:ring-rose-500/20 text-xs font-semibold outline-none resize-none"
                  />

                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => setIsRejectModalOpen(false)}
                      className="flex-1 py-3 bg-gray-50 hover:bg-gray-100 rounded-xl text-xs font-bold text-gray-500 transition-colors"
                    >
                      Batal
                    </button>
                    <button
                      onClick={handleRejectKTA}
                      className="flex-2 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-rose-600/10"
                    >
                      Kirim & Tolak Pengajuan
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Reject Training Remark Dialog */}
        <AnimatePresence>
          {isTrainingRejectModalOpen && (
            <div className="fixed inset-0 z-[150] flex items-center justify-center px-4 py-6">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsTrainingRejectModalOpen(false)}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden p-6 z-10"
              >
                <div className="space-y-4">
                  <div>
                    <h3 className="text-base font-black text-gray-800 uppercase tracking-wider">Alasan Penolakan Pendaftaran Pelatihan</h3>
                    <p className="text-xs text-gray-400 font-semibold leading-relaxed">
                      Silakan tuliskan penjelasan singkat mengapa pendaftaran pelatihan ini ditolak agar peserta mengetahuinya.
                    </p>
                  </div>
                  
                  <textarea 
                    value={trainingRejectReason || ''}
                    onChange={(e) => setTrainingRejectReason(e.target.value)}
                    placeholder="Contoh: Bukti transfer pembayaran tidak valid / salah nominal."
                    rows={3}
                    className="w-full p-3.5 bg-gray-50 border border-gray-250 rounded-xl focus:ring-2 focus:ring-rose-500/20 text-xs font-semibold outline-none resize-none"
                  />

                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => setIsTrainingRejectModalOpen(false)}
                      className="flex-1 py-3 bg-gray-50 hover:bg-gray-100 rounded-xl text-xs font-bold text-gray-500 transition-colors"
                    >
                      Batal
                    </button>
                    <button
                      onClick={handleRejectTraining}
                      className="flex-2 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-rose-600/10"
                    >
                      Kirim & Tolak Pendaftaran
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Grading and Remarks Modal */}
        <AnimatePresence>
          {isGradingModalOpen && selectedTrainingApp && (
            <div className="fixed inset-0 z-[150] flex items-center justify-center px-4 py-6">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => { setIsGradingModalOpen(false); setSelectedTrainingApp(null); }}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                className="relative w-full max-w-md bg-white rounded-[2rem] shadow-2xl overflow-hidden p-6 z-10"
              >
                <div className="space-y-5">
                  <div>
                    <h3 className="text-base font-black text-gray-800 uppercase tracking-wider">Penilaian & Ulasan Tugas</h3>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">Peserta: {selectedTrainingApp.nama}</p>
                  </div>

                  {/* Performance Analysis Card */}
                  {(() => {
                    const calc = getCalculatedGrading(selectedTrainingApp);
                    return (
                      <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-4 space-y-2 text-xs font-semibold text-emerald-800">
                        <div className="flex justify-between items-center pb-1.5 border-b border-emerald-100/50">
                          <span className="font-bold uppercase tracking-wider text-[10px] text-emerald-900">Analisis Penugasan & Presensi:</span>
                          <span className="text-[9px] bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded-full font-black uppercase tracking-wider">Auto Formula</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-[11px] text-emerald-700">
                          <div>• Presensi: <span className="font-extrabold text-emerald-900">{calc.attendancePercentage}%</span> <span className="text-[9px] text-emerald-600">({calc.attendedSessions}/{calc.totalSessions})</span></div>
                          <div>• Penugasan: <span className="font-extrabold text-emerald-900">{calc.assignmentPercentage}%</span> <span className="text-[9px] text-emerald-600">({calc.submittedAssignedCount}/{calc.totalAssignedTasks})</span></div>
                        </div>
                        <div className="flex justify-between items-center pt-1.5 border-t border-emerald-100/50 text-[11px] font-bold">
                          <div>Rata-rata Nilai Capaian: <span className="font-black text-emerald-950 text-sm">{calc.finalPercentage}%</span></div>
                        </div>
                      </div>
                    );
                  })()}

                  <div className="space-y-4">
                    {/* Nilai / Grade */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nilai / Predikat</label>
                      <input 
                        type="text" 
                        value={gradeInput || ''}
                        onChange={(e) => setGradeInput(e.target.value)}
                        placeholder="Contoh: A, B+, 85, Lulus Memuaskan, dll."
                        className="w-full bg-gray-50 border border-gray-150 rounded-2xl py-3 px-4 font-bold text-sm outline-none focus:ring-4 focus:ring-hw-green/10" 
                      />
                    </div>

                    {/* Status Kelulusan */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Status Kelulusan</label>
                      <select
                        value={graduationStatusInput || 'Lulus'}
                        onChange={(e) => setGraduationStatusInput(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-150 rounded-2xl py-3 px-4 font-bold text-xs text-gray-800 outline-none focus:ring-4 focus:ring-hw-green/10"
                      >
                        <option value="Lulus">Lulus</option>
                        <option value="Lulus Bersyarat">Lulus Bersyarat</option>
                        <option value="Tidak Lulus">Tidak Lulus</option>
                        <option value="Pending">Belum Ditentukan (Pending)</option>
                      </select>
                    </div>

                    {/* Ulasan / Remarks */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Ulasan / Catatan Pelatih</label>
                      <textarea 
                        value={remarkInput || ''}
                        onChange={(e) => setRemarkInput(e.target.value)}
                        placeholder="Tuliskan ulasan tugas atau pesan untuk peserta..."
                        rows={3}
                        className="w-full p-3.5 bg-gray-50 border border-gray-150 rounded-xl focus:ring-2 focus:ring-hw-green/20 text-xs font-semibold outline-none resize-none"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => { setIsGradingModalOpen(false); setSelectedTrainingApp(null); }}
                      className="flex-1 py-3 bg-gray-50 hover:bg-gray-100 rounded-xl text-xs font-bold text-gray-500 transition-colors"
                    >
                      Batal
                    </button>
                    <button
                      onClick={handleSaveGradeAndRemark}
                      className="flex-2 py-3 bg-hw-green hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-hw-green/10"
                    >
                      Simpan Penilaian
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Assign Task Modal */}
        <AnimatePresence>
          {showAssignTaskModal && assigningMateri && (
            <div className="fixed inset-0 z-[150] flex items-center justify-center px-4 py-6">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => { setShowAssignTaskModal(false); setAssigningMateri(null); }}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                className="relative w-full max-w-md bg-white rounded-[2rem] shadow-2xl overflow-hidden p-6 z-10"
              >
                <div className="space-y-5">
                  <div>
                    <h3 className="text-base font-black text-gray-800 uppercase tracking-wider">Berikan Penugasan Materi</h3>
                    <p className="text-[10px] text-hw-green font-bold uppercase tracking-widest mt-0.5">Tingkat: {selectedTugasProg} | {assigningMateri.judul}</p>
                  </div>

                  <div className="space-y-4">
                    {/* Instruksi Tugas */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Instruksi / Deskripsi Tugas</label>
                      <textarea 
                        value={assignTaskInstruksi || ''}
                        onChange={(e) => setAssignTaskInstruksi(e.target.value)}
                        placeholder="Contoh: Buatlah resume materi ini minimal 2 halaman PDF, unggah ke Google Drive lalu kumpulkan linknya di sini."
                        rows={4}
                        className="w-full p-3.5 bg-gray-50 border border-gray-150 rounded-xl focus:ring-2 focus:ring-hw-green/20 text-xs font-semibold outline-none resize-none"
                      />
                    </div>

                    {/* Batas Waktu / Deadline */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Batas Pengumpulan / Deadline</label>
                      <input 
                        type="text" 
                        value={assignTaskDeadline || ''}
                        onChange={(e) => setAssignTaskDeadline(e.target.value)}
                        placeholder="Contoh: 20 Juli 2026, 23:59 WIB"
                        className="w-full bg-gray-50 border border-gray-150 rounded-2xl py-3 px-4 font-bold text-sm outline-none focus:ring-4 focus:ring-hw-green/10" 
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => { setShowAssignTaskModal(false); setAssigningMateri(null); }}
                      className="flex-1 py-3 bg-gray-50 hover:bg-gray-100 rounded-xl text-xs font-bold text-gray-500 transition-colors"
                    >
                      Batal
                    </button>
                    {settings.assignedTasks?.some((t: any) => t.level === selectedTugasProg && String(t.materiId) === String(assigningMateri.id)) && (
                      <button
                        onClick={() => handleUnassignTask(selectedTugasProg, assigningMateri.id)}
                        className="flex-1 py-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-xs font-bold transition-all"
                      >
                        Tarik Tugas
                      </button>
                    )}
                    <button
                      onClick={() => handleAssignTask({
                        id: `task_${selectedTugasProg}_${assigningMateri.id}`,
                        level: selectedTugasProg,
                        materiId: assigningMateri.id,
                        materiJudul: assigningMateri.judul,
                        instruksi: assignTaskInstruksi,
                        deadline: assignTaskDeadline,
                        createdAt: new Date().toISOString()
                      })}
                      className="flex-2 py-3 bg-hw-green hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-hw-green/10"
                    >
                      Simpan & Berikan
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* ADD PARTICIPANT MODAL */}
        <AnimatePresence>
          {isAddParticipantModalOpen && (
            <div className="fixed inset-0 z-[150] flex items-center justify-center px-4 py-6 overflow-y-auto">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => { setIsAddParticipantModalOpen(false); setAddParticipantSelectedMemberId(''); }}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                className="relative w-full max-w-xl bg-white rounded-[2rem] shadow-2xl overflow-hidden p-6 z-10 max-h-[90vh] flex flex-col"
              >
                <div className="space-y-4 flex-1 overflow-y-auto pr-1 text-left">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                    <div>
                      <h3 className="text-base font-black text-gray-800 uppercase tracking-wider flex items-center gap-2">
                        <UserPlus className="text-hw-green" size={18} /> Tambah Peserta Pelatihan
                      </h3>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">Penambahan Peserta Manual dari Admin</p>
                    </div>
                    <button 
                      onClick={() => { setIsAddParticipantModalOpen(false); setAddParticipantSelectedMemberId(''); }}
                      className="p-2 hover:bg-gray-50 rounded-full transition-colors text-gray-400 hover:text-gray-600"
                    >
                      <X size={16} />
                    </button>
                  </div>

                  {/* Mode Selector Tabs */}
                  <div className="bg-gray-100 p-1 rounded-2xl grid grid-cols-2 gap-1 text-xs font-black uppercase tracking-wider">
                    <button
                      type="button"
                      onClick={() => setAddParticipantMode('select')}
                      className={`py-2 px-3 rounded-xl transition-all cursor-pointer ${
                        addParticipantMode === 'select'
                          ? 'bg-white text-hw-green shadow-xs'
                          : 'text-gray-500 hover:text-gray-800'
                      }`}
                    >
                      🔍 Pilih Anggota KTA
                    </button>
                    <button
                      type="button"
                      onClick={() => setAddParticipantMode('manual')}
                      className={`py-2 px-3 rounded-xl transition-all cursor-pointer ${
                        addParticipantMode === 'manual'
                          ? 'bg-white text-hw-green shadow-xs'
                          : 'text-gray-500 hover:text-gray-800'
                      }`}
                    >
                      ✍️ Input Peserta Baru
                    </button>
                  </div>

                  {addParticipantMode === 'select' ? (
                    <div className="space-y-4">
                      {/* Search Field */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Cari Anggota Terdaftar (KTA)</label>
                        <div className="relative">
                          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                          <input 
                            type="text" 
                            placeholder="Ketik nama, email, No. KTA, atau WhatsApp..."
                            value={addParticipantSearchQuery || ''}
                            onChange={(e) => setAddParticipantSearchQuery(e.target.value)}
                            className="w-full bg-gray-50 border border-gray-150 rounded-2xl py-2.5 pl-10 pr-9 font-bold text-xs outline-none focus:ring-4 focus:ring-hw-green/10 text-gray-800" 
                          />
                          {addParticipantSearchQuery && (
                            <button
                              type="button"
                              onClick={() => setAddParticipantSearchQuery('')}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-hw-green transition-colors cursor-pointer"
                            >
                              <X size={14} />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Selected Member Display */}
                      {addParticipantSelectedMemberId ? (
                        (() => {
                          const m = members.find(x => String(x.id) === String(addParticipantSelectedMemberId));
                          if (!m) return null;
                          const dispNbm = addParticipantForm.nbm || m.nbm || (m as any).noNbm || '-';
                          const dispTtl = formatTempatTanggalLahir(addParticipantForm.tempatLahir || m.tempatLahir, addParticipantForm.tanggalLahir || m.tanggalLahir);
                          const dispJk = (addParticipantForm.jenisKelamin === 'P' || m.jenisKelamin === 'P' || m.jenisKelamin === 'Perempuan') ? 'Perempuan' : 'Laki-Laki';

                          return (
                            <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-start gap-3">
                              <CheckCircle2 className="text-emerald-500 mt-0.5 shrink-0" size={16} />
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-extrabold text-emerald-900">{m.namaLengkap || m.nama}</p>
                                <p className="text-[10px] text-emerald-700 truncate">{m.email} | WA: {m.noHp || '-'}</p>
                                <p className="text-[10px] font-medium text-emerald-800 mt-1">
                                  No. KTA: <span className="font-bold">{dispNbm}</span> | TTL: <span className="font-bold">{dispTtl}</span> | JK: <span className="font-bold">{dispJk}</span>
                                </p>
                                <p className="text-[9px] text-emerald-600 font-bold uppercase tracking-wider mt-0.5">
                                  Kwarda: {addParticipantForm.asalDaerah || m.asalKwarda || '-'} | Qabilah: {addParticipantForm.qabilah || m.qabilah || '-'}
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() => setAddParticipantSelectedMemberId('')}
                                className="text-[9px] font-black uppercase text-rose-600 hover:text-rose-800 tracking-wider bg-rose-50 px-2 py-1 rounded-lg border border-rose-150/30 shrink-0"
                              >
                                Ganti
                              </button>
                            </div>
                          );
                        })()
                      ) : (
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Hasil Pencarian Anggota</label>
                          <div className="border border-gray-100 rounded-2xl divide-y divide-gray-50 max-h-40 overflow-y-auto bg-gray-50/50 p-1">
                            {members.filter(m => {
                              if (!addParticipantSearchQuery.trim()) return true;
                              const q = addParticipantSearchQuery.toLowerCase();
                              return (
                                String(m.namaLengkap || m.nama || '').toLowerCase().includes(q) ||
                                String(m.email || '').toLowerCase().includes(q) ||
                                String(m.noHp || '').includes(q) ||
                                String(m.nbm || (m as any).noNbm || '').includes(q)
                              );
                            }).slice(0, 10).length === 0 ? (
                              <p className="text-center text-[11px] font-bold text-gray-400 py-6">Tidak ada anggota terdaftar yang cocok</p>
                            ) : (
                              members.filter(m => {
                                if (!addParticipantSearchQuery.trim()) return true;
                                const q = addParticipantSearchQuery.toLowerCase();
                                return (
                                  String(m.namaLengkap || m.nama || '').toLowerCase().includes(q) ||
                                  String(m.email || '').toLowerCase().includes(q) ||
                                  String(m.noHp || '').includes(q) ||
                                  String(m.nbm || (m as any).noNbm || '').includes(q)
                                );
                              }).slice(0, 5).map(m => (
                                <button
                                  key={m.id}
                                  type="button"
                                  onClick={() => {
                                    setAddParticipantSelectedMemberId(m.id);
                                    setAddParticipantPelatihGolongan(m.pelatihGolongan || 'Tunas Athfal');
                                    
                                    const matchingKta = ktaApps.find(k => 
                                      (k.userId && String(k.userId) === String(m.id)) ||
                                      (k.email && m.email && k.email.toLowerCase().trim() === m.email.toLowerCase().trim()) ||
                                      (k.noWa && m.noHp && String(k.noWa).replace(/[^0-9]/g, '') === String(m.noHp).replace(/[^0-9]/g, '')) ||
                                      (k.nama && m.namaLengkap && k.nama.toLowerCase().trim() === m.namaLengkap.toLowerCase().trim())
                                    );

                                    const detectedNbm = m.nbm || m.noNbm || matchingKta?.nbm || matchingKta?.ktaNumber || matchingKta?.nomorKTA || m.ktaNumber || m.nomorKTA || '';
                                    const detectedTempat = m.tempatLahir || matchingKta?.tempatLahir || '';
                                    const detectedTanggal = m.tanggalLahir || matchingKta?.tanggalLahir || '';
                                    const detectedJkRaw = m.jenisKelamin || matchingKta?.jenisKelamin || 'L';
                                    const detectedJk = (detectedJkRaw === 'Perempuan' || detectedJkRaw === 'P') ? 'P' : 'L';
                                    const detectedPhoto = m.photo || matchingKta?.photo || '';
                                    const detectedAsal = m.asalKwarda || m.asalDaerah || matchingKta?.asalDaerah || '';
                                    const detectedQabilah = m.qabilah || matchingKta?.qabilah || '';

                                    setAddParticipantForm(prev => ({
                                      ...prev,
                                      nama: m.namaLengkap || m.nama || '',
                                      nbm: detectedNbm,
                                      email: m.email || matchingKta?.email || '',
                                      noWa: m.noHp || matchingKta?.noWa || '',
                                      tempatLahir: detectedTempat,
                                      tanggalLahir: detectedTanggal,
                                      jenisKelamin: detectedJk,
                                      asalDaerah: detectedAsal,
                                      qabilah: detectedQabilah,
                                      pendidikan: m.pendidikan || matchingKta?.pendidikan || '',
                                      photo: detectedPhoto,
                                      golonganAnggota: m.golongan || 'Pengenal'
                                    }));
                                  }}
                                  className="w-full p-2.5 flex items-center justify-between hover:bg-white rounded-xl text-left transition-colors cursor-pointer"
                                >
                                  <div>
                                    <p className="text-xs font-extrabold text-gray-800">{m.namaLengkap}</p>
                                    <p className="text-[10px] text-gray-500">{m.email} | WA: {m.noHp || '-'}</p>
                                  </div>
                                  <span className="text-[9px] font-black uppercase tracking-wider text-hw-green bg-hw-green/5 border border-hw-green/10 px-2 py-1 rounded-lg">Pilih</span>
                                </button>
                              ))
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Manual Entry Form */
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1 sm:col-span-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nama Lengkap *</label>
                        <input
                          type="text"
                          required
                          placeholder="Nama lengkap peserta..."
                          value={addParticipantForm.nama || ''}
                          onChange={(e) => setAddParticipantForm({ ...addParticipantForm, nama: e.target.value })}
                          className="w-full bg-gray-50 border border-gray-150 rounded-2xl py-2 px-3 font-bold text-xs outline-none focus:ring-4 focus:ring-hw-green/10 text-gray-800"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">No. WhatsApp *</label>
                        <input
                          type="text"
                          required
                          placeholder="08..."
                          value={addParticipantForm.noWa || ''}
                          onChange={(e) => setAddParticipantForm({ ...addParticipantForm, noWa: e.target.value })}
                          className="w-full bg-gray-50 border border-gray-150 rounded-2xl py-2 px-3 font-bold text-xs outline-none focus:ring-4 focus:ring-hw-green/10 text-gray-800"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Email</label>
                        <input
                          type="email"
                          placeholder="email@domain.com"
                          value={addParticipantForm.email || ''}
                          onChange={(e) => setAddParticipantForm({ ...addParticipantForm, email: e.target.value })}
                          className="w-full bg-gray-50 border border-gray-150 rounded-2xl py-2 px-3 font-bold text-xs outline-none focus:ring-4 focus:ring-hw-green/10 text-gray-800"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nomor KTA</label>
                        <input
                          type="text"
                          placeholder="Nomor KTA..."
                          value={addParticipantForm.nbm || ''}
                          onChange={(e) => setAddParticipantForm({ ...addParticipantForm, nbm: e.target.value })}
                          className="w-full bg-gray-50 border border-gray-150 rounded-2xl py-2 px-3 font-bold text-xs outline-none focus:ring-4 focus:ring-hw-green/10 text-gray-800"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Tempat Lahir</label>
                        <input
                          type="text"
                          placeholder="Kota/Kab lahir..."
                          value={addParticipantForm.tempatLahir || ''}
                          onChange={(e) => setAddParticipantForm({ ...addParticipantForm, tempatLahir: e.target.value })}
                          className="w-full bg-gray-50 border border-gray-150 rounded-2xl py-2 px-3 font-bold text-xs outline-none focus:ring-4 focus:ring-hw-green/10 text-gray-800"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Tanggal Lahir</label>
                        <input
                          type="date"
                          value={addParticipantForm.tanggalLahir || ''}
                          onChange={(e) => setAddParticipantForm({ ...addParticipantForm, tanggalLahir: e.target.value })}
                          className="w-full bg-gray-50 border border-gray-150 rounded-2xl py-2 px-3 font-bold text-xs outline-none focus:ring-4 focus:ring-hw-green/10 text-gray-800"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Jenis Kelamin</label>
                        <select
                          value={addParticipantForm.jenisKelamin || 'L'}
                          onChange={(e) => setAddParticipantForm({ ...addParticipantForm, jenisKelamin: e.target.value })}
                          className="w-full bg-gray-50 border border-gray-150 rounded-2xl py-2 px-3 font-bold text-xs outline-none focus:ring-4 focus:ring-hw-green/10 text-gray-800"
                        >
                          <option value="L">Laki-laki</option>
                          <option value="P">Perempuan</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Asal Kwarda</label>
                        <input
                          type="text"
                          placeholder="Asal Kwarda/Kabupaten..."
                          value={addParticipantForm.asalDaerah || ''}
                          onChange={(e) => setAddParticipantForm({ ...addParticipantForm, asalDaerah: e.target.value })}
                          className="w-full bg-gray-50 border border-gray-150 rounded-2xl py-2 px-3 font-bold text-xs outline-none focus:ring-4 focus:ring-hw-green/10 text-gray-800"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Qabilah</label>
                        <input
                          type="text"
                          placeholder="Qabilah/Sekolah..."
                          value={addParticipantForm.qabilah || ''}
                          onChange={(e) => setAddParticipantForm({ ...addParticipantForm, qabilah: e.target.value })}
                          className="w-full bg-gray-50 border border-gray-150 rounded-2xl py-2 px-3 font-bold text-xs outline-none focus:ring-4 focus:ring-hw-green/10 text-gray-800"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Golongan Anggota</label>
                        <select
                          value={addParticipantForm.golonganAnggota || 'Pengenal'}
                          onChange={(e) => setAddParticipantForm({ ...addParticipantForm, golonganAnggota: e.target.value })}
                          className="w-full bg-gray-50 border border-gray-150 rounded-2xl py-2 px-3 font-bold text-xs outline-none focus:ring-4 focus:ring-hw-green/10 text-gray-800"
                        >
                          {['Tunas Athfal', 'Athfal', 'Pengenal', 'Penghela', 'Penuntun', 'Dewasa'].map(g => (
                            <option key={g} value={g}>{g}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}

                  {/* Program Pelatihan & Status Section */}
                  <div className="bg-emerald-50/50 p-3.5 rounded-2xl border border-emerald-100 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-black text-emerald-900 uppercase tracking-wider">Pengaturan Program, Lokasi & Pembayaran</p>
                      <span className="text-[9px] font-extrabold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                        ✨ Auto-Detect
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      {/* Training Level / Activity Selection */}
                      <div className="space-y-1 sm:col-span-2">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Program / Kegiatan Pelatihan *</label>
                        <select 
                          value={addParticipantForm.pelatihanAkanDiikuti || ''}
                          onChange={(e) => handleAddParticipantTrainingChange(e.target.value)}
                          className="w-full bg-white border border-emerald-200 rounded-xl py-2 px-3 font-bold text-xs outline-none text-gray-800 focus:ring-2 focus:ring-emerald-400"
                        >
                          {getAvailableTrainingOptions().map(opt => (
                            <option key={opt.id} value={opt.name}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Pelatih Golongan */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Pelatih Golongan</label>
                        <select 
                          value={addParticipantForm.pelatihGolongan || 'Tunas Athfal'}
                          onChange={(e) => setAddParticipantForm({ ...addParticipantForm, pelatihGolongan: e.target.value })}
                          className="w-full bg-white border border-emerald-200 rounded-xl py-2 px-3 font-bold text-xs outline-none text-gray-800"
                        >
                          {['Tunas Athfal', 'Athfal', 'Pengenal', 'Penghela', 'Penuntun', 'Dewasa'].map(g => (
                            <option key={g} value={g}>{g}</option>
                          ))}
                        </select>
                      </div>

                      {/* Lokasi Pelatihan */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Lokasi Pelatihan / Tempat</label>
                          {addParticipantForm.lokasiPelatihan && (
                            <span className="text-[9px] font-black text-emerald-700">✓ Terdeteksi</span>
                          )}
                        </div>
                        <input 
                          type="text"
                          list="add-participant-locations-list"
                          value={addParticipantForm.lokasiPelatihan || ''}
                          onChange={(e) => setAddParticipantForm({ ...addParticipantForm, lokasiPelatihan: e.target.value })}
                          placeholder="misal: Pusdiklat HW Jateng..."
                          className="w-full bg-white border border-emerald-200 rounded-xl py-2 px-3 font-bold text-xs outline-none text-gray-800"
                        />
                        <datalist id="add-participant-locations-list">
                          {(settings.trainingLocations || ['Pusdiklat HW Jateng']).map((loc: string, idx: number) => (
                            <option key={idx} value={loc} />
                          ))}
                          {(settings.trainingActivities || []).map((act: any, idx: number) => (
                            act.lokasiPelatihan ? <option key={`act-loc-${idx}`} value={act.lokasiPelatihan} /> : null
                          ))}
                        </datalist>
                      </div>

                      {/* Tanggal Pelatihan */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Tanggal / Jadwal Pelatihan</label>
                          {addParticipantForm.tanggalPelatihan && (
                            <span className="text-[9px] font-black text-emerald-700">✓ Terdeteksi</span>
                          )}
                        </div>
                        <input 
                          type="text"
                          list="add-participant-dates-list"
                          value={addParticipantForm.tanggalPelatihan || ''}
                          onChange={(e) => setAddParticipantForm({ ...addParticipantForm, tanggalPelatihan: e.target.value })}
                          placeholder="misal: 15-18 Agustus 2026..."
                          className="w-full bg-white border border-emerald-200 rounded-xl py-2 px-3 font-bold text-xs outline-none text-gray-800"
                        />
                        <datalist id="add-participant-dates-list">
                          {(settings.trainingDates || ['Jadwal Reguler']).map((dt: string, idx: number) => (
                            <option key={idx} value={dt} />
                          ))}
                          {(settings.trainingActivities || []).map((act: any, idx: number) => (
                            act.tanggalPelatihan ? <option key={`act-dt-${idx}`} value={act.tanggalPelatihan} /> : null
                          ))}
                        </datalist>
                      </div>

                      {/* Biaya Pelatihan */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Biaya Pelatihan</label>
                          {addParticipantForm.biayaPelatihan && (
                            <span className="text-[9px] font-black text-emerald-700">✓ Terdeteksi</span>
                          )}
                        </div>
                        <input 
                          type="text"
                          list="add-participant-fees-list"
                          value={addParticipantForm.biayaPelatihan || ''}
                          onChange={(e) => setAddParticipantForm({ ...addParticipantForm, biayaPelatihan: e.target.value })}
                          placeholder="misal: Rp 50.000..."
                          className="w-full bg-white border border-emerald-200 rounded-xl py-2 px-3 font-bold text-xs outline-none text-gray-800"
                        />
                        <datalist id="add-participant-fees-list">
                          <option value="Rp 50.000" />
                          <option value="Rp 100.000" />
                          <option value="Rp 150.000" />
                          <option value="Rp 200.000" />
                          <option value="Gratis" />
                          {(settings.trainingActivities || []).map((act: any, idx: number) => (
                            act.biayaPelatihan ? <option key={`act-fee-${idx}`} value={act.biayaPelatihan} /> : null
                          ))}
                        </datalist>
                      </div>

                      {/* Status Pembayaran */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Status Pembayaran</label>
                        <select 
                          value={addParticipantForm.statusPembayaran || 'Lunas'}
                          onChange={(e) => setAddParticipantForm({ ...addParticipantForm, statusPembayaran: e.target.value })}
                          className="w-full bg-white border border-emerald-200 rounded-xl py-2 px-3 font-black text-xs outline-none text-emerald-900"
                        >
                          <option value="Lunas">💰 Lunas</option>
                          <option value="Belum Lunas">⏳ Belum Lunas</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2 border-t border-gray-100 shrink-0">
                    <button
                      type="button"
                      onClick={() => { setIsAddParticipantModalOpen(false); setAddParticipantSelectedMemberId(''); }}
                      className="flex-1 py-3 bg-gray-50 hover:bg-gray-100 rounded-xl text-xs font-bold text-gray-500 transition-colors cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      type="button"
                      onClick={handleAddParticipant}
                      disabled={isSubmittingAddParticipant || (addParticipantMode === 'select' && !addParticipantSelectedMemberId) || (addParticipantMode === 'manual' && !addParticipantForm.nama.trim())}
                      className="flex-2 py-3 bg-hw-green hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-hw-green/10 disabled:opacity-40 flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      {isSubmittingAddParticipant ? 'Mendaftarkan...' : 'Daftarkan Peserta'}
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* EDIT ACTIVITY PARTICIPANT MODAL */}
        <AnimatePresence>
          {isEditActivityParticipantModalOpen && editingActivityParticipant && (
            <div className="fixed inset-0 z-[150] flex items-center justify-center px-4 py-6 overflow-y-auto">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => { setIsEditActivityParticipantModalOpen(false); setEditingActivityParticipant(null); }}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                className="relative w-full max-w-2xl bg-white rounded-[2rem] shadow-2xl overflow-hidden p-6 z-10 max-h-[90vh] flex flex-col"
              >
                <div className="flex items-center justify-between border-b border-gray-100 pb-3 shrink-0">
                  <div>
                    <h3 className="text-base font-black text-gray-800 uppercase tracking-wider flex items-center gap-2">
                      ✏️ Edit Data Peserta Kegiatan
                    </h3>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">
                      Kelola dan perbarui data pendaftaran peserta kegiatan
                    </p>
                  </div>
                  <button 
                    onClick={() => { setIsEditActivityParticipantModalOpen(false); setEditingActivityParticipant(null); }}
                    className="p-2 hover:bg-gray-50 rounded-full transition-colors text-gray-400 hover:text-gray-600"
                  >
                    <X size={16} />
                  </button>
                </div>

                <form onSubmit={handleSaveActivityParticipant} className="space-y-4 overflow-y-auto my-4 pr-1 flex-1 text-left">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Nama Lengkap */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nama Lengkap *</label>
                      <input 
                        type="text"
                        required
                        value={editingActivityParticipant.namaLengkap || editingActivityParticipant.nama || ''}
                        onChange={(e) => setEditingActivityParticipant({ ...editingActivityParticipant, namaLengkap: e.target.value, nama: e.target.value })}
                        className="w-full bg-gray-50 border border-gray-150 rounded-2xl py-2.5 px-4 font-bold text-xs outline-none focus:ring-4 focus:ring-hw-green/10 text-gray-800"
                      />
                    </div>

                    {/* No WhatsApp */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">No. WhatsApp / HP *</label>
                      <input 
                        type="text"
                        required
                        value={editingActivityParticipant.noHp || editingActivityParticipant.noWa || ''}
                        onChange={(e) => setEditingActivityParticipant({ ...editingActivityParticipant, noHp: e.target.value, noWa: e.target.value })}
                        className="w-full bg-gray-50 border border-gray-150 rounded-2xl py-2.5 px-4 font-bold text-xs outline-none focus:ring-4 focus:ring-hw-green/10 text-gray-800"
                      />
                    </div>

                    {/* Unsur */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Unsur *</label>
                      <select 
                        value={editingActivityParticipant.unsur || 'Kwarwil HW Jateng'}
                        onChange={(e) => setEditingActivityParticipant({ 
                          ...editingActivityParticipant, 
                          unsur: e.target.value,
                          asalKwarda: e.target.value === 'Kwarda HW' ? (editingActivityParticipant.utusan || KWARDA_QABILAH_JATENG[0].name) : e.target.value
                        })}
                        className="w-full bg-gray-50 border border-gray-150 rounded-2xl py-2.5 px-4 font-bold text-xs outline-none focus:ring-4 focus:ring-hw-green/10 text-gray-800 cursor-pointer"
                      >
                        <option value="Kwarwil HW Jateng">Kwarwil HW Jateng</option>
                        <option value="DSW HW Jateng">DSW HW Jateng</option>
                        <option value="Kwarda HW">Kwarda HW</option>
                        <option value="Qabilah PTMA">Qabilah PTMA</option>
                        <option value="Luar Jawa Tengah">Luar Jawa Tengah</option>
                      </select>
                    </div>

                    {/* Utusan Kwarda HW (If Unsur === Kwarda HW) */}
                    {editingActivityParticipant.unsur === 'Kwarda HW' && (
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-emerald-700 uppercase tracking-widest ml-1">Utusan Kwarda HW (Se-Jawa Tengah) *</label>
                        <select 
                          value={editingActivityParticipant.utusan || editingActivityParticipant.asalKwarda || KWARDA_QABILAH_JATENG[0].name}
                          onChange={(e) => setEditingActivityParticipant({ ...editingActivityParticipant, utusan: e.target.value, asalKwarda: e.target.value })}
                          className="w-full bg-emerald-50/60 border border-emerald-200 rounded-2xl py-2.5 px-4 font-bold text-xs outline-none focus:ring-4 focus:ring-hw-green/10 text-emerald-900 cursor-pointer"
                        >
                          {KWARDA_QABILAH_JATENG.slice(0, 35).map((k) => (
                            <option key={k.code} value={k.name}>{k.name}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Qabilah PTMA (If Unsur === Qabilah PTMA) */}
                    {editingActivityParticipant.unsur === 'Qabilah PTMA' && (
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-emerald-700 uppercase tracking-widest ml-1">Daftar Qabilah PTMA (Se-Jawa Tengah) *</label>
                        <select 
                          value={editingActivityParticipant.qabilahPtma || editingActivityParticipant.qabilah || KWARDA_QABILAH_JATENG[35]?.name}
                          onChange={(e) => setEditingActivityParticipant({ ...editingActivityParticipant, qabilahPtma: e.target.value, qabilah: e.target.value })}
                          className="w-full bg-emerald-50/60 border border-emerald-200 rounded-2xl py-2.5 px-4 font-bold text-xs outline-none focus:ring-4 focus:ring-hw-green/10 text-emerald-900 cursor-pointer"
                        >
                          {KWARDA_QABILAH_JATENG.slice(35).map((q) => (
                            <option key={q.code} value={q.name}>{q.name}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Jabatan */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Jabatan *</label>
                      <select 
                        value={editingActivityParticipant.jabatan || 'Anggota'}
                        onChange={(e) => setEditingActivityParticipant({ ...editingActivityParticipant, jabatan: e.target.value })}
                        className="w-full bg-gray-50 border border-gray-150 rounded-2xl py-2.5 px-4 font-bold text-xs outline-none focus:ring-4 focus:ring-hw-green/10 text-gray-800 cursor-pointer"
                      >
                        <option value="Ketua">Ketua</option>
                        <option value="Wakil Ketua">Wakil Ketua</option>
                        <option value="Sekretaris">Sekretaris</option>
                        <option value="Wakil Sekretaris">Wakil Sekretaris</option>
                        <option value="Bendahara">Bendahara</option>
                        <option value="Wakil Bendahara">Wakil Bendahara</option>
                        <option value="Anggota">Anggota</option>
                      </select>
                    </div>

                    {/* Kategori Undangan */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Kategori Undangan *</label>
                      <select 
                        value={editingActivityParticipant.kategoriUndangan || 'Tidak Ada / Umum'}
                        onChange={(e) => setEditingActivityParticipant({ ...editingActivityParticipant, kategoriUndangan: e.target.value })}
                        className="w-full bg-gray-50 border border-gray-150 rounded-2xl py-2.5 px-4 font-bold text-xs outline-none focus:ring-4 focus:ring-hw-green/10 text-gray-800 cursor-pointer"
                      >
                        <option value="Tidak Ada / Umum">Tidak Ada / Umum</option>
                        <option value="Panitia">Panitia</option>
                        <option value="Pendamping">Pendamping</option>
                        <option value="Peserta">Peserta</option>
                        <option value="Pelatih Nasional HW Jateng">Pelatih Nasional HW Jateng</option>
                        <option value="Pandu Senior">Pandu Senior</option>
                        <option value="Alumni Jati 2 HW Jateng di Klaten">Alumni Jati 2 HW Jateng di Klaten</option>
                      </select>
                    </div>

                    {/* Pilih Kegiatan */}
                    <div className="space-y-1 md:col-span-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Kegiatan Yang Diikuti *</label>
                      <select
                        value={editingActivityParticipant.activityId || ''}
                        onChange={(e) => {
                          const act = activitiesList.find(a => a.id === e.target.value);
                          setEditingActivityParticipant({
                            ...editingActivityParticipant,
                            activityId: e.target.value,
                            namaKegiatan: act ? act.namaKegiatan : editingActivityParticipant.namaKegiatan
                          });
                        }}
                        className="w-full bg-gray-50 border border-gray-150 rounded-2xl py-2.5 px-4 font-bold text-xs outline-none focus:ring-4 focus:ring-hw-green/10 text-gray-800 cursor-pointer"
                      >
                        {activitiesList.map(a => (
                          <option key={a.id} value={a.id}>{a.namaKegiatan}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-4 border-t border-gray-100 shrink-0">
                    <button
                      type="button"
                      onClick={() => { setIsEditActivityParticipantModalOpen(false); setEditingActivityParticipant(null); }}
                      className="flex-1 py-3 bg-gray-50 hover:bg-gray-100 rounded-2xl text-xs font-bold text-gray-500 transition-colors cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 py-3 bg-hw-green hover:bg-emerald-700 text-white rounded-2xl text-xs font-bold transition-colors flex items-center justify-center gap-2 shadow-lg shadow-hw-green/20 cursor-pointer"
                    >
                      {loading ? <Loader2 size={16} className="animate-spin" /> : 'Simpan Perubahan'}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* EDIT PARTICIPANT MODAL */}
        <AnimatePresence>
          {isEditTrainingModalOpen && editingTrainingApp && (
            <div className="fixed inset-0 z-[150] flex items-center justify-center px-4 py-6 overflow-y-auto">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => { setIsEditTrainingModalOpen(false); setEditingTrainingApp(null); }}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                className="relative w-full max-w-2xl bg-white rounded-[2rem] shadow-2xl overflow-hidden p-6 z-10 max-h-[90vh] flex flex-col"
              >
                <div className="flex items-center justify-between border-b border-gray-100 pb-3 shrink-0">
                  <div>
                    <h3 className="text-base font-black text-gray-800 uppercase tracking-wider flex items-center gap-2">
                      ✏️ Edit Data Peserta Pelatihan
                    </h3>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">
                      Perubahan Otomatis Sinkron ke Data Anggota (KTA)
                    </p>
                  </div>
                  <button 
                    onClick={() => { setIsEditTrainingModalOpen(false); setEditingTrainingApp(null); }}
                    className="p-2 hover:bg-gray-50 rounded-full transition-colors text-gray-400 hover:text-gray-600"
                  >
                    <X size={16} />
                  </button>
                </div>

                <form onSubmit={handleSaveEditTraining} className="space-y-4 overflow-y-auto my-4 pr-1 flex-1 text-left">
                  {/* Photo Preview and Upload */}
                  <div className="bg-gray-50 p-4 rounded-2xl border border-gray-150 flex flex-col sm:flex-row items-center gap-4">
                    <div className="w-20 h-24 bg-white rounded-xl overflow-hidden border border-gray-200 shrink-0 shadow-xs flex items-center justify-center">
                      {editingTrainingApp.photo ? (
                        <img src={editingTrainingApp.photo} alt="Foto Peserta" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <UserIcon size={32} className="text-gray-300" />
                      )}
                    </div>
                    <div className="space-y-2 w-full text-xs">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Foto Peserta (URL atau Unggah File)</label>
                      <input 
                        type="text"
                        placeholder="https://... atau data:image/..."
                        value={editingTrainingApp.photo || ''}
                        onChange={(e) => setEditingTrainingApp({ ...editingTrainingApp, photo: e.target.value })}
                        className="w-full bg-white border border-gray-200 rounded-xl py-2 px-3 font-medium text-xs outline-none focus:ring-2 focus:ring-hw-green/20 text-gray-800"
                      />
                      <div className="flex items-center gap-2">
                        <label className="px-3 py-1.5 bg-hw-green/10 text-hw-green hover:bg-hw-green/20 rounded-xl font-bold text-[10px] cursor-pointer uppercase tracking-wider inline-flex items-center gap-1 transition-all">
                          <Upload size={13} />
                          <span>Pilih Foto dari Perangkat</span>
                          <input 
                            type="file" 
                            accept="image/*" 
                            className="hidden" 
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                  setEditingTrainingApp({ ...editingTrainingApp, photo: reader.result as string });
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                        </label>
                        {editingTrainingApp.photo && (
                          <button
                            type="button"
                            onClick={() => setEditingTrainingApp({ ...editingTrainingApp, photo: '' })}
                            className="text-[10px] text-rose-600 font-bold hover:underline"
                          >
                            Hapus Foto
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Nama Lengkap */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nama Lengkap</label>
                      <input 
                        type="text"
                        required
                        value={editingTrainingApp.nama || ''}
                        onChange={(e) => setEditingTrainingApp({ ...editingTrainingApp, nama: e.target.value })}
                        className="w-full bg-gray-50 border border-gray-150 rounded-2xl py-2.5 px-4 font-bold text-xs outline-none focus:ring-4 focus:ring-hw-green/10 text-gray-800"
                      />
                    </div>

                    {/* Email */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Email</label>
                      <input 
                        type="email"
                        required
                        value={editingTrainingApp.email || ''}
                        onChange={(e) => setEditingTrainingApp({ ...editingTrainingApp, email: e.target.value })}
                        className="w-full bg-gray-50 border border-gray-150 rounded-2xl py-2.5 px-4 font-bold text-xs outline-none focus:ring-4 focus:ring-hw-green/10 text-gray-800"
                      />
                    </div>

                    {/* No WhatsApp */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">No. WhatsApp</label>
                      <input 
                        type="text"
                        required
                        value={editingTrainingApp.noWa || ''}
                        onChange={(e) => setEditingTrainingApp({ ...editingTrainingApp, noWa: e.target.value })}
                        className="w-full bg-gray-50 border border-gray-150 rounded-2xl py-2.5 px-4 font-bold text-xs outline-none focus:ring-4 focus:ring-hw-green/10 text-gray-800"
                      />
                    </div>

                    {/* Nomor KTA (Tidak Dapat Diedit / Fixed) */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nomor KTA</label>
                        <span className="text-[9px] font-extrabold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">🔒 Fixed</span>
                      </div>
                      <input 
                        type="text"
                        readOnly
                        disabled
                        value={editingTrainingApp.nbm || editingTrainingApp.ktaNumber || editingTrainingApp.nomorKTA || '-'}
                        placeholder="Nomor KTA..."
                        className="w-full bg-gray-100 border border-gray-200 rounded-2xl py-2.5 px-4 font-extrabold text-xs text-gray-500 cursor-not-allowed select-none"
                      />
                    </div>

                    {/* Jenis Kelamin */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Jenis Kelamin</label>
                      <select 
                        value={editingTrainingApp.jenisKelamin || 'L'}
                        onChange={(e) => setEditingTrainingApp({ ...editingTrainingApp, jenisKelamin: e.target.value })}
                        className="w-full bg-gray-50 border border-gray-150 rounded-2xl py-2.5 px-4 font-bold text-xs outline-none focus:ring-4 focus:ring-hw-green/10 text-gray-800"
                      >
                        <option value="L">Laki-laki</option>
                        <option value="P">Perempuan</option>
                      </select>
                    </div>

                    {/* Asal Daerah */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Asal Daerah (Kabupaten/Kwarda)</label>
                      <input 
                        type="text"
                        value={editingTrainingApp.asalDaerah || ''}
                        onChange={(e) => setEditingTrainingApp({ ...editingTrainingApp, asalDaerah: e.target.value })}
                        className="w-full bg-gray-50 border border-gray-150 rounded-2xl py-2.5 px-4 font-bold text-xs outline-none focus:ring-4 focus:ring-hw-green/10 text-gray-800"
                      />
                    </div>

                    {/* Qabilah */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Qabilah</label>
                      <input 
                        type="text"
                        value={editingTrainingApp.qabilah || ''}
                        onChange={(e) => setEditingTrainingApp({ ...editingTrainingApp, qabilah: e.target.value })}
                        className="w-full bg-gray-50 border border-gray-150 rounded-2xl py-2.5 px-4 font-bold text-xs outline-none focus:ring-4 focus:ring-hw-green/10 text-gray-800"
                      />
                    </div>

                    {/* Pelatihan Akan Diikuti */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Pelatihan Akan Diikuti *</label>
                      <select 
                        value={editingTrainingApp.pelatihanAkanDiikuti || ''}
                        onChange={(e) => handleEditParticipantTrainingChange(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-150 rounded-2xl py-2.5 px-4 font-bold text-xs outline-none focus:ring-4 focus:ring-hw-green/10 text-gray-800 cursor-pointer"
                      >
                        {getAvailableTrainingOptions().map(opt => (
                          <option key={opt.id} value={opt.name}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Pelatih Golongan */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Pelatih Golongan</label>
                      <select 
                        value={editingTrainingApp.pelatihGolongan || 'Tunas Athfal'}
                        onChange={(e) => setEditingTrainingApp({ ...editingTrainingApp, pelatihGolongan: e.target.value })}
                        className="w-full bg-gray-50 border border-gray-150 rounded-2xl py-2.5 px-4 font-bold text-xs outline-none focus:ring-4 focus:ring-hw-green/10 text-gray-800"
                      >
                        {['Tunas Athfal', 'Athfal', 'Pengenal', 'Penghela', 'Penuntun', 'Dewasa'].map(g => (
                          <option key={g} value={g}>{g}</option>
                        ))}
                      </select>
                    </div>

                    {/* Golongan Anggota (Pilihan Golongan Sesuai Data Anggota) */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Golongan Anggota</label>
                      <select 
                        value={editingTrainingApp.golonganAnggota || editingTrainingApp.tingkatan || 'Pengenal'}
                        onChange={(e) => setEditingTrainingApp({ ...editingTrainingApp, golonganAnggota: e.target.value, tingkatan: e.target.value })}
                        className="w-full bg-gray-50 border border-gray-150 rounded-2xl py-2.5 px-4 font-extrabold text-xs outline-none focus:ring-4 focus:ring-hw-green/10 text-gray-800"
                      >
                        {['Tunas Athfal', 'Athfal', 'Pengenal', 'Penghela', 'Penuntun', 'Dewasa'].map(g => (
                          <option key={g} value={g}>{g}</option>
                        ))}
                      </select>
                    </div>

                    {/* Lokasi Pelatihan */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Lokasi Pelatihan / Tempat</label>
                      <input 
                        type="text"
                        list="edit-participant-locations-list"
                        value={editingTrainingApp.lokasiPelatihan || ''}
                        onChange={(e) => setEditingTrainingApp({ ...editingTrainingApp, lokasiPelatihan: e.target.value })}
                        placeholder="misal: Pusdiklat HW Jateng..."
                        className="w-full bg-gray-50 border border-gray-150 rounded-2xl py-2.5 px-4 font-bold text-xs outline-none focus:ring-4 focus:ring-hw-green/10 text-gray-800"
                      />
                      <datalist id="edit-participant-locations-list">
                        {(settings.trainingLocations || ['Pusdiklat HW Jateng']).map((loc: string, idx: number) => (
                          <option key={idx} value={loc} />
                        ))}
                        {(settings.trainingActivities || []).map((act: any, idx: number) => (
                          act.lokasiPelatihan ? <option key={`act-loc-edit-${idx}`} value={act.lokasiPelatihan} /> : null
                        ))}
                      </datalist>
                    </div>

                    {/* Tanggal Pelatihan */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Tanggal / Jadwal Pelatihan</label>
                      <input 
                        type="text"
                        list="edit-participant-dates-list"
                        value={editingTrainingApp.tanggalPelatihan || ''}
                        onChange={(e) => setEditingTrainingApp({ ...editingTrainingApp, tanggalPelatihan: e.target.value })}
                        placeholder="misal: 15-18 Agustus 2026..."
                        className="w-full bg-gray-50 border border-gray-150 rounded-2xl py-2.5 px-4 font-bold text-xs outline-none focus:ring-4 focus:ring-hw-green/10 text-gray-800"
                      />
                      <datalist id="edit-participant-dates-list">
                        {(settings.trainingDates || ['Jadwal Reguler']).map((dt: string, idx: number) => (
                          <option key={idx} value={dt} />
                        ))}
                        {(settings.trainingActivities || []).map((act: any, idx: number) => (
                          act.tanggalPelatihan ? <option key={`act-dt-edit-${idx}`} value={act.tanggalPelatihan} /> : null
                        ))}
                      </datalist>
                    </div>

                    {/* Biaya Pelatihan */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Biaya Pelatihan</label>
                      <input 
                        type="text"
                        list="edit-participant-fees-list"
                        value={editingTrainingApp.biayaPelatihan || 'Rp 50.000'}
                        onChange={(e) => setEditingTrainingApp({ ...editingTrainingApp, biayaPelatihan: e.target.value })}
                        className="w-full bg-gray-50 border border-gray-150 rounded-2xl py-2.5 px-4 font-bold text-xs outline-none focus:ring-4 focus:ring-hw-green/10 text-gray-800"
                      />
                      <datalist id="edit-participant-fees-list">
                        <option value="Rp 50.000" />
                        <option value="Rp 100.000" />
                        <option value="Rp 150.000" />
                        <option value="Rp 200.000" />
                        <option value="Gratis" />
                        {(settings.trainingActivities || []).map((act: any, idx: number) => (
                          act.biayaPelatihan ? <option key={`act-fee-edit-${idx}`} value={act.biayaPelatihan} /> : null
                        ))}
                      </datalist>
                    </div>

                    {/* DIPISAHKAN AGAR LEBIH MENYOLOK: STATUS VERIFIKASI PENDAFTARAN & STATUS PEMBAYARAN */}
                    <div className="col-span-1 md:col-span-2 mt-2 space-y-3">
                      <div className="text-[11px] font-black uppercase tracking-wider text-gray-500 border-b border-gray-100 pb-1">
                        📌 Status Pendaftaran & Pembayaran (Dipisahkan)
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Status Verifikasi Pendaftaran Box */}
                        <div className="p-4 rounded-2xl bg-blue-50/70 border-2 border-blue-200 space-y-2 shadow-xs">
                          <div className="flex items-center justify-between">
                            <label className="text-[11px] font-black text-blue-900 uppercase tracking-wider flex items-center gap-1.5">
                              <span>📋 STATUS VERIFIKASI PENDAFTARAN</span>
                            </label>
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider ${
                              editingTrainingApp.status === 'approved' ? 'bg-emerald-100 text-emerald-800' :
                              editingTrainingApp.status === 'rejected' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                            }`}>
                              {editingTrainingApp.status === 'approved' ? 'Disetujui' : editingTrainingApp.status === 'rejected' ? 'Ditolak' : 'Menunggu'}
                            </span>
                          </div>
                          <select 
                            value={editingTrainingApp.status || 'approved'}
                            onChange={(e) => setEditingTrainingApp({ ...editingTrainingApp, status: e.target.value })}
                            className="w-full bg-white border border-blue-300 rounded-xl py-2.5 px-3 font-extrabold text-xs outline-none focus:ring-2 focus:ring-blue-400 text-blue-950 cursor-pointer shadow-2xs"
                          >
                            <option value="approved">✅ Disetujui (Approved)</option>
                            <option value="pending">⏳ Menunggu Verifikasi (Pending)</option>
                            <option value="rejected">❌ Ditolak (Rejected)</option>
                          </select>
                        </div>

                        {/* Status Pembayaran / Pelunasan Box */}
                        <div className="p-4 rounded-2xl bg-emerald-50/70 border-2 border-emerald-200 space-y-2 shadow-xs">
                          <div className="flex items-center justify-between">
                            <label className="text-[11px] font-black text-emerald-900 uppercase tracking-wider flex items-center gap-1.5">
                              <span>💰 STATUS PEMBAYARAN / PELUNASAN</span>
                            </label>
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider ${
                              editingTrainingApp.statusPembayaran === 'Lunas' ? 'bg-emerald-200 text-emerald-900' : 'bg-amber-200 text-amber-900'
                            }`}>
                              {editingTrainingApp.statusPembayaran || 'Lunas'}
                            </span>
                          </div>
                          <select 
                            value={editingTrainingApp.statusPembayaran || (editingTrainingApp.status === 'approved' ? 'Lunas' : 'Belum Lunas')}
                            onChange={(e) => setEditingTrainingApp({ ...editingTrainingApp, statusPembayaran: e.target.value })}
                            className="w-full bg-white border border-emerald-300 rounded-xl py-2.5 px-3 font-extrabold text-xs outline-none focus:ring-2 focus:ring-emerald-400 text-emerald-950 cursor-pointer shadow-2xs"
                          >
                            <option value="Lunas">💰 Lunas (Terverifikasi)</option>
                            <option value="Belum Lunas">⏳ Belum Lunas</option>
                            <option value="Menunggu Pelunasan">⌛ Menunggu Pelunasan (DP)</option>
                            <option value="Gratis">🎁 Gratis / Beasiswa</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Catatan Keterangan Pembayaran */}
                    <div className="col-span-1 md:col-span-2 space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Catatan / Keterangan Pembayaran</label>
                      <input 
                        type="text"
                        value={editingTrainingApp.catatanPembayaran || ''}
                        onChange={(e) => setEditingTrainingApp({ ...editingTrainingApp, catatanPembayaran: e.target.value })}
                        placeholder="misal: Transfer via BSI a.n Ahmad tgl 12 Agustus 2026..."
                        className="w-full bg-gray-50 border border-gray-150 rounded-2xl py-2.5 px-4 font-bold text-xs outline-none focus:ring-4 focus:ring-hw-green/10 text-gray-800"
                      />
                    </div>

                    {/* Bukti Transfer / Pembayaran Upload/URL */}
                    <div className="col-span-1 md:col-span-2 space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Bukti Transfer / Pembayaran</label>
                      <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
                        <input 
                          type="text"
                          value={editingTrainingApp.buktiBayar || ''}
                          onChange={(e) => setEditingTrainingApp({ ...editingTrainingApp, buktiBayar: e.target.value })}
                          placeholder="Link gambar / URL bukti transfer..."
                          className="flex-1 w-full bg-gray-50 border border-gray-150 rounded-2xl py-2.5 px-4 font-bold text-xs outline-none focus:ring-4 focus:ring-hw-green/10 text-gray-800"
                        />
                        <label className="px-3 py-2.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-2xl font-black text-xs cursor-pointer shrink-0 transition-all flex items-center gap-1.5">
                          <Upload size={14} />
                          <span>Upload Foto</span>
                          <input 
                            type="file" 
                            accept="image/*" 
                            className="hidden" 
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onload = (uploadEvt) => {
                                  setEditingTrainingApp({
                                    ...editingTrainingApp,
                                    buktiBayar: uploadEvt.target?.result as string
                                  });
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                        </label>
                      </div>
                      {editingTrainingApp.buktiBayar && (
                        <div className="mt-2 p-2 bg-gray-50 border border-gray-200 rounded-xl inline-block">
                          <p className="text-[9px] font-black text-gray-400 uppercase mb-1">Pratinjau Bukti Transfer:</p>
                          <a href={editingTrainingApp.buktiBayar} target="_blank" rel="noopener noreferrer">
                            <img src={editingTrainingApp.buktiBayar} alt="Bukti Transfer" className="h-24 max-w-full object-cover rounded-lg border border-gray-200 shadow-2xs hover:opacity-90" />
                          </a>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2 pt-4 border-t border-gray-100 shrink-0">
                    <button
                      type="button"
                      onClick={() => { setIsEditTrainingModalOpen(false); setEditingTrainingApp(null); }}
                      className="flex-1 py-3 bg-gray-50 hover:bg-gray-100 rounded-xl text-xs font-bold text-gray-500 transition-colors"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-2 py-3 bg-hw-green hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-hw-green/10 disabled:opacity-40 flex items-center justify-center gap-1.5"
                    >
                      {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* PIAGAM CERTIFICATE PREVIEW MODAL */}
        <AnimatePresence>
          {isPiagamModalOpen && piagamParticipant && (
            <div className="fixed inset-0 z-[120] flex items-center justify-center px-4 py-6 overflow-y-auto">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => { setIsPiagamModalOpen(false); setPiagamParticipant(null); }}
                className="absolute inset-0 bg-black/75 backdrop-blur-sm"
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                className="relative w-full max-w-4xl bg-stone-100 rounded-[2rem] shadow-2xl overflow-hidden p-8 z-10 my-8"
              >
                {/* Close Button */}
                <button 
                  onClick={() => { setIsPiagamModalOpen(false); setPiagamParticipant(null); }} 
                  className="absolute top-4 right-4 p-3 bg-white/80 hover:bg-white text-gray-500 rounded-full shadow transition-all z-20"
                >
                  <X size={20} />
                </button>

                <div className="flex flex-col gap-6">
                  <div className="flex justify-between items-center border-b border-stone-200 pb-4">
                    <div>
                      <h3 className="text-lg font-black text-stone-800 uppercase tracking-wider font-display">Pratinjau Piagam Penghargaan</h3>
                      <p className="text-xs text-stone-500 font-bold uppercase tracking-widest mt-0.5">Program Pelatihan {piagamParticipant.pelatihanAkanDiikuti}</p>
                    </div>
                    <button
                      onClick={() => window.print()}
                      className="px-5 py-2.5 bg-hw-green hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 shadow shadow-hw-green/10"
                    >
                      <Printer size={14} /> Cetak Piagam
                    </button>
                  </div>

                  {/* Beautiful Print Area */}
                  <div className="bg-stone-50 border-8 border-double border-amber-800/60 p-12 rounded-2xl relative shadow-inner overflow-hidden flex flex-col items-center text-center aspect-[1.414/1] w-full max-w-3xl mx-auto">
                    {/* Background decoration watermark */}
                    <div className="absolute inset-0 opacity-[0.03] pointer-events-none flex items-center justify-center">
                      <img src="https://upload.wikimedia.org/wikipedia/id/b/ba/Logo_Hizbul_Wathan.png" className="w-[350px] h-[350px] object-contain" alt="watermark" />
                    </div>

                    {/* Header */}
                    <div className="flex flex-col items-center space-y-2">
                      <img src="https://upload.wikimedia.org/wikipedia/id/b/ba/Logo_Hizbul_Wathan.png" className="w-16 h-16 object-contain" alt="logo hw" />
                      <h4 className="font-serif text-amber-950 font-black tracking-widest text-[10px] uppercase">KWARWIL HIZBUL WATHAN JAWA TENGAH</h4>
                      <div className="w-24 h-0.5 bg-amber-800/40" />
                    </div>

                    {/* Main Title */}
                    <div className="my-6">
                      <h2 className="font-serif text-3xl font-black text-amber-900 uppercase tracking-widest leading-none">PIAGAM PENGHARGAAN</h2>
                      <p className="text-[10px] font-mono text-stone-500 font-bold uppercase tracking-widest mt-2">Nomor: HW-JT/PLT/{new Date().getFullYear()}/{piagamParticipant.id.slice(0, 4).toUpperCase()}</p>
                    </div>

                    {/* Given To */}
                    <div className="space-y-4 my-4 flex-1 flex flex-col justify-center">
                      <p className="text-stone-500 font-serif italic text-xs">Dengan ini diberikan penghargaan setinggi-tingginya kepada:</p>
                      <h1 className="font-serif text-3xl font-black text-stone-850 underline decoration-amber-800/40 decoration-wavy underline-offset-8">
                        {piagamParticipant.nama}
                      </h1>
                      <p className="text-stone-600 font-serif italic text-xs max-w-lg leading-relaxed mx-auto">
                        Atas kelulusan dan partisipasi aktifnya sebagai peserta dalam Pelatihan tingkat <strong className="text-amber-900 not-italic uppercase font-extrabold">{piagamParticipant.pelatihanAkanDiikuti}</strong> yang diselenggarakan oleh Kwartir Wilayah Gerakan Kepanduan Hizbul Wathan Jawa Tengah.
                      </p>
                    </div>

                    {/* Signature block */}
                    <div className="grid grid-cols-2 w-full max-w-xl gap-8 mt-6 pt-6 border-t border-stone-200/50">
                      <div className="flex flex-col items-center">
                        <span className="text-[8px] font-bold text-stone-400 uppercase tracking-wider">Ketua Kwarwil HW Jateng</span>
                        <div className="h-10 flex items-center justify-center relative">
                          {/* Simulated signature stamp */}
                          <div className="absolute w-12 h-12 rounded-full border border-teal-600/30 bg-teal-500/5 rotate-12 flex items-center justify-center text-[7px] text-teal-600/70 font-black tracking-widest uppercase">STAMP</div>
                        </div>
                        <span className="text-[10px] font-black text-stone-850 underline">Ramanda H. Taufik</span>
                        <span className="text-[8px] font-bold text-stone-400 uppercase">NBM. 1.092.348</span>
                      </div>
                      <div className="flex flex-col items-center">
                        <span className="text-[8px] font-bold text-stone-400 uppercase tracking-wider">Sekretaris Kwarwil</span>
                        <div className="h-10" />
                        <span className="text-[10px] font-black text-stone-850 underline">Ramanda Ahmad</span>
                        <span className="text-[8px] font-bold text-stone-400 uppercase">NBM. 1.104.922</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* EDIT KTA MODAL */}
        <AnimatePresence>
          {isEditKtaModalOpen && editingKtaApp && (
            <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={() => { setIsEditKtaModalOpen(false); setEditingKtaApp(null); }}
              />
              
              <motion.div 
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white rounded-[2rem] p-6 max-w-[550px] w-full z-[130] border border-gray-100 shadow-2xl overflow-y-auto max-h-[90vh] relative"
              >
                <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-4">
                  <div className="flex items-center gap-2">
                    <Edit2 size={18} className="text-hw-green" />
                    <h3 className="text-sm font-black text-gray-800 uppercase tracking-wider font-display">Edit Data KTA HW</h3>
                  </div>
                  <button 
                    onClick={() => { setIsEditKtaModalOpen(false); setEditingKtaApp(null); }}
                    className="p-1.5 hover:bg-gray-50 rounded-xl text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>

                <form onSubmit={handleSaveEditKTA} className="space-y-4 text-xs font-semibold text-gray-700">
                  <div className="grid grid-cols-1 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Nama Lengkap</label>
                      <input 
                        type="text" 
                        required
                        value={editingKtaApp.nama || ''}
                        onChange={(e) => setEditingKtaApp({ ...editingKtaApp, nama: e.target.value })}
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200/50 rounded-xl focus:ring-2 focus:ring-hw-green/20 outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Tingkatan HW</label>
                      <select 
                        value={editingKtaApp.tingkatan || 'Penghela'}
                        onChange={(e) => setEditingKtaApp({ ...editingKtaApp, tingkatan: e.target.value })}
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200/50 rounded-xl focus:ring-2 focus:ring-hw-green/20 outline-none"
                      >
                        {['Tunas Athfal', 'Athfal', 'Pengenal', 'Penghela', 'Penuntun', 'Dewasa'].map(lvl => (
                          <option key={lvl} value={lvl}>{lvl}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Asal Kabupaten/Kwarda</label>
                      <select 
                        value={editingKtaApp.asalDaerah || KABUPATEN_KOTA_JATENG[0]}
                        onChange={(e) => setEditingKtaApp({ ...editingKtaApp, asalDaerah: e.target.value })}
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200/50 rounded-xl focus:ring-2 focus:ring-hw-green/20 outline-none"
                      >
                        {KABUPATEN_KOTA_JATENG.map(kab => {
                          const item = KWARDA_QABILAH_JATENG.find(x => x.name === kab);
                          const displayLabel = item ? `${parseInt(item.code, 10)}. ${item.name}` : kab;
                          return (
                            <option key={kab} value={kab}>{displayLabel}</option>
                          );
                        })}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Asal Qabilah (Sekolah / Pangkalan PTMA) (Opsional)</label>
                    <input 
                      type="text" 
                      value={editingKtaApp.qabilah || ''}
                      onChange={(e) => setEditingKtaApp({ ...editingKtaApp, qabilah: e.target.value })}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200/50 rounded-xl focus:ring-2 focus:ring-hw-green/20 outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Nomor WhatsApp</label>
                      <input 
                        type="text" 
                        required
                        value={editingKtaApp.noWa || ''}
                        onChange={(e) => setEditingKtaApp({ ...editingKtaApp, noWa: e.target.value })}
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200/50 rounded-xl focus:ring-2 focus:ring-hw-green/20 outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Email</label>
                      <input 
                        type="email" 
                        required
                        value={editingKtaApp.email || ''}
                        onChange={(e) => setEditingKtaApp({ ...editingKtaApp, email: e.target.value })}
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200/50 rounded-xl focus:ring-2 focus:ring-hw-green/20 outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Alamat Rumah Lengkap</label>
                    <textarea 
                      required
                      rows={2}
                      value={editingKtaApp.alamat || ''}
                      onChange={(e) => setEditingKtaApp({ ...editingKtaApp, alamat: e.target.value })}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200/50 rounded-xl focus:ring-2 focus:ring-hw-green/20 outline-none resize-none font-sans"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Tempat Lahir</label>
                      <input 
                        type="text" 
                        value={editingKtaApp.tempatLahir || ''}
                        onChange={(e) => setEditingKtaApp({ ...editingKtaApp, tempatLahir: e.target.value })}
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200/50 rounded-xl focus:ring-2 focus:ring-hw-green/20 outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Tanggal Lahir</label>
                      <input 
                        type="date" 
                        value={editingKtaApp.tanggalLahir || ''}
                        onChange={(e) => setEditingKtaApp({ ...editingKtaApp, tanggalLahir: e.target.value })}
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200/50 rounded-xl focus:ring-2 focus:ring-hw-green/20 outline-none font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Jenis Kelamin</label>
                      <select 
                        value={editingKtaApp.jenisKelamin || 'Laki-laki'}
                        onChange={(e) => setEditingKtaApp({ ...editingKtaApp, jenisKelamin: e.target.value })}
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200/50 rounded-xl focus:ring-2 focus:ring-hw-green/20 outline-none"
                      >
                        <option value="Laki-laki">Laki-laki</option>
                        <option value="Perempuan">Perempuan</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Sosial Media</label>
                      <input 
                        type="text" 
                        value={editingKtaApp.sosmed || ''}
                        onChange={(e) => setEditingKtaApp({ ...editingKtaApp, sosmed: e.target.value })}
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200/50 rounded-xl focus:ring-2 focus:ring-hw-green/20 outline-none"
                        placeholder="@username"
                      />
                    </div>
                  </div>

                  {/* Foto KTA Section */}
                  <div className="flex flex-col items-center justify-center py-4 bg-gray-50/50 rounded-3xl border border-dashed border-gray-200">
                    <div className="relative group w-20 h-20 rounded-2xl bg-gray-100 flex items-center justify-center border-4 border-white shadow-md overflow-hidden text-gray-300">
                      {editingKtaApp.photo ? (
                        <img src={editingKtaApp.photo} alt="Foto KTA" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <UserIcon size={30} />
                      )}
                      <button
                        type="button"
                        onClick={() => ktaPhotoInputRef.current?.click()}
                        className="absolute inset-0 bg-black/40 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                        title="Ubah Foto KTA"
                      >
                        <Camera size={16} />
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => ktaPhotoInputRef.current?.click()}
                      className="mt-2 px-3 py-1 bg-white border border-gray-200 rounded-lg text-[10px] font-black text-gray-600 hover:bg-gray-50 transition-all uppercase tracking-wider shadow-sm cursor-pointer"
                    >
                      Pilih Foto KTA
                    </button>
                    <input 
                      type="file"
                      ref={ktaPhotoInputRef}
                      onChange={handleKtaPhotoChange}
                      accept="image/*"
                      className="hidden"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">URL Foto Anggota</label>
                    <input 
                      type="text" 
                      value={editingKtaApp.photo || ''}
                      onChange={(e) => setEditingKtaApp({ ...editingKtaApp, photo: e.target.value })}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200/50 rounded-xl focus:ring-2 focus:ring-hw-green/20 outline-none font-mono"
                      placeholder="https://drive.google.com/..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3 bg-gray-50 p-3 rounded-2xl border border-gray-150">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Jenis KTA</label>
                      <select 
                        value={editingKtaApp.jenisKta || 'Digital'}
                        onChange={(e) => setEditingKtaApp({ ...editingKtaApp, jenisKta: e.target.value })}
                        className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-hw-green/20 outline-none text-hw-green"
                      >
                        <option value="Digital">Digital</option>
                        <option value="Fisik">Fisik</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Status Pengajuan</label>
                      <select 
                        value={editingKtaApp.status || 'pending'}
                        onChange={(e) => setEditingKtaApp({ ...editingKtaApp, status: e.target.value })}
                        className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-hw-green/20 outline-none"
                      >
                        <option value="pending">Menunggu (Pending)</option>
                        <option value="approved">Disetujui (Approved)</option>
                        <option value="rejected">Ditolak (Rejected)</option>
                      </select>
                    </div>
                  </div>

                  {editingKtaApp.status === 'approved' && (
                    <div className="space-y-1 bg-green-50 p-3 rounded-2xl border border-green-100">
                      <label className="text-[10px] font-black uppercase text-green-700 tracking-wider">Nomor Anggota KTA</label>
                      <div className="flex gap-2">
                        <input 
                          type="text" 
                          required
                          value={editingKtaApp.ktaNumber || ''}
                          onChange={(e) => setEditingKtaApp({ ...editingKtaApp, ktaNumber: e.target.value })}
                          className="flex-1 px-4 py-2.5 bg-white border border-green-200 rounded-xl focus:ring-2 focus:ring-hw-green/20 outline-none font-mono font-bold text-gray-800"
                        />
                        <button 
                          type="button"
                          onClick={() => {
                            const selectedUnit = editingKtaApp.asalDaerah || '';
                            const found = KWARDA_QABILAH_JATENG.find(item => item.name === selectedUnit);
                            const unitCode = found ? found.code : '02'; // default Banyumas '02'
                            
                            const sameUnitApps = ktaApps.filter(item => {
                              if (item.status !== 'approved' || !item.ktaNumber) return false;
                              const parts = item.ktaNumber.split('.');
                              return parts.length === 3 && parts[0] === '11' && parts[1] === unitCode;
                            });
                            
                            let nextSeq = 1;
                            if (sameUnitApps.length > 0) {
                              const seqs = sameUnitApps.map(item => {
                                const parts = item.ktaNumber.split('.');
                                const parsed = parseInt(parts[2], 10);
                                return isNaN(parsed) ? 0 : parsed;
                              });
                              const maxSeq = Math.max(...seqs);
                              nextSeq = maxSeq + 1;
                            }
                            const seqStr = nextSeq.toString().padStart(4, '0');
                            const num = `11.${unitCode}.${seqStr}`;
                            setEditingKtaApp({ ...editingKtaApp, ktaNumber: num });
                          }}
                          className="px-3 bg-hw-green text-white rounded-xl hover:bg-emerald-700 font-bold transition-all text-[11px]"
                        >
                          Generate
                        </button>
                      </div>
                    </div>
                  )}

                  {editingKtaApp.status === 'rejected' && (
                    <div className="space-y-1 bg-rose-50 p-3 rounded-2xl border border-rose-100">
                      <label className="text-[10px] font-black uppercase text-rose-700 tracking-wider">Alasan Penolakan</label>
                      <input 
                        type="text" 
                        required
                        placeholder="Masukkan alasan penolakan..."
                        value={editingKtaApp.remark || ''}
                        onChange={(e) => setEditingKtaApp({ ...editingKtaApp, remark: e.target.value })}
                        className="w-full px-4 py-2.5 bg-white border border-rose-200 rounded-xl focus:ring-2 focus:ring-hw-green/20 outline-none"
                      />
                    </div>
                  )}

                  <div className="flex gap-2 justify-end pt-2 border-t border-gray-100">
                    <button 
                      type="button"
                      onClick={() => { setIsEditKtaModalOpen(false); setEditingKtaApp(null); }}
                      className="px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl hover:bg-gray-100 text-gray-500 font-bold text-[11px]"
                    >
                      Batal
                    </button>
                    <button 
                      type="submit"
                      className="px-5 py-2.5 bg-hw-green text-white rounded-xl hover:bg-emerald-700 font-bold transition-all shadow-md shadow-emerald-800/10 text-[11px]"
                    >
                      Simpan Perubahan
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* KWARDA MEMBER DETAIL MODAL */}
        <AnimatePresence>
          {selectedKwardaModal && (
            <div className="fixed inset-0 z-[130] flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                onClick={() => { setSelectedKwardaModal(null); setKwardaModalSearch(''); }}
              />
              
              <motion.div 
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white rounded-[2rem] p-6 max-w-[900px] w-full z-[140] border border-gray-100 shadow-2xl overflow-y-auto max-h-[90vh] relative text-gray-800"
              >
                {/* Modal Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-gray-100 pb-4 mb-4 gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <MapPin size={18} className="text-hw-green" />
                      <h3 className="text-sm font-black text-gray-800 uppercase tracking-wider font-display">
                        Daftar Anggota KTA - {selectedKwardaModal}
                      </h3>
                    </div>
                    <p className="text-[11px] text-gray-500 mt-0.5 font-medium">
                      Verifikasi dan kelola penomoran KTA untuk wilayah {selectedKwardaModal}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button 
                      onClick={() => { setSelectedKwardaModal(null); setKwardaModalSearch(''); }}
                      className="p-1.5 hover:bg-gray-100 rounded-xl text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <X size={20} />
                    </button>
                  </div>
                </div>

                {/* Modal Filter and Stats Bar */}
                {(() => {
                  const kwardaApps = ktaApps.filter(app => 
                    (app.asalDaerah || app.qabilah || '').toLowerCase().trim() === selectedKwardaModal.toLowerCase().trim() ||
                    (app.asalDaerah || '').toLowerCase().includes(selectedKwardaModal.toLowerCase().trim())
                  );
                  const searchFiltered = kwardaApps.filter(app => {
                    const q = kwardaModalSearch.toLowerCase().trim();
                    if (!q) return true;
                    return (app.nama || '').toLowerCase().includes(q) ||
                           (app.ktaNumber || '').toLowerCase().includes(q) ||
                           (app.email || '').toLowerCase().includes(q) ||
                           (app.qabilah || '').toLowerCase().includes(q);
                  }).sort((a,b) => compareByKtaSequence(a, b));

                  const approvedCount = kwardaApps.filter(a => a.status === 'approved').length;
                  const pendingCount = kwardaApps.filter(a => a.status === 'pending').length;

                  return (
                    <div className="space-y-4">
                      {/* Search Bar & Summary Pills */}
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-gray-50 p-3 rounded-2xl border border-gray-100">
                        <div className="relative w-full sm:w-72">
                          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
                          <input 
                            type="text" 
                            placeholder="Cari anggota / no. KTA..." 
                            value={kwardaModalSearch || ''}
                            onChange={(e) => setKwardaModalSearch(e.target.value)}
                            className="w-full bg-white border border-gray-200 rounded-xl py-2 pl-9 pr-8 text-xs outline-none focus:ring-2 focus:ring-hw-green/20"
                          />
                          {kwardaModalSearch && (
                            <button onClick={() => setKwardaModalSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                              <X size={14} />
                            </button>
                          )}
                        </div>

                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-3 py-1 rounded-xl bg-white border border-gray-200 text-[11px] font-bold text-gray-700 shadow-2xs">
                            Total: <strong>{kwardaApps.length}</strong>
                          </span>
                          <span className="px-3 py-1 rounded-xl bg-emerald-50 border border-emerald-200 text-[11px] font-bold text-emerald-800 shadow-2xs">
                            Resmi Aktif: <strong>{approvedCount}</strong>
                          </span>
                          <span className="px-3 py-1 rounded-xl bg-amber-50 border border-amber-200 text-[11px] font-bold text-amber-800 shadow-2xs">
                            Menunggu: <strong>{pendingCount}</strong>
                          </span>
                        </div>
                      </div>

                      {/* Member Table */}
                      <div className="overflow-x-auto rounded-2xl border border-gray-150">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="bg-gray-100/70 border-b border-gray-150 text-[10px] font-black uppercase text-gray-500 tracking-wider">
                              <th className="p-3 pl-4">No</th>
                              <th className="p-3">Foto</th>
                              <th className="p-3">Nama Lengkap & WA</th>
                              <th className="p-3">Qabilah / Pangkalan</th>
                              <th className="p-3">Tingkatan</th>
                              <th className="p-3">No. KTA HW</th>
                              <th className="p-3 text-center">Status</th>
                              <th className="p-3 pr-4 text-center">Aksi</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100 font-semibold text-gray-750">
                            {searchFiltered.length === 0 ? (
                              <tr>
                                <td colSpan={8} className="p-8 text-center text-gray-400 font-bold uppercase text-[10px]">
                                  Tidak ada anggota KTA yang sesuai di wilayah ini
                                </td>
                              </tr>
                            ) : (
                              searchFiltered.map((app, idx) => (
                                <tr key={app.id} className="hover:bg-gray-50/60 transition-colors">
                                  <td className="p-3 pl-4 font-mono font-bold text-gray-400 text-[11px]">{idx + 1}</td>
                                  <td className="p-3">
                                    <div className="w-8 h-10 bg-gray-100 rounded overflow-hidden border border-gray-200">
                                      {app.photo ? (
                                        <img src={app.photo} alt="Foto" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                      ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                                          <UserIcon size={16} />
                                        </div>
                                      )}
                                    </div>
                                  </td>
                                  <td className="p-3">
                                    <div className="font-extrabold text-gray-900">{app.nama}</div>
                                    <div className="text-[10px] text-hw-green font-mono">{app.noWa || app.email}</div>
                                  </td>
                                  <td className="p-3 text-[11px] text-gray-600 font-medium">
                                    {app.qabilah || '-'}
                                  </td>
                                  <td className="p-3">
                                    <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 text-[10px] font-bold border border-amber-100">
                                      {app.tingkatan || 'Pengenal'}
                                    </span>
                                  </td>
                                  <td className="p-3 font-mono font-bold text-xs text-emerald-900">
                                    {app.ktaNumber ? (
                                      <span className="bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                        {app.ktaNumber}
                                      </span>
                                    ) : (
                                      <span className="text-gray-300 italic text-[10px]">- Belum ada -</span>
                                    )}
                                  </td>
                                  <td className="p-3 text-center">
                                    {app.status === 'approved' ? (
                                      <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-800 text-[10px] font-black uppercase">
                                        Resmi
                                      </span>
                                    ) : app.status === 'pending' ? (
                                      <span className="px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800 text-[10px] font-black uppercase">
                                        Pending
                                      </span>
                                    ) : (
                                      <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-black uppercase">
                                        Ditolak
                                      </span>
                                    )}
                                  </td>
                                  <td className="p-3 pr-4 text-center">
                                    <div className="flex items-center justify-center gap-1">
                                      <button
                                        onClick={() => {
                                          setSelectedKwardaModal(null);
                                          setViewingKtaApp(app);
                                          setIsViewKtaModalOpen(true);
                                          setFlippedAdmin(false);
                                        }}
                                        className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg transition-colors"
                                        title="Preview KTA"
                                      >
                                        <Eye size={14} />
                                      </button>
                                      <button
                                        onClick={() => {
                                          setSelectedKwardaModal(null);
                                          setEditingKtaApp(app);
                                          setIsEditKtaModalOpen(true);
                                        }}
                                        className="p-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg transition-colors"
                                        title="Edit Data KTA"
                                      >
                                        <Edit2 size={14} />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })()}
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* VIEW/PRINT KTA MODAL */}
        <AnimatePresence>
          {isViewKtaModalOpen && viewingKtaApp && (
            <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                onClick={() => { setIsViewKtaModalOpen(false); setViewingKtaApp(null); }}
              />
              
              <motion.div 
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-stone-900 rounded-[2rem] p-6 max-w-[850px] w-full z-[130] border border-white/10 shadow-2xl overflow-y-auto max-h-[95vh] relative text-white"
              >
                {/* Modal Header */}
                <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
                  <div className="flex items-center gap-2">
                    <Printer size={18} className="text-hw-green" />
                    <h3 className="text-sm font-black uppercase tracking-wider font-display">Preview & Cetak KTA HW</h3>
                  </div>
                  <button 
                    onClick={() => { setIsViewKtaModalOpen(false); setViewingKtaApp(null); }}
                    className="p-1.5 hover:bg-white/5 rounded-xl text-stone-400 hover:text-white transition-colors cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* HIDDEN CAPTURE CONTAINER FOR ADMIN PDF GENERATION */}
                {viewingKtaApp && (
                  <div 
                    id="kta-print-capture-admin" 
                    className="fixed pointer-events-none" 
                    style={{ position: 'fixed', left: '-9999px', top: '-9999px', opacity: 1, pointerEvents: 'none', zIndex: -9999 }}
                  >
                    <KTACard 
                      id="kta-front-capture-admin" 
                      application={viewingKtaApp} 
                      settings={settings} 
                      side="front" 
                      idSuffix="admin-front-capture"
                      photoOverride={viewingKtaApp.photo || members.find(m => m.email && viewingKtaApp.email && m.email.toLowerCase() === viewingKtaApp.email.toLowerCase())?.photo}
                    />
                    <KTACard 
                      id="kta-back-capture-admin" 
                      application={viewingKtaApp} 
                      settings={settings} 
                      side="back" 
                      idSuffix="admin-back-capture"
                    />
                  </div>
                )}

                {/* Main Grid: Card Previews side-by-side or stacked */}
                <div className="flex flex-col items-center gap-6 overflow-x-auto pb-4 print-area">
                  <div className="flex flex-wrap justify-center gap-6">
                    {/* FRONT CARD */}
                    <div className="flex flex-col items-center gap-2 shrink-0">
                      <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest font-mono print:hidden">TAMPILAN DEPAN (FRONT)</span>
                      <KTACard 
                        id="kta-front-card-admin-view"
                        application={viewingKtaApp} 
                        settings={settings} 
                        side="front" 
                        idSuffix="admin-modal-front"
                        photoOverride={viewingKtaApp.photo || members.find(m => m.email && viewingKtaApp.email && m.email.toLowerCase() === viewingKtaApp.email.toLowerCase())?.photo}
                      />
                    </div>

                    {/* BACK CARD */}
                    <div className="flex flex-col items-center gap-2 shrink-0">
                      <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest font-mono print:hidden">TAMPILAN BELAKANG (BACK)</span>
                      <KTACard 
                        id="kta-back-card-admin-view"
                        application={viewingKtaApp} 
                        settings={settings} 
                        side="back" 
                        idSuffix="admin-modal-back"
                      />
                    </div>
                  </div>
                </div>

                {/* Modal Footer Controls */}
                <div className="flex flex-wrap gap-2 justify-between items-center pt-4 border-t border-white/10 mt-6 print:hidden">
                  <div className="flex gap-2">
                    <button 
                      onClick={() => { setIsViewKtaModalOpen(false); setViewingKtaApp(null); }}
                      className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold text-xs rounded-xl transition-all cursor-pointer"
                    >
                      Tutup
                    </button>
                    {viewingKtaApp.status === 'pending' && (
                      <>
                        <button 
                          onClick={async () => {
                            await handleApproveKTA(viewingKtaApp.id);
                            setIsViewKtaModalOpen(false);
                            setViewingKtaApp(null);
                          }}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl transition-all flex items-center gap-1 cursor-pointer"
                        >
                          Approve & Terbitkan KTA
                        </button>
                        <button 
                          onClick={() => {
                            const appId = viewingKtaApp.id;
                            setIsViewKtaModalOpen(false);
                            setViewingKtaApp(null);
                            handleOpenRejectKTA(appId);
                          }}
                          className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-black text-xs rounded-xl transition-all flex items-center gap-1 cursor-pointer"
                        >
                          Tolak Pengajuan
                        </button>
                      </>
                    )}
                    <button 
                      onClick={async () => {
                        const appId = viewingKtaApp.id;
                        const appName = viewingKtaApp.nama || 'Data Tidak Valid';
                        setIsViewKtaModalOpen(false);
                        setViewingKtaApp(null);
                        await handleDeleteKtaApp(appId, appName);
                      }}
                      className="px-4 py-2 bg-rose-700 hover:bg-rose-800 text-white font-black text-xs rounded-xl transition-all flex items-center gap-1 cursor-pointer"
                      title="Hapus paksa data ini dari sistem"
                    >
                      <Trash2 size={14} /> Hapus Paksa Data
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button 
                      type="button"
                      onClick={() => window.print()}
                      className="px-4 py-2.5 bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold text-xs rounded-xl transition-all border border-stone-700 flex items-center gap-1.5 cursor-pointer"
                    >
                      <Printer size={13} />
                      Cetak Kartu (Print)
                    </button>
                    <button 
                      disabled={isGeneratingPdfAdmin}
                      onClick={handleDownloadPDFAdmin}
                      className="px-5 py-2.5 bg-hw-green text-white hover:bg-emerald-700 font-black text-xs rounded-xl transition-all shadow-md shadow-emerald-900/20 flex items-center gap-2 cursor-pointer disabled:opacity-55"
                    >
                      {isGeneratingPdfAdmin ? (
                        <>
                          <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Sedang Mengunduh...
                        </>
                      ) : (
                        <>
                          <Download size={13} />
                          Download KTA (PDF Resmi)
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* MODAL KEGIATAN PELATIHAN */}
        {isActivityModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-5 border border-gray-100 shadow-2xl animate-fade-in">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <h3 className="font-display font-black text-sm text-gray-800 uppercase tracking-wider">
                  {editingActivityId ? 'Edit Kegiatan Pelatihan' : 'Tambah Kegiatan Pelatihan Baru'}
                </h3>
                <button
                  type="button"
                  onClick={() => setIsActivityModalOpen(false)}
                  className="p-1 text-gray-400 hover:text-gray-600 rounded-lg cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-4 text-xs font-semibold">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Nama Kegiatan Pelatihan</label>
                  <input
                    type="text"
                    placeholder="Contoh: Pelatihan Jaya Melati 1/2 HW Jateng"
                    value={activityForm.namaKegiatan || ''}
                    onChange={(e) => setActivityForm(prev => ({ ...prev, namaKegiatan: e.target.value }))}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-hw-green/20"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Jenis Pelatihan</label>
                    <select
                      value={activityForm.jenisPelatihan || 'Jaya Melati 1'}
                      onChange={(e) => setActivityForm(prev => ({ ...prev, jenisPelatihan: e.target.value }))}
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-hw-green/20"
                    >
                      {(settings.trainingTypes || ['Jaya Melati 1', 'Jaya Melati 2', 'Jaya Matahari 1']).map((t: string) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Status Pendaftaran</label>
                    <select
                      value={activityForm.status || 'Buka'}
                      onChange={(e) => setActivityForm(prev => ({ ...prev, status: e.target.value as any }))}
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-hw-green/20"
                    >
                      <option value="Buka">Buka Pendaftaran</option>
                      <option value="Tutup">Tutup Pendaftaran</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Tempat / Lokasi Pelaksanaan</label>
                  <input
                    type="text"
                    placeholder="Contoh: Pusdiklat HW Jateng / Gedung Dakwah Muhammadiyah Jateng"
                    value={activityForm.lokasiPelatihan || ''}
                    onChange={(e) => setActivityForm(prev => ({ ...prev, lokasiPelatihan: e.target.value }))}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-hw-green/20"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Waktu / Tanggal Pelaksanaan</label>
                  <input
                    type="text"
                    placeholder="Contoh: 12-14 Juli 2026"
                    value={activityForm.tanggalPelatihan || ''}
                    onChange={(e) => setActivityForm(prev => ({ ...prev, tanggalPelatihan: e.target.value }))}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-hw-green/20"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Biaya Pelatihan</label>
                  <input
                    type="text"
                    placeholder="Contoh: Rp 150.000"
                    value={activityForm.biayaPelatihan || ''}
                    onChange={(e) => setActivityForm(prev => ({ ...prev, biayaPelatihan: e.target.value }))}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-hw-green/20"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Rekening Pembiayaan / Pembayaran</label>
                  <input
                    type="text"
                    placeholder="Contoh: Bank Syariah Indonesia (BSI) 7307427448 a.n. Kwarwil HW Jateng"
                    value={activityForm.rekeningPembiayaan || ''}
                    onChange={(e) => setActivityForm(prev => ({ ...prev, rekeningPembiayaan: e.target.value }))}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-hw-green/20"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Nomor WhatsApp Panitia (Konfirmasi Transfer)</label>
                  <input
                    type="text"
                    placeholder="Contoh: 089688754000"
                    value={activityForm.noWhatsappPanitia || ''}
                    onChange={(e) => setActivityForm(prev => ({ ...prev, noWhatsappPanitia: e.target.value }))}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-hw-green/20"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Link / File Proposal Kegiatan</label>
                    <label className="text-[10px] font-bold text-sky-700 hover:text-sky-900 cursor-pointer underline flex items-center gap-1">
                      <Upload size={10} />
                      Unggah File
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx"
                        className="hidden"
                        onChange={e => {
                          const f = e.target.files?.[0];
                          if (f) {
                            handleDocumentFileUpload(
                              f,
                              base64 => setActivityForm(prev => ({ ...prev, proposalUrl: base64 })),
                              err => alert(err)
                            );
                            e.target.value = '';
                          }
                        }}
                      />
                    </label>
                  </div>
                  <input
                    type="text"
                    placeholder="Contoh: https://drive.google.com/file/d/... atau upload PDF"
                    value={activityForm.proposalUrl || ''}
                    onChange={(e) => setActivityForm(prev => ({ ...prev, proposalUrl: e.target.value }))}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-hw-green/20 text-xs font-semibold"
                  />
                  {activityForm.proposalUrl && activityForm.proposalUrl.startsWith('data:') && (
                    <div className="flex items-center justify-between bg-emerald-100/80 text-emerald-800 text-[10px] px-2.5 py-1 rounded-lg border border-emerald-300 font-bold">
                      <span>✓ File proposal terunggah ({Math.round(activityForm.proposalUrl.length / 1024)} KB)</span>
                      <button
                        type="button"
                        onClick={() => setActivityForm(prev => ({ ...prev, proposalUrl: '' }))}
                        className="text-red-600 hover:underline text-[9px] font-extrabold cursor-pointer"
                      >
                        Hapus
                      </button>
                    </div>
                  )}
                  <p className="text-[9px] text-gray-400 font-medium">Link Google Drive / Dropbox atau file PDF proposal kegiatan.</p>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Deskripsi Kegiatan Singkat</label>
                  <textarea
                    rows={2}
                    placeholder="Keterangan singkat kegiatan..."
                    value={activityForm.deskripsi || ''}
                    onChange={(e) => setActivityForm(prev => ({ ...prev, deskripsi: e.target.value }))}
                    className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-hw-green/20 resize-none text-xs"
                  />
                </div>

                {/* 1. SELEKSI DATA PELATIH (Minimal Role Jaya Matahari 1) */}
                <div className="p-3.5 bg-emerald-50/60 rounded-2xl border border-emerald-200/80 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black uppercase tracking-wider text-emerald-950 flex items-center gap-1.5">
                      <span>👨‍🏫</span> Data Pelatih Kegiatan
                    </label>
                    <span className="text-[9px] font-extrabold bg-emerald-200/70 text-emerald-900 px-2 py-0.5 rounded-md border border-emerald-300/60">
                      Syarat: Role Jaya Matahari 1
                    </span>
                  </div>

                  {/* Select Pelatih from Members */}
                  <div className="flex flex-col sm:flex-row gap-2 w-full min-w-0 max-w-full">
                    <select
                      id="select-pelatih-dropdown"
                      defaultValue=""
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val && !(activityForm.pelatih || []).includes(val)) {
                          setActivityForm(prev => ({
                            ...prev,
                            pelatih: [...(prev.pelatih || []), val]
                          }));
                        }
                        e.target.value = '';
                      }}
                      className="flex-1 w-full min-w-0 max-w-full bg-white border border-emerald-300/80 rounded-xl px-3 py-2 text-xs font-bold text-gray-800 outline-none focus:ring-2 focus:ring-emerald-400 cursor-pointer truncate overflow-hidden"
                    >
                      <option value="" disabled>-- Pilih Pelatih dari Anggota (Syarat: Role Jaya Matahari 1) --</option>
                      {(() => {
                        const eligible = (members || []).filter((m: any) => {
                          if (!m) return false;
                          const roleStr = (m.role || '').toLowerCase();
                          const rolesArr = (Array.isArray(m.roles) ? m.roles : []).map((r: any) => String(r).toLowerCase());
                          const emailStr = (m.email || '').toLowerCase();
                          
                          // Sembunyikan akun Super Admin / Admin biasa
                          if (roleStr.includes('admin') || rolesArr.some(r => r.includes('admin')) || emailStr.includes('admin')) {
                            return false;
                          }

                          const pel = Array.isArray(m.pelatihan) ? m.pelatihan.join(' ').toLowerCase() : String(m.pelatihan || '').toLowerCase();
                          const tingk = (m.tingkatan || m.golongan || m.golonganPelatih || '').toLowerCase();
                          const normRoles = parseRolesField(m.roles, m.role);
                          
                          // HANYA yang mempunyai role / kualifikasi Jaya Matahari 1 (jari1)
                          const isJayaMatahari1 = 
                            normRoles.includes('jari1') ||
                            roleStr === 'jari1' || rolesArr.includes('jari1') ||
                            roleStr.includes('matahari 1') || roleStr.includes('matahari1') ||
                            rolesArr.some(r => r.includes('matahari 1') || r.includes('matahari1') || r === 'jari1') ||
                            pel.includes('matahari 1') || pel.includes('matahari1') || pel.includes('jari 1') || pel.includes('jari1') ||
                            tingk.includes('matahari 1') || tingk.includes('matahari1') || tingk.includes('jari 1') || tingk.includes('jari1');

                          return isJayaMatahari1;
                        });

                        if (eligible.length === 0) {
                          return (
                            <option value="" disabled>
                              (Belum ada anggota yang memiliki role/kualifikasi Jaya Matahari 1)
                            </option>
                          );
                        }

                        return eligible.map((m: any, idx: number) => {
                          const name = m.namaLengkap || m.nama || m.name || `Anggota ${idx + 1}`;
                          const nbm = m.nbm ? ` (${m.nbm})` : '';
                          const rKeys = parseRolesField(m.roles, m.role);
                          const roleName = rKeys.map((rk: string) => ROLE_LABELS[rk] || rk).join(', ');
                          return (
                            <option key={m.id || m.nbm || idx} value={name}>
                              {name}{nbm} — [{roleName}]
                            </option>
                          );
                        });
                      })()}
                    </select>

                    <button
                      type="button"
                      onClick={() => {
                        const customName = prompt('Ketikkan Nama Pelatih kegiatan:');
                        if (customName && customName.trim() && !(activityForm.pelatih || []).includes(customName.trim())) {
                          setActivityForm(prev => ({
                            ...prev,
                            pelatih: [...(prev.pelatih || []), customName.trim()]
                          }));
                        }
                      }}
                      className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer shadow-xs shrink-0"
                    >
                      + Ketik Manual
                    </button>
                  </div>

                  {/* Display selected Pelatih chips */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {(activityForm.pelatih || []).length === 0 ? (
                      <span className="text-[10px] text-gray-400 font-bold italic">Belum ada Pelatih dipilih.</span>
                    ) : (
                      (activityForm.pelatih || []).map((pName, pIdx) => (
                        <span key={pIdx} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-700 text-white rounded-lg text-[10px] font-black shadow-xs max-w-full truncate">
                          👨‍🏫 {pName}
                          <button
                            type="button"
                            onClick={() => {
                              setActivityForm(prev => ({
                                ...prev,
                                pelatih: (prev.pelatih || []).filter((_, i) => i !== pIdx)
                              }));
                            }}
                            className="hover:text-rose-200 cursor-pointer ml-1 font-extrabold shrink-0"
                            title="Hapus pelatih ini"
                          >
                            ✕
                          </button>
                        </span>
                      ))
                    )}
                  </div>
                </div>

                {/* 2. SELEKSI DATA ASISTEN PELATIH (Role Jaya Melati 2) */}
                <div className="p-3.5 bg-blue-50/60 rounded-2xl border border-blue-200/80 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black uppercase tracking-wider text-blue-950 flex items-center gap-1.5">
                      <span>🤝</span> Data Asisten Pelatih Kegiatan
                    </label>
                    <span className="text-[9px] font-extrabold bg-blue-200/70 text-blue-900 px-2 py-0.5 rounded-md border border-blue-300/60">
                      Syarat: Role Jaya Melati 2
                    </span>
                  </div>

                  {/* Select Asisten Pelatih from Members */}
                  <div className="flex flex-col sm:flex-row gap-2 w-full min-w-0 max-w-full">
                    <select
                      id="select-asisten-dropdown"
                      defaultValue=""
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val && !(activityForm.asistenPelatih || []).includes(val)) {
                          setActivityForm(prev => ({
                            ...prev,
                            asistenPelatih: [...(prev.asistenPelatih || []), val]
                          }));
                        }
                        e.target.value = '';
                      }}
                      className="flex-1 w-full min-w-0 max-w-full bg-white border border-blue-300/80 rounded-xl px-3 py-2 text-xs font-bold text-gray-800 outline-none focus:ring-2 focus:ring-blue-400 cursor-pointer truncate overflow-hidden"
                    >
                      <option value="" disabled>-- Pilih Asisten Pelatih dari Anggota (Role Jaya Melati 2) --</option>
                      {(() => {
                        const eligible = (members || []).filter((m: any) => {
                          if (!m) return false;
                          const roleStr = (m.role || '').toLowerCase();
                          const rolesArr = (Array.isArray(m.roles) ? m.roles : []).map((r: any) => String(r).toLowerCase());
                          const emailStr = (m.email || '').toLowerCase();
                          const normRoles = parseRolesField(m.roles, m.role);

                          // 1. Sembunyikan akun Super Admin / Admin
                          const isAdminOrSuper = roleStr.includes('admin') || rolesArr.some(r => r.includes('admin')) || emailStr.includes('admin') || normRoles.includes('admin') || normRoles.includes('superadmin');
                          if (isAdminOrSuper) return false;

                          // 2. Sembunyikan yang mempunyai role akses/kualifikasi Jaya Matahari 1 atau Jaya Matahari 2
                          const pel = Array.isArray(m.pelatihan) ? m.pelatihan.join(' ').toLowerCase() : String(m.pelatihan || '').toLowerCase();
                          const tingk = (m.tingkatan || m.golongan || m.golonganPelatih || '').toLowerCase();

                          const isMatahari = normRoles.includes('jari1') || normRoles.includes('jari2') ||
                            roleStr.includes('jari') || roleStr.includes('matahari') ||
                            rolesArr.some(r => r.includes('jari') || r.includes('matahari')) ||
                            pel.includes('matahari') || pel.includes('jari') || pel.includes('jauari') ||
                            tingk.includes('matahari') || tingk.includes('jari');
                          if (isMatahari) return false;

                          // 3. Hanya tampilkan yang mempunyai kualifikasi/role Jaya Melati 2 (jati2)
                          const hasJM2 = normRoles.includes('jati2') ||
                            roleStr.includes('jati2') || roleStr.includes('melati 2') || roleStr.includes('melati2') || roleStr.includes('jati 2') ||
                            rolesArr.some(r => r.includes('jati2') || r.includes('melati 2') || r.includes('melati2') || r.includes('jati 2')) ||
                            pel.includes('jati 2') || pel.includes('jati2') || pel.includes('melati 2') || pel.includes('melati2') ||
                            tingk.includes('melati 2') || tingk.includes('melati2') || tingk.includes('jati 2') || tingk.includes('jati2');

                          return hasJM2;
                        });

                        if (eligible.length === 0) {
                          return (
                            <option value="" disabled>
                              (Belum ada anggota yang memiliki role/kualifikasi Jaya Melati 2)
                            </option>
                          );
                        }

                        return eligible.map((m: any, idx: number) => {
                          const name = m.namaLengkap || m.nama || m.name || `Anggota ${idx + 1}`;
                          const nbm = m.nbm ? ` (${m.nbm})` : '';
                          const rKeys = parseRolesField(m.roles, m.role);
                          const roleName = rKeys.map((rk: string) => ROLE_LABELS[rk] || rk).join(', ');
                          return (
                            <option key={m.id || m.nbm || idx} value={name}>
                              {name}{nbm} — [{roleName}]
                            </option>
                          );
                        });
                      })()}
                    </select>

                    <button
                      type="button"
                      onClick={() => {
                        const customName = prompt('Ketikkan Nama Asisten Pelatih kegiatan:');
                        if (customName && customName.trim() && !(activityForm.asistenPelatih || []).includes(customName.trim())) {
                          setActivityForm(prev => ({
                            ...prev,
                            asistenPelatih: [...(prev.asistenPelatih || []), customName.trim()]
                          }));
                        }
                      }}
                      className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer shadow-xs shrink-0"
                    >
                      + Ketik Manual
                    </button>
                  </div>

                  {/* Display selected Asisten Pelatih chips */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {(activityForm.asistenPelatih || []).length === 0 ? (
                      <span className="text-[10px] text-gray-400 font-bold italic">Belum ada Asisten Pelatih dipilih.</span>
                    ) : (
                      (activityForm.asistenPelatih || []).map((aName, aIdx) => (
                        <span key={aIdx} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-700 text-white rounded-lg text-[10px] font-black shadow-xs">
                          🤝 {aName}
                          <button
                            type="button"
                            onClick={() => {
                              setActivityForm(prev => ({
                                ...prev,
                                asistenPelatih: (prev.asistenPelatih || []).filter((_, i) => i !== aIdx)
                              }));
                            }}
                            className="hover:text-rose-200 cursor-pointer ml-1 font-extrabold"
                            title="Hapus asisten pelatih ini"
                          >
                            ✕
                          </button>
                        </span>
                      ))
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsActivityModalOpen(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    if (!activityForm.namaKegiatan.trim()) {
                      alert('Nama kegiatan wajib diisi.');
                      return;
                    }
                    const newAct = {
                      id: editingActivityId || `act-${Date.now()}`,
                      ...activityForm
                    };
                    let updatedActivities = [...(settings.trainingActivities || [])];
                    if (editingActivityId) {
                      updatedActivities = updatedActivities.map((a: any) => a.id === editingActivityId ? newAct : a);
                    } else {
                      updatedActivities.push(newAct);
                    }

                    // Sync location and date to lookup lists if not existing
                    let updatedLocations = [...(settings.trainingLocations || [])];
                    if (activityForm.lokasiPelatihan && !updatedLocations.includes(activityForm.lokasiPelatihan)) {
                      updatedLocations.push(activityForm.lokasiPelatihan);
                    }

                    let updatedDates = [...(settings.trainingDates || [])];
                    if (activityForm.tanggalPelatihan && !updatedDates.includes(activityForm.tanggalPelatihan)) {
                      updatedDates.push(activityForm.tanggalPelatihan);
                    }

                    const updatedSettings = {
                      ...settings,
                      trainingActivities: updatedActivities,
                      trainingLocations: updatedLocations,
                      trainingDates: updatedDates
                    };

                    setSettings(updatedSettings);

                    try {
                      setLoading(true);
                      await sheetsService.saveSettings(updatedSettings);
                      const imgClean = newAct.gambarUrl || newAct.imageUrl || newAct.gambar || newAct.posterUrl || newAct.coverImage || '';
                      await sheetsService.saveActivity({
                        id: newAct.id,
                        namaKegiatan: newAct.namaKegiatan,
                        kategori: newAct.jenisPelatihan || 'Pelatihan',
                        jenisPelatihan: newAct.jenisPelatihan,
                        tanggal: newAct.tanggalPelatihan || '',
                        lokasi: newAct.lokasiPelatihan || '',
                        tanggalPelatihan: newAct.tanggalPelatihan || '',
                        lokasiPelatihan: newAct.lokasiPelatihan || '',
                        biayaPelatihan: newAct.biayaPelatihan || 'Rp 50.000',
                        rekeningPembiayaan: newAct.rekeningPembiayaan || 'Bank Syariah Indonesia (BSI) 7307427448 a.n. Kwarwil HW Jateng',
                        noWhatsappPanitia: newAct.noWhatsappPanitia || '089688754000',
                        status: newAct.status || 'Buka',
                        proposalUrl: newAct.proposalUrl || '',
                        proposal: newAct.proposalUrl || '',
                        linkProposal: newAct.proposalUrl || '',
                        gambarUrl: imgClean,
                        imageUrl: imgClean,
                        gambar: imgClean,
                        posterUrl: imgClean,
                        coverImage: imgClean,
                        deskripsi: newAct.deskripsi || '',
                        pelatih: Array.isArray(newAct.pelatih) ? newAct.pelatih.join(', ') : (newAct.pelatih || ''),
                        asistenPelatih: Array.isArray(newAct.asistenPelatih) ? newAct.asistenPelatih.join(', ') : (newAct.asistenPelatih || ''),
                        kuota: '100 Peserta',
                        penyelenggara: 'Kwarwil HW Jateng',
                        isPelatihan: true
                      });
                      alert('Kegiatan berhasil disimpan dan disinkronkan ke Cloud Firestore!');
                      setIsActivityModalOpen(false);
                    } catch (err: any) {
                      alert('Gagal menyimpan kegiatan ke cloud: ' + (err?.message || err));
                    } finally {
                      setLoading(false);
                    }
                  }}
                  className="px-5 py-2 bg-hw-green hover:bg-emerald-700 text-white rounded-xl font-black uppercase tracking-wider cursor-pointer"
                >
                  {editingActivityId ? 'Simpan Perubahan' : 'Tambah Kegiatan'}
                </button>
              </div>
            </div>
          </div>
        )}

        {loading && (
          <div key="global-loading-overlay" className="fixed inset-0 z-[999] bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <div className="w-16 h-16 border-4 border-hw-green border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>
    );
  }


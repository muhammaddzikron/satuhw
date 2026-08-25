import { safeStorageSet } from '../utils/safeStorage';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { KTACard } from '../components/KTACard';
import { formatTempatTanggalLahir, cleanTempatLahir, normalizeDateForInput } from '../lib/utils';
import { isOnlyTrainingActivity, isParticipantOfActivity, sortActivityAppsByDate, extractYoutubeId } from '../utils/activityUtils';
import { syncRolesAndPelatihan, PELATIHAN_OPTIONS, isPelatihanSelected, normalizeTrainingKey, consolidateTrainingApplications, isSameTrainingParticipant, normalizeParticipantName, generateSamplePreTestForParticipants, getAppPreTestScore, getAppPostTestScore, getAppTasksList, getAppAttendanceMap } from '../utils/trainingUtils';
import { DEFAULT_50_QUESTIONS } from '../data/trainingQuestions';

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
      val = attObj[`Sesi ${num}`] ?? attObj[`sesi_${num}`] ?? attObj[`sesi-${num}`] ?? attObj[`Materi ${num}`] ?? attObj[`materi_${num}`] ?? attObj[`materi-${num}`] ?? attObj[num];
    }
  }
  if (val === undefined || val === null) return false;
  if (typeof val === 'boolean') return val;
  if (typeof val === 'string') {
    const s = val.toLowerCase().trim();
    return s === 'hadir' || s === 'true' || s === 'present' || s === 'h' || s.startsWith('hadir');
  }
  if (typeof val === 'object' && val !== null) {
    if (val.present === true) return true;
    const s = String(val.status || '').toLowerCase().trim();
    return s === 'hadir' || s === 'present' || s === 'h' || s.startsWith('hadir');
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
import { DEFAULT_JM1_SOLO_ACTIVITY } from '../utils/trainingUtils';
import { TestManagementPanel } from '../components/training/TestManagementPanel';
import { TestSubmissionViewerModal } from '../components/training/TestSubmissionViewerModal';
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

  const jayaMatahariIdentifiers = [
    'jari1', 'jari2', 'jari 1', 'jari 2',
    'jaya_matahari_1', 'jaya_matahari_2', 'jaya matahari 1', 'jaya matahari 2', 'jaya matahari',
    'pelatih', 'pelatih_nasional', 'pelatih nasional'
  ];

  const isJayaMatahariRole = userRolesList.some(r => 
    jayaMatahariIdentifiers.some(tr => r.includes(tr) || tr.includes(r)) ||
    r.includes('matahari') || r.includes('jari')
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

  const isRealAdmin = user?.role === 'admin' || user?.role === 'superadmin' || user?.role === 'sugli' || user?.role === 'kwarda' || isDiklatAdmin;
  const isAppointedJayaMatahariTrainer = !isRealAdmin && isJayaMatahariRole && isAssignedTrainerInAnyActivity;
  const isPelatihOnly = isAppointedJayaMatahariTrainer;
  const isPelatihUser = isRealAdmin || isAppointedJayaMatahariTrainer;

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
    if (isPelatihOnly && activeTab !== 'pelatihan') {
      setActiveTabState('pelatihan');
      return;
    }
    if (isDiklatAdmin && activeTab !== 'pelatihan' && activeTab !== 'akun') {
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
  const [backgroundProcessingText, setBackgroundProcessingText] = useState<string | null>(null);
  const [toastNotification, setToastNotification] = useState<{
    id: string;
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  const showToast = useCallback((type: 'success' | 'error' | 'info', message: string, duration = 4000) => {
    const id = Date.now().toString();
    setToastNotification({ id, type, message });
    setTimeout(() => {
      setToastNotification(curr => curr?.id === id ? null : curr);
    }, duration);
  }, []);
  
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
        setBackgroundProcessingText(`Menghapus pengajuan KTA untuk ${name}...`);
        setKtaApps(prev => prev.filter(k => String(k.id) !== String(id)));
        const res = await sheetsService.deleteKTAApplication(id);
        if (res.success || !res.error) {
          showToast('success', `Berhasil menghapus pengajuan KTA untuk ${name}.`);
        } else {
          showToast('error', 'Gagal menghapus pengajuan: ' + (res.message || 'Error'));
        }
        await fetchData();
      } catch (e: any) {
        console.error(e);
        showToast('error', 'Gagal menghapus pengajuan: ' + (e.message || 'Error'));
      } finally {
        setBackgroundProcessingText(null);
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
    return consolidateTrainingApplications(apps);
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
  const [viewingTestApp, setViewingTestApp] = useState<any | null>(null);
  
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
    proposalUrl: '',
    gambarUrl: ''
  });

  // Schedule Editing States
  const [editingScheduleAppId, setEditingScheduleAppId] = useState<string | null>(null);
  const [editPelatihan, setEditPelatihan] = useState<string>('');
  const [editLokasi, setEditLokasi] = useState<string>('');
  const [editTanggal, setEditTanggal] = useState<string>('');

  // Program Level Selectors for sub-tabs
  const [selectedPresensiProg, setSelectedPresensiProg] = useState<'Jati 1' | 'Jati 2' | 'Jari 1'>('Jati 1');
  const [selectedTugasProg, setSelectedTugasProg] = useState<'Jati 1' | 'Jati 2' | 'Jari 1'>('Jati 1');
  const [selectedTugasMateriId, setSelectedTugasMateriId] = useState<string>('all');
  const [tugasFilterType, setTugasFilterType] = useState<'all' | 'pre_done' | 'post_done' | 'tugas_done' | 'incomplete'>('all');
  const [tugasSearchQuery, setTugasSearchQuery] = useState('');
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
    const options: { id: string; name: string; label: string; act?: any; location?: string; date?: string; fee?: string }[] = [];
    const addedNames = new Set<string>();

    // 1. Registered training activities from settings & activitiesList (from "Kelola Jenis Pelatihan")
    allTrainingActivitiesList.forEach((act: any) => {
      const name = act.namaKegiatan || act.jenisPelatihan;
      if (name && !addedNames.has(name)) {
        addedNames.add(name);
        const loc = act.lokasiPelatihan || act.lokasi || '';
        const dt = act.tanggalPelatihan || act.tanggal || '';
        const fee = act.biayaPelatihan || act.biaya || '';
        options.push({
          id: act.id || name,
          name: name,
          label: `${name}${loc ? ` â€¢ ðŸ“ ${loc}` : ''}${dt ? ` â€¢ ðŸ“… ${dt}` : ''}`,
          act,
          location: loc,
          date: dt,
          fee: fee
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
    const activeActs = allTrainingActivitiesList.length > 0 ? allTrainingActivitiesList : (settings.trainingActivities || []);
    const matchingAct = activeActs.find((a: any) => 
      a.id === val || a.namaKegiatan === val || a.jenisPelatihan === val || (a.namaKegiatan && a.namaKegiatan.toLowerCase().trim() === val.toLowerCase().trim())
    ) || (activitiesList || []).find((a: any) => 
      a.id === val || a.namaKegiatan === val || a.jenisPelatihan === val
    );

    if (matchingAct) {
      setAddParticipantForm(prev => ({
        ...prev,
        pelatihanAkanDiikuti: matchingAct.namaKegiatan || matchingAct.jenisPelatihan || val,
        lokasiPelatihan: matchingAct.lokasiPelatihan || matchingAct.lokasi || (settings.trainingLocations || [])[0] || 'Pusdiklat HW Jateng',
        tanggalPelatihan: matchingAct.tanggalPelatihan || matchingAct.tanggal || (settings.trainingDates || [])[0] || 'Jadwal Reguler',
        biayaPelatihan: matchingAct.biayaPelatihan || matchingAct.biaya || 'Rp 50.000',
        rekeningPembiayaan: matchingAct.rekeningPembiayaan || matchingAct.rekeningPembayaran || 'Bank Syariah Indonesia (BSI) 7307427448 a.n. Kwarwil HW Jateng'
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
    const activeActs = allTrainingActivitiesList.length > 0 ? allTrainingActivitiesList : (settings.trainingActivities || []);
    const matchingAct = activeActs.find((a: any) => 
      a.id === val || a.namaKegiatan === val || a.jenisPelatihan === val || (a.namaKegiatan && a.namaKegiatan.toLowerCase().trim() === val.toLowerCase().trim())
    ) || (activitiesList || []).find((a: any) => 
      a.id === val || a.namaKegiatan === val || a.jenisPelatihan === val
    );

    if (matchingAct) {
      setEditingTrainingApp((prev: any) => ({
        ...prev,
        pelatihanAkanDiikuti: matchingAct.namaKegiatan || matchingAct.jenisPelatihan || val,
        lokasiPelatihan: matchingAct.lokasiPelatihan || matchingAct.lokasi || 'Kwarda HW Solo',
        tanggalPelatihan: matchingAct.tanggalPelatihan || matchingAct.tanggal || '22 - 23 Agustus dan 11 - 13 September 2026',
        biayaPelatihan: matchingAct.biayaPelatihan || matchingAct.biaya || prev?.biayaPelatihan || 'Rp 550.000',
        rekeningPembiayaan: matchingAct.rekeningPembiayaan || matchingAct.rekeningPembayaran || prev?.rekeningPembiayaan || 'BNI 0282085562 a.n. Laily Purnamawati'
      }));
    } else {
      setEditingTrainingApp((prev: any) => ({
        ...prev,
        pelatihanAkanDiikuti: val,
        lokasiPelatihan: prev?.lokasiPelatihan || 'Kwarda HW Solo',
        tanggalPelatihan: prev?.tanggalPelatihan || '22 - 23 Agustus dan 11 - 13 September 2026',
        biayaPelatihan: prev?.biayaPelatihan || 'Rp 550.000'
      }));
    }
  };

  const handleInlineScheduleTrainingChange = (val: string) => {
    setEditPelatihan(val);
    const activeActs = allTrainingActivitiesList.length > 0 ? allTrainingActivitiesList : (settings.trainingActivities || []);
    const matchingAct = activeActs.find((a: any) => 
      a.id === val || a.namaKegiatan === val || a.jenisPelatihan === val || (a.namaKegiatan && a.namaKegiatan.toLowerCase().trim() === val.toLowerCase().trim())
    ) || (activitiesList || []).find((a: any) => 
      a.id === val || a.namaKegiatan === val || a.jenisPelatihan === val
    );

    if (matchingAct) {
      if (matchingAct.lokasiPelatihan || matchingAct.lokasi) {
        setEditLokasi(matchingAct.lokasiPelatihan || matchingAct.lokasi);
      }
      if (matchingAct.tanggalPelatihan || matchingAct.tanggal) {
        setEditTanggal(matchingAct.tanggalPelatihan || matchingAct.tanggal);
      }
    }
  };

  const handleInlineScheduleLocationChange = (locVal: string) => {
    setEditLokasi(locVal);
    const activeActs = allTrainingActivitiesList.length > 0 ? allTrainingActivitiesList : (settings.trainingActivities || []);
    const matchingAct = activeActs.find((a: any) => 
      (a.lokasiPelatihan === locVal || a.lokasi === locVal) &&
      (!editPelatihan || a.namaKegiatan === editPelatihan || a.jenisPelatihan === editPelatihan)
    ) || activeActs.find((a: any) => a.lokasiPelatihan === locVal || a.lokasi === locVal);

    if (matchingAct && (matchingAct.tanggalPelatihan || matchingAct.tanggal)) {
      setEditTanggal(matchingAct.tanggalPelatihan || matchingAct.tanggal);
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
      showToast('success', 'Data KTA berhasil diperbarui!');

      // 2. Background save & sync
      (async () => {
        setBackgroundProcessingText('Menyimpan perubahan KTA di latar belakang...');
        try {
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
        } finally {
          setBackgroundProcessingText(null);
        }
      })().catch(err => console.warn('Background edit KTA sync warning:', err));

    } catch (err: any) {
      console.error(err);
      showToast('error', 'Gagal memperbarui data KTA: ' + (err.message || 'Cek koneksi'));
    }
  };

  const handleResequenceKTAs = async () => {
    if (!window.confirm("Apakah Anda yakin ingin merapikan dan menggeser urutan nomor KTA?\n\nProses ini akan menggeser nomor urut KTA di tiap Kwarda/Qabilah sehingga semua nomor urut anggota lengkap dari yang terkecil (11.XX.0001, 11.XX.0002, 11.XX.0003...) tanpa ada celah kosong.")) {
      return;
    }

    try {
      setIsResequencingKta(true);

      // 1. Optimistic local state update
      const resequencedKtas = ensureUniqueKtaNumbers([...ktaApps]);
      const resequencedMembers = ensureUniqueKtaNumbers([...members]);

      setKtaApps(resequencedKtas);
      setMembers(resequencedMembers);

      safeStorageSet('kta_applications', resequencedKtas);
      safeStorageSet('mock_members', resequencedMembers);

      // 2. Sync to Firestore in background
      const synced = await firestoreService.resequenceAndSaveAllKTAs();
      if (synced && synced.length > 0) {
        setKtaApps(synced);
      }

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
      pdf.text('Standar Kartu Identitas ID-1 (85.60 mm Ã— 53.98 mm) â€” Skala 1:1 (Actual Size)', 105, 32, { align: 'center' });

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
      pdf.text('2. Ukuran hasil cetak sesuai standar kartu identitas nasional ID-1 (85.60 mm Ã— 53.98 mm).', 25, 199);
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
      showToast('success', 'Data peserta pelatihan berhasil diperbarui!');

      // 2. Background save
      (async () => {
        setBackgroundProcessingText('Menyimpan perubahan pelatihan di latar belakang...');
        try {
          await sheetsService.saveTrainingApplicationAndSyncMember(appToSave);
          const [tApps, mData] = await Promise.all([
            sheetsService.getTrainingApplications(),
            sheetsService.getMembers()
          ]);
          if (tApps?.length) setTrainingApps(tApps);
          if (mData?.length) setMembers(mData);
        } finally {
          setBackgroundProcessingText(null);
        }
      })().catch(err => console.warn('Background save training edit sync warning:', err));

    } catch (err: any) {
      console.error(err);
      showToast('error', 'Gagal menyimpan data pelatihan: ' + (err.message || 'Cek koneksi'));
    }
  };

  const handleDeleteTrainingParticipant = async (appId: string, participantName?: string) => {
    const confirmMsg = `Hapus pendaftaran peserta pelatihan ${participantName ? `"${participantName}"` : 'ini'}?\n\nCatatan: Data pelatihan ini akan dihapus dari daftar pelatihan, namun data anggota (KTA) tetap aman.`;
    if (!window.confirm(confirmMsg)) return;

    try {
      // 1. Optimistic UI update
      setTrainingApps(prev => prev.filter(t => String(t.id) !== String(appId)));
      showToast('success', `Data peserta ${participantName ? `"${participantName}"` : ''} berhasil dihapus.`);

      // 2. Background database deletion
      (async () => {
        setBackgroundProcessingText('Menghapus data peserta pelatihan...');
        try {
          await sheetsService.updateTrainingStatus(appId, 'deleted');
          const tApps = await sheetsService.getTrainingApplications();
          if (Array.isArray(tApps)) {
            setTrainingApps(tApps);
          }
        } finally {
          setBackgroundProcessingText(null);
        }
      })().catch(err => console.warn('Background delete training error:', err));
    } catch (err: any) {
      console.error(err);
      showToast('error', 'Gagal menghapus data peserta: ' + (err.message || 'Cek koneksi'));
    }
  };

  const handleSetAllToActivity = async (targetAct?: any) => {
    const acts = allTrainingActivitiesList || [];
    let act = targetAct;
    if (!act) {
      // Find Jaya Melati 1 activity from settings / allTrainingActivitiesList (Kelola Jenis Pelatihan)
      act = acts.find((a: any) => 
        (a?.jenisPelatihan && a.jenisPelatihan.toLowerCase().includes('jaya melati 1')) ||
        (a?.namaKegiatan && a.namaKegiatan.toLowerCase().includes('jaya melati 1'))
      );
    }

    if (!act && acts.length > 0) {
      act = acts[0];
    }

    const activityName = act?.namaKegiatan || act?.jenisPelatihan || 'Pelatihan Jaya Melati 1 Solo';
    const activityJenis = act?.jenisPelatihan || 'Jaya Melati 1';
    const activityLokasi = act?.lokasiPelatihan || act?.lokasi || 'Kwarda HW Solo';
    const activityTanggal = act?.tanggalPelatihan || act?.tanggal || '22 - 23 Agustus dan 11 - 13 September 2026';
    const activityBiaya = act?.biayaPelatihan || act?.biaya || 'Rp 550.000';
    const activityRekening = act?.rekeningPembiayaan || act?.rekeningPembayaran || 'BNI 0282085562 a.n. Laily Purnamawati';
    const activityPelatih = act?.namaPelatih || act?.pelatih || 'Muhammad Dzikron, Eni Winarti, Wahyu Dewayanto, Dwi Suparwanto, Agus Dwi Setiawan, Puryadi';
    const activityAsisten = act?.asistenPelatih || 'Retiana Maharani';
    const activityId = act?.id || 'act-jm1-solo';

    const count = trainingApps.length;

    if (!window.confirm(`Ubah SEMUA data ${count} peserta pelatihan yang ada saat ini menjadi Peserta Pelatihan:\n\nâ€¢ Nama Kegiatan: ${activityName}\nâ€¢ Jenis: ${activityJenis}\nâ€¢ Lokasi: ${activityLokasi}\nâ€¢ Tanggal: ${activityTanggal}\nâ€¢ Biaya: ${activityBiaya}\nâ€¢ Rekening: ${activityRekening}\nâ€¢ Pelatih: ${activityPelatih}\nâ€¢ Asisten Pelatih: ${activityAsisten}\n\n(Catatan: Jenis/kegiatan pelatihan lain yang tidak sesuai akan dibersihkan agar sinkron).\n\nLanjutkan pembaruan ke semua peserta?`)) {
      return;
    }

    try {
      setLoading(true);
      setBackgroundProcessingText(`Mengubah semua peserta menjadi ${activityName}...`);

      const payload = {
        id: activityId,
        namaKegiatan: activityName,
        jenisPelatihan: activityJenis,
        tingkatan: activityJenis,
        pelatihanAkanDiikuti: activityName,
        lokasiPelatihan: activityLokasi,
        lokasi: activityLokasi,
        tanggalPelatihan: activityTanggal,
        tanggal: activityTanggal,
        biayaPelatihan: activityBiaya,
        biaya: activityBiaya,
        rekeningPembiayaan: activityRekening,
        rekeningPembayaran: activityRekening,
        namaPelatih: activityPelatih,
        pelatih: activityPelatih,
        asistenPelatih: activityAsisten,
        status: 'Buka',
        deskripsi: act?.deskripsi || 'Pelatihan Jaya Melati 1 Kwarda HW Solo'
      };

      // Optimistic update
      setTrainingApps(prev => prev.map(t => ({
        ...t,
        ...payload
      })));

      // Keep only this registered training activity in settings
      setSettings(prev => ({
        ...prev,
        trainingActivities: [payload],
        trainingTypes: [activityJenis],
        trainingLocations: [activityLokasi],
        trainingDates: [activityTanggal]
      }));

      const res = await sheetsService.bulkSetAllTrainingParticipantsToActivity(payload);
      const [tApps, mData, sData] = await Promise.all([
        sheetsService.getTrainingApplications(),
        sheetsService.getMembers(),
        sheetsService.getSettings()
      ]);
      if (tApps?.length) setTrainingApps(tApps);
      if (mData?.length) setMembers(mData);
      if (sData) setSettings(sData);

      showToast('success', `Berhasil! ${res.count || tApps?.length || 0} peserta kini terdaftar di ${activityName}.`);
    } catch (err: any) {
      console.error(err);
      showToast('error', 'Gagal mengubah semua peserta: ' + (err.message || 'Cek koneksi'));
    } finally {
      setLoading(false);
      setBackgroundProcessingText(null);
    }
  };

  const handleSetAllToJayaMelati1Solo = async () => {
    const jm1Act = (allTrainingActivitiesList || []).find((a: any) => 
      (a?.jenisPelatihan && a.jenisPelatihan.toLowerCase().includes('jaya melati 1')) ||
      (a?.namaKegiatan && a.namaKegiatan.toLowerCase().includes('jaya melati 1'))
    );
    return handleSetAllToActivity(jm1Act);
  };

  const handleGenerateSamplePreTest = async () => {
    if (!trainingApps || trainingApps.length === 0) {
      showToast('error', 'Belum ada peserta pelatihan yang terdaftar.');
      return;
    }

    setBackgroundProcessingText('Membuat contoh pengerjaan Pre-Test untuk seluruh peserta pelatihan...');
    try {
      const qList = Array.isArray(settings?.trainingQuestions) && settings.trainingQuestions.length > 0
        ? settings.trainingQuestions
        : DEFAULT_50_QUESTIONS;

      const updatedApps = generateSamplePreTestForParticipants(trainingApps, qList);

      // 1. Instant optimistic state update
      setTrainingApps(updatedApps);

      // 2. Local storage update
      safeStorageSet('training_applications', consolidateTrainingApplications(updatedApps));

      // 3. Dispatch global sync event
      window.dispatchEvent(new Event('training_applications_updated'));

      // 4. Background persistence to Firestore and Sheets
      (async () => {
        for (const app of updatedApps) {
          if (app.preTestData) {
            try {
              const sub = typeof app.preTestData === 'string' ? JSON.parse(app.preTestData) : app.preTestData;
              await firestoreService.submitTestSubmission(app.id, sub, app);
              await sheetsService.submitTestSubmission(app.id, sub).catch(() => {});
            } catch (err) {
              console.warn('Syncing sample test submission error:', err);
            }
          }
        }
      })().catch(e => console.warn('Background sync sample tests error:', e));

      showToast('success', `Berhasil! Contoh hasil pengerjaan Pre-Test (nilai genap 70 - 86) telah dibuat untuk ${updatedApps.length} peserta.`);
    } catch (err: any) {
      console.error(err);
      showToast('error', 'Gagal membuat contoh pengerjaan pre test: ' + (err?.message || err));
    } finally {
      setBackgroundProcessingText(null);
    }
  };

  const handleSaveSchedule = async (appId: string) => {
    try {
      const targetPelatihan = editPelatihan ? editPelatihan.trim() : undefined;
      const targetLokasi = editLokasi;
      const targetTanggal = editTanggal;

      // Optimistic update
      setTrainingApps(prev => prev.map(t => String(t.id) === String(appId) ? { 
        ...t, 
        ...(targetPelatihan ? { pelatihanAkanDiikuti: targetPelatihan } : {}),
        lokasiPelatihan: targetLokasi, 
        tanggalPelatihan: targetTanggal 
      } : t));
      setEditingScheduleAppId(null);
      showToast('success', 'Program, jadwal, dan lokasi pelatihan berhasil diperbarui!');

      // Background save
      (async () => {
        setBackgroundProcessingText('Menyimpan jadwal dan program pelatihan...');
        try {
          await sheetsService.updateTrainingSchedule(appId, targetLokasi, targetTanggal, targetPelatihan);
          const tApps = await sheetsService.getTrainingApplications();
          if (tApps?.length) setTrainingApps(tApps);
        } finally {
          setBackgroundProcessingText(null);
        }
      })().catch(err => console.warn('Background save schedule warning:', err));

    } catch (e: any) {
      console.error(e);
      showToast('error', 'Gagal memperbarui jadwal: ' + (e.message || 'Cek koneksi'));
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
      showToast('error', 'Nama kegiatan wajib diisi');
      return;
    }
    try {
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

      // Optimistic update
      setActivitiesList(prev => {
        const existing = prev.find(a => a.id === actId);
        if (existing) {
          return prev.map(a => a.id === actId ? { ...a, ...payload } : a);
        }
        return [payload, ...prev];
      });
      setIsKegiatanModalOpen(false);
      showToast('success', editingKegiatan ? 'Kegiatan berhasil diperbarui!' : 'Kegiatan baru berhasil ditambahkan!');

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
        filteredActs.unshift(payload);
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

      // Background save
      (async () => {
        setBackgroundProcessingText('Menyimpan data kegiatan di latar belakang...');
        try {
          await sheetsService.saveActivity(payload);
          const actData = await sheetsService.getActivities();
          if (actData) setActivitiesList(actData);
        } finally {
          setBackgroundProcessingText(null);
        }
      })().catch(err => console.warn('Background save activity warning:', err));

    } catch (err: any) {
      showToast('error', 'Gagal menyimpan kegiatan: ' + (err.message || err));
    }
  };

  const handleDeleteActivity = async (id: string, title?: string) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus kegiatan ini?')) return;
    try {
      // Optimistic update
      setActivitiesList(prev => prev.filter(a => a.id !== id));
      const filteredActs = (settings.trainingActivities || []).filter((a: any) => a.id !== id && (!title || (a.namaKegiatan || a.title) !== title));
      setSettings(prev => ({ ...prev, trainingActivities: filteredActs }));
      showToast('success', 'Kegiatan berhasil dihapus!');

      // Background delete
      (async () => {
        setBackgroundProcessingText('Menghapus kegiatan di latar belakang...');
        try {
          await sheetsService.deleteActivity(id, title);
          const actData = await sheetsService.getActivities();
          if (actData) setActivitiesList(actData);
        } finally {
          setBackgroundProcessingText(null);
        }
      })().catch(err => console.warn('Background delete activity warning:', err));

    } catch (err: any) {
      showToast('error', 'Gagal menghapus kegiatan: ' + (err.message || err));
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
      const partToSave = { ...editingActivityParticipant };
      // Optimistic update
      setActivityApplicationsList(prev => prev.map(a => String(a.id) === String(partToSave.id) ? partToSave : a));
      setIsEditActivityParticipantModalOpen(false);
      setEditingActivityParticipant(null);
      showToast('success', 'Data peserta kegiatan berhasil diperbarui!');

      // Background save
      (async () => {
        setBackgroundProcessingText('Menyimpan data peserta kegiatan...');
        try {
          await sheetsService.registerActivity(partToSave);
          const updatedApps = await sheetsService.getActivityApplications();
          if (updatedApps) setActivityApplicationsList(updatedApps);
        } finally {
          setBackgroundProcessingText(null);
        }
      })().catch(err => console.warn('Background save activity participant warning:', err));

    } catch (err: any) {
      showToast('error', 'Gagal memperbarui data peserta: ' + (err.message || 'Cek koneksi'));
    }
  };

  const handleDeleteActivityParticipant = async (id: string) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus data peserta kegiatan ini?')) return;
    try {
      // Optimistic update
      setActivityApplicationsList(prev => prev.filter(a => String(a.id) !== String(id)));
      showToast('success', 'Data peserta berhasil dihapus!');

      // Background delete
      (async () => {
        setBackgroundProcessingText('Menghapus data peserta di latar belakang...');
        try {
          await sheetsService.deleteActivityApplication(id);
          const updatedApps = await sheetsService.getActivityApplications();
          if (updatedApps) setActivityApplicationsList(updatedApps);
        } finally {
          setBackgroundProcessingText(null);
        }
      })().catch(err => console.warn('Background delete participant warning:', err));

    } catch (err: any) {
      showToast('error', 'Gagal menghapus data peserta: ' + (err.message || 'Cek koneksi'));
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
          timestamp: `${dateStr} pukul ${timeStr} (Admin/Pelatih)`
        };
      } else {
        attObj[dayKey] = {
          status: 'absen',
          timestamp: `${dateStr} pukul ${timeStr} (Admin/Pelatih)`
        };
      }
      
      const kehadiranStr = JSON.stringify(attObj);

      // Instant optimistic UI update
      setTrainingApps(prev => prev.map(a => (String(a.id) === String(appId) || isSameTrainingParticipant(a, app)) ? { ...a, kehadiran: kehadiranStr } : a));
      
      await Promise.all([
        sheetsService.updateAttendance(appId, kehadiranStr),
        firestoreService.updateAttendance(appId, kehadiranStr, app)
      ]);
    } catch (err: any) {
      alert('Gagal update kehadiran: ' + err.message);
    }
  };

  const getCalculatedGrading = (app: any) => {
    const targetKey = getNormalizedLevelKey(app.pelatihanAkanDiikuti || app.jenisPelatihan);
    const prog = TRAINING_PROGRAMS.find(p => getNormalizedLevelKey(p.id) === targetKey) || TRAINING_PROGRAMS[0];
    const sessions = prog ? prog.sessions.map(s => s.id) : ['Sesi 1', 'Sesi 2', 'Sesi 3'];

    const attObj = getAppAttendanceMap(app);
    const totalSessions = sessions.length;
    const attendedSessions = sessions.filter(sesi => isSessionPresent(attObj, sesi)).length;
    const attendancePercentage = totalSessions > 0 
      ? Math.round((attendedSessions / totalSessions) * 100) 
      : 0;

    const assignedTasksForLevel = settings.assignedTasks?.filter((t: any) => t.level === app.pelatihanAkanDiikuti) || [];
    const submittedTasks = getAppTasksList(app);

    const totalAssignedTasks = assignedTasksForLevel.length;
    const submittedAssignedCount = assignedTasksForLevel.filter((t: any) => 
      submittedTasks.some((sub: any) => String(sub.materiId) === String(t.materiId))
    ).length;

    const assignmentPercentage = totalAssignedTasks > 0 
      ? Math.round((submittedAssignedCount / totalAssignedTasks) * 100) 
      : (submittedTasks.length > 0 ? 100 : attendancePercentage);

    const preTestScore = getAppPreTestScore(app);
    const postTestScore = getAppPostTestScore(app);

    // Calculate final grade factoring in Post Test if available
    let finalPercentage = Math.round((attendancePercentage + assignmentPercentage) / 2);
    if (postTestScore !== null) {
      finalPercentage = Math.round((attendancePercentage * 0.3) + (assignmentPercentage * 0.3) + (postTestScore * 0.4));
    }

    let calculatedStatus = 'Tidak Lulus';
    if (finalPercentage >= 80) {
      calculatedStatus = 'Lulus';
    } else if (finalPercentage >= 51) {
      calculatedStatus = 'Lulus Bersyarat';
    }

    return {
      attendancePercentage,
      assignmentPercentage,
      preTestScore,
      postTestScore,
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
    const preText = calc.preTestScore !== null ? `Pre-Test: ${calc.preTestScore}, ` : '';
    const postText = calc.postTestScore !== null ? `Post-Test: ${calc.postTestScore}, ` : '';
    setRemarkInput(app.remark || `${preText}${postText}Presensi: ${calc.attendancePercentage}% (${calc.attendedSessions}/${calc.totalSessions} Sesi), Tugas: ${calc.assignmentPercentage}% (${calc.submittedAssignedCount}/${calc.totalAssignedTasks} Tugas)`);
    setGraduationStatusInput(app.statusKelulusan || calc.calculatedStatus);
    setIsGradingModalOpen(true);
  };

  const handleSaveGradeAndRemark = async () => {
    if (!selectedTrainingApp) return;
    try {
      const appId = selectedTrainingApp.id;
      const targetGrade = gradeInput;
      const targetRemark = remarkInput;
      const targetGradStatus = graduationStatusInput || selectedTrainingApp.statusKelulusan || 'Lulus';

      // Optimistic update
      setTrainingApps(prev => prev.map(a => String(a.id) === String(appId) ? {
        ...a,
        nilai: targetGrade,
        remark: targetRemark,
        statusKelulusan: targetGradStatus
      } : a));

      setIsGradingModalOpen(false);
      setSelectedTrainingApp(null);
      showToast('success', 'Nilai & ulasan penugasan berhasil disimpan!');

      // Background save
      (async () => {
        setBackgroundProcessingText('Menyimpan nilai & ulasan...');
        try {
          await sheetsService.updateGrade(appId, { 
            grade: targetGrade, 
            remark: targetRemark,
            statusKelulusan: targetGradStatus
          });
          const updated = await sheetsService.getTrainingApplications();
          if (updated) setTrainingApps(updated);
        } finally {
          setBackgroundProcessingText(null);
        }
      })().catch(err => console.warn('Background save grade warning:', err));

    } catch (err: any) {
      showToast('error', 'Gagal simpan nilai: ' + err.message);
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
    const mockBadIds = ['training-1001', 'training-1002', 'training-1003', 'training-1004', 'training-1005', 'train-api-sample'];
    if (t?.id && mockBadIds.includes(String(t.id))) return false;
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
          const hasMigrated = localStorage.getItem('training_jm1_solo_migrated_v1');
          if (!hasMigrated) {
            sheetsService.bulkSetAllTrainingParticipantsToJayaMelati1Solo()
              .then(() => localStorage.setItem('training_jm1_solo_migrated_v1', 'true'))
              .catch(err => console.warn('Auto training migration warning:', err));
          }
        });
      } else {
        sheetsService.syncApprovedKtasToMembers().catch(err => console.warn('Silent auto-sync failed:', err));
        firestoreService.purgeEmptyData().catch(() => {});
        const hasMigrated = localStorage.getItem('training_jm1_solo_migrated_v1');
        if (!hasMigrated) {
          sheetsService.bulkSetAllTrainingParticipantsToJayaMelati1Solo()
            .then(() => localStorage.setItem('training_jm1_solo_migrated_v1', 'true'))
            .catch(err => console.warn('Auto training migration warning:', err));
        }
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

    const handleTrainingUpdated = () => {
      sheetsService.getTrainingApplications().then(trainings => {
        if (trainings) setTrainingApps((trainings || []).filter(t => isValidTrainingApp(t)));
      }).catch(e => console.warn('getTrainingApplications on event error:', e));
    };
    window.addEventListener('training_applications_updated', handleTrainingUpdated);

    const unsubContents = sheetsService.subscribeToContents((freshContents: Content[]) => {
      if (Array.isArray(freshContents)) {
        setContents(freshContents);
        if (selectedContentSectionRef.current) {
          const target = selectedContentSectionRef.current;
          const isMatch = (cSec: string | undefined) => {
            const c = (cSec || '').trim().toLowerCase();
            const t = target.trim().toLowerCase();
            if (t === 'galeri' || t === 'video' || t === 'gallery') {
              return c === 'galeri' || c === 'video' || c === 'videos' || c === 'galeri_video' || c === 'galeri-video' || c === 'gallery' || c === 'youtube';
            }
            return c === t;
          };
          setContentList(freshContents.filter(c => isMatch(c.section)));
        }
      }
    });

    return () => {
      unsubMembers();
      unsubCategories();
      unsubActivities();
      unsubApps();
      unsubTrainingApps();
      unsubContents();
    };
  }, []);

  const selectedContentSectionRef = React.useRef(selectedContentSection);
  useEffect(() => {
    selectedContentSectionRef.current = selectedContentSection;
  }, [selectedContentSection]);

  const handleSelectSection = (section: string) => {
    setSelectedContentSection(section);
    // Filter contents for this section with alias support
    const isMatch = (cSec: string | undefined) => {
      const c = (cSec || '').trim().toLowerCase();
      const t = section.trim().toLowerCase();
      if (t === 'galeri' || t === 'video' || t === 'gallery') {
        return c === 'galeri' || c === 'video' || c === 'videos' || c === 'galeri_video' || c === 'galeri-video' || c === 'gallery' || c === 'youtube';
      }
      return c === t;
    };
    const sectionItems = contents.filter(c => isMatch(c.section));
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
          showToast('error', 'URL Video Youtube harus diisi');
          return;
        }
        if (selectedContentSection === 'playlist' && !contentFormData.field1) {
          showToast('error', 'Link File Audio (Drive/URL) harus diisi');
          return;
        }
        if (selectedContentSection === 'playlist' && !contentFormData.field2) {
          showToast('error', 'Judul harus diisi');
          return;
        }
      }
      
      try {
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

        // Optimistic update
        setContents(prev => {
          const idx = prev.findIndex(c => c.id === payload.id);
          if (idx >= 0) {
            const next = [...prev];
            next[idx] = payload;
            return next;
          }
          return [payload, ...prev];
        });
        setContentList(prev => {
          const idx = prev.findIndex(c => c.id === payload.id);
          if (idx >= 0) {
            const next = [...prev];
            next[idx] = payload;
            return next;
          }
          return [payload, ...prev];
        });
        setIsContentModalOpen(false);
        showToast('success', editingContent ? 'Konten berhasil diperbarui!' : 'Konten baru berhasil disimpan!');

        // Reset form
        setContentFormData({
          field1: '',
          field2: '',
          field3: '',
          field4: '',
          field5: ''
        });

        // Background save
        (async () => {
          setBackgroundProcessingText('Menyimpan konten...');
          try {
            await sheetsService.saveContent(payload);
            const allContents = await sheetsService.getContents();
            if (allContents) {
              setContents(allContents);
              setContentList(allContents.filter(c => c.section === selectedContentSection));
            }
          } finally {
            setBackgroundProcessingText(null);
          }
        })().catch(err => console.warn('Background save content warning:', err));

      } catch (error: any) {
        showToast('error', 'Gagal menyimpan konten: ' + (error.message || 'Error tidak diketahui'));
      }
    };

  const handleDeleteContent = async (id: string) => {
    if (confirm('Yakin ingin menghapus konten ini?')) {
      try {
        // Optimistic update
        setContents(prev => prev.filter(c => c.id !== id));
        setContentList(prev => prev.filter(c => c.id !== id));
        showToast('success', 'Konten berhasil dihapus!');

        // Background delete
        (async () => {
          setBackgroundProcessingText('Menghapus konten...');
          try {
            await sheetsService.deleteContent(id);
            const allContents = await sheetsService.getContents();
            if (allContents) {
              setContents(allContents);
              setContentList(allContents.filter(c => c.section === selectedContentSection));
            }
          } finally {
            setBackgroundProcessingText(null);
          }
        })().catch(err => console.warn('Background delete content warning:', err));

      } catch (error: any) {
        showToast('error', 'Gagal menghapus konten: ' + (error?.message || 'Error'));
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
      const materiPayload = editingMateri 
        ? { ...editingMateri, ...materiFormData }
        : {
            ...materiFormData,
            id: Date.now().toString(),
            tanggal: new Date().toISOString()
          };

      // Optimistic update
      setMateriList(prev => {
        const idx = prev.findIndex(m => m.id === materiPayload.id);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = materiPayload;
          return next;
        }
        return [materiPayload, ...prev];
      });
      setIsMateriModalOpen(false);
      showToast('success', editingMateri ? 'Materi berhasil diperbarui!' : 'Materi baru berhasil ditambahkan!');

      // Background save
      (async () => {
        setBackgroundProcessingText('Menyimpan materi...');
        try {
          await sheetsService.saveMateri(materiPayload);
          const data = await sheetsService.getMateri('admin');
          if (data) setMateriList(data);
        } finally {
          setBackgroundProcessingText(null);
        }
      })().catch(err => console.warn('Background save materi warning:', err));

    } catch (error: any) {
      showToast('error', 'Gagal menyimpan materi: ' + (error?.message || 'Error'));
    }
  };

  const handleDeleteMateri = async (id: string) => {
    if (confirm('Yakin ingin menghapus materi ini?')) {
      try {
        // Optimistic update
        setMateriList(prev => prev.filter(m => m.id !== id));
        showToast('success', 'Materi berhasil dihapus!');

        // Background delete
        (async () => {
          setBackgroundProcessingText('Menghapus materi...');
          try {
            await sheetsService.deleteMateri(id);
            const data = await sheetsService.getMateri('admin');
            if (data) setMateriList(data);
          } finally {
            setBackgroundProcessingText(null);
          }
        })().catch(err => console.warn('Background delete materi warning:', err));

      } catch (error: any) {
        showToast('error', 'Gagal menghapus materi: ' + (error?.message || 'Error'));
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
      const synced = syncRolesAndPelatihan(rawRoles, pelatihanArr, member.role);

      const rawTanggal = member.tanggalLahir || (member as any)?.tanggallahir || matchingKta?.tanggalLahir || (matchingKta as any)?.tanggallahir || '';
      const normTanggal = normalizeDateForInput(rawTanggal);
      const resolvedKtaNum = (matchingKta?.ktaNumber || matchingKta?.nomorKTA || member.nomorKTA || member.ktaNumber || member.nbm || (member as any)?.noNbm || '').trim();

      setFormData({
        email: member.email || matchingKta?.email || '',
        namaLengkap: member.namaLengkap || member.nama || matchingKta?.nama || '',
        role: member.role || synced.primaryRole,
        roles: synced.roles,
        jenisKelamin: member.jenisKelamin || matchingKta?.jenisKelamin || 'L',
        golongan: member.golongan || matchingKta?.tingkatan || 'Penghela',
        golonganPelatih: (member as any)?.golonganPelatih || (['Athfal', 'Pengenal', 'Penghela', 'Penuntun'].includes(member?.golongan || '') ? member.golongan : 'Penghela'),
        pelatihan: synced.pelatihan,
        pendidikan: member.pendidikan || 'SMA/SMK/MA',
        asalKwarda: member.asalKwarda || matchingKta?.asalDaerah || '',
        qabilah: member.qabilah || matchingKta?.qabilah || '',
        alamat: member.alamat || matchingKta?.alamat || '',
        noHp: member.noHp || matchingKta?.noWa || '',
        sosmed: member.sosmed || matchingKta?.sosmed || '',
        password: '', // Always empty when opening for security, only update if typed
        isVerified: member.isVerified !== undefined ? member.isVerified : (matchingKta?.status === 'approved'),
        upgradeRequests: Array.isArray(member.upgradeRequests) ? member.upgradeRequests : [],
        photo: member.photo || member.foto || matchingKta?.photo || '',
        tempatLahir: member.tempatLahir || (member as any)?.tempatlahir || matchingKta?.tempatLahir || '',
        tanggalLahir: normTanggal,
        statusKta: matchingKta?.status || (member.isVerified ? 'approved' : 'pending'),
        ktaNumber: resolvedKtaNum,
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
      const synced = syncRolesAndPelatihan(formData.roles, formData.pelatihan, formData.role);
      const isJM = synced.roles.includes('jari1') || synced.roles.includes('jari2') || synced.roles.includes('jaya_matahari_1') || synced.roles.includes('jaya_matahari_2') || synced.primaryRole === 'jari1' || synced.primaryRole === 'jari2';
      const memberId = editingMember?.id || Date.now().toString();
      const primaryRole = formData.role || synced.primaryRole;
      const cleanTanggalLahir = normalizeDateForInput(formData.tanggalLahir || editingMember?.tanggalLahir || '');
      const cleanKtaNumber = (formData.ktaNumber || editingMember?.nomorKTA || editingMember?.ktaNumber || editingMember?.nbm || '').trim();

      const payload = editingMember 
        ? { 
            ...editingMember, 
            ...formData,
            id: memberId,
            nomorKTA: cleanKtaNumber || editingMember?.nomorKTA || editingMember?.ktaNumber || '',
            ktaNumber: cleanKtaNumber || editingMember?.ktaNumber || editingMember?.nomorKTA || '',
            nbm: cleanKtaNumber || editingMember?.nbm || '',
            role: primaryRole,
            roles: synced.roles && synced.roles.length > 0 ? synced.roles : [primaryRole],
            pelatihan: synced.pelatihan,
            photo: formData.photo || editingMember?.photo || (editingMember as any)?.foto || '',
            foto: formData.photo || (editingMember as any)?.foto || editingMember?.photo || '',
            noHp: formData.noHp || editingMember?.noHp || '',
            noWa: formData.noHp || (editingMember as any)?.noWa || editingMember?.noHp || '',
            asalKwarda: formData.asalKwarda || editingMember?.asalKwarda || '',
            asalDaerah: formData.asalKwarda || (editingMember as any)?.asalDaerah || editingMember?.asalKwarda || '',
            qabilah: formData.qabilah || editingMember?.qabilah || '',
            asalQabilah: formData.qabilah || (editingMember as any)?.asalQabilah || editingMember?.qabilah || '',
            alamat: formData.alamat || editingMember?.alamat || '',
            tempatLahir: formData.tempatLahir || editingMember?.tempatLahir || '',
            tanggalLahir: cleanTanggalLahir,
            jenisKelamin: formData.jenisKelamin || editingMember?.jenisKelamin || 'L',
            golongan: formData.golongan || editingMember?.golongan || 'Penghela',
            tingkatan: formData.golongan || (editingMember as any)?.tingkatan || editingMember?.golongan || 'Penghela',
            pendidikan: formData.pendidikan || editingMember?.pendidikan || 'SMA/SMK/MA',
            sosmed: formData.sosmed || editingMember?.sosmed || '',
            isVerified: formData.isVerified !== undefined ? formData.isVerified : (editingMember?.isVerified ?? true),
            statusAktivasi: formData.isVerified ? 'Aktif' : (editingMember?.statusAktivasi || 'Belum Aktif'),
            statusPembayaran: formData.isVerified ? 'Lunas' : (editingMember?.statusPembayaran || 'Belum Bayar'),
            status: formData.isVerified ? 'approved' : (editingMember?.status || 'pending'),
            ...(isJM ? {
              golongan: formData.golonganPelatih || formData.golongan,
              golonganPelatih: formData.golonganPelatih || formData.golongan
            } : {})
          }
        : { 
            ...formData, 
            id: memberId,
            nomorKTA: cleanKtaNumber,
            ktaNumber: cleanKtaNumber,
            nbm: cleanKtaNumber,
            role: primaryRole,
            roles: synced.roles && synced.roles.length > 0 ? synced.roles : [primaryRole],
            pelatihan: synced.pelatihan,
            photo: formData.photo || '',
            foto: formData.photo || '',
            noHp: formData.noHp || '',
            noWa: formData.noHp || '',
            asalKwarda: formData.asalKwarda || '',
            asalDaerah: formData.asalKwarda || '',
            qabilah: formData.qabilah || '',
            asalQabilah: formData.qabilah || '',
            alamat: formData.alamat || '',
            tempatLahir: formData.tempatLahir || '',
            tanggalLahir: cleanTanggalLahir,
            jenisKelamin: formData.jenisKelamin || 'L',
            golongan: formData.golongan || 'Penghela',
            tingkatan: formData.golongan || 'Penghela',
            pendidikan: formData.pendidikan || 'SMA/SMK/MA',
            sosmed: formData.sosmed || '',
            isVerified: formData.isVerified !== undefined ? formData.isVerified : true,
            statusAktivasi: formData.isVerified ? 'Aktif' : 'Belum Aktif',
            statusPembayaran: formData.isVerified ? 'Lunas' : 'Belum Bayar',
            status: formData.isVerified ? 'approved' : 'pending',
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
        showToast('error', 'Anda tidak memiliki izin untuk memberikan akses Super Admin');
        return;
      }

      // Save custom edits directly in localStorage for instant persistent retrieval
      try {
        const stored = localStorage.getItem('member_custom_edits') || '{}';
        const parsed = JSON.parse(stored);
        parsed[payload.id] = payload;
        if (payload.email) parsed[payload.email.toLowerCase().trim()] = payload;
        if (payload.ktaNumber) parsed[payload.ktaNumber] = payload;
        localStorage.setItem('member_custom_edits', JSON.stringify(parsed));
      } catch (e) {}

      // Optimistically update local members state immediately
      setMembers(prev => {
        const idx = prev.findIndex(m => m.id === payload.id || (m.email && payload.email && m.email.toLowerCase().trim() === payload.email.toLowerCase().trim()));
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = { ...next[idx], ...payload };
          return next;
        }
        return [payload, ...prev];
      });

      // If current logged-in user is being updated, sync authStore
      if (user && (user.id === payload.id || (user.email && payload.email && user.email.toLowerCase() === payload.email.toLowerCase()))) {
        useAuthStore.getState().updateUser(payload as Partial<User>);
      }

      setIsModalOpen(false);
      showToast('success', editingMember ? 'Data anggota berhasil diperbarui!' : 'Anggota baru berhasil ditambahkan!');

      // Background save & sync
      (async () => {
        setBackgroundProcessingText('Menyimpan data anggota...');
        try {
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
            tempatLahir: payload.tempatLahir || formData.tempatLahir || '',
            tanggalLahir: cleanTanggalLahir || payload.tanggalLahir || '',
            jenisKelamin: payload.jenisKelamin || formData.jenisKelamin || 'L',
            tingkatan: payload.golongan || formData.golongan || 'Penghela',
            photo: payload.photo || formData.photo || '',
            jenisKta: formData.jenisKta || matchingKta?.jenisKta || 'Reguler',
            status: formData.statusKta || matchingKta?.status || (payload.isVerified ? 'approved' : 'pending'),
            ktaNumber: cleanKtaNumber || formData.ktaNumber || matchingKta?.ktaNumber || payload.ktaNumber || '',
            nomorKTA: cleanKtaNumber || formData.ktaNumber || matchingKta?.nomorKTA || payload.nomorKTA || '',
            nbm: cleanKtaNumber || formData.ktaNumber || matchingKta?.nbm || payload.nbm || '',
            verifiedAt: matchingKta?.verifiedAt || (payload.isVerified ? new Date().toLocaleDateString('id-ID') : '')
          };

          await Promise.all([
            sheetsService.saveMember(payload).catch(e => console.warn("Sheets saveMember warning:", e)),
            firestoreService.saveMember(payload as User).catch(e => console.warn("Firestore saveMember warning:", e)),
            sheetsService.saveKTAApplication(ktaPayload).catch(e => console.warn("Sheets KTA sync warning:", e)),
            firestoreService.saveKTAApplication(ktaPayload).catch(e => console.warn("Firestore KTA sync warning:", e))
          ]);

          const [data, ktaData] = await Promise.all([
            sheetsService.getMembers(),
            sheetsService.getKTAApplications()
          ]);
          if (data) setMembers(data);
          if (ktaData) setKtaApps(ktaData);
        } finally {
          setBackgroundProcessingText(null);
        }
      })().catch(err => console.warn('Background save member warning:', err));

    } catch (error: any) {
      console.error('Save member error:', error);
      showToast('error', 'Gagal menyimpan anggota: ' + (error.message || 'Error tidak diketahui'));
    }
  };

  const handleDeleteMember = async (id: string) => {
    if (confirm('Yakin ingin menghapus anggota ini?')) {
      try {
        setMembers(prev => prev.filter(m => m.id !== id));
        showToast('success', 'Anggota berhasil dihapus!');

        (async () => {
          setBackgroundProcessingText('Menghapus anggota...');
          try {
            await sheetsService.deleteMember(id);
            const data = await sheetsService.getMembers();
            if (data) setMembers(data);
          } finally {
            setBackgroundProcessingText(null);
          }
        })().catch(err => console.warn('Background delete member warning:', err));

      } catch (error: any) {
        showToast('error', 'Gagal menghapus anggota: ' + (error?.message || 'Error'));
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
      showToast('success', `Status verifikasi ${member.namaLengkap || 'Anggota'} diubah menjadi: ${updated.isVerified ? 'TERVERIFIKASI' : 'PENDING'}`);

      // 2. Background save
      (async () => {
        setBackgroundProcessingText('Memperbarui status verifikasi...');
        try {
          await sheetsService.saveMember(updated);
          const data = await sheetsService.getMembers();
          if (data?.length) setMembers(data);
        } finally {
          setBackgroundProcessingText(null);
        }
      })().catch(err => console.warn('Background verify sync warning:', err));

    } catch (error: any) {
      console.error(error);
      showToast('error', 'Gagal mengubah status verifikasi: ' + (error.message || 'Error tidak diketahui'));
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
    const list = filteredTrainingAppsList;

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
    const list = filteredTrainingAppsList;

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
    const sessionList = TRAINING_PROGRAMS[0]?.sessions || [];
    const sessions = sessionList.map(s => s.id);

    const sysEmails = ['admin@hwjateng.com', 'materihw@gmail.com', 'medkom@hwjateng.com', 'admin@hw.org'];
    const enrolled = trainingApps.filter(app => {
      const name = (app?.nama || app?.namaLengkap || '').trim();
      const email = (app?.email || '').toLowerCase().trim();
      if (!name || name === '-' || name.toLowerCase() === 'tanpa nama' || name.includes('@') || sysEmails.includes(email)) return false;
      return isApprovedParticipant(app);
    }).sort((a, b) => (a.nama || a.namaLengkap || '').localeCompare(b.nama || b.namaLengkap || '', 'id', { sensitivity: 'base' }));

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
        app.pelatihanAkanDiikuti || app.jenisPelatihan || 'Pelatihan HW',
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
    link.setAttribute("download", `Data_Presensi_Pelatihan_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const exportTrainingAttendanceToPDF = () => {
    const sessionList = TRAINING_PROGRAMS[0]?.sessions || [];
    const sessions = sessionList.map(s => s.id);

    const sysEmails = ['admin@hwjateng.com', 'materihw@gmail.com', 'medkom@hwjateng.com', 'admin@hw.org'];
    const enrolled = trainingApps.filter(app => {
      const name = (app?.nama || app?.namaLengkap || '').trim();
      const email = (app?.email || '').toLowerCase().trim();
      if (!name || name === '-' || name.toLowerCase() === 'tanpa nama' || name.includes('@') || sysEmails.includes(email)) return false;
      return isApprovedParticipant(app);
    }).sort((a, b) => (a.nama || a.namaLengkap || '').localeCompare(b.nama || b.namaLengkap || '', 'id', { sensitivity: 'base' }));

    const doc = new jsPDF() as any;
    const headers = [['No', 'Nama Peserta', 'Pelatihan', 'Asal Daerah / Qabilah', 'Jumlah Hadir', 'Total Sesi', '% Kehadiran']];
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
        app.pelatihanAkanDiikuti || app.jenisPelatihan || 'Pelatihan HW',
        `${app.asalDaerah || '-'}${app.qabilah ? ` (${app.qabilah})` : ''}`,
        attendedSessions,
        totalSessions,
        `${attendancePercentage}%`
      ];
    });

    doc.setFontSize(14);
    doc.text(`REKAPITULASI PRESENSI PELATIHAN HW JATENG`, 14, 15);
    doc.setFontSize(9);
    doc.text(`Kwartir Wilayah Hizbul Wathan Jawa Tengah - Dicetak: ${new Date().toLocaleString('id-ID')}`, 14, 21);
    doc.text(`Total Peserta: ${enrolled.length} Orang | Jumlah Sesi Kurikulum: ${sessions.length}`, 14, 26);

    autoTable(doc, {
      head: headers,
      body: data,
      startY: 32,
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: '#1a413d', textColor: '#ffffff', fontStyle: 'bold' }
    });

    const dateStr = new Date().toISOString().split('T')[0];
    doc.save(`Rekap_Presensi_Pelatihan_${dateStr}.pdf`);
  };

  // 4. Export Data Kelulusan Pelatihan
  const exportTrainingGraduationToExcel = () => {
    const sysEmails = ['admin@hwjateng.com', 'materihw@gmail.com', 'medkom@hwjateng.com', 'admin@hw.org'];
    const enrolled = trainingApps.filter(app => {
      const name = (app?.nama || app?.namaLengkap || '').trim();
      const email = (app?.email || '').toLowerCase().trim();
      if (!name || name === '-' || name.toLowerCase() === 'tanpa nama' || name.includes('@') || sysEmails.includes(email)) return false;
      return isApprovedParticipant(app) && isMatchTrainingLevel(app, selectedGradeProg);
    }).sort((a, b) => (a.nama || a.namaLengkap || '').localeCompare(b.nama || b.namaLengkap || '', 'id', { sensitivity: 'base' }));

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
    }).sort((a, b) => (a.nama || a.namaLengkap || '').localeCompare(b.nama || b.namaLengkap || '', 'id', { sensitivity: 'base' }));

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
  const [trainingPageSize, setTrainingPageSize] = useState(100);

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
        const rawFilter = trainingFilterActivity.startsWith('jenis:')
          ? trainingFilterActivity.replace('jenis:', '').trim()
          : trainingFilterActivity.trim();

        const allTypes = (settings.trainingTypes && settings.trainingTypes.length > 0)
          ? settings.trainingTypes
          : ['Jaya Melati 1', 'Jaya Melati 2', 'Jaya Matahari 1', 'Jaya Matahari 2', 'Jati 1', 'Jati 2', 'Jari 1', 'Jari 2'];
        
        const isTypeMatch = trainingFilterActivity.startsWith('jenis:') || allTypes.some((t: string) => t.toLowerCase() === rawFilter.toLowerCase());

        if (isTypeMatch) {
          const targetType = rawFilter.toLowerCase();
          const prog = (app?.pelatihanAkanDiikuti || app?.jenisPelatihan || '').toLowerCase().trim();
          const targetKey = getNormalizedLevelKey(targetType);
          const appKey = getNormalizedLevelKey(prog);
          matchActivity = prog.includes(targetType) || targetType.includes(prog) || (targetKey && appKey && targetKey === appKey);
        } else {
          const acts = allTrainingActivitiesList;
          const selAct = acts.find((a: any) => String(a.id) === trainingFilterActivity || a.namaKegiatan === trainingFilterActivity);
          const filterStr = (selAct?.namaKegiatan || selAct?.jenisPelatihan || rawFilter).toLowerCase();
          const prog = (app?.pelatihanAkanDiikuti || app?.jenisPelatihan || '').toLowerCase();
          const loc = (app?.lokasiPelatihan || app?.lokasi || '').toLowerCase();
          const dt = (app?.tanggalPelatihan || app?.tanggal || '').toLowerCase();
          const appActId = String(app?.activityId || app?.activity_id || app?.kegiatanId || '').toLowerCase();

          matchActivity = (selAct?.id && appActId && appActId === String(selAct.id).toLowerCase()) ||
            prog.includes(filterStr) ||
            (selAct?.lokasiPelatihan && loc.includes(selAct.lokasiPelatihan.toLowerCase())) ||
            (selAct?.tanggalPelatihan && dt.includes(selAct.tanggalPelatihan.toLowerCase()));
        }
      }

      return matchSearch && matchStatus && matchActivity;
    }).sort((a, b) => {
      const nameA = String(a?.nama || a?.namaLengkap || '').trim();
      const nameB = String(b?.nama || b?.namaLengkap || '').trim();
      if (nameA && nameB) {
        const comp = nameA.localeCompare(nameB, 'id', { sensitivity: 'base' });
        if (comp !== 0) return comp;
      }
      const timeA = new Date(a.tanggalAjuan || a.updatedAt || a.createdAt || 0).getTime();
      const timeB = new Date(b.tanggalAjuan || b.updatedAt || b.createdAt || 0).getTime();
      if (timeA !== timeB) return timeB - timeA;
      return String(b.id || '').localeCompare(String(a.id || ''));
    });
  }, [trainingApps, trainingSearchQuery, trainingFilterStatus, trainingFilterActivity, settings.trainingActivities, settings.trainingTypes, allTrainingActivitiesList]);

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
                {isPelatihOnly ? 'Mode Pelatih â€¢ Tim Pelatih HW Jateng' : (isDiklatAdmin ? 'Admin Diklat' : user?.role)}
              </span>
              <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                Gerakan Kepanduan Hizbul Wathan
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Mode Switcher - Only shown for appointed Jaya Matahari trainers (isPelatihOnly) */}
          {isPelatihOnly && (
            <div className="hidden sm:flex bg-gray-100 p-1 rounded-2xl items-center border border-gray-200/60 shadow-xs">
              <Link
                to="/pelatihan"
                className="px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider text-gray-500 hover:text-gray-800 transition-all cursor-pointer"
              >
                Mode Anggota
              </Link>
              <span
                className="px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider bg-hw-green text-white shadow-xs flex items-center gap-1 cursor-default"
              >
                <GraduationCap size={13} />
                Mode Pelatih
              </span>
            </div>
          )}

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
      {!isPelatihOnly && (
        <div className="w-full pb-3 sticky top-0 bg-gray-50 z-10 -mx-4 px-4 pt-2 border-b border-gray-200/60 flex justify-center">
          <div className="flex flex-wrap justify-center items-center gap-2 sm:gap-2.5 max-w-6xl mx-auto">
            {[
              (!isDiklatAdmin) && { id: 'anggota', label: 'Anggota', icon: Users, activeClass: 'bg-gradient-to-r from-emerald-500 via-teal-500 to-blue-600 text-white shadow-lg shadow-emerald-500/25 ring-2 ring-emerald-400', hoverClass: 'hover:border-emerald-300 hover:text-emerald-600' },
              (!isDiklatAdmin) && { id: 'kta', label: 'KTA', icon: CreditCard, activeClass: 'bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-lg shadow-emerald-600/25 ring-2 ring-emerald-500', hoverClass: 'hover:border-emerald-300 hover:text-emerald-600' },
              { id: 'pelatihan', label: 'Pelatihan', icon: GraduationCap, activeClass: 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg shadow-orange-500/25 ring-2 ring-amber-400', hoverClass: 'hover:border-amber-300 hover:text-orange-600' },
              (!isDiklatAdmin) && { id: 'kegiatan', label: 'Kegiatan', icon: Calendar, activeClass: 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/25 ring-2 ring-cyan-400', hoverClass: 'hover:border-cyan-300 hover:text-cyan-600' },
              (!isDiklatAdmin) && { id: 'materi', label: 'Materi', icon: BookOpen, activeClass: 'bg-gradient-to-r from-teal-600 to-cyan-700 text-white shadow-lg shadow-teal-600/25 ring-2 ring-teal-500', hoverClass: 'hover:border-teal-300 hover:text-teal-600' },
              (!isDiklatAdmin) && { id: 'konten', label: 'Konten', icon: Layout, activeClass: 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/25 ring-2 ring-purple-400', hoverClass: 'hover:border-purple-300 hover:text-purple-600' },
              (!isDiklatAdmin) && user?.role === 'superadmin' && { id: 'admin', label: 'Admin', icon: Shield, activeClass: 'bg-gradient-to-r from-indigo-600 to-blue-700 text-white shadow-lg shadow-indigo-500/25 ring-2 ring-indigo-400', hoverClass: 'hover:border-indigo-300 hover:text-indigo-600' },
              (!isDiklatAdmin) && user?.role === 'superadmin' && { id: 'pengaturan', label: 'Pengaturan', icon: Settings, activeClass: 'bg-gradient-to-r from-slate-700 to-slate-900 text-white shadow-lg shadow-slate-700/25 ring-2 ring-slate-600', hoverClass: 'hover:border-slate-300 hover:text-slate-800' },
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
      )}

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
                              <span className="text-xs font-mono font-medium text-hw-blue/70">{row.password || 'â€¢â€¢â€¢â€¢â€¢'}</span>
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
                                    <img src={`https://img.youtube.com/vi/${extractYoutubeId(item.field1 || (item as any).url || '') || '0'}/mqdefault.jpg`} 
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
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">Pusat Data & Migrasi 100% Cloud Firebase</h4>
                  <span className="text-[9px] font-black px-2.5 py-1 rounded-full uppercase bg-emerald-100 text-emerald-800 border border-emerald-300">
                    ðŸ”¥ 100% Firebase Database Aktif
                  </span>
                </div>

                {/* Banner 100% Firebase Standalone */}
                <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 p-6 rounded-[2rem] text-white shadow-xl space-y-4 border border-emerald-500/30">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-400/30 flex items-center justify-center text-2xl shrink-0 shadow-lg">
                        ðŸ”¥
                      </div>
                      <div>
                        <h5 className="text-base font-black tracking-wide text-white">Migrasi & Salin Semua Data ke Firebase</h5>
                        <p className="text-xs text-emerald-250 font-medium mt-0.5 leading-relaxed">
                          Aplikasi telah siap 100% mandiri di Cloud Firestore. Seluruh data Anggota, KTA, Pelatihan, Kegiatan, Materi, dan Konten tersimpan langsung di Firebase tanpa ketergantungan Google Sheets.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={async () => {
                        if (!confirm('Jalankan migrasi dan salin seluruh data (Anggota, KTA, Pelatihan, Kegiatan, Materi, Pengaturan) ke Firebase sekarang?')) return;
                        try {
                          setIsSyncing(true);
                          const res = await firestoreService.backupAndUploadAllToFirestore();
                          if (res.success) {
                            await fetchData();
                            alert('âœ… MIGRASI SUKSES: Seluruh data berhasil disalin 100% ke Cloud Firestore Firebase!');
                          } else {
                            alert('Info: ' + res.message);
                          }
                        } catch (err: any) {
                          alert('Gagal migrasi: ' + (err?.message || err));
                        } finally {
                          setIsSyncing(false);
                        }
                      }}
                      disabled={isSyncing}
                      className="px-6 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 rounded-2xl font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 shrink-0"
                    >
                      <RefreshCw size={16} className={isSyncing ? 'animate-spin' : ''} />
                      {isSyncing ? 'Memindahkan Data...' : 'Salin Semua Data ke Firebase (100%)'}
                    </button>
                  </div>
                </div>

                <div className="bg-hw-blue/5 p-6 rounded-[2rem] border border-hw-blue/10 flex flex-wrap items-center justify-between gap-6">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-hw-blue text-white flex items-center justify-center shadow-lg shadow-hw-blue/20">
                      <Database size={28} />
                    </div>
                    <div>
                      <h5 className="text-sm font-bold text-gray-800">Backup & Sinkronisasi Database</h5>
                      <p className="text-xs text-hw-blue font-medium mt-1">Terakhir backup: {settings.lastBackup}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <button 
                      onClick={async () => {
                        try {
                          setIsSyncing(true);
                          const res = await firestoreService.initAndSyncWithFirestore();
                          await fetchData();
                          alert('Database Firestore berhasil diperbarui: ' + (res.message || 'Sukses'));
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
                      {isSyncing ? 'Syncing...' : 'Sync Firestore'}
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
                        <p className="font-bold text-xs mb-1">ðŸ’¡ Cara Memperbarui Kode Apps Script Anda:</p>
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
                                <span className="text-gray-400 font-mono font-bold text-[9px]">{count} total <span className="text-green-600 font-extrabold">({approved} âœ”)</span></span>
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
                                ðŸŽ‰ Tidak ada antrean KTA tertunda! Semua pengajuan telah diverifikasi.
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
                            <span className="text-emerald-700 font-semibold">â€¢ Total: <strong>{filteredKtaApps.length}</strong> anggota</span>
                            <span className="text-emerald-700 font-semibold">â€¢ KTA Aktif (Resmi): <strong>{filteredKtaApps.filter(a => a.status === 'approved').length}</strong></span>
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
                                        setEditingKtaApp({
                                          ...app,
                                          tanggalLahir: normalizeDateForInput(app.tanggalLahir || (app as any).tanggallahir || '')
                                        });
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
                        ðŸ’¡ Panduan Dimensi & Format Template:
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
                      <span className="p-1.5 bg-hw-green text-white rounded-xl text-xs shadow-xs">ðŸŽ–ï¸</span>
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
                      ðŸ“Š
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
                        âš™ï¸
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
                        <span className="p-1 bg-emerald-600 text-white rounded-lg text-xs">ðŸ…</span>
                        <span>Filter Jenis & Kegiatan Pelatihan (Filter Utama)</span>
                      </label>
                      <span className="text-[9.5px] font-extrabold text-emerald-800 bg-emerald-100/90 px-2.5 py-0.5 rounded-full border border-emerald-200/80 self-start sm:self-auto">
                        âš¡ Mempengaruhi Semua Data: Peserta, Presensi, Penugasan, Penilaian & Piagam
                      </span>
                    </div>
                    
                    <div className="relative">
                      <select
                        value={trainingFilterActivity || 'Semua'}
                        onChange={(e) => {
                          const val = e.target.value;
                          setTrainingFilterActivity(val);
                          setTrainingPage(1);
                          if (val !== 'Semua') {
                            let progMatch = 'Jaya Melati 1';
                            if (val.startsWith('jenis:')) {
                              progMatch = val.replace('jenis:', '').trim();
                            } else {
                              const selAct = allTrainingActivitiesList.find((a: any) => String(a.id) === val || a.namaKegiatan === val);
                              if (selAct && (selAct.jenisPelatihan || selAct.namaKegiatan)) {
                                progMatch = selAct.jenisPelatihan || selAct.namaKegiatan;
                              }
                            }
                            const normalizedProg = progMatch.includes('Jaya Matahari 2') ? 'Jaya Matahari 2'
                              : progMatch.includes('Jaya Matahari 1') ? 'Jaya Matahari 1'
                              : progMatch.includes('Jaya Melati 2') ? 'Jaya Melati 2'
                              : progMatch.includes('Jati 2') ? 'Jati 2'
                              : progMatch.includes('Jari 1') ? 'Jari 1'
                              : progMatch.includes('Jari 2') ? 'Jari 2'
                              : 'Jaya Melati 1';
                            setSelectedPresensiProg(normalizedProg as any);
                            setSelectedTugasProg(normalizedProg as any);
                            setSelectedGradeProg(normalizedProg as any);
                            setSelectedPiagamProg(normalizedProg as any);
                          }
                        }}
                        className="w-full bg-white border-2 border-emerald-300/80 text-emerald-950 rounded-2xl py-2.5 px-3.5 font-black text-xs sm:text-sm outline-none focus:ring-2 focus:ring-emerald-400 cursor-pointer shadow-2xs truncate"
                      >
                        <option value="Semua">ðŸŒ SEMUA JENIS & KEGIATAN PELATIHAN (Semua Data)</option>
                        
                        {/* 1. KELOMPOK JENIS PELATIHAN (DIBUAT DI KELOLA JENIS PELATIHAN) */}
                        <optgroup label="ðŸ·ï¸ KELOMPOK JENIS PELATIHAN (Kelola Jenis Pelatihan)">
                          {(settings.trainingTypes || ['Jaya Melati 1', 'Jaya Melati 2', 'Jaya Matahari 1', 'Jaya Matahari 2', 'Jati 1', 'Jati 2', 'Jari 1', 'Jari 2']).map((typ: string, idx: number) => (
                            <option key={`type-${idx}`} value={`jenis:${typ}`}>
                              ðŸ… Jenis Pelatihan: {typ}
                            </option>
                          ))}
                        </optgroup>

                        {/* 2. DAFTAR KEGIATAN PELATIHAN AKTIF */}
                        {allTrainingActivitiesList.length > 0 && (
                          <optgroup label="ðŸ“ KEGIATAN PELATIHAN AKTIF (Lokasi & Tanggal)">
                            {[...allTrainingActivitiesList].reverse().map((act: any, idx: number) => {
                              const title = act.namaKegiatan || act.jenisPelatihan || `Kegiatan ${idx + 1}`;
                              const loc = act.lokasiPelatihan || act.lokasi || 'Lokasi Belum Ditentukan';
                              const dt = act.tanggalPelatihan || act.tanggal || 'Tanggal Belum Ditentukan';
                              return (
                                <option key={act.id || `act-${idx}`} value={act.id || title}>
                                  ðŸ“ {title} â€¢ {loc} (ðŸ“… {dt})
                                </option>
                              );
                            })}
                          </optgroup>
                        )}
                      </select>
                    </div>
                  </div>

                  {/* 5 SUB-TAB NAVIGATION PILLS */}
                  <div className="flex border-b border-gray-150/80 overflow-x-auto scrollbar-none gap-2 px-1 pt-1">
                    {[
                      { id: 'peserta', label: '1. Data Peserta Pelatihan', desc: 'Verifikasi & Biodata', icon: 'ðŸ“‹', activeClass: 'border-blue-600 text-blue-700 bg-blue-50 font-black shadow-xs' },
                      { id: 'presensi', label: '2. Presensi', desc: 'Absensi per Materi', icon: 'ðŸ“', activeClass: 'border-emerald-600 text-emerald-700 bg-emerald-50 font-black shadow-xs' },
                      { id: 'penugasan', label: '3. Penugasan', desc: 'Ulasan Tugas', icon: 'ðŸ“š', activeClass: 'border-amber-500 text-amber-700 bg-amber-50 font-black shadow-xs' },
                      { id: 'penilaian', label: '4. Penilaian & Kelulusan', desc: 'Status Kelulusan', icon: 'ðŸŽ“', activeClass: 'border-purple-600 text-purple-700 bg-purple-50 font-black shadow-xs' },
                      { id: 'piagam', label: '5. Cetak Piagam', desc: 'Unduh Sertifikat', icon: 'ðŸ†', activeClass: 'border-rose-500 text-rose-700 bg-rose-50 font-black shadow-xs' },
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
                    <div className="bg-white p-4 sm:p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4 w-full box-border">
                      {/* Top Row: Full-width Search Input */}
                      <div className="w-full">
                        {/* Search Query Input */}
                        <div className="relative w-full">
                          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={20} />
                          <input 
                            type="text" 
                            placeholder="Cari nama peserta, nomor WhatsApp, NBM, atau asal daerah..." 
                            value={trainingSearchQuery || ''}
                            onChange={(e) => setTrainingSearchQuery(e.target.value)}
                            className="w-full bg-gray-50/90 border border-gray-200 focus:border-hw-green focus:bg-white rounded-2xl py-3.5 pl-12 pr-12 focus:ring-4 focus:ring-hw-green/15 outline-none text-xs sm:text-sm font-bold text-gray-800 transition-all placeholder:text-gray-400 placeholder:font-normal shadow-2xs"
                          />
                          {trainingSearchQuery && (
                            <button
                              type="button"
                              onClick={() => setTrainingSearchQuery('')}
                              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 bg-gray-200/70 hover:bg-gray-300 p-1.5 rounded-full transition-colors cursor-pointer"
                              title="Hapus pencarian"
                            >
                              <X size={14} />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Bottom Row: Status Filter Tabs & Action Buttons */}
                      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 pt-3 border-t border-gray-100/90">
                        {/* Filter Status Pendaftaran */}
                        <div className="flex flex-wrap items-center gap-1.5">
                          {['Semua', 'pending', 'approved', 'rejected'].map((st) => (
                            <button
                              key={st}
                              onClick={() => setTrainingFilterStatus(st)}
                              className={`px-3.5 py-2 rounded-xl text-xs font-black capitalize whitespace-nowrap transition-all border cursor-pointer ${
                                trainingFilterStatus === st 
                                ? 'bg-hw-dark text-white border-hw-dark shadow-xs' 
                                : 'bg-gray-50/80 text-gray-600 border-gray-200 hover:bg-gray-100 hover:text-gray-800'
                              }`}
                            >
                              {st === 'pending' ? 'Menunggu' : st === 'approved' ? 'Disetujui' : st === 'rejected' ? 'Ditolak' : 'Semua Status'}
                            </button>
                          ))}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            onClick={exportTrainingParticipantsToExcel}
                            className="px-3.5 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                            title="Eksport Excel (CSV)"
                          >
                            <FileSpreadsheet size={14} /> Export Excel
                          </button>
                          <button
                            onClick={exportTrainingParticipantsToPDF}
                            className="px-3.5 py-2 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
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
                            className="px-4 py-2 bg-hw-green hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md shadow-hw-green/15 flex items-center gap-1.5 cursor-pointer"
                          >
                            <UserPlus size={14} /> Tambah Peserta
                          </button>
                        </div>
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
                                    <div className="space-y-2 mt-2 bg-indigo-50/80 p-2.5 rounded-2xl border border-indigo-200/80 shadow-xs max-w-[260px]">
                                      <div className="space-y-0.5">
                                        <label className="text-[8px] font-black uppercase text-indigo-900 tracking-wider">ðŸ·ï¸ Jenis / Program Pelatihan</label>
                                        <select
                                          value={editPelatihan || app.pelatihanAkanDiikuti || ''}
                                          onChange={(e) => handleInlineScheduleTrainingChange(e.target.value)}
                                          className="w-full text-[10px] p-1.5 bg-white border border-indigo-200 rounded-lg outline-none font-bold text-gray-800 shadow-2xs cursor-pointer"
                                        >
                                          {allTrainingActivitiesList.length > 0 && (
                                            <optgroup label="ðŸ“‹ Kegiatan Pelatihan (Kelola Jenis Pelatihan)">
                                              {allTrainingActivitiesList.map((act: any) => {
                                                const actName = act.namaKegiatan || act.jenisPelatihan;
                                                return (
                                                  <option key={act.id || actName} value={actName}>
                                                    {actName} {act.lokasiPelatihan ? `ðŸ“ ${act.lokasiPelatihan}` : ''}
                                                  </option>
                                                );
                                              })}
                                            </optgroup>
                                          )}
                                          <optgroup label="ðŸ·ï¸ Jenis Pelatihan">
                                            {(settings.trainingTypes || ['Jaya Melati 1', 'Jaya Melati 2', 'Jaya Matahari 1', 'Jaya Matahari 2', 'Jati 1', 'Jati 2', 'Jari 1', 'Jari 2']).map((typ: string) => (
                                              <option key={typ} value={typ}>{typ}</option>
                                            ))}
                                          </optgroup>
                                        </select>
                                      </div>
                                      <div className="space-y-0.5">
                                        <label className="text-[8px] font-black uppercase text-gray-600 tracking-wider">ðŸ“ Lokasi Pelatihan</label>
                                        <div className="relative">
                                          <input
                                            type="text"
                                            list={`inline-loc-list-${app.id}`}
                                            value={editLokasi}
                                            onChange={(e) => handleInlineScheduleLocationChange(e.target.value)}
                                            placeholder="Pilih / ketik lokasi..."
                                            className="w-full text-[10px] p-1.5 bg-white border border-gray-200 rounded-lg outline-none font-bold text-gray-700 shadow-2xs"
                                          />
                                          <datalist id={`inline-loc-list-${app.id}`}>
                                            {Array.from(new Set([
                                              ...(allTrainingActivitiesList.map((a: any) => a.lokasiPelatihan || a.lokasi).filter(Boolean)),
                                              ...(settings.trainingLocations || ['Kwarda HW Solo', 'Pusdiklat HW Jateng'])
                                            ])).map((loc: string, idx: number) => (
                                              <option key={idx} value={loc} />
                                            ))}
                                          </datalist>
                                        </div>
                                      </div>
                                      <div className="space-y-0.5">
                                        <label className="text-[8px] font-black uppercase text-gray-600 tracking-wider">ðŸ“… Tanggal Pelaksanaan</label>
                                        <div className="relative">
                                          <input
                                            type="text"
                                            list={`inline-dt-list-${app.id}`}
                                            value={editTanggal}
                                            onChange={(e) => setEditTanggal(e.target.value)}
                                            placeholder="Otomatis terisi dari kegiatan..."
                                            className="w-full text-[10px] p-1.5 bg-white border border-gray-200 rounded-lg outline-none font-bold text-gray-700 shadow-2xs"
                                          />
                                          <datalist id={`inline-dt-list-${app.id}`}>
                                            {Array.from(new Set([
                                              ...(allTrainingActivitiesList.map((a: any) => a.tanggalPelatihan || a.tanggal).filter(Boolean)),
                                              ...(settings.trainingDates || ['Jadwal Reguler'])
                                            ])).map((dt: string, idx: number) => (
                                              <option key={idx} value={dt} />
                                            ))}
                                          </datalist>
                                        </div>
                                      </div>
                                      <div className="flex gap-1.5 pt-1">
                                        <button
                                          onClick={() => handleSaveSchedule(app.id)}
                                          className="flex-1 py-1.5 bg-hw-green text-white text-[9px] font-black rounded-lg hover:bg-emerald-700 uppercase tracking-wider transition-all shadow-xs"
                                        >
                                          Simpan
                                        </button>
                                        <button
                                          onClick={() => setEditingScheduleAppId(null)}
                                          className="px-2.5 py-1.5 bg-gray-200 text-gray-700 text-[9px] font-black rounded-lg hover:bg-gray-300 uppercase tracking-wider transition-all"
                                        >
                                          Batal
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <>
                                      {app.lokasiPelatihan ? (
                                        <div className="text-[10px] text-gray-550 font-bold mt-1.5 flex items-center gap-1">
                                          <span>ðŸ“</span> <span className="text-gray-700 leading-tight">{app.lokasiPelatihan}</span>
                                        </div>
                                      ) : (
                                        <div className="text-[10px] text-gray-400 italic mt-1.5 flex items-center gap-1">
                                          <span>ðŸ“</span> <span className="leading-tight">Lokasi belum diatur</span>
                                        </div>
                                      )}
                                      {app.tanggalPelatihan ? (
                                        <div className="text-[10px] text-gray-550 font-bold flex items-center gap-1 mt-0.5">
                                          <span>ðŸ“…</span> <span className="text-gray-600 leading-tight">{app.tanggalPelatihan}</span>
                                        </div>
                                      ) : (
                                        <div className="text-[10px] text-gray-400 italic flex items-center gap-1 mt-0.5">
                                          <span>ðŸ“…</span> <span className="leading-tight">Tanggal belum diatur</span>
                                        </div>
                                      )}
                                      <button 
                                        onClick={() => {
                                          setEditingScheduleAppId(app.id);
                                          setEditPelatihan(app.pelatihanAkanDiikuti || '');
                                          setEditLokasi(app.lokasiPelatihan || '');
                                          setEditTanggal(app.tanggalPelatihan || '');
                                        }}
                                        className="text-[8px] text-indigo-600 hover:text-indigo-800 font-extrabold mt-1.5 flex items-center gap-0.5 uppercase tracking-wider hover:underline"
                                      >
                                        âœï¸ Edit Jadwal & Lokasi
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
                                      <span>{app.statusPembayaran === 'Lunas' ? 'ðŸ’° LUNAS' : 'â³ BELUM LUNAS'}</span>
                                    </button>
                                  </div>
                                </td>

                                <td className="p-4 text-right pr-6">
                                  <div className="flex flex-wrap gap-1.5 justify-end">
                                    {/* WhatsApp Tagihan Button */}
                                    {app.noWa && (
                                      <a
                                        href={`https://wa.me/${String(app.noWa || '').replace(/[^0-9]/g, '').replace(/^0/, '62')}?text=${encodeURIComponent(
                                          `Assalamu'alaikum Sdr/i ${app.nama}, konfirmasi tagihan pendaftaran pelatihan ${app.pelatihanAkanDiikuti} HW Jateng.\n\nðŸ“ Lokasi: ${app.lokasiPelatihan || 'Pusdiklat HW Jateng'}\nðŸ“… Tanggal: ${app.tanggalPelatihan || 'Jadwal Reguler'}\nðŸ’° Biaya: ${app.biayaPelatihan || 'Rp 50.000'}\nðŸ’³ Status Pembayaran: ${app.statusPembayaran || (app.status === 'approved' ? 'Lunas' : 'Belum Lunas')}\nðŸ¦ Rekening Transfer: ${app.rekeningPembiayaan || 'Bank BSI 7307427448 a.n. Kwarwil HW Jateng'}\n\nMohon informasi/konfirmasi pembayarannya. Terima kasih.`
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
                                      onClick={() => handleDeleteTrainingParticipant(app.id, app.nama)}
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
                            value={trainingPageSize || 100}
                            onChange={(e) => {
                              setTrainingPageSize(Number(e.target.value));
                              setTrainingPage(1);
                            }}
                            className="bg-white border border-gray-200 rounded-lg px-2.5 py-1 text-xs font-bold text-gray-700 outline-none cursor-pointer hover:border-gray-300 shadow-2xs"
                          >
                            <option value={100}>100</option>
                            <option value={200}>200</option>
                            <option value={500}>500</option>
                            <option value={1000}>1000</option>
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
                    {/* Presensi Header */}
                    <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-gray-100 shadow-xs">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-hw-green/10 text-hw-green flex items-center justify-center font-black">
                          <CheckCircle2 size={18} />
                        </div>
                        <div>
                          <h4 className="text-xs font-black text-gray-800 uppercase tracking-wider">
                            Presensi Kehadiran Pelatihan
                          </h4>
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                            Rekapitulasi absensi sesi materi peserta pelatihan HW Jateng
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <div className="text-right border-r border-gray-100 pr-3 hidden sm:block">
                          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Total Peserta Disetujui</span>
                          <span className="text-sm font-black text-hw-green">
                            {trainingApps.filter(app => isApprovedParticipant(app)).length} Orang
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={exportTrainingAttendanceToExcel}
                            className="px-3 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                            title="Eksport Excel (CSV)"
                          >
                            <FileSpreadsheet size={14} /> Export Excel
                          </button>
                          <button
                            onClick={exportTrainingAttendanceToPDF}
                            className="px-3 py-2 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                            title="Eksport PDF"
                          >
                            <Download size={14} /> Export PDF
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Presensi Grid Table */}
                    {(() => {
                      const matchedProg = TRAINING_PROGRAMS.find(p => getNormalizedLevelKey(p.id) === getNormalizedLevelKey(selectedPresensiProg)) || TRAINING_PROGRAMS[0];
                      const sessionList = matchedProg?.sessions || TRAINING_PROGRAMS[0]?.sessions || [];
                      const sessions = sessionList.map(s => s.id);

                      const sysEmails = ['admin@hwjateng.com', 'materihw@gmail.com', 'medkom@hwjateng.com', 'admin@hw.org'];
                      const enrolled = trainingApps.filter(app => {
                        const name = (app?.nama || app?.namaLengkap || '').trim();
                        const email = (app?.email || '').toLowerCase().trim();
                        if (!name || name === '-' || name.toLowerCase() === 'tanpa nama' || name.includes('@') || sysEmails.includes(email)) return false;
                        if (!isApprovedParticipant(app)) return false;
                        if (trainingFilterActivity && trainingFilterActivity !== 'Semua') {
                          const rawFilter = trainingFilterActivity.startsWith('jenis:') ? trainingFilterActivity.replace('jenis:', '').trim() : trainingFilterActivity.trim();
                          const prog = (app?.pelatihanAkanDiikuti || app?.jenisPelatihan || '').toLowerCase().trim();
                          const targetKey = getNormalizedLevelKey(rawFilter);
                          const appKey = getNormalizedLevelKey(prog);
                          if (targetKey && appKey && targetKey === appKey) return true;
                          if (prog.includes(rawFilter.toLowerCase()) || rawFilter.toLowerCase().includes(prog)) return true;
                          const selAct = allTrainingActivitiesList.find((a: any) => String(a.id) === trainingFilterActivity || a.namaKegiatan === trainingFilterActivity);
                          if (selAct && ((selAct.id && String(app?.activityId || app?.activity_id) === String(selAct.id)) || (selAct.namaKegiatan && prog.includes(selAct.namaKegiatan.toLowerCase())))) return true;
                          return false;
                        }
                        return true;
                      }).sort((a, b) => (a.nama || a.namaLengkap || '').localeCompare(b.nama || b.namaLengkap || '', 'id', { sensitivity: 'base' }));

                      return enrolled.length === 0 ? (
                        <div className="bg-white p-12 text-center rounded-3xl border border-gray-100 text-gray-400 font-bold uppercase tracking-wider">
                          Belum ada peserta yang disetujui untuk pelatihan.
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
                    {/* PANEL PENGATURAN PRE TEST & POST TEST & BANK SOAL */}
                    <TestManagementPanel
                      settings={settings}
                      applications={trainingApps}
                      onViewTestApp={(app) => setViewingTestApp(app)}
                      onSaveSettings={async (updatedSettings) => {
                        await sheetsService.saveSettings(updatedSettings);
                        setSettings(updatedSettings);
                      }}
                    />

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
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-lg bg-hw-green/10 flex items-center justify-center text-hw-green">
                                <BookOpen size={18} />
                              </div>
                              <div>
                                <h3 className="text-sm font-black text-gray-800 uppercase tracking-wider">Panel Pemberian Tugas Kurikulum</h3>
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Pilih materi untuk memberikan/mengedit penugasan peserta</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 self-start sm:self-auto">
                              <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider mr-1">Tingkat:</span>
                              {['Jati 1', 'Jati 2', 'Jari 1'].map((prog) => (
                                <button
                                  key={prog}
                                  onClick={() => {
                                    setSelectedTugasProg(prog as any);
                                    setSelectedTugasMateriId('all');
                                  }}
                                  className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all border ${
                                    selectedTugasProg === prog 
                                      ? 'bg-hw-green text-white border-hw-green shadow-xs' 
                                      : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                                  }`}
                                >
                                  {prog}
                                </button>
                              ))}
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
                                        <span className="block truncate">ðŸ“Œ {activeAssignment.instruksi || 'Tanpa instruksi khusus'}</span>
                                        {activeAssignment.deadline && <span className="block text-[9px] text-emerald-600/80">ðŸ•’ Batas: {activeAssignment.deadline}</span>}
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

                    {/* Rekap Penugasan, Pre-Test & Post-Test */}
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
                      const allEnrolled = trainingApps.filter(app => {
                        const name = (app?.nama || app?.namaLengkap || '').trim();
                        const email = (app?.email || '').toLowerCase().trim();
                        if (!name || name === '-' || name.toLowerCase() === 'tanpa nama' || name.includes('@') || sysEmails.includes(email)) return false;
                        return isApprovedParticipant(app) && isMatchTrainingLevel(app, selectedTugasProg);
                      }).sort((a, b) => (a.nama || a.namaLengkap || '').localeCompare(b.nama || b.namaLengkap || '', 'id', { sensitivity: 'base' }));

                      // Aggregate Statistics for Pre Test, Post Test, and Assignments
                      const totalEnrolled = allEnrolled.length;
                      let preDoneCount = 0;
                      let preScoreSum = 0;
                      let postDoneCount = 0;
                      let postScoreSum = 0;
                      let tugasDoneCount = 0;

                      allEnrolled.forEach(app => {
                        const preS = getAppPreTestScore(app);
                        if (preS !== null) {
                          preDoneCount++;
                          preScoreSum += preS;
                        }
                        const postS = getAppPostTestScore(app);
                        if (postS !== null) {
                          postDoneCount++;
                          postScoreSum += postS;
                        }
                        const tasks = getAppTasksList(app);
                        if (tasks.length > 0) {
                          tugasDoneCount++;
                        }
                      });

                      const avgPre = preDoneCount > 0 ? (preScoreSum / preDoneCount).toFixed(1) : '-';
                      const avgPost = postDoneCount > 0 ? (postScoreSum / postDoneCount).toFixed(1) : '-';
                      const incompleteCount = allEnrolled.filter(app => {
                        const preS = getAppPreTestScore(app);
                        const postS = getAppPostTestScore(app);
                        const tasks = getAppTasksList(app);
                        return preS === null || postS === null || tasks.length === 0;
                      }).length;

                      // Filter according to searchQuery and tugasFilterType
                      const filteredEnrolled = allEnrolled.filter(app => {
                        // 1. Search Query
                        if (tugasSearchQuery.trim()) {
                          const q = tugasSearchQuery.toLowerCase().trim();
                          const n = (app.nama || app.namaLengkap || '').toLowerCase();
                          const em = (app.email || '').toLowerCase();
                          const nbm = String(app.nbm || app.ktaNumber || app.nomorKTA || '').toLowerCase();
                          const reg = (app.asalDaerah || '').toLowerCase();
                          const qab = (app.qabilah || '').toLowerCase();
                          if (!n.includes(q) && !em.includes(q) && !nbm.includes(q) && !reg.includes(q) && !qab.includes(q)) {
                            return false;
                          }
                        }

                        // 2. Filter Type
                        const preS = getAppPreTestScore(app);
                        const postS = getAppPostTestScore(app);
                        const tasks = getAppTasksList(app);

                        if (tugasFilterType === 'pre_done') return preS !== null;
                        if (tugasFilterType === 'post_done') return postS !== null;
                        if (tugasFilterType === 'tugas_done') return tasks.length > 0;
                        if (tugasFilterType === 'incomplete') return preS === null || postS === null || tasks.length === 0;

                        return true;
                      });

                      return totalEnrolled === 0 ? (
                        <div className="bg-white p-12 text-center rounded-3xl border border-gray-100 text-gray-400 font-bold uppercase tracking-wider">
                          Belum ada peserta yang disetujui untuk tingkat {selectedTugasProg}.
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {/* Summary Stats Cards */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs flex flex-col justify-between">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Peserta</span>
                                <span className="p-1.5 bg-gray-50 text-gray-600 rounded-lg"><UserIcon size={14} /></span>
                              </div>
                              <div className="mt-2">
                                <div className="text-xl font-black text-gray-800">{totalEnrolled}</div>
                                <div className="text-[9.5px] text-gray-500 font-semibold">Tingkat {selectedTugasProg}</div>
                              </div>
                            </div>

                            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs flex flex-col justify-between">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Telah Pre-Test</span>
                                <span className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg"><CheckCircle2 size={14} /></span>
                              </div>
                              <div className="mt-2">
                                <div className="text-xl font-black text-emerald-700">{preDoneCount} <span className="text-xs font-normal text-gray-400">/ {totalEnrolled}</span></div>
                                <div className="text-[9.5px] text-emerald-600 font-semibold">Rata-rata: <span className="font-black">{avgPre}</span></div>
                              </div>
                            </div>

                            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs flex flex-col justify-between">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-black text-teal-600 uppercase tracking-widest">Telah Post-Test</span>
                                <span className="p-1.5 bg-teal-50 text-teal-600 rounded-lg"><Award size={14} /></span>
                              </div>
                              <div className="mt-2">
                                <div className="text-xl font-black text-teal-700">{postDoneCount} <span className="text-xs font-normal text-gray-400">/ {totalEnrolled}</span></div>
                                <div className="text-[9.5px] text-teal-600 font-semibold">Rata-rata: <span className="font-black">{avgPost}</span></div>
                              </div>
                            </div>

                            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs flex flex-col justify-between">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Kumpul Berkas</span>
                                <span className="p-1.5 bg-blue-50 text-blue-600 rounded-lg"><FileText size={14} /></span>
                              </div>
                              <div className="mt-2">
                                <div className="text-xl font-black text-blue-700">{tugasDoneCount} <span className="text-xs font-normal text-gray-400">/ {totalEnrolled}</span></div>
                                <div className="text-[9.5px] text-blue-600 font-semibold">Tugas Materi Kurikulum</div>
                              </div>
                            </div>
                          </div>

                          {/* Title & Filter Rekap Tugas */}
                          <div className="flex flex-col gap-3 bg-white p-5 rounded-3xl border border-gray-100 shadow-sm">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-hw-green/10 flex items-center justify-center text-hw-green shrink-0">
                                  <FileText size={20} />
                                </div>
                                <div>
                                  <h3 className="text-base font-black text-gray-800 uppercase tracking-wider">Rekap Tugas & Pengerjaan Ujian</h3>
                                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Sinkronisasi Pre-Test, Post-Test, dan Pengumpulan Tugas Peserta {selectedTugasProg}</p>
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                <div className="relative">
                                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                  <input
                                    type="text"
                                    placeholder="Cari peserta, NBM, qabilah..."
                                    value={tugasSearchQuery}
                                    onChange={(e) => setTugasSearchQuery(e.target.value)}
                                    className="pl-8 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 outline-none focus:border-hw-green focus:bg-white w-48 sm:w-64 transition-all"
                                  />
                                </div>

                                <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-100 shrink-0">
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
                              </div>
                            </div>

                            {/* Quick Filter Status Tabs */}
                            <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-gray-100">
                              <button
                                onClick={() => setTugasFilterType('all')}
                                className={`px-3 py-1 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                                  tugasFilterType === 'all'
                                    ? 'bg-gray-900 text-white shadow-xs'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                              >
                                Semua ({totalEnrolled})
                              </button>
                              <button
                                onClick={() => setTugasFilterType('pre_done')}
                                className={`px-3 py-1 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1 ${
                                  tugasFilterType === 'pre_done'
                                    ? 'bg-emerald-600 text-white shadow-xs'
                                    : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                }`}
                              >
                                <CheckCircle2 size={11} /> Sudah Pre-Test ({preDoneCount})
                              </button>
                              <button
                                onClick={() => setTugasFilterType('post_done')}
                                className={`px-3 py-1 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1 ${
                                  tugasFilterType === 'post_done'
                                    ? 'bg-teal-600 text-white shadow-xs'
                                    : 'bg-teal-50 text-teal-700 hover:bg-teal-100'
                                }`}
                              >
                                <Award size={11} /> Sudah Post-Test ({postDoneCount})
                              </button>
                              <button
                                onClick={() => setTugasFilterType('tugas_done')}
                                className={`px-3 py-1 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1 ${
                                  tugasFilterType === 'tugas_done'
                                    ? 'bg-blue-600 text-white shadow-xs'
                                    : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                                }`}
                              >
                                <FileText size={11} /> Sudah Kumpul Berkas ({tugasDoneCount})
                              </button>
                              <button
                                onClick={() => setTugasFilterType('incomplete')}
                                className={`px-3 py-1 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1 ${
                                  tugasFilterType === 'incomplete'
                                    ? 'bg-amber-600 text-white shadow-xs'
                                    : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                                }`}
                              >
                                Belum Lengkap ({incompleteCount})
                              </button>
                            </div>
                          </div>

                          <div className="overflow-x-auto bg-white rounded-3xl border border-gray-100 shadow-sm">
                            <table className="w-full text-left border-collapse min-w-[960px]">
                              <thead>
                                <tr className="bg-gray-50 border-b border-gray-100 text-[10px] font-black uppercase text-gray-400 tracking-wider">
                                  <th className="p-4 pl-6 w-[220px]">Nama Peserta</th>
                                  <th className="p-4 text-center w-[130px]">Nilai Pre Test</th>
                                  <th className="p-4 text-center w-[130px]">Nilai Post Test</th>
                                  <th className="p-4">Daftar Penugasan Berkas</th>
                                  <th className="p-4 text-center w-[130px]">Status Evaluasi</th>
                                  <th className="p-4 text-right pr-6 w-[170px]">Tindakan</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-50 text-xs font-semibold text-gray-700">
                                {filteredEnrolled.map((app, idx) => {
                                  const preScore = getAppPreTestScore(app);
                                  const postScore = getAppPostTestScore(app);
                                  const tasks = getAppTasksList(app);

                                  const isSpecificMaterial = selectedTugasMateriId !== 'all';
                                  const targetMaterial = categoryMaterials.find(m => String(m.id) === String(selectedTugasMateriId));
                                  const matchingTargetTasks = isSpecificMaterial ? tasks.filter(t => 
                                    String(t.materiId) === String(selectedTugasMateriId) || 
                                    t.title === ("Tugas: " + (targetMaterial ? targetMaterial.judul : "")) ||
                                    (targetMaterial?.judul && t.title && t.title.toLowerCase().includes(targetMaterial.judul.toLowerCase()))
                                  ) : [];
                                  const hasSubmittedTarget = isSpecificMaterial && matchingTargetTasks.length > 0;

                                  const calc = getCalculatedGrading(app);

                                  return (
                                    <tr key={app.id || idx} className="hover:bg-gray-50/50 transition-colors">
                                      {/* 1. Nama Peserta */}
                                      <td className="p-4 pl-6">
                                        <div className="flex items-center gap-3">
                                          <div className="w-9 h-9 rounded-xl bg-gray-50 border border-gray-200 overflow-hidden shrink-0 shadow-xs">
                                            {app.photo ? (
                                              <img src={app.photo} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                              <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-50">
                                                <UserIcon size={16} className="text-gray-400" />
                                              </div>
                                            )}
                                          </div>
                                          <div>
                                            <div className="font-extrabold text-gray-800 leading-snug">
                                              <span className="text-gray-400 font-mono text-xs font-bold mr-1.5">{idx + 1}.</span>
                                              {app.nama || app.namaLengkap}
                                            </div>
                                            <div className="text-[9px] text-gray-400 uppercase tracking-tight">
                                              {app.qabilah ? `${app.qabilah} â€¢ ` : ''}{app.asalDaerah || 'Jawa Tengah'}
                                            </div>
                                            {(app.nbm || app.ktaNumber || app.nomorKTA) && (
                                              <div className="text-[8.5px] text-emerald-700 font-mono font-bold mt-0.5">
                                                NBM: {app.nbm || app.ktaNumber || app.nomorKTA}
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      </td>

                                      {/* 2. Pre Test */}
                                      <td className="p-4 text-center">
                                        {preScore !== null ? (
                                          <div className="inline-flex flex-col items-center gap-1">
                                            <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 rounded-lg text-xs font-black border border-emerald-200/80 shadow-2xs">
                                              {preScore} <span className="text-[9px] font-normal text-emerald-600">/ 100</span>
                                            </span>
                                            <span className="text-[8.5px] font-bold text-emerald-600 uppercase tracking-widest flex items-center gap-0.5">
                                              <Check size={9} /> Selesai
                                            </span>
                                          </div>
                                        ) : (
                                          <span className="px-2 py-0.5 bg-gray-100 text-gray-400 rounded-md text-[9.5px] font-bold uppercase tracking-wider">
                                            Belum Tes
                                          </span>
                                        )}
                                      </td>

                                      {/* 3. Post Test */}
                                      <td className="p-4 text-center">
                                        {postScore !== null ? (
                                          <div className="inline-flex flex-col items-center gap-1">
                                            <span className="px-2.5 py-1 bg-teal-50 text-teal-800 rounded-lg text-xs font-black border border-teal-200/80 shadow-2xs">
                                              {postScore} <span className="text-[9px] font-normal text-teal-600">/ 100</span>
                                            </span>
                                            <span className={`text-[8.5px] font-bold uppercase tracking-wider ${
                                              postScore >= 70 ? 'text-teal-700' : 'text-amber-600'
                                            }`}>
                                              {postScore >= 70 ? 'âœ“ Lulus KKM' : 'Remedial'}
                                            </span>
                                          </div>
                                        ) : (
                                          <span className="px-2 py-0.5 bg-gray-100 text-gray-400 rounded-md text-[9.5px] font-bold uppercase tracking-wider">
                                            Belum Tes
                                          </span>
                                        )}
                                      </td>

                                      {/* 4. Daftar Penugasan Berkas */}
                                      <td className="p-4">
                                        {isSpecificMaterial ? (
                                          hasSubmittedTarget ? (
                                            <div className="space-y-1 max-w-md">
                                              {matchingTargetTasks.map((t, tIdx) => (
                                                <div key={tIdx} className="flex items-center justify-between p-2 rounded-xl bg-emerald-50/70 border border-emerald-100 text-[10px] font-bold">
                                                  <span className="text-emerald-800 font-extrabold truncate mr-2">âœ… {t.title || targetMaterial?.judul}</span>
                                                  {t.link && (
                                                    <a 
                                                      href={t.link} 
                                                      target="_blank" 
                                                      rel="noopener noreferrer" 
                                                      className="text-hw-green hover:underline flex items-center gap-1 shrink-0 font-black bg-white px-2 py-0.5 rounded-md border border-emerald-200"
                                                    >
                                                      Lihat Tugas <ArrowUpRight size={10} />
                                                    </a>
                                                  )}
                                                </div>
                                              ))}
                                            </div>
                                          ) : (
                                            <span className="text-rose-500 font-extrabold text-[10px] uppercase tracking-wider bg-rose-50 px-2.5 py-1 rounded-full inline-block">
                                              âŒ Belum Mengumpulkan {targetMaterial?.judul}
                                            </span>
                                          )
                                        ) : (
                                          tasks.length === 0 ? (
                                            <span className="text-gray-400 italic text-[11px] font-medium">Belum mengumpulkan berkas</span>
                                          ) : (
                                            <div className="space-y-1.5 max-w-md">
                                              {tasks.map((t, tIdx) => (
                                                <div key={tIdx} className="p-2 rounded-xl bg-gray-50 border border-gray-100 text-[10px] space-y-1">
                                                  <div className="flex items-center justify-between font-bold gap-2">
                                                    <div className="flex flex-col truncate">
                                                      <span className="text-gray-800 font-black truncate">{t.title}</span>
                                                      {t.submittedAt && (
                                                        <span className="text-[8px] text-gray-400">Dikirim: {new Date(t.submittedAt).toLocaleDateString('id-ID')}</span>
                                                      )}
                                                    </div>
                                                    {t.link && (
                                                      <a 
                                                        href={t.link} 
                                                        target="_blank" 
                                                        rel="noopener noreferrer" 
                                                        className="text-hw-green hover:underline flex items-center gap-1 shrink-0 font-extrabold bg-white px-2 py-0.5 rounded-md border border-gray-200"
                                                      >
                                                        Lihat Tugas <ArrowUpRight size={10} />
                                                      </a>
                                                    )}
                                                  </div>
                                                  {(t.pesan || t.message) && (
                                                    <div className="bg-white p-1.5 rounded-lg border border-gray-200 text-[9px] text-gray-600 font-medium italic">
                                                      ðŸ’¬ "{t.pesan || t.message}"
                                                    </div>
                                                  )}
                                                </div>
                                              ))}
                                            </div>
                                          )
                                        )}
                                      </td>

                                      {/* 5. Status Evaluasi */}
                                      <td className="p-4 text-center">
                                        {app.nilai ? (
                                          <div className="inline-flex flex-col items-center">
                                            <span className="px-2.5 py-0.5 bg-yellow-50 text-yellow-800 rounded-md text-[10px] font-black border border-yellow-200 uppercase tracking-wider">
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
                                          <div className="inline-flex flex-col items-center">
                                            <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-md text-[9.5px] font-bold">
                                              Capaian: {calc.finalPercentage}%
                                            </span>
                                            <span className="text-[8.5px] text-gray-400 italic mt-0.5">
                                              ({calc.calculatedStatus})
                                            </span>
                                          </div>
                                        )}
                                      </td>

                                      {/* 6. Tindakan */}
                                      <td className="p-4 text-right pr-6">
                                        <div className="flex items-center justify-end gap-1.5">
                                          <button
                                            onClick={() => setViewingTestApp(app)}
                                            className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg border border-emerald-200 font-bold text-[10px] uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer shadow-2xs active:scale-95"
                                            title="Lihat Rincian Jawaban Pre/Post Test & Tugas"
                                          >
                                            <FileText size={12} className="text-emerald-700" />
                                            <span>View Pengerjaan</span>
                                          </button>
                                          <button
                                            onClick={() => handleOpenGradingModal(app)}
                                            className="px-3 py-1.5 bg-hw-green text-white rounded-lg hover:bg-emerald-700 font-black text-[10px] uppercase tracking-wider transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-2xs"
                                          >
                                            Beri Nilai
                                          </button>
                                        </div>
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
                    {/* Penilaian Header Toolbar & Program Filter */}
                    <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-gray-100 shadow-xs">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-black text-gray-500 uppercase tracking-wider">Tingkat / Program:</span>
                        <div className="flex items-center gap-1.5">
                          {['Jati 1', 'Jati 2', 'Jari 1'].map((prog) => (
                            <button
                              key={prog}
                              onClick={() => setSelectedGradeProg(prog as any)}
                              className={`px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all border ${
                                selectedGradeProg === prog 
                                  ? 'bg-hw-green text-white border-hw-green shadow-xs' 
                                  : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
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
                          className="px-3 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                          title="Eksport Excel (CSV)"
                        >
                          <FileSpreadsheet size={14} /> Export Excel
                        </button>
                        <button
                          onClick={exportTrainingGraduationToPDF}
                          className="px-3 py-2 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
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
                      }).sort((a, b) => (a.nama || a.namaLengkap || '').localeCompare(b.nama || b.namaLengkap || '', 'id', { sensitivity: 'base' }));

                      return enrolled.length === 0 ? (
                        <div className="bg-white p-12 text-center rounded-3xl border border-gray-100 text-gray-400 font-bold uppercase tracking-wider">
                          Belum ada peserta yang disetujui untuk tingkat {selectedGradeProg}.
                        </div>
                      ) : (
                        <div className="overflow-x-auto bg-white rounded-3xl border border-gray-100 shadow-sm">
                          <table className="w-full text-left border-collapse min-w-[950px]">
                            <thead>
                              <tr className="bg-gray-50 border-b border-gray-100 text-[10px] font-black uppercase text-gray-400 tracking-wider">
                                <th className="p-4 pl-6">Peserta</th>
                                <th className="p-4">Pre Test</th>
                                <th className="p-4">Post Test</th>
                                <th className="p-4">Nilai Akhir</th>
                                <th className="p-4">Status Kelulusan</th>
                                <th className="p-4">Lembar Pengerjaan & Tugas</th>
                                <th className="p-4">Catatan Pelatih</th>
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

                                    {/* PRE TEST SCORE */}
                                    <td className="p-4">
                                      {(() => {
                                        let pScore = (app.preTestScore !== undefined && app.preTestScore !== null && app.preTestScore !== '') ? Number(app.preTestScore) : null;
                                        if (pScore === null && app.preTestData) {
                                          try {
                                            const pObj = typeof app.preTestData === 'string' ? JSON.parse(app.preTestData) : app.preTestData;
                                            if (pObj && pObj.score !== undefined && pObj.score !== null) pScore = Number(pObj.score);
                                          } catch(e) {}
                                        }
                                        return pScore !== null ? (
                                          <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 rounded-lg text-xs font-black uppercase border border-emerald-200 inline-flex items-center gap-1">
                                            <Sparkles size={11} className="text-emerald-600" />
                                            {pScore} / 100
                                          </span>
                                        ) : (
                                          <span className="text-[10px] text-gray-400 font-semibold italic bg-gray-50 px-2 py-0.5 rounded border border-gray-150">
                                            Belum Tes
                                          </span>
                                        );
                                      })()}
                                    </td>

                                    {/* POST TEST SCORE */}
                                    <td className="p-4">
                                      {(() => {
                                        let pScore = (app.postTestScore !== undefined && app.postTestScore !== null && app.postTestScore !== '') ? Number(app.postTestScore) : null;
                                        if (pScore === null && app.postTestData) {
                                          try {
                                            const pObj = typeof app.postTestData === 'string' ? JSON.parse(app.postTestData) : app.postTestData;
                                            if (pObj && pObj.score !== undefined && pObj.score !== null) pScore = Number(pObj.score);
                                          } catch(e) {}
                                        }
                                        return pScore !== null ? (
                                          <span className="px-2.5 py-1 bg-teal-50 text-teal-800 rounded-lg text-xs font-black uppercase border border-teal-200 inline-flex items-center gap-1">
                                            <CheckCircle2 size={11} className="text-teal-600" />
                                            {pScore} / 100
                                          </span>
                                        ) : (
                                          <span className="text-[10px] text-gray-400 font-semibold italic bg-gray-50 px-2 py-0.5 rounded border border-gray-150">
                                            Belum Tes
                                          </span>
                                        );
                                      })()}
                                    </td>

                                    {/* NILAI AKHIR */}
                                    <td className="p-4">
                                      <div className="space-y-1">
                                        <span className="px-2.5 py-1 bg-yellow-50 text-yellow-800 rounded-lg text-xs font-black uppercase border border-yellow-200 inline-block">
                                          {app.nilai || `${calc.finalPercentage}%`}
                                        </span>
                                        <div className="text-[9px] text-gray-400 font-bold uppercase tracking-tight leading-none pt-0.5">
                                          Presensi: {calc.attendancePercentage}% | Tugas: {calc.assignmentPercentage}%
                                        </div>
                                      </div>
                                    </td>

                                    {/* STATUS KELULUSAN */}
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

                                    {/* VIEW PENGERJAAN TUGAS */}
                                    <td className="p-4">
                                      <button
                                        onClick={() => setViewingTestApp(app)}
                                        className="px-3 py-1.5 bg-gray-100 hover:bg-emerald-50 text-gray-700 hover:text-emerald-800 rounded-xl border border-gray-200 hover:border-emerald-300 font-bold text-[10px] uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                                        title="Lihat Rincian Jawaban Pre Test, Post Test & Tugas Berkas"
                                      >
                                        <FileText size={13} className="text-emerald-700" />
                                        View Pengerjaan Tugas
                                      </button>
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
                                        className="px-3 py-1.5 bg-hw-green text-white rounded-lg hover:bg-emerald-700 font-black text-[10px] uppercase tracking-wider transition-all hover:scale-105 active:scale-95 cursor-pointer"
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
                    {/* Piagam Header Toolbar & Program Filter */}
                    <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-gray-100 shadow-xs">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-black text-gray-500 uppercase tracking-wider">Tingkat / Program:</span>
                        <div className="flex items-center gap-1.5">
                          {['Jati 1', 'Jati 2', 'Jari 1'].map((prog) => (
                            <button
                              key={prog}
                              onClick={() => setSelectedPiagamProg(prog as any)}
                              className={`px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all border ${
                                selectedPiagamProg === prog 
                                  ? 'bg-hw-green text-white border-hw-green shadow-xs' 
                                  : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
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
                          className="px-3 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                          title="Eksport Excel (CSV)"
                        >
                          <FileSpreadsheet size={14} /> Export Excel
                        </button>
                        <button
                          onClick={exportValidatedCertificatesToPDF}
                          className="px-3 py-2 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
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
                      }).sort((a, b) => (a.nama || a.namaLengkap || '').localeCompare(b.nama || b.namaLengkap || '', 'id', { sensitivity: 'base' }));

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
                              proposalUrl: '',
                              gambarUrl: 'https://images.unsplash.com/photo-1510312305653-8ed496efae75?auto=format&fit=crop&q=80&w=800'
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
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <h5 className="text-xs font-black text-gray-800 uppercase tracking-widest flex items-center gap-2">
                            <span>ðŸ—“ï¸</span> Daftar Kegiatan Pelatihan HW Jateng
                          </h5>
                          <p className="text-[10px] text-gray-400 font-medium mt-0.5">
                            Kegiatan ini tampil di halaman depan portal pelatihan dan menentukan opsi waktu & tempat pada formulir pendaftaran.
                          </p>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          {allTrainingActivitiesList.length > 1 && (
                            <button
                              type="button"
                              onClick={async () => {
                                if (confirm('Hapus semua jenis kegiatan pelatihan selain "Pelatihan Jaya Melati 1 Solo"?')) {
                                  const jm1 = allTrainingActivitiesList.find((a: any) => 
                                    (a?.jenisPelatihan && a.jenisPelatihan.toLowerCase().includes('jaya melati 1')) ||
                                    (a?.namaKegiatan && a.namaKegiatan.toLowerCase().includes('jaya melati 1'))
                                  ) || DEFAULT_JM1_SOLO_ACTIVITY;
                                  const updatedSettings = {
                                    ...settings,
                                    trainingActivities: [jm1],
                                    trainingTypes: ['Jaya Melati 1'],
                                    trainingLocations: [jm1.lokasiPelatihan || 'Kwarda HW Solo'],
                                    trainingDates: [jm1.tanggalPelatihan || '22 - 23 Agustus dan 11 - 13 September 2026']
                                  };
                                  setSettings(updatedSettings);
                                  try {
                                    setLoading(true);
                                    await sheetsService.saveSettings(updatedSettings);
                                    showToast('success', 'Berhasil menyisakan hanya kegiatan Jaya Melati 1 Solo');
                                  } catch (e: any) {
                                    showToast('error', e.message);
                                  } finally {
                                    setLoading(false);
                                  }
                                }
                              }}
                              className="text-[10px] bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 px-2.5 py-1 rounded-xl font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1"
                              title="Hapus semua kegiatan lain dan hanya simpan Jaya Melati 1 Solo"
                            >
                              <Trash2 size={12} /> Hapus Kegiatan Lain
                            </button>
                          )}
                          <span className="text-[10px] bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full font-black">
                            {allTrainingActivitiesList.length} Kegiatan
                          </span>
                        </div>
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
                                  proposalUrl: '',
                                  gambarUrl: 'https://images.unsplash.com/photo-1510312305653-8ed496efae75?auto=format&fit=crop&q=80&w=800'
                                });
                                setIsActivityModalOpen(true);
                              }}
                              className="mt-2 text-xs text-hw-green font-black underline hover:text-emerald-700 cursor-pointer"
                            >
                              + Buat Kegiatan Pelatihan Pertama
                            </button>
                          </div>
                        ) : (
                          allTrainingActivitiesList.map((act: any, idx: number) => {
                            const rawImg = act.gambarUrl || act.imageUrl || act.gambar || act.posterUrl || act.coverImage || act.thumbnailUrl;
                            const img = rawImg ? (getDriveDirectLink(rawImg) || rawImg) : '';

                            return (
                            <div key={act.id || idx} className="p-4 bg-gray-50/80 rounded-2xl border border-gray-100 hover:border-emerald-200 transition-all space-y-3 overflow-hidden">
                              {img && (
                                <div className="relative h-36 sm:h-40 bg-gray-100 rounded-xl overflow-hidden -mx-4 -mt-4 mb-3 border-b border-gray-100">
                                  <img 
                                    src={getCorsSafeUrl(img, act.updatedAt || act.id) || img} 
                                    alt={act.namaKegiatan} 
                                    className="w-full h-full object-cover"
                                    referrerPolicy="no-referrer"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1510312305653-8ed496efae75?auto=format&fit=crop&q=80&w=800';
                                    }}
                                  />
                                  <div className="absolute top-2.5 left-2.5 bg-black/60 backdrop-blur-md text-white text-[9px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border border-white/20">
                                    {act.jenisPelatihan || 'Pelatihan'}
                                  </div>
                                  <span className={cn(
                                    "absolute top-2.5 right-2.5 text-[9px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow-xs",
                                    act.status === 'Tutup' ? 'bg-rose-500 text-white' : 'bg-emerald-500 text-white'
                                  )}>
                                    {act.status || 'Buka'}
                                  </span>
                                </div>
                              )}
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  {!img && (
                                    <span className={cn(
                                      "inline-block px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider mb-1",
                                      act.status === 'Buka' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                                    )}>
                                      {act.jenisPelatihan || 'Jaya Melati 1'} â€¢ {act.status === 'Buka' ? 'Pendaftaran Buka' : 'Tutup'}
                                    </span>
                                  )}
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
                                        proposalUrl: act.proposalUrl || act.proposal || act.linkProposal || '',
                                        gambarUrl: act.gambarUrl || act.imageUrl || act.gambar || act.posterUrl || act.coverImage || act.thumbnailUrl || ''
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
                                  <span className="text-gray-400">ðŸ“ Tempat:</span>
                                  <strong className="text-gray-800">{act.lokasiPelatihan || '-'}</strong>
                                </p>
                                <p className="flex items-center gap-1.5 font-semibold">
                                  <span className="text-gray-400">ðŸ“… Tanggal:</span>
                                  <strong className="text-gray-800">{act.tanggalPelatihan || '-'}</strong>
                                </p>
                                <p className="flex items-center gap-1.5 font-semibold">
                                  <span className="text-gray-400">ðŸ‘¨â€ðŸ« Pelatih:</span>
                                  <strong className="text-emerald-800 font-black">
                                    {Array.isArray(act.pelatih) ? (act.pelatih.length > 0 ? act.pelatih.join(', ') : '-') : (act.pelatih || '-')}
                                  </strong>
                                </p>
                                <p className="flex items-center gap-1.5 font-semibold">
                                  <span className="text-gray-400">ðŸ¤ Asisten Pelatih:</span>
                                  <strong className="text-blue-800 font-black">
                                    {Array.isArray(act.asistenPelatih) ? (act.asistenPelatih.length > 0 ? act.asistenPelatih.join(', ') : '-') : (act.asistenPelatih || '-')}
                                  </strong>
                                </p>
                                <p className="flex items-center gap-1.5 font-semibold">
                                  <span className="text-gray-400">ðŸ’° Biaya:</span>
                                  <strong className="text-emerald-700">{act.biayaPelatihan || 'Rp 50.000'}</strong>
                                </p>
                                <p className="flex items-center gap-1.5 font-semibold">
                                  <span className="text-gray-400">ðŸ¦ Rekening:</span>
                                  <strong className="text-gray-800">{act.rekeningPembiayaan || 'Bank BSI 7307427448 a.n. Kwarwil HW Jateng'}</strong>
                                </p>
                                <p className="flex items-center gap-1.5 font-semibold">
                                  <span className="text-gray-400">ðŸ“± WA Panitia:</span>
                                  <strong className="text-gray-800">{act.noWhatsappPanitia || '089688754000'}</strong>
                                </p>
                                {act.deskripsi && (
                                  <p className="text-[10px] text-gray-500 italic pt-1 border-t border-gray-100">
                                    "{act.deskripsi}"
                                  </p>
                                )}

                                <div className="pt-2 border-t border-gray-100/80 flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => handleSetAllToActivity(act)}
                                    className="w-full py-2 px-3 bg-amber-500/10 hover:bg-amber-500 text-amber-900 hover:text-white border border-amber-300/80 hover:border-amber-500 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs group"
                                    title={`Terapkan "${act.namaKegiatan}" ke SEMUA data peserta pelatihan`}
                                  >
                                    <Sparkles size={13} className="text-amber-600 group-hover:text-white transition-colors" />
                                    <span>Set Semua Peserta ke Pelatihan Ini</span>
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                    <div className="grid grid-cols-1 gap-6">
                      {/* JENIS PELATIHAN CARD */}
                      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
                        <div className="flex items-center justify-between">
                          <h5 className="text-xs font-black text-gray-800 uppercase tracking-widest">
                            ðŸ… Jenis Pelatihan
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
                                <div className="break-words leading-snug">ðŸ“… {act.tanggal}</div>
                                <div className="break-words leading-snug">ðŸ“ {act.lokasi}</div>
                                <div className="break-words leading-snug">ðŸ’° {act.biaya || 'Gratis'}</div>
                                <div className="break-words leading-snug">ðŸ‘¥ {act.kuota || 'Terbuka'}</div>
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
                                <span className="text-[10px] font-black text-emerald-700 uppercase tracking-wider block">#{itemIndex + 1} â€¢ {app.namaKegiatan || 'Kegiatan HW'}</span>
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
                                  className="px-2.5 py-1 bg-emerald-50 hoxœì}ÛrÛH²àû~EµvÖ¢zDR¤,Û­–äC[î¶Z’­cÑí™p8¦‹$DÂÄ­q±¬Ñ(bžöÎ¾nÄFÌó~Õ|Á~ÂfV nuEJ²Zˆn‹B!+3+ïùÅð·ã¦a>µFÍÎÆ	¯azâ)œðÝÈ£¦5æ¿}ìlx_?‘3×	›×‘3ËøJÌÐ°ƒæÐpBÃ'cê5;$ô©˜¡é:Í¡k¹~@†‘¸~ÓsM¼lå¿Å±§¼‚W#3$ùwc÷²Ó½"í=‚g”wî´QºŽú;üB¹¸ÎKËNw/kdwL¨3²Œ}Ã2B£7Í/fxqBýÐšuÂõ¼–9Z»ÒyhÑ xCmcwÅûÚì¶¶ˆw †µóÝÀhnm‰û…/&;‘®$ûöäXÆ¾OƒI7¿¯©[ÉöÈü"¿Hy‰â‚µ?]Á*~º™gÑc”àHÏó (‚<hY†3'dww—lGHCøð˜ZQšÏøRÇËÉ>}zÑ|ø0[xvþk°"{ï†Ù„Ž(ñgDÏBê“©16iH–xF2h	ð>¾§ò·Ëö÷¤Û"ûF0]oQý=yIó„ŽHŸ,ƒüjçäû¶à0MÌÑÈpˆ=ÚXîpJŽÎ,÷¼ùµI£Ð‚e'dÏÊŒtÞ<‹,‹ÃÓ2ÎÂ²Ä6æyó#pS 9	œwÂ‰/‘è™­ØÖFfù¶`ù"Ï3ü!Œx!-
SÏ6ípj:ãæ¹9‚Å¸>üi’l àÒUß	}½ fæ0î19ovºY´[Ù{ãî´ÃIÝVöNŒÀðC:ßÍ‡1rÎw÷{'ˆ|Ò&ïÃ(˜wŒ_è ' ˜ù(ÆÏ;Î·E^ŸÀd>ôæ ?¶È>#ÙyîÏ¯eo˜ªQàw	ÚàÝ€ä2"¸£‹ì,€`‡›$þ …»—›sl5hÙÔkàÆ»NLØ¿²}úR
’!pámŒxÙ%šnæcƒ4Ig|O²çNa#æOíüð0ò	SO`‚ìöb÷’‹äÿàƒ_åY"ÄL¢ýl£¼yKa–<lTÄÂf‘n"¥íåc§#gq³ãrÒ?“ŽZÄ‘`MÍÉÿ Àžt’p‡Úô¶á)õnnš“s˜©a8õ¦™°=ÄÕôËë«Kœx²Ë±Û,Àú©&¬qcÞco1ö¯€_h@­Ãsêƒì/Õ\½Òäb°0;bL<îw:0-:9	mº&—§ŠsË¾wn§-jLéJ®Ä¯#š€þ›h(	×^¿ÙŠ=©±bÙÑª(íŽÅÀð9Þk¯"Þ<N>v}3ÙKqé*Ï‚òjßÑ)éÊÀnGöj•@7Ë¾”éX¦c4¹ph‡ÍP¾øòÿ€«ŸQŸ·
Ú3¼:Amu5¼+QÁìG¸Ö§\\(Kd³äþ®æ2¤£Y"âà+ß62ˆØ®ãVòëgµøµûÚK°lÉd“ß	ëì~8Q †ñ˜Z\8#Ï‰jË>¬a£ôãZ+tÜ!µüý4ôA²o¬š£æÁþêÙ¾‰WMDÀyøBÉ´ð9
Bóì"gihmib»¾AJ£Ì[PcÑLTa–9vGÔÂÐ2ÌàQmœ?yÞÊgµÌmÉÆºd?B3´à-˜I’XÓ»_—WåLv›ú&;v¯¶ÙŽ]}}LYˆù–ÌkÄ»ä`F¹ebGÞ¸YÃÈn¯ š"ˆß”+½xmƒx\IÑha&B6SÕDã-ÀµNÍw/Ÿ]ÍaTÔàäó™ã	*WDµxÃ­hÚýÚÌðWý³Êz™¬É0øÌ,°–ä'×E¨êÚ.qsìm¯¹•ÈŽaÞÀ<…±ü©¯fŸ}÷¼zGá9¨ŒwlŒŽÛÂÖŒš›_-±™´J`S8÷©WæW›Õú¤Ìjª_P=Óš‚`¿„¾ëŒKº\"eæ”7-²Û¢{®mê€°¶ºŸÆ\YkFÇ4œ´lÓÉ?®ü¤u¢3÷µÌDFÔ7ÌR*—ž|%Õbe,GÛjvå–í¢–—‘ßó<íÐ>ÈÖ¶ZOÚ	@XÊ™/ÔŠ`_+¡è+¹,ò	È$c¸»ah.		ŒŒ€ËŸÓxÙÃo _øc#l±ù¬I7§Š¡ÅWòWÉ»8Î'°Š%˜Á¿›—yeºS!ýäìMÄB¦µ;®cÈÄÅ&âzŒ+Çkë³×ÙØió³µnín]íu·æºužº5ßSA€ÄkÝØÍWf¹—HK²O—re$«–äá¾<ÊÓÙÙ•—BÏ=ßø‚ç9ã¥_uÂÎ!‹—
myy3‘ötþj˜yð4ÒHÞÆÏ„™tO-+…Â¶ëÑ!¼°°Ù¹XîwÜ¯uÏ‘¶* C€‡kTòx5/÷“Ø¦&åî¯©EíÙf¿—ÃÁž·wº!µ²‹Ì.Ïšo÷vIÅ„…È A”G1ûÏ˜oà=æÆl	¿þ$ø¡òtaJ×äCN˜öñ²ðëAÿ¯ä§·ïŽÉñÛýÞQAÕØé9¦MCH:0œaAË¹4ƒÄ§Ä¬dhE«R8KìÞü
b:€“Íò÷f¢•ÈL‚¨	Äª=‚?OÍž°Sˆˆ83EW^û	|$ù®èùˆ{iÇ…(ŽcÇv»Z0ÛŠ¥0À=jí^^’ã@r_'aáSë‡­j!‡ræîë¤÷uªo2¾šaí'U	Q	‚JVErHWÁ„Ž ,]¸6´æ9JVqèJ
³$(~Ÿ4?ÂD†¸uôeÒÜô{í®Cüã³­/“O-ÓŽa^št%ÎK”Ú1úAMÇ±-üÅ¸“(¯ÁÄ7iSä3Ø‘	2Í -ÇøÙ, §i“³èr"
hlO…¥È¶Éfi}:û+` Š#ÀUgœ:|Ÿ“UfcMN¬¢‹ Oí¤çÈêGè†›lÖdRé®V±ç”9DãŒZ±V0#u7[ÓöÓÄø™Yç—jØ¹tI‡ÏÐp(x11ãË±;g®oÃŸF‰•›‡Oé—Ô8|U‰ÅOŠœˆÀÒøò˜L‡]}×²€zœš"¯¿q-:0¬kcnjË‹žƒfgeÆ›á.ù~§Íž%œ‰éxQH„gxáÅ³[_ä¿G¦oŒ„Ä:Nb2ü	VI¬!ñŒÍ4j#ÆßÃÂpKÒjµŠY'Ù§l“¼6-µæÅ	µ†¿»òVÅl“wÔ£H­þgJ>˜@Ó@§¯?_`qÆ¤»Ñ}"–_Êˆ™ A…N{@ÉäÆ$î¬§‡Q°>GÐ¿3_’•vwC4?!	ŠÕÅâ~0öÍÁpk	€\€¬f_»Üj(µ?JÄó%ÍaìWP‹ŽÙH„ë‰ÃŸáù‰ò	ø,uÏòÉÃj¡ûMàç|²}ÞV²’B~ñG-»I~˜}s
7¯ìñ¿sÀYÁë+{É§99F>ØæÊ^æËCþÔ°i˜äóGÁ=§0•½Ùç9:‚ýÑ¹ +{ñõ*Û–Ü²ukä4„uÈIb8G°/•üaÈH^DSº$ÂŸr?9‚meÿ%¾áàÃÚèÝÂÈ[ÙcHcßñƒÆ@×@ò?ÂnÜçáT™û4 Õ¡&… «)ÊŠ‰.ŽñR‰©×¡¸ø5I®RJíl5;ÏÈÛiè Ôr©ôv©V uÞYNäNi !(.-6e¢#Â"°ñ
5>Î:|v."›÷	ÿLùÀ9£¿“6yaR”ãný8eb?{À"ÿGžnµ6 œmò³ÚÊ½Bý[ÕÚ#wÙxû(9eÓY"J²,%1@L# ô[ÃE®÷&uZpü»Y¤—ºÑF‡OÞ¿;.sâ8élµŽá¯IÔÉh¼G).v ø¸Ðw€(öYöÞ³\:JüB?Þ£=‰á –±É	O83-il!t84¼pwÅ´éØh/¿¸”Ò.¿¼À1T¡d<öŒìÎ8Î?xÞú¸ñI<fž‘ÆÙšò$	¹w‡‘«ø<€¯‘NêÖÙºÆE ‹'E,2‰‘à¼¿­!¼÷AƒŠo¾Z[Óy”áû8µ€#6à‹˜d’C„GŠlz¶ÕMò@<iœž„T. éæ¾ÿhÃL×ky¾ŸJÌëø™„¡l·Û0>1#`ÚŒ¹¡K<ÆbnÓãSÓ›Cˆlj-±CPW|f€ÿbdCŠŠ¡	‚÷äA	›Oòñ!­€EÈ°ie!?Ü½dxéúÁ)=3àåb¸¬]ÉG£p~­Ãb&|×‘J9¼ˆÁÐ%îà³1·r&˜V¶;H÷Aœ*NÁüBå6Tˆ ¨Ë•WW‘#k‡ÓAàZQÂ‘ë!ª™ã	¢æ\\ž$)W˜K5KÐ2xº^LcëÇ›1ødS©Nä®ŒRþK®j’léÔ±˜®Øs_o\ÛõÉ;cj8p9è9€~z™ekˆ~<)œšÔQ×ÙûÊO[Œ-Ï™’§äéæÆÓÇÝ§?#´å´~87­Y0Ä}R-o¡]çÌôm´ùÎPš4>ôÖn¯÷Ã„†õ¼ÊB1—‰Ö¥‡-«7žýðäÙ³§[ {a|ßÞþM"G&0ª6AÍ”œø.HêÔ"ûî¹ƒÒûÙD‚)ÏqÊÄKâ)s‹V‘™¹äæì#9ÐÜ¬™¤åÎÖ[#wÈþùú`.‘0—x©/~Þfò`2¹³&“Ì‚-Ïh’ÃŠëÆË&æ“‘o~1Zc×[FkèÚm$²ö¨dV9Ùÿé7§d×èÑ#"ûC¹ü0ø`†“Æê~Ü^UT:«¿1ç«Ø°JƒÅÊWÙ,[³8cÓ©.{µ™«Nk‡ªmŠeRüûÿ/¾õ$€€çûß’<mž=¸lÉB.Néo“ÎF÷ñÚ9|±¦‘õ}Ó
cVm£¯2Û?Š®–L±³BÙ2}“‡Ü‚¡ªîrûv‹$ec3_Ó	ÓV€ü3É]!ZË
–.ÖL¢Ò+— ‰³A#gxˆ²ŠLVïOàÎ «WŸlÊ'ªÇuß&É³¼2byrzá¢9›`=ñXDWÁGK8ÇCW@Ç#Òi42Ýö÷ë-ÛÛ\oÓ/ðé±F	©šò:5evö”ëÈíxhËîxpù½‡©'¼ã¡%Àã1—"55Õ—âñ¨/Éã¡!Í«„sv…ê¡hðu£ ¥yLÛ@&	Î,’Ú:v­(â:Ô2‰=Ÿ æq„|€Ëê?31žì£LO€5Nµø™Ø^UI&SN5+|zL$3óm&lH’ßð*„ró¯
Å¾ßæ,ÄRàÿ"+³å¶É1õå"œš¦n”dúè‚»!¢aÏºÙ$š/‚™¼6ÿ> ð ­†*öÁ{N%ò²C
Ž)×‰ûÉ¥'XäLñÅDPÁ¡e«ÍÂZèš„¤Ä'Åß¡kƒêî^†~dˆ/ÂÎ.-?ôß¿#¿ì¿zKþúö}ÿý‹WäðÕÏ½~ïM­ê†³â¨¨kåQ–ýÐåæ‡¬þ•*kõŠÊô…®¥QÛ*SÉUUç¯@]ÑÀHDû'*·~õF¯¿#ÚVö~…?.göñ™iê|ã­˜®C-_ b#S—ÔH5©x±7H¦.–w©ª£ŽìL
È}–A;2a[¡>üMC%/)y#i})KòÔuñ-ƒŽp0Øé«!+pyLƒhŠÅ+AJÂ•i³Ü/¹ekØ&7zÁ
ûëdäN™O€æ:—®“ùv³Ö"¿˜S
@™ºÈD`øõxÈÏ§øÀ‘¦•3|“|ª2­;mïVÙœn–jÇž=cqfìóóódîÌŠ}NÃáäù—ÝÔŒ\È.j”žk´«öü„.lÃO¨vûBñþÚðFCQâ’«ê>=ÇåÞ-[Ä‹È Ö--#ä¨0R¸‡BÿBªÚ£öÏgÔ2¡Œ ±úewuMe˜=>¾=ð,3ä÷~ì|zž|_7>©^T`bXÀê+ç“"ÑüÓÊ‘ÝóÌÎ°ÆèSKî_Ì¼Bß´kÙ
ÛÊß•æ=Ï”ùèÒ	»"CäX	öRØ[cäwñƒ×’vSð„Å÷h4¥*
=Úº)Ë¡‡©|ËþÄ¤”ö³à_V™œÍ3ž¯0÷°¸ÜßDÌ–#ÌŸ.c ]ý¦²ÅÁ›‰ÎÅ§dûPY%Ë¼y³h©–„+o¸»‚æTËð]Û 	óG‚u¥°Øð Ó¸Ô5Ï}àø?Ãú^ˆ}gŒ‘I$ãX„¡ëÁož9„¥6š¦ÓŒ?j=þ'˜ðéór¤W+bQçí¤Ù˜ÓŸs…³°U¥o‚ ©ü&À±¨oPIe,÷<Ø½Ü£©H<¥“Yšt”>b~á¨Yf€'JSŠ³èK ÌÄÎÚÂÏmzóë¸=Eg
¤"ZárÖs7×ªÞ§pPÒ˜““äê¸æŠ÷fa]†s¾
l·ä7½Œ˜‘¼€·Å¡)+¸j9`Å`žøE÷ µ,ãÒ€	4‰/ôÓê”…2|å<,Nd°ÆÉ§Lq·¢ó²TŠW§ +¯ð]{ý aÙv¢
„vÎœööoÌºÉ^r3áÍÊd¸Êk3ðLgEåP:6œÓö˜æL~2}ýiÀÅ¤Û£do$ÛRX¬žò‡¥Õ?Å#‰PQN’òÅX$³üËN{Vj·økÅ`¹ií´K5‰3¿²²Æ‡ïß~ïEÁ°Èëi}:`‚û*FNE#Àª¶Ù¼.®="¶ 	te?ÈÑaçVUm¸„‚@Xü'CÞ˜©–O|N°îc×7ìOj2‹gŒ³x\¹ìœNLÃJâ6«s†Du¨+
ÓŸÉV£-õ£žõï;4ÐzˆÙƒ•¨®;[a<Ëu¦Ìw.0³ Œ£Æ~¦NhÆ;R&="cH}J†?¥­°TUï×ÕÕ_ß{#DÌøWUCO4P!¹¶Úë¦-ŸæÁ$Ž…OJfÍê K¤R™ÅŽo€	€;i%×XVM†˜eçé%Òj©%
1'…±—˜6X8¹N2O(
«"Yµ®lÙ)Ê–¸™ƒTjöØBûÚãÊ‚«°s¢ô¿ÿù¯ÊÿªváLà.`o6s)^Å;‡ÃC>Ç%ãqá)¸,ÃåÒùtÕŽ  =³…ï ò0ÿò7ôP–îº†ƒxãþSµñ°4?@W.ÏÑp'W±Ú;[; fÚƒ˜…‹•~–“ãHß*¹ðê·«j™¯PU¨%àkFÊ¤Œ|Å(*Õj¦T%ó:+We\÷.¸o¹¢»@Î“ÌU¡Ù§øzÔ‰Š¬ðžëf¬o`Ak£û‰7f3âs?l›šÌ«5U­QˆÇ†¨7€ÞæÁp!VrÛWi U"~Uë‘ÙoeÑ_,Ò£8ÿ®?‹ûÈ‘G¤çy¾¬Œ0“DFÆ÷*¹4ƒì Â^%ª>%;‘Û+IÚ™Î"Eä®l+RY¬ì"R¾¬Ü7¤|M•™§<SOUñ„F3j?.ö`	ì<Þ¶¯£lC”ugºº`›5_a÷UÜ&o¿"|ZÖ’x-bÃ5È¯×ëL‘km1U.Ó‡¥à3ÉÃ­HH#¯:ªìZÖfŸ$Ûø ·ŸKM6™4X^XM£]Õœ[/ô¥ÚŒYžèfæq†,j‹ñÂ s…¶+
„-Ä‰ÎyuWSÍåí^8…±rª3&i¶R5²QêF©£übö´bø:yï±Jê:9ì÷`*™âö•Au:Pi#)É/}·¢ýWÎÜVêa]SÉ AeSìÇS-Šv»*±)°¼PƒþIT`§ÔP×‹3{°5NÊbsŽã6y‡ØË«(Qh©.¯[—^bk¬z3lY­T²ol–¶MØÛÇxvßÅ,f$uÒ~³ýâæŠJ™ÙÉ½!—–³o)0zr9š3ÄÇ¤Ã˜Sƒ„Ç4—ÿÃ=Ö[¢Ñ@ÔÊ“n&1(ñ†$p-qo_ÔL÷_&xŒžm?×§XñZ
ÑÍ®Ã367r-ês¾¾âÏpÁsÔ:[}¡«z’"Ç®(¯]Å–ëëÐHÄ™è=¦äïmÄ{^qØá0;:¾êñ{Ûæ]%å„ï,ÑLCz	ßî^È…’]ä0¤ ½ÞUâ¨œä%/íÐuÉböŽ÷‚8RuIB"}ŸšXïîÓIÅLï,±„Ñ˜÷˜PøûÝ"éã«T·ß‡Æ¨OƒéÉƒ¢H´HúMt‰Ô!6-¼pGš¦½¸óÖö`ö™­xïK•Ž,ˆ·ªÖ-ñîa„–,X†7ó®Ÿ±wÞì<!ü'ã¶Ìºn´efTÐ•æåí¼àåa3ñ•5ÓÃæ‰pYÙëó4­%™e#Ì!H¿NLQVXo›z†ÍX¶(m§Â ?;¦ÆúMù¨Í?]Ú-Sr_HÕhož±©mnú’ö6ûì»çøYjûF–þ¸~¼âulâ¢1Î‘F&øO¶xV&(4Ã•x_4\ö)Ú¥',¶=>20.Û{ÞN¨ßk,²á½4Y]0Cñ{%å¤MÑÓèƒ™>?Û+IN¢px±S)"[Y£æ`ØÔ´®È¿ÿù/üFjaMã¯fl*J¨ç^Ü11þ˜‹ÂàùÙÚêèì­™Ñ=»—jå+àð³k¹ÎkEÆñŽ5vd+ß^YM‘¬®³¡“ÀÖYrö™o²:´#	t˜‘XUBHécQÓá!Œx»ØºüEY‚C'W'-_iäI>ã´ÑÎÐ²¦ .®¹&tœËÕ7Ï4"PEzÎxìÊ{X)ˆñÕEšº¿uíŠüu‘‡Îè¡=§fã?ûÕð¨Ü•‡_1Rì‚‰ð‚M+«yÕ¡ªÌ‡Èât6¶TQ8©R5ÿ¢Ÿaô92¿‰¥~g`O.Ò-’êóë›02eî+²A;yv07¤ƒÝüê÷]‹N¯µö:Unª~Z«ª¬V>‡¾Ìë#ÐÝÔÎ’?„æ—	/¹SŠý¯áÂU?Éâ/Hôßo\äÚ×Ôº*ý±žš7ªXKY,FV-QW¼ž¶¨¡/êhŒK×çÔSµP­Ø)ÕfåªÇõT¡f1#…º*FŒ_wEÅÑ'üt‰‡f†$M¶È†¥â²Ñóáº–°¿ qDù=f„ŠÒIØ«>~ZãÛïZÆÁh›!º@¤{Qæ5ØÆÃo½ªÇÏS¯$.ø­õþlB~ŽnÙ	XK‚.Uk¿¦åVêÝÛ£W;ê½xutú‘CŽ•Ò‰¨zG¥ñ&]åNŠ…Æ|uÊñó£ÀõâjÌ,T×ˆ%ž†½¿¨¢X'?
k™´<Ph½Ö¸æª	Š Ì¡ÖðCT—:jn|åõŠk±‹^§¹´Ök,`:ÖrWO¥ òCwít„3Õ%²–·¤cD—ÜíY†úC(¿/}ZÃ—ÔW”ˆ/¿S–äùL–œÉÔó®­ô–5öêã=ø?ÕcˆTÚÊ0%*µÕ‘’é¬oÞÅ‰øƒ
+ÊcÉçX¹`ZvŸ:%0]½%(Î
žû•	÷ƒþ'˜ló_çßØ|oÁšàIþíiiËççËröÂ<¤}Vì,d.R„J˜|OàBìügÃ1àIìô¾96Cj­^ÉÛk<8P+À5ó”Ç3î®²\0ÓÞ÷Ì¬X\]çÖŸ,dÔÙ¦ž©äþû\©FÈYïŠ5ä¦¼p±¢	oÞàbÀBq\¥é>8\¹Ôz‹<3nruù+\­´^cúîb´Ö{êJ%>ÈuÈªl?„"ù³OGs¼ñôê’Ù8Út5—¥WæÐ`aÊeˆ£>¨—‹Q/³²ÓÍ(˜'Gý»«`®žá‡wD•ÌÄÏ®Æáµl²î‡Tf>ÖÛÒ+E‚xY·ÌŠàKÒ.Ó,¶X»L¹[oJ}ÓœF!/
þ½ äôÎ	õMÒyˆÌeG}ÅòÕÈóLžWLà“+=%‡Hî¯¥iÞcaÂ]è)FÿAÕÆ3tÇÊã¾èŽ7´Ì
dþŠ¥+U2¾0Yö¡bì>Ö^½3ŠáÃŠìD1G¶YØƒsá…©–—?§Š8oƒÁtð¾€ìúnì»Ô¨­lô$W9S¥TCç¼Ñˆ^9·XFTï¢âzï®þÏ§ªÙ«ƒDôbxoLk<êÚš+zÚ«D/Õê›¿FÈò¢wt£·jŠ?-fC¤¦ÙÓ†F®ðŽÖý‰Øu’‰ÈöõîÇ–{¢Å|žéÈÖ´«n˜ÎêÔ°@$„çrâ»ãÙêYezêMŽéÿ×œC{r×„ƒÞ£”WÌdp´X'Ú·–wX!€ßvZä|1†*~òÂ€e~cZ+Ýr¯®‚¹hèVŠtqP:+Îº9ÕK¯°ôUGvju«ðy/@åÁKyò2:dheMl×¸L»¤ ÍÚö5Mr°Íe"f¸M¨s±NÌÑ×mâD(Mh„ÓgêáÎ\4}íXù
‘®“Åy¸ïötWŒšÌSk„
”K.a‹Yº®ôÂæù7¥ºCOØ»Bkb³s¾f²ÞLð ô5}ÓÞ&—ŽqŽ¶:£‘›ßZ+t\´íào§,y£±jŽšûÕÅ¾*'^<Zƒj	«x °-‘õ¡¼#éä™?&¾q¶¥{oõ²»ò7`KÎTÒ3=ø†µ»â¸.lr@Ž6|ßðµ¨ÈZé¨Ü²pùYóG¼ÆG¿J…
Ãù‚^ÞUrè¢îHCaÌƒwz¾ïž¿÷Þ™ãIb‘èˆ
Ë—6Õ¹P35ñòhÌ3-¶lÞ¢eMK«”žZ[y6ð$§†³båY5´‚­ÃUžh±Û†Vòÿïÿü×ÿ%+—Uot¥³äZzžö—¥0\Ïõ%4+ã<+Œ¥ÊqUÏ*^SÕ8b¶Ü:	²–Gqÿ®rÙI¡°vRHãýmd-V„bÒ¬ZÂ{-P­$‘FSB§°Ý«A!jNY¸4…ª¼{/«A^¾{¿_¯cÍ5ºÔlhu©Á^]^¹!áïUsÍþ4¼6æ“‡î4¥î4°/¾;ME;Õ¹:Ç¯‚®ª¤²'iW¿)i%£½4¸ÿ>&æçd•yžãÒP¬VŸÚ:IOUwB«îö"kš¢h”²YâÉ)Î*Y¥n*¢Æ9QwÍÖö¨è"ÅüqR¬ôIe±R¬ñJÒ'¼ÑzÕ„ÇþäÂ'¾{fZäÔ²Faåz©U“É«™RvwˆËôgû)F4˜ O.ô•½0§”8Çð H´ûûç;fKöiYàü3­Š¶GE‚Î Ò¦D×»<K[z\ YCîÓ“Àînº"Ôm%³€+Ýù&ü;@8¬ÔTLåÄ¢¹@í¥9ÓZ„‚¹¼W6«éz0ôádðX&ã‹›ekµ‰ç‰Ø7àÕwNhØ¼ôqÖFð¶Nø¼5Ä+ñSkO|¬JkdÒì}ƒ#j“3™älÁ™Ÿ.vŽOÚ¦ŸÑ‘Ñ4%Ðˆ~Þ#Íb‹àYþ*ETÅçØ¥ó5=W!€Îò/pñóAŠ›©ÜÛ™ùZV¨k]­ˆ¼>˜ßg¶Jf¡]tVÆ< Õð-Ø‰i™=+&]OIOàdÑ ãÑ’1kMÅB‰ÖeÖâ—;Žg·òD7ÒáÐð€iåŒö÷¢ùdÖ½JNKöËÌÞy9ƒ·V?¦Ó &d‘ÎÆñÒ8¤h_!€K„x~Ml¢Ûöëu–&Ëê-ù²IISi=ÂG­jqçèt,æï
¾Uý¢s}¢Ïf}Îgcêö†^nwh†Ð¹ÒèÉš<jàÖØ7GÿAI0@ÙÓÞž}íÆù	z\Š§8ÜßDÔovÅáVËÀ[u;OYøUÉE!ªÀ“™ÓÓldy˜u©ŠDg³Ü¢1Á ”çÈ×v}iÊ½ÊpÙ@G×ó†IZf™‰hé‹EJ½ƒ_ƒŸLÃe.ÖÉìËZÆ/žamM*‹xjÖ"Î '}:£Îsó¦ôY‘šŒ;Óee@u·RM`K¨òžN£·èžð^šäABXNó69ø»é®,WXßê¬ž\rA7­d^à;)TSv•Í×@T#vS#ˆ¨ÉbÓH¡N§õõ+ü÷õ«,9_	¡Î!Û—T;“ÖÞ„½u¬‹ÝËï–MIbM¦¸ENCú†¹¨åd­-2Sƒ$Ä¦gL Á÷&8ÍÊ¡šSâ$l‘4^Š»“mÒÁVó­îÓµ š•}sÑ€`	º–	"™eLÈ(ÆÌ¥ñrèÈH/‘	xœë¸¥=¶ù˜Œª¥‚ìþ^PVÖ%O^6œ¥4kPP R^¸™ë¤ðã?ÕRNrlèínrYa´-V\R+8g›Í)ajíg…ý¹¨áÅê–ã†k÷Ü‰Ç"¿H‡vØ¾]©ìfå°•½¾a{@Gtbú7Á§‹,2dÏg_ “ÌŒ:/›\9tCJÚä"K¤¢âñ( õéà.á(¬úÔ÷Å!)l0bHU )ŸÀÂ±43l4½—ø&æ»—Y@6Ï)ñß1$_§7]¿R¹^ÁœŸÑ-¢;@ìGŒrÏÄwò­ŸÅŽ­¢»|ŽY}ÝóI<¯Ÿªã2â<X¶Á¡X;,²L
^6!¦/™æÍ©sºð1“-]Æ‘6•$D¾íN\Ô®¸ì*(ylï´'[²iHp,…[®]]2ÈòªÏÆï,PU'@uŸú[¼ÆÍ?áPWð#V›»tº-‰€bðìæä8eP’fº»NÕNï<cjy\Vâ“õ–¸Î²ÃUêÚ_ƒÊœ§Y,ZÙc×ØÔw[$œtrxã£v.;r[•Þ-„ä¶4Ý›P±ÙF&DhÀºuo,0ÀmÎÈÎL@Ùðñ]}òp\8-WÒC]â€_¦ï[•3!Ê˜°¸Läiê²Jnç}u3:(0%×„Ñ§:«Ü¡õ¸órbÀD³¡¦¤wròîí¯¯4°X»æöu^,tÕA ™–9rQ/‚p›i_<k”]ZÀÚ•zyî}ûaÃƒ¶ÂÉ°c-¦«»ª:\S}4šuî”x,–Òt;¸ZC'öÝu¾ÂòA×öÿ±"DÚÀYÉ¢E¸þØhúZPNUG·á°ZCWh„úÔ¦kú	‹|I¦Ú®<¹ë¦ì´íãft°¯ˆflº‹.a‡|6§øÖÀ™Ñ€NÖXx£ ýnÖî%o°(‚Hœ&Jp\ù÷?ÿUù3ÃÓ š"ˆÓ× çÔ‚ùMð5¨)F¤vg!ô”õºÝoÚxöá&‡†EmÓQÏ–­¬oã¾ùØñcËŽ{W,c9|Ì@´€±F Ër®­ìÑ©Ù´àŸ6ÿMûæfÞ0l/¢ŽêfPfÙšJ­qsÝÐGõÖŒù°’b.­j}‹9¤zä“!.´âÏù_Ò¹	<h²ëâKdS5MÀ‚	ô¦ªšÐÕIäŠÒ7;ÄvCK#tã€ª†»nÚ²VWÄå°Å× C0ƒ iàŠ¬)8c:›ªìCiÅ•øyJê“¬¦ðj†B©CÜ6œ`„>p{Áÿ6^é ó€9ÊgåI\£¥z‰kwrþð]ŽRåÁElLe­‚”ÙòAqgÚó¢*Æ¸:¿ZƒÇá$
¢ „9{ìï‰ÁJg)á¨6ª"ƒj‚&µ#òº…pÒºZU“"À²Žkd¡*´n^@ÛÔ2­ò–oOúoßœr»ý%â×	g<WZÔv›œNMÌ¸9'ciÍÙy±è<¾¼‡<zD¾Ën9kÉ¾ÀmŠaù–åÀD-P¼F/y„~²ÏÎ|el»Æ+i^ÉlbéIµ¡Cã¢á¯­%†³.ÜF¥)5Ý9ã²8ðèê9ÍvH Û©SÌ^“•³PÖ’Ký¶q“h˜Y²æŸ.á„¼°\rèeÜÌŽ‘ÐeŒvó,XçQsy!sOJOËlN,ÐX»5é€*rNŠnžmqBoZ$
ãÏ>f´‰Ù/Ÿb·¨ökÏðT¯´TrŸ ¥SwkG82ž˜Vb"œâ¢N™õ‰F%ÙN×’Kô<ì wpo»_`Æã1.·N¨¸À˜3ßµg	´ÇÏ±½ÏpsäóâÒç¾'oíá[gLHÖ¬ñÑû´ž–£[«ñ²iõ±ÜŒºQ÷Ú3ò	#0ò	#0:77!K{:5ªÄñ#æ©HhÇ D‘	ýb¤ðCO‘ÔtŸ®u]Í9f2Øjf´ŽŒE“½3¶Ò‹¸x9¤–;øhBx.ë=2c5˜x]“¯Trý5a[_Jä0(Ëc
¸åEÁ¤NÁ?~\IÐ²&ß•N^«jã„š¿¼%÷¥“×-')ŸüÒ–Ü—.¹¿¼%_>ÔÏ_
ÐØ ˜9þ¦=o=ö¬'¨r•
;40u
?0FÜsFé,)ï^ÏO_sÊ9K½nÏ<A~¬%°·ILÇ5îMoõ|Ó¦þÅ;&žjî.ÛYõyA~˜="=¥·œZ°Ö
3ÒN~™Â~4ùª—³ØÀØÊÚ)¡ò9óì"Ë8“2…8½°®¼)Ô–•¤PÃÓ­ª$½QgK¨¹ü<e&kU+ÛÍ
V¸LF©æC290©KªÉ êQ”¡*£‡²Åq4ž£µ4G9Q}T;obQ˜44X»ÑNZ+±î–®¸n™ ;æì.æ%±²z°Õ,tš™`tEÈÜBK}–LÈ 6 ôÜYUÈoÐiýúÁÊÞ%3lj—mÕíRõ{Y@BáïXhé%êÈ™¨µM~v-×S'qŽÞÄ2É	uF³Éz‡‘G¤+¨Ê? `}Ì8ðóÿ ÒkºÊk.èßìxJS˜½ºjì¬,ùoU”Þ¬ïEd™çæú‰R§^V¬º£ðTÕòòý u
‹	¨[`¨âØS¿–F »9ìUõS×ðkÖó«<ÖY¿ü¸Ú'gÔZ]ÇÎÎØpfŸ'ðZñg,€é¬~â¾—±kiÚ¦+\	)Šcè%ÀCl‡s92H®I~TKgÚnƒ:ŽƒÄuÀ¼<M˜G3–+›º„oz>„ú^yÄt^v/@sOÌÎ²¯
ö>;æ'@¢Àü¬)!õQ5ŸàQ³Ó_R/d.ñuQ36gÝpr¬0mâ3¬­líÝlëì±]ÎO™®¨L¿ µ·4«Wk¡ÀÄ§®®øã 	i	ZºY	ê¾
0¨½Üò$e6qíâ€váÃ«~QmßD8d²¯.:2ÝMx§x³[H0äŒÑÞ‡@H
ú‘C2“jH	ðyß8§å…±*µ2	d›ìø*Y·ñÕü¯Ž¼'šhVVþtWH+–›#sºxbðÒ‘9œ÷Ú§Ç‡íãÞbb6üý 	¤‰Ó}ÄíÓã“öq?àS !ÒwÚûÝöþ&û¥Ãþí²7cBðj‚—‚„àÝ!,0«eaQ©K#´B€¦’ÞîR<àÛ$ É#TC MVAìØ#-³.É˜ã‚ãkg ¿`ñ²¦ÇÊ°f¢kQÊeœjB±‹fQê,ÖöŒpÖ
E£„o"¦Ô«ClÅ-Vç	\ÄÖ`â7»<yuÔë¼î½É/"â+4è8Òž;íp=õ¢ªÊg%u&fÊ©èUŽ¶ÌLÖá¶xl’p\E\+w˜÷‹¨hc”S°ÚG»ä¦%—®¯¢ÏÃö
qqì¬fL\ýh¸bÐMf‘“›†—¼éš<ø&Å	ÍŽ–ìz|½CŒÕq³¨½sêå‚ôÒqÊYå¹™iù•×¨®ÐŽò)®"K%ijD÷Ì¿
ßÍÀ—Z»s#Õ^î¢¿È+~_®ç¾^1zÎúy=åjƒZ P•W!2@k´Â`,y:£,q®FvdsOJzÑÇOL‡‰ªŠ/PÚƒŽ19šÔ2˜®”¼ùeeÇÄpZáÍO:n/ÉdšYåê)òBo|ÆFª~Ìr]òRk "5åšFP.Úpo¯ÔÞ¨²}
1X¤oß„Ö·]Mð¢½€Z„÷@'mòŸt`ZtBNúÇÕ¿å¥¸¾,xRÑ–‚}Øãg½W¿ÇS¨Wm@¥ÀÃa#ÊÛTTâý2¸ëðCïÝ~ïoÿÙ{qpÔ{ý·_zýWo~æ<–'&`Ç îx†q%L¥ 6¨|§µwd¼-0Î>>pB~oX')÷ÅG%#ìí’Í'*áBâ%›-Ô6¾à:‰—ˆ}SìZ2šþ³UOþ¦1¥@@4#áÞxSÆ¼kµ|)¤í¯ì5›q1;!Í¦2¥~æí·“Ù]iÂ¸œúHã°÷âý	’–®}Ûï­Á€M‰uç²šlP`ÆÆ:ÙÜZ+Ø´Œl÷AêJìrEUæÖÉÜ%ÝÄ®cÁL Zä1Èø²5Þ¿9øõÕ»Óƒ~ï@Ú?8|…NÞô_¾98¼ÖJ<,ƒÜÐ|çåŠ„ÆÛ$­¸Í•¤Æ[/`Akò¯W4Ÿ !vÊ¤¼~®
^I{€L½‰MGdŸN,*g¹1‡Î7P«K{µût:FáÈ 	›Â—DU>ö¢0Š§P¾{ì^v¿…6QÄ7P“ø[ºê	Îxã¶Èë“ö‡Þmt"pÜ×ŠFfõZ™Áps÷Øx†Íxn§ãÀ}ï&pê¶1ºØ“ˆc|À¹±ì?°&Jt÷ÑôYdu ÷fºž¼dömìPÌC5ä³!ÚïîWáËš£Ý3øÕðÍ3SÜì†ƒõ?RÄšÝ³€mw6X±âgj6aÜ"“æV¶5¶u2=óô·¼”LBÛ‚ç ¤[åýÉ¬™P¢È‹Ÿ=¥IzÓÈI£êšùªÛˆ0í·Á3¤¬n&/sqkõk¯¼³@"ÍN¾½x'1¼U ÷ŠÞZy{yw£Øx·
ªWçà§U	k±[H¼Ëí)ýwºÕƒÌÇî§6€Ú¼6û¬¾».±‹~Œ?ÅC`–!‡Y0¤–û]kD‡Øw=>÷ÃÖÜ@<5m¥•øX@·²’‚ž•X]qr§m»8µVá—Â¥)î´{<íçc,o—’fvóÐ›—ïÞï†Ã™T­ÒÉà—fÀoLÑ¾˜çTÚÌ¯°='­ÇÿŽ’ÆÆ'µ',iZý¤@¥;3ÑÏt`å¨µ{y™t*ß&ekgœ•»¬S¾Ìøj†ª¡*ùA<® Õžý	|†¿#ßõ°@¯_ÊNh_6 ë âÃ§ÖëÎtuÁ•ÞÙa÷UÜVŸÖÓ2pñ™û‹AbÉ¦_›ç¸ï¥I	/øØmmù†ý)¡yäHëg2€ŠVØ%b+à¬×|V±9Ô‰$ö r j²YÚfSŽ62(/ª…ñgÂ*ŒiqjNØÏÉ*ëÂÊ¿²’Þ/°)düóêG•òòN{²)ãù5p>ÒÍ¬ ˜×.²L½ì	H0I7…î† ›‚’ã*W8Q§3ä›4?>Ùø2ù4Ã­‹&°€îçÁÐw-k@}.zWNènX«~‰F‘ãÁ˜Gy”g"·>³ç×6hçFaòu~àuÂF~èq~ëvë2vUØ%O€¨Æi<ò,|hÁ(”<àn`‘:BÓMŠ ZÙ{ÿê8B7þÍÃi~;Ï–®9È”9e/Øßš7ÑØ2WöNñOÍ[Yq2`x¬èÕ÷vã{»µïõùs}ås¿iÿÛ(ô‡p³!OvÒõyi¼”‚]×²õ-l$K÷‚Ü®½wD~¦6Xä%
`·!¹ñÁ6KÁÊÙðs:|'aèÛí6¶˜¹íÝê>É3÷\wldßG•´±ïž;–KG7_P@ÃÎá½¿:üš(È†iÐ°Ø7Š“‚Ó·djÖ2-•`úG483HÝƒ3ÏoÁÚüv¿wDß¾Á ÊÆÏðö ?"û.]Óµ;¿d2[(4<k˜ž»z¦ç
¤Ä´ªmxÖ6=ëŸ«yDJB&¡°@'h¬´AWðÏkÃ.k*ÞÚŠç¶M«¬Ó²G*Ô˜~munu\\£„®wË@ÇÁY®4£¶XWÛµjÙ&ÒþSUvïkš½ñHLß1ò§¶ïxfùî£â0aßÅ–o6Aõ›ýV‘FÏËŠ<z&„HäJ–…š¼åË™Bq¾»$Hž˜}-FÁœŒ*ç¤Yh<™Ù”VûåÃP[ùæÎìŒŽ¬!±„)
Ù£¶v² wàugªÅ‹u
_ÐÌÄêLz¾{fZ«²:“Â	Jh©~H»kéJÿkƒŽZ<E”ÕKz]¬9øSì;1vT1gxT)a/ó£1-¬ð„uÂQ'
ºÖ ~ÜXÞOÆ|Õ­´eu7¤©¥’ŸªZ·w	«¹É”œ0ÖÁh•ý”ÜHùLŽ!2Œî.£»u1z™¸9i>~VAõ	Íã±›3k%Î‹Þ’×ý¤;‹9+spºßûKß˜ä…á¦hÓð:èŸZ,E>žŸ"ïâ³\ŠÜì.“"O)Qå°t•mÂƒXþ¡»î¸×õîàõ‡ÖË·ÇdjêY<põ´×O^ <ƒpØîèeM#V¡ëZ€n®: ÛSL´ë¿›“àõÕ[VÐŠß†èøâ«rŒ™dÂ2‚à£¥ÐÀ4:8M±<×Ôé+4Ø$—™›dp¥]po”‰ñ0þ…³¯Ë’·¿ä™¬ p8AHa‰lrd:Óöû8'`5&:¸‚œÈ (œNÓp"ð*¹’Õÿ˜=³oNCw*`w‘ü+Pj40øö‹ÏÚ,=ù”lü`¿þÃð!äg?òÈ‡	ƒžçŸ÷¸ô¼DÂ­s¼z^âX•¤ìª“ŒXÄËsœkÚ¨S7ÿÄ“{ÙÔ®~»ª¿ç-m×Ë–0Ñ+e¯¡Ré+Ué–×(ìHI§Ù3À}ÒÙ ¯±fUw#Ìï-¨™3ÊBUßŠÖ¥Ú§•µ%©é‹åø(jÓémq|²`˜‚’Ëc Ô¹i|À‘|ãÚ®/deÖþ¤û¬ÎðŒA H¬fãÃÂ˜(_Æ&úÀD˜hrÜ3×ìýÖúy ü¯pÊ]¼=Y~á·f~ËiÏ¸=Ø”ïN£§„­‰µ²»„ÙwÑŒUé*9??o]pø15ñœ†ÃÉó/»è¾è}]ýXõþÛÝiž*©rî¶w;ÇQ`“¢¤›å¦wiÎ¿ªçgÙ½hdº¤MŽè8‚?ÇÔÈ÷RiäîðŽ;¿+&U¶T_› À?Ðp"®±Åº,£»D–Ÿ.VŽÏ&áL…(Œë±™ûMÀ§õ§X\[LÃi›:%3ÓÂ‰áM/ÄÒ–ØÄiŒ…¾Þ\>	o.†„£	µY¼¿›S¶ª69l½n‘SÓ§£ÏŠÊyüx jÁï÷ªÑq (¡êàžQ3ÆO¦eÄ»s#—`Ò&û¦Ù±(×ÃŽ}²¹öÍìØßŒ´_ÊQ9ƒåhÐ®ÉýSé…®MM‡]bÕ²½Í.P}ä½Ö¬c–¼á{73¤–9\ÙûþsJ±R3—rµN<„¬§”…”32iùäÑï‘þxjR’€~¦¼#`ZæÔŒ/¥èÓ¶ËœÐß ã¦¾ß¬9Ož$ae†møÔiõÖ>2}sÊõ‹‹5ˆOð gY7íEGÛ<?ÚfkùŒkëZŒ«ÊÌ8¨²‹ÙâzH`©O‰Å!O<ä4Ô7˜Ò£ÿÞÙø‘ý<ìsNeáô‚i 4èŒ^ð’cÃùác‚aöc“Ð1Ê¤Eí…ÛFJÌ0aƒqoº¤(]`o/—'ò‡ºŽÐ¤#S>0§è¹eB…OóúVö8…aLOÚxodÀð@pE™äÔ¢Ãˆ±–4`«HmÏÈÒ%p3ðà˜“²AùGŒò;l%v˜ÓÖ÷è¦4Ì’þb*Ñ ‡,,ñˆ‰»°šúÙü™ôÀL‹œr~`U2`åI•âÁ­ž}š«ñz·^’DLj¿`é…Ì¿»Måìšb½»L’ Þª°2ËBë´(5±âòÌLÄ	Š<EññîÃ~>Ú˜ºoRËgòeŠ,G‘qÅÎÖuªã}C‰ŠPÍ›§¨Y)¯‚/"-±³uãi‰Õœ+-qsÆ¨*2aß}Ù)Å×ªóåvzq‚`Uzà e_QN H<öYMþ€±(ÇµXÐ+¶8»¯"ØökP¥®€\d2•¥ åíS“?>Ld7@öÏŸìÖ ¤¡n¢h0#wÙ»dL?Gl‡-{ì†>ãVœ_å/Ÿ]6Žšj8|é„ "K|ãÈ‰DçP¿V]á–]u­\@enŸQü;ƒ®´ªO•„ý.so#/A6›JßO *L=jQ2|„[®î‡æÃ]p	äë6‰û:¼‹l€)ÿ5–«"/WA6•…¹¢¹ÙÚRIÃ™rÙ,U¶Z¸õÝ€ÙPÒÈUmN¶N‘ ¶~±ï´«rW”Ì7}•7ÇÖPë¬ÒE®Ød©¤d©—£ Äu!õtèZ®Ô¬DÕ.äÒ6Ô¸ôËNFÝFožä²pñÌÓ¤>H~Ç¨†W^<wØpâOÉ#Úå­D»CPFlòˆôË;I˜â·+[ö¯`fÕüf2Âƒ ©-h
@ö pVBõAà\˜À	ŸFôDö9nÖ|×EP/3é´Ãt•è~HÙmFH'‘é\Ð[–/Ã¡Ï'gö+Æ¸†¼ù"š†&ß Ï›ö€^0Øri4G hû³9®m:Ôz-—([ÖÝJàýcË˜	øî¹ ™°ÀoPÔüÙç†\X´XÌJý=”bf<HN¾L¢9èyÞƒØÉ£¹ä¬¦Ä˜Çüˆ¿ž–Ùp€mÃ¯raëA$]¬Hú±«(Ì¶ ©´Ú3R)03þ0yÿyÏE¾~4¦A-9ô:eÎ60á„‹‹Û³˜ðâcÿcz%+~AfwKåú6Fz :]f@^R”cv™{1…VQ®s\’]òÞKø"£˜”³4`÷0òíÈvÀËÄÑ»µÑ.IkÉo¥´`“	–u²YÎ‹,¯£W)„Kÿåø¶7À`“dšƒŠùÂËÈãbô$fªÂ«¸~\)“çý€¯‡ˆ`"" î#ª3Üç]`nï´ñµf”qÉgÖ)-¡›y8ñb‘°>](Æ2¤+Q!±<FŒ Ö©æY39©²wmmÐéT…È—ŸþïþkXÁJÂ >-#"[©K¤µC”¸€†œ¯èØ¸úñûKW£¦´×ÈiŒN û€Wm~>tARNO®ÅÏP€2û²	F]ãmáácôæpaoDÛ„7õØØ˜p9aî“_ú4˜Îõâ¾AúÀÑçzï*žïùŽw:taäïvw	ÒÊè#¬Y¾å%òœüö'å®@#ØøµÀ2¬ÈÆ7Y½ªv‡ÅF¬…Ò-
0d¯¿j²#ÌîaõÎ‘ãOéÆ fLï@#nú˜ÿ¥	<”D—©ÒEKRtL¹ghœ© Z5Iõl~ðÈk~¡<œ®lÕøÕ4Îa¹q™Q¨R´Kz	·V&fvúhèÉ™j­YØ:ÃJ¯
,Ð¬è/ôœØvþÂð§4 ÿþŸÿ%ƒ»ÔúÁ¯˜3h­Jè»ZkT³ÕMcDÉ–ãm›©ó†@š'yYMæãéÂ>12§4¼ÁNàc„ÐoŽ&à?§wë™yñ¨4õöÖÉ‹?¯“g ¡EVcÃŽ(šÛ×ÉÈuñ¨;¼uýdQ+¡9[†Ñø4¤!Àâ¶€	îÇäâŒU˜Ì¹­’F¬n;†¯Yæ@ÚÒhúø»4„Ëù«pÃ¨~‚9K8x¾óƒæÊû£jÚV}3n-úhÂx˜Ù‰Úö™“'žSæKíÐ$ ZÙãrÛ¾‰¸ºòñOkÊu’Fsj:ŽMGíÔ¤|çé8ñKÃ™VEÏê\“4œ!1÷Æónvûœ;OšñWQ5å‘lž'"Ä‘ÄU+MÓúñ˜Ï¿ØÑó/f£ä¯ï_ÄC¾[	¸¿äÂÝ¥%û£ú,1+„	x=gÄé­¾ß2ÍùH¡•ÍÈY”ëR¹Šc;âLŒØÌÿz,¹mŠ iª®§2˜¸çüv¼›ßüèá6¶Y/ô7%;ªøÎi‚YÆÓËCòÁG) ÷ƒò>ÊØøˆ3±Ø_“4§ŸÓG™IèÔ÷Qöy$\ÖG‰³9ñÝñù¹,0ÞÆ¾¾ÛrcV÷£i`rßíÝ¾gn“}#˜ú¦—L~aò7M¹ÖìisÈá½ò0×´½ ÕÃù`ÃŠl#.šÏB(m9ŽEºiÕý“ýŸÖIœ´35òMf-x8™F¶YIÙç‚bZn ã(¥yIÛ‰{%Í©æëaðNÃˆ¡!1Óõ'>oLw`kÏ”Ødö‹¶«þ   ÿÿì}[SÜJ¶æ_É&vlŠ>¦

ð…ÙàSlc0›†òöô8<Û‚”v]T–TÆ4‡ˆ™‡ó4§§#ºÏÛôDGÌÓ<žˆó0ó{ö˜þ	³VfJJIy“ª
ƒ"öv¡K*•¹råÊ•k}Ÿì(Œ¯¤é&^q)Ž.ªW°ð…›æÊúÚòvwë«v¯*/|ÁëÔÇB/}E«U0%"Lù¶?ß€Zý[«±PÝØ¦Q½ï~e‚à˜û0Ç
S-â„Ý»z/?7N¼ÎÂ‚YÓ°%™ëq¶œ~3LuB­PÉùeVÂjÊux†’ÿÛà}oA©s*·„Ö _¦ô¦êº]…Pf±&OGXM³†‡×Y'`ÎèýüÄv…“ÅŽ¹þ æ ‚¸^”Bõ±H®KDÀôE(->H­kõ³^l«ÅOf8õs>	‰Å“ú©S°G1¼ÆëÐ½ ÛðGm¡ù»Ç?òñ§B8RÃûÜuÝƒÇeÛ]ô8mo“ÃÖQ{÷Ùîaë ÍÙÉKÄÇ·:C'ˆ¼Sšâ&Ó0ód²w×ñ´«jÄŒ‘¹%ö‚¿v:u·S›Ÿ¿÷EÍÐÅX«ú¢bä'”™Š8Ut`MàI¸±P Uà$Õ‚}÷,šËy>¬9±<G'‹+S¢?¯æ4S ÿ©Ì{úrä„;Äm5š8|ŒDÙ„“¦óØý4…UiÝu:Ï)Ò
RÇ!«âkg8vúŒÈ±ÕxÃÙs©Ï\—±CD‰S!»¬tô;RÂõôÆ—2Jõå‡S¦TÇÙZÏ%¬}ü ¤ðDåð”$Q¤#Ô¸Š—Æ¿/çì&Cx~£Þ&¬³ÐY&·6ÏÌq´š(!WF˜6ÃJÆDÌ„Ù MòzyájÃ6Y”ÏDŠKf3Žù)/Ô=¾Næ³«ø¼à‚†T=ýAÞP*‘þûßþõäÐë{]ÒbˆKUaÉSò0 ºî6É¯Ñ×!¿þõÿïÿþ‰°ðžx~Ùr‚ñ4•adA{Éý7åyQh,¦ë§]òqh•^ð*~ð™yÂŸÑ‰œÇ¶°´lRƒ‘¹`ÄÎGlãê³x#ÉVhXÒm’VË&Y¤C±yÍì×%ÖÔªrŽäïœ&0{Æg¾çF^`zåâ¯ÿ€øuTlXœXÌ%iÄð÷r6¶ÕïÆnpY99o%Úïà1:vÔÇu,%žH"[Ëúú³–|uŒ`M£k¼ì°É<)“{bžœÄ.œWÏNñ!gwÞ…f9ÌÄI Åç-XÀöù(¦ŒÑü5m›¥»˜=nNPÑª|¶Ê l™A¶½‰·4Ú¿ mÙeŠrJÂC›\Í–b= ˆÑ0ã˜UÕ©}Æç¸+õ3îdö6´5ZP$`³Ã;#µßâtlÜ…ÒÝÎª×V:8ÁJf_™¹õ!\ e—ü¨bÆÕúÐ?`çæçíÞÒŽúðšÂµÝÁþxŸNßézAMòúˆÞE/³j'Èê	ò'„3ÚÆKëùªÕ”Uçwè…{0³Âb›Ù.‡óì-¥®¸|Å‘£ÑFLÿD“oßéy‹ø?hSMe	÷ìÈÛ#æqOSï-óîïKÓTDW“*ðúg]÷´÷ÌNûnSÉ·€–-sr€Y# ·˜Úêõ¶ú#¹ÇZ{ñbQŸÕÍ"‘™S\És>ðA¢v0¾T–†H·@‚ñð¦úJj×`€ÖÛÖ:Á*ø/G|Núâé€˜	=dbžf·¸”¹§4¡õŠëœ8¾§ÝÞ·x4ˆðÌ«=‹G^õ®Í ¼mª6 4aÝìÞïžEÃ"‰z1E$zÉ	þ¶oî29Ä¿Ùý±l@kýÎ9ñúNW^ÂGv‘=.üÏN£ÝŒYÃô&+û­œgcÃ}“æo–Ë€Ü±Fwò³€`é¹Ç,^C”Š“„.AØHÝ{ýóœÖ¦·‚‰ßXYJ5¨¡þf{-ã;ÕlíYt½fVÆ$cÅÅäj°^'ËzÃh›ÑÒþ¥z}Jjk|ÐW|•oÃ”÷úšÙuá	x÷âeü#^²ªÕ¥ÂnRºzD‚‘QÓ_¥Öl–`ì`<¨mª\ÜÕÁøÔÓ&=Wg¬áÁ¶Ã5S¬¿ï_¸Á3èššÖúÃÃÊ¨Âƒ›ê
€y²ï®{ÃÓþD¢öqn°ñ§[db4ÌOP†f=-ÖP¦¡W®ê!¨o·¶ô€,/-Ô‘>êRCzI»<c‡d¶æˆR¬Ü°fÉ.,•Éƒ8;Ü;ç(ÝÀ©ê÷Œ“ ^a±£ÊÀšÅÐšÁà*1¼nd€ÍdˆMgÍb˜Zv¨­-ÔÎˆ	 ¹Ãl7Bzîå,[¼ŽÙÂ*kç7«-!ö V×B¼¥…ñ0‚~ßž;C(k”=C{²=B÷¶¢îîqÙ½Êê&î€r¢Ó.ÈÓ¨®Ò‹œÖhÄ]Q=l(«¢©õêãºÅÒ ÝøTÆ…5`¹V’ÎfCÊ¤?ùÙÜˆdÚŒ¾n ¹¡Üë‡þ[‡½[ñûðÒB=péVC­ñî?/->yß8€ã/ûÑø¨êÎ’ÕA%Çª#è?Ú$xB×"Âòv±ªÅ‚Öù”ÜgæFtÄ0/¢è4Œu• O“Ëâ9Êƒ1uÚîö~€4e´Äì}™‹óZ/¤ªÎÌI«w6ŠµÈ]«ø.æŠd/Ë;*3oË]¬öºW½#ç‚¾,ãƒÌ¿,q~¿âÛÐiš{wÖÝ‰¥Ënà~Pæÿ¬ôòÃ.Rá§Žè¯ü7&g«µd+ä½–u¬/â+³—ª½—»lè«EøÑY£÷§GašBPm¸Ÿè|o7qR¯#îà'u$yö@Õ´N´6uQ'ƒuQíØ>Gç‹u"˜|™¶AëšÀô°NRs/§»Þ–ü0AÏ¬çt”u‚òXÏëÛBD¥°.ZÛçSé_ÏŒ"Ûç?ÆÎÊÜP°}‰=<Äfbç¤5Cæ’}GQ²žU@¶ÏžsÛ{°†ç¢9ˆÉîP\”×ú=Áä6‹[–*‹¡æàá$FSž¬Ñ$îSãaã(×…$çî´ÞùIârÛ>v{.Šwb‚×ø&Þä±ô·Ó5¼a¢¹À6!Ÿ§±–óS‹Á"2·öÜ&H´ß¬±q>ƒ)«·xµ®þIPb•¬ÀŠgÔî!f¡Þ;Ã(¸¤Ùä·yñz ìe¤ÏÇ«wr•^t,JXÄ®Ò‡áÏ€-†Ø†ø­98ŽÆœi:Z8Ónº{ÛÑÜ’	H£µL©éÍÀdŠÈ3‰‘I:‰5GQSï
m·âKp-¦IëÃcÑh,\wêQhÊZ+£
ôAF·(X÷ÙãxÆÛ;–W—÷Ävž©¼Sóý^ÞWo¼ï M4-1§–N,3BLïþÇŽÿë§~!oR<Ôò,¬-g)Ð|…{/ÑŠ«·G¢ÐwÉxÚoFygm“øíÕt¼5SýŒŽž{aV\½=ÂÌÝèÔéôEäyÏœÆžsBúX…ÊB]ðóÏR¸3Î¾{!W\½EBÎ÷o¦*åí­&«…]¢™
kÆ­|/­Š«·GZ_¡Ÿp¾YZÌ:A”ì ÎR³{_½$j£Cs”s›4¤ÿ3³.?D˜	¾YkAÚ ¥X¸C…îî²]Ý/bºïGf6;¬lÁä÷g9Å]¾¯~Þýï¡~!çïn»=þ­,Þ™p‡YÊv²}/ØŠ«·G°“`JÛ¼ŠI¬Üî}vÇ~–Yøê%Sð.6û€Ì§¿’þà¿»`-òßH4ÄßÛîÌ_óïi ó¹9Ð96–hóùuÂuv½	ÿÙX[ÚÌw+cªÔ%9=#%|hüA
rF¾¹ëŽ¡ø•ÖTY"o†¬.Ê:Å8V:l¹Rvê}l}Ò«ŒÕD3­ kÊdßï9¡‡ÜÛÈÞ‰jj<6‹°Eê1&çX¹U$Ü5üë_ÿ7AöíÅm¾¤”9u$†nj¨ƒë-¦OLEö)ztƒ´@X?yÑ%‡~P®¬^BNàŒâ,¤‰Ïaæ+3­<‹Ÿ±b+ÿ¬ýÏ=‘~ýó•¶=§ã`ÄEÄÝãIHâsÓANRY8˜LF‘ûEªš2v&¿?Fþ >
™GÙ`ä#ð‰Ýtß“-¢6¾ÇÄ:ogGè2(Ô†Ä(î•ôÅ¶çõÆ‘‘ÓCbEpèìLùñ@a·–A’š	¬y75óýµ’(Ñ…S!§ÊòöBj<¡Iórë!~˜ƒHµ‘ÃoK Õ*ÚÐ6­OØû'}7n»é„ÖX&Lï%MøyN± àŸCh×kSÀ½“Ê>bsz&‡òÔ¹G”(iŠâñõÊé\¤ÃK£p‹*wÀhÐYPi,X'* ’fV²RTÝ‹ÀIð`UÄU·Y*í©+¤ã'Ss–ÏÝ Ñþþ·¿ü‘°M4Ä´ˆóJ),U¢Qú´‡RmÊ„§+¼|KŽaý€¤¬tm;”Ÿn²¥þ™‹à-Åw3²Mµ¼¶¸ü˜´ÎaâK)W¾†æúó¿±:AkàóÙ¶:‘µ¥úÒÒÒtšhBä/^7’8¾8àãš…Û"_ë17Ô‰§³ô]ä^>ß…h”&kßÅ½_"_øD›<”—Œ	©ò˜òÈœš€–6›qžoä?÷@iÂdmc¡‘ÍÐ˜viùÜÜæ¯ýÅ¢u#·‡µ5ÍtUÑm€aí¶úÐ²sÐf‹£´ÑÏ\7\ÄKÕ¶$3àLõeö}%Õefãeà…h)%óµaçå¶©Zþßä)ƒ.%^G×á%vÀ“Vš3€[^ªø\Å÷5«¼ïE€Ã3Wµ„Æ-Š	Ø™›ÍsC”üwïÙ’¸æœ2J·ÐŸ×É&æ/˜g,x.? žf§±pöàâwWPôõ‡dV+>JÉ;Ö)Öiå9.¤	 g™÷<õýÞ´PíÙš !}ÐH4X­¥™*Óük¿°õ™ö“T'Š(£S	
ÂöÛ¤Aú»BdÐ–Û/é×?ý;NL-R¨Ô¥Ê” qgE½<QQ•iS]Ü<™ÎpZ%u«D¡*õè;GæOWµmŒ«“¾ÛÙ¸òÂãñÉÀ£göYŠßeâ¾ ¾€à–CþÖ–ÃÙH$å$É£1 Ð hLÚuó¼!j¥‘6rÕ×&’?]?>%ó¯Ý!þë9¡Gk¶ã1qŠb.»Ý$‘;Û»mÒzÖÞýi·ýûÉè"w:^oÌªx#]¸'5,ÅÛîY%Ë°JšÚZœEv”m®á«¾'—œ
¹dó±KNÈ©·“Ôè+_ò×¿þ	é­p  ±“P\Å
…­¢xœÁ£¢ê{nßï;¤Ó”pâcàr•"Ñ™‡^aŸÓÓŽ4Imaë˜!¿6ÂãKC*ÄÀH©žóUë—š—Y!±5zì|r%-u-'Íã{ð$¥Œå€’ÉŠ9¶¿5èâ·T\lhZdÁZn‘òN‘Û -còYÛx¬˜ÜŸ¢6™òˆz†;MÞk™»E3Z©ÛEýJ†)Ãk—÷¼T œ™ùÙg_t3‘ÌJÒXµ[‘_€x¹õãF¤i—‡wfðpt5í-f,š©¨–d¸”Å«ù††Ë›a8nÿ@áÕ4“ŸÝ,Øcú¢8ìÂëcØ+L.<Ÿ¦k¼È×<Ië^Í)2oaxPYGyfu­C¶3±÷¶u´Ýúùw­­ÝýÖËŸ_µÚ;/Þ-½§aœ×—}²rwuxZ¢sjüþÙM„‚ÎmNYl&dÝ>~+˜ù³ta‰°šÑŸ¥‰A›Û¯[IÎ%ý«tQûc'€o¹@:àá¹ÓÛÌŸ1©ßz1jT6ÒÒÚîW³8¨’óJ­kÖOùÑ©	e™ýÆ©è×6êñBã»‹B×,ØÀòYï¦Zi,ÍMYär­j+»;‰•Ãê^´s4ê¼Âf­£öÐ&Ö|VšUÌ²…>Ö†jHû1eqYá4.µžETF& £W?õ;nvÑã©ñ/˜î(ÏjdúJT¶9]%^šX]‰…Ý!Åvªr­ô…”O¯?Œ˜?Â|§Zm­¬½zãŠK¨Q{M;à›T]‰ÞúXVo}Ìê­±Þúx«õÖ+ç„æiÞúµkRÑÙ¯^á¯Âõ+G<¸AïûWãj™úZÎÆ¬’ðŸÒËš·NÖ|¼áÒ»½À…þñÂ¹ÍôwÅúˆ…åÏ”.rwçºN ˜ü¬X/¡¨Ü‰Òòq4·™à¤Ìrõ¸‹ðs?ðÀ
ë8Ú¬¬[£ß$Už½¦ëñ—&ï¤™Y”t´Ëµy3nP÷åës¯“ÎÎ§|ÅT±é™Ò#ôÐ¡‘/s›üGùP9F:ÃÒßŠ¡XýQ¡ –Ûxà„pÖÉxýÔ×ª´WgŠzèùm´ä¯òÊ±?=¬ˆGši•HÇ#{}ü	jÓtËl*Å÷HQ=JkSÜ¸·@9™•nëÍ1HÞ…¥~@½:üÜn§ôžŽ1õAáH‘œäÇì{aÄ˜U,À©{ê2È!pè»Ú[»Òkví£i3•Ùva¬~q×®ÓöxJ|Äó¸W¢IÐb±ãZÓjr³¯zBºÊI.šÓ’9³`vDŒúÇ&ü#v‰Å¢Y½d¶RxÊÁIÙìŽÕ[—Ýq#!q“%y4¿ª,Î©:)MØèûN»|ƒ–Î†P´o¡E­šq¸pÿ¼8QÀE*™ûÀ›“1÷á§4…øF1œXƒáçXúåü±7Ñˆ`|‹Óá4“ 0$ò³ &N~ˆ¤dñ5Œ’ºÏt(™éPhX‰öø>­AÑê÷i_wZC’¯ÐÁ· ¯!™(R Çchþ€Ú¥ìkb€åÚ^»%'q½¡”†é©<¾Õü±%g“¸@}$HÄM`rþä¹ 3;äÍí{@ã¸Fðn5q²VÌh-Ä‘¥¿ÿ¢8’UIùJ€Ò„ž]l®u«D™JêÕÖ;)6¦ÑpPcï—:%@ÇXJµÍ€œn(¿&N?Ú˜{N»Œ{%ö.ûÇ?ùV’ÐÌÐ s$pÏÜ pƒCFíåÆÜÐ_ŒOi NÔ,Ë´Æo »§ !Ø¸Xi^"mà-òJYêgµË®O·&täiûìæ6ÅN!µ7Gûtò˜¼AÜÄ.yîõÝ…ˆïÏ@u£h®7õzUáÖÁ*:wZX£¬“°(ÅÕCûEµ/n¬çú’ÉwQd#ÉpWã JãÑcÕ”z¬š“…ìÛXizG&ÚôÛF¸ûDâ^+®ÐÅïe³Þ>ZrØÂJsÍÒ†”Ñrï@BÅç(>¯(fãäöí›ÐaÚq-*“¬"8R#ÔZ<:Ï`œÏéotNOÝhq6k¸[èF6î/å“§/ ~y¬7Üîøwø´þné½ÎõŽ‡wFjx÷‚ñMñ»}%ð¶!X¨è‰šÖËÏöhÝb÷»`¬lšÕWâQMñWn8îGÄ	Iá×º×ããÚú‹ðŸVˆf<Ì¬=MÏêÑ®5~=Hœ)šQ=+@õÎHvØøÙ‘[}TëÛùyCˆ!Ñ®ï?tq!èE¦AQa¨ìtß S8„¼tFãj+]“j½¿xh6f‰!õí¦@ß¾Nq N˜Îl5¶î3”Õ	;”ÔþÖ4­æT$ÙÅ’f"Ê´äYË2}É½0;nËuôdÉóv:ú>-^#Ö? {í©±ðÄmgäDdÛÃ†$X±|v;ê”¨
?ELö™Þ&ÉNåˆÚDk¤F4ûCAðÁ¤.#jì~Êõ÷¿ýëŸY×è—ózâŒ©Œ|§óã°©¼!©¨¢NBò—x¥9NZq}ˆˆ2ŠeQ£Y2Ä¤ÛµÞBµnÀ½BƒÿMªŠXÙèîqúºŠü·CXØÕ SÖ^øÛ?Ñ•¡±/Œ/
T)ûI§«ÊöwqÚ²G;(Å^?wýdQØ”®3¬ßúÑ#V¶–Ë7XjýMlà¨Gœ=Qý¤Ã­"Mý]lç„8%üÖË³…ýl×’‚~R©­’Dþ‰lU²Û²nM<ŠŽ‰xgË
,_‰±ÐùíUºh23JF¶ÔÀÓ!6­¸feƒV!VÐ£¢™°…>‘ò7—^Y)—Tr–²¡	EX
3'°.­¦ßO:&›aÓ¡Šºd“,÷Á=‡F*/sÿÛ_þ›lô!½Cf©q´g6T“;ŸšêfxšJìŸÃ#Øí,·-›Ë‰çè&©¢is—•Ú÷Oy‰¦Úô4“y»";<ÿNÊè*œ·+3pA_€#xds¨N‘é™¿›M¤«:°á|Æ#¹1NÉSòá×ÿò¿1ðwxæúæYÌÃåN$\ýg¸Ú‰â‹æŠ[  àaØ®×o3Ó—PÙ¯°“+9ú?éŒÃc0ò{ù¢>³6ØŒÊlþR3¾¦‘e¤ßO4Ó ú]Œ²Y.žâw¥¤O¦Ðûbâ4°?×yÜEY€x4‘.ümêGz“¾ø‰1qLmdÏòŒ'¸bÞ®D&:@ê§Ëà0•Ûb*Í˜{\FÍâýÐBÂ©ó·…Ðµ$»"TÓDk‡EÆq‰É2ÆñÒ¦æM´NY–qIëL‘eü66QYfqIMÊ,^ysÄ¸¼´e¿5®‘’lâ“¯Sª0‰OJ=ø]tŽhÖ(7Ë3>!Ëø„ÊašÈ`’,»;’+Çn8v¼LJÙTw»g3šó6»Ñ|Îß· |Ã5¢æYÈ—È×ìFz®ZEÍ¤F_V	TôdÜk‚bÁiÛ¥ifn^›ñž¯~ƒ¹ç˜?`^ßÀn²_oÌá8T¨WP,zÛnfŠ#ûÚ¯ÞBÐd^qVsâu´]k½Çžôž–A^ÂqoÁU/yªÒ»šåßõ"@oƒö	‰)u´RGRìÚ‰}­ Õ?#-=1<EZ{aí¸ûl‘väwWPúõÑÏ˜{þšá²`*z%UO5e¼½{¸{Üz¹×: ­­#²¿³µû’¼Þ9øýû?î­“ãv«ýæ˜ü´s´û|w¯u¼Kw¶[ÏÛ­#xäûøúáÎë­Öïé9[užhðÚ¡ XÙ¯X/rå¾œSîÊ¤ÀìæžqB‡ÿ÷¿ýå_È1¥­'‡Ñã÷$e±'µmoä…N·çåðú~šn–KÜó¼Ò?¹wæQg¾Xÿ-ÿ³ÆgW¬Q!¡YÆ.zî7 è%šûž¤O§›@Ú|È)F¬ÒòT6B^ŒZVûIy`e¼FRê¡;OÚ1gÎµH¥K^(|ùÕ…y$Ûù(EòiãJb„L)gƒ3þ'·ƒüOó‚xy)‡psí<YŸìeû%o_F3ë’7Ñ¿ØkèUö›\fâuýÌ³ó¿L›l{0Ç{ó)\£Õ÷m{‘ßwzôk^ã²âü|lØ‰²HQÖÅ5ÓÌ,:ã”¥I+èë<©]ÊÞX’¢ U#+E( f®”]­fð hÙ«±€2…µ¦Úqoª·Üñ0è¬m÷ÍÜæ¯ýg’ˆ(©µø…»Í\±Hžì!ñ¯úwË¬8iÕÙÕŠ‡”ÿ?ÿ…ðñAjGü´U¡&ª	Óäž™Ž«¡‹LtLg:öÒ$3²¸›v·&e‘ïd†óòŸÿMbëBíì¿9hÝó² ”tRÙG©ÌOÏÍüôü$?o6³óæ“™Î›Bi’ ­òÝ˜ë²U¯•1xÏ@«oîö·aâšÎ|™Özv3§¸6‹É3.~µ Ê72…ÒÎšcº†þ&µ¶|JæºjSœ lNT*0™…“é	Êý—ÿAŠçaá{X­ÒÜÓmñßÿ+a€²Ýr¡ÂŽƒ³ré‹&—Ê3'¢Û/{nD~ha2¢'v|±®ø»ò/û¢‘þ§¬n9¥?Cßuá…¥”^&×qà…»ÒFª3Ð,Ÿ<‡lÁ¢ß©I«;p@‰÷Ér3‰R1/òÎyÇ›Iã^ä¥m×‡Ãêj "ÞÝuš48™Y.Å¿daqÌ<†É<ˆðªh-ëvŒe6#[»;…-°…ŸlÔSØ’JÞUÒˆÉŒè}oØƒF…~ÂCù£å2 9èEíà•!Úß™Q¬GøRâ6> nRHQ)`øS¼•¡¹±÷9Ï‰B°f¡ +.s «V üÄÝº‡¼›°€ˆ	8¦Ý¸ó)šÐâI¢ÐbVŠš.©4oí§ÐA‹"¿MXBí"Â0›iÓ’añMÃ$C˜åÈ§'}ÿ´§×Y@ù'–†Ë€n‘â*mø‹3ÎÙdë
ì÷äÍéî™aê¿&L47æ~†Ê{+ÝG,iä¡†~‚)mXhê°®Å÷QÀëì§d ¯)ì7#W(€^']Ð?W£~'QÝljã¤‹Oô!(rNÅEmY¸ë¯‹Üiºä “19U!rúê™›šÕ™›LÄMhÌñ7èè˜Àº+ÃÕ%;š'4KuŒ@Þ„›°—”Ž	&òù¯‡œép·õ¢õš<Û9jï>ß}ÖjïÃ£ŸvwÞ–§i:ôXIešFô”4]…Ÿ©ùÍò3åZTÔ‚‡ù–”˜éÑÚ=1“ž˜i•íÎ†0šÝÌaCÎô˜“3ÁšÜLÃD}Ó}¶-F®#sŠiˆw¦)M²òeùt'Û;ï¢UÁ³B©êÇ„Ðdv`“AvþÌ€T°VÌÏ K¬¨¼¥J5&ài.IWó©B.^Òºáp
y¨$²*<—'ÊÊ(¯|#“©&bÔQÚ(7Æ,°hóKö=a>sì¨ï\ŠK&"„æ;€}ï SSÅy%]¤Ä}¬k%)¯äe Dó_&)ØÇµrQ£Û8ÒšV¹áuáAbë#0—£šÒõ˜õ¥­	¾´ÉM(Cø¬§,Ž ‘X\åŒ¦î©|jä™9=.CUí$Éº¯àÂ4ïî ôÍ¤¸Ž=3U,ñH|ÿèøc°2³(¢0pÀLÉfÆm™Ì¼ñ¼!.tó“@Vdz€v'ÿí„#\¾[®¯.¯6–ßg'¡xÝà³Ü²ÚàœÖtÜS1Ì0£'èYo²Ì…Øæ~·T_ZyO¸WvÑýu¹‡º*#V²ÞOH‰˜·«~áõ<dÜqê~pÞÀ¿FøWÃë4N'Ncß?÷~éýádÜÿù­Áø¯†ç9Ö«w+kt{§›üJÜ ÃÈAÒUêFHÚH¹´7ís½d>JÛ&ÖHEÝõ…šlù!´üOÚP}(t/4º«™EUbˆD&´hm)3KåÔ¿¸1—(¸¹Í½·­£·»ûäåîÚz³OÞ¶Ú/[äUëm‹´w^´^ÂÜ´j»Ûvî¡.ÎJ p¤¯ªÝ;&xíDÚ^
ÄVÀ2”[¬)›º¦\‘l$‘[šÉµïÒõ-CÄÝäkÁChÀ—­£-Œ”ë6KÌðâêÀúçû&Ç’^'/ß.¾j7÷Û+tøoÃØ¬-ÔÏÝè9(Äß»N ÓmCbxz3´[ãu¡ùoð}Ïà}ð€ÉPvêÐðÐ«~é4ÈUFºÈ]OÙo«‹­kW&f¦ÔvÛ.ý€µéx ‚ÑRhýso‘ý3¼tHÏ9Gçþ¡»\V¹å	£=!¾¦¦Ì¨Ï_8Ÿ.Ó'ý³3œ‡ëfŠâ€P[ê¬¬îréF¨kt>Qƒõ/4Ð©¡Ÿ·ñhENíß÷Ç”ÕÁÎÂ	áCB8=ì¢Ð=ô '— ,é2¶1ÏãVbˆ¤Êñ±yýÓA™Ì›Û´7µ9¶¹DôCXE¸ˆívîÑï»]‚H6‘·,0œ.yá²‹{ uÃÎ~±i‰°i‰¼r.ÒF1îÖ•}XqD{çCD33·]¬v.©«™5Ñ>³µâcÔeÑÉþ°àdOÖ{ Œ½¥P‰iêÇé†QâÏf•ÒDºÀ{öÜhìÐ>¼ðúGô
±ÏH:¹Oé¢/ÄèÓ‹Íj=íÇÁnEˆ÷¤GÃÈ¨9GäÕJÌÝ´ð»¢™/ÐŒ\§ª ±BÝhôOQÄïjƒ¿‘uÇ£„/,)ô‘Ö.l¡ãvëõ¡!ÜÙtY.$òx(‰&ŸÛ<;D€ª:i;ã3¯WéÔV.ÁBØz]'Ëõ¥'ÍúÊêãIøná(;v{,˜égC­Ê ÓçkO­Ëiàãu÷òÒjýI³9)B•õééÙìÄìlï¶)£Lé}ÜÝ‹œÌÆß1‡ÓÈ¼4³M‰¯òVn¯Xí€<\2î€è6­Å.ìW³®PîÒ†jÅfÍìuX·qº¯b×Ú%Þ"ƒÏËmœŒÀBb¦Ó»5æšáö
â
¢,„RÌèYî¡¸îâ»'KŸºïS;Â¸ñR:?N‹F°Šñ6roþdÎ? L5cëã"¡zì½U;0$ûá@BTb» ëÅPÁP“½|«Ú"Pëaõ¦ÖìÆ;29™QŸ	Y+†„$VìÎôÜCÛ EçüG¡k¥¨ö–«–<?`L´à1Ù¸bæÇÎ'
k½u-÷\d6Bwàåâ_)Ðã8(ß*È"Æ	‚œéÂ¼	6¾VõM%É ™DOÊÕÊÇ…cÏNM…¡5ÉàÛ\úPÈÆZŽE^ž÷'’Î‹qñÕrU”Êtó¶t;Dµ<MàC.‹E4CŠ‹7mÁœDámNsªøƒýOýR„pƒ…¿7éÿgŽC(½ôåGåûÊó|Ídeé»öZ[o[íƒŸ÷~l·~~…?_¼[z?í55*¯[>¤¤íIÇGÏ91å€°ü´ÐÉÁíÇíÖÏ¿kmíî·^Æ%yÃNí3ô'f—&ýCÑÚtÎ¸Áè}*¹ì5OÉ‡ï®FNº»Ã¨†§ê§~Ç}@–—®ëä»+z
_D‰*àEº÷X±pd” ˜(ü½y%ÖÒBh	/Ô’UQUØÏÜ&2ÓÁÕŽÝž?äÐÁ©¬QÄí×­RûqB‹:}=‰ ÞÞ´°6¥ºÇŠ­š‚)Ïºvu‹b!öµÚ‹Œ×wútèS_MF…®[MN€þå¥¶üèVHßÎÀÁM)‹%M]êh©³;Zô7(w·yï;'"GãL6N¡°<QcºÀ¿7®šª.—/X%g0³’ïÌô‹îÓ/ý–ÎP‘“÷MêŒ›Šì;]/¸‰)]î(¢• u˜^ðêÑÛ!hœ^nz’Öq"<†\ÒX-f)jÂî¬¥1º÷Žs“(3^Ì=&AoÊ`\L)í+ƒÀtzÞbþ7uy_u‡äµ¼·/Ø·èÜfòÓìÁÊrè0³ŒE1ùi*ä.;¾ýÐþ3G¾˜µúáÀíÌF{³²¿‚qC5ûÇqèèž½vÇÐ5DÂ¢Ç èž"]¹TæS>Î#Ò¶s²MÝqÂ.L®á-ç—$“q%_À£¤‹ÿËAt'a>Æ9^h…E@¥ù,ÁtH®(kâñA2êb<ÕåÁtÄ'9„NÜs)ï¡sØ‡ùú}ïô1~luðéY×UôÈîî)H‹Y‘§qó¢”›Ú^;|šBÀQ/r±¹vQ×¹gõÓ1|ê0zZ?ÅÛÔ¹¿–ˆ6@&B:pœ‹¹Ä„u1N´œAâ§spzêO0ymcîÍ‰ÓMÆw…Yø™ƒ©Ìq8ÓCMW°nªæjW "ªÜÍ0Ž™¸¬É.à€õÏ‰bÎÎ—BÓr9ÞÊp=®wÂ• ¨úŠò&b¡è0mwZlaQ<D¥ûìlã*ßOf§zÛãÏ±³ª§òX‹æ>ç ‹³ð3Ý¸Ç‘PiÿÚP¥ÎfC’Íi3pgÒ‚ïŽ7Ó¸TÏ˜~qx' +¦~îûç}·~êJ$Û™¸@ÅfÁ?3æ“÷Ö; Ú­.þGðü¶wŽÉ˜3Zö'[êXMiUD>Ã>éÚŸ7êÜ&ÿQzÝÿÜ½ÞÜ&ýç«^ï'äˆçÎ/ãi³ÝÇëù”$Œ3FMY_žì‹ÉúÄÒÐn%¤%x¶”Ì`ÕXÁ””]åéº¦&Ã/çWÍpM':èX›™o[Ö¬ê«h,ù‘2Š'¦¡·˜Ã”h±Ó"ÐÝfŒÅPèX	PRà‰h4%yAI®	ð¬ZÁÞœtMQXd°µ•‰tùYì°s­³¹4·Æa²L%¸7C/BÈyMðôü¼„œc×Sˆ,m@/ùÝ$I´-ÕbMpçìMc¸ñ™ßA¤|öÒ§ì_Ó‹x²KÍùÿ@ÒqÏtßr†—ãÒ+ÚØ4Ô«
í:Å!T?¬ý“O4!Ù#^?m®<“UžÐê¿¡—“Ñ²‡Ó”<*<«*â„<:-©Žú^T›¯ÏÁåù+i9u„‰º´ËV( -ž}·ôž)þååùôä2;w”þ5&}íÅ¾‘!Åc÷#|è²¾$lt±ûâOÚ$KfÞ„xØ|ÄÍ”‚aï¶ý>µ®

]wIx;ë‚æ{ÝnC=@ûØÝzPc¥-ÀˆZ‚Äþ22_Âj:p>³^zíD]h´Ï5˜°=Ï§ÌËøSO˜÷â®<Ž-¾ùÇ”ö¡¶P9c¤ª­> ¥aêVÞpŒù–—ëß]Å’¿Ù{®?èË(;wâÛô-¯å~ÈÓÑˆØ™r˜L)¢¦v\à.UO\º|‡HpàD®zúÔzE«AW€RÎÜM‰¦«™»”jÛhíÆôÜS7viÁ2[·Õ§L†°úÁµÆ4iî&ˆÎ8ç^;á¸‡`W«ê(®ª–fJjò.òœÉ¶8+{öëgÚ“3Z?—Ýá–"yF¼/kmÄøJè™Dzþ½×¼*Æ4ðòúÖÒããÎ(kd±¿s‹öUä	ù3ô= 'Ð° užÆÄTàÃˆŸBÀÄ˜ð­JÓåI,J·â- °`k7òzçõÖÎÙÞi·v÷Ë‚(ÅË9–ÛK‡NÐ¤•o4éQUÐ¤ãb“Ç
	®
g]'8íÖæçïa“”°IO–ò°I«ÓƒMÒ»ŠƒŸ Ó!¤Â¶§<ÕV@cÒD«ù&Ck‚ç_;£Co8	`™d“Ò¤ÛvÎ ÍEß1Y”jJ´®‚B·Ì‘ÁJ/'ð˜‰ÝÀx!¸—ì×ñ@ù)?%´ìP·çöÁè¦¶÷ÀGòaü2ÄÍè‘ŽIkÿ•
èYõþ„$Y’¯©L—ÙéÛø0€eÉÔ&GËÒNH_è=UÌùnRªážS*Ì	‚»§!£r}wUS»¹™+¦G»@î¡uF#|Xú]x1çüvòùüˆ¾ï_Äèõ(ðXÁ“-H€üæú'Û×ßçOûãŽÖlß¶ [¢ÉG±[e–uu,¦™kB¹¯“•ò1yPÒêÉ]XèªýÍÇÄéc…9ãp2^ÊFû¨l|±r›`–&$8OX’V…²dMu½Pý ªÕœ'tøœú°`	Ü­KXÂ»ÇhÉÃEr² Ï+Å#Þ£x*)’KîÈw…¸Ë]-~|¾TñqðCZº¤x-j‹’n@5ŽXÙTª©žúž'¸Ä€Î~¨Ë.k­)Ì³J¡a¢&~Ÿ›ÂPµ‹ÅGºÍk(ƒ7‰l½ÓwÏ¢Å˜ßÞl¹Ñ$‹t¦B°qt‡Â‰ÌÜ6›xk&&qkZpã¦yÎÇøÌ	<âp£­A†~t0ê‰‘~òúÏ¼¥.w3-Š¬;Q»o.s(–ÂA7´Êâ2BF§Ã2·?nt4êv¯µ½+iE-ƒ4±I—³ÝT¶ÙµT\ý^ÓZ^e¶˜•Y0¶·—þ«xh$AGà@¯[šÓT=]ÎH¯ò åi ¿ \&9×,²Ð‹GJiCk·a÷×cÍ+ajaÓFÊ¹¡û0:{‰O=ço|ÁÐ‚çÒ¾ŽÜpà‘²Ÿm‘™ÕoºƒJ¡ØiC$d7ö-÷	Ÿ/Sùz=M‚v$Ò‘KÏ6’3—0%#Ç©)NèÛ‹“#Ä„É<.ì–¾3Š÷íÿCÔuŽAÓEAÎi›/ÔG*uL­-©Ò}d!»k’=O“ªŽºÙ¥ú
N‹«øC#ê–|n³Bª>+‚*ƒõù¶Uµ LOÀÐ«ZT‚‹[ù£˜…Eau«” ’?Æ1ØK1bw\\«zæÂàŽ@¯9Œà‡èÄï\Š‚q2ºxIø4eV%®Úx\e×ùbt×’6û5®£ö+ã›:°ªëƒªÜ¸ÊzjG±-)æb&¦””Ý.ÝÆ±ŠGÛë8=âtœÄ‚GÉ¢dZ¡ŽdqK¼”ÞÐ3M#2è-sï›2vÙ‘ëŒ/Ãåÿâu>/˜Ð‡yE@…RèQtxLÛç3‘­£è4´icÚÁEh˜]ÍNés›Wð]ÓumÓÄò÷ZU·8c^€R-‰·µN.7R-ß#Î±Ê./T9É6w$9æ3Î/Ï6Ò+T½ÐÚbýìò³w€mé‹s‰ïÚliÉãzŠ¯ìaX|—.óÆÇ@–¡Phõ'ØêW±cõºD«ä_!Zf™=:!#“¿‰C&~Sû×Vo8"ßK¨)›bÙã*ï¨]4x|&­½m·K–cM\ŽáÞ_¬òÄÕXn}U´®QZdK6½›1{ÐÖ*ÒPH~ÛeZˆ¦wVå„ö9Ì®ÅŸXûUv£Á~J(tdÖ• íV•{¡„VÍÖ×®oÊôN¹ÉEN‚c½dhdc›q‘l¹ýñ€š„‹¥ê5Ûñ›]eØËŽ<ín9’HNâ.NîÄ,9¹ZÈ.ºKHuMÍH®òoÍª½.Ý>ZŽIƒñ¿§Üb<;õ¶E]ÃÄ±ìB ú”…'ÈÎ¢Qf¬Š>‡jÉ°FG¾:¾P¼ÿ)”JFÌÚØšråüä¹ix6ÿ²ì†XD&ú£Êó¼ïwZ—„[— MáÉ…(¢¬UP’N† 5-b'ÙEÉŽwu¸Ÿ uhWù£ÄmçÒµß:ž³ØDËÜ'…?——Râa‚9,èk*õLºwè0¿þàn;‘ûÜ(¨_ÉƒÓH"'$Îðr!¾ØO†e‘KªÃœ…(òìŽ’ã{ÂÑéÁÜ}îg'?•ŒMþ÷Ô‡f†[tƒSäTÝðœ²kÀì¼EZ6½wW'P>:öu»†tÏmªEq¾^(ÂîÍ&ä§Ý·Ã£ÝƒŠlÜù	#?>‰óú=÷lK$6—5±¾q6î´–‹îMjÉcFnƒ‰h©%kÅÔúø,óJJåŒ$çŒ<œƒ÷a@q7gËám™½ß“gnäôn»{ò‘Êu:ëÍµB6ý\‹ë*˜*X©Šš‘7Ž‚—»ÛÛ;äYë°ýæh‡<ûñ ÝÚ=Ø9"Ï<"­í×»äpû9y±çZíÝä)	†i‰×Cªãðð:s½ÈY¡(/ž:£h¸‹.±¦…9Ž·è¢û	†LÈºå†ÑeŸ*Ç‘ÏúfÌÓ2æÐ ]øsñ	£Ïp"òG™¿S5ú ~å}#Ü…ï„[þ°âñyÐ‡äb¦èc-Ï`å£Š®[é,ð-[‰ ã‹ƒŸ¹‘í¥kÕ#0`põn\Å¿Ô·‚
€Àú(kàuŽÇgÐ¾0CcM³µW‘â>ï0š|C¶â)œë€Æ‰…]‰âÏx¶AÞRJOó;²ÉÔ)*y {×ÂS¾ÿ,­´JµZv*Z(·¨O±:Ö]*Ö½<2lþ´?NØŽ7$/@ Ö	mP>×„´Æ‹'—‹ø/ñm<íJ(Ÿ,Z˜t’|P!Ê™žBV6û	=	–¹#å†çD8¥úh[Yò«ŒIª¦ÂþgnTX	-ÞA¤m·Î®7Û­×‡»û­²½sÿ¯Ñ]Ð{¥MCª¨)ƒR‹(0ê…UjhÙ)Ìâø QÃ>FCÛq÷T¦	[E9$¶ZÏö¾ú±µ³ßÚk¼ 5üÜ©	®¬oÙÐÎ7ªAª$YÖ,òv}¥ètgà+RßB(^Mf„t¥¼/Qa}9ˆ`¦ÊŠ‘í´¤]Z–ÏŸÞBLD_Ãc‘¼‚z;ŽÙŸ+EP Ïafù–ÅÆ™„Ç¢=ŽÆ#…Äé|º9=-Ý£×$|ý ñ¦šñU“tÂËá)±Ù³q./"Œý‚Ã9ƒæ©e¿Âë¶´‚bzR&DšgJà ¦"ï
fRÄ­Ba‘Ÿ‡ÍÐÊ˜Ü·³lM¦£sÐóþ ß“¶œxQ!Rhüí¦Ý†22d½sÊ.fÖç…æöÈáŽ¯`8ã(ä´ÞÓ—55˜‘4vê¶ÊY›°'Øþ•åëÅ­ØE²ì”YUQLž;  Î¹'º»Èr0~rú^Gƒ!]M°Ë
µ¨¸·Ý¾¹ilÈnçAüEÊJÏÒ	¸f"ÕÙh§j¾ùûÒÁ;rz¡C:ØKÞÑ|,ÑÊ.	Óœ°›Ýì%ì‡ô(¥í{Îœ’{SGŠìøuj{ZÑ™åàmm¹fI[.»«”©!¨Ì$Ö_~fE³çÏ7Fœ B~|N¾§>âdÇq+½³qå…J4ÅaçŒbiH°Xßr5á_û¾Ó9Ü~®}¬t¥¯ÒR(1,Ÿ,-!¨«*u?ÛÃI%<‡kkåz]Ú¶zêLmÞc!]h…tä„Ép3³êKÖ‚•‘l†Q6Ú”o/†#O‡Ç±ÛÁÄÀ×0¥Cãn½^×Ìêª’lœÚoeÍfá‘Ü;Œ5Ü¢¢áÓêðMµUxlUA¾ò'g[Â‚Iöv^ì¶Ú­r¸³ßjï¾le·ç@@[§‘÷	„;D"v’>b$‰¡x¸–‹¡€Š;øKvá$+Ÿ3Ý0è¬£WTÄCz
Sóü¹É+_Ãˆ%÷²øÁ£xŒÀ©Ó?­A%;Ÿ`$î`á=¾•_|L<ª ë!4^ÆÃëÌé¸‹0îóé’q`Ba*N]GÇhÛKuBùª±]?³F^UÀ,-¥à#Ï§¥µQ_³ò7±lÓÇ9ø‹%'FN“ãLr•Î*{gË÷{Tê‰Z”E«˜	1¢0…KDM#Ks<žw‘öež2î¹çÍ;¤s÷<²À´aét%W°k¬È.Ó mÊÐ4—²ƒÊÜu»o¤+ÊhŒ@šÞQŸgó{ÒsG ƒÈ¡ˆ›ükFñ×(>£–¦ê´2öÙd'—v‹Š˜¯ðdýPˆA1£^êA3Ëú9ùR‰:5Ésè‰qß“Ü(mcC ŠjZ•/y]y Î
b²l!<„Y[Ž¸*7q¹®Oðík3‹$Á¶ð±¾æ„aäx2¿z9¶Å‰˜e°-¥8È5Œ0N:nœ8éõ,<TÖï®Šå•sé€‰’eòò-œˆ`LËËâ(q(eÔ}’|‹-N†×
ª÷EŠ ¤ø×".a¤P˜R:
„ñ³%íbYØ8…xÉ×¤ãNîR0ð.ã*pòZM÷3eš–Æ®k3HÌ8ª˜‰d²I‰oSYGéÌÈ{)ji£°fßf/®·J`m™•FO-Þ?®C_{CøÕE)_ßåZÿA¶;šé	ï]tï-Ï¿_``2Ñ:	)Õ•M&&!¥H2Ñu,Ñõæâ¤éiGU=¤£#½%4î²Á•2úv(šûÔÇ—Àæ»5î9ÓN
_–{õŒ¦¥.6òÜ&þ?Û©2Ýl!ÔBœÛd†¢u1C@qúkž¾Úî`äD¤Aö}Ê0€Ú¿:CÇ4ÔÔöœÙ¢SÙtã°ãõ@“š¬8ùXîÓ/ÈN–ÓÐ¹7ÜÑ	ÒÞ¢Ó‡ÐÞFq~ëô¢1Hs›åµ~Qq^n..¯’W°Š%Í¥æÃ2¢ÌÓrg)ËùW|ãÂ¬8ý5«þ--UË•ËÆÇÑˆ,¯-Õ—ÔTÞ²¡q‚µžåÀÈ¾à·Qn÷ˆ¼m!v.fª’Úž?<ó¨çváÆ¥xéñ“‡?Z[-)ÇCÿm×‰Bg4Š?cú¢\xÇ7.ÍŠÓ·Í»zäö\t;€nPmz®Aÿ€ßú5ð´Ý¬[Î°GŽá­žÓ%»Ãt_ˆ#nëxw<ZYz´Ú|´ºú˜8õa ‚Ê…×¯âƒø'_<mOlñ÷þØä|9/»C|S3Ã¾ÒÚ@R3—þÈa	{ßõ3ƒEUÒD›Þ¥c˜œB‚\´öy€­
S'þ¼‰‘)jZ8BÞ !ß¥_­*L7ïÅšáž×¤äœžº£hc®>êœ=¨wüSú¿ÏêDìk–¢¼5Î®)š›Âž‘tèb½Ã§õwKïuAÒÈmv¶`ˆ#ÐNÇè#lPÖ&P¾3rÓ	ÈîÃU[M5â¢û&è¯Ç‚j2½ÄJÓÕwƒ¨Psô¡è9Í¸ºXƒ®¼¦áUæJ©'7e¼Ä”g½nÂõF£xŸÜú¹ïŸ÷Ýú©?h ¬5:è)*eŠ‰ÒÃíçöSÐ»SŸã2’ó­MnÑªjèï¿'ªkuJÍ¾õ¢nmc³×çÔÙOðY2øÇ9À<'âx²¶_ñÇähÂ™d3}éæ¯ý›ão‡×c6wÔ®^;Q·NßWS6§«hå¥æêÂ5ÙÛ2å‡€ülB¿e-åÆÁü¼n™C
“~àŠ)XéÎzéIb¤ðív© êÈRº¯jC}D¶ƒLö½²pª'ŠhªÚT/¨
$Û¨¡ÿ·¡yOüÏLžQkkûy*Wq¼T]õ•Û ŠnlwÇƒ“!æ¶ÃJÎ±‚©«öæhŸ5¦`Ë©ô§eÅ&y9ÏÙ°³·\Y{ÌÞvõÎ¹Ûøí½ÍŠÇ”mÖsüî-Öü¥¶XSË”­3DàÑñÕ8q†CÕì$3T“.º™*Ë·n¤¦lmr&àƒƒj,òÚ‘'a~ÏCr!ÐÄÄf†ÐwµÊGº$åxb<JÒÖ tP¶¥CšæôÈs~ÎÔÀvX’3ñçÿ?   ÿÿìínÇñUÖ’ˆHJLÔ¬CþHâZITSZFt"OÒŠÇÜm¹„€¼@Qhÿ5ÈŸü(Ð·Êä:3»{·{·»wGÉŽ˜€Mñö{vfv>ngÊ_Ö¦fœáW”€5k ÿfáL1ýî@¥ã5tu¥$äþâ=ÛÂåq=~²U)ˆò¢ZéÚOíøËR6ûœ ó6ÛbëX&J#ƒÆÊ-7D’½ £/¤Á|	ræ„‹÷9µ:øwšãb¼VÙü¦eê‡a2ù2áù;ç#‘¾ÈwöbŸ-Íº—qô2Ù[ìTa±OÂAvà}4Wpz½úÇé$[ÄM§YÏ7tœ¾æÃ4Q5õ|N7äÌÀë;=6ztðèÉè1{¸´¯®*²ö—oÐÍØÓ´ÖÂ«ºZa”–'#Ó&stçýÕR?¡õGÑNÝloR³5£ìšI¶v=÷Ø+LO¿üøÏÿþüýßùñÿ“#_žæUo ñÚã£ÙŒ4ÚŽDRãb1[/¼ðí´½Á¾;WŽNÓ ZÍ±N—)Íý.¢ºÈ_‘Áò4ŽæLä²¶‡s`Xv	5™éoàò
»ºÝÊÝ—Ýmyë¹0Ïû6†„ºòdêâI¿Sš„§Áj–~#^ÿõ‰0ygUà‘ºRN,Ó­2¢6Ž-@N¿U°‘JÐãç_Œg+àÉX»ãWßÝÜÝ«ê*Îï­$g5dÏ :õ\˜èà¹OEîxTn·<Ù@¯ßE^‹s"a~§ØM§0N,<êÄAWñª{½³MôqÙÿ›Æ«Å8€©4³k½CÿADâÓn—òì¨¢~
)³/s/·}<¨ÃºÝª÷î×ízÂ?ãxIrµe¬OE§”P¹Ýž)áL•­‰ìÖ¼2BºŠŒn«ú¬8büÖ7Jc¾‡?d*3,h½~’ý˜:‚¯àU'ô-»M:ì“²!­®öÄùâFtÅ§Æ®182ÍV!â 6]†§¨ß‡“b~²Z¼â¨$ÓÑ+8ù™ˆ Ò—ß'<Hì"³øàIxçœ®E2[œ°b/‰æa›|–šTU-ÙVìç€uñÃÕ9ÿ¸S·;SšÄ–g?{@Úí+î
 ƒÜz­ò†hH©YYZç½3P}I1~æl}ƒÑ0sÔSÂè=¶â$¤Ÿñp6Qh¿%‘þ¸÷ÅþW•™àC,N¨ˆ7]3~ÊéþIK±ö|ïøÃb<Á–ªá¬Å‹?Ù¢5Ô£‘‡ý¨§˜†Ëm´ß´C­á<¿=˜‘”½FÍî=ôXË9
3Ö\9.Pg{©µðÂÙ¬æLˆˆ<sq•;Š/<MåŒþèc;’w0Ö#iùºCv¬Ž_å Ç]ÚösP9¿“È-wTøuÚyÒß@Ê"ŠòAZ™
Âï{ÈÞïª[ðã•\=¦_KP:Ý…è²ŠËå-(s¥#Y«ˆÖ(B„ÈÊ—‚u«ô‰+ÇJj»½†Ø‡lçê¸ó>™‹àû;fíÛkúqÕ9Æp,^˜”yž„¯®ËúséIÆ§¤N¥l45î=?ýúàÑ·û÷ŒžÅÓçÄV¦yªn±–wœFXK÷§ç=>‘pÁ ÛìJ5‚þª
—E­5Â”ýüý¿Ø³µZç•Owº>–ºƒbZrÉ©!ÕW{±×±AÆ*½ T¤4šKœXÆÑ|™¶[OÂ”OQ¥ "JvQ&Õ¡Ùi}‚&žÿêŽÍÛêy©íÛ­¬—¦{ãª{Íh«m°º˜Àª‰ÒŒ$Dý	+ê"¢PöN7Re¬‘¾ý!#…óhG”ƒÒ6‰£Šæº‡2ZW"ÓÎf0>çËæ»,”?FlZ¦Î÷rÖ^šÐO,Io6
WD.žÂ1?þàÓ\&ÈŒ|‰Æ‹žï%B_xGï’èð¡èÂ[lùxrYuƒ–FgÖ6ÒÙñÜQ\þÑ

°zC‰rÄÕÌ[Ê†äÍ®YØÙšVíMŠZ#Ár=Ï4~¦_Þâ§+ÅOÆNm¬4³I}2M™³[€ù„%]{ù*Uðç'Öß0Ëoï|P6Îg€P7†Ÿ¥©vZ.Ÿ/¸¯•_úù?ÿöaTuTï›ÂŽ¿vÇzó¤)ƒ‚;pôxtôè«Ü-¨YHe(Ÿ†ÎÀ(+=TéÝtÒÔ¯çüéÃù·O‘ÏoÜ	˜m‚ò Š¥ÕuÿQíæ¾?‰U¯ÃóWä»äÄÜßu \Æá[é4'§«ÖiÿÆÝ‚ý¾VŸ òk:‹LÁtÚŽ»÷î@[?ï´;pßƒïUÕð"Öp×P½¯cÑxÏââ¸i—"–ÚÜ>Å	NPÖ©º¬a®ªˆ¶~ÈLÈÚ<eÁ4	ŸÙ\¼/j>´‹ú^üÖ 51ƒÖ^…gÐY<ØÄÏ‡«<|×vðiƒX»ßÐ‘çòÇÙŸ¯j­ÄåˆsûÚêÐ¤ÚÜfôøQ}\<¯S[hR#Ä~\:PÑsòAµçú<HþôåÀ‰yé¦¨¥ÚpK…«õ–;‹/òÆ×CÌ|÷äœÓ²L¨!*kë°”XÌÉÙÊjÀ¥„æF§öRGá…§¡\D_´ÀÁ÷.è\~ï€~ï€vnÏ{ôoÇ]T”_£#ºÂJô6ù£ÛŒÞBï4Ù`×4=yï—.}¬~é"a¼Qÿ´TÞ¬›ºdB»Qwµ}…tbÂk4òZ×õZûˆ£†ËºÂ=ýÓlüîýÒE¶êa©./uð.x©8§åâ_NjëÃÂÓRÆÆÏ¢(½fÆÆp1QÉKYÉ‘-ó»Úò6ÊÁxéß—¼ñ­È_g¦{.¤ Î•Èöªo:—SA—¼;¶”ÁƒKK°ŽÝ¹³|¬»±ö`]¶ž\0Î|iJRurWÛ§E¢vµàepÁOà<å	ï¹Ål¡lÙK·Ú…J¾¼ß5'>²rfKTaÝÛë‡Aö@„-çØÅÓåë@±OÒ>÷Y˜‚L9A&rxN¾’±K¹§´*â`p„Œ"+LqQî}±M ôLŠ#¹;+@mÅ/[bP	w¨íØÒ+ñÖŸRÎ‡ó¶èÖÕ¥]ÑÄËnˆØ³h. ãÃÞYÁÃhºZ²œ;	‚m¥,¼„_° ª;º÷+¯Q¹]Þì5¨>ÍuE_S5–:${;kwRHDn(‰Òf*%EÑ@Dý9ÀSlWÑ[6¥žGp'9ÄHBÄÃ¦ p
n..TfÃ2U5Î°aXÂª¦¨¡6'´>‡õ)@´€qYœÓø•bÐÝALÐ	™Æ+·É0xðŽç0L“Q¿àã°—/BÏ\ìIÿáüìÁ,„Ü“<Ð&ŸQôAó‘Œô“?á}ÌJ®ê16þÍ¦‹R<Ú£Çà¨f9qk1f.SÙ@èn:pžE1ÏšY[æ™¤Ýý3TZ{s7—œµ³çYr·Ì1knÍ8V9zyú›M£ÜOÃù3ÝÈ^,vž.™ÈÔãéÍ–_AöèÈîp½äž©Xòž(lµf]Ñs¸xºUùe_ÅÜ‘î†F8bEêÅ0àÕÍ7i;Eíðíµ8rŠÍ¹++W§®è¸NÍŒ)Ö©œsË:µµÈY4…(]žY)ŽùâŒ‚°(ídb±z¢9šÐThÊXÜƒíGÖ±ÍJÚÌûLÊ¶(ï„¦«(êj¡:}& ëyé \¼
Ñˆ{ÄØª	MlOw§sÊy@
U4!wÆç°\Œ”—ðùRÆÇÃ‹i-¦dYefÑjÂ>ãq˜¤QÞrë«^‹…K#Ak|Î0ø­Ô²*éÏLk8@Š)g:5LuŒS°²©Ã{½y˜$RnÀèºÎIœòE0›Õ’«¼«±<µZMSÃµ”ºÖuBÍ­ì2N—Ý#3Ÿ¨¿´h`ýí¢AÇ}÷¡–}çîƒóp<}Àãñ,¨øØ;âc‹[k›¢Ý‰½?ãÕI€ºÚ¡æ×(ZW.c¦Ë d±M–t4Uí•÷Øg´5˜gè‡i¬àhç€ç‘i»¼»‘øÒð(+\ŒC}˜õIÖQÞÏln9JîÝy„ûÓƒyÖÃé€Ÿí­×,Zc€Þmo1ø¿;€ïd$OzwvËXˆ¹mw¨mÞr§Ü,¼äéFãéÖ[~N( ë.èÓ§iw§?`]ÂDàa÷’ü­ûì|ž;p23ðÂ##^ÃøfxÕùÄFYô}fÂ,^e¢ºý]Ëëò’¸ºá˜OBïÉ›ôQB<d.aœ‘Ä'†KnE7YòE¹eÂ‘DãÂ+IÜíç¤—hFæ»ý®hg­Næ†Šì¾P	ë½óX3¯(êQ5m`žà¹±·¾uë”ÓÔ“t¹Ôq¸QjÆòoŒºíìža&‘wÆ…Z¿·6;FWjfIX.“œ“v@>§d›p$ƒ8åc LÛÁ3{ï_ž1|ai6Ó'òÝ
ÊÐ¸°g7¦,£,÷2“ÑŸU;zµ¢dQÊŠ•—øS¶]ÀŽ{žV…ªCJÝp'ZI¾Œ~¢ Pà+@¤S	dL·°¼»0zhÀëÈ\ê´ù"£y7™âú8çŠŸÈ°ÔŸä<PÜúIæ:3¤¬>"ý.[v?6neZ¸Z‰!š'ÿí²hT†6z]Dˆ¤d5F¶Ó²¡‚ó[kîìC6B‘îdÞ(-Æìvw»$¥ìâSë(Cïü@Œâ–sräéÕgF´iÑosNY˜u>-õŽÞ1=Ð:–×hõŽ³6åŽ¯Ž¯üKé¶®~µ“A821”þ¶õ
«…¨,Û”jîÛW¥×P´h‘x€•Åcïˆbãh¼}TŽb,05{@Ú˜ÍFã‹ÓHöþòŒ¡®»ÙÆ°»¼-.ëîŽ&l~e#šº.ò+?E® 2óÇžÖÝU †ûRGlÕ"(lqHÞxœ¯¤`Ž°£äÄ–˜ßö(ìÆZ%ÛÑÄARÂº˜Ù¡;Þ²&©ÿ]YF±ïŠPÊü¤ì›?*V–8ÄÇ ¿mðª¼övIù…£bÄÿŠ4[8þÅ§dÙÕ Í¤ÁLICåèÿ   ÿÿ °2´¯
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import html2canvas from 'html2canvas';

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
import { 
  Users, 
  User as UserIcon,
  BookOpen, 
  Layout, 
  Settings, 
  BarChart3, 
  Search, 
  Filter, 
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
  Image as ImageIcon
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { Navigate, Link, useSearchParams } from 'react-router-dom';
import { sheetsService } from '../services/sheetsService';
import { User, Materi, Content } from '../types';
import LoadingPage from './LoadingPage';
import { cn, safeJsonParse, getDriveDirectLink } from '../lib/utils';
import { codeGsText } from '../services/codeGsText';

export const KWARDA_QABILAH_JATENG = [
  { code: '01', name: 'Kabupaten Banjarnegara' },
  { code: '02', name: 'Kabupaten Banyumas' },
  { code: '03', name: 'Kabupaten Batang' },
  { code: '04', name: 'Kabupaten Blora' },
  { code: '05', name: 'Kabupaten Boyolali' },
  { code: '06', name: 'Kabupaten Brebes' },
  { code: '07', name: 'Kabupaten Cilacap' },
  { code: '08', name: 'Kabupaten Demak' },
  { code: '09', name: 'Kabupaten Grobogan' },
  { code: '10', name: 'Kabupaten Jepara' },
  { code: '11', name: 'Kabupaten Karanganyar' },
  { code: '12', name: 'Kabupaten Kebumen' },
  { code: '13', name: 'Kabupaten Kendal' },
  { code: '14', name: 'Kabupaten Klaten' },
  { code: '15', name: 'Kabupaten Kudus' },
  { code: '16', name: 'Kabupaten Magelang' },
  { code: '17', name: 'Kabupaten Pati' },
  { code: '18', name: 'Kabupaten Pekalongan' },
  { code: '19', name: 'Kabupaten Pemalang' },
  { code: '20', name: 'Kabupaten Purbalingga' },
  { code: '21', name: 'Kabupaten Purworejo' },
  { code: '22', name: 'Kabupaten Rembang' },
  { code: '23', name: 'Kabupaten Semarang' },
  { code: '24', name: 'Kabupaten Sragen' },
  { code: '25', name: 'Kabupaten Sukoharjo' },
  { code: '26', name: 'Kabupaten Tegal' },
  { code: '27', name: 'Kabupaten Temanggung' },
  { code: '28', name: 'Kabupaten Wonogiri' },
  { code: '29', name: 'Kabupaten Wonosobo' },
  { code: '30', name: 'Kota Magelang' },
  { code: '31', name: 'Kota Pekalongan' },
  { code: '32', name: 'Kota Salatiga' },
  { code: '33', name: 'Kota Semarang' },
  { code: '34', name: 'Kota Surakarta' },
  { code: '35', name: 'Kota Tegal' },
  { code: '36', name: 'Universitas Muhammadiyah Surakarta (UMS)' },
  { code: '37', name: 'Universitas Muhammadiyah Magelang (UNIMMA)' },
  { code: '38', name: 'Universitas Muhammadiyah Purwokerto (UMP)' },
  { code: '39', name: 'Universitas Muhammadiyah Purworejo (UMPWR)' },
  { code: '40', name: 'Universitas Muhammadiyah Semarang (UNIMUS)' },
  { code: '41', name: 'Universitas Muhammadiyah Klaten (UMKLA)' },
  { code: '42', name: 'Universitas Muhammadiyah Kudus (UMKU)' },
  { code: '43', name: 'Universitas Aisyiyah Surakarta (AISKA)' },
  { code: '44', name: 'Universitas Muhammadiyah Gombong Kebumen (UNIMUGO)' },
  { code: '45', name: 'Universitas Muhammadiyah Kendal Batang (UMKABA)' },
  { code: '46', name: 'Universitas Muhammadiyah Karanganyar (UMUKA)' },
  { code: '47', name: 'ITS PKU Muhammadiyah Surakarta (ITSPKU)' },
  { code: '48', name: 'STAIM Blora' },
  { code: '49', name: 'STKIP Muhammadiyah Blora (STKIPMUHBLORA)' },
  { code: '50', name: 'STIE Muhammadiyah Cilacap' },
  { code: '51', name: 'Universitas Muhammadiyah Pekajangan Pekalongan (UMPP)' },
  { code: '52', name: 'Universitas Muhammadiyah Brebes (UMBS)' },
  { code: '53', name: 'Akademi Ilmu Statistik dan Bisnis Muhammadiyah Semarang (ITESA)' },
  { code: '54', name: 'Politeknik Muhammadiyah Magelang' },
  { code: '55', name: 'Akkes Muhammadiyah Temanggung' },
  { code: '56', name: 'Institut Tehnologi dan Bisnis (ITB) Muhammadiyah Grobogan' },
  { code: '57', name: 'Stikes Muhammadiyah Wonosobo' },
  { code: '58', name: 'Universitas Muhammadiyah Tegal' }
];

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
  kwarda: 'Admin Kwarda',
  sugli: 'Dewan Sugli',
  jati1: 'Jaya Melati 1',
  jati2: 'Jaya Melati 2',
  jari1: 'Jaya Matahari 1',
  umum: 'Umum'
};

export default function AdminDashboard() {
  const { user, isAuthenticated } = useAuthStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTabState] = useState(searchParams.get('tab') || 'anggota');
  const [searchQuery, setSearchQuery] = useState('');

  const setActiveTab = (tab: string) => {
    setActiveTabState(tab);
    setSearchParams({ tab });
  };

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && tab !== activeTab) {
      setActiveTabState(tab);
    }
  }, [searchParams]);
  const [selectedFilters, setSelectedFilters] = useState<string[]>(['Semua']);
  const [loading, setLoading] = useState(false);
  
  // State for CRUD
  const [members, setMembers] = useState<any[]>([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<any>(null);
  const [formData, setFormData] = useState({
    namaLengkap: '',
    email: '',
    role: 'umum',
    roles: ['umum'] as string[],
    jenisKelamin: 'L',
    golongan: 'Penghela',
    pelatihan: [] as string[],
    pendidikan: 'SMA/SMK/MA',
    asalKwarda: '',
    qabilah: '',
    alamat: '',
    noHp: '',
    sosmed: '',
    password: '',
    isVerified: true,
    upgradeRequests: [] as string[]
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

  const [selectedContentSection, setSelectedContentSection] = useState<string | null>(null);
  const [contents, setContents] = useState<Content[]>([]);
  const [contentList, setContentList] = useState<Content[]>([]);
  const [isContentModalOpen, setIsContentModalOpen] = useState(false);
  const [editingContent, setEditingContent] = useState<Content | null>(null);
  const [contentFormData, setContentFormData] = useState({
    field1: '',
    field2: '',
    field3: '',
    field4: ''
  });

  const [passwordFormData, setPasswordFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState({ type: '', text: '' });
  
  const [settings, setSettings] = useState({
    appName: '',
    orgName: '',
    waConfirmation: '628',
    gSheetApiUrl: typeof window !== 'undefined' ? (localStorage.getItem('VITE_GSHEET_API_URL') || import.meta.env.VITE_GSHEET_API_URL || '') : '',
    lastBackup: '-',
    ktaTemplateFront: 'https://drive.google.com/uc?export=view&id=1OsI7x7zw-2BbckWntz_jkpGZyY94Z-7U',
    ktaTemplateBack: 'https://drive.google.com/uc?export=view&id=1yeEeoE_SlV0npvu681GYKBxxKzuujiz1',
    ktaKetuaNama: 'TAUFIQ',
    ktaKetuaNbm: 'NBM 1015096',
    ktaSekretarisNama: 'MUHAMMAD DZIKRON',
    ktaSekretarisNbm: 'NBM 1029863',
    ktaKotaPenerbit: 'Semarang',
    ktaTandaTanganKetua: '',
    ktaTandaTanganSekretaris: '',
    ktaStempelImage: '',
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
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showAppsScriptGuide, setShowAppsScriptGuide] = useState(false);
  const [copiedScript, setCopiedScript] = useState(false);

  // KTA Management States
  const [ktaApps, setKtaApps] = useState<any[]>([]);
  const [ktaSearchQuery, setKtaSearchQuery] = useState('');
  const [ktaFilterStatus, setKtaFilterStatus] = useState('Semua');
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [activeKtaSubTab, setActiveKtaSubTab] = useState<'stats' | 'kwarda' | 'management' | 'template'>('stats');
  const [editingKtaApp, setEditingKtaApp] = useState<any | null>(null);
  const [isEditKtaModalOpen, setIsEditKtaModalOpen] = useState(false);
  const [previewFlipped, setPreviewFlipped] = useState(false);
  const [isViewKtaModalOpen, setIsViewKtaModalOpen] = useState(false);
  const [viewingKtaApp, setViewingKtaApp] = useState<any | null>(null);
  const [flippedAdmin, setFlippedAdmin] = useState(false);
  const [isGeneratingPdfAdmin, setIsGeneratingPdfAdmin] = useState(false);

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
      
      let qab = '';
      if (isPtma) {
        qab = reg;
      } else {
        qab = app.qabilah || 'Tanpa Qabilah';
      }
      
      if (qab) {
        if (!counts[qab]) {
          counts[qab] = { approved: 0, pending: 0, total: 0 };
        }
        if (app.status === 'approved') counts[qab].approved++;
        else if (app.status === 'pending') counts[qab].pending++;
        counts[qab].total++;
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

  // Training Management States
  const [trainingApps, setTrainingApps] = useState<any[]>([]);
  const [trainingSearchQuery, setTrainingSearchQuery] = useState('');
  const [trainingFilterStatus, setTrainingFilterStatus] = useState('Semua');
  const [trainingRejectId, setTrainingRejectId] = useState<string | null>(null);
  const [trainingRejectReason, setTrainingRejectReason] = useState('');
  const [isTrainingRejectModalOpen, setIsTrainingRejectModalOpen] = useState(false);
  const [trainingSubTab, setTrainingSubTab] = useState<'peserta' | 'presensi' | 'penugasan' | 'penilaian' | 'piagam' | 'pengaturan'>('peserta');

  // Add participant states
  const [isAddParticipantModalOpen, setIsAddParticipantModalOpen] = useState(false);
  const [addParticipantSelectedMemberId, setAddParticipantSelectedMemberId] = useState('');
  const [addParticipantLevel, setAddParticipantLevel] = useState<'Jati 1' | 'Jati 2' | 'Jari 1'>('Jati 1');
  const [addParticipantPelatihGolongan, setAddParticipantPelatihGolongan] = useState('Tunas Athfal');
  const [addParticipantLokasi, setAddParticipantLokasi] = useState('');
  const [addParticipantTanggal, setAddParticipantTanggal] = useState('');
  const [addParticipantSearchQuery, setAddParticipantSearchQuery] = useState('');
  const [isSubmittingAddParticipant, setIsSubmittingAddParticipant] = useState(false);

  // Grading Modal States
  const [isGradingModalOpen, setIsGradingModalOpen] = useState(false);
  const [selectedTrainingApp, setSelectedTrainingApp] = useState<any>(null);
  const [gradeInput, setGradeInput] = useState('');
  const [remarkInput, setRemarkInput] = useState('');
  const [graduationStatusInput, setGraduationStatusInput] = useState('Lulus');
  
  // Inputs for adding location and date settings
  const [newLocationInput, setNewLocationInput] = useState('');
  const [newDateInput, setNewDateInput] = useState('');

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

  const handleAddParticipant = async () => {
    if (!addParticipantSelectedMemberId) {
      alert('Silakan pilih anggota terlebih dahulu.');
      return;
    }
    
    const member = members.find(m => String(m.id) === String(addParticipantSelectedMemberId));
    if (!member) {
      alert('Data anggota tidak ditemukan.');
      return;
    }

    try {
      setIsSubmittingAddParticipant(true);
      
      const payload = {
        userId: member.id,
        nama: member.namaLengkap,
        noWa: member.noHp || '',
        email: member.email || '',
        sosmed: member.sosmed || '',
        tingkatan: member.golongan || 'Pengenal',
        pelatihGolongan: addParticipantPelatihGolongan,
        asalDaerah: member.asalKwarda || '',
        pelatihanAkanDiikuti: addParticipantLevel,
        lokasiPelatihan: addParticipantLokasi || (Array.isArray(settings.trainingLocations) && settings.trainingLocations[0]) || '',
        tanggalPelatihan: addParticipantTanggal || (Array.isArray(settings.trainingDates) && settings.trainingDates[0]) || '',
        nik: member.nik || '',
        tempatLahir: member.tempatLahir || '',
        tanggalLahir: member.tanggalLahir || '',
        jenisKelamin: member.jenisKelamin || 'L',
        qabilah: member.qabilah || '',
        photo: member.photo || '',
        agreeChecked: true
      };

      const res = await sheetsService.applyTraining(payload);
      if (res.success || res.application) {
        alert('Berhasil mendaftarkan peserta ke pelatihan!');
        setIsAddParticipantModalOpen(false);
        setAddParticipantSelectedMemberId('');
        // Reload training applications
        const tData = await sheetsService.getTrainingApplications();
        setTrainingApps(tData || []);
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
      setLoading(true);
      const res = await sheetsService.updateKTAStatus(appId, 'approved');
      if (res.success || res.application) {
        alert('Pengajuan KTA berhasil disetujui!');
        const [ktaData, membersData] = await Promise.all([
          sheetsService.getKTAApplications(),
          sheetsService.getMembers()
        ]);
        setKtaApps(ktaData || []);
        setMembers(membersData || []);
      } else {
        alert('Gagal menyetujui KTA : ' + (res.message || 'Respons tidak valid'));
      }
    } catch (e: any) {
      console.error(e);
      alert('Gagal menyetujui KTA: ' + (e.message || 'Cek koneksi'));
    } finally {
      setLoading(false);
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
      setLoading(true);
      const res = await sheetsService.updateKTAStatus(rejectId, 'rejected', undefined, rejectReason);
      if (res.success || res.application) {
        alert('Pengajuan KTA berhasil ditolak.');
        setIsRejectModalOpen(false);
        setRejectId(null);
        setRejectReason('');
        const ktaData = await sheetsService.getKTAApplications();
        setKtaApps(ktaData || []);
      } else {
        alert('Gagal menolak KTA: ' + (res.message || 'Respons tidak valid'));
      }
    } catch (e: any) {
      console.error(e);
      alert('Gagal menolak KTA: ' + (e.message || 'Cek koneksi'));
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEditKTA = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingKtaApp) return;
    try {
      setLoading(true);
      const res = await sheetsService.saveKTAApplication(editingKtaApp);
      if (res.success || res.application) {
        alert('Data KTA berhasil diperbarui!');
        setIsEditKtaModalOpen(false);
        setEditingKtaApp(null);
        const ktaData = await sheetsService.getKTAApplications();
        setKtaApps(ktaData || []);
      } else {
        alert('Gagal memperbarui data KTA: ' + (res.message || 'Respons tidak valid'));
      }
    } catch (err: any) {
      console.error(err);
      alert('Gagal memperbarui data KTA: ' + (err.message || 'Cek koneksi'));
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDFAdmin = async () => {
    if (!viewingKtaApp || isGeneratingPdfAdmin) return;
    setIsGeneratingPdfAdmin(true);
    try {
      const frontEl = document.getElementById('kta-front-capture-admin');
      const backEl = document.getElementById('kta-back-capture-admin');
      
      if (!frontEl || !backEl) {
        throw new Error("Elemen kartu tidak ditemukan");
      }

      // Capture front card
      const frontCanvas = await html2canvas(frontEl, {
        scale: 3, // high quality
        useCORS: true,
        allowTaint: true,
        backgroundColor: null
      });

      // Capture back card
      const backCanvas = await html2canvas(backEl, {
        scale: 3, // high quality
        useCORS: true,
        allowTaint: true,
        backgroundColor: null
      });

      const frontImgData = frontCanvas.toDataURL('image/png');
      const backImgData = backCanvas.toDataURL('image/png');

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // Add a beautiful title and instructions to the PDF page!
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(16);
      pdf.setTextColor(15, 118, 110); // hw-green color
      pdf.text('KARTU TANDA ANGGOTA DIGITAL', 105, 25, { align: 'center' });
      
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      pdf.setTextColor(100, 116, 139);
      pdf.text('Gerakan Kepanduan Hizbul Wathan Jawa Tengah', 105, 31, { align: 'center' });
      
      // Draw a decorative divider line
      pdf.setDrawColor(226, 232, 240);
      pdf.setLineWidth(0.5);
      pdf.line(20, 36, 190, 36);

      // Let's put Front Card
      const cardWidth = 95; // slightly larger for readability
      const cardHeight = 60;
      const xPos = (210 - cardWidth) / 2; // centered
      
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(9);
      pdf.setTextColor(71, 85, 105);
      pdf.text('TAMPILAN DEPAN (FRONT)', 105, 46, { align: 'center' });
      pdf.addImage(frontImgData, 'PNG', xPos, 50, cardWidth, cardHeight);

      // Let's put Back Card
      pdf.text('TAMPILAN BELAKANG (BACK)', 105, 126, { align: 'center' });
      pdf.addImage(backImgData, 'PNG', xPos, 130, cardWidth, cardHeight);

      // Footer instructions on PDF
      pdf.setFont('helvetica', 'italic');
      pdf.setFontSize(8);
      pdf.setTextColor(148, 163, 184);
      pdf.text('Gunakan kertas tebal (Art Paper / PVC Card) untuk mencetak kartu fisik resmi.', 105, 205, { align: 'center' });
      pdf.text('Validasi KTA dapat dilakukan dengan memindai QR Code di bagian belakang kartu.', 105, 210, { align: 'center' });
      
      // Draw signature placeholder or stamp info at the bottom
      pdf.setDrawColor(241, 245, 249);
      pdf.setFillColor(248, 250, 252);
      pdf.roundedRect(20, 225, 170, 30, 4, 4, 'FD');
      
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(8);
      pdf.setTextColor(71, 85, 105);
      pdf.text('INFORMASI PENTING:', 25, 232);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(7.5);
      pdf.text('1. Kartu Tanda Anggota (KTA) ini merupakan identitas resmi anggota Gerakan Kepanduan Hizbul Wathan.', 25, 237);
      pdf.text('2. Jagalah kerahasiaan nomor KTA Anda dan laporkan ke admin Kwarda jika ada ketidaksesuaian data.', 25, 242);
      pdf.text('3. QR Code di bagian belakang kartu berfungsi untuk verifikasi status keanggotaan aktif Anda secara real-time.', 25, 247);

      pdf.save(`KTA_HW_${(viewingKtaApp?.nama || 'Anggota').replace(/\s+/g, '_')}.pdf`);
    } catch (err: any) {
      console.error('Error generating PDF:', err);
      alert('Gagal mengunduh KTA PDF. Silakan coba kembali.');
    } finally {
      setIsGeneratingPdfAdmin(false);
    }
  };

  // Training App Handlers
  const handleApproveTraining = async (appId: string) => {
    try {
      setLoading(true);
      const res = await sheetsService.updateTrainingStatus(appId, 'approved');
      if (res.success || res.application) {
        alert('Pendaftaran pelatihan berhasil disetujui!');
        const [tApps, mData] = await Promise.all([
          sheetsService.getTrainingApplications(),
          sheetsService.getMembers()
        ]);
        setTrainingApps(tApps || []);
        setMembers(mData || []);
      } else {
        alert('Gagal menyetujui pendaftaran: ' + (res.message || 'Respons tidak valid'));
      }
    } catch (e: any) {
      console.error(e);
      alert('Gagal menyetujui pendaftaran: ' + (e.message || 'Cek koneksi'));
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSchedule = async (appId: string) => {
    try {
      setLoading(true);
      const res = await sheetsService.updateTrainingSchedule(appId, editLokasi, editTanggal);
      if (res.success || res.application) {
        alert('Jadwal dan lokasi pelatihan berhasil diperbarui!');
        setEditingScheduleAppId(null);
        const tApps = await sheetsService.getTrainingApplications();
        setTrainingApps(tApps || []);
      } else {
        alert('Gagal memperbarui jadwal: ' + (res.message || 'Respons tidak valid'));
      }
    } catch (e: any) {
      console.error(e);
      alert('Gagal memperbarui jadwal: ' + (e.message || 'Cek koneksi'));
    } finally {
      setLoading(false);
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
      setLoading(true);
      const res = await sheetsService.updateTrainingStatus(trainingRejectId, 'rejected', undefined, trainingRejectReason);
      if (res.success || res.application) {
        alert('Pendaftaran pelatihan berhasil ditolak.');
        setIsTrainingRejectModalOpen(false);
        setTrainingRejectId(null);
        setTrainingRejectReason('');
        const tApps = await sheetsService.getTrainingApplications();
        setTrainingApps(tApps || []);
      } else {
        alert('Gagal menolak pendaftaran: ' + (res.message || 'Respons tidak valid'));
      }
    } catch (e: any) {
      console.error(e);
      alert('Gagal menolak pendaftaran: ' + (e.message || 'Cek koneksi'));
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
      
      let attObj: Record<string, boolean> = {};
      if (app.kehadiran) {
        attObj = safeJsonParse<Record<string, boolean>>(app.kehadiran, {});
      }
      
      const updatedAttObj = {
        ...attObj,
        [dayKey]: isPresent
      };
      
      const kehadiranStr = JSON.stringify(updatedAttObj);
      
      await sheetsService.updateAttendance(appId, kehadiranStr);
      const updated = await sheetsService.getTrainingApplications();
      setTrainingApps(updated || []);
    } catch (err: any) {
      alert('Gagal update kehadiran: ' + err.message);
    }
  };

  const getCalculatedGrading = (app: any) => {
    const progCatMap: Record<string, string> = {
      'Jati 1': 'jati1',
      'Jati 2': 'jati2',
      'Jari 1': 'jari1'
    };
    const cat = progCatMap[app.pelatihanAkanDiikuti] || 'jati1';
    const progMaterials = materiList.filter(m => m.kategori === cat);
    const sessions = progMaterials.length > 0 
      ? progMaterials.map(m => m.judul) 
      : ['Sesi 1', 'Sesi 2', 'Sesi 3'];

    let attObj: Record<string, boolean> = {};
    if (app.kehadiran) {
      attObj = safeJsonParse<Record<string, boolean>>(app.kehadiran, {});
    }
    const totalSessions = sessions.length;
    const attendedSessions = sessions.filter(sesi => !!attObj[sesi]).length;
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
        statusKelulusan: graduationStatusInput
      });
      alert('Nilai, ulasan & status kelulusan berhasil disimpan!');
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

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [materi, membersData, contentsData, settingsData, ktaData, trainingData] = await Promise.all([
          sheetsService.getMateri('admin'),
          sheetsService.getMembers(),
          sheetsService.getContents(),
          sheetsService.getSettings(),
          sheetsService.getKTAApplications(),
          sheetsService.getTrainingApplications()
        ]);
        setMateriList(materi || []);
        setMembers(membersData || []);
        setContents(contentsData || []);
        setKtaApps(ktaData || []);
        setTrainingApps(trainingData || []);
        if (settingsData) {
          setSettings(prev => ({
            ...prev,
            ...settingsData,
            gSheetApiUrl: prev.gSheetApiUrl,
            trainingLocations: Array.isArray(settingsData.trainingLocations) ? settingsData.trainingLocations : [],
            trainingDates: Array.isArray(settingsData.trainingDates) ? settingsData.trainingDates : [],
            assignedTasks: Array.isArray(settingsData.assignedTasks) 
              ? settingsData.assignedTasks 
              : safeJsonParse<any[]>(settingsData.assignedTasks, [])
          }));
        }
      } finally {
        setLoading(false);
      }
    };
    fetchData();
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
      setContentFormData({
        field1: content.field1 || '',
        field2: content.field2 || '',
        field3: content.field3 || '',
        field4: content.field4 || ''
      });
    } else {
      setEditingContent(null);
      setContentFormData({
        field1: '',
        field2: '',
        field3: '',
        field4: ''
      });
    }
    setIsContentModalOpen(true);
  };

    const handleSaveContent = async () => {
      if (!selectedContentSection) return;
      
      // Simple validation for list types
      if (['galeri', 'doa', 'playlist'].includes(selectedContentSection)) {
        if (selectedContentSection === 'galeri' && !contentFormData.field1) {
          alert('URL Video Youtube harus diisi');
          return;
        }
        if (selectedContentSection === 'playlist' && !contentFormData.field1) {
          alert('Link File Audio (Drive/URL) harus diisi');
          return;
        }
        if ((selectedContentSection === 'doa' || selectedContentSection === 'playlist') && !contentFormData.field2) {
          alert('Judul harus diisi');
          return;
        }
      }
      
      try {
        setLoading(true);
        const isList = ['galeri', 'doa', 'playlist'].includes(selectedContentSection);
      
      const payload: any = {
        section: selectedContentSection,
        type: isList ? 'list' : 'single',
        field1: contentFormData.field1,
        field2: contentFormData.field2,
        field3: contentFormData.field3,
        field4: contentFormData.field4
      };

      if (editingContent) {
        payload.id = editingContent.id;
      } else {
        // For single types, check if we already have one
        if (!isList && contentList.length > 0) {
          payload.id = contentList[0].id;
        } else {
          payload.id = Date.now().toString();
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
        field4: ''
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
      
      const pelatihanArr = Array.isArray(member.pelatihan) ? member.pelatihan : [];
      const rolesArr = Array.isArray(member.roles) ? member.roles : (member.role ? [member.role] : ['umum']);

      setFormData({
        email: member.email || '',
        namaLengkap: member.namaLengkap,
        role: member.role || (rolesArr[0] || 'umum'),
        roles: rolesArr,
        jenisKelamin: member.jenisKelamin,
        golongan: member.golongan,
        pelatihan: pelatihanArr,
        pendidikan: member.pendidikan || 'SMA/SMK/MA',
        asalKwarda: member.asalKwarda,
        qabilah: member.qabilah || '',
        alamat: member.alamat || '',
        noHp: member.noHp || '',
        sosmed: member.sosmed || '',
        password: '', // Always empty when opening for security, only update if typed
        isVerified: member.isVerified,
        upgradeRequests: Array.isArray(member.upgradeRequests) ? member.upgradeRequests : []
      });
    } else {
      setEditingMember(null);
      setFormData({
        email: '',
        namaLengkap: '',
        role: defaultRole,
        roles: [defaultRole],
        jenisKelamin: 'L',
        golongan: 'Penghela',
        pelatihan: [],
        pendidikan: 'SMA/SMK/MA',
        asalKwarda: '',
        qabilah: '',
        alamat: '',
        noHp: '',
        sosmed: '',
        password: '',
        isVerified: true,
        upgradeRequests: []
      });
    }
    setIsModalOpen(true);
  };

  const handleSaveMember = async () => {
    try {
      setLoading(true);
      const payload = editingMember 
        ? { ...editingMember, ...formData }
        : { ...formData, id: Date.now().toString() };
      
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

      const res = await sheetsService.saveMember(payload);
      if (res.error) {
        throw new Error(res.error);
      }
      
      // Refresh list
      const data = await sheetsService.getMembers();
      setMembers(data);
      setIsModalOpen(false);
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
      const updated = { ...member, isVerified: !member.isVerified };
      await sheetsService.saveMember(updated);
      setMembers(members.map(m => m.id === id ? updated : m));
    } catch (error) {
      alert('Gagal mengubah status verifikasi');
    }
  };

  // Simple RBAC check
  if (!isAuthenticated || (user?.role !== 'admin' && user?.role !== 'superadmin')) {
    return <Navigate to="/" />;
  }

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
        localStorage.setItem('hw_settings', JSON.stringify(updatedSettings));
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

    doc.autoTable({
      head: headers,
      body: data,
      startY: 35,
      theme: 'grid',
      styles: { fontSize: 8 },
      headStyles: { fillStyle: '#1a413d' }
    });

    const filterName = selectedFilters.join('_').replace(/\s+/g, '');
    doc.save(`Data_HW_${filterName}.pdf`);
  };

  const filteredMembers = members.filter(m => {
    const matchesSearch = (m.namaLengkap.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.asalKwarda.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const isInternal = m.role === 'superadmin' || m.role === 'admin';
    if (isInternal) return false;

    if (selectedFilters.includes('Semua') || selectedFilters.length === 0) return matchesSearch;
    
    return matchesSearch && selectedFilters.some(filter => {
      if (filter === 'Laki-laki') return m.jenisKelamin === 'L';
      if (filter === 'Perempuan') return m.jenisKelamin === 'P';
      if (filter === 'Athfal') return (m.golongan === 'Athfal' || m.golongan === 'Tunas Athfal');
      if (filter === 'Pengenal') return m.golongan === 'Pengenal';
      if (filter === 'Penghela') return m.golongan === 'Penghela';
      if (filter === 'Penuntun') return m.golongan === 'Penuntun';
      if (filter === 'Dewan Sugli') return (m.role === 'sugli' || m.role === 'sugli_daerah' || m.role === 'sugli_wilayah');
      if (filter === 'Kwarda') return (m.role === 'kwarda' || m.role === 'admin_kwarda');
      
      if (filter === 'Jaya Melati 1') {
        const p = Array.isArray(m.pelatihan) ? m.pelatihan : [];
        return p.includes('Jati 1');
      }
      if (filter === 'Jaya Melati 2') {
        const p = Array.isArray(m.pelatihan) ? m.pelatihan : [];
        return p.includes('Jati 2');
      }
      if (filter === 'Jaya Matahari 1') {
        const p = Array.isArray(m.pelatihan) ? m.pelatihan : [];
        return p.includes('Jari 1');
      }
      return false;
    });
  });

  const stats = {
    total: members.filter(m => m.role !== 'superadmin' && m.role !== 'admin').length,
    laki: members.filter(m => m.jenisKelamin === 'L' && m.role !== 'superadmin' && m.role !== 'admin').length,
    perempuan: members.filter(m => m.jenisKelamin === 'P' && m.role !== 'superadmin' && m.role !== 'admin').length,
    verified: members.filter(m => m.isVerified && m.role !== 'superadmin' && m.role !== 'admin').length,
    athfal: members.filter(m => (m.golongan === 'Athfal' || m.golongan === 'Tunas Athfal') && m.role !== 'superadmin' && m.role !== 'admin').length,
    pengenal: members.filter(m => m.golongan === 'Pengenal' && m.role !== 'superadmin' && m.role !== 'admin').length,
    penghela: members.filter(m => m.golongan === 'Penghela' && m.role !== 'superadmin' && m.role !== 'admin').length,
    penuntun: members.filter(m => m.golongan === 'Penuntun' && m.role !== 'superadmin' && m.role !== 'admin').length,
    sugli: members.filter(m => (m.role === 'sugli' || m.role === 'sugli_daerah' || m.role === 'sugli_wilayah') && m.role !== 'superadmin' && m.role !== 'admin').length,
    kwarda: members.filter(m => (m.role === 'kwarda' || m.role === 'admin_kwarda') && m.role !== 'superadmin' && m.role !== 'admin').length,
    jm1: members.filter(m => {
      if (m.role === 'superadmin' || m.role === 'admin') return false;
      const p = Array.isArray(m.pelatihan) ? m.pelatihan : [];
      return p.includes('Jati 1');
    }).length,
    jm2: members.filter(m => {
      if (m.role === 'superadmin' || m.role === 'admin') return false;
      const p = Array.isArray(m.pelatihan) ? m.pelatihan : [];
      return p.includes('Jati 2');
    }).length,
    jm3: members.filter(m => {
      if (m.role === 'superadmin' || m.role === 'admin') return false;
      const p = Array.isArray(m.pelatihan) ? m.pelatihan : [];
      return p.includes('Jari 1');
    }).length
  };

  const membersWithUpgradeRequests = members.filter(m => m.upgradeRequests && m.upgradeRequests.length > 0);

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
            <h2 className="text-xl font-display font-black text-gray-800 tracking-tight">Dashboard Admin</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="px-2 py-0.5 bg-hw-green/10 text-hw-green text-[9px] font-black uppercase rounded-lg tracking-wider">
                {user?.role}
              </span>
              <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                Gerakan Kepanduan HW
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {membersWithUpgradeRequests.length > 0 && (
            <button 
              onClick={() => setIsUpgradeModalOpen(true)}
              className="relative p-3 text-hw-blue bg-hw-blue/10 rounded-xl hover:bg-hw-blue/20 transition-all"
            >
              <Bell size={20} />
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white">
                {membersWithUpgradeRequests.length}
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

      {/* Stats Section */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Anggota" value={stats.total} icon={Users} color="bg-hw-blue" subValue={`${stats.laki} L / ${stats.perempuan} P`} />
        <StatCard label="Terverifikasi" value={stats.verified} icon={CheckCircle} color="bg-hw-green" subValue={`${Math.round((stats.verified/stats.total)*100)}% dari total`} />
        <StatCard label="Total Materi" value={materiList.length} icon={BookOpen} color="bg-hw-dark" subValue="Aktif di aplikasi" />
        <StatCard label="Admin Aktif" value={members.filter(m => m.role === 'admin' || m.role === 'superadmin').length} icon={Shield} color="bg-orange-500" subValue="Super & Petugas" />
      </div>

      {/* Detailed Stats Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-2">
          <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Detail Demografi & Pelatihan</h3>
          <span className="text-[10px] font-bold text-hw-dark/50">Klik kartu untuk melihat data anggota</span>
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

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 pb-4 sticky top-0 bg-gray-50 z-10 -mx-4 px-4 pt-2">
        {[
          { id: 'anggota', label: 'Anggota', icon: Users },
          { id: 'kta', label: 'Kelola KTA', icon: CreditCard },
          { id: 'pelatihan', label: 'Kelola Pelatihan', icon: GraduationCap },
          { id: 'materi', label: 'Materi', icon: BookOpen },
          { id: 'konten', label: 'Konten', icon: Layout },
          user?.role === 'superadmin' && { id: 'admin', label: 'Admin', icon: Shield },
          user?.role === 'superadmin' && { id: 'pengaturan', label: 'Pengaturan', icon: Settings },
          { id: 'akun', label: 'Akun Saya', icon: Users }
        ].filter(Boolean).map((tab: any) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-5 py-3.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === tab.id 
              ? 'bg-hw-dark text-white shadow-xl shadow-hw-dark/10 ring-4 ring-hw-dark/10' 
              : 'bg-white text-gray-500 border border-gray-100 hover:border-gray-200'
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
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
              <div className="p-6 border-b border-gray-50 bg-gray-50/30 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex flex-col gap-1 flex-1 min-w-[200px]">
                    <div className="relative">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                      <input 
                        type="text" 
                        placeholder="Cari nama atau kwarda..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-white border border-gray-100 focus:ring-4 focus:ring-hw-green/10 focus:border-hw-green rounded-2xl py-3 pl-12 pr-4 text-xs font-medium" 
                      />
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
                  <div className="flex items-center gap-2">
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
                  {['Semua', 'Laki-laki', 'Perempuan', 'Athfal', 'Pengenal', 'Penghela', 'Penuntun', 'Dewan Sugli', 'Kwarda', 'Jaya Melati 1', 'Jaya Melati 2', 'Jaya Matahari 1'].map((f) => {
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
                    {filteredMembers.map((row, i) => (
                      <tr key={`member-${row.id}-${i}`} className="hover:bg-gray-50/50 transition-colors">
                        <td className="p-5">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400 font-bold text-xs">
                              {row.namaLengkap.charAt(0)}
                            </div>
                            <div className="flex flex-col">
                              <span className="text-sm font-bold text-gray-800">{row.namaLengkap}</span>
                              <span className="text-[10px] text-gray-400 font-medium">{row.asalKwarda}, {row.jenisKelamin === 'L' ? 'Laki-laki' : 'Perempuan'}</span>
                              {row.upgradeRequests && row.upgradeRequests.length > 0 && (
                                <span className="flex items-center gap-1 mt-1 text-[8px] font-black text-rose-500 uppercase tracking-tighter bg-rose-50 px-1.5 py-0.5 rounded-md border border-rose-100 w-fit">
                                  <ArrowUpRight size={8} /> Permohonan: {row.upgradeRequests.join(', ')}
                                </span>
                              )}
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
                            {Array.isArray(row.roles) ? row.roles.map((r: string, idx: number) => (
                              <span key={`${row.id}-role-${r}-${idx}`} className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-wider ${
                                r === 'superadmin' || r === 'admin' ? 'bg-red-100 text-red-600' :
                                r === 'sugli' ? 'bg-orange-100 text-orange-600' :
                                r === 'kwarda' ? 'bg-blue-100 text-blue-600' :
                                r.startsWith('ja') ? 'bg-hw-green/10 text-hw-green' :
                                'bg-gray-100 text-gray-600'
                              }`}>
                                {ROLE_LABELS[r] || r}
                              </span>
                            )) : (
                              <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-wider ${
                                row.role === 'superadmin' || row.role === 'admin' ? 'bg-red-100 text-red-600' :
                                row.role === 'sugli' ? 'bg-orange-100 text-orange-600' :
                                row.role === 'kwarda' ? 'bg-blue-100 text-blue-600' :
                                row.role.startsWith('ja') ? 'bg-hw-green/10 text-hw-green' :
                                'bg-gray-100 text-gray-600'
                              }`}>
                                {ROLE_LABELS[row.role] || row.role}
                              </span>
                            )}
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
                    ))}
                  </tbody>
                </table>
              </div>
              
              <div className="p-6 border-t border-gray-50 flex items-center justify-between text-gray-400 bg-gray-50/20">
                <span className="text-[10px] font-bold">Menampilkan {filteredMembers.length} dari {members.length} anggota</span>
                <div className="flex gap-2">
                  <button className="px-4 py-2 rounded-xl text-[10px] font-black border border-gray-200 hover:bg-white transition-all disabled:opacity-50">Prev</button>
                  <button className="px-4 py-2 rounded-xl text-[10px] font-black bg-hw-dark text-white shadow-lg shadow-hw-dark/20">1</button>
                  <button className="px-4 py-2 rounded-xl text-[10px] font-black border border-gray-200 hover:bg-white transition-all">Next</button>
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
                  {['semua', 'umum', 'jati1', 'jati2', 'jari1', 'sugli', 'kwarda'].map((k) => (
                    <button
                      key={k}
                      onClick={() => setMateriFilter(k)}
                      className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all whitespace-nowrap ${
                        materiFilter === k 
                        ? 'bg-hw-green text-white shadow-lg shadow-hw-green/20' 
                        : 'bg-white text-gray-400 border border-gray-100 hover:border-gray-200'
                      }`}
                    >
                      {k === 'semua' ? 'Semua' : (k === 'jati1' ? 'Jati 1' : k === 'jati2' ? 'Jati 2' : k === 'jari1' ? 'Jari 1' : k)}
                    </button>
                  ))}
                </div>

                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input 
                    type="text" 
                    placeholder="Cari judul materi..." 
                    value={materiSearch}
                    onChange={(e) => setMateriSearch(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-100 focus:ring-4 focus:ring-hw-green/10 focus:border-hw-green rounded-2xl py-3 pl-12 pr-4 text-xs font-medium" 
                  />
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
                  <img src={m.coverImage} alt={m.judul} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 bg-hw-green/10 text-hw-green text-[8px] font-black uppercase rounded-lg">
                          {m.kategori === 'jati1' ? 'Jati 1' : m.kategori === 'jati2' ? 'Jati 2' : m.kategori === 'jari1' ? 'Jari 1' : m.kategori}
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
                      { id: 'doa', label: 'Daftar Doa', icon: Heart, desc: 'Kelola kumpulan doa' },
                      { id: 'kontak', label: 'Info Kontak', icon: Phone, desc: 'Update info qabilah' }
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
    {['galeri', 'doa', 'playlist'].includes(selectedContentSection) && (
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
          {['galeri', 'doa', 'playlist'].includes(selectedContentSection) && (
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
                             {['profil', 'sosmed', 'kontak'].includes(selectedContentSection) && (
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
                             {!['profil', 'sosmed', 'kontak'].includes(selectedContentSection) && (
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
                                    {selectedContentSection === 'galeri' ? (item.field2 || 'Video Youtube') : (item.field2 || item.field1 || item.section)}
                                  </h4>
                                  <p className="text-[9px] text-gray-400 truncate font-black tracking-widest uppercase">{item.field1 || item.section}</p>
                                </div>
                  <div className="flex gap-1">
                    <button 
                      onClick={() => handleOpenContentModal(item)}
                      className="p-2 text-gray-400 hover:text-hw-green transition-colors"
                    ><Edit2 size={16} /></button>
                    {['galeri', 'doa', 'playlist'].includes(selectedContentSection) && (
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
            <div className="p-8">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-lg font-display font-black text-gray-800">Manajemen Admin</h3>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Kelola hak akses administrator</p>
                </div>
                <button 
                  onClick={() => handleOpenModal(null, 'admin')}
                  className="px-5 py-3 bg-red-600 text-white rounded-2xl shadow-lg shadow-red-600/20 flex items-center gap-2 text-xs font-bold hover:scale-105 active:scale-95 transition-all"
                >
                  <Plus size={16} /> Tambah Staff Admin
                </button>
              </div>

              <div className="space-y-4">
                {members
                  .filter(m => m.role === 'admin' || m.role === 'superadmin' || m.role === 'kwarda' || m.role === 'admin_kwarda')
                  .map((adm, idx) => (
                    <div key={`admin-row-${adm.id || idx}`} className="flex items-center justify-between p-5 bg-gray-50 rounded-3xl border border-gray-100 group hover:bg-white hover:shadow-xl transition-all">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-hw-dark font-black">
                          {adm.namaLengkap?.charAt(0) || 'A'}
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-gray-800">{adm.namaLengkap}</h4>
                          <p className="text-xs text-gray-500">{adm.email || 'Tanpa Email'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 text-[9px] font-black uppercase rounded-lg tracking-widest ${
                          adm.role === 'superadmin' ? 'bg-red-600 text-white' : 
                          adm.role === 'admin' ? 'bg-hw-dark text-white' : 
                          'bg-blue-100 text-blue-600'
                        }`}>
                          {Array.isArray(adm.roles) ? adm.roles.map((r: string) => ROLE_LABELS[r] || r).join(', ') : (ROLE_LABELS[adm.role] || adm.role)}
                        </span>
                        <div className="flex gap-1">
                          <button 
                            onClick={() => handleOpenModal(adm)}
                            className="p-2 text-gray-400 hover:text-hw-green transition-colors"
                          >
                            <Edit2 size={18} />
                          </button>
                          {adm.id !== user?.id && (
                            <button 
                              onClick={() => handleDeleteMember(adm.id)}
                              className="p-2 text-gray-400 hover:text-red-500 transition-colors"
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
            <div className="p-8 space-y-10">
              {/* App Names */}
              <div className="space-y-4">
                <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">Identitas Aplikasi</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-500 ml-1">Nama Aplikasi</label>
                    <input 
                      type="text" 
                      value={settings.appName} 
                      onChange={(e) => setSettings({...settings, appName: e.target.value})}
                      className="w-full bg-gray-50 border-gray-100 focus:ring-hw-green/20 rounded-2xl px-4 py-3 text-xs font-bold" 
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-500 ml-1">Nama Organisasi</label>
                    <input 
                      type="text" 
                      value={settings.orgName} 
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
                            value={fee.value} 
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
                            value={fee.note} 
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
                            alert('Database berhasil disinkronkan!');
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
                          <button 
                            onClick={() => {
                              navigator.clipboard.writeText(codeGsText);
                              setCopiedScript(true);
                              setTimeout(() => setCopiedScript(false), 2000);
                            }}
                            className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 bg-white px-3 py-1.5 rounded-xl border border-emerald-500/20"
                          >
                            {copiedScript ? <><Check size={14} /> Tersalin!</> : <><Copy size={14} /> Salin Kode</>}
                          </button>
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
                </div>

                {/* Sub-tabs switcher */}
                <div className="flex border-b border-gray-150 gap-2 overflow-x-auto pt-2">
                  <button 
                    onClick={() => setActiveKtaSubTab('stats')}
                    className={`px-4 py-2.5 text-xs font-black border-b-2 transition-all whitespace-nowrap uppercase tracking-wider ${
                      activeKtaSubTab === 'stats'
                      ? 'border-hw-green text-hw-green'
                      : 'border-transparent text-gray-400 hover:text-gray-700'
                    }`}
                  >
                    1. Statistik KTA
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
                    onClick={() => setActiveKtaSubTab('management')}
                    className={`px-4 py-2.5 text-xs font-black border-b-2 transition-all whitespace-nowrap uppercase tracking-wider ${
                      activeKtaSubTab === 'management'
                      ? 'border-hw-green text-hw-green'
                      : 'border-transparent text-gray-400 hover:text-gray-700'
                    }`}
                  >
                    3. Manajemen KTA HW
                  </button>
                  <button 
                    onClick={() => setActiveKtaSubTab('template')}
                    className={`px-4 py-2.5 text-xs font-black border-b-2 transition-all whitespace-nowrap uppercase tracking-wider ${
                      activeKtaSubTab === 'template'
                      ? 'border-hw-green text-hw-green'
                      : 'border-transparent text-gray-400 hover:text-gray-700'
                    }`}
                  >
                    4. Template KTA
                  </button>
                </div>
              </div>

              {/* Sub-tab content 1: Statistik KTA */}
              {activeKtaSubTab === 'stats' && (
                <div className="p-6 space-y-6">
                  {/* Grid metrics */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-yellow-50/55 p-5 rounded-3xl border border-yellow-100 flex flex-col justify-between">
                      <span className="text-[10px] font-bold text-yellow-600 uppercase tracking-widest">Pending (Menunggu)</span>
                      <span className="text-3xl font-black text-yellow-700 mt-2">{ktaApps.filter(k => k.status === 'pending').length}</span>
                    </div>
                    <div className="bg-green-50/55 p-5 rounded-3xl border border-green-100 flex flex-col justify-between">
                      <span className="text-[10px] font-bold text-green-600 uppercase tracking-widest">Approved (Disetujui)</span>
                      <span className="text-3xl font-black text-green-700 mt-2">{ktaApps.filter(k => k.status === 'approved').length}</span>
                    </div>
                    <div className="bg-blue-50/55 p-5 rounded-3xl border border-blue-100 flex flex-col justify-between">
                      <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">KTA Digital</span>
                      <span className="text-3xl font-black text-blue-700 mt-2">
                        {ktaApps.filter(k => k.status === 'approved' && (k.jenisKta === 'Digital' || !k.jenisKta)).length}
                      </span>
                    </div>
                    <div className="bg-indigo-50/55 p-5 rounded-3xl border border-indigo-100 flex flex-col justify-between">
                      <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">KTA Fisik</span>
                      <span className="text-3xl font-black text-indigo-700 mt-2">
                        {ktaApps.filter(k => k.status === 'approved' && k.jenisKta === 'Fisik').length}
                      </span>
                    </div>
                  </div>

                  {/* Visual breakdowns */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Tingkatan HW Breakdown */}
                    <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm space-y-4">
                      <div className="flex items-center gap-2 pb-2 border-b border-gray-50">
                        <Award size={16} className="text-hw-green" />
                        <h4 className="text-xs font-black text-gray-800 uppercase tracking-wider font-display">Statistik Tingkatan HW</h4>
                      </div>
                      <div className="space-y-3.5 text-xs font-bold text-gray-700">
                        {['Tunas Athfal', 'Athfal', 'Pengenal', 'Penghela', 'Penuntun', 'Dewasa'].map((tingkatan) => {
                          const count = ktaApps.filter(k => k.tingkatan === tingkatan).length;
                          const approved = ktaApps.filter(k => k.tingkatan === tingkatan && k.status === 'approved').length;
                          const pending = ktaApps.filter(k => k.tingkatan === tingkatan && k.status === 'pending').length;
                          const maxCount = Math.max(...['Tunas Athfal', 'Athfal', 'Pengenal', 'Penghela', 'Penuntun', 'Dewasa'].map(t => ktaApps.filter(k => k.tingkatan === t).length), 1);
                          return (
                            <div key={tingkatan} className="space-y-1">
                              <div className="flex justify-between items-center text-[11px]">
                                <span className="text-gray-800 font-extrabold">{tingkatan}</span>
                                <span className="text-gray-400 font-mono">{count} total <span className="text-green-600">({approved} approved)</span></span>
                              </div>
                              <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden flex">
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

                    {/* General Summary */}
                    <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm space-y-4 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-2 pb-2 border-b border-gray-50 mb-3">
                          <Users size={16} className="text-hw-green" />
                          <h4 className="text-xs font-black text-gray-800 uppercase tracking-wider font-display">Ringkasan Pengajuan</h4>
                        </div>
                        <div className="divide-y divide-gray-50 text-xs font-bold text-gray-600">
                          <div className="py-2.5 flex justify-between">
                            <span>Total Pengajuan Masuk</span>
                            <span className="text-gray-850 font-black">{ktaApps.length}</span>
                          </div>
                          <div className="py-2.5 flex justify-between">
                            <span>Menunggu Persetujuan (Pending)</span>
                            <span className="text-yellow-600 font-black">{ktaApps.filter(k => k.status === 'pending').length}</span>
                          </div>
                          <div className="py-2.5 flex justify-between">
                            <span>Telah Disetujui (Approved)</span>
                            <span className="text-green-600 font-black">{ktaApps.filter(k => k.status === 'approved').length}</span>
                          </div>
                          <div className="py-2.5 flex justify-between">
                            <span>Ditolak / Perlu Revisi</span>
                            <span className="text-rose-600 font-black">{ktaApps.filter(k => k.status === 'rejected').length}</span>
                          </div>
                        </div>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-2xl border border-gray-150 flex items-center gap-3">
                        <div className="p-2 bg-hw-green/10 text-hw-green rounded-xl">
                          <Check size={18} />
                        </div>
                        <p className="text-[10px] text-gray-500 font-semibold leading-relaxed">
                          Anggota yang pengajuannya disetujui dapat mengunduh <strong>KTA Resmi</strong> dalam format PDF langsung dari dasbor mereka.
                        </p>
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
                      value={ktaSearchQuery}
                      onChange={(e) => setKtaSearchQuery(e.target.value)}
                      className="w-full bg-white border border-gray-150 rounded-xl py-3 pl-11 pr-4 focus:ring-2 focus:ring-hw-green/20 outline-none text-xs font-semibold"
                    />
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Left Panel: Daftar Kwarda */}
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
                      <div className="max-h-[400px] overflow-y-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-gray-50 border-b border-gray-100 text-[9px] font-black uppercase text-gray-400 tracking-wider">
                              <th className="p-3 pl-5">Nama Kwarda</th>
                              <th className="p-3 text-center">Approved</th>
                              <th className="p-3 text-center">Pending</th>
                              <th className="p-3 text-right pr-5">Total</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50 text-xs font-semibold text-gray-700">
                            {kwardaStats.filter(item => item.name.toLowerCase().includes(ktaSearchQuery.toLowerCase())).length === 0 ? (
                              <tr>
                                <td colSpan={4} className="p-8 text-center text-gray-400 font-bold uppercase text-[10px]">
                                  Kwarda tidak ditemukan
                                </td>
                              </tr>
                            ) : (
                              kwardaStats.filter(item => item.name.toLowerCase().includes(ktaSearchQuery.toLowerCase())).map((item) => {
                                const foundItem = KWARDA_QABILAH_JATENG.find(x => x.name === item.name);
                                const codeNum = foundItem ? parseInt(foundItem.code, 10) : '';
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
                                    <td className="p-3 text-right pr-5 font-black text-gray-800 font-mono">{item.total}</td>
                                  </tr>
                                );
                              })
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Right Panel: Daftar Asal Qabilah PTMA */}
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
                      <div className="max-h-[400px] overflow-y-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-gray-50 border-b border-gray-100 text-[9px] font-black uppercase text-gray-400 tracking-wider">
                              <th className="p-3 pl-5">Nama Qabilah/Pangkalan</th>
                              <th className="p-3 text-center">Approved</th>
                              <th className="p-3 text-center">Pending</th>
                              <th className="p-3 text-right pr-5">Total</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50 text-xs font-semibold text-gray-700">
                            {qabilahStats.filter(item => item.name.toLowerCase().includes(ktaSearchQuery.toLowerCase())).length === 0 ? (
                              <tr>
                                <td colSpan={4} className="p-8 text-center text-gray-400 font-bold uppercase text-[10px]">
                                  Qabilah tidak ditemukan
                                </td>
                              </tr>
                            ) : (
                              qabilahStats.filter(item => item.name.toLowerCase().includes(ktaSearchQuery.toLowerCase())).map((item) => {
                                const foundItem = KWARDA_QABILAH_JATENG.find(x => x.name === item.name);
                                const codeNum = foundItem ? parseInt(foundItem.code, 10) : '';
                                return (
                                  <tr key={item.name} className="hover:bg-gray-50/40 transition-colors">
                                    <td className="p-3 pl-5 font-extrabold text-gray-800 max-w-[180px] truncate" title={item.name}>
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
                                    <td className="p-3 text-right pr-5 font-black text-gray-800 font-mono">{item.total}</td>
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

              {/* Sub-tab content 3: Manajemen KTA HW */}
              {activeKtaSubTab === 'management' && (
                <div className="flex-1 flex flex-col">
                  {/* Search & Filter */}
                  <div className="p-6 border-b border-gray-50 bg-gray-50/10 flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                      <input 
                        type="text" 
                        placeholder="Cari berdasarkan nama, email, asal daerah..." 
                        value={ktaSearchQuery}
                        onChange={(e) => setKtaSearchQuery(e.target.value)}
                        className="w-full bg-white border border-gray-150 rounded-xl py-3 pl-11 pr-4 focus:ring-2 focus:ring-hw-green/20 outline-none text-xs font-semibold"
                      />
                    </div>
                    
                    <div className="flex gap-1.5 overflow-x-auto">
                      {['Semua', 'pending', 'approved', 'rejected'].map((st) => (
                        <button
                          key={st}
                          onClick={() => setKtaFilterStatus(st)}
                          className={`px-4 py-2 rounded-xl text-xs font-bold capitalize whitespace-nowrap transition-all border ${
                            ktaFilterStatus === st 
                            ? 'bg-hw-dark text-white border-hw-dark' 
                            : 'bg-white text-gray-500 border-gray-100 hover:border-gray-200'
                          }`}
                        >
                          {st === 'pending' ? 'Menunggu' : st === 'approved' ? 'Disetujui' : st === 'rejected' ? 'Ditolak' : 'Semua'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Application List Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[950px]">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-100 text-[10px] font-black uppercase text-gray-400 tracking-wider">
                          <th className="p-4 pl-6">Foto</th>
                          <th className="p-4">Nama & Kontak</th>
                          <th className="p-4">NIK</th>
                          <th className="p-4">Tingkatan & Jenis</th>
                          <th className="p-4">Asal Kwarda / Qabilah</th>
                          <th className="p-4">Status / No. KTA</th>
                          <th className="p-4 text-right pr-6">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50 text-xs font-semibold text-gray-700">
                        {ktaApps.filter(app => {
                          const matchSearch = 
                            app.nama.toLowerCase().includes(ktaSearchQuery.toLowerCase()) ||
                            (app.email || '').toLowerCase().includes(ktaSearchQuery.toLowerCase()) ||
                            (app.asalDaerah || '').toLowerCase().includes(ktaSearchQuery.toLowerCase()) ||
                            (app.qabilah || '').toLowerCase().includes(ktaSearchQuery.toLowerCase());
                          const matchStatus = ktaFilterStatus === 'Semua' || app.status === ktaFilterStatus;
                          return matchSearch && matchStatus;
                        }).length === 0 ? (
                          <tr>
                            <td colSpan={7} className="p-12 text-center text-gray-400 font-bold uppercase tracking-wider">
                              Belum ada pengajuan KTA yang sesuai kriteria
                            </td>
                          </tr>
                        ) : (
                          ktaApps.filter(app => {
                            const matchSearch = 
                              app.nama.toLowerCase().includes(ktaSearchQuery.toLowerCase()) ||
                              (app.email || '').toLowerCase().includes(ktaSearchQuery.toLowerCase()) ||
                              (app.asalDaerah || '').toLowerCase().includes(ktaSearchQuery.toLowerCase()) ||
                              (app.qabilah || '').toLowerCase().includes(ktaSearchQuery.toLowerCase());
                            const matchStatus = ktaFilterStatus === 'Semua' || app.status === ktaFilterStatus;
                            return matchSearch && matchStatus;
                          }).map((app) => (
                            <tr key={app.id} className="hover:bg-gray-50/50 transition-colors">
                              <td className="p-4 pl-6">
                                <div className="w-10 h-12 bg-gray-50 rounded-lg overflow-hidden border border-gray-200">
                                  {app.photo ? (
                                    <img src={app.photo} alt="Foto KTA" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-50">
                                      <UserIcon size={20} className="text-gray-400" />
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td className="p-4">
                                <div className="font-extrabold text-sm text-gray-800">{app.nama}</div>
                                <div className="text-[10px] text-gray-400 lowercase">{app.email}</div>
                                <div className="text-[10px] text-hw-green font-mono">{app.noWa}</div>
                              </td>
                              <td className="p-4 font-mono text-[11px] text-gray-600">
                                {app.nik || '-'}
                              </td>
                              <td className="p-4 space-y-1">
                                <div>
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-100">
                                    {app.tingkatan}
                                  </span>
                                </div>
                                <span className="inline-block text-[10px] text-gray-450 font-bold">
                                  KTA: <strong className="text-hw-green uppercase">{app.jenisKta || 'Digital'}</strong>
                                </span>
                              </td>
                              <td className="p-4">
                                <div className="font-bold flex items-center gap-1 text-gray-800">
                                  <MapPin size={11} className="text-gray-450 shrink-0" />
                                  {app.asalDaerah}
                                </div>
                                <div className="text-[10px] text-gray-450 font-medium truncate max-w-[150px]" title={app.qabilah}>
                                  Qabilah: {app.qabilah || '-'}
                                </div>
                              </td>
                              <td className="p-4">
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
                              <td className="p-4 text-right pr-6">
                                <div className="flex gap-1.5 justify-end items-center">
                                  {app.status === 'pending' && (
                                    <>
                                      <button
                                        onClick={() => handleApproveKTA(app.id)}
                                        className="px-2.5 py-1.5 bg-hw-green text-white rounded-lg hover:bg-emerald-700 font-bold text-[10px] uppercase tracking-wider transition-all"
                                      >
                                        Setujui
                                      </button>
                                      <button
                                        onClick={() => handleOpenRejectKTA(app.id)}
                                        className="px-2.5 py-1.5 bg-rose-50 text-rose-600 border border-rose-100 rounded-lg hover:bg-rose-100 font-bold text-[10px] uppercase tracking-wider transition-all"
                                      >
                                        Tolak
                                      </button>
                                    </>
                                  )}
                                  
                                  {/* Edit Button for all statuses */}
                                  <button
                                    onClick={() => {
                                      setEditingKtaApp(app);
                                      setIsEditKtaModalOpen(true);
                                    }}
                                    className="px-2 py-1.5 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-lg hover:bg-indigo-100 font-black text-[10px] uppercase tracking-wider transition-all"
                                  >
                                    Edit
                                  </button>

                                  <button
                                    onClick={() => {
                                      setViewingKtaApp(app);
                                      setIsViewKtaModalOpen(true);
                                      setFlippedAdmin(false);
                                    }}
                                    className="px-2 py-1.5 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-lg hover:bg-emerald-100 font-bold text-[10px] uppercase tracking-wider transition-all"
                                  >
                                    Detail
                                  </button>
                                  <button
                                    onClick={async () => {
                                      if (confirm('Hapus rincian pengajuan KTA ini?')) {
                                        const stored = localStorage.getItem('kta_applications') || '[]';
                                        let list = JSON.parse(stored);
                                        list = list.filter((x: any) => x.id !== app.id);
                                        localStorage.setItem('kta_applications', JSON.stringify(list));
                                        alert('Dihapus!');
                                        setKtaApps(list);
                                      }
                                    }}
                                    className="p-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg shrink-0"
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
              )}

              {/* Sub-tab content 4: Template KTA */}
              {activeKtaSubTab === 'template' && (
                <div className="p-6 space-y-8 flex-1 overflow-y-auto flex flex-col items-center justify-center min-h-[500px]">
                  <div className="w-full max-w-[420px] space-y-6">
                    <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm space-y-4">
                        <div className="flex items-center justify-between border-b border-gray-50 pb-3">
                          <div className="flex items-center gap-2">
                            <ImageIcon size={16} className="text-hw-green" />
                            <h4 className="text-xs font-black text-gray-800 uppercase tracking-wider font-display">Live Preview KTA</h4>
                          </div>
                          <button
                            onClick={() => setPreviewFlipped(!previewFlipped)}
                            className="px-3 py-1 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-lg text-[10px] font-bold uppercase transition-all"
                          >
                            Balik Kartu (Flipping)
                          </button>
                        </div>

                        {/* Interactive Card Container */}
                        <div className="flex justify-center py-4">
                          <div 
                            className="w-full max-w-[350px] aspect-[1.586/1] cursor-pointer [perspective:1000px]"
                            onClick={() => setPreviewFlipped(!previewFlipped)}
                          >
                            <div className={`relative w-full h-full transition-transform duration-700 [transform-style:preserve-3d] ${
                              previewFlipped ? "[transform:rotateY(180deg)]" : ""
                            }`}>
                              
                              {/* CARD FRONT PREVIEW */}
                              <div 
                                className="absolute inset-0 w-full h-full [backface-visibility:hidden] rounded-2xl overflow-hidden shadow-lg border border-emerald-800/10 p-4 flex flex-col justify-between"
                                style={settings.ktaTemplateFront ? {
                                  backgroundImage: `url(${getDriveDirectLink(settings.ktaTemplateFront)})`,
                                  backgroundSize: 'cover',
                                  backgroundPosition: 'center',
                                  backgroundColor: 'white'
                                } : {
                                  backgroundColor: 'white'
                                }}
                              >
                                {/* Default background ornament curves if no template front is uploaded */}
                                {!settings.ktaTemplateFront && (
                                  <>
                                    <div className="absolute right-0 top-0 w-40 h-16 bg-gradient-to-l from-amber-100/60 to-transparent rounded-bl-full pointer-events-none" />
                                    <div className="absolute left-0 bottom-0 right-0 h-20 bg-gradient-to-t from-emerald-500/10 via-teal-500/5 to-transparent pointer-events-none" />
                                    <div className="absolute left-0 bottom-0 w-44 h-14 bg-gradient-to-tr from-emerald-600 via-teal-600 to-emerald-700 rounded-tr-full opacity-70 pointer-events-none" />
                                    <div className="absolute left-0 bottom-0 w-48 h-10 bg-gradient-to-tr from-amber-400 via-yellow-400 to-transparent rounded-tr-full opacity-30 pointer-events-none" />
                                  </>
                                )}

                                {/* Header block */}
                                <div className="flex items-center gap-2 z-10 border-b border-gray-100 pb-2">
                                  <img src="https://upload.wikimedia.org/wikipedia/id/b/ba/Logo_Hizbul_Wathan.png" alt="HW Logo" className="w-8 h-8 object-contain" />
                                  <div>
                                    <h5 className="text-[7.5px] font-black text-gray-800 uppercase tracking-wider leading-tight">GERAKAN KEPANDUAN HIZBUL WATHAN</h5>
                                    <p className="text-[6.5px] font-black text-hw-green uppercase tracking-widest leading-none">KWARWIL JAWA TENGAH</p>
                                  </div>
                                </div>

                                {/* Body block */}
                                <div className="flex gap-3 my-1.5 z-10">
                                  {/* Avatar placeholder */}
                                  <div className="w-16 h-20 bg-gray-50 rounded-lg overflow-hidden border-2 border-emerald-600 shrink-0 flex items-center justify-center relative shadow-sm">
                                    <div className="flex flex-col items-center justify-center text-emerald-600 p-1">
                                      <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center">
                                        <Users size={14} />
                                      </div>
                                      <span className="text-[5px] uppercase font-bold mt-1 text-center leading-none">Foto Anggota</span>
                                    </div>
                                    <span className="absolute bottom-0 inset-x-0 bg-emerald-600 text-white text-[5px] uppercase font-black text-center py-0.5">
                                      HW JATENG
                                    </span>
                                  </div>

                                  {/* Data Personal */}
                                  <div className="flex-1 min-w-0 flex flex-col justify-center text-gray-800 space-y-0.5">
                                    <h4 className="text-[9.5px] font-black text-emerald-800 uppercase tracking-wider mb-1">KARTU ANGGOTA</h4>
                                    
                                    <table className="w-full text-left border-none border-collapse text-[7px] font-semibold text-gray-700">
                                      <tbody>
                                        <tr>
                                          <td className="w-14 font-bold text-gray-500 uppercase py-0.25">Nomor</td>
                                          <td className="w-2 text-center py-0.25">:</td>
                                          <td className="font-mono font-black text-emerald-800 tracking-wider py-0.25">11.02.0027</td>
                                        </tr>
                                        <tr>
                                          <td className="font-bold text-gray-500 uppercase py-0.25">Nama</td>
                                          <td className="text-center py-0.25">:</td>
                                          <td className="font-black text-gray-800 uppercase py-0.25 truncate">Catur Teddy Pamungkas</td>
                                        </tr>
                                        <tr>
                                          <td className="font-bold text-gray-500 uppercase py-0.25">TTL</td>
                                          <td className="text-center py-0.25">:</td>
                                          <td className="font-bold text-gray-800 py-0.25">Banyumas, 17-09-2012</td>
                                        </tr>
                                        <tr>
                                          <td className="font-bold text-gray-500 uppercase py-0.25">Asal</td>
                                          <td className="text-center py-0.25">:</td>
                                          <td className="font-bold text-gray-800 py-0.25 truncate">Kabupaten Banyumas</td>
                                        </tr>
                                        <tr>
                                          <td className="font-bold text-gray-500 uppercase py-0.25">Tingkatan</td>
                                          <td className="text-center py-0.25">:</td>
                                          <td className="font-bold text-emerald-700 py-0.25">Pandu Pengenal</td>
                                        </tr>
                                        <tr>
                                          <td className="font-bold text-gray-500 uppercase py-0.25">Alamat</td>
                                          <td className="text-center py-0.25">:</td>
                                          <td className="font-bold text-gray-600 py-0.25 text-[6.5px] leading-tight line-clamp-2">Tambaksari Kidul RT 07 RW 03, Kembaran, Banyumas</td>
                                        </tr>
                                      </tbody>
                                    </table>
                                  </div>
                                </div>

                                {/* Footer & Signatures Block */}
                                <div className="border-t border-gray-100 pt-1 z-10 flex items-center justify-between relative">
                                  <span className="text-[5px] font-mono font-bold text-gray-400">SEUMUR HIDUP • JAWA TENGAH</span>
                                  
                                  {/* Right side signatures section */}
                                  <div className="flex flex-col items-end text-right w-[150px] shrink-0 relative">
                                    <p className="text-[5.5px] font-bold text-gray-800 leading-none">{settings.ktaKotaPenerbit || 'Semarang'}, 13 Juli 2026</p>
                                    
                                    {/* Signatures & stamp overlapping row */}
                                    <div className="flex items-center justify-between w-full h-8 relative mt-0.5 px-1">
                                      {/* Stamp overlaying center */}
                                      <div className="absolute left-[35%] top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none opacity-85">
                                        {settings.ktaStempelImage ? (
                                          <img src={settings.ktaStempelImage} alt="Stempel" className="w-9 h-9 object-contain rotate-[-12deg]" />
                                        ) : (
                                          <svg viewBox="0 0 100 100" className="w-8 h-8 text-blue-600/85 font-black uppercase tracking-wider relative rotate-[-12deg]">
                                            <circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" strokeWidth="1.5" />
                                            <circle cx="50" cy="50" r="41" fill="none" stroke="currentColor" strokeWidth="0.75" />
                                            <g transform="translate(50,50) scale(0.65)">
                                              <circle cx="0" cy="0" r="10" fill="none" stroke="currentColor" strokeWidth="1" />
                                              {[...Array(12)].map((_, i) => (
                                                <path key={i} d="M0 -15 L3 -25 L0 -21 L-3 -25 Z" fill="currentColor" transform={`rotate(${i * 30})`} />
                                              ))}
                                            </g>
                                            <path id="stamp-path-top-admin" d="M 12 50 A 38 38 0 1 1 88 50" fill="none" stroke="none" />
                                            <path id="stamp-path-bottom-admin" d="M 88 50 A 38 38 0 1 1 12 50" fill="none" stroke="none" />
                                            <text className="text-[6.5px] fill-current font-bold" letterSpacing="1.2">
                                              <textPath href="#stamp-path-top-admin" startOffset="50%" textAnchor="middle">KWARWIL JAWA TENGAH</textPath>
                                            </text>
                                            <text className="text-[6.5px] fill-current font-bold" letterSpacing="1.2">
                                              <textPath href="#stamp-path-bottom-admin" startOffset="50%" textAnchor="middle">HIZBUL WATHAN</textPath>
                                            </text>
                                          </svg>
                                        )}
                                      </div>

                                      {/* Ketua Signature Block */}
                                      <div className="flex flex-col items-center w-1/2 relative">
                                        <span className="text-[4px] font-bold uppercase text-gray-400">Ketua</span>
                                        <div className="h-6 flex items-center justify-center">
                                          {settings.ktaTandaTanganKetua ? (
                                            <img src={settings.ktaTandaTanganKetua} alt="Tanda Tangan Ketua" className="h-6 object-contain" />
                                          ) : (
                                            <svg viewBox="0 0 100 40" className="w-16 h-8 text-blue-700 opacity-80" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                                              <path d="M10 25c10-2 20-15 25-15s5 20 15 5c5-5 15-10 20-5c5 5-2 15 5 15c5 0 15-10 20-15" />
                                              <path d="M15 18c15 0 35 12 50 12" />
                                            </svg>
                                          )}
                                        </div>
                                        <span className="text-[4.5px] font-black text-gray-850 leading-none uppercase truncate w-full text-center">{settings.ktaKetuaNama}</span>
                                        <span className="text-[3.5px] font-semibold text-gray-400 leading-none truncate w-full text-center">{settings.ktaKetuaNbm}</span>
                                      </div>

                                      {/* Sekretaris Signature Block */}
                                      <div className="flex flex-col items-center w-1/2 relative">
                                        <span className="text-[4px] font-bold uppercase text-gray-400">Sekretaris</span>
                                        <div className="h-6 flex items-center justify-center">
                                          {settings.ktaTandaTanganSekretaris ? (
                                            <img src={settings.ktaTandaTanganSekretaris} alt="Tanda Tangan Sekretaris" className="h-6 object-contain" />
                                          ) : (
                                            <svg viewBox="0 0 100 40" className="w-16 h-8 text-blue-700 opacity-80" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                                              <path d="M15 15c5 15 15 20 25 10c10-10 5-20 15-5s10 15 20 5s10-15 15-5" />
                                              <path d="M10 22c15 2 30-5 45-2" />
                                            </svg>
                                          )}
                                        </div>
                                        <span className="text-[4.5px] font-black text-gray-850 leading-none uppercase truncate w-full text-center">{settings.ktaSekretarisNama}</span>
                                        <span className="text-[3.5px] font-semibold text-gray-400 leading-none truncate w-full text-center">{settings.ktaSekretarisNbm}</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* CARD BACK PREVIEW */}
                              <div 
                                className="absolute inset-0 w-full h-full [backface-visibility:hidden] [transform:rotateY(180deg)] rounded-2xl overflow-hidden shadow-lg border border-emerald-950/20 p-4 flex flex-col justify-between"
                                style={settings.ktaTemplateBack ? {
                                  backgroundImage: `url(${getDriveDirectLink(settings.ktaTemplateBack)})`,
                                  backgroundSize: 'cover',
                                  backgroundPosition: 'center',
                                  backgroundColor: 'white'
                                } : {
                                  backgroundColor: '#fafaf9'
                                }}
                              >
                                {/* Watermark logo if no template back is uploaded */}
                                {!settings.ktaTemplateBack && (
                                  <>
                                    <div className="absolute -left-10 -top-10 w-36 h-36 bg-emerald-500/5 rounded-full blur-xl pointer-events-none" />
                                    <div className="absolute right-0 bottom-0 w-40 h-16 bg-gradient-to-t from-emerald-500/5 to-transparent rounded-tl-full pointer-events-none" />
                                  </>
                                )}

                                {/* Top capsule logo */}
                                <div className="flex justify-center z-10">
                                  <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-hw-green text-white rounded-full text-[7.5px] font-black uppercase tracking-wider shadow-sm border border-emerald-600/30">
                                    <img src="https://upload.wikimedia.org/wikipedia/id/b/ba/Logo_Hizbul_Wathan.png" alt="HW" className="w-3.5 h-3.5 object-contain invert brightness-200" />
                                    <span>HW Jateng</span>
                                  </div>
                                </div>

                                {/* Rules and Pledge */}
                                <div className="space-y-1 z-10 px-1 mt-1">
                                  <h5 className="text-[7.5px] font-black uppercase text-emerald-800 tracking-wider text-center border-b border-gray-150 pb-0.5">Undang-Undang Pandu Hizbul Wathan</h5>
                                  <ol className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-[4.8px] text-gray-700 list-decimal pl-3 font-semibold leading-tight mt-1">
                                    <li>Satu, Pandu Hizbul Wathan itu, dapat dipercaya.</li>
                                    <li>Dua, Pandu Hizbul Wathan itu, setia dan teguh hati.</li>
                                    <li>Tiga, Pandu Hizbul Wathan itu, siap menolong dan wajib berjasa.</li>
                                    <li>Empat, Pandu Hizbul Wathan itu, suka perdamaian dan persaudaraan.</li>
                                    <li>Lima, Pandu Hizbul Wathan itu, sopan santun dan perwira.</li>
                                    <li>Enam, Pandu Hizbul Wathan itu, menyayangi semua makhluk.</li>
                                    <li>Tujuh, Pandu Hizbul Wathan itu, melaksanakan perintah tanpa membantah.</li>
                                    <li>Delapan, Pandu Hizbul Wathan itu, sabar dan pemaaf.</li>
                                    <li>Sembilan, Pandu Hizbul Wathan itu, teliti dan hemat.</li>
                                    <li>Sepuluh, Pandu Hizbul Wathan itu, suci dalam hati, pikiran, perkataan dan perbuatan.</li>
                                  </ol>
                                </div>

                                {/* Validation QR & Stamp Block */}
                                <div className="border-t border-gray-100 pt-1 z-10 flex items-center justify-between relative mt-1">
                                  <div className="text-left leading-tight max-w-[130px]">
                                    <p className="text-[4px] text-gray-400 uppercase font-bold">Diterbitkan oleh :</p>
                                    <p className="text-[5.5px] font-black text-emerald-800 uppercase leading-none">Pimpinan Wilayah HW Jawa Tengah</p>
                                    <p className="text-[4px] text-gray-400">Jl. Singosari No.33, Semarang</p>
                                  </div>

                                  {/* Under Undang-undang signatures default block - matches user request */}
                                  <div className="flex items-center gap-1 w-[150px] shrink-0 justify-end relative">
                                    {/* Small stamp overlay */}
                                    <div className="absolute right-[40%] top-1/2 -translate-y-1/2 z-20 opacity-80 pointer-events-none">
                                      {settings.ktaStempelImage ? (
                                        <img src={settings.ktaStempelImage} alt="Stempel" className="w-8 h-8 object-contain rotate-[-12deg]" />
                                      ) : (
                                        <svg viewBox="0 0 100 100" className="w-8 h-8 text-blue-600/85 font-black uppercase tracking-wider relative rotate-[-12deg]">
                                          <circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" strokeWidth="1.5" />
                                          <circle cx="50" cy="50" r="41" fill="none" stroke="currentColor" strokeWidth="0.75" />
                                          <g transform="translate(50,50) scale(0.65)">
                                            <circle cx="0" cy="0" r="10" fill="none" stroke="currentColor" strokeWidth="1" />
                                            {[...Array(12)].map((_, i) => (
                                              <path key={i} d="M0 -15 L3 -25 L0 -21 L-3 -25 Z" fill="currentColor" transform={`rotate(${i * 30})`} />
                                            ))}
                                          </g>
                                          <path id="stamp-path-top-admin-back" d="M 12 50 A 38 38 0 1 1 88 50" fill="none" stroke="none" />
                                          <path id="stamp-path-bottom-admin-back" d="M 88 50 A 38 38 0 1 1 12 50" fill="none" stroke="none" />
                                          <text className="text-[6.5px] fill-current font-bold" letterSpacing="1.2">
                                            <textPath href="#stamp-path-top-admin-back" startOffset="50%" textAnchor="middle">KWARWIL JAWA TENGAH</textPath>
                                          </text>
                                          <text className="text-[6.5px] fill-current font-bold" letterSpacing="1.2">
                                            <textPath href="#stamp-path-bottom-admin-back" startOffset="50%" textAnchor="middle">HIZBUL WATHAN</textPath>
                                          </text>
                                        </svg>
                                      )}
                                    </div>

                                    {/* Ketua Sig */}
                                    <div className="flex flex-col items-center w-[60px] relative">
                                      <span className="text-[3.5px] font-bold uppercase text-gray-400 leading-none">Ketua</span>
                                      <div className="h-5 flex items-center justify-center scale-90">
                                        {settings.ktaTandaTanganKetua ? (
                                          <img src={settings.ktaTandaTanganKetua} alt="Tanda Tangan Ketua" className="h-5 object-contain" />
                                        ) : (
                                          <svg viewBox="0 0 100 40" className="w-16 h-8 text-blue-700 opacity-80" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M10 25c10-2 20-15 25-15s5 20 15 5c5-5 15-10 20-5c5 5-2 15 5 15c5 0 15-10 20-15" />
                                            <path d="M15 18c15 0 35 12 50 12" />
                                          </svg>
                                        )}
                                      </div>
                                      <span className="text-[4px] font-black text-gray-850 leading-none uppercase truncate w-full text-center">{settings.ktaKetuaNama}</span>
                                    </div>

                                    {/* Sekretaris Sig */}
                                    <div className="flex flex-col items-center w-[60px] relative">
                                      <span className="text-[3.5px] font-bold uppercase text-gray-400 leading-none">Sekretaris</span>
                                      <div className="h-5 flex items-center justify-center scale-90">
                                        {settings.ktaTandaTanganSekretaris ? (
                                          <img src={settings.ktaTandaTanganSekretaris} alt="Tanda Tangan Sekretaris" className="h-5 object-contain" />
                                        ) : (
                                          <svg viewBox="0 0 100 40" className="w-16 h-8 text-blue-700 opacity-80" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M15 15c5 15 15 20 25 10c10-10 5-20 15-5s10 15 20 5s10-15 15-5" />
                                            <path d="M10 22c15 2 30-5 45-2" />
                                          </svg>
                                        )}
                                      </div>
                                      <span className="text-[4px] font-black text-gray-850 leading-none uppercase truncate w-full text-center">{settings.ktaSekretarisNama}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>

                            </div>
                          </div>
                        </div>

                        <div className="bg-amber-50/50 border border-amber-100 p-3 rounded-2xl text-[10px] text-amber-800 font-semibold leading-relaxed">
                          <p className="font-bold uppercase tracking-wider mb-0.5">💡 Tips Desain Template:</p>
                          Jika Anda mengunggah Master Template KTA kustom, pastikan gambar memiliki dimensi ideal <strong>1050 x 660 piksel</strong> (aspek rasio ID card resmi) dengan bagian tengah bersih untuk memudahkan penempatan teks data personal anggota.
                        </div>
                      </div>
                    </div>

                </div>
              )}
            </div>
          )}
          {/* KELOLA PELATIHAN TAB */}
          {activeTab === 'pelatihan' && (
            <div className="flex flex-col h-full">
              <div className="p-6 border-b border-gray-50 bg-gray-50/30 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex flex-col gap-1">
                    <h3 className="text-sm font-black text-gray-800 uppercase tracking-wider font-display">Pengelolaan Pelatihan HW Jateng</h3>
                    <p className="text-xs text-gray-400 font-medium">Verifikasi, absensi, pengumpulan tugas, dan penilaian pelatihan (Jati 1 / Jati 2 / Jari 1)</p>
                  </div>
                  
                  {/* Stats Counter */}
                  <div className="flex gap-4">
                    <div className="px-4 py-2 bg-yellow-50 text-yellow-700 rounded-2xl border border-yellow-100 flex flex-col items-center">
                      <span className="text-[10px] font-bold text-yellow-500 uppercase tracking-wider">Menunggu</span>
                      <span className="text-sm font-black">{trainingApps.filter(t => t.status === 'pending').length}</span>
                    </div>
                    <div className="px-4 py-2 bg-green-50 text-green-700 rounded-2xl border border-green-100 flex flex-col items-center">
                      <span className="text-[10px] font-bold text-green-500 uppercase tracking-wider">Disetujui</span>
                      <span className="text-sm font-black">{trainingApps.filter(t => t.status === 'approved').length}</span>
                    </div>
                    <div className="px-4 py-2 bg-rose-50 text-rose-700 rounded-2xl border border-rose-100 flex flex-col items-center">
                      <span className="text-[10px] font-bold text-rose-500 uppercase tracking-wider">Ditolak</span>
                      <span className="text-sm font-black">{trainingApps.filter(t => t.status === 'rejected').length}</span>
                    </div>
                  </div>
                </div>

                {/* Sub-Tab Navigation Pills */}
                <div className="flex border-b border-gray-150/60 overflow-x-auto scrollbar-none gap-2 px-1 pt-2">
                  {[
                    { id: 'peserta', label: '1. Data Peserta Pelatihan', desc: 'Verifikasi & Biodata' },
                    { id: 'presensi', label: '2. Presensi', desc: 'Absensi per Materi' },
                    { id: 'penugasan', label: '3. Penugasan', desc: 'Ulasan Tugas' },
                    { id: 'penilaian', label: '4. Penilaian & Kelulusan', desc: 'Status Kelulusan' },
                    { id: 'piagam', label: '5. Cetak Piagam', desc: 'Unduh Sertifikat' },
                    { id: 'pengaturan', label: '6. Atur Lokasi & Tanggal', desc: 'Jadwal & Tempat' },
                  ].map(sub => (
                    <button
                      key={sub.id}
                      onClick={() => setTrainingSubTab(sub.id as any)}
                      className={cn(
                        "flex flex-col items-start px-5 py-3 rounded-t-2xl text-xs transition-all border-b-2 font-bold whitespace-nowrap min-w-[170px] text-left",
                        trainingSubTab === sub.id 
                          ? "border-hw-green text-hw-green bg-hw-green/5 font-black shadow-sm" 
                          : "border-transparent text-gray-400 hover:text-gray-600 hover:bg-gray-50/50"
                      )}
                    >
                      <span className="tracking-tight">{sub.label}</span>
                      <span className="text-[9px] font-bold opacity-60 mt-0.5 tracking-wider uppercase">{sub.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* SUB-TAB CONTENTS */}
              <div className="p-6 flex-1">
                
                {/* 1. DATA PESERTA PELATIHAN SUB-TAB */}
                {trainingSubTab === 'peserta' && (
                  <div className="space-y-4">
                    {/* Search & Filter Bar */}
                    <div className="flex flex-col sm:flex-row gap-3 bg-white p-4 rounded-3xl border border-gray-100 shadow-sm">
                      <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input 
                          type="text" 
                          placeholder="Cari berdasarkan nama, WhatsApp, asal daerah..." 
                          value={trainingSearchQuery}
                          onChange={(e) => setTrainingSearchQuery(e.target.value)}
                          className="w-full bg-gray-50 border border-gray-150 rounded-2xl py-3 pl-11 pr-4 focus:ring-2 focus:ring-hw-green/20 outline-none text-xs font-bold"
                        />
                      </div>
                      
                      <div className="flex gap-1.5 overflow-x-auto">
                        {['Semua', 'pending', 'approved', 'rejected'].map((st) => (
                          <button
                            key={st}
                            onClick={() => setTrainingFilterStatus(st)}
                            className={`px-4 py-2 rounded-xl text-xs font-black capitalize whitespace-nowrap transition-all border ${
                              trainingFilterStatus === st 
                              ? 'bg-hw-dark text-white border-hw-dark' 
                              : 'bg-white text-gray-500 border-gray-100 hover:border-gray-200'
                            }`}
                          >
                            {st === 'pending' ? 'Menunggu' : st === 'approved' ? 'Disetujui' : st === 'rejected' ? 'Ditolak' : 'Semua Status'}
                          </button>
                        ))}
                      </div>

                      <button
                        onClick={() => {
                          setIsAddParticipantModalOpen(true);
                          setAddParticipantSelectedMemberId('');
                          setAddParticipantSearchQuery('');
                          setAddParticipantLokasi(settings.trainingLocations?.[0] || '');
                          setAddParticipantTanggal(settings.trainingDates?.[0] || '');
                          setAddParticipantLevel('Jati 1');
                          setAddParticipantPelatihGolongan('Tunas Athfal');
                        }}
                        className="px-4 py-2.5 bg-hw-green hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md shadow-hw-green/15 flex items-center gap-1.5 shrink-0 self-start sm:self-center"
                      >
                        <UserPlus size={14} /> Tambah Peserta
                      </button>
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
                          {trainingApps.filter(app => {
                            const matchSearch = 
                              app.nama.toLowerCase().includes(trainingSearchQuery.toLowerCase()) ||
                              (app.noWa || '').toLowerCase().includes(trainingSearchQuery.toLowerCase()) ||
                              (app.asalDaerah || '').toLowerCase().includes(trainingSearchQuery.toLowerCase());
                            const matchStatus = trainingFilterStatus === 'Semua' || app.status === trainingFilterStatus;
                            return matchSearch && matchStatus;
                          }).length === 0 ? (
                            <tr>
                              <td colSpan={7} className="p-12 text-center text-gray-400 font-bold uppercase tracking-wider">
                                Belum ada pendaftaran peserta yang sesuai kriteria
                              </td>
                            </tr>
                          ) : (
                            trainingApps.filter(app => {
                              const matchSearch = 
                                app.nama.toLowerCase().includes(trainingSearchQuery.toLowerCase()) ||
                                (app.noWa || '').toLowerCase().includes(trainingSearchQuery.toLowerCase()) ||
                                (app.asalDaerah || '').toLowerCase().includes(trainingSearchQuery.toLowerCase());
                              const matchStatus = trainingFilterStatus === 'Semua' || app.status === trainingFilterStatus;
                              return matchSearch && matchStatus;
                            }).map((app) => (
                              <tr key={app.id} className="hover:bg-gray-50/50 transition-colors">
                                <td className="p-4 pl-6">
                                  <div className="w-10 h-12 bg-gray-50 rounded-lg overflow-hidden border border-gray-200">
                                    {app.photo ? (
                                      <img src={app.photo} alt="Foto" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-50">
                                        <UserIcon size={20} className="text-gray-400" />
                                      </div>
                                    )}
                                  </div>
                                </td>

                                <td className="p-4">
                                  <div className="font-extrabold text-sm text-gray-800">{app.nama}</div>
                                  <div className="text-[10px] text-gray-400 lowercase">{app.email}</div>
                                  <div className="text-[10px] text-gray-500 mt-0.5">NIK: <span className="font-mono text-gray-700 font-bold">{app.nik || '-'}</span></div>
                                  <div className="text-[10px] text-gray-500">Tempat/Tgl Lahir: <span className="font-bold">{app.tempatLahir || '-'}, {app.tanggalLahir || '-'}</span></div>
                                  <div className="text-[10px] text-gray-500">Jenis Kelamin: <span className="font-bold">{app.jenisKelamin === 'L' ? 'Laki-Laki' : app.jenisKelamin === 'P' ? 'Perempuan' : '-'}</span></div>
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
                                  <div className="font-bold text-gray-800">{app.golonganAnggota || 'Golongan Tidak Ada'}</div>
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
                                          value={editLokasi}
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
                                          value={editTanggal}
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

                                <td className="p-4">
                                  {app.status === 'pending' ? (
                                    <span className="inline-flex items-center gap-1 bg-yellow-50 text-yellow-700 px-2.5 py-1 rounded-full text-[10px] font-black border border-yellow-100 uppercase tracking-widest animate-pulse">
                                      Menunggu Bayar
                                    </span>
                                  ) : app.status === 'approved' ? (
                                    <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 px-2.5 py-1 rounded-full text-[10px] font-black border border-green-100 uppercase tracking-widest">
                                      Disetujui
                                    </span>
                                  ) : (
                                    <div className="space-y-1">
                                      <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-700 px-2.5 py-1 rounded-full text-[10px] font-black border border-rose-100 uppercase tracking-widest">
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

                                <td className="p-4 text-right pr-6">
                                  {app.status === 'pending' ? (
                                    <div className="flex gap-2 justify-end">
                                      <button
                                        onClick={() => handleApproveTraining(app.id)}
                                        className="px-3 py-1.5 bg-hw-green text-white rounded-lg hover:bg-emerald-700 font-black text-[10px] uppercase tracking-wider transition-all hover:scale-105 active:scale-95"
                                      >
                                        Setujui
                                      </button>
                                      <button
                                        onClick={() => handleOpenRejectTraining(app.id)}
                                        className="px-3 py-1.5 bg-rose-50 text-rose-600 border border-rose-100 rounded-lg hover:bg-rose-100 font-black text-[10px] uppercase tracking-wider transition-all hover:scale-105 active:scale-95"
                                      >
                                        Tolak
                                      </button>
                                    </div>
                                  ) : (
                                    <div className="flex gap-2 justify-end">
                                      <button
                                        onClick={() => {
                                          alert(`Detail Pendaftaran Pelatihan:\n\nNama Lengkap: ${app.nama}\nEmail: ${app.email}\nWhatsApp: ${app.noWa}\nTempat, Tgl Lahir: ${app.tempatLahir || '-'}, ${app.tanggalLahir || '-'}\nJenis Kelamin: ${app.jenisKelamin === 'L' ? 'Laki-laki' : 'Perempuan'}\nAsal Kabupaten: ${app.asalDaerah || '-'}\nQabilah: ${app.qabilah || '-'}\nGolongan: ${app.golonganAnggota || '-'}\nPelatih Golongan: ${app.pelatihGolongan || '-'}\nPelatihan Yang Diikuti: ${app.pelatihanAkanDiikuti}\nStatus: ${app.status.toUpperCase()}`);
                                        }}
                                        className="px-2.5 py-1.5 bg-gray-50 text-gray-550 border border-gray-100 rounded-lg hover:bg-gray-100 font-black text-[9px] uppercase tracking-wider"
                                      >
                                        Detail
                                      </button>
                                      <button
                                        onClick={async () => {
                                          if (confirm('Hapus rincian pendaftaran pelatihan ini?')) {
                                            try {
                                              setLoading(true);
                                              await sheetsService.updateTrainingStatus(app.id, 'deleted');
                                              alert('Dihapus!');
                                              const tApps = await sheetsService.getTrainingApplications();
                                              setTrainingApps(tApps || []);
                                            } catch (err: any) {
                                              alert('Gagal menghapus: ' + err.message);
                                            } finally {
                                              setLoading(false);
                                            }
                                          }
                                        }}
                                        className="p-1.5 px-2 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg shrink-0"
                                      >
                                        <Trash2 size={13} />
                                      </button>
                                    </div>
                                  )}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
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
                      
                      <div className="text-right">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Jumlah Peserta Disetujui</span>
                        <span className="text-lg font-black text-hw-green">
                          {trainingApps.filter(app => app.status === 'approved' && app.pelatihanAkanDiikuti === selectedPresensiProg).length} Orang
                        </span>
                      </div>
                    </div>

                    {/* Presensi Grid Table */}
                    {(() => {
                      const progCatMap: Record<string, string> = {
                        'Jati 1': 'jati1',
                        'Jati 2': 'jati2',
                        'Jari 1': 'jari1'
                      };
                      const cat = progCatMap[selectedPresensiProg];
                      const progMaterials = materiList.filter(m => m.kategori === cat);
                      const sessions = progMaterials.length > 0 
                        ? progMaterials.map(m => m.judul) 
                        : ['Sesi 1', 'Sesi 2', 'Sesi 3'];

                      const enrolled = trainingApps.filter(app => app.status === 'approved' && app.pelatihanAkanDiikuti === selectedPresensiProg);

                      return enrolled.length === 0 ? (
                        <div className="bg-white p-12 text-center rounded-3xl border border-gray-100 text-gray-400 font-bold uppercase tracking-wider">
                          Belum ada peserta yang disetujui untuk pelatihan tingkat {selectedPresensiProg} ini.
                        </div>
                      ) : (
                        <div className="overflow-x-auto bg-white rounded-3xl border border-gray-100 shadow-sm">
                          <table className="w-full text-left border-collapse min-w-[900px]">
                            <thead>
                              <tr className="bg-gray-50 border-b border-gray-100 text-[10px] font-black uppercase text-gray-400 tracking-wider">
                                <th className="p-4 pl-6 w-[250px]">Nama Peserta</th>
                                {sessions.map((sesi) => (
                                  <th key={sesi} className="p-4 text-center break-words max-w-[150px] leading-tight text-[9px]">
                                    {sesi}
                                  </th>
                                ))}
                                <th className="p-4 pr-6 text-center w-[120px] border-l border-gray-100">% Kehadiran</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 text-xs font-semibold text-gray-700">
                              {enrolled.map((app) => {
                                let attObj: Record<string, boolean> = {};
                                if (app.kehadiran) {
                                  attObj = safeJsonParse<Record<string, boolean>>(app.kehadiran, {});
                                }

                                const totalSessions = sessions.length;
                                const attendedSessions = sessions.filter(sesi => !!attObj[sesi]).length;
                                const attendancePercentage = totalSessions > 0 
                                  ? Math.round((attendedSessions / totalSessions) * 100) 
                                  : 0;

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
                                          <div className="font-extrabold text-gray-800 leading-snug">{app.nama}</div>
                                          <div className="text-[9px] text-gray-400 uppercase tracking-tighter">{app.asalDaerah || 'Jawa Tengah'}</div>
                                        </div>
                                      </div>
                                    </td>
                                    
                                    {sessions.map((sesi) => {
                                      const isPresent = !!attObj[sesi];
                                      return (
                                        <td key={sesi} className="p-4 text-center">
                                          <div className="flex flex-col items-center justify-center">
                                            <input 
                                              type="checkbox" 
                                              checked={isPresent}
                                              onChange={(e) => handleUpdateAttendance(app.id, sesi, e.target.checked)}
                                              className="w-5 h-5 rounded-lg border-gray-300 text-hw-green focus:ring-hw-green/20 cursor-pointer accent-hw-green"
                                            />
                                            <span className={`text-[9px] font-bold uppercase mt-1 ${isPresent ? 'text-hw-green font-extrabold' : 'text-gray-300 font-medium'}`}>
                                              {isPresent ? 'Hadir' : 'Absen'}
                                            </span>
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
                      const categoryMaterials = materiList.filter(m => m.kategori === cat);

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
                      const categoryMaterials = materiList.filter(m => m.kategori === cat);
                      const enrolled = trainingApps.filter(app => app.status === 'approved' && app.pelatihanAkanDiikuti === selectedTugasProg);

                      return enrolled.length === 0 ? (
                        <div className="bg-white p-12 text-center rounded-3xl border border-gray-100 text-gray-400 font-bold uppercase tracking-wider">
                          Belum ada peserta yang disetujui untuk tingkat {selectedTugasProg}.
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-3xl border border-gray-100 shadow-sm">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                                <Filter size={16} />
                              </div>
                              <div className="flex flex-col">
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Filter Berdasarkan Materi</span>
                                <select
                                  value={selectedTugasMateriId}
                                  onChange={(e) => setSelectedTugasMateriId(e.target.value)}
                                  className="bg-gray-50 border border-gray-100 rounded-xl px-3 py-1.5 text-xs font-bold text-gray-700 outline-none focus:ring-2 focus:ring-hw-green/20"
                                >
                                  <option value="all">Semua Penugasan ({categoryMaterials.length})</option>
                                  {categoryMaterials.map(m => (
                                    <option key={m.id} value={m.id}>{m.judul}</option>
                                  ))}
                                </select>
                              </div>
                            </div>
                            
                            <div className="text-right shrink-0">
                              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Jumlah Peserta Disetujui</span>
                              <span className="text-sm font-black text-hw-green">
                                {enrolled.length} Orang
                              </span>
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
                                {enrolled.map((app) => {
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
                                            <div className="font-extrabold text-gray-800 leading-snug">{app.nama}</div>
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
                                                <div key={idx} className="flex items-center justify-between p-2 rounded-xl bg-gray-50 border border-gray-100 text-[10px] font-bold">
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
                                                      className="text-hw-green hover:underline flex items-center gap-1 shrink-0"
                                                    >
                                                      Lihat Tugas <ArrowUpRight size={10} />
                                                    </a>
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
                    </div>

                    {/* Grading Table */}
                    {(() => {
                      const enrolled = trainingApps.filter(app => app.status === 'approved' && app.pelatihanAkanDiikuti === selectedGradeProg);

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
                              {enrolled.map((app) => {
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
                                          <div className="font-extrabold text-gray-800 leading-snug">{app.nama}</div>
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
                    </div>

                    {/* Piagam Table */}
                    {(() => {
                      // Filter approved participants who are Lulus or Lulus Bersyarat
                      const graduates = trainingApps.filter(app => 
                        app.status === 'approved' && 
                        app.pelatihanAkanDiikuti === selectedPiagamProg && 
                        (app.statusKelulusan === 'Lulus' || app.statusKelulusan === 'Lulus Bersyarat')
                      );

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
                              {graduates.map((app) => (
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
                                        <div className="font-extrabold text-gray-800 leading-snug">{app.nama}</div>
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

                {/* 6. ATUR LOKASI & TANGGAL SUB-TAB */}
                {trainingSubTab === 'pengaturan' && (
                  <div className="space-y-6">
                    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                      <h4 className="text-sm font-black text-gray-800 uppercase tracking-wider mb-2 flex items-center gap-2">
                        <Settings className="text-hw-green" size={18} /> Pengaturan Lokasi & Jadwal Pelaksanaan
                      </h4>
                      <p className="text-xs text-gray-400 font-medium">
                        Atur daftar lokasi pelatihan dan tanggal pelaksanaan yang tersedia untuk dipilih peserta pada formulir pendaftaran.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* LOKASI CARD */}
                      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
                        <div className="flex items-center justify-between">
                          <h5 className="text-xs font-black text-gray-800 uppercase tracking-widest">
                            📍 Daftar Lokasi Pelatihan
                          </h5>
                          <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full font-black">
                            {(settings.trainingLocations || []).length} Lokasi
                          </span>
                        </div>

                        <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
                          {(settings.trainingLocations || []).length === 0 ? (
                            <p className="text-xs font-bold text-gray-400 py-8 text-center">
                              Belum ada lokasi pelatihan. Silakan tambahkan di bawah.
                            </p>
                          ) : (
                            (settings.trainingLocations || []).map((loc, idx) => (
                              <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-2xl border border-gray-100">
                                <span className="text-xs font-bold text-gray-750">{loc}</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const filtered = (settings.trainingLocations || []).filter((_, i) => i !== idx);
                                    setSettings(prev => ({ ...prev, trainingLocations: filtered }));
                                  }}
                                  className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                                >
                                  <X size={14} />
                                </button>
                              </div>
                            ))
                          )}
                        </div>

                        <div className="pt-2 border-t border-gray-100 flex gap-2">
                          <input
                            type="text"
                            placeholder="Ketik lokasi baru..."
                            value={newLocationInput}
                            onChange={(e) => setNewLocationInput(e.target.value)}
                            className="flex-1 bg-gray-50 border border-gray-150 rounded-xl px-3 py-2.5 font-bold text-xs outline-none focus:ring-4 focus:ring-hw-green/10 text-gray-700"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              if (!newLocationInput.trim()) return;
                              if ((settings.trainingLocations || []).includes(newLocationInput.trim())) {
                                alert('Lokasi sudah terdaftar.');
                                return;
                              }
                              setSettings(prev => ({
                                ...prev,
                                trainingLocations: [...(prev.trainingLocations || []), newLocationInput.trim()]
                              }));
                              setNewLocationInput('');
                            }}
                            className="px-4 py-2 bg-hw-green hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all"
                          >
                            Tambah
                          </button>
                        </div>
                      </div>

                      {/* TANGGAL CARD */}
                      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
                        <div className="flex items-center justify-between">
                          <h5 className="text-xs font-black text-gray-800 uppercase tracking-widest">
                            📅 Daftar Tanggal Pelaksanaan
                          </h5>
                          <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full font-black">
                            {(settings.trainingDates || []).length} Jadwal
                          </span>
                        </div>

                        <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
                          {(settings.trainingDates || []).length === 0 ? (
                            <p className="text-xs font-bold text-gray-400 py-8 text-center">
                              Belum ada tanggal pelaksanaan. Silakan tambahkan di bawah.
                            </p>
                          ) : (
                            (settings.trainingDates || []).map((dt, idx) => (
                              <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-2xl border border-gray-100">
                                <span className="text-xs font-bold text-gray-750">{dt}</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const filtered = (settings.trainingDates || []).filter((_, i) => i !== idx);
                                    setSettings(prev => ({ ...prev, trainingDates: filtered }));
                                  }}
                                  className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                                >
                                  <X size={14} />
                                </button>
                              </div>
                            ))
                          )}
                        </div>

                        <div className="pt-2 border-t border-gray-100 flex gap-2">
                          <input
                            type="text"
                            placeholder="Contoh: 12-14 Juli 2026..."
                            value={newDateInput}
                            onChange={(e) => setNewDateInput(e.target.value)}
                            className="flex-1 bg-gray-50 border border-gray-150 rounded-xl px-3 py-2.5 font-bold text-xs outline-none focus:ring-4 focus:ring-hw-green/10 text-gray-700"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              if (!newDateInput.trim()) return;
                              if ((settings.trainingDates || []).includes(newDateInput.trim())) {
                                alert('Tanggal ini sudah terdaftar.');
                                return;
                              }
                              setSettings(prev => ({
                                ...prev,
                                trainingDates: [...(prev.trainingDates || []), newDateInput.trim()]
                              }));
                              setNewDateInput('');
                            }}
                            className="px-4 py-2 bg-hw-green hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all"
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
                        className="px-6 py-3 bg-hw-green hover:bg-emerald-700 text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-md shadow-hw-green/10 flex items-center gap-2"
                      >
                        {isSavingSettings ? 'Menyimpan...' : 'Simpan Semua Pengaturan Pelatihan'}
                      </button>
                    </div>
                  </div>
                )}

              </div>
            </div>
          )}
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
                    value={passwordFormData.newPassword}
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
                    value={passwordFormData.confirmPassword}
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

      {/* Upgrade Requests Modal */}
      <AnimatePresence>
        {isUpgradeModalOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsUpgradeModalOpen(false)}
              className="absolute inset-0 bg-hw-dark/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-gray-50 flex items-center justify-between bg-hw-blue/5">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-hw-blue text-white rounded-2xl">
                    <Bell size={20} />
                  </div>
                  <div>
                    <h3 className="font-display font-black text-gray-800">Ajuan Upgrade Role</h3>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Daftar Permohonan Anggota</p>
                  </div>
                </div>
                <button onClick={() => setIsUpgradeModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <X size={20} className="text-gray-400" />
                </button>
              </div>

              <div className="p-6 max-h-[60vh] overflow-y-auto space-y-4">
                {membersWithUpgradeRequests.length === 0 ? (
                  <div className="text-center py-10 space-y-3">
                    <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto text-gray-200">
                      <Bell size={32} />
                    </div>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Tidak ada ajuan baru</p>
                  </div>
                ) : (
                  (Array.isArray(membersWithUpgradeRequests) ? membersWithUpgradeRequests : []).map((m) => (
                    <div 
                      key={`req-${m.id}`}
                      className="p-4 rounded-3xl border border-gray-100 bg-gray-50/30 flex items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-hw-blue text-white flex items-center justify-center font-black text-xs">
                          {m.namaLengkap.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-800">{m.namaLengkap}</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {(Array.isArray(m.upgradeRequests) ? m.upgradeRequests : []).map((roleId: string) => (
                              <span key={roleId} className="px-1.5 py-0.5 bg-rose-50 text-rose-500 border border-rose-100 rounded text-[9px] font-black uppercase tracking-tighter">
                                {ROLE_LABELS[roleId] || roleId}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                      <button 
                        onClick={() => {
                          setIsUpgradeModalOpen(false);
                          handleOpenModal(m);
                        }}
                        className="px-4 py-2 bg-white border border-gray-200 text-hw-blue rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-hw-blue hover:text-white hover:border-hw-blue transition-all"
                      >
                        Proses
                      </button>
                    </div>
                  ))
                )}
              </div>
              
              <div className="p-6 bg-gray-50 text-[10px] text-gray-400 font-bold text-center uppercase tracking-widest">
                Klik 'Proses' untuk mengubah role anggota
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
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nama Lengkap</label>
                    <input 
                      type="text" 
                      value={formData.namaLengkap}
                      onChange={(e) => setFormData({...formData, namaLengkap: e.target.value})}
                      className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-3 px-4 font-bold text-sm focus:ring-4 focus:ring-hw-green/10 outline-none" 
                    />
                  </div>

                  {formData.upgradeRequests && formData.upgradeRequests.length > 0 && (
                    <div className="bg-rose-50 p-4 rounded-2xl border border-rose-100 space-y-3">
                       <h5 className="text-[10px] font-black text-rose-500 uppercase tracking-widest">Permohonan Upgrade Akses:</h5>
                       <div className="flex flex-col gap-2">
                         {formData.upgradeRequests.map((req, idx) => (
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
                                     upgradeRequests: formData.upgradeRequests.filter(r => r !== req)
                                   });
                                 }}
                                 className="px-3 py-1 bg-hw-green text-white text-[10px] font-black rounded-lg hover:bg-hw-green-dark transition-colors flex items-center gap-1"
                               >
                                 <Check size={10} /> APPROVE
                               </button>
                               <button 
                                 onClick={() => setFormData({...formData, upgradeRequests: formData.upgradeRequests.filter(r => r !== req)})}
                                 className="p-1 text-gray-400 hover:text-rose-500 transition-colors"
                                 title="Reject/Remove"
                               >
                                 <X size={14} />
                               </button>
                             </div>
                           </div>
                         ))}
                       </div>
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Email</label>
                    <input 
                      type="email" 
                      value={formData.email}
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
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                      placeholder={editingMember ? "••••••••" : "Masukkan password awal..."}
                      className="w-full bg-gray-50 border border-hw-blue/10 rounded-2xl py-3 px-4 font-bold text-sm focus:ring-4 focus:ring-hw-blue/10 outline-none" 
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Jenis Kelamin</label>
                      <select 
                        value={formData.jenisKelamin}
                        onChange={(e) => setFormData({...formData, jenisKelamin: e.target.value})}
                        className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-3 px-4 font-bold text-sm outline-none"
                      >
                        <option value="L">Laki-laki</option>
                        <option value="P">Perempuan</option>
                      </select>
                    </div>
                  <div className="space-y-2 col-span-1 sm:col-span-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Hak Akses (Role)</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {Object.entries(ROLE_LABELS).map(([key, label]) => {
                        // Skip admin roles for non-superadmins
                        if ((key === 'admin' || key === 'superadmin') && user?.role !== 'superadmin' && user?.role !== 'admin') return null;
                        if (key === 'superadmin' && user?.role !== 'superadmin') return null;

                        const isSelected = formData.roles.includes(key);
                        return (
                          <button
                            key={`role-opt-${key}`}
                            type="button"
                            onClick={() => {
                              const current = [...formData.roles];
                              let next;
                              if (isSelected) {
                                if (current.length > 1) {
                                  next = current.filter(k => k !== key);
                                } else {
                                  return; // Must have at least one role
                                }
                              } else {
                                next = [...current, key];
                              }
                              setFormData({ ...formData, roles: next, role: next[0] });
                            }}
                            className={cn(
                              "flex items-center gap-2 p-2.5 rounded-xl border text-[11px] font-bold transition-all text-left h-full",
                              isSelected
                                ? "bg-hw-green/10 border-hw-green/20 text-hw-green"
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
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Golongan</label>
                      <select 
                        value={formData.golongan}
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
                        value={formData.pendidikan}
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
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Pelatihan Diikuti</label>
                    <div className="grid grid-cols-2 gap-2">
                      {['Jati 1', 'Jati 2', 'Jari 1', 'Jari 2', 'Jawi'].map(p => (
                        <button 
                          key={p} type="button" 
                          onClick={() => {
                            const current = formData.pelatihan;
                            const next = current.includes(p) ? current.filter(i => i !== p) : [...current, p];
                            setFormData({...formData, pelatihan: next});
                          }}
                          className={`p-2.5 rounded-xl text-[10px] font-bold border-2 transition-all ${formData.pelatihan.includes(p) ? 'bg-hw-green/10 border-hw-green text-hw-green' : 'bg-gray-50 border-transparent text-gray-400'}`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Kwarda</label>
                      <input 
                        type="text" 
                        value={formData.asalKwarda}
                        onChange={(e) => setFormData({...formData, asalKwarda: e.target.value})}
                        placeholder="Banyumas"
                        className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-3 px-4 font-bold text-sm outline-none" 
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Qabilah</label>
                      <input 
                        type="text" 
                        value={formData.qabilah}
                        onChange={(e) => setFormData({...formData, qabilah: e.target.value})}
                        placeholder="Nama Qabilah"
                        className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-3 px-4 font-bold text-sm outline-none" 
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Alamat Lengkap</label>
                    <textarea 
                      value={formData.alamat}
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
                        value={formData.noHp}
                        onChange={(e) => setFormData({...formData, noHp: e.target.value})}
                        placeholder="08xxxx"
                        className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-3 px-4 font-bold text-sm outline-none" 
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Sosmed</label>
                      <input 
                        type="text" 
                        value={formData.sosmed}
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
                      value={materiFormData.judul}
                      onChange={(e) => setMateriFormData({...materiFormData, judul: e.target.value})}
                      className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-3 px-4 font-bold text-sm focus:ring-4 focus:ring-hw-green/10 outline-none" 
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Kategori</label>
                    <select 
                      value={materiFormData.kategori}
                      onChange={(e) => setMateriFormData({...materiFormData, kategori: e.target.value})}
                      className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-3 px-4 font-bold text-sm outline-none"
                    >
                      <option value="umum">Umum</option>
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
                      value={materiFormData.konten}
                      onChange={(e) => setMateriFormData({...materiFormData, konten: e.target.value})}
                      rows={5}
                      className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-3 px-4 font-bold text-sm focus:ring-4 focus:ring-hw-green/10 outline-none resize-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">URL Gambar Cover</label>
                    <input 
                      type="text" 
                      value={materiFormData.coverImage}
                      onChange={(e) => setMateriFormData({...materiFormData, coverImage: e.target.value})}
                      placeholder="https://..."
                      className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-3 px-4 font-bold text-sm outline-none" 
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">URL Google Drive (Download)</label>
                    <input 
                      type="text" 
                      value={materiFormData.driveUrl}
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
                            value={contentFormData.field1}
                            onChange={(e) => setContentFormData({...contentFormData, field1: e.target.value})}
                            placeholder="https://..."
                            className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-3 px-4 font-bold text-sm outline-none focus:ring-2 focus:ring-hw-green/20" 
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Konten Profil</label>
                          <textarea 
                            rows={8}
                            value={contentFormData.field2}
                            onChange={(e) => setContentFormData({...contentFormData, field2: e.target.value})}
                            className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-3 px-4 font-bold text-sm h-48 outline-none focus:ring-2 focus:ring-hw-green/20"
                            placeholder="Isi konten profil..."
                          />
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
                              value={(contentFormData as any)[item.field]}
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
                              value={(contentFormData as any)[item.field]}
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
                            value={contentFormData.field2}
                            onChange={(e) => setContentFormData({...contentFormData, field2: e.target.value})}
                            placeholder="Judul Video..."
                            className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-3 px-4 font-bold text-sm outline-none focus:ring-2 focus:ring-hw-green/20" 
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">URL Video Youtube</label>
                          <input 
                            type="text" 
                            value={contentFormData.field1}
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
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Judul Audio/Mars</label>
                          <input 
                            type="text" 
                            value={contentFormData.field2}
                            onChange={(e) => setContentFormData({...contentFormData, field2: e.target.value})}
                            placeholder="Judul Audio..."
                            className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-3 px-4 font-bold text-sm outline-none focus:ring-2 focus:ring-hw-green/20" 
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Link File (Google Drive/Audio URL)</label>
                          <input 
                            type="text" 
                            value={contentFormData.field1}
                            onChange={(e) => setContentFormData({...contentFormData, field1: e.target.value})}
                            placeholder="https://drive.google.com/file/d/..."
                            className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-3 px-4 font-bold text-sm outline-none focus:ring-2 focus:ring-hw-green/20" 
                          />
                          <p className="px-2 text-[9px] text-gray-400 font-bold italic">*Pastikan link Drive sudah diatur "Siaoa saja yang memiliki link dapat melihat"</p>
                        </div>
                      </div>
                    )}

                    {selectedContentSection === 'doa' && (
                      <div className="space-y-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nama Doa / Judul</label>
                          <input 
                            type="text" 
                            value={contentFormData.field2}
                            onChange={(e) => setContentFormData({...contentFormData, field2: e.target.value})}
                            className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-3 px-4 font-bold text-sm outline-none focus:ring-2 focus:ring-hw-green/20" 
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Tulisan Arab</label>
                          <textarea 
                            value={contentFormData.field1}
                            onChange={(e) => setContentFormData({...contentFormData, field1: e.target.value})}
                            className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-3 px-4 font-bold text-lg text-right h-24 outline-none font-arabic focus:ring-2 focus:ring-hw-green/20" 
                            dir="rtl"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Teks Latin</label>
                          <textarea 
                            value={contentFormData.field3}
                            onChange={(e) => setContentFormData({...contentFormData, field3: e.target.value})}
                            className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-3 px-4 font-bold text-xs h-20 outline-none italic focus:ring-2 focus:ring-hw-green/20" 
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Terjemahan</label>
                          <textarea 
                            value={contentFormData.field4}
                            onChange={(e) => setContentFormData({...contentFormData, field4: e.target.value})}
                            className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-3 px-4 font-bold text-xs h-20 outline-none focus:ring-2 focus:ring-hw-green/20" 
                          />
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
            <div className="fixed inset-0 z-[110] flex items-center justify-center px-4 py-6">
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
                    value={rejectReason}
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
            <div className="fixed inset-0 z-[110] flex items-center justify-center px-4 py-6">
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
                    value={trainingRejectReason}
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
            <div className="fixed inset-0 z-[110] flex items-center justify-center px-4 py-6">
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
                          <span className="font-bold uppercase tracking-wider text-[10px] text-emerald-900">Analisis Kinerja Peserta:</span>
                          <span className="text-[9px] bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded-full font-black uppercase tracking-wider">Auto Formula</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-[11px] text-emerald-700">
                          <div>• Presensi: <span className="font-extrabold text-emerald-900">{calc.attendancePercentage}%</span> <span className="text-[9px] text-emerald-600">({calc.attendedSessions}/{calc.totalSessions})</span></div>
                          <div>• Penugasan: <span className="font-extrabold text-emerald-900">{calc.assignmentPercentage}%</span> <span className="text-[9px] text-emerald-600">({calc.submittedAssignedCount}/{calc.totalAssignedTasks})</span></div>
                        </div>
                        <div className="flex justify-between items-center pt-1.5 border-t border-emerald-100/50 text-[11px] font-bold">
                          <div>Rata-rata: <span className="font-black text-emerald-950 text-sm">{calc.finalPercentage}%</span></div>
                          <div>Saran Status: <span className="font-black text-emerald-950 text-sm underline">{calc.calculatedStatus}</span></div>
                        </div>
                      </div>
                    );
                  })()}

                  <div className="space-y-4">
                    {/* Status Kelulusan */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Status Kelulusan</label>
                      <select 
                        value={graduationStatusInput}
                        onChange={(e) => setGraduationStatusInput(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-150 rounded-2xl py-3 px-4 font-bold text-sm outline-none focus:ring-4 focus:ring-hw-green/10"
                      >
                        <option value="Lulus">Lulus</option>
                        <option value="Lulus Bersyarat">Lulus Bersyarat</option>
                        <option value="Tidak Lulus">Tidak Lulus</option>
                      </select>
                    </div>

                    {/* Nilai / Grade */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nilai / Predikat</label>
                      <input 
                        type="text" 
                        value={gradeInput}
                        onChange={(e) => setGradeInput(e.target.value)}
                        placeholder="Contoh: A, B+, 85, Lulus Memuaskan, dll."
                        className="w-full bg-gray-50 border border-gray-150 rounded-2xl py-3 px-4 font-bold text-sm outline-none focus:ring-4 focus:ring-hw-green/10" 
                      />
                    </div>

                    {/* Ulasan / Remarks */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Ulasan / Catatan Pelatih</label>
                      <textarea 
                        value={remarkInput}
                        onChange={(e) => setRemarkInput(e.target.value)}
                        placeholder="Tuliskan ulasan tugas atau pesan untuk peserta..."
                        rows={4}
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
            <div className="fixed inset-0 z-[110] flex items-center justify-center px-4 py-6">
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
                        value={assignTaskInstruksi}
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
                        value={assignTaskDeadline}
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
            <div className="fixed inset-0 z-[115] flex items-center justify-center px-4 py-6">
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
                className="relative w-full max-w-lg bg-white rounded-[2rem] shadow-2xl overflow-hidden p-6 z-10"
              >
                <div className="space-y-5">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                    <div>
                      <h3 className="text-base font-black text-gray-800 uppercase tracking-wider flex items-center gap-2">
                        <UserPlus className="text-hw-green" size={18} /> Tambah Peserta Pelatihan
                      </h3>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">Daftarkan Anggota KTA yang Sudah Terdaftar</p>
                    </div>
                    <button 
                      onClick={() => { setIsAddParticipantModalOpen(false); setAddParticipantSelectedMemberId(''); }}
                      className="p-2 hover:bg-gray-50 rounded-full transition-colors text-gray-400 hover:text-gray-600"
                    >
                      <X size={16} />
                    </button>
                  </div>

                  <div className="space-y-4">
                    {/* Search Field */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Cari Anggota Terdaftar (KTA)</label>
                      <div className="relative">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                        <input 
                          type="text" 
                          placeholder="Ketik nama, email, atau NIK anggota..."
                          value={addParticipantSearchQuery}
                          onChange={(e) => setAddParticipantSearchQuery(e.target.value)}
                          className="w-full bg-gray-50 border border-gray-150 rounded-2xl py-2.5 pl-10 pr-4 font-bold text-xs outline-none focus:ring-4 focus:ring-hw-green/10" 
                        />
                      </div>
                    </div>

                    {/* Member selection list / Selected Indicator */}
                    {addParticipantSelectedMemberId ? (
                      (() => {
                        const m = members.find(x => String(x.id) === String(addParticipantSelectedMemberId));
                        if (!m) return null;
                        return (
                          <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-start gap-3">
                            <CheckCircle2 className="text-emerald-500 mt-0.5 shrink-0" size={16} />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-extrabold text-emerald-900">{m.namaLengkap}</p>
                              <p className="text-[10px] text-emerald-700 truncate">{m.email} | NIK: {m.nik || '-'}</p>
                              <p className="text-[9px] text-emerald-600 font-bold uppercase tracking-wider mt-0.5">
                                Kwarda: {m.asalKwarda || '-'} | Qabilah: {m.qabilah || '-'}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => setAddParticipantSelectedMemberId('')}
                              className="text-[9px] font-black uppercase text-rose-600 hover:text-rose-800 tracking-wider bg-rose-50 px-2 py-1 rounded-lg border border-rose-150/30"
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
                              m.namaLengkap?.toLowerCase().includes(q) ||
                              m.email?.toLowerCase().includes(q) ||
                              m.nik?.includes(q) ||
                              m.noHp?.includes(q)
                            );
                          }).slice(0, 10).length === 0 ? (
                            <p className="text-center text-[11px] font-bold text-gray-400 py-6">Tidak ada anggota terdaftar yang cocok</p>
                          ) : (
                            members.filter(m => {
                              if (!addParticipantSearchQuery.trim()) return true;
                              const q = addParticipantSearchQuery.toLowerCase();
                              return (
                                m.namaLengkap?.toLowerCase().includes(q) ||
                                m.email?.toLowerCase().includes(q) ||
                                m.nik?.includes(q) ||
                                m.noHp?.includes(q)
                              );
                            }).slice(0, 5).map(m => (
                              <button
                                key={m.id}
                                type="button"
                                onClick={() => {
                                  setAddParticipantSelectedMemberId(m.id);
                                  setAddParticipantPelatihGolongan(m.pelatihGolongan || 'Tunas Athfal');
                                }}
                                className="w-full p-2.5 flex items-center justify-between hover:bg-white rounded-xl text-left transition-colors"
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

                    {/* Training Level */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Pilih Tingkat Pelatihan</label>
                      <select 
                        value={addParticipantLevel}
                        onChange={(e) => setAddParticipantLevel(e.target.value as any)}
                        className="w-full bg-gray-50 border border-gray-150 rounded-2xl py-2.5 px-4 font-bold text-xs outline-none focus:ring-4 focus:ring-hw-green/10"
                      >
                        <option value="Jati 1">Jati 1 (Jaya Melati 1)</option>
                        <option value="Jati 2">Jati 2 (Jaya Melati 2)</option>
                        <option value="Jari 1">Jari 1 (Jaya Matahari 1)</option>
                      </select>
                    </div>

                    {/* Pelatih Golongan */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Pelatih Golongan</label>
                      <select 
                        value={addParticipantPelatihGolongan}
                        onChange={(e) => setAddParticipantPelatihGolongan(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-150 rounded-2xl py-2.5 px-4 font-bold text-xs outline-none focus:ring-4 focus:ring-hw-green/10"
                      >
                        {['Tunas Athfal', 'Athfal', 'Pengenal', 'Penghela', 'Penuntun'].map(g => (
                          <option key={g} value={g}>{g}</option>
                        ))}
                      </select>
                    </div>

                    {/* Lokasi Pelatihan */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Lokasi Pelatihan</label>
                      <select 
                        value={addParticipantLokasi || (Array.isArray(settings.trainingLocations) && settings.trainingLocations[0]) || ''}
                        onChange={(e) => setAddParticipantLokasi(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-150 rounded-2xl py-2.5 px-4 font-bold text-xs outline-none focus:ring-4 focus:ring-hw-green/10"
                      >
                        {Array.isArray(settings.trainingLocations) && settings.trainingLocations.length > 0 ? (
                          settings.trainingLocations.map(loc => (
                            <option key={loc} value={loc}>{loc}</option>
                          ))
                        ) : (
                          <option value="">Belum ada lokasi yang dikonfigurasi</option>
                        )}
                      </select>
                    </div>

                    {/* Tanggal Pelatihan */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Tanggal Pelaksanaan</label>
                      <select 
                        value={addParticipantTanggal || (Array.isArray(settings.trainingDates) && settings.trainingDates[0]) || ''}
                        onChange={(e) => setAddParticipantTanggal(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-150 rounded-2xl py-2.5 px-4 font-bold text-xs outline-none focus:ring-4 focus:ring-hw-green/10"
                      >
                        {Array.isArray(settings.trainingDates) && settings.trainingDates.length > 0 ? (
                          settings.trainingDates.map(dt => (
                            <option key={dt} value={dt}>{dt}</option>
                          ))
                        ) : (
                          <option value="">Belum ada tanggal yang dikonfigurasi</option>
                        )}
                      </select>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2 border-t border-gray-100">
                    <button
                      onClick={() => { setIsAddParticipantModalOpen(false); setAddParticipantSelectedMemberId(''); }}
                      className="flex-1 py-3 bg-gray-50 hover:bg-gray-100 rounded-xl text-xs font-bold text-gray-500 transition-colors"
                    >
                      Batal
                    </button>
                    <button
                      onClick={handleAddParticipant}
                      disabled={isSubmittingAddParticipant || !addParticipantSelectedMemberId}
                      className="flex-2 py-3 bg-hw-green hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-hw-green/10 disabled:opacity-40 flex items-center justify-center gap-1.5"
                    >
                      {isSubmittingAddParticipant ? 'Mendaftarkan...' : 'Daftarkan Peserta'}
                    </button>
                  </div>
                </div>
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
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Nama Lengkap</label>
                      <input 
                        type="text" 
                        required
                        value={editingKtaApp.nama}
                        onChange={(e) => setEditingKtaApp({ ...editingKtaApp, nama: e.target.value })}
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200/50 rounded-xl focus:ring-2 focus:ring-hw-green/20 outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">NIK</label>
                      <input 
                        type="text" 
                        required
                        maxLength={16}
                        value={editingKtaApp.nik || ''}
                        onChange={(e) => setEditingKtaApp({ ...editingKtaApp, nik: e.target.value.replace(/\D/g, '') })}
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200/50 rounded-xl focus:ring-2 focus:ring-hw-green/20 outline-none font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Tingkatan HW</label>
                      <select 
                        value={editingKtaApp.tingkatan}
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
                        value={editingKtaApp.asalDaerah}
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
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Asal Qabilah (Sekolah / Pangkalan PTMA)</label>
                    <input 
                      type="text" 
                      required
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
                        value={editingKtaApp.noWa}
                        onChange={(e) => setEditingKtaApp({ ...editingKtaApp, noWa: e.target.value })}
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200/50 rounded-xl focus:ring-2 focus:ring-hw-green/20 outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Email</label>
                      <input 
                        type="email" 
                        required
                        value={editingKtaApp.email}
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
                      value={editingKtaApp.alamat}
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
                        value={editingKtaApp.status}
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

        {loading && (
          <div key="global-loading-overlay" className="fixed inset-0 z-[999] bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <div className="w-16 h-16 border-4 border-hw-green border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>
    );
  }


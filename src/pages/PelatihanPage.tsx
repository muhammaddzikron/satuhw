import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Award, 
  BookOpen, 
  Calendar, 
  CheckCircle2, 
  ChevronRight, 
  ChevronLeft,
  ClipboardList, 
  Clock, 
  Download, 
  ExternalLink, 
  FileText, 
  GraduationCap, 
  Layers, 
  Loader2, 
  Lock, 
  Shield, 
  User, 
  Users, 
  X, 
  Play, 
  RefreshCw,
  Search,
  Check,
  AlertCircle,
  TrendingUp,
  Info,
  Pencil
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { sheetsService } from '../services/sheetsService';

interface TrainingProgram {
  id: 'Jati 1' | 'Jati 2' | 'Jari 1';
  title: string;
  subtitle: string;
  description: string;
  fee: string;
  requirements: string[];
  sessions: { id: string; title: string; description: string }[];
  assignments: { id: string; title: string; description: string }[];
}

const TRAINING_PROGRAMS: TrainingProgram[] = [
  {
    id: 'Jati 1',
    title: 'JATI 1',
    subtitle: 'Jaya Melati 1',
    description: 'Pelatihan kepemimpinan tingkat dasar bagi calon Pembina Gerakan Kepanduan Hizbul Wathan untuk membekali dasar-dasar kepemimpinan, kepanduan Islami, dan manajemen qabilah.',
    fee: 'Rp 50.000',
    requirements: [
      'Usia minimal 17 tahun atau sudah menikah',
      'Anggota Muhammadiyah/Ortom atau simpatisan berkomitmen',
      'Mendapat rekomendasi dari Pimpinan Cabang/Daerah Muhammadiyah',
      'Mengisi formulir pendaftaran resmi & melunasi biaya administrasi'
    ],
    sessions: [
      { id: 'Sesi 1', title: 'Upacara Pembukaan – 45 menit', description: 'Materi Jaya Melati 1 Sesuai Kurikulum' },
      { id: 'Sesi 2', title: 'Sasaran Pelatihan – 45 menit', description: 'Materi Jaya Melati 1 Sesuai Kurikulum' },
      { id: 'Sesi 3', title: 'Dinamika Kelompok – 45 menit', description: 'Materi Jaya Melati 1 Sesuai Kurikulum' },
      { id: 'Sesi 4', title: 'Pengembangan Sasaran Pelatihan – 45 menit', description: 'Materi Jaya Melati 1 Sesuai Kurikulum' },
      { id: 'Sesi 5', title: 'Kemuhammadiyahan – 90 menit', description: 'Materi Jaya Melati 1 Sesuai Kurikulum' },
      { id: 'Sesi 6', title: 'Sejarah Singkat Kepanduan Hizbul Wathan – 45 menit', description: 'Materi Jaya Melati 1 Sesuai Kurikulum' },
      { id: 'Sesi 7', title: 'AD dan ART HW – 45 menit', description: 'Materi Jaya Melati 1 Sesuai Kurikulum' },
      { id: 'Sesi 8', title: 'Jati Diri Kepanduan Hizbul Wathan – 45 menit', description: 'Materi Jaya Melati 1 Sesuai Kurikulum' },
      { id: 'Sesi 9', title: 'Prinsip Dasar Kepanduan dan Metode – 90 menit', description: 'Materi Jaya Melati 1 Sesuai Kurikulum' },
      { id: 'Sesi 10', title: 'Kode Kehormatan Pandu Hizbul Wathan – 90 menit', description: 'Materi Jaya Melati 1 Sesuai Kurikulum' },
      { id: 'Sesi 11', title: 'Lambang, Simbol, dan Motto HW – 45 menit', description: 'Materi Jaya Melati 1 Sesuai Kurikulum' },
      { id: 'Sesi 12', title: 'Organisasi Gerakan Kepanduan HW – 45 menit', description: 'Materi Jaya Melati 1 Sesuai Kurikulum' },
      { id: 'Sesi 13', title: 'Qaidah Organisasi Otonom Muhammadiyah – 45 menit', description: 'Materi Jaya Melati 1 Sesuai Kurikulum' },
      { id: 'Sesi 14', title: 'Organisasi Qabilah – 45 menit', description: 'Materi Jaya Melati 1 Sesuai Kurikulum' },
      { id: 'Sesi 15', title: 'Program Kegiatan Peserta Didik – 45 menit', description: 'Materi Jaya Melati 1 Sesuai Kurikulum' },
      { id: 'Sesi 16', title: 'Dewan Satuan – 45 menit', description: 'Materi Jaya Melati 1 Sesuai Kurikulum' },
      { id: 'Sesi 17', title: 'Forum Silaturrahim Pandu – 45 menit', description: 'Materi Jaya Melati 1 Sesuai Kurikulum' },
      { id: 'Sesi 18', title: 'Memahami Peserta Didik dan Kebutuhannya – 45 menit', description: 'Materi Jaya Melati 1 Sesuai Kurikulum' },
      { id: 'Sesi 19', title: 'Kegiatan Bermutu, Menarik, Menyenangkan, Meningkat, dan Mengandung Pendidikan Islami – 90 menit', description: 'Materi Jaya Melati 1 Sesuai Kurikulum' },
      { id: 'Sesi 20', title: 'Cara Membina Peserta Didik – 45 menit', description: 'Materi Jaya Melati 1 Sesuai Kurikulum' },
      { id: 'Sesi 21', title: 'Uswatun Hasanah – 45 menit', description: 'Materi Jaya Melati 1 Sesuai Kurikulum' },
      { id: 'Sesi 22', title: 'Adab Bergaul – 45 menit', description: 'Materi Jaya Melati 1 Sesuai Kurikulum' },
      { id: 'Sesi 23', title: 'Mengelola Satuan – 45 menit', description: 'Materi Jaya Melati 1 Sesuai Kurikulum' },
      { id: 'Sesi 24', title: 'Peran, Fungsi, dan Tanggung Jawab Pemimpin Satuan – 45 menit', description: 'Materi Jaya Melati 1 Sesuai Kurikulum' },
      { id: 'Sesi 25', title: 'Syarat Kenaikan Tingkat, Tanda Kenaikan Tingkat, Syarat Kecakapan Pandu, dan Tanda Kecakapan Pandu (SKT, TKT, SKP, TKT) – 90 menit', description: 'Materi Jaya Melati 1 Sesuai Kurikulum' },
      { id: 'Sesi 26', title: 'Upacara sebagai Alat Pendidikan – 90 menit', description: 'Materi Jaya Melati 1 Sesuai Kurikulum' },
      { id: 'Sesi 27', title: 'Pelantikan sebagai Alat Pendidikan – 45 menit', description: 'Materi Jaya Melati 1 Sesuai Kurikulum' },
      { id: 'Sesi 28', title: 'Tadabbur Alam – 270 menit', description: 'Materi Jaya Melati 1 Sesuai Kurikulum' },
      { id: 'Sesi 29', title: 'Perkemahan sebagai Alat Pendidikan – 45 menit', description: 'Materi Jaya Melati 1 Sesuai Kurikulum' },
      { id: 'Sesi 30', title: 'Pentas Seni dan Api Unggun sebagai Alat Pendidikan – 45 menit', description: 'Materi Jaya Melati 1 Sesuai Kurikulum' },
      { id: 'Sesi 31', title: 'Seragam dan Atribut – 90 menit', description: 'Materi Jaya Melati 1 Sesuai Kurikulum' },
      { id: 'Sesi 32', title: 'Bina Karya Mandiri Kepanduan HW – 45 menit', description: 'Materi Jaya Melati 1 Sesuai Kurikulum' },
      { id: 'Sesi 33', title: 'Forum Terbuka – 90 menit', description: 'Materi Jaya Melati 1 Sesuai Kurikulum' },
      { id: 'Sesi 34', title: 'Rencana Tindak Lanjut (RTL) – 45 menit', description: 'Materi Jaya Melati 1 Sesuai Kurikulum' },
      { id: 'Sesi 35', title: 'Evaluasi – 45 menit', description: 'Materi Jaya Melati 1 Sesuai Kurikulum' },
      { id: 'Sesi 36', title: 'Upacara Penutupan – 45 menit', description: 'Materi Jaya Melati 1 Sesuai Kurikulum' }
    ],
    assignments: [
      { id: 'tugas-1', title: 'Resume Jatidiri HW', description: 'Membuat resume tertulis tentang sejarah dan jatidiri Kepanduan HW minimal 2 halaman.' },
      { id: 'tugas-2', title: 'Rencana Kerja Satuan', description: 'Menyusun draf rencana program kerja mingguan dan bulanan untuk satu qabilah.' }
    ]
  },
  {
    id: 'Jati 2',
    title: 'JATI 2',
    subtitle: 'Jaya Melati 2',
    description: 'Pelatihan kepemimpinan tingkat lanjutan untuk memperdalam strategi pembinaan, metodologi kepelatihan instruktur, serta manajemen taktis organisasi kwartir.',
    fee: 'Rp 50.000',
    requirements: [
      'Telah lulus Jaya Melati 1 (Jati 1) minimal 6 bulan',
      'Aktif membina di Qabilah atau Satuan secara konsisten',
      'Mendapat rekomendasi dari Kwartir Daerah setempat',
      'Mengisi formulir pendaftaran resmi & melunasi biaya administrasi'
    ],
    sessions: [
      { id: 'Sesi 1', title: 'Dinamika Kelompok Lanjutan', description: 'Metode interaktif memimpin kelompok, fasilitasi, serta penyelesaian konflik.' },
      { id: 'Sesi 2', title: 'Manajemen Strategis Kwartir', description: 'Perencanaan strategis, kebijakan organisasi, serta tata kelola kwartir daerah.' },
      { id: 'Sesi 3', title: 'Desain Instruksional Pelatihan', description: 'Metode penyusunan kurikulum pelatihan, silabus, materi ajar, serta teknik evaluasi.' },
      { id: 'Sesi 4', title: 'Uji Syarat Kenaikan Tingkat', description: 'Sistem evaluasi, pengujian SKU/SKK, serta tata upacara pelantikan anggota.' }
    ],
    assignments: [
      { id: 'tugas-1', title: 'Analisis Kebutuhan Latihan', description: 'Membuat dokumen analisis hambatan pembinaan di qabilah masing-masing beserta solusinya.' },
      { id: 'tugas-2', title: 'Desain Modul Sesi Latih', description: 'Menyusun silabus lengkap beserta draf modul pembelajaran untuk salah satu sesi Jati 1.' }
    ]
  },
  {
    id: 'Jari 1',
    title: 'JARI 1',
    subtitle: 'Jaya Melati Muda 1',
    description: 'Pelatihan bagi kader remaja/muda Hizbul Wathan untuk membekali kemampuan teknis memimpin regu, survival lapangan, sandi, kompas, serta pertolongan pertama.',
    fee: 'Rp 50.000',
    requirements: [
      'Anggota aktif golongan Pengenal / Penghela',
      'Telah lulus SKU tingkat tertinggi di golongannya',
      'Mendapat rekomendasi tertulis dari Ketua Qabilah/Sekolah',
      'Mengisi formulir pendaftaran resmi & melunasi biaya administrasi'
    ],
    sessions: [
      { id: 'Sesi 1', title: 'Kepemimpinan Dewan Pasukan', description: 'Peran Pratama, Pinru, Wapinru, serta manajemen dewan pasukan.' },
      { id: 'Sesi 2', title: 'Teknik Survival & Kompas', description: 'Navigasi darat, membaca peta pita, kompas bidik, serta survival alam bebas.' },
      { id: 'Sesi 3', title: 'Semaphore, Morse & Sandi', description: 'Keterampilan komunikasi visual jarak jauh menggunakan bendera, peluit, dan sandi.' },
      { id: 'Sesi 4', title: 'PPGD & Evakuasi Medis', description: 'Pertolongan pertama gawat darurat, penanganan luka, pembidaian, serta teknik tandu.' }
    ],
    assignments: [
      { id: 'tugas-1', title: 'Video Praktik Semaphore/Morse', description: 'Mengunggah video berdurasi minimal 1 menit mempraktikkan pengiriman pesan semaphore/morse.' },
      { id: 'tugas-2', title: 'Laporan Peta Pita Lapangan', description: 'Menggambar peta pita perjalanan sejauh minimal 1 km lengkap dengan keterangan kompas.' }
    ]
  }
];

export default function PelatihanPage() {
  const navigate = useNavigate();
  const { user, isAuthenticated, activeRole } = useAuthStore();
  
  const [selectedLevel, setSelectedLevel] = useState<'Jati 1' | 'Jati 2' | 'Jari 1'>('Jati 1');
  const [perspective, setPerspective] = useState<'peserta' | 'admin'>('peserta');
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState<any[]>([]);
  const [userApp, setUserApp] = useState<any | null>(null);
  
  // Tab within details
  const [activeTab, setActiveTab] = useState<'info' | 'sesi' | 'tugas' | 'materi' | 'piagam'>('info');
  const [materiList, setMateriList] = useState<any[]>([]);
  const [loadingMateri, setLoadingMateri] = useState(false);
  
  // Submit task state
  const [taskTitle, setTaskTitle] = useState('');
  const [taskLink, setTaskLink] = useState('');
  const [submittingTask, setSubmittingTask] = useState(false);
  
  // Admin interaction state
  const [searchQuery, setSearchQuery] = useState('');
  const [gradingApp, setGradingApp] = useState<any | null>(null);
  const [gradeInput, setGradeInput] = useState('');
  const [remarkInput, setRemarkInput] = useState('');
  const [passingStatus, setPassingStatus] = useState('Lulus');
  const [actionLoading, setActionLoading] = useState(false);
  
  // User interactive attendance states
  const [activeEditSession, setActiveEditSession] = useState<string | null>(null);
  const [savingAttendance, setSavingAttendance] = useState<Record<string, boolean>>({});

  const getAttendanceStatus = (attendanceMap: any, sesId: string): string => {
    const item = attendanceMap[sesId];
    if (!item) return 'belum';
    if (typeof item === 'object' && item !== null) {
      return item.status || 'belum';
    }
    return item;
  };

  const getAttendanceTimestamp = (attendanceMap: any, sesId: string): string | null => {
    const item = attendanceMap[sesId];
    if (item && typeof item === 'object' && item !== null) {
      return item.timestamp || null;
    }
    return null;
  };

  const handleUserSubmitAttendance = async (sessionId: string, status: string) => {
    if (!userApp) return;
    try {
      setSavingAttendance(prev => ({ ...prev, [sessionId]: true }));
      let attendanceMap: Record<string, any> = {};
      try {
        attendanceMap = userApp.kehadiran ? (typeof userApp.kehadiran === 'string' ? JSON.parse(userApp.kehadiran) : userApp.kehadiran) : {};
        if (typeof attendanceMap !== 'object') attendanceMap = {};
      } catch (err) {
        attendanceMap = {};
      }

      const now = new Date();
      const dateStr = now.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' });
      const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
      const timestamp = `${dateStr} pukul ${timeStr}`;

      attendanceMap[sessionId] = {
        status: status,
        timestamp: timestamp
      };

      await sheetsService.updateAttendance(userApp.id, JSON.stringify(attendanceMap));
      
      // Update local state directly so we don't have to wait or see flash
      const updatedUserApp = { ...userApp, kehadiran: JSON.stringify(attendanceMap) };
      setUserApp(updatedUserApp);
      
      // Also update in the applications array
      setApplications(prev => prev.map(app => app.id === userApp.id ? updatedUserApp : app));

      setActiveEditSession(null);
      alert(`Presensi ${status === 'hadir' ? 'Hadir' : status === 'izin' ? 'Izin' : 'Tidak Hadir'} berhasil disimpan!`);
      loadData();
    } catch (err: any) {
      alert('Gagal menyimpan presensi: ' + err.message);
    } finally {
      setSavingAttendance(prev => ({ ...prev, [sessionId]: false }));
    }
  };

  const isAdminOrSimulated = user?.role === 'admin' || user?.role === 'superadmin' || user?.role === 'sugli' || user?.role === 'kwarda' || perspective === 'admin';

  const isLevelActiveOrApproved = (() => {
    if (!isAuthenticated) return false;
    if (isAdminOrSimulated) return true;

    const levelRoleMap: Record<string, string> = {
      'Jati 1': 'jati1',
      'Jati 2': 'jati2',
      'Jari 1': 'jari1'
    };
    const requiredRole = levelRoleMap[selectedLevel];
    
    const isMemberOfThisLevel = 
      user?.role === requiredRole || 
      user?.activeRole === requiredRole || 
      user?.roles?.includes(requiredRole as any);

    const isAttendingLevel = userApp && userApp.status === 'approved';

    return isMemberOfThisLevel || isAttendingLevel;
  })();

  const loadData = async () => {
    try {
      setLoading(true);
      const apps = await sheetsService.getTrainingApplications();
      setApplications(apps || []);
      
      if (user) {
        // Find matching application for user for currently selected level
        const myApp = apps?.find((a: any) => 
          (a.email === user.email || a.userId === user.id) && 
          (a.pelatihanAkanDiikuti || '').toLowerCase().trim().replace(/\s+/g, '') === selectedLevel.toLowerCase().replace(/\s+/g, '')
        );
        setUserApp(myApp || null);
      } else {
        setUserApp(null);
      }

      // Fetch materials for the active level
      setLoadingMateri(true);
      const levelKey = selectedLevel === 'Jati 1' ? 'jati1' : selectedLevel === 'Jati 2' ? 'jati2' : 'jari1';
      try {
        const mats = await sheetsService.getMateri(levelKey);
        setMateriList(mats || []);
      } catch (err) {
        console.error('Failed to load materials for level:', levelKey, err);
      } finally {
        setLoadingMateri(false);
      }
    } catch (err) {
      console.error('Failed to load training applications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedLevel, isAuthenticated, user]);

  // Set default perspective based on actual user role
  useEffect(() => {
    const isRealAdmin = user?.role === 'admin' || user?.role === 'superadmin' || user?.role === 'sugli' || user?.role === 'kwarda';
    if (isRealAdmin) {
      setPerspective('admin');
    } else {
      setPerspective('peserta');
    }
  }, [user]);

  const program = TRAINING_PROGRAMS.find(p => p.id === selectedLevel)!;

  const hasMateriAccess = () => {
    if (!user) return false;
    
    // 1. Is administrator? (admin/superadmin/sugli/kwarda)
    const isAdmin = user.role === 'admin' || user.role === 'superadmin' || user.role === 'sugli' || user.role === 'kwarda';
    if (isAdmin) return true;
    
    // 2. Is simulated admin perspective active?
    if (perspective === 'admin') return true;

    // 3. Has active approved application for this level?
    if (userApp && (userApp.status === 'approved' || userApp.statusKelulusan === 'Lulus')) {
      return true;
    }

    // 4. Has already completed/taken this level (recorded in pelatihan array or role name)?
    const normalizedSelectedLevel = selectedLevel.toLowerCase().replace(/\s+/g, ''); // e.g. 'jati1'
    
    // Check main role or secondary roles
    const userRoles = user.roles || [user.role];
    const hasMatchingRole = userRoles.some(r => r.toLowerCase().replace(/\s+/g, '') === normalizedSelectedLevel);
    if (hasMatchingRole) return true;

    // Check user.pelatihan array
    const userPelatihan = user.pelatihan || [];
    const hasCompletedLevel = userPelatihan.some(p => {
      const normalizedP = p.toLowerCase().replace(/\s+/g, '');
      return normalizedP === normalizedSelectedLevel || normalizedP === selectedLevel.toLowerCase().replace(/\s+/g, '');
    });
    if (hasCompletedLevel) return true;

    return false;
  };

  // Filter applications for selected level
  const filteredApps = applications.filter(app => {
    const matchesLevel = (app.pelatihanAkanDiikuti || '').toLowerCase().trim().replace(/\s+/g, '') === selectedLevel.toLowerCase().replace(/\s+/g, '');
    const matchesQuery = !searchQuery ? true : (
      (app.nama || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (app.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (app.asalDaerah || '').toLowerCase().includes(searchQuery.toLowerCase())
    );
    return matchesLevel && matchesQuery;
  });

  // Handle participant submitting assignment
  const handleUserSubmitTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userApp) {
      alert('Anda belum terdaftar atau pendaftaran belum disetujui untuk level pelatihan ini.');
      return;
    }
    if (!taskTitle || !taskLink) {
      alert('Mohon isi judul tugas dan tautan (link) pengumpulan tugas.');
      return;
    }

    setSubmittingTask(true);
    try {
      let currentTasks: any[] = [];
      try {
        currentTasks = userApp.tugas ? (typeof userApp.tugas === 'string' ? JSON.parse(userApp.tugas) : userApp.tugas) : [];
        if (!Array.isArray(currentTasks)) currentTasks = [];
      } catch (err) {
        currentTasks = [];
      }

      const newTask = {
        title: taskTitle,
        link: taskLink,
        submittedAt: new Date().toISOString()
      };

      const updatedTasks = [...currentTasks, newTask];
      await sheetsService.submitAssignment(userApp.id, JSON.stringify(updatedTasks));
      alert('Tugas berhasil dikumpulkan!');
      setTaskTitle('');
      setTaskLink('');
      loadData();
    } catch (err: any) {
      alert('Gagal mengumpulkan tugas: ' + err.message);
    } finally {
      setSubmittingTask(false);
    }
  };

  // Admin approves/rejects application
  const handleUpdateStatus = async (appId: string, status: 'approved' | 'rejected') => {
    if (!window.confirm(`Apakah Anda yakin ingin ${status === 'approved' ? 'menyetujui' : 'menolak'} pendaftaran ini?`)) return;
    try {
      setActionLoading(true);
      await sheetsService.updateTrainingStatus(appId, status, status === 'approved' ? 'Pendaftaran disetujui oleh admin' : 'Pendaftaran ditolak');
      alert(`Pendaftaran berhasil ${status === 'approved' ? 'disetujui' : 'ditolak'}!`);
      loadData();
    } catch (err: any) {
      alert('Gagal mengupdate status: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Admin updates attendance for a specific session
  const handleToggleAttendance = async (app: any, sessionId: string, status: string) => {
    try {
      let attendanceMap: Record<string, any> = {};
      try {
        attendanceMap = app.kehadiran ? (typeof app.kehadiran === 'string' ? JSON.parse(app.kehadiran) : app.kehadiran) : {};
        if (typeof attendanceMap !== 'object') attendanceMap = {};
      } catch (err) {
        attendanceMap = {};
      }

      const now = new Date();
      const dateStr = now.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' });
      const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
      const timestamp = `${dateStr} pukul ${timeStr} (oleh Admin)`;

      attendanceMap[sessionId] = {
        status: status,
        timestamp: timestamp
      };

      await sheetsService.updateAttendance(app.id, JSON.stringify(attendanceMap));
      loadData();
    } catch (err: any) {
      alert('Gagal mengupdate kehadiran: ' + err.message);
    }
  };

  // Admin opens grading dialog
  const openGradingDialog = (app: any) => {
    setGradingApp(app);
    setGradeInput(app.nilai || '');
    setRemarkInput(app.remark || '');
    setPassingStatus(app.statusKelulusan || 'Lulus');
  };

  // Admin saves grade/passing status
  const handleSaveGrade = async () => {
    if (!gradingApp) return;
    try {
      setActionLoading(true);
      await sheetsService.updateGrade(gradingApp.id, {
        grade: gradeInput,
        remark: remarkInput,
        statusKelulusan: passingStatus
      });
      alert('Penilaian berhasil disimpan!');
      setGradingApp(null);
      loadData();
    } catch (err: any) {
      alert('Gagal menyimpan penilaian: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Helper to parse attendance JSON safety
  const parseAttendance = (app: any): Record<string, string> => {
    if (!app || !app.kehadiran) return {};
    try {
      const res = typeof app.kehadiran === 'string' ? JSON.parse(app.kehadiran) : app.kehadiran;
      return typeof res === 'object' ? res : {};
    } catch (e) {
      return {};
    }
  };

  // Helper to parse submitted tasks safety
  const parseTasks = (app: any): any[] => {
    if (!app || !app.tugas) return [];
    try {
      const res = typeof app.tugas === 'string' ? JSON.parse(app.tugas) : app.tugas;
      return Array.isArray(res) ? res : [];
    } catch (e) {
      return [];
    }
  };

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <div className="flex justify-start">
        <button 
          onClick={() => navigate(-1)} 
          className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-gray-500 hover:text-hw-green transition-colors"
        >
          <ChevronLeft size={16} />
          Kembali
        </button>
      </div>

      {/* Page Header */}
      <div className="flex flex-col gap-1.5 bg-gradient-to-br from-hw-green/10 to-emerald-600/5 p-6 rounded-[2.5rem] border border-hw-green/20">
        <div className="flex items-center gap-2">
          <GraduationCap className="text-hw-green animate-pulse" size={24} />
          <span className="text-[10px] font-black uppercase tracking-widest text-hw-green">Satu HW Training</span>
        </div>
        <h2 className="text-2xl font-black text-hw-dark leading-none font-display">Portal Pelatihan</h2>
        <p className="text-xs text-gray-500 font-medium">
          Akses kurikulum resmi, kirim tugas, absen sesi, dan cetak piagam pelatihan Jati 1, Jati 2, & Jari 1.
        </p>
      </div>

      {/* Program Level Tabs Selector */}
      <div className="grid grid-cols-3 bg-white p-1.5 rounded-3xl border border-gray-100 shadow-sm">
        {TRAINING_PROGRAMS.map((prog) => (
          <button
            key={prog.id}
            onClick={() => setSelectedLevel(prog.id)}
            className={`py-3.5 px-1 rounded-2xl text-xs font-black transition-all flex flex-col items-center gap-1 ${
              selectedLevel === prog.id
                ? 'bg-gradient-to-r from-hw-green to-emerald-700 text-white shadow-md shadow-emerald-900/10 scale-[1.02]'
                : 'text-gray-400 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <span className="text-sm font-black font-display leading-none">{prog.title}</span>
            <span className={`text-[8px] tracking-wide font-medium uppercase ${selectedLevel === prog.id ? 'text-emerald-100' : 'text-gray-400'}`}>
              {prog.subtitle}
            </span>
          </button>
        ))}
      </div>

      {/* MAIN VIEWPORT */}
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-16 space-y-3"
          >
            <Loader2 className="animate-spin text-hw-green" size={32} />
            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Memuat database pelatihan...</p>
          </motion.div>
        ) : perspective === 'peserta' ? (
          /* ==================================================== */
          /* PERSPEKTIF ANGGOTA / PESERTA PELATIHAN                */
          /* ==================================================== */
          <motion.div
            key="peserta-view"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-6"
          >
            {!isAuthenticated ? (
              <div className="bg-white p-5 rounded-[2rem] border border-gray-100 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">Status Kepesertaan</span>
                  <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-gray-100 text-gray-500 uppercase">BELUM MASUK</span>
                </div>
                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 text-center space-y-3">
                  <Lock size={20} className="mx-auto text-gray-400" />
                  <div className="space-y-1">
                    <h4 className="text-xs font-black text-gray-700">Akses Terkunci</h4>
                    <p className="text-[10px] text-gray-500 leading-normal px-4">
                      Silakan masuk atau daftar akun terlebih dahulu untuk melihat kemajuan dan mengumpulkan tugas pelatihan Anda.
                    </p>
                  </div>
                  <Link to="/login" className="inline-block bg-hw-green text-white text-[10px] font-black uppercase tracking-wider px-4 py-2 rounded-xl active:scale-95 transition-transform">
                    Masuk Sekarang
                  </Link>
                </div>
              </div>
            ) : !isLevelActiveOrApproved ? (
              <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm text-center space-y-6 max-w-[420px] mx-auto my-6 animate-fade-in">
                <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center text-amber-500 mx-auto">
                  <Lock size={32} />
                </div>
                
                <div className="space-y-3">
                  <span className="bg-amber-100 text-amber-800 text-[9px] uppercase font-black tracking-widest px-2.5 py-1 rounded-full">
                    AKUN BELUM AKTIF
                  </span>
                  <h3 className="text-sm font-black text-gray-800 leading-snug">
                    Maaf akun anda belum aktif pada Jenjang Pelatihan ini.
                  </h3>
                  <p className="text-xs text-gray-400 font-semibold leading-relaxed">
                    Untuk dapat mengakses kurikulum, materi penunjang, absensi sesi, dan mengunduh piagam kelulusan digital pada jenjang <strong className="text-gray-700">{selectedLevel}</strong>, silakan lakukan pendaftaran atau hubungi Admin Kwarda untuk aktivasi akun Anda.
                  </p>
                </div>

                {userApp && (
                  <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 text-left space-y-2">
                    <p className="text-[9px] uppercase font-bold text-gray-400 tracking-wider">Status Pengajuan Pelatihan</p>
                    {userApp.status === 'pending' ? (
                      <div className="space-y-1">
                        <span className="bg-orange-100 text-orange-850 text-[8px] uppercase font-black tracking-widest px-2 py-0.5 rounded-md">
                          MENUNGGU VERIFIKASI
                        </span>
                        <p className="text-[10px] text-gray-500 font-medium leading-relaxed">
                          Pendaftaran Anda dikirim pada <strong>{new Date(userApp.tanggalAjuan).toLocaleDateString('id-ID', { dateStyle: 'long' })}</strong> dan sedang ditinjau oleh Admin.
                        </p>
                      </div>
                    ) : userApp.status === 'rejected' ? (
                      <div className="space-y-1">
                        <span className="bg-rose-100 text-rose-850 text-[8px] uppercase font-black tracking-widest px-2 py-0.5 rounded-md">
                          DITOLAK
                        </span>
                        <p className="text-[10px] text-gray-500 font-medium leading-relaxed">
                          Pendaftaran Anda ditolak dengan alasan: <strong className="text-rose-700 font-sans italic">"{userApp.remark || 'Tidak ada keterangan'}"</strong>. Silakan ajukan kembali dengan data yang benar.
                        </p>
                      </div>
                    ) : null}
                  </div>
                )}

                <div className="pt-2 flex flex-col gap-2">
                  <Link 
                    to="/daftar-pelatihan" 
                    className="w-full py-3 bg-hw-green hover:bg-emerald-700 text-white rounded-xl text-center text-xs font-black uppercase tracking-wider transition-all shadow-md shadow-emerald-950/10"
                    id="btn-register-training-unactive"
                  >
                    {userApp && userApp.status === 'rejected' ? 'Ajukan Kembali Pendaftaran' : 'Daftar Pelatihan Sekarang'}
                  </Link>
                  <Link 
                    to="/kta" 
                    className="w-full py-3 bg-gray-50 border border-gray-100 hover:bg-gray-100 rounded-xl text-xs font-black text-gray-500 uppercase tracking-wider transition-colors text-center"
                    id="btn-check-kta-unactive"
                  >
                    Cek Pengajuan KTA Anda
                  </Link>
                </div>
              </div>
            ) : (
              <>
                {/* Status Keikutsertaan Banner */}
            <div className="bg-white p-5 rounded-[2rem] border border-gray-100 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">Status Kepesertaan</span>
                {!isAuthenticated ? (
                  <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-gray-100 text-gray-500 uppercase">BELUM MASUK</span>
                ) : !userApp ? (
                  <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-500 uppercase">BELUM TERDAFTAR</span>
                ) : userApp.status === 'pending' ? (
                  <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-orange-500/10 text-orange-500 uppercase">MENUNGGU VERIFIKASI</span>
                ) : userApp.status === 'rejected' ? (
                  <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-red-500/10 text-red-500 uppercase">PENDAFTARAN DITOLAK</span>
                ) : userApp.statusKelulusan === 'Lulus' ? (
                  <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-emerald-500 text-white uppercase flex items-center gap-1">LULUS PELATIHAN 🎉</span>
                ) : (
                  <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-500 uppercase">TERDAFTAR & AKTIF</span>
                )}
              </div>

              {/* Status Box Details */}
              {!isAuthenticated ? (
                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 text-center space-y-3">
                  <Lock size={20} className="mx-auto text-gray-400" />
                  <div className="space-y-1">
                    <h4 className="text-xs font-black text-gray-700">Akses Terkunci</h4>
                    <p className="text-[10px] text-gray-500 leading-normal px-4">
                      Silakan masuk atau daftar akun terlebih dahulu untuk melihat kemajuan dan mengumpulkan tugas pelatihan Anda.
                    </p>
                  </div>
                  <Link to="/login" className="inline-block bg-hw-green text-white text-[10px] font-black uppercase tracking-wider px-4 py-2 rounded-xl active:scale-95 transition-transform">
                    Masuk Sekarang
                  </Link>
                </div>
              ) : !userApp ? (
                <div className="bg-amber-500/5 p-4 rounded-2xl border border-amber-500/10 space-y-3">
                  <div className="flex gap-3">
                    <Info size={18} className="text-amber-500 shrink-0 mt-0.5" />
                    <div className="text-left space-y-1">
                      <h4 className="text-xs font-black text-amber-900">Anda Belum Terdaftar untuk {selectedLevel}</h4>
                      <p className="text-[10px] text-amber-800/80 leading-normal">
                        Ingin mengikuti sertifikasi resmi ini? Anda perlu melengkapi formulir pendaftaran pelatihan terlebih dahulu agar admin dapat memverifikasi profil Anda.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Link to="/daftar-pelatihan" className="bg-amber-500 text-white text-[10px] font-black uppercase tracking-wider px-4 py-2.5 rounded-xl flex-1 text-center active:scale-95 transition-transform">
                      Isi Formulir Pendaftaran
                    </Link>
                    <Link to="/upgrade" className="bg-amber-500/10 text-amber-700 text-[10px] font-black uppercase tracking-wider px-3 py-2.5 rounded-xl text-center">
                      Detail Biaya
                    </Link>
                  </div>
                </div>
              ) : userApp.status === 'pending' ? (
                <div className="bg-orange-500/5 p-4 rounded-2xl border border-orange-500/10 space-y-2 text-left">
                  <div className="flex gap-2.5">
                    <Clock size={16} className="text-orange-500 shrink-0 mt-0.5 animate-spin" />
                    <div>
                      <h4 className="text-xs font-black text-orange-900">Pendaftaran Menunggu Persetujuan Admin</h4>
                      <p className="text-[10px] text-orange-800/80 leading-normal mt-0.5">
                        Terkirim pada {new Date(userApp.tanggalAjuan).toLocaleDateString('id-ID', { dateStyle: 'long' })}. Admin sedang memverifikasi pembayaran serta dokumen kualifikasi Anda. Sambil menunggu, Anda tetap bisa membaca syarat kurikulum di bawah ini.
                      </p>
                    </div>
                  </div>
                </div>
              ) : userApp.status === 'rejected' ? (
                <div className="bg-red-500/5 p-4 rounded-2xl border border-red-500/10 text-left space-y-1.5">
                  <div className="flex gap-2">
                    <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-black text-red-950">Pendaftaran Ditolak</h4>
                      <p className="text-[10px] text-red-800 leading-normal">
                        Catatan Admin: "{userApp.remark || 'Tidak ada keterangan tambahan'}"
                      </p>
                    </div>
                  </div>
                  <Link to="/daftar-pelatihan" className="inline-block bg-red-600 text-white text-[10px] font-black uppercase tracking-wider px-4 py-2 rounded-xl">
                    Ajukan Kembali
                  </Link>
                </div>
              ) : (
                <div className="bg-emerald-500/5 p-4 rounded-2xl border border-emerald-500/10 text-left space-y-2.5">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-600">
                      <CheckCircle2 size={20} />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-emerald-950">Selamat, Pendaftaran Anda Aktif!</h4>
                      <p className="text-[9px] text-emerald-700/80 font-bold uppercase tracking-wider">
                        PESERTA: {userApp.nama} ({userApp.asalDaerah})
                      </p>
                    </div>
                  </div>
                  
                  {userApp.statusKelulusan === 'Lulus' ? (
                    <div className="bg-emerald-500 text-white p-3 rounded-xl flex items-center justify-between">
                      <div className="text-left space-y-0.5">
                        <p className="text-[9px] font-black uppercase tracking-wider text-emerald-100">Evaluasi Akhir</p>
                        <h5 className="text-xs font-black uppercase">LULUS DENGAN NILAI: {userApp.nilai || 'A'}</h5>
                      </div>
                      <button 
                        onClick={() => setActiveTab('piagam')}
                        className="bg-white text-emerald-700 font-black text-[9px] uppercase tracking-wider px-3 py-1.5 rounded-lg shadow-sm"
                      >
                        Lihat Piagam
                      </button>
                    </div>
                  ) : (
                    <p className="text-[10px] text-emerald-800 leading-normal">
                      Anda memiliki akses penuh untuk menyelesaikan seluruh sesi absensi, mengunggah tugas kepanduan, dan mendapatkan Piagam Kelulusan resmi di portal ini.
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Inner Feature Tabs for Requirements, Sessions, Tasks, Certificate */}
            <div className="space-y-4">
              <div className="flex border-b border-gray-100 overflow-x-auto no-scrollbar gap-1.5 pb-1">
                {[
                  { id: 'info', label: 'Pelatihan ' + selectedLevel, icon: Info },
                  { id: 'materi', label: 'Materi Penunjang', icon: BookOpen },
                  { id: 'sesi', label: 'Sesi & Absen', icon: Calendar },
                  { id: 'tugas', label: 'Kirim Tugas', icon: ClipboardList },
                  { id: 'piagam', label: 'Piagam Digital', icon: Award }
                ].map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`py-2 px-3.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all shrink-0 flex items-center gap-1.5 ${
                        activeTab === tab.id
                          ? 'bg-hw-green/10 text-hw-green border border-hw-green/20'
                          : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <Icon size={12} />
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              {/* Tab Contents */}
              <div className="min-h-[200px]">
                {/* 1. Kurikulum Tab */}
                {activeTab === 'info' && (
                  <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    className="space-y-4 text-left"
                  >
                    <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm space-y-3">
                      <h4 className="text-xs font-black text-gray-800 uppercase tracking-wider font-display">Tentang {selectedLevel}</h4>
                      <p className="text-[11px] text-gray-500 leading-relaxed">{program.description}</p>
                    </div>

                    <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm space-y-3">
                      <h4 className="text-xs font-black text-gray-800 uppercase tracking-wider font-display">Persyaratan Pendaftaran</h4>
                      <ul className="space-y-2">
                        {program.requirements.map((req, i) => (
                          <li key={i} className="flex gap-2 text-[11px] text-gray-500 leading-normal">
                            <span className="w-5 h-5 rounded-full bg-hw-green/10 text-hw-green font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">{i+1}</span>
                            <span>{req}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </motion.div>
                )}

                {/* 1.5. Materi Penunjang Tab */}
                {activeTab === 'materi' && (
                  <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    className="space-y-4 text-left"
                  >
                    <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-black text-gray-800 uppercase tracking-wider font-display">Materi Penunjang {selectedLevel}</h4>
                        <span className="text-[9px] font-black bg-hw-green/10 text-hw-green px-2 py-0.5 rounded-md uppercase">{materiList.length} Materi</span>
                      </div>
                      <p className="text-[10px] text-gray-400 leading-normal">
                        Materi berikut merupakan penunjang utama dari kegiatan pelatihan yang Anda ikuti. Silakan pelajari secara seksama dan unduh berkasnya.
                      </p>
                    </div>

                    {loadingMateri ? (
                      <div className="flex flex-col items-center justify-center py-8 space-y-2 bg-white rounded-3xl border border-gray-100 shadow-sm">
                        <Loader2 className="animate-spin text-hw-green" size={24} />
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest animate-pulse">Memuat berkas materi...</p>
                      </div>
                    ) : !hasMateriAccess() ? (
                      <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100 text-center text-gray-400 py-10 space-y-2 shadow-sm">
                        <Lock size={22} className="mx-auto text-gray-300" />
                        <h5 className="text-xs font-black text-gray-700">Materi Terkunci</h5>
                        <p className="text-[9px] text-gray-400 leading-normal px-6">
                          Materi penunjang dapat diakses penuh oleh peserta aktif yang pendaftarannya disetujui atau anggota yang pernah mengikuti pelatihan ini sebelumnya.
                        </p>
                      </div>
                    ) : materiList.length === 0 ? (
                      <div className="bg-white p-8 rounded-3xl border border-gray-100 text-center text-gray-400 shadow-sm">
                        <FileText size={24} className="mx-auto text-gray-300 mb-2" />
                        <p className="text-[10px] font-bold">Belum ada materi penunjang yang diunggah.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-3">
                        {materiList.map((item, index) => (
                          <div
                            key={`materi-item-${item.id}-${index}`}
                            className="bg-white rounded-2xl p-3.5 shadow-xs border border-gray-100 hover:shadow-sm transition-all flex items-center gap-4 text-left"
                          >
                            <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 bg-gray-50 flex items-center justify-center border border-gray-100">
                              <img 
                                src={item.coverImage || 'https://upload.wikimedia.org/wikipedia/id/b/ba/Logo_Hizbul_Wathan.png'} 
                                alt={item.judul} 
                                className="w-full h-full object-cover" 
                              />
                            </div>
                            
                            <div className="flex-1 min-w-0 py-1">
                              <h5 className="font-display font-bold text-gray-800 text-xs leading-tight break-words">
                                {item.judul}
                              </h5>
                              <p className="text-gray-400 text-[9px] font-medium mt-1">
                                Diperbarui: {item.tanggal ? new Date(item.tanggal).toLocaleDateString('id-ID') : '-'}
                              </p>
                            </div>

                            <div className="shrink-0 ml-auto">
                              {item.driveUrl && (
                                <a 
                                  href={item.driveUrl} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="flex flex-col items-center justify-center gap-1 p-2 bg-hw-green/10 text-hw-green rounded-xl hover:bg-hw-green hover:text-white transition-all border border-hw-green/20 min-w-[70px]"
                                  title="Unduh / Buka Materi"
                                >
                                  <Download size={16} />
                                  <span className="text-[8px] font-black uppercase tracking-tighter">Unduh</span>
                                </a>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}

                {/* 2. Sesi & Absen Tab */}
                {activeTab === 'sesi' && (
                  <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    className="space-y-3 text-left"
                  >
                    <div className="flex items-center justify-between px-1">
                      <h4 className="text-xs font-black text-gray-800 uppercase tracking-wider font-display">Daftar Sesi Materi</h4>
                      <span className="text-[9px] font-black bg-gray-100 text-gray-500 px-2 py-0.5 rounded-md uppercase">{program.sessions.length} Sesi Utama</span>
                    </div>

                    <div className="space-y-3">
                      {program.sessions.map((ses, idx) => {
                        const attendanceMap = parseAttendance(userApp);
                        const status = getAttendanceStatus(attendanceMap, ses.id);
                        const timestamp = getAttendanceTimestamp(attendanceMap, ses.id);
                        const isEditing = activeEditSession === ses.id;
                        
                        return (
                          <div key={ses.id} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col gap-3 text-left">
                            <div className="flex items-start justify-between gap-4">
                              <div className="space-y-1">
                                <span className="text-[8px] font-black uppercase tracking-widest text-hw-green bg-hw-green/10 px-1.5 py-0.5 rounded-md">
                                  {ses.id}
                                </span>
                                <h5 className="text-xs font-black text-gray-800">{ses.title}</h5>
                                <p className="text-[10px] text-gray-400 leading-normal">{ses.description}</p>
                              </div>
                              
                              {/* Attendance Pill Status */}
                              <div className="shrink-0 pt-1 flex items-center gap-1.5">
                                {!userApp ? (
                                  <span className="text-[8px] font-black text-gray-300 uppercase tracking-wider">Belum Daftar</span>
                                ) : status === 'hadir' ? (
                                  <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 uppercase">
                                    Hadir ✓
                                  </span>
                                ) : status === 'izin' ? (
                                  <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500 uppercase">
                                    Izin
                                  </span>
                                ) : status === 'absen' ? (
                                  <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-red-500/10 text-red-500 uppercase">
                                    Tidak Hadir
                                  </span>
                                ) : (
                                  <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-gray-100 text-gray-400 uppercase">
                                    Belum Mulai
                                  </span>
                                )}

                                {/* Edit Button for Approved Participant */}
                                {userApp && userApp.status === 'approved' && !isEditing && (
                                  <button
                                    onClick={() => setActiveEditSession(ses.id)}
                                    className="p-1 text-gray-400 hover:text-hw-green hover:bg-gray-50 rounded-lg transition-all"
                                    title="Edit Presensi"
                                  >
                                    <Pencil size={11} />
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Recorded Timestamp */}
                            {timestamp && (
                              <div className="flex items-center gap-1.5 text-[8.5px] text-gray-400 bg-gray-50 px-2.5 py-1 rounded-lg w-max font-bold font-sans">
                                <Clock size={10} className="text-gray-400" />
                                <span>Tercatat: {timestamp}</span>
                              </div>
                            )}

                            {/* Attendance Controls inside Panel */}
                            {isEditing && (
                              <div className="mt-1 pt-3 border-t border-dashed border-gray-100 flex flex-col gap-2">
                                <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider">Kirim Presensi Baru:</span>
                                <div className="grid grid-cols-4 gap-1.5">
                                  <button
                                    disabled={savingAttendance[ses.id]}
                                    onClick={() => handleUserSubmitAttendance(ses.id, 'hadir')}
                                    className={`py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1 ${
                                      status === 'hadir' 
                                        ? 'bg-emerald-500 text-white shadow-sm' 
                                        : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                                    }`}
                                  >
                                    {savingAttendance[ses.id] && activeEditSession === ses.id ? (
                                      <Loader2 size={10} className="animate-spin" />
                                    ) : 'Hadir'}
                                  </button>

                                  <button
                                    disabled={savingAttendance[ses.id]}
                                    onClick={() => handleUserSubmitAttendance(ses.id, 'absen')}
                                    className={`py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1 ${
                                      status === 'absen' 
                                        ? 'bg-red-500 text-white shadow-sm' 
                                        : 'bg-red-50 text-red-600 hover:bg-red-100'
                                    }`}
                                  >
                                    Tidak Hadir
                                  </button>

                                  <button
                                    disabled={savingAttendance[ses.id]}
                                    onClick={() => handleUserSubmitAttendance(ses.id, 'izin')}
                                    className={`py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1 ${
                                      status === 'izin' 
                                        ? 'bg-blue-500 text-white shadow-sm' 
                                        : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                                    }`}
                                  >
                                    Izin
                                  </button>

                                  <button
                                    onClick={() => setActiveEditSession(null)}
                                    className="py-1.5 rounded-xl bg-gray-100 text-gray-500 hover:bg-gray-200 text-[9px] font-black uppercase tracking-wider transition-all"
                                  >
                                    Batal
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}

                {/* 3. Tugas Tab */}
                {activeTab === 'tugas' && (
                  <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    className="space-y-4 text-left"
                  >
                    {/* List of Syllabus Assignments */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-black text-gray-800 uppercase tracking-wider font-display px-1">Tugas Wajib Pelatihan</h4>
                      {program.assignments.map((asg) => (
                        <div key={asg.id} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm space-y-1">
                          <h5 className="text-xs font-black text-gray-800 flex items-center gap-1.5">
                            <FileText size={12} className="text-hw-green" /> {asg.title}
                          </h5>
                          <p className="text-[10px] text-gray-400 leading-normal">{asg.description}</p>
                        </div>
                      ))}
                    </div>

                    {/* Submit Task Form */}
                    {userApp && userApp.status === 'approved' ? (
                      <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm space-y-4">
                        <h4 className="text-xs font-black text-gray-800 uppercase tracking-wider font-display">Kirim Tugas Pelatihan</h4>
                        <form onSubmit={handleUserSubmitTask} className="space-y-3">
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-gray-400 ml-1">Nama / Judul Tugas</label>
                            <select 
                              value={taskTitle}
                              onChange={(e) => setTaskTitle(e.target.value)}
                              className="w-full bg-gray-50 border-gray-100 focus:ring-hw-green/20 rounded-xl px-3.5 py-2.5 text-xs font-bold text-gray-700"
                              required
                            >
                              <option value="">-- Pilih Tugas --</option>
                              {program.assignments.map(asg => (
                                <option key={asg.id} value={asg.title}>{asg.title}</option>
                              ))}
                              <option value="Tugas Tambahan / Projek Lapangan">Tugas Tambahan / Projek Lapangan</option>
                            </select>
                          </div>

                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-gray-400 ml-1">Tautan File (Google Drive / YouTube Link / PDF Link)</label>
                            <input 
                              type="url" 
                              placeholder="https://drive.google.com/..."
                              value={taskLink}
                              onChange={(e) => setTaskLink(e.target.value)}
                              className="w-full bg-gray-50 border-gray-100 focus:ring-hw-green/20 rounded-xl px-3.5 py-2.5 text-xs text-gray-700"
                              required
                            />
                          </div>

                          <button
                            type="submit"
                            disabled={submittingTask}
                            className="w-full bg-hw-green hover:bg-emerald-700 text-white text-[10px] font-black uppercase tracking-wider py-3 rounded-xl shadow-md shadow-emerald-900/10 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                          >
                            {submittingTask ? (
                              <>
                                <Loader2 size={12} className="animate-spin" /> Mengirim...
                              </>
                            ) : (
                              'Kumpulkan Tugas'
                            )}
                          </button>
                        </form>
                      </div>
                    ) : (
                      <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100 text-center text-gray-400 py-8">
                        <Lock size={20} className="mx-auto text-gray-300 mb-2" />
                        <p className="text-[10px] font-bold">Fitur pengumpulan tugas terkunci.</p>
                        <p className="text-[9px] text-gray-400 mt-0.5">Hanya dapat digunakan setelah pendaftaran Anda disetujui oleh admin.</p>
                      </div>
                    )}

                    {/* Submitted Tasks History */}
                    {userApp && (
                      <div className="space-y-2.5 text-left">
                        <h4 className="text-xs font-black text-gray-800 uppercase tracking-wider font-display px-1">Daftar Tugas Terkirim ({parseTasks(userApp).length})</h4>
                        {parseTasks(userApp).length === 0 ? (
                          <p className="text-[10px] text-gray-400 italic text-center py-4">Belum ada tugas yang dikumpulkan.</p>
                        ) : (
                          <div className="space-y-2">
                            {parseTasks(userApp).map((t, idx) => (
                              <div key={idx} className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
                                <div className="space-y-0.5">
                                  <h6 className="text-[11px] font-black text-gray-700">{t.title}</h6>
                                  <p className="text-[9px] text-gray-400">Terkirim: {new Date(t.submittedAt).toLocaleDateString('id-ID')}</p>
                                </div>
                                <a 
                                  href={t.link} 
                                  target="_blank" 
                                  rel="noopener noreferrer" 
                                  className="text-hw-green hover:text-emerald-700 p-2 hover:bg-gray-50 rounded-lg transition-all"
                                >
                                  <ExternalLink size={14} />
                                </a>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </motion.div>
                )}

                {/* 4. Piagam Digital Tab */}
                {activeTab === 'piagam' && (
                  <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    className="space-y-4"
                  >
                    {userApp && userApp.statusKelulusan === 'Lulus' ? (
                      <div className="space-y-4">
                        <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm text-left">
                          <h4 className="text-xs font-black text-gray-800 uppercase tracking-wider font-display mb-1.5">Sertifikat Kelulusan Resmi</h4>
                          <p className="text-[10px] text-gray-400 leading-normal">
                            Piagam digital resmi ini diterbitkan langsung oleh Kwartir Wilayah Gerakan Kepanduan Hizbul Wathan Jawa Tengah atas pencapaian kelulusan pelatihan Anda.
                          </p>
                        </div>

                        {/* Interactive Certificate Preview Graphic */}
                        <div className="bg-amber-50/70 border border-amber-200 rounded-3xl p-6 relative overflow-hidden shadow-sm flex flex-col items-center justify-center text-center space-y-4 min-h-[300px] font-serif">
                          {/* Decorative Borders */}
                          <div className="absolute inset-2.5 border-2 border-dashed border-amber-300/40 rounded-[1.2rem] pointer-events-none" />
                          <div className="absolute inset-4 border border-amber-300/20 rounded-[1rem] pointer-events-none" />

                          {/* Logo */}
                          <img 
                            src="https://upload.wikimedia.org/wikipedia/id/b/ba/Logo_Hizbul_Wathan.png" 
                            alt="Logo HW" 
                            className="h-14 w-auto drop-shadow-md relative z-10"
                          />

                          <div className="space-y-1 relative z-10">
                            <h3 className="text-xs font-bold uppercase tracking-widest text-amber-800 font-sans">PIAGAM PENGHARGAAAN</h3>
                            <p className="text-[8px] text-gray-400 font-sans tracking-wide">Nomor: HW-JATENG/{selectedLevel.toUpperCase().replace(/\s+/g, '')}/{userApp.id.toUpperCase()}/{new Date().getFullYear()}</p>
                          </div>

                          <div className="space-y-1 relative z-10">
                            <p className="text-[9px] text-gray-500 italic">Diberikan Kepada:</p>
                            <h4 className="text-base font-black text-gray-800 uppercase tracking-wide border-b border-amber-300 pb-1 px-6 inline-block font-sans">
                              {userApp.nama || user?.namaLengkap}
                            </h4>
                          </div>

                          <p className="text-[9px] text-gray-500 leading-relaxed max-w-xs px-2 italic">
                            Atas ketekunan, dedikasi, dan kelulusan dengan predikat memuaskan pada pelatihan resmi <strong className="font-sans not-italic text-amber-800">{selectedLevel} ({program.subtitle})</strong> yang diselenggarakan oleh Kwartir Wilayah Gerakan Kepanduan Hizbul Wathan Jawa Tengah.
                          </p>

                          <div className="grid grid-cols-2 gap-8 pt-4 w-full text-[8px] font-sans text-gray-500 relative z-10">
                            <div className="space-y-4">
                              <p className="leading-none">Ketua Kwarwil Jateng,</p>
                              <div className="h-6 flex items-center justify-center">
                                <span className="text-[9px] text-emerald-700 font-black tracking-widest border border-dashed border-emerald-500/20 px-1.5 py-0.2 rounded uppercase">Taufiq ✓</span>
                              </div>
                              <p className="font-bold underline leading-none uppercase">Taufiq</p>
                              <p className="text-[6px] tracking-wider">NBM. 948.121</p>
                            </div>
                            <div className="space-y-4">
                              <p className="leading-none">Sekretaris Kwarwil Jateng,</p>
                              <div className="h-6 flex items-center justify-center">
                                <span className="text-[9px] text-emerald-700 font-black tracking-widest border border-dashed border-emerald-500/20 px-1.5 py-0.2 rounded uppercase font-mono">Dzikron ✓</span>
                              </div>
                              <p className="font-bold underline leading-none uppercase">M. Dzikron</p>
                              <p className="text-[6px] tracking-wider">NBM. 1.011.231</p>
                            </div>
                          </div>
                        </div>

                        {/* Certificate Actions */}
                        <div className="flex gap-2.5">
                          <button
                            onClick={() => window.print()}
                            className="bg-hw-green hover:bg-emerald-700 text-white text-[10px] font-black uppercase tracking-wider py-3 px-4 rounded-xl flex-1 active:scale-95 transition-transform flex items-center justify-center gap-2"
                          >
                            <Download size={12} /> Cetak / Unduh Piagam
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100 text-center text-gray-400 py-10 space-y-2">
                        <Lock size={22} className="mx-auto text-gray-300" />
                        <h5 className="text-xs font-black text-gray-700">Piagam Belum Tersedia</h5>
                        <p className="text-[9px] text-gray-400 leading-normal px-6">
                          Piagam kelulusan digital hanya diterbitkan setelah Anda menyelesaikan tugas pelatihan, dinyatakan lulus, dan mendapat penilaian resmi dari Tim Instruktur Kwarwil HW Jawa Tengah.
                        </p>
                      </div>
                    )}
                  </motion.div>
                )}
              </div>
            </div>
              </>
            )}
          </motion.div>
        ) : (
          /* ==================================================== */
          /* PERSPEKTIF ADMIN / KELOLA DATABASE PELATIHAN          */
          /* ==================================================== */
          <motion.div
            key="admin-view"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-6"
          >
            {/* Admin Stats Banner */}
            <div className="grid grid-cols-3 gap-2.5">
              <div className="bg-white p-3.5 rounded-2xl border border-gray-100 shadow-sm text-left">
                <span className="text-[8px] font-black text-gray-400 uppercase tracking-wider">Pendaftar</span>
                <p className="text-lg font-black text-gray-800 mt-1">{filteredApps.length}</p>
              </div>
              <div className="bg-white p-3.5 rounded-2xl border border-gray-100 shadow-sm text-left">
                <span className="text-[8px] font-black text-amber-500 uppercase tracking-wider">Tertunda (Pending)</span>
                <p className="text-lg font-black text-amber-500 mt-1">{filteredApps.filter(a => a.status === 'pending').length}</p>
              </div>
              <div className="bg-white p-3.5 rounded-2xl border border-gray-100 shadow-sm text-left">
                <span className="text-[8px] font-black text-emerald-500 uppercase tracking-wider">Lulus Pelatihan</span>
                <p className="text-lg font-black text-emerald-500 mt-1">{filteredApps.filter(a => a.statusKelulusan === 'Lulus').length}</p>
              </div>
            </div>

            {/* Participant Search and Management List */}
            <div className="space-y-4">
              <div className="space-y-2.5">
                <div className="flex items-center justify-between px-1">
                  <h4 className="text-xs font-black text-gray-800 uppercase tracking-wider font-display">Daftar Pendaftar {selectedLevel}</h4>
                  <button 
                    onClick={loadData}
                    className="p-1.5 hover:bg-gray-100 text-gray-400 hover:text-hw-green rounded-lg transition-all"
                    title="Segarkan data"
                  >
                    <RefreshCw size={12} />
                  </button>
                </div>

                {/* Search Bar */}
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                    <Search size={14} />
                  </span>
                  <input 
                    type="text" 
                    placeholder="Cari nama, email, asal kwarda..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-white border border-gray-100 rounded-2xl pl-10 pr-4 py-3 text-xs placeholder-gray-400 shadow-sm"
                  />
                </div>
              </div>

              {/* Participants List */}
              {filteredApps.length === 0 ? (
                <div className="bg-white p-8 rounded-3xl border border-gray-100 text-center text-gray-400">
                  <Users size={24} className="mx-auto text-gray-300 mb-2" />
                  <p className="text-[10px] font-bold">Tidak ada data pendaftar yang cocok.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredApps.map((app) => {
                    const attendanceMap = parseAttendance(app);
                    const tasks = parseTasks(app);
                    
                    return (
                      <div key={app.id} className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm text-left space-y-4">
                        {/* Member Bio Header */}
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <span className="text-[8px] font-black bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded uppercase">
                              ID: {app.id.substring(0, 8)}
                            </span>
                            <h5 className="text-xs font-black text-gray-800">{app.nama || app.namaLengkap}</h5>
                            <p className="text-[9px] text-gray-400 leading-none">
                              {app.email} • {app.asalDaerah || 'Umum'}
                            </p>
                          </div>

                          {/* Action / Status Badges */}
                          <div>
                            {app.status === 'pending' ? (
                              <div className="flex gap-1">
                                <button 
                                  onClick={() => handleUpdateStatus(app.id, 'approved')}
                                  disabled={actionLoading}
                                  className="bg-emerald-500 hover:bg-emerald-600 text-white text-[9px] font-bold px-2 py-1 rounded-lg"
                                >
                                  Setuju
                                </button>
                                <button 
                                  onClick={() => handleUpdateStatus(app.id, 'rejected')}
                                  disabled={actionLoading}
                                  className="bg-red-500 hover:bg-red-600 text-white text-[9px] font-bold px-2 py-1 rounded-lg"
                                >
                                  Tolak
                                </button>
                              </div>
                            ) : app.status === 'rejected' ? (
                              <span className="text-[8px] font-black text-red-500 bg-red-100 px-2 py-0.5 rounded-md uppercase">DITOLAK</span>
                            ) : app.statusKelulusan === 'Lulus' ? (
                              <span className="text-[8px] font-black text-white bg-emerald-500 px-2 py-0.5 rounded-md uppercase">LULUS</span>
                            ) : (
                              <span className="text-[8px] font-black text-emerald-500 bg-emerald-100 px-2 py-0.5 rounded-md uppercase">AKTIF</span>
                            )}
                          </div>
                        </div>

                        {app.status === 'approved' && (
                          <>
                            {/* Attendance Quick Control */}
                            <div className="pt-2.5 border-t border-gray-50 space-y-2">
                              <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Kehadiran Sesi</span>
                              <div className="grid grid-cols-4 gap-1.5">
                                {['Sesi 1', 'Sesi 2', 'Sesi 3', 'Sesi 4'].map((sesId) => {
                                  const attStatus = getAttendanceStatus(attendanceMap, sesId);
                                  const attTime = getAttendanceTimestamp(attendanceMap, sesId);
                                  
                                  return (
                                    <div key={sesId} className="bg-gray-50/50 p-2 rounded-xl border border-gray-100 flex flex-col gap-1 items-center justify-between min-h-[58px]">
                                      <span className="text-[8px] font-bold text-gray-500">{sesId}</span>
                                      
                                      <div className="flex gap-0.5">
                                        <button 
                                          onClick={() => handleToggleAttendance(app, sesId, 'hadir')}
                                          className={`w-4 h-4 rounded flex items-center justify-center text-[7px] font-bold ${attStatus === 'hadir' ? 'bg-emerald-500 text-white' : 'bg-gray-200 text-gray-500 hover:bg-gray-300'}`}
                                          title="Hadir"
                                        >
                                          H
                                        </button>
                                        <button 
                                          onClick={() => handleToggleAttendance(app, sesId, 'izin')}
                                          className={`w-4 h-4 rounded flex items-center justify-center text-[7px] font-bold ${attStatus === 'izin' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-500 hover:bg-gray-300'}`}
                                          title="Izin / Sakit"
                                        >
                                          I
                                        </button>
                                        <button 
                                          onClick={() => handleToggleAttendance(app, sesId, 'absen')}
                                          className={`w-4 h-4 rounded flex items-center justify-center text-[7px] font-bold ${attStatus === 'absen' ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-500 hover:bg-gray-300'}`}
                                          title="Absen"
                                        >
                                          A
                                        </button>
                                      </div>

                                      {attTime && (
                                        <span className="text-[7px] text-gray-400 text-center scale-90 leading-tight block mt-1" title={attTime}>
                                          {attTime.split(' pukul ')[0]}
                                        </span>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>

                            {/* Submitted Assignments Info */}
                            <div className="pt-2.5 border-t border-gray-50 space-y-2">
                              <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Tugas Terkumpul ({tasks.length})</span>
                              {tasks.length === 0 ? (
                                <p className="text-[9px] text-gray-400 italic">Belum mengumpulkan tugas.</p>
                              ) : (
                                <div className="space-y-1">
                                  {tasks.map((t, tIdx) => (
                                    <div key={tIdx} className="bg-gray-50 p-2 rounded-lg flex items-center justify-between">
                                      <span className="text-[9px] font-bold text-gray-600 truncate max-w-[200px]">{t.title}</span>
                                      <a href={t.link} target="_blank" rel="noopener noreferrer" className="text-hw-green hover:underline text-[9px] font-bold flex items-center gap-0.5">
                                        Periksa Link <ExternalLink size={10} />
                                      </a>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>

                            {/* Gradings Panel Controls */}
                            <div className="pt-2.5 border-t border-gray-50 flex justify-between items-center">
                              <div className="text-left space-y-0.5">
                                <span className="text-[8px] font-black text-gray-400 uppercase tracking-wider block">Nilai Pelatihan</span>
                                <span className="text-xs font-black text-hw-green">
                                  {app.nilai ? `Nilai: ${app.nilai} (${app.statusKelulusan || 'Lulus'})` : 'Belum Dinilai'}
                                </span>
                              </div>
                              <button
                                onClick={() => openGradingDialog(app)}
                                className="bg-hw-green hover:bg-emerald-700 text-white font-black text-[9px] uppercase tracking-wider px-3.5 py-1.5 rounded-lg active:scale-95 transition-all flex items-center gap-1"
                              >
                                <Award size={10} /> Berikan Nilai & Piagam
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Admin Grading Modal Popup */}
      {gradingApp && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl space-y-4 text-left border border-gray-100"
          >
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black text-gray-800 uppercase tracking-wider font-display">Penilaian & Kelulusan</h4>
              <button 
                onClick={() => setGradingApp(null)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <X size={16} />
              </button>
            </div>

            <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100 space-y-0.5">
              <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Peserta Pelatihan</span>
              <h5 className="text-xs font-black text-gray-700">{gradingApp.nama}</h5>
              <p className="text-[9px] text-gray-400 leading-none">{gradingApp.email} • {gradingApp.pelatihanAkanDiikuti}</p>
            </div>

            <div className="space-y-3">
              {/* Grade Input */}
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-gray-400 ml-1">Grade Kelulusan (Contoh: A, B+, Memuaskan)</label>
                <input 
                  type="text" 
                  value={gradeInput}
                  onChange={(e) => setGradeInput(e.target.value)}
                  placeholder="Masukkan nilai"
                  className="w-full bg-gray-50 border-gray-100 focus:ring-hw-green/20 rounded-xl px-3.5 py-2.5 text-xs text-gray-700"
                />
              </div>

              {/* Status Kelulusan */}
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-gray-400 ml-1">Status Kelulusan</label>
                <select 
                  value={passingStatus}
                  onChange={(e) => setPassingStatus(e.target.value)}
                  className="w-full bg-gray-50 border-gray-100 focus:ring-hw-green/20 rounded-xl px-3.5 py-2.5 text-xs font-bold text-gray-700"
                >
                  <option value="Lulus">Lulus (Piagam Terbit)</option>
                  <option value="Belum Lulus">Belum Lulus / Mengulang</option>
                </select>
              </div>

              {/* Remark Input */}
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-gray-400 ml-1">Catatan Instruktur / Feedback</label>
                <textarea 
                  value={remarkInput}
                  onChange={(e) => setRemarkInput(e.target.value)}
                  placeholder="Catatan tambahan..."
                  rows={2}
                  className="w-full bg-gray-50 border-gray-100 focus:ring-hw-green/20 rounded-xl px-3.5 py-2.5 text-xs text-gray-700 resize-none"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  onClick={() => setGradingApp(null)}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-600 text-[10px] font-black uppercase tracking-wider py-3.5 rounded-xl flex-1 text-center"
                >
                  Batal
                </button>
                <button
                  onClick={handleSaveGrade}
                  disabled={actionLoading}
                  className="bg-hw-green hover:bg-emerald-700 text-white text-[10px] font-black uppercase tracking-wider py-3.5 rounded-xl flex-1 text-center shadow-md shadow-emerald-900/10"
                >
                  {actionLoading ? 'Menyimpan...' : 'Simpan Nilai'}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

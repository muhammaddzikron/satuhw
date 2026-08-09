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
  Loader2, 
  Lock, 
  Shield, 
  User, 
  Users, 
  X, 
  RefreshCw,
  Search,
  Check,
  AlertCircle,
  Info,
  Pencil,
  MapPin,
  FileCheck,
  ScrollText,
  ArrowLeft,
  Sparkles,
  CreditCard,
  MessageCircle
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { sheetsService } from '../services/sheetsService';

export interface TrainingProgram {
  id: 'Jati 1' | 'Jati 2' | 'Jari 1';
  title: string;
  subtitle: string;
  description: string;
  fee: string;
  requirements: string[];
  sessions: { id: string; title: string; description: string }[];
  assignments: { id: string; title: string; description: string }[];
}

export const TRAINING_PROGRAMS: TrainingProgram[] = [
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
      { id: 'Sesi 1', title: 'Upacara Pembukaan & Kontrak Belajar – 45 menit', description: 'Pembukaan resmi, penjelasan tata tertib, dan komitmen bersama' },
      { id: 'Sesi 2', title: 'Sasaran & Matriks Pelatihan – 45 menit', description: 'Target capaian dan kompetensi pembina tingkat dasar' },
      { id: 'Sesi 3', title: 'Dinamika Kelompok & Leadership – 45 menit', description: 'Membangun kerjasama tim, komunikasi, dan kepemimpinan' },
      { id: 'Sesi 4', title: 'Kemuhammadiyahan & Kepanduan Islami – 90 menit', description: 'Nilai-nilai kepanduan berlandaskan Al-Islam dan Kemuhammadiyahan' },
      { id: 'Sesi 5', title: 'Sejarah Singkat & Jatidiri HW – 45 menit', description: 'Sejarah lahirnya Gerakan Kepanduan Hizbul Wathan dan perjuangan KH Ahmad Dahlan' },
      { id: 'Sesi 6', title: 'AD dan ART HW – 45 menit', description: 'Anggaran Dasar dan Anggaran Rumah Tangga Gerakan Kepanduan HW' },
      { id: 'Sesi 7', title: 'Prinsip Dasar Kepanduan & Metode HW – 90 menit', description: 'Sistem beregu, kegiatan luar ruangan, dan Janji/Undang-Undang Pandu' },
      { id: 'Sesi 8', title: 'Kode Kehormatan & Adab Pandu HW – 90 menit', description: 'Pengamalan nilai moral dan etika Islami kepanduan' },
      { id: 'Sesi 9', title: 'Organisasi Qabilah & Dewan Satuan – 45 menit', description: 'Struktur organisasi qabilah, tugas pembina, dan manajemen dewan' },
      { id: 'Sesi 10', title: 'Cara Membina & Memahami Peserta Didik – 90 menit', description: 'Psikologi perkembangan peserta didik dan teknik fasilitasi latihan' },
      { id: 'Sesi 11', title: 'SKT, TKT, SKP & TKP Pandu HW – 90 menit', description: 'Syarat dan Tanda Kenaikan Tingkat serta Kecakapan Pandu' },
      { id: 'Sesi 12', title: 'Upacara & Pelantikan sebagai Alat Pendidikan – 90 menit', description: 'Tata cara upacara pembukaan/penutupan latihan dan pelantikan' },
      { id: 'Sesi 13', title: 'Tadabbur Alam & Teknik Perkemahan – 270 menit', description: 'Praktik navigasi, perkemahan, dan pengenalan alam' },
      { id: 'Sesi 14', title: 'Rencana Tindak Lanjut (RTL) & Evaluasi – 90 menit', description: 'Penyusunan proyek pembinaan di qabilah masing-masing & evaluasi' }
    ],
    assignments: [
      { id: 'tugas-1', title: 'Resume Jatidiri & Sejarah HW', description: 'Membuat resume tertulis tentang sejarah dan jatidiri Kepanduan HW minimal 2 halaman.' },
      { id: 'tugas-2', title: 'Rencana Kerja Satuan Qabilah', description: 'Menyusun draf rencana program kerja mingguan dan bulanan untuk satu qabilah.' }
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
      { id: 'Sesi 1', title: 'Dinamika Kelompok Lanjutan & Manajemen Konflik', description: 'Metode interaktif memimpin kelompok, fasilitasi, serta penyelesaian konflik' },
      { id: 'Sesi 2', title: 'Manajemen Strategis Kwartir Daerah & Wilayah', description: 'Perencanaan strategis, kebijakan organisasi, serta tata kelola kwartir' },
      { id: 'Sesi 3', title: 'Desain Instruksional & Kurikulum Pelatihan', description: 'Metode penyusunan kurikulum pelatihan, silabus, dan teknik evaluasi' },
      { id: 'Sesi 4', title: 'Praktik Kepelatihan (Micro-Teaching)', description: 'Simulasi menyampaikan materi kepanduan di hadapan tim pelatih' }
    ],
    assignments: [
      { id: 'tugas-1', title: 'Analisis Kebutuhan Latihan Qabilah', description: 'Membuat dokumen analisis hambatan pembinaan di qabilah masing-masing beserta solusinya.' },
      { id: 'tugas-2', title: 'Desain Modul Sesi Latih Micro-Teaching', description: 'Menyusun silabus lengkap beserta draf modul pembelajaran untuk salah satu sesi Jati 1.' }
    ]
  },
  {
    id: 'Jari 1',
    title: 'JARI 1',
    subtitle: 'Jaya Matahari 1',
    description: 'Pelatihan bagi kader remaja/muda Hizbul Wathan untuk membekali kemampuan teknis memimpin regu, survival lapangan, sandi, kompas, serta pertolongan pertama.',
    fee: 'Rp 50.000',
    requirements: [
      'Anggota aktif golongan Pengenal / Penghela',
      'Telah lulus SKU tingkat tertinggi di golongannya',
      'Mendapat rekomendasi tertulis dari Ketua Qabilah/Sekolah',
      'Mengisi formulir pendaftaran resmi & melunasi biaya administrasi'
    ],
    sessions: [
      { id: 'Sesi 1', title: 'Kepemimpinan Dewan Pasukan & Regu', description: 'Peran Pratama, Pinru, Wapinru, serta manajemen dewan pasukan' },
      { id: 'Sesi 2', title: 'Teknik Survival & Navigasi Kompas', description: 'Navigasi darat, membaca peta pita, kompas bidik, serta survival alam bebas' },
      { id: 'Sesi 3', title: 'Semaphore, Morse & Sandi Lapangan', description: 'Keterampilan komunikasi visual jarak jauh menggunakan bendera, peluit, dan sandi' },
      { id: 'Sesi 4', title: 'PPGD & Evakuasi Medis Lapangan', description: 'Pertolongan pertama gawat darurat, penanganan luka, pembidaian, serta teknik tandu' }
    ],
    assignments: [
      { id: 'tugas-1', title: 'Video Praktik Semaphore / Morse', description: 'Mengunggah video berdurasi minimal 1 menit mempraktikkan pengiriman pesan semaphore/morse.' },
      { id: 'tugas-2', title: 'Laporan Peta Pita Lapangan', description: 'Menggambar peta pita perjalanan sejauh minimal 1 km lengkap dengan keterangan kompas.' }
    ]
  }
];

export interface TrainingActivityItem {
  id: string;
  namaKegiatan: string;
  jenisPelatihan: 'Jati 1' | 'Jati 2' | 'Jari 1' | string;
  lokasiPelatihan?: string;
  tanggalPelatihan?: string;
  deskripsi?: string;
  status?: 'Buka' | 'Tutup' | string;
  tataTertib?: string[];
}

export const DEFAULT_TRAINING_ACTIVITIES: TrainingActivityItem[] = [
  {
    id: 'act-jati1-default',
    namaKegiatan: 'Pelatihan Jaya Melati 1 (Jati 1) HW Jawa Tengah',
    jenisPelatihan: 'Jati 1',
    lokasiPelatihan: 'Pusdiklat HW Jawa Tengah / Qabilah Setempat',
    tanggalPelatihan: 'Jadwal Reguler Kwarwil HW Jateng',
    deskripsi: 'Pelatihan kepemimpinan tingkat dasar bagi calon Pembina Gerakan Kepanduan Hizbul Wathan untuk membekali dasar-dasar kepemimpinan, kepanduan Islami, dan manajemen qabilah.',
    status: 'Buka',
    tataTertib: [
      'Kedisiplinan & Ketepatan Waktu: Peserta wajib hadir 15 menit sebelum setiap sesi materi dimulai.',
      'Ketertiban Pakaian: Mengenakan seragam resmi Hizbul Wathan lengkap dengan atribut atribut kelengkapan.',
      'Presensi Sesi Mandiri: Peserta wajib mengisi presensi pada setiap sesi materi yang diselenggarakan.',
      'Pengerjaan Tugas: Mengikuti seluruh rangkaian kegiatan dan mengumpulkan semua penugasan yang dibuat oleh Tim Pelatih.',
      'Adab Kepanduan: Menjaga adab Islami, sopan santun, serta saling menghormati sesama peserta dan pelatih.',
      'Ketentuan Kelulusan & Piagam: Piagam kelulusan hanya dapat didownload oleh peserta yang berstatus LULUS setelah dievaluasi oleh Tim Pelatih.'
    ]
  },
  {
    id: 'act-jati2-default',
    namaKegiatan: 'Pelatihan Jaya Melati 2 (Jati 2) HW Jawa Tengah',
    jenisPelatihan: 'Jati 2',
    lokasiPelatihan: 'Pusdiklat Kwarwil HW Jawa Tengah',
    tanggalPelatihan: 'Jadwal Periodik Kwarwil HW Jateng',
    deskripsi: 'Pelatihan kepemimpinan tingkat lanjutan untuk memperdalam strategi pembinaan, metodologi kepelatihan instruktur, serta manajemen taktis organisasi kwartir.',
    status: 'Buka',
    tataTertib: [
      'Peserta wajib telah memiliki kualifikasi Jaya Melati 1 (Jati 1).',
      'Hadir tepat waktu pada setiap sesi ceramah, diskusi, dan praktik mengajar.',
      'Memakai pakaian seragam HW lengkap dan rapi.',
      'Mengisi daftar presensi digital setiap sesi materi.',
      'Mengumpulkan seluruh tugas mandiri & tugas kelompok dari Tim Pelatih.',
      'Ketentuan Kelulusan & Piagam: Piagam kelulusan dapat didownload jika telah dalam status LULUS.'
    ]
  },
  {
    id: 'act-jari1-default',
    namaKegiatan: 'Pelatihan Jaya Matahari 1 (Jari 1) HW Jawa Tengah',
    jenisPelatihan: 'Jari 1',
    lokasiPelatihan: 'Bumi Perkemahan HW Jawa Tengah',
    tanggalPelatihan: 'Jadwal Perkemahan Kwarwil HW Jateng',
    deskripsi: 'Pelatihan bagi kader remaja/muda Hizbul Wathan untuk membekali kemampuan teknis memimpin regu, survival lapangan, sandi, kompas, serta pertolongan pertama.',
    status: 'Buka',
    tataTertib: [
      'Disiplin tinggi di perkemahan dan mematuhi tata tertib instruktur lapangan.',
      'Membawa perlengkapan pribadi dan pakaian dinas HW.',
      'Wajib mengisi presensi sesi materi dan praktik lapangan.',
      'Mengumpulkan tugas praktik navigasi dan kompas.',
      'Ketentuan Kelulusan & Piagam: Piagam kelulusan hanya aktif dan dapat didownload jika status kepesertaan LULUS.'
    ]
  }
];

export default function PelatihanPage() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  
  const [trainingActivities, setTrainingActivities] = useState<TrainingActivityItem[]>([]);
  const [selectedActivity, setSelectedActivity] = useState<TrainingActivityItem | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<'Jati 1' | 'Jati 2' | 'Jari 1'>('Jati 1');
  const [perspective, setPerspective] = useState<'peserta' | 'admin'>('peserta');
  
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState<any[]>([]);
  const [userApp, setUserApp] = useState<any | null>(null);
  
  // Tab within verified participant portal
  const [activeTab, setActiveTab] = useState<'beranda' | 'materi' | 'sesi' | 'tugas' | 'piagam'>('beranda');
  const [materiList, setMateriList] = useState<any[]>([]);
  const [loadingMateri, setLoadingMateri] = useState(false);
  
  // Submit task state
  const [taskTitle, setTaskTitle] = useState('');
  const [taskLink, setTaskLink] = useState('');
  const [submittingTask, setSubmittingTask] = useState(false);
  const [assignedTasks, setAssignedTasks] = useState<any[]>([]);
  
  // Admin interaction state
  const [searchQuery, setSearchQuery] = useState('');
  const [gradingApp, setGradingApp] = useState<any | null>(null);
  const [gradeInput, setGradeInput] = useState('');
  const [remarkInput, setRemarkInput] = useState('');
  const [passingStatus, setPassingStatus] = useState('Lulus');
  const [actionLoading, setActionLoading] = useState(false);
  
  // Attendance interactive states
  const [activeEditSession, setActiveEditSession] = useState<string | null>(null);
  const [savingAttendance, setSavingAttendance] = useState<Record<string, boolean>>({});

  const loadData = async () => {
    try {
      setLoading(true);
      const apps = await sheetsService.getTrainingApplications();
      setApplications(apps || []);

      // Fetch dynamic training activities from Settings
      try {
        const settingsData = await sheetsService.getSettings();
        if (settingsData) {
          if (settingsData.assignedTasks) {
            const parsed = Array.isArray(settingsData.assignedTasks) 
              ? settingsData.assignedTasks 
              : JSON.parse(settingsData.assignedTasks || '[]');
            setAssignedTasks(parsed);
          }
          if (settingsData.trainingActivities) {
            const acts = Array.isArray(settingsData.trainingActivities)
              ? settingsData.trainingActivities
              : JSON.parse(settingsData.trainingActivities || '[]');
            if (acts && acts.length > 0) {
              setTrainingActivities(acts);
            } else {
              setTrainingActivities(DEFAULT_TRAINING_ACTIVITIES);
            }
          } else {
            setTrainingActivities(DEFAULT_TRAINING_ACTIVITIES);
          }
        } else {
          setTrainingActivities(DEFAULT_TRAINING_ACTIVITIES);
        }
      } catch (err) {
        console.error('Failed to fetch settings for activities:', err);
        setTrainingActivities(DEFAULT_TRAINING_ACTIVITIES);
      }

      // Find user app for selected level or activity
      if (user) {
        const targetLevel = selectedLevel.toLowerCase().replace(/\s+/g, '');
        const myApp = apps?.find((a: any) => {
          const isUserMatch = (a.email && a.email.toLowerCase() === user.email.toLowerCase()) || 
                              (a.userId && String(a.userId) === String(user.id));
          if (!isUserMatch) return false;
          
          const appLevel = (a.pelatihanAkanDiikuti || '').toLowerCase().trim().replace(/\s+/g, '');
          return appLevel === targetLevel || appLevel.includes(targetLevel) || targetLevel.includes(appLevel);
        });
        setUserApp(myApp || null);
      } else {
        setUserApp(null);
      }

      // Fetch materials for current level
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
      console.error('Failed to load training data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedLevel, isAuthenticated, user]);

  useEffect(() => {
    const isRealAdmin = user?.role === 'admin' || user?.role === 'superadmin' || user?.role === 'sugli' || user?.role === 'kwarda';
    if (isRealAdmin) {
      setPerspective('admin');
    } else {
      setPerspective('peserta');
    }
  }, [user]);

  const program = TRAINING_PROGRAMS.find(p => p.id === selectedLevel) || TRAINING_PROGRAMS[0];

  const normalizeLevelCode = (str?: string): string => {
    if (!str) return 'jati1';
    const clean = str.toLowerCase().trim();
    if (clean.includes('jati 2') || clean.includes('jati2') || clean.includes('jaya melati 2') || clean.includes('jm 2') || clean.includes('jm2')) {
      return 'jati2';
    }
    if (clean.includes('jari 1') || clean.includes('jari1') || clean.includes('jaya matahari 1') || clean.includes('jmh 1')) {
      return 'jari1';
    }
    if (clean.includes('jati 1') || clean.includes('jati1') || clean.includes('jaya melati 1') || clean.includes('jm 1') || clean.includes('jm1')) {
      return 'jati1';
    }
    return clean.replace(/\s+/g, '');
  };

  const isUserAppMatch = (a: any, u: any): boolean => {
    if (!a || !u) return false;
    if (a.email && u.email && a.email.toLowerCase().trim() === u.email.toLowerCase().trim()) return true;
    if (a.userId && String(a.userId) === String(u.id)) return true;
    if (a.noWa && u.noHp && String(a.noWa).replace(/[^0-9]/g, '') === String(u.noHp).replace(/[^0-9]/g, '')) return true;
    if (a.nik && u.nik && String(a.nik).trim() === String(u.nik).trim()) return true;
    if (a.nama && u.namaLengkap && a.nama.toLowerCase().trim() === u.namaLengkap.toLowerCase().trim()) return true;
    return false;
  };

  const approvedUserApps = user ? applications.filter((a: any) => {
    if (!isUserAppMatch(a, user)) return false;
    return (
      a.status === 'approved' || 
      a.status === 'terverifikasi' || 
      a.status === 'disetujui' ||
      a.statusPembayaran === 'Lunas' ||
      a.statusKelulusan === 'Lulus'
    );
  }) : [];

  const openApprovedPortal = (app: any, targetTab: 'beranda' | 'materi' | 'sesi' | 'tugas' | 'piagam' = 'materi') => {
    const normLevel = normalizeLevelCode(app?.pelatihanAkanDiikuti);
    const matchedAct = trainingActivities.find(act => normalizeLevelCode(act.jenisPelatihan) === normLevel) || {
      id: app?.id || 'act-approved',
      namaKegiatan: app?.pelatihanAkanDiikuti ? `Pelatihan ${app.pelatihanAkanDiikuti}` : 'Pelatihan HW Jateng',
      jenisPelatihan: app?.pelatihanAkanDiikuti || 'Jati 1',
      status: 'Buka',
      deskripsi: 'Kegiatan Pelatihan HW Jateng Terverifikasi',
      lokasiPelatihan: app?.lokasiPelatihan || 'Pusdiklat HW Jateng',
      tanggalPelatihan: app?.tanggalPelatihan || 'Sesuai Jadwal',
      biayaPelatihan: app?.biayaPelatihan || 'Rp 50.000',
      rekeningPembiayaan: app?.rekeningPembiayaan || 'Bank BSI 7307427448',
      noWhatsappPanitia: app?.noWhatsappPanitia || '089688754000'
    };

    setSelectedActivity(matchedAct);
    if (['jati1', 'jati2', 'jari1'].includes(normLevel)) {
      const levelName = normLevel === 'jati2' ? 'Jati 2' : normLevel === 'jari1' ? 'Jari 1' : 'Jati 1';
      setSelectedLevel(levelName as any);
    }
    setUserApp(app);
    setActiveTab(targetTab);
  };

  // Check if user is verified for a specific level or selected activity
  const isUserVerifiedForActivity = (activityJenis: string): { isVerified: boolean; userApplication: any | null } => {
    if (!user) return { isVerified: false, userApplication: null };

    const targetKey = normalizeLevelCode(activityJenis);

    // Check if user has an application
    const myApp = applications.find((a: any) => {
      if (!isUserAppMatch(a, user)) return false;
      const appKey = normalizeLevelCode(a.pelatihanAkanDiikuti);
      return appKey === targetKey || appKey.includes(targetKey) || targetKey.includes(appKey);
    });

    const isApproved = myApp && (
      myApp.status === 'approved' || 
      myApp.status === 'terverifikasi' || 
      myApp.status === 'disetujui' ||
      myApp.statusPembayaran === 'Lunas' ||
      myApp.statusKelulusan === 'Lulus'
    );

    const isAdmin = user.role === 'admin' || user.role === 'superadmin' || user.role === 'sugli' || user.role === 'kwarda' || perspective === 'admin';

    const userRoles = user.roles || [user.role];
    const hasRoleMatch = userRoles.some(r => normalizeLevelCode(r) === targetKey);
    const userPelatihan = user.pelatihan || [];
    const hasPelatihanMatch = userPelatihan.some(p => normalizeLevelCode(p) === targetKey);

    const isVerified = Boolean(isApproved || isAdmin || hasRoleMatch || hasPelatihanMatch);

    return { isVerified, userApplication: myApp || null };
  };

  // Helper for attendance status
  const getAttendanceStatus = (attendanceMap: any, sesId: string): string => {
    if (!attendanceMap) return 'belum';
    const item = attendanceMap[sesId];
    if (item === undefined || item === null) return 'belum';
    if (typeof item === 'boolean') return item ? 'hadir' : 'absen';
    if (typeof item === 'object' && item !== null) return item.status || 'belum';
    if (typeof item === 'string') {
      if (item === 'true') return 'hadir';
      if (item === 'false') return 'absen';
      return item;
    }
    return 'belum';
  };

  const getAttendanceTimestamp = (attendanceMap: any, sesId: string): string | null => {
    const item = attendanceMap[sesId];
    if (item && typeof item === 'object' && item !== null) {
      return item.timestamp || null;
    }
    return null;
  };

  // Participant attendance submission
  const handleUserSubmitAttendance = async (sessionId: string, status: string) => {
    if (!userApp) {
      alert('Data pendaftaran Anda tidak ditemukan.');
      return;
    }
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
      
      const updatedUserApp = { ...userApp, kehadiran: JSON.stringify(attendanceMap) };
      setUserApp(updatedUserApp);
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

  // Participant assignment submission
  const handleUserSubmitTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userApp) {
      alert('Anda belum terdaftar atau pendaftaran belum disetujui untuk kegiatan ini.');
      return;
    }
    if (!taskTitle || !taskLink) {
      alert('Mohon lengkapi nama tugas dan tautan (link) tugas Anda.');
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
      alert('Tugas berhasil dikumpulkan ke Tim Pelatih!');
      setTaskTitle('');
      setTaskLink('');
      loadData();
    } catch (err: any) {
      alert('Gagal mengumpulkan tugas: ' + err.message);
    } finally {
      setSubmittingTask(false);
    }
  };

  // Admin approval
  const handleUpdateStatus = async (appId: string, status: 'approved' | 'rejected') => {
    if (!window.confirm(`Apakah Anda yakin ingin ${status === 'approved' ? 'menyetujui & memverifikasi' : 'menolak'} pendaftaran ini?`)) return;
    try {
      // 1. Optimistic state updates
      setApplications(prev => prev.map(a => String(a.id) === String(appId) ? { ...a, status } : a));
      if (userApp && String(userApp.id) === String(appId)) {
        setUserApp((prev: any) => ({ ...prev, status }));
      }
      alert(`Pendaftaran berhasil ${status === 'approved' ? 'disetujui' : 'ditolak'}!`);

      // 2. Background sync
      (async () => {
        await sheetsService.updateTrainingStatus(appId, status, status === 'approved' ? 'Pendaftaran disetujui oleh admin' : 'Pendaftaran ditolak');
        loadData();
      })().catch(err => console.warn('Background update training status warning:', err));

    } catch (err: any) {
      alert('Gagal mengupdate status: ' + err.message);
    }
  };

  // Admin attendance control
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

      attendanceMap[sessionId] = { status, timestamp };

      await sheetsService.updateAttendance(app.id, JSON.stringify(attendanceMap));
      loadData();
    } catch (err: any) {
      alert('Gagal mengupdate kehadiran: ' + err.message);
    }
  };

  const openGradingDialog = (app: any) => {
    setGradingApp(app);
    setGradeInput(app.nilai || '');
    setRemarkInput(app.remark || '');
    setPassingStatus(app.statusKelulusan || 'Lulus');
  };

  const handleSaveGrade = async () => {
    if (!gradingApp) return;
    try {
      setActionLoading(true);
      await sheetsService.updateGrade(gradingApp.id, {
        grade: gradeInput,
        remark: remarkInput,
        statusKelulusan: passingStatus
      });
      alert('Penilaian & Status Kelulusan berhasil disimpan!');
      setGradingApp(null);
      loadData();
    } catch (err: any) {
      alert('Gagal menyimpan penilaian: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const parseAttendance = (app: any): Record<string, any> => {
    if (!app || !app.kehadiran) return {};
    try {
      const res = typeof app.kehadiran === 'string' ? JSON.parse(app.kehadiran) : app.kehadiran;
      return typeof res === 'object' ? res : {};
    } catch (e) {
      return {};
    }
  };

  const parseTasks = (app: any): any[] => {
    if (!app || !app.tugas) return [];
    try {
      const res = typeof app.tugas === 'string' ? JSON.parse(app.tugas) : app.tugas;
      return Array.isArray(res) ? res : [];
    } catch (e) {
      return [];
    }
  };

  const filteredApps = applications.filter(app => {
    const matchesLevel = (app.pelatihanAkanDiikuti || '').toLowerCase().trim().replace(/\s+/g, '') === selectedLevel.toLowerCase().replace(/\s+/g, '');
    const matchesQuery = !searchQuery ? true : (
      (app.nama || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (app.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (app.asalDaerah || '').toLowerCase().includes(searchQuery.toLowerCase())
    );
    return matchesLevel && matchesQuery;
  });

  const isRealAdmin = user?.role === 'admin' || user?.role === 'superadmin' || user?.role === 'sugli' || user?.role === 'kwarda';

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header & Navigation */}
      <div className="flex items-center justify-between">
        <button 
          onClick={() => navigate(-1)} 
          className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-gray-500 hover:text-hw-green transition-colors cursor-pointer"
        >
          <ChevronLeft size={16} />
          Kembali
        </button>

        {isRealAdmin && (
          <div className="bg-gray-100 p-1 rounded-2xl flex items-center border border-gray-200/60 shadow-xs">
            <button
              onClick={() => setPerspective('peserta')}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                perspective === 'peserta' ? 'bg-white text-hw-green shadow-xs' : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              Mode Anggota
            </button>
            <button
              onClick={() => setPerspective('admin')}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                perspective === 'admin' ? 'bg-hw-green text-white shadow-xs' : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              Kelola Admin
            </button>
          </div>
        )}
      </div>

      {/* Hero Header Card */}
      <div className="flex flex-col gap-2 bg-gradient-to-r from-emerald-700 via-teal-600 to-sky-600 p-6 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden">
        <div className="absolute -right-6 -bottom-6 opacity-10 pointer-events-none">
          <GraduationCap size={180} />
        </div>

        <div className="flex items-center gap-2">
          <GraduationCap className="text-emerald-200 animate-pulse" size={24} />
          <span className="text-[10px] font-black uppercase tracking-widest text-emerald-100 bg-white/10 px-3 py-1 rounded-full border border-white/20">
            Satu HW Training Portal
          </span>
        </div>

        <h2 className="text-2xl font-black text-white leading-tight font-display">
          Pelatihan Kepanduan HW Jawa Tengah
        </h2>
        <p className="text-xs text-emerald-100 font-medium max-w-xl leading-relaxed">
          Daftar kegiatan pelatihan resmi HW Jateng. Setelah terverifikasi sebagai peserta, Anda dapat mengakses materi, absensi per sesi, tugas tim pelatih, dan mengunduh piagam kelulusan.
        </p>
      </div>

      {/* Main View Switcher */}
      {perspective === 'peserta' ? (
        /* ========================================================================= */
        /* MODE ANGGOTA: DAFTAR KEGIATAN & PORTAL KEBUTUHAN PELATIHAN                */
        /* ========================================================================= */
        <div className="space-y-6">
          {!selectedActivity ? (
            /* --------------------------------------------------------------------- */
            /* MODE A: DAFTAR KEGIATAN PELATIHAN HW JATENG (MAIN DEFAULT VIEW)       */
            /* --------------------------------------------------------------------- */
            <div className="space-y-5 animate-fade-in">
              {/* Approved Participant Quick Access Banner */}
              {approvedUserApps.length > 0 && (
                <div className="bg-gradient-to-br from-emerald-800 via-hw-green to-teal-800 text-white p-6 rounded-[2rem] shadow-md border border-emerald-400/30 space-y-4 relative overflow-hidden">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-emerald-500/40 pb-4">
                    <div className="space-y-1">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 backdrop-blur-md text-amber-300 rounded-full text-[10px] font-black uppercase tracking-wider">
                        <Sparkles size={13} className="text-amber-300" /> PESERTA TERVERIFIKASI & DISETUJUI
                      </span>
                      <h3 className="font-display font-black text-white text-lg leading-tight">
                        Fitur & Portal Peserta Pelatihan Anda
                      </h3>
                      <p className="text-xs text-emerald-100 font-medium">
                        Selamat! Status pendaftaran Anda ({approvedUserApps.map(a => a.pelatihanAkanDiikuti || 'Jati 1').join(', ')}) telah disetujui Admin. Akses cepat fitur peserta pelatihan di bawah ini:
                      </p>
                    </div>
                  </div>

                  {/* Quick Access Feature Buttons */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                    <button
                      onClick={() => openApprovedPortal(approvedUserApps[0], 'materi')}
                      className="p-3.5 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-2xl border border-white/20 text-white text-left transition-all group cursor-pointer shadow-xs hover:scale-[1.02]"
                    >
                      <div className="w-8 h-8 rounded-xl bg-amber-400 text-emerald-950 flex items-center justify-center font-black mb-2 group-hover:scale-110 transition-transform">
                        <BookOpen size={16} />
                      </div>
                      <div className="text-xs font-black uppercase tracking-wider">Materi</div>
                      <div className="text-[10px] text-emerald-100">Modul & PDF</div>
                    </button>

                    <button
                      onClick={() => openApprovedPortal(approvedUserApps[0], 'sesi')}
                      className="p-3.5 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-2xl border border-white/20 text-white text-left transition-all group cursor-pointer shadow-xs hover:scale-[1.02]"
                    >
                      <div className="w-8 h-8 rounded-xl bg-emerald-400 text-emerald-950 flex items-center justify-center font-black mb-2 group-hover:scale-110 transition-transform">
                        <CheckCircle2 size={16} />
                      </div>
                      <div className="text-xs font-black uppercase tracking-wider">Absen</div>
                      <div className="text-[10px] text-emerald-100">Presensi Sesi</div>
                    </button>

                    <button
                      onClick={() => openApprovedPortal(approvedUserApps[0], 'tugas')}
                      className="p-3.5 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-2xl border border-white/20 text-white text-left transition-all group cursor-pointer shadow-xs hover:scale-[1.02]"
                    >
                      <div className="w-8 h-8 rounded-xl bg-blue-400 text-emerald-950 flex items-center justify-center font-black mb-2 group-hover:scale-110 transition-transform">
                        <FileText size={16} />
                      </div>
                      <div className="text-xs font-black uppercase tracking-wider">Tugas</div>
                      <div className="text-[10px] text-emerald-100">Upload Tugas</div>
                    </button>

                    <button
                      onClick={() => openApprovedPortal(approvedUserApps[0], 'piagam')}
                      className="p-3.5 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-2xl border border-white/20 text-white text-left transition-all group cursor-pointer shadow-xs hover:scale-[1.02]"
                    >
                      <div className="w-8 h-8 rounded-xl bg-purple-400 text-emerald-950 flex items-center justify-center font-black mb-2 group-hover:scale-110 transition-transform">
                        <Award size={16} />
                      </div>
                      <div className="text-xs font-black uppercase tracking-wider">Piagam</div>
                      <div className="text-[10px] text-emerald-100">E-Sertifikat</div>
                    </button>
                  </div>
                </div>
              )}
              <div className="bg-white p-5 rounded-[2rem] border border-gray-100 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <Calendar className="text-hw-green" size={20} />
                      <h3 className="font-display font-black text-gray-800 text-base uppercase tracking-wider">
                        DAFTAR KEGIATAN PELATIHAN HW JATENG
                      </h3>
                    </div>
                    <p className="text-xs text-gray-400 mt-1 font-medium">
                      Pilih kegiatan pelatihan resmi yang dibuat oleh Admin untuk mendaftar atau membuka portal kebutuhan pelatihan Anda.
                    </p>
                  </div>
                  <span className="text-[10px] font-black bg-hw-green/10 text-hw-green px-3 py-1.5 rounded-full uppercase self-start sm:self-center">
                    {trainingActivities.length} Kegiatan Aktif
                  </span>
                </div>

                {/* List of Training Activities */}
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-12 space-y-3">
                    <Loader2 className="animate-spin text-hw-green" size={28} />
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Memuat kegiatan pelatihan...</p>
                  </div>
                ) : trainingActivities.length > 0 ? (
                  <div className="grid grid-cols-1 gap-4">
                    {trainingActivities.map((act) => {
                      const { isVerified, userApplication } = isUserVerifiedForActivity(act.jenisPelatihan);
                      const isClosed = act.status === 'Tutup';

                      return (
                        <div 
                          key={act.id}
                          className={`p-5 rounded-[2rem] border transition-all space-y-3.5 relative overflow-hidden ${
                            isVerified 
                              ? 'bg-gradient-to-br from-emerald-50/90 via-white to-teal-50/50 border-emerald-200 shadow-md' 
                              : 'bg-white hover:bg-gray-50/80 border-gray-150/80 shadow-xs'
                          }`}
                        >
                          {/* Card Header Tag */}
                          <div className="flex items-start justify-between gap-3 flex-wrap">
                            <div className="flex items-center gap-2">
                              <span className="text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg bg-emerald-700 text-white shadow-xs">
                                {act.jenisPelatihan || 'Pelatihan Jaya Melati'}
                              </span>
                              {isClosed ? (
                                <span className="text-[9px] font-black px-2.5 py-1 rounded-full bg-red-100 text-red-600 uppercase tracking-wider">
                                  Tutup Pendaftaran
                                </span>
                              ) : (
                                <span className="text-[9px] font-black px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 uppercase tracking-wider">
                                  Pendaftaran Buka
                                </span>
                              )}
                            </div>

                            {/* Status Verification Badge on Activity Card */}
                            {isVerified && (
                              <span className="text-[9.5px] font-black bg-emerald-500 text-white px-3 py-1 rounded-full uppercase tracking-wider shadow-xs flex items-center gap-1 animate-pulse">
                                <CheckCircle2 size={12} /> Peserta Terverifikasi
                              </span>
                            )}
                          </div>

                          {/* Activity Title */}
                          <div>
                            <h4 className="font-display font-black text-gray-850 text-base leading-snug">
                              {act.namaKegiatan}
                            </h4>
                            {act.deskripsi && (
                              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                                {act.deskripsi}
                              </p>
                            )}
                          </div>

                          {/* Location, Date, Cost & Account Metadata */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-gray-600 font-medium">
                            <div className="flex items-center gap-2 bg-gray-50/80 px-3 py-2 rounded-xl border border-gray-100">
                              <MapPin size={14} className="text-hw-green shrink-0" />
                              <span className="truncate">{act.lokasiPelatihan || 'Lokasi Pusdiklat HW'}</span>
                            </div>
                            <div className="flex items-center gap-2 bg-gray-50/80 px-3 py-2 rounded-xl border border-gray-100">
                              <Calendar size={14} className="text-hw-green shrink-0" />
                              <span className="truncate">{act.tanggalPelatihan || 'Jadwal Reguler Kwarwil HW'}</span>
                            </div>
                            <div className="flex items-center gap-2 bg-emerald-50/60 px-3 py-2 rounded-xl border border-emerald-100 text-emerald-900">
                              <span className="text-xs font-bold">💰 Biaya:</span>
                              <span className="font-extrabold text-emerald-950">{act.biayaPelatihan || 'Rp 50.000'}</span>
                            </div>
                            <div className="flex items-center gap-2 bg-emerald-50/60 px-3 py-2 rounded-xl border border-emerald-100 text-emerald-900">
                              <span className="text-xs font-bold">🏦 Rekening:</span>
                              <span className="truncate text-[11px] font-mono">{act.rekeningPembiayaan || 'Bank BSI 7307427448'}</span>
                            </div>
                          </div>

                          {/* Status & Tagihan Details for Member */}
                          {userApplication && !isVerified && (
                            <div className="bg-amber-50/90 p-4 rounded-2xl border border-amber-200/80 text-xs text-amber-900 space-y-2.5 shadow-xs">
                              <div className="flex items-center justify-between">
                                <span className="font-black text-[10px] uppercase tracking-wider text-amber-800 flex items-center gap-1">
                                  <CreditCard size={13} className="text-amber-700" />
                                  <span>Tagihan & Status Pendaftaran Anda</span>
                                </span>
                                <span className={`text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                                  userApplication.status === 'pending' ? 'bg-amber-200 text-amber-900 border border-amber-300' : 'bg-red-200 text-red-900'
                                }`}>
                                  {userApplication.status === 'pending' ? 'Menunggu Verifikasi Admin' : 'Ditolak'}
                                </span>
                              </div>
                              <p className="text-[11px] text-amber-800 leading-relaxed">
                                Pendaftaran dikirim pada <strong>{new Date(userApplication.tanggalAjuan || Date.now()).toLocaleDateString('id-ID')}</strong>. Silahkan lakukan transfer pembiayaan untuk memverifikasi kepesertaan Anda:
                              </p>
                              
                              <div className="bg-white p-3 rounded-xl border border-amber-200 space-y-1 text-gray-800">
                                <div className="flex justify-between text-[11px]">
                                  <span className="text-gray-500 font-medium">Biaya Pelatihan:</span>
                                  <span className="font-black text-emerald-700">{userApplication.biayaPelatihan || act.biayaPelatihan || 'Rp 50.000'}</span>
                                </div>
                                <div className="flex justify-between text-[11px] pt-1 border-t border-gray-100">
                                  <span className="text-gray-500 font-medium">Rekening Tujuan:</span>
                                  <span className="font-bold text-gray-900 text-right">{userApplication.rekeningPembiayaan || act.rekeningPembiayaan || 'Bank BSI 7307427448 a.n. Kwarwil HW Jateng'}</span>
                                </div>
                              </div>

                              <a
                                href={`https://wa.me/${(userApplication.noWhatsappPanitia || act.noWhatsappPanitia || '089688754000').replace(/[^0-9]/g, '').replace(/^0/, '62')}?text=${encodeURIComponent(`Assalamu'alaikum Panitia, saya ${userApplication.nama || user?.namaLengkap} telah mendaftar pelatihan ${act.namaKegiatan}. Berikut bukti konfirmasi transfer pembiayaan (${userApplication.biayaPelatihan || act.biayaPelatihan || 'Rp 50.000'}). Mohon konfirmasinya. Terima kasih.`)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-center gap-2 w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-xs transition-all cursor-pointer"
                              >
                                <MessageCircle size={15} />
                                <span>Konfirmasi Transfer via WhatsApp Panitia ({userApplication.noWhatsappPanitia || act.noWhatsappPanitia || '089688754000'})</span>
                              </a>
                            </div>
                          )}

                          {/* Action Buttons */}
                          <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-gray-100">
                            <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                              {isVerified ? 'Akses Kebutuhan Pelatihan Terbuka' : 'Syarat & Formulir Pendaftaran'}
                            </div>

                            <div className="flex gap-2">
                              {isVerified ? (
                                <button
                                  onClick={() => {
                                    setSelectedActivity(act);
                                    if (['Jati 1', 'Jati 2', 'Jari 1'].includes(act.jenisPelatihan)) {
                                      setSelectedLevel(act.jenisPelatihan as any);
                                    }
                                    setActiveTab('beranda');
                                  }}
                                  className="px-5 py-2.5 bg-hw-green hover:bg-emerald-700 text-white rounded-xl font-black text-xs flex items-center gap-2 uppercase tracking-wider transition-all shadow-md hover:scale-[1.02] cursor-pointer"
                                >
                                  <span>Buka Portal Pelatihan Saya</span>
                                  <ChevronRight size={16} />
                                </button>
                              ) : (
                                <button
                                  onClick={() => navigate('/daftar-pelatihan', { state: { activity: act } })}
                                  disabled={isClosed}
                                  className={`px-4 py-2.5 rounded-xl font-black text-xs flex items-center gap-1.5 uppercase tracking-wider transition-all ${
                                    isClosed
                                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                      : 'bg-hw-green hover:bg-emerald-700 text-white shadow-xs hover:scale-[1.02] cursor-pointer'
                                  }`}
                                >
                                  <span>Daftar Kegiatan Ini</span>
                                  <ChevronRight size={14} />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 bg-gray-50 rounded-2xl border border-dashed border-gray-200 space-y-2">
                    <GraduationCap className="mx-auto text-gray-400" size={32} />
                    <p className="text-xs text-gray-600 font-bold">Belum ada kegiatan pelatihan aktif yang terdaftar.</p>
                    <p className="text-[10px] text-gray-400">Pengurus HW Jateng akan mengumumkan jadwal kegiatan pelatihan terbaru di sini.</p>
                    <button
                      onClick={() => navigate('/daftar-pelatihan')}
                      className="mt-2 inline-flex items-center gap-1 bg-hw-green text-white text-xs font-black uppercase tracking-wider px-4 py-2 rounded-xl hover:bg-emerald-700 transition-colors"
                    >
                      Formulir Pendaftaran Umum
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* --------------------------------------------------------------------- */
            /* MODE B: PORTAL KEBUTUHAN PELATIHAN (WHEN A VERIFIED ACTIVITY IS OPENED)*/
            /* --------------------------------------------------------------------- */
            <div className="space-y-6 animate-fade-in">
              {/* Back to Activity List Header */}
              <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-emerald-100 shadow-xs">
                <button
                  onClick={() => setSelectedActivity(null)}
                  className="inline-flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-black uppercase tracking-wider px-3.5 py-2 rounded-xl transition-all cursor-pointer"
                >
                  <ArrowLeft size={16} />
                  <span>Daftar Kegiatan Pelatihan</span>
                </button>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black bg-emerald-500 text-white px-3 py-1 rounded-full uppercase tracking-wider shadow-xs flex items-center gap-1">
                    <CheckCircle2 size={12} /> Peserta Terverifikasi
                  </span>
                </div>
              </div>

              {/* Verified Activity Header Summary */}
              <div className="bg-white p-5 rounded-[2rem] border border-gray-100 shadow-sm space-y-2 text-left">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg bg-emerald-700 text-white">
                    {selectedActivity.jenisPelatihan || selectedLevel}
                  </span>
                  {userApp?.statusKelulusan === 'Lulus' && (
                    <span className="text-[10px] font-black bg-amber-500 text-white px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1">
                      <Sparkles size={12} /> LULUS PELATIHAN 🎉
                    </span>
                  )}
                </div>
                <h3 className="font-display font-black text-gray-800 text-lg">
                  {selectedActivity.namaKegiatan}
                </h3>
                <p className="text-xs text-gray-500">
                  {selectedActivity.lokasiPelatihan || 'Pusdiklat HW'} • {selectedActivity.tanggalPelatihan || 'Jadwal Pelatihan'}
                </p>
              </div>

              {/* Portal Navigation Tabs: Beranda, Materi, Sesi & Absen, Tugas, Piagam */}
              <div className="bg-gray-100/80 p-1.5 rounded-2xl border border-gray-200/60 shadow-xs grid grid-cols-5 gap-1">
                {[
                  { id: 'beranda', shortLabel: 'Beranda', fullLabel: 'Beranda & Rules', icon: Info },
                  { id: 'materi', shortLabel: 'Materi', fullLabel: 'Materi Pelatihan', icon: BookOpen },
                  { id: 'sesi', shortLabel: 'Sesi & Absen', fullLabel: 'Sesi & Absen', icon: Calendar },
                  { id: 'tugas', shortLabel: 'Tugas', fullLabel: 'Tugas Tim Pelatih', icon: ClipboardList },
                  { id: 'piagam', shortLabel: 'Piagam', fullLabel: 'Piagam Digital', icon: Award }
                ].map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`py-3 px-1 rounded-xl text-[9px] sm:text-xs font-black uppercase tracking-tight transition-all flex flex-col sm:flex-row items-center justify-center gap-1.5 text-center cursor-pointer ${
                        isActive
                          ? 'bg-emerald-700 text-white shadow-sm scale-[1.02]'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-white/60'
                      }`}
                    >
                      <Icon size={15} className="shrink-0" />
                      <span className="hidden md:inline">{tab.fullLabel}</span>
                      <span className="md:hidden">{tab.shortLabel}</span>
                    </button>
                  );
                })}
              </div>

              {/* TAB CONTENTS */}
              <div className="min-h-[300px]">
                {/* 1. BERANDA & TATA TERTIB TAB */}
                {activeTab === 'beranda' && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4 text-left">
                    {/* Activity Overview */}
                    <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm space-y-3">
                      <div className="flex items-center gap-2">
                        <ScrollText className="text-hw-green" size={18} />
                        <h4 className="text-xs font-black text-gray-800 uppercase tracking-wider font-display">
                          Penjelasan Kegiatan Pelatihan
                        </h4>
                      </div>
                      <p className="text-xs text-gray-600 leading-relaxed">
                        {selectedActivity.deskripsi || program.description}
                      </p>
                    </div>

                    {/* Tata Tertib Peserta Pelatihan */}
                    <div className="bg-white p-5 rounded-3xl border border-emerald-100 shadow-sm space-y-3">
                      <div className="flex items-center gap-2">
                        <Shield className="text-emerald-600" size={18} />
                        <h4 className="text-xs font-black text-gray-800 uppercase tracking-wider font-display">
                          Tata Tertib Peserta Pelatihan HW Jateng
                        </h4>
                      </div>
                      <p className="text-[11px] text-gray-500">
                        Seluruh peserta wajib memahami dan mematuhi seluruh tata tertib pelaksanaan kegiatan selama pelatihan berlangsung:
                      </p>
                      <ul className="space-y-2.5 pt-1">
                        {(selectedActivity.tataTertib || [
                          'Kedisiplinan & Ketepatan Waktu: Peserta wajib hadir 15 menit sebelum setiap sesi materi dimulai.',
                          'Ketertiban Pakaian: Mengenakan seragam resmi Hizbul Wathan lengkap dengan atribut kelengkapan.',
                          'Presensi Sesi Mandiri: Peserta wajib melakukan presensi pada setiap sesi materi yang diselenggarakan.',
                          'Pengerjaan Tugas: Mengikuti seluruh rangkaian kegiatan dan mengumpulkan semua penugasan yang dibuat oleh Tim Pelatih.',
                          'Adab Kepanduan: Menjaga adab Islami, sopan santun, serta saling menghormati sesama peserta dan pelatih.',
                          'Ketentuan Kelulusan & Piagam: Piagam kelulusan hanya dapat didownload oleh peserta yang berstatus LULUS setelah dievaluasi oleh Tim Pelatih.'
                        ]).map((rule, idx) => (
                          <li key={idx} className="flex gap-2.5 text-xs text-gray-700 bg-emerald-50/40 p-3 rounded-2xl border border-emerald-100/60 leading-relaxed">
                            <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                              {idx + 1}
                            </span>
                            <span>{rule}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* User Participant Status Card */}
                    {userApp && (
                      <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm space-y-3">
                        <h4 className="text-xs font-black text-gray-800 uppercase tracking-wider font-display">
                          Informasi Kepesertaan Anda
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                          <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100 space-y-1">
                            <span className="text-[9px] font-bold text-gray-400 uppercase">Nama Peserta</span>
                            <p className="font-bold text-gray-800">{userApp.nama || user?.namaLengkap}</p>
                          </div>
                          <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100 space-y-1">
                            <span className="text-[9px] font-bold text-gray-400 uppercase">Asal Kwarda / Qabilah</span>
                            <p className="font-bold text-gray-800">{userApp.asalDaerah || 'Jawa Tengah'}</p>
                          </div>
                          <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100 space-y-1">
                            <span className="text-[9px] font-bold text-gray-400 uppercase">Status Kelulusan</span>
                            <p className={`font-black ${userApp.statusKelulusan === 'Lulus' ? 'text-emerald-600' : 'text-amber-600'}`}>
                              {userApp.statusKelulusan || 'Proses Pelatihan'}
                            </p>
                          </div>
                          <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100 space-y-1">
                            <span className="text-[9px] font-bold text-gray-400 uppercase">Nilai Evaluasi Pelatih</span>
                            <p className="font-black text-gray-800">{userApp.nilai || 'Belum Dinilai'}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}

                {/* 2. MATERI PELATIHAN TAB */}
                {activeTab === 'materi' && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4 text-left">
                    <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-black text-gray-800 uppercase tracking-wider font-display">
                          Materi & Modul Pembelajaran {selectedActivity.jenisPelatihan || selectedLevel}
                        </h4>
                        <span className="text-[9px] font-black bg-hw-green/10 text-hw-green px-2.5 py-1 rounded-md uppercase">
                          {materiList.length} Berkas
                        </span>
                      </div>
                      <p className="text-xs text-gray-400">
                        Unduh berkas materi, slide presentasi, dan panduan kurikulum pelatihan yang diunggah oleh Tim Pelatih.
                      </p>
                    </div>

                    {loadingMateri ? (
                      <div className="flex flex-col items-center justify-center py-10 space-y-2 bg-white rounded-3xl border border-gray-100 shadow-sm">
                        <Loader2 className="animate-spin text-hw-green" size={24} />
                        <p className="text-xs text-gray-400 font-bold uppercase tracking-widest animate-pulse">Memuat berkas materi...</p>
                      </div>
                    ) : materiList.length === 0 ? (
                      <div className="bg-white p-8 rounded-3xl border border-gray-100 text-center text-gray-400 shadow-sm">
                        <FileText size={28} className="mx-auto text-gray-300 mb-2" />
                        <p className="text-xs font-bold">Belum ada materi penunjang yang diunggah.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-3">
                        {materiList.map((item, index) => (
                          <div
                            key={`materi-item-${item.id}-${index}`}
                            className="bg-white rounded-2xl p-4 shadow-xs border border-gray-100 hover:shadow-sm transition-all flex items-center gap-4 text-left"
                          >
                            <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 bg-gray-50 flex items-center justify-center border border-gray-100">
                              <img 
                                src={item.coverImage || 'https://upload.wikimedia.org/wikipedia/id/b/ba/Logo_Hizbul_Wathan.png'} 
                                alt={item.judul} 
                                className="w-full h-full object-cover" 
                              />
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <h5 className="font-display font-bold text-gray-800 text-xs leading-tight break-words">
                                {item.judul}
                              </h5>
                              <p className="text-gray-400 text-[10px] font-medium mt-1">
                                Tanggal: {item.tanggal ? new Date(item.tanggal).toLocaleDateString('id-ID') : '-'}
                              </p>
                            </div>

                            <div className="shrink-0 ml-auto">
                              {item.driveUrl && (
                                <a 
                                  href={item.driveUrl} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1.5 px-3 py-2 bg-hw-green/10 text-hw-green hover:bg-hw-green hover:text-white rounded-xl transition-all font-black text-xs uppercase"
                                  title="Unduh Berkas Materi"
                                >
                                  <Download size={14} />
                                  <span>Unduh</span>
                                </a>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}

                {/* 3. SESI & ABSEN TAB */}
                {activeTab === 'sesi' && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4 text-left">
                    <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-black text-gray-800 uppercase tracking-wider font-display">
                          Sesi Materi & Presensi Kehadiran
                        </h4>
                        <span className="text-[9px] font-black bg-gray-100 text-gray-600 px-2.5 py-1 rounded-md uppercase">
                          {program.sessions.length} Sesi
                        </span>
                      </div>
                      <p className="text-xs text-gray-400">
                        Lakukan presensi kehadiran mandiri pada setiap sesi materi yang diselenggarakan.
                      </p>
                    </div>

                    <div className="space-y-3">
                      {program.sessions.map((ses) => {
                        const attendanceMap = parseAttendance(userApp);
                        const status = getAttendanceStatus(attendanceMap, ses.id);
                        const timestamp = getAttendanceTimestamp(attendanceMap, ses.id);
                        const isEditing = activeEditSession === ses.id;
                        
                        return (
                          <div key={ses.id} className="bg-white p-4.5 rounded-2xl border border-gray-100 shadow-xs flex flex-col gap-3 text-left">
                            <div className="flex items-start justify-between gap-4">
                              <div className="space-y-1">
                                <span className="text-[9px] font-black uppercase tracking-widest text-hw-green bg-hw-green/10 px-2 py-0.5 rounded-md">
                                  {ses.id}
                                </span>
                                <h5 className="text-xs font-black text-gray-800 mt-1">{ses.title}</h5>
                                <p className="text-[11px] text-gray-500 leading-normal">{ses.description}</p>
                              </div>
                              
                              <div className="shrink-0 pt-1 flex items-center gap-1.5">
                                {status === 'hadir' ? (
                                  <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-emerald-500 text-white uppercase flex items-center gap-1">
                                    <Check size={12} /> Hadir
                                  </span>
                                ) : status === 'izin' ? (
                                  <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-blue-500 text-white uppercase">
                                    Izin
                                  </span>
                                ) : status === 'absen' ? (
                                  <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-red-500 text-white uppercase">
                                    Absen
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-gray-100 text-gray-400 uppercase">
                                    Belum Presensi
                                  </span>
                                )}

                                {!isEditing && (
                                  <button
                                    onClick={() => setActiveEditSession(ses.id)}
                                    className="p-1.5 text-gray-400 hover:text-hw-green hover:bg-gray-100 rounded-lg transition-all"
                                    title="Isi / Ubah Presensi"
                                  >
                                    <Pencil size={12} />
                                  </button>
                                )}
                              </div>
                            </div>

                            {timestamp && (
                              <div className="flex items-center gap-1.5 text-[10px] text-gray-400 bg-gray-50 px-2.5 py-1 rounded-lg w-max font-bold font-sans">
                                <Clock size={11} className="text-gray-400" />
                                <span>Presensi Tercatat: {timestamp}</span>
                              </div>
                            )}

                            {isEditing && (
                              <div className="mt-1 pt-3 border-t border-dashed border-gray-200 flex flex-col gap-2">
                                <span className="text-[10px] font-black text-gray-500 uppercase tracking-wider">
                                  Pilih Status Presensi Sesi Ini:
                                </span>
                                <div className="grid grid-cols-4 gap-2">
                                  <button
                                    disabled={savingAttendance[ses.id]}
                                    onClick={() => handleUserSubmitAttendance(ses.id, 'hadir')}
                                    className="py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-1 cursor-pointer"
                                  >
                                    {savingAttendance[ses.id] ? <Loader2 size={12} className="animate-spin" /> : 'Hadir ✓'}
                                  </button>

                                  <button
                                    disabled={savingAttendance[ses.id]}
                                    onClick={() => handleUserSubmitAttendance(ses.id, 'izin')}
                                    className="py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-1 cursor-pointer"
                                  >
                                    Izin
                                  </button>

                                  <button
                                    disabled={savingAttendance[ses.id]}
                                    onClick={() => handleUserSubmitAttendance(ses.id, 'absen')}
                                    className="py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all bg-red-600 hover:bg-red-700 text-white flex items-center justify-center gap-1 cursor-pointer"
                                  >
                                    Tidak Hadir
                                  </button>

                                  <button
                                    onClick={() => setActiveEditSession(null)}
                                    className="py-2 rounded-xl bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-black uppercase tracking-wider transition-all cursor-pointer"
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

                {/* 4. TUGAS TIM PELATIH TAB */}
                {activeTab === 'tugas' && (() => {
                  const myTasks = assignedTasks.filter(t => t.level === selectedLevel);
                  return (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4 text-left">
                      {/* Standard Syllabus Assignments */}
                      <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm space-y-3">
                        <h4 className="text-xs font-black text-gray-800 uppercase tracking-wider font-display">
                          Daftar Penugasan Wajib Pelatihan
                        </h4>
                        <div className="space-y-2.5">
                          {program.assignments.map((asg) => (
                            <div key={asg.id} className="bg-gray-50 p-3.5 rounded-2xl border border-gray-100 space-y-1">
                              <h5 className="text-xs font-black text-gray-800 flex items-center gap-1.5">
                                <FileText size={14} className="text-hw-green" /> {asg.title}
                              </h5>
                              <p className="text-[11px] text-gray-500 leading-normal">{asg.description}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Coach Special Assignments */}
                      {myTasks.length > 0 && (
                        <div className="bg-white p-5 rounded-3xl border border-emerald-100 shadow-sm space-y-3">
                          <h4 className="text-xs font-black text-emerald-800 uppercase tracking-wider font-display">
                            Tugas Tambahan dari Tim Pelatih
                          </h4>
                          <div className="space-y-2.5">
                            {myTasks.map((t) => {
                              const tasksList = parseTasks(userApp);
                              const isSubmitted = tasksList.some((sub: any) => String(sub.materiId) === String(t.materiId) || sub.title === `Tugas: ${t.materiJudul}`);

                              return (
                                <div key={t.materiId} className="bg-emerald-50/40 p-4 rounded-2xl border border-emerald-100 space-y-2">
                                  <div className="flex items-center justify-between gap-2">
                                    <span className="text-[9px] font-black bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded uppercase">
                                      Tugas Pelatih
                                    </span>
                                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${
                                      isSubmitted ? 'bg-emerald-500 text-white' : 'bg-amber-100 text-amber-800'
                                    }`}>
                                      {isSubmitted ? 'Sudah Dikirim ✓' : 'Belum Dikirim'}
                                    </span>
                                  </div>
                                  <h5 className="text-xs font-black text-gray-800">{t.materiJudul}</h5>
                                  <p className="text-[11px] text-gray-600 bg-white p-2.5 rounded-xl border border-emerald-100">
                                    {t.instruksi || 'Silakan kerjakan tugas sesuai arahan pelatih.'}
                                  </p>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Submission Form */}
                      <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm space-y-4">
                        <h4 className="text-xs font-black text-gray-800 uppercase tracking-wider font-display">
                          Formulir Pengumpulan Tugas Peserta
                        </h4>
                        <form onSubmit={handleUserSubmitTask} className="space-y-3">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-gray-500 ml-1">Pilih Tugas yang Dikumpulkan</label>
                            <select 
                              value={taskTitle}
                              onChange={(e) => setTaskTitle(e.target.value)}
                              className="w-full bg-gray-50 border border-gray-200 focus:ring-hw-green/20 rounded-xl px-3.5 py-2.5 text-xs font-bold text-gray-800"
                              required
                            >
                              <option value="">-- Pilih Penugasan --</option>
                              <optgroup label="Tugas Wajib Silabus">
                                {program.assignments.map(asg => (
                                  <option key={asg.id} value={asg.title}>{asg.title}</option>
                                ))}
                              </optgroup>
                              {myTasks.length > 0 && (
                                <optgroup label="Tugas Khusus dari Pelatih">
                                  {myTasks.map(t => (
                                    <option key={t.materiId} value={`Tugas: ${t.materiJudul}`}>[PELATIH] {t.materiJudul}</option>
                                  ))}
                                </optgroup>
                              )}
                              <optgroup label="Lainnya">
                                <option value="Tugas Proyek Lapangan Qabilah">Tugas Proyek Lapangan Qabilah</option>
                              </optgroup>
                            </select>
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-gray-500 ml-1">Tautan Berkas / Link Tugas (Google Drive / PDF / YouTube)</label>
                            <input 
                              type="url" 
                              placeholder="https://drive.google.com/..."
                              value={taskLink}
                              onChange={(e) => setTaskLink(e.target.value)}
                              className="w-full bg-gray-50 border border-gray-200 focus:ring-hw-green/20 rounded-xl px-3.5 py-2.5 text-xs text-gray-800"
                              required
                            />
                          </div>

                          <button
                            type="submit"
                            disabled={submittingTask}
                            className="w-full bg-hw-green hover:bg-emerald-700 text-white text-xs font-black uppercase tracking-wider py-3 rounded-xl shadow-md active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
                          >
                            {submittingTask ? (
                              <>
                                <Loader2 size={14} className="animate-spin" /> Mengirim Tugas...
                              </>
                            ) : (
                              'Kumpulkan Penugasan'
                            )}
                          </button>
                        </form>
                      </div>

                      {/* Submitted Assignment History */}
                      {userApp && (
                        <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm space-y-3">
                          <h4 className="text-xs font-black text-gray-800 uppercase tracking-wider font-display">
                            Riwayat Penugasan Terkirim ({parseTasks(userApp).length})
                          </h4>
                          {parseTasks(userApp).length === 0 ? (
                            <p className="text-xs text-gray-400 italic py-2 text-center">Belum ada tugas yang dikumpulkan.</p>
                          ) : (
                            <div className="space-y-2">
                              {parseTasks(userApp).map((t, idx) => (
                                <div key={idx} className="bg-gray-50 p-3 rounded-xl border border-gray-150 flex items-center justify-between">
                                  <div>
                                    <h6 className="text-xs font-black text-gray-800">{t.title}</h6>
                                    <p className="text-[10px] text-gray-400">Terkirim: {new Date(t.submittedAt).toLocaleDateString('id-ID')}</p>
                                  </div>
                                  <a 
                                    href={t.link} 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    className="text-hw-green hover:text-emerald-700 p-2 hover:bg-emerald-50 rounded-lg transition-all"
                                  >
                                    <ExternalLink size={16} />
                                  </a>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </motion.div>
                  );
                })()}

                {/* 5. PIAGAM DIGITAL TAB */}
                {activeTab === 'piagam' && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                    {userApp && userApp.statusKelulusan === 'Lulus' ? (
                      /* ACTIVE CERTIFICATE FOR PASSED PARTICIPANTS */
                      <div className="space-y-4">
                        <div className="bg-white p-5 rounded-3xl border border-emerald-100 shadow-sm text-left">
                          <div className="flex items-center gap-2 text-emerald-600 mb-1">
                            <Sparkles size={18} />
                            <h4 className="text-xs font-black text-gray-800 uppercase tracking-wider font-display">
                              Piagam Keikutsertaan & Kelulusan Resmi
                            </h4>
                          </div>
                          <p className="text-xs text-gray-500 leading-relaxed">
                            Selamat! Anda telah dinyatakan LULUS pada kegiatan pelatihan ini. Piagam digital resmi ini terbit dengan validasi Kwartir Wilayah Gerakan Kepanduan Hizbul Wathan Jawa Tengah.
                          </p>
                        </div>

                        {/* Certificate View Graphic */}
                        <div className="bg-amber-50/80 border-2 border-amber-300 rounded-3xl p-6 relative overflow-hidden shadow-lg flex flex-col items-center justify-center text-center space-y-4 font-serif">
                          <div className="absolute inset-2 border-2 border-dashed border-amber-400/40 rounded-[1.2rem] pointer-events-none" />

                          <img 
                            src="https://upload.wikimedia.org/wikipedia/id/b/ba/Logo_Hizbul_Wathan.png" 
                            alt="Logo HW" 
                            className="h-16 w-auto drop-shadow-md relative z-10"
                          />

                          <div className="space-y-1 relative z-10 font-sans">
                            <h3 className="text-sm font-black uppercase tracking-widest text-amber-900">
                              PIAGAM PENGHARGAAN
                            </h3>
                            <p className="text-[9px] text-amber-800 font-bold tracking-wider">
                              Nomor: HW-JATENG/{selectedLevel.toUpperCase()}/{userApp.id.toUpperCase()}/{new Date().getFullYear()}
                            </p>
                          </div>

                          <div className="space-y-1 relative z-10">
                            <p className="text-xs text-gray-600 italic">Diberikan Kepada Peserta:</p>
                            <h4 className="text-lg font-black text-gray-900 uppercase tracking-wide border-b-2 border-amber-400 pb-1 px-8 inline-block font-sans">
                              {userApp.nama || user?.namaLengkap}
                            </h4>
                          </div>

                          <p className="text-xs text-gray-700 leading-relaxed max-w-md px-2 italic font-sans">
                            Atas ketekunan, partisipasi aktif, dan kelulusan pada kegiatan pelatihan resmi <strong className="not-italic text-amber-900">{selectedActivity.namaKegiatan}</strong> yang diselenggarakan oleh Kwartir Wilayah Gerakan Kepanduan Hizbul Wathan Jawa Tengah dengan Nilai Evaluasi: <strong className="not-italic text-amber-900">{userApp.nilai || 'A'}</strong>.
                          </p>

                          <div className="grid grid-cols-2 gap-8 pt-4 w-full text-[9px] font-sans text-gray-700 relative z-10">
                            <div className="space-y-3">
                              <p className="leading-none">Ketua Kwarwil HW Jateng,</p>
                              <div className="h-6 flex items-center justify-center">
                                <span className="text-[9px] text-emerald-700 font-black tracking-widest border border-emerald-500/30 px-2 py-0.5 rounded uppercase">Taufiq ✓</span>
                              </div>
                              <p className="font-bold underline uppercase">Taufiq</p>
                            </div>
                            <div className="space-y-3">
                              <p className="leading-none">Sekretaris Kwarwil HW Jateng,</p>
                              <div className="h-6 flex items-center justify-center">
                                <span className="text-[9px] text-emerald-700 font-black tracking-widest border border-emerald-500/30 px-2 py-0.5 rounded uppercase font-mono">Dzikron ✓</span>
                              </div>
                              <p className="font-bold underline uppercase">M. Dzikron</p>
                            </div>
                          </div>
                        </div>

                        {/* Download Certificate Action */}
                        <div className="flex gap-2">
                          <button
                            onClick={() => window.print()}
                            className="bg-hw-green hover:bg-emerald-700 text-white text-xs font-black uppercase tracking-wider py-3.5 px-6 rounded-2xl flex-1 shadow-md hover:scale-[1.01] active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
                          >
                            <Download size={16} /> Cetak / Unduh Piagam Digital
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* LOCKED PIAGAM NOTICE IF NOT PASSED YET */
                      <div className="bg-gray-50 p-8 rounded-3xl border border-gray-200 text-center space-y-3 py-12">
                        <Lock size={32} className="mx-auto text-amber-500" />
                        <h5 className="text-sm font-black text-gray-800">
                          Piagam Belum Dapat Didownload
                        </h5>
                        <p className="text-xs text-gray-500 leading-relaxed max-w-md mx-auto">
                          Piagam ikutserta kegiatan pelatihan baru akan dapat didownload jika status kepesertaan Anda telah dalam status <strong>LULUS</strong> setelah mengikuti seluruh materi, melengkapi presensi sesi, dan menyelesaikan tugas dari Tim Pelatih.
                        </p>
                        {userApp && (
                          <div className="pt-2">
                            <span className="text-[10px] font-black uppercase bg-amber-100 text-amber-800 px-3 py-1 rounded-full">
                              Status Kepesertaan Saat Ini: {userApp.statusKelulusan || 'Sedang Pelatihan'}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </motion.div>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* ========================================================================= */
        /* MODE ADMIN: KELOLA DATABASE PELATIHAN & GRADING                          */
        /* ========================================================================= */
        <div className="space-y-6 animate-fade-in">
          {/* Level Switcher for Admin */}
          <div className="grid grid-cols-3 bg-white p-1.5 rounded-3xl border border-gray-100 shadow-sm">
            {TRAINING_PROGRAMS.map((prog) => (
              <button
                key={prog.id}
                onClick={() => setSelectedLevel(prog.id)}
                className={`py-3 px-1 rounded-2xl text-xs font-black transition-all flex flex-col items-center gap-0.5 cursor-pointer ${
                  selectedLevel === prog.id
                    ? 'bg-hw-green text-white shadow-md'
                    : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
                }`}
              >
                <span className="text-xs font-black">{prog.title}</span>
                <span className={`text-[8px] tracking-wide ${selectedLevel === prog.id ? 'text-emerald-100' : 'text-gray-400'}`}>
                  {prog.subtitle}
                </span>
              </button>
            ))}
          </div>

          {/* Admin Stats Header */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm text-left">
              <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider">Total Pendaftar</span>
              <p className="text-xl font-black text-gray-800 mt-0.5">{filteredApps.length}</p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm text-left">
              <span className="text-[9px] font-black text-amber-500 uppercase tracking-wider">Pending</span>
              <p className="text-xl font-black text-amber-500 mt-0.5">{filteredApps.filter(a => a.status === 'pending').length}</p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm text-left">
              <span className="text-[9px] font-black text-emerald-500 uppercase tracking-wider">Lulus Pelatihan</span>
              <p className="text-xl font-black text-emerald-500 mt-0.5">{filteredApps.filter(a => a.statusKelulusan === 'Lulus').length}</p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Cari pendaftar nama, email, kwarda..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-gray-200 rounded-2xl pl-10 pr-9 py-3 text-xs placeholder-gray-400 shadow-xs"
            />
          </div>

          {/* Applicant List for Admin */}
          {filteredApps.length === 0 ? (
            <div className="bg-white p-8 rounded-3xl border border-gray-100 text-center text-gray-400">
              <Users size={28} className="mx-auto text-gray-300 mb-2" />
              <p className="text-xs font-bold">Tidak ada data pendaftar yang cocok.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredApps.map((app) => {
                const attendanceMap = parseAttendance(app);
                const tasks = parseTasks(app);

                return (
                  <div key={app.id} className="bg-white p-5 rounded-3xl border border-gray-100 shadow-xs text-left space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <span className="text-[9px] font-black bg-gray-100 text-gray-600 px-2 py-0.5 rounded uppercase">
                          ID: {app.id.substring(0, 8)}
                        </span>
                        <h5 className="text-xs font-black text-gray-800">{app.nama || app.namaLengkap}</h5>
                        <p className="text-[10px] text-gray-400">
                          {app.email} • {app.asalDaerah || 'Jawa Tengah'}
                        </p>
                      </div>

                      <div>
                        {app.status === 'pending' ? (
                          <div className="flex gap-1.5">
                            <button 
                              onClick={() => handleUpdateStatus(app.id, 'approved')}
                              disabled={actionLoading}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl cursor-pointer"
                            >
                              Setuju
                            </button>
                            <button 
                              onClick={() => handleUpdateStatus(app.id, 'rejected')}
                              disabled={actionLoading}
                              className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl cursor-pointer"
                            >
                              Tolak
                            </button>
                          </div>
                        ) : app.status === 'rejected' ? (
                          <span className="text-[9px] font-black text-red-600 bg-red-100 px-2.5 py-1 rounded-md uppercase">Ditolak</span>
                        ) : app.statusKelulusan === 'Lulus' ? (
                          <span className="text-[9px] font-black text-white bg-emerald-600 px-2.5 py-1 rounded-md uppercase">LULUS</span>
                        ) : (
                          <span className="text-[9px] font-black text-emerald-600 bg-emerald-100 px-2.5 py-1 rounded-md uppercase">TERVERIFIKASI</span>
                        )}
                      </div>
                    </div>

                    {app.status === 'approved' && (
                      <>
                        <div className="pt-2 border-t border-gray-100 space-y-2">
                          <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Kehadiran Sesi</span>
                          <div className="grid grid-cols-4 gap-1.5">
                            {['Sesi 1', 'Sesi 2', 'Sesi 3', 'Sesi 4'].map((sesId) => {
                              const attStatus = getAttendanceStatus(attendanceMap, sesId);
                              return (
                                <div key={sesId} className="bg-gray-50 p-2 rounded-xl border border-gray-100 flex flex-col gap-1 items-center justify-between">
                                  <span className="text-[8px] font-bold text-gray-500">{sesId}</span>
                                  <div className="flex gap-1">
                                    <button 
                                      onClick={() => handleToggleAttendance(app, sesId, 'hadir')}
                                      className={`w-5 h-5 rounded text-[8px] font-bold ${attStatus === 'hadir' ? 'bg-emerald-600 text-white' : 'bg-gray-200 text-gray-600'}`}
                                      title="Hadir"
                                    >
                                      H
                                    </button>
                                    <button 
                                      onClick={() => handleToggleAttendance(app, sesId, 'izin')}
                                      className={`w-5 h-5 rounded text-[8px] font-bold ${attStatus === 'izin' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}
                                      title="Izin"
                                    >
                                      I
                                    </button>
                                    <button 
                                      onClick={() => handleToggleAttendance(app, sesId, 'absen')}
                                      className={`w-5 h-5 rounded text-[8px] font-bold ${attStatus === 'absen' ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-600'}`}
                                      title="Absen"
                                    >
                                      A
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        <div className="pt-2 border-t border-gray-100 flex justify-between items-center">
                          <div>
                            <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider block">Nilai & Status</span>
                            <span className="text-xs font-black text-emerald-700">
                              {app.nilai ? `Nilai: ${app.nilai} (${app.statusKelulusan || 'Lulus'})` : 'Belum Dinilai'}
                            </span>
                          </div>
                          <button
                            onClick={() => openGradingDialog(app)}
                            className="bg-hw-green hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-wider px-4 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer"
                          >
                            <Award size={14} /> Penilaian & Piagam
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
      )}

      {/* Admin Grading Modal Popup */}
      {gradingApp && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl space-y-4 text-left border border-gray-100"
          >
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black text-gray-800 uppercase tracking-wider font-display">Penilaian & Status Kelulusan</h4>
              <button onClick={() => setGradingApp(null)} className="text-gray-400 hover:text-gray-600 p-1">
                <X size={16} />
              </button>
            </div>

            <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100">
              <h5 className="text-xs font-black text-gray-800">{gradingApp.nama}</h5>
              <p className="text-[10px] text-gray-400">{gradingApp.email} • {gradingApp.pelatihanAkanDiikuti}</p>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-500">Grade Nilai (Contoh: A, B+, Sangat Memuaskan)</label>
                <input 
                  type="text" 
                  value={gradeInput}
                  onChange={(e) => setGradeInput(e.target.value)}
                  placeholder="Masukkan grade"
                  className="w-full bg-gray-50 border-gray-200 rounded-xl px-3.5 py-2.5 text-xs text-gray-800"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-500">Status Kelulusan</label>
                <select 
                  value={passingStatus}
                  onChange={(e) => setPassingStatus(e.target.value)}
                  className="w-full bg-gray-50 border-gray-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-gray-800"
                >
                  <option value="Lulus">Lulus (Piagam Aktif & Dapat Didownload)</option>
                  <option value="Belum Lulus">Belum Lulus / Dalam Proses</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-500">Catatan Tim Pelatih</label>
                <textarea 
                  value={remarkInput}
                  onChange={(e) => setRemarkInput(e.target.value)}
                  placeholder="Catatan tambahan..."
                  rows={2}
                  className="w-full bg-gray-50 border-gray-200 rounded-xl px-3.5 py-2.5 text-xs text-gray-800 resize-none"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  onClick={() => setGradingApp(null)}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-black uppercase tracking-wider py-3 rounded-xl flex-1 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  onClick={handleSaveGrade}
                  disabled={actionLoading}
                  className="bg-hw-green hover:bg-emerald-700 text-white text-xs font-black uppercase tracking-wider py-3 rounded-xl flex-1 shadow-md cursor-pointer"
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

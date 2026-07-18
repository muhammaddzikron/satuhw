import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, 
  MapPin, 
  Phone, 
  Mail, 
  Share2, 
  ShieldCheck, 
  ShieldAlert, 
  Award, 
  CreditCard, 
  Printer, 
  Download, 
  Upload, 
  User as UserIcon, 
  Info, 
  Check, 
  BookOpen, 
  Sparkles,
  QrCode,
  CheckCircle,
  HelpCircle,
  RefreshCw
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { sheetsService } from '../services/sheetsService';
import { cn, getDriveDirectLink, getCorsSafeUrl } from '../lib/utils';
import LoadingPage from './LoadingPage';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

const TINGKATAN_LIST = [
  'Tunas Athfal', 
  'Athfal', 
  'Pengenal', 
  'Penghela', 
  'Penuntun', 
  'Dewasa'
];

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

export default function KTAPage() {
  const navigate = useNavigate();
  const { user, isAuthenticated, updateUser } = useAuthStore();
  const [applications, setApplications] = useState<any[]>([]);
  const [myApplication, setMyApplication] = useState<any | null>(null);
  const validationUrl = `${window.location.origin}/kta?id=${myApplication?.id || myApplication?.ktaNumber || ''}`;
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);
  const [flipped, setFlipped] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [settings, setSettings] = useState<any>({
    ktaTemplateFront: 'https://hwjateng.com/wp-content/uploads/2026/07/depan.png',
    ktaTemplateBack: 'https://hwjateng.com/wp-content/uploads/2026/07/Belakang.jpg',
    ktaKetuaNama: 'TAUFIQ',
    ktaKetuaNbm: 'NBM 1015096',
    ktaSekretarisNama: 'MUHAMMAD DZIKRON',
    ktaSekretarisNbm: 'NBM 1029863',
    ktaKotaPenerbit: 'Semarang',
    ktaTandaTanganKetua: '',
    ktaTandaTanganSekretaris: '',
    ktaStempelImage: ''
  });
  
  // Photo preview
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  // Form State
  const [formData, setFormData] = useState({
    nama: user?.namaLengkap || '',
    alamat: user?.alamat || '',
    tingkatan: 'Dewasa',
    asalDaerah: user?.asalKwarda || 'Banyumas',
    noWa: user?.noHp || '',
    email: user?.email || '',
    sosmed: user?.sosmed || '',
    photo: '',
    nik: '',
    tempatLahir: '',
    tanggalLahir: '',
    jenisKelamin: 'Laki-laki',
    qabilah: '',
    jenisKta: 'Digital'
  });

  const [isAgreed, setIsAgreed] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);

  useEffect(() => {
    const syncProfileAndApplications = async () => {
      try {
        if (isAuthenticated && user) {
          const members = await sheetsService.getMembers();
          const freshUser = members.find(
            (m) => m.id === user.id || m.email?.toLowerCase() === user.email?.toLowerCase()
          );
          if (freshUser) {
            updateUser(freshUser);
            // Pre-fill form fields with latest profile details
            setFormData(prev => ({
              ...prev,
              nama: freshUser.namaLengkap || prev.nama,
              alamat: freshUser.alamat || prev.alamat,
              asalDaerah: freshUser.asalKwarda || prev.asalDaerah,
              noWa: freshUser.noHp || prev.noWa,
              email: freshUser.email || prev.email,
              sosmed: freshUser.sosmed || prev.sosmed,
              nik: (freshUser as any).nik || prev.nik || '',
              tempatLahir: (freshUser as any).tempatLahir || prev.tempatLahir || '',
              tanggalLahir: (freshUser as any).tanggalLahir || prev.tanggalLahir || '',
              jenisKelamin: (freshUser as any).jenisKelamin === 'P' ? 'Perempuan' : ((freshUser as any).jenisKelamin === 'L' ? 'Laki-laki' : prev.jenisKelamin),
              qabilah: (freshUser as any).qabilah || prev.qabilah || '',
            }));
          }
        }
      } catch (e) {
        console.error('Error synchronizing profile under KTA:', e);
      }
      await fetchApplications();
    };

    syncProfileAndApplications();
  }, [isAuthenticated, user?.id, user?.email]);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      try {
        const settingsData = await sheetsService.getSettings();
        if (settingsData) {
          setSettings((prev: any) => ({ ...prev, ...settingsData }));
        }
      } catch (err) {
        console.error("Gagal memuat pengaturan KTA:", err);
      }

      const apps = await sheetsService.getKTAApplications();
      setApplications(apps);
      
      // Determine my application
      if (isAuthenticated && user) {
        const found = apps.find((app: any) => {
          const userIdMatch = app.userId && user.id && String(app.userId) === String(user.id);
          const emailMatch = app.email && user.email && app.email.toLowerCase().trim() === user.email.toLowerCase().trim();
          const nikMatch = app.nik && (user as any).nik && String(app.nik).trim() === String((user as any).nik).trim();
          const namaMatch = app.nama && user.namaLengkap && app.nama.toLowerCase().trim() === user.namaLengkap.toLowerCase().trim();
          return userIdMatch || emailMatch || nikMatch || (namaMatch && (app.asalDaerah === user.asalKwarda || app.noWa === user.noHp || !app.noWa));
        });
        if (found) {
          setMyApplication(found);
          if (found.photo) {
            setPhotoPreview(found.photo);
          }
          // Pre-fill form fields with application data
          setFormData(prev => ({
            ...prev,
            nama: found.nama || prev.nama,
            alamat: found.alamat || prev.alamat,
            tingkatan: found.tingkatan || prev.tingkatan,
            asalDaerah: found.asalDaerah || prev.asalDaerah,
            noWa: found.noWa || prev.noWa,
            email: found.email || prev.email,
            sosmed: found.sosmed || prev.sosmed,
            nik: found.nik || prev.nik,
            tempatLahir: found.tempatLahir || prev.tempatLahir,
            tanggalLahir: found.tanggalLahir || prev.tanggalLahir,
            jenisKelamin: found.jenisKelamin || prev.jenisKelamin,
            qabilah: found.qabilah || prev.qabilah,
            jenisKta: found.jenisKta || prev.jenisKta,
          }));
        }
      }
    } catch (e) {
      console.error('Error fetching KTA apps:', e);
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setMessage({ type: 'error', text: 'Ukuran foto maksimal 2MB' });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setPhotoPreview(base64String);
        setFormData(prev => ({ ...prev, photo: base64String }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nama || !formData.alamat || !formData.noWa || !formData.email) {
      setMessage({ type: 'error', text: 'Harap melengkapi semua data wajib.' });
      return;
    }

    if (!formData.nik || formData.nik.length < 10) {
      setMessage({ type: 'error', text: 'Kolom NIK wajib diisi dengan benar.' });
      return;
    }

    if (!formData.tempatLahir || !formData.tanggalLahir) {
      setMessage({ type: 'error', text: 'Harap melengkapi Tempat Lahir dan Tanggal Lahir.' });
      return;
    }

    if (!formData.qabilah) {
      setMessage({ type: 'error', text: 'Harap melengkapi bidang Asal Qabilah.' });
      return;
    }

    if (!isAgreed) {
      setMessage({ type: 'error', text: 'Anda harus memberikan tanda centang konfirmasi kebenaran data.' });
      return;
    }

    // Helper functions for normalization
    const normalizePhoneGlobal = (num: string) => {
      if (!num) return '';
      const digits = num.replace(/\D/g, '');
      if (digits.startsWith('62')) {
        return '0' + digits.substring(2);
      }
      return digits;
    };

    const normalizeNikGlobal = (nikStr: string) => {
      return nikStr ? nikStr.replace(/\D/g, '') : '';
    };

    // Check duplication across all applications (excluding rejected ones)
    const normalizedFormNik = normalizeNikGlobal(formData.nik);
    const normalizedFormEmail = formData.email.trim().toLowerCase();
    const normalizedFormPhone = normalizePhoneGlobal(formData.noWa);

    const isDuplicate = applications.some((app: any) => {
      if (app.status === 'rejected') return false;
      
      const appNikNormalized = normalizeNikGlobal(app.nik);
      const appEmailNormalized = (app.email || '').trim().toLowerCase();
      const appPhoneNormalized = normalizePhoneGlobal(app.noWa || app.noHp);

      const isMatchNik = normalizedFormNik && appNikNormalized === normalizedFormNik;
      const isMatchEmail = normalizedFormEmail && appEmailNormalized === normalizedFormEmail;
      const isMatchPhone = normalizedFormPhone && appPhoneNormalized === normalizedFormPhone;

      return isMatchNik || isMatchEmail || isMatchPhone;
    });

    if (isDuplicate) {
      setMessage({ 
        type: 'error', 
        text: 'NIK, Email, atau nomor WhatsApp ini sudah terdaftar dalam sistem pengajuan KTA yang aktif atau sedang ditinjau. Anda tidak dapat melakukan pendaftaran ganda.' 
      });
      return;
    }

    setSubmitting(true);
    setMessage(null);

    const payload = {
      userId: user?.id || 'guest-' + Math.random().toString(36).substring(2, 9),
      nama: formData.nama,
      alamat: formData.alamat,
      tingkatan: formData.tingkatan,
      asalDaerah: formData.asalDaerah,
      noWa: formData.noWa,
      email: formData.email,
      sosmed: formData.sosmed,
      photo: photoPreview || '',
      nik: formData.nik,
      tempatLahir: formData.tempatLahir,
      tanggalLahir: formData.tanggalLahir,
      jenisKelamin: formData.jenisKelamin,
      qabilah: formData.qabilah,
      jenisKta: formData.jenisKta
    };

    try {
      const res = await sheetsService.applyKTA(payload);
      if (res.success || res.application) {
        const createdApp = res.application || payload;
        setMyApplication(createdApp);
        setMessage({ 
          type: 'success', 
          text: 'Pendaftaran KTA berhasil dikirim! Silahkan menyelesaikan pembayaran sesuai arahan di bawah.' 
        });
        
        // Auto update local user status (if logged in, keep them updated)
        if (isAuthenticated && user) {
          // If approved instantly (some system settings), update user, else mark verified
          if (createdApp.status === 'approved') {
            updateUser({ isVerified: true });
          }
        }
        
        // Re-fetch to coordinate
        fetchApplications();
      } else {
        throw new Error(res.message || 'Respons tidak valid dari server');
      }
    } catch (error: any) {
      console.error('Apply KTA Error:', error);
      setMessage({ 
        type: 'error', 
        text: 'Gagal mengirim pendaftaran. Coba lagi atau hubungi admin.' 
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    if (isGeneratingPdf) return;
    setIsGeneratingPdf(true);
    try {
      const frontEl = document.getElementById('kta-front-capture');
      const backEl = document.getElementById('kta-back-capture');
      
      if (!frontEl || !backEl) {
        throw new Error("Elemen kartu tidak ditemukan");
      }

      // Capture front card
      const frontCanvas = await html2canvas(frontEl, {
        scale: 3, // high quality
        useCORS: true,
        allowTaint: false,
        backgroundColor: null
      });

      // Capture back card
      const backCanvas = await html2canvas(backEl, {
        scale: 3, // high quality
        useCORS: true,
        allowTaint: false,
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

      pdf.save(`KTA_HW_${(myApplication?.nama || 'Anggota').replace(/\s+/g, '_')}.pdf`);
      
      setMessage({
        type: 'success',
        text: 'KTA Resmi Anda berhasil diunduh dalam format PDF!'
      });
    } catch (err: any) {
      console.error('Error generating PDF:', err);
      setMessage({
        type: 'error',
        text: 'Gagal mengunduh KTA PDF. Silakan coba kembali.'
      });
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  if (loading) return <LoadingPage />;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/')} 
            className="p-2 bg-white border border-gray-100 rounded-xl text-gray-400 hover:text-hw-green transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-xl font-display font-bold text-gray-800">KTA HW Jateng</h2>
            <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Kartu Tanda Anggota Digital</p>
          </div>
        </div>
        <Link to="/contact" className="p-2 bg-white border border-gray-100 rounded-xl text-gray-400 hover:text-hw-green transition-colors">
          <HelpCircle size={18} />
        </Link>
      </div>

      {message && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            "p-4 rounded-2xl border text-xs font-semibold flex items-start gap-2.5",
            message.type === 'success' 
              ? "bg-green-50 text-green-700 border-green-100" 
              : "bg-rose-50 text-rose-700 border-rose-100"
          )}
        >
          {message.type === 'success' ? <CheckCircle size={16} className="shrink-0 mt-0.5" /> : <ShieldAlert size={16} className="shrink-0 mt-0.5" />}
          <span>{message.text}</span>
        </motion.div>
      )}

      {/* RENDER KTA CARD IF APPROVED */}
      {myApplication && (myApplication.status === 'approved' || !!myApplication.ktaNumber) ? (
        <div className="space-y-6">
          {/* Instruction header */}
          <div className="bg-hw-green/5 border border-hw-green/10 p-4 rounded-3xl space-y-1 text-center">
            <span className="inline-flex items-center gap-1 bg-hw-green text-white text-[10px] uppercase font-black tracking-widest px-2.5 py-0.5 rounded-full mb-1">
              <ShieldCheck size={10} fill="currentColor" /> AKTIF / TERVERIFIKASI
            </span>
            <h3 className="text-xs font-bold text-gray-800">KTA Digital Anda Telah Terbit!</h3>
            <p className="text-[10px] text-gray-500 leading-normal">
              Selamat, data keanggotaan Anda telah diverifikasi oleh Kwarwil HW Jateng. Anda kini memiliki akses penuh ke seluruh konten member area aplikasi ini.
            </p>
          </div>

          {/* HIDDEN CAPTURE CONTAINER FOR PDF GENERATION */}
          <div id="kta-print-capture" className="absolute left-[-9999px] top-[-9999px] space-y-4" style={{ zIndex: -9999 }}>
            {/* FRONT CARD CAPTURE */}
            <div 
              id="kta-front-capture" 
              className={cn(
                "w-[350px] h-[220px] rounded-3xl overflow-hidden border border-emerald-800/10 p-4 flex flex-col justify-between relative",
                settings.ktaTemplateFront ? "text-gray-800 bg-white" : "text-white bg-gradient-to-br from-hw-green via-emerald-800 to-emerald-950"
              )}
              style={{ boxSizing: 'border-box' }}
            >
              {/* Background Template Image */}
              {settings.ktaTemplateFront && (
                <img 
                  src={getCorsSafeUrl(settings.ktaTemplateFront)} 
                  alt="Template Front" 
                  className="absolute inset-0 w-full h-full object-cover z-0" 
                  crossOrigin="anonymous" 
                />
              )}

              {/* Custom Date above pre-printed Sekretaris text on template background */}
              {settings.ktaTemplateFront && (
                <div className="absolute bottom-[66px] right-[40px] z-20 text-right pointer-events-none">
                  <p className="text-[5.5px] font-bold text-gray-800 leading-none">
                    {(() => {
                      const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
                      const d = new Date();
                      const currentDateStr = `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
                      return `${settings.ktaKotaPenerbit || 'Semarang'}, ${myApplication.verifiedAt || currentDateStr}`;
                    })()}
                  </p>
                </div>
              )}

              {/* Default background ornament curves if no template front is active */}
              {!settings.ktaTemplateFront && (
                <>
                  <div className="absolute right-0 top-0 w-40 h-16 bg-gradient-to-l from-amber-100/30 to-transparent rounded-bl-full pointer-events-none" />
                  <div className="absolute left-0 bottom-0 right-0 h-20 bg-gradient-to-t from-emerald-500/10 via-teal-500/5 to-transparent pointer-events-none" />
                  <div className="absolute left-0 bottom-0 w-44 h-14 bg-gradient-to-tr from-emerald-600 via-teal-600 to-emerald-700 rounded-tr-full opacity-50 pointer-events-none" />
                  <div className="absolute left-0 bottom-0 w-48 h-10 bg-gradient-to-tr from-amber-400 via-yellow-400 to-transparent rounded-tr-full opacity-20 pointer-events-none" />
                  <div className="absolute -right-10 -bottom-10 w-44 h-44 opacity-10 bg-no-repeat bg-contain" style={{ backgroundImage: "url('https://upload.wikimedia.org/wikipedia/id/b/ba/Logo_Hizbul_Wathan.png')" }}></div>
                </>
              )}

              {/* Card Header */}
              <div className={cn("flex items-center gap-2.5 z-10 border-b pb-2", settings.ktaTemplateFront ? "border-transparent opacity-0 pointer-events-none" : "border-white/10")}>
                <img src={getCorsSafeUrl("https://upload.wikimedia.org/wikipedia/id/b/ba/Logo_Hizbul_Wathan.png")} alt="HW Logo" className="w-8 h-8 object-contain" crossOrigin="anonymous" />
                <div className="min-w-0">
                  <h4 className="text-[7.5px] font-black uppercase tracking-wider leading-tight">GERAKAN KEPANDUAN HIZBUL WATHAN</h4>
                  <p className={cn("text-[6.5px] font-black uppercase tracking-widest leading-none", settings.ktaTemplateFront ? "text-hw-green" : "text-amber-300")}>KWARWIL JAWA TENGAH</p>
                </div>
              </div>

              {/* Card Body */}
              <div className={cn("flex gap-3 z-10", settings.ktaTemplateFront ? "-mt-1.5 mb-auto" : "my-1")}>
                {/* User photo */}
                <div className="w-16 h-20 bg-gray-50 rounded-lg overflow-hidden border-2 border-emerald-600 shrink-0 flex items-center justify-center relative shadow-sm">
                  {photoPreview ? (
                    <img src={getCorsSafeUrl(photoPreview)} alt="Foto KTA" className="w-full h-full object-cover" crossOrigin="anonymous" />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-emerald-600">
                      <UserIcon size={14} />
                      <span className="text-[5px] uppercase font-bold mt-1 text-center font-mono">No Photo</span>
                    </div>
                  )}
                  <span className="absolute bottom-0 inset-x-0 bg-emerald-600 text-white text-[5px] uppercase font-black text-center py-0.5">
                    HW JATENG
                  </span>
                </div>

                {/* Member Details */}
                <div className="flex-1 min-w-0 flex flex-col justify-center space-y-0.5">
                  <h4 className={cn("text-[8.5px] font-black uppercase tracking-wider mb-0.5", settings.ktaTemplateFront ? "text-emerald-800" : "text-amber-300")}>KARTU ANGGOTA</h4>
                  
                  <table className="w-full text-left border-none border-collapse text-[7px] font-semibold">
                    <tbody>
                      <tr>
                        <td className={cn("w-14 font-bold uppercase py-0.1", settings.ktaTemplateFront ? "text-gray-400" : "text-slate-300")}>Nomor</td>
                        <td className="w-2 text-center py-0.1">:</td>
                        <td className={cn("font-mono font-black tracking-wider py-0.1", settings.ktaTemplateFront ? "text-emerald-800" : "text-amber-200")}>{myApplication.ktaNumber || 'KTA-HW.JT.XXXX'}</td>
                      </tr>
                      <tr>
                        <td className={cn("font-bold uppercase py-0.1", settings.ktaTemplateFront ? "text-gray-400" : "text-slate-300")}>Nama</td>
                        <td className="text-center py-0.1">:</td>
                        <td className={cn("font-black uppercase py-0.1 truncate", settings.ktaTemplateFront ? "text-gray-800" : "text-white")}>{myApplication.nama}</td>
                      </tr>
                      <tr>
                        <td className={cn("font-bold uppercase py-0.1", settings.ktaTemplateFront ? "text-gray-400" : "text-slate-300")}>TTL</td>
                        <td className="text-center py-0.1">:</td>
                        <td className={cn("font-bold py-0.1", settings.ktaTemplateFront ? "text-gray-800" : "text-white")}>{myApplication.tempatLahir || '-'}, {myApplication.tanggalLahir || '-'}</td>
                      </tr>
                      <tr>
                        <td className={cn("font-bold uppercase py-0.1", settings.ktaTemplateFront ? "text-gray-400" : "text-slate-300")}>Asal</td>
                        <td className="text-center py-0.1">:</td>
                        <td className={cn("font-bold py-0.1 truncate", settings.ktaTemplateFront ? "text-gray-800" : "text-white")}>Kwarda {myApplication.asalDaerah}</td>
                      </tr>
                      {myApplication.qabilah && (
                        <tr>
                          <td className={cn("font-bold uppercase py-0.1", settings.ktaTemplateFront ? "text-gray-400" : "text-slate-300")}>Qabilah</td>
                          <td className="text-center py-0.1">:</td>
                          <td className={cn("font-bold py-0.1 truncate", settings.ktaTemplateFront ? "text-gray-800" : "text-white")}>{myApplication.qabilah}</td>
                        </tr>
                      )}
                      <tr>
                        <td className={cn("font-bold uppercase py-0.1", settings.ktaTemplateFront ? "text-gray-400" : "text-slate-300")}>Tingkatan</td>
                        <td className="text-center py-0.1">:</td>
                        <td className={cn("font-bold py-0.1", settings.ktaTemplateFront ? "text-emerald-700" : "text-amber-200")}>{myApplication.tingkatan}</td>
                      </tr>
                      <tr>
                        <td className={cn("font-bold uppercase py-0.1", settings.ktaTemplateFront ? "text-gray-400" : "text-slate-300")}>Alamat</td>
                        <td className="text-center py-0.1">:</td>
                        <td className={cn("font-bold py-0.1 text-[6.5px] leading-tight line-clamp-2", settings.ktaTemplateFront ? "text-gray-600" : "text-slate-200")}>{myApplication.alamat || '-'}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Card Footer */}
              <div className={cn("border-t pt-1 z-10 flex items-center justify-between relative mt-auto", settings.ktaTemplateFront ? "border-gray-100" : "border-white/10")}>
                <span className={cn("text-[5px] font-mono font-bold", settings.ktaTemplateFront ? "text-gray-400" : "text-slate-300")}>SEUMUR HIDUP • JAWA TENGAH</span>
                
                {/* Right side signatures section */}
                <div className={cn("flex flex-col items-end text-right w-[150px] shrink-0 relative", settings.ktaTemplateFront ? "opacity-0 pointer-events-none hidden" : "")}>
                  <p className={cn("text-[5.5px] font-bold leading-none", settings.ktaTemplateFront ? "text-gray-500" : "text-slate-300")}>{settings.ktaKotaPenerbit || 'Semarang'}, {myApplication.verifiedAt || '13 Juli 2026'}</p>
                  
                  {/* Signatures & stamp overlapping row */}
                  <div className="flex items-center justify-between w-full h-8 relative mt-0.5 px-1">
                    {/* Stamp overlaying center */}
                    <div className="absolute left-[35%] top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none opacity-85">
                      {settings.ktaStempelImage ? (
                        <img src={getCorsSafeUrl(settings.ktaStempelImage)} alt="Stempel" className="w-8 h-8 object-contain rotate-[-12deg]" crossOrigin="anonymous" />
                      ) : (
                        <DefaultStempel idSuffix="front-capture" />
                      )}
                    </div>

                    {/* Ketua Signature Block */}
                    <div className="flex flex-col items-center w-1/2 relative">
                      <span className={cn("text-[4px] font-bold uppercase", settings.ktaTemplateFront ? "text-gray-400" : "text-slate-400")}>Ketua</span>
                      <div className="h-6 flex items-center justify-center">
                        {settings.ktaTandaTanganKetua ? (
                          <img src={getCorsSafeUrl(settings.ktaTandaTanganKetua)} alt="Tanda Tangan Ketua" className="h-6 object-contain" crossOrigin="anonymous" />
                        ) : (
                          <DefaultSignatureKetua />
                        )}
                      </div>
                      <span className={cn("text-[4.5px] font-black leading-none uppercase truncate w-full text-center", settings.ktaTemplateFront ? "text-gray-800" : "text-white")}>{settings.ktaKetuaNama}</span>
                      <span className={cn("text-[3.5px] font-semibold leading-none truncate w-full text-center", settings.ktaTemplateFront ? "text-gray-400" : "text-slate-300")}>{settings.ktaKetuaNbm}</span>
                    </div>

                    {/* Sekretaris Signature Block */}
                    <div className="flex flex-col items-center w-1/2 relative">
                      <span className={cn("text-[4px] font-bold uppercase", settings.ktaTemplateFront ? "text-gray-400" : "text-slate-400")}>Sekretaris</span>
                      <div className="h-6 flex items-center justify-center">
                        {settings.ktaTandaTanganSekretaris ? (
                          <img src={getCorsSafeUrl(settings.ktaTandaTanganSekretaris)} alt="Tanda Tangan Sekretaris" className="h-6 object-contain" crossOrigin="anonymous" />
                        ) : (
                          <DefaultSignatureSekretaris />
                        )}
                      </div>
                      <span className={cn("text-[4.5px] font-black leading-none uppercase truncate w-full text-center", settings.ktaTemplateFront ? "text-gray-800" : "text-white")}>{settings.ktaSekretarisNama}</span>
                      <span className={cn("text-[3.5px] font-semibold leading-none truncate w-full text-center", settings.ktaTemplateFront ? "text-gray-400" : "text-slate-300")}>{settings.ktaSekretarisNbm}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* BACK CARD CAPTURE */}
            <div 
              id="kta-back-capture" 
              className={cn(
                "w-[350px] h-[220px] rounded-3xl overflow-hidden border p-4 flex flex-col justify-between relative",
                settings.ktaTemplateBack ? "text-gray-800 bg-white border-emerald-950/10" : "text-white bg-gradient-to-tr from-emerald-950 via-emerald-900 to-slate-900 border-emerald-950/20"
              )}
              style={{ boxSizing: 'border-box' }}
            >
              {/* Background Template Image */}
              {settings.ktaTemplateBack && (
                <img 
                  src={getCorsSafeUrl(settings.ktaTemplateBack)} 
                  alt="Template Back" 
                  className="absolute inset-0 w-full h-full object-cover z-0" 
                  crossOrigin="anonymous" 
                />
              )}

              {/* Watermark background if no template */}
              {!settings.ktaTemplateBack && (
                <>
                  <div className="absolute -left-10 -top-10 w-36 h-36 bg-emerald-500/5 rounded-full blur-xl pointer-events-none" />
                  <div className="absolute right-0 bottom-0 w-40 h-16 bg-gradient-to-t from-emerald-500/5 to-transparent rounded-tl-full pointer-events-none" />
                  <div className="absolute left-6 top-6 w-32 h-32 opacity-5 bg-no-repeat bg-contain" style={{ backgroundImage: "url('https://upload.wikimedia.org/wikipedia/id/b/ba/Logo_Hizbul_Wathan.png')" }}></div>
                </>
              )}

              {/* Rules and Pledge */}
              <div className={cn("space-y-1 z-10 px-1", settings.ktaTemplateBack ? "opacity-0 pointer-events-none" : "")}>
                <h5 className={cn("text-[7.5px] font-black uppercase tracking-wider text-center border-b pb-0.5", settings.ktaTemplateBack ? "text-emerald-800 border-gray-150" : "text-amber-300 border-white/10")}>Undang-Undang Pandu Hizbul Wathan</h5>
                <ol className={cn("grid grid-cols-2 gap-x-3 gap-y-0.25 text-[4.8px] list-decimal pl-3 font-semibold leading-tight mt-1", settings.ktaTemplateBack ? "text-gray-750" : "text-slate-300")}>
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
              <div className={cn("border-t pt-1.5 z-10 flex items-center justify-between relative mt-auto", settings.ktaTemplateBack ? "border-transparent" : "border-white/10")}>
                <div className={cn("text-left space-y-0.5 max-w-[130px] leading-tight", settings.ktaTemplateBack ? "opacity-0 pointer-events-none" : "")}>
                  <p className={cn("text-[4px] uppercase font-bold", settings.ktaTemplateBack ? "text-gray-400" : "text-slate-400")}>Diterbitkan oleh :</p>
                  <p className={cn("text-[5.5px] font-black uppercase leading-none", settings.ktaTemplateBack ? "text-emerald-800" : "text-white")}>Pimpinan Wilayah HW Jawa Tengah</p>
                  <p className={cn("text-[4px]", settings.ktaTemplateBack ? "text-gray-400" : "text-slate-450")}>Jl. Singosari No.33, Semarang</p>
                </div>

                <div className="flex items-center gap-2 z-10">
                  {/* Validation QR Code */}
                  <div className="flex flex-col items-center gap-0.5 shrink-0 bg-white p-0.5 rounded border border-gray-100 shadow-xs">
                    <img 
                      src={getCorsSafeUrl(`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(validationUrl)}`)} 
                      alt="QR Validasi" 
                      className="w-8 h-8 object-contain" 
                      crossOrigin="anonymous"
                    />
                    <span className="text-[2.5px] font-bold text-slate-800 uppercase tracking-widest text-center font-mono leading-none">VALIDASI KTA</span>
                  </div>

                  {/* Overlapping Stamp & Signatures row below Undang-undang - fully complies with user requirement */}
                  <div className={cn("flex items-center gap-1 w-[110px] shrink-0 justify-end relative", settings.ktaTemplateBack ? "opacity-0 pointer-events-none hidden" : "")}>
                    {/* Small stamp overlay */}
                    <div className="absolute right-[40%] top-1/2 -translate-y-1/2 z-20 opacity-80 pointer-events-none">
                      {settings.ktaStempelImage ? (
                        <img src={getCorsSafeUrl(settings.ktaStempelImage)} alt="Stempel" className="w-8 h-8 object-contain rotate-[-12deg]" crossOrigin="anonymous" />
                      ) : (
                        <DefaultStempel idSuffix="back-capture" />
                      )}
                    </div>

                    {/* Ketua Sig */}
                    <div className="flex flex-col items-center w-[50px] relative">
                      <span className={cn("text-[3.5px] font-bold uppercase leading-none", settings.ktaTemplateBack ? "text-gray-400" : "text-slate-400")}>Ketua</span>
                      <div className="h-5 flex items-center justify-center scale-90">
                        {settings.ktaTandaTanganKetua ? (
                          <img src={getCorsSafeUrl(settings.ktaTandaTanganKetua)} alt="Tanda Tangan Ketua" className="h-5 object-contain" crossOrigin="anonymous" />
                        ) : (
                          <DefaultSignatureKetua />
                        )}
                      </div>
                      <span className={cn("text-[4px] font-black leading-none uppercase truncate w-full text-center", settings.ktaTemplateBack ? "text-gray-800" : "text-white")}>{settings.ktaKetuaNama}</span>
                    </div>

                    {/* Sekretaris Sig */}
                    <div className="flex flex-col items-center w-[50px] relative">
                      <span className={cn("text-[3.5px] font-bold uppercase leading-none", settings.ktaTemplateBack ? "text-gray-400" : "text-slate-400")}>Sekretaris</span>
                      <div className="h-5 flex items-center justify-center scale-90">
                        {settings.ktaTandaTanganSekretaris ? (
                          <img src={getCorsSafeUrl(settings.ktaTandaTanganSekretaris)} alt="Tanda Tangan Sekretaris" className="h-5 object-contain" crossOrigin="anonymous" />
                        ) : (
                          <DefaultSignatureSekretaris />
                        )}
                      </div>
                      <span className={cn("text-[4px] font-black leading-none uppercase truncate w-full text-center", settings.ktaTemplateBack ? "text-gray-800" : "text-white")}>{settings.ktaSekretarisNama}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Card Section */}
          <div className="flex flex-col items-center justify-center py-4">
            <p className="text-[9px] font-black uppercase text-gray-400 tracking-widest mb-3">Klik kartu untuk membalik</p>
            
            <div 
              className="w-full max-w-[350px] aspect-[1.586/1] cursor-pointer [perspective:1000px]"
              onClick={() => setFlipped(!flipped)}
            >
              <div className={cn(
                "relative w-full h-full transition-transform duration-700 [transform-style:preserve-3d]",
                flipped ? "[transform:rotateY(180deg)]" : ""
              )}>
                
                {/* CARD FRONT CONTAINER */}
                <div 
                  className={cn(
                    "absolute inset-0 w-full h-full [backface-visibility:hidden] rounded-3xl overflow-hidden shadow-xl border p-4 flex flex-col justify-between",
                    settings.ktaTemplateFront ? "text-gray-800 bg-white border-emerald-800/10" : "text-white bg-gradient-to-br from-hw-green via-emerald-800 to-emerald-950 border-emerald-800/10"
                  )}
                  style={{ boxSizing: 'border-box' }}
                >
                  {/* Background Template Image */}
                  {settings.ktaTemplateFront && (
                    <img 
                      src={getCorsSafeUrl(settings.ktaTemplateFront)} 
                      alt="Template Front" 
                      className="absolute inset-0 w-full h-full object-cover z-0" 
                      crossOrigin="anonymous" 
                    />
                  )}

                  {/* Custom Date above pre-printed Sekretaris text on template background */}
                  {settings.ktaTemplateFront && (
                    <div className="absolute bottom-[66px] right-[40px] z-20 text-right pointer-events-none">
                      <p className="text-[5.5px] font-bold text-gray-800 leading-none">
                        {(() => {
                          const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
                          const d = new Date();
                          const currentDateStr = `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
                          return `${settings.ktaKotaPenerbit || 'Semarang'}, ${myApplication.verifiedAt || currentDateStr}`;
                        })()}
                      </p>
                    </div>
                  )}

                  {/* Default Background Ornaments if no template front */}
                  {!settings.ktaTemplateFront && (
                    <>
                      <div className="absolute right-0 top-0 w-40 h-16 bg-gradient-to-l from-amber-100/30 to-transparent rounded-bl-full pointer-events-none" />
                      <div className="absolute left-0 bottom-0 right-0 h-20 bg-gradient-to-t from-emerald-500/10 via-teal-500/5 to-transparent pointer-events-none" />
                      <div className="absolute left-0 bottom-0 w-44 h-14 bg-gradient-to-tr from-emerald-600 via-teal-600 to-emerald-700 rounded-tr-full opacity-50 pointer-events-none" />
                      <div className="absolute left-0 bottom-0 w-48 h-10 bg-gradient-to-tr from-amber-400 via-yellow-400 to-transparent rounded-tr-full opacity-20 pointer-events-none" />
                      <div className="absolute -right-10 -bottom-10 w-44 h-44 opacity-10 bg-no-repeat bg-contain" style={{ backgroundImage: "url('https://upload.wikimedia.org/wikipedia/id/b/ba/Logo_Hizbul_Wathan.png')" }}></div>
                    </>
                  )}

                  {/* Card Header */}
                  <div className={cn("flex items-center gap-2.5 z-10 border-b pb-2", settings.ktaTemplateFront ? "border-transparent opacity-0 pointer-events-none" : "border-white/10")}>
                    <img src={getCorsSafeUrl("https://upload.wikimedia.org/wikipedia/id/b/ba/Logo_Hizbul_Wathan.png")} alt="HW Logo" className="w-8 h-8 object-contain" crossOrigin="anonymous" />
                    <div className="min-w-0">
                      <h4 className="text-[7.5px] font-black uppercase tracking-wider leading-tight">GERAKAN KEPANDUAN HIZBUL WATHAN</h4>
                      <p className={cn("text-[6.5px] font-black uppercase tracking-widest leading-none", settings.ktaTemplateFront ? "text-hw-green" : "text-amber-300")}>KWARWIL JAWA TENGAH</p>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className={cn("flex gap-3 z-10", settings.ktaTemplateFront ? "-mt-1.5 mb-auto" : "my-1")}>
                    {/* User photo */}
                    <div className="w-16 h-20 bg-gray-50 rounded-lg overflow-hidden border-2 border-emerald-600 shrink-0 flex items-center justify-center relative shadow-sm">
                      {photoPreview ? (
                        <img src={getCorsSafeUrl(photoPreview)} alt="Foto KTA" className="w-full h-full object-cover" crossOrigin="anonymous" />
                      ) : (
                        <div className="flex flex-col items-center justify-center text-emerald-600">
                          <UserIcon size={14} />
                          <span className="text-[5px] uppercase font-bold mt-1 text-center font-mono">No Photo</span>
                        </div>
                      )}
                      <span className="absolute bottom-0 inset-x-0 bg-emerald-600 text-white text-[5px] uppercase font-black text-center py-0.5">
                        HW JATENG
                      </span>
                    </div>

                    {/* Member Details */}
                    <div className="flex-1 min-w-0 flex flex-col justify-center space-y-0.5">
                      <h4 className={cn("text-[8.5px] font-black uppercase tracking-wider mb-0.5", settings.ktaTemplateFront ? "text-emerald-800" : "text-amber-300")}>KARTU ANGGOTA</h4>
                      
                      <table className="w-full text-left border-none border-collapse text-[7px] font-semibold">
                        <tbody>
                          <tr>
                            <td className={cn("w-14 font-bold uppercase py-0.1", settings.ktaTemplateFront ? "text-gray-400" : "text-slate-300")}>Nomor</td>
                            <td className="w-2 text-center py-0.1">:</td>
                            <td className={cn("font-mono font-black tracking-wider py-0.1", settings.ktaTemplateFront ? "text-emerald-800" : "text-amber-200")}>{myApplication.ktaNumber || 'KTA-HW.JT.XXXX'}</td>
                          </tr>
                          <tr>
                            <td className={cn("font-bold uppercase py-0.1", settings.ktaTemplateFront ? "text-gray-400" : "text-slate-300")}>Nama</td>
                            <td className="text-center py-0.1">:</td>
                            <td className={cn("font-black uppercase py-0.1 truncate", settings.ktaTemplateFront ? "text-gray-800" : "text-white")}>{myApplication.nama}</td>
                          </tr>
                          <tr>
                            <td className={cn("font-bold uppercase py-0.1", settings.ktaTemplateFront ? "text-gray-400" : "text-slate-300")}>TTL</td>
                            <td className="text-center py-0.1">:</td>
                            <td className={cn("font-bold py-0.1", settings.ktaTemplateFront ? "text-gray-800" : "text-white")}>{myApplication.tempatLahir || '-'}, {myApplication.tanggalLahir || '-'}</td>
                          </tr>
                          <tr>
                            <td className={cn("font-bold uppercase py-0.1", settings.ktaTemplateFront ? "text-gray-400" : "text-slate-300")}>Asal</td>
                            <td className="text-center py-0.1">:</td>
                            <td className={cn("font-bold py-0.1 truncate", settings.ktaTemplateFront ? "text-gray-800" : "text-white")}>Kwarda {myApplication.asalDaerah}</td>
                          </tr>
                          {myApplication.qabilah && (
                            <tr>
                              <td className={cn("font-bold uppercase py-0.1", settings.ktaTemplateFront ? "text-gray-400" : "text-slate-300")}>Qabilah</td>
                              <td className="text-center py-0.1">:</td>
                              <td className={cn("font-bold py-0.1 truncate", settings.ktaTemplateFront ? "text-gray-800" : "text-white")}>{myApplication.qabilah}</td>
                            </tr>
                          )}
                          <tr>
                            <td className={cn("font-bold uppercase py-0.1", settings.ktaTemplateFront ? "text-gray-400" : "text-slate-300")}>Tingkatan</td>
                            <td className="text-center py-0.1">:</td>
                            <td className={cn("font-bold py-0.1", settings.ktaTemplateFront ? "text-emerald-700" : "text-amber-200")}>{myApplication.tingkatan}</td>
                          </tr>
                          <tr>
                            <td className={cn("font-bold uppercase py-0.1", settings.ktaTemplateFront ? "text-gray-400" : "text-slate-300")}>Alamat</td>
                            <td className="text-center py-0.1">:</td>
                            <td className={cn("font-bold py-0.1 text-[6.5px] leading-tight line-clamp-2", settings.ktaTemplateFront ? "text-gray-600" : "text-slate-200")}>{myApplication.alamat || '-'}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div className={cn("border-t pt-1 z-10 flex items-center justify-between relative mt-auto", settings.ktaTemplateFront ? "border-gray-100" : "border-white/10")}>
                    <span className={cn("text-[5px] font-mono font-bold", settings.ktaTemplateFront ? "text-gray-400" : "text-slate-300")}>SEUMUR HIDUP • JAWA TENGAH</span>
                    
                    {/* Right side signatures section */}
                    <div className={cn("flex flex-col items-end text-right w-[150px] shrink-0 relative animate-fade-in", settings.ktaTemplateFront ? "opacity-0 pointer-events-none hidden" : "")}>
                      <p className={cn("text-[5.5px] font-bold leading-none", settings.ktaTemplateFront ? "text-gray-500" : "text-slate-300")}>{settings.ktaKotaPenerbit || 'Semarang'}, {myApplication.verifiedAt || '13 Juli 2026'}</p>
                      
                      {/* Signatures & stamp overlapping row */}
                      <div className="flex items-center justify-between w-full h-8 relative mt-0.5 px-1">
                        {/* Stamp overlaying center */}
                        <div className="absolute left-[35%] top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none opacity-85">
                          {settings.ktaStempelImage ? (
                            <img src={getCorsSafeUrl(settings.ktaStempelImage)} alt="Stempel" className="w-8 h-8 object-contain rotate-[-12deg]" crossOrigin="anonymous" />
                          ) : (
                            <DefaultStempel idSuffix="front-view" />
                          )}
                        </div>

                        {/* Ketua Signature Block */}
                        <div className="flex flex-col items-center w-1/2 relative">
                          <span className={cn("text-[4px] font-bold uppercase", settings.ktaTemplateFront ? "text-gray-400" : "text-slate-400")}>Ketua</span>
                          <div className="h-6 flex items-center justify-center">
                            {settings.ktaTandaTanganKetua ? (
                              <img src={getCorsSafeUrl(settings.ktaTandaTanganKetua)} alt="Tanda Tangan Ketua" className="h-6 object-contain" crossOrigin="anonymous" />
                            ) : (
                              <DefaultSignatureKetua />
                            )}
                          </div>
                          <span className={cn("text-[4.5px] font-black leading-none uppercase truncate w-full text-center", settings.ktaTemplateFront ? "text-gray-800" : "text-white")}>{settings.ktaKetuaNama}</span>
                          <span className={cn("text-[3.5px] font-semibold leading-none truncate w-full text-center", settings.ktaTemplateFront ? "text-gray-400" : "text-slate-300")}>{settings.ktaKetuaNbm}</span>
                        </div>

                        {/* Sekretaris Signature Block */}
                        <div className="flex flex-col items-center w-1/2 relative">
                          <span className={cn("text-[4px] font-bold uppercase", settings.ktaTemplateFront ? "text-gray-400" : "text-slate-400")}>Sekretaris</span>
                          <div className="h-6 flex items-center justify-center">
                            {settings.ktaTandaTanganSekretaris ? (
                              <img src={getCorsSafeUrl(settings.ktaTandaTanganSekretaris)} alt="Tanda Tangan Sekretaris" className="h-6 object-contain" crossOrigin="anonymous" />
                            ) : (
                              <DefaultSignatureSekretaris />
                            )}
                          </div>
                          <span className={cn("text-[4.5px] font-black leading-none uppercase truncate w-full text-center", settings.ktaTemplateFront ? "text-gray-800" : "text-white")}>{settings.ktaSekretarisNama}</span>
                          <span className={cn("text-[3.5px] font-semibold leading-none truncate w-full text-center", settings.ktaTemplateFront ? "text-gray-400" : "text-slate-300")}>{settings.ktaSekretarisNbm}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* CARD BACK CONTAINER */}
                <div 
                  className={cn(
                    "absolute inset-0 w-full h-full [backface-visibility:hidden] [transform:rotateY(180deg)] rounded-3xl overflow-hidden shadow-xl border p-4 flex flex-col justify-between",
                    settings.ktaTemplateBack ? "text-gray-800 bg-white border-emerald-950/10" : "text-white bg-gradient-to-tr from-emerald-950 via-emerald-900 to-slate-900 border-emerald-950/20"
                  )}
                  style={{ boxSizing: 'border-box' }}
                >
                  {/* Background Template Image */}
                  {settings.ktaTemplateBack && (
                    <img 
                      src={getCorsSafeUrl(settings.ktaTemplateBack)} 
                      alt="Template Back" 
                      className="absolute inset-0 w-full h-full object-cover z-0" 
                      crossOrigin="anonymous" 
                    />
                  )}

                  {/* Watermark background if no template */}
                  {!settings.ktaTemplateBack && (
                    <>
                      <div className="absolute -left-10 -top-10 w-36 h-36 bg-emerald-500/5 rounded-full blur-xl pointer-events-none" />
                      <div className="absolute right-0 bottom-0 w-40 h-16 bg-gradient-to-t from-emerald-500/5 to-transparent rounded-tl-full pointer-events-none" />
                      <div className="absolute left-6 top-6 w-32 h-32 opacity-5 bg-no-repeat bg-contain" style={{ backgroundImage: "url('https://upload.wikimedia.org/wikipedia/id/b/ba/Logo_Hizbul_Wathan.png')" }}></div>
                    </>
                  )}

                  {/* Rules and Pledge */}
                  <div className={cn("space-y-1 z-10 px-1", settings.ktaTemplateBack ? "opacity-0 pointer-events-none" : "")}>
                    <h5 className={cn("text-[7.5px] font-black uppercase tracking-wider text-center border-b pb-0.5", settings.ktaTemplateBack ? "text-emerald-800 border-gray-150" : "text-amber-300 border-white/10")}>Undang-Undang Pandu Hizbul Wathan</h5>
                    <ol className={cn("grid grid-cols-2 gap-x-3 gap-y-0.25 text-[4.8px] list-decimal pl-3 font-semibold leading-tight mt-1", settings.ktaTemplateBack ? "text-gray-750" : "text-slate-300")}>
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
                  <div className={cn("border-t pt-1.5 z-10 flex items-center justify-between relative mt-auto", settings.ktaTemplateBack ? "border-transparent" : "border-white/10")}>
                    <div className={cn("text-left space-y-0.5 max-w-[130px] leading-tight", settings.ktaTemplateBack ? "opacity-0 pointer-events-none" : "")}>
                      <p className={cn("text-[4px] uppercase font-bold", settings.ktaTemplateBack ? "text-gray-400" : "text-slate-400")}>Diterbitkan oleh :</p>
                      <p className={cn("text-[5.5px] font-black uppercase leading-none", settings.ktaTemplateBack ? "text-emerald-800" : "text-white")}>Pimpinan Wilayah HW Jawa Tengah</p>
                      <p className={cn("text-[4px]", settings.ktaTemplateBack ? "text-gray-400" : "text-slate-450")}>Jl. Singosari No.33, Semarang</p>
                    </div>

                    <div className="flex items-center gap-2 z-10">
                      {/* Validation QR Code */}
                      <div className="flex flex-col items-center gap-0.5 shrink-0 bg-white p-0.5 rounded border border-gray-100 shadow-xs">
                        <img 
                          src={getCorsSafeUrl(`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(validationUrl)}`)} 
                          alt="QR Validasi" 
                          className="w-8 h-8 object-contain" 
                          crossOrigin="anonymous"
                        />
                        <span className="text-[2.5px] font-bold text-slate-800 uppercase tracking-widest text-center font-mono leading-none">VALIDASI KTA</span>
                      </div>

                      {/* Overlapping Stamp & Signatures row below Undang-undang - fully complies with user requirement */}
                      <div className={cn("flex items-center gap-1 w-[110px] shrink-0 justify-end relative", settings.ktaTemplateBack ? "opacity-0 pointer-events-none hidden" : "")}>
                        {/* Small stamp overlay */}
                        <div className="absolute right-[40%] top-1/2 -translate-y-1/2 z-20 opacity-80 pointer-events-none">
                          {settings.ktaStempelImage ? (
                            <img src={getCorsSafeUrl(settings.ktaStempelImage)} alt="Stempel" className="w-8 h-8 object-contain rotate-[-12deg]" crossOrigin="anonymous" />
                          ) : (
                            <DefaultStempel idSuffix="back-view" />
                          )}
                        </div>

                        {/* Ketua Sig */}
                        <div className="flex flex-col items-center w-[50px] relative">
                          <span className={cn("text-[3.5px] font-bold uppercase leading-none", settings.ktaTemplateBack ? "text-gray-400" : "text-slate-400")}>Ketua</span>
                          <div className="h-5 flex items-center justify-center scale-90">
                            {settings.ktaTandaTanganKetua ? (
                              <img src={getCorsSafeUrl(settings.ktaTandaTanganKetua)} alt="Tanda Tangan Ketua" className="h-5 object-contain" crossOrigin="anonymous" />
                            ) : (
                              <DefaultSignatureKetua />
                            )}
                          </div>
                          <span className={cn("text-[4px] font-black leading-none uppercase truncate w-full text-center", settings.ktaTemplateBack ? "text-gray-800" : "text-white")}>{settings.ktaKetuaNama}</span>
                        </div>

                        {/* Sekretaris Sig */}
                        <div className="flex flex-col items-center w-[50px] relative">
                          <span className={cn("text-[3.5px] font-bold uppercase leading-none", settings.ktaTemplateBack ? "text-gray-400" : "text-slate-400")}>Sekretaris</span>
                          <div className="h-5 flex items-center justify-center scale-90">
                            {settings.ktaTandaTanganSekretaris ? (
                              <img src={getCorsSafeUrl(settings.ktaTandaTanganSekretaris)} alt="Tanda Tangan Sekretaris" className="h-5 object-contain" crossOrigin="anonymous" />
                            ) : (
                              <DefaultSignatureSekretaris />
                            )}
                          </div>
                          <span className={cn("text-[4px] font-black leading-none uppercase truncate w-full text-center", settings.ktaTemplateBack ? "text-gray-800" : "text-white")}>{settings.ktaSekretarisNama}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 max-w-[340px] mx-auto">
            <button 
              onClick={handleDownloadPDF}
              disabled={isGeneratingPdf}
              className="w-full flex items-center justify-center gap-2 py-3.5 bg-hw-green text-white rounded-2xl hover:bg-emerald-700 disabled:bg-emerald-900/50 transition-all shadow-lg shadow-emerald-700/15 text-xs font-extrabold uppercase tracking-wider cursor-pointer"
            >
              {isGeneratingPdf ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  Mengunduh PDF...
                </>
              ) : (
                <>
                  <Download size={16} />
                  Unduh KTA Resmi (PDF)
                </>
              )}
            </button>
            
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={handlePrint}
                className="flex items-center justify-center gap-2 py-3 bg-white border border-gray-100 rounded-2xl hover:bg-gray-50 transition-colors shadow-sm text-xs font-bold text-gray-700 cursor-pointer"
              >
                <Printer size={16} />
                Cetak Kartu
              </button>
              <button 
                onClick={() => setFlipped(!flipped)}
                className="flex items-center justify-center gap-2 py-3 bg-white border border-gray-100 rounded-2xl hover:bg-gray-50 transition-colors shadow-sm text-xs font-bold text-gray-700 cursor-pointer"
              >
                <RefreshCw size={16} />
                Balik Kartu
              </button>
            </div>
          </div>

          <div className="p-3 bg-blue-50 border border-blue-100/50 rounded-2xl flex items-start gap-2.5 max-w-[340px] mx-auto">
            <Info size={14} className="text-blue-500 shrink-0 mt-0.5" />
            <p className="text-[10px] text-blue-700 leading-no flex-1 font-medium">
              <strong>Tips:</strong> Untuk mencetak kartu fisik, Anda dapat memilih "Cetak Kartu" lalu simpan sebagai PDF, atau cetak langsung menggunakan printer ID Card / kertas tebal.
            </p>
          </div>
        </div>
      ) : (
        /* RENDER APPLICATION FORM if not applied or not approved yet */
        <div className="space-y-6">
          {/* Status alerts/instructions if pending or rejected */}
          {myApplication && myApplication.status === 'pending' && (
            <div className="space-y-4 max-w-[380px] mx-auto bg-amber-50/40 border border-amber-200/50 p-5 rounded-[2rem] shadow-sm">
              <div className="text-center space-y-3">
                <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center text-amber-500 mx-auto animate-pulse">
                  <CreditCard size={24} />
                </div>
                
                <div className="space-y-1">
                  <span className="bg-amber-100 text-amber-800 text-[8.5px] uppercase font-black tracking-widest px-2.5 py-0.5 rounded-full">
                    MENUNGGU VERIFIKASI
                  </span>
                  <h3 className="text-xs font-black text-gray-800 pt-1">Pengajuan KTA Sedang Ditinjau</h3>
                  <p className="text-[10px] text-gray-500 leading-relaxed font-semibold">
                    Silahkan selesaikan pembayaran aktivasi agar admin dapat memverifikasi data Anda. Anda juga dapat memperbarui data pengajuan di bawah ini.
                  </p>
                </div>
              </div>

              {/* PAYMENT NOTIFICATION CARD */}
              <div className="bg-white border border-emerald-100 rounded-3xl p-4 text-left space-y-3">
                <div className="flex items-center gap-2 border-b border-emerald-100 pb-2">
                  <div className="p-1 px-1.5 bg-hw-green text-white rounded-lg text-[8px] font-black uppercase">
                    INFO PEMBAYARAN
                  </div>
                  <span className="text-[9px] font-bold text-emerald-800 font-sans">KTA HW Jawa Tengah</span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="bg-gray-50 p-2.5 rounded-2xl border border-emerald-100/50 space-y-0.5">
                    <p className="text-[8px] uppercase tracking-wider text-gray-400 font-bold">Nominal Pembayaran</p>
                    <p className="text-sm font-black text-hw-green">
                      {myApplication.jenisKta === 'Fisik' ? 'Rp 50.000,-' : 'Rp 10.000,-'}
                    </p>
                    <p className="text-[8.5px] text-gray-500 font-medium">
                      Jenis KTA: <strong className="text-gray-700">{myApplication.jenisKta || 'Digital'}</strong> 
                      {myApplication.jenisKta === 'Fisik' ? ' (Sudah termasuk ongkos kirim)' : ''}
                    </p>
                  </div>

                  <div className="bg-gray-50 p-2.5 rounded-2xl border border-emerald-100/50 space-y-0.5">
                    <p className="text-[8px] uppercase tracking-wider text-gray-400 font-bold">Transfer ke Rekening</p>
                    <p className="text-[10px] font-bold text-emerald-800">BSI (Bank Syariah Indonesia)</p>
                    <p className="text-xs font-black text-gray-800 tracking-wide font-mono font-bold">7307427448</p>
                    <p className="text-[9px] text-gray-500 font-semibold uppercase">Atas Nama: Kwarwil HW Jateng</p>
                  </div>

                  <div className="text-[9px] text-emerald-800 leading-normal font-medium bg-emerald-50/50 p-2 rounded-xl border border-emerald-200 border-dashed">
                    Setelah transfer, konfirmasi bukti transfer via WhatsApp ke <strong>089688754000</strong>.
                  </div>
                </div>

                <a 
                  href={`https://wa.me/6289688754000?text=${encodeURIComponent(`Assalamu'alaikum Medkom HW Jateng, saya ingin konfirmasi bukti transfer pembayaran KTA HW Jateng.\n\nNama: ${myApplication.nama}\nNIK: ${myApplication.nik || '-'}\nJenis KTA: ${myApplication.jenisKta || 'Digital'}\nKabupaten/Kota: ${myApplication.asalDaerah || '-'}`)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-center text-[10px] font-bold leading-none flex items-center justify-center gap-1.5 shadow-sm transition-colors"
                >
                  Kirim Bukti Transfer WhatsApp
                </a>
              </div>
            </div>
          )}

          {myApplication && myApplication.status === 'rejected' && (
            <div className="space-y-3 max-w-[380px] mx-auto bg-rose-50/50 border border-rose-200/50 p-5 rounded-[2rem] shadow-sm">
              <div className="text-center space-y-2">
                <div className="w-12 h-12 bg-rose-50 rounded-full flex items-center justify-center text-rose-500 mx-auto">
                  <ShieldAlert size={24} />
                </div>
                
                <div className="space-y-1">
                  <span className="bg-rose-100 text-rose-850 text-[8.5px] uppercase font-black tracking-widest px-2.5 py-0.5 rounded-full">
                    PENGAJUAN DITOLAK
                  </span>
                  <h3 className="text-xs font-black text-gray-800 pt-1">Verifikasi KTA Belum Berhasil</h3>
                  <p className="text-[10px] text-gray-500 leading-relaxed font-semibold">
                    Maaf, permohonan Kartu Tanda Anggota Anda ditolak oleh Admin. Silahkan sesuaikan kembali data Anda pada formulir di bawah ini lalu kirim ulang.
                  </p>
                </div>
              </div>

              {myApplication.remark && (
                <div className="bg-white rounded-2xl p-3 text-[10px] font-serif text-rose-800 border border-rose-100 text-center italic">
                  Alasan penolakan: "{myApplication.remark}"
                </div>
              )}
            </div>
          )}

          <div className="space-y-1">
            <h3 className="text-base font-display font-bold text-gray-800">Pendaftaran KTA HW Jateng</h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              Silahkan isi data diri Anda secara lengkap dan benar untuk memohon Kartu Tanda Anggota (KTA) resmi Gerakan Kepanduan Hizbul Wathan Jawa Tengah.
            </p>
          </div>

          <form onSubmit={handleApply} className="bg-white border border-gray-100 rounded-[2rem] p-5 space-y-5 shadow-sm">
            
            {/* Foto Upload Slot */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Foto Profil KTA (Wajib)</label>
              <div className="flex items-center gap-4">
                <div className="w-16 h-20 rounded-xl bg-gray-50 border border-dashed border-gray-200 flex items-center justify-center overflow-hidden shrink-0 relative">
                  {photoPreview ? (
                    <img src={photoPreview} alt="Foto Profil" className="w-full h-full object-cover" />
                  ) : (
                    <UserIcon size={24} className="text-gray-300" />
                  )}
                </div>
                <div className="flex-1 space-y-1.5">
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handlePhotoChange}
                    ref={fileInputRef}
                    className="hidden"
                  />
                  <button 
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1.5 px-4 py-2 bg-gray-50 border border-gray-200 hover:bg-gray-100 transition-colors rounded-xl text-xs font-bold text-gray-600"
                  >
                    <Upload size={14} /> Pilih Foto Kepala
                  </button>
                  <p className="text-[9px] text-gray-400 leading-normal">Format JPG/PNG, Berseragam HW Lengkap, Maksimal Ukuran File 2 MB (Rasio Portrait 3:4) dengan background warna putih</p>
                </div>
              </div>
            </div>

            {/* Nama Lengkap */}
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Nama Lengkap (Sesuai KTP/Ijazah)</label>
              <input 
                type="text"
                required
                value={formData.nama}
                onChange={(e) => setFormData(prev => ({ ...prev, nama: e.target.value }))}
                placeholder="Masukkan nama lengkap Anda"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200/50 rounded-xl focus:ring-2 focus:ring-hw-green/20 outline-none text-xs font-semibold"
              />
            </div>

            {/* NIK */}
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">NIK / Nomor Induk Kependudukan (Wajib)</label>
              <input 
                type="text"
                required
                maxLength={16}
                value={formData.nik}
                onChange={(e) => setFormData(prev => ({ ...prev, nik: e.target.value.replace(/\D/g, '') }))}
                placeholder="Masukkan 16 digit NIK Anda"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200/50 rounded-xl focus:ring-2 focus:ring-hw-green/20 outline-none text-xs font-semibold font-mono"
              />
            </div>

            {/* Tempat & Tanggal Lahir Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Tempat Lahir</label>
                <input 
                  type="text"
                  required
                  value={formData.tempatLahir}
                  onChange={(e) => setFormData(prev => ({ ...prev, tempatLahir: e.target.value }))}
                  placeholder="Contoh: Banyumas"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200/50 rounded-xl focus:ring-2 focus:ring-hw-green/20 outline-none text-xs font-semibold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Tanggal Lahir</label>
                <input 
                  type="date"
                  required
                  value={formData.tanggalLahir}
                  onChange={(e) => setFormData(prev => ({ ...prev, tanggalLahir: e.target.value }))}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200/50 rounded-xl focus:ring-2 focus:ring-hw-green/20 outline-none text-xs font-semibold"
                />
              </div>
            </div>

            {/* Jenis Kelamin & Jenis KTA Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Jenis Kelamin</label>
                <select 
                  value={formData.jenisKelamin}
                  onChange={(e) => setFormData(prev => ({ ...prev, jenisKelamin: e.target.value }))}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200/50 rounded-xl focus:ring-2 focus:ring-hw-green/20 outline-none text-xs font-semibold"
                >
                  <option value="Laki-laki">Laki-laki</option>
                  <option value="Perempuan">Perempuan</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Jenis KTA</label>
                <select 
                  value={formData.jenisKta}
                  onChange={(e) => setFormData(prev => ({ ...prev, jenisKta: e.target.value }))}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200/50 rounded-xl focus:ring-2 focus:ring-hw-green/20 outline-none text-xs font-bold text-hw-green"
                >
                  <option value="Digital">Digital (Rp 10.000)</option>
                  <option value="Fisik">Fisik (Rp 50.000 - Kirim Rumah)</option>
                </select>
              </div>
            </div>

            {/* Tingkatan & Daerah Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Tingkatan HW</label>
                <select 
                  value={formData.tingkatan}
                  onChange={(e) => setFormData(prev => ({ ...prev, tingkatan: e.target.value }))}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200/50 rounded-xl focus:ring-2 focus:ring-hw-green/20 outline-none text-xs font-semibold"
                >
                  {TINGKATAN_LIST.map((lvl) => (
                    <option key={lvl} value={lvl}>{lvl}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Asal Kabupaten/Kota</label>
                <select 
                  value={formData.asalDaerah}
                  onChange={(e) => setFormData(prev => ({ ...prev, asalDaerah: e.target.value }))}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200/50 rounded-xl focus:ring-2 focus:ring-hw-green/20 outline-none text-xs font-semibold"
                >
                  {KABUPATEN_KOTA_JATENG.map((kab) => {
                    const item = KWARDA_QABILAH_JATENG.find(x => x.name === kab);
                    const displayLabel = item ? `${parseInt(item.code, 10)}. ${item.name}` : kab;
                    return (
                      <option key={kab} value={kab}>{displayLabel}</option>
                    );
                  })}
                </select>
              </div>
            </div>

            {/* Qabilah (sekolah/ pangkalan kegiatan) */}
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Asal Qabilah (Sekolah / Pangkalan Kegiatan)</label>
              <input 
                type="text"
                required
                value={formData.qabilah}
                onChange={(e) => setFormData(prev => ({ ...prev, qabilah: e.target.value }))}
                placeholder="Contoh: SD Muhammadiyah 1 / SMA HW Solo"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200/50 rounded-xl focus:ring-2 focus:ring-hw-green/20 outline-none text-xs font-semibold"
              />
            </div>

            {/* Alamat Lengkap */}
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Alamat Lengkap Rumah</label>
              <textarea 
                required
                rows={2}
                value={formData.alamat}
                onChange={(e) => setFormData(prev => ({ ...prev, alamat: e.target.value }))}
                placeholder="Dusun, RT/RW, Kelurahan, Kecamatan, Kode Pos"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200/50 rounded-xl focus:ring-2 focus:ring-hw-green/20 outline-none text-xs font-semibold resize-none"
              />
            </div>

            {/* Contact Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Nomor WhatsApp Aktif</label>
                <input 
                  type="text"
                  required
                  placeholder="Contoh: 081234567890"
                  value={formData.noWa}
                  onChange={(e) => setFormData(prev => ({ ...prev, noWa: e.target.value }))}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200/50 rounded-xl focus:ring-2 focus:ring-hw-green/20 outline-none text-xs font-semibold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Alamat Email Aktif</label>
                <input 
                  type="email"
                  required
                  placeholder="nama@email.com"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200/50 rounded-xl focus:ring-2 focus:ring-hw-green/20 outline-none text-xs font-semibold"
                />
              </div>
            </div>

            {/* Sosmed */}
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Media Sosial (Instagram/FB/X)</label>
              <input 
                type="text"
                placeholder="Contoh: @username"
                value={formData.sosmed}
                onChange={(e) => setFormData(prev => ({ ...prev, sosmed: e.target.value }))}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200/50 rounded-xl focus:ring-2 focus:ring-hw-green/20 outline-none text-xs font-semibold"
              />
            </div>

            {/* Biaya Admin Hub */}
            <div className="bg-emerald-50 border border-emerald-100 p-3.5 rounded-2xl">
              <p className="text-[10px] font-bold text-emerald-800">Rincian Biaya Penerbitan & Aktivasi:</p>
              <p className="text-xs text-emerald-700 leading-normal font-medium mt-1">
                - KTA Digital: <strong>Rp 10.000,-</strong> <br />
                - KTA Fisik: <strong>Rp 50.000,-</strong> (sudah termasuk ongkir ke alamat Anda)
              </p>
            </div>

            {/* Centang cek konfirmasi ketaatan data */}
            <div className="flex items-start gap-2.5 pt-1.5 pb-2">
              <input 
                type="checkbox"
                required
                id="conf-check"
                checked={isAgreed}
                onChange={(e) => setIsAgreed(e.target.checked)}
                className="mt-0.5 w-4 h-4 text-hw-green focus:ring-hw-green border-gray-300 rounded"
              />
              <label htmlFor="conf-check" className="text-[11px] text-gray-500 font-medium select-none cursor-pointer leading-tight">
                Saya menyatakan bahwa semua data yang saya isi di atas adalah benar, asli, dan siap dipertanggungjawabkan keabsahannya.
              </label>
            </div>

            {/* Submit Button */}
            <button 
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 gradient-bg text-white hover:opacity-90 rounded-2xl shadow-lg transition-all text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <RefreshCw className="animate-spin" size={16} /> Mengirim Data...
                </>
              ) : (
                <>
                  <CreditCard size={16} /> Daftar & Dapatkan KTA Sekarang
                </>
              )}
            </button>
          </form>
        </div>
      )}

      {/* QR MODAL PREVIEW FOR LIVE ACTIVE SCAN DEMO */}
      <AnimatePresence>
        {showQrModal && myApplication && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowQrModal(false)}
            />
            
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-[2rem] p-6 max-w-[320px] w-full text-center space-y-4 z-10 p-6 border border-gray-55 shadow-2xl relative"
            >
              <h3 className="text-xs font-black uppercase text-gray-400 tracking-widest leading-none">Verifikasi Keanggotaan</h3>
              <div className="w-40 h-40 bg-zinc-100 rounded-3xl p-3 flex items-center justify-center border-4 border-hw-green mx-auto relative group">
                <QrCode size={120} className="text-emerald-950" />
                <div className="absolute -inset-1 border-2 border-dashed border-amber-400 rounded-[1.8rem] animate-ping opacity-30 pointer-events-none"></div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-gray-800 uppercase leading-tight">{myApplication.nama}</h4>
                <p className="text-[10px] text-gray-400 font-mono font-medium tracking-wider">{myApplication.ktaNumber}</p>
                <span className="inline-block mt-2 bg-green-50 text-green-700 text-[8px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border border-green-100">
                  Resmi Terverifikasi
                </span>
              </div>

              <p className="text-[9px] text-gray-400 italic">
                QR Code ini berisi token otentikasi resmi untuk divalidasi oleh petugas lapangan Kwarwil HW Jateng.
              </p>

              <button 
                onClick={() => setShowQrModal(false)}
                className="w-full py-2.5 bg-gray-50 border border-gray-100 font-bold text-xs text-gray-600 rounded-xl"
              >
                Tutup
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

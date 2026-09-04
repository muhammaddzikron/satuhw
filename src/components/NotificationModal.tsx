import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  X, 
  CheckCircle2, 
  Clock, 
  UserCheck, 
  GraduationCap, 
  CreditCard, 
  FileText, 
  AlertCircle, 
  ChevronRight, 
  Shield, 
  RefreshCw,
  Award
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useNavigate } from 'react-router-dom';
import { firestoreService } from '../services/firestoreService';

export interface NotificationItem {
  id: string;
  type: 'kta' | 'member' | 'training' | 'upgrade' | 'task' | 'general';
  title: string;
  message: string;
  timestamp: string | number;
  read?: boolean;
  link?: string;
  actionType?: string;
}

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  adminData?: {
    pendingMembers?: any[];
    pendingKtaApps?: any[];
    pendingTrainingApps?: any[];
    membersWithUpgradeRequests?: any[];
    submittedTaskApps?: any[];
  };
  onNavigateTab?: (tab: string) => void;
}

export const NotificationModal: React.FC<NotificationModalProps> = ({
  isOpen,
  onClose,
  adminData,
  onNavigateTab
}) => {
  const { user, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState<'all' | 'admin' | 'my'>('all');
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);

  const isAdmin = user?.role === 'admin' || (user as any)?.role === 'superadmin' || (user as any)?.role === 'admin_diklat' || (user as any)?.adminType;
  const isPelatih = (user as any)?.role === 'pelatih' || (user as any)?.roles?.includes('pelatih');

  useEffect(() => {
    if (!isOpen) return;

    const buildNotifications = () => {
      const items: NotificationItem[] = [];

      // 1. Admin / Pelatih items if available
      if (adminData) {
        const {
          pendingMembers = [],
          pendingKtaApps = [],
          pendingTrainingApps = [],
          membersWithUpgradeRequests = [],
          submittedTaskApps = []
        } = adminData;

        if (pendingMembers.length > 0) {
          items.push({
            id: 'admin-pending-members',
            type: 'member',
            title: `${pendingMembers.length} Pendaftaran Anggota Baru`,
            message: `Terdapat ${pendingMembers.length} calon anggota menunggu verifikasi data dan penetapan NBM.`,
            timestamp: 'Baru saja',
            link: '/admin',
            actionType: 'pendaftaran'
          });
        }

        if (membersWithUpgradeRequests.length > 0) {
          items.push({
            id: 'admin-upgrade-requests',
            type: 'upgrade',
            title: `${membersWithUpgradeRequests.length} Pengajuan Upgrade Golongan`,
            message: `Ada ${membersWithUpgradeRequests.length} permohonan kenaikan tingkat/golongan yang perlu ditinjau.`,
            timestamp: 'Perlu Tindakan',
            link: '/admin',
            actionType: 'upgrade'
          });
        }

        if (pendingKtaApps.length > 0) {
          items.push({
            id: 'admin-pending-kta',
            type: 'kta',
            title: `${pendingKtaApps.length} Pengajuan KTA Baru`,
            message: `Terdapat ${pendingKtaApps.length} pengajuan pencetakan Kartu Tanda Anggota menunggu persetujuan.`,
            timestamp: 'Antrean KTA',
            link: '/admin',
            actionType: 'kta'
          });
        }

        if (pendingTrainingApps.length > 0) {
          items.push({
            id: 'admin-pending-training',
            type: 'training',
            title: `${pendingTrainingApps.length} Pendaftaran Diklat Masuk`,
            message: `Pendaftaran Jaya Melati / Jaya Matahari baru menunggu konfirmasi administratif.`,
            timestamp: 'Diklat HW',
            link: '/admin',
            actionType: 'pelatihan'
          });
        }

        if (submittedTaskApps.length > 0) {
          items.push({
            id: 'admin-submitted-tasks',
            type: 'task',
            title: `${submittedTaskApps.length} Tugas Peserta Terkumpul`,
            message: `Laporan RTL / penugasan materi mandiri peserta siap dinilai oleh tim pelatih.`,
            timestamp: 'Penugasan Diklat',
            link: '/admin',
            actionType: 'tugas'
          });
        }
      }

      // 2. Personal user notifications
      if (user) {
        if (user.nomorKTA || (user as any).nomorKta || (user as any).nomorBaku || user.isVerified) {
          items.push({
            id: 'user-kta-active',
            type: 'kta',
            title: 'KTA Resmi Telah Aktif',
            message: `Nomor KTA: ${user.nomorKTA || (user as any).nomorKta || (user as any).nomorBaku || '-'} aktif. Anda dapat mengunduh atau Save As PDF kapan saja.`,
            timestamp: 'Aktif',
            link: '/kta'
          });
        }

        if (user.role && user.role !== 'umum') {
          items.push({
            id: 'user-role-status',
            type: 'general',
            title: `Tingkatan Keanggotaan: ${(user as any).tingkatan || user.role}`,
            message: `Profil keanggotaan Anda telah diverifikasi oleh Kwartir Wilayah HW Jawa Tengah.`,
            timestamp: 'Tervalidasi',
            link: '/profile'
          });
        }

        // Welcome notice
        items.push({
          id: 'welcome-info',
          type: 'general',
          title: 'Selamat Datang di Satu HW Jateng',
          message: 'Sistem Super Apps Terintegrasi Kwartir Wilayah Hizbul Wathan Jawa Tengah.',
          timestamp: 'Informasi',
          link: '/'
        });
      }

      setNotifications(items);
    };

    buildNotifications();
  }, [isOpen, adminData, user]);

  if (!isOpen) return null;

  const handleItemClick = (item: NotificationItem) => {
    onClose();
    if (item.actionType && onNavigateTab) {
      onNavigateTab(item.actionType);
    } else if (item.link) {
      navigate(item.link);
    }
  };

  const getIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'kta':
        return <CreditCard className="text-emerald-600" size={18} />;
      case 'member':
        return <UserCheck className="text-blue-600" size={18} />;
      case 'upgrade':
        return <Award className="text-purple-600" size={18} />;
      case 'training':
        return <GraduationCap className="text-amber-600" size={18} />;
      case 'task':
        return <FileText className="text-indigo-600" size={18} />;
      default:
        return <Bell className="text-hw-green" size={18} />;
    }
  };

  const filteredNotifications = notifications.filter(item => {
    if (activeFilter === 'admin') return item.id.startsWith('admin-');
    if (activeFilter === 'my') return item.id.startsWith('user-');
    return true;
  });

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-gray-100 space-y-4 my-auto transform transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl">
              <Bell size={20} />
            </div>
            <div>
              <h3 className="text-base font-black text-gray-900 font-display">Pusat Pemberitahuan</h3>
              <p className="text-[11px] text-gray-400 font-medium">Informasi & status antrean sistem Satu HW</p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
            aria-label="Tutup"
          >
            <X size={18} />
          </button>
        </div>

        {/* Filter Pills */}
        {(isAdmin || isPelatih) && (
          <div className="flex items-center gap-1.5 p-1 bg-gray-100/80 rounded-2xl">
            <button
              type="button"
              onClick={() => setActiveFilter('all')}
              className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeFilter === 'all' 
                  ? 'bg-white text-emerald-800 shadow-xs' 
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              Semua ({notifications.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('admin')}
              className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeFilter === 'admin' 
                  ? 'bg-white text-emerald-800 shadow-xs' 
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              Admin & Diklat
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('my')}
              className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeFilter === 'my' 
                  ? 'bg-white text-emerald-800 shadow-xs' 
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              Pribadi
            </button>
          </div>
        )}

        {/* Notification List */}
        <div className="max-h-[60vh] overflow-y-auto space-y-2.5 pr-1">
          {filteredNotifications.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <CheckCircle2 size={36} className="text-emerald-500 mx-auto opacity-70" />
              <p className="text-xs font-bold text-gray-700">Tidak ada pemberitahuan baru</p>
              <p className="text-[11px] text-gray-400">Semua aktivitas dan permohonan telah selesai ditangani.</p>
            </div>
          ) : (
            filteredNotifications.map((item) => (
              <div
                key={item.id}
                onClick={() => handleItemClick(item)}
                className="group p-3.5 rounded-2xl border border-gray-100 hover:border-emerald-200 bg-gray-50/50 hover:bg-emerald-50/40 transition-all cursor-pointer flex items-start gap-3 relative"
              >
                <div className="p-2 rounded-xl bg-white shadow-2xs border border-gray-100 shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                  {getIcon(item.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <h4 className="text-xs font-bold text-gray-900 group-hover:text-emerald-800 truncate transition-colors">
                      {item.title}
                    </h4>
                    <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100/80 text-emerald-700 shrink-0">
                      {item.timestamp}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-600 line-clamp-2 leading-relaxed">
                    {item.message}
                  </p>
                </div>
                <ChevronRight size={15} className="text-gray-300 group-hover:text-emerald-600 transition-colors shrink-0 self-center" />
              </div>
            ))
          )}
        </div>

        {/* Modal Footer */}
        <div className="border-t border-gray-100 pt-3 flex items-center justify-between">
          <span className="text-[10px] text-gray-400 font-semibold">
            Status tersinkronisasi dengan Firebase
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

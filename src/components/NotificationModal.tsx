import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { 
  Bell, 
  X, 
  CheckCircle2, 
  UserCheck, 
  GraduationCap, 
  CreditCard, 
  FileText, 
  ChevronRight, 
  Award,
  CheckCheck,
  Check,
  Calendar,
  History,
  ArrowLeft,
  ExternalLink,
  Info
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useNavigate } from 'react-router-dom';
import { 
  NotificationItem, 
  buildAllNotifications, 
  markNotificationAsRead, 
  markAllNotificationsAsRead 
} from '../utils/notificationUtils';

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
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState<'all' | 'admin' | 'my'>('all');
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedDetailItem, setSelectedDetailItem] = useState<NotificationItem | null>(null);

  const isAdmin = Boolean(
    user && (
      user.role === 'admin' || 
      user.role === 'superadmin' || 
      user.role === 'admin_diklat' || 
      user.role === 'diklat' || 
      user.role === 'sugli' || 
      user.role === 'kwarda' || 
      (user as any).adminType
    )
  );
  const isPelatih = Boolean(
    user && (
      (user as any).role === 'pelatih' || 
      (user.roles as any[])?.includes?.('pelatih') || 
      user.role === 'jari1' || 
      user.role === 'jayamatahari1' || 
      user.role === 'jari2' || 
      user.role === 'jayamatahari2'
    )
  );

  const refreshItems = () => {
    const items = buildAllNotifications({ user, adminData });
    setNotifications(items);
  };

  useEffect(() => {
    if (!isOpen) {
      setShowHistory(false);
      return;
    }
    refreshItems();

    const handleReadUpdate = () => refreshItems();
    window.addEventListener('notifications_read_updated', handleReadUpdate);
    window.addEventListener('training_applications_updated', handleReadUpdate);
    window.addEventListener('kta_applications_updated', handleReadUpdate);
    window.addEventListener('member_updated', handleReadUpdate);
    window.addEventListener('storage', handleReadUpdate);
    return () => {
      window.removeEventListener('notifications_read_updated', handleReadUpdate);
      window.removeEventListener('training_applications_updated', handleReadUpdate);
      window.removeEventListener('kta_applications_updated', handleReadUpdate);
      window.removeEventListener('member_updated', handleReadUpdate);
      window.removeEventListener('storage', handleReadUpdate);
    };
  }, [isOpen, adminData, user]);

  const userKey = user?.email || user?.id || '';

  const handleClose = () => {
    // Automatically mark all viewed notifications as read so they do not reappear once opened
    const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
    if (unreadIds.length > 0) {
      markAllNotificationsAsRead(unreadIds, userKey);
    }
    setSelectedDetailItem(null);
    onClose();
  };

  const handleItemClick = (item: NotificationItem) => {
    markNotificationAsRead(item.id, userKey);
    setNotifications(prev => prev.map(n => n.id === item.id ? { ...n, read: true } : n));
    setSelectedDetailItem(item);
  };

  const handleNavigate = (item: NotificationItem) => {
    markNotificationAsRead(item.id, userKey);
    setNotifications(prev => prev.map(n => n.id === item.id ? { ...n, read: true } : n));
    setSelectedDetailItem(null);
    onClose();

    if (item.actionType && onNavigateTab) {
      if (item.actionType === 'pendaftaran' || item.actionType === 'upgrade') {
        onNavigateTab('anggota');
      } else {
        onNavigateTab(item.actionType);
      }
    } else if (item.link) {
      navigate(item.link);
    }
  };

  const handleMarkSingleRead = (e: React.MouseEvent, item: NotificationItem) => {
    e.preventDefault();
    e.stopPropagation();
    markNotificationAsRead(item.id, userKey);
    setNotifications(prev => prev.map(n => n.id === item.id ? { ...n, read: true } : n));
    if (selectedDetailItem?.id === item.id) {
      setSelectedDetailItem(prev => prev ? { ...prev, read: true } : null);
    }
  };

  const handleMarkAllRead = () => {
    const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
    if (unreadIds.length > 0) {
      markAllNotificationsAsRead(unreadIds, userKey);
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
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
        return <Calendar className="text-hw-green" size={18} />;
    }
  };

  const getCategoryName = (type: NotificationItem['type']) => {
    switch (type) {
      case 'kta':
        return 'Penerbitan KTA';
      case 'member':
        return 'Pendaftaran Anggota';
      case 'upgrade':
        return 'Kenaikan Tingkat';
      case 'training':
        return 'Pelatihan Diklat';
      case 'task':
        return 'Penugasan / RTL';
      default:
        return 'Informasi Sistem';
    }
  };

  // Counts calculated strictly for unread / unopened items
  const unreadNotifications = useMemo(() => notifications.filter(n => !n.read), [notifications]);
  const readNotifications = useMemo(() => notifications.filter(n => n.read), [notifications]);

  const unreadTotal = unreadNotifications.length;
  const unreadAdminTotal = unreadNotifications.filter(n => n.id.startsWith('admin-')).length;
  const unreadMyTotal = unreadNotifications.filter(n => n.id.startsWith('user-') || n.id.startsWith('welcome-')).length;

  // By default, only unread items are displayed ("yang sudah pernah dibuka tidak muncul kembali")
  const displayedNotifications = useMemo(() => {
    const pool = showHistory ? readNotifications : unreadNotifications;
    return pool.filter(item => {
      if (activeFilter === 'admin') return item.id.startsWith('admin-');
      if (activeFilter === 'my') return item.id.startsWith('user-') || item.id.startsWith('welcome-');
      return true;
    });
  }, [showHistory, readNotifications, unreadNotifications, activeFilter]);

  if (!isOpen || typeof document === 'undefined') return null;

  const modalContent = (
    <div 
      className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200"
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
    >
      <div 
        className="bg-white rounded-3xl max-w-lg w-full p-4 sm:p-6 shadow-2xl border border-gray-150 space-y-4 my-auto transform transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* VIEW 1: RINCIAN PEMBERITAHUAN (DETAIL VIEW) */}
        {selectedDetailItem ? (
          <div className="space-y-4 animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <button
                type="button"
                onClick={() => setSelectedDetailItem(null)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-gray-600 hover:text-emerald-700 hover:bg-emerald-50 transition-colors cursor-pointer"
              >
                <ArrowLeft size={16} />
                <span>Kembali ke Daftar</span>
              </button>
              <button 
                type="button"
                onClick={handleClose} 
                className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
                title="Tutup"
              >
                <X size={18} />
              </button>
            </div>

            {/* Rincian Content */}
            <div className="space-y-4 pt-1">
              <div className="flex items-start gap-3.5 bg-gray-50/80 p-4 rounded-2xl border border-gray-150">
                <div className="p-3 bg-white text-emerald-700 rounded-2xl shadow-xs border border-gray-150 shrink-0 mt-0.5">
                  {getIcon(selectedDetailItem.type)}
                </div>
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase rounded-full tracking-wider">
                      {getCategoryName(selectedDetailItem.type)}
                    </span>
                    <span className="text-[11px] text-gray-400 font-medium">
                      {selectedDetailItem.timestamp}
                    </span>
                  </div>
                  <h3 className="text-base font-black text-gray-900 leading-snug">
                    {selectedDetailItem.title}
                  </h3>
                </div>
              </div>

              {/* Message Details */}
              <div className="bg-emerald-50/40 p-4 rounded-2xl border border-emerald-100/80 space-y-2">
                <div className="flex items-center gap-2 text-emerald-800 text-xs font-black">
                  <Info size={16} />
                  <span>Keterangan Pemberitahuan:</span>
                </div>
                <p className="text-xs text-gray-700 leading-relaxed">
                  {selectedDetailItem.message}
                </p>
              </div>

              {/* Direct Actions */}
              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  onClick={() => handleNavigate(selectedDetailItem)}
                  className="w-full py-3 px-4 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white rounded-2xl text-xs font-black shadow-md shadow-emerald-700/20 hover:shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-98"
                >
                  <span>Buka & Tindak Lanjuti di Dashboard</span>
                  <ExternalLink size={16} />
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedDetailItem(null)}
                    className="flex-1 py-2.5 px-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-all cursor-pointer text-center"
                  >
                    Daftar Notifikasi Lainnya
                  </button>
                  <button
                    type="button"
                    onClick={handleClose}
                    className="py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-all cursor-pointer text-center"
                  >
                    Tutup
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-2xl">
                  <Bell size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-black text-gray-900 font-display">Pusat Notifikasi</h3>
                    {unreadTotal > 0 && (
                      <span className="px-2 py-0.5 bg-rose-500 text-white text-[10px] font-black rounded-full shadow-2xs">
                        {unreadTotal} Baru
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-gray-400 font-medium">Informasi & status antrean sistem Satu HW</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {unreadTotal > 0 && !showHistory && (
                  <button
                    type="button"
                    onClick={handleMarkAllRead}
                    className="px-2.5 py-1.5 rounded-xl text-xs font-bold text-emerald-700 hover:bg-emerald-50 transition-colors flex items-center gap-1 cursor-pointer"
                    title="Tandai semua telah dibaca (tidak muncul lagi)"
                  >
                    <CheckCheck size={14} />
                    <span className="hidden sm:inline">Tandai Dibaca</span>
                  </button>
                )}
                <button 
                  type="button"
                  onClick={handleClose} 
                  className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
                  aria-label="Tutup"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Filter Tabs */}
            {(isAdmin || isPelatih) && (
          <div className="flex items-center gap-1.5 p-1 bg-gray-100/90 rounded-2xl">
            <button
              type="button"
              onClick={() => setActiveFilter('all')}
              className={`flex-1 py-1.5 px-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeFilter === 'all' 
                  ? 'bg-white text-emerald-800 shadow-xs' 
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              <span>Semua</span>
              {unreadTotal > 0 && (
                <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 text-[10px] rounded-full font-black">
                  {unreadTotal}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('admin')}
              className={`flex-1 py-1.5 px-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeFilter === 'admin' 
                  ? 'bg-white text-emerald-800 shadow-xs' 
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              <span>Admin & Diklat</span>
              {unreadAdminTotal > 0 && (
                <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 text-[10px] rounded-full font-black">
                  {unreadAdminTotal}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('my')}
              className={`flex-1 py-1.5 px-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeFilter === 'my' 
                  ? 'bg-white text-emerald-800 shadow-xs' 
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              <span>Pribadi</span>
              {unreadMyTotal > 0 && (
                <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 text-[10px] rounded-full font-black">
                  {unreadMyTotal}
                </span>
              )}
            </button>
          </div>
        )}

        {/* History Banner Indicator */}
        {showHistory && (
          <div className="flex items-center justify-between px-3 py-2 bg-amber-50/80 border border-amber-200/60 rounded-xl text-amber-800 text-xs">
            <div className="flex items-center gap-1.5 font-medium">
              <History size={14} className="text-amber-600 shrink-0" />
              <span>Menampilkan notifikasi yang sudah pernah dibuka</span>
            </div>
            <button
              type="button"
              onClick={() => setShowHistory(false)}
              className="font-bold underline hover:text-amber-950 cursor-pointer text-[11px]"
            >
              Tutup Riwayat
            </button>
          </div>
        )}

        {/* Notification List */}
        <div className="max-h-[55vh] overflow-y-auto space-y-2 pr-1">
          {displayedNotifications.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <CheckCircle2 size={36} className="text-emerald-500 mx-auto opacity-70" />
              <p className="text-xs font-bold text-gray-700">
                {showHistory ? 'Tidak ada riwayat pemberitahuan' : 'Tidak ada pemberitahuan baru'}
              </p>
              <p className="text-[11px] text-gray-400 max-w-xs mx-auto">
                {showHistory 
                  ? 'Belum ada notifikasi yang pernah dibuka sebelumnya.'
                  : 'Semua aktivitas dan pemberitahuan yang sudah dibuka tidak akan muncul kembali.'}
              </p>
            </div>
          ) : (
            displayedNotifications.map((item) => {
              const isUnread = !item.read;
              return (
                <div
                  key={item.id}
                  onClick={() => handleItemClick(item)}
                  className={`group p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 relative ${
                    isUnread 
                      ? 'border-emerald-200 bg-emerald-50/40 hover:bg-emerald-50/70 shadow-2xs' 
                      : 'border-gray-100 bg-gray-50/60 hover:bg-gray-100/70 opacity-85 hover:opacity-100'
                  }`}
                >
                  <div className="p-2 rounded-xl bg-white shadow-2xs border border-gray-150 shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                    {getIcon(item.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <div className="flex items-center gap-1.5 min-w-0">
                        {isUnread && (
                          <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 animate-pulse" />
                        )}
                        <h4 className="text-xs font-bold text-gray-900 group-hover:text-emerald-800 truncate transition-colors">
                          {item.title}
                        </h4>
                      </div>
                      <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full shrink-0 ${
                        isUnread ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-200/80 text-gray-600'
                      }`}>
                        {item.timestamp}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-600 line-clamp-2 leading-relaxed">
                      {item.message}
                    </p>
                  </div>
                  
                  {/* Action controls */}
                  <div className="flex items-center gap-1 shrink-0 self-center">
                    {isUnread && (
                      <button
                        type="button"
                        onClick={(e) => handleMarkSingleRead(e, item)}
                        className="p-1.5 rounded-xl text-gray-400 hover:text-emerald-700 hover:bg-emerald-50 transition-colors cursor-pointer"
                        title="Tandai dibaca (hilangkan dari daftar)"
                        aria-label="Tandai dibaca"
                      >
                        <Check size={14} />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleNavigate(item);
                      }}
                      className="p-1.5 rounded-xl text-gray-400 hover:text-emerald-700 hover:bg-emerald-50 transition-colors cursor-pointer"
                      title="Buka langsung di halaman terkait"
                    >
                      <ExternalLink size={14} />
                    </button>
                    <ChevronRight size={15} className="text-gray-300 group-hover:text-emerald-600 transition-colors shrink-0" />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="border-t border-gray-100 pt-3 flex items-center justify-between">
          <div>
            {readNotifications.length > 0 && (
              <button
                type="button"
                onClick={() => setShowHistory(!showHistory)}
                className="text-[11px] font-bold text-gray-500 hover:text-emerald-700 transition-colors cursor-pointer flex items-center gap-1"
              >
                <History size={13} />
                <span>
                  {showHistory 
                    ? 'Kembali ke Baru' 
                    : `Riwayat dibuka (${readNotifications.length})`}
                </span>
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            {unreadTotal > 0 && !showHistory && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl text-xs font-bold transition-all cursor-pointer active:scale-95"
              >
                Tandai Semua Dibaca
              </button>
            )}
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-all cursor-pointer active:scale-95"
            >
              Tutup
            </button>
          </div>
        </div>
          </>
        )}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};


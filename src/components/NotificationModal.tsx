import React, { useState, useEffect } from 'react';
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
  Calendar
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
    if (!isOpen) return;
    refreshItems();

    const handleReadUpdate = () => refreshItems();
    window.addEventListener('notifications_read_updated', handleReadUpdate);
    window.addEventListener('storage', handleReadUpdate);
    return () => {
      window.removeEventListener('notifications_read_updated', handleReadUpdate);
      window.removeEventListener('storage', handleReadUpdate);
    };
  }, [isOpen, adminData, user]);

  if (!isOpen || typeof document === 'undefined') return null;

  const handleItemClick = (item: NotificationItem) => {
    markNotificationAsRead(item.id);
    onClose();

    if (item.actionType && onNavigateTab) {
      onNavigateTab(item.actionType);
    } else if (item.link) {
      navigate(item.link);
    }
  };

  const handleMarkAllRead = () => {
    const allIds = notifications.map(n => n.id);
    markAllNotificationsAsRead(allIds);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
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

  const filteredNotifications = notifications.filter(item => {
    if (activeFilter === 'admin') return item.id.startsWith('admin-');
    if (activeFilter === 'my') return item.id.startsWith('user-') || item.id.startsWith('welcome-');
    return true;
  });

  const unreadTotal = notifications.filter(n => !n.read).length;

  const modalContent = (
    <div 
      className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div 
        className="bg-white rounded-3xl max-w-lg w-full p-4 sm:p-6 shadow-2xl border border-gray-150 space-y-4 my-auto transform transition-all"
        onClick={(e) => e.stopPropagation()}
      >
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
            {unreadTotal > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="px-2.5 py-1.5 rounded-xl text-xs font-bold text-emerald-700 hover:bg-emerald-50 transition-colors flex items-center gap-1 cursor-pointer"
                title="Tandai semua telah dibaca"
              >
                <CheckCheck size={14} />
                <span className="hidden sm:inline">Tandai Dibaca</span>
              </button>
            )}
            <button 
              type="button"
              onClick={onClose} 
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
        <div className="max-h-[55vh] overflow-y-auto space-y-2 pr-1">
          {filteredNotifications.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <CheckCircle2 size={36} className="text-emerald-500 mx-auto opacity-70" />
              <p className="text-xs font-bold text-gray-700">Tidak ada pemberitahuan</p>
              <p className="text-[11px] text-gray-400">Semua aktivitas dan permohonan telah terpantau rapi.</p>
            </div>
          ) : (
            filteredNotifications.map((item) => {
              const isUnread = !item.read;
              return (
                <div
                  key={item.id}
                  onClick={() => handleItemClick(item)}
                  className={`group p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 relative ${
                    isUnread 
                      ? 'border-emerald-200 bg-emerald-50/40 hover:bg-emerald-50/70 shadow-2xs' 
                      : 'border-gray-100 bg-gray-50/60 hover:bg-gray-100/70 opacity-80 hover:opacity-100'
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
                  <ChevronRight size={15} className="text-gray-300 group-hover:text-emerald-600 transition-colors shrink-0 self-center" />
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="border-t border-gray-100 pt-3 flex items-center justify-between">
          <span className="text-[10px] text-gray-400 font-semibold">
            Status tersinkronisasi sistem Satu HW
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-all cursor-pointer active:scale-95"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

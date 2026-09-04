import React, { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { NotificationModal } from './NotificationModal';
import { firestoreService } from '../services/firestoreService';

interface NotificationBellProps {
  className?: string;
  adminData?: {
    pendingMembers?: any[];
    pendingKtaApps?: any[];
    pendingTrainingApps?: any[];
    membersWithUpgradeRequests?: any[];
    submittedTaskApps?: any[];
  };
  onNavigateTab?: (tab: string) => void;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({
  className = '',
  adminData,
  onNavigateTab
}) => {
  const { user, isAuthenticated } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  const isAdmin = user?.role === 'admin' || (user as any)?.role === 'superadmin' || (user as any)?.role === 'admin_diklat' || (user as any)?.adminType;
  const isPelatih = (user as any)?.role === 'pelatih' || (user as any)?.roles?.includes('pelatih');

  useEffect(() => {
    let count = 0;

    if (adminData) {
      const {
        pendingMembers = [],
        pendingKtaApps = [],
        pendingTrainingApps = [],
        membersWithUpgradeRequests = [],
        submittedTaskApps = []
      } = adminData;

      count = pendingMembers.length + pendingKtaApps.length + pendingTrainingApps.length + membersWithUpgradeRequests.length + submittedTaskApps.length;
    } else if (isAdmin || isPelatih) {
      // Calculate light badge count from cache
      try {
        const storedMembers = localStorage.getItem('hw_members');
        const storedKta = localStorage.getItem('hw_kta_applications');
        const storedTraining = localStorage.getItem('hw_training_applications');
        
        const m = storedMembers ? JSON.parse(storedMembers) : [];
        const k = storedKta ? JSON.parse(storedKta) : [];
        const t = storedTraining ? JSON.parse(storedTraining) : [];

        const pendingM = Array.isArray(m) ? m.filter((item: any) => !item.isVerified && item.status !== 'rejected').length : 0;
        const pendingK = Array.isArray(k) ? k.filter((item: any) => item.status === 'pending').length : 0;
        const pendingT = Array.isArray(t) ? t.filter((item: any) => item.status === 'pending').length : 0;

        count = pendingM + pendingK + pendingT;
      } catch (e) {
        count = 0;
      }
    } else if (user) {
      // For standard members, indicate active status if not seen
      if (user.nomorKTA || (user as any)?.nomorKta || (user as any)?.isVerified) {
        count = 1;
      }
    }

    setUnreadCount(count);
  }, [adminData, user, isAdmin, isPelatih]);

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsOpen(true);
        }}
        className={`relative p-2.5 rounded-xl transition-all cursor-pointer touch-manipulation flex items-center justify-center ${
          unreadCount > 0 
            ? 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100/80' 
            : 'text-gray-400 hover:text-emerald-700 hover:bg-gray-50'
        } ${className}`}
        title="Pusat Notifikasi & Pemberitahuan"
        aria-label="Pusat Notifikasi"
      >
        <Bell size={20} className={unreadCount > 0 ? 'animate-bounce-short' : ''} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-rose-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white shadow-xs">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      <NotificationModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        adminData={adminData}
        onNavigateTab={onNavigateTab}
      />
    </>
  );
};

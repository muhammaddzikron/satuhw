import React, { useState, useEffect, useCallback } from 'react';
import { Bell } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { NotificationModal } from './NotificationModal';
import { calculateUnreadCount } from '../utils/notificationUtils';

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
  const { user } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  const updateCount = useCallback(() => {
    const count = calculateUnreadCount({ user, adminData });
    setUnreadCount(count);
  }, [user, adminData]);

  useEffect(() => {
    updateCount();

    const handleUpdates = () => {
      updateCount();
    };

    window.addEventListener('notifications_read_updated', handleUpdates);
    window.addEventListener('training_applications_updated', handleUpdates);
    window.addEventListener('storage', handleUpdates);

    // Light interval check for fresh notifications
    const interval = setInterval(updateCount, 15000);

    return () => {
      window.removeEventListener('notifications_read_updated', handleUpdates);
      window.removeEventListener('training_applications_updated', handleUpdates);
      window.removeEventListener('storage', handleUpdates);
      clearInterval(interval);
    };
  }, [updateCount]);

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsOpen(true);
        }}
        className={`relative min-h-[40px] min-w-[40px] p-2.5 rounded-2xl transition-all cursor-pointer touch-manipulation flex items-center justify-center active:scale-95 ${
          unreadCount > 0 
            ? 'text-emerald-700 bg-emerald-50/90 hover:bg-emerald-100 shadow-2xs' 
            : 'text-gray-500 hover:text-emerald-700 hover:bg-gray-100/80'
        } ${className}`}
        title="Pusat Notifikasi & Pemberitahuan"
        aria-label="Pusat Notifikasi"
      >
        <Bell size={20} className={unreadCount > 0 ? 'text-emerald-600' : 'text-gray-500'} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[19px] h-[19px] px-1 bg-rose-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white shadow-xs animate-in zoom-in-50 duration-150">
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

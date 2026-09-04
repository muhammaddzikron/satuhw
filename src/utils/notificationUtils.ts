export interface NotificationItem {
  id: string;
  type: 'kta' | 'member' | 'training' | 'upgrade' | 'task' | 'general';
  title: string;
  message: string;
  timestamp: string;
  read?: boolean;
  link?: string;
  actionType?: string;
}

const STORAGE_KEY = 'hw_read_notifications';

export function getReadNotificationIds(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function markNotificationAsRead(id: string): void {
  if (typeof window === 'undefined' || !id) return;
  try {
    const current = getReadNotificationIds();
    if (!current.includes(id)) {
      const updated = [...current, id];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('notifications_read_updated', { detail: { id } }));
    }
  } catch (e) {
    console.error('Failed to save read notification:', e);
  }
}

export function markAllNotificationsAsRead(ids: string[]): void {
  if (typeof window === 'undefined' || !Array.isArray(ids)) return;
  try {
    const current = getReadNotificationIds();
    const updated = Array.from(new Set([...current, ...ids]));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('notifications_read_updated', { detail: { ids } }));
  } catch (e) {
    console.error('Failed to mark all notifications as read:', e);
  }
}

function parseJsonSafe(key: string): any[] {
  if (typeof window === 'undefined') return [];
  try {
    const item = localStorage.getItem(key);
    if (!item) return [];
    const parsed = JSON.parse(item);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function buildAllNotifications(options: {
  user: any;
  adminData?: {
    pendingMembers?: any[];
    pendingKtaApps?: any[];
    pendingTrainingApps?: any[];
    membersWithUpgradeRequests?: any[];
    submittedTaskApps?: any[];
  };
}): NotificationItem[] {
  const { user, adminData } = options;
  const items: NotificationItem[] = [];
  const readIds = new Set(getReadNotificationIds());

  const isAdmin = user && (
    user.role === 'admin' ||
    user.role === 'superadmin' ||
    user.role === 'admin_diklat' ||
    user.role === 'diklat' ||
    user.role === 'sugli' ||
    user.role === 'kwarda' ||
    user.adminType
  );
  const isPelatih = user && (
    (user as any).role === 'pelatih' || 
    (user.roles as any[])?.includes?.('pelatih') ||
    user.role === 'jari1' || 
    user.role === 'jayamatahari1' ||
    user.role === 'jari2' || 
    user.role === 'jayamatahari2'
  );

  // 1. Admin & Trainer Notifications
  if (isAdmin || isPelatih || adminData) {
    let pendingMembers: any[] = [];
    let pendingKtaApps: any[] = [];
    let pendingTrainingApps: any[] = [];
    let membersWithUpgradeRequests: any[] = [];
    let submittedTaskApps: any[] = [];
    let pendingActivityApps: any[] = [];

    if (adminData) {
      pendingMembers = adminData.pendingMembers || [];
      pendingKtaApps = adminData.pendingKtaApps || [];
      pendingTrainingApps = adminData.pendingTrainingApps || [];
      membersWithUpgradeRequests = adminData.membersWithUpgradeRequests || [];
      submittedTaskApps = adminData.submittedTaskApps || [];
    } else {
      // Fallback to local caches
      const members = parseJsonSafe('mock_members').length > 0 ? parseJsonSafe('mock_members') : parseJsonSafe('hw_members');
      const ktas = parseJsonSafe('kta_applications').length > 0 ? parseJsonSafe('kta_applications') : parseJsonSafe('hw_kta_applications');
      const trainings = parseJsonSafe('training_applications').length > 0 ? parseJsonSafe('training_applications') : parseJsonSafe('hw_training_applications');
      const activities = parseJsonSafe('activity_applications').length > 0 ? parseJsonSafe('activity_applications') : parseJsonSafe('hw_activity_applications');

      pendingMembers = members.filter((m: any) => !m.isVerified && m.status !== 'rejected');
      membersWithUpgradeRequests = members.filter((m: any) => 
        m.statusUpgrade === 'pending' || 
        (Array.isArray(m.upgradeRequests) && m.upgradeRequests.length > 0)
      );
      pendingKtaApps = ktas.filter((k: any) => k.status === 'pending');
      pendingTrainingApps = trainings.filter((t: any) => t.status === 'pending');
      submittedTaskApps = trainings.filter((t: any) => 
        (Array.isArray(t.tasks) && t.tasks.some((task: any) => task.submitted)) ||
        t.statusPostTest === 'submitted'
      );
      pendingActivityApps = activities.filter((a: any) => a.status === 'pending');
    }

    if (pendingMembers.length > 0) {
      items.push({
        id: `admin-pending-members-${pendingMembers.length}`,
        type: 'member',
        title: `${pendingMembers.length} Pendaftaran Anggota Baru`,
        message: `Terdapat ${pendingMembers.length} calon anggota menunggu verifikasi data dan penetapan NBM.`,
        timestamp: 'Perlu Verifikasi',
        link: '/admin?tab=pendaftaran',
        actionType: 'pendaftaran'
      });
    }

    if (membersWithUpgradeRequests.length > 0) {
      items.push({
        id: `admin-upgrade-requests-${membersWithUpgradeRequests.length}`,
        type: 'upgrade',
        title: `${membersWithUpgradeRequests.length} Pengajuan Upgrade Golongan`,
        message: `Ada ${membersWithUpgradeRequests.length} permohonan kenaikan tingkat/golongan yang perlu ditinjau.`,
        timestamp: 'Perlu Tindakan',
        link: '/admin?tab=upgrade',
        actionType: 'upgrade'
      });
    }

    if (pendingKtaApps.length > 0) {
      items.push({
        id: `admin-pending-kta-${pendingKtaApps.length}`,
        type: 'kta',
        title: `${pendingKtaApps.length} Pengajuan KTA Baru`,
        message: `Terdapat ${pendingKtaApps.length} pengajuan pencetakan Kartu Tanda Anggota menunggu persetujuan.`,
        timestamp: 'Antrean KTA',
        link: '/admin?tab=kta',
        actionType: 'kta'
      });
    }

    if (pendingTrainingApps.length > 0) {
      items.push({
        id: `admin-pending-training-${pendingTrainingApps.length}`,
        type: 'training',
        title: `${pendingTrainingApps.length} Pendaftaran Diklat Masuk`,
        message: `Pendaftaran Jaya Melati / Jaya Matahari baru menunggu konfirmasi administratif.`,
        timestamp: 'Diklat HW',
        link: '/admin?tab=pelatihan',
        actionType: 'pelatihan'
      });
    }

    if (submittedTaskApps.length > 0) {
      items.push({
        id: `admin-submitted-tasks-${submittedTaskApps.length}`,
        type: 'task',
        title: `${submittedTaskApps.length} Tugas Peserta Terkumpul`,
        message: `Laporan RTL / penugasan materi mandiri peserta siap dinilai oleh tim pelatih.`,
        timestamp: 'Penugasan Diklat',
        link: '/admin?tab=tugas',
        actionType: 'tugas'
      });
    }

    if (pendingActivityApps.length > 0) {
      items.push({
        id: `admin-pending-activities-${pendingActivityApps.length}`,
        type: 'general',
        title: `${pendingActivityApps.length} Pendaftaran Kegiatan Baru`,
        message: `Terdapat ${pendingActivityApps.length} peserta mendaftar kegiatan menunggu konfirmasi.`,
        timestamp: 'Kegiatan HW',
        link: '/admin?tab=kegiatan',
        actionType: 'kegiatan'
      });
    }
  }

  // 2. Member / Personal Notifications
  if (user) {
    const userEmail = (user.email || '').toLowerCase().trim();
    const userId = user.id || '';
    const userKta = (user.nomorKTA || user.nomorKta || user.ktaNumber || '').trim();

    // Check personal KTA applications
    const ktas = parseJsonSafe('kta_applications');
    const myKtaApp = ktas.find((k: any) => 
      (userId && k.memberId === userId) ||
      (userEmail && (k.email || '').toLowerCase().trim() === userEmail) ||
      (userKta && k.nomorKTA === userKta)
    );

    if (myKtaApp) {
      if (myKtaApp.status === 'approved' || myKtaApp.status === 'selesai') {
        items.push({
          id: `user-kta-approved-${myKtaApp.id || 'app'}`,
          type: 'kta',
          title: 'Pengajuan KTA Disetujui!',
          message: `KTA resmi Anda (${myKtaApp.nomorKTA || userKta || 'Tersedia'}) telah disetujui dan siap diunduh/cetak.`,
          timestamp: 'Disetujui',
          link: '/kta'
        });
      } else if (myKtaApp.status === 'pending') {
        items.push({
          id: `user-kta-pending-${myKtaApp.id || 'app'}`,
          type: 'kta',
          title: 'Pengajuan KTA Sedang Diproses',
          message: 'Permohonan penerbitan KTA Anda sedang dalam antrean verifikasi data oleh admin.',
          timestamp: 'Sedang Diproses',
          link: '/kta'
        });
      }
    } else if (userKta || user.isVerified) {
      items.push({
        id: 'user-kta-status-active',
        type: 'kta',
        title: 'KTA Resmi Telah Aktif',
        message: `Nomor KTA: ${userKta || '-'} aktif. Anda dapat mengunduh atau mencetak kartu anggota kapan saja.`,
        timestamp: 'Aktif',
        link: '/kta'
      });
    }

    // Check personal Training applications
    const trainings = parseJsonSafe('training_applications');
    const myTrainingApps = trainings.filter((t: any) => 
      (userId && t.memberId === userId) ||
      (userEmail && (t.email || '').toLowerCase().trim() === userEmail)
    );

    myTrainingApps.slice(0, 2).forEach((tApp: any) => {
      const actName = tApp.activityTitle || tApp.trainingName || 'Pelatihan Hizbul Wathan';
      const statusText = tApp.status === 'approved' ? 'Diterima' : tApp.status === 'rejected' ? 'Perlu Perbaikan' : 'Menunggu Konfirmasi';
      items.push({
        id: `user-training-${tApp.id || Math.random().toString(36).slice(2, 7)}`,
        type: 'training',
        title: `Status Diklat: ${actName}`,
        message: `Status pendaftaran pelatihan Anda: ${statusText}.`,
        timestamp: statusText,
        link: '/pelatihan'
      });
    });

    // Check personal Activity registrations
    const activities = parseJsonSafe('activity_applications');
    const myActApps = activities.filter((a: any) => 
      (userId && a.memberId === userId) ||
      (userEmail && (a.email || '').toLowerCase().trim() === userEmail)
    );

    myActApps.slice(0, 2).forEach((aApp: any) => {
      const actName = aApp.activityName || 'Kegiatan HW';
      items.push({
        id: `user-activity-${aApp.id || Math.random().toString(36).slice(2, 7)}`,
        type: 'general',
        title: `Pendaftaran: ${actName}`,
        message: `Anda terdaftar dalam kegiatan ${actName}. Status: ${aApp.status || 'Terdaftar'}.`,
        timestamp: 'Terdaftar',
        link: '/kegiatan'
      });
    });

    // Membership role status
    if (user.role && user.role !== 'umum') {
      items.push({
        id: `user-role-badge-${user.role}`,
        type: 'general',
        title: `Status Keanggotaan: ${user.tingkatan || user.role}`,
        message: 'Profil keanggotaan Anda telah diverifikasi resmi oleh Kwartir Wilayah HW Jawa Tengah.',
        timestamp: 'Tervalidasi',
        link: '/profile'
      });
    }

    // Welcome Notice
    items.push({
      id: 'welcome-info-portal',
      type: 'general',
      title: 'Selamat Datang di Satu HW Jateng',
      message: 'Sistem Super Apps Terintegrasi Kwartir Wilayah Hizbul Wathan Jawa Tengah.',
      timestamp: 'Satu HW',
      link: '/'
    });
  }

  // Attach read status
  return items.map(item => ({
    ...item,
    read: readIds.has(item.id)
  }));
}

export function calculateUnreadCount(options: {
  user: any;
  adminData?: {
    pendingMembers?: any[];
    pendingKtaApps?: any[];
    pendingTrainingApps?: any[];
    membersWithUpgradeRequests?: any[];
    submittedTaskApps?: any[];
  };
}): number {
  const notifications = buildAllNotifications(options);
  return notifications.filter(n => !n.read).length;
}

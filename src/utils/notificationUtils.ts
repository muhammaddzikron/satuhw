import { getMasterMembersList } from '../services/masterMembersService';

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

export function getReadNotificationIds(userEmailOrId?: string): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const set = new Set<string>();
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) parsed.forEach(id => set.add(String(id)));
    }
    if (userEmailOrId) {
      const safeKey = `hw_read_notifications_${String(userEmailOrId).replace(/[^a-zA-Z0-9]/g, '_')}`;
      const rawUser = localStorage.getItem(safeKey);
      if (rawUser) {
        const parsedUser = JSON.parse(rawUser);
        if (Array.isArray(parsedUser)) parsedUser.forEach(id => set.add(String(id)));
      }
    }
    return Array.from(set);
  } catch {
    return [];
  }
}

export function markNotificationAsRead(id: string, userEmailOrId?: string): void {
  if (typeof window === 'undefined' || !id) return;
  try {
    const current = getReadNotificationIds(userEmailOrId);
    if (!current.includes(id)) {
      const updated = [...current, id];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      if (userEmailOrId) {
        const safeKey = `hw_read_notifications_${String(userEmailOrId).replace(/[^a-zA-Z0-9]/g, '_')}`;
        localStorage.setItem(safeKey, JSON.stringify(updated));
      }
      window.dispatchEvent(new CustomEvent('notifications_read_updated', { detail: { id, userEmailOrId } }));
    }
  } catch (e) {
    console.error('Failed to save read notification:', e);
  }
}

export function markAllNotificationsAsRead(ids: string[], userEmailOrId?: string): void {
  if (typeof window === 'undefined' || !Array.isArray(ids) || ids.length === 0) return;
  try {
    const current = getReadNotificationIds(userEmailOrId);
    const updated = Array.from(new Set([...current, ...ids]));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    if (userEmailOrId) {
      const safeKey = `hw_read_notifications_${String(userEmailOrId).replace(/[^a-zA-Z0-9]/g, '_')}`;
      localStorage.setItem(safeKey, JSON.stringify(updated));
    }
    window.dispatchEvent(new CustomEvent('notifications_read_updated', { detail: { ids, userEmailOrId } }));
  } catch (e) {
    console.error('Failed to mark all notifications as read:', e);
  }
}

export function clearReadNotifications(userEmailOrId?: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEY);
    if (userEmailOrId) {
      const safeKey = `hw_read_notifications_${String(userEmailOrId).replace(/[^a-zA-Z0-9]/g, '_')}`;
      localStorage.removeItem(safeKey);
    }
    window.dispatchEvent(new CustomEvent('notifications_read_updated', { detail: { cleared: true } }));
  } catch (e) {
    console.error('Failed to clear read notifications:', e);
  }
}





export function isNotificationRead(id: string, readIds: Set<string>, user?: any): boolean {
  if (readIds.has(id)) return true;
  const userKey = (user?.email || user?.id || '').toLowerCase().trim();
  if (userKey && (readIds.has(`${id}-${userKey}`) || readIds.has(`${id}_${userKey}`))) return true;

  // Flexible matching for training notifications so they never reappear once opened
  if (id.startsWith('user-training-')) {
    if (userKey && (readIds.has(`user-training-${userKey}`) || readIds.has('user-training-all'))) {
      return true;
    }
    const baseId = id.replace(/-approved$|-rejected$|-pending$/, '');
    if (readIds.has(baseId)) return true;
    for (const rid of readIds) {
      if (rid === baseId || (rid.startsWith('user-training-') && (rid.includes(baseId) || id.includes(rid)))) {
        return true;
      }
    }
  }

  if (id.startsWith('admin-training-app-') || id.startsWith('admin-task-app-')) {
    if (readIds.has('admin-training-all') || readIds.has('admin-task-all')) {
      return true;
    }
    const cleanId = id.replace(/[^a-zA-Z0-9]/g, '-');
    for (const rid of readIds) {
      if (rid === cleanId || cleanId.includes(rid) || rid.includes(cleanId)) {
        return true;
      }
    }
  }

  return false;
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

function parseParticipantTasks(item: any): any[] {
  if (!item) return [];
  const raw = item.tugas || item.tasks;
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [parsed];
    } catch {
      return [];
    }
  }
  return [];
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
  const userKey = user?.email || user?.id || '';
  const readIds = new Set(getReadNotificationIds(userKey));

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
      // Fallback to local caches and master members list
      let members = parseJsonSafe('mock_members').length > 0 ? parseJsonSafe('mock_members') : parseJsonSafe('hw_members');
      try {
        const masterList = getMasterMembersList();
        if (members.length === 0) {
          members = masterList;
        } else {
          // Ensure any unverified member from master list (e.g. Fayyad Zaid) is included
          masterList.forEach(mm => {
            if (mm && (!mm.isVerified || mm.status === 'pending')) {
              const exists = members.some(m => m.id === mm.id || (m.email && mm.email && m.email.toLowerCase().trim() === mm.email.toLowerCase().trim()));
              if (!exists) members.push(mm);
            }
          });
        }
      } catch (e) {}

      let ktas = parseJsonSafe('kta_applications').length > 0 ? parseJsonSafe('kta_applications') : parseJsonSafe('hw_kta_applications');
      const trainings = parseJsonSafe('training_applications').length > 0 ? parseJsonSafe('training_applications') : parseJsonSafe('hw_training_applications');
      const activities = parseJsonSafe('activity_applications').length > 0 ? parseJsonSafe('activity_applications') : parseJsonSafe('hw_activity_applications');

      pendingMembers = members.filter((m: any) => {
        if (!m) return false;
        const name = (m.namaLengkap || m.nama || '').trim();
        if (!name || name === 'Tanpa Nama' || name === '-') return false;
        if (m.role === 'admin' || m.role === 'superadmin') return false;
        const s = (m.status || '').toString().toLowerCase().trim();
        return !m.isVerified || s === 'pending' || s === 'menunggu' || s === 'belum verifikasi';
      });

      membersWithUpgradeRequests = members.filter((m: any) => 
        m.statusUpgrade === 'pending' || 
        (Array.isArray(m.upgradeRequests) && m.upgradeRequests.length > 0)
      );

      pendingKtaApps = ktas.filter((k: any) => {
        if (!k) return false;
        const st = (k.status || '').toString().toLowerCase().trim();
        return st === 'pending' || st === 'menunggu' || st === 'diproses' || st === 'belum verifikasi' || st === '';
      });

      // Also ensure unverified members without KTA app are counted
      pendingMembers.forEach((pm: any) => {
        const pmEmail = (pm.email || '').toLowerCase().trim();
        const hasKta = pendingKtaApps.some((k: any) => 
          (k.userId && pm.id && String(k.userId) === String(pm.id)) ||
          (pmEmail && k.email && String(k.email).toLowerCase().trim() === pmEmail)
        );
        if (!hasKta) {
          const fallbackKtaId = pm.id || (pm.email ? pm.email.toLowerCase().replace(/[^a-z0-9]/g, '_') : (pm.namaLengkap || pm.nama || 'calon').toLowerCase().replace(/[^a-z0-9]/g, '_'));
          pendingKtaApps.push({
            id: `kta-${fallbackKtaId}`,
            userId: pm.id,
            nama: pm.namaLengkap || pm.nama,
            email: pm.email,
            noWa: pm.noHp || pm.noWa || '',
            asalDaerah: pm.asalKwarda || '',
            tingkatan: pm.golongan || 'Dewasa',
            status: 'pending'
          });
        }
      });

      pendingTrainingApps = trainings.filter((t: any) => {
        const s = (t.status || '').toString().toLowerCase().trim();
        return s === 'pending' || s === 'menunggu' || s === 'diproses';
      });

      submittedTaskApps = trainings.filter((t: any) => {
        const tasks = parseParticipantTasks(t);
        const hasUngradedTask = tasks.some((task: any) => {
          const isSubmitted = task.submitted || task.status === 'submitted';
          const isGraded = task.status === 'graded' || (task.nilai !== undefined && task.nilai !== null && task.nilai !== '' && Number(task.nilai) > 0);
          return isSubmitted && !isGraded;
        });
        const hasUngradedPostTest = t.statusPostTest === 'submitted' && (t.postTestScore === undefined || t.postTestScore === null || t.postTestScore === '');
        return hasUngradedTask || hasUngradedPostTest;
      });
      pendingActivityApps = activities.filter((a: any) => a.status === 'pending');
    }

    // 1. Pending Members (Individual itemized with stable IDs)
    pendingMembers.slice(0, 15).forEach((m: any) => {
      const name = m.namaLengkap || m.nama || 'Calon Anggota';
      const daerah = m.asalKwarda || m.asalDaerah || m.qabilah || 'Jawa Tengah';
      const safeId = m.id || m.email || name;
      items.push({
        id: `admin-mem-app-${safeId}`,
        type: 'member',
        title: `Pendaftar Baru: ${name}`,
        message: `${name} (${daerah}) telah mendaftar dan menunggu verifikasi data admin.`,
        timestamp: 'Pendaftaran Anggota',
        link: `/admin?tab=pendaftaran&search=${encodeURIComponent(name)}`,
        actionType: 'pendaftaran'
      });
    });

    // 2. Upgrade Requests
    membersWithUpgradeRequests.slice(0, 15).forEach((m: any) => {
      const name = m.namaLengkap || m.nama || 'Anggota';
      const safeId = m.id || m.email || name;
      items.push({
        id: `admin-upgrade-app-${safeId}`,
        type: 'upgrade',
        title: `Pengajuan Upgrade: ${name}`,
        message: `${name} mengajukan permohonan kenaikan tingkat/golongan yang perlu ditinjau.`,
        timestamp: 'Kenaikan Tingkat',
        link: `/admin?tab=upgrade&search=${encodeURIComponent(name)}`,
        actionType: 'upgrade'
      });
    });

    // 3. Pending KTA Applications
    pendingKtaApps.slice(0, 15).forEach((app: any) => {
      const applicantName = app.nama || app.namaLengkap || 'Calon Anggota';
      const kwarda = app.asalDaerah || app.asalKwarda || app.qabilah || 'Jawa Tengah';
      const safeId = app.id || app.userId || app.email || applicantName;
      items.push({
        id: `admin-kta-app-${safeId}`,
        type: 'kta',
        title: `Pengajuan KTA: ${applicantName}`,
        message: `Pengajuan KTA oleh ${applicantName} (${kwarda}) siap untuk ditinjau dan disetujui.`,
        timestamp: 'Antrean KTA',
        link: `/admin?tab=kta&subtab=summary&search=${encodeURIComponent(applicantName)}`,
        actionType: 'kta'
      });
    });

    // 4. Pending Training Applications
    pendingTrainingApps.slice(0, 15).forEach((t: any) => {
      const name = t.nama || t.namaLengkap || 'Peserta';
      const trainingName = t.pelatihanAkanDiikuti || t.trainingName || 'Diklat HW';
      const safeId = t.id || t.email || name;
      items.push({
        id: `admin-training-app-${safeId}`,
        type: 'training',
        title: `Pendaftaran Diklat: ${name}`,
        message: `Pendaftaran ${trainingName} oleh ${name} menunggu konfirmasi administratif.`,
        timestamp: 'Diklat HW',
        link: `/admin?tab=pelatihan&search=${encodeURIComponent(name)}`,
        actionType: 'pelatihan'
      });
    });

    // 5. Submitted Tasks
    submittedTaskApps.slice(0, 15).forEach((t: any) => {
      const name = t.nama || t.namaLengkap || 'Peserta';
      const safeId = t.id || t.email || name;
      items.push({
        id: `admin-task-app-${safeId}`,
        type: 'task',
        title: `Tugas Terkumpul: ${name}`,
        message: `Laporan RTL / penugasan materi mandiri peserta ${name} siap dinilai.`,
        timestamp: 'Penugasan Diklat',
        link: `/admin?tab=tugas&search=${encodeURIComponent(name)}`,
        actionType: 'tugas'
      });
    });

    // 6. Pending Activities
    pendingActivityApps.slice(0, 15).forEach((a: any) => {
      const name = a.nama || a.namaLengkap || 'Peserta';
      const act = a.activityTitle || a.namaKegiatan || 'Kegiatan HW';
      const safeId = a.id || a.email || name;
      items.push({
        id: `admin-activity-app-${safeId}`,
        type: 'general',
        title: `Pendaftaran Kegiatan: ${name}`,
        message: `Peserta ${name} mendaftar kegiatan ${act} menunggu konfirmasi.`,
        timestamp: 'Kegiatan HW',
        link: `/admin?tab=kegiatan&search=${encodeURIComponent(name)}`,
        actionType: 'kegiatan'
      });
    });
  }

  // 2. Member / Personal Notifications (Only genuinely new status updates)
  if (user) {
    const userEmail = (user.email || '').toLowerCase().trim();
    const userId = user.id || '';
    const userKta = (user.nomorKTA || user.nomorKta || user.ktaNumber || '').trim();

    // Check personal KTA applications - only notify when approved/finished
    const ktas = parseJsonSafe('kta_applications');
    const myKtaApp = ktas.find((k: any) => 
      (userId && k.memberId === userId) ||
      (userEmail && (k.email || '').toLowerCase().trim() === userEmail) ||
      (userKta && k.nomorKTA === userKta)
    );

    if (myKtaApp && (myKtaApp.status === 'approved' || myKtaApp.status === 'selesai')) {
      items.push({
        id: `user-kta-approved-${myKtaApp.id || myKtaApp.nomorKTA || 'kta'}`,
        type: 'kta',
        title: 'Pengajuan KTA Disetujui!',
        message: `KTA resmi Anda (${myKtaApp.nomorKTA || userKta || 'Tersedia'}) telah disetujui dan siap diunduh/cetak.`,
        timestamp: 'Disetujui',
        link: '/kta'
      });
    }

    // Check personal Training applications - only notify on approval / rejection update
    const trainings = parseJsonSafe('training_applications');
    const myTrainingApps = trainings.filter((t: any) => 
      (userId && t.memberId === userId) ||
      (userEmail && (t.email || '').toLowerCase().trim() === userEmail)
    );

    myTrainingApps.forEach((tApp: any) => {
      if (tApp.status === 'approved' || tApp.status === 'rejected') {
        const actName = tApp.activityTitle || tApp.trainingName || tApp.pelatihanAkanDiikuti || tApp.namaKegiatan || 'Pelatihan Hizbul Wathan';
        const statusText = tApp.status === 'approved' ? 'Diterima' : 'Perlu Perbaikan';
        const rawId = tApp.id || tApp.activityId || actName;
        const safeId = String(rawId).replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
        items.push({
          id: `user-training-${safeId}-${tApp.status}`,
          type: 'training',
          title: `Status Diklat: ${actName}`,
          message: `Status pendaftaran pelatihan Anda telah ${statusText}.`,
          timestamp: statusText,
          link: '/pelatihan'
        });
      }
    });
  }

  // Attach read status
  return items.map(item => ({
    ...item,
    read: isNotificationRead(item.id, readIds, user)
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

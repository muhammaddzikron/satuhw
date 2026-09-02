import { safeStorageSet, safeStorageGet } from '../utils/safeStorage';
import axios from 'axios';
import { User, Materi, Content, UserRole } from '../types';
import { INITIAL_SPREADSHEET_DATA } from './initialSpreadsheetData';
import { firestoreService, parseRolesField, applyMemberOverrides, applyMemberListOverrides, clearFirestoreCache } from './firestoreService';
import { getMasterMembersList } from './masterMembersService';
import { ensureUniqueKtaNumbers } from '../utils/ktaUtils';
import { toProperName, sanitizeMemberList } from '../utils/nameUtils';
import { pickValidImageUrl, normalizeDateForInput } from '../lib/utils';
import { DEFAULT_LOCAL_KTA_FRONT, DEFAULT_LOCAL_KTA_BACK, getSafeKtaFront, getSafeKtaBack } from '../assets/ktaTemplates';
import { DEFAULT_TRAINING_TYPES, DEFAULT_UPGRADE_FEES, normalizeTrainingKey, syncRolesAndPelatihan, consolidateTrainingApplications, DEFAULT_JM1_SOLO_ACTIVITY, migrateParticipantToJayaMelati1Solo } from '../utils/trainingUtils';
import { sortActivitiesNewestFirst, extractYoutubeId } from '../utils/activityUtils';
import { 
  parseTestScheduleSettings, 
  DEFAULT_PRE_TEST_SETTINGS, 
  DEFAULT_POST_TEST_SETTINGS, 
  DEFAULT_50_QUESTIONS 
} from '../data/trainingQuestions';

export let API_URL = (typeof import.meta !== 'undefined' && import.meta.env) ? import.meta.env.VITE_GSHEET_API_URL : '';
export let IS_API_VALID = !!(API_URL && API_URL !== 'undefined' && API_URL.startsWith('http'));

export const updateApiUrlFromStorage = () => {
  let url = (typeof import.meta !== 'undefined' && import.meta.env) ? import.meta.env.VITE_GSHEET_API_URL : '';
  if (typeof window !== 'undefined' && (!url || url === 'undefined' || !url.startsWith('http'))) {
    url = localStorage.getItem('VITE_GSHEET_API_URL') || '';
  }
  API_URL = url;
  IS_API_VALID = !!(API_URL && API_URL !== 'undefined' && API_URL.startsWith('http'));
};

// Run on load
updateApiUrlFromStorage();

if (!IS_API_VALID) {
  console.log('[SHEETS SERVICE] API_URL is invalid or missing:', API_URL);
} else {
  console.log('[SHEETS SERVICE] API_URL is active:', API_URL.substring(0, 30) + '...');
}

// In-Memory Cache and In-flight Promise Deduplication for ultra-fast response
interface CacheItem<T> {
  data: T;
  timestamp: number;
}
const MEMORY_CACHE = new Map<string, CacheItem<any>>();
const IN_FLIGHT_PROMISES = new Map<string, Promise<any>>();
const DEFAULT_CACHE_TTL = 20000; // 20s TTL

export const clearSheetsCache = (keyPrefix?: string) => {
  if (!keyPrefix) {
    MEMORY_CACHE.clear();
  } else {
    for (const key of MEMORY_CACHE.keys()) {
      if (key.startsWith(keyPrefix)) MEMORY_CACHE.delete(key);
    }
  }
};

const cachedFetch = async <T>(cacheKey: string, fetchFn: () => Promise<T>, ttl: number = DEFAULT_CACHE_TTL): Promise<T> => {
  const cached = MEMORY_CACHE.get(cacheKey);
  const now = Date.now();
  if (cached && (now - cached.timestamp < ttl)) {
    return cached.data;
  }

  const inFlight = IN_FLIGHT_PROMISES.get(cacheKey);
  if (inFlight) {
    return inFlight;
  }

  const promise = (async () => {
    try {
      const data = await fetchFn();
      MEMORY_CACHE.set(cacheKey, { data, timestamp: Date.now() });
      return data;
    } finally {
      IN_FLIGHT_PROMISES.delete(cacheKey);
    }
  })();

  IN_FLIGHT_PROMISES.set(cacheKey, promise);
  return promise;
};


export const DEFAULT_KTA_TEMPLATE_FRONT = 'https://drive.google.com/uc?export=view&id=1OsI7x7zw-2BbckWntz_jkpGZyY94Z-7U';
export const DEFAULT_KTA_TEMPLATE_BACK = 'https://drive.google.com/uc?export=view&id=1yeEeoE_SlV0npvu681GYKBxxKzuujiz1';

// Initialize mock data on load if not present and trigger Firestore sync
export const initMockData = () => {
  if (typeof window === 'undefined') return;

  // Sync and backup with Firestore on boot
  firestoreService.initAndSyncWithFirestore().then((res) => {
    if (res.success) {
      console.log('[FIRESTORE] Sync status:', res.message);
    } else {
      console.warn('[FIRESTORE] Cache active:', res.message);
    }
  }).catch((err) => {
    console.warn('[FIRESTORE] Sync status:', err?.message || err);
  });
  
  try {
    const masterMembers = getMasterMembersList();
    const existingStored = localStorage.getItem('mock_members');
    let currentList: any[] = [];

    if (existingStored) {
      try {
        currentList = JSON.parse(existingStored);
      } catch (e) {}
    }

    if (Array.isArray(currentList) && currentList.length > 0) {
      // currentList has existing members with user changes.
      // Append any master member not yet present in currentList
      masterMembers.forEach(mm => {
        if (!mm) return;
        const mmId = mm.id ? String(mm.id) : '';
        const mmEmail = mm.email ? mm.email.toLowerCase().trim() : '';
        const mmKta = (mm.ktaNumber || mm.nomorKTA || '').trim().toLowerCase();
        const mmPhone = mm.noHp ? String(mm.noHp).replace(/[^0-9]/g, '') : '';

        const exists = currentList.some(cm => {
          if (!cm) return false;
          const cmId = cm.id ? String(cm.id) : '';
          const cmEmail = cm.email ? cm.email.toLowerCase().trim() : '';
          const cmKta = (cm.ktaNumber || cm.nomorKTA || '').trim().toLowerCase();
          const cmPhone = cm.noHp ? String(cm.noHp).replace(/[^0-9]/g, '') : '';

          return (
            (mmId && cmId && mmId === cmId) ||
            (mmEmail && cmEmail && mmEmail === cmEmail) ||
            (mmKta && cmKta && mmKta === cmKta) ||
            (mmPhone && cmPhone && mmPhone.length > 6 && mmPhone === cmPhone)
          );
        });

        if (!exists) {
          currentList.push(mm);
        }
      });
      safeStorageSet('mock_members', currentList);
    } else {
      safeStorageSet('mock_members', masterMembers);
    }
    safeStorageSet('mock_members_initialized', 'true');
  } catch (e) {
    console.error('initMockData error:', e);
  }

  if (!localStorage.getItem('materi_initialized') || !localStorage.getItem('materi')) {
    const parsedMateri = INITIAL_SPREADSHEET_DATA.materi.map((m: any, idx: number) => {
      return {
        id: m.id || `materi-${1000 + idx}`,
        judul: m.judul || '',
        konten: m.konten || '',
        kategori: m.kategori || 'umum',
        tanggal: m.tanggal || new Date().toISOString(),
        coverImage: m.coverImage || m.coverimage || 'https://upload.wikimedia.org/wikipedia/id/b/ba/Logo_Hizbul_Wathan.png',
        driveUrl: m.driveUrl || m.driveurl || '',
        linkExternal: m.linkExternal || m.linkexternal || ''
      };
    });
    safeStorageSet('materi', parsedMateri);
    safeStorageSet('materi_initialized', 'true');
  }

  if (!localStorage.getItem('contents_initialized') || !localStorage.getItem('contents')) {
    safeStorageSet('contents', INITIAL_SPREADSHEET_DATA.contents || []);
    safeStorageSet('contents_initialized', 'true');
  }

  if (!localStorage.getItem('kta_applications_initialized') || !localStorage.getItem('kta_applications')) {
    safeStorageSet('kta_applications', []);
    safeStorageSet('kta_applications_initialized', 'true');
  } else {
    try {
      const stored = localStorage.getItem('kta_applications');
      if (stored) {
        const parsed = JSON.parse(stored);
        // Clean out invalid old dummy records (e.g. items missing 'nama' or 'status')
        const valid = parsed.filter((k: any) => k && (k.nama || k.namaLengkap) && (k.status === 'pending' || k.status === 'approved' || k.status === 'rejected') && k.tingkatan);
        if (valid.length !== parsed.length) {
          safeStorageSet('kta_applications', valid);
        }
      }
    } catch (e) {
      console.error('Repair kta_applications error:', e);
    }
  }

  if (!localStorage.getItem('training_applications_initialized') || !localStorage.getItem('training_applications')) {
    safeStorageSet('training_applications', []);
    safeStorageSet('training_applications_initialized', 'true');
  } else {
    try {
      const stored = localStorage.getItem('training_applications');
      if (stored) {
        const parsed = JSON.parse(stored);
        let changed = false;
        const repaired = parsed.map((t: any, idx: number) => {
          if (!t.id) {
            changed = true;
            return { ...t, id: `training-repaired-${1000 + idx}` };
          }
          return t;
        });
        if (changed) {
          safeStorageSet('training_applications', repaired);
        }
      }
    } catch (e) {
      console.error('Repair training_applications error:', e);
    }
  }
};

initMockData();

export const sheetsService = {
  updateApiUrlFromStorage() {
    updateApiUrlFromStorage();
    return IS_API_VALID;
  },
  async login(email: string, password: string): Promise<{ user: User; token: string }> {
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanPass = (password || '').trim();

    // Medkom admin credential override
    if ((cleanEmail === 'medkom' || cleanEmail === 'medkom@hwjateng.com' || cleanEmail === 'user medkom') &&
        (cleanPass === '12345hwhw' || cleanPass === '12345hw' || cleanPass === 'medkom@hwjateng.com100%')) {
      const medkomUser: User = {
        id: '1777209184010',
        email: 'medkom@hwjateng.com',
        namaLengkap: 'User medkom',
        role: 'admin',
        roles: ['admin'],
        activeRole: 'admin',
        jenisKelamin: 'P',
        golongan: 'Pengenal',
        pelatihan: ['Jati 1', 'Jati 2'],
        pendidikan: 'S1',
        asalKwarda: 'Kebumen',
        qabilah: 'Medkom',
        alamat: 'Kebumen',
        noHp: '081286854000',
        sosmed: '@medkomhwjateng',
        isVerified: true,
        password: '12345hwhw'
      };
      firestoreService.saveMember(medkomUser).catch(() => {});
      return {
        token: 'medkom-admin-token',
        user: medkomUser
      };
    }

    // Admin Diklat credential override
    if ((cleanEmail === 'diklat' || cleanEmail === 'diklat@hwjateng.com' || cleanEmail === 'admin diklat') &&
        (cleanPass === 'didiklatjtg')) {
      const diklatUser: User = {
        id: 'admin-diklat-1',
        email: 'diklat@hwjateng.com',
        namaLengkap: 'Admin Diklat HW',
        role: 'admin',
        roles: ['admin', 'diklat'],
        activeRole: 'admin',
        adminType: 'diklat',
        jenisKelamin: 'L',
        golongan: 'Pembina',
        pelatihan: ['Jati 3'],
        pendidikan: 'S1',
        asalKwarda: 'Pusdiklat',
        qabilah: 'Diklat HW Jateng',
        alamat: 'Pusdiklat HW Jateng',
        noHp: '081234567890',
        sosmed: '@diklathwjateng',
        isVerified: true,
        password: 'didiklatjtg'
      };
      firestoreService.saveMember(diklatUser).catch(() => {});
      return {
        token: 'diklat-admin-token',
        user: diklatUser
      };
    }

    // Add special check for super admin as requested
    if ((cleanEmail === 'admin' || cleanEmail === 'admin@hw.org') && (cleanPass === 'adnimku' || cleanPass === 'admin')) {
      const adminUser: User = {
        id: 'super-admin',
        email: 'admin@hw.org',
        namaLengkap: 'Super Admin HW',
        role: 'superadmin',
        roles: ['superadmin', 'admin', 'kwarda', 'sugli', 'umum'],
        activeRole: 'superadmin',
        jenisKelamin: 'L',
        golongan: 'Pembina',
        pelatihan: ['Jati 3'],
        pendidikan: 'S1',
        asalKwarda: 'Pusat',
        qabilah: 'Pusat',
        alamat: 'Jakarta',
        noHp: '08000000000',
        sosmed: '@hw_pusat',
        isVerified: true
      };
      // Non-blocking background save
      firestoreService.saveMember(adminUser).catch(() => {});
      return {
        token: 'super-admin-token',
        user: adminUser
      };
    }

    // 1. If online Google Sheets API is configured, query spreadsheet first with 3.5s timeout for latest data
    if (IS_API_VALID) {
      try {
        const apiPromise = this.post({
          action: 'login',
          email: cleanEmail,
          password: cleanPass
        });
        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('API Timeout')), 3500));
        const res: any = await Promise.race([apiPromise, timeoutPromise]);
        if (res && res.user) {
          const mappedUser = this.mapUser(res.user);
          let finalUser = { ...mappedUser };
          // Sync into localStorage & Firestore
          try {
            // Check custom overrides
            const storedOvStr = localStorage.getItem('member_custom_edits');
            let customOverrides: Record<string, any> = {};
            if (storedOvStr) {
              try { customOverrides = JSON.parse(storedOvStr); } catch(e) {}
            }
            const mId = finalUser.id ? String(finalUser.id) : '';
            const mEmail = finalUser.email ? finalUser.email.toLowerCase().trim() : '';
            const mKta = (finalUser.ktaNumber || finalUser.nomorKTA || '').trim();
            const mPhone = finalUser.noHp ? String(finalUser.noHp).replace(/[^0-9]/g, '') : '';
            const ov = customOverrides[mId] || (mEmail ? customOverrides[mEmail] : null) || (mKta ? customOverrides[mKta] : null) || (mPhone && mPhone.length > 6 ? customOverrides[mPhone] : null);
            if (ov) {
              finalUser = { ...finalUser, ...ov };
            }

            const rawRoles = parseRolesField(finalUser.roles, finalUser.role);
            const synced = syncRolesAndPelatihan(rawRoles, finalUser.pelatihan);
            finalUser.roles = synced.roles;
            finalUser.role = synced.primaryRole as UserRole;
            finalUser.pelatihan = synced.pelatihan;
            finalUser.activeRole = (finalUser.activeRole || synced.primaryRole) as UserRole;

            const stored = localStorage.getItem('mock_members');
            let parsed = stored ? JSON.parse(stored) : [];
            if (Array.isArray(parsed)) {
              const idx = parsed.findIndex((m: any) => 
                (finalUser.id && m.id === finalUser.id) ||
                (finalUser.email && m.email?.toLowerCase() === finalUser.email.toLowerCase())
              );
              if (idx >= 0) {
                const ex = parsed[idx];
                finalUser = {
                  ...ex,
                  ...finalUser,
                  namaLengkap: (finalUser.namaLengkap && finalUser.namaLengkap !== 'Tanpa Nama' && finalUser.namaLengkap !== '-') ? finalUser.namaLengkap : (ex.namaLengkap || 'Anggota HW'),
                  photo: finalUser.photo || ex.photo || '',
                  noHp: finalUser.noHp || ex.noHp || '',
                  alamat: finalUser.alamat || ex.alamat || '',
                  qabilah: finalUser.qabilah || ex.qabilah || '',
                  asalKwarda: finalUser.asalKwarda || ex.asalKwarda || '',
                  tempatLahir: finalUser.tempatLahir || ex.tempatLahir || '',
                  tanggalLahir: finalUser.tanggalLahir || ex.tanggalLahir || '',
                  golongan: finalUser.golongan || ex.golongan || 'Dewasa',
                  golonganPelatih: finalUser.golonganPelatih || ex.golonganPelatih || '',
                  pelatihan: synced.pelatihan,
                  roles: synced.roles,
                  role: synced.primaryRole,
                  ktaNumber: finalUser.ktaNumber || ex.ktaNumber || finalUser.nomorKTA || ex.nomorKTA || '',
                };
                parsed[idx] = finalUser;
              } else {
                parsed.push(finalUser);
              }
              safeStorageSet('mock_members', parsed);
            }
          } catch (e) {}
          firestoreService.saveMember(finalUser).catch(() => {});
          return {
            token: res.token || `token-${finalUser.id}`,
            user: finalUser
          };
        }
      } catch (error: any) {
        console.warn('Google Sheets login API call error or timeout, proceeding to Firestore/local cache:', error?.message || error);
      }
    }

    // 2. Try Firestore with 1.8s timeout limit
    try {
      const fsPromise = firestoreService.login(cleanEmail, cleanPass);
      const fsTimeout = new Promise<null>((_, reject) => setTimeout(() => reject(new Error('FS Timeout')), 1800));
      const fsResult: any = await Promise.race([fsPromise, fsTimeout]).catch(() => null);
      if (fsResult && fsResult.user) {
        // Sync into localStorage
        try {
          const stored = localStorage.getItem('mock_members');
          let parsed = stored ? JSON.parse(stored) : [];
          if (Array.isArray(parsed)) {
            const idx = parsed.findIndex((m: any) => 
              (fsResult.user.id && m.id === fsResult.user.id) ||
              (fsResult.user.email && m.email?.toLowerCase() === fsResult.user.email.toLowerCase())
            );
            if (idx >= 0) {
              parsed[idx] = { ...parsed[idx], ...fsResult.user };
            } else {
              parsed.push(fsResult.user);
            }
            safeStorageSet('mock_members', parsed);
          }
        } catch (e) {}
        return fsResult;
      }
    } catch (e) {
      console.warn('Firestore login check skipped or timed out:', e);
    }

    // 3. Fallback to Local Cache Login
    try {
      const localResult = this.mockLogin(cleanEmail, cleanPass);
      if (localResult && localResult.user) {
        return localResult;
      }
    } catch (e: any) {
      if (e.message?.includes('salah')) {
        throw e;
      }
    }

    throw new Error('Email atau password salah.');
  },

  mapUser(data: any): User {
    if (!data) return {} as User;

    // Helper to safely extract field values from varied Google Sheet column headers
    const getVal = (keys: string[]): string => {
      for (const k of keys) {
        if (data[k] !== undefined && data[k] !== null && String(data[k]).trim() !== '') {
          return String(data[k]).trim();
        }
      }
      // Case-insensitive & clean search fallback
      const rawKeys = Object.keys(data);
      for (const target of keys) {
        const cleanTarget = target.toLowerCase().replace(/[^a-z0-9]/g, '');
        const matchedKey = rawKeys.find(rk => rk.toLowerCase().replace(/[^a-z0-9]/g, '') === cleanTarget);
        if (matchedKey && data[matchedKey] !== undefined && data[matchedKey] !== null && String(data[matchedKey]).trim() !== '') {
          return String(data[matchedKey]).trim();
        }
      }
      return '';
    };

    // Helper to safely parse array-like fields from backend (might be JSON string, comma-separated string, or already an array)
    const parseArrayField = (val: any): any[] => {
      if (!val) return [];
      if (Array.isArray(val)) return val;
      if (typeof val !== 'string') return [val];
      
      const trimmed = val.trim();
      if (!trimmed) return [];
      
      if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
        try {
          return JSON.parse(trimmed);
        } catch (e) {
          // ignore error
        }
      }
      return trimmed.split(',').map(s => s.trim()).filter(Boolean);
    };

    const idValue = getVal(['id', 'Id', 'userId', 'userid']);
    const emailValue = getVal(['email', 'Email', 'EMAIL', 'alamatEmail', 'alamat_email', 'Alamat Email', 'E-mail']);
    const namaValue = getVal(['namaLengkap', 'namalengkap', 'nama', 'Nama', 'nama_lengkap', 'Nama Lengkap', 'NAMA LENGKAP', 'FullName', 'Full Name', 'Nama Peserta']);
    const ktaValue = getVal(['ktaNumber', 'ktanumber', 'noKta', 'nokta', 'nomorKTA', 'nbm', 'Nomor KTA', 'No KTA', 'No. KTA', 'NBM', 'No Kta', 'KTA', 'No_KTA']);
    const phoneValue = getVal(['noHp', 'nohp', 'noWa', 'nowa', 'phone', 'Phone', 'telepon', 'whatsapp', 'No HP', 'No. HP', 'No WA', 'No WhatsApp', 'Nomor WhatsApp', 'No Handphone', 'Kontak']);
    const kwardaValue = getVal(['asalKwarda', 'asalkwarda', 'kwarda', 'Kwarda', 'asalDaerah', 'asaldaerah', 'daerah', 'Asal Daerah', 'Asal Kwarda', 'Kwarcab', 'Cabang', 'Kwarda / Kwarcab']);
    const qabilahValue = getVal(['qabilah', 'Qabilah', 'pangkalan', 'Pangkalan', 'gudep', 'Gudep', 'Gugus Depan', 'Qabilah / Pangkalan']);
    const alamatValue = getVal(['alamat', 'Alamat', 'domisili', 'Domisili', 'Alamat Lengkap', 'Alamat Domisili']);
    const tempatLahirValue = getVal(['tempatLahir', 'tempatlahir', 'tempat_lahir', 'Tempat Lahir', 'Tempat_Lahir', 'Kota Kelahiran']);
    const tanggalLahirValue = getVal(['tanggalLahir', 'tanggallahir', 'tanggal_lahir', 'Tanggal Lahir', 'Tanggal_Lahir', 'Tgl Lahir']);
    const genderValue = getVal(['jenisKelamin', 'jeniskelamin', 'gender', 'Gender', 'jk', 'JK', 'Jenis Kelamin']);
    const golonganValue = getVal(['golongan', 'Golongan', 'tingkatan', 'Tingkatan', 'jenjang', 'Jenjang']);
    const golonganPelatihValue = getVal(['golonganPelatih', 'golonganpelatih', 'Golongan Pelatih', 'Pelatih Golongan']);
    const pendidikanValue = getVal(['pendidikan', 'Pendidikan', 'Pendidikan Terakhir', 'Tingkat Pendidikan']);
    const sosmedValue = getVal(['sosmed', 'Sosmed', 'instagram', 'Instagram', 'Media Sosial', 'Akun Sosmed']);
    const photoValue = getVal(['photo', 'foto', 'Photo', 'Foto', 'photoUrl', 'image', 'Image', 'Foto Profil', 'Photo URL']);

    const stableId = idValue ? String(idValue) : (emailValue ? `user-${emailValue.toLowerCase().replace(/[^a-zA-Z0-9]/g, '_')}` : (phoneValue ? `user-${phoneValue.replace(/[^0-9]/g, '')}` : `user-${Date.now()}`));

    const rawVerified = data.isVerified !== undefined ? data.isVerified : data.isverified;
    const isVerified = rawVerified === true || rawVerified === 'true' || rawVerified === 1 || rawVerified === '1';

    const properName = toProperName(namaValue);
    const user: User = {
      id: stableId,
      email: emailValue,
      namaLengkap: properName || 'Anggota HW',
      jenisKelamin: (genderValue.toUpperCase().startsWith('P') || genderValue.toLowerCase() === 'perempuan') ? 'P' : 'L',
      golongan: golonganValue || 'Dewasa',
      golonganPelatih: golonganPelatihValue,
      pelatihan: parseArrayField(getVal(['pelatihan', 'Pelatihan', 'pelatihanAkanDiikuti', 'pelatihanakandiikuti', 'tingkatPelatihan'])),
      pendidikan: pendidikanValue,
      asalKwarda: kwardaValue,
      qabilah: qabilahValue,
      alamat: alamatValue,
      tempatLahir: tempatLahirValue,
      tanggalLahir: tanggalLahirValue,
      noHp: phoneValue,
      sosmed: sosmedValue,
      role: 'umum' as UserRole,
      roles: [] as UserRole[],
      activeRole: 'umum' as UserRole,
      isVerified: isVerified,
      ktaNumber: ktaValue,
      upgradeRequests: parseArrayField(getVal(['upgradeRequests', 'upgraderequests'])),
      photo: photoValue,
      password: data.password || ''
    };

    const rawRoleFromHeaders = getVal(['roles', 'Roles', 'role', 'Role', 'ROLE', 'ROLES', 'hakAkses', 'hak_akses', 'Hak Akses']);
    const rolesArr = parseRolesField(data.roles || rawRoleFromHeaders, data.role || rawRoleFromHeaders);
    const synced = syncRolesAndPelatihan(rolesArr, user.pelatihan);

    user.roles = (synced.roles && synced.roles.length > 0 ? synced.roles : ['umum']) as UserRole[];
    user.role = (synced.primaryRole || 'umum') as UserRole;
    user.pelatihan = synced.pelatihan;
    user.activeRole = (data.activeRole || synced.primaryRole || 'umum') as UserRole;
    
    return user;
  },

  mockLogin(emailOrId: string, password: string): { user: User; token: string } {
    const cleanInput = (emailOrId || '').trim().toLowerCase();
    const cleanPass = (password || '').trim();
    const cleanDigits = cleanInput.replace(/[^0-9]/g, '');

    if ((cleanInput === 'diklat' || cleanInput === 'diklat@hwjateng.com' || cleanInput === 'admin diklat') &&
        (cleanPass === 'didiklatjtg')) {
      const diklatUser: User = {
        id: 'admin-diklat-1',
        email: 'diklat@hwjateng.com',
        namaLengkap: 'Admin Diklat HW',
        role: 'admin',
        roles: ['admin', 'diklat'],
        activeRole: 'admin',
        adminType: 'diklat',
        jenisKelamin: 'L',
        golongan: 'Pembina',
        pelatihan: ['Jati 3'],
        pendidikan: 'S1',
        asalKwarda: 'Pusdiklat',
        qabilah: 'Diklat HW Jateng',
        alamat: 'Pusdiklat HW Jateng',
        noHp: '081234567890',
        sosmed: '@diklathwjateng',
        isVerified: true,
        password: 'didiklatjtg'
      };
      return {
        token: 'diklat-admin-token',
        user: diklatUser
      };
    }

    // Check in localStorage mock members database first
    const stored = localStorage.getItem('mock_members');
    let members: any[] = [];
    if (stored) {
      try {
        members = JSON.parse(stored);
      } catch (e) {}
    }

    // Always merge master members list if not present
    try {
      const masterList = getMasterMembersList();
      masterList.forEach((mm: any) => {
        if (!mm) return;
        const mmEmail = mm.email ? mm.email.trim().toLowerCase() : '';
        const mmKta = (mm.ktaNumber || mm.nomorKTA || '').trim();
        const mmId = mm.id ? String(mm.id) : '';

        const existingIdx = members.findIndex((m: any) => {
          if (!m) return false;
          const mEmail = m.email ? m.email.trim().toLowerCase() : '';
          const mKta = (m.ktaNumber || m.nomorKTA || '').trim();
          const mId = m.id ? String(m.id) : '';
          return (
            (mmEmail && mEmail && mmEmail === mEmail) ||
            (mmKta && mKta && mmKta === mKta) ||
            (mmId && mId && mmId === mId)
          );
        });

        if (existingIdx === -1) {
          members.push(mm);
        } else {
          // Keep best KTA and data
          const ex = members[existingIdx];
          members[existingIdx] = {
            ...mm,
            ...ex,
            ktaNumber: ex.ktaNumber || mm.ktaNumber || ex.nomorKTA || mm.nomorKTA,
            nomorKTA: ex.nomorKTA || mm.nomorKTA || ex.ktaNumber || mm.ktaNumber
          };
        }
      });
    } catch (e) {}

    // Check KTA applications as well
    const ktaStored = localStorage.getItem('kta_applications');
    if (ktaStored) {
      try {
        const ktas = JSON.parse(ktaStored);
        ktas.forEach((k: any) => {
          if (k.email && !members.some((m: any) => m.email?.trim().toLowerCase() === k.email.trim().toLowerCase())) {
            members.push({
              id: k.userId || k.id || `user-${k.email.replace(/[^a-zA-Z0-9]/g, '_')}`,
              email: k.email.trim().toLowerCase(),
              namaLengkap: k.nama || k.namaLengkap || 'Anggota HW',
              role: 'umum',
              roles: ['umum'],
              password: '12345hw',
              photo: k.photo || '',
              isVerified: k.status === 'approved'
            });
          }
        });
      } catch(e) {}
    }

    // Find member by Email, WhatsApp number, or ID
    const found = members.find((m: any) => {
      if (!m) return false;
      const mEmail = (m.email || '').trim().toLowerCase();
      const mHp = String(m.noHp || m.nohp || m.noWa || '').replace(/[^0-9]/g, '');
      const mId = String(m.id || '').trim().toLowerCase();

      return (
        (mEmail && mEmail === cleanInput) ||
        (mId && mId === cleanInput) ||
        (mHp && cleanDigits && mHp.length > 5 && mHp === cleanDigits)
      );
    });

    if (!cleanPass) {
      throw new Error('Password tidak boleh kosong.');
    }

    if (found) {
      const roles = Array.isArray(found.roles) ? found.roles : (found.role ? [found.role] : ['umum']);
      const isAdmin = found.role === 'superadmin' || found.role === 'admin' || roles.includes('superadmin') || roles.includes('admin') || cleanInput === 'admin@hw.org' || cleanInput === 'admin@hw.or.id';
      const isMedkom = (found.email && found.email.toLowerCase() === 'medkom@hwjateng.com') || found.id === '1777209184010';

      let isValid = false;
      const storedPass = (found as any).password ? String((found as any).password).trim() : '';

      if (isMedkom) {
        if (storedPass && storedPass !== 'adnimku' && storedPass !== '12345hw') {
          isValid = (cleanPass === storedPass || cleanPass === '12345hwhw');
        } else {
          isValid = (cleanPass === '12345hwhw' || cleanPass === '12345hw' || cleanPass === 'adnimku');
        }
      } else if (isAdmin) {
        if (storedPass && storedPass !== 'adnimku' && storedPass !== 'admin') {
          isValid = (cleanPass === storedPass || cleanPass === '12345hw' || cleanPass === 'adnimku' || cleanPass === 'admin');
        } else {
          isValid = (cleanPass === '12345hw' || cleanPass === 'adnimku' || cleanPass === 'admin');
        }
      } else {
        // Regular member
        if (storedPass && storedPass !== 'adnimku' && storedPass !== 'admin') {
          isValid = (cleanPass === storedPass || cleanPass === '12345hw' || cleanPass === '12345' || (found.email && cleanPass === found.email));
        } else {
          isValid = (cleanPass === '12345hw' || cleanPass === '12345' || (found.email && cleanPass === found.email));
        }
      }

      if (isValid) {
        // Apply custom overrides to ensure updated roles/details are reflected
        const storedOvStr = localStorage.getItem('member_custom_edits');
        let customOverrides: Record<string, any> = {};
        if (storedOvStr) {
          try { customOverrides = JSON.parse(storedOvStr); } catch(e) {}
        }
        const mId = found.id ? String(found.id) : '';
        const mEmail = found.email ? found.email.toLowerCase().trim() : '';
        const mKta = (found.ktaNumber || found.nomorKTA || '').trim();
        const mPhone = found.noHp ? String(found.noHp).replace(/[^0-9]/g, '') : '';
        const ov = customOverrides[mId] || (mEmail ? customOverrides[mEmail] : null) || (mKta ? customOverrides[mKta] : null) || (mPhone && mPhone.length > 6 ? customOverrides[mPhone] : null);
        
        let mergedFound = ov ? { ...found, ...ov } : found;
        const mapped = this.mapUser(mergedFound);
        return {
          token: `mock-token-${mapped.email || mapped.id}`,
          user: mapped
        };
      } else {
        throw new Error('Password yang Anda masukkan salah.');
      }
    }

    // Special fallback for super admin
    if ((cleanInput === 'admin@hw.org' || cleanInput === 'admin') && (cleanPass === 'admin' || cleanPass === 'adnimku')) {
      return {
        token: 'mock-token-admin',
        user: {
          id: '1',
          email: 'admin@hw.org',
          namaLengkap: 'Ramanda Admin',
          role: 'superadmin',
          roles: ['superadmin', 'admin', 'kwarda', 'sugli', 'umum'],
          activeRole: 'superadmin',
          jenisKelamin: 'L',
          golongan: 'Pembina',
          pelatihan: ['Jati 3'],
          pendidikan: 'S1',
          asalKwarda: 'Banyumas',
          qabilah: 'Sudirman',
          alamat: 'Purwokerto',
          noHp: '08123456789',
          sosmed: '@admin_hw',
          isVerified: true
        }
      };
    }

    // Default mock behavior for registered members logging in with 12345hw
    if (cleanPass === '12345hw') {
      return {
        token: `mock-token-${cleanInput}`,
        user: {
          id: `user-${cleanInput.replace(/[^a-zA-Z0-9]/g, '_')}`,
          email: cleanInput,
          namaLengkap: cleanInput.split('@')[0].toUpperCase(),
          role: 'umum',
          roles: ['umum'],
          activeRole: 'umum',
          jenisKelamin: 'L',
          golongan: 'Dewasa',
          pelatihan: [],
          pendidikan: 'S1',
          asalKwarda: 'Banyumas',
          qabilah: 'HW Jateng',
          alamat: 'Jawa Tengah',
          noHp: '081234567890',
          sosmed: '@anggota_hw',
          isVerified: true
        }
      };
    }

    throw new Error('Email/ID atau password salah.');
  },

  isMock: () => !IS_API_VALID,

  async post(data: any): Promise<any> {
    updateApiUrlFromStorage();
    if (!IS_API_VALID) throw new Error('Konfigurasi API Google Sheets belum diatur (VITE_GSHEET_API_URL)');
    
    // We use text/plain to avoid CORS preflight (OPTIONS) which Google Apps Script doesn't support
    const response = await axios.post(API_URL!, JSON.stringify(data), {
      headers: {
        'Content-Type': 'text/plain',
      },
      timeout: 15000
    });
    
    // Check if the response itself contains an error field (common pattern in GAS responses)
    if (response.data && response.data.error) {
      const errMsg = String(response.data.error);
      if (errMsg.toLowerCase().includes('action not found')) {
        throw new Error(`Aksi '${data.action}' tidak ditemukan di Apps Script Google Sheets Anda. Silakan perbarui kode Apps Script Anda dengan menyalin kode dari berkas 'backend/code.gs' terbaru di menu Pengaturan Admin.`);
      }
      throw new Error(errMsg);
    }
    
    return response.data;
  },

  async register(userData: any): Promise<any> {
    const cleanEmail = (userData.email || '').trim().toLowerCase();
    const cleanPass = (userData.password || '').trim() || '12345hw';
    const newMember: User = {
      id: userData.id || `user-${cleanEmail.replace(/[^a-zA-Z0-9]/g, '_')}`,
      email: cleanEmail,
      namaLengkap: userData.namaLengkap || '',
      tempatLahir: userData.tempatLahir || '',
      tanggalLahir: userData.tanggalLahir || '',
      jenisKelamin: userData.jenisKelamin || 'L',
      golongan: userData.golongan || 'Pengenal',
      asalKwarda: userData.asalKwarda || '',
      qabilah: userData.qabilah || '',
      alamat: userData.alamat || '',
      noHp: userData.noHp || '',
      sosmed: userData.sosmed || '',
      statusPembayaran: userData.statusPembayaran || 'Belum Bayar',
      statusAktivasi: userData.statusAktivasi || 'Belum Aktif',
      isVerified: false,
      role: 'umum',
      roles: ['umum'],
      activeRole: 'umum',
      photo: userData.photo || '',
      pelatihan: userData.pelatihan || [],
      pendidikan: userData.pendidikan || ''
    };
    (newMember as any).password = cleanPass;

    // Persist to Firestore and local storage
    try {
      await firestoreService.saveMember(newMember);
    } catch (e) {
      console.error('Save member error in register:', e);
    }

    if (this.isMock()) {
      return { success: true, message: 'Registrasi berhasil.' };
    }

    try {
      return await this.post({
        action: 'register',
        ...userData
      });
    } catch (err: any) {
      console.warn('Google Sheets register API warning:', err);
      return { success: true, message: 'Registrasi berhasil tersimpan di database.' };
    }
  },

  mapMateri(data: any): Materi {
    if (!data || typeof data !== 'object') {
      return { id: String(Date.now()), judul: '', konten: '', kategori: 'umum', tanggal: '' };
    }
    return {
      id: String(data.id || data.ID || data._id || Math.random()),
      judul: String(data.judul || data.Judul || data.title || data.nama || ''),
      konten: String(data.konten || data.Konten || data.description || data.deskripsi || ''),
      kategori: String(data.kategori || data.Kategori || data.category || 'umum').toLowerCase(),
      tanggal: String(data.tanggal || data.Tanggal || data.date || ''),
      coverImage: String(data.coverImage || data.coverimage || data.CoverImage || data.image || ''),
      linkExternal: String(data.linkExternal || data.linkexternal || data.LinkExternal || ''),
      driveUrl: String(data.driveUrl || data.driveurl || data.DriveUrl || '')
    };
  },

  async getMateri(role: string): Promise<Materi[]> {
    return cachedFetch(`materi_${role}`, async () => {
      if (!IS_API_VALID) {
        const materiList = await firestoreService.getMateri();
        return (materiList || [])
          .map((m: any) => this.mapMateri(m))
          .filter((m: any) => !role || role === 'semua' || m.kategori === role);
      }
      try {
        const response = await axios.get(`${API_URL}?action=getMateri&role=${role}&_t=${Date.now()}`, { timeout: 15000 });
        let listData: any[] = [];
        if (Array.isArray(response.data)) {
          listData = response.data;
        } else if (response.data && Array.isArray(response.data.data)) {
          listData = response.data.data;
        } else if (response.data && Array.isArray(response.data.materi)) {
          listData = response.data.materi;
        }

        if (listData.length > 0) {
          return listData.map((m: any) => this.mapMateri(m));
        }

        const materiList = await firestoreService.getMateri();
        return (materiList || [])
          .map((m: any) => this.mapMateri(m))
          .filter((m: any) => !role || role === 'semua' || m.kategori === role);
      } catch (error) {
        console.warn('getMateri API error, falling back to Firestore:', (error as any)?.message || error);
        const materiList = await firestoreService.getMateri();
        return (materiList || [])
          .map((m: any) => this.mapMateri(m))
          .filter((m: any) => !role || role === 'semua' || m.kategori === role);
      }
    }, 30000);
  },

  async saveMateri(materi: any): Promise<any> {
    clearSheetsCache('materi');
    if (!IS_API_VALID) {
      const saved = await firestoreService.saveMateri(materi);
      return { success: true, data: saved };
    }
    const payload = {
      ...materi,
      driveurl: materi.driveUrl || materi.driveurl || '',
      coverimage: materi.coverImage || materi.coverimage || '',
      linkexternal: materi.linkExternal || materi.linkexternal || ''
    };
    try {
      const res = await this.post({ action: 'saveMateri', ...payload });
      await firestoreService.saveMateri(materi);
      return res;
    } catch (err) {
      const saved = await firestoreService.saveMateri(materi);
      return { success: true, data: saved };
    }
  },

  async deleteMateri(id: string): Promise<any> {
    clearSheetsCache('materi');
    if (!IS_API_VALID) {
      await firestoreService.deleteMateri(id);
      return { success: true };
    }
    try {
      const res = await this.post({ action: 'deleteMateri', id });
      await firestoreService.deleteMateri(id);
      return res;
    } catch (err) {
      await firestoreService.deleteMateri(id);
      return { success: true };
    }
  },

  async getMembers(forceRefresh = false): Promise<User[]> {
    const fetcher = async () => {
      let sheetMembers: User[] = [];
      if (IS_API_VALID) {
        try {
          const response = await axios.get(`${API_URL}?action=getMembers&_t=${Date.now()}`, { timeout: 15000 });
          if (Array.isArray(response.data) && response.data.length > 0) {
            sheetMembers = response.data.map((m: any) => this.mapUser(m));
          }
        } catch (e) {
          console.warn('getMembers from Google Sheets API warning:', e);
        }
      }

      // Always retrieve from unified firestoreService repository which holds the complete, deduped master dataset + Firestore database + KTA apps
      const fsMembers = await firestoreService.getMembers();
      const mappedFs = fsMembers.map((m: any) => this.mapUser(m));

      // Combine spreadsheet members with firestore/local members
      const combinedMap = new Map<string, User>();

      // Put mappedFs first
      mappedFs.forEach((m: User) => {
        const key = (m.id || m.email || m.ktaNumber || m.namaLengkap || '').toLowerCase().trim();
        if (key) combinedMap.set(key, m);
      });

      // Merge sheetMembers
      sheetMembers.forEach((sm: User) => {
        const smEmail = (sm.email || '').toLowerCase().trim();
        const smId = (sm.id || '').trim();
        const smKta = (sm.ktaNumber || sm.nomorKTA || '').trim();
        const smPhone = sm.noHp ? sm.noHp.replace(/[^0-9]/g, '') : '';
        const smName = (sm.namaLengkap || '').toLowerCase().trim();

        let matchedKey: string | null = null;
        for (const [key, ex] of combinedMap.entries()) {
          const exEmail = (ex.email || '').toLowerCase().trim();
          const exId = (ex.id || '').trim();
          const exKta = (ex.ktaNumber || ex.nomorKTA || '').trim();
          const exPhone = ex.noHp ? ex.noHp.replace(/[^0-9]/g, '') : '';
          const exName = (ex.namaLengkap || '').toLowerCase().trim();

          if (
            (smId && exId && smId === exId) ||
            (smEmail && exEmail && smEmail === exEmail) ||
            (smKta && exKta && smKta === exKta) ||
            (smPhone && smPhone.length > 5 && exPhone && smPhone === exPhone) ||
            (smName && exName && smName === exName && smName !== 'anggota hw')
          ) {
            matchedKey = key;
            break;
          }
        }

        if (matchedKey) {
          const existing = combinedMap.get(matchedKey)!;
          combinedMap.set(matchedKey, {
            ...existing,
            ...sm,
            photo: sm.photo || existing.photo,
            roles: (sm.roles && sm.roles.length > 0) ? sm.roles : existing.roles,
            role: sm.role || existing.role,
            password: sm.password || existing.password
          });
        } else {
          const newKey = (sm.id || sm.email || sm.ktaNumber || sm.namaLengkap || `sheet-${Math.random()}`).toLowerCase().trim();
          if (newKey) combinedMap.set(newKey, sm);
        }
      });

      const combinedList = Array.from(combinedMap.values());
      const finalResult = sanitizeMemberList(ensureUniqueKtaNumbers(applyMemberListOverrides(combinedList)));
      safeStorageSet('mock_members', finalResult);
      return finalResult;
    };

    if (forceRefresh) {
      clearSheetsCache('members');
      return await fetcher();
    }
    return cachedFetch('members', fetcher, 15000);
  },

  async saveMember(userData: any): Promise<any> {
    clearSheetsCache('members');
    const rawRoles = parseRolesField(userData.roles, userData.role);
    const synced = syncRolesAndPelatihan(rawRoles, userData.pelatihan);
    const primaryRole = synced.primaryRole;
    const properName = toProperName(userData.namaLengkap || userData.nama);
    const cleanUserData: User = {
      ...userData,
      id: userData.id || (userData.email ? `user-${userData.email.toLowerCase().replace(/[^a-zA-Z0-9]/g, '_')}` : `user-${Date.now()}`),
      namaLengkap: properName || userData.namaLengkap || 'Anggota HW',
      tanggalLahir: normalizeDateForInput(userData.tanggalLahir || (userData as any)?.tanggallahir || ''),
      role: primaryRole,
      roles: synced.roles,
      pelatihan: synced.pelatihan,
      activeRole: userData.activeRole || primaryRole
    };

    // 1. Immediately store persistent custom override
    try {
      const storedOverrides = localStorage.getItem('member_custom_edits');
      const overrides = storedOverrides ? JSON.parse(storedOverrides) : {};
      const idStr = String(cleanUserData.id).trim();
      const idClean = idStr.replace(/^user-/, '');
      if (idStr) overrides[idStr] = cleanUserData;
      if (idClean) overrides[idClean] = cleanUserData;
      if (idClean) overrides[`user-${idClean}`] = cleanUserData;
      if (cleanUserData.email && !cleanUserData.email.startsWith('member_') && !cleanUserData.email.startsWith('user_')) {
        overrides[cleanUserData.email.toLowerCase().trim()] = cleanUserData;
      }
      if (cleanUserData.ktaNumber) overrides[cleanUserData.ktaNumber.trim()] = cleanUserData;
      if (cleanUserData.nomorKTA) overrides[cleanUserData.nomorKTA.trim()] = cleanUserData;
      safeStorageSet('member_custom_edits', overrides);
    } catch (e) {}

    // 2. Immediately update local mock_members cache
    try {
      const stored = localStorage.getItem('mock_members');
      let members: any[] = stored ? JSON.parse(stored) : [];
      if (!Array.isArray(members)) members = [];
      const cleanId = String(cleanUserData.id || '');
      const cleanEmail = (cleanUserData.email && !cleanUserData.email.startsWith('member_') && !cleanUserData.email.startsWith('user_')) ? cleanUserData.email.toLowerCase().trim() : '';
      const cleanKta = cleanUserData.ktaNumber ? cleanUserData.ktaNumber.trim() : '';

      const idx = members.findIndex((m: any) => {
        if (!m) return false;
        const mId = m.id ? String(m.id) : '';
        const mEmail = (m.email && !m.email.startsWith('member_') && !m.email.startsWith('user_')) ? m.email.toLowerCase().trim() : '';
        const mKta = (m.ktaNumber || m.nomorKTA || '').trim();

        return (
          (cleanId && mId && cleanId === mId) ||
          (cleanEmail && mEmail && cleanEmail === mEmail) ||
          (cleanKta && mKta && cleanKta === mKta)
        );
      });

      if (idx >= 0) {
        members[idx] = { ...members[idx], ...cleanUserData };
      } else {
        members.push(cleanUserData);
      }
      safeStorageSet('mock_members', sanitizeMemberList(ensureUniqueKtaNumbers(applyMemberListOverrides(members))));

      // Also sync KTA application in localStorage if exists
      const ktaStored = localStorage.getItem('kta_applications');
      if (ktaStored) {
        let ktas: any[] = JSON.parse(ktaStored);
        if (Array.isArray(ktas)) {
          ktas.forEach((k: any) => {
            if ((cleanId && k.userId && String(k.userId) === cleanId) ||
                (cleanEmail && k.email && String(k.email).toLowerCase().trim() === cleanEmail)) {
              if (cleanUserData.namaLengkap) k.nama = cleanUserData.namaLengkap;
              if (cleanUserData.photo) k.photo = cleanUserData.photo;
              if (cleanUserData.noHp) k.noWa = cleanUserData.noHp;
              if (cleanUserData.asalKwarda) k.asalDaerah = cleanUserData.asalKwarda;
              if (cleanUserData.qabilah) k.qabilah = cleanUserData.qabilah;
              if (cleanUserData.alamat) k.alamat = cleanUserData.alamat;
              if (cleanUserData.tempatLahir) k.tempatLahir = cleanUserData.tempatLahir;
              if (cleanUserData.tanggalLahir) k.tanggalLahir = cleanUserData.tanggalLahir;
              if (cleanUserData.jenisKelamin) k.jenisKelamin = cleanUserData.jenisKelamin;
              if (cleanUserData.ktaNumber) k.ktaNumber = cleanUserData.ktaNumber;
            }
          });
          safeStorageSet('kta_applications', ktas);
        }
      }
    } catch (e) {
      console.warn('Error updating local mock_members in saveMember:', e);
    }

    // 3. Persist to Firestore
    try {
      await firestoreService.saveMember(cleanUserData as User);
      if (cleanUserData.id) {
        await firestoreService.updateMember(cleanUserData.id, cleanUserData as User);
      }
    } catch (e) {
      console.warn('Firestore update in saveMember warning:', e);
    }

    // 3. Post to Google Sheets if API is active
    if (IS_API_VALID) {
      const payload = {
        ...cleanUserData,
        id: cleanUserData.id,
        email: cleanUserData.email,
        namaLengkap: cleanUserData.namaLengkap,
        nama: cleanUserData.namaLengkap,
        noHp: cleanUserData.noHp,
        noWa: cleanUserData.noHp,
        asalKwarda: cleanUserData.asalKwarda,
        asalDaerah: cleanUserData.asalKwarda,
        qabilah: cleanUserData.qabilah,
        alamat: cleanUserData.alamat,
        tempatLahir: cleanUserData.tempatLahir,
        tanggalLahir: cleanUserData.tanggalLahir,
        jenisKelamin: cleanUserData.jenisKelamin,
        golongan: cleanUserData.golongan,
        golonganPelatih: cleanUserData.golonganPelatih,
        photo: cleanUserData.photo,
        foto: cleanUserData.photo,
        sosmed: cleanUserData.sosmed,
        isVerified: cleanUserData.isVerified,
        statusAktivasi: cleanUserData.statusAktivasi,
        statusPembayaran: cleanUserData.statusPembayaran,
        ktaNumber: cleanUserData.ktaNumber,
        nomorKTA: cleanUserData.ktaNumber,
        role: (cleanUserData.roles && cleanUserData.roles.length > 0 ? cleanUserData.roles : [cleanUserData.role]).join(', '),
        roles: (cleanUserData.roles && cleanUserData.roles.length > 0 ? cleanUserData.roles : [cleanUserData.role]).join(', '),
        hakAkses: (cleanUserData.roles && cleanUserData.roles.length > 0 ? cleanUserData.roles : [cleanUserData.role]).join(', '),
        'Hak Akses': (cleanUserData.roles && cleanUserData.roles.length > 0 ? cleanUserData.roles : [cleanUserData.role]).join(', '),
        'Role': (cleanUserData.roles && cleanUserData.roles.length > 0 ? cleanUserData.roles : [cleanUserData.role]).join(', '),
        'Roles': (cleanUserData.roles && cleanUserData.roles.length > 0 ? cleanUserData.roles : [cleanUserData.role]).join(', '),
        roleJson: JSON.stringify(cleanUserData.roles || [cleanUserData.role]),
        rolesJson: JSON.stringify(cleanUserData.roles || [cleanUserData.role]),
        pelatihan: Array.isArray(cleanUserData.pelatihan) ? cleanUserData.pelatihan.join(', ') : (cleanUserData.pelatihan || ''),
        pelatihanJson: Array.isArray(cleanUserData.pelatihan) ? JSON.stringify(cleanUserData.pelatihan) : cleanUserData.pelatihan,
        upgradeRequests: Array.isArray(cleanUserData.upgradeRequests) ? JSON.stringify(cleanUserData.upgradeRequests) : cleanUserData.upgradeRequests
      };
      try {
        const res = await this.post({ action: 'saveMember', ...payload });
        return { success: true, message: 'Member saved successfully', member: cleanUserData, ...res };
      } catch (err: any) {
        console.warn('Google Sheets saveMember API call warning:', err);
        return { success: true, message: 'Member saved locally and in database', member: cleanUserData };
      }
    }

    return { success: true, message: 'Saved to database and local cache', member: cleanUserData };
  },

  async updateMember(idOrUser: string | Partial<User>, maybeUpdates?: Partial<User>): Promise<any> {
    clearSheetsCache('members');
    let mergedData: any = {};
    if (typeof idOrUser === 'string') {
      mergedData = { id: idOrUser, ...(maybeUpdates || {}) };
    } else {
      mergedData = { ...(idOrUser || {}), ...(maybeUpdates || {}) };
    }
    return this.saveMember(mergedData);
  },

  async deleteMember(id: string): Promise<any> {
    clearSheetsCache('members');
    if (!IS_API_VALID) {
      await firestoreService.deleteMember(id);
      return { success: true };
    }
    try {
      const res = await this.post({ action: 'deleteMember', id });
      await firestoreService.deleteMember(id);
      return res;
    } catch (err) {
      await firestoreService.deleteMember(id);
      return { success: true };
    }
  },

  subscribeToMembers(callback: (members: User[]) => void): () => void {
    // 1. Initial cached return
    const cached = localStorage.getItem('mock_members');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          callback(sanitizeMemberList(ensureUniqueKtaNumbers(applyMemberListOverrides(parsed))));
        }
      } catch (e) {}
    }

    // 2. Fetch fresh data immediately
    this.getMembers(true).then((freshMembers) => {
      if (freshMembers && freshMembers.length > 0) {
        callback(freshMembers);
      }
    }).catch(() => {});

    // 3. Subscribe to real-time Firestore changes
    const unsubFs = firestoreService.subscribeToMembers((fsMembers) => {
      const mapped = fsMembers.map((m: any) => this.mapUser(m));
      const finalResult = sanitizeMemberList(ensureUniqueKtaNumbers(applyMemberListOverrides(mapped)));
      safeStorageSet('mock_members', finalResult);
      callback(finalResult);
    });

    // 4. Poll Google Sheets API periodically (every 25s) if API is valid and window is active
    let pollInterval: any = null;
    if (IS_API_VALID) {
      pollInterval = setInterval(() => {
        if (document.visibilityState === 'visible') {
          this.getMembers(true).then((m) => {
            if (m && m.length > 0) callback(m);
          }).catch(() => {});
        }
      }, 25000);
    }

    const onFocus = () => {
      this.getMembers(true).then((m) => {
        if (m && m.length > 0) callback(m);
      }).catch(() => {});
    };
    window.addEventListener('focus', onFocus);

    return () => {
      if (typeof unsubFs === 'function') unsubFs();
      if (pollInterval) clearInterval(pollInterval);
      window.removeEventListener('focus', onFocus);
    };
  },

  subscribeToMember(memberId: string, callback: (member: User | null) => void): () => void {
    return firestoreService.subscribeToMember(memberId, callback);
  },

  async forgotPassword(email: string): Promise<any> {
    if (!IS_API_VALID) {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({ success: true, message: 'Instruksi reset password telah dikirim ke email Anda (Mock).' });
        }, 1000);
      });
    }
    return this.post({
      action: 'forgotPassword',
      email
    });
  },

  async requestUpgrade(userId: string, category: string, userObj?: any): Promise<any> {
    try {
      let memberToUpdate: any = null;
      const members = await firestoreService.getMembers();
      
      memberToUpdate = members.find((m: any) => 
        (m.id && String(m.id) === String(userId)) || 
        (userObj?.email && m.email && String(m.email).trim().toLowerCase() === String(userObj.email).trim().toLowerCase())
      );

      if (!memberToUpdate && userObj) {
        memberToUpdate = { ...userObj, id: userId };
      }

      if (memberToUpdate) {
        const currentRequests = Array.isArray(memberToUpdate.upgradeRequests) ? [...memberToUpdate.upgradeRequests] : [];
        if (!currentRequests.includes(category)) {
          currentRequests.push(category);
        }
        
        const updatedMember = {
          ...memberToUpdate,
          ...(userObj || {}),
          id: memberToUpdate.id || userId,
          upgradeRequests: currentRequests
        };

        await firestoreService.saveMember(updatedMember);
        await firestoreService.updateMember(updatedMember.id, { upgradeRequests: currentRequests });
      }

      if (IS_API_VALID) {
        try {
          await this.post({
            action: 'requestUpgrade',
            userId,
            category
          });
        } catch (e) {
          console.error('requestUpgrade API error:', e);
        }
      }

      return { success: true, message: 'Permintaan upgrade berhasil dikirim!' };
    } catch (e: any) {
      console.error('requestUpgrade error:', e);
      return { success: false, message: e.message || 'Gagal mengajukan upgrade' };
    }
  },

  async getKTAApplications(forceRefresh = false): Promise<any[]> {
    const fetcher = async () => {
      let sheetApps: any[] = [];
      if (IS_API_VALID) {
        try {
          const response = await axios.get(`${API_URL}?action=getKTAApplications&_t=${Date.now()}`, { timeout: 15000 });
          if (Array.isArray(response.data)) {
            sheetApps = response.data;
          }
        } catch (e) {
          console.warn('getKTAApplications API error:', e);
        }
      }

      let fsApps: any[] = [];
      try {
        fsApps = await firestoreService.getKTAApplications();
      } catch (e) {}

      const apps = [...sheetApps];
      const sheetKeys = new Set(
        apps.map(a => String(a.id || a.email || a.userId || a.nomorKTA || a.ktaNumber || '').toLowerCase().trim()).filter(Boolean)
      );

      apps.forEach(a => {
        const match = fsApps.find(fa => 
          (fa.id && a.id && String(fa.id) === String(a.id)) ||
          (fa.email && a.email && fa.email.toLowerCase().trim() === a.email.toLowerCase().trim()) ||
          (fa.userId && a.userId && String(fa.userId) === String(a.userId))
        );
        if (match) {
          if (!a.photo && match.photo) a.photo = match.photo;
          if (!a.status && match.status) a.status = match.status;
          if (!a.statusPembayaran && match.statusPembayaran) a.statusPembayaran = match.statusPembayaran;
          if (!a.nomorKTA && (match.nomorKTA || match.ktaNumber)) a.nomorKTA = match.nomorKTA || match.ktaNumber;
          if (!a.asalDaerah && (match.asalDaerah || match.asalKwarda)) a.asalDaerah = match.asalDaerah || match.asalKwarda;
        }
      });

      fsApps.forEach(fa => {
        const key1 = String(fa.id || '').toLowerCase().trim();
        const key2 = String(fa.email || '').toLowerCase().trim();
        const key3 = String(fa.userId || '').toLowerCase().trim();
        if ((!key1 || !sheetKeys.has(key1)) && (!key2 || !sheetKeys.has(key2)) && (!key3 || !sheetKeys.has(key3))) {
          apps.push(fa);
        }
      });

      // Also ensure all registered members from getMasterMembersList are present
      let allMembers: User[] = [];
      try {
        allMembers = getMasterMembersList();
      } catch (e) {}

      const existingAppKeys = new Set<string>();
      apps.forEach((a: any) => {
        if (a.id) existingAppKeys.add(`id:${String(a.id).toLowerCase().trim()}`);
        if (a.userId) existingAppKeys.add(`id:${String(a.userId).toLowerCase().trim()}`);
        if (a.email && !a.email.startsWith('member_') && !a.email.startsWith('user_')) existingAppKeys.add(`email:${a.email.toLowerCase().trim()}`);
        if (a.ktaNumber && a.ktaNumber !== 'KTA-HW.JT.XXXX') existingAppKeys.add(`kta:${a.ktaNumber.trim()}`);
        if (a.nomorKTA && a.nomorKTA !== 'KTA-HW.JT.XXXX') existingAppKeys.add(`kta:${a.nomorKTA.trim()}`);
        const aName = (a.nama || a.namaLengkap || '').toLowerCase().trim();
        const aRegion = (a.asalDaerah || a.qabilah || '').toLowerCase().trim();
        if (aName && aRegion) existingAppKeys.add(`name_region:${aName}:::${aRegion}`);
      });

      allMembers.forEach((m: any) => {
        if (!m) return;
        const mName = (m.namaLengkap || m.nama || '').trim();
        if (!mName || mName === 'Tanpa Nama' || mName === '-' || mName.toLowerCase() === 'anggota hw') return;

        const mId = m.id ? String(m.id).toLowerCase().trim() : '';
        const mEmail = m.email ? String(m.email).toLowerCase().trim() : '';
        const mKta = (m.ktaNumber || m.nomorKTA || '').trim();
        const mRegion = (m.asalKwarda || m.asalDaerah || m.qabilah || '').toLowerCase().trim();

        const isPresent = (
          (mId && existingAppKeys.has(`id:${mId}`)) ||
          (mEmail && !mEmail.startsWith('member_') && !mEmail.startsWith('user_') && existingAppKeys.has(`email:${mEmail}`)) ||
          (mKta && mKta !== 'KTA-HW.JT.XXXX' && existingAppKeys.has(`kta:${mKta}`)) ||
          (mName && mRegion && existingAppKeys.has(`name_region:${mName.toLowerCase()}:::${mRegion}`))
        );

        if (!isPresent) {
          const ktaId = m.id ? `kta-${m.id}` : `kta-user-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
          const isApproved = Boolean(m.isVerified || mKta || m.status === 'approved');
          apps.push({
            id: ktaId,
            userId: m.id || ktaId,
            nama: mName,
            namaLengkap: mName,
            email: m.email || '',
            noWa: m.noHp || m.noWa || '',
            asalDaerah: m.asalKwarda || m.asalDaerah || '',
            qabilah: m.qabilah || '',
            tingkatan: m.golongan || m.tingkatan || 'Dewasa',
            tempatLahir: m.tempatLahir || '',
            tanggalLahir: m.tanggalLahir || '',
            jenisKelamin: m.jenisKelamin || 'L',
            alamat: m.alamat || '',
            nbm: m.nbm || '',
            photo: m.photo || '',
            status: isApproved ? 'approved' : (m.status || 'pending'),
            statusPembayaran: m.statusPembayaran || (isApproved ? 'Lunas' : 'Belum Bayar'),
            statusAktivasi: m.statusAktivasi || (isApproved ? 'Aktif' : 'Belum Aktif'),
            ktaNumber: mKta || '',
            nomorKTA: mKta || '',
            jenisKta: m.jenisKta || 'Digital',
            createdAt: m.createdAt || new Date().toISOString()
          });

          if (mId) existingAppKeys.add(`id:${mId}`);
          if (mEmail && !mEmail.startsWith('member_') && !mEmail.startsWith('user_')) existingAppKeys.add(`email:${mEmail}`);
          if (mKta && mKta !== 'KTA-HW.JT.XXXX') existingAppKeys.add(`kta:${mKta}`);
          if (mName && mRegion) existingAppKeys.add(`name_region:${mName.toLowerCase()}:::${mRegion}`);
        }
      });

      const finalApps = ensureUniqueKtaNumbers(apps);
      safeStorageSet('kta_applications', finalApps);
      return finalApps;
    };

    if (forceRefresh) {
      clearSheetsCache('ktaApplications');
      return await fetcher();
    }
    return cachedFetch('ktaApplications', fetcher, 15000);
  },

  subscribeToKTAApplications(callback: (apps: any[]) => void): () => void {
    // 1. Initial cached return
    const cached = localStorage.getItem('kta_applications');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          callback(ensureUniqueKtaNumbers(parsed));
        }
      } catch (e) {}
    }

    // 2. Fetch fresh data immediately
    this.getKTAApplications(true).then((freshApps) => {
      if (freshApps && freshApps.length > 0) {
        callback(freshApps);
      }
    }).catch(() => {});

    // 3. Subscribe to Firestore
    const unsubFs = firestoreService.subscribeToKTAApplications((apps) => {
      const finalApps = ensureUniqueKtaNumbers(apps);
      safeStorageSet('kta_applications', finalApps);
      callback(finalApps);
    });

    // 4. Polling Google Sheets
    let pollInterval: any = null;
    if (IS_API_VALID) {
      pollInterval = setInterval(() => {
        if (document.visibilityState === 'visible') {
          this.getKTAApplications(true).then((a) => {
            if (a && a.length > 0) callback(a);
          }).catch(() => {});
        }
      }, 25000);
    }

    const onFocus = () => {
      this.getKTAApplications(true).then((a) => {
        if (a && a.length > 0) callback(a);
      }).catch(() => {});
    };
    window.addEventListener('focus', onFocus);

    return () => {
      if (typeof unsubFs === 'function') unsubFs();
      if (pollInterval) clearInterval(pollInterval);
      window.removeEventListener('focus', onFocus);
    };
  },

  async applyKTA(ktaData: any): Promise<any> {
    clearSheetsCache('kta');
    if (!IS_API_VALID) {
      const saved = await firestoreService.createKTAApplication(ktaData);
      return { success: true, application: saved };
    }
    try {
      const res = await this.post({ action: 'applyKTA', ...ktaData });
      await firestoreService.createKTAApplication(ktaData);
      return res;
    } catch (e) {
      const saved = await firestoreService.createKTAApplication(ktaData);
      return { success: true, application: saved };
    }
  },

  async saveKTAApplication(appData: any): Promise<any> {
    clearSheetsCache('kta');
    if (!IS_API_VALID) {
      const saved = await firestoreService.createKTAApplication(appData);
      return { success: true, application: saved };
    }
    try {
      const res = await this.post({ action: 'saveKTAApplication', ...appData });
      await firestoreService.createKTAApplication(appData);
      return res;
    } catch (e) {
      const saved = await firestoreService.createKTAApplication(appData);
      return { success: true, application: saved };
    }
  },

  async saveTrainingApplicationAndSyncMember(appData: any): Promise<any> {
    clearSheetsCache('training');
    clearSheetsCache('members');
    if (IS_API_VALID) {
      try {
        await this.post({
          action: 'saveTrainingApplication',
          ...appData
        });
      } catch (e) {
        console.warn('saveTrainingApplication API warning:', e);
      }
    }
    const savedApp = await firestoreService.createTrainingApplication(appData);
    
    // Sync to member in Firestore as well
    const userId = appData.userId;
    const email = appData.email;
    if (userId || email || appData.nama) {
      try {
        const members = await firestoreService.getMembers();
        const m = members.find((x: any) => 
          (userId && String(x.id) === String(userId)) || 
          (email && String(x.email).toLowerCase().trim() === String(email).toLowerCase().trim()) ||
          (appData.nama && String(x.namaLengkap || x.nama || '').toLowerCase().trim() === String(appData.nama).toLowerCase().trim())
        );

        const isApprovedOrLunas = appData.status === 'approved' || appData.statusPembayaran === 'Lunas';

        if (m) {
          const pelatihanList: string[] = Array.isArray(m.pelatihan) ? [...m.pelatihan] : [];
          if (appData.pelatihanAkanDiikuti && !pelatihanList.includes(appData.pelatihanAkanDiikuti)) {
            pelatihanList.push(appData.pelatihanAkanDiikuti);
          }
          const updated = {
            ...m,
            namaLengkap: appData.nama || m.namaLengkap,
            email: appData.email || m.email,
            noHp: appData.noWa || appData.noHp || m.noHp,
            nbm: appData.nbm || (m as any).nbm || m.ktaNumber || '',
            tempatLahir: appData.tempatLahir || (m as any).tempatLahir,
            tanggalLahir: appData.tanggalLahir || (m as any).tanggalLahir,
            jenisKelamin: appData.jenisKelamin || m.jenisKelamin,
            qabilah: appData.qabilah || m.qabilah,
            asalKwarda: appData.asalDaerah || m.asalKwarda,
            golongan: appData.golonganAnggota || m.golongan,
            pelatihan: pelatihanList,
            statusPembayaran: appData.statusPembayaran || (isApprovedOrLunas ? 'Lunas' : (m.statusPembayaran || 'Belum Bayar')),
            statusAktivasi: isApprovedOrLunas ? 'Aktif' : (m.statusAktivasi || 'Belum Aktif'),
            isVerified: isApprovedOrLunas ? true : m.isVerified
          };
          await firestoreService.saveMember(updated);
        } else if (appData.nama && appData.nama.trim()) {
          const newMember: any = {
            id: userId || `user-manual-${Date.now()}`,
            namaLengkap: appData.nama.trim(),
            email: appData.email || '',
            noHp: appData.noWa || appData.noHp || '',
            nbm: appData.nbm || '',
            tempatLahir: appData.tempatLahir || '',
            tanggalLahir: appData.tanggalLahir || '',
            jenisKelamin: appData.jenisKelamin || 'L',
            qabilah: appData.qabilah || '',
            asalKwarda: appData.asalDaerah || '',
            golongan: appData.golonganAnggota || 'Pengenal',
            pelatihan: appData.pelatihanAkanDiikuti ? [appData.pelatihanAkanDiikuti] : [],
            statusPembayaran: appData.statusPembayaran || (isApprovedOrLunas ? 'Lunas' : 'Belum Bayar'),
            statusAktivasi: isApprovedOrLunas ? 'Aktif' : 'Belum Aktif',
            isVerified: isApprovedOrLunas,
            statusKTA: 'Diproses',
            createdAt: new Date().toISOString()
          };
          await firestoreService.saveMember(newMember);
        }
      } catch (err) {
        console.error('Error syncing member in Firestore:', err);
      }
    }
    return { success: true, application: savedApp };
  },

  async updateKTAStatus(id: string, status: 'approved' | 'rejected' | 'pending', param3?: string, param4?: string): Promise<any> {
    clearSheetsCache('kta');
    clearSheetsCache('members');
    let remark = param4;
    let ktaNumber = param3;

    if (status === 'rejected') {
      remark = param3 || param4 || 'Pengajuan KTA ditolak';
      ktaNumber = undefined;
    } else if (status === 'approved') {
      if (param3 && typeof param3 === 'string' && !param3.startsWith('KTA-') && !param4) {
        remark = param3;
        ktaNumber = undefined;
      }
    }

    try {
      if (IS_API_VALID) {
        this.post({ action: 'updateKTAStatus', id, status, ktaNumber, remark }).catch(e => console.warn('Background updateKTAStatus post error:', e));
      }
    } catch (e) {
      console.warn('Sheets API updateKTAStatus warning:', e);
    }
    const updated = await firestoreService.updateKTAStatus(id, status, remark, new Date().toISOString(), ktaNumber);
    return { success: true, application: updated };
  },

  async deleteKTAApplication(id: string): Promise<any> {
    clearSheetsCache('kta');
    try {
      if (IS_API_VALID) {
        await this.post({ action: 'deleteKTAApplication', id }).catch(() => {});
      }
    } catch (e) {
      console.warn('Sheets API deleteKTAApplication warning:', e);
    }
    await firestoreService.deleteKTAApplication(id);
    return { success: true };
  },

  async getTrainingApplications(): Promise<any[]> {
    return cachedFetch('trainingApplications', async () => {
      const fsTrainings = await firestoreService.getTrainingApplications();
      if (!IS_API_VALID) {
        return fsTrainings;
      }
      try {
        const response = await axios.get(`${API_URL}?action=getTrainingApplications&_t=${Date.now()}`, { timeout: 15000 });
        if (Array.isArray(response.data) && response.data.length > 0) {
          const sysEmails = ['admin@hwjateng.com', 'materihw@gmail.com', 'medkom@hwjateng.com', 'admin@hw.org'];
          const apiTrainings = response.data.map((t: any, idx: number) => {
            const rawNama = t.nama || t.namaLengkap || t.namalengkap || '';
            const rawEmail = t.email || '';
            const rawWa = t.noWa || t.nowa || t.noHp || t.nohp || '';
            const rawPelatihan = t.pelatihanAkanDiikuti || t.pelatihanakandiikuti || t.tingkatan || '';
            return {
              ...t,
              id: t.id || t.Id || `train-api-${idx}`,
              nama: rawNama,
              namaLengkap: rawNama,
              email: rawEmail,
              noWa: rawWa,
              noHp: rawWa,
              tingkatan: t.tingkatan || rawPelatihan,
              pelatihanAkanDiikuti: rawPelatihan,
              asalDaerah: t.asalDaerah || t.asaldaerah || t.asalKwarda || '',
              status: t.status || 'approved',
              tanggalAjuan: t.tanggalAjuan || t.tanggalajuan || t.tanggalDaftar || new Date().toISOString(),
              preTestScore: t.preTestScore !== undefined ? t.preTestScore : (t.pretestscore !== undefined ? t.pretestscore : undefined),
              preTestData: t.preTestData || t.pretestdata || '',
              preTestSubmittedAt: t.preTestSubmittedAt || t.pretestsubmittedat || '',
              postTestScore: t.postTestScore !== undefined ? t.postTestScore : (t.posttestscore !== undefined ? t.posttestscore : undefined),
              postTestData: t.postTestData || t.posttestdata || '',
              postTestSubmittedAt: t.postTestSubmittedAt || t.posttestsubmittedat || ''
            };
          }).filter((t: any) => {
            const name = (t.nama || t.namaLengkap || '').trim();
            const email = (t.email || '').toLowerCase().trim();
            return name && name !== '-' && !name.includes('@') && name.toLowerCase() !== 'tanpa nama' && !sysEmails.includes(email) && t.status !== 'deleted';
          });

          return consolidateTrainingApplications([...fsTrainings, ...apiTrainings]);
        }
        return fsTrainings;
      } catch (e) {
        console.warn('getTrainingApplications API error, falling back to Firestore:', (e as any)?.message || e);
        return fsTrainings;
      }
    }, 20000);
  },

  async applyTraining(trainingData: any): Promise<any> {
    clearSheetsCache('training');
    const existingApps = await firestoreService.getTrainingApplications();
    const duplicate = existingApps.find((item: any) => {
      if (item.status === 'rejected' || item.status === 'deleted') return false;
      const samePelatihan = item.pelatihanAkanDiikuti && 
        String(item.pelatihanAkanDiikuti).toLowerCase().trim() === String(trainingData.pelatihanAkanDiikuti || '').toLowerCase().trim();
      if (!samePelatihan) return false;
      
      const itemUserId = String(item.userId || '');
      const dataUserId = String(trainingData.userId || '');
      const isUserMatch = dataUserId && itemUserId && dataUserId === itemUserId && !dataUserId.startsWith('guest-') && !itemUserId.startsWith('guest-');
      
      const itemEmail = String(item.email || '').trim().toLowerCase();
      const dataEmail = String(trainingData.email || '').trim().toLowerCase();
      const isEmailMatch = dataEmail && itemEmail && dataEmail !== '-' && itemEmail !== '-' && dataEmail === itemEmail;
      
      const itemWa = String(item.noWa || item.noHp || '').trim();
      const dataWa = String(trainingData.noWa || trainingData.noHp || '').trim();
      const isWaMatch = dataWa && itemWa && dataWa !== '-' && itemWa !== '-' && dataWa === itemWa;
      
      return !!(isUserMatch || isEmailMatch || isWaMatch);
    });
    
    if (duplicate) {
      throw new Error('Anda sudah mendaftar di pelatihan ini dan statusnya masih aktif/proses.');
    }

    if (IS_API_VALID) {
      try {
        await this.post({
          action: 'applyTraining',
          ...trainingData
        });
      } catch (e) {
        console.warn('applyTraining API error:', e);
      }
    }
    const savedApp = await firestoreService.createTrainingApplication(trainingData);
    return { success: true, application: savedApp };
  },

  async updateTrainingStatus(id: string, status: 'approved' | 'rejected' | 'pending' | 'deleted', param3?: string, param4?: string): Promise<any> {
    clearSheetsCache('training');
    clearSheetsCache('members');
    const remark = param3 || param4;
    if (IS_API_VALID) {
      this.post({ action: 'updateTrainingStatus', id, status, remark }).catch(e => console.warn('Background updateTrainingStatus post error:', e));
    }
    if (status === 'deleted') {
      await firestoreService.deleteTrainingApplication(id);
      return { success: true };
    }
    const updated = await firestoreService.updateTrainingStatus(id, status, remark);
    
    // If approved, update member role/isVerified/statusPembayaran in Firestore as well
    if (status === 'approved' && updated) {
      try {
        const members = await firestoreService.getMembers();
        const m = members.find((x: any) => 
          (updated.userId && String(x.id) === String(updated.userId)) ||
          (updated.email && String(x.email).toLowerCase().trim() === String(updated.email).toLowerCase().trim()) ||
          (updated.nama && String(x.namaLengkap || x.nama || '').toLowerCase().trim() === String(updated.nama).toLowerCase().trim())
        );
        if (m) {
          m.isVerified = true;
          m.statusAktivasi = 'Aktif';
          m.statusPembayaran = 'Lunas';
          if (updated.pelatihanAkanDiikuti) {
            const roleName = updated.pelatihanAkanDiikuti.toLowerCase().replace(/\s+/g, '');
            let roles: string[] = Array.isArray(m.roles) ? [...m.roles] : [m.role || 'umum'];
            if (!roles.includes(roleName as any)) {
              roles.push(roleName);
            }
            m.roles = roles as any;
            let pelatihanList: string[] = Array.isArray(m.pelatihan) ? [...m.pelatihan] : [];
            if (!pelatihanList.includes(updated.pelatihanAkanDiikuti)) {
              pelatihanList.push(updated.pelatihanAkanDiikuti);
            }
            m.pelatihan = pelatihanList;
          }
          await firestoreService.saveMember(m);
        } else if (updated.nama && updated.nama.trim()) {
          const newMember: any = {
            id: updated.userId || `user-manual-${Date.now()}`,
            namaLengkap: updated.nama.trim(),
            email: updated.email || '',
            noHp: updated.noWa || updated.noHp || '',
            nbm: updated.nbm || '',
            tempatLahir: updated.tempatLahir || '',
            tanggalLahir: updated.tanggalLahir || '',
            jenisKelamin: updated.jenisKelamin || 'L',
            qabilah: updated.qabilah || '',
            asalKwarda: updated.asalDaerah || '',
            golongan: updated.golonganAnggota || 'Pengenal',
            pelatihan: updated.pelatihanAkanDiikuti ? [updated.pelatihanAkanDiikuti] : [],
            statusPembayaran: 'Lunas',
            statusAktivasi: 'Aktif',
            isVerified: true,
            statusKTA: 'Diproses',
            createdAt: new Date().toISOString()
          };
          await firestoreService.saveMember(newMember);
        }
      } catch (err) {
        console.error('Error updating member on training approval:', err);
      }
    }
    return { success: true, application: updated };
  },

  async bulkSetAllTrainingParticipantsToActivity(activityData?: any): Promise<{ success: boolean; count: number }> {
    clearSheetsCache('trainingApplications');
    clearSheetsCache('members');
    clearFirestoreCache('training_applications');
    clearFirestoreCache('members');
    return await firestoreService.bulkSetAllTrainingParticipantsToActivity(activityData);
  },

  async bulkSetAllTrainingParticipantsToJayaMelati1Solo(): Promise<{ success: boolean; count: number }> {
    return this.bulkSetAllTrainingParticipantsToActivity();
  },

  async restoreSolo70TrainingParticipants(): Promise<{ success: boolean; count: number }> {
    clearSheetsCache('trainingApplications');
    clearSheetsCache('members');
    clearFirestoreCache('training_applications');
    clearFirestoreCache('members');
    return await firestoreService.restoreSolo70TrainingParticipants();
  },

  async clearPostTestScoresForTraining(targetActivityId: string = 'act-jm1-solo'): Promise<{ success: boolean; count: number }> {
    clearSheetsCache('trainingApplications');
    clearFirestoreCache('training_applications');
    return await firestoreService.clearPostTestScoresForTraining(targetActivityId);
  },

  async updateAttendance(id: string, kehadiran: string): Promise<any> {
    clearSheetsCache('trainingApplications');
    clearFirestoreCache('training_applications');
    if (IS_API_VALID) {
      this.post({ action: 'updateAttendance', id, kehadiran }).catch(() => {});
    }
    const res = await firestoreService.updateAttendance(id, kehadiran);
    return { success: true, application: res };
  },

  async submitAssignment(id: string, tugas: string): Promise<any> {
    clearSheetsCache('trainingApplications');
    clearFirestoreCache('training_applications');
    if (IS_API_VALID) {
      this.post({ action: 'submitAssignment', id, tugas }).catch(() => {});
    }
    await firestoreService.updateAssignmentGrade(id, tugas, undefined);
    return { success: true };
  },

  async submitTestSubmission(id: string, submission: any): Promise<any> {
    clearSheetsCache('trainingApplications');
    clearFirestoreCache('training_applications');
    if (IS_API_VALID) {
      this.post({ 
        action: 'submitTestSubmission', 
        id, 
        testType: submission.testType,
        score: submission.score,
        data: typeof submission === 'string' ? submission : JSON.stringify(submission)
      }).catch(() => {});
    }
    const updated = await firestoreService.submitTestSubmission(id, submission);
    return { success: true, application: updated };
  },

  async updateGrade(id: string, nilai: any): Promise<any> {
    clearSheetsCache('trainingApplications');
    clearFirestoreCache('training_applications');
    const isObj = nilai && typeof nilai === 'object';
    const gradeStr = isObj ? (nilai.grade || '') : String(nilai || '');
    const remarkStr = isObj ? (nilai.remark || '') : undefined;
    const statusKelulusanStr = isObj ? (nilai.statusKelulusan || '') : undefined;

    if (IS_API_VALID) {
      this.post({
        action: 'updateGrade',
        id,
        nilai: gradeStr,
        remark: remarkStr,
        statusKelulusan: statusKelulusanStr
      }).catch(() => {});
    }
    await firestoreService.updateAssignmentGrade(id, undefined, gradeStr, remarkStr, statusKelulusanStr);
    return { success: true };
  },

  async updateTrainingSchedule(id: string, lokasiPelatihan: string, tanggalPelatihan: string, pelatihanAkanDiikuti?: string): Promise<any> {
    if (IS_API_VALID) {
      this.post({ action: 'updateTrainingSchedule', id, lokasiPelatihan, tanggalPelatihan, pelatihanAkanDiikuti }).catch(() => {});
    }
    const payload: any = { id, lokasiPelatihan, tanggalPelatihan };
    if (pelatihanAkanDiikuti) {
      payload.pelatihanAkanDiikuti = pelatihanAkanDiikuti;
    }
    await firestoreService.createTrainingApplication(payload);
    return { success: true };
  },

  getMockMateri(): Materi[] {
    return [
      {
        id: 'materi-1',
        judul: 'Sejarah Hizbul Wathan',
        konten: 'Hizbul Wathan didirikan oleh KH Ahmad Dahlan pada tahun 1918 di Yogyakarta. Organisasi ini berfokus pada pembentukan karakter pemuda muslim melalui kegiatan kepanduan.',
        kategori: 'umum',
        tanggal: new Date().toISOString(),
        coverImage: 'https://upload.wikimedia.org/wikipedia/id/b/ba/Logo_Hizbul_Wathan.png'
      },
      {
        id: 'materi-2',
        judul: 'Undang-Undang Pandu HW',
        konten: '1. Pandu HW itu dapat dipercaya. 2. Pandu HW itu setia dan teguh hati. 3. Pandu HW itu siap menolong dan berjasa.',
        kategori: 'umum',
        tanggal: new Date().toISOString(),
        coverImage: 'https://upload.wikimedia.org/wikipedia/id/b/ba/Logo_Hizbul_Wathan.png'
      },
      {
        id: 'materi-3',
        judul: 'Materi Jati 1: Dasar Kepemimpinan',
        konten: 'Karakter pemimpin dalam HW harus memiliki sifat Siddiq, Amanah, Tabligh, dan Fathonah.',
        kategori: 'jati1',
        tanggal: new Date().toISOString(),
        coverImage: 'https://upload.wikimedia.org/wikipedia/id/b/ba/Logo_Hizbul_Wathan.png'
      }
    ];
  },

  subscribeToContents(callback: (contents: Content[]) => void): () => void {
    return firestoreService.subscribeToContents(callback);
  },

  async getContents(section?: string): Promise<Content[]> {
    const isSectionMatch = (cSec: string | undefined, targetSec: string) => {
      const c = (cSec || '').trim().toLowerCase();
      const t = (targetSec || '').trim().toLowerCase();
      if (t === 'galeri' || t === 'video' || t === 'gallery') {
        return c === 'galeri' || c === 'video' || c === 'videos' || c === 'galeri_video' || c === 'galeri-video' || c === 'gallery' || c === 'youtube';
      }
      return c === t;
    };

    if (IS_API_VALID) {
      try {
        const response = await axios.get(`${API_URL}?action=getContents${section ? `&section=${section}` : ''}&_t=${Date.now()}`);
        let apiData: Content[] = [];
        if (Array.isArray(response.data) && response.data.length > 0) {
          apiData = response.data;
        } else if (response.data && Array.isArray(response.data.contents) && response.data.contents.length > 0) {
          apiData = response.data.contents;
        }
        if (apiData.length > 0) {
          const sanitized = apiData
            .map(c => {
            if (isSectionMatch(c.section, 'galeri') && c.field1 && c.field1.includes('dQw4w9WgXcQ')) {
              return {
                ...c,
                field1: 'https://www.youtube.com/watch?v=kR2rXyNf9V8',
                field2: c.field2 === 'Lagu Mars Hizbul Wathan' ? 'Mars Gerakan Kepanduan Hizbul Wathan' : c.field2
              };
            }
            if (c.section === 'playlist') {
              const anyC = c as any;
              let field1 = c.field1 || anyC.audiourl || anyC.audioUrl || '';
              let field2 = c.field2 || anyC.judul || anyC.title || '';
              let field3 = c.field3 || anyC.pencipta || anyC.creator || '';
              let field5 = c.field5 || anyC.lirik || anyC.lyrics || '';
              const lowerTitle = (field2 || '').trim().toLowerCase();

              const isMarsHW = lowerTitle.includes('mars hizbul wathan') || lowerTitle === 'mars hw' || lowerTitle.includes('mars gerakan kepanduan hizbul wathan') || lowerTitle.includes('mars pandu hw');
              const isHymneHW = lowerTitle.includes('hymne');
              const isSangSurya = lowerTitle.includes('sang surya');
              const isMarsAisyiyah = lowerTitle.includes('mars aisyiyah');

              if (lowerTitle === 'sahabat hw' || field1.toLowerCase().includes('sahabathw')) {
                if (!field1) field1 = 'https://hwjateng.org/musik/sahabathw.mp3';
                if (!field2) field2 = 'Sahabat HW';
                field3 = 'Muhammad Dzikron';
                if (!field5) {
                  field5 = 'Bersama kita melangkah\nMenembus cakrawala asa\nSahabat sejati Pandu HW\nSatu hati dalam ukhuwah persaudaraan\n\nDi bumi perkemahan kita bersua\nBelajar mandiri, disiplin, berjiwa ksatria\nSetia pandu, suci pikiran perkataan perbuatan\nHizbul Wathan, sahabat setia sepanjang zaman!';
                }
              } else if (isMarsHW) {
                if (!field3 || field3.toLowerCase().includes('pandu') || field3.toLowerCase().includes('kwar')) {
                  field3 = 'H. Siradj Dahlan';
                }
              } else if (isHymneHW) {
                if (!field3 || field3.toLowerCase().includes('pandu') || field3.toLowerCase().includes('kwar')) {
                  field3 = 'H.M. Affandi';
                }
              } else if (isSangSurya) {
                if (!field3) field3 = 'Djarnawi Hadikusuma';
              } else if (isMarsAisyiyah) {
                if (!field3) field3 = 'Ny. Hj. Siti Badilah Zuber';
              } else {
                // Selain Mars HW dan Hymne HW, pencipta lagunya adalah Muhammad Dzikron
                if (!field3 || field3.toLowerCase().includes('pandu') || field3.toLowerCase().includes('kwar')) {
                  field3 = 'Muhammad Dzikron';
                }
              }
              return {
                ...c,
                field1,
                field2,
                field3,
                field4: '',
                field5,
                pencipta: field3,
                creator: field3,
                lirik: field5,
                lyrics: field5,
                judul: field2,
                title: field2,
                audioUrl: field1,
                audiourl: field1
              };
            }
            return c;
          });
          return section ? sanitized.filter((c: any) => isSectionMatch(c.section, section)) : sanitized;
        }
      } catch (error) {
        console.warn('getContents API error, falling back to Firestore:', (error as any)?.message || error);
      }
    }
    const fsContents = await firestoreService.getContents();
    if (fsContents && fsContents.length > 0) {
      return section ? fsContents.filter((c: any) => isSectionMatch(c.section, section)) : fsContents;
    }
    const mockData = this.getMockContents();
    return section ? mockData.filter((c: any) => isSectionMatch(c.section, section)) : mockData;
  },

  async getGalleryVideos(): Promise<any[]> {
    const isVideoSection = (s: string | undefined) => {
      const clean = (s || '').trim().toLowerCase();
      return clean === 'galeri' || clean === 'video' || clean === 'videos' || clean === 'galeri_video' || clean === 'galeri-video' || clean === 'gallery' || clean === 'youtube';
    };

    const videoMap = new Map<string, any>();

    // 1. Load from Contents
    try {
      const allContents = await this.getContents();
      if (Array.isArray(allContents)) {
        allContents.forEach((c: any) => {
          const rawUrl = (c.field1 || c.videoUrl || c.link || c.url || '').toString().trim();
          const rawTitle = (c.field2 || c.judul || c.title || c.nama || 'Video Hizbul Wathan').toString().trim();
          const vId = extractYoutubeId(rawUrl) || extractYoutubeId(rawTitle);
          if (isVideoSection(c.section) || vId) {
            const finalUrl = rawUrl || (vId ? `https://www.youtube.com/watch?v=${vId}` : '');
            const finalTitle = (rawTitle && rawTitle !== rawUrl) ? rawTitle : 'Video Hizbul Wathan';
            const key = vId || finalUrl || c.id;
            if (key && (finalUrl || vId)) {
              videoMap.set(key, {
                id: c.id || `video-${key}`,
                section: 'galeri',
                field1: finalUrl,
                field2: finalTitle,
                field3: c.field3 || 'Galeri HW',
                field4: c.field4 || '',
                field5: c.field5 || '',
                videoId: vId,
                title: finalTitle,
                url: finalUrl,
                source: 'galeri'
              });
            }
          }
        });
      }
    } catch (e) {
      console.warn('Error loading contents for gallery videos:', e);
    }

    // 2. Load from HW Activities
    try {
      const activities = await this.getActivities();
      if (Array.isArray(activities)) {
        activities.forEach((act: any) => {
          const rawUrl = (act.videoUrl || act.linkVideo || act.youtubeUrl || act.linkYoutube || act.video || '').toString().trim();
          const vId = extractYoutubeId(rawUrl);
          if (vId) {
            const finalTitle = act.namaKegiatan || act.judul || act.nama || 'Dokumentasi Kegiatan HW';
            const finalUrl = rawUrl.startsWith('http') ? rawUrl : `https://www.youtube.com/watch?v=${vId}`;
            const key = vId;
            if (!videoMap.has(key)) {
              videoMap.set(key, {
                id: `act-vid-${act.id || key}`,
                section: 'galeri',
                field1: finalUrl,
                field2: finalTitle,
                field3: act.kategori || 'Kegiatan HW',
                field4: act.tanggal || '',
                field5: act.deskripsi || '',
                videoId: vId,
                title: finalTitle,
                url: finalUrl,
                source: 'kegiatan'
              });
            }
          }
        });
      }
    } catch (e) {
      console.warn('Error loading activities for gallery videos:', e);
    }

    // 3. Fallback defaults if empty
    if (videoMap.size === 0) {
      const defaults = [
        {
          id: 'gal-1',
          section: 'galeri',
          field1: 'https://www.youtube.com/watch?v=kR2rXyNf9V8',
          field2: 'Mars Gerakan Kepanduan Hizbul Wathan',
          field3: 'Lagu Resmi HW',
          videoId: 'kR2rXyNf9V8',
          title: 'Mars Gerakan Kepanduan Hizbul Wathan',
          url: 'https://www.youtube.com/watch?v=kR2rXyNf9V8',
          source: 'galeri'
        },
        {
          id: 'gal-2',
          section: 'galeri',
          field1: 'https://www.youtube.com/watch?v=mD03u6-T9u8',
          field2: 'Profil Kwartir Wilayah HW Jawa Tengah',
          field3: 'Profil HW Jateng',
          videoId: 'mD03u6-T9u8',
          title: 'Profil Kwartir Wilayah HW Jawa Tengah',
          url: 'https://www.youtube.com/watch?v=mD03u6-T9u8',
          source: 'galeri'
        }
      ];
      return defaults;
    }

    return Array.from(videoMap.values());
  },

  async saveContent(content: any): Promise<any> {
    clearSheetsCache('contents');
    clearSheetsCache('playlist');
    updateApiUrlFromStorage();

    const normalized = {
      ...content,
      id: content.id || (content.section === 'playlist' ? `playlist-${Date.now()}` : Date.now().toString()),
      field1: (content.field1 || content.audioUrl || content.audiourl || '').toString().trim(),
      field2: (content.field2 || content.judul || content.title || '').toString().trim(),
      field3: (content.field3 || content.pencipta || content.creator || '').toString().trim(),
      field4: (content.field4 || '').toString().trim(),
      field5: (content.field5 || content.lyrics || content.lirik || '').toString().trim(),
      pencipta: (content.field3 || content.pencipta || content.creator || '').toString().trim(),
      creator: (content.field3 || content.pencipta || content.creator || '').toString().trim(),
      lirik: (content.field5 || content.lyrics || content.lirik || '').toString().trim(),
      lyrics: (content.field5 || content.lyrics || content.lirik || '').toString().trim(),
      judul: (content.field2 || content.judul || content.title || '').toString().trim(),
      title: (content.field2 || content.judul || content.title || '').toString().trim(),
      audioUrl: (content.field1 || content.audioUrl || content.audiourl || '').toString().trim(),
      audiourl: (content.field1 || content.audioUrl || content.audiourl || '').toString().trim()
    };

    // Update Firestore first for fast persistent storage
    const saved = await firestoreService.saveContent(normalized);

    // Update local cache immediately
    try {
      const stored = localStorage.getItem('contents');
      let parsed = stored ? JSON.parse(stored) : [];
      if (!Array.isArray(parsed)) parsed = [];
      const idx = parsed.findIndex((c: any) => c.id === normalized.id || (c.section === normalized.section && (c.field2 || c.judul || '').trim().toLowerCase() === normalized.field2.toLowerCase()));
      if (idx >= 0) {
        parsed[idx] = { ...parsed[idx], ...normalized };
      } else {
        parsed.push(normalized);
      }
      safeStorageSet('contents', parsed);
    } catch (e) {}

    // Force save to Google Spreadsheet via Apps Script API
    let spreadsheetSynced = false;
    if (IS_API_VALID) {
      try {
        const promises: Promise<any>[] = [this.post({ action: 'saveContent', ...normalized })];
        if (normalized.section === 'playlist') {
          promises.push(this.post({ action: 'savePlaylistItem', ...normalized }));
        }
        const results = await Promise.allSettled(promises);
        spreadsheetSynced = results.some(r => r.status === 'fulfilled');
        console.log('[SHEETS] Save content result:', { normalizedId: normalized.id, spreadsheetSynced, results });
      } catch (err) {
        console.warn('[SHEETS] Google Apps Script saveContent error:', err);
      }
    }

    return { success: true, content: saved || normalized, spreadsheetSynced };
  },

  async savePlaylistItem(item: any): Promise<any> {
    return this.saveContent({
      ...item,
      section: 'playlist',
      type: 'list'
    });
  },

  async deleteContent(id: string): Promise<any> {
    clearSheetsCache('contents');
    clearSheetsCache('playlist');
    if (IS_API_VALID) {
      Promise.allSettled([
        this.post({ action: 'deletePlaylistItem', id }),
        this.post({ action: 'deleteContent', id })
      ]).catch(() => {});
    }
    await firestoreService.deleteContent(id);
    return { success: true };
  },
  
  async getSettings(): Promise<any> {
    const localSettle = localStorage.getItem('hw_settings');
    let localParsed = null;
    if (localSettle) {
      try {
        localParsed = JSON.parse(localSettle);
        if (localParsed) {
          let updated = false;
          if (localParsed.ktaTemplateFront && (localParsed.ktaTemplateFront.includes('1OsI7x7zw') || localParsed.ktaTemplateFront.includes('1yeEeoE') || localParsed.ktaTemplateFront.includes('1OsI7x7zw-2BbckWntz_jkpGZyY94Z-7U') || localParsed.ktaTemplateFront.includes('design_card-depan.jpg'))) {
            localParsed.ktaTemplateFront = 'https://hwjateng.com/wp-content/uploads/2026/07/depan.png';
            updated = true;
          }
          if (localParsed.ktaTemplateBack && (localParsed.ktaTemplateBack.includes('1yeEeoE') || localParsed.ktaTemplateBack.includes('1OsI7x7zw') || localParsed.ktaTemplateBack.includes('1yeEeoE_SlV0npvu681GYKBxxKzuujiz1') || localParsed.ktaTemplateBack.includes('design_card-depan.jpg'))) {
            localParsed.ktaTemplateBack = 'https://hwjateng.com/wp-content/uploads/2026/07/Belakang.jpg';
            updated = true;
          }
          if (updated) {
            safeStorageSet('hw_settings', localParsed);
          }
        }
      } catch (e) {
        console.error('Failed to parse local settings', e);
      }
    }

    const safeParse = (val: any, fallback: any) => {
      if (!val) return fallback;
      if (typeof val === 'string') {
        const trimmed = val.trim();
        if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
          try {
            return JSON.parse(trimmed);
          } catch (e) {
            console.error('Failed to parse JSON setting', e);
          }
        }
        if (trimmed.includes(',')) {
          return trimmed.split(',').map((x: string) => x.trim()).filter(Boolean);
        }
        if (trimmed === '') return fallback;
        return [trimmed];
      }
      if (Array.isArray(val)) {
        return val;
      }
      return fallback;
    };

    const DEFAULT_TYPES = DEFAULT_TRAINING_TYPES;
    const DEFAULT_ACTIVITIES: any[] = [DEFAULT_JM1_SOLO_ACTIVITY];

    const fsSettings = await firestoreService.getSettings();

    const cleanKtaFront = (url?: string) => getSafeKtaFront(url);
    const cleanKtaBack = (url?: string) => getSafeKtaBack(url);

    if (!IS_API_VALID) {
      const parsed = fsSettings || localParsed || { 
        appName: 'HW App', 
        orgName: 'HW Org', 
        waConfirmation: '628',
        lastBackup: '-',
        ktaTemplateFront: DEFAULT_LOCAL_KTA_FRONT,
        ktaTemplateBack: DEFAULT_LOCAL_KTA_BACK,
        ktaKetuaNama: 'TAUFIQ',
        ktaKetuaNbm: 'NBM 1015096',
        ktaSekretarisNama: 'MUHAMMAD DZIKRON',
        ktaSekretarisNbm: 'NBM 1029863',
        ktaKotaPenerbit: 'Semarang',
        ktaTandaTanganKetua: '',
        ktaTandaTanganSekretaris: '',
        ktaStempelImage: '',
        trainingTypes: DEFAULT_TYPES,
        trainingActivities: DEFAULT_ACTIVITIES,
        trainingLocations: ['Gedung Dakwah Muhammadiyah Jateng', 'Kwarda Banyumas', 'Pusdiklat HW Jateng'],
        trainingDates: ['12-14 Juli 2026', '1-3 Agustus 2026', '15-17 September 2026'],
        upgradeFees: DEFAULT_UPGRADE_FEES
      };
      const result = {
        ...parsed,
        ktaTemplateFront: cleanKtaFront(parsed.ktaTemplateFront || parsed.ktaFrontBg),
        ktaTemplateBack: cleanKtaBack(parsed.ktaTemplateBack || parsed.ktaBackBg),
        ktaFrontBg: cleanKtaFront(parsed.ktaTemplateFront || parsed.ktaFrontBg),
        ktaBackBg: cleanKtaBack(parsed.ktaTemplateBack || parsed.ktaBackBg),
        ktaKetuaNama: parsed.ktaKetuaNama || 'TAUFIQ',
        ktaKetuaNbm: parsed.ktaKetuaNbm || 'NBM 1015096',
        ktaSekretarisNama: parsed.ktaSekretarisNama || 'MUHAMMAD DZIKRON',
        ktaSekretarisNbm: parsed.ktaSekretarisNbm || 'NBM 1029863',
        ktaKotaPenerbit: parsed.ktaKotaPenerbit || 'Semarang',
        ktaTandaTanganKetua: parsed.ktaTandaTanganKetua || '',
        ktaTandaTanganSekretaris: parsed.ktaTandaTanganSekretaris || '',
        ktaStempelImage: parsed.ktaStempelImage || '',
        trainingTypes: safeParse(parsed.trainingTypes, DEFAULT_TYPES),
        trainingActivities: safeParse(parsed.trainingActivities, DEFAULT_ACTIVITIES),
        trainingLocations: safeParse(parsed.trainingLocations, ['Gedung Dakwah Muhammadiyah Jateng', 'Kwarda Banyumas', 'Pusdiklat HW Jateng']),
        trainingDates: safeParse(parsed.trainingDates, ['12-14 Juli 2026', '1-3 Agustus 2026', '15-17 September 2026']),
        upgradeFees: safeParse(parsed.upgradeFees, DEFAULT_UPGRADE_FEES),
        preTestSettings: parseTestScheduleSettings(parsed.preTestSettings, DEFAULT_PRE_TEST_SETTINGS),
        postTestSettings: parseTestScheduleSettings(parsed.postTestSettings, DEFAULT_POST_TEST_SETTINGS),
        trainingQuestions: safeParse(parsed.trainingQuestions, DEFAULT_50_QUESTIONS),
        assignedTasks: safeParse(parsed.assignedTasks, [])
      };
      safeStorageSet('hw_settings', result);
      return result;
    }
    try {
      const response = await axios.get(`${API_URL}?action=getSettings&_t=${Date.now()}`, { timeout: 15000 });
      const apiSettings = response.data || {};
      const merged = {
        ...fsSettings,
        ...apiSettings,
        appName: apiSettings.appName || fsSettings?.appName || 'HW App',
        orgName: apiSettings.orgName || fsSettings?.orgName || 'HW Org',
        waConfirmation: apiSettings.waConfirmation || fsSettings?.waConfirmation || '628',
        lastBackup: apiSettings.lastBackup || fsSettings?.lastBackup || '-',
        ktaTemplateFront: cleanKtaFront(apiSettings.ktaTemplateFront || fsSettings?.ktaTemplateFront || apiSettings.ktaFrontBg || fsSettings?.ktaFrontBg),
        ktaTemplateBack: cleanKtaBack(apiSettings.ktaTemplateBack || fsSettings?.ktaTemplateBack || apiSettings.ktaBackBg || fsSettings?.ktaBackBg),
        ktaFrontBg: cleanKtaFront(apiSettings.ktaTemplateFront || fsSettings?.ktaTemplateFront || apiSettings.ktaFrontBg || fsSettings?.ktaFrontBg),
        ktaBackBg: cleanKtaBack(apiSettings.ktaTemplateBack || fsSettings?.ktaTemplateBack || apiSettings.ktaBackBg || fsSettings?.ktaBackBg),
        ktaKetuaNama: apiSettings.ktaKetuaNama || fsSettings?.ktaKetuaNama || 'TAUFIQ',
        ktaKetuaNbm: apiSettings.ktaKetuaNbm || fsSettings?.ktaKetuaNbm || 'NBM 1015096',
        ktaSekretarisNama: apiSettings.ktaSekretarisNama || fsSettings?.ktaSekretarisNama || 'MUHAMMAD DZIKRON',
        ktaSekretarisNbm: apiSettings.ktaSekretarisNbm || fsSettings?.ktaSekretarisNbm || 'NBM 1029863',
        ktaKotaPenerbit: apiSettings.ktaKotaPenerbit || fsSettings?.ktaKotaPenerbit || 'Semarang',
        ktaTandaTanganKetua: apiSettings.ktaTandaTanganKetua || fsSettings?.ktaTandaTanganKetua || '',
        ktaTandaTanganSekretaris: apiSettings.ktaTandaTanganSekretaris || fsSettings?.ktaTandaTanganSekretaris || '',
        ktaStempelImage: apiSettings.ktaStempelImage || fsSettings?.ktaStempelImage || '',
        trainingTypes: safeParse(apiSettings.trainingTypes || fsSettings?.trainingTypes, DEFAULT_TYPES),
        trainingActivities: safeParse(apiSettings.trainingActivities || fsSettings?.trainingActivities, DEFAULT_ACTIVITIES),
        trainingLocations: safeParse(apiSettings.trainingLocations || fsSettings?.trainingLocations, ['Gedung Dakwah Muhammadiyah Jateng', 'Kwarda Banyumas', 'Pusdiklat HW Jateng']),
        trainingDates: safeParse(apiSettings.trainingDates || fsSettings?.trainingDates, ['12-14 Juli 2026', '1-3 Agustus 2026', '15-17 September 2026']),
        upgradeFees: safeParse(apiSettings.upgradeFees || fsSettings?.upgradeFees, DEFAULT_UPGRADE_FEES),
        preTestSettings: parseTestScheduleSettings(apiSettings.preTestSettings || fsSettings?.preTestSettings, DEFAULT_PRE_TEST_SETTINGS),
        postTestSettings: parseTestScheduleSettings(apiSettings.postTestSettings || fsSettings?.postTestSettings, DEFAULT_POST_TEST_SETTINGS),
        trainingQuestions: safeParse(apiSettings.trainingQuestions || fsSettings?.trainingQuestions, DEFAULT_50_QUESTIONS),
        assignedTasks: safeParse(apiSettings.assignedTasks || fsSettings?.assignedTasks, [])
      };
      safeStorageSet('hw_settings', merged);
      return merged;
    } catch (error) {
      console.warn('getSettings API error, falling back to local settings:', (error as any)?.message || error);
      const parsed = fsSettings || localParsed || { 
        appName: 'HW App', 
        orgName: 'HW Org', 
        lastBackup: '-',
        ktaTemplateFront: DEFAULT_LOCAL_KTA_FRONT,
        ktaTemplateBack: DEFAULT_LOCAL_KTA_BACK,
        ktaKetuaNama: 'TAUFIQ',
        ktaKetuaNbm: 'NBM 1015096',
        ktaSekretarisNama: 'MUHAMMAD DZIKRON',
        ktaSekretarisNbm: 'NBM 1029863',
        ktaKotaPenerbit: 'Semarang',
        ktaTandaTanganKetua: '',
        ktaTandaTanganSekretaris: '',
        ktaStempelImage: '',
        trainingTypes: DEFAULT_TYPES,
        trainingActivities: DEFAULT_ACTIVITIES,
        trainingLocations: ['Gedung Dakwah Muhammadiyah Jateng', 'Kwarda Banyumas', 'Pusdiklat HW Jateng'],
        trainingDates: ['12-14 Juli 2026', '1-3 Agustus 2026', '15-17 September 2026'],
        upgradeFees: DEFAULT_UPGRADE_FEES
      };
      return {
        ...parsed,
        ktaTemplateFront: cleanKtaFront(parsed.ktaTemplateFront || parsed.ktaFrontBg),
        ktaTemplateBack: cleanKtaBack(parsed.ktaTemplateBack || parsed.ktaBackBg),
        ktaFrontBg: cleanKtaFront(parsed.ktaTemplateFront || parsed.ktaFrontBg),
        ktaBackBg: cleanKtaBack(parsed.ktaTemplateBack || parsed.ktaBackBg),
        ktaKetuaNama: parsed.ktaKetuaNama || 'TAUFIQ',
        ktaKetuaNbm: parsed.ktaKetuaNbm || 'NBM 1015096',
        ktaSekretarisNama: parsed.ktaSekretarisNama || 'MUHAMMAD DZIKRON',
        ktaSekretarisNbm: parsed.ktaSekretarisNbm || 'NBM 1029863',
        ktaKotaPenerbit: parsed.ktaKotaPenerbit || 'Semarang',
        ktaTandaTanganKetua: parsed.ktaTandaTanganKetua || '',
        ktaTandaTanganSekretaris: parsed.ktaTandaTanganSekretaris || '',
        ktaStempelImage: parsed.ktaStempelImage || '',
        trainingTypes: safeParse(parsed.trainingTypes, DEFAULT_TYPES),
        trainingActivities: safeParse(parsed.trainingActivities, DEFAULT_ACTIVITIES),
        trainingLocations: safeParse(parsed.trainingLocations, ['Gedung Dakwah Muhammadiyah Jateng', 'Kwarda Banyumas', 'Pusdiklat HW Jateng']),
        trainingDates: safeParse(parsed.trainingDates, ['12-14 Juli 2026', '1-3 Agustus 2026', '15-17 September 2026']),
        upgradeFees: safeParse(parsed.upgradeFees, DEFAULT_UPGRADE_FEES),
        preTestSettings: parseTestScheduleSettings(parsed.preTestSettings, DEFAULT_PRE_TEST_SETTINGS),
        postTestSettings: parseTestScheduleSettings(parsed.postTestSettings, DEFAULT_POST_TEST_SETTINGS),
        trainingQuestions: safeParse(parsed.trainingQuestions, DEFAULT_50_QUESTIONS),
        assignedTasks: safeParse(parsed.assignedTasks, [])
      };
    }
  },

  subscribeToSettings(callback: (settings: any) => void): () => void {
    return firestoreService.subscribeToSettings(callback);
  },

  async saveSettings(settings: any): Promise<any> {
    const normalizedSettings = {
      ...settings,
      preTestSettings: parseTestScheduleSettings(settings.preTestSettings, DEFAULT_PRE_TEST_SETTINGS),
      postTestSettings: parseTestScheduleSettings(settings.postTestSettings, DEFAULT_POST_TEST_SETTINGS)
    };
    safeStorageSet('hw_settings', normalizedSettings);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('hw_settings_updated', { detail: normalizedSettings }));
    }
    try {
      await firestoreService.saveSettings(normalizedSettings);
    } catch (e) {
      console.warn('saveSettings Firestore error:', e);
    }

    if (!IS_API_VALID) {
      return { success: true };
    }

    const serializedSettings: any = {};
    for (const key in normalizedSettings) {
      if (Array.isArray(normalizedSettings[key]) || typeof normalizedSettings[key] === 'object') {
        serializedSettings[key] = JSON.stringify(normalizedSettings[key]);
      } else {
        serializedSettings[key] = normalizedSettings[key];
      }
    }

    try {
      return await this.post({
        action: 'saveSettings',
        settings: serializedSettings
      });
    } catch (e) {
      console.warn('saveSettings Sheets API error:', e);
      return { success: true };
    }
  },

  async syncDatabase(): Promise<any> {
    updateApiUrlFromStorage();
    if (IS_API_VALID) {
      try {
        const actApps = await firestoreService.getActivityApplications();
        if (actApps && actApps.length > 0) {
          for (const a of actApps) {
            await this.post({ action: 'registerActivity', ...a }).catch((e) => console.warn('syncDatabase registerActivity warning:', e));
          }
        }
        await this.post({ action: 'syncDatabase' }).catch((e) => console.warn('syncDatabase GAS warning:', e));
      } catch (e) {
        console.warn('syncDatabase error:', e);
      }
    }
    return await firestoreService.backupAndUploadAllToFirestore();
  },

  async deletePendingKtaApplications(): Promise<any> {
    return await firestoreService.deletePendingKtaApplications();
  },

  async syncApprovedKtasToMembers(): Promise<any> {
    if (IS_API_VALID) {
      this.post({ action: 'syncApprovedKtasToMembers' }).catch(e => console.warn('Background syncApprovedKtasToMembers warning:', e));
    }
    return await firestoreService.syncApprovedKtasToMembers();
  },

  async backupNow(): Promise<any> {
    if (IS_API_VALID) {
      try {
        const actApps = await firestoreService.getActivityApplications();
        if (actApps && actApps.length > 0) {
          actApps.forEach(a => {
            this.post({ action: 'registerActivity', ...a }).catch(() => {});
          });
        }
        const res = await this.post({ action: 'backupNow' });
        if (res && res.success) {
          // Also back up Firestore in background
          firestoreService.backupAndUploadAllToFirestore().catch(() => {});
          return res;
        }
      } catch (e) {
        console.warn('Sheets backupNow warning, falling back to Firestore backup:', e);
      }
    }
    return await firestoreService.backupAndUploadAllToFirestore();
  },

  // --- KEGIATAN HW JATENG METHODS ---
  async getActivityCategories(): Promise<string[]> {
    try {
      const fsCats = await firestoreService.getActivityCategories();
      if (fsCats && fsCats.length > 0) return fsCats;
    } catch (e) {
      console.warn('getActivityCategories Firestore error:', e);
    }
    if (IS_API_VALID) {
      try {
        const response = await this.fetch('getActivityCategories');
        if (Array.isArray(response) && response.length > 0) return response;
      } catch (e) {
        console.warn('getActivityCategories Sheets API error:', e);
      }
    }
    return await firestoreService.getActivityCategories();
  },

  async saveActivityCategory(categoryName: string): Promise<string[]> {
    const fsResult = await firestoreService.saveActivityCategory(categoryName);
    if (IS_API_VALID) {
      this.post({ action: 'saveActivityCategory', name: categoryName, categoryName }).catch(e => console.warn('saveActivityCategory Sheets API warning:', e));
    }
    return fsResult;
  },

  async deleteActivityCategory(categoryName: string): Promise<string[]> {
    const fsResult = await firestoreService.deleteActivityCategory(categoryName);
    if (IS_API_VALID) {
      this.post({ action: 'deleteActivityCategory', name: categoryName, categoryName }).catch(e => console.warn('deleteActivityCategory Sheets API warning:', e));
    }
    return fsResult;
  },

  subscribeToActivityCategories(callback: (categories: string[]) => void): () => void {
    return firestoreService.subscribeToActivityCategories(callback);
  },

  subscribeToActivities(callback: (activities: any[]) => void): () => void {
    return firestoreService.subscribeToActivities(callback);
  },

  subscribeToActivityApplications(callback: (apps: any[]) => void): () => void {
    if (IS_API_VALID) {
      this.getActivityApplications().then(apps => {
        if (apps && apps.length > 0) callback(apps);
      }).catch(() => {});
    }
    return firestoreService.subscribeToActivityApplications(callback);
  },

  subscribeToTrainingApplications(callback: (apps: any[]) => void): () => void {
    return firestoreService.subscribeToTrainingApplications(callback);
  },

  async getActivities(): Promise<any[]> {
    return cachedFetch('activities', async () => {
      const fsActs = await firestoreService.getActivities();
      if (!IS_API_VALID) return fsActs;
      try {
        const response = await axios.get(`${API_URL}?action=getActivities&_t=${Date.now()}`, { timeout: 15000 });
        if (Array.isArray(response.data) && response.data.length > 0) {
          const map = new Map<string, any>();
          fsActs.forEach(a => { if (a && a.id) map.set(a.id, a); });

        response.data.forEach((sheetAct: any, idx: number) => {
          if (!sheetAct) return;
          const sheetTitle = sheetAct.namakegiatan || sheetAct.namaKegiatan || sheetAct.title || sheetAct.jenispelatihan || sheetAct.jenisPelatihan || sheetAct.judul || '';
          const sheetLoc = sheetAct.lokasipelatihan || sheetAct.lokasiPelatihan || sheetAct.lokasi || sheetAct.location || '';
          const sheetDate = sheetAct.tanggalpelatihan || sheetAct.tanggalPelatihan || sheetAct.tanggal || sheetAct.startDate || '';
          const sheetBiaya = sheetAct.biayapelatihan || sheetAct.biayaPelatihan || sheetAct.biaya || 'Gratis';
          const sheetDesc = sheetAct.deskripsi || sheetAct.description || '';
          const sheetCat = sheetAct.kategori || sheetAct.category || 'Silaturahmi';
          const sheetImg = sheetAct.gambarurl || sheetAct.gambarUrl || sheetAct.imageurl || sheetAct.imageUrl || sheetAct.gambar || sheetAct.posterurl || sheetAct.posterUrl || sheetAct.coverimage || sheetAct.coverImage || sheetAct.banner || '';
          const sheetSongUrl = sheetAct.themesongurl || sheetAct.themeSongUrl || sheetAct.themesong || sheetAct.themeSong || '';
          const sheetSongTitle = sheetAct.themesongtitle || sheetAct.themeSongTitle || sheetAct.themesongname || sheetAct.themeSongName || '';
          const sheetProposal = sheetAct.proposalurl || sheetAct.proposalUrl || sheetAct.proposal || sheetAct.linkproposal || sheetAct.linkProposal || '';
          const sheetRekening = sheetAct.rekeningpembayaran || sheetAct.rekeningPembayaran || sheetAct.rekeningpembiayaan || sheetAct.rekeningPembiayaan || sheetAct.nomorrekening || sheetAct.nomorRekening || sheetAct.rekening || '';
          const sheetKonfirmasi = sheetAct.nowhatsapppanitia || sheetAct.noWhatsappPanitia || sheetAct.konfirmasipembayaran || sheetAct.konfirmasiPembayaran || sheetAct.nowakonfirmasi || sheetAct.noWaKonfirmasi || sheetAct.nowa || '';
          const sheetYoutube = sheetAct.youtubeurl || sheetAct.youtubeUrl || sheetAct.videourl || sheetAct.videoUrl || sheetAct.youtube || sheetAct.linkyoutube || sheetAct.linkYoutube || sheetAct.video || '';
          const sheetKuota = sheetAct.kuota || sheetAct.quota || sheetAct.kapasitas || 'Terbuka';
          const sheetPenyelenggara = sheetAct.penyelenggara || sheetAct.panitia || 'Kwartir Wilayah HW Jawa Tengah';

          if (!sheetTitle && !sheetLoc && !sheetDate) return;

          const actId = (sheetAct.id || sheetAct.Id || sheetAct.activityId || (`keg-sheet-${idx}-${Date.now().toString().slice(-4)}`)).toString().trim();
          const fsAct = map.get(actId);

          if (fsAct) {
            const fsTime = new Date(fsAct.updatedAt || fsAct.createdAt || 0).getTime();
            const sheetTime = new Date(sheetAct.updatedAt || sheetAct.createdat || 0).getTime();

            if (fsTime >= sheetTime && fsTime > 0) {
              const merged = {
                ...sheetAct,
                ...fsAct,
                id: actId,
                namaKegiatan: fsAct.namaKegiatan || fsAct.title || sheetTitle,
                title: fsAct.namaKegiatan || fsAct.title || sheetTitle,
                lokasi: fsAct.lokasi || fsAct.lokasiPelatihan || sheetLoc,
                location: fsAct.lokasi || fsAct.lokasiPelatihan || sheetLoc,
                lokasiPelatihan: fsAct.lokasi || fsAct.lokasiPelatihan || sheetLoc,
                tanggal: fsAct.tanggal || fsAct.tanggalPelatihan || sheetDate,
                startDate: fsAct.tanggal || fsAct.tanggalPelatihan || sheetDate,
                tanggalPelatihan: fsAct.tanggal || fsAct.tanggalPelatihan || sheetDate,
                biaya: fsAct.biaya || fsAct.biayaPelatihan || sheetBiaya,
                biayaPelatihan: fsAct.biaya || fsAct.biayaPelatihan || sheetBiaya,
                kuota: fsAct.kuota || sheetKuota,
                penyelenggara: fsAct.penyelenggara || sheetPenyelenggara,
                deskripsi: fsAct.deskripsi || fsAct.description || sheetDesc,
                description: fsAct.deskripsi || fsAct.description || sheetDesc,
                kategori: fsAct.kategori || fsAct.category || sheetCat,
                category: fsAct.kategori || fsAct.category || sheetCat,
                gambarUrl: pickValidImageUrl(fsAct.gambarUrl || fsAct.imageUrl || fsAct.gambar || fsAct.posterUrl || fsAct.coverImage, sheetImg),
                imageUrl: pickValidImageUrl(fsAct.gambarUrl || fsAct.imageUrl || fsAct.gambar || fsAct.posterUrl || fsAct.coverImage, sheetImg),
                youtubeUrl: fsAct.youtubeUrl || fsAct.videoUrl || fsAct.youtube || sheetYoutube,
                videoUrl: fsAct.youtubeUrl || fsAct.videoUrl || fsAct.youtube || sheetYoutube,
                themeSongUrl: fsAct.themeSongUrl || fsAct.themeSong || sheetSongUrl,
                themeSongTitle: fsAct.themeSongTitle || fsAct.themeSongName || sheetSongTitle,
                proposalUrl: fsAct.proposalUrl || fsAct.proposal || sheetProposal,
                rekeningPembayaran: fsAct.rekeningPembayaran || fsAct.rekeningPembiayaan || sheetRekening,
                rekeningPembiayaan: fsAct.rekeningPembayaran || fsAct.rekeningPembiayaan || sheetRekening,
                noWhatsappPanitia: fsAct.noWhatsappPanitia || fsAct.konfirmasiPembayaran || sheetKonfirmasi,
                konfirmasiPembayaran: fsAct.noWhatsappPanitia || fsAct.konfirmasiPembayaran || sheetKonfirmasi
              };
              map.set(actId, merged);
            } else {
              const merged = {
                ...fsAct,
                ...sheetAct,
                id: actId,
                namaKegiatan: sheetTitle || fsAct.namaKegiatan || fsAct.title,
                title: sheetTitle || fsAct.namaKegiatan || fsAct.title,
                lokasi: sheetLoc || fsAct.lokasi || fsAct.lokasiPelatihan,
                location: sheetLoc || fsAct.lokasi || fsAct.lokasiPelatihan,
                lokasiPelatihan: sheetLoc || fsAct.lokasi || fsAct.lokasiPelatihan,
                tanggal: sheetDate || fsAct.tanggal || fsAct.tanggalPelatihan,
                startDate: sheetDate || fsAct.tanggal || fsAct.tanggalPelatihan,
                tanggalPelatihan: sheetDate || fsAct.tanggal || fsAct.tanggalPelatihan,
                biaya: sheetBiaya || fsAct.biaya || fsAct.biayaPelatihan,
                biayaPelatihan: sheetBiaya || fsAct.biaya || fsAct.biayaPelatihan,
                kuota: sheetKuota || fsAct.kuota,
                penyelenggara: sheetPenyelenggara || fsAct.penyelenggara,
                deskripsi: sheetDesc || fsAct.deskripsi || fsAct.description,
                description: sheetDesc || fsAct.deskripsi || fsAct.description,
                kategori: sheetCat || fsAct.kategori || fsAct.category,
                category: sheetCat || fsAct.kategori || fsAct.category,
                gambarUrl: pickValidImageUrl(sheetImg, fsAct.gambarUrl || fsAct.imageUrl || fsAct.gambar || fsAct.posterUrl || fsAct.coverImage),
                imageUrl: pickValidImageUrl(sheetImg, fsAct.gambarUrl || fsAct.imageUrl || fsAct.gambar || fsAct.posterUrl || fsAct.coverImage),
                youtubeUrl: sheetYoutube || fsAct.youtubeUrl || fsAct.videoUrl || fsAct.youtube || '',
                videoUrl: sheetYoutube || fsAct.youtubeUrl || fsAct.videoUrl || fsAct.youtube || '',
                themeSongUrl: sheetSongUrl || fsAct.themeSongUrl || fsAct.themeSong,
                themeSongTitle: sheetSongTitle || fsAct.themeSongTitle || fsAct.themeSongName,
                proposalUrl: sheetProposal || fsAct.proposalUrl || fsAct.proposal,
                rekeningPembayaran: sheetRekening || fsAct.rekeningPembayaran || fsAct.rekeningPembiayaan,
                rekeningPembiayaan: sheetRekening || fsAct.rekeningPembayaran || fsAct.rekeningPembiayaan,
                noWhatsappPanitia: sheetKonfirmasi || fsAct.noWhatsappPanitia || fsAct.konfirmasiPembayaran,
                konfirmasiPembayaran: sheetKonfirmasi || fsAct.noWhatsappPanitia || fsAct.konfirmasiPembayaran
              };
              map.set(actId, merged);
              firestoreService.saveActivity(merged).catch(() => {});
            }
          } else {
            const normalizedSheetAct = {
              ...sheetAct,
              id: actId,
              namaKegiatan: sheetTitle,
              title: sheetTitle,
              lokasi: sheetLoc,
              location: sheetLoc,
              lokasiPelatihan: sheetLoc,
              tanggal: sheetDate,
              startDate: sheetDate,
              tanggalPelatihan: sheetDate,
              biaya: sheetBiaya || 'Gratis',
              biayaPelatihan: sheetBiaya || 'Gratis',
              kuota: sheetKuota,
              penyelenggara: sheetPenyelenggara,
              deskripsi: sheetDesc,
              description: sheetDesc,
              kategori: sheetCat || 'Silaturahmi',
              category: sheetCat || 'Silaturahmi',
              gambarUrl: pickValidImageUrl(sheetImg),
              imageUrl: pickValidImageUrl(sheetImg),
              youtubeUrl: sheetYoutube,
              videoUrl: sheetYoutube,
              themeSongUrl: sheetSongUrl,
              themeSongTitle: sheetSongTitle,
              proposalUrl: sheetProposal,
              rekeningPembayaran: sheetRekening || 'Bank Syariah Indonesia (BSI) 7307427448 a.n. Kwarwil HW Jateng',
              rekeningPembiayaan: sheetRekening || 'Bank Syariah Indonesia (BSI) 7307427448 a.n. Kwarwil HW Jateng',
              noWhatsappPanitia: sheetKonfirmasi || '089688754000',
              konfirmasiPembayaran: sheetKonfirmasi || '089688754000',
              status: sheetAct.status || 'Buka'
            };
            map.set(actId, normalizedSheetAct);
            firestoreService.saveActivity(normalizedSheetAct).catch(() => {});
          }
        });

        return sortActivitiesNewestFirst(Array.from(map.values()));
      }
      return sortActivitiesNewestFirst(fsActs);
    } catch (e) {
      console.warn('getActivities Sheets API error:', e);
      return sortActivitiesNewestFirst(fsActs);
    }
  }, 20000);
},

  async saveActivity(activityData: any): Promise<any> {
    clearSheetsCache('activities');
    const actId = activityData.id || `keg-${Date.now()}`;
    const nowIso = new Date().toISOString();
    const titleVal = activityData.namaKegiatan || activityData.title || activityData.jenisPelatihan || '';
    const descVal = activityData.deskripsi || activityData.description || '';
    const locVal = activityData.lokasi || activityData.lokasiPelatihan || activityData.location || '';
    const dateVal = activityData.tanggal || activityData.tanggalPelatihan || activityData.startDate || '';
    const biayaVal = activityData.biaya || activityData.biayaPelatihan || 'Gratis';
    const catVal = activityData.kategori || activityData.category || 'Silaturahmi';
    const kuotaVal = activityData.kuota || 'Terbuka';
    const imgVal = activityData.gambarUrl || activityData.imageUrl || 'https://images.unsplash.com/photo-1510312305653-8ed496efae75?auto=format&fit=crop&q=80&w=800';
    const youtubeUrlVal = activityData.youtubeUrl || activityData.videoUrl || activityData.youtube || activityData.linkYoutube || '';
    const songUrlVal = activityData.themeSongUrl || activityData.themeSong || '';
    const songTitleVal = activityData.themeSongTitle || activityData.themeSongName || '';
    const proposalVal = activityData.proposalUrl || activityData.proposal || activityData.linkProposal || '';
    const rekeningVal = activityData.rekeningPembayaran || activityData.rekeningPembiayaan || 'Bank Syariah Indonesia (BSI) 7307427448 a.n. Kwarwil HW Jateng';
    const konfirmasiVal = activityData.noWhatsappPanitia || activityData.konfirmasiPembayaran || '089688754000';

    const normalizedPayload = {
      ...activityData,
      id: actId,
      namaKegiatan: titleVal,
      title: titleVal,
      deskripsi: descVal,
      description: descVal,
      lokasi: locVal,
      location: locVal,
      lokasiPelatihan: locVal,
      tanggal: dateVal,
      startDate: dateVal,
      tanggalPelatihan: dateVal,
      biaya: biayaVal,
      biayaPelatihan: biayaVal,
      kuota: kuotaVal,
      kategori: catVal,
      category: catVal,
      gambarUrl: imgVal,
      imageUrl: imgVal,
      youtubeUrl: youtubeUrlVal,
      videoUrl: youtubeUrlVal,
      themeSongUrl: songUrlVal,
      themeSong: songUrlVal,
      themeSongTitle: songTitleVal,
      themeSongName: songTitleVal,
      proposalUrl: proposalVal,
      proposal: proposalVal,
      linkProposal: proposalVal,
      rekeningPembayaran: rekeningVal,
      rekeningPembiayaan: rekeningVal,
      noWhatsappPanitia: konfirmasiVal,
      konfirmasiPembayaran: konfirmasiVal,
      updatedAt: nowIso
    };

    const saved = await firestoreService.saveActivity(normalizedPayload);
    if (IS_API_VALID) {
      this.post({ action: 'saveActivity', ...normalizedPayload }).catch(e => console.warn('saveActivity Sheets API warning:', e));
    }
    return saved || normalizedPayload;
  },

  async deleteActivity(id: string, title?: string): Promise<boolean> {
    clearSheetsCache('activities');
    const res = await firestoreService.deleteActivity(id, title);
    if (IS_API_VALID) {
      this.post({ action: 'deleteActivity', id }).catch(e => console.warn('deleteActivity Sheets API warning:', e));
    }
    return res;
  },

  async getActivityApplications(): Promise<any[]> {
    return cachedFetch('activityApplications', async () => {
      updateApiUrlFromStorage();
      const fsApps = await firestoreService.getActivityApplications();
      if (!IS_API_VALID) {
        return fsApps;
      }

      try {
        const response = await axios.get(`${API_URL}?action=getActivityApplications&_t=${Date.now()}`, { timeout: 15000 });
        let apiApps: any[] = [];
        if (Array.isArray(response.data) && response.data.length > 0) {
          apiApps = response.data.map((item: any, idx: number) => {
            return {
              id: item.id || item.Id || `actreg-api-${idx}`,
              activityId: item.activityId || item.activityid || item.kegiatanId || 'keg-silaturahmi-pelatih',
              namaKegiatan: item.namaKegiatan || item.namakegiatan || item.title || '',
              userId: item.userId || item.userid || '',
              namaLengkap: item.namaLengkap || item.namalengkap || item.nama || '',
              email: item.email || item.Email || '',
              unsur: item.unsur || item.Unsur || '',
              utusan: item.utusan || item.Utusan || '',
              qabilahPtma: item.qabilahPtma || item.qabilahptma || '',
              jabatan: item.jabatan || item.Jabatan || '',
              kategoriUndangan: item.kategoriUndangan || item.kategoriundangan || '',
              noHp: item.noHp || item.nohp || item.noWa || item.nowa || '',
              asalKwarda: item.asalKwarda || item.asalkwarda || '',
              qabilah: item.qabilah || item.Qabilah || '',
              status: item.status || 'approved',
              tanggalDaftar: item.tanggalDaftar || item.tanggaldaftar || new Date().toISOString()
            };
          }).filter((item: any) => {
            const name = (item.namaLengkap || item.nama || '').trim();
            return name && name !== '-' && name.toLowerCase() !== 'tanpa nama' && item.status !== 'deleted';
          });

          apiApps.forEach(app => firestoreService.registerActivity(app).catch(() => {}));
        }

        // Auto-sync any local/firestore applications to Sheets if Sheets is missing them in background
        const missingApps = fsApps.filter(fsApp => {
          const normN = (n: string) => String(n || '').toLowerCase().replace(/[^a-z0-9]/g, '');
          const normP = (p: string) => String(p || '').replace(/\D/g, '').replace(/^(0|62)/, '');
          const fsName = normN(fsApp.namaLengkap);
          const fsPhone = normP(fsApp.noHp);
          
          return !apiApps.some(apiApp => {
            if (fsApp.id && apiApp.id && fsApp.id === apiApp.id) return true;
            const apiName = normN(apiApp.namaLengkap);
            const apiPhone = normP(apiApp.noHp);
            if (fsPhone && apiPhone && fsPhone === apiPhone && fsPhone.length >= 7) return true;
            if (fsName && apiName && fsName === apiName && fsName.length >= 3) return true;
            return false;
          });
        });

        if (missingApps.length > 0) {
          setTimeout(() => {
            for (const app of missingApps) {
              this.post({ action: 'registerActivity', ...app }).catch((err) => console.warn('Auto-sync registerActivity error:', err));
            }
          }, 500);
        }

        return firestoreService.deduplicateActivityApps([...fsApps, ...apiApps]);
      } catch (e) {
        console.warn('getActivityApplications Sheets API error, falling back to Firestore:', (e as any)?.message || e);
        return fsApps;
      }
    }, 15000);
  },

  async registerActivity(appData: any): Promise<any> {
    clearSheetsCache('activityApplications');
    const saved = await firestoreService.registerActivity(appData);
    if (IS_API_VALID) {
      this.post({ action: 'registerActivity', ...saved }).catch(e => console.warn('registerActivity Sheets API error:', e));
    }
    return saved;
  },

  async deleteActivityApplication(id: string): Promise<boolean> {
    clearSheetsCache('activityApplications');
    const res = await firestoreService.deleteActivityApplication(id);
    if (IS_API_VALID) {
      this.post({ action: 'deleteActivityApplication', id }).catch(e => console.warn('deleteActivityApplication Sheets API error:', e));
    }
    return res;
  },

  getMockContents(): Content[] {
    return [
      {
        id: 'content-profil-1',
        section: 'profil',
        field1: 'https://images.unsplash.com/photo-1544027993-37dbfe43562a?w=800', // Image URL
        field2: 'Gerakan Kepanduan Hizbul Wathan (HW) merupakan organisasi otonom Muhammadiyah yang bergerak di bidang pendidikan kepanduan. Hizbul Wathan didirikan untuk membina anak, remaja, dan pemuda agar memiliki akidah yang kuat, berakhlak mulia, berjiwa kepemimpinan, mandiri, disiplin, serta siap menjadi kader persyarikatan, umat, dan bangsa.\n\nNama “Hizbul Wathan” berasal dari bahasa Arab yang berarti “Pembela Tanah Air” atau “Golongan Pecinta Tanah Air”. Organisasi ini berakar dari gerakan kepanduan yang dirintis oleh KH Ahmad Dahlan pada tahun 1918. Awalnya bernama Padvinder Muhammadiyah, kemudian pada 30 Januari 1920 resmi menggunakan nama Hizbul Wathan.\n\nSebagai gerakan kepanduan Islam, HW menjadikan Al-Qur’an dan As-Sunnah sebagai landasan utama dalam membentuk karakter generasi muda. Melalui berbagai kegiatan kepanduan, pelatihan kepemimpinan, pengabdian masyarakat, petualangan alam terbuka, dan pendidikan keterampilan hidup, HW berupaya melahirkan kader yang beriman, berilmu, berakhlak, serta memiliki semangat pengabdian kepada agama, bangsa, dan kemanusiaan.\n\nKwartir Wilayah Gerakan Kepanduan Hizbul Wathan Jawa Tengah merupakan struktur kepemimpinan Hizbul Wathan tingkat Provinsi Jawa Tengah yang bertugas mengoordinasikan, membina, dan mengembangkan gerakan kepanduan Hizbul Wathan di seluruh kabupaten dan kota di Jawa Tengah.\n\nSebagai salah satu wilayah dengan basis Muhammadiyah yang kuat, HW Jawa Tengah memiliki peran strategis dalam kaderisasi generasi muda melalui pendidikan kepanduan yang berlandaskan nilai-nilai Islam berkemajuan. Kwarwil HW Jawa Tengah menjadi pusat koordinasi berbagai program pelatihan, pengembangan kader, kegiatan kepanduan, serta penguatan organisasi di tingkat daerah hingga qabilah.\n\nSaat ini Kwartir Wilayah Gerakan Kepanduan Hizbul Wathan Jawa Tengah dipimpin oleh:\n\nKetua: Taufiq\nSekretaris: Muhammad Dzikron\n\nDi bawah kepemimpinan tersebut, Kwarwil HW Jawa Tengah terus mengembangkan program-program kaderisasi yang adaptif terhadap perkembangan zaman dengan tetap menjaga nilai-nilai dasar kepanduan Hizbul Wathan dan ideologi Muhammadiyah.\n\nKwartir Wilayah Gerakan Kepanduan Hizbul Wathan Jawa Tengah hadir sebagai wadah pembinaan generasi muda Muhammadiyah yang unggul, berkarakter, dan berdaya saing. Dengan semangat kepanduan Islami, Kwarwil HW Jawa Tengah terus bergerak dan menggerakkan kader-kader terbaik untuk menjadi pelopor, pelangsung, dan penyempurna perjuangan Muhammadiyah dalam mewujudkan masyarakat Islam yang sebenar-benarnya.'
      },
      {
        id: 'galeri-1',
        section: 'galeri',
        field1: 'https://www.youtube.com/watch?v=kR2rXyNf9V8',
        field2: 'Mars Gerakan Kepanduan Hizbul Wathan'
      },
      {
        id: 'galeri-2',
        section: 'galeri',
        field1: 'https://www.youtube.com/watch?v=mD03u6-T9u8',
        field2: 'Profil Kwartir Wilayah HW Jawa Tengah'
      },
      {
        id: 'sosmed-1',
        section: 'sosmed',
        field1: '@hw_pusat',
        field2: '@hw_pusat',
        field3: 'UCHW-TV',
        field4: 'https://chat.whatsapp.com/L7r0U0u0U0u0U0u0U0u0'
      },
      {
        id: 'doa-1',
        section: 'doa',
        field1: 'Doa Sebelum Belajar',
        field2: 'رَبِّ زِدْنِي عِلْمًا وَارْزُقْنِي فَهْمًا',
        field3: 'Ya Allah, tambahkanlah kepadaku ilmu dan berikanlah aku pemahaman yang baik.'
      },
      {
        id: 'playlist-1',
        section: 'playlist',
        field1: 'https://hwjateng.org/musik/sahabathw.mp3',
        field2: 'Sahabat HW',
        field3: 'Muhammad Dzikron',
        field4: '',
        field5: 'Bersama kita melangkah\nMenembus cakrawala asa\nSahabat sejati Pandu HW\nSatu hati dalam ukhuwah persaudaraan\n\nDi bumi perkemahan kita bersua\nBelajar mandiri, disiplin, berjiwa ksatria\nSetia pandu, suci pikiran perkataan perbuatan\nHizbul Wathan, sahabat setia sepanjang zaman!',
        pencipta: 'Muhammad Dzikron',
        lyrics: 'Bersama kita melangkah\nMenembus cakrawala asa\nSahabat sejati Pandu HW\nSatu hati dalam ukhuwah persaudaraan\n\nDi bumi perkemahan kita bersua\nBelajar mandiri, disiplin, berjiwa ksatria\nSetia pandu, suci pikiran perkataan perbuatan\nHizbul Wathan, sahabat setia sepanjang zaman!',
        lirik: 'Bersama kita melangkah\nMenembus cakrawala asa\nSahabat sejati Pandu HW\nSatu hati dalam ukhuwah persaudaraan\n\nDi bumi perkemahan kita bersua\nBelajar mandiri, disiplin, berjiwa ksatria\nSetia pandu, suci pikiran perkataan perbuatan\nHizbul Wathan, sahabat setia sepanjang zaman!'
      },
      {
        id: 'playlist-2',
        section: 'playlist',
        field1: 'https://hwjateng.org/musik/hwuntukindonesia.mp3',
        field2: 'HW Untuk Indonesia',
        field3: 'Muhammad Dzikron',
        field4: '',
        field5: 'Dari ufuk timur cahaya menyapa\nPandu Hizbul Wathan bangkit berdaya\nMenjaga tanah air nusantara tercinta\nDengan akhlak mulia dan karya nyata.\n\nReff:\nHizbul Wathan untuk Indonesia\nSemangat membara tak pernah reda\nBerbakti tulus lillahi ta\'ala\nMenuju kejayaan nusa dan bangsa.',
        pencipta: 'Muhammad Dzikron',
        lyrics: 'Dari ufuk timur cahaya menyapa\nPandu Hizbul Wathan bangkit berdaya\nMenjaga tanah air nusantara tercinta\nDengan akhlak mulia dan karya nyata.\n\nReff:\nHizbul Wathan untuk Indonesia\nSemangat membara tak pernah reda\nBerbakti tulus lillahi ta\'ala\nMenuju kejayaan nusa dan bangsa.',
        lirik: 'Dari ufuk timur cahaya menyapa\nPandu Hizbul Wathan bangkit berdaya\nMenjaga tanah air nusantara tercinta\nDengan akhlak mulia dan karya nyata.\n\nReff:\nHizbul Wathan untuk Indonesia\nSemangat membara tak pernah reda\nBerbakti tulus lillahi ta\'ala\nMenuju kejayaan nusa dan bangsa.'
      },
      {
        id: 'playlist-3',
        section: 'playlist',
        field1: 'https://hwjateng.org/musik/marshw.mp3',
        field2: 'Mars HW',
        field3: 'H. Siradj Dahlan',
        field4: '',
        field5: 'Hizbul Wathan yang bersemangat\nMenjunjung tinggi agama Islam\nDi bawah naungan sang surya nan gemilang\nPandu HW siap berjuang.\n\nTegakkan disiplin, bina kepribadian\nCinta perdamaian dan keadilan\nMenepati janji dan undang-undang pandu\nMaju serentak membela persyarikatan.',
        pencipta: 'H. Siradj Dahlan',
        lyrics: 'Hizbul Wathan yang bersemangat\nMenjunjung tinggi agama Islam\nDi bawah naungan sang surya nan gemilang\nPandu HW siap berjuang.\n\nTegakkan disiplin, bina kepribadian\nCinta perdamaian dan keadilan\nMenepati janji dan undang-undang pandu\nMaju serentak membela persyarikatan.',
        lirik: 'Hizbul Wathan yang bersemangat\nMenjunjung tinggi agama Islam\nDi bawah naungan sang surya nan gemilang\nPandu HW siap berjuang.\n\nTegakkan disiplin, bina kepribadian\nCinta perdamaian dan keadilan\nMenepati janji dan undang-undang pandu\nMaju serentak membela persyarikatan.'
      },
      {
        id: 'playlist-4',
        section: 'playlist',
        field1: 'https://hwjateng.org/musik/hymnehw.mp3',
        field2: 'Hymne HW Panduku',
        field3: 'H.M. Affandi',
        field4: '',
        field5: 'Di hening malam kami merenung\nMengingat janji suci yang terpatri\nHizbul Wathan pandu panutanku\nBimbing kami di jalan ridha Ilahi.\n\nYa Allah lindungilah pandu kami\nKuatkan iman dan jiwa raga ini\nAgar senantiasa istiqomah berbakti\nMenegakkan panji-panji kebajikan.',
        pencipta: 'H.M. Affandi',
        lyrics: 'Di hening malam kami merenung\nMengingat janji suci yang terpatri\nHizbul Wathan pandu panutanku\nBimbing kami di jalan ridha Ilahi.\n\nYa Allah lindungilah pandu kami\nKuatkan iman dan jiwa raga ini\nAgar senantiasa istiqomah berbakti\nMenegakkan panji-panji kebajikan.',
        lirik: 'Di hening malam kami merenung\nMengingat janji suci yang terpatri\nHizbul Wathan pandu panutanku\nBimbing kami di jalan ridha Ilahi.\n\nYa Allah lindungilah pandu kami\nKuatkan iman dan jiwa raga ini\nAgar senantiasa istiqomah berbakti\nMenegakkan panji-panji kebajikan.'
      },
      {
        id: 'playlist-5',
        section: 'playlist',
        field1: 'https://hwjateng.org/musik/mahrojanpenghela.mp3',
        field2: 'Mahrojan Penghela',
        field3: 'Muhammad Dzikron',
        field4: '',
        field5: 'Berkumpul bersama para penghela\nDi arena mahrojan penuh cita\nAsah ketangkasan, pererat ukhuwah\nMenjadi pandu yang tanggap dan tabah.\n\nReff:\nPenghela HW pelopor perjuangan\nMandiri, terampil penuh keikhlasan\nSiap memimpin masa depan cemerlang\nBagi persyarikatan dan ibu pertiwi.',
        pencipta: 'Muhammad Dzikron',
        lyrics: 'Berkumpul bersama para penghela\nDi arena mahrojan penuh cita\nAsah ketangkasan, pererat ukhuwah\nMenjadi pandu yang tanggap dan tabah.\n\nReff:\nPenghela HW pelopor perjuangan\nMandiri, terampil penuh keikhlasan\nSiap memimpin masa depan cemerlang\nBagi persyarikatan dan ibu pertiwi.',
        lirik: 'Berkumpul bersama para penghela\nDi arena mahrojan penuh cita\nAsah ketangkasan, pererat ukhuwah\nMenjadi pandu yang tanggap dan tabah.\n\nReff:\nPenghela HW pelopor perjuangan\nMandiri, terampil penuh keikhlasan\nSiap memimpin masa depan cemerlang\nBagi persyarikatan dan ibu pertiwi.'
      },
      {
        id: 'playlist-6',
        section: 'playlist',
        field1: 'https://hwjateng.com/audio/sang_surya.mp3',
        field2: 'Sang Surya (Mars Muhammadiyah)',
        field3: 'Djarnawi Hadikusuma',
        field4: '',
        field5: 'Sang Surya telah bersinar\nSyahadat dua melingkar\nWarna yang hijau berseri\nMembuat rela hati.\n\nYa Allah Tuhan Rabbiku\nMuhammad Petunjukku\nIslam Agamaku\nMuhammadiyah Gerakanku.\n\nDi timur fajar merekah\nUmat Islam bangunlah\nBina persatuan padu\nMenghadap musuh seteru.',
        pencipta: 'Djarnawi Hadikusuma',
        lyrics: 'Sang Surya telah bersinar\nSyahadat dua melingkar\nWarna yang hijau berseri\nMembuat rela hati.\n\nYa Allah Tuhan Rabbiku\nMuhammad Petunjukku\nIslam Agamaku\nMuhammadiyah Gerakanku.\n\nDi timur fajar merekah\nUmat Islam bangunlah\nBina persatuan padu\nMenghadap musuh seteru.',
        lirik: 'Sang Surya telah bersinar\nSyahadat dua melingkar\nWarna yang hijau berseri\nMembuat rela hati.\n\nYa Allah Tuhan Rabbiku\nMuhammad Petunjukku\nIslam Agamaku\nMuhammadiyah Gerakanku.\n\nDi timur fajar merekah\nUmat Islam bangunlah\nBina persatuan padu\nMenghadap musuh seteru.'
      }
    ];
  },
  
  isMockEnabled() {
    return !IS_API_VALID;
  }
} as any;

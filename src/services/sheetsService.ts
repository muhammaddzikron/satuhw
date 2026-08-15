import axios from 'axios';
import { User, Materi, Content, UserRole } from '../types';
import { INITIAL_SPREADSHEET_DATA } from './initialSpreadsheetData';
import { firestoreService, parseRolesField } from './firestoreService';
import { getMasterMembersList } from './masterMembersService';
import { ensureUniqueKtaNumbers } from '../utils/ktaUtils';
import { pickValidImageUrl } from '../lib/utils';
import { DEFAULT_TRAINING_TYPES, DEFAULT_UPGRADE_FEES, normalizeTrainingKey } from '../utils/trainingUtils';

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
      localStorage.setItem('mock_members', JSON.stringify(currentList));
    } else {
      localStorage.setItem('mock_members', JSON.stringify(masterMembers));
    }
    localStorage.setItem('mock_members_initialized', 'true');
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
    localStorage.setItem('materi', JSON.stringify(parsedMateri));
    localStorage.setItem('materi_initialized', 'true');
  }

  if (!localStorage.getItem('contents_initialized') || !localStorage.getItem('contents')) {
    localStorage.setItem('contents', JSON.stringify(INITIAL_SPREADSHEET_DATA.contents || []));
    localStorage.setItem('contents_initialized', 'true');
  }

  if (!localStorage.getItem('kta_applications_initialized') || !localStorage.getItem('kta_applications')) {
    localStorage.setItem('kta_applications', '[]');
    localStorage.setItem('kta_applications_initialized', 'true');
  } else {
    try {
      const stored = localStorage.getItem('kta_applications');
      if (stored) {
        const parsed = JSON.parse(stored);
        // Clean out invalid old dummy records (e.g. items missing 'nama' or 'status')
        const valid = parsed.filter((k: any) => k && (k.nama || k.namaLengkap) && (k.status === 'pending' || k.status === 'approved' || k.status === 'rejected') && k.tingkatan);
        if (valid.length !== parsed.length) {
          localStorage.setItem('kta_applications', JSON.stringify(valid));
        }
      }
    } catch (e) {
      console.error('Repair kta_applications error:', e);
    }
  }

  if (!localStorage.getItem('training_applications_initialized') || !localStorage.getItem('training_applications')) {
    localStorage.setItem('training_applications', JSON.stringify([]));
    localStorage.setItem('training_applications_initialized', 'true');
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
          localStorage.setItem('training_applications', JSON.stringify(repaired));
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
            const stored = localStorage.getItem('mock_members');
            let parsed = stored ? JSON.parse(stored) : [];
            if (Array.isArray(parsed)) {
              const idx = parsed.findIndex((m: any) => 
                (mappedUser.id && m.id === mappedUser.id) ||
                (mappedUser.email && m.email?.toLowerCase() === mappedUser.email.toLowerCase())
              );
              if (idx >= 0) {
                const ex = parsed[idx];
                finalUser = {
                  ...mappedUser,
                  ...ex,
                  namaLengkap: (ex.namaLengkap && ex.namaLengkap !== 'Tanpa Nama' && ex.namaLengkap !== '-') ? ex.namaLengkap : (mappedUser.namaLengkap || ex.namaLengkap || 'Anggota HW'),
                  photo: ex.photo || mappedUser.photo || '',
                  noHp: ex.noHp || mappedUser.noHp || '',
                  alamat: ex.alamat || mappedUser.alamat || '',
                  qabilah: ex.qabilah || mappedUser.qabilah || '',
                  asalKwarda: ex.asalKwarda || mappedUser.asalKwarda || '',
                  tempatLahir: ex.tempatLahir || mappedUser.tempatLahir || '',
                  tanggalLahir: ex.tanggalLahir || mappedUser.tanggalLahir || '',
                  golongan: ex.golongan || mappedUser.golongan || 'Dewasa',
                  golonganPelatih: ex.golonganPelatih || mappedUser.golonganPelatih || '',
                  pelatihan: (Array.isArray(ex.pelatihan) && ex.pelatihan.length > 0) ? ex.pelatihan : mappedUser.pelatihan,
                  roles: (Array.isArray(ex.roles) && ex.roles.length > 0) ? ex.roles : mappedUser.roles,
                  role: ex.role || mappedUser.role || 'umum',
                  ktaNumber: ex.ktaNumber || mappedUser.ktaNumber || ex.nomorKTA || mappedUser.nomorKTA || '',
                };
                parsed[idx] = finalUser;
              } else {
                parsed.push(finalUser);
              }
              localStorage.setItem('mock_members', JSON.stringify(parsed));
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
            localStorage.setItem('mock_members', JSON.stringify(parsed));
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

    const user: User = {
      id: stableId,
      email: emailValue,
      namaLengkap: namaValue || 'Anggota HW',
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

    const rolesArr = parseRolesField(data.roles, data.role);
    const primaryRole = rolesArr.find(r => r !== 'umum') || rolesArr[0] || 'umum';

    user.roles = rolesArr;
    user.role = primaryRole;
    user.activeRole = data.activeRole || primaryRole;
    
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
          isValid = (cleanPass === storedPass || cleanPass === '12345hw');
        } else {
          isValid = (cleanPass === '12345hw');
        }
      }

      if (isValid) {
        return {
          token: `mock-token-${found.email || found.id}`,
          user: this.mapUser(found)
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

    // Add Alda Putri mock for testing as requested
    if (cleanInput === 'aldaputri@gmail.com' && (cleanPass === '12345hw' || cleanPass === '12345')) {
      return {
        token: 'mock-token-alda',
        user: {
          id: 'alda-123',
          email: 'aldaputri@gmail.com',
          namaLengkap: 'Alda Putri',
          role: 'umum',
          jenisKelamin: 'P',
          golongan: 'Atfal',
          pelatihan: [],
          pendidikan: 'SD',
          asalKwarda: 'Banyumas',
          qabilah: 'Unmuh Purwokerto',
          alamat: 'Purwokerto Utara, Banyumas',
          noHp: '081234567890',
          sosmed: '@aldaputri',
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
      timeout: 5000
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

  async getMembers(): Promise<User[]> {
    return cachedFetch('members', async () => {
      if (!IS_API_VALID) {
        const members = await firestoreService.getMembers();
        return members.map((m: any) => this.mapUser(m));
      }
      try {
        const response = await axios.get(`${API_URL}?action=getMembers&_t=${Date.now()}`, { timeout: 15000 });
        let rawMembers: any[] = [];
        if (Array.isArray(response.data)) {
          rawMembers = response.data;
        } else if (response.data && Array.isArray(response.data.data)) {
          rawMembers = response.data.data;
        } else if (response.data && Array.isArray(response.data.members)) {
          rawMembers = response.data.members;
        }

        const sheetMembers = rawMembers.map((m: any) => this.mapUser(m));

        // Merge Firestore & Local Storage member updates
        try {
          const fsMembers = await firestoreService.getMembers();
          const fsKtas = await firestoreService.getKTAApplications();
          let localMocks: any[] = [];
          try {
            localMocks = JSON.parse(localStorage.getItem('mock_members') || '[]');
          } catch(e) {}

          const cachedMembers = [...fsMembers, ...localMocks];

          sheetMembers.forEach(sm => {
            const smEmail = sm.email ? sm.email.toLowerCase().trim() : '';
            const smName = sm.namaLengkap ? sm.namaLengkap.toLowerCase().trim() : '';
            const smId = sm.id ? String(sm.id) : '';

            const match = cachedMembers.find(fm => 
              (fm && fm.id && smId && String(fm.id) === smId) ||
              (smEmail && fm && fm.email && fm.email.toLowerCase().trim() === smEmail) ||
              (smName && fm && fm.namaLengkap && fm.namaLengkap.toLowerCase().trim() === smName)
            );

            if (match) {
              if (match.namaLengkap && match.namaLengkap !== 'Tanpa Nama' && match.namaLengkap !== '-') sm.namaLengkap = match.namaLengkap;
              if (match.photo) sm.photo = match.photo;
              if ((match as any).golonganPelatih) (sm as any).golonganPelatih = (match as any).golonganPelatih;
              if (match.ktaNumber) sm.ktaNumber = match.ktaNumber;
              if (match.noHp) sm.noHp = match.noHp;
              if (match.alamat) sm.alamat = match.alamat;
              if (match.tempatLahir) sm.tempatLahir = match.tempatLahir;
              if (match.tanggalLahir) sm.tanggalLahir = match.tanggalLahir;
              if (match.asalKwarda) sm.asalKwarda = match.asalKwarda;
              if (match.qabilah) sm.qabilah = match.qabilah;
              if (match.sosmed) sm.sosmed = match.sosmed;
              if (match.pendidikan) sm.pendidikan = match.pendidikan;
              if (match.golongan) sm.golongan = match.golongan;
              if (match.pelatihan && Array.isArray(match.pelatihan) && match.pelatihan.length > 0) sm.pelatihan = match.pelatihan;
              if (match.roles && Array.isArray(match.roles) && match.roles.length > 0) {
                sm.roles = match.roles;
                sm.role = match.role || match.roles.find(r => r !== 'umum') || match.roles[0] || 'umum';
                if (match.activeRole) sm.activeRole = match.activeRole;
              } else if (match.role) {
                sm.roles = parseRolesField(null, match.role);
                sm.role = match.role as UserRole;
              }
              if (match.statusAktivasi) sm.statusAktivasi = match.statusAktivasi;
              if (match.statusPembayaran) sm.statusPembayaran = match.statusPembayaran;
              if (match.isVerified !== undefined) sm.isVerified = match.isVerified;
            } else {
              const ktaMatch = fsKtas.find(fk =>
                (fk.userId && smId && String(fk.userId) === smId) ||
                (smEmail && fk.email && fk.email.toLowerCase().trim() === smEmail) ||
                (smName && (fk.nama || fk.namaLengkap) && (fk.nama || fk.namaLengkap).toLowerCase().trim() === smName)
              );
              if (ktaMatch) {
                if (!sm.photo && ktaMatch.photo) sm.photo = ktaMatch.photo;
                if (!sm.noHp && ktaMatch.noWa) sm.noHp = ktaMatch.noWa;
                if (!sm.asalKwarda && ktaMatch.asalDaerah) sm.asalKwarda = ktaMatch.asalDaerah;
                if (!sm.qabilah && ktaMatch.qabilah) sm.qabilah = ktaMatch.qabilah;
                if (!sm.alamat && ktaMatch.alamat) sm.alamat = ktaMatch.alamat;
                if (!sm.tempatLahir && ktaMatch.tempatLahir) sm.tempatLahir = ktaMatch.tempatLahir;
                if (!sm.tanggalLahir && ktaMatch.tanggalLahir) sm.tanggalLahir = ktaMatch.tanggalLahir;
              }
            }
          });

          // Add any cached member missing from sheetMembers
          cachedMembers.forEach(fm => {
            if (!fm || !fm.namaLengkap || fm.namaLengkap === 'Tanpa Nama' || fm.namaLengkap === '-') return;
            const fmEmail = fm.email ? fm.email.toLowerCase().trim() : '';
            const fmName = fm.namaLengkap ? fm.namaLengkap.toLowerCase().trim() : '';
            const fmId = fm.id ? String(fm.id) : '';

            const existsInSheet = sheetMembers.some(sm => 
              (sm.id && fmId && String(sm.id) === fmId) ||
              (fmEmail && sm.email && sm.email.toLowerCase().trim() === fmEmail) ||
              (fmName && sm.namaLengkap && sm.namaLengkap.toLowerCase().trim() === fmName)
            );
            if (!existsInSheet) {
              sheetMembers.push(this.mapUser(fm));
            }
          });
        } catch (e) {
          console.warn('Error merging Firestore photos and member data into getMembers:', e);
        }

        const finalResult = ensureUniqueKtaNumbers(sheetMembers);
        try {
          localStorage.setItem('mock_members', JSON.stringify(finalResult.slice(0, 500)));
        } catch(e) {}
        return finalResult;
      } catch (error) {
        console.warn('getMembers API error, falling back to Firestore:', (error as any)?.message || error);
        const members = await firestoreService.getMembers();
        return members.map((m: any) => this.mapUser(m));
      }
    }, 25000);
  },

  async saveMember(userData: any): Promise<any> {
    clearSheetsCache('members');
    const normRoles = parseRolesField(userData.roles, userData.role);
    const primaryRole = normRoles.find(r => r !== 'umum') || normRoles[0] || 'umum';
    const cleanUserData: User = {
      ...userData,
      id: userData.id || (userData.email ? `user-${userData.email.toLowerCase().replace(/[^a-zA-Z0-9]/g, '_')}` : `user-${Date.now()}`),
      role: primaryRole,
      roles: normRoles,
      activeRole: userData.activeRole || primaryRole
    };

    // 1. Immediately update local mock_members cache
    try {
      const stored = localStorage.getItem('mock_members');
      let members: any[] = stored ? JSON.parse(stored) : [];
      if (!Array.isArray(members)) members = [];
      const cleanId = String(cleanUserData.id || '');
      const cleanEmail = cleanUserData.email ? cleanUserData.email.toLowerCase().trim() : '';
      const cleanKta = cleanUserData.ktaNumber ? cleanUserData.ktaNumber.trim() : '';
      const cleanPhone = cleanUserData.noHp ? cleanUserData.noHp.replace(/[^0-9]/g, '') : '';

      const idx = members.findIndex((m: any) => {
        if (!m) return false;
        const mId = m.id ? String(m.id) : '';
        const mEmail = m.email ? m.email.toLowerCase().trim() : '';
        const mKta = (m.ktaNumber || m.nomorKTA || '').trim();
        const mPhone = m.noHp ? String(m.noHp).replace(/[^0-9]/g, '') : '';

        return (
          (cleanId && mId && cleanId === mId) ||
          (cleanEmail && mEmail && cleanEmail === mEmail) ||
          (cleanKta && mKta && cleanKta === mKta) ||
          (cleanPhone && cleanPhone.length > 6 && mPhone && cleanPhone === mPhone)
        );
      });

      if (idx >= 0) {
        members[idx] = { ...members[idx], ...cleanUserData };
      } else {
        members.push(cleanUserData);
      }
      localStorage.setItem('mock_members', JSON.stringify(members));

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
          localStorage.setItem('kta_applications', JSON.stringify(ktas));
        }
      }
    } catch (e) {
      console.warn('Error updating local mock_members in saveMember:', e);
    }

    // 2. Persist to Firestore
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
        email: cleanUserData.email,
        namaLengkap: cleanUserData.namaLengkap,
        role: JSON.stringify(normRoles),
        roles: JSON.stringify(normRoles),
        pelatihan: Array.isArray(cleanUserData.pelatihan) ? JSON.stringify(cleanUserData.pelatihan) : cleanUserData.pelatihan,
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
    return firestoreService.subscribeToMembers(callback);
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

  async getKTAApplications(): Promise<any[]> {
    return cachedFetch('ktaApplications', async () => {
      if (!IS_API_VALID) {
        return await firestoreService.getKTAApplications();
      }
      try {
        const response = await axios.get(`${API_URL}?action=getKTAApplications&_t=${Date.now()}`, { timeout: 15000 });
        if (Array.isArray(response.data)) {
          const apps = response.data;
          // Merge photos from Firestore if empty in Google Sheets response
          try {
            const fsApps = await firestoreService.getKTAApplications();
            apps.forEach(a => {
              if (!a.photo) {
                const match = fsApps.find(fa => 
                  (fa.id && a.id && String(fa.id) === String(a.id)) ||
                  (fa.email && a.email && fa.email.toLowerCase().trim() === a.email.toLowerCase().trim()) ||
                  (fa.userId && a.userId && String(fa.userId) === String(a.userId))
                );
                if (match && match.photo) {
                  a.photo = match.photo;
                }
              }
            });
          } catch (e) {}
          return ensureUniqueKtaNumbers(apps);
        }
        return await firestoreService.getKTAApplications();
      } catch (e) {
        console.warn('getKTAApplications API error, falling back to Firestore:', (e as any)?.message || e);
        return await firestoreService.getKTAApplications();
      }
    }, 20000);
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
              tanggalAjuan: t.tanggalAjuan || t.tanggalajuan || t.tanggalDaftar || new Date().toISOString()
            };
          }).filter((t: any) => {
            const name = (t.nama || t.namaLengkap || '').trim();
            const email = (t.email || '').toLowerCase().trim();
            return name && name !== '-' && !name.includes('@') && name.toLowerCase() !== 'tanpa nama' && !sysEmails.includes(email) && t.status !== 'deleted';
          });
          
          apiTrainings.forEach(tr => firestoreService.createTrainingApplication(tr).catch(() => {}));

          const map = new Map<string, any>();
          fsTrainings.forEach(t => {
            if (t && t.id) map.set(t.id, t);
          });
          apiTrainings.forEach(t => {
            if (t && t.id && !map.has(t.id)) map.set(t.id, t);
          });
          return Array.from(map.values());
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

  async updateAttendance(id: string, kehadiran: string): Promise<any> {
    if (IS_API_VALID) {
      this.post({ action: 'updateAttendance', id, kehadiran }).catch(() => {});
    }
    await firestoreService.updateAttendance(id, kehadiran);
    return { success: true };
  },

  async submitAssignment(id: string, tugas: string): Promise<any> {
    if (IS_API_VALID) {
      this.post({ action: 'submitAssignment', id, tugas }).catch(() => {});
    }
    await firestoreService.updateAssignmentGrade(id, tugas, undefined);
    return { success: true };
  },

  async updateGrade(id: string, nilai: any): Promise<any> {
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

  async updateTrainingSchedule(id: string, lokasiPelatihan: string, tanggalPelatihan: string): Promise<any> {
    if (IS_API_VALID) {
      this.post({ action: 'updateTrainingSchedule', id, lokasiPelatihan, tanggalPelatihan }).catch(() => {});
    }
    await firestoreService.createTrainingApplication({ id, lokasiPelatihan, tanggalPelatihan });
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
          const sanitized = apiData.map(c => {
            if (c.section === 'galeri' && c.field1 && c.field1.includes('dQw4w9WgXcQ')) {
              return {
                ...c,
                field1: 'https://www.youtube.com/watch?v=kR2rXyNf9V8',
                field2: c.field2 === 'Lagu Mars Hizbul Wathan' ? 'Mars Gerakan Kepanduan Hizbul Wathan' : c.field2
              };
            }
            return c;
          });
          return section ? sanitized.filter((c: any) => c.section === section) : sanitized;
        }
      } catch (error) {
        console.warn('getContents API error, falling back to Firestore:', (error as any)?.message || error);
      }
    }
    const fsContents = await firestoreService.getContents();
    if (fsContents && fsContents.length > 0) {
      return section ? fsContents.filter((c: any) => c.section === section) : fsContents;
    }
    const mockData = this.getMockContents();
    return section ? mockData.filter(c => c.section === section) : mockData;
  },

  async saveContent(content: any): Promise<any> {
    if (IS_API_VALID) {
      this.post({ action: 'saveContent', ...content }).catch(() => {});
    }
    const saved = await firestoreService.saveContent(content);
    return { success: true, content: saved };
  },

  async deleteContent(id: string): Promise<any> {
    if (IS_API_VALID) {
      this.post({ action: 'deleteContent', id }).catch(() => {});
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
            localStorage.setItem('hw_settings', JSON.stringify(localParsed));
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
    const DEFAULT_ACTIVITIES: any[] = [];

    const fsSettings = await firestoreService.getSettings();

    if (!IS_API_VALID) {
      const parsed = fsSettings || localParsed || { 
        appName: 'HW App', 
        orgName: 'HW Org', 
        waConfirmation: '628',
        lastBackup: '-',
        trainingTypes: DEFAULT_TYPES,
        trainingActivities: DEFAULT_ACTIVITIES,
        trainingLocations: ['Gedung Dakwah Muhammadiyah Jateng', 'Kwarda Banyumas', 'Pusdiklat HW Jateng'],
        trainingDates: ['12-14 Juli 2026', '1-3 Agustus 2026', '15-17 September 2026'],
        upgradeFees: DEFAULT_UPGRADE_FEES
      };
      const result = {
        ...parsed,
        trainingTypes: safeParse(parsed.trainingTypes, DEFAULT_TYPES),
        trainingActivities: safeParse(parsed.trainingActivities, DEFAULT_ACTIVITIES),
        trainingLocations: safeParse(parsed.trainingLocations, ['Gedung Dakwah Muhammadiyah Jateng', 'Kwarda Banyumas', 'Pusdiklat HW Jateng']),
        trainingDates: safeParse(parsed.trainingDates, ['12-14 Juli 2026', '1-3 Agustus 2026', '15-17 September 2026']),
        upgradeFees: safeParse(parsed.upgradeFees, DEFAULT_UPGRADE_FEES)
      };
      localStorage.setItem('hw_settings', JSON.stringify(result));
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
        ktaTemplateFront: apiSettings.ktaTemplateFront || fsSettings?.ktaTemplateFront || 'https://hwjateng.com/wp-content/uploads/2026/07/depan.png',
        ktaTemplateBack: apiSettings.ktaTemplateBack || fsSettings?.ktaTemplateBack || 'https://hwjateng.com/wp-content/uploads/2026/07/Belakang.jpg',
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
        upgradeFees: safeParse(apiSettings.upgradeFees || fsSettings?.upgradeFees, DEFAULT_UPGRADE_FEES)
      };
      localStorage.setItem('hw_settings', JSON.stringify(merged));
      return merged;
    } catch (error) {
      console.warn('getSettings API error, falling back to local settings:', (error as any)?.message || error);
      const parsed = fsSettings || localParsed || { 
        appName: 'HW App', 
        orgName: 'HW Org', 
        lastBackup: '-',
        ktaTemplateFront: 'https://hwjateng.com/wp-content/uploads/2026/07/depan.png',
        ktaTemplateBack: 'https://hwjateng.com/wp-content/uploads/2026/07/Belakang.jpg',
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
        ktaTemplateFront: parsed.ktaTemplateFront || 'https://hwjateng.com/wp-content/uploads/2026/07/depan.png',
        ktaTemplateBack: parsed.ktaTemplateBack || 'https://hwjateng.com/wp-content/uploads/2026/07/Belakang.jpg',
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
        upgradeFees: safeParse(parsed.upgradeFees, DEFAULT_UPGRADE_FEES)
      };
    }
  },

  subscribeToSettings(callback: (settings: any) => void): () => void {
    return firestoreService.subscribeToSettings(callback);
  },

  async saveSettings(settings: any): Promise<any> {
    localStorage.setItem('hw_settings', JSON.stringify(settings));
    try {
      await firestoreService.saveSettings(settings);
    } catch (e) {
      console.warn('saveSettings Firestore error:', e);
    }

    if (!IS_API_VALID) {
      return { success: true };
    }

    const serializedSettings: any = {};
    for (const key in settings) {
      if (Array.isArray(settings[key]) || typeof settings[key] === 'object') {
        serializedSettings[key] = JSON.stringify(settings[key]);
      } else {
        serializedSettings[key] = settings[key];
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
          const sheetRekening = sheetAct.rekeningpembayaran || sheetAct.rekeningPembayaran || sheetAct.rekeningpembiayaan || sheetAct.rekeningPembiayaan || '';
          const sheetKonfirmasi = sheetAct.nowhatsapppanitia || sheetAct.noWhatsappPanitia || sheetAct.konfirmasipembayaran || sheetAct.konfirmasiPembayaran || '';

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
                deskripsi: fsAct.deskripsi || fsAct.description || sheetDesc,
                description: fsAct.deskripsi || fsAct.description || sheetDesc,
                kategori: fsAct.kategori || fsAct.category || sheetCat,
                category: fsAct.kategori || fsAct.category || sheetCat,
                gambarUrl: pickValidImageUrl(sheetImg, fsAct.gambarUrl || fsAct.imageUrl || fsAct.gambar || fsAct.posterUrl || fsAct.coverImage),
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
                deskripsi: sheetDesc || fsAct.deskripsi || fsAct.description,
                description: sheetDesc || fsAct.deskripsi || fsAct.description,
                kategori: sheetCat || fsAct.kategori || fsAct.category,
                category: sheetCat || fsAct.kategori || fsAct.category,
                gambarUrl: pickValidImageUrl(sheetImg, fsAct.gambarUrl || fsAct.imageUrl || fsAct.gambar || fsAct.posterUrl || fsAct.coverImage),
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
              deskripsi: sheetDesc,
              description: sheetDesc,
              kategori: sheetCat || 'Silaturahmi',
              category: sheetCat || 'Silaturahmi',
              gambarUrl: pickValidImageUrl(sheetImg),
              imageUrl: pickValidImageUrl(sheetImg),
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

        return Array.from(map.values());
      }
      return fsActs;
    } catch (e) {
      console.warn('getActivities Sheets API error:', e);
      return fsActs;
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
        field3: 'Kwarnas HW',
        field4: '',
        field5: 'Sahabat sejati Pandu Hizbul Wathan\nMelangkah bersama membina generasi\nBertaqwa, berilmu, dan berbudi pekerti\nUntuk agama dan ibu pertiwi.\n\nReff:\nKompak dalam barisan, tangguh hadapi rintangan\nPandu HW satukan tekad pengabdian\nFastabiqul khairat semboyan di dada\nBerbakti untuk umat dan bangsa.',
        pencipta: 'Kwarnas HW',
        lyrics: 'Sahabat sejati Pandu Hizbul Wathan\nMelangkah bersama membina generasi\nBertaqwa, berilmu, dan berbudi pekerti\nUntuk agama dan ibu pertiwi.\n\nReff:\nKompak dalam barisan, tangguh hadapi rintangan\nPandu HW satukan tekad pengabdian\nFastabiqul khairat semboyan di dada\nBerbakti untuk umat dan bangsa.',
        lirik: 'Sahabat sejati Pandu Hizbul Wathan\nMelangkah bersama membina generasi\nBertaqwa, berilmu, dan berbudi pekerti\nUntuk agama dan ibu pertiwi.\n\nReff:\nKompak dalam barisan, tangguh hadapi rintangan\nPandu HW satukan tekad pengabdian\nFastabiqul khairat semboyan di dada\nBerbakti untuk umat dan bangsa.'
      },
      {
        id: 'playlist-2',
        section: 'playlist',
        field1: 'https://hwjateng.org/musik/hwuntukindonesia.mp3',
        field2: 'HW Untuk Indonesia',
        field3: 'Kwarwil HW Jateng',
        field4: '',
        field5: 'Dari ufuk timur cahaya menyapa\nPandu Hizbul Wathan bangkit berdaya\nMenjaga tanah air nusantara tercinta\nDengan akhlak mulia dan karya nyata.\n\nReff:\nHizbul Wathan untuk Indonesia\nSemangat membara tak pernah reda\nBerbakti tulus lillahi ta\'ala\nMenuju kejayaan nusa dan bangsa.',
        pencipta: 'Kwarwil HW Jateng',
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
        field3: 'Pandu HW',
        field4: '',
        field5: 'Berkumpul bersama para penghela\nDi arena mahrojan penuh cita\nAsah ketangkasan, pererat ukhuwah\nMenjadi pandu yang tanggap dan tabah.\n\nReff:\nPenghela HW pelopor perjuangan\nMandiri, terampil penuh keikhlasan\nSiap memimpin masa depan cemerlang\nBagi persyarikatan dan ibu pertiwi.',
        pencipta: 'Pandu HW',
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

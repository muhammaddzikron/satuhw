import axios from 'axios';
import { User, Materi, Content, UserRole } from '../types';
import { INITIAL_SPREADSHEET_DATA } from './initialSpreadsheetData';
import { firestoreService } from './firestoreService';
import { getMasterMembersList } from './masterMembersService';

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

    const map = new Map<string, any>();
    masterMembers.forEach(m => {
      const kta = (m.ktaNumber || m.nomorKTA || '').trim().toLowerCase();
      const email = (m.email || '').trim().toLowerCase();
      const key = kta ? `kta:${kta}` : (email && !email.startsWith('member_') ? `email:${email}` : `id:${m.id}`);
      map.set(key, m);
    });

    if (Array.isArray(currentList) && currentList.length > 0) {
      currentList.forEach(m => {
        if (!m || !m.namaLengkap || m.namaLengkap === 'Tanpa Nama' || m.namaLengkap === '-') return;
        const kta = (m.ktaNumber || m.nomorKTA || '').trim().toLowerCase();
        const email = (m.email || '').trim().toLowerCase();
        const key = kta ? `kta:${kta}` : (email && !email.startsWith('member_') ? `email:${email}` : `id:${m.id}`);
        if (map.has(key)) {
          map.set(key, { ...map.get(key), ...m });
        } else {
          map.set(key, m);
        }
      });
    }

    const mergedMock = Array.from(map.values());
    localStorage.setItem('mock_members', JSON.stringify(mergedMock));
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
    const parsedTraining = (INITIAL_SPREADSHEET_DATA.training || []).map((t: any, idx: number) => {
      const id = t.id || `training-${1000 + idx}`;
      return {
        ...t,
        id: String(id)
      };
    });
    localStorage.setItem('training_applications', JSON.stringify(parsedTraining));
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

    // Step 1: Fast local cache login (instant < 20ms)
    try {
      const localResult = this.mockLogin(cleanEmail, cleanPass);
      if (localResult && localResult.user) {
        // Sync in background if online API is active
        if (IS_API_VALID) {
          this.post({
            action: 'login',
            email: cleanEmail,
            password: cleanPass
          }).then(res => {
            if (res && res.user) {
              const mappedUser = this.mapUser(res.user);
              firestoreService.saveMember(mappedUser).catch(() => {});
            }
          }).catch(() => {});
        }
        return localResult;
      }
    } catch (e: any) {
      if (e.message?.includes('salah')) {
        throw e;
      }
    }

    // Step 2: Fast Firestore cache login with 1.2s timeout limit
    try {
      const fsPromise = firestoreService.login(cleanEmail, cleanPass);
      const fsTimeout = new Promise<null>((_, reject) => setTimeout(() => reject(new Error('FS Timeout')), 1200));
      const fsResult: any = await Promise.race([fsPromise, fsTimeout]).catch(() => null);
      if (fsResult && fsResult.user) {
        if (IS_API_VALID) {
          this.post({ action: 'login', email: cleanEmail, password: cleanPass }).catch(() => {});
        }
        return fsResult;
      }
    } catch (e) {
      console.warn('Firestore login check skipped or timed out:', e);
    }

    // Step 3: Try Google Sheets API with 1.5s timeout if user wasn't in local cache
    if (IS_API_VALID) {
      try {
        const apiPromise = this.post({
          action: 'login',
          email: cleanEmail,
          password: cleanPass
        });
        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('API Timeout')), 1500));
        const res: any = await Promise.race([apiPromise, timeoutPromise]);
        if (res && res.user) {
          const mappedUser = this.mapUser(res.user);
          firestoreService.saveMember(mappedUser).catch(() => {});
          return {
            token: res.token || `token-${mappedUser.id}`,
            user: mappedUser
          };
        }
      } catch (error: any) {
        console.warn('Google Sheets login API call error or timeout, falling back:', error);
      }
    }

    throw new Error('Email atau password salah.');
  },

  mapUser(data: any): User {
    // Helper to safely parse array-like fields from backend (might be JSON string, comma-separated string, or already an array)
    const parseArrayField = (val: any): any[] => {
      if (!val) return [];
      if (Array.isArray(val)) return val;
      if (typeof val !== 'string') return [val]; // If it's a number or something, wrap in array
      
      const trimmed = val.trim();
      if (!trimmed) return [];
      
      // Try JSON first if it looks like an array
      if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
        try {
          return JSON.parse(trimmed);
        } catch (e) {
          console.warn('Failed to parse JSON array field:', trimmed);
        }
      }
      
      // Fallback to comma separation
      return trimmed.split(',').map(s => s.trim()).filter(Boolean);
    };

    // Map lowercase keys from backend to camelCase keys for frontend
    const idValue = data.id || data.Id;
    const emailValue = data.email || data.Email || '';
    const stableId = idValue ? String(idValue) : (emailValue ? `user-${emailValue.toLowerCase().replace(/[^a-zA-Z0-9]/g, '_')}` : `user-${Date.now()}`);

    const user = {
      id: stableId,
      email: emailValue,
      namaLengkap: data.namaLengkap || data.namalengkap || data.nama || '',
      jenisKelamin: data.jenisKelamin || data.jeniskelamin || 'L',
      golongan: data.golongan || '',
      golonganPelatih: data.golonganPelatih || data.golonganpelatih || '',
      pelatihan: parseArrayField(data.pelatihan),
      pendidikan: data.pendidikan || '',
      asalKwarda: data.asalKwarda || data.asalkwarda || data.kwarda || data.asalDaerah || '',
      qabilah: data.qabilah || '',
      alamat: data.alamat || '',
      tempatLahir: data.tempatLahir || data.tempatlahir || data.tempat_lahir || '',
      tanggalLahir: data.tanggalLahir || data.tanggallahir || data.tanggal_lahir || '',
      noHp: data.noHp || data.nohp || data.noWa || data.phone || '',
      sosmed: data.sosmed || '',
      role: 'umum' as UserRole,
      roles: [] as UserRole[],
      activeRole: 'umum' as UserRole,
      isVerified: data.isVerified !== undefined ? data.isVerified : (data.isverified !== undefined ? data.isverified : false),
      ktaNumber: data.ktaNumber || data.ktanumber || data.noKta || '',
      upgradeRequests: parseArrayField(data.upgradeRequests || data.upgraderequests),
      photo: data.photo || data.foto || data.Photo || data.Foto || '',
      password: data.password || ''
    };

    const rolesRaw = data.role || data.roles || 'umum';
    const rolesArr = parseArrayField(rolesRaw);
    
    user.roles = rolesArr as UserRole[];
    user.role = rolesArr[0] || 'umum';
    user.activeRole = data.activeRole || rolesArr[0] || 'umum';
    
    // Handle truthy values from Sheets for isVerified
    if (typeof user.isVerified !== 'boolean') {
      user.isVerified = user.isVerified === true || user.isVerified === 1 || user.isVerified === "true" || user.isVerified === "1";
    }
    
    return user as User;
  },

  mockLogin(emailOrId: string, password: string): { user: User; token: string } {
    const cleanInput = (emailOrId || '').trim().toLowerCase();
    const cleanPass = (password || '').trim();
    const cleanDigits = cleanInput.replace(/[^0-9]/g, '');

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
    if (!IS_API_VALID) {
      const materiList = await firestoreService.getMateri();
      return (materiList || [])
        .map((m: any) => this.mapMateri(m))
        .filter((m: any) => !role || role === 'semua' || m.kategori === role);
    }
    try {
      const response = await axios.get(`${API_URL}?action=getMateri&role=${role}&_t=${Date.now()}`);
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
  },

  async saveMateri(materi: any): Promise<any> {
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
    if (!IS_API_VALID) {
      const members = await firestoreService.getMembers();
      return members.map((m: any) => this.mapUser(m));
    }
    try {
      const response = await axios.get(`${API_URL}?action=getMembers&_t=${Date.now()}`, { timeout: 4000 });
      if (Array.isArray(response.data)) {
        const sheetMembers = response.data.map((m: any) => this.mapUser(m));
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
              if (!sm.photo && match.photo) sm.photo = match.photo;
              if (!(sm as any).golonganPelatih && (match as any).golonganPelatih) (sm as any).golonganPelatih = (match as any).golonganPelatih;
              if (!sm.ktaNumber && match.ktaNumber) sm.ktaNumber = match.ktaNumber;
              if (!sm.noHp && match.noHp) sm.noHp = match.noHp;
              if (!sm.alamat && match.alamat) sm.alamat = match.alamat;
              if (!sm.tempatLahir && match.tempatLahir) sm.tempatLahir = match.tempatLahir;
              if (!sm.tanggalLahir && match.tanggalLahir) sm.tanggalLahir = match.tanggalLahir;
              if (!sm.asalKwarda && match.asalKwarda) sm.asalKwarda = match.asalKwarda;
              if (!sm.qabilah && match.qabilah) sm.qabilah = match.qabilah;
              if (!sm.sosmed && match.sosmed) sm.sosmed = match.sosmed;
              if (!sm.pendidikan && match.pendidikan) sm.pendidikan = match.pendidikan;
              if (!sm.golongan && match.golongan) sm.golongan = match.golongan;
              if ((!sm.roles || sm.roles.length === 0 || (sm.roles.length === 1 && sm.roles[0] === 'umum')) && match.roles && match.roles.length > 0) {
                sm.roles = match.roles;
                sm.role = match.roles[0] || match.role || 'umum';
              }
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
        return sheetMembers;
      }
      return [];
    } catch (error) {
      console.warn('getMembers API error, falling back to Firestore:', (error as any)?.message || error);
      const members = await firestoreService.getMembers();
      return members.map((m: any) => this.mapUser(m));
    }
  },

  async saveMember(userData: any): Promise<any> {
    if (!IS_API_VALID) {
      const saved = await firestoreService.saveMember(userData as User);
      return { success: true, message: 'Saved to Firestore', member: saved };
    }
    const payload = {
      ...userData,
      email: userData.email,
      namaLengkap: userData.namaLengkap,
      role: Array.isArray(userData.roles) ? JSON.stringify(userData.roles) : userData.role,
      pelatihan: Array.isArray(userData.pelatihan) ? JSON.stringify(userData.pelatihan) : userData.pelatihan,
      upgradeRequests: Array.isArray(userData.upgradeRequests) ? JSON.stringify(userData.upgradeRequests) : userData.upgradeRequests
    };
    try {
      const res = await this.post({ action: 'saveMember', ...payload });
      await firestoreService.saveMember(userData as User);
      return res;
    } catch (err) {
      const saved = await firestoreService.saveMember(userData as User);
      return { success: true, member: saved };
    }
  },

  async deleteMember(id: string): Promise<any> {
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
    if (!IS_API_VALID) {
      return await firestoreService.getKTAApplications();
    }
    try {
      const response = await axios.get(`${API_URL}?action=getKTAApplications&_t=${Date.now()}`, { timeout: 4000 });
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
        return apps;
      }
      return await firestoreService.getKTAApplications();
    } catch (e) {
      console.warn('getKTAApplications API error, falling back to Firestore:', (e as any)?.message || e);
      return await firestoreService.getKTAApplications();
    }
  },

  async applyKTA(ktaData: any): Promise<any> {
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
    if (userId || email) {
      try {
        const members = await firestoreService.getMembers();
        const m = members.find((x: any) => 
          (userId && String(x.id) === String(userId)) || 
          (email && String(x.email).toLowerCase().trim() === String(email).toLowerCase().trim())
        );
        if (m) {
          const updated = {
            ...m,
            namaLengkap: appData.nama || m.namaLengkap,
            email: appData.email || m.email,
            noHp: appData.noWa || m.noHp,
            nbm: appData.nbm || m.nbm || (m as any).noNbm || '',
            tempatLahir: appData.tempatLahir || (m as any).tempatLahir,
            tanggalLahir: appData.tanggalLahir || (m as any).tanggalLahir,
            jenisKelamin: appData.jenisKelamin || m.jenisKelamin,
            qabilah: appData.qabilah || m.qabilah,
            asalKwarda: appData.asalDaerah || m.asalKwarda,
            golongan: appData.golonganAnggota || m.golongan
          };
          await firestoreService.saveMember(updated);
        } else if (appData.nama && appData.nama.trim()) {
          const newMember: any = {
            id: userId || `user-manual-${Date.now()}`,
            namaLengkap: appData.nama.trim(),
            email: appData.email || '',
            noHp: appData.noWa || '',
            nbm: appData.nbm || '',
            tempatLahir: appData.tempatLahir || '',
            tanggalLahir: appData.tanggalLahir || '',
            jenisKelamin: appData.jenisKelamin || 'L',
            qabilah: appData.qabilah || '',
            asalKwarda: appData.asalDaerah || '',
            golongan: appData.golonganAnggota || 'Pengenal',
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
    if (!IS_API_VALID) {
      return await firestoreService.getTrainingApplications();
    }
    try {
      const response = await axios.get(`${API_URL}?action=getTrainingApplications&_t=${Date.now()}`);
      if (Array.isArray(response.data) && response.data.length > 0) {
        const apiTrainings = response.data.map((t: any, idx: number) => ({
          ...t,
          id: t.id || `train-api-${idx}`
        })).filter((t: any) => t.nama && t.nama.trim() !== '' && t.status !== 'deleted');
        
        apiTrainings.forEach(tr => firestoreService.createTrainingApplication(tr).catch(() => {}));
        return apiTrainings;
      }
      return await firestoreService.getTrainingApplications();
    } catch (e) {
      console.warn('getTrainingApplications API error, falling back to Firestore:', (e as any)?.message || e);
      return await firestoreService.getTrainingApplications();
    }
  },

  async applyTraining(trainingData: any): Promise<any> {
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
    const remark = param3 || param4;
    if (IS_API_VALID) {
      this.post({ action: 'updateTrainingStatus', id, status, remark }).catch(e => console.warn('Background updateTrainingStatus post error:', e));
    }
    if (status === 'deleted') {
      await firestoreService.deleteTrainingApplication(id);
      return { success: true };
    }
    const updated = await firestoreService.updateTrainingStatus(id, status, remark);
    
    // If approved, update member role/isVerified in Firestore as well
    if (status === 'approved' && updated && (updated.userId || updated.email)) {
      try {
        const members = await firestoreService.getMembers();
        const m = members.find((x: any) => 
          (updated.userId && String(x.id) === String(updated.userId)) ||
          (updated.email && String(x.email).toLowerCase().trim() === String(updated.email).toLowerCase().trim())
        );
        if (m) {
          m.isVerified = true;
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
    if (IS_API_VALID) {
      this.post({
        action: 'updateGrade',
        id,
        nilai: gradeStr,
        remark: isObj ? (nilai.remark || '') : undefined,
        statusKelulusan: isObj ? (nilai.statusKelulusan || '') : undefined
      }).catch(() => {});
    }
    await firestoreService.updateAssignmentGrade(id, undefined, gradeStr);
    if (isObj && (nilai.remark || nilai.statusKelulusan)) {
      await firestoreService.updateTrainingStatus(id, 'approved', nilai.remark);
    }
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

  async getContents(section?: string): Promise<Content[]> {
    if (IS_API_VALID) {
      try {
        const response = await axios.get(`${API_URL}?action=getContents${section ? `&section=${section}` : ''}&_t=${Date.now()}`);
        if (Array.isArray(response.data) && response.data.length > 0) {
          return response.data;
        } else if (response.data && Array.isArray(response.data.contents) && response.data.contents.length > 0) {
          return response.data.contents;
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

    const DEFAULT_TYPES = ['Jaya Melati 1', 'Jaya Melati 2', 'Jaya Matahari 1', 'Jaya Matahari 2'];
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
        upgradeFees: [
          { id: 'sugli', label: 'Dewan Sugli', value: 'Rp 0', note: 'Ajuan + SK via WhatsApp' },
          { id: 'kwarda', label: 'Kwarda', value: 'Rp 0', note: 'Ajuan + SK via WhatsApp' },
          { id: 'jati1', label: 'Jaya Melati 1', value: 'Rp 50.000', note: 'Konfirmasi Bayar' },
          { id: 'jati2', label: 'Jaya Melati 2', value: 'Rp 50.000', note: 'Konfirmasi Bayar' },
          { id: 'jari1', label: 'Jaya Matahari 1', value: 'Rp 50.000', note: 'Konfirmasi Bayar' },
        ]
      };
      const result = {
        ...parsed,
        trainingTypes: safeParse(parsed.trainingTypes, DEFAULT_TYPES),
        trainingActivities: safeParse(parsed.trainingActivities, DEFAULT_ACTIVITIES),
        trainingLocations: safeParse(parsed.trainingLocations, ['Gedung Dakwah Muhammadiyah Jateng', 'Kwarda Banyumas', 'Pusdiklat HW Jateng']),
        trainingDates: safeParse(parsed.trainingDates, ['12-14 Juli 2026', '1-3 Agustus 2026', '15-17 September 2026']),
        upgradeFees: safeParse(parsed.upgradeFees, [
          { id: 'sugli', label: 'Dewan Sugli', value: 'Rp 0', note: 'Ajuan + SK via WhatsApp' },
          { id: 'kwarda', label: 'Kwarda', value: 'Rp 0', note: 'Ajuan + SK via WhatsApp' },
          { id: 'jati1', label: 'Jaya Melati 1', value: 'Rp 50.000', note: 'Konfirmasi Bayar' },
          { id: 'jati2', label: 'Jaya Melati 2', value: 'Rp 50.000', note: 'Konfirmasi Bayar' },
          { id: 'jari1', label: 'Jaya Matahari 1', value: 'Rp 50.000', note: 'Konfirmasi Bayar' },
        ])
      };
      localStorage.setItem('hw_settings', JSON.stringify(result));
      return result;
    }
    try {
      const response = await axios.get(`${API_URL}?action=getSettings&_t=${Date.now()}`, { timeout: 4000 });
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
        upgradeFees: safeParse(apiSettings.upgradeFees || fsSettings?.upgradeFees, [
          { id: 'sugli', label: 'Dewan Sugli', value: 'Rp 0', note: 'Ajuan + SK via WhatsApp' },
          { id: 'kwarda', label: 'Kwarda', value: 'Rp 0', note: 'Ajuan + SK via WhatsApp' },
          { id: 'jati1', label: 'Jaya Melati 1', value: 'Rp 50.000', note: 'Konfirmasi Bayar' },
          { id: 'jati2', label: 'Jaya Melati 2', value: 'Rp 50.000', note: 'Konfirmasi Bayar' },
          { id: 'jari1', label: 'Jaya Matahari 1', value: 'Rp 50.000', note: 'Konfirmasi Bayar' },
        ])
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
        upgradeFees: [
          { id: 'sugli', label: 'Dewan Sugli', value: 'Rp 0', note: 'Ajuan + SK via WhatsApp' },
          { id: 'kwarda', label: 'Kwarda', value: 'Rp 0', note: 'Ajuan + SK via WhatsApp' },
          { id: 'jati1', label: 'Jaya Melati 1', value: 'Rp 50.000', note: 'Konfirmasi Bayar' },
          { id: 'jati2', label: 'Jaya Melati 2', value: 'Rp 50.000', note: 'Konfirmasi Bayar' },
          { id: 'jari1', label: 'Jaya Matahari 1', value: 'Rp 50.000', note: 'Konfirmasi Bayar' },
        ]
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
        upgradeFees: safeParse(parsed.upgradeFees, [
          { id: 'sugli', label: 'Dewan Sugli', value: 'Rp 0', note: 'Ajuan + SK via WhatsApp' },
          { id: 'kwarda', label: 'Kwarda', value: 'Rp 0', note: 'Ajuan + SK via WhatsApp' },
          { id: 'jati1', label: 'Jaya Melati 1', value: 'Rp 50.000', note: 'Konfirmasi Bayar' },
          { id: 'jati2', label: 'Jaya Melati 2', value: 'Rp 50.000', note: 'Konfirmasi Bayar' },
          { id: 'jari1', label: 'Jaya Matahari 1', value: 'Rp 50.000', note: 'Konfirmasi Bayar' },
        ])
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
    return await firestoreService.backupAndUploadAllToFirestore();
  },

  // --- KEGIATAN HW JATENG METHODS ---
  async getActivityCategories(): Promise<string[]> {
    return await firestoreService.getActivityCategories();
  },

  async saveActivityCategory(categoryName: string): Promise<string[]> {
    return await firestoreService.saveActivityCategory(categoryName);
  },

  async deleteActivityCategory(categoryName: string): Promise<string[]> {
    return await firestoreService.deleteActivityCategory(categoryName);
  },

  subscribeToActivityCategories(callback: (categories: string[]) => void): () => void {
    return firestoreService.subscribeToActivityCategories(callback);
  },

  subscribeToActivities(callback: (activities: any[]) => void): () => void {
    return firestoreService.subscribeToActivities(callback);
  },

  subscribeToActivityApplications(callback: (apps: any[]) => void): () => void {
    return firestoreService.subscribeToActivityApplications(callback);
  },

  async getActivities(): Promise<any[]> {
    return await firestoreService.getActivities();
  },

  async saveActivity(activityData: any): Promise<any> {
    return await firestoreService.saveActivity(activityData);
  },

  async deleteActivity(id: string, title?: string): Promise<boolean> {
    return await firestoreService.deleteActivity(id, title);
  },

  async getActivityApplications(): Promise<any[]> {
    try {
      const apps = await firestoreService.getActivityApplications();
      if (apps && apps.length > 0) {
        return apps;
      }
    } catch (e) {
      console.warn('getActivityApplications Firestore error, trying fallback:', e);
    }
    if (IS_API_VALID) {
      try {
        const apps = await this.fetch('getActivityApplications');
        if (Array.isArray(apps) && apps.length > 0) {
          apps.forEach(a => {
            firestoreService.registerActivity(a).catch(() => {});
          });
          return apps;
        }
      } catch (e) {
        console.warn('getActivityApplications Sheets API error:', (e as any)?.message || e);
      }
    }
    return await firestoreService.getActivityApplications();
  },

  async registerActivity(appData: any): Promise<any> {
    const saved = await firestoreService.registerActivity(appData);
    if (IS_API_VALID) {
      this.post({ action: 'registerActivity', ...appData }).catch(() => {});
    }
    return saved;
  },

  async deleteActivityApplication(id: string): Promise<boolean> {
    const res = await firestoreService.deleteActivityApplication(id);
    if (IS_API_VALID) {
      this.post({ action: 'deleteActivityApplication', id }).catch(() => {});
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
        field1: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        field2: 'Lagu Mars Hizbul Wathan'
      },
      {
        id: 'galeri-2',
        section: 'galeri',
        field1: 'https://www.youtube.com/watch?v=mD03u6-T9u8',
        field2: 'Profil Kwarda Banyumas'
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
        field1: 'https://drive.google.com/file/d/1v7WraV30e1Bk8zQpLeghz5fHbKCsyHtG/view?usp=drive_link',
        field2: 'Sahabat HW (Official)'
      },
      {
        id: 'playlist-2',
        section: 'playlist',
        field1: 'https://drive.google.com/file/d/1Zq0rDBB3QUeYv_Ya4fbN5wJTjlzg3btH/view',
        field2: 'HW Untuk Indonesia'
      }
    ];
  },
  
  isMockEnabled() {
    return !IS_API_VALID;
  }
} as any;

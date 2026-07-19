import axios from 'axios';
import { User, Materi, Content, UserRole } from '../types';
import { INITIAL_SPREADSHEET_DATA } from './initialSpreadsheetData';

export let API_URL = import.meta.env.VITE_GSHEET_API_URL;
export let IS_API_VALID = API_URL && API_URL !== 'undefined' && API_URL.startsWith('http');

export const updateApiUrlFromStorage = () => {
  let url = import.meta.env.VITE_GSHEET_API_URL;
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

// Initialize mock data on load if not present
export const initMockData = () => {
  if (typeof window === 'undefined') return;
  
  if (!localStorage.getItem('mock_members_initialized') || !localStorage.getItem('mock_members')) {
    const parsedUsers = INITIAL_SPREADSHEET_DATA.users.map((u: any, idx: number) => {
      const id = u.id || `user-${1000 + idx}`;
      return {
        ...u,
        id: String(id),
        isVerified: u.isVerified === true || u.isVerified === "TRUE" || u.isVerified === 1 || u.isVerified === "true" || u.isVerified === "1"
      };
    });
    
    // Add Bayu Ghifari Javalino
    parsedUsers.push({
      id: "user-bayu-ghifari",
      email: "bayughifari@gmail.com",
      password: "12345hw",
      namaLengkap: "Bayu Ghifari Javalino",
      role: "umum",
      roles: ["umum"],
      jenisKelamin: "L",
      golongan: "Dewasa",
      pendidikan: "S1",
      pelatihan: [],
      asalKwarda: "Banyumas",
      qabilah: "Sudirman",
      alamat: "Purwokerto, Banyumas",
      isVerified: false,
      sosmed: "@bayughifari",
      noHp: "081234567890",
      upgradeRequests: []
    });

    localStorage.setItem('mock_members', JSON.stringify(parsedUsers));
    localStorage.setItem('mock_members_initialized', 'true');
  } else {
    try {
      const stored = localStorage.getItem('mock_members');
      if (stored) {
        const parsed = JSON.parse(stored);
        let changed = false;
        
        // Ensure Bayu Ghifari Javalino is present
        const hasBayu = parsed.some((m: any) => 
          (m.namaLengkap && m.namaLengkap.toLowerCase().includes('bayu ghifari')) ||
          (m.namalengkap && m.namalengkap.toLowerCase().includes('bayu ghifari')) ||
          (m.email && m.email.toLowerCase().includes('bayughifari'))
        );
        
        if (!hasBayu) {
          parsed.push({
            id: "user-bayu-ghifari",
            email: "bayughifari@gmail.com",
            password: "12345hw",
            namaLengkap: "Bayu Ghifari Javalino",
            role: "umum",
            roles: ["umum"],
            jenisKelamin: "L",
            golongan: "Dewasa",
            pendidikan: "S1",
            pelatihan: [],
            asalKwarda: "Banyumas",
            qabilah: "Sudirman",
            alamat: "Purwokerto, Banyumas",
            isVerified: false,
            sosmed: "@bayughifari",
            noHp: "081234567890",
            upgradeRequests: []
          });
          changed = true;
        }

        const repaired = parsed.map((m: any, idx: number) => {
          if (!m.id) {
            changed = true;
            return { ...m, id: m.email ? `user-${m.email.toLowerCase().replace(/[^a-zA-Z0-9]/g, '_')}` : `user-repaired-${1000 + idx}` };
          }
          return m;
        });
        
        if (changed) {
          localStorage.setItem('mock_members', JSON.stringify(repaired));
        }
      }
    } catch (e) {
      console.error('Repair mock_members error:', e);
    }
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
    const parsedKta = (INITIAL_SPREADSHEET_DATA.kta || []).map((k: any, idx: number) => {
      const id = k.id || `kta-${1000 + idx}`;
      return {
        ...k,
        id: String(id)
      };
    });
    localStorage.setItem('kta_applications', JSON.stringify(parsedKta));
    localStorage.setItem('kta_applications_initialized', 'true');
  } else {
    try {
      const stored = localStorage.getItem('kta_applications');
      if (stored) {
        const parsed = JSON.parse(stored);
        let changed = false;
        const repaired = parsed.map((k: any, idx: number) => {
          if (!k.id) {
            changed = true;
            return { ...k, id: `kta-repaired-${1000 + idx}` };
          }
          return k;
        });
        if (changed) {
          localStorage.setItem('kta_applications', JSON.stringify(repaired));
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
    // Add special check for super admin as requested
    if (email === 'admin' && password === 'adnimku') {
      return {
        token: 'super-admin-token',
        user: {
          id: 'super-admin',
          email: 'admin@hw.org',
          namaLengkap: 'Super Admin HW',
          role: 'superadmin',
          jenisKelamin: 'L',
          golongan: 'Pembina',
          pelatihan: ['Jati 3'],
          pendidikan: 'S1',
          asalKwarda: 'Pusat',
          qabilah: 'Pusat',
          alamat: 'Jakarta',
          noHp: '08000000000',
          sosmed: '@hw_pusat'
        }
      };
    }

    if (!IS_API_VALID) {
      console.warn('VITE_GSHEET_API_URL not found. Using Mock Mode.');
      return this.mockLogin(email, password);
    }

    try {
      const res = await this.post({
        action: 'login',
        email,
        password
      });
      if (res.user) {
        res.user = this.mapUser(res.user);
      }
      return res;
    } catch (error: any) {
      console.error('Login API Error:', error);
      // If we have an API URL but it failed, we should probably know why
      // Only fallback to mock if the error is specifically about the URL/network
      if (error.message?.includes('network') || error.message?.includes('404')) {
         console.warn('API call failed, falling back to mock mode for stability');
         return this.mockLogin(email, password);
      }
      throw error; // Rethrow to show the error in UI
    }
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
      namaLengkap: data.namaLengkap || data.namalengkap || '',
      jenisKelamin: data.jenisKelamin || data.jeniskelamin || 'L',
      golongan: data.golongan || '',
      pelatihan: parseArrayField(data.pelatihan),
      pendidikan: data.pendidikan || '',
      asalKwarda: data.asalKwarda || data.asalkwarda || '',
      qabilah: data.qabilah || '',
      alamat: data.alamat || '',
      noHp: data.noHp || data.nohp || '',
      sosmed: data.sosmed || '',
      role: 'umum' as UserRole,
      roles: [] as UserRole[],
      activeRole: 'umum' as UserRole,
      isVerified: data.isVerified !== undefined ? data.isVerified : (data.isverified !== undefined ? data.isverified : false),
      upgradeRequests: parseArrayField(data.upgradeRequests || data.upgraderequests),
      photo: data.photo || data.foto || data.Photo || data.Foto || ''
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

  mockLogin(email: string, password: string): { user: User; token: string } {
    // Check in localStorage mock members database first
    const stored = localStorage.getItem('mock_members');
    if (stored) {
      try {
        const members = JSON.parse(stored);
        const found = members.find((m: any) => m.email?.trim().toLowerCase() === email.trim().toLowerCase());
        if (found) {
          const expectedPass = found.password || '12345hw';
          // Check password - allow exact match or universal fallback passwords for convenience
          if (password === expectedPass || password === '12345hw' || password === 'admin' || password === 'alda') {
            return {
              token: `mock-token-${found.email}`,
              user: this.mapUser(found)
            };
          } else {
            throw new Error('Email atau password salah.');
          }
        }
      } catch (e: any) {
        if (e.message?.includes('salah')) throw e;
        console.error('Error in mockLogin from localStorage:', e);
      }
    }

    if (email === 'admin@hw.org' && password === 'admin') {
      return {
        token: 'mock-token-admin',
        user: {
          id: '1',
          email: 'admin@hw.org',
          namaLengkap: 'Ramanda Admin',
          role: 'superadmin',
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

    // Add Alda Putri mock for testing as requested
    if (email === 'aldaputri@gmail.com') {
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

    // Default mock behavior for other emails during development
    if (password === 'password123' || password === '123456' || password === 'admin' || password === 'alda') {
      return {
        token: 'mock-token-generic',
        user: {
          id: 'mock-' + Math.random().toString(36).substr(2, 9),
          email: email,
          namaLengkap: email.split('@')[0].split('.').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' '),
          role: 'umum',
          jenisKelamin: 'L',
          golongan: 'Pengenal',
          pelatihan: [],
          pendidikan: 'SMP',
          asalKwarda: 'Banyumas',
          qabilah: 'Umum',
          alamat: 'Jawa Tengah',
          noHp: '0812' + Math.floor(Math.random() * 100000000),
          sosmed: '@' + email.split('@')[0],
          isVerified: false
        }
      };
    }

    throw new Error('Email atau password salah.');
  },

  isMock: () => !IS_API_VALID,

  async post(data: any): Promise<any> {
    if (!IS_API_VALID) throw new Error('Konfigurasi API Google Sheets belum diatur (VITE_GSHEET_API_URL)');
    
    // We use text/plain to avoid CORS preflight (OPTIONS) which Google Apps Script doesn't support
    const response = await axios.post(API_URL!, JSON.stringify(data), {
      headers: {
        'Content-Type': 'text/plain',
      }
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
    if (this.isMock()) {
      const stored = localStorage.getItem('mock_members') || '[]';
      try {
        let members = JSON.parse(stored);
        const exists = members.some((m: any) => m.email?.trim().toLowerCase() === userData.email?.trim().toLowerCase());
        if (exists) {
          throw new Error('Email sudah terdaftar.');
        }
        const newMember = {
          id: `user-${Date.now()}`,
          isVerified: false,
          role: 'umum',
          roles: ['umum'],
          ...userData
        };
        members.push(newMember);
        localStorage.setItem('mock_members', JSON.stringify(members));
        return { success: true, message: 'Registrasi simulasi berhasil.' };
      } catch (err: any) {
        throw err;
      }
    }
    return this.post({
      action: 'register',
      ...userData
    });
  },

  mapMateri(data: any): Materi {
    return {
      id: data.id || '',
      judul: data.judul || '',
      konten: data.konten || '',
      kategori: data.kategori || '',
      tanggal: data.tanggal || '',
      coverImage: data.coverImage || data.coverimage || '',
      linkExternal: data.linkExternal || data.linkexternal || '',
      driveUrl: data.driveUrl || data.driveurl || ''
    };
  },

  async getMateri(role: string): Promise<Materi[]> {
    if (!IS_API_VALID) {
      const stored = localStorage.getItem('materi') || '[]';
      let list = [];
      try {
        list = JSON.parse(stored);
      } catch (err) {
        list = this.getMockMateri();
      }
      return list.filter((m: any) => m.kategori === role);
    }
    try {
      const response = await axios.get(`${API_URL}?action=getMateri&role=${role}&_t=${Date.now()}`);
      if (Array.isArray(response.data)) {
        return response.data.map((m: any) => this.mapMateri(m));
      }
      return [];
    } catch (error) {
      console.error('getMateri API error:', error);
      return this.getMockMateri();
    }
  },

  async saveMateri(materi: any): Promise<any> {
    if (this.isMock()) {
      const stored = localStorage.getItem('materi') || '[]';
      try {
        let list = JSON.parse(stored);
        const idx = list.findIndex((m: any) => m.id === materi.id);
        const mapped = {
          ...materi,
          id: materi.id || `materi-${Date.now()}`
        };
        if (idx !== -1) {
          list[idx] = { ...list[idx], ...mapped };
        } else {
          list.push(mapped);
        }
        localStorage.setItem('materi', JSON.stringify(list));
        return { success: true };
      } catch (err) {
        console.error(err);
      }
    }
    // Normalize case for backend compatibility
    const payload = {
      ...materi,
      driveurl: materi.driveUrl || materi.driveurl || '',
      coverimage: materi.coverImage || materi.coverimage || '',
      linkexternal: materi.linkExternal || materi.linkexternal || ''
    };
    return this.post({
      action: 'saveMateri',
      ...payload
    });
  },

  async deleteMateri(id: string): Promise<any> {
    if (this.isMock()) {
      const stored = localStorage.getItem('materi') || '[]';
      try {
        let list = JSON.parse(stored);
        list = list.filter((m: any) => m.id !== id);
        localStorage.setItem('materi', JSON.stringify(list));
        return { success: true };
      } catch (err) {
        console.error(err);
      }
    }
    return this.post({
      action: 'deleteMateri',
      id
    });
  },

  async getMembers(): Promise<User[]> {
    if (!IS_API_VALID) {
      const stored = localStorage.getItem('mock_members') || '[]';
      try {
        const members = JSON.parse(stored);
        return members.map((m: any) => this.mapUser(m));
      } catch (err) {
        console.error('getMembers parse error:', err);
      }
      return [];
    }
    try {
      const response = await axios.get(`${API_URL}?action=getMembers&_t=${Date.now()}`);
      if (Array.isArray(response.data)) {
        return response.data.map((m: any) => this.mapUser(m));
      }
      return [];
    } catch (error) {
      console.error('getMembers API error:', error);
      return [];
    }
  },

  async saveMember(userData: any): Promise<any> {
    if (this.isMock()) {
      const stored = localStorage.getItem('mock_members') || '[]';
      try {
        let members = JSON.parse(stored);
        const idx = members.findIndex((m: any) => String(m.id) === String(userData.id) || m.email?.trim().toLowerCase() === userData.email?.trim().toLowerCase());
        const mapped = {
          ...userData,
          id: userData.id || `user-${Date.now()}`
        };
        if (idx !== -1) {
          members[idx] = { ...members[idx], ...mapped };
        } else {
          members.push(mapped);
        }
        localStorage.setItem('mock_members', JSON.stringify(members));
        return { success: true, message: 'Simulation success' };
      } catch (err) {
        console.error(err);
      }
    }

    // Normalize data for backend based on exact schema
    const payload = {
      ...userData,
      email: userData.email, // critical identifier
      namaLengkap: userData.namaLengkap,
      role: Array.isArray(userData.roles) ? JSON.stringify(userData.roles) : userData.role,
      pelatihan: Array.isArray(userData.pelatihan) ? JSON.stringify(userData.pelatihan) : userData.pelatihan,
      upgradeRequests: Array.isArray(userData.upgradeRequests) ? JSON.stringify(userData.upgradeRequests) : userData.upgradeRequests
    };
    
    return await this.post({
      action: 'saveMember',
      ...payload
    });
  },

  async deleteMember(id: string): Promise<any> {
    if (this.isMock()) {
      const stored = localStorage.getItem('mock_members') || '[]';
      try {
        let list = JSON.parse(stored);
        list = list.filter((m: any) => String(m.id) !== String(id));
        localStorage.setItem('mock_members', JSON.stringify(list));
        return { success: true };
      } catch (err) {
        console.error(err);
      }
    }
    return this.post({
      action: 'deleteMember',
      id
    });
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

  async requestUpgrade(userId: string, category: string): Promise<any> {
    return this.post({
      action: 'requestUpgrade',
      userId,
      category
    });
  },

  async getKTAApplications(): Promise<any[]> {
    const normalizeKTAKeys = (app: any) => {
      if (!app) return app;
      const cleanApp: any = {};
      for (const key in app) {
        const lowerKey = key.toLowerCase().replace(/[\s_-]/g, '');
        let clientKey = key;
        if (lowerKey === 'id') clientKey = 'id';
        else if (lowerKey === 'userid') clientKey = 'userId';
        else if (lowerKey === 'nama' || lowerKey === 'namalengkap') clientKey = 'nama';
        else if (lowerKey === 'nowa' || lowerKey === 'nohp' || lowerKey === 'nohandphone' || lowerKey === 'notelp') clientKey = 'noWa';
        else if (lowerKey === 'email') clientKey = 'email';
        else if (lowerKey === 'sosmed' || lowerKey === 'instagram' || lowerKey === 'socialmedia') clientKey = 'sosmed';
        else if (lowerKey === 'photo' || lowerKey === 'foto') clientKey = 'photo';
        else if (lowerKey === 'tingkatan') clientKey = 'tingkatan';
        else if (lowerKey === 'asaldaerah' || lowerKey === 'asalkwarda') clientKey = 'asalDaerah';
        else if (lowerKey === 'status') clientKey = 'status';
        else if (lowerKey === 'tanggalajuan') clientKey = 'tanggalAjuan';
        else if (lowerKey === 'ktanumber') clientKey = 'ktaNumber';
        else if (lowerKey === 'remark') clientKey = 'remark';
        else if (lowerKey === 'nik') clientKey = 'nik';
        else if (lowerKey === 'tempatlahir') clientKey = 'tempatLahir';
        else if (lowerKey === 'tanggallahir') clientKey = 'tanggalLahir';
        else if (lowerKey === 'jeniskelamin') clientKey = 'jenisKelamin';
        else if (lowerKey === 'qabilah') clientKey = 'qabilah';
        else if (lowerKey === 'jeniskta') clientKey = 'jenisKta';
        else if (lowerKey === 'verifiedat') clientKey = 'verifiedAt';
        else if (lowerKey === 'alamat') clientKey = 'alamat';
        
        cleanApp[clientKey] = app[key];
      }

      // Normalize status
      const finalStatus = (cleanApp.status || "").toString().trim().toLowerCase();
      if (!finalStatus) {
        if (cleanApp.ktaNumber) {
          cleanApp.status = 'approved';
        } else {
          cleanApp.status = 'pending';
        }
      } else {
        if (['approved', 'aktif', 'disetujui', 'sukses', 'terbit', 'selesai', 'active'].includes(finalStatus)) {
          cleanApp.status = 'approved';
        } else if (['rejected', 'ditolak'].includes(finalStatus)) {
          cleanApp.status = 'rejected';
        } else {
          cleanApp.status = 'pending';
        }
      }
      return cleanApp;
    };

    if (!IS_API_VALID) {
      const stored = localStorage.getItem('kta_applications');
      let apps: any[] = [];
      if (stored) {
        try {
          apps = JSON.parse(stored);
        } catch (e) {
          console.error(e);
        }
      } else {
        const defaults = [
          {
            id: 'kta-mock-1',
            userId: 'user-alda',
            nama: 'Alda Putri',
            alamat: 'Purwokerto Utara, Banyumas',
            tingkatan: 'Athfal',
            asalDaerah: 'Banyumas',
            noWa: '081234567890',
            email: 'aldaputri@gmail.com',
            sosmed: '@aldaputri',
            status: 'pending',
            tanggalAjuan: '2026-06-15T09:00:00.000Z'
          },
          {
            id: 'kta-mock-2',
            userId: 'user-mock-2',
            nama: 'Budi Santoso',
            alamat: 'Sokaraja, Banyumas',
            tingkatan: 'Pengenal',
            asalDaerah: 'Banyumas',
            noWa: '085712345678',
            email: 'budi@gmail.com',
            sosmed: '@budi_hw',
            status: 'approved',
            ktaNumber: 'KTA-HW.JT.2606.0028',
            tanggalAjuan: '2026-06-12T14:30:00.000Z'
          }
        ];
        localStorage.setItem('kta_applications', JSON.stringify(defaults));
        apps = defaults;
      }
      return apps.map((k: any, idx: number) => {
        const normalized = normalizeKTAKeys(k);
        return {
          ...normalized,
          id: normalized.id || `kta-fallback-${idx}`
        };
      }).filter((k: any) => k.nama && k.nama.trim() !== '');
    }
    try {
      const response = await axios.get(`${API_URL}?action=getKTAApplications&_t=${Date.now()}`);
      if (Array.isArray(response.data)) {
        return response.data.map((k: any, idx: number) => {
          const normalized = normalizeKTAKeys(k);
          return {
            ...normalized,
            id: normalized.id || `kta-api-${idx}`
          };
        }).filter((k: any) => k.nama && k.nama.trim() !== '');
      }
      return [];
    } catch (e) {
      console.error('getKTAApplications API error, falling back to localStorage:', e);
      const stored = localStorage.getItem('kta_applications') || '[]';
      try {
        const apps = JSON.parse(stored);
        return apps.map((k: any, idx: number) => {
          const normalized = normalizeKTAKeys(k);
          return {
            ...normalized,
            id: normalized.id || `kta-fallback-${idx}`
          };
        }).filter((k: any) => k.nama && k.nama.trim() !== '');
      } catch (err) {
        return [];
      }
    }
  },

  async applyKTA(ktaData: any): Promise<any> {
    if (!IS_API_VALID) {
      const stored = localStorage.getItem('kta_applications');
      let list = [];
      if (stored) {
        try {
          list = JSON.parse(stored);
        } catch (e) {
          console.error(e);
        }
      }
      
      const existingIndex = list.findIndex((item: any) => 
        (ktaData.id && item.id === ktaData.id) || 
        (item.email && ktaData.email && item.email.toLowerCase().trim() === ktaData.email.toLowerCase().trim()) ||
        (item.userId && ktaData.userId && String(item.userId) === String(ktaData.userId))
      );
      
      const existingApp = existingIndex > -1 ? list[existingIndex] : null;
      
      const newApp = {
        id: ktaData.id && !ktaData.id.startsWith('kta-sync-') 
          ? ktaData.id 
          : (existingApp ? existingApp.id : 'kta-' + Math.random().toString(36).substring(2, 9)),
        status: existingApp ? (existingApp.status === 'rejected' ? 'pending' : existingApp.status) : 'pending',
        tanggalAjuan: existingApp ? (existingApp.tanggalAjuan || existingApp.tanggalajuan || new Date().toISOString()) : new Date().toISOString(),
        ...ktaData
      };
      
      if (existingApp && existingApp.ktaNumber && !newApp.ktaNumber) {
        newApp.ktaNumber = existingApp.ktaNumber;
      }
      
      list = list.filter((item: any, idx) => idx !== existingIndex);
      list = list.filter((item: any) => item.email !== ktaData.email && item.userId !== ktaData.userId && item.id !== newApp.id);
      list.push(newApp);
      localStorage.setItem('kta_applications', JSON.stringify(list));
      return { success: true, application: newApp };
    }
    try {
      return await this.post({
        action: 'applyKTA',
        ...ktaData
      });
    } catch (e) {
      console.error('applyKTA API error, falling back to local storage:', e);
      const stored = localStorage.getItem('kta_applications') || '[]';
      let list = [];
      try {
        list = JSON.parse(stored);
      } catch (err) {
        console.error(err);
      }
      
      const existingIndex = list.findIndex((item: any) => 
        (ktaData.id && item.id === ktaData.id) || 
        (item.email && ktaData.email && item.email.toLowerCase().trim() === ktaData.email.toLowerCase().trim()) ||
        (item.userId && ktaData.userId && String(item.userId) === String(ktaData.userId))
      );
      
      const existingApp = existingIndex > -1 ? list[existingIndex] : null;
      
      const newApp = {
        id: ktaData.id && !ktaData.id.startsWith('kta-sync-') 
          ? ktaData.id 
          : (existingApp ? existingApp.id : 'kta-' + Math.random().toString(36).substring(2, 9)),
        status: existingApp ? (existingApp.status === 'rejected' ? 'pending' : existingApp.status) : 'pending',
        tanggalAjuan: existingApp ? (existingApp.tanggalAjuan || existingApp.tanggalajuan || new Date().toISOString()) : new Date().toISOString(),
        ...ktaData
      };
      
      if (existingApp && existingApp.ktaNumber && !newApp.ktaNumber) {
        newApp.ktaNumber = existingApp.ktaNumber;
      }
      
      list = list.filter((item: any, idx) => idx !== existingIndex);
      list = list.filter((item: any) => item.email !== ktaData.email && item.userId !== ktaData.userId && item.id !== newApp.id);
      list.push(newApp);
      localStorage.setItem('kta_applications', JSON.stringify(list));
      return { success: true, application: newApp };
    }
  },

  async saveKTAApplication(appData: any): Promise<any> {
    if (!IS_API_VALID) {
      const stored = localStorage.getItem('kta_applications') || '[]';
      try {
        let list = JSON.parse(stored);
        const idx = list.findIndex((x: any) => String(x.id) === String(appData.id));
        if (idx !== -1) {
          list[idx] = { ...list[idx], ...appData };
          localStorage.setItem('kta_applications', JSON.stringify(list));
          
          // Also sync user verification if status is changed to approved
          if (appData.userId && appData.status) {
            try {
              const membersStored = localStorage.getItem('mock_members') || '[]';
              const membersList = JSON.parse(membersStored);
              const mIdx = membersList.findIndex((m: any) => String(m.id) === String(appData.userId) || m.email === appData.email);
              if (mIdx !== -1) {
                membersList[mIdx].isVerified = (appData.status === 'approved');
                localStorage.setItem('mock_members', JSON.stringify(membersList));
              }
            } catch (err) {
              console.error(err);
            }
          }
          return { success: true, application: list[idx] };
        }
      } catch (e) {
        console.error(e);
      }
      return { success: false, message: 'Application not found locally' };
    }
    try {
      return await this.post({
        action: 'saveKTAApplication',
        ...appData
      });
    } catch (e) {
      console.error('saveKTAApplication API error, falling back to local storage:', e);
      const stored = localStorage.getItem('kta_applications') || '[]';
      try {
        let list = JSON.parse(stored);
        const idx = list.findIndex((x: any) => String(x.id) === String(appData.id));
        if (idx !== -1) {
          list[idx] = { ...list[idx], ...appData };
          localStorage.setItem('kta_applications', JSON.stringify(list));
          return { success: true, application: list[idx] };
        }
      } catch (err) {
        console.error(err);
      }
      return { success: false, message: 'Failed to save application' };
    }
  },

  async saveTrainingApplicationAndSyncMember(appData: any): Promise<any> {
    if (!IS_API_VALID) {
      const stored = localStorage.getItem('training_applications') || '[]';
      try {
        let list = JSON.parse(stored);
        const idx = list.findIndex((x: any) => String(x.id) === String(appData.id));
        if (idx !== -1) {
          // Update training app
          list[idx] = { ...list[idx], ...appData };
          localStorage.setItem('training_applications', JSON.stringify(list));
          
          // Also sync with mock_members
          const userId = appData.userId || list[idx].userId;
          const email = appData.email || list[idx].email;
          
          if (userId || email) {
            const membersStored = localStorage.getItem('mock_members') || '[]';
            const membersList = JSON.parse(membersStored);
            const mIdx = membersList.findIndex((m: any) => 
              String(m.id) === String(userId) || 
              (email && String(m.email).toLowerCase().trim() === String(email).toLowerCase().trim())
            );
            
            if (mIdx !== -1) {
              const m = membersList[mIdx];
              membersList[mIdx] = {
                ...m,
                namaLengkap: appData.nama || m.namaLengkap,
                email: appData.email || m.email,
                noHp: appData.noWa || m.noHp,
                nik: appData.nik || m.nik,
                tempatLahir: appData.tempatLahir || m.tempatLahir,
                tanggalLahir: appData.tanggalLahir || m.tanggalLahir,
                jenisKelamin: appData.jenisKelamin || m.jenisKelamin,
                qabilah: appData.qabilah || m.qabilah,
                asalKwarda: appData.asalDaerah || m.asalKwarda,
                golongan: appData.golonganAnggota || m.golongan
              };
              localStorage.setItem('mock_members', JSON.stringify(membersList));
            }
          }
          return { success: true, application: list[idx] };
        }
      } catch (e) {
        console.error(e);
      }
      return { success: false, message: 'Training Application not found locally' };
    }
    try {
      return await this.post({
        action: 'saveTrainingApplication',
        ...appData
      });
    } catch (e) {
      console.error('saveTrainingApplication API error, falling back to local storage:', e);
      const stored = localStorage.getItem('training_applications') || '[]';
      try {
        let list = JSON.parse(stored);
        const idx = list.findIndex((x: any) => String(x.id) === String(appData.id));
        if (idx !== -1) {
          list[idx] = { ...list[idx], ...appData };
          localStorage.setItem('training_applications', JSON.stringify(list));
          
          // Sync to local mock_members as well
          const userId = appData.userId || list[idx].userId;
          const email = appData.email || list[idx].email;
          if (userId || email) {
            const membersStored = localStorage.getItem('mock_members') || '[]';
            const membersList = JSON.parse(membersStored);
            const mIdx = membersList.findIndex((m: any) => 
              String(m.id) === String(userId) || 
              (email && String(m.email).toLowerCase().trim() === String(email).toLowerCase().trim())
            );
            if (mIdx !== -1) {
              const m = membersList[mIdx];
              membersList[mIdx] = {
                ...m,
                namaLengkap: appData.nama || m.namaLengkap,
                email: appData.email || m.email,
                noHp: appData.noWa || m.noHp,
                nik: appData.nik || m.nik,
                tempatLahir: appData.tempatLahir || m.tempatLahir,
                tanggalLahir: appData.tanggalLahir || m.tanggalLahir,
                jenisKelamin: appData.jenisKelamin || m.jenisKelamin,
                qabilah: appData.qabilah || m.qabilah,
                asalKwarda: appData.asalDaerah || m.asalKwarda,
                golongan: appData.golonganAnggota || m.golongan
              };
              localStorage.setItem('mock_members', JSON.stringify(membersList));
            }
          }
          return { success: true, application: list[idx] };
        }
      } catch (err) {
        console.error(err);
      }
      return { success: false, message: 'Failed to save training application' };
    }
  },

  async updateKTAStatus(id: string, status: 'approved' | 'rejected', ktaNumber?: string, remark?: string): Promise<any> {
    if (!IS_API_VALID) {
      const stored = localStorage.getItem('kta_applications');
      if (stored) {
        try {
          let list = JSON.parse(stored);
          const idx = list.findIndex((x: any) => String(x.id) === String(id));
          if (idx !== -1) {
            list[idx].status = status;
            if (status === 'approved') {
              list[idx].ktaNumber = ktaNumber || `KTA-HW.JT.${new Date().getFullYear().toString().substring(2)}${Math.floor(10 + Math.random() * 90)}.${Math.floor(1000 + Math.random() * 9000)}`;
            }
            if (remark) {
              list[idx].remark = remark;
            }
            localStorage.setItem('kta_applications', JSON.stringify(list));
            
            // Auto verifikasi user jika approved!
            const app = list[idx];
            if (app.userId) {
              try {
                const membersStored = localStorage.getItem('mock_members') || '[]';
                const membersList = JSON.parse(membersStored);
                const mIdx = membersList.findIndex((m: any) => String(m.id) === String(app.userId) || m.email === app.email);
                if (mIdx !== -1) {
                  membersList[mIdx].isVerified = (status === 'approved');
                  localStorage.setItem('mock_members', JSON.stringify(membersList));
                }
              } catch (err) {
                 console.error(err);
              }
            }
            return { success: true, application: list[idx] };
          }
        } catch (e) {
          console.error(e);
        }
      }
      return { success: false, message: 'Application not found locally' };
    }
    try {
      return await this.post({
        action: 'updateKTAStatus',
        id,
        status,
        ktaNumber,
        remark
      });
    } catch (e) {
      console.error('updateKTAStatus API error, falling back to local storage:', e);
      const stored = localStorage.getItem('kta_applications') || '[]';
      const list = JSON.parse(stored);
      const idx = list.findIndex((x: any) => String(x.id) === String(id));
      if (idx !== -1) {
        list[idx].status = status;
        if (status === 'approved') {
          list[idx].ktaNumber = ktaNumber || `KTA-HW.JT.${new Date().getFullYear().toString().substring(2)}${Math.floor(10 + Math.random() * 90)}.${Math.floor(1000 + Math.random() * 9000)}`;
        }
        if (remark) {
          list[idx].remark = remark;
        }
        localStorage.setItem('kta_applications', JSON.stringify(list));
        return { success: true, application: list[idx] };
      }
      return { success: false, message: 'Failed to update status' };
    }
  },

  async getTrainingApplications(): Promise<any[]> {
    if (!IS_API_VALID) {
      const stored = localStorage.getItem('training_applications');
      let apps: any[] = [];
      if (stored) {
        try {
          apps = JSON.parse(stored);
        } catch (e) {
          console.error(e);
        }
      } else {
        const defaults = [
          {
            id: 'train-mock-1',
            userId: 'user-alda',
            nama: 'Alda Putri',
            tingkatan: 'Athfal',
            asalDaerah: 'Banyumas',
            noWa: '081234567890',
            email: 'aldaputri@gmail.com',
            sosmed: '@aldaputri',
            status: 'pending',
            tanggalAjuan: '2026-06-15T09:00:00.000Z',
            pelatihanAkanDiikuti: 'Jati 1',
            nik: '3302011506990001',
            tempatLahir: 'Banyumas',
            tanggalLahir: '1999-06-15',
            jenisKelamin: 'P',
            qabilah: 'Qabilah KH Ahmad Dahlan',
            kehadiran: '{"Sesi 1": "hadir", "Sesi 2": "hadir"}',
            tugas: '[]',
            nilai: '85',
            remark: ''
          }
        ];
        localStorage.setItem('training_applications', JSON.stringify(defaults));
        apps = defaults;
      }
      return apps.map((t: any, idx: number) => ({
        ...t,
        id: t.id || `train-fallback-${idx}`
      })).filter((t: any) => t.nama && t.nama.trim() !== '' && t.status !== 'deleted');
    }
    try {
      const response = await axios.get(`${API_URL}?action=getTrainingApplications&_t=${Date.now()}`);
      if (Array.isArray(response.data)) {
        return response.data.map((t: any, idx: number) => ({
          ...t,
          id: t.id || `train-api-${idx}`
        })).filter((t: any) => t.nama && t.nama.trim() !== '' && t.status !== 'deleted');
      }
      return [];
    } catch (e) {
      console.error('getTrainingApplications API error, falling back to localStorage:', e);
      const stored = localStorage.getItem('training_applications') || '[]';
      try {
        const apps = JSON.parse(stored);
        return apps.map((t: any, idx: number) => ({
          ...t,
          id: t.id || `train-fallback-${idx}`
        })).filter((t: any) => t.nama && t.nama.trim() !== '' && t.status !== 'deleted');
      } catch (err) {
        return [];
      }
    }
  },

  async applyTraining(trainingData: any): Promise<any> {
    if (!IS_API_VALID) {
      const stored = localStorage.getItem('training_applications');
      let list = [];
      if (stored) {
        try {
          list = JSON.parse(stored);
        } catch (e) {
          console.error(e);
        }
      }
      const newApp = {
        id: 'train-' + Math.random().toString(36).substring(2, 9),
        status: 'pending',
        tanggalAjuan: new Date().toISOString(),
        kehadiran: '{}',
        tugas: '[]',
        nilai: '',
        remark: '',
        ...trainingData
      };
      
      const duplicate = list.find((item: any) => {
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
        
        const itemNik = String(item.nik || '').trim();
        const dataNik = String(trainingData.nik || '').trim();
        const isNikMatch = dataNik && itemNik && dataNik !== '-' && itemNik !== '-' && dataNik === itemNik;
        
        const itemWa = String(item.noWa || item.noHp || '').trim();
        const dataWa = String(trainingData.noWa || trainingData.noHp || '').trim();
        const isWaMatch = dataWa && itemWa && dataWa !== '-' && itemWa !== '-' && dataWa === itemWa;
        
        return !!(isUserMatch || isEmailMatch || isNikMatch || isWaMatch);
      });
      
      if (duplicate) {
        throw new Error('Anda sudah mendaftar di pelatihan ini dan statusnya masih aktif/proses.');
      }

      list.push(newApp);
      localStorage.setItem('training_applications', JSON.stringify(list));
      return { success: true, application: newApp };
    }
    try {
      return await this.post({
        action: 'applyTraining',
        ...trainingData
      });
    } catch (e) {
      console.error('applyTraining API error, falling back to local storage:', e);
      const stored = localStorage.getItem('training_applications') || '[]';
      const list = JSON.parse(stored);
      
      const duplicate = list.find((item: any) => {
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
        
        const itemNik = String(item.nik || '').trim();
        const dataNik = String(trainingData.nik || '').trim();
        const isNikMatch = dataNik && itemNik && dataNik !== '-' && itemNik !== '-' && dataNik === itemNik;
        
        const itemWa = String(item.noWa || item.noHp || '').trim();
        const dataWa = String(trainingData.noWa || trainingData.noHp || '').trim();
        const isWaMatch = dataWa && itemWa && dataWa !== '-' && itemWa !== '-' && dataWa === itemWa;
        
        return !!(isUserMatch || isEmailMatch || isNikMatch || isWaMatch);
      });
      
      if (duplicate) {
        throw new Error('Anda sudah mendaftar di pelatihan ini dan statusnya masih aktif/proses.');
      }

      const newApp = {
        id: 'train-' + Math.random().toString(36).substring(2, 9),
        status: 'pending',
        tanggalAjuan: new Date().toISOString(),
        kehadiran: '{}',
        tugas: '[]',
        nilai: '',
        remark: '',
        ...trainingData
      };
      list.push(newApp);
      localStorage.setItem('training_applications', JSON.stringify(list));
      return { success: true, application: newApp };
    }
  },

  async updateTrainingStatus(id: string, status: 'approved' | 'rejected' | 'pending' | 'deleted', remark?: string): Promise<any> {
    if (!IS_API_VALID) {
      const stored = localStorage.getItem('training_applications');
      if (stored) {
        try {
          let list = JSON.parse(stored);
          const idx = list.findIndex((x: any) => x.id === id);
          if (idx !== -1) {
            if (status === 'deleted') {
              const deletedItem = list[idx];
              list.splice(idx, 1);
              localStorage.setItem('training_applications', JSON.stringify(list));
              return { success: true, application: deletedItem };
            }
            list[idx].status = status;
            if (remark) {
              list[idx].remark = remark;
            }
            localStorage.setItem('training_applications', JSON.stringify(list));
            
            const app = list[idx];
            if (status === 'approved' && app.userId) {
              try {
                const membersStored = localStorage.getItem('mock_members') || '[]';
                const membersList = JSON.parse(membersStored);
                const mIdx = membersList.findIndex((m: any) => m.id === app.userId || m.email === app.email);
                if (mIdx !== -1) {
                  membersList[mIdx].isVerified = true;
                  
                  const roleName = app.pelatihanAkanDiikuti.toLowerCase().replace(/\s+/g, '');
                  let currentRoles = [];
                  try {
                    const rVal = membersList[mIdx].role || 'umum';
                    if (rVal.indexOf('[') === 0) {
                      currentRoles = JSON.parse(rVal);
                    } else {
                      currentRoles = rVal.split(',').map((s: string) => s.trim()).filter(Boolean);
                    }
                  } catch (err) {
                    currentRoles = [membersList[mIdx].role || 'umum'];
                  }
                  if (!currentRoles.includes(roleName)) {
                    currentRoles.push(roleName);
                  }
                  membersList[mIdx].roles = currentRoles;
                  membersList[mIdx].role = JSON.stringify(currentRoles);

                  let currentPel = [];
                  try {
                    const pVal = membersList[mIdx].pelatihan || '[]';
                    currentPel = JSON.parse(pVal);
                  } catch (err) {
                    currentPel = [];
                  }
                  if (!currentPel.includes(app.pelatihanAkanDiikuti)) {
                    currentPel.push(app.pelatihanAkanDiikuti);
                  }
                  membersList[mIdx].pelatihan = JSON.stringify(currentPel);

                  localStorage.setItem('mock_members', JSON.stringify(membersList));
                }
              } catch (err) {
                console.error(err);
              }
            }
            return { success: true, application: list[idx] };
          }
        } catch (e) {
          console.error(e);
        }
      }
      return { success: false, message: 'Application not found locally' };
    }
    try {
      return await this.post({
        action: 'updateTrainingStatus',
        id,
        status,
        remark
      });
    } catch (e) {
      console.error('updateTrainingStatus API error, falling back to local storage:', e);
      const stored = localStorage.getItem('training_applications') || '[]';
      const list = JSON.parse(stored);
      const idx = list.findIndex((x: any) => x.id === id);
      if (idx !== -1) {
        if (status === 'deleted') {
          const deletedItem = list[idx];
          list.splice(idx, 1);
          localStorage.setItem('training_applications', JSON.stringify(list));
          return { success: true, application: deletedItem };
        }
        list[idx].status = status;
        if (remark) {
          list[idx].remark = remark;
        }
        localStorage.setItem('training_applications', JSON.stringify(list));
        return { success: true, application: list[idx] };
      }
      return { success: false, message: 'Failed to update status' };
    }
  },

  async updateAttendance(id: string, kehadiran: string): Promise<any> {
    if (!IS_API_VALID) {
      const stored = localStorage.getItem('training_applications') || '[]';
      const list = JSON.parse(stored);
      const idx = list.findIndex((x: any) => x.id === id);
      if (idx !== -1) {
        list[idx].kehadiran = kehadiran;
        localStorage.setItem('training_applications', JSON.stringify(list));
        return { success: true };
      }
      return { success: false };
    }
    return this.post({
      action: 'updateAttendance',
      id,
      kehadiran
    });
  },

  async submitAssignment(id: string, tugas: string): Promise<any> {
    if (!IS_API_VALID) {
      const stored = localStorage.getItem('training_applications') || '[]';
      const list = JSON.parse(stored);
      const idx = list.findIndex((x: any) => x.id === id);
      if (idx !== -1) {
        list[idx].tugas = tugas;
        localStorage.setItem('training_applications', JSON.stringify(list));
        return { success: true };
      }
      return { success: false };
    }
    return this.post({
      action: 'submitAssignment',
      id,
      tugas
    });
  },

  async updateGrade(id: string, nilai: any): Promise<any> {
    if (!IS_API_VALID) {
      const stored = localStorage.getItem('training_applications') || '[]';
      const list = JSON.parse(stored);
      const idx = list.findIndex((x: any) => x.id === id);
      if (idx !== -1) {
        if (nilai && typeof nilai === 'object') {
          list[idx].nilai = nilai.grade || '';
          list[idx].remark = nilai.remark || '';
          list[idx].statusKelulusan = nilai.statusKelulusan || '';
        } else {
          list[idx].nilai = nilai;
        }
        localStorage.setItem('training_applications', JSON.stringify(list));
        return { success: true };
      }
      return { success: false };
    }
    const isObj = nilai && typeof nilai === 'object';
    return this.post({
      action: 'updateGrade',
      id,
      nilai: isObj ? (nilai.grade || '') : nilai,
      remark: isObj ? (nilai.remark || '') : undefined,
      statusKelulusan: isObj ? (nilai.statusKelulusan || '') : undefined
    });
  },

  async updateTrainingSchedule(id: string, lokasiPelatihan: string, tanggalPelatihan: string): Promise<any> {
    if (!IS_API_VALID) {
      const stored = localStorage.getItem('training_applications') || '[]';
      const list = JSON.parse(stored);
      const idx = list.findIndex((x: any) => x.id === id);
      if (idx !== -1) {
        list[idx].lokasiPelatihan = lokasiPelatihan;
        list[idx].tanggalPelatihan = tanggalPelatihan;
        localStorage.setItem('training_applications', JSON.stringify(list));
        return { success: true };
      }
      return { success: false };
    }
    return this.post({
      action: 'updateTrainingSchedule',
      id,
      lokasiPelatihan,
      tanggalPelatihan
    });
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
    if (!IS_API_VALID) {
      const stored = localStorage.getItem('contents') || '[]';
      let list = [];
      try {
        list = JSON.parse(stored);
      } catch (err) {
        list = this.getMockContents();
      }
      return section ? list.filter((c: any) => c.section === section) : list;
    }
    try {
      const response = await axios.get(`${API_URL}?action=getContents${section ? `&section=${section}` : ''}&_t=${Date.now()}`);
      // Ensure we always return an array
      if (Array.isArray(response.data)) {
        return response.data;
      } else if (response.data && Array.isArray(response.data.contents)) {
        return response.data.contents;
      }
      return [];
    } catch (error) {
      console.error('getContents API error:', error);
      const mockData = this.getMockContents();
      return section ? mockData.filter(c => c.section === section) : mockData;
    }
  },

  async saveContent(content: any): Promise<any> {
    if (this.isMock()) {
      const stored = localStorage.getItem('contents') || '[]';
      try {
        let list = JSON.parse(stored);
        const idx = list.findIndex((c: any) => c.id === content.id);
        const mapped = {
          ...content,
          id: content.id || `content-${Date.now()}`
        };
        if (idx !== -1) {
          list[idx] = { ...list[idx], ...mapped };
        } else {
          list.push(mapped);
        }
        localStorage.setItem('contents', JSON.stringify(list));
        return { success: true };
      } catch (err) {
        console.error(err);
      }
    }
    return this.post({
      action: 'saveContent',
      ...content
    });
  },

  async deleteContent(id: string): Promise<any> {
    if (this.isMock()) {
      const stored = localStorage.getItem('contents') || '[]';
      try {
        let list = JSON.parse(stored);
        list = list.filter((c: any) => c.id !== id);
        localStorage.setItem('contents', JSON.stringify(list));
        return { success: true };
      } catch (err) {
        console.error(err);
      }
    }
    return this.post({
      action: 'deleteContent',
      id
    });
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

    if (!IS_API_VALID) {
      const parsed = localParsed || { 
        appName: 'HW App', 
        orgName: 'HW Org', 
        waConfirmation: '628',
        lastBackup: '-',
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
    try {
      const response = await axios.get(`${API_URL}?action=getSettings&_t=${Date.now()}`);
      const apiSettings = response.data || {};
      const merged = {
        ...apiSettings,
        appName: apiSettings.appName || 'HW App',
        orgName: apiSettings.orgName || 'HW Org',
        waConfirmation: apiSettings.waConfirmation || '628',
        lastBackup: apiSettings.lastBackup || '-',
        ktaTemplateFront: apiSettings.ktaTemplateFront || 'https://hwjateng.com/wp-content/uploads/2026/07/depan.png',
        ktaTemplateBack: apiSettings.ktaTemplateBack || 'https://hwjateng.com/wp-content/uploads/2026/07/Belakang.jpg',
        ktaKetuaNama: apiSettings.ktaKetuaNama || 'TAUFIQ',
        ktaKetuaNbm: apiSettings.ktaKetuaNbm || 'NBM 1015096',
        ktaSekretarisNama: apiSettings.ktaSekretarisNama || 'MUHAMMAD DZIKRON',
        ktaSekretarisNbm: apiSettings.ktaSekretarisNbm || 'NBM 1029863',
        ktaKotaPenerbit: apiSettings.ktaKotaPenerbit || 'Semarang',
        ktaTandaTanganKetua: apiSettings.ktaTandaTanganKetua || '',
        ktaTandaTanganSekretaris: apiSettings.ktaTandaTanganSekretaris || '',
        ktaStempelImage: apiSettings.ktaStempelImage || '',
        trainingLocations: safeParse(apiSettings.trainingLocations, ['Gedung Dakwah Muhammadiyah Jateng', 'Kwarda Banyumas', 'Pusdiklat HW Jateng']),
        trainingDates: safeParse(apiSettings.trainingDates, ['12-14 Juli 2026', '1-3 Agustus 2026', '15-17 September 2026']),
        upgradeFees: safeParse(apiSettings.upgradeFees, [
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
      console.error('getSettings API error:', error);
      const parsed = localParsed || { 
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

  async saveSettings(settings: any): Promise<any> {
    localStorage.setItem('hw_settings', JSON.stringify(settings));
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

    return this.post({
      action: 'saveSettings',
      settings: serializedSettings
    });
  },

  async syncDatabase(): Promise<any> {
    if (this.isMock()) {
      try {
        localStorage.removeItem('mock_members_initialized');
        localStorage.removeItem('mock_members');
        localStorage.removeItem('materi_initialized');
        localStorage.removeItem('materi');
        localStorage.removeItem('contents_initialized');
        localStorage.removeItem('contents');
        localStorage.removeItem('kta_applications_initialized');
        localStorage.removeItem('kta_applications');
        localStorage.removeItem('training_applications_initialized');
        localStorage.removeItem('training_applications');
        
        // Re-run init to reload from the original file
        initMockData();
        
        return { success: true, message: "Database berhasil disinkronkan dengan data awal dari spreadsheet!" };
      } catch (err: any) {
        return { success: false, message: err.message };
      }
    }
    return this.post({
      action: 'syncDatabase'
    });
  },

  async syncApprovedKtasToMembers(): Promise<any> {
    if (this.isMock()) {
      try {
        const ktasStr = localStorage.getItem('kta_applications') || '[]';
        const ktas = JSON.parse(ktasStr);
        const membersStr = localStorage.getItem('mock_members') || '[]';
        const members = JSON.parse(membersStr);
        
        let addedCount = 0;
        let updatedCount = 0;
        let ktasChanged = false;
        
        const newMembers = [...members];
        
        ktas.forEach((k: any) => {
          const kStatus = k.status?.toLowerCase();
          const ktaNum = (k.ktaNumber || k.KtaNumber || k.Ktanumber || k.ktanumber || '').toString().trim();
          
          if (ktaNum !== '' && kStatus !== 'approved') {
            k.status = 'approved';
            ktasChanged = true;
          }
          
          if (k.status?.toLowerCase() !== 'approved') return;
          const kEmail = k.email?.trim().toLowerCase();
          if (!kEmail) return;
          
          const kName = k.nama || k.namaLengkap;
          const kGender = k.jenisKelamin === 'Perempuan' || k.jenisKelamin === 'P' ? 'P' : 'L';
          const kKwarda = k.asalDaerah || '';
          const kQabilah = k.qabilah || '';
          const kNoHp = k.noWa || '';
          const kPhoto = k.photo || '';
          const kGolongan = k.tingkatan || 'Dewasa';
          
          const existingIdx = newMembers.findIndex((m: any) => m.email?.trim().toLowerCase() === kEmail);
          if (existingIdx === -1) {
            const id = 'user-' + kEmail.replace(/[^a-zA-Z0-9]/g, '_');
            const newMemberObj = {
              id,
              email: kEmail,
              namaLengkap: kName,
              jenisKelamin: kGender,
              golongan: kGolongan,
              asalKwarda: kKwarda,
              qabilah: kQabilah,
              alamat: '',
              noHp: kNoHp,
              isVerified: true,
              role: '[\"umum\"]',
              roles: ['umum'],
              activeRole: 'umum',
              photo: kPhoto,
              upgradeRequests: '[]',
              password: '12345hw'
            };
            newMembers.push(newMemberObj);
            addedCount++;
          } else {
            const m = newMembers[existingIdx];
            let updated = false;
            if (m.namaLengkap !== kName) { m.namaLengkap = kName; updated = true; }
            if (m.jenisKelamin !== kGender) { m.jenisKelamin = kGender; updated = true; }
            if (!m.asalKwarda || m.asalKwarda === '') { m.asalKwarda = kKwarda; updated = true; }
            if (!m.qabilah || m.qabilah === '') { m.qabilah = kQabilah; updated = true; }
            if (!m.noHp || m.noHp === '') { m.noHp = kNoHp; updated = true; }
            if (!m.isVerified) { m.isVerified = true; updated = true; }
            if (kPhoto && (!m.photo || m.photo === '')) { m.photo = kPhoto; updated = true; }
            if (updated) {
              updatedCount++;
            }
          }
        });
        
        localStorage.setItem('mock_members', JSON.stringify(newMembers));
        if (ktasChanged) {
          localStorage.setItem('kta_applications', JSON.stringify(ktas));
        }
        return { success: true, addedCount, updatedCount };
      } catch (err: any) {
        return { success: false, message: err.message };
      }
    }
    
    return this.post({
      action: 'syncApprovedKtasToMembers'
    });
  },

  async backupNow(): Promise<any> {
    if (this.isMock()) {
      return { success: true, message: "Pencadangan database simulasi berhasil." };
    }
    return this.post({
      action: 'backupNow'
    });
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

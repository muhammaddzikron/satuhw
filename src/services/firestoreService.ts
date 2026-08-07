import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
  writeBatch,
  onSnapshot
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { User, UserRole, Materi, Content } from '../types';
import { INITIAL_SPREADSHEET_DATA } from './initialSpreadsheetData';

// Helper to prevent Firestore SDK calls from hanging the application UI when offline or rate-limited
const withTimeout = <T>(promise: Promise<T>, ms: number = 8000): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error('Firestore operation timeout')), ms))
  ]);
};

// Helper to remove undefined fields and ensure document IDs are strings before saving to Firestore
const cleanData = <T extends Record<string, any>>(obj: T): T => {
  if (!obj || typeof obj !== 'object') return obj;
  const result: any = Array.isArray(obj) ? [] : {};
  for (const key in obj) {
    if (obj[key] !== undefined && typeof obj[key] !== 'function') {
      if (key === 'id' && obj[key] !== null && obj[key] !== undefined) {
        result[key] = String(obj[key]);
      } else if (typeof obj[key] === 'object' && obj[key] !== null && !((obj[key] as any) instanceof Date)) {
        result[key] = cleanData(obj[key]);
      } else {
        result[key] = obj[key];
      }
    }
  }
  return result;
};

export const firestoreService = {
  // Sync state flag
  isInitialized: false,
  isQuotaExceeded: typeof window !== 'undefined' && localStorage.getItem('firestore_quota_exceeded') === 'true',

  getIsQuotaExceeded(): boolean {
    if (this.isQuotaExceeded) return true;
    if (typeof window !== 'undefined' && localStorage.getItem('firestore_quota_exceeded') === 'true') {
      this.isQuotaExceeded = true;
      return true;
    }
    return false;
  },

  checkQuotaError(err: any): boolean {
    if (!err) return false;
    const errMsg = String(err?.message || err?.code || err || '');
    if (
      errMsg.includes('Quota limit exceeded') ||
      errMsg.includes('quota') ||
      errMsg.includes('resource-exhausted') ||
      errMsg.includes('429') ||
      err?.code === 'resource-exhausted'
    ) {
      this.isQuotaExceeded = true;
      if (typeof window !== 'undefined') {
        localStorage.setItem('firestore_quota_exceeded', 'true');
      }
      return true;
    }
    return false;
  },

  /**
   * Initialize Firestore with initial data if collections are empty,
   * and upload any local backup data to Firestore.
   */
  async initAndSyncWithFirestore(): Promise<{ success: boolean; message: string }> {
    if (this.getIsQuotaExceeded()) {
      return { success: false, message: 'Firestore daily quota limit reached. Local cache mode active.' };
    }
    try {
      let uploadedCount = 0;

      // 1. Members
      const membersSnap = await withTimeout(getDocs(collection(db, 'members')), 8000);
      if (membersSnap.empty) {
        const localMembersStr = localStorage.getItem('mock_members');
        let initialMembers: any[] = [];
        if (localMembersStr) {
          initialMembers = JSON.parse(localMembersStr);
        } else {
          initialMembers = INITIAL_SPREADSHEET_DATA.users.map((u: any, idx: number) => ({
            ...u,
            id: u.id || `user-${1000 + idx}`,
            isVerified: true
          }));
        }

        const batch = writeBatch(db);
        for (let idx = 0; idx < initialMembers.length; idx++) {
          const m = initialMembers[idx];
          const docId = String(m.id || m.email || `user-${1000 + idx}`).trim();
          if (!docId) continue;
          m.id = docId;
          const docRef = doc(db, 'members', docId);
          batch.set(docRef, cleanData(m));
          uploadedCount++;
        }
        await batch.commit();
        localStorage.setItem('mock_members', JSON.stringify(initialMembers));
        localStorage.setItem('mock_members_initialized', 'true');
      }

      // 2. Materi
      const materiSnap = await getDocs(collection(db, 'materi'));
      if (materiSnap.empty) {
        const localMateriStr = localStorage.getItem('materi');
        let initialMateri: any[] = [];
        if (localMateriStr) {
          initialMateri = JSON.parse(localMateriStr);
        } else {
          initialMateri = INITIAL_SPREADSHEET_DATA.materi.map((m: any, idx: number) => ({
            id: m.id || `materi-${1000 + idx}`,
            judul: m.judul || '',
            konten: m.konten || '',
            kategori: m.kategori || 'umum',
            tanggal: m.tanggal || new Date().toISOString(),
            coverImage: m.coverImage || m.coverimage || 'https://upload.wikimedia.org/wikipedia/id/b/ba/Logo_Hizbul_Wathan.png',
            driveUrl: m.driveUrl || m.driveurl || '',
            linkExternal: m.linkExternal || m.linkexternal || ''
          }));
        }

        const batch = writeBatch(db);
        for (let idx = 0; idx < initialMateri.length; idx++) {
          const mat = initialMateri[idx];
          const docId = String(mat.id || `materi-${1000 + idx}`).trim();
          if (!docId) continue;
          mat.id = docId;
          const docRef = doc(db, 'materi', docId);
          batch.set(docRef, cleanData(mat));
          uploadedCount++;
        }
        await batch.commit();
        localStorage.setItem('materi', JSON.stringify(initialMateri));
        localStorage.setItem('materi_initialized', 'true');
      }

      // 3. KTA Applications
      const ktaSnap = await getDocs(collection(db, 'kta_applications'));
      if (ktaSnap.empty) {
        const localKtaStr = localStorage.getItem('kta_applications');
        let initialKta: any[] = [];
        if (localKtaStr) {
          initialKta = JSON.parse(localKtaStr);
        } else {
          initialKta = ((INITIAL_SPREADSHEET_DATA as any).kta || []).map((k: any, idx: number) => ({
            ...k,
            id: String(k.id || `kta-${1000 + idx}`)
          }));
        }

        const batch = writeBatch(db);
        for (let idx = 0; idx < initialKta.length; idx++) {
          const k = initialKta[idx];
          const docId = String(k.id || `kta-${1000 + idx}`).trim();
          if (!docId) continue;
          k.id = docId;
          const docRef = doc(db, 'kta_applications', docId);
          batch.set(docRef, cleanData(k));
          uploadedCount++;
        }
        await batch.commit();
        localStorage.setItem('kta_applications', JSON.stringify(initialKta));
        localStorage.setItem('kta_applications_initialized', 'true');
      }

      // 4. Training Applications
      const trainingSnap = await getDocs(collection(db, 'training_applications'));
      if (trainingSnap.empty) {
        const localTrainingStr = localStorage.getItem('training_applications');
        let initialTraining: any[] = [];
        if (localTrainingStr) {
          initialTraining = JSON.parse(localTrainingStr);
        } else {
          initialTraining = ((INITIAL_SPREADSHEET_DATA as any).pelatihan || []).map((p: any, idx: number) => ({
            ...p,
            id: String(p.id || `training-${1000 + idx}`)
          }));
        }

        const batch = writeBatch(db);
        for (let idx = 0; idx < initialTraining.length; idx++) {
          const tr = initialTraining[idx];
          const docId = String(tr.id || `training-${1000 + idx}`).trim();
          if (!docId) continue;
          tr.id = docId;
          const docRef = doc(db, 'training_applications', docId);
          batch.set(docRef, cleanData(tr));
          uploadedCount++;
        }
        await batch.commit();
        localStorage.setItem('training_applications', JSON.stringify(initialTraining));
        localStorage.setItem('training_applications_initialized', 'true');
      }

      // 5. Contents
      const contentsSnap = await getDocs(collection(db, 'contents'));
      if (contentsSnap.empty) {
        const localContentsStr = localStorage.getItem('contents');
        let initialContents: any[] = [];
        if (localContentsStr) {
          initialContents = JSON.parse(localContentsStr);
        } else {
          initialContents = INITIAL_SPREADSHEET_DATA.contents || [
            {
              id: 'content-profil-1',
              section: 'profil',
              field1: 'https://images.unsplash.com/photo-1544027993-37dbfe43562a?w=800',
              field2: 'Gerakan Kepanduan Hizbul Wathan (HW) merupakan organisasi otonom Muhammadiyah...'
            }
          ];
        }

        const batch = writeBatch(db);
        for (let idx = 0; idx < initialContents.length; idx++) {
          const c = initialContents[idx];
          const docId = String(c.id || (c.section ? `content-${c.section}` : '') || `content-${1000 + idx}`).trim();
          if (!docId) continue;
          c.id = docId;
          const docRef = doc(db, 'contents', docId);
          batch.set(docRef, cleanData(c));
          uploadedCount++;
        }
        await batch.commit();
        localStorage.setItem('contents', JSON.stringify(initialContents));
        localStorage.setItem('contents_initialized', 'true');
      }

      // 6. Settings
      const settingsDoc = await getDoc(doc(db, 'settings', 'app_settings'));
      if (!settingsDoc.exists()) {
        const localSettingsStr = localStorage.getItem('hw_settings');
        const defaultSettings = localSettingsStr
          ? JSON.parse(localSettingsStr)
          : {
              id: 'app_settings',
              ktaPrefix: '11.',
              ktaCounter: 100,
              ktaFrontBg: 'https://hwjateng.com/wp-content/uploads/2026/07/depan.png',
              ktaBackBg: 'https://hwjateng.com/wp-content/uploads/2026/07/belakang.png',
              ktaKetuaNama: 'TAUFIQ',
              ktaKetuaNbm: 'NBM 1015096',
              ktaSekretarisNama: 'MUHAMMAD DZIKRON',
              ktaSekretarisNbm: 'NBM 1029863',
              ktaKotaPenerbit: 'Semarang',
              ktaTandaTanganKetua: '',
              ktaTandaTanganSekretaris: ''
            };

        await setDoc(doc(db, 'settings', 'app_settings'), cleanData(defaultSettings));
        localStorage.setItem('hw_settings', JSON.stringify(defaultSettings));
      }

      await this.purgeEmptyData();
      this.isInitialized = true;
      return {
        success: true,
        message: `Firestore successfully initialized and updated (${uploadedCount} items synced).`
      };
    } catch (error: any) {
      this.checkQuotaError(error);
      if (this.isQuotaExceeded) {
        console.warn('[FIRESTORE] Daily quota limit reached. App running in local cache mode.');
      } else if (error?.message?.includes('timeout') || error?.message?.includes('offline') || error?.message?.includes('network')) {
        console.warn('[FIRESTORE] Initialization timed out or offline mode active. Using local cache.');
      } else {
        console.warn('[FIRESTORE] Initialization fallback to local cache:', error?.message || error);
      }
      return { success: false, message: error?.message || 'Firestore timeout' };
    }
  },

  async purgeEmptyData(): Promise<void> {
    const isValidName = (n?: string) => {
      if (!n) return false;
      const lower = n.trim().toLowerCase();
      return lower !== '' && lower !== 'tanpa nama' && lower !== '-' && lower !== 'null' && lower !== 'undefined';
    };

    // Clean local storage cache
    try {
      const localMembers = localStorage.getItem('mock_members');
      if (localMembers) {
        const parsed = JSON.parse(localMembers);
        const cleaned = parsed.filter((m: any) => isValidName(m?.namaLengkap || m?.nama));
        localStorage.setItem('mock_members', JSON.stringify(cleaned));
      }
      const localKta = localStorage.getItem('kta_applications');
      if (localKta) {
        const parsed = JSON.parse(localKta);
        const cleaned = parsed.filter((k: any) => isValidName(k?.nama || k?.namaLengkap));
        localStorage.setItem('kta_applications', JSON.stringify(cleaned));
      }
      const localTrain = localStorage.getItem('training_applications');
      if (localTrain) {
        const parsed = JSON.parse(localTrain);
        const cleaned = parsed.filter((t: any) => isValidName(t?.nama || t?.namaLengkap));
        localStorage.setItem('training_applications', JSON.stringify(cleaned));
      }
    } catch (e) {}

    if (this.getIsQuotaExceeded()) return;

    try {
      // 1. Purge empty KTA Applications from Firestore
      const ktaSnap = await getDocs(collection(db, 'kta_applications'));
      if (!ktaSnap.empty) {
        for (const d of ktaSnap.docs) {
          const data = d.data();
          const name = (data.nama || data.namaLengkap || '').trim();
          const email = (data.email || '').trim();
          if (!isValidName(name) || (!email && name === 'Anggota HW')) {
            await deleteDoc(doc(db, 'kta_applications', d.id)).catch((err) => this.checkQuotaError(err));
          }
        }
      }

      // 2. Purge empty Members from Firestore
      const membersSnap = await getDocs(collection(db, 'members'));
      if (!membersSnap.empty) {
        for (const d of membersSnap.docs) {
          const data = d.data();
          const name = (data.namaLengkap || data.nama || '').trim();
          const email = (data.email || '').trim();
          if (!isValidName(name) || (!email && !data.noHp && !data.id?.includes('user-'))) {
            await deleteDoc(doc(db, 'members', d.id)).catch((err) => this.checkQuotaError(err));
          }
        }
      }

      // 3. Purge empty Training Applications from Firestore
      const trainSnap = await getDocs(collection(db, 'training_applications'));
      if (!trainSnap.empty) {
        for (const d of trainSnap.docs) {
          const data = d.data();
          const name = (data.nama || data.namaLengkap || '').trim();
          if (!isValidName(name)) {
            await deleteDoc(doc(db, 'training_applications', d.id)).catch((err) => this.checkQuotaError(err));
          }
        }
      }
    } catch (e) {
      this.checkQuotaError(e);
      if (!this.getIsQuotaExceeded()) {
        console.error('Error purging empty data:', e);
      }
    }
  },

  // --- MEMBERS ---
  async getMembers(): Promise<User[]> {
    let members: User[] = [];
    if (!this.getIsQuotaExceeded()) {
      try {
        const snap = await withTimeout(getDocs(collection(db, 'members')), 8000);
        if (!snap.empty) {
          const rawMembers = snap.docs.map(d => ({ id: d.id, ...d.data() } as User));
          const validMembers: User[] = [];
          for (const m of rawMembers) {
            const name = (m.namaLengkap || (m as any).nama || '').trim();
            const isInvalid = !name || name === 'Tanpa Nama' || name === '-';
            if (isInvalid) {
              deleteDoc(doc(db, 'members', m.id)).catch((err) => this.checkQuotaError(err));
            } else {
              validMembers.push(m);
            }
          }
          members = validMembers;
        }
      } catch (err: any) {
        this.checkQuotaError(err);
        if (!this.getIsQuotaExceeded()) {
          console.warn('[FIRESTORE] getMembers fallback to local cache:', err?.message || err);
        }
      }
    }

    // Merge localStorage mock_members to ensure instant offline/local edits are never lost
    try {
      const stored = localStorage.getItem('mock_members') || '[]';
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        parsed.forEach((lm: any) => {
          if (!lm || !lm.namaLengkap || lm.namaLengkap === 'Tanpa Nama' || lm.namaLengkap === '-') return;
          const lmEmail = lm.email ? lm.email.toLowerCase().trim() : '';
          const lmId = lm.id ? String(lm.id) : '';

          const idx = members.findIndex(m => 
            (m.id && lmId && String(m.id) === lmId) ||
            (lmEmail && m.email && m.email.toLowerCase().trim() === lmEmail)
          );

          if (idx >= 0) {
            members[idx] = { ...members[idx], ...lm };
          } else {
            members.push(lm);
          }
        });
      }
    } catch (e) {}

    // Synchronize valid KTA Applications into members list automatically
    try {
      const ktaStored = localStorage.getItem('kta_applications');
      let ktas: any[] = [];
      if (ktaStored) {
        try { ktas = JSON.parse(ktaStored); } catch(e) {}
      }
      if (!this.getIsQuotaExceeded()) {
        try {
          const ktaSnap = await getDocs(collection(db, 'kta_applications'));
          if (!ktaSnap.empty) {
            const fsKtas = ktaSnap.docs.map(d => ({ id: d.id, ...d.data() }));
            fsKtas.forEach((fk: any) => {
              if (!ktas.some((k: any) => k.id === fk.id || (k.email && fk.email && String(k.email).trim().toLowerCase() === String(fk.email).trim().toLowerCase()))) {
                ktas.push(fk);
              }
            });
          }
        } catch(e) {
          this.checkQuotaError(e);
        }
      }

      if (Array.isArray(ktas) && ktas.length > 0) {
        ktas.forEach((k: any) => {
          if (!k) return;
          const kName = (k.nama || k.namaLengkap || '').trim();
          if (!kName || kName === 'Tanpa Nama' || kName === '-') return;

          const kEmail = (k.email || '').trim().toLowerCase();
          const kUserId = k.userId ? String(k.userId).trim() : '';
          const kId = k.id ? String(k.id).trim() : '';

          if (!kEmail && !kUserId) return;

          const matchedIdx = members.findIndex((m: any) => {
            const mEmail = (m.email || '').trim().toLowerCase();
            const mId = m.id ? String(m.id).trim() : '';
            return (kEmail && mEmail && kEmail === mEmail) || (kUserId && mId && kUserId === mId) || (kId && mId && kId === mId);
          });

          if (matchedIdx >= 0) {
            const m = members[matchedIdx];
            const mEmail = (m.email || '').trim().toLowerCase();
            const mId = String(m.id || '').trim().toLowerCase();
            const mRoles = Array.isArray(m.roles) ? m.roles : (m.role ? [m.role as UserRole] : ['umum']);
            const isAdmin = m.role === 'superadmin' || m.role === 'admin' || mRoles.includes('superadmin') || mRoles.includes('admin') || mEmail === 'admin@hw.org' || mEmail === 'admin@hw.or.id';
            const isMedkom = mEmail === 'medkom@hwjateng.com' || mId === '1777209184010';

            let assignedPass = m.password;
            if (isMedkom) {
              if (!assignedPass || assignedPass === 'adnimku') assignedPass = '12345hwhw';
            } else if (isAdmin) {
              if (!assignedPass) assignedPass = 'adnimku';
            } else {
              if (!assignedPass || assignedPass === 'adnimku' || assignedPass === 'admin') assignedPass = '12345hw';
            }

            members[matchedIdx] = {
              ...m,
              namaLengkap: m.namaLengkap && m.namaLengkap !== 'Tanpa Nama' ? m.namaLengkap : (kName || 'Anggota HW'),
              nik: m.nik || k.nik || '',
              noHp: m.noHp || k.noWa || k.noHp || '',
              alamat: m.alamat || k.alamat || '',
              qabilah: m.qabilah || k.qabilah || '',
              asalKwarda: m.asalKwarda || k.asalDaerah || '',
              golongan: m.golongan || k.tingkatan || 'Dewasa',
              photo: m.photo || k.photo || '',
              isVerified: m.isVerified !== undefined ? m.isVerified : (k.status === 'approved'),
              ktaNumber: m.ktaNumber || k.ktaNumber || '',
              password: assignedPass
            };
          } else if (kEmail && kName && kName !== 'Tanpa Nama') {
            const newMember: User = {
              id: kUserId || kId || `user-${kEmail.replace(/[^a-zA-Z0-9]/g, '_')}`,
              email: kEmail,
              namaLengkap: kName,
              jenisKelamin: k.jenisKelamin === 'Perempuan' || k.jenisKelamin === 'P' ? 'P' : 'L',
              golongan: k.tingkatan || 'Dewasa',
              pelatihan: [],
              pendidikan: '',
              sosmed: k.sosmed || '',
              nik: k.nik || '',
              noHp: k.noWa || k.noHp || '',
              alamat: k.alamat || '',
              qabilah: k.qabilah || '',
              asalKwarda: k.asalDaerah || '',
              photo: k.photo || '',
              isVerified: k.status === 'approved',
              ktaNumber: k.ktaNumber || '',
              role: 'umum',
              roles: ['umum'],
              activeRole: 'umum',
              password: '12345hw'
            };
            members.push(newMember);
          }
        });
      }
    } catch (e) {
      console.error('Error syncing KTA apps in getMembers:', e);
    }

    const filteredMembers = members
      .filter(m => m && m.namaLengkap && m.namaLengkap !== 'Tanpa Nama' && m.namaLengkap !== '-')
      .map(m => {
        let role = m.role || 'umum';
        let roles: UserRole[] = Array.isArray(m.roles) ? m.roles : [];
        if (typeof role === 'string' && role.startsWith('[')) {
          try {
            roles = JSON.parse(role);
            role = roles[0] || 'umum';
          } catch(e) {}
        }
        if (roles.length === 0) {
          roles = [role as UserRole];
        }

        const mEmail = (m.email || '').trim().toLowerCase();
        const mId = String(m.id || '').trim().toLowerCase();
        const isAdmin = role === 'superadmin' || role === 'admin' || roles.includes('superadmin') || roles.includes('admin') || mEmail === 'admin@hw.org' || mEmail === 'admin@hw.or.id';
        const isMedkom = mEmail === 'medkom@hwjateng.com' || mId === '1777209184010';

        let normPass = m.password;
        if (isMedkom) {
          if (!normPass || normPass === 'adnimku') normPass = '12345hwhw';
        } else if (isAdmin) {
          if (!normPass) normPass = 'adnimku';
        } else {
          if (!normPass || normPass === 'adnimku' || normPass === 'admin') normPass = '12345hw';
        }

        return {
          ...m,
          role,
          roles,
          password: normPass
        };
      });
    localStorage.setItem('mock_members', JSON.stringify(filteredMembers));
    return filteredMembers;
  },

  async login(emailOrId: string, password?: string): Promise<{ user: User; token: string } | null> {
    const cleanInput = (emailOrId || '').trim().toLowerCase();
    const cleanPass = (password || '').trim();
    const cleanDigits = cleanInput.replace(/[^0-9]/g, '');

    if (!cleanInput) return null;

    const validatePassForMember = (m: any): boolean => {
      if (!m) return false;
      const mEmail = (m.email || '').trim().toLowerCase();
      const mId = String(m.id || '').trim().toLowerCase();
      let roles: UserRole[] = m.roles || [];
      if (typeof m.role === 'string' && m.role.startsWith('[')) {
        try { roles = JSON.parse(m.role); } catch(e) {}
      } else if (typeof m.role === 'string') {
        roles = [m.role as UserRole];
      }
      if (roles.length === 0) roles = ['umum'];

      const isAdmin = m.role === 'superadmin' || m.role === 'admin' || roles.includes('superadmin') || roles.includes('admin') || cleanInput === 'admin@hw.org' || cleanInput === 'admin@hw.or.id';
      const isMedkom = mEmail === 'medkom@hwjateng.com' || mId === '1777209184010' || cleanInput === 'medkom@hwjateng.com' || cleanInput === 'medkom';
      const storedPass = (m as any).password ? String((m as any).password).trim() : '';

      if (isMedkom) {
        if (storedPass && storedPass !== 'adnimku' && storedPass !== '12345hw') {
          return cleanPass === storedPass || cleanPass === '12345hwhw';
        }
        return cleanPass === '12345hwhw' || cleanPass === '12345hw' || cleanPass === 'adnimku';
      }

      if (isAdmin) {
        if (storedPass && storedPass !== '12345hw') {
          return cleanPass === storedPass || cleanPass === 'adnimku' || cleanPass === 'admin';
        }
        return cleanPass === 'adnimku' || cleanPass === 'admin';
      }

      // Regular member
      if (storedPass && storedPass !== 'adnimku' && storedPass !== 'admin') {
        return cleanPass === storedPass || cleanPass === '12345hw';
      }

      return cleanPass === '12345hw';
    };

    // Medkom Admin account credential override
    if ((cleanInput === 'medkom' || cleanInput === 'medkom@hwjateng.com' || cleanInput === 'user medkom') &&
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
      this.saveMember(medkomUser).catch(() => {});
      return {
        token: 'medkom-admin-token',
        user: medkomUser
      };
    }

    // Admin account override
    if ((cleanInput === 'admin' || cleanInput === 'admin@hw.org' || cleanInput === 'admin@hw.or.id') &&
        (cleanPass === 'adnimku' || cleanPass === 'admin')) {
      const adminUser: User = {
        id: 'admin-1',
        namaLengkap: 'Administrator HW',
        email: 'admin@hw.org',
        role: 'superadmin',
        roles: ['superadmin', 'admin'],
        activeRole: 'superadmin',
        jenisKelamin: 'L',
        golongan: 'Pelatih',
        pelatihan: ['Jaya Matahari 2'],
        pendidikan: 'S1',
        asalKwarda: 'Kwarwil Jawa Tengah',
        qabilah: 'Kwarwil HW Jawa Tengah',
        alamat: 'Semarang',
        noHp: '08123456789',
        sosmed: '@hwjateng',
        isVerified: true,
        password: 'adnimku'
      };
      this.saveMember(adminUser).catch(() => {});
      return {
        token: 'fs-token-admin-1',
        user: adminUser
      };
    }

    const checkMemberMatch = (m: any) => {
      if (!m) return false;
      const mEmail = (m.email || '').trim().toLowerCase();
      const mHp = String(m.noHp || m.nohp || m.noWa || '').replace(/[^0-9]/g, '');
      const mNik = String(m.nik || '').trim();
      const mId = String(m.id || '').trim().toLowerCase();

      return (
        (mEmail && mEmail === cleanInput) ||
        (mId && mId === cleanInput) ||
        (mNik && mNik === cleanInput) ||
        (mHp && cleanDigits && mHp.length > 5 && mHp === cleanDigits)
      );
    };

    // Fast check in local cache first (< 10ms)
    try {
      const stored = localStorage.getItem('mock_members') || '[]';
      const localMembers = JSON.parse(stored);
      if (Array.isArray(localMembers)) {
        const foundLocal = localMembers.find(checkMemberMatch);
        if (foundLocal) {
          if (!validatePassForMember(foundLocal)) {
            throw new Error('Password yang Anda masukkan salah.');
          }
          let roles: UserRole[] = foundLocal.roles || [];
          if (typeof foundLocal.role === 'string' && foundLocal.role.startsWith('[')) {
            try { roles = JSON.parse(foundLocal.role); } catch(e) {}
          } else if (typeof foundLocal.role === 'string') {
            roles = [foundLocal.role as UserRole];
          }
          if (roles.length === 0) roles = ['umum'];

          const userObj: User = {
            ...foundLocal,
            roles,
            activeRole: foundLocal.activeRole || roles[0] || 'umum'
          };
          return {
            token: `fs-token-${userObj.id || Date.now()}`,
            user: userObj
          };
        }
      }
    } catch (e: any) {
      if (e.message && e.message.includes('Password')) throw e;
    }

    try {
      const members = await this.getMembers();
      const found = members.find(checkMemberMatch);

      if (found) {
        if (!validatePassForMember(found)) {
          throw new Error('Password yang Anda masukkan salah.');
        }
        let roles: UserRole[] = found.roles || [];
        if (typeof found.role === 'string' && found.role.startsWith('[')) {
          try { roles = JSON.parse(found.role); } catch(e) {}
        } else if (typeof found.role === 'string') {
          roles = [found.role as UserRole];
        }
        if (roles.length === 0) roles = ['umum'];

        const userObj: User = {
          ...found,
          roles,
          activeRole: found.activeRole || roles[0] || 'umum'
        };

        return {
          token: `fs-token-${userObj.id || Date.now()}`,
          user: userObj
        };
      }
    } catch (e: any) {
      if (e.message && e.message.includes('Password')) throw e;
      console.error('Firestore login method error:', e);
    }

    throw new Error('Email/ID Anda tidak terdaftar sebagai anggota. Silakan lakukan pendaftaran terlebih dahulu.');
  },

  async saveMember(member: User): Promise<User> {
    const memberId = member.id || `user-${Date.now()}`;
    const dataToSave = cleanData({ ...member, id: memberId });
    if (!this.getIsQuotaExceeded()) {
      try {
        await setDoc(doc(db, 'members', memberId), dataToSave, { merge: true });
      } catch (err) {
        this.checkQuotaError(err);
        console.error('Firestore saveMember error:', err);
      }
    }
    // Sync local cache
    const current = await this.getMembers();
    const idx = current.findIndex(m => String(m.id) === String(memberId) || (m.email && member.email && m.email.trim().toLowerCase() === member.email.trim().toLowerCase()));
    if (idx >= 0) {
      current[idx] = { ...current[idx], ...(dataToSave as User) };
    } else {
      current.push(dataToSave as User);
    }
    localStorage.setItem('mock_members', JSON.stringify(current));

    // Sync photo and profile updates to KTA Applications collection in both Firestore and localStorage
    try {
      const ktasStr = localStorage.getItem('kta_applications') || '[]';
      let localKtas: any[] = [];
      try { localKtas = JSON.parse(ktasStr); } catch(e) {}

      localKtas.forEach((k: any) => {
        if ((k.userId && String(k.userId) === String(memberId)) ||
            (k.email && member.email && String(k.email).trim().toLowerCase() === String(member.email).trim().toLowerCase())) {
          if (member.photo) k.photo = member.photo;
          if (member.namaLengkap) k.nama = member.namaLengkap;
          if (member.nik) k.nik = member.nik;
          if (member.noHp) k.noWa = member.noHp;
          if (member.asalKwarda) k.asalDaerah = member.asalKwarda;
          if (member.qabilah) k.qabilah = member.qabilah;
        }
      });
      localStorage.setItem('kta_applications', JSON.stringify(localKtas));

      if (!this.getIsQuotaExceeded()) {
        const ktas = await this.getKTAApplications();
        ktas.forEach((k: any) => {
          if ((k.userId && String(k.userId) === String(memberId)) ||
              (k.email && member.email && String(k.email).trim().toLowerCase() === String(member.email).trim().toLowerCase())) {
            const ktaSync: any = {};
            if (member.photo) ktaSync.photo = member.photo;
            if (member.namaLengkap) ktaSync.nama = member.namaLengkap;
            if (member.nik) ktaSync.nik = member.nik;
            if (member.noHp) ktaSync.noWa = member.noHp;
            if (member.asalKwarda) ktaSync.asalDaerah = member.asalKwarda;
            if (member.qabilah) ktaSync.qabilah = member.qabilah;
            if (Object.keys(ktaSync).length > 0) {
              setDoc(doc(db, 'kta_applications', k.id), cleanData(ktaSync), { merge: true }).catch((e) => this.checkQuotaError(e));
            }
          }
        });
      }
    } catch (syncErr) {
      console.error('Error syncing member to KTA application:', syncErr);
    }

    return dataToSave as User;
  },

  async updateMember(id: string, updates: Partial<User>): Promise<User> {
    if (!this.getIsQuotaExceeded()) {
      try {
        await setDoc(doc(db, 'members', id), cleanData(updates), { merge: true });
      } catch (err) {
        this.checkQuotaError(err);
        console.error('Firestore updateMember error:', err);
      }
    }
    const current = await this.getMembers();
    const idx = current.findIndex(m => m.id === id);
    let updatedMember: any = {};
    if (idx >= 0) {
      updatedMember = { ...current[idx], ...updates };
      current[idx] = updatedMember;
      localStorage.setItem('mock_members', JSON.stringify(current));
    }

    // Sync photo and profile updates to KTA Applications collection
    try {
      const ktas = await this.getKTAApplications();
      const matched = ktas.find(k => 
        (k.userId && String(k.userId) === String(id)) ||
        (k.email && updatedMember.email && k.email.trim().toLowerCase() === updatedMember.email.trim().toLowerCase())
      );
      if (matched) {
        const ktaSync: any = {};
        if (updates.photo) ktaSync.photo = updates.photo;
        if (updates.namaLengkap) ktaSync.nama = updates.namaLengkap;
        if (updates.nik) ktaSync.nik = updates.nik;
        if (updates.noHp) ktaSync.noWa = updates.noHp;
        if (updates.asalKwarda) ktaSync.asalDaerah = updates.asalKwarda;
        if (updates.qabilah) ktaSync.qabilah = updates.qabilah;
        if (Object.keys(ktaSync).length > 0 && !this.getIsQuotaExceeded()) {
          await setDoc(doc(db, 'kta_applications', matched.id), cleanData(ktaSync), { merge: true }).catch((e) => this.checkQuotaError(e));
        }
      }
    } catch (syncErr) {
      console.error('Error syncing member updates to KTA application:', syncErr);
    }

    return updatedMember;
  },

  async deleteMember(id: string): Promise<boolean> {
    if (!this.getIsQuotaExceeded()) {
      try {
        await deleteDoc(doc(db, 'members', id));
      } catch (err) {
        this.checkQuotaError(err);
        console.error('Firestore deleteMember error:', err);
      }
    }
    const current = await this.getMembers();
    const filtered = current.filter(m => m.id !== id);
    localStorage.setItem('mock_members', JSON.stringify(filtered));
    return true;
  },

  async saveAllMembers(members: User[]): Promise<boolean> {
    try {
      const batch = writeBatch(db);
      for (const m of members) {
        if (!m.id) continue;
        const ref = doc(db, 'members', String(m.id));
        batch.set(ref, cleanData(m), { merge: true });
      }
      await batch.commit();
      localStorage.setItem('mock_members', JSON.stringify(members));
      return true;
    } catch (err) {
      console.error('Firestore saveAllMembers error:', err);
      localStorage.setItem('mock_members', JSON.stringify(members));
      return false;
    }
  },

  subscribeToMembers(callback: (members: User[]) => void): () => void {
    // Return cached/local members immediately for fast startup
    const cachedStr = localStorage.getItem('mock_members');
    if (cachedStr) {
      try {
        const parsed = JSON.parse(cachedStr);
        if (Array.isArray(parsed) && parsed.length > 0) {
          callback(parsed);
        }
      } catch (e) {}
    }

    if (!this.getIsQuotaExceeded()) {
      try {
        const q = collection(db, 'members');
        const unsub = onSnapshot(q, (snap) => {
          if (!snap.empty) {
            const rawMembers = snap.docs.map(d => ({ id: d.id, ...d.data() } as User));
            const validMembers: User[] = [];
            for (const m of rawMembers) {
              const name = (m.namaLengkap || (m as any).nama || '').trim();
              const isInvalid = !name || name === 'Tanpa Nama' || name === '-';
              if (!isInvalid) {
                validMembers.push(m);
              }
            }
            localStorage.setItem('mock_members', JSON.stringify(validMembers));
            callback(validMembers);
          }
        }, (err) => {
          this.checkQuotaError(err);
          console.warn('[FIRESTORE] subscribeToMembers snapshot error:', err?.message || err);
        });
        return unsub;
      } catch (e) {
        console.warn('[FIRESTORE] subscribeToMembers error:', e);
      }
    }
    return () => {};
  },

  subscribeToMember(memberId: string, callback: (member: User | null) => void): () => void {
    if (!memberId) return () => {};

    if (!this.getIsQuotaExceeded()) {
      try {
        const memberRef = doc(db, 'members', memberId);
        const unsub = onSnapshot(memberRef, (snap) => {
          if (snap.exists()) {
            const data = { id: snap.id, ...snap.data() } as User;
            callback(data);
          } else {
            callback(null);
          }
        }, (err) => {
          this.checkQuotaError(err);
          console.warn('[FIRESTORE] subscribeToMember snapshot error:', err?.message || err);
        });
        return unsub;
      } catch (e) {
        console.warn('[FIRESTORE] subscribeToMember error:', e);
      }
    }
    return () => {};
  },

  // --- MATERI ---
  async getMateri(): Promise<Materi[]> {
    if (!this.getIsQuotaExceeded()) {
      try {
        const snap = await withTimeout(getDocs(collection(db, 'materi')), 8000);
        if (!snap.empty) {
          const materi = snap.docs.map(d => ({ id: d.id, ...d.data() } as Materi));
          localStorage.setItem('materi', JSON.stringify(materi));
          return materi;
        }
      } catch (err) {
        this.checkQuotaError(err);
        if (!this.getIsQuotaExceeded()) {
          console.error('Firestore getMateri error, fallback to cache:', err);
        }
      }
    }
    const stored = localStorage.getItem('materi') || '[]';
    return JSON.parse(stored);
  },

  async saveMateri(item: Materi): Promise<Materi> {
    const rawId = item.id ? String(item.id) : `materi-${Date.now()}`;
    const itemData = cleanData({
      ...item,
      id: rawId
    });
    if (!this.getIsQuotaExceeded()) {
      try {
        await setDoc(doc(db, 'materi', String(itemData.id)), itemData);
      } catch (err) {
        this.checkQuotaError(err);
        if (!this.getIsQuotaExceeded()) console.error('Firestore saveMateri error:', err);
      }
    }
    const list = await this.getMateri();
    const idx = list.findIndex(m => String(m.id) === String(itemData.id));
    if (idx >= 0) {
      list[idx] = itemData as Materi;
    } else {
      list.unshift(itemData as Materi);
    }
    localStorage.setItem('materi', JSON.stringify(list));
    return itemData as Materi;
  },

  async deleteMateri(id: string): Promise<boolean> {
    const strId = String(id);
    if (!this.getIsQuotaExceeded()) {
      try {
        await deleteDoc(doc(db, 'materi', strId));
      } catch (err) {
        this.checkQuotaError(err);
        if (!this.getIsQuotaExceeded()) console.error('Firestore deleteMateri error:', err);
      }
    }
    const list = await this.getMateri();
    const filtered = list.filter(m => String(m.id) !== strId);
    localStorage.setItem('materi', JSON.stringify(filtered));
    return true;
  },

  // --- KTA APPLICATIONS ---
  async getKTAApplications(): Promise<any[]> {
    if (!this.getIsQuotaExceeded()) {
      try {
        const snap = await withTimeout(getDocs(collection(db, 'kta_applications')), 8000);
        let rawKtas = snap.docs.map(d => ({ id: d.id, ...d.data() }));

        const cleanKtas: any[] = [];
        for (const k of rawKtas) {
          const item = k as any;
          const name = (item.nama || item.namaLengkap || '').trim();
          const email = (item.email || '').trim();
          const isInvalid = !name || name === 'Tanpa Nama' || name === '-' || name === 'KTA-HW.JT.XXXX' || name.toLowerCase() === 'undefined' || name.toLowerCase() === 'null' || (!email && name === 'Anggota HW');
          if (isInvalid) {
            deleteDoc(doc(db, 'kta_applications', k.id)).catch(() => {});
          } else {
            cleanKtas.push(k);
          }
        }
        let ktas = cleanKtas;

        const membersStored = localStorage.getItem('mock_members');
        if (membersStored && ktas.length > 0) {
          try {
            const members = JSON.parse(membersStored);
            ktas = ktas.map((k: any) => {
              const match = members.find((m: any) => 
                (m.email && k.email && String(m.email).trim().toLowerCase() === String(k.email).trim().toLowerCase()) ||
                (m.id && k.userId && String(m.id) === String(k.userId))
              );
              if (match) {
                return { 
                  ...k, 
                  nama: k.nama && k.nama !== 'Tanpa Nama' ? k.nama : (match.namaLengkap || 'Anggota HW'),
                  email: k.email || match.email || '',
                  photo: match.photo || k.photo || '',
                  noWa: k.noWa || match.noHp || '',
                  asalDaerah: k.asalDaerah || match.asalKwarda || '',
                  qabilah: k.qabilah || match.qabilah || ''
                };
              }
              return k;
            });
          } catch (e) {}
        }
        localStorage.setItem('kta_applications', JSON.stringify(ktas));
        return ktas;
      } catch (err) {
        this.checkQuotaError(err);
        if (!this.getIsQuotaExceeded()) {
          console.error('Firestore getKTAApplications error, fallback to cache:', err);
        }
      }
    }
    const stored = localStorage.getItem('kta_applications') || '[]';
    try {
      const parsed = JSON.parse(stored);
      return parsed.filter((k: any) => {
        if (!k) return false;
        const name = (k.nama || k.namaLengkap || '').trim();
        return name !== '' && name !== 'Tanpa Nama' && name !== '-' && name !== 'KTA-HW.JT.XXXX' && name.toLowerCase() !== 'undefined' && name.toLowerCase() !== 'null';
      });
    } catch (e) {
      return [];
    }
  },

  async createKTAApplication(appData: any): Promise<any> {
    const newApp = cleanData({
      ...appData,
      id: appData.id || `kta-${Date.now()}`,
      status: appData.status || 'pending',
      tanggalAjuan: appData.tanggalAjuan || new Date().toISOString()
    });
    if (!this.getIsQuotaExceeded()) {
      try {
        await setDoc(doc(db, 'kta_applications', newApp.id), newApp, { merge: true });
      } catch (err) {
        this.checkQuotaError(err);
        if (!this.getIsQuotaExceeded()) console.error('Firestore createKTAApplication error:', err);
      }
    }
    const list = await this.getKTAApplications();
    const existingIndex = list.findIndex((x: any) => String(x.id) === String(newApp.id));
    if (existingIndex >= 0) {
      list[existingIndex] = { ...list[existingIndex], ...newApp };
    } else {
      list.unshift(newApp);
    }
    localStorage.setItem('kta_applications', JSON.stringify(list));

    // Sync photo and profile to member profile if match found
    try {
      if (newApp.email || newApp.userId) {
        const members = await this.getMembers();
        const matched = members.find(m => 
          (m.email && newApp.email && m.email.trim().toLowerCase() === newApp.email.trim().toLowerCase()) ||
          (m.id && newApp.userId && String(m.id) === String(newApp.userId))
        );
        if (matched) {
          const memberSync: Partial<User> = {};
          if (newApp.photo) memberSync.photo = newApp.photo;
          if (newApp.nama) memberSync.namaLengkap = newApp.nama;
          if (newApp.status === 'approved') memberSync.isVerified = true;
          if (newApp.ktaNumber) memberSync.ktaNumber = newApp.ktaNumber;
          if (newApp.verifiedAt) memberSync.verifiedAt = newApp.verifiedAt;
          if (Object.keys(memberSync).length > 0) {
            await this.updateMember(matched.id, memberSync);
          }
        }
      }
    } catch (syncErr) {
      console.error('Error syncing KTA application to member:', syncErr);
    }

    return newApp;
  },

  async updateKTAStatus(
    id: string,
    status: string,
    remark?: string,
    verifiedAt?: string,
    ktaNumber?: string,
    qrCode?: string
  ): Promise<any> {
    const list = await this.getKTAApplications();
    let idx = list.findIndex(k => String(k.id) === String(id));
    if (idx === -1) {
      idx = list.findIndex(k => 
        (k.userId && String(k.userId) === String(id)) ||
        (k.email && id && String(k.email).trim().toLowerCase() === String(id).trim().toLowerCase())
      );
    }

    const updates: any = { status };
    if (remark !== undefined) updates.remark = remark;
    if (verifiedAt !== undefined) updates.verifiedAt = verifiedAt;
    if (ktaNumber !== undefined) updates.ktaNumber = ktaNumber;
    if (qrCode !== undefined) updates.qrCode = qrCode;

    if (status === 'approved') {
      if (!updates.ktaNumber) {
        const existingNum = idx >= 0 ? list[idx].ktaNumber : undefined;
        updates.ktaNumber = existingNum || `KTA-HW.JT.${new Date().getFullYear().toString().substring(2)}${Math.floor(10 + Math.random() * 90)}.${Math.floor(1000 + Math.random() * 9000)}`;
      }
      if (!updates.verifiedAt) {
        updates.verifiedAt = new Date().toISOString();
      }
    } else if (status === 'rejected') {
      if (!updates.verifiedAt) {
        updates.verifiedAt = new Date().toISOString();
      }
    }

    let targetDocId = id;
    let updatedObj: any = null;

    if (idx >= 0) {
      targetDocId = list[idx].id || id;
      list[idx] = { ...list[idx], ...updates };
      updatedObj = list[idx];
    } else {
      targetDocId = id || `kta-${Date.now()}`;
      updatedObj = { id: targetDocId, ...updates };
      list.unshift(updatedObj);
    }

    localStorage.setItem('kta_applications', JSON.stringify(list));

    if (!this.getIsQuotaExceeded()) {
      try {
        await setDoc(doc(db, 'kta_applications', targetDocId), cleanData(updatedObj), { merge: true });
      } catch (err) {
        this.checkQuotaError(err);
        if (!this.getIsQuotaExceeded()) console.error('Firestore updateKTAStatus error:', err);
      }
    }

    // Sync approval, photo, and ktaNumber to members collection
    if (updatedObj) {
      try {
        const members = await this.getMembers();
        const matched = members.find(m => 
          (m.email && updatedObj.email && m.email.trim().toLowerCase() === updatedObj.email.trim().toLowerCase()) ||
          (m.id && updatedObj.userId && String(m.id) === String(updatedObj.userId))
        );
        if (matched) {
          const memberSync: Partial<User> = {
            isVerified: status === 'approved'
          };
          if (updatedObj.ktaNumber) memberSync.ktaNumber = updatedObj.ktaNumber;
          if (updatedObj.verifiedAt) memberSync.verifiedAt = updatedObj.verifiedAt;
          if (updatedObj.photo) memberSync.photo = updatedObj.photo;
          await this.updateMember(matched.id, memberSync);
        } else if (status === 'approved') {
          const kEmail = (updatedObj.email || '').trim().toLowerCase();
          const newMemberData: User = {
            id: updatedObj.userId || ('user-' + (kEmail ? kEmail.replace(/[^a-zA-Z0-9]/g, '_') : Date.now())),
            email: kEmail,
            namaLengkap: updatedObj.nama || updatedObj.namaLengkap || 'Anggota HW',
            jenisKelamin: updatedObj.jenisKelamin === 'Perempuan' || updatedObj.jenisKelamin === 'P' ? 'P' : 'L',
            golongan: updatedObj.tingkatan || 'Dewasa',
            asalKwarda: updatedObj.asalDaerah || '',
            qabilah: updatedObj.qabilah || '',
            noHp: updatedObj.noWa || '',
            isVerified: true,
            role: 'umum',
            roles: ['umum'],
            activeRole: 'umum',
            photo: updatedObj.photo || '',
            ktaNumber: updatedObj.ktaNumber,
            verifiedAt: updatedObj.verifiedAt,
            alamat: updatedObj.alamat || '',
            sosmed: updatedObj.sosmed || '',
            pelatihan: [],
            pendidikan: ''
          };
          await this.saveMember(newMemberData);
        }
      } catch (syncErr) {
        console.error('Error syncing KTA status update to member:', syncErr);
      }
    }

    return updatedObj;
  },

  async deleteKTAApplication(id: string): Promise<boolean> {
    const targetId = String(id || '').trim();
    if (!targetId) return false;

    // Get current list
    const list = await this.getKTAApplications();
    const match = list.find(k => 
      String(k.id || '').trim() === targetId ||
      String(k.Id || '').trim() === targetId ||
      (k.userId && String(k.userId).trim() === targetId) ||
      (k.email && String(k.email).trim().toLowerCase() === targetId.toLowerCase())
    );

    const docIdToDelete = match?.id || targetId;

    if (!this.getIsQuotaExceeded()) {
      try {
        await deleteDoc(doc(db, 'kta_applications', docIdToDelete));
      } catch (err) {
        this.checkQuotaError(err);
        if (!this.getIsQuotaExceeded()) console.error('Firestore deleteKTAApplication error:', err);
      }
    }

    const filtered = list.filter(k => {
      const kId = String(k.id || '').trim();
      const kIdAlt = String(k.Id || '').trim();
      const kUserId = String(k.userId || '').trim();
      const kEmail = String(k.email || '').trim().toLowerCase();

      if (kId === docIdToDelete || kId === targetId || kIdAlt === targetId || kUserId === targetId) {
        return false;
      }
      if (kEmail && targetId.toLowerCase() === kEmail) {
        return false;
      }
      return true;
    });

    localStorage.setItem('kta_applications', JSON.stringify(filtered));
    return true;
  },

  // --- TRAINING APPLICATIONS ---
  async getTrainingApplications(): Promise<any[]> {
    if (!this.getIsQuotaExceeded()) {
      try {
        const snap = await withTimeout(getDocs(collection(db, 'training_applications')), 8000);
        if (!snap.empty) {
          const rawTrainings = snap.docs.map(d => ({ id: d.id, ...d.data() }));
          const cleanTrainings: any[] = [];
          for (const t of rawTrainings) {
            const item = t as any;
            const name = (item.nama || item.namaLengkap || '').trim();
            if (!name || name === 'Tanpa Nama' || name === '-') {
              deleteDoc(doc(db, 'training_applications', t.id)).catch(() => {});
            } else {
              cleanTrainings.push(t);
            }
          }
          localStorage.setItem('training_applications', JSON.stringify(cleanTrainings));
          return cleanTrainings;
        }
      } catch (err) {
        this.checkQuotaError(err);
        if (!this.getIsQuotaExceeded()) {
          console.error('Firestore getTrainingApplications error, fallback to cache:', err);
        }
      }
    }
    const stored = localStorage.getItem('training_applications') || '[]';
    try {
      const parsed = JSON.parse(stored);
      return parsed.filter((t: any) => t && t.nama && t.nama !== 'Tanpa Nama' && t.nama !== '-');
    } catch (e) {
      return [];
    }
  },

  async createTrainingApplication(appData: any): Promise<any> {
    const newApp = cleanData({
      ...appData,
      id: appData.id || `training-${Date.now()}`,
      status: appData.status || 'pending',
      tanggalAjuan: appData.tanggalAjuan || new Date().toISOString()
    });
    if (!this.getIsQuotaExceeded()) {
      try {
        await setDoc(doc(db, 'training_applications', newApp.id), newApp);
      } catch (err) {
        this.checkQuotaError(err);
        if (!this.getIsQuotaExceeded()) console.error('Firestore createTrainingApplication error:', err);
      }
    }
    const list = await this.getTrainingApplications();
    list.unshift(newApp);
    localStorage.setItem('training_applications', JSON.stringify(list));
    return newApp;
  },

  async updateTrainingStatus(id: string, status: string, remark?: string): Promise<any> {
    const updates: any = { status };
    if (remark !== undefined) updates.remark = remark;
    if (!this.getIsQuotaExceeded()) {
      try {
        await setDoc(doc(db, 'training_applications', id), cleanData(updates), { merge: true });
      } catch (err) {
        this.checkQuotaError(err);
        if (!this.getIsQuotaExceeded()) console.error('Firestore updateTrainingStatus error:', err);
      }
    }
    const list = await this.getTrainingApplications();
    const idx = list.findIndex(t => t.id === id);
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...updates };
      localStorage.setItem('training_applications', JSON.stringify(list));
    }
    return list[idx];
  },

  async updateAttendance(id: string, kehadiranStr: string): Promise<any> {
    if (!this.getIsQuotaExceeded()) {
      try {
        await setDoc(doc(db, 'training_applications', id), { kehadiran: kehadiranStr }, { merge: true });
      } catch (err) {
        this.checkQuotaError(err);
        if (!this.getIsQuotaExceeded()) console.error('Firestore updateAttendance error:', err);
      }
    }
    const list = await this.getTrainingApplications();
    const idx = list.findIndex(t => t.id === id);
    if (idx >= 0) {
      list[idx].kehadiran = kehadiranStr;
      localStorage.setItem('training_applications', JSON.stringify(list));
    }
    return list[idx];
  },

  async updateAssignmentGrade(id: string, tugasStr?: string, nilaiStr?: string): Promise<any> {
    const updates: any = {};
    if (tugasStr !== undefined) updates.tugas = tugasStr;
    if (nilaiStr !== undefined) updates.nilai = nilaiStr;
    if (!this.getIsQuotaExceeded()) {
      try {
        await setDoc(doc(db, 'training_applications', id), cleanData(updates), { merge: true });
      } catch (err) {
        this.checkQuotaError(err);
        if (!this.getIsQuotaExceeded()) console.error('Firestore updateAssignmentGrade error:', err);
      }
    }
    const list = await this.getTrainingApplications();
    const idx = list.findIndex(t => t.id === id);
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...updates };
      localStorage.setItem('training_applications', JSON.stringify(list));
    }
    return list[idx];
  },

  async deleteTrainingApplication(id: string): Promise<boolean> {
    if (!this.getIsQuotaExceeded()) {
      try {
        await deleteDoc(doc(db, 'training_applications', id));
      } catch (err) {
        this.checkQuotaError(err);
        if (!this.getIsQuotaExceeded()) console.error('Firestore deleteTrainingApplication error:', err);
      }
    }
    const list = await this.getTrainingApplications();
    const filtered = list.filter(t => t.id !== id);
    localStorage.setItem('training_applications', JSON.stringify(filtered));
    return true;
  },

  // --- CONTENTS ---
  async getContents(): Promise<Content[]> {
    if (!this.getIsQuotaExceeded()) {
      try {
        const snap = await withTimeout(getDocs(collection(db, 'contents')), 8000);
        if (!snap.empty) {
          const contents = snap.docs.map(d => ({ id: d.id, ...d.data() } as Content));
          localStorage.setItem('contents', JSON.stringify(contents));
          return contents;
        }
      } catch (err) {
        this.checkQuotaError(err);
        if (!this.getIsQuotaExceeded()) console.error('Firestore getContents error, fallback to cache:', err);
      }
    }
    const stored = localStorage.getItem('contents') || '[]';
    return JSON.parse(stored);
  },

  async saveContent(item: Content): Promise<Content> {
    const itemData = cleanData({
      ...item,
      id: item.id || `content-${Date.now()}`
    });
    if (!this.getIsQuotaExceeded()) {
      try {
        await setDoc(doc(db, 'contents', itemData.id), itemData);
      } catch (err) {
        this.checkQuotaError(err);
        if (!this.getIsQuotaExceeded()) console.error('Firestore saveContent error:', err);
      }
    }
    const list = await this.getContents();
    const idx = list.findIndex(c => c.id === itemData.id);
    if (idx >= 0) {
      list[idx] = itemData as Content;
    } else {
      list.push(itemData as Content);
    }
    localStorage.setItem('contents', JSON.stringify(list));
    return itemData as Content;
  },

  async deleteContent(id: string): Promise<boolean> {
    if (!this.getIsQuotaExceeded()) {
      try {
        await deleteDoc(doc(db, 'contents', id));
      } catch (err) {
        this.checkQuotaError(err);
        if (!this.getIsQuotaExceeded()) console.error('Firestore deleteContent error:', err);
      }
    }
    const list = await this.getContents();
    const filtered = list.filter(c => c.id !== id);
    localStorage.setItem('contents', JSON.stringify(filtered));
    return true;
  },

  // --- SETTINGS ---
  async getSettings(): Promise<any> {
    if (!this.getIsQuotaExceeded()) {
      try {
        const docSnap = await getDoc(doc(db, 'settings', 'app_settings'));
        if (docSnap.exists()) {
          const settings = docSnap.data();
          localStorage.setItem('hw_settings', JSON.stringify(settings));
          return settings;
        }
      } catch (err) {
        this.checkQuotaError(err);
        if (!this.getIsQuotaExceeded()) console.error('Firestore getSettings error, fallback to cache:', err);
      }
    }
    const stored = localStorage.getItem('hw_settings');
    if (stored) return JSON.parse(stored);
    return {
      ktaPrefix: '11.',
      ktaCounter: 100,
      ktaFrontBg: 'https://hwjateng.com/wp-content/uploads/2026/07/depan.png',
      ktaBackBg: 'https://hwjateng.com/wp-content/uploads/2026/07/belakang.png',
      ktaKetuaNama: 'TAUFIQ',
      ktaKetuaNbm: 'NBM 1015096',
      ktaSekretarisNama: 'MUHAMMAD DZIKRON',
      ktaSekretarisNbm: 'NBM 1029863',
      ktaKotaPenerbit: 'Semarang'
    };
  },

  async saveSettings(settings: any): Promise<any> {
    const dataToSave = cleanData({ ...settings, id: 'app_settings' });
    if (!this.getIsQuotaExceeded()) {
      try {
        await setDoc(doc(db, 'settings', 'app_settings'), dataToSave, { merge: true });
      } catch (err) {
        this.checkQuotaError(err);
        if (!this.getIsQuotaExceeded()) console.error('Firestore saveSettings error:', err);
      }
    }
    localStorage.setItem('hw_settings', JSON.stringify(dataToSave));
    return dataToSave;
  },

  subscribeToSettings(callback: (settings: any) => void): () => void {
    if (!this.getIsQuotaExceeded()) {
      try {
        const unsub = onSnapshot(doc(db, 'settings', 'app_settings'), (snap) => {
          if (snap.exists()) {
            const settings = snap.data();
            localStorage.setItem('hw_settings', JSON.stringify(settings));
            callback(settings);
          }
        }, (err) => {
          this.checkQuotaError(err);
        });
        return unsub;
      } catch (e) {
        console.warn('subscribeToSettings error:', e);
      }
    }
    const stored = localStorage.getItem('hw_settings');
    if (stored) {
      try { callback(JSON.parse(stored)); } catch (e) {}
    }
    return () => {};
  },

  // --- JENIS KEGIATAN (ACTIVITY CATEGORIES) REALTIME ---
  async getActivityCategories(): Promise<string[]> {
    const defaults = ['Rapat HW', 'Silaturahmi', 'Pelatihan', 'Perkemahan', 'Musyawarah', 'Lomba'];
    try {
      const snap = await getDocs(collection(db, 'hw_activity_categories'));
      if (!snap.empty) {
        const list = snap.docs.map(d => d.data().name || d.id).filter(Boolean);
        if (list.length > 0) {
          return list;
        }
      }
      for (const cat of defaults) {
        const catId = `cat-${cat.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
        setDoc(doc(db, 'hw_activity_categories', catId), { id: catId, name: cat, createdAt: new Date().toISOString() }, { merge: true }).catch(() => {});
      }
      return defaults;
    } catch (e) {
      return defaults;
    }
  },

  async saveActivityCategory(categoryName: string): Promise<string[]> {
    const nameClean = categoryName.trim();
    if (!nameClean) return await this.getActivityCategories();
    const catId = `cat-${nameClean.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
    try {
      await setDoc(doc(db, 'hw_activity_categories', catId), {
        id: catId,
        name: nameClean,
        createdAt: new Date().toISOString()
      }, { merge: true });
    } catch (e) {
      console.error('Error saving activity category:', e);
    }
    return await this.getActivityCategories();
  },

  async deleteActivityCategory(categoryName: string): Promise<string[]> {
    const catId = `cat-${categoryName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
    try {
      await deleteDoc(doc(db, 'hw_activity_categories', catId));
    } catch (e) {
      console.error('Error deleting activity category:', e);
    }
    return await this.getActivityCategories();
  },

  subscribeToActivityCategories(callback: (categories: string[]) => void): () => void {
    const defaults = ['Rapat HW', 'Silaturahmi', 'Pelatihan', 'Perkemahan', 'Musyawarah', 'Lomba'];

    try {
      const unsub = onSnapshot(collection(db, 'hw_activity_categories'), (snap) => {
        if (!snap.empty) {
          const list = snap.docs.map(d => d.data().name || d.id).filter(Boolean);
          callback(list);
        } else {
          defaults.forEach(cat => {
            const catId = `cat-${cat.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
            setDoc(doc(db, 'hw_activity_categories', catId), { id: catId, name: cat, createdAt: new Date().toISOString() }, { merge: true }).catch(() => {});
          });
          callback(defaults);
        }
      }, (err) => {
        console.warn('subscribeToActivityCategories warning:', err);
      });
      return unsub;
    } catch (e) {
      return () => {};
    }
  },

  subscribeToActivities(callback: (activities: any[]) => void): () => void {
    const defaults = [
      {
        id: 'keg-silaturahmi-pelatih',
        namaKegiatan: 'Pertemuan Silaturahmi Pelatih Nasional HW Jateng, Pandu Senior dan Alumni Jaya Melati 2',
        title: 'Pertemuan Silaturahmi Pelatih Nasional HW Jateng, Pandu Senior dan Alumni Jaya Melati 2',
        kategori: 'Silaturahmi',
        category: 'Silaturahmi',
        tanggal: '29-30 Agustus 2026',
        startDate: '2026-08-29',
        endDate: '2026-08-30',
        lokasi: 'Kampus Universitas Muhammadiyah Gombong (UNIMUGO)',
        location: 'Kampus Universitas Muhammadiyah Gombong (UNIMUGO)',
        biaya: 'Rp 100.000 / Kwarda/Qabilah PTMA',
        status: 'Buka',
        kuota: '400 Orang',
        deskripsi: 'Pertemuan silaturahmi Pelatih Nasional HW Jateng, Pandu Senior, dan Alumni Jaya Melati 2 se-Jawa Tengah di Universitas Muhammadiyah Gombong (UNIMUGO) untuk penguatan silaturahmi, perkaderan, dan konsolidasi kepanduan Hizbul Wathan.',
        description: 'Pertemuan silaturahmi Pelatih Nasional HW Jateng, Pandu Senior, dan Alumni Jaya Melati 2 se-Jawa Tengah di Universitas Muhammadiyah Gombong (UNIMUGO) untuk penguatan silaturahmi, perkaderan, dan konsolidasi kepanduan Hizbul Wathan.',
        gambarUrl: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&q=80&w=800',
        imageUrl: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&q=80&w=800',
        penyelenggara: 'Kwartir Wilayah HW Jawa Tengah',
        createdBy: 'muhammaddzikron@gmail.com',
        creatorName: 'Muhammad Dzikron',
        isPublished: true,
        createdAt: '2026-08-01T00:00:00.000Z',
        updatedAt: '2026-08-01T00:00:00.000Z'
      }
    ];

    try {
      const unsub = onSnapshot(collection(db, 'hw_activities'), (snap) => {
        if (!snap.empty) {
          const list = snap.docs.map(d => {
            const data = d.data();
            return {
              id: d.id,
              ...data,
              namaKegiatan: data.namaKegiatan || data.title || '',
              title: data.title || data.namaKegiatan || '',
              deskripsi: data.deskripsi || data.description || '',
              description: data.description || data.deskripsi || '',
              lokasi: data.lokasi || data.location || '',
              location: data.location || data.lokasi || '',
              tanggal: data.tanggal || data.startDate || '',
              startDate: data.startDate || data.tanggal || '',
              gambarUrl: data.gambarUrl || data.imageUrl || 'https://images.unsplash.com/photo-1510312305653-8ed496efae75?auto=format&fit=crop&q=80&w=800',
              imageUrl: data.imageUrl || data.gambarUrl || 'https://images.unsplash.com/photo-1510312305653-8ed496efae75?auto=format&fit=crop&q=80&w=800',
              kategori: data.kategori || data.category || 'Silaturahmi',
              category: data.category || data.kategori || 'Silaturahmi',
              status: data.status || 'Buka'
            };
          });
          callback(list);
        } else {
          defaults.forEach(def => {
            setDoc(doc(db, 'hw_activities', def.id), cleanData(def), { merge: true }).catch(() => {});
          });
          callback(defaults);
        }
      }, (err) => {
        console.warn('subscribeToActivities warning:', err);
      });
      return unsub;
    } catch (e) {
      console.error('subscribeToActivities error:', e);
      return () => {};
    }
  },

  subscribeToActivityApplications(callback: (apps: any[]) => void): () => void {
    const defaultApps = [
      {
        id: 'actreg-dzikron',
        activityId: 'keg-silaturahmi-pelatih',
        namaKegiatan: 'Pertemuan Silaturahmi Pelatih Nasional HW Jateng, Pandu Senior dan Alumni Jaya Melati 2',
        userId: 'user-dzikron',
        namaLengkap: 'Muhammad Dzikron',
        unsur: 'Kwarwil HW Jateng',
        utusan: 'Kwarwil HW Jateng',
        jabatan: 'Sekretaris',
        kategoriUndangan: 'Pelatih Nasional HW Jateng',
        noHp: '081226854000',
        status: 'approved',
        tanggalDaftar: '2026-08-06T08:00:00.000Z'
      },
      {
        id: 'actreg-burhan',
        activityId: 'keg-silaturahmi-pelatih',
        namaKegiatan: 'Pertemuan Silaturahmi Pelatih Nasional HW Jateng, Pandu Senior dan Alumni Jaya Melati 2',
        userId: 'user-burhan',
        namaLengkap: 'BURHAN UTAMSI',
        unsur: 'Kwarda HW',
        utusan: 'Kwarda HW Kabupaten Purworejo',
        asalKwarda: 'Kabupaten Purworejo',
        jabatan: 'Ketua',
        kategoriUndangan: 'Alumni Jati 2 HW Jateng di Klaten',
        noHp: '08562737944',
        status: 'approved',
        tanggalDaftar: '2026-08-06T08:00:00.000Z'
      },
      {
        id: 'actreg-jalu',
        activityId: 'keg-silaturahmi-pelatih',
        namaKegiatan: 'Pertemuan Silaturahmi Pelatih Nasional HW Jateng, Pandu Senior dan Alumni Jaya Melati 2',
        userId: 'user-jalu',
        namaLengkap: 'JALU SURONO',
        unsur: 'Kwarda HW',
        utusan: 'Kwarda HW Kabupaten Klaten',
        asalKwarda: 'Kabupaten Klaten',
        jabatan: 'Anggota',
        kategoriUndangan: 'Alumni Jati 2 HW Jateng di Klaten',
        noHp: '081548754225',
        status: 'approved',
        tanggalDaftar: '2026-08-06T08:00:00.000Z'
      }
    ];

    try {
      const unsub = onSnapshot(collection(db, 'activity_applications'), (snap) => {
        let list: any[] = [];
        if (!snap.empty) {
          list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        } else {
          defaultApps.forEach(def => {
            setDoc(doc(db, 'activity_applications', def.id), cleanData(def), { merge: true }).catch(() => {});
          });
          list = [...defaultApps];
        }

        list = list.map((a: any) => {
          if (a.activityId === 'keg-1' || a.activityId === 'keg-silaturahmi-pelatih' || !a.activityId) {
            return {
              ...a,
              activityId: 'keg-silaturahmi-pelatih',
              namaKegiatan: 'Pertemuan Silaturahmi Pelatih Nasional HW Jateng, Pandu Senior dan Alumni Jaya Melati 2'
            };
          }
          return a;
        });

        callback(list);
      }, (err) => {
        console.warn('subscribeToActivityApplications warning:', err);
      });
      return unsub;
    } catch (e) {
      return () => {};
    }
  },

  // --- KEGIATAN HW JATENG ---
  async getActivities(): Promise<any[]> {
    const defaults = [
      {
        id: 'keg-silaturahmi-pelatih',
        namaKegiatan: 'Pertemuan Silaturahmi Pelatih Nasional HW Jateng, Pandu Senior dan Alumni Jaya Melati 2',
        title: 'Pertemuan Silaturahmi Pelatih Nasional HW Jateng, Pandu Senior dan Alumni Jaya Melati 2',
        kategori: 'Silaturahmi',
        category: 'Silaturahmi',
        tanggal: '29-30 Agustus 2026',
        startDate: '2026-08-29',
        endDate: '2026-08-30',
        lokasi: 'Kampus Universitas Muhammadiyah Gombong (UNIMUGO)',
        location: 'Kampus Universitas Muhammadiyah Gombong (UNIMUGO)',
        biaya: 'Rp 100.000 / Kwarda/Qabilah PTMA',
        status: 'Buka',
        kuota: '400 Orang',
        deskripsi: 'Pertemuan silaturahmi Pelatih Nasional HW Jateng, Pandu Senior, dan Alumni Jaya Melati 2 se-Jawa Tengah di Universitas Muhammadiyah Gombong (UNIMUGO) untuk penguatan silaturahmi, perkaderan, dan konsolidasi kepanduan Hizbul Wathan.',
        description: 'Pertemuan silaturahmi Pelatih Nasional HW Jateng, Pandu Senior, dan Alumni Jaya Melati 2 se-Jawa Tengah di Universitas Muhammadiyah Gombong (UNIMUGO) untuk penguatan silaturahmi, perkaderan, dan konsolidasi kepanduan Hizbul Wathan.',
        gambarUrl: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&q=80&w=800',
        imageUrl: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&q=80&w=800',
        penyelenggara: 'Kwartir Wilayah HW Jawa Tengah',
        createdBy: 'muhammaddzikron@gmail.com',
        creatorName: 'Muhammad Dzikron',
        isPublished: true,
        createdAt: '2026-08-01T00:00:00.000Z',
        updatedAt: '2026-08-01T00:00:00.000Z'
      }
    ];

    try {
      const snap = await getDocs(collection(db, 'hw_activities'));
      if (!snap.empty) {
        return snap.docs.map(d => {
          const data = d.data();
          return {
            id: d.id,
            ...data,
            namaKegiatan: data.namaKegiatan || data.title || '',
            title: data.title || data.namaKegiatan || '',
            deskripsi: data.deskripsi || data.description || '',
            description: data.description || data.deskripsi || '',
            lokasi: data.lokasi || data.location || '',
            location: data.location || data.lokasi || '',
            tanggal: data.tanggal || data.startDate || '',
            startDate: data.startDate || data.tanggal || '',
            gambarUrl: data.gambarUrl || data.imageUrl || 'https://images.unsplash.com/photo-1510312305653-8ed496efae75?auto=format&fit=crop&q=80&w=800',
            imageUrl: data.imageUrl || data.gambarUrl || 'https://images.unsplash.com/photo-1510312305653-8ed496efae75?auto=format&fit=crop&q=80&w=800',
            kategori: data.kategori || data.category || 'Silaturahmi',
            category: data.category || data.kategori || 'Silaturahmi',
            status: data.status || 'Buka'
          };
        });
      }

      for (const def of defaults) {
        await setDoc(doc(db, 'hw_activities', def.id), cleanData(def), { merge: true }).catch(() => {});
      }
      return defaults;
    } catch (err: any) {
      this.checkQuotaError(err);
      console.error('Firestore getActivities error:', err);
      return defaults;
    }
  },

  async saveActivity(activityData: any): Promise<any> {
    const actId = activityData.id || `keg-${Date.now()}`;
    const nowIso = new Date().toISOString();
    const titleVal = activityData.namaKegiatan || activityData.title || '';
    const descVal = activityData.deskripsi || activityData.description || '';
    const locVal = activityData.lokasi || activityData.location || '';
    const dateVal = activityData.tanggal || activityData.startDate || '';
    const imgVal = activityData.gambarUrl || activityData.imageUrl || 'https://images.unsplash.com/photo-1510312305653-8ed496efae75?auto=format&fit=crop&q=80&w=800';
    const catVal = activityData.kategori || activityData.category || 'Silaturahmi';

    const newAct = cleanData({
      ...activityData,
      id: actId,
      namaKegiatan: titleVal,
      title: titleVal,
      deskripsi: descVal,
      description: descVal,
      lokasi: locVal,
      location: locVal,
      tanggal: dateVal,
      startDate: dateVal,
      endDate: activityData.endDate || '',
      startTime: activityData.startTime || activityData.jamMulai || '',
      endTime: activityData.endTime || activityData.jamSelesai || '',
      biaya: activityData.biaya || 'Gratis',
      kuota: activityData.kuota || 'Terbuka',
      gambarUrl: imgVal,
      imageUrl: imgVal,
      kategori: catVal,
      category: catVal,
      status: activityData.status || 'Buka',
      penyelenggara: activityData.penyelenggara || 'Kwartir Wilayah HW Jawa Tengah',
      createdBy: activityData.createdBy || '',
      creatorName: activityData.creatorName || '',
      isPublished: activityData.isPublished !== undefined ? activityData.isPublished : true,
      createdAt: activityData.createdAt || nowIso,
      updatedAt: nowIso
    });

    try {
      await setDoc(doc(db, 'hw_activities', actId), newAct, { merge: true });
    } catch (err: any) {
      this.checkQuotaError(err);
      console.error('Firestore saveActivity error:', err);
      throw new Error('Gagal menyimpan ke Cloud Firestore: ' + (err.message || 'Koneksi terputus'));
    }

    // Sync trainingActivities inside app_settings if applicable
    try {
      const currentSettings = await this.getSettings();
      const currentActs = Array.isArray(currentSettings.trainingActivities) ? currentSettings.trainingActivities : [];
      const actIdx = currentActs.findIndex((a: any) => a.id === actId);
      if (actIdx >= 0) {
        currentActs[actIdx] = { ...currentActs[actIdx], ...newAct };
      } else {
        currentActs.unshift(newAct);
      }
      await this.saveSettings({ ...currentSettings, trainingActivities: currentActs });
    } catch (e) {}

    return newAct;
  },

  async deleteActivity(id: string): Promise<boolean> {
    try {
      await deleteDoc(doc(db, 'hw_activities', id));
    } catch (err: any) {
      this.checkQuotaError(err);
      console.error('Firestore deleteActivity error:', err);
      throw new Error('Gagal menghapus kegiatan dari Cloud Firestore: ' + (err.message || 'Koneksi terputus'));
    }

    try {
      const currentSettings = await this.getSettings();
      const currentActs = Array.isArray(currentSettings.trainingActivities) ? currentSettings.trainingActivities : [];
      const filteredActs = currentActs.filter((a: any) => a.id !== id);
      await this.saveSettings({ ...currentSettings, trainingActivities: filteredActs });
    } catch (e) {}

    return true;
  },

  async getActivityApplications(): Promise<any[]> {
    const defaultApps = [
      {
        id: 'actreg-dzikron',
        activityId: 'keg-silaturahmi-pelatih',
        namaKegiatan: 'Pertemuan Silaturahmi Pelatih Nasional HW Jateng, Pandu Senior dan Alumni Jaya Melati 2',
        userId: 'user-dzikron',
        namaLengkap: 'Muhammad Dzikron',
        unsur: 'Kwarwil HW Jateng',
        utusan: 'Kwarwil HW Jateng',
        jabatan: 'Sekretaris',
        kategoriUndangan: 'Pelatih Nasional HW Jateng',
        noHp: '081226854000',
        status: 'approved',
        tanggalDaftar: '2026-08-06T08:00:00.000Z'
      },
      {
        id: 'actreg-burhan',
        activityId: 'keg-silaturahmi-pelatih',
        namaKegiatan: 'Pertemuan Silaturahmi Pelatih Nasional HW Jateng, Pandu Senior dan Alumni Jaya Melati 2',
        userId: 'user-burhan',
        namaLengkap: 'BURHAN UTAMSI',
        unsur: 'Kwarda HW',
        utusan: 'Kwarda HW Kabupaten Purworejo',
        asalKwarda: 'Kabupaten Purworejo',
        jabatan: 'Ketua',
        kategoriUndangan: 'Alumni Jati 2 HW Jateng di Klaten',
        noHp: '08562737944',
        status: 'approved',
        tanggalDaftar: '2026-08-06T08:00:00.000Z'
      },
      {
        id: 'actreg-jalu',
        activityId: 'keg-silaturahmi-pelatih',
        namaKegiatan: 'Pertemuan Silaturahmi Pelatih Nasional HW Jateng, Pandu Senior dan Alumni Jaya Melati 2',
        userId: 'user-jalu',
        namaLengkap: 'JALU SURONO',
        unsur: 'Kwarda HW',
        utusan: 'Kwarda HW Kabupaten Klaten',
        asalKwarda: 'Kabupaten Klaten',
        jabatan: 'Anggota',
        kategoriUndangan: 'Alumni Jati 2 HW Jateng di Klaten',
        noHp: '081548754225',
        status: 'approved',
        tanggalDaftar: '2026-08-06T08:00:00.000Z'
      }
    ];

    try {
      const snap = await getDocs(collection(db, 'activity_applications'));
      let list: any[] = [];
      if (!snap.empty) {
        list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      }

      for (const def of defaultApps) {
        const exists = list.some((p: any) => 
          p.id === def.id || (p.namaLengkap && p.namaLengkap.toLowerCase().trim() === def.namaLengkap.toLowerCase().trim())
        );
        if (!exists) {
          list.push(def);
          setDoc(doc(db, 'activity_applications', def.id), cleanData(def)).catch(() => {});
        }
      }

      // Normalize activityIds
      list = list.map((a: any) => {
        if (a.activityId === 'keg-1' || a.activityId === 'keg-silaturahmi-pelatih' || !a.activityId) {
          return {
            ...a,
            activityId: 'keg-silaturahmi-pelatih',
            namaKegiatan: 'Pertemuan Silaturahmi Pelatih Nasional HW Jateng, Pandu Senior dan Alumni Jaya Melati 2'
          };
        }
        return a;
      });

      return list;
    } catch (err: any) {
      this.checkQuotaError(err);
      console.error('Firestore getActivityApplications error:', err);
      return defaultApps;
    }
  },

  async registerActivity(appData: any): Promise<any> {
    const regId = appData.id || `actreg-${Date.now()}`;
    const cleanReg = cleanData({
      ...appData,
      id: regId,
      status: appData.status || 'approved',
      tanggalDaftar: appData.tanggalDaftar || new Date().toISOString()
    });

    try {
      await setDoc(doc(db, 'activity_applications', regId), cleanReg, { merge: true });
    } catch (err: any) {
      this.checkQuotaError(err);
      console.error('Firestore registerActivity error:', err);
      throw new Error('Gagal mendaftar kegiatan di Cloud Firestore: ' + (err.message || 'Koneksi terputus'));
    }

    // Automatically create/ensure KTA Application & Member Profile for participant
    try {
      const email = cleanReg.email?.trim().toLowerCase();
      const nama = cleanReg.namaLengkap || cleanReg.nama || 'Anggota HW';
      const ktaPayload = {
        id: `kta-${email ? email.replace(/[^a-zA-Z0-9]/g, '_') : Date.now()}`,
        userId: cleanReg.userId || `user-${Date.now()}`,
        nama: nama,
        nik: cleanReg.nik || '',
        noWa: cleanReg.noHp || cleanReg.noWa || '',
        email: email || '',
        asalDaerah: cleanReg.asalKwarda || cleanReg.asalDaerah || 'Jawa Tengah',
        qabilah: cleanReg.qabilah || 'Peserta Kegiatan HW',
        tingkatan: cleanReg.golongan || 'Dewasa',
        status: 'approved',
        approvalDate: new Date().toISOString(),
        isDigitalOnly: true
      };
      await this.createKTAApplication(ktaPayload);
    } catch (e) {
      console.error('Auto KTA creation for activity error:', e);
    }

    return cleanReg;
  },

  async deleteActivityApplication(id: string): Promise<boolean> {
    try {
      await deleteDoc(doc(db, 'activity_applications', id));
    } catch (err: any) {
      this.checkQuotaError(err);
      console.error('Firestore deleteActivityApplication error:', err);
      throw new Error('Gagal menghapus pendaftaran dari Cloud Firestore: ' + (err.message || 'Koneksi terputus'));
    }
    return true;
  },

  /**
   * Delete all pending KTA applications
   */
  async deletePendingKtaApplications(): Promise<{ success: boolean; deletedCount: number }> {
    try {
      let deletedCount = 0;
      let ktas: any[] = [];
      if (!this.getIsQuotaExceeded()) {
        try {
          const snap = await getDocs(collection(db, 'kta_applications'));
          if (!snap.empty) {
            ktas = snap.docs.map(d => ({ id: d.id, ...d.data() }));
          }
        } catch (e) {
          this.checkQuotaError(e);
        }
      }

      let localKtas: any[] = [];
      try {
        const stored = localStorage.getItem('kta_applications') || '[]';
        localKtas = JSON.parse(stored);
      } catch (e) {}

      // Combine items from both Firestore and LocalStorage to make sure no invalid record escapes
      const allKtasMap = new Map<string, any>();
      localKtas.forEach(k => { if (k && k.id) allKtasMap.set(String(k.id), k); });
      ktas.forEach(k => { if (k && k.id) allKtasMap.set(String(k.id), k); });

      const pendingIds: string[] = [];
      const remainingKtas: any[] = [];

      allKtasMap.forEach((k, id) => {
        if (!k) return;
        const status = (k.status || '').toString().trim().toLowerCase();
        const name = (k.nama || k.namaLengkap || '').toString().trim();
        const isInvalidName = !name || name === 'Tanpa Nama' || name === '-' || name === 'KTA-HW.JT.XXXX' || name.toLowerCase() === 'undefined' || name.toLowerCase() === 'null';

        if (status === 'pending' || !status || isInvalidName) {
          if (id) pendingIds.push(id);
          deletedCount++;
        } else {
          remainingKtas.push(k);
        }
      });

      if (pendingIds.length > 0 && !this.getIsQuotaExceeded()) {
        const batch = writeBatch(db);
        pendingIds.forEach(id => {
          batch.delete(doc(db, 'kta_applications', id));
        });
        await batch.commit().catch(err => {
          this.checkQuotaError(err);
          console.warn('Error deleting pending KTAs batch:', err);
        });
      }

      localStorage.setItem('kta_applications', JSON.stringify(remainingKtas));
      return { success: true, deletedCount };
    } catch (err: any) {
      this.checkQuotaError(err);
      console.error('deletePendingKtaApplications error:', err);
      return { success: false, deletedCount: 0 };
    }
  },

  /**
   * Synchronize all approved KTA Applications to Members & vice versa, and purge pending data
   */
  async syncApprovedKtasToMembers(): Promise<{ success: boolean; addedCount: number; updatedCount: number; deletedPendingCount: number; message?: string }> {
    try {
      let addedCount = 0;
      let updatedCount = 0;
      let deletedPendingCount = 0;

      // 1. Fetch current members and KTA applications
      let members: User[] = [];
      let ktas: any[] = [];

      if (!this.getIsQuotaExceeded()) {
        try {
          const memberSnap = await getDocs(collection(db, 'members'));
          if (!memberSnap.empty) {
            members = memberSnap.docs.map(d => ({ id: d.id, ...d.data() } as User));
          }
        } catch (e) {
          this.checkQuotaError(e);
          console.warn('Sync: Failed to fetch members from Firestore:', e);
        }
      }

      if (members.length === 0) {
        const storedMembers = localStorage.getItem('mock_members') || '[]';
        try { members = JSON.parse(storedMembers); } catch (e) {}
      }

      if (!this.getIsQuotaExceeded()) {
        try {
          const ktaSnap = await getDocs(collection(db, 'kta_applications'));
          if (!ktaSnap.empty) {
            ktas = ktaSnap.docs.map(d => ({ id: d.id, ...d.data() }));
          }
        } catch (e) {
          this.checkQuotaError(e);
          console.warn('Sync: Failed to fetch ktas from Firestore:', e);
        }
      }

      if (ktas.length === 0) {
        const storedKtas = localStorage.getItem('kta_applications') || '[]';
        try { ktas = JSON.parse(storedKtas); } catch (e) {}
      }

      // 2. Delete pending KTA applications ("jika masih ada data terpending hapus saja")
      const validKtas: any[] = [];
      const pendingKtaIdsToDelete: string[] = [];

      ktas.forEach(k => {
        if (!k) return;
        const st = (k.status || '').toString().trim().toLowerCase();
        if (st === 'pending' || !st) {
          if (k.id) pendingKtaIdsToDelete.push(String(k.id));
          deletedPendingCount++;
        } else {
          validKtas.push(k);
        }
      });

      if (pendingKtaIdsToDelete.length > 0) {
        const batch = writeBatch(db);
        pendingKtaIdsToDelete.forEach(id => {
          batch.delete(doc(db, 'kta_applications', id));
        });
        await batch.commit().catch(err => console.warn('Failed to delete pending KTAs batch:', err));
      }

      ktas = validKtas;

      // 3. Synchronize Approved KTAs -> Members
      const newMembers = [...members];
      const memberBatch = writeBatch(db);
      const ktaBatch = writeBatch(db);

      for (const k of ktas) {
        const kStatus = (k.status || '').toString().toLowerCase();
        const ktaNum = (k.ktaNumber || k.KtaNumber || k.ktanumber || '').toString().trim();

        if (ktaNum !== '' && kStatus !== 'approved') {
          k.status = 'approved';
        }

        if (k.status?.toLowerCase() !== 'approved') continue;

        const kEmail = (k.email || '').toString().trim().toLowerCase();
        const kName = (k.nama || k.namaLengkap || '').toString().trim();
        const kUserId = k.userId ? String(k.userId).trim() : '';
        const kId = k.id ? String(k.id).trim() : '';

        if (!kEmail && !kName) continue;

        let assignedKtaNumber = ktaNum;
        if (!assignedKtaNumber) {
          assignedKtaNumber = `KTA-HW.JT.${new Date().getFullYear().toString().substring(2)}${Math.floor(10 + Math.random() * 90)}.${Math.floor(1000 + Math.random() * 9000)}`;
          k.ktaNumber = assignedKtaNumber;
          ktaBatch.set(doc(db, 'kta_applications', String(kId || `kta-${Date.now()}`)), cleanData({ ...k, ktaNumber: assignedKtaNumber }), { merge: true });
        }

        const kGender = k.jenisKelamin === 'Perempuan' || k.jenisKelamin === 'P' ? 'P' : 'L';
        const kKwarda = k.asalDaerah || k.asalKwarda || '';
        const kQabilah = k.qabilah || '';
        const kNoHp = k.noWa || k.noHp || '';
        const kPhoto = k.photo || '';
        const kGolongan = k.tingkatan || k.golongan || 'Dewasa';
        const kAlamat = k.alamat || '';

        const existingIdx = newMembers.findIndex((m: any) => {
          const mEmail = (m.email || '').toString().trim().toLowerCase();
          const mId = m.id ? String(m.id).trim() : '';
          return (kEmail && mEmail && kEmail === mEmail) || (kUserId && mId && kUserId === mId) || (kId && mId && kId === mId);
        });

        if (existingIdx === -1) {
          const memberId = kUserId || kId || ('user-' + (kEmail ? kEmail.replace(/[^a-zA-Z0-9]/g, '_') : Date.now()));
          const newMemberObj: User = {
            id: memberId,
            email: kEmail || `${memberId}@hw.or.id`,
            namaLengkap: kName || 'Anggota HW',
            jenisKelamin: kGender,
            golongan: kGolongan,
            pelatihan: [],
            pendidikan: '',
            asalKwarda: kKwarda,
            qabilah: kQabilah,
            alamat: kAlamat,
            noHp: kNoHp,
            sosmed: '',
            isVerified: true,
            role: 'umum',
            roles: ['umum'],
            activeRole: 'umum',
            photo: kPhoto,
            ktaNumber: assignedKtaNumber,
            password: '12345hw'
          };
          newMembers.push(newMemberObj);
          memberBatch.set(doc(db, 'members', String(memberId)), cleanData(newMemberObj), { merge: true });
          addedCount++;
        } else {
          const m = newMembers[existingIdx];
          let updated = false;

          if (kName && m.namaLengkap !== kName) { m.namaLengkap = kName; updated = true; }
          if (m.jenisKelamin !== kGender) { m.jenisKelamin = kGender; updated = true; }
          if (!m.asalKwarda || m.asalKwarda === '') { m.asalKwarda = kKwarda; updated = true; }
          if (!m.qabilah || m.qabilah === '') { m.qabilah = kQabilah; updated = true; }
          if (!m.noHp || m.noHp === '') { m.noHp = kNoHp; updated = true; }
          if (!m.alamat || m.alamat === '') { m.alamat = kAlamat; updated = true; }
          if (!m.isVerified) { m.isVerified = true; updated = true; }
          if (assignedKtaNumber && (!m.ktaNumber || m.ktaNumber !== assignedKtaNumber)) {
            m.ktaNumber = assignedKtaNumber;
            updated = true;
          }
          if (kPhoto) {
            if (m.photo !== kPhoto) { m.photo = kPhoto; updated = true; }
          } else if (m.photo) {
            k.photo = m.photo;
            ktaBatch.set(doc(db, 'kta_applications', String(k.id)), cleanData({ ...k, photo: m.photo }), { merge: true });
          }

          if (updated) {
            newMembers[existingIdx] = m;
            memberBatch.set(doc(db, 'members', String(m.id)), cleanData(m), { merge: true });
            updatedCount++;
          }
        }
      }

      // 4. Reverse Sync: For every verified member without a KTA app, create one
      for (const m of newMembers) {
        if (!m || !m.isVerified) continue;
        const mEmail = (m.email || '').toString().trim().toLowerCase();
        const mId = m.id ? String(m.id).trim() : '';

        const hasKta = ktas.some((k: any) => {
          const kEmail = (k.email || '').toString().trim().toLowerCase();
          const kUserId = k.userId ? String(k.userId).trim() : '';
          const kId = k.id ? String(k.id).trim() : '';
          return (mEmail && kEmail && mEmail === kEmail) || (mId && kUserId && mId === kUserId) || (mId && kId && mId === kId);
        });

        if (!hasKta) {
          const ktaId = `kta-${mId || Date.now()}`;
          const ktaNum = m.ktaNumber || `KTA-HW.JT.${new Date().getFullYear().toString().substring(2)}${Math.floor(10 + Math.random() * 90)}.${Math.floor(1000 + Math.random() * 9000)}`;
          const newKtaApp = {
            id: ktaId,
            userId: mId,
            email: mEmail,
            nama: m.namaLengkap,
            jenisKelamin: m.jenisKelamin,
            tingkatan: m.golongan || 'Dewasa',
            asalDaerah: m.asalKwarda || '',
            qabilah: m.qabilah || '',
            noWa: m.noHp || '',
            alamat: m.alamat || '',
            photo: m.photo || '',
            status: 'approved',
            ktaNumber: ktaNum,
            verifiedAt: new Date().toISOString()
          };
          ktas.push(newKtaApp);
          ktaBatch.set(doc(db, 'kta_applications', String(ktaId)), cleanData(newKtaApp), { merge: true });
        }
      }

      if (!this.getIsQuotaExceeded()) {
        await memberBatch.commit().catch(e => {
          this.checkQuotaError(e);
          console.warn('Member batch commit warn:', e);
        });
        await ktaBatch.commit().catch(e => {
          this.checkQuotaError(e);
          console.warn('KTA batch commit warn:', e);
        });
      }

      const cleanMembers = newMembers.filter(m => m && m.namaLengkap && m.namaLengkap !== 'Tanpa Nama' && m.namaLengkap !== '-');
      localStorage.setItem('mock_members', JSON.stringify(cleanMembers));
      localStorage.setItem('kta_applications', JSON.stringify(ktas));

      return {
        success: true,
        addedCount,
        updatedCount,
        deletedPendingCount
      };
    } catch (err: any) {
      console.error('firestoreService.syncApprovedKtasToMembers error:', err);
      return {
        success: false,
        addedCount: 0,
        updatedCount: 0,
        deletedPendingCount: 0,
        message: err.message
      };
    }
  },

  /**
   * Complete Backup & Upload of ALL local data to Firestore
   */
  async backupAndUploadAllToFirestore(): Promise<{ success: boolean; message: string; details: any }> {
    if (this.getIsQuotaExceeded()) {
      return {
        success: false,
        message: 'Aplikasi berjalan dalam mode cache lokal (kuota harian Firestore telah habis). Data Anda tetap tersimpan aman di browser/perangkat lokal.',
        details: null
      };
    }
    try {
      const details = { members: 0, materi: 0, kta: 0, training: 0, contents: 0, settings: false };

      // Members
      const membersStr = localStorage.getItem('mock_members') || '[]';
      const members: User[] = JSON.parse(membersStr);
      if (members.length > 0) {
        const batch = writeBatch(db);
        members.forEach(m => {
          if (m.id) {
            batch.set(doc(db, 'members', String(m.id)), cleanData(m), { merge: true });
            details.members++;
          }
        });
        await batch.commit();
      }

      // Materi
      const materiStr = localStorage.getItem('materi') || '[]';
      const materiList: Materi[] = JSON.parse(materiStr);
      if (materiList.length > 0) {
        const batch = writeBatch(db);
        materiList.forEach(m => {
          if (m.id) {
            batch.set(doc(db, 'materi', String(m.id)), cleanData(m), { merge: true });
            details.materi++;
          }
        });
        await batch.commit();
      }

      // KTA
      const ktaStr = localStorage.getItem('kta_applications') || '[]';
      const ktas: any[] = JSON.parse(ktaStr);
      if (ktas.length > 0) {
        const batch = writeBatch(db);
        ktas.forEach(k => {
          if (k.id) {
            batch.set(doc(db, 'kta_applications', String(k.id)), cleanData(k), { merge: true });
            details.kta++;
          }
        });
        await batch.commit();
      }

      // Training
      const trainingStr = localStorage.getItem('training_applications') || '[]';
      const trainings: any[] = JSON.parse(trainingStr);
      if (trainings.length > 0) {
        const batch = writeBatch(db);
        trainings.forEach(t => {
          if (t.id) {
            batch.set(doc(db, 'training_applications', String(t.id)), cleanData(t), { merge: true });
            details.training++;
          }
        });
        await batch.commit();
      }

      // Contents
      const contentsStr = localStorage.getItem('contents') || '[]';
      const contents: Content[] = JSON.parse(contentsStr);
      if (contents.length > 0) {
        const batch = writeBatch(db);
        contents.forEach(c => {
          if (c.id) {
            batch.set(doc(db, 'contents', String(c.id)), cleanData(c), { merge: true });
            details.contents++;
          }
        });
        await batch.commit();
      }

      // Settings
      const settingsStr = localStorage.getItem('hw_settings');
      if (settingsStr) {
        const settings = JSON.parse(settingsStr);
        await setDoc(doc(db, 'settings', 'app_settings'), cleanData({ ...settings, id: 'app_settings' }), { merge: true });
        details.settings = true;
      }

      // HW Activities
      const activitiesStr = localStorage.getItem('hw_activities') || '[]';
      const activities: any[] = JSON.parse(activitiesStr);
      if (activities.length > 0) {
        const batch = writeBatch(db);
        activities.forEach(a => {
          if (a.id) {
            batch.set(doc(db, 'hw_activities', String(a.id)), cleanData(a), { merge: true });
          }
        });
        await batch.commit();
      }

      return {
        success: true,
        message: 'Seluruh data lokal dan cadangan berhasil diunggah & disinkronkan ke Firestore!',
        details
      };
    } catch (err: any) {
      this.checkQuotaError(err);
      console.error('backupAndUploadAllToFirestore error:', err);
      return {
        success: false,
        message: 'Gagal mengunggah data ke Firestore: ' + err.message,
        details: null
      };
    }
  }
};

import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  writeBatch
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { safeStorageGet, safeStorageSet } from '../utils/safeStorage';
import {
  PengurusOrgItem,
  DewanSugliOrgItem,
  QabilahOrgItem,
  KegiatanOrgItem,
  MateriOrgItem,
  KwardaPtmaSummaryItem
} from '../types';
import { getKwardaPtmaMasterList, getKwardaPtmaByCode } from '../utils/kwardaPtmaUtils';

// Helper to prevent Firestore hanging offline or during cold start
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

// Initial Seed Data for Demo & Pristine Experience
const INITIAL_SEED_PENGURUS: PengurusOrgItem[] = [
  // Banjarnegara (01)
  { id: 'peng-01-1', orgCode: '01', jabatan: 'Ketua Kwarda', nama: 'Sugeng Riyadi, M.Pd.', sortOrder: 1, createdAt: '2025-01-10T08:00:00.000Z' },
  { id: 'peng-01-2', orgCode: '01', jabatan: 'Sekretaris', nama: 'Ahmad Fauzi, S.Pd.I.', sortOrder: 2, createdAt: '2025-01-10T08:00:00.000Z' },
  { id: 'peng-01-3', orgCode: '01', jabatan: 'Bendahara', nama: 'Nur Hidayati, S.E.', sortOrder: 3, createdAt: '2025-01-10T08:00:00.000Z' },
  // Klaten (14)
  { id: 'peng-14-1', orgCode: '14', jabatan: 'Ketua Kwarda', nama: 'Drs. H. Sri Nugroho, M.Hum.', sortOrder: 1, createdAt: '2025-01-12T08:00:00.000Z' },
  { id: 'peng-14-2', orgCode: '14', jabatan: 'Wakil Ketua', nama: 'Muhammad Ridwan, S.Ag.', sortOrder: 2, createdAt: '2025-01-12T08:00:00.000Z' },
  { id: 'peng-14-3', orgCode: '14', jabatan: 'Sekretaris', nama: 'Bambang Triyono, S.Kom.', sortOrder: 3, createdAt: '2025-01-12T08:00:00.000Z' },
  { id: 'peng-14-4', orgCode: '14', jabatan: 'Bendahara', nama: 'Endang Kusparwati, S.Pd.', sortOrder: 4, createdAt: '2025-01-12T08:00:00.000Z' },
  // UMS (36)
  { id: 'peng-36-1', orgCode: '36', jabatan: 'Ketua Qabilah PTMA', nama: 'Dr. Ihsan Maulana, M.Si.', sortOrder: 1, createdAt: '2025-01-15T08:00:00.000Z' },
  { id: 'peng-36-2', orgCode: '36', jabatan: 'Sekretaris Qabilah', nama: 'Rahmat Hidayat, S.Kom.', sortOrder: 2, createdAt: '2025-01-15T08:00:00.000Z' },
  { id: 'peng-36-3', orgCode: '36', jabatan: 'Bendahara Qabilah', nama: 'Dewi Lestari, S.Pd.', sortOrder: 3, createdAt: '2025-01-15T08:00:00.000Z' },
  // UNIMUS (40)
  { id: 'peng-40-1', orgCode: '40', jabatan: 'Ketua Qabilah PTMA', nama: 'Dr. Arif Wibowo, M.Kes.', sortOrder: 1, createdAt: '2025-01-18T08:00:00.000Z' },
  { id: 'peng-40-2', orgCode: '40', jabatan: 'Sekretaris Qabilah', nama: 'Fajar Nugroho, S.Pd.', sortOrder: 2, createdAt: '2025-01-18T08:00:00.000Z' }
];

const INITIAL_SEED_SUGLI: DewanSugliOrgItem[] = [
  // Banjarnegara (01)
  { id: 'sugli-01-1', orgCode: '01', jabatan: 'Ketua Dewan Sugli', nama: 'Dimas Prasetyo', sortOrder: 1, createdAt: '2025-01-10T08:00:00.000Z' },
  { id: 'sugli-01-2', orgCode: '01', jabatan: 'Sekretaris Sugli', nama: 'Annisa Rahmawati', sortOrder: 2, createdAt: '2025-01-10T08:00:00.000Z' },
  // Klaten (14)
  { id: 'sugli-14-1', orgCode: '14', jabatan: 'Ketua Dewan Sugli', nama: 'Bagas Aditya Pratama', sortOrder: 1, createdAt: '2025-01-12T08:00:00.000Z' },
  { id: 'sugli-14-2', orgCode: '14', jabatan: 'Wakil Ketua Sugli', nama: 'Rizky Kurniawan', sortOrder: 2, createdAt: '2025-01-12T08:00:00.000Z' },
  { id: 'sugli-14-3', orgCode: '14', jabatan: 'Sekretaris Sugli', nama: 'Siti Nurjanah', sortOrder: 3, createdAt: '2025-01-12T08:00:00.000Z' },
  // UMS (36)
  { id: 'sugli-36-1', orgCode: '36', jabatan: 'Ketua Kafilah HW UMS', nama: 'Muhammad Farhan Syahputra', sortOrder: 1, createdAt: '2025-01-15T08:00:00.000Z' },
  { id: 'sugli-36-2', orgCode: '36', jabatan: 'Sekretaris Kafilah', nama: 'Nabila Zahra', sortOrder: 2, createdAt: '2025-01-15T08:00:00.000Z' },
  { id: 'sugli-36-3', orgCode: '36', jabatan: 'Bendahara Kafilah', nama: 'Fadli Rahman', sortOrder: 3, createdAt: '2025-01-15T08:00:00.000Z' }
];

const INITIAL_SEED_QABILAH: QabilahOrgItem[] = [
  // Banjarnegara (01)
  { id: 'qab-01-1', orgCode: '01', namaQabilah: 'Qabilah SMA Muhammadiyah 1 Banjarnegara', jumlahAnggota: 120, createdAt: '2025-01-10T08:00:00.000Z' },
  { id: 'qab-01-2', orgCode: '01', namaQabilah: 'Qabilah SMP Muhammadiyah 1 Banjarnegara', jumlahAnggota: 95, createdAt: '2025-01-10T08:00:00.000Z' },
  { id: 'qab-01-3', orgCode: '01', namaQabilah: 'Qabilah SD Muhammadiyah 1 Bawang', jumlahAnggota: 85, createdAt: '2025-01-10T08:00:00.000Z' },
  // Klaten (14)
  { id: 'qab-14-1', orgCode: '14', namaQabilah: 'Qabilah SMA Muhammadiyah 1 Klaten', jumlahAnggota: 245, createdAt: '2025-01-12T08:00:00.000Z' },
  { id: 'qab-14-2', orgCode: '14', namaQabilah: 'Qabilah SMK Muhammadiyah 1 Klaten Utara', jumlahAnggota: 380, createdAt: '2025-01-12T08:00:00.000Z' },
  { id: 'qab-14-3', orgCode: '14', namaQabilah: 'Qabilah SMP Muhammadiyah 1 Klaten', jumlahAnggota: 180, createdAt: '2025-01-12T08:00:00.000Z' },
  { id: 'qab-14-4', orgCode: '14', namaQabilah: 'Qabilah MIM PK Delanggu', jumlahAnggota: 140, createdAt: '2025-01-12T08:00:00.000Z' },
  { id: 'qab-14-5', orgCode: '14', namaQabilah: 'Qabilah Ponpes MBS Klaten', jumlahAnggota: 290, createdAt: '2025-01-12T08:00:00.000Z' }
];

const INITIAL_SEED_KEGIATAN: KegiatanOrgItem[] = [
  // Banjarnegara (01)
  {
    id: 'keg-01-1',
    orgCode: '01',
    jenisKegiatan: 'Musyawarah Daerah Hizbul Wathan VII Banjarnegara',
    jadwal: '2025-06-20',
    keterangan: 'Musyawarah evaluasi periode dan pemilihan pimpinan Kwarda periode berikutnya.',
    linkProposal: 'https://drive.google.com/file/d/sample-musyda-banjarnegara/view',
    createdAt: '2025-01-10T08:00:00.000Z'
  },
  // Klaten (14)
  {
    id: 'keg-14-1',
    orgCode: '14',
    jenisKegiatan: 'Kemah Akbar Pandu Pengenal Se-Kabupaten Klaten',
    jadwal: '2025-08-15',
    keterangan: 'Perkemahan akbar di Bumi Perkemahan Kepurun diikuti 1.200 pandu HW.',
    linkProposal: 'https://drive.google.com/file/d/sample-kemah-akbar-klaten/view',
    createdAt: '2025-01-12T08:00:00.000Z'
  },
  {
    id: 'keg-14-2',
    orgCode: '14',
    jenisKegiatan: 'Pelatihan Pelatih Jaya Melati 1 (JM1) Kwarda Klaten',
    jadwal: '2025-10-24',
    keterangan: 'Peningkatan kapasitas dan standardisasi pelatih pandu HW se-Klaten.',
    linkProposal: 'https://drive.google.com/file/d/sample-diklat-jm1-klaten/view',
    createdAt: '2025-01-12T08:00:00.000Z'
  },
  // UMS (36)
  {
    id: 'keg-36-1',
    orgCode: '36',
    jenisKegiatan: 'Penerimaan Anggota Baru (PAB) & Orientasi Pandu PTMA UMS',
    jadwal: '2025-09-05',
    keterangan: 'Orientasi calon anggota baru Kafilah Penuntun Hizbul Wathan UMS.',
    linkProposal: 'https://drive.google.com/file/d/sample-pab-ums/view',
    createdAt: '2025-01-15T08:00:00.000Z'
  }
];

const INITIAL_SEED_MATERI: MateriOrgItem[] = [
  // Banjarnegara (01)
  {
    id: 'mat-01-1',
    orgCode: '01',
    namaMateri: 'Modul Pedoman & Administrasi Kwartir Daerah HW Banjarnegara',
    kategoriMateri: 'Administrasi & Keorganisasian',
    linkDrive: 'https://drive.google.com/drive/folders/sample-materi-kwarda-banjarnegara',
    keterangan: 'Format baku surat-menyurat, pengarsipan, dan tata laksana administrasi Kwarda.',
    pemateri: 'Kwarda HW Banjarnegara',
    createdAt: '2025-01-10T08:00:00.000Z'
  },
  // Klaten (14)
  {
    id: 'mat-14-1',
    orgCode: '14',
    namaMateri: 'Buku Saku Syarat Kenaikan Tingkat (SKT) Pandu Pengenal Klaten',
    kategoriMateri: 'Kepanduan HW',
    linkDrive: 'https://drive.google.com/drive/folders/sample-skt-klaten',
    keterangan: 'Panduan ujian syarat kenaikan tingkat pengenal purwa, madya, dan utama.',
    pemateri: 'Bidang Diklat Kwarda Klaten',
    createdAt: '2025-01-12T08:00:00.000Z'
  },
  {
    id: 'mat-14-2',
    orgCode: '14',
    namaMateri: 'Materi Pelatihan Jaya Melati 1 (JM1) - Sejarah & Anggaran Dasar HW',
    kategoriMateri: 'Kepelatihan',
    linkDrive: 'https://drive.google.com/file/d/sample-jm1-sejarah/view',
    keterangan: 'Slide presentasi sejarah kepanduan Hizbul Wathan dan AD/ART HW terkini.',
    pemateri: 'Kwarda Klaten / Kwarwil Jateng',
    createdAt: '2025-01-12T08:00:00.000Z'
  },
  // UMS (36)
  {
    id: 'mat-36-1',
    orgCode: '36',
    namaMateri: 'Diktat Orientasi & Pengkaderan Pandu Penuntun Kafilah HW UMS',
    kategoriMateri: 'Pedoman & Petunjuk Teknis',
    linkDrive: 'https://drive.google.com/drive/folders/sample-diktat-ums',
    keterangan: 'Bahan kajian kepanduan dan Al-Islam Kemuhammadiyahan untuk kader mahasiswa PTMA.',
    pemateri: 'Kafilah HW UMS',
    createdAt: '2025-01-15T08:00:00.000Z'
  }
];

export const kwardaPtmaService = {
  // ---------------------------------------------------------------------------
  // PENGURUS
  // ---------------------------------------------------------------------------
  async getPengurusByOrg(orgCode: string): Promise<PengurusOrgItem[]> {
    const normCode = orgCode.trim().padStart(2, '0');
    let localData: PengurusOrgItem[] = [];
    try {
      const raw = safeStorageGet<PengurusOrgItem[]>('hw_kwarda_ptma_pengurus', []);
      if (raw && Array.isArray(raw)) localData = raw;
    } catch {}

    if (!localData || localData.length === 0) {
      localData = [...INITIAL_SEED_PENGURUS];
      safeStorageSet('hw_kwarda_ptma_pengurus', JSON.stringify(localData));
    }

    // Try fetching from Firestore asynchronously
    try {
      const snap = await withTimeout(getDocs(collection(db, 'kwarda_ptma_pengurus')), 4000);
      if (!snap.empty) {
        const firestoreList: PengurusOrgItem[] = [];
        snap.forEach(docSnap => {
          firestoreList.push(docSnap.data() as PengurusOrgItem);
        });
        if (firestoreList.length > 0) {
          // Merge with localData
          const map = new Map<string, PengurusOrgItem>();
          localData.forEach(item => map.set(item.id, item));
          firestoreList.forEach(item => map.set(item.id, item));
          localData = Array.from(map.values());
          safeStorageSet('hw_kwarda_ptma_pengurus', JSON.stringify(localData));
        }
      }
    } catch (err) {
      // offline/timeout fallback safely
    }

    return localData
      .filter(item => (item.orgCode || '').padStart(2, '0') === normCode)
      .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
  },

  async savePengurus(item: PengurusOrgItem): Promise<PengurusOrgItem> {
    const cleanItem: PengurusOrgItem = {
      ...item,
      orgCode: item.orgCode.padStart(2, '0'),
      updatedAt: new Date().toISOString()
    };
    if (!cleanItem.createdAt) {
      cleanItem.createdAt = new Date().toISOString();
    }

    // 1. Update LocalStorage
    let list: PengurusOrgItem[] = [];
    try {
      list = safeStorageGet<PengurusOrgItem[]>('hw_kwarda_ptma_pengurus', []);
    } catch {}
    const existingIndex = list.findIndex(p => p.id === cleanItem.id);
    if (existingIndex >= 0) {
      list[existingIndex] = cleanItem;
    } else {
      list.push(cleanItem);
    }
    safeStorageSet('hw_kwarda_ptma_pengurus', JSON.stringify(list));
    window.dispatchEvent(new Event('kwarda_ptma_updated'));

    // 2. Persist to Firestore
    try {
      await withTimeout(setDoc(doc(db, 'kwarda_ptma_pengurus', cleanItem.id), cleanData(cleanItem), { merge: true }), 6000);
    } catch (err) {
      console.warn('[FIRESTORE] Failed to save pengurus in cloud, cached locally:', err);
    }

    return cleanItem;
  },

  async saveAllPengurusOrder(orgCode: string, items: PengurusOrgItem[]): Promise<boolean> {
    const normCode = orgCode.padStart(2, '0');
    // Update local sort orders
    let fullList: PengurusOrgItem[] = [];
    try {
      fullList = safeStorageGet<PengurusOrgItem[]>('hw_kwarda_ptma_pengurus', []);
    } catch {}

    const reorderedMap = new Map<string, number>();
    items.forEach((item, index) => {
      reorderedMap.set(item.id, index + 1);
    });

    const updatedFullList = fullList.map(item => {
      if (reorderedMap.has(item.id)) {
        return {
          ...item,
          sortOrder: reorderedMap.get(item.id)!,
          updatedAt: new Date().toISOString()
        };
      }
      return item;
    });

    safeStorageSet('hw_kwarda_ptma_pengurus', JSON.stringify(updatedFullList));
    window.dispatchEvent(new Event('kwarda_ptma_updated'));

    // Save batch to Firestore
    try {
      const batch = writeBatch(db);
      items.forEach((item, index) => {
        const itemRef = doc(db, 'kwarda_ptma_pengurus', item.id);
        batch.set(itemRef, cleanData({
          ...item,
          orgCode: normCode,
          sortOrder: index + 1,
          updatedAt: new Date().toISOString()
        }), { merge: true });
      });
      await withTimeout(batch.commit(), 8000);
    } catch (err) {
      console.warn('[FIRESTORE] Batch reorder pengurus cached locally:', err);
    }

    return true;
  },

  async deletePengurus(id: string, orgCode: string): Promise<boolean> {
    let list: PengurusOrgItem[] = [];
    try {
      list = safeStorageGet<PengurusOrgItem[]>('hw_kwarda_ptma_pengurus', []);
    } catch {}
    list = list.filter(item => item.id !== id);
    safeStorageSet('hw_kwarda_ptma_pengurus', JSON.stringify(list));
    window.dispatchEvent(new Event('kwarda_ptma_updated'));

    try {
      await withTimeout(deleteDoc(doc(db, 'kwarda_ptma_pengurus', id)), 6000);
    } catch (err) {
      console.warn('[FIRESTORE] Delete pengurus cached locally:', err);
    }

    return true;
  },

  // ---------------------------------------------------------------------------
  // DEWAN SUGLI / KAFILAH
  // ---------------------------------------------------------------------------
  async getDewanSugliByOrg(orgCode: string): Promise<DewanSugliOrgItem[]> {
    const normCode = orgCode.trim().padStart(2, '0');
    let localData: DewanSugliOrgItem[] = [];
    try {
      const raw = safeStorageGet<DewanSugliOrgItem[]>('hw_kwarda_ptma_sugli', []);
      if (raw && Array.isArray(raw)) localData = raw;
    } catch {}

    if (!localData || localData.length === 0) {
      localData = [...INITIAL_SEED_SUGLI];
      safeStorageSet('hw_kwarda_ptma_sugli', JSON.stringify(localData));
    }

    try {
      const snap = await withTimeout(getDocs(collection(db, 'kwarda_ptma_sugli')), 4000);
      if (!snap.empty) {
        const firestoreList: DewanSugliOrgItem[] = [];
        snap.forEach(docSnap => {
          firestoreList.push(docSnap.data() as DewanSugliOrgItem);
        });
        if (firestoreList.length > 0) {
          const map = new Map<string, DewanSugliOrgItem>();
          localData.forEach(item => map.set(item.id, item));
          firestoreList.forEach(item => map.set(item.id, item));
          localData = Array.from(map.values());
          safeStorageSet('hw_kwarda_ptma_sugli', JSON.stringify(localData));
        }
      }
    } catch (err) {}

    return localData
      .filter(item => (item.orgCode || '').padStart(2, '0') === normCode)
      .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
  },

  async saveDewanSugli(item: DewanSugliOrgItem): Promise<DewanSugliOrgItem> {
    const cleanItem: DewanSugliOrgItem = {
      ...item,
      orgCode: item.orgCode.padStart(2, '0'),
      updatedAt: new Date().toISOString()
    };
    if (!cleanItem.createdAt) {
      cleanItem.createdAt = new Date().toISOString();
    }

    let list: DewanSugliOrgItem[] = [];
    try {
      list = safeStorageGet<DewanSugliOrgItem[]>('hw_kwarda_ptma_sugli', []);
    } catch {}
    const existingIndex = list.findIndex(p => p.id === cleanItem.id);
    if (existingIndex >= 0) {
      list[existingIndex] = cleanItem;
    } else {
      list.push(cleanItem);
    }
    safeStorageSet('hw_kwarda_ptma_sugli', JSON.stringify(list));
    window.dispatchEvent(new Event('kwarda_ptma_updated'));

    try {
      await withTimeout(setDoc(doc(db, 'kwarda_ptma_sugli', cleanItem.id), cleanData(cleanItem), { merge: true }), 6000);
    } catch (err) {
      console.warn('[FIRESTORE] Save dewan sugli cached locally:', err);
    }

    return cleanItem;
  },

  async saveAllDewanSugliOrder(orgCode: string, items: DewanSugliOrgItem[]): Promise<boolean> {
    const normCode = orgCode.padStart(2, '0');
    let fullList: DewanSugliOrgItem[] = [];
    try {
      fullList = safeStorageGet<DewanSugliOrgItem[]>('hw_kwarda_ptma_sugli', []);
    } catch {}

    const reorderedMap = new Map<string, number>();
    items.forEach((item, index) => {
      reorderedMap.set(item.id, index + 1);
    });

    const updatedFullList = fullList.map(item => {
      if (reorderedMap.has(item.id)) {
        return {
          ...item,
          sortOrder: reorderedMap.get(item.id)!,
          updatedAt: new Date().toISOString()
        };
      }
      return item;
    });

    safeStorageSet('hw_kwarda_ptma_sugli', JSON.stringify(updatedFullList));
    window.dispatchEvent(new Event('kwarda_ptma_updated'));

    try {
      const batch = writeBatch(db);
      items.forEach((item, index) => {
        const itemRef = doc(db, 'kwarda_ptma_sugli', item.id);
        batch.set(itemRef, cleanData({
          ...item,
          orgCode: normCode,
          sortOrder: index + 1,
          updatedAt: new Date().toISOString()
        }), { merge: true });
      });
      await withTimeout(batch.commit(), 8000);
    } catch (err) {
      console.warn('[FIRESTORE] Batch reorder sugli cached locally:', err);
    }

    return true;
  },

  async deleteDewanSugli(id: string, orgCode: string): Promise<boolean> {
    let list: DewanSugliOrgItem[] = [];
    try {
      list = safeStorageGet<DewanSugliOrgItem[]>('hw_kwarda_ptma_sugli', []);
    } catch {}
    list = list.filter(item => item.id !== id);
    safeStorageSet('hw_kwarda_ptma_sugli', JSON.stringify(list));
    window.dispatchEvent(new Event('kwarda_ptma_updated'));

    try {
      await withTimeout(deleteDoc(doc(db, 'kwarda_ptma_sugli', id)), 6000);
    } catch (err) {
      console.warn('[FIRESTORE] Delete dewan sugli cached locally:', err);
    }

    return true;
  },

  // ---------------------------------------------------------------------------
  // DATA QABILAH (Kwarda Only)
  // ---------------------------------------------------------------------------
  async getQabilahByOrg(orgCode: string): Promise<QabilahOrgItem[]> {
    const normCode = orgCode.trim().padStart(2, '0');
    let localData: QabilahOrgItem[] = [];
    try {
      const raw = safeStorageGet<QabilahOrgItem[]>('hw_kwarda_ptma_qabilah', []);
      if (raw && Array.isArray(raw)) localData = raw;
    } catch {}

    if (!localData || localData.length === 0) {
      localData = [...INITIAL_SEED_QABILAH];
      safeStorageSet('hw_kwarda_ptma_qabilah', JSON.stringify(localData));
    }

    try {
      const snap = await withTimeout(getDocs(collection(db, 'kwarda_ptma_qabilah')), 4000);
      if (!snap.empty) {
        const firestoreList: QabilahOrgItem[] = [];
        snap.forEach(docSnap => {
          firestoreList.push(docSnap.data() as QabilahOrgItem);
        });
        if (firestoreList.length > 0) {
          const map = new Map<string, QabilahOrgItem>();
          localData.forEach(item => map.set(item.id, item));
          firestoreList.forEach(item => map.set(item.id, item));
          localData = Array.from(map.values());
          safeStorageSet('hw_kwarda_ptma_qabilah', JSON.stringify(localData));
        }
      }
    } catch (err) {}

    return localData.filter(item => (item.orgCode || '').padStart(2, '0') === normCode);
  },

  async saveQabilah(item: QabilahOrgItem): Promise<QabilahOrgItem> {
    const cleanItem: QabilahOrgItem = {
      ...item,
      orgCode: item.orgCode.padStart(2, '0'),
      jumlahAnggota: Math.max(0, Number(item.jumlahAnggota) || 0),
      updatedAt: new Date().toISOString()
    };
    if (!cleanItem.createdAt) {
      cleanItem.createdAt = new Date().toISOString();
    }

    let list: QabilahOrgItem[] = [];
    try {
      list = safeStorageGet<QabilahOrgItem[]>('hw_kwarda_ptma_qabilah', []);
    } catch {}
    const existingIndex = list.findIndex(p => p.id === cleanItem.id);
    if (existingIndex >= 0) {
      list[existingIndex] = cleanItem;
    } else {
      list.push(cleanItem);
    }
    safeStorageSet('hw_kwarda_ptma_qabilah', JSON.stringify(list));
    window.dispatchEvent(new Event('kwarda_ptma_updated'));

    try {
      await withTimeout(setDoc(doc(db, 'kwarda_ptma_qabilah', cleanItem.id), cleanData(cleanItem), { merge: true }), 6000);
    } catch (err) {
      console.warn('[FIRESTORE] Save qabilah cached locally:', err);
    }

    return cleanItem;
  },

  async deleteQabilah(id: string, orgCode: string): Promise<boolean> {
    let list: QabilahOrgItem[] = [];
    try {
      list = safeStorageGet<QabilahOrgItem[]>('hw_kwarda_ptma_qabilah', []);
    } catch {}
    list = list.filter(item => item.id !== id);
    safeStorageSet('hw_kwarda_ptma_qabilah', JSON.stringify(list));
    window.dispatchEvent(new Event('kwarda_ptma_updated'));

    try {
      await withTimeout(deleteDoc(doc(db, 'kwarda_ptma_qabilah', id)), 6000);
    } catch (err) {
      console.warn('[FIRESTORE] Delete qabilah cached locally:', err);
    }

    return true;
  },

  // ---------------------------------------------------------------------------
  // KEGIATAN ORGANISASI (Kwarda & Qabilah PTMA)
  // ---------------------------------------------------------------------------
  async getKegiatanByOrg(orgCode: string): Promise<KegiatanOrgItem[]> {
    const normCode = orgCode.trim().padStart(2, '0');
    let localData: KegiatanOrgItem[] = [];
    try {
      const raw = safeStorageGet<KegiatanOrgItem[]>('hw_kwarda_ptma_kegiatan', []);
      if (raw && Array.isArray(raw)) localData = raw;
    } catch {}

    if (!localData || localData.length === 0) {
      localData = [...INITIAL_SEED_KEGIATAN];
      safeStorageSet('hw_kwarda_ptma_kegiatan', JSON.stringify(localData));
    }

    try {
      const snap = await withTimeout(getDocs(collection(db, 'kwarda_ptma_kegiatan')), 4000);
      if (!snap.empty) {
        const firestoreList: KegiatanOrgItem[] = [];
        snap.forEach(docSnap => {
          firestoreList.push(docSnap.data() as KegiatanOrgItem);
        });
        if (firestoreList.length > 0) {
          const map = new Map<string, KegiatanOrgItem>();
          localData.forEach(item => map.set(item.id, item));
          firestoreList.forEach(item => map.set(item.id, item));
          localData = Array.from(map.values());
          safeStorageSet('hw_kwarda_ptma_kegiatan', JSON.stringify(localData));
        }
      }
    } catch (err) {}

    return localData
      .filter(item => (item.orgCode || '').padStart(2, '0') === normCode)
      .sort((a, b) => new Date(b.jadwal || 0).getTime() - new Date(a.jadwal || 0).getTime());
  },

  async saveKegiatan(item: KegiatanOrgItem): Promise<KegiatanOrgItem> {
    const cleanItem: KegiatanOrgItem = {
      ...item,
      orgCode: item.orgCode.padStart(2, '0'),
      updatedAt: new Date().toISOString()
    };
    if (!cleanItem.createdAt) {
      cleanItem.createdAt = new Date().toISOString();
    }

    let list: KegiatanOrgItem[] = [];
    try {
      list = safeStorageGet<KegiatanOrgItem[]>('hw_kwarda_ptma_kegiatan', []);
    } catch {}
    const existingIndex = list.findIndex(p => p.id === cleanItem.id);
    if (existingIndex >= 0) {
      list[existingIndex] = cleanItem;
    } else {
      list.push(cleanItem);
    }
    safeStorageSet('hw_kwarda_ptma_kegiatan', JSON.stringify(list));
    window.dispatchEvent(new Event('kwarda_ptma_updated'));

    try {
      await withTimeout(setDoc(doc(db, 'kwarda_ptma_kegiatan', cleanItem.id), cleanData(cleanItem), { merge: true }), 6000);
    } catch (err) {
      console.warn('[FIRESTORE] Save kegiatan cached locally:', err);
    }

    return cleanItem;
  },

  async deleteKegiatan(id: string, orgCode: string): Promise<boolean> {
    let list: KegiatanOrgItem[] = [];
    try {
      list = safeStorageGet<KegiatanOrgItem[]>('hw_kwarda_ptma_kegiatan', []);
    } catch {}
    list = list.filter(item => item.id !== id);
    safeStorageSet('hw_kwarda_ptma_kegiatan', JSON.stringify(list));
    window.dispatchEvent(new Event('kwarda_ptma_updated'));

    try {
      await withTimeout(deleteDoc(doc(db, 'kwarda_ptma_kegiatan', id)), 6000);
    } catch (err) {
      console.warn('[FIRESTORE] Delete kegiatan cached locally:', err);
    }

    return true;
  },

  // ---------------------------------------------------------------------------
  // MATERI KWARDA / PTMA
  // ---------------------------------------------------------------------------
  async getAllMateri(): Promise<MateriOrgItem[]> {
    let localData: MateriOrgItem[] = [];
    try {
      const raw = safeStorageGet<MateriOrgItem[]>('hw_kwarda_ptma_materi', []);
      if (raw && Array.isArray(raw)) localData = raw;
    } catch {}

    if (!localData || localData.length === 0) {
      localData = [...INITIAL_SEED_MATERI];
      safeStorageSet('hw_kwarda_ptma_materi', JSON.stringify(localData));
    }

    try {
      const snap = await withTimeout(getDocs(collection(db, 'kwarda_ptma_materi')), 4000);
      if (!snap.empty) {
        const firestoreList = snap.docs.map(d => ({ id: d.id, ...d.data() } as MateriOrgItem));
        const mergedMap = new Map<string, MateriOrgItem>();
        localData.forEach(p => mergedMap.set(p.id, p));
        firestoreList.forEach(p => mergedMap.set(p.id, p));
        localData = Array.from(mergedMap.values());
        safeStorageSet('hw_kwarda_ptma_materi', JSON.stringify(localData));
      }
    } catch (err) {
      console.warn('[FIRESTORE] Using local storage for all materi:', err);
    }

    return localData.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  },

  async getMateriByOrg(orgCode: string): Promise<MateriOrgItem[]> {
    const normCode = orgCode.trim().padStart(2, '0');
    let localData: MateriOrgItem[] = [];
    try {
      const raw = safeStorageGet<MateriOrgItem[]>('hw_kwarda_ptma_materi', []);
      if (raw && Array.isArray(raw)) localData = raw;
    } catch {}

    if (!localData || localData.length === 0) {
      localData = [...INITIAL_SEED_MATERI];
      safeStorageSet('hw_kwarda_ptma_materi', JSON.stringify(localData));
    }

    try {
      const snap = await withTimeout(getDocs(collection(db, 'kwarda_ptma_materi')), 4000);
      if (!snap.empty) {
        const firestoreList = snap.docs.map(d => ({ id: d.id, ...d.data() } as MateriOrgItem));
        const mergedMap = new Map<string, MateriOrgItem>();
        localData.forEach(p => mergedMap.set(p.id, p));
        firestoreList.forEach(p => mergedMap.set(p.id, p));
        localData = Array.from(mergedMap.values());
        safeStorageSet('hw_kwarda_ptma_materi', JSON.stringify(localData));
      }
    } catch (err) {
      console.warn('[FIRESTORE] Using local storage for materi:', err);
    }

    return localData
      .filter(item => (item.orgCode || '').padStart(2, '0') === normCode)
      .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  },

  async addOrUpdateMateri(item: MateriOrgItem): Promise<MateriOrgItem> {
    const cleanItem: MateriOrgItem = {
      ...item,
      id: item.id || `mat-${item.orgCode}-${Date.now()}`,
      orgCode: item.orgCode.padStart(2, '0'),
      updatedAt: new Date().toISOString()
    };
    if (!cleanItem.createdAt) {
      cleanItem.createdAt = new Date().toISOString();
    }

    let list: MateriOrgItem[] = [];
    try {
      list = safeStorageGet<MateriOrgItem[]>('hw_kwarda_ptma_materi', []);
    } catch {}
    const existingIndex = list.findIndex(p => p.id === cleanItem.id);
    if (existingIndex >= 0) {
      list[existingIndex] = cleanItem;
    } else {
      list.push(cleanItem);
    }
    safeStorageSet('hw_kwarda_ptma_materi', JSON.stringify(list));
    window.dispatchEvent(new Event('kwarda_ptma_updated'));

    try {
      await withTimeout(setDoc(doc(db, 'kwarda_ptma_materi', cleanItem.id), cleanData(cleanItem), { merge: true }), 6000);
    } catch (err) {
      console.warn('[FIRESTORE] Save materi cached locally:', err);
    }

    return cleanItem;
  },

  async deleteMateri(id: string, orgCode: string): Promise<boolean> {
    let list: MateriOrgItem[] = [];
    try {
      list = safeStorageGet<MateriOrgItem[]>('hw_kwarda_ptma_materi', []);
    } catch {}
    list = list.filter(item => item.id !== id);
    safeStorageSet('hw_kwarda_ptma_materi', JSON.stringify(list));
    window.dispatchEvent(new Event('kwarda_ptma_updated'));

    try {
      await withTimeout(deleteDoc(doc(db, 'kwarda_ptma_materi', id)), 6000);
    } catch (err) {
      console.warn('[FIRESTORE] Delete materi cached locally:', err);
    }

    return true;
  },

  // ---------------------------------------------------------------------------
  // SUMMARY METRICS & MONITORING
  // ---------------------------------------------------------------------------
  async getAllSummaryStats(): Promise<{
    totalKwarda: number;
    totalQabilahPtma: number;
    totalQabilahCount: number;
    totalAnggotaCount: number;
    totalPengurusCount: number;
    totalDewanSugliCount: number;
    totalKegiatanCount: number;
    totalMateriCount: number;
    items: KwardaPtmaSummaryItem[];
  }> {
    const masterList = getKwardaPtmaMasterList();

    // Read all cached lists
    let pengurusList: PengurusOrgItem[] = [];
    let sugliList: DewanSugliOrgItem[] = [];
    let qabilahList: QabilahOrgItem[] = [];
    let kegiatanList: KegiatanOrgItem[] = [];
    let materiList: MateriOrgItem[] = [];

    try {
      pengurusList = safeStorageGet<PengurusOrgItem[]>('hw_kwarda_ptma_pengurus', []);
      if (!pengurusList || pengurusList.length === 0) {
        pengurusList = [...INITIAL_SEED_PENGURUS];
      }
    } catch {
      pengurusList = [...INITIAL_SEED_PENGURUS];
    }

    try {
      sugliList = safeStorageGet<DewanSugliOrgItem[]>('hw_kwarda_ptma_sugli', []);
      if (!sugliList || sugliList.length === 0) {
        sugliList = [...INITIAL_SEED_SUGLI];
      }
    } catch {
      sugliList = [...INITIAL_SEED_SUGLI];
    }

    try {
      qabilahList = safeStorageGet<QabilahOrgItem[]>('hw_kwarda_ptma_qabilah', []);
      if (!qabilahList || qabilahList.length === 0) {
        qabilahList = [...INITIAL_SEED_QABILAH];
      }
    } catch {
      qabilahList = [...INITIAL_SEED_QABILAH];
    }

    try {
      kegiatanList = safeStorageGet<KegiatanOrgItem[]>('hw_kwarda_ptma_kegiatan', []);
      if (!kegiatanList || kegiatanList.length === 0) {
        kegiatanList = [...INITIAL_SEED_KEGIATAN];
      }
    } catch {
      kegiatanList = [...INITIAL_SEED_KEGIATAN];
    }

    try {
      materiList = safeStorageGet<MateriOrgItem[]>('hw_kwarda_ptma_materi', []);
      if (!materiList || materiList.length === 0) {
        materiList = [...INITIAL_SEED_MATERI];
      }
    } catch {
      materiList = [...INITIAL_SEED_MATERI];
    }

    // Build map for each org
    const pengurusMap = new Map<string, number>();
    pengurusList.forEach(p => {
      const code = (p.orgCode || '').padStart(2, '0');
      pengurusMap.set(code, (pengurusMap.get(code) || 0) + 1);
    });

    const sugliMap = new Map<string, number>();
    sugliList.forEach(s => {
      const code = (s.orgCode || '').padStart(2, '0');
      sugliMap.set(code, (sugliMap.get(code) || 0) + 1);
    });

    const qabilahCountMap = new Map<string, number>();
    const qabilahAnggotaMap = new Map<string, number>();
    qabilahList.forEach(q => {
      const code = (q.orgCode || '').padStart(2, '0');
      qabilahCountMap.set(code, (qabilahCountMap.get(code) || 0) + 1);
      qabilahAnggotaMap.set(code, (qabilahAnggotaMap.get(code) || 0) + (Number(q.jumlahAnggota) || 0));
    });

    const kegiatanMap = new Map<string, number>();
    kegiatanList.forEach(k => {
      const code = (k.orgCode || '').padStart(2, '0');
      kegiatanMap.set(code, (kegiatanMap.get(code) || 0) + 1);
    });

    const materiMap = new Map<string, number>();
    materiList.forEach(m => {
      const code = (m.orgCode || '').padStart(2, '0');
      materiMap.set(code, (materiMap.get(code) || 0) + 1);
    });

    let totalQabilahCount = 0;
    let totalAnggotaCount = 0;
    let totalPengurusCount = 0;
    let totalDewanSugliCount = 0;
    let totalKegiatanCount = 0;
    let totalMateriCount = 0;

    const items: KwardaPtmaSummaryItem[] = masterList.map(entity => {
      const code = entity.code;
      const tQabilah = entity.type === 'Kwarda' ? (qabilahCountMap.get(code) || 0) : 0;
      const tAnggota = entity.type === 'Kwarda' ? (qabilahAnggotaMap.get(code) || 0) : 0;
      const tPengurus = pengurusMap.get(code) || 0;
      const tSugli = sugliMap.get(code) || 0;
      const tKegiatan = kegiatanMap.get(code) || 0;
      const tMateri = materiMap.get(code) || 0;

      totalQabilahCount += tQabilah;
      totalAnggotaCount += tAnggota;
      totalPengurusCount += tPengurus;
      totalDewanSugliCount += tSugli;
      totalKegiatanCount += tKegiatan;
      totalMateriCount += tMateri;

      return {
        code: entity.code,
        name: entity.name,
        type: entity.type,
        ktaCode: entity.ktaCode,
        order: entity.order,
        totalQabilah: tQabilah,
        totalAnggota: tAnggota,
        totalPengurus: tPengurus,
        totalDewanSugli: tSugli,
        totalKegiatan: tKegiatan,
        totalMateri: tMateri
      };
    });

    return {
      totalKwarda: 35,
      totalQabilahPtma: 23,
      totalQabilahCount,
      totalAnggotaCount,
      totalPengurusCount,
      totalDewanSugliCount,
      totalKegiatanCount,
      totalMateriCount,
      items
    };
  }
};

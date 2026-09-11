import { User, UserRole } from '../types';
import { INITIAL_SPREADSHEET_DATA } from './initialSpreadsheetData';
import { toProperName } from '../utils/nameUtils';
import { parseRolesField } from './firestoreService';
import { syncRolesAndPelatihan } from '../utils/trainingUtils';
import { csvPart1 } from './kta_csv_part1';
import { csvPart2 } from './kta_csv_part2';
import { csvPart3 } from './kta_csv_part3';
import { csvPart4 } from './kta_csv_part4';
import { csvPart5 } from './kta_csv_part5';
import { csvPart6 } from './kta_csv_part6';
import trainingData from './initialData/training.json';
import { 
  getKwardaCode, 
  parseKtaNumber, 
  isValidKtaNumberFormat, 
  formatKtaNumber, 
  findNextAvailableNumber,
  ensureUniqueKtaNumbers
} from '../utils/ktaUtils';

const parseCsvPart = (csv: string): User[] => {
  const list: User[] = [];
  if (!csv) return list;
  const lines = csv.trim().split('\n').filter(l => l.trim().length > 0);
  lines.forEach((line) => {
    const p = line.split(';').map(s => s.trim());
    if (p.length >= 10) {
      const idx = p[0];
      const ktaNum = p[1] || '';
      const name = p[2] || '';
      const nbm = p[3] || '';
      const jk = p[4] === 'P' ? 'P' : 'L';
      const tmptLahir = p[5] || '';
      const tglLahir = p[6] || '';
      const golDarah = p[7] || '';
      const agama = p[8] || 'Islam';
      const alamat = p[9] || '';
      const email = (p[10] && p[10] !== '-') ? p[10].toLowerCase() : '';
      const noHp = (p[11] && p[11] !== '-') ? p[11] : '';
      const kwarda = (p[12] && p[12] !== '-') ? p[12] : '';
      const tingkatan = p[13] || 'Dewasa';
      const status = p[14] || 'Aktif';

      if (name && name !== 'Tanpa Nama' && name !== '-') {
        const cleanKta = ktaNum.trim();
        const docId = cleanKta 
          ? `user-kta-${cleanKta.replace(/[^a-zA-Z0-9]/g, '_')}`
          : (email ? `user-${email.replace(/[^a-zA-Z0-9]/g, '_')}` : `user-csv-${idx}`);

        list.push({
          id: docId,
          email: email || `member_${idx}_${cleanKta.replace(/[^a-zA-Z0-9]/g, '')}@hw.or.id`,
          password: '12345hw',
          namaLengkap: toProperName(name) || name,
          jenisKelamin: jk,
          tempatLahir: tmptLahir || '',
          tanggalLahir: tglLahir || '',
          alamat: alamat || '',
          noHp: noHp || '',
          asalKwarda: kwarda || '',
          qabilah: '',
          pendidikan: '',
          sosmed: '',
          pelatihan: [],
          golongan: tingkatan.replace(/Pandu\s*/g, '').trim() || 'Dewasa',
          ktaNumber: cleanKta,
          nomorKTA: cleanKta,
          isVerified: true,
          role: 'umum',
          roles: ['umum'],
          activeRole: 'umum',
          status: status
        });
      }
    }
  });
  return list;
};

let cachedMasterList: User[] | null = null;

export const getMasterMembersList = (): User[] => {
  if (cachedMasterList && cachedMasterList.length > 0) {
    return cachedMasterList;
  }

  const csvMembers = [
    ...parseCsvPart(csvPart1),
    ...parseCsvPart(csvPart2),
    ...parseCsvPart(csvPart3),
    ...parseCsvPart(csvPart4),
    ...parseCsvPart(csvPart5),
    ...parseCsvPart(csvPart6),
  ];

  const rawCandidates: User[] = [];

  // 1. Initial spreadsheet users (mark registrants without official KTA as pending)
  (INITIAL_SPREADSHEET_DATA.users || []).forEach((u: any, idx: number) => {
    if (!u) return;
    const rawRoles = parseRolesField(u.roles, u.role);
    const synced = syncRolesAndPelatihan(rawRoles, u.pelatihan || []);
    const emailNorm = (u.email || '').toString().toLowerCase().trim();
    const isSysAdmin = emailNorm === 'admin@hwjateng.com' || emailNorm === 'medkom@hwjateng.com' || emailNorm === 'diklat@hwjateng.com';

    rawCandidates.push({
      ...u,
      id: String(u.id || `user-init-${idx}`),
      namaLengkap: toProperName(u.namaLengkap || u.nama) || 'Anggota HW',
      role: (synced.primaryRole || 'umum') as UserRole,
      roles: (synced.roles && synced.roles.length > 0 ? synced.roles : ['umum']) as UserRole[],
      pelatihan: synced.pelatihan,
      isVerified: isSysAdmin ? true : Boolean(u.isVerified || u.ktaNumber || u.nomorKTA),
      status: isSysAdmin ? 'approved' : (u.status || (u.ktaNumber || u.nomorKTA ? 'approved' : 'pending')),
      statusKta: isSysAdmin ? 'approved' : (u.statusKta || (u.ktaNumber || u.nomorKTA ? 'approved' : 'pending')),
      statusPembayaran: isSysAdmin ? 'Lunas' : (u.statusPembayaran || (u.isVerified ? 'Lunas' : 'Belum Bayar')),
      statusAktivasi: isSysAdmin ? 'Aktif' : (u.statusAktivasi || (u.isVerified ? 'Aktif' : 'Belum Aktif')),
      ktaNumber: u.ktaNumber || u.nomorKTA || '',
      nomorKTA: u.nomorKTA || u.ktaNumber || '',
      tanggalAjuan: u.createdAt || u.tanggalDaftar || u.tanggal || new Date().toISOString()
    });
  });

  // 2. Training data participants with official KTA numbers (e.g., Reza Putra Bachtiar, Rizqi Qurniyawati)
  if (Array.isArray(trainingData)) {
    (trainingData as any[]).forEach((t, idx) => {
      if (!t) return;
      const tName = toProperName(t.namaLengkap || t.nama) || '';
      if (!tName || tName === '-' || tName === 'Tanpa Nama') return;
      const tKta = (t.nomorKTA || t.ktaNumber || '').trim();
      const tEmail = (t.email || '').trim().toLowerCase();
      const isOfficial = isValidKtaNumberFormat(tKta);
      const initialPelatihan = t.pelatihanAkanDiikuti ? [t.pelatihanAkanDiikuti] : (t.namaKegiatan ? [t.namaKegiatan] : []);
      const synced = syncRolesAndPelatihan(
        [t.tingkatan, t.jenisPelatihan, t.pelatihanAkanDiikuti, t.namaKegiatan, 'umum'],
        initialPelatihan
      );

      rawCandidates.push({
        id: t.id ? String(t.id) : (tKta ? `user-train-${tKta.replace(/[^a-zA-Z0-9]/g, '_')}` : `user-train-${idx}`),
        email: tEmail || (tKta ? `participant_${tKta.replace(/[^a-zA-Z0-9]/g, '')}@hw.or.id` : `participant_${idx}@hw.or.id`),
        password: '12345hw',
        namaLengkap: tName,
        jenisKelamin: (t.jenisKelamin === 'P' || t.jenisKelamin === 'Perempuan') ? 'P' : 'L',
        tempatLahir: t.tempatLahir || '',
        tanggalLahir: t.tanggalLahir || '',
        alamat: t.alamat || '',
        noHp: t.noWa || t.noHp || '',
        asalKwarda: t.asalDaerah || t.asalKwarda || '',
        qabilah: t.qabilah || '',
        pendidikan: t.pendidikanTerakhir || t.pendidikan || '',
        sosmed: '',
        pelatihan: synced.pelatihan,
        golongan: t.tingkatan || (synced.primaryRole !== 'umum' ? 'Pelatih' : 'Dewasa'),
        ktaNumber: tKta,
        nomorKTA: tKta,
        nbm: t.nbm || '',
        isVerified: isOfficial ? true : Boolean(t.isVerified),
        role: synced.primaryRole as UserRole,
        roles: synced.roles as UserRole[],
        activeRole: synced.primaryRole as UserRole,
        status: isOfficial ? 'approved' : (t.status || 'approved'),
        statusKta: isOfficial ? 'approved' : (t.statusKta || 'approved'),
        statusAktivasi: isOfficial ? 'Aktif' : 'Belum Aktif',
        statusPembayaran: isOfficial ? 'Lunas' : 'Belum Bayar',
        tanggalAjuan: t.tanggalPendaftaran || t.createdAt || new Date().toISOString()
      });
    });
  }

  // 2. CSV members with official issued KTAs
  csvMembers.forEach(c => {
    c.isVerified = true;
    c.status = 'approved';
    c.statusKta = 'approved';
    c.statusAktivasi = 'Aktif';
    c.statusPembayaran = 'Lunas';
  });
  rawCandidates.push(...csvMembers);

  // 3. Ensure Bayu Ghifari Javalino
  rawCandidates.push({
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
    asalKwarda: "Kabupaten Banyumas",
    qabilah: "Sudirman",
    alamat: "Purwokerto, Banyumas",
    isVerified: true,
    sosmed: "@bayughifari",
    noHp: "081234567890",
    upgradeRequests: []
  });

  // 4. Ensure Admin Diklat
  rawCandidates.push({
    id: "admin-diklat-1",
    email: "diklat@hwjateng.com",
    password: "didiklatjtg",
    namaLengkap: "Admin Diklat HW",
    role: "admin",
    roles: ["admin", "diklat"],
    activeRole: "admin",
    adminType: "diklat",
    jenisKelamin: "L",
    golongan: "Pembina",
    pendidikan: "S1",
    pelatihan: ["Jati 3"],
    asalKwarda: "Pusdiklat",
    qabilah: "Diklat HW Jateng",
    alamat: "Pusdiklat HW Jateng",
    isVerified: true,
    sosmed: "@diklathwjateng",
    noHp: "081234567890",
    upgradeRequests: []
  });

  // 5. Ensure Core Trainers & Leaders with their verified roles and training qualifications
  rawCandidates.push({
    id: "trainer-muhammad-dzikron",
    email: "muhammaddzikron@gmail.com",
    password: "12345hw",
    namaLengkap: "Muhammad Dzikron",
    role: "superadmin",
    roles: ["superadmin", "admin", "kwarda", "sugli", "jari1", "jari2", "jati1", "jati2", "pelatih", "umum"],
    activeRole: "superadmin",
    jenisKelamin: "L",
    golongan: "Pelatih",
    pendidikan: "S1",
    pelatihan: ["Jati 1", "Jati 2", "Jari 1", "Jari 2", "Jawi", "Dewan Sugli", "Kwarda"],
    asalKwarda: "Kabupaten Klaten",
    qabilah: "Qabilah SMK Muhammadiyah 1 Magelang",
    alamat: "Jl. Ahmad Dahlan No. 24, Magelang, Jawa Tengah",
    ktaNumber: "11.14.0001",
    nomorKTA: "11.14.0001",
    nbm: "11.14.0001",
    isVerified: true,
    status: "approved",
    statusKta: "approved",
    statusAktivasi: "Aktif",
    statusPembayaran: "Lunas",
    sosmed: "",
    noHp: "081226854000",
    upgradeRequests: []
  });

  rawCandidates.push({
    id: "trainer-eni-winarti",
    email: "eniwinarti1620@gmail.com",
    password: "12345hw",
    namaLengkap: "Eni Winarti",
    role: "jari2",
    roles: ["kwarda", "sugli", "jari1", "jari2", "jati1", "jati2", "pelatih", "umum"],
    activeRole: "jari2",
    jenisKelamin: "P",
    golongan: "Pelatih",
    pendidikan: "S1",
    pelatihan: ["Jati 1", "Jati 2", "Jari 1", "Jari 2", "Kwarda"],
    asalKwarda: "Kabupaten Pati",
    qabilah: "Qabilah SMA Muhammadiyah 1 Pati",
    alamat: "Jl. Ahmad Dahlan No. 27, Pati, Jawa Tengah",
    isVerified: true,
    status: "approved",
    statusKta: "approved",
    statusAktivasi: "Aktif",
    statusPembayaran: "Lunas",
    sosmed: "",
    noHp: "",
    upgradeRequests: []
  });

  rawCandidates.push({
    id: "trainer-dwi-suparwanto",
    email: "dwisuparwanto1@gmail.com",
    password: "12345hw",
    namaLengkap: "Dwi Suparwanto",
    role: "jari2",
    roles: ["kwarda", "sugli", "jari1", "jari2", "jati1", "jati2", "pelatih", "umum"],
    activeRole: "jari2",
    jenisKelamin: "L",
    golongan: "Pelatih",
    pendidikan: "S1",
    pelatihan: ["Jati 1", "Jati 2", "Jari 1", "Jari 2", "Kwarda"],
    asalKwarda: "Kabupaten Blora",
    qabilah: "Qabilah MTs Muhammadiyah 1 Blora",
    alamat: "Jl. Ahmad Dahlan No. 14, Blora, Jawa Tengah",
    isVerified: true,
    status: "approved",
    statusKta: "approved",
    statusAktivasi: "Aktif",
    statusPembayaran: "Lunas",
    sosmed: "",
    noHp: "",
    upgradeRequests: []
  });

  rawCandidates.push({
    id: "trainer-agus-dwi-setiawan",
    email: "setiawan559@gmail.com",
    password: "12345hw",
    namaLengkap: "Agus Dwi Setiawan",
    role: "jari1",
    roles: ["kwarda", "sugli", "jari1", "jari2", "jati1", "jati2", "pelatih", "umum"],
    activeRole: "jari1",
    jenisKelamin: "L",
    golongan: "Pelatih",
    pendidikan: "S1",
    pelatihan: ["Jati 1", "Jati 2", "Jari 1", "Kwarda"],
    asalKwarda: "Kota Surakarta",
    qabilah: "Qabilah Surakarta",
    alamat: "Jl. Gambir Anom No.4 Kemlayan, Serengan Surakarta",
    ktaNumber: "11.34.0001",
    nomorKTA: "11.34.0001",
    nbm: "11.34.0001",
    isVerified: true,
    status: "approved",
    statusKta: "approved",
    statusAktivasi: "Aktif",
    statusPembayaran: "Lunas",
    sosmed: "",
    noHp: "089673125334",
    upgradeRequests: []
  });

  rawCandidates.push({
    id: "trainer-puryadi",
    email: "mr.adi19@gmail.com",
    password: "12345hw",
    namaLengkap: "Puryadi",
    role: "jari1",
    roles: ["kwarda", "sugli", "jari1", "jari2", "jati1", "jati2", "pelatih", "umum"],
    activeRole: "jari1",
    jenisKelamin: "L",
    golongan: "Pelatih",
    pendidikan: "S1",
    pelatihan: ["Jati 1", "Jati 2", "Jari 1", "Kwarda"],
    asalKwarda: "Kabupaten Kendal",
    qabilah: "Qabilah SD Muhammadiyah 1 Kendal",
    alamat: "Jl. Ahmad Dahlan No. 23, Kendal, Jawa Tengah",
    isVerified: true,
    status: "approved",
    statusKta: "approved",
    statusAktivasi: "Aktif",
    statusPembayaran: "Lunas",
    sosmed: "",
    noHp: "",
    upgradeRequests: []
  });

  rawCandidates.push({
    id: "trainer-retiana-maharani",
    email: "retianamaharani00@gmail.com",
    password: "12345hw",
    namaLengkap: "Retiana Maharani",
    role: "jati2",
    roles: ["kwarda", "sugli", "jati1", "jati2", "pelatih", "umum"],
    activeRole: "jati2",
    jenisKelamin: "P",
    golongan: "Pelatih",
    pendidikan: "S1",
    pelatihan: ["Jati 1", "Jati 2", "Kwarda"],
    asalKwarda: "Kabupaten Kebumen",
    qabilah: "Qabilah Kebumen",
    alamat: "DK. Kepudang Kec. Sempor Kab. Kebumen",
    ktaNumber: "11.12.0001",
    nomorKTA: "11.12.0001",
    nbm: "11.12.0001",
    isVerified: true,
    status: "approved",
    statusKta: "approved",
    statusAktivasi: "Aktif",
    statusPembayaran: "Lunas",
    sosmed: "@retianamaharani",
    noHp: "085163020105",
    upgradeRequests: []
  });

  rawCandidates.push({
    id: "trainer-wahyu-dewayanto",
    email: "dewafki3@gmail.com",
    password: "12345hw",
    namaLengkap: "M Wahyu Dewayanto",
    role: "jari1",
    roles: ["kwarda", "sugli", "jati1", "jati2", "jari1", "pelatih", "umum"],
    activeRole: "jari1",
    jenisKelamin: "L",
    golongan: "Pelatih",
    pendidikan: "S1",
    pelatihan: ["Jati 1", "Jati 2", "Jari 1", "Jawi"],
    asalKwarda: "Kabupaten Klaten",
    qabilah: "Klaten",
    alamat: "Klaten, Jawa Tengah",
    ktaNumber: "11.24.0001",
    nomorKTA: "11.24.0001",
    nbm: "11.24.0001",
    isVerified: true,
    status: "approved",
    statusKta: "approved",
    statusAktivasi: "Aktif",
    statusPembayaran: "Lunas",
    sosmed: "",
    noHp: "081234567890",
    upgradeRequests: []
  });

  const mergedMap = new Map<string, User>();
  const emailToKey = new Map<string, string>();
  const ktaToKey = new Map<string, string>();
  const idToKey = new Map<string, string>();
  const nameKwardaToKey = new Map<string, string>();
  const namePhoneToKey = new Map<string, string>();

  rawCandidates.forEach((item, index) => {
    const email = (item.email || '').trim().toLowerCase();
    const isRealEmail = email && !email.startsWith('member_') && !email.startsWith('user_') && email.includes('@');
    const kta = (item.ktaNumber || item.nomorKTA || '').trim().toLowerCase();
    const normName = (item.namaLengkap || '').trim().toLowerCase();
    const isRealName = normName && normName.length >= 3 && normName !== 'anggota hw' && normName !== 'tanpa nama';
    const kwarda = (item.asalKwarda || '').trim().toLowerCase();
    const phone = item.noHp ? String(item.noHp).replace(/[^0-9]/g, '') : '';
    const rawId = item.id ? String(item.id).trim() : '';
    const isRealId = rawId && !rawId.startsWith('user-cand-') && !rawId.startsWith('user-init-') && !rawId.startsWith('user-csv-');

    let matchKey: string | undefined;
    if (isRealId && idToKey.has(rawId)) {
      matchKey = idToKey.get(rawId);
    } else if (isRealEmail && emailToKey.has(email)) {
      matchKey = emailToKey.get(email);
    } else if (kta && ktaToKey.has(kta)) {
      matchKey = ktaToKey.get(kta);
    } else if (isRealName) {
      if (phone && phone.length >= 8 && namePhoneToKey.has(`${normName}:::${phone}`)) {
        matchKey = namePhoneToKey.get(`${normName}:::${phone}`);
      } else if (kwarda && kwarda !== '-' && nameKwardaToKey.has(`${normName}:::${kwarda}`)) {
        matchKey = nameKwardaToKey.get(`${normName}:::${kwarda}`);
      }
    }

    if (matchKey && mergedMap.has(matchKey)) {
      const ex = mergedMap.get(matchKey)!;
      const isVerified = ex.isVerified === true || item.isVerified === true;
      const status = isVerified ? 'approved' : 'pending';

      const combinedRoles = parseRolesField(
        [...(Array.isArray(ex.roles) ? ex.roles : [ex.role]), ...(Array.isArray(item.roles) ? item.roles : [item.role])],
        ex.role || item.role
      );
      const combinedPelatihan = [
        ...(Array.isArray(ex.pelatihan) ? ex.pelatihan : []),
        ...(Array.isArray(item.pelatihan) ? item.pelatihan : [])
      ];
      const synced = syncRolesAndPelatihan(combinedRoles, combinedPelatihan);

      const merged: User = {
        ...item,
        ...ex,
        id: ex.id || item.id,
        role: synced.primaryRole as UserRole,
        roles: synced.roles as UserRole[],
        activeRole: synced.primaryRole as UserRole,
        pelatihan: synced.pelatihan,
        golongan: (ex.golongan && ex.golongan !== 'Dewasa') ? ex.golongan : (item.golongan || (synced.primaryRole !== 'umum' ? 'Pelatih' : 'Dewasa')),
        ktaNumber: ex.ktaNumber || item.ktaNumber || ex.nomorKTA || item.nomorKTA,
        nomorKTA: ex.nomorKTA || item.nomorKTA || ex.ktaNumber || item.ktaNumber,
        noHp: ex.noHp || item.noHp,
        alamat: ex.alamat || item.alamat,
        asalKwarda: ex.asalKwarda || item.asalKwarda,
        qabilah: ex.qabilah || item.qabilah,
        tempatLahir: ex.tempatLahir || item.tempatLahir,
        tanggalLahir: ex.tanggalLahir || item.tanggalLahir,
        email: (ex.email && !ex.email.startsWith('member_') && !ex.email.startsWith('user_')) ? ex.email : item.email,
        isVerified,
        status: status as any,
        statusKta: status as any,
        statusAktivasi: isVerified ? 'Aktif' : 'Belum Aktif',
        statusPembayaran: isVerified ? 'Lunas' : (ex.statusPembayaran || item.statusPembayaran || 'Belum Bayar')
      };
      mergedMap.set(matchKey, merged);
    } else {
      const newKey = item.id || `user-cand-${index}`;
      mergedMap.set(newKey, { ...item });
      if (isRealId) idToKey.set(rawId, newKey);
      if (isRealEmail) emailToKey.set(email, newKey);
      if (kta) ktaToKey.set(kta, newKey);
      if (isRealName) {
        if (phone && phone.length >= 8) namePhoneToKey.set(`${normName}:::${phone}`, newKey);
        if (kwarda && kwarda !== '-') nameKwardaToKey.set(`${normName}:::${kwarda}`, newKey);
      }
    }
  });

  const mergedList = Array.from(mergedMap.values());

  // Apply administrative overrides if present in localStorage
  try {
    if (typeof localStorage !== 'undefined') {
      const overridesRaw = localStorage.getItem('member_custom_edits');
      if (overridesRaw) {
        const overrides = JSON.parse(overridesRaw);
        mergedList.forEach(m => {
          const edit = (m.id && overrides[m.id]) ||
                       (m.email && overrides[m.email.toLowerCase().trim()]) ||
                       (m.ktaNumber && overrides[m.ktaNumber.trim()]) ||
                       (m.nomorKTA && overrides[m.nomorKTA.trim()]);
          if (edit) {
            Object.assign(m, edit);
          }
        });
      }
    }
  } catch (e) {}

  cachedMasterList = ensureUniqueKtaNumbers(mergedList);
  return cachedMasterList;
};


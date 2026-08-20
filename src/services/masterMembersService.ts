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

  // 1. Initial spreadsheet users
  (INITIAL_SPREADSHEET_DATA.users || []).forEach((u: any, idx: number) => {
    if (!u) return;
    const rawRoles = parseRolesField(u.roles, u.role);
    const synced = syncRolesAndPelatihan(rawRoles, u.pelatihan || []);

    rawCandidates.push({
      ...u,
      id: String(u.id || `user-init-${idx}`),
      namaLengkap: toProperName(u.namaLengkap || u.nama) || 'Anggota HW',
      role: (synced.primaryRole || 'umum') as UserRole,
      roles: (synced.roles && synced.roles.length > 0 ? synced.roles : ['umum']) as UserRole[],
      pelatihan: synced.pelatihan,
      isVerified: u.isVerified === true || u.isVerified === 'TRUE' || u.isVerified === 'true'
    });
  });

  // 2. CSV members
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
      const merged: User = {
        ...item,
        ...ex,
        id: ex.id || item.id,
        ktaNumber: ex.ktaNumber || item.ktaNumber || ex.nomorKTA || item.nomorKTA,
        nomorKTA: ex.nomorKTA || item.nomorKTA || ex.ktaNumber || item.ktaNumber,
        noHp: ex.noHp || item.noHp,
        alamat: ex.alamat || item.alamat,
        asalKwarda: ex.asalKwarda || item.asalKwarda,
        qabilah: ex.qabilah || item.qabilah,
        tempatLahir: ex.tempatLahir || item.tempatLahir,
        tanggalLahir: ex.tanggalLahir || item.tanggalLahir,
        email: (ex.email && !ex.email.startsWith('member_') && !ex.email.startsWith('user_')) ? ex.email : item.email
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
  cachedMasterList = ensureUniqueKtaNumbers(mergedList);
  return cachedMasterList;
};


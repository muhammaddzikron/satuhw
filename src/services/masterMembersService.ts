import { User, UserRole } from '../types';
import { INITIAL_SPREADSHEET_DATA } from './initialSpreadsheetData';
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
  findNextAvailableNumber 
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
      const nik = p[3] || '';
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
          namaLengkap: name,
          nik: nik || '',
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

export const getMasterMembersList = (): User[] => {
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
    let parsedRole: UserRole = 'umum';
    if (typeof u.role === 'string' && u.role.startsWith('[')) {
      try {
        const rolesArr = JSON.parse(u.role);
        parsedRole = (rolesArr[0] as UserRole) || 'umum';
      } catch (e) {}
    } else if (u.role) {
      parsedRole = u.role as UserRole;
    }

    let parsedRoles: UserRole[] = ['umum'];
    if (Array.isArray(u.roles)) {
      parsedRoles = u.roles;
    } else if (typeof u.role === 'string' && u.role.startsWith('[')) {
      try {
        parsedRoles = JSON.parse(u.role);
      } catch (e) {}
    } else if (u.role) {
      parsedRoles = [u.role as UserRole];
    }

    rawCandidates.push({
      ...u,
      id: String(u.id || `user-init-${idx}`),
      namaLengkap: u.namaLengkap || u.nama || 'Anggota HW',
      role: parsedRole,
      roles: parsedRoles,
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

  const mergedList: User[] = [];

  const findExistingIndex = (item: User) => {
    const email = (item.email || '').trim().toLowerCase();
    const isRealEmail = email && !email.startsWith('member_') && !email.startsWith('user_');
    const nik = (item.nik || '').trim();
    const isRealNik = nik && nik.length >= 10 && nik !== '-';
    const kta = (item.ktaNumber || item.nomorKTA || '').trim().toLowerCase();
    const normName = (item.namaLengkap || '').trim().toLowerCase();
    const isRealName = normName && normName.length >= 3 && normName !== 'anggota hw' && normName !== 'tanpa nama';

    for (let i = 0; i < mergedList.length; i++) {
      const ex = mergedList[i];
      const exEmail = (ex.email || '').trim().toLowerCase();
      const exIsRealEmail = exEmail && !exEmail.startsWith('member_') && !exEmail.startsWith('user_');
      const exNik = (ex.nik || '').trim();
      const exIsRealNik = exNik && exNik.length >= 10 && exNik !== '-';
      const exKta = (ex.ktaNumber || ex.nomorKTA || '').trim().toLowerCase();
      const exNormName = (ex.namaLengkap || '').trim().toLowerCase();

      if (isRealEmail && exIsRealEmail && email === exEmail) return i;
      if (isRealNik && exIsRealNik && nik === exNik) return i;
      if (kta && exKta && kta === exKta) return i;
      if (isRealName && normName === exNormName) return i;
    }
    return -1;
  };

  rawCandidates.forEach((item) => {
    const idx = findExistingIndex(item);
    if (idx === -1) {
      mergedList.push({ ...item });
    } else {
      const ex = mergedList[idx];
      const merged: User = {
        ...item,
        ...ex,
        id: ex.id || item.id,
        ktaNumber: ex.ktaNumber || item.ktaNumber || ex.nomorKTA || item.nomorKTA,
        nomorKTA: ex.nomorKTA || item.nomorKTA || ex.ktaNumber || item.ktaNumber,
        nik: ex.nik || item.nik,
        noHp: ex.noHp || item.noHp,
        alamat: ex.alamat || item.alamat,
        asalKwarda: ex.asalKwarda || item.asalKwarda,
        qabilah: ex.qabilah || item.qabilah,
        tempatLahir: ex.tempatLahir || item.tempatLahir,
        tanggalLahir: ex.tanggalLahir || item.tanggalLahir,
        email: (ex.email && !ex.email.startsWith('member_') && !ex.email.startsWith('user_')) ? ex.email : item.email
      };
      mergedList[idx] = merged;
    }
  });

  // Strict KTA allocation pass per region code XX
  const usedPerCode = new Map<string, Set<number>>();

  // Pass A: Register valid existing non-duplicate KTAs
  mergedList.forEach((m) => {
    let kta = m.ktaNumber || m.nomorKTA;
    if (kta && isValidKtaNumberFormat(kta)) {
      const parsed = parseKtaNumber(kta);
      if (parsed) {
        if (!usedPerCode.has(parsed.kodeKwarda)) {
          usedPerCode.set(parsed.kodeKwarda, new Set());
        }
        const set = usedPerCode.get(parsed.kodeKwarda)!;
        if (set.has(parsed.nomorUrut)) {
          // Duplicate within region! Clear so it gets assigned a fresh unique number
          m.ktaNumber = '';
          m.nomorKTA = '';
        } else {
          set.add(parsed.nomorUrut);
        }
      }
    } else {
      m.ktaNumber = '';
      m.nomorKTA = '';
    }
  });

  // Pass B: Assign sequential gap-free numbers for members missing KTA
  mergedList.forEach((m) => {
    let kta = m.ktaNumber || m.nomorKTA;
    if (!kta || !isValidKtaNumberFormat(kta)) {
      const code = getKwardaCode(m.asalKwarda, m.qabilah);
      if (!usedPerCode.has(code)) {
        usedPerCode.set(code, new Set());
      }
      const set = usedPerCode.get(code)!;
      const seq = findNextAvailableNumber(set);
      set.add(seq);
      const newKta = formatKtaNumber(code, seq);
      m.ktaNumber = newKta;
      m.nomorKTA = newKta;
    }
  });

  return mergedList;
};


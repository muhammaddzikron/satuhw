import { User, UserRole } from '../types';
import { INITIAL_SPREADSHEET_DATA } from './initialSpreadsheetData';
import { csvPart1 } from './kta_csv_part1';
import { csvPart2 } from './kta_csv_part2';
import { csvPart3 } from './kta_csv_part3';
import { csvPart4 } from './kta_csv_part4';
import { csvPart5 } from './kta_csv_part5';
import { csvPart6 } from './kta_csv_part6';

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

  const map = new Map<string, User>();

  const getKey = (m: any) => {
    const kta = (m.ktaNumber || m.nomorKTA || '').trim();
    if (kta) return `kta:${kta.toLowerCase()}`;
    const email = (m.email || '').trim().toLowerCase();
    if (email && !email.startsWith('member_') && !email.startsWith('user_')) return `email:${email}`;
    const nik = (m.nik || '').trim();
    if (nik && nik.length >= 10 && nik !== '-') return `nik:${nik}`;
    const name = (m.namaLengkap || m.nama || '').trim().toLowerCase();
    if (name) return `name:${name}`;
    return `id:${m.id}`;
  };

  // 1. Add INITIAL_SPREADSHEET_DATA users
  (INITIAL_SPREADSHEET_DATA.users || []).forEach((u: any, idx: number) => {
    if (!u) return;
    const key = getKey(u);
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

    map.set(key, {
      ...u,
      id: String(u.id || `user-init-${idx}`),
      namaLengkap: u.namaLengkap || u.nama || 'Anggota HW',
      role: parsedRole,
      roles: parsedRoles,
      isVerified: u.isVerified === true || u.isVerified === 'TRUE' || u.isVerified === 'true'
    });
  });

  // 2. Add CSV members
  csvMembers.forEach((c) => {
    const key = getKey(c);
    if (!map.has(key)) {
      map.set(key, c);
    } else {
      const ex = map.get(key)!;
      map.set(key, {
        ...c,
        ...ex,
        id: ex.id || c.id,
        ktaNumber: ex.ktaNumber || c.ktaNumber || ex.nomorKTA || c.nomorKTA,
        nomorKTA: ex.nomorKTA || c.nomorKTA || ex.ktaNumber || c.ktaNumber,
        nik: ex.nik || c.nik,
        noHp: ex.noHp || c.noHp,
        alamat: ex.alamat || c.alamat,
        asalKwarda: ex.asalKwarda || c.asalKwarda,
        tempatLahir: ex.tempatLahir || c.tempatLahir,
        tanggalLahir: ex.tanggalLahir || c.tanggalLahir,
        email: (ex.email && !ex.email.startsWith('member_') && !ex.email.startsWith('user_')) ? ex.email : c.email
      });
    }
  });

  // Ensure Bayu Ghifari Javalino is present
  const bayuKey = 'email:bayughifari@gmail.com';
  if (!map.has(bayuKey)) {
    map.set(bayuKey, {
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
      isVerified: true,
      sosmed: "@bayughifari",
      noHp: "081234567890",
      upgradeRequests: []
    });
  }

  return Array.from(map.values());
};

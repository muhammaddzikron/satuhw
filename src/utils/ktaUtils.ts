import { normalizeDateForInput } from '../lib/utils';

export interface KwardaMapping {
  code: string;
  name: string;
}

export const KWARDA_QABILAH_JATENG: KwardaMapping[] = [
  { code: '01', name: 'Kabupaten Banjarnegara' },
  { code: '02', name: 'Kabupaten Banyumas' },
  { code: '03', name: 'Kabupaten Batang' },
  { code: '04', name: 'Kabupaten Blora' },
  { code: '05', name: 'Kabupaten Boyolali' },
  { code: '06', name: 'Kabupaten Brebes' },
  { code: '07', name: 'Kabupaten Cilacap' },
  { code: '08', name: 'Kabupaten Demak' },
  { code: '09', name: 'Kabupaten Grobogan' },
  { code: '10', name: 'Kabupaten Jepara' },
  { code: '11', name: 'Kabupaten Karanganyar' },
  { code: '12', name: 'Kabupaten Kebumen' },
  { code: '13', name: 'Kabupaten Kendal' },
  { code: '14', name: 'Kabupaten Klaten' },
  { code: '15', name: 'Kabupaten Kudus' },
  { code: '16', name: 'Kabupaten Magelang' },
  { code: '17', name: 'Kabupaten Pati' },
  { code: '18', name: 'Kabupaten Pekalongan' },
  { code: '19', name: 'Kabupaten Pemalang' },
  { code: '20', name: 'Kabupaten Purbalingga' },
  { code: '21', name: 'Kabupaten Purworejo' },
  { code: '22', name: 'Kabupaten Rembang' },
  { code: '23', name: 'Kabupaten Semarang' },
  { code: '24', name: 'Kabupaten Sragen' },
  { code: '25', name: 'Kabupaten Sukoharjo' },
  { code: '26', name: 'Kabupaten Tegal' },
  { code: '27', name: 'Kabupaten Temanggung' },
  { code: '28', name: 'Kabupaten Wonogiri' },
  { code: '29', name: 'Kabupaten Wonosobo' },
  { code: '30', name: 'Kota Magelang' },
  { code: '31', name: 'Kota Pekalongan' },
  { code: '32', name: 'Kota Salatiga' },
  { code: '33', name: 'Kota Semarang' },
  { code: '34', name: 'Kota Surakarta' },
  { code: '35', name: 'Kota Tegal' },
  { code: '36', name: 'Universitas Muhammadiyah Surakarta (UMS)' },
  { code: '37', name: 'Universitas Muhammadiyah Magelang (UNIMMA)' },
  { code: '38', name: 'Universitas Muhammadiyah Purwokerto (UMP)' },
  { code: '39', name: 'Universitas Muhammadiyah Purworejo (UMPWR)' },
  { code: '40', name: 'Universitas Muhammadiyah Semarang (UNIMUS)' },
  { code: '41', name: 'Universitas Muhammadiyah Klaten (UMKLA)' },
  { code: '42', name: 'Universitas Muhammadiyah Kudus (UMKU)' },
  { code: '43', name: 'Universitas Aisyiyah Surakarta (AISKA)' },
  { code: '44', name: 'Universitas Muhammadiyah Gombong Kebumen (UNIMUGO)' },
  { code: '45', name: 'Universitas Muhammadiyah Kendal Batang (UMKABA)' },
  { code: '46', name: 'Universitas Muhammadiyah Karanganyar (UMUKA)' },
  { code: '47', name: 'ITS PKU Muhammadiyah Surakarta (ITSPKU)' },
  { code: '48', name: 'STAIM Blora' },
  { code: '49', name: 'STKIP Muhammadiyah Blora' },
  { code: '50', name: 'STIE Muhammadiyah Cilacap' },
  { code: '51', name: 'Universitas Muhammadiyah Pekajangan Pekalongan (UMPP)' },
  { code: '52', name: 'Universitas Muhammadiyah Brebes (UMBS)' },
  { code: '53', name: 'Akademi Ilmu Statistik dan Bisnis Muhammadiyah Semarang (ITESA)' },
  { code: '54', name: 'Politeknik Muhammadiyah Magelang' },
  { code: '55', name: 'Akkes Muhammadiyah Temanggung' },
  { code: '56', name: 'Institut Teknologi dan Bisnis Muhammadiyah Grobogan' },
  { code: '57', name: 'Stikes Muhammadiyah Wonosobo' },
  { code: '58', name: 'Universitas Muhammadiyah Tegal' }
];

export function resolveSingleCode(input?: string): string | null {
  if (!input) return null;
  const clean = input.trim().toLowerCase();
  if (!clean) return null;

  // 1. Direct code check e.g. "01".."58"
  const directByCode = KWARDA_QABILAH_JATENG.find(
    item => item.code === clean || item.code === clean.padStart(2, '0')
  );
  if (directByCode) return directByCode.code;

  // Common regional aliases mapping
  const aliases: Record<string, string> = {
    'surakarta': '34',
    'solo': '34',
    'kota solo': '34',
    'purwokerto': '02',
    'ungaran': '23',
    'slawi': '26',
    'kajen': '18',
    'salatiga': '32',
    'kota salatiga': '32',
    'gombong': '12',
    'brebes': '06',
    'bumiayu': '06',
    'kab brebes': '06',
    'kab. brebes': '06',
    'kwarda brebes': '06',
    'umbs': '52',
    'ums': '36',
    'unimma': '37',
    'ump': '38',
    'umpwr': '39',
    'unimus': '40',
    'umkla': '41',
    'umku': '42',
    'aiska': '43',
    'unimugo': '44',
    'umkaba': '45',
    'umuka': '46',
    'itspku': '47',
    'umpp': '51',
  };
  if (aliases[clean]) return aliases[clean];

  // 2. Exact name match
  const exactName = KWARDA_QABILAH_JATENG.find(
    item => item.name.toLowerCase() === clean
  );
  if (exactName) return exactName.code;

  // 3. PTMA match (codes 36 to 58)
  const ptmaMatch = KWARDA_QABILAH_JATENG.slice(35).find(item => {
    const itemName = item.name.toLowerCase();
    const matchParen = itemName.match(/\(([^)]+)\)/);
    if (matchParen && clean.includes(matchParen[1].toLowerCase())) {
      return true;
    }
    return clean.includes(itemName) || itemName.includes(clean);
  });
  if (ptmaMatch) return ptmaMatch.code;

  // 4. Specific Kota vs Kabupaten checking
  const isKotaInput = clean.startsWith('kota ') || clean.endsWith(' kota');
  const isKabInput = clean.startsWith('kabupaten ') || clean.startsWith('kab ') || clean.endsWith(' kab');

  if (isKotaInput) {
    const kotaItem = KWARDA_QABILAH_JATENG.slice(29, 35).find(item => {
      const coreName = item.name.toLowerCase().replace('kota ', '').trim();
      return clean.includes(coreName);
    });
    if (kotaItem) return kotaItem.code;
  }

  if (isKabInput) {
    const kabItem = KWARDA_QABILAH_JATENG.slice(0, 29).find(item => {
      const coreName = item.name.toLowerCase().replace('kabupaten ', '').trim();
      return clean.includes(coreName);
    });
    if (kabItem) return kabItem.code;
  }

  // 5. General Kwarda match (codes 01 to 35)
  const kwardaMatch = KWARDA_QABILAH_JATENG.slice(0, 35).find(item => {
    const itemName = item.name.toLowerCase();
    const coreName = itemName.replace(/^(kabupaten|kota)\s+/i, '').trim();
    if (clean.includes(coreName) || itemName.includes(clean)) {
      return true;
    }
    return false;
  });
  if (kwardaMatch) return kwardaMatch.code;

  return null;
}

/**
 * Checks if a member/app record matches a target Kwarda or Qabilah name/code.
 */
export function isMatchKwarda(app: any, targetKwardaName: string): boolean {
  if (!app) return false;
  if (!targetKwardaName || targetKwardaName === 'Semua') return true;
  const cleanTarget = targetKwardaName.trim();
  const targetItem = KWARDA_QABILAH_JATENG.find(k => k.name.toLowerCase() === cleanTarget.toLowerCase());
  const targetCode = targetItem ? targetItem.code : resolveSingleCode(cleanTarget);

  if (!targetCode) return false;

  const appKta = (app.ktaNumber || app.nomorKTA || '').trim();
  const parsed = parseKtaNumber(appKta);
  if (parsed && parsed.kodeKwarda === targetCode) {
    return true;
  }

  const appCode = resolveSingleCode(app.asalDaerah || app.asalKwarda || app.kwarda) ||
                  resolveSingleCode(app.qabilah);
  if (appCode && appCode === targetCode) {
    return true;
  }

  const coreTarget = cleanTarget.toLowerCase().replace(/^(kabupaten|kota)\s+/i, '').trim();
  const cleanApp = `${app.asalDaerah || ''} ${app.asalKwarda || ''} ${app.kwarda || ''} ${app.qabilah || ''} ${app.alamat || ''}`.toLowerCase();
  if (coreTarget && cleanApp.includes(coreTarget)) {
    return true;
  }

  return false;
}

/**
 * Maps given Kwarda and/or Qabilah parameters to its 2-digit code string ('01'..'58').
 * Priority is given to Qabilah PTMA if present, falling back to Kwarda or default.
 */
export function getKwardaCode(asalKwardaOrQabilah?: string, qabilahParam?: string): string {
  // If qabilahParam is passed, check it first for a match
  if (qabilahParam) {
    const qCode = resolveSingleCode(qabilahParam);
    if (qCode) return qCode;
  }

  // Next check asalKwardaOrQabilah
  if (asalKwardaOrQabilah) {
    const aCode = resolveSingleCode(asalKwardaOrQabilah);
    if (aCode) return aCode;
  }

  // Fallback to '01'
  return '01';
}

/**
 * Finds the smallest positive integer n >= 1 that is NOT present in usedNumbers (Gap-filling hole algorithm).
 */
export function findNextAvailableNumber(usedNumbers: Iterable<number>): number {
  const set = new Set<number>();
  for (const n of usedNumbers) {
    const num = Number(n);
    if (!isNaN(num) && num > 0) {
      set.add(num);
    }
  }
  let candidate = 1;
  while (set.has(candidate)) {
    candidate++;
  }
  return candidate;
}

/**
 * Format KTA number as 11.xx.xxxx
 */
export function formatKtaNumber(kodeKwarda: string, nomorUrut: number): string {
  const code = String(kodeKwarda).padStart(2, '0');
  const seq = String(nomorUrut).padStart(4, '0');
  return `11.${code}.${seq}`;
}

/**
 * Check if a KTA number string is already valid and formatted.
 */
export function isValidKtaNumberFormat(ktaNum?: string): boolean {
  if (!ktaNum) return false;
  const str = String(ktaNum).trim();
  // Valid if matches 11.xx.xxxx or contains valid structure
  return /^11\.\d{2}\.\d{4}$/.test(str);
}

/**
 * Parse a valid 11.xx.xxxx KTA number into its components.
 */
export function parseKtaNumber(ktaNum?: string): { kodeProvinsi: string; kodeKwarda: string; nomorUrut: number } | null {
  if (!ktaNum) return null;
  const str = String(ktaNum).trim();
  const match = str.match(/^(\d{2})\.(\d{2})\.(\d{1,8})$/);
  if (!match) return null;
  return {
    kodeProvinsi: match[1],
    kodeKwarda: match[2],
    nomorUrut: parseInt(match[3], 10)
  };
}

/**
 * Extracts structured numerical components of a KTA record for reliable comparison.
 */
export function parseKtaDetails(app: any) {
  const rawKta = (app?.ktaNumber || app?.nomorKTA || '').toString().trim();
  if (rawKta) {
    const parsed = parseKtaNumber(rawKta);
    if (parsed) {
      return {
        provCode: parseInt(parsed.kodeProvinsi, 10) || 11,
        kwardaCode: parseInt(parsed.kodeKwarda, 10) || 1,
        seq: parsed.nomorUrut || 0,
        hasKta: true
      };
    }
  }
  // Fallback: Infer Kwarda code from region / qabilah name
  const codeStr = getKwardaCode(app?.asalDaerah || app?.asalKwarda, app?.qabilah || app?.qabilahPtma);
  return {
    provCode: 11,
    kwardaCode: parseInt(codeStr, 10) || 99,
    seq: typeof app?.nomorUrut === 'number' ? app.nomorUrut : 999999,
    hasKta: false
  };
}

/**
 * Comparator function to sort KTA items strictly according to KTA concept format (11.XX.YYYY).
 * 1. Kwarda code numerical order (01, 02, ..., 35, 36..58)
 * 2. Assigned KTA items before unassigned items
 * 3. Sequence number numerical order (1, 2, ..., 100, 101...)
 */
export function compareKtaNumbers(a: any, b: any): number {
  const detailA = parseKtaDetails(a);
  const detailB = parseKtaDetails(b);

  if (detailA.kwardaCode !== detailB.kwardaCode) {
    return detailA.kwardaCode - detailB.kwardaCode;
  }

  if (detailA.hasKta !== detailB.hasKta) {
    return detailA.hasKta ? -1 : 1;
  }

  if (detailA.seq !== detailB.seq) {
    return detailA.seq - detailB.seq;
  }

  return (a?.nama || a?.namaLengkap || '').localeCompare(b?.nama || b?.namaLengkap || '');
}

/**
 * Comparator function to sort KTA items strictly by sequence number (nomor urut: 1, 2, 3...) ascending.
 * 1. Assigned KTA items before unassigned items
 * 2. Sequence number numerical order (1, 2, 3...)
 * 3. Kwarda code numerical order (01, 02, ..., 58)
 * 4. Name alphabetical order
 */
export function compareByKtaSequence(a: any, b: any): number {
  const detailA = parseKtaDetails(a);
  const detailB = parseKtaDetails(b);

  if (detailA.hasKta !== detailB.hasKta) {
    return detailA.hasKta ? -1 : 1;
  }

  if (detailA.seq !== detailB.seq) {
    return detailA.seq - detailB.seq;
  }

  if (detailA.kwardaCode !== detailB.kwardaCode) {
    return detailA.kwardaCode - detailB.kwardaCode;
  }

  return (a?.nama || a?.namaLengkap || '').localeCompare(b?.nama || b?.namaLengkap || '');
}

/**
 * Resequences and compacts KTA sequence numbers per Kwarda/Qabilah so that there are no gaps.
 * E.g., if existing members in Kwarda 01 have sequence numbers [1, 3, 5],
 * they will be shifted down to [1, 2, 3] sequentially starting from 0001.
 */
export function resequenceKtaNumbers<T extends Record<string, any>>(items: T[]): T[] {
  if (!Array.isArray(items) || items.length === 0) return items;

  // Group items by Kwarda/Qabilah 2-digit code
  const groups = new Map<string, T[]>();

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (!item) continue;

    const targetKwarda = item.asalDaerah || item.asalKwarda || '';
    const targetQabilah = item.qabilah || item.qabilahPtma || '';
    
    let code = getKwardaCode(targetKwarda, targetQabilah);
    const rawKta = (item.ktaNumber || item.nomorKTA || '').toString().trim();
    if (isValidKtaNumberFormat(rawKta)) {
      const parsed = parseKtaNumber(rawKta);
      if (parsed) {
        if (!targetKwarda && !targetQabilah) {
          code = parsed.kodeKwarda;
        }
      }
    }
    if (!code) {
      code = '01';
    }

    if (!groups.has(code)) {
      groups.set(code, []);
    }
    groups.get(code)!.push(item);
  }

  // Resequence continuously starting from 1 for each Kwarda code group
  groups.forEach((groupItems, code) => {
    groupItems.sort((a: any, b: any) => {
      const parsedA = parseKtaDetails(a);
      const parsedB = parseKtaDetails(b);

      // Assigned KTAs before unassigned
      if (parsedA.hasKta !== parsedB.hasKta) {
        return parsedA.hasKta ? -1 : 1;
      }

      // If both have assigned KTAs, sort by current sequence number to maintain established order
      if (parsedA.hasKta && parsedB.hasKta) {
        if (parsedA.seq !== parsedB.seq) {
          return parsedA.seq - parsedB.seq;
        }
      }

      // Fallback sorting by registration date or name
      const dateA = a.tanggalAjuan || a.tanggalDaftar || a.createdAt || a.tanggal || '';
      const dateB = b.tanggalAjuan || b.tanggalDaftar || b.createdAt || b.tanggal || '';
      if (dateA && dateB && dateA !== dateB) {
        return String(dateA).localeCompare(String(dateB));
      }

      const nameA = a.namaLengkap || a.nama || '';
      const nameB = b.namaLengkap || b.nama || '';
      return nameA.localeCompare(nameB, 'id', { sensitivity: 'base' });
    });

    let currentSeq = 1;
    for (const item of groupItems as any[]) {
      const isApprovedOrMember = item.status === 'approved' || item.isVerified === true || Boolean(item.ktaNumber || item.nomorKTA);
      if (isApprovedOrMember) {
        if (!item.ktaNumber && !item.nomorKTA) {
          const newKta = formatKtaNumber(code, currentSeq);
          item.ktaNumber = newKta;
          item.nomorKTA = newKta;
          item.kodeProvinsi = '11';
          item.kodeKwarda = code;
          item.nomorUrut = currentSeq;
        } else {
          const currentKta = item.ktaNumber || item.nomorKTA;
          item.ktaNumber = currentKta;
          item.nomorKTA = currentKta;
        }
        currentSeq++;
      }
    }
  });

  return items;
}

/**
 * Deduplicates a list of member records, merging duplicates strictly by unique ID, non-synthetic email, or KTA number,
 * so no roles, pelatihan, or verified statuses are lost, while never cross-contaminating different individuals.
 */
export function deduplicateMembers<T extends Record<string, any>>(rawMembers: T[]): T[] {
  if (!Array.isArray(rawMembers) || rawMembers.length === 0) return [];

  const map = new Map<string, T>();
  const emailToId = new Map<string, string>();
  const ktaToId = new Map<string, string>();

  const normStr = (val: any) => (val ? String(val).trim().toLowerCase().replace(/\s+/g, ' ') : '');
  const cleanDigits = (val: any) => (val ? String(val).replace(/[^0-9]/g, '') : '');

  const isSyntheticEmail = (email: string) => {
    if (!email) return true;
    return email.startsWith('member_') || email.startsWith('user_') || (email.includes('@hw.or.id') && email.includes('csv'));
  };

  for (const raw of rawMembers) {
    if (!raw) continue;
    const name = (raw.namaLengkap || raw.nama || '').trim();
    if (!name || name === 'Tanpa Nama' || name === '-' || name.toLowerCase() === 'null' || name.toLowerCase() === 'undefined') continue;

    const phoneDigits = cleanDigits(raw.noHp || raw.noWa);
    const resolvedPhone = raw.noHp || raw.noWa || '';

    const email = normStr(raw.email);
    const validEmail = (email && !isSyntheticEmail(email)) ? email : '';

    const kta = (raw.ktaNumber || raw.nomorKTA || '').trim();
    const validKta = (kta && kta !== 'KTA-HW.JT.XXXX' && !kta.includes('X')) ? kta : '';

    const rawId = raw.id ? String(raw.id).trim() : '';

    // Search for existing duplicate match strictly by unique identifiers
    let matchId: string | null = null;

    if (rawId && map.has(rawId)) {
      matchId = rawId;
    } else if (validEmail && emailToId.has(validEmail)) {
      matchId = emailToId.get(validEmail)!;
    } else if (validKta && ktaToId.has(validKta)) {
      matchId = ktaToId.get(validKta)!;
    }

    if (matchId && map.has(matchId)) {
      // Merge into existing member record, prioritizing freshly provided non-empty values
      const existing = map.get(matchId)!;

      // Merge roles
      const exRolesRaw = existing.roles || (existing.role ? [existing.role] : ['umum']);
      const newRolesRaw = raw.roles || (raw.role ? [raw.role] : ['umum']);
      const combinedRolesSet = new Set<string>();

      const addRole = (r: any) => {
        if (!r) return;
        if (Array.isArray(r)) r.forEach(addRole);
        else if (typeof r === 'string') {
          r.split(',').forEach(s => {
            const clean = s.trim().toLowerCase();
            if (clean) combinedRolesSet.add(clean);
          });
        }
      };

      addRole(exRolesRaw);
      addRole(newRolesRaw);
      const combinedRoles = Array.from(combinedRolesSet);

      const rolePriority = ['superadmin', 'admin', 'diklat', 'admin_diklat', 'kwarda', 'admin_kwarda', 'sugli', 'dewan_sugli', 'jari1', 'jari2', 'jati1', 'jati2'];
      let primaryRole = 'umum';
      for (const pr of rolePriority) {
        if (combinedRoles.some(r => r === pr || r.includes(pr))) {
          primaryRole = pr;
          break;
        }
      }

      // Merge pelatihan
      const exPel = Array.isArray(existing.pelatihan) ? existing.pelatihan : [];
      const newPel = Array.isArray(raw.pelatihan) ? raw.pelatihan : [];
      const combinedPelMap = new Map<string, any>();
      exPel.forEach(p => combinedPelMap.set(normStr(p), p));
      newPel.forEach(p => combinedPelMap.set(normStr(p), p));
      const combinedPel = Array.from(combinedPelMap.values()).filter(Boolean);

      // Prioritize raw's non-empty fields if provided, fallback to existing
      const resolvedName = (raw.namaLengkap || raw.nama || existing.namaLengkap || existing.nama || name).trim();
      const resolvedKwarda = raw.asalKwarda || raw.asalDaerah || existing.asalKwarda || existing.asalDaerah || '';
      const resolvedPhoneVal = raw.noHp || raw.noWa || existing.noHp || existing.noWa || '';
      const resolvedGol = raw.golongan || raw.tingkatan || existing.golongan || existing.tingkatan || 'Dewasa';
      const resolvedTempatLahir = (raw.tempatLahir || (raw as any)?.tempatlahir || existing.tempatLahir || (existing as any)?.tempatlahir || '').trim();
      const rawTgl = raw.tanggalLahir || (raw as any)?.tanggallahir || existing.tanggalLahir || (existing as any)?.tanggallahir || '';
      const resolvedTanggalLahir = normalizeDateForInput(rawTgl);

      const merged: T = {
        ...existing,
        ...raw,
        id: existing.id || raw.id,
        namaLengkap: resolvedName,
        nama: resolvedName,
        email: validEmail || raw.email || existing.email || '',
        noHp: resolvedPhoneVal,
        noWa: resolvedPhoneVal,
        alamat: raw.alamat || existing.alamat || '',
        qabilah: raw.qabilah || existing.qabilah || '',
        asalKwarda: resolvedKwarda,
        asalDaerah: resolvedKwarda,
        tempatLahir: resolvedTempatLahir,
        tanggalLahir: resolvedTanggalLahir,
        jenisKelamin: raw.jenisKelamin || existing.jenisKelamin || 'L',
        golongan: resolvedGol,
        tingkatan: resolvedGol,
        jenisKta: raw.jenisKta || existing.jenisKta || 'Digital',
        status: (raw.status === 'approved' || existing.status === 'approved') ? 'approved' : (raw.status || existing.status || 'pending'),
        photo: (raw.photo && raw.photo.length > 10) ? raw.photo : (existing.photo || ''),
        isVerified: Boolean(raw.isVerified || existing.isVerified || raw.status === 'approved' || existing.status === 'approved'),
        statusAktivasi: (raw.statusAktivasi === 'Aktif' || existing.statusAktivasi === 'Aktif') ? 'Aktif' : (raw.statusAktivasi || existing.statusAktivasi || 'Belum Aktif'),
        statusPembayaran: (raw.statusPembayaran === 'Lunas' || existing.statusPembayaran === 'Lunas') ? 'Lunas' : (raw.statusPembayaran || existing.statusPembayaran || 'Belum Bayar'),
        ktaNumber: validKta || raw.ktaNumber || existing.ktaNumber || '',
        nomorKTA: validKta || raw.nomorKTA || existing.nomorKTA || '',
        role: primaryRole,
        roles: combinedRoles,
        pelatihan: combinedPel,
        password: raw.password || existing.password || '12345hw'
      };

      map.set(matchId, merged);
      if (validEmail) emailToId.set(validEmail, matchId);
      if (validKta) ktaToId.set(validKta, matchId);
    } else {
      const memberId = rawId || `user-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const rawRoles = raw.roles || (raw.role ? [raw.role] : ['umum']);
      const combinedRolesSet = new Set<string>();
      const addRole = (r: any) => {
        if (!r) return;
        if (Array.isArray(r)) r.forEach(addRole);
        else if (typeof r === 'string') {
          r.split(',').forEach(s => {
            const clean = s.trim().toLowerCase();
            if (clean) combinedRolesSet.add(clean);
          });
        }
      };
      addRole(rawRoles);
      const combinedRoles = Array.from(combinedRolesSet);
      if (combinedRoles.length === 0) combinedRoles.push('umum');

      const rolePriority = ['superadmin', 'admin', 'diklat', 'admin_diklat', 'kwarda', 'admin_kwarda', 'sugli', 'dewan_sugli', 'jari1', 'jari2', 'jati1', 'jati2'];
      let primaryRole = 'umum';
      for (const pr of rolePriority) {
        if (combinedRoles.some(r => r === pr || r.includes(pr))) {
          primaryRole = pr;
          break;
        }
      }

      const resolvedKwarda = raw.asalKwarda || raw.asalDaerah || '';
      const resolvedGol = raw.golongan || raw.tingkatan || 'Dewasa';
      const resolvedTempat = (raw.tempatLahir || (raw as any)?.tempatlahir || '').trim();
      const resolvedTgl = normalizeDateForInput(raw.tanggalLahir || (raw as any)?.tanggallahir || '');

      const newObj: T = {
        ...raw,
        id: memberId,
        namaLengkap: name,
        nama: name,
        email: raw.email || '',
        noHp: resolvedPhone,
        noWa: resolvedPhone,
        tempatLahir: resolvedTempat,
        tanggalLahir: resolvedTgl,
        asalKwarda: resolvedKwarda,
        asalDaerah: resolvedKwarda,
        jenisKelamin: raw.jenisKelamin === 'Perempuan' || raw.jenisKelamin === 'P' ? 'P' : 'L',
        golongan: resolvedGol,
        tingkatan: resolvedGol,
        jenisKta: raw.jenisKta || 'Digital',
        status: raw.status || (raw.isVerified ? 'approved' : 'pending'),
        isVerified: Boolean(raw.isVerified || raw.status === 'approved'),
        role: primaryRole,
        roles: combinedRoles,
        pelatihan: Array.isArray(raw.pelatihan) ? raw.pelatihan : [],
        password: raw.password || '12345hw'
      };

      map.set(memberId, newObj);
      if (validEmail) emailToId.set(validEmail, memberId);
      if (validKta) ktaToId.set(validKta, memberId);
    }
  }

  return Array.from(map.values());
}

/**
 * Ensures all items in an array have unique, valid, and gap-free KTA numbers (11.XX.YYYY).
 * Automatically shifts numbers down if there are gaps in sequence numbers within a Kwarda/Qabilah.
 */
export function ensureUniqueKtaNumbers<T extends Record<string, any>>(items: T[]): T[] {
  if (!Array.isArray(items) || items.length === 0) return items;
  const deduped = deduplicateMembers(items);
  return resequenceKtaNumbers(deduped);
}


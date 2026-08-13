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

function resolveSingleCode(input?: string): string | null {
  if (!input) return null;
  const clean = input.trim().toLowerCase();
  if (!clean) return null;

  // 1. Direct code check e.g. "01".."58"
  const directByCode = KWARDA_QABILAH_JATENG.find(
    item => item.code === clean || item.code === clean.padStart(2, '0')
  );
  if (directByCode) return directByCode.code;

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

  // 4. Kwarda match (codes 01 to 35)
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
  const set = new Set<number>(usedNumbers);
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
    
    let code = '';
    const rawKta = (item.ktaNumber || item.nomorKTA || '').toString().trim();
    if (isValidKtaNumberFormat(rawKta)) {
      const parsed = parseKtaNumber(rawKta);
      if (parsed) {
        code = parsed.kodeKwarda;
      }
    }
    if (!code) {
      code = getKwardaCode(targetKwarda, targetQabilah);
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

      // If both have assigned KTAs, sort by current sequence number
      if (parsedA.hasKta && parsedB.hasKta) {
        if (parsedA.seq !== parsedB.seq) {
          return parsedA.seq - parsedB.seq;
        }
      }

      // Fallback sorting by registration date or name
      const dateA = a.tanggalDaftar || a.createdAt || a.tanggal || '';
      const dateB = b.tanggalDaftar || b.createdAt || b.tanggal || '';
      if (dateA && dateB && dateA !== dateB) {
        return String(dateA).localeCompare(String(dateB));
      }

      const nameA = a.namaLengkap || a.nama || '';
      const nameB = b.namaLengkap || b.nama || '';
      return nameA.localeCompare(nameB);
    });

    let currentSeq = 1;
    for (const item of groupItems as any[]) {
      const newKta = formatKtaNumber(code, currentSeq);
      item.ktaNumber = newKta;
      item.nomorKTA = newKta;
      item.kodeProvinsi = '11';
      item.kodeKwarda = code;
      item.nomorUrut = currentSeq;
      currentSeq++;
    }
  });

  return items;
}

/**
 * Deduplicates a list of member records, merging duplicates so no roles, pelatihan, or verified statuses are lost.
 */
export function deduplicateMembers<T extends Record<string, any>>(rawMembers: T[]): T[] {
  if (!Array.isArray(rawMembers) || rawMembers.length === 0) return [];

  const map = new Map<string, T>();
  const emailToId = new Map<string, string>();
  const ktaToId = new Map<string, string>();
  const nameKwardaToId = new Map<string, string>();
  const namePhoneToId = new Map<string, string>();
  const nameOnlyToId = new Map<string, string>();

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

    const normName = normStr(name);
    const kwarda = normStr(raw.asalKwarda || raw.asalDaerah);
    const phoneDigits = cleanDigits(raw.noHp || raw.noWa);
    const validPhone = phoneDigits.length >= 8 ? phoneDigits : '';

    const email = normStr(raw.email);
    const validEmail = (email && !isSyntheticEmail(email)) ? email : '';

    const kta = (raw.ktaNumber || raw.nomorKTA || '').trim();
    const validKta = (kta && kta !== 'KTA-HW.JT.XXXX' && !kta.includes('X')) ? kta : '';

    const rawId = raw.id ? String(raw.id).trim() : '';

    const nameKwardaKey = kwarda ? `${normName}||${kwarda}` : '';
    const namePhoneKey = validPhone ? `${normName}||${validPhone}` : '';

    // Search for existing duplicate match in order of specificity
    let matchId: string | null = null;

    if (rawId && map.has(rawId)) {
      matchId = rawId;
    } else if (validEmail && emailToId.has(validEmail)) {
      matchId = emailToId.get(validEmail)!;
    } else if (validKta && ktaToId.has(validKta)) {
      matchId = ktaToId.get(validKta)!;
    } else if (nameKwardaKey && nameKwardaToId.has(nameKwardaKey)) {
      matchId = nameKwardaToId.get(nameKwardaKey)!;
    } else if (namePhoneKey && namePhoneToId.has(namePhoneKey)) {
      matchId = namePhoneToId.get(namePhoneKey)!;
    } else if (normName && nameOnlyToId.has(normName)) {
      matchId = nameOnlyToId.get(normName)!;
    }

    if (matchId && map.has(matchId)) {
      // Merge raw into existing member record
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

      const merged: T = {
        ...raw,
        ...existing,
        id: existing.id || raw.id,
        namaLengkap: existing.namaLengkap || raw.namaLengkap || name,
        email: validEmail || existing.email || raw.email || '',
        noHp: existing.noHp || raw.noHp || raw.noWa || '',
        alamat: existing.alamat || raw.alamat || '',
        qabilah: existing.qabilah || raw.qabilah || '',
        asalKwarda: existing.asalKwarda || raw.asalKwarda || raw.asalDaerah || '',
        tempatLahir: existing.tempatLahir || raw.tempatLahir || '',
        tanggalLahir: existing.tanggalLahir || raw.tanggalLahir || '',
        golongan: (existing.golongan && existing.golongan !== 'Dewasa') ? existing.golongan : (raw.golongan || existing.golongan || 'Dewasa'),
        photo: (existing.photo && existing.photo.length > (raw.photo || '').length) ? existing.photo : (raw.photo || existing.photo || ''),
        isVerified: Boolean(existing.isVerified || raw.isVerified || raw.status === 'approved'),
        statusAktivasi: (existing.statusAktivasi === 'Aktif' || raw.statusAktivasi === 'Aktif') ? 'Aktif' : (existing.statusAktivasi || raw.statusAktivasi || 'Belum Aktif'),
        statusPembayaran: (existing.statusPembayaran === 'Lunas' || raw.statusPembayaran === 'Lunas') ? 'Lunas' : (existing.statusPembayaran || raw.statusPembayaran || 'Belum Bayar'),
        ktaNumber: validKta || existing.ktaNumber || raw.ktaNumber || '',
        nomorKTA: validKta || existing.nomorKTA || raw.nomorKTA || '',
        role: primaryRole,
        roles: combinedRoles,
        pelatihan: combinedPel,
        password: existing.password || raw.password || '12345hw'
      };

      map.set(matchId, merged);
      if (validEmail) emailToId.set(validEmail, matchId);
      if (validKta) ktaToId.set(validKta, matchId);
      if (nameKwardaKey) nameKwardaToId.set(nameKwardaKey, matchId);
      if (namePhoneKey) namePhoneToId.set(namePhoneKey, matchId);
      if (normName) nameOnlyToId.set(normName, matchId);
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

      const newObj: T = {
        ...raw,
        id: memberId,
        namaLengkap: name,
        email: raw.email || '',
        noHp: raw.noHp || raw.noWa || '',
        asalKwarda: raw.asalKwarda || raw.asalDaerah || '',
        jenisKelamin: raw.jenisKelamin === 'Perempuan' || raw.jenisKelamin === 'P' ? 'P' : 'L',
        golongan: raw.golongan || 'Dewasa',
        isVerified: Boolean(raw.isVerified || raw.status === 'approved'),
        role: primaryRole,
        roles: combinedRoles,
        pelatihan: Array.isArray(raw.pelatihan) ? raw.pelatihan : [],
        password: raw.password || '12345hw'
      };

      map.set(memberId, newObj);
      if (validEmail) emailToId.set(validEmail, memberId);
      if (validKta) ktaToId.set(validKta, memberId);
      if (nameKwardaKey) nameKwardaToId.set(nameKwardaKey, memberId);
      if (namePhoneKey) namePhoneToId.set(namePhoneKey, memberId);
      if (normName) nameOnlyToId.set(normName, memberId);
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


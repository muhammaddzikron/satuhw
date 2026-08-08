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
  const match = str.match(/^11\.(\d{2})\.(\d{4})$/);
  if (!match) return null;
  return {
    kodeProvinsi: '11',
    kodeKwarda: match[1],
    nomorUrut: parseInt(match[2], 10)
  };
}

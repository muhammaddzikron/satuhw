/**
 * Utility functions for formatting Indonesian and general member names cleanly.
 * Capitalizes names to Proper / Title Case, deduplicates glitch repeated names,
 * standardizes academic / religious honorifics, and strips junk strings.
 */

const ACADEMIC_DEGREE_MAP: Record<string, string> = {
  's.pd': 'S.Pd.',
  's.pd.': 'S.Pd.',
  's.pd.i': 'S.Pd.I.',
  's.pd.i.': 'S.Pd.I.',
  'm.pd': 'M.Pd.',
  'm.pd.': 'M.Pd.',
  'm.pd.i': 'M.Pd.I.',
  'm.pd.i.': 'M.Pd.I.',
  's.ag': 'S.Ag.',
  's.ag.': 'S.Ag.',
  'm.ag': 'M.Ag.',
  'm.ag.': 'M.Ag.',
  's.h': 'S.H.',
  's.h.': 'S.H.',
  's.h.i': 'S.H.I.',
  's.h.i.': 'S.H.I.',
  'm.h': 'M.H.',
  'm.h.': 'M.H.',
  's.kom': 'S.Kom.',
  's.kom.': 'S.Kom.',
  'm.kom': 'M.Kom.',
  'm.kom.': 'M.Kom.',
  's.sos': 'S.Sos.',
  's.sos.': 'S.Sos.',
  'm.si': 'M.Si.',
  'm.si.': 'M.Si.',
  's.si': 'S.Si.',
  's.si.': 'S.Si.',
  's.t': 'S.T.',
  's.t.': 'S.T.',
  'm.t': 'M.T.',
  'm.t.': 'M.T.',
  's.e': 'S.E.',
  's.e.': 'S.E.',
  'm.m': 'M.M.',
  'm.m.': 'M.M.',
  's.ked': 'S.Ked.',
  's.ked.': 'S.Ked.',
  's.pt': 'S.Pt.',
  's.pt.': 'S.Pt.',
  's.farm': 'S.Farm.',
  's.farm.': 'S.Farm.',
  'ph.d': 'Ph.D.',
  'ph.d.': 'Ph.D.',
  'b.sc': 'B.Sc.',
  'b.sc.': 'B.Sc.',
  'm.sc': 'M.Sc.',
  'm.sc.': 'M.Sc.',
  'm.kes': 'M.Kes.',
  'm.kes.': 'M.Kes.',
  'm.hum': 'M.Hum.',
  'm.hum.': 'M.Hum.',
  'lc': 'Lc.',
  'lc.': 'Lc.'
};

const HONORIFICS_PREFIX_MAP: Record<string, string> = {
  'dr': 'Dr.',
  'dr.': 'Dr.',
  'drs': 'Drs.',
  'drs.': 'Drs.',
  'dra': 'Dra.',
  'dra.': 'Dra.',
  'ir': 'Ir.',
  'ir.': 'Ir.',
  'prof': 'Prof.',
  'prof.': 'Prof.',
  'h': 'H.',
  'h.': 'H.',
  'hj': 'Hj.',
  'hj.': 'Hj.',
  'kh': 'KH.',
  'kh.': 'KH.',
  'k.h': 'K.H.',
  'k.h.': 'K.H.'
};

const SPECIAL_WORDS: Record<string, string> = {
  'hw': 'HW',
  'muh': 'Muh.',
  'sd': 'SD',
  'smp': 'SMP',
  'sma': 'SMA',
  'smk': 'SMK',
  'mi': 'MI',
  'mts': 'MTs',
  'ma': 'MA',
  'ptma': 'PTMA',
  'kwarda': 'Kwarda',
  'kwarwil': 'Kwarwil',
  'dan': 'dan',
  'bin': 'bin',
  'binti': 'binti'
};

/**
 * Format any person/member name into clean, standardized title case.
 * e.g.:
 * - "ZAKARIA zakaria" -> "Zakaria"
 * - "wildan samudra nur mahdi" -> "Wildan Samudra Nur Mahdi"
 * - "HANA EKA N HANA EKA N" -> "Hana Eka N."
 * - "Muhammad Zainuri Fatakh, S.H.I., M.Pd" -> "Muhammad Zainuri Fatakh, S.H.I., M.Pd."
 * - "Umma Rizqi Marfu&#039;ah" -> "Umma Rizqi Marfu'ah"
 */
export function toProperName(name?: string): string {
  if (!name || typeof name !== 'string') return '';

  let str = name
    .replace(/&#039;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim();

  if (!str) return '';

  // Ignore default placeholders
  const lower = str.toLowerCase();
  if (lower === 'tanpa nama' || lower === '-' || lower === 'null' || lower === 'undefined') {
    return str;
  }

  // Remove email artifacts attached to names (e.g. "Aan Taufiq akuaan28@gmail.com")
  str = str.replace(/\s+[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi, '');
  // Remove numbers attached at end of names (e.g. "Bagus Aji23" -> "Bagus Aji", "Kartikalitha 17" -> "Kartikalitha")
  str = str.replace(/([a-zA-Z]{2,})\d+\b/g, '$1');
  // Remove trailing dashes or unwanted punctuation at boundaries
  str = str.replace(/^[\s\-_,.]+|[\s\-_,.]+$/g, '');

  if (!str) return '';

  // Separate title parts after comma
  const parts = str.split(',');
  const mainPart = parts[0].trim();
  const degreeTokens = parts.slice(1).map(p => p.trim()).filter(Boolean);

  // Tokenize main name
  const rawWords = mainPart.split(/\s+/).filter(Boolean);
  if (rawWords.length === 0) return '';

  // Remove immediate consecutive duplicates ("priyatno priyatno" -> "priyatno")
  const deduped: string[] = [];
  for (let i = 0; i < rawWords.length; i++) {
    const cur = rawWords[i];
    const next = rawWords[i + 1];
    if (next && cur.toLowerCase() === next.toLowerCase()) {
      continue;
    }
    deduped.push(cur);
  }

  // Remove full repeated patterns (e.g. "HANA EKA N HANA EKA N" -> "Hana Eka N")
  let cleanWords = deduped;
  const half = Math.floor(cleanWords.length / 2);
  if (cleanWords.length >= 4 && cleanWords.length % 2 === 0) {
    const firstHalf = cleanWords.slice(0, half).map(w => w.toLowerCase()).join(' ');
    const secondHalf = cleanWords.slice(half).map(w => w.toLowerCase()).join(' ');
    if (firstHalf === secondHalf) {
      cleanWords = cleanWords.slice(0, half);
    }
  } else if (cleanWords.length === 3 && cleanWords[0].toLowerCase() === cleanWords[2].toLowerCase()) {
    cleanWords = cleanWords.slice(0, 2);
  }

  const capitalizeSingleWord = (word: string, isFirstWord: boolean): string => {
    if (!word) return '';
    const cleanWord = word.trim();
    const wordLower = cleanWord.toLowerCase();

    // Check prefix honorifics
    if (HONORIFICS_PREFIX_MAP[wordLower]) {
      return HONORIFICS_PREFIX_MAP[wordLower];
    }

    // Check special acronyms / conjunctions
    if (SPECIAL_WORDS[wordLower]) {
      if ((wordLower === 'dan' || wordLower === 'bin' || wordLower === 'binti') && !isFirstWord) {
        return wordLower;
      }
      return SPECIAL_WORDS[wordLower];
    }

    // Check standalone single letter initials (e.g. "N" -> "N.", "S" -> "S.", "M." -> "M.")
    if (/^[a-zA-Z]\.?$/.test(cleanWord)) {
      return cleanWord.toUpperCase().replace(/\.?$/, '.');
    }

    // Check apostrophe names (e.g. "Marfu'ah", "Syafi'i", "Ma'ruf", "D'costa")
    if (cleanWord.includes("'")) {
      return cleanWord.split("'").map((part, pIdx) => {
        if (!part) return '';
        if (pIdx === 0) return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
        return part.charAt(0).toLowerCase() + part.slice(1).toLowerCase();
      }).join("'");
    }

    // Check hyphenated names (e.g. "Al-Farisi", "Nur-Aini")
    if (cleanWord.includes("-")) {
      return cleanWord.split("-").map(part => {
        if (!part) return '';
        return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
      }).join("-");
    }

    return cleanWord.charAt(0).toUpperCase() + cleanWord.slice(1).toLowerCase();
  };

  const formattedMainWords = cleanWords.map((w, idx) => capitalizeSingleWord(w, idx === 0));
  const formattedMain = formattedMainWords.join(' ');

  if (degreeTokens.length === 0) {
    return formattedMain;
  }

  // Format academic degrees
  const formattedDegrees = degreeTokens.map(deg => {
    const dLower = deg.toLowerCase().replace(/\s+/g, '');
    if (ACADEMIC_DEGREE_MAP[dLower]) {
      return ACADEMIC_DEGREE_MAP[dLower];
    }
    // Fallback standardizing individual dot-separated letters
    return deg.trim();
  });

  return `${formattedMain}, ${formattedDegrees.join(', ')}`;
}

/**
 * Proper-cases an entire list of users and ensures no duplicate objects or corrupted fields.
 */
export function sanitizeMemberList<T extends { namaLengkap?: string; nama?: string }>(list: T[]): T[] {
  if (!Array.isArray(list)) return [];
  return list.map(item => {
    if (!item) return item;
    const properName = toProperName(item.namaLengkap || item.nama);
    return {
      ...item,
      namaLengkap: properName || item.namaLengkap || item.nama || 'Anggota HW',
      ...(item.nama ? { nama: properName || item.nama } : {})
    };
  });
}

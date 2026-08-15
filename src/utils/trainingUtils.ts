/**
 * Utility functions and constants for Training Levels (Tingkatan Pelatihan & Parameter Pelatih HW).
 *
 * Sesuai standarisasi parameter:
 * - Jaya Melati 1  = jayamelati1 atau jati1 (pilih salah satu / interoperable)
 * - Jaya Melati 2  = jayamelati2 atau jati2 (pilih salah satu / interoperable)
 * - Jaya Matahari 1 = jayamatahari1 atau jari1 (pilih salah satu / interoperable)
 * - Jaya Matahari 2 = jayamatahari2 atau jari2 (pilih salah satu / interoperable)
 * - Jaya Pertiwi    = jawi
 */

export type TrainingLevelKey = 'jati1' | 'jati2' | 'jari1' | 'jari2' | 'jawi';

export interface TrainingLevelConfig {
  id: TrainingLevelKey;
  aliases: string[];
  fullName: string;
  shortName: string;
  defaultFee: string;
  defaultNote?: string;
  description: string;
}

export const TRAINING_LEVELS: Record<TrainingLevelKey, TrainingLevelConfig> = {
  jati1: {
    id: 'jati1',
    aliases: ['jati1', 'jayamelati1', 'jati 1', 'jayamelati 1', 'jaya melati 1', 'jaya_melati_1', 'jm1', 'jm 1'],
    fullName: 'Jaya Melati 1',
    shortName: 'Jati 1',
    defaultFee: 'Rp 50.000',
    defaultNote: 'Konfirmasi Bayar',
    description: 'Pelatihan kepemimpinan tingkat dasar bagi calon Pembina Gerakan Kepanduan Hizbul Wathan.'
  },
  jati2: {
    id: 'jati2',
    aliases: ['jati2', 'jayamelati2', 'jati 2', 'jayamelati 2', 'jaya melati 2', 'jaya_melati_2', 'jm2', 'jm 2'],
    fullName: 'Jaya Melati 2',
    shortName: 'Jati 2',
    defaultFee: 'Rp 50.000',
    defaultNote: 'Konfirmasi Bayar',
    description: 'Pelatihan kepemimpinan tingkat lanjutan untuk memperdalam strategi pembinaan dan manajemen kwartir.'
  },
  jari1: {
    id: 'jari1',
    aliases: ['jari1', 'jayamatahari1', 'jari 1', 'jayamatahari 1', 'jaya matahari 1', 'jaya_matahari_1', 'jaya rintisan 1'],
    fullName: 'Jaya Matahari 1',
    shortName: 'Jari 1',
    defaultFee: 'Rp 50.000',
    defaultNote: 'Konfirmasi Bayar',
    description: 'Pelatihan bagi kader remaja/muda Hizbul Wathan untuk membekali kemampuan teknis memimpin regu & navigasi.'
  },
  jari2: {
    id: 'jari2',
    aliases: ['jari2', 'jayamatahari2', 'jari 2', 'jayamatahari 2', 'jaya matahari 2', 'jaya_matahari_2', 'jaya rintisan 2'],
    fullName: 'Jaya Matahari 2',
    shortName: 'Jari 2',
    defaultFee: 'Rp 50.000',
    defaultNote: 'Konfirmasi Bayar',
    description: 'Pelatihan tingkat lanjut bagi instruktur muda & pemimpin kepanduan remaja Hizbul Wathan.'
  },
  jawi: {
    id: 'jawi',
    aliases: ['jawi', 'jayapertiwi', 'jaya pertiwi', 'jaya_pertiwi', 'pertiwi'],
    fullName: 'Jaya Pertiwi',
    shortName: 'Jawi',
    defaultFee: 'Rp 50.000',
    defaultNote: 'Konfirmasi Bayar',
    description: 'Pelatihan kepanduan tingkat pembina putri & kepanduan Hizbul Wathan (Jaya Pertiwi).'
  }
};

/**
 * Normalizes any training string, parameter, or role slug into standard TrainingLevelKey or standard role.
 * e.g. "jayamelati1" -> "jati1", "jayamatahari1" -> "jari1", "jaya pertiwi" -> "jawi"
 */
export const normalizeTrainingKey = (str?: string): string => {
  if (!str) return '';
  const clean = String(str).trim().toLowerCase().replace(/[\s_-]+/g, '');

  if (clean === 'jayamelati1' || clean === 'jati1' || clean === 'jm1') return 'jati1';
  if (clean === 'jayamelati2' || clean === 'jati2' || clean === 'jm2') return 'jati2';
  if (clean === 'jayamatahari1' || clean === 'jari1') return 'jari1';
  if (clean === 'jayamatahari2' || clean === 'jari2') return 'jari2';
  if (clean === 'jayapertiwi' || clean === 'jawi' || clean === 'pertiwi') return 'jawi';

  // Broader contains check if not exact
  const raw = String(str).toLowerCase().trim();
  if (raw.includes('jaya melati 1') || raw.includes('jati 1') || raw.includes('jayamelati 1')) return 'jati1';
  if (raw.includes('jaya melati 2') || raw.includes('jati 2') || raw.includes('jayamelati 2')) return 'jati2';
  if (raw.includes('jaya matahari 1') || raw.includes('jari 1') || raw.includes('jayamatahari 1') || raw.includes('jaya rintisan 1')) return 'jari1';
  if (raw.includes('jaya matahari 2') || raw.includes('jari 2') || raw.includes('jayamatahari 2') || raw.includes('jaya rintisan 2')) return 'jari2';
  if (raw.includes('jaya pertiwi') || raw.includes('jayapertiwi') || raw.includes('jawi')) return 'jawi';

  if (raw.includes('dewan sugli') || raw.includes('sugli_daerah') || raw.includes('sugli_wilayah') || raw === 'sugli') return 'sugli';
  if (raw.includes('admin_kwarda') || raw === 'kwarda') return 'kwarda';
  if (raw.includes('super_admin') || raw === 'superadmin') return 'superadmin';
  if (raw.includes('admin_petugas') || raw === 'admin') return 'admin';
  if (raw.includes('admin_diklat') || raw === 'diklat') return 'diklat';
  if (raw === 'umum_pandu') return 'umum_pandu';
  if (raw === 'umum') return 'umum';

  return clean;
};

/**
 * Returns the human-readable display title for any training or role key/param.
 */
export const getTrainingDisplayName = (key?: string): string => {
  if (!key) return '';
  const norm = normalizeTrainingKey(key);
  switch (norm) {
    case 'jati1': return 'Jaya Melati 1';
    case 'jati2': return 'Jaya Melati 2';
    case 'jari1': return 'Jaya Matahari 1';
    case 'jari2': return 'Jaya Matahari 2';
    case 'jawi': return 'Jaya Pertiwi';
    case 'sugli': return 'Dewan Sugli';
    case 'kwarda': return 'Kwarda';
    case 'umum_pandu': return 'Umum Pandu';
    case 'umum': return 'Umum';
    case 'admin': return 'Admin';
    case 'superadmin': return 'Super Admin';
    case 'diklat': return 'Admin Diklat';
    default:
      return key.charAt(0).toUpperCase() + key.slice(1);
  }
};

/**
 * Checks if a member has Jaya Matahari qualification / role (Jari 1, Jari 2, Pelatih Nasional, Pelatih)
 */
export const isJayaMatahariMember = (m: any): boolean => {
  if (!m) return false;

  const targets = [
    'jari1', 'jari2',
    'jayamatahari1', 'jayamatahari2',
    'jaya matahari 1', 'jaya matahari 2',
    'jaya_matahari_1', 'jaya_matahari_2',
    'jari 1', 'jari 2',
    'jaya matahari',
    'pelatih nasional',
    'pelatih'
  ];

  const checkValue = (val: any): boolean => {
    if (!val) return false;
    if (Array.isArray(val)) {
      return val.some(v => checkValue(v));
    }
    if (typeof val === 'string') {
      const lower = val.toLowerCase().trim();
      if (lower.startsWith('[') && lower.endsWith(']')) {
        try {
          const parsed = JSON.parse(val);
          if (Array.isArray(parsed)) return parsed.some(v => checkValue(v));
        } catch (e) {}
      }
      return targets.some(t => lower.includes(t));
    }
    return false;
  };

  return (
    checkValue(m.role) ||
    checkValue(m.roles) ||
    checkValue(m.activeRole) ||
    checkValue(m.golongan) ||
    checkValue(m.golonganPelatih) ||
    checkValue(m.pelatihan) ||
    checkValue(m.pendidikan) ||
    checkValue(m.kategori) ||
    checkValue(m.tingkat) ||
    checkValue(m.tingkatan) ||
    checkValue(m.upgradeRequests) ||
    checkValue(m.pelatihanAkanDiikuti) ||
    checkValue(m.kategoriUndangan)
  );
};

/**
 * Checks if a member has Jaya Melati 1 qualification / role
 */
export const isJayaMelati1Member = (m: any): boolean => {
  if (!m) return false;
  const checkValue = (val: any): boolean => {
    if (!val) return false;
    if (Array.isArray(val)) return val.some(v => checkValue(v));
    if (typeof val === 'string') {
      const lower = val.toLowerCase().trim();
      return lower.includes('jati1') || lower.includes('jati 1') || lower.includes('melati 1') || lower.includes('jayamelati 1') || lower.includes('jayamelati1');
    }
    return false;
  };
  return checkValue(m.role) || checkValue(m.roles) || checkValue(m.pelatihan) || checkValue(m.golongan);
};

/**
 * Checks if a member has Jaya Melati 2 qualification / role
 */
export const isJayaMelati2Member = (m: any): boolean => {
  if (!m) return false;
  const checkValue = (val: any): boolean => {
    if (!val) return false;
    if (Array.isArray(val)) return val.some(v => checkValue(v));
    if (typeof val === 'string') {
      const lower = val.toLowerCase().trim();
      return lower.includes('jati2') || lower.includes('jati 2') || lower.includes('melati 2') || lower.includes('jayamelati 2') || lower.includes('jayamelati2');
    }
    return false;
  };
  return checkValue(m.role) || checkValue(m.roles) || checkValue(m.pelatihan) || checkValue(m.golongan);
};

/**
 * Checks if two training keys / strings refer to the same training level.
 * e.g. isSameTrainingLevel('jayamelati1', 'jati1') => true
 *      isSameTrainingLevel('jaya pertiwi', 'jawi') => true
 */
export const isSameTrainingLevel = (valA?: string, valB?: string): boolean => {
  if (!valA || !valB) return false;
  const normA = normalizeTrainingKey(valA);
  const normB = normalizeTrainingKey(valB);
  return normA !== '' && normA === normB;
};

/**
 * Standard list of training level options for dropdowns, filters, and settings.
 */
export const STANDARD_TRAINING_OPTIONS = [
  { id: 'jati1', paramAlt: 'jayamelati1', title: 'Jaya Melati 1', short: 'Jati 1', fee: 'Rp 50.000' },
  { id: 'jati2', paramAlt: 'jayamelati2', title: 'Jaya Melati 2', short: 'Jati 2', fee: 'Rp 50.000' },
  { id: 'jari1', paramAlt: 'jayamatahari1', title: 'Jaya Matahari 1', short: 'Jari 1', fee: 'Rp 50.000' },
  { id: 'jari2', paramAlt: 'jayamatahari2', title: 'Jaya Matahari 2', short: 'Jari 2', fee: 'Rp 50.000' },
  { id: 'jawi',  paramAlt: 'jayapertiwi',   title: 'Jaya Pertiwi',   short: 'Jawi',   fee: 'Rp 50.000' },
];

/**
 * Default training types list for form selection
 */
export const DEFAULT_TRAINING_TYPES = [
  'Jaya Melati 1',
  'Jaya Melati 2',
  'Jaya Matahari 1',
  'Jaya Matahari 2',
  'Jaya Pertiwi'
];

/**
 * Default upgrade fees configuration
 */
export const DEFAULT_UPGRADE_FEES = [
  { id: 'sugli', label: 'Dewan Sugli', value: 'Rp 0', note: 'Ajuan + SK via WhatsApp' },
  { id: 'kwarda', label: 'Kwarda', value: 'Rp 0', note: 'Ajuan + SK via WhatsApp' },
  { id: 'jati1', label: 'Jaya Melati 1', value: 'Rp 50.000', note: 'Konfirmasi Bayar' },
  { id: 'jati2', label: 'Jaya Melati 2', value: 'Rp 50.000', note: 'Konfirmasi Bayar' },
  { id: 'jari1', label: 'Jaya Matahari 1', value: 'Rp 50.000', note: 'Konfirmasi Bayar' },
  { id: 'jari2', label: 'Jaya Matahari 2', value: 'Rp 50.000', note: 'Konfirmasi Bayar' },
  { id: 'jawi', label: 'Jaya Pertiwi', value: 'Rp 50.000', note: 'Konfirmasi Bayar' },
];

import { normalizeDateForInput } from '../lib/utils';

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
  // Clean brackets, quotes, slashes, and leading/trailing whitespace
  const rawClean = String(str).trim().replace(/^['"\[\]\\]+|['"\[\]\\]+$/g, '').trim();
  const clean = rawClean.toLowerCase().replace(/['"\[\]\\]/g, '').replace(/[\s_-]+/g, '');

  if (clean === 'jayamelati1' || clean === 'jati1' || clean === 'jm1') return 'jati1';
  if (clean === 'jayamelati2' || clean === 'jati2' || clean === 'jm2') return 'jati2';
  if (clean === 'jayamatahari1' || clean === 'jari1') return 'jari1';
  if (clean === 'jayamatahari2' || clean === 'jari2') return 'jari2';
  if (clean === 'jayapertiwi' || clean === 'jawi' || clean === 'pertiwi') return 'jawi';

  // Broader contains check if not exact
  const raw = rawClean.toLowerCase();
  if (raw.includes('jaya melati 1') || raw.includes('jati 1') || raw.includes('jayamelati 1')) return 'jati1';
  if (raw.includes('jaya melati 2') || raw.includes('jati 2') || raw.includes('jayamelati 2')) return 'jati2';
  if (raw.includes('jaya matahari 1') || raw.includes('jari 1') || raw.includes('jayamatahari 1') || raw.includes('jaya rintisan 1')) return 'jari1';
  if (raw.includes('jaya matahari 2') || raw.includes('jari 2') || raw.includes('jayamatahari 2') || raw.includes('jaya rintisan 2')) return 'jari2';
  if (raw.includes('jaya pertiwi') || raw.includes('jayapertiwi') || raw.includes('jawi')) return 'jawi';

  if (raw.includes('dewan sugli') || raw.includes('sugli_daerah') || raw.includes('sugli_wilayah') || clean === 'sugli') return 'sugli';
  if (raw.includes('admin_kwarda') || clean === 'kwarda') return 'kwarda';
  if (raw.includes('super_admin') || clean === 'superadmin') return 'superadmin';
  if (raw.includes('admin_petugas') || clean === 'admin') return 'admin';
  if (raw.includes('admin_diklat') || clean === 'diklat') return 'diklat';
  if (clean === 'umum_pandu' || clean === 'umum') return 'umum';

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

/**
 * Standard training options in Pelatihan Diikuti UI
 */
export const PELATIHAN_OPTIONS = [
  { key: 'Jati 1', label: 'Jaya Melati 1 (Jati 1)', roleKey: 'jati1' },
  { key: 'Jati 2', label: 'Jaya Melati 2 (Jati 2)', roleKey: 'jati2' },
  { key: 'Jari 1', label: 'Jaya Matahari 1 (Jari 1)', roleKey: 'jari1' },
  { key: 'Jari 2', label: 'Jaya Matahari 2 (Jari 2)', roleKey: 'jari2' },
  { key: 'Jawi',   label: 'Jaya Pertiwi (Jawi)',   roleKey: 'jawi'  }
];

/**
 * Checks if a specific training item is selected in a member's pelatihan array.
 */
export const isPelatihanSelected = (pelatihanList: string[] = [], key: string): boolean => {
  if (!Array.isArray(pelatihanList) || pelatihanList.length === 0) return false;
  const cleanKey = key.toLowerCase().trim();
  return pelatihanList.some((p: string) => {
    const cleanP = String(p).toLowerCase().trim();
    if (cleanP === cleanKey) return true;
    if (cleanKey === 'jati 1' && (cleanP.includes('jati 1') || cleanP.includes('jati1') || cleanP.includes('melati 1') || cleanP.includes('melati1'))) return true;
    if (cleanKey === 'jati 2' && (cleanP.includes('jati 2') || cleanP.includes('jati2') || cleanP.includes('melati 2') || cleanP.includes('melati2'))) return true;
    if (cleanKey === 'jari 1' && (cleanP.includes('jari 1') || cleanP.includes('jari1') || cleanP.includes('matahari 1') || cleanP.includes('matahari1'))) return true;
    if (cleanKey === 'jari 2' && (cleanP.includes('jari 2') || cleanP.includes('jari2') || cleanP.includes('matahari 2') || cleanP.includes('matahari2'))) return true;
    if (cleanKey === 'jawi' && (cleanP.includes('jawi') || cleanP.includes('pertiwi') || cleanP.includes('wisata'))) return true;
    return false;
  });
};

/**
 * Synchronizes roles and pelatihan arrays bidirectionally so that:
 * 1. Hak Akses (Role) automatically grants & checks the corresponding training in Pelatihan Diikuti.
 * 2. Any training in Pelatihan Diikuti is reflected in Hak Akses (Role) without ambiguity.
 */
export const syncRolesAndPelatihan = (
  rawRoles: any,
  rawPelatihan: any,
  explicitPrimaryRole?: string
): { roles: string[]; pelatihan: string[]; primaryRole: string } => {
  const rolesSet = new Set<string>();

  const addRole = (r: any) => {
    if (!r) return;
    if (Array.isArray(r)) {
      r.forEach(addRole);
    } else if (typeof r === 'string') {
      const trimmed = r.trim();
      if (!trimmed) return;
      if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
        try {
          const parsed = JSON.parse(trimmed);
          if (Array.isArray(parsed)) {
            parsed.forEach(addRole);
            return;
          }
        } catch (e) {}
      }
      trimmed.split(',').forEach(s => {
        const norm = normalizeTrainingKey(s);
        if (norm) rolesSet.add(norm);
      });
    } else {
      const norm = normalizeTrainingKey(String(r));
      if (norm) rolesSet.add(norm);
    }
  };
  addRole(rawRoles);
  if (explicitPrimaryRole) {
    addRole(explicitPrimaryRole);
  }

  const pelatihanSet = new Set<string>();
  const addPelatihan = (p: any) => {
    if (!p) return;
    if (Array.isArray(p)) {
      p.forEach(addPelatihan);
    } else if (typeof p === 'string') {
      const trimmed = p.trim();
      if (!trimmed) return;
      if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
        try {
          const parsed = JSON.parse(trimmed);
          if (Array.isArray(parsed)) {
            parsed.forEach(addPelatihan);
            return;
          }
        } catch (e) {}
      }
      trimmed.split(',').forEach(s => {
        const clean = s.trim().replace(/^['"\[\]\\]+|['"\[\]\\]+$/g, '').trim();
        if (clean) pelatihanSet.add(clean);
      });
    } else {
      const clean = String(p).trim();
      if (clean) pelatihanSet.add(clean);
    }
  };
  addPelatihan(rawPelatihan);

  // 1. Sync from roles to pelatihan (Role Hak Akses -> Pelatihan Diikuti)
  rolesSet.forEach(r => {
    const cleanR = r.toLowerCase().trim();
    if (cleanR === 'jati1' || cleanR === 'jaya_melati_1' || cleanR === 'jayamelati1' || cleanR.includes('melati 1') || cleanR.includes('jati 1')) {
      if (!Array.from(pelatihanSet).some(p => isPelatihanSelected([p], 'Jati 1'))) {
        pelatihanSet.add('Jati 1');
      }
    }
    if (cleanR === 'jati2' || cleanR === 'jaya_melati_2' || cleanR === 'jayamelati2' || cleanR.includes('melati 2') || cleanR.includes('jati 2')) {
      if (!Array.from(pelatihanSet).some(p => isPelatihanSelected([p], 'Jati 2'))) {
        pelatihanSet.add('Jati 2');
      }
    }
    if (cleanR === 'jari1' || cleanR === 'jaya_matahari_1' || cleanR === 'jayamatahari1' || cleanR.includes('matahari 1') || cleanR.includes('jari 1')) {
      if (!Array.from(pelatihanSet).some(p => isPelatihanSelected([p], 'Jari 1'))) {
        pelatihanSet.add('Jari 1');
      }
    }
    if (cleanR === 'jari2' || cleanR === 'jaya_matahari_2' || cleanR === 'jayamatahari2' || cleanR.includes('matahari 2') || cleanR.includes('jari 2')) {
      if (!Array.from(pelatihanSet).some(p => isPelatihanSelected([p], 'Jari 2'))) {
        pelatihanSet.add('Jari 2');
      }
    }
    if (cleanR === 'jawi' || cleanR === 'jaya_pertiwi' || cleanR === 'jayapertiwi' || cleanR.includes('pertiwi')) {
      if (!Array.from(pelatihanSet).some(p => isPelatihanSelected([p], 'Jawi'))) {
        pelatihanSet.add('Jawi');
      }
    }
  });

  // 2. Sync from pelatihan to roles (Pelatihan Diikuti -> Hak Akses Role)
  pelatihanSet.forEach(p => {
    const cleanP = p.toLowerCase().trim();
    if (cleanP.includes('jati 1') || cleanP.includes('melati 1') || cleanP === 'jati1') {
      rolesSet.add('jati1');
    }
    if (cleanP.includes('jati 2') || cleanP.includes('melati 2') || cleanP === 'jati2') {
      rolesSet.add('jati2');
    }
    if (cleanP.includes('jari 1') || cleanP.includes('matahari 1') || cleanP === 'jari1') {
      rolesSet.add('jari1');
    }
    if (cleanP.includes('jari 2') || cleanP.includes('matahari 2') || cleanP === 'jari2') {
      rolesSet.add('jari2');
    }
    if (cleanP.includes('jawi') || cleanP.includes('pertiwi')) {
      rolesSet.add('jawi');
    }
  });

  if (rolesSet.size === 0) rolesSet.add('umum');

  const finalRoles = Array.from(rolesSet);
  let primaryRole = 'umum';

  // If explicit primary role was given and exists in finalRoles, prioritize it
  const normExplicit = explicitPrimaryRole ? normalizeTrainingKey(explicitPrimaryRole) : '';
  if (normExplicit && finalRoles.includes(normExplicit)) {
    primaryRole = normExplicit;
  } else {
    const rolePriority = ['superadmin', 'admin', 'diklat', 'admin_diklat', 'kwarda', 'admin_kwarda', 'sugli', 'dewan_sugli', 'jari2', 'jari1', 'jati2', 'jati1', 'jawi', 'umum'];
    for (const pr of rolePriority) {
      if (finalRoles.includes(pr)) {
        primaryRole = pr;
        break;
      }
    }
  }

  return {
    roles: finalRoles,
    pelatihan: Array.from(pelatihanSet),
    primaryRole
  };
};

/**
 * Normalizes participant name for deduplication & matching.
 * Strips punctuation (such as apostrophes like "Nida'"), whitespace, and lowercases.
 */
export const normalizeParticipantName = (name?: string): string => {
  if (!name) return '';
  return String(name)
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .trim();
};

/**
 * Checks if two training application objects belong to the exact same person and training program.
 */
export const isSameTrainingParticipant = (a: any, b: any): boolean => {
  if (!a || !b) return false;
  
  // 1. Program check
  const progA = normalizeTrainingKey(a.pelatihanAkanDiikuti || a.jenisPelatihan || a.tingkatan || 'jati1');
  const progB = normalizeTrainingKey(b.pelatihanAkanDiikuti || b.jenisPelatihan || b.tingkatan || 'jati1');
  if (progA && progB && progA !== progB) {
    return false;
  }

  // 2. Explicit distinct check: if both records have different non-empty user IDs, they are distinct!
  const uidA = String(a.userId || '').trim();
  const uidB = String(b.userId || '').trim();
  if (uidA && uidB && uidA !== uidB) {
    return false;
  }

  // 3. Explicit distinct check: if both records have different real emails, they are distinct!
  const emailA = String(a.email || '').toLowerCase().trim();
  const emailB = String(b.email || '').toLowerCase().trim();
  if (emailA && emailB && emailA.includes('@') && emailB.includes('@') && emailA !== emailB) {
    return false;
  }

  // 4. Explicit distinct check: if both records have different valid phone numbers, they are distinct!
  const phoneA = String(a.noWa || a.noHp || '').replace(/[^0-9]/g, '');
  const phoneB = String(b.noWa || b.noHp || '').replace(/[^0-9]/g, '');
  if (phoneA && phoneB && phoneA.length >= 8 && phoneB.length >= 8 && phoneA !== phoneB) {
    return false;
  }

  // 5. Direct ID match
  if (a.id && b.id && String(a.id).trim() === String(b.id).trim()) return true;

  // 6. User ID match
  if (uidA && uidB && uidA === uidB) return true;

  // 7. Email match
  if (emailA && emailB && emailA.includes('@') && emailA === emailB) return true;

  // 8. NBM / KTA number match
  const nbmA = String(a.nbm || a.ktaNumber || a.nomorKTA || '').replace(/[^0-9]/g, '');
  const nbmB = String(b.nbm || b.ktaNumber || b.nomorKTA || '').replace(/[^0-9]/g, '');
  if (nbmA && nbmB && nbmA.length >= 4 && nbmA === nbmB) return true;

  // 9. WhatsApp / Phone number match
  if (phoneA && phoneB && phoneA.length >= 8 && phoneA === phoneB) return true;

  // 10. Full name match (only if no conflicting email/phone/uid)
  const nameA = normalizeParticipantName(a.nama || a.namaLengkap);
  const nameB = normalizeParticipantName(b.nama || b.namaLengkap);
  if (nameA && nameB && nameA.length >= 4 && nameA === nameB) {
    return true;
  }

  return false;
};

/**
 * Consolidates and merges a raw array of training applications into unique, deduplicated participants.
 * Automatically deep-merges attendance, assignments, and test scores.
 */
export const consolidateTrainingApplications = (rawApps: any[]): any[] => {
  if (!Array.isArray(rawApps) || rawApps.length === 0) return [];

  const sysEmails = ['admin@hwjateng.com', 'materihw@gmail.com', 'medkom@hwjateng.com', 'admin@hw.org'];
  const clusters: any[][] = [];

  for (const raw of rawApps) {
    if (!raw) continue;
    const name = String(raw.nama || raw.namaLengkap || '').trim();
    const email = String(raw.email || '').toLowerCase().trim();

    // Filter out obvious invalid / system entries
    if (sysEmails.includes(email)) continue;
    if (!name || name === '-' || name.toLowerCase() === 'tanpa nama' || name.includes('@')) continue;
    if (raw.status === 'deleted') continue;
    if (raw.id && (String(raw.id).startsWith('training-100') || String(raw.id).startsWith('train-api-placeholder'))) continue;

    // Find existing cluster
    const foundCluster = clusters.find(cluster => 
      cluster.some(item => isSameTrainingParticipant(item, raw))
    );

    if (foundCluster) {
      foundCluster.push(raw);
    } else {
      clusters.push([raw]);
    }
  }

  // Merge each cluster into a single consolidated record
  return clusters.map(cluster => {
    // Priority ordering for base object (prefer approved/terverifikasi with photo/id/preTestScore)
    const sorted = [...cluster].sort((a, b) => {
      const scoreStatus = (s: string) => (s === 'approved' || s === 'terverifikasi' || s === 'disetujui') ? 3 : s === 'pending' ? 2 : 1;
      const sa = scoreStatus(a.status) + (a.photo ? 1 : 0) + (a.preTestScore !== undefined ? 1 : 0) + (a.postTestScore !== undefined ? 1 : 0);
      const sb = scoreStatus(b.status) + (b.photo ? 1 : 0) + (b.preTestScore !== undefined ? 1 : 0) + (b.postTestScore !== undefined ? 1 : 0);
      return sb - sa;
    });

    const base = { ...sorted[0] };

    // Deep merge fields
    const mergedKehadiranObj: Record<string, any> = {};
    const mergedTasksList: any[] = [];
    let mergedPreScore: any = undefined;
    let mergedPreData: any = '';
    let mergedPreSubmittedAt: any = '';
    let mergedPostScore: any = undefined;
    let mergedPostData: any = '';
    let mergedPostSubmittedAt: any = '';
    let bestPhoto = '';
    let bestUserId = '';
    let bestEmail = '';
    let bestNoWa = '';
    let bestNbm = '';
    let bestKta = '';
    let bestAsalDaerah = '';
    let bestTempatLahir = '';
    let bestTanggalLahir = '';
    let bestJenisKelamin = '';
    let bestQabilah = '';
    let bestNilai = '';
    let bestRemark = '';
    let bestStatusKelulusan = '';

    for (const item of cluster) {
      if (!bestPhoto && item.photo) bestPhoto = item.photo;
      if (!bestUserId && item.userId) bestUserId = item.userId;
      if (!bestEmail && item.email && item.email.includes('@')) bestEmail = item.email;
      if (!bestNoWa && (item.noWa || item.noHp)) bestNoWa = item.noWa || item.noHp;
      if (!bestNbm && item.nbm) bestNbm = item.nbm;
      if (!bestKta && (item.ktaNumber || item.nomorKTA)) bestKta = item.ktaNumber || item.nomorKTA;
      if (!bestAsalDaerah && item.asalDaerah) bestAsalDaerah = item.asalDaerah;
      if (!bestTempatLahir && (item.tempatLahir || (item as any)?.tempatlahir)) bestTempatLahir = item.tempatLahir || (item as any)?.tempatlahir;
      if (!bestTanggalLahir && (item.tanggalLahir || (item as any)?.tanggallahir)) bestTanggalLahir = item.tanggalLahir || (item as any)?.tanggallahir;
      if (!bestJenisKelamin && item.jenisKelamin) bestJenisKelamin = item.jenisKelamin;
      if (!bestQabilah && item.qabilah) bestQabilah = item.qabilah;
      if (!bestNilai && item.nilai) bestNilai = item.nilai;
      if (!bestRemark && item.remark) bestRemark = item.remark;

      // Kelulusan priority
      if (item.statusKelulusan === 'Lulus') bestStatusKelulusan = 'Lulus';
      else if (!bestStatusKelulusan && item.statusKelulusan) bestStatusKelulusan = item.statusKelulusan;

      // Extract Pre Test Score & Data
      if (mergedPreScore === undefined) {
        if (item.preTestScore !== undefined && item.preTestScore !== null && item.preTestScore !== '') {
          mergedPreScore = Number(item.preTestScore);
        } else if (item.preTestData) {
          try {
            const pObj = typeof item.preTestData === 'string' ? JSON.parse(item.preTestData) : item.preTestData;
            if (pObj && pObj.score !== undefined && pObj.score !== null) mergedPreScore = Number(pObj.score);
          } catch (e) {}
        }
      }
      if (!mergedPreData && item.preTestData) mergedPreData = item.preTestData;
      if (!mergedPreSubmittedAt && item.preTestSubmittedAt) mergedPreSubmittedAt = item.preTestSubmittedAt;

      // Extract Post Test Score & Data
      if (mergedPostScore === undefined) {
        if (item.postTestScore !== undefined && item.postTestScore !== null && item.postTestScore !== '') {
          mergedPostScore = Number(item.postTestScore);
        } else if (item.postTestData) {
          try {
            const pObj = typeof item.postTestData === 'string' ? JSON.parse(item.postTestData) : item.postTestData;
            if (pObj && pObj.score !== undefined && pObj.score !== null) mergedPostScore = Number(pObj.score);
          } catch (e) {}
        }
      }
      if (!mergedPostData && item.postTestData) mergedPostData = item.postTestData;
      if (!mergedPostSubmittedAt && item.postTestSubmittedAt) mergedPostSubmittedAt = item.postTestSubmittedAt;

      // Merge Attendance (Kehadiran)
      if (item.kehadiran) {
        try {
          const kObj = typeof item.kehadiran === 'string' ? JSON.parse(item.kehadiran) : item.kehadiran;
          if (kObj && typeof kObj === 'object') {
            Object.assign(mergedKehadiranObj, kObj);
          }
        } catch (e) {}
      }

      // Merge Assignments (Tugas)
      if (item.tugas) {
        try {
          const tArr = Array.isArray(item.tugas) ? item.tugas : JSON.parse(item.tugas);
          if (Array.isArray(tArr)) {
            tArr.forEach((t: any) => {
              if (t && (t.title || t.id || t.link)) {
                const key = t.title || t.id || t.link;
                if (!mergedTasksList.some(x => (x.title || x.id || x.link) === key)) {
                  mergedTasksList.push(t);
                }
              }
            });
          }
        } catch (e) {}
      }
    }

    const resolvedTempat = (bestTempatLahir || base.tempatLahir || (base as any)?.tempatlahir || '').trim();
    const resolvedTanggal = normalizeDateForInput(bestTanggalLahir || base.tanggalLahir || (base as any)?.tanggallahir || '');

    return {
      ...base,
      pelatihanAkanDiikuti: base.pelatihanAkanDiikuti || 'Pelatihan Jaya Melati 1 Solo',
      tingkatan: base.tingkatan || 'Jaya Melati 1',
      lokasiPelatihan: base.lokasiPelatihan || 'Kwarda HW Solo',
      tanggalPelatihan: base.tanggalPelatihan || '22 - 23 Agustus dan 11 - 13 September 2026',
      biayaPelatihan: base.biayaPelatihan || 'Rp 550.000',
      rekeningPembiayaan: base.rekeningPembiayaan || 'BNI 0282085562 a.n. Laily Purnamawati',
      photo: bestPhoto || base.photo || '',
      userId: bestUserId || base.userId,
      email: bestEmail || base.email,
      noWa: bestNoWa || base.noWa || base.noHp,
      noHp: bestNoWa || base.noHp || base.noWa,
      tempatLahir: resolvedTempat,
      tanggalLahir: resolvedTanggal,
      jenisKelamin: bestJenisKelamin || base.jenisKelamin || 'L',
      qabilah: bestQabilah || base.qabilah || '',
      nbm: bestNbm || base.nbm || '',
      ktaNumber: bestKta || base.ktaNumber || base.nomorKTA || '',
      nomorKTA: bestKta || base.nomorKTA || base.ktaNumber || '',
      asalDaerah: bestAsalDaerah || base.asalDaerah || 'Jawa Tengah',
      nilai: bestNilai || base.nilai || '',
      remark: bestRemark || base.remark || '',
      statusKelulusan: bestStatusKelulusan || base.statusKelulusan || 'Proses Pelatihan',
      preTestScore: mergedPreScore !== undefined ? mergedPreScore : base.preTestScore,
      preTestData: mergedPreData || base.preTestData || (mergedPreScore !== undefined ? JSON.stringify({ testType: 'pre_test', score: mergedPreScore, answers: {}, submittedAt: mergedPreSubmittedAt || 'Selesai' }) : ''),
      preTestSubmittedAt: mergedPreSubmittedAt || base.preTestSubmittedAt || '',
      postTestScore: mergedPostScore !== undefined ? mergedPostScore : base.postTestScore,
      postTestData: mergedPostData || base.postTestData || (mergedPostScore !== undefined ? JSON.stringify({ testType: 'post_test', score: mergedPostScore, answers: {}, submittedAt: mergedPostSubmittedAt || 'Selesai' }) : ''),
      postTestSubmittedAt: mergedPostSubmittedAt || base.postTestSubmittedAt || '',
      kehadiran: Object.keys(mergedKehadiranObj).length > 0 ? JSON.stringify(mergedKehadiranObj) : (base.kehadiran || '{}'),
      tugas: mergedTasksList.length > 0 ? JSON.stringify(mergedTasksList) : (base.tugas || '[]')
    };
  });
};

export const DEFAULT_JM1_SOLO_ACTIVITY = {
  id: 'act-jm1-solo',
  namaKegiatan: 'Pelatihan Jaya Melati 1 Solo',
  jenisPelatihan: 'Jaya Melati 1',
  tingkatan: 'Jaya Melati 1',
  kategori: 'Pelatihan Jaya Melati 1 Solo',
  lokasiPelatihan: 'Kwarda HW Solo',
  lokasi: 'Kwarda HW Solo',
  tanggalPelatihan: '22 - 23 Agustus dan 11 - 13 September 2026',
  tanggal: '22 - 23 Agustus dan 11 - 13 September 2026',
  biayaPelatihan: 'Rp 550.000',
  biaya: 'Rp 550.000',
  status: 'Buka',
  deskripsi: 'Pelatihan Jaya Melati 1 Kwarda HW Solo',
  rekeningPembiayaan: 'BNI 0282085562 a.n. Laily Purnamawati',
  rekeningPembayaran: 'BNI 0282085562 a.n. Laily Purnamawati',
  namaPelatih: 'Muhammad Dzikron, Eni Winarti, Wahyu Dewayanto, Dwi Suparwanto, Agus Dwi Setiawan, Puryadi',
  asistenPelatih: 'Retiana Maharani',
  noWhatsappPanitia: '089688754000'
};

export const migrateParticipantToJayaMelati1Solo = (p: any): any => {
  if (!p) return p;
  return {
    ...p,
    pelatihanAkanDiikuti: 'Pelatihan Jaya Melati 1 Solo',
    jenisPelatihan: 'Jaya Melati 1',
    tingkatan: p.tingkatan || 'Jaya Melati 1',
    namaKegiatan: 'Pelatihan Jaya Melati 1 Solo',
    lokasiPelatihan: 'Kwarda HW Solo',
    tanggalPelatihan: '22 - 23 Agustus dan 11 - 13 September 2026',
    biayaPelatihan: p.biayaPelatihan || 'Rp 550.000',
    rekeningPembiayaan: p.rekeningPembiayaan || 'BNI 0282085562 a.n. Laily Purnamawati'
  };
};


import { KWARDA_QABILAH_JATENG, getKwardaCode, parseKtaNumber } from './ktaUtils';
import { User, KwardaPtmaEntity, OrganizationEntityType } from '../types';

/**
 * Single Source of Truth for Kwarda & Qabilah PTMA Master Data.
 * Directly derived from existing KTA Master list (KWARDA_QABILAH_JATENG).
 * Preserves strict natural KTA sequence ordering (01 to 58).
 */
export function getKwardaPtmaMasterList(): KwardaPtmaEntity[] {
  return KWARDA_QABILAH_JATENG.map((item, index) => {
    const numCode = parseInt(item.code, 10);
    const type: OrganizationEntityType = numCode <= 35 ? 'Kwarda' : 'Qabilah PTMA';
    return {
      code: item.code,
      ktaCode: `11.${item.code}`,
      name: item.name,
      type,
      order: index + 1
    };
  });
}

export function getKwardaPtmaByCode(code?: string): KwardaPtmaEntity | null {
  if (!code) return null;
  const list = getKwardaPtmaMasterList();
  const normalized = code.trim().padStart(2, '0');
  return list.find(item => item.code === normalized || item.code === code.trim()) || null;
}

/**
 * Resolves user's access rights for Kwarda / Qabilah PTMA module.
 * Returns:
 * - isSuperAdmin: boolean (can view & manage all 58 orgs)
 * - isOrgAdmin: boolean (can view & manage their own org)
 * - assignedOrg: KwardaPtmaEntity | null
 * - canAccessModule: boolean
 */
export function resolveUserOrgAccess(user: User | null): {
  isSuperAdmin: boolean;
  isOrgAdmin: boolean;
  assignedOrg: KwardaPtmaEntity | null;
  canAccessModule: boolean;
} {
  if (!user) {
    return {
      isSuperAdmin: false,
      isOrgAdmin: false,
      assignedOrg: null,
      canAccessModule: false
    };
  }

  // 1. Super Admin & Full Admin check
  const isSuperAdmin = 
    user.role === 'superadmin' || 
    user.role === 'admin' ||
    user.activeRole === 'superadmin' ||
    user.activeRole === 'admin';

  if (isSuperAdmin) {
    return {
      isSuperAdmin: true,
      isOrgAdmin: false,
      assignedOrg: null,
      canAccessModule: true
    };
  }

  // 2. Kwarda / Qabilah PTMA Role check
  const userRolesList = [
    ...(Array.isArray(user.roles) ? user.roles : []),
    user.role,
    user.activeRole
  ].filter(Boolean).map(r => String(r).toLowerCase().trim());

  const hasKwardaRole = userRolesList.some(r => 
    r === 'kwarda' || 
    r === 'admin_kwarda' || 
    r === 'qabilah' || 
    r === 'qabilah_ptma' ||
    r === 'ptma'
  );

  // If user doesn't have kwarda or admin role, check if they have specific assigned region
  const rawRegion = (user as any).asalKwarda || (user as any).asalDaerah || user.qabilah || (user as any).asalQabilah || (user as any).kodeKwarda;
  
  // Resolve code from user attributes
  let resolvedCode: string | null = null;
  
  // 1. Check Qabilah PTMA / Qabilah origin first
  const rawQabilah = user.qabilah || (user as any).asalQabilah;
  const rawKwarda = user.asalKwarda || (user as any).asalDaerah;

  if (rawQabilah) {
    const qCode = getKwardaCode(rawQabilah);
    if (qCode && parseInt(qCode, 10) >= 36) {
      resolvedCode = qCode;
    }
  }

  // 2. Check asalKwarda / asalDaerah
  if (!resolvedCode && rawKwarda) {
    resolvedCode = getKwardaCode(rawKwarda, rawQabilah);
  }

  // 3. Check kodeKwarda directly
  if (!resolvedCode && (user as any).kodeKwarda) {
    resolvedCode = String((user as any).kodeKwarda).padStart(2, '0');
  }

  // 4. Check KTA number
  if (!resolvedCode && (user.ktaNumber || (user as any).nomorKTA)) {
    const parsedKta = parseKtaNumber(user.ktaNumber || (user as any).nomorKTA);
    if (parsedKta && parsedKta.kodeKwarda) {
      resolvedCode = parsedKta.kodeKwarda;
    }
  }

  // 5. Fallback check rawQabilah for general kwarda match
  if (!resolvedCode && rawQabilah) {
    resolvedCode = getKwardaCode(rawQabilah);
  }

  const assignedOrg = getKwardaPtmaByCode(resolvedCode || undefined);

  // If user has kwarda role AND an assigned org, they are an authorized Org Admin strictly for that org
  if (hasKwardaRole && assignedOrg) {
    return {
      isSuperAdmin: false,
      isOrgAdmin: true,
      assignedOrg,
      canAccessModule: true
    };
  }

  // Fallback: If user has kwarda role without explicit region in profile
  if (hasKwardaRole) {
    const fallbackOrg = assignedOrg || getKwardaPtmaByCode('01');
    return {
      isSuperAdmin: false,
      isOrgAdmin: true,
      assignedOrg: fallbackOrg,
      canAccessModule: true
    };
  }

  return {
    isSuperAdmin: false,
    isOrgAdmin: false,
    assignedOrg: null,
    canAccessModule: false
  };
}

/**
 * Checks if user is permitted to manage a specific organization.
 */
export function canUserManageOrg(user: User | null, orgCode: string): boolean {
  if (!user || !orgCode) return false;
  const access = resolveUserOrgAccess(user);
  if (access.isSuperAdmin) return true;
  if (access.isOrgAdmin && access.assignedOrg && access.assignedOrg.code === orgCode) {
    return true;
  }
  return false;
}

/**
 * Validates Google Drive or standard document/web URLs safely.
 */
export function isValidProposalUrl(url?: string): boolean {
  if (!url) return false;
  const trimmed = url.trim();
  if (!trimmed) return false;
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Common Jabatan suggestions with free custom typing support
 */
export const SUGGESTED_JABATAN_KWARDA = [
  'Ketua Kwarda',
  'Wakil Ketua I',
  'Wakil Ketua II',
  'Wakil Ketua III',
  'Sekretaris',
  'Wakil Sekretaris',
  'Bendahara',
  'Wakil Bendahara',
  'Ketua Bidang Organisasi',
  'Ketua Bidang Pendidikan & Pelatihan (Diklat)',
  'Ketua Bidang Kegiatan & Pengabdian Masyarakat',
  'Ketua Bidang Sarana & Prasarana',
  'Ketua Bidang Hubungan Masyarakat & Publikasi',
  'Anggota Bidang Organisasi',
  'Anggota Bidang Diklat',
  'Anggota Bidang Kegiatan',
  'Anggota Pleno'
];

export const SUGGESTED_JABATAN_PTMA = [
  'Ketua Qabilah PTMA',
  'Wakil Ketua Qabilah',
  'Sekretaris Qabilah',
  'Wakil Sekretaris',
  'Bendahara Qabilah',
  'Wakil Bendahara',
  'Ketua Bidang Pembinaan Anggota',
  'Ketua Bidang Diklat & Kepelatihan',
  'Ketua Bidang Hubungan Antar Lembaga & Humas',
  'Ketua Bidang Pengabdian Masyarakat & Logistik',
  'Anggota Pengurus'
];

export const SUGGESTED_JABATAN_SUGLI = [
  'Ketua Dewan Sugli / Kafilah',
  'Wakil Ketua',
  'Sekretaris',
  'Wakil Sekretaris',
  'Bendahara',
  'Ketua Bidang Kajian Kepanduan',
  'Ketua Bidang Giat Operasional',
  'Ketua Bidang Pengabdian Masyarakat',
  'Anggota Dewan Sugli / Kafilah'
];

export const SUGGESTED_JENIS_KEGIATAN = [
  'Musyawarah Daerah (Musyda)',
  'Musyawarah Qabilah (Musyqab)',
  'Rapat Kerja Daerah (Rakerda)',
  'Pelatihan Jaya Melati 1 (JM1)',
  'Pelatihan Jaya Melati 2 (JM2)',
  'Perkemahan Akbar / Camp HW',
  'Jambore Daerah Hizbul Wathan',
  'Lomba Ketangkasan & Keterampilan Pandu',
  'Pengkaderan Tingkat Dasar',
  'Kegiatan Bakti Sosial & Siaga Bencana',
  'Apel Milad Hizbul Wathan',
  'Workshop & Diskusi Kepanduan',
  'Penerimaan Anggota Baru (PAB)'
];

export const SUGGESTED_KATEGORI_MATERI = [
  'Kepanduan HW',
  'Al-Islam & Kemuhammadiyahan',
  'Administrasi & Keorganisasian',
  'Kepelatihan & Diklat',
  'Pedoman & Petunjuk Teknis',
  'Lagu & Mars HW',
  'Bahan Musyawarah & Raker',
  'Bahan Ajar Qabilah',
  'Lainnya'
];

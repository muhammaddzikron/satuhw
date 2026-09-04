export const isParticipantOfActivity = (app: any, activity: any): boolean => {
  if (!app) return false;
  if (!activity || activity === 'semua') return true;

  const targetActId = String(typeof activity === 'string' ? activity : (activity?.id || '')).trim().toLowerCase();
  if (!targetActId || targetActId === 'semua') return true;

  const appActId = String(app.activityId || app.activity_id || app.kegiatanId || app.idKegiatan || '').trim().toLowerCase();

  // 1. Direct ID match
  if (appActId && appActId === targetActId) return true;

  // 2. Legacy alias check for default Silaturahmi Pelatih activity
  if (
    (appActId === 'keg-silaturahmi-pelatih' || appActId === 'keg-1') &&
    (targetActId === 'keg-silaturahmi-pelatih' || targetActId === 'keg-1')
  ) {
    return true;
  }

  // 3. Strict separation: If both appActId and targetActId exist and differ, they belong to different activities
  if (appActId && targetActId && appActId !== targetActId) {
    return false;
  }

  // 4. Fallback matching by exact activity title if app has no activityId set
  const actObj = typeof activity === 'object' ? activity : null;
  const appTitle = String(app.namaKegiatan || app.activityTitle || app.title || '').trim().toLowerCase();
  const actTitle = actObj
    ? String(actObj.namaKegiatan || actObj.title || actObj.jenisPelatihan || '').trim().toLowerCase()
    : targetActId;

  if (appTitle && actTitle) {
    if (appTitle === actTitle) return true;
    const cleanApp = appTitle.replace(/[^a-z0-9]/g, '');
    const cleanAct = actTitle.replace(/[^a-z0-9]/g, '');
    if (cleanApp && cleanAct && cleanApp === cleanAct && cleanApp.length >= 5) {
      return true;
    }
  }

  return false;
};

export const extractYoutubeId = (rawUrl: any): string => {
  if (!rawUrl || typeof rawUrl !== 'string') return '';
  let url = rawUrl.trim();
  if (!url) return '';

  // Extract from iframe tag if passed
  if (url.includes('<iframe') && url.includes('src=')) {
    const srcMatch = url.match(/src=["']([^"']+)["']/);
    if (srcMatch && srcMatch[1]) url = srcMatch[1];
  }

  // Regex covering watch?v=, youtu.be/, embed/, shorts/, live/, v/
  const ytRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=|shorts\/|live\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/i;
  const match = url.match(ytRegex);
  if (match && match[1]) {
    return match[1];
  }

  // Fallback: check if plain 11-char ID is passed
  if (/^[a-zA-Z0-9_-]{11}$/.test(url)) {
    return url;
  }

  return '';
};

export const isOnlyTrainingActivity = (act: any): boolean => {
  if (!act) return false;

  const id = String(act.id || '').toLowerCase().trim();
  // 1. Explicitly known Kegiatan IDs
  if (id === 'keg-silaturahmi-pelatih' || id === 'keg-1') {
    return false;
  }

  // 2. Explicit boolean flag
  if (act.isPelatihan === false) return false;
  if (act.isPelatihan === true) return true;

  const cat = String(act.kategori || act.category || '').toLowerCase().trim();
  const name = String(act.namaKegiatan || act.title || '').toLowerCase().trim();
  const jenis = String(act.jenisPelatihan || act.pelatihanAkanDiikuti || '').toLowerCase().trim();
  const loc = String(act.lokasi || act.lokasiPelatihan || act.location || '').toLowerCase().trim();

  // 3. Gathering / Silaturahmi / General Activity Categories & Titles
  const isSilaturahmiOrGathering =
    cat === 'silaturahmi' ||
    cat === 'rapat' ||
    cat === 'rapat hw' ||
    cat === 'perkemahan' ||
    cat === 'musyawarah' ||
    cat === 'lomba' ||
    cat === 'pertemuan' ||
    cat === 'kegiatan' ||
    cat === 'umum' ||
    cat === 'kegiatan umum' ||
    cat === 'raker' ||
    cat === 'rakerwil' ||
    cat === 'muswil' ||
    cat === 'musda' ||
    name.includes('silaturahmi') ||
    name.includes('pertemuan silaturahmi') ||
    name.includes('temu alumni') ||
    name.includes('reuni') ||
    name.includes('pandu senior');

  if (isSilaturahmiOrGathering && !cat.includes('pelatihan') && !cat.includes('diklat')) {
    return false;
  }

  // 4. Explicit training category
  if (
    cat === 'pelatihan' ||
    cat === 'diklat' ||
    cat === 'kegiatan pelatihan' ||
    cat === 'pelatihan hw' ||
    cat === 'diklat hw'
  ) {
    return true;
  }

  // 5. Training keywords in name, jenisPelatihan, or location
  const hasTrainingName = 
    name.includes('pelatihan') ||
    name.includes('diklat') ||
    name.includes('jaya melati') ||
    name.includes('jaya matahari') ||
    name.includes('taruna melati') ||
    name.includes('jaya pertiwi') ||
    name.includes('kursus pembina') ||
    name.includes('kursus pelatih') ||
    name.includes('kpd') ||
    name.includes('kpl') ||
    name.includes('training') ||
    name.includes('jml') ||
    name.includes('jmt') ||
    name.includes('jati') ||
    name.includes('jari') ||
    ((name.includes('solo') || name.includes('surakarta') || loc.includes('solo') || loc.includes('surakarta')) && (name.includes('pembina') || name.includes('pelatih') || name.includes('pandu')));

  const hasTrainingJenis = 
    jenis.includes('jaya melati') ||
    jenis.includes('jaya matahari') ||
    jenis.includes('taruna melati') ||
    jenis.includes('jaya pertiwi') ||
    jenis.includes('jati') ||
    jenis.includes('jari') ||
    jenis.includes('pelatihan') ||
    jenis.includes('diklat');

  if (hasTrainingName || hasTrainingJenis) {
    if (name.includes('silaturahmi') || name.includes('alumni') || name.includes('pertemuan')) {
      return false;
    }
    return true;
  }

  return false;
};

const dateParseCache = new Map<string, number>();

export const parseDateToTimestamp = (d: any): number => {
  if (!d) return 0;
  if (typeof d === 'number') return d;
  if (d instanceof Date) return isNaN(d.getTime()) ? 0 : d.getTime();
  const str = String(d).trim();
  if (!str) return 0;

  const cached = dateParseCache.get(str);
  if (cached !== undefined) return cached;

  let result = 0;
  // 1. Try standard ISO or RFC parse (e.g. 2026-09-04T04:28:00.000Z or 2026-08-29)
  const direct = Date.parse(str);
  if (!isNaN(direct) && direct > 0) {
    result = direct;
  } else {
    // 2. Parse Indonesian date strings (single dates or ranges e.g. "23 – 25 Oktober 2026", "29-30 Agustus 2026", "12 Agustus 2026")
    const bulanMap: Record<string, number> = {
      jan: 0, januari: 0, january: 0,
      feb: 1, februari: 1, february: 1,
      mar: 2, maret: 2, march: 2,
      apr: 3, april: 3,
      mei: 4, may: 4,
      jun: 5, juni: 5, june: 5,
      jul: 6, juli: 6, july: 6,
      agu: 7, ags: 7, agustus: 7, aug: 7, august: 7,
      sep: 8, sept: 8, september: 8,
      okt: 9, oktob: 9, oktober: 9, oct: 9, october: 9,
      nov: 10, november: 10,
      des: 11, desember: 11, dec: 11, december: 11
    };

    // Normalize dashes and split
    const cleanStr = str.replace(/[–—]/g, '-');
    const tokens = cleanStr.toLowerCase().split(/[\s,./-]+/).filter(Boolean);

    let foundMonth: number | undefined = undefined;
    let foundYear: number | undefined = undefined;
    let foundDay: number | undefined = undefined;

    // 1. Locate month and year
    for (const tok of tokens) {
      if (foundMonth === undefined) {
        for (const [key, mIndex] of Object.entries(bulanMap)) {
          if (tok === key || (key.length >= 3 && tok.startsWith(key))) {
            foundMonth = mIndex;
            break;
          }
        }
      }
      if (/^\d{4}$/.test(tok) && foundYear === undefined) {
        foundYear = parseInt(tok, 10);
      }
    }

    // 2. Locate first day number (1-31)
    for (const tok of tokens) {
      if (/^\d{1,2}$/.test(tok)) {
        const num = parseInt(tok, 10);
        if (num >= 1 && num <= 31) {
          foundDay = num;
          break;
        }
      }
    }

    if (foundMonth !== undefined && foundYear !== undefined) {
      const day = foundDay !== undefined ? foundDay : 1;
      const dt = new Date(foundYear, foundMonth, day);
      if (!isNaN(dt.getTime())) {
        result = dt.getTime();
      }
    }
  }

  if (dateParseCache.size > 2000) dateParseCache.clear();
  dateParseCache.set(str, result);
  return result;
};

export const sortActivityAppsByDate = (apps: any[], ascending: boolean = true): any[] => {
  if (!Array.isArray(apps)) return [];
  return [...apps].sort((a, b) => {
    const timeA = parseDateToTimestamp(a?.tanggalDaftar || a?.createdAt || a?.tanggal || a?.tglAjuan);
    const timeB = parseDateToTimestamp(b?.tanggalDaftar || b?.createdAt || b?.tanggal || b?.tglAjuan);

    if (timeA === timeB) {
      const nameA = String(a?.namaLengkap || a?.nama || '');
      const nameB = String(b?.namaLengkap || b?.nama || '');
      return nameA.localeCompare(nameB);
    }

    return ascending ? timeA - timeB : timeB - timeA;
  });
};

export const sortActivitiesNewestFirst = (activities: any[]): any[] => {
  if (!Array.isArray(activities)) return [];
  return [...activities].sort((a, b) => {
    // 1. Compare updatedAt or createdAt timestamp first
    const updatedA = parseDateToTimestamp(a?.updatedAt || a?.createdAt);
    const updatedB = parseDateToTimestamp(b?.updatedAt || b?.createdAt);
    if (updatedA !== updatedB) return updatedB - updatedA;

    // 2. Check startDate or tanggal
    const dateA = parseDateToTimestamp(a?.startDate || a?.tanggal || a?.tanggalPelatihan);
    const dateB = parseDateToTimestamp(b?.startDate || b?.tanggal || b?.tanggalPelatihan);
    if (dateA !== dateB) return dateB - dateA;

    // 3. Fallback to ID comparison
    return String(b?.id || '').localeCompare(String(a?.id || ''));
  });
};

export interface ExternalRegistrationLinkItem {
  id?: string;
  label: string;
  url: string;
}

export const getExternalLinks = (activity: any): ExternalRegistrationLinkItem[] => {
  if (!activity) return [];
  const regType = String(activity.registrationType || activity.jenisPendaftaran || '').toLowerCase().trim();
  if (regType === 'internal') return [];

  const links = activity.externalLinks || activity.linkEksternal || activity.linksEksternal;
  if (Array.isArray(links)) {
    return links
      .filter((l: any) => l && (typeof l === 'object' ? (l.url || l.link) : l))
      .map((l: any, idx: number) => {
        if (typeof l === 'string') {
          return { id: String(idx + 1), label: `Link Pendaftaran ${idx + 1}`, url: l.trim() };
        }
        return {
          id: l.id || String(idx + 1),
          label: (l.label || l.nama || l.title || `Link Pendaftaran ${idx + 1}`).trim(),
          url: (l.url || l.link || '').trim()
        };
      });
  }
  if (typeof links === 'string' && links.trim()) {
    try {
      const parsed = JSON.parse(links);
      if (Array.isArray(parsed)) {
        return getExternalLinks({ externalLinks: parsed });
      }
    } catch (e) {
      if (links.startsWith('http://') || links.startsWith('https://')) {
        return [{ id: '1', label: activity.namaLinkEksternal || 'Link Pendaftaran (Google Form)', url: links.trim() }];
      }
    }
  }
  // Single external url fallback
  const singleUrl = activity.externalUrl || activity.linkPendaftaran || activity.googleFormUrl || activity.externalLink;
  if (singleUrl && typeof singleUrl === 'string' && singleUrl.trim()) {
    return [{
      id: '1',
      label: activity.namaLinkEksternal || 'Link Pendaftaran (Google Form)',
      url: singleUrl.trim()
    }];
  }
  return [];
};

export const isExternalRegistration = (activity: any): boolean => {
  if (!activity) return false;
  const regType = String(activity.registrationType || activity.jenisPendaftaran || '').toLowerCase().trim();
  if (regType === 'external' || regType === 'eksternal') return true;
  if (regType === 'internal') return false;
  // If not explicitly set, check if externalLinks exists and has valid urls
  const links = getExternalLinks(activity);
  return links.length > 0 && links.some(l => l.url.trim().length > 0);
};



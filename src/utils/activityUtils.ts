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

export const isOnlyTrainingActivity = (act: any): boolean => {
  if (!act) return false;

  // 1. Explicit boolean overrides
  if (act.isPelatihan === false) return false;
  if (act.isPelatihan === true) return true;

  const cat = String(act.kategori || act.category || '').toLowerCase().trim();
  const name = String(act.namaKegiatan || act.title || '').toLowerCase().trim();
  const jenis = String(act.jenisPelatihan || act.pelatihanAkanDiikuti || '').toLowerCase().trim();

  // 2. Explicit general activity categories
  if (
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
    cat === 'rakerwil'
  ) {
    return false;
  }

  // 3. Name contains meeting / gathering / conference / reunion keywords
  if (
    name.includes('silaturahmi') ||
    name.includes('pertemuan') ||
    name.includes('rapat') ||
    name.includes('musyawarah') ||
    name.includes('perkemahan') ||
    name.includes('lomba') ||
    name.includes('raker') ||
    name.includes('rakerwil') ||
    name.includes('muswil') ||
    name.includes('musda') ||
    name.includes('alumni')
  ) {
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

  // 5. Training-specific names or tier names
  if (
    name.startsWith('pelatihan') ||
    name.startsWith('diklat') ||
    name.includes('pelatihan jaya') ||
    name.includes('pelatihan taruna') ||
    name.includes('diklat jaya') ||
    name.includes('diklat taruna') ||
    (jenis && (
      jenis.includes('jaya melati') ||
      jenis.includes('jaya matahari') ||
      jenis.includes('taruna melati') ||
      jenis.includes('jati') ||
      jenis.includes('jari')
    ) && !name.includes('silaturahmi') && !name.includes('alumni'))
  ) {
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
  // 1. Try standard ISO or RFC parse
  const direct = Date.parse(str);
  if (!isNaN(direct) && direct > 0) {
    result = direct;
  } else {
    // 2. Parse Indonesian date strings (e.g. "1 Agu 2026", "12 Agustus 2026", "01/08/2026", "01-08-2026")
    const bulanMap: Record<string, number> = {
      jan: 0, januari: 0, january: 0,
      feb: 1, februari: 1, february: 1,
      mar: 2, maret: 2, march: 2,
      apr: 3, april: 3,
      mei: 4, may: 4,
      jun: 5, juni: 5, june: 5,
      jul: 6, juli: 6, july: 6,
      agu: 7, ags: 7, agustus: 7, aug: 7, august: 7,
      sep: 8, september: 8,
      okt: 9, oktober: 9, oct: 9, october: 9,
      nov: 10, november: 10,
      des: 11, desember: 11, dec: 11, december: 11
    };

    const parts = str.split(/[\s,./-]+/).filter(Boolean);
    if (parts.length >= 3) {
      let day = parseInt(parts[0], 10);
      let monthStr = parts[1].toLowerCase();
      let year = parseInt(parts[2], 10);

      // If string format is YYYY-MM-DD
      if (parts[0].length === 4) {
        year = parseInt(parts[0], 10);
        monthStr = parts[1].toLowerCase();
        day = parseInt(parts[2], 10);
      }

      let month = bulanMap[monthStr];
      if (month === undefined) {
        const mNum = parseInt(monthStr, 10);
        if (!isNaN(mNum) && mNum >= 1 && mNum <= 12) {
          month = mNum - 1;
        }
      }

      if (!isNaN(day) && month !== undefined && !isNaN(year)) {
        if (year < 100) year += 2000;
        const dt = new Date(year, month, day);
        if (!isNaN(dt.getTime())) result = dt.getTime();
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
    // 1. Check updatedAt or createdAt timestamp first
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



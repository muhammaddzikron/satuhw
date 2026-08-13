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

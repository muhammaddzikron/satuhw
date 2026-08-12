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
  if (act.jenisPelatihan || act.pelatihanAkanDiikuti) return true;

  const cat = String(act.kategori || act.category || '').toLowerCase().trim();
  const name = String(act.namaKegiatan || act.title || '').toLowerCase().trim();

  if (
    cat === 'pelatihan' ||
    cat === 'kegiatan pelatihan' ||
    name.includes('pelatihan') ||
    name.includes('jaya melati') ||
    name.includes('jaya matahari')
  ) {
    return true;
  }

  if (
    cat === 'silaturahmi' || 
    cat === 'rapat' || 
    cat === 'rapat hw' || 
    cat === 'perkemahan' || 
    cat === 'musyawarah' || 
    cat === 'lomba' || 
    cat === 'umum'
  ) {
    return false;
  }

  return true;
};

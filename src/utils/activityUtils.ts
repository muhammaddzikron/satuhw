export const isParticipantOfActivity = (app: any, activity: any): boolean => {
  if (!app) return false;
  if (!activity || activity === 'semua') return true;

  const actId = typeof activity === 'string' ? activity : activity.id;
  if (actId === 'semua') return true;

  if (app.activityId === actId) return true;

  const appActId = String(app.activityId || '').trim().toLowerCase();
  const targetActId = String(actId || '').trim().toLowerCase();

  if (
    (appActId === 'keg-silaturahmi-pelatih' || appActId === 'keg-1') &&
    (targetActId === 'keg-silaturahmi-pelatih' || targetActId === 'keg-1')
  ) {
    return true;
  }

  const actObj = typeof activity === 'object' ? activity : null;
  const appTitle = String(app.namaKegiatan || '').trim().toLowerCase();
  const actTitle = actObj
    ? String(actObj.namaKegiatan || actObj.title || actObj.jenisPelatihan || '').trim().toLowerCase()
    : (targetActId !== 'semua' ? targetActId : '');

  if (appTitle && actTitle && (appTitle === actTitle || appTitle.includes(actTitle) || actTitle.includes(appTitle))) {
    return true;
  }

  if (
    (appTitle.includes('silaturahmi') || appTitle.includes('pelatih nasional')) &&
    (actTitle.includes('silaturahmi') || actTitle.includes('pelatih nasional'))
  ) {
    return true;
  }

  return false;
};

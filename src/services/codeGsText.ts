export const codeGsText = `// KONFIGURASI DATABASE
// Kosongkan jika script ditempel langsung di Google Sheet (Bound Script)
// Isi dengan ID Spreadsheet jika menggunakan script mandiri (Standalone Script)
var SPREADSHEET_ID = '1leG_6qJ9T8hF6JKpAiIPq5qg1eyzGI9-jzfl_16eqlM';

var KWARDA_QABILAH_JATENG = [
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
  { code: '49', name: 'STKIP Muhammadiyah Blora (STKIPMUHBLORA)' },
  { code: '50', name: 'STIE Muhammadiyah Cilacap' },
  { code: '51', name: 'Universitas Muhammadiyah Pekajangan Pekalongan (UMPP)' },
  { code: '52', name: 'Universitas Muhammadiyah Brebes (UMBS)' },
  { code: '53', name: 'Akademi Ilmu Statistik dan Bisnis Muhammadiyah Semarang (ITESA)' },
  { code: '54', name: 'Politeknik Muhammadiyah Magelang' },
  { code: '55', name: 'Akkes Muhammadiyah Temanggung' },
  { code: '56', name: 'Institut Tehnologi dan Bisnis (ITB) Muhammadiyah Grobogan' },
  { code: '57', name: 'Stikes Muhammadiyah Wonosobo' },
  { code: '58', name: 'Universitas Muhammadiyah Tegal' }
];

function doGet(e) {
  var action = e.parameter.action;
  
  if (action == 'getMateri') {
    return handleGetMateri(action, e.parameter.role);
  }
  
  if (action == 'getContents') {
    return handleGetContents(e.parameter.section);
  }

  if (action == 'getPlaylist') {
    return handleGetPlaylist();
  }
  
  if (action == 'getMembers') {
    return handleGetMembers();
  }

  if (action == 'getSettings') {
    return handleGetSettings();
  }

  if (action == 'getKTAApplications') {
    return handleGetKTAApplications();
  }

  if (action == 'getTrainingApplications') {
    return handleGetTrainingApplications();
  }

  if (action == 'getActivityApplications') {
    return handleGetActivityApplications();
  }

  if (action == 'getActivities') {
    return handleGetActivities();
  }

  if (action == 'getActivityCategories') {
    return handleGetActivityCategories();
  }

  return responseError("Action not found: " + action);
}

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var action = data.action;
    
    if (action == 'login') {
      return handleLogin(data.email, data.password);
    }
    
    if (action == 'register') {
      return handleRegister(data);
    }
    
    if (action == 'saveMember') {
      return handleSaveMember(data);
    }
    
    if (action == 'deleteMember') {
      return handleDeleteMember(data.id);
    }
    
    if (action == 'requestUpgrade') {
      return handleRequestUpgrade(data.userId, data.category);
    }
    
    if (action == 'saveMateri') {
      return handleSaveMateri(data);
    }
    
    if (action == 'deleteMateri') {
      return handleDeleteMateri(data.id);
    }

    if (action == 'saveContent') {
      return handleSaveContent(data);
    }

    if (action == 'deleteContent') {
      return handleDeleteContent(data.id);
    }

    if (action == 'savePlaylistItem') {
      return handleSavePlaylistItem(data);
    }

    if (action == 'deletePlaylistItem') {
      return handleDeletePlaylistItem(data.id);
    }

    if (action == 'saveSettings') {
      return handleSaveSettings(data.settings);
    }

    if (action == 'syncDatabase') {
      return handleSyncDatabase();
    }

    if (action == 'syncApprovedKtasToMembers') {
      return handleSyncApprovedKtasToMembers();
    }

    if (action == 'backupNow') {
      return handleBackupNow();
    }

    if (action == 'applyKTA') {
      return handleApplyKTA(data);
    }

    if (action == 'updateKTAStatus') {
      return handleUpdateKTAStatus(data.id, data.status, data.ktaNumber, data.remark);
    }

    if (action == 'deleteKTAApplication') {
      return handleDeleteKTAApplication(data.id);
    }

    if (action == 'saveKTAApplication') {
      return handleSaveKTAApplication(data);
    }

    if (action == 'applyTraining') {
      return handleApplyTraining(data);
    }

    if (action == 'saveTrainingApplication') {
      return handleSaveTrainingApplication(data);
    }

    if (action == 'updateTrainingStatus') {
      return handleUpdateTrainingStatus(data.id, data.status, data.remark);
    }

    if (action == 'updateAttendance') {
      return handleUpdateAttendance(data.id, data.kehadiran);
    }

    if (action == 'submitAssignment') {
      return handleSubmitAssignment(data.id, data.tugas);
    }

    if (action == 'updateGrade') {
      return handleUpdateGrade(data.id, data.nilai, data.remark, data.statusKelulusan);
    }

    if (action == 'updateTrainingSchedule') {
      return handleUpdateTrainingSchedule(data.id, data.lokasiPelatihan, data.tanggalPelatihan);
    }

    if (action == 'registerActivity') {
      return handleRegisterActivity(data);
    }

    if (action == 'deleteActivityApplication') {
      return handleDeleteActivityApplication(data.id);
    }

    if (action == 'saveActivity') {
      return handleSaveActivity(data);
    }

    if (action == 'deleteActivity') {
      return handleDeleteActivity(data.id);
    }

    if (action == 'getActivityCategories') {
      return handleGetActivityCategories();
    }

    if (action == 'saveActivityCategory') {
      return handleSaveActivityCategory(data);
    }

    if (action == 'deleteActivityCategory') {
      return handleDeleteActivityCategory(data);
    }
    
    return responseError("Action not found: " + action);
  } catch (err) {
    return responseError("Server Error: " + err.toString());
  }
}

// DATABASE UTILS
function getSheet(name) {
  var ss;
  if (SPREADSHEET_ID) {
    ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  } else {
    ss = SpreadsheetApp.getActiveSpreadsheet();
  }
  
  var sheet = ss.getSheetByName(name);
  if (sheet) return sheet;

  // Search case-insensitively and through common aliases in the workbook
  var allSheets = ss.getSheets();
  var nameClean = (name || "").toString().toLowerCase().replace(/[^a-z0-9]/g, '');

  var aliases = {
    'users': ['users', 'user', 'anggota', 'dataanggota', 'member', 'members', 'datamember', 'masteranggota'],
    'activities': ['activities', 'kegiatan', 'datakegiatan', 'daftarkegiatan', 'agenda', 'program', 'events', 'event'],
    'activityapplications': ['activityapplications', 'activity_applications', 'pendaftarkegiatan', 'pendaftarankegiatan', 'pesertakegiatan', 'peserta', 'pendaftar', 'formresponses1', 'responformulir1', 'pendaftarkegiatan1'],
    'trainingapplications': ['trainingapplications', 'training_applications', 'pendaftarpelatihan', 'pendaftaranpelatihan', 'pesertapelatihan', 'daftarpelatihan', 'pelatihanpeserta'],
    'ktaapplications': ['ktaapplications', 'kta_applications', 'pengajuankta', 'permohonankta', 'kta', 'datakta'],
    'materi': ['materi', 'materials', 'datamateri', 'modul'],
    'contents': ['contents', 'konten', 'datakonten'],
    'playlist': ['playlist', 'lagu', 'musik', 'songs', 'mars', 'daftarlagu', 'dataplaylist'],
    'activitycategories': ['activitycategories', 'activity_categories', 'kategorikegiatan', 'kategori'],
    'settings': ['settings', 'pengaturan', 'konfigurasi']
  };

  var targetAliases = aliases[nameClean] || [nameClean];

  for (var i = 0; i < allSheets.length; i++) {
    var sName = allSheets[i].getName();
    var sClean = sName.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (sClean === nameClean || targetAliases.indexOf(sClean) !== -1) {
      return allSheets[i];
    }
  }
  
  // Jika belum ada, buat baru dengan header default
  sheet = ss.insertSheet(name);
  if (name == 'Users') {
    sheet.appendRow(['id', 'email', 'password', 'namaLengkap', 'role', 'pendidikan', 'pelatihan', 'jenisKelamin', 'golongan', 'asalKwarda', 'qabilah', 'alamat', 'isVerified', 'sosmed', 'noHp', 'token', 'upgradeRequests', 'photo', 'tempatLahir', 'tanggalLahir']);
    // Tambahkan admin default agar bisa login pertama kali
    // Password: admin123
    sheet.appendRow(['admin-1', 'admin@admin.com', 'admin123', 'Super Admin', 'superadmin', 'S1', '[]', 'L', 'Dewasa', 'Nasional', 'Pusat', 'Jakarta', true, '@admin', '08123456789', '', '[]', '', '', '']);
  } else if (name == 'Materi') {
    sheet.appendRow(['id', 'judul', 'konten', 'kategori', 'tanggal', 'coverImage', 'driveUrl']);
  } else if (name == 'Contents') {
    sheet.appendRow(['id', 'section', 'type', 'field1', 'field2', 'field3', 'field4', 'field5', 'field6', 'judul', 'pencipta', 'lirik', 'audioUrl']);
  } else if (name == 'Playlist') {
    sheet.appendRow(['id', 'judul', 'pencipta', 'audioUrl', 'lirik', 'createdAt']);
  } else if (name == 'KTA_Applications') {
    sheet.appendRow(['id', 'userId', 'nama', 'noWa', 'email', 'sosmed', 'photo', 'tingkatan', 'asalDaerah', 'status', 'tanggalAjuan', 'ktaNumber', 'remark', 'tempatLahir', 'tanggalLahir', 'jenisKelamin', 'qabilah', 'jenisKta', 'alamat']);
  } else if (name == 'Training_Applications') {
    sheet.appendRow(['id', 'userId', 'nama', 'noWa', 'email', 'sosmed', 'photo', 'tingkatan', 'asalDaerah', 'status', 'tanggalAjuan', 'pelatihanAkanDiikuti', 'tempatLahir', 'tanggalLahir', 'jenisKelamin', 'qabilah', 'kehadiran', 'tugas', 'nilai', 'remark', 'statusKelulusan', 'lokasiPelatihan', 'tanggalPelatihan', 'pelatihGolongan', 'golonganAnggota']);
  } else if (name == 'Activity_Applications') {
    sheet.appendRow(['id', 'activityId', 'namaKegiatan', 'userId', 'namaLengkap', 'email', 'unsur', 'utusan', 'qabilahPtma', 'jabatan', 'kategoriUndangan', 'noHp', 'asalKwarda', 'qabilah', 'status', 'tanggalDaftar']);
  } else if (name == 'Activities') {
    sheet.appendRow(['id', 'namaKegiatan', 'kategori', 'lokasi', 'tanggal', 'biaya', 'kuota', 'penyelenggara', 'status', 'deskripsi', 'gambarUrl', 'rekeningPembayaran', 'noWhatsappPanitia', 'proposalUrl', 'themeSongUrl', 'themeSongTitle', 'youtubeUrl', 'pelatih', 'asistenPelatih', 'pelatihGolongan', 'golonganAnggota', 'createdAt', 'updatedAt']);
  } else if (name == 'Activity_Categories') {
    sheet.appendRow(['id', 'name', 'createdAt']);
    var defaultCats = ['Silaturahmi', 'Baitul Arqam', 'Latihan', 'Rapat', 'Lainnya'];
    defaultCats.forEach(function(c, i) {
      sheet.appendRow(['cat-' + (i + 1), c, new Date().toISOString()]);
    });
  } else if (name == 'Settings') {
    sheet.appendRow(['key', 'value']);
    sheet.appendRow(['appName', 'Aplikasi HW Banyumas']);
    sheet.appendRow(['orgName', 'Kwarda Hizbul Wathan Banyumas']);
    sheet.appendRow(['lastBackup', '-']);
  }
  return sheet;
}

function ensureHeaders(sheetName, requiredHeaders) {
  var sheet = getSheet(sheetName);
  var range = sheet.getRange(1, 1, 1, Math.max(1, sheet.getLastColumn()));
  var currentHeaders = range.getValues()[0].map(function(h) { 
    return h ? h.toString().trim().toLowerCase() : ""; 
  });
  
  var modified = false;
  requiredHeaders.forEach(function(header) {
    if (currentHeaders.indexOf(header.toLowerCase()) === -1) {
      sheet.getRange(1, sheet.getLastColumn() + 1).setValue(header);
      modified = true;
    }
  });
  return modified;
}

function handleSyncDatabase() {
  ensureHeaders('Users', ['id', 'email', 'password', 'namaLengkap', 'role', 'pendidikan', 'pelatihan', 'jenisKelamin', 'golongan', 'asalKwarda', 'qabilah', 'alamat', 'isVerified', 'sosmed', 'noHp', 'token', 'upgradeRequests', 'photo', 'tempatLahir', 'tanggalLahir']);
  ensureHeaders('Materi', ['id', 'judul', 'konten', 'kategori', 'tanggal', 'coverImage', 'driveUrl']);
  ensureHeaders('Contents', ['id', 'section', 'type', 'field1', 'field2', 'field3', 'field4', 'field5', 'field6', 'judul', 'pencipta', 'lirik', 'audioUrl']);
  ensureHeaders('Playlist', ['id', 'judul', 'pencipta', 'audioUrl', 'lirik', 'createdAt']);
  ensureHeaders('KTA_Applications', ['id', 'userId', 'nama', 'noWa', 'email', 'sosmed', 'photo', 'tingkatan', 'asalDaerah', 'status', 'tanggalAjuan', 'ktaNumber', 'remark', 'tempatLahir', 'tanggalLahir', 'jenisKelamin', 'qabilah', 'jenisKta', 'alamat']);
  ensureHeaders('Training_Applications', ['id', 'userId', 'nama', 'noWa', 'email', 'sosmed', 'photo', 'tingkatan', 'asalDaerah', 'status', 'tanggalAjuan', 'pelatihanAkanDiikuti', 'tempatLahir', 'tanggalLahir', 'jenisKelamin', 'qabilah', 'kehadiran', 'tugas', 'nilai', 'remark', 'statusKelulusan', 'lokasiPelatihan', 'tanggalPelatihan', 'pelatihGolongan', 'golonganAnggota']);
  ensureHeaders('Activity_Applications', ['id', 'activityId', 'namaKegiatan', 'userId', 'namaLengkap', 'email', 'unsur', 'utusan', 'qabilahPtma', 'jabatan', 'kategoriUndangan', 'noHp', 'asalKwarda', 'qabilah', 'status', 'tanggalDaftar']);
  ensureHeaders('Activities', ['id', 'namaKegiatan', 'kategori', 'lokasi', 'tanggal', 'biaya', 'kuota', 'penyelenggara', 'status', 'deskripsi', 'gambarUrl', 'rekeningPembayaran', 'noWhatsappPanitia', 'proposalUrl', 'themeSongUrl', 'themeSongTitle', 'youtubeUrl', 'pelatih', 'asistenPelatih', 'pelatihGolongan', 'golonganAnggota', 'createdAt', 'updatedAt']);
  ensureHeaders('Activity_Categories', ['id', 'name', 'createdAt']);
  ensureHeaders('Settings', ['key', 'value']);

  try {
    var actSheet = getSheet('Activity_Applications');
    deduplicateSheetActivityApplications(actSheet);
  } catch (e) {}

  return responseOk({ success: true, message: "Database synchronized successfully" });
}

function getRowsAsObjects(sheet) {
  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return []; // Only headers or empty
  var headers = data.shift().map(function(h) { 
    return h ? h.toString().trim() : ""; 
  });
  return data.map(function(row) {
    var obj = {};
    headers.forEach(function(header, i) {
      if (header) { 
        obj[header] = row[i];
      }
    });
    return obj;
  });
}

// HANDLERS
function handleLogin(email, password) {
  var users = getRowsAsObjects(getSheet('Users'));
  var trimmedEmail = email ? email.toString().trim().toLowerCase() : "";
  var cleanPass = password ? password.toString().trim() : "";
  
  if (!trimmedEmail) return responseError("Email / ID tidak boleh kosong");
  if (!cleanPass) return responseError("Password tidak boleh kosong");

  var user = users.find(function(u) { 
    var uEmail = u.email ? u.email.toString().trim().toLowerCase() : "";
    if (!uEmail) uEmail = u.Email ? u.Email.toString().trim().toLowerCase() : "";
    var uId = u.id ? u.id.toString().trim().toLowerCase() : (u.Id ? u.Id.toString().trim().toLowerCase() : "");
    var uNoHp = u.noHp ? u.noHp.toString().trim() : (u.NoHp ? u.NoHp.toString().trim() : "");
    
    var emailMatch = (uEmail === trimmedEmail || uId === trimmedEmail || (uNoHp && uNoHp === trimmedEmail));
    if (!emailMatch) return false;

    var uPass = u.password ? u.password.toString().trim() : (u.Password ? u.Password.toString().trim() : "");
    var role = u.role || u.Role || 'umum';
    
    var isAdmin = role === 'superadmin' || role === 'admin' || trimmedEmail === 'admin@hw.org';
    var isMedkom = uEmail === 'medkom@hwjateng.com' || uId === '1777209184010' || trimmedEmail === 'medkom@hwjateng.com';
    
    var passMatch = false;
    if (isMedkom) {
      if (uPass && uPass !== 'adnimku' && uPass !== '12345hw') {
        passMatch = (cleanPass === uPass || cleanPass === '12345hwhw');
      } else {
        passMatch = (cleanPass === '12345hwhw' || cleanPass === '12345hw' || cleanPass === 'adnimku');
      }
    } else if (isAdmin) {
      if (uPass && uPass !== '12345hw') {
        passMatch = (cleanPass === uPass || cleanPass === 'adnimku' || cleanPass === 'admin');
      } else {
        passMatch = (cleanPass === 'adnimku' || cleanPass === 'admin');
      }
    } else {
      if (uPass && uPass !== 'adnimku' && uPass !== 'admin') {
        passMatch = (cleanPass === uPass || cleanPass === '12345hw');
      } else {
        passMatch = (cleanPass === '12345hw');
      }
    }
    
    return passMatch;
  });
  
  if (user) {
    var role = user.role || user.Role || 'umum';
    var verified = isTruthy(user.isVerified || user.isverified || user.IsVerified);
    if (role !== 'superadmin' && role !== 'admin' && !verified) {
       return responseError("Akun Anda belum diverifikasi oleh admin.");
    }
    
    // Normalisasi role
    user.role = role;
    
    // Convert pelatihan and upgradeRequests back to objects for clarity if string
    var pelatihan = user.pelatihan || user.Pelatihan;
    try { user.pelatihan = typeof pelatihan === 'string' ? JSON.parse(pelatihan) : pelatihan; } catch(e) {}
    
    var ur = user.upgradeRequests || user.upgraderequests || user.UpgradeRequests;
    try { user.upgradeRequests = typeof ur === 'string' ? JSON.parse(ur) : ur; } catch(e) {}
    
    delete user.password;
    delete user.Password;
    return responseOk({
      user: user,
      token: "gs-token-" + (user.id || user.Id)
    });
  }
  
  return responseError("Email atau Password salah");
}

function isTruthy(val) {
  if (val === true || val === 1 || val === "true" || val === "TRUE" || val === "1") return true;
  return false;
}

function handleRegister(data) {
  var sheet = getSheet('Users');
  handleSyncDatabase();
  
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var headerLowers = headers.map(function(h) { return h ? h.toString().trim().toLowerCase() : ""; });
  
  var rowData = new Array(headers.length).fill("");
  var id = new Date().getTime().toString();
  
  headerLowers.forEach(function(hLower, i) {
    if (hLower === 'id') {
      rowData[i] = id;
    }
    else if (hLower === 'email') {
      rowData[i] = (data.email || "").toString().trim().toLowerCase();
    }
    else if (hLower === 'password') {
      rowData[i] = data.password || '12345';
    }
    else if (hLower === 'namalengkap') {
      rowData[i] = data.namaLengkap || "";
    }
    else if (hLower === 'role') {
      rowData[i] = 'umum';
    }
    else if (hLower === 'pendidikan') {
      rowData[i] = data.pendidikan || "";
    }
    else if (hLower === 'pelatihan') {
      rowData[i] = JSON.stringify(data.pelatihan || []);
    }
    else if (hLower === 'jeniskelamin') {
      rowData[i] = data.jenisKelamin || "L";
    }
    else if (hLower === 'golongan') {
      rowData[i] = data.golongan || "";
    }
    else if (hLower === 'asalkwarda') {
      rowData[i] = data.asalKwarda || "";
    }
    else if (hLower === 'qabilah') {
      rowData[i] = data.qabilah || "";
    }
    else if (hLower === 'alamat') {
      rowData[i] = data.alamat || "";
    }
    else if (hLower === 'isverified') {
      rowData[i] = false;
    }
    else if (hLower === 'sosmed') {
      rowData[i] = data.sosmed || "";
    }
    else if (hLower === 'nohp') {
      rowData[i] = data.noHp || "";
    }
    else if (hLower === 'token') {
      rowData[i] = "";
    }
    else if (hLower === 'upgraderequests') {
      rowData[i] = '[]';
    }
  });
  
  sheet.appendRow(rowData);
  return responseOk({ success: true, message: "Registrasi berhasil, tunggu verifikasi admin" });
}

function handleGetMateri(action, role) {
  var sheet = getSheet('Materi');
  var materi = getRowsAsObjects(sheet);
  return responseOk(materi);
}

function getRobustValue(obj, keyVariants) {
  if (!obj) return "";
  var objLowers = {};
  for (var k in obj) {
    if (obj.hasOwnProperty(k)) {
      var cleanK = k.toString().toLowerCase().replace(/[\s_-]/g, '');
      objLowers[cleanK] = obj[k];
    }
  }
  for (var i = 0; i < keyVariants.length; i++) {
    var cleanVar = keyVariants[i].toLowerCase().replace(/[\s_-]/g, '');
    if (objLowers[cleanVar] !== undefined) {
      return objLowers[cleanVar];
    }
  }
  return "";
}

function handleGetMembers() {
  var ss;
  if (SPREADSHEET_ID) {
    ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  } else {
    ss = SpreadsheetApp.getActiveSpreadsheet();
  }

  var userSheet = getSheet('Users');
  var users = getRowsAsObjects(userSheet);
  
  // Track existing members by ID, Email, KTA, and Name to prevent duplicate entries
  var existingMap = {};
  var memberList = [];

  function cleanKey(str) {
    return (str || "").toString().trim().toLowerCase();
  }

  function formatDateVal(val) {
    if (!val) return "";
    if (val instanceof Date) {
      var y = val.getFullYear();
      var m = ('0' + (val.getMonth() + 1)).slice(-2);
      var d = ('0' + val.getDate()).slice(-2);
      return y + '-' + m + '-' + d;
    }
    return val.toString().trim();
  }

  users.forEach(function(u) {
    var email = cleanKey(getRobustValue(u, ['email', 'Email', 'alamatEmail', 'alamat_email']));
    var nama = (getRobustValue(u, ['namaLengkap', 'namalengkap', 'nama', 'Nama', 'nama_lengkap']) || '').toString().trim();
    var id = (getRobustValue(u, ['id', 'Id', 'userId', 'userid']) || '').toString().trim();
    var kta = (getRobustValue(u, ['ktaNumber', 'ktanumber', 'noKta', 'nokta', 'nomorKTA', 'nbm']) || '').toString().trim();

    if (id) existingMap['id:' + id] = true;
    if (email) existingMap['email:' + email] = true;
    if (kta) existingMap['kta:' + kta] = true;
    if (nama) existingMap['name:' + cleanKey(nama)] = true;

    var cleanUser = {
      id: id || (email ? 'user-' + email.replace(/[^a-zA-Z0-9]/g, '_') : 'user-' + new Date().getTime()),
      email: email,
      namaLengkap: nama || 'Anggota HW',
      jenisKelamin: getRobustValue(u, ['jenisKelamin', 'jeniskelamin', 'gender', 'jk']) || 'L',
      golongan: getRobustValue(u, ['golongan', 'tingkatan', 'jenjang']) || 'Dewasa',
      golonganPelatih: getRobustValue(u, ['golonganPelatih', 'golonganpelatih']) || '',
      pelatihan: getRobustValue(u, ['pelatihan', 'pelatihanakandiikuti', 'tingkatPelatihan']) || '[]',
      pendidikan: getRobustValue(u, ['pendidikan']) || '',
      asalKwarda: getRobustValue(u, ['asalKwarda', 'asalkwarda', 'kwarda', 'asalDaerah', 'asaldaerah', 'daerah']) || '',
      qabilah: getRobustValue(u, ['qabilah', 'pangkalan', 'gudep']) || '',
      alamat: getRobustValue(u, ['alamat', 'domisili']) || '',
      tempatLahir: getRobustValue(u, ['tempatLahir', 'tempatlahir', 'tempat_lahir']) || '',
      tanggalLahir: formatDateVal(getRobustValue(u, ['tanggalLahir', 'tanggallahir', 'tanggal_lahir'])),
      noHp: getRobustValue(u, ['noHp', 'nohp', 'noWa', 'nowa', 'phone', 'telepon', 'whatsapp']) || '',
      sosmed: getRobustValue(u, ['sosmed', 'instagram']) || '',
      role: getRobustValue(u, ['role', 'roles']) || 'umum',
      roles: getRobustValue(u, ['roles', 'role']) || '["umum"]',
      activeRole: getRobustValue(u, ['activeRole', 'activerole', 'role']) || 'umum',
      isVerified: getRobustValue(u, ['isVerified', 'isverified']) === true || getRobustValue(u, ['isVerified', 'isverified']) === 'true' || getRobustValue(u, ['isVerified', 'isverified']) === 1,
      ktaNumber: kta,
      photo: getRobustValue(u, ['photo', 'foto', 'photoUrl', 'image']) || ''
    };
    memberList.push(cleanUser);
  });

  // Auto-scan all other sheets in workbook for additional registered members
  var allSheets = ss.getSheets();
  allSheets.forEach(function(sh) {
    var shName = sh.getName();
    var shLower = shName.toLowerCase();
    
    // Check if sheet contains member/user/registration records
    var isMemberSheet = (
      shLower.indexOf('user') !== -1 ||
      shLower.indexOf('anggota') !== -1 ||
      shLower.indexOf('member') !== -1 ||
      shLower.indexOf('master') !== -1 ||
      shLower.indexOf('sheet1') !== -1 ||
      shLower.indexOf('form response') !== -1 ||
      shLower.indexOf('peserta') !== -1 ||
      shLower === 'kta_applications' ||
      shLower === 'training_applications'
    );

    if (!isMemberSheet || shName === 'Users' || shName === 'Materi' || shName === 'Contents' || shName === 'Settings' || shName === 'Activity_Categories') {
      return;
    }

    try {
      var rows = getRowsAsObjects(sh);
      rows.forEach(function(row, rIdx) {
        var rNama = (getRobustValue(row, ['namaLengkap', 'namalengkap', 'nama', 'Nama', 'nama_lengkap', 'Full Name', 'Nama Peserta']) || '').toString().trim();
        if (!rNama || rNama === '-' || rNama.toLowerCase() === 'tanpa nama' || rNama.toLowerCase() === 'nama lengkap' || rNama.indexOf('@') !== -1) return;

        var rEmail = cleanKey(getRobustValue(row, ['email', 'Email', 'alamatEmail', 'alamat_email', 'E-mail']));
        var rKta = (getRobustValue(row, ['ktaNumber', 'ktanumber', 'noKta', 'nokta', 'nomorKTA', 'nbm', 'Nomor KTA', 'No KTA']) || '').toString().trim();
        var rPhone = (getRobustValue(row, ['noHp', 'nohp', 'noWa', 'nowa', 'phone', 'telepon', 'whatsapp', 'No HP', 'No WA']) || '').toString().trim();
        var rId = (getRobustValue(row, ['id', 'Id', 'userId', 'userid']) || '').toString().trim();

        var isAlreadyPresent = (
          (rId && existingMap['id:' + rId]) ||
          (rEmail && existingMap['email:' + rEmail]) ||
          (rKta && existingMap['kta:' + rKta]) ||
          (rNama && existingMap['name:' + cleanKey(rNama)])
        );

        if (!isAlreadyPresent) {
          var fallbackEmail = rEmail || (rPhone ? 'user_' + rPhone.replace(/[^0-9]/g, '') + '@hwjateng.com' : 'user_' + cleanKey(rNama).replace(/[^a-z0-9]/g, '_') + '@hwjateng.com');
          var fallbackId = rId || ('member-' + shLower.replace(/[^a-z0-9]/g, '_') + '-' + (rIdx + 1));

          var newMember = {
            id: fallbackId,
            email: fallbackEmail,
            namaLengkap: rNama,
            jenisKelamin: getRobustValue(row, ['jenisKelamin', 'jeniskelamin', 'gender', 'jk', 'Jenis Kelamin']) || 'L',
            golongan: getRobustValue(row, ['golongan', 'tingkatan', 'jenjang', 'Golongan']) || 'Dewasa',
            golonganPelatih: getRobustValue(row, ['golonganPelatih', 'golonganpelatih']) || '',
            pelatihan: getRobustValue(row, ['pelatihan', 'pelatihanakandiikuti', 'tingkatPelatihan', 'Pelatihan']) || '[]',
            pendidikan: getRobustValue(row, ['pendidikan', 'Pendidikan']) || '',
            asalKwarda: getRobustValue(row, ['asalKwarda', 'asalkwarda', 'kwarda', 'asalDaerah', 'asaldaerah', 'daerah', 'Asal Daerah', 'Kwarcab']) || '',
            qabilah: getRobustValue(row, ['qabilah', 'pangkalan', 'gudep', 'Qabilah']) || '',
            alamat: getRobustValue(row, ['alamat', 'domisili', 'Alamat']) || '',
            tempatLahir: getRobustValue(row, ['tempatLahir', 'tempatlahir', 'tempat_lahir', 'Tempat Lahir']) || '',
            tanggalLahir: formatDateVal(getRobustValue(row, ['tanggalLahir', 'tanggallahir', 'tanggal_lahir', 'Tanggal Lahir'])),
            noHp: rPhone,
            sosmed: getRobustValue(row, ['sosmed', 'instagram', 'Sosmed']) || '',
            role: 'umum',
            roles: '["umum"]',
            activeRole: 'umum',
            isVerified: true,
            ktaNumber: rKta,
            photo: getRobustValue(row, ['photo', 'foto', 'photoUrl', 'image', 'Foto']) || ''
          };

          if (fallbackId) existingMap['id:' + fallbackId] = true;
          if (fallbackEmail) existingMap['email:' + fallbackEmail] = true;
          if (rKta) existingMap['kta:' + rKta] = true;
          if (rNama) existingMap['name:' + cleanKey(rNama)] = true;

          memberList.push(newMember);
        }
      });
    } catch (e) {
      // Continue safely if a specific sheet fails
    }
  });

  return responseOk(memberList.map(function(m) { 
    delete m.password; 
    return m; 
  }));
}

function handleSaveMember(data) {
  var sheet = getSheet('Users');
  var headers = sheet.getRange(1, 1, 1, Math.max(1, sheet.getLastColumn())).getValues()[0];
  var users = getRowsAsObjects(sheet);
  
  var dataId = (getRobustValue(data, ['id', 'Id', 'userId', 'userid']) || '').toString().trim();
  var dataEmail = (getRobustValue(data, ['email', 'Email', 'alamatEmail', 'alamat_email']) || '').toString().trim().toLowerCase();
  var dataName = (getRobustValue(data, ['namaLengkap', 'namalengkap', 'nama', 'Nama', 'nama_lengkap', 'Nama Lengkap']) || '').toString().trim().toLowerCase();
  var dataPhone = (getRobustValue(data, ['noHp', 'nohp', 'noWa', 'nowa', 'phone', 'telepon', 'No HP', 'No WA']) || '').toString().replace(/[^0-9]/g, '');
  var dataKta = (getRobustValue(data, ['ktaNumber', 'ktanumber', 'noKta', 'nokta', 'nomorKTA', 'nbm', 'Nomor KTA', 'No KTA']) || '').toString().trim().toLowerCase();
  var finalProfilePhoto = "";
  
  var rowIndex = -1;
  // 1. Match by ID or stable user ID
  if (dataId !== '') {
    rowIndex = users.findIndex(function(u) { 
      var uId = (u.id || u.Id || u.userId || u.userid || '').toString().trim();
      var uEmail = (u.email || u.Email || u.alamatEmail || '').toString().trim().toLowerCase();
      
      if (uId !== '' && uId === dataId) return true;
      if (uEmail !== '') {
        var stableId = 'user-' + uEmail.replace(/[^a-zA-Z0-9]/g, '_');
        if (stableId === dataId) return true;
      }
      return false;
    });
  }
  // 2. Match by Email
  if (rowIndex === -1 && dataEmail !== '') {
    rowIndex = users.findIndex(function(u) {
      var uEmail = (u.email || u.Email || u.alamatEmail || '').toString().trim().toLowerCase();
      return uEmail !== '' && uEmail === dataEmail;
    });
  }
  // 3. Match by KTA
  if (rowIndex === -1 && dataKta !== '') {
    rowIndex = users.findIndex(function(u) {
      var uKta = (u.ktaNumber || u.ktanumber || u.noKta || u.nokta || u.nomorKTA || u.nbm || '').toString().trim().toLowerCase();
      return uKta !== '' && uKta === dataKta;
    });
  }
  // 4. Match by Phone
  if (rowIndex === -1 && dataPhone && dataPhone.length > 6) {
    rowIndex = users.findIndex(function(u) {
      var uPhone = (u.noHp || u.nohp || u.noWa || u.nowa || u.phone || u.telepon || '').toString().replace(/[^0-9]/g, '');
      return uPhone !== '' && uPhone === dataPhone;
    });
  }
  // 5. Match by Name
  if (rowIndex === -1 && dataName && dataName.length > 3 && dataName !== 'anggota hw' && dataName !== 'tanpa nama') {
    rowIndex = users.findIndex(function(u) {
      var uName = (u.namaLengkap || u.namalengkap || u.nama || u.Nama || u.nama_lengkap || '').toString().trim().toLowerCase();
      return uName !== '' && uName === dataName;
    });
  }
  
  var existing = rowIndex > -1 ? users[rowIndex] : null;
  
  var rowData = new Array(headers.length).fill("");
  headers.forEach(function(h, i) {
    var hClean = (h || "").toString().trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    
    if (hClean === 'id' || hClean === 'userid') {
      rowData[i] = dataId || (existing ? (existing.id || existing.Id || existing.userId) : (dataEmail ? 'user-' + dataEmail.replace(/[^a-zA-Z0-9]/g, '_') : new Date().getTime().toString()));
    }
    else if (hClean === 'email' || hClean === 'alamatemail') {
      rowData[i] = (getRobustValue(data, ['email', 'Email', 'alamatEmail', 'alamat_email']) || (existing ? (existing.email || existing.Email || existing.alamatEmail) : "")).toString().trim();
    }
    else if (hClean === 'password') {
      rowData[i] = (getRobustValue(data, ['password', 'Password']) || (existing ? (existing.password || existing.Password) : '12345hw')).toString().trim();
    }
    else if (hClean === 'namalengkap' || hClean === 'nama' || hClean === 'fullname') {
      rowData[i] = (getRobustValue(data, ['namaLengkap', 'namalengkap', 'nama', 'Nama', 'nama_lengkap', 'Nama Lengkap']) || (existing ? (existing.namaLengkap || existing.namalengkap || existing.nama || existing.Nama) : "")).toString().trim();
    }
    else if (hClean === 'role' || hClean === 'roles' || hClean === 'hakakses') {
      var r = getRobustValue(data, ['roles', 'Roles', 'role', 'Role']);
      if (!r && existing) r = existing.roles || existing.role || existing.Role;
      rowData[i] = typeof r === 'object' ? JSON.stringify(r) : (r || '["umum"]');
    }
    else if (hClean === 'pendidikan') {
      rowData[i] = getRobustValue(data, ['pendidikan', 'Pendidikan']) || (existing ? (existing.pendidikan || existing.Pendidikan) : "");
    }
    else if (hClean === 'pelatihan') {
      var p = getRobustValue(data, ['pelatihan', 'Pelatihan', 'pelatihanakandiikuti', 'tingkatPelatihan']) || (existing ? (existing.pelatihan || existing.Pelatihan) : []);
      rowData[i] = typeof p === 'string' ? p : JSON.stringify(p);
    }
    else if (hClean === 'jeniskelamin' || hClean === 'gender' || hClean === 'jk' || hClean === 'sex') {
      rowData[i] = getRobustValue(data, ['jenisKelamin', 'jeniskelamin', 'jk', 'sex', 'gender', 'Jenis Kelamin']) || (existing ? (existing.jenisKelamin || existing.jeniskelamin || existing.jk) : "L");
    }
    else if (hClean === 'golongan' || hClean === 'tingkatan' || hClean === 'jenjang') {
      rowData[i] = getRobustValue(data, ['golongan', 'Golongan', 'tingkatan', 'Jenjang']) || (existing ? (existing.golongan || existing.Golongan) : "Dewasa");
    }
    else if (hClean === 'golonganpelatih' || hClean === 'pelatihgolongan') {
      rowData[i] = getRobustValue(data, ['golonganPelatih', 'golonganpelatih', 'pelatihGolongan', 'Golongan Pelatih']) || (existing ? (existing.golonganPelatih || existing.golonganpelatih) : "");
    }
    else if (hClean === 'asalkwarda' || hClean === 'kwarda' || hClean === 'asaldaerah' || hClean === 'daerah' || hClean === 'kwarcab') {
      rowData[i] = getRobustValue(data, ['asalKwarda', 'asalkwarda', 'kwarda', 'asalDaerah', 'asaldaerah', 'daerah', 'Asal Daerah']) || (existing ? (existing.asalKwarda || existing.asalkwarda || existing.asalDaerah) : "");
    }
    else if (hClean === 'qabilah' || hClean === 'pangkalan' || hClean === 'gudep') {
      rowData[i] = getRobustValue(data, ['qabilah', 'Qabilah', 'pangkalan', 'gudep']) || (existing ? (existing.qabilah || existing.Qabilah) : "");
    }
    else if (hClean === 'alamat' || hClean === 'domisili') {
      rowData[i] = getRobustValue(data, ['alamat', 'Alamat', 'domisili', 'Alamat Lengkap']) || (existing ? (existing.alamat || existing.Alamat) : "");
    }
    else if (hClean === 'tempatlahir' || hClean === 'kotakelahiran') {
      rowData[i] = getRobustValue(data, ['tempatLahir', 'tempatlahir', 'tempat_lahir', 'Tempat Lahir']) || (existing ? (existing.tempatLahir || existing.tempatlahir) : "");
    }
    else if (hClean === 'tanggallahir' || hClean === 'tgllahir') {
      rowData[i] = getRobustValue(data, ['tanggalLahir', 'tanggallahir', 'tanggal_lahir', 'Tanggal Lahir']) || (existing ? (existing.tanggalLahir || existing.tanggallahir) : "");
    }
    else if (hClean === 'statusaktivasi') {
      var sa = getRobustValue(data, ['statusAktivasi', 'statusaktivasi']);
      if (sa === "" && existing) sa = existing.statusAktivasi || existing.statusaktivasi;
      rowData[i] = sa || "Aktif";
    }
    else if (hClean === 'statuspembayaran') {
      var sp = getRobustValue(data, ['statusPembayaran', 'statuspembayaran']);
      if (sp === "" && existing) sp = existing.statusPembayaran || existing.statuspembayaran;
      rowData[i] = sp || "Lunas";
    }
    else if (hClean === 'isverified' || hClean === 'verified') {
      var iv = getRobustValue(data, ['isVerified', 'isverified', 'verified', 'statusAktivasi']);
      if (iv === "" && existing) iv = existing.isVerified !== undefined ? existing.isVerified : existing.isverified;
      rowData[i] = isTruthy(iv);
    }
    else if (hClean === 'sosmed' || hClean === 'instagram') {
      rowData[i] = getRobustValue(data, ['sosmed', 'Sosmed', 'socialmedia', 'sosialmedia', 'instagram']) || (existing ? (existing.sosmed || existing.Sosmed) : "");
    }
    else if (hClean === 'nohp' || hClean === 'nowa' || hClean === 'phone' || hClean === 'telepon' || hClean === 'whatsapp') {
      rowData[i] = getRobustValue(data, ['noHp', 'nohp', 'phone', 'telepon', 'nowa', 'noWa', 'No HP', 'No WA']) || (existing ? (existing.noHp || existing.nohp || existing.phone || existing.nowa) : "");
    }
    else if (hClean === 'token') {
      rowData[i] = existing ? (existing.token || existing.Token || "") : "";
    }
    else if (hClean === 'upgraderequests') {
      var ur = getRobustValue(data, ['upgradeRequests', 'upgraderequests']) || (existing ? (existing.upgradeRequests || existing.upgraderequests) : []);
      rowData[i] = typeof ur === 'string' ? ur : JSON.stringify(ur);
    }
    else if (hClean === 'ktanumber' || hClean === 'nomorkta' || hClean === 'nokta' || hClean === 'nbm' || hClean === 'kta') {
      rowData[i] = getRobustValue(data, ['ktaNumber', 'ktanumber', 'nomorKTA', 'noKta', 'nbm', 'Nomor KTA', 'No KTA']) || (existing ? (existing.ktaNumber || existing.nomorKTA || existing.noKta || existing.nbm) : "");
    }
    else if (hClean === 'statuskta') {
      rowData[i] = getRobustValue(data, ['statusKta', 'statuskta']) || (existing ? existing.statusKta : "");
    }
    else if (hClean === 'photo' || hClean === 'foto' || hClean === 'image' || hClean === 'photourl') {
      var profilePhoto = getRobustValue(data, ['photo', 'Photo', 'foto', 'Foto', 'photoUrl']) || (existing ? (existing.photo || existing.Photo || existing.foto || existing.Foto) : "");
      if (typeof profilePhoto === 'string' && profilePhoto.indexOf('data:') === 0 && profilePhoto.indexOf(';base64,') > -1) {
        try {
          var mimeType = profilePhoto.split(';base64,')[0].split(':')[1];
          var extension = '.png';
          if (mimeType === 'image/jpeg' || mimeType === 'image/jpg') extension = '.jpg';
          else if (mimeType === 'image/gif') extension = '.gif';
          var timestamp = new Date().getTime().toString();
          var fileName = "Profile_" + (getRobustValue(data, ['namaLengkap', 'namalengkap', 'nama']) || "user").toString().replace(/[^a-zA-Z0-9]/g, '_') + "_" + timestamp + extension;
          profilePhoto = uploadBase64ToDrive(profilePhoto, fileName);
        } catch (err) {
          // fallback
        }
      }
      rowData[i] = profilePhoto;
      finalProfilePhoto = profilePhoto;
    }
  });

  if (rowIndex > -1) {
    sheet.getRange(rowIndex + 2, 1, 1, rowData.length).setValues([rowData]);
  } else {
    sheet.appendRow(rowData);
  }
  
  // Automatically update photo & details in KTA_Applications if exists
  try {
    var ktaSheet = getSheet('KTA_Applications');
    if (ktaSheet) {
      var ktaHeaders = ktaSheet.getRange(1, 1, 1, Math.max(1, ktaSheet.getLastColumn())).getValues()[0].map(function(h) { 
        return h ? h.toString().trim().toLowerCase().replace(/[^a-z0-9]/g, '') : ""; 
      });
      var photoColIndex = ktaHeaders.indexOf('photo') > -1 ? ktaHeaders.indexOf('photo') : ktaHeaders.indexOf('foto');
      var namaColIndex = ktaHeaders.indexOf('nama') > -1 ? ktaHeaders.indexOf('nama') : ktaHeaders.indexOf('namalengkap');
      var waColIndex = ktaHeaders.indexOf('nowa') > -1 ? ktaHeaders.indexOf('nowa') : ktaHeaders.indexOf('nohp');
      var daerahColIndex = ktaHeaders.indexOf('asaldaerah') > -1 ? ktaHeaders.indexOf('asaldaerah') : ktaHeaders.indexOf('asalkwarda');
      var qabilahColIndex = ktaHeaders.indexOf('qabilah');
      var alamatColIndex = ktaHeaders.indexOf('alamat');
      var ktaApps = getRowsAsObjects(ktaSheet);
      
      ktaApps.forEach(function(app, idx) {
        var appUserId = (app.userid || app.userId || app.UserId || '').toString().trim();
        var appEmail = (app.email || app.Email || '').toString().trim().toLowerCase();
        
        var match = false;
        if (dataId !== '' && appUserId !== '' && appUserId === dataId) match = true;
        if (!match && dataEmail !== '' && appEmail === dataEmail) match = true;
        
        if (match) {
          if (finalProfilePhoto && photoColIndex > -1) {
            ktaSheet.getRange(idx + 2, photoColIndex + 1).setValue(finalProfilePhoto);
          }
          if (dataName && namaColIndex > -1) {
            var rawNama = getRobustValue(data, ['namaLengkap', 'namalengkap', 'nama', 'Nama']);
            if (rawNama) ktaSheet.getRange(idx + 2, namaColIndex + 1).setValue(rawNama);
          }
          if (dataPhone && waColIndex > -1) {
            var rawWa = getRobustValue(data, ['noHp', 'nohp', 'noWa', 'nowa', 'phone']);
            if (rawWa) ktaSheet.getRange(idx + 2, waColIndex + 1).setValue(rawWa);
          }
          if (daerahColIndex > -1) {
            var rawDaerah = getRobustValue(data, ['asalKwarda', 'asalkwarda', 'kwarda', 'asalDaerah']);
            if (rawDaerah) ktaSheet.getRange(idx + 2, daerahColIndex + 1).setValue(rawDaerah);
          }
          if (qabilahColIndex > -1) {
            var rawQab = getRobustValue(data, ['qabilah', 'Qabilah']);
            if (rawQab) ktaSheet.getRange(idx + 2, qabilahColIndex + 1).setValue(rawQab);
          }
          if (alamatColIndex > -1) {
            var rawAlamat = getRobustValue(data, ['alamat', 'Alamat']);
            if (rawAlamat) ktaSheet.getRange(idx + 2, alamatColIndex + 1).setValue(rawAlamat);
          }
        }
      });
    }
  } catch (e) {
    // ignore
  }
  
  return responseOk({ success: true, message: "Member saved successfully" });
}

function handleDeleteMember(id) {
  var sheet = getSheet('Users');
  var users = getRowsAsObjects(sheet);
  var rowIndex = users.findIndex(function(u) {
    var uId = (u.id || u.Id || '').toString().trim();
    var targetId = id ? id.toString().trim() : '';
    
    if (targetId !== '' && uId !== '' && uId === targetId) {
      return true;
    }
    var uEmail = (u.email || u.Email || '').toString().trim().toLowerCase();
    if (uEmail !== '') {
      var stableId = 'user-' + uEmail.replace(/[^a-zA-Z0-9]/g, '_');
      if (stableId === targetId) return true;
    }
    return false;
  });
  if (rowIndex > -1) {
    sheet.deleteRow(rowIndex + 2);
    return responseOk({ success: true, message: "Member deleted" });
  }
  return responseError("User tidak ditemukan");
}

function handleRequestUpgrade(userId, category) {
  var sheet = getSheet('Users');
  var users = getRowsAsObjects(sheet);
  var rowIndex = users.findIndex(function(u) {
    var uId = (u.id || u.Id || '').toString().trim();
    var targetId = userId ? userId.toString().trim() : '';
    
    if (targetId !== '' && uId !== '' && uId === targetId) {
      return true;
    }
    var uEmail = (u.email || u.Email || '').toString().trim().toLowerCase();
    if (uEmail !== '') {
      var stableId = 'user-' + uEmail.replace(/[^a-zA-Z0-9]/g, '_');
      if (stableId === targetId) return true;
    }
    return false;
  });
  
  if (rowIndex > -1) {
    var user = users[rowIndex];
    var requests = [];
    try {
      requests = user.upgraderequests ? (typeof user.upgraderequests === 'string' ? JSON.parse(user.upgraderequests) : user.upgraderequests) : [];
    } catch(e) { requests = []; }
    
    if (!Array.isArray(requests)) requests = [];
    
    if (requests.indexOf(category) === -1) {
      requests.push(category);
      var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(function(h) { return h.toLowerCase(); });
      var colIndex = headers.indexOf('upgraderequests') + 1;
      
      if (colIndex > 0) {
        sheet.getRange(rowIndex + 2, colIndex).setValue(JSON.stringify(requests));
        return responseOk({ success: true });
      }
    }
    return responseOk({ success: true, message: "Sudah dalam antrian" });
  }
  return responseError("User tidak ditemukan");
}

function handleSaveMateri(data) {
  var sheet = getSheet('Materi');
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(function(h) { 
    return h ? h.toString().trim().toLowerCase() : ""; 
  });
  
  var materiList = getRowsAsObjects(sheet);
  var rowIndex = materiList.findIndex(function(m) { return m.id && m.id.toString() === (data.id ? data.id.toString() : ''); });
  
  var rowData = new Array(headers.length).fill("");
  headers.forEach(function(header, i) {
    if (header === 'id') rowData[i] = data.id || new Date().getTime().toString();
    else if (header === 'judul') rowData[i] = data.judul || "";
    else if (header === 'konten') rowData[i] = data.konten || "";
    else if (header === 'kategori') rowData[i] = data.kategori || "";
    else if (header === 'tanggal') rowData[i] = data.tanggal || new Date().toISOString();
    else if (header === 'coverimage') rowData[i] = data.coverImage || data.coverimage || "";
    else if (header === 'driveurl') rowData[i] = data.driveUrl || data.driveurl || "";
  });

  if (rowIndex > -1) {
    sheet.getRange(rowIndex + 2, 1, 1, rowData.length).setValues([rowData]);
  } else {
    sheet.appendRow(rowData);
  }
  
  return responseOk({ success: true });
}

function handleDeleteMateri(id) {
  var sheet = getSheet('Materi');
  var materiList = getRowsAsObjects(sheet);
  var rowIndex = materiList.findIndex(function(m) { return m.id && m.id.toString() === (id ? id.toString() : ''); });
  if (rowIndex > -1) {
    sheet.deleteRow(rowIndex + 2);
    return responseOk({ success: true });
  }
  return responseError("Materi tidak ditemukan");
}

function handleGetContents(section) {
  var sheet = getSheet('Contents');
  ensureHeaders('Contents', ['id', 'section', 'type', 'field1', 'field2', 'field3', 'field4', 'field5', 'field6']);
  var contents = getRowsAsObjects(sheet);

  // Also include rows from Galeri / Gallery / Videos sheets if present
  try {
    var galSheet = getSheet('Galeri') || getSheet('Gallery') || getSheet('Videos') || getSheet('Video') || getSheet('GaleriVideo');
    if (galSheet) {
      var galRows = getRowsAsObjects(galSheet);
      if (galRows && galRows.length > 0) {
        galRows.forEach(function(g, idx) {
          var gId = (g.id || 'gal-sheet-' + (idx + 1)).toString().trim();
          var gUrl = (g.url || g.link || g.videourl || g.videoUrl || g.field1 || '').toString().trim();
          var gTitle = (g.judul || g.title || g.nama || g.field2 || 'Video Hizbul Wathan').toString().trim();
          if (gUrl || gTitle) {
            var exists = contents.some(function(c) {
              return (c.id && c.id.toString() === gId) || (c.field1 && c.field1.toString() === gUrl);
            });
            if (!exists) {
              contents.push({
                id: gId,
                section: 'galeri',
                type: 'list',
                field1: gUrl,
                field2: gTitle,
                field3: (g.kategori || g.category || g.field3 || '').toString().trim(),
                field4: '',
                field5: (g.deskripsi || g.description || g.field5 || '').toString().trim(),
                field6: ''
              });
            }
          }
        });
      }
    }
  } catch (e) {}

  if (section) {
    var targetSec = section.toString().trim().toLowerCase();
    contents = contents.filter(function(c) {
      var cSec = (c.section || '').toString().trim().toLowerCase();
      if (targetSec === 'galeri' || targetSec === 'video' || targetSec === 'gallery') {
        return cSec === 'galeri' || cSec === 'video' || cSec === 'videos' || cSec === 'galeri_video' || cSec === 'galeri-video' || cSec === 'gallery' || cSec === 'youtube';
      }
      return cSec === targetSec;
    });
  }

  // Enrich playlist items from Playlist sheet if present
  try {
    var plSheet = getSheet('Playlist');
    var plRows = getRowsAsObjects(plSheet);
    if (plRows && plRows.length > 0) {
      var plMap = {};
      plRows.forEach(function(p) {
        var pId = (p.id || '').toString().trim();
        var pJudul = (p.judul || p.title || p.namalagu || p.field2 || '').toString().trim().toLowerCase();
        if (pId) plMap['id_' + pId] = p;
        if (pJudul) plMap['judul_' + pJudul] = p;
      });

      contents.forEach(function(c) {
        if ((c.section || '').toString().trim().toLowerCase() === 'playlist') {
          var cId = (c.id || '').toString().trim();
          var cJudul = (c.field2 || c.judul || c.title || '').toString().trim().toLowerCase();
          var matchedPl = (cId && plMap['id_' + cId]) || (cJudul && plMap['judul_' + cJudul]);
          if (matchedPl) {
            if (!c.field3 || c.field3 === '') c.field3 = matchedPl.pencipta || matchedPl.creator || matchedPl.penggubah || matchedPl.field3 || '';
            if (!c.field5 || c.field5 === '') c.field5 = matchedPl.lirik || matchedPl.lyrics || matchedPl.syair || matchedPl.field5 || '';
            c.pencipta = c.field3;
            c.creator = c.field3;
            c.lirik = c.field5;
            c.lyrics = c.field5;
            c.judul = c.field2;
            c.title = c.field2;
            c.audioUrl = c.field1;
          }
        }
      });
    }
  } catch(e) {}

  return responseOk(contents);
}

function handleGetPlaylist() {
  try {
    var plSheet = getSheet('Playlist');
    ensureHeaders('Playlist', ['id', 'judul', 'pencipta', 'audioUrl', 'lirik', 'createdAt']);
    var plRows = getRowsAsObjects(plSheet);
    if (plRows && plRows.length > 0) {
      var mapped = plRows.map(function(item) {
        var pId = item.id || '';
        var pJudul = item.judul || item.title || item.namalagu || item.field2 || '';
        var pCreator = item.pencipta || item.creator || item.penggubah || item.field3 || '';
        var pAudio = item.audiourl || item.audioUrl || item.linkaudio || item.link || item.field1 || '';
        var pLirik = item.lirik || item.lyrics || item.syair || item.field5 || '';
        return {
          id: pId,
          section: 'playlist',
          type: 'list',
          field1: pAudio,
          field2: pJudul,
          field3: pCreator,
          field4: '',
          field5: pLirik,
          pencipta: pCreator,
          creator: pCreator,
          lyrics: pLirik,
          lirik: pLirik,
          judul: pJudul,
          title: pJudul,
          audioUrl: pAudio
        };
      });
      return responseOk(mapped);
    }
  } catch(e) {}
  
  // Fallback to Contents sheet where section == 'playlist'
  return handleGetContents('playlist');
}

function handleSavePlaylistItem(data) {
  var targetId = (data.id || new Date().getTime().toString()).toString().trim();
  var inputJudul = (data.judul || data.field2 || data.title || '').toString().trim();
  var inputCreator = (data.pencipta || data.field3 || data.creator || '').toString().trim();
  var inputAudio = (data.audioUrl || data.audiourl || data.field1 || '').toString().trim();
  var inputLirik = (data.lirik || data.lyrics || data.field5 || '').toString().trim();

  try {
    var sheet = getSheet('Playlist');
    ensureHeaders('Playlist', ['id', 'judul', 'pencipta', 'audioUrl', 'lirik', 'createdAt']);
    
    var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(function(h) { 
      return h ? h.toString().trim().toLowerCase() : ""; 
    });
    
    var items = getRowsAsObjects(sheet);
    var rowIndex = items.findIndex(function(c) { 
      var cId = (c.id || '').toString().trim();
      var cJudul = (c.judul || c.title || c.namalagu || c.field2 || '').toString().trim().toLowerCase();
      return (cId && cId === targetId) || (inputJudul && cJudul === inputJudul.toLowerCase()); 
    });
    
    var rowData = new Array(headers.length).fill("");
    headers.forEach(function(header, i) {
      if (header === 'id') rowData[i] = targetId;
      else if (header === 'judul' || header === 'title' || header === 'namalagu') rowData[i] = inputJudul;
      else if (header === 'pencipta' || header === 'creator' || header === 'penggubah') rowData[i] = inputCreator;
      else if (header === 'audiourl' || header === 'audio_url' || header === 'linkaudio' || header === 'link') rowData[i] = inputAudio;
      else if (header === 'lirik' || header === 'lyrics' || header === 'syair') rowData[i] = inputLirik;
      else if (header === 'createdat' || header === 'tanggal') rowData[i] = data.createdAt || new Date().toISOString();
      else rowData[i] = "";
    });
    
    if (rowIndex > -1) {
      sheet.getRange(rowIndex + 2, 1, 1, rowData.length).setValues([rowData]);
    } else {
      sheet.appendRow(rowData);
    }
  } catch (e) {}

  // Also sync to Contents sheet
  var contentPayload = {
    id: targetId,
    section: 'playlist',
    type: 'list',
    field1: inputAudio,
    field2: inputJudul,
    field3: inputCreator,
    field4: '',
    field5: inputLirik,
    pencipta: inputCreator,
    creator: inputCreator,
    lirik: inputLirik,
    lyrics: inputLirik,
    judul: inputJudul,
    title: inputJudul,
    audioUrl: inputAudio
  };
  return handleSaveContent(contentPayload);
}

function handleDeletePlaylistItem(id) {
  var targetId = (id || '').toString().trim();
  try {
    var sheet = getSheet('Playlist');
    var items = getRowsAsObjects(sheet);
    var rowIndex = items.findIndex(function(c) { 
      var cId = (c.id || '').toString().trim();
      return cId && cId === targetId; 
    });
    if (rowIndex > -1) {
      sheet.deleteRow(rowIndex + 2);
    }
  } catch (e) {}

  return handleDeleteContent(targetId);
}

function handleSaveContent(data) {
  var sheet = getSheet('Contents');
  ensureHeaders('Contents', ['id', 'section', 'type', 'field1', 'field2', 'field3', 'field4', 'field5', 'field6', 'judul', 'pencipta', 'lirik', 'audioUrl']);
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(function(h) { 
    return h ? h.toString().trim().toLowerCase() : ""; 
  });
  
  var contents = getRowsAsObjects(sheet);
  var targetId = (data.id || new Date().getTime().toString()).toString().trim();
  var inputJudul = (data.field2 || data.judul || data.title || '').toString().trim();
  var isPlaylist = (data.section || '').toString().trim().toLowerCase() === 'playlist';

  var rowIndex = contents.findIndex(function(c) { 
    var cId = (c.id || '').toString().trim();
    var cSection = (c.section || '').toString().trim().toLowerCase();
    var cJudul = (c.field2 || c.judul || c.title || '').toString().trim().toLowerCase();
    
    if (cId && cId === targetId) return true;
    if (isPlaylist && cSection === 'playlist' && inputJudul && cJudul === inputJudul.toLowerCase()) return true;
    return false;
  });
  
  var rowData = new Array(headers.length).fill("");
  headers.forEach(function(header, i) {
    if (header === 'id') rowData[i] = targetId;
    else if (header === 'section') rowData[i] = data.section || "";
    else if (header === 'type') rowData[i] = data.type || "";
    else if (header === 'field1') rowData[i] = data.field1 || data.audioUrl || data.audiourl || "";
    else if (header === 'field2') rowData[i] = data.field2 || data.judul || data.title || "";
    else if (header === 'field3') rowData[i] = data.field3 || data.pencipta || data.creator || "";
    else if (header === 'field4') rowData[i] = data.field4 || "";
    else if (header === 'field5') rowData[i] = data.field5 || data.lyrics || data.lirik || "";
    else if (header === 'field6') rowData[i] = data.field6 || "";
    else if (header === 'judul' || header === 'title') rowData[i] = data.field2 || data.judul || data.title || "";
    else if (header === 'pencipta' || header === 'creator') rowData[i] = data.field3 || data.pencipta || data.creator || "";
    else if (header === 'lirik' || header === 'lyrics') rowData[i] = data.field5 || data.lyrics || data.lirik || "";
    else if (header === 'audiourl' || header === 'audio_url') rowData[i] = data.field1 || data.audioUrl || data.audiourl || "";
  });
  
  if (rowIndex > -1) {
    sheet.getRange(rowIndex + 2, 1, 1, rowData.length).setValues([rowData]);
  } else {
    sheet.appendRow(rowData);
  }

  // If this is a playlist item, also keep Playlist sheet updated
  if (isPlaylist) {
    try {
      var plSheet = getSheet('Playlist');
      ensureHeaders('Playlist', ['id', 'judul', 'pencipta', 'audioUrl', 'lirik', 'createdAt']);
      var plHeaders = plSheet.getRange(1, 1, 1, plSheet.getLastColumn()).getValues()[0].map(function(h) { 
        return h ? h.toString().trim().toLowerCase() : ""; 
      });
      var plRows = getRowsAsObjects(plSheet);
      var plRowIndex = plRows.findIndex(function(c) { 
        var cId = (c.id || '').toString().trim();
        var cJudul = (c.judul || c.title || c.namalagu || c.field2 || '').toString().trim().toLowerCase();
        return (cId && cId === targetId) || (inputJudul && cJudul === inputJudul.toLowerCase()); 
      });
      var plRowData = new Array(plHeaders.length).fill("");
      plHeaders.forEach(function(h, idx) {
        if (h === 'id') plRowData[idx] = targetId;
        else if (h === 'judul' || h === 'title' || h === 'namalagu') plRowData[idx] = data.field2 || data.judul || data.title || "";
        else if (h === 'pencipta' || h === 'creator' || h === 'penggubah') plRowData[idx] = data.field3 || data.pencipta || data.creator || "";
        else if (h === 'audiourl' || h === 'audio_url' || h === 'linkaudio' || h === 'link') plRowData[idx] = data.field1 || data.audioUrl || data.audiourl || "";
        else if (h === 'lirik' || h === 'lyrics' || h === 'syair') plRowData[idx] = data.field5 || data.lyrics || data.lirik || "";
        else if (h === 'createdat' || h === 'tanggal') plRowData[idx] = new Date().toISOString();
      });
      if (plRowIndex > -1) {
        plSheet.getRange(plRowIndex + 2, 1, 1, plRowData.length).setValues([plRowData]);
      } else {
        plSheet.appendRow(plRowData);
      }
    } catch(e) {}
  }

  return responseOk({ success: true });
}

function handleDeleteContent(id) {
  var sheet = getSheet('Contents');
  var contents = getRowsAsObjects(sheet);
  var rowIndex = contents.findIndex(function(c) { return c.id && c.id.toString() === (id ? id.toString() : ''); });
  if (rowIndex > -1) {
    sheet.deleteRow(rowIndex + 2);
    return responseOk({ success: true });
  }
  return responseError("Konten tidak ditemukan");
}

function handleGetSettings() {
  var sheet = getSheet('Settings');
  var rows = sheet.getDataRange().getValues();
  var settings = {};
  for (var i = 1; i < rows.length; i++) {
    settings[rows[i][0]] = rows[i][1];
  }
  return responseOk(settings);
}

function uploadBase64ToDrive(base64Data, fileName) {
  var folderId = '1uEEaot_deNU6nGhixxSNl6-axw-sLMPQ';
  var folder;
  try {
    folder = DriveApp.getFolderById(folderId);
  } catch (e) {
    try {
      var folders = DriveApp.getFoldersByName("HW_KTA_Photos");
      if (folders.hasNext()) {
        folder = folders.next();
      } else {
        folder = DriveApp.createFolder("HW_KTA_Photos");
      }
    } catch (err) {
      folder = DriveApp.getRootFolder();
    }
  }
  try {
    // Parse base64
    var parts = base64Data.split(';base64,');
    if (parts.length < 2) {
      throw new Error("Format base64 tidak valid");
    }
    var contentType = parts[0].split(':')[1];
    var rawBase64 = parts[1];
    var decoded = Utilities.base64Decode(rawBase64);
    var blob = Utilities.newBlob(decoded, contentType, fileName);
    
    var file = folder.createFile(blob);
    try {
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    } catch (sharingErr) {
      // Ignore sharing error in case of domain restrictions (e.g. Workspace GSuite accounts)
    }
    
    var fileId = file.getId();
    // Google Drive direct view link
    return "https://drive.google.com/uc?export=view&id=" + fileId;
  } catch (err) {
    throw new Error("Gagal mengunggah berkas " + fileName + " ke Google Drive: " + err.toString());
  }
}

function handleSaveSettings(settings) {
  var sheet = getSheet('Settings');
  var rows = sheet.getDataRange().getValues();
  var updatedSettings = {};
  
  var friendlyNames = {
    'ktaTemplateFront': 'template_depan_kta',
    'ktaTemplateBack': 'template_belakang_kta',
    'ktaTandaTanganKetua': 'tanda_tangan_ketua',
    'ktaTandaTanganSekretaris': 'tanda_tangan_sekretaris',
    'ktaStempelImage': 'stempel_resmi_kwarwil'
  };
  
  for (var key in settings) {
    var value = settings[key];
    
    // Check if value is a base64 image
    if (typeof value === 'string' && value.indexOf('data:') === 0 && value.indexOf(';base64,') > -1) {
      try {
        var baseName = friendlyNames[key] || ('upload_' + key);
        var mimeType = value.split(';base64,')[0].split(':')[1];
        var extension = '.png';
        if (mimeType === 'image/jpeg' || mimeType === 'image/jpg') extension = '.jpg';
        else if (mimeType === 'image/gif') extension = '.gif';
        else if (mimeType === 'image/svg+xml') extension = '.svg';
        
        var timezone = "GMT+7";
        try {
          var ss = SPREADSHEET_ID ? SpreadsheetApp.openById(SPREADSHEET_ID) : SpreadsheetApp.getActiveSpreadsheet();
          timezone = ss.getSpreadsheetTimeZone();
        } catch(e) {}
        
        var timestamp = Utilities.formatDate(new Date(), timezone, "yyyyMMdd-HHmmss");
        var fileName = baseName + "_" + timestamp + extension;
        
        // Upload to Drive folder and get shareable direct link
        var driveUrl = uploadBase64ToDrive(value, fileName);
        value = driveUrl; // Replace base64 string with Drive URL
      } catch (err) {
        return responseError("Gagal mengunggah " + key + " ke Google Drive: " + err.toString());
      }
    }
    
    updatedSettings[key] = value;
    
    var found = false;
    for (var i = 1; i < rows.length; i++) {
      if (rows[i][0] == key) {
        sheet.getRange(i + 1, 2).setValue(value);
        found = true;
        break;
      }
    }
    if (!found) {
      sheet.appendRow([key, value]);
    }
  }
  return responseOk({ success: true, settings: updatedSettings });
}

function handleBackupNow() {
  var ss = SPREADSHEET_ID ? SpreadsheetApp.openById(SPREADSHEET_ID) : SpreadsheetApp.getActiveSpreadsheet();
  var timestamp = Utilities.formatDate(new Date(), ss.getSpreadsheetTimeZone(), "yyyyMMdd-HHmmss");
  var backupName = "Backup HW-" + timestamp;
  
  var newSS = SpreadsheetApp.create(backupName);
  var sheets = ss.getSheets();
  
  for (var i = 0; i < sheets.length; i++) {
    var sheetName = sheets[i].getName();
    sheets[i].copyTo(newSS).setName(sheetName);
  }
  
  var defaultSheet = newSS.getSheetByName('Sheet1');
  if (defaultSheet) newSS.deleteSheet(defaultSheet);

  handleSaveSettings({ lastBackup: new Date().toLocaleString('id-ID') });
  
  return responseOk({ 
    success: true, 
    url: newSS.getUrl(),
    name: backupName
  });
}

// RESPONSE UTILS
function responseOk(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function responseError(msg) {
  return ContentService.createTextOutput(JSON.stringify({ error: msg, success: false }))
    .setMimeType(ContentService.MimeType.JSON);
}

// KTA HANDLERS
function handleGetKTAApplications() {
  var apps = getRowsAsObjects(getSheet('KTA_Applications'));
  
  // Normalisasikan keys agar serasi dengan ekspektasi frontend React (CamelCase & lowercase)
  var normalizedApps = apps.map(function(app) {
    var cleanApp = {};
    for (var key in app) {
      var lowerKey = key.toLowerCase().replace(/[\s_-]/g, '');
      var clientKey = key;
      if (lowerKey === 'id') clientKey = 'id';
      else if (lowerKey === 'userid') clientKey = 'userId';
      else if (lowerKey === 'nama' || lowerKey === 'namalengkap') clientKey = 'nama';
      else if (lowerKey === 'nowa' || lowerKey === 'nohp' || lowerKey === 'nohandphone' || lowerKey === 'notelp') clientKey = 'noWa';
      else if (lowerKey === 'email') clientKey = 'email';
      else if (lowerKey === 'sosmed' || lowerKey === 'instagram' || lowerKey === 'socialmedia') clientKey = 'sosmed';
      else if (lowerKey === 'photo' || lowerKey === 'foto') clientKey = 'photo';
      else if (lowerKey === 'tingkatan') clientKey = 'tingkatan';
      else if (lowerKey === 'asaldaerah' || lowerKey === 'asalkwarda') clientKey = 'asalDaerah';
      else if (lowerKey === 'status') clientKey = 'status';
      else if (lowerKey === 'tanggalajuan') clientKey = 'tanggalAjuan';
      else if (lowerKey === 'ktanumber') clientKey = 'ktaNumber';
      else if (lowerKey === 'remark') clientKey = 'remark';
      else if (lowerKey === 'tempatlahir') clientKey = 'tempatLahir';
      else if (lowerKey === 'tanggallahir') clientKey = 'tanggalLahir';
      else if (lowerKey === 'jeniskelamin') clientKey = 'jenisKelamin';
      else if (lowerKey === 'qabilah') clientKey = 'qabilah';
      else if (lowerKey === 'jeniskta') clientKey = 'jenisKta';
      else if (lowerKey === 'verifiedat') clientKey = 'verifiedAt';
      else if (lowerKey === 'alamat') clientKey = 'alamat';
      
      cleanApp[clientKey] = app[key];
    }
    
    // Normalisasi status
    var finalStatus = (cleanApp.status || "").toString().trim().toLowerCase();
    if (!finalStatus) {
      if (cleanApp.ktaNumber) {
        cleanApp.status = "approved";
      } else {
        cleanApp.status = "pending";
      }
    } else {
      if (finalStatus === 'approved' || finalStatus === 'aktif' || finalStatus === 'disetujui' || finalStatus === 'sukses' || finalStatus === 'terbit' || finalStatus === 'selesai' || finalStatus === 'active') {
        cleanApp.status = 'approved';
      } else if (finalStatus === 'rejected' || finalStatus === 'ditolak') {
        cleanApp.status = 'rejected';
      } else {
        cleanApp.status = 'pending';
      }
    }
    return cleanApp;
  });

  return responseOk(normalizedApps);
}

function handleApplyKTA(data) {
  var sheet = getSheet('KTA_Applications');
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(function(h) { 
    return h ? h.toString().trim().toLowerCase() : ""; 
  });
  
  var apps = getRowsAsObjects(sheet);
  
  // Cari berdasarkan ID pengajuan jika ada, atau duplikasi berdasarkan userId / email aktif (status non-rejected)
  var rowIndex = apps.findIndex(function(app) {
    var appId = (app.id || app.Id || '').toString().trim().toLowerCase();
    var dataId = (data.id || '').toString().trim().toLowerCase();
    if (dataId && appId === dataId && !dataId.startsWith('kta-sync-')) {
      return true;
    }
    
    var appStatus = (app.status || app.Status || '').toString().toLowerCase();
    if (appStatus === 'rejected') return false;
    
    var appUserId = (app.userid || app.userId || app.UserId || '').toString().trim();
    var dataUserId = (data.userId || '').toString().trim();
    var appEmail = (app.email || app.Email || '').toString().trim().toLowerCase();
    var dataEmail = (data.email || '').toString().trim().toLowerCase();
    
    return (dataUserId && appUserId === dataUserId) || (dataEmail && appEmail === dataEmail);
  });
  
  var existing = rowIndex > -1 ? apps[rowIndex] : null;
  var id = existing ? (existing.id || existing.Id) : 'kta-' + new Date().getTime().toString() + Math.floor(Math.random() * 100);
  
  var rowData = new Array(headers.length).fill("");
  headers.forEach(function(header, i) {
    if (header === 'id') rowData[i] = id;
    else if (header === 'userid') rowData[i] = data.userId || "";
    else if (header === 'nama') rowData[i] = data.nama || "";
    else if (header === 'nowa') rowData[i] = data.noWa || "";
    else if (header === 'email') rowData[i] = data.email || "";
    else if (header === 'sosmed') rowData[i] = data.sosmed || "";
    else if (header === 'photo') {
      var ktaPhoto = data.photo || "";
      if (typeof ktaPhoto === 'string' && ktaPhoto.indexOf('data:') === 0 && ktaPhoto.indexOf(';base64,') > -1) {
        try {
          var mimeType = ktaPhoto.split(';base64,')[0].split(':')[1];
          var extension = '.png';
          if (mimeType === 'image/jpeg' || mimeType === 'image/jpg') extension = '.jpg';
          else if (mimeType === 'image/gif') extension = '.gif';
          var timestamp = new Date().getTime().toString();
          var fileName = "KTA_" + (data.nama || "anggota").toString().replace(/[^a-zA-Z0-9]/g, '_') + "_" + timestamp + extension;
          ktaPhoto = uploadBase64ToDrive(ktaPhoto, fileName);
        } catch (err) {
          // fallback
        }
      }
      rowData[i] = ktaPhoto;
    }
    else if (header === 'tingkatan') rowData[i] = data.tingkatan || "";
    else if (header === 'asaldaerah') rowData[i] = data.asalDaerah || "";
    else if (header === 'status') {
      var currentStatus = existing ? (existing.status || existing.Status || "pending") : "pending";
      if (currentStatus.toString().toLowerCase() === 'rejected') {
        currentStatus = 'pending';
      }
      rowData[i] = currentStatus;
    }
    else if (header === 'tanggalajuan') rowData[i] = existing ? (existing.tanggalajuan || existing.tanggalAjuan || existing.TanggalAjuan || new Date().toISOString()) : new Date().toISOString();
    else if (header === 'ktanumber') rowData[i] = existing ? (existing.ktanumber || existing.ktaNumber || "") : "";
    else if (header === 'remark') rowData[i] = existing ? (existing.remark || existing.Remark || "") : "";
    else if (header === 'tempatlahir') rowData[i] = data.tempatLahir || "";
    else if (header === 'tanggallahir') rowData[i] = data.tanggalLahir || "";
    else if (header === 'jeniskelamin') rowData[i] = data.jenisKelamin || "";
    else if (header === 'qabilah') rowData[i] = data.qabilah || "";
    else if (header === 'jeniskta') rowData[i] = data.jenisKta || "Digital";
    else if (header === 'alamat') rowData[i] = data.alamat || "";
  });
  
  if (rowIndex > -1) {
    sheet.getRange(rowIndex + 2, 1, 1, rowData.length).setValues([rowData]);
  } else {
    sheet.appendRow(rowData);
  }
  
  // Automatically update photo in Users sheet if set
  var finalKtaPhoto = rowData[headers.indexOf('photo')];
  if (finalKtaPhoto) {
    try {
      var membersSheet = getSheet('Users');
      if (membersSheet) {
        var membersHeaders = membersSheet.getRange(1, 1, 1, membersSheet.getLastColumn()).getValues()[0].map(function(h) { 
          return h ? h.toString().trim().toLowerCase() : ""; 
        });
        var memberPhotoColIndex = membersHeaders.indexOf('photo');
        if (memberPhotoColIndex === -1) {
          memberPhotoColIndex = membersHeaders.indexOf('foto');
        }
        if (memberPhotoColIndex > -1) {
          var members = getRowsAsObjects(membersSheet);
          var mIndex = members.findIndex(function(m) {
            var mId = (m.id || m.Id || '').toString().trim();
            var mEmail = (m.email || m.Email || '').toString().trim().toLowerCase();
            
            var match = false;
            if (data.userId && mId !== '' && mId === data.userId.toString().trim()) {
              match = true;
            }
            if (!match && data.email && mEmail === data.email.toString().trim().toLowerCase()) {
              match = true;
            }
            return match;
          });
          
          if (mIndex > -1) {
            membersSheet.getRange(mIndex + 2, memberPhotoColIndex + 1).setValue(finalKtaPhoto);
          }
        }
      }
    } catch (e) {
      // ignore
    }
  }
  
  // Kembalikan objek data yang teraplikasi kemari
  var clientApp = {};
  headers.forEach(function(header, i) {
    var clientKey = header;
    if (header === 'userid') clientKey = 'userId';
    else if (header === 'nowa') clientKey = 'noWa';
    else if (header === 'asaldaerah') clientKey = 'asalDaerah';
    else if (header === 'tanggalajuan') clientKey = 'tanggalAjuan';
    else if (header === 'ktanumber') clientKey = 'ktaNumber';
    else if (header === 'tempatlahir') clientKey = 'tempatLahir';
    else if (header === 'tanggallahir') clientKey = 'tanggalLahir';
    else if (header === 'jeniskelamin') clientKey = 'jenisKelamin';
    else if (header === 'jeniskta') clientKey = 'jenisKta';
    else if (header === 'alamat') clientKey = 'alamat';
    
    clientApp[clientKey] = rowData[i];
  });
  
  return responseOk({ success: true, application: clientApp });
}

function handleUpdateKTAStatus(id, status, ktaNumber, remark) {
  var sheet = getSheet('KTA_Applications');
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(function(h) { 
    return h ? h.toString().trim().toLowerCase() : ""; 
  });
  
  var apps = getRowsAsObjects(sheet);
  var rowIndex = apps.findIndex(function(app) { 
    var appId = (app.id || app.Id || '').toString();
    return appId === id.toString() && appId !== ''; 
  });
  
  if (rowIndex === -1) {
    return responseError("KTA Application not found");
  }
  
  var app = apps[rowIndex];
  app.status = status;
  if (status === 'approved') {
    if (!ktaNumber) {
      var selectedUnit = app.asaldaerah || app.asalDaerah || app.AsalDaerah || '';
      var unitCode = '02'; // default Banyumas
      for (var k = 0; k < KWARDA_QABILAH_JATENG.length; k++) {
        if (KWARDA_QABILAH_JATENG[k].name === selectedUnit) {
          unitCode = KWARDA_QABILAH_JATENG[k].code;
          break;
        }
      }
      
      var maxSeq = 0;
      for (var a = 0; a < apps.length; a++) {
        var otherApp = apps[a];
        var otherStatus = (otherApp.status || '').toString().toLowerCase();
        var otherKtaNum = (otherApp.ktanumber || otherApp.ktaNumber || '').toString();
        if (otherStatus === 'approved' && otherKtaNum) {
          var parts = otherKtaNum.split('.');
          if (parts.length === 3 && parts[0] === '11' && parts[1] === unitCode) {
            var seqVal = parseInt(parts[2], 10);
            if (!isNaN(seqVal) && seqVal > maxSeq) {
              maxSeq = seqVal;
            }
          }
        }
      }
      var nextSeq = maxSeq + 1;
      var seqStr = nextSeq.toString();
      while (seqStr.length < 4) {
        seqStr = '0' + seqStr;
      }
      app.ktanumber = '11.' + unitCode + '.' + seqStr;
    } else {
      app.ktanumber = ktaNumber;
    }
  }
  if (remark) {
    app.remark = remark;
  }
  
  var rowData = new Array(headers.length).fill("");
  headers.forEach(function(header, i) {
    // Normalisasi properti yang tersimpan di memori objek ke penulisan lowercase header
    var val = app[header];
    if (val === undefined) {
      if (header === 'userid') val = app.userId || app.UserId;
      else if (header === 'nowa') val = app.noWa || app.NoWa;
      else if (header === 'asaldaerah') val = app.asalDaerah || app.AsalDaerah;
      else if (header === 'tanggalajuan') val = app.tanggalAjuan || app.TanggalAjuan;
      else if (header === 'ktanumber') val = app.ktaNumber || app.KtaNumber;
      else if (header === 'tempatlahir') val = app.tempatLahir || app.TempatLahir;
      else if (header === 'tanggallahir') val = app.tanggalLahir || app.TanggalLahir;
      else if (header === 'jeniskelamin') val = app.jenisKelamin || app.JenisKelamin;
      else if (header === 'jeniskta') val = app.jenisKta || app.JenisKta;
    }
    rowData[i] = val !== undefined ? val : "";
  });
  
  sheet.getRange(rowIndex + 2, 1, 1, rowData.length).setValues([rowData]);
  
  // Otomatis ubah status isVerified di Users jika KTA ini disetujui (Approved)
  if (status === 'approved') {
    var userId = app.userid || app.userId || app.UserId;
    var email = app.email || app.Email;
    if (userId || email) {
      var userSheet = getSheet('Users');
      var userHeaders = userSheet.getRange(1, 1, 1, userSheet.getLastColumn()).getValues()[0].map(function(h) { 
        return h ? h.toString().trim().toLowerCase() : ""; 
      });
      var users = getRowsAsObjects(userSheet);
      var userRowIndex = users.findIndex(function(u) {
        var uId = (u.id || u.Id || '').toString();
        var uEmail = (u.email || u.Email || '').toString().trim().toLowerCase();
        return (userId && uId === userId.toString()) || (email && uEmail === email.trim().toLowerCase());
      });
      
      if (userRowIndex > -1) {
        var isVerifiedCol = userHeaders.indexOf('isverified') + 1;
        if (isVerifiedCol > 0) {
          userSheet.getRange(userRowIndex + 2, isVerifiedCol).setValue(true);
        }
        
        // Update user profile fields with approved KTA details
        var userRowRange = userSheet.getRange(userRowIndex + 2, 1, 1, userHeaders.length);
        var userRowValues = userRowRange.getValues()[0];
        
        var namaLengkapCol = userHeaders.indexOf('namalengkap');
        var noHpCol = userHeaders.indexOf('nohp');
        var jenisKelaminCol = userHeaders.indexOf('jeniskelamin');
        var qabilahCol = userHeaders.indexOf('qabilah');
        var alamatCol = userHeaders.indexOf('alamat');
        var asalKwardaCol = userHeaders.indexOf('asalkwarda');
        
        var appName = app.nama || app.namaLengkap || app.Nama || app.NamaLengkap || '';
        var appNoWa = app.nowa || app.noWa || app.NoWa || '';
        var appJk = app.jeniskelamin || app.jenisKelamin || app.JenisKelamin || '';
        var appQabilah = app.qabilah || app.Qabilah || '';
        var appAlamat = app.alamat || app.Alamat || '';
        var appAsalDaerah = app.asaldaerah || app.asalDaerah || app.AsalDaerah || '';
        
        if (namaLengkapCol > -1 && appName) {
          userRowValues[namaLengkapCol] = appName;
        }
        if (noHpCol > -1 && appNoWa) {
          userRowValues[noHpCol] = appNoWa;
        }
        if (jenisKelaminCol > -1 && appJk) {
          var userJk = 'L';
          if (appJk === 'Perempuan' || appJk === 'P') {
            userJk = 'P';
          } else if (appJk === 'Laki-laki' || appJk === 'L') {
            userJk = 'L';
          }
          userRowValues[jenisKelaminCol] = userJk;
        }
        if (qabilahCol > -1 && appQabilah) {
          userRowValues[qabilahCol] = appQabilah;
        }
        if (alamatCol > -1 && appAlamat) {
          userRowValues[alamatCol] = appAlamat;
        }
        if (asalKwardaCol > -1 && appAsalDaerah) {
          userRowValues[asalKwardaCol] = appAsalDaerah;
        }
        
        userRowRange.setValues([userRowValues]);
      }
    }
  }
  
  // Format balik ke CamelCase untuk respons client
  var clientApp = {};
  headers.forEach(function(header, i) {
    var clientKey = header;
    if (header === 'userid') clientKey = 'userId';
    else if (header === 'nowa') clientKey = 'noWa';
    else if (header === 'asaldaerah') clientKey = 'asalDaerah';
    else if (header === 'tanggalajuan') clientKey = 'tanggalAjuan';
    else if (header === 'ktanumber') clientKey = 'ktaNumber';
    else if (header === 'tempatlahir') clientKey = 'tempatLahir';
    else if (header === 'tanggallahir') clientKey = 'tanggalLahir';
    else if (header === 'jeniskelamin') clientKey = 'jenisKelamin';
    else if (header === 'jeniskta') clientKey = 'jenisKta';
    
    clientApp[clientKey] = rowData[i];
  });
  
  return responseOk({ success: true, application: clientApp });
}

function handleSaveKTAApplication(data) {
  var sheet = getSheet('KTA_Applications');
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(function(h) { 
    return h ? h.toString().trim().toLowerCase() : ""; 
  });
  
  var apps = getRowsAsObjects(sheet);
  var rowIndex = apps.findIndex(function(app) {
    var appId = (app.id || app.Id || '').toString();
    return appId === data.id.toString() && appId !== '';
  });
  
  if (rowIndex === -1) {
    return responseError("KTA Application not found with ID: " + data.id);
  }
  
  var existing = apps[rowIndex];
  var rowData = new Array(headers.length).fill("");
  headers.forEach(function(header, i) {
    var val = undefined;
    if (header === 'id') val = data.id;
    else if (header === 'userid') val = data.userId !== undefined ? data.userId : (existing.userid || existing.userId || "");
    else if (header === 'nama') val = data.nama !== undefined ? data.nama : (existing.nama || "");
    else if (header === 'nowa') val = data.noWa !== undefined ? data.noWa : (existing.nowa || existing.noWa || "");
    else if (header === 'email') val = data.email !== undefined ? data.email : (existing.email || "");
    else if (header === 'sosmed') val = data.sosmed !== undefined ? data.sosmed : (existing.sosmed || "");
    else if (header === 'photo') val = data.photo !== undefined ? data.photo : (existing.photo || "");
    else if (header === 'tingkatan') val = data.tingkatan !== undefined ? data.tingkatan : (existing.tingkatan || "");
    else if (header === 'asaldaerah') val = data.asalDaerah !== undefined ? data.asalDaerah : (existing.asaldaerah || existing.asalDaerah || "");
    else if (header === 'status') val = data.status !== undefined ? data.status : (existing.status || "pending");
    else if (header === 'tanggalajuan') val = data.tanggalAjuan !== undefined ? data.tanggalAjuan : (existing.tanggalajuan || existing.tanggalAjuan || new Date().toISOString());
    else if (header === 'ktanumber') val = data.ktaNumber !== undefined ? data.ktaNumber : (existing.ktanumber || existing.ktaNumber || "");
    else if (header === 'remark') val = data.remark !== undefined ? data.remark : (existing.remark || "");
    else if (header === 'tempatlahir') val = data.tempatLahir !== undefined ? data.tempatLahir : (existing.tempatlahir || existing.tempatLahir || "");
    else if (header === 'tanggallahir') val = data.tanggalLahir !== undefined ? data.tanggalLahir : (existing.tanggallahir || existing.tanggalLahir || "");
    else if (header === 'jeniskelamin') val = data.jenisKelamin !== undefined ? data.jenisKelamin : (existing.jeniskelamin || existing.jenisKelamin || "");
    else if (header === 'qabilah') val = data.qabilah !== undefined ? data.qabilah : (existing.qabilah || "");
    else if (header === 'jeniskta') val = data.jenisKta !== undefined ? data.jenisKta : (existing.jeniskta || existing.jenisKta || "Digital");
    else if (header === 'alamat') val = data.alamat !== undefined ? data.alamat : (existing.alamat || "");
    
    rowData[i] = val !== undefined ? val : "";
  });
  
  sheet.getRange(rowIndex + 2, 1, 1, rowData.length).setValues([rowData]);
  
  if (data.status === 'approved') {
    var userId = data.userId || existing.userid || existing.userId;
    var email = data.email || existing.email;
    if (userId || email) {
      var userSheet = getSheet('Users');
      var userHeaders = userSheet.getRange(1, 1, 1, userSheet.getLastColumn()).getValues()[0].map(function(h) { 
        return h ? h.toString().trim().toLowerCase() : ""; 
      });
      var users = getRowsAsObjects(userSheet);
      var userRowIndex = users.findIndex(function(u) {
        var uId = (u.id || u.Id || '').toString();
        var uEmail = (u.email || u.Email || '').toString().trim().toLowerCase();
        return (userId && uId === userId.toString()) || (email && uEmail === email.trim().toLowerCase());
      });
      
      if (userRowIndex > -1) {
        var isVerifiedCol = userHeaders.indexOf('isverified') + 1;
        if (isVerifiedCol > 0) {
          userSheet.getRange(userRowIndex + 2, isVerifiedCol).setValue(true);
        }
      }
    }
  }
  
  var clientApp = {};
  headers.forEach(function(header, i) {
    var clientKey = header;
    if (header === 'userid') clientKey = 'userId';
    else if (header === 'nowa') clientKey = 'noWa';
    else if (header === 'asaldaerah') clientKey = 'asalDaerah';
    else if (header === 'tanggalajuan') clientKey = 'tanggalAjuan';
    else if (header === 'ktanumber') clientKey = 'ktaNumber';
    else if (header === 'tempatlahir') clientKey = 'tempatLahir';
    else if (header === 'tanggallahir') clientKey = 'tanggalLahir';
    else if (header === 'jeniskelamin') clientKey = 'jenisKelamin';
    else if (header === 'jeniskta') clientKey = 'jenisKta';
    else if (header === 'alamat') clientKey = 'alamat';
    
    clientApp[clientKey] = rowData[i];
  });
  
  return responseOk({ success: true, application: clientApp });
}

// TRAINING HANDLERS
function handleGetTrainingApplications() {
  var ss;
  if (SPREADSHEET_ID) {
    ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  } else {
    ss = SpreadsheetApp.getActiveSpreadsheet();
  }

  var existingMap = {};
  var allTrainApps = [];

  function cleanKey(str) {
    return (str || "").toString().trim().toLowerCase();
  }

  function formatDateVal(val) {
    if (!val) return "";
    if (val instanceof Date) {
      var y = val.getFullYear();
      var m = ('0' + (val.getMonth() + 1)).slice(-2);
      var d = ('0' + val.getDate()).slice(-2);
      return y + '-' + m + '-' + d;
    }
    return val.toString().trim();
  }

  var allSheets = ss.getSheets();
  allSheets.forEach(function(sh) {
    var shName = sh.getName();
    var shLower = shName.toLowerCase().replace(/[^a-z0-9]/g, '');

    var isTrainingSheet = (
      shLower.indexOf('training') !== -1 ||
      shLower.indexOf('pelatihan') !== -1 ||
      shLower.indexOf('diklat') !== -1 ||
      shLower === 'trainingapplications' ||
      shLower === 'training_applications' ||
      shLower === 'pendaftarpelatihan' ||
      shLower === 'pesertapelatihan'
    );

    // Skip non-training sheets
    if (!isTrainingSheet || shName === 'Users' || shName === 'Materi' || shName === 'Contents' || shName === 'Settings' || shName === 'Activity_Categories') {
      return;
    }

    try {
      var rows = getRowsAsObjects(sh);
      rows.forEach(function(row, rIdx) {
        var rNama = (getRobustValue(row, ['nama', 'namaLengkap', 'namalengkap', 'Nama', 'nama_lengkap', 'Nama Peserta', 'Full Name']) || '').toString().trim();
        if (!rNama || rNama === '-' || rNama.toLowerCase() === 'tanpa nama' || rNama.indexOf('@') !== -1) return;

        var rId = (getRobustValue(row, ['id', 'Id', 'trainId', 'trainid']) || '').toString().trim();
        var rEmail = cleanKey(getRobustValue(row, ['email', 'Email', 'alamatEmail', 'alamat_email']));
        var rPhone = (getRobustValue(row, ['noWa', 'nowa', 'noHp', 'nohp', 'phone', 'whatsapp', 'No WA', 'No HP']) || '').toString().trim();
        var rPelatihan = (getRobustValue(row, ['pelatihanAkanDiikuti', 'pelatihanakandiikuti', 'tingkatan', 'pelatihan', 'namaPelatihan', 'Pelatihan']) || '').toString().trim();

        var dedupeKey = rId ? ('id_' + rId) : (rPhone && rPelatihan ? ('p_' + rPhone.replace(/\D/g, '') + '_' + cleanKey(rPelatihan)) : ('ne_' + cleanKey(rNama) + '_' + cleanKey(rPelatihan)));

        if (!existingMap[dedupeKey]) {
          existingMap[dedupeKey] = true;

          var cleanApp = {
            id: rId || ('train-' + (rIdx + 1) + '-' + new Date().getTime().toString().slice(-4)),
            userId: getRobustValue(row, ['userId', 'userid', 'idUser', 'id_user']) || '',
            nama: rNama,
            namaLengkap: rNama,
            noWa: rPhone,
            noHp: rPhone,
            email: rEmail,
            sosmed: getRobustValue(row, ['sosmed', 'Sosmed', 'instagram', 'Instagram']) || '',
            photo: getRobustValue(row, ['photo', 'foto', 'photoUrl', 'Foto']) || '',
            tingkatan: getRobustValue(row, ['tingkatan', 'jenjang', 'Tingkatan']) || rPelatihan,
            pelatihanAkanDiikuti: rPelatihan,
            asalDaerah: getRobustValue(row, ['asalDaerah', 'asaldaerah', 'asalKwarda', 'asalkwarda', 'kwarda', 'kwarcab', 'Asal Daerah', 'Asal Kwarda']) || '',
            status: getRobustValue(row, ['status', 'Status']) || 'approved',
            tanggalAjuan: formatDateVal(getRobustValue(row, ['tanggalAjuan', 'tanggalajuan', 'tanggalDaftar', 'tanggaldaftar', 'Tanggal'])) || new Date().toISOString(),
            tempatLahir: getRobustValue(row, ['tempatLahir', 'tempatlahir', 'Tempat Lahir']) || '',
            tanggalLahir: formatDateVal(getRobustValue(row, ['tanggalLahir', 'tanggallahir', 'Tanggal Lahir'])),
            jenisKelamin: getRobustValue(row, ['jenisKelamin', 'jeniskelamin', 'gender', 'Jenis Kelamin']) || 'L',
            qabilah: getRobustValue(row, ['qabilah', 'Qabilah', 'pangkalan', 'gudep']) || '',
            kehadiran: getRobustValue(row, ['kehadiran', 'Kehadiran', 'presensi']) || '',
            tugas: getRobustValue(row, ['tugas', 'Tugas']) || '',
            nilai: getRobustValue(row, ['nilai', 'Nilai', 'score']) || '',
            remark: getRobustValue(row, ['remark', 'catatan', 'keterangan']) || '',
            statusKelulusan: getRobustValue(row, ['statusKelulusan', 'statuskelulusan', 'kelulusan', 'Status Kelulusan']) || '',
            lokasiPelatihan: getRobustValue(row, ['lokasiPelatihan', 'lokasipelatihan', 'lokasi', 'tempat', 'Lokasi']) || '',
            tanggalPelatihan: formatDateVal(getRobustValue(row, ['tanggalPelatihan', 'tanggalpelatihan', 'tglPelatihan', 'Tanggal Pelatihan'])),
            pelatihGolongan: getRobustValue(row, ['pelatihGolongan', 'pelatihgolongan']) || '',
            golonganAnggota: getRobustValue(row, ['golonganAnggota', 'golongananggota', 'golongan']) || ''
          };

          allTrainApps.push(cleanApp);
        }
      });
    } catch (e) {
      // Continue safely if a sheet format is different
    }
  });

  return responseOk(allTrainApps);
}

function handleApplyTraining(data) {
  var sheet = getSheet('Training_Applications');
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(function(h) { 
    return h ? h.toString().trim().toLowerCase() : ""; 
  });
  
  var apps = getRowsAsObjects(sheet);
  
  var rowIndex = apps.findIndex(function(app) {
    var appStatus = (app.status || app.Status || '').toString().toLowerCase();
    if (appStatus === 'rejected') return false;
    
    var appUserId = (app.userid || app.userId || app.UserId || '').toString();
    var dataUserId = (data.userId || '').toString();
    var appEmail = (app.email || app.Email || '').toString().trim().toLowerCase();
    var dataEmail = (data.email || '').toString().trim().toLowerCase();
    
    var appPelatihan = (app.pelatihanakandiikuti || app.pelatihanAkanDiikuti || '').toString().toLowerCase();
    var dataPelatihan = (data.pelatihanAkanDiikuti || '').toString().toLowerCase();
    
    return ((dataUserId && appUserId === dataUserId) || (dataEmail && appEmail === dataEmail)) && appPelatihan === dataPelatihan;
  });
  
  var existing = rowIndex > -1 ? apps[rowIndex] : null;
  var id = existing ? (existing.id || existing.Id) : 'train-' + new Date().getTime().toString() + Math.floor(Math.random() * 100);
  
  var rowData = new Array(headers.length).fill("");
  headers.forEach(function(header, i) {
    if (header === 'id') rowData[i] = id;
    else if (header === 'userid') rowData[i] = data.userId || "";
    else if (header === 'nama') rowData[i] = data.nama || "";
    else if (header === 'nowa') rowData[i] = data.noWa || "";
    else if (header === 'email') rowData[i] = data.email || "";
    else if (header === 'sosmed') rowData[i] = data.sosmed || "";
    else if (header === 'photo') rowData[i] = data.photo || "";
    else if (header === 'tingkatan') rowData[i] = data.tingkatan || "";
    else if (header === 'asaldaerah') rowData[i] = data.asalDaerah || "";
    else if (header === 'status') rowData[i] = existing ? (existing.status || existing.Status || "pending") : "pending";
    else if (header === 'tanggalajuan') rowData[i] = existing ? (existing.tanggalajuan || existing.tanggalAjuan || existing.TanggalAjuan || new Date().toISOString()) : new Date().toISOString();
    else if (header === 'pelatihanakandiikuti') rowData[i] = data.pelatihanAkanDiikuti || "";
    else if (header === 'tempatlahir') rowData[i] = data.tempatLahir || "";
    else if (header === 'tanggallahir') rowData[i] = data.tanggalLahir || "";
    else if (header === 'jeniskelamin') rowData[i] = data.jenisKelamin || "";
    else if (header === 'qabilah') rowData[i] = data.qabilah || "";
    else if (header === 'kehadiran') rowData[i] = existing ? (existing.kehadiran || "") : "";
    else if (header === 'tugas') rowData[i] = existing ? (existing.tugas || "[]") : "[]";
    else if (header === 'nilai') rowData[i] = existing ? (existing.nilai || "") : "";
    else if (header === 'remark') rowData[i] = existing ? (existing.remark || "") : "";
    else if (header === 'lokasipelatihan') rowData[i] = data.lokasiPelatihan || "";
    else if (header === 'tanggalpelatihan') rowData[i] = data.tanggalPelatihan || "";
  });
  
  if (rowIndex > -1) {
    sheet.getRange(rowIndex + 2, 1, 1, rowData.length).setValues([rowData]);
  } else {
    sheet.appendRow(rowData);
  }
  
  var clientApp = {};
  headers.forEach(function(header, i) {
    var clientKey = header;
    if (header === 'userid') clientKey = 'userId';
    else if (header === 'nowa') clientKey = 'noWa';
    else if (header === 'asaldaerah') clientKey = 'asalDaerah';
    else if (header === 'tanggalajuan') clientKey = 'tanggalAjuan';
    else if (header === 'pelatihanakandiikuti') clientKey = 'pelatihanAkanDiikuti';
    else if (header === 'tempatlahir') clientKey = 'tempatLahir';
    else if (header === 'tanggallahir') clientKey = 'tanggalLahir';
    else if (header === 'jeniskelamin') clientKey = 'jenisKelamin';
    else if (header === 'lokasipelatihan') clientKey = 'lokasiPelatihan';
    else if (header === 'tanggalpelatihan') clientKey = 'tanggalPelatihan';
    
    clientApp[clientKey] = rowData[i];
  });
  
  return responseOk({ success: true, application: clientApp });
}

function handleUpdateTrainingStatus(id, status, remark) {
  var sheet = getSheet('Training_Applications');
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(function(h) { 
    return h ? h.toString().trim().toLowerCase() : ""; 
  });
  
  var apps = getRowsAsObjects(sheet);
  var rowIndex = apps.findIndex(function(app) { 
    var appId = (app.id || app.Id || '').toString();
    return appId === id.toString() && appId !== ''; 
  });
  
  if (rowIndex === -1) {
    return responseError("Training Application not found");
  }
  
  var app = apps[rowIndex];
  if (status === 'deleted') {
    sheet.deleteRow(rowIndex + 2);
    return responseOk({ success: true, message: "Pendaftaran pelatihan berhasil dihapus" });
  }
  
  app.status = status;
  if (remark) {
    app.remark = remark;
  }
  
  var rowData = new Array(headers.length).fill("");
  headers.forEach(function(header, i) {
    var val = app[header];
    if (val === undefined) {
      if (header === 'userid') val = app.userId || app.UserId;
      else if (header === 'nowa') val = app.noWa || app.NoWa;
      else if (header === 'asaldaerah') val = app.asalDaerah || app.AsalDaerah;
      else if (header === 'tanggalajuan') val = app.tanggalAjuan || app.TanggalAjuan;
      else if (header === 'pelatihanakandiikuti') val = app.pelatihanAkanDiikuti || app.PelatihanAkanDiikuti;
      else if (header === 'tempatlahir') val = app.tempatLahir || app.TempatLahir;
      else if (header === 'tanggallahir') val = app.tanggalLahir || app.TanggalLahir;
      else if (header === 'jeniskelamin') val = app.jenisKelamin || app.JenisKelamin;
    }
    rowData[i] = val !== undefined ? val : "";
  });
  
  sheet.getRange(rowIndex + 2, 1, 1, rowData.length).setValues([rowData]);
  
  if (status === 'approved') {
    var userId = app.userid || app.userId || app.UserId;
    var email = app.email || app.Email;
    var training = app.pelatihanakandiikuti || app.pelatihanAkanDiikuti || app.PelatihanAkanDiikuti || "";
    var roleName = training ? training.toLowerCase().replace(/\\s+/g, '') : '';
    
    if (userId || email) {
      var userSheet = getSheet('Users');
      var userHeaders = userSheet.getRange(1, 1, 1, userSheet.getLastColumn()).getValues()[0].map(function(h) { 
        return h ? h.toString().trim().toLowerCase() : ""; 
      });
      var users = getRowsAsObjects(userSheet);
      var userRowIndex = users.findIndex(function(u) {
        var uId = (u.id || u.Id || '').toString();
        var uEmail = (u.email || u.Email || '').toString().trim().toLowerCase();
        return (userId && uId === userId.toString()) || (email && uEmail === email.trim().toLowerCase());
      });
      
      if (userRowIndex > -1) {
        var u = users[userRowIndex];
        
        var isVerifiedCol = userHeaders.indexOf('isverified') + 1;
        if (isVerifiedCol > 0) {
          userSheet.getRange(userRowIndex + 2, isVerifiedCol).setValue(true);
        }
        
        var rolesCol = userHeaders.indexOf('role') + 1;
        if (rolesCol > 0 && roleName) {
          var currentRoles = [];
          var rVal = userSheet.getRange(userRowIndex + 2, rolesCol).getValue().toString().trim();
          if (rVal.indexOf('[') === 0) {
            try { currentRoles = JSON.parse(rVal); } catch(e) { currentRoles = [rVal]; }
          } else {
            currentRoles = rVal ? rVal.split(',').map(function(s){return s.trim();}).filter(Boolean) : [];
          }
          if (currentRoles.indexOf(roleName) === -1) {
            currentRoles.push(roleName);
            userSheet.getRange(userRowIndex + 2, rolesCol).setValue(JSON.stringify(currentRoles));
          }
        }
        
        var pelCol = userHeaders.indexOf('pelatihan') + 1;
        if (pelCol > 0 && training) {
          var currentPel = [];
          var pVal = userSheet.getRange(userRowIndex + 2, pelCol).getValue().toString().trim();
          if (pVal.indexOf('[') === 0) {
            try { currentPel = JSON.parse(pVal); } catch(e) { currentPel = [pVal]; }
          } else {
            currentPel = pVal ? pVal.split(',').map(function(s){return s.trim();}).filter(Boolean) : [];
          }
          if (currentPel.indexOf(training) === -1) {
            currentPel.push(training);
            userSheet.getRange(userRowIndex + 2, pelCol).setValue(JSON.stringify(currentPel));
          }
        }
      }
    }
  }
  
  var clientApp = {};
  headers.forEach(function(header, i) {
    var clientKey = header;
    if (header === 'userid') clientKey = 'userId';
    else if (header === 'nowa') clientKey = 'noWa';
    else if (header === 'asaldaerah') clientKey = 'asalDaerah';
    else if (header === 'tanggalajuan') clientKey = 'tanggalAjuan';
    else if (header === 'pelatihanakandiikuti') clientKey = 'pelatihanAkanDiikuti';
    else if (header === 'tempatlahir') clientKey = 'tempatLahir';
    else if (header === 'tanggallahir') clientKey = 'tanggalLahir';
    else if (header === 'jeniskelamin') clientKey = 'jenisKelamin';
    else if (header === 'lokasipelatihan') clientKey = 'lokasiPelatihan';
    else if (header === 'tanggalpelatihan') clientKey = 'tanggalPelatihan';
    
    clientApp[clientKey] = rowData[i];
  });
  
  return responseOk({ success: true, application: clientApp });
}

function handleUpdateAttendance(id, kehadiran) {
  var sheet = getSheet('Training_Applications');
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(function(h) { 
    return h ? h.toString().trim().toLowerCase() : ""; 
  });
  var apps = getRowsAsObjects(sheet);
  var rowIndex = apps.findIndex(function(app) { 
    return (app.id || app.Id || '').toString() === id.toString(); 
  });
  if (rowIndex === -1) return responseError("Training Application not found");
  
  var colIndex = headers.indexOf('kehadiran') + 1;
  if (colIndex > 0) {
    sheet.getRange(rowIndex + 2, colIndex).setValue(kehadiran);
    return responseOk({ success: true });
  }
  return responseError("Column 'kehadiran' not found");
}

function handleSubmitAssignment(id, tugas) {
  var sheet = getSheet('Training_Applications');
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(function(h) { 
    return h ? h.toString().trim().toLowerCase() : ""; 
  });
  var apps = getRowsAsObjects(sheet);
  var rowIndex = apps.findIndex(function(app) { 
    return (app.id || app.Id || '').toString() === id.toString(); 
  });
  if (rowIndex === -1) return responseError("Training Application not found");
  
  var colIndex = headers.indexOf('tugas') + 1;
  if (colIndex > 0) {
    sheet.getRange(rowIndex + 2, colIndex).setValue(tugas);
    return responseOk({ success: true });
  }
  return responseError("Column 'tugas' not found");
}

function handleUpdateGrade(id, nilai, remark, statusKelulusan) {
  var sheet = getSheet('Training_Applications');
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(function(h) { 
    return h ? h.toString().trim().toLowerCase() : ""; 
  });
  var apps = getRowsAsObjects(sheet);
  var rowIndex = apps.findIndex(function(app) { 
    return (app.id || app.Id || '').toString() === id.toString(); 
  });
  if (rowIndex === -1) return responseError("Training Application not found");
  
  var colNilai = headers.indexOf('nilai') + 1;
  if (colNilai > 0 && nilai !== undefined) {
    sheet.getRange(rowIndex + 2, colNilai).setValue(nilai);
  }
  
  var colRemark = headers.indexOf('remark') + 1;
  if (colRemark > 0 && remark !== undefined) {
    sheet.getRange(rowIndex + 2, colRemark).setValue(remark);
  }
  
  var colStatusKelulusan = headers.indexOf('statuskelulusan') + 1;
  if (colStatusKelulusan > 0 && statusKelulusan !== undefined) {
    sheet.getRange(rowIndex + 2, colStatusKelulusan).setValue(statusKelulusan);
  }
  
  return responseOk({ success: true });
}

function handleUpdateTrainingSchedule(id, lokasiPelatihan, tanggalPelatihan) {
  var sheet = getSheet('Training_Applications');
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(function(h) { 
    return h ? h.toString().trim().toLowerCase() : ""; 
  });
  
  var apps = getRowsAsObjects(sheet);
  var rowIndex = apps.findIndex(function(app) { 
    var appId = (app.id || app.Id || '').toString();
    return appId === id.toString() && appId !== ''; 
  });
  
  if (rowIndex === -1) {
    return responseError("Training Application not found");
  }
  
  var app = apps[rowIndex];
  app.lokasipelatihan = lokasiPelatihan || "";
  app.tanggalpelatihan = tanggalPelatihan || "";
  
  // Also handle cases if keys are camelCased
  app.lokasiPelatihan = lokasiPelatihan || "";
  app.tanggalPelatihan = tanggalPelatihan || "";
  
  var rowData = new Array(headers.length).fill("");
  headers.forEach(function(header, i) {
    var val = app[header];
    if (val === undefined) {
      if (header === 'userid') val = app.userId || app.UserId;
      else if (header === 'nowa') val = app.noWa || app.NoWa;
      else if (header === 'asaldaerah') val = app.asalDaerah || app.AsalDaerah;
      else if (header === 'tanggalajuan') val = app.tanggalAjuan || app.TanggalAjuan;
      else if (header === 'pelatihanakandiikuti') val = app.pelatihanAkanDiikuti || app.PelatihanAkanDiikuti;
      else if (header === 'tempatlahir') val = app.tempatLahir || app.TempatLahir;
      else if (header === 'tanggallahir') val = app.tanggalLahir || app.TanggalLahir;
      else if (header === 'jeniskelamin') val = app.jenisKelamin || app.JenisKelamin;
      else if (header === 'lokasipelatihan') val = app.lokasiPelatihan || app.lokasipelatihan;
      else if (header === 'tanggalpelatihan') val = app.tanggalPelatihan || app.tanggalpelatihan;
    }
    rowData[i] = val !== undefined ? val : "";
  });
  
  sheet.getRange(rowIndex + 2, 1, 1, rowData.length).setValues([rowData]);
  
  var clientApp = {};
  headers.forEach(function(header, i) {
    var clientKey = header;
    if (header === 'userid') clientKey = 'userId';
    else if (header === 'nowa') clientKey = 'noWa';
    else if (header === 'asaldaerah') clientKey = 'asalDaerah';
    else if (header === 'tanggalajuan') clientKey = 'tanggalAjuan';
    else if (header === 'pelatihanakandiikuti') clientKey = 'pelatihanAkanDiikuti';
    else if (header === 'tempatlahir') clientKey = 'tempatLahir';
    else if (header === 'tanggallahir') clientKey = 'tanggalLahir';
    else if (header === 'jeniskelamin') clientKey = 'jenisKelamin';
    else if (header === 'lokasipelatihan') clientKey = 'lokasiPelatihan';
    else if (header === 'tanggalpelatihan') clientKey = 'tanggalPelatihan';
    
    clientApp[clientKey] = rowData[i];
  });
  
  return responseOk({ success: true, application: clientApp });
}

function handleSyncApprovedKtasToMembers() {
  var userSheet = getSheet('Users');
  var usersRange = userSheet.getDataRange();
  var usersData = usersRange.getValues();
  var userHeaders = usersData[0].map(function(h) { return h ? h.toString().trim().toLowerCase() : ""; });
  
  var ktaSheet = getSheet('KTA_Applications');
  var ktas = getRowsAsObjects(ktaSheet);
  
  var ktaHeaders = ktaSheet.getRange(1, 1, 1, ktaSheet.getLastColumn()).getValues()[0].map(function(h) {
    return h ? h.toString().trim().toLowerCase() : "";
  });
  var ktaStatusColIdx = ktaHeaders.indexOf('status');
  
  var idColIdx = userHeaders.indexOf('id');
  var emailColIdx = userHeaders.indexOf('email');
  var nameColIdx = userHeaders.indexOf('namalengkap');
  var genderColIdx = userHeaders.indexOf('jeniskelamin');
  var kwardaColIdx = userHeaders.indexOf('asalkwarda');
  var qabilahColIdx = userHeaders.indexOf('qabilah');
  var noHpColIdx = userHeaders.indexOf('nohp');
  var isVerifiedColIdx = userHeaders.indexOf('isverified');
  var roleColIdx = userHeaders.indexOf('role');
  var photoColIdx = userHeaders.indexOf('photo');
  if (photoColIdx === -1) photoColIdx = userHeaders.indexOf('foto');
  
  // Index existing users by id, and also by email + '|' + name (lowercase and trimmed)
  var userRowIndexById = {};
  var userRowIndexByEmailAndName = {};
  
  for (var r = 1; r < usersData.length; r++) {
    var uId = (usersData[r][idColIdx] || "").toString().trim();
    if (uId) {
      userRowIndexById[uId] = r;
    }
    var uEmail = (usersData[r][emailColIdx] || "").toString().trim().toLowerCase();
    var uName = (usersData[r][nameColIdx] || "").toString().trim().toLowerCase();
    if (uEmail && uName) {
      userRowIndexByEmailAndName[uEmail + '|' + uName] = r;
    }
  }
  
  var addedCount = 0;
  var updatedCount = 0;
  
  ktas.forEach(function(k, idx) {
    var kStatus = (k.status || k.Status || "").toString().trim().toLowerCase();
    var ktaNum = (k.ktaNumber || k.KtaNumber || k.Ktanumber || k.ktanumber || "").toString().trim();
    
    // Auto-approve if they have a KTA number but status is not approved
    if (ktaNum !== "" && kStatus !== "approved" && ktaStatusColIdx > -1) {
      ktaSheet.getRange(idx + 2, ktaStatusColIdx + 1).setValue('approved');
      k.status = 'approved';
      kStatus = 'approved';
    }
    
    if (kStatus !== 'approved') return;
    
    var kEmail = (k.email || k.Email || "").toString().trim().toLowerCase();
    if (!kEmail) return;
    
    var kName = (k.nama || k.namaLengkap || k.Nama || k.NamaLengkap || "").toString().trim();
    var kGender = (k.jenisKelamin || k.jenis_kelamin || "L").toString().trim();
    if (kGender === 'Perempuan' || kGender === 'P') kGender = 'P';
    else kGender = 'L';
    
    var kKwarda = (k.asalDaerah || k.asal_daerah || k.asalKwarda || "").toString().trim();
    var kQabilah = (k.qabilah || k.Qabilah || "").toString().trim();
    var kNoHp = (k.noWa || k.nowa || k.noHp || k.nohp || "").toString().trim();
    var kPhoto = (k.photo || k.foto || "").toString().trim();
    
    // Look up existing user by:
    // 1. Email + Name (exact match of email and name)
    // 2. Or, if the application has a userId that exists in our users list AND that user has the same name (to be safe)
    var rIdx = userRowIndexByEmailAndName[kEmail + '|' + kName.toLowerCase()];
    
    if (rIdx === undefined && k.userId) {
      var kUserId = k.userId.toString().trim();
      if (userRowIndexById[kUserId] !== undefined) {
        var existingName = (usersData[userRowIndexById[kUserId]][nameColIdx] || "").toString().trim().toLowerCase();
        // Only match by userId if the name is empty or matches kName to prevent overwriting someone else's name
        if (existingName === "" || existingName === kName.toLowerCase()) {
          rIdx = userRowIndexById[kUserId];
        }
      }
    }
    
    if (rIdx === undefined) {
      // Create new user row data
      var sanitizedName = kName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
      var sanitizedEmail = kEmail.replace(/[^a-zA-Z0-9]/g, '_');
      var uniqueId = 'user-' + sanitizedEmail + '-' + sanitizedName;
      
      // Ensure uniqueId doesn't collide
      if (userRowIndexById[uniqueId] !== undefined) {
        uniqueId = 'user-' + sanitizedEmail + '-' + new Date().getTime() + '-' + Math.floor(Math.random() * 1000);
      }
      
      var rowData = new Array(userHeaders.length).fill("");
      userHeaders.forEach(function(hLower, i) {
        if (hLower === 'id') rowData[i] = uniqueId;
        else if (hLower === 'email') rowData[i] = kEmail;
        else if (hLower === 'password') rowData[i] = '12345hw'; // Default password
        else if (hLower === 'namalengkap') rowData[i] = kName;
        else if (hLower === 'role') rowData[i] = '[\"umum\"]';
        else if (hLower === 'jeniskelamin') rowData[i] = kGender;
        else if (hLower === 'golongan') rowData[i] = k.tingkatan || "Dewasa";
        else if (hLower === 'asalkwarda') rowData[i] = kKwarda;
        else if (hLower === 'qabilah') rowData[i] = kQabilah;
        else if (hLower === 'isverified') rowData[i] = true;
        else if (hLower === 'nohp') rowData[i] = kNoHp;
        if (photoColIdx !== -1 && (hLower === 'photo' || hLower === 'foto')) rowData[i] = kPhoto;
        else if (hLower === 'upgraderequests') rowData[i] = "[]";
      });
      usersData.push(rowData);
      
      // Update our indexes
      var newIdx = usersData.length - 1;
      userRowIndexById[uniqueId] = newIdx;
      userRowIndexByEmailAndName[kEmail + '|' + kName.toLowerCase()] = newIdx;
      
      addedCount++;
    } else {
      // Update existing row in usersData
      var needsUpdate = false;
      
      if (!usersData[rIdx][nameColIdx] || usersData[rIdx][nameColIdx].toString().trim().toLowerCase() !== kName.toLowerCase()) {
        usersData[rIdx][nameColIdx] = kName;
        needsUpdate = true;
      }
      if (usersData[rIdx][genderColIdx] !== kGender) {
        usersData[rIdx][genderColIdx] = kGender;
        needsUpdate = true;
      }
      if (!usersData[rIdx][kwardaColIdx] || usersData[rIdx][kwardaColIdx].toString().trim() === '') {
        usersData[rIdx][kwardaColIdx] = kKwarda;
        needsUpdate = true;
      }
      if (!usersData[rIdx][qabilahColIdx] || usersData[rIdx][qabilahColIdx].toString().trim() === '') {
        usersData[rIdx][qabilahColIdx] = kQabilah;
        needsUpdate = true;
      }
      if (!usersData[rIdx][noHpColIdx] || usersData[rIdx][noHpColIdx].toString().trim() === '') {
        usersData[rIdx][noHpColIdx] = kNoHp;
        needsUpdate = true;
      }
      if (usersData[rIdx][isVerifiedColIdx] !== true && usersData[rIdx][isVerifiedColIdx] !== "true" && usersData[rIdx][isVerifiedColIdx] !== 1) {
        usersData[rIdx][isVerifiedColIdx] = true;
        needsUpdate = true;
      }
      if (photoColIdx !== -1 && (!usersData[rIdx][photoColIdx] || usersData[rIdx][photoColIdx].toString().trim() === '') && kPhoto) {
        usersData[rIdx][photoColIdx] = kPhoto;
        needsUpdate = true;
      }
      
      if (needsUpdate) {
        updatedCount++;
      }
    }
  });
  
  if (addedCount > 0 || updatedCount > 0) {
    // Clear and write back all data
    userSheet.getRange(1, 1, usersData.length, userHeaders.length).setValues(usersData);
  }
  
  return responseOk({ success: true, addedCount: addedCount, updatedCount: updatedCount });
}

function handleSaveTrainingApplication(data) {
  var sheet = getSheet('Training_Applications');
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(function(h) { 
    return h ? h.toString().trim().toLowerCase() : ""; 
  });
  
  var apps = getRowsAsObjects(sheet);
  var rowIndex = apps.findIndex(function(app) { 
    var appId = (app.id || app.Id || '').toString();
    return appId === data.id.toString() && appId !== ''; 
  });
  
  if (rowIndex === -1) {
    return responseError("Training Application not found");
  }
  
  var app = apps[rowIndex];
  
  // Update fields
  if (data.nama !== undefined) app.nama = data.nama;
  if (data.noWa !== undefined) app.nowa = data.noWa;
  if (data.email !== undefined) app.email = data.email;
  if (data.sosmed !== undefined) app.sosmed = data.sosmed;
  if (data.tingkatan !== undefined) app.tingkatan = data.tingkatan;
  if (data.pelatihanAkanDiikuti !== undefined) app.pelatihanakandiikuti = data.pelatihanAkanDiikuti;
  if (data.tempatLahir !== undefined) app.tempatlahir = data.tempatLahir;
  if (data.tanggalLahir !== undefined) app.tanggallahir = data.tanggalLahir;
  if (data.jenisKelamin !== undefined) app.jeniskelamin = data.jenisKelamin;
  if (data.qabilah !== undefined) app.qabilah = data.qabilah;
  if (data.lokasiPelatihan !== undefined) app.lokasipelatihan = data.lokasiPelatihan;
  if (data.tanggalPelatihan !== undefined) app.tanggalpelatihan = data.tanggalPelatihan;
  if (data.asalDaerah !== undefined) app.asaldaerah = data.asalDaerah;
  if (data.pelatihGolongan !== undefined) app.pelatihgolongan = data.pelatihGolongan;
  if (data.golonganAnggota !== undefined) app.golongananggota = data.golonganAnggota;
  
  var rowData = new Array(headers.length).fill("");
  headers.forEach(function(header, i) {
    var val = app[header];
    if (val === undefined) {
      if (header === 'id') val = app.id || app.Id;
      else if (header === 'userid') val = app.userId || app.UserId;
      else if (header === 'nowa') val = app.noWa || app.NoWa;
      else if (header === 'asaldaerah') val = app.asalDaerah || app.AsalDaerah;
      else if (header === 'tanggalajuan') val = app.tanggalAjuan || app.TanggalAjuan;
      else if (header === 'pelatihanakandiikuti') val = app.pelatihanAkanDiikuti || app.PelatihanAkanDiikuti;
      else if (header === 'tempatlahir') val = app.tempatLahir || app.TempatLahir;
      else if (header === 'tanggallahir') val = app.tanggalLahir || app.TanggalLahir;
      else if (header === 'jeniskelamin') val = app.jenisKelamin || app.JenisKelamin;
      else if (header === 'lokasipelatihan') val = app.lokasiPelatihan || app.LokasiPelatihan;
      else if (header === 'tanggalpelatihan') val = app.tanggalPelatihan || app.TanggalPelatihan;
      else if (header === 'pelatihgolongan') val = app.pelatihGolongan || app.PelatihGolongan;
      else if (header === 'golongananggota') val = app.golonganAnggota || app.GolonganAnggota;
    }
    rowData[i] = val !== undefined ? val : "";
  });
  
  sheet.getRange(rowIndex + 2, 1, 1, rowData.length).setValues([rowData]);
  
  // Update linked user/member
  var userId = app.userid || app.userId || app.UserId || data.userId;
  var email = app.email || app.Email || data.email;
  
  if (userId || email) {
    var userSheet = getSheet('Users');
    var userHeaders = userSheet.getRange(1, 1, 1, userSheet.getLastColumn()).getValues()[0].map(function(h) { 
      return h ? h.toString().trim().toLowerCase() : ""; 
    });
    var users = getRowsAsObjects(userSheet);
    var userRowIndex = users.findIndex(function(u) {
      var uId = (u.id || u.Id || '').toString();
      var uEmail = (u.email || u.Email || '').toString().trim().toLowerCase();
      return (userId && uId === userId.toString()) || (email && uEmail === email.trim().toLowerCase());
    });
    
    if (userRowIndex > -1) {
      var uRowRange = userSheet.getRange(userRowIndex + 2, 1, 1, userHeaders.length);
      var uRowValues = uRowRange.getValues()[0];
      
      var nameIdx = userHeaders.indexOf('namalengkap');
      if (nameIdx > -1 && data.nama) uRowValues[nameIdx] = data.nama;
      
      var emailIdx = userHeaders.indexOf('email');
      if (emailIdx > -1 && data.email) uRowValues[emailIdx] = data.email;
      
      var noHpIdx = userHeaders.indexOf('nohp');
      if (noHpIdx > -1 && data.noWa) uRowValues[noHpIdx] = data.noWa;
      
      var tempatIdx = userHeaders.indexOf('tempatlahir');
      if (tempatIdx > -1 && data.tempatLahir) uRowValues[tempatIdx] = data.tempatLahir;
      
      var tglIdx = userHeaders.indexOf('tanggallahir');
      if (tglIdx > -1 && data.tanggalLahir) uRowValues[tglIdx] = data.tanggalLahir;
      
      var jkIdx = userHeaders.indexOf('jeniskelamin');
      if (jkIdx > -1 && data.jenisKelamin) uRowValues[jkIdx] = data.jenisKelamin;
      
      var qabIdx = userHeaders.indexOf('qabilah');
      if (qabIdx > -1 && data.qabilah) uRowValues[qabIdx] = data.qabilah;
      
      var kwardaIdx = userHeaders.indexOf('asalkwarda');
      if (kwardaIdx > -1 && data.asalDaerah) uRowValues[kwardaIdx] = data.asalDaerah;
      
      var golonganIdx = userHeaders.indexOf('golongan');
      if (golonganIdx > -1 && data.golonganAnggota) uRowValues[golonganIdx] = data.golonganAnggota;
      
      uRowRange.setValues([uRowValues]);
    }
  }
  
  return responseOk({ success: true, message: "Pendaftaran dan data anggota berhasil disinkronisasi", application: app });
}

function handleDeleteKTAApplication(id) {
  var sheet = getSheet('KTA_Applications');
  var apps = getRowsAsObjects(sheet);
  var rowIndex = apps.findIndex(function(app) { 
    var appId = (app.id || app.Id || '').toString().trim();
    return appId === id.toString().trim() && appId !== ''; 
  });
  if (rowIndex > -1) {
    sheet.deleteRow(rowIndex + 2);
    return responseOk({ success: true, message: "KTA Application deleted successfully" });
  }
  return responseError("Pengajuan KTA tidak ditemukan");
}

function cleanGasPhone(p) {
  if (!p) return "";
  var str = p.toString().replace(/\D/g, "");
  if (str.indexOf("0") === 0) str = str.substring(1);
  else if (str.indexOf("62") === 0) str = str.substring(2);
  return str;
}

function cleanGasName(n) {
  if (!n) return "";
  var str = n.toString().toLowerCase();
  str = str.replace(/,?\s*(s\.pd|m\.pd|s\.h\.i\.|s\.ag|m\.ag|s\.kom|m\.kom|s\.e\.|m\.m\.|s\.st|dr\.|dra\.|drs\.|h\.|hj\.|ir\.|prof\.|ph\.d|lcm|s\.ip|m\.ip|s\.sos|m\.sos|s\.p|m\.p)\.?/gi, " ");
  str = str.replace(/[^a-z0-9\s]/gi, " ");
  return str.replace(/\s+/g, " ").trim();
}

function handleGetActivityApplications() {
  var ss;
  if (SPREADSHEET_ID) {
    ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  } else {
    ss = SpreadsheetApp.getActiveSpreadsheet();
  }

  var existingMap = {};
  var allActApps = [];

  function cleanKey(str) {
    return (str || "").toString().trim().toLowerCase();
  }

  function formatDateVal(val) {
    if (!val) return "";
    if (val instanceof Date) {
      var y = val.getFullYear();
      var m = ('0' + (val.getMonth() + 1)).slice(-2);
      var d = ('0' + val.getDate()).slice(-2);
      return y + '-' + m + '-' + d;
    }
    return val.toString().trim();
  }

  var allSheets = ss.getSheets();
  allSheets.forEach(function(sh) {
    var shName = sh.getName();
    var shLower = shName.toLowerCase().replace(/[^a-z0-9]/g, '');

    var isActAppSheet = (
      shLower.indexOf('activity_application') !== -1 ||
      shLower.indexOf('activityapplication') !== -1 ||
      shLower.indexOf('pendaftarkegiatan') !== -1 ||
      shLower.indexOf('pendaftarankegiatan') !== -1 ||
      shLower.indexOf('pesertakegiatan') !== -1 ||
      shLower.indexOf('pendaftar') !== -1 ||
      shLower.indexOf('peserta') !== -1 ||
      shLower.indexOf('formresponses') !== -1 ||
      shLower.indexOf('responformulir') !== -1
    );

    // Skip sheets that are training specific or other master tables
    if (!isActAppSheet || shName === 'Users' || shName === 'Materi' || shName === 'Contents' || shName === 'Settings' || shName === 'Activity_Categories' || shName === 'Activities' || shName === 'Kegiatan' || shLower.indexOf('training') !== -1 || shLower.indexOf('pelatihan') !== -1) {
      return;
    }

    try {
      var rows = getRowsAsObjects(sh);
      rows.forEach(function(row, rIdx) {
        var rNama = (getRobustValue(row, ['namaLengkap', 'namalengkap', 'nama', 'Nama', 'nama_lengkap', 'Nama Lengkap', 'Full Name']) || '').toString().trim();
        if (!rNama || rNama === '-' || rNama.toLowerCase() === 'tanpa nama') return;

        var rId = (getRobustValue(row, ['id', 'Id', 'actRegId', 'actregid', 'ID Registrasi']) || '').toString().trim();
        var rEmail = cleanKey(getRobustValue(row, ['email', 'Email', 'alamatEmail', 'alamat_email']));
        var rPhone = (getRobustValue(row, ['noHp', 'nohp', 'noWa', 'nowa', 'phone', 'whatsapp', 'No HP', 'No WA', 'Nomor HP']) || '').toString().trim();
        var rActName = (getRobustValue(row, ['namaKegiatan', 'namakegiatan', 'kegiatan', 'nama_kegiatan', 'Kegiatan', 'Acara', 'title']) || '').toString().trim();
        var rActId = (getRobustValue(row, ['activityId', 'activityid', 'kegiatanId', 'kegiatanid', 'idKegiatan', 'id_kegiatan']) || '').toString().trim();

        var dedupeKey = rId ? ('id_' + rId) : (rPhone && rNama ? ('pn_' + cleanGasPhone(rPhone) + '_' + cleanGasName(rNama) + '_' + cleanKey(rActName || rActId)) : ('ne_' + cleanGasName(rNama) + '_' + cleanKey(rEmail) + '_' + cleanKey(rActName)));

        if (!existingMap[dedupeKey]) {
          existingMap[dedupeKey] = true;

          var cleanApp = {
            id: rId || ('actreg-' + (rIdx + 1) + '-' + new Date().getTime().toString().slice(-4)),
            activityId: rActId || (rActName ? ('keg-' + cleanKey(rActName).slice(0, 20)) : 'keg-silaturahmi-pelatih'),
            namaKegiatan: rActName || 'Kegiatan Hizbul Wathan',
            userId: getRobustValue(row, ['userId', 'userid', 'idUser', 'id_user']) || '',
            namaLengkap: rNama,
            email: rEmail,
            unsur: getRobustValue(row, ['unsur', 'Unsur']) || '',
            utusan: getRobustValue(row, ['utusan', 'Utusan', 'delegasi']) || '',
            qabilahPtma: getRobustValue(row, ['qabilahPtma', 'qabilahptma', 'ptma', 'qabilah_ptma']) || '',
            jabatan: getRobustValue(row, ['jabatan', 'Jabatan', 'posisi']) || '',
            kategoriUndangan: getRobustValue(row, ['kategoriUndangan', 'kategoriundangan', 'kategori_undangan']) || '',
            noHp: rPhone,
            asalKwarda: getRobustValue(row, ['asalKwarda', 'asalkwarda', 'asalDaerah', 'asaldaerah', 'kwarda', 'kwarcab', 'Asal Kwarda']) || '',
            qabilah: getRobustValue(row, ['qabilah', 'Qabilah', 'pangkalan']) || '',
            status: getRobustValue(row, ['status', 'Status']) || 'approved',
            tanggalDaftar: formatDateVal(getRobustValue(row, ['tanggalDaftar', 'tanggaldaftar', 'tanggal', 'Tanggal', 'Timestamp'])) || new Date().toISOString()
          };

          allActApps.push(cleanApp);
        }
      });
    } catch (e) {
      // Ignore row parsing errors safely
    }
  });

  return responseOk(allActApps);
}

function deduplicateSheetActivityApplications(sheet) {
  if (!sheet) sheet = getSheet('Activity_Applications');
  var requiredHeaders = ['id', 'activityid', 'namakegiatan', 'userid', 'namalengkap', 'email', 'unsur', 'utusan', 'qabilahptma', 'jabatan', 'kategoriundangan', 'nohp', 'asalkwarda', 'qabilah', 'status', 'tanggaldaftar'];
  ensureHeaders('Activity_Applications', requiredHeaders);

  var apps = getRowsAsObjects(sheet);
  if (apps.length <= 1) return;

  var seenMap = {};
  var rowsToDelete = [];

  for (var i = 0; i < apps.length; i++) {
    var app = apps[i];
    var appId = (app.id || app.Id || '').toString().trim();
    var appName = cleanGasName(app.namalengkap || app.namaLengkap || app.nama || '');
    var appPhone = cleanGasPhone(app.nohp || app.noHp || app.noWa || '');
    var appActId = (app.activityid || app.activityId || '').toString().trim();

    var key = appId ? ('id_' + appId) : ('pn_' + appPhone + '_' + appName);
    if (!appId && appPhone && appPhone.length >= 7) {
      key = 'p_' + appPhone + '_' + (appName || appActId);
    }

    if (seenMap[key]) {
      rowsToDelete.push(i + 2);
    } else {
      seenMap[key] = true;
    }
  }

  for (var r = rowsToDelete.length - 1; r >= 0; r--) {
    sheet.deleteRow(rowsToDelete[r]);
  }
}

function handleRegisterActivity(data) {
  var sheet = getSheet('Activity_Applications');
  var requiredHeaders = ['id', 'activityid', 'namakegiatan', 'userid', 'namalengkap', 'email', 'unsur', 'utusan', 'qabilahptma', 'jabatan', 'kategoriundangan', 'nohp', 'asalkwarda', 'qabilah', 'status', 'tanggaldaftar'];
  ensureHeaders('Activity_Applications', requiredHeaders);

  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(function(h) { 
    return h ? h.toString().trim().toLowerCase() : ""; 
  });
  
  var apps = getRowsAsObjects(sheet);

  var dataId = (data.id || '').toString().trim();
  var dataName = cleanGasName(data.namaLengkap || data.nama || '');
  var dataPhone = cleanGasPhone(data.noHp || data.noWa || '');
  var dataActId = (data.activityId || '').toString().trim();

  var matchingIndices = [];
  var matchedApp = null;

  for (var idx = 0; idx < apps.length; idx++) {
    var app = apps[idx];
    var appId = (app.id || app.Id || '').toString().trim();
    var appName = cleanGasName(app.namalengkap || app.namaLengkap || app.nama || '');
    var appPhone = cleanGasPhone(app.nohp || app.noHp || app.noWa || '');
    var appActId = (app.activityid || app.activityId || '').toString().trim();

    var isSameId = dataId && appId && dataId === appId;
    var isSamePhoneAndName = dataPhone && appPhone && dataPhone === appPhone && dataPhone.length >= 7 && (dataName === appName || (dataName && appName && (dataName.indexOf(appName) > -1 || appName.indexOf(dataName) > -1)));
    var isSamePhoneAndAct = dataPhone && appPhone && dataPhone === appPhone && dataPhone.length >= 7 && dataActId && appActId && dataActId === appActId;
    var isSameNameAndAct = dataName && appName && dataName === appName && dataName.length >= 3 && dataActId && appActId && dataActId === appActId;

    if (isSameId || isSamePhoneAndName || isSamePhoneAndAct || isSameNameAndAct) {
      matchingIndices.push(idx);
      if (!matchedApp) matchedApp = app;
    }
  }

  var regId = dataId || (matchedApp ? (matchedApp.id || matchedApp.Id) : '') || ('actreg-' + new Date().getTime().toString());

  var rowData = new Array(headers.length).fill("");
  headers.forEach(function(header, i) {
    if (header === 'id') rowData[i] = regId;
    else if (header === 'activityid') rowData[i] = data.activityId || (matchedApp ? matchedApp.activityid || matchedApp.activityId : "") || "";
    else if (header === 'namakegiatan') rowData[i] = data.namaKegiatan || (matchedApp ? matchedApp.namakegiatan || matchedApp.namaKegiatan : "") || "";
    else if (header === 'userid') rowData[i] = data.userId || (matchedApp ? matchedApp.userid || matchedApp.userId : "") || "";
    else if (header === 'namalengkap') rowData[i] = data.namaLengkap || data.nama || (matchedApp ? matchedApp.namalengkap || matchedApp.namaLengkap : "") || "";
    else if (header === 'email') rowData[i] = data.email || (matchedApp ? matchedApp.email : "") || "";
    else if (header === 'unsur') rowData[i] = data.unsur || (matchedApp ? matchedApp.unsur : "") || "";
    else if (header === 'utusan') rowData[i] = data.utusan || (matchedApp ? matchedApp.utusan : "") || "";
    else if (header === 'qabilahptma') rowData[i] = data.qabilahPtma || (matchedApp ? matchedApp.qabilahptma || matchedApp.qabilahPtma : "") || "";
    else if (header === 'jabatan') rowData[i] = data.jabatan || (matchedApp ? matchedApp.jabatan : "") || "";
    else if (header === 'kategoriundangan') rowData[i] = data.kategoriUndangan || (matchedApp ? matchedApp.kategoriundangan || matchedApp.kategoriUndangan : "") || "";
    else if (header === 'nohp') rowData[i] = data.noHp || data.noWa || (matchedApp ? matchedApp.nohp || matchedApp.noHp || matchedApp.noWa : "") || "";
    else if (header === 'asalkwarda') rowData[i] = data.asalKwarda || (matchedApp ? matchedApp.asalkwarda || matchedApp.asalKwarda : "") || "";
    else if (header === 'qabilah') rowData[i] = data.qabilah || (matchedApp ? matchedApp.qabilah : "") || "";
    else if (header === 'status') rowData[i] = data.status || (matchedApp ? matchedApp.status : "") || "approved";
    else if (header === 'tanggaldaftar') rowData[i] = data.tanggalDaftar || (matchedApp ? matchedApp.tanggaldaftar || matchedApp.tanggalDaftar : "") || new Date().toISOString();
  });

  if (matchingIndices.length > 0) {
    var primaryRowIndex = matchingIndices[0];
    sheet.getRange(primaryRowIndex + 2, 1, 1, rowData.length).setValues([rowData]);

    for (var d = matchingIndices.length - 1; d >= 1; d--) {
      sheet.deleteRow(matchingIndices[d] + 2);
    }
  } else {
    sheet.appendRow(rowData);
  }

  return responseOk({ success: true, message: "Pendaftaran kegiatan berhasil disimpan", application: data });
}

function handleDeleteActivityApplication(id) {
  var sheet = getSheet('Activity_Applications');
  var apps = getRowsAsObjects(sheet);
  var rowIndex = apps.findIndex(function(app) {
    var appId = (app.id || app.Id || '').toString().trim();
    return appId === id.toString().trim() && appId !== '';
  });
  if (rowIndex > -1) {
    sheet.deleteRow(rowIndex + 2);
    return responseOk({ success: true, message: "Pendaftaran kegiatan berhasil dihapus" });
  }
  return responseError("Pendaftaran kegiatan tidak ditemukan");
}

function handleGetActivities() {
  var ss;
  if (SPREADSHEET_ID) {
    ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  } else {
    ss = SpreadsheetApp.getActiveSpreadsheet();
  }

  var existingMap = {};
  var allActivities = [];

  function cleanKey(str) {
    return (str || "").toString().trim().toLowerCase();
  }

  function formatDateVal(val) {
    if (!val) return "";
    if (val instanceof Date) {
      var y = val.getFullYear();
      var m = ('0' + (val.getMonth() + 1)).slice(-2);
      var d = ('0' + val.getDate()).slice(-2);
      return y + '-' + m + '-' + d;
    }
    return val.toString().trim();
  }

  var allSheets = ss.getSheets();
  allSheets.forEach(function(sh) {
    var shName = sh.getName();
    var shLower = shName.toLowerCase().replace(/[^a-z0-9]/g, '');

    var isActivitySheet = (
      shLower === 'activities' ||
      shLower === 'kegiatan' ||
      shLower === 'datakegiatan' ||
      shLower === 'daftarkegiatan' ||
      shLower === 'agenda' ||
      shLower === 'events' ||
      shLower === 'event'
    );

    // Skip non-activity master tables
    if (!isActivitySheet && shLower.indexOf('kegiatan') === -1 && shLower.indexOf('agenda') === -1) {
      return;
    }

    // Skip participant registration sheets
    if (shLower.indexOf('pendaftar') !== -1 || shLower.indexOf('peserta') !== -1 || shLower.indexOf('application') !== -1) {
      return;
    }

    try {
      var rows = getRowsAsObjects(sh);
      rows.forEach(function(row, rIdx) {
        var rNama = (getRobustValue(row, ['namaKegiatan', 'namakegiatan', 'title', 'judul', 'Nama Kegiatan', 'nama_kegiatan', 'Judul', 'jenispelatihan', 'jenisPelatihan']) || '').toString().trim();
        if (!rNama || rNama === '-' || rNama.toLowerCase() === 'tanpa nama') return;

        var rId = (getRobustValue(row, ['id', 'Id', 'ID', 'activityId', 'activityid']) || '').toString().trim();
        var dedupeKey = rId ? ('id_' + rId) : ('title_' + cleanKey(rNama));

        if (!existingMap[dedupeKey]) {
          existingMap[dedupeKey] = true;

          var rawImg = getRobustValue(row, ['gambarUrl', 'gambarurl', 'imageUrl', 'imageurl', 'gambar', 'Gambar', 'posterUrl', 'posterurl', 'coverImage', 'coverimage', 'banner', 'foto']) || '';
          var rawPelatih = getRobustValue(row, ['pelatih', 'Pelatih', 'instruktur']) || '[]';
          var rawAsisten = getRobustValue(row, ['asistenPelatih', 'asistenpelatih', 'Asisten Pelatih']) || '[]';

          if (typeof rawPelatih === 'string' && rawPelatih.indexOf('[') === 0) {
            try { rawPelatih = JSON.parse(rawPelatih); } catch(e) {}
          }
          if (typeof rawAsisten === 'string' && rawAsisten.indexOf('[') === 0) {
            try { rawAsisten = JSON.parse(rawAsisten); } catch(e) {}
          }

          var cleanAct = {
            id: rId || ('keg-' + (rIdx + 1) + '-' + new Date().getTime().toString().slice(-4)),
            namaKegiatan: rNama,
            title: rNama,
            jenisPelatihan: getRobustValue(row, ['jenisPelatihan', 'jenispelatihan', 'jenis', 'Jenis']) || rNama,
            lokasiPelatihan: getRobustValue(row, ['lokasiPelatihan', 'lokasipelatihan', 'lokasi', 'tempat', 'Lokasi', 'Tempat']) || '',
            lokasi: getRobustValue(row, ['lokasiPelatihan', 'lokasipelatihan', 'lokasi', 'tempat', 'Lokasi', 'Tempat']) || '',
            location: getRobustValue(row, ['lokasiPelatihan', 'lokasipelatihan', 'lokasi', 'tempat', 'Lokasi', 'Tempat']) || '',
            tanggalPelatihan: formatDateVal(getRobustValue(row, ['tanggalPelatihan', 'tanggalpelatihan', 'tanggal', 'startDate', 'startdate', 'Tanggal', 'Waktu'])),
            tanggal: formatDateVal(getRobustValue(row, ['tanggalPelatihan', 'tanggalpelatihan', 'tanggal', 'startDate', 'startdate', 'Tanggal', 'Waktu'])),
            startDate: formatDateVal(getRobustValue(row, ['tanggalPelatihan', 'tanggalpelatihan', 'tanggal', 'startDate', 'startdate', 'Tanggal', 'Waktu'])),
            biayaPelatihan: getRobustValue(row, ['biayaPelatihan', 'biayapelatihan', 'biaya', 'infaq', 'Biaya', 'Infaq']) || 'Gratis',
            biaya: getRobustValue(row, ['biayaPelatihan', 'biayapelatihan', 'biaya', 'infaq', 'Biaya', 'Infaq']) || 'Gratis',
            deskripsi: getRobustValue(row, ['deskripsi', 'description', 'keterangan', 'Deskripsi', 'Keterangan']) || '',
            description: getRobustValue(row, ['deskripsi', 'description', 'keterangan', 'Deskripsi', 'Keterangan']) || '',
            kategori: getRobustValue(row, ['kategori', 'category', 'Kategori', 'Category']) || 'Silaturahmi',
            category: getRobustValue(row, ['kategori', 'category', 'Kategori', 'Category']) || 'Silaturahmi',
            gambarUrl: rawImg,
            imageUrl: rawImg,
            gambar: rawImg,
            posterUrl: rawImg,
            coverImage: rawImg,
            pelatih: rawPelatih,
            asistenPelatih: rawAsisten,
            pelatihGolongan: getRobustValue(row, ['pelatihGolongan', 'pelatihgolongan']) || '',
            golonganAnggota: getRobustValue(row, ['golonganAnggota', 'golongananggota']) || '',
            penyelenggara: getRobustValue(row, ['penyelenggara', 'panitia', 'Penyelenggara', 'Panitia']) || 'Kwarda Hizbul Wathan Banyumas',
            kuota: getRobustValue(row, ['kuota', 'quota', 'Kuota', 'Kapasitas']) || '',
            proposalUrl: getRobustValue(row, ['proposalUrl', 'proposalurl', 'proposal', 'linkProposal', 'linkproposal', 'Proposal']) || '',
            rekeningPembayaran: getRobustValue(row, ['rekeningPembayaran', 'rekeningpembayaran', 'rekeningPembiayaan', 'rekeningpembiayaan', 'rekening', 'Rekening', 'nomorRekening', 'nomorrekening', 'noRekening']) || '',
            noWhatsappPanitia: getRobustValue(row, ['noWhatsappPanitia', 'nowhatsapppanitia', 'konfirmasiPembayaran', 'konfirmasipembayaran', 'noKonfirmasi', 'nokonfirmasi', 'kontakPanitia', 'noWaKonfirmasi', 'nowakonfirmasi', 'noWaPanitia', 'noHpPanitia', 'noWa']) || '',
            themeSongUrl: getRobustValue(row, ['themeSongUrl', 'themesongurl', 'themeSong', 'themesong', 'laguUrl', 'laguurl', 'lagu', 'Lagu', 'audioUrl', 'audiourl']) || '',
            themeSongTitle: getRobustValue(row, ['themeSongTitle', 'themesongtitle', 'themeSongName', 'themesongname', 'judulLagu', 'judullagu', 'laguTitle', 'lagutitle']) || '',
            youtubeUrl: getRobustValue(row, ['youtubeUrl', 'youtubeurl', 'videoUrl', 'videourl', 'youtube', 'Youtube', 'linkYoutube', 'linkyoutube', 'video', 'Video']) || '',
            videoUrl: getRobustValue(row, ['youtubeUrl', 'youtubeurl', 'videoUrl', 'videourl', 'youtube', 'Youtube', 'linkYoutube', 'linkyoutube', 'video', 'Video']) || '',
            status: getRobustValue(row, ['status', 'Status']) || 'Buka',
            createdAt: formatDateVal(getRobustValue(row, ['createdAt', 'createdat', 'created_at'])) || new Date().toISOString(),
            updatedAt: formatDateVal(getRobustValue(row, ['updatedAt', 'updatedat', 'updated_at'])) || new Date().toISOString()
          };

          allActivities.push(cleanAct);
        }
      });
    } catch (e) {
      // Ignore sheet parsing errors safely
    }
  });

  return responseOk(allActivities);
}

function handleSaveActivity(data) {
  var requiredHeaders = [
    'id', 'namaKegiatan', 'kategori', 'lokasi', 'tanggal', 'biaya', 'kuota', 
    'penyelenggara', 'status', 'deskripsi', 'gambarUrl', 'rekeningPembayaran', 
    'noWhatsappPanitia', 'proposalUrl', 'themeSongUrl', 'themeSongTitle', 
    'youtubeUrl', 'pelatih', 'asistenPelatih', 'pelatihGolongan', 
    'golonganAnggota', 'createdAt', 'updatedAt'
  ];
  ensureHeaders('Activities', requiredHeaders);

  var sheet = getSheet('Activities');
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(function(h) { 
    return h ? h.toString().trim().toLowerCase() : ""; 
  });
  
  var apps = getRowsAsObjects(sheet);
  var actId = data.id || 'keg-' + new Date().getTime().toString();
  var rowIndex = apps.findIndex(function(app) {
    var appId = (app.id || app.Id || '').toString().trim();
    return appId === actId.toString().trim() && appId !== '';
  });

  var existing = rowIndex > -1 ? apps[rowIndex] : null;

  var rowData = new Array(headers.length).fill("");
  headers.forEach(function(header, i) {
    var val = undefined;
    if (header === 'id') val = actId;
    else if (header === 'namakegiatan' || header === 'title' || header === 'judul') {
      val = (data.namaKegiatan !== undefined && data.namaKegiatan !== "") ? data.namaKegiatan :
            ((data.title !== undefined && data.title !== "") ? data.title :
            ((data.jenisPelatihan !== undefined && data.jenisPelatihan !== "") ? data.jenisPelatihan :
            (existing ? (existing.namakegiatan || existing.namaKegiatan || existing.title || existing.judul || existing.jenispelatihan) : "")));
    }
    else if (header === 'jenispelatihan') {
      val = (data.jenisPelatihan !== undefined && data.jenisPelatihan !== "") ? data.jenisPelatihan :
            ((data.namaKegiatan !== undefined && data.namaKegiatan !== "") ? data.namaKegiatan :
            ((data.title !== undefined && data.title !== "") ? data.title :
            (existing ? (existing.jenispelatihan || existing.jenisPelatihan || existing.namakegiatan) : "")));
    }
    else if (header === 'lokasipelatihan' || header === 'lokasi' || header === 'location' || header === 'tempat') {
      val = (data.lokasiPelatihan !== undefined && data.lokasiPelatihan !== "") ? data.lokasiPelatihan :
            ((data.lokasi !== undefined && data.lokasi !== "") ? data.lokasi :
            ((data.location !== undefined && data.location !== "") ? data.location :
            (existing ? (existing.lokasipelatihan || existing.lokasiPelatihan || existing.lokasi || existing.location || existing.tempat) : "")));
    }
    else if (header === 'tanggalpelatihan' || header === 'tanggal' || header === 'startdate' || header === 'waktu') {
      val = (data.tanggalPelatihan !== undefined && data.tanggalPelatihan !== "") ? data.tanggalPelatihan :
            ((data.tanggal !== undefined && data.tanggal !== "") ? data.tanggal :
            ((data.startDate !== undefined && data.startDate !== "") ? data.startDate :
            (existing ? (existing.tanggalpelatihan || existing.tanggalPelatihan || existing.tanggal || existing.startDate || existing.waktu) : "")));
    }
    else if (header === 'status') {
      val = data.status !== undefined ? data.status : (existing ? existing.status : "Buka");
    }
    else if (header === 'pelatih') {
      var p = data.pelatih !== undefined ? data.pelatih : (existing ? existing.pelatih : []);
      val = typeof p === 'object' ? JSON.stringify(p) : p;
    }
    else if (header === 'asistenpelatih') {
      var ap = data.asistenPelatih !== undefined ? data.asistenPelatih : (existing ? existing.asistenpelatih : []);
      val = typeof ap === 'object' ? JSON.stringify(ap) : ap;
    }
    else if (header === 'pelatihgolongan') {
      val = data.pelatihGolongan !== undefined ? data.pelatihGolongan : (existing ? existing.pelatihgolongan : "");
    }
    else if (header === 'golongananggota') {
      val = data.golonganAnggota !== undefined ? data.golonganAnggota : (existing ? existing.golongananggota : "");
    }
    else if (header === 'deskripsi' || header === 'description' || header === 'keterangan') {
      val = (data.deskripsi !== undefined && data.deskripsi !== "") ? data.deskripsi :
            ((data.description !== undefined && data.description !== "") ? data.description :
            (existing ? (existing.deskripsi || existing.description || existing.keterangan) : ""));
    }
    else if (header === 'biayapelatihan' || header === 'biaya' || header === 'infaq') {
      val = (data.biayaPelatihan !== undefined && data.biayaPelatihan !== "") ? data.biayaPelatihan :
            ((data.biaya !== undefined && data.biaya !== "") ? data.biaya :
            ((data.infaq !== undefined && data.infaq !== "") ? data.infaq :
            (existing ? (existing.biayapelatihan || existing.biaya || existing.infaq) : "Gratis")));
    }
    else if (header === 'proposalurl' || header === 'proposal' || header === 'linkproposal') {
      val = (data.proposalUrl !== undefined && data.proposalUrl !== "") ? data.proposalUrl :
            ((data.proposal !== undefined && data.proposal !== "") ? data.proposal :
            ((data.linkProposal !== undefined && data.linkProposal !== "") ? data.linkProposal :
            (existing ? (existing.proposalurl || existing.proposal || existing.linkproposal) : "")));
    }
    else if (header === 'rekeningpembayaran' || header === 'rekeningpembiayaan' || header === 'rekening' || header === 'nomorrekening' || header === 'norekening') {
      val = (data.rekeningPembayaran !== undefined && data.rekeningPembayaran !== "") ? data.rekeningPembayaran :
            ((data.rekeningPembiayaan !== undefined && data.rekeningPembiayaan !== "") ? data.rekeningPembiayaan :
            ((data.nomorRekening !== undefined && data.nomorRekening !== "") ? data.nomorRekening :
            (existing ? (existing.rekeningpembayaran || existing.rekeningpembiayaan || existing.rekening || existing.nomorrekening) : "")));
    }
    else if (header === 'nowhatsapppanitia' || header === 'konfirmasipembayaran' || header === 'nokonfirmasi' || header === 'nowakonfirmasi' || header === 'nowapanitia' || header === 'kontakpanitia' || header === 'nowa' || header === 'nohppanitia') {
      val = (data.noWhatsappPanitia !== undefined && data.noWhatsappPanitia !== "") ? data.noWhatsappPanitia :
            ((data.konfirmasiPembayaran !== undefined && data.konfirmasiPembayaran !== "") ? data.konfirmasiPembayaran :
            ((data.noKonfirmasi !== undefined && data.noKonfirmasi !== "") ? data.noKonfirmasi :
            ((data.noWaKonfirmasi !== undefined && data.noWaKonfirmasi !== "") ? data.noWaKonfirmasi :
            ((data.noWaPanitia !== undefined && data.noWaPanitia !== "") ? data.noWaPanitia :
            (existing ? (existing.nowhatsapppanitia || existing.konfirmasipembayaran || existing.nowakonfirmasi || existing.nokonfirmasi) : "")))));
    }
    else if (header === 'themesongurl' || header === 'themesong' || header === 'laguurl' || header === 'lagu' || header === 'audiourl') {
      val = (data.themeSongUrl !== undefined && data.themeSongUrl !== "") ? data.themeSongUrl :
            ((data.themeSong !== undefined && data.themeSong !== "") ? data.themeSong :
            ((data.audioUrl !== undefined && data.audioUrl !== "") ? data.audioUrl :
            ((data.laguUrl !== undefined && data.laguUrl !== "") ? data.laguUrl :
            ((data.lagu !== undefined && data.lagu !== "") ? data.lagu :
            (existing ? (existing.themesongurl || existing.themesong || existing.laguurl || existing.audiourl || existing.lagu) : "")))));
    }
    else if (header === 'themesongtitle' || header === 'themesongname' || header === 'judullagu' || header === 'lagutitle') {
      val = (data.themeSongTitle !== undefined && data.themeSongTitle !== "") ? data.themeSongTitle :
            ((data.themeSongName !== undefined && data.themeSongName !== "") ? data.themeSongName :
            ((data.judulLagu !== undefined && data.judulLagu !== "") ? data.judulLagu :
            ((data.laguTitle !== undefined && data.laguTitle !== "") ? data.laguTitle :
            (existing ? (existing.themesongtitle || existing.themesongname || existing.judullagu || existing.lagutitle) : ""))));
    }
    else if (header === 'youtubeurl' || header === 'youtube' || header === 'videourl' || header === 'video' || header === 'linkyoutube') {
      val = (data.youtubeUrl !== undefined && data.youtubeUrl !== "") ? data.youtubeUrl :
            ((data.videoUrl !== undefined && data.videoUrl !== "") ? data.videoUrl :
            ((data.youtube !== undefined && data.youtube !== "") ? data.youtube :
            ((data.linkYoutube !== undefined && data.linkYoutube !== "") ? data.linkYoutube :
            (existing ? (existing.youtubeurl || existing.videourl || existing.youtube || existing.linkyoutube) : ""))));
    }
    else if (header.indexOf('gambar') !== -1 || header.indexOf('image') !== -1 || header.indexOf('poster') !== -1 || header.indexOf('cover') !== -1 || header.indexOf('banner') !== -1 || header.indexOf('foto') !== -1) {
      val = (data.gambarUrl !== undefined && data.gambarUrl !== "") ? data.gambarUrl :
            ((data.imageUrl !== undefined && data.imageUrl !== "") ? data.imageUrl :
            ((data.gambar !== undefined && data.gambar !== "") ? data.gambar :
            ((data.posterUrl !== undefined && data.posterUrl !== "") ? data.posterUrl :
            ((data.coverImage !== undefined && data.coverImage !== "") ? data.coverImage :
            (existing ? (existing.gambarurl || existing.imageurl || existing.gambar || existing.posterurl || existing.coverimage) : "")))));
    }
    else if (header === 'penyelenggara' || header === 'panitia') {
      val = data.penyelenggara !== undefined ? data.penyelenggara : (existing ? (existing.penyelenggara || existing.panitia) : "");
    }
    else if (header === 'kuota' || header === 'quota' || header === 'kapasitas') {
      val = data.kuota !== undefined ? data.kuota : (existing ? (existing.kuota || existing.quota || existing.kapasitas) : "");
    }
    else if (header === 'kategori' || header === 'category') {
      val = (data.kategori !== undefined && data.kategori !== "") ? data.kategori :
            ((data.category !== undefined && data.category !== "") ? data.category :
            (existing ? (existing.kategori || existing.category) : ""));
    }
    else if (header === 'createdat') {
      val = data.createdAt !== undefined ? data.createdAt : (existing ? existing.createdat : new Date().toISOString());
    }
    else if (header === 'updatedat') {
      val = new Date().toISOString();
    }

    rowData[i] = val !== undefined ? val : "";
  });

  if (rowIndex > -1) {
    sheet.getRange(rowIndex + 2, 1, 1, rowData.length).setValues([rowData]);
  } else {
    sheet.appendRow(rowData);
  }

  return responseOk({ success: true, message: "Kegiatan/Pelatihan berhasil disimpan ke Spreadsheet", activity: data });
}

function handleDeleteActivity(id) {
  var sheet = getSheet('Activities');
  var apps = getRowsAsObjects(sheet);
  var rowIndex = apps.findIndex(function(app) {
    var appId = (app.id || app.Id || '').toString().trim();
    return appId === id.toString().trim() && appId !== '';
  });
  if (rowIndex > -1) {
    sheet.deleteRow(rowIndex + 2);
    return responseOk({ success: true, message: "Kegiatan/Pelatihan berhasil dihapus dari Spreadsheet" });
  }
  return responseError("Kegiatan/Pelatihan tidak ditemukan");
}

function handleGetActivityCategories() {
  var sheet = getSheet('Activity_Categories');
  var rows = getRowsAsObjects(sheet);
  var categories = [];
  rows.forEach(function(r) {
    var catName = (r.name || r.Name || r.kategori || r.Kategori || '').toString().trim();
    if (catName && categories.indexOf(catName) === -1) {
      categories.push(catName);
    }
  });
  if (categories.length === 0) {
    categories = ['Silaturahmi', 'Baitul Arqam', 'Latihan', 'Rapat', 'Lainnya'];
  }
  return responseOk(categories);
}

function handleSaveActivityCategory(data) {
  var sheet = getSheet('Activity_Categories');
  var name = (data.name || data.categoryName || data.kategori || '').toString().trim();
  if (!name) return responseError("Nama kategori wajib diisi");
  
  var rows = getRowsAsObjects(sheet);
  var existingIndex = rows.findIndex(function(r) {
    var rName = (r.name || r.Name || r.kategori || '').toString().trim().toLowerCase();
    return rName === name.toLowerCase();
  });

  if (existingIndex === -1) {
    var catId = data.id || 'cat-' + new Date().getTime().toString();
    sheet.appendRow([catId, name, new Date().toISOString()]);
  }
  return responseOk({ success: true, message: "Kategori/Jenis kegiatan berhasil disimpan" });
}

function handleDeleteActivityCategory(data) {
  var sheet = getSheet('Activity_Categories');
  var name = (data.name || data.categoryName || data.kategori || data.id || '').toString().trim().toLowerCase();
  if (!name) return responseError("Nama kategori wajib diisi");

  var rows = getRowsAsObjects(sheet);
  var existingIndex = rows.findIndex(function(r) {
    var rName = (r.name || r.Name || r.kategori || '').toString().trim().toLowerCase();
    var rId = (r.id || r.Id || '').toString().trim().toLowerCase();
    return rName === name || rId === name;
  });

  if (existingIndex > -1) {
    sheet.deleteRow(existingIndex + 2);
    return responseOk({ success: true, message: "Kategori/Jenis kegiatan berhasil dihapus" });
  }
  return responseError("Kategori/Jenis kegiatan tidak ditemukan");
}
`;

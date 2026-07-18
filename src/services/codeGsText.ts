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

    if (action == 'saveSettings') {
      return handleSaveSettings(data.settings);
    }

    if (action == 'syncDatabase') {
      return handleSyncDatabase();
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

    if (action == 'saveKTAApplication') {
      return handleSaveKTAApplication(data);
    }

    if (action == 'applyTraining') {
      return handleApplyTraining(data);
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
  
  // Jika belum ada, buat baru dengan header default
  if (!sheet) {
    sheet = ss.insertSheet(name);
    if (name == 'Users') {
      sheet.appendRow(['id', 'email', 'password', 'namaLengkap', 'role', 'pendidikan', 'pelatihan', 'jenisKelamin', 'golongan', 'asalKwarda', 'qabilah', 'alamat', 'isVerified', 'sosmed', 'noHp', 'token', 'upgradeRequests']);
      // Tambahkan admin default agar bisa login pertama kali
      // Password: admin123
      sheet.appendRow(['admin-1', 'admin@admin.com', 'admin123', 'Super Admin', 'superadmin', 'S1', '[]', 'L', 'Dewasa', 'Nasional', 'Pusat', 'Jakarta', true, '@admin', '08123456789', '', '[]']);
    } else if (name == 'Materi') {
      sheet.appendRow(['id', 'judul', 'konten', 'kategori', 'tanggal', 'coverImage', 'driveUrl']);
    } else if (name == 'Contents') {
      sheet.appendRow(['id', 'section', 'type', 'field1', 'field2', 'field3', 'field4']);
    } else if (name == 'KTA_Applications') {
      sheet.appendRow(['id', 'userId', 'nama', 'noWa', 'email', 'sosmed', 'photo', 'tingkatan', 'asalDaerah', 'status', 'tanggalAjuan', 'ktaNumber', 'remark', 'nik', 'tempatLahir', 'tanggalLahir', 'jenisKelamin', 'qabilah', 'jenisKta']);
    } else if (name == 'Training_Applications') {
      sheet.appendRow(['id', 'userId', 'nama', 'noWa', 'email', 'sosmed', 'photo', 'tingkatan', 'asalDaerah', 'status', 'tanggalAjuan', 'pelatihanAkanDiikuti', 'nik', 'tempatLahir', 'tanggalLahir', 'jenisKelamin', 'qabilah', 'kehadiran', 'tugas', 'nilai', 'remark', 'statusKelulusan', 'lokasiPelatihan', 'tanggalPelatihan']);
    } else if (name == 'Settings') {
      sheet.appendRow(['key', 'value']);
      sheet.appendRow(['appName', 'Aplikasi HW Banyumas']);
      sheet.appendRow(['orgName', 'Kwarda Hizbul Wathan Banyumas']);
      sheet.appendRow(['lastBackup', '-']);
    }
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
  ensureHeaders('Users', ['id', 'email', 'password', 'namaLengkap', 'role', 'pendidikan', 'pelatihan', 'jenisKelamin', 'golongan', 'asalKwarda', 'qabilah', 'alamat', 'isVerified', 'sosmed', 'noHp', 'token', 'upgradeRequests']);
  ensureHeaders('Materi', ['id', 'judul', 'konten', 'kategori', 'tanggal', 'coverImage', 'driveUrl']);
  ensureHeaders('Contents', ['id', 'section', 'type', 'field1', 'field2', 'field3', 'field4']);
  ensureHeaders('KTA_Applications', ['id', 'userId', 'nama', 'noWa', 'email', 'sosmed', 'photo', 'tingkatan', 'asalDaerah', 'status', 'tanggalAjuan', 'ktaNumber', 'remark', 'nik', 'tempatLahir', 'tanggalLahir', 'jenisKelamin', 'qabilah', 'jenisKta', 'alamat']);
  ensureHeaders('Training_Applications', ['id', 'userId', 'nama', 'noWa', 'email', 'sosmed', 'photo', 'tingkatan', 'asalDaerah', 'status', 'tanggalAjuan', 'pelatihanAkanDiikuti', 'nik', 'tempatLahir', 'tanggalLahir', 'jenisKelamin', 'qabilah', 'kehadiran', 'tugas', 'nilai', 'remark', 'statusKelulusan', 'lokasiPelatihan', 'tanggalPelatihan']);
  ensureHeaders('Settings', ['key', 'value']);
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
  
  var user = users.find(function(u) { 
    var uEmail = u.email ? u.email.toString().trim().toLowerCase() : "";
    // Handle both lowercase and camelCase for robust mapping
    if (!uEmail) uEmail = u.Email ? u.Email.toString().trim().toLowerCase() : "";
    
    var uPass = u.password ? u.password.toString().trim() : (u.Password ? u.Password.toString().trim() : "");
    var inputPass = password ? password.toString().trim() : "";
    return uEmail === trimmedEmail && uPass === inputPass; 
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
  var id = new Date().getTime().toString();
  
  // Ensure headers exist
  handleSyncDatabase();
  
  var row = [
    id,
    data.email,
    data.password || '123456',
    data.namaLengkap,
    'umum',
    data.pendidikan,
    JSON.stringify(data.pelatihan || []),
    data.jenisKelamin,
    data.golongan,
    data.asalKwarda,
    data.qabilah,
    data.alamat,
    false,
    data.sosmed,
    data.noHp,
    '',
    '[]'
  ];
  
  sheet.appendRow(row);
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
  var userSheet = getSheet('Users');
  var users = getRowsAsObjects(userSheet);
  
  // Auto-sync missing members from Training_Applications and KTA_Applications
  var trainSheet = getSheet('Training_Applications');
  var trains = getRowsAsObjects(trainSheet);
  
  var ktaSheet = getSheet('KTA_Applications');
  var ktas = getRowsAsObjects(ktaSheet);
  
  var existingEmails = {};
  users.forEach(function(u) {
    var email = (u.email || u.Email || "").toString().trim().toLowerCase();
    if (email) existingEmails[email] = true;
  });
  
  var addedAny = false;
  
  function addMissing(email, nama, noWa, sosmed, golongan, tingkatan, asalDaerah, qabilah, jenisKelamin) {
    var cleanEmail = (email || "").toString().trim().toLowerCase();
    if (!cleanEmail || existingEmails[cleanEmail]) return;
    
    var id = 'user-' + cleanEmail.replace(/[^a-zA-Z0-9]/g, '_');
    var headers = userSheet.getRange(1, 1, 1, userSheet.getLastColumn()).getValues()[0];
    var headerLowers = headers.map(function(h) { return h ? h.toString().trim().toLowerCase() : ""; });
    
    var rowData = new Array(headers.length).fill("");
    headerLowers.forEach(function(hLower, i) {
      if (hLower === 'id') rowData[i] = id;
      else if (hLower === 'email') rowData[i] = cleanEmail;
      else if (hLower === 'password') rowData[i] = '12345hw'; // Default password
      else if (hLower === 'namalengkap') rowData[i] = nama || "";
      else if (hLower === 'role') rowData[i] = '[\"umum\"]';
      else if (hLower === 'pendidikan') rowData[i] = "";
      else if (hLower === 'pelatihan') rowData[i] = JSON.stringify(tingkatan ? [tingkatan] : []);
      else if (hLower === 'jeniskelamin') rowData[i] = jenisKelamin || "L";
      else if (hLower === 'golongan') rowData[i] = golongan || "Dewasa";
      else if (hLower === 'asalkwarda') rowData[i] = asalDaerah || "Banyumas";
      else if (hLower === 'qabilah') rowData[i] = qabilah || "";
      else if (hLower === 'alamat') rowData[i] = "";
      else if (hLower === 'isverified') rowData[i] = true; // Auto-verified
      else if (hLower === 'sosmed') rowData[i] = sosmed || "";
      else if (hLower === 'nohp') rowData[i] = noWa || "";
      else if (hLower === 'token') rowData[i] = "";
      else if (hLower === 'upgraderequests') rowData[i] = "[]";
    });
    
    userSheet.appendRow(rowData);
    existingEmails[cleanEmail] = true;
    addedAny = true;
  }
  
  trains.forEach(function(t) {
    var email = t.email || t.Email || t.emailAddress || t.EmailAddress;
    var nama = t.namaLengkap || t.nama || t.NamaLengkap || t.Nama || t.nama_lengkap;
    var noWa = t.noHp || t.nohp || t.noWa || t.nowa || t.NoWa || t.noWhatsApp || t.NoWhatsApp;
    var sosmed = t.sosmed || t.Sosmed || t.instagram || t.Instagram;
    var tingkatan = t.pelatihanAkanDiikuti || t.pelatihanakandiikuti || t.pelatihan || t.tingkatan;
    var asalDaerah = t.asalKwarda || t.asalkwarda || t.asalDaerah || t.asaldaerah || t.AsalDaerah || t.asalCabang || t.AsalCabang;
    var qabilah = t.qabilah || t.Qabilah;
    var jenisKelamin = t.jenisKelamin || t.jeniskelamin || t.JenisKelamin || t.gender || t.Gender || "L";
    
    if (email && nama) {
      addMissing(email, nama, noWa, sosmed, "Dewasa", tingkatan, asalDaerah, qabilah, jenisKelamin);
    }
  });
  
  ktas.forEach(function(k) {
    var email = k.email || k.Email || k.emailAddress || k.EmailAddress;
    var nama = k.namaLengkap || k.nama || k.NamaLengkap || k.Nama || k.nama_lengkap;
    var noWa = k.noHp || k.nohp || k.noWa || k.nowa || k.NoWa;
    var sosmed = k.sosmed || k.Sosmed;
    var tingkatan = k.pelatihan || k.tingkatan;
    var asalDaerah = k.asalKwarda || k.asalkwarda || k.asalDaerah || k.asaldaerah || k.AsalDaerah;
    var qabilah = k.qabilah || k.Qabilah;
    var jenisKelamin = k.jenisKelamin || k.jeniskelamin || k.JenisKelamin || "L";
    
    if (email && nama) {
      addMissing(email, nama, noWa, sosmed, "Dewasa", tingkatan, asalDaerah, qabilah, jenisKelamin);
    }
  });
  
  if (addedAny) {
    users = getRowsAsObjects(userSheet);
  }
  
  return responseOk(users.map(function(m) { 
    delete m.password; 
    return m; 
  }));
}

function handleSaveMember(data) {
  var sheet = getSheet('Users');
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var headerLowers = headers.map(function(h) { return h ? h.toString().trim().toLowerCase() : ""; });
  
  var users = getRowsAsObjects(sheet);
  var dataId = (getRobustValue(data, ['id', 'Id']) || '').toString().trim();
  var dataEmail = (getRobustValue(data, ['email', 'Email']) || '').toString().trim().toLowerCase();
  
  var rowIndex = users.findIndex(function(u) { 
    var uId = (u.id || u.Id || '').toString().trim();
    var uEmail = (u.email || u.Email || '').toString().trim().toLowerCase();
    
    if (dataId !== '' && uId !== '') {
      if (uId === dataId) return true;
    }
    if (uEmail !== '') {
      var stableId = 'user-' + uEmail.replace(/[^a-zA-Z0-9]/g, '_');
      if (stableId === dataId) return true;
    }
    if (dataEmail !== '' && uEmail === dataEmail) {
      return true;
    }
    return false;
  });
  
  var existing = rowIndex > -1 ? users[rowIndex] : null;
  
  var rowData = new Array(headers.length).fill("");
  headerLowers.forEach(function(hLower, i) {
    if (hLower === 'id') {
      rowData[i] = getRobustValue(data, ['id', 'Id']) || (existing ? (existing.id || existing.Id) : (dataEmail ? 'user-' + dataEmail.replace(/[^a-zA-Z0-9]/g, '_') : new Date().getTime().toString()));
    }
    else if (hLower === 'email') {
      rowData[i] = getRobustValue(data, ['email', 'Email']) || (existing ? (existing.email || existing.Email) : "");
    }
    else if (hLower === 'password') {
      rowData[i] = getRobustValue(data, ['password', 'Password']) || (existing ? (existing.password || existing.Password) : '123456');
    }
    else if (hLower === 'namalengkap') {
      rowData[i] = getRobustValue(data, ['namaLengkap', 'namalengkap', 'nama', 'nama_lengkap', 'nama lengkap']) || (existing ? (existing.namaLengkap || existing.namalengkap || existing.nama || existing.nama_lengkap) : "");
    }
    else if (hLower === 'role') {
      rowData[i] = getRobustValue(data, ['role', 'Role', 'roles', 'Roles']) || (existing ? (existing.role || existing.Role || existing.roles) : "[\"umum\"]");
    }
    else if (hLower === 'pendidikan') {
      rowData[i] = getRobustValue(data, ['pendidikan', 'Pendidikan']) || (existing ? (existing.pendidikan || existing.Pendidikan) : "");
    }
    else if (hLower === 'pelatihan') {
      var p = getRobustValue(data, ['pelatihan', 'Pelatihan']) || (existing ? (existing.pelatihan || existing.Pelatihan) : []);
      rowData[i] = typeof p === 'string' ? p : JSON.stringify(p);
    }
    else if (hLower === 'jeniskelamin') {
      rowData[i] = getRobustValue(data, ['jenisKelamin', 'jeniskelamin', 'jk', 'sex', 'gender']) || (existing ? (existing.jenisKelamin || existing.jeniskelamin || existing.jk) : "L");
    }
    else if (hLower === 'golongan') {
      rowData[i] = getRobustValue(data, ['golongan', 'Golongan']) || (existing ? (existing.golongan || existing.Golongan) : "");
    }
    else if (hLower === 'asalkwarda') {
      rowData[i] = getRobustValue(data, ['asalKwarda', 'asalkwarda', 'kwarda', 'asalDaerah', 'asaldaerah']) || (existing ? (existing.asalKwarda || existing.asalkwarda || existing.kwarda) : "");
    }
    else if (hLower === 'qabilah') {
      rowData[i] = getRobustValue(data, ['qabilah', 'Qabilah']) || (existing ? (existing.qabilah || existing.Qabilah) : "");
    }
    else if (hLower === 'alamat') {
      rowData[i] = getRobustValue(data, ['alamat', 'Alamat']) || (existing ? (existing.alamat || existing.Alamat) : "");
    }
    else if (hLower === 'isverified') {
      var iv = getRobustValue(data, ['isVerified', 'isverified', 'verified']) !== "" ? getRobustValue(data, ['isVerified', 'isverified', 'verified']) : (existing ? (existing.isVerified !== undefined ? existing.isVerified : existing.isverified) : false);
      rowData[i] = isTruthy(iv);
    }
    else if (hLower === 'sosmed') {
      rowData[i] = getRobustValue(data, ['sosmed', 'Sosmed', 'socialmedia', 'sosialmedia', 'instagram']) || (existing ? (existing.sosmed || existing.Sosmed) : "");
    }
    else if (hLower === 'nohp') {
      rowData[i] = getRobustValue(data, ['noHp', 'nohp', 'phone', 'telepon', 'no_hp', 'nohp', 'nowa', 'noWa']) || (existing ? (existing.noHp || existing.nohp || existing.phone || existing.no_hp) : "");
    }
    else if (hLower === 'token') {
      rowData[i] = existing ? (existing.token || existing.Token) : "";
    }
    else if (hLower === 'upgraderequests') {
      var ur = getRobustValue(data, ['upgradeRequests', 'upgraderequests']) || (existing ? (existing.upgradeRequests || existing.upgraderequests) : []);
      rowData[i] = typeof ur === 'string' ? ur : JSON.stringify(ur);
    }
  });

  if (rowIndex > -1) {
    sheet.getRange(rowIndex + 2, 1, 1, rowData.length).setValues([rowData]);
  } else {
    sheet.appendRow(rowData);
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
  var contents = getRowsAsObjects(sheet);
  if (section) {
    contents = contents.filter(function(c) { return c.section === section; });
  }
  return responseOk(contents);
}

function handleSaveContent(data) {
  var sheet = getSheet('Contents');
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(function(h) { 
    return h ? h.toString().trim().toLowerCase() : ""; 
  });
  
  var contents = getRowsAsObjects(sheet);
  var rowIndex = contents.findIndex(function(c) { 
    return c.id && c.id.toString() === (data.id ? data.id.toString() : ''); 
  });
  
  var rowData = new Array(headers.length).fill("");
  headers.forEach(function(header, i) {
    if (header === 'id') rowData[i] = data.id || new Date().getTime().toString();
    else if (header === 'section') rowData[i] = data.section || "";
    else if (header === 'type') rowData[i] = data.type || "";
    else if (header === 'field1') rowData[i] = data.field1 || "";
    else if (header === 'field2') rowData[i] = data.field2 || "";
    else if (header === 'field3') rowData[i] = data.field3 || "";
    else if (header === 'field4') rowData[i] = data.field4 || "";
  });
  
  if (rowIndex > -1) {
    sheet.getRange(rowIndex + 2, 1, 1, rowData.length).setValues([rowData]);
  } else {
    sheet.appendRow(rowData);
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
  try {
    var folder = DriveApp.getFolderById(folderId);
    
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
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    
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
      else if (lowerKey === 'nik') clientKey = 'nik';
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
  
  // Cari duplikasi berdasarkan userId atau email aktif (status non-rejected)
  var rowIndex = apps.findIndex(function(app) {
    var appStatus = (app.status || app.Status || '').toString().toLowerCase();
    if (appStatus === 'rejected') return false;
    
    var appUserId = (app.userid || app.userId || app.UserId || '').toString();
    var dataUserId = (data.userId || '').toString();
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
    else if (header === 'photo') rowData[i] = data.photo || "";
    else if (header === 'tingkatan') rowData[i] = data.tingkatan || "";
    else if (header === 'asaldaerah') rowData[i] = data.asalDaerah || "";
    else if (header === 'status') rowData[i] = existing ? (existing.status || existing.Status || "pending") : "pending";
    else if (header === 'tanggalajuan') rowData[i] = existing ? (existing.tanggalajuan || existing.tanggalAjuan || existing.TanggalAjuan || new Date().toISOString()) : new Date().toISOString();
    else if (header === 'ktanumber') rowData[i] = existing ? (existing.ktanumber || existing.ktaNumber || "") : "";
    else if (header === 'remark') rowData[i] = existing ? (existing.remark || existing.Remark || "") : "";
    else if (header === 'nik') rowData[i] = data.nik || "";
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
    else if (header === 'nik') val = data.nik !== undefined ? data.nik : (existing.nik || "");
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
  var apps = getRowsAsObjects(getSheet('Training_Applications'));
  
  var normalizedApps = apps.map(function(app) {
    var cleanApp = {};
    for (var key in app) {
      var lowerKey = key.toLowerCase();
      var clientKey = key;
      if (lowerKey === 'userid') clientKey = 'userId';
      else if (lowerKey === 'nowa') clientKey = 'noWa';
      else if (lowerKey === 'asaldaerah') clientKey = 'asalDaerah';
      else if (lowerKey === 'tanggalajuan') clientKey = 'tanggalAjuan';
      else if (lowerKey === 'pelatihanakandiikuti') clientKey = 'pelatihanAkanDiikuti';
      else if (lowerKey === 'tempatlahir') clientKey = 'tempatLahir';
      else if (lowerKey === 'tanggallahir') clientKey = 'tanggalLahir';
      else if (lowerKey === 'jeniskelamin') clientKey = 'jenisKelamin';
      else if (lowerKey === 'lokasipelatihan') clientKey = 'lokasiPelatihan';
      else if (lowerKey === 'tanggalpelatihan') clientKey = 'tanggalPelatihan';
      
      cleanApp[clientKey] = app[key];
    }
    return cleanApp;
  });

  return responseOk(normalizedApps);
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
    else if (header === 'nik') rowData[i] = data.nik || "";
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

`;

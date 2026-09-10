export interface SongMetadata {
  title: string;
  creator: string;
  vocalist?: string;
  category?: string;
  lyrics: string;
  theme: {
    gradient: string;
    textAccent: string;
    borderAccent: string;
    bgBadge: string;
  };
}

export const KNOWN_HW_SONGS: Record<string, SongMetadata> = {
  'mars hizbul wathan': {
    title: 'Mars Hizbul Wathan',
    creator: 'H. Siradj Dahlan',
    vocalist: 'Paduan Suara HW',
    category: 'Mars & Lagu Wajib',
    lyrics: `Hizbul Wathan yang bersemangat
Menjunjung tinggi agama Islam
Membina watak, mendidik budi
Rela berkorban untuk negeri

Teguh hati pantang menyerah
Di bawah panji Muhammadiyah
Fas-tabiqul khairat jadi semboyan
Berlomba-lomba dalam kebaikan

Maju terus Pandu HW
Tegakkan tauhid sejati
Hizbul Wathan pandu perwira
Mengabdi tulus untuk sesama!`,
    theme: {
      gradient: 'from-emerald-600 via-teal-700 to-emerald-900',
      textAccent: 'text-emerald-700',
      borderAccent: 'border-emerald-200',
      bgBadge: 'bg-emerald-50 text-emerald-800 border-emerald-200'
    }
  },
  'mars hw': {
    title: 'Mars HW',
    creator: 'H. Siradj Dahlan',
    vocalist: 'Paduan Suara HW',
    category: 'Mars & Lagu Wajib',
    lyrics: `Hizbul Wathan yang bersemangat
Menjunjung tinggi agama Islam
Membina watak, mendidik budi
Rela berkorban untuk negeri

Teguh hati pantang menyerah
Di bawah panji Muhammadiyah
Fas-tabiqul khairat jadi semboyan
Berlomba-lomba dalam kebaikan

Maju terus Pandu HW
Tegakkan tauhid sejati
Hizbul Wathan pandu perwira
Mengabdi tulus untuk sesama!`,
    theme: {
      gradient: 'from-emerald-600 via-teal-700 to-emerald-900',
      textAccent: 'text-emerald-700',
      borderAccent: 'border-emerald-200',
      bgBadge: 'bg-emerald-50 text-emerald-800 border-emerald-200'
    }
  },
  'hymne hizbul wathan': {
    title: 'Hymne HW Panduku',
    creator: 'H.M. Affandi',
    vocalist: 'Paduan Suara HW',
    category: 'Hymne',
    lyrics: `Di bawah panji suci mulia
Hizbul Wathan melangkah pasti
Mengabdi pada nusa dan bangsa
Ikhlas berbakti tulus mengabdi

Pancasila dasar negara
Al-Qur'an dan Sunnah pegangan kita
Maju terus pandu mulia
Jayalah Hizbul Wathan selamanya!`,
    theme: {
      gradient: 'from-blue-600 via-indigo-700 to-slate-900',
      textAccent: 'text-indigo-700',
      borderAccent: 'border-indigo-200',
      bgBadge: 'bg-indigo-50 text-indigo-800 border-indigo-200'
    }
  },
  'hymne hw panduku': {
    title: 'Hymne HW Panduku',
    creator: 'H.M. Affandi',
    vocalist: 'Paduan Suara HW',
    category: 'Hymne',
    lyrics: `Di bawah panji suci mulia
Hizbul Wathan melangkah pasti
Mengabdi pada nusa dan bangsa
Ikhlas berbakti tulus mengabdi

Pancasila dasar negara
Al-Qur'an dan Sunnah pegangan kita
Maju terus pandu mulia
Jayalah Hizbul Wathan selamanya!`,
    theme: {
      gradient: 'from-blue-600 via-indigo-700 to-slate-900',
      textAccent: 'text-indigo-700',
      borderAccent: 'border-indigo-200',
      bgBadge: 'bg-indigo-50 text-indigo-800 border-indigo-200'
    }
  },
  'hymne hw': {
    title: 'Hymne HW Panduku',
    creator: 'H.M. Affandi',
    vocalist: 'Paduan Suara HW',
    category: 'Hymne',
    lyrics: `Di bawah panji suci mulia
Hizbul Wathan melangkah pasti
Mengabdi pada nusa dan bangsa
Ikhlas berbakti tulus mengabdi

Pancasila dasar negara
Al-Qur'an dan Sunnah pegangan kita
Maju terus pandu mulia
Jayalah Hizbul Wathan selamanya!`,
    theme: {
      gradient: 'from-blue-600 via-indigo-700 to-slate-900',
      textAccent: 'text-indigo-700',
      borderAccent: 'border-indigo-200',
      bgBadge: 'bg-indigo-50 text-indigo-800 border-indigo-200'
    }
  },
  'sahabat hw': {
    title: 'Sahabat HW',
    creator: 'Muhammad Dzikron',
    vocalist: 'Kak Dzikron & Sahabat Pandu',
    category: 'Lagu Pandu & Motivasi',
    lyrics: `Bersama kita melangkah
Menembus cakrawala asa
Sahabat sejati Pandu HW
Satu hati dalam ukhuwah persaudaraan

Di bumi perkemahan kita bersua
Belajar mandiri, disiplin, berjiwa ksatria
Setia pandu, suci pikiran perkataan perbuatan
Hizbul Wathan, sahabat setia sepanjang zaman!`,
    theme: {
      gradient: 'from-teal-600 via-cyan-700 to-blue-900',
      textAccent: 'text-teal-700',
      borderAccent: 'border-teal-200',
      bgBadge: 'bg-teal-50 text-teal-800 border-teal-200'
    }
  },
  'hw untuk indonesia': {
    title: 'HW Untuk Indonesia',
    creator: 'Muhammad Dzikron',
    vocalist: 'Kak Dzikron',
    category: 'Lagu Pandu & Semangat',
    lyrics: `Dari ujung timur hingga ke barat
Pandu Hizbul Wathan berhimpun erat
Menjaga marwah, mengukir prestasi
Demi kejayaan Ibu Pertiwi

Cinta tanah air sebagian dari iman
Kami berjanji setia membela bangsa
Hizbul Wathan untuk Indonesia
Maju bersama, jaya selamanya!`,
    theme: {
      gradient: 'from-rose-600 via-red-700 to-amber-900',
      textAccent: 'text-rose-700',
      borderAccent: 'border-rose-200',
      bgBadge: 'bg-rose-50 text-rose-800 border-rose-200'
    }
  },
  'mahrojan penghela': {
    title: 'Mahrojan Penghela',
    creator: 'Muhammad Dzikron',
    vocalist: 'Tim Paduan Suara Penghela',
    category: 'Lagu Pandu & Semangat',
    lyrics: `Derap langkah penghela berderap maju
Menatap masa depan cerah berseri
Di arena Mahrojan kita berpadu
Membina karya dan bakti negeri

Jiwa pandu yang tangguh dan satria
Fas-tabiqul khairat penuntun jiwa
Hizbul Wathan pandu perwira
Jaya sentosa sepanjang masa!`,
    theme: {
      gradient: 'from-purple-600 via-indigo-700 to-slate-900',
      textAccent: 'text-purple-700',
      borderAccent: 'border-purple-200',
      bgBadge: 'bg-purple-50 text-purple-800 border-purple-200'
    }
  },
  'sang surya': {
    title: 'Sang Surya (Mars Muhammadiyah)',
    creator: 'Djarnawi Hadikusuma',
    vocalist: 'Paduan Suara Muhammadiyah',
    category: 'Mars & Lagu Wajib',
    lyrics: `Sang Surya tetap bersinar
Syahadat dua melingkar
Warna yang hijau berseri
Membuat rela hati

Ya Allah Tuhan Rabbiku
Muhammad petunjukku
Al-Islam agamaku
Muhammadiyah gerakanku

Di timur fajar merekah
Mengajak bangun berbakti
Mengabdi pada Ilahi
Dengan ikhlas tulus hati`,
    theme: {
      gradient: 'from-amber-500 via-orange-600 to-yellow-800',
      textAccent: 'text-amber-700',
      borderAccent: 'border-amber-200',
      bgBadge: 'bg-amber-50 text-amber-900 border-amber-200'
    }
  },
  'mars aisyiyah': {
    title: 'Mars Aisyiyah',
    creator: 'Ny. Hj. Siti Badilah Zuber',
    vocalist: 'Paduan Suara Aisyiyah',
    category: 'Mars & Lagu Wajib',
    lyrics: `Wahai warga Aisyiyah sejati
Sadarlah akan panggilan suci
Membimbing putri-putri pertiwi
Menuju ridha Ilahi Rabbi

Tegakkan amar ma'ruf nahi munkar
Bercahaya panji Islam nan agung
Beramal ikhlas sepanjang hayat
Bahagia dunia dan akhirat!`,
    theme: {
      gradient: 'from-emerald-700 via-green-800 to-teal-950',
      textAccent: 'text-emerald-800',
      borderAccent: 'border-emerald-200',
      bgBadge: 'bg-emerald-50 text-emerald-800 border-emerald-200'
    }
  }
};

export const resolveTrackMetadata = (track: any) => {
  // 1. Detect audio URL and Title (handles inverted field1/field2 and all field aliases)
  const f1 = String(track?.field1 || '').trim();
  const f2 = String(track?.field2 || '').trim();
  const explicitUrl = String(track?.audioUrl || track?.audiourl || track?.linkAudio || track?.link_audio || track?.link || track?.url || track?.mp3 || track?.fileUrl || track?.driveUrl || '').trim();
  const explicitTitle = String(track?.judul || track?.title || track?.namaLagu || track?.namalagu || track?.nama || track?.name || track?.track || '').trim();

  const isUrlLike = (s: string) => s.startsWith('http://') || s.startsWith('https://') || s.endsWith('.mp3') || s.includes('drive.google.com') || s.includes('hwjateng.org/musik') || (s.includes('/') && s.includes('.'));

  let audioUrl = explicitUrl;
  let rawTitle = explicitTitle;

  if (!audioUrl) {
    if (isUrlLike(f1)) {
      audioUrl = f1;
      if (!rawTitle && f2 && !isUrlLike(f2)) rawTitle = f2;
    } else if (isUrlLike(f2)) {
      audioUrl = f2;
      if (!rawTitle && f1 && !isUrlLike(f1)) rawTitle = f1;
    } else {
      audioUrl = f1 || f2;
    }
  }

  if (!rawTitle) {
    if (f2 && f2 !== audioUrl && !isUrlLike(f2)) rawTitle = f2;
    else if (f1 && f1 !== audioUrl && !isUrlLike(f1)) rawTitle = f1;
    else rawTitle = (f2 && f2 !== audioUrl) ? f2 : ((f1 && f1 !== audioUrl) ? f1 : 'Lagu Hizbul Wathan');
  }

  const lowerTitle = rawTitle.toLowerCase();

  // Try matching known HW song dictionary
  let matchedKey = Object.keys(KNOWN_HW_SONGS).find(key => 
    lowerTitle === key || lowerTitle.includes(key) || key.includes(lowerTitle)
  );

  const matched = matchedKey ? KNOWN_HW_SONGS[matchedKey] : null;

  const isMarsHW = lowerTitle.includes('mars hizbul wathan') || lowerTitle === 'mars hw' || lowerTitle.includes('mars gerakan kepanduan hizbul wathan') || lowerTitle.includes('mars pandu hw');
  const isHymneHW = lowerTitle.includes('hymne');
  const isSangSurya = lowerTitle.includes('sang surya');
  const isMarsAisyiyah = lowerTitle.includes('mars aisyiyah');

  let defaultCreator = 'Muhammad Dzikron';
  if (isMarsHW) {
    defaultCreator = 'H. Siradj Dahlan';
  } else if (isHymneHW) {
    defaultCreator = 'H.M. Affandi';
  } else if (isSangSurya) {
    defaultCreator = 'Djarnawi Hadikusuma';
  } else if (isMarsAisyiyah) {
    defaultCreator = 'Ny. Hj. Siti Badilah Zuber';
  }

  // Custom metadata from Admin/Spreadsheet input takes precedence, followed by matched catalog, then fallback
  let rawCreator = (track?.field3 || track?.pencipta || track?.creator || track?.artist || matched?.creator || '').trim();
  
  if (!rawCreator || ['pandu hw', 'pandu hizbul wathan', 'kwarwil hw', 'kwarnas hw', 'kwarpus hw', 'kwarwil hw jateng', 'kwarda hw'].includes(rawCreator.toLowerCase())) {
    rawCreator = defaultCreator;
  } else if (!isMarsHW && !isHymneHW && !isSangSurya && !isMarsAisyiyah) {
    // Only replace if rawCreator is just generic 'hw' without custom name
    if (rawCreator.toLowerCase() === 'hw' || rawCreator.toLowerCase() === 'pandu') {
      rawCreator = 'Muhammad Dzikron';
    }
  }

  const creator = rawCreator || defaultCreator;

  // Extract Vocalist / Penyanyi
  let rawVocalist = (track?.field4 || track?.vokalis || track?.vocalist || track?.penyanyi || track?.singer || matched?.vocalist || '').trim();
  const knownCategories = ['mars & hymne hw', 'lagu pandu hw', 'mars & lagu wajib', 'hymne', 'lagu pandu & motivasi', 'lagu pandu & semangat', 'mars', 'pandu'];
  if (knownCategories.includes(rawVocalist.toLowerCase())) {
    rawVocalist = matched?.vocalist || 'Paduan Suara HW';
  }
  const defaultVocalist = matched?.vocalist || (isMarsHW || isHymneHW || isSangSurya || isMarsAisyiyah ? 'Paduan Suara HW' : 'Kak Dzikron & Sahabat Pandu');
  const vocalist = rawVocalist || defaultVocalist;

  const category = (track?.kategori || track?.category || matched?.category || '').trim() || (isMarsHW || isHymneHW ? 'Mars & Hymne HW' : 'Lagu Pandu HW');
  const lyrics = (track?.field5 || track?.lirik || track?.lyrics || track?.syair || track?.teks || matched?.lyrics || 'Lirik lagu belum tersedia. Dengarkan alunan audio ini melalui pemutar musik.').trim();

  // Color theme
  const themes = [
    {
      gradient: 'from-emerald-600 via-teal-700 to-emerald-950',
      textAccent: 'text-emerald-700',
      borderAccent: 'border-emerald-200',
      bgBadge: 'bg-emerald-50 text-emerald-800 border-emerald-200'
    },
    {
      gradient: 'from-amber-600 via-yellow-700 to-stone-900',
      textAccent: 'text-amber-700',
      borderAccent: 'border-amber-200',
      bgBadge: 'bg-amber-50 text-amber-900 border-amber-200'
    },
    {
      gradient: 'from-blue-600 via-indigo-700 to-slate-900',
      textAccent: 'text-indigo-700',
      borderAccent: 'border-indigo-200',
      bgBadge: 'bg-indigo-50 text-indigo-800 border-indigo-200'
    },
    {
      gradient: 'from-teal-600 via-emerald-800 to-slate-900',
      textAccent: 'text-teal-700',
      borderAccent: 'border-teal-200',
      bgBadge: 'bg-teal-50 text-teal-800 border-teal-200'
    },
    {
      gradient: 'from-purple-600 via-indigo-800 to-slate-950',
      textAccent: 'text-purple-700',
      borderAccent: 'border-purple-200',
      bgBadge: 'bg-purple-50 text-purple-800 border-purple-200'
    }
  ];

  // Pick deterministic theme based on string hash
  let hash = 0;
  for (let i = 0; i < rawTitle.length; i++) {
    hash = (hash + rawTitle.charCodeAt(i) * 31) % themes.length;
  }
  const theme = matched?.theme || themes[hash];

  return {
    id: track?.id || `track-${encodeURIComponent(rawTitle.toLowerCase().replace(/\s+/g, '-'))}`,
    title: matched?.title || rawTitle,
    creator,
    pencipta: creator,
    vocalist,
    vokalis: vocalist,
    category,
    lyrics,
    lirik: lyrics,
    audioUrl: audioUrl || track?.audioUrl || track?.field1 || track?.url || '',
    theme,
    raw: track
  };
};

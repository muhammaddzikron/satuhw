export interface SongMetadata {
  title: string;
  creator: string;
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
    creator: 'Kwarwil HW Jateng',
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
    creator: 'Pandu Penghela HW',
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
  const rawTitle = (track?.field2 || track?.title || track?.name || 'Untitled Audio').trim();
  const lowerTitle = rawTitle.toLowerCase();

  // Try matching known HW song dictionary
  let matchedKey = Object.keys(KNOWN_HW_SONGS).find(key => 
    lowerTitle === key || lowerTitle.includes(key) || key.includes(lowerTitle)
  );

  const matched = matchedKey ? KNOWN_HW_SONGS[matchedKey] : null;

  // Custom metadata from Admin/Spreadsheet input takes precedence, followed by matched catalog, then fallback
  const creator = (track?.field3 || track?.pencipta || track?.artist || matched?.creator || '').trim() || 'Pandu Hizbul Wathan';
  const category = (track?.field4 || track?.kategori || track?.category || matched?.category || '').trim() || 'Lagu Pandu HW';
  const lyrics = (track?.field5 || track?.lirik || track?.lyrics || matched?.lyrics || 'Lirik lagu belum tersedia. Dengarkan alunan audio ini melalui pemutar musik.').trim();

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
    id: track?.id || `track-${Math.random()}`,
    title: rawTitle,
    creator,
    category,
    lyrics,
    audioUrl: track?.field1 || track?.url || '',
    theme,
    raw: track
  };
};

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
  },
  'mars pandu harapan': {
    title: 'Mars Pandu Harapan',
    creator: 'H. Siradj Dahlan',
    vocalist: 'Paduan Suara HW',
    category: 'Mars & Lagu Wajib',
    lyrics: `Harapan bangsa di pundak kita
Pandu Hizbul Wathan berjiwa baja
Menempuh jalan penuh tantangan
Dengan iman serta ketakwaan.

Reff:
Maju pandu harapan masa depan
Tegakkan kebenaran dan keadilan
Di bawah naungan panji Islam
Damai sentosa sepanjang zaman.`,
    theme: {
      gradient: 'from-blue-600 via-teal-700 to-emerald-900',
      textAccent: 'text-blue-700',
      borderAccent: 'border-blue-200',
      bgBadge: 'bg-blue-50 text-blue-800 border-blue-200'
    }
  },
  'mars wathoni': {
    title: 'Mars Wathoni',
    creator: 'H. M. Affandi',
    vocalist: 'Paduan Suara HW',
    category: 'Mars & Lagu Wajib',
    lyrics: `Cinta tanah air terpateri di dada
Hizbul Wathan pandu setia
Rela berkorban jiwa dan raga
Membela nusa serta agama.

Reff:
Wahai wathoni pandu perkasa
Kibarkan panji kejayaan bangsa
Ikhlas berbakti tanpa pamrih
Hati suci langkah bersih.`,
    theme: {
      gradient: 'from-red-600 via-rose-700 to-amber-900',
      textAccent: 'text-red-700',
      borderAccent: 'border-red-200',
      bgBadge: 'bg-red-50 text-red-800 border-red-200'
    }
  },
  'mars kebangkitan hw': {
    title: 'Mars Kebangkitan HW',
    creator: 'H. M. Affandi',
    vocalist: 'Paduan Suara HW',
    category: 'Mars & Lagu Wajib',
    lyrics: `Fajar kebangkitan telah tiba
Pandu Hizbul Wathan melangkah nyata
Mengukir sejarah generasi gemilang
Di persada nusantara tercinta.

Reff:
Bangkitlah pandu pelopor umat
Fastabiqul khairat penuntun niat
Menjunjung martabat persyarikatan
Menebar rahmat bagi sekalian alam.`,
    theme: {
      gradient: 'from-emerald-600 via-teal-800 to-slate-900',
      textAccent: 'text-emerald-700',
      borderAccent: 'border-emerald-200',
      bgBadge: 'bg-emerald-50 text-emerald-800 border-emerald-200'
    }
  },
  'mars bangkit hw': {
    title: 'Mars Bangkit HW',
    creator: 'Kwarpus HW',
    vocalist: 'Paduan Suara HW',
    category: 'Mars & Lagu Wajib',
    lyrics: `Seruan suci bergema membahana
Memanggil pandu ke medan karya
Siapkan diri lahir dan batin
Menghadapi zaman serba yakin.

Reff:
Bangkit pandu perkasa
Teguhkan cita-cita mulia
Hizbul Wathan siap sedia
Membela Islam dan Indonesia!`,
    theme: {
      gradient: 'from-amber-600 via-orange-700 to-red-900',
      textAccent: 'text-amber-700',
      borderAccent: 'border-amber-200',
      bgBadge: 'bg-amber-50 text-amber-900 border-amber-200'
    }
  },
  'pandu hw paud berdendang': {
    title: 'Pandu HW PAUD Berdendang',
    creator: 'Muhammad Dzikron',
    vocalist: 'Kak Dzikron & Pandu Cilik',
    category: 'Lagu Pandu Athfal',
    lyrics: `Tersenyum tertawa riang gembira
Pandu HW kecil ceria
Bermain belajar bersama kawan
Mengenal Tuhan Maha Penyayang.

Reff:
Dendang gembira pandu athfal
Cinta ayah bunda dan kawan
Rajin ibadah berakhlak mulia
Kelak jadi generasi berguna.`,
    theme: {
      gradient: 'from-pink-500 via-rose-600 to-purple-800',
      textAccent: 'text-rose-600',
      borderAccent: 'border-rose-200',
      bgBadge: 'bg-rose-50 text-rose-800 border-rose-200'
    }
  },
  'pandu hw tak pernah susah': {
    title: 'Pandu HW Tak Pernah Susah',
    creator: 'H. Siradj Dahlan',
    vocalist: 'Paduan Suara Pengenal HW',
    category: 'Lagu Riang Pandu',
    lyrics: `Pandu HW tak pernah susah
Selalu riang serta gembira
Meski berjalan di terik surya
Tetap senyum penuh suka.

Reff:
Susah apa guna bersusah
Pandu HW suka bekerja
Bantu sesama penuh suka cita
Hidup bahagia sejahtera.`,
    theme: {
      gradient: 'from-yellow-500 via-amber-600 to-emerald-800',
      textAccent: 'text-amber-700',
      borderAccent: 'border-amber-200',
      bgBadge: 'bg-amber-50 text-amber-900 border-amber-200'
    }
  },
  'hw ada di mana-mana': {
    title: 'HW Ada di Mana-mana',
    creator: 'Pandu HW Jateng',
    vocalist: 'Tim Paduan Suara HW',
    category: 'Lagu Pandu & Semangat',
    lyrics: `Dari kota hingga ke desa
Pandu HW ada di mana-mana
Menolong siapa yang butuh bantuan
Dengan tulus dan keikhlasan.

Reff:
Di mana-mana pandu berada
Menabur benih kebaikan sesama
Itulah semboyan pandu mulia
Sedikit bicara banyak bekerja.`,
    theme: {
      gradient: 'from-indigo-600 via-blue-700 to-slate-900',
      textAccent: 'text-indigo-700',
      borderAccent: 'border-indigo-200',
      bgBadge: 'bg-indigo-50 text-indigo-800 border-indigo-200'
    }
  },
  'mars athfal hw': {
    title: 'Mars Athfal HW',
    creator: 'Tim Kwarpus HW',
    vocalist: 'Koor Rumpun Athfal',
    category: 'Lagu Pandu Athfal',
    lyrics: `Kami rumpun athfal pandu ceria
Taat pada ayah bunda
Sayang kawan suka menolong
Tak pernah cemberut atau sombong.

Reff:
Athfal HW pandu cilik
Langkah riang hati asyik
Belajar agama sejak dini
Untuk masa depan negeri.`,
    theme: {
      gradient: 'from-cyan-500 via-teal-600 to-emerald-900',
      textAccent: 'text-cyan-700',
      borderAccent: 'border-cyan-200',
      bgBadge: 'bg-cyan-50 text-cyan-800 border-cyan-200'
    }
  },
  'lagu pengenal hw': {
    title: 'Lagu Pengenal HW',
    creator: 'Tim Pembina HW',
    vocalist: 'Regu Pengenal HW',
    category: 'Lagu Pandu Pengenal',
    lyrics: `Pasukan pengenal siap siaga
Belajar mandiri di alam terbuka
Tali-temali kompas petunjuk arah
Menempa diri pantang menyerah.

Reff:
Pengenal HW tangguh dan cekatan
Bekerja sama dalam ikatan
Menjaga janji dan undang-undang
Hingga fajar kejayaan datang.`,
    theme: {
      gradient: 'from-teal-600 via-emerald-700 to-slate-900',
      textAccent: 'text-teal-700',
      borderAccent: 'border-teal-200',
      bgBadge: 'bg-teal-50 text-teal-800 border-teal-200'
    }
  },
  'lagu penghela hw': {
    title: 'Lagu Penghela HW',
    creator: 'Tim Pelatih HW',
    vocalist: 'Kerabat Penghela HW',
    category: 'Lagu Pandu Penghela',
    lyrics: `Kerabat penghela langkah tegap perkasa
Kader pelopor generasi muda
Mengkaji ilmu asah ketrampilan
Menyongsong era pembangunan.

Reff:
Penghela HW siap memimpin
Bermusyawarah tulus dan yakin
Bakti nyata untuk umat tercinta
Menuju ridha Yang Maha Esa.`,
    theme: {
      gradient: 'from-emerald-700 via-green-800 to-stone-900',
      textAccent: 'text-emerald-800',
      borderAccent: 'border-emerald-200',
      bgBadge: 'bg-emerald-50 text-emerald-800 border-emerald-200'
    }
  },
  'lagu penuntun hw': {
    title: 'Lagu Penuntun HW',
    creator: 'Kafilah Penuntun HW',
    vocalist: 'Kafilah Penuntun',
    category: 'Lagu Pandu Penuntun',
    lyrics: `Kafilah penuntun abdi pertiwi
Mengemban amanah suci
Terjun membina di tengah umat
Menebarkan manfaat serta rahmat.

Reff:
Penuntun HW pelita harapan
Memberi contoh dan teladan
Istiqomah di garis perjuangan
Muhammadiyah dalam gerak langkah.`,
    theme: {
      gradient: 'from-violet-600 via-purple-700 to-slate-950',
      textAccent: 'text-violet-700',
      borderAccent: 'border-violet-200',
      bgBadge: 'bg-violet-50 text-violet-800 border-violet-200'
    }
  },
  'api unggun hw': {
    title: 'Api Unggun HW (Nyala Api Semangat)',
    creator: 'Muhammad Dzikron',
    vocalist: 'Tim Perkemahan HW',
    category: 'Lagu Api Unggun',
    lyrics: `Malam telah larut hening gulita
Nyala api unggun membakar dada
Menghangatkan dinginnya suasana
Mempererat tali persaudaraan kita.

Reff:
Kobarkan api semangat pandu
Satu tekad satu tuju
Jangan biarkan padam apimu
Hingga tercapai cita luhurmu.`,
    theme: {
      gradient: 'from-orange-600 via-red-600 to-amber-950',
      textAccent: 'text-orange-700',
      borderAccent: 'border-orange-200',
      bgBadge: 'bg-orange-50 text-orange-900 border-orange-200'
    }
  },
  'tadabbur alam hw': {
    title: 'Tadabbur Alam HW',
    creator: 'Muhammad Dzikron',
    vocalist: 'Tim Pandu Petualang',
    category: 'Lagu Pandu & Alam',
    lyrics: `Gunung menghijau lembah membentang
Laut membiru langit nan lapang
Semua ciptaan Tuhan Pengasih
Tanda keagungan nan suci bersih.

Reff:
Tadabbur alam pandu sejati
Mensyukuri nikmat Ilahi Rabbi
Menjaga bumi lestarikan alam
Untuk kesejahteraan semesta alam.`,
    theme: {
      gradient: 'from-green-600 via-emerald-700 to-teal-900',
      textAccent: 'text-green-700',
      borderAccent: 'border-green-200',
      bgBadge: 'bg-green-50 text-green-800 border-green-200'
    }
  },
  'derap pandu muhammadiyah': {
    title: 'Derap Pandu Muhammadiyah',
    creator: 'H. M. Affandi',
    vocalist: 'Paduan Suara HW',
    category: 'Lagu Perjuangan',
    lyrics: `Derap langkah teratur seirama
Menapaki jejak para ulama
Pandu Hizbul Wathan berbaris rapi
Menjaga kesucian janji suci.

Reff:
Derap pandu Muhammadiyah
Ikhlas berjuang lillahi ta'ala
Menebar damai di bumi nusantara
Islam berkemajuan tujuan kita.`,
    theme: {
      gradient: 'from-slate-700 via-blue-800 to-emerald-950',
      textAccent: 'text-blue-800',
      borderAccent: 'border-blue-200',
      bgBadge: 'bg-blue-50 text-blue-900 border-blue-200'
    }
  },
  'selamat datang kakak pembina': {
    title: 'Selamat Datang Kakak Pembina',
    creator: 'Pandu HW',
    vocalist: 'Rumpun Athfal & Pengenal',
    category: 'Lagu Sambutan & Gembira',
    lyrics: `Selamat datang kakak pembina
Di perkemahan kami yang ceria
Bimbinglah kami tunjukkan arah
Agar ilmu kami bertambah berkah.

Reff:
Terima kasih kakak pembina
Jasamu tulus tiada tara
Kami berjanji rajin berlatih
Menjadi pandu berjiwa bersih.`,
    theme: {
      gradient: 'from-amber-500 via-teal-600 to-blue-900',
      textAccent: 'text-teal-700',
      borderAccent: 'border-teal-200',
      bgBadge: 'bg-teal-50 text-teal-800 border-teal-200'
    }
  },
  'selamat berpisah': {
    title: 'Selamat Berpisah (Sayonara HW)',
    creator: 'Pandu HW',
    vocalist: 'Paduan Suara HW',
    category: 'Lagu Perpisahan',
    lyrics: `Waktu jua memisahkan kita
Selesailah sudah masa berkemah
Kenangan indah kan slalu terjaga
Di lubuk hati yang paling dalam.

Reff:
Selamat berpisah sahabat pandu
Sampai kita berjumpa lagi
Semoga Allah melindungi kita
Dalam rahmat dan berkah Ilahi.`,
    theme: {
      gradient: 'from-purple-700 via-indigo-800 to-slate-950',
      textAccent: 'text-purple-700',
      borderAccent: 'border-purple-200',
      bgBadge: 'bg-purple-50 text-purple-800 border-purple-200'
    }
  },
  'satu nusa satu bangsa': {
    title: 'Satu Nusa Satu Bangsa (Versi HW)',
    creator: 'L. Manik (Arr. HW)',
    vocalist: 'Paduan Suara HW',
    category: 'Lagu Nasional & Kepanduan',
    lyrics: `Satu nusa, satu bangsa
Satu bahasa kita
Tanah air pasti jaya
Untuk selama-lamanya.

Reff:
Indonesia pusaka
Indonesia tercinta
Nusa bangsa dan bahasa
Kita bela bersama.`,
    theme: {
      gradient: 'from-red-600 via-rose-700 to-slate-900',
      textAccent: 'text-rose-700',
      borderAccent: 'border-rose-200',
      bgBadge: 'bg-rose-50 text-rose-800 border-rose-200'
    }
  },
  'syukur pandu hw': {
    title: 'Syukur Pandu HW',
    creator: 'H. Mutahar (Arr. HW)',
    vocalist: 'Paduan Suara HW',
    category: 'Lagu Perenungan & Syukur',
    lyrics: `Dari yakinku teguh
Hati ikhlasku penuh
Akan karunia-Mu
Tanah air pusaka Indonesia merdeka
Syukur aku sembahkan
Kehadirat-Mu Tuhan.`,
    theme: {
      gradient: 'from-emerald-800 via-teal-900 to-slate-950',
      textAccent: 'text-emerald-700',
      borderAccent: 'border-emerald-200',
      bgBadge: 'bg-emerald-50 text-emerald-800 border-emerald-200'
    }
  },
  'hizbul wathan berkemah': {
    title: 'Hizbul Wathan Berkemah',
    creator: 'Muhammad Dzikron',
    vocalist: 'Tim Pasukan Pengenal',
    category: 'Lagu Perkemahan',
    lyrics: `Tenda-tenda berdiri tegak berjejer
Di bawah teduh pohon cemara
Dapur mengepul api menyala
Pandu mandiri masak bersama.

Reff:
Indahnya suasana perkemahan
Penuh gelak tawa persaudaraan
Malam gembira siang berkarya
Itulah hari-hari pandu mulia.`,
    theme: {
      gradient: 'from-lime-600 via-emerald-700 to-stone-900',
      textAccent: 'text-emerald-700',
      borderAccent: 'border-emerald-200',
      bgBadge: 'bg-emerald-50 text-emerald-800 border-emerald-200'
    }
  },
  'tepuk dan yel-yel semangat hw': {
    title: 'Tepuk dan Yel-Yel Semangat HW',
    creator: 'Kwarwil HW Jateng',
    vocalist: 'Regu Pandu Tangguh',
    category: 'Lagu & Yel-Yel',
    lyrics: `Tepuk satu... prok prok prok!
Tepuk dua... prok prok prok!
Siapa kita? Hizbul Wathan!
Di mana kita? Di garis depan!

Reff:
Maju... jalan pantang mundur!
Semangat membara tak pernah luntur!
Sedikit bicara banyak bekerja!
HW jaya, jaya, jaya!`,
    theme: {
      gradient: 'from-amber-500 via-orange-600 to-red-800',
      textAccent: 'text-amber-700',
      borderAccent: 'border-amber-200',
      bgBadge: 'bg-amber-50 text-amber-900 border-amber-200'
    }
  },
  'janji dan undang-undang hw': {
    title: 'Janji dan Undang-Undang HW',
    creator: 'H. M. Affandi',
    vocalist: 'Tim Penghela HW',
    category: 'Lagu Pembinaan Karakter',
    lyrics: `Mengingat janji di hadapan Ilahi
Undang-undang pandu kami ditaati
Setia pada Allah dan Rasul-Nya
Taat aturan jujur bertutur kata.

Reff:
Sopan perwira menyayangi sesama
Hemat cermat suci perkataan
Pandu HW berakhlak mulia
Teladan indah di tengah masyarakat.`,
    theme: {
      gradient: 'from-blue-700 via-indigo-800 to-teal-950',
      textAccent: 'text-indigo-700',
      borderAccent: 'border-indigo-200',
      bgBadge: 'bg-indigo-50 text-indigo-800 border-indigo-200'
    }
  },
  'kafilah berjuang': {
    title: 'Kafilah Berjuang',
    creator: 'Muhammad Dzikron',
    vocalist: 'Kafilah Penuntun HW Jateng',
    category: 'Lagu Pandu & Perjuangan',
    lyrics: `Kafilah berderap di tengah deru zaman
Membawa panji amar ma'ruf nahi munkar
Tak gentar hadapi rintangan
Demi tegaknya kalimah Allah nan agung.

Reff:
Berjuanglah kafilah mulia
Jangan goyah diterpa badai dunia
Kemenangan hakiki menanti kita
Di ridha Allah Azza wa Jalla.`,
    theme: {
      gradient: 'from-emerald-700 via-teal-800 to-slate-900',
      textAccent: 'text-emerald-700',
      borderAccent: 'border-emerald-200',
      bgBadge: 'bg-emerald-50 text-emerald-800 border-emerald-200'
    }
  },
  'semangat hizbul wathan jaya': {
    title: 'Semangat Hizbul Wathan Jaya',
    creator: 'Tim Musik HW Jateng',
    vocalist: 'Paduan Suara Pandu',
    category: 'Lagu Pandu & Semangat',
    lyrics: `Suara lantang menggetarkan angkasa
Menyanyikan lagu cinta persada
Hizbul Wathan pandu sejati
Mengukir karya di sanubari.

Reff:
Jaya jaya Hizbul Wathan
Pelopor kebaikan sepanjang zaman
Berbakti ikhlas penuh kerelaan
Untuk agama, nusa, dan peradaban.`,
    theme: {
      gradient: 'from-teal-600 via-cyan-700 to-indigo-900',
      textAccent: 'text-teal-700',
      borderAccent: 'border-teal-200',
      bgBadge: 'bg-teal-50 text-teal-800 border-teal-200'
    }
  },
  'bintang berpaling ke tanah air': {
    title: 'Bintang Berpaling ke Tanah Air',
    creator: 'H. Siradj Dahlan',
    vocalist: 'Paduan Suara HW',
    category: 'Lagu Sejarah HW',
    lyrics: `Bintang bersinar di langit malam
Menerangi bumi pertiwi yang damai
Sejak dahulu pendahulu berjuang
Membela negeri dengan ikhlas hati.

Reff:
Kini giliran kita generasi muda
Meneruskan estafet cita-cita
Pandu Hizbul Wathan setia sedia
Menjaga kedaulatan tanah pusaka.`,
    theme: {
      gradient: 'from-indigo-700 via-purple-800 to-slate-950',
      textAccent: 'text-indigo-700',
      borderAccent: 'border-indigo-200',
      bgBadge: 'bg-indigo-50 text-indigo-800 border-indigo-200'
    }
  },
  'melangkah pasti pandu hw': {
    title: 'Melangkah Pasti Pandu HW',
    creator: 'Muhammad Dzikron',
    vocalist: 'Kak Dzikron & Gita HW',
    category: 'Lagu Motivasi',
    lyrics: `Langkahkan kakimu dengan mantap
Tatap ke depan jangan ragu menatap
Rahmat Allah menaungi setiap langkah
Selama niat kita lillahi ta'ala.

Reff:
Melangkah pasti pandu sejati
Bersama HW kita mengabdi
Kuatkan ukhuwah, satukan hati
Jayalah Hizbul Wathan di muka bumi.`,
    theme: {
      gradient: 'from-emerald-600 via-teal-700 to-blue-900',
      textAccent: 'text-emerald-700',
      borderAccent: 'border-emerald-200',
      bgBadge: 'bg-emerald-50 text-emerald-800 border-emerald-200'
    }
  }
};

export const DEFAULT_PLAYLIST_SONGS: any[] = [
  {
    id: 'playlist-1',
    section: 'playlist',
    type: 'list',
    field1: 'https://hwjateng.org/musik/sahabathw.mp3',
    field2: 'Sahabat HW',
    field3: 'Muhammad Dzikron',
    field4: 'Kak Dzikron & Sahabat Pandu',
    field5: `Bersama kita melangkah
Menembus cakrawala asa
Sahabat sejati Pandu HW
Satu hati dalam ukhuwah persaudaraan

Di bumi perkemahan kita bersua
Belajar mandiri, disiplin, berjiwa ksatria
Setia pandu, suci pikiran perkataan perbuatan
Hizbul Wathan, sahabat setia sepanjang zaman!`,
    judul: 'Sahabat HW',
    title: 'Sahabat HW',
    pencipta: 'Muhammad Dzikron',
    creator: 'Muhammad Dzikron',
    vokalis: 'Kak Dzikron & Sahabat Pandu',
    vocalist: 'Kak Dzikron & Sahabat Pandu',
    kategori: 'Lagu Pandu & Motivasi',
    category: 'Lagu Pandu & Motivasi',
    lirik: `Bersama kita melangkah
Menembus cakrawala asa
Sahabat sejati Pandu HW
Satu hati dalam ukhuwah persaudaraan

Di bumi perkemahan kita bersua
Belajar mandiri, disiplin, berjiwa ksatria
Setia pandu, suci pikiran perkataan perbuatan
Hizbul Wathan, sahabat setia sepanjang zaman!`,
    lyrics: `Bersama kita melangkah
Menembus cakrawala asa
Sahabat sejati Pandu HW
Satu hati dalam ukhuwah persaudaraan

Di bumi perkemahan kita bersua
Belajar mandiri, disiplin, berjiwa ksatria
Setia pandu, suci pikiran perkataan perbuatan
Hizbul Wathan, sahabat setia sepanjang zaman!`,
    audioUrl: 'https://hwjateng.org/musik/sahabathw.mp3',
    audiourl: 'https://hwjateng.org/musik/sahabathw.mp3'
  },
  {
    id: 'playlist-2',
    section: 'playlist',
    type: 'list',
    field1: 'https://hwjateng.org/musik/hwuntukindonesia.mp3',
    field2: 'HW Untuk Indonesia',
    field3: 'Muhammad Dzikron',
    field4: 'Kak Dzikron',
    field5: `Dari ufuk timur cahaya menyapa
Pandu Hizbul Wathan bangkit berdaya
Menjaga tanah air nusantara tercinta
Dengan akhlak mulia dan karya nyata.

Reff:
Hizbul Wathan untuk Indonesia
Semangat membara tak pernah reda
Berbakti tulus lillahi ta'ala
Menuju kejayaan nusa dan bangsa.`,
    judul: 'HW Untuk Indonesia',
    title: 'HW Untuk Indonesia',
    pencipta: 'Muhammad Dzikron',
    creator: 'Muhammad Dzikron',
    vokalis: 'Kak Dzikron',
    vocalist: 'Kak Dzikron',
    kategori: 'Lagu Pandu & Semangat',
    category: 'Lagu Pandu & Semangat',
    lirik: `Dari ufuk timur cahaya menyapa
Pandu Hizbul Wathan bangkit berdaya
Menjaga tanah air nusantara tercinta
Dengan akhlak mulia dan karya nyata.

Reff:
Hizbul Wathan untuk Indonesia
Semangat membara tak pernah reda
Berbakti tulus lillahi ta'ala
Menuju kejayaan nusa dan bangsa.`,
    lyrics: `Dari ufuk timur cahaya menyapa
Pandu Hizbul Wathan bangkit berdaya
Menjaga tanah air nusantara tercinta
Dengan akhlak mulia dan karya nyata.

Reff:
Hizbul Wathan untuk Indonesia
Semangat membara tak pernah reda
Berbakti tulus lillahi ta'ala
Menuju kejayaan nusa dan bangsa.`,
    audioUrl: 'https://hwjateng.org/musik/hwuntukindonesia.mp3',
    audiourl: 'https://hwjateng.org/musik/hwuntukindonesia.mp3'
  },
  {
    id: 'playlist-3',
    section: 'playlist',
    type: 'list',
    field1: 'https://hwjateng.org/musik/marshw.mp3',
    field2: 'Mars HW',
    field3: 'H. Siradj Dahlan',
    field4: 'Paduan Suara HW',
    field5: `Hizbul Wathan yang bersemangat
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
    judul: 'Mars HW',
    title: 'Mars HW',
    pencipta: 'H. Siradj Dahlan',
    creator: 'H. Siradj Dahlan',
    vokalis: 'Paduan Suara HW',
    vocalist: 'Paduan Suara HW',
    kategori: 'Mars & Lagu Wajib',
    category: 'Mars & Lagu Wajib',
    lirik: `Hizbul Wathan yang bersemangat
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
    audioUrl: 'https://hwjateng.org/musik/marshw.mp3',
    audiourl: 'https://hwjateng.org/musik/marshw.mp3'
  },
  {
    id: 'playlist-4',
    section: 'playlist',
    type: 'list',
    field1: 'https://hwjateng.org/musik/hymnehw.mp3',
    field2: 'Hymne HW Panduku',
    field3: 'H.M. Affandi',
    field4: 'Paduan Suara HW',
    field5: `Di bawah panji suci mulia
Hizbul Wathan melangkah pasti
Mengabdi pada nusa dan bangsa
Ikhlas berbakti tulus mengabdi

Pancasila dasar negara
Al-Qur'an dan Sunnah pegangan kita
Maju terus pandu mulia
Jayalah Hizbul Wathan selamanya!`,
    judul: 'Hymne HW Panduku',
    title: 'Hymne HW Panduku',
    pencipta: 'H.M. Affandi',
    creator: 'H.M. Affandi',
    vokalis: 'Paduan Suara HW',
    vocalist: 'Paduan Suara HW',
    kategori: 'Hymne',
    category: 'Hymne',
    lirik: `Di bawah panji suci mulia
Hizbul Wathan melangkah pasti
Mengabdi pada nusa dan bangsa
Ikhlas berbakti tulus mengabdi

Pancasila dasar negara
Al-Qur'an dan Sunnah pegangan kita
Maju terus pandu mulia
Jayalah Hizbul Wathan selamanya!`,
    lyrics: `Di bawah panji suci mulia
Hizbul Wathan melangkah pasti
Mengabdi pada nusa dan bangsa
Ikhlas berbakti tulus mengabdi

Pancasila dasar negara
Al-Qur'an dan Sunnah pegangan kita
Maju terus pandu mulia
Jayalah Hizbul Wathan selamanya!`,
    audioUrl: 'https://hwjateng.org/musik/hymnehw.mp3',
    audiourl: 'https://hwjateng.org/musik/hymnehw.mp3'
  },
  {
    id: 'playlist-5',
    section: 'playlist',
    type: 'list',
    field1: 'https://hwjateng.org/musik/mahrojanpenghela.mp3',
    field2: 'Mahrojan Penghela',
    field3: 'Muhammad Dzikron',
    field4: 'Tim Paduan Suara Penghela',
    field5: `Berkumpul bersama para penghela
Di arena mahrojan penuh cita
Asah ketangkasan, pererat ukhuwah
Menjadi pandu yang tanggap dan tabah.

Reff:
Penghela HW pelopor perjuangan
Mandiri, terampil penuh keikhlasan
Siap memimpin masa depan cemerlang
Bagi persyarikatan dan ibu pertiwi.`,
    judul: 'Mahrojan Penghela',
    title: 'Mahrojan Penghela',
    pencipta: 'Muhammad Dzikron',
    creator: 'Muhammad Dzikron',
    vokalis: 'Tim Paduan Suara Penghela',
    vocalist: 'Tim Paduan Suara Penghela',
    kategori: 'Lagu Pandu & Semangat',
    category: 'Lagu Pandu & Semangat',
    lirik: `Berkumpul bersama para penghela
Di arena mahrojan penuh cita
Asah ketangkasan, pererat ukhuwah
Menjadi pandu yang tanggap dan tabah.

Reff:
Penghela HW pelopor perjuangan
Mandiri, terampil penuh keikhlasan
Siap memimpin masa depan cemerlang
Bagi persyarikatan dan ibu pertiwi.`,
    lyrics: `Berkumpul bersama para penghela
Di arena mahrojan penuh cita
Asah ketangkasan, pererat ukhuwah
Menjadi pandu yang tanggap dan tabah.

Reff:
Penghela HW pelopor perjuangan
Mandiri, terampil penuh keikhlasan
Siap memimpin masa depan cemerlang
Bagi persyarikatan dan ibu pertiwi.`,
    audioUrl: 'https://hwjateng.org/musik/mahrojanpenghela.mp3',
    audiourl: 'https://hwjateng.org/musik/mahrojanpenghela.mp3'
  },
  {
    id: 'playlist-6',
    section: 'playlist',
    type: 'list',
    field1: 'https://hwjateng.com/audio/sang_surya.mp3',
    field2: 'Sang Surya (Mars Muhammadiyah)',
    field3: 'Djarnawi Hadikusuma',
    field4: 'Paduan Suara Muhammadiyah',
    field5: `Sang Surya telah bersinar
Syahadat dua melingkar
Warna yang hijau berseri
Membuat rela hati.

Ya Allah Tuhan Rabbiku
Muhammad Petunjukku
Islam Agamaku
Muhammadiyah Gerakanku.

Di timur fajar merekah
Umat Islam bangunlah
Bina persatuan padu
Menghadap musuh seteru.`,
    judul: 'Sang Surya (Mars Muhammadiyah)',
    title: 'Sang Surya (Mars Muhammadiyah)',
    pencipta: 'Djarnawi Hadikusuma',
    creator: 'Djarnawi Hadikusuma',
    vokalis: 'Paduan Suara Muhammadiyah',
    vocalist: 'Paduan Suara Muhammadiyah',
    kategori: 'Mars & Lagu Wajib',
    category: 'Mars & Lagu Wajib',
    lirik: `Sang Surya telah bersinar
Syahadat dua melingkar
Warna yang hijau berseri
Membuat rela hati.

Ya Allah Tuhan Rabbiku
Muhammad Petunjukku
Islam Agamaku
Muhammadiyah Gerakanku.

Di timur fajar merekah
Umat Islam bangunlah
Bina persatuan padu
Menghadap musuh seteru.`,
    lyrics: `Sang Surya telah bersinar
Syahadat dua melingkar
Warna yang hijau berseri
Membuat rela hati.

Ya Allah Tuhan Rabbiku
Muhammad Petunjukku
Islam Agamaku
Muhammadiyah Gerakanku.

Di timur fajar merekah
Umat Islam bangunlah
Bina persatuan padu
Menghadap musuh seteru.`,
    audioUrl: 'https://hwjateng.com/audio/sang_surya.mp3',
    audiourl: 'https://hwjateng.com/audio/sang_surya.mp3'
  },
  {
    id: 'playlist-7',
    section: 'playlist',
    type: 'list',
    field1: 'https://hwjateng.org/musik/marsaisyiyah.mp3',
    field2: 'Mars Aisyiyah',
    field3: 'Ny. Hj. Siti Badilah Zuber',
    field4: 'Paduan Suara Aisyiyah',
    field5: `Wahai warga Aisyiyah sejati
Sadarlah akan panggilan suci
Membimbing putri-putri pertiwi
Menuju ridha Ilahi Rabbi.

Reff:
Tegakkan amar ma'ruf nahi munkar
Bercahaya panji Islam nan agung
Beramal ikhlas sepanjang hayat
Bahagia dunia dan akhirat!`,
    judul: 'Mars Aisyiyah',
    title: 'Mars Aisyiyah',
    pencipta: 'Ny. Hj. Siti Badilah Zuber',
    creator: 'Ny. Hj. Siti Badilah Zuber',
    vokalis: 'Paduan Suara Aisyiyah',
    vocalist: 'Paduan Suara Aisyiyah',
    kategori: 'Mars & Lagu Wajib',
    category: 'Mars & Lagu Wajib',
    lirik: `Wahai warga Aisyiyah sejati
Sadarlah akan panggilan suci
Membimbing putri-putri pertiwi
Menuju ridha Ilahi Rabbi.

Reff:
Tegakkan amar ma'ruf nahi munkar
Bercahaya panji Islam nan agung
Beramal ikhlas sepanjang hayat
Bahagia dunia dan akhirat!`,
    lyrics: `Wahai warga Aisyiyah sejati
Sadarlah akan panggilan suci
Membimbing putri-putri pertiwi
Menuju ridha Ilahi Rabbi.

Reff:
Tegakkan amar ma'ruf nahi munkar
Bercahaya panji Islam nan agung
Beramal ikhlas sepanjang hayat
Bahagia dunia dan akhirat!`,
    audioUrl: 'https://hwjateng.org/musik/marsaisyiyah.mp3',
    audiourl: 'https://hwjateng.org/musik/marsaisyiyah.mp3'
  },
  {
    id: 'playlist-8',
    section: 'playlist',
    type: 'list',
    field1: 'https://hwjateng.org/musik/marspanduharapan.mp3',
    field2: 'Mars Pandu Harapan',
    field3: 'H. Siradj Dahlan',
    field4: 'Paduan Suara HW',
    field5: `Harapan bangsa di pundak kita
Pandu Hizbul Wathan berjiwa baja
Menempuh jalan penuh tantangan
Dengan iman serta ketakwaan.

Reff:
Maju pandu harapan masa depan
Tegakkan kebenaran dan keadilan
Di bawah naungan panji Islam
Damai sentosa sepanjang zaman.`,
    judul: 'Mars Pandu Harapan',
    title: 'Mars Pandu Harapan',
    pencipta: 'H. Siradj Dahlan',
    creator: 'H. Siradj Dahlan',
    vokalis: 'Paduan Suara HW',
    vocalist: 'Paduan Suara HW',
    kategori: 'Mars & Lagu Wajib',
    category: 'Mars & Lagu Wajib',
    lirik: `Harapan bangsa di pundak kita
Pandu Hizbul Wathan berjiwa baja
Menempuh jalan penuh tantangan
Dengan iman serta ketakwaan.

Reff:
Maju pandu harapan masa depan
Tegakkan kebenaran dan keadilan
Di bawah naungan panji Islam
Damai sentosa sepanjang zaman.`,
    lyrics: `Harapan bangsa di pundak kita
Pandu Hizbul Wathan berjiwa baja
Menempuh jalan penuh tantangan
Dengan iman serta ketakwaan.

Reff:
Maju pandu harapan masa depan
Tegakkan kebenaran dan keadilan
Di bawah naungan panji Islam
Damai sentosa sepanjang zaman.`,
    audioUrl: 'https://hwjateng.org/musik/marspanduharapan.mp3',
    audiourl: 'https://hwjateng.org/musik/marspanduharapan.mp3'
  },
  {
    id: 'playlist-9',
    section: 'playlist',
    type: 'list',
    field1: 'https://hwjateng.org/musik/marswathoni.mp3',
    field2: 'Mars Wathoni',
    field3: 'H. M. Affandi',
    field4: 'Paduan Suara HW',
    field5: `Cinta tanah air terpateri di dada
Hizbul Wathan pandu setia
Rela berkorban jiwa dan raga
Membela nusa serta agama.

Reff:
Wahai wathoni pandu perkasa
Kibarkan panji kejayaan bangsa
Ikhlas berbakti tanpa pamrih
Hati suci langkah bersih.`,
    judul: 'Mars Wathoni',
    title: 'Mars Wathoni',
    pencipta: 'H. M. Affandi',
    creator: 'H. M. Affandi',
    vokalis: 'Paduan Suara HW',
    vocalist: 'Paduan Suara HW',
    kategori: 'Mars & Lagu Wajib',
    category: 'Mars & Lagu Wajib',
    lirik: `Cinta tanah air terpateri di dada
Hizbul Wathan pandu setia
Rela berkorban jiwa dan raga
Membela nusa serta agama.

Reff:
Wahai wathoni pandu perkasa
Kibarkan panji kejayaan bangsa
Ikhlas berbakti tanpa pamrih
Hati suci langkah bersih.`,
    lyrics: `Cinta tanah air terpateri di dada
Hizbul Wathan pandu setia
Rela berkorban jiwa dan raga
Membela nusa serta agama.

Reff:
Wahai wathoni pandu perkasa
Kibarkan panji kejayaan bangsa
Ikhlas berbakti tanpa pamrih
Hati suci langkah bersih.`,
    audioUrl: 'https://hwjateng.org/musik/marswathoni.mp3',
    audiourl: 'https://hwjateng.org/musik/marswathoni.mp3'
  },
  {
    id: 'playlist-10',
    section: 'playlist',
    type: 'list',
    field1: 'https://hwjateng.org/musik/marskebangkitanhw.mp3',
    field2: 'Mars Kebangkitan HW',
    field3: 'H. M. Affandi',
    field4: 'Paduan Suara HW',
    field5: `Fajar kebangkitan telah tiba
Pandu Hizbul Wathan melangkah nyata
Mengukir sejarah generasi gemilang
Di persada nusantara tercinta.

Reff:
Bangkitlah pandu pelopor umat
Fastabiqul khairat penuntun niat
Menjunjung martabat persyarikatan
Menebar rahmat bagi sekalian alam.`,
    judul: 'Mars Kebangkitan HW',
    title: 'Mars Kebangkitan HW',
    pencipta: 'H. M. Affandi',
    creator: 'H. M. Affandi',
    vokalis: 'Paduan Suara HW',
    vocalist: 'Paduan Suara HW',
    kategori: 'Mars & Lagu Wajib',
    category: 'Mars & Lagu Wajib',
    lirik: `Fajar kebangkitan telah tiba
Pandu Hizbul Wathan melangkah nyata
Mengukir sejarah generasi gemilang
Di persada nusantara tercinta.

Reff:
Bangkitlah pandu pelopor umat
Fastabiqul khairat penuntun niat
Menjunjung martabat persyarikatan
Menebar rahmat bagi sekalian alam.`,
    lyrics: `Fajar kebangkitan telah tiba
Pandu Hizbul Wathan melangkah nyata
Mengukir sejarah generasi gemilang
Di persada nusantara tercinta.

Reff:
Bangkitlah pandu pelopor umat
Fastabiqul khairat penuntun niat
Menjunjung martabat persyarikatan
Menebar rahmat bagi sekalian alam.`,
    audioUrl: 'https://hwjateng.org/musik/marskebangkitanhw.mp3',
    audiourl: 'https://hwjateng.org/musik/marskebangkitanhw.mp3'
  },
  {
    id: 'playlist-11',
    section: 'playlist',
    type: 'list',
    field1: 'https://hwjateng.org/musik/marsbangkithw.mp3',
    field2: 'Mars Bangkit HW',
    field3: 'Kwarpus HW',
    field4: 'Paduan Suara HW',
    field5: `Seruan suci bergema membahana
Memanggil pandu ke medan karya
Siapkan diri lahir dan batin
Menghadapi zaman serba yakin.

Reff:
Bangkit pandu perkasa
Teguhkan cita-cita mulia
Hizbul Wathan siap sedia
Membela Islam dan Indonesia!`,
    judul: 'Mars Bangkit HW',
    title: 'Mars Bangkit HW',
    pencipta: 'Kwarpus HW',
    creator: 'Kwarpus HW',
    vokalis: 'Paduan Suara HW',
    vocalist: 'Paduan Suara HW',
    kategori: 'Mars & Lagu Wajib',
    category: 'Mars & Lagu Wajib',
    lirik: `Seruan suci bergema membahana
Memanggil pandu ke medan karya
Siapkan diri lahir dan batin
Menghadapi zaman serba yakin.

Reff:
Bangkit pandu perkasa
Teguhkan cita-cita mulia
Hizbul Wathan siap sedia
Membela Islam dan Indonesia!`,
    lyrics: `Seruan suci bergema membahana
Memanggil pandu ke medan karya
Siapkan diri lahir dan batin
Menghadapi zaman serba yakin.

Reff:
Bangkit pandu perkasa
Teguhkan cita-cita mulia
Hizbul Wathan siap sedia
Membela Islam dan Indonesia!`,
    audioUrl: 'https://hwjateng.org/musik/marsbangkithw.mp3',
    audiourl: 'https://hwjateng.org/musik/marsbangkithw.mp3'
  },
  {
    id: 'playlist-12',
    section: 'playlist',
    type: 'list',
    field1: 'https://hwjateng.org/musik/panduhwpaud.mp3',
    field2: 'Pandu HW PAUD Berdendang',
    field3: 'Muhammad Dzikron',
    field4: 'Kak Dzikron & Pandu Cilik',
    field5: `Tersenyum tertawa riang gembira
Pandu HW kecil ceria
Bermain belajar bersama kawan
Mengenal Tuhan Maha Penyayang.

Reff:
Dendang gembira pandu athfal
Cinta ayah bunda dan kawan
Rajin ibadah berakhlak mulia
Kelak jadi generasi berguna.`,
    judul: 'Pandu HW PAUD Berdendang',
    title: 'Pandu HW PAUD Berdendang',
    pencipta: 'Muhammad Dzikron',
    creator: 'Muhammad Dzikron',
    vokalis: 'Kak Dzikron & Pandu Cilik',
    vocalist: 'Kak Dzikron & Pandu Cilik',
    kategori: 'Lagu Pandu Athfal',
    category: 'Lagu Pandu Athfal',
    lirik: `Tersenyum tertawa riang gembira
Pandu HW kecil ceria
Bermain belajar bersama kawan
Mengenal Tuhan Maha Penyayang.

Reff:
Dendang gembira pandu athfal
Cinta ayah bunda dan kawan
Rajin ibadah berakhlak mulia
Kelak jadi generasi berguna.`,
    lyrics: `Tersenyum tertawa riang gembira
Pandu HW kecil ceria
Bermain belajar bersama kawan
Mengenal Tuhan Maha Penyayang.

Reff:
Dendang gembira pandu athfal
Cinta ayah bunda dan kawan
Rajin ibadah berakhlak mulia
Kelak jadi generasi berguna.`,
    audioUrl: 'https://hwjateng.org/musik/panduhwpaud.mp3',
    audiourl: 'https://hwjateng.org/musik/panduhwpaud.mp3'
  },
  {
    id: 'playlist-13',
    section: 'playlist',
    type: 'list',
    field1: 'https://hwjateng.org/musik/takpernahsusah.mp3',
    field2: 'Pandu HW Tak Pernah Susah',
    field3: 'H. Siradj Dahlan',
    field4: 'Paduan Suara Pengenal HW',
    field5: `Pandu HW tak pernah susah
Selalu riang serta gembira
Meski berjalan di terik surya
Tetap senyum penuh suka.

Reff:
Susah apa guna bersusah
Pandu HW suka bekerja
Bantu sesama penuh suka cita
Hidup bahagia sejahtera.`,
    judul: 'Pandu HW Tak Pernah Susah',
    title: 'Pandu HW Tak Pernah Susah',
    pencipta: 'H. Siradj Dahlan',
    creator: 'H. Siradj Dahlan',
    vokalis: 'Paduan Suara Pengenal HW',
    vocalist: 'Paduan Suara Pengenal HW',
    kategori: 'Lagu Riang Pandu',
    category: 'Lagu Riang Pandu',
    lirik: `Pandu HW tak pernah susah
Selalu riang serta gembira
Meski berjalan di terik surya
Tetap senyum penuh suka.

Reff:
Susah apa guna bersusah
Pandu HW suka bekerja
Bantu sesama penuh suka cita
Hidup bahagia sejahtera.`,
    lyrics: `Pandu HW tak pernah susah
Selalu riang serta gembira
Meski berjalan di terik surya
Tetap senyum penuh suka.

Reff:
Susah apa guna bersusah
Pandu HW suka bekerja
Bantu sesama penuh suka cita
Hidup bahagia sejahtera.`,
    audioUrl: 'https://hwjateng.org/musik/takpernahsusah.mp3',
    audiourl: 'https://hwjateng.org/musik/takpernahsusah.mp3'
  },
  {
    id: 'playlist-14',
    section: 'playlist',
    type: 'list',
    field1: 'https://hwjateng.org/musik/hwdimanamana.mp3',
    field2: 'HW Ada di Mana-mana',
    field3: 'Pandu HW Jateng',
    field4: 'Tim Paduan Suara HW',
    field5: `Dari kota hingga ke desa
Pandu HW ada di mana-mana
Menolong siapa yang butuh bantuan
Dengan tulus dan keikhlasan.

Reff:
Di mana-mana pandu berada
Menabur benih kebaikan sesama
Itulah semboyan pandu mulia
Sedikit bicara banyak bekerja.`,
    judul: 'HW Ada di Mana-mana',
    title: 'HW Ada di Mana-mana',
    pencipta: 'Pandu HW Jateng',
    creator: 'Pandu HW Jateng',
    vokalis: 'Tim Paduan Suara HW',
    vocalist: 'Tim Paduan Suara HW',
    kategori: 'Lagu Pandu & Semangat',
    category: 'Lagu Pandu & Semangat',
    lirik: `Dari kota hingga ke desa
Pandu HW ada di mana-mana
Menolong siapa yang butuh bantuan
Dengan tulus dan keikhlasan.

Reff:
Di mana-mana pandu berada
Menabur benih kebaikan sesama
Itulah semboyan pandu mulia
Sedikit bicara banyak bekerja.`,
    lyrics: `Dari kota hingga ke desa
Pandu HW ada di mana-mana
Menolong siapa yang butuh bantuan
Dengan tulus dan keikhlasan.

Reff:
Di mana-mana pandu berada
Menabur benih kebaikan sesama
Itulah semboyan pandu mulia
Sedikit bicara banyak bekerja.`,
    audioUrl: 'https://hwjateng.org/musik/hwdimanamana.mp3',
    audiourl: 'https://hwjateng.org/musik/hwdimanamana.mp3'
  },
  {
    id: 'playlist-15',
    section: 'playlist',
    type: 'list',
    field1: 'https://hwjateng.org/musik/marsathfal.mp3',
    field2: 'Mars Athfal HW',
    field3: 'Tim Kwarpus HW',
    field4: 'Koor Rumpun Athfal',
    field5: `Kami rumpun athfal pandu ceria
Taat pada ayah bunda
Sayang kawan suka menolong
Tak pernah cemberut atau sombong.

Reff:
Athfal HW pandu cilik
Langkah riang hati asyik
Belajar agama sejak dini
Untuk masa depan negeri.`,
    judul: 'Mars Athfal HW',
    title: 'Mars Athfal HW',
    pencipta: 'Tim Kwarpus HW',
    creator: 'Tim Kwarpus HW',
    vokalis: 'Koor Rumpun Athfal',
    vocalist: 'Koor Rumpun Athfal',
    kategori: 'Lagu Pandu Athfal',
    category: 'Lagu Pandu Athfal',
    lirik: `Kami rumpun athfal pandu ceria
Taat pada ayah bunda
Sayang kawan suka menolong
Tak pernah cemberut atau sombong.

Reff:
Athfal HW pandu cilik
Langkah riang hati asyik
Belajar agama sejak dini
Untuk masa depan negeri.`,
    lyrics: `Kami rumpun athfal pandu ceria
Taat pada ayah bunda
Sayang kawan suka menolong
Tak pernah cemberut atau sombong.

Reff:
Athfal HW pandu cilik
Langkah riang hati asyik
Belajar agama sejak dini
Untuk masa depan negeri.`,
    audioUrl: 'https://hwjateng.org/musik/marsathfal.mp3',
    audiourl: 'https://hwjateng.org/musik/marsathfal.mp3'
  },
  {
    id: 'playlist-16',
    section: 'playlist',
    type: 'list',
    field1: 'https://hwjateng.org/musik/lagupengenal.mp3',
    field2: 'Lagu Pengenal HW',
    field3: 'Tim Pembina HW',
    field4: 'Regu Pengenal HW',
    field5: `Pasukan pengenal siap siaga
Belajar mandiri di alam terbuka
Tali-temali kompas petunjuk arah
Menempa diri pantang menyerah.

Reff:
Pengenal HW tangguh dan cekatan
Bekerja sama dalam ikatan
Menjaga janji dan undang-undang
Hingga fajar kejayaan datang.`,
    judul: 'Lagu Pengenal HW',
    title: 'Lagu Pengenal HW',
    pencipta: 'Tim Pembina HW',
    creator: 'Tim Pembina HW',
    vokalis: 'Regu Pengenal HW',
    vocalist: 'Regu Pengenal HW',
    kategori: 'Lagu Pandu Pengenal',
    category: 'Lagu Pandu Pengenal',
    lirik: `Pasukan pengenal siap siaga
Belajar mandiri di alam terbuka
Tali-temali kompas petunjuk arah
Menempa diri pantang menyerah.

Reff:
Pengenal HW tangguh dan cekatan
Bekerja sama dalam ikatan
Menjaga janji dan undang-undang
Hingga fajar kejayaan datang.`,
    lyrics: `Pasukan pengenal siap siaga
Belajar mandiri di alam terbuka
Tali-temali kompas petunjuk arah
Menempa diri pantang menyerah.

Reff:
Pengenal HW tangguh dan cekatan
Bekerja sama dalam ikatan
Menjaga janji dan undang-undang
Hingga fajar kejayaan datang.`,
    audioUrl: 'https://hwjateng.org/musik/lagupengenal.mp3',
    audiourl: 'https://hwjateng.org/musik/lagupengenal.mp3'
  },
  {
    id: 'playlist-17',
    section: 'playlist',
    type: 'list',
    field1: 'https://hwjateng.org/musik/lagupenghela.mp3',
    field2: 'Lagu Penghela HW',
    field3: 'Tim Pelatih HW',
    field4: 'Kerabat Penghela HW',
    field5: `Kerabat penghela langkah tegap perkasa
Kader pelopor generasi muda
Mengkaji ilmu asah ketrampilan
Menyongsong era pembangunan.

Reff:
Penghela HW siap memimpin
Bermusyawarah tulus dan yakin
Bakti nyata untuk umat tercinta
Menuju ridha Yang Maha Esa.`,
    judul: 'Lagu Penghela HW',
    title: 'Lagu Penghela HW',
    pencipta: 'Tim Pelatih HW',
    creator: 'Tim Pelatih HW',
    vokalis: 'Kerabat Penghela HW',
    vocalist: 'Kerabat Penghela HW',
    kategori: 'Lagu Pandu Penghela',
    category: 'Lagu Pandu Penghela',
    lirik: `Kerabat penghela langkah tegap perkasa
Kader pelopor generasi muda
Mengkaji ilmu asah ketrampilan
Menyongsong era pembangunan.

Reff:
Penghela HW siap memimpin
Bermusyawarah tulus dan yakin
Bakti nyata untuk umat tercinta
Menuju ridha Yang Maha Esa.`,
    lyrics: `Kerabat penghela langkah tegap perkasa
Kader pelopor generasi muda
Mengkaji ilmu asah ketrampilan
Menyongsong era pembangunan.

Reff:
Penghela HW siap memimpin
Bermusyawarah tulus dan yakin
Bakti nyata untuk umat tercinta
Menuju ridha Yang Maha Esa.`,
    audioUrl: 'https://hwjateng.org/musik/lagupenghela.mp3',
    audiourl: 'https://hwjateng.org/musik/lagupenghela.mp3'
  },
  {
    id: 'playlist-18',
    section: 'playlist',
    type: 'list',
    field1: 'https://hwjateng.org/musik/lagupenuntun.mp3',
    field2: 'Lagu Penuntun HW',
    field3: 'Kafilah Penuntun HW',
    field4: 'Kafilah Penuntun',
    field5: `Kafilah penuntun abdi pertiwi
Mengemban amanah suci
Terjun membina di tengah umat
Menebarkan manfaat serta rahmat.

Reff:
Penuntun HW pelita harapan
Memberi contoh dan teladan
Istiqomah di garis perjuangan
Muhammadiyah dalam gerak langkah.`,
    judul: 'Lagu Penuntun HW',
    title: 'Lagu Penuntun HW',
    pencipta: 'Kafilah Penuntun HW',
    creator: 'Kafilah Penuntun HW',
    vokalis: 'Kafilah Penuntun',
    vocalist: 'Kafilah Penuntun',
    kategori: 'Lagu Pandu Penuntun',
    category: 'Lagu Pandu Penuntun',
    lirik: `Kafilah penuntun abdi pertiwi
Mengemban amanah suci
Terjun membina di tengah umat
Menebarkan manfaat serta rahmat.

Reff:
Penuntun HW pelita harapan
Memberi contoh dan teladan
Istiqomah di garis perjuangan
Muhammadiyah dalam gerak langkah.`,
    lyrics: `Kafilah penuntun abdi pertiwi
Mengemban amanah suci
Terjun membina di tengah umat
Menebarkan manfaat serta rahmat.

Reff:
Penuntun HW pelita harapan
Memberi contoh dan teladan
Istiqomah di garis perjuangan
Muhammadiyah dalam gerak langkah.`,
    audioUrl: 'https://hwjateng.org/musik/lagupenuntun.mp3',
    audiourl: 'https://hwjateng.org/musik/lagupenuntun.mp3'
  },
  {
    id: 'playlist-19',
    section: 'playlist',
    type: 'list',
    field1: 'https://hwjateng.org/musik/apiunggun.mp3',
    field2: 'Api Unggun HW (Nyala Api Semangat)',
    field3: 'Muhammad Dzikron',
    field4: 'Tim Perkemahan HW',
    field5: `Malam telah larut hening gulita
Nyala api unggun membakar dada
Menghangatkan dinginnya suasana
Mempererat tali persaudaraan kita.

Reff:
Kobarkan api semangat pandu
Satu tekad satu tuju
Jangan biarkan padam apimu
Hingga tercapai cita luhurmu.`,
    judul: 'Api Unggun HW (Nyala Api Semangat)',
    title: 'Api Unggun HW (Nyala Api Semangat)',
    pencipta: 'Muhammad Dzikron',
    creator: 'Muhammad Dzikron',
    vokalis: 'Tim Perkemahan HW',
    vocalist: 'Tim Perkemahan HW',
    kategori: 'Lagu Api Unggun',
    category: 'Lagu Api Unggun',
    lirik: `Malam telah larut hening gulita
Nyala api unggun membakar dada
Menghangatkan dinginnya suasana
Mempererat tali persaudaraan kita.

Reff:
Kobarkan api semangat pandu
Satu tekad satu tuju
Jangan biarkan padam apimu
Hingga tercapai cita luhurmu.`,
    lyrics: `Malam telah larut hening gulita
Nyala api unggun membakar dada
Menghangatkan dinginnya suasana
Mempererat tali persaudaraan kita.

Reff:
Kobarkan api semangat pandu
Satu tekad satu tuju
Jangan biarkan padam apimu
Hingga tercapai cita luhurmu.`,
    audioUrl: 'https://hwjateng.org/musik/apiunggun.mp3',
    audiourl: 'https://hwjateng.org/musik/apiunggun.mp3'
  },
  {
    id: 'playlist-20',
    section: 'playlist',
    type: 'list',
    field1: 'https://hwjateng.org/musik/tadabburalam.mp3',
    field2: 'Tadabbur Alam HW',
    field3: 'Muhammad Dzikron',
    field4: 'Tim Pandu Petualang',
    field5: `Gunung menghijau lembah membentang
Laut membiru langit nan lapang
Semua ciptaan Tuhan Pengasih
Tanda keagungan nan suci bersih.

Reff:
Tadabbur alam pandu sejati
Mensyukuri nikmat Ilahi Rabbi
Menjaga bumi lestarikan alam
Untuk kesejahteraan semesta alam.`,
    judul: 'Tadabbur Alam HW',
    title: 'Tadabbur Alam HW',
    pencipta: 'Muhammad Dzikron',
    creator: 'Muhammad Dzikron',
    vokalis: 'Tim Pandu Petualang',
    vocalist: 'Tim Pandu Petualang',
    kategori: 'Lagu Pandu & Alam',
    category: 'Lagu Pandu & Alam',
    lirik: `Gunung menghijau lembah membentang
Laut membiru langit nan lapang
Semua ciptaan Tuhan Pengasih
Tanda keagungan nan suci bersih.

Reff:
Tadabbur alam pandu sejati
Mensyukuri nikmat Ilahi Rabbi
Menjaga bumi lestarikan alam
Untuk kesejahteraan semesta alam.`,
    lyrics: `Gunung menghijau lembah membentang
Laut membiru langit nan lapang
Semua ciptaan Tuhan Pengasih
Tanda keagungan nan suci bersih.

Reff:
Tadabbur alam pandu sejati
Mensyukuri nikmat Ilahi Rabbi
Menjaga bumi lestarikan alam
Untuk kesejahteraan semesta alam.`,
    audioUrl: 'https://hwjateng.org/musik/tadabburalam.mp3',
    audiourl: 'https://hwjateng.org/musik/tadabburalam.mp3'
  },
  {
    id: 'playlist-21',
    section: 'playlist',
    type: 'list',
    field1: 'https://hwjateng.org/musik/derappandu.mp3',
    field2: 'Derap Pandu Muhammadiyah',
    field3: 'H. M. Affandi',
    field4: 'Paduan Suara HW',
    field5: `Derap langkah teratur seirama
Menapaki jejak para ulama
Pandu Hizbul Wathan berbaris rapi
Menjaga kesucian janji suci.

Reff:
Derap pandu Muhammadiyah
Ikhlas berjuang lillahi ta'ala
Menebar damai di bumi nusantara
Islam berkemajuan tujuan kita.`,
    judul: 'Derap Pandu Muhammadiyah',
    title: 'Derap Pandu Muhammadiyah',
    pencipta: 'H. M. Affandi',
    creator: 'H. M. Affandi',
    vokalis: 'Paduan Suara HW',
    vocalist: 'Paduan Suara HW',
    kategori: 'Lagu Perjuangan',
    category: 'Lagu Perjuangan',
    lirik: `Derap langkah teratur seirama
Menapaki jejak para ulama
Pandu Hizbul Wathan berbaris rapi
Menjaga kesucian janji suci.

Reff:
Derap pandu Muhammadiyah
Ikhlas berjuang lillahi ta'ala
Menebar damai di bumi nusantara
Islam berkemajuan tujuan kita.`,
    lyrics: `Derap langkah teratur seirama
Menapaki jejak para ulama
Pandu Hizbul Wathan berbaris rapi
Menjaga kesucian janji suci.

Reff:
Derap pandu Muhammadiyah
Ikhlas berjuang lillahi ta'ala
Menebar damai di bumi nusantara
Islam berkemajuan tujuan kita.`,
    audioUrl: 'https://hwjateng.org/musik/derappandu.mp3',
    audiourl: 'https://hwjateng.org/musik/derappandu.mp3'
  },
  {
    id: 'playlist-22',
    section: 'playlist',
    type: 'list',
    field1: 'https://hwjateng.org/musik/selamatdatang.mp3',
    field2: 'Selamat Datang Kakak Pembina',
    field3: 'Pandu HW',
    field4: 'Rumpun Athfal & Pengenal',
    field5: `Selamat datang kakak pembina
Di perkemahan kami yang ceria
Bimbinglah kami tunjukkan arah
Agar ilmu kami bertambah berkah.

Reff:
Terima kasih kakak pembina
Jasamu tulus tiada tara
Kami berjanji rajin berlatih
Menjadi pandu berjiwa bersih.`,
    judul: 'Selamat Datang Kakak Pembina',
    title: 'Selamat Datang Kakak Pembina',
    pencipta: 'Pandu HW',
    creator: 'Pandu HW',
    vokalis: 'Rumpun Athfal & Pengenal',
    vocalist: 'Rumpun Athfal & Pengenal',
    kategori: 'Lagu Sambutan & Gembira',
    category: 'Lagu Sambutan & Gembira',
    lirik: `Selamat datang kakak pembina
Di perkemahan kami yang ceria
Bimbinglah kami tunjukkan arah
Agar ilmu kami bertambah berkah.

Reff:
Terima kasih kakak pembina
Jasamu tulus tiada tara
Kami berjanji rajin berlatih
Menjadi pandu berjiwa bersih.`,
    lyrics: `Selamat datang kakak pembina
Di perkemahan kami yang ceria
Bimbinglah kami tunjukkan arah
Agar ilmu kami bertambah berkah.

Reff:
Terima kasih kakak pembina
Jasamu tulus tiada tara
Kami berjanji rajin berlatih
Menjadi pandu berjiwa bersih.`,
    audioUrl: 'https://hwjateng.org/musik/selamatdatang.mp3',
    audiourl: 'https://hwjateng.org/musik/selamatdatang.mp3'
  },
  {
    id: 'playlist-23',
    section: 'playlist',
    type: 'list',
    field1: 'https://hwjateng.org/musik/selamatberpisah.mp3',
    field2: 'Selamat Berpisah (Sayonara HW)',
    field3: 'Pandu HW',
    field4: 'Paduan Suara HW',
    field5: `Waktu jua memisahkan kita
Selesailah sudah masa berkemah
Kenangan indah kan slalu terjaga
Di lubuk hati yang paling dalam.

Reff:
Selamat berpisah sahabat pandu
Sampai kita berjumpa lagi
Semoga Allah melindungi kita
Dalam rahmat dan berkah Ilahi.`,
    judul: 'Selamat Berpisah (Sayonara HW)',
    title: 'Selamat Berpisah (Sayonara HW)',
    pencipta: 'Pandu HW',
    creator: 'Pandu HW',
    vokalis: 'Paduan Suara HW',
    vocalist: 'Paduan Suara HW',
    kategori: 'Lagu Perpisahan',
    category: 'Lagu Perpisahan',
    lirik: `Waktu jua memisahkan kita
Selesailah sudah masa berkemah
Kenangan indah kan slalu terjaga
Di lubuk hati yang paling dalam.

Reff:
Selamat berpisah sahabat pandu
Sampai kita berjumpa lagi
Semoga Allah melindungi kita
Dalam rahmat dan berkah Ilahi.`,
    lyrics: `Waktu jua memisahkan kita
Selesailah sudah masa berkemah
Kenangan indah kan slalu terjaga
Di lubuk hati yang paling dalam.

Reff:
Selamat berpisah sahabat pandu
Sampai kita berjumpa lagi
Semoga Allah melindungi kita
Dalam rahmat dan berkah Ilahi.`,
    audioUrl: 'https://hwjateng.org/musik/selamatberpisah.mp3',
    audiourl: 'https://hwjateng.org/musik/selamatberpisah.mp3'
  },
  {
    id: 'playlist-24',
    section: 'playlist',
    type: 'list',
    field1: 'https://hwjateng.org/musik/satunusabangsa.mp3',
    field2: 'Satu Nusa Satu Bangsa (Versi HW)',
    field3: 'L. Manik (Arr. HW)',
    field4: 'Paduan Suara HW',
    field5: `Satu nusa, satu bangsa
Satu bahasa kita
Tanah air pasti jaya
Untuk selama-lamanya.

Reff:
Indonesia pusaka
Indonesia tercinta
Nusa bangsa dan bahasa
Kita bela bersama.`,
    judul: 'Satu Nusa Satu Bangsa (Versi HW)',
    title: 'Satu Nusa Satu Bangsa (Versi HW)',
    pencipta: 'L. Manik (Arr. HW)',
    creator: 'L. Manik (Arr. HW)',
    vokalis: 'Paduan Suara HW',
    vocalist: 'Paduan Suara HW',
    kategori: 'Lagu Nasional & Kepanduan',
    category: 'Lagu Nasional & Kepanduan',
    lirik: `Satu nusa, satu bangsa
Satu bahasa kita
Tanah air pasti jaya
Untuk selama-lamanya.

Reff:
Indonesia pusaka
Indonesia tercinta
Nusa bangsa dan bahasa
Kita bela bersama.`,
    lyrics: `Satu nusa, satu bangsa
Satu bahasa kita
Tanah air pasti jaya
Untuk selama-lamanya.

Reff:
Indonesia pusaka
Indonesia tercinta
Nusa bangsa dan bahasa
Kita bela bersama.`,
    audioUrl: 'https://hwjateng.org/musik/satunusabangsa.mp3',
    audiourl: 'https://hwjateng.org/musik/satunusabangsa.mp3'
  },
  {
    id: 'playlist-25',
    section: 'playlist',
    type: 'list',
    field1: 'https://hwjateng.org/musik/syukur.mp3',
    field2: 'Syukur Pandu HW',
    field3: 'H. Mutahar (Arr. HW)',
    field4: 'Paduan Suara HW',
    field5: `Dari yakinku teguh
Hati ikhlasku penuh
Akan karunia-Mu
Tanah air pusaka Indonesia merdeka
Syukur aku sembahkan
Kehadirat-Mu Tuhan.`,
    judul: 'Syukur Pandu HW',
    title: 'Syukur Pandu HW',
    pencipta: 'H. Mutahar (Arr. HW)',
    creator: 'H. Mutahar (Arr. HW)',
    vokalis: 'Paduan Suara HW',
    vocalist: 'Paduan Suara HW',
    kategori: 'Lagu Perenungan & Syukur',
    category: 'Lagu Perenungan & Syukur',
    lirik: `Dari yakinku teguh
Hati ikhlasku penuh
Akan karunia-Mu
Tanah air pusaka Indonesia merdeka
Syukur aku sembahkan
Kehadirat-Mu Tuhan.`,
    lyrics: `Dari yakinku teguh
Hati ikhlasku penuh
Akan karunia-Mu
Tanah air pusaka Indonesia merdeka
Syukur aku sembahkan
Kehadirat-Mu Tuhan.`,
    audioUrl: 'https://hwjateng.org/musik/syukur.mp3',
    audiourl: 'https://hwjateng.org/musik/syukur.mp3'
  },
  {
    id: 'playlist-26',
    section: 'playlist',
    type: 'list',
    field1: 'https://hwjateng.org/musik/hwberkemah.mp3',
    field2: 'Hizbul Wathan Berkemah',
    field3: 'Muhammad Dzikron',
    field4: 'Tim Pasukan Pengenal',
    field5: `Tenda-tenda berdiri tegak berjejer
Di bawah teduh pohon cemara
Dapur mengepul api menyala
Pandu mandiri masak bersama.

Reff:
Indahnya suasana perkemahan
Penuh gelak tawa persaudaraan
Malam gembira siang berkarya
Itulah hari-hari pandu mulia.`,
    judul: 'Hizbul Wathan Berkemah',
    title: 'Hizbul Wathan Berkemah',
    pencipta: 'Muhammad Dzikron',
    creator: 'Muhammad Dzikron',
    vokalis: 'Tim Pasukan Pengenal',
    vocalist: 'Tim Pasukan Pengenal',
    kategori: 'Lagu Perkemahan',
    category: 'Lagu Perkemahan',
    lirik: `Tenda-tenda berdiri tegak berjejer
Di bawah teduh pohon cemara
Dapur mengepul api menyala
Pandu mandiri masak bersama.

Reff:
Indahnya suasana perkemahan
Penuh gelak tawa persaudaraan
Malam gembira siang berkarya
Itulah hari-hari pandu mulia.`,
    lyrics: `Tenda-tenda berdiri tegak berjejer
Di bawah teduh pohon cemara
Dapur mengepul api menyala
Pandu mandiri masak bersama.

Reff:
Indahnya suasana perkemahan
Penuh gelak tawa persaudaraan
Malam gembira siang berkarya
Itulah hari-hari pandu mulia.`,
    audioUrl: 'https://hwjateng.org/musik/hwberkemah.mp3',
    audiourl: 'https://hwjateng.org/musik/hwberkemah.mp3'
  },
  {
    id: 'playlist-27',
    section: 'playlist',
    type: 'list',
    field1: 'https://hwjateng.org/musik/yelyelhw.mp3',
    field2: 'Tepuk dan Yel-Yel Semangat HW',
    field3: 'Kwarwil HW Jateng',
    field4: 'Regu Pandu Tangguh',
    field5: `Tepuk satu... prok prok prok!
Tepuk dua... prok prok prok!
Siapa kita? Hizbul Wathan!
Di mana kita? Di garis depan!

Reff:
Maju... jalan pantang mundur!
Semangat membara tak pernah luntur!
Sedikit bicara banyak bekerja!
HW jaya, jaya, jaya!`,
    judul: 'Tepuk dan Yel-Yel Semangat HW',
    title: 'Tepuk dan Yel-Yel Semangat HW',
    pencipta: 'Kwarwil HW Jateng',
    creator: 'Kwarwil HW Jateng',
    vokalis: 'Regu Pandu Tangguh',
    vocalist: 'Regu Pandu Tangguh',
    kategori: 'Lagu & Yel-Yel',
    category: 'Lagu & Yel-Yel',
    lirik: `Tepuk satu... prok prok prok!
Tepuk dua... prok prok prok!
Siapa kita? Hizbul Wathan!
Di mana kita? Di garis depan!

Reff:
Maju... jalan pantang mundur!
Semangat membara tak pernah luntur!
Sedikit bicara banyak bekerja!
HW jaya, jaya, jaya!`,
    lyrics: `Tepuk satu... prok prok prok!
Tepuk dua... prok prok prok!
Siapa kita? Hizbul Wathan!
Di mana kita? Di garis depan!

Reff:
Maju... jalan pantang mundur!
Semangat membara tak pernah luntur!
Sedikit bicara banyak bekerja!
HW jaya, jaya, jaya!`,
    audioUrl: 'https://hwjateng.org/musik/yelyelhw.mp3',
    audiourl: 'https://hwjateng.org/musik/yelyelhw.mp3'
  },
  {
    id: 'playlist-28',
    section: 'playlist',
    type: 'list',
    field1: 'https://hwjateng.org/musik/janjidanundangundang.mp3',
    field2: 'Janji dan Undang-Undang HW',
    field3: 'H. M. Affandi',
    field4: 'Tim Penghela HW',
    field5: `Mengingat janji di hadapan Ilahi
Undang-undang pandu kami ditaati
Setia pada Allah dan Rasul-Nya
Taat aturan jujur bertutur kata.

Reff:
Sopan perwira menyayangi sesama
Hemat cermat suci perkataan
Pandu HW berakhlak mulia
Teladan indah di tengah masyarakat.`,
    judul: 'Janji dan Undang-Undang HW',
    title: 'Janji dan Undang-Undang HW',
    pencipta: 'H. M. Affandi',
    creator: 'H. M. Affandi',
    vokalis: 'Tim Penghela HW',
    vocalist: 'Tim Penghela HW',
    kategori: 'Lagu Pembinaan Karakter',
    category: 'Lagu Pembinaan Karakter',
    lirik: `Mengingat janji di hadapan Ilahi
Undang-undang pandu kami ditaati
Setia pada Allah dan Rasul-Nya
Taat aturan jujur bertutur kata.

Reff:
Sopan perwira menyayangi sesama
Hemat cermat suci perkataan
Pandu HW berakhlak mulia
Teladan indah di tengah masyarakat.`,
    lyrics: `Mengingat janji di hadapan Ilahi
Undang-undang pandu kami ditaati
Setia pada Allah dan Rasul-Nya
Taat aturan jujur bertutur kata.

Reff:
Sopan perwira menyayangi sesama
Hemat cermat suci perkataan
Pandu HW berakhlak mulia
Teladan indah di tengah masyarakat.`,
    audioUrl: 'https://hwjateng.org/musik/janjidanundangundang.mp3',
    audiourl: 'https://hwjateng.org/musik/janjidanundangundang.mp3'
  },
  {
    id: 'playlist-29',
    section: 'playlist',
    type: 'list',
    field1: 'https://hwjateng.org/musik/kafilahberjuang.mp3',
    field2: 'Kafilah Berjuang',
    field3: 'Muhammad Dzikron',
    field4: 'Kafilah Penuntun HW Jateng',
    field5: `Kafilah berderap di tengah deru zaman
Membawa panji amar ma'ruf nahi munkar
Tak gentar hadapi rintangan
Demi tegaknya kalimah Allah nan agung.

Reff:
Berjuanglah kafilah mulia
Jangan goyah diterpa badai dunia
Kemenangan hakiki menanti kita
Di ridha Allah Azza wa Jalla.`,
    judul: 'Kafilah Berjuang',
    title: 'Kafilah Berjuang',
    pencipta: 'Muhammad Dzikron',
    creator: 'Muhammad Dzikron',
    vokalis: 'Kafilah Penuntun HW Jateng',
    vocalist: 'Kafilah Penuntun HW Jateng',
    kategori: 'Lagu Pandu & Perjuangan',
    category: 'Lagu Pandu & Perjuangan',
    lirik: `Kafilah berderap di tengah deru zaman
Membawa panji amar ma'ruf nahi munkar
Tak gentar hadapi rintangan
Demi tegaknya kalimah Allah nan agung.

Reff:
Berjuanglah kafilah mulia
Jangan goyah diterpa badai dunia
Kemenangan hakiki menanti kita
Di ridha Allah Azza wa Jalla.`,
    lyrics: `Kafilah berderap di tengah deru zaman
Membawa panji amar ma'ruf nahi munkar
Tak gentar hadapi rintangan
Demi tegaknya kalimah Allah nan agung.

Reff:
Berjuanglah kafilah mulia
Jangan goyah diterpa badai dunia
Kemenangan hakiki menanti kita
Di ridha Allah Azza wa Jalla.`,
    audioUrl: 'https://hwjateng.org/musik/kafilahberjuang.mp3',
    audiourl: 'https://hwjateng.org/musik/kafilahberjuang.mp3'
  },
  {
    id: 'playlist-30',
    section: 'playlist',
    type: 'list',
    field1: 'https://hwjateng.org/musik/semangathw.mp3',
    field2: 'Semangat Hizbul Wathan Jaya',
    field3: 'Tim Musik HW Jateng',
    field4: 'Paduan Suara Pandu',
    field5: `Suara lantang menggetarkan angkasa
Menyanyikan lagu cinta persada
Hizbul Wathan pandu sejati
Mengukir karya di sanubari.

Reff:
Jaya jaya Hizbul Wathan
Pelopor kebaikan sepanjang zaman
Berbakti ikhlas penuh kerelaan
Untuk agama, nusa, dan peradaban.`,
    judul: 'Semangat Hizbul Wathan Jaya',
    title: 'Semangat Hizbul Wathan Jaya',
    pencipta: 'Tim Musik HW Jateng',
    creator: 'Tim Musik HW Jateng',
    vokalis: 'Paduan Suara Pandu',
    vocalist: 'Paduan Suara Pandu',
    kategori: 'Lagu Pandu & Semangat',
    category: 'Lagu Pandu & Semangat',
    lirik: `Suara lantang menggetarkan angkasa
Menyanyikan lagu cinta persada
Hizbul Wathan pandu sejati
Mengukir karya di sanubari.

Reff:
Jaya jaya Hizbul Wathan
Pelopor kebaikan sepanjang zaman
Berbakti ikhlas penuh kerelaan
Untuk agama, nusa, dan peradaban.`,
    lyrics: `Suara lantang menggetarkan angkasa
Menyanyikan lagu cinta persada
Hizbul Wathan pandu sejati
Mengukir karya di sanubari.

Reff:
Jaya jaya Hizbul Wathan
Pelopor kebaikan sepanjang zaman
Berbakti ikhlas penuh kerelaan
Untuk agama, nusa, dan peradaban.`,
    audioUrl: 'https://hwjateng.org/musik/semangathw.mp3',
    audiourl: 'https://hwjateng.org/musik/semangathw.mp3'
  },
  {
    id: 'playlist-31',
    section: 'playlist',
    type: 'list',
    field1: 'https://hwjateng.org/musik/bintangberpaling.mp3',
    field2: 'Bintang Berpaling ke Tanah Air',
    field3: 'H. Siradj Dahlan',
    field4: 'Paduan Suara HW',
    field5: `Bintang bersinar di langit malam
Menerangi bumi pertiwi yang damai
Sejak dahulu pendahulu berjuang
Membela negeri dengan ikhlas hati.

Reff:
Kini giliran kita generasi muda
Meneruskan estafet cita-cita
Pandu Hizbul Wathan setia sedia
Menjaga kedaulatan tanah pusaka.`,
    judul: 'Bintang Berpaling ke Tanah Air',
    title: 'Bintang Berpaling ke Tanah Air',
    pencipta: 'H. Siradj Dahlan',
    creator: 'H. Siradj Dahlan',
    vokalis: 'Paduan Suara HW',
    vocalist: 'Paduan Suara HW',
    kategori: 'Lagu Sejarah HW',
    category: 'Lagu Sejarah HW',
    lirik: `Bintang bersinar di langit malam
Menerangi bumi pertiwi yang damai
Sejak dahulu pendahulu berjuang
Membela negeri dengan ikhlas hati.

Reff:
Kini giliran kita generasi muda
Meneruskan estafet cita-cita
Pandu Hizbul Wathan setia sedia
Menjaga kedaulatan tanah pusaka.`,
    lyrics: `Bintang bersinar di langit malam
Menerangi bumi pertiwi yang damai
Sejak dahulu pendahulu berjuang
Membela negeri dengan ikhlas hati.

Reff:
Kini giliran kita generasi muda
Meneruskan estafet cita-cita
Pandu Hizbul Wathan setia sedia
Menjaga kedaulatan tanah pusaka.`,
    audioUrl: 'https://hwjateng.org/musik/bintangberpaling.mp3',
    audiourl: 'https://hwjateng.org/musik/bintangberpaling.mp3'
  },
  {
    id: 'playlist-32',
    section: 'playlist',
    type: 'list',
    field1: 'https://hwjateng.org/musik/melangkahpasti.mp3',
    field2: 'Melangkah Pasti Pandu HW',
    field3: 'Muhammad Dzikron',
    field4: 'Kak Dzikron & Gita HW',
    field5: `Langkahkan kakimu dengan mantap
Tatap ke depan jangan ragu menatap
Rahmat Allah menaungi setiap langkah
Selama niat kita lillahi ta'ala.

Reff:
Melangkah pasti pandu sejati
Bersama HW kita mengabdi
Kuatkan ukhuwah, satukan hati
Jayalah Hizbul Wathan di muka bumi.`,
    judul: 'Melangkah Pasti Pandu HW',
    title: 'Melangkah Pasti Pandu HW',
    pencipta: 'Muhammad Dzikron',
    creator: 'Muhammad Dzikron',
    vokalis: 'Kak Dzikron & Gita HW',
    vocalist: 'Kak Dzikron & Gita HW',
    kategori: 'Lagu Motivasi',
    category: 'Lagu Motivasi',
    lirik: `Langkahkan kakimu dengan mantap
Tatap ke depan jangan ragu menatap
Rahmat Allah menaungi setiap langkah
Selama niat kita lillahi ta'ala.

Reff:
Melangkah pasti pandu sejati
Bersama HW kita mengabdi
Kuatkan ukhuwah, satukan hati
Jayalah Hizbul Wathan di muka bumi.`,
    lyrics: `Langkahkan kakimu dengan mantap
Tatap ke depan jangan ragu menatap
Rahmat Allah menaungi setiap langkah
Selama niat kita lillahi ta'ala.

Reff:
Melangkah pasti pandu sejati
Bersama HW kita mengabdi
Kuatkan ukhuwah, satukan hati
Jayalah Hizbul Wathan di muka bumi.`,
    audioUrl: 'https://hwjateng.org/musik/melangkahpasti.mp3',
    audiourl: 'https://hwjateng.org/musik/melangkahpasti.mp3'
  }
];

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

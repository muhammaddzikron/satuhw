export interface TestQuestion {
  id: number;
  question: string;
  options: {
    a: string;
    b: string;
    c: string;
    d: string;
  };
  correctAnswer: 'a' | 'b' | 'c' | 'd';
  explanation?: string;
}

export interface TestScheduleSettings {
  isOpen: boolean; // Manual override or schedule-based
  mode: 'manual' | 'scheduled'; // 'manual' (always open/closed) or 'scheduled'
  startDate?: string; // YYYY-MM-DD
  startTime?: string; // HH:mm
  endDate?: string; // YYYY-MM-DD
  endTime?: string; // HH:mm
  durationMinutes?: number; // 0 for unlimited during open hours
  passingScore?: number; // e.g. 70
  title?: string;
  description?: string;
}

export interface TestSubmission {
  testType: 'pre_test' | 'post_test';
  score: number; // 0 - 100
  correctCount: number;
  totalQuestions: number;
  answers: Record<number, string>; // { 1: 'c', 2: 'a', ... }
  submittedAt: string; // ISO string
  startedAt?: string;
  timeSpentSeconds?: number;
  participantId?: string;
  participantName?: string;
  participantEmail?: string;
}

export const DEFAULT_PRE_TEST_SETTINGS: TestScheduleSettings = {
  isOpen: true,
  mode: 'manual',
  startDate: '',
  startTime: '08:00',
  endDate: '',
  endTime: '23:59',
  durationMinutes: 60,
  passingScore: 70,
  title: 'Pre Test Wajib Pelatihan Hizbul Wathan',
  description: 'Ujian awal untuk mengukur tingkat pemahaman dasar sebelum mengikuti seluruh rangkaian materi pelatihan.'
};

export const DEFAULT_POST_TEST_SETTINGS: TestScheduleSettings = {
  isOpen: false,
  mode: 'manual',
  startDate: '',
  startTime: '08:00',
  endDate: '',
  endTime: '23:59',
  durationMinutes: 60,
  passingScore: 70,
  title: 'Post Test Wajib Pelatihan Hizbul Wathan',
  description: 'Ujian akhir evaluasi pemahaman materi kepanduan Hizbul Wathan sebagai syarat mutlak kelulusan pelatihan.'
};

export const DEFAULT_50_QUESTIONS: TestQuestion[] = [
  {
    id: 1,
    question: "Gerakan Islam & Dakwah Muhammadiyah didirikan oleh .....",
    options: {
      a: "K.H. Agus Salim",
      b: "K.H. Mas Mansur",
      c: "K.H. Ahmad Dahlan",
      d: "K.H. Azhar Basyar"
    },
    correctAnswer: "c"
  },
  {
    id: 2,
    question: "Yang menjadi landasan dasar didirikannya Muhammadiyah adalah ....",
    options: {
      a: "Q.S. Al Imran 104",
      b: "Q.S. Al Imron 105",
      c: "Q.S. Al Imran 106",
      d: "Q.S. Al Imran 107"
    },
    correctAnswer: "a"
  },
  {
    id: 3,
    question: "Pokok-pokok yang terkandung dalam Muqaddimah Anggaran Dasar Muhammadiyah berjumlah ....",
    options: {
      a: "5",
      b: "6",
      c: "7",
      d: "8"
    },
    correctAnswer: "c"
  },
  {
    id: 4,
    question: "Makna dari HIZBUL WATHAN adalah ....",
    options: {
      a: "Perjuang Yang Pemberani",
      b: "Pembela Tanah Air",
      c: "Penjaga Tanah Air",
      d: "Pembangunan Tanah Air"
    },
    correctAnswer: "b"
  },
  {
    id: 5,
    question: "Pandu HIZBUL WATHAN didirikan pada tahun ....",
    options: {
      a: "1912",
      b: "1918",
      c: "1920",
      d: "1928"
    },
    correctAnswer: "b"
  },
  {
    id: 6,
    question: "Pedoman dan petunjuk pelaksanaan gerak langkah dalam kegiatan HW disebut ....",
    options: {
      a: "Anggaran Dasar",
      b: "Anggaran Rumah Tangga",
      c: "Petunjuk Organisasi",
      d: "Dokumen Organisasi"
    },
    correctAnswer: "a"
  },
  {
    id: 7,
    question: "Berikut ini adalah pihak-pihak yang perlu membaca dan memahami AD dan ART HW, KECUALI ....",
    options: {
      a: "Pimpinan Kwartir",
      b: "Pimpinan Qabilah",
      c: "Pelatih Pemimpin Satuan",
      d: "Pengurus Muhammadiyah"
    },
    correctAnswer: "d"
  },
  {
    id: 8,
    question: "Terwujudnya pribadi muslim yang sebenar-benarnya dan siap menjadi kader Persyarikan, Umat dan Bangsa. Pernyataan itu merupakan ......",
    options: {
      a: "Maksud Pendirian HW",
      b: "Sifat dan Identitas HW",
      c: "Tujuan HW",
      d: "Amal Usaha HW"
    },
    correctAnswer: "c"
  },
  {
    id: 9,
    question: "Jati diri kepanduan HW adalah ....",
    options: {
      a: "Ciri Kepanduan",
      b: "Ciri Kemuhammadiyahan",
      c: "Ciri Keagamaan",
      d: "Ciri Kepanduan dan Kemuhammadiyahan"
    },
    correctAnswer: "d"
  },
  {
    id: 10,
    question: "(1) Pemberdayaan anak didik lewat sistem beregu\n(2) Pengamalan akidah islamiah\n(3) Kegiatan dilakukan di alam terbuka\n(4) Pengamalan kode kehormatan Pandu\n\nYang termasuk Prinsip Dasar Kepanduan HW adalah ....",
    options: {
      a: "(1), (2), dan (3)",
      b: "(1) dan (3)",
      c: "(2) dan (4)",
      d: "(1) dan (4)"
    },
    correctAnswer: "c"
  },
  {
    id: 11,
    question: "Yang menjadi ciri khas kegiatan kepanduan termasuk kepanduan HW adalah ....",
    options: {
      a: "Pakaian Seragam",
      b: "Prinsip Dasar Kepanduan",
      c: "Metode Kepanduan",
      d: "Jawaban b dan c benar"
    },
    correctAnswer: "d"
  },
  {
    id: 12,
    question: "Yang disebut Kode Kehormatan dalam kepanduan HW ...",
    options: {
      a: "Janji dan Undang-Undang Pandu HW",
      b: "Undang – Undang Pandu HW",
      c: "AD dan ART dan Undang-Undang Pandu HW",
      d: "Prinsip Dasar Kepanduan HW"
    },
    correctAnswer: "a"
  },
  {
    id: 13,
    question: "Yang disebut ketentuan moral/ahlak dalam Kepanduan HW untuk dijadikan kebiasaan diri dalam bersikap dan berperilaku sebagai warga masyarakat yang berahlak mulia adalah .....",
    options: {
      a: "Janji Pandu HW",
      b: "Undang-Undang HW",
      c: "Anggaran Dasar HW",
      d: "Anggaran Rumah Tangga HW"
    },
    correctAnswer: "b"
  },
  {
    id: 14,
    question: "Tanda pengenal tetap yang menyimpulkan keadaan, nilai, norma yang dimiliki anggota organisasi serta bermuatan cita-cita yang dicanangkan organisasi bersangkutan dinamakan ....",
    options: {
      a: "Pakaian Seragam",
      b: "Lambang",
      c: "Simbol",
      d: "Motto"
    },
    correctAnswer: "b"
  },
  {
    id: 15,
    question: "Sekuntum bunga melati yang dibawahnya terdapat pita dengan tulisan fastabiqul khoirot dengan huruf arab disebut ....",
    options: {
      a: "Lambang HW",
      b: "Motto HW",
      c: "Lencana HW",
      d: "Simbol HW"
    },
    correctAnswer: "d"
  },
  {
    id: 16,
    question: "Peserta didik Pandu HW beserta orang dewasa (Pemimpin Pandu) dihimpun dalam ....",
    options: {
      a: "Gugus",
      b: "Qabilah",
      c: "Satuan",
      d: "Kwartir"
    },
    correctAnswer: "b"
  },
  {
    id: 17,
    question: "Satuan organisasi yang berkedudukan di bawah persyarikan Muhammadiyah disebut ....",
    options: {
      a: "Amal Usaha Muhammadiyah",
      b: "Lembaga Bantuan",
      c: "Organisasi Otonom",
      d: "Badan Pembantu Persyarikan"
    },
    correctAnswer: "c"
  },
  {
    id: 18,
    question: "Anak-anak yang berjumlah 12 – 40 dan berusia 6 – 10 tahun dapat dikelompokkan ke dalam .....",
    options: {
      a: "Athfal",
      b: "Pengenal",
      c: "Penghela",
      d: "Penuntun"
    },
    correctAnswer: "a"
  },
  {
    id: 19,
    question: "Satuan kecil dalam PENGENAL disebut ....",
    options: {
      a: "Kuntum",
      b: "Regu",
      c: "Ikhwan",
      d: "Akhwat"
    },
    correctAnswer: "b"
  },
  {
    id: 20,
    question: "(1) Sifat Kegiatan\n(2) Isi Kegiatan\n(3) Teknis Kegiatan\n(4) Tujuan Kegiatan\n\nDalam menyusun program kegiatan peserta didik hendaknya memperhatikan ....",
    options: {
      a: "(1) dan (3)",
      b: "(2) dan (4)",
      c: "(1), (2) dan (3)",
      d: "(1), (2), (3) dan (4)"
    },
    correctAnswer: "d"
  },
  {
    id: 21,
    question: "Adanya Dewan Satuan dalam kegiatan kepanduan harus dilaksanakan, karena hal itu sebagai perwujudan dari ....",
    options: {
      a: "Prinsip Dasar Kepanduan HW",
      b: "Janji HW",
      c: "Undang-Undang HW",
      d: "Metode Kepanduan HW"
    },
    correctAnswer: "d"
  },
  {
    id: 22,
    question: "Membahas proses pelantikan Pandu, Membahas tentang tindakan atas pelanggaran Kode Kehormatan HW, membahas tentang pemberian penghargaan atas prestasi seorang Pandu merupakan tugas .....",
    options: {
      a: "Pemimpin Qabilah",
      b: "Dewan Kehormatan",
      c: "Dewan Satuan",
      d: "Kwartir Pusat"
    },
    correctAnswer: "b"
  },
  {
    id: 23,
    question: "(1) Perkemahan Bakti Sosial, Lomba Keterampilan Kepanduan & Umum Perkemahan Songsong Ramadhan\n(2) Lokakarya, Saresehan, Perkemahan Penelitian\n(3) Tilawatil Quran, Cerdas Cermat ISMUBA, Lomba Keterampilan Umum\n(4) Keinstrukturan, Kewirausahaan, Keterampilan Kemasyarakatan\n\nKegiatan yang sesuai untuk Forum Silaturahmi Akbar Pandu Pengenal adalah ....",
    options: {
      a: "Nomor 1",
      b: "Nomor 2",
      c: "Nomor 3",
      d: "Nomor 4"
    },
    correctAnswer: "a"
  },
  {
    id: 24,
    question: "Salah satu sikap yang harus dimiliki oleh Pemimpin Satuan, Pelatih, Pimpinan Kwartir untuk dijadikan bahan pertimbangan dalam penyusunan program kegiatan peserta didik adalah ....",
    options: {
      a: "mengenal peserta didik",
      b: "mengenal gejala psikologis peserta didik",
      c: "bertanggung jawab",
      d: "memahami peserta didik dan kebutuhannya"
    },
    correctAnswer: "d"
  },
  {
    id: 25,
    question: "Berikut ini adalah kebutuhan dan tuntutan peserta didik dalam pengembangan diri, KECUALI ....",
    options: {
      a: "Pengembangan bakat dan minat",
      b: "Peningkatan keteladanan",
      c: "Cipta, rasa, karsa dan karya",
      d: "Pencapaian cita-cita"
    },
    correctAnswer: "b"
  },
  {
    id: 26,
    question: "(1) Kebutuhan peserta didik\n(2) Sesuai dengan perkembangan jasmani dan rohani\n(3) Memperhatikan kemampuan, bakat dan minat\n(4) Memperhatikan petunjuk pimpinan kwartir\n\nAgar proses kejiwaan dapat terwujud dengan baik, maka kegiatan yang disajikan hendaknya mengacu dan memperhatikan ....",
    options: {
      a: "(1) dan (3)",
      b: "(2) dan (4)",
      c: "(1), (2) dan (3)",
      d: "(4)"
    },
    correctAnswer: "c"
  },
  {
    id: 27,
    question: "Pandu dewasa yang langsung maupun tidak langsung memimpin dan membina peserta didik di lapangan disebut ....",
    options: {
      a: "Pelatih",
      b: "Pemimpin Satuan",
      c: "Ketua Dewan Satuan",
      d: "Pimpinan kwartir"
    },
    correctAnswer: "b"
  },
  {
    id: 28,
    question: "Lingkungan pendidikan, ditinjau dari segi lingkungan hidup manusia mencakup ....",
    options: {
      a: "2 lingkungan",
      b: "3 lingkungan",
      c: "4 lingkungan",
      d: "5 lingkungan"
    },
    correctAnswer: "b"
  },
  {
    id: 29,
    question: "Menyuruh orang / masyarakat dari apa saja yang dikenal baik menurut ajaran islam dalam seluruh aspek kehidupan disebut ....",
    options: {
      a: "Amar ma’ruf Nahi munkar",
      b: "Amar Ma’ruf",
      c: "Nahi Munkar",
      d: "Tajdid"
    },
    correctAnswer: "b"
  },
  {
    id: 30,
    question: "(1) Dengarkan orang yang mengajak berbicara\n(2) Cukupkan suara sesuai dengan kebutuhan pendengar\n(3) Memotong pembicaraan, meninggalkan orang yang berbicara sebelum selesai\n(4) Pembicaraan ringkas tapi tepat sasaran, hadapkan wajah kepada orang yang sedang berbicara\n\nYang yang termasuk adab berbicara adalah ....",
    options: {
      a: "nomor 1, 2, dan 3",
      b: "nomor 1 dan 3",
      c: "nomor 1, 2, dan 4",
      d: "nomor 3 dan 4"
    },
    correctAnswer: "c"
  },
  {
    id: 31,
    question: "Berikut ini cara mengelola satuan, KECUALI ....",
    options: {
      a: "Menyusun program",
      b: "Menetapkan sasaran kegiatan",
      c: "Menyajikan kegiatan yang menarik, menyenangkan, menantang",
      d: "Senantiasa berkomunikasi dengan pimpinan kwartir pusat"
    },
    correctAnswer: "d"
  },
  {
    id: 32,
    question: "Pengelolaan satuan dapat terwujud bilamana pengelola selalu konsisten dalam .... KECUALI ....",
    options: {
      a: "Memegang teguh keputusan bersama yang dibuat",
      b: "Menempatkan diri sebagai nara sumber yang serba tahu",
      c: "Menjalin komunikasi yang baik dengan peserta didik",
      d: "Mengembangkan keterampilan kepemimpinan peserta didik"
    },
    correctAnswer: "b"
  },
  {
    id: 33,
    question: "Pemimpin Satuan memiliki tugas sebagai berikut, KECUALI ....",
    options: {
      a: "Menyediakan dana yang cukup",
      b: "Membimbing",
      c: "Memberi dukungan dan fasilitas",
      d: "Sukarelawan"
    },
    correctAnswer: "a"
  },
  {
    id: 34,
    question: "Syarat minimal yang harus dimiliki oleh peserta didik untuk mendapat Tanda Kenaikan Tingkat dengan melewati ujian dalam sistem kepanduan disebut ....",
    options: {
      a: "Syarat Kecakapan Umum",
      b: "Syarat Kecakapan Khusus",
      c: "Syarat Kenaikan Tingkat",
      d: "Syarat Kecakapan Pandu"
    },
    correctAnswer: "c"
  },
  {
    id: 35,
    question: "Yang berhak menguji Syarat Kenaikan Tingkat adalah ....",
    options: {
      a: "Guru kelas",
      b: "Pimpinan Kwartir",
      c: "Pimpinan persyarikan",
      d: "Pimpinan Satuan & Pembantu Pimpinan Satuan"
    },
    correctAnswer: "d"
  },
  {
    id: 36,
    question: "(1) Tingkat Taruna Melati Satu, Tingkat Taruna Melati Dua\n(2) Tingkat Purwa, Tingkat Madya, dan Tingkat Utama\n(3) Tingkat Melati Satu, Tingkat Melati Dua dan Tingkat Melati Tiga\n\nSyarat Kenaikan Tingkat (SKT) Penghela adalah ....",
    options: {
      a: "Nomor 1",
      b: "nomor 2",
      c: "nomor 3",
      d: "nomor 1 dan 3"
    },
    correctAnswer: "a"
  },
  {
    id: 37,
    question: "Dalam kepanduan, serangkaian perbuatan yang ditata dalam suatu ketentuan peraturan yang wajib dilaksanakan dengan khidmat, tertib serta merupakan kegiatan yang teratur untuk membentuk kebiasaan sehingga terwujud insan yang berahlak mulia disebut ....",
    options: {
      a: "upacara",
      b: "latihan",
      c: "silaturahmi",
      d: "musyawarah"
    },
    correctAnswer: "a"
  },
  {
    id: 38,
    question: "Formasi upacara dalam Athfal adalah ...",
    options: {
      a: "Angkare",
      b: "Satu shaf",
      c: "Setengah lingkaran",
      d: "Lingkaran"
    },
    correctAnswer: "d"
  },
  {
    id: 39,
    question: "Berikut ini garis besar/pokok-pokok upacara dalam kepanduan, KECUALI ....",
    options: {
      a: "Pembacaan doa",
      b: "Pembacaan Kode Kehormatan",
      c: "Tausiah singkat/nasihat",
      d: "Bentuk barisan sesuai keinginan"
    },
    correctAnswer: "d"
  },
  {
    id: 40,
    question: "Rangkaian upacara dalam rangka memberi pengakuan dan pengesahan terhadap seorang Pandu atas prestasi yang dicapainya disebut ....",
    options: {
      a: "upacara pelantikan",
      b: "upacara penglepasan",
      c: "upacara latihan",
      d: "upacara penerimaan tamu anggota"
    },
    correctAnswer: "a"
  },
  {
    id: 41,
    question: "Inti dari upacara pelantikan seorang Pandu adalah ....",
    options: {
      a: "Dialog antara Pimpinan Satuan dan Pandu",
      b: "Pengibaran Bendera Merah Putih",
      c: "Pengucapan janji secara sukarela",
      d: "Pemberian atribut pelantikan"
    },
    correctAnswer: "c"
  },
  {
    id: 42,
    question: "Dalam kegiatan Tadabbur Alam pada umumnya dipusatkan pada kegiatan ....",
    options: {
      a: "leadership training",
      b: "survival training",
      c: "opstical training",
      d: "survival dan opstical training"
    },
    correctAnswer: "d"
  },
  {
    id: 43,
    question: "(1) Pemetaan dan membaca peta\n(2) Membaca jejak / mengikuti jejak\n(3) Penggunaan kompas\n(4) Pentas seni\n(5) Pengelolaan administrasi\n\nKegiatan yang dapat dikemas dalam kegiatan survival training adalah ....",
    options: {
      a: "Nomor 1, 2, 3",
      b: "Nomor 2 dan 4",
      c: "Nomor 4 dan 5",
      d: "Nomor 5"
    },
    correctAnswer: "a"
  },
  {
    id: 44,
    question: "Latihan hidup bermasyarakat di alam terbuka dengan menggunakan tenda sebagai tempat bernaung dari panas, dingin dan hujan disebut ....",
    options: {
      a: "survival training",
      b: "perkemahan",
      c: "penjelajahan",
      d: "opstical training"
    },
    correctAnswer: "b"
  },
  {
    id: 45,
    question: "Berikut ini adalah persyaratan tempat perkemahan, KECUALI ....",
    options: {
      a: "dekat dengan sumber air",
      b: "tanah yang rata, agak miring tidak rawan longsor",
      c: "dekat dengan perumahan dan jalan raya",
      d: "ada arena petualangan, pemandangannya menarik"
    },
    correctAnswer: "c"
  },
  {
    id: 46,
    question: "(1) Memupuk semangat jiwa korsa\n(2) Menumbuhkan daya kreativitas\n(3) Menghargai karya kelompok lain\n(4) Melatih percaya diri\n(5) Meningkatkan kecintaan kepada diri sendiri\n(6) Melatih daya ingat\n\nApi unggun dalam pendidikan kepanduan adalah tempat berpentas di alam terbuka. Adapun nilai pendidikan yang ingin dicapai adalah ....",
    options: {
      a: "nomor 1, 2, dan 3",
      b: "nomor 1, 2, 3, dan 4",
      c: "nomor 5 dan 6",
      d: "nomor 1, 2, 3, 4 dan 5"
    },
    correctAnswer: "b"
  },
  {
    id: 47,
    question: "Tanda-tanda yang dikenakan pada pakaian seragam Pandu yang dapat menunjukkan diri seorang Pandu, satuan, kemampuan, tanggung jawab, daerah asal, wilayah tugas, serta kecakapannya disebut ....",
    options: {
      a: "Pakaian seragam",
      b: "Atribut",
      c: "Bendera",
      d: "Pakaian seragam dan atribut"
    },
    correctAnswer: "b"
  },
  {
    id: 48,
    question: "Pakaian seragam seorang Pandu terdiri dari ...., KECUALI ....",
    options: {
      a: "atribut",
      b: "tutup kepala/jilbab",
      c: "celana panjang, rok panjang dan baju",
      d: "setangan leher, sepatu dan ikat pinggang"
    },
    correctAnswer: "a"
  },
  {
    id: 49,
    question: "Tanda yang menunjukkan kecakapan, keterampilan, ketangkasan, kemampuan, sikap dan usaha dalam bidang tertentu sesuai dengan kelompok usia disebut ....",
    options: {
      a: "Tanda Penghargaan",
      b: "Tanda Kecakapan",
      c: "Tanda Jabatan",
      d: "Tanda Satuan"
    },
    correctAnswer: "b"
  },
  {
    id: 50,
    question: "Wadah pembinaan luar Qabilah dalam bidang tertentu untuk menumbuhkembangkan Sumber Daya Insani sehingga mampu menjawab tantangan masa kini yang diperuntukkan untuk Penghela dalam kepanduan HW disebut ....",
    options: {
      a: "Bina Karya Mandiri",
      b: "Kursus Jaya Melati",
      c: "Kursus Jaya Matahari",
      d: "Satuan Karya"
    },
    correctAnswer: "a"
  }
];

export function calculateTestResult(
  userAnswers: Record<number, string>,
  questions: TestQuestion[] = DEFAULT_50_QUESTIONS
) {
  let correctCount = 0;
  const total = questions.length;
  const breakdown: Record<number, { selected: string; correct: string; isCorrect: boolean }> = {};

  questions.forEach(q => {
    const userAns = (userAnswers[q.id] || '').toLowerCase().trim();
    const correctAns = (q.correctAnswer || '').toLowerCase().trim();
    const isCorrect = userAns === correctAns;
    if (isCorrect) {
      correctCount++;
    }
    breakdown[q.id] = {
      selected: userAns,
      correct: correctAns,
      isCorrect
    };
  });

  const score = total > 0 ? Math.round((correctCount / total) * 100) : 0;

  return {
    score,
    correctCount,
    totalQuestions: total,
    breakdown
  };
}

export function parseTestScheduleSettings(
  raw: any,
  fallback: TestScheduleSettings = DEFAULT_PRE_TEST_SETTINGS
): TestScheduleSettings {
  if (!raw) return { ...fallback };
  
  let data = raw;
  if (typeof raw === 'string') {
    try {
      data = JSON.parse(raw);
    } catch (e) {
      return { ...fallback };
    }
  }

  if (!data || typeof data !== 'object') return { ...fallback };

  // Parse boolean isOpen strictly
  let isOpen = fallback.isOpen;
  if (data.isOpen !== undefined && data.isOpen !== null) {
    const v = data.isOpen;
    if (v === true || v === 'true' || v === 1 || v === '1') {
      isOpen = true;
    } else if (v === false || v === 'false' || v === 0 || v === '0') {
      isOpen = false;
    }
  }

  const mode = data.mode === 'scheduled' ? 'scheduled' : 'manual';
  const durationMinutes = Number(data.durationMinutes) > 0 ? Number(data.durationMinutes) : (fallback.durationMinutes || 60);
  const passingScore = Number(data.passingScore) >= 0 ? Number(data.passingScore) : (fallback.passingScore || 70);

  return {
    ...fallback,
    ...data,
    isOpen,
    mode,
    startDate: data.startDate !== undefined ? String(data.startDate) : (fallback.startDate || ''),
    startTime: data.startTime !== undefined ? String(data.startTime) : (fallback.startTime || '08:00'),
    endDate: data.endDate !== undefined ? String(data.endDate) : (fallback.endDate || ''),
    endTime: data.endTime !== undefined ? String(data.endTime) : (fallback.endTime || '23:59'),
    durationMinutes,
    passingScore,
    title: data.title || fallback.title,
    description: data.description || fallback.description
  };
}

export function isTestCurrentlyOpen(settings?: any, fallback?: TestScheduleSettings): { isOpen: boolean; statusMessage: string } {
  const parsed = parseTestScheduleSettings(settings, fallback || DEFAULT_PRE_TEST_SETTINGS);

  // If manual mode
  if (parsed.mode === 'manual') {
    if (!parsed.isOpen) {
      return { 
        isOpen: false, 
        statusMessage: 'Akses ujian sedang ditutup oleh Panitia / Tim Pelatih.' 
      };
    }
    return { 
      isOpen: true, 
      statusMessage: 'Ujian Sedang Dibuka' 
    };
  }

  // Scheduled mode
  const now = new Date();
  
  if (parsed.startDate && parsed.startTime) {
    const startDateTime = new Date(`${parsed.startDate}T${parsed.startTime}:00`);
    if (!isNaN(startDateTime.getTime()) && now < startDateTime) {
      const formattedStart = startDateTime.toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });
      return { 
        isOpen: false, 
        statusMessage: `Ujian belum dibuka. Dijadwalkan buka pada ${formattedStart}` 
      };
    }
  }

  if (parsed.endDate && parsed.endTime) {
    const endDateTime = new Date(`${parsed.endDate}T${parsed.endTime}:00`);
    if (!isNaN(endDateTime.getTime()) && now > endDateTime) {
      const formattedEnd = endDateTime.toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });
      return { 
        isOpen: false, 
        statusMessage: `Waktu pengerjaan ujian telah berakhir sejak ${formattedEnd}` 
      };
    }
  }

  // If scheduled mode has no valid start/end dates specified, fall back to isOpen flag
  if (!parsed.startDate && !parsed.endDate) {
    if (!parsed.isOpen) {
      return { 
        isOpen: false, 
        statusMessage: 'Akses ujian sedang ditutup oleh Panitia / Tim Pelatih.' 
      };
    }
  }

  return { 
    isOpen: true, 
    statusMessage: 'Ujian Sedang Berlangsung (Sesuai Jadwal)' 
  };
}

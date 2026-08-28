export interface TrainingProgram {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  fee: string;
  requirements: string[];
  sessions: { id: string; title: string; description: string }[];
  assignments: { id: string; title: string; description: string }[];
}

export interface TrainingActivityItem {
  id: string;
  namaKegiatan: string;
  jenisPelatihan: 'Jati 1' | 'Jati 2' | 'Jari 1' | string;
  lokasiPelatihan?: string;
  tanggalPelatihan?: string;
  deskripsi?: string;
  status?: 'Buka' | 'Tutup' | string;
  tataTertib?: string[];
  gambarUrl?: string;
  imageUrl?: string;
  gambar?: string;
  posterUrl?: string;
  thumbnailUrl?: string;
  coverImage?: string;
  pelatih?: string | string[];
  asistenPelatih?: string | string[];
  biayaPelatihan?: string;
  rekeningPembiayaan?: string;
  noWhatsappPanitia?: string;
  proposalUrl?: string;
}

export const JATI1_36_SESSIONS = [
  { id: 'Sesi 1', title: 'Materi 1: Upacara Pembukaan & Orientasi Pelatihan Jati 1', description: 'Pembukaan resmi, penjelasan tata tertib, kontrak belajar, dan orientasi umum pelatihan Jaya Melati 1.' },
  { id: 'Sesi 2', title: 'Materi 2: Dinamika Kelompok & Membangun Integritas Regu', description: 'Mengenal karakteristik sesama calon pembina, membangun kekompakan tim (team building), serta kontrak komitmen.' },
  { id: 'Sesi 3', title: 'Materi 3: Sejarah & Falsafah Kepanduan Hizbul Wathan', description: 'Menelusuri sejarah kelahiran HW sejak 1918, nilai-nilai kepanduan KH Ahmad Dahlan, dan kebangkitan kembali HW.' },
  { id: 'Sesi 4', title: 'Materi 4: Anggaran Dasar & Anggaran Rumah Tangga (AD/ART) HW', description: 'Memahami landasan yuridis, azas, tujuan, sifat, dan struktur organisasi kepanduan Hizbul Wathan secara komprehensif.' },
  { id: 'Sesi 5', title: 'Materi 5: Prinsip Dasar Kepanduan & Metode Pendidikan HW', description: 'Kajian mendalam tentang pengamalan kode kehormatan, belajar sambil melakukan, sistem beregu, dan kegiatan di alam terbuka.' },
  { id: 'Sesi 6', title: 'Materi 6: Kode Kehormatan Pandu: Janji & Undang-Undang HW', description: 'Penghayatan isi Janji Pandu HW, 10 Undang-Undang HW, serta penerapannya dalam kehidupan sehari-hari pembina.' },
  { id: 'Sesi 7', title: 'Materi 7: Struktur Organisasi Kwartir: Dari Qabilah hingga Kwartir Pusat', description: 'Hierarki kepemimpinan HW, hubungan kerja antartingkatan kwartir, serta tata laksana koordinasi organisasi.' },
  { id: 'Sesi 8', title: 'Materi 8: Manajemen & Tata Kelola Administrasi Qabilah', description: 'Pengelolaan buku induk qabilah, presensi, pembukuan keuangan, inventaris logistik, serta persuratan resmi.' },
  { id: 'Sesi 9', title: 'Materi 9: Psikologi Perkembangan Peserta Didik (Anak & Remaja)', description: 'Memahami fase perkembangan kognitif, emosional, dan sosial peserta didik golongan Athfal, Pengenal, dan Penghela.' },
  { id: 'Sesi 10', title: 'Materi 10: Peran, Fungsi, & Keteladanan Pembina Hizbul Wathan', description: 'Karakteristik pembina ideal: Ing ngarso sung tulodo, ing madyo mangun karso, tut wuri handayani dalam bingkai Islam.' },
  { id: 'Sesi 11', title: 'Materi 11: Golongan Keanggotaan HW: Athfal, Pengenal, Penghela, Penuntun', description: 'Karakteristik spesifik masing-masing golongan, batasan usia, tingkatan syarat kenaikan tingkat, dan seragam.' },
  { id: 'Sesi 12', title: 'Materi 12: Sistem Satuan Terpisah dalam Pendidikan Kepanduan', description: 'Landasan syar\'i dan metodologis pemisahan satuan putra dan putri, adab pergaulan, serta pengelolaan dewan satuan.' },
  { id: 'Sesi 13', title: 'Materi 13: Kurikulum SKU (Syarat Kenaikan Tingkat) & SKP (Syarat Kenaikan Pandu)', description: 'Struktur kompetensi SKU/SKP, instrumen uji kecakapan, buku saku peserta didik, dan sertifikasi kecakapan.' },
  { id: 'Sesi 14', title: 'Materi 14: Tata Cara Ujian Kenaikan Tingkat & Pengujian Tanda Kemahiran', description: 'Teknik asesmen yang mendidik, penyusunan lembar uji SKU, pencatatan hasil verifikasi, serta integritas penguji.' },
  { id: 'Sesi 15', title: 'Materi 15: Upacara Pelantikan & Penganugerahan Tanda Kenaikan Tingkat', description: 'Tata laksana protokoler upacara pelantikan kenaikan tingkat, susunan acara resmi, pengucapan janji, dan penyematan tanda.' },
  { id: 'Sesi 16', title: 'Materi 16: Upacara Pembukaan & Penutupan Latihan Mingguan Qabilah', description: 'Praktik langsung tata upacara latihan rutin rumpun athfal, pasukan pengenal, dan kerabat penghela di lapangan.' },
  { id: 'Sesi 17', title: 'Materi 17: Peraturan Baris Berbaris (PBB) & Tata Upacara Formal HW', description: 'Aba-aba lisan, aba-aba peluit, gerakan di tempat, gerakan berjalan, formasi barisan upacara kepanduan HW.' },
  { id: 'Sesi 18', title: 'Materi 18: Isyarat Peluit, Tongkat, & Formasi Barisan Lapangan', description: 'Penguasaan sandi bunyi peluit pembina, aba-aba menggunakan tongkat pandu, serta kecepatan menyusun formasi barisan.' },
  { id: 'Sesi 19', title: 'Materi 19: Simpul Dasar, Ikatan, & Jerat Tali-Menali (Pionering 1)', description: 'Simpul mati, simpul hidup, simpul pangkal, simpul tiang, simpul jangkar, simpul anyam, serta fungsi praktisnya.' },
  { id: 'Sesi 20', title: 'Materi 20: Rancang Bangun Pionering Lanjutan & Standar Keamanan', description: 'Pembuatan tiang bendera darurat, menara pandang, jemuran tenda, jembatan tali, dan kalkulasi beban aman.' },
  { id: 'Sesi 21', title: 'Materi 21: Komunikasi Lapangan: Semaphore, Morse, & Sandi Dasar', description: 'Penguasaan alfabet dan angka semaphore, sandi morse peluit/senter, sandi kotak, sandi rumput, dan sandi angka.' },
  { id: 'Sesi 22', title: 'Materi 22: Navigasi Darat: Kompas Bidik, Peta Topografi, & Resection', description: 'Mengenal bagian kompas bidik, azimuth dan back-azimuth, membaca kontur peta, serta teknik resection/intersection.' },
  { id: 'Sesi 23', title: 'Materi 23: Pembuatan Peta Pita, Peta Lokasi, & Peta Perjalanan', description: 'Teknik pengukuran langkah kaki, pencatatan sudut kompas berkala, simbol legenda perjalanan, dan drafting laporan.' },
  { id: 'Sesi 24', title: 'Materi 24: Pertolongan Pertama Gawat Darurat (PPGD) di Lapangan', description: 'Penanganan pingsan, dehidrasi, hipotermia, gigitan serangga/ular, pembidaian fraktur tulang, dan balut luka.' },
  { id: 'Sesi 25', title: 'Materi 25: Evakuasi Medis Lapangan & Pembuatan Tandu Darurat', description: 'Teknik mengangkat korban secara ergonomis, perakitan tandu darurat menggunakan 2 tongkat dan mitela/tali.' },
  { id: 'Sesi 26', title: 'Materi 26: Manajemen Perkemahan: Tata Letak Tapak Kemah & Sanitasi', description: 'Pemilihan lokasi aman, arah angin, drainase parit tenda, zonasi dapur dan MCK, serta tata tertib perkemahan.' },
  { id: 'Sesi 27', title: 'Materi 27: Teknik Survival di Alam Terbuka & Bivak Darurat', description: 'Prinsip STOP (Stop, Think, Observe, Plan), pendirian bivak daun/ponco, teknik menyalakan api, dan mencari sumber air bersih.' },
  { id: 'Sesi 28', title: 'Materi 28: Keterampilan Hasta Karya, Prakarya, & Kewirausahaan Pandu', description: 'Pemanfaatan barang bekas/alam untuk kerajinan tangan, kreativitas souvenir kepanduan, dan edukasi kemandirian finansial.' },
  { id: 'Sesi 29', title: 'Materi 29: Lagu-Lagu Kepanduan HW, Tepuk Semangat, & Ice Breaking', description: 'Mars Wathani, Hymne HW, lagu riang gembira pandu, aneka tepuk pembina, dan teknik mencairkan suasana latihan.' },
  { id: 'Sesi 30', title: 'Materi 30: Permainan Edukatif (Wide Games) & Dinamika Pendidikan Lapangan', description: 'Desain game pos-to-pos, permainan mengasah panca indra (KIM), game strategi regu, serta evaluasi makna permainan.' },
  { id: 'Sesi 31', title: 'Materi 31: Malam Keakraban, Api Unggun Pendidikan, & Renungan Jiwa HW', description: 'Filosofi api unggun dalam pendidikan pandu, etika pentas seni islami, susunan acara pengapian, dan renungan suci malam.' },
  { id: 'Sesi 32', title: 'Materi 32: Teknik Menyusun Program Kerja Qabilah (Tahunan & Semesteran)', description: 'Matriks program kerja, kalender pendidikan qabilah, penganggaran biaya, integrasi dengan kalender sekolah/PCM.' },
  { id: 'Sesi 33', title: 'Materi 33: Rencana Pelaksanaan Latihan (RPL) / Modul Pertemuan Mingguan', description: 'Format standar RPL: tujuan pembelajaran, indikator SKU, alokasi waktu, media alat latihan, dan rubrik evaluasi.' },
  { id: 'Sesi 34', title: 'Materi 34: Rencana Tindak Lanjut (RTL) Pasca Pelatihan Jaya Melati 1', description: 'Penyusunan target pembinaan pribadi pembina di qabilah asal selama 6 bulan pasca kelulusan pelatihan Jati 1.' },
  { id: 'Sesi 35', title: 'Materi 35: Evaluasi Akhir (Post-Test) & Uji Kelayakan Calon Pembina', description: 'Pelaksanaan post-test teori dan verifikasi portofolio kelulusan kompetensi pembina Jaya Melati 1.' },
  { id: 'Sesi 36', title: 'Materi 36: Upacara Penutupan Pelatihan & Pengukuhan Kelulusan Jati 1', description: 'Upacara penutupan resmi, pengumuman hasil kelulusan peserta, penyematan ijazah/piagam, dan pelepasan tanda peserta.' }
];

export const JATI1_36_ASSIGNMENTS = [
  { id: 'tugas-1', title: 'Tugas 1: Resume Pemahaman AD/ART & Prinsip Kepanduan HW', description: 'Menulis resume komprehensif mengenai AD/ART dan prinsip dasar kepanduan Hizbul Wathan.' },
  { id: 'tugas-2', title: 'Tugas 2: Esai Pendalaman Falsafah Janji & Undang-Undang HW', description: 'Menyusun esai reflektif mengenai implementasi Janji dan 10 Undang-Undang Pandu HW dalam mendidik anak.' },
  { id: 'tugas-3', title: 'Tugas 3: Draf Rencana Pelaksanaan Latihan (RPL) Mingguan Qabilah', description: 'Menyusun dokumen modul RPL 1 kali latihan mingguan lengkap dengan indikator SKU yang ditargetkan.' },
  { id: 'tugas-4', title: 'Tugas 4: Dokumentasi Video Praktik Memimpin PBB & Upacara Latihan', description: 'Membuat video berdurasi 3-5 menit mempraktikkan aba-aba baris-berbaris dan susunan upacara pembukaan latihan.' },
  { id: 'tugas-5', title: 'Tugas 5: Portofolio Dokumentasi Keterampilan Pionering Tali-Menali', description: 'Mengunggah dokumentasi foto 10 simpul/jerat dasar dan 1 model maket pionering kreasi mandiri.' },
  { id: 'tugas-6', title: 'Tugas 6: Lembar Kerja Analisis Peta Pita & Praktik Kompas Bidik', description: 'Mengisi lembar tugas membaca sudut kompas, penentuan arah mata angin, dan gambar peta pita perjalanan.' },
  { id: 'tugas-7', title: 'Tugas 7: Prosedur Standar PPGD & Pembuatan Tandu Darurat Qabilah', description: 'Menyusun draf SOP penanganan medis darurat latihan luar ruangan dan tata cara perakitan tandu.' },
  { id: 'tugas-8', title: 'Tugas 8: Desain Game Pos Edukatif (Wide Games) & Bank Ice Breaking', description: 'Membuat rancangan 3 pos permainan kepanduan yang mengasah kepemimpinan, kekompakan regu, dan ketangkasan.' },
  { id: 'tugas-9', title: 'Tugas 9: Draf Program Kerja Pembinaan 1 Semester di Qabilah Asal', description: 'Menyusun matriks jadwal kegiatan latihan mingguan, perkemahan sabtu-minggu, dan target uji kenaikan tingkat SKU.' },
  { id: 'tugas-10', title: 'Tugas 10: Dokumen Rencana Tindak Lanjut (RTL) Pembina Pasca Jati 1', description: 'Menyusun komitmen formal RTL pembinaan di qabilah masing-masing selama 6 bulan ke depan pasca lulus Jaya Melati 1.' },
  { id: 'tugas-11', title: 'Tugas 11: Analisis Kebutuhan Latihan Golongan Athfal & Pengenal', description: 'Membuat laporan analisis minat dan psikologi anak didik di sekolah/qabilah masing-masing.' },
  { id: 'tugas-12', title: 'Tugas 12: Rencana Anggaran Biaya (RAB) Kegiatan Perkemahan Qabilah', description: 'Menyusun draf estimasi rincian biaya penyelenggaraan perkemahan tingkat qabilah.' },
  { id: 'tugas-13', title: 'Tugas 13: Desain Modul SKU Pengenal Tingkat Purwa', description: 'Menyusun lembar kerja uji kecakapan pengenal purwa beserta panduan pengujiannya.' },
  { id: 'tugas-14', title: 'Tugas 14: Praktik Isyarat Peluit & Sandi Morse Audio/Visual', description: 'Mengerjakan tugas translasi pesan sandi morse dan rekaman variasi isyarat peluit pembina.' },
  { id: 'tugas-15', title: 'Tugas 15: Ringkasan Materi Manajemen Konflik Regu & Dinamika Kelompok', description: 'Menuliskan studi kasus penanganan perselisihan antar anggota regu dan solusinya.' },
  { id: 'tugas-16', title: 'Tugas 16: Desain Tata Ruang Tapak Kemah Ramah Lingkungan', description: 'Menggambar denah layout perkemahan qabilah dengan zonasi higienis dan ramah lingkungan.' },
  { id: 'tugas-17', title: 'Tugas 17: Rekaman Audio/Video Mars Wathani & Hymne HW', description: 'Mengunggah rekaman melantunkan lagu resmi kepanduan Hizbul Wathan secara khidmat dan benar.' },
  { id: 'tugas-18', title: 'Tugas 18: Laporan Observasi Latihan Lapangan di Qabilah Mitra', description: 'Membuat catatan evaluasi pelaksanaan latihan rutin di salah satu qabilah sekitar.' },
  { id: 'tugas-19', title: 'Tugas 19: Panduan Praktis Uji Syarat Kenaikan Pandu (SKP) Khusus', description: 'Menyusun syarat dan kriteria pengujian untuk minimal 2 macam tanda kemahiran khusus.' },
  { id: 'tugas-20', title: 'Tugas 20: Draf Naskah Skenario Upacara Pelantikan Kenaikan Tingkat', description: 'Menyusun teks susunan kata-kata pelantikan dan penyematan tanda kenaikan tingkat.' },
  { id: 'tugas-21', title: 'Tugas 21: Lembar Kerja Resection & Intersection Navigasi Peta', description: 'Menyelesaikan soal latihan penentuan posisi koordinat menggunakan teknik resection kompas.' },
  { id: 'tugas-22', title: 'Tugas 22: Laporan Praktik Tali-Menali & Maket Pionering', description: 'Mengunggah foto/video atau gambar rancangan bangunan pionering tongkat.' },
  { id: 'tugas-23', title: 'Tugas 23: Praktik Kirim Pesan Semaphore & Morse HW', description: 'Membuat rekaman video singkat atau lembar jawaban translasi morse & semaphore.' },
  { id: 'tugas-24', title: 'Tugas 24: Laporan Navigasi Darat & Penggunaan Kompas', description: 'Mencatat hasil bidikan kompas dan perhitungan azimut/back-azimut.' },
  { id: 'tugas-25', title: 'Tugas 25: Panduan Praktis PPGD & Pembuatan Tandu Darurat', description: 'Menyusun langkah penanganan medis darurat dan langkah pembuatan tandu.' },
  { id: 'tugas-26', title: 'Tugas 26: Peta Pita & Peta Perjalanan Penjelajahan', description: 'Menggambar lembar peta pita penjelajahan lengkap dengan skala dan legenda.' },
  { id: 'tugas-27', title: 'Tugas 27: Standard Operating Procedure (SOP) Perkemahan Qabilah', description: 'Membuat draf aturan kebersihan, ibadah, dan keamanan tapak kemah.' },
  { id: 'tugas-28', title: 'Tugas 28: Laporan Tadabbur Alam & Teknik Survival Field', description: 'Menuliskan ringkasan pengalaman dan pembelajaran kegiatan luar ruangan.' },
  { id: 'tugas-29', title: 'Tugas 29: Proposal Proyek Hasta Karya / Kewirausahaan Pandu', description: 'Membuat rancangan produk kerajinan/usaha ekonomis kreasi anggota.' },
  { id: 'tugas-30', title: 'Tugas 30: Bank Soal / Modul Game Edukatif & Lagu HW', description: 'Menghimpun 5 variasi permainan kepanduan beserta lirik lagu resmi HW.' },
  { id: 'tugas-31', title: 'Tugas 31: Skenario Acara Malam Api Unggun & Refleksi HW', description: 'Menyusun susunan acara dan susunan pengapian api unggun pendidikan.' },
  { id: 'tugas-32', title: 'Tugas 32: Lembar Evaluasi & Laporan Perkembangan Anggota', description: 'Membuat draf rapor kecakapan dan perkembangan karakter anak didik.' },
  { id: 'tugas-33', title: 'Tugas 33: Draf BUKU ADMIN QABILAH & Inventaris Barang', description: 'Membuat format buku induk, buku presensi, dan buku inventaris qabilah.' },
  { id: 'tugas-34', title: 'Tugas 34: Dokumen Rencana Tindak Lanjut (RTL) Pembinaan Qabilah', description: 'Menyusun proposal proyek pengembangan HW di qabilah asal pasca pelatihan.' },
  { id: 'tugas-35', title: 'Tugas 35: Lembar Hasil Post-Test & Evaluasi Mandiri Jati 1', description: 'Mengerjakan dan mengunggah lembar evaluasi purna pelatihan Jaya Melati 1.' },
  { id: 'tugas-36', title: 'Tugas 36: Laporan Akhir Portofolio Keikutsertaan Jati 1', description: 'Mengumpulkan bundel portofolio pengerjaan seluruh tugas dari Sesi 1 sampai Sesi 35.' }
];

export const DEFAULT_JATI1_36_MATERI = JATI1_36_SESSIONS.map((s, idx) => ({
  id: `jati1-materi-${idx + 1}`,
  judul: s.title,
  konten: s.description,
  kategori: 'jati1',
  tanggal: 'Jadwal Pelatihan Jaya Melati 1',
  coverImage: '',
  driveUrl: ''
}));

export const TRAINING_PROGRAMS: TrainingProgram[] = [
  {
    id: 'Jati 1',
    title: 'JATI 1',
    subtitle: 'Jaya Melati 1',
    description: 'Pelatihan kepemimpinan tingkat dasar bagi calon Pembina Gerakan Kepanduan Hizbul Wathan untuk membekali dasar-dasar kepemimpinan, kepanduan Islami, dan manajemen qabilah.',
    fee: 'Rp 50.000',
    requirements: [
      'Usia minimal 17 tahun atau sudah menikah',
      'Anggota Muhammadiyah/Ortom atau simpatisan berkomitmen',
      'Mendapat rekomendasi dari Pimpinan Cabang/Daerah Muhammadiyah',
      'Mengisi formulir pendaftaran resmi & melunasi biaya administrasi'
    ],
    sessions: JATI1_36_SESSIONS,
    assignments: JATI1_36_ASSIGNMENTS
  },
  {
    id: 'Jati 2',
    title: 'JATI 2',
    subtitle: 'Jaya Melati 2',
    description: 'Pelatihan kepemimpinan tingkat lanjutan untuk memperdalam strategi pembinaan, metodologi kepelatihan instruktur, serta manajemen taktis organisasi kwartir.',
    fee: 'Rp 50.000',
    requirements: [
      'Telah lulus Jaya Melati 1 (Jati 1) minimal 6 bulan',
      'Aktif membina di Qabilah atau Satuan secara konsisten',
      'Mendapat rekomendasi dari Kwartir Daerah setempat',
      'Mengisi formulir pendaftaran resmi & melunasi biaya administrasi'
    ],
    sessions: [
      { id: 'Sesi 1', title: 'Dinamika Kelompok Lanjutan & Manajemen Konflik', description: 'Metode interaktif memimpin kelompok, fasilitasi, serta penyelesaian konflik' },
      { id: 'Sesi 2', title: 'Manajemen Strategis Kwartir Daerah & Wilayah', description: 'Perencanaan strategis, kebijakan organisasi, serta tata kelola kwartir' },
      { id: 'Sesi 3', title: 'Desain Instruksional & Kurikulum Pelatihan', description: 'Metode penyusunan kurikulum pelatihan, silabus, dan teknik evaluasi' },
      { id: 'Sesi 4', title: 'Praktik Kepelatihan (Micro-Teaching)', description: 'Simulasi menyampaikan materi kepanduan di hadapan tim pelatih' }
    ],
    assignments: [
      { id: 'tugas-1', title: 'Analisis Kebutuhan Latihan Qabilah', description: 'Membuat dokumen analisis hambatan pembinaan di qabilah masing-masing beserta solusinya.' },
      { id: 'tugas-2', title: 'Desain Modul Sesi Latih Micro-Teaching', description: 'Menyusun silabus lengkap beserta draf modul pembelajaran untuk salah satu sesi Jati 1.' }
    ]
  },
  {
    id: 'Jari 1',
    title: 'JARI 1',
    subtitle: 'Jaya Matahari 1',
    description: 'Pelatihan bagi kader remaja/muda Hizbul Wathan untuk membekali kemampuan teknis memimpin regu, survival lapangan, sandi, kompas, serta pertolongan pertama.',
    fee: 'Rp 50.000',
    requirements: [
      'Anggota aktif golongan Pengenal / Penghela',
      'Telah lulus SKU tingkat tertinggi di golongannya',
      'Mendapat rekomendasi tertulis dari Ketua Qabilah/Sekolah',
      'Mengisi formulir pendaftaran resmi & melunasi biaya administrasi'
    ],
    sessions: [
      { id: 'Sesi 1', title: 'Kepemimpinan Dewan Pasukan & Regu', description: 'Peran Pratama, Pinru, Wapinru, serta manajemen dewan pasukan' },
      { id: 'Sesi 2', title: 'Teknik Survival & Navigasi Kompas', description: 'Navigasi darat, membaca peta pita, kompas bidik, serta survival alam bebas' },
      { id: 'Sesi 3', title: 'Semaphore, Morse & Sandi Lapangan', description: 'Keterampilan komunikasi visual jarak jauh menggunakan bendera, peluit, dan sandi' },
      { id: 'Sesi 4', title: 'PPGD & Evakuasi Medis Lapangan', description: 'Pertolongan pertama gawat darurat, penanganan luka, pembidaian, serta teknik tandu' }
    ],
    assignments: [
      { id: 'tugas-1', title: 'Video Praktik Semaphore / Morse', description: 'Mengunggah video berdurasi minimal 1 menit mempraktikkan pengiriman pesan semaphore/morse.' },
      { id: 'tugas-2', title: 'Laporan Peta Pita Lapangan', description: 'Menggambar peta pita perjalanan sejauh minimal 1 km lengkap dengan keterangan kompas.' }
    ]
  }
];

export const DEFAULT_TRAINING_ACTIVITIES: TrainingActivityItem[] = [
  {
    id: 'act-jati1-default',
    namaKegiatan: 'Pelatihan Jaya Melati 1 (Jati 1) HW Jawa Tengah',
    jenisPelatihan: 'Jati 1',
    lokasiPelatihan: 'Pusdiklat HW Jawa Tengah / Qabilah Setempat',
    tanggalPelatihan: 'Jadwal Reguler Kwarwil HW Jateng',
    deskripsi: 'Pelatihan kepemimpinan tingkat dasar bagi calon Pembina Gerakan Kepanduan Hizbul Wathan untuk membekali dasar-dasar kepemimpinan, kepanduan Islami, dan manajemen qabilah.',
    status: 'Buka',
    tataTertib: [
      'Kedisiplinan & Ketepatan Waktu: Peserta wajib hadir 15 menit sebelum setiap sesi materi dimulai.',
      'Ketertiban Pakaian: Mengenakan seragam resmi Hizbul Wathan lengkap dengan atribut atribut kelengkapan.',
      'Presensi Sesi Mandiri: Peserta wajib mengisi presensi pada setiap sesi materi yang diselenggarakan.',
      'Pengerjaan Tugas: Mengikuti seluruh rangkaian kegiatan dan mengumpulkan semua penugasan yang dibuat oleh Tim Pelatih.',
      'Adab Kepanduan: Menjaga adab Islami, sopan santun, serta saling menghormati sesama peserta dan pelatih.',
      'Ketentuan Kelulusan & Piagam: Piagam kelulusan hanya dapat didownload oleh peserta yang berstatus LULUS setelah dievaluasi oleh Tim Pelatih.'
    ]
  },
  {
    id: 'act-jati2-default',
    namaKegiatan: 'Pelatihan Jaya Melati 2 (Jati 2) HW Jawa Tengah',
    jenisPelatihan: 'Jati 2',
    lokasiPelatihan: 'Pusdiklat Kwarwil HW Jawa Tengah',
    tanggalPelatihan: 'Jadwal Periodik Kwarwil HW Jateng',
    deskripsi: 'Pelatihan kepemimpinan tingkat lanjutan untuk memperdalam strategi pembinaan, metodologi kepelatihan instruktur, serta manajemen taktis organisasi kwartir.',
    status: 'Buka',
    tataTertib: [
      'Peserta wajib telah memiliki kualifikasi Jaya Melati 1 (Jati 1).',
      'Hadir tepat waktu pada setiap sesi ceramah, diskusi, dan praktik mengajar.',
      'Memakai pakaian seragam HW lengkap dan rapi.',
      'Mengisi daftar presensi digital setiap sesi materi.',
      'Mengumpulkan seluruh tugas mandiri & tugas kelompok dari Tim Pelatih.',
      'Ketentuan Kelulusan & Piagam: Piagam kelulusan dapat didownload jika telah dalam status LULUS.'
    ]
  },
  {
    id: 'act-jari1-default',
    namaKegiatan: 'Pelatihan Jaya Matahari 1 (Jari 1) HW Jawa Tengah',
    jenisPelatihan: 'Jari 1',
    lokasiPelatihan: 'Bumi Perkemahan HW Jawa Tengah',
    tanggalPelatihan: 'Jadwal Perkemahan Kwarwil HW Jateng',
    deskripsi: 'Pelatihan bagi kader remaja/muda Hizbul Wathan untuk membekali kemampuan teknis memimpin regu, survival lapangan, sandi, kompas, serta pertolongan pertama.',
    status: 'Buka',
    tataTertib: [
      'Disiplin tinggi di perkemahan dan mematuhi tata tertib instruktur lapangan.',
      'Membawa perlengkapan pribadi dan pakaian dinas HW.',
      'Wajib mengisi presensi sesi materi dan praktik lapangan.',
      'Mengumpulkan tugas praktik navigasi dan kompas.',
      'Ketentuan Kelulusan & Piagam: Piagam kelulusan hanya aktif dan dapat didownload jika status kepesertaan LULUS.'
    ]
  }
];

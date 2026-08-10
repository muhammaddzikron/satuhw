export type UserRole = 'umum' | 'kwarda' | 'sugli' | 'jati1' | 'jati2' | 'jari1' | 'admin' | 'superadmin';

export interface User {
  id: string;
  uid?: string;
  email: string;
  namaLengkap: string;
  nama?: string;
  jenisKelamin: 'L' | 'P';
  golongan: string;
  pelatihan: string[];
  pendidikan: string;
  asalKwarda: string;
  qabilah: string;
  asalQabilah?: string;
  alamat: string;
  noHp: string;
  sosmed: string;
  role: UserRole;
  roles?: UserRole[];
  activeRole?: UserRole;
  isVerified?: boolean;
  upgradeRequests?: string[]; // Array of categories requested for upgrade
  photo?: string;
  nik?: string;
  ktaNumber?: string;
  nomorKTA?: string;
  kodeProvinsi?: string;
  kodeKwarda?: string;
  nomorUrut?: number;
  tanggalDaftar?: string;
  status?: string;
  aktif?: boolean;
  statusAktivasi?: string;
  statusPembayaran?: string;
  verifiedAt?: string;
  password?: string;
  tempatLahir?: string;
  tanggalLahir?: string;
}

export interface Materi {
  id: string;
  judul: string;
  konten: string;
  kategori: string; // umum, kwarda, sugli, jati1, jati2, jari1
  tanggal: string;
  coverImage?: string;
  linkExternal?: string;
  driveUrl?: string;
}

export interface PrayerTimes {
  shubuh: string;
  dzuhur: string;
  ashar: string;
  maghrib: string;
  isya: string;
  date: string;
  hijri?: {
    day: string;
    month: string;
    year: string;
  };
}

export interface QuranSurah {
  nomor: number;
  nama: string;
  namaLatin: string;
  jumlahAyat: number;
}

export interface Content {
  id: string;
  section: string;
  type?: 'single' | 'list';
  field1?: string;
  field2?: string;
  field3?: string;
  field4?: string;
  title?: string;
  body?: string;
  image?: string;
}

export interface TrainingActivity {
  id: string;
  namaKegiatan: string;
  jenisPelatihan?: string;
  lokasiPelatihan?: string;
  tanggalPelatihan?: string;
  status: 'Buka' | 'Tutup';
  deskripsi?: string;
  fee?: string;
  biaya?: string;
  biayaPelatihan?: string;
  proposalUrl?: string;
  proposal?: string;
  linkProposal?: string;
  rekeningPembayaran?: string;
  rekeningPembiayaan?: string;
  konfirmasiPembayaran?: string;
  noWhatsappPanitia?: string;
  themeSongUrl?: string;
  themeSongTitle?: string;
  gambarUrl?: string;
  penyelenggara?: string;
  kuota?: string;
  kategori?: string;
  createdBy?: string;
  creatorName?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface KTAApplication {
  id?: string;
  email?: string;
  nama?: string;
  nik?: string;
  tempatLahir?: string;
  tanggalLahir?: string;
  asalDaerah?: string;
  qabilah?: string;
  tingkatan?: string;
  alamat?: string;
  photo?: string;
  ktaNumber?: string;
  status?: string;
  appliedAt?: string;
  verifiedAt?: string;
  rejectionReason?: string;
}

export interface SystemSettings {
  ktaTemplateFront?: string;
  ktaTemplateBack?: string;
  ktaKotaPenerbit?: string;
  ktaStempelImage?: string;
  ktaTandaTanganKetua?: string;
  ktaKetuaNama?: string;
  ktaKetuaNbm?: string;
  ktaTandaTanganSekretaris?: string;
  ktaSekretarisNama?: string;
  ktaSekretarisNbm?: string;
  [key: string]: any;
}

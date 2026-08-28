export type UserRole = 'umum' | 'umum_pandu' | 'kwarda' | 'sugli' | 'sugli_daerah' | 'sugli_wilayah' | 'admin_kwarda' | 'jati1' | 'jayamelati1' | 'jati2' | 'jayamelati2' | 'jari1' | 'jayamatahari1' | 'jari2' | 'jayamatahari2' | 'jawi' | 'jayapertiwi' | 'admin' | 'superadmin' | 'admin_diklat' | 'diklat';

export interface User {
  id: string;
  uid?: string;
  email: string;
  namaLengkap: string;
  nama?: string;
  jenisKelamin: 'L' | 'P';
  golongan: string;
  golonganPelatih?: string;
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
  adminType?: string;
  isVerified?: boolean;
  upgradeRequests?: string[]; // Array of categories requested for upgrade
  photo?: string;
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
  field5?: string;
  field6?: string;
  lyrics?: string;
  lirik?: string;
  pencipta?: string;
  creator?: string;
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
  youtubeUrl?: string;
  videoUrl?: string;
  gambarUrl?: string;
  imageUrl?: string;
  gambar?: string;
  posterUrl?: string;
  thumbnailUrl?: string;
  coverImage?: string;
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

export type OrganizationEntityType = 'Kwarda' | 'Qabilah PTMA';

export interface KwardaPtmaEntity {
  code: string; // '01'..'58'
  ktaCode: string; // '11.01'..'11.58'
  name: string; // e.g. 'Kabupaten Klaten' or 'Universitas Muhammadiyah Surakarta (UMS)'
  type: OrganizationEntityType;
  order: number; // 1..58
}

export interface PengurusOrgItem {
  id: string;
  orgCode: string; // '01'..'58'
  jabatan: string; // e.g. 'Ketua', 'Wakil Ketua', 'Sekretaris', 'Bendahara', 'Bidang Organisasi', etc.
  nama: string; // Nama Lengkap
  sortOrder: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface DewanSugliOrgItem {
  id: string;
  orgCode: string; // '01'..'58'
  jabatan: string; // e.g. 'Ketua', 'Wakil Ketua', 'Sekretaris', etc.
  nama: string; // Nama Lengkap
  sortOrder: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface QabilahOrgItem {
  id: string;
  orgCode: string; // '01'..'35' (only for Kwarda)
  namaQabilah: string;
  jumlahAnggota: number; // >= 0
  createdAt?: string;
  updatedAt?: string;
}

export interface KegiatanOrgItem {
  id: string;
  orgCode: string; // '01'..'58'
  jenisKegiatan: string; // e.g. 'Pelatihan', 'Perkemahan', 'Musyawarah', 'Rapat', 'Workshop', 'Lomba', 'Kegiatan Sosial', 'Kegiatan Kepanduan', etc.
  jadwal: string; // Date or datetime string
  keterangan?: string;
  linkProposal?: string; // Valid URL to Google Drive or document
  createdAt?: string;
  updatedAt?: string;
}

export interface KwardaPtmaSummaryItem {
  code: string;
  name: string;
  type: OrganizationEntityType;
  ktaCode: string;
  order: number;
  totalQabilah: number;
  totalAnggota: number;
  totalPengurus: number;
  totalDewanSugli: number;
  totalKegiatan: number;
}


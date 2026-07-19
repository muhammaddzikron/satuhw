export type UserRole = 'umum' | 'kwarda' | 'sugli' | 'jati1' | 'jati2' | 'jari1' | 'admin' | 'superadmin';

export interface User {
  id: string;
  email: string;
  namaLengkap: string;
  jenisKelamin: 'L' | 'P';
  golongan: string;
  pelatihan: string[];
  pendidikan: string;
  asalKwarda: string;
  qabilah: string;
  alamat: string;
  noHp: string;
  sosmed: string;
  role: UserRole;
  roles?: UserRole[];
  activeRole?: UserRole;
  isVerified?: boolean;
  upgradeRequests?: string[]; // Array of categories requested for upgrade
  photo?: string;
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

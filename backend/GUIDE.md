# Panduan Instalasi Backend (Google Apps Script)

Aplikasi ini menggunakan Google Sheets sebagai database melalui Google Apps Script. Berikut adalah langkah-langkah untuk memasang backend Anda:

### 1. Siapkan Google Sheet
1. Buka [Google Sheets](https://sheets.new).
2. Beri nama file, misalnya: `Database HW`.
3. **Penting:** Anda tidak perlu membuat sheet atau kolom secara manual. Script akan membuat sheet `Users`, `Materi`, dan `Contents` beserta kolom-kolomnya secara otomatis saat pertama kali diakses.

### 2. Pasang Script
1. Di Google Sheet, klik menu **Extensions** > **Apps Script**.
2. Hapus semua kode di `Code.gs` dan tempelkan kode dari file `backend/code.gs` di proyek ini.
3. Klik ikon simpan (disk) dan beri nama proyek, misalnya `API HW`.

### 3. Deploy sebagai Web App
1. Klik tombol **Deploy** di pojok kanan atas.
2. Pilih **New deployment**.
3. Pilih type: **Web app**.
4. Deskripsi: `Versi 1`.
5. Execute as: **Me** (Email Anda).
6. Who has access: **Anyone** (Ini penting agar aplikasi bisa mengaksesnya).
7. Klik **Deploy**.
8. Anda mungkin perlu memberikan izin (Authorize Access). Klik "Advanced" dan "Go to API HW (unsafe)" jika muncul peringatan.

### 4. Dapatkan URL API
1. Setelah berhasil, Anda akan mendapatkan **Web App URL**. Contoh: `https://script.google.com/macros/s/.../exec`.
2. Salin URL tersebut.

### 5. Login Pertama (Admin Default)
Setelah semua terpasang, Anda bisa login ke Dashboard Admin menggunakan akun bawaan berikut:
- **Email:** `admin@admin.com`
- **Password:** `admin123`

### 6. Konfigurasi di Vercel / Environment
1. Di proyek Anda (Vercel Dashboard atau file `.env`), tambahkan variabel berikut:
   ```env
   VITE_GSHEET_API_URL=URL_YANG_ANDA_SALIN
   ```
2. Pastikan file `.env.example` juga mencantumkan variabel ini.

### 6. Catatan Penting
- Jika Anda mengganti kode di Apps Script, Anda harus melakukan **New Deployment** atau mengupdate versi deployment agar perubahan tersinkronisasi.
- Pastikan kolom di Google Sheet tidak dihapus secara manual karena Script bergantung pada header di baris pertama.

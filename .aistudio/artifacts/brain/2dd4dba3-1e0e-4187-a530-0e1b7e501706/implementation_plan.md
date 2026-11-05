# Rencana Implementasi: 6 Penyempurnaan E-OPPKPKE Kabupaten Blora

Pembaruan ini bertujuan untuk menyempurnakan alur autentikasi dan isolasi data OPD, penyesuaian header & periode tahun (2026 & 2027), perapian kontrol tombol, pemformatan otomatis kode rekening dengan titik, indikator *progress bar* kelengkapan matriks, serta fleksibilitas pengisian aktivitas anggaran (cukup salah satu dari tiga aktivitas).

---

## User Review & Critical Decisions

> [!IMPORTANT]
> **Keputusan Utama yang Dikonfirmasi Pengguna:**
> 1. **Penghapusan Total Dropdown Akun**: Dropdown ganti akun demo di pojok kanan atas dihapus total untuk semua pengguna (baik OPD maupun Admin). Akun hanya menampilkan profil pengguna aktif beserta tombol Logout. Sesi OPD terisolasi 100% pada instansi miliknya.
> 2. **Lokasi Progress Bar**: Ditampilkan secara komprehensif, yaitu di baris tabel matriks (kolom *Progress Kelengkapan*) dan di dalam modal popout (*Overall Progress Bar* & indikator per langkah).
> 3. **Fleksibilitas Aktivitas Real**: Langkah aktivitas kini valid jika pengguna mengisi **minimal salah satu** dari tiga kolom (Aktivitas Real Langsung, Tidak Langsung, atau Penunjang), tidak diwajibkan mengisi ketiganya sekaligus.

---

## 1. Overview & Core Concept

1. **Isolasi Data OPD Penuh**: Saat login sebagai OPD tertentu (misalnya *Dinas P3A*), pengguna hanya melihat data milik instansi tersebut secara permanen tanpa opsi mengganti instansi di pojok kanan atas.
2. **Periode Tahun 2026 & 2027**: Menambahkan opsi tahun anggaran 2026 dan 2027, serta menampilkan indikator status Tahun & Semester di Top Context Header aplikasi.
3. **Pembersihan Header**: Menghapus tombol *Input Data Matriks* di header atas karena aksi ini sudah tersedia secara kontekstual di halaman Matriks OPD dan Dashboard.
4. **Format Masking Kode Rekening**: Input kode rekening secara otomatis menerapkan format bertitik `_.__.__._.__.____` (misal `2.19.02.2.01.0011`) saat pengguna mengetik angka.
5. **Progress Bar Kelengkapan**: Menghitung persentase kelengkapan data (0% s.d. 100%) dan menampilkannya dengan bar progres visual di tabel matriks dan modal popout.
6. **Aktivitas Anggaran Opsional/Fleksibel**: Validasi kelengkapan mengizinkan pengisian salah satu aktivitas (Langsung, Tidak Langsung, atau Penunjang).

---

## 2. User Experience & Visual Design

### Header & Navigasi
- Top Header tidak lagi menampilkan tombol *Input Data Matriks* yang redundan.
- Top Header menampilkan pill badge status: **TA [Tahun] • [Semester 1 / Semester 2]** disertai indikator status periode (**Dibuka** / **Ditutup**).
- Menu profil di pojok kanan atas hanya berisi info nama pengguna, instansi, jabatan, dan tombol **Keluar Sistem (Logout)** tanpa daftar beralih akun.

### Form Modal Popout (Step 1 & Step 2)
- **Kode Rekening Masking**: Saat mengetik `219022010011`, otomatis terformat menjadi `2.19.02.2.01.0011`.
- **Progress Bar Modal**: Di bagian atas modal terdapat bar progres visual interaktif yang bergerak dinamis seiring bertambahnya kolom yang diisi.
- **Aktivitas Real**: Keterangan diperjelas bahwa pengisian bersifat fleksibel (*"Wajib mengisi minimal salah satu aktivitas"*).

### Tabel Matriks
- Penambahan kolom atau indikator visual **Progress Kelengkapan Data** dengan persentase dan bar mini berwarna (Hijau untuk 100%, Biru untuk progres berjalan, Abu-abu jika belum diisi).

---

## 3. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────┐
│                   AUTHENTICATION & SESSION             │
│  - LoginView (Username & Password / Quick Login)       │
│  - Session: AuthUser (OPD ID strictly isolated)        │
│  - Profile Dropdown: User Info + Logout only           │
└───────────────────────────┬────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│                    TOP CONTEXT HEADER                  │
│  - Breadcrumb / Title                                  │
│  - Status Badge: TA 2026/2027 • Semester 1/2 (Dibuka)  │
│  - Notification Bell + User Profile                    │
│  (Button "Input Data Matriks" REMOVED)                 │
└───────────────────────────┬────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│                      MATRIKS VIEW                      │
│  - Table: Added Progress Bar Column (0% - 100%)        │
│  - Filter: Tahun 2026 & 2027                           │
│  - Action: "+ Input Data Matriks" (Single Source)      │
└───────────────────────────┬────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│               MATRIX INPUT MODAL (4-STEPS)             │
│  - Header: Overall Completion Progress Bar             │
│  - Step 1: Kode Rekening auto-mask: _.__.__._.__.____  │
│  - Step 2: Aktivitas Real (At least 1 required)        │
│  - Step 3 & 4: Location, Targets & Independent Sem 1/2 │
└────────────────────────────────────────────────────────┘
```

---

## 4. Rencana Langkah Perubahan

1. **`src/data/bloraSeedData.ts`**: Menambahkan data periode `per-2027` (Tahun Anggaran 2027) di `SEED_PERIODE`.
2. **`src/utils/formatters.ts`**: Menambahkan fungsi utilitas `formatKodeRekening(raw: string): string` untuk format `_.__.__._.__.____`.
3. **`src/types/oppkpke.ts` & `src/services/databaseService.ts`**: Menyesuaikan kalkulasi `is_data_teknis_lengkap` dan menambahkan fungsi hitung persentase kelengkapan (0–100%).
4. **`src/components/MatrixInputModal.tsx`**:
   - Menerapkan format auto-dot pada input kode rekening.
   - Mengubah validasi Step 2 agar cukup mengisi salah satu dari 3 aktivitas.
   - Menambahkan visual progress bar di bagian atas popout modal.
5. **`src/components/MatriksTableView.tsx`**:
   - Menambahkan kolom visual progress bar kelengkapan pengisian untuk setiap baris matriks.
6. **`src/App.tsx` & `src/components/DashboardView.tsx`**:
   - Menghapus tombol *Input Data Matriks* dari header atas.
   - Menampilkan status Tahun & Semester di Top Header.
   - Menghapus dropdown daftar ganti akun demo di kanan atas untuk semua pengguna.
   - Memastikan pemilih tahun menyediakan opsi 2026 dan 2027.

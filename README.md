# 🏀 FIBA 3x3 Arena Scoreboard & Shot Clock Platform

Platform papan skor digital basket 3x3 dengan antarmuka presisi minimalis modern yang identik dengan konsol tablet/layar sentuh turnamen basket 3x3 resmi.

Dilengkapi dengan:
- ⏱️ **Timer Pertandingan (Kuning)** berakurasi sub-detik
- 🚨 **Shot Clock ("Shoot Lock" Merah)** 12 detik standar FIBA 3x3 (dengan tampilan persepuluh detik di bawah 5 detik, contoh: `4.7`)
- 🛑 **Fitur Nonaktifkan / Aktifkan Shot Clock ("Shoot Lock")**: Tombol toggle instan di layar, menu cepat [⏱], pengaturan [⚙], atau tombol pintas keyboard [<kbd>C</kbd>] untuk mematikan/menghidupkan shot clock sesuai kebutuhan (misal di detik-detik akhir pertandingan atau kategori tanpa shot clock).
- 🏆 **Logo Turnamen & Penyelenggara Rapi**: Penataan logo resmi (Universitas Negeri Malang / UM, IMONOKE, IMOCUP) dengan bingkai putih elegan yang proporsional di konsol operator dan layar penonton.
- 🎯 **Tombol Cepat Skor (+2, +1, -)** dan **Fouls (+, -)** di sisi luar yang sangat ergonomis
- ⚙️ **Ikon Pengaturan & ⏱️ Ikon Kontrol Waktu** di bagian atas
- ⛶ **Tampilan Tunggal Penuh (Maximized)**: Layar utama responsif 100% fullscreen untuk monitor, proyektor, atau TV arena.
- 🔊 **Audio Papan Skor Kustom**: Semua efek suara (Buzzer Shot Clock, Sirine Akhir Babak, Horn Manual, Peluit) telah diganti 100% menggunakan file audio buzzer pilihan Anda.

---

## 🚀 Cara Menjalankan

1. **Klik Ganda File Batch di Windows:**
   ```
   Buka_Scoreboard.bat
   ```
2. **Atau Buka Langsung File HTML:**
   Buka file `index.html` menggunakan browser Google Chrome, Microsoft Edge, Firefox, atau Safari.

---

## 🎮 Cara Menggunakan di Layar (Sentuh / Klik)

- **Mulai / Jeda Waktu**: Cukup ketuk/klik angka jam kuning (contoh: `2:06`).
- **Reset Shot Clock ke 12s**: Cukup ketuk/klik angka shot clock merah (contoh: `4.7`). Jika sedang nonaktif, mengetuknya akan otomatis mengaktifkannya kembali.
- **Nonaktifkan / Aktifkan Shot Clock**: Klik tombol pil status `SHOT CLOCK: AKTIF` / `SHOT CLOCK: NONAKTIF` di bawah angka shot clock, atau tekan tombol <kbd>C</kbd> pada keyboard.
- **Tambah Poin Cepat**: Ketuk langsung kotak skor tim atau tekan tombol `+1` / `+2` di sisi samping.
- **Koreksi Poin**: Tekan tombol `-` di samping skor.
- **Tambah Foul**: Ketuk kotak foul atau tekan tombol `+` di samping foul.
- **Ubah Nama Tim**: Klik tulisan `TEAM1` atau `TEAM2` untuk mengganti nama tim secara langsung.
- **Ikon ⚙️ (Pengaturan)**: Mengatur durasi babak, durasi shot clock, target skor 21 poin, dan suara.
- **Ikon ⏱️ (Kontrol Waktu)**: Menu cepat reset jam 10:00, reset shot clock 12s/14s, penambahan waktu, dan mode Overtime.
- **⚡ Aturan Babak Overtime (Selisih 2 Poin)**: Pada babak overtime, pemenang ditentukan oleh tim yang berhasil **unggul dengan selisih minimal 2 poin** atas lawannya (contoh: 16-18, 17-19, 20-18, dst.). Pertandingan terus berjalan selama selisih masih 0 atau 1 poin.
- **📋 Histori & Arsip Pertandingan**: Menyimpan otomatis setiap pertandingan yang selesai, mencatat riwayat poin/foul/timeout per detik (*play-by-play timeline*), serta fitur salin format laporan ringkasan untuk WhatsApp dengan sekali klik.
- **Tombol ⛶ Layar Penuh**: Memaksimalkan tampilan scoreboard memenuhi 100% layar TV / monitor arena.

---

## ⌨️ Daftar Tombol Pintas Keyboard (Operator Hotkeys)

| Tombol | Fungsi |
| :--- | :--- |
| <kbd>SPACE</kbd> | Mulai / Jeda Waktu Utama & Shot Clock bersamaan |
| <kbd>C</kbd> | **Aktifkan / Nonaktifkan Shot Clock ("Shoot Lock")** |
| <kbd>F</kbd> atau <kbd>S</kbd> | **Reset Shot Clock ke 12 Detik** (Resmi FIBA 3x3) |
| <kbd>D</kbd> | Reset Shot Clock ke 14 Detik (Offensive rebound) |
| <kbd>1</kbd> | Tim 1: Tambah +1 Poin |
| <kbd>2</kbd> | Tim 1: Tambah +2 Poin (Tembakan Luar Busur) |
| <kbd>Q</kbd> | Tim 1: Koreksi -1 Poin |
| <kbd>W</kbd> | Tim 1: Tambah +1 Foul |
| <kbd>8</kbd> | Tim 2: Tambah +1 Poin |
| <kbd>9</kbd> | Tim 2: Tambah +2 Poin (Tembakan Luar Busur) |
| <kbd>I</kbd> | Tim 2: Koreksi -1 Poin |
| <kbd>O</kbd> | Tim 2: Tambah +1 Foul |
| <kbd>B</kbd> atau <kbd>H</kbd> | Bunyikan Sirine / Horn Arena manual |
| <kbd>J</kbd> | Bunyikan Peluit Wasit (Whistle) |
| <kbd>Ctrl</kbd> + <kbd>Z</kbd> | Batalkan (Undo) aksi skor/foul terakhir |
| <kbd>ESC</kbd> | Tutup jendela modal / popup |

---

## 📁 Struktur Berkas

```
Score Board/
├── index.html           # Konsol Utama Scoreboard (Sesuai Desain Foto)
├── display.html         # Layar Khusus Penonton / TV Eksternal / Proyektor
├── Buka_Scoreboard.bat  # File eksekusi klik-ganda untuk Windows
├── server.js            # Server lokal statis (Node.js)
├── css/
│   ├── style.css        # Desain layout konsol sentuh minimalis
│   └── display.css      # Desain layar penuh penonton (auto-scaling)
├── js/
│   ├── audio.js         # Generator suara sintetis (Buzzer Horn & Peluit)
│   ├── state.js         # State data, sinkronisasi BroadcastChannel, Undo
│   ├── timer.js         # Mesin hitung waktu presisi tinggi (Delta Time)
│   └── app.js           # Pengendali interaksi sentuh, klik & hotkey
└── README.md            # Dokumentasi lengkap
```

# Whitebox Testing FINDKOM, Kelompok 4

Menguji prototipe `prototype/findkom.html` untuk UC-03 (Laporan Kehilangan) dan UC-08 (Serah Terima).
Kode tes mengikuti ID test case, jalur, dan temuan di PPT "Whitebox Testing FINDKOM Kelompok 4".

## Cara menjalankan di VS Code
1. Pasang Node.js LTS dari nodejs.org (versi 18 atau lebih baru), lalu restart VS Code.
2. VS Code: **File > Open Folder**, pilih folder `findkom-whitebox` ini.
3. Buka terminal: menu **Terminal > New Terminal**.
4. Ketik `npm install`, tunggu selesai (memasang jsdom).
5. Ketik `npm test`. Semua test case tampil dengan tanda ✔ atau ✖.

Perintah lain: `npm run test:uc03`, `npm run test:uc08`, `npm run coverage`.

## Hasil yang diharapkan: 21 tes, 18 lulus, 3 gagal
Tiga yang gagal memang disengaja: tes ditulis dengan hasil yang SEHARUSNYA, sehingga gagal menunjukkan cacat di prototipe.

| Tes | Temuan di PPT | Pesan gagal |
| --- | --- | --- |
| TC-03-06 | Temuan 1: deskripsi spasi lolos validasi | laporan tersimpan dengan deskripsi kosong |
| TC-03-07 | Temuan 2: gagal simpan tanpa pemberitahuan | pesan sukses tetap tampil |
| TC-08-06 | Temuan 3: syarat dua foto hanya di tampilan | laporan tertutup tanpa foto bukti |

Setelah prototipe diperbaiki, jalankan lagi: ketiganya harus berubah menjadi ✔.
Petunjuk perbaikan: trim deskripsi sebelum validasi (Temuan 1), `save()` mengembalikan status dan handler menampilkan "gagal" (Temuan 2), handler `done` memeriksa `S.ho.a && S.ho.b` (Temuan 3).

## Pemetaan ke PPT
| File | Isi | ID test case |
| --- | --- | --- |
| `tests/uc03-laporan-kehilangan.test.js` | handler kirim form, V(G)=4 | TC-03-01 sampai TC-03-08 |
| (file yang sama) | fungsi `tm()`, 7 kasus kondisi | TC-03-TM-1 sampai TC-03-TM-7 |
| `tests/uc08-serah-terima.test.js` | modal serah terima dan handler Selesaikan, V(G)=3 | TC-08-01 sampai TC-08-06 |
| `tests/helpers/app.js` | memuat HTML ke jsdom, aksi UI bersama | |

## Catatan
- ID **TC-03-02** (gedung atau ruang kosong) dan **TC-03-08** (nomor urut laporan) saya susun sendiri karena tidak tertulis di slide 6. Slide 10 menyebut 8 tes untuk UC-03, jadi dua nomor itu mengisi celahnya. Ubah jika di dokumen kalian berbeda.
- Slide 7 menyebut peringatan "bukti belum lengkap". Prototipe hanya menonaktifkan tombol dan tidak menampilkan teks peringatan, jadi TC-08-01 sampai 03 hanya memeriksa tombol.
- Temuan 4 (status RETURNED terlewati) berupa pengamatan kode dan tidak dibuat sebagai tes, agar jumlahnya tetap 21.
- Jika file HTML berada di tempat lain: `FINDKOM_HTML=lokasi\file.html npm test` (di PowerShell: `$env:FINDKOM_HTML="..."; npm test`).
- Tes ini menguji prototipe HTML. Jika nanti dibuat dengan Laravel, logika yang sama perlu diuji ulang dengan PHPUnit (lihat panduan sebelumnya).

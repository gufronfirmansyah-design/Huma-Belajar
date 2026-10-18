# HUMA BELAJAR — paket website siap unggah

Versi 1.5.0: baca `panduan.html` untuk pemasangan lengkap. Database kosong memakai `00-INSTALASI-BARU.sql`; database lama di-upgrade sampai `06-upgrade-1.5.sql`. Pasang fungsi `accounts`, gunakan username/password, dan ikuti panduan admin pertama. Google Console tidak diperlukan. Untuk layanan komersial, gunakan hosting yang sesuai seperti Cloudflare Pages; langkah GitHub Pages di bawah untuk demo yang sesuai ketentuannya.

Semua berkas di direktori ini sudah siap dijalankan. Tidak perlu npm install atau proses build di GitHub.

1. Unggah isi folder ini ke akar repository, termasuk `.nojekyll`.
2. Settings → Pages → Deploy from a branch → main → / (root).
3. Buka tautan Pages. Navigasi `#/...` dan aset relatif mendukung subfolder repository.
4. Buka `setup.html` untuk panduan dan pembuat konfigurasi publik.

Mode awal adalah demo. Konten contoh bukan soal resmi ujian. Database dan login nyata perlu Supabase yang dikonfigurasi dan diuji.

Untuk penyuntingan: `theme.css` = tampilan, `content.js` = kartu belajar, `features.js` = pendaftaran menu, `modules/` = fitur. Tambahan materi melalui panel tidak membutuhkan perubahan GitHub.

Gunakan paket lengkap untuk BAT, backend, panduan, dan pembaruan berdasarkan berkas berubah. Jika mengedit langsung di GitHub, salin kembali perubahan ke sumber lokal sebelum membuat paket berikutnya.

Periksa ketentuan GitHub Pages untuk penggunaan komersial dan transaksi sensitif: https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits

Repository ini hanya berisi frontend publik. Jangan menambahkan secret, cadangan database, data pribadi siswa, atau berkas materi privat.



import { user, isDemo, logout, resetDemo } from '../lib/store.js';
import { heading, esc, toast, icon } from '../lib/ui.js';
export function profilePage() {
  return `${heading('AKUN DAN PREFERENSI', 'Profil saya', 'Ruang belajar yang tumbuh bersamamu.')}<section class="panel narrow profile-card"><div class="avatar large">${esc(user.name[0])}</div><h2>${esc(user.name)}</h2><p>${esc(user.username || user.email)}</p><span class="pill">${{ student: 'Siswa', teacher: 'Guru kontributor', admin: 'Admin pusat', editor: 'Admin konten', observer: 'Admin sekolah · pemantau' }[user.role]}</span><hr><a class="lesson-row" href="#/classes">${icon('school')}<span>Pilih kelas belajar</span><span>→</span></a>${isDemo() || user.role === 'admin' ? `<a class="lesson-row" href="./setup.html">${icon('gear')}<span>Panduan pengaturan & koneksi</span><span>→</span></a>` : ''}<p class="muted">Perubahan hak kelas dan peran dilakukan oleh admin.</p>${!isDemo() ? '<a class="button secondary" href="#/password">Ganti password</a>' : ''}<button id="logout-page" class="button secondary">Keluar</button>${isDemo() ? '<hr><p>Semua data demo disimpan hanya di browser ini. Soal contoh bukan paket ujian resmi.</p><button id="reset-demo" class="button secondary">Atur ulang data demo</button>' : ''}</section>`;
}
export function bindProfile() {
  document.querySelector('#logout-page')?.addEventListener('click', async () => {
    try {
      await logout();
    } catch (e) {
      toast(e.message, true);
    }
  });
  document.querySelector('#reset-demo')?.addEventListener('click', () => {
    if (confirm('Hapus seluruh perubahan dan hasil demo di browser ini?')) resetDemo();
  });
}

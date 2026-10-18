import { accountRequest, acceptSession } from '../lib/accounts-api.js';
import { logout, refresh, user } from '../lib/store.js';
import { esc } from '../lib/ui.js';
const field = (name, label, type = 'text', extra = '') =>
  `<label>${label}<input name="${name}" type="${type}" required ${extra}></label>`;
export async function authPage(app, render, mode = 'login') {
  const change = mode === 'password',
    signup = mode === 'signup';
  app.innerHTML = `<main class="login-page"><a href="#/home" class="brand">HUMA BELAJAR</a><section class="panel"><span class="eyebrow">RUANG UNTUK BERTUMBUH</span><h1>${change ? 'Ganti password' : signup ? 'Mulai perjalanan belajarmu' : 'Selamat datang kembali'}</h1><p>${change ? 'Gunakan password baru yang hanya Anda ketahui. Password sementara wajib diganti sebelum belajar.' : signup ? 'Daftar sebagai siswa dengan kode undangan kelas dari sekolah.' : 'Masuk dengan username dan password. Tidak memerlukan akun Google.'}</p><form id="auth-form" class="auth-form">
  ${change ? field('current_password', 'Password saat ini', 'password', 'autocomplete="current-password"') : field('username', 'Username', 'text', 'autocomplete="username" minlength="3" maxlength="32" autocapitalize="none" spellcheck="false"')}
  ${signup ? field('name', 'Nama lengkap', 'text', 'maxlength="100" autocomplete="name"') + '<label>Sekolah<select name="school_id" id="signup-schools" required><option value="">Memuat sekolah…</option></select></label>' + field('code', 'Kode undangan kelas', 'text', 'maxlength="32" autocomplete="off"') : ''}
  ${field('password', change ? 'Password baru' : 'Password', 'password', `autocomplete="${signup || change ? 'new-password' : 'current-password'}" ${signup || change ? 'minlength="12"' : ''} maxlength="128"`)}
  ${signup || change ? field('repeat', 'Ulangi password', 'password', 'autocomplete="new-password" minlength="12" maxlength="128"') + '<p class="muted">Minimal 12 karakter. Boleh berupa kalimat yang mudah Anda ingat.</p>' : ''}
  <button class="button full" type="submit">${change ? 'Simpan password baru' : signup ? 'Buat akun siswa' : 'Masuk'} →</button><p id="auth-status" role="status" aria-live="polite"></p></form>
  ${change ? '<button id="auth-logout" class="button secondary">Keluar</button>' : `<p><a href="#/${signup ? 'login' : 'signup'}">${signup ? 'Sudah punya akun? Masuk' : 'Belum punya akun? Daftar siswa'}</a></p><a href="#/guest" class="button secondary full">Coba tanpa login</a><p class="muted">Lupa password? Hubungi admin pusat melalui sekolah. Guru dan admin mendapat akun dari admin pusat.</p>`}
  <a href="./panduan/02-AKUN-PASSWORD/index.html">Panduan akun dan password</a></section></main>`;
  const form = app.querySelector('form'),
    status = app.querySelector('#auth-status');
  const request_id = crypto.randomUUID();
  if (signup) {
    try {
      const schools = await accountRequest('schools');
      app.querySelector('#signup-schools').innerHTML =
        '<option value="">Pilih sekolah</option>' +
        schools.map((s) => `<option value="${esc(s.id)}">${esc(s.name)}</option>`).join('');
    } catch (e) {
      status.textContent = e.message;
    }
  }
  app.querySelector('#auth-logout')?.addEventListener('click', logout);
  form.onsubmit = async (e) => {
    e.preventDefault();
    const values = Object.fromEntries(new FormData(form));
    if ((signup || change) && values.password !== values.repeat) {
      status.textContent = 'Pengulangan password belum sama.';
      return;
    }
    const button = form.querySelector('button');
    button.disabled = true;
    status.textContent = 'Memproses…';
    try {
      const result = await accountRequest(
        change ? 'change_password' : signup ? 'signup' : 'login',
        { ...values, request_id }
      );
      await acceptSession(result.session);
      await refresh();
      form.reset();
      location.hash = '/home';
      await render();
    } catch (error) {
      status.textContent = error.message;
    } finally {
      button.disabled = false;
    }
  };
}

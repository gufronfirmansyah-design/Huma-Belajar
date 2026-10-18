import {
  init,
  data,
  user,
  isDemo,
  setDemoRole,
  currentClass,
  setClass,
  login,
  logout
} from './lib/store.js';
import { esc, icon, toast, empty } from './lib/ui.js';
import { featureFor, allowedFeatures } from './features.js';

const app = document.querySelector('#app');
let generation = 0;
const brand = () =>
  `<a href="#/home" class="brand"><span class="brand-mark">${icon('school')}</span><span>HUMA<small>BELAJAR</small></span></a>`;
const nav = (feature, current) =>
  `<a href="#/${feature.key}" class="nav-item ${current === feature.key ? 'active' : ''}" ${current === feature.key ? 'aria-current="page"' : ''}>${icon(feature.icon)}<span>${esc(feature.label)}</span></a>`;

async function render() {
  const gen = ++generation;
  let parts;
  try {
    parts = (location.hash.replace(/^#\/?/, '') || 'home').split('/').map(decodeURIComponent);
  } catch {
    parts = ['missing'];
  }
  const [route, id, edit] = parts;
  if (route === 'guest') {
    try {
      const guest = await import('./modules/guest.js');
      const html = await guest.guestPage(id);
      if (gen !== generation) return;
      app.innerHTML = html;
      await guest.bindGuest();
    } catch (e) {
      app.innerHTML = `<main class="guest-shell"><h1>Contoh belum dapat dimuat</h1><p>${esc(e.message)}</p><a href="#/home">Kembali ke login</a></main>`;
    }
    return;
  }
  if (!user) {
    await (
      await import('./modules/auth.js')
    ).authPage(app, render, route === 'signup' ? 'signup' : 'login');
    return;
  }
  if (user.must_change || (route === 'password' && !isDemo())) {
    await (await import('./modules/auth.js')).authPage(app, render, 'password');
    return;
  }
  if (!user.active) {
    const schools = await import('./modules/schools.js');
    app.innerHTML = `<main class="onboarding">${brand()}<p>Masuk sebagai ${esc(user.email)}</p>${schools.schoolsPage()}<button id="refresh-access" class="button secondary">Periksa status terbaru</button> <button id="logout" class="button">Keluar</button></main>`;
    await schools.bindSchools(render);
    document.querySelector('#refresh-access').onclick = () => location.reload();
    document.querySelector('#logout').onclick = () => logout().catch((e) => toast(e.message, true));
    return;
  }
  const roleLabel = {
    student: 'Siswa',
    teacher: 'Guru kontributor',
    admin: 'Admin pusat',
    editor: 'Admin konten',
    observer: 'Admin sekolah · pemantau'
  }[user.role];
  const feature = featureFor(route);
  let content;
  try {
    if (!feature)
      content = empty('Halaman tidak ditemukan', 'Gunakan menu untuk kembali ke ruang belajar.');
    else if (feature.roles && !feature.roles.includes(user.role))
      content = empty('Akses tidak diizinkan');
    else content = await feature.render({ route, id, edit });
  } catch (e) {
    content =
      empty('Halaman belum dapat dimuat', e.message) +
      '<button class="button" id="retry-page">Coba lagi</button>';
  }
  if (gen !== generation) return;
  const selected = feature?.key;
  const items = allowedFeatures(user.role);
  const mobile = items.filter((f) => f.mobile && (user.role === 'student' || f.key !== 'profile'));
  app.innerHTML = `
 <a class="skip-link" href="#main">Lewati ke isi halaman</a>
 <div class="layout" data-page="${esc(route)}">
  <aside class="sidebar">
   ${brand()}<div class="sidebar-caption">JELAJAHI RUANG BELAJAR</div>
   <nav aria-label="Navigasi utama">${items
     .filter((f) => !f.group)
     .map((f) => nav(f, selected))
     .join('')}</nav>
   ${
     items.some((f) => f.group)
       ? `<div class="sidebar-caption">RUANG PENGELOLA</div><nav aria-label="Pengelolaan">${items
           .filter((f) => f.group)
           .map((f) => nav(f, selected))
           .join('')}</nav>`
       : ''
   }
   <div class="sidebar-bottom"><div class="sidebar-note">${icon('spark')}<b>Sedikit demi sedikit,<br>jadi lebih hebat.</b><p>Terus mencoba. Perjalanan belajarmu berarti.</p></div>
    ${isDemo() || user.role === 'admin' ? '<a class="setup-link" href="./setup.html">Pengaturan & panduan ↗</a>' : ''}
    <a class="setup-link" href="#/guest">Coba tanpa login ↗</a><button id="logout" class="logout">${icon('logout')} Keluar</button><small>HUMA BELAJAR · Ruang untuk bertumbuh</small>
   </div>
  </aside>
  <div class="workspace">
   <header class="topbar">
    <div class="mobile-brand">${brand()}</div>
    <div class="breadcrumb">Ruang belajar <span>/</span> <b>${esc(feature?.label || 'Halaman')}</b></div>
    <div class="topbar-right"><span class="online-dot" id="connection">${navigator.onLine ? 'Terhubung' : 'Koneksi terputus'}</span><a class="profile-mini" href="#/profile" aria-label="Buka profil"><span class="avatar">${esc(user.name[0])}</span><span>${esc(user.name)}<small>${roleLabel}</small></span></a></div>
   </header>
   ${isDemo() ? `<div class="demo-bar"><span><b>MODE DEMO</b> Data contoh, tersimpan di perangkat ini</span><label>Coba sebagai <select id="demo-role" aria-label="Peran demo"><option value="student" ${user.role === 'student' ? 'selected' : ''}>Siswa</option><option value="teacher" ${user.role === 'teacher' ? 'selected' : ''}>Guru</option><option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Admin pusat</option><option value="editor" ${user.role === 'editor' ? 'selected' : ''}>Admin konten</option><option value="observer" ${user.role === 'observer' ? 'selected' : ''}>Admin sekolah</option></select></label></div>` : ''}
   <main id="main" tabindex="-1">
    <div class="context-row"><a href="#/schools">${icon('school')} ${esc(data.schools?.find((s) => s.id === data.school_id)?.name || 'Pilih sekolah')}</a><label class="class-picker">${icon('school')}<select id="class-picker" aria-label="Kelas aktif">${data.classes.map((c) => `<option value="${esc(c.id)}" ${c.id === currentClass()?.id ? 'selected' : ''}>${esc(c.title)}</option>`).join('') || '<option>Belum ada kelas</option>'}</select></label></div>
    ${content}
    <footer class="page-footer"><span>HUMA BELAJAR</span><span>Ruang bertumbuh, tempat belajar.</span></footer>
   </main>
  </div>
  <nav class="mobile-nav" aria-label="Navigasi seluler">${mobile.map((f) => nav(f, selected)).join('')}</nav>
 </div>`;
  document.querySelector('#class-picker').onchange = (e) => {
    setClass(e.target.value);
    if (user.role === 'observer') {
      if (location.hash === '#/progress') render();
      else location.hash = '/progress';
      return;
    }
    if (location.hash === '#/learn') render();
    else location.hash = '/learn';
  };
  document.querySelector('#demo-role')?.addEventListener('change', (e) => {
    setDemoRole(e.target.value);
    if (location.hash === '#/home') render();
    else location.hash = '/home';
  });
  document.querySelector('#logout').onclick = () => logout().catch((e) => toast(e.message, true));
  document.querySelector('#retry-page')?.addEventListener('click', render);
  document.querySelector('.skip-link').onclick = (e) => {
    e.preventDefault();
    document.querySelector('#main').focus();
  };
  if (feature && (!feature.roles || feature.roles.includes(user.role)))
    await feature.bind?.(render);
}

window.addEventListener('hashchange', () => {
  render();
  window.scrollTo(0, 0);
});
window.addEventListener('offline', () => {
  const el = document.querySelector('#connection');
  if (el) el.textContent = 'Koneksi terputus';
  toast('Koneksi terputus. Isian tetap di halaman; penyimpanan online memerlukan internet.', true);
});
window.addEventListener('online', () => {
  const el = document.querySelector('#connection');
  if (el) el.textContent = 'Terhubung';
  toast('Koneksi kembali. Coba ulang penyimpanan yang belum berhasil.');
});
try {
  await init();
  await render();
} catch (e) {
  app.innerHTML = `<main class="startup">${brand()}<h2>Aplikasi belum dapat dibuka</h2><p>${esc(e.message)}</p><button id="reload" class="button">Coba lagi</button> <a class="button secondary" href="./setup.html">Buka bantuan pengaturan</a></main>`;
  document.querySelector('#reload').onclick = () => location.reload();
  const exit = document.createElement('button');
  exit.className = 'button secondary';
  exit.textContent = 'Keluar dari sesi';
  exit.onclick = () => logout().catch((e) => toast(e.message, true));
  app.querySelector('main').append(exit);
}

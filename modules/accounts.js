import { data, isDemo, refresh } from '../lib/store.js';
import { heading, esc } from '../lib/ui.js';
import { accountRequest } from '../lib/accounts-api.js';
import { readAccounts } from '../lib/account-import.js';
let rows = [],
  results = [],
  accounts = [],
  busy = false,
  unsaved = false;
window.addEventListener('beforeunload', (e) => {
  if (busy || unsaved) {
    e.preventDefault();
    e.returnValue = '';
  }
});
const classes = () => data.classes.filter((c) => !c.school_id || c.school_id === data.school_id);
const target = () => document.querySelector('#account-class').value;
export function accountsPage() {
  return `${heading('PENGELOLAAN AKUN', 'Akun pengguna', 'Hanya admin pusat dapat membuat atau mereset akun. Peran dan penugasan tetap diatur melalui Sekolah & Akses dan Katalog bersama.')}
 <section class="panel"><p>${isDemo() ? '<b>MODE DEMO — pembuatan akun nyata dinonaktifkan.</b>' : 'Password sementara ditampilkan setelah akun berhasil dibuat. Bagikan secara pribadi dan jangan unggah hasilnya ke GitHub.'}</p>
 <label>Kelas tujuan di sekolah aktif<select id="account-class"><option value="">Tanpa kelas — untuk calon guru/pengelola</option>${classes()
   .map((c) => `<option value="${esc(c.id)}">${esc(c.title)}</option>`)
   .join('')}</select></label>
 <form id="create-account" class="auth-form"><h2>Buat satu akun</h2><label>Nama lengkap<input name="name" required maxlength="100"></label><label>Username<input name="username" required minlength="3" maxlength="32" autocapitalize="none"></label><button class="button" ${isDemo() ? 'disabled' : ''}>Buat akun</button></form>
 </section><section class="panel"><h2>Impor siswa dari Excel</h2><p>Satu file untuk satu kelas. Isi 1–100 siswa; username unik di seluruh aplikasi. Tidak perlu menulis password di Excel.</p><a class="button secondary" href="./templates/Template-Akun-Siswa.xlsx" download>Unduh template Excel</a><label>File XLSX<input id="account-file" type="file" accept=".xlsx"></label><button id="account-preview" class="button secondary">Periksa & pratinjau</button><div id="account-preview-content"></div><button id="account-import" class="button" disabled>Buat akun dari pratinjau</button></section>
 <section class="panel"><h2>Hasil pembuatan / reset</h2><p id="account-status" role="status" aria-live="polite"></p><div id="account-results"></div><button id="account-download" class="button secondary" disabled>Unduh hasil privat (CSV)</button><button id="account-clear" class="button secondary">Bersihkan hasil dari layar</button></section>
 <section class="panel"><h2>Akun terdaftar</h2><button id="account-load" class="button secondary" ${isDemo() ? 'disabled' : ''}>Muat daftar akun</button><div id="account-list"></div></section><p><a href="./panduan/02-AKUN-PASSWORD/index.html">Panduan akun, impor, pemindahan akun Google, dan lupa password →</a></p>`;
}
function showResults() {
  if (!document.querySelector('#account-results')) return;
  document.querySelector('#account-results').innerHTML = results
    .map(
      (r) =>
        `<div class="lesson-row"><div><b>${esc(r.username || r.name || 'Akun')}</b><p>${esc(r.message || '')}</p>${r.password ? `<label>Password sementara<input readonly value="${esc(r.password)}" aria-label="Password sementara ${esc(r.username)}"></label>` : ''}</div></div>`
    )
    .join('');
  document.querySelector('#account-download').disabled = !results.length;
}
const report = (e) => {
  const status = document.querySelector('#account-status');
  if (status) status.textContent = e instanceof Error ? e.message : e;
};
async function run(button, work) {
  if (busy) return;
  busy = true;
  button.disabled = true;
  try {
    await work();
  } catch (e) {
    report(e);
  } finally {
    busy = false;
    button.disabled = false;
  }
}
export function bindAccounts() {
  showResults();
  const single = document.querySelector('#create-account');
  let request_id = crypto.randomUUID();
  single.onsubmit = (e) => {
    e.preventDefault();
    run(single.querySelector('button'), async () => {
      const values = Object.fromEntries(new FormData(single));
      const result = await accountRequest('create', {
        ...values,
        request_id,
        school_id: data.school_id,
        class_id: target()
      });
      results.push({ ...values, ...result });
      unsaved = true;
      showResults();
      report('Hasil tersedia di bawah.');
      request_id = crypto.randomUUID();
      single.reset();
      await refresh();
    });
  };
  document.querySelector('#account-preview').onclick = (e) =>
    run(e.target, async () => {
      rows = [];
      document.querySelector('#account-import').disabled = true;
      const parsed = await readAccounts(document.querySelector('#account-file').files[0]);
      rows = parsed.map((r) => ({ ...r, request_id: crypto.randomUUID() }));
      document.querySelector('#account-preview-content').innerHTML =
        '<p>' +
        rows.length +
        ' siswa. Periksa nama, username, dan kelas sebelum melanjutkan.</p>' +
        rows
          .map((r) => `<div class="lesson-row">${esc(r.name)} <b>${esc(r.username)}</b></div>`)
          .join('');
      document.querySelector('#account-import').disabled = isDemo();
      report('Pratinjau valid. Belum ada akun yang dibuat.');
    });
  document.querySelector('#account-import').onclick = (e) =>
    run(e.target, async () => {
      const class_id = target(),
        school_id = data.school_id;
      if (!class_id) throw Error('Pilih kelas tujuan untuk impor siswa.');
      if (!rows.length) throw Error('Periksa file dahulu.');
      const className = classes().find((c) => c.id === class_id)?.title || class_id;
      if (
        !confirm(
          `Buat ${rows.length} akun siswa di kelas ${className}? Username yang sudah ada tidak akan diubah.`
        )
      )
        return;
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        if (row.done) continue;
        report(`Memproses ${i + 1} dari ${rows.length}…`);
        try {
          const result = await accountRequest('create', { ...row, class_id, school_id });
          results.push({ ...row, ...result });
          row.done = true;
        } catch (error) {
          results.push({ ...row, message: 'Belum berhasil: ' + error.message });
        }
        unsaved = true;
        showResults();
      }
      report(
        `${rows.filter((r) => r.done).length}/${rows.length} baris selesai. Baris gagal dapat dicoba ulang dengan tombol yang sama. Unduh hasil privat sebelum menutup halaman.`
      );
      await refresh();
    });
  document.querySelector('#account-download').onclick = () => {
    const cell = (v) =>
      '"' +
      String(v || '')
        .replace(/^\s*[=+@-]/, "'$&")
        .replaceAll('"', '""') +
      '"';
    const csv =
      '\uFEFF' +
      [
        ['nama', 'username', 'password_sementara', 'hasil'],
        ...results.map((r) => [r.name, r.username, r.password, r.message])
      ]
        .map((r) => r.map(cell).join(','))
        .join('\r\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'PRIVAT-Akun-HUMA.csv';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    unsaved = false;
  };
  document.querySelector('#account-clear').onclick = () => {
    if (busy) return;
    if (
      results.length &&
      !confirm(
        'Bersihkan hasil termasuk password sementara dari layar? Pastikan sudah dibagikan atau disimpan secara privat.'
      )
    )
      return;
    results = [];
    unsaved = false;
    showResults();
  };
  document.querySelector('#account-load').onclick = (e) =>
    run(e.target, async () => {
      accounts = await accountRequest('list');
      document.querySelector('#account-list').innerHTML = accounts
        .map(
          (a) =>
            `<div class="lesson-row"><div><b>${esc(a.name)}</b><p>${esc(a.username || 'Akun lama — username belum diatur')} ${a.must_change ? '· wajib ganti password' : ''}</p></div><button class="button secondary" data-account="${esc(a.id)}" data-operation="${a.username ? 'reset_password' : 'migrate'}">${a.username ? 'Reset password' : 'Buat username'}</button></div>`
        )
        .join('');
      document.querySelectorAll('[data-account]').forEach(
        (button) =>
          (button.onclick = () =>
            run(button, async () => {
              const a = accounts.find((a) => a.id === button.dataset.account),
                op = button.dataset.operation;
              let username = a.username;
              if (op === 'migrate') {
                username = prompt('Username baru untuk akun lama ini (UUID dan progres tetap):');
                if (!username) return;
              }
              if (
                !confirm(
                  `${op === 'migrate' ? 'Tetapkan username' : 'Reset password'} untuk ${a.name}?`
                )
              )
                return;
              const result = await accountRequest(op, {
                user_id: a.id,
                username,
                name: a.name,
                request_id: crypto.randomUUID()
              });
              results.push({ ...a, username, ...result });
              unsaved = true;
              showResults();
              report(result.message || 'Selesai. Muat ulang daftar akun untuk langkah berikutnya.');
            }))
      );
    });
}

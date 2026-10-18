import { data, user, schoolAction, isDemo } from '../lib/store.js';
import { esc, heading, toast } from '../lib/ui.js';

const opts = (rows, selected, label = 'name') =>
  rows
    .map(
      (r) =>
        `<option value="${esc(r.id)}" ${r.id === selected ? 'selected' : ''}>${esc(r[label])}</option>`
    )
    .join('');
export function schoolsPage() {
  const school = data.schools?.find((s) => s.id === data.school_id);
  const mine = data.my_schools?.find((m) => m.school_id === data.school_id);
  return `${heading('SEKOLAH & AKSES', 'Ruang sekolahmu', 'Pilih sekolah, bergabung ke kelas, atau kelola akses pembelajaran.')}<p class="notice">${isDemo() ? 'Simulasi lokal. Kode demo bukan kode layanan nyata.' : 'Masuk dengan username dan password. Akses kelas ditentukan oleh sekolah.'}</p>
  <section class="panel"><h2>Nama saya</h2><form data-school-op="profile_name"><label>Nama lengkap<input name="name" value="${esc(user.name)}" required maxlength="100"></label><button class="button">Simpan nama</button><p class="form-error" role="alert"></p></form></section><section class="panel"><h2>Sekolah aktif</h2><form data-school-op="select"><label>Nama sekolah<select name="school_id" required><option value="">Pilih sekolah</option>${opts(
    (data.schools || []).filter((s) => s.active),
    data.school_id
  )}</select></label><button class="button" type="submit">Buka sekolah</button><p class="form-error" role="alert"></p></form></section>
  ${school ? `<section class="panel"><h2>${esc(school.name)}</h2><p>Status akses: <strong>${user.active ? esc({ admin: 'Admin pusat', teacher: 'Guru kontributor', student: 'Siswa', editor: 'Admin konten', observer: 'Admin sekolah · pemantau' }[user.role]) : esc({ pending: 'Menunggu persetujuan', disabled: 'Dinonaktifkan', rejected: 'Ditolak' }[mine?.status] || 'Belum bergabung')}</strong></p>${!mine && !user.central_admin && !['teacher', 'editor', 'observer'].includes(user.role) ? '<form data-school-op="request_teacher"><p>Untuk calon guru atau pemantau sekolah: ajukan akses. Tim admin akan menetapkan peran yang sesuai.</p><button class="button secondary">Ajukan akses guru / pemantau</button><p class="form-error" role="alert"></p></form>' : ''}${(!mine || (mine.role === 'student' && mine.status === 'active')) && !user.central_admin && !['teacher', 'editor', 'observer'].includes(user.role) ? '<form data-school-op="join"><label>Kode undangan kelas<input name="code" required autocomplete="off" maxlength="64" placeholder="Tempel kode dari sekolah"></label><button class="button" type="submit">Gabung kelas</button><p class="form-error" role="alert"></p></form>' : ''}</section>` : ''}
  ${user.central_admin ? `<section class="panel"><h2>Daftar sekolah · admin pusat</h2><form data-school-op="save_school"><label>Nama sekolah baru<input name="name" required maxlength="200"></label><button class="button">Daftarkan sekolah</button><p class="form-error" role="alert"></p></form>${(data.schools || []).map((s) => `<form data-school-op="save_school" class="school-row"><input type="hidden" name="school_id" value="${esc(s.id)}"><label>Nama sekolah<input name="name" value="${esc(s.name)}" required maxlength="200"></label><label>Status<select name="active"><option value="true" ${s.active ? 'selected' : ''}>Aktif</option><option value="false" ${!s.active ? 'selected' : ''}>Nonaktif</option></select></label><button class="button secondary">Simpan</button><p class="form-error" role="alert"></p></form>`).join('')}</section>` : ''}
  ${
    user.active && user.role === 'admin'
      ? `<section class="panel"><h2>Persetujuan sekolah & peran pengguna</h2><p>Setelah menyetujui guru, buka <a href="#/manage/assignments">Penugasan Guru</a> untuk menetapkan mapel katalog bersama. Menyetujui guru saja belum membuka materi kelas.</p>${
          (data.profiles || [])
            .filter((p) => p.id !== user.id)
            .map(
              (p) =>
                `<form data-school-op="review" class="school-row"><input type="hidden" name="user_id" value="${esc(p.id)}"><p><b>${esc(p.name)}</b><br>${esc(p.email)}<br>${esc(p.school_status || 'active')}</p><label>Peran<select name="role">${['student', 'teacher', ...(user.central_admin ? ['admin'] : [])].map((r) => `<option value="${r}" ${r === p.role ? 'selected' : ''}>${{ student: 'Siswa', teacher: 'Guru', admin: 'Admin sekolah (hanya memantau)' }[r]}</option>`).join('')}</select></label><label>Keputusan<select name="status"><option value="active">Setujui / aktifkan</option><option value="rejected">Tolak</option><option value="disabled">Nonaktifkan</option></select></label><button class="button">Simpan keputusan</button><p class="form-error" role="alert"></p></form>`
            )
            .join('') || '<p>Belum ada permohonan.</p>'
        }</section>
  <section class="panel"><h2>Kode undangan kelas</h2><p>Kode berlaku 1–30 hari sesuai pilihan admin. Membuat kode baru membatalkan kode lama; siswa yang sudah bergabung tetap terdaftar.</p><form data-school-op="create_code"><label>Kelas<select name="class_id" required>${opts(data.classes, null, 'title')}</select></label><label>Masa berlaku (hari)<input type="number" name="days" min="1" max="30" value="7" required></label><button class="button">Buat / ganti kode</button><p class="form-error" role="alert"></p></form><div id="generated-code" role="status"></div><form data-school-op="revoke_code"><label>Cabut kode kelas<select name="class_id" required>${opts(data.classes, null, 'title')}</select></label><button class="button secondary">Cabut kode</button><p class="form-error" role="alert"></p></form></section>`
      : ''
  }`;
}
export function bindSchools(render) {
  document.querySelectorAll('[data-school-op]').forEach(
    (form) =>
      (form.onsubmit = async (e) => {
        e.preventDefault();
        const operation = form.dataset.schoolOp;
        if (
          ['review', 'revoke_code'].includes(operation) &&
          !confirm('Terapkan perubahan akses ini?')
        )
          return;
        const button = form.querySelector('button');
        button.disabled = true;
        const error = form.querySelector('[role=alert]');
        error.textContent = '';
        try {
          const values = Object.fromEntries(new FormData(form));
          if ('active' in values) values.active = values.active === 'true';
          const result = await schoolAction(operation, {
            school_id: operation === 'save_school' ? null : data.school_id,
            ...values
          });
          if (result?.code) {
            const box = document.querySelector('#generated-code');
            box.replaceChildren();
            const label = document.createElement('label');
            label.textContent =
              'Salin kode ini dan bagikan kepada siswa kelas yang sesuai. Kode tidak dapat dilihat lagi setelah halaman ditutup.';
            const input = document.createElement('input');
            input.readOnly = true;
            input.value = result.code;
            input.onclick = () => input.select();
            label.append(input);
            box.append(label);
            input.select();
          } else {
            await render();
            toast('Perubahan tersimpan.');
          }
        } catch (e) {
          error.textContent = e.message;
        } finally {
          button.disabled = false;
        }
      })
  );
}

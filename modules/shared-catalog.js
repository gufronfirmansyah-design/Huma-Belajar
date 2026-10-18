import { data, user, schoolAction } from '../lib/store.js';
import { esc, heading, toast } from '../lib/ui.js';
const opts = (rows) =>
  rows
    .map(
      (r) =>
        `<option value="${esc(r.id)}">${esc(r.title || r.name)}${r.grade ? ' · ' + esc(r.grade) : ''}</option>`
    )
    .join('');
export function sharedCatalogPage() {
  return `${heading('KATALOG BERSAMA', 'Satu materi, banyak sekolah', 'Materi dibuat oleh tim konten. Kelas sekolah memakai mapel yang dipilih tim aplikasi.')}<a class="button secondary" href="#/guest">Lihat sebagai pengunjung ↗</a>
 ${
   user.role === 'admin'
     ? `<section class="panel"><h2>Tim konten</h2><form data-catalog-op="team_role"><label>Akun<select name="user_id" required>${opts(data.profiles.filter((p) => p.id !== user.id && !p.central_admin))}</select></label><label>Peran tim<select name="role"><option value="teacher">Guru kontributor</option><option value="editor">Admin konten</option><option value="none">Cabut akses tim konten</option></select></label><button class="button">Simpan peran tim</button><p role="alert"></p></form><p>Admin konten mengelola seluruh katalog. Guru kontributor masih perlu <a href="#/manage/assignments">penugasan mapel</a>. Peran ini lintas sekolah; tidak memberi akses nilai siswa.</p></section>
 <section class="panel"><h2>Mapel yang digunakan kelas</h2><p>Pilih sekolah terlebih dahulu melalui Sekolah & Akses. Satu mapel dapat digunakan banyak kelas.</p><form data-catalog-op="link_course"><label>Kelas sekolah aktif<select name="class_id" required>${opts(data.classes)}</select></label><label>Mapel katalog<select name="course_id" required>${opts(data.courses)}</select></label><label>Tindakan<select name="active"><option value="true">Gunakan di kelas</option><option value="false">Hentikan penggunaan di kelas</option></select></label><button class="button">Simpan hubungan kelas</button><p role="alert"></p></form><ul>${(data.course_links || []).map((l) => `<li>${esc(data.classes.find((c) => c.id === l.class_id)?.title)} → ${esc(data.courses.find((c) => c.id === l.course_id)?.title)}</li>`).join('')}</ul></section>`
     : ''
 }
 <section class="panel"><h2>Contoh publik setiap mapel</h2><p>Pilih satu subbab urutan 1 dari bab urutan 1. Materi dan soal latihan yang terkait subbab ini akan menjadi publik, termasuk kunci latihan contoh. Jangan pilih soal ujian rahasia. Berkas privat tidak ditampilkan.</p><form data-catalog-op="preview"><label>Mapel<select name="course_id" id="preview-course" required>${opts(data.courses)}</select></label><label>Subbab pertama Bab 1<select name="lesson_id" id="preview-lesson" required></select></label><button class="button">Tetapkan contoh publik</button><p role="alert"></p></form><ul>${(data.course_previews || []).map((p) => `<li>${esc(data.courses.find((c) => c.id === p.course_id)?.title)} → ${esc(data.lessons.find((l) => l.id === p.lesson_id)?.title)}</li>`).join('')}</ul><p>Pastikan mapel, bab, subbab, materi, dan soal berstatus Terbit. Perubahan urutan atau status dapat menutup contoh sampai diperiksa ulang.</p></section>`;
}
export function bindSharedCatalog(render) {
  const course = document.querySelector('#preview-course'),
    lesson = document.querySelector('#preview-lesson');
  const filter = () => {
    lesson.innerHTML = opts(
      data.lessons.filter(
        (l) =>
          l.course_id === course.value &&
          Number(l.position || 1) === 1 &&
          data.chapters.some((c) => c.id === l.chapter_id && Number(c.position || 1) === 1)
      )
    );
  };
  if (course) {
    course.onchange = filter;
    filter();
  }
  document.querySelectorAll('[data-catalog-op]').forEach(
    (form) =>
      (form.onsubmit = async (e) => {
        e.preventDefault();
        if (!confirm('Terapkan perubahan ini?')) return;
        const button = form.querySelector('button'),
          error = form.querySelector('[role=alert]');
        button.disabled = true;
        error.textContent = '';
        try {
          const values = Object.fromEntries(new FormData(form));
          if ('active' in values) values.active = values.active === 'true';
          await schoolAction(form.dataset.catalogOp, { school_id: data.school_id, ...values });
          await render();
          toast('Pengaturan katalog tersimpan.');
        } catch (e) {
          error.textContent = e.message;
        } finally {
          button.disabled = false;
        }
      })
  );
}

import { data, user, action, upload, isDemo, config } from '../lib/store.js';
import { mathText, esc, heading, empty, formData, toast, blocks, date } from '../lib/ui.js';
import { validateBlocks, validateTitle, validateFile } from '../lib/validation.js';
import { mediaSource, mediaPreview } from '../lib/media.js';
const labels = {
  courses: 'Mata Pelajaran',
  chapters: 'Bab',
  lessons: 'Subbab',
  materials: 'Materi',
  questions: 'Bank Soal',
  quizzes: 'Paket Latihan',
  profiles: 'Pengguna',
  classes: 'Kelas',
  memberships: 'Keanggotaan Siswa',
  assignments: 'Penugasan Guru',
  audit: 'Catatan Aktivitas'
};
const teacher = ['chapters', 'lessons', 'materials', 'questions', 'quizzes'];
function allowed(entity) {
  return (
    user.role === 'admin' ||
    (user.role === 'teacher' && teacher.includes(entity)) ||
    (user.role === 'editor' && ['courses', ...teacher].includes(entity))
  );
}
const options = (list, selected, label = 'title') =>
  list
    .map(
      (x) =>
        `<option value="${esc(x.id)}" ${x.id === selected ? 'selected' : ''}>${esc(x[label] || x.name || x.id)}</option>`
    )
    .join('');
const field = (name, label, value = '', type = 'text', extra = '') =>
  `<label>${label}<input name="${name}" type="${type}" value="${esc(value)}" ${extra}></label>`;
const select = (name, label, list, value, key) =>
  `<label>${label}<select name="${name}" required>${options(list, value, key)}</select></label>`;
function titleOf(entity, row) {
  if (entity === 'memberships')
    return `${data.profiles.find((p) => p.id === row.student_id)?.name || row.student_id} → ${data.classes.find((c) => c.id === row.class_id)?.title || ''}`;
  if (entity === 'assignments')
    return `${data.profiles.find((p) => p.id === row.teacher_id)?.name || row.teacher_id} → ${data.courses.find((c) => c.id === row.course_id)?.title || ''}`;
  return row.title || row.name || row.action || row.id;
}
export function manage(entity = 'materials', editId) {
  if (entity === 'profiles')
    return `${heading('PENGGUNA', 'Pengelolaan akses sekolah', 'Persetujuan dan penonaktifan sekarang dikelola per sekolah.')}<a class="button" href="#/schools">Buka Sekolah & Akses →</a>`;
  if (!allowed(entity)) return empty('Akses tidak diizinkan');
  const tabs =
    user.role === 'admin'
      ? Object.keys(labels)
      : user.role === 'editor'
        ? ['courses', ...teacher]
        : teacher;
  const records = data[entity] || [];
  const record = editId ? records.find((x) => x.id === editId) : null;
  return `${heading(user.role === 'admin' ? 'PANEL ADMIN' : 'RUANG GURU', labels[entity] || 'Pengelolaan', 'Kelola pembelajaran dengan rapi, satu bagian setiap kali.')}${entity === 'questions' ? '<p><a class="button secondary" href="#/bank">Impor Excel / ZIP & unduh template</a></p>' : ''}<div class="tabs manage-tabs">${tabs.map((t) => `<a href="#/manage/${t}" class="${t === entity ? 'active' : ''}">${labels[t]}</a>`).join('')}</div>${editId === 'new' || (record && entity !== 'audit') ? editor(entity, record || {}) : `<section class="panel"><div class="section-heading"><h2>${labels[entity]}</h2>${entity === 'audit' ? '' : `<a class="button" href="#/manage/${entity}/new">+ Tambah</a>`}</div>${records.length ? `<div class="table-wrap"><table><thead><tr><th>Nama / tindakan</th><th>Status / rincian</th><th>Aksi</th></tr></thead><tbody>${records.map((r) => `<tr><td><strong>${esc(titleOf(entity, r))}</strong>${r.email ? `<small>${esc(r.email)}</small>` : ''}</td><td>${esc(r.status || r.role || r.year || (r.active === false ? 'Nonaktif' : null) || (r.created_at ? date(r.created_at) : 'Aktif'))}</td><td>${entity === 'audit' ? '—' : `<a href="#/manage/${entity}/${esc(r.id)}">Edit →</a>`}</td></tr>`).join('')}</tbody></table></div>` : empty('Belum ada data')}</section>`}`;
}
function editor(entity, r) {
  let html = '';
  const courses = data.courses
    .filter((c) => c.status !== 'archived')
    .map((c) => ({
      ...c,
      title: `${c.title} — ${c.grade || 'Tingkat belum diatur'}`
    }));
  if (!['profiles', 'memberships', 'assignments'].includes(entity))
    html += field('title', 'Judul / nama', r.title || '', 'text', 'required maxlength="200"');
  if (['chapters', 'lessons', 'materials', 'questions', 'quizzes', 'assignments'].includes(entity))
    html += select('course_id', 'Mata pelajaran', courses, r.course_id);
  if (entity === 'courses')
    html +=
      field(
        'grade',
        'Jenjang / tingkat kelas (misalnya SMA/SMK · X)',
        r.grade || '',
        'text',
        'required maxlength="100"'
      ) +
      field('description', 'Deskripsi', r.description) +
      select(
        'color',
        'Warna kartu',
        ['blue', 'orange', 'purple', 'green'].map((id) => ({ id, title: id })),
        r.color || 'blue'
      );
  if (entity === 'chapters')
    html += field('position', 'Urutan', r.position || 1, 'number', 'min="1" required');
  if (entity === 'lessons')
    html +=
      select('chapter_id', 'Bab', data.chapters, r.chapter_id) +
      field('position', 'Urutan', r.position || 1, 'number', 'min="1" required') +
      field('summary', 'Ringkasan', r.summary);
  if (entity === 'materials')
    html +=
      select('lesson_id', 'Subbab', data.lessons, r.lesson_id) +
      select(
        'kind',
        'Jenis materi',
        ['text', 'video', 'drive', 'mpi', 'pdf', 'image'].map((id) => ({
          id,
          title: {
            text: 'Teks & rumus',
            video: 'Video YouTube',
            drive: 'Google Drive publik (PDF / gambar)',
            mpi: 'Media interaktif',
            pdf: 'PDF privat',
            image: 'Gambar privat'
          }[id]
        })),
        r.kind || 'text'
      ) +
      field('url', 'Tautan biasa YouTube / Drive / MPI (bukan kode embed)', r.url, 'url') +
      `<label>Unggah PDF / gambar privat<input name="asset" type="file" accept="application/pdf,image/jpeg,image/png,image/webp"></label><p class="muted">${isDemo() ? 'Unggahan nyata tidak tersedia dalam demo.' : 'Batas awal teknis 10 MB per berkas; pengelola dapat mengubahnya di backend.'} ${r.file_path ? 'Berkas lama tetap dipakai jika tidak memilih pengganti.' : ''}</p>`;
  if (['materials', 'questions'].includes(entity))
    html += `<fieldset class="block-editor"><legend>Isi ${entity === 'questions' ? 'soal' : 'materi'}</legend><p class="muted">Susun teks, rumus, atau tabel. Tidak perlu menulis JSON.</p><div id="content-blocks">${(r.body || [{ type: 'paragraph', text: '' }]).map(blockEditor).join('')}</div><div class="button-row"><button type="button" class="button secondary" data-add-block="paragraph">+ Teks</button><button type="button" class="button secondary" data-add-block="formula">+ Rumus</button><button type="button" class="button secondary" data-add-block="table">+ Tabel</button></div></fieldset>`;
  if (entity === 'questions')
    html +=
      '<p class="muted">Rumus pada soal, pilihan, dan pembahasan: tulis di antara tanda dolar, misalnya <code>$x^{2}$</code>, <code>$\\frac{1}{2}$</code>, atau <code>$\\sqrt{25}$</code>. Klik Pratinjau isi sebelum menerbitkan.</p>' +
      field(
        'code',
        'Kode bank soal (tetap setelah impor)',
        r.code || '',
        'text',
        r.code ? 'readonly' : 'maxlength="80"'
      ) +
      field('topic', 'Topik', r.topic || '', 'text', 'maxlength="200"') +
      select(
        'difficulty',
        'Kesulitan',
        [
          { id: '', title: 'Belum ditentukan' },
          ...['mudah', 'sedang', 'sulit'].map((id) => ({ id, title: id }))
        ],
        r.difficulty || ''
      ).replace(' required', '') +
      field('source', 'Sumber / atribusi', r.source || '', 'text', 'maxlength="2000"') +
      field('image_alt', 'Penjelasan gambar (jika ada)', r.image_alt || '') +
      `<label>Gambar soal privat (opsional)<input name="asset" type="file" accept="image/jpeg,image/png,image/webp"></label><fieldset><legend>Pilihan jawaban</legend>${[0, 1, 2, 3, 4].map((i) => field('option' + i, `Pilihan ${String.fromCharCode(65 + i)}${i === 4 ? ' (opsional)' : ''}`, r.options?.[i] || '', 'text', i < 2 ? 'required' : '')).join('')}</fieldset>` +
      select(
        'answer',
        'Kunci jawaban',
        [0, 1, 2, 3, 4].map((i) => ({ id: String(i), title: String.fromCharCode(65 + i) })),
        String(r.answer ?? 0)
      ) +
      `<label>Pembahasan<textarea name="explanation" required>${esc(r.explanation || '')}</textarea></label>`;
  if (entity === 'quizzes')
    html +=
      select(
        'category',
        'Kategori',
        ['Mapel Sekolah', 'TKA', 'UTBK', 'Kedinasan'].map((id) => ({ id, title: id })),
        r.category
      ) +
      `<label>Subbab terkait (opsional)<select name="lesson_id"><option value="">Tanpa subbab</option>${options(data.lessons, r.lesson_id)}</select></label>` +
      `<label>Bab terkait (opsional; kosongkan subbab)<select name="chapter_id"><option value="">Tanpa bab</option>${options(data.chapters, r.chapter_id)}</select></label>` +
      field('description', 'Deskripsi', r.description) +
      `<label>Cari soal berdasarkan kode, judul, atau topik<input id="question-search" type="search"></label><fieldset><legend>Pilih soal (urut sesuai daftar)</legend>${
        data.questions
          .filter((q) => q.status === 'published')
          .map(
            (q) =>
              `<label class="check-label" data-question-course="${esc(q.course_id)}"><input type="checkbox" name="question_ids" value="${esc(q.id)}" ${r.question_ids?.includes(q.id) ? 'checked' : ''}>${esc(q.title)} · ${esc(q.topic || '')} · ${esc(q.difficulty || '')}</label>`
          )
          .join('') || '<p>Terbitkan soal terlebih dahulu.</p>'
      }</fieldset>`;
  if (entity === 'classes') html += field('year', 'Tahun ajaran', r.year || '', 'text', 'required');
  if (entity === 'profiles')
    html +=
      field('email', 'Email identitas akun', r.email || '', 'email', 'required') +
      field('name', 'Nama', r.name || '', 'text', 'required') +
      select(
        'role',
        'Peran',
        [
          { id: 'student', title: 'Siswa' },
          { id: 'teacher', title: 'Guru' },
          { id: 'admin', title: 'Admin' }
        ],
        r.role || 'student'
      ) +
      select(
        'active',
        'Status',
        [
          { id: 'true', title: 'Aktif' },
          { id: 'false', title: 'Nonaktif' }
        ],
        String(r.active ?? true)
      ) +
      `<p class="muted">Gunakan menu Akun pengguna untuk membuat akun dan Sekolah & Akses untuk pemberian hak.</p>`;
  if (entity === 'memberships')
    html +=
      select(
        'student_id',
        'Siswa',
        data.profiles.filter((p) => p.role === 'student' && !p.pending),
        r.student_id,
        'name'
      ) + select('class_id', 'Kelas', data.classes, r.class_id);
  if (['memberships', 'assignments'].includes(entity))
    html += select(
      'active',
      'Akses keanggotaan / penugasan',
      [
        { id: 'true', title: 'Aktif' },
        { id: 'false', title: 'Nonaktif' }
      ],
      String(r.active ?? true)
    );
  if (entity === 'assignments')
    html += select(
      'teacher_id',
      'Guru',
      data.profiles.filter((p) => p.role === 'teacher' && !p.pending),
      r.teacher_id,
      'name'
    );
  if (['courses', 'chapters', 'lessons', 'materials', 'questions', 'quizzes'].includes(entity))
    html += select(
      'status',
      'Status',
      [
        { id: 'draft', title: 'Draf — belum terlihat siswa' },
        { id: 'published', title: 'Terbit' },
        { id: 'archived', title: 'Arsip' }
      ],
      r.status || 'draft'
    );
  return `<form id="editor" class="panel editor" data-entity="${entity}" data-id="${esc(r.id || '')}">${html}<div id="editor-preview"></div><p id="form-error" role="alert"></p><div class="button-row"><button type="submit" class="button">Simpan perubahan</button>${['materials', 'questions'].includes(entity) ? '<button type="button" id="preview-content" class="button secondary">Pratinjau isi</button>' : ''}<a class="button secondary" href="#/manage/${entity}">Kembali</a></div><p class="muted">Jika penyimpanan gagal, isian tetap berada di formulir ini.</p></form>`;
}
function blockEditor(b) {
  return `<div class="edit-block" data-type="${b.type}"><div><b>${{ paragraph: 'Paragraf', formula: 'Rumus (LaTeX, contoh: x^{2} + 3)', table: 'Tabel' }[b.type]}</b><button type="button" class="remove-block" aria-label="Hapus blok">×</button></div>${b.type === 'table' ? '<small>Pisahkan kolom dengan | dan baris dengan Enter.</small>' : ''}<textarea aria-label="Isi blok ${b.type}" rows="4">${esc(b.type === 'table' ? b.rows.map((r) => r.join(' | ')).join('\n') : b.text)}</textarea></div>`;
}
function readBlocks() {
  return validateBlocks(
    [...document.querySelectorAll('.edit-block')].map((el) => {
      const text = el.querySelector('textarea').value;
      return el.dataset.type === 'table'
        ? {
            type: 'table',
            rows: text
              .split('\n')
              .filter(Boolean)
              .map((row) => row.split('|').map((c) => c.trim()))
          }
        : { type: el.dataset.type, text };
    })
  );
}
export function bindManage() {
  const form = document.querySelector('#editor');
  if (!form) return;
  form.addEventListener('click', (e) => {
    if (e.target.closest('.remove-block')) e.target.closest('.edit-block').remove();
    const type = e.target.closest('[data-add-block]')?.dataset.addBlock;
    if (type)
      document.querySelector('#content-blocks').insertAdjacentHTML(
        'beforeend',
        blockEditor(
          type === 'table'
            ? {
                type,
                rows: [
                  ['Kolom 1', 'Kolom 2'],
                  ['', '']
                ]
              }
            : { type, text: '' }
        )
      );
  });
  const preview = document.querySelector('#preview-content');
  if (preview)
    preview.onclick = () => {
      try {
        document.querySelector('#editor-preview').innerHTML =
            `<article class="reading"><h3>Pratinjau</h3>${blocks(readBlocks())}${form.dataset.entity==='questions'?`<ol type="A">${[0,1,2,3,4].map(i=>form.elements['option'+i].value).filter(Boolean).map(o=>`<li>${mathText(o)}</li>`).join('')}</ol><p>Kunci: ${'ABCDE'[Number(form.elements.answer.value)]}</p><h4>Pembahasan</h4><p>${mathText(form.elements.explanation.value)}</p>`:''}${['drive', 'video'].includes(form.elements.kind?.value) ? mediaPreview(form.elements.url.value, form.elements.kind.value, form.elements.title.value) : ''}</article>`;
      } catch (e) {
        toast(e.message, true);
      }
    };
  const courseSelect = form.elements.course_id;
  const search = document.querySelector('#question-search');
  if (search)
    search.oninput = () =>
      document.querySelectorAll('[data-question-course]').forEach((el) => {
        el.hidden =
          el.dataset.questionCourse !== courseSelect.value ||
          !el.textContent.toLowerCase().includes(search.value.toLowerCase());
      });
  const filterChildren = () => {
    if (!courseSelect) return;
    for (const [fieldName, table] of [
      ['chapter_id', 'chapters'],
      ['lesson_id', 'lessons']
    ]) {
      const select = form.elements[fieldName];
      if (select) {
        const value = select.value;
        select.innerHTML =
          (form.dataset.entity === 'quizzes' ? '<option value="">Tanpa subbab</option>' : '') +
          options(
            data[table].filter((x) => x.course_id === courseSelect.value),
            value
          );
      }
    }
    document.querySelectorAll('[data-question-course]').forEach((el) => {
      el.hidden = el.dataset.questionCourse !== courseSelect.value;
      if (el.hidden) el.querySelector('input').checked = false;
    });
  };
  if (courseSelect) {
    courseSelect.onchange = filterChildren;
    filterChildren();
  }
  form.onsubmit = async (e) => {
    e.preventDefault();
    const button = form.querySelector('[type=submit]');
    const errorEl = document.querySelector('#form-error');
    button.disabled = true;
    errorEl.textContent = '';
    try {
      const entity = form.dataset.entity;
      const values = formData(form);
      delete values.asset;
      if (!form.dataset.id) form.dataset.id = crypto.randomUUID();
      if (form.dataset.id) {
        values.id = form.dataset.id;
        const original = data[entity].find((x) => x.id === values.id);
        if (original?.updated_at) values.updated_at = original.updated_at;
      }
      if (values.title !== undefined) values.title = validateTitle(values.title);
      if (values.position) values.position = Number(values.position);
      if (values.active) values.active = values.active === 'true';
      if (['questions', 'materials'].includes(entity)) values.body = readBlocks();
      if (entity === 'materials' && ['drive', 'video'].includes(values.kind))
        values.url = mediaSource(values.url, values.kind).url;
      if (entity === 'questions') {
        values.options = [0, 1, 2, 3, 4].map((i) => values['option' + i]).filter(Boolean);
        for (let i = 0; i < 5; i++) delete values['option' + i];
        values.answer = Number(values.answer);
        if (values.answer >= values.options.length)
          throw Error('Kunci jawaban harus menunjuk pilihan yang diisi.');
      }
      if (entity === 'quizzes') {
        values.question_ids = new FormData(form).getAll('question_ids');
        if (!values.question_ids.length) throw Error('Pilih minimal satu soal.');
        if (!values.lesson_id) values.lesson_id = null;
        if (!values.chapter_id) values.chapter_id = null;
        if (values.lesson_id && values.chapter_id)
          throw Error('Pilih bab atau subbab saja sebagai target.');
      }
      if (['materials', 'questions'].includes(entity)) {
        const old = data[entity].find((m) => m.id === values.id);
        values.file_path = old?.file_path || null;
        const file = form.elements.asset.files[0];
        if (file) {
          validateFile(file);
          if (entity === 'questions' && !file.type.startsWith('image/'))
            throw Error('Gambar soal harus JPEG, PNG, atau WebP.');
          values.file_path = await upload(file, values.course_id);
        }
        if (['pdf', 'image'].includes(values.kind) && !values.file_path)
          throw Error('Jenis ini memerlukan unggahan berkas privat.');
      }
      if (
        entity === 'profiles' &&
        !confirm('Simpan perubahan identitas, status, atau peran pengguna ini?')
      )
        return;
      await action('save', { entity, record: values });
      toast('Perubahan tersimpan.');
      location.hash = `/manage/${entity}`;
    } catch (e) {
      errorEl.textContent = e.message;
      toast('Penyimpanan belum terkonfirmasi. Isian tetap tersedia.', true);
    } finally {
      button.disabled = false;
    }
  };
}


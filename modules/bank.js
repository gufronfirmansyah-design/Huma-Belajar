import { data, action, upload, isDemo } from '../lib/store.js';
import { mathText, esc, heading, blocks } from '../lib/ui.js';
import { readBank } from '../lib/bank-import.js';
export function bankPage() {
  return `${heading('BANK SOAL', 'Impor sekali, gunakan di banyak latihan', 'Excel diperiksa terlebih dahulu. Soal baru masuk sebagai draf.')}<section class="panel"><a class="button secondary" href="./templates/Template-Bank-Soal.xlsx" download>Unduh template Excel</a> <a href="./panduan/06-MATERI-DAN-SOAL/index.html">Petunjuk lengkap →</a><form id="bank-form" class="editor"><label>Mapel / domain ujian<select name="course" required>${data.courses
    .filter((c) => c.status !== 'archived')
    .map((c) => `<option value="${esc(c.id)}">${esc(c.title)} — ${esc(c.grade)}</option>`)
    .join(
      ''
    )}</select></label><label>Excel atau ZIP berisi Excel + folder gambar<input name="file" type="file" accept=".xlsx,.zip" required></label><p>1–100 soal; maksimal berkas 10 MB. Kode yang sudah ada dilewati, tidak ditimpa. Untuk revisi, edit soal lama atau gunakan kode baru.</p><button class="button" type="submit">Periksa & pratinjau</button></form><p id="bank-status" role="status"></p><div id="bank-preview"></div><button id="bank-save" class="button" hidden>Simpan sebagai draf</button><p><a href="#/manage/questions">Buka bank soal</a> · <a href="#/manage/quizzes/new">Susun paket latihan</a></p></section>`;
}
export function bindBank() {
  const form = document.querySelector('#bank-form'),
    status = document.querySelector('#bank-status'),
    preview = document.querySelector('#bank-preview'),
    save = document.querySelector('#bank-save');
  let batch = null,
    course = null,
    busy = false;
  const invalidate = () => {
    if (!busy) {
      batch = null;
      save.hidden = true;
      preview.innerHTML = '';
      status.textContent = '';
    }
  };
  form.onchange = invalidate;
  form.onsubmit = async (e) => {
    e.preventDefault();
    if (busy) return;
    invalidate();
    busy = true;
    [...form.elements].forEach((el) => (el.disabled = true));
    try {
      course = form.elements.course.value;
      batch = await readBank(form.elements.file.files[0]);
      preview.innerHTML = batch.rows
        .map(
          (r) =>
            `<details><summary>${esc(r.code)} · ${esc(r.topic || 'Tanpa topik')}</summary>${blocks(r.body)}<ol type="A">${r.options.map((o) => `<li>${mathText(o)}</li>`).join('')}</ol><p>Kunci: ${'ABCDE'[r.answer]} · ${mathText(r.explanation)}</p>${r.image ? `<img data-bank-image="${esc(r.image)}" alt="${esc(r.image_alt)}" style="max-width:100%;max-height:300px"><p>Gambar: ${esc(r.image)} · ${esc(r.image_alt)}</p>` : ''}</details>`
        )
        .join('');
      preview.querySelectorAll('[data-bank-image]').forEach((img) => {
        const url = URL.createObjectURL(batch.images.get(img.dataset.bankImage));
        img.onload = img.onerror = () => URL.revokeObjectURL(url);
        img.src = url;
      });
      status.textContent = `${batch.rows.length} soal valid. Periksa isi sebelum menyimpan.`;
      save.hidden = false;
    } catch (err) {
      batch = null;
      status.textContent = err.message;
    } finally {
      busy = false;
      [...form.elements].forEach((el) => (el.disabled = false));
    }
  };
  save.onclick = async () => {
    if (!batch || busy) return;
    busy = true;
    save.disabled = true;
    [...form.elements].forEach((el) => (el.disabled = true));
    try {
      for (const row of batch.rows) {
        if (row.image && !row.file_path) {
          if (isDemo())
            throw Error(
              'Gambar privat memerlukan koneksi database nyata. Coba template tanpa gambar dalam demo.'
            );
          status.textContent = 'Mengunggah ' + row.image;
          row.file_path = await upload(batch.images.get(row.image), course);
        }
      }
      const result = await action('import_questions', {
        course_id: course,
        rows: batch.rows.map(({ image, ...r }) => r)
      });
      status.textContent = `Tersimpan: ${result.inserted} draf. Dilewati: ${result.skipped} kode yang sudah ada. Buka bank soal untuk memeriksa dan menerbitkan.`;
      save.hidden = true;
      batch = null;
    } catch (err) {
      status.textContent =
        err.message + ' Data impor tetap di halaman ini. Periksa koneksi dan coba simpan kembali.';
    } finally {
      busy = false;
      save.disabled = false;
      [...form.elements].forEach((el) => (el.disabled = false));
    }
  };
}



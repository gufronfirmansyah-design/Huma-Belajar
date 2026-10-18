import { data, user, action, isDemo } from '../lib/store.js';
import { mathText, heading, esc, empty, blocks, progress, toast, questionImage } from '../lib/ui.js';
let active,
  position = 0;
export function practice(category = 'Semua') {
  const categories = ['Semua', 'Mapel Sekolah', 'TKA', 'UTBK', 'Kedinasan'];
  const qs = data.quizzes.filter(
    (q) => q.status === 'published' && (category === 'Semua' || q.category === category)
  );
  return `${heading('BERANI MENCOBA, MAKIN BISA', 'Ruang latihan', 'Asah pemahamanmu satu soal demi satu soal.')}<div class="tabs">${categories.map((c) => `<a class="${c === category ? 'active' : ''}" href="#/practice/${encodeURIComponent(c)}">${c}</a>`).join('')}</div><div class="course-grid">${qs.map((q) => `<article class="panel"><span class="pill">${esc(q.category)}</span><h2>${esc(q.title)}</h2><p class="muted">${esc(q.description || 'Latihan untuk menguatkan pemahaman.')}</p><p>${q.question_ids?.length || q.question_count || 0} soal · Tanpa batas waktu</p><a class="button" href="#/quiz/${esc(q.id)}">Lihat latihan →</a></article>`).join('') || empty('Latihan belum tersedia', 'Kategori ini siap diisi oleh guru. Tidak ada soal nyata yang dibuat otomatis.')}</div>`;
}
export function quizIntro(id) {
  const q = data.quizzes.find((q) => q.id === id);
  if (!q) return empty('Latihan tidak tersedia');
  return `${heading('SIAP UNTUK MENCOBA?', q.title, q.description)}<section class="panel narrow"><h2>Sebelum mulai</h2><ul class="spaced"><li>Jawaban disimpan setiap kali kamu memilih opsi.</li><li>Pastikan status jawaban sudah tersimpan sebelum pindah soal.</li><li>Nilai dan pembahasan muncul setelah dikirim.</li><li>Latihan tidak menggunakan batas waktu.</li><li>Pengerjaan yang belum dikirim dapat dilanjutkan.</li></ul>${user.role === 'student' ? `<button id="start-quiz" class="button" data-quiz="${esc(id)}">Mulai / lanjutkan latihan →</button>` : '<p>Gunakan akun siswa untuk mengerjakan. Guru mengelola dan mempratinjau soal di Bank Soal.</p>'}${isDemo() ? '<p class="muted">Demo: soal dan penilaian contoh berada di perangkat ini, bukan penilaian produksi.</p>' : ''}</section>`;
}
export async function attemptPage(id) {
  active = await action('attempt', { id });
  position = Math.min(position, active.questions.length - 1);
  return draw();
}
function draw() {
  if (active.status === 'submitted')
    return `${heading('SATU LANGKAH LEBIH MAJU', 'Latihan selesai!', 'Terima kasih sudah mencoba. Pelajari kembali bagian yang masih sulit.')}<section class="result-score panel"><span>Nilai latihan</span><strong>${active.score}<small>/100</small></strong><p>${active.correct} dari ${active.questions.length} jawaban benar</p><a href="#/practice" class="button">Kembali ke latihan</a></section>${active.questions.map((q, i) => `<article class="panel reading"><span class="pill">Soal ${i + 1} · ${active.answers[q.id] === q.answer ? 'Benar' : 'Perlu dipelajari'}</span>${blocks(q.body)}${questionImage(q)}<p>Jawabanmu: <b>${mathText(q.options[active.answers[q.id]] || 'Tidak dijawab')}</b></p><p>Jawaban benar: <b>${mathText(q.options[q.answer])}</b></p><p class="explanation">${mathText(q.explanation)}</p></article>`).join('')}`;
  const q = active.questions[position];
  const answered = Object.keys(active.answers).length;
  return `${heading('MINI LATIHAN', active.title, 'Pelan-pelan saja. Baca pertanyaannya dengan teliti.')}<div class="quiz-layout"><section class="panel quiz-panel"><div class="progress-label"><b>Soal ${position + 1} <span class="muted">/ ${active.questions.length}</span></b><span>${answered} terjawab</span></div>${progress((answered / active.questions.length) * 100)}<div class="question">${blocks(q.body)}${questionImage(q)}</div><fieldset class="answers"><legend class="sr-only">Pilih satu jawaban</legend>${q.options.map((opt, i) => `<label class="answer ${active.answers[q.id] === i ? 'selected' : ''}"><input type="radio" name="answer" value="${i}" ${active.answers[q.id] === i ? 'checked' : ''}><span class="letter">${String.fromCharCode(65 + i)}</span><span>${mathText(opt)}</span></label>`).join('')}</fieldset><p id="save-state" role="status" class="muted">${active.answers[q.id] !== undefined ? 'Jawaban tersimpan.' : 'Belum ada jawaban untuk soal ini.'}</p><button id="retry-answer" class="button secondary" hidden>Coba simpan lagi</button><div class="quiz-footer"><button class="button secondary" id="prev" ${position === 0 ? 'disabled' : ''}>← Sebelumnya</button><button class="button" id="next" ${position === active.questions.length - 1 ? 'disabled' : ''}>Berikutnya →</button></div></section><aside class="panel quiz-sidebar"><h3>Navigasi soal</h3><div class="question-nav">${active.questions.map((item, i) => `<button data-position="${i}" class="${i === position ? 'current' : ''} ${active.answers[item.id] !== undefined ? 'answered' : ''}" aria-label="Soal ${i + 1}">${i + 1}</button>`).join('')}</div><p class="muted">Periksa jawabanmu sebelum mengirim.</p><button class="button full" id="submit-quiz">Kirim semua jawaban</button><small>Jawaban tidak dapat diubah setelah dikirim.</small></aside></div>`;
}
export function bindPractice(render) {
  const start = document.querySelector('#start-quiz');
  if (start)
    start.onclick = async () => {
      start.disabled = true;
      try {
        const a = await action('start', { quiz_id: start.dataset.quiz });
        position = 0;
        location.hash = `/attempt/${a.id}`;
      } catch (e) {
        toast(e.message, true);
        start.disabled = false;
      }
    };
  if (!document.querySelector('.quiz-layout')) return;
  let pending = false,
    unsaved = null;
  const lock = (on) => {
    pending = on;
    document
      .querySelectorAll('#prev,#next,#submit-quiz,[data-position],.answers input')
      .forEach((el) => {
        el.disabled = on;
      });
  };
  const save = async (value) => {
    unsaved = value;
    lock(true);
    const state = document.querySelector('#save-state');
    state.textContent = 'Menyimpan jawaban…';
    try {
      await action('answer', {
        attempt_id: active.id,
        question_id: active.questions[position].id,
        answer: value
      });
      active.answers[active.questions[position].id] = value;
      unsaved = null;
      await render();
    } catch (e) {
      lock(false);
      state.textContent = 'Belum tersimpan. Pilihanmu tetap ada. ' + e.message;
      document.querySelector('#retry-answer').hidden = false;
      document
        .querySelectorAll('#prev,#next,#submit-quiz,[data-position]')
        .forEach((b) => (b.disabled = true));
    }
  };
  document
    .querySelectorAll('input[name="answer"]')
    .forEach((input) => (input.onchange = () => save(Number(input.value))));
  document.querySelector('#retry-answer').onclick = () => save(unsaved);
  document.querySelector('#prev').onclick = () => {
    if (pending || unsaved !== null) return;
    position--;
    render();
  };
  document.querySelector('#next').onclick = () => {
    if (pending || unsaved !== null) return;
    position++;
    render();
  };
  document.querySelectorAll('[data-position]').forEach(
    (b) =>
      (b.onclick = () => {
        if (pending || unsaved !== null) return;
        position = Number(b.dataset.position);
        render();
      })
  );
  document.querySelector('#submit-quiz').onclick = async () => {
    if (pending || unsaved !== null) return;
    if (!confirm('Kirim jawaban sekarang? Jawaban kosong bernilai 0. Hasil tidak dapat diubah.'))
      return;
    lock(true);
    try {
      await action('submit', { attempt_id: active.id });
      render();
    } catch (e) {
      toast(
        'Pengiriman belum terkonfirmasi. Muat ulang untuk memeriksa status, atau coba kirim lagi. ' +
          e.message,
        true
      );
      lock(false);
    }
  };
}


import { client, isDemo, data, login } from '../lib/store.js';
import { mathText, esc, heading, blocks, safeUrl } from '../lib/ui.js';
import { mediaPreview } from '../lib/media.js';

export async function guestPage(id) {
  let courses;
  if (isDemo()) {
    courses = data.courses
      .filter((c) => c.status === 'published')
      .map((c) => {
        const preview = data.course_previews?.find((p) => p.course_id === c.id);
        const lesson = data.lessons.find(
          (l) => l.id === preview?.lesson_id && l.status === 'published'
        );
        return {
          ...c,
          lesson: lesson
            ? {
                ...lesson,
                materials: data.materials.filter(
                  (m) => m.lesson_id === lesson.id && m.status === 'published' && !m.file_path
                ),
                quizzes: data.quizzes
                  .filter((q) => q.lesson_id === lesson.id && q.status === 'published')
                  .map((q) => ({
                    ...q,
                    questions: data.questions.filter((x) => q.question_ids.includes(x.id))
                  }))
              }
            : null
        };
      });
  } else {
    const result = await client.rpc('public_catalog');
    if (result.error) throw Error('Contoh belum dapat dimuat. Periksa koneksi lalu coba lagi.');
    courses = result.data;
  }
  const selected = courses.find((c) => c.id === id);
  return `<main class="guest-shell"><a class="brand" href="#/guest">HUMA BELAJAR</a><div class="button-row"><a class="button secondary" href="#/home">${isDemo() ? 'Kembali ke demo' : 'Login / daftar'}</a></div>${heading('COBA TANPA LOGIN', 'Satu langkah untuk mulai belajar', 'Subbab pertama pada Bab 1 setiap mapel. Lanjutkan perjalananmu dengan username, password, dan kode kelas.')}<p class="notice">${isDemo() ? 'Contoh dari data demo lokal.' : 'Materi contoh publik.'} Skor latihan contoh hanya sementara dan tidak masuk nilai siswa.</p>${
    selected?.lesson
      ? `<a href="#/guest" class="back">← Semua mapel</a><section class="panel"><p class="eyebrow">${esc(selected.title)} · BAB 1 / SUBBAB 1</p><h2>${esc(selected.lesson.title)}</h2>${selected.lesson.materials.map((m) => `<article class="reading"><h3>${esc(m.title)}</h3>${blocks(m.body)}${['drive', 'video'].includes(m.kind) ? mediaPreview(m.url, m.kind, m.title) : m.kind === 'mpi' && safeUrl(m.url) ? `<a href="${esc(safeUrl(m.url))}" target="_blank" rel="noopener noreferrer">Buka media ↗</a>` : ''}</article>`).join('') || '<p>Materi publik belum tersedia. Berkas privat tidak ditampilkan kepada pengunjung.</p>'}${(
          selected.lesson.quizzes || []
        )
          .filter((q) => q.questions?.length)
          .map(
            (q) =>
              `<form class="guest-quiz" data-sample="${esc(q.id)}"><h3>${esc(q.title)} · latihan contoh</h3>${q.questions.map((x, i) => `<fieldset><legend>Soal ${i + 1}</legend>${blocks(x.body)}${x.options.map((o, j) => `<label class="answer"><input type="radio" name="${esc(x.id)}" value="${j}" required> ${mathText(o)}</label>`).join('')}</fieldset>`).join('')}<button class="button">Periksa jawaban contoh</button><div class="sample-result" role="status"></div></form>`
          )
          .join(
            ''
          )}<hr><p>Subbab berikutnya tersedia setelah login dan bergabung dengan kode kelas.</p><a href="#/home" class="button">${isDemo() ? 'Kembali ke demo' : 'Masuk untuk melanjutkan'}</a></section>`
      : `<div class="course-grid">${courses.map((c) => `<section class="panel"><span class="pill">${esc(c.grade || 'Materi sekolah')}</span><h2>${esc(c.title)}</h2><p>${esc(c.description || 'Kenali pelajaran ini lewat satu subbab contoh.')}</p>${c.lesson ? `<a class="button" href="#/guest/${esc(c.id)}">Coba Bab 1 · Subbab 1 →</a>` : '<p>Contoh sedang disiapkan tim konten.</p>'}</section>`).join('') || '<p>Katalog contoh belum diterbitkan.</p>'}</div>`
  }</main>`;
}
export async function bindGuest() {
  // Data contoh memang publik. Skor ini tidak pernah dikirim sebagai nilai resmi.
  document.querySelectorAll('.guest-quiz').forEach(
    (form) =>
      (form.onsubmit = async (e) => {
        e.preventDefault();
        let courses;
        if (isDemo())
          courses = [
            {
              lesson: {
                quizzes: data.quizzes.map((q) => ({
                  ...q,
                  questions: data.questions.filter((x) => q.question_ids.includes(x.id))
                }))
              }
            }
          ];
        else {
          const r = await client.rpc('public_catalog');
          if (r.error) {
            form.querySelector('.sample-result').textContent =
              'Belum dapat memeriksa. Jawaban tetap tersedia; coba lagi.';
            return;
          }
          courses = r.data;
        }
        const quiz = courses
          .flatMap((c) => c.lesson?.quizzes || [])
          .find((q) => q.id === form.dataset.sample);
        if (!quiz) {
          form.querySelector('.sample-result').textContent =
            'Contoh telah diperbarui. Muat ulang setelah mencatat jawaban.';
          return;
        }
        const answers = new FormData(form);
        let correct = 0;
        const explanation = quiz.questions
          .map((q) => {
            if (Number(answers.get(q.id)) === q.answer) correct++;
            return `<p>${esc(q.title)}: ${mathText(q.explanation)}</p>`;
          })
          .join('');
        form.querySelector('.sample-result').innerHTML =
          `<h3>Skor contoh ${Math.round((correct / quiz.questions.length) * 100)}%</h3><p>Tidak disimpan sebagai nilai siswa.</p>${explanation}`;
      })
  );
}


import { data, user, action, fileUrl, completion } from '../lib/store.js';
import { mediaPreview } from '../lib/media.js';
import { esc, heading, empty, blocks, safeUrl, toast, icon, progress } from '../lib/ui.js';
function lessonCompletion(lessonId) {
  const ms = data.materials.filter((m) => m.lesson_id === lessonId && m.status === 'published');
  const done = ms.filter((m) =>
    data.progress.some((p) => p.student_id === user.id && p.material_id === m.id && p.completed)
  ).length;
  return ms.length ? Math.round((done / ms.length) * 100) : 0;
}
export function coursePage(id) {
  const c = data.courses.find((c) => c.id === id);
  if (!c) return empty('Mapel tidak tersedia');
  const p = completion(id),
    chapters = data.chapters
      .filter((b) => b.course_id === id && b.status !== 'archived')
      .sort((a, b) => a.position - b.position);
  return `<a class="back" href="#/learn">← Semua pelajaran</a><section class="course-hero ${esc(c.color || 'blue')}"><div class="subject-square">${icon('book')}</div><div><span>MAPEL SEKOLAH</span><h1>${esc(c.title)}</h1><p>${esc(c.description || 'Belajar satu langkah setiap hari.')}</p><div class="course-hero-progress">${progress(p.percent)}<b>${p.percent}%</b></div></div></section><div class="content-tabs" role="tablist" aria-label="Bagian mata pelajaran"><button role="tab" aria-selected="true" aria-controls="course-chapters" data-content-tab="course-chapters">Bab & subbab</button><button role="tab" aria-selected="false" aria-controls="course-about" data-content-tab="course-about">Tentang mapel</button></div><div id="course-chapters" role="tabpanel"><div class="chapter-list">${
    chapters
      .map(
        (b, i) =>
          `<section class="panel"><div class="chapter-title"><span class="number">${i + 1}</span><div><p class="eyebrow">BAB ${i + 1}</p><h2>${esc(b.title)}</h2></div></div>${
            data.lessons
              .filter((l) => l.chapter_id === b.id && l.status !== 'archived')
              .sort((a, b) => a.position - b.position)
              .map((l) => {
                const percent = lessonCompletion(l.id);
                return `<a class="lesson-row" href="#/lesson/${esc(l.id)}">${icon(percent === 100 ? 'check' : 'book')}<div class="lesson-info"><strong>${esc(l.title)}</strong><small>${esc(l.summary || 'Buka materi dan latihan')}</small><div class="lesson-progress">${progress(percent)}<b>${percent}%</b></div></div><span>→</span></a>`;
              })
              .join('') || '<p class="muted">Subbab belum tersedia.</p>'
          }${data.quizzes
            .filter((q) => q.chapter_id === b.id && q.status === 'published')
            .map(
              (q) =>
                `<a class="button secondary" href="#/quiz/${esc(q.id)}">Latihan bab · ${esc(q.title)}</a>`
            )
            .join('')}</section>`
      )
      .join('') || empty('Bab belum tersedia')
  }</div></div><section id="course-about" class="panel reading" role="tabpanel" hidden><h2>Tentang ${esc(c.title)}</h2><p>${esc(c.description || 'Materi pembelajaran disusun guru sesuai kebutuhan kelas.')}</p><p>${chapters.length} bab · ${p.total} materi terbit.</p><p>Progres menunjukkan materi yang kamu tandai selesai. Hasil latihan ditampilkan terpisah untuk membantu mengenali bagian yang perlu dipelajari kembali.</p></section>`;
}
export function lessonPage(id) {
  const l = data.lessons.find((l) => l.id === id);
  if (!l) return empty('Subbab tidak tersedia');
  const ms = data.materials.filter((m) => m.lesson_id === id && m.status !== 'archived');
  return `<a class="back" href="#/course/${esc(l.course_id)}">← Kembali ke mata pelajaran</a>${heading('MATERI PEMBELAJARAN', l.title, l.summary)}<div class="reading-layout"><div>${
    ms
      .map((m) => {
        const complete = data.progress.some(
          (p) => p.student_id === user.id && p.material_id === m.id && p.completed
        );
        const url = safeUrl(m.url);
        if (['drive', 'video'].includes(m.kind))
          return `<article class="panel reading"><h2>${esc(m.title)}</h2>${blocks(m.body)}${mediaPreview(m.url, m.kind, m.title)}${user.role === 'student' ? `<div class="material-footer"><button class="button" data-complete="${esc(m.id)}" data-value="${!complete}">${complete ? 'Batalkan tanda selesai' : 'Tandai sudah dipelajari'}</button></div>` : ''}</article>`;
        return `<article class="panel reading"><div class="section-heading"><span class="pill">${esc(m.kind.toUpperCase())}</span><span class="muted">${complete ? '✓ Ditandai selesai' : ''}</span></div><h2>${esc(m.title)}</h2>${blocks(m.body)}${m.file_path ? `<button class="button secondary" data-file="${esc(m.file_path)}">Buka berkas privat ↗</button>` : url ? `<a class="button secondary" href="${esc(url)}" target="_blank" rel="noopener noreferrer">Buka ${m.kind === 'video' ? 'video' : 'materi interaktif'} ↗</a>` : ''}${user.role === 'student' ? `<div class="material-footer"><p>Membuka materi belum berarti selesai belajar.</p><button class="button ${complete ? 'secondary' : ''}" data-complete="${esc(m.id)}" data-value="${!complete}">${complete ? 'Batalkan tanda selesai' : '✓ Tandai sudah dipelajari'}</button></div>` : ''}</article>`;
      })
      .join('') || empty('Materi belum tersedia')
  }</div><aside><section class="panel sticky"><span class="eyebrow">UJI PEMAHAMAN</span><h2>Sudah mulai paham?</h2><p class="muted">Coba latihan singkat. Tidak apa-apa jika belum benar semua.</p>${
    data.quizzes
      .filter((q) => q.lesson_id === id && q.status === 'published')
      .map((q) => `<a class="button full" href="#/quiz/${esc(q.id)}">Mulai latihan →</a>`)
      .join('') || '<p>Latihan belum tersedia.</p>'
  }<hr><small class="muted">Progres merupakan tanda penyelesaian oleh siswa, bukan bukti penguasaan materi.</small></section></aside></div>`;
}
export function bindLearning(render) {
  document.querySelectorAll('[data-content-tab]').forEach((button) => {
    button.onclick = () => {
      const tabs = button.closest('[role="tablist"]');
      tabs.querySelectorAll('[data-content-tab]').forEach((tab) => {
        const selected = tab === button;
        tab.setAttribute('aria-selected', String(selected));
        document.getElementById(tab.dataset.contentTab).hidden = !selected;
      });
    };
    button.onkeydown = (e) => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) return;
      e.preventDefault();
      const tabs = [...button.closest('[role="tablist"]').querySelectorAll('[data-content-tab]')];
      const current = tabs.indexOf(button);
      const next =
        e.key === 'Home'
          ? 0
          : e.key === 'End'
            ? tabs.length - 1
            : (current + (e.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
      tabs[next].focus();
      tabs[next].click();
    };
  });
  document.querySelectorAll('[data-image]').forEach(
    (b) =>
      (b.onclick = async () => {
        b.disabled = true;
        try {
          const url = await fileUrl(b.dataset.image);
          const img = document.createElement('img');
          img.src = url;
          img.alt = b.dataset.alt;
          img.style.maxWidth = '100%';
          img.onerror = () => {
            img.remove();
            b.hidden = false;
            b.disabled = false;
            toast('Gambar gagal dimuat. Coba lagi.', true);
          };
          b.after(img);
          b.hidden = true;
        } catch (e) {
          toast(e.message, true);
          b.disabled = false;
        }
      })
  );
  document.querySelectorAll('[data-complete]').forEach(
    (b) =>
      (b.onclick = async () => {
        b.disabled = true;
        try {
          await action('progress', {
            material_id: b.dataset.complete,
            completed: b.dataset.value === 'true'
          });
          toast('Progres tersimpan.');
          render();
        } catch (e) {
          toast(e.message, true);
          b.disabled = false;
        }
      })
  );
  document.querySelectorAll('[data-file]').forEach(
    (b) =>
      (b.onclick = async () => {
        b.disabled = true;
        try {
          const url = await fileUrl(b.dataset.file);
          const a = document.createElement('a');
          a.href = url;
          a.target = '_blank';
          a.rel = 'noopener';
          a.click();
        } catch (e) {
          toast(e.message, true);
        } finally {
          b.disabled = false;
        }
      })
  );
}

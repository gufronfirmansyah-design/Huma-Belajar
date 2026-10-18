import { visibleCourses, completion, data, currentClass } from '../lib/store.js';
import { heading, esc, icon, progress, empty } from '../lib/ui.js';
import { subjectIcon } from '../lib/icons.js';
export function learn() {
  return `${heading('JELAJAHI DUNIA PENGETAHUAN', 'Mapel sekolah', 'Pilih pelajaran. Temukan hal baru. Mulai langkahmu.')}<div class="catalog-toolbar"><span class="pill">${icon('school')} ${esc(currentClass()?.title || 'Belum ada kelas')}</span><label class="search-field">${icon('search')}<input id="course-search" type="search" placeholder="Cari mata pelajaran…" aria-label="Cari mata pelajaran"></label></div><div class="catalog-grid">${
    visibleCourses()
      .map((c) => {
        const p = completion(c.id);
        const chapters = data.chapters.filter(
          (b) => b.course_id === c.id && b.status === 'published'
        ).length;
        return `<a class="subject-card ${esc(c.color || 'blue')}" href="#/course/${esc(c.id)}" data-search="${esc(c.title.toLowerCase())}"><div class="subject-card-top"><span class="subject-square">${icon(subjectIcon(c))}</span><span>${chapters} bab</span></div><h2>${esc(c.title)}</h2><p>${esc(c.description || 'Bangun pemahamanmu, satu langkah setiap hari.')}</p><div class="progress-label"><span>${p.done} dari ${p.total} materi</span><b>${p.percent}%</b></div>${progress(p.percent)}<div class="subject-card-footer"><strong>Mulai belajar</strong>${icon('arrow')}</div></a>`;
      })
      .join('') || empty('Belum ada mata pelajaran')
  }</div><div id="search-empty" hidden>${empty('Pelajaran tidak ditemukan', 'Coba kata kunci lain.')}</div>`;
}
export function bindCatalog() {
  const input = document.querySelector('#course-search');
  if (!input) return;
  const filter = () => {
    const q = input.value.trim().toLowerCase();
    const cards = [...document.querySelectorAll('[data-search]')];
    cards.forEach((c) => (c.hidden = !c.dataset.search.includes(q)));
    document.querySelector('#search-empty').hidden =
      cards.some((c) => !c.hidden) || cards.length === 0;
  };
  input.addEventListener('input', filter);
  filter();
}

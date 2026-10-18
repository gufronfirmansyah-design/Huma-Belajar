import { data, user, visibleCourses, completion, currentClass } from '../lib/store.js';
import { icon, esc, progress, empty } from '../lib/ui.js';
import { subjectIcon } from '../lib/icons.js';
import { learningCategories } from '../content.js';

export const categoryCards = () =>
  `<div class="learning-menu">${learningCategories.map((c) => `<a class="learning-tile ${c.color}" href="${c.href}"><span class="tile-icon">${icon(c.icon)}</span><div><strong>${c.short}</strong><p>${c.description}</p></div><span class="tile-arrow">↗</span></a>`).join('')}</div>`;

export function continueCards(courses = visibleCourses()) {
  return (
    courses
      .map((c) => {
        const p = completion(c.id);
        const lessons = data.lessons.filter(
          (l) => l.course_id === c.id && l.status === 'published'
        );
        const next =
          lessons.find((l) =>
            data.materials.some(
              (m) =>
                m.lesson_id === l.id &&
                m.status === 'published' &&
                !data.progress.some(
                  (pr) => pr.student_id === user.id && pr.material_id === m.id && pr.completed
                )
            )
          ) || lessons[0];
        return `<a class="continue-card ${esc(c.color || 'blue')}" href="${next ? `#/lesson/${esc(next.id)}` : `#/course/${esc(c.id)}`}"><div class="subject-square">${icon(subjectIcon(c))}</div><div class="continue-body"><strong>${esc(c.title)}</strong><small>${esc(next?.title || 'Jelajahi mata pelajaran')}</small><div class="continue-progress">${progress(p.percent)}<b>${p.percent}%</b></div></div><span class="continue-play">${icon('play')}</span></a>`;
      })
      .join('') ||
    empty('Materi belum tersedia', 'Mapel yang diberikan sekolah akan muncul di sini.')
  );
}

export function dashboard() {
  const courses = visibleCourses(),
    cls = currentClass();
  const done = data.progress.filter((p) => p.student_id === user.id && p.completed).length;
  const attempts = data.attempts.filter(
    (a) => a.student_id === user.id && a.status === 'submitted'
  );
  return `<section class="welcome"><div><p class="eyebrow">HARI BARU, PENGETAHUAN BARU</p><h1>Halo, ${esc(user.name.split(' ')[0])}! <span class="wave">👋</span></h1><p>Terus belajar, raih masa depanmu.</p></div><div class="welcome-badge">${icon('spark')}<span>Selangkah lebih baik<br><b>setiap hari</b></span></div></section>
 <section class="class-banner"><span class="class-emblem">${icon('school')}</span><div><small>KELAS KAMU</small><strong>${esc(cls?.title || 'Belum ada kelas')}</strong><span>${cls ? `Tahun ajaran ${esc(cls.year || '—')}` : 'Hubungi pengelola sekolah'}</span></div><a href="#/classes">Ganti kelas ${icon('arrow')}</a></section>
 <div class="home-layout"><div class="home-primary">
  <section class="menu-section"><div class="section-heading"><div><p class="eyebrow">MULAI DARI RASA INGIN TAHU</p><h2>Mau belajar apa hari ini?</h2></div></div>${categoryCards()}</section>
  <section class="study-hero"><div><span class="hero-label">RUANG UNTUK BERTUMBUH</span><h2>Belajar lebih seru.<br>Masa depan lebih luas.</h2><p>Materi, latihan, dan langkah kecil<br>menuju mimpi besarmu.</p><a class="button" href="#/learn">Jelajahi pelajaran ${icon('arrow')}</a></div><img src="./assets/study-scene.svg" alt="Dua siswa belajar bersama dengan buku dan laptop" width="560" height="380"></section>
  <section class="continue-section"><div class="section-heading"><div><p class="eyebrow">LANJUTKAN PERJALANANMU</p><h2>Belajar hari ini</h2></div><a href="#/learn">Lihat semua ${icon('arrow')}</a></div><div class="continue-grid">${continueCards(courses.slice(0, 4))}</div></section>
 </div><aside class="home-aside">
  <section class="journey-card"><div class="section-heading"><h2>Langkah belajarmu</h2>${icon('chart')}</div><div class="journey-orbit" style="--progress:${courses.length ? Math.round(courses.reduce((s, c) => s + completion(c.id).percent, 0) / courses.length) : 0}%"><div>${icon('trophy')}<strong>${done}</strong><span>materi selesai</span></div></div><p>Setiap hal yang kamu pelajari<br>membawamu lebih jauh.</p><div class="journey-stats"><div><b>${courses.length}</b><span>Mapel</span></div><div><b>${attempts.length}</b><span>Latihan selesai</span></div></div><a class="button secondary full" href="#/progress">Lihat progres ${icon('arrow')}</a></section>
  <section class="encouragement"><div class="encouragement-icon">${icon('spark')}</div><h3>Tidak harus langsung bisa.<br>Yang penting terus mencoba.</h3><p>Mulai dari satu materi. Pahami, coba, lalu lanjutkan.</p><span>SEMANGAT, SAHABAT HUMA!</span></section>
 </aside></div>`;
}

import { data, user, visibleCourses, completion, isDemo, currentClass } from '../lib/store.js';
import { esc, icon, heading, progress, empty, date } from '../lib/ui.js';
function studentProgress() {
  const rows = [];
  for (const c of visibleCourses()) {
    const materials = data.materials.filter(
      (m) =>
        m.course_id === c.id &&
        m.status === 'published' &&
        data.lessons.some(
          (l) =>
            l.id === m.lesson_id &&
            l.status === 'published' &&
            data.chapters.some((ch) => ch.id === l.chapter_id && ch.status === 'published')
        )
    );
    for (const member of data.memberships.filter(
      (m) => m.class_id === currentClass()?.id && m.active !== false
    )) {
      const profile = data.profiles.find((p) => p.id === member.student_id);
      if (!profile) continue;
      const completed = materials.filter((m) =>
        data.progress.some(
          (p) => p.student_id === profile.id && p.material_id === m.id && p.completed
        )
      ).length;
      rows.push(
        `<tr><td>${esc(profile.name)}</td><td>${esc(c.title)}</td><td>${completed} / ${materials.length} materi</td><td>${materials.length ? Math.round((completed / materials.length) * 100) : 0}%</td></tr>`
      );
    }
  }
  return `<section class="panel"><h2>Penyelesaian materi siswa</h2><p class="muted">Berdasarkan materi yang ditandai selesai oleh siswa pada kelas aktif.</p>${rows.length ? `<div class="table-wrap"><table><thead><tr><th>Siswa</th><th>Mapel</th><th>Ditandai selesai</th><th>Progres</th></tr></thead><tbody>${rows.join('')}</tbody></table></div>` : empty('Belum ada siswa terdaftar')}</section>`;
}
export function courseCard(c) {
  const p = completion(c.id);
  return `<a class="course-card ${esc(c.color || 'blue')}" href="#/course/${esc(c.id)}"><div class="course-art">${icon('book')}<span class="art-circle"></span><span class="subject-tag">MAPEL SEKOLAH</span></div><div class="course-body"><h3>${esc(c.title)}</h3><p>${esc(c.description || 'Mulai perjalanan belajarmu.')}</p><div class="progress-label"><span>${p.done} dari ${p.total} materi selesai</span><b>${p.percent}%</b></div>${progress(p.percent)}<span class="course-link">Buka pelajaran <span>↗</span></span></div></a>`;
}
export function progressPage() {
  const results = data.attempts.filter(
    (a) =>
      a.status === 'submitted' &&
      (user.role === 'student'
        ? a.student_id === user.id
        : visibleCourses().some((c) => c.id === a.course_id) &&
          data.memberships.some(
            (m) => m.class_id === currentClass()?.id && m.student_id === a.student_id
          ))
  );
  return `${heading('SETIAP LANGKAH BERARTI', 'Progres belajar', 'Penyelesaian materi dan hasil latihan ditampilkan secara terpisah.')}${user.role === 'student' ? `<div class="course-grid">${visibleCourses().map(courseCard).join('')}</div>` : studentProgress()}<section class="panel section-space"><h2>Riwayat latihan ${user.role !== 'student' ? 'siswa' : ''}</h2>${results.length ? `<div class="table-wrap"><table><thead><tr><th>Latihan</th><th>Siswa</th><th>Tanggal</th><th>Nilai</th></tr></thead><tbody>${results.map((a) => `<tr><td>${esc(a.title)}</td><td>${esc(data.profiles.find((p) => p.id === a.student_id)?.name || 'Siswa')}</td><td>${date(a.submitted_at)}</td><td><span class="pill">${a.score}%</span>${a.student_id === user.id ? ` <a href="#/attempt/${esc(a.id)}">Rincian →</a>` : ''}</td></tr>`).join('')}</tbody></table></div>` : empty('Belum ada latihan selesai', 'Hasil latihan akan tersimpan setelah kamu mengirim jawaban.')}</section>`;
}
export function bindReports() {
  const main = document.querySelector('#main');
  if (!main || !['observer', 'admin'].includes(user.role)) return;
  const label = document.createElement('label');
  label.className = 'report-filter';
  label.textContent = 'Cari siswa atau mapel';
  const input = document.createElement('input');
  input.type = 'search';
  input.placeholder = 'Ketik nama siswa, mapel, atau latihan';
  label.append(input);
  main.querySelector('.page-heading')?.after(label);
  input.oninput = () => {
    const q = input.value.toLowerCase();
    main
      .querySelectorAll('tbody tr')
      .forEach((r) => (r.hidden = !r.textContent.toLowerCase().includes(q)));
  };
}

import { data, currentClass, setClass } from '../lib/store.js';
import { heading, esc, icon, empty } from '../lib/ui.js';
export function classesPage() {
  return `${heading('RUANG BELAJARMU', 'Pilih kelas', 'Hanya kelas yang sudah diberikan pengelola yang ditampilkan.')}<div class="class-grid">${data.classes.map((c) => `<button class="class-option ${c.id === currentClass()?.id ? 'selected' : ''}" data-class="${esc(c.id)}">${icon('school')}<span><strong>${esc(c.title)}</strong><small>Tahun ajaran ${esc(c.year || '—')}</small></span>${icon(c.id === currentClass()?.id ? 'check' : 'arrow')}</button>`).join('') || empty('Belum ada kelas', 'Hubungi admin untuk mendapatkan akses kelas.')}</div>`;
}
export function bindClasses() {
  document.querySelectorAll('[data-class]').forEach(
    (b) =>
      (b.onclick = () => {
        setClass(b.dataset.class);
        location.hash = '/learn';
      })
  );
}

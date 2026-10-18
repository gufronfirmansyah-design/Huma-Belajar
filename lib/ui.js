export const esc = (value) =>
  String(value ?? '').replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]
  );
import { icon } from './icons.js';
import { mathText, formula } from './math.js';
export { mathText };
export { icon };
export const empty = (title, text = 'Konten yang tersedia akan muncul di sini.') =>
  `<div class="empty">${icon('book')}<h3>${esc(title)}</h3><p>${esc(text)}</p></div>`;
export const heading = (eyebrow, title, desc = '', action = '') =>
  `<div class="page-heading"><div><p class="eyebrow">${esc(eyebrow)}</p><h1>${esc(title)}</h1>${desc ? `<p class="muted">${esc(desc)}</p>` : ''}</div>${action}</div>`;
export const progress = (value) =>
  `<div class="progress" role="progressbar" aria-valuenow="${Math.round(value)}" aria-valuemin="0" aria-valuemax="100"><span style="width:${Math.min(100, Math.max(0, value))}%"></span></div>`;
export const date = (value) =>
  value
    ? new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeZone: 'Asia/Jakarta' }).format(
        new Date(value)
      )
    : '—';
export function toast(message, error = false) {
  const el = document.querySelector('#toast');
  el.textContent = message;
  el.className = error ? 'visible error' : 'visible';
  clearTimeout(window.toastTimer);
  window.toastTimer = setTimeout(() => (el.className = ''), 5000);
}
export function safeUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' ? url.href : null;
  } catch {
    return null;
  }
}
export function blocks(data = []) {
  return data
    .map((b) => {
      if (b.type === 'table')
        return `<div class="table-wrap"><table>${b.rows.map((row) => `<tr>${row.map((c) => `<td>${mathText(c)}</td>`).join('')}</tr>`).join('')}</table></div>`;
      if (b.type === 'formula') {
        const math = formula(b.text, true);
        return `<div class="formula" aria-label="Rumus">${math}</div>`;
      }
      return `<p>${mathText(b.text)}</p>`;
    })
    .join('');
}
export const questionImage = (q) =>
  q.file_path
    ? `<div class="question-image"><button type="button" class="button secondary" data-image="${esc(q.file_path)}" data-alt="${esc(q.image_alt || 'Ilustrasi soal')}">Tampilkan gambar soal</button></div>`
    : '';
export function formData(form) {
  return Object.fromEntries(new FormData(form));
}
export function download(name, text, type = 'application/json') {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

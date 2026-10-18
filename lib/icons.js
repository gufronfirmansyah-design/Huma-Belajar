// Ikon SVG lokal: tidak membutuhkan koneksi CDN atau font ikon.
const paths = {
  home: '<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z"/>',
  book: '<path d="M12 5v16M12 5C9 3 5 3 2 4v15c4-1 7-1 10 2 3-3 6-3 10-2V4c-3-1-7-1-10 1Z"/><path d="M5 8h4M5 11h4M15 8h4M15 11h4"/>',
  quiz: '<rect x="5" y="4" width="14" height="18" rx="3"/><rect x="9" y="2" width="6" height="4" rx="1"/><path d="m8 11 1 1 2-2M13 11h3m-8 6 1 1 2-2M13 17h3"/>',
  chart: '<path d="M21 13a9 9 0 1 1-10-10v10z"/><path d="M15 2v7h7a9 9 0 0 0-7-7Z"/>',
  user: '<circle cx="12" cy="7" r="4"/><path d="M4 21v-2a8 8 0 0 1 16 0v2"/>',
  school: '<path d="m2 9 10-6 10 6-10 6zM6 12v6c4 3 8 3 12 0v-6M22 9v8"/>',
  arrow: '<path d="M5 12h14m-6-6 6 6-6 6"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  back: '<path d="M19 12H5m6-6-6 6 6 6"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  logout: '<path d="M9 4H4v16h5m1-8h12m-5-5 5 5-5 5"/>',
  gear: '<path d="m9 3-1 3-3 1-2 4 2 2v3l3 3h3l2 2 4-2 1-3 3-1v-5l-3-1-1-3-4-2z"/><circle cx="12" cy="12" r="3"/>',
  math: '<rect x="3" y="3" width="18" height="18" rx="4"/><path d="M6 8h5M8.5 5.5v5M14 8h4M6 15l4 4m0-4-4 4m8-3h4m-4 3h4"/>',
  science:
    '<path d="M9 3h6m-5 0v7L4 20a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1l-6-10V3M7 15h10"/><circle cx="10" cy="18" r=".6"/>',
  language:
    '<path d="M3 5h12M9 2v3m-4 0c0 6 4 10 9 12M13 5c-1 6-5 10-11 12m11 4 4-11 5 11m-7-4h5"/>',
  target:
    '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
  trophy:
    '<path d="M8 3h8v5a4 4 0 0 1-8 0zM8 5H3v3a5 5 0 0 0 5 5m8-8h5v3a5 5 0 0 1-5 5m-4-1v7m-4 2h8"/>',
  play: '<circle cx="12" cy="12" r="10"/><path d="m10 8 6 4-6 4Z"/>',
  search: '<circle cx="10" cy="10" r="7"/><path d="m15 15 6 6"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  spark: '<path d="m12 2 3 7 7 3-7 3-3 7-3-7-7-3 7-3z"/>',
  shield: '<path d="m12 2 9 4v6c0 5-9 10-9 10S3 17 3 12V6z"/><path d="m8 12 3 3 5-6"/>',
  folder: '<path d="M3 7V4h7l3 3h8v14H3z"/>',
  cloud: '<path d="M7 18a6 6 0 1 1 1-12 7 7 0 0 1 13 5 4 4 0 0 1-2 7M12 12v10m-3-7 3-3 3 3"/>',
  pdf: '<path d="M5 2h9l5 5v15H5zM14 2v6h5M8 12h8m-8 4h6"/>'
};
export const icon = (name, cls = '') =>
  `<span aria-hidden="true" class="icon ${cls}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${paths[name] || paths.book}</svg></span>`;
export function subjectIcon(course) {
  const text = course.title.toLowerCase();
  return /matematika|fisika/.test(text)
    ? 'math'
    : /bahasa/.test(text)
      ? 'language'
      : /alam|ipa|kimia|biologi/.test(text)
        ? 'science'
        : 'book';
}

import { esc } from './ui.js';

// Hanya membentuk URL dari penyedia yang dikenali; tidak menerima kode HTML embed.
export function mediaSource(value, kind) {
  let url;
  try {
    url = new URL(value);
  } catch {
    throw Error('Masukkan tautan HTTPS yang lengkap.');
  }
  if (url.protocol !== 'https:' || url.username || url.password || url.port)
    throw Error('Gunakan tautan HTTPS tanpa nama pengguna atau port.');
  if (kind === 'drive') {
    if (url.hostname !== 'drive.google.com') throw Error('Gunakan tautan berkas Google Drive.');
    const id =
      url.pathname.match(/^\/file\/d\/([\w-]+)\/(?:view|preview)$/)?.[1] ||
      (url.pathname === '/open' ? url.searchParams.get('id') : null);
    if (!id || !/^[\w-]+$/.test(id))
      throw Error('Salin tautan berbagi berkas Drive, bukan tautan folder.');
    return {
      url: `https://drive.google.com/file/d/${id}/view`,
      embed: `https://drive.google.com/file/d/${id}/preview`
    };
  }
  if (kind === 'video') {
    let id;
    if (url.hostname === 'youtu.be') id = url.pathname.slice(1);
    else if (['youtube.com', 'www.youtube.com', 'm.youtube.com'].includes(url.hostname))
      id = url.searchParams.get('v') || url.pathname.match(/^\/(?:embed|shorts)\/([\w-]+)$/)?.[1];
    if (!id || !/^[\w-]{11}$/.test(id)) throw Error('Gunakan tautan video YouTube yang valid.');
    return {
      url: `https://www.youtube.com/watch?v=${id}`,
      embed: `https://www.youtube.com/embed/${id}`,
      cover: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`
    };
  }
  throw Error('Jenis pratinjau tidak didukung.');
}
export function mediaPreview(value, kind, title) {
  try {
    const source = mediaSource(value, kind);
    return `<div class="media-card">${source.cover ? `<img class="media-cover" src="${esc(source.cover)}" alt="Sampul video ${esc(title)}" loading="lazy">` : '<div class="media-placeholder">▧ <span>Berkas Google Drive · publik</span></div>'}<details><summary>Lihat ${kind === 'video' ? 'video' : 'berkas'} di sini</summary><iframe class="media-frame ${kind === 'drive' ? 'document-frame' : ''}" title="${esc(title)}" src="${esc(source.embed)}" loading="lazy" referrerpolicy="strict-origin-when-cross-origin" allow="fullscreen; encrypted-media" allowfullscreen></iframe></details><p class="muted">Jika pratinjau tidak tersedia, buka sumber aslinya. Tautan Drive ini dapat dibagikan ke siapa saja.</p><a class="button secondary" href="${esc(source.url)}" target="_blank" rel="noopener noreferrer">Buka di tab baru ↗</a></div>`;
  } catch (e) {
    return `<p role="alert">${esc(e.message)}</p>`;
  }
}

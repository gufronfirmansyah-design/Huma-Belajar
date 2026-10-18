export function validateBlocks(blocks) {
  if (!Array.isArray(blocks) || blocks.length > 50) throw Error('Isi maksimal 50 blok.');
  for (const b of blocks) {
    if (!['paragraph', 'formula', 'table'].includes(b.type))
      throw Error('Jenis blok tidak didukung.');
    if (b.type === 'table') {
      if (
        !Array.isArray(b.rows) ||
        b.rows.length > 30 ||
        b.rows.some(
          (r) =>
            !Array.isArray(r) ||
            r.length > 10 ||
            r.some((c) => typeof c !== 'string' || c.length > 2000)
        )
      )
        throw Error('Tabel tidak valid.');
    } else if (typeof b.text !== 'string' || b.text.length > 20000)
      throw Error('Teks blok terlalu panjang.');
  }
  return blocks;
}
export function validateFile(file, maxBytes = 10 * 1024 * 1024) {
  if (!file || !file.size) throw Error('Pilih berkas yang tidak kosong.');
  if (file.size > maxBytes) throw Error('Berkas melebihi batas ukuran yang ditetapkan.');
  if (!['application/pdf', 'image/jpeg', 'image/png', 'image/webp'].includes(file.type))
    throw Error('Gunakan PDF, JPEG, PNG, atau WebP.');
}
export function validateTitle(title) {
  if (!title?.trim() || title.length > 200)
    throw Error('Judul wajib diisi, maksimal 200 karakter.');
  return title.trim();
}

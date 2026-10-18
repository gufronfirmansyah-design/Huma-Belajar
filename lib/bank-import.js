import '../vendor/jszip.min.js';
export const columns = [
  'kode_soal',
  'pertanyaan',
  'gambar_soal',
  'pilihan_a',
  'pilihan_b',
  'pilihan_c',
  'pilihan_d',
  'pilihan_e',
  'kunci',
  'pembahasan',
  'topik',
  'kesulitan',
  'sumber',
  'gambar_alt'
];
const fail = (message) => {
  throw Error(message);
};
// Check declared expansion before decompression. No files are extracted to disk.
async function openZip(bytes) {
  const b = bytes instanceof ArrayBuffer ? new Uint8Array(bytes) : bytes;
  const v = new DataView(b.buffer, b.byteOffset, b.byteLength);
  let end = b.length - 22;
  while (end >= Math.max(0, b.length - 65557) && v.getUint32(end, true) !== 0x06054b50) end--;
  if (end < 0 || end < Math.max(0, b.length - 65557)) fail('ZIP tidak valid.');
  const count = v.getUint16(end + 10, true);
  let p = v.getUint32(end + 16, true),
    total = 0;
  if (count > 1500) fail('Terlalu banyak berkas dalam ZIP.');
  for (let i = 0; i < count; i++) {
    if (p + 46 > b.length || v.getUint32(p, true) !== 0x02014b50) fail('Struktur ZIP rusak.');
    total += v.getUint32(p + 24, true);
    if (total > 30 * 1024 * 1024) fail('Isi ZIP maksimal 30 MB setelah dibuka.');
    p += 46 + v.getUint16(p + 28, true) + v.getUint16(p + 30, true) + v.getUint16(p + 32, true);
  }
  const zip = await globalThis.JSZip.loadAsync(b);
  for (const f of Object.values(zip.files))
    if ((f.unsafeOriginalName || f.name).split(/[\\/]/).includes('..'))
      fail('Nama folder ZIP tidak aman.');
  return zip;
}
const xml = (text) => {
  if (/<!DOCTYPE|<!ENTITY/i.test(text)) fail('XML tidak didukung.');
  const doc = new DOMParser().parseFromString(text, 'application/xml');
  if (doc.querySelector('parsererror')) fail('Excel rusak.');
  return doc;
};
export async function workbook(bytes, sheetName = 'SOAL', headers = columns) {
  const zip = await openZip(bytes);
  if (Object.keys(zip.files).some((n) => /vbaProject|externalLinks|drawings/i.test(n)))
    fail(
      'Gunakan Excel tanpa macro, tautan eksternal, atau gambar tertanam. Simpan gambar sebagai berkas terpisah.'
    );
  const read = async (n) =>
    zip.file(n)
      ? xml(await zip.file(n).async('string'))
      : fail('Bagian Excel tidak ditemukan: ' + n);
  const wb = await read('xl/workbook.xml');
  const sheet = [...wb.getElementsByTagNameNS('*', 'sheet')].find(
    (s) => s.getAttribute('name') === sheetName
  );
  if (!sheet) fail('Excel harus memiliki lembar ' + sheetName + '.');
  const rel = await read('xl/_rels/workbook.xml.rels');
  const target = [...rel.getElementsByTagNameNS('*', 'Relationship')]
    .find(
      (r) =>
        r.getAttribute('Id') ===
        (sheet.getAttributeNS(
          'http://schemas.openxmlformats.org/officeDocument/2006/relationships',
          'id'
        ) || sheet.getAttribute('r:id'))
    )
    ?.getAttribute('Target');
  if (!target || target.includes('..')) fail('Lokasi lembar tidak didukung.');
  const doc = await read(target.startsWith('/') ? target.slice(1) : 'xl/' + target);
  const strings = zip.file('xl/sharedStrings.xml')
    ? [...(await read('xl/sharedStrings.xml')).getElementsByTagNameNS('*', 'si')].map(
        (s) => s.textContent
      )
    : [];
  const rows = [];
  for (const row of doc.getElementsByTagNameNS('*', 'row')) {
    const values = [];
    for (const c of row.getElementsByTagNameNS('*', 'c')) {
      if (c.getElementsByTagNameNS('*', 'f').length)
        fail('Baris ' + row.getAttribute('r') + ': formula tidak diperbolehkan.');
      const letters = (c.getAttribute('r') || '').match(/^[A-Z]+/)?.[0];
      let index = 0;
      for (const ch of letters || '') index = index * 26 + ch.charCodeAt(0) - 64;
      if (index < 1 || index > headers.length) {
        if (c.textContent.trim()) fail('Kolom di luar template tidak diperbolehkan.');
        continue;
      }
      const raw = c.getElementsByTagNameNS('*', 'v')[0]?.textContent || '';
      values[index - 1] =
        c.getAttribute('t') === 's'
          ? strings[Number(raw)]
          : c.getAttribute('t') === 'inlineStr'
            ? c.getElementsByTagNameNS('*', 'is')[0]?.textContent || ''
            : raw;
    }
    if (values.some((x) => x?.trim())) rows.push(values);
  }
  if (headers.some((c, i) => rows[0]?.[i] !== c))
    fail('Judul kolom berbeda. Gunakan template terbaru tanpa mengubah baris pertama.');
  return rows
    .slice(1)
    .map((r) => Object.fromEntries(headers.map((c, i) => [c, (r[i] || '').trim()])));
}
export function validateRows(rows) {
  if (!Array.isArray(rows) || !rows.length || rows.length > 100) fail('Isi 1–100 soal per impor.');
  const codes = new Set();
  return rows.map((r, i) => {
    const bad = (m) => fail(`Baris ${i + 2}: ${m}`);
    if (!/^[A-Za-z0-9_-]{1,80}$/.test(r.kode_soal) || codes.has(r.kode_soal))
      bad('kode soal kosong, tidak valid, atau ganda.');
    codes.add(r.kode_soal);
    if (
      !r.pertanyaan ||
      r.pertanyaan.length > 20000 ||
      !r.pembahasan ||
      r.pembahasan.length > 20000
    )
      bad('isi pertanyaan dan pembahasan, maksimal 20.000 karakter.');
    const all = ['a', 'b', 'c', 'd', 'e'].map((k) => r['pilihan_' + k] || '');
    const opts = all.filter(Boolean);
    if (
      opts.length < 2 ||
      all.slice(0, opts.length).some((x) => !x) ||
      opts.some((x) => x.length > 2000)
    )
      bad('isi 2–5 pilihan berurutan, maksimal 2.000 karakter.');
    const answer = 'ABCDE'.indexOf((r.kunci || '').toUpperCase());
    if (answer < 0 || answer >= opts.length) bad('kunci harus menunjuk pilihan yang diisi.');
    if (r.kesulitan && !['mudah', 'sedang', 'sulit'].includes(r.kesulitan))
      bad('kesulitan: mudah, sedang, atau sulit.');
    if (r.gambar_soal && !/^gambar\/[A-Za-z0-9_-]+\.(png|jpg|jpeg|webp)$/i.test(r.gambar_soal))
      bad('gambar harus seperti gambar/MAT-001.png.');
    if (r.gambar_soal && !r.gambar_alt) bad('isi penjelasan gambar.');
    return {
      code: r.kode_soal,
      title: r.kode_soal + ' · ' + r.pertanyaan.slice(0, 100),
      body: [{ type: 'paragraph', text: r.pertanyaan }],
      options: opts,
      answer,
      explanation: r.pembahasan,
      topic: r.topik || '',
      difficulty: r.kesulitan || '',
      source: r.sumber || '',
      image_alt: r.gambar_alt || '',
      image: r.gambar_soal || '',
      status: 'draft'
    };
  });
}
export async function readBank(file) {
  if (file.size > 10 * 1024 * 1024) fail('Berkas impor maksimal 10 MB.');
  let bytes = await file.arrayBuffer(),
    images = new Map();
  if (file.name.toLowerCase().endsWith('.zip')) {
    const zip = await openZip(bytes),
      sheets = Object.keys(zip.files).filter((n) => /^[^/]+\.xlsx$/i.test(n));
    if (sheets.length !== 1) fail('ZIP harus berisi tepat satu Excel di luar folder gambar.');
    bytes = await zip.file(sheets[0]).async('uint8array');
    for (const f of Object.values(zip.files))
      if (!f.dir && /^gambar\//.test(f.name)) {
        const body = await f.async('uint8array');
        const type =
          body[0] === 137 && body[1] === 80 && body[2] === 78 && body[3] === 71
            ? 'image/png'
            : body[0] === 255 && body[1] === 216
              ? 'image/jpeg'
              : String.fromCharCode(...body.slice(0, 4)) === 'RIFF' &&
                  String.fromCharCode(...body.slice(8, 12)) === 'WEBP'
                ? 'image/webp'
                : null;
        if (!type) fail('Bukan gambar PNG/JPEG/WebP: ' + f.name);
        images.set(f.name, new File([body], f.name.split('/').pop(), { type }));
      }
  } else if (!file.name.toLowerCase().endsWith('.xlsx')) fail('Pilih XLSX atau ZIP.');
  const rows = validateRows(await workbook(bytes));
  for (const r of rows)
    if (r.image && !images.has(r.image))
      fail('Gambar belum tersedia: ' + r.image + '. Gunakan ZIP.');
  return { rows, images };
}

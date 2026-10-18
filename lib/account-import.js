import { workbook } from './bank-import.js';
export function validateAccounts(rows) {
  if (!Array.isArray(rows) || !rows.length || rows.length > 100)
    throw Error('Isi 1–100 siswa per berkas.');
  const seen = new Set();
  return rows.map((r, i) => {
    const name = String(r.nama || '').trim(),
      username = String(r.username || '')
        .trim()
        .toLowerCase();
    if (!name || name.length > 100) throw Error(`Baris ${i + 2}: nama wajib 1–100 karakter.`);
    if (
      !/^[a-z0-9][a-z0-9._-]{2,31}$/.test(username) ||
      username.endsWith('.') ||
      username.includes('..') ||
      seen.has(username)
    )
      throw Error(
        `Baris ${i + 2}: username tidak valid atau ganda. Gunakan 3–32 karakter huruf kecil/angka/titik/garis bawah/tanda minus; tanpa titik di akhir atau dua titik berurutan.`
      );
    seen.add(username);
    return { name, username };
  });
}
export async function readAccounts(file) {
  if (!file || !file.name.toLowerCase().endsWith('.xlsx') || file.size > 2 * 1024 * 1024)
    throw Error('Pilih template XLSX, maksimal 2 MB.');
  return validateAccounts(await workbook(await file.arrayBuffer(), 'AKUN', ['nama', 'username']));
}

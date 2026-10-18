import { client, isDemo } from './store.js';
export async function accountRequest(operation, payload = {}) {
  if (isDemo())
    throw Error(
      'Pengelolaan password dan akun nyata memerlukan koneksi Supabase. Mode demo tidak membuat akun.'
    );
  const { data, error } = await client.functions.invoke('accounts', {
    body: { ...payload, operation }
  });
  if (error) {
    let message =
      'Layanan akun belum dapat dihubungi. Periksa internet dan pemasangan fungsi accounts pada panduan kategori 02.';
    try {
      const detail = await error.context.json();
      if (detail.error) message = detail.error;
    } catch {
      /* Tidak menghapus isian pada kegagalan jaringan. */
    }
    throw Error(message);
  }
  if (data?.error) throw Error(data.error);
  return data;
}
export async function acceptSession(session) {
  const { error } = await client.auth.setSession({
    access_token: session.access_token,
    refresh_token: session.refresh_token
  });
  if (error) throw error;
}

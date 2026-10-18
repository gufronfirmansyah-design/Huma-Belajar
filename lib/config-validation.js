// Konfigurasi ini publik. Hanya publishable / legacy anon key yang diperbolehkan.
export function validatePublicConfig(input) {
  const config = {
    appName: 'HUMA BELAJAR',
    mode: input.mode,
    supabaseUrl: String(input.supabaseUrl || '')
      .trim()
      .replace(/\/$/, ''),
    supabasePublishableKey: String(input.supabasePublishableKey || '').trim()
  };
  if (!['demo', 'production'].includes(config.mode))
    throw Error('Pilih mode demo atau production.');
  if (config.mode === 'demo') return { ...config, supabaseUrl: '', supabasePublishableKey: '' };
  if (!/^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(config.supabaseUrl))
    throw Error('URL proyek harus seperti https://nama-proyek.supabase.co.');
  const key = config.supabasePublishableKey;
  if (key.startsWith('sb_secret_'))
    throw Error('Secret key tidak boleh digunakan di website. Pilih publishable key.');
  if (/^sb_publishable_[A-Za-z0-9_-]{10,}$/.test(key)) return config;
  try {
    const part = key.split('.')[1];
    const payload = JSON.parse(atob(part.replace(/-/g, '+').replace(/_/g, '/')));
    if (payload.role === 'service_role')
      throw Error('Service-role key dilarang di website publik.');
    if (payload.role === 'anon' && key.split('.').length === 3) return config;
  } catch (e) {
    if (e.message.includes('Service-role')) throw e;
  }
  throw Error('Masukkan publishable key atau legacy anon key yang benar dari dashboard Supabase.');
}

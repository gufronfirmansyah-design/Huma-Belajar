import { validatePublicConfig } from './lib/config-validation.js';
import { download, esc } from './lib/ui.js';
const form = document.querySelector('#setup-form'),
  status = document.querySelector('#setup-status'),
  results = document.querySelector('#connection-results');
const values = () => validatePublicConfig(Object.fromEntries(new FormData(form)));
function displayMode() {
  document.querySelector('#production-fields').hidden = form.elements.mode.value === 'demo';
  results.textContent = '';
  status.textContent = '';
}
form.elements.mode.onchange = displayMode;
try {
  const config = await fetch('./config.public.json', { cache: 'no-store' }).then((r) => r.json());
  for (const key of ['mode', 'supabaseUrl', 'supabasePublishableKey'])
    form.elements[key].value = config[key] || '';
  displayMode();
} catch {
  status.textContent = 'Konfigurasi lama belum terbaca. Isi formulir untuk membuat yang baru.';
}
form.onsubmit = (e) => {
  e.preventDefault();
  try {
    const config = values();
    download('config.public.json', JSON.stringify(config, null, 2) + '\n');
    status.className = 'setup-success';
    status.textContent =
      'Konfigurasi diunduh. Ganti berkas config.public.json pada sumber/website; aplikasi belum diubah otomatis.';
  } catch (e) {
    status.className = 'setup-error';
    status.textContent = e.message;
  }
};
document.querySelector('#check-connection').onclick = async () => {
  const button = document.querySelector('#check-connection');
  results.textContent = '';
  try {
    const config = values();
    if (config.mode === 'demo') {
      status.className = 'setup-success';
      status.textContent = 'Mode demo tidak memerlukan database. Ini bukan pemeriksaan Supabase.';
      return;
    }
    button.disabled = true;
    status.className = '';
    status.textContent = 'Memeriksa layanan dan versi skema…';
    const headers = { apikey: config.supabasePublishableKey, 'Content-Type': 'application/json' };
    // Legacy anon JWT perlu Authorization; publishable key baru bukan JWT.
    if (config.supabasePublishableKey.split('.').length === 3)
      headers.Authorization = 'Bearer ' + config.supabasePublishableKey;
    const health = await fetch(config.supabaseUrl + '/rest/v1/rpc/public_status', {
      method: 'POST',
      headers,
      body: '{}',
      signal: AbortSignal.timeout(10000)
    });
    if (!health.ok) {
      if (health.status === 404)
        throw Error(
          'Proyek merespons, tetapi fungsi pemeriksaan belum terpasang. Jalankan skema awal atau migrasi 02-upgrade-1.1.sql.'
        );
      if ([401, 403].includes(health.status))
        throw Error('Koneksi ditolak. Periksa URL proyek dan publishable/anon key.');
      throw Error(
        'Database belum dapat diperiksa (HTTP ' + health.status + '). Periksa dashboard proyek.'
      );
    }
    const info = await health.json();
    if (info.app !== 'HUMA BELAJAR')
      throw Error('Proyek merespons tetapi skemanya bukan HUMA BELAJAR.');
    if (info.schema_version !== '1.5.0')
      throw Error(
        'Database belum versi 1.5. Ikuti kategori 01: instalasi baru atau upgrade berurutan sampai 06-upgrade-1.5.sql.'
      );
    results.innerHTML = `<div class="connection-row"><b>✓ Database merespons</b><span>Skema ${esc(info.schema_version)}</span></div>`;
    const auth = await fetch(config.supabaseUrl + '/auth/v1/settings', {
      headers,
      signal: AbortSignal.timeout(10000)
    });
    if (auth.ok) {
      const settings = await auth.json();
      results.innerHTML += `<div class="connection-row"><b>${settings.external?.email ? '✓ Login password diaktifkan' : '○ Login password belum aktif'}</b><span>Gunakan provider Email; pendaftaran siswa dilakukan melalui fungsi accounts, bukan tombol Google.</span></div>`;
    } else
      results.innerHTML +=
        '<div class="connection-row"><b>○ Pengaturan login belum dapat diperiksa</b><span>Periksa melalui dashboard Supabase.</span></div>';
    const accounts = await fetch(config.supabaseUrl + '/functions/v1/accounts', {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ operation: 'health' }),
      signal: AbortSignal.timeout(10000)
    });
    if (!accounts.ok || (await accounts.json()).version !== '1.5.0')
      throw Error('Fungsi accounts belum siap. Ikuti panduan kategori 02 untuk memasangnya.');
    results.innerHTML +=
      '<div class="connection-row"><b>✓ Layanan akun merespons</b><span>Tetap uji pendaftaran, login, dan perubahan password nyata.</span></div>';
    status.className = 'setup-success';
    status.textContent =
      'Pemeriksaan dasar selesai. Ini belum menguji akun, izin antarsiswa, unggahan berkas, atau pengiriman latihan. Lanjutkan uji layanan nyata.';
  } catch (e) {
    status.className = 'setup-error';
    status.textContent =
      e.name === 'TimeoutError'
        ? 'Koneksi terlalu lama. Periksa internet dan status proyek, lalu coba lagi.'
        : e.message;
  } finally {
    button.disabled = false;
  }
};

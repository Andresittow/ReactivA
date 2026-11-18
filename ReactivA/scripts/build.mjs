import { loadEnvFile } from 'node:process';
import { existsSync, writeFileSync, copyFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

export function validateSupabaseConfig(env) {
  const url = env.SUPABASE_URL?.trim();
  const key = env.SUPABASE_ANON_KEY?.trim();
  if (!url || !key) throw new Error('Configura SUPABASE_URL y SUPABASE_ANON_KEY en Vercel o .env.production.');
  let parsed;
  try { parsed = new URL(url); } catch { throw new Error('SUPABASE_URL debe ser una URL HTTPS valida.'); }
  if (parsed.protocol !== 'https:' || parsed.username || parsed.password || /TU_PROYECTO|placeholder/i.test(url)) {
    throw new Error('SUPABASE_URL debe ser la URL HTTPS de tu proyecto Supabase.');
  }
  if (key.startsWith('sb_publishable_') && !key.includes('TU_CLAVE')) return { url, key };
  try {
    const payload = JSON.parse(Buffer.from(key.split('.')[1], 'base64url').toString());
    if (key.split('.').length === 3 && payload.role === 'anon') return { url, key };
  } catch { /* Se informa abajo sin imprimir la clave. */ }
  throw new Error('SUPABASE_ANON_KEY debe ser publishable o anon; nunca service_role ni sb_secret_.');
}

function main() {
  const root = fileURLToPath(new URL('../', import.meta.url));
  process.chdir(root);
  const args = process.argv.slice(2);
  // Conservar el comando de verificacion de desarrollo existente.
  const development = args.some(arg => arg === 'development' || arg === '--configuration=development');
  if (!development) {
    if (existsSync('.env.production')) loadEnvFile('.env.production');
    const { url, key } = validateSupabaseConfig(process.env);
    writeFileSync('src/environments/environment.generated.ts',
      '// Generado por scripts/build.mjs. Solo configuracion publica.\nexport const environment = ' +
      JSON.stringify({ production: true, supabaseUrl: url, supabaseAnonKey: key }, null, 2) + ';\n');
  }
  const result = spawnSync(process.execPath, ['node_modules/@angular/cli/bin/ng.js', 'build', ...args], { stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
  if (!development) {
    // El shell CSR es el fallback de rutas privadas; las paginas prerenderizadas se conservan.
    const browser = resolve(root, 'dist/ReactivA/browser');
    const shell = resolve(browser, 'index.csr.html');
    if (!existsSync(shell)) throw new Error('No se genero index.csr.html para las rutas de cliente.');
    copyFileSync(shell, resolve(browser, 'index.html'));
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try { main(); } catch (error) { console.error(error.message); process.exitCode = 1; }
}

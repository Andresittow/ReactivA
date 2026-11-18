import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateSupabaseConfig } from './build.mjs';

const url = 'https://example.supabase.co';
const jwt = role => `header.${Buffer.from(JSON.stringify({ role })).toString('base64url')}.signature`;
test('acepta claves publicas publishable y anon', () => {
  for (const key of ['sb_publishable_example', jwt('anon')]) {
    assert.deepEqual(validateSupabaseConfig({ SUPABASE_URL: url, SUPABASE_ANON_KEY: key }), { url, key });
  }
});
test('bloquea secretos y configuracion incompleta antes de publicar', () => {
  for (const key of [undefined, '', 'placeholder-anon-key', 'sb_secret_example', jwt('service_role')]) {
    assert.throws(() => validateSupabaseConfig({ SUPABASE_URL: url, SUPABASE_ANON_KEY: key }));
  }
  for (const badUrl of ['', 'invalida', 'http://example.supabase.co', 'https://TU_PROYECTO.supabase.co']) {
    assert.throws(() => validateSupabaseConfig({ SUPABASE_URL: badUrl, SUPABASE_ANON_KEY: 'sb_publishable_example' }));
  }
});

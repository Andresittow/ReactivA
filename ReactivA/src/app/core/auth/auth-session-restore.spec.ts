import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { Router } from '@angular/router';
import { createClient } from '@supabase/supabase-js';
import { AuthService, PROGRESS_SYNC_HANDLER } from './auth.service';
import { SUPABASE_CLIENT } from '../supabase/supabase.client';

describe('Recarga con una sesión persistida y el SDK de Supabase', () => {
  it.each(['estudiante', 'docente'])('restaura el perfil %s sin bloquear el arranque', async role => {
    const user = { id: '00000000-0000-4000-8000-000000000001', aud: 'authenticated',
      role: 'authenticated', email: 'prueba@example.com', app_metadata: {}, user_metadata: {},
      created_at: '2026-01-01T00:00:00Z' };
    let stored: string | null = JSON.stringify({ access_token: 'test-access-token', refresh_token: 'test-refresh-token',
      token_type: 'bearer', expires_in: 3600, expires_at: Math.floor(Date.now() / 1000) + 3600, user });
    const fetchProfile = vi.fn(async () => new Response(JSON.stringify({ id: user.id, role,
      full_name: 'Cuenta de prueba', school: 'Colegio' }), { status: 200, headers: { 'Content-Type': 'application/json' } }));
    class WebSocketStub {}
    const client = createClient('https://example.supabase.co', 'sb_publishable_test', {
      auth: { persistSession: true, autoRefreshToken: false, detectSessionInUrl: false,
        storageKey: `restore-test-${role}`, storage: {
          getItem: () => stored,
          setItem: (_key, value) => { stored = value; },
          removeItem: () => { stored = null; }
        } },
      global: { fetch: fetchProfile },
      realtime: { transport: WebSocketStub as any }
    });
    const progress = { hydrate: vi.fn().mockResolvedValue(undefined), reset: vi.fn() };
    TestBed.configureTestingModule({ providers: [AuthService,
      { provide: SUPABASE_CLIENT, useValue: client },
      { provide: PLATFORM_ID, useValue: 'browser' },
      { provide: Router, useValue: { url: '/periodic-table', navigate: vi.fn().mockResolvedValue(true) } },
      { provide: PROGRESS_SYNC_HANDLER, useValue: progress }
    ] });
    const auth = TestBed.inject(AuthService);
    let timeout!: ReturnType<typeof setTimeout>;
    try {
      const result = await Promise.race([
        auth.restoreSession().then(() => 'ready'),
        new Promise<string>(resolve => { timeout = setTimeout(() => resolve('blocked'), 1000); })
      ]);
      expect(result).toBe('ready');
      expect(auth.ready()).toBe(true);
      expect(auth.role()).toBe(role);
      expect(auth.user()?.fullName).toBe('Cuenta de prueba');
      expect(fetchProfile).toHaveBeenCalled();
      expect(progress.hydrate).toHaveBeenCalled();
    } finally {
      clearTimeout(timeout);
      auth.ngOnDestroy();
      await client.auth.stopAutoRefresh();
      client.realtime.disconnect();
    }
  });
});

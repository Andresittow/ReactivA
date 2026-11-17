import { PLATFORM_ID, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { SUPABASE_CLIENT } from '../supabase/supabase.client';
import { DEFAULT_PREFERENCES, SettingsService, normalizePreferences } from './settings.service';

describe('SettingsService PR-L2', () => {
  const user = signal<{ id: string } | null>(null);
  const read = vi.fn();
  const upsert = vi.fn();
  const eq = vi.fn();
  const select = vi.fn();
  const from = vi.fn();
  const media = { matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() };
  beforeEach(() => {
    const values = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => { values.set(key, value); },
      removeItem: (key: string) => { values.delete(key); },
      clear: () => values.clear(), key: (index: number) => [...values.keys()][index] ?? null,
      get length() { return values.size; }
    } satisfies Storage);
    vi.resetAllMocks(); document.defaultView!.localStorage.clear(); user.set({ id: 'a' });
    media.matches = false;
    vi.stubGlobal('matchMedia', vi.fn(() => media));
    eq.mockReturnValue({ maybeSingle: read }); select.mockReturnValue({ eq }); from.mockReturnValue({ select, upsert });
    read.mockResolvedValue({ data: null, error: null }); upsert.mockResolvedValue({ error: null });
    TestBed.configureTestingModule({ providers: [provideRouter([]),
      { provide: PLATFORM_ID, useValue: 'browser' },
      { provide: AuthService, useValue: { user } },
      { provide: SUPABASE_CLIENT, useValue: { from } }
    ] });
  });
  afterEach(() => {
    TestBed.resetTestingModule();
    document.documentElement.className = '';
    document.documentElement.removeAttribute('data-theme');
    document.documentElement.removeAttribute('data-font-size');
    vi.restoreAllMocks(); vi.unstubAllGlobals();
  });
  it('carga solo user_settings del usuario activo y aplica tema remoto', async () => {
    read.mockResolvedValue({ data: { preferences: { theme: 'dark', highContrast: true } }, error: null });
    const service = TestBed.inject(SettingsService);
    const value = await service.load();
    expect(from).toHaveBeenCalledWith('user_settings'); expect(eq).toHaveBeenCalledWith('user_id', 'a');
    expect(value.theme).toBe('dark'); expect(document.documentElement.classList.contains('theme-dark')).toBe(true);
    expect(service.preferences().highContrast).toBe(true);
    expect(document.defaultView!.localStorage.getItem('reactiva_theme')).toBe('dark');
    expect(document.defaultView!.localStorage.length).toBe(1);
  });
  it('usuario sin fila obtiene valores por defecto sin escribir una fila ficticia', async () => {
    expect(await TestBed.inject(SettingsService).load()).toEqual(DEFAULT_PREFERENCES);
    expect(upsert).not.toHaveBeenCalled();
  });
  it('valida preferencias corruptas y no acepta claves arbitrarias', () => {
    const result = normalizePreferences({ theme: 'evil', fontSize: 'huge', highContrast: 'yes', profileVisibility: 'private', unknown: 'value' });
    expect(result.theme).toBe('light'); expect(result.highContrast).toBe(false); expect(result.profileVisibility).toBe('private');
    expect(result).not.toHaveProperty('unknown');
  });
  it('save comprueba respuesta del servidor y guarda privacidad por usuario', async () => {
    const service = TestBed.inject(SettingsService);
    await service.save({ ...DEFAULT_PREFERENCES, profileVisibility: 'private', showProgressPublicly: false });
    expect(upsert).toHaveBeenCalledWith(expect.objectContaining({ user_id: 'a', preferences: expect.objectContaining({ profileVisibility: 'private', showProgressPublicly: false }) }), { onConflict: 'user_id' });
    expect(service.preferences().profileVisibility).toBe('private');
  });
  it('rechazo de escritura no anuncia ni aplica preferencias guardadas', async () => {
    const service = TestBed.inject(SettingsService);
    upsert.mockResolvedValue({ error: new Error('RLS') });
    await expect(service.save({ ...DEFAULT_PREFERENCES, theme: 'dark' })).rejects.toThrow();
    expect(service.preferences().theme).toBe('light');
    expect(document.documentElement.classList.contains('theme-dark')).toBe(false);
  });
  it('aplica y revierte cada ajuste global', () => {
    const service = TestBed.inject(SettingsService);
    service.apply({ ...DEFAULT_PREFERENCES, fontSize: 'lg', reduceMotion: true, highContrast: true, dyslexicFont: true, largeInteractiveTargets: true });
    expect(document.documentElement.dataset['fontSize']).toBe('lg');
    for (const value of ['reduce-motion', 'high-contrast', 'dyslexic-font', 'large-targets']) expect(document.documentElement.classList.contains(value)).toBe(true);
    service.apply({ ...DEFAULT_PREFERENCES });
    for (const value of ['reduce-motion', 'high-contrast', 'dyslexic-font', 'large-targets']) expect(document.documentElement.classList.contains(value)).toBe(false);
  });
  it('init idempotente sigue cambios del sistema y retira listener al destruir', async () => {
    const service = TestBed.inject(SettingsService); service.init(); service.init();
    TestBed.tick(); await service.load();
    service.apply({ ...DEFAULT_PREFERENCES, theme: 'system' });
    expect(media.addEventListener).toHaveBeenCalledTimes(1);
    const update = media.addEventListener.mock.calls[0][1] as () => void;
    media.matches = true; update();
    expect(document.documentElement.classList.contains('theme-dark')).toBe(true);
    service.apply({ ...DEFAULT_PREFERENCES, theme: 'light' }); update();
    expect(document.documentElement.classList.contains('theme-dark')).toBe(false);
    TestBed.resetTestingModule(); expect(media.removeEventListener).toHaveBeenCalledWith('change', update);
  });
  it('logout restablece estilos y nueva cuenta no hereda preferencias', async () => {
    read.mockResolvedValue({ data: { preferences: { theme: 'dark', highContrast: true } }, error: null });
    const service = TestBed.inject(SettingsService); service.init(); TestBed.tick(); await service.load();
    user.set(null); TestBed.tick();
    expect(service.preferences()).toEqual(DEFAULT_PREFERENCES);
    expect(document.documentElement.classList.contains('high-contrast')).toBe(false);
    expect(document.defaultView!.localStorage.getItem('reactiva_theme')).toBeNull();
    read.mockResolvedValue({ data: null, error: null }); user.set({ id: 'b' }); TestBed.tick(); await service.load();
    expect(service.preferences().theme).toBe('light'); expect(eq).toHaveBeenLastCalledWith('user_id', 'b');
  });
  it('no aplica una respuesta tardía de otra cuenta', async () => {
    let resolve!: (value: unknown) => void;
    read.mockReturnValueOnce(new Promise(r => { resolve = r; }));
    const service = TestBed.inject(SettingsService); const load = service.load();
    user.set({ id: 'b' }); resolve({ data: { preferences: { theme: 'dark' } }, error: null });
    await expect(load).rejects.toThrow();
    expect(service.preferences().theme).toBe('light');
  });
  it('no deja que lectura anterior reemplace un guardado posterior', async () => {
    let resolve!: (value: unknown) => void;
    read.mockReturnValueOnce(new Promise(r => { resolve = r; }));
    const service = TestBed.inject(SettingsService); const load = service.load();
    await service.save({ ...DEFAULT_PREFERENCES, theme: 'dark' });
    resolve({ data: null, error: null }); await expect(load).rejects.toThrow();
    expect(service.preferences().theme).toBe('dark');
  });
  it('permite reintentar la carga tras error y bloquea acceso sin sesión', async () => {
    read.mockResolvedValueOnce({ data: null, error: new Error('red') });
    const service = TestBed.inject(SettingsService);
    await expect(service.load()).rejects.toThrow(); expect(service.error()).toBeTruthy();
    await service.load(); expect(service.error()).toBeNull();
    user.set(null); await expect(service.save({ ...DEFAULT_PREFERENCES })).rejects.toThrow();
  });
  it('SSR no consulta Supabase ni toca DOM ni almacenamiento', async () => {
    TestBed.overrideProvider(PLATFORM_ID, { useValue: 'server' });
    const write = vi.spyOn(document.defaultView!.localStorage, 'setItem'); const readStorage = vi.spyOn(document.defaultView!.localStorage, 'getItem');
    const toggle = vi.spyOn(document.documentElement.classList, 'toggle');
    const service = TestBed.inject(SettingsService); service.init(); service.apply({ ...DEFAULT_PREFERENCES, theme: 'dark' });
    await service.load(); await expect(service.save({ ...DEFAULT_PREFERENCES })).rejects.toThrow();
    expect(from).not.toHaveBeenCalled(); expect(toggle).not.toHaveBeenCalled();
    expect(write).not.toHaveBeenCalled(); expect(readStorage).not.toHaveBeenCalled();
  });
  it('almacenamiento bloqueado no impide guardar ni aplicar', async () => {
    vi.spyOn(document.defaultView!.localStorage, 'setItem').mockImplementation(() => { throw new Error('denied'); });
    await TestBed.inject(SettingsService).save({ ...DEFAULT_PREFERENCES, theme: 'dark' });
    expect(document.documentElement.classList.contains('theme-dark')).toBe(true);
  });
});

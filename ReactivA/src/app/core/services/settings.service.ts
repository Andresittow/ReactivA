import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { DestroyRef, Injectable, Injector, PLATFORM_ID, effect, inject, signal } from '@angular/core';
import { AuthService } from '../auth/auth.service';
import { UserPreferences } from '../models/preferences.model';
import { SUPABASE_CLIENT } from '../supabase/supabase.client';

export const DEFAULT_PREFERENCES: Readonly<UserPreferences> = {
  theme: 'light', fontSize: 'md', reduceMotion: false,
  notifChallenges: false, notifReminders: false, notifUpdates: false,
  notifAchievements: false, notifLearningTips: false,
  profileVisibility: 'institutional', showProgressPublicly: true,
  allowPeerMessages: false, twoFactorAuth: false,
  favoriteBranch: 'Química Orgánica & Hidrocarburos', preferredDifficulty: 'intermedio',
  studyRemindersFrequency: 'none', audioFeedback: false, autoStepSolutions: false,
  highContrast: false, dyslexicFont: false, screenReaderOptimized: false,
  largeInteractiveTargets: false
};
const THEME_CACHE = 'reactiva_theme';

/** Discard malformed or future fields rather than applying arbitrary attributes. */
export function normalizePreferences(value: unknown): UserPreferences {
  const result = { ...DEFAULT_PREFERENCES };
  if (!value || typeof value !== 'object') return result;
  const input = value as Record<string, unknown>;
  for (const key of Object.keys(result) as (keyof UserPreferences)[]) {
    if (typeof result[key] === 'boolean' && typeof input[key] === 'boolean') {
      Object.assign(result, { [key]: input[key] });
    }
  }
  const enums = {
    theme: ['light', 'dark', 'system'], fontSize: ['sm', 'md', 'lg'],
    profileVisibility: ['public', 'institutional', 'private'],
    preferredDifficulty: ['basico', 'intermedio', 'avanzado'],
    studyRemindersFrequency: ['daily', 'weekdays', 'none']
  } as const;
  for (const [key, allowed] of Object.entries(enums)) {
    if ((allowed as readonly unknown[]).includes(input[key])) Object.assign(result, { [key]: input[key] });
  }
  if (typeof input['favoriteBranch'] === 'string') result.favoriteBranch = input['favoriteBranch'].slice(0, 150);
  return result;
}

@Injectable({ providedIn: 'root' })
export class SettingsService {
  private readonly auth = inject(AuthService);
  private readonly client = inject(SUPABASE_CLIENT);
  private readonly document = inject(DOCUMENT);
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly injector = inject(Injector);
  private readonly destroy = inject(DestroyRef);
  private initialized = false;
  private media: MediaQueryList | null = null;
  private revision = 0;
  private activeUser: string | null | undefined;
  private inFlight: { id: string; promise: Promise<UserPreferences> } | null = null;
  private applied = { ...DEFAULT_PREFERENCES };
  readonly preferences = signal<UserPreferences>({ ...DEFAULT_PREFERENCES });
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  init(): void {
    if (!this.browser || this.initialized) return;
    this.initialized = true;
    const view = this.document.defaultView;
    if (view?.matchMedia) {
      this.media = view.matchMedia('(prefers-color-scheme: dark)');
      const update = () => this.apply(this.applied);
      this.media.addEventListener('change', update);
      this.destroy.onDestroy(() => this.media?.removeEventListener('change', update));
    }
    try {
      this.apply(normalizePreferences({ theme: view?.localStorage.getItem(THEME_CACHE) }));
      view?.localStorage.removeItem('reactiva_settings_preferences');
      view?.localStorage.removeItem('reactiva_user_account_data');
    } catch { this.apply({ ...DEFAULT_PREFERENCES }); }
    effect(() => {
      const id = this.auth.user()?.id ?? null;
      if (id === this.activeUser) return;
      const previousUser = this.activeUser;
      this.activeUser = id;
      this.error.set(null);
      if (id) {
        this.preferences.set({ ...DEFAULT_PREFERENCES });
        if (previousUser !== undefined) this.apply({ ...DEFAULT_PREFERENCES });
        void this.load().catch(() => { /* error is exposed for retry in Settings */ });
      } else {
        this.revision++;
        this.preferences.set({ ...DEFAULT_PREFERENCES });
        this.apply({ ...DEFAULT_PREFERENCES });
        this.loading.set(false);
        try { view?.localStorage.removeItem(THEME_CACHE); } catch { /* Optional UI cache */ }
      }
    }, { injector: this.injector });
  }

  async load(): Promise<UserPreferences> {
    if (!this.browser) return { ...DEFAULT_PREFERENCES };
    const id = this.auth.user()?.id;
    if (!id) throw new Error('Inicia sesión para cargar tus preferencias.');
    if (this.inFlight?.id === id) return this.inFlight.promise;
    const revision = ++this.revision;
    this.loading.set(true);
    this.error.set(null);
    const promise = (async () => {
      try {
        const { data, error } = await this.client.from('user_settings')
          .select('preferences').eq('user_id', id).maybeSingle();
        if (error) throw error;
        const preferences = normalizePreferences(data?.preferences);
        if (this.auth.user()?.id !== id || revision !== this.revision) {
          throw new Error('La sesión o las preferencias cambiaron. Vuelve a intentarlo.');
        }
        this.preferences.set(preferences);
        this.apply(preferences);
        return preferences;
      } catch {
        if (this.auth.user()?.id === id && revision === this.revision) {
          this.error.set('No se pudieron cargar tus preferencias. Inténtalo nuevamente.');
        }
        throw new Error('No se pudieron cargar tus preferencias.');
      } finally {
        if (revision === this.revision) this.loading.set(false);
      }
    })();
    this.inFlight = { id, promise };
    try { return await promise; }
    finally { if (this.inFlight?.promise === promise) this.inFlight = null; }
  }

  async save(value: UserPreferences): Promise<void> {
    const id = this.auth.user()?.id;
    if (!this.browser || !id) throw new Error('Inicia sesión para guardar tus preferencias.');
    const revision = ++this.revision;
    this.loading.set(false);
    const preferences = normalizePreferences(value);
    const { error } = await this.client.from('user_settings').upsert({
      user_id: id, preferences, updated_at: new Date().toISOString()
    }, { onConflict: 'user_id' });
    if (error) throw new Error('No se pudieron guardar tus preferencias.');
    if (this.auth.user()?.id !== id || revision !== this.revision) {
      throw new Error('La sesión cambió. Vuelve a cargar las preferencias.');
    }
    this.preferences.set(preferences);
    this.apply(preferences);
  }

  apply(value: UserPreferences): void {
    if (!this.browser) return;
    const preferences = normalizePreferences(value);
    this.applied = preferences;
    const root = this.document.documentElement;
    const dark = preferences.theme === 'dark' ||
      (preferences.theme === 'system' && (this.media?.matches ?? this.document.defaultView?.matchMedia?.('(prefers-color-scheme: dark)').matches));
    root.classList.toggle('theme-dark', !!dark);
    root.classList.toggle('theme-light', !dark);
    root.setAttribute('data-theme', preferences.theme);
    root.setAttribute('data-font-size', preferences.fontSize);
    for (const [key, className] of Object.entries({ reduceMotion: 'reduce-motion',
      highContrast: 'high-contrast', dyslexicFont: 'dyslexic-font', largeInteractiveTargets: 'large-targets' })) {
      root.classList.toggle(className, !!preferences[key as keyof UserPreferences]);
    }
    try { this.document.defaultView?.localStorage.setItem(THEME_CACHE, preferences.theme); }
    catch { /* Preferences remain usable with storage blocked. */ }
  }
}

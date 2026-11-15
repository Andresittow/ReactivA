import { InjectionToken, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { createClient, SupabaseClient, SupportedStorage } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';

const REMEMBER_ME_KEY = 'reactiva_remember_me';

export function setRememberMePreference(remember: boolean): void {
  if (typeof window !== 'undefined' && window.localStorage) {
    window.localStorage.setItem(REMEMBER_ME_KEY, remember ? 'true' : 'false');
  }
}

export function getRememberMePreference(): boolean {
  if (typeof window !== 'undefined' && window.localStorage) {
    const val = window.localStorage.getItem(REMEMBER_ME_KEY);
    return val !== 'false';
  }
  return true;
}

export class ConfigurableAuthStorage implements SupportedStorage {
  getItem(key: string): string | null {
    if (typeof window === 'undefined') return null;
    const local = window.localStorage?.getItem(key);
    if (local !== null && local !== undefined) return local;
    return window.sessionStorage?.getItem(key) ?? null;
  }

  setItem(key: string, value: string): void {
    if (typeof window === 'undefined') return;
    const remember = getRememberMePreference();
    if (remember) {
      window.localStorage?.setItem(key, value);
      window.sessionStorage?.removeItem(key);
    } else {
      window.sessionStorage?.setItem(key, value);
      window.localStorage?.removeItem(key);
    }
  }

  removeItem(key: string): void {
    if (typeof window === 'undefined') return;
    window.localStorage?.removeItem(key);
    window.sessionStorage?.removeItem(key);
  }
}

function isValidHttpUrl(stringUrl: string): boolean {
  try {
    const parsed = new URL(stringUrl);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

class ServerWebSocketStub {}

export function buildSupabaseClient(platformId: object): SupabaseClient {
  const isBrowser = isPlatformBrowser(platformId);

  const rawUrl = environment.supabaseUrl;
  const rawKey = environment.supabaseAnonKey;

  const validUrl = isValidHttpUrl(rawUrl) ? rawUrl : 'https://placeholder-project.supabase.co';
  const validKey = rawKey && !rawKey.startsWith('<') ? rawKey : 'placeholder-anon-key';

  if (!isBrowser) {
    return createClient(validUrl, validKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false
      },
      realtime: {
        transport: ServerWebSocketStub as any
      }
    });
  }

  return createClient(validUrl, validKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: new ConfigurableAuthStorage()
    }
  });
}

export const SUPABASE_CLIENT = new InjectionToken<SupabaseClient>('SUPABASE_CLIENT', {
  providedIn: 'root',
  factory: () => buildSupabaseClient(inject(PLATFORM_ID))
});

import { Injectable, inject, signal, computed, PLATFORM_ID, InjectionToken, Injector, OnDestroy } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CLIENT, setRememberMePreference } from '../supabase/supabase.client';
import { Role, UserProfile } from '../models/user.model';
import { AuthError, mapSupabaseError } from './auth-error';

export interface ProgressSyncHandler {
  hydrate(): Promise<void>;
  reset(): void;
}

export const PROGRESS_SYNC_HANDLER = new InjectionToken<ProgressSyncHandler>('PROGRESS_SYNC_HANDLER');

export interface SignUpInput {
  email: string;
  password: string;
  fullName: string;
  role: Role;
  grade?: string;
  school?: string;
  newsletter?: boolean;
  teacherInviteCode?: string;
  classPin?: string;
}

export interface SignInInput {
  email: string;
  password: string;
  rememberMe: boolean;
  expectedRole?: Role;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService implements OnDestroy {
  private readonly supabase: SupabaseClient = inject(SUPABASE_CLIENT);
  private readonly router = inject(Router);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);
  private readonly injector = inject(Injector);
  private manualProgressHandler: ProgressSyncHandler | null = null;
  private _cachedInjectedHandler: ProgressSyncHandler | null | undefined = undefined;
  private authRevision = 0;
  private pendingAuthSync: ReturnType<typeof setTimeout> | undefined;
  private authSubscription: { unsubscribe(): void } | undefined;

  private readonly _user = signal<UserProfile | null>(null);
  private readonly _ready = signal<boolean>(false);

  readonly user = this._user.asReadonly();
  readonly ready = this._ready.asReadonly();
  readonly isAuthenticated = computed(() => this._user() !== null);
  readonly role = computed<Role | null>(() => this._user()?.role ?? null);

  get progressHandler(): ProgressSyncHandler | null {
    if (this.manualProgressHandler) {
      return this.manualProgressHandler;
    }
    if (this._cachedInjectedHandler === undefined) {
      try {
        this._cachedInjectedHandler = this.injector.get(PROGRESS_SYNC_HANDLER, null, { optional: true });
      } catch {
        this._cachedInjectedHandler = null;
      }
    }
    return this._cachedInjectedHandler;
  }

  registerProgressSyncHandler(handler: ProgressSyncHandler): void {
    this.manualProgressHandler = handler;
  }

  constructor() {
    if (this.isBrowser) {
      this.initAuthListener();
    }
  }

  private initAuthListener(): void {
    try {
      const { data } = this.supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_OUT') {
          this.authRevision++;
          clearTimeout(this.pendingAuthSync);
          this._user.set(null);
          this.progressHandler?.reset();
          // Redirigir a login con replaceUrl para no dejar pantallas privadas en historial
          if (this.router.url !== '/login' && !this.router.url.startsWith('/login') && this.router.url !== '/home') {
            void this.router.navigate(['/login'], { replaceUrl: true }).catch(err => {
              console.warn('[AuthService] Error navigating after sign out:', err);
            });
          }
        } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
          if (session?.user) {
            const revision = ++this.authRevision;
            clearTimeout(this.pendingAuthSync);
            // Supabase espera este callback bajo su bloqueo de sesion. Consultar
            // perfiles aqui bloquearia getSession() y el arranque tras recargar.
            this.pendingAuthSync = setTimeout(() => {
              this.pendingAuthSync = undefined;
              if (revision !== this.authRevision) return;
              void this.syncAuthUser(session.user.id, session.user.email ?? '', revision).catch(err => {
                console.warn('[AuthService] Error syncing auth state:', err);
              });
            }, 0);
          }
        }
      });
      this.authSubscription = data.subscription;
    } catch (err) {
      console.warn('[AuthService] Error setting up auth state listener:', err);
    }
  }

  ngOnDestroy(): void {
    this.authRevision++;
    clearTimeout(this.pendingAuthSync);
    this.authSubscription?.unsubscribe();
  }

  private async syncAuthUser(userId: string, email: string, revision: number): Promise<void> {
    await this.loadUserProfile(userId, email, revision);
    if (revision !== this.authRevision) return;
    await this.progressHandler?.hydrate();
  }

  async restoreSession(): Promise<void> {
    if (!this.isBrowser) {
      this._ready.set(true);
      return;
    }

    try {
      const { data, error } = await this.supabase.auth.getSession();
      if (error || !data.session?.user) {
        this._user.set(null);
        this.progressHandler?.reset();
      } else {
        await this.loadUserProfile(data.session.user.id, data.session.user.email ?? '');
        await this.progressHandler?.hydrate();
      }
    } catch (err) {
      console.warn('[AuthService] Error restoring session:', err);
      this._user.set(null);
      this.progressHandler?.reset();
    } finally {
      this._ready.set(true);
    }
  }

  private async loadUserProfile(userId: string, email: string, revision = this.authRevision): Promise<UserProfile | null> {
    try {
      const { data, error } = await this.supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (revision !== this.authRevision) return null;

      if (error || !data) {
        // Si el trigger aún no terminó de escribir o no se encuentra perfil, usar fallback razonable
        const fallback: UserProfile = {
          id: userId,
          role: 'estudiante',
          fullName: email.split('@')[0] || 'Usuario',
          email
        };
        this._user.set(fallback);
        return fallback;
      }

      const profile: UserProfile = {
        id: data.id,
        role: (data.role as Role) || 'estudiante',
        fullName: data.full_name || '',
        email: email || '',
        grade: data.grade ?? undefined,
        school: data.school ?? undefined,
        avatarUrl: data.avatar_url ?? undefined,
        newsletter: data.newsletter ?? false,
        createdAt: data.created_at ?? undefined
      };

      this._user.set(profile);
      return profile;
    } catch {
      if (revision !== this.authRevision) return null;
      const fallback: UserProfile = {
        id: userId,
        role: 'estudiante',
        fullName: email.split('@')[0] || 'Usuario',
        email
      };
      this._user.set(fallback);
      return fallback;
    }
  }

  async signUp(input: SignUpInput): Promise<{ needsEmailConfirmation: boolean }> {
    try {
      const { data, error } = await this.supabase.auth.signUp({
        email: input.email,
        password: input.password,
        options: {
          emailRedirectTo: this.isBrowser ? `${window.location.origin}/home` : undefined,
          data: {
            full_name: input.fullName,
            role: input.role,
            grade: input.grade || null,
            school: input.school || null,
            newsletter: !!input.newsletter,
            teacher_invite_code: input.teacherInviteCode || null,
            class_pin: input.classPin || null
          }
        }
      });

      if (error) {
        throw mapSupabaseError(error);
      }

      const needsEmailConfirmation = !data.session;

      if (!needsEmailConfirmation && data.user) {
        await this.loadUserProfile(data.user.id, data.user.email ?? input.email);
        await this.progressHandler?.hydrate();
      }

      return { needsEmailConfirmation };
    } catch (err: any) {
      if (err instanceof AuthError) throw err;
      throw mapSupabaseError(err);
    }
  }

  async signIn(input: SignInInput): Promise<UserProfile> {
    setRememberMePreference(input.rememberMe);

    try {
      const { data, error } = await this.supabase.auth.signInWithPassword({
        email: input.email,
        password: input.password
      });

      if (error || !data.user) {
        throw mapSupabaseError(error);
      }

      const profile = await this.loadUserProfile(data.user.id, data.user.email ?? input.email);
      if (!profile) {
        throw new AuthError('unknown', 'No se pudo cargar el perfil del usuario.');
      }

      if (input.expectedRole && profile.role !== input.expectedRole) {
        await this.supabase.auth.signOut();
        this._user.set(null);
        this.progressHandler?.reset();
        throw new AuthError(
          'role_mismatch',
          `El rol seleccionado (${input.expectedRole}) no coincide con el de tu cuenta (${profile.role}).`
        );
      }

      await this.progressHandler?.hydrate();
      return profile;
    } catch (err: any) {
      if (err instanceof AuthError) throw err;
      throw mapSupabaseError(err);
    }
  }

  async signOut(): Promise<void> {
    try {
      await this.supabase.auth.signOut();
    } catch (err) {
      console.warn('[AuthService] Error during signOut:', err);
    } finally {
      this._user.set(null);
      this.progressHandler?.reset();
      await this.router.navigate(['/login'], { replaceUrl: true });
    }
  }

  async requestPasswordReset(email: string): Promise<void> {
    try {
      const origin = this.isBrowser ? window.location.origin : 'http://localhost:4200';
      const { error } = await this.supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${origin}/login`
      });
      if (error) {
        throw mapSupabaseError(error);
      }
    } catch (err: any) {
      if (err instanceof AuthError) throw err;
      throw mapSupabaseError(err);
    }
  }

  async updatePassword(newPassword: string): Promise<void> {
    try {
      const { error } = await this.supabase.auth.updateUser({
        password: newPassword
      });
      if (error) {
        throw mapSupabaseError(error);
      }
    } catch (err: any) {
      if (err instanceof AuthError) throw err;
      throw mapSupabaseError(err);
    }
  }

  async updateProfile(
    patch: Partial<Pick<UserProfile, 'fullName' | 'grade' | 'school' | 'avatarUrl'>>
  ): Promise<UserProfile> {
    const current = this._user();
    if (!current) {
      throw new AuthError('unknown', 'No hay sesión de usuario activa.');
    }

    const dbPatch: Record<string, any> = {};
    if (patch.fullName !== undefined) dbPatch['full_name'] = patch.fullName;
    if (patch.grade !== undefined) dbPatch['grade'] = patch.grade;
    if (patch.school !== undefined) dbPatch['school'] = patch.school;
    if (patch.avatarUrl !== undefined) dbPatch['avatar_url'] = patch.avatarUrl;

    try {
      const { error } = await this.supabase
        .from('profiles')
        .update(dbPatch)
        .eq('id', current.id);

      if (error) {
        throw mapSupabaseError(error);
      }

      const updated: UserProfile = {
        ...current,
        fullName: patch.fullName ?? current.fullName,
        grade: patch.grade !== undefined ? patch.grade : current.grade,
        school: patch.school !== undefined ? patch.school : current.school,
        avatarUrl: patch.avatarUrl !== undefined ? patch.avatarUrl : current.avatarUrl
      };

      this._user.set(updated);
      return updated;
    } catch (err: any) {
      if (err instanceof AuthError) throw err;
      throw mapSupabaseError(err);
    }
  }

  async signOutOthers(): Promise<void> {
    try {
      const { error } = await this.supabase.auth.signOut({ scope: 'others' });
      if (error) {
        throw mapSupabaseError(error);
      }
    } catch (err: any) {
      if (err instanceof AuthError) throw err;
      throw mapSupabaseError(err);
    }
  }

  homeFor(role: Role): string {
    return role === 'docente' ? '/teacher-dashboard' : '/dashboard';
  }
}

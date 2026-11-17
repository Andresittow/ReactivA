import { ChangeDetectorRef, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../core/auth/auth.service';
import { UserProfile } from '../core/models/user.model';
import { UserPreferences } from '../core/models/preferences.model';
import { DEFAULT_PREFERENCES, SettingsService } from '../core/services/settings.service';
export type { UserPreferences };
export type SettingsTab = 'account' | 'appearance' | 'notifications' | 'privacy' | 'learning' | 'accessibility';
export interface UserAccountData {
  avatarUrl: string; fullName: string; email: string; username: string; role: string; joinDate: string;
}
const EMPTY_AVATAR = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96"><rect width="96" height="96" fill="#e2e8f0"/><circle cx="48" cy="34" r="16" fill="#64748b"/><path d="M16 90a32 32 0 0164 0" fill="#64748b"/></svg>');

@Component({ selector: 'app-settings', standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './settings.html', styleUrl: './settings.scss' })
export class SettingsComponent implements OnInit {
  readonly auth = inject(AuthService);
  private readonly settings = inject(SettingsService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly fb = inject(FormBuilder);
  private readonly destroy = inject(DestroyRef);
  private toastTimer: ReturnType<typeof setTimeout> | undefined;
  activeTab: SettingsTab = 'account';
  readonly tabs: { id: SettingsTab; label: string; icon: string; description: string }[] = [
    { id: 'account', label: 'Mi Cuenta', icon: 'ph-user-circle', description: 'Información personal y perfil escolar' },
    { id: 'appearance', label: 'Apariencia', icon: 'ph-palette', description: 'Temas visuales, tipografía y estilo' },
    { id: 'notifications', label: 'Notificaciones', icon: 'ph-bell', description: 'Alertas, avisos de tareas e insignias' },
    { id: 'privacy', label: 'Privacidad y Seguridad', icon: 'ph-shield-check', description: 'Control de perfil, accesos y credenciales' },
    { id: 'learning', label: 'Preferencias de Aprendizaje', icon: 'ph-student', description: 'Nivel curricular, química favorita y metas' },
    { id: 'accessibility', label: 'Accesibilidad', icon: 'ph-person-arms-spread', description: 'Contraste, legibilidad y apoyos interactivos' }
  ];


  get visibleTabs() { return this.tabs.filter(tab => !this.isTeacher || !['learning', 'notifications'].includes(tab.id)); }
  get isTeacher(): boolean { return this.auth.role() === 'docente'; }
  preferences: UserPreferences = { ...DEFAULT_PREFERENCES };
  get userData(): UserAccountData {
    const profile = this.auth.user();
    return {
      avatarUrl: profile?.avatarUrl || EMPTY_AVATAR, fullName: profile?.fullName || '',
      email: profile?.email || '', username: '',
      role: profile?.role === 'docente' ? 'Docente' : 'Estudiante',
      joinDate: profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString('es-CO') : 'No disponible'
    };
  }
  loading = false;
  savingPreferences = false;
  savingAccount = false;
  savingPassword = false;
  closingSessions = false;
  signingOut = false;
  loadError: string | null = null;
  isEditingAccount = false;
  toastMessage: string | null = null;
  toastType: 'success' | 'info' | 'warning' = 'success';
  showConfirmReset = false;
  showPasswordModal = false;
  showAvatarModal = false;
  accountForm: FormGroup = this.fb.group({
    fullName: ['', [Validators.required, Validators.minLength(3), Validators.pattern(/^[\p{L}][\p{L}\p{M} ]{2,}$/u)]],
    email: [{ value: '', disabled: true }],
    username: [{ value: '', disabled: true }],
    role: [{ value: '', disabled: true }]
  });
  passwordForm: FormGroup = this.fb.group({
    newPassword: ['', [Validators.required, Validators.minLength(8), Validators.pattern(/^(?=.*[A-Za-z])(?=.*\d).+$/)]],
    confirmNewPassword: ['', Validators.required]
  });
  presetAvatars: string[] = [
    'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=256&q=80',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=256&q=80',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=256&q=80'
  ];


  ngOnInit(): void {
    this.initAccountForm();
    void this.loadPreferences();
    this.destroy.onDestroy(() => clearTimeout(this.toastTimer));
  }

  async loadPreferences(): Promise<void> {
    if (this.loading) return;
    const id = this.auth.user()?.id;
    this.loading = true;
    this.loadError = null;
    try { const value = await this.settings.load(); if (this.auth.user()?.id === id) this.preferences = value; }
    catch { this.loadError = 'No se pudieron cargar tus preferencias. Vuelve a intentarlo.'; }
    finally { this.loading = false; this.cdr.markForCheck(); }
  }

  async savePreferences(): Promise<void> {
    if (this.savingPreferences || this.loading || this.loadError) return;
    this.savingPreferences = true;
    const previous = { ...this.settings.preferences() };
    const candidate = { ...this.preferences };
    const id = this.auth.user()?.id;
    try {
      await this.settings.save(candidate);
      this.showToast('Preferencias guardadas correctamente');
    } catch {
      if (this.auth.user()?.id !== id) return;
      this.preferences = previous;
      this.settings.apply(previous);
      this.showToast('No se pudieron guardar las preferencias. Vuelve a intentarlo.', 'warning');
    } finally { this.savingPreferences = false; this.cdr.markForCheck(); }
  }

  async resetToDefaults(): Promise<void> {
    if (this.savingPreferences) return;
    this.preferences = { ...DEFAULT_PREFERENCES };
    await this.savePreferences();
    this.showConfirmReset = false;
  }

  initAccountForm(): void { this.accountForm.reset(this.userData); }
  startEditingAccount(): void { this.initAccountForm(); this.isEditingAccount = true; }
  cancelEditingAccount(): void { if (!this.savingAccount) { this.initAccountForm(); this.isEditingAccount = false; } }

  async saveAccountChanges(): Promise<void> {
    if (this.savingAccount) return;
    if (this.accountForm.invalid) { this.accountForm.markAllAsTouched(); return; }
    const fullName = this.accountForm.get('fullName')!.value.trim();
    if (fullName.length < 3) { this.showToast('Ingresa un nombre de al menos 3 letras.', 'warning'); return; }
    await this.updateProfile({ fullName });
  }

  private async updateProfile(patch: Partial<Pick<UserProfile, 'fullName' | 'avatarUrl'>>): Promise<void> {
    if (this.savingAccount) return;
    this.savingAccount = true;
    try {
      await this.auth.updateProfile(patch);
      this.isEditingAccount = false;
      this.showAvatarModal = false;
      this.initAccountForm();
      this.showToast('Información de cuenta actualizada');
    } catch { this.showToast('No se pudo actualizar el perfil. Inténtalo nuevamente.', 'warning'); }
    finally { this.savingAccount = false; this.cdr.markForCheck(); }
  }
  async selectPresetAvatar(url: string): Promise<void> {
    if (this.presetAvatars.includes(url)) await this.updateProfile({ avatarUrl: url });
  }
  onAvatarError(event: Event): void { (event.target as HTMLImageElement).src = EMPTY_AVATAR; }

  togglePreference(key: keyof UserPreferences): void {
    const supported = ['reduceMotion', 'highContrast', 'dyslexicFont', 'largeInteractiveTargets', 'showProgressPublicly'];
    if (!supported.includes(key) || this.savingPreferences || this.loading || this.loadError) return;
    Object.assign(this.preferences, { [key]: !this.preferences[key] });
    void this.savePreferences();
  }
  setTheme(theme: UserPreferences['theme']): void {
    if (this.savingPreferences || this.loading || this.loadError) return;
    this.preferences.theme = theme; void this.savePreferences();
  }
  setFontSize(size: UserPreferences['fontSize']): void {
    if (this.savingPreferences || this.loading || this.loadError) return;
    this.preferences.fontSize = size; void this.savePreferences();
  }

  openPasswordModal(): void { this.passwordForm.reset(); this.showPasswordModal = true; }
  closePasswordModal(): void { if (!this.savingPassword) { this.showPasswordModal = false; this.passwordForm.reset(); } }
  async submitPasswordChange(): Promise<void> {
    if (this.savingPassword) return;
    if (this.passwordForm.invalid) { this.passwordForm.markAllAsTouched(); return; }
    const { newPassword, confirmNewPassword } = this.passwordForm.value;
    if (newPassword !== confirmNewPassword) { this.showToast('Las contraseñas nuevas no coinciden', 'warning'); return; }
    this.savingPassword = true;
    try {
      await this.auth.updatePassword(newPassword);
      this.showPasswordModal = false;
      this.passwordForm.reset();
      this.showToast('Contraseña actualizada correctamente');
    } catch {
      this.showToast('No se pudo cambiar la contraseña. Si tu sesión es antigua, vuelve a iniciar sesión e inténtalo nuevamente.', 'warning');
    } finally { this.savingPassword = false; this.cdr.markForCheck(); }
  }
  async closeOtherSessions(): Promise<void> {
    if (this.closingSessions) return;
    this.closingSessions = true;
    try { await this.auth.signOutOthers(); this.showToast('Se han cerrado las sesiones en otros dispositivos'); }
    catch { this.showToast('No se pudieron cerrar las otras sesiones. Inténtalo nuevamente.', 'warning'); }
    finally { this.closingSessions = false; this.cdr.markForCheck(); }
  }
  async signOut(): Promise<void> {
    if (this.signingOut) return;
    this.signingOut = true;
    try { await this.auth.signOut(); }
    catch { this.showToast('No se pudo cerrar sesión. Inténtalo nuevamente.', 'warning'); }
    finally { this.signingOut = false; this.cdr.markForCheck(); }
  }
  showToast(message: string, type: 'success' | 'info' | 'warning' = 'success'): void {
    clearTimeout(this.toastTimer);
    this.toastMessage = message; this.toastType = type; this.cdr.markForCheck();
    this.toastTimer = setTimeout(() => { this.toastMessage = null; this.cdr.markForCheck(); }, 5000);
  }
}

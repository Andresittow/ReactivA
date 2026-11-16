import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { SettingsComponent } from './settings';
import { AuthService } from '../core/auth/auth.service';
import { SettingsService, DEFAULT_PREFERENCES } from '../core/services/settings.service';
import { UserProfile } from '../core/models/user.model';

describe('SettingsComponent PR-L2', () => {
  const user = signal<UserProfile | null>(null);
  const auth = { user, role: () => user()?.role ?? null, updateProfile: vi.fn(),
    updatePassword: vi.fn(), signOutOthers: vi.fn(), signOut: vi.fn() };
  const settings = { load: vi.fn(), save: vi.fn(), apply: vi.fn(), preferences: signal({ ...DEFAULT_PREFERENCES }) };
  beforeEach(() => {
    vi.clearAllMocks();
    user.set({ id: 'a', role: 'estudiante', fullName: 'Ana Prueba', email: 'ana@example.test' });
    settings.preferences.set({ ...DEFAULT_PREFERENCES });
    settings.load.mockResolvedValue({ ...DEFAULT_PREFERENCES });
    settings.save.mockResolvedValue(undefined);
    auth.updateProfile.mockImplementation(async patch => { user.update(value => ({ ...value!, ...patch })); return user(); });
    auth.updatePassword.mockResolvedValue(undefined); auth.signOutOthers.mockResolvedValue(undefined); auth.signOut.mockResolvedValue(undefined);
    TestBed.configureTestingModule({ imports: [SettingsComponent], providers: [
      { provide: AuthService, useValue: auth }, { provide: SettingsService, useValue: settings }
    ] });
  });
  async function view() {
    const fixture = TestBed.createComponent(SettingsComponent); fixture.detectChanges();
    await fixture.whenStable(); fixture.detectChanges(); return fixture;
  }
  it('muestra perfil real y deja correo y rol en solo lectura', async () => {
    const fixture = await view(); const component = fixture.componentInstance;
    expect(fixture.nativeElement.textContent).toContain('Ana Prueba');
    expect(component.accountForm.get('email')!.disabled).toBe(true);
    expect(component.accountForm.get('role')!.disabled).toBe(true);
    expect(component.accountForm.get('username')!.disabled).toBe(true);
    component.startEditingAccount(); component.accountForm.patchValue({ fullName: 'Ana Actualizada', email: 'otra@example.test', role: 'docente' });
    await component.saveAccountChanges();
    expect(auth.updateProfile).toHaveBeenCalledExactlyOnceWith({ fullName: 'Ana Actualizada' });
    expect(user()!.email).toBe('ana@example.test'); expect(user()!.role).toBe('estudiante');
  });
  it('persiste avatar y muestra errores de perfil sin falso éxito', async () => {
    const fixture = await view(); const component = fixture.componentInstance;
    await component.selectPresetAvatar(component.presetAvatars[0]);
    expect(auth.updateProfile).toHaveBeenCalledWith({ avatarUrl: component.presetAvatars[0] });
    auth.updateProfile.mockRejectedValue(new Error('red'));
    component.startEditingAccount(); await component.saveAccountChanges();
    expect(component.toastType).toBe('warning'); expect(component.isEditingAccount).toBe(true);
  });
  it('muestra carga y permite reintentar un error de preferencias', async () => {
    settings.load.mockRejectedValueOnce(new Error('red'));
    const fixture = await view();
    expect(fixture.nativeElement.textContent).toContain('Reintentar');
    fixture.componentInstance.setTheme('dark'); expect(settings.save).not.toHaveBeenCalled();
    await fixture.componentInstance.loadPreferences(); fixture.detectChanges();
    expect(fixture.componentInstance.loadError).toBeNull();
  });
  it('aplica preferencias solo con éxito y revierte formulario al fallar', async () => {
    const component = (await view()).componentInstance;
    settings.save.mockRejectedValueOnce(new Error('RLS'));
    component.setTheme('dark'); await Promise.resolve(); await Promise.resolve();
    expect(component.preferences.theme).toBe('light'); expect(component.toastType).toBe('warning');
    component.togglePreference('twoFactorAuth'); expect(settings.save).toHaveBeenCalledTimes(1);
    component.togglePreference('showProgressPublicly'); await Promise.resolve();
    expect(settings.save).toHaveBeenCalledWith(expect.objectContaining({ showProgressPublicly: false }));
  });
  it('valida fortaleza y coincidencia antes de cambiar contraseña real', async () => {
    const component = (await view()).componentInstance;
    for (const password of ['abc1234', 'abcdefgh', '12345678']) {
      component.passwordForm.patchValue({ newPassword: password, confirmNewPassword: password });
      await component.submitPasswordChange();
    }
    expect(auth.updatePassword).not.toHaveBeenCalled();
    component.passwordForm.patchValue({ newPassword: 'nueva123', confirmNewPassword: 'diferente' });
    await component.submitPasswordChange(); expect(auth.updatePassword).not.toHaveBeenCalled();
    component.passwordForm.patchValue({ confirmNewPassword: 'nueva123' });
    await component.submitPasswordChange();
    expect(auth.updatePassword).toHaveBeenCalledExactlyOnceWith('nueva123');
    expect(component.passwordForm.get('newPassword')!.value).toBeNull();
  });
  it('sesión antigua muestra error, conserva modal y permite reintento', async () => {
    const component = (await view()).componentInstance;
    component.openPasswordModal(); component.passwordForm.patchValue({ newPassword: 'nueva123', confirmNewPassword: 'nueva123' });
    auth.updatePassword.mockRejectedValueOnce(new Error('reauthentication_needed'));
    await component.submitPasswordChange();
    expect(component.showPasswordModal).toBe(true); expect(component.toastMessage).toContain('vuelve a iniciar sesión');
    await component.submitPasswordChange(); expect(component.showPasswordModal).toBe(false);
  });
  it('cierra otras sesiones solo tras éxito y evita doble envío', async () => {
    const component = (await view()).componentInstance;
    let resolve!: () => void;
    auth.signOutOthers.mockReturnValueOnce(new Promise<void>(r => { resolve = r; }));
    const first = component.closeOtherSessions(); await component.closeOtherSessions();
    expect(auth.signOutOthers).toHaveBeenCalledTimes(1); expect(component.closingSessions).toBe(true);
    resolve(); await first; expect(component.toastType).toBe('success');
    auth.signOutOthers.mockRejectedValueOnce(new Error('red')); await component.closeOtherSessions();
    expect(component.toastType).toBe('warning');
  });
  it('docente no ve aprendizaje ni ranking y puede cerrar sesión', async () => {
    user.update(value => ({ ...value!, role: 'docente' }));
    const fixture = await view(); const component = fixture.componentInstance;
    expect(component.visibleTabs.some(tab => tab.id === 'learning')).toBe(false);
    component.activeTab = 'privacy'; fixture.changeDetectorRef.markForCheck(); fixture.detectChanges();
    expect(fixture.nativeElement.textContent).not.toContain('Visibilidad del Perfil y Progreso');
    expect(fixture.nativeElement.textContent).toContain('Próximamente');
    await component.signOut(); expect(auth.signOut).toHaveBeenCalledTimes(1);
  });
  it('opciones sin backend aparecen deshabilitadas', async () => {
    const fixture = await view(); fixture.componentInstance.activeTab = 'privacy'; fixture.changeDetectorRef.markForCheck(); fixture.detectChanges();
    const buttons = [...fixture.nativeElement.querySelectorAll('button')] as HTMLButtonElement[];
    expect(buttons.find(button => button.textContent?.includes('Eliminar Cuenta'))!.disabled).toBe(true);
  });
});

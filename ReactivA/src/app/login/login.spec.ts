import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { PLATFORM_ID } from '@angular/core';
import { LoginComponent } from './login';
import { AuthService } from '../core/auth/auth.service';
import { AuthError } from '../core/auth/auth-error';
import { ClassroomService } from '../core/services/classroom.service';

describe('LoginComponent: acceso real', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let navigate: ReturnType<typeof vi.spyOn>;
  let returnUrl: string;
  const auth = {
    signIn: vi.fn(), signUp: vi.fn(), requestPasswordReset: vi.fn(),
    homeFor: (role: string) => role === 'docente' ? '/teacher-dashboard' : '/dashboard'
  };
  const classroom = { joinByPin: vi.fn() };
  beforeEach(() => {
    vi.resetAllMocks();
    sessionStorage.clear();
    returnUrl = '';
    auth.signIn.mockResolvedValue({ role: 'estudiante' });
    auth.signUp.mockResolvedValue({ needsEmailConfirmation: false });
    classroom.joinByPin.mockResolvedValue({});
    TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [provideRouter([]), { provide: PLATFORM_ID, useValue: 'browser' },
        { provide: AuthService, useValue: auth }, { provide: ClassroomService, useValue: classroom },
        { provide: ActivatedRoute, useValue: { snapshot: { get queryParamMap() { return convertToParamMap({ returnUrl }); } } } }]
    });
    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    component.loginForm.patchValue({ email: 'persona@example.com', password: 'password123',
      fullName: 'Persona Prueba', confirmPassword: 'password123', school: 'Colegio Prueba', grade: '10', acceptTerms: true });
  });

  for (const role of ['estudiante', 'docente'] as const) {
    for (const password of ['abc12345', 'abc123']) {
      it(`habilita el botón y consulta a Supabase como ${role} con contraseña de ${password.length} caracteres`, async () => {
        component.loginForm.reset({ email: '', password: '', role: 'estudiante', rememberMe: false });
        fixture.detectChanges();
        const root = fixture.nativeElement as HTMLElement;
        const button = root.querySelector<HTMLButtonElement>('button[type="submit"]')!;
        expect(button.disabled).toBe(true);
        const roleButtons = root.querySelectorAll<HTMLButtonElement>('.role-selector button');
        roleButtons[role === 'docente' ? 1 : 0].click();
        for (const [id, value] of [['email', 'persona@example.com'], ['password', password]]) {
          const input = root.querySelector<HTMLInputElement>(`#${id}`)!;
          input.value = value;
          input.dispatchEvent(new Event('input', { bubbles: true }));
        }
        await fixture.whenStable();
        expect(component.loginForm.valid).toBe(true);
        expect(button.disabled).toBe(false);
        auth.signIn.mockResolvedValue({ role });
        button.click();
        await fixture.whenStable();
        expect(auth.signIn).toHaveBeenCalledExactlyOnceWith({ email: 'persona@example.com', password, rememberMe: false, expectedRole: role });
      });
    }
  }

  for (const error of [new AuthError('network', 'Failed to fetch'), new AuthError('invalid_credentials', 'Invalid login credentials')]) {
    it(`muestra ${error.code} en pantalla, libera carga y permite reintentar`, async () => {
      let reject!: (error: AuthError) => void;
      auth.signIn.mockReturnValueOnce(new Promise((_resolve, fail) => { reject = fail; }));
      fixture.detectChanges();
      const root = fixture.nativeElement as HTMLElement;
      const button = root.querySelector<HTMLButtonElement>('button[type="submit"]')!;
      const submit = vi.spyOn(component, 'onSubmit');
      button.click();
      // Do not await stability while the simulated HTTP request is pending.
      fixture.detectChanges();
      expect(component.isLoading).toBe(true);
      expect(button.disabled).toBe(true);
      reject(error);
      await submit.mock.results[0].value;
      await fixture.whenStable();
      const expected = error.code === 'network' ? 'Error de conexión. Verifica tu conexión a internet.' : 'Correo o contraseña incorrectos.';
      expect(root.querySelector('[role="alert"]')?.textContent).toContain(expected);
      expect(component.errorMessage).toBeTruthy();
      expect(component.isLoading).toBe(false);
      expect(button.disabled).toBe(false);
      expect(navigate).not.toHaveBeenCalled();
    });
  }

  it('bloquea formularios inválidos', async () => {
    component.loginForm.get('email')!.setValue('incorrecto');
    await component.onSubmit();
    expect(auth.signIn).not.toHaveBeenCalled();
    expect(component.loginForm.touched).toBe(true);
  });

  for (const role of ['estudiante', 'docente'] as const) {
    it(`navega ${role} reemplazando historial`, async () => {
      component.setRole(role);
      auth.signIn.mockResolvedValue({ role });
      await component.onSubmit();
      expect(navigate).toHaveBeenCalledWith(auth.homeFor(role), { replaceUrl: true });
    });
  }

  it('evita doble envío y restaura carga', async () => {
    let resolve!: (value: any) => void;
    auth.signIn.mockReturnValue(new Promise(r => resolve = r));
    const first = component.onSubmit();
    expect(component.isLoading).toBe(true);
    await component.onSubmit();
    expect(auth.signIn).toHaveBeenCalledTimes(1);
    resolve({ role: "estudiante" });
    await first;
    expect(component.isLoading).toBe(false);
  });

  for (const code of ['invalid_credentials', 'email_not_confirmed', 'role_mismatch', 'network', 'unknown', 'email_taken'] as const) {
    it(`muestra error seguro por código ${code}`, async () => {
      auth.signIn.mockRejectedValue(new AuthError(code, 'mensaje privado del servidor'));
      await component.onSubmit();
      expect(component.errorMessage).toBeTruthy();
      expect(component.errorMessage).not.toContain('privado');
      expect(navigate).not.toHaveBeenCalled();
      expect(component.isLoading).toBe(false);
    });
  }

  it('canjea PIN pendiente y lo elimina', async () => {
    sessionStorage.setItem('pendingClassPin', 'CHEM-1234');
    await component.onSubmit();
    expect(classroom.joinByPin).toHaveBeenCalledWith('CHEM-1234');
    expect(sessionStorage.getItem('pendingClassPin')).toBeNull();
    expect(navigate).toHaveBeenCalled();
  });

  it('avisa si falla el PIN y permite continuar autenticado', async () => {
    sessionStorage.setItem('pendingClassPin', 'CHEM-1234');
    classroom.joinByPin.mockRejectedValue(new Error('invalid_pin'));
    await component.onSubmit();
    expect(component.infoMessage).toContain('PIN');
    expect(component.errorMessage).toBeNull();
    expect(navigate).not.toHaveBeenCalled();
    await component.continueToHome();
    expect(navigate).toHaveBeenCalledWith('/dashboard', { replaceUrl: true });
  });

  for (const url of ['https://evil.test', '//evil.test', '/\\evil.test', '/%2f%2fevil.test', '/teacher-dashboard', '/login', '/unknown']) {
    it(`descarta retorno inseguro o no autorizado ${url}`, async () => {
      returnUrl = url;
      await component.onSubmit();
      expect(navigate).toHaveBeenCalledWith('/dashboard', { replaceUrl: true });
    });
  }
  it('acepta retorno permitido con query y fragmento', async () => {
    returnUrl = '/settings?tab=cuenta#perfil';
    component.loginForm.patchValue({ rememberMe: true });
    await component.onSubmit();
    expect(navigate).toHaveBeenCalledWith(returnUrl, { replaceUrl: true });
    expect(auth.signIn).toHaveBeenCalledWith(expect.objectContaining({ rememberMe: true, expectedRole: 'estudiante' }));
  });
  it('normaliza y valida PIN', () => {
    component.pinValue = 'mal';
    component.savePendingPin();
    expect(component.pinError).toBeTruthy();
    component.pinValue = ' chem-1234 ';
    component.savePendingPin();
    expect(sessionStorage.getItem('pendingClassPin')).toBe('CHEM-1234');
  });
  it('docente no consume PIN del estudiante', async () => {
    sessionStorage.setItem('pendingClassPin', 'CHEM-1234');
    auth.signIn.mockResolvedValue({ role: 'docente' });
    await component.onSubmit();
    expect(classroom.joinByPin).not.toHaveBeenCalled();
    expect(sessionStorage.getItem('pendingClassPin')).toBe('CHEM-1234');
  });
  it('recuperación valida correo y mantiene mensaje neutro incluso con error', async () => {
    component.resetEmail = 'a@';
    await component.submitPasswordReset();
    expect(auth.requestPasswordReset).not.toHaveBeenCalled();
    component.resetEmail = 'persona@example.com';
    await component.submitPasswordReset();
    const message = component.resetMessage;
    auth.requestPasswordReset.mockRejectedValue(new Error('privado'));
    await component.submitPasswordReset();
    expect(component.resetMessage).toBe(message);
    expect(component.isResetLoading).toBe(false);
  });
});

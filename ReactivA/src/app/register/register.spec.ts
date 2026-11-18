import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { PLATFORM_ID } from '@angular/core';
import { RegisterComponent } from './register';
import { AuthService } from '../core/auth/auth.service';
import { AuthError } from '../core/auth/auth-error';
import { ClassroomService } from '../core/services/classroom.service';

describe('RegisterComponent: acceso real', () => {
  let component: RegisterComponent;
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
      imports: [RegisterComponent],
      providers: [provideRouter([]), { provide: PLATFORM_ID, useValue: 'browser' },
        { provide: AuthService, useValue: auth }, { provide: ClassroomService, useValue: classroom },
        { provide: ActivatedRoute, useValue: { snapshot: { get queryParamMap() { return convertToParamMap({ returnUrl }); } } } }]
    });
    component = TestBed.createComponent(RegisterComponent).componentInstance;
    navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    component.registerForm.patchValue({ email: 'persona@example.com', password: 'password123',
      fullName: 'Persona Prueba', confirmPassword: 'password123', school: 'Colegio Prueba', grade: '10', acceptTerms: true });
  });

  it('bloquea formularios inválidos', async () => {
    component.registerForm.get('email')!.setValue('incorrecto');
    await component.onSubmit();
    expect(auth.signUp).not.toHaveBeenCalled();
    expect(component.registerForm.touched).toBe(true);
  });

  for (const role of ['estudiante', 'docente'] as const) {
    it(`navega ${role} reemplazando historial`, async () => {
      component.setRole(role);
      component.registerForm.patchValue({ teacherInviteCode: "DOCENTE-2026" });
      await component.onSubmit();
      expect(navigate).toHaveBeenCalledWith(auth.homeFor(role), { replaceUrl: true });
    });
  }

  it('evita doble envío y restaura carga', async () => {
    let resolve!: (value: any) => void;
    auth.signUp.mockReturnValue(new Promise(r => resolve = r));
    const first = component.onSubmit();
    expect(component.isLoading).toBe(true);
    await component.onSubmit();
    expect(auth.signUp).toHaveBeenCalledTimes(1);
    resolve({ needsEmailConfirmation: false });
    await first;
    expect(component.isLoading).toBe(false);
  });

  for (const code of ['email_taken', 'weak_password', 'invalid_teacher_code', 'network'] as const) {
    it(`muestra error seguro por código ${code}`, async () => {
      auth.signUp.mockRejectedValue(new AuthError(code, 'mensaje privado del servidor'));
      await component.onSubmit();
      expect(component.errorMessage).toBeTruthy();
      expect(component.errorMessage).not.toContain('privado');
      expect(navigate).not.toHaveBeenCalled();
      expect(component.isLoading).toBe(false);
    });
  }

  it('canjea PIN pendiente y lo elimina', async () => {
    component.registerForm.patchValue({ classPin: "CHEM-1234" });
    await component.onSubmit();
    expect(classroom.joinByPin).toHaveBeenCalledWith('CHEM-1234');
    expect(sessionStorage.getItem('pendingClassPin')).toBeNull();
    expect(navigate).toHaveBeenCalled();
  });

  it('avisa si falla el PIN y permite continuar autenticado', async () => {
    component.registerForm.patchValue({ classPin: "CHEM-1234" });
    classroom.joinByPin.mockRejectedValue(new Error('invalid_pin'));
    await component.onSubmit();
    expect(component.infoMessage).toContain('PIN');
    expect(component.errorMessage).toBeNull();
    expect(navigate).not.toHaveBeenCalled();
    await component.continueToHome();
    expect(navigate).toHaveBeenCalledWith('/dashboard', { replaceUrl: true });
  });

  it('sin sesión muestra confirmación y conserva PIN para el siguiente login', async () => {
    auth.signUp.mockResolvedValue({ needsEmailConfirmation: true });
    component.registerForm.patchValue({ classPin: 'CHEM-1234' });
    await component.onSubmit();
    expect(component.needsEmailConfirmation).toBe(true);
    expect(sessionStorage.getItem('pendingClassPin')).toBe('CHEM-1234');
    expect(navigate).not.toHaveBeenCalled();
    expect(classroom.joinByPin).not.toHaveBeenCalled();
  });

  for (const password of ['abc1234', 'abcdefgh', '12345678']) {
    it(`rechaza contraseña débil ${password}`, () => {
      component.registerForm.patchValue({ password, confirmPassword: password });
      expect(component.registerForm.get('password')!.invalid).toBe(true);
    });
  }

  it('valida términos, confirmación, nombre, colegio y grado', () => {
    for (const [key, value] of Object.entries({ fullName: '12', school: 'a', grade: '', acceptTerms: false, confirmPassword: 'otra' })) {
      component.registerForm.get(key)!.setValue(value);
    }
    expect(component.registerForm.invalid).toBe(true);
    expect(component.hasPasswordMismatch()).toBe(false);
    component.registerForm.get('confirmPassword')!.markAsTouched();
    expect(component.hasPasswordMismatch()).toBe(true);
  });

  it('exige invitación solo al docente y grado solo al estudiante', () => {
    component.setRole('docente');
    expect(component.registerForm.get('teacherInviteCode')!.invalid).toBe(true);
    expect(component.registerForm.get('grade')!.valid).toBe(true);
    component.setRole('estudiante');
    expect(component.registerForm.get('teacherInviteCode')!.valid).toBe(true);
    expect(component.registerForm.get('grade')!.invalid).toBe(true);
  });
});

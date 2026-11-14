import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RegisterComponent } from './register';

describe('RegisterComponent: navegación por rol', () => {
  beforeEach(() => TestBed.configureTestingModule({
    imports: [RegisterComponent],
    providers: [provideRouter([])]
  }));

  for (const [role, destination] of [
    ['estudiante', '/dashboard'],
    ['docente', '/teacher-dashboard']
  ] as const) {
    it(`dirige ${role} a ${destination} sin registrar credenciales`, () => {
      const component = TestBed.createComponent(RegisterComponent).componentInstance;
      const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
      const log = vi.spyOn(console, 'log').mockImplementation(() => {});
      try {
        component.registerForm.patchValue({ fullName: 'Persona de prueba', email: 'persona@example.com', password: 'password123', confirmPassword: 'password123', grade: '10', acceptTerms: true, role });
        component.onSubmit();
        expect(navigate).toHaveBeenCalledWith([destination]);
        expect(log).not.toHaveBeenCalled();
      } finally {
        log.mockRestore();
      }
    });
  }

  it('mantiene un formulario inválido en la pantalla actual', () => {
    const component = TestBed.createComponent(RegisterComponent).componentInstance;
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    component.onSubmit();
    expect(navigate).not.toHaveBeenCalled();
    expect(component.registerForm.touched).toBe(true);
  });
});

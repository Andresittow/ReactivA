import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { LoginComponent } from './login';

describe('LoginComponent: navegación por rol', () => {
  beforeEach(() => TestBed.configureTestingModule({
    imports: [LoginComponent],
    providers: [provideRouter([])]
  }));

  for (const [role, destination] of [
    ['estudiante', '/dashboard'],
    ['docente', '/teacher-dashboard']
  ] as const) {
    it(`dirige ${role} a ${destination} sin registrar credenciales`, () => {
      const component = TestBed.createComponent(LoginComponent).componentInstance;
      const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
      const log = vi.spyOn(console, 'log').mockImplementation(() => {});
      try {
        component.loginForm.patchValue({ email: 'persona@example.com', password: 'password123', role });
        component.onSubmit();
        expect(navigate).toHaveBeenCalledWith([destination]);
        expect(log).not.toHaveBeenCalled();
      } finally {
        log.mockRestore();
      }
    });
  }

  it('mantiene un formulario inválido en la pantalla actual', () => {
    const component = TestBed.createComponent(LoginComponent).componentInstance;
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    component.onSubmit();
    expect(navigate).not.toHaveBeenCalled();
    expect(component.loginForm.touched).toBe(true);
  });
});

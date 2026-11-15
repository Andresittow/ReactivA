import { TestBed } from '@angular/core/testing';
import { Router, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree } from '@angular/router';
import { PLATFORM_ID, signal } from '@angular/core';
import { authGuard, guestGuard, roleGuard } from './auth.guard';
import { AuthService } from './auth.service';
import { Role, UserProfile } from '../models/user.model';

describe('Auth Guards', () => {
  let mockAuthService: {
    user: ReturnType<typeof signal<UserProfile | null>>;
    isAuthenticated: () => boolean;
    role: () => Role | null;
  };
  let mockRouter: any;
  let dummyRoute: ActivatedRouteSnapshot;
  let dummyState: RouterStateSnapshot;

  beforeEach(() => {
    const userSignal = signal<UserProfile | null>(null);

    mockAuthService = {
      user: userSignal,
      isAuthenticated: () => userSignal() !== null,
      role: () => userSignal()?.role ?? null
    };

    mockRouter = {
      createUrlTree: vi.fn((commands, navExtras) => ({ commands, navExtras } as unknown as UrlTree))
    };

    dummyRoute = {} as ActivatedRouteSnapshot;
    dummyState = { url: '/dashboard' } as RouterStateSnapshot;

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: Router, useValue: mockRouter },
        { provide: PLATFORM_ID, useValue: 'browser' }
      ]
    });
  });

  describe('authGuard', () => {
    it('permite el acceso si el usuario está autenticado', () => {
      mockAuthService.user.set({ id: '1', role: 'estudiante', fullName: 'User', email: 'u@test.com' });

      const result = TestBed.runInInjectionContext(() => authGuard(dummyRoute, dummyState));
      expect(result).toBe(true);
    });

    it('redirige a /login con returnUrl válida si no está autenticado', () => {
      dummyState = { url: '/settings' } as RouterStateSnapshot;

      TestBed.runInInjectionContext(() => authGuard(dummyRoute, dummyState));

      expect(mockRouter.createUrlTree).toHaveBeenCalledWith(['/login'], {
        queryParams: { returnUrl: '/settings' }
      });
    });

    it('descarta returnUrl maliciosas o externas no seguras', () => {
      dummyState = { url: 'https://malicious.com' } as RouterStateSnapshot;

      TestBed.runInInjectionContext(() => authGuard(dummyRoute, dummyState));

      expect(mockRouter.createUrlTree).toHaveBeenCalledWith(['/login'], {
        queryParams: undefined
      });
    });
  });

  describe('guestGuard', () => {
    it('permite acceso si NO hay sesión activa', () => {
      mockAuthService.user.set(null);

      const result = TestBed.runInInjectionContext(() => guestGuard(dummyRoute, dummyState));
      expect(result).toBe(true);
    });

    it('redirige a /dashboard si hay sesión activa de estudiante', () => {
      mockAuthService.user.set({ id: '1', role: 'estudiante', fullName: 'User', email: 'u@test.com' });

      TestBed.runInInjectionContext(() => guestGuard(dummyRoute, dummyState));

      expect(mockRouter.createUrlTree).toHaveBeenCalledWith(['/dashboard']);
    });

    it('redirige a /teacher-dashboard si hay sesión activa de docente', () => {
      mockAuthService.user.set({ id: '2', role: 'docente', fullName: 'Profesor', email: 'p@test.com' });

      TestBed.runInInjectionContext(() => guestGuard(dummyRoute, dummyState));

      expect(mockRouter.createUrlTree).toHaveBeenCalledWith(['/teacher-dashboard']);
    });
  });

  describe('roleGuard', () => {
    it('permite el acceso si el rol coincide exactamente', () => {
      mockAuthService.user.set({ id: '1', role: 'estudiante', fullName: 'User', email: 'u@test.com' });
      const guard = roleGuard('estudiante');

      const result = TestBed.runInInjectionContext(() => guard(dummyRoute, dummyState));
      expect(result).toBe(true);
    });

    it('redirige a login si no está autenticado', () => {
      mockAuthService.user.set(null);
      const guard = roleGuard('docente');

      TestBed.runInInjectionContext(() => guard(dummyRoute, dummyState));

      expect(mockRouter.createUrlTree).toHaveBeenCalledWith(['/login'], {
        queryParams: { returnUrl: '/dashboard' }
      });
    });

    it('redirige al home del rol respectivo si el rol no coincide', () => {
      // Estudiante intentando acceder a ruta de docente
      mockAuthService.user.set({ id: '1', role: 'estudiante', fullName: 'User', email: 'u@test.com' });
      const guard = roleGuard('docente');

      TestBed.runInInjectionContext(() => guard(dummyRoute, dummyState));

      expect(mockRouter.createUrlTree).toHaveBeenCalledWith(['/dashboard']);
    });

    it('redirige a /teacher-dashboard si un docente intenta acceder a ruta de estudiante', () => {
      mockAuthService.user.set({ id: '2', role: 'docente', fullName: 'Profesor', email: 'p@test.com' });
      const guard = roleGuard('estudiante');

      TestBed.runInInjectionContext(() => guard(dummyRoute, dummyState));

      expect(mockRouter.createUrlTree).toHaveBeenCalledWith(['/teacher-dashboard']);
    });
  });
});

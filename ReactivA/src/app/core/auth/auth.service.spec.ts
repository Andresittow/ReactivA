import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { PLATFORM_ID } from '@angular/core';
import { AuthService, PROGRESS_SYNC_HANDLER, ProgressSyncHandler } from './auth.service';
import { SUPABASE_CLIENT } from '../supabase/supabase.client';
import { AuthError } from './auth-error';

describe('AuthService', () => {
  let service: AuthService;
  let mockSupabase: any;
  let mockRouter: any;
  let mockProgressHandler: ProgressSyncHandler;
  let authStateCallback: (event: string, session: any) => Promise<void>;

  beforeEach(() => {
    mockRouter = {
      url: '/dashboard',
      navigate: vi.fn().mockResolvedValue(true)
    };

    mockProgressHandler = {
      hydrate: vi.fn().mockResolvedValue(undefined),
      reset: vi.fn()
    };

    mockSupabase = {
      auth: {
        onAuthStateChange: vi.fn().mockImplementation((cb) => {
          authStateCallback = cb;
          return { data: { subscription: { unsubscribe: vi.fn() } } };
        }),
        getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
        signInWithPassword: vi.fn(),
        signUp: vi.fn(),
        signOut: vi.fn().mockResolvedValue({ error: null }),
        resetPasswordForEmail: vi.fn().mockResolvedValue({ error: null }),
        updateUser: vi.fn().mockResolvedValue({ data: {}, error: null })
      },
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: {
            id: 'user-123',
            role: 'estudiante',
            full_name: 'Estudiante Demo',
            grade: '10A',
            school: 'Colegio Demo'
          },
          error: null
        }),
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null })
        })
      })
    };

    TestBed.configureTestingModule({
      providers: [
        AuthService,
        { provide: SUPABASE_CLIENT, useValue: mockSupabase },
        { provide: Router, useValue: mockRouter },
        { provide: PLATFORM_ID, useValue: 'browser' },
        { provide: PROGRESS_SYNC_HANDLER, useValue: mockProgressHandler }
      ]
    });

    service = TestBed.inject(AuthService);
  });

  it('debe crearse correctamente con estado inicial no autenticado', () => {
    expect(service).toBeTruthy();
    expect(service.user()).toBeNull();
    expect(service.isAuthenticated()).toBe(false);
    expect(service.role()).toBeNull();
  });

  it('restaura sesión existente y actualiza los signals', async () => {
    mockSupabase.auth.getSession.mockResolvedValueOnce({
      data: {
        session: {
          user: { id: 'user-123', email: 'test@reactiva.edu' }
        }
      },
      error: null
    });

    await service.restoreSession();

    expect(service.ready()).toBe(true);
    expect(service.isAuthenticated()).toBe(true);
    expect(service.role()).toBe('estudiante');
    expect(service.user()?.fullName).toBe('Estudiante Demo');
  });

  it('inicia sesión con éxito y valida expectedRole coincidente', async () => {
    mockSupabase.auth.signInWithPassword.mockResolvedValueOnce({
      data: {
        user: { id: 'user-123', email: 'test@reactiva.edu' }
      },
      error: null
    });

    const profile = await service.signIn({
      email: 'test@reactiva.edu',
      password: 'password123',
      rememberMe: true,
      expectedRole: 'estudiante'
    });

    expect(profile.role).toBe('estudiante');
    expect(service.isAuthenticated()).toBe(true);
  });

  it('falla con role_mismatch si el expectedRole no coincide', async () => {
    mockSupabase.auth.signInWithPassword.mockResolvedValueOnce({
      data: {
        user: { id: 'user-123', email: 'test@reactiva.edu' }
      },
      error: null
    });

    await expect(
      service.signIn({
        email: 'test@reactiva.edu',
        password: 'password123',
        rememberMe: false,
        expectedRole: 'docente'
      })
    ).rejects.toThrowError(AuthError);

    expect(mockSupabase.auth.signOut).toHaveBeenCalled();
    expect(service.isAuthenticated()).toBe(false);
  });

  it('soporta registro requiriendo confirmación de correo', async () => {
    mockSupabase.auth.signUp.mockResolvedValueOnce({
      data: {
        user: { id: 'new-user' },
        session: null // Sin sesión directa = requiere confirmación
      },
      error: null
    });

    const res = await service.signUp({
      email: 'nuevo@reactiva.edu',
      password: 'password123',
      fullName: 'Nuevo Alumno',
      role: 'estudiante'
    });

    expect(res.needsEmailConfirmation).toBe(true);
    expect(mockSupabase.auth.signUp).toHaveBeenCalledWith(expect.objectContaining({
      options: expect.objectContaining({ emailRedirectTo: `${window.location.origin}/home` })
    }));
  });

  it('soporta registro sin confirmación de correo (sesión inmediata)', async () => {
    mockSupabase.auth.signUp.mockResolvedValueOnce({
      data: {
        user: { id: 'new-user', email: 'nuevo@reactiva.edu' },
        session: { access_token: 'fake' }
      },
      error: null
    });

    const res = await service.signUp({
      email: 'nuevo@reactiva.edu',
      password: 'password123',
      fullName: 'Nuevo Alumno',
      role: 'estudiante'
    });

    expect(res.needsEmailConfirmation).toBe(false);
  });

  it('cierra sesión, limpia el usuario, resetea el progreso y navega a /login con replaceUrl', async () => {
    await service.signOut();

    expect(mockSupabase.auth.signOut).toHaveBeenCalled();
    expect(mockProgressHandler.reset).toHaveBeenCalled();
    expect(service.user()).toBeNull();
    expect(service.isAuthenticated()).toBe(false);
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/login'], { replaceUrl: true });
  });

  it('llama a hydrate() tras iniciar sesión exitosamente', async () => {
    mockSupabase.auth.signInWithPassword.mockResolvedValueOnce({
      data: {
        user: { id: 'user-123', email: 'test@reactiva.edu' }
      },
      error: null
    });

    await service.signIn({
      email: 'test@reactiva.edu',
      password: 'password123',
      rememberMe: true,
      expectedRole: 'estudiante'
    });

    expect(mockProgressHandler.hydrate).toHaveBeenCalled();
  });

  it('llama a hydrate() al restaurar sesión activa', async () => {
    mockSupabase.auth.getSession.mockResolvedValueOnce({
      data: {
        session: { user: { id: 'user-123', email: 'test@reactiva.edu' } }
      },
      error: null
    });

    await service.restoreSession();

    expect(mockProgressHandler.hydrate).toHaveBeenCalled();
  });

  it('llama a reset() cuando onAuthStateChange emite SIGNED_OUT', async () => {
    expect(authStateCallback).toBeDefined();
    await authStateCallback('SIGNED_OUT', null);

    expect(mockProgressHandler.reset).toHaveBeenCalled();
    expect(service.user()).toBeNull();
  });

  it('devuelve la ruta de inicio adecuada para cada rol', () => {
    expect(service.homeFor('estudiante')).toBe('/dashboard');
    expect(service.homeFor('docente')).toBe('/teacher-dashboard');
  });
});

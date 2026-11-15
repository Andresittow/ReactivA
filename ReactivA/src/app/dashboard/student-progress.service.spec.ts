import { TestBed } from '@angular/core/testing';
import { signal, PLATFORM_ID } from '@angular/core';
import { StudentProgressService } from './student-progress.service';
import { AuthService } from '../core/auth/auth.service';
import { SUPABASE_CLIENT } from '../core/supabase/supabase.client';
import { LearningEventsService } from '../core/services/learning-events.service';
import { UserProfile } from '../core/models/user.model';

describe('StudentProgressService', () => {
  let service: StudentProgressService;
  let mockSupabase: any;
  let mockAuthService: any;
  let mockLearningEvents: any;
  let userSignal: ReturnType<typeof signal<UserProfile | null>>;

  beforeEach(() => {
    userSignal = signal<UserProfile | null>({
      id: 'student-123',
      role: 'estudiante',
      fullName: 'Andrés Alumno',
      email: 'andres@reactiva.edu',
      grade: '10th Grade'
    });

    mockAuthService = {
      user: userSignal,
      isAuthenticated: () => userSignal() !== null,
      role: () => userSignal()?.role ?? null,
      updateProfile: vi.fn().mockResolvedValue({}),
      registerProgressSyncHandler: vi.fn()
    };

    mockLearningEvents = {
      record: vi.fn()
    };

    mockSupabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: {
            student_id: 'student-123',
            xp: 200,
            level: 1,
            streak_days: 2,
            last_active_date: '2026-11-14'
          },
          error: null
        }),
        upsert: vi.fn().mockResolvedValue({ error: null }),
        insert: vi.fn().mockResolvedValue({ error: null }),
        update: vi.fn().mockReturnThis()
      })
    };

    TestBed.configureTestingModule({
      providers: [
        StudentProgressService,
        { provide: AuthService, useValue: mockAuthService },
        { provide: SUPABASE_CLIENT, useValue: mockSupabase },
        { provide: LearningEventsService, useValue: mockLearningEvents },
        { provide: PLATFORM_ID, useValue: 'browser' }
      ]
    });

    service = TestBed.inject(StudentProgressService);
  });

  it('debe inicializarse con perfil del usuario autenticado', () => {
    const profile = service.getProfile();
    expect(profile.name).toBe('Andrés Alumno');
    expect(profile.email).toBe('andres@reactiva.edu');
    expect(profile.grade).toBe('10th Grade');
  });

  it('permite guardar y recuperar progreso de módulos síncronamente', () => {
    service.saveModuleProgress('virtual-lab', { score: 100, completed: true });
    const progress = service.getModuleProgress<{ score: number; completed: boolean }>('virtual-lab');

    expect(progress).toBeTruthy();
    expect(progress?.score).toBe(100);
    expect(progress?.completed).toBe(true);
    expect(mockSupabase.from).toHaveBeenCalledWith('module_progress');
  });

  it('calcula y suma XP en memoria y en segundo plano', () => {
    const res = service.addXp(150);
    expect(res.state.xp).toBe(150);
    expect(mockSupabase.from).toHaveBeenCalledWith('student_progress');
  });

  it('alterna tareas del dashboard y registra eventos', () => {
    const res = service.toggleDashboardTask(1);
    expect(res.task?.completed).toBe(true);
    expect(res.xpGained).toBe(50);
    expect(mockLearningEvents.record).toHaveBeenCalled();
    expect(mockSupabase.from).toHaveBeenCalledWith('student_tasks');
  });

  it('limpia el estado al ejecutar reset()', () => {
    service.addXp(300);
    service.reset();

    const state = service.getGamificationState();
    expect(state.xp).toBe(0);
    expect(state.level).toBe(1);
    expect(state.streakDays).toBe(0);
  });
});

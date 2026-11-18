import { PLATFORM_ID, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { GameService } from './game.service';
import { AuthService } from '../../core/auth/auth.service';
import { LearningEventsService } from '../../core/services/learning-events.service';
import { StudentProgressService } from '../../dashboard/student-progress.service';
import { GameProgress } from '../models/game.models';
import { LEVELS, POINTS_BY_DIFFICULTY } from '../data/questions.data';

describe('GameService PR-L2', () => {
  const user = signal<{ id: string; role: 'estudiante' | 'docente' } | null>(null);
  const records = new Map<string, GameProgress>();
  let cache: GameProgress | null;
  const progress = {
    hydrate: vi.fn(), getModuleProgress: vi.fn(() => cache),
    saveModuleProgress: vi.fn((_module: string, data: GameProgress) => {
      records.set(user()!.id, structuredClone(data)); cache = structuredClone(data);
    }), addXp: vi.fn(), unlockBadge: vi.fn()
  };
  const events = { record: vi.fn() };
  const question = LEVELS[0].questions[0];
  const points = POINTS_BY_DIFFICULTY[question.difficulty];
  beforeEach(() => {
    const values = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => { values.set(key, value); },
      removeItem: (key: string) => { values.delete(key); },
      clear: () => values.clear(), key: (index: number) => [...values.keys()][index] ?? null,
      get length() { return values.size; }
    } satisfies Storage);
    vi.clearAllMocks(); records.clear(); cache = null;
    user.set({ id: 'a', role: 'estudiante' });
    progress.hydrate.mockImplementation(async () => { cache = records.get(user()!.id) ?? null; });
    TestBed.configureTestingModule({ providers: [
      { provide: PLATFORM_ID, useValue: 'browser' },
      { provide: AuthService, useValue: { user, role: () => user()?.role ?? null } },
      { provide: StudentProgressService, useValue: progress },
      { provide: LearningEventsService, useValue: events }
    ] });
  });
  afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });
  async function game() { const service = TestBed.inject(GameService); await service.initialize(); return service; }
  function answer(service: GameService, correct = true) {
    return service.recordAnswer(1, question.id, question.difficulty, correct);
  }
  function finish(service: GameService, levelId: number) {
    for (const q of LEVELS.find(level => level.id === levelId)!.questions) {
      service.recordAnswer(levelId, q.id, q.difficulty, true);
    }
    return service.completeLevel(levelId);
  }

  it('SSR no accede al storage ni persiste ni concede XP', async () => {
    TestBed.overrideProvider(PLATFORM_ID, { useValue: 'server' });
    const read = vi.spyOn(document.defaultView!.localStorage, 'getItem').mockImplementation(() => { throw new Error('SSR'); });
    const write = vi.spyOn(document.defaultView!.localStorage, 'setItem');
    const remove = vi.spyOn(document.defaultView!.localStorage, 'removeItem');
    const service = await game();
    service.resetProgress(); answer(service);
    expect(service.getTotalScore()).toBe(0);
    expect(read).not.toHaveBeenCalled(); expect(write).not.toHaveBeenCalled(); expect(remove).not.toHaveBeenCalled();
    expect(progress.saveModuleProgress).not.toHaveBeenCalled(); expect(progress.addXp).not.toHaveBeenCalled();
    vi.restoreAllMocks();
  });

  it('usa progreso remoto y nunca importa progreso local antiguo', async () => {
    document.defaultView!.localStorage.setItem('reactiva_mision_organica_progress', JSON.stringify({ totalScore: 999 }));
    const service = await game();
    expect(document.defaultView!.localStorage.getItem('reactiva_mision_organica_progress')).toBeNull();
    expect(service.getTotalScore()).toBe(0);
    answer(service);
    const saved = records.get('a')!;
    expect(saved.levels[0].answeredQuestionIds).toContain(question.id);
    expect(saved.totalScore).toBe(points);
    expect(progress.saveModuleProgress).toHaveBeenCalledWith('organic-mission', expect.any(Object));
  });

  it('restaura tras recrear servicio sin perder vidas ni respuestas', async () => {
    const service = await game(); answer(service, false);
    const restored = TestBed.runInInjectionContext(() => new GameService());
    await restored.initialize();
    expect(restored.getLevelProgress(1).lives).toBe(4);
    expect(restored.hasAnsweredQuestion(1, question.id)).toBe(true);
  });

  it('concede XP y registra evento real una sola vez por respuesta', async () => {
    const service = await game();
    expect(answer(service)).toBe(points); expect(answer(service)).toBe(0);
    expect(progress.addXp).toHaveBeenCalledExactlyOnceWith(points);
    expect(events.record).toHaveBeenCalledWith(expect.objectContaining({ module: 'organic-mission', xp: points }));
    expect(events.record).toHaveBeenCalledTimes(1);
  });

  it('incorrecta pierde una vida y registra evento sin XP', async () => {
    const service = await game(); answer(service, false);
    expect(service.getLevelProgress(1).lives).toBe(4);
    expect(progress.addXp).not.toHaveBeenCalled();
    expect(events.record).toHaveBeenCalledWith(expect.objectContaining({ xp: 0 }));
    expect(answer(service, false)).toBe(0);
    expect(service.getLevelProgress(1).lives).toBe(4);
  });

  it('no concede XP por preguntas inexistentes o niveles bloqueados', async () => {
    const service = await game();
    service.recordAnswer(1, 'inventada', 'reto-final', true);
    const locked = LEVELS[3].questions[0];
    service.recordAnswer(4, locked.id, locked.difficulty, true);
    expect(progress.addXp).not.toHaveBeenCalled();
    expect(service.completeLevel(1)).toEqual([]);
  });

  it('completar, reintentar, reiniciar y recargar no duplican recompensas', async () => {
    const service = await game();
    finish(service, 1);
    expect(service.isLevelCompleted(1)).toBe(true);
    const xpCalls = progress.addXp.mock.calls.length;
    expect(service.completeLevel(1)).toEqual([]);
    service.retryLevel(1); finish(service, 1);
    service.resetProgress(); finish(service, 1);
    expect(progress.addXp).toHaveBeenCalledTimes(xpCalls);
    expect(service.getBadges()[0].unlocked).toBe(true);
    const restored = TestBed.runInInjectionContext(() => new GameService());
    await restored.initialize(); restored.retryLevel(1); finish(restored, 1);
    expect(progress.addXp).toHaveBeenCalledTimes(xpCalls);
  });

  it('bonus final e insignia se conceden una vez', async () => {
    const service = await game();
    for (const level of LEVELS) finish(service, level.id);
    expect(service.getProgress().allLevelsCompleted).toBe(true);
    expect(progress.addXp).toHaveBeenCalledWith(100);
    expect(events.record).toHaveBeenCalledWith(expect.objectContaining({ title: 'Misión Orgánica completada', xp: 100 }));
    const xpCalls = progress.addXp.mock.calls.length;
    service.retryLevel(4); finish(service, 4);
    expect(progress.addXp).toHaveBeenCalledTimes(xpCalls);
  });

  it('cambia de estudiante y limpia al logout sin compartir datos', async () => {
    const service = await game(); answer(service);
    user.set({ id: 'b', role: 'estudiante' });
    expect(service.getTotalScore()).toBe(0);
    expect(service.ready()).toBe(false);
    await service.initialize();
    expect(service.getTotalScore()).toBe(0);
    answer(service, false);
    expect(records.get('a')!.totalScore).toBe(points);
    expect(records.get('b')!.levels[0].lives).toBe(4);
    user.set(null);
    expect(service.getTotalScore()).toBe(0);
    expect(answer(service)).toBe(0);
    user.set({ id: 'a', role: 'estudiante' }); await service.initialize();
    expect(service.getTotalScore()).toBe(points);
  });

  it('ignora cargas tardías de otra cuenta', async () => {
    let release!: () => void;
    progress.hydrate.mockImplementationOnce(() => new Promise<void>(resolve => { release = resolve; }));
    const service = TestBed.inject(GameService);
    const loading = service.initialize();
    user.set(null); release(); await loading;
    expect(service.getTotalScore()).toBe(0); expect(service.ready()).toBe(false);
  });

  it('muestra error recuperable cuando hydrate rechaza', async () => {
    progress.hydrate.mockRejectedValueOnce(new Error('red'));
    const service = await game();
    expect(service.error()).toBeTruthy(); expect(service.ready()).toBe(false);
    await service.initialize(); expect(service.ready()).toBe(true);
  });
});

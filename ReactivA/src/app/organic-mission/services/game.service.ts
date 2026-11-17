// ============================================================
// SERVICIO DE ESTADO DEL JUEGO – Misión Orgánica
// Gestiona puntaje, vidas y progreso por usuario mediante StudentProgressService
// ============================================================

import { Injectable, PLATFORM_ID, effect, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Badge, GameProgress, LevelProgress } from '../models/game.models';
import { LEVELS, POINTS_BY_DIFFICULTY } from '../data/questions.data';
import { StudentProgressService } from '../../dashboard/student-progress.service';
import { LearningEventsService } from '../../core/services/learning-events.service';
import { AuthService } from '../../core/auth/auth.service';

const STORAGE_KEY = 'reactiva_mision_organica_progress';

const DEFAULT_BADGES: Badge[] = [
  {
    id: 'explorador-carbono',
    name: 'Explorador del Carbono',
    description: 'Completaste el Nivel 1: Detectives del Carbono',
    icon: '🔍',
    color: '#10b981',
    unlocked: false
  },
  {
    id: 'experto-hidrocarburos',
    name: 'Experto en Hidrocarburos',
    description: 'Completaste el Nivel 2: Cazadores de Hidrocarburos',
    icon: '⚗️',
    color: '#3b82f6',
    unlocked: false
  },
  {
    id: 'maestro-iupac',
    name: 'Maestro IUPAC',
    description: 'Completaste el Nivel 3: El Desafío IUPAC',
    icon: '📖',
    color: '#8b5cf6',
    unlocked: false
  },
  {
    id: 'genio-organico',
    name: 'Genio Orgánico',
    description: 'Completaste el Nivel 4: Maestro del Carbono',
    icon: '🏆',
    color: '#f59e0b',
    unlocked: false
  },
  {
    id: 'mente-quimica',
    name: 'Mente Química',
    description: 'Completaste todos los niveles sin perder ninguna vida',
    icon: '🧠',
    color: '#ef4444',
    unlocked: false
  }
];

@Injectable({ providedIn: 'root' })
export class GameService {
  private studentProgressService = inject(StudentProgressService);
  private readonly events = inject(LearningEventsService);
  private readonly auth = inject(AuthService);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly ready = signal(false);
  private owner: string | null = null;
  private epoch = 0;
  private initialization: { id: string; promise: Promise<void> } | null = null;

  private readonly platformId = inject(PLATFORM_ID);

  // ── Estado en memoria ──────────────────────────────────
  private state: GameProgress = this.emptyProgress();
  private get progress(): GameProgress {
    this.checkOwner();
    return this.state;
  }

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      try { window.localStorage.removeItem(STORAGE_KEY); } catch { /* Legacy data is never imported. */ }
      effect(() => {
        const id = this.auth.user()?.id ?? null;
        if (id !== this.owner) {
          this.checkOwner();
          if (id) void this.initialize();
        }
      });
    }
  }

  private checkOwner(): void {
    const id = this.auth.user()?.id ?? null;
    if (id !== this.owner) {
      this.owner = id;
      this.epoch++;
      this.state = this.emptyProgress();
      this.ready.set(false);
      this.loading.set(false);
      this.error.set(null);
    }
  }

  async initialize(): Promise<void> {
    this.checkOwner();
    const id = this.owner;
    const epoch = this.epoch;
    if (!isPlatformBrowser(this.platformId) || !id || this.auth.role() !== 'estudiante') return;
    if (this.ready()) return;
    if (this.initialization?.id === id) return this.initialization.promise;
    this.loading.set(true);
    this.error.set(null);
    const promise = (async () => {
      try {
        await this.studentProgressService.hydrate();
        if (this.auth.user()?.id !== id || this.epoch !== epoch) return;
        const saved = this.studentProgressService.getModuleProgress<GameProgress>('organic-mission');
        this.state = this.restoreProgress(saved);
        this.ready.set(true);
      } catch {
        if (this.auth.user()?.id === id && this.epoch === epoch) this.error.set('No se pudo cargar la misión. Vuelve a intentarlo.');
      } finally {
        if (this.auth.user()?.id === id && this.epoch === epoch) this.loading.set(false);
      }
    })();
    this.initialization = { id, promise };
    try { await promise; }
    finally { if (this.initialization?.promise === promise) this.initialization = null; }
  }

  private canPlay(): boolean {
    this.checkOwner();
    return isPlatformBrowser(this.platformId) && !!this.owner && this.auth.role() === 'estudiante' && this.ready();
  }

  saveProgress(): void {
    if (!this.canPlay()) return;
    this.progress.lastPlayedAt = new Date().toISOString();
    // Clone the snapshot: later in-memory edits must not change an in-flight upsert.
    this.studentProgressService.saveModuleProgress('organic-mission', structuredClone(this.progress));
  }

  /** PR-L3 supplies the teacher_guidance table and its read/mark-read implementation. */
  async getStudentGuidance(): Promise<{ title: string; message: string } | null> { return null; }
  async clearStudentGuidance(): Promise<void> { /* Pending PR-L3; no simulated message. */ }

  private restoreProgress(saved: GameProgress | null): GameProgress {
    const initial = this.emptyProgress();
    if (!saved || !Array.isArray(saved.levels) || !Array.isArray(saved.badges) ||
      !Number.isFinite(saved.totalScore) || saved.totalScore < 0 ||
      !initial.levels.every(level => saved.levels.some(item => item.levelId === level.levelId &&
        Array.isArray(item.answeredQuestionIds) && Number.isFinite(item.score) &&
        Number.isFinite(item.lives) && item.lives >= 0 && item.lives <= 5))) return initial;
    const result = structuredClone(saved);
    // Existing progress must never award the same XP again after upgrading.
    if (!Array.isArray(result.awardedQuestionIds)) result.awardedQuestionIds = result.levels.flatMap(level => level.answeredQuestionIds);
    if (!Array.isArray(result.awardedLevelIds)) result.awardedLevelIds = result.levels.filter(level => level.completed).map(level => level.levelId);
    result.finalBonusAwarded ??= result.allLevelsCompleted;
    return result;
  }

  resetProgress(): void {
    if (!this.canPlay()) return;
    const { awardedQuestionIds, awardedLevelIds, finalBonusAwarded } = this.progress;
    this.state = { ...this.emptyProgress(), awardedQuestionIds, awardedLevelIds, finalBonusAwarded };
    this.saveProgress();
  }

  private emptyProgress(): GameProgress {
    return {
      awardedQuestionIds: [], awardedLevelIds: [], finalBonusAwarded: false,
      totalScore: 0,
      currentLevel: 1,
      levels: LEVELS.map(l => ({
        levelId: l.id,
        completed: false,
        score: 0,
        lives: 5,
        correctAnswers: 0,
        wrongAnswers: 0,
        perfectLevel: false,
        answeredQuestionIds: []
      })),
      badges: JSON.parse(JSON.stringify(DEFAULT_BADGES)),
      allLevelsCompleted: false,
      misionCumplida: false,
      startedAt: new Date().toISOString(),
      lastPlayedAt: new Date().toISOString()
    };
  }

  // ── Getters de estado ─────────────────────────────────
  getProgress(): GameProgress { return this.progress; }
  getTotalScore(): number { return this.progress.totalScore; }
  getBadges(): Badge[] { return this.progress.badges; }

  getLevelProgress(levelId: number): LevelProgress {
    return this.progress.levels.find(l => l.levelId === levelId)!;
  }

  isLevelUnlocked(levelId: number): boolean {
    if (levelId === 1) return true;
    const minScore = LEVELS.find(l => l.id === levelId)?.minScore ?? 0;
    return this.progress.totalScore >= minScore;
  }

  isLevelCompleted(levelId: number): boolean {
    return this.getLevelProgress(levelId)?.completed ?? false;
  }

  hasAnsweredQuestion(levelId: number, questionId: string): boolean {
    return this.getLevelProgress(levelId)?.answeredQuestionIds.includes(questionId) ?? false;
  }

  // ── Lógica de respuestas ───────────────────────────────
  /**
   * Registra una respuesta y retorna los puntos ganados (0 si ya respondida o incorrecta)
   */
  recordAnswer(
    levelId: number,
    questionId: string,
    difficulty: string,
    isCorrect: boolean
  ): number {
    if (!this.canPlay() || !this.isLevelUnlocked(levelId)) return 0;
    const question = LEVELS.find(level => level.id === levelId)?.questions.find(item => item.id === questionId);
    if (!question) return 0;
    difficulty = question.difficulty;
    const lp = this.getLevelProgress(levelId);
    if (!lp || lp.completed || lp.lives <= 0) return 0;

    // No sumar puntos si ya fue respondida
    if (lp.answeredQuestionIds.includes(questionId)) return 0;

    lp.answeredQuestionIds.push(questionId);
    this.progress.currentLevel = levelId;

    if (isCorrect) {
      lp.correctAnswers++;
      const pts = POINTS_BY_DIFFICULTY[difficulty] ?? 10;
      lp.score += pts;
      this.progress.totalScore += pts;

      if (!this.progress.awardedQuestionIds!.includes(questionId)) {
        this.progress.awardedQuestionIds!.push(questionId);
        this.studentProgressService.addXp(pts);
        this.events.record({ module: 'organic-mission', title: 'Respuesta correcta en Misión Orgánica',
          detail: `Nivel ${levelId} · Pregunta ${questionId} · ${difficulty}`, xp: pts });
      }
      this.saveProgress();

      return pts;
    } else {
      lp.wrongAnswers++;
      lp.lives = Math.max(0, lp.lives - 1);
      this.saveProgress();

      this.events.record({ module: 'organic-mission', title: 'Respuesta incorrecta en Misión Orgánica',
        detail: `Nivel ${levelId} · Pregunta ${questionId} · Vidas restantes: ${lp.lives}`, xp: 0 });

      return 0;
    }
  }

  /**
   * Marca un nivel como completado y aplica bonificaciones
   * Retorna lista de bonus aplicados: { label, points }
   */
  completeLevel(levelId: number): { label: string; points: number }[] {
    const lp = this.getLevelProgress(levelId);
    if (!this.canPlay() || !lp || lp.completed || lp.lives <= 0 || !this.isLevelUnlocked(levelId)) return [];
    const level = LEVELS.find(item => item.id === levelId)!;
    if (!level.questions.every(question => lp.answeredQuestionIds.includes(question.id))) return [];
    const awardXp = !this.progress.awardedLevelIds!.includes(levelId);
    if (awardXp) this.progress.awardedLevelIds!.push(levelId);

    const bonuses: { label: string; points: number }[] = [];
    lp.completed = true;

    // Bonus por completar nivel
    const levelBonus = 50;
    lp.score += levelBonus;
    this.progress.totalScore += levelBonus;
    bonuses.push({ label: 'Nivel completado', points: levelBonus });
    if (awardXp) this.studentProgressService.addXp(levelBonus);

    // Bonus por nivel perfecto (sin errores)
    if (lp.wrongAnswers === 0) {
      lp.perfectLevel = true;
      const perfectBonus = 30;
      lp.score += perfectBonus;
      this.progress.totalScore += perfectBonus;
      bonuses.push({ label: 'Nivel sin errores', points: perfectBonus });
      if (awardXp) this.studentProgressService.addXp(perfectBonus);
    }

    // Desbloquear insignia del nivel
    this.unlockLevelBadge(levelId);

    // Sincronizar insignias curriculares en la vitrina del estudiante
    this.studentProgressService.unlockBadge('detective-organico');
    if (levelId === 1) this.studentProgressService.unlockBadge('explorador-carbono');
    if (levelId === 2) this.studentProgressService.unlockBadge('experto-hidrocarburos');
    if (levelId === 3) this.studentProgressService.unlockBadge('maestro-iupac');
    if (levelId === 4) this.studentProgressService.unlockBadge('genio-organico');

    const levelTitle = LEVELS.find(l => l.id === levelId)?.title || `Nivel ${levelId}`;
    if (awardXp) this.events.record({ module: 'organic-mission', title: `Nivel completado: ${levelTitle}`,
      detail: `Puntaje: ${lp.score} · ${lp.perfectLevel ? 'Sin errores' : 'Completado'}`,
      xp: levelBonus + (lp.perfectLevel ? 30 : 0) });

    // ¿Todos los niveles completados?
    const allDone = this.progress.levels.every(l => l.completed);
    if (allDone && !this.progress.allLevelsCompleted) {
      this.progress.allLevelsCompleted = true;

      // Bonus final
      const finalBonus = 100;
      this.progress.totalScore += finalBonus;
      bonuses.push({ label: '¡Todos los niveles!', points: finalBonus });
      if (!this.progress.finalBonusAwarded) {
        this.progress.finalBonusAwarded = true;
        this.studentProgressService.addXp(finalBonus);
        this.events.record({ module: 'organic-mission', title: 'Misión Orgánica completada',
          detail: `Puntaje total: ${this.progress.totalScore}`, xp: finalBonus });
      }

      // Insignia Mente Química: completar todos sin perder vidas
      const noLivesLost = this.progress.levels.every(l => l.perfectLevel);
      if (noLivesLost) {
        const badge = this.progress.badges.find(b => b.id === 'mente-quimica');
        if (badge && !badge.unlocked) {
          badge.unlocked = true;
          badge.unlockedAt = new Date().toISOString();
        }
        this.studentProgressService.unlockBadge('mente-quimica');
      }

      this.progress.misionCumplida = true;
    }

    this.saveProgress();
    return bonuses;
  }

  /** Reinicia un nivel (para volver a intentarlo sin borrar todo) */
  retryLevel(levelId: number): void {
    if (!this.canPlay()) return;
    const lp = this.getLevelProgress(levelId);
    if (!lp) return;
    // Descontar los puntos previamente ganados en este nivel
    this.progress.totalScore = Math.max(0, this.progress.totalScore - lp.score);
    lp.score = 0;
    lp.lives = 5;
    lp.correctAnswers = 0;
    lp.wrongAnswers = 0;
    lp.perfectLevel = false;
    lp.completed = false;
    lp.answeredQuestionIds = [];
    this.saveProgress();
  }

  // ── Insignias ──────────────────────────────────────────
  private unlockLevelBadge(levelId: number): void {
    const badgeIds = [
      'explorador-carbono',
      'experto-hidrocarburos',
      'maestro-iupac',
      'genio-organico'
    ];
    const badgeId = badgeIds[levelId - 1];
    const badge = this.progress.badges.find(b => b.id === badgeId);
    if (badge && !badge.unlocked) {
      badge.unlocked = true;
      badge.unlockedAt = new Date().toISOString();
    }
  }

  // ── Estadísticas ───────────────────────────────────────
  getAccuracy(levelId: number): number {
    const lp = this.getLevelProgress(levelId);
    if (!lp) return 0;
    const total = lp.correctAnswers + lp.wrongAnswers;
    return total === 0 ? 0 : Math.round((lp.correctAnswers / total) * 100);
  }
}


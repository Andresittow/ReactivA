// ============================================================
// SERVICIO DE ESTADO DEL JUEGO – Misión Orgánica
// Gestiona puntaje, vidas, progreso y persistencia localStorage
// ============================================================

import { Injectable } from '@angular/core';
import { Badge, GameProgress, LevelProgress } from '../models/game.models';
import { LEVELS, POINTS_BY_DIFFICULTY } from '../data/questions.data';

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

  // ── Estado en memoria ──────────────────────────────────
  private progress!: GameProgress;

  constructor() {
    this.loadProgress();
  }

  // ── Persistencia ───────────────────────────────────────
  private loadProgress(): void {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        this.progress = JSON.parse(saved);
        return;
      } catch { /* fall through to reset */ }
    }
    this.resetProgress();
  }

  saveProgress(): void {
    this.progress.lastPlayedAt = new Date().toISOString();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.progress));
  }

  resetProgress(): void {
    this.progress = {
      totalScore: 0,
      currentLevel: 1,
      levels: LEVELS.map(l => ({
        levelId: l.id,
        completed: false,
        score: 0,
        lives: 3,
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
    this.saveProgress();
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
    const lp = this.getLevelProgress(levelId);
    if (!lp) return 0;

    // No sumar puntos si ya fue respondida
    if (lp.answeredQuestionIds.includes(questionId)) return 0;

    lp.answeredQuestionIds.push(questionId);

    if (isCorrect) {
      lp.correctAnswers++;
      const pts = POINTS_BY_DIFFICULTY[difficulty] ?? 10;
      lp.score += pts;
      this.progress.totalScore += pts;
      this.saveProgress();
      return pts;
    } else {
      lp.wrongAnswers++;
      lp.lives = Math.max(0, lp.lives - 1);
      this.saveProgress();
      return 0;
    }
  }

  /**
   * Marca un nivel como completado y aplica bonificaciones
   * Retorna lista de bonus aplicados: { label, points }
   */
  completeLevel(levelId: number): { label: string; points: number }[] {
    const lp = this.getLevelProgress(levelId);
    if (!lp || lp.completed) return [];

    const bonuses: { label: string; points: number }[] = [];
    lp.completed = true;

    // Bonus por completar nivel
    const levelBonus = 50;
    lp.score += levelBonus;
    this.progress.totalScore += levelBonus;
    bonuses.push({ label: 'Nivel completado', points: levelBonus });

    // Bonus por nivel perfecto (sin errores)
    if (lp.wrongAnswers === 0) {
      lp.perfectLevel = true;
      const perfectBonus = 30;
      lp.score += perfectBonus;
      this.progress.totalScore += perfectBonus;
      bonuses.push({ label: 'Nivel sin errores', points: perfectBonus });
    }

    // Desbloquear insignia del nivel
    this.unlockLevelBadge(levelId);

    // ¿Todos los niveles completados?
    const allDone = this.progress.levels.every(l => l.completed);
    if (allDone && !this.progress.allLevelsCompleted) {
      this.progress.allLevelsCompleted = true;

      // Bonus final
      const finalBonus = 100;
      this.progress.totalScore += finalBonus;
      bonuses.push({ label: '¡Todos los niveles!', points: finalBonus });

      // Insignia Mente Química: completar todos sin perder vidas
      const noLivesLost = this.progress.levels.every(l => l.perfectLevel);
      if (noLivesLost) {
        const badge = this.progress.badges.find(b => b.id === 'mente-quimica');
        if (badge && !badge.unlocked) {
          badge.unlocked = true;
          badge.unlockedAt = new Date().toISOString();
        }
      }

      this.progress.misionCumplida = true;
    }

    this.saveProgress();
    return bonuses;
  }

  /** Reinicia un nivel (para volver a intentarlo sin borrar todo) */
  retryLevel(levelId: number): void {
    const lp = this.getLevelProgress(levelId);
    if (!lp) return;
    // Descontar los puntos previamente ganados en este nivel
    this.progress.totalScore = Math.max(0, this.progress.totalScore - lp.score);
    lp.score = 0;
    lp.lives = 3;
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


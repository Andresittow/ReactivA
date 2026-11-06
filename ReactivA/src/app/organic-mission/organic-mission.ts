// ============================================================
// COMPONENTE PRINCIPAL – Misión Orgánica: Domina el Carbono
// Angular 21 Standalone | ReactivA Platform
// ============================================================

import {
  Component,
  OnInit,
  OnDestroy,
  signal,
  computed
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

import { GameService } from './services/game.service';
import { LEVELS } from './data/questions.data';
import {
  GameScreen,
  LevelConfig,
  Question,
  MatchPair,
  Badge
} from './models/game.models';

@Component({
  selector: 'app-mision-organica',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './organic-mission.html',
  styleUrl: './organic-mission.scss'
})
export class MisionOrganicaComponent implements OnInit, OnDestroy {

  // ── Pantallas ──────────────────────────────────────────
  currentScreen = signal<GameScreen>('intro');

  // ── Datos estáticos ────────────────────────────────────
  readonly levels: LevelConfig[] = LEVELS;

  // ── Nivel activo ───────────────────────────────────────
  activeLevelId = signal<number>(1);
  activeLevel = computed(() => this.levels.find(l => l.id === this.activeLevelId())!);

  // ── Preguntas del nivel activo ─────────────────────────
  levelQuestions = signal<Question[]>([]);
  currentQuestionIndex = signal<number>(0);
  currentQuestion = computed(() =>
    this.levelQuestions()[this.currentQuestionIndex()] ?? null
  );

  // ── Estado de respuesta ────────────────────────────────
  selectedOptionIndex = signal<number | null>(null);
  hasAnswered = signal<boolean>(false);
  isCorrect = signal<boolean>(false);
  pointsEarned = signal<number>(0);
  feedbackMessage = signal<string>('');

  // ── Matching game state ────────────────────────────────
  matchLeft = signal<{ pair: MatchPair; matched: boolean; selected: boolean }[]>([]);
  matchRight = signal<{ name: string; matched: boolean; selected: boolean; pairIndex: number }[]>([]);
  selectedLeftIndex = signal<number | null>(null);
  selectedRightIndex = signal<number | null>(null);
  matchResult = signal<'correct' | 'wrong' | null>(null);
  matchedPairsCount = signal<number>(0);

  // ── Contrarreloj ───────────────────────────────────────
  timeLeft = signal<number>(0);
  timerInterval: ReturnType<typeof setInterval> | null = null;
  timerExpired = signal<boolean>(false);

  // ── Resultados del nivel ────────────────────────────────
  bonuses = signal<{ label: string; points: number }[]>([]);
  newlyUnlockedBadges = signal<Badge[]>([]);

  // ── Animaciones ────────────────────────────────────────
  showCelebration = signal<boolean>(false);
  showBadgeUnlock = signal<boolean>(false);

  constructor(public gameService: GameService) {}

  ngOnInit(): void {}

  ngOnDestroy(): void {
    this.clearTimer();
  }

  // ── Navegación entre pantallas ─────────────────────────

  goToLevelSelect(): void {
    this.clearTimer();
    this.currentScreen.set('level-select');
  }

  startLevel(levelId: number): void {
    if (!this.gameService.isLevelUnlocked(levelId)) return;

    this.activeLevelId.set(levelId);
    const level = this.levels.find(l => l.id === levelId)!;

    // Mezclar preguntas y filtrar ya respondidas
    const answered = this.gameService.getLevelProgress(levelId).answeredQuestionIds;
    const pending = level.questions.filter(q => !answered.includes(q.id));
    const shuffled = [...pending].sort(() => Math.random() - 0.5);
    this.levelQuestions.set(shuffled.length > 0 ? shuffled : [...level.questions]);

    this.currentQuestionIndex.set(0);
    this.resetAnswerState();
    this.currentScreen.set('playing');
    this.initCurrentQuestion();
  }

  private initCurrentQuestion(): void {
    const q = this.currentQuestion();
    if (!q) return;

    this.resetAnswerState();

    if (q.activity === 'match-pairs' && q.pairs) {
      this.initMatchPairs(q.pairs);
    }

    if (q.activity === 'time-attack') {
      this.startTimer(q.timeLimit ?? 15);
    }
  }

  // ── Respuestas: Selección múltiple / nomenclatura / identificar ─

  selectOption(index: number): void {
    if (this.hasAnswered()) return;

    const q = this.currentQuestion();
    if (!q) return;

    this.clearTimer();
    this.selectedOptionIndex.set(index);

    const correct = index === q.correctIndex;
    this.isCorrect.set(correct);
    this.hasAnswered.set(true);

    const pts = this.gameService.recordAnswer(
      this.activeLevelId(),
      q.id,
      q.difficulty,
      correct
    );
    this.pointsEarned.set(pts);

    if (correct) {
      this.feedbackMessage.set('¡Correcto! 🎉');
      this.triggerCelebration();
    } else {
      this.feedbackMessage.set('Respuesta incorrecta 😔');
    }
  }

  // ── Match pairs ─────────────────────────────────────────

  private initMatchPairs(pairs: MatchPair[]): void {
    const left = pairs.map(p => ({ pair: p, matched: false, selected: false }));
    // Mezclar el lado derecho
    const right = pairs
      .map((p, i) => ({ name: p.name, matched: false, selected: false, pairIndex: i }))
      .sort(() => Math.random() - 0.5);

    this.matchLeft.set(left);
    this.matchRight.set(right);
    this.selectedLeftIndex.set(null);
    this.selectedRightIndex.set(null);
    this.matchResult.set(null);
    this.matchedPairsCount.set(0);
  }

  selectLeft(index: number): void {
    if (this.matchLeft()[index].matched) return;
    const updated = this.matchLeft().map((item, i) => ({ ...item, selected: i === index }));
    this.matchLeft.set(updated);
    this.selectedLeftIndex.set(index);
    this.tryMatch();
  }

  selectRight(index: number): void {
    if (this.matchRight()[index].matched) return;
    const updated = this.matchRight().map((item, i) => ({ ...item, selected: i === index }));
    this.matchRight.set(updated);
    this.selectedRightIndex.set(index);
    this.tryMatch();
  }

  private tryMatch(): void {
    const li = this.selectedLeftIndex();
    const ri = this.selectedRightIndex();
    if (li === null || ri === null) return;

    const leftItem = this.matchLeft()[li];
    const rightItem = this.matchRight()[ri];
    const isMatch = leftItem.pair.name === rightItem.name;

    if (isMatch) {
      // Marcar como emparejados
      const newLeft = this.matchLeft().map((item, i) =>
        i === li ? { ...item, matched: true, selected: false } : { ...item, selected: false }
      );
      const newRight = this.matchRight().map((item, i) =>
        i === ri ? { ...item, matched: true, selected: false } : { ...item, selected: false }
      );
      this.matchLeft.set(newLeft);
      this.matchRight.set(newRight);
      this.matchResult.set('correct');
      this.matchedPairsCount.update(c => c + 1);

      // Si se completaron todos los pares
      const totalPairs = this.matchLeft().length;
      if (this.matchedPairsCount() === totalPairs) {
        const q = this.currentQuestion()!;
        const pts = this.gameService.recordAnswer(
          this.activeLevelId(), q.id, q.difficulty, true
        );
        this.pointsEarned.set(pts);
        this.isCorrect.set(true);
        this.hasAnswered.set(true);
        this.feedbackMessage.set('¡Pares completados! 🎉');
        this.triggerCelebration();
      }

      setTimeout(() => this.matchResult.set(null), 500);
    } else {
      this.matchResult.set('wrong');
      setTimeout(() => {
        const resetLeft = this.matchLeft().map(item => ({ ...item, selected: false }));
        const resetRight = this.matchRight().map(item => ({ ...item, selected: false }));
        this.matchLeft.set(resetLeft);
        this.matchRight.set(resetRight);
        this.matchResult.set(null);
      }, 700);
    }

    this.selectedLeftIndex.set(null);
    this.selectedRightIndex.set(null);
  }

  // ── Contrarreloj ──────────────────────────────────────

  private startTimer(seconds: number): void {
    this.clearTimer();
    this.timeLeft.set(seconds);
    this.timerExpired.set(false);

    this.timerInterval = setInterval(() => {
      this.timeLeft.update(t => {
        if (t <= 1) {
          this.clearTimer();
          this.onTimerExpired();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  }

  private clearTimer(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  private onTimerExpired(): void {
    if (this.hasAnswered()) return;
    this.timerExpired.set(true);
    this.hasAnswered.set(true);
    this.isCorrect.set(false);
    const q = this.currentQuestion();
    if (q) {
      this.gameService.recordAnswer(this.activeLevelId(), q.id, q.difficulty, false);
      this.feedbackMessage.set('¡Tiempo agotado! ⏱');
    }
  }

  // ── Avanzar preguntas ──────────────────────────────────

  nextQuestion(): void {
    const lp = this.gameService.getLevelProgress(this.activeLevelId());
    const lives = lp?.lives ?? 0;

    // Sin vidas → pantalla de resultados
    if (lives <= 0) {
      this.showLevelResults(false);
      return;
    }

    const nextIndex = this.currentQuestionIndex() + 1;
    if (nextIndex >= this.levelQuestions().length) {
      // Nivel terminado
      this.showLevelResults(true);
    } else {
      this.currentQuestionIndex.set(nextIndex);
      this.initCurrentQuestion();
    }
  }

  private showLevelResults(completed: boolean): void {
    this.clearTimer();
    let bonuses: { label: string; points: number }[] = [];

    if (completed) {
      const prevBadgeState = this.gameService.getBadges().map(b => ({ ...b }));
      bonuses = this.gameService.completeLevel(this.activeLevelId());
      // Detectar insignias recién desbloqueadas
      const newly = this.gameService.getBadges().filter((b, i) =>
        b.unlocked && !prevBadgeState[i].unlocked
      );
      this.newlyUnlockedBadges.set(newly);
      if (newly.length > 0) {
        this.showBadgeUnlock.set(true);
        setTimeout(() => this.showBadgeUnlock.set(false), 3000);
      }
    }

    this.bonuses.set(bonuses);
    this.currentScreen.set('level-results');
  }

  retryLevel(): void {
    this.gameService.retryLevel(this.activeLevelId());
    this.startLevel(this.activeLevelId());
  }

  goToFinalResults(): void {
    this.currentScreen.set('final-results');
  }

  // ── Helpers ────────────────────────────────────────────

  private resetAnswerState(): void {
    this.selectedOptionIndex.set(null);
    this.hasAnswered.set(false);
    this.isCorrect.set(false);
    this.pointsEarned.set(0);
    this.feedbackMessage.set('');
    this.timerExpired.set(false);
    this.clearTimer();
  }

  private triggerCelebration(): void {
    this.showCelebration.set(true);
    setTimeout(() => this.showCelebration.set(false), 1500);
  }

  progressPercent(): number {
    const total = this.levelQuestions().length;
    if (total === 0) return 0;
    return Math.round((this.currentQuestionIndex() / total) * 100);
  }

  livesArray(): number[] {
    const lp = this.gameService.getLevelProgress(this.activeLevelId());
    return Array.from({ length: lp?.lives ?? 0 });
  }

  lostLivesArray(): number[] {
    const lp = this.gameService.getLevelProgress(this.activeLevelId());
    if (!lp) return [];
    const lost = 3 - lp.lives;
    return Array.from({ length: Math.max(0, lost) });
  }

  trackByIndex(index: number): number {
    return index;
  }

  getTimerColor(): string {
    const t = this.timeLeft();
    if (t > 8) return '#10b981';
    if (t > 4) return '#f59e0b';
    return '#ef4444';
  }

  getTimerPercent(): number {
    const q = this.currentQuestion();
    const max = q?.timeLimit ?? 15;
    return Math.round((this.timeLeft() / max) * 100);
  }

  resetAll(): void {
    this.gameService.resetProgress();
    this.currentScreen.set('intro');
  }
}


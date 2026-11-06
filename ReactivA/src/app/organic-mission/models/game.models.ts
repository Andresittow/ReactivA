// ============================================================
// MODELOS E INTERFACES – Misión Orgánica: Domina el Carbono
// ============================================================

export type ActivityType =
  | 'multiple-choice'
  | 'match-pairs'
  | 'identify-molecule'
  | 'nomenclature'
  | 'time-attack';

export type Difficulty = 'basica' | 'intermedia' | 'avanzada' | 'reto-final';

export interface MatchPair {
  formula: string;
  name: string;
}

export interface Question {
  id: string;
  levelId: number;
  activity: ActivityType;
  difficulty: Difficulty;
  question: string;
  /** Para multiple-choice, identify-molecule, nomenclature */
  options?: string[];
  /** Índice de la respuesta correcta en options[] */
  correctIndex?: number;
  /** Para match-pairs */
  pairs?: MatchPair[];
  /** Explicación educativa mostrada al responder */
  explanation: string;
  /** Fórmula química o SVG-inline para actividades visuales */
  formula?: string;
  /** Duración en segundos para reto contrarreloj */
  timeLimit?: number;
}

export interface LevelConfig {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  difficulty: Difficulty;
  icon: string;
  color: string;
  reward: number;
  minScore: number; // puntaje mínimo para desbloquear el siguiente nivel
  questions: Question[];
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  unlocked: boolean;
  unlockedAt?: string;
}

export interface LevelProgress {
  levelId: number;
  completed: boolean;
  score: number;
  lives: number;
  correctAnswers: number;
  wrongAnswers: number;
  perfectLevel: boolean;
  answeredQuestionIds: string[];
}

export interface GameProgress {
  totalScore: number;
  currentLevel: number;
  levels: LevelProgress[];
  badges: Badge[];
  allLevelsCompleted: boolean;
  misionCumplida: boolean;
  startedAt: string;
  lastPlayedAt: string;
}

export type GameScreen =
  | 'intro'
  | 'level-select'
  | 'playing'
  | 'feedback'
  | 'level-results'
  | 'final-results';


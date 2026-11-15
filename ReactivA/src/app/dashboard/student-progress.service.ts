import { Injectable, inject, PLATFORM_ID, effect } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from '../core/supabase/supabase.client';
import { AuthService } from '../core/auth/auth.service';
import { LearningEventsService } from '../core/services/learning-events.service';
import { ModuleKey } from '../core/models/module.model';

export interface StudentProfile {
  name: string;
  grade: string;
  email: string;
}

export interface GamificationState {
  xp: number;
  level: number;
  levelTitle: string;
  streakDays: number;
  lastActiveDate: string;
  nextLevelXp: number;
  levelProgressPercent: number;
}

export interface StoredDashboardTask {
  id: number;
  title: string;
  completed: boolean;
  xpReward: number;
}

export interface StoredChallengeItem {
  id: number;
  title: string;
  currentProgress: number;
  totalProgress: number;
  progressPercent: number;
  isClaimed: boolean;
  canClaim: boolean;
  buttonLabel: string;
  buttonActionType: 'claimed' | 'continue' | 'view' | 'enter' | 'claim';
}

interface LevelBracket {
  level: number;
  minXp: number;
  nextXp: number;
  title: string;
}

const LEVEL_BRACKETS: LevelBracket[] = [
  { level: 1, minXp: 0, nextXp: 300, title: 'Iniciado en Química' },
  { level: 2, minXp: 300, nextXp: 700, title: 'Observador Molecular' },
  { level: 3, minXp: 700, nextXp: 1200, title: 'Explorador de Enlaces' },
  { level: 4, minXp: 1200, nextXp: 1800, title: 'Analista de Elementos' },
  { level: 5, minXp: 1800, nextXp: 2500, title: 'Técnico de Laboratorio' },
  { level: 6, minXp: 2500, nextXp: 3300, title: 'Operador Redox' },
  { level: 7, minXp: 3300, nextXp: 4200, title: 'Investigador de Compuestos' },
  { level: 8, minXp: 4200, nextXp: 5200, title: 'Alquimista Experto' },
  { level: 9, minXp: 5200, nextXp: 6300, title: 'Maestro de Reacciones' },
  { level: 10, minXp: 6300, nextXp: 7500, title: 'Gran Químico Cuántico' }
];

const DEFAULT_TASKS_TEMPLATE: StoredDashboardTask[] = [
  { id: 1, title: 'Completar test de enlace atómico', completed: false, xpReward: 50 },
  { id: 2, title: 'Calibrar simulador de temperatura en gases', completed: false, xpReward: 40 },
  { id: 3, title: 'Identificar 3 compuestos orgánicos', completed: false, xpReward: 30 },
  { id: 4, title: 'Balancear ecuación de combustión del metano', completed: false, xpReward: 50 }
];

const DEFAULT_CHALLENGES_TEMPLATE: StoredChallengeItem[] = [
  {
    id: 1,
    title: 'Balanceo Relámpago',
    currentProgress: 0,
    totalProgress: 3,
    progressPercent: 0,
    isClaimed: false,
    canClaim: false,
    buttonLabel: 'Comenzar (+50 XP)',
    buttonActionType: 'enter'
  },
  {
    id: 2,
    title: 'Caza en la Tabla Periódica',
    currentProgress: 0,
    totalProgress: 2,
    progressPercent: 0,
    isClaimed: false,
    canClaim: false,
    buttonLabel: 'Continuar (+40 XP)',
    buttonActionType: 'continue'
  },
  {
    id: 3,
    title: 'Síntesis de Orgánicos',
    currentProgress: 0,
    totalProgress: 5,
    progressPercent: 0,
    isClaimed: false,
    canClaim: false,
    buttonLabel: 'Ver Síntesis',
    buttonActionType: 'view'
  },
  {
    id: 4,
    title: 'Laboratorio Sin Errores',
    currentProgress: 0,
    totalProgress: 5,
    progressPercent: 0,
    isClaimed: false,
    canClaim: false,
    buttonLabel: 'Entrar al Matraz',
    buttonActionType: 'enter'
  }
];

function getTodayIsoDate(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

@Injectable({
  providedIn: 'root'
})
export class StudentProgressService {
  private readonly supabase: SupabaseClient = inject(SUPABASE_CLIENT);
  private readonly authService = inject(AuthService);
  private readonly learningEvents = inject(LearningEventsService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  // Caché síncrono en memoria (Patrón §2.3)
  private gamificationState: GamificationState = this.computeGamificationState(0, 0, getTodayIsoDate());
  private tasks: StoredDashboardTask[] = DEFAULT_TASKS_TEMPLATE.map(t => ({ ...t }));
  private challenges: StoredChallengeItem[] = DEFAULT_CHALLENGES_TEMPLATE.map(c => ({ ...c }));
  private unlockedBadges = new Set<string>();
  private moduleProgressMap = new Map<ModuleKey, any>();
  private isHydrated = false;

  constructor() {
    this.cleanLegacyLocalStorage();
    this.authService?.registerProgressSyncHandler?.(this);

    if (this.isBrowser) {
      effect(() => {
        const user = this.authService.user();
        if (user) {
          this.hydrate().then();
        } else {
          this.reset();
        }
      });
    }
  }

  private cleanLegacyLocalStorage(): void {
    if (!this.isBrowser) return;
    try {
      const legacyKeys = [
        'reactiva_student_profile',
        'reactiva_gamification_state',
        'reactiva_dashboard_tasks',
        'reactiva_challenges_state',
        'reactiva_unlocked_badges',
        'currentUser',
        'reactiva_user'
      ];
      legacyKeys.forEach(k => localStorage.removeItem(k));
    } catch {
      // Ignorar errores de acceso a almacenamiento
    }
  }

  // --------------------------------------------------------
  // 0. Hidratación y Reset (Caché síncrona + async write)
  // --------------------------------------------------------
  async hydrate(): Promise<void> {
    if (!this.isBrowser) return;

    const user = this.authService.user();
    if (!user) {
      this.reset();
      return;
    }

    try {
      // 1. Cargar student_progress
      const { data: progressData } = await this.supabase
        .from('student_progress')
        .select('*')
        .eq('student_id', user.id)
        .maybeSingle();

      const today = getTodayIsoDate();
      let xp = 0;
      let streakDays = 0;
      let lastActiveDate = today;

      if (progressData) {
        xp = progressData.xp ?? 0;
        const storedStreak = progressData.streak_days ?? 0;
        const storedLastActive = progressData.last_active_date;

        const updatedStreak = this.calculateStreak(storedLastActive, storedStreak, today);
        streakDays = updatedStreak.streak;
        lastActiveDate = updatedStreak.lastActiveDate;

        // Actualizar racha en Supabase en segundo plano si cambió la fecha activa
        if (storedLastActive !== today || storedStreak !== streakDays) {
          this.supabase
            .from('student_progress')
            .update({ streak_days: streakDays, last_active_date: today })
            .eq('student_id', user.id)
            .then();
        }
      } else {
        // Inicializar fila en student_progress
        this.supabase
          .from('student_progress')
          .insert({ student_id: user.id, xp: 0, level: 1, streak_days: 1, last_active_date: today })
          .then();
        streakDays = 1;
      }

      this.gamificationState = this.computeGamificationState(xp, streakDays, lastActiveDate);

      // 2. Cargar tareas (student_tasks)
      const { data: tasksData } = await this.supabase
        .from('student_tasks')
        .select('*')
        .eq('student_id', user.id);

      if (tasksData && tasksData.length > 0) {
        const completedMap = new Map<string, boolean>();
        tasksData.forEach(t => completedMap.set(String(t.task_id), t.completed));

        this.tasks = DEFAULT_TASKS_TEMPLATE.map(task => ({
          ...task,
          completed: completedMap.get(String(task.id)) ?? false
        }));
      } else {
        this.tasks = DEFAULT_TASKS_TEMPLATE.map(t => ({ ...t }));
      }

      // 3. Cargar retos (student_challenges)
      const { data: challengesData } = await this.supabase
        .from('student_challenges')
        .select('*')
        .eq('student_id', user.id);

      if (challengesData && challengesData.length > 0) {
        const challengeMap = new Map<string, { current_progress: number; claimed: boolean }>();
        challengesData.forEach(c => challengeMap.set(String(c.challenge_id), {
          current_progress: c.current_progress,
          claimed: c.claimed
        }));

        this.challenges = DEFAULT_CHALLENGES_TEMPLATE.map(item => {
          const stored = challengeMap.get(String(item.id));
          if (!stored) return { ...item };

          const currentProgress = stored.current_progress;
          const isClaimed = stored.claimed;
          const progressPercent = Math.min(100, Math.round((currentProgress / item.totalProgress) * 100));
          const canClaim = !isClaimed && currentProgress >= item.totalProgress;

          let buttonLabel = item.buttonLabel;
          let buttonActionType = item.buttonActionType;

          if (isClaimed) {
            buttonLabel = '¡Reclamado!';
            buttonActionType = 'claimed';
          } else if (canClaim) {
            buttonLabel = '¡Reclamar Recompensa!';
            buttonActionType = 'claim';
          }

          return {
            ...item,
            currentProgress,
            progressPercent,
            isClaimed,
            canClaim,
            buttonLabel,
            buttonActionType
          };
        });
      } else {
        this.challenges = DEFAULT_CHALLENGES_TEMPLATE.map(c => ({ ...c }));
      }

      // 4. Cargar insignias (student_badges)
      const { data: badgesData } = await this.supabase
        .from('student_badges')
        .select('badge_id')
        .eq('student_id', user.id);

      this.unlockedBadges.clear();
      if (badgesData) {
        badgesData.forEach(b => this.unlockedBadges.add(b.badge_id));
      }

      // 5. Cargar progreso de módulos (module_progress)
      const { data: moduleData } = await this.supabase
        .from('module_progress')
        .select('*')
        .eq('student_id', user.id);

      this.moduleProgressMap.clear();
      if (moduleData) {
        moduleData.forEach(m => this.moduleProgressMap.set(m.module as ModuleKey, m.data));
      }

      this.isHydrated = true;
    } catch (err) {
      console.warn('[StudentProgressService] Error hydrating from Supabase:', err);
    }
  }

  reset(): void {
    const today = getTodayIsoDate();
    this.gamificationState = this.computeGamificationState(0, 0, today);
    this.tasks = DEFAULT_TASKS_TEMPLATE.map(t => ({ ...t }));
    this.challenges = DEFAULT_CHALLENGES_TEMPLATE.map(c => ({ ...c }));
    this.unlockedBadges.clear();
    this.moduleProgressMap.clear();
    this.isHydrated = false;
    this.cleanLegacyLocalStorage();
  }

  private calculateStreak(lastDate: string | null | undefined, currentStreak: number, today: string): { streak: number; lastActiveDate: string } {
    if (!lastDate) {
      return { streak: 1, lastActiveDate: today };
    }
    if (lastDate === today) {
      return { streak: Math.max(1, currentStreak), lastActiveDate: today };
    }

    const [tY, tM, tD] = today.split('-').map(Number);
    const [lY, lM, lD] = lastDate.split('-').map(Number);
    const dateToday = new Date(tY, tM - 1, tD);
    const dateLast = new Date(lY, lM - 1, lD);
    const diffDays = Math.round((dateToday.getTime() - dateLast.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      // Actividad consecutiva: suma 1 día a la racha
      return { streak: currentStreak + 1, lastActiveDate: today };
    } else if (diffDays > 1) {
      // Se saltó más de un día: reinicia a 1 (día actual)
      return { streak: 1, lastActiveDate: today };
    }

    return { streak: currentStreak, lastActiveDate: today };
  }

  private computeGamificationState(xp: number, streakDays: number, lastActiveDate: string): GamificationState {
    const safeXp = Math.max(0, xp);
    let level = 1;
    let levelTitle = 'Iniciado en Química';
    let nextLevelXp = 300;
    let progressPercent = 0;

    for (let i = 0; i < LEVEL_BRACKETS.length; i++) {
      const bracket = LEVEL_BRACKETS[i];
      if (safeXp < bracket.nextXp || i === LEVEL_BRACKETS.length - 1) {
        level = bracket.level;
        levelTitle = bracket.title;
        nextLevelXp = bracket.nextXp;
        const range = bracket.nextXp - bracket.minXp;
        const progressInLevel = safeXp - bracket.minXp;
        progressPercent = Math.min(100, Math.max(0, Math.round((progressInLevel / range) * 100)));
        break;
      }
    }

    return {
      xp: safeXp,
      level,
      levelTitle,
      streakDays,
      lastActiveDate,
      nextLevelXp,
      levelProgressPercent: progressPercent
    };
  }

  // --------------------------------------------------------
  // 1. Perfil del Estudiante
  // --------------------------------------------------------
  getProfile(): StudentProfile {
    const u = this.authService.user();
    if (u) {
      return {
        name: u.fullName || u.email.split('@')[0],
        grade: u.grade || '10th Grade',
        email: u.email
      };
    }
    return {
      name: 'Estudiante',
      grade: '10th Grade',
      email: ''
    };
  }

  setProfileName(name: string): void {
    this.authService.updateProfile({ fullName: name }).catch(err => {
      console.warn('[StudentProgressService] Error updating profile name:', err);
    });
  }

  setProfileGrade(grade: string): void {
    this.authService.updateProfile({ grade }).catch(err => {
      console.warn('[StudentProgressService] Error updating profile grade:', err);
    });
  }

  // --------------------------------------------------------
  // 2. Estado de Gamificación (XP, Nivel, Racha)
  // --------------------------------------------------------
  getGamificationState(): GamificationState {
    return { ...this.gamificationState };
  }

  addXp(amount: number): { state: GamificationState; leveledUp: boolean } {
    const oldLevel = this.gamificationState.level;
    const newXp = Math.max(0, this.gamificationState.xp + amount);

    this.gamificationState = this.computeGamificationState(
      newXp,
      this.gamificationState.streakDays,
      this.gamificationState.lastActiveDate
    );

    const user = this.authService.user();
    if (user && this.isBrowser) {
      // Escritura asíncrona en segundo plano
      this.supabase
        .from('student_progress')
        .upsert({
          student_id: user.id,
          xp: this.gamificationState.xp,
          level: this.gamificationState.level,
          streak_days: this.gamificationState.streakDays,
          last_active_date: this.gamificationState.lastActiveDate
        })
        .then();
    }

    return {
      state: { ...this.gamificationState },
      leveledUp: this.gamificationState.level > oldLevel
    };
  }

  // --------------------------------------------------------
  // 3. Tareas Diarias del Dashboard
  // --------------------------------------------------------
  getDashboardTasks(): StoredDashboardTask[] {
    return this.tasks.map(t => ({ ...t }));
  }

  toggleDashboardTask(id: number): { tasks: StoredDashboardTask[]; task: StoredDashboardTask | null; xpGained: number } {
    const task = this.tasks.find(t => t.id === id);
    let xpGained = 0;

    if (task) {
      task.completed = !task.completed;
      xpGained = task.completed ? task.xpReward : -task.xpReward;
      this.addXp(xpGained);

      this.learningEvents.record({
        module: 'dashboard',
        title: task.completed ? 'Misión completada' : 'Misión desmarcada',
        detail: task.title,
        xp: xpGained
      });

      const user = this.authService.user();
      if (user && this.isBrowser) {
        this.supabase
          .from('student_tasks')
          .upsert({
            student_id: user.id,
            task_id: String(task.id),
            completed: task.completed
          })
          .then();
      }
    }

    return {
      tasks: this.tasks.map(t => ({ ...t })),
      task: task ? { ...task } : null,
      xpGained
    };
  }

  // --------------------------------------------------------
  // 4. Desafíos Activos de la Arena (Challenges)
  // --------------------------------------------------------
  getChallengesState(): StoredChallengeItem[] {
    return this.challenges.map(c => ({ ...c }));
  }

  progressChallenge(id: number): { challenges: StoredChallengeItem[]; item: StoredChallengeItem | null; justCompleted: boolean } {
    const item = this.challenges.find(c => c.id === id);
    let justCompleted = false;

    if (item && !item.isClaimed) {
      if (item.currentProgress < item.totalProgress) {
        item.currentProgress++;
        item.progressPercent = Math.round((item.currentProgress / item.totalProgress) * 100);

        if (item.currentProgress >= item.totalProgress) {
          justCompleted = true;
          item.canClaim = true;
          item.buttonLabel = '¡Reclamar Recompensa!';
          item.buttonActionType = 'claim';
        }

        const user = this.authService.user();
        if (user && this.isBrowser) {
          this.supabase
            .from('student_challenges')
            .upsert({
              student_id: user.id,
              challenge_id: String(item.id),
              current_progress: item.currentProgress,
              claimed: item.isClaimed
            })
            .then();
        }
      }
    }

    return {
      challenges: this.challenges.map(c => ({ ...c })),
      item: item ? { ...item } : null,
      justCompleted
    };
  }

  claimChallenge(id: number, xpReward: number): { challenges: StoredChallengeItem[]; item: StoredChallengeItem | null; leveledUp: boolean } {
    const item = this.challenges.find(c => c.id === id);
    let leveledUp = false;

    if (item && !item.isClaimed) {
      item.isClaimed = true;
      item.canClaim = false;
      item.buttonLabel = '¡Reclamado!';
      item.buttonActionType = 'claimed';

      const res = this.addXp(xpReward);
      leveledUp = res.leveledUp;

      this.learningEvents.record({
        module: 'challenges',
        title: `Desafío reclamado: ${item.title}`,
        xp: xpReward
      });

      if (id === 4) {
        this.unlockBadge('furia-en-el-matraz');
      } else if (id === 2) {
        this.unlockBadge('senor-enlaces');
      }

      const user = this.authService.user();
      if (user && this.isBrowser) {
        this.supabase
          .from('student_challenges')
          .upsert({
            student_id: user.id,
            challenge_id: String(item.id),
            current_progress: item.currentProgress,
            claimed: true
          })
          .then();
      }
    }

    return {
      challenges: this.challenges.map(c => ({ ...c })),
      item: item ? { ...item } : null,
      leveledUp
    };
  }

  // --------------------------------------------------------
  // 5. Insignias Desbloqueadas (Trofeos)
  // --------------------------------------------------------
  getUnlockedBadges(): string[] {
    return Array.from(this.unlockedBadges);
  }

  unlockBadge(badgeId: string): boolean {
    if (this.unlockedBadges.has(badgeId)) return false;

    this.unlockedBadges.add(badgeId);

    this.learningEvents.record({
      module: 'challenges',
      title: `Insignia desbloqueada: ${badgeId}`,
      xp: 50
    });

    const user = this.authService.user();
    if (user && this.isBrowser) {
      this.supabase
        .from('student_badges')
        .upsert({
          student_id: user.id,
          badge_id: badgeId,
          unlocked_at: new Date().toISOString()
        })
        .then();
    }

    return true;
  }

  // --------------------------------------------------------
  // 6. Progreso de Módulos (Tabla module_progress)
  // --------------------------------------------------------
  getModuleProgress<T>(module: ModuleKey): T | null {
    return (this.moduleProgressMap.get(module) as T) ?? null;
  }

  saveModuleProgress<T>(module: ModuleKey, data: T): void {
    this.moduleProgressMap.set(module, data);

    const user = this.authService.user();
    if (user && this.isBrowser) {
      this.supabase
        .from('module_progress')
        .upsert({
          student_id: user.id,
          module,
          data,
          updated_at: new Date().toISOString()
        })
        .then();
    }
  }
}

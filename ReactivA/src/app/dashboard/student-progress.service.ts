import { Injectable } from '@angular/core';

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

@Injectable({
  providedIn: 'root'
})
export class StudentProgressService {
  private readonly STORAGE_KEYS = {
    PROFILE: 'reactiva_student_profile',
    GAMIFICATION: 'reactiva_gamification_state',
    TASKS: 'reactiva_dashboard_tasks',
    CHALLENGES: 'reactiva_challenges_state',
    BADGES: 'reactiva_unlocked_badges'
  };

  private isBrowser(): boolean {
    return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
  }

  // --------------------------------------------------------
  // 1. Perfil del Estudiante
  // --------------------------------------------------------
  getProfile(): StudentProfile {
    if (!this.isBrowser()) {
      return { name: 'Científico', grade: '10th Grade', email: 'estudiante@reactiva.edu.co' };
    }

    try {
      // Intentar leer si Login/Register guardó algún usuario
      const authUserJson = localStorage.getItem('currentUser') || localStorage.getItem('reactiva_user');
      let fallbackName = 'Científico';
      let fallbackGrade = '10th Grade';
      let fallbackEmail = 'estudiante@reactiva.edu.co';

      if (authUserJson) {
        const parsed = JSON.parse(authUserJson);
        fallbackName = parsed.name || parsed.username || fallbackName;
        fallbackGrade = parsed.grade || fallbackGrade;
        fallbackEmail = parsed.email || fallbackEmail;
      }

      const storedProfile = localStorage.getItem(this.STORAGE_KEYS.PROFILE);
      if (storedProfile) {
        return JSON.parse(storedProfile);
      }

      const initial: StudentProfile = { name: fallbackName, grade: fallbackGrade, email: fallbackEmail };
      localStorage.setItem(this.STORAGE_KEYS.PROFILE, JSON.stringify(initial));
      return initial;
    } catch {
      return { name: 'Científico', grade: '10th Grade', email: 'estudiante@reactiva.edu.co' };
    }
  }

  setProfileName(name: string): void {
    if (!this.isBrowser()) return;
    const profile = this.getProfile();
    profile.name = name;
    localStorage.setItem(this.STORAGE_KEYS.PROFILE, JSON.stringify(profile));
  }

  setProfileGrade(grade: string): void {
    if (!this.isBrowser()) return;
    const profile = this.getProfile();
    profile.grade = grade;
    localStorage.setItem(this.STORAGE_KEYS.PROFILE, JSON.stringify(profile));
  }

  // --------------------------------------------------------
  // 2. Estado de Gamificación (XP, Nivel, Racha)
  // --------------------------------------------------------
  getGamificationState(): GamificationState {
    const defaultState: GamificationState = {
      xp: 4850,
      level: 14,
      levelTitle: 'Alquimista Experto',
      streakDays: 5,
      lastActiveDate: new Date().toISOString().split('T')[0],
      nextLevelXp: 5000,
      levelProgressPercent: Math.round((4850 / 5000) * 100)
    };

    if (!this.isBrowser()) {
      return defaultState;
    }

    try {
      const stored = localStorage.getItem(this.STORAGE_KEYS.GAMIFICATION);
      if (!stored) {
        localStorage.setItem(this.STORAGE_KEYS.GAMIFICATION, JSON.stringify(defaultState));
        return defaultState;
      }
      const parsed = JSON.parse(stored) as GamificationState;
      return this.recomputeLevel(parsed);
    } catch {
      return defaultState;
    }
  }

  private recomputeLevel(state: GamificationState): GamificationState {
    // Escala de niveles:
    // Level 14: 4500 - 4999 XP
    // Level 15: 5000 - 5599 XP (Maestro de Reacciones)
    // Level 16: 5600 - 6499 XP (Gran Químico Cuántico)
    let level = 14;
    let levelTitle = 'Alquimista Experto';
    let nextLevelXp = 5000;

    if (state.xp >= 5600) {
      level = 16;
      levelTitle = 'Gran Químico Cuántico';
      nextLevelXp = 6500;
    } else if (state.xp >= 5000) {
      level = 15;
      levelTitle = 'Maestro de Reacciones';
      nextLevelXp = 5600;
    } else {
      level = 14;
      levelTitle = 'Alquimista Experto';
      nextLevelXp = 5000;
    }

    const prevThreshold = level === 14 ? 4500 : level === 15 ? 5000 : 5600;
    const progress = Math.min(100, Math.max(0, Math.round(((state.xp - prevThreshold) / (nextLevelXp - prevThreshold)) * 100)));

    return {
      ...state,
      level,
      levelTitle,
      nextLevelXp,
      levelProgressPercent: progress || Math.round((state.xp / nextLevelXp) * 100)
    };
  }

  addXp(amount: number): { state: GamificationState; leveledUp: boolean } {
    const current = this.getGamificationState();
    const oldLevel = current.level;
    current.xp += amount;
    const updated = this.recomputeLevel(current);

    if (this.isBrowser()) {
      localStorage.setItem(this.STORAGE_KEYS.GAMIFICATION, JSON.stringify(updated));
    }

    return {
      state: updated,
      leveledUp: updated.level > oldLevel
    };
  }

  // --------------------------------------------------------
  // 3. Tareas Diarias del Dashboard
  // --------------------------------------------------------
  getDashboardTasks(): StoredDashboardTask[] {
    const defaultTasks: StoredDashboardTask[] = [
      { id: 1, title: 'Completar test de enlace atómico', completed: false, xpReward: 50 },
      { id: 2, title: 'Calibrar simulador de temperatura en gases', completed: true, xpReward: 40 },
      { id: 3, title: 'Identificar 3 compuestos orgánicos', completed: false, xpReward: 30 },
      { id: 4, title: 'Balancear ecuación de combustión del metano', completed: false, xpReward: 50 }
    ];

    if (!this.isBrowser()) {
      return defaultTasks;
    }

    try {
      const stored = localStorage.getItem(this.STORAGE_KEYS.TASKS);
      if (!stored) {
        localStorage.setItem(this.STORAGE_KEYS.TASKS, JSON.stringify(defaultTasks));
        return defaultTasks;
      }
      return JSON.parse(stored);
    } catch {
      return defaultTasks;
    }
  }

  toggleDashboardTask(id: number): { tasks: StoredDashboardTask[]; task: StoredDashboardTask | null; xpGained: number } {
    const tasks = this.getDashboardTasks();
    const task = tasks.find(t => t.id === id);
    let xpGained = 0;

    if (task) {
      task.completed = !task.completed;
      if (task.completed) {
        xpGained = task.xpReward;
        this.addXp(xpGained);
      } else {
        // Si se desmarca, se descuenta el XP para ser coherente
        xpGained = -task.xpReward;
        this.addXp(xpGained);
      }

      if (this.isBrowser()) {
        localStorage.setItem(this.STORAGE_KEYS.TASKS, JSON.stringify(tasks));
      }
    }

    return { tasks, task: task || null, xpGained };
  }

  // --------------------------------------------------------
  // 4. Desafíos Activos de la Arena (Challenges)
  // --------------------------------------------------------
  getChallengesState(): StoredChallengeItem[] {
    const defaultChallenges: StoredChallengeItem[] = [
      {
        id: 1,
        title: 'Balanceo Relámpago',
        currentProgress: 3,
        totalProgress: 3,
        progressPercent: 100,
        isClaimed: true,
        canClaim: false,
        buttonLabel: '¡Reclamado!',
        buttonActionType: 'claimed'
      },
      {
        id: 2,
        title: 'Caza en la Tabla Periódica',
        currentProgress: 1,
        totalProgress: 2,
        progressPercent: 50,
        isClaimed: false,
        canClaim: false,
        buttonLabel: 'Continuar (+40 XP)',
        buttonActionType: 'continue'
      },
      {
        id: 3,
        title: 'Síntesis de Orgánicos',
        currentProgress: 3,
        totalProgress: 5,
        progressPercent: 60,
        isClaimed: false,
        canClaim: false,
        buttonLabel: 'Ver Síntesis',
        buttonActionType: 'view'
      },
      {
        id: 4,
        title: 'Laboratorio Sin Errores',
        currentProgress: 4,
        totalProgress: 5,
        progressPercent: 80,
        isClaimed: false,
        canClaim: false,
        buttonLabel: 'Entrar al Matraz',
        buttonActionType: 'enter'
      }
    ];

    if (!this.isBrowser()) {
      return defaultChallenges;
    }

    try {
      const stored = localStorage.getItem(this.STORAGE_KEYS.CHALLENGES);
      if (!stored) {
        localStorage.setItem(this.STORAGE_KEYS.CHALLENGES, JSON.stringify(defaultChallenges));
        return defaultChallenges;
      }
      return JSON.parse(stored);
    } catch {
      return defaultChallenges;
    }
  }

  progressChallenge(id: number): { challenges: StoredChallengeItem[]; item: StoredChallengeItem | null; justCompleted: boolean } {
    const challenges = this.getChallengesState();
    const item = challenges.find(c => c.id === id);
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
      }

      if (this.isBrowser()) {
        localStorage.setItem(this.STORAGE_KEYS.CHALLENGES, JSON.stringify(challenges));
      }
    }

    return { challenges, item: item || null, justCompleted };
  }

  claimChallenge(id: number, xpReward: number): { challenges: StoredChallengeItem[]; item: StoredChallengeItem | null; leveledUp: boolean } {
    const challenges = this.getChallengesState();
    const item = challenges.find(c => c.id === id);
    let leveledUp = false;

    if (item && !item.isClaimed) {
      item.isClaimed = true;
      item.canClaim = false;
      item.buttonLabel = '¡Reclamado!';
      item.buttonActionType = 'claimed';

      const res = this.addXp(xpReward);
      leveledUp = res.leveledUp;

      // Si se reclama el desafío épico #4 o #2, desbloquear insignias
      if (id === 4) {
        this.unlockBadge('furia-en-el-matraz');
      } else if (id === 2) {
        this.unlockBadge('senor-enlaces');
      }

      if (this.isBrowser()) {
        localStorage.setItem(this.STORAGE_KEYS.CHALLENGES, JSON.stringify(challenges));
      }
    }

    return { challenges, item: item || null, leveledUp };
  }

  // --------------------------------------------------------
  // 5. Insignias Desbloqueadas (Trofeos)
  // --------------------------------------------------------
  getUnlockedBadges(): string[] {
    const defaultUnlocked = [
      'senor-enlaces',
      'maestro-redox',
      'alquimista-covalente',
      'detective-organico',
      'furia-en-el-matraz',
      'cazador-electrones',
      'equilibrio-acido'
    ];

    if (!this.isBrowser()) {
      return defaultUnlocked;
    }

    try {
      const stored = localStorage.getItem(this.STORAGE_KEYS.BADGES);
      if (!stored) {
        localStorage.setItem(this.STORAGE_KEYS.BADGES, JSON.stringify(defaultUnlocked));
        return defaultUnlocked;
      }
      return JSON.parse(stored);
    } catch {
      return defaultUnlocked;
    }
  }

  unlockBadge(badgeId: string): boolean {
    if (!this.isBrowser()) return false;
    const badges = this.getUnlockedBadges();
    if (!badges.includes(badgeId)) {
      badges.push(badgeId);
      localStorage.setItem(this.STORAGE_KEYS.BADGES, JSON.stringify(badges));
      return true;
    }
    return false;
  }
}


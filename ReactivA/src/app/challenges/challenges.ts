import { Component, OnInit, OnDestroy, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Estructura de un Desafío / Misión Activa
 */
export interface ChallengeCard {
  id: number;
  title: string;
  category: string;
  tag: string;
  tagType: 'daily' | 'weekly' | 'epic';
  xpReward: number;
  currentProgress: number;
  totalProgress: number;
  unit: string;
  progressPercent: number;
  isClaimed: boolean;
  buttonLabel: string;
  buttonActionType: 'claimed' | 'continue' | 'view' | 'enter';
  icon: string;
  badgeReward?: string;
  competencyTrack: string;
  pedagogicEfficiency: number;
}

/**
 * Entrada en la tabla de clasificación escolar
 */
export interface LeaderboardEntry {
  rank: number;
  name: string;
  avatarText: string;
  avatarColor: string;
  level: number;
  xp: number;
  isLeader?: boolean;
  isCurrentUser?: boolean;
  streakDays: number;
  schoolGrade: string;
}

/**
 * Insignia / Trofeo en la Vitrina de Logros
 */
export interface TrophyBadge {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedDate?: string;
  rarity: 'Común' | 'Raro' | 'Épico' | 'Legendario';
  category: string;
}

/**
 * Métrica de Competencia Pedagógica Curricular (Grados 10°-11°)
 */
export interface CurricularCompetencyMetric {
  name: string;
  standard: string;
  efficiencyScore: number;
  targetScore: number;
  evaluatedProblems: number;
  status: 'Sobresaliente' | 'Avanzado' | 'En Progreso';
}

@Component({
  selector: 'app-challenges',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './challenges.html',
  styleUrl: './challenges.scss'
})
export class ChallengesComponent implements OnInit, OnDestroy {
  private cdr = inject(ChangeDetectorRef);

  // --------------------------------------------------------
  // Datos del Encabezado y Progreso del Usuario
  // --------------------------------------------------------
  readonly seasonTag = 'Temporada 3: Enlaces Iónicos';
  readonly isLiveSeason = true;
  readonly seasonEndsInDays = 14;

  readonly userLevel = 14;
  readonly userTitle = 'Alquimista Experto';
  readonly userStreakDays = 5;
  readonly currentXP = 4850;
  readonly nextLevelXP = 5000;
  readonly xpProgressPercent = Math.round((4850 / 5000) * 100); // 97%

  // Widget de Torneo Activo
  readonly activeTournament = {
    title: 'Gran Enlace Covalente',
    timeLeftText: '14h',
    badge: 'Torneo Escolar',
    rankPosition: 12,
    totalCompetitors: 840,
    topReward: 'Cofre Cristalino + 1,200 XP'
  };

  // --------------------------------------------------------
  // Reloj de Actualización en Vivo (08:42:15)
  // --------------------------------------------------------
  refreshCountdown = '08:42:15';
  private countdownSeconds = 8 * 3600 + 42 * 60 + 15;
  private timerInterval?: ReturnType<typeof setInterval>;

  // --------------------------------------------------------
  // Misiones y Desafíos Activos (Grid de 4 Tarjetas)
  // --------------------------------------------------------
  activeChallenges: ChallengeCard[] = [
    {
      id: 1,
      title: 'Balanceo Relámpago',
      category: 'Óxido-Reducción / Balanceo',
      tag: 'Diario (+50 XP)',
      tagType: 'daily',
      xpReward: 50,
      currentProgress: 3,
      totalProgress: 3,
      unit: 'ecuaciones',
      progressPercent: 100,
      isClaimed: true,
      buttonLabel: '¡Reclamado!',
      buttonActionType: 'claimed',
      icon: 'ph-arrows-left-right',
      competencyTrack: 'Conservación de masa y números de oxidación',
      pedagogicEfficiency: 96
    },
    {
      id: 2,
      title: 'Caza en la Tabla Periódica',
      category: 'Tabla Periódica & Grupos',
      tag: 'Diario (+40 XP)',
      tagType: 'daily',
      xpReward: 40,
      currentProgress: 1,
      totalProgress: 2,
      unit: 'elementos',
      progressPercent: 50,
      isClaimed: false,
      buttonLabel: 'Continuar (+40 XP)',
      buttonActionType: 'continue',
      icon: 'ph-table',
      competencyTrack: 'Propiedades periódicas y electronegatividad',
      pedagogicEfficiency: 88
    },
    {
      id: 3,
      title: 'Síntesis de Orgánicos',
      category: 'Química Orgánica',
      tag: 'Semanal (+200 XP)',
      tagType: 'weekly',
      xpReward: 200,
      currentProgress: 3,
      totalProgress: 5,
      unit: 'sintetizados',
      progressPercent: 60,
      isClaimed: false,
      buttonLabel: 'Ver Síntesis',
      buttonActionType: 'view',
      icon: 'ph-tree-structure',
      badgeReward: 'Premio: Carbono Alótropo...',
      competencyTrack: 'Hibridación del carbono y enlaces sigma/pi',
      pedagogicEfficiency: 92
    },
    {
      id: 4,
      title: 'Laboratorio Sin Errores',
      category: 'Práctica de Laboratorio Virtual',
      tag: 'Misión Épica (+500 XP)',
      tagType: 'epic',
      xpReward: 500,
      currentProgress: 4,
      totalProgress: 5,
      unit: 'seguidos',
      progressPercent: 80,
      isClaimed: false,
      buttonLabel: 'Entrar al Matraz',
      buttonActionType: 'enter',
      icon: 'ph-flask',
      badgeReward: 'Racha 4 de 5 seguidos (80%)',
      competencyTrack: 'Manejo riguroso de reactivos y estequiometría',
      pedagogicEfficiency: 95
    }
  ];

  // --------------------------------------------------------
  // Tabla de Clasificación Escolar (Leaderboard)
  // --------------------------------------------------------
  activeLeaderboardTab: 'class' | 'school' | 'national' = 'class';

  classLeaderboard: LeaderboardEntry[] = [
    {
      rank: 1,
      name: 'Mateo R.',
      avatarText: 'MR',
      avatarColor: 'from-amber-400 to-yellow-600',
      level: 16,
      xp: 5420,
      isLeader: true,
      streakDays: 8,
      schoolGrade: '10° B'
    },
    {
      rank: 2,
      name: 'Sofía M.',
      avatarText: 'SM',
      avatarColor: 'from-sky-400 to-blue-600',
      level: 15,
      xp: 5180,
      streakDays: 6,
      schoolGrade: '10° B'
    },
    {
      rank: 3,
      name: 'Tú (Científico)',
      avatarText: 'TU',
      avatarColor: 'from-emerald-400 to-teal-600',
      level: 14,
      xp: 4850,
      isCurrentUser: true,
      streakDays: 5,
      schoolGrade: '10° B'
    },
    {
      rank: 4,
      name: 'Camilo P.',
      avatarText: 'CP',
      avatarColor: 'from-purple-400 to-indigo-600',
      level: 13,
      xp: 4610,
      streakDays: 4,
      schoolGrade: '10° B'
    },
    {
      rank: 5,
      name: 'Valentina G.',
      avatarText: 'VG',
      avatarColor: 'from-pink-400 to-rose-600',
      level: 13,
      xp: 4490,
      streakDays: 3,
      schoolGrade: '10° B'
    }
  ];

  schoolLeaderboard: LeaderboardEntry[] = [
    { rank: 1, name: 'Lucas H.', avatarText: 'LH', avatarColor: 'from-amber-400 to-yellow-600', level: 18, xp: 6240, isLeader: true, streakDays: 14, schoolGrade: '11° A' },
    { rank: 2, name: 'Daniela V.', avatarText: 'DV', avatarColor: 'from-sky-400 to-blue-600', level: 17, xp: 5890, streakDays: 11, schoolGrade: '11° B' },
    { rank: 3, name: 'Mateo R.', avatarText: 'MR', avatarColor: 'from-amber-400 to-yellow-600', level: 16, xp: 5420, streakDays: 8, schoolGrade: '10° B' },
    { rank: 7, name: 'Tú (Científico)', avatarText: 'TU', avatarColor: 'from-emerald-400 to-teal-600', level: 14, xp: 4850, isCurrentUser: true, streakDays: 5, schoolGrade: '10° B' }
  ];

  nationalLeaderboard: LeaderboardEntry[] = [
    { rank: 1, name: 'Alejandro B. (Cali)', avatarText: 'AB', avatarColor: 'from-amber-400 to-yellow-600', level: 25, xp: 9800, isLeader: true, streakDays: 32, schoolGrade: '11° Nal' },
    { rank: 2, name: 'Mariana C. (Medellín)', avatarText: 'MC', avatarColor: 'from-sky-400 to-blue-600', level: 24, xp: 9410, streakDays: 28, schoolGrade: '11° Nal' },
    { rank: 3, name: 'Gabriel T. (Bogotá)', avatarText: 'GT', avatarColor: 'from-indigo-400 to-purple-600', level: 23, xp: 9120, streakDays: 25, schoolGrade: '10° Nal' },
    { rank: 48, name: 'Tú (Científico)', avatarText: 'TU', avatarColor: 'from-emerald-400 to-teal-600', level: 14, xp: 4850, isCurrentUser: true, streakDays: 5, schoolGrade: '10° B' }
  ];

  // --------------------------------------------------------
  // Vitrina de Trofeos & Insignias
  // --------------------------------------------------------
  readonly collectorLevel = 'Nivel Coleccionista II';
  readonly unlockedBadgesCount = 7;
  readonly totalBadgesCount = 18;
  readonly badgesProgressPercent = Math.round((7 / 18) * 100); // 39%

  trophyBadges: TrophyBadge[] = [
    {
      id: 'senor-enlaces',
      name: 'Señor de los Enlaces',
      description: 'Deduce 50 enlaces covalentes e iónicos con diferencia de electronegatividad sin errores.',
      icon: 'ph-atom',
      unlocked: true,
      unlockedDate: 'Hace 2 días',
      rarity: 'Épico',
      category: 'Enlaces Químicos'
    },
    {
      id: 'maestro-redox',
      name: 'Maestro Redox',
      description: 'Completa 20 ecuaciones de oxidación-reducción asignando números de valencia exactos.',
      icon: 'ph-lightning',
      unlocked: true,
      unlockedDate: 'Ayer',
      rarity: 'Raro',
      category: 'Reacciones'
    },
    {
      id: 'alquimista-covalente',
      name: 'Alquimista Covalente',
      description: 'Construye 15 estructuras de Lewis estables en el simulador molecular 3D.',
      icon: 'ph-circles-three-plus',
      unlocked: true,
      unlockedDate: 'Hace 4 días',
      rarity: 'Raro',
      category: 'Modelos'
    },
    {
      id: 'detective-organico',
      name: 'Detective Orgánico',
      description: 'Identifica 10 grupos funcionales y cadenas carbonadas de hidrocarburos.',
      icon: 'ph-tree-structure',
      unlocked: true,
      unlockedDate: 'Hace 6 días',
      rarity: 'Común',
      category: 'Orgánica'
    },
    {
      id: 'furia-en-el-matraz',
      name: 'Furia en el Matraz',
      description: 'Mantén una racha de 5 días realizando prácticas de laboratorio virtual consecutivas.',
      icon: 'ph-fire',
      unlocked: true,
      unlockedDate: 'Hoy',
      rarity: 'Épico',
      category: 'Constancia'
    },
    {
      id: 'cazador-electrones',
      name: 'Cazador de Electrones',
      description: 'Configura 30 átomos según el principio de Aufbau y regla de Hund sin equivocaciones.',
      icon: 'ph-sparkle',
      unlocked: true,
      unlockedDate: 'Hace 1 semana',
      rarity: 'Común',
      category: 'Estructura Atómica'
    },
    {
      id: 'equilibrio-acido',
      name: 'Equilibrio Ácido',
      description: 'Calcula pH y neutralizaciones de soluciones acuosas en tiempo récord.',
      icon: 'ph-drop',
      unlocked: true,
      unlockedDate: 'Hace 1 semana',
      rarity: 'Raro',
      category: 'Soluciones'
    },
    {
      id: 'mente-cuantica',
      name: 'Mente Cuántica',
      description: 'Completa todos los desafíos de números cuánticos y espín electrónico.',
      icon: 'ph-lock',
      unlocked: false,
      rarity: 'Legendario',
      category: 'Cuántica'
    },
    {
      id: 'estequiometria-oro',
      name: 'Estequiometría Perfecta',
      description: 'Resuelve 25 problemas de reactivo límite y rendimiento de reacción al 100% de precisión.',
      icon: 'ph-lock',
      unlocked: false,
      rarity: 'Legendario',
      category: 'Cálculos Químicos'
    }
  ];

  selectedBadge: TrophyBadge | null = null;

  // --------------------------------------------------------
  // Métricas de Seguimiento Académico y Evaluación Curricular
  // --------------------------------------------------------
  readonly globalPedagogicEfficiency = 94.2; // Tasa de acierto y resolución
  readonly keyConceptsMastery = 88.5; // Dominio de conceptos fundamentales
  readonly curricularCompetencyScore = 91.0; // Cumplimiento del plan curricular nacional

  curricularMetrics: CurricularCompetencyMetric[] = [
    {
      name: 'Uso Comprensivo del Conocimiento Científico',
      standard: 'Comprende cómo los enlaces atómicos explican las propiedades macroscópicas.',
      efficiencyScore: 94,
      targetScore: 85,
      evaluatedProblems: 48,
      status: 'Sobresaliente'
    },
    {
      name: 'Explicación de Fenómenos Químicos',
      standard: 'Aplica leyes de conservación de masa y balanceo de reacciones redox.',
      efficiencyScore: 89,
      targetScore: 80,
      evaluatedProblems: 36,
      status: 'Sobresaliente'
    },
    {
      name: 'Indagación y Experimentación Científica',
      standard: 'Modela hipótesis, controla variables y opera instrumental en simulaciones 3D.',
      efficiencyScore: 92,
      targetScore: 85,
      evaluatedProblems: 28,
      status: 'Sobresaliente'
    }
  ];

  // --------------------------------------------------------
  // Mensaje de Notificación Flotante (Toast)
  // --------------------------------------------------------
  toastNotification: { message: string; visible: boolean; type: 'success' | 'info' } = {
    message: '',
    visible: false,
    type: 'success'
  };
  private toastTimeout?: ReturnType<typeof setTimeout>;

  ngOnInit(): void {
    this.startCountdownTimer();
  }

  ngOnDestroy(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
    if (this.toastTimeout) {
      clearTimeout(this.toastTimeout);
    }
  }

  /**
   * Cronómetro en tiempo real para la actualización de misiones
   */
  private startCountdownTimer(): void {
    this.timerInterval = setInterval(() => {
      if (this.countdownSeconds > 0) {
        this.countdownSeconds--;
        const hours = Math.floor(this.countdownSeconds / 3600);
        const minutes = Math.floor((this.countdownSeconds % 3600) / 60);
        const seconds = this.countdownSeconds % 60;
        this.refreshCountdown = `${this.padZero(hours)}:${this.padZero(minutes)}:${this.padZero(seconds)}`;
        this.cdr.markForCheck();
      }
    }, 1000);
  }

  private padZero(num: number): string {
    return num < 10 ? `0${num}` : `${num}`;
  }

  /**
   * Cambia de tab en el Leaderboard
   */
  setLeaderboardTab(tab: 'class' | 'school' | 'national'): void {
    this.activeLeaderboardTab = tab;
    this.cdr.markForCheck();
  }

  /**
   * Obtiene la lista activa del Leaderboard según la pestaña
   */
  get currentLeaderboard(): LeaderboardEntry[] {
    switch (this.activeLeaderboardTab) {
      case 'school':
        return this.schoolLeaderboard;
      case 'national':
        return this.nationalLeaderboard;
      case 'class':
      default:
        return this.classLeaderboard;
    }
  }

  /**
   * Acción al interactuar con una tarjeta de desafío
   */
  onChallengeAction(challenge: ChallengeCard): void {
    if (challenge.isClaimed) {
      this.showToast('Esta recompensa ya fue acreditada a tu cuenta de estudiante.', 'info');
      return;
    }

    if (challenge.buttonActionType === 'continue') {
      this.showToast(`Iniciando sesión práctica: "${challenge.title}" (+${challenge.xpReward} XP)...`, 'success');
    } else if (challenge.buttonActionType === 'view') {
      this.showToast(`Abriendo módulo de síntesis: "${challenge.title}"...`, 'info');
    } else if (challenge.buttonActionType === 'enter') {
      this.showToast(`Preparando mesa de laboratorio virtual para el desafío épico...`, 'success');
    }
  }

  /**
   * Muestra el modal con el detalle pedagógico de una insignia
   */
  openBadgeModal(badge: TrophyBadge): void {
    this.selectedBadge = badge;
    this.cdr.markForCheck();
  }

  /**
   * Cierra el modal de insignia
   */
  closeBadgeModal(): void {
    this.selectedBadge = null;
    this.cdr.markForCheck();
  }

  /**
   * Despliega notificación toast visual temporal
   */
  private showToast(message: string, type: 'success' | 'info' = 'success'): void {
    if (this.toastTimeout) {
      clearTimeout(this.toastTimeout);
    }
    this.toastNotification = { message, visible: true, type };
    this.cdr.markForCheck();

    this.toastTimeout = setTimeout(() => {
      this.toastNotification.visible = false;
      this.cdr.markForCheck();
    }, 3500);
  }
}


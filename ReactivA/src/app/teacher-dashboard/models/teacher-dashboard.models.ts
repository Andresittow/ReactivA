// ============================================================
// MODELOS E INTERFACES – Dashboard del Profesor (ReactivA)
// Enfoque: Seguimiento, Supervisión y Análisis del Aprendizaje
// ============================================================

export interface TeacherProfile {
  name: string;
  title: string;
  institution: string;
  department: string;
  academicCycle: string;
  avatarUrl: string;
}

export interface AcademicOverviewKPIs {
  totalStudents: number;
  activeStudents: number;
  completedTasksStudents: number;
  pendingTasksStudents: number;
  averageProgressPercent: number;
  engagementLevel: 'Alto' | 'Medio' | 'En Riesgo';
}

export interface RecentLearningEvent {
  id: string;
  studentName: string;
  actionText: string;
  section?: 'Periodic Table' | 'Virtual Lab' | 'Organic Mission' | 'Challenges';
  moduleName?: string;
  sectionColor?: string;
  highlightText: string;
  timeAgo: string;
  icon: string;
  type: 'success' | 'progress' | 'streak' | 'start' | 'warning';
}

export interface ModuleSectionProgress {
  title: string;
  subtitle: string;
  icon: string;
  colorTheme: 'blue' | 'teal' | 'purple' | 'amber';
  studentsActiveCount: number;
  totalActivitiesCompleted: number;
  averageMasteryScore: number;
  keyMetricLabel: string;
  keyMetricValue: string;
  statusBadge: string;
}

export interface StudentLearningDetail {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
  grade: string;
  rank: string;
  overallProgress: number;
  lastActiveFormatted: string;
  
  // Continuidad y Rachas
  currentStreakDays: number;
  bestStreakDays: number;
  weeklyActiveDaysCount: number;
  activityContinuityStatus: 'Excelente' | 'Constante' | 'Intermitente' | 'En Riesgo';
  activityCalendar: { day: string; date: string; active: boolean; completedCount: number }[];
  
  // Cumplimiento
  completedTasksCount: number;
  inProgressTasksCount: number;
  pendingTasksCount: number;
  compliancePercentage: number;
  
  // Desglose por las 4 Secciones Educativas
  periodicTable: {
    visited: boolean;
    elementsInspectedCount: number;
    memoryPairsPlayed: number;
    progressPercent: number;
    lastAccessed: string;
  };
  virtualLab: {
    experimentsStarted: number;
    experimentsCompleted: number;
    conductedPracticeTitle: string;
    scoreObtained: number; // sobre 5.0 o 10
    progressPercent: number;
    lastAccessed: string;
  };
  organicMission: {
    levelsCompleted: number;
    totalLevels: number;
    totalPoints: number;
    livesRemaining: number;
    badgesUnlockedCount: number;
    progressPercent: number;
    lastAccessed: string;
  };
  challenges: {
    challengesCompleted: number;
    totalChallenges: number;
    claimedXP: number;
    currentRankPosition: number;
    trophiesCount: number;
    progressPercent: number;
    lastAccessed: string;
  };

  // Historial cronológico de actividades del estudiante
  activityHistory: {
    date: string;
    section: 'Periodic Table' | 'Virtual Lab' | 'Organic Mission' | 'Challenges';
    description: string;
    resultBadge: string;
    resultClass: 'badge-success' | 'badge-info' | 'badge-warning';
  }[];
}

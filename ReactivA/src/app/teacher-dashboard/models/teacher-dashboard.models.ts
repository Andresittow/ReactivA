// ============================================================
// MODELOS E INTERFACES – Dashboard del Profesor (ReactivA)
// ============================================================

export interface TeacherProfile {
  name: string;
  title: string;
  institution: string;
  department: string;
  academicCycle: string;
  avatarUrl: string;
}

export interface TeacherKpi {
  activeStudents: number;
  activeStudentsDelta: string;
  activeStudentsDetail: string;
  completedPractices: number;
  completedPracticesDetail: string;
  labAverageAccuracy: number;
  labAccuracyDelta: string;
  supportAlertsCount: number;
  supportAlertsTopic: string;
}

export interface LiveSessionPhase {
  name: string;
  percent: number;
}

export interface LiveSessionState {
  groupCode: string;
  title: string;
  status: 'EN CURSO' | 'PAUSADA' | 'FINALIZADA';
  connectedStudents: number;
  totalStudents: number;
  description: string;
  elapsedMinutes: number;
  totalMinutes: number;
  progressPercent: number;
  phases: LiveSessionPhase[];
}

export interface LiveActivityFeedItem {
  id: string;
  studentName: string;
  actionText: string;
  highlightText: string;
  moduleName: string;
  timeAgo: string;
  type: 'success' | 'ai' | 'warning' | 'info';
  icon: string;
}

export interface StudentInGroup {
  id: string;
  name: string;
  status: 'Completado' | 'En progreso' | 'Sin iniciar' | 'Requiere apoyo';
  grade: number;
  practiceTitle: string;
  lastActive: string;
}

export interface AcademicGroupPerformance {
  id: string;
  code: string; // ej. "11A", "10B", "9C", "8A"
  codeColorClass: string; // "badge-blue", "badge-purple", "badge-orange", "badge-indigo"
  gradeName: string; // ej. "11° Grado A"
  subjectModule: string; // ej. "Química Orgánica"
  studentsCount: number;
  currentPractice: string;
  statusBadge: string; // "Excelente", "En curso", "Requiere atención", "Buen ritmo"
  statusBadgeClass: 'badge-success' | 'badge-info' | 'badge-warning' | 'badge-teal';
  progressPercent: number;
  averageGrade: number; // sobre 10
  students: StudentInGroup[];
}

export interface SupportStudentAlert {
  id: string;
  initials: string;
  name: string;
  gradeGroup: string;
  issueBadge: string;
  issueBadgeClass: 'badge-danger' | 'badge-warning' | 'badge-muted';
  description: string;
  actionButtonLabel: string;
  actionType: 'guide' | 'minireto' | 'notify';
  status: 'pending' | 'resolved';
}

export interface SimulatorPreviewCard {
  id: string;
  title: string;
  badgeText: string;
  badgeClass: 'badge-cyan' | 'badge-green';
  formulaTag: string;
  description: string;
  thumbnailType: 'molecule-3d' | 'burette-titration';
  routeLink?: string;
}

export interface QuickPinConfig {
  interactiveModule: string;
  assignedGroup: string;
  allowAtomTutorHints: boolean;
  timeLimit30Min: boolean;
  examModeStrict: boolean;
}


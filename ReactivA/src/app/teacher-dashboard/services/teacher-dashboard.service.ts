// ============================================================
// SERVICIO DE GESTIÓN Y SEGUIMIENTO DOCENTE – TeacherDashboardService
// Conecta el Dashboard del Profesor con los datos del Estudiante
// ============================================================

import { Injectable, inject } from '@angular/core';
import { StudentProgressService } from '../../dashboard/student-progress.service';
import {
  TeacherProfile,
  AcademicOverviewKPIs,
  RecentLearningEvent,
  ModuleSectionProgress,
  StudentLearningDetail
} from '../models/teacher-dashboard.models';

const STORAGE_ACTIVE_PIN_KEY = 'reactiva_active_class_pin';
const STORAGE_TEACHER_LIVE_EVENTS_KEY = 'reactiva_teacher_live_events';
const STORAGE_STUDENT_GUIDANCE_KEY = 'reactiva_teacher_student_guidance';

@Injectable({
  providedIn: 'root'
})
export class TeacherDashboardService {
  private studentProgressService = inject(StudentProgressService);

  private isBrowser(): boolean {
    return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
  }

  // -------------------------------------------------------------
  // 1. Perfil del Docente
  // -------------------------------------------------------------
  getTeacherProfile(): TeacherProfile {
    return {
      name: 'Prof. Dr. Roberto Méndez',
      title: 'Jefe de Cátedra y Laboratorio',
      institution: 'Colegio San Ignacio',
      department: 'Dpto. Ciencias Naturales & Química',
      academicCycle: 'Ciclo Académico 2024 - Semestre 2',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80'
    };
  }

  // -------------------------------------------------------------
  // 2. PIN Activo de Clase
  // -------------------------------------------------------------
  getActivePin(): string {
    if (!this.isBrowser()) return 'CHEM-8420';
    const stored = localStorage.getItem(STORAGE_ACTIVE_PIN_KEY);
    return stored || 'CHEM-8420';
  }

  generateNewPin(): string {
    const letters = ['CHEM', 'LAB', 'ATOM', 'REACT', 'MOL'];
    const prefix = letters[Math.floor(Math.random() * letters.length)];
    const num = Math.floor(1000 + Math.random() * 9000);
    const newPin = `${prefix}-${num}`;

    if (this.isBrowser()) {
      localStorage.setItem(STORAGE_ACTIVE_PIN_KEY, newPin);
    }
    return newPin;
  }

  // -------------------------------------------------------------
  // 3. Indicadores de la Vista General (KPIs Reales)
  // -------------------------------------------------------------
  getAcademicOverviewKPIs(): AcademicOverviewKPIs {
    const studentTasks = this.studentProgressService.getDashboardTasks();
    const completedTasksCount = studentTasks.filter(t => t.completed).length;
    const hasCompletedTasks = completedTasksCount > 0;

    return {
      totalStudents: 32,
      activeStudents: 29,
      completedTasksStudents: hasCompletedTasks ? 24 : 22,
      pendingTasksStudents: hasCompletedTasks ? 8 : 10,
      averageProgressPercent: 82,
      engagementLevel: 'Alto'
    };
  }

  // -------------------------------------------------------------
  // 4. Registro de Actividad Reciente del Estudiantado
  // -------------------------------------------------------------
  recordLiveEvent(event: Omit<RecentLearningEvent, 'id' | 'timeAgo'>): void {
    if (!this.isBrowser()) return;
    const events = this.getRecordedLiveEvents();
    const newEvent: RecentLearningEvent = {
      ...event,
      id: `ev-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timeAgo: 'hace unos momentos'
    };
    events.unshift(newEvent);
    try {
      localStorage.setItem(STORAGE_TEACHER_LIVE_EVENTS_KEY, JSON.stringify(events.slice(0, 20)));
    } catch {}
  }

  getRecordedLiveEvents(): RecentLearningEvent[] {
    if (!this.isBrowser()) return [];
    try {
      const stored = localStorage.getItem(STORAGE_TEACHER_LIVE_EVENTS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  getRecentLearningActivities(): RecentLearningEvent[] {
    const profile = this.studentProgressService.getProfile();
    const studentName = profile.name || 'Valeria Góngora';

    const baseEvents: RecentLearningEvent[] = [
      {
        id: 'rec-1',
        studentName,
        actionText: 'ingresó y exploró el modelo atómico de Bohr en Hierro (Fe)',
        section: 'Periodic Table',
        sectionColor: '#0284c7',
        highlightText: 'Exploración de configuración electrónica fundamental [Ar] 3d⁶ 4s²',
        timeAgo: 'hace 4 min',
        icon: 'ph ph-table',
        type: 'progress'
      },
      {
        id: 'rec-2',
        studentName: 'Mateo R.',
        actionText: 'completó el desafío semanal "Síntesis de Orgánicos"',
        section: 'Challenges',
        sectionColor: '#f59e0b',
        highlightText: 'Reclamó +200 XP • Posición #1 en Clasificación del Salón',
        timeAgo: 'hace 12 min',
        icon: 'ph ph-trophy',
        type: 'success'
      },
      {
        id: 'rec-3',
        studentName: 'Valentina Restrepo',
        actionText: 'completó titulación ácido-base con fenolftaleína en bureta',
        section: 'Virtual Lab',
        sectionColor: '#10b981',
        highlightText: 'Curva de neutralización a pH 7.0 exacta • Calificación 5.0/5.0',
        timeAgo: 'hace 25 min',
        icon: 'ph ph-test-tube',
        type: 'success'
      },
      {
        id: 'rec-4',
        studentName,
        actionText: 'mantuvo su continuidad de estudio activa',
        section: 'Challenges',
        sectionColor: '#f97316',
        highlightText: 'Racha activa: 5 días consecutivos de estudio',
        timeAgo: 'hace 1 hora',
        icon: 'ph ph-fire',
        type: 'streak'
      },
      {
        id: 'rec-5',
        studentName: 'Diego Navarro',
        actionText: 'inició práctica de isomería cis-trans',
        section: 'Organic Mission',
        sectionColor: '#8b5cf6',
        highlightText: 'Nivel 1: Detectives del Carbono en curso',
        timeAgo: 'hace 2 horas',
        icon: 'ph ph-tree-structure',
        type: 'start'
      }
    ];

    // Anteponer eventos en vivo grabados
    const liveRecorded = this.getRecordedLiveEvents();
    if (liveRecorded.length > 0) {
      baseEvents.unshift(...liveRecorded);
    }

    return baseEvents;
  }

  // -------------------------------------------------------------
  // 5. Supervisión de las Cuatro Secciones Educativas
  // -------------------------------------------------------------
  getSectionsOverview(): ModuleSectionProgress[] {
    let organicLevelsDone = 0;
    let organicScore = 0;
    if (this.isBrowser()) {
      try {
        const savedOrganic = localStorage.getItem('reactiva_mision_organica_progress');
        if (savedOrganic) {
          const parsed = JSON.parse(savedOrganic);
          organicLevelsDone = parsed.levels?.filter((l: any) => l.completed)?.length || 0;
          organicScore = parsed.totalScore || 0;
        }
      } catch {}
    }

    let inspectedElementsCount = 8;
    if (this.isBrowser()) {
      try {
        const storedElements = localStorage.getItem('reactiva_inspected_elements');
        if (storedElements) {
          inspectedElementsCount = Math.max(inspectedElementsCount, JSON.parse(storedElements).length);
        }
      } catch {}
    }

    return [
      {
        title: 'Periodic Table',
        subtitle: 'Modelos atómicos y propiedades periódicas',
        icon: 'ph ph-table',
        colorTheme: 'blue',
        studentsActiveCount: 31,
        totalActivitiesCompleted: 118,
        averageMasteryScore: 9.4,
        keyMetricLabel: 'Elementos consultados',
        keyMetricValue: `${inspectedElementsCount} elementos / 118`,
        statusBadge: 'Muy Activo'
      },
      {
        title: 'Virtual Lab',
        subtitle: 'Simulador 3D, bureta y balanceo estequiométrico',
        icon: 'ph ph-test-tube',
        colorTheme: 'teal',
        studentsActiveCount: 28,
        totalActivitiesCompleted: 86,
        averageMasteryScore: 8.9,
        keyMetricLabel: 'Experimentos finalizados',
        keyMetricValue: '86 sesiones concluidas',
        statusBadge: 'En Progreso'
      },
      {
        title: 'Organic Mission',
        subtitle: 'Misión interactiva: domina el carbono y grupos funcionales',
        icon: 'ph ph-tree-structure',
        colorTheme: 'purple',
        studentsActiveCount: 29,
        totalActivitiesCompleted: organicLevelsDone > 0 ? (24 + organicLevelsDone) : 25,
        averageMasteryScore: organicScore > 0 ? +(8.5 + (organicScore / 100)).toFixed(1) : 9.1,
        keyMetricLabel: 'Misiones completadas',
        keyMetricValue: `${Math.min(4, Math.max(1, organicLevelsDone))} de 4 niveles aprobados`,
        statusBadge: 'Excelente'
      },
      {
        title: 'Challenges',
        subtitle: 'Arena de logros, misiones semanales y clasificaciones',
        icon: 'ph ph-trophy',
        colorTheme: 'amber',
        studentsActiveCount: 32,
        totalActivitiesCompleted: 94,
        averageMasteryScore: 9.2,
        keyMetricLabel: 'Desafíos acreditados',
        keyMetricValue: '94 retos reclamados',
        statusBadge: 'Alta Participación'
      }
    ];
  }

  // -------------------------------------------------------------
  // 6. Listado y Seguimiento Individual de Estudiantes
  // -------------------------------------------------------------
  getStudentsList(): StudentLearningDetail[] {
    const studentProfile = this.studentProgressService.getProfile();
    const gamification = this.studentProgressService.getGamificationState();
    const dashboardTasks = this.studentProgressService.getDashboardTasks();

    // Obtener datos reales de Misión Orgánica del estudiante activo
    let organicLevelsDone = 0;
    let organicScore = 0;
    let organicBadgesCount = 0;
    let organicLives = 5;
    if (this.isBrowser()) {
      try {
        const savedOrganic = localStorage.getItem('reactiva_mision_organica_progress');
        if (savedOrganic) {
          const parsed = JSON.parse(savedOrganic);
          organicLevelsDone = parsed.levels?.filter((l: any) => l.completed)?.length || 0;
          organicScore = parsed.totalScore || 0;
          organicBadgesCount = parsed.badges?.filter((b: any) => b.unlocked)?.length || 0;
          const activeLp = parsed.levels?.find((l: any) => l.levelId === (parsed.currentLevel || 1));
          if (activeLp) organicLives = activeLp.lives;
        }
      } catch {}
    }

    // Elementos explorados en la Tabla Periódica
    let inspectedElements = 12;
    if (this.isBrowser()) {
      try {
        const stored = localStorage.getItem('reactiva_inspected_elements');
        if (stored) inspectedElements = JSON.parse(stored).length;
      } catch {}
    }

    const currentUserName = studentProfile.name || 'Valeria Góngora';
    const completedTasksCount = dashboardTasks.filter(t => t.completed).length;

    const mainActiveStudent: StudentLearningDetail = {
      id: 'st-valeria',
      name: currentUserName,
      email: studentProfile.email || 'valeria.gongora@reactiva.edu.co',
      avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80',
      grade: studentProfile.grade || '10° Grado A',
      rank: gamification.levelTitle || 'Alquimista Experto',
      overallProgress: 88,
      lastActiveFormatted: 'Hoy, 10:45 AM',

      currentStreakDays: gamification.streakDays || 5,
      bestStreakDays: 18,
      weeklyActiveDaysCount: 5,
      activityContinuityStatus: 'Excelente',
      activityCalendar: [
        { day: 'L', date: '6 Nov', active: true, completedCount: 2 },
        { day: 'M', date: '7 Nov', active: true, completedCount: 3 },
        { day: 'M', date: '8 Nov', active: true, completedCount: 1 },
        { day: 'J', date: '9 Nov', active: true, completedCount: 4 },
        { day: 'V', date: '10 Nov', active: true, completedCount: 2 },
        { day: 'S', date: '11 Nov', active: true, completedCount: completedTasksCount || 1 },
        { day: 'D', date: '12 Nov', active: false, completedCount: 0 }
      ],

      completedTasksCount: completedTasksCount || 2,
      inProgressTasksCount: 1,
      pendingTasksCount: Math.max(0, dashboardTasks.length - completedTasksCount),
      compliancePercentage: Math.round(((completedTasksCount || 2) / (dashboardTasks.length || 4)) * 100),

      periodicTable: {
        visited: true,
        elementsInspectedCount: inspectedElements,
        memoryPairsPlayed: 2,
        progressPercent: 95,
        lastAccessed: 'Hoy, 09:30 AM'
      },
      virtualLab: {
        experimentsStarted: 4,
        experimentsCompleted: 3,
        conductedPracticeTitle: 'Enlaces Iónicos vs Covalentes (Simulador 3D)',
        scoreObtained: 5.0,
        progressPercent: 92,
        lastAccessed: 'Ayer, 04:15 PM'
      },
      organicMission: {
        levelsCompleted: organicLevelsDone || 1,
        totalLevels: 4,
        totalPoints: organicScore || 80,
        livesRemaining: organicLives,
        badgesUnlockedCount: organicBadgesCount || 1,
        progressPercent: Math.max(25, Math.round(((organicLevelsDone || 1) / 4) * 100)),
        lastAccessed: 'Hoy, 10:20 AM'
      },
      challenges: {
        challengesCompleted: 3,
        totalChallenges: 4,
        claimedXP: gamification.xp || 4850,
        currentRankPosition: 3,
        trophiesCount: 7,
        progressPercent: 75,
        lastAccessed: 'Hoy, 08:45 AM'
      },

      activityHistory: [
        {
          date: 'Hoy, 10:20 AM',
          section: 'Organic Mission',
          description: `Desarrolló Nivel ${organicLevelsDone || 1}: Detectives del Carbono en Misión Orgánica`,
          resultBadge: `${organicScore || 80} Pts Ganados`,
          resultClass: 'badge-success'
        },
        {
          date: 'Hoy, 09:30 AM',
          section: 'Periodic Table',
          description: `Inspección de propiedades periódicas y modelo de Bohr de ${inspectedElements} elementos`,
          resultBadge: '95% Dominio',
          resultClass: 'badge-info'
        },
        {
          date: 'Ayer, 04:15 PM',
          section: 'Virtual Lab',
          description: 'Práctica 04: Enlaces Iónicos vs Covalentes en simulador molecular 3D',
          resultBadge: 'Nota: 5.0 / 5.0',
          resultClass: 'badge-success'
        },
        {
          date: 'Ayer, 11:00 AM',
          section: 'Challenges',
          description: 'Acreditó Misión Diaria: Balanceo Relámpago y sumó +50 XP a la arena',
          resultBadge: '+50 XP Reclamado',
          resultClass: 'badge-info'
        }
      ]
    };

    const peerStudents: StudentLearningDetail[] = [
      {
        id: 'st-mateo',
        name: 'Mateo Rodríguez',
        email: 'mateo.rodriguez@reactiva.edu.co',
        avatarUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=300&q=80',
        grade: '10° Grado A',
        rank: 'Líder de la Clase',
        overallProgress: 94,
        lastActiveFormatted: 'Hoy, 10:48 AM',
        currentStreakDays: 8,
        bestStreakDays: 14,
        weeklyActiveDaysCount: 6,
        activityContinuityStatus: 'Excelente',
        activityCalendar: [
          { day: 'L', date: '6 Nov', active: true, completedCount: 3 },
          { day: 'M', date: '7 Nov', active: true, completedCount: 4 },
          { day: 'M', date: '8 Nov', active: true, completedCount: 2 },
          { day: 'J', date: '9 Nov', active: true, completedCount: 3 },
          { day: 'V', date: '10 Nov', active: true, completedCount: 4 },
          { day: 'S', date: '11 Nov', active: true, completedCount: 2 },
          { day: 'D', date: '12 Nov', active: false, completedCount: 0 }
        ],
        completedTasksCount: 4,
        inProgressTasksCount: 0,
        pendingTasksCount: 0,
        compliancePercentage: 100,
        periodicTable: { visited: true, elementsInspectedCount: 42, memoryPairsPlayed: 5, progressPercent: 100, lastAccessed: 'Hoy, 09:10 AM' },
        virtualLab: { experimentsStarted: 5, experimentsCompleted: 5, conductedPracticeTitle: 'Titulación Ácido-Base & Bureta', scoreObtained: 4.9, progressPercent: 96, lastAccessed: 'Ayer, 03:30 PM' },
        organicMission: { levelsCompleted: 3, totalLevels: 4, totalPoints: 240, livesRemaining: 5, badgesUnlockedCount: 3, progressPercent: 75, lastAccessed: 'Hoy, 10:40 AM' },
        challenges: { challengesCompleted: 4, totalChallenges: 4, claimedXP: 5420, currentRankPosition: 1, trophiesCount: 9, progressPercent: 100, lastAccessed: 'Hoy, 10:48 AM' },
        activityHistory: [
          { date: 'Hoy, 10:48 AM', section: 'Challenges', description: 'Completó Síntesis de Orgánicos (+200 XP)', resultBadge: 'Líder #1', resultClass: 'badge-success' },
          { date: 'Hoy, 10:40 AM', section: 'Organic Mission', description: 'Superó Nivel 3: El Desafío IUPAC', resultBadge: '96% Acierto', resultClass: 'badge-success' }
        ]
      },
      {
        id: 'st-valentina',
        name: 'Valentina Restrepo',
        email: 'valentina.restrepo@reactiva.edu.co',
        avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=300&q=80',
        grade: '10° Grado A',
        rank: 'Maestra Molecular',
        overallProgress: 90,
        lastActiveFormatted: 'Hoy, 10:20 AM',
        currentStreakDays: 6,
        bestStreakDays: 12,
        weeklyActiveDaysCount: 5,
        activityContinuityStatus: 'Constante',
        activityCalendar: [
          { day: 'L', date: '6 Nov', active: true, completedCount: 2 },
          { day: 'M', date: '7 Nov', active: true, completedCount: 3 },
          { day: 'M', date: '8 Nov', active: true, completedCount: 2 },
          { day: 'J', date: '9 Nov', active: true, completedCount: 2 },
          { day: 'V', date: '10 Nov', active: true, completedCount: 3 },
          { day: 'S', date: '11 Nov', active: true, completedCount: 1 },
          { day: 'D', date: '12 Nov', active: false, completedCount: 0 }
        ],
        completedTasksCount: 3,
        inProgressTasksCount: 1,
        pendingTasksCount: 0,
        compliancePercentage: 88,
        periodicTable: { visited: true, elementsInspectedCount: 36, memoryPairsPlayed: 3, progressPercent: 92, lastAccessed: 'Hoy, 09:40 AM' },
        virtualLab: { experimentsStarted: 4, experimentsCompleted: 4, conductedPracticeTitle: 'Neutralización en Bureta Virtual', scoreObtained: 5.0, progressPercent: 95, lastAccessed: 'Hoy, 10:20 AM' },
        organicMission: { levelsCompleted: 2, totalLevels: 4, totalPoints: 170, livesRemaining: 4, badgesUnlockedCount: 2, progressPercent: 50, lastAccessed: 'Ayer, 04:30 PM' },
        challenges: { challengesCompleted: 3, totalChallenges: 4, claimedXP: 5180, currentRankPosition: 2, trophiesCount: 8, progressPercent: 85, lastAccessed: 'Hoy, 10:15 AM' },
        activityHistory: [
          { date: 'Hoy, 10:20 AM', section: 'Virtual Lab', description: 'Titulación de solución acuosa con fenolftaleína completada', resultBadge: 'Nota: 5.0 / 5.0', resultClass: 'badge-success' },
          { date: 'Hoy, 09:40 AM', section: 'Periodic Table', description: 'Completó sesión de pares periódicos de metales alcalinos', resultBadge: 'Completado', resultClass: 'badge-info' }
        ]
      },
      {
        id: 'st-diego',
        name: 'Diego Navarro',
        email: 'diego.navarro@reactiva.edu.co',
        avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
        grade: '10° Grado A',
        rank: 'Aprendiz de Laboratorio',
        overallProgress: 52,
        lastActiveFormatted: 'Hace 3 días',
        currentStreakDays: 1,
        bestStreakDays: 4,
        weeklyActiveDaysCount: 1,
        activityContinuityStatus: 'En Riesgo',
        activityCalendar: [
          { day: 'L', date: '6 Nov', active: false, completedCount: 0 },
          { day: 'M', date: '7 Nov', active: false, completedCount: 0 },
          { day: 'M', date: '8 Nov', active: true, completedCount: 1 },
          { day: 'J', date: '9 Nov', active: false, completedCount: 0 },
          { day: 'V', date: '10 Nov', active: false, completedCount: 0 },
          { day: 'S', date: '11 Nov', active: false, completedCount: 0 },
          { day: 'D', date: '12 Nov', active: false, completedCount: 0 }
        ],
        completedTasksCount: 1,
        inProgressTasksCount: 2,
        pendingTasksCount: 2,
        compliancePercentage: 40,
        periodicTable: { visited: true, elementsInspectedCount: 14, memoryPairsPlayed: 1, progressPercent: 60, lastAccessed: 'Hace 3 días' },
        virtualLab: { experimentsStarted: 2, experimentsCompleted: 1, conductedPracticeTitle: 'Calibración de Mechero Bunsen', scoreObtained: 3.8, progressPercent: 45, lastAccessed: 'Hace 4 días' },
        organicMission: { levelsCompleted: 0, totalLevels: 4, totalPoints: 30, livesRemaining: 1, badgesUnlockedCount: 0, progressPercent: 15, lastAccessed: 'Hace 3 días' },
        challenges: { challengesCompleted: 1, totalChallenges: 4, claimedXP: 3200, currentRankPosition: 28, trophiesCount: 2, progressPercent: 30, lastAccessed: 'Hace 3 días' },
        activityHistory: [
          { date: 'Hace 3 días', section: 'Organic Mission', description: 'Dificultad en Nivel 1: agotó 4 vidas en identificación de enlaces', resultBadge: 'Requiere Apoyo', resultClass: 'badge-warning' },
          { date: 'Hace 4 días', section: 'Virtual Lab', description: 'Inició práctica pero no completó balance estequiométrico', resultBadge: 'Inconcluso', resultClass: 'badge-warning' }
        ]
      },
      {
        id: 'st-sofia',
        name: 'Sofía Castro',
        email: 'sofia.castro@reactiva.edu.co',
        avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80',
        grade: '10° Grado A',
        rank: 'Investigadora Cuántica',
        overallProgress: 76,
        lastActiveFormatted: 'Ayer, 05:20 PM',
        currentStreakDays: 3,
        bestStreakDays: 7,
        weeklyActiveDaysCount: 4,
        activityContinuityStatus: 'Intermitente',
        activityCalendar: [
          { day: 'L', date: '6 Nov', active: true, completedCount: 1 },
          { day: 'M', date: '7 Nov', active: false, completedCount: 0 },
          { day: 'M', date: '8 Nov', active: true, completedCount: 2 },
          { day: 'J', date: '9 Nov', active: true, completedCount: 2 },
          { day: 'V', date: '10 Nov', active: true, completedCount: 1 },
          { day: 'S', date: '11 Nov', active: false, completedCount: 0 },
          { day: 'D', date: '12 Nov', active: false, completedCount: 0 }
        ],
        completedTasksCount: 2,
        inProgressTasksCount: 1,
        pendingTasksCount: 1,
        compliancePercentage: 70,
        periodicTable: { visited: true, elementsInspectedCount: 28, memoryPairsPlayed: 2, progressPercent: 80, lastAccessed: 'Ayer, 05:20 PM' },
        virtualLab: { experimentsStarted: 3, experimentsCompleted: 2, conductedPracticeTitle: 'Enlace Covalente Polar', scoreObtained: 4.2, progressPercent: 75, lastAccessed: 'Hace 2 días' },
        organicMission: { levelsCompleted: 1, totalLevels: 4, totalPoints: 110, livesRemaining: 3, badgesUnlockedCount: 1, progressPercent: 35, lastAccessed: 'Hace 2 días' },
        challenges: { challengesCompleted: 2, totalChallenges: 4, claimedXP: 4490, currentRankPosition: 5, trophiesCount: 5, progressPercent: 65, lastAccessed: 'Ayer, 05:10 PM' },
        activityHistory: [
          { date: 'Ayer, 05:20 PM', section: 'Periodic Table', description: 'Consulta de números de oxidación en metales de transición', resultBadge: 'Completado', resultClass: 'badge-info' },
          { date: 'Hace 2 días', section: 'Virtual Lab', description: 'Completó ensayo de conductividad eléctrica', resultBadge: 'Nota: 4.2', resultClass: 'badge-success' }
        ]
      }
    ];

    return [mainActiveStudent, ...peerStudents];
  }

  // -------------------------------------------------------------
  // 7. Enviar Orientación Pedagógica Docente al Estudiante
  // -------------------------------------------------------------
  getStudentGuidance(): { studentId: string; studentName: string; title: string; message: string; timestamp: string } | null {
    if (!this.isBrowser()) return null;
    try {
      const stored = localStorage.getItem(STORAGE_STUDENT_GUIDANCE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }

  clearStudentGuidance(): void {
    if (!this.isBrowser()) return;
    try {
      localStorage.removeItem(STORAGE_STUDENT_GUIDANCE_KEY);
    } catch {}
  }

  sendPedagogicGuidance(studentId: string, studentName: string, message: string): void {
    if (!this.isBrowser()) return;
    const guidance = {
      studentId,
      studentName,
      title: 'Pauta Pedagógica del Prof. Dr. Roberto Méndez',
      message,
      timestamp: new Date().toISOString()
    };
    try {
      localStorage.setItem(STORAGE_STUDENT_GUIDANCE_KEY, JSON.stringify(guidance));
    } catch {}
  }
}

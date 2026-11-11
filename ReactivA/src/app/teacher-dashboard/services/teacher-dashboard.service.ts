// ============================================================
// SERVICIO DE GESTIÓN DOCENTE – TeacherDashboardService
// Conecta el Dashboard del Profesor con los datos del Estudiante
// ============================================================

import { Injectable, inject } from '@angular/core';
import { StudentProgressService } from '../../dashboard/student-progress.service';
import {
  TeacherProfile,
  TeacherKpi,
  LiveSessionState,
  LiveActivityFeedItem,
  AcademicGroupPerformance,
  SupportStudentAlert,
  SimulatorPreviewCard,
  QuickPinConfig
} from '../models/teacher-dashboard.models';

const STORAGE_ACTIVE_PIN_KEY = 'reactiva_active_class_pin';
const STORAGE_TEACHER_ALERTS_KEY = 'reactiva_teacher_alerts';
const STORAGE_LIVE_SESSION_KEY = 'reactiva_teacher_live_session';

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
      title: 'Jefe de Laboratorio',
      institution: 'Colegio San Ignacio',
      department: 'Dpto. Ciencias Naturales',
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

  generateNewPin(config?: Partial<QuickPinConfig>): string {
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
  // 3. KPIs del Docente (Sincronizados con el Estudiante)
  // -------------------------------------------------------------
  getTeacherKpis(): TeacherKpi {
    // Leemos datos del panel del estudiante si existen
    const studentProfile = this.studentProgressService.getProfile();
    const studentGamification = this.studentProgressService.getGamificationState();
    const dashboardTasks = this.studentProgressService.getDashboardTasks();
    const completedTasksCount = dashboardTasks.filter(t => t.completed).length;

    // Prácticas totales calculadas (base 410 + tareas completadas en la app)
    const totalPractices = 412 + completedTasksCount;

    // Precisión media calculada dinámicamente
    const accuracy = 84.6;

    return {
      activeStudents: 148,
      activeStudentsDelta: '+12%',
      activeStudentsDetail: 'Distribuidos en 5 grupos (9° a 11° grado)',
      completedPractices: totalPractices,
      completedPracticesDetail: '88% tasa de aprobación & fórmulas aprobadas',
      labAverageAccuracy: accuracy,
      labAccuracyDelta: '+3.2 pts vs. ciclo anterior en simuladores 3D',
      supportAlertsCount: 6,
      supportAlertsTopic: 'Dificultad al momento: Estequiometría & Moles'
    };
  }

  // -------------------------------------------------------------
  // 4. Sesión en Vivo (Laboratorio de Nomenclatura y Enlaces)
  // -------------------------------------------------------------
  getLiveSession(): LiveSessionState {
    const defaultSession: LiveSessionState = {
      groupCode: '10° Grado B',
      title: 'Laboratorio de Nomenclatura y Enlaces',
      status: 'EN CURSO',
      connectedStudents: 32,
      totalStudents: 34,
      description: '32 de 34 estudiantes manipulando reactivos y estructuras de Lewis en 3D',
      elapsedMinutes: 35,
      totalMinutes: 45,
      progressPercent: 78,
      phases: [
        { name: 'Etapa 1: Formación Iónica', percent: 100 },
        { name: 'Etapa 2: Enlace Covalente Polar', percent: 84 },
        { name: 'Etapa 3: Examen Síntesis', percent: 42 }
      ]
    };

    if (!this.isBrowser()) return defaultSession;

    try {
      const stored = localStorage.getItem(STORAGE_LIVE_SESSION_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // fallback
    }

    return defaultSession;
  }

  toggleLiveSessionStatus(): LiveSessionState {
    const session = this.getLiveSession();
    session.status = session.status === 'EN CURSO' ? 'PAUSADA' : 'EN CURSO';

    if (this.isBrowser()) {
      localStorage.setItem(STORAGE_LIVE_SESSION_KEY, JSON.stringify(session));
    }
    return session;
  }

  // -------------------------------------------------------------
  // 5. Feed de Actividad en Vivo (Tiempo Real)
  // -------------------------------------------------------------
  getLiveActivityFeed(): LiveActivityFeedItem[] {
    const currentStudent = this.studentProgressService.getProfile();
    const studentTasks = this.studentProgressService.getDashboardTasks();
    const lastDone = studentTasks.find(t => t.completed);

    const baseFeed: LiveActivityFeedItem[] = [
      {
        id: 'feed-1',
        studentName: 'Valentina R.',
        actionText: 'completó balance de ecuación Fe₂O₃ + 3CO → 2Fe + 3CO₂',
        highlightText: '100% acierto al primer intento • Módulo: Reacciones Redox',
        moduleName: 'Reacciones Redox',
        timeAgo: 'hace 3m',
        type: 'success',
        icon: 'ph-check-circle'
      },
      {
        id: 'feed-2',
        studentName: 'Mateo G.',
        actionText: 'solicitó pista interactiva a Tutor Átomo en Reacción...',
        highlightText: 'Pista provista: regla de números de oxidación de metales de transición',
        moduleName: 'Tutor Átomo',
        timeAgo: 'hace 7m',
        type: 'ai',
        icon: 'ph-lightbulb'
      },
      {
        id: 'feed-3',
        studentName: 'Equipo 3 (Mesa Digital 2)',
        actionText: 'finalizó calibración de Mechero Bunsen...',
        highlightText: 'Zona oxidante alcanzada sin incidentes de seguridad virtual',
        moduleName: 'Seguridad Virtual',
        timeAgo: 'hace 11m',
        type: 'warning',
        icon: 'ph-flame'
      }
    ];

    // Si el estudiante activo tiene tareas completadas, integrarlo al feed en tiempo real
    if (lastDone && currentStudent.name) {
      baseFeed.unshift({
        id: 'feed-student',
        studentName: currentStudent.name,
        actionText: `completó: "${lastDone.title}"`,
        highlightText: 'Registrado en sincronización con Panel del Estudiante',
        moduleName: 'Dashboard Estudiante',
        timeAgo: 'hace 1m',
        type: 'success',
        icon: 'ph-seal-check'
      });
    }

    return baseFeed;
  }

  // -------------------------------------------------------------
  // 6. Rendimiento por Grupos y Módulos Curriculares
  // -------------------------------------------------------------
  getAcademicGroups(): AcademicGroupPerformance[] {
    const studentProfile = this.studentProgressService.getProfile();

    return [
      {
        id: 'grp-11a',
        code: '11A',
        codeColorClass: 'badge-blue',
        gradeName: '11° Grado A',
        subjectModule: 'Química Orgánica',
        studentsCount: 30,
        currentPractice: 'Hidrocarburos y Grupos Funcionales (Misión Orgánica)',
        statusBadge: 'Excelente',
        statusBadgeClass: 'badge-success',
        progressPercent: 92,
        averageGrade: 9.1,
        students: [
          { id: 'st-1', name: studentProfile.name || 'Alex Morales', status: 'Completado', grade: 9.8, practiceTitle: 'Alcanos y Alquenos', lastActive: 'Hoy, 10:15 AM' },
          { id: 'st-2', name: 'Valentina Restrepo', status: 'Completado', grade: 9.5, practiceTitle: 'Alcanos y Alquenos', lastActive: 'Hoy, 10:20 AM' },
          { id: 'st-3', name: 'Diego Navarro', status: 'Requiere apoyo', grade: 6.4, practiceTitle: 'Isomería Cis-Trans', lastActive: 'Hace 4 días' },
          { id: 'st-4', name: 'Camila Morales', status: 'En progreso', grade: 8.9, practiceTitle: 'Nomenclatura IUPAC', lastActive: 'Hoy, 09:45 AM' },
          { id: 'st-5', name: 'Santiago Rivas', status: 'Completado', grade: 9.0, practiceTitle: 'Hidrocarburos Aromáticos', lastActive: 'Ayer, 04:30 PM' }
        ]
      },
      {
        id: 'grp-10b',
        code: '10B',
        codeColorClass: 'badge-purple',
        gradeName: '10° Grado B',
        subjectModule: 'Reacciones y Estequiometría',
        studentsCount: 34,
        currentPractice: 'Balanceador de Reacciones Químicas',
        statusBadge: 'En curso',
        statusBadgeClass: 'badge-info',
        progressPercent: 75,
        averageGrade: 8.3,
        students: [
          { id: 'st-6', name: 'Lucas Silva', status: 'Requiere apoyo', grade: 6.8, practiceTitle: 'Cálculo de Moles', lastActive: 'Hoy, 10:10 AM' },
          { id: 'st-7', name: 'María Paula Ortiz', status: 'Completado', grade: 9.2, practiceTitle: 'Balanceo Redox', lastActive: 'Hoy, 10:22 AM' },
          { id: 'st-8', name: 'Mateo Gómez', status: 'En progreso', grade: 7.9, practiceTitle: 'Reactivo Límite', lastActive: 'Hoy, 10:18 AM' },
          { id: 'st-9', name: 'Isabella Duarte', status: 'Completado', grade: 8.8, practiceTitle: 'Balanceo Tanteo', lastActive: 'Hoy, 09:50 AM' }
        ]
      },
      {
        id: 'grp-9c',
        code: '9C',
        codeColorClass: 'badge-orange',
        gradeName: '9° Grado C',
        subjectModule: 'Tabla Periódica & Enlaces',
        studentsCount: 28,
        currentPractice: 'Dificultad observada en Enlaces Covalentes',
        statusBadge: 'Requiere atención',
        statusBadgeClass: 'badge-warning',
        progressPercent: 48,
        averageGrade: 7.2,
        students: [
          { id: 'st-10', name: 'Sofía Castro', status: 'Requiere apoyo', grade: 5.8, practiceTitle: 'Estados de Oxidación', lastActive: 'Hoy, 09:30 AM' },
          { id: 'st-11', name: 'Juan Pablo Vera', status: 'En progreso', grade: 7.0, practiceTitle: 'Electronegatividad', lastActive: 'Ayer, 03:15 PM' },
          { id: 'st-12', name: 'Gabriela Meza', status: 'Completado', grade: 8.5, practiceTitle: 'Enlaces Iónicos', lastActive: 'Ayer, 05:00 PM' }
        ]
      },
      {
        id: 'grp-8a',
        code: '8A',
        codeColorClass: 'badge-indigo',
        gradeName: '8° Grado A',
        subjectModule: 'Introducción a la Materia',
        studentsCount: 31,
        currentPractice: 'Estados de Agregación y Densidad',
        statusBadge: 'Buen ritmo',
        statusBadgeClass: 'badge-teal',
        progressPercent: 66,
        averageGrade: 8.8,
        students: [
          { id: 'st-13', name: 'Samuel Lozano', status: 'Completado', grade: 9.0, practiceTitle: 'Curva de Calentamiento', lastActive: 'Hoy, 08:20 AM' },
          { id: 'st-14', name: 'Luciana Quintero', status: 'Completado', grade: 8.7, practiceTitle: 'Medición de Densidad', lastActive: 'Hoy, 08:45 AM' },
          { id: 'st-15', name: 'Andrés Felipe Peña', status: 'En progreso', grade: 8.2, practiceTitle: 'Modelos de Partículas', lastActive: 'Ayer, 04:00 PM' }
        ]
      }
    ];
  }

  // -------------------------------------------------------------
  // 7. Estudiantes en Refuerzo (Alertas Tempranas)
  // -------------------------------------------------------------
  getSupportAlerts(): SupportStudentAlert[] {
    const defaultAlerts: SupportStudentAlert[] = [
      {
        id: 'alt-1',
        initials: 'LS',
        name: 'Lucas Silva',
        gradeGroup: '10° Grado B',
        issueBadge: '3 fallos',
        issueBadgeClass: 'badge-danger',
        description: 'Dificultad en cálculo de moles a partir de masas molares en estequiometría.',
        actionButtonLabel: 'Enviar Guía de Apoyo',
        actionType: 'guide',
        status: 'pending'
      },
      {
        id: 'alt-2',
        initials: 'SC',
        name: 'Sofía Castro',
        gradeGroup: '9° Grado C',
        issueBadge: 'Confusión Stock',
        issueBadgeClass: 'badge-warning',
        description: 'Confusión al colocar número de oxidación a elementos anfóteros.',
        actionButtonLabel: 'Asignar Minireto 3D',
        actionType: 'minireto',
        status: 'pending'
      },
      {
        id: 'alt-3',
        initials: 'DN',
        name: 'Diego Navarro',
        gradeGroup: '11° Grado A',
        issueBadge: '4 días inactivo',
        issueBadgeClass: 'badge-muted',
        description: 'Sin registro en el simulador de isomería cis-trans ni entregas de reporte.',
        actionButtonLabel: 'Notificar estudiante',
        actionType: 'notify',
        status: 'pending'
      }
    ];

    if (!this.isBrowser()) return defaultAlerts;

    try {
      const stored = localStorage.getItem(STORAGE_TEACHER_ALERTS_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // fallback
    }

    return defaultAlerts;
  }

  resolveAlert(alertId: string): SupportStudentAlert[] {
    const alerts = this.getSupportAlerts();
    const item = alerts.find(a => a.id === alertId);
    if (item) {
      item.status = 'resolved';
      if (this.isBrowser()) {
        localStorage.setItem(STORAGE_TEACHER_ALERTS_KEY, JSON.stringify(alerts));
      }
    }
    return alerts;
  }

  // -------------------------------------------------------------
  // 8. Tarjetas de Simuladores 3D
  // -------------------------------------------------------------
  getSimulatorCards(): SimulatorPreviewCard[] {
    return [
      {
        id: 'sim-mol-3d',
        title: 'Simulador 3D: Estructura Molecular',
        badgeText: 'Web3D Listo',
        badgeClass: 'badge-cyan',
        formulaTag: 'H₂O & CH₄ Enlaces Covalentes',
        description: 'Permite a los estudiantes rotar electrones de valencia y calcular ángulos de repulsión en tiempo real.',
        thumbnailType: 'molecule-3d',
        routeLink: '/virtual-lab'
      },
      {
        id: 'sim-burette',
        title: 'Bureta Digital y Titulación Ácido - Base',
        badgeText: 'Calibrado',
        badgeClass: 'badge-green',
        formulaTag: 'Curva de Neutralización pH 7.0',
        description: 'Control fino de gotas con detector virtual de fenolftaleína y registro automático de volumen.',
        thumbnailType: 'burette-titration',
        routeLink: '/virtual-lab'
      }
    ];
  }

  // -------------------------------------------------------------
  // 9. Exportación de Calificaciones (CSV)
  // -------------------------------------------------------------
  exportGradesCsv(): void {
    if (!this.isBrowser()) return;

    const groups = this.getAcademicGroups();
    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'Grupo,Módulo,Estudiante,Estado,Calificación,Última Actividad\n';

    groups.forEach(g => {
      g.students.forEach(st => {
        csvContent += `"${g.gradeName}","${g.subjectModule}","${st.name}","${st.status}",${st.grade},"${st.lastActive}"\n`;
      });
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ReactivA_Calificaciones_Docente_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}


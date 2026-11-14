// ============================================================
// COMPONENTE PRINCIPAL – Dashboard del Profesor (ReactivA)
// Enfoque: Seguimiento, Supervisión y Análisis del Aprendizaje
// ============================================================

import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { TeacherSidebarComponent } from './teacher-sidebar/teacher-sidebar';

import { TeacherDashboardService } from './services/teacher-dashboard.service';
import {
  TeacherProfile,
  AcademicOverviewKPIs,
  RecentLearningEvent,
  ModuleSectionProgress,
  StudentLearningDetail
} from './models/teacher-dashboard.models';

export type SupervisionViewFilter = 'all' | 'periodic-table' | 'virtual-lab' | 'organic-mission' | 'challenges';

export type TeacherDashboardView = 'overview' | 'classrooms';

export interface DashboardClassroomStudent {
  nombre: string;
  nota: number;
  estado: 'Passing' | 'At risk' | 'Outstanding';
}

export interface DashboardClassroomGroup {
  id: string;
  nombre: string;
  tag: string;
  tagClass: string;
  ubicacion: string;
  horario: string;
  totalEstudiantes: number;
  promedio: number;
  semanaActual: number;
  semanasTotal: number;
  moduloActivo: string;
  progreso: number;
  filtro: string; // 'all' | '10' | '11' | 'stem'
  estudiantes: DashboardClassroomStudent[];
}

export interface DashboardNewGroupForm {
  nombre: string;
  tag: string;
  ubicacion: string;
  horario: string;
  totalEstudiantes: number;
  filtro: string;
}

@Component({
  selector: 'app-teacher-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, TeacherSidebarComponent],
  templateUrl: './teacher-dashboard.html',
  styleUrl: './teacher-dashboard.scss'
})
export class TeacherDashboardComponent implements OnInit {
  private teacherService = inject(TeacherDashboardService);
  private cdr = inject(ChangeDetectorRef);

  // Vista activa del panel ('overview' para supervisión o 'classrooms' para mis aulas y grupos)
  currentView: TeacherDashboardView = 'overview';

  // Perfil del Docente
  teacherProfile!: TeacherProfile;
  activePin: string = 'CHEM-8420';

  // KPIs de la Vista General
  kpis!: AcademicOverviewKPIs;

  // Actividad Reciente del Estudiantado
  recentActivities: RecentLearningEvent[] = [];

  // Supervisión de las Cuatro Secciones Educativas
  sectionsProgress: ModuleSectionProgress[] = [];

  // Listado de Estudiantes y Filtro
  allStudents: StudentLearningDetail[] = [];
  filteredStudents: StudentLearningDetail[] = [];
  studentSearchTerm: string = '';
  selectedSectionFilter: SupervisionViewFilter = 'all';

  // Seguimiento Individual (Estudiante Seleccionado)
  selectedStudent: StudentLearningDetail | null = null;

  // Pestaña activa en la ficha del estudiante ('resumen' | 'secciones' | 'rachas' | 'historial')
  studentDetailTab: 'resumen' | 'secciones' | 'rachas' | 'historial' = 'resumen';

  // Modal para Enviar Orientación Pedagógica
  isGuidanceModalOpen: boolean = false;
  guidanceMessageText: string = '';

  // -------------------------------------------------------------
  // ESTADO Y GESTIÓN DE MIS AULAS Y GRUPOS (My Classrooms & Groups)
  // -------------------------------------------------------------
  classroomSearchQuery = '';
  classroomActiveFilter = 'all';
  isCrearAulaModalOpen = false;
  isVerEstudiantesAulaOpen = false;
  isAsignarTallerModalOpen = false;
  aulaSeleccionada: DashboardClassroomGroup | null = null;

  nuevoGrupoForm: DashboardNewGroupForm = {
    nombre: '',
    tag: 'INTERMEDIATE',
    ubicacion: '',
    horario: '',
    totalEstudiantes: 25,
    filtro: 'all'
  };

  tallerSeleccionado = 'Acid-Base Titration';

  readonly talleresDisponibles = [
    'Acid-Base Titration',
    'Redox Balancing & Stoichiometry',
    'Atomic Models & Periodic Table',
    'Organic Nomenclature IUPAC',
    'Thermochemistry & Enthalpy',
    '3D Molecular Bond Simulation'
  ];

  aulas: DashboardClassroomGroup[] = [
    {
      id: 'aula-10a',
      nombre: 'Grade 10° A — General Chemistry',
      tag: 'INTERMEDIATE',
      tagClass: 'tag-blue',
      ubicacion: 'Room 204',
      horario: 'Mon & Wed  08:00 – 09:40',
      totalEstudiantes: 34,
      promedio: 4.5,
      semanaActual: 8,
      semanasTotal: 10,
      moduloActivo: 'Acid-Base Titration',
      progreso: 82,
      filtro: '10',
      estudiantes: [
        { nombre: 'Valeria Góngora', nota: 4.9, estado: 'Outstanding' },
        { nombre: 'Mateo Rincón', nota: 4.3, estado: 'Passing' },
        { nombre: 'Sara Pulido', nota: 3.8, estado: 'Passing' },
        { nombre: 'Daniel Ospina', nota: 2.8, estado: 'At risk' },
        { nombre: 'Lucía Mendoza', nota: 4.7, estado: 'Outstanding' },
        { nombre: 'Tomás Herrera', nota: 3.5, estado: 'Passing' }
      ]
    },
    {
      id: 'aula-10b',
      nombre: 'Grade 10° B — Stoichiometry',
      tag: 'LAB PRACTICE',
      tagClass: 'tag-purple',
      ubicacion: 'Lab 2',
      horario: 'Tue & Thu  10:15 – 11:55',
      totalEstudiantes: 30,
      promedio: 4.2,
      semanaActual: 6,
      semanasTotal: 10,
      moduloActivo: 'Redox Balancing',
      progreso: 65,
      filtro: '10',
      estudiantes: [
        { nombre: 'Andrés Castro', nota: 4.5, estado: 'Outstanding' },
        { nombre: 'Isabela Torres', nota: 4.0, estado: 'Passing' },
        { nombre: 'Felipe Suárez', nota: 2.6, estado: 'At risk' },
        { nombre: 'Mariana Lozano', nota: 3.9, estado: 'Passing' },
        { nombre: 'Sebastián Ruiz', nota: 4.8, estado: 'Outstanding' }
      ]
    },
    {
      id: 'aula-11a',
      nombre: 'Grade 11° A — Organic Chemistry',
      tag: 'ADVANCED',
      tagClass: 'tag-green',
      ubicacion: 'Room 301',
      horario: 'Mon & Wed  10:30 – 12:10',
      totalEstudiantes: 28,
      promedio: 4.7,
      semanaActual: 9,
      semanasTotal: 10,
      moduloActivo: 'Organic Mission & IUPAC',
      progreso: 90,
      filtro: '11',
      estudiantes: [
        { nombre: 'Camila Reyes', nota: 4.9, estado: 'Outstanding' },
        { nombre: 'Nicolás Vargas', nota: 4.6, estado: 'Outstanding' },
        { nombre: 'Alejandra Mora', nota: 4.3, estado: 'Passing' },
        { nombre: 'Samuel Pinto', nota: 3.7, estado: 'Passing' },
        { nombre: 'Gabriela Ríos', nota: 2.9, estado: 'At risk' }
      ]
    },
    {
      id: 'aula-stem',
      nombre: 'STEM Program — Chemistry Olympiad',
      tag: 'HIGH PERFORMANCE',
      tagClass: 'tag-amber',
      ubicacion: 'Advanced Lab',
      horario: 'Fri  15:00 – 17:30',
      totalEstudiantes: 18,
      promedio: 4.9,
      semanaActual: 12,
      semanasTotal: 12,
      moduloActivo: 'Thermochemistry',
      progreso: 94,
      filtro: 'stem',
      estudiantes: [
        { nombre: 'Elena Sandoval', nota: 5.0, estado: 'Outstanding' },
        { nombre: 'Martín Correa', nota: 4.9, estado: 'Outstanding' },
        { nombre: 'Paula Jiménez', nota: 4.8, estado: 'Outstanding' },
        { nombre: 'Rodrigo Nieto', nota: 4.7, estado: 'Outstanding' }
      ]
    }
  ];

  // Toast Feedback
  toastMessage: string | null = null;
  toastType: 'success' | 'info' | 'warning' = 'success';
  private toastTimer?: ReturnType<typeof setTimeout>;

  ngOnInit(): void {
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    this.teacherProfile = this.teacherService.getTeacherProfile();
    this.activePin = this.teacherService.getActivePin();
    this.kpis = this.teacherService.getAcademicOverviewKPIs();
    this.recentActivities = this.teacherService.getRecentLearningActivities();
    this.sectionsProgress = this.teacherService.getSectionsOverview();
    this.allStudents = this.teacherService.getStudentsList();
    this.filteredStudents = [...this.allStudents];

    // Seleccionar por defecto al primer estudiante (Valeria Góngora) para ver su recorrido de inmediato
    if (this.allStudents.length > 0 && !this.selectedStudent) {
      this.selectedStudent = this.allStudents[0];
    }

    this.cdr.markForCheck();
  }

  // -------------------------------------------------------------
  // Selección y Seguimiento Individual del Estudiante
  // -------------------------------------------------------------
  selectStudent(student: StudentLearningDetail): void {
    this.selectedStudent = student;
    this.studentDetailTab = 'resumen';
    this.cdr.markForCheck();

    // Scroll suave hacia la ficha de detalle en escritorio
    if (typeof document !== 'undefined') {
      const detailElem = document.getElementById('student-individual-view');
      if (detailElem) {
        detailElem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }

  // -------------------------------------------------------------
  // Filtros y Búsqueda en el Listado de Estudiantes
  // -------------------------------------------------------------
  onSearchChange(): void {
    this.applyStudentFilters();
  }

  setSectionFilter(filter: SupervisionViewFilter): void {
    this.selectedSectionFilter = filter;
    this.applyStudentFilters();
  }

  private applyStudentFilters(): void {
    const term = this.studentSearchTerm.trim().toLowerCase();

    this.filteredStudents = this.allStudents.filter(student => {
      const matchesSearch =
        !term ||
        student.name.toLowerCase().includes(term) ||
        student.email.toLowerCase().includes(term) ||
        student.grade.toLowerCase().includes(term);

      let matchesSection = true;
      if (this.selectedSectionFilter === 'periodic-table') {
        matchesSection = student.periodicTable.visited;
      } else if (this.selectedSectionFilter === 'virtual-lab') {
        matchesSection = student.virtualLab.experimentsCompleted > 0;
      } else if (this.selectedSectionFilter === 'organic-mission') {
        matchesSection = student.organicMission.levelsCompleted > 0;
      } else if (this.selectedSectionFilter === 'challenges') {
        matchesSection = student.challenges.challengesCompleted > 0;
      }

      return matchesSearch && matchesSection;
    });

    this.cdr.markForCheck();
  }

  // -------------------------------------------------------------
  // Generación y Copia de PIN de Clase
  // -------------------------------------------------------------
  generateNewPin(): void {
    this.activePin = this.teacherService.generateNewPin();
    this.showToast(`¡Nuevo PIN de aula generado: ${this.activePin}!`, 'success');
  }

  copyPin(): void {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(this.activePin).then(() => {
        this.showToast(`PIN ${this.activePin} copiado al portapapeles.`, 'info');
      }).catch(() => {
        this.showToast(`PIN de Clase: ${this.activePin}`, 'info');
      });
    } else {
      this.showToast(`PIN de Clase: ${this.activePin}`, 'info');
    }
  }

  // -------------------------------------------------------------
  // Orientación Pedagógica Directa al Estudiante
  // -------------------------------------------------------------
  openGuidanceModal(): void {
    if (!this.selectedStudent) return;
    this.guidanceMessageText = `Hola ${this.selectedStudent.name.split(' ')[0]}, revisando tu avance en ReactivA, te recomiendo reforzar la identificación de grupos funcionales en Misión Orgánica antes de continuar al siguiente nivel.`;
    this.isGuidanceModalOpen = true;
    this.cdr.markForCheck();
  }

  closeGuidanceModal(): void {
    this.isGuidanceModalOpen = false;
    this.cdr.markForCheck();
  }

  sendGuidance(): void {
    if (!this.selectedStudent || !this.guidanceMessageText.trim()) return;

    this.teacherService.sendPedagogicGuidance(
      this.selectedStudent.id,
      this.selectedStudent.name,
      this.guidanceMessageText
    );

    this.showToast(`Pauta pedagógica enviada a ${this.selectedStudent.name}.`, 'success');
    this.closeGuidanceModal();
  }

  // -------------------------------------------------------------
  // Cambio de Vista Principal (Sidebar Docente)
  // -------------------------------------------------------------
  setView(view: TeacherDashboardView): void {
    this.currentView = view;
    this.cdr.markForCheck();
  }

  // -------------------------------------------------------------
  // LÓGICA DE MIS AULAS Y GRUPOS (My Classrooms & Groups)
  // -------------------------------------------------------------
  get aulasFiltradas(): DashboardClassroomGroup[] {
    const q = this.classroomSearchQuery.trim().toLowerCase();
    return this.aulas.filter(a => {
      const matchFiltro = this.classroomActiveFilter === 'all' || a.filtro === this.classroomActiveFilter;
      if (!matchFiltro) return false;
      if (!q) return true;
      return (
        a.nombre.toLowerCase().includes(q) ||
        a.ubicacion.toLowerCase().includes(q) ||
        a.moduloActivo.toLowerCase().includes(q)
      );
    });
  }

  contarAulasPorFiltro(f: string): number {
    return f === 'all'
      ? this.aulas.length
      : this.aulas.filter(a => a.filtro === f).length;
  }

  setClassroomFiltro(f: string): void {
    this.classroomActiveFilter = f;
    this.cdr.markForCheck();
  }

  verEstudiantesAula(aula: DashboardClassroomGroup): void {
    this.aulaSeleccionada = aula;
    this.isVerEstudiantesAulaOpen = true;
    this.cdr.markForCheck();
  }

  cerrarEstudiantesAula(): void {
    this.isVerEstudiantesAulaOpen = false;
    this.aulaSeleccionada = null;
    this.cdr.markForCheck();
  }

  abrirAsignarTaller(aula: DashboardClassroomGroup): void {
    this.aulaSeleccionada = aula;
    this.isAsignarTallerModalOpen = true;
    this.cdr.markForCheck();
  }

  cerrarAsignarTaller(): void {
    this.isAsignarTallerModalOpen = false;
    this.aulaSeleccionada = null;
    this.cdr.markForCheck();
  }

  confirmarAsignacionTaller(): void {
    const nombre = this.aulaSeleccionada?.nombre ?? '';
    this.cerrarAsignarTaller();
    this.showToast(`Taller "${this.tallerSeleccionado}" asignado a ${nombre}`, 'success');
  }

  abrirCrearAulaModal(): void {
    this.nuevoGrupoForm = {
      nombre: '',
      tag: 'INTERMEDIATE',
      ubicacion: '',
      horario: '',
      totalEstudiantes: 25,
      filtro: 'all'
    };
    this.isCrearAulaModalOpen = true;
    this.cdr.markForCheck();
  }

  cerrarCrearAulaModal(): void {
    this.isCrearAulaModalOpen = false;
    this.cdr.markForCheck();
  }

  crearNuevoGrupo(): void {
    if (!this.nuevoGrupoForm.nombre.trim() || !this.nuevoGrupoForm.ubicacion.trim()) {
      this.showToast('Por favor ingresa el nombre del grupo y la ubicación del aula.', 'warning');
      return;
    }
    const tagMap: Record<string, string> = {
      'INTERMEDIATE': 'tag-blue',
      'LAB PRACTICE': 'tag-purple',
      'ADVANCED': 'tag-green',
      'HIGH PERFORMANCE': 'tag-amber'
    };
    const nuevo: DashboardClassroomGroup = {
      id: 'aula-' + Date.now(),
      nombre: this.nuevoGrupoForm.nombre,
      tag: this.nuevoGrupoForm.tag,
      tagClass: tagMap[this.nuevoGrupoForm.tag] ?? 'tag-blue',
      ubicacion: this.nuevoGrupoForm.ubicacion,
      horario: this.nuevoGrupoForm.horario || 'Por definir',
      totalEstudiantes: this.nuevoGrupoForm.totalEstudiantes,
      promedio: 0,
      semanaActual: 1,
      semanasTotal: 10,
      moduloActivo: 'Por asignar',
      progreso: 0,
      filtro: this.nuevoGrupoForm.filtro,
      estudiantes: []
    };
    this.aulas = [...this.aulas, nuevo];
    this.cerrarCrearAulaModal();
    this.showToast(`Grupo "${nuevo.nombre}" creado exitosamente.`, 'success');
  }

  progresoColor(p: number): string {
    if (p >= 85) return '#10b981';
    if (p >= 60) return '#00a2ed';
    return '#f59e0b';
  }

  // -------------------------------------------------------------
  // Notificación Toast
  // -------------------------------------------------------------
  private showToast(message: string, type: 'success' | 'info' | 'warning' = 'success'): void {
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastMessage = message;
    this.toastType = type;
    this.cdr.markForCheck();

    this.toastTimer = setTimeout(() => {
      this.toastMessage = null;
      this.cdr.markForCheck();
    }, 3800);
  }
}

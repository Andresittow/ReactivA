// ============================================================
// COMPONENTE PRINCIPAL – Dashboard del Profesor (ReactivA)
// Enfoque: Seguimiento, Supervisión y Análisis del Aprendizaje
// ============================================================

import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { TeacherDashboardService } from './services/teacher-dashboard.service';
import {
  TeacherProfile,
  AcademicOverviewKPIs,
  RecentLearningEvent,
  ModuleSectionProgress,
  StudentLearningDetail
} from './models/teacher-dashboard.models';

export type SupervisionViewFilter = 'all' | 'periodic-table' | 'virtual-lab' | 'organic-mission' | 'challenges';

@Component({
  selector: 'app-teacher-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterLink],
  templateUrl: './teacher-dashboard.html',
  styleUrl: './teacher-dashboard.scss'
})
export class TeacherDashboardComponent implements OnInit {
  private teacherService = inject(TeacherDashboardService);
  private cdr = inject(ChangeDetectorRef);

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

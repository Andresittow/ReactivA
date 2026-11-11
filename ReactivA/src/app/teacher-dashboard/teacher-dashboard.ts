// ============================================================
// COMPONENTE PRINCIPAL – Dashboard del Profesor (ReactivA)
// Arquitectura Standalone Components • Angular 21
// ============================================================

import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { TeacherDashboardService } from './services/teacher-dashboard.service';
import {
  TeacherProfile,
  TeacherKpi,
  LiveSessionState,
  LiveActivityFeedItem,
  AcademicGroupPerformance,
  SupportStudentAlert,
  SimulatorPreviewCard
} from './models/teacher-dashboard.models';

export type TeacherSidebarTab =
  | 'general'
  | 'groups'
  | 'practices'
  | 'students'
  | 'pin-generator';

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
  private fb = inject(FormBuilder);

  // Tab lateral del docente activo
  activeSidebarTab: TeacherSidebarTab = 'general';

  // Datos del docente
  teacherProfile!: TeacherProfile;
  kpis!: TeacherKpi;
  activePin: string = 'CHEM-8420';
  liveSession!: LiveSessionState;
  activityFeed: LiveActivityFeedItem[] = [];
  allGroups: AcademicGroupPerformance[] = [];
  filteredGroups: AcademicGroupPerformance[] = [];
  supportAlerts: SupportStudentAlert[] = [];
  simulatorCards: SimulatorPreviewCard[] = [];

  // Filtros y búsqueda
  searchTerm: string = '';
  selectedFilterStatus: string = 'todos';

  // Formulario reactivo para Generador Rápido de PIN
  pinForm: FormGroup = this.fb.group({
    interactiveModule: ['Balanceador de Reacciones Químicas', Validators.required],
    assignedGroup: ['11° Grado A (Química Orgánica)', Validators.required],
    allowAtomTutorHints: [true],
    timeLimit30Min: [true],
    examModeStrict: [false]
  });

  // Formulario para Crear Práctica / Asignación
  assignmentForm: FormGroup = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(4)]],
    module: ['Química Orgánica (Misión Orgánica)', Validators.required],
    targetGroup: ['11° Grado A', Validators.required],
    dueDate: ['2024-11-20', Validators.required],
    maxScore: [10, [Validators.required, Validators.min(1), Validators.max(10)]],
    description: ['']
  });

  // Estados de Modales
  isScreensModalOpen: boolean = false;
  isCreateAssignmentModalOpen: boolean = false;
  isGroupDetailModalOpen: boolean = false;
  isAlertsModalOpen: boolean = false;
  isPinProjectionModalOpen: boolean = false;
  isClassroomSyncModalOpen: boolean = false;
  selectedGroupForDetail: AcademicGroupPerformance | null = null;

  // Notificaciones y Toast
  toastMessage: string | null = null;
  toastType: 'success' | 'info' | 'warning' = 'success';
  notificationsCount: number = 3;

  ngOnInit(): void {
    this.loadDashboardData();
  }

  // -------------------------------------------------------------
  // Carga y sincronización de datos
  // -------------------------------------------------------------
  loadDashboardData(): void {
    this.teacherProfile = this.teacherService.getTeacherProfile();
    this.kpis = this.teacherService.getTeacherKpis();
    this.activePin = this.teacherService.getActivePin();
    this.liveSession = this.teacherService.getLiveSession();
    this.activityFeed = this.teacherService.getLiveActivityFeed();
    this.allGroups = this.teacherService.getAcademicGroups();
    this.filteredGroups = [...this.allGroups];
    this.supportAlerts = this.teacherService.getSupportAlerts();
    this.simulatorCards = this.teacherService.getSimulatorCards();
    this.cdr.markForCheck();
  }

  // -------------------------------------------------------------
  // Generador de PIN Rápido
  // -------------------------------------------------------------
  onGeneratePin(): void {
    if (this.pinForm.invalid) return;

    const val = this.pinForm.value;
    this.activePin = this.teacherService.generateNewPin(val);
    this.showToast(`¡Nuevo código PIN generado con éxito: ${this.activePin}!`, 'success');
  }

  copyPinToClipboard(): void {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(this.activePin).then(() => {
        this.showToast(`PIN ${this.activePin} copiado al portapapeles.`, 'info');
      }).catch(() => {
        this.showToast(`PIN: ${this.activePin}`, 'info');
      });
    } else {
      this.showToast(`PIN: ${this.activePin}`, 'info');
    }
  }

  openPinProjectionModal(): void {
    this.isPinProjectionModalOpen = true;
  }

  closePinProjectionModal(): void {
    this.isPinProjectionModalOpen = false;
  }

  // -------------------------------------------------------------
  // Sesión en Vivo (Control de Aula)
  // -------------------------------------------------------------
  toggleLiveSession(): void {
    this.liveSession = this.teacherService.toggleLiveSessionStatus();
    if (this.liveSession.status === 'PAUSADA') {
      this.showToast('Simulación 3D pausada para todos los estudiantes.', 'warning');
    } else {
      this.showToast('Simulación 3D reanudada en los escritorios virtuales.', 'success');
    }
  }

  openScreensModal(): void {
    this.isScreensModalOpen = true;
  }

  closeScreensModal(): void {
    this.isScreensModalOpen = false;
  }

  // -------------------------------------------------------------
  // Búsqueda y Filtros de Grupos
  // -------------------------------------------------------------
  onSearchChange(): void {
    const term = this.searchTerm.trim().toLowerCase();
    this.filteredGroups = this.allGroups.filter(g => {
      const matchText = g.gradeName.toLowerCase().includes(term) ||
                        g.subjectModule.toLowerCase().includes(term) ||
                        g.currentPractice.toLowerCase().includes(term);

      if (this.selectedFilterStatus === 'todos') {
        return matchText;
      }
      return matchText && g.statusBadge.toLowerCase().includes(this.selectedFilterStatus.toLowerCase());
    });
    this.cdr.markForCheck();
  }

  setFilterStatus(status: string): void {
    this.selectedFilterStatus = status;
    this.onSearchChange();
  }

  openGroupDetailModal(group: AcademicGroupPerformance): void {
    this.selectedGroupForDetail = group;
    this.isGroupDetailModalOpen = true;
  }

  closeGroupDetailModal(): void {
    this.isGroupDetailModalOpen = false;
    this.selectedGroupForDetail = null;
  }

  exportGrades(): void {
    this.teacherService.exportGradesCsv();
    this.showToast('Planilla de calificaciones descargada en CSV.', 'success');
  }

  // -------------------------------------------------------------
  // Gestión de Alertas de Refuerzo
  // -------------------------------------------------------------
  handleAlertAction(alert: SupportStudentAlert): void {
    if (alert.actionType === 'guide') {
      this.showToast(`Guía de refuerzo en Moles enviada al casillero virtual de ${alert.name}.`, 'success');
    } else if (alert.actionType === 'minireto') {
      this.showToast(`Minireto 3D de Números de Oxidación asignado a ${alert.name}.`, 'info');
    } else if (alert.actionType === 'notify') {
      this.showToast(`Aviso de inactividad enviado al acudiente y a ${alert.name}.`, 'warning');
    }
    this.supportAlerts = this.teacherService.resolveAlert(alert.id);
    this.cdr.markForCheck();
  }

  openAlertsModal(): void {
    this.isAlertsModalOpen = true;
  }

  closeAlertsModal(): void {
    this.isAlertsModalOpen = false;
  }

  // -------------------------------------------------------------
  // Asignaciones y Classroom
  // -------------------------------------------------------------
  openCreateAssignmentModal(): void {
    this.isCreateAssignmentModalOpen = true;
  }

  closeCreateAssignmentModal(): void {
    this.isCreateAssignmentModalOpen = false;
    this.assignmentForm.reset({
      module: 'Química Orgánica (Misión Orgánica)',
      targetGroup: '11° Grado A',
      dueDate: '2024-11-20',
      maxScore: 10
    });
  }

  saveAssignment(): void {
    if (this.assignmentForm.invalid) {
      this.assignmentForm.markAllAsTouched();
      return;
    }
    const val = this.assignmentForm.value;
    this.showToast(`Práctica "${val.title}" asignada correctamente a ${val.targetGroup}.`, 'success');
    this.closeCreateAssignmentModal();
  }

  syncGoogleClassroom(): void {
    this.isClassroomSyncModalOpen = true;
    setTimeout(() => {
      this.isClassroomSyncModalOpen = false;
      this.showToast('Sincronización completada con Google Classroom: 148 alumnos y 5 rúbricas actualizadas.', 'success');
      this.cdr.markForCheck();
    }, 1200);
  }

  generateDirectionReport(): void {
    this.showToast('Generando Informe Oficial de Rendimiento para Dirección Académica...', 'info');
    setTimeout(() => {
      if (typeof window !== 'undefined') {
        window.print();
      }
    }, 600);
  }

  // -------------------------------------------------------------
  // Feedback visual (Toast)
  // -------------------------------------------------------------
  showToast(message: string, type: 'success' | 'info' | 'warning' = 'success'): void {
    this.toastMessage = message;
    this.toastType = type;
    this.cdr.markForCheck();

    setTimeout(() => {
      this.toastMessage = null;
      this.cdr.markForCheck();
    }, 3800);
  }
}


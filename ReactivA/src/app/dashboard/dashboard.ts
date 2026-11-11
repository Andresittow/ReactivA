import { Component, OnInit, OnDestroy, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { StudentProgressService, StudentProfile, GamificationState, StoredDashboardTask } from './student-progress.service';

export interface Topic {
  id: number;
  unit: string;
  title: string;
  description: string;
  progress: number;
  color: 'green' | 'blue' | 'purple';
  icon: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class DashboardComponent implements OnInit, OnDestroy {
  private cdr = inject(ChangeDetectorRef);
  private progressService = inject(StudentProgressService);

  // 1. Perfil del Estudiante y Gamificación Centralizada
  studentProfile: StudentProfile = {
    name: 'Científico',
    grade: '10th Grade',
    email: 'estudiante@reactiva.edu.co'
  };

  gamification: GamificationState = {
    xp: 4850,
    level: 14,
    levelTitle: 'Alquimista Experto',
    streakDays: 5,
    lastActiveDate: '',
    nextLevelXp: 5000,
    levelProgressPercent: 97
  };

  // 2. Buscador reactivo dinámico individual (Clase 5a)
  searchControl = new FormControl('');
  searchTerm: string = '';
  private searchSubscription?: Subscription;

  // 3. Misiones y Tareas Diarias con Persistencia Real (Clases 4a y 4b)
  allTasks: StoredDashboardTask[] = [];
  dailyTasks: StoredDashboardTask[] = [];

  // Feedback y Notificaciones
  toastMessage: string | null = null;
  private toastTimer?: ReturnType<typeof setTimeout>;

  // 4. Unidades de la Ruta del Conocimiento (Clase 3)
  topics: Topic[] = [
    {
      id: 1,
      unit: 'UNIT 1',
      title: 'States of Matter',
      description: 'Explore solids, liquids, gases, and plasma through interactive experiments.',
      progress: 75,
      color: 'green',
      icon: 'ph ph-flask'
    },
    {
      id: 2,
      unit: 'UNIT 2',
      title: 'Atomic Structure',
      description: 'Dive into the nucleus, electron clouds, and subatomic particles.',
      progress: 40,
      color: 'blue',
      icon: 'ph ph-atom'
    },
    {
      id: 3,
      unit: 'UNIT 3',
      title: 'Organic Chemistry',
      description: 'Carbon bonds, hydrocarbon chains, and complex organic molecules.',
      progress: 0,
      color: 'purple',
      icon: 'ph ph-molecule'
    }
  ];
  filteredTopics: Topic[] = [];

  ngOnInit(): void {
    // Carga de estado sincronizado desde localStorage mediante StudentProgressService
    this.loadState();

    // Escucha en tiempo real de valueChanges sin recargar la página (Clase 5a)
    this.searchSubscription = this.searchControl.valueChanges.subscribe(searchTerm => {
      this.searchTerm = searchTerm ?? '';
      this.filterItems(this.searchTerm);
      this.cdr.markForCheck();
    });
  }

  ngOnDestroy(): void {
    this.searchSubscription?.unsubscribe();
    if (this.toastTimer) {
      clearTimeout(this.toastTimer);
    }
  }

  /**
   * Carga y sincroniza el perfil del usuario, progreso y misiones
   */
  loadState(): void {
    this.studentProfile = this.progressService.getProfile();
    this.gamification = this.progressService.getGamificationState();
    this.allTasks = this.progressService.getDashboardTasks();
    this.dailyTasks = [...this.allTasks];
    this.filteredTopics = [...this.topics];
    this.filterItems(this.searchTerm);
    this.cdr.markForCheck();
  }

  /**
   * Actualiza el grado del estudiante en el perfil sincronizado
   */
  onGradeChange(newGrade: string): void {
    this.progressService.setProfileGrade(newGrade);
    this.studentProfile.grade = newGrade;
    this.showToast(`Grado actualizado a ${newGrade}`);
    this.cdr.markForCheck();
  }

  /**
   * Alternar estado completado de una tarea/misión diaria con recompensa de XP en tiempo real
   */
  toggleTask(id: number): void {
    const result = this.progressService.toggleDashboardTask(id);
    this.allTasks = result.tasks;
    this.filterItems(this.searchTerm);
    this.gamification = this.progressService.getGamificationState();

    if (result.xpGained > 0) {
      this.showToast(`¡Misión cumplida! Ganaste +${result.xpGained} XP ⚡`);
    } else if (result.xpGained < 0) {
      this.showToast(`Misión desmarcada (${result.xpGained} XP)`);
    }

    this.cdr.markForCheck();
  }

  /**
   * Filtrado en tiempo real de unidades y misiones
   */
  filterItems(term: string): void {
    const cleanTerm = term.trim().toLowerCase();

    if (!cleanTerm) {
      this.filteredTopics = [...this.topics];
      this.dailyTasks = [...this.allTasks];
      return;
    }

    // Filtrar unidades de la Ruta del Conocimiento
    this.filteredTopics = this.topics.filter(topic =>
      topic.title.toLowerCase().includes(cleanTerm) ||
      topic.description.toLowerCase().includes(cleanTerm) ||
      topic.unit.toLowerCase().includes(cleanTerm)
    );

    // Filtrar misiones diarias
    this.dailyTasks = this.allTasks.filter(task =>
      task.title.toLowerCase().includes(cleanTerm)
    );
  }

  /**
   * Limpiar input de búsqueda
   */
  clearSearch(): void {
    this.searchTerm = '';
    this.searchControl.setValue('');
    this.cdr.markForCheck();
  }

  /**
   * Muestra notificación flotante dinámica en el dashboard
   */
  private showToast(message: string): void {
    if (this.toastTimer) {
      clearTimeout(this.toastTimer);
    }
    this.toastMessage = message;
    this.cdr.markForCheck();

    this.toastTimer = setTimeout(() => {
      this.toastMessage = null;
      this.cdr.markForCheck();
    }, 3500);
  }

  /**
   * Conteo dinámico de misiones completadas
   */
  get completedTasksCount(): number {
    return this.allTasks.filter(t => t.completed).length;
  }
}

import { Component, OnInit, OnDestroy, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';

export interface DailyTask {
  id: number;
  title: string;
  completed: boolean;
}

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
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class DashboardComponent implements OnInit, OnDestroy {
  private cdr = inject(ChangeDetectorRef);

  // 1. Buscador reactivo dinámico individual (Clase 5a)
  searchControl = new FormControl('');
  searchTerm: string = '';
  private searchSubscription?: Subscription;

  // 2. Arreglo de tareas/misiones diarias (Clases 4a y 4b)
  allTasks: DailyTask[] = [
    { id: 1, title: 'Completar test de enlace atómico', completed: false },
    { id: 2, title: 'Calibrar simulador de temperatura en gases', completed: true },
    { id: 3, title: 'Identificar 3 compuestos orgánicos', completed: false },
    { id: 4, title: 'Balancear ecuación de combustión del metano', completed: false }
  ];
  dailyTasks: DailyTask[] = [];

  // 3. Unidades de la Ruta del Conocimiento (Clase 3)
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
    // Inicialización de colecciones visibles
    this.dailyTasks = [...this.allTasks];
    this.filteredTopics = [...this.topics];

    // Escucha en tiempo real de valueChanges sin recargar la página (Clase 5a)
    this.searchSubscription = this.searchControl.valueChanges.subscribe(searchTerm => {
      this.searchTerm = searchTerm ?? '';
      this.filterItems(this.searchTerm);
      this.cdr.markForCheck();
    });
  }

  ngOnDestroy(): void {
    this.searchSubscription?.unsubscribe();
  }

  // Alternar estado completado de una tarea/misión (Clases 4a y 4b)
  toggleTask(id: number): void {
    const task = this.allTasks.find(t => t.id === id);
    if (task) {
      task.completed = !task.completed;
    }
    const visibleTask = this.dailyTasks.find(t => t.id === id);
    if (visibleTask && visibleTask !== task) {
      visibleTask.completed = task ? task.completed : !visibleTask.completed;
    }
    this.cdr.markForCheck();
  }

  // Filtrado en tiempo real de unidades y misiones
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

  // Limpiar input de búsqueda
  clearSearch(): void {
    this.searchTerm = '';
    this.searchControl.setValue('');
    this.cdr.markForCheck();
  }

  // Conteo dinámico de misiones completadas
  get completedTasksCount(): number {
    return this.allTasks.filter(t => t.completed).length;
  }
}

import { Component, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

/** Individual student with grade on a 1.0 to 5.0 scale */
export interface ClassroomStudent {
  nombre: string;
  nota: number;
  estado: 'Passing' | 'At risk' | 'Outstanding';
}

/** Classroom / teacher group card */
export interface ClassroomGroup {
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
  filtro: string;   // 'all' | '10' | '11' | 'stem'
  estudiantes: ClassroomStudent[];
}

/** Form for creating a new group */
export interface NewGroupForm {
  nombre: string;
  tag: string;
  ubicacion: string;
  horario: string;
  totalEstudiantes: number;
  filtro: string;
}

@Component({
  selector: 'app-my-classrooms',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './my-classrooms.html',
  styleUrl: './my-classrooms.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MyClassroomsComponent {

  // ── Search & Filter State ─────────────────────────────────
  searchQuery = '';
  filtroActivo = 'all';

  // ── Modals ────────────────────────────────────────────────
  isCrearModalOpen    = false;
  isEstudiantesOpen   = false;
  isAsignarModalOpen  = false;
  aulaSeleccionada: ClassroomGroup | null = null;
  toastMessage: string | null = null;

  /** Create Group modal form */
  nuevoGrupo: NewGroupForm = {
    nombre: '',
    tag: 'INTERMEDIATE',
    ubicacion: '',
    horario: '',
    totalEstudiantes: 25,
    filtro: 'all'
  };

  /** Workshop selected in the Assign modal */
  tallerSeleccionado = 'Acid-Base Titration';

  readonly talleresDisponibles = [
    'Acid-Base Titration',
    'Redox Balancing & Stoichiometry',
    'Atomic Models & Periodic Table',
    'Organic Nomenclature IUPAC',
    'Thermochemistry & Enthalpy',
    '3D Molecular Bond Simulation'
  ];

  // ── Main Data ─────────────────────────────────────────────
  aulas: ClassroomGroup[] = [
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
        { nombre: 'Valeria Góngora',    nota: 4.9, estado: 'Outstanding' },
        { nombre: 'Mateo Rincón',       nota: 4.3, estado: 'Passing'     },
        { nombre: 'Sara Pulido',        nota: 3.8, estado: 'Passing'     },
        { nombre: 'Daniel Ospina',      nota: 2.8, estado: 'At risk'     },
        { nombre: 'Lucía Mendoza',      nota: 4.7, estado: 'Outstanding' },
        { nombre: 'Tomás Herrera',      nota: 3.5, estado: 'Passing'     }
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
        { nombre: 'Andrés Castro',      nota: 4.5, estado: 'Outstanding' },
        { nombre: 'Isabela Torres',     nota: 4.0, estado: 'Passing'     },
        { nombre: 'Felipe Suárez',      nota: 2.6, estado: 'At risk'     },
        { nombre: 'Mariana Lozano',     nota: 3.9, estado: 'Passing'     },
        { nombre: 'Sebastián Ruiz',     nota: 4.8, estado: 'Outstanding' }
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
        { nombre: 'Camila Reyes',       nota: 4.9, estado: 'Outstanding' },
        { nombre: 'Nicolás Vargas',     nota: 4.6, estado: 'Outstanding' },
        { nombre: 'Alejandra Mora',     nota: 4.3, estado: 'Passing'     },
        { nombre: 'Samuel Pinto',       nota: 3.7, estado: 'Passing'     },
        { nombre: 'Gabriela Ríos',      nota: 2.9, estado: 'At risk'     }
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
        { nombre: 'Elena Sandoval',     nota: 5.0, estado: 'Outstanding' },
        { nombre: 'Martín Correa',      nota: 4.9, estado: 'Outstanding' },
        { nombre: 'Paula Jiménez',      nota: 4.8, estado: 'Outstanding' },
        { nombre: 'Rodrigo Nieto',      nota: 4.7, estado: 'Outstanding' }
      ]
    }
  ];

  constructor(private cdr: ChangeDetectorRef) {}

  // ── Computed ──────────────────────────────────────────────

  get aulasFiltradas(): ClassroomGroup[] {
    const q = this.searchQuery.trim().toLowerCase();
    return this.aulas.filter(a => {
      const matchFiltro = this.filtroActivo === 'all' || a.filtro === this.filtroActivo;
      if (!matchFiltro) return false;
      if (!q) return true;
      return (
        a.nombre.toLowerCase().includes(q) ||
        a.ubicacion.toLowerCase().includes(q) ||
        a.moduloActivo.toLowerCase().includes(q)
      );
    });
  }

  contarPorFiltro(f: string): number {
    return f === 'all'
      ? this.aulas.length
      : this.aulas.filter(a => a.filtro === f).length;
  }

  // ── Interaction ───────────────────────────────────────────

  setFiltro(f: string): void {
    this.filtroActivo = f;
    this.cdr.markForCheck();
  }

  verEstudiantes(aula: ClassroomGroup): void {
    this.aulaSeleccionada = aula;
    this.isEstudiantesOpen = true;
    this.cdr.markForCheck();
  }

  cerrarEstudiantes(): void {
    this.isEstudiantesOpen = false;
    this.aulaSeleccionada = null;
    this.cdr.markForCheck();
  }

  abrirAsignarTaller(aula: ClassroomGroup): void {
    this.aulaSeleccionada = aula;
    this.isAsignarModalOpen = true;
    this.cdr.markForCheck();
  }

  cerrarAsignarTaller(): void {
    this.isAsignarModalOpen = false;
    this.aulaSeleccionada = null;
    this.cdr.markForCheck();
  }

  confirmarAsignacion(): void {
    const nombre = this.aulaSeleccionada?.nombre ?? '';
    this.cerrarAsignarTaller();
    this.showToast(`✅ Workshop "${this.tallerSeleccionado}" assigned to ${nombre}`);
  }

  abrirCrearModal(): void {
    this.nuevoGrupo = { nombre: '', tag: 'INTERMEDIATE', ubicacion: '', horario: '', totalEstudiantes: 25, filtro: 'all' };
    this.isCrearModalOpen = true;
    this.cdr.markForCheck();
  }

  cerrarCrearModal(): void {
    this.isCrearModalOpen = false;
    this.cdr.markForCheck();
  }

  crearGrupo(): void {
    if (!this.nuevoGrupo.nombre.trim() || !this.nuevoGrupo.ubicacion.trim()) {
      this.showToast('Please fill in the group name and classroom location.');
      return;
    }
    const tagMap: Record<string, string> = {
      'INTERMEDIATE':     'tag-blue',
      'LAB PRACTICE':     'tag-purple',
      'ADVANCED':         'tag-green',
      'HIGH PERFORMANCE': 'tag-amber'
    };
    const nuevo: ClassroomGroup = {
      id: 'aula-' + Date.now(),
      nombre: this.nuevoGrupo.nombre,
      tag: this.nuevoGrupo.tag,
      tagClass: tagMap[this.nuevoGrupo.tag] ?? 'tag-blue',
      ubicacion: this.nuevoGrupo.ubicacion,
      horario: this.nuevoGrupo.horario || 'TBD',
      totalEstudiantes: this.nuevoGrupo.totalEstudiantes,
      promedio: 0,
      semanaActual: 1,
      semanasTotal: 10,
      moduloActivo: 'Not assigned',
      progreso: 0,
      filtro: this.nuevoGrupo.filtro,
      estudiantes: []
    };
    this.aulas = [...this.aulas, nuevo];
    this.cerrarCrearModal();
    this.showToast(`🎉 Group "${nuevo.nombre}" created successfully.`);
  }

  showToast(msg: string): void {
    this.toastMessage = msg;
    this.cdr.markForCheck();
    setTimeout(() => { this.toastMessage = null; this.cdr.markForCheck(); }, 4000);
  }

  progresoColor(p: number): string {
    if (p >= 85) return '#10b981';
    if (p >= 60) return '#00a2ed';
    return '#f59e0b';
  }
}


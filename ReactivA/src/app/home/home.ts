import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { StudentProgressService, StudentProfile, GamificationState } from '../dashboard/student-progress.service';
import { AuthService } from '../core/auth/auth.service';

/**
 * Tarjeta Informativa de Módulo para el Home (Solo presentación informativa)
 */
export interface FeatureModuleCard {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  badge: string;
  description: string;
  icon: string;
  themeColor: 'blue' | 'emerald' | 'purple' | 'amber';
  highlights: string[];
}

/**
 * Métrica Pedagógica o Estadística Curricular (MEN)
 */
export interface PedagogicMetric {
  value: string;
  label: string;
  description: string;
  icon: string;
  accent: 'blue' | 'emerald' | 'purple' | 'amber';
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.scss'
})
export class HomeComponent implements OnInit {
  private progressService = inject(StudentProgressService);
  readonly authService = inject(AuthService);

  get hasActiveSession(): boolean {
    return this.authService.isAuthenticated();
  }

  get dashboardUrl(): string {
    const role = this.authService.role();
    return this.authService.homeFor(role ?? 'estudiante');
  }

  get dashboardLabel(): string {
    return this.authService.role() === 'docente' ? 'Panel Docente' : 'Ir a mi Dashboard';
  }

  get profile(): StudentProfile {
    return this.progressService.getProfile();
  }

  get gamification(): GamificationState {
    return this.progressService.getGamificationState();
  }

  ngOnInit(): void {
    // Si hay sesión activa en navegador, asegurar hidratación
    if (this.authService.isAuthenticated()) {
      this.progressService.hydrate().then();
    }
  }

  /**
   * Colección de módulos informativos de ReactivA.
   */
  readonly modules: FeatureModuleCard[] = [
    {
      id: 'periodic-table',
      title: 'Tabla Periódica Interactiva',
      subtitle: 'Matriz Cuántica & Modelo de Bohr',
      category: 'Estructura Atómica',
      badge: '118 Elementos Químicos',
      description: 'Explora familias químicas en una grilla de 18 columnas con posicionamiento atómico exacto, visor orbital de Bohr en SVG cuántico y minijuego de memoria 3D.',
      icon: 'ph-table',
      themeColor: 'blue',
      highlights: ['Matriz de 18 columnas', 'Modelo atómico de Bohr', 'Memory de parejas 3D']
    },
    {
      id: 'virtual-lab',
      title: 'Laboratorio Virtual 3D',
      subtitle: 'Simulador Molecular Interactivo',
      category: 'Experimentación Segura',
      badge: 'Reactivos & Balances',
      description: 'Experimenta con material de vidrio e instrumental de laboratorio, balancea reacciones de combustión y visualiza enlaces covalentes e iónicos en tiempo real.',
      icon: 'ph-flask',
      themeColor: 'emerald',
      highlights: ['Simulación de instrumental', 'Balanceo estequiométrico', 'Mesa de mezclas virtual']
    },
    {
      id: 'mision-organica',
      title: 'Misión Orgánica',
      subtitle: 'Domina la Química del Carbono',
      category: 'Química Grado 11°',
      badge: '4 Fases Gamificadas',
      description: 'Asciende desde Detective del Carbono hasta Maestro Orgánico resolviendo desafíos contrarreloj, estructuras de Lewis y nomenclatura IUPAC de hidrocarburos.',
      icon: 'ph-tree-structure',
      themeColor: 'purple',
      highlights: ['Hibridaciones sp3, sp2, sp', 'Nomenclatura IUPAC', 'Retos contrarreloj']
    },
    {
      id: 'challenges',
      title: 'Arena de Desafíos & Trofeos',
      subtitle: 'Competencia y Logros Curriculares',
      category: 'Gamificación & MEN',
      badge: '18 Insignias Coleccionables',
      description: 'Participa en torneos de química, acumula puntos de experiencia (XP), mantén rachas de actividad y compara tu nivel en leaderboards de clase y colegio.',
      icon: 'ph-trophy',
      themeColor: 'amber',
      highlights: ['Leaderboards en vivo', 'Torneos de temporada', 'Vitrina de 18 trofeos']
    }
  ];

  /**
   * Métricas y estadísticas pedagógicas alineadas con el Ministerio de Educación Nacional (MEN).
   */
  readonly metrics: PedagogicMetric[] = [
    {
      value: '94.2%',
      label: 'Eficiencia Pedagógica',
      description: 'Estudiantes demuestran mayor retención conceptual con modelos visuales interactivos.',
      icon: 'ph-chart-line-up',
      accent: 'emerald'
    },
    {
      value: '18',
      label: 'Insignias y Logros',
      description: 'Metas curriculares de los Estándares Básicos de Competencias en Ciencias Naturales.',
      icon: 'ph-medal',
      accent: 'amber'
    },
    {
      value: '4+',
      label: 'Módulos Integrados',
      description: 'Desde la estructura atómica hasta síntesis de cadenas complejas de hidrocarburos.',
      icon: 'ph-stack',
      accent: 'blue'
    },
    {
      value: '100%',
      label: 'Seguridad Experimental',
      description: 'Permite simular reacciones exotérmicas complejas sin riesgos físicos en el aula.',
      icon: 'ph-shield-check',
      accent: 'purple'
    }
  ];

  /**
   * Desplazamiento suave hacia la sección de módulos en el Home
   */
  scrollToModules(): void {
    if (typeof document !== 'undefined') {
      const element = document.getElementById('modules-section');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }
}

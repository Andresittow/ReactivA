import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

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
export class HomeComponent {
  /**
   * Colección de módulos informativos de ReactivA.
   * Nota: Las tarjetas son puramente informativas; para acceder se requiere iniciar sesión.
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
      badge: 'Simulación Sin Riesgos',
      description: 'Mesa de trabajo virtual para combinar reactivos químicos, deducir enlaces iónicos y covalentes, y comprobar estequiometría sin riesgos de un laboratorio físico.',
      icon: 'ph-test-tube',
      themeColor: 'emerald',
      highlights: ['Simulaciones moleculares 3D', 'Combinación de reactivos', 'Cálculos estequiométricos']
    },
    {
      id: 'organic-mission',
      title: 'Misión Orgánica: Domina el Carbono',
      subtitle: 'Química Orgánica para Grado 11',
      category: 'Gamificación Pedagógica',
      badge: '4 Niveles Progresivos',
      description: 'Supera 4 niveles temáticos: detectives del carbono, cazadores de hidrocarburos, desafío de nomenclatura IUPAC y prueba maestra con feedback didáctico.',
      icon: 'ph-tree-structure',
      themeColor: 'purple',
      highlights: ['Hibridación del carbono', 'Nomenclatura IUPAC oficial', 'Mecánicas de match & vidas']
    },
    {
      id: 'challenges-arena',
      title: 'Desafíos & Arena de Logros',
      subtitle: 'Competición & Clasificación Escolar',
      category: 'Torneos y Competencias',
      badge: 'Temporada 3 En Vivo',
      description: 'Arena competitiva escolar con torneos en vivo, leaderboard por clase y colegio, vitrina de trofeos con 18 insignias y evaluación de competencias MEN.',
      icon: 'ph-trophy',
      themeColor: 'amber',
      highlights: ['Torneo Gran Enlace Covalente', 'Leaderboard escolar', '18 Insignias coleccionables']
    },
    {
      id: 'dashboard',
      title: 'Panel de Ruta del Conocimiento',
      subtitle: 'Dashboard Central del Estudiante',
      category: 'Gestión del Aprendizaje',
      badge: 'Racha Activa 🔥',
      description: 'Organiza tus misiones diarias con checklist interactivo, buscador rápido de unidades con Reactive Forms y métricas de progreso dinámico por tema.',
      icon: 'ph-squares-four',
      themeColor: 'blue',
      highlights: ['Buscador reactivo en vivo', 'Misiones diarias To-Do', 'Racha de días activos']
    },
    {
      id: 'academic-profile',
      title: 'Perfil y Reporte Académico',
      subtitle: 'Analítica de Desempeño Escolar',
      category: 'Evaluación Curricular',
      badge: 'Estándares MEN',
      description: 'Monitorea tus competencias de indagación, explicación de fenómenos y uso comprensivo del conocimiento científico con informes detallados para docentes.',
      icon: 'ph-user-circle',
      themeColor: 'emerald',
      highlights: ['Eficiencia pedagógica (94.2%)', 'Seguimiento por estándares', 'Historial de actividades']
    }
  ];

  /**
   * Métricas y Estándares Curriculares de Ciencias Naturales (MEN)
   */
  readonly metrics: PedagogicMetric[] = [
    {
      value: '118',
      label: 'Elementos Químicos',
      description: 'Modelos cuánticos de Bohr, capas electrónicas y propiedades físicas integradas.',
      icon: 'ph-atom',
      accent: 'blue'
    },
    {
      value: '94.2%',
      label: 'Eficiencia Pedagógica',
      description: 'Tasa media de acierto al primer intento en resolución de problemas químicos.',
      icon: 'ph-chart-line-up',
      accent: 'emerald'
    },
    {
      value: '4 Niveles',
      label: 'Química del Carbono',
      description: 'Desde tetravalencia hasta formulación y nomenclatura IUPAC para grado 11.',
      icon: 'ph-tree-structure',
      accent: 'purple'
    },
    {
      value: '100%',
      label: 'Alineado al MEN',
      description: 'Cumplimiento de los Estándares Básicos de Competencias en Ciencias Naturales.',
      icon: 'ph-certificate',
      accent: 'amber'
    }
  ];

  /**
   * Desplazamiento suave hacia la sección de módulos informativos
   */
  scrollToModules(): void {
    const el = document.getElementById('modules-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
}

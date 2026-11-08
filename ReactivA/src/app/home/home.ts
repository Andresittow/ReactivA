import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

/**
 * Tarjeta de Módulo Interactivo para el Home
 */
export interface FeatureModuleCard {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  badge: string;
  description: string;
  route: string;
  icon: string;
  themeColor: 'cyan' | 'emerald' | 'purple' | 'amber' | 'blue' | 'rose';
  stats: string;
  actionText: string;
}

/**
 * Métrica Pedagógica o Estadística Clave
 */
export interface PedagogicMetric {
  value: string;
  label: string;
  description: string;
  icon: string;
  accent: 'emerald' | 'cyan' | 'purple' | 'amber';
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
   * Colección de módulos principales interactivos ya implementados en ReactivA
   */
  readonly modules: FeatureModuleCard[] = [
    {
      id: 'periodic-table',
      title: 'Tabla Periódica & Modelo de Bohr',
      subtitle: 'Matriz Cuántica de 18 Columnas',
      category: 'Estructura Atómica',
      badge: '118 Elementos · 3D Memory',
      description: 'Explora familias químicas en una matriz de 18 columnas con posicionamiento exacto, visor de Bohr en SVG cuántico y desafía tu mente con el minijuego Memory en 3D.',
      route: '/periodic-table',
      icon: 'ph-table',
      themeColor: 'cyan',
      stats: '118 elementos · Gráficos cuánticos',
      actionText: 'Explorar Matriz'
    },
    {
      id: 'virtual-lab',
      title: 'Laboratorio Virtual 3D',
      subtitle: 'Simulador Molecular Interactivo',
      category: 'Experimentación Segura',
      badge: 'Simulación en Vivo',
      description: 'Mesa de trabajo tridimensional para mezclar reactivos químicos, simular enlaces iónicos y covalentes, y calcular estequiometría sin riesgos de un laboratorio físico.',
      route: '/virtual-lab',
      icon: 'ph-test-tube',
      themeColor: 'emerald',
      stats: 'Fórmulas 3D · Cero riesgos',
      actionText: 'Entrar al Lab'
    },
    {
      id: 'organic-mission',
      title: 'Misión Orgánica: Domina el Carbono',
      subtitle: 'Química Orgánica para Grado 11',
      category: 'Gamificación Pedagógica',
      badge: '4 Niveles · Vidas & XP',
      description: 'Supera 4 niveles progresivos: detectives del carbono, hidrocarburos, desafío de nomenclatura IUPAC y prueba maestra con feedback didáctico adaptado.',
      route: '/mision-organica',
      icon: 'ph-tree-structure',
      themeColor: 'purple',
      stats: '4 Niveles · Match & IUPAC',
      actionText: 'Iniciar Misión'
    },
    {
      id: 'challenges-arena',
      title: 'Desafíos & Arena de Logros',
      subtitle: 'Competición & Clasificación Escolar',
      category: 'Torneos y Gamificación',
      badge: 'Temporada 3 En Vivo',
      description: 'Arena de torneos escolares en vivo (Gran Enlace Covalente), vitrina con 18 trofeos coleccionables, ranking por clase y evaluación de competencias MEN.',
      route: '/challenges',
      icon: 'ph-trophy',
      themeColor: 'amber',
      stats: 'Temporada 3 · 18 Insignias',
      actionText: 'Ver Clasificación'
    },
    {
      id: 'dashboard',
      title: 'Panel de Ruta del Conocimiento',
      subtitle: 'Dashboard Central del Estudiante',
      category: 'Gestión del Aprendizaje',
      badge: 'Racha Activa 🔥',
      description: 'Visualiza tus misiones diarias con checklist interactivo, buscador rápido de unidades con Reactive Forms y métricas de avance dinámico por unidad.',
      route: '/dashboard',
      icon: 'ph-squares-four',
      themeColor: 'blue',
      stats: 'Racha 5 días · Misiones To-Do',
      actionText: 'Ir al Dashboard'
    },
    {
      id: 'academic-profile',
      title: 'Perfil y Reporte Académico',
      subtitle: 'Analítica de Desempeño',
      category: 'Evaluación Curricular',
      badge: 'Estándares MEN',
      description: 'Monitorea tus competencias de indagación, explicación de fenómenos y uso comprensivo del conocimiento científico con informes detallados para docentes.',
      route: '/profile',
      icon: 'ph-user-circle',
      themeColor: 'rose',
      stats: '94.2% Eficiencia · Grado 10°-11°',
      actionText: 'Ver Perfil'
    }
  ];

  /**
   * Métricas Pedagógicas y Estándares Curriculares (MEN)
   */
  readonly metrics: PedagogicMetric[] = [
    {
      value: '118',
      label: 'Elementos Químicos',
      description: 'Modelos cuánticos de Bohr, capas cuánticas y propiedades físicas integradas.',
      icon: 'ph-atom',
      accent: 'cyan'
    },
    {
      value: '94.2%',
      label: 'Eficiencia Pedagógica',
      description: 'Tasa media de acierto al primer intento en problemas y balanceo redox.',
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
      description: 'Cumplimiento estricto de los Estándares Básicos de Competencias en Ciencias.',
      icon: 'ph-certificate',
      accent: 'amber'
    }
  ];

  /**
   * Desplazamiento suave hacia la sección de módulos
   */
  scrollToModules(): void {
    const el = document.getElementById('modules-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
}


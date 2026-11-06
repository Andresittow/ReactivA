import { Component, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

/** Tarjeta de categoría de ayuda rápida. */
export interface HelpCategory {
  id: string;
  title: string;
  description: string;
  icon: string;
  colorTheme: 'blue' | 'purple' | 'cyan' | 'amber';
  tags: string[];
  linkRoute: string;
}

/** Pregunta frecuente del acordeón interactivo. */
export interface FaqItem {
  id: string;
  question: string;
  answerHtml: string;
  categoryLabel: string;
  isOpen: boolean;
}

/** Paso de la Guía Rápida de Uso (1-2-3). */
export interface GuideStep {
  stepBadge: string;
  title: string;
  subtitle: string;
  description: string;
  tip: string;
  icon: string;
  colorTheme: 'cyan' | 'blue' | 'purple';
}

@Component({
  selector: 'app-help',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './help.html',
  styleUrl: './help.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HelpComponent {

  /** Notificación flotante (toast) */
  toastMessage: string | null = null;

  /** 1. Categorías de Ayuda Rápida */
  readonly categories: HelpCategory[] = [
    {
      id: 'virtual-lab',
      title: 'Simulador & Virtual Lab',
      description: 'Cómo armar experimentos, seleccionar equipos de laboratorio (buretas, matraces, mecheros Bunsen) y balancear ecuaciones de estequiometría y óxido-reducción.',
      icon: 'ph ph-test-tube',
      colorTheme: 'cyan',
      tags: ['Equipos & Reactivos', 'Estequiometría', 'Reacciones Redox', 'Simulación 3D'],
      linkRoute: '/virtual-lab'
    },
    {
      id: 'periodic-table',
      title: 'Tabla Periódica Interactiva',
      description: 'Uso de filtros por familias químicas (metales, no metales, gases nobles), propiedades atómicas y visualizador del modelo orbital de Bohr.',
      icon: 'ph ph-table',
      colorTheme: 'purple',
      tags: ['Familias Químicas', 'Modelo de Bohr', 'Configuración Electrónica', 'Electronegatividad'],
      linkRoute: '/tabla-periodica'
    },
    {
      id: 'organic-mission',
      title: 'Misión Orgánica & Desafíos',
      description: 'Sistema de gamificación: racha diaria de estudio, puntos de experiencia XP, vidas de laboratorio, insignias y tabla de clasificación por rangos.',
      icon: 'ph ph-tree-structure',
      colorTheme: 'amber',
      tags: ['Racha Diaria', 'Puntos XP', 'Vidas & Desafíos', 'Grupos Funcionales'],
      linkRoute: '/mision-organica'
    },
    {
      id: 'profile',
      title: 'Perfil & Calificaciones',
      description: 'Consulta tu historial de prácticas, notas en escala 1.0 a 5.0, dominio por ramas de la química y descarga tu Ficha Académica Oficial en PDF.',
      icon: 'ph ph-user-circle',
      colorTheme: 'blue',
      tags: ['Historial de Notas', 'Rúbricas Oficiales', 'Escala 1.0 a 5.0', 'Descargar PDF'],
      linkRoute: '/profile'
    }
  ];

  /** 2. Guía Rápida de Uso (Pasos 1-2-3) */
  readonly guideSteps: GuideStep[] = [
    {
      stepBadge: 'Paso 1',
      title: 'Selecciona tu Práctica o Módulo',
      subtitle: 'Ruta Curricular Disponible',
      description: 'Ingresa al Dashboard o Virtual Lab y escoge la experiencia pedagógica asignada: enlaces moleculares, estequiometría y balanceo, titulación ácido-base o química orgánica.',
      tip: 'Consulta previamente los objetivos de aprendizaje y las rúbricas de evaluación oficiales asignadas por tu docente.',
      icon: 'ph ph-target',
      colorTheme: 'cyan'
    },
    {
      stepBadge: 'Paso 2',
      title: 'Utiliza el Equipo y Reactivos',
      subtitle: 'Mesa de Trabajo Interactiva 3D',
      description: 'Añade matraces Erlenmeyer, buretas graduadas, pipetas y mecheros Bunsen. Ajusta concentraciones molares, balancea coeficientes en tiempo real y observa las reacciones termoquímicas.',
      tip: 'Puedes repetir los intentos cuantas veces necesites para mejorar la precisión del punto de equivalencia.',
      icon: 'ph ph-toolbox',
      colorTheme: 'blue'
    },
    {
      stepBadge: 'Paso 3',
      title: 'Revisa tu Feedback y Descarga el PDF',
      subtitle: 'Calificaciones en Escala 1.0 a 5.0',
      description: 'Al finalizar, dirígete a tu Perfil para consultar tu promedio, retroalimentación del docente y la rúbrica criterio por criterio. Descarga tu Ficha Académica en PDF.',
      tip: 'Repite las simulaciones para perfeccionar tu precisión y elevar tu promedio general en el historial de prácticas.',
      icon: 'ph ph-certificate',
      colorTheme: 'purple'
    }
  ];

  /** 3. Banco de Preguntas Frecuentes (FAQ Acordeón) */
  faqs: FaqItem[] = [
    {
      id: 'faq-balanceo',
      question: '¿Cómo balanceo una ecuación en el Laboratorio Virtual?',
      categoryLabel: 'Simulador & Virtual Lab',
      isOpen: true,
      answerHtml: `
        <p>El módulo de <strong>Balanceo de Ecuaciones Químicas</strong> de ReactivA valida la <em>Ley de Conservación de la Materia</em> en tiempo real:</p>
        <ol>
          <li><strong>Identifica reactivos y productos:</strong> observa la cantidad de átomos de cada elemento a ambos lados de la flecha reactiva.</li>
          <li><strong>Modifica únicamente los coeficientes estequiométricos:</strong> utiliza los selectores <code>+</code> y <code>-</code> delante de cada molécula. <em>Nunca alteres los subíndices químicos</em>.</li>
          <li><strong>Aplica el método de tanteo sugerido:</strong> balancea en orden: <em>Metales → No metales → Hidrógeno → Oxígeno</em>.</li>
          <li><strong>Confirmación instantánea:</strong> cuando todos los elementos estén balanceados en proporciones mínimas enteras, el sistema activará el indicador de aprobación y sumará <strong>+25 XP</strong> a tu racha.</li>
        </ol>
      `
    },
    {
      id: 'faq-xp-racha',
      question: '¿Cómo funcionan los puntos XP y el sistema de racha diaria?',
      categoryLabel: 'Misión Orgánica & Desafíos',
      isOpen: false,
      answerHtml: `
        <p>ReactivA integra un sistema de gamificación formativa para recompensar la constancia investigativa:</p>
        <ul>
          <li><strong>Puntos de Experiencia (XP):</strong> se obtienen al resolver retos de balanceo (+25 XP), simulaciones 3D (+50 XP) y misiones de nomenclatura orgánica (+30 XP). Al acumular XP asciendes de rango: de <em>Aprendiz de Laboratorio</em> a <em>Alquimista Teórico</em> o <em>Maestro Molecular</em>.</li>
          <li><strong>Racha Máxima (Días consecutivos):</strong> indicada con el icono 🔥 en tu Perfil. Avanza +1 día por cada jornada en que completes al menos una práctica o ejercicio.</li>
          <li><strong>Vidas e Intentos:</strong> en Misión Orgánica dispones de vidas de prueba que se regeneran para promover el aprendizaje a partir del error.</li>
        </ul>
      `
    },
    {
      id: 'faq-tabla-periodica',
      question: '¿Cómo uso los filtros y el modelo 3D de la Tabla Periódica?',
      categoryLabel: 'Tabla Periódica Interactiva',
      isOpen: false,
      answerHtml: `
        <p>La <strong>Tabla Periódica Interactiva</strong> ofrece herramientas avanzadas para explorar los 118 elementos:</p>
        <ul>
          <li><strong>Filtros por Familias:</strong> selecciona categorías como Alcalinos, Alcalinotérreos, Metales de Transición, Halógenos o Gases Nobles para resaltarlos.</li>
          <li><strong>Visualizador de Bohr:</strong> haz clic en cualquier elemento (ej. Carbono, Hierro, Oxígeno) para desplegar el modal con niveles de energía orbitales, electrones en movimiento y configuración electrónica condensada.</li>
          <li><strong>Datos Físicos y Termodinámicos:</strong> consulta electronegatividad de Pauling, masa atómica, radio atómico y estados de oxidación (IUPAC).</li>
        </ul>
      `
    },
    {
      id: 'faq-notas-perfil',
      question: '¿Qué debo hacer si una práctica no aparece en mi perfil?',
      categoryLabel: 'Perfil & Calificaciones',
      isOpen: false,
      answerHtml: `
        <p>El registro de calificaciones está sincronizado con la <strong>Cátedra de Ciencias Experimentales</strong>:</p>
        <ul>
          <li><strong>Escala Oficial (1.0 a 5.0):</strong> la nota mínima de aprobación curricular es <strong>3.0 / 5.0</strong>. Las prácticas de excelencia se marcan como <em>"Aprobado con Mención" (5.0)</em>.</li>
          <li><strong>Finalización de sesión:</strong> asegúrate de hacer clic en <em>"Finalizar Simulación / Guardar Práctica"</em> al terminar en el Virtual Lab para que la telemetría quede registrada.</li>
          <li><strong>Comprobación en Perfil:</strong> visita la sección <strong>Profile</strong>. Si la nota no aparece, recarga la página o verifica tu conexión institucional.</li>
          <li><strong>Rúbricas Oficiales:</strong> haz clic en el icono 👁️ de cualquier práctica para examinar la retroalimentación y el desglose de criterios evaluados por el docente.</li>
        </ul>
      `
    },
    {
      id: 'faq-pdf',
      question: '¿Cómo descargo mi Ficha Académica en formato PDF?',
      categoryLabel: 'Perfil & Calificaciones',
      isOpen: false,
      answerHtml: `
        <p>Para obtener tu reporte oficial de evidencias de laboratorio:</p>
        <ol>
          <li>Ingresa a la sección <strong>Profile</strong> desde la barra lateral de navegación.</li>
          <li>En el encabezado superior, haz clic en el botón azul <strong>"Descargar Ficha (PDF)"</strong>.</li>
          <li>El sistema generará tu documento con promedio lab (escala 1.0 a 5.0), horas acumuladas en el simulador, gráfico de dominio por ramas de la química e historial de prácticas validadas con sus rúbricas.</li>
          <li>Guárdalo como PDF o imprímelo directamente para entregarlo a tu docente titular.</li>
        </ol>
      `
    }
  ];

  constructor(private cdr: ChangeDetectorRef) {}

  /** Alterna la expansión de una pregunta frecuente */
  toggleFaq(id: string): void {
    const target = this.faqs.find(f => f.id === id);
    if (target) {
      target.isOpen = !target.isOpen;
      this.cdr.markForCheck();
    }
  }

  /** Muestra un mensaje flotante temporal (toast) */
  showToast(message: string): void {
    this.toastMessage = message;
    this.cdr.markForCheck();
    setTimeout(() => {
      this.toastMessage = null;
      this.cdr.markForCheck();
    }, 4000);
  }
}

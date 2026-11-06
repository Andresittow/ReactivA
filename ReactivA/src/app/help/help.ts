import { Component, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

/**
 * Representa una tarjeta de categoría de ayuda rápida.
 */
export interface HelpCategory {
  id: string;
  title: string;
  description: string;
  icon: string;
  colorTheme: 'blue' | 'purple' | 'cyan' | 'amber';
  tags: string[];
  linkRoute: string;
}

/**
 * Representa una pregunta frecuente del acordeón interactivo.
 */
export interface FaqItem {
  id: string;
  question: string;
  answerHtml: string;
  category: string;
  categoryLabel: string;
  isOpen: boolean;
  tags: string[];
}

/**
 * Paso de la Guía Rápida de Simulación (1-2-3).
 */
export interface SimulationStep {
  stepNumber: number;
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
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './help.html',
  styleUrl: './help.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HelpComponent {
  /**
   * Texto de búsqueda en tiempo real
   */
  searchQuery: string = '';

  /**
   * Filtro de categoría activo ('all' o id específico)
   */
  selectedCategory: string = 'all';

  /**
   * Notificación flotante (toast)
   */
  toastMessage: string | null = null;

  /**
   * Estado del modal de contacto institucional / soporte
   */
  isContactModalOpen: boolean = false;

  /**
   * Formulario de contacto con soporte
   */
  contactTicket = {
    name: 'Valeria Góngora',
    grade: 'Grado 11° - Grupo B',
    topic: 'virtual-lab',
    subject: '',
    message: ''
  };

  /**
   * 1. Categorías de Ayuda Rápida
   */
  readonly categories: HelpCategory[] = [
    {
      id: 'account',
      title: 'Inicio & Cuenta',
      description: 'Guía de navegación entre vistas principales: Dashboard, Tabla Periódica, Virtual Lab, Challenges y Perfil del Estudiante.',
      icon: 'ph ph-squares-four',
      colorTheme: 'blue',
      tags: ['Dashboard', 'Navegación', 'Perfil Académico', 'Ajustes'],
      linkRoute: '/dashboard'
    },
    {
      id: 'virtual-lab',
      title: 'Simulador & Virtual Lab',
      description: 'Cómo armar experimentos, seleccionar equipos (buretas, matraces, mecheros Bunsen) y balancear ecuaciones químicas.',
      icon: 'ph ph-test-tube',
      colorTheme: 'cyan',
      tags: ['Equipos & Reactivos', 'Estequiometría', 'Reacciones Redox', 'Simulación 3D'],
      linkRoute: '/virtual-lab'
    },
    {
      id: 'periodic-table',
      title: 'Tabla Periódica Interactiva',
      description: 'Uso de filtros por familias químicas (metales, no metales, gases nobles), propiedades atómicas y visualizador 3D de Bohr.',
      icon: 'ph ph-table',
      colorTheme: 'purple',
      tags: ['Familias Químicas', 'Modelo de Bohr', 'Configuración Electrónica', 'Electronegatividad'],
      linkRoute: '/tabla-periodica'
    },
    {
      id: 'organic-mission',
      title: 'Misión Orgánica & Desafíos',
      description: 'Sistema de gamificación: racha diaria de estudio, puntos de experiencia XP, vidas de laboratorio, insignias y ranking.',
      icon: 'ph ph-tree-structure',
      colorTheme: 'amber',
      tags: ['Racha Diaria', 'Puntos XP', 'Vidas & Desafíos', 'Grupos Funcionales'],
      linkRoute: '/mision-organica'
    }
  ];

  /**
   * 2. Guía Rápida de Simulación (Pasos 1-2-3)
   */
  readonly simulationSteps: SimulationStep[] = [
    {
      stepNumber: 1,
      stepBadge: 'Paso 1',
      title: 'Selecciona tu Práctica o Módulo',
      subtitle: 'Ruta Curricular y Laboratorios Disponibles',
      description: 'Ingresa al Dashboard o Virtual Lab y escoge la experiencia pedagógica asignada: enlaces químicos moleculares, estequiometría y balanceo, titulación ácido-base o química orgánica.',
      tip: 'Consulta previamente los objetivos de aprendizaje y las rúbricas de evaluación oficiales asignadas por tu docente.',
      icon: 'ph ph-target',
      colorTheme: 'cyan'
    },
    {
      stepNumber: 2,
      stepBadge: 'Paso 2',
      title: 'Utiliza el Equipo y Reactivos',
      subtitle: 'Mesa de Trabajo Interactiva 3D',
      description: 'Añade matraces Erlenmeyer, buretas graduadas, pipetas y mecheros Bunsen. Ajusta concentraciones molares, balancea coeficientes numéricos en tiempo real y observa las reacciones termoquímicas.',
      tip: '¿Tienes dudas teóricas? Haz clic en "Asistente Átomo" en la barra lateral para recibir pistas y orientación guiada.',
      icon: 'ph ph-toolbox',
      colorTheme: 'blue'
    },
    {
      stepNumber: 3,
      stepBadge: 'Paso 3',
      title: 'Revisa Feedback y Descarga tu PDF',
      subtitle: 'Calificaciones Oficiales Escala 1.0 a 5.0',
      description: 'Al finalizar la simulación, dirígete a tu Perfil (Profile) para consultar tu promedio, retroalimentación detallada del docente y la rúbrica criterio por criterio. Descarga tu Ficha Académica en PDF.',
      tip: 'Puedes repetir simulaciones para perfeccionar tu margen de precisión y elevar tu promedio general.',
      icon: 'ph ph-certificate',
      colorTheme: 'purple'
    }
  ];

  /**
   * 3. Banco de Preguntas Frecuentes (FAQ Acordeón)
   */
  faqs: FaqItem[] = [
    {
      id: 'faq-balanceo',
      question: '¿Cómo balanceo una ecuación en el Laboratorio Virtual?',
      answerHtml: `
        <p>El módulo de <strong>Balanceo de Ecuaciones Químicas</strong> de ReactivA valida la <em>Ley de Conservación de la Materia</em> en tiempo real:</p>
        <ol>
          <li><strong>Identifica reactivos y productos:</strong> observa la cantidad de átomos de cada elemento a ambos lados de la flecha reactiva.</li>
          <li><strong>Modifica únicamente los coeficientes estequiométricos:</strong> utiliza los selectores numéricos (<code>+</code> y <code>-</code>) delante de cada molécula. <em>Recuerda que nunca debes alterar los subíndices químicos</em>.</li>
          <li><strong>Aplica el método de tanteo sugerido:</strong> balancea en orden: <em>Metales → No metales → Hidrógeno → Oxígeno</em>.</li>
          <li><strong>Confirmación instantánea:</strong> cuando todos los elementos estén balanceados en proporciones mínimas enteras, el sistema activará el indicador de aprobación y sumará <strong>+25 XP</strong> a tu racha.</li>
        </ol>
      `,
      category: 'virtual-lab',
      categoryLabel: 'Simulador & Virtual Lab',
      isOpen: true,
      tags: ['balanceo', 'ecuaciones', 'estequiometría', 'coeficientes', 'virtual lab', 'química']
    },
    {
      id: 'faq-xp-racha',
      question: '¿Cómo funcionan los puntos XP y el sistema de racha diaria?',
      answerHtml: `
        <p>ReactivA integra un sistema de gamificación formativa para recompensar tu constancia investigativa:</p>
        <ul>
          <li><strong>Puntos de Experiencia (XP):</strong> se obtienen al resolver retos de balanceo (+25 XP), simulaciones 3D (+50 XP) y misiones de nomenclatura orgánica (+30 XP). Al acumular XP asciendes de rango: de <em>Aprendiz de Laboratorio</em> a <em>Alquimista Teórico</em> o <em>Maestro Molecular</em>.</li>
          <li><strong>Racha Máxima (Días consecutivos):</strong> indicada con el icono de fuego 🔥 en tu Perfil. Avanza +1 día por cada jornada en la que completes al menos una práctica o ejercicio en la plataforma.</li>
          <li><strong>Vidas e Intentos:</strong> en Misión Orgánica dispones de vidas de prueba que se regeneran para promover el aprendizaje a partir del error.</li>
        </ul>
      `,
      category: 'organic-mission',
      categoryLabel: 'Misión Orgánica & Desafíos',
      isOpen: false,
      tags: ['xp', 'racha', 'puntos', 'vidas', 'alquimista', 'gamificación', 'recompensas']
    },
    {
      id: 'faq-notas-perfil',
      question: '¿Qué debo hacer si una práctica no se registra en mi perfil?',
      answerHtml: `
        <p>El registro de calificaciones académicas está sincronizado con la <strong>Cátedra de Ciencias Experimentales</strong>:</p>
        <ul>
          <li><strong>Escala Oficial (1.0 a 5.0):</strong> la nota mínima de aprobación curricular es <strong>3.0 / 5.0</strong>. Las prácticas de excelencia se marcan como <em>"Aprobado con Mención" (5.0)</em>.</li>
          <li><strong>Finalización de sesión:</strong> cerciórate de hacer clic en <em>"Finalizar Simulación / Guardar Práctica"</em> al terminar en el Virtual Lab para que la telemetría se compute en ChemLab Cloud.</li>
          <li><strong>Comprobación en Perfil:</strong> visita la sección <strong>Profile</strong>. Si no ves tu nota reciente reflejada, pulsa el botón de actualizar en tu navegador o verifica tu conexión institucional.</li>
          <li><strong>Rúbricas Oficiales:</strong> puedes hacer clic en el icono del ojo 👁️ de cualquier práctica en tu historial para examinar la retroalimentación y desglose de notas otorgadas por el docente.</li>
        </ul>
      `,
      category: 'account',
      categoryLabel: 'Perfil & Calificaciones',
      isOpen: false,
      tags: ['perfil', 'notas', 'calificación', 'rúbrica', 'historial', 'escala', 'profesor']
    },
    {
      id: 'faq-asistente-atomo',
      question: '¿Cómo interactúo con el Asistente Átomo?',
      answerHtml: `
        <p>El <strong>Asistente Átomo</strong> es tu tutor inteligente de laboratorio disponible las 24 horas:</p>
        <ul>
          <li><strong>Dónde encontrarlo:</strong> en el botón flotante del <em>Sidebar</em> o dentro del workbench del <em>Virtual Lab</em>.</li>
          <li><strong>Consultas pedagógicas recomendadas:</strong> puedes preguntarle por conceptos teóricos (<em>ej. "¿Cuál es la diferencia entre un enlace iónico y uno covalente polar?"</em>), propiedades periódicas, reglas de solubilidad o cómo calcular la molaridad en una titulación.</li>
          <li><strong>Enfoque socrático:</strong> Átomo está diseñado para proporcionarte pistas, fórmulas orientativas y analogías sin resolver tus evaluaciones de forma directa, fortaleciendo tus habilidades analíticas.</li>
        </ul>
      `,
      category: 'virtual-lab',
      categoryLabel: 'Asistente Átomo',
      isOpen: false,
      tags: ['asistente', 'átomo', 'robot', 'dudas', 'tutor', 'inteligencia', 'ayuda']
    },
    {
      id: 'faq-tabla-periodica',
      question: '¿Cómo usar los filtros y el modelo 3D en la Tabla Periódica?',
      answerHtml: `
        <p>La <strong>Tabla Periódica Interactiva</strong> ofrece herramientas avanzadas para explorar los 118 elementos químicos:</p>
        <ul>
          <li><strong>Filtros por Familias:</strong> selecciona etiquetas como Alcalinos, Alcalinotérreos, Metales de Transición, Halógenos o Gases Nobles para resaltar selectivamente los grupos.</li>
          <li><strong>Visualizador 3D de Bohr:</strong> haz clic en cualquier elemento (ej. Carbono, Hierro, Oxígeno) para desplegar el modal con los niveles de energía orbitales, electrones en movimiento y configuración electrónica condensada.</li>
          <li><strong>Datos Termodinámicos y Físicos:</strong> consulta electronegatividad de Pauling, masa atómica, radio atómico y estados de oxidación oficiales IUPAC.</li>
        </ul>
      `,
      category: 'periodic-table',
      categoryLabel: 'Tabla Periódica Interactiva',
      isOpen: false,
      tags: ['tabla periódica', 'elementos', 'bohr', '3d', 'filtros', 'electrones', 'familias']
    },
    {
      id: 'faq-descarga-pdf',
      question: '¿Cómo descargo mi Ficha Académica Oficial en formato PDF?',
      answerHtml: `
        <p>Para obtener tu reporte oficial de evidencias de laboratorio:</p>
        <ol>
          <li>Ingresa a la sección <strong>Profile</strong> desde la barra de navegación lateral.</li>
          <li>En el banner superior del estudiante, haz clic en el botón azul <strong>"Descargar Ficha (PDF)"</strong>.</li>
          <li>El sistema generará automáticamente un documento con membrete institucional que incluye tu promedio lab (escala 1.0 a 5.0), horas acumuladas en el simulador 3D, gráfico de dominio por ramas de la química y el historial de prácticas validadas con sus rúbricas.</li>
          <li>Puedes guardarlo como archivo PDF o imprimirlo directamente para entregarlo a tu docente titular.</li>
        </ol>
      `,
      category: 'account',
      categoryLabel: 'Perfil & Calificaciones',
      isOpen: false,
      tags: ['pdf', 'descargar', 'ficha', 'reporte', 'certificado', 'imprimir', 'perfil']
    }
  ];

  constructor(private cdr: ChangeDetectorRef) {}

  /**
   * Obtiene la lista de FAQs filtrada por búsqueda y por categoría
   */
  get filteredFaqs(): FaqItem[] {
    const q = this.searchQuery.trim().toLowerCase();
    return this.faqs.filter(faq => {
      // Filtro por categoría seleccionada
      const matchesCategory = this.selectedCategory === 'all' || faq.category === this.selectedCategory;
      if (!matchesCategory) return false;

      // Filtro por texto de búsqueda
      if (!q) return true;
      const inQuestion = faq.question.toLowerCase().includes(q);
      const inAnswer = faq.answerHtml.toLowerCase().includes(q);
      const inCategory = faq.categoryLabel.toLowerCase().includes(q);
      const inTags = faq.tags.some(t => t.toLowerCase().includes(q));

      return inQuestion || inAnswer || inCategory || inTags;
    });
  }

  /**
   * Alterna la expansión de una pregunta frecuente
   */
  toggleFaq(id: string): void {
    const target = this.faqs.find(f => f.id === id);
    if (target) {
      target.isOpen = !target.isOpen;
      this.cdr.markForCheck();
    }
  }

  /**
   * Selecciona una categoría para filtrar las preguntas frecuentes
   */
  filterByCategory(categoryId: string): void {
    this.selectedCategory = categoryId;
    this.cdr.markForCheck();
  }

  /**
   * Limpia el campo de búsqueda
   */
  clearSearch(): void {
    this.searchQuery = '';
    this.cdr.markForCheck();
  }

  /**
   * Abre el modal de contacto con soporte
   */
  openContactModal(): void {
    this.isContactModalOpen = true;
    this.cdr.markForCheck();
  }

  /**
   * Cierra el modal de contacto con soporte
   */
  closeContactModal(): void {
    this.isContactModalOpen = false;
    this.cdr.markForCheck();
  }

  /**
   * Envía un ticket de consulta a soporte técnico
   */
  submitSupportTicket(): void {
    if (!this.contactTicket.subject.trim() || !this.contactTicket.message.trim()) {
      this.showToast('Por favor completa todos los campos del formulario.');
      return;
    }

    const sub = this.contactTicket.subject;
    this.closeContactModal();
    this.contactTicket.subject = '';
    this.contactTicket.message = '';
    this.showToast(`¡Consulta enviada a Soporte ReactivA! Radicado: #${Math.floor(1000 + Math.random() * 9000)}`);
  }

  /**
   * Muestra un mensaje flotante temporal (toast)
   */
  showToast(message: string): void {
    this.toastMessage = message;
    this.cdr.markForCheck();

    setTimeout(() => {
      this.toastMessage = null;
      this.cdr.markForCheck();
    }, 4000);
  }
}


import { Component, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

export interface StudentProfile {
  name: string;
  rank: string;
  avatarUrl: string;
  academicYear: string;
  institution: string;
  gradeLevel: string;
  email: string;
}

export interface MetricCard {
  id: string;
  label: string;
  value: string;
  suffix?: string;
  icon: string;
  colorTheme: 'green' | 'blue' | 'amber' | 'purple';
}

export interface ChemistryBranch {
  id: string;
  name: string;
  level: string;
  percentage: number;
  colorTheme: 'green' | 'dark-blue' | 'orange' | 'purple';
  bulletColor: string;
  tagClass: string;
}

export interface ResearchMetric {
  id: string;
  title: string;
  subtitleLine1: string;
  subtitleLine2?: string;
  value: string | number;
  unit?: string;
  icon: string;
  colorTheme: 'blue' | 'purple' | 'orange';
}

export interface PracticeEvaluation {
  id: string;
  code: string;
  title: string;
  statusTag: string;
  statusType: 'success' | 'info';
  professorFeedback: string;
  deliveryTime: string;
  modality: string;
  score: number;
  maxScore: number;
  icon: string;
  iconTheme: 'green' | 'blue';
  criteria: {
    name: string;
    score: string;
    comment: string;
  }[];
}

export interface PresetAvatar {
  id: string;
  label: string;
  url: string;
}

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './profile.html',
  styleUrl: './profile.scss'
})
export class ProfileComponent {
  private cdr = inject(ChangeDetectorRef);
  private fb = inject(FormBuilder);

  // 1. Datos del Estudiante y Foto de Perfil (Valeria Góngora con corte micro bob estructurado)
  student: StudentProfile = {
    name: 'Valeria Góngora',
    rank: 'Alquimista Teórico',
    // Estudiante de ciencias con cabello oscuro estilo micro bob estructurado
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80',
    academicYear: '2024',
    institution: 'Cátedra de Ciencias Experimentales - ReactivA',
    gradeLevel: '10° Grado de Bachillerato Científico',
    email: 'valeria.gongora@reactiva-lab.edu'
  };

  // Avatares prediseñados con temática STEM / Ciencias
  readonly presetAvatars: PresetAvatar[] = [
    {
      id: 'valeria-microbob',
      label: 'Valeria (Micro Bob)',
      url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80'
    },
    {
      id: 'stem-lab-1',
      label: 'Ingeniera Química',
      url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=300&q=80'
    },
    {
      id: 'stem-lab-2',
      label: 'Alquimista Teórica',
      url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80'
    },
    {
      id: 'stem-lab-3',
      label: 'Investigadora Cuántica',
      url: 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?auto=format&fit=crop&w=300&q=80'
    }
  ];

  // 2. Tarjetas de Métricas Principales (Grid de 4 KPIs con escala Colombia 1.0 a 5.0)
  metrics: MetricCard[] = [
    {
      id: 'promedio-lab',
      label: 'PROMEDIO LAB',
      value: '4.7',
      suffix: '/ 5.0',
      icon: 'ph ph-star-fill',
      colorTheme: 'green'
    },
    {
      id: 'reacciones-hechas',
      label: 'REACCIONES HECHAS',
      value: '412',
      icon: 'ph ph-flask-fill',
      colorTheme: 'blue'
    },
    {
      id: 'racha-maxima',
      label: 'RACHA MÁXIMA',
      value: '18',
      suffix: 'Días',
      icon: 'ph ph-fire-fill',
      colorTheme: 'amber'
    },
    {
      id: 'precision-global',
      label: 'PRECISIÓN GLOBAL',
      value: '88.5%',
      icon: 'ph ph-target',
      colorTheme: 'purple'
    }
  ];

  // 3. Dominio por Ramas de la Química (Alineado con módulos reales de ReactivA)
  branches: ChemistryBranch[] = [
    {
      id: 'tabla-periodica',
      name: 'Tabla Periódica & Modelos Atómicos',
      level: 'Maestro',
      percentage: 95,
      colorTheme: 'dark-blue',
      bulletColor: '#0284c7',
      tagClass: 'tag-dark-blue'
    },
    {
      id: 'virtual-lab',
      name: 'Virtual Lab / Simulador 3D de Enlaces Moleculares',
      level: 'Avanzado',
      percentage: 92,
      colorTheme: 'green',
      bulletColor: '#10b981',
      tagClass: 'tag-green'
    },
    {
      id: 'balanceo-estequiometria',
      name: 'Balanceo de Ecuaciones Químicas (Estequiometría)',
      level: 'En progreso',
      percentage: 78,
      colorTheme: 'orange',
      bulletColor: '#f97316',
      tagClass: 'tag-orange'
    },
    {
      id: 'mision-organica',
      name: 'Química Orgánica & Misión Orgánica',
      level: 'En aprendizaje',
      percentage: 65,
      colorTheme: 'purple',
      bulletColor: '#8b5cf6',
      tagClass: 'tag-purple'
    }
  ];

  // 4. Panel Lateral de Horas e Interacción (Telemetría de ReactivA)
  researchMetrics: ResearchMetric[] = [
    {
      id: 'simulador-3d',
      title: 'Simulador 3D',
      subtitleLine1: 'Tiempo en',
      subtitleLine2: 'workbench',
      value: '34.5',
      unit: 'h',
      icon: 'ph ph-cube',
      colorTheme: 'blue'
    },
    {
      id: 'formulas',
      title: 'Fórmulas',
      subtitleLine1: 'Ecuaciones',
      subtitleLine2: 'validadas',
      value: 189,
      icon: 'ph ph-function',
      colorTheme: 'purple'
    },
    {
      id: 'asistente-atomo',
      title: 'Asistente Átomo',
      subtitleLine1: 'Consultas',
      subtitleLine2: 'resueltas',
      value: 42,
      icon: 'ph ph-sparkle',
      colorTheme: 'orange'
    }
  ];

  // 5. Historial de Prácticas y Calificaciones (Escala Colombia 1.0 a 5.0)
  practices: PracticeEvaluation[] = [
    {
      id: 'practica-04',
      code: 'Práctica 04',
      title: 'Práctica 04: Enlaces Iónicos vs Covalentes (Simulador 3D)',
      statusTag: 'Aprobado con Mención',
      statusType: 'success',
      professorFeedback:
        'Excelente análisis de conductividad, geometría molecular y polaridad de disolventes en el workbench 3D. Demostración impecable.',
      deliveryTime: 'Entregado hace 2 días',
      modality: 'Modalidad Laboratorio Virtual 3D',
      score: 5.0,
      maxScore: 5.0,
      icon: 'ph ph-certificate',
      iconTheme: 'green',
      criteria: [
        {
          name: 'Identificación de enlaces iónicos y covalentes',
          score: '5.0 / 5.0',
          comment: 'Clasificación precisa basada en electronegatividad y modelos orbitales.'
        },
        {
          name: 'Comportamiento en solución acuosa',
          score: '5.0 / 5.0',
          comment: 'Conductimetría verificada y registro minucioso en probeta y vaso.'
        },
        {
          name: 'Conclusiones y fundamento teórico',
          score: '5.0 / 5.0',
          comment: 'Argumentación científica impecable acorde a la cátedra.'
        }
      ]
    },
    {
      id: 'simulacion-03',
      code: 'Simulación 03',
      title: 'Simulación 03: Titulación Ácido-Base & Balanceo con Bureta',
      statusTag: '1 intento completado',
      statusType: 'info',
      professorFeedback:
        'Buen cálculo del punto de equivalencia con fenolftaleína y balance estequiométrico. Ajustar margen de error en última gota.',
      deliveryTime: 'Entregado hace 5 días',
      modality: 'Modalidad Laboratorio Virtual',
      score: 4.6,
      maxScore: 5.0,
      icon: 'ph ph-flask',
      iconTheme: 'blue',
      criteria: [
        {
          name: 'Lectura de menisco en bureta graduada',
          score: '4.5 / 5.0',
          comment: 'Alineación visual adecuada con margen menor de dispersión volumétrica.'
        },
        {
          name: 'Detección del viraje de fenolftaleína',
          score: '4.6 / 5.0',
          comment: 'Color rosa tenue alcanzado en el punto estequiométrico de neutralización.'
        },
        {
          name: 'Cálculo de concentración molar',
          score: '4.7 / 5.0',
          comment: 'Despeje algebraico y factores de conversión estequiométricos correctos.'
        }
      ]
    },
    {
      id: 'mision-02',
      code: 'Misión 02',
      title: 'Misión 02: Nomenclatura e Hibridación en Misión Orgánica',
      statusTag: 'Completado con Éxito',
      statusType: 'success',
      professorFeedback:
        'Excelente formulación y reconocimiento de alcanos, alquenos e isomería funcional. Estructuras ensambladas sin fallos.',
      deliveryTime: 'Entregado hace 1 semana',
      modality: 'Modalidad Misión Orgánica',
      score: 4.8,
      maxScore: 5.0,
      icon: 'ph ph-tree-structure',
      iconTheme: 'blue',
      criteria: [
        {
          name: 'Identificación de cadenas carbonadas y radicales',
          score: '4.9 / 5.0',
          comment: 'Asignación correcta de localizadores IUPAC y saturación de enlaces.'
        },
        {
          name: 'Hibridación sp³, sp² y sp',
          score: '4.8 / 5.0',
          comment: 'Diferenciación geométrica tetraédrica, trigonal y lineal clara.'
        },
        {
          name: 'Resolución de desafíos moleculares',
          score: '4.7 / 5.0',
          comment: 'Modelado ágil y precisión en síntesis de grupos funcionales.'
        }
      ]
    }
  ];

  // Control de Modales y Notificaciones
  isEditModalOpen: boolean = false;
  isRubricsModalOpen: boolean = false;
  isAssistantModalOpen: boolean = false;
  isDownloadingPdf: boolean = false;
  toastMessage: string | null = null;
  selectedPracticeForRubric: PracticeEvaluation | null = null;
  assistantQuestionText: string = '';

  // Formulario Reactivo para Edición
  editProfileForm: FormGroup = this.fb.group({
    name: [this.student.name, [Validators.required, Validators.minLength(3)]],
    rank: [this.student.rank, [Validators.required]],
    academicYear: [this.student.academicYear, [Validators.required]],
    email: [this.student.email, [Validators.required, Validators.email]],
    avatarUrl: [this.student.avatarUrl]
  });

  availableRanks: string[] = [
    'Alquimista Teórico',
    'Maestro Molecular',
    'Investigador Cuántico',
    'Explorador Bioquímico',
    'Aprendiz de Laboratorio'
  ];

  // Manejo de Error en Carga de Imagen Avatar
  onAvatarError(event: Event): void {
    const imgElement = event.target as HTMLImageElement;
    imgElement.src = 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80';
  }

  // Carga dinámica de archivo para foto de perfil
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        if (result) {
          this.student.avatarUrl = result;
          this.editProfileForm.patchValue({ avatarUrl: result });
          this.showToast('¡Foto de perfil actualizada con éxito!');
          this.cdr.markForCheck();
        }
      };
      reader.readAsDataURL(file);
    }
  }

  // Selección de avatar prediseñado
  selectPresetAvatar(url: string): void {
    this.student.avatarUrl = url;
    this.editProfileForm.patchValue({ avatarUrl: url });
    this.showToast('Avatar seleccionado.');
    this.cdr.markForCheck();
  }

  // Descarga e Impresión de Reporte Académico PDF
  downloadReportPdf(): void {
    this.isDownloadingPdf = true;
    this.showToast('Generando Ficha Académica Oficial (PDF)...');

    setTimeout(() => {
      this.isDownloadingPdf = false;
      this.cdr.markForCheck();
      window.print();
    }, 800);
  }

  openEditProfileModal(): void {
    this.editProfileForm.patchValue({
      name: this.student.name,
      rank: this.student.rank,
      academicYear: this.student.academicYear,
      email: this.student.email,
      avatarUrl: this.student.avatarUrl
    });
    this.isEditModalOpen = true;
  }

  closeEditProfileModal(): void {
    this.isEditModalOpen = false;
  }

  saveProfile(): void {
    if (this.editProfileForm.valid) {
      const val = this.editProfileForm.value;
      this.student.name = val.name;
      this.student.rank = val.rank;
      this.student.academicYear = val.academicYear;
      this.student.email = val.email;
      if (val.avatarUrl) {
        this.student.avatarUrl = val.avatarUrl;
      }
      this.closeEditProfileModal();
      this.showToast('¡Perfil y datos académicos actualizados con éxito!');
      this.cdr.markForCheck();
    }
  }

  openRubricsModal(practice?: PracticeEvaluation): void {
    this.selectedPracticeForRubric = practice || this.practices[0];
    this.isRubricsModalOpen = true;
  }

  closeRubricsModal(): void {
    this.isRubricsModalOpen = false;
    this.selectedPracticeForRubric = null;
  }

  openAskAssistantModal(prompt?: string): void {
    if (prompt) {
      this.assistantQuestionText = prompt;
    }
    this.isAssistantModalOpen = true;
  }

  closeAskAssistantModal(): void {
    this.isAssistantModalOpen = false;
    this.assistantQuestionText = '';
  }

  sendAssistantQuestion(): void {
    if (!this.assistantQuestionText.trim()) return;
    const q = this.assistantQuestionText;
    this.closeAskAssistantModal();
    this.showToast(`🤖 Asistente Átomo respondiendo sobre: "${q.substring(0, 32)}..."`);
  }

  showToast(msg: string): void {
    this.toastMessage = msg;
    this.cdr.markForCheck();
    setTimeout(() => {
      this.toastMessage = null;
      this.cdr.markForCheck();
    }, 3500);
  }
}

// Exportación como alias para compatibilidad con profile.spec.ts
export { ProfileComponent as Profile };

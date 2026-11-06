import { Component, OnInit, OnDestroy, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';

/**
 * Representa un equipo, instrumento o reactivo químico en el laboratorio virtual.
 */
export interface EquipmentItem {
  id: string;
  name: string;
  category: 'glassware' | 'burner' | 'reagent' | 'instrument';
  categoryLabel: string;
  formula?: string;
  icon: string;
  description: string;
  active: boolean;
  color: string;
  volume?: number; // Volumen actual en mL
  maxVolume?: number; // Capacidad máxima en mL
  liquidColor?: string; // Color del líquido contenido
  temperature?: number; // Kelvin
  flameState?: 'off' | 'low' | 'medium' | 'high';
  rpm?: number; // Agitador magnético
  pH?: number; // Medidor de pH
}

/**
 * Representa una especie química (reactivo o producto) en una ecuación química.
 */
export interface ChemicalSpecies {
  formula: string;
  htmlFormula: string;
  name: string;
  state: 's' | 'l' | 'g' | 'aq';
  correctCoeff: number;
  userCoeff: number | null;
  atoms: { [element: string]: number };
}

/**
 * Nodo atómico/molecular para la animación en las órbitas del canvas.
 */
export interface ActiveReactant {
  id: string;
  symbol: string;
  subscript: string;
  name: string;
  formula: string;
  charge: string;
  color: string;
  position: 'top-left' | 'bottom-left' | 'center-right' | 'top-right';
  orbitType: 'orbit-1' | 'orbit-2' | 'orbit-3';
}

/**
 * Ejercicio de balanceo de ecuaciones estequiométricas con retroalimentación en tiempo real.
 */
export interface BalancingExercise {
  id: string;
  title: string;
  type: 'synthesis' | 'decomposition' | 'combustion' | 'single_replacement' | 'double_displacement';
  typeLabel: string;
  typeColor: string;
  description: string;
  enthalpy: string;
  reactants: ChemicalSpecies[];
  products: ChemicalSpecies[];
  isBalanced: boolean;
  scoreAwarded: boolean;
  orbitVisuals: ActiveReactant[];
}

@Component({
  selector: 'app-virtual-lab',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './virtual-lab.html',
  styleUrl: './virtual-lab.scss'
})
export class VirtualLabComponent implements OnInit, OnDestroy {
  private cdr = inject(ChangeDetectorRef);

  // 1. Buscador Reactivo con FormControl (Requerimiento 1)
  searchControl = new FormControl('');
  searchTerm: string = '';
  selectedCategory: string = 'all';
  private searchSubscription?: Subscription;

  // Pestaña activa del laboratorio
  activeViewTab: 'simulation' | 'balancer' | 'guide' = 'simulation';

  // 2. Catálogo maestro de equipos, instrumentos y reactivos químicos
  equipmentList: EquipmentItem[] = [
    // Material de Vidrio
    {
      id: 'erlenmeyer',
      name: 'Matraz Erlenmeyer',
      category: 'glassware',
      categoryLabel: 'Material de Vidrio',
      formula: '500 mL',
      icon: 'ph-flask',
      description: 'Matraz de vidrio borosilicato ideal para mezclar y calentar soluciones sin salpicaduras.',
      active: true,
      color: '#00a2ed',
      volume: 250,
      maxVolume: 500,
      liquidColor: '#38bdf8'
    },
    {
      id: 'beaker',
      name: 'Vaso de Precipitados',
      category: 'glassware',
      categoryLabel: 'Material de Vidrio',
      formula: '250 mL',
      icon: 'ph-brand-glassdoor',
      description: 'Recipiente cilíndrico graduado para trasvasar, mezclar reactivos y precipitaciones.',
      active: false,
      color: '#06b6d4',
      volume: 120,
      maxVolume: 250,
      liquidColor: '#67e8f9'
    },
    {
      id: 'cylinder',
      name: 'Probeta Graduada',
      category: 'glassware',
      categoryLabel: 'Material de Vidrio',
      formula: '100 mL',
      icon: 'ph-test-tube',
      description: 'Probeta para medición volumétrica exacta de reactivos líquidos con lectura de menisco.',
      active: false,
      color: '#6366f1',
      volume: 50,
      maxVolume: 100,
      liquidColor: '#a5b4fc'
    },
    {
      id: 'burette',
      name: 'Bureta Volumétrica',
      category: 'glassware',
      categoryLabel: 'Material de Vidrio',
      formula: '50 mL',
      icon: 'ph-eyedropper',
      description: 'Tubo graduado de alta precisión con llave de teflón para valoraciones ácido-base.',
      active: false,
      color: '#ec4899',
      volume: 45,
      maxVolume: 50,
      liquidColor: '#f472b6'
    },
    {
      id: 'test_tubes',
      name: 'Gradilla con Tubos de Ensayo',
      category: 'glassware',
      categoryLabel: 'Material de Vidrio',
      formula: '6x20 mL',
      icon: 'ph-test-tube',
      description: 'Set de tubos de borosilicato para ensayos comparativos de solubilidad y pH.',
      active: false,
      color: '#10b981',
      volume: 15,
      maxVolume: 20,
      liquidColor: '#34d399'
    },

    // Calor & Energía
    {
      id: 'bunsen',
      name: 'Mechero Bunsen',
      category: 'burner',
      categoryLabel: 'Calor & Energía',
      formula: 'CH₄ + 2O₂',
      icon: 'ph-fire',
      description: 'Quemador de gas regulable para suministrar energía de activación y calentar reactivos.',
      active: false,
      color: '#f97316',
      flameState: 'off',
      temperature: 298
    },
    {
      id: 'heating_mantle',
      name: 'Manta Calefactora Eléctrica',
      category: 'burner',
      categoryLabel: 'Calor & Energía',
      formula: '0 - 350 °C',
      icon: 'ph-lightning',
      description: 'Fuente de calor uniforme sin llama abierta para destilaciones y síntesis orgánicas seguras.',
      active: false,
      color: '#ea580c',
      temperature: 298
    },

    // Reactivos Químicos
    {
      id: 'water',
      name: 'Agua Destilada',
      category: 'reagent',
      categoryLabel: 'Reactivo / Solvente',
      formula: 'H₂O',
      icon: 'ph-drop',
      description: 'Solvente universal desionizado para preparar disoluciones acuosas puras.',
      active: true,
      color: '#06b6d4',
      liquidColor: '#38bdf8'
    },
    {
      id: 'hcl',
      name: 'Ácido Clorhídrico (1.0 M)',
      category: 'reagent',
      categoryLabel: 'Ácido Fuerte',
      formula: 'HCl (aq)',
      icon: 'ph-warning',
      description: 'Ácido mineral altamente ionizado para reacciones de desplazamiento y neutralización.',
      active: false,
      color: '#ef4444',
      liquidColor: '#fca5a5'
    },
    {
      id: 'naoh',
      name: 'Hidróxido de Sodio (1.0 M)',
      category: 'reagent',
      categoryLabel: 'Base Fuerte',
      formula: 'NaOH (aq)',
      icon: 'ph-shield-check',
      description: 'Solución alcalina para neutralizaciones ácido-base y precipitación de hidróxidos metálicos.',
      active: false,
      color: '#3b82f6',
      liquidColor: '#93c5fd'
    },
    {
      id: 'cuso4',
      name: 'Sulfato de Cobre(II)',
      category: 'reagent',
      categoryLabel: 'Sal Acuosa',
      formula: 'CuSO₄ (aq)',
      icon: 'ph-sparkle',
      description: 'Solución azul intenso característica para reacciones de sustitución con metales activos.',
      active: false,
      color: '#0284c7',
      liquidColor: '#0284c7'
    },
    {
      id: 'fe_reagent',
      name: 'Limaduras de Hierro',
      category: 'reagent',
      categoryLabel: 'Metal Reactivo',
      formula: 'Fe (s)',
      icon: 'ph-atom',
      description: 'Hierro metálico finamente dividido para reacciones de óxido-reducción y combustión.',
      active: false,
      color: '#64748b'
    },
    {
      id: 'hydrogen',
      name: 'Gas Hidrógeno',
      category: 'reagent',
      categoryLabel: 'Gas Reactivo',
      formula: 'H₂ (g)',
      icon: 'ph-atom',
      description: 'Gas diatómico inflamable y agente reductor para la síntesis de agua y amoníaco.',
      active: true,
      color: '#38bdf8'
    },
    {
      id: 'oxygen',
      name: 'Gas Oxígeno',
      category: 'reagent',
      categoryLabel: 'Gas Oxidante',
      formula: 'O₂ (g)',
      icon: 'ph-wind',
      description: 'Gas comburente indispensable para oxidaciones, respiración celular y combustiones.',
      active: true,
      color: '#ec4899'
    },
    {
      id: 'phenolphthalein',
      name: 'Indicador Fenolftaleína',
      category: 'reagent',
      categoryLabel: 'Indicador de pH',
      formula: 'C₂₀H₁₄O₄',
      icon: 'ph-paint-brush-broad',
      description: 'Indicador ácido-base que vira de incoloro a rosa fucsia en pH > 8.2.',
      active: false,
      color: '#d946ef',
      liquidColor: '#f43f5e'
    },

    // Instrumentos & Sensores
    {
      id: 'thermometer',
      name: 'Termómetro Digital',
      category: 'instrument',
      categoryLabel: 'Telemetría',
      formula: '0 - 500 °C',
      icon: 'ph-thermometer',
      description: 'Sensor digital de precisión para monitorear la termodinámica de la reacción.',
      active: true,
      color: '#8b5cf6',
      temperature: 298
    },
    {
      id: 'stirrer',
      name: 'Agitador Magnético Vortex',
      category: 'instrument',
      categoryLabel: 'Instrumento',
      formula: '1200 RPM',
      icon: 'ph-arrows-clockwise',
      description: 'Agitador magnético automatizado para homogenizar reactivos y acelerar la cinética.',
      active: false,
      color: '#10b981',
      rpm: 0
    },
    {
      id: 'ph_meter',
      name: 'Peachímetro Digital',
      category: 'instrument',
      categoryLabel: 'Instrumento',
      formula: 'pH 0 - 14',
      icon: 'ph-gauge',
      description: 'Electrodo de vidrio para medición cuantitativa continua del pH de la solución.',
      active: false,
      color: '#0284c7',
      pH: 7.0
    }
  ];

  filteredEquipment: EquipmentItem[] = [];

  // Equipo actualmente seleccionado para inspección o ajuste
  selectedEquipment: EquipmentItem | null = null;

  // 3. Batería de 15 Ejercicios de Balanceo de Ecuaciones Químicas (Requerimiento 2)
  balancingExercises: BalancingExercise[] = [
    // 1. Síntesis: Formación de Agua
    {
      id: 'water-synthesis',
      title: 'Formación de Agua',
      type: 'synthesis',
      typeLabel: 'Síntesis',
      typeColor: '#0284c7',
      description: 'Combinación exotérmica de hidrógeno diatómico y oxígeno gaseoso para formar agua líquida.',
      enthalpy: 'ΔH = -483.6 kJ (Exotérmica)',
      reactants: [
        { formula: 'H2', htmlFormula: 'H<sub>2</sub>', name: 'Hidrógeno', state: 'g', correctCoeff: 2, userCoeff: null, atoms: { H: 2 } },
        { formula: 'O2', htmlFormula: 'O<sub>2</sub>', name: 'Oxígeno', state: 'g', correctCoeff: 1, userCoeff: null, atoms: { O: 2 } }
      ],
      products: [
        { formula: 'H2O', htmlFormula: 'H<sub>2</sub>O', name: 'Agua', state: 'l', correctCoeff: 2, userCoeff: null, atoms: { H: 2, O: 1 } }
      ],
      isBalanced: false,
      scoreAwarded: false,
      orbitVisuals: [
        { id: 'h1', symbol: 'H', subscript: '1', name: 'Hidrógeno 1', formula: 'H₂', charge: '+1', color: '#0284c7', position: 'top-left', orbitType: 'orbit-1' },
        { id: 'h2', symbol: 'H', subscript: '2', name: 'Hidrógeno 2', formula: 'H₂', charge: '+1', color: '#0284c7', position: 'bottom-left', orbitType: 'orbit-1' },
        { id: 'o1', symbol: 'O', subscript: '8', name: 'Oxígeno', formula: 'O₂', charge: '-2', color: '#e11d48', position: 'center-right', orbitType: 'orbit-2' }
      ]
    },
    // 2. Síntesis: Oxidación del Hierro (Herrumbre)
    {
      id: 'iron-rust',
      title: 'Oxidación del Hierro (Herrumbre)',
      type: 'synthesis',
      typeLabel: 'Síntesis',
      typeColor: '#0284c7',
      description: 'Reacción del hierro metálico con el oxígeno atmosférico formando óxido férrico.',
      enthalpy: 'ΔH = -824.2 kJ (Exotérmica)',
      reactants: [
        { formula: 'Fe', htmlFormula: 'Fe', name: 'Hierro', state: 's', correctCoeff: 4, userCoeff: null, atoms: { Fe: 1 } },
        { formula: 'O2', htmlFormula: 'O<sub>2</sub>', name: 'Oxígeno', state: 'g', correctCoeff: 3, userCoeff: null, atoms: { O: 2 } }
      ],
      products: [
        { formula: 'Fe2O3', htmlFormula: 'Fe<sub>2</sub>O<sub>3</sub>', name: 'Óxido de Hierro(III)', state: 's', correctCoeff: 2, userCoeff: null, atoms: { Fe: 2, O: 3 } }
      ],
      isBalanced: false,
      scoreAwarded: false,
      orbitVisuals: [
        { id: 'fe1', symbol: 'Fe', subscript: '26', name: 'Hierro', formula: 'Fe', charge: '+3', color: '#f59e0b', position: 'top-left', orbitType: 'orbit-1' },
        { id: 'o1', symbol: 'O', subscript: '8', name: 'Oxígeno', formula: 'O₂', charge: '-2', color: '#e11d48', position: 'center-right', orbitType: 'orbit-2' }
      ]
    },
    // 3. Síntesis: Proceso Haber-Bosch (Amoníaco)
    {
      id: 'haber-bosch',
      title: 'Síntesis de Amoníaco (Haber-Bosch)',
      type: 'synthesis',
      typeLabel: 'Síntesis',
      typeColor: '#0284c7',
      description: 'Fijación industrial de nitrógeno gaseoso con hidrógeno a alta presión para fertilizantes.',
      enthalpy: 'ΔH = -92.4 kJ (Exotérmica)',
      reactants: [
        { formula: 'N2', htmlFormula: 'N<sub>2</sub>', name: 'Nitrógeno', state: 'g', correctCoeff: 1, userCoeff: null, atoms: { N: 2 } },
        { formula: 'H2', htmlFormula: 'H<sub>2</sub>', name: 'Hidrógeno', state: 'g', correctCoeff: 3, userCoeff: null, atoms: { H: 2 } }
      ],
      products: [
        { formula: 'NH3', htmlFormula: 'NH<sub>3</sub>', name: 'Amoníaco', state: 'g', correctCoeff: 2, userCoeff: null, atoms: { N: 1, H: 3 } }
      ],
      isBalanced: false,
      scoreAwarded: false,
      orbitVisuals: [
        { id: 'n1', symbol: 'N', subscript: '7', name: 'Nitrógeno', formula: 'N₂', charge: '-3', color: '#8b5cf6', position: 'top-left', orbitType: 'orbit-1' },
        { id: 'h1', symbol: 'H', subscript: '1', name: 'Hidrógeno', formula: 'H₂', charge: '+1', color: '#0284c7', position: 'bottom-left', orbitType: 'orbit-2' }
      ]
    },
    // 4. Descomposición: Clorato de Potasio
    {
      id: 'kclo3-decomp',
      title: 'Descomposición de Clorato de Potasio',
      type: 'decomposition',
      typeLabel: 'Descomposición',
      typeColor: '#9333ea',
      description: 'Descomposición térmica catalizada para producir oxígeno gaseoso en laboratorio.',
      enthalpy: 'ΔH = -78.2 kJ (Exotérmica tras calentamiento)',
      reactants: [
        { formula: 'KClO3', htmlFormula: 'KClO<sub>3</sub>', name: 'Clorato de Potasio', state: 's', correctCoeff: 2, userCoeff: null, atoms: { K: 1, Cl: 1, O: 3 } }
      ],
      products: [
        { formula: 'KCl', htmlFormula: 'KCl', name: 'Cloruro de Potasio', state: 's', correctCoeff: 2, userCoeff: null, atoms: { K: 1, Cl: 1 } },
        { formula: 'O2', htmlFormula: 'O<sub>2</sub>', name: 'Oxígeno', state: 'g', correctCoeff: 3, userCoeff: null, atoms: { O: 2 } }
      ],
      isBalanced: false,
      scoreAwarded: false,
      orbitVisuals: [
        { id: 'k1', symbol: 'K', subscript: '19', name: 'Potasio', formula: 'KClO₃', charge: '+1', color: '#a855f7', position: 'top-left', orbitType: 'orbit-1' },
        { id: 'cl1', symbol: 'Cl', subscript: '17', name: 'Cloro', formula: 'KCl', charge: '-1', color: '#10b981', position: 'bottom-left', orbitType: 'orbit-2' }
      ]
    },
    // 5. Descomposición: Peróxido de Hidrógeno
    {
      id: 'h2o2-decomp',
      title: 'Descomposición del Agua Oxigenada',
      type: 'decomposition',
      typeLabel: 'Descomposición',
      typeColor: '#9333ea',
      description: 'Desproporción rápida de H₂O₂ en agua y oxígeno catalizada por dióxido de manganeso.',
      enthalpy: 'ΔH = -196.1 kJ (Exotérmica)',
      reactants: [
        { formula: 'H2O2', htmlFormula: 'H<sub>2</sub>O<sub>2</sub>', name: 'Peróxido de Hidrógeno', state: 'l', correctCoeff: 2, userCoeff: null, atoms: { H: 2, O: 2 } }
      ],
      products: [
        { formula: 'H2O', htmlFormula: 'H<sub>2</sub>O', name: 'Agua', state: 'l', correctCoeff: 2, userCoeff: null, atoms: { H: 2, O: 1 } },
        { formula: 'O2', htmlFormula: 'O<sub>2</sub>', name: 'Oxígeno', state: 'g', correctCoeff: 1, userCoeff: null, atoms: { O: 2 } }
      ],
      isBalanced: false,
      scoreAwarded: false,
      orbitVisuals: [
        { id: 'h1', symbol: 'H', subscript: '1', name: 'Hidrógeno', formula: 'H₂O₂', charge: '+1', color: '#0284c7', position: 'top-left', orbitType: 'orbit-1' },
        { id: 'o1', symbol: 'O', subscript: '8', name: 'Oxígeno', formula: 'O₂', charge: '-2', color: '#e11d48', position: 'center-right', orbitType: 'orbit-2' }
      ]
    },
    // 6. Descomposición: Calcinación de Carbonato de Calcio
    {
      id: 'caco3-decomp',
      title: 'Calcinación de Carbonato de Calcio',
      type: 'decomposition',
      typeLabel: 'Descomposición',
      typeColor: '#9333ea',
      description: 'Descomposición térmica de piedra caliza para obtener cal viva (CaO) y CO₂.',
      enthalpy: 'ΔH = +178.3 kJ (Endotérmica)',
      reactants: [
        { formula: 'CaCO3', htmlFormula: 'CaCO<sub>3</sub>', name: 'Carbonato de Calcio', state: 's', correctCoeff: 1, userCoeff: null, atoms: { Ca: 1, C: 1, O: 3 } }
      ],
      products: [
        { formula: 'CaO', htmlFormula: 'CaO', name: 'Óxido de Calcio', state: 's', correctCoeff: 1, userCoeff: null, atoms: { Ca: 1, O: 1 } },
        { formula: 'CO2', htmlFormula: 'CO<sub>2</sub>', name: 'Dióxido de Carbono', state: 'g', correctCoeff: 1, userCoeff: null, atoms: { C: 1, O: 2 } }
      ],
      isBalanced: false,
      scoreAwarded: false,
      orbitVisuals: [
        { id: 'ca1', symbol: 'Ca', subscript: '20', name: 'Calcio', formula: 'CaCO₃', charge: '+2', color: '#06b6d4', position: 'top-left', orbitType: 'orbit-1' },
        { id: 'c1', symbol: 'C', subscript: '6', name: 'Carbono', formula: 'CO₂', charge: '+4', color: '#475569', position: 'center-right', orbitType: 'orbit-2' }
      ]
    },
    // 7. Combustión: Gas Propano
    {
      id: 'propane-combustion',
      title: 'Combustión Completa del Propano',
      type: 'combustion',
      typeLabel: 'Combustión',
      typeColor: '#ea580c',
      description: 'Reacción del gas propano licuado con exceso de oxígeno produciendo CO₂ y agua.',
      enthalpy: 'ΔH = -2220 kJ/mol (Altamente Exotérmica)',
      reactants: [
        { formula: 'C3H8', htmlFormula: 'C<sub>3</sub>H<sub>8</sub>', name: 'Propano', state: 'g', correctCoeff: 1, userCoeff: null, atoms: { C: 3, H: 8 } },
        { formula: 'O2', htmlFormula: 'O<sub>2</sub>', name: 'Oxígeno', state: 'g', correctCoeff: 5, userCoeff: null, atoms: { O: 2 } }
      ],
      products: [
        { formula: 'CO2', htmlFormula: 'CO<sub>2</sub>', name: 'Dióxido de Carbono', state: 'g', correctCoeff: 3, userCoeff: null, atoms: { C: 1, O: 2 } },
        { formula: 'H2O', htmlFormula: 'H<sub>2</sub>O', name: 'Vapor de Agua', state: 'g', correctCoeff: 4, userCoeff: null, atoms: { H: 2, O: 1 } }
      ],
      isBalanced: false,
      scoreAwarded: false,
      orbitVisuals: [
        { id: 'c1', symbol: 'C', subscript: '6', name: 'Carbono', formula: 'C₃H₈', charge: '-4', color: '#334155', position: 'top-left', orbitType: 'orbit-1' },
        { id: 'o1', symbol: 'O', subscript: '8', name: 'Oxígeno', formula: 'O₂', charge: '-2', color: '#ef4444', position: 'center-right', orbitType: 'orbit-2' }
      ]
    },
    // 8. Combustión: Gas Metano
    {
      id: 'methane-combustion',
      title: 'Combustión del Gas Metano (Bunsen)',
      type: 'combustion',
      typeLabel: 'Combustión',
      typeColor: '#ea580c',
      description: 'Combustión del hidrocarburo principal del gas natural en el mechero de laboratorio.',
      enthalpy: 'ΔH = -890.3 kJ/mol (Exotérmica)',
      reactants: [
        { formula: 'CH4', htmlFormula: 'CH<sub>4</sub>', name: 'Metano', state: 'g', correctCoeff: 1, userCoeff: null, atoms: { C: 1, H: 4 } },
        { formula: 'O2', htmlFormula: 'O<sub>2</sub>', name: 'Oxígeno', state: 'g', correctCoeff: 2, userCoeff: null, atoms: { O: 2 } }
      ],
      products: [
        { formula: 'CO2', htmlFormula: 'CO<sub>2</sub>', name: 'Dióxido de Carbono', state: 'g', correctCoeff: 1, userCoeff: null, atoms: { C: 1, O: 2 } },
        { formula: 'H2O', htmlFormula: 'H<sub>2</sub>O', name: 'Vapor de Agua', state: 'g', correctCoeff: 2, userCoeff: null, atoms: { H: 2, O: 1 } }
      ],
      isBalanced: false,
      scoreAwarded: false,
      orbitVisuals: [
        { id: 'c1', symbol: 'C', subscript: '6', name: 'Carbono', formula: 'CH₄', charge: '-4', color: '#1e293b', position: 'top-left', orbitType: 'orbit-1' },
        { id: 'h1', symbol: 'H', subscript: '1', name: 'Hidrógeno', formula: 'CH₄', charge: '+1', color: '#0284c7', position: 'bottom-left', orbitType: 'orbit-2' }
      ]
    },
    // 9. Combustión: Alcohol Etílico (Etanol)
    {
      id: 'ethanol-combustion',
      title: 'Combustión del Etanol',
      type: 'combustion',
      typeLabel: 'Combustión',
      typeColor: '#ea580c',
      description: 'Oxidación energética del bioetanol utilizado como desinfectante y biocombustible.',
      enthalpy: 'ΔH = -1367 kJ/mol (Exotérmica)',
      reactants: [
        { formula: 'C2H5OH', htmlFormula: 'C<sub>2</sub>H<sub>5</sub>OH', name: 'Etanol', state: 'l', correctCoeff: 1, userCoeff: null, atoms: { C: 2, H: 6, O: 1 } },
        { formula: 'O2', htmlFormula: 'O<sub>2</sub>', name: 'Oxígeno', state: 'g', correctCoeff: 3, userCoeff: null, atoms: { O: 2 } }
      ],
      products: [
        { formula: 'CO2', htmlFormula: 'CO<sub>2</sub>', name: 'Dióxido de Carbono', state: 'g', correctCoeff: 2, userCoeff: null, atoms: { C: 1, O: 2 } },
        { formula: 'H2O', htmlFormula: 'H<sub>2</sub>O', name: 'Agua', state: 'g', correctCoeff: 3, userCoeff: null, atoms: { H: 2, O: 1 } }
      ],
      isBalanced: false,
      scoreAwarded: false,
      orbitVisuals: [
        { id: 'c1', symbol: 'C', subscript: '6', name: 'Carbono', formula: 'C₂H₅OH', charge: '-2', color: '#334155', position: 'top-left', orbitType: 'orbit-1' },
        { id: 'o1', symbol: 'O', subscript: '8', name: 'Oxígeno', formula: 'O₂', charge: '-2', color: '#ef4444', position: 'center-right', orbitType: 'orbit-2' }
      ]
    },
    // 10. Sustitución Simple: Aluminio con Ácido Clorhídrico
    {
      id: 'al-hcl',
      title: 'Aluminio con Ácido Clorhídrico',
      type: 'single_replacement',
      typeLabel: 'Sustitución Simple',
      typeColor: '#10b981',
      description: 'El aluminio desplaza al hidrógeno del ácido formando cloruro de aluminio y gas H₂ efervescente.',
      enthalpy: 'ΔH = -528 kJ (Fuertemente Exotérmica)',
      reactants: [
        { formula: 'Al', htmlFormula: 'Al', name: 'Aluminio', state: 's', correctCoeff: 2, userCoeff: null, atoms: { Al: 1 } },
        { formula: 'HCl', htmlFormula: 'HCl', name: 'Ácido Clorhídrico', state: 'aq', correctCoeff: 6, userCoeff: null, atoms: { H: 1, Cl: 1 } }
      ],
      products: [
        { formula: 'AlCl3', htmlFormula: 'AlCl<sub>3</sub>', name: 'Cloruro de Aluminio', state: 'aq', correctCoeff: 2, userCoeff: null, atoms: { Al: 1, Cl: 3 } },
        { formula: 'H2', htmlFormula: 'H<sub>2</sub>', name: 'Gas Hidrógeno', state: 'g', correctCoeff: 3, userCoeff: null, atoms: { H: 2 } }
      ],
      isBalanced: false,
      scoreAwarded: false,
      orbitVisuals: [
        { id: 'al1', symbol: 'Al', subscript: '13', name: 'Aluminio', formula: 'Al', charge: '+3', color: '#06b6d4', position: 'top-left', orbitType: 'orbit-1' },
        { id: 'cl1', symbol: 'Cl', subscript: '17', name: 'Cloro', formula: 'HCl', charge: '-1', color: '#10b981', position: 'bottom-left', orbitType: 'orbit-2' }
      ]
    },
    // 11. Sustitución Simple: Cinc con Ácido Clorhídrico
    {
      id: 'zn-hcl',
      title: 'Desprendimiento de Hidrógeno (Zn + HCl)',
      type: 'single_replacement',
      typeLabel: 'Sustitución Simple',
      typeColor: '#10b981',
      description: 'El cinc metálico reacciona con HCl acuoso liberando burbujas de gas hidrógeno.',
      enthalpy: 'ΔH = -153.9 kJ (Exotérmica)',
      reactants: [
        { formula: 'Zn', htmlFormula: 'Zn', name: 'Cinc Metálico', state: 's', correctCoeff: 1, userCoeff: null, atoms: { Zn: 1 } },
        { formula: 'HCl', htmlFormula: 'HCl', name: 'Ácido Clorhídrico', state: 'aq', correctCoeff: 2, userCoeff: null, atoms: { H: 1, Cl: 1 } }
      ],
      products: [
        { formula: 'ZnCl2', htmlFormula: 'ZnCl<sub>2</sub>', name: 'Cloruro de Cinc', state: 'aq', correctCoeff: 1, userCoeff: null, atoms: { Zn: 1, Cl: 2 } },
        { formula: 'H2', htmlFormula: 'H<sub>2</sub>', name: 'Gas Hidrógeno', state: 'g', correctCoeff: 1, userCoeff: null, atoms: { H: 2 } }
      ],
      isBalanced: false,
      scoreAwarded: false,
      orbitVisuals: [
        { id: 'zn1', symbol: 'Zn', subscript: '30', name: 'Cinc', formula: 'Zn', charge: '+2', color: '#6366f1', position: 'top-left', orbitType: 'orbit-1' },
        { id: 'h1', symbol: 'H', subscript: '1', name: 'Hidrógeno', formula: 'H₂', charge: '+1', color: '#0284c7', position: 'center-right', orbitType: 'orbit-2' }
      ]
    },
    // 12. Sustitución Simple: Hierro en Sulfato de Cobre
    {
      id: 'fe-cuso4',
      title: 'Desplazamiento de Cobre por Hierro',
      type: 'single_replacement',
      typeLabel: 'Sustitución Simple',
      typeColor: '#10b981',
      description: 'El clavo de hierro se recubre de cobre rojizo mientras la solución pasa de azul a verde claro.',
      enthalpy: 'ΔH = -152.4 kJ (Redox espontánea)',
      reactants: [
        { formula: 'Fe', htmlFormula: 'Fe', name: 'Hierro', state: 's', correctCoeff: 1, userCoeff: null, atoms: { Fe: 1 } },
        { formula: 'CuSO4', htmlFormula: 'CuSO<sub>4</sub>', name: 'Sulfato de Cobre(II)', state: 'aq', correctCoeff: 1, userCoeff: null, atoms: { Cu: 1, S: 1, O: 4 } }
      ],
      products: [
        { formula: 'FeSO4', htmlFormula: 'FeSO<sub>4</sub>', name: 'Sulfato de Hierro(II)', state: 'aq', correctCoeff: 1, userCoeff: null, atoms: { Fe: 1, S: 1, O: 4 } },
        { formula: 'Cu', htmlFormula: 'Cu', name: 'Cobre Metálico', state: 's', correctCoeff: 1, userCoeff: null, atoms: { Cu: 1 } }
      ],
      isBalanced: false,
      scoreAwarded: false,
      orbitVisuals: [
        { id: 'fe1', symbol: 'Fe', subscript: '26', name: 'Hierro', formula: 'Fe', charge: '+2', color: '#f59e0b', position: 'top-left', orbitType: 'orbit-1' },
        { id: 'cu1', symbol: 'Cu', subscript: '29', name: 'Cobre', formula: 'CuSO₄', charge: '+2', color: '#0284c7', position: 'center-right', orbitType: 'orbit-2' }
      ]
    },
    // 13. Doble Desplazamiento: Neutralización NaOH + HCl
    {
      id: 'naoh-hcl',
      title: 'Neutralización Ácido-Base (NaOH + HCl)',
      type: 'double_displacement',
      typeLabel: 'Doble Desplazamiento',
      typeColor: '#059669',
      description: 'Reacción clásica entre una base fuerte y un ácido fuerte formando sal común y agua con calor.',
      enthalpy: 'ΔH = -57.3 kJ/mol (Neutralización)',
      reactants: [
        { formula: 'NaOH', htmlFormula: 'NaOH', name: 'Hidróxido de Sodio', state: 'aq', correctCoeff: 1, userCoeff: null, atoms: { Na: 1, O: 1, H: 1 } },
        { formula: 'HCl', htmlFormula: 'HCl', name: 'Ácido Clorhídrico', state: 'aq', correctCoeff: 1, userCoeff: null, atoms: { H: 1, Cl: 1 } }
      ],
      products: [
        { formula: 'NaCl', htmlFormula: 'NaCl', name: 'Cloruro de Sodio', state: 'aq', correctCoeff: 1, userCoeff: null, atoms: { Na: 1, Cl: 1 } },
        { formula: 'H2O', htmlFormula: 'H<sub>2</sub>O', name: 'Agua', state: 'l', correctCoeff: 1, userCoeff: null, atoms: { H: 2, O: 1 } }
      ],
      isBalanced: false,
      scoreAwarded: false,
      orbitVisuals: [
        { id: 'na1', symbol: 'Na', subscript: '11', name: 'Sodio', formula: 'NaOH', charge: '+1', color: '#3b82f6', position: 'top-left', orbitType: 'orbit-1' },
        { id: 'cl1', symbol: 'Cl', subscript: '17', name: 'Cloro', formula: 'HCl', charge: '-1', color: '#10b981', position: 'bottom-left', orbitType: 'orbit-2' }
      ]
    },
    // 14. Doble Desplazamiento: Precipitación de Cloruro de Plata
    {
      id: 'agno3-nacl',
      title: 'Precipitación de Cloruro de Plata',
      type: 'double_displacement',
      typeLabel: 'Doble Desplazamiento',
      typeColor: '#059669',
      description: 'Formación inmediata de un precipitado blanco lechoso insoluble de AgCl.',
      enthalpy: 'ΔH = -65.5 kJ (Precipitación Iónica)',
      reactants: [
        { formula: 'AgNO3', htmlFormula: 'AgNO<sub>3</sub>', name: 'Nitrato de Plata', state: 'aq', correctCoeff: 1, userCoeff: null, atoms: { Ag: 1, N: 1, O: 3 } },
        { formula: 'NaCl', htmlFormula: 'NaCl', name: 'Cloruro de Sodio', state: 'aq', correctCoeff: 1, userCoeff: null, atoms: { Na: 1, Cl: 1 } }
      ],
      products: [
        { formula: 'AgCl', htmlFormula: 'AgCl', name: 'Cloruro de Plata', state: 's', correctCoeff: 1, userCoeff: null, atoms: { Ag: 1, Cl: 1 } },
        { formula: 'NaNO3', htmlFormula: 'NaNO<sub>3</sub>', name: 'Nitrato de Sodio', state: 'aq', correctCoeff: 1, userCoeff: null, atoms: { Na: 1, N: 1, O: 3 } }
      ],
      isBalanced: false,
      scoreAwarded: false,
      orbitVisuals: [
        { id: 'ag1', symbol: 'Ag', subscript: '47', name: 'Plata', formula: 'AgNO₃', charge: '+1', color: '#cbd5e1', position: 'top-left', orbitType: 'orbit-1' },
        { id: 'cl1', symbol: 'Cl', subscript: '17', name: 'Cloro', formula: 'NaCl', charge: '-1', color: '#10b981', position: 'center-right', orbitType: 'orbit-2' }
      ]
    },
    // 15. Doble Desplazamiento: Precipitación de Sulfato de Bario
    {
      id: 'bacl2-na2so4',
      title: 'Precipitación de Sulfato de Bario',
      type: 'double_displacement',
      typeLabel: 'Doble Desplazamiento',
      typeColor: '#059669',
      description: 'Ensayo analítico con formación de precipitado blanco pesado de BaSO₄.',
      enthalpy: 'ΔH = -26.3 kJ (Precipitación)',
      reactants: [
        { formula: 'BaCl2', htmlFormula: 'BaCl<sub>2</sub>', name: 'Cloruro de Bario', state: 'aq', correctCoeff: 1, userCoeff: null, atoms: { Ba: 1, Cl: 2 } },
        { formula: 'Na2SO4', htmlFormula: 'Na<sub>2</sub>SO<sub>4</sub>', name: 'Sulfato de Sodio', state: 'aq', correctCoeff: 1, userCoeff: null, atoms: { Na: 2, S: 1, O: 4 } }
      ],
      products: [
        { formula: 'BaSO4', htmlFormula: 'BaSO<sub>4</sub>', name: 'Sulfato de Bario', state: 's', correctCoeff: 1, userCoeff: null, atoms: { Ba: 1, S: 1, O: 4 } },
        { formula: 'NaCl', htmlFormula: 'NaCl', name: 'Cloruro de Sodio', state: 'aq', correctCoeff: 2, userCoeff: null, atoms: { Na: 1, Cl: 1 } }
      ],
      isBalanced: false,
      scoreAwarded: false,
      orbitVisuals: [
        { id: 'ba1', symbol: 'Ba', subscript: '56', name: 'Bario', formula: 'BaCl₂', charge: '+2', color: '#14b8a6', position: 'top-left', orbitType: 'orbit-1' },
        { id: 's1', symbol: 'S', subscript: '16', name: 'Azufre', formula: 'Na₂SO₄', charge: '+6', color: '#f59e0b', position: 'center-right', orbitType: 'orbit-2' }
      ]
    }
  ];

  // Índice del ejercicio seleccionado
  currentExerciseIndex: number = 0;
  selectedExerciseFilter: string = 'all';

  // Gamificación y Puntuación
  totalLabScore: number = 150; // XP inicial
  streakDays: number = 18;
  solvedCount: number = 0;

  // Telemetría y estado de simulación
  simulationRunning: boolean = true;
  baseTemperature: number = 298; // Kelvin (25 °C)
  pressure: number = 1.0; // atm
  solutionVolume: number = 250; // mL
  currentPH: number = 7.0;

  // Estado de modales y feedback visual
  toastMessage: string | null = null;
  isEquipmentModalOpen: boolean = false;
  isRubricModalOpen: boolean = false;
  selectedEquipmentForModal: EquipmentItem | null = null;
  showCelebrationBurst: boolean = false;

  ngOnInit(): void {
    // Inicializar catálogo visible
    this.filteredEquipment = [...this.equipmentList];
    this.selectedEquipment = this.equipmentList[0];

    // Escucha reactiva en el buscador
    this.searchSubscription = this.searchControl.valueChanges.subscribe(value => {
      this.searchTerm = value ?? '';
      this.applyFilter();
    });

    // Evaluar estado del ejercicio inicial
    this.evaluateCurrentExercise();
  }

  ngOnDestroy(): void {
    this.searchSubscription?.unsubscribe();
  }

  // ==========================================
  // GETTERS DE COMPATIBILIDAD CON TESTS EXISTENTES
  // ==========================================
  get currentExercise(): BalancingExercise {
    return this.balancingExercises[this.currentExerciseIndex];
  }

  get isBalanced(): boolean {
    return this.currentExercise.isBalanced;
  }

  set isBalanced(val: boolean) {
    this.currentExercise.isBalanced = val;
  }

  get synthesisSuccess(): boolean {
    return this.currentExercise.isBalanced;
  }

  set synthesisSuccess(val: boolean) {
    this.currentExercise.isBalanced = val;
  }

  get activeReactants(): ActiveReactant[] {
    return this.currentExercise.orbitVisuals;
  }

  // Getters y Setters para compatibilidad con el ejercicio 1 (Agua: H2 + O2 -> H2O)
  get coeffH2(): number | null {
    const ex = this.balancingExercises[0];
    const sp = ex.reactants.find(r => r.formula === 'H2');
    return sp ? sp.userCoeff : null;
  }

  set coeffH2(val: number | null) {
    const ex = this.balancingExercises[0];
    const sp = ex.reactants.find(r => r.formula === 'H2');
    if (sp) sp.userCoeff = val;
  }

  get coeffO2(): number | null {
    const ex = this.balancingExercises[0];
    const sp = ex.reactants.find(r => r.formula === 'O2');
    return sp ? sp.userCoeff : null;
  }

  set coeffO2(val: number | null) {
    const ex = this.balancingExercises[0];
    const sp = ex.reactants.find(r => r.formula === 'O2');
    if (sp) sp.userCoeff = val;
  }

  get coeffH2O(): number | null {
    const ex = this.balancingExercises[0];
    const sp = ex.products.find(p => p.formula === 'H2O');
    return sp ? sp.userCoeff : null;
  }

  set coeffH2O(val: number | null) {
    const ex = this.balancingExercises[0];
    const sp = ex.products.find(p => p.formula === 'H2O');
    if (sp) sp.userCoeff = val;
  }

  get leftHCount(): number {
    return (this.coeffH2 ?? 0) * 2;
  }

  get leftOCount(): number {
    return (this.coeffO2 ?? 0) * 2;
  }

  get rightHCount(): number {
    return (this.coeffH2O ?? 0) * 2;
  }

  get rightOCount(): number {
    return (this.coeffH2O ?? 0) * 1;
  }

  // ==========================================
  // FILTRADO Y GESTIÓN DE EQUIPOS (Requerimiento 1)
  // ==========================================
  applyFilter(): void {
    const term = this.searchTerm.trim().toLowerCase();

    this.filteredEquipment = this.equipmentList.filter(item => {
      const matchesSearch =
        !term ||
        item.name.toLowerCase().includes(term) ||
        item.description.toLowerCase().includes(term) ||
        (item.formula && item.formula.toLowerCase().includes(term)) ||
        item.categoryLabel.toLowerCase().includes(term);

      const matchesCategory =
        this.selectedCategory === 'all' || item.category === this.selectedCategory;

      return matchesSearch && matchesCategory;
    });

    this.cdr.markForCheck();
  }

  setCategory(category: string): void {
    this.selectedCategory = category;
    this.applyFilter();
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.searchControl.setValue('');
    this.cdr.markForCheck();
  }

  /**
   * Alterna el estado activo de un equipo en la mesa de experimentación.
   */
  toggleEquipment(item: EquipmentItem): void {
    item.active = !item.active;
    this.selectedEquipment = item;

    // Efectos térmicos y de telemetría reactivos
    if (item.id === 'bunsen') {
      if (item.active) {
        item.flameState = 'medium';
        this.baseTemperature = 498;
        this.showToast('🔥 Mechero Bunsen encendido (Llama oxidante: 498 K / 225 °C)');
      } else {
        item.flameState = 'off';
        this.baseTemperature = 298;
        this.showToast('Mechero Bunsen apagado');
      }
    } else if (item.id === 'stirrer') {
      item.rpm = item.active ? 600 : 0;
      this.showToast(item.active ? '🌀 Agitador magnético activado a 600 RPM' : 'Agitador detenido');
    } else if (item.id === 'hcl') {
      if (item.active) {
        this.currentPH = 1.2;
        this.showToast('🧪 Ácido clorhídrico añadido a la mesa (pH ácido: 1.2)');
      }
    } else if (item.id === 'naoh') {
      if (item.active) {
        this.currentPH = 13.0;
        this.showToast('🧪 Hidróxido de sodio añadido a la mesa (pH alcalino: 13.0)');
      }
    } else {
      const msg = item.active
        ? `${item.name} añadido a la mesa de trabajo`
        : `${item.name} retirado de la simulación`;
      this.showToast(msg);
    }

    this.cdr.markForCheck();
  }

  /**
   * Selecciona una herramienta para inspeccionar y ajustar en el panel de control.
   */
  selectEquipment(item: EquipmentItem): void {
    this.selectedEquipment = item;
    this.cdr.markForCheck();
  }

  /**
   * Ajusta el volumen de líquido dentro de un recipiente de vidrio.
   */
  setVolume(item: EquipmentItem, newVolume: number): void {
    if (!item.maxVolume) return;
    item.volume = Math.max(0, Math.min(item.maxVolume, newVolume));
    this.solutionVolume = item.volume;
    this.showToast(`${item.name}: Nivel ajustado a ${item.volume} mL`);
    this.cdr.markForCheck();
  }

  /**
   * Cambia la intensidad de la llama del Mechero Bunsen.
   */
  cycleBunsenFlame(): void {
    const bunsen = this.equipmentList.find(e => e.id === 'bunsen');
    if (!bunsen) return;

    if (!bunsen.active || bunsen.flameState === 'off') {
      bunsen.active = true;
      bunsen.flameState = 'low';
      this.baseTemperature = 373; // 100 °C
      this.showToast('🔥 Llama reductora suave (373 K / 100 °C)');
    } else if (bunsen.flameState === 'low') {
      bunsen.flameState = 'medium';
      this.baseTemperature = 498; // 225 °C
      this.showToast('🔥 Llama media de trabajo (498 K / 225 °C)');
    } else if (bunsen.flameState === 'medium') {
      bunsen.flameState = 'high';
      this.baseTemperature = 773; // 500 °C
      this.showToast('🔥 Llama oxidante máxima (773 K / 500 °C)');
    } else {
      bunsen.active = false;
      bunsen.flameState = 'off';
      this.baseTemperature = 298; // 25 °C
      this.showToast('Mechero Bunsen apagado');
    }

    this.cdr.markForCheck();
  }

  /**
   * Cambia las RPM del agitador magnético.
   */
  cycleStirrerRPM(): void {
    const stirrer = this.equipmentList.find(e => e.id === 'stirrer');
    if (!stirrer) return;

    if (!stirrer.active || (stirrer.rpm ?? 0) === 0) {
      stirrer.active = true;
      stirrer.rpm = 300;
      this.showToast('🌀 Agitación suave: 300 RPM');
    } else if (stirrer.rpm === 300) {
      stirrer.rpm = 600;
      this.showToast('🌀 Agitación media: 600 RPM');
    } else if (stirrer.rpm === 600) {
      stirrer.rpm = 1200;
      this.showToast('🌀 Agitación vortex máxima: 1200 RPM');
    } else {
      stirrer.active = false;
      stirrer.rpm = 0;
      this.showToast('Agitador detenido');
    }

    this.cdr.markForCheck();
  }

  /**
   * Vacía el contenido de un recipiente seleccionado.
   */
  emptyVessel(item: EquipmentItem): void {
    item.volume = 0;
    this.showToast(`${item.name} vaciado.`);
    this.cdr.markForCheck();
  }

  /**
   * Despeja todos los equipos de la mesa de experimentación.
   */
  clearWorkbench(): void {
    this.equipmentList.forEach(eq => (eq.active = false));
    this.baseTemperature = 298;
    this.currentPH = 7.0;
    this.showToast('Mesa de trabajo despejada por completo');
    this.cdr.markForCheck();
  }

  /**
   * Restablece el equipamiento por defecto.
   */
  resetWorkbenchDefaults(): void {
    this.equipmentList.forEach(eq => {
      eq.active = ['erlenmeyer', 'water', 'hydrogen', 'oxygen', 'thermometer'].includes(eq.id);
    });
    this.baseTemperature = 298;
    this.currentPH = 7.0;
    this.showToast('Mesa de trabajo restaurada a configuración estándar');
    this.cdr.markForCheck();
  }

  get activeEquipment(): EquipmentItem[] {
    return this.equipmentList.filter(item => item.active);
  }

  isItemActive(id: string): boolean {
    const found = this.equipmentList.find(item => item.id === id);
    return found ? found.active : false;
  }

  // ==========================================
  // LÓGICA DE BALANCEO ESTEQUIOMÉTRICO (Requerimiento 2)
  // ==========================================

  /**
   * Cambia el ejercicio actual seleccionado.
   */
  selectExercise(index: number): void {
    if (index >= 0 && index < this.balancingExercises.length) {
      this.currentExerciseIndex = index;
      this.evaluateCurrentExercise();
      this.showToast(`Cargada reacción: ${this.currentExercise.title}`);
      this.cdr.markForCheck();
    }
  }

  nextExercise(): void {
    const nextIdx = (this.currentExerciseIndex + 1) % this.balancingExercises.length;
    this.selectExercise(nextIdx);
  }

  prevExercise(): void {
    const prevIdx =
      (this.currentExerciseIndex - 1 + this.balancingExercises.length) %
      this.balancingExercises.length;
    this.selectExercise(prevIdx);
  }

  /**
   * Maneja el cambio de coeficiente estequiométrico introducido por el estudiante.
   */
  onSpeciesInput(species: ChemicalSpecies, event: Event): void {
    const inputElement = event.target as HTMLInputElement;
    const rawVal = inputElement.value.trim();
    const parsed = rawVal === '' ? null : Math.max(1, parseInt(rawVal, 10));
    species.userCoeff = isNaN(parsed as number) ? null : parsed;

    this.evaluateCurrentExercise();
  }

  /**
   * Compatibilidad hacia atrás para el ejercicio 1:
   * onCoeffInput('H2' | 'O2' | 'H2O', event)
   */
  onCoeffInput(reactant: 'H2' | 'O2' | 'H2O', event: Event): void {
    const inputElement = event.target as HTMLInputElement;
    const rawVal = inputElement.value.trim();
    const parsed = rawVal === '' ? null : Math.max(0, parseInt(rawVal, 10));

    if (reactant === 'H2') this.coeffH2 = parsed;
    if (reactant === 'O2') this.coeffO2 = parsed;
    if (reactant === 'H2O') this.coeffH2O = parsed;

    this.evaluateCurrentExercise();
  }

  evaluateEquationBalance(): void {
    this.evaluateCurrentExercise();
  }

  /**
   * Evalúa en tiempo real la conservación de átomos en reactivos vs productos para cualquier reacción.
   */
  evaluateCurrentExercise(): void {
    const ex = this.currentExercise;

    // Verificar que todos los coeficientes hayan sido ingresados y sean > 0
    const allReactantsFilled = ex.reactants.every(
      r => r.userCoeff !== null && r.userCoeff !== undefined && r.userCoeff > 0
    );
    const allProductsFilled = ex.products.every(
      p => p.userCoeff !== null && p.userCoeff !== undefined && p.userCoeff > 0
    );

    if (!allReactantsFilled || !allProductsFilled) {
      ex.isBalanced = false;
      this.cdr.markForCheck();
      return;
    }

    // Contar átomos de cada elemento en la izquierda (reactivos)
    const leftAtoms: { [el: string]: number } = {};
    for (const r of ex.reactants) {
      const coeff = r.userCoeff!;
      for (const [el, count] of Object.entries(r.atoms)) {
        leftAtoms[el] = (leftAtoms[el] || 0) + count * coeff;
      }
    }

    // Contar átomos de cada elemento en la derecha (productos)
    const rightAtoms: { [el: string]: number } = {};
    for (const p of ex.products) {
      const coeff = p.userCoeff!;
      for (const [el, count] of Object.entries(p.atoms)) {
        rightAtoms[el] = (rightAtoms[el] || 0) + count * coeff;
      }
    }

    // Verificar que todos los elementos coincidan exactamente
    const allElements = new Set([...Object.keys(leftAtoms), ...Object.keys(rightAtoms)]);
    let balanced = true;

    for (const el of allElements) {
      const leftCount = leftAtoms[el] || 0;
      const rightCount = rightAtoms[el] || 0;
      if (leftCount !== rightCount || leftCount === 0) {
        balanced = false;
        break;
      }
    }

    ex.isBalanced = balanced;

    // Otorgar puntos y retroalimentación si se balanceó por primera vez
    if (balanced && !ex.scoreAwarded) {
      ex.scoreAwarded = true;
      this.totalLabScore += 50;
      this.solvedCount++;
      this.showCelebrationBurst = true;
      this.showToast(`🎉 ¡Ecuación Balanceada! +50 XP (${ex.title})`);
      setTimeout(() => {
        this.showCelebrationBurst = false;
        this.cdr.markForCheck();
      }, 3000);
    }

    this.cdr.markForCheck();
  }

  /**
   * Resumen atómico para telemetría en tiempo real de la ecuación actual.
   */
  get currentAtomsSummary(): { element: string; left: number; right: number; balanced: boolean }[] {
    const ex = this.currentExercise;
    const leftAtoms: { [el: string]: number } = {};
    for (const r of ex.reactants) {
      const coeff = r.userCoeff ?? 0;
      for (const [el, count] of Object.entries(r.atoms)) {
        leftAtoms[el] = (leftAtoms[el] || 0) + count * coeff;
      }
    }

    const rightAtoms: { [el: string]: number } = {};
    for (const p of ex.products) {
      const coeff = p.userCoeff ?? 0;
      for (const [el, count] of Object.entries(p.atoms)) {
        rightAtoms[el] = (rightAtoms[el] || 0) + count * coeff;
      }
    }

    const allElements = Array.from(
      new Set([...Object.keys(leftAtoms), ...Object.keys(rightAtoms)])
    );

    return allElements.map(el => {
      const left = leftAtoms[el] || 0;
      const right = rightAtoms[el] || 0;
      return {
        element: el,
        left,
        right,
        balanced: left === right && left > 0
      };
    });
  }

  /**
   * Reinicia los coeficientes del ejercicio actual.
   */
  resetEquation(): void {
    const ex = this.currentExercise;
    ex.reactants.forEach(r => (r.userCoeff = null));
    ex.products.forEach(p => (p.userCoeff = null));
    ex.isBalanced = false;
    this.showToast('Coeficientes restablecidos');
    this.cdr.markForCheck();
  }

  /**
   * Ayuda pedagógica: rellena los coeficientes estequiométricos mínimos correctos.
   */
  autoBalanceHelp(): void {
    const ex = this.currentExercise;
    ex.reactants.forEach(r => (r.userCoeff = r.correctCoeff));
    ex.products.forEach(p => (p.userCoeff = p.correctCoeff));
    this.evaluateCurrentExercise();
    this.showToast(`Solución estequiométrica cargada para: ${ex.title}`);
  }

  /**
   * Filtra la lista de ejercicios de balanceo por categoría.
   */
  get filteredExercises(): BalancingExercise[] {
    if (this.selectedExerciseFilter === 'all') {
      return this.balancingExercises;
    }
    return this.balancingExercises.filter(ex => ex.type === this.selectedExerciseFilter);
  }

  setExerciseFilter(filter: string): void {
    this.selectedExerciseFilter = filter;
    this.cdr.markForCheck();
  }

  // ==========================================
  // NAVEGACIÓN DE VISTAS Y MODALES (Requerimiento 3)
  // ==========================================
  setActiveTab(tab: 'simulation' | 'balancer' | 'guide'): void {
    this.activeViewTab = tab;
    this.cdr.markForCheck();
  }

  toggleSimulation(): void {
    this.simulationRunning = !this.simulationRunning;
    this.showToast(this.simulationRunning ? 'Simulación en marcha' : 'Simulación pausada');
    this.cdr.markForCheck();
  }

  openEquipmentModal(item: EquipmentItem): void {
    this.selectedEquipmentForModal = item;
    this.isEquipmentModalOpen = true;
    this.cdr.markForCheck();
  }

  closeEquipmentModal(): void {
    this.isEquipmentModalOpen = false;
    this.selectedEquipmentForModal = null;
    this.cdr.markForCheck();
  }

  openRubricModal(): void {
    this.isRubricModalOpen = true;
    this.cdr.markForCheck();
  }

  closeRubricModal(): void {
    this.isRubricModalOpen = false;
    this.cdr.markForCheck();
  }

  showToast(message: string): void {
    this.toastMessage = message;
    this.cdr.markForCheck();
    setTimeout(() => {
      this.toastMessage = null;
      this.cdr.markForCheck();
    }, 3200);
  }
}

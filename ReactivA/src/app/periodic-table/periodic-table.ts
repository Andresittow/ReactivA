import { Component, OnInit, OnDestroy, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { StudentProgressService, StudentProfile, GamificationState } from '../dashboard/student-progress.service';

/**
 * Estructura de datos completa para un elemento químico
 */

/**
 * Tarjeta para el mini-juego de Memory / Parejas Periódicas
 */
export interface MemoryCard {
  id: string;
  pairId: number;
  type: 'name' | 'symbol';
  name: string;
  symbol: string;
  number: number;
  category: 'metal' | 'metalloid' | 'nonmetal' | 'noble-gas';
  categoryLabel: string;
  phase: string;
  isFlipped: boolean;
  isMatched: boolean;
}

export interface ChemicalElement {
  number: number;
  symbol: string;
  name: string;
  weight: number;
  category: 'metal' | 'metalloid' | 'nonmetal' | 'noble-gas';
  subCategory: string;
  period: number;
  group: number;
  electronConfig: string;
  atomicMass: string;
  density: string;
  meltingPoint: string;
  boilingPoint: string;
  shells: number[];
  phase?: 'Solid' | 'Liquid' | 'Gas' | 'Synthetic';
  summary?: string;
}

@Component({
  selector: 'app-periodic-table',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DecimalPipe, RouterLink],
  templateUrl: './periodic-table.html',
  styleUrl: './periodic-table.scss'
})
export class PeriodicTableComponent implements OnInit, OnDestroy {
  private cdr = inject(ChangeDetectorRef);
  private progressService = inject(StudentProgressService);

  // Perfil del estudiante y Gamificación sincronizada
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

  // Notificaciones flotantes (Toast)
  toastNotification: { message: string; visible: boolean; type: 'success' | 'info' } = {
    message: '',
    visible: false,
    type: 'success'
  };
  private toastTimeout?: ReturnType<typeof setTimeout>;

  // Elementos explorados e interacción orbital del modelo de Bohr
  inspectedElementsCount: number = 0;
  activeShellHighlight: number | null = null;

  // Récords y Recompensas del Memory Game
  bestRecord: { moves: number; time: string; seconds: number } | null = null;
  lastGameReward: { xp: number; bonus: boolean; leveledUp: boolean } | null = null;

  // 1. Buscador reactivo dinámico con FormControl individual
  searchElementControl = new FormControl('');
  private searchSubscription?: Subscription;

  // Filtros por categoría
  readonly categories: string[] = ['All Elements', 'Metals', 'Metalloids', 'Non-metals', 'Noble Gases'];
  selectedCategory: string = 'All Elements';

  // Elemento activo seleccionado para el panel lateral de detalle
  selectedElement: ChemicalElement | null = null;

  // Lista filtrada dinámicamente para el CSS Grid
  filteredElements: ChemicalElement[] = [];

  // --- MODO DE VISTA: TABLA O MINI-JUEGO MEMORY ---
  activeTab: 'table' | 'memory' = 'table';

  // --- CONFIGURACIÓN Y ESTADO DEL MINI-JUEGO MEMORY ---
  readonly gameCategoryOptions = [
    { id: 'all', label: 'Todos (20 pares)' },
    { id: 'metal', label: 'Metales (5 pares)' },
    { id: 'nonmetal', label: 'No metales (5 pares)' },
    { id: 'metalloid', label: 'Metaloides (5 pares)' },
    { id: 'noble-gas', label: 'Gases nobles (5 pares)' }
  ];
  selectedGameCategory: 'all' | 'metal' | 'nonmetal' | 'metalloid' | 'noble-gas' = 'all';

  // Colección curada de 20 elementos (5 de cada categoría química)
  readonly memoryElements = [
    // 5 Metales
    { number: 26, symbol: 'Fe', name: 'Hierro', category: 'metal' as const, categoryLabel: 'Metal de Transición', phase: 'Sólido' },
    { number: 79, symbol: 'Au', name: 'Oro', category: 'metal' as const, categoryLabel: 'Metal de Transición', phase: 'Sólido' },
    { number: 29, symbol: 'Cu', name: 'Cobre', category: 'metal' as const, categoryLabel: 'Metal de Transición', phase: 'Sólido' },
    { number: 11, symbol: 'Na', name: 'Sodio', category: 'metal' as const, categoryLabel: 'Metal Alcalino', phase: 'Sólido' },
    { number: 22, symbol: 'Ti', name: 'Titanio', category: 'metal' as const, categoryLabel: 'Metal de Transición', phase: 'Sólido' },

    // 5 No metales
    { number: 6, symbol: 'C', name: 'Carbono', category: 'nonmetal' as const, categoryLabel: 'No metal reactivo', phase: 'Sólido' },
    { number: 8, symbol: 'O', name: 'Oxígeno', category: 'nonmetal' as const, categoryLabel: 'No metal reactivo', phase: 'Gas' },
    { number: 7, symbol: 'N', name: 'Nitrógeno', category: 'nonmetal' as const, categoryLabel: 'No metal reactivo', phase: 'Gas' },
    { number: 16, symbol: 'S', name: 'Azufre', category: 'nonmetal' as const, categoryLabel: 'No metal reactivo', phase: 'Sólido' },
    { number: 15, symbol: 'P', name: 'Fósforo', category: 'nonmetal' as const, categoryLabel: 'No metal reactivo', phase: 'Sólido' },

    // 5 Metaloides
    { number: 5, symbol: 'B', name: 'Boro', category: 'metalloid' as const, categoryLabel: 'Metaloide', phase: 'Sólido' },
    { number: 14, symbol: 'Si', name: 'Silicio', category: 'metalloid' as const, categoryLabel: 'Metaloide', phase: 'Sólido' },
    { number: 32, symbol: 'Ge', name: 'Germanio', category: 'metalloid' as const, categoryLabel: 'Metaloide', phase: 'Sólido' },
    { number: 33, symbol: 'As', name: 'Arsénico', category: 'metalloid' as const, categoryLabel: 'Metaloide', phase: 'Sólido' },
    { number: 51, symbol: 'Sb', name: 'Antimonio', category: 'metalloid' as const, categoryLabel: 'Metaloide', phase: 'Sólido' },

    // 5 Gases nobles
    { number: 2, symbol: 'He', name: 'Helio', category: 'noble-gas' as const, categoryLabel: 'Gas Noble', phase: 'Gas' },
    { number: 10, symbol: 'Ne', name: 'Neón', category: 'noble-gas' as const, categoryLabel: 'Gas Noble', phase: 'Gas' },
    { number: 18, symbol: 'Ar', name: 'Argón', category: 'noble-gas' as const, categoryLabel: 'Gas Noble', phase: 'Gas' },
    { number: 36, symbol: 'Kr', name: 'Kriptón', category: 'noble-gas' as const, categoryLabel: 'Gas Noble', phase: 'Gas' },
    { number: 54, symbol: 'Xe', name: 'Xenón', category: 'noble-gas' as const, categoryLabel: 'Gas Noble', phase: 'Gas' }
  ];

  memoryCards: MemoryCard[] = [];
  flippedCards: MemoryCard[] = [];
  isLockBoard: boolean = false;
  movesCount: number = 0;
  matchesCount: number = 0;
  totalPairs: number = 0;
  gameWon: boolean = false;
  timerSeconds: number = 0;
  private timerInterval: any = null;


  // 2. Base de datos completa de elementos químicos (118 elementos)
  readonly elements: ChemicalElement[] = [
    // Periodo 1
    {
      number: 1, symbol: 'H', name: 'Hydrogen', weight: 1.008,
      category: 'nonmetal', subCategory: 'Reactive Non-metal',
      period: 1, group: 1, electronConfig: '1s¹',
      atomicMass: '1.008 u', density: '0.08988 g/L', meltingPoint: '-259.1 °C', boilingPoint: '-252.9 °C',
      shells: [1], phase: 'Gas',
      summary: 'El elemento más ligero y abundante del universo observable.'
    },
    {
      number: 2, symbol: 'He', name: 'Helium', weight: 4.0026,
      category: 'noble-gas', subCategory: 'Noble Gas',
      period: 1, group: 18, electronConfig: '1s²',
      atomicMass: '4.0026 u', density: '0.1786 g/L', meltingPoint: '-272.2 °C', boilingPoint: '-268.9 °C',
      shells: [2], phase: 'Gas',
      summary: 'Gas inerte e incoloro, el segundo elemento más abundante en el cosmos.'
    },

    // Periodo 2
    {
      number: 3, symbol: 'Li', name: 'Lithium', weight: 6.94,
      category: 'metal', subCategory: 'Alkali Metal',
      period: 2, group: 1, electronConfig: '[He] 2s¹',
      atomicMass: '6.94 u', density: '0.534 g/cm³', meltingPoint: '180.5 °C', boilingPoint: '1342 °C',
      shells: [2, 1], phase: 'Solid',
      summary: 'El metal menos denso; altamente reactivo e inflamable.'
    },
    {
      number: 4, symbol: 'Be', name: 'Beryllium', weight: 9.0122,
      category: 'metal', subCategory: 'Alkaline Earth Metal',
      period: 2, group: 2, electronConfig: '[He] 2s²',
      atomicMass: '9.0122 u', density: '1.85 g/cm³', meltingPoint: '1287 °C', boilingPoint: '2470 °C',
      shells: [2, 2], phase: 'Solid',
      summary: 'Metal de baja densidad y alto punto de fusión utilizado en la industria aeroespacial.'
    },
    {
      number: 5, symbol: 'B', name: 'Boron', weight: 10.81,
      category: 'metalloid', subCategory: 'Metalloid',
      period: 2, group: 13, electronConfig: '[He] 2s² 2p¹',
      atomicMass: '10.81 u', density: '2.34 g/cm³', meltingPoint: '2076 °C', boilingPoint: '3927 °C',
      shells: [2, 3], phase: 'Solid',
      summary: 'Metaloide semiconductor crucial en cerámicas y vidrios de borosilicato.'
    },
    {
      number: 6, symbol: 'C', name: 'Carbon', weight: 12.011,
      category: 'nonmetal', subCategory: 'Reactive Non-metal',
      period: 2, group: 14, electronConfig: '[He] 2s² 2p²',
      atomicMass: '12.011 u', density: '2.267 g/cm³', meltingPoint: '3550 °C', boilingPoint: '4827 °C',
      shells: [2, 4], phase: 'Solid',
      summary: 'Base de toda la química orgánica y de la vida biológica en la Tierra.'
    },
    {
      number: 7, symbol: 'N', name: 'Nitrogen', weight: 14.007,
      category: 'nonmetal', subCategory: 'Reactive Non-metal',
      period: 2, group: 15, electronConfig: '[He] 2s² 2p³',
      atomicMass: '14.007 u', density: '1.251 g/L', meltingPoint: '-210.0 °C', boilingPoint: '-195.8 °C',
      shells: [2, 5], phase: 'Gas',
      summary: 'Gas diatómico inodoro que compone aproximadamente el 78% de la atmósfera terrestre.'
    },
    {
      number: 8, symbol: 'O', name: 'Oxygen', weight: 15.999,
      category: 'nonmetal', subCategory: 'Reactive Non-metal',
      period: 2, group: 16, electronConfig: '[He] 2s² 2p⁴',
      atomicMass: '15.999 u', density: '1.429 g/L', meltingPoint: '-218.8 °C', boilingPoint: '-183.0 °C',
      shells: [2, 6], phase: 'Gas',
      summary: 'Oxidante indispensable para la respiración celular y la combustión.'
    },
    {
      number: 9, symbol: 'F', name: 'Fluorine', weight: 18.998,
      category: 'nonmetal', subCategory: 'Halogen',
      period: 2, group: 17, electronConfig: '[He] 2s² 2p⁵',
      atomicMass: '18.998 u', density: '1.696 g/L', meltingPoint: '-219.7 °C', boilingPoint: '-188.1 °C',
      shells: [2, 7], phase: 'Gas',
      summary: 'El elemento más electronegativo y químicamente reactivo de la tabla periódica.'
    },
    {
      number: 10, symbol: 'Ne', name: 'Neon', weight: 20.180,
      category: 'noble-gas', subCategory: 'Noble Gas',
      period: 2, group: 18, electronConfig: '[He] 2s² 2p⁶',
      atomicMass: '20.180 u', density: '0.9002 g/L', meltingPoint: '-248.6 °C', boilingPoint: '-246.0 °C',
      shells: [2, 8], phase: 'Gas',
      summary: 'Emite un brillo rojo anaranjado intenso en descargas eléctricas luminosas.'
    },

    // Periodo 3
    {
      number: 11, symbol: 'Na', name: 'Sodium', weight: 22.990,
      category: 'metal', subCategory: 'Alkali Metal',
      period: 3, group: 1, electronConfig: '[Ne] 3s¹',
      atomicMass: '22.990 u', density: '0.968 g/cm³', meltingPoint: '97.8 °C', boilingPoint: '883 °C',
      shells: [2, 8, 1], phase: 'Solid',
      summary: 'Metal alcalino blando que reacciona vigorosamente con el agua.'
    },
    {
      number: 12, symbol: 'Mg', name: 'Magnesium', weight: 24.305,
      category: 'metal', subCategory: 'Alkaline Earth Metal',
      period: 3, group: 2, electronConfig: '[Ne] 3s²',
      atomicMass: '24.305 u', density: '1.738 g/cm³', meltingPoint: '650 °C', boilingPoint: '1090 °C',
      shells: [2, 8, 2], phase: 'Solid',
      summary: 'Metal plateado ligero indispensable en la fotosíntesis mediante la clorofila.'
    },
    {
      number: 13, symbol: 'Al', name: 'Aluminium', weight: 26.982,
      category: 'metal', subCategory: 'Post-transition Metal',
      period: 3, group: 13, electronConfig: '[Ne] 3s² 3p¹',
      atomicMass: '26.982 u', density: '2.70 g/cm³', meltingPoint: '660.3 °C', boilingPoint: '2470 °C',
      shells: [2, 8, 3], phase: 'Solid',
      summary: 'Metal maleable y resistente a la corrosión, el más abundante en la corteza terrestre.'
    },
    {
      number: 14, symbol: 'Si', name: 'Silicon', weight: 28.085,
      category: 'metalloid', subCategory: 'Metalloid',
      period: 3, group: 14, electronConfig: '[Ne] 3s² 3p²',
      atomicMass: '28.085 u', density: '2.329 g/cm³', meltingPoint: '1414 °C', boilingPoint: '3265 °C',
      shells: [2, 8, 4], phase: 'Solid',
      summary: 'Pilar de la electrónica moderna, semiconductores y computación microelectrónica.'
    },
    {
      number: 15, symbol: 'P', name: 'Phosphorus', weight: 30.974,
      category: 'nonmetal', subCategory: 'Reactive Non-metal',
      period: 3, group: 15, electronConfig: '[Ne] 3s² 3p³',
      atomicMass: '30.974 u', density: '1.823 g/cm³', meltingPoint: '44.2 °C', boilingPoint: '280.5 °C',
      shells: [2, 8, 5], phase: 'Solid',
      summary: 'Componente esencial del ADN, ARN y la molécula energética ATP.'
    },
    {
      number: 16, symbol: 'S', name: 'Sulfur', weight: 32.06,
      category: 'nonmetal', subCategory: 'Reactive Non-metal',
      period: 3, group: 16, electronConfig: '[Ne] 3s² 3p⁴',
      atomicMass: '32.06 u', density: '2.07 g/cm³', meltingPoint: '115.2 °C', boilingPoint: '444.6 °C',
      shells: [2, 8, 6], phase: 'Solid',
      summary: 'Sólido amarillo brillante que forma aminoácidos esenciales como cisteína y metionina.'
    },
    {
      number: 17, symbol: 'Cl', name: 'Chlorine', weight: 35.45,
      category: 'nonmetal', subCategory: 'Halogen',
      period: 3, group: 17, electronConfig: '[Ne] 3s² 3p⁵',
      atomicMass: '35.45 u', density: '3.214 g/L', meltingPoint: '-101.5 °C', boilingPoint: '-34.0 °C',
      shells: [2, 8, 7], phase: 'Gas',
      summary: 'Poderoso desinfectante y reactivo para la producción de cloruro de sodio (sal común).'
    },
    {
      number: 18, symbol: 'Ar', name: 'Argon', weight: 39.948,
      category: 'noble-gas', subCategory: 'Noble Gas',
      period: 3, group: 18, electronConfig: '[Ne] 3s² 3p⁶',
      atomicMass: '39.948 u', density: '1.784 g/L', meltingPoint: '-189.3 °C', boilingPoint: '-185.8 °C',
      shells: [2, 8, 8], phase: 'Gas',
      summary: 'El tercer gas más común en la atmósfera, usado como atmósfera protectora en soldaduras.'
    },

    // Periodo 4
    {
      number: 19, symbol: 'K', name: 'Potassium', weight: 39.098,
      category: 'metal', subCategory: 'Alkali Metal',
      period: 4, group: 1, electronConfig: '[Ar] 4s¹',
      atomicMass: '39.098 u', density: '0.862 g/cm³', meltingPoint: '63.5 °C', boilingPoint: '759 °C',
      shells: [2, 8, 8, 1], phase: 'Solid',
      summary: 'Electrolito biológico fundamental para la transmisión de impulsos neuronales.'
    },
    {
      number: 20, symbol: 'Ca', name: 'Calcium', weight: 40.078,
      category: 'metal', subCategory: 'Alkaline Earth Metal',
      period: 4, group: 2, electronConfig: '[Ar] 4s²',
      atomicMass: '40.078 u', density: '1.54 g/cm³', meltingPoint: '842 °C', boilingPoint: '1484 °C',
      shells: [2, 8, 8, 2], phase: 'Solid',
      summary: 'Mineral estructural clave en huesos, conchas, dientes y señalización celular.'
    },
    {
      number: 21, symbol: 'Sc', name: 'Scandium', weight: 44.956,
      category: 'metal', subCategory: 'Transition Metal',
      period: 4, group: 3, electronConfig: '[Ar] 3d¹ 4s²',
      atomicMass: '44.956 u', density: '2.985 g/cm³', meltingPoint: '1541 °C', boilingPoint: '2836 °C',
      shells: [2, 8, 9, 2], phase: 'Solid',
      summary: 'Metal de transición ligero usado en aleaciones aeroespaciales de alta resistencia.'
    },
    {
      number: 22, symbol: 'Ti', name: 'Titanium', weight: 47.867,
      category: 'metal', subCategory: 'Transition Metal',
      period: 4, group: 4, electronConfig: '[Ar] 3d² 4s²',
      atomicMass: '47.867 u', density: '4.506 g/cm³', meltingPoint: '1668 °C', boilingPoint: '3287 °C',
      shells: [2, 8, 10, 2], phase: 'Solid',
      summary: 'Excepcional relación resistencia-peso y biocompatibilidad médica para implantes.'
    },
    {
      number: 23, symbol: 'V', name: 'Vanadium', weight: 50.942,
      category: 'metal', subCategory: 'Transition Metal',
      period: 4, group: 5, electronConfig: '[Ar] 3d³ 4s²',
      atomicMass: '50.942 u', density: '6.11 g/cm³', meltingPoint: '1910 °C', boilingPoint: '3407 °C',
      shells: [2, 8, 11, 2], phase: 'Solid',
      summary: 'Aumenta la dureza y tenacidad del acero en herramientas y motores de alta potencia.'
    },
    {
      number: 24, symbol: 'Cr', name: 'Chromium', weight: 51.996,
      category: 'metal', subCategory: 'Transition Metal',
      period: 4, group: 6, electronConfig: '[Ar] 3d⁵ 4s¹',
      atomicMass: '51.996 u', density: '7.19 g/cm³', meltingPoint: '1907 °C', boilingPoint: '2671 °C',
      shells: [2, 8, 13, 1], phase: 'Solid',
      summary: 'Otorga resistencia a la oxidación al acero inoxidable y proporciona acabados cromados.'
    },
    {
      number: 25, symbol: 'Mn', name: 'Manganese', weight: 54.938,
      category: 'metal', subCategory: 'Transition Metal',
      period: 4, group: 7, electronConfig: '[Ar] 3d⁵ 4s²',
      atomicMass: '54.938 u', density: '7.21 g/cm³', meltingPoint: '1246 °C', boilingPoint: '2061 °C',
      shells: [2, 8, 13, 2], phase: 'Solid',
      summary: 'Esencial para la fotosíntesis del oxígeno y la producción de aceros resistentes.'
    },
    {
      number: 26, symbol: 'Fe', name: 'Iron', weight: 55.845,
      category: 'metal', subCategory: 'Transition Metal',
      period: 4, group: 8, electronConfig: '[Ar] 3d⁶ 4s²',
      atomicMass: '55.845 u', density: '7.874 g/cm³', meltingPoint: '1538 °C', boilingPoint: '2862 °C',
      shells: [2, 8, 14, 2], phase: 'Solid',
      summary: 'El metal más utilizado por la humanidad, componente central de la hemoglobina y el acero.'
    },
    {
      number: 27, symbol: 'Co', name: 'Cobalt', weight: 58.933,
      category: 'metal', subCategory: 'Transition Metal',
      period: 4, group: 9, electronConfig: '[Ar] 3d⁷ 4s²',
      atomicMass: '58.933 u', density: '8.90 g/cm³', meltingPoint: '1495 °C', boilingPoint: '2927 °C',
      shells: [2, 8, 15, 2], phase: 'Solid',
      summary: 'Metal ferromagnético crucial en imanes permanentes y baterías de iones de litio.'
    },
    {
      number: 28, symbol: 'Ni', name: 'Nickel', weight: 58.693,
      category: 'metal', subCategory: 'Transition Metal',
      period: 4, group: 10, electronConfig: '[Ar] 3d⁸ 4s²',
      atomicMass: '58.693 u', density: '8.908 g/cm³', meltingPoint: '1455 °C', boilingPoint: '2730 °C',
      shells: [2, 8, 16, 2], phase: 'Solid',
      summary: 'Altamente resistente a la corrosión, utilizado en monedas, turbinas y aleaciones.'
    },
    {
      number: 29, symbol: 'Cu', name: 'Copper', weight: 63.546,
      category: 'metal', subCategory: 'Transition Metal',
      period: 4, group: 11, electronConfig: '[Ar] 3d¹⁰ 4s¹',
      atomicMass: '63.546 u', density: '8.96 g/cm³', meltingPoint: '1085 °C', boilingPoint: '2562 °C',
      shells: [2, 8, 18, 1], phase: 'Solid',
      summary: 'Excelente conductor térmico y eléctrico, protagonista de la revolución electrónica.'
    },
    {
      number: 30, symbol: 'Zn', name: 'Zinc', weight: 65.38,
      category: 'metal', subCategory: 'Transition Metal',
      period: 4, group: 12, electronConfig: '[Ar] 3d¹⁰ 4s²',
      atomicMass: '65.38 u', density: '7.14 g/cm³', meltingPoint: '419.5 °C', boilingPoint: '907 °C',
      shells: [2, 8, 18, 2], phase: 'Solid',
      summary: 'Utilizado principalmente para galvanizar el hierro protegiéndolo de la herrumbre.'
    },
    {
      number: 31, symbol: 'Ga', name: 'Gallium', weight: 69.723,
      category: 'metal', subCategory: 'Post-transition Metal',
      period: 4, group: 13, electronConfig: '[Ar] 3d¹⁰ 4s² 4p¹',
      atomicMass: '69.723 u', density: '5.91 g/cm³', meltingPoint: '29.76 °C', boilingPoint: '2204 °C',
      shells: [2, 8, 18, 3], phase: 'Solid',
      summary: 'Se funde a temperatura corporal (en la palma de la mano); base de semiconductores GaAs.'
    },
    {
      number: 32, symbol: 'Ge', name: 'Germanium', weight: 72.630,
      category: 'metalloid', subCategory: 'Metalloid',
      period: 4, group: 14, electronConfig: '[Ar] 3d¹⁰ 4s² 4p²',
      atomicMass: '72.630 u', density: '5.323 g/cm³', meltingPoint: '938.3 °C', boilingPoint: '2833 °C',
      shells: [2, 8, 18, 4], phase: 'Solid',
      summary: 'Primer semiconductor usado en transistores y actualmente en óptica infrarroja.'
    },
    {
      number: 33, symbol: 'As', name: 'Arsenic', weight: 74.922,
      category: 'metalloid', subCategory: 'Metalloid',
      period: 4, group: 15, electronConfig: '[Ar] 3d¹⁰ 4s² 4p³',
      atomicMass: '74.922 u', density: '5.776 g/cm³', meltingPoint: '817 °C', boilingPoint: '614 °C',
      shells: [2, 8, 18, 5], phase: 'Solid',
      summary: 'Metaloide célebre por su toxicidad histórica y sus aplicaciones en microchips.'
    },
    {
      number: 34, symbol: 'Se', name: 'Selenium', weight: 78.971,
      category: 'nonmetal', subCategory: 'Reactive Non-metal',
      period: 4, group: 16, electronConfig: '[Ar] 3d¹⁰ 4s² 4p⁴',
      atomicMass: '78.971 u', density: '4.81 g/cm³', meltingPoint: '221 °C', boilingPoint: '685 °C',
      shells: [2, 8, 18, 6], phase: 'Solid',
      summary: 'Material fotoconductor utilizado en células solares, fotocopiadoras y nutrición.'
    },
    {
      number: 35, symbol: 'Br', name: 'Bromine', weight: 79.904,
      category: 'nonmetal', subCategory: 'Halogen',
      period: 4, group: 17, electronConfig: '[Ar] 3d¹⁰ 4s² 4p⁵',
      atomicMass: '79.904 u', density: '3.103 g/cm³', meltingPoint: '-7.2 °C', boilingPoint: '58.8 °C',
      shells: [2, 8, 18, 7], phase: 'Liquid',
      summary: 'Uno de los dos únicos elementos líquidos a temperatura ambiente; vapor pardo rojizo.'
    },
    {
      number: 36, symbol: 'Kr', name: 'Krypton', weight: 83.798,
      category: 'noble-gas', subCategory: 'Noble Gas',
      period: 4, group: 18, electronConfig: '[Ar] 3d¹⁰ 4s² 4p⁶',
      atomicMass: '83.798 u', density: '3.749 g/L', meltingPoint: '-157.4 °C', boilingPoint: '-153.2 °C',
      shells: [2, 8, 18, 8], phase: 'Gas',
      summary: 'Gas noble que produce luz blanca brillante, utilizado en lámparas estroboscópicas de alta velocidad.'
    },

    // Periodo 5
    {
      number: 37, symbol: 'Rb', name: 'Rubidium', weight: 85.468,
      category: 'metal', subCategory: 'Alkali Metal',
      period: 5, group: 1, electronConfig: '[Kr] 5s¹',
      atomicMass: '85.468 u', density: '1.532 g/cm³', meltingPoint: '39.3 °C', boilingPoint: '688 °C',
      shells: [2, 8, 18, 8, 1], phase: 'Solid',
      summary: 'Metal alcalino altamente reactivo empleado en relojes atómicos de precisión.'
    },
    {
      number: 38, symbol: 'Sr', name: 'Strontium', weight: 87.62,
      category: 'metal', subCategory: 'Alkaline Earth Metal',
      period: 5, group: 2, electronConfig: '[Kr] 5s²',
      atomicMass: '87.62 u', density: '2.64 g/cm³', meltingPoint: '777 °C', boilingPoint: '1382 °C',
      shells: [2, 8, 18, 8, 2], phase: 'Solid',
      summary: 'Produce el color rojo carmesí brillante característico en fuegos artificiales.'
    },
    {
      number: 39, symbol: 'Y', name: 'Yttrium', weight: 88.906,
      category: 'metal', subCategory: 'Transition Metal',
      period: 5, group: 3, electronConfig: '[Kr] 4d¹ 5s²',
      atomicMass: '88.906 u', density: '4.472 g/cm³', meltingPoint: '1526 °C', boilingPoint: '3345 °C',
      shells: [2, 8, 18, 9, 2], phase: 'Solid',
      summary: 'Utilizado en la fabricación de superconductores de alta temperatura (YBCO) y láseres.'
    },
    {
      number: 40, symbol: 'Zr', name: 'Zirconium', weight: 91.224,
      category: 'metal', subCategory: 'Transition Metal',
      period: 5, group: 4, electronConfig: '[Kr] 4d² 5s²',
      atomicMass: '91.224 u', density: '6.52 g/cm³', meltingPoint: '1855 °C', boilingPoint: '4409 °C',
      shells: [2, 8, 18, 10, 2], phase: 'Solid',
      summary: 'Muy resistente a la corrosión y prácticamente transparente a neutrones; clave en reactores nucleares.'
    },
    {
      number: 41, symbol: 'Nb', name: 'Niobium', weight: 92.906,
      category: 'metal', subCategory: 'Transition Metal',
      period: 5, group: 5, electronConfig: '[Kr] 4d⁴ 5s¹',
      atomicMass: '92.906 u', density: '8.57 g/cm³', meltingPoint: '2477 °C', boilingPoint: '4744 °C',
      shells: [2, 8, 18, 12, 1], phase: 'Solid',
      summary: 'Superconductor utilizado en los potentes imanes de resonancia magnética y aceleradores.'
    },
    {
      number: 42, symbol: 'Mo', name: 'Molybdenum', weight: 95.95,
      category: 'metal', subCategory: 'Transition Metal',
      period: 5, group: 6, electronConfig: '[Kr] 4d⁵ 5s¹',
      atomicMass: '95.95 u', density: '10.28 g/cm³', meltingPoint: '2623 °C', boilingPoint: '4639 °C',
      shells: [2, 8, 18, 13, 1], phase: 'Solid',
      summary: 'Soporta temperaturas extremas sin ablandarse, vital en blindajes militares.'
    },
    {
      number: 43, symbol: 'Tc', name: 'Technetium', weight: 98,
      category: 'metal', subCategory: 'Transition Metal',
      period: 5, group: 7, electronConfig: '[Kr] 4d⁵ 5s²',
      atomicMass: '98 u', density: '11.5 g/cm³', meltingPoint: '2157 °C', boilingPoint: '4265 °C',
      shells: [2, 8, 18, 13, 2], phase: 'Solid',
      summary: 'El primer elemento químico obtenido artificialmente en la historia (1937); usado en medicina nuclear.'
    },
    {
      number: 44, symbol: 'Ru', name: 'Ruthenium', weight: 101.07,
      category: 'metal', subCategory: 'Transition Metal',
      period: 5, group: 8, electronConfig: '[Kr] 4d⁷ 5s¹',
      atomicMass: '101.07 u', density: '12.45 g/cm³', meltingPoint: '2334 °C', boilingPoint: '4150 °C',
      shells: [2, 8, 18, 15, 1], phase: 'Solid',
      summary: 'Metal del grupo del platino, excepcional catalizador químico y endurecedor de contactos.'
    },
    {
      number: 45, symbol: 'Rh', name: 'Rhodium', weight: 102.91,
      category: 'metal', subCategory: 'Transition Metal',
      period: 5, group: 9, electronConfig: '[Kr] 4d⁸ 5s¹',
      atomicMass: '102.91 u', density: '12.41 g/cm³', meltingPoint: '1964 °C', boilingPoint: '3695 °C',
      shells: [2, 8, 18, 16, 1], phase: 'Solid',
      summary: 'Uno de los metales preciosos más valiosos del planeta, vital en catalizadores automotrices.'
    },
    {
      number: 46, symbol: 'Pd', name: 'Palladium', weight: 106.42,
      category: 'metal', subCategory: 'Transition Metal',
      period: 5, group: 10, electronConfig: '[Kr] 4d¹⁰',
      atomicMass: '106.42 u', density: '12.023 g/cm³', meltingPoint: '1555 °C', boilingPoint: '2963 °C',
      shells: [2, 8, 18, 18], phase: 'Solid',
      summary: 'Capaz de absorber hasta 900 veces su propio volumen de gas hidrógeno.'
    },
    {
      number: 47, symbol: 'Ag', name: 'Silver', weight: 107.87,
      category: 'metal', subCategory: 'Transition Metal',
      period: 5, group: 11, electronConfig: '[Kr] 4d¹⁰ 5s¹',
      atomicMass: '107.87 u', density: '10.49 g/cm³', meltingPoint: '961.8 °C', boilingPoint: '2162 °C',
      shells: [2, 8, 18, 18, 1], phase: 'Solid',
      summary: 'Posee la mayor conductividad eléctrica, térmica y reflectividad óptica de todos los metales.'
    },
    {
      number: 48, symbol: 'Cd', name: 'Cadmium', weight: 112.41,
      category: 'metal', subCategory: 'Transition Metal',
      period: 5, group: 12, electronConfig: '[Kr] 4d¹⁰ 5s²',
      atomicMass: '112.41 u', density: '8.65 g/cm³', meltingPoint: '321.1 °C', boilingPoint: '767 °C',
      shells: [2, 8, 18, 18, 2], phase: 'Solid',
      summary: 'Absorbente de neutrones en barras de control nuclear y baterías recargables Ni-Cd.'
    },
    {
      number: 49, symbol: 'In', name: 'Indium', weight: 114.82,
      category: 'metal', subCategory: 'Post-transition Metal',
      period: 5, group: 13, electronConfig: '[Kr] 4d¹⁰ 5s² 5p¹',
      atomicMass: '114.82 u', density: '7.31 g/cm³', meltingPoint: '156.6 °C', boilingPoint: '2072 °C',
      shells: [2, 8, 18, 18, 3], phase: 'Solid',
      summary: 'Componente básico del óxido de indio y estaño (ITO) usado en todas las pantallas táctiles modernas.'
    },
    {
      number: 50, symbol: 'Sn', name: 'Tin', weight: 118.71,
      category: 'metal', subCategory: 'Post-transition Metal',
      period: 5, group: 14, electronConfig: '[Kr] 4d¹⁰ 5s² 5p²',
      atomicMass: '118.71 u', density: '7.365 g/cm³', meltingPoint: '231.9 °C', boilingPoint: '2602 °C',
      shells: [2, 8, 18, 18, 4], phase: 'Solid',
      summary: 'Base del bronce (junto al cobre) que dio nombre a toda una era de la civilización humana.'
    },
    {
      number: 51, symbol: 'Sb', name: 'Antimony', weight: 121.76,
      category: 'metalloid', subCategory: 'Metalloid',
      period: 5, group: 15, electronConfig: '[Kr] 4d¹⁰ 5s² 5p³',
      atomicMass: '121.76 u', density: '6.697 g/cm³', meltingPoint: '630.6 °C', boilingPoint: '1587 °C',
      shells: [2, 8, 18, 18, 5], phase: 'Solid',
      summary: 'Retardante de llamas e ingrediente en aleaciones tipográficas y baterías de plomo.'
    },
    {
      number: 52, symbol: 'Te', name: 'Tellurium', weight: 127.60,
      category: 'metalloid', subCategory: 'Metalloid',
      period: 5, group: 16, electronConfig: '[Kr] 4d¹⁰ 5s² 5p⁴',
      atomicMass: '127.60 u', density: '6.24 g/cm³', meltingPoint: '449.5 °C', boilingPoint: '988 °C',
      shells: [2, 8, 18, 18, 6], phase: 'Solid',
      summary: 'Semiconductor fotoeléctrico usado en paneles solares de película delgada de CdTe.'
    },
    {
      number: 53, symbol: 'I', name: 'Iodine', weight: 126.90,
      category: 'nonmetal', subCategory: 'Halogen',
      period: 5, group: 17, electronConfig: '[Kr] 4d¹⁰ 5s² 5p⁵',
      atomicMass: '126.90 u', density: '4.933 g/cm³', meltingPoint: '113.7 °C', boilingPoint: '184.3 °C',
      shells: [2, 8, 18, 18, 7], phase: 'Solid',
      summary: 'Sólido violeta oscuro indispensable para la producción de hormonas tiroideas.'
    },
    {
      number: 54, symbol: 'Xe', name: 'Xenon', weight: 131.29,
      category: 'noble-gas', subCategory: 'Noble Gas',
      period: 5, group: 18, electronConfig: '[Kr] 4d¹⁰ 5s² 5p⁶',
      atomicMass: '131.29 u', density: '5.894 g/L', meltingPoint: '-111.8 °C', boilingPoint: '-108.1 °C',
      shells: [2, 8, 18, 18, 8], phase: 'Gas',
      summary: 'Gas noble pesado empleado como propelente en motores iónicos de satélites espaciales.'
    },

    // Periodo 6
    {
      number: 55, symbol: 'Cs', name: 'Caesium', weight: 132.91,
      category: 'metal', subCategory: 'Alkali Metal',
      period: 6, group: 1, electronConfig: '[Xe] 6s¹',
      atomicMass: '132.91 u', density: '1.93 g/cm³', meltingPoint: '28.5 °C', boilingPoint: '671 °C',
      shells: [2, 8, 18, 18, 8, 1], phase: 'Solid',
      summary: 'Define oficialmente la duración exacta del segundo en el Sistema Internacional de Unidades.'
    },
    {
      number: 56, symbol: 'Ba', name: 'Barium', weight: 137.33,
      category: 'metal', subCategory: 'Alkaline Earth Metal',
      period: 6, group: 2, electronConfig: '[Xe] 6s²',
      atomicMass: '137.33 u', density: '3.51 g/cm³', meltingPoint: '727 °C', boilingPoint: '1897 °C',
      shells: [2, 8, 18, 18, 8, 2], phase: 'Solid',
      summary: 'Genera el color verde esmeralda en pirotecnia y actúa como contraste radiopaco médico.'
    },

    // Lantánidos (Mostrados en fila 9 con columnas 4 a 18)
    {
      number: 57, symbol: 'La', name: 'Lanthanum', weight: 138.91,
      category: 'metal', subCategory: 'Lanthanide',
      period: 9, group: 4, electronConfig: '[Xe] 5d¹ 6s²',
      atomicMass: '138.91 u', density: '6.162 g/cm³', meltingPoint: '920 °C', boilingPoint: '3464 °C',
      shells: [2, 8, 18, 18, 9, 2], phase: 'Solid',
      summary: 'Prototipo de la serie de los lantánidos; componente óptico de lentes de telescopios.'
    },
    {
      number: 58, symbol: 'Ce', name: 'Cerium', weight: 140.12,
      category: 'metal', subCategory: 'Lanthanide',
      period: 9, group: 5, electronConfig: '[Xe] 4f¹ 5d¹ 6s²',
      atomicMass: '140.12 u', density: '6.77 g/cm³', meltingPoint: '798 °C', boilingPoint: '3443 °C',
      shells: [2, 8, 18, 19, 9, 2], phase: 'Solid',
      summary: 'El lantánido más abundante en la naturaleza; genera chispas en pedernales.'
    },
    {
      number: 59, symbol: 'Pr', name: 'Praseodymium', weight: 140.91,
      category: 'metal', subCategory: 'Lanthanide',
      period: 9, group: 6, electronConfig: '[Xe] 4f³ 6s²',
      atomicMass: '140.91 u', density: '6.77 g/cm³', meltingPoint: '931 °C', boilingPoint: '3520 °C',
      shells: [2, 8, 18, 21, 8, 2], phase: 'Solid',
      summary: 'Aporta color amarillo-verdoso al vidrio protector de soldadores de arco.'
    },
    {
      number: 60, symbol: 'Nd', name: 'Neodymium', weight: 144.24,
      category: 'metal', subCategory: 'Lanthanide',
      period: 9, group: 7, electronConfig: '[Xe] 4f⁴ 6s²',
      atomicMass: '144.24 u', density: '7.01 g/cm³', meltingPoint: '1024 °C', boilingPoint: '3074 °C',
      shells: [2, 8, 18, 22, 8, 2], phase: 'Solid',
      summary: 'Base de los imanes de neodimio (NdFeB), los imanes permanentes más potentes conocidos.'
    },
    {
      number: 61, symbol: 'Pm', name: 'Promethium', weight: 145,
      category: 'metal', subCategory: 'Lanthanide',
      period: 9, group: 8, electronConfig: '[Xe] 4f⁵ 6s²',
      atomicMass: '145 u', density: '7.26 g/cm³', meltingPoint: '1042 °C', boilingPoint: '3000 °C',
      shells: [2, 8, 18, 23, 8, 2], phase: 'Solid',
      summary: 'Único lantánido radiactivo sin isótopos estables, usado en microbaterías nucleares.'
    },
    {
      number: 62, symbol: 'Sm', name: 'Samarium', weight: 150.36,
      category: 'metal', subCategory: 'Lanthanide',
      period: 9, group: 9, electronConfig: '[Xe] 4f⁶ 6s²',
      atomicMass: '150.36 u', density: '7.52 g/cm³', meltingPoint: '1072 °C', boilingPoint: '1794 °C',
      shells: [2, 8, 18, 24, 8, 2], phase: 'Solid',
      summary: 'Imanes de samario-cobalto resistentes a altas temperaturas en aviones militares.'
    },
    {
      number: 63, symbol: 'Eu', name: 'Europium', weight: 151.96,
      category: 'metal', subCategory: 'Lanthanide',
      period: 9, group: 10, electronConfig: '[Xe] 4f⁷ 6s²',
      atomicMass: '151.96 u', density: '5.244 g/cm³', meltingPoint: '822 °C', boilingPoint: '1529 °C',
      shells: [2, 8, 18, 25, 8, 2], phase: 'Solid',
      summary: 'Fósforo luminiscente rojo clave en pantallas y tinta fluorescente de billetes de euro.'
    },
    {
      number: 64, symbol: 'Gd', name: 'Gadolinium', weight: 157.25,
      category: 'metal', subCategory: 'Lanthanide',
      period: 9, group: 11, electronConfig: '[Xe] 4f⁷ 5d¹ 6s²',
      atomicMass: '157.25 u', density: '7.90 g/cm³', meltingPoint: '1313 °C', boilingPoint: '3273 °C',
      shells: [2, 8, 18, 25, 9, 2], phase: 'Solid',
      summary: 'Agente de contraste paramagnético indispensable en resonancias magnéticas (IRM).'
    },
    {
      number: 65, symbol: 'Tb', name: 'Terbium', weight: 158.93,
      category: 'metal', subCategory: 'Lanthanide',
      period: 9, group: 12, electronConfig: '[Xe] 4f⁹ 6s²',
      atomicMass: '158.93 u', density: '8.23 g/cm³', meltingPoint: '1356 °C', boilingPoint: '3230 °C',
      shells: [2, 8, 18, 27, 8, 2], phase: 'Solid',
      summary: 'Emisor de fósforo verde brillante en tubos fluorescentes y sensores magnetostrictivos.'
    },
    {
      number: 66, symbol: 'Dy', name: 'Dysprosium', weight: 162.50,
      category: 'metal', subCategory: 'Lanthanide',
      period: 9, group: 13, electronConfig: '[Xe] 4f¹⁰ 6s²',
      atomicMass: '162.50 u', density: '8.54 g/cm³', meltingPoint: '1412 °C', boilingPoint: '2567 °C',
      shells: [2, 8, 18, 28, 8, 2], phase: 'Solid',
      summary: 'Evita la desmagnetización de motores eléctricos de vehículos híbridos a alta temperatura.'
    },
    {
      number: 67, symbol: 'Ho', name: 'Holmium', weight: 164.93,
      category: 'metal', subCategory: 'Lanthanide',
      period: 9, group: 14, electronConfig: '[Xe] 4f¹¹ 6s²',
      atomicMass: '164.93 u', density: '8.79 g/cm³', meltingPoint: '1474 °C', boilingPoint: '2700 °C',
      shells: [2, 8, 18, 29, 8, 2], phase: 'Solid',
      summary: 'Posee el momento magnético más elevado de cualquier elemento natural.'
    },
    {
      number: 68, symbol: 'Er', name: 'Erbium', weight: 167.26,
      category: 'metal', subCategory: 'Lanthanide',
      period: 9, group: 15, electronConfig: '[Xe] 4f¹² 6s²',
      atomicMass: '167.26 u', density: '9.066 g/cm³', meltingPoint: '1529 °C', boilingPoint: '2868 °C',
      shells: [2, 8, 18, 30, 8, 2], phase: 'Solid',
      summary: 'Dopa los amplificadores de fibra óptica submarinos que transportan internet global.'
    },
    {
      number: 69, symbol: 'Tm', name: 'Thulium', weight: 168.93,
      category: 'metal', subCategory: 'Lanthanide',
      period: 9, group: 16, electronConfig: '[Xe] 4f¹³ 6s²',
      atomicMass: '168.93 u', density: '9.32 g/cm³', meltingPoint: '1545 °C', boilingPoint: '1950 °C',
      shells: [2, 8, 18, 31, 8, 2], phase: 'Solid',
      summary: 'El lantánido estable más escaso; genera fuentes portátiles de rayos X.'
    },
    {
      number: 70, symbol: 'Yb', name: 'Ytterbium', weight: 173.05,
      category: 'metal', subCategory: 'Lanthanide',
      period: 9, group: 17, electronConfig: '[Xe] 4f¹⁴ 6s²',
      atomicMass: '173.05 u', density: '6.90 g/cm³', meltingPoint: '824 °C', boilingPoint: '1196 °C',
      shells: [2, 8, 18, 32, 8, 2], phase: 'Solid',
      summary: 'Referencia atómica en los relojes ópticos más precisos del mundo científico.'
    },
    {
      number: 71, symbol: 'Lu', name: 'Lutetium', weight: 174.97,
      category: 'metal', subCategory: 'Lanthanide',
      period: 9, group: 18, electronConfig: '[Xe] 4f¹⁴ 5d¹ 6s²',
      atomicMass: '174.97 u', density: '9.841 g/cm³', meltingPoint: '1663 °C', boilingPoint: '3402 °C',
      shells: [2, 8, 18, 32, 9, 2], phase: 'Solid',
      summary: 'El lantánido más denso y costoso, utilizado en detectores de tomografía PET.'
    },

    // Periodo 6 Bloque d y p
    {
      number: 72, symbol: 'Hf', name: 'Hafnium', weight: 178.49,
      category: 'metal', subCategory: 'Transition Metal',
      period: 6, group: 4, electronConfig: '[Xe] 4f¹⁴ 5d² 6s²',
      atomicMass: '178.49 u', density: '13.31 g/cm³', meltingPoint: '2233 °C', boilingPoint: '4603 °C',
      shells: [2, 8, 18, 32, 10, 2], phase: 'Solid',
      summary: 'Dieléctrico de alta permitividad (high-k) en compuertas de procesadores Intel.'
    },
    {
      number: 73, symbol: 'Ta', name: 'Tantalum', weight: 180.95,
      category: 'metal', subCategory: 'Transition Metal',
      period: 6, group: 5, electronConfig: '[Xe] 4f¹⁴ 5d³ 6s²',
      atomicMass: '180.95 u', density: '16.69 g/cm³', meltingPoint: '3017 °C', boilingPoint: '5458 °C',
      shells: [2, 8, 18, 32, 11, 2], phase: 'Solid',
      summary: 'Capacitores miniatura de altísima capacitancia en smartphones y ordenadores.'
    },
    {
      number: 74, symbol: 'W', name: 'Tungsten', weight: 183.84,
      category: 'metal', subCategory: 'Transition Metal',
      period: 6, group: 6, electronConfig: '[Xe] 4f¹⁴ 5d⁴ 6s²',
      atomicMass: '183.84 u', density: '19.25 g/cm³', meltingPoint: '3422 °C', boilingPoint: '5555 °C',
      shells: [2, 8, 18, 32, 12, 2], phase: 'Solid',
      summary: 'Posee el punto de fusión más alto de todos los metales (3422 °C).'
    },
    {
      number: 75, symbol: 'Re', name: 'Rhenium', weight: 186.21,
      category: 'metal', subCategory: 'Transition Metal',
      period: 6, group: 7, electronConfig: '[Xe] 4f¹⁴ 5d⁵ 6s²',
      atomicMass: '186.21 u', density: '21.02 g/cm³', meltingPoint: '3186 °C', boilingPoint: '5596 °C',
      shells: [2, 8, 18, 32, 13, 2], phase: 'Solid',
      summary: 'Aleado con níquel forma las superaleaciones de las cámaras de combustión de turbinas.'
    },
    {
      number: 76, symbol: 'Os', name: 'Osmium', weight: 190.23,
      category: 'metal', subCategory: 'Transition Metal',
      period: 6, group: 8, electronConfig: '[Xe] 4f¹⁴ 5d⁶ 6s²',
      atomicMass: '190.23 u', density: '22.59 g/cm³', meltingPoint: '3033 °C', boilingPoint: '5012 °C',
      shells: [2, 8, 18, 32, 14, 2], phase: 'Solid',
      summary: 'El elemento natural con mayor densidad del universo (22.59 g/cm³).'
    },
    {
      number: 77, symbol: 'Ir', name: 'Iridium', weight: 192.22,
      category: 'metal', subCategory: 'Transition Metal',
      period: 6, group: 9, electronConfig: '[Xe] 4f¹⁴ 5d⁷ 6s²',
      atomicMass: '192.22 u', density: '22.56 g/cm³', meltingPoint: '2446 °C', boilingPoint: '4428 °C',
      shells: [2, 8, 18, 32, 15, 2], phase: 'Solid',
      summary: 'El metal más resistente a la corrosión química y huella geológica del asteroide de los dinosaurios.'
    },
    {
      number: 78, symbol: 'Pt', name: 'Platinum', weight: 195.08,
      category: 'metal', subCategory: 'Transition Metal',
      period: 6, group: 10, electronConfig: '[Xe] 4f¹⁴ 5d⁹ 6s¹',
      atomicMass: '195.08 u', density: '21.45 g/cm³', meltingPoint: '1768 °C', boilingPoint: '3825 °C',
      shells: [2, 8, 18, 32, 17, 1], phase: 'Solid',
      summary: 'Metal noble de excepcional valor como catalizador en pilas de combustible de hidrógeno.'
    },
    {
      number: 79, symbol: 'Au', name: 'Gold', weight: 196.97,
      category: 'metal', subCategory: 'Transition Metal',
      period: 6, group: 11, electronConfig: '[Xe] 4f¹⁴ 5d¹⁰ 6s¹',
      atomicMass: '196.97 u', density: '19.30 g/cm³', meltingPoint: '1064 °C', boilingPoint: '2970 °C',
      shells: [2, 8, 18, 32, 18, 1], phase: 'Solid',
      summary: 'El metal más maleable y dúctil; no se oxida ni corroe con el aire o agua.'
    },
    {
      number: 80, symbol: 'Hg', name: 'Mercury', weight: 200.59,
      category: 'metal', subCategory: 'Transition Metal',
      period: 6, group: 12, electronConfig: '[Xe] 4f¹⁴ 5d¹⁰ 6s²',
      atomicMass: '200.59 u', density: '13.534 g/cm³', meltingPoint: '-38.83 °C', boilingPoint: '356.7 °C',
      shells: [2, 8, 18, 32, 18, 2], phase: 'Liquid',
      summary: 'Único metal elemental que permanece líquido en condiciones estándar de presión y temperatura.'
    },
    {
      number: 81, symbol: 'Tl', name: 'Thallium', weight: 204.38,
      category: 'metal', subCategory: 'Post-transition Metal',
      period: 6, group: 13, electronConfig: '[Xe] 4f¹⁴ 5d¹⁰ 6s² 6p¹',
      atomicMass: '204.38 u', density: '11.85 g/cm³', meltingPoint: '304 °C', boilingPoint: '1473 °C',
      shells: [2, 8, 18, 32, 18, 3], phase: 'Solid',
      summary: 'Metal blando y sumamente tóxico utilizado en detectores infrarrojos especializados.'
    },
    {
      number: 82, symbol: 'Pb', name: 'Lead', weight: 207.2,
      category: 'metal', subCategory: 'Post-transition Metal',
      period: 6, group: 14, electronConfig: '[Xe] 4f¹⁴ 5d¹⁰ 6s² 6p²',
      atomicMass: '207.2 u', density: '11.34 g/cm³', meltingPoint: '327.5 °C', boilingPoint: '1749 °C',
      shells: [2, 8, 18, 32, 18, 4], phase: 'Solid',
      summary: 'Metal denso excelente como escudo biológico contra radiaciones ionizantes y rayos gamma.'
    },
    {
      number: 83, symbol: 'Bi', name: 'Bismuth', weight: 208.98,
      category: 'metal', subCategory: 'Post-transition Metal',
      period: 6, group: 15, electronConfig: '[Xe] 4f¹⁴ 5d¹⁰ 6s² 6p³',
      atomicMass: '208.98 u', density: '9.78 g/cm³', meltingPoint: '271.4 °C', boilingPoint: '1564 °C',
      shells: [2, 8, 18, 32, 18, 5], phase: 'Solid',
      summary: 'Cristaliza en hermosas estructuras escalonadas iridiscentes; prácticamente no tóxico.'
    },
    {
      number: 84, symbol: 'Po', name: 'Polonium', weight: 209,
      category: 'metalloid', subCategory: 'Metalloid',
      period: 6, group: 16, electronConfig: '[Xe] 4f¹⁴ 5d¹⁰ 6s² 6p⁴',
      atomicMass: '209 u', density: '9.196 g/cm³', meltingPoint: '254 °C', boilingPoint: '962 °C',
      shells: [2, 8, 18, 32, 18, 6], phase: 'Solid',
      summary: 'Descubierto por Marie y Pierre Curie en 1898; emisor alfa altamente radiactivo.'
    },
    {
      number: 85, symbol: 'At', name: 'Astatine', weight: 210,
      category: 'nonmetal', subCategory: 'Halogen',
      period: 6, group: 17, electronConfig: '[Xe] 4f¹⁴ 5d¹⁰ 6s² 6p⁵',
      atomicMass: '210 u', density: '6.35 g/cm³', meltingPoint: '302 °C', boilingPoint: '337 °C',
      shells: [2, 8, 18, 32, 18, 7], phase: 'Solid',
      summary: 'El elemento natural más escaso de la corteza (menos de 30 gramos en todo el planeta).'
    },
    {
      number: 86, symbol: 'Rn', name: 'Radon', weight: 222,
      category: 'noble-gas', subCategory: 'Noble Gas',
      period: 6, group: 18, electronConfig: '[Xe] 4f¹⁴ 5d¹⁰ 6s² 6p⁶',
      atomicMass: '222 u', density: '9.73 g/L', meltingPoint: '-71 °C', boilingPoint: '-61.7 °C',
      shells: [2, 8, 18, 32, 18, 8], phase: 'Gas',
      summary: 'Gas noble radiactivo incoloro e inodoro producto de la desintegración natural del radio.'
    },

    // Periodo 7
    {
      number: 87, symbol: 'Fr', name: 'Francium', weight: 223,
      category: 'metal', subCategory: 'Alkali Metal',
      period: 7, group: 1, electronConfig: '[Rn] 7s¹',
      atomicMass: '223 u', density: '2.48 g/cm³', meltingPoint: '27 °C', boilingPoint: '677 °C',
      shells: [2, 8, 18, 32, 18, 8, 1], phase: 'Solid',
      summary: 'Segundo elemento más electronegativamente bajo y extremadamente radiactivo.'
    },
    {
      number: 88, symbol: 'Ra', name: 'Radium', weight: 226,
      category: 'metal', subCategory: 'Alkaline Earth Metal',
      period: 7, group: 2, electronConfig: '[Rn] 7s²',
      atomicMass: '226 u', density: '5.5 g/cm³', meltingPoint: '700 °C', boilingPoint: '1737 °C',
      shells: [2, 8, 18, 32, 18, 8, 2], phase: 'Solid',
      summary: 'Famoso por su intensa radioluminiscencia verde-azulada descubierta por Marie Curie.'
    },

    // Actínidos (Mostrados en fila 10 con columnas 4 a 18)
    {
      number: 89, symbol: 'Ac', name: 'Actinium', weight: 227,
      category: 'metal', subCategory: 'Actinide',
      period: 10, group: 4, electronConfig: '[Rn] 6d¹ 7s²',
      atomicMass: '227 u', density: '10.07 g/cm³', meltingPoint: '1050 °C', boilingPoint: '3198 °C',
      shells: [2, 8, 18, 32, 18, 9, 2], phase: 'Solid',
      summary: 'Brilla con un halo azul pálido en la oscuridad debido a su intensa radiactividad.'
    },
    {
      number: 90, symbol: 'Th', name: 'Thorium', weight: 232.04,
      category: 'metal', subCategory: 'Actinide',
      period: 10, group: 5, electronConfig: '[Rn] 6d² 7s²',
      atomicMass: '232.04 u', density: '11.72 g/cm³', meltingPoint: '1750 °C', boilingPoint: '4788 °C',
      shells: [2, 8, 18, 32, 18, 10, 2], phase: 'Solid',
      summary: 'Prometedor combustible para reactores nucleares de sales fundidas de cuarta generación.'
    },
    {
      number: 91, symbol: 'Pa', name: 'Protactinium', weight: 231.04,
      category: 'metal', subCategory: 'Actinide',
      period: 10, group: 6, electronConfig: '[Rn] 5f² 6d¹ 7s²',
      atomicMass: '231.04 u', density: '15.37 g/cm³', meltingPoint: '1568 °C', boilingPoint: '4027 °C',
      shells: [2, 8, 18, 32, 20, 9, 2], phase: 'Solid',
      summary: 'Elemento de transición radiactivo intermedio en la cadena del decaimiento del uranio.'
    },
    {
      number: 92, symbol: 'U', name: 'Uranium', weight: 238.03,
      category: 'metal', subCategory: 'Actinide',
      period: 10, group: 7, electronConfig: '[Rn] 5f³ 6d¹ 7s²',
      atomicMass: '238.03 u', density: '19.1 g/cm³', meltingPoint: '1132 °C', boilingPoint: '4131 °C',
      shells: [2, 8, 18, 32, 21, 9, 2], phase: 'Solid',
      summary: 'Principal combustible para generación de energía eléctrica nuclear mediante fisión (U-235).'
    },
    {
      number: 93, symbol: 'Np', name: 'Neptunium', weight: 237,
      category: 'metal', subCategory: 'Actinide',
      period: 10, group: 8, electronConfig: '[Rn] 5f⁴ 6d¹ 7s²',
      atomicMass: '237 u', density: '20.45 g/cm³', meltingPoint: '644 °C', boilingPoint: '3902 °C',
      shells: [2, 8, 18, 32, 22, 9, 2], phase: 'Solid',
      summary: 'Primer elemento transuránico sintético producido artificialmente en 1940.'
    },
    {
      number: 94, symbol: 'Pu', name: 'Plutonium', weight: 244,
      category: 'metal', subCategory: 'Actinide',
      period: 10, group: 9, electronConfig: '[Rn] 5f⁶ 7s²',
      atomicMass: '244 u', density: '19.86 g/cm³', meltingPoint: '640 °C', boilingPoint: '3228 °C',
      shells: [2, 8, 18, 32, 24, 8, 2], phase: 'Solid',
      summary: 'Fuente térmica nuclear (Pu-238) en sondas espaciales interplanetarias como Voyager y Curiosity.'
    },
    {
      number: 95, symbol: 'Am', name: 'Americium', weight: 243,
      category: 'metal', subCategory: 'Actinide',
      period: 10, group: 10, electronConfig: '[Rn] 5f⁷ 7s²',
      atomicMass: '243 u', density: '13.67 g/cm³', meltingPoint: '1176 °C', boilingPoint: '2011 °C',
      shells: [2, 8, 18, 32, 25, 8, 2], phase: 'Solid',
      summary: 'Utilizado en detectores de humo domésticos por ionización de partículas de aire.'
    },
    {
      number: 96, symbol: 'Cm', name: 'Curium', weight: 247,
      category: 'metal', subCategory: 'Actinide',
      period: 10, group: 11, electronConfig: '[Rn] 5f⁷ 6d¹ 7s²',
      atomicMass: '247 u', density: '13.51 g/cm³', meltingPoint: '1345 °C', boilingPoint: '3110 °C',
      shells: [2, 8, 18, 32, 25, 9, 2], phase: 'Solid',
      summary: 'Nombrado en honor a Marie y Pierre Curie; generador termoeléctrico en misiones lunares.'
    },
    {
      number: 97, symbol: 'Bk', name: 'Berkelium', weight: 247,
      category: 'metal', subCategory: 'Actinide',
      period: 10, group: 12, electronConfig: '[Rn] 5f⁹ 7s²',
      atomicMass: '247 u', density: '14.78 g/cm³', meltingPoint: '986 °C', boilingPoint: '2627 °C',
      shells: [2, 8, 18, 32, 27, 8, 2], phase: 'Solid',
      summary: 'Sintetizado en la Universidad de California, Berkeley en 1949.'
    },
    {
      number: 98, symbol: 'Cf', name: 'Californium', weight: 251,
      category: 'metal', subCategory: 'Actinide',
      period: 10, group: 13, electronConfig: '[Rn] 5f¹⁰ 7s²',
      atomicMass: '251 u', density: '15.1 g/cm³', meltingPoint: '900 °C', boilingPoint: '1470 °C',
      shells: [2, 8, 18, 32, 28, 8, 2], phase: 'Solid',
      summary: 'Potente emisor de neutrones empleado para encender reactores nucleares e identificar oro.'
    },
    {
      number: 99, symbol: 'Es', name: 'Einsteinium', weight: 252,
      category: 'metal', subCategory: 'Actinide',
      period: 10, group: 14, electronConfig: '[Rn] 5f¹¹ 7s²',
      atomicMass: '252 u', density: '8.84 g/cm³', meltingPoint: '860 °C', boilingPoint: '996 °C',
      shells: [2, 8, 18, 32, 29, 8, 2], phase: 'Solid',
      summary: 'Descubierto en los restos de la primera detonación termonuclear de bomba de hidrógeno (1952).'
    },
    {
      number: 100, symbol: 'Fm', name: 'Fermium', weight: 257,
      category: 'metal', subCategory: 'Actinide',
      period: 10, group: 15, electronConfig: '[Rn] 5f¹² 7s²',
      atomicMass: '257 u', density: '9.7 g/cm³', meltingPoint: '1527 °C', boilingPoint: '—',
      shells: [2, 8, 18, 32, 30, 8, 2], phase: 'Solid',
      summary: 'Nombrado en honor al físico nuclear Enrico Fermi; el elemento más pesado creado por captura neutrónica.'
    },
    {
      number: 101, symbol: 'Md', name: 'Mendelevium', weight: 258,
      category: 'metal', subCategory: 'Actinide',
      period: 10, group: 16, electronConfig: '[Rn] 5f¹³ 7s²',
      atomicMass: '258 u', density: '10.3 g/cm³', meltingPoint: '827 °C', boilingPoint: '—',
      shells: [2, 8, 18, 32, 31, 8, 2], phase: 'Solid',
      summary: 'Nombrado en homenaje a Dmitri Mendeléyev, creador de la Tabla Periódica moderna.'
    },
    {
      number: 102, symbol: 'No', name: 'Nobelium', weight: 259,
      category: 'metal', subCategory: 'Actinide',
      period: 10, group: 17, electronConfig: '[Rn] 5f¹⁴ 7s²',
      atomicMass: '259 u', density: '9.9 g/cm³', meltingPoint: '827 °C', boilingPoint: '—',
      shells: [2, 8, 18, 32, 32, 8, 2], phase: 'Solid',
      summary: 'Sintetizado bombardeando curio con iones de carbono; honor a Alfred Nobel.'
    },
    {
      number: 103, symbol: 'Lr', name: 'Lawrencium', weight: 266,
      category: 'metal', subCategory: 'Actinide',
      period: 10, group: 18, electronConfig: '[Rn] 5f¹⁴ 7s² 7p¹',
      atomicMass: '266 u', density: '14.4 g/cm³', meltingPoint: '1627 °C', boilingPoint: '—',
      shells: [2, 8, 18, 32, 32, 8, 3], phase: 'Solid',
      summary: 'Cierra el bloque de los actínidos; honor a Ernest Lawrence, inventor del ciclotrón.'
    },

    // Periodo 7 Bloque d y p (Transactínidos superpesados)
    {
      number: 104, symbol: 'Rf', name: 'Rutherfordium', weight: 267,
      category: 'metal', subCategory: 'Transition Metal',
      period: 7, group: 4, electronConfig: '[Rn] 5f¹⁴ 6d² 7s²',
      atomicMass: '267 u', density: '23.2 g/cm³', meltingPoint: '2100 °C', boilingPoint: '5500 °C',
      shells: [2, 8, 18, 32, 32, 10, 2], phase: 'Synthetic',
      summary: 'Primer elemento superpesado transactínido sintético de la tabla periódica.'
    },
    {
      number: 105, symbol: 'Db', name: 'Dubnium', weight: 268,
      category: 'metal', subCategory: 'Transition Metal',
      period: 7, group: 5, electronConfig: '[Rn] 5f¹⁴ 6d³ 7s²',
      atomicMass: '268 u', density: '29.3 g/cm³', meltingPoint: '—', boilingPoint: '—',
      shells: [2, 8, 18, 32, 32, 11, 2], phase: 'Synthetic',
      summary: 'Nombrado en honor a la ciudad rusa de Dubna, sede del prestigioso centro JINR.'
    },
    {
      number: 106, symbol: 'Sg', name: 'Seaborgium', weight: 269,
      category: 'metal', subCategory: 'Transition Metal',
      period: 7, group: 6, electronConfig: '[Rn] 5f¹⁴ 6d⁴ 7s²',
      atomicMass: '269 u', density: '35.0 g/cm³', meltingPoint: '—', boilingPoint: '—',
      shells: [2, 8, 18, 32, 32, 12, 2], phase: 'Synthetic',
      summary: 'Primer elemento nombrado en honor a una persona viva en ese momento (Glenn T. Seaborg).'
    },
    {
      number: 107, symbol: 'Bh', name: 'Bohrium', weight: 270,
      category: 'metal', subCategory: 'Transition Metal',
      period: 7, group: 7, electronConfig: '[Rn] 5f¹⁴ 6d⁵ 7s²',
      atomicMass: '270 u', density: '37.1 g/cm³', meltingPoint: '—', boilingPoint: '—',
      shells: [2, 8, 18, 32, 32, 13, 2], phase: 'Synthetic',
      summary: 'Nombrado en memoria del célebre físico cuántico danés Niels Bohr.'
    },
    {
      number: 108, symbol: 'Hs', name: 'Hassium', weight: 269,
      category: 'metal', subCategory: 'Transition Metal',
      period: 7, group: 8, electronConfig: '[Rn] 5f¹⁴ 6d⁶ 7s²',
      atomicMass: '269 u', density: '40.7 g/cm³', meltingPoint: '—', boilingPoint: '—',
      shells: [2, 8, 18, 32, 32, 14, 2], phase: 'Synthetic',
      summary: 'Elemento superpesado sintetizado en Darmstadt (Hesse), Alemania.'
    },
    {
      number: 109, symbol: 'Mt', name: 'Meitnerium', weight: 278,
      category: 'metal', subCategory: 'Transition Metal',
      period: 7, group: 9, electronConfig: '[Rn] 5f¹⁴ 6d⁷ 7s²',
      atomicMass: '278 u', density: '37.4 g/cm³', meltingPoint: '—', boilingPoint: '—',
      shells: [2, 8, 18, 32, 32, 15, 2], phase: 'Synthetic',
      summary: 'Homenaje a Lise Meitner, pionera descubridora de la fisión nuclear.'
    },
    {
      number: 110, symbol: 'Ds', name: 'Darmstadtium', weight: 281,
      category: 'metal', subCategory: 'Transition Metal',
      period: 7, group: 10, electronConfig: '[Rn] 5f¹⁴ 6d⁸ 7s²',
      atomicMass: '281 u', density: '34.8 g/cm³', meltingPoint: '—', boilingPoint: '—',
      shells: [2, 8, 18, 32, 32, 16, 2], phase: 'Synthetic',
      summary: 'Elemento sintético del grupo 10 producido en el GSI Helmholtz de Darmstadt.'
    },
    {
      number: 111, symbol: 'Rg', name: 'Roentgenium', weight: 282,
      category: 'metal', subCategory: 'Transition Metal',
      period: 7, group: 11, electronConfig: '[Rn] 5f¹⁴ 6d⁹ 7s²',
      atomicMass: '282 u', density: '28.7 g/cm³', meltingPoint: '—', boilingPoint: '—',
      shells: [2, 8, 18, 32, 32, 17, 2], phase: 'Synthetic',
      summary: 'Nombrado en honor a Wilhelm Röntgen, descubridor de los rayos X.'
    },
    {
      number: 112, symbol: 'Cn', name: 'Copernicium', weight: 285,
      category: 'metal', subCategory: 'Transition Metal',
      period: 7, group: 12, electronConfig: '[Rn] 5f¹⁴ 6d¹⁰ 7s²',
      atomicMass: '285 u', density: '23.7 g/cm³', meltingPoint: '—', boilingPoint: '67 °C',
      shells: [2, 8, 18, 32, 32, 18, 2], phase: 'Synthetic',
      summary: 'Nombrado en memoria del astrónomo Nicolás Copérnico; posiblemente gaseoso.'
    },
    {
      number: 113, symbol: 'Nh', name: 'Nihonium', weight: 286,
      category: 'metal', subCategory: 'Post-transition Metal',
      period: 7, group: 13, electronConfig: '[Rn] 5f¹⁴ 6d¹⁰ 7s² 7p¹',
      atomicMass: '286 u', density: '16.0 g/cm³', meltingPoint: '430 °C', boilingPoint: '1130 °C',
      shells: [2, 8, 18, 32, 32, 18, 3], phase: 'Synthetic',
      summary: 'Primer elemento descubierto en Asia por científicos de RIKEN en Japón (Nihon).'
    },
    {
      number: 114, symbol: 'Fl', name: 'Flerovium', weight: 289,
      category: 'metal', subCategory: 'Post-transition Metal',
      period: 7, group: 14, electronConfig: '[Rn] 5f¹⁴ 6d¹⁰ 7s² 7p²',
      atomicMass: '289 u', density: '14.0 g/cm³', meltingPoint: '-73 °C', boilingPoint: '107 °C',
      shells: [2, 8, 18, 32, 32, 18, 4], phase: 'Synthetic',
      summary: 'Elemento sintético superpesado cerca de la hipotética «Isla de Estabilidad» nuclear.'
    },
    {
      number: 115, symbol: 'Mc', name: 'Moscovium', weight: 290,
      category: 'metal', subCategory: 'Post-transition Metal',
      period: 7, group: 15, electronConfig: '[Rn] 5f¹⁴ 6d¹⁰ 7s² 7p³',
      atomicMass: '290 u', density: '13.5 g/cm³', meltingPoint: '400 °C', boilingPoint: '1100 °C',
      shells: [2, 8, 18, 32, 32, 18, 5], phase: 'Synthetic',
      summary: 'Nombrado en honor a la región del Óblast de Moscú, centro neurálgico de síntesis pesada.'
    },
    {
      number: 116, symbol: 'Lv', name: 'Livermorium', weight: 293,
      category: 'metal', subCategory: 'Post-transition Metal',
      period: 7, group: 16, electronConfig: '[Rn] 5f¹⁴ 6d¹⁰ 7s² 7p⁴',
      atomicMass: '293 u', density: '12.9 g/cm³', meltingPoint: '435 °C', boilingPoint: '812 °C',
      shells: [2, 8, 18, 32, 32, 18, 6], phase: 'Synthetic',
      summary: 'Homenaje al Laboratorio Nacional Lawrence Livermore de California.'
    },
    {
      number: 117, symbol: 'Ts', name: 'Tennessine', weight: 294,
      category: 'nonmetal', subCategory: 'Halogen',
      period: 7, group: 17, electronConfig: '[Rn] 5f¹⁴ 6d¹⁰ 7s² 7p⁵',
      atomicMass: '294 u', density: '7.2 g/cm³', meltingPoint: '450 °C', boilingPoint: '610 °C',
      shells: [2, 8, 18, 32, 32, 18, 7], phase: 'Synthetic',
      summary: 'Nombrado por el estado de Tennessee, sede del Oak Ridge National Laboratory y Vanderbilt.'
    },
    {
      number: 118, symbol: 'Og', name: 'Oganesson', weight: 294,
      category: 'noble-gas', subCategory: 'Noble Gas',
      period: 7, group: 18, electronConfig: '[Rn] 5f¹⁴ 6d¹⁰ 7s² 7p⁶',
      atomicMass: '294 u', density: '5.0 g/cm³', meltingPoint: '80 °C', boilingPoint: '110 °C',
      shells: [2, 8, 18, 32, 32, 18, 8], phase: 'Synthetic',
      summary: 'El elemento más pesado de la tabla periódica; honor al físico nuclear Yuri Oganessian.'
    }
  ];

  ngOnInit(): void {
    // 1. Cargar datos de gamificación y perfil escolar
    this.loadGamificationData();
    this.loadInspectedElements();
    this.loadBestRecord();

    // 2. Inicializar con la lista completa de elementos
    this.filteredElements = [...this.elements];

    // 3. Por defecto, preseleccionar Hierro (Fe, número 26) para desplegar el panel de detalle
    const iron = this.elements.find(el => el.number === 26);
    this.selectedElement = iron ?? this.elements[0];

    // 4. Escucha reactiva en tiempo real al FormControl individual (Clase 5a)
    this.searchSubscription = this.searchElementControl.valueChanges.subscribe(() => {
      this.filterElements();
      this.cdr.markForCheck();
    });
  }

  ngOnDestroy(): void {
    this.searchSubscription?.unsubscribe();
    this.stopTimer();
    if (this.toastTimeout) {
      clearTimeout(this.toastTimeout);
    }
  }

  /**
   * Carga el perfil y gamificación centralizada
   */
  loadGamificationData(): void {
    this.studentProfile = this.progressService.getProfile();
    this.gamification = this.progressService.getGamificationState();
  }

  /**
   * Carga los elementos químicos ya explorados desde localStorage
   */
  loadInspectedElements(): void {
    if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') return;
    try {
      const stored = localStorage.getItem('reactiva_inspected_elements');
      if (stored) {
        const list = JSON.parse(stored) as number[];
        this.inspectedElementsCount = list.length;
      }
    } catch {
      this.inspectedElementsCount = 0;
    }
  }

  /**
   * Carga el récord personal en el mini-juego de Memory
   */
  loadBestRecord(): void {
    if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') return;
    try {
      const key = `reactiva_memory_best_${this.selectedGameCategory}`;
      const stored = localStorage.getItem(key);
      if (stored) {
        this.bestRecord = JSON.parse(stored);
      } else {
        this.bestRecord = null;
      }
    } catch {
      this.bestRecord = null;
    }
  }

  /**
   * Guarda nuevo récord personal en el Memory
   */
  saveBestRecord(moves: number, seconds: number): void {
    if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') return;
    try {
      const key = `reactiva_memory_best_${this.selectedGameCategory}`;
      const isNewBest = !this.bestRecord || moves < this.bestRecord.moves || (moves === this.bestRecord.moves && seconds < this.bestRecord.seconds);
      if (isNewBest) {
        const record = { moves, seconds, time: this.formattedTime };
        localStorage.setItem(key, JSON.stringify(record));
        this.bestRecord = record;
      }
    } catch {
      // Ignorar error de cuota de almacenamiento
    }
  }

  /**
   * Cambia la categoría activa y actualiza la lista
   */
  setCategory(category: string): void {
    this.selectedCategory = category;
    this.filterElements();
    this.cdr.markForCheck();
  }

  /**
   * Filtra elementos combinando el buscador por texto y el filtro de categoría
   */
  filterElements(): void {
    const rawSearch = this.searchElementControl.value || '';
    const term = rawSearch.trim().toLowerCase();

    this.filteredElements = this.elements.filter(el => {
      // 1. Filtrado por categoría
      const matchesCategory =
        this.selectedCategory === 'All Elements' ||
        (this.selectedCategory === 'Metals' && el.category === 'metal') ||
        (this.selectedCategory === 'Metalloids' && el.category === 'metalloid') ||
        (this.selectedCategory === 'Non-metals' && el.category === 'nonmetal') ||
        (this.selectedCategory === 'Noble Gases' && el.category === 'noble-gas');

      // 2. Filtrado por texto (búsqueda por nombre, símbolo o número atómico)
      const matchesSearch =
        !term ||
        el.name.toLowerCase().includes(term) ||
        el.symbol.toLowerCase().includes(term) ||
        el.number.toString() === term;

      return matchesCategory && matchesSearch;
    });
  }

  /**
   * Limpia el campo de búsqueda rápida
   */
  clearSearch(): void {
    this.searchElementControl.setValue('');
  }

  /**
   * Selección de un elemento al hacer clic en su celda del grid con registro interactivo
   */
  onSelectElement(element: ChemicalElement): void {
    this.selectedElement = element;
    this.activeShellHighlight = null;

    // Registro de exploración del elemento en localStorage
    if (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined') {
      try {
        const stored = localStorage.getItem('reactiva_inspected_elements');
        const list: number[] = stored ? JSON.parse(stored) : [];
        const isNew = !list.includes(element.number);

        if (isNew) {
          list.push(element.number);
          localStorage.setItem('reactiva_inspected_elements', JSON.stringify(list));
          this.inspectedElementsCount = list.length;

          // Sincronizar con Desafío #2 ("Caza en la Tabla Periódica")
          const challenges = this.progressService.getChallengesState();
          const challenge2 = challenges.find(c => c.id === 2);
          if (challenge2 && !challenge2.isClaimed && challenge2.currentProgress < challenge2.totalProgress) {
            const prog = this.progressService.progressChallenge(2);
            if (prog.justCompleted) {
              this.showToast(`🎯 ¡Completaste el objetivo "Caza en la Tabla Periódica" (2/2)! Ve a Desafíos para reclamar +40 XP`, 'success');
            } else {
              this.showToast(`Descubriste ${element.name} (${element.symbol}) · Progreso Caza: ${prog.item?.currentProgress}/${prog.item?.totalProgress}`, 'info');
            }
          }

          // Desbloquear insignia si exploró 10 o más elementos
          if (this.inspectedElementsCount >= 10) {
            this.progressService.unlockBadge('detective-organico');
          }
        }
      } catch {
        // Fallback seguro
      }
    }

    this.cdr.markForCheck();
  }

  /**
   * Alterna el resaltado de una capa cuántica específica en el modelo de Bohr
   */
  highlightShell(index: number): void {
    this.activeShellHighlight = this.activeShellHighlight === index ? null : index;
    this.cdr.markForCheck();
  }

  /**
   * Obtiene la cantidad de electrones de valencia (última capa)
   */
  get valenceElectrons(): number {
    if (!this.selectedElement || !this.selectedElement.shells?.length) return 0;
    return this.selectedElement.shells[this.selectedElement.shells.length - 1];
  }

  /**
   * Copia la configuración electrónica al portapapeles
   */
  copyElectronConfig(): void {
    if (!this.selectedElement) return;
    const formula = this.selectedElement.electronConfig;
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(formula).then(() => {
        this.showToast(`Configuración copiada: ${formula} (${this.selectedElement?.symbol})`, 'success');
      }).catch(() => {
        this.showToast(`Configuración: ${formula}`, 'info');
      });
    } else {
      this.showToast(`Configuración: ${formula}`, 'info');
    }
  }

  /**
   * Cierra el panel de detalle lateral
   */
  closeDetail(): void {
    this.selectedElement = null;
    this.cdr.markForCheck();
  }

  /**
   * Calcula el radio de una órbita para el modelo de Bohr SVG
   */
  getShellRadius(index: number, totalShells: number): number {
    const minRadius = 24;
    const maxRadius = 88;
    if (totalShells <= 1) return 40;
    return minRadius + (index * (maxRadius - minRadius)) / (totalShells - 1);
  }

  /**
   * Calcula posiciones radiales de electrones para una capa en el modelo de Bohr SVG
   */
  getShellElectrons(electronCount: number, radius: number): { cx: number; cy: number }[] {
    const maxDots = Math.min(electronCount, 16);
    const dots: { cx: number; cy: number }[] = [];
    const center = 100;

    for (let i = 0; i < maxDots; i++) {
      const angle = (2 * Math.PI * i) / maxDots - Math.PI / 2;
      dots.push({
        cx: Math.round((center + radius * Math.cos(angle)) * 10) / 10,
        cy: Math.round((center + radius * Math.sin(angle)) * 10) / 10
      });
    }
    return dots;
  }

  // --------------------------------------------------------
  // MÉTODOS DEL JUEGO MEMORY / PAREJAS PERIÓDICAS
  // --------------------------------------------------------
  switchTab(tab: 'table' | 'memory'): void {
    this.activeTab = tab;
    if (tab === 'memory' && this.memoryCards.length === 0) {
      this.initMemoryGame();
    }
    this.loadGamificationData();
    this.cdr.markForCheck();
  }

  setGameCategory(cat: string): void {
    this.selectedGameCategory = cat as any;
    this.loadBestRecord();
    this.initMemoryGame();
  }

  initMemoryGame(): void {
    this.stopTimer();
    this.movesCount = 0;
    this.matchesCount = 0;
    this.gameWon = false;
    this.lastGameReward = null;
    this.timerSeconds = 0;
    this.flippedCards = [];
    this.isLockBoard = false;
    this.loadBestRecord();

    const pool = this.selectedGameCategory === 'all'
      ? this.memoryElements
      : this.memoryElements.filter(el => el.category === this.selectedGameCategory);

    this.totalPairs = pool.length;

    const cards: MemoryCard[] = [];
    for (const el of pool) {
      // 1. Tarjeta con el Nombre
      cards.push({
        id: `name-${el.number}`,
        pairId: el.number,
        type: 'name',
        name: el.name,
        symbol: el.symbol,
        number: el.number,
        category: el.category,
        categoryLabel: el.categoryLabel,
        phase: el.phase,
        isFlipped: false,
        isMatched: false
      });

      // 2. Tarjeta con el Símbolo y N° Atómico
      cards.push({
        id: `symbol-${el.number}`,
        pairId: el.number,
        type: 'symbol',
        name: el.name,
        symbol: el.symbol,
        number: el.number,
        category: el.category,
        categoryLabel: el.categoryLabel,
        phase: el.phase,
        isFlipped: false,
        isMatched: false
      });
    }

    this.memoryCards = this.shuffleCards(cards);
    this.startTimer();
    this.cdr.markForCheck();
  }

  private shuffleCards(array: MemoryCard[]): MemoryCard[] {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  flipCard(card: MemoryCard): void {
    if (this.isLockBoard || card.isFlipped || card.isMatched) return;

    card.isFlipped = true;
    this.flippedCards.push(card);
    this.cdr.markForCheck();

    if (this.flippedCards.length === 2) {
      this.movesCount++;
      this.checkMatch();
    }
  }

  private checkMatch(): void {
    const [card1, card2] = this.flippedCards;
    const isMatch = card1.pairId === card2.pairId && card1.type !== card2.type;

    if (isMatch) {
      card1.isMatched = true;
      card2.isMatched = true;
      this.matchesCount++;
      this.flippedCards = [];

      if (this.matchesCount === this.totalPairs) {
        this.gameWon = true;
        this.stopTimer();

        // Recompensa funcional de XP e insignias
        const hasBonus = this.timerSeconds <= 60;
        const totalXpGained = 100 + (hasBonus ? 50 : 0);
        const xpResult = this.progressService.addXp(totalXpGained);

        // Desbloquear insignia de cazador de electrones
        this.progressService.unlockBadge('cazador-electrones');

        // Guardar nuevo récord
        this.saveBestRecord(this.movesCount, this.timerSeconds);

        this.lastGameReward = {
          xp: totalXpGained,
          bonus: hasBonus,
          leveledUp: xpResult.leveledUp
        };

        this.gamification = this.progressService.getGamificationState();

        if (xpResult.leveledUp) {
          this.showToast(`🎉 ¡SUBISTE DE NIVEL! Ahora eres Nivel ${this.gamification.level}: ${this.gamification.levelTitle}`, 'success');
        } else {
          this.showToast(`¡Completaste el Reto de Memoria! +${totalXpGained} XP acreditados a tu cuenta 🏆`, 'success');
        }
      }
      this.cdr.markForCheck();
    } else {
      this.isLockBoard = true;
      setTimeout(() => {
        card1.isFlipped = false;
        card2.isFlipped = false;
        this.flippedCards = [];
        this.isLockBoard = false;
        this.cdr.markForCheck();
      }, 1000);
    }
  }

  startTimer(): void {
    this.stopTimer();
    this.timerInterval = setInterval(() => {
      this.timerSeconds++;
      this.cdr.markForCheck();
    }, 1000);
  }

  stopTimer(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  get formattedTime(): string {
    const mins = Math.floor(this.timerSeconds / 60);
    const secs = this.timerSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  /**
   * Muestra notificación visual flotante temporal (Toast)
   */
  private showToast(message: string, type: 'success' | 'info' = 'success'): void {
    if (this.toastTimeout) {
      clearTimeout(this.toastTimeout);
    }
    this.toastNotification = { message, visible: true, type };
    this.cdr.markForCheck();

    this.toastTimeout = setTimeout(() => {
      this.toastNotification.visible = false;
      this.cdr.markForCheck();
    }, 4000);
  }
}

export { PeriodicTableComponent as TablaPeriodicaComponent };

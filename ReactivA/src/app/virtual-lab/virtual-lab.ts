import { Component, OnInit, OnDestroy, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';

/**
 * Representa un equipo, instrumento o reactivo químico en el laboratorio.
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
}

/**
 * Representa un reactivo atómico/molecular visualizado en el área de reacción.
 */
export interface ActiveReactant {
  id: string;
  symbol: string;
  subscript: string;
  name: string;
  formula: string;
  charge: string;
  color: string;
  position: 'top-left' | 'bottom-left' | 'center-right';
  orbitType: 'orbit-1' | 'orbit-2';
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

  // 2. Catálogo maestro de equipos y reactivos (Requerimiento 1 y 2)
  equipmentList: EquipmentItem[] = [
    {
      id: 'erlenmeyer',
      name: 'Erlenmeyer Flask',
      category: 'glassware',
      categoryLabel: 'Material de Vidrio',
      formula: '500 mL',
      icon: 'ph-flask',
      description: 'Matraz de vidrio borosilicato ideal para mezclar y calentar soluciones.',
      active: true,
      color: '#00a2ed'
    },
    {
      id: 'bunsen',
      name: 'Bunsen Burner',
      category: 'burner',
      categoryLabel: 'Calor & Energía',
      formula: 'CH₄ + 2O₂',
      icon: 'ph-fire',
      description: 'Quemador de gas para proporcionar energía de activación térmica a la reacción.',
      active: false,
      color: '#f97316'
    },
    {
      id: 'water',
      name: 'Distilled Water',
      category: 'reagent',
      categoryLabel: 'Reactivo / Solvente',
      formula: 'H₂O',
      icon: 'ph-drop',
      description: 'Agua pura desionizada utilizada como disolvente y producto de síntesis.',
      active: false,
      color: '#06b6d4'
    },
    {
      id: 'hydrogen',
      name: 'Hydrogen Gas',
      category: 'reagent',
      categoryLabel: 'Gas Reactivo',
      formula: 'H₂',
      icon: 'ph-atom',
      description: 'Gas diatómico inflamable de alta pureza; reactivo clave para la síntesis de agua.',
      active: true,
      color: '#38bdf8'
    },
    {
      id: 'oxygen',
      name: 'Oxygen Gas',
      category: 'reagent',
      categoryLabel: 'Gas Reactivo',
      formula: 'O₂',
      icon: 'ph-wind',
      description: 'Gas oxidante comburente fundamental para la formación molecular.',
      active: true,
      color: '#ec4899'
    },
    {
      id: 'thermometer',
      name: 'Digital Thermometer',
      category: 'instrument',
      categoryLabel: 'Telemetría',
      formula: '0 - 500 °C',
      icon: 'ph-thermometer',
      description: 'Sensor digital de alta precisión para medir la temperatura de reacción en tiempo real.',
      active: false,
      color: '#8b5cf6'
    },
    {
      id: 'stirrer',
      name: 'Magnetic Stirrer',
      category: 'instrument',
      categoryLabel: 'Instrumento',
      formula: '1200 RPM',
      icon: 'ph-arrows-clockwise',
      description: 'Agitador magnético automatizado para homogenizar reactivos en solución.',
      active: false,
      color: '#10b981'
    },
    {
      id: 'cylinder',
      name: 'Graduated Cylinder',
      category: 'glassware',
      categoryLabel: 'Material de Vidrio',
      formula: '100 mL',
      icon: 'ph-test-tube',
      description: 'Probeta graduada para medición volumétrica exacta de reactivos líquidos.',
      active: false,
      color: '#6366f1'
    }
  ];

  filteredEquipment: EquipmentItem[] = [];

  // 3. Reactivos mapeados en las órbitas de simulación (Requerimiento 3)
  activeReactants: ActiveReactant[] = [
    {
      id: 'h1',
      symbol: 'H',
      subscript: '1',
      name: 'Hydrogen Reactant 1',
      formula: 'H₂',
      charge: '+1',
      color: '#0284c7',
      position: 'top-left',
      orbitType: 'orbit-1'
    },
    {
      id: 'h2',
      symbol: 'H',
      subscript: '2',
      name: 'Hydrogen Reactant 2',
      formula: 'H₂',
      charge: '+1',
      color: '#0284c7',
      position: 'bottom-left',
      orbitType: 'orbit-1'
    },
    {
      id: 'o1',
      symbol: 'O',
      subscript: '8',
      name: 'Oxygen Reactant',
      formula: 'O₂',
      charge: '-2',
      color: '#e11d48',
      position: 'center-right',
      orbitType: 'orbit-2'
    }
  ];

  // 4. Variables del Balanceador de Ecuaciones (Requerimiento 4)
  // Reacción: [ coeffH2 ] H₂ + [ coeffO2 ] O₂ ➔ [ coeffH2O ] H₂O
  coeffH2: number | null = null;
  coeffO2: number | null = null;
  coeffH2O: number | null = null;
  isBalanced: boolean = false;
  synthesisSuccess: boolean = false;

  // Variables de telemetría de simulación
  simulationRunning: boolean = true;
  baseTemperature: number = 298; // Kelvin (25 °C)
  pressure: number = 1.0; // atm

  ngOnInit(): void {
    // Inicializar lista visible
    this.filteredEquipment = [...this.equipmentList];

    // 1. Escucha reactiva con valueChanges (Requerimiento 1)
    this.searchSubscription = this.searchControl.valueChanges.subscribe(value => {
      this.searchTerm = value ?? '';
      this.applyFilter();
    });
  }

  ngOnDestroy(): void {
    this.searchSubscription?.unsubscribe();
  }

  /**
   * Filtra los equipos reactivamente según el término de búsqueda y la categoría seleccionada
   */
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

  /**
   * Selecciona una categoría de herramientas para filtrar la lista
   */
  setCategory(category: string): void {
    this.selectedCategory = category;
    this.applyFilter();
  }

  /**
   * Limpia el campo de búsqueda reactivo
   */
  clearSearch(): void {
    this.searchTerm = '';
    this.searchControl.setValue('');
    this.cdr.markForCheck();
  }

  /**
   * Alterna el estado activo de un equipo al hacer clic en él (Requerimiento 2)
   */
  toggleEquipment(item: EquipmentItem): void {
    item.active = !item.active;

    // Efecto reactivo según el equipo seleccionado
    if (item.id === 'bunsen') {
      this.baseTemperature = item.active ? 498 : 298;
    }

    this.cdr.markForCheck();
  }

  /**
   * Retorna los equipos actualmente activos en el canvas
   */
  get activeEquipment(): EquipmentItem[] {
    return this.equipmentList.filter(item => item.active);
  }

  /**
   * Verifica si un equipo específico está activo
   */
  isItemActive(id: string): boolean {
    const found = this.equipmentList.find(item => item.id === id);
    return found ? found.active : false;
  }

  // ==========================================
  // LÓGICA DEL BALANCEADOR DE ECUACIONES (Req 4)
  // ==========================================

  /**
   * Maneja el cambio de valor en los inputs numéricos de la ecuación química
   */
  onCoeffInput(reactant: 'H2' | 'O2' | 'H2O', event: Event): void {
    const inputElement = event.target as HTMLInputElement;
    const rawVal = inputElement.value.trim();
    const parsed = rawVal === '' ? null : Math.max(0, parseInt(rawVal, 10));

    if (reactant === 'H2') this.coeffH2 = parsed;
    if (reactant === 'O2') this.coeffO2 = parsed;
    if (reactant === 'H2O') this.coeffH2O = parsed;

    this.evaluateEquationBalance();
  }

  /**
   * Evalúa en tiempo real si los coeficientes ingresados balancean la reacción:
   * 2 H₂ + 1 O₂ ➔ 2 H₂O
   */
  evaluateEquationBalance(): void {
    const h2 = this.coeffH2 ?? 0;
    const o2 = this.coeffO2 ?? 0;
    const h2o = this.coeffH2O ?? 0;

    // Conteo atómico en reactivos y productos
    const totalHLeft = h2 * 2;
    const totalOLeft = o2 * 2;
    const totalHRight = h2o * 2;
    const totalORight = h2o * 1;

    // Se considera balanceado si todos son mayores a 0 y conservan el número de átomos
    // La relación mínima fundamental es 2, 1, 2 (o cualquier múltiplo entero estequiométrico)
    this.isBalanced =
      h2 > 0 &&
      o2 > 0 &&
      h2o > 0 &&
      totalHLeft === totalHRight &&
      totalOLeft === totalORight;

    if (this.isBalanced) {
      this.synthesisSuccess = true;
    } else {
      this.synthesisSuccess = false;
    }

    this.cdr.markForCheck();
  }

  /**
   * Reinicia los coeficientes y el estado del balanceador (Requerimiento 4)
   */
  resetEquation(): void {
    this.coeffH2 = null;
    this.coeffO2 = null;
    this.coeffH2O = null;
    this.isBalanced = false;
    this.synthesisSuccess = false;
    this.cdr.markForCheck();
  }

  /**
   * Rellena automáticamente los coeficientes correctos como ayuda didáctica
   */
  autoBalanceHelp(): void {
    this.coeffH2 = 2;
    this.coeffO2 = 1;
    this.coeffH2O = 2;
    this.evaluateEquationBalance();
  }

  /**
   * Alterna la pausa/reanudación de la animación en las órbitas
   */
  toggleSimulation(): void {
    this.simulationRunning = !this.simulationRunning;
    this.cdr.markForCheck();
  }

  // Getters para conteo atómico en tiempo real en la interfaz
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
}


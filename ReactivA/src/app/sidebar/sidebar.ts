import { Component, EventEmitter, Input, Output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { NgClass } from '@angular/common';

/**
 * Estructura de un ítem de navegación del Sidebar (Clase 3)
 */
export interface NavItem {
  icon: string;
  label: string;
  route: string;
  exact?: boolean;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, NgClass],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss'
})
export class SidebarComponent {
  /**
   * Estado de colapso del Sidebar (Clase 4b - Class Binding)
   */
  @Input() isCollapsed: boolean = false;

  /**
   * Emisor de evento al padre al alternar colapso/expansión (Clase 5c)
   */
  @Output() collapseChange = new EventEmitter<boolean>();

  /**
   * Emisor de evento para la acción del Asistente Átomo (Clase 5c)
   */
  @Output() assistantClick = new EventEmitter<void>();

  /**
   * Emisor de evento para accesos del pie (Settings/Help) (Clase 5c)
   */
  @Output() footerItemClick = new EventEmitter<NavItem>();

  /**
   * Arreglo dinámico con los ítems del menú principal (Clase 3)
   */
  readonly menuItems: NavItem[] = [
    { label: 'Dashboard', icon: 'ph-squares-four', route: '/dashboard' },
    { label: 'Periodic Table', icon: 'ph-table', route: '/tabla-periodica' },
    { label: 'Virtual Lab', icon: 'ph-test-tube', route: '/virtual-lab' },
    { label: 'Challenges', icon: 'ph-trophy', route: '/challenges' },
    { label: 'Profile', icon: 'ph-user-circle', route: '/profile' }
  ];

  /**
   * Arreglo dinámico con los ítems del menú inferior/footer (Clase 3)
   */
  readonly footerMenuItems: NavItem[] = [
    { label: 'Settings', icon: 'ph-gear', route: '/settings' },
    { label: 'Help', icon: 'ph-question', route: '/help' }
  ];

  /**
   * Alterna el estado expandido/colapsado y notifica al componente padre
   */
  toggleSidebar(): void {
    this.isCollapsed = !this.isCollapsed;
    this.collapseChange.emit(this.isCollapsed);
  }

  /**
   * Dispara el evento del Asistente Átomo
   */
  onAssistantClick(): void {
    console.log('🤖 Asistente Átomo activado desde el Sidebar');
    this.assistantClick.emit();
  }

  /**
   * Dispara el evento al presionar una opción del pie
   */
  onFooterClick(item: NavItem): void {
    this.footerItemClick.emit(item);
  }
}
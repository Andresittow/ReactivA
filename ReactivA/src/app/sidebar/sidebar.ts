import { Component, EventEmitter, Input, Output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { NgClass } from '@angular/common';

/**
 * Estructura de un ítem de navegación del Sidebar.
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
   * Estado de colapso del Sidebar (Class Binding).
   */
  @Input() isCollapsed: boolean = false;

  /**
   * Emisor de evento al padre al alternar colapso/expansión.
   */
  @Output() collapseChange = new EventEmitter<boolean>();

  /**
   * Emisor de evento para accesos del pie (Settings/Help).
   */
  @Output() footerItemClick = new EventEmitter<NavItem>();


  /**
   * Ítems del menú de navegación principal.
   */
  readonly menuItems: NavItem[] = [
    { label: 'Dashboard',      icon: 'ph-squares-four',  route: '/dashboard' },
    { label: 'Periodic Table', icon: 'ph-table',          route: '/tabla-periodica' },
    { label: 'Virtual Lab',    icon: 'ph-test-tube',      route: '/virtual-lab' },
    { label: 'Organic Mission',icon: 'ph-tree-structure', route: '/mision-organica' },
    { label: 'Challenges',     icon: 'ph-trophy',         route: '/challenges' },
    { label: 'Profile',        icon: 'ph-user-circle',    route: '/profile' }
  ];

  /**
   * Ítems del menú inferior (footer).
   */
  readonly footerMenuItems: NavItem[] = [
    { label: 'Settings', icon: 'ph-gear',     route: '/settings' },
    { label: 'Help',     icon: 'ph-question', route: '/help' }
  ];

  /**
   * Alterna el estado expandido/colapsado y notifica al componente padre.
   */
  toggleSidebar(): void {
    this.isCollapsed = !this.isCollapsed;
    this.collapseChange.emit(this.isCollapsed);
  }


  /**
   * Dispara el evento al presionar una opción del pie.
   */
  onFooterClick(item: NavItem): void {
    this.footerItemClick.emit(item);
  }
}

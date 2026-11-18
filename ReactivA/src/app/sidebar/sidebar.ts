import { Component, EventEmitter, Input, Output, OnInit, inject, signal, PLATFORM_ID } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { NgClass, isPlatformBrowser } from '@angular/common';
import { AuthService } from '../core/auth/auth.service';

export interface NavItem { icon: string; label: string; route: string; exact?: boolean; }
@Component({
  selector: 'app-sidebar', standalone: true,
  imports: [RouterLink, RouterLinkActive, NgClass],
  templateUrl: './sidebar.html', styleUrl: './sidebar.scss'
})
export class SidebarComponent implements OnInit {
  readonly auth = inject(AuthService);
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID));
  @Input() isCollapsed = false;
  @Output() collapseChange = new EventEmitter<boolean>();
  @Output() footerItemClick = new EventEmitter<NavItem>();
  readonly signingOut = signal(false);
  readonly logoutError = signal('');
  private readonly studentItems: NavItem[] = [
    { label: 'Dashboard', icon: 'ph-squares-four', route: '/dashboard' },
    { label: 'Tabla periódica', icon: 'ph-table', route: '/periodic-table' },
    { label: 'Laboratorio virtual', icon: 'ph-test-tube', route: '/virtual-lab' },
    { label: 'Misión orgánica', icon: 'ph-tree-structure', route: '/mision-organica' },
    { label: 'Retos', icon: 'ph-trophy', route: '/challenges' },
    { label: 'Perfil', icon: 'ph-user-circle', route: '/profile' }
  ];
  private readonly teacherItems: NavItem[] = [
    { label: 'Panel docente', icon: 'ph-squares-four', route: '/teacher-dashboard' },
    { label: 'Mis aulas', icon: 'ph-users-three', route: '/my-classrooms' }
  ];
  get menuItems(): NavItem[] {
    return this.auth.role() === 'docente' ? this.teacherItems :
      this.auth.role() === 'estudiante' ? this.studentItems : [];
  }
  readonly footerMenuItems: NavItem[] = [
    { label: 'Configuración', icon: 'ph-gear', route: '/settings' },
    { label: 'Ayuda', icon: 'ph-question', route: '/help' }
  ];
  ngOnInit(): void {
    if (!this.browser) return;
    try {
      const saved = localStorage.getItem('reactiva_sidebar_collapsed');
      if (saved !== null) this.isCollapsed = saved === 'true';
    } catch { /* La preferencia es opcional si el navegador bloquea almacenamiento. */ }
    this.collapseChange.emit(this.isCollapsed);
  }
  toggleSidebar(): void {
    this.isCollapsed = !this.isCollapsed;
    if (this.browser) {
      try { localStorage.setItem('reactiva_sidebar_collapsed', String(this.isCollapsed)); } catch {}
    }
    this.collapseChange.emit(this.isCollapsed);
  }
  onFooterClick(item: NavItem): void { this.footerItemClick.emit(item); }
  async signOut(): Promise<void> {
    if (this.signingOut()) return;
    this.signingOut.set(true);
    this.logoutError.set('');
    try { await this.auth.signOut(); }
    catch { this.logoutError.set('No se pudo cerrar sesión. Inténtalo nuevamente.'); }
    finally { this.signingOut.set(false); }
  }
}

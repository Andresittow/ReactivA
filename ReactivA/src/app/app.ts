import { Component, inject, signal } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { filter } from 'rxjs/operators';
import { SidebarComponent } from './sidebar/sidebar';
import { TeacherSidebarComponent } from './teacher-dashboard/teacher-sidebar/teacher-sidebar';
import { SettingsService } from './core/services/settings.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent, TeacherSidebarComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class AppComponent {
  readonly router = inject(Router);
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly settingsService = inject(SettingsService);

  readonly currentLayout = signal<'bare' | 'app'>('bare');

  constructor() {
    this.settingsService.init();

    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        this.updateLayout();
      });

    this.updateLayout();
  }

  private updateLayout(): void {
    let route = this.activatedRoute;
    while (route.firstChild) {
      route = route.firstChild;
    }
    const layout = route.snapshot?.data?.['layout'];
    if (layout === 'bare' || layout === 'app') {
      this.currentLayout.set(layout);
    } else {
      this.currentLayout.set(this.calculateFallbackLayout());
    }
  }

  private calculateFallbackLayout(): 'bare' | 'app' {
    const url = this.router.url.split(/[?#]/)[0];
    if (
      url === '/login' ||
      url === '/register' ||
      url === '/home' ||
      url === '/teacher-dashboard' ||
      url === '/' ||
      url === ''
    ) {
      return 'bare';
    }
    return 'app';
  }

  isBareLayout(): boolean {
    return this.currentLayout() === 'bare';
  }

  isTeacherPage(): boolean {
    const path = this.router.url.split(/[?#]/)[0];
    return path === '/my-classrooms';
  }

  // Compatibilidad hacia atrás
  isAuthPage(): boolean {
    return this.isBareLayout();
  }

  isLoginPage(): boolean {
    return this.isAuthPage();
  }
}

export { AppComponent as App };

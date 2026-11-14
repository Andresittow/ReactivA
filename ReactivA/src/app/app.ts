import { Component } from '@angular/core';
import { RouterOutlet, Router } from '@angular/router';
import { SidebarComponent } from './sidebar/sidebar';
import { TeacherSidebarComponent } from './teacher-dashboard/teacher-sidebar/teacher-sidebar';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent, TeacherSidebarComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class AppComponent {
  constructor(public router: Router) {}

  // Determina si estamos en una pantalla pública o de autenticación (home, login o registro) para ocultar el sidebar
  isAuthPage(): boolean {
    const currentUrl = this.router.url;
    return (
      currentUrl === '/login' ||
      currentUrl.startsWith('/login') ||
      currentUrl === '/register' ||
      currentUrl.startsWith('/register') ||
      currentUrl === '/home' ||
      currentUrl.startsWith('/home') ||
      currentUrl === '/' ||
      currentUrl === ''
    );
  }

  isTeacherPage(): boolean {
    const path = this.router.url.split(/[?#]/)[0];
    return path === '/teacher-dashboard' || path === '/my-classrooms';
  }

  // Compatibilidad hacia atrás
  isLoginPage(): boolean {
    return this.isAuthPage();
  }
}

export { AppComponent as App };
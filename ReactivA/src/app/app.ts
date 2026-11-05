import { Component } from '@angular/core';
import { RouterOutlet, Router } from '@angular/router';
import { SidebarComponent } from './sidebar/sidebar';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class AppComponent {
  constructor(public router: Router) {}

  // Determina si estamos en una pantalla de autenticación (login o registro) para ocultar el sidebar
  isAuthPage(): boolean {
    const currentUrl = this.router.url;
    return (
      currentUrl === '/login' ||
      currentUrl.startsWith('/login') ||
      currentUrl === '/register' ||
      currentUrl.startsWith('/register') ||
      currentUrl === '/' ||
      currentUrl === ''
    );
  }

  // Compatibilidad hacia atrás
  isLoginPage(): boolean {
    return this.isAuthPage();
  }
}

export { AppComponent as App };
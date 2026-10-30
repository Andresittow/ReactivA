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

  // Determina si estamos en la pantalla de login para ocultar el sidebar
  isLoginPage(): boolean {
    const currentUrl = this.router.url;
    return currentUrl === '/login' || currentUrl.startsWith('/login') || currentUrl === '/' || currentUrl === '';
  }
}

export { AppComponent as App };
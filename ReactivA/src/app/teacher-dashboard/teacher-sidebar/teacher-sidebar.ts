import { Component, inject, input, output, signal } from '@angular/core';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-teacher-sidebar',
  standalone: true,
  imports: [],
  templateUrl: './teacher-sidebar.html',
  styleUrl: './teacher-sidebar.scss'
})
export class TeacherSidebarComponent {
  private readonly auth = inject(AuthService);
  readonly signingOut = signal(false);
  readonly logoutError = signal('');
  readonly collapsed = signal(false);
  readonly currentView = input<'overview' | 'classrooms'>('overview');
  readonly viewChange = output<'overview' | 'classrooms'>();

  async signOut(): Promise<void> {
    if (this.signingOut()) return;
    this.signingOut.set(true);
    this.logoutError.set('');
    try { await this.auth.signOut(); }
    catch { this.logoutError.set('No se pudo cerrar sesión. Inténtalo nuevamente.'); }
    finally { this.signingOut.set(false); }
  }

  selectView(view: 'overview' | 'classrooms'): void {
    this.viewChange.emit(view);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }
}

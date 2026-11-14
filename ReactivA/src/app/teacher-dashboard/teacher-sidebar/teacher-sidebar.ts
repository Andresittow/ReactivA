import { Component, input, output, signal } from '@angular/core';

@Component({
  selector: 'app-teacher-sidebar',
  standalone: true,
  imports: [],
  templateUrl: './teacher-sidebar.html',
  styleUrl: './teacher-sidebar.scss'
})
export class TeacherSidebarComponent {
  readonly collapsed = signal(false);
  readonly currentView = input<'overview' | 'classrooms'>('overview');
  readonly viewChange = output<'overview' | 'classrooms'>();

  selectView(view: 'overview' | 'classrooms'): void {
    this.viewChange.emit(view);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }
}

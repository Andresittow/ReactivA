import { Component, signal } from '@angular/core';

@Component({
  selector: 'app-teacher-sidebar',
  standalone: true,
  imports: [],
  templateUrl: './teacher-sidebar.html',
  styleUrl: './teacher-sidebar.scss'
})
export class TeacherSidebarComponent {
  readonly collapsed = signal(false);
  readonly activeSection = signal<'overview' | 'classrooms'>('overview');

  scrollToSection(sectionId: 'overview' | 'classrooms'): void {
    this.activeSection.set(sectionId);
    if (sectionId === 'overview') {
      const el = document.getElementById('teacher-overview');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } else if (sectionId === 'classrooms') {
      const el = document.getElementById('teacher-students');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }
}

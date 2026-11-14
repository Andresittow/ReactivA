import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-teacher-sidebar',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './teacher-sidebar.html',
  styleUrl: './teacher-sidebar.scss'
})
export class TeacherSidebarComponent {
  readonly collapsed = signal(false);
}

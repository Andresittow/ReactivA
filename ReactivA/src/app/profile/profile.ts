import { Component, ChangeDetectionStrategy, ChangeDetectorRef, OnDestroy, inject, effect, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { AuthService } from '../core/auth/auth.service';
import { StudentProgressService } from '../dashboard/student-progress.service';
import { ClassroomService } from '../core/services/classroom.service';
import { ProfileDataService } from '../core/services/profile-data.service';
import { Classroom } from '../core/models/classroom.model';
import { LearningEvent } from '../core/models/learning-event.model';

@Component({
  selector: 'app-profile', standalone: true, imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './profile.html', styleUrl: './profile.scss', changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProfileComponent implements OnDestroy {
  readonly auth = inject(AuthService);
  readonly progress = inject(StudentProgressService);
  private readonly classrooms = inject(ClassroomService);
  private readonly data = inject(ProfileDataService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly fb = inject(FormBuilder);
  private generation = 0;
  private destroyed = false;
  private loadedUserId: string | null = null;
  loading = false;
  historyLoading = false;
  classroomLoading = false;
  historyError = '';
  classroomError = '';
  progressError = '';
  actionError = '';
  saving = false;
  joining = false;
  leaving = false;
  isEditModalOpen = false;
  confirmLeave = false;
  toastMessage = '';
  pin = '';
  classroom: Classroom | null = null;
  teacherName: string | null = null;
  events: LearningEvent[] = [];
  readonly editProfileForm = this.fb.nonNullable.group({
    fullName: ['', [Validators.required, Validators.maxLength(100)]],
    grade: ['', Validators.maxLength(50)],
    school: ['', Validators.maxLength(150)]
  });
  constructor() {
    effect(() => {
      const id = this.auth.user()?.id ?? null;
      if (id === this.loadedUserId) return;
      this.loadedUserId = id;
      this.generation++;
      this.events = []; this.classroom = null; this.teacherName = null;
      this.isEditModalOpen = false; this.confirmLeave = false;
      this.pin = ''; this.actionError = ''; this.toastMessage = '';
      if (id && this.browser) void this.load();
    });
  }
  ngOnDestroy(): void { this.destroyed = true; this.generation++; }
  private refresh(): void { if (!this.destroyed) this.cdr.markForCheck(); }
  get initials(): string {
    return (this.auth.user()?.fullName ?? '').trim().split(/\s+/).slice(0, 2).map(p => p[0] ?? '').join('').toUpperCase() || '?';
  }
  get state() { return this.progress.getGamificationState(); }
  get badges(): string[] { return this.progress.getUnlockedBadges(); }
  async load(): Promise<void> {
    this.loading = true; this.progressError = ''; this.refresh();
    const generation = this.generation;
    await Promise.all([this.loadHistory(), this.loadClassroom(),
      this.progress.hydrate().catch(() => { if (generation === this.generation) this.progressError = 'No se pudo cargar el progreso.'; })]);
    if (generation === this.generation) { this.loading = false; this.refresh(); }
  }
  async loadHistory(): Promise<void> {
    const generation = this.generation;
    this.historyLoading = true; this.historyError = ''; this.refresh();
    try { const events = await this.data.recentEvents(); if (generation === this.generation) this.events = events; }
    catch { if (generation === this.generation) this.historyError = 'No se pudo cargar tu historial.'; }
    finally { if (generation === this.generation) { this.historyLoading = false; this.refresh(); } }
  }
  async loadClassroom(): Promise<void> {
    const generation = this.generation;
    this.classroomLoading = true; this.classroomError = ''; this.refresh();
    try {
      const classroom = await this.classrooms.getMyClassroom();
      const teacherName = classroom ? await this.data.teacherName() : null;
      if (generation === this.generation) { this.classroom = classroom; this.teacherName = teacherName; }
    } catch { if (generation === this.generation) this.classroomError = 'No se pudo consultar tu aula.'; }
    finally { if (generation === this.generation) { this.classroomLoading = false; this.refresh(); } }
  }
  openEditProfileModal(): void {
    const user = this.auth.user();
    if (!user) return;
    this.editProfileForm.reset({ fullName: user.fullName, grade: user.grade ?? '', school: user.school ?? '' });
    this.actionError = ''; this.isEditModalOpen = true;
  }
  closeEditProfileModal(): void { if (!this.saving) this.isEditModalOpen = false; }
  async saveProfile(): Promise<void> {
    if (this.saving) return;
    const input = this.editProfileForm.getRawValue();
    input.fullName = input.fullName.trim(); input.grade = input.grade.trim(); input.school = input.school.trim();
    if (this.editProfileForm.invalid || !input.fullName) {
      this.actionError = 'Escribe un nombre válido y revisa los campos.'; return;
    }
    this.saving = true; this.actionError = ''; this.refresh();
    try { await this.auth.updateProfile(input); this.isEditModalOpen = false; this.toastMessage = 'Perfil guardado.'; }
    catch { this.actionError = 'No se pudo guardar el perfil. Inténtalo nuevamente.'; }
    finally { this.saving = false; this.refresh(); }
  }
  async join(): Promise<void> {
    if (this.joining) return;
    this.joining = true; this.actionError = ''; this.refresh();
    try { await this.classrooms.joinByPin(this.pin); this.pin = ''; await this.loadClassroom(); }
    catch (error) { this.actionError = error instanceof Error ? error.message : 'No se pudo unir al aula.'; }
    finally { this.joining = false; this.refresh(); }
  }
  async leave(): Promise<void> {
    if (!this.classroom || !this.confirmLeave || this.leaving) return;
    this.leaving = true; this.actionError = ''; this.refresh();
    try { await this.classrooms.leave(this.classroom.id); this.classroom = null; this.teacherName = null; this.confirmLeave = false; }
    catch { this.actionError = 'No se pudo salir del aula. Inténtalo nuevamente.'; }
    finally { this.leaving = false; this.refresh(); }
  }
  downloadReportPdf(): void {
    if (this.browser && !this.loading && !this.historyLoading) window.print();
  }
}
export { ProfileComponent as Profile };

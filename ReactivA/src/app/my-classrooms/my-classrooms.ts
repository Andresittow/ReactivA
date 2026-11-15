import { Component, ChangeDetectionStrategy, ChangeDetectorRef, Input, OnInit, OnDestroy, inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Classroom, NewClassroom } from '../core/models/classroom.model';
import { ClassroomService, ClassroomMemberProgress } from '../core/services/classroom.service';
import { AuthService } from '../core/auth/auth.service';

@Component({
  selector: 'app-my-classrooms', standalone: true, host: { '[class.embedded]': 'embedded' }, imports: [CommonModule, FormsModule],
  templateUrl: './my-classrooms.html', styleUrl: './my-classrooms.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MyClassroomsComponent implements OnInit, OnDestroy {
  @Input() embedded = false;
  readonly auth = inject(AuthService);
  private readonly service = inject(ClassroomService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID));
  private generation = 0;
  private destroyed = false;
  aulas: Classroom[] = [];
  members: ClassroomMemberProgress[] = [];
  searchQuery = '';
  filtroActivo = 'all';
  loading = false;
  busy = false;
  membersLoading = false;
  error = '';
  membersError = '';
  actionError = '';
  toastMessage = '';
  modal: 'edit' | 'members' | 'assign' | 'delete' | 'pin' | null = null;
  selected: Classroom | null = null;
  draft: NewClassroom = this.emptyDraft();
  assignment = { title: '', workshop: '', dueDate: '' };
  ngOnInit(): void { if (this.browser) void this.load(); }
  ngOnDestroy(): void { this.destroyed = true; this.generation++; }
  private refresh(): void { if (!this.destroyed) this.cdr.markForCheck(); }
  private emptyDraft(): NewClassroom {
    return { name: '', tag: '', location: '', schedule: '', gradeFilter: 'all', capacity: 30,
      activeModule: '', currentWeek: 1, totalWeeks: 16 };
  }
  get aulasFiltradas(): Classroom[] {
    const q = this.searchQuery.trim().toLocaleLowerCase();
    return this.aulas.filter(a => (this.filtroActivo === 'all' || a.gradeFilter === this.filtroActivo) &&
      [a.name, a.location, a.activeModule, a.gradeFilter].some(v => (v ?? '').toLocaleLowerCase().includes(q)));
  }
  contarPorFiltro(filter: string): number {
    return filter === 'all' ? this.aulas.length : this.aulas.filter(a => a.gradeFilter === filter).length;
  }
  async load(): Promise<void> {
    const generation = ++this.generation;
    this.loading = true; this.error = ''; this.refresh();
    try {
      const aulas = await this.service.listMine();
      if (generation === this.generation) this.aulas = aulas;
    } catch { if (generation === this.generation) this.error = 'No se pudieron cargar tus aulas.'; }
    finally { if (generation === this.generation) { this.loading = false; this.refresh(); } }
  }
  openCreate(): void { this.selected = null; this.draft = this.emptyDraft(); this.open('edit'); }
  openEdit(aula: Classroom): void {
    this.selected = aula;
    this.draft = { name: aula.name, tag: aula.tag ?? '', location: aula.location ?? '',
      schedule: aula.schedule ?? '', gradeFilter: aula.gradeFilter ?? 'all', capacity: aula.capacity,
      activeModule: aula.activeModule ?? '', currentWeek: aula.currentWeek, totalWeeks: aula.totalWeeks };
    this.open('edit');
  }
  openAction(aula: Classroom, modal: 'assign' | 'delete' | 'pin'): void {
    this.selected = aula; this.assignment = { title: '', workshop: '', dueDate: '' }; this.open(modal);
  }
  private open(modal: NonNullable<MyClassroomsComponent['modal']>): void {
    this.actionError = ''; this.toastMessage = ''; this.modal = modal;
  }
  close(): void { if (!this.busy) { this.modal = null; this.selected = null; } }
  private validDraft(): boolean {
    const d = this.draft;
    return !!d.name.trim() && d.name.trim().length <= 100 && (d.tag?.length ?? 0) <= 40 &&
      (d.location?.length ?? 0) <= 150 && (d.schedule?.length ?? 0) <= 150 &&
      (d.activeModule?.length ?? 0) <= 100 && Number.isInteger(d.capacity) && d.capacity! >= 1 && d.capacity! <= 60 &&
      Number.isInteger(d.currentWeek) && d.currentWeek! >= 1 &&
      Number.isInteger(d.totalWeeks) && d.totalWeeks! >= d.currentWeek! &&
      !this.aulas.some(a => a.id !== this.selected?.id &&
        a.name.trim().toLocaleLowerCase() === d.name.trim().toLocaleLowerCase());
  }
  async save(): Promise<void> {
    if (this.busy) return;
    if (!this.validDraft()) { this.actionError = 'Revisa nombre único, longitudes, cupo (1–60) y semanas.'; return; }
    await this.mutate(async () => {
      const aula = this.selected ? await this.service.update(this.selected.id, this.draft) :
        await this.service.create(this.draft);
      this.aulas = this.selected ? this.aulas.map(a => a.id === aula.id ? aula : a) : [...this.aulas, aula];
    }, 'Aula guardada.');
  }
  async remove(): Promise<void> {
    if (!this.selected) return;
    const id = this.selected.id;
    await this.mutate(async () => { await this.service.remove(id); this.aulas = this.aulas.filter(a => a.id !== id); }, 'Aula eliminada.');
  }
  async regenerate(): Promise<void> {
    if (!this.selected) return;
    const id = this.selected.id;
    await this.mutate(async () => {
      const pin = await this.service.regeneratePin(id);
      this.aulas = this.aulas.map(a => a.id === id ? { ...a, joinPin: pin } : a);
    }, 'PIN regenerado. El anterior ya no es válido.');
  }
  async copyPin(aula: Classroom): Promise<void> {
    if (!this.browser) return;
    try { await navigator.clipboard.writeText(aula.joinPin); this.toastMessage = 'PIN copiado.'; }
    catch { this.toastMessage = 'No se pudo copiar. Selecciona el PIN y cópialo manualmente.'; }
    this.refresh();
  }
  async viewMembers(aula: Classroom): Promise<void> {
    this.selected = aula; this.open('members'); this.members = []; this.membersError = '';
    this.membersLoading = true; this.refresh();
    try {
      const members = await this.service.listMembers(aula.id);
      if (this.selected?.id === aula.id && this.modal === 'members') this.members = members;
    } catch { if (this.selected?.id === aula.id) this.membersError = 'No se pudieron cargar los estudiantes.'; }
    finally { this.membersLoading = false; this.refresh(); }
  }
  async assign(): Promise<void> {
    if (!this.selected) return;
    const { title, workshop, dueDate } = this.assignment;
    if (!title.trim() || title.trim().length > 150 || !workshop.trim() || workshop.trim().length > 2000 ||
      (dueDate && (!/^\d{4}-\d{2}-\d{2}$/.test(dueDate) || !Number.isFinite(Date.parse(dueDate))))) {
      this.actionError = 'Escribe un título y un taller válidos; revisa la fecha.'; return;
    }
    const id = this.selected.id;
    await this.mutate(() => this.service.assignWorkshop(id, { title, workshop, dueDate: dueDate || undefined }), 'Taller asignado.');
  }
  private async mutate(action: () => Promise<void>, message: string): Promise<void> {
    if (this.busy) return;
    this.busy = true; this.actionError = ''; this.refresh();
    try { await action(); this.modal = null; this.selected = null; this.toastMessage = message; }
    catch (error) { this.actionError = error instanceof Error ? error.message : 'No se pudo guardar. Inténtalo de nuevo.'; }
    finally { this.busy = false; this.refresh(); }
  }
}

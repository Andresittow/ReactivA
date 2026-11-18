import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { By } from '@angular/platform-browser';
import { TeacherDashboardComponent } from './teacher-dashboard';
import { TeacherDashboardService } from './services/teacher-dashboard.service';
import { StudentProgressService } from '../dashboard/student-progress.service';
import { AuthService } from '../core/auth/auth.service';
import { ClassroomService } from '../core/services/classroom.service';
import { MyClassroomsComponent } from '../my-classrooms/my-classrooms';

describe('Panel docente conectado a la sesión y a las aulas', () => {
  const classroom = { id: 'aula-real', teacherId: 'docente', name: 'Química 10', joinPin: 'CHEM-3729', capacity: 30 };
  let user: ReturnType<typeof signal<any>>;
  let auth: any;
  let classrooms: any;
  beforeEach(() => {
    user = signal({ id: 'docente', role: 'docente', fullName: 'Ana Pérez', school: 'Colegio Central' });
    auth = { user, signOut: vi.fn().mockResolvedValue(undefined) };
    classrooms = { listMine: vi.fn().mockResolvedValue([]), create: vi.fn().mockResolvedValue(classroom) };
    TestBed.configureTestingModule({ imports: [TeacherDashboardComponent], providers: [
      { provide: AuthService, useValue: auth },
      { provide: StudentProgressService, useValue: {} },
      { provide: ClassroomService, useValue: classrooms }
    ] });
    const service = TestBed.inject(TeacherDashboardService);
    vi.spyOn(service, 'getAcademicOverviewKPIs').mockReturnValue({ totalStudents: 0, activeStudents: 0,
      completedTasksStudents: 0, pendingTasksStudents: 0, averageProgressPercent: 0, engagementLevel: 'Medio' });
    vi.spyOn(service, 'getRecentLearningActivities').mockReturnValue([]);
    vi.spyOn(service, 'getSectionsOverview').mockReturnValue([]);
    vi.spyOn(service, 'getStudentsList').mockReturnValue([]);
  });
  async function setup() {
    const fixture = TestBed.createComponent(TeacherDashboardComponent);
    fixture.detectChanges(); await fixture.whenStable(); fixture.detectChanges(); return fixture;
  }
  it('muestra el perfil autenticado y actualiza el nombre sin usar la identidad demo', async () => {
    const fixture = await setup();
    expect(fixture.nativeElement.querySelector('.teacher-name').textContent).toContain('Ana Pérez');
    expect(fixture.nativeElement.querySelector('.teacher-meta').textContent).toContain('Colegio Central');
    user.set({ ...user(), fullName: 'Carlos Díaz', school: 'Otro colegio' }); fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.teacher-name').textContent).toContain('Carlos Díaz');
    expect(fixture.nativeElement.textContent).not.toContain('Roberto Méndez');
    expect(fixture.nativeElement.querySelector('.active-pin-box')).toBeNull();
  });
  it('crea desde el dashboard con el servicio y muestra el PIN retornado al guardar y recargar', async () => {
    const fixture = await setup();
    fixture.nativeElement.querySelector('.btn-classroom-pins').click();
    fixture.detectChanges(); await fixture.whenStable(); fixture.detectChanges();
    const child = fixture.debugElement.query(By.directive(MyClassroomsComponent)).componentInstance as MyClassroomsComponent;
    expect(child.embedded).toBe(true);
    expect(classrooms.listMine).toHaveBeenCalled();
    child.openCreate(); child.draft.name = classroom.name;
    await child.save(); fixture.detectChanges();
    expect(classrooms.create).toHaveBeenCalledWith(expect.objectContaining({ name: classroom.name }));
    expect(fixture.nativeElement.textContent).toContain(classroom.joinPin);
    classrooms.listMine.mockResolvedValue([classroom]);
    fixture.componentInstance.setView('overview'); fixture.detectChanges();
    fixture.componentInstance.setView('classrooms'); fixture.detectChanges();
    await fixture.whenStable(); fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain(classroom.joinPin);
  });
  it('cierra la sesión del profesor desde su menú', async () => {
    const fixture = await setup();
    fixture.nativeElement.querySelector('button[aria-label="Cerrar sesión"]').click();
    await fixture.whenStable();
    expect(auth.signOut).toHaveBeenCalledOnce();
  });
});

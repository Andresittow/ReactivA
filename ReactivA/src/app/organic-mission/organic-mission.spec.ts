import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { MisionOrganicaComponent } from './organic-mission';
import { GameService } from './services/game.service';
import { ClassroomService } from '../core/services/classroom.service';
import { AuthService } from '../core/auth/auth.service';

describe('Misión Orgánica: conexión real al aula', () => {
  const classroom = { getMyClassroom: vi.fn() };
  const game = { initialize: vi.fn(), ready: signal(false), error: signal<string | null>(null), getStudentGuidance: vi.fn(), clearStudentGuidance: vi.fn() };
  beforeEach(() => {
    vi.clearAllMocks(); game.getStudentGuidance.mockResolvedValue(null);
    classroom.getMyClassroom.mockResolvedValue(null);
    TestBed.configureTestingModule({ imports: [MisionOrganicaComponent], providers: [provideRouter([]),
      { provide: GameService, useValue: game }, { provide: ClassroomService, useValue: classroom },
      { provide: AuthService, useValue: { user: () => ({ id: 'a' }) } }
    ] });
  });
  it('sin aula no inventa PIN ni orientación', async () => {
    const fixture = TestBed.createComponent(MisionOrganicaComponent); fixture.detectChanges(); await fixture.whenStable();
    expect(fixture.componentInstance.activeTeacherPin()).toBe('');
    expect(fixture.componentInstance.teacherGuidance()).toBeNull();
    expect(fixture.nativeElement.textContent).not.toContain('CHEM-8420');
    expect(game.initialize).toHaveBeenCalledTimes(1);
  });
  it('carga nombre y PIN reales del aula', async () => {
    classroom.getMyClassroom.mockResolvedValue({ name: 'Orgánica 10', joinPin: 'CHEM-1234' });
    const fixture = TestBed.createComponent(MisionOrganicaComponent);
    await fixture.componentInstance.syncTeacherConnection();
    expect(fixture.componentInstance.classroomName()).toBe('Orgánica 10');
    expect(fixture.componentInstance.activeTeacherPin()).toBe('CHEM-1234');
  });
  it('error de aula es recuperable y no bloquea el juego', async () => {
    classroom.getMyClassroom.mockRejectedValueOnce(new Error('red'));
    const component = TestBed.createComponent(MisionOrganicaComponent).componentInstance;
    await component.syncTeacherConnection(); expect(component.connectionError()).toContain('continuar');
    await component.syncTeacherConnection(); expect(component.connectionError()).toBeNull();
  });
});

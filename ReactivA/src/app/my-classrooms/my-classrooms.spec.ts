import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { MyClassroomsComponent } from './my-classrooms';
import { ClassroomService } from '../core/services/classroom.service';
import { AuthService } from '../core/auth/auth.service';

describe('MyClassrooms PR-V2', () => {
  const aula = { id: 'a', teacherId: 'd', name: 'Química', joinPin: 'CHEM-1234', capacity: 20, currentWeek: 1, totalWeeks: 16, gradeFilter: '10' };
  let api: any;
  beforeEach(() => {
    api = { listMine: vi.fn().mockResolvedValue([]), create: vi.fn().mockResolvedValue(aula),
      update: vi.fn().mockResolvedValue({ ...aula, name: 'Editada' }), remove: vi.fn().mockResolvedValue(undefined),
      listMembers: vi.fn().mockResolvedValue([]), regeneratePin: vi.fn().mockResolvedValue('CHEM-9999'),
      assignWorkshop: vi.fn().mockResolvedValue(undefined) };
    TestBed.configureTestingModule({ imports: [MyClassroomsComponent], providers: [
      { provide: ClassroomService, useValue: api },
      { provide: AuthService, useValue: { user: signal({ id: 'd', fullName: 'Docente', school: 'Colegio' }) } }
    ] });
  });
  async function setup() {
    const fixture = TestBed.createComponent(MyClassroomsComponent);
    fixture.detectChanges(); await fixture.whenStable(); fixture.detectChanges(); return fixture;
  }
  it('muestra vacío real y embedded oculta chrome conservando crear aula', async () => {
    const fixture = await setup();
    expect(fixture.nativeElement.textContent).toContain('Aún no tienes aulas');
    fixture.componentRef.setInput('embedded', true); fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.inst-topbar')).toBeNull();
    expect(fixture.nativeElement.querySelector('h1')).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('Crear aula');
  });
  it('muestra fallo de carga y permite reintentar', async () => {
    api.listMine.mockRejectedValueOnce(new Error('sin conexión'));
    const fixture = await setup();
    expect(fixture.nativeElement.textContent).toContain('Reintentar');
    api.listMine.mockResolvedValueOnce([aula]);
    await fixture.componentInstance.load();
    expect(fixture.componentInstance.aulas).toEqual([aula]);
  });
  it('filtra datos reales por texto y grado', async () => {
    api.listMine.mockResolvedValue([aula]);
    const fixture = await setup(); const c = fixture.componentInstance;
    c.searchQuery = 'química'; c.filtroActivo = '10'; expect(c.aulasFiltradas).toHaveLength(1);
    c.filtroActivo = '11'; expect(c.aulasFiltradas).toHaveLength(0);
    expect(c.contarPorFiltro('10')).toBe(1);
  });
  it('valida nombre único, cupo y longitud antes de crear', async () => {
    const c = (await setup()).componentInstance;
    c.aulas = [aula]; c.openCreate(); c.draft.name = ' química ';
    await c.save(); expect(api.create).not.toHaveBeenCalled();
    c.draft.name = 'Otra'; c.draft.capacity = 61;
    await c.save(); expect(api.create).not.toHaveBeenCalled();
    c.draft.capacity = 20; c.draft.location = 'a'.repeat(151);
    await c.save(); expect(api.create).not.toHaveBeenCalled();
    c.draft.location = ''; await c.save();
    expect(api.create).toHaveBeenCalledOnce(); expect(c.modal).toBeNull();
  });
  it('edita, confirma eliminación y regenera PIN reales', async () => {
    const c = (await setup()).componentInstance; c.aulas = [aula];
    c.openEdit(aula); c.draft.name = 'Editada'; await c.save();
    expect(api.update).toHaveBeenCalledWith('a', expect.objectContaining({ name: 'Editada' }));
    c.openAction(aula, 'pin'); expect(api.regeneratePin).not.toHaveBeenCalled();
    await c.regenerate(); expect(c.aulas[0].joinPin).toBe('CHEM-9999');
    c.openAction(aula, 'delete'); expect(api.remove).not.toHaveBeenCalled();
    await c.remove(); expect(c.aulas).toEqual([]);
  });
  it('conserva formulario y error cuando no se puede guardar', async () => {
    api.create.mockRejectedValueOnce(new Error('No se pudo guardar'));
    const c = (await setup()).componentInstance; c.openCreate(); c.draft.name = 'Nueva';
    await c.save(); expect(c.modal).toBe('edit'); expect(c.draft.name).toBe('Nueva');
    expect(c.actionError).toContain('No se pudo');
    await c.save(); expect(c.modal).toBeNull();
  });
  it('carga miembros y asigna el taller validado', async () => {
    const c = (await setup()).componentInstance;
    await c.viewMembers(aula); expect(c.members).toEqual([]);
    c.openAction(aula, 'assign'); await c.assign(); expect(api.assignWorkshop).not.toHaveBeenCalled();
    c.assignment = { title: 'Taller', workshop: 'Balancea las ecuaciones.', dueDate: '' };
    await c.assign();
    expect(api.assignWorkshop).toHaveBeenCalledWith('a', { title: 'Taller', workshop: 'Balancea las ecuaciones.', dueDate: undefined });
  });
  it('muestra error de miembros y permite reintentar', async () => {
    api.listMembers.mockRejectedValueOnce(new Error('fallo'));
    const c = (await setup()).componentInstance;
    await c.viewMembers(aula); expect(c.membersError).toContain('No se pudieron');
    await c.viewMembers(aula); expect(c.membersError).toBe('');
  });
  it('no reemplaza el listado con una respuesta recibida tras destruirse', async () => {
    let resolve!: (value: any) => void;
    api.listMine.mockReturnValueOnce(new Promise(r => resolve = r));
    const fixture = TestBed.createComponent(MyClassroomsComponent);
    const request = fixture.componentInstance.load(); fixture.destroy();
    resolve([aula]); await request; expect(fixture.componentInstance.aulas).toEqual([]);
  });
});

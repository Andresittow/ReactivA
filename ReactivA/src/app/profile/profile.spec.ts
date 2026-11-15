import { TestBed } from '@angular/core/testing';
import { signal, PLATFORM_ID } from '@angular/core';
import { Profile } from './profile';
import { AuthService } from '../core/auth/auth.service';
import { StudentProgressService } from '../dashboard/student-progress.service';
import { ClassroomService } from '../core/services/classroom.service';
import { ProfileDataService } from '../core/services/profile-data.service';

describe('Profile PR-V2', () => {
  let auth: any; let progress: any; let classrooms: any; let data: any;
  beforeEach(() => {
    auth = { user: signal({ id: 's', fullName: 'Ana Pérez', email: 'ana@example.test', grade: '10', school: 'Colegio' }),
      updateProfile: vi.fn().mockResolvedValue(undefined) };
    progress = { hydrate: vi.fn().mockResolvedValue(undefined),
      getGamificationState: () => ({ xp: 50, level: 1, levelTitle: 'Iniciado', streakDays: 2 }),
      getUnlockedBadges: () => [] };
    classrooms = { getMyClassroom: vi.fn().mockResolvedValue(null), joinByPin: vi.fn().mockResolvedValue({}),
      leave: vi.fn().mockResolvedValue(undefined) };
    data = { recentEvents: vi.fn().mockResolvedValue([]), teacherName: vi.fn().mockResolvedValue('Docente real') };
    TestBed.configureTestingModule({ imports: [Profile], providers: [
      { provide: PLATFORM_ID, useValue: 'browser' },
      { provide: AuthService, useValue: auth }, { provide: StudentProgressService, useValue: progress },
      { provide: ClassroomService, useValue: classrooms }, { provide: ProfileDataService, useValue: data }
    ] });
  });
  async function setup() {
    const fixture = TestBed.createComponent(Profile); fixture.detectChanges();
    await fixture.whenStable(); fixture.detectChanges(); return fixture;
  }
  it('se crea con nombre real, iniciales, XP y estados vacíos honestos', async () => {
    const fixture = await setup(); const text = fixture.nativeElement.textContent;
    expect(fixture.componentInstance.initials).toBe('AP');
    expect(text).toContain('Ana Pérez'); expect(text).toContain('50 XP');
    expect(text).toContain('Aún no tienes actividad'); expect(text).toContain('Aún no hay evaluaciones');
  });
  it('guarda solo nombre, grado y colegio reales; rechaza espacios', async () => {
    const c = (await setup()).componentInstance;
    c.openEditProfileModal();
    c.editProfileForm.setValue({ fullName: '   ', grade: '10', school: 'Colegio' });
    await c.saveProfile(); expect(auth.updateProfile).not.toHaveBeenCalled();
    c.editProfileForm.setValue({ fullName: ' Ana María ', grade: ' 11 ', school: ' Nuevo ' });
    await c.saveProfile();
    expect(auth.updateProfile).toHaveBeenCalledWith({ fullName: 'Ana María', grade: '11', school: 'Nuevo' });
    expect(c.isEditModalOpen).toBe(false);
  });
  it('mantiene edición y permite reintentar cuando falla el guardado', async () => {
    auth.updateProfile.mockRejectedValueOnce(new Error('fallo'));
    const c = (await setup()).componentInstance; c.openEditProfileModal();
    await c.saveProfile(); expect(c.actionError).toContain('No se pudo'); expect(c.isEditModalOpen).toBe(true);
    await c.saveProfile(); expect(c.isEditModalOpen).toBe(false);
  });
  it('consulta aula y docente reales, y exige confirmación antes de salir', async () => {
    classrooms.getMyClassroom.mockResolvedValue({ id: 'a', name: 'Química' });
    const c = (await setup()).componentInstance;
    expect(c.teacherName).toBe('Docente real');
    await c.leave(); expect(classrooms.leave).not.toHaveBeenCalled();
    c.confirmLeave = true; await c.leave();
    expect(classrooms.leave).toHaveBeenCalledWith('a'); expect(c.classroom).toBeNull();
  });
  it('muestra errores de PIN y permite unirse al reintentar', async () => {
    classrooms.joinByPin.mockRejectedValueOnce(new Error('El aula no tiene cupos'));
    const c = (await setup()).componentInstance; c.pin = 'CHEM-1234';
    await c.join(); expect(c.actionError).toContain('cupos'); expect(c.pin).toBe('CHEM-1234');
    await c.join(); expect(c.pin).toBe('');
  });
  it('muestra errores de historial y reintenta sin datos inventados', async () => {
    data.recentEvents.mockRejectedValueOnce(new Error('fallo'));
    const c = (await setup()).componentInstance;
    expect(c.historyError).toContain('No se pudo');
    data.recentEvents.mockResolvedValue([{ id: 'e', title: 'Balanceo', module: 'virtual-lab', xp: 50 }]);
    await c.loadHistory(); expect(c.events[0].title).toBe('Balanceo'); expect(c.historyError).toBe('');
  });
  it('ignora una respuesta anterior al cambiar de usuario', async () => {
    let resolve!: (value: any) => void;
    data.recentEvents.mockReturnValueOnce(new Promise(r => resolve = r));
    const fixture = TestBed.createComponent(Profile); fixture.detectChanges();
    auth.user.set({ id: 'otro', fullName: 'Otro' }); fixture.detectChanges();
    resolve([{ id: 'viejo', title: 'Anterior' }]);
    await fixture.whenStable();
    expect(fixture.componentInstance.events).toEqual([]);
  });
  it('no accede a APIs del navegador durante SSR', async () => {
    TestBed.overrideProvider(PLATFORM_ID, { useValue: 'server' });
    const print = vi.spyOn(window, 'print').mockImplementation(() => {});
    const fixture = await setup();
    fixture.componentInstance.downloadReportPdf();
    expect(print).not.toHaveBeenCalled(); expect(data.recentEvents).not.toHaveBeenCalled();
    print.mockRestore();
  });
  it('genera la impresión del perfil real en navegador', async () => {
    const print = vi.spyOn(window, 'print').mockImplementation(() => {});
    const c = (await setup()).componentInstance; await c.load(); c.downloadReportPdf(); expect(print).toHaveBeenCalledOnce();
    print.mockRestore();
  });
  it('conserva edición ante una renovación de sesión del mismo usuario', async () => {
    const fixture = await setup(); const c = fixture.componentInstance; c.openEditProfileModal();
    c.editProfileForm.patchValue({ fullName: 'Mi borrador' });
    auth.user.set({ id: 's', fullName: 'Ana actualizada' });
    fixture.detectChanges(); await fixture.whenStable();
    expect(c.isEditModalOpen).toBe(true);
    expect(c.editProfileForm.getRawValue().fullName).toBe('Mi borrador');
  });
});

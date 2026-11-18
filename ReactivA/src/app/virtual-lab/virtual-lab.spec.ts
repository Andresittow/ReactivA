import { TestBed } from '@angular/core/testing';
import { VirtualLabComponent } from './virtual-lab';
import { signal } from '@angular/core';
import { AuthService } from '../core/auth/auth.service';
import { StudentProgressService } from '../dashboard/student-progress.service';
import { LearningEventsService } from '../core/services/learning-events.service';

describe('VirtualLabComponent', () => {
  let stored: any;
  let progress: any;
  let events: any;
  let auth: any;
  beforeEach(async () => {
    stored = null;
    auth = { user: signal({ id: 's', role: 'estudiante' }) };
    progress = {
      hydrate: vi.fn().mockResolvedValue(undefined),
      getModuleProgress: vi.fn(() => stored),
      saveModuleProgress: vi.fn((module, value) => { stored = structuredClone(value); }),
      addXp: vi.fn(),
      getGamificationState: () => ({ streakDays: 2 })
    };
    events = { record: vi.fn() };
    await TestBed.configureTestingModule({
      imports: [VirtualLabComponent],
      providers: [
        { provide: AuthService, useValue: auth },
        { provide: StudentProgressService, useValue: progress },
        { provide: LearningEventsService, useValue: events }
      ]
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(VirtualLabComponent);
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });

  it('should filter equipment reactively when searchControl changes', () => {
    const fixture = TestBed.createComponent(VirtualLabComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.filteredEquipment.length).toBe(component.equipmentList.length);

    component.searchControl.setValue('Bunsen');
    expect(component.filteredEquipment.length).toBe(1);
    expect(component.filteredEquipment[0].name).toBe('Mechero Bunsen');

    component.searchControl.setValue('');
    expect(component.filteredEquipment.length).toBe(component.equipmentList.length);
  });

  it('should toggle equipment active state on click', () => {
    const fixture = TestBed.createComponent(VirtualLabComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    const burner = component.equipmentList.find(e => e.id === 'bunsen')!;
    const initialState = burner.active;

    component.toggleEquipment(burner);
    expect(burner.active).toBe(!initialState);
  });

  it('should validate the equation balance correctly for 2 H2 + 1 O2 -> 2 H2O', () => {
    const fixture = TestBed.createComponent(VirtualLabComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.isBalanced).toBe(false);

    component.coeffH2 = 2;
    component.coeffO2 = 1;
    component.coeffH2O = 2;
    component.evaluateEquationBalance();

    expect(component.isBalanced).toBe(true);
  });

  it('should reset the equation coefficients and status', () => {
    const fixture = TestBed.createComponent(VirtualLabComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    component.coeffH2 = 2;
    component.coeffO2 = 1;
    component.coeffH2O = 2;
    component.evaluateEquationBalance();
    expect(component.isBalanced).toBe(true);

    component.resetEquation();
    expect(component.coeffH2).toBeNull();
    expect(component.coeffO2).toBeNull();
    expect(component.coeffH2O).toBeNull();
    expect(component.isBalanced).toBe(false);
  });
  async function ready() {
    const fixture = TestBed.createComponent(VirtualLabComponent);
    fixture.detectChanges(); await fixture.whenStable(); return fixture;
  }
  function solve(c: VirtualLabComponent) {
    c.coeffH2 = 2; c.coeffO2 = 1; c.coeffH2O = 2; c.evaluateEquationBalance();
  }
  it('PR-V2 suma XP y evento una sola vez aunque se reinicie el ejercicio', async () => {
    const fixture = await ready(); const c = fixture.componentInstance;
    expect(c.totalLabScore).toBe(0);
    solve(c); c.resetEquation(); solve(c);
    expect(progress.addXp).toHaveBeenCalledTimes(1);
    expect(events.record).toHaveBeenCalledWith(expect.objectContaining({ module: 'virtual-lab', xp: 50 }));
    expect(stored.solved).toEqual([c.balancingExercises[0].id]);
    expect(c.totalLabScore).toBe(50);
  });
  it('PR-V2 restaura ejercicios y no repite XP al volver al laboratorio', async () => {
    const first = await ready(); solve(first.componentInstance);
    const snapshot = structuredClone(stored); first.destroy(); stored = snapshot;
    progress.addXp.mockClear(); events.record.mockClear();
    const second = await ready(); solve(second.componentInstance);
    expect(second.componentInstance.solvedCount).toBe(1);
    expect(second.componentInstance.totalLabScore).toBe(50);
    expect(progress.addXp).not.toHaveBeenCalled();
    expect(events.record).not.toHaveBeenCalled();
  });
  it('PR-V2 registra experimento solo con precondiciones y no duplica al repetir', async () => {
    const c = (await ready()).componentInstance;
    c.completeExperiment(); expect(progress.addXp).not.toHaveBeenCalled();
    solve(c); c.completeExperiment(); c.completeExperiment();
    expect(c.completedExperiments.has(c.currentExercise.id)).toBe(true);
    expect(progress.addXp).toHaveBeenCalledTimes(2);
    expect(stored.experiments).toEqual([c.currentExercise.id]);
    expect(c.totalLabScore).toBe(100);
  });
  it('PR-V2 bloquea XP durante error de hidratación y permite reintentar', async () => {
    progress.hydrate.mockRejectedValueOnce(new Error('sin conexión'));
    const c = (await ready()).componentInstance; solve(c);
    expect(c.progressError).toContain('No se pudo'); expect(progress.addXp).not.toHaveBeenCalled();
    await c.restoreProgress(); solve(c);
    expect(c.progressReady).toBe(true); expect(progress.addXp).toHaveBeenCalledTimes(1);
  });
  it('PR-V2 limpia estado del laboratorio al cambiar de cuenta', async () => {
    const fixture = await ready(); const c = fixture.componentInstance; solve(c);
    stored = null; auth.user.set({ id: 'otra', role: 'estudiante' });
    fixture.detectChanges(); await fixture.whenStable();
    expect(c.solvedCount).toBe(0); expect(c.totalLabScore).toBe(0); expect(c.coeffH2).toBeNull();
  });
});


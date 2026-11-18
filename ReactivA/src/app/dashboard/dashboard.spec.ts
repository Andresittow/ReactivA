import { TestBed, ComponentFixture } from '@angular/core/testing';
import { DashboardComponent } from './dashboard';
import { provideRouter } from '@angular/router';
import { By } from '@angular/platform-browser';
import { signal } from '@angular/core';
import { StudentProgressService, StoredDashboardTask } from './student-progress.service';
import { AuthService } from '../core/auth/auth.service';
import { LearningEventsService } from '../core/services/learning-events.service';
import { UserProfile } from '../core/models/user.model';

describe('DashboardComponent', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;

  let mockTasks: StoredDashboardTask[];
  let mockAuthService: any;
  let mockProgressService: any;
  let mockLearningEvents: any;

  afterEach(() => vi.unstubAllGlobals());

  beforeEach(async () => {
    mockTasks = [
      { id: 1, title: 'Completar test de enlace atómico', completed: false, xpReward: 50 },
      { id: 2, title: 'Calibrar simulador de temperatura en gases', completed: true, xpReward: 40 },
      { id: 3, title: 'Identificar 3 compuestos orgánicos', completed: false, xpReward: 30 },
      { id: 4, title: 'Balancear ecuación de combustión del metano', completed: false, xpReward: 50 }
    ];

    const userSignal = signal<UserProfile | null>({
      id: 'student-123',
      role: 'estudiante',
      fullName: 'Andrés Alumno',
      email: 'andres@reactiva.edu',
      grade: '10th Grade'
    });

    mockAuthService = {
      user: userSignal,
      isAuthenticated: () => true,
      role: () => 'estudiante',
      updateProfile: vi.fn().mockResolvedValue({ id: 'student-123', grade: '11th Grade' })
    };

    mockProgressService = {
      getProfile: vi.fn().mockReturnValue({ name: 'Andrés Alumno', grade: '10th Grade', email: 'andres@reactiva.edu' }),
      setProfileGrade: vi.fn(),
      getGamificationState: vi.fn().mockReturnValue({
        xp: 150,
        level: 1,
        levelTitle: 'Iniciado en Química',
        streakDays: 3,
        lastActiveDate: '2026-11-15',
        nextLevelXp: 300,
        levelProgressPercent: 50
      }),
      getDashboardTasks: vi.fn().mockImplementation(() => mockTasks.map(t => ({ ...t }))),
      toggleDashboardTask: vi.fn().mockImplementation((id: number) => {
        const task = mockTasks.find(t => t.id === id);
        if (task) {
          task.completed = !task.completed;
          return {
            tasks: mockTasks.map(t => ({ ...t })),
            task: { ...task },
            xpGained: task.completed ? task.xpReward : -task.xpReward
          };
        }
        return { tasks: mockTasks.map(t => ({ ...t })), task: null, xpGained: 0 };
      }),
      getModuleProgress: vi.fn().mockImplementation((mod: string) => {
        if (mod === 'virtual-lab') return { progress: 75 };
        if (mod === 'periodic-table') return { progress: 40 };
        return { progress: 0 };
      })
    };

    mockLearningEvents = {
      record: vi.fn()
    };

    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: mockAuthService },
        { provide: StudentProgressService, useValue: mockProgressService },
        { provide: LearningEventsService, useValue: mockLearningEvents }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should greet student with real name from profile', () => {
    expect(component.studentProfile.name).toBe('Andrés Alumno');
    const headerTitle = fixture.nativeElement.querySelector('.greeting h1');
    expect(headerTitle.textContent).toContain('Andrés Alumno');
  });

  it('should initialize daily tasks and topics', () => {
    expect(component.dailyTasks.length).toBe(4);
    expect(component.topics.length).toBe(3);
    expect(component.filteredTopics.length).toBe(3);
  });

  it('should toggle task completion status', () => {
    const taskId = 1;
    const initialStatus = component.allTasks.find(t => t.id === taskId)?.completed;

    component.toggleTask(taskId);
    const updatedStatus = component.allTasks.find(t => t.id === taskId)?.completed;
    expect(updatedStatus).toBe(!initialStatus);

    component.toggleTask(taskId);
    expect(component.allTasks.find(t => t.id === taskId)?.completed).toBe(initialStatus);
  });

  it('should filter topics and tasks when searchControl changes value', async () => {
    component.searchControl.setValue('Matter');
    await fixture.whenStable();
    fixture.detectChanges();

    expect(component.filteredTopics.length).toBe(1);
    expect(component.filteredTopics[0].title).toBe('States of Matter');
  });

  it('should filter tasks when search query matches mission title', async () => {
    component.searchControl.setValue('enlace');
    await fixture.whenStable();
    fixture.detectChanges();

    expect(component.dailyTasks.length).toBe(1);
    expect(component.dailyTasks[0].title).toContain('enlace atómico');
  });

  it('should reset filtered list when clearSearch is called', async () => {
    component.searchControl.setValue('Matter');
    await fixture.whenStable();
    fixture.detectChanges();
    expect(component.filteredTopics.length).toBe(1);

    component.clearSearch();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(component.filteredTopics.length).toBe(3);
    expect(component.dailyTasks.length).toBe(4);
  });

  it('should compute completedTasksCount correctly', () => {
    const initialCount = component.completedTasksCount;
    component.toggleTask(1);
    expect(component.completedTasksCount).toBe(initialCount + 1);
  });

  it('should apply [style.width.%] property binding to the progress bar in topic cards', () => {
    fixture.detectChanges();
    const progressFills = fixture.debugElement.queryAll(By.css('.progress-bar-fill'));
    expect(progressFills.length).toBe(3);

    const firstFillElement = progressFills[0].nativeElement as HTMLElement;
    expect(firstFillElement.style.width).toBe('75%');
  });

  it('should apply [class.completed] and reflect checked property on checkbox', () => {
    fixture.detectChanges();
    const taskCards = fixture.debugElement.queryAll(By.css('.task-card'));
    expect(taskCards.length).toBe(4);

    const task2Index = component.dailyTasks.findIndex(t => t.id === 2);
    expect(task2Index).toBeGreaterThanOrEqual(0);

    const task2Card = taskCards[task2Index];
    expect(task2Card.nativeElement.classList.contains('completed')).toBe(true);

    const checkbox = task2Card.query(By.css('input[type="checkbox"]')).nativeElement as HTMLInputElement;
    expect(checkbox.checked).toBe(true);
  });

  it('should update grade via AuthService and StudentProgressService onGradeChange', () => {
    component.onGradeChange('11th Grade');
    expect(mockProgressService.setProfileGrade).toHaveBeenCalledWith('11th Grade');
    expect(mockAuthService.updateProfile).toHaveBeenCalledWith({ grade: '11th Grade' });
    expect(component.studentProfile.grade).toBe('11th Grade');
  });
});

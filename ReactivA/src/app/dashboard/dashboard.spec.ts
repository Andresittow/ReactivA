import { TestBed, ComponentFixture } from '@angular/core/testing';
import { DashboardComponent } from './dashboard';
import { By } from '@angular/platform-browser';

describe('DashboardComponent', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
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
});

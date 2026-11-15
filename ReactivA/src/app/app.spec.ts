import { TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { Router, provideRouter } from '@angular/router';
import { App } from './app';

@Component({ standalone: true, template: '' })
class RouteContent {}

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter([
          { path: 'teacher-dashboard', component: RouteContent, data: { layout: 'bare' } },
          { path: 'my-classrooms', component: RouteContent, data: { layout: 'app' } },
          { path: 'dashboard', component: RouteContent, data: { layout: 'app' } },
          { path: 'login', component: RouteContent, data: { layout: 'bare' } },
          { path: 'register', component: RouteContent, data: { layout: 'bare' } },
          { path: 'home', component: RouteContent, data: { layout: 'bare' } }
        ])
      ]
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('renders the appropriate sidebar and preserves layout across navigation', async () => {
    const fixture = TestBed.createComponent(App);
    const router = TestBed.inject(Router);

    // En my-classrooms: renderiza teacher sidebar en el shell
    await router.navigateByUrl('/my-classrooms');
    fixture.detectChanges();
    await fixture.whenStable();

    const teacherSidebar = fixture.nativeElement.querySelector('app-teacher-sidebar') as HTMLElement;
    expect(teacherSidebar).toBeTruthy();
    expect(fixture.nativeElement.querySelector('app-sidebar')).toBeNull();

    // Puede colapsarse
    teacherSidebar.querySelector<HTMLButtonElement>('button.btn-toggle')?.click();
    fixture.detectChanges();
    expect(teacherSidebar.querySelector('aside')?.classList.contains('collapsed')).toBe(true);

    // Al navegar a dashboard estudiantil: cambia a app-sidebar
    await router.navigateByUrl('/dashboard');
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('app-sidebar')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('app-teacher-sidebar')).toBeNull();

    // Al navegar a login: sin sidebar (layout bare)
    await router.navigateByUrl('/login');
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('app-sidebar')).toBeNull();
    expect(fixture.nativeElement.querySelector('app-teacher-sidebar')).toBeNull();
  });

  it('selects the teacher sidebar on direct classroom entry and preserves student and public layouts', async () => {
    const fixture = TestBed.createComponent(App);
    const router = TestBed.inject(Router);
    for (const url of ['/my-classrooms?grade=10#groups', '/dashboard', '/login', '/register', '/home']) {
      await router.navigateByUrl(url);
      fixture.detectChanges();
      await fixture.whenStable();
      expect(!!fixture.nativeElement.querySelector('app-teacher-sidebar')).toBe(url.startsWith('/my-classrooms'));
      expect(!!fixture.nativeElement.querySelector('app-sidebar')).toBe(url === '/dashboard');
    }
  });
});

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
      providers: [provideRouter(['teacher-dashboard', 'my-classrooms', 'dashboard', 'login', 'register', 'home']
        .map(path => ({ path, component: RouteContent })))]
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });
  it('keeps the teacher sidebar and collapse state when navigating to classrooms and back', async () => {
    const fixture = TestBed.createComponent(App);
    const router = TestBed.inject(Router);
    await router.navigateByUrl('/teacher-dashboard');
    fixture.detectChanges();
    await fixture.whenStable();

    const sidebar = fixture.nativeElement.querySelector('app-teacher-sidebar') as HTMLElement;
    expect(sidebar).toBeTruthy();
    expect(fixture.nativeElement.querySelector('app-sidebar')).toBeNull();
    sidebar.querySelector<HTMLButtonElement>('button')!.click();
    fixture.detectChanges();
    expect(sidebar.querySelector('aside')!.classList.contains('collapsed')).toBe(true);

    sidebar.querySelector<HTMLAnchorElement>('a[href="/my-classrooms"]')!.click();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(router.url).toBe('/my-classrooms');
    expect(fixture.nativeElement.querySelector('app-teacher-sidebar')).toBe(sidebar);
    expect(sidebar.querySelector('aside')!.classList.contains('collapsed')).toBe(true);
    expect(sidebar.querySelector('a[aria-current="page"]')!.getAttribute('href')).toBe('/my-classrooms');
    expect(fixture.nativeElement.querySelector('app-sidebar')).toBeNull();

    sidebar.querySelector<HTMLAnchorElement>('a[href="/teacher-dashboard"]')!.click();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(router.url).toBe('/teacher-dashboard');
    expect(sidebar.querySelector('a[aria-current="page"]')!.getAttribute('href')).toBe('/teacher-dashboard');
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

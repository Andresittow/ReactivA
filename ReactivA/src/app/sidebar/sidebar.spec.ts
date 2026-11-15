import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID, signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { SidebarComponent } from './sidebar';
import { AuthService } from '../core/auth/auth.service';

describe('Sidebar PR-V1', () => {
  let auth: any;
  beforeEach(() => {
    localStorage.removeItem('reactiva_sidebar_collapsed');
    auth = { role: signal('estudiante'), user: signal({ fullName: 'Vanessa', role: 'estudiante' }),
      signOut: vi.fn().mockResolvedValue(undefined) };
    TestBed.configureTestingModule({ imports: [SidebarComponent], providers: [
      provideRouter([]), { provide: AuthService, useValue: auth }
    ] });
  });
  it('muestra nombre real y menú estudiante con ruta canónica', () => {
    const fixture = TestBed.createComponent(SidebarComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Vanessa');
    expect(fixture.nativeElement.querySelector('a[href="/periodic-table"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('a[href="/teacher-dashboard"]')).toBeNull();
  });
  it('reacciona al rol docente y conserva configuración y ayuda', () => {
    const fixture = TestBed.createComponent(SidebarComponent);
    auth.role.set('docente');
    fixture.detectChanges();
    const routes = [...fixture.nativeElement.querySelectorAll('a')].map((a: any) => a.getAttribute('href'));
    expect(routes).toEqual(['/teacher-dashboard', '/my-classrooms', '/settings', '/help']);
  });
  it('restaura colapso y mantiene logout accesible', async () => {
    localStorage.setItem('reactiva_sidebar_collapsed', 'true');
    const fixture = TestBed.createComponent(SidebarComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance.isCollapsed).toBe(true);
    const button = fixture.nativeElement.querySelector('button[aria-label="Cerrar sesión"]');
    expect(button.title).toBe('Cerrar sesión');
    button.click();
    await fixture.whenStable();
    expect(auth.signOut).toHaveBeenCalledOnce();
    fixture.componentInstance.toggleSidebar();
    expect(localStorage.getItem('reactiva_sidebar_collapsed')).toBe('false');
  });
  it('evita doble logout y permite reintentar tras un error', async () => {
    const fixture = TestBed.createComponent(SidebarComponent);
    auth.signOut.mockRejectedValueOnce(new Error('fallo'));
    const first = fixture.componentInstance.signOut();
    await fixture.componentInstance.signOut();
    await first;
    expect(auth.signOut).toHaveBeenCalledOnce();
    expect(fixture.componentInstance.logoutError()).toContain('Inténtalo');
    await fixture.componentInstance.signOut();
    expect(fixture.componentInstance.logoutError()).toBe('');
  });
  it('no lee ni escribe almacenamiento durante SSR', () => {
    TestBed.overrideProvider(PLATFORM_ID, { useValue: 'server' });
    const fixture = TestBed.createComponent(SidebarComponent);
    const get = vi.spyOn(Storage.prototype, 'getItem');
    const set = vi.spyOn(Storage.prototype, 'setItem');
    fixture.componentInstance.ngOnInit();
    fixture.componentInstance.toggleSidebar();
    expect(get).not.toHaveBeenCalled();
    expect(set).not.toHaveBeenCalled();
    vi.restoreAllMocks();
  });
  afterEach(() => localStorage.removeItem('reactiva_sidebar_collapsed'));
});

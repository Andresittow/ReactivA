import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { HelpComponent } from './help';
import { AuthService } from '../core/auth/auth.service';
import { HelpRequestsService } from '../core/services/help-requests.service';

describe('Help PR-V2', () => {
  let auth: any; let api: any;
  beforeEach(() => {
    auth = { user: signal({ id: 's' }), role: signal('estudiante') };
    api = { listMine: vi.fn().mockResolvedValue([]), send: vi.fn().mockResolvedValue(undefined) };
    TestBed.configureTestingModule({ imports: [HelpComponent], providers: [
      provideRouter([]), { provide: AuthService, useValue: auth }, { provide: HelpRequestsService, useValue: api }
    ] });
  });
  async function setup() {
    const fixture = TestBed.createComponent(HelpComponent); fixture.detectChanges();
    await fixture.whenStable(); fixture.detectChanges(); return fixture;
  }
  it('busca en preguntas y respuestas sin distinguir tildes', async () => {
    const c = (await setup()).componentInstance; c.query = 'rubricas';
    expect(c.filteredFaqs.some(f => f.id === 'perfil')).toBe(true);
    c.query = 'zzzz'; expect(c.filteredFaqs).toEqual([]);
    c.toggleFaq('aula'); expect(c.faqs.find(f => f.id === 'aula')?.isOpen).toBe(true);
  });
  it('enlaza a rutas canónicas y muestra módulos docentes según rol', async () => {
    const c = (await setup()).componentInstance;
    expect(c.categories.some(cat => cat.linkRoute === '/periodic-table')).toBe(true);
    auth.role.set('docente');
    expect(c.categories.map(cat => cat.linkRoute)).toEqual(['/teacher-dashboard','/my-classrooms','/settings']);
  });
  it('valida, guarda y confirma la solicitud sin duplicar envíos', async () => {
    const c = (await setup()).componentInstance;
    await c.send(); expect(api.send).not.toHaveBeenCalled();
    c.subject = 'Problema'; c.message = 'No puedo abrir el módulo.';
    const pending = c.send(); await c.send(); await pending;
    expect(api.send).toHaveBeenCalledOnce(); expect(c.toastMessage).toContain('guardada');
    expect(c.subject).toBe(''); expect(c.message).toBe('');
  });
  it('conserva el texto ante un error para reintentar', async () => {
    api.send.mockRejectedValueOnce(new Error('fallo'));
    const c = (await setup()).componentInstance; c.subject = 'Problema'; c.message = 'No puedo abrir el módulo.';
    await c.send(); expect(c.message).toBe('No puedo abrir el módulo.'); expect(c.sendError).toContain('No se pudo');
    await c.send(); expect(c.sendError).toBe('');
  });
  it('muestra estado vacío y error de lectura con reintento', async () => {
    api.listMine.mockRejectedValueOnce(new Error('fallo'));
    const fixture = await setup();
    expect(fixture.nativeElement.textContent).toContain('Reintentar');
    await fixture.componentInstance.load(); fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Aún no has enviado solicitudes');
  });
  it('conserva la solicitud en edición cuando se renueva la sesión del mismo usuario', async () => {
    const fixture = await setup(); const c = fixture.componentInstance;
    c.subject = 'Mi consulta'; c.message = 'Texto que estoy escribiendo.';
    auth.user.set({ id: 's', fullName: 'Nombre actualizado' });
    fixture.detectChanges(); await fixture.whenStable();
    expect(c.subject).toBe('Mi consulta');
    expect(c.message).toBe('Texto que estoy escribiendo.');
  });
});

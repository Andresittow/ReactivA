import { TestBed } from '@angular/core/testing';
import { signal, PLATFORM_ID } from '@angular/core';
import { SUPABASE_CLIENT } from '../supabase/supabase.client';
import { AuthService } from '../auth/auth.service';
import { ProfileDataService } from './profile-data.service';
import { HelpRequestsService } from './help-requests.service';

describe('Servicios de datos Vanessa PR-V2', () => {
  let client: any; let user: any; let queue: any[]; let queries: any[];
  beforeEach(() => {
    queue = []; queries = []; user = signal<any>({ id: 's' });
    client = { rpc: vi.fn().mockResolvedValue({ data: 'Docente', error: null }),
      from: vi.fn(() => {
        const result = queue.shift() ?? { data: [], error: null };
        const q: any = { then: (resolve: any, reject: any) => Promise.resolve(result).then(resolve, reject) };
        for (const method of ['select','eq','order','limit','insert']) q[method] = vi.fn(() => q);
        queries.push(q); return q;
      }) };
    TestBed.configureTestingModule({ providers: [
      { provide: SUPABASE_CLIENT, useValue: client }, { provide: AuthService, useValue: { user } },
      { provide: PLATFORM_ID, useValue: 'browser' }
    ] });
  });
  it('consulta solo historial propio, ordenado, con límite y conversión del modelo', async () => {
    queue.push({ data: [{ id: 'e', student_id: 's', title: 'Balanceo', module: 'virtual-lab', xp: 50, created_at: '2026-11-15' }], error: null });
    const events = await TestBed.inject(ProfileDataService).recentEvents();
    expect(queries[0].eq).toHaveBeenCalledWith('student_id', 's');
    expect(queries[0].limit).toHaveBeenCalledWith(100);
    expect(events[0]).toMatchObject({ studentId: 's', title: 'Balanceo', xp: 50 });
  });
  it('consulta el docente mediante RPC restringida a la membresía propia', async () => {
    expect(await TestBed.inject(ProfileDataService).teacherName()).toBe('Docente');
    expect(client.rpc).toHaveBeenCalledWith('my_classroom_teacher_name');
  });
  it('propaga errores de historial y nombre sin devolver datos inventados', async () => {
    queue.push({ data: null, error: { message: 'interno' } });
    await expect(TestBed.inject(ProfileDataService).recentEvents()).rejects.toThrow('No se pudo cargar');
    client.rpc.mockResolvedValue({ data: null, error: { message: 'interno' } });
    await expect(TestBed.inject(ProfileDataService).teacherName()).rejects.toThrow('No se pudo consultar');
  });
  it('guarda solicitud con usuario autenticado y texto normalizado', async () => {
    await TestBed.inject(HelpRequestsService).send(' Ayuda ', ' No abre el laboratorio. ');
    expect(queries[0].insert).toHaveBeenCalledWith({ user_id: 's', subject: 'Ayuda', message: 'No abre el laboratorio.' });
  });
  it('rechaza solicitudes vacías o largas sin acceder a Supabase', async () => {
    const api = TestBed.inject(HelpRequestsService);
    await expect(api.send(' ', 'Mensaje válido')).rejects.toThrow('3–150');
    await expect(api.send('Ayuda', 'corto')).rejects.toThrow('10–4000');
    await expect(api.send('a'.repeat(151), 'Mensaje válido')).rejects.toThrow();
    await expect(api.send('Ayuda', 'a'.repeat(4001))).rejects.toThrow();
    expect(client.from).not.toHaveBeenCalled();
  });
  it('lista únicamente solicitudes propias, con estado del servidor', async () => {
    queue.push({ data: [{ id: 'r', subject: 'Ayuda', message: 'Mi mensaje', status: 'pending', created_at: '2026-11-15' }], error: null });
    const list = await TestBed.inject(HelpRequestsService).listMine();
    expect(queries[0].eq).toHaveBeenCalledWith('user_id', 's');
    expect(list[0]).toMatchObject({ id: 'r', status: 'pending', createdAt: '2026-11-15' });
  });
  it('no confirma envío cuando Supabase rechaza la escritura', async () => {
    queue.push({ data: null, error: { code: '42501' } });
    await expect(TestBed.inject(HelpRequestsService).send('Ayuda', 'Mi mensaje de ayuda')).rejects.toThrow('No se pudo enviar');
  });
  it('sin sesión no consulta ni inserta datos', async () => {
    user.set(null);
    await expect(TestBed.inject(ProfileDataService).recentEvents()).rejects.toThrow('Inicia sesión');
    await expect(TestBed.inject(HelpRequestsService).send('Ayuda', 'Mi mensaje de ayuda')).rejects.toThrow('Inicia sesión');
    expect(client.from).not.toHaveBeenCalled();
  });
  it('SSR no realiza llamadas remotas', async () => {
    TestBed.overrideProvider(PLATFORM_ID, { useValue: 'server' });
    await expect(TestBed.inject(HelpRequestsService).listMine()).rejects.toThrow('Inicia sesión');
    await expect(TestBed.inject(ProfileDataService).recentEvents()).rejects.toThrow('Inicia sesión');
    expect(client.from).not.toHaveBeenCalled();
  });
});

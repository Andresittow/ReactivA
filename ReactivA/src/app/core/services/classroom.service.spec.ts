import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID, signal } from '@angular/core';
import { ClassroomService } from './classroom.service';
import { SUPABASE_CLIENT } from '../supabase/supabase.client';
import { AuthService } from '../auth/auth.service';
import { LearningEventsService } from './learning-events.service';

describe('ClassroomService PR-V1', () => {
  const row = { id: 'aula', teacher_id: 'teacher', name: 'Química', join_pin: 'CHEM-1234', capacity: 1 };
  let service: ClassroomService;
  let user: ReturnType<typeof signal<any>>;
  let client: any;
  let cache: any;
  let queue: any[];
  let queries: any[];
  beforeEach(() => {
    user = signal({ id: 'teacher', role: 'docente' });
    cache = { clearClassroomCache: vi.fn() };
    queue = []; queries = [];
    client = {
      from: vi.fn(() => {
        const result = queue.shift() ?? { data: null, error: null };
        const q: any = { then: (resolve: any, reject: any) => Promise.resolve(result).then(resolve, reject) };
        for (const method of ['select','eq','in','order','insert','update','delete','single','maybeSingle']) {
          q[method] = vi.fn(() => q);
        }
        queries.push(q);
        return q;
      }),
      rpc: vi.fn()
    };
    TestBed.configureTestingModule({ providers: [
      ClassroomService, { provide: SUPABASE_CLIENT, useValue: client },
      { provide: AuthService, useValue: { user } },
      { provide: LearningEventsService, useValue: cache },
      { provide: PLATFORM_ID, useValue: 'browser' }
    ] });
    service = TestBed.inject(ClassroomService);
  });
  it('lista únicamente las aulas propias y convierte snake_case', async () => {
    queue.push({ data: [row], error: null });
    expect(await service.listMine()).toEqual([expect.objectContaining({ teacherId: 'teacher', joinPin: 'CHEM-1234' })]);
    expect(queries[0].eq).toHaveBeenCalledWith('teacher_id', 'teacher');
  });
  it('crea con identidad autenticada e ignora campos ajenos al contrato', async () => {
    queue.push({ data: row, error: null });
    await service.create({ name: ' Química ', teacher_id: 'otro', join_pin: 'CHEM-0000' } as any);
    expect(queries[0].insert).toHaveBeenCalledWith({ name: 'Química', teacher_id: 'teacher' });
  });
  it('actualiza filtrando por dueño sin aceptar cambio de propietario o PIN', async () => {
    queue.push({ data: row, error: null });
    await service.update('aula', { capacity: 1, teacherId: 'otro', joinPin: 'CHEM-0000' } as any);
    expect(queries[0].update).toHaveBeenCalledWith({ capacity: 1 });
    expect(queries[0].eq).toHaveBeenCalledWith('teacher_id', 'teacher');
  });
  it('rechaza eliminar un aula que no pudo borrar', async () => {
    queue.push({ data: [], error: null });
    await expect(service.remove('ajena')).rejects.toMatchObject({ code: 'not_owner' });
  });
  it('elimina el aula propia', async () => {
    queue.push({ data: [{ id: 'aula' }], error: null });
    await service.remove('aula');
    expect(queries[0].eq).toHaveBeenCalledWith('teacher_id', 'teacher');
  });
  it('regenera el PIN mediante RPC', async () => {
    client.rpc.mockResolvedValue({ data: 'CHEM-5678', error: null });
    expect(await service.regeneratePin('aula')).toBe('CHEM-5678');
    expect(client.rpc).toHaveBeenCalledWith('regenerate_pin', { classroom_id: 'aula' });
  });
  it.each(['invalid_pin','already_member','classroom_full','not_owner'])('conserva el error RPC %s', async code => {
    user.set({ id: 'student', role: 'estudiante' });
    client.rpc.mockResolvedValue({ data: null, error: { message: code } });
    await expect(service.joinByPin('CHEM-1234')).rejects.toMatchObject({ code });
    expect(cache.clearClassroomCache).not.toHaveBeenCalled();
  });
  it('normaliza PIN y limpia caché de eventos tras unirse', async () => {
    user.set({ id: 'student', role: 'estudiante' });
    client.rpc.mockResolvedValue({ data: row, error: null });
    expect((await service.joinByPin(' chem-1234 ')).id).toBe('aula');
    expect(client.rpc).toHaveBeenCalledWith('join_classroom', { pin: 'CHEM-1234' });
    expect(cache.clearClassroomCache).toHaveBeenCalledOnce();
  });
  it('rechaza PIN mal formado sin petición', async () => {
    user.set({ id: 'student', role: 'estudiante' });
    await expect(service.joinByPin('123')).rejects.toMatchObject({ code: 'invalid_pin' });
    expect(client.rpc).not.toHaveBeenCalled();
  });
  it('devuelve null cuando el estudiante no tiene aula', async () => {
    user.set({ id: 'student', role: 'estudiante' });
    queue.push({ data: null, error: null });
    expect(await service.getMyClassroom()).toBeNull();
  });
  it('consulta el aula de la membresía propia', async () => {
    user.set({ id: 'student', role: 'estudiante' });
    queue.push({ data: { classroom_id: 'aula' }, error: null }, { data: row, error: null });
    expect((await service.getMyClassroom())?.id).toBe('aula');
    expect(queries[0].eq).toHaveBeenCalledWith('student_id', 'student');
  });
  it('solo sale de la membresía del usuario y limpia caché', async () => {
    user.set({ id: 'student', role: 'estudiante' });
    await service.leave('aula');
    expect(queries[0].eq).toHaveBeenCalledWith('student_id', 'student');
    expect(cache.clearClassroomCache).toHaveBeenCalledOnce();
  });
  it('combina nombres y progreso sin inventar notas', async () => {
    queue.push({ data: { id: 'aula' }, error: null },
      { data: [{ classroom_id: 'aula', student_id: 's1', joined_at: 'hoy' },
               { classroom_id: 'aula', student_id: 's2', joined_at: 'hoy' }], error: null },
      { data: [{ id: 's1', full_name: 'Ana', role: 'estudiante' }], error: null },
      { data: [{ student_id: 's1', xp: 10, level: 1 }], error: null });
    const members = await service.listMembers('aula');
    expect(members[0]).toMatchObject({ studentProfile: { fullName: 'Ana' }, xp: 10, status: 'Con actividad' });
    expect(members[1]).toMatchObject({ xp: null, level: null, status: 'Sin actividad' });
  });
  it('no consulta perfiles si el aula está vacía', async () => {
    queue.push({ data: { id: 'aula' }, error: null }, { data: [], error: null });
    expect(await service.listMembers('aula')).toEqual([]);
    expect(client.from).toHaveBeenCalledTimes(2);
  });
  it('bloquea operaciones sin sesión y de rol incorrecto', async () => {
    user.set(null);
    await expect(service.listMine()).rejects.toMatchObject({ code: 'unauthenticated' });
    user.set({ id: 'student', role: 'estudiante' });
    await expect(service.create({ name: 'Aula' })).rejects.toMatchObject({ code: 'not_owner' });
    expect(client.from).not.toHaveBeenCalled();
  });
  it('mapea fallos de conexión sin exponer mensajes del servidor', async () => {
    queue.push({ data: null, error: new TypeError('Failed to fetch') });
    await expect(service.listMine()).rejects.toMatchObject({ code: 'network' });
  });
});

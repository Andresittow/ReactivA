import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { SUPABASE_CLIENT } from '../supabase/supabase.client';
import { AuthService } from '../auth/auth.service';
import { LearningEventsService } from './learning-events.service';
import { Classroom, NewClassroom, ClassroomMember } from '../models/classroom.model';

export interface AssignWorkshopInput { title: string; workshop: string; dueDate?: string; }
export interface ClassroomMemberProgress extends ClassroomMember {
  xp: number | null;
  level: number | null;
  status: 'Con actividad' | 'Sin actividad';
}
export type ClassroomErrorCode = 'invalid_pin' | 'already_member' | 'classroom_full' |
  'not_owner' | 'unauthenticated' | 'invalid_input' | 'network' | 'unknown';
const messages: Record<ClassroomErrorCode, string> = {
  invalid_pin: 'El PIN no es válido.',
  already_member: 'Ya perteneces a un aula. Sal de ella antes de unirte a otra.',
  classroom_full: 'El aula no tiene cupos disponibles.',
  not_owner: 'No tienes permiso para gestionar esta aula.',
  unauthenticated: 'Inicia sesión para continuar.',
  invalid_input: 'Revisa los datos del aula.',
  network: 'No se pudo conectar. Inténtalo nuevamente.',
  unknown: 'No se pudo completar la operación. Inténtalo nuevamente.'
};
export class ClassroomError extends Error {
  constructor(public readonly code: ClassroomErrorCode) { super(messages[code]); this.name = 'ClassroomError'; }
}

@Injectable({ providedIn: 'root' })
export class ClassroomService {
  private readonly client = inject(SUPABASE_CLIENT);
  private readonly auth = inject(AuthService);
  private readonly events = inject(LearningEventsService);
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID));

  private user(role?: 'docente' | 'estudiante') {
    const user = this.auth.user();
    if (!this.browser || !user) throw new ClassroomError('unauthenticated');
    if (role && user.role !== role) throw new ClassroomError('not_owner');
    return user;
  }

  private async request<T>(query: PromiseLike<{ data: T; error: unknown }>): Promise<T> {
    try {
      const { data, error } = await query;
      if (error) throw error;
      return data;
    } catch (error: unknown) {
      if (error instanceof ClassroomError) throw error;
      const e = error as { message?: string; code?: string };
      const message = e?.message ?? '';
      for (const code of ['invalid_pin', 'already_member', 'classroom_full', 'not_owner'] as const) {
        if (message.includes(code)) throw new ClassroomError(code);
      }
      if (e?.code === '42501' || e?.code === 'PGRST116') throw new ClassroomError('not_owner');
      if (['23514', '23505', '22023', '22P02'].includes(e?.code ?? '')) throw new ClassroomError('invalid_input');
      if (error instanceof TypeError || /fetch|network/i.test(message)) throw new ClassroomError('network');
      throw new ClassroomError('unknown');
    }
  }

  private classroom(row: any): Classroom {
    return {
      id: row.id, teacherId: row.teacher_id, name: row.name, tag: row.tag ?? undefined,
      location: row.location ?? undefined, schedule: row.schedule ?? undefined,
      gradeFilter: row.grade_filter ?? undefined, capacity: row.capacity, joinPin: row.join_pin,
      activeModule: row.active_module ?? undefined, currentWeek: row.current_week,
      totalWeeks: row.total_weeks, createdAt: row.created_at
    };
  }

  private input(input: Partial<NewClassroom>): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    const fields = { name: 'name', tag: 'tag', location: 'location', schedule: 'schedule',
      gradeFilter: 'grade_filter', capacity: 'capacity', activeModule: 'active_module',
      currentWeek: 'current_week', totalWeeks: 'total_weeks' } as const;
    for (const key of Object.keys(fields) as (keyof NewClassroom)[]) {
      if (input[key] !== undefined) result[fields[key]] = typeof input[key] === 'string'
        ? (input[key] as string).trim() : input[key];
    }
    if ('name' in result && !(result['name'] as string)) throw new ClassroomError('invalid_input');
    return result;
  }

  async listMine(): Promise<Classroom[]> {
    const user = this.user('docente');
    const rows = await this.request(this.client.from('classrooms').select('*')
      .eq('teacher_id', user.id).order('created_at'));
    return (rows ?? []).map(row => this.classroom(row));
  }
  async create(input: NewClassroom): Promise<Classroom> {
    const user = this.user('docente');
    const values = this.input(input);
    if (!values['name']) throw new ClassroomError('invalid_input');
    return this.classroom(await this.request(this.client.from('classrooms')
      .insert({ ...values, teacher_id: user.id }).select('*').single()));
  }
  async update(id: string, patch: Partial<NewClassroom>): Promise<Classroom> {
    const user = this.user('docente');
    return this.classroom(await this.request(this.client.from('classrooms').update(this.input(patch))
      .eq('id', id).eq('teacher_id', user.id).select('*').single()));
  }
  async remove(id: string): Promise<void> {
    const user = this.user('docente');
    const rows = await this.request(this.client.from('classrooms').delete()
      .eq('id', id).eq('teacher_id', user.id).select('id'));
    if (!rows?.length) throw new ClassroomError('not_owner');
  }
  async regeneratePin(id: string): Promise<string> {
    this.user('docente');
    return await this.request(this.client.rpc('regenerate_pin', { classroom_id: id }));
  }
  async listMembers(classroomId: string): Promise<ClassroomMemberProgress[]> {
    const user = this.user('docente');
    await this.request(this.client.from('classrooms').select('id')
      .eq('id', classroomId).eq('teacher_id', user.id).single());
    const members = await this.request(this.client.from('classroom_members').select('*')
      .eq('classroom_id', classroomId).order('joined_at'));
    if (!members?.length) return [];
    const ids = members.map(m => m.student_id);
    const [profiles, progress] = await Promise.all([
      this.request(this.client.from('profiles').select('id,role,full_name,grade,school,avatar_url').in('id', ids)),
      this.request(this.client.from('student_progress').select('student_id,xp,level').in('student_id', ids))
    ]);
    return members.map(m => {
      const profile = profiles?.find(p => p.id === m.student_id);
      const state = progress?.find(p => p.student_id === m.student_id);
      return {
        classroomId: m.classroom_id, studentId: m.student_id, joinedAt: m.joined_at,
        studentProfile: profile ? { id: profile.id, role: profile.role, fullName: profile.full_name,
          email: '', grade: profile.grade ?? undefined, school: profile.school ?? undefined,
          avatarUrl: profile.avatar_url ?? undefined } : undefined,
        xp: state?.xp ?? null, level: state?.level ?? null,
        status: state && state.xp > 0 ? 'Con actividad' : 'Sin actividad'
      };
    });
  }
  async assignWorkshop(classroomId: string, input: AssignWorkshopInput): Promise<void> {
    const user = this.user('docente');
    const title = input.title.trim();
    const workshop = input.workshop.trim();
    const dueDate = input.dueDate || null;
    if (!title || title.length > 150 || !workshop || workshop.length > 2000 ||
      (dueDate && (!/^\d{4}-\d{2}-\d{2}$/.test(dueDate) || !Number.isFinite(Date.parse(dueDate)) ||
        new Date(dueDate).toISOString().slice(0, 10) !== dueDate))) {
      throw new ClassroomError('invalid_input');
    }
    await this.request(this.client.from('classrooms').select('id')
      .eq('id', classroomId).eq('teacher_id', user.id).single());
    await this.request(this.client.from('assignments').insert({
      classroom_id: classroomId, title, workshop, due_date: dueDate
    }));
  }
  async joinByPin(pin: string): Promise<Classroom> {
    this.user('estudiante');
    const normalized = pin.trim().toUpperCase();
    if (!/^CHEM-[0-9]{4}$/.test(normalized)) throw new ClassroomError('invalid_pin');
    const row = await this.request(this.client.rpc('join_classroom', { pin: normalized }));
    this.events.clearClassroomCache();
    return this.classroom(row);
  }
  async getMyClassroom(): Promise<Classroom | null> {
    const user = this.user('estudiante');
    const member = await this.request(this.client.from('classroom_members').select('classroom_id')
      .eq('student_id', user.id).maybeSingle());
    if (!member) return null;
    return this.classroom(await this.request(this.client.from('classrooms').select('*')
      .eq('id', member.classroom_id).single()));
  }
  async leave(classroomId: string): Promise<void> {
    const user = this.user('estudiante');
    await this.request(this.client.from('classroom_members').delete()
      .eq('classroom_id', classroomId).eq('student_id', user.id));
    this.events.clearClassroomCache();
  }
}

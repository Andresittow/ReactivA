import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { SUPABASE_CLIENT } from '../supabase/supabase.client';
import { AuthService } from '../auth/auth.service';
import { LearningEvent } from '../models/learning-event.model';

/** Consultas del perfil de Vanessa; todo acceso remoto permanece en core. */
@Injectable({ providedIn: 'root' })
export class ProfileDataService {
  private readonly client = inject(SUPABASE_CLIENT);
  private readonly auth = inject(AuthService);
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID));
  async recentEvents(): Promise<LearningEvent[]> {
    const user = this.auth.user();
    if (!this.browser || !user) throw new Error('Inicia sesión para consultar tu historial.');
    const { data, error } = await this.client.from('learning_events')
      .select('id,student_id,classroom_id,module,title,detail,xp,created_at')
      .eq('student_id', user.id).order('created_at', { ascending: false }).limit(100);
    if (error) throw new Error('No se pudo cargar tu historial.');
    return (data ?? []).map(row => ({
      id: row.id, studentId: row.student_id, classroomId: row.classroom_id,
      module: row.module, title: row.title, detail: row.detail ?? undefined,
      xp: row.xp, createdAt: row.created_at
    }));
  }
  async teacherName(): Promise<string | null> {
    if (!this.browser || !this.auth.user()) throw new Error('Inicia sesión para consultar tu aula.');
    const { data, error } = await this.client.rpc('my_classroom_teacher_name');
    if (error) throw new Error('No se pudo consultar el nombre del docente.');
    return data || null;
  }
}

import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from '../supabase/supabase.client';
import { AuthService } from '../auth/auth.service';
import { ModuleKey } from '../models/module.model';

export interface RecordEventInput {
  module: ModuleKey | 'dashboard' | 'challenges';
  title: string;
  detail?: string;
  xp?: number;
}

@Injectable({
  providedIn: 'root'
})
export class LearningEventsService {
  private readonly supabase: SupabaseClient = inject(SUPABASE_CLIENT);
  private readonly authService = inject(AuthService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  private cachedClassroomId: string | null = null;
  private cachedStudentId: string | null = null;

  record(e: RecordEventInput): void {
    if (!this.isBrowser) return;

    // Fire-and-forget: nunca lanza al llamador
    this.persistEvent(e).catch(err => {
      console.warn('[LearningEventsService] Failed to record event:', err);
    });
  }

  private async persistEvent(e: RecordEventInput): Promise<void> {
    const user = this.authService.user();
    if (!user) return;

    const classroomId = await this.resolveClassroomId(user.id);

    await this.supabase.from('learning_events').insert({
      student_id: user.id,
      classroom_id: classroomId,
      module: e.module,
      title: e.title,
      detail: e.detail ?? null,
      xp: e.xp ?? 0
    });
  }

  private async resolveClassroomId(studentId: string): Promise<string | null> {
    if (this.cachedStudentId === studentId && this.cachedClassroomId !== null) {
      return this.cachedClassroomId;
    }

    try {
      const { data } = await this.supabase
        .from('classroom_members')
        .select('classroom_id')
        .eq('student_id', studentId)
        .limit(1)
        .maybeSingle();

      this.cachedStudentId = studentId;
      this.cachedClassroomId = data?.classroom_id ?? null;
      return this.cachedClassroomId;
    } catch {
      return null;
    }
  }

  clearClassroomCache(): void {
    this.cachedStudentId = null;
    this.cachedClassroomId = null;
  }
}

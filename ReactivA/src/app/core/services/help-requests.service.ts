import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { SUPABASE_CLIENT } from '../supabase/supabase.client';
import { AuthService } from '../auth/auth.service';

export interface HelpRequest {
  id: string; subject: string; message: string; status: 'pending' | 'in_progress' | 'resolved'; createdAt: string;
}
@Injectable({ providedIn: 'root' })
export class HelpRequestsService {
  private readonly client = inject(SUPABASE_CLIENT);
  private readonly auth = inject(AuthService);
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID));
  private userId(): string {
    const user = this.auth.user();
    if (!this.browser || !user) throw new Error('Inicia sesión para contactar con soporte.');
    return user.id;
  }
  async listMine(): Promise<HelpRequest[]> {
    const id = this.userId();
    const { data, error } = await this.client.from('help_requests').select('id,subject,message,status,created_at')
      .eq('user_id', id).order('created_at', { ascending: false }).limit(50);
    if (error) throw new Error('No se pudieron cargar tus solicitudes.');
    return (data ?? []).map(row => ({ id: row.id, subject: row.subject, message: row.message,
      status: row.status, createdAt: row.created_at }));
  }
  async send(subject: string, message: string): Promise<void> {
    const id = this.userId();
    subject = subject.trim(); message = message.trim();
    if (subject.length < 3 || subject.length > 150 || message.length < 10 || message.length > 4000) {
      throw new Error('El asunto debe tener 3–150 caracteres y el mensaje 10–4000.');
    }
    const { error } = await this.client.from('help_requests').insert({ user_id: id, subject, message });
    if (error) throw new Error('No se pudo enviar la solicitud. Inténtalo nuevamente.');
  }
}

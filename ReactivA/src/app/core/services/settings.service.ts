import { Injectable } from '@angular/core';
import { UserPreferences } from '../models/preferences.model';

@Injectable({
  providedIn: 'root'
})
export class SettingsService {
  init(): void {
    // No-op hasta que Valeria lo implemente en PR-L2
  }

  async load(): Promise<UserPreferences> {
    throw new Error('No implementado: lo implementa Valeria (PR-L2)');
  }

  async save(p: UserPreferences): Promise<void> {
    throw new Error('No implementado: lo implementa Valeria (PR-L2)');
  }

  apply(p: UserPreferences): void {
    throw new Error('No implementado: lo implementa Valeria (PR-L2)');
  }
}

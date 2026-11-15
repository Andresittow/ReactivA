import { ModuleKey } from './module.model';

export interface LearningEvent {
  id?: string;
  studentId?: string;
  classroomId?: string | null;
  module: ModuleKey | 'dashboard' | 'challenges';
  title: string;
  detail?: string;
  xp?: number;
  createdAt?: string;
}

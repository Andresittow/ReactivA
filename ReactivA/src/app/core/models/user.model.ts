export type Role = 'estudiante' | 'docente';

export interface UserProfile {
  id: string;
  role: Role;
  fullName: string;
  email: string;
  grade?: string;
  school?: string;
  avatarUrl?: string;
  newsletter?: boolean;
  createdAt?: string;
}

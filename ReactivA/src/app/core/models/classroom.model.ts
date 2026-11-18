import { UserProfile } from './user.model';

export interface Classroom {
  id: string;
  teacherId: string;
  name: string;
  tag?: string;
  location?: string;
  schedule?: string;
  gradeFilter?: string;
  capacity?: number;
  joinPin: string;
  activeModule?: string;
  currentWeek?: number;
  totalWeeks?: number;
  createdAt?: string;
}

export interface NewClassroom {
  name: string;
  tag?: string;
  location?: string;
  schedule?: string;
  gradeFilter?: string;
  capacity?: number;
  activeModule?: string;
  currentWeek?: number;
  totalWeeks?: number;
}

export interface ClassroomMember {
  classroomId: string;
  studentId: string;
  joinedAt: string;
  studentProfile?: UserProfile;
}

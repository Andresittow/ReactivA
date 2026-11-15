import { Injectable } from '@angular/core';
import { Classroom, NewClassroom, ClassroomMember } from '../models/classroom.model';

export interface AssignWorkshopInput {
  title: string;
  workshop: string;
  dueDate?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ClassroomService {
  // Docente
  async listMine(): Promise<Classroom[]> {
    throw new Error('No implementado: lo implementa Vanessa (PR-V1)');
  }

  async create(input: NewClassroom): Promise<Classroom> {
    throw new Error('No implementado: lo implementa Vanessa (PR-V1)');
  }

  async update(id: string, patch: Partial<NewClassroom>): Promise<Classroom> {
    throw new Error('No implementado: lo implementa Vanessa (PR-V1)');
  }

  async remove(id: string): Promise<void> {
    throw new Error('No implementado: lo implementa Vanessa (PR-V1)');
  }

  async regeneratePin(id: string): Promise<string> {
    throw new Error('No implementado: lo implementa Vanessa (PR-V1)');
  }

  async listMembers(classroomId: string): Promise<ClassroomMember[]> {
    throw new Error('No implementado: lo implementa Vanessa (PR-V1)');
  }

  async assignWorkshop(classroomId: string, input: AssignWorkshopInput): Promise<void> {
    throw new Error('No implementado: lo implementa Vanessa (PR-V2)');
  }

  // Estudiante
  async joinByPin(pin: string): Promise<Classroom> {
    throw new Error('No implementado: lo implementa Vanessa (PR-V1)');
  }

  async getMyClassroom(): Promise<Classroom | null> {
    throw new Error('No implementado: lo implementa Vanessa (PR-V1)');
  }

  async leave(classroomId: string): Promise<void> {
    throw new Error('No implementado: lo implementa Vanessa (PR-V1)');
  }
}

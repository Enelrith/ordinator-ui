import { ProjectMember } from '../../projects/data-access/project.model';

export type TaskImportance = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type TaskStatus = 'COMPLETED' | 'ONGOING' | 'ON_HOLD' | 'CANCELLED';

export interface CreateTaskRequest {
  name: string;
  description: string;
  importance: TaskImportance;
}

export interface TaskInfo {
  id: string;
  updatedAt: string;
  name: string;
  status: TaskStatus;
  importance: TaskImportance;
}

export interface Task {
  id: string;
  updatedAt: string;
  name: string;
  description: string;
  status: TaskStatus;
  importance: TaskImportance;
  taskOwner: ProjectMember;
  taskMembers: ProjectMember[];
}

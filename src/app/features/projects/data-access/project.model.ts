import { User } from '../../users/data-access/user';

export interface CreateProjectRequest {
  name: string;
  description: string;
}

export type ProjectStatus = 'ONGOING' | 'COMPLETED';

export interface ProjectInfo {
  id: string;
  name: string;
  status: ProjectStatus;
  ongoingTaskCount: number;
}

export type ProjectMemberRole = 'ADMIN' | 'MANAGER' | 'MEMBER';

export interface AddProjectMemberRequest {
  role: ProjectMemberRole;
}

export interface ProjectMember {
  id: string;
  role: ProjectMemberRole;
  user: User;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  status: ProjectStatus;
  projectMembers: ProjectMember[];
}

export interface UpdateProjectStatusRequest {
  status: ProjectStatus;
}

import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import {
  AddProjectMemberRequest,
  CreateProjectRequest,
  Project,
  ProjectInfo,
  ProjectMember,
  UpdateProjectStatusRequest,
} from './project.model';

@Service()
export class ProjectApi {
  private readonly http = inject(HttpClient);

  createProject(request: CreateProjectRequest) {
    return this.http.post<Project>('/api/projects', request);
  }

  addProjectMember(request: AddProjectMemberRequest, projectId: string, inviteeEmail: string) {
    return this.http.post<ProjectMember>(
      `/api/projects/${projectId}/users/${inviteeEmail}`,
      request,
    );
  }

  getProject(projectId: string) {
    return this.http.get<Project>(`/api/projects/${projectId}`);
  }

  getAllUserProjectInfo() {
    return this.http.get<ProjectInfo[]>('/api/projects/info');
  }

  getAllProjectMembers(projectId: string) {
    return this.http.get<ProjectMember[]>(`/api/projects/${projectId}/project-members`);
  }

  updateProjectStatus(request: UpdateProjectStatusRequest, projectId: string) {
    return this.http.patch<void>(`/api/projects/${projectId}/status`, request);
  }
}

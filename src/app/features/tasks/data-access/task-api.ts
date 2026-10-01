import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { CreateTaskRequest, Task, TaskInfo } from './task.model';

@Service()
export class TaskApi {
  private readonly http = inject(HttpClient);

  createTask(request: CreateTaskRequest, projectId: string) {
    return this.http.post<Task>(`/api/tasks/projects/${projectId}`, request);
  }

  getAllProjectTaskInfo(projectId: string) {
    return this.http.get<TaskInfo[]>(`/api/tasks/projects/${projectId}/info`);
  }

  getTask(taskId: string, projectId: string) {
    return this.http.get<Task>(`/api/tasks/${taskId}/projects/${projectId}`);
  }

  addTaskMember(taskId: string, projectMemberId: string) {
    return this.http.post<void>(`/api/tasks/${taskId}/project-members/${projectMemberId}`, null);
  }
}

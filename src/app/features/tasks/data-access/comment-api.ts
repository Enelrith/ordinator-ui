import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Page } from '../../../common/data-access/page.model';
import { Comment } from './comment.model';

@Service()
export class CommentApi {
  private readonly http = inject(HttpClient);

  createComment(requestParts: FormData, taskId: string) {
    return this.http.post<Comment>(`/api/comments/tasks/${taskId}`, requestParts);
  }

  getAllTaskComments(projectId: string, taskId: string, pageNumber?: number) {
    return this.http.get<Page<Comment>>(
      `/api/comments/projects/${projectId}/tasks/${taskId}?page=${pageNumber || 0}`,
    );
  }
}

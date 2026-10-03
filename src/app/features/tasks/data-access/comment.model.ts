import { ProjectMember } from '../../projects/data-access/project.model';

export interface CreateCommentRequest {
  content: string;
}

export interface Comment {
  id: string;
  content: string;
  createdAt: string;
  attachmentName: string | null;
  author: ProjectMember | null;
}

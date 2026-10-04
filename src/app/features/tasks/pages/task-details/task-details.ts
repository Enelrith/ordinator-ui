import { Component, inject, OnInit, signal } from '@angular/core';
import { TaskApi } from '../../data-access/task-api';
import { ActivatedRoute } from '@angular/router';
import {
  Task,
  TaskImportance,
  TaskStatus,
  UpdateTaskStatusRequest,
} from '../../data-access/task.model';
import { catchError, concatMap, EMPTY, finalize, map, of, switchMap, tap } from 'rxjs';
import { AuthApi } from '../../../security/data-access/auth-api';
import { DatePipe } from '@angular/common';
import { ProjectMember, ProjectStatus } from '../../../projects/data-access/project.model';
import { ProjectApi } from '../../../projects/data-access/project-api';
import { HttpErrorResponse } from '@angular/common/http';
import { Spinner } from '../../../../common/ui/spinner/spinner';
import { CommentApi } from '../../data-access/comment-api';
import { Page } from '../../../../common/data-access/page.model';
import { Comment } from '../../data-access/comment.model';
import { LucidePaperclip, LucideSave } from '@lucide/angular';

interface ProjectStatusAppearence {
  label: string;
  style: string;
}

interface TaskStatusAppearence {
  label: string;
  style: string;
}

interface TaskImportanceAppearence {
  label: string;
  style: string;
}

@Component({
  imports: [DatePipe, Spinner, LucidePaperclip, LucideSave],
  selector: 'app-task-details',
  templateUrl: './task-details.html',
})
export class TaskDetails implements OnInit {
  private readonly taskService = inject(TaskApi);
  private readonly projectService = inject(ProjectApi);
  private readonly authService = inject(AuthApi);
  private readonly commentService = inject(CommentApi);
  private readonly activateRoute = inject(ActivatedRoute);

  projectId = this.activateRoute.snapshot.paramMap.get('projectId') || '';
  taskId = this.activateRoute.snapshot.paramMap.get('taskId') || '';

  readonly task = signal<Task | null>(null);
  readonly commentsPage = signal<Page<Comment>>({
    content: [],
    page: {
      number: 0,
      size: 10,
      totalElements: 0,
      totalPages: 0,
    },
  });
  readonly loading = signal<boolean>(false);
  readonly loadingComments = signal<boolean>(false);
  readonly httpError = signal<string>('');
  readonly commentsHttpError = signal<string>('');
  readonly isReadOnly = signal<boolean>(true);
  readonly showAssignMemberCard = signal<boolean>(false);
  readonly loadingMembers = signal<boolean>(false);
  readonly projectMembersHttpError = signal<string>('');
  readonly projectMembers = signal<ProjectMember[]>([]);
  readonly selectedMemberId = signal<string>('');
  readonly loadingAssign = signal<boolean>(false);
  readonly assignMemberHttpError = signal<string>('');
  readonly newCommentContent = signal<string>('');
  readonly newCommentAttachment = signal<File | null>(null);
  readonly loadingNewComment = signal<boolean>(false);
  readonly newCommentHttpError = signal<string>('');
  readonly updatedStatus = signal<TaskStatus>('COMPLETED');
  readonly loadingStatusUpdate = signal<boolean>(false);
  readonly statusUpdateHttpError = signal<string>('');

  ngOnInit(): void {
    this.loading.set(true);
    this.loadingComments.set(true);

    this.taskService
      .getTask(this.taskId, this.projectId)
      .pipe(
        finalize(() => this.loading.set(false)),
        tap((task) => {
          this.task.set(task);

          const currentUser = this.authService.currentUser();
          const currentUserMembership = task.taskMembers.find(
            (pm) => pm.user.id === currentUser?.id,
          );

          if (currentUserMembership !== undefined) this.isReadOnly.set(false);
        }),
        catchError(() => {
          this.httpError.set('An unexpected error has occurred while loading the task');

          return EMPTY;
        }),
        concatMap((task) =>
          this.commentService
            .getAllTaskComments(this.projectId, task.id)
            .pipe(finalize(() => this.loadingComments.set(false))),
        ),
      )
      .subscribe({
        next: (commentsPage) => {
          this.commentsPage.set(commentsPage);
        },
        error: () => this.commentsHttpError.set('Error while loading comments'),
      });
  }

  setProjectStatusAppearence(status: ProjectStatus): ProjectStatusAppearence {
    switch (status) {
      case 'ONGOING':
        return { label: 'Ongoing', style: 'text-blue-500' };
      case 'COMPLETED':
        return { label: 'Completed', style: 'text-green-500' };
    }
  }

  setTaskStatusAppearence(status: TaskStatus): TaskStatusAppearence {
    switch (status) {
      case 'ONGOING':
        return { label: 'Ongoing', style: 'text-blue-500' };
      case 'ON_HOLD':
        return { label: 'On Hold', style: 'text-yellow-500' };
      case 'COMPLETED':
        return { label: 'Completed', style: 'text-green-500' };
      case 'CANCELLED':
        return { label: 'Cancelled', style: 'text-red-500' };
    }
  }

  setTaskImportanceAppearence(importance: TaskImportance): TaskImportanceAppearence {
    switch (importance) {
      case 'LOW':
        return { label: 'Low', style: 'text-blue-500' };
      case 'MEDIUM':
        return { label: 'Medium', style: 'text-yellow-500' };
      case 'HIGH':
        return { label: 'High', style: 'text-amber-600' };
      case 'CRITICAL':
        return { label: 'Critical', style: 'text-red-500' };
    }
  }

  onClickAssignMembersButton() {
    this.showAssignMemberCard.set(!this.showAssignMemberCard());

    if (this.projectMembers().length === 0) {
      this.loadingMembers.set(true);

      this.projectService
        .getAllProjectMembers(this.projectId)
        .pipe(finalize(() => this.loadingMembers.set(false)))
        .subscribe({
          next: (projectMembers) => {
            const filteredMembers = projectMembers.filter(
              (projectMember) => !this.memberExists(projectMember),
            );

            if (filteredMembers.length > 0) {
              this.projectMembers.set(filteredMembers);
              this.selectedMemberId.set(filteredMembers[0].id);
            }
          },
          error: () => this.projectMembersHttpError.set('Failed to load project members'),
        });
    }
  }

  onClickCancelAssignMember() {
    this.showAssignMemberCard.set(false);
  }

  onClickAssign() {
    this.loadingAssign.set(true);

    this.taskService
      .addTaskMember(this.task()?.id || '', this.selectedMemberId())
      .pipe(finalize(() => this.loadingAssign.set(false)))
      .subscribe({
        next: () => {
          this.assignMemberHttpError.set('');

          const addedMember = this.projectMembers().find((pm) => pm.id === this.selectedMemberId());

          if (addedMember !== undefined) {
            this.task.update((current) => {
              if (!current) return current;
              return {
                ...current,
                taskMembers: [...current.taskMembers, addedMember],
              };
            });

            const updatedProjectMembers = this.projectMembers().filter(
              (pm) => addedMember.id !== pm.id,
            );

            this.projectMembers.set(updatedProjectMembers);
            this.selectedMemberId.set(updatedProjectMembers[0]?.id ?? '');
          }
        },
        error: (e) => {
          if (e instanceof HttpErrorResponse) {
            if (e.status === 404) this.assignMemberHttpError.set('Could not find member');
            else if (e.status === 409)
              this.assignMemberHttpError.set('This member is already assigned to this task');
          } else {
            this.assignMemberHttpError.set('Error while assigning member');
          }
        },
      });
  }

  onClickPost(attachmentFileInput: HTMLInputElement) {
    this.loadingNewComment.set(true);
    this.newCommentHttpError.set('');

    const content = this.newCommentContent();
    const attachment = this.newCommentAttachment();
    const formData = new FormData();

    formData.append(
      'commentRequest',
      new Blob([JSON.stringify({ content })], { type: 'application/json' }),
    );

    if (attachment) {
      formData.append('attachmentFile', attachment);
    }

    this.commentService
      .createComment(formData, this.task()?.id || '')
      .pipe(
        finalize(() => this.loadingNewComment.set(false)),
        catchError((e) => {
          if (e instanceof HttpErrorResponse && e.status === 400) {
            this.newCommentHttpError.set(e.error.detail);
          } else {
            this.newCommentHttpError.set('Error while posting comment');
          }
          return EMPTY;
        }),
        tap(() => {
          this.newCommentHttpError.set('');
          this.newCommentContent.set('');
          this.newCommentAttachment.set(null);
          attachmentFileInput.value = '';
        }),
        switchMap((newComment) => {
          if (this.commentsPage().page.number !== 0) {
            this.loadingComments.set(true);
            this.commentsHttpError.set('');

            return this.commentService.getAllTaskComments(this.projectId, this.taskId).pipe(
              map((commentsPage) => ({ newComment, commentsPage })),
              finalize(() => this.loadingComments.set(false)),
            );
          } else {
            return of({ newComment, commentsPage: null });
          }
        }),
      )
      .subscribe({
        next: ({ newComment, commentsPage }) => {
          if (!commentsPage) {
            this.commentsPage.update((current) => {
              return {
                ...current,
                content: [newComment, ...current.content],
              };
            });
          } else {
            this.commentsPage.set(commentsPage);
          }
        },
        error: () => this.commentsHttpError.set('Error while loading comments'),
      });
  }

  onSelectFile(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.item(0) || null;

    this.newCommentAttachment.set(file);
  }

  memberExists(projectMember: ProjectMember) {
    const existingMember = this.task()?.taskMembers.find(
      (taskMember) => taskMember.id === projectMember.id,
    );

    if (existingMember !== undefined) {
      return true;
    }

    return false;
  }

  getTotalPagesArray() {
    const arr = [];

    for (let i = 0; i < this.commentsPage().page.totalPages; i++) {
      arr.push(i + 1);
    }

    return arr;
  }

  onClickPageNumber(pageNumber: number) {
    this.loadingComments.set(true);

    this.commentService
      .getAllTaskComments(this.projectId, this.taskId, pageNumber - 1)
      .pipe(finalize(() => this.loadingComments.set(false)))
      .subscribe({
        next: (commentsPage) => this.commentsPage.set(commentsPage),
        error: () => this.commentsHttpError.set('Error while loading comments'),
      });
  }

  getTaskStatusFromString(value: string) {
    switch (value) {
      case 'COMPLETED':
        return 'COMPLETED';
      case 'ON_HOLD':
        return 'ON_HOLD';
      case 'CANCELLED':
        return 'CANCELLED';
      case 'ONGOING':
        return 'ONGOING';
      default:
        throw new Error('Invalid task status value');
    }
  }

  onSelectStatus(event: Event) {
    const select = event.currentTarget as HTMLSelectElement;
    const value = select.value;

    const updatedStatus: TaskStatus = this.getTaskStatusFromString(value);

    this.updatedStatus.set(updatedStatus);
  }

  onClickSaveStatus() {
    if (this.task()?.projectStatus !== 'ONGOING') return;

    this.loadingStatusUpdate.set(true);
    this.statusUpdateHttpError.set('');

    const request: UpdateTaskStatusRequest = {
      status: this.updatedStatus(),
    };

    this.taskService
      .updateTaskStatus(request, this.taskId)
      .pipe(finalize(() => this.loadingStatusUpdate.set(false)))
      .subscribe({
        next: () =>
          this.task.update((current) => {
            if (!current) return current;

            return {
              ...current,
              status: request.status,
            };
          }),
        error: () => this.statusUpdateHttpError.set('Error while updating status'),
      });
  }

  getCurrentUser() {
    return this.authService.currentUser();
  }
}

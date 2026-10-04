import { Component, inject, OnInit, signal } from '@angular/core';
import { ProjectApi } from '../../data-access/project-api';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Title } from '@angular/platform-browser';
import {
  AddProjectMemberRequest,
  Project,
  ProjectMemberRole,
  ProjectStatus,
  UpdateProjectStatusRequest,
} from '../../data-access/project.model';
import { catchError, concatMap, EMPTY, finalize, firstValueFrom, tap } from 'rxjs';
import { TaskApi } from '../../../tasks/data-access/task-api';
import { TaskImportance, TaskInfo, TaskStatus } from '../../../tasks/data-access/task.model';
import { DatePipe } from '@angular/common';
import { AuthApi } from '../../../security/data-access/auth-api';
import { HttpErrorResponse } from '@angular/common/http';
import { form, FormField, FormRoot, required } from '@angular/forms/signals';
import { Spinner } from '../../../../common/ui/spinner/spinner';
import { LucideSave } from '@lucide/angular';

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

interface AddMemberRoleSelect {
  label: string;
  value: ProjectMemberRole;
}

@Component({
  imports: [DatePipe, RouterLink, FormRoot, FormField, Spinner, LucideSave],
  selector: 'app-project-details',
  templateUrl: './project-details.html',
})
export class ProjectDetails implements OnInit {
  private readonly projectService = inject(ProjectApi);
  private readonly taskService = inject(TaskApi);
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly authService = inject(AuthApi);
  private readonly title = inject(Title);

  projectId = this.activatedRoute.snapshot.paramMap.get('id') || '';

  readonly project = signal<Project | null>(null);
  readonly taskInfoList = signal<TaskInfo[]>([]);
  readonly loadingProject = signal<boolean>(false);
  readonly loadingTaskInfo = signal<boolean>(false);
  readonly httpError = signal<string>('');
  readonly showAddMembersCard = signal<boolean>(false);
  readonly currentUserRole = signal<ProjectMemberRole>('MEMBER');
  readonly addProjectMemberModel = signal<AddProjectMemberRequest>({
    role: 'MEMBER',
  });
  readonly loadingInvite = signal<boolean>(false);
  readonly inviteHttpError = signal<string>('');
  readonly inviteeEmail = signal<string>('');
  readonly updatedStatus = signal<ProjectStatus>('COMPLETED');
  readonly loadingStatusUpdate = signal<boolean>(false);
  readonly statusUpdateHttpError = signal<string>('');
  readonly addProjectMemberForm = form(
    this.addProjectMemberModel,
    (schemaPath) => {
      required(schemaPath.role, { message: 'Invitee role is required' });
    },
    {
      submission: {
        action: async (fieldTree) => {
          this.loadingInvite.set(true);

          const request = fieldTree().controlValue();

          await firstValueFrom(
            this.projectService.addProjectMember(request, this.projectId, this.inviteeEmail()).pipe(
              tap((projectMember) => {
                this.inviteHttpError.set('');

                this.project.update((current) => {
                  if (!current) return current;

                  return {
                    ...current,
                    projectMembers: [...current.projectMembers, projectMember],
                  };
                });
                this.showAddMembersCard.set(false);
                this.addProjectMemberForm().reset({ role: 'MEMBER' });
                this.inviteeEmail.set('');
              }),
              catchError((e) => {
                if (e instanceof HttpErrorResponse) {
                  if (e.status === 404) {
                    this.inviteHttpError.set('Could not find this user');
                  } else if (e.status === 409) {
                    this.inviteHttpError.set('This user is already a member');
                  }
                } else {
                  this.inviteHttpError.set('An unexpected error has occurred');
                }
                return EMPTY;
              }),
              finalize(() => this.loadingInvite.set(false)),
            ),
          );
        },
      },
    },
  );

  ngOnInit(): void {
    this.loadingProject.set(true);
    this.loadingTaskInfo.set(true);

    this.projectService
      .getProject(this.projectId)
      .pipe(
        finalize(() => this.loadingProject.set(false)),
        tap((project) => {
          this.project.set(project);
          this.title.setTitle(`Ordinator | ${project.name}`);

          const currentUserRole =
            project.projectMembers.find((pm) => pm.user.id === this.authService.currentUser()?.id)
              ?.role || 'MEMBER';

          this.currentUserRole.set(currentUserRole);
        }),
        catchError(() => {
          this.httpError.set('An unexpected error has occurred while loading the project');
          return EMPTY;
        }),
        concatMap((project) => this.taskService.getAllProjectTaskInfo(project.id)),
        finalize(() => this.loadingTaskInfo.set(false)),
      )
      .subscribe({
        next: (taskInfoList) => {
          this.taskInfoList.set(taskInfoList);
        },
        error: () =>
          this.httpError.set('An unexpected error has occurred while loading the project tasks'),
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

  onClickAddMember() {
    this.showAddMembersCard.set(!this.showAddMembersCard());
  }

  onClickCancelAddMember() {
    this.showAddMembersCard.set(false);
  }

  getValidInviteeRoles(): AddMemberRoleSelect[] {
    if (this.project() !== null) {
      switch (this.currentUserRole()) {
        case 'ADMIN':
          return [
            { label: 'Manager', value: 'MANAGER' },
            { label: 'Member', value: 'MEMBER' },
          ];
        case 'MANAGER':
          return [{ label: 'Member', value: 'MEMBER' }];
        case 'MEMBER':
          return [];
      }
    }
    return [];
  }

  getProjectStatusFromString(value: string) {
    switch (value) {
      case 'COMPLETED':
        return 'COMPLETED';
      case 'ONGOING':
        return 'ONGOING';
      default:
        throw new Error('Invalid project status value');
    }
  }

  onSelectStatus(event: Event) {
    const select = event.currentTarget as HTMLSelectElement;
    const value = select.value;

    const updatedStatus: ProjectStatus = this.getProjectStatusFromString(value);

    this.updatedStatus.set(updatedStatus);
  }

  onClickSaveStatus() {
    this.loadingStatusUpdate.set(true);
    this.statusUpdateHttpError.set('');

    const request: UpdateProjectStatusRequest = {
      status: this.updatedStatus(),
    };

    this.projectService
      .updateProjectStatus(request, this.projectId)
      .pipe(finalize(() => this.loadingStatusUpdate.set(false)))
      .subscribe({
        next: () =>
          this.project.update((current) => {
            if (!current) return current;

            return {
              ...current,
              status: request.status,
            };
          }),
        error: () => this.statusUpdateHttpError.set('Error while updating status'),
      });
  }
}

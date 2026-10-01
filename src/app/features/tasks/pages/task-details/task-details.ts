import { Component, inject, OnInit, signal } from '@angular/core';
import { TaskApi } from '../../data-access/task-api';
import { ActivatedRoute } from '@angular/router';
import { Task, TaskImportance, TaskStatus } from '../../data-access/task.model';
import { finalize } from 'rxjs';
import { AuthApi } from '../../../security/data-access/auth-api';
import { DatePipe } from '@angular/common';
import { ProjectMember } from '../../../projects/data-access/project.model';
import { ProjectApi } from '../../../projects/data-access/project-api';
import { HttpErrorResponse } from '@angular/common/http';
import { Spinner } from '../../../../common/ui/spinner/spinner';

interface TaskStatusAppearence {
  label: string;
  style: string;
}

interface TaskImportanceAppearence {
  label: string;
  style: string;
}

@Component({
  imports: [DatePipe, Spinner],
  selector: 'app-task-details',
  templateUrl: './task-details.html',
})
export class TaskDetails implements OnInit {
  private readonly taskService = inject(TaskApi);
  private readonly projectService = inject(ProjectApi);
  private readonly authService = inject(AuthApi);
  private readonly activateRoute = inject(ActivatedRoute);

  projectId = this.activateRoute.snapshot.paramMap.get('projectId') || '';
  taskId = this.activateRoute.snapshot.paramMap.get('taskId') || '';

  readonly task = signal<Task | null>(null);
  readonly loading = signal<boolean>(false);
  readonly httpError = signal<string>('');
  readonly isReadOnly = signal<boolean>(true);
  readonly showAssignMemberCard = signal<boolean>(false);
  readonly loadingMembers = signal<boolean>(false);
  readonly projectMembersHttpError = signal<string>('');
  readonly projectMembers = signal<ProjectMember[]>([]);
  readonly selectedMemberId = signal<string>('');
  readonly loadingAssign = signal<boolean>(false);
  readonly assignMemberHttpError = signal<string>('');

  ngOnInit(): void {
    this.loading.set(true);

    this.taskService
      .getTask(this.taskId, this.projectId)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (task) => {
          this.task.set(task);

          const currentUser = this.authService.currentUser();
          const currentUserMembership = task.taskMembers.find(
            (pm) => pm.user.id === currentUser?.id,
          );

          if (currentUserMembership !== undefined) this.isReadOnly.set(false);
        },
        error: () => this.httpError.set('An unexpected error has occurred while loading the task'),
      });
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

  memberExists(projectMember: ProjectMember) {
    const existingMember = this.task()?.taskMembers.find(
      (taskMember) => taskMember.id === projectMember.id,
    );

    if (existingMember !== undefined) {
      return true;
    }

    return false;
  }
}

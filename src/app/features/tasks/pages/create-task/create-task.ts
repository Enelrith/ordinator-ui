import { Component, inject, signal } from '@angular/core';
import { TaskApi } from '../../data-access/task-api';
import { CreateTaskRequest } from '../../data-access/task.model';
import { form, FormField, FormRoot, maxLength, required } from '@angular/forms/signals';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, EMPTY, firstValueFrom, tap } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { Spinner } from '../../../../common/ui/spinner/spinner';

@Component({
  imports: [Spinner, FormRoot, FormField],
  selector: 'app-create-task',
  templateUrl: './create-task.html',
})
export class CreateTask {
  private readonly taskService = inject(TaskApi);
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly router = inject(Router);

  projectId = this.activatedRoute.snapshot.paramMap.get('projectId') || '';

  readonly httpError = signal<string>('');
  readonly createTaskModel = signal<CreateTaskRequest>({
    name: '',
    description: '',
    importance: 'CRITICAL',
  });
  readonly createTaskForm = form(
    this.createTaskModel,
    (schemaPath) => {
      maxLength(schemaPath.name, 100, { message: 'Task name cannot exceed 100 characters' });
      required(schemaPath.name, { message: 'Task name is required' });
      maxLength(schemaPath.description, 500, {
        message: 'Task description cannot exceed 500 characters',
      });
      required(schemaPath.importance, { message: 'Task importance is required' });
    },
    {
      submission: {
        action: async (fieldTree) => {
          const request = fieldTree().controlValue();

          await firstValueFrom(
            this.taskService.createTask(request, this.projectId).pipe(
              tap(() =>
                this.router.navigateByUrl(`/projects/${this.projectId}`, { replaceUrl: true }),
              ),
              catchError((e) => {
                if (e instanceof HttpErrorResponse && e.status === 409) {
                  this.httpError.set('A task with this name already exists for this project');
                } else {
                  this.httpError.set('An unexpected error has occurred while creating the task');
                }
                return EMPTY;
              }),
            ),
          );
        },
      },
    },
  );
}

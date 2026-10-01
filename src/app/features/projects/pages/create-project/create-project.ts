import { Component, inject, signal } from '@angular/core';
import { ProjectApi } from '../../data-access/project-api';
import { CreateProjectRequest } from '../../data-access/project.model';
import { form, FormField, FormRoot, maxLength, minLength, required } from '@angular/forms/signals';
import { catchError, EMPTY, firstValueFrom, tap } from 'rxjs';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { Spinner } from '../../../../common/ui/spinner/spinner';

@Component({
  imports: [Spinner, FormRoot, FormField],
  selector: 'app-create-project',
  templateUrl: './create-project.html',
})
export class CreateProject {
  private readonly projectService = inject(ProjectApi);
  private readonly router = inject(Router);

  readonly httpError = signal<string>('');
  readonly createProjectModel = signal<CreateProjectRequest>({
    name: '',
    description: '',
  });
  readonly createProjectForm = form(
    this.createProjectModel,
    (schemaPath) => {
      minLength(schemaPath.name, 3, { message: 'Project name must be at least 3 characters long' });
      maxLength(schemaPath.name, 50, { message: 'Project name cannot exceed 50 characters' });
      required(schemaPath.name, { message: 'Project name is required' });
      maxLength(schemaPath.description, 500, {
        message: 'Project description cannot exceed 500 characters',
      });
    },
    {
      submission: {
        action: async (fieldTree) => {
          const request = fieldTree().controlValue();

          await firstValueFrom(
            this.projectService.createProject(request).pipe(
              tap(() => this.router.navigateByUrl('/projects', { replaceUrl: true })),
              catchError((e) => {
                if (e instanceof HttpErrorResponse && e.status === 409) {
                  this.httpError.set('You already have a project with this name');
                } else {
                  this.httpError.set('An unexpected error has occurred while creating the project');
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

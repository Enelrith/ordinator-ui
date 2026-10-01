import { Component, inject, OnInit, signal } from '@angular/core';
import { ProjectApi } from '../../data-access/project-api';
import { ProjectInfo } from '../../data-access/project.model';
import { finalize } from 'rxjs';
import { Spinner } from '../../../../common/ui/spinner/spinner';
import { RouterLink } from '@angular/router';

@Component({
  imports: [Spinner, RouterLink],
  selector: 'app-view-projects',
  templateUrl: './view-projects.html',
})
export class ViewProjects implements OnInit {
  private readonly projectService = inject(ProjectApi);

  readonly projectInfoList = signal<ProjectInfo[]>([]);
  readonly loading = signal<boolean>(false);
  readonly httpError = signal<string>('');

  ngOnInit(): void {
    this.loading.set(true);

    this.projectService
      .getAllUserProjectInfo()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (projectInfoList) => this.projectInfoList.set(projectInfoList),
        error: () => this.httpError.set('An unexpected error has occurred'),
      });
  }

  setOngoingTaskCountAppearence(count: number) {
    if (count === 0) return 'text-primary';
    else if (count > 0 && count < 5) return 'text-blue-500';
    else if (count > 5 && count < 10) return 'text-yellow-500';
    else return 'text-red-500';
  }
}

import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/view-projects/view-projects').then((m) => m.ViewProjects),
    title: 'Ordinator | Projects',
  },
  {
    path: 'create',
    loadComponent: () =>
      import('./pages/create-project/create-project').then((m) => m.CreateProject),
    title: 'Ordinator | Create Project',
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./pages/project-details/project-details').then((m) => m.ProjectDetails),
  },
  {
    path: ':projectId/tasks',
    loadChildren: () => import('../tasks/tasks.routes').then((m) => m.routes),
  },
];

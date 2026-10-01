import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'create',
    loadComponent: () => import('./pages/create-task/create-task').then((m) => m.CreateTask),
  },
  {
    path: ':taskId',
    loadComponent: () => import('./pages/task-details/task-details').then((m) => m.TaskDetails),
  },
];

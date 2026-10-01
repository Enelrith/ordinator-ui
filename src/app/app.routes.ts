import { Routes } from '@angular/router';
import { Home } from './features/home/pages/home/home';
import { CreateAccount } from './features/users/pages/create-account/create-account';
import { Login } from './features/security/pages/login/login';

export const routes: Routes = [
  {
    path: '',
    component: Home,
    title: 'Ordinator | Home',
  },
  {
    path: 'create-account',
    component: CreateAccount,
    title: 'Ordinator | Create Account',
  },
  {
    path: 'login',
    component: Login,
    title: 'Ordinator | Login',
  },
  {
    path: 'projects',
    loadChildren: () => import('./features/projects/projects.routes').then((m) => m.routes),
  },
];

import { Component, inject, signal } from '@angular/core';
import { AuthApi } from '../../data-access/auth-api';
import { Logo } from '../../../../common/ui/logo/logo';
import {
  email,
  form,
  FormField,
  FormRoot,
  maxLength,
  minLength,
  required,
} from '@angular/forms/signals';
import { catchError, concatMap, EMPTY, firstValueFrom, tap } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { Spinner } from '../../../../common/ui/spinner/spinner';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

@Component({
  imports: [FormRoot, FormField, Logo, Spinner, RouterLink],
  selector: 'app-login',
  templateUrl: './login.html',
})
export class Login {
  private readonly authService = inject(AuthApi);
  private readonly router = inject(Router);
  private readonly activatedRoute = inject(ActivatedRoute);

  redirectUrl = this.activatedRoute.snapshot.paramMap.get('redirectUrl');

  readonly httpErrorMessage = signal<string>('');
  readonly loginModel = signal({
    email: '',
    password: '',
  });
  readonly loginForm = form(
    this.loginModel,
    (schemaPath) => {
      maxLength(schemaPath.email, 256, { message: 'Email cannot exceed 256 characters' });
      email(schemaPath.email, { message: 'Must be a valid email' });
      required(schemaPath.email, { message: 'Email is required' });
      minLength(schemaPath.password, 12, {
        message: 'Password must consist of at least 12 characters',
      });
      maxLength(schemaPath.password, 64, { message: 'Password cannot exceed 64 characters' });
      required(schemaPath.password, { message: 'Password is required' });
    },
    {
      submission: {
        action: async (fieldTree) => {
          const fields = fieldTree().controlValue();
          const credentials = new FormData();
          credentials.append('email', fields.email);
          credentials.append('password', fields.password);

          this.httpErrorMessage.set('');

          await firstValueFrom(
            this.authService.login(credentials).pipe(
              catchError((e) => {
                if (e instanceof HttpErrorResponse && e.status === 401) {
                  this.httpErrorMessage.set('Invalid credentials');
                } else {
                  this.httpErrorMessage.set('An unexpected error has occurred');
                }
                return EMPTY;
              }),
              concatMap(() => this.authService.me()),
              tap((user) => {
                this.authService.currentUser.set(user);
                this.redirectUrl === null
                  ? this.router.navigateByUrl('/', { replaceUrl: true })
                  : this.router.navigateByUrl(this.redirectUrl, { replaceUrl: true });
              }),
              catchError(() => {
                this.httpErrorMessage.set('An unexpected error has occurred');
                return EMPTY;
              }),
            ),
          );
        },
      },
    },
  );
}

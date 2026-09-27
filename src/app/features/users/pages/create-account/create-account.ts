import { Component, inject, signal } from '@angular/core';
import { UserApi } from '../../data-access/user-api';
import { CreateUserRequest } from '../../data-access/user';
import {
  email,
  form,
  FormField,
  FormRoot,
  maxLength,
  minLength,
  pattern,
  required,
} from '@angular/forms/signals';
import { catchError, EMPTY, firstValueFrom, tap } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { Spinner } from '../../../../common/ui/spinner/spinner';
import { Logo } from '../../../../common/ui/logo/logo';
import { Router, RouterLink } from '@angular/router';
import { AuthApi } from '../../../security/data-access/auth-api';

@Component({
  imports: [FormRoot, FormField, Spinner, Logo, RouterLink],
  selector: 'app-create-account',
  templateUrl: './create-account.html',
})
export class CreateAccount {
  private readonly userService = inject(UserApi);
  private readonly authService = inject(AuthApi);
  private readonly router = inject(Router);

  readonly confirmPassword = signal<string>('');
  readonly confirmPasswordError = signal<string>('');
  readonly httpErrorMessage = signal<string>('');
  readonly createAccountModel = signal<CreateUserRequest>({
    email: '',
    rawPassword: '',
    firstName: '',
    lastName: '',
  });
  readonly createAccountForm = form(
    this.createAccountModel,
    (schemaPath) => {
      const NAME_PATTERN = /^(?!.*[-']{2})[A-Za-z](?:[A-Za-z'-]*[A-Za-z])?$/;

      maxLength(schemaPath.email, 256, { message: 'Email cannot exceed 256 characters' });
      email(schemaPath.email, { message: 'Must be a valid email' });
      required(schemaPath.email, { message: 'Email is required' });
      minLength(schemaPath.rawPassword, 12, {
        message: 'Password must consist of at least 12 characters',
      });
      maxLength(schemaPath.rawPassword, 64, { message: 'Password cannot exceed 64 characters' });
      required(schemaPath.rawPassword, { message: 'Password is required' });
      maxLength(schemaPath.firstName, 20, { message: 'First name cannot exceed 20 characters' });
      pattern(schemaPath.firstName, NAME_PATTERN, { message: 'Invalid first name format' });
      required(schemaPath.firstName, { message: 'First name is required' });
      maxLength(schemaPath.lastName, 20, { message: 'Last name cannot exceed 20 characters' });
      pattern(schemaPath.lastName, NAME_PATTERN, { message: 'Invalid last name format' });
      required(schemaPath.lastName, { message: 'Last name is required' });
    },
    {
      submission: {
        action: async (fieldTree) => {
          const request = fieldTree().controlValue();

          if (request.rawPassword !== this.confirmPassword()) {
            this.confirmPasswordError.set('Passwords do not match');
            return;
          }

          this.httpErrorMessage.set('');

          const user = await firstValueFrom(
            this.userService.createUser(request).pipe(
              catchError((e) => {
                if (e instanceof HttpErrorResponse) {
                  if (e.status === 409 || e.status === 400) {
                    this.httpErrorMessage.set(e.error.detail);
                  } else {
                    this.httpErrorMessage.set('An unexpected error has occurred');
                  }
                } else {
                  this.httpErrorMessage.set('An unexpected error has occurred');
                }
                return EMPTY;
              }),
            ),
          );

          const credentials = new FormData();
          credentials.append('email', request.email);
          credentials.append('password', request.rawPassword);

          await firstValueFrom(
            this.authService.login(credentials).pipe(
              tap(() => {
                this.authService.currentUser.set(user);
                this.router.navigateByUrl('/', { replaceUrl: true });
              }),
              catchError(() => {
                this.router.navigateByUrl('/login', { replaceUrl: true });
                return EMPTY;
              }),
            ),
          );
        },
      },
    },
  );

  onChangeConfirmPassword(inputValue: string) {
    this.confirmPassword.set(inputValue);
  }
}

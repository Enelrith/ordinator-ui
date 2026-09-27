import { HttpClient } from '@angular/common/http';
import { inject, Service, signal } from '@angular/core';
import { User } from '../../users/data-access/user';

@Service()
export class AuthApi {
  private readonly http = inject(HttpClient);

  readonly currentUser = signal<User | null>(null);

  login(credentials: FormData) {
    return this.http.post<void>('api/auth/login', credentials);
  }

  logout() {
    return this.http.post<void>('api/auth/logout', null);
  }

  csrf() {
    return this.http.get<void>('api/auth/csrf');
  }

  me() {
    return this.http.get<User>('api/auth/me');
  }
}

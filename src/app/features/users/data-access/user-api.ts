import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { CreateUserRequest, User } from './user';

@Service()
export class UserApi {
  private readonly http = inject(HttpClient);

  createUser(request: CreateUserRequest) {
    return this.http.post<User>('/api/users', request);
  }
}

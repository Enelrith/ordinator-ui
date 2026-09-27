export interface CreateUserRequest {
  email: string;
  rawPassword: string;
  firstName: string;
  lastName: string;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

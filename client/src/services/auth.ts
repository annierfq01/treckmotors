import { apiRequest } from './api';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'cliente';
  active: boolean;
  createdAt: string;
  session?: any;
}

export async function login(email: string, password: string): Promise<AuthUser> {
  return apiRequest<AuthUser>('/auth/login', {
    method: 'POST',
    body: { email, password },
  });
}

export async function register(email: string, name: string, password: string, role?: string): Promise<AuthUser> {
  return apiRequest<AuthUser>('/auth/register', {
    method: 'POST',
    body: { email, name, password, role },
  });
}

export async function syncUser(user: { id?: string; email: string; name: string; role?: string }): Promise<AuthUser> {
  return apiRequest<AuthUser>('/users', {
    method: 'POST',
    body: user,
  });
}

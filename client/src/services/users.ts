import { apiRequest } from './api';
import type { User } from '../types';

export async function getUsers(): Promise<User[]> {
  return apiRequest<User[]>('/users');
}

export async function updateUser(id: string, user: Partial<User>): Promise<User> {
  return apiRequest<User>(`/users/${id}`, { method: 'PUT', body: user });
}

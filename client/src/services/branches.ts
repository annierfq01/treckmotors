import { apiRequest } from './api';
import type { Branch } from '../types';

export async function getBranches(): Promise<Branch[]> {
  return apiRequest<Branch[]>('/branches');
}

export async function createBranch(branch: Partial<Branch>): Promise<Branch> {
  return apiRequest<Branch>('/branches', { method: 'POST', body: branch });
}

export async function updateBranch(id: string, branch: Partial<Branch>): Promise<Branch> {
  return apiRequest<Branch>(`/branches/${id}`, { method: 'PUT', body: branch });
}

export async function deleteBranch(id: string): Promise<{ success: boolean }> {
  return apiRequest(`/branches/${id}`, { method: 'DELETE' });
}

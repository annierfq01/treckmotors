import { apiRequest } from './api';
import type { SystemSettings } from '../types';

export async function getSettings(): Promise<SystemSettings> {
  return apiRequest<SystemSettings>('/settings');
}

export async function updateSettings(settings: Partial<SystemSettings>): Promise<SystemSettings> {
  return apiRequest<SystemSettings>('/settings', { method: 'PUT', body: settings });
}

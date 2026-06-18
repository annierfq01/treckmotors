import { apiRequest } from './api';

export async function getFacebookAuthUrl(): Promise<{ authUrl: string }> {
  return apiRequest<{ authUrl: string }>('/facebook/auth-url');
}

export async function handleFacebookCallback(code: string): Promise<{ success: boolean; pageId: string; pageName: string; message: string }> {
  return apiRequest('/facebook/callback', { method: 'POST', body: { code } });
}

export async function getFacebookStatus(): Promise<{ connected: boolean; pageId?: string; pageName?: string }> {
  return apiRequest('/facebook/status');
}

export async function postToFacebook(productId: string): Promise<{ success: boolean; postId: string; type: string }> {
  return apiRequest('/facebook/post', { method: 'POST', body: { productId } });
}

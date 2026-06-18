import { apiRequest } from './api';

interface UploadResponse {
  url: string;
  path: string;
}

export async function uploadImage(
  bucket: string,
  fileName: string,
  fileBase64: string,
  contentType: string = 'image/jpeg'
): Promise<UploadResponse> {
  return apiRequest<UploadResponse>('/storage/upload', {
    method: 'POST',
    body: { bucket, fileName, contentType, fileBase64 },
  });
}

export async function deleteImage(bucket: string, filePath: string): Promise<{ success: boolean }> {
  return apiRequest('/storage/delete', {
    method: 'DELETE',
    body: { bucket, filePath },
  });
}

export function getPublicUrl(bucket: string, path: string): string {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
  return `${supabaseUrl}/storage/v1/object/public/${bucket}/${path}`;
}

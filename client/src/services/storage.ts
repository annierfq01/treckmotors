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
  const base64Size = new Blob([fileBase64]).size;
  const estimatedBytes = Math.round(base64Size * 0.75);

  if (estimatedBytes > 10 * 1024 * 1024) {
    throw new Error(`La imagen comprimida aún pesa ~${Math.round(estimatedBytes / 1024 / 1024 * 10) / 10}MB. Intenta con una foto más pequeña.`);
  }

  try {
    return await apiRequest<UploadResponse>('/storage/upload', {
      method: 'POST',
      body: { bucket, fileName, contentType, fileBase64 },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error desconocido';
    throw new Error(`Error al subir al servidor: ${msg}`);
  }
}

export async function uploadDirect(
  bucket: string,
  fileName: string,
  file: Blob
): Promise<UploadResponse> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) {
    throw new Error('Faltan credenciales de Supabase en el cliente');
  }

  const url = `${supabaseUrl.replace(/\/+$/, '')}/storage/v1/object/${bucket}/${fileName}`;

  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      'Content-Type': file.type || 'image/jpeg',
      'Authorization': `Bearer ${anonKey}`,
    },
    body: file,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => 'Sin respuesta');
    throw new Error(`Supabase direct upload failed (${res.status}): ${text.slice(0, 200)}`);
  }

  return {
    url: `${supabaseUrl.replace(/\/+$/, '')}/storage/v1/object/public/${bucket}/${fileName}`,
    path: fileName,
  };
}

export async function deleteImage(bucket: string, filePath: string): Promise<{ success: boolean }> {
  try {
    return await apiRequest<{ success: boolean }>('/storage/delete', {
      method: 'DELETE',
      body: { bucket, filePath },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error desconocido';
    throw new Error(`Error al eliminar imagen: ${msg}`);
  }
}

export function getPublicUrl(bucket: string, path: string): string {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
  return `${supabaseUrl.replace(/\/+$/, '')}/storage/v1/object/public/${bucket}/${path}`;
}

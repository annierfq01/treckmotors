import { createClient } from '@supabase/supabase-js';
import WebSocket from 'ws';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('[Supabase] Missing SUPABASE_URL or SUPABASE_ANON_KEY environment variables');
}

const realtimeOpts = { transport: WebSocket as any };

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: realtimeOpts,
});

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  realtime: realtimeOpts,
});

const STORAGE_URL_PREFIX = `${supabaseUrl}/storage/v1/object/public/`;

export async function deleteStorageImage(imageUrl: string): Promise<void> {
  if (!imageUrl || !imageUrl.startsWith(STORAGE_URL_PREFIX)) return;

  const pathAfterPublic = imageUrl.slice(STORAGE_URL_PREFIX.length);
  const slashIdx = pathAfterPublic.indexOf('/');
  if (slashIdx === -1) return;

  const bucket = pathAfterPublic.slice(0, slashIdx);
  const filePath = pathAfterPublic.slice(slashIdx + 1);
  if (!bucket || !filePath) return;

  const { error } = await supabaseAdmin.storage.from(bucket).remove([filePath]);
  if (error) {
    console.error(`[Storage] Error deleting ${bucket}/${filePath}:`, error.message);
  }
}

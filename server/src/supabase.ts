import { createClient } from '@supabase/supabase-js';
import WebSocket from 'ws';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('[Supabase] Missing SUPABASE_URL or SUPABASE_ANON_KEY environment variables');
}

const realtimeOpts = { transport: WebSocket };

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: realtimeOpts,
});

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  realtime: realtimeOpts,
});

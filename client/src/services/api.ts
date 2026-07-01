const API_BASE = '/api';
const DEFAULT_TIMEOUT = 30000;

interface ApiOptions {
  method?: string;
  body?: any;
  headers?: Record<string, string>;
  timeout?: number;
}

function getAuthToken(): string | null {
  try {
    const saved = localStorage.getItem('supabase_session');
    if (saved) {
      const session = JSON.parse(saved);
      return session?.access_token || null;
    }
  } catch {}
  return null;
}

function getUserEmail(): string | null {
  try {
    const saved = localStorage.getItem('treck_user');
    if (saved) {
      const user = JSON.parse(saved);
      return user?.email || null;
    }
  } catch {}
  return null;
}

export async function apiRequest<T = any>(endpoint: string, options: ApiOptions = {}): Promise<T> {
  const { method = 'GET', body, headers = {}, timeout = DEFAULT_TIMEOUT } = options;

  const authHeaders: Record<string, string> = {};

  const token = getAuthToken();
  if (token) {
    authHeaders['Authorization'] = `Bearer ${token}`;
  } else {
    const email = getUserEmail();
    if (email) {
      authHeaders['x-user-email'] = email;
    }
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  const config: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders,
      ...headers,
    },
    signal: controller.signal,
  };

  if (body && method !== 'GET') {
    config.body = JSON.stringify(body);
  }

  try {
    const res = await fetch(`${API_BASE}${endpoint}`, config);

    if (!res.ok) {
      let msg = `HTTP ${res.status}`;
      try {
        const errData = await res.json();
        if (errData.error) msg = errData.error;
        if (errData.detail) msg += ` (${errData.detail})`;
        if (errData.step) msg += ` [${errData.step}]`;
      } catch {}
      throw new Error(msg);
    }

    return res.json();
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new Error('La conexión está tardando demasiado. Revisa tu internet e intenta de nuevo.');
    }
    if (err instanceof TypeError && err.message === 'Failed to fetch') {
      throw new Error('No se pudo conectar con el servidor. Revisa tu conexión a internet.');
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

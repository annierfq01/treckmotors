const API_BASE = '/api';

interface ApiOptions {
  method?: string;
  body?: any;
  headers?: Record<string, string>;
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
  const { method = 'GET', body, headers = {} } = options;

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

  const config: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders,
      ...headers,
    },
  };

  if (body && method !== 'GET') {
    config.body = JSON.stringify(body);
  }

  const res = await fetch(`${API_BASE}${endpoint}`, config);

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(errorData.error || `HTTP ${res.status}`);
  }

  return res.json();
}

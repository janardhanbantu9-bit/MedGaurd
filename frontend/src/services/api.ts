import { supabase } from '../lib/supabase';

async function authHeaders(): Promise<Record<string, string>> {
  if (!supabase) {
    throw new Error(
      'Supabase Auth is not configured. Check VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY.'
    );
  }

  const { data, error } = await supabase.auth.getSession();

  if (error) {
    console.error('Supabase session lookup failed:', error);
    throw new Error(`Authentication session error: ${error.message}`);
  }

  const token = data.session?.access_token;

  if (!token) {
    throw new Error('You are not signed in. Please sign in again.');
  }

  return {
    Authorization: `Bearer ${token}`,
  };
}

async function readResponse(response: Response): Promise<any> {
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      data?.error ||
      data?.message ||
      `Request failed (${response.status} ${response.statusText})`;

    throw new Error(message);
  }

  return data;
}

async function post<T>(path: string, payload: unknown): Promise<T> {
  // Auth/session errors must stay outside the network try/catch.
  const auth = await authHeaders();

  let response: Response;

  try {
    response = await fetch(path, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...auth,
      },
      body: JSON.stringify(payload),
    });
  } catch (error) {
    console.error(`POST ${path} failed:`, error);
    throw new Error(`Could not reach ${path}. Check that the API server is running.`);
  }

  return (await readResponse(response)) as T;
}

async function get<T>(path: string): Promise<T> {
  const auth = await authHeaders();

  let response: Response;

  try {
    response = await fetch(path, {
      method: 'GET',
      headers: auth,
    });
  } catch (error) {
    console.error(`GET ${path} failed:`, error);
    throw new Error(`Could not reach ${path}. Check that the API server is running.`);
  }

  return (await readResponse(response)) as T;
}

export { get, post };

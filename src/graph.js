import { getAccessToken } from './auth.js';

const BASE = 'https://graph.microsoft.com/v1.0';

async function request(method, path, body = null, params = {}) {
  const token = await getAccessToken();
  const url = new URL(`${BASE}${path}`);

  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
  }

  const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  const res = await fetch(url.toString(), {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (res.status === 204) return null;

  const data = await res.json();

  if (!res.ok) {
    const msg = data?.error?.message || data?.error?.code || res.statusText;
    throw new Error(`Graph API ${res.status}: ${msg}`);
  }

  return data;
}

export const graphGet = (path, params) => request('GET', path, null, params);
export const graphPost = (path, body) => request('POST', path, body);
export const graphPatch = (path, body) => request('PATCH', path, body);
export const graphDelete = (path) => request('DELETE', path);

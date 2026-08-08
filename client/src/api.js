const TOKEN_PREFIX = 'student-os:';

function getStoredThemeFallback() {
  try {
    return localStorage.getItem('theme') || 'default';
  } catch {
    return 'default';
  }
}

function base64UrlDecode(value) {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
  const binary = atob(padded);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

export function parseTokenPayload(token) {
  if (!token || !token.startsWith(TOKEN_PREFIX)) return null;
  const parts = token.slice(TOKEN_PREFIX.length).split('.');
  // New format: header.payload.signature (3 parts); old format: payload (1 part, contains password)
  if (parts.length < 2) return null; // reject old insecure tokens
  try {
    const payload = JSON.parse(new TextDecoder().decode(base64UrlDecode(parts[1])));
    // Validate expiration
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

export function getStoredUser() {
  const token = localStorage.getItem('token');
  const payload = parseTokenPayload(token);
  if (!payload) {
    // Invalid/expired/old-format token - clear it
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('username');
    localStorage.removeItem('displayName');
    localStorage.removeItem('isAdmin');
    return { role: '', username: '', name: '', theme: getStoredThemeFallback(), isAdmin: false };
  }
  return {
    role: payload.role || '',
    username: payload.sub || '',
    name: localStorage.getItem('displayName') || payload.sub || '',
    theme: getStoredThemeFallback(),
    isAdmin: payload.role === 'admin',
  };
}

export function saveAuth(token, user) {
  localStorage.setItem('token', token);
  // Keep displayName/theme for UI convenience; role/isAdmin are derived from the JWT token itself
  if (user?.name) localStorage.setItem('displayName', user.name);
  if (user?.username) localStorage.setItem('username', user.username);
  if (user?.theme) localStorage.setItem('theme', user.theme);
}

export function clearAuth() {
  localStorage.removeItem('token');
  localStorage.removeItem('role');
  localStorage.removeItem('username');
  localStorage.removeItem('displayName');
  localStorage.removeItem('isAdmin');
}

export function authHeaders(extra = {}) {
  const token = localStorage.getItem('token');
  return {
    ...extra,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export function jsonHeaders() {
  return authHeaders({ 'Content-Type': 'application/json' });
}

const KICKED_EVENT = 'auth:kicked';
let interceptorInstalled = false;

export function installAuthInterceptor() {
  if (interceptorInstalled) return;
  interceptorInstalled = true;

  const originalFetch = window.fetch.bind(window);
  window.fetch = async (...args) => {
    const response = await originalFetch(...args);
    // Only intercept API calls
    const url = typeof args[0] === 'string' ? args[0] : args[0]?.url || '';
    if (response.status === 401 && url.startsWith('/api/')) {
      try {
        const clone = response.clone();
        const data = await clone.json();
        if (data?.code === 'SESSION_KICKED') {
          window.dispatchEvent(new CustomEvent(KICKED_EVENT, {
            detail: { message: data.error || '账号已在其他设备登录' },
          }));
        }
      } catch {
        // ignore non-JSON responses
      }
    }
    return response;
  };
}

export const AUTH_KICKED_EVENT = KICKED_EVENT;

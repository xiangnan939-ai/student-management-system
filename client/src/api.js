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

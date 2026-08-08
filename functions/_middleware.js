// Security middleware: proper CORS handling, security headers
export async function onRequest(context) {
  const { request, env, next } = context;
  const origin = request.headers.get('Origin');

  // Parse allowed origins from env (comma-separated). Same-origin has no Origin header so is always allowed.
  const allowedOrigins = env.ALLOWED_ORIGINS
    ? String(env.ALLOWED_ORIGINS).split(',').map(o => o.trim()).filter(Boolean)
    : [];
  const originAllowed = origin && allowedOrigins.includes(origin);

  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    const headers = new Headers({
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
      'Vary': 'Origin',
    });
    if (originAllowed) {
      headers.set('Access-Control-Allow-Origin', origin);
      headers.set('Access-Control-Allow-Credentials', 'true');
    }
    return new Response(null, { status: 204, headers });
  }

  const response = await next();

  // Add security headers to all responses
  const newHeaders = new Headers(response.headers);
  newHeaders.set('X-Content-Type-Options', 'nosniff');
  newHeaders.set('X-Frame-Options', 'DENY');
  newHeaders.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  newHeaders.set('X-XSS-Protection', '1; mode=block');
  newHeaders.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  newHeaders.set('Vary', 'Origin');

  // CORS: never use wildcard. Only allow explicitly configured origins or same-origin (no Origin header).
  if (originAllowed) {
    newHeaders.set('Access-Control-Allow-Origin', origin);
    newHeaders.set('Access-Control-Allow-Credentials', 'true');
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders,
  });
}

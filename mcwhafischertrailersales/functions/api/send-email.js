const ALLOWED_ORIGINS = [
  'https://mcwhafischertrailersales.pages.dev',
  'https://mcwhafischertrailersales.com',
  'https://www.mcwhafischertrailersales.com',
];

const ALLOWED_FIELDS = ['from_name', 'from_email', 'phone', 'trailer_style', 'axle', 'width', 'length', 'message'];
const MAX_FIELD_LENGTH = 1000;
const RATE_LIMIT_SECONDS = 30;

function getCorsHeaders(request) {
  const origin = request.headers.get('Origin') || '';
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };
}

function sanitize(str) {
  if (typeof str !== 'string') return '';
  return str.slice(0, MAX_FIELD_LENGTH).trim();
}

export async function onRequestOptions(context) {
  return new Response(null, { status: 204, headers: getCorsHeaders(context.request) });
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const headers = getCorsHeaders(request);

  // Check origin
  const origin = request.headers.get('Origin') || '';
  if (!ALLOWED_ORIGINS.includes(origin)) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers });
  }

  // Rate limit by IP using Cloudflare KV (falls back to no limit if KV not bound)
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  if (env.RATE_LIMIT) {
    const key = `ratelimit:${ip}`;
    const last = await env.RATE_LIMIT.get(key);
    if (last) {
      return new Response(JSON.stringify({ error: 'Please wait before sending another request' }), { status: 429, headers });
    }
    await env.RATE_LIMIT.put(key, '1', { expirationTtl: RATE_LIMIT_SECONDS });
  }

  try {
    const body = await request.json();

    // Validate required fields
    if (!body.from_name || !body.from_email || !body.phone) {
      return new Response(JSON.stringify({ error: 'Name, email, and phone are required' }), { status: 400, headers });
    }

    // Basic email format check
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.from_email)) {
      return new Response(JSON.stringify({ error: 'Invalid email address' }), { status: 400, headers });
    }

    // Whitelist and sanitize fields
    var templateParams = {};
    for (var i = 0; i < ALLOWED_FIELDS.length; i++) {
      templateParams[ALLOWED_FIELDS[i]] = sanitize(body[ALLOWED_FIELDS[i]] || '');
    }

    const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        service_id: env.EMAILJS_SERVICE_ID,
        template_id: env.EMAILJS_TEMPLATE_ID,
        user_id: env.EMAILJS_PUBLIC_KEY,
        template_params: templateParams,
      }),
    });

    if (response.ok) {
      return new Response(JSON.stringify({ success: true }), { status: 200, headers });
    }

    return new Response(JSON.stringify({ error: 'Failed to send email' }), { status: 500, headers });
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500, headers });
  }
}

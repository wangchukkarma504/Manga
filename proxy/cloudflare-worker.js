const ALLOWED_ORIGINS = [
  'https://wangchukkarma504.github.io',
  'http://localhost:3000',
  'http://localhost:5173',
];

function getCorsHeaders(origin) {
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];

  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'GET,HEAD,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
  };
}

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const origin = request.headers.get('Origin') || '';
    const corsHeaders = getCorsHeaders(origin);

    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: corsHeaders,
      });
    }

    const pathname = url.pathname.replace(/^\/api\/mangadex/, '');
    const upstreamUrl = new URL(`https://api.mangadex.org${pathname}${url.search}`);

    const upstreamResponse = await fetch(upstreamUrl.toString(), {
      method: request.method,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'MangaReaderApp/1.0',
      },
      body: request.method === 'GET' || request.method === 'HEAD' ? undefined : request.body,
    });

    const responseHeaders = new Headers(upstreamResponse.headers);
    Object.entries(corsHeaders).forEach(([key, value]) => {
      responseHeaders.set(key, value);
    });

    return new Response(upstreamResponse.body, {
      status: upstreamResponse.status,
      statusText: upstreamResponse.statusText,
      headers: responseHeaders,
    });
  },
};
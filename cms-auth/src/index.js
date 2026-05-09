const GITHUB_AUTHORIZE_URL = 'https://github.com/login/oauth/authorize';
const GITHUB_TOKEN_URL = 'https://github.com/login/oauth/access_token';

export default {
  async fetch(request, env) {
    try {
      return await routeRequest(request, env);
    } catch (error) {
      console.error(error);
      return jsonResponse(
        { error: 'server_error', error_description: error.message || 'Unexpected error' },
        500,
        env,
      );
    }
  },
};

async function routeRequest(request, env) {
  const url = new URL(request.url);

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders(getAllowedOrigin(env)) });
  }

  if (url.pathname === '/health') {
    return jsonResponse({ ok: true }, 200, env);
  }

  if (url.pathname === '/auth') {
    return handleAuth(request, env, url);
  }

  if (url.pathname === '/auth/refresh') {
    return handleRefresh(request, env, url);
  }

  if (url.pathname === '/callback') {
    return handleCallback(request, env, url);
  }

  return jsonResponse({ error: 'not_found' }, 404, env);
}

async function handleAuth(request, env, url) {
  const provider = url.searchParams.get('provider');
  const scope = url.searchParams.get('scope') || 'public_repo';
  const siteId = url.searchParams.get('site_id');

  if (provider !== 'github') {
    return renderAuthMessage('authorization:github:error:' + JSON.stringify({ message: 'Unsupported provider' }), env.ALLOWED_ORIGIN, 400);
  }

  const openerOrigin = resolveAllowedOrigin(env, siteId);
  const state = await signState(
    {
      provider,
      scope,
      openerOrigin,
      issuedAt: Date.now(),
    },
    env.OAUTH_STATE_SECRET,
  );

  const redirectUrl = new URL(GITHUB_AUTHORIZE_URL);
  redirectUrl.searchParams.set('client_id', env.GITHUB_CLIENT_ID);
  redirectUrl.searchParams.set('redirect_uri', new URL('/callback', request.url).toString());
  redirectUrl.searchParams.set('scope', scope);
  redirectUrl.searchParams.set('state', state);

  return renderHandshakePage({ provider, openerOrigin, redirectUrl: redirectUrl.toString() });
}

async function handleRefresh(request, env, url) {
  if (request.method !== 'POST') {
    return jsonResponse({ error: 'method_not_allowed' }, 405, env);
  }

  const provider = url.searchParams.get('provider');
  const refreshToken = url.searchParams.get('refresh_token');
  const siteId = url.searchParams.get('site_id');
  resolveAllowedOrigin(env, siteId);

  if (provider !== 'github') {
    return jsonResponse({ error: 'unsupported_provider' }, 400, env);
  }

  if (!refreshToken) {
    return jsonResponse({ error: 'missing_refresh_token' }, 400, env);
  }

  const tokenResponse = await exchangeGithubToken(env, {
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
  });

  return jsonResponse(normalizeTokenResponse(tokenResponse), 200, env);
}

async function handleCallback(request, env, url) {
  const error = url.searchParams.get('error');
  const errorDescription = url.searchParams.get('error_description');
  const stateToken = url.searchParams.get('state');
  const code = url.searchParams.get('code');

  if (!stateToken) {
    return renderStandaloneError('Missing OAuth state.');
  }

  let state;
  try {
    state = await verifyState(stateToken, env.OAUTH_STATE_SECRET);
  } catch (stateError) {
    return renderStandaloneError(stateError.message || 'Invalid OAuth state.');
  }

  const openerOrigin = resolveAllowedOrigin(env, new URL(state.openerOrigin).host);

  if (error) {
    return renderAuthMessage(
      'authorization:github:error:' + JSON.stringify({ message: `${error}: ${errorDescription || 'Authorization failed'}` }),
      openerOrigin,
      400,
    );
  }

  if (!code) {
    return renderAuthMessage(
      'authorization:github:error:' + JSON.stringify({ message: 'Missing authorization code' }),
      openerOrigin,
      400,
    );
  }

  try {
    const tokenResponse = await exchangeGithubToken(env, {
      code,
      redirect_uri: new URL('/callback', request.url).toString(),
    });

    return renderAuthMessage(
      'authorization:github:success:' + JSON.stringify(normalizeTokenResponse(tokenResponse)),
      openerOrigin,
      200,
    );
  } catch (exchangeError) {
    return renderAuthMessage(
      'authorization:github:error:' + JSON.stringify({ message: exchangeError.message || 'Token exchange failed' }),
      openerOrigin,
      500,
    );
  }
}

function resolveAllowedOrigin(env, siteId) {
  const allowedOrigin = env.ALLOWED_ORIGIN;

  if (!allowedOrigin) {
    throw new Error('Missing ALLOWED_ORIGIN');
  }

  if (!siteId) {
    return allowedOrigin;
  }

  const allowedHost = new URL(allowedOrigin).host;
  if (siteId !== allowedHost) {
    throw new Error(`Unexpected site_id: ${siteId}`);
  }

  return allowedOrigin;
}

async function exchangeGithubToken(env, params) {
  const response = await fetch(GITHUB_TOKEN_URL, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'User-Agent': 'portfolio-cms-auth',
    },
    body: JSON.stringify({
      client_id: env.GITHUB_CLIENT_ID,
      client_secret: env.GITHUB_CLIENT_SECRET,
      ...params,
    }),
  });

  const data = await response.json();

  if (!response.ok || data.error) {
    throw new Error(data.error_description || data.error || 'GitHub token exchange failed');
  }

  return data;
}

function normalizeTokenResponse(tokenResponse) {
  const payload = {
    token: tokenResponse.access_token,
    provider: 'github',
  };

  if (tokenResponse.refresh_token) {
    payload.refresh_token = tokenResponse.refresh_token;
  }

  if (tokenResponse.expires_in) {
    payload.expires_in = tokenResponse.expires_in;
  }

  return payload;
}

function renderHandshakePage({ provider, openerOrigin, redirectUrl }) {
  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <title>Authorizing GitHub</title>
  </head>
  <body>
    <p>Authorizing with GitHub...</p>
    <script>
      const openerOrigin = ${JSON.stringify(openerOrigin)};
      const redirectUrl = ${JSON.stringify(redirectUrl)};
      const handshakeMessage = ${JSON.stringify(`authorizing:${provider}`)};

      function redirectToGithub(event) {
        if (event.origin !== openerOrigin || event.data !== handshakeMessage) {
          return;
        }

        window.removeEventListener('message', redirectToGithub);
        window.location.assign(redirectUrl);
      }

      if (!window.opener) {
        document.body.innerHTML = '<p>This page must be opened by the CMS login popup.</p>';
      } else {
        window.addEventListener('message', redirectToGithub);
        window.opener.postMessage(handshakeMessage, openerOrigin);
      }
    </script>
  </body>
</html>`;

  return new Response(html, {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}

function renderAuthMessage(message, openerOrigin, status) {
  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <title>GitHub Authorization</title>
  </head>
  <body>
    <p>Completing authorization...</p>
    <script>
      const openerOrigin = ${JSON.stringify(openerOrigin)};
      const message = ${JSON.stringify(message)};

      if (window.opener) {
        window.opener.postMessage(message, openerOrigin);
        window.close();
      } else {
        document.body.innerHTML = '<p>Authorization finished, but no opener window was found.</p>';
      }
    </script>
  </body>
</html>`;

  return new Response(html, {
    status,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}

function renderStandaloneError(message) {
  return new Response(
    `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>OAuth Error</title></head><body><p>${escapeHtml(message)}</p></body></html>`,
    {
      status: 400,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    },
  );
}

function jsonResponse(payload, status, env) {
  const allowedOrigin = getAllowedOrigin(env);

  return new Response(JSON.stringify(payload, null, 2), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...corsHeaders(allowedOrigin),
    },
  });
}

function corsHeaders(allowedOrigin) {
  const headers = {
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    Vary: 'Origin',
  };

  if (allowedOrigin) {
    headers['Access-Control-Allow-Origin'] = allowedOrigin;
  }

  return headers;
}

function getAllowedOrigin(env) {
  if (!env || typeof env.ALLOWED_ORIGIN !== 'string') {
    return '';
  }

  return env.ALLOWED_ORIGIN;
}

async function signState(payload, secret) {
  const serialized = JSON.stringify(payload);
  const encodedPayload = base64UrlEncode(new TextEncoder().encode(serialized));
  const signature = await signText(encodedPayload, secret);
  return `${encodedPayload}.${signature}`;
}

async function verifyState(token, secret) {
  const [encodedPayload, providedSignature] = token.split('.');

  if (!encodedPayload || !providedSignature) {
    throw new Error('Malformed OAuth state');
  }

  const expectedSignature = await signText(encodedPayload, secret);
  if (expectedSignature !== providedSignature) {
    throw new Error('Invalid OAuth state signature');
  }

  const payload = JSON.parse(new TextDecoder().decode(base64UrlDecode(encodedPayload)));
  const ageMs = Date.now() - payload.issuedAt;
  if (ageMs > 10 * 60 * 1000) {
    throw new Error('OAuth state expired');
  }

  return payload;
}

async function signText(text, secret) {
  if (!secret) {
    throw new Error('Missing OAUTH_STATE_SECRET');
  }

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );

  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(text));
  return base64UrlEncode(new Uint8Array(signature));
}

function base64UrlEncode(bytes) {
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function base64UrlDecode(value) {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padding = normalized.length % 4 === 0 ? '' : '='.repeat(4 - (normalized.length % 4));
  const binary = atob(normalized + padding);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}

function escapeHtml(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
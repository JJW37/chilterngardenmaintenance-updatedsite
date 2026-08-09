import assert from 'node:assert/strict';
import test from 'node:test';

import { onRequestPost as requestLogin } from '../functions/api/auth-request.js';
import { onRequestGet as verifyLogin } from '../functions/api/auth-verify.js';
import { sha256 } from '../functions/_lib/auth.js';

class MemoryKv {
  values = new Map();

  async get(key) {
    return this.values.get(key) ?? null;
  }

  async put(key, value) {
    this.values.set(key, value);
  }
}

class PortalDb {
  state = {
    client: {
      id: 7,
      household_name: 'The Hawthorn Household',
      email: 'demo@example.test',
      is_active: 1,
    },
    magicTokens: new Map(),
    sessions: [],
  };

  prepare(sql) {
    const state = this.state;
    return {
      bind(...params) {
        return {
          async first() {
            if (sql.includes('FROM clients') && sql.includes('LOWER(username)')) {
              return params[0] === 'hawthorn-household' ? state.client : null;
            }
            if (sql.includes('FROM magic_tokens t')) {
              const token = state.magicTokens.get(params[0]);
              return token
                ? {
                    client_id: token.client_id,
                    expires_at: token.expires_at,
                    used: token.used,
                    is_active: state.client.is_active,
                  }
                : null;
            }
            throw new Error(`Unexpected first() query: ${sql}`);
          },
          async run() {
            if (sql.includes('INSERT INTO magic_tokens')) {
              state.magicTokens.set(params[0], {
                client_id: params[1],
                expires_at: params[2],
                used: 0,
              });
              return { meta: { changes: 1 } };
            }
            if (sql.includes('UPDATE magic_tokens')) {
              const token = state.magicTokens.get(params[0]);
              if (!token || token.used || token.expires_at <= params[1]) {
                return { meta: { changes: 0 } };
              }
              token.used = 1;
              return { meta: { changes: 1 } };
            }
            if (sql.includes('INSERT INTO sessions')) {
              state.sessions.push({
                session_id: params[0],
                client_id: params[1],
                is_admin: params[2],
                expires_at: params[3],
              });
              return { meta: { changes: 1 } };
            }
            throw new Error(`Unexpected run() query: ${sql}`);
          },
        };
      },
    };
  }
}

function testEnvironment() {
  return {
    DB: new PortalDb(),
    PORTAL_KV: new MemoryKv(),
    PORTAL_ENVIRONMENT: 'local',
    PORTAL_DEV_CAPTURE_EMAILS: 'true',
    SESSION_SECRET: 'local-test-session-secret-with-at-least-thirty-two-characters',
    SITE_BASE_URL: 'http://127.0.0.1:8788',
  };
}

test('local magic-link flow creates one client session and rejects replay', async () => {
  const env = testEnvironment();
  const initialRequest = new Request('http://127.0.0.1:8788/api/auth-request', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'hawthorn-household' }),
  });

  const loginResponse = await requestLogin({ request: initialRequest, env });
  assert.equal(loginResponse.status, 200);
  const payload = await loginResponse.json();
  assert.match(payload.developmentMagicLink, /^http:\/\/127\.0\.0\.1:8788\/portal\/verify\/\?token=[a-f0-9]{64}$/);

  const rawToken = new URL(payload.developmentMagicLink).searchParams.get('token');
  assert.equal(env.DB.state.magicTokens.has(rawToken), false, 'the raw token is never stored in D1');
  assert.equal(env.DB.state.magicTokens.has(await sha256(rawToken)), true);

  const verified = await verifyLogin({
    request: new Request(payload.developmentMagicLink),
    env,
  });
  assert.equal(verified.status, 302);
  assert.equal(verified.headers.get('Location'), 'http://127.0.0.1:8788/portal/');
  assert.match(verified.headers.get('Set-Cookie'), /HttpOnly/);
  assert.match(verified.headers.get('Set-Cookie'), /SameSite=Strict/);
  assert.doesNotMatch(verified.headers.get('Set-Cookie'), /Secure/);
  assert.equal(env.DB.state.sessions.length, 1);
  assert.equal(env.DB.state.sessions[0].client_id, 7);

  const replay = await verifyLogin({
    request: new Request(payload.developmentMagicLink),
    env,
  });
  assert.equal(replay.status, 302);
  assert.equal(replay.headers.get('Location'), 'http://127.0.0.1:8788/login/?error=invalid_token');
  assert.equal(env.DB.state.sessions.length, 1, 'a used magic link cannot create a second session');
});

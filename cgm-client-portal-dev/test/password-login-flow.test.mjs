import assert from 'node:assert/strict';
import test from 'node:test';

import { onRequestPost as passwordLogin } from '../functions/api/auth-login.js';
import { hashPassword } from '../functions/_lib/auth.js';

class MemoryKv {
  values = new Map();
  async get(key) { return this.values.get(key) ?? null; }
  async put(key, value) { this.values.set(key, value); }
}

class PasswordLoginDb {
  constructor(passwordHash) {
    this.client = { id: 11, password_hash: passwordHash, is_active: 1 };
    this.sessions = [];
  }

  prepare(sql) {
    const db = this;
    return {
      bind(...params) {
        return {
          async first() {
            if (sql.includes('FROM clients') && sql.includes('LOWER(username)')) {
              return params[0] === 'cgm-preview' ? db.client : null;
            }
            throw new Error(`Unexpected first() query: ${sql}`);
          },
          async run() {
            if (sql.includes('INSERT INTO sessions')) {
              db.sessions.push({ sessionId: params[0], clientId: params[1], isAdmin: params[2] });
              return { meta: { changes: 1 } };
            }
            throw new Error(`Unexpected run() query: ${sql}`);
          },
        };
      },
    };
  }
}

test('a valid household password creates a private client session', async () => {
  const db = new PasswordLoginDb(await hashPassword('garden-preview-passphrase'));
  const env = {
    DB: db,
    PORTAL_KV: new MemoryKv(),
    SESSION_SECRET: 'local-test-session-secret-with-at-least-thirty-two-characters',
  };
  const valid = await passwordLogin({
    request: new Request('http://127.0.0.1:8788/api/auth-login', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'cgm-preview', password: 'garden-preview-passphrase' }),
    }),
    env,
  });
  assert.equal(valid.status, 200);
  assert.equal((await valid.json()).redirect, '/portal/');
  assert.match(valid.headers.get('Set-Cookie'), /HttpOnly/);
  assert.equal(db.sessions.length, 1);
  assert.equal(db.sessions[0].clientId, 11);

  const invalid = await passwordLogin({
    request: new Request('http://127.0.0.1:8788/api/auth-login', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'cgm-preview', password: 'wrong password' }),
    }),
    env,
  });
  assert.equal(invalid.status, 401);
  assert.equal(db.sessions.length, 1, 'an invalid password cannot create another session');
});

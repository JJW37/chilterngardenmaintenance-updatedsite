import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildClearCookieHeader,
  buildSetCookieHeader,
  hmac,
  hashPassword,
  passwordError,
  randomToken,
  sha256,
  verifyAdminCredentials,
  verifyPassword,
} from '../functions/_lib/auth.js';
import { sendMagicLinkEmail } from '../functions/_lib/email.js';

test('session cookie is secure in HTTPS mode and usable in local HTTP mode', () => {
  const expiry = '2030-01-01T00:00:00.000Z';
  assert.match(buildSetCookieHeader('abc', expiry), /; Secure;/);
  assert.doesNotMatch(buildSetCookieHeader('abc', expiry, { secure: false }), /; Secure;/);
  assert.doesNotMatch(buildClearCookieHeader({ secure: false }), /; Secure;/);
});

test('tokens, hashes and signatures are deterministic where expected', async () => {
  const token = randomToken();
  assert.match(token, /^[a-f0-9]{64}$/);
  assert.equal(await sha256('abc'), 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
  assert.equal(await hmac('test-secret', 'message'), await hmac('test-secret', 'message'));
  assert.notEqual(await hmac('test-secret', 'message'), await hmac('test-secret', 'other-message'));
});

test('admin login recognises the documented hashed-password format', async () => {
  const password = 'local-development-password';
  const env = {
    MASTER_ADMIN_USER: 'cgm-admin',
    MASTER_ADMIN_PASS: `sha256:${await sha256(password)}`,
  };
  assert.equal(await verifyAdminCredentials(env, 'cgm-admin', password), true);
  assert.equal(await verifyAdminCredentials(env, 'cgm-admin', 'wrong-password'), false);
});

test('client passwords use a per-profile salted PBKDF2 hash', async () => {
  const password = 'a deliberately long garden portal passphrase';
  const firstHash = await hashPassword(password);
  const secondHash = await hashPassword(password);
  assert.match(firstHash, /^pbkdf2_sha256\$60000\$[a-f0-9]{32}\$[a-f0-9]{64}$/);
  assert.notEqual(firstHash, secondHash, 'a fresh salt is used for every profile');
  assert.equal(await verifyPassword(password, firstHash), true);
  assert.equal(await verifyPassword('wrong passphrase', firstHash), false);
  assert.match(passwordError('too short'), /at least 12 characters/);
});

test('local email capture creates a testable link without calling an email provider', async () => {
  const result = await sendMagicLinkEmail(
    {
      to: 'demo@example.test',
      householdName: 'The Hawthorn Household',
      token: 'a'.repeat(64),
      verifyPath: '/portal/verify/',
    },
    {
      PORTAL_ENVIRONMENT: 'local',
      PORTAL_DEV_CAPTURE_EMAILS: 'true',
      SITE_BASE_URL: 'http://127.0.0.1:8788',
    },
  );
  assert.equal(result.delivery, 'captured');
  assert.equal(result.magicLink, `http://127.0.0.1:8788/portal/verify/?token=${'a'.repeat(64)}`);
});

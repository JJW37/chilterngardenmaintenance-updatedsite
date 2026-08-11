/**
 * CGM Client Portal - Database helpers
 * Wraps Cloudflare D1 with small convenience methods.
 *
 * D1 binding name (set in wrangler.toml / Pages dashboard): DB
 */

export const DB_NAME = 'DB';

/**
 * Run a single statement.
 * @param {D1Database} db
 * @param {string} sql
 * @param {any[]} params
 * @returns {Promise<D1Result>}
 */
export function run(db, sql, params = []) {
  return db.prepare(sql).bind(...params).run();
}

/**
 * Run a query and return all rows.
 * @param {D1Database} db
 * @param {string} sql
 * @param {any[]} params
 * @returns {Promise<any[]>}
 */
export async function all(db, sql, params = []) {
  const res = await db.prepare(sql).bind(...params).all();
  return res.results || [];
}

/**
 * Run a query and return the first row (or null).
 * @param {D1Database} db
 * @param {string} sql
 * @param {any[]} params
 * @returns {Promise<any|null>}
 */
export async function first(db, sql, params = []) {
  const res = await db.prepare(sql).bind(...params).first();
  return res || null;
}

/**
 * The portal is deliberately same-origin only. Do not add permissive CORS
 * headers here: browser requests carry an authenticated HttpOnly cookie and
 * must only be made by pages served from this Cloudflare Pages project.
 */
export const corsHeaders = {};

/** Standard JSON response helper. */
export function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...corsHeaders,
      ...extraHeaders,
    },
  });
}

/**
 * Same-origin browser requests do not preflight. Returning a plain 204 here
 * keeps unexpected OPTIONS requests harmless without granting cross-origin
 * access.
 */
export function handlePreflight(request) {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204 });
  }
  return null;
}

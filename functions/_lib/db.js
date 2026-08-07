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
 * Standard CORS headers for the portal API.
 * Locked to same-origin (Cloudflare Pages serves the HTML on the same
 * domain as the /api/* functions, so same-origin works in production).
 */
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Credentials': 'true',
};

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

/** Handle CORS preflight. */
export function handlePreflight(request) {
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  return null;
}

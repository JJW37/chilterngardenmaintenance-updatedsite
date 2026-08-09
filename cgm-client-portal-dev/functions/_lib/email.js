/**
 * CGM Client Portal - Email helper (Resend)
 *
 * Reuses the same RESEND_API_KEY your booking form already uses.
 * Sends magic-link login emails to clients.
 *
 * Required env:
 *   - RESEND_API_KEY
 *   - PORTAL_EMAIL_FROM     e.g. "Chiltern Garden Maintenance <noreply@chilterngardenmaintenance.com>"
 *   - SITE_BASE_URL         e.g. "https://www.chilterngardenmaintenance.com"
 *                            (used to build absolute magic-link URLs)
 */

/**
 * Send a magic-link login email.
 * @param {Object} args
 * @param {string} args.to           recipient email
 * @param {string} args.householdName e.g. "The Smith Household"
 * @param {string} args.token        magic-link token
 * @param {string} args.verifyPath   e.g. "/portal/verify/"
 * @param {Object} env
 */
export async function sendMagicLinkEmail({ to, householdName, token, verifyPath }, env) {
  const baseUrl = (env.SITE_BASE_URL || '').replace(/\/+$/, '');
  const link = `${baseUrl}${verifyPath}?token=${token}`;
  const safeHouseholdName = escapeHtml(householdName || '');

  const subject = `Your secure login link – Chiltern Garden Maintenance`;
  const text = `Hello${householdName ? ` from ${householdName}` : ''},

You requested a secure login link to your private client portal at Chiltern Garden Maintenance.

Click the link below to sign in. The link expires in 15 minutes and can only be used once:

${link}

If you did not request this link, you can safely ignore this email – no one else can use this link to access your account.

Kind regards,
Chiltern Garden Maintenance
https://www.chilterngardenmaintenance.com`;

  const html = `<!doctype html>
<html><body style="margin:0;padding:0;background:#f7f3ea;font-family:Inter,Arial,sans-serif;color:#1a2118;">
  <div style="max-width:560px;margin:0 auto;padding:32px 24px;">
    <div style="background:#102019;border-radius:12px 12px 0 0;padding:24px 28px;color:#f7f3ea;">
      <div style="font-family:'Cormorant Garamond',Georgia,serif;font-size:24px;font-weight:600;letter-spacing:-0.01em;">Chiltern Garden Maintenance</div>
      <div style="font-size:13px;color:#c8a45e;margin-top:4px;letter-spacing:0.08em;text-transform:uppercase;">Client Portal</div>
    </div>
    <div style="background:#ffffff;padding:32px 28px;border:1px solid #ddd6c4;border-top:none;">
      <h1 style="font-family:'Cormorant Garamond',Georgia,serif;font-size:26px;color:#1e3a2a;margin:0 0 16px;font-weight:600;">Your secure login link</h1>
      <p style="font-size:16px;line-height:1.6;color:#2d3528;margin:0 0 16px;">Hello${safeHouseholdName ? ` from <strong>${safeHouseholdName}</strong>` : ''},</p>
      <p style="font-size:16px;line-height:1.6;color:#2d3528;margin:0 0 24px;">You requested a secure login link to your private client portal. Click the button below to sign in. The link expires in 15 minutes and can only be used once.</p>
      <p style="margin:0 0 24px;text-align:center;">
        <a href="${link}" style="display:inline-block;background:#2d5a3d;color:#ffffff;text-decoration:none;font-weight:600;font-size:16px;padding:14px 32px;border-radius:8px;border:2px solid #2d5a3d;">Sign in to my portal</a>
      </p>
      <p style="font-size:14px;color:#5a6455;margin:0 0 8px;">If the button doesn't work, copy and paste this link into your browser:</p>
      <p style="font-size:13px;color:#2d5a3d;word-break:break-all;background:#f7f3ea;padding:12px;border-radius:6px;margin:0 0 24px;">${link}</p>
      <p style="font-size:14px;color:#5a6455;margin:0 0 0;border-top:1px solid #ebe5d2;padding-top:16px;">If you did not request this link, you can safely ignore this email – no one else can use this link to access your account.</p>
    </div>
    <div style="background:#f0ead8;border-radius:0 0 12px 12px;padding:20px 28px;font-size:12px;color:#5a6455;text-align:center;">
      Chiltern Garden Maintenance &middot; Oxfordshire &middot; Buckinghamshire &middot; Berkshire<br>
      <a href="https://www.chilterngardenmaintenance.com" style="color:#2d5a3d;">www.chilterngardenmaintenance.com</a>
    </div>
  </div>
</body></html>`;

  // Local testing must never send a message to a real address. The caller may
  // expose this link only when PORTAL_ENVIRONMENT is exactly "local".
  if (env.PORTAL_ENVIRONMENT === 'local' && env.PORTAL_DEV_CAPTURE_EMAILS === 'true') {
    return { ok: true, delivery: 'captured', magicLink: link };
  }

  return sendEmail(env, {
    to,
    subject,
    html,
    text,
  });
}

/** Send a "new note posted" notification to a client. */
export async function sendNewNoteEmail({ to, householdName, authorName, notePreview }, env) {
  const baseUrl = (env.SITE_BASE_URL || '').replace(/\/+$/, '');
  const link = `${baseUrl}/login/`;
  const safeHouseholdName = escapeHtml(householdName || '');
  const safeAuthorName = escapeHtml(authorName || 'your gardener');
  const safePreview = escapeHtml(notePreview || '');
  const subject = `New update from Chiltern Garden Maintenance`;
  const text = `Hello${householdName ? ` from ${householdName}` : ''},

${authorName || 'Your gardener'} has posted a new update to your client portal:

"${notePreview}"

Visit your portal to read the full note and view any attached images:
${link}

Kind regards,
Chiltern Garden Maintenance`;

  const html = `<!doctype html>
<html><body style="margin:0;padding:0;background:#f7f3ea;font-family:Inter,Arial,sans-serif;color:#1a2118;">
  <div style="max-width:560px;margin:0 auto;padding:32px 24px;">
    <div style="background:#102019;border-radius:12px 12px 0 0;padding:24px 28px;color:#f7f3ea;">
      <div style="font-family:'Cormorant Garamond',Georgia,serif;font-size:24px;font-weight:600;">Chiltern Garden Maintenance</div>
      <div style="font-size:13px;color:#c8a45e;margin-top:4px;letter-spacing:0.08em;text-transform:uppercase;">New Update</div>
    </div>
    <div style="background:#ffffff;padding:32px 28px;border:1px solid #ddd6c4;border-top:none;">
      <h1 style="font-family:'Cormorant Garamond',Georgia,serif;font-size:24px;color:#1e3a2a;margin:0 0 16px;">New update from ${safeAuthorName}</h1>
      <p style="font-size:16px;line-height:1.6;color:#2d3528;margin:0 0 16px;">Hello${safeHouseholdName ? ` from <strong>${safeHouseholdName}</strong>` : ''},</p>
      <div style="background:#f7f3ea;padding:16px 20px;border-left:4px solid #c8a45e;border-radius:6px;font-size:15px;line-height:1.6;color:#2d3528;margin:0 0 24px;">${safePreview}</div>
      <p style="margin:0 0 24px;text-align:center;">
        <a href="${link}" style="display:inline-block;background:#2d5a3d;color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;padding:12px 28px;border-radius:8px;">Visit my portal</a>
      </p>
    </div>
  </div>
</body></html>`;

  return sendEmail(env, { to, subject, html, text });
}

/** Low-level Resend API call. */
async function sendEmail(env, { to, subject, html, text }) {
  if (!env.RESEND_API_KEY) {
    console.warn('[email] RESEND_API_KEY not set – skipping email send.');
    return { ok: false, reason: 'no_api_key' };
  }
  const from = env.PORTAL_EMAIL_FROM || env.CGM_EMAIL_FROM || 'Chiltern Garden Maintenance <noreply@chilterngardenmaintenance.com>';

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject,
      html,
      text,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error('[email] Resend error:', res.status, errText);
    return { ok: false, reason: 'resend_error', status: res.status, body: errText };
  }
  return { ok: true, data: await res.json() };
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

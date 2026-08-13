# Pre-launch actions — production domain and portal

**Status: required before the custom-domain production launch.** The present GitHub Pages site remains a public preview with a WhatsApp flow for quote enquiries. This file records work that cannot be completed safely without access to the CGM Cloudflare account and final domain configuration.

## 1. Deploy one real quote endpoint

- Configure the production Cloudflare Pages/Worker project so `POST /api/quote` is served by the repository's `functions/api/quote.js` route.
- Confirm it sends a test enquiry to `hello@chilterngardenmaintenance.com` through the configured Resend credentials, and that uploaded photos are stored/handled as intended.
- Replace the temporary `mailto:` no-JavaScript fallback on `/booking/` with the deployed endpoint or a specifically configured form provider. Test JS enabled, JS disabled, failed network and photo-upload paths.

## 2. Complete form and portal abuse protection

- Create Cloudflare Turnstile site and secret keys, add the widget to the booking form, and enable server-side verification through `TURNSTILE_SECRET`.
- Keep the existing honeypot and allowed-origin checking on quote submission.
- Add origin checks and server-generated CSRF tokens to the client and staff authentication/state-changing portal endpoints. Confirm secure, `HttpOnly`, `SameSite=Lax` (or stricter where possible) session cookies on the production domain.
- Add rate limiting to quote and login endpoints; test that legitimate submissions still work.

## 3. Finish the domain migration

- Add and verify the final CGM domain in GitHub Pages or Cloudflare, redirect the GitHub Pages preview host to it where appropriate, then switch canonicals, Open Graph URLs, sitemap and `robots.txt` to that final domain.
- Verify a real image response for the social-preview asset after the domain goes live.
- Submit the final sitemap to Google Search Console and review indexing/crawl errors.

## 4. Compliance and operational checks

- Have the Privacy Policy, Cookie Policy and Website Terms reviewed against CGM's final trading identity, registered address (if applicable), insurers, retention periods, suppliers and actual marketing/cookie stack.
- Verify that analytics is not loaded until consent is recorded and that users can change their preference.
- Complete an end-to-end quote test and client/staff portal test using a non-production client record before launch.

## Already completed in the GitHub Pages release

- Privacy, cookie and terms pages now exist and are linked in the sitemap.
- `robots.txt`, working GitHub Pages canonicals and a real on-host social image are present.
- The legacy `/login.html` path redirects to the supported login route.
- The booking form has explicit `action` and `method` attributes and a honeypot.

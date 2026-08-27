/**
 * AstroLib Errata Feedback · Serverless Bot Proxy Worker
 *
 * Cloudflare Worker / Serverless Edge Function implementation for silent
 * GitHub Issue creation on behalf of readers.
 *
 * Deployment (Cloudflare Workers):
 *   1. Paste this script into Cloudflare Workers dashboard.
 *   2. Set environment secret: GITHUB_TOKEN (Personal Access Token with `issues:write` or `public_repo` permission).
 *   3. Optional secret: ALLOWED_ORIGIN (e.g. "https://astrolib.site" or "*" for dev).
 *   4. Paste the worker URL into `src/config/features.config.mjs` -> `features.feedback.config.botEndpoint`.
 */

export default {
  async fetch(request, env, ctx) {
    // 1. Resolve Environment Variables (Multi-runtime fallback)
    const githubToken =
      env?.GITHUB_TOKEN ||
      (typeof GITHUB_TOKEN !== 'undefined' ? GITHUB_TOKEN : undefined) ||
      (typeof process !== 'undefined' ? process.env?.GITHUB_TOKEN : undefined);

    const allowedOrigin =
      env?.ALLOWED_ORIGIN ||
      (typeof ALLOWED_ORIGIN !== 'undefined' ? ALLOWED_ORIGIN : undefined) ||
      '*';

    // 2. Handle CORS Headers (Intelligent multi-origin & local development support)
    const origin = request.headers.get('Origin') || '';
    let corsOrigin = '*';

    if (allowedOrigin && allowedOrigin !== '*') {
      const allowedList = allowedOrigin.split(',').map((s) => s.trim().toLowerCase());
      const lowerOrigin = origin.toLowerCase();
      // Allow if explicit match, or local dev (localhost / 127.0.0.1), or Vercel preview
      if (
        !origin ||
        allowedList.includes(lowerOrigin) ||
        lowerOrigin.startsWith('http://localhost:') ||
        lowerOrigin.startsWith('http://127.0.0.1:') ||
        lowerOrigin.endsWith('.vercel.app')
      ) {
        corsOrigin = origin || '*';
      } else {
        corsOrigin = allowedList[0];
      }
    }

    const corsHeaders = {
      'Access-Control-Allow-Origin': corsOrigin,
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    if (request.method === 'GET') {
      return new Response(
        JSON.stringify({
          ok: true,
          service: 'AstroLib Errata Bot Proxy',
          status: 'online',
          hasToken: !!githubToken,
          message: 'Ready to receive POST errata payloads.',
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ ok: false, message: 'Method Not Allowed (POST required)' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 3. Validate GitHub Token
    if (!githubToken) {
      return new Response(
        JSON.stringify({
          ok: false,
          message: 'Server configuration error: GITHUB_TOKEN secret is missing. Please save and deploy variables in Cloudflare dashboard.',
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3. Parse Request Payload
    let body;
    try {
      body = await request.json();
    } catch {
      return new Response(
        JSON.stringify({ ok: false, message: 'Invalid JSON payload in request body.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { repo, title, body: issueBody, labels } = body || {};
    if (!repo || !title || !issueBody) {
      return new Response(
        JSON.stringify({
          ok: false,
          message: 'Missing required parameters: repo, title, and body are mandatory.',
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 4. Dispatch to GitHub API
    try {
      const ghRes = await fetch(`https://api.github.com/repos/${repo}/issues`, {
        method: 'POST',
        headers: {
          Authorization: `token ${githubToken}`,
          Accept: 'application/vnd.github.v3+json',
          'User-Agent': 'AstroLib-Feedback-Bot',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          body: issueBody,
          labels: Array.isArray(labels) ? labels : ['errata'],
        }),
      });

      const ghData = await ghRes.json();
      if (!ghRes.ok) {
        return new Response(
          JSON.stringify({
            ok: false,
            message: ghData.message || `GitHub API error (HTTP ${ghRes.status})`,
            details: ghData.errors,
          }),
          { status: ghRes.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({
          ok: true,
          issueUrl: ghData.html_url,
          issueNumber: ghData.number,
          message: 'Issue successfully dispatched to GitHub.',
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } catch (err) {
      return new Response(
        JSON.stringify({
          ok: false,
          message: 'Internal server error while contacting GitHub API: ' + String(err),
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  },
};

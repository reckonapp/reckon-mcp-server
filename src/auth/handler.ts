// ============================================================================
// Reckon MCP Server — OAuth authorize flow (login + consent)
// ============================================================================
//
// Used as defaultHandler by OAuthProvider. Handles GET/POST /authorize:
// - GET: render login form + consent (client_name, permissions, Allow/Deny)
// - POST: validate credentials, get-or-create API key,
//         complete authorization and redirect with auth code.
//
// env.OAUTH_PROVIDER is injected by @cloudflare/workers-oauth-provider.
//

import type { AuthRequest, ClientInfo, CompleteAuthorizationOptions, OAuthHelpers } from "@cloudflare/workers-oauth-provider";

/** Env when running as OAuthProvider defaultHandler (OAUTH_PROVIDER injected by the library). */
export type OAuthHandlerEnv = Env & { OAUTH_PROVIDER: OAuthHelpers };

const SCOPES_DISPLAY: string[] = ["Verify email addresses (consumes credits)", "Check credit balance"];
const OAUTH_KEY_NOTE =
  "This will create a dedicated API key in your account for usage tracking. You can pause or delete it anytime in API Keys.";

/** Official Reckon logotype (orange outline). */
const RECKON_LOGO_URL = "https://app.reckonapp.io/_next/static/media/logotype-outline-orange.84e80412.svg";

const SUPPORT_URL = "https://support.reckonapp.io";

/**
 * Renders the login + consent HTML page.
 */
function renderLoginForm(
  authRequest: AuthRequest,
  clientInfo: ClientInfo | null,
  errorMessage?: string
): string {
  const clientName = clientInfo?.clientName ?? authRequest.clientId;
  const scopeList = SCOPES_DISPLAY.map((s) => `    <li>${escapeHtml(s)}</li>`).join("\n");

  const hiddenFields = [
    { name: "client_id", value: authRequest.clientId },
    { name: "redirect_uri", value: authRequest.redirectUri },
    { name: "scope", value: authRequest.scope.join(" ") },
    { name: "state", value: authRequest.state },
    { name: "response_type", value: authRequest.responseType },
    ...(authRequest.codeChallenge ? [{ name: "code_challenge", value: authRequest.codeChallenge }] : []),
    ...(authRequest.codeChallengeMethod ? [{ name: "code_challenge_method", value: authRequest.codeChallengeMethod }] : []),
  ];

  const hiddenInputs = hiddenFields
    .map((f) => `<input type="hidden" name="${escapeHtml((f as { name: string; value: string }).name)}" value="${escapeHtml((f as { name: string; value: string }).value)}" />`)
    .join("\n");

  const errorBlock = errorMessage
    ? `<p class="error">${escapeHtml(errorMessage)}</p>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Sign in — Reckon</title>
  <link rel="icon" href="/favicon/icon.svg" type="image/svg+xml" />
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: system-ui, -apple-system, sans-serif;
      margin: 0;
      min-height: 100vh;
      background: #000;
      color: #fff;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 2rem 1rem;
    }
    .card {
      width: 100%;
      max-width: 380px;
      text-align: center;
    }
    .logo {
      margin-bottom: 1.5rem;
    }
    .logo svg {
      width: 48px;
      height: 48px;
    }
    h1 {
      font-size: 1.5rem;
      font-weight: 700;
      margin: 0 0 0.5rem;
      color: #fff;
    }
    .subtitle {
      font-size: 0.9375rem;
      color: #a3a3a3;
      margin-bottom: 1rem;
      line-height: 1.4;
    }
    .subtitle strong { color: #fff; }
    ul {
      list-style: none;
      padding: 0;
      margin: 0 0 1rem;
      font-size: 0.875rem;
      color: #a3a3a3;
      text-align: left;
    }
    ul li { margin-bottom: 0.25rem; padding-left: 1rem; position: relative; }
    ul li::before { content: "•"; position: absolute; left: 0; color: #f97316; }
    .note {
      font-size: 0.8125rem;
      color: #737373;
      margin-bottom: 1.5rem;
      line-height: 1.4;
    }
    .error {
      color: #f87171;
      font-size: 0.875rem;
      margin-bottom: 1rem;
    }
    form { text-align: left; }
    label {
      display: block;
      font-size: 0.875rem;
      font-weight: 500;
      color: #fff;
      margin-top: 1rem;
    }
    label:first-of-type { margin-top: 0; }
    input[type="email"],
    input[type="password"] {
      width: 100%;
      padding: 0.625rem 0.75rem;
      margin-top: 0.25rem;
      font-size: 1rem;
      background: #0a0a0a;
      border: 1px solid #404040;
      border-radius: 6px;
      color: #fff;
    }
    input::placeholder { color: #737373; font-style: italic; }
    input:focus {
      outline: none;
      border-color: #f97316;
    }
    .buttons {
      display: flex;
      gap: 0.75rem;
      margin-top: 1.25rem;
    }
    button {
      flex: 1;
      padding: 0.625rem 1rem;
      font-size: 0.9375rem;
      font-weight: 600;
      border-radius: 6px;
      cursor: pointer;
      border: none;
    }
    button[type="submit"][name="action"][value="allow"] {
      background: #e5e5e5;
      color: #171717;
    }
    button[name="action"][value="deny"] {
      background: transparent;
      color: #a3a3a3;
      border: 1px solid #404040;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="logo"><img src="${RECKON_LOGO_URL}" alt="Reckon" width="48" height="48" /></div>
    <h1>Sign in to Reckon</h1>
    <p class="subtitle"><strong>${escapeHtml(clientName)}</strong> wants to access your Reckon account:</p>
    <ul>
${scopeList}
    </ul>
    <p class="note">${escapeHtml(OAUTH_KEY_NOTE)}</p>
    ${errorBlock}
    <form method="post" action="/authorize">
      ${hiddenInputs}
      <label for="email">Email address</label>
      <input id="email" type="email" name="email" required autocomplete="email" placeholder="Enter your email" />
      <label for="password">Password</label>
      <input id="password" type="password" name="password" required autocomplete="current-password" placeholder="Enter your password" />
      <div class="buttons">
        <button type="submit" name="action" value="allow">Allow</button>
        <button type="submit" name="action" value="deny">Deny</button>
      </div>
    </form>
  </div>
</body>
</html>`;
}

/**
 * Renders the post-consent success page (same layout as login).
 * Auto-redirects to redirectTo after 3s; user can click Continue to go immediately.
 */
function renderSuccessPage(redirectTo: string): string {
  const safeRedirect = escapeHtml(redirectTo);
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta http-equiv="refresh" content="3;url=${safeRedirect}" />
  <title>Connected — Reckon</title>
  <link rel="icon" href="/favicon/icon.svg" type="image/svg+xml" />
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: system-ui, -apple-system, sans-serif;
      margin: 0;
      min-height: 100vh;
      background: #000;
      color: #fff;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 2rem 1rem;
    }
    .card {
      width: 100%;
      max-width: 380px;
      text-align: center;
    }
    .logo {
      margin-bottom: 1.5rem;
    }
    .logo svg, .logo img {
      width: 48px;
      height: 48px;
    }
    h1 {
      font-size: 1.5rem;
      font-weight: 700;
      margin: 0 0 0.5rem;
      color: #fff;
    }
    .subtitle {
      font-size: 0.9375rem;
      color: #a3a3a3;
      margin-bottom: 1.25rem;
      line-height: 1.4;
    }
    .links {
      gap: 0.75rem 1rem;
      justify-content: center;
      margin-bottom: 1.5rem;
      font-size: 0.875rem;
    }
    .links a {
      color: #f97316;
      text-decoration: underline;
      display: inline;
    }
    .continue {
      display: inline-block;
      padding: 0.625rem 1.25rem;
      font-size: 0.9375rem;
      font-weight: 600;
      background: #f97316;
      color: #171717;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      text-decoration: none;
    }
    .continue:hover { opacity: 0.95; }
    .footer {
      margin-top: 1rem;
      font-size: 0.8125rem;
      color: #737373;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="logo"><img src="${RECKON_LOGO_URL}" alt="Reckon" width="48" height="48" /></div>
    <h1>Reckon is connected and ready</h1>
    <p class="subtitle">You can close this tab or use the button below to return to your app.</p>
    <p class="links">If you need Support, don't hesitate to <a class="links" href="${escapeHtml(SUPPORT_URL)}">reach out</a>.</p>
    <p class="footer">Redirecting in 3 seconds…</p>
  </div>
</body>
</html>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Build AuthRequest from POST form data (same shape as parseAuthRequest).
 */
function authRequestFromForm(form: URLSearchParams): AuthRequest {
  const scope = form.get("scope")?.trim().split(/\s+/).filter(Boolean) ?? [];
  return {
    responseType: form.get("response_type") ?? "code",
    clientId: form.get("client_id") ?? "",
    redirectUri: form.get("redirect_uri") ?? "",
    scope,
    state: form.get("state") ?? "",
    codeChallenge: form.get("code_challenge") ?? undefined,
    codeChallengeMethod: form.get("code_challenge_method") ?? undefined,
  };
}

/**
 * Validate credentials with the auth provider and return the user id.
 */
async function authSignIn(email: string, password: string, env: Env): Promise<string> {
  const url = env.AUTH_URL;
  const key = env.AUTH_PUBLISHABLE_KEY;
  if (!url || !key) {
    throw new Error("Authentication service is not configured.");
  }

  const res = await fetch(`${url.replace(/\/$/, "")}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Apikey: key,
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error_description?: string; message?: string };
    const msg = body?.error_description ?? body?.message;
    throw new Error(msg || "Invalid email or password.");
  }

  const data = (await res.json()) as { user?: { id?: string } };
  const userId = data?.user?.id;
  if (!userId) {
    throw new Error("Authentication failed. Please try again.");
  }
  return userId;
}

/**
 * Get or create a dedicated API key for this OAuth client.
 */
async function getOrCreateOAuthKey(
  userId: string,
  clientName: string,
  env: Env
): Promise<{ apiKey: string; keyId: number; accountId: number }> {
  const base = env.RECKON_API_BASE_URL?.replace(/\/$/, "");
  const secret = env.MCP_METRICS_SECRET;
  if (!base || !secret) {
    throw new Error("Required service configuration is missing.");
  }

  const res = await fetch(`${base}/internal/oauth-key`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Internal-Secret": secret,
    },
    body: JSON.stringify({ user_id: userId, client_name: clientName }),
  });

  if (!res.ok) {
    if (res.status === 404) {
      throw new Error("No Reckon account found for this user.");
    }
    const text = await res.text();
    console.error("OAuth key provisioning failed:", res.status, text);
    throw new Error("Failed to provision API credentials. Please try again.");
  }

  const data = (await res.json()) as { api_key: string; key_id: number; account_id: number };
  return {
    apiKey: data.api_key,
    keyId: data.key_id,
    accountId: data.account_id,
  };
}

/**
 * OAuth defaultHandler: GET/POST /authorize (login + consent).
 * Other paths can be handled here too (e.g. health, well-known) when running under OAuthProvider.
 */
export async function handleAuthorize(
  request: Request,
  env: OAuthHandlerEnv,
  _ctx: ExecutionContext
): Promise<Response> {
  const url = new URL(request.url);
  if (url.pathname !== "/authorize") {
    return new Response("Not Found", { status: 404 });
  }

  const oauth = env.OAUTH_PROVIDER;

  if (request.method === "GET") {
    let authRequest: AuthRequest;
    try {
      authRequest = await oauth.parseAuthRequest(request);
    } catch (e) {
      console.error("parseAuthRequest failed:", e instanceof Error ? e.message : e);
      return new Response("Invalid authorization request.", { status: 400 });
    }

    const clientInfo = await oauth.lookupClient(authRequest.clientId);
    const html = renderLoginForm(authRequest, clientInfo);
    return new Response(html, {
      status: 200,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  if (request.method === "POST") {
    const contentType = request.headers.get("Content-Type") ?? "";
    if (!contentType.includes("application/x-www-form-urlencoded")) {
      return new Response("Bad Request", { status: 400 });
    }

    const body = await request.text();
    const form = new URLSearchParams(body);
    const action = form.get("action");

    const authRequest = authRequestFromForm(form);
    if (!authRequest.clientId || !authRequest.redirectUri) {
      return new Response("Missing OAuth parameters.", { status: 400 });
    }

    const redirectWithError = (error: string): Response => {
      const u = new URL(authRequest.redirectUri);
      u.searchParams.set("error", error);
      u.searchParams.set("state", authRequest.state);
      return Response.redirect(u.toString(), 302);
    };

    if (action === "deny") {
      return redirectWithError("access_denied");
    }

    if (action !== "allow") {
      const clientInfo = await oauth.lookupClient(authRequest.clientId);
      const html = renderLoginForm(authRequest, clientInfo, "Please choose Allow or Deny.");
      return new Response(html, {
        status: 200,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }

    const email = form.get("email")?.trim();
    const password = form.get("password");
    if (!email || !password) {
      const clientInfo = await oauth.lookupClient(authRequest.clientId);
      const html = renderLoginForm(authRequest, clientInfo, "Email and password are required.");
      return new Response(html, {
        status: 200,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }

    let userId: string;
    try {
      userId = await authSignIn(email, password, env);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Login failed.";
      const clientInfo = await oauth.lookupClient(authRequest.clientId);
      const html = renderLoginForm(authRequest, clientInfo, msg);
      return new Response(html, {
        status: 200,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }

    const clientInfo = await oauth.lookupClient(authRequest.clientId);
    const clientName = clientInfo?.clientName ?? authRequest.clientId;

    let keyResult: { apiKey: string; keyId: number; accountId: number };
    try {
      keyResult = await getOrCreateOAuthKey(userId, clientName, env);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Could not get API key.";
      const html = renderLoginForm(authRequest, clientInfo, msg);
      return new Response(html, {
        status: 200,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }

    const options: CompleteAuthorizationOptions = {
      request: authRequest,
      userId,
      metadata: {},
      scope: authRequest.scope.length > 0 ? authRequest.scope : ["verify", "credits"],
      props: {
        apiKey: keyResult.apiKey,
        keyId: keyResult.keyId,
        accountId: keyResult.accountId,
      },
    };

    const { redirectTo } = await oauth.completeAuthorization(options);
    const html = renderSuccessPage(redirectTo);
    return new Response(html, {
      status: 200,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  return new Response("Method Not Allowed", { status: 405 });
}

/**
 * Exported defaultHandler object for OAuthProvider.
 * Use: defaultHandler: reckonAuthHandler
 */
export const reckonAuthHandler = {
  fetch: handleAuthorize,
};

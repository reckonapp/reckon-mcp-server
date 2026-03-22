// ============================================================================
// Reckon MCP Server — Worker Entrypoint
// ============================================================================
//
// Top-level: /health, /.well-known/*, and /mcp|/sse with X-API-Key are
// handled before OAuthProvider. Everything else (including /mcp|/sse with
// Bearer) goes to OAuthProvider (authorize, token, register, and MCP with
// validated token).
//
// Routes:
//   GET /health                          → Health check (no auth)
//   GET /.well-known/openai-apps-challenge → OpenAI app verification token (no auth)
//   GET /.well-known/oauth-authorization-server → RFC 8414 AS metadata (no auth)
//   GET /.well-known/oauth-protected-resource   → RFC 9728 metadata (no auth)
//   POST/GET /mcp, /sse, /sse/messages   → MCP transport (X-API-Key or Bearer)
//   /authorize, /token, /register, /.well-known/oauth-authorization-server → OAuthProvider
//   *                                    → 404 or OAuthProvider defaultHandler

import { OAuthProvider } from "@cloudflare/workers-oauth-provider";
import { createMcpHandler } from "agents/mcp";
import { FAVICON_ICON_SVG } from "./assets/favicon-icon.js";
import { reckonAuthHandler } from "./auth/handler.js";
import { mcpRouter } from "./mcp-router.js";
import { createServer } from "./server.js";
import { validateOrigin } from "./origin.js";

const corsOptions = {
  allowOrigin: "*",
  allowMethods: "GET, POST, OPTIONS, DELETE",
  allowHeaders: "Content-Type, X-API-Key, X-Access-Token, Mcp-Session-Id, Authorization",
  exposeHeaders: "Mcp-Session-Id",
};

/** RFC 9728 Protected Resource Metadata — served without auth so clients can discover the AS. */
function protectedResourceMetadata(origin: string) {
  return {
    resource: `${origin}/mcp`,
    authorization_servers: [origin],
    scopes_supported: ["verify", "credits"],
    bearer_methods_supported: ["header"],
  };
}

const oauthProviderOptions = {
  apiRoute: ["/mcp", "/sse", "/sse/messages"],
  apiHandler: mcpRouter as any,
  defaultHandler: reckonAuthHandler as any,
  authorizeEndpoint: "/authorize",
  tokenEndpoint: "/token",
  clientRegistrationEndpoint: "/register",
  scopesSupported: ["verify", "credits"],
};

const oauthProvider = new OAuthProvider(oauthProviderOptions);

function forbidden(): Response {
  return new Response(JSON.stringify({ error: "Forbidden", message: "Origin not allowed" }), {
    status: 403,
    headers: { "Content-Type": "application/json" },
  });
}

function jsonResponse(body: object, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const start = Date.now();

    if (!validateOrigin(request, env)) {
      console.log(request.method, url.pathname, 403, `${Date.now() - start}ms`);
      return forbidden();
    }

    // ── Health check (no auth) ─────────────────────────────────────────
    if (url.pathname === "/health") {
      const res = jsonResponse({ status: "ok", version: "1.0.0" });
      console.log(request.method, url.pathname, 200, `${Date.now() - start}ms`);
      return res;
    }

    // ── OpenAI Apps verification (no auth) ───────────────────────────────
    if (url.pathname === "/.well-known/openai-apps-challenge" && request.method === "GET") {
      const token = env.OPENAI_APPS_VERIFICATION_TOKEN;
      if (!token) {
        console.log(request.method, url.pathname, 404, `${Date.now() - start}ms`);
        return new Response("Verification token not configured", { status: 404 });
      }
      const res = new Response(token, {
        headers: { "Content-Type": "text/plain" },
      });
      console.log(request.method, url.pathname, 200, `${Date.now() - start}ms`);
      return res;
    }

    // ── OAuth Authorization Server discovery — RFC 8414 (no auth) ───────
    // If @cloudflare/workers-oauth-provider doesn't serve this, we do.
    if (url.pathname === "/.well-known/oauth-authorization-server" && request.method === "GET") {
      const issuer = new URL(request.url).origin;
      const discovery = {
        issuer,
        authorization_endpoint: `${issuer}/authorize`,
        token_endpoint: `${issuer}/token`,
        registration_endpoint: `${issuer}/register`,
        scopes_supported: ["verify", "credits"],
        code_challenge_methods_supported: ["S256"],
        response_types_supported: ["code"],
      };
      const res = jsonResponse(discovery);
      console.log(request.method, url.pathname, 200, `${Date.now() - start}ms`);
      return res;
    }

    // ── Favicon (from static/favicon) ─────────────────────────────────────
    if (url.pathname === "/favicon/icon.svg" && request.method === "GET") {
      return new Response(FAVICON_ICON_SVG, {
        headers: { "Content-Type": "image/svg+xml", "Cache-Control": "public, max-age=86400" },
      });
    }

    // ── Protected Resource Metadata — before OAuthProvider ─────
    if (url.pathname === "/.well-known/oauth-protected-resource") {
      const origin = new URL(request.url).origin;
      const res = jsonResponse(protectedResourceMetadata(origin));
      console.log(request.method, url.pathname, 200, `${Date.now() - start}ms`);
      return res;
    }

    // ── MCP with X-API-Key (backward compat) — bypass OAuthProvider ─────
    const isMcpPath = url.pathname === "/mcp" || url.pathname === "/sse" || url.pathname === "/sse/messages";
    if (isMcpPath && request.headers.has("x-api-key")) {
      const server = createServer(request, env, ctx);
      const route = url.pathname === "/mcp" ? "/mcp" : url.pathname;
      const mcpHandler = createMcpHandler(server, { route, corsOptions });
      const res = await mcpHandler(request, env, ctx);
      console.log(request.method, url.pathname, res.status, `${Date.now() - start}ms`);
      return res;
    }

    // ── Normalize OAuth token for MCP: accept token from header or query when Authorization missing ─────
    let requestForOAuth = request;
    if (isMcpPath && !request.headers.has("Authorization")) {
      const token =
        request.headers.get("X-Access-Token")?.trim() ||
        url.searchParams.get("access_token")?.trim();
      if (token) {
        const headers = new Headers(request.headers);
        headers.set("Authorization", `Bearer ${token}`);
        // Remove access_token from URL before forwarding so it isn't logged or leaked
        const safeUrl = url.searchParams.has("access_token")
          ? (() => {
              const u = new URL(request.url);
              u.searchParams.delete("access_token");
              return u.toString();
            })()
          : request.url;
        requestForOAuth = new Request(safeUrl, {
          method: request.method,
          headers,
          body: request.body,
          duplex: "half",
        });
      }
    }

    // ── OAuthProvider (authorize, token, register, MCP with Bearer) ─────
    const res = await oauthProvider.fetch(requestForOAuth, env, ctx);
    console.log(request.method, url.pathname, res.status, `${Date.now() - start}ms`);
    return res;
  },
} satisfies ExportedHandler<Env>;

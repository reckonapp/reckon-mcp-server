// ============================================================================
// Reckon MCP Server — MCP API handler for OAuth-authenticated requests
// ============================================================================
//
// Used as OAuthProvider.apiHandler. Only receives requests that have a valid
// Bearer token; ctx.props holds { apiKey, keyId, accountId } from the auth flow.
// Passes oauthProps to createServer so tools use the key from props (no header).
//

import { createMcpHandler } from "agents/mcp";
import { createServer } from "./server.js";
import type { OAuthProps } from "./server.js";

const corsOptions = {
  allowOrigin: "*",
  allowMethods: "GET, POST, OPTIONS, DELETE",
  allowHeaders: "Content-Type, X-API-Key, Mcp-Session-Id, Authorization",
  exposeHeaders: "Mcp-Session-Id",
};

/**
 * OAuth props from workers-oauth-provider (ctx.props after Bearer validation).
 */
interface OAuthCtxProps {
  apiKey?: string;
  keyId?: number;
  accountId?: number;
}

/**
 * MCP API handler for requests that passed OAuth Bearer validation.
 * Builds the MCP server with oauthProps so tools use the key from the token.
 */
export async function handleMcpRequest(
  request: Request,
  env: Env,
  ctx: ExecutionContext & { props?: OAuthCtxProps }
): Promise<Response> {
  const url = new URL(request.url);
  const route = url.pathname === "/sse" || url.pathname === "/sse/messages" ? url.pathname : "/mcp";
  const oauthProps: OAuthProps = ctx.props?.apiKey
    ? { apiKey: ctx.props.apiKey, keyId: ctx.props.keyId, accountId: ctx.props.accountId }
    : undefined;
  const server = createServer(request, env, ctx, oauthProps);
  const mcpHandler = createMcpHandler(server, { route, corsOptions });
  return mcpHandler(request, env, ctx);
}

export const mcpRouter = {
  fetch: handleMcpRequest,
};

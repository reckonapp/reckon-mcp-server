// ============================================================================
// Reckon MCP Server — MCP Server Setup
// ============================================================================

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { handleVerifyEmail } from "./tools/verify-email.js";
import { handleCheckCredits } from "./tools/check-credits.js";
import { VERIFY_EMAIL_DESCRIPTION } from "./tools/verify-email.js";
import { CHECK_CREDITS_DESCRIPTION } from "./tools/check-credits.js";

/** OAuth props from workers-oauth-provider (apiKey for downstream calls). */
export type OAuthProps = { apiKey: string; keyId?: number; accountId?: number } | undefined;

/**
 * Creates a configured MCP server with Reckon's tools registered.
 * A new server instance is created per request (required by MCP SDK 1.26+).
 * When oauthProps is set (Bearer auth), tools use it; otherwise they use X-API-Key.
 */
export function createServer(
  request: Request,
  env: Env,
  ctx: ExecutionContext,
  oauthProps?: OAuthProps
): McpServer {
  const server = new McpServer({
    name: "reckon",
    version: "1.0.0",
  });

  server.tool(
    "verify_email",
    VERIFY_EMAIL_DESCRIPTION,
    { email: z.string().email().describe("The email address to verify") },
    { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
    (args) => handleVerifyEmail(request, env, ctx, args, oauthProps)
  );

  server.tool(
    "check_credits",
    CHECK_CREDITS_DESCRIPTION,
    {},
    { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    () => handleCheckCredits(request, env, ctx, oauthProps)
  );

  return server;
}

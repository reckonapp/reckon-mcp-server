// ============================================================================
// Reckon MCP Server — check_credits tool
// ============================================================================

import { z } from "zod";
import type { OAuthProps } from "../server.js";
import { extractApiKey } from "../auth.js";
import { mapApiError } from "../errors.js";
import { logToolCall } from "../logging.js";
import { pushMetrics } from "../metrics.js";
import { checkCreditsOutputSchema } from "../tool-output-schemas.js";

export const CHECK_CREDITS_DESCRIPTION =
  "Check the remaining email verification credit balance for the connected Reckon account.";

export async function handleCheckCredits(
  request: Request,
  env: Env,
  ctx: ExecutionContext,
  oauthProps?: OAuthProps
): Promise<{
  content: Array<{ type: "text"; text: string }>;
  structuredContent: z.infer<typeof checkCreditsOutputSchema>;
}> {
  const start = Date.now();
  let keyType: "pk" | "sk" = "pk";
  let authSource: "oauth" | "api-key" = "api-key";

  let apiKey: string;
  try {
    const info = extractApiKey(request, oauthProps);
    apiKey = info.key;
    keyType = info.keyType;
    authSource = info.authSource;
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Invalid or missing API key.";
    const durationMs = Date.now() - start;
    ctx.waitUntil(
      pushMetrics(
        { tool: "check_credits", status: "error", duration_ms: durationMs, error_code: 401, key_type: "pk" },
        env
      )
    );
    logToolCall({
      level: "error",
      tool: "check_credits",
      status: "error",
      duration_ms: durationMs,
      key_type: "pk",
      error_code: 401,
      message: msg,
    });
    throw new Error(msg);
  }

  const res = await fetch(`${env.RECKON_API_BASE_URL}/api/v1/credits/balance`, {
    method: "GET",
    headers: {
      "X-API-Key": apiKey,
      "X-Source": "mcp",
    },
  });

  const durationMs = Date.now() - start;

  if (!res.ok) {
    const retryAfter = res.headers.get("Retry-After");
    const mapped = mapApiError(res.status, retryAfter, authSource);
    ctx.waitUntil(
      pushMetrics(
        { tool: "check_credits", status: "error", duration_ms: durationMs, error_code: res.status, key_type: keyType },
        env
      )
    );
    logToolCall({
      level: "error",
      tool: "check_credits",
      status: "error",
      duration_ms: durationMs,
      key_type: keyType,
      error_code: res.status,
      message: mapped.message,
    });
    throw new Error(mapped.message);
  }

  const raw = await res.json();
  const structuredContent = checkCreditsOutputSchema.parse(raw);
  ctx.waitUntil(
    pushMetrics(
      { tool: "check_credits", status: "success", duration_ms: durationMs, key_type: keyType },
      env
    )
  );
  logToolCall({
    level: "info",
    tool: "check_credits",
    status: "success",
    duration_ms: durationMs,
    key_type: keyType,
  });

  return {
    content: [{ type: "text" as const, text: JSON.stringify(structuredContent) }],
    structuredContent,
  };
}

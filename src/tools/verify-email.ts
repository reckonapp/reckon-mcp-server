// ============================================================================
// Reckon MCP Server — verify_email tool
// ============================================================================

import { z } from "zod";
import type { OAuthProps } from "../server.js";
import { extractApiKey } from "../auth.js";
import { mapApiError } from "../errors.js";
import { logToolCall } from "../logging.js";
import { pushMetrics } from "../metrics.js";
import { verifyEmailOutputSchema } from "../tool-output-schemas.js";

export const VERIFY_EMAIL_DESCRIPTION =
  "Verify an email address. Returns deliverability status, format validity, domain info, and risk flags (disposable, role-based, accept-all, mailbox full, plus addressing). Each call consumes one credit.";

export async function handleVerifyEmail(
  request: Request,
  env: Env,
  ctx: ExecutionContext,
  args: { email: string },
  oauthProps?: OAuthProps
): Promise<{
  content: Array<{ type: "text"; text: string }>;
  structuredContent: z.infer<typeof verifyEmailOutputSchema>;
}> {
  const start = Date.now();
  let apiKey: string;
  let keyType: "pk" | "sk" = "pk";
  let authSource: "oauth" | "api-key" = "api-key";

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
        { tool: "verify_email", status: "error", duration_ms: durationMs, error_code: 401, key_type: "pk" },
        env
      )
    );
    logToolCall({
      level: "error",
      tool: "verify_email",
      status: "error",
      duration_ms: durationMs,
      key_type: "pk",
      error_code: 401,
      message: msg,
    });
    throw new Error(msg);
  }

  const res = await fetch(`${env.RECKON_API_BASE_URL}/api/v1/verify/single`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": apiKey,
      "X-Source": "mcp",
    },
    body: JSON.stringify({ email: args.email }),
  });

  const durationMs = Date.now() - start;
  const retryAfter = res.headers.get("Retry-After");

  if (!res.ok) {
    const mapped = mapApiError(res.status, retryAfter, authSource);
    ctx.waitUntil(
      pushMetrics(
        { tool: "verify_email", status: "error", duration_ms: durationMs, error_code: res.status, key_type: keyType },
        env
      )
    );
    let errMessage = mapped.message;
    if (mapped.httpStatus) errMessage += ` [HTTP ${mapped.httpStatus}]`;
    logToolCall({
      level: "error",
      tool: "verify_email",
      status: "error",
      duration_ms: durationMs,
      key_type: keyType,
      error_code: res.status,
      message: errMessage,
    });
    throw new Error(errMessage);
  }

  const raw = await res.json();
  const structuredContent = verifyEmailOutputSchema.parse(raw);
  ctx.waitUntil(
    pushMetrics(
      { tool: "verify_email", status: "success", duration_ms: durationMs, key_type: keyType },
      env
    )
  );
  logToolCall({
    level: "info",
    tool: "verify_email",
    status: "success",
    duration_ms: durationMs,
    key_type: keyType,
  });

  return {
    content: [{ type: "text" as const, text: JSON.stringify(structuredContent) }],
    structuredContent,
  };
}

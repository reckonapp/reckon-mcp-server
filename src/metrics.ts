// ============================================================================
// Reckon MCP Server — Metrics Push
// ============================================================================

import type { McpMetricEvent } from "./types.js";

/**
 * Fire-and-forget push of anonymous usage metrics (tool name, success/error,
 * latency) to the Reckon API. No user data or request content is included.
 * Never blocks the tool response. Swallows all errors.
 *
 * Use with ctx.waitUntil() to ensure the push completes after response is sent.
 */
export async function pushMetrics(event: McpMetricEvent, env: Env): Promise<void> {
  try {
    await fetch(`${env.RECKON_API_BASE_URL}/internal/metrics/mcp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Internal-Secret": env.MCP_METRICS_SECRET,
      },
      body: JSON.stringify(event),
    });
  } catch {
    // Swallow — metrics loss is acceptable, tool response is not
  }
}

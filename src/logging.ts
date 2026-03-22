// ============================================================================
// Reckon MCP Server — Structured Logging
// ============================================================================
//
// JSON-structured logs for tool calls. Visible via wrangler tail and
// Cloudflare dashboard.

import type { KeyType } from "./types.js";

export interface ToolLogEntry {
  level: "info" | "error";
  tool: string;
  status: "success" | "error";
  duration_ms: number;
  key_type: KeyType;
  timestamp: string;
  error_code?: number;
  message?: string;
}

/**
 * Log a tool call outcome as a single JSON line.
 * Use level "error" for failed tool calls (auth failure, API error).
 */
export function logToolCall(entry: Omit<ToolLogEntry, "timestamp">): void {
  const line: ToolLogEntry = {
    ...entry,
    timestamp: new Date().toISOString(),
  };
  const out = JSON.stringify(line);
  if (entry.level === "error") {
    console.error(out);
  } else {
    console.log(out);
  }
}

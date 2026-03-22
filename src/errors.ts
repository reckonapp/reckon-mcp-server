// ============================================================================
// Reckon MCP Server — Error Mapping
// ============================================================================

import type { AuthSource } from "./types.js";

/**
 * Maps Reckon API HTTP status codes to structured error info.
 * These will be returned as MCP tool error content.
 */
export interface MappedError {
  message: string;
  httpStatus: number;
  retryAfter?: number;
}

export const OAUTH_KEY_DEACTIVATED_MESSAGE =
  "Your Reckon API key for this integration has been deactivated or deleted.\n\n" +
  "To restore access:\n" +
  "1. Go to https://app.reckonapp.io → API Keys\n" +
  "2. Either reactivate the key for this integration, or\n" +
  "3. Disconnect and reconnect this MCP integration to create a new key\n\n" +
  "Need help? support@reckonapp.io";

export function mapApiError(
  status: number,
  retryAfterHeader?: string | null,
  authSource?: AuthSource
): MappedError {
  const base: MappedError = { httpStatus: status, message: "" };

  switch (status) {
    case 400:
      base.message = "Invalid request parameters";
      break;
    case 401:
      base.message =
        authSource === "oauth" ? OAUTH_KEY_DEACTIVATED_MESSAGE : "Invalid or missing API key. Get yours at https://app.reckonapp.io";
      break;
    case 402:
      base.message = "Insufficient credits. Visit https://app.reckonapp.io to add credits to your account.";
      break;
    case 429:
      base.message = "Rate limit exceeded.";
      if (retryAfterHeader) {
        base.retryAfter = parseInt(retryAfterHeader, 10);
      }
      break;
    default:
      if (status >= 500) {
        base.message = `Internal server error (${status}). Please try again.`;
      } else {
        base.message = `Request failed (${status}). Please try again.`;
      }
      break;
  }

  return base;
}

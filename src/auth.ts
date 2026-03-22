// ============================================================================
// Reckon MCP Server — API Key Authentication
// ============================================================================

import type { ApiKeyInfo, KeyType } from "./types.js";

function parseKey(key: string): { key: string; keyType: KeyType } {
  let keyType: KeyType;
  if (key.startsWith("pk_")) {
    keyType = "pk";
  } else if (key.startsWith("sk_")) {
    keyType = "sk";
  } else {
    throw new Error("Invalid API key format. Key must start with 'pk_' or 'sk_'. Get yours at https://app.reckonapp.io");
  }
  return { key, keyType };
}

/**
 * Extract and validate the Reckon API key from OAuth props or request headers.
 * No fallback: OAuth requests use props only; API-key requests use header only.
 *
 * Returns the key, type, and authSource for metrics and error messaging.
 * Throws if missing or invalid format.
 */
export function extractApiKey(request: Request, oauthProps?: { apiKey: string }): ApiKeyInfo {
  if (oauthProps?.apiKey) {
    const { key, keyType } = parseKey(oauthProps.apiKey);
    return { key, keyType, authSource: "oauth" };
  }
  const key = request.headers.get("x-api-key");
  if (!key) {
    throw new Error(
      "Authentication required. Use OAuth or set the X-API-Key header. " +
        "Get a key at https://app.reckonapp.io"
    );
  }
  const { key: k, keyType } = parseKey(key);
  return { key: k, keyType, authSource: "api-key" };
}

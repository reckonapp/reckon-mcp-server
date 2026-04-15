// ============================================================================
// Reckon MCP Server — Types
// ============================================================================

/** API key types supported by Reckon */
export type KeyType = "pk" | "sk";

/** How the API key was obtained (for error messaging) */
export type AuthSource = "oauth" | "api-key";

/** Extracted API key with its type and source */
export interface ApiKeyInfo {
  key: string;
  keyType: KeyType;
  authSource: AuthSource;
}

/** Reckon email verification response */
export interface VerifyEmailResponse {
  email_address: string;
  status: string;
  status_meta: {
    valid_format: boolean;
    domain_exists: boolean;
    accept_all: boolean;
    disposable: boolean;
    role_based: boolean;
    mailbox_full: boolean;
    plus_address: boolean;
  };
  domain_meta: {
    domain: string;
    mailbox_provider: string;
  };
  errors: Record<string, unknown>;
  performed_at: string;
  performed_in_ms: number;
  requestId: string;
}

/** Reckon credit balance response */
export interface CreditBalanceResponse {
  credits: number;
  [key: string]: unknown;
}

/** Metric event pushed to Reckon. */
export interface McpMetricEvent {
  tool: string;
  status: "success" | "error";
  duration_ms: number;
  error_code?: number;
  key_type: KeyType;
}

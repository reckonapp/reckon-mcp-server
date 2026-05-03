// ============================================================================
// Reckon MCP Server — MCP tool annotations (shared by live tools + server card)
// ============================================================================

/** Annotations for verify_email — consumes a credit; not idempotent. */
export const verifyEmailToolAnnotations = {
  readOnlyHint: false,
  destructiveHint: false,
  idempotentHint: false,
  openWorldHint: true,
} as const;

/** Annotations for check_credits — read-only balance lookup. */
export const checkCreditsToolAnnotations = {
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: false,
} as const;

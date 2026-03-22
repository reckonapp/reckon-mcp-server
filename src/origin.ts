// ============================================================================
// Reckon MCP Server — Origin Validation
// ============================================================================
//
// Validates the Origin header against ALLOWED_ORIGINS for CORS / DNS rebinding.
// Default: allow all origins (ALLOWED_ORIGINS=* or unset).

/**
 * Returns true if the request's Origin header is allowed.
 * If ALLOWED_ORIGINS is unset or "*", allows any origin.
 * Otherwise expects a comma-separated list of origins (e.g. "https://app.reckonapp.io,https://claude.ai").
 */
export function validateOrigin(request: Request, env: Env): boolean {
  const allowed = env.ALLOWED_ORIGINS?.trim();
  if (!allowed || allowed === "*") return true;

  const origin = request.headers.get("Origin");
  if (!origin) return true; // No origin sent — allow (e.g. same-origin or non-browser)

  const list = allowed.split(",").map((o) => o.trim().toLowerCase());
  return list.includes(origin.toLowerCase());
}

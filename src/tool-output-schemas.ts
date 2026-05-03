// ============================================================================
// Reckon MCP Server — tool output schemas (Zod + JSON Schema for server card)
// ============================================================================

import { normalizeObjectSchema } from "@modelcontextprotocol/sdk/server/zod-compat.js";
import { toJsonSchemaCompat } from "@modelcontextprotocol/sdk/server/zod-json-schema-compat.js";
import { z } from "zod";

const verifyEmailStatusMetaSchema = z.object({
  valid_format: z.boolean(),
  domain_exists: z.boolean(),
  accept_all: z.boolean(),
  disposable: z.boolean(),
  role_based: z.boolean(),
  mailbox_full: z.boolean(),
  plus_address: z.boolean(),
});

const verifyEmailDomainMetaSchema = z.object({
  domain: z.string(),
  mailbox_provider: z.string(),
});

/** Shape of the upstream single-verify JSON body returned to MCP clients. */
export const verifyEmailOutputSchema = z
  .object({
    email_address: z.string(),
    status: z.string(),
    status_meta: verifyEmailStatusMetaSchema,
    domain_meta: verifyEmailDomainMetaSchema,
    errors: z.record(z.string(), z.unknown()),
    performed_at: z.string(),
    performed_in_ms: z.number(),
    requestId: z.string(),
  })
  .passthrough();

/** Shape of the upstream credits balance JSON body returned to MCP clients. */
export const checkCreditsOutputSchema = z
  .object({
    credits: z.number(),
  })
  .passthrough();

const verifyNorm = normalizeObjectSchema(verifyEmailOutputSchema);
const creditsNorm = normalizeObjectSchema(checkCreditsOutputSchema);

export const verifyEmailOutputJsonSchema = verifyNorm
  ? toJsonSchemaCompat(verifyNorm, { strictUnions: true, pipeStrategy: "output" })
  : ({} as Record<string, unknown>);

export const checkCreditsOutputJsonSchema = creditsNorm
  ? toJsonSchemaCompat(creditsNorm, { strictUnions: true, pipeStrategy: "output" })
  : ({} as Record<string, unknown>);

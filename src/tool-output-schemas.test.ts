// ============================================================================
// Reckon MCP Server — tool output schema tests
// ============================================================================
//
// Response shapes below are taken verbatim from the live OpenAPI spec at
// https://api.reckonapp.io/docs/get-credit-balance-19422875e0.md and
// https://api.reckonapp.io/docs/verify-email-address-19471290e0.md

import { describe, expect, it } from "vitest";
import { checkCreditsOutputSchema, verifyEmailOutputSchema } from "./tool-output-schemas.js";

describe("checkCreditsOutputSchema", () => {
  it("parses the real GET /api/v1/credits/balance response", () => {
    const apiResponse = {
      balance: 1000,
      asOf: "2024-03-20T10:30:00Z",
      requestId: "req_123",
    };

    expect(() => checkCreditsOutputSchema.parse(apiResponse)).not.toThrow();
  });
});

describe("verifyEmailOutputSchema", () => {
  it("parses the real POST /api/v1/verify/single response", () => {
    const apiResponse = {
      email_address: "user@example.com",
      status: "valid",
      requestId: "req_123",
      status_meta: {
        valid_format: true,
        domain_exists: true,
        accept_all: false,
        disposable: false,
        role_based: false,
        mailbox_full: false,
        plus_address: false,
      },
      domain_meta: {
        domain: "example.com",
        mailbox_provider: "gmail.com",
      },
      errors: {},
      performed_at: "2024-03-20T10:30:00.000Z",
      performed_in_ms: 1234,
    };

    expect(() => verifyEmailOutputSchema.parse(apiResponse)).not.toThrow();
  });
});

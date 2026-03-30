## What is MCP?

The [Model Context Protocol (MCP)](https://modelcontextprotocol.io) lets AI assistants like Claude, ChatGPT, and Cursor call external tools over a standard API. Reckon’s MCP server exposes email verification and credit balance as MCP tools, so you can verify addresses and check credits from inside your AI workflow without leaving the chat. **Endpoint:** `https://mcp.reckonapp.io/mcp` (Streamable HTTP).

---

## Authentication

When you add the Reckon MCP server in Claude (or another client that supports OAuth), you'll be prompted to sign in with your **Reckon account** (email and password). You need a Reckon account; if you don't have one, you can [do that here](https://app.reckonapp.io/signup).

After you allow access, a dedicated **API key** is created in your Reckon account for that client so that usage can be tracked/reported per connection; you can view, pause, or revoke it anytime under [API Keys](https://app.reckonapp.io/api-keys). The client then uses that session for all tool calls (verify email, check credits) against your account. 

---

## Rate limits

Rate limits apply per account. When you exceed the limit, the server returns a rate-limit error and may include a `Retry-After` value (seconds) so clients can back off and retry.

---

## Quick setup

**Reckon MCP endpoint:** `https://mcp.reckonapp.io/mcp` (Streamable HTTP).

Add the endpoint above in your client's MCP settings. When you connect, you'll be prompted to sign in with your Reckon account; after you allow access, tools use that session.

| Client | Documentation |
|--------|----------------|
| **Claude Desktop** | [Getting started with MCP servers on Claude Desktop](https://support.anthropic.com/en/articles/10949351-getting-started-with-local-mcp-servers-on-claude-desktop) (Anthropic) |
| **Cursor** | [MCP — Cursor Docs](https://docs.cursor.com/context/mcp) |
| **ChatGPT** | [Building MCP servers for ChatGPT and API integrations](https://platform.openai.com/docs/mcp) (OpenAI) |
| **Other clients** | [Transports](https://modelcontextprotocol.io/docs/concepts/transports) (Model Context Protocol) — use Streamable HTTP |

---

## Available tools

### verify_email

Verifies an email address and returns deliverability status, format validity, domain info, and risk flags (disposable, role-based, accept-all, mailbox full, plus addressing). Each successful call consumes one credit.

**Input:**

| Field  | Type   | Required | Description                    |
|--------|--------|----------|--------------------------------|
| `email` | string | Yes      | The email address to verify.  |

**Example input:**

```json
{
  "email": "user@example.com"
}
```

**Example success response (summary of fields):**

```json
{
  "email_address": "user@example.com",
  "status": "valid",
  "status_meta": {
    "valid_format": true,
    "domain_exists": true,
    "accept_all": false,
    "disposable": false,
    "role_based": false,
    "mailbox_full": false,
    "plus_address": false
  },
  "domain_meta": {
    "domain": "example.com",
    "mailbox_provider": "example.com"
  },
  "errors": {},
  "performed_at": "2026-02-13T14:00:00.000Z",
  "performed_in_ms": 3500,
  "requestId": "..."
}
```

The MCP tool returns the full API response as JSON text content.

---

### check_credits

Returns the current email verification credit balance for the account associated with your API key. No input required.

**Input:** None (empty object).

**Example success response:**

```json
{
  "balance": 1000,
  "asOf": "2026-02-13T14:00:00Z"
}
```

The MCP tool returns the full API response as JSON text content.

---

## Examples

These examples show how the MCP server behaves when you use it from an AI assistant (e.g. Claude, ChatGPT, Cursor).

### Example 1: Verify an email address

**User prompt:**  
“Verify john@example.com” or “Is support@acme.org a valid, deliverable email?”

**What happens:**  
The assistant calls the `verify_email` tool with the given address. The server sends the request to the Reckon API and returns the result. You see the full verification response: status (e.g. `valid`, `invalid`, `unknown`), format and domain checks, and risk flags (disposable, role-based, accept-all, etc.). One credit is consumed for a successful verification.

---

### Example 2: Check credit balance

**User prompt:**  
“How many verification credits do I have?” or “What’s my Reckon credit balance?”

**What happens:**  
The assistant calls the `check_credits` tool (no input required). The server returns the current balance for the account tied to your API key. You see a short summary, e.g. “You have 1,000 credits” (from the `balance` and `asOf` fields in the response). No credits are consumed.

---

### Example 3: Verify then check credits (or handle an error)

**User prompt:**  
“Verify sales@mycompany.com and then tell me how many credits I have left.”

**What happens:**  
The assistant first calls `verify_email` with `sales@mycompany.com`. You get the deliverability and risk details for that address, and one credit is used. Then it calls `check_credits` and reports your updated balance (e.g. “Verification complete. You have 999 credits remaining.”). If you have no credits, the first call fails with “Insufficient credits” and the assistant may still call `check_credits` to confirm the balance is zero.

---

## Error handling

Errors are returned as MCP/JSON-RPC errors with messages suitable for display. Underlying HTTP status from the Reckon API is reflected as follows:

| Condition | Message / behavior |
|-----------|--------------------|
| **400** — Invalid request | “Invalid request parameters.” Check input (e.g. valid email format for `verify_email`). |
| **401** — Not authenticated | Sign in again or re-authorize the MCP server in your client. |
| **402** — Insufficient credits | “Insufficient credits.” Add credits in the Reckon dashboard. |
| **429** — Rate limit | “Rate limit exceeded.” The error may include a retry-after value; wait before retrying. |
| **5xx** — Server error | “Internal server error (status). Please try again.” Retry later or contact support if it persists. |
| **Other 4xx** | “Request failed (status). Please try again.” Check request format and parameters. |

---

## Troubleshooting

- **"Insufficient credits" (402)**  
  Your account has no credits left. Add credits at [app.reckonapp.io](https://app.reckonapp.io).

- **“Rate limit exceeded” (429)**  
  You've hit the rate limit. Wait before retrying; the error may include a suggested wait time.

- **“Internal server error” or “Request failed (404)”**  
  For 5xx, the Reckon API is temporarily failing; try again later. For 404, the request path or upstream API may have changed; check the docs or contact support.

- **OAuth: "Missing or invalid access token"**  
  The client must send `Authorization: Bearer <access_token>` on every request. If your client doesn't support the Authorization header natively, you can pass the token via the `X-Access-Token` header or the `?access_token=...` query parameter.

---

## Support

For help with the MCP server or billing:

- **Support:** [support.reckonapp.io](https://support.reckonapp.io)
- **Reckon Account:** [reckonapp.io](https://reckonapp.io)
- [Model Context Protocol](https://modelcontextprotocol.io)

---

## Privacy policy

Reckon’s privacy policy describes how we collect, use, and protect data: [reckonapp.io/privacy](https://reckonapp.io/privacy).

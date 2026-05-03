# Reckon MCP Server

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![MCP](https://img.shields.io/badge/MCP-compatible-blue)](https://modelcontextprotocol.io)

Verify email addresses in real-time directly from Claude, ChatGPT, Cursor, Windsurf, or any [MCP](https://modelcontextprotocol.io)-compatible AI client. Powered by [Reckon](https://reckonapp.io).

---

## Example

> **You:** Verify sales@acme.com
>
> **Assistant:** I verified `sales@acme.com` using the Reckon email verification tool. Here are the results:
>
> - **Status:** Valid
> - **Format:** Valid email format
> - **Domain:** acme.com exists and accepts mail
> - **Risk flags:** Role-based address (sales@), not disposable, not accept-all
>
> One credit was used for this verification. You have 4,999 credits remaining.

---

## Requirements

* A Reckon [account](https://app.reckonapp.io/signup), which comes with cost-free [sandbox email addresses](https://support.reckonapp.io/en/articles/12294568-test-email-addresses) as well as 25 credits for real-world trialing. 
* An active Reckon subscription (see [pricing](https://app.reckonapp.io/pricing))
* A credit balance higher than zero


---

## Quick setup

**Endpoint:** `https://mcp.reckonapp.io/mcp`

Our [Claude](https://support.anthropic.com/en/articles/10949351-getting-started-with-local-mcp-servers-on-claude-desktop) and [ChatGPT](https://platform.openai.com/docs/mcp) connectors are currently under review — once approved, those will be the easiest way to connect. In the meantime (and for all other MCP clients), add the endpoint in your client's MCP settings and sign in with your Reckon account when prompted.

For clients that don't support OAuth (like Cursor), use an API key instead. Add to `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "reckon": {
      "url": "https://mcp.reckonapp.io/mcp",
      "headers": {
        "X-API-Key": "YOUR_API_KEY"
      }
    }
  }
}
```

Get your API key at [app.reckonapp.io/api-keys](https://app.reckonapp.io/api-keys).

---

## Tools

### `verify_email`

Verify an email address. Returns deliverability status, format validity, domain info, and risk flags (disposable, role-based, accept-all, mailbox full, plus addressing). Each call consumes one credit.

**Input:**

| Field   | Type   | Required | Description                  |
|---------|--------|----------|------------------------------|
| `email` | string | Yes      | The email address to verify. |

**Example response:**

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
  }
}
```

### `check_credits`

Check the remaining email verification credit balance for your account. No input required.

**Example response:**

```json
{
  "balance": 5000,
  "asOf": "2026-03-22T14:00:00Z"
}
```

---

## Authentication

Most clients authenticate via **OAuth** — you sign in with your Reckon account when prompted and a dedicated API key is created automatically.

For clients that don't support OAuth (like Cursor), pass your API key via the `X-API-Key` header. Get a key at [app.reckonapp.io/api-keys](https://app.reckonapp.io/api-keys).

You can manage, pause, or revoke keys anytime from your [API Keys](https://app.reckonapp.io/api-keys) dashboard.

---

## Discovery

Registries and clients can read machine-readable MCP metadata at [`https://mcp.reckonapp.io/.well-known/mcp/server-card.json`](https://mcp.reckonapp.io/.well-known/mcp/server-card.json) (server info, OAuth, tools).

---

## Links

- **Get an API key:** [app.reckonapp.io/signup](https://app.reckonapp.io/signup)
- **Manage API keys:** [app.reckonapp.io/api-keys](https://app.reckonapp.io/api-keys)
- **Support:** [support.reckonapp.io](https://support.reckonapp.io)
- **Privacy:** [reckonapp.io/privacy](https://reckonapp.io/privacy-policy)
- **Terms of Service:** [reckonapp.io/privacy](https://reckonapp.io/terms-of-service)
- **MCP Protocol:** [modelcontextprotocol.io](https://modelcontextprotocol.io)

---

## License

[MIT](LICENSE)

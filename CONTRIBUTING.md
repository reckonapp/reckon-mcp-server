# Contributing

Thanks for your interest in contributing to the Reckon MCP Server!

## Getting Started

1. **Clone the repo** and install dependencies:

   ```bash
   git clone https://github.com/reckonapp/reckon-mcp-server.git
   cd reckon-mcp-server
   npm install
   ```

2. **Copy the example config** and fill in your values:

   ```bash
   cp wrangler.jsonc.example wrangler.jsonc
   cp .env.example .dev.vars
   ```

   Edit `wrangler.jsonc` with your KV namespace ID and domain. Edit `.dev.vars` with your secret values. See `.env.example` for descriptions.

3. **Run locally:**

   ```bash
   npm run dev
   # Server runs at http://localhost:8787/mcp
   ```

4. **Test with MCP Inspector:**

   ```bash
   npx @modelcontextprotocol/inspector http://localhost:8787/mcp
   ```

## Submitting Changes

1. Fork the repo and create a feature branch from `main`.
2. Make your changes with clear, focused commits.
3. Ensure the project builds without errors (`npm run build` or `npx wrangler deploy --dry-run`).
4. Open a pull request with a description of what changed and why.

## Code Style

- TypeScript, targeting Cloudflare Workers
- camelCase for unexported identifiers, PascalCase for exported ones
- Keep changes minimal and focused

## Reporting Issues

Use [GitHub Issues](https://github.com/reckonapp/reckon-mcp-server/issues) for bugs and feature requests. For security vulnerabilities, see [SECURITY.md](SECURITY.md).

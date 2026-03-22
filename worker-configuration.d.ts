// Worker environment bindings
interface Env {
  // API base URL for Reckon's public API
  RECKON_API_BASE_URL: string;

  // Shared secret for authenticating internal metrics push and internal API calls to reckon-core
  MCP_METRICS_SECRET: string;

  // Comma-separated list of allowed Origin header values; "*" or omit to allow all (default)
  ALLOWED_ORIGINS?: string;

  // Token returned at GET /.well-known/openai-apps-challenge for OpenAI app verification
  OPENAI_APPS_VERIFICATION_TOKEN?: string;

  // OAuth provider token and client storage (workers-oauth-provider)
  OAUTH_KV: KVNamespace;

  // Auth provider (for OAuth login handler only)
  AUTH_URL?: string;
  AUTH_PUBLISHABLE_KEY?: string;
}

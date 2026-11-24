export interface ClientSupabaseDiagnosticResult {
  viteUrlConfigured: boolean;
  resolvedUrl: string | null;
  supabaseReachable: boolean;
  httpStatus: number | null;
  latencyMs: number | null;
  backendStatus?: 'ready' | 'needs_setup';
  backendStorage?: string;
  backendError?: string | null;
  error?: string;
}

function normalizeClientSupabaseUrl(raw: string): string {
  let cleaned = raw.trim();
  if (
    (cleaned.startsWith('"') && cleaned.endsWith('"')) ||
    (cleaned.startsWith("'") && cleaned.endsWith("'"))
  ) {
    cleaned = cleaned.slice(1, -1).trim();
  }
  if (!cleaned) return '';

  if (/^[a-z0-9]{16,32}$/i.test(cleaned)) {
    return `https://${cleaned.toLowerCase()}.supabase.co`;
  }

  if (!/^[a-z]+:\/\//i.test(cleaned) && /^[a-z0-9.-]+\.supabase\.(co|in|net)(\/.*)?$/i.test(cleaned)) {
    cleaned = `https://${cleaned}`;
  }

  try {
    const parsed = new URL(cleaned);
    const cleanedPath = parsed.pathname
      .replace(/\/(rest|auth|storage|graphql|realtime)\/v1\/?.*$/i, '')
      .replace(/\/+$/, '');
    return `${parsed.protocol}//${parsed.host}${cleanedPath}`;
  } catch {
    return cleaned
      .replace(/\/(rest|auth|storage|graphql|realtime)\/v1\/?.*$/i, '')
      .replace(/\/+$/, '');
  }
}

export async function pingSupabaseConnection(signal?: AbortSignal): Promise<ClientSupabaseDiagnosticResult> {
  const rawViteUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
  const resolvedUrl = normalizeClientSupabaseUrl(rawViteUrl);

  const result: ClientSupabaseDiagnosticResult = {
    viteUrlConfigured: Boolean(resolvedUrl),
    resolvedUrl: resolvedUrl || null,
    supabaseReachable: false,
    httpStatus: null,
    latencyMs: null,
  };

  if (!resolvedUrl) {
    result.error = 'VITE_SUPABASE_URL is not configured in client environment variables.';
    console.warn(`[Supabase Client Diagnostic] ${result.error}`);
  } else {
    const pingEndpoint = `${resolvedUrl}/rest/v1/`;
    const start = performance.now();
    try {
      const res = await fetch(pingEndpoint, {
        method: 'GET',
        signal,
      });
      result.httpStatus = res.status;
      result.latencyMs = Math.round(performance.now() - start);
      // Any non-5xx HTTP response (including 401 when pinging without an API key) confirms the endpoint is reachable.
      result.supabaseReachable = res.status < 500;

      if (result.supabaseReachable) {
        console.info(
          `[Supabase Client Diagnostic] Reachable: ${pingEndpoint} (HTTP ${res.status}, ${result.latencyMs}ms)`
        );
      } else {
        result.error = `Supabase returned HTTP ${res.status} from ${pingEndpoint}`;
        console.error(`[Supabase Client Diagnostic] ${result.error}`);
      }
    } catch (err) {
      if ((err as Error)?.name === 'AbortError') {
        return result;
      }
      result.latencyMs = Math.round(performance.now() - start);
      result.error = `Failed to reach ${pingEndpoint}: ${(err as Error).message}`;
      console.error(`[Supabase Client Diagnostic] ${result.error}`);
    }
  }

  try {
    const statusRes = await fetch('/api/status', { signal });
    if (statusRes.ok) {
      const payload = (await statusRes.json().catch(() => null)) as {
        status?: 'ready' | 'needs_setup';
        storage?: string;
        tablesReady?: boolean;
        message?: string;
        diagnostics?: { error?: string | null; resolvedUrl?: string | null; authValid?: boolean };
      } | null;

      if (payload) {
        result.backendStatus = payload.status;
        result.backendStorage = payload.storage;
        result.backendError = payload.diagnostics?.error ?? payload.message ?? null;

        if (payload.status === 'ready') {
          console.info(
            `[Supabase Server Diagnostic] Connected (${payload.storage}, tablesReady=${Boolean(payload.tablesReady)})`
          );
        } else {
          console.warn(
            `[Supabase Server Diagnostic] Status=${payload.status} (${payload.storage}): ${
              result.backendError || 'Supabase setup incomplete'
            }`
          );
        }
      }
    }
  } catch (err) {
    if ((err as Error)?.name !== 'AbortError') {
      console.warn('[Supabase Server Diagnostic] Could not query /api/status:', (err as Error).message);
    }
  }

  return result;
}

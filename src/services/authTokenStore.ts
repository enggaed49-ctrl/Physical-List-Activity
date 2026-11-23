// In-memory access token store (never persisted to localStorage or sessionStorage)
let accessToken: string | null = null;
let unauthorizedHandler: (() => void) | null = null;

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

export function getAccessToken(): string | null {
  return accessToken;
}

export function setUnauthorizedHandler(handler: (() => void) | null): void {
  unauthorizedHandler = handler;
}

export function notifyUnauthorized(): void {
  accessToken = null;
  if (unauthorizedHandler) {
    unauthorizedHandler();
  }
}

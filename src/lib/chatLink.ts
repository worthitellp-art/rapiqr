/**
 * WhatsApp chat links. The owner's "Open Chat" button points at
 * `#/dashboard?tab=chat&session=<value>`. The value is either a 24-char session
 * id (already signed in, or a legacy link) or a 64-char one-time login token.
 * Tokens are read from the hash only, so they are never sent to the server
 * on a page load.
 */

const LOGIN_TOKEN_RE = /^[a-f0-9]{64}$/;

/** The one-time login token in the current URL, or null if there isn't one. */
export function readChatLinkToken(): string | null {
  const match = window.location.hash.match(/[?&]session=([^&]+)/);
  if (!match) return null;
  const value = decodeURIComponent(match[1]);
  return LOGIN_TOKEN_RE.test(value) ? value : null;
}

/**
 * Replaces the session value in the hash, keeping the rest of the route (tab
 * etc.). Pass null to drop the session param entirely.
 */
export function setChatLinkSession(sessionId: string | null) {
  const hash = window.location.hash;
  const [path, query = ''] = hash.split('?');
  const params = new URLSearchParams(query);
  params.delete('session');
  if (sessionId) params.set('session', sessionId);
  const qs = params.toString();
  window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}${path || '#/dashboard'}${qs ? `?${qs}` : ''}`);
}

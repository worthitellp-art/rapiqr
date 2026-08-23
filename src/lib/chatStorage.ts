/**
 * RepiChat continuity across page reloads.
 *
 * A chat has to survive an F5. The visitor who scanned a sticker is on a phone
 * — an incoming call, a tab switch or a flaky signal reloads the page under
 * them — and the owner reloads their dashboard all day. Everything a thread
 * needs to come back exactly as the user left it lives here: which thread was
 * open, the transcript to paint before the network answers, and the half-typed
 * message still sitting in the composer.
 *
 * All of it is a cache, never the source of truth: the server transcript always
 * wins once it arrives (see `RepiChat`'s history sync).
 */

const CACHE_PREFIX = 'repichat-cache-v1:';
const DRAFT_PREFIX = 'repichat-draft-v1:';
const SESSION_PREFIX = 'repichat-session-v1:';
const OPEN_PREFIX = 'repichat-open-v1:';
const OWNER_THREAD_KEY = 'repichat-owner-thread-v1';

/** Old messages are dead weight in localStorage — the server holds the full history. */
const MAX_CACHED_MESSAGES = 80;

function read(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string | null) {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {
    /* private mode / quota — continuity is a nicety, never a hard failure */
  }
}

/* ── Transcript cache — what paints instantly on reload ─────────────────── */

export function cachedMessages<T>(sessionId: string | undefined): T[] {
  if (!sessionId) return [];
  const raw = read(CACHE_PREFIX + sessionId);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function cacheMessages<T>(sessionId: string | undefined, messages: T[]) {
  if (!sessionId) return;
  write(CACHE_PREFIX + sessionId, JSON.stringify(messages.slice(-MAX_CACHED_MESSAGES)));
}

/* ── Composer draft — a half-typed message shouldn't die on reload ──────── */

export function readDraft(sessionId: string | undefined): string {
  return (sessionId && read(DRAFT_PREFIX + sessionId)) || '';
}

export function writeDraft(sessionId: string | undefined, text: string) {
  if (!sessionId) return;
  write(DRAFT_PREFIX + sessionId, text.trim() ? text : null);
}

/* ── Visitor side — which session belongs to this sticker on this device ── */

/**
 * The visitor's session id is only known after `startSession` answers, so a
 * reload would show an empty panel until the round-trip lands. Remembering the
 * id against the QR lets the cached transcript paint on the very first frame.
 */
export function recallCustomerSession(qrId: string | undefined): string | undefined {
  return (qrId && read(SESSION_PREFIX + qrId)) || undefined;
}

export function rememberCustomerSession(qrId: string | undefined, sessionId: string) {
  if (!qrId) return;
  write(SESSION_PREFIX + qrId, sessionId);
}

/* ── Open/closed panel state — reload lands the visitor back in the chat ── */

export function isChatOpen(qrId: string | undefined): boolean {
  return Boolean(qrId) && read(OPEN_PREFIX + qrId) === '1';
}

export function setChatOpen(qrId: string | undefined, open: boolean) {
  if (!qrId) return;
  write(OPEN_PREFIX + qrId, open ? '1' : null);
}

/* ── Owner side — the inbox thread that was open before the reload ──────── */

export function recallOwnerThread(): string | null {
  return read(OWNER_THREAD_KEY);
}

export function rememberOwnerThread(sessionId: string | null) {
  write(OWNER_THREAD_KEY, sessionId);
}

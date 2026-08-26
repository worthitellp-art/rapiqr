/**
 * RepiChat realtime transport — a single lazily-created Socket.io connection
 * shared by every mounted <RepiChat/> instance on the page.
 */
import { io, type Socket } from 'socket.io-client';

const RAW_API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '/api').trim().replace(/\/+$/, '');

// Socket.io connects at the server origin (it owns its own /socket.io path),
// not under /api — strip the /api suffix apiClient.ts normalizes onto the URL.
const SOCKET_ORIGIN = RAW_API_BASE_URL.replace(/\/api$/, '') || undefined;

let socket: Socket | null = null;
// The identity (owner token, or visitor sessionId+customerToken) the shared
// socket last handshook with. The server only reads `auth` once, at connect
// time — in this SPA the same tab can go from an anonymous visitor chat to an
// owner dashboard chat without a full page reload, so just skipping .connect()
// because the socket happens to already be connected would leave it stuck
// authenticated as the previous identity (join_session then silently fails
// the ownership check and the new identity never receives live messages).
let currentAuthKey: string | null = null;

function getSocket(): Socket {
  if (!socket) {
    socket = io(SOCKET_ORIGIN, {
      autoConnect: false,
      withCredentials: true,
      // WebSocket first. The default order opens an HTTP long-poll, then
      // upgrades — two extra round trips before the first message can move,
      // which on a phone is most of the perceived "chat is slow". Polling stays
      // in the list as the fallback for networks that block WebSocket.
      transports: ['websocket', 'polling'],
      // Reconnect for as long as the tab is open. Giving up after three tries
      // left the chat permanently on the REST fallback after one tunnel or
      // lift ride — no live messages, no typing, no read ticks, and nothing to
      // tell the user why. Backoff caps at 10s so a long outage doesn't spin.
      reconnectionAttempts: Infinity,
      reconnectionDelay: 500,
      reconnectionDelayMax: 10000,
      randomizationFactor: 0.5,
      timeout: 8000,
    });

    socket.on('connect_error', (err) => {
      console.warn('RepiChat socket connect failed, retrying (REST fallback active meanwhile):', err.message);
    });
  }
  return socket;
}

function connectWithAuth(auth: Record<string, string>): Socket {
  const s = getSocket();
  const key = JSON.stringify(auth);

  if (key !== currentAuthKey) {
    currentAuthKey = key;
    s.auth = auth;
    // Force a fresh handshake so the server re-resolves identity from the new
    // auth payload instead of keeping whatever identity it authenticated
    // at the original connection.
    if (s.connected) s.disconnect();
    s.connect();
  } else if (!s.connected) {
    s.connect();
  }

  return s;
}

/** Connect (or reuse the existing connection) authenticated as the sticker owner. */
export function connectAsOwner(token: string): Socket {
  return connectWithAuth({ token });
}

/** Connect (or reuse the existing connection) authenticated as the anonymous scanning customer. */
export function connectAsCustomer(sessionId: string, customerToken: string): Socket {
  return connectWithAuth({ sessionId, customerToken });
}

export function disconnectSocket() {
  socket?.disconnect();
}

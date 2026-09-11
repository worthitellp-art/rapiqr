/**
 * Secure Backend API Client Service for NamoQR
 * Routes all Auth, QR, and Alert operations to the Express MVC Server Backend
 */

const RAW_API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '/api').trim().replace(/\/+$/, '');

/**
 * Normalize the backend base URL so it always points at the Express /api root
 * (the server mounts every route under /api/*). This protects against configs
 * that were set without the trailing /api suffix — otherwise every request
 * (e.g. admin-signin) hits a route-not-found 404.
 */
const API_BASE_URL = (() => {
  if (!RAW_API_BASE_URL || RAW_API_BASE_URL === '/') return '/api';
  if (RAW_API_BASE_URL.endsWith('/api')) return RAW_API_BASE_URL;
  return `${RAW_API_BASE_URL}/api`;
})();

/**
 * True when the frontend is built with a REAL backend URL (not the placeholder).
 * A relative default (e.g. `/api`) still works via same-origin fetch even when
 * this is false — it only gates the cross-origin (e.g. Render) deployment case.
 */
export const isApiBackendConfigured = (() => {
  const base = RAW_API_BASE_URL || '';
  if (!base) return true;
  if (base.startsWith('/')) return true;
  return base.startsWith('http') && !base.includes('YOUR-RENDER-SERVICE');
})();

function getAuthHeader(): Record<string, string> {
  let token = localStorage.getItem('repiqr-token') || localStorage.getItem('namoqr-token');

  if (!token) {
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.includes('auth-token')) {
          const val = localStorage.getItem(key);
          if (val) {
            const parsed = JSON.parse(val);
            if (parsed?.access_token) {
              token = parsed.access_token;
              localStorage.setItem('repiqr-token', token);
              break;
            }
          }
        }
      }
    } catch {
      // Ignore localStorage parse errors
    }
  }

  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeader(),
    ...(options.headers || {}),
  };

  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    let data: any = null;
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      try {
        data = await response.json();
      } catch {
        data = null;
      }
    }

    if (!response.ok) {
      const errMsg = (data && data.error) ? data.error : `Route ${endpoint} not found (HTTP ${response.status})`;
      // The backend rejected our token outright (expired/invalid) — previously this
      // failed silently per-call (Supabase fallback for some endpoints, a blank
      // screen for others like Message Center) with no way back to a working state
      // short of a manual localStorage wipe. Broadcast it so AuthContext can force
      // a clean re-login instead of leaving the UI stuck half-authenticated.
      if (response.status === 401) {
        // Exclude authentication lifecycle endpoints (e.g. invalid credentials on signin, or logout)
        // from broadcasting unauthorized to prevent infinite recursion and cascading loops.
        const isAuthLifecycleEndpoint = [
          '/auth/logout',
          '/auth/signin',
          '/auth/admin-signin',
          '/auth/signup',
          '/auth/forgot-password',
          '/auth/reset-password',
          '/auth/google',
        ].some(path => endpoint.includes(path));

        if (!isAuthLifecycleEndpoint) {
          window.dispatchEvent(new CustomEvent('rapiqr:unauthorized', { detail: { endpoint } }));
        }
      }
      // Carry the HTTP status on the error so callers can tell "your token is
      // dead" (401) apart from "the server had a problem answering" (404/5xx).
      // Without it, AuthContext treated every /auth/me failure as a dead token
      // and deleted it, after which every later call went out unauthenticated.
      const err = new Error(errMsg) as Error & { status?: number };
      err.status = response.status;
      throw err;
    }

    if (data === null) {
      try {
        const text = await response.text();
        data = text ? JSON.parse(text) : {};
      } catch {
        data = {};
      }
    }

    return data as T;
  } catch (err: any) {
    // Graceful log for expected fallback endpoints
    if (process.env.NODE_ENV === 'development') {
      console.debug(`API endpoint (${endpoint}):`, err.message || err);
    }
    throw err;
  }
}

export interface ChatMessage {
  id: string;
  session_id: string;
  sender_type: 'owner' | 'customer';
  sender_id: string | null;
  body: string;
  created_at: string;
  read_at: string | null;
  /** Set once the peer's socket was in the room — the second tick. */
  delivered_at?: string | null;
  /** Echoed back on our own send so the optimistic bubble can be matched exactly. */
  client_id?: string;
  /** Image attachment (see Server/sql/chat_attachments.sql). */
  attachment_url?: string | null;
  attachment_type?: string | null;
  attachment_name?: string | null;
  attachment_width?: number | null;
  attachment_height?: number | null;
}

export interface ChatSession {
  id: string;
  qr_code_id: string;
  owner_id: string | null;
  customer_token: string;
  customer_name: string;
  vehicle_label: string | null;
  status: 'open' | 'closed';
  last_message_at: string | null;
  last_message_preview: string | null;
  unread_owner_count: number;
  unread_customer_count: number;
  created_at: string;
}

/** Courier tracking stored on an order — see Server/sql/orders_fulfillment.sql */
export interface OrderTrackingEvent {
  status: string;
  at: string | null;
  location: string | null;
  note: string | null;
}

export interface OrderTracking {
  orderId?: number | string;
  shipmentId?: number | string;
  awbCode?: string | null;
  courierName?: string | null;
  trackingUrl?: string | null;
  currentStatus?: string | null;
  etd?: string | null;
  lastUpdatedAt?: string | null;
  timeline?: OrderTrackingEvent[];
}

export interface OnlineOwner {
  ownerId: string;
  connectedAt: string;
  fullName: string;
  email: string | null;
}

export const apiClient = {
  // Authentication Services
  auth: {
    async signUp(email: string, password: string, fullName: string, phoneNumber?: string) {
      return request<{ success: boolean; token?: string; user?: any }>('/auth/signup', {
        method: 'POST',
        body: JSON.stringify({ email, password, fullName, phoneNumber }),
      });
    },

    async signIn(email: string, password: string) {
      return request<{ success: boolean; token?: string; user?: any }>('/auth/signin', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
    },

    async adminSignIn(email: string, password: string) {
      return request<{ success: boolean; token?: string; user?: any }>('/auth/admin-signin', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
    },

    async googleAuth(credentialOrUser: any) {
      return request<{ success: boolean; token?: string; user?: any }>('/auth/google', {
        method: 'POST',
        body: JSON.stringify(credentialOrUser),
      });
    },

    async getMe() {
      return request<{ success: boolean; user?: any }>('/auth/me', {
        method: 'GET',
      });
    },

    // Records a LOGOUT audit entry server-side. JWTs are stateless here, so
    // this doesn't revoke the token — signOut() still clears it locally
    // regardless of whether this call succeeds.
    async logout() {
      return request<{ success: boolean; message?: string }>('/auth/logout', {
        method: 'POST',
      });
    },

    async updateProfile(updates: { fullName?: string; phoneNumber?: string; avatarUrl?: string }) {
      return request<{ success: boolean; user?: any }>('/auth/me', {
        method: 'PATCH',
        body: JSON.stringify(updates),
      });
    },

    // Phone verification (two-step): send a code, then verify it before the
    // number is attached to the account — required before any sticker can be
    // auto-claimed by phone. See ClientDashboard.tsx / AccountSettingsPanel.tsx.
    async sendPhoneOtp(phoneNumber: string) {
      return request<{ success: boolean; simulated?: boolean; error?: string }>('/auth/phone/send-otp', {
        method: 'POST',
        body: JSON.stringify({ phoneNumber }),
      });
    },

    async verifyPhoneOtp(code: string) {
      return request<{ success: boolean; user?: any; claimedCount?: number; error?: string }>('/auth/phone/verify-otp', {
        method: 'POST',
        body: JSON.stringify({ code }),
      });
    },

    async changePassword(currentPassword: string, newPassword: string) {
      return request<{ success: boolean; message?: string }>('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword }),
      });
    },

    // `warning` is set when the address changed was the one ADMIN_EMAIL points at:
    // admin login keeps using the old address until Server/.env is updated.
    async changeEmail(newEmail: string, currentPassword: string) {
      return request<{ success: boolean; user?: any; token?: string; warning?: string }>('/auth/change-email', {
        method: 'POST',
        body: JSON.stringify({ newEmail, currentPassword }),
      });
    },

    async deleteAccount() {
      return request<{ success: boolean; message?: string }>('/auth/me', {
        method: 'DELETE',
      });
    },

    async forgotPassword(email: string) {
      return request<{ success: boolean; message?: string }>('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
    },

    async resetPassword(token: string, newPassword: string) {
      return request<{ success: boolean; message?: string }>('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token, newPassword }),
      });
    },
  },

  // Account Security (2FA) Services
  twoFactor: {
    async setup() {
      return request<{ success: boolean; secret?: string; otpauthUrl?: string }>('/auth/2fa/setup', {
        method: 'POST',
      });
    },

    async verify(code: string) {
      return request<{ success: boolean; message?: string }>('/auth/2fa/verify', {
        method: 'POST',
        body: JSON.stringify({ code }),
      });
    },

    async disable(password: string) {
      return request<{ success: boolean; message?: string }>('/auth/2fa/disable', {
        method: 'POST',
        body: JSON.stringify({ password }),
      });
    },
  },

  // QR Code Services
  qr: {
    async getQrCodes(limit = 100) {
      return request<{ success: boolean; data: any[] }>(`/qr?limit=${limit}`, {
        method: 'GET',
      });
    },

    async getQrCodeById(qrId: string) {
      return request<{ success: boolean; data: any }>(`/qr/${qrId}`, {
        method: 'GET',
      });
    },

    async saveQrCode(qrData: any) {
      return request<{ success: boolean; data: any }>('/qr', {
        method: 'POST',
        body: JSON.stringify(qrData),
      });
    },

    async activateQrCode(qrId: string, activationData: any) {
      return request<{ success: boolean; data: any }>(`/qr/${qrId}/activate`, {
        method: 'POST',
        body: JSON.stringify(activationData),
      });
    },

    async recordScan(qrId: string) {
      return request<{ success: boolean; data: any }>(`/qr/${qrId}/scan`, {
        method: 'POST',
      });
    },

    async deleteQrCode(qrId: string) {
      return request<{ success: boolean; data?: any }>(`/qr/${qrId}`, {
        method: 'DELETE',
      });
    },

    async deleteAllQrCodes() {
      return request<{ success: boolean }>(`/qr`, {
        method: 'DELETE',
      });
    },

    async restoreQrCode(qrId: string, recoveryCode: string) {
      return request<{ success: boolean; data?: any; error?: string }>(`/qr/${qrId}/restore`, {
        method: 'POST',
        body: JSON.stringify({ recoveryCode }),
      });
    },

    async sendActivationOtp(qrId: string, phoneNumber: string) {
      return request<{ success: boolean; simulated?: boolean; error?: string }>(`/qr/${qrId}/send-activation-otp`, {
        method: 'POST',
        body: JSON.stringify({ phoneNumber }),
      });
    },

    async verifyActivationOtp(qrId: string, code: string) {
      return request<{ success: boolean; phone?: string; error?: string }>(`/qr/${qrId}/verify-activation-otp`, {
        method: 'POST',
        body: JSON.stringify({ code }),
      });
    },
  },

  // My Stickers / Products Services (dashboard sticker management)
  products: {
    async list() {
      return request<{ success: boolean; data: any[] }>('/products', {
        method: 'GET',
      });
    },

    async getById(productId: string) {
      return request<{ success: boolean; data: any }>(`/products/${productId}`, {
        method: 'GET',
      });
    },

    async updateDetails(productId: string, updates: any) {
      return request<{ success: boolean; data: any }>(`/products/${productId}`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
      });
    },

    async updateContacts(productId: string, contacts: { name: string; phone: string }[]) {
      return request<{ success: boolean; data: any }>(`/products/${productId}/contacts`, {
        method: 'PATCH',
        body: JSON.stringify({ contacts }),
      });
    },

    async deactivate(productId: string) {
      return request<{ success: boolean; data: any }>(`/products/${productId}/deactivate`, {
        method: 'POST',
      });
    },

    async reactivate(productId: string) {
      return request<{ success: boolean; data: any }>(`/products/${productId}/reactivate`, {
        method: 'POST',
      });
    },

    async transfer(productId: string, targetEmail: string) {
      return request<{ success: boolean; data: any }>(`/products/${productId}/transfer`, {
        method: 'POST',
        body: JSON.stringify({ targetEmail }),
      });
    },

    async remove(productId: string) {
      return request<{ success: boolean }>(`/products/${productId}`, {
        method: 'DELETE',
      });
    },

    // Owner self-service recover — ID only, no recovery code. Only works for
    // a sticker whose user_id still matches the signed-in account (survives
    // a soft-delete either the owner or an admin performed).
    async recover(productId: string) {
      return request<{ success: boolean; data?: any; error?: string }>(`/products/${productId}/recover`, {
        method: 'POST',
      });
    },

    async getHistory(productId: string) {
      return request<{ success: boolean; data: any[] }>(`/products/${productId}/history`, {
        method: 'GET',
      });
    },
  },

  // Emergency Alerts Services
  alerts: {
    async createAlert(alertPayload: any) {
      return request<{
        success: boolean;
        data: any;
        smsResult?: { sent: boolean; simulated: boolean; reason?: string; error?: string };
        contactsNotified?: number;
        chatSessionId?: string;
      }>('/alerts', {
        method: 'POST',
        body: JSON.stringify(alertPayload),
      });
    },

    async getAlerts(limit = 50) {
      return request<{ success: boolean; data: any[] }>(`/alerts?limit=${limit}`, {
        method: 'GET',
      });
    },
  },

  // RepiChat — in-app real-time owner<->customer chat (replaces WhatsApp deep links)
  chat: {
    async startSession(qrId: string, customerToken?: string, customerName?: string) {
      try {
        return await request<{ success: boolean; sessionId: string; customerToken: string; ownerName?: string; hasOwner?: boolean }>('/chat/sessions', {
          method: 'POST',
          body: JSON.stringify({ qrId, customerToken, customerName }),
        });
      } catch (err) {
        console.warn("apiClient.chat.startSession API error, returning fallback session:", err);
        const fallbackToken = customerToken || `cust_${Math.random().toString(36).substring(2, 9)}`;
        const fallbackSessionId = `sess_${qrId.replace(/[^a-zA-Z0-9]/g, '')}_${fallbackToken.substring(0, 6)}`;
        return {
          success: true,
          sessionId: fallbackSessionId,
          customerToken: fallbackToken,
          ownerName: "Vehicle Owner",
          hasOwner: true,
        };
      }
    },

    async getMessages(sessionId: string, customerToken?: string) {
      try {
        return await request<{ success: boolean; data: ChatMessage[]; session: ChatSession }>(`/chat/sessions/${sessionId}/messages`, {
          method: 'GET',
          headers: customerToken ? { 'x-customer-token': customerToken } : undefined,
        });
      } catch {
        return {
          success: true,
          data: [],
          session: {
            id: sessionId,
            qr_code_id: sessionId.split('_')[1] || 'QR01',
            owner_id: null,
            customer_token: customerToken || 'cust',
            customer_name: 'Visitor',
            vehicle_label: 'Vehicle Tag',
            status: 'open',
            last_message_at: new Date().toISOString(),
            last_message_preview: null,
            unread_owner_count: 0,
            unread_customer_count: 0,
            created_at: new Date().toISOString(),
          }
        };
      }
    },

    async sendMessage(sessionId: string, body: string, customerToken?: string, clientId?: string) {
      try {
        return await request<{ success: boolean; data: ChatMessage }>(`/chat/sessions/${sessionId}/messages`, {
          method: 'POST',
          headers: customerToken ? { 'x-customer-token': customerToken } : undefined,
          body: JSON.stringify({ body, clientId }),
        });
      } catch {
        const localMsg: ChatMessage = {
          id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          session_id: sessionId,
          sender_type: customerToken ? 'customer' : 'owner',
          sender_id: customerToken ? 'visitor' : 'owner',
          body,
          created_at: new Date().toISOString(),
          read_at: null,
        };
        return { success: true, data: localMsg };
      }
    },

    /**
     * Send an image into a thread. `image` is a base64 data URL — the caller
     * downscales/compresses first (see `prepareImage` in RepiChat), so what's
     * uploaded is what will be displayed rather than a 12MP phone original.
     * Unlike the other chat calls this one does NOT swallow failures: a photo
     * that silently vanished would be worse than an error the user can retry.
     */
    async sendAttachment(
      sessionId: string,
      payload: { image: string; name?: string; width?: number; height?: number; caption?: string; clientId?: string },
      customerToken?: string
    ) {
      return request<{ success: boolean; data: ChatMessage; error?: string }>(
        `/chat/sessions/${sessionId}/attachments`,
        {
          method: 'POST',
          headers: customerToken ? { 'x-customer-token': customerToken } : undefined,
          body: JSON.stringify(payload),
        }
      );
    },

    async listOwnerSessions() {
      try {
        return await request<{ success: boolean; data: ChatSession[] }>('/chat/owner/sessions', {
          method: 'GET',
        });
      } catch {
        return { success: true, data: [] };
      }
    },

    // Admin-only "Online Now" view — who's connected, not what they're saying.
    async listOnlineOwners() {
      return request<{ success: boolean; data: OnlineOwner[] }>('/chat/admin/online-owners', {
        method: 'GET',
      });
    },

    async markRead(sessionId: string, customerToken?: string) {
      return request<{ success: boolean }>(`/chat/sessions/${sessionId}/read`, {
        method: 'PATCH',
        headers: customerToken ? { 'x-customer-token': customerToken } : undefined,
      });
    },

    async closeSession(sessionId: string) {
      return request<{ success: boolean; data: ChatSession }>(`/chat/sessions/${sessionId}/close`, {
        method: 'PATCH',
      });
    },

    async deleteSession(sessionId: string) {
      return request<{ success: boolean; message?: string }>(`/chat/sessions/${sessionId}`, {
        method: 'DELETE',
      });
    },
  },

  // Checkout order receipts (see task.md #6)
  orders: {
    async create(order: {
      name: string; email: string; phone: string;
      items: { name: string; qty: number; price: number }[];
      subtotal: number; deliveryFee: number; total: number;
      paymentMethod: string; deliveryMethod: string;
      shippingAddress?: Record<string, string>;
    }) {
      return request<{ success: boolean; data: any }>('/orders', {
        method: 'POST',
        body: JSON.stringify(order),
      });
    },

    async mine() {
      return request<{ success: boolean; data: any[] }>('/orders/mine', {
        method: 'GET',
      });
    },

    /**
     * The buyer's own delivery status. Supports optional guest verification contact.
     */
    async track(id: string, verificationContact?: string) {
      const queryString = verificationContact ? `?contact=${encodeURIComponent(verificationContact)}` : '';
      return request<{
        success: boolean;
        error?: string;
        data?: {
          id: string;
          status: 'placed' | 'shipped' | 'delivered' | 'cancelled';
          payment?: any;
          paymentStatus?: string;
          deliveryMethod?: string;
          total?: number;
          createdAt?: string;
          items?: Array<{ name: string; qty: number; price: number }>;
          maskedBuyer?: {
            firstName: string;
            email: string;
            phone: string;
            city: string;
            state: string;
            pincode: string;
          };
          shiprocket?: OrderTracking | null;
        };
      }>(`/orders/${encodeURIComponent(id)}/track${queryString}`, { method: 'GET' });
    },

    /**
     * Secure tracking lookup by Order ID and Phone Number / Email.
     */
    async trackByLookup(orderId: string, contact: string) {
      return request<{
        success: boolean;
        error?: string;
        data?: {
          id: string;
          status: 'placed' | 'shipped' | 'delivered' | 'cancelled';
          payment?: any;
          paymentStatus?: string;
          deliveryMethod?: string;
          total?: number;
          createdAt?: string;
          items?: Array<{ name: string; qty: number; price: number }>;
          maskedBuyer?: {
            firstName: string;
            email: string;
            phone: string;
            city: string;
            state: string;
            pincode: string;
          };
          shiprocket?: OrderTracking | null;
        };
      }>('/orders/track', {
        method: 'POST',
        body: JSON.stringify({ orderId, contact }),
      });
    },

    // Admin: every order placed via checkout
    async list() {
      return request<{ success: boolean; data: any[] }>('/orders', {
        method: 'GET',
      });
    },

    async updateStatus(id: string, status: 'placed' | 'shipped' | 'delivered' | 'cancelled') {
      return request<{ success: boolean; data: any }>(`/orders/${encodeURIComponent(id)}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
    },

    async delete(id: string) {
      return request<{ success: boolean; message?: string }>(`/orders/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
    },

    async deleteAll() {
      return request<{ success: boolean; message?: string }>('/orders', {
        method: 'DELETE',
      });
    },
  },

  // Razorpay checkout payment flow (test mode) — see docs/razorpayapi.md
  payments: {
    async createOrder(orderId: string) {
      return request<{
        success: boolean;
        error?: string;
        data?: {
          keyId: string; razorpayOrderId: string; amount: number; currency: string;
          orderId: string; name: string; email: string; phone: string;
        };
      }>('/payments/create-order', {
        method: 'POST',
        body: JSON.stringify({ orderId }),
      });
    },

    async verify(payload: { orderId: string; razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) {
      return request<{ success: boolean; error?: string; data?: any }>('/payments/verify', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },
  },

  // Shop catalog (public storefront listing + admin CRUD) shown on the landing page
  shopProducts: {
    async list() {
      return request<{ success: boolean; data: any[] }>('/shop-products', {
        method: 'GET',
      });
    },

    async listAdmin() {
      return request<{ success: boolean; data: any[] }>('/shop-products/admin', {
        method: 'GET',
      });
    },

    async create(product: Record<string, any>) {
      return request<{ success: boolean; data: any }>('/shop-products', {
        method: 'POST',
        body: JSON.stringify(product),
      });
    },

    async update(id: string, updates: Record<string, any>) {
      return request<{ success: boolean; data: any }>(`/shop-products/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
      });
    },

    async remove(id: string) {
      return request<{ success: boolean }>(`/shop-products/${id}`, {
        method: 'DELETE',
      });
    },
  },

  // Shiprocket shipping (admin only) — order fulfillment via a real courier partner
  shiprocket: {
    async dashboard() {
      return request<{ success: boolean; data: { walletBalance: number | null; pickupLocations: any[] } }>('/shiprocket/dashboard', {
        method: 'GET',
      });
    },

    async createShipment(orderId: string) {
      return request<{ success: boolean; data: any; error?: string }>(`/shiprocket/orders/${encodeURIComponent(orderId)}/ship`, {
        method: 'POST',
      });
    },

    async track(orderId: string) {
      return request<{ success: boolean; data: any }>(`/shiprocket/orders/${encodeURIComponent(orderId)}/track`, {
        method: 'GET',
      });
    },
  },

  // Distributor / Partner Applications (see task.md #3)
  distributors: {
    async apply(appData: { userName: string; userEmail: string; phone: string; city: string; business: string; tier: string }) {
      return request<{ success: boolean; data: any }>('/distributors', {
        method: 'POST',
        body: JSON.stringify(appData),
      });
    },

    async myStatus(identifier?: string) {
      const qs = identifier ? `?identifier=${encodeURIComponent(identifier)}` : '';
      return request<{ success: boolean; data: any }>(`/distributors/me${qs}`, {
        method: 'GET',
      });
    },

    async list() {
      return request<{ success: boolean; data: any[] }>('/distributors', {
        method: 'GET',
      });
    },

    async updateStatus(appId: string, status: 'approved' | 'rejected', notes?: string) {
      return request<{ success: boolean; data: any }>(`/distributors/${appId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status, notes }),
      });
    },
  },

  // Scan-page Emergency AI Assistant (proxied server-side so the OpenRouter key never ships to the browser)
  ai: {
    async chat(messages: { role: 'user' | 'assistant' | 'system'; content: string }[], vehicleNumber?: string) {
      return request<{ success: boolean; reply?: string; error?: string }>('/ai/chat', {
        method: 'POST',
        body: JSON.stringify({ messages, vehicleNumber }),
      });
    },
  },

  // Post-activation Notifications
  notifications: {
    async sendActivationConfirmation(data: { qrId: string; ownerName: string; ownerEmail?: string; category?: string }) {
      return request<{ success: boolean; confirmation?: any; sample?: any }>('/notifications/activation-confirmation', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
  },

  // Admin Support Console (RepiQR staff only — requires an admin-role token)
  admin: {
    async listUsers(search?: string) {
      const params = search ? `?search=${encodeURIComponent(search)}` : '';
      return request<{ success: boolean; data: any[] }>(`/admin/users${params}`, {
        method: 'GET',
      });
    },

    async getUserDetail(userId: string) {
      return request<{ success: boolean; data: { profile: any; products: any[] } }>(`/admin/users/${userId}`, {
        method: 'GET',
      });
    },

    async searchStickers(search?: string) {
      const params = search ? `?search=${encodeURIComponent(search)}` : '';
      return request<{ success: boolean; data: any[] }>(`/admin/stickers${params}`, {
        method: 'GET',
      });
    },

    async triggerPasswordReset(userId: string) {
      return request<{ success: boolean; message?: string; emailSent?: boolean; actionLink?: string | null }>(`/admin/users/${userId}/reset-password`, {
        method: 'POST',
      });
    },

    async disableTwoFactor(userId: string) {
      return request<{ success: boolean; message?: string }>(`/admin/users/${userId}/disable-2fa`, {
        method: 'POST',
      });
    },

    async deleteUser(userId: string) {
      return request<{ success: boolean; message?: string }>(`/admin/users/${userId}`, {
        method: 'DELETE',
      });
    },

    async getMessageStats() {
      return request<{
        success: boolean;
        data: { total: number; sent: number; failed: number; simulated: number; sms: number; whatsapp: number; last24h: number };
      }>('/admin/messages/stats', { method: 'GET' });
    },

    async getMessages(opts: { limit?: number; channel?: string; status?: string; event?: string } = {}) {
      const params = new URLSearchParams();
      if (opts.limit) params.set('limit', String(opts.limit));
      if (opts.channel) params.set('channel', opts.channel);
      if (opts.status) params.set('status', opts.status);
      if (opts.event) params.set('event', opts.event);
      const qs = params.toString();
      return request<{ success: boolean; data: any[] }>(`/admin/messages${qs ? `?${qs}` : ''}`, {
        method: 'GET',
      });
    },
  },

  // Live Operational Logs Services
  logs: {
    async getLogs(limit = 100, level?: string, category?: string) {
      const params = new URLSearchParams({ limit: String(limit) });
      if (level) params.set('level', level);
      if (category) params.set('category', category);
      return request<{ success: boolean; count: number; data: any[] }>(`/logs?${params.toString()}`, {
        method: 'GET',
      });
    },

    async clearLogs() {
      return request<{ success: boolean; message: string }>('/logs', {
        method: 'DELETE',
      });
    },
  },

  // Twilio Masked Call Proxy Service — the target phone (owner, or a named
  // emergency contact) is resolved server-side from qrId; it's never sent from
  // or echoed back to the browser, so the real number stays hidden.
  twilio: {
    async callBridge(opts: { qrId: string; visitorPhone: string; contactName?: string }) {
      return request<{ success: boolean; message?: string; error?: string; callSid?: string; maskedHelplineNumber?: string }>('/twilio/call-bridge', {
        method: 'POST',
        body: JSON.stringify(opts),
      });
    },
  },

  // Exotel Masked Call Proxy Service — superseded by the Cloudshope bridge
  // below, left here unused rather than deleted in case of rollback.
  exotel: {
    async callBridge(opts: { qrId: string; visitorPhone: string; contactName?: string }) {
      return request<{ success: boolean; message?: string; error?: string; callSid?: string; maskedHelplineNumber?: string }>('/exotel/call-bridge', {
        method: 'POST',
        body: JSON.stringify(opts),
      });
    },
  },

  // Cloudshope Anonymous QR Calling Bridge — active masked-calling backend.
  // Unlike the Twilio/Exotel bridges, no phone number is collected from the
  // visitor: the server returns a DID to dial directly, and Cloudshope's
  // telecom layer connects it to the real number. The target is always
  // resolved server-side — from qrId (+ optional contactName) for the owner
  // or a personal emergency contact, or from helplineId for an admin-configured
  // provider — never sent from or echoed back to the browser.
  cloudshope: {
    async getCallNumber(opts: { qrId?: string; contactName?: string; helplineId?: string }) {
      return request<{ success: boolean; did?: string; label?: string; message?: string; error?: string }>('/cloudshope/call-bridge', {
        method: 'POST',
        body: JSON.stringify(opts),
      });
    },
  },

  // Admin-configured helpline directory (Ambulance, Towing, Mechanic, ...).
  // Persisted server-side so the scan page and the masked-call bridge can both
  // resolve them without depending on the admin's own browser localStorage.
  helplines: {
    /**
     * Active providers. With no filters this is the full list, which the scan
     * page fetches once and then resolves against locally (see tileActions.ts).
     * `serviceType` matches the slug; `stickerCategory` keeps providers scoped
     * to that category plus every provider scoped to none. `city` prefers
     * providers scoped to that city plus every provider scoped to none.
     */
    async getPublic(filter?: string | { category?: string; serviceType?: string; stickerCategory?: string; city?: string }) {
      try {
        const params = typeof filter === 'string' ? { category: filter } : (filter || {});
        const qs = new URLSearchParams(
          Object.entries(params).filter(([, v]) => Boolean(v)) as [string, string][]
        ).toString();
        return await request<{ success: boolean; data: any[] }>(`/helplines/public${qs ? `?${qs}` : ''}`, { method: 'GET' });
      } catch {
        return { success: true, data: [] };
      }
    },
    /**
     * Public: a provider applying through the landing page "Join us" form.
     * Stored inactive, so it stays out of every scan page until an admin
     * approves it in Admin -> Communication.
     */
    async apply(application: {
      category: string;
      serviceType?: string;
      categories?: string[];
      label: string;
      phone: string;
      email?: string;
      city?: string;
      notes?: string;
    }) {
      return request<{ success: boolean; data: any }>('/helplines/apply', {
        method: 'POST',
        body: JSON.stringify(application),
      });
    },
    async getAll() {
      return request<{ success: boolean; data: any[] }>('/helplines', { method: 'GET' });
    },
    async create(provider: { category: string; serviceType?: string; categories?: string[]; label: string; phone: string; active?: boolean; email?: string | null; city?: string | null; notes?: string | null }) {
      return request<{ success: boolean; data: any }>('/helplines', {
        method: 'POST',
        body: JSON.stringify(provider),
      });
    },
    async update(id: string, updates: Partial<{ category: string; serviceType: string; categories: string[]; label: string; phone: string; active: boolean; email: string | null; city: string | null; notes: string | null }>) {
      return request<{ success: boolean; data: any }>(`/helplines/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
      });
    },
    async remove(id: string) {
      return request<{ success: boolean }>(`/helplines/${id}`, { method: 'DELETE' });
    },
  },

  // Web Push (chat/alert notifications reaching a closed tab)
  push: {
    async getVapidPublicKey() {
      return request<{ success: boolean; publicKey?: string }>('/push/vapid-public-key', { method: 'GET' });
    },
    async subscribe(subscription: unknown) {
      return request<{ success: boolean }>('/push/subscribe', {
        method: 'POST',
        body: JSON.stringify({ subscription }),
      });
    },
    async unsubscribe(endpoint: string) {
      return request<{ success: boolean }>('/push/unsubscribe', {
        method: 'POST',
        body: JSON.stringify({ endpoint }),
      });
    },
  },
};


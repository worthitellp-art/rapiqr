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
 * The app prefers the Render/Express API for auth, QR, and alert flows when this
 * is true, and falls back to direct Supabase access otherwise.
 */
export const isApiBackendConfigured = (() => {
  const base = RAW_API_BASE_URL || '';
  return base.startsWith('http') && !base.includes('YOUR-RENDER-SERVICE');
})();

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('repiqr-token') || localStorage.getItem('namoqr-token');
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

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || `HTTP ${response.status} error`);
    }

    return data as T;
  } catch (err: any) {
    console.warn(`API Client Error (${endpoint}):`, err.message || err);
    throw err;
  }
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

    async updateProfile(updates: { fullName?: string; phoneNumber?: string }) {
      return request<{ success: boolean; user?: any }>('/auth/me', {
        method: 'PATCH',
        body: JSON.stringify(updates),
      });
    },

    async changePassword(currentPassword: string, newPassword: string) {
      return request<{ success: boolean; message?: string }>('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword }),
      });
    },

    async changeEmail(newEmail: string, currentPassword: string) {
      return request<{ success: boolean; user?: any; token?: string }>('/auth/change-email', {
        method: 'POST',
        body: JSON.stringify({ newEmail, currentPassword }),
      });
    },

    async deleteAccount(password: string) {
      return request<{ success: boolean; message?: string }>('/auth/me', {
        method: 'DELETE',
        body: JSON.stringify({ password }),
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

    async saveStickerImage(qrId: string, image: string) {
      return request<{ success: boolean; data: any; stickerImage?: string }>(`/qr/${qrId}/sticker`, {
        method: 'POST',
        body: JSON.stringify({ image }),
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

    async getHistory(productId: string) {
      return request<{ success: boolean; data: any[] }>(`/products/${productId}/history`, {
        method: 'GET',
      });
    },
  },

  // Emergency Alerts Services
  alerts: {
    async createAlert(alertPayload: any) {
      return request<{ success: boolean; data: any; smsResult?: { sent: boolean; simulated: boolean; reason?: string; error?: string } }>('/alerts', {
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

  // Checkout order receipts (backed by Supabase via the Express server — see task.md #6)
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
  },

  // Distributor / Partner Applications (backed by Supabase via the Express server — see task.md #3)
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

  // Twilio Masked Call Proxy Service
  twilio: {
    async callBridge(visitorPhone: string, ownerPhone: string) {
      return request<{ success: boolean; message: string; callSid?: string; maskedHelplineNumber?: string }>('/twilio/call-bridge', {
        method: 'POST',
        body: JSON.stringify({ visitorPhone, ownerPhone }),
      });
    },
  },
};


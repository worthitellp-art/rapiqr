/**
 * Secure Backend API Client Service for NamoQR
 * Routes all Auth, QR, and Alert operations to the Express MVC Server Backend
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

/**
 * True when the frontend is built with a REAL backend URL (not the placeholder).
 * The app prefers the Render/Express API for auth, QR, and alert flows when this
 * is true, and falls back to direct Supabase access otherwise.
 */
export const isApiBackendConfigured = (() => {
  const base = import.meta.env.VITE_API_BASE_URL || '';
  return base.startsWith('http') && !base.includes('YOUR-RENDER-SERVICE');
})();

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('namoqr-token');
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
    async signUp(email: string, password: string, fullName: string) {
      return request<{ success: boolean; token?: string; user?: any }>('/auth/signup', {
        method: 'POST',
        body: JSON.stringify({ email, password, fullName }),
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

  // Emergency Alerts Services
  alerts: {
    async createAlert(alertPayload: any) {
      return request<{ success: boolean; data: any }>('/alerts', {
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
};


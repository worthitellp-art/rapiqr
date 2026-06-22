/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type PageRoute = 'landing' | 'login' | 'signup' | 'dashboard' | 'scan';

export interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  color: string;
  licensePlate: string;
  status: 'active' | 'inactive';
  qrCodeUrl: string; // The URL representing this code
  createdAt: string;
}

export interface QRCodeData {
  id: string; // Unique code (e.g., "QR-8A3F")
  vehicleId: string | null; // Null means unlinked/unassigned
  status: 'active' | 'unlinked';
  scansCount: number;
  createdAt: string;
}

export interface Report {
  id: string;
  vehicleId: string;
  vehicleLabel: string; // Dynamic label like "Tesla Model 3 (Black)"
  licensePlate: string;
  type: 'accident' | 'wrong_parking' | 'contact_owner';
  message: string;
  location: {
    lat: number;
    lng: number;
    accuracy?: number;
    timestamp?: string;
  } | null;
  reporterPhone?: string;
  createdAt: string;
  status: 'unread' | 'acknowledged' | 'resolved';
}

export interface UserProfile {
  email: string;
  fullName: string;
  isLoggedIn: boolean;
  isSubscribed: boolean;
  subscriptionPlan: 'free' | 'pro';
  createdAt: string;
}

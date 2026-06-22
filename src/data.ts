/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Vehicle, QRCodeData, Report, UserProfile } from './types';

export const INITIAL_USER: UserProfile = {
  email: 'mihirrathod95747@gmail.com',
  fullName: 'Mihir Rathod',
  isLoggedIn: true, // Auto-login for high UX fidelity, editable via Settings/Logout!
  isSubscribed: true,
  subscriptionPlan: 'pro',
  createdAt: '2026-05-15T12:00:00Z',
};

export const INITIAL_VEHICLES: Vehicle[] = [
  {
    id: 'V-101',
    make: 'Tesla',
    model: 'Model 3',
    year: 2022,
    color: 'Red',
    licensePlate: 'E-DRIVE8',
    status: 'active',
    qrCodeUrl: 'QR-8A3F',
    createdAt: '2026-05-16T10:00:00Z',
  },
  {
    id: 'V-102',
    make: 'BMW',
    model: 'M4 Coupe',
    year: 2021,
    color: 'Matte Black',
    licensePlate: 'V-FAST9',
    status: 'active',
    qrCodeUrl: 'QR-9K2L',
    createdAt: '2026-05-17T11:30:00Z',
  },
  {
    id: 'V-103',
    make: 'Toyota',
    model: 'RAV4 Hybrid',
    year: 2020,
    color: 'Classic Silver',
    licensePlate: 'A-ADVENT',
    status: 'inactive',
    qrCodeUrl: 'QR-5T7S',
    createdAt: '2026-05-18T14:15:00Z',
  },
];

export const INITIAL_QR_CODES: QRCodeData[] = [
  {
    id: 'QR-8A3F',
    vehicleId: 'V-101',
    status: 'active',
    scansCount: 12,
    createdAt: '2026-05-16T10:05:00Z',
  },
  {
    id: 'QR-9K2L',
    vehicleId: 'V-102',
    status: 'active',
    scansCount: 15,
    createdAt: '2026-05-17T11:35:00Z',
  },
  {
    id: 'QR-5T7S',
    vehicleId: 'V-103',
    status: 'unlinked', // Or active/linked, let's keep status unlinked or linked, status was set in table
    scansCount: 0,
    createdAt: '2026-05-18T14:20:00Z',
  },
];

export const INITIAL_REPORTS: Report[] = [
  {
    id: 'R-201',
    vehicleId: 'V-102',
    vehicleLabel: 'BMW M4 Coupe (Matte Black)',
    licensePlate: 'V-FAST9',
    type: 'wrong_parking',
    message: 'Your car is slightly blocking a fire hydrant. Appreciate if you could pull it forward details on street level.',
    location: {
      lat: 37.7749,
      lng: -122.4194,
      accuracy: 15,
    },
    reporterPhone: '+1 (555) 0192',
    createdAt: '2026-06-19T18:45:00Z',
    status: 'unread',
  },
  {
    id: 'R-202',
    vehicleId: 'V-101',
    vehicleLabel: 'Tesla Model 3 (Red)',
    licensePlate: 'E-DRIVE8',
    type: 'accident',
    message: 'Hello, a delivery rider accidentally brushed against your left mirror while squeezing past. It looks okay but folded in.',
    location: {
      lat: 37.7891,
      lng: -122.4014,
      accuracy: 8,
    },
    reporterPhone: '+1 (555) 0244',
    createdAt: '2026-06-20T00:30:00Z',
    status: 'unread',
  },
];

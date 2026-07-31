/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { NamoProduct, QRCodeData, Report, UserProfile } from './types';

export const INITIAL_USER: UserProfile = {
  email: 'mihirrathod95747@gmail.com',
  fullName: 'Mihir Rathod',
  isLoggedIn: true, // Auto-login for high UX fidelity, editable via Settings/Logout!
  isSubscribed: true,
  subscriptionPlan: 'pro',
  createdAt: '2026-05-15T12:00:00Z',
};

export const INITIAL_VEHICLES: NamoProduct[] = [
  {
    id: 'V101',
    category: 'car',
    name: 'Tesla Model 3',
    status: 'active',
    qrCodeId: 'QR8A3F',
    assignedTo: 'Self',
    createdAt: '2026-05-16T10:00:00Z',
    scansCount: 12,
    warrantyExpiresAt: '2027-05-16T10:00:00Z',
    details: {
      make: 'Tesla',
      model: 'Model 3',
      year: 2022,
      color: 'Red',
      licensePlate: 'E-DRIVE8',
      insuranceDetails: 'HDFC Ergo - Expires Dec 2026',
      serviceReminders: ['Tire rotation due in 2000 km', 'Cabin filter change'],
    },
  },
  {
    id: 'V102',
    category: 'home',
    name: 'Villa Front Gate',
    status: 'active',
    qrCodeId: 'QR9K2L',
    assignedTo: 'Self',
    createdAt: '2026-05-17T11:30:00Z',
    scansCount: 4,
    warrantyExpiresAt: '2027-05-17T11:30:00Z',
    details: {
      houseProfile: 'Villa 42, Sunrise Meadows, Sector 4',
      emergencyInstructions: 'In case of fire/gas leakage, alert gate security (Ext 104) immediately. Main water valve is outside the driveway wall.',
      availabilityStatus: 'away',
      familyContacts: [
        { name: 'Mihir Rathod', relation: 'Owner', phone: '+1 (555) 0192' },
        { name: 'Neha Rathod', relation: 'Spouse', phone: '+1 (555) 0244' }
      ]
    },
  },
  {
    id: 'V103',
    category: 'keychain',
    name: 'Mihir’s Key Ring',
    status: 'active',
    qrCodeId: 'QR5T7S',
    assignedTo: 'Self',
    createdAt: '2026-05-18T14:15:00Z',
    scansCount: 1,
    warrantyExpiresAt: '2027-05-18T14:15:00Z',
    details: {
      bloodGroup: 'O+',
      medicalConditions: 'None',
      allergies: 'Peanuts, Penicillin',
      sosContacts: [
        { name: 'Neha Rathod', phone: '+1 (555) 0244' }
      ],
      liveLocationSharing: true,
    },
  },
  {
    id: 'V104',
    category: 'luggage',
    name: 'Samsonite Duffle Bag',
    status: 'active',
    qrCodeId: 'QR2B9X',
    assignedTo: 'Self',
    createdAt: '2026-05-19T09:00:00Z',
    scansCount: 0,
    warrantyExpiresAt: '2027-05-19T09:00:00Z',
    details: {
      travelMode: true,
      ownerName: 'Mihir Rathod',
      recoverySupportPhone: '+1 (555) 0192',
      lostFoundNote: 'Currently traveling. If found, scan to contact me securely. Reward offered.',
    },
  },
  {
    id: 'V105',
    category: 'child',
    name: 'Aarav’s School Bag',
    status: 'active',
    qrCodeId: 'QR7C3Y',
    assignedTo: 'Aarav (Son)',
    createdAt: '2026-05-20T08:00:00Z',
    scansCount: 3,
    warrantyExpiresAt: '2027-05-20T08:00:00Z',
    details: {
      parentNotificationEmail: 'mihirrathod95747@gmail.com',
      guardianContacts: [
        { name: 'Mihir Rathod', phone: '+1 (555) 0192' },
        { name: 'Neha Rathod', phone: '+1 (555) 0244' }
      ],
      schoolName: 'Oakridge International School',
      pickupVerificationCode: '9574-SAFE',
      busDetails: 'Bus No. 14, Route B (Driver: Mr. Sharma)',
      safeLocations: ['Home', 'School', 'Tennis Club'],
    },
  }
];

export const INITIAL_QR_CODES: QRCodeData[] = [
  {
    id: 'QR8A3F',
    vehicleId: 'V101',
    status: 'active',
    scansCount: 12,
    createdAt: '2026-05-16T10:05:00Z',
    activationCode: 'ACT8A3F',
  },
  {
    id: 'QR9K2L',
    vehicleId: 'V102',
    status: 'active',
    scansCount: 4,
    createdAt: '2026-05-17T11:35:00Z',
    activationCode: 'ACT9K2L',
  },
  {
    id: 'QR5T7S',
    vehicleId: 'V103',
    status: 'active',
    scansCount: 1,
    createdAt: '2026-05-18T14:20:00Z',
    activationCode: 'ACT5T7S',
  },
  {
    id: 'QR2B9X',
    vehicleId: 'V104',
    status: 'active',
    scansCount: 0,
    createdAt: '2026-05-19T09:05:00Z',
    activationCode: 'ACT2B9X',
  },
  {
    id: 'QR7C3Y',
    vehicleId: 'V105',
    status: 'active',
    scansCount: 3,
    createdAt: '2026-05-20T08:05:00Z',
    activationCode: 'ACT7C3Y',
  },
  {
    id: 'QR0Z2A',
    vehicleId: null,
    status: 'unlinked',
    scansCount: 0,
    createdAt: '2026-06-01T10:00:00Z',
    activationCode: 'ACT0Z2A',
  }
];

export const INITIAL_REPORTS: Report[] = [
  {
    id: 'R201',
    vehicleId: 'V101',
    vehicleLabel: 'Tesla Model 3',
    licensePlate: 'E-DRIVE8',
    type: 'wrong_parking',
    message: 'Your car is slightly blocking driveway entrance #14. Could you please pull forward?',
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
    id: 'R202',
    vehicleId: 'V102',
    vehicleLabel: 'Villa Front Gate',
    type: 'courier_arrival',
    message: 'Courier has arrived with a package. Since you are away, I left it with the society gate security guards.',
    location: null,
    reporterPhone: undefined,
    createdAt: '2026-06-20T14:30:00Z',
    status: 'unread',
  },
  {
    id: 'R203',
    vehicleId: 'V105',
    vehicleLabel: 'Aarav’s School Bag',
    type: 'lost_child',
    message: 'Hello, Aarav forgot his school bag at the tennis court bench. It is currently at the club reception desk.',
    location: {
      lat: 37.7891,
      lng: -122.4014,
      accuracy: 8,
    },
    reporterPhone: '+1 (555) 0244',
    createdAt: '2026-06-21T16:15:00Z',
    status: 'acknowledged',
  }
];

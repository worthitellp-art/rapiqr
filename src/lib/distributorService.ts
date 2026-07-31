export interface DistributorApplication {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  phone: string;
  city: string;
  business: string;
  tier: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  approvedAt?: string;
  notes?: string;
}

const STORAGE_KEY = 'namoqr-distributor-applications';
const USER_STATUS_PREFIX = 'namoqr-distributor-user-';

// Seed sample applications if none exist
const INITIAL_DEMO_APPLICATIONS: DistributorApplication[] = [
  {
    id: 'DIST-101',
    userId: 'user-pune-01',
    userName: 'Ramesh Auto Accessories',
    userEmail: 'ramesh.auto@gmail.com',
    phone: '+91 98230 12345',
    city: 'Pune, Maharashtra',
    business: 'Auto Accessories Shop',
    tier: 'City Franchise (300 Units)',
    status: 'pending',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
  },
  {
    id: 'DIST-102',
    userId: 'user-blr-02',
    userName: 'Green Glen Society Security',
    userEmail: 'admin@greenglen.org',
    phone: '+91 99001 88776',
    city: 'Bengaluru, Karnataka',
    business: 'Security Agency / Society Admin',
    tier: 'Retail Kit (50 Units)',
    status: 'approved',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    approvedAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
  }
];

export function getDistributorApplications(): DistributorApplication[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_DEMO_APPLICATIONS));
      return INITIAL_DEMO_APPLICATIONS;
    }
    return JSON.parse(data);
  } catch {
    return INITIAL_DEMO_APPLICATIONS;
  }
}

export function saveDistributorApplication(appData: {
  userId?: string;
  userName: string;
  userEmail: string;
  phone: string;
  city: string;
  business: string;
  tier: string;
}): DistributorApplication {
  const apps = getDistributorApplications();
  
  // Check if existing pending or approved request exists for email/phone
  const existing = apps.find(a => a.userEmail.toLowerCase() === appData.userEmail.toLowerCase() || a.phone === appData.phone);
  if (existing) {
    return existing;
  }

  const newApp: DistributorApplication = {
    id: 'DIST-' + Date.now().toString().slice(-5),
    userId: appData.userId || 'user-' + Date.now(),
    userName: appData.userName,
    userEmail: appData.userEmail,
    phone: appData.phone,
    city: appData.city,
    business: appData.business,
    tier: appData.tier,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };

  const updated = [newApp, ...apps];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  localStorage.setItem(USER_STATUS_PREFIX + (appData.userEmail || appData.phone), JSON.stringify(newApp));
  return newApp;
}

export function updateDistributorApplicationStatus(
  appId: string, 
  status: 'approved' | 'rejected', 
  notes?: string
): DistributorApplication | null {
  const apps = getDistributorApplications();
  let updatedApp: DistributorApplication | null = null;

  const nextApps = apps.map(app => {
    if (app.id === appId) {
      updatedApp = {
        ...app,
        status,
        notes: notes || app.notes,
        approvedAt: status === 'approved' ? new Date().toISOString() : app.approvedAt,
      };
      return updatedApp;
    }
    return app;
  });

  if (updatedApp) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextApps));
    const target = updatedApp as DistributorApplication;
    localStorage.setItem(USER_STATUS_PREFIX + target.userEmail, JSON.stringify(target));
  }

  return updatedApp;
}

export function getUserDistributorApplication(emailOrPhone?: string): DistributorApplication | null {
  if (!emailOrPhone) return null;
  
  // Check user specific status first
  try {
    const saved = localStorage.getItem(USER_STATUS_PREFIX + emailOrPhone);
    if (saved) return JSON.parse(saved);
  } catch {}

  const apps = getDistributorApplications();
  const found = apps.find(a => a.userEmail.toLowerCase() === emailOrPhone.toLowerCase() || a.phone === emailOrPhone);
  return found || null;
}

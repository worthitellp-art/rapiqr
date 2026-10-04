import { apiClient } from './apiClient';

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

/** Admin: fetch every distributor/partner application (backed by the API, not localStorage — task.md #3). */
export async function getDistributorApplications(): Promise<DistributorApplication[]> {
  try {
    const res = await apiClient.distributors.list();
    return res.data || [];
  } catch (err) {
    console.warn('Failed to load distributor applications:', err);
    return [];
  }
}

export async function saveDistributorApplication(appData: {
  userId?: string;
  userName: string;
  userEmail: string;
  phone: string;
  city: string;
  business: string;
  tier: string;
}): Promise<DistributorApplication | null> {
  try {
    const res = await apiClient.distributors.apply(appData);
    return res.data || null;
  } catch (err) {
    console.warn('Failed to submit distributor application:', err);
    return null;
  }
}

export async function updateDistributorApplicationStatus(
  appId: string,
  status: 'approved' | 'rejected',
  notes?: string
): Promise<DistributorApplication | null> {
  try {
    const res = await apiClient.distributors.updateStatus(appId, status, notes);
    return res.data || null;
  } catch (err) {
    console.warn(`Failed to ${status === 'approved' ? 'approve' : 'reject'} distributor application:`, err);
    return null;
  }
}

// `signedInIdentity` only gates the call (no account → nothing to look up): the
// server resolves the application from the session, never from a client-sent value.
export async function getUserDistributorApplication(signedInIdentity?: string): Promise<DistributorApplication | null> {
  if (!signedInIdentity) return null;
  try {
    const res = await apiClient.distributors.myStatus();
    return res.data || null;
  } catch (err) {
    console.warn('Failed to fetch distributor application status:', err);
    return null;
  }
}

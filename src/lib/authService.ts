export interface UserProfileData {
  id: string;
  email: string;
  fullName: string;
  phoneNumber?: string;
  avatarUrl?: string;
  role: 'user' | 'admin';
  twoFactorEnabled?: boolean;
  isPhoneVerified?: boolean;
}

// Used only by the no-backend local demo mode (see AuthContext.signIn/googleSignIn/
// verifyEmailOtp) to preview the admin dashboard without a server. The real admin
// gate is server-side (Server/.env ADMIN_EMAIL, reconciled onto the account's role
// by userModel.reconcileAdminRole) — this constant has no effect once a backend is
// configured, so it must never carry a real person's address into the shipped
// client bundle. Override per-deployment via VITE_ADMIN_EMAIL if the demo mode is
// actually used.
export const ADMIN_EMAIL = (import.meta.env.VITE_ADMIN_EMAIL as string) || 'admin@example.com';

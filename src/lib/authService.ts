export interface UserProfileData {
  id: string;
  email: string;
  fullName: string;
  phoneNumber?: string;
  avatarUrl?: string;
  role: 'user' | 'admin';
  subscriptionPlan?: string;
  isSubscribed?: boolean;
  twoFactorEnabled?: boolean;
  isPhoneVerified?: boolean;
}

export const ADMIN_EMAIL = 'worthitellp@gmail.com';

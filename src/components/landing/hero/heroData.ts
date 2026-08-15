import { Zap, ShieldCheck, MapPin, Users, User, Bell } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

// Real, scannable demo URL — routes through the app's existing /verify/:code
// handler (see ClientDashboard.tsx / ScanPage.tsx), so the QR below is a
// genuine link, not a placeholder image.
export const SCAN_DEMO_URL =
  typeof window !== 'undefined'
    ? `${window.location.origin}/verify/demo`
    : 'https://rapiqr.com/verify/demo';

export interface FeatureCalloutData {
  icon: LucideIcon;
  title: string;
  body: string;
}

export const FEATURE_CALLOUTS: FeatureCalloutData[] = [
  { icon: Zap, title: 'Instant Connection', body: 'Help in seconds' },
  { icon: ShieldCheck, title: '100% Private', body: 'Your identity stays private' },
  { icon: MapPin, title: 'Location Ready', body: 'Help arrives where you are' },
  { icon: Users, title: 'Trusted Network', body: 'Verified responders you can rely on' },
];

export interface BottomFeatureData {
  icon: LucideIcon;
  title: string;
  body: string;
}

export const BOTTOM_FEATURES: BottomFeatureData[] = [
  { icon: ShieldCheck, title: 'Trusted Network', body: 'Verified responders you can rely on' },
  { icon: User, title: 'No App. No Signup.', body: 'Just scan and stay safe' },
  { icon: Bell, title: 'Always Ready', body: 'Reliable support 24/7' },
  { icon: MapPin, title: 'Built for India', body: 'Designed for real-life emergencies' },
];

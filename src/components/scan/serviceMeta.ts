/**
 * Presentation for each service type in SERVICE_TYPES — the icon, colours and
 * example name shown next to a provider.
 *
 * Shared on purpose: the admin's Communication directory and the landing page's
 * "Join us" provider sign-up must offer exactly the same service catalogue, so
 * neither owns this map. The icon is stored as a component (not an element) so
 * each screen can size it itself.
 */

import type { LucideIcon } from "lucide-react";
import {
  Phone, Wrench, Battery, Truck, Settings, Users, Ambulance, ShieldAlert,
  Car, Lightbulb, AlertTriangle, Stethoscope, Droplets, Zap, KeyRound, MoveVertical,
  Package, PackageOpen, Shield, Headset,
} from "lucide-react";
import { slugifyService } from "./tileActions";

export interface ServiceMeta {
  Icon: LucideIcon;
  /** Icon foreground, used on the `bg` tint. */
  color: string;
  bg: string;
  /** Example provider name for the "Provider Name" input. */
  placeholder: string;
}

export const SERVICE_META: Record<string, ServiceMeta> = {
  ambulance:       { Icon: Ambulance,     color: "#DC2626", bg: "#FDEAEA", placeholder: "e.g. City Ambulance Service" },
  towing:          { Icon: Truck,         color: "#DC2626", bg: "#FDEAEA", placeholder: "e.g. Highway Towing 24x7" },
  mechanic:        { Icon: Settings,      color: "#B8863F", bg: "#FBF3E4", placeholder: "e.g. Mobile Mechanic Near Me" },
  flat_tire:       { Icon: Wrench,        color: "#B8863F", bg: "#FBF3E4", placeholder: "e.g. Puncture Repair Service" },
  battery:         { Icon: Battery,       color: "#B8863F", bg: "#FBF3E4", placeholder: "e.g. Battery Jumpstart Helpline" },
  fuel:            { Icon: Truck,         color: "#5C78DF", bg: "#E8EDFF", placeholder: "e.g. Emergency Fuel Delivery" },
  parking:         { Icon: Car,           color: "#5C78DF", bg: "#E8EDFF", placeholder: "e.g. Parking Enforcement Helpline" },
  police:          { Icon: ShieldAlert,   color: "#7B7FD1", bg: "#EDEDFB", placeholder: "e.g. Local Police Control Room" },
  theft:           { Icon: AlertTriangle, color: "#DC2626", bg: "#FDEAEA", placeholder: "e.g. Anti-Theft Rapid Response" },
  headlights:      { Icon: Lightbulb,     color: "#B8863F", bg: "#FBF3E4", placeholder: "e.g. Roadside Light Assist" },
  family:          { Icon: Users,         color: "#2E9E5B", bg: "#E9F9EF", placeholder: "e.g. Father, Mother, Sibling" },
  veterinarian:    { Icon: Stethoscope,   color: "#2E9E5B", bg: "#E9F9EF", placeholder: "e.g. 24x7 Pet Clinic" },
  plumber:         { Icon: Droplets,      color: "#5C78DF", bg: "#E8EDFF", placeholder: "e.g. Emergency Plumbing Service" },
  electrician:     { Icon: Zap,           color: "#B8863F", bg: "#FBF3E4", placeholder: "e.g. On-Call Electrician" },
  locksmith:       { Icon: KeyRound,      color: "#B8863F", bg: "#FBF3E4", placeholder: "e.g. 24x7 Locksmith" },
  lift_technician: { Icon: MoveVertical,  color: "#5C78DF", bg: "#E8EDFF", placeholder: "e.g. Otis Lift Support" },
  courier:         { Icon: Package,       color: "#5C78DF", bg: "#E8EDFF", placeholder: "e.g. Blue Dart Pickup Desk" },
  lost_found:      { Icon: PackageOpen,   color: "#7B7FD1", bg: "#EDEDFB", placeholder: "e.g. Airport Lost & Found" },
  security:        { Icon: Shield,        color: "#7B7FD1", bg: "#EDEDFB", placeholder: "e.g. Society Security Desk" },
  support:         { Icon: Headset,       color: "#17181A", bg: "#F3F3F4", placeholder: "e.g. RepiQR Support Desk" },
};

/** Used for a hand-entered or renamed service type that isn't in the catalogue. */
export const FALLBACK_SERVICE_META: ServiceMeta = {
  Icon: Phone,
  color: "#777B80",
  bg: "#F3F3F4",
  placeholder: "e.g. Provider Name",
};

/** Never returns undefined — an unknown slug falls back rather than blanking the row. */
export function getServiceMeta(slug: string | null | undefined): ServiceMeta {
  return SERVICE_META[slugifyService(slug)] || FALLBACK_SERVICE_META;
}

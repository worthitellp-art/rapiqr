/**
 * CategoryScanView — the scan screen for every sticker category that does not
 * have a bespoke screen of its own (i.e. everything except car and bike).
 *
 * It is a pure renderer. The hero copy, the three mini-stats and the six
 * quick-action tiles come from `CATEGORY_VARIANTS`; the buttons inside each
 * tile's sheet come from `resolveTileButtons`, which reduces every tile to the
 * three reusable actions (SERVICE_PROVIDER / SEND_SMS / CHAT_OWNER) plus
 * whatever public-emergency, Maps, GPS, composer and assistant buttons that
 * tile already had.
 *
 * Nothing is executed here — buttons are handed back to ScanPage through
 * `onButton` (tile sheets) and `onAction` (hero, mini-stats, assistant), so a
 * new category needs a config entry, not new markup.
 */
import React, { useState } from "react";
import {
  Accessibility,
  AlertTriangle,
  Ambulance,
  ArrowLeft,
  BadgeCheck,
  Bell,
  Bike,
  Bot,
  BookOpen,
  Briefcase,
  Building2,
  Cctv,
  Check,
  ChevronRight,
  CreditCard,
  CircleDot,
  CircleParking,
  Cross,
  Droplets,
  DoorOpen,
  FileText,
  Flag,
  Flame,
  Fuel,
  HardHat,
  Headset,
  Hospital,
  IdCard,
  KeyRound,
  Luggage,
  MapPin,
  MessageCircle,
  MoveVertical,
  Navigation,
  Nfc,
  Package,
  PackageOpen,
  PawPrint,
  Phone,
  PhoneCall,
  Plane,
  Send,
  Shield,
  ShieldAlert,
  Siren,
  Sparkles,
  Stethoscope,
  Truck,
  Users,
  Wallet,
  Watch,
  Wind,
  Wrench,
} from "lucide-react";
import { CATEGORY_VARIANTS, BESPOKE_CATEGORIES } from "./categoryVariants";
import type { CategoryVariant, VariantAction, VariantTile } from "./categoryVariants";
import {
  assertTileConfigIsValid,
  resolveTileButtons,
  resolveServiceProviders,
  getServiceType,
  type CategoryButtonAction,
  type ServiceProvider,
} from "./tileActions";

/* A SERVICE_TILES key that no longer matches a tile title just downgrades that
   tile to asset-based — safe, but silent. Surface it while developing so a
   rename in categoryVariants.ts doesn't quietly drop a Service Provider button.
   Stripped from production builds by Vite's dead-code elimination. */
if (import.meta.env.DEV) {
  const problems = assertTileConfigIsValid(CATEGORY_VARIANTS, BESPOKE_CATEGORIES);
  if (problems.length) console.warn("[tileActions] stale button config:\n" + problems.join("\n"));
}

/* The prototype's icon names → the lucide equivalents already used elsewhere
   in the app. Anything unmapped falls back to the alert triangle. */
const ICONS: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  alert: AlertTriangle,
  siren: Siren,
  ambulance: Ambulance,
  pin: MapPin,
  phone: PhoneCall,
  tow: Truck,
  wrench: Wrench,
  park: CircleParking,
  tyre: CircleDot,
  theft: ShieldAlert,
  fuel: Fuel,
  helpline: Headset,
  police: Shield,
  medical: Cross,
  guide: BookOpen,
  people: Users,
  fire: Flame,
  gas: Wind,
  parcel: Package,
  visitor: Building2,
  water: Droplets,
  cctv: Cctv,
  key: KeyRound,
  bell: Bell,
  box: PackageOpen,
  note: FileText,
  flag: Flag,
  paw: PawPrint,
  bag: Briefcase,
  plane: Plane,
  cycle: Bike,
  helmet: HardHat,
  door: DoorOpen,
  building: Building2,
  badge: IdCard,
  nfc: Nfc,
  senior: Accessibility,
  band: Watch,
  wallet: Wallet,
  card: CreditCard,
  lift: MoveVertical,
  hospital: Hospital,
  chat: MessageCircle,
  bot: Bot,
  shield: BadgeCheck,
  headset: Headset,
  luggage: Luggage,
};

function Icon({ name, size = 18, className = "" }: { name: string; size?: number; className?: string }) {
  const Cmp = ICONS[name] || AlertTriangle;
  return <Cmp size={size} className={className} />;
}

/* Tile tints, mirroring the prototype's eight pastel cards. */
const TINTS: Record<string, { bg: string; ring: string; icon: string; text: string }> = {
  rose:   { bg: "bg-rose-50",    ring: "border-rose-100",    icon: "text-rose-600",    text: "group-hover:text-rose-700" },
  blue:   { bg: "bg-blue-50",    ring: "border-blue-100",    icon: "text-blue-600",    text: "group-hover:text-blue-700" },
  cream:  { bg: "bg-amber-50",   ring: "border-amber-100",   icon: "text-amber-700",   text: "group-hover:text-amber-800" },
  violet: { bg: "bg-violet-50",  ring: "border-violet-100",  icon: "text-violet-600",  text: "group-hover:text-violet-700" },
  amber:  { bg: "bg-orange-50",  ring: "border-orange-100",  icon: "text-orange-600",  text: "group-hover:text-orange-700" },
  sky:    { bg: "bg-sky-50",     ring: "border-sky-100",     icon: "text-sky-600",     text: "group-hover:text-sky-700" },
  mint:   { bg: "bg-emerald-50", ring: "border-emerald-100", icon: "text-emerald-600", text: "group-hover:text-emerald-700" },
  peach:  { bg: "bg-pink-50",    ring: "border-pink-100",    icon: "text-pink-600",    text: "group-hover:text-pink-700" },
};

/* Sheet button styles — flat, single-tone surfaces */
const BUTTON_STYLES: Record<string, string> = {
  primary: "bg-[#FDEAEA] text-[#9E0A0A] hover:bg-[#FBDCDC]",
  wa: "bg-[#E4F7EA] text-[#15803D] hover:bg-[#D5F2DF]",
  blue: "bg-[#EAF0FE] text-[#2B5FD9] hover:bg-[#DCE7FD]",
  ghost: "bg-[#F6F6F3] text-[#33332E] hover:bg-[#EFEFEA]",
};

function actionIcon(action: VariantAction) {
  switch (action.kind) {
    case "call": return <Phone size={15} />;
    case "notify": return <MessageCircle size={15} />;
    case "maps": return <Navigation size={15} />;
    case "pin": return <MapPin size={15} />;
    case "write": return <FileText size={15} />;
    case "ask": return <Bot size={15} />;
  }
}

function WhatsAppIcon({ size = 15, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.29.173-1.414-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
    </svg>
  );
}

function buttonIcon(action: CategoryButtonAction) {
  switch (action.actionType) {
    case "SERVICE_PROVIDER": return <Headset size={15} />;
    case "SEND_SMS": return <WhatsAppIcon size={16} />;
    case "CHAT_OWNER": return <MessageCircle size={15} />;
    case "OTHER": return actionIcon(action.action);
  }
}

export interface CategoryScanViewProps {
  variant: CategoryVariant;
  /** Sticker category key ("pet", "luggage", ...) — scopes provider lookups. */
  category: string;
  /** Real tag line for this sticker (plate, flat number, ...); falls back to the variant's sample. */
  tagline?: string | null;
  /** Runs a hero / mini-stat / assistant button. `context` is where it was pressed. */
  onAction: (action: VariantAction, context: string) => void;
  /** Runs a tile-sheet button through the shared category action handler. */
  onButton: (action: CategoryButtonAction, tileTitle: string) => void;
  /** Fires when a tile sheet opens or closes, so the parent can drop stale provider results. */
  onTileChange?: (tile: VariantTile | null) => void;
  /** Active admin-configured service providers, preloaded by ScanPage. */
  providers?: ServiceProvider[];
  /** Providers resolved by the last SERVICE_PROVIDER press, rendered inside the open sheet. */
  providerPanel?: { serviceType: string; providers: ServiceProvider[] } | null;
  /** Sends the free-text message typed into the composer. */
  onSendMessage: (text: string) => void;
  /** Status line under the hero — GPS share result, alert delivery receipt, ... */
  banner?: string | null;
  busy?: boolean;
}

const MAX_MSG = 220;

export default function CategoryScanView({
  variant,
  category,
  tagline,
  onAction,
  onButton,
  onTileChange,
  providers = [],
  providerPanel,
  onSendMessage,
  banner,
  busy = false,
}: CategoryScanViewProps) {
  const [openTile, setOpenTile] = useState<VariantTile | null>(null);
  const [message, setMessage] = useState("");

  /* Opening or leaving a sheet clears whatever the parent resolved for the
     previous tile, so a vet list never lingers on a towing sheet. */
  const changeTile = (tile: VariantTile | null) => {
    setOpenTile(tile);
    onTileChange?.(tile);
  };

  const calm = variant.tone === "calm";
  const heroGradient = calm
    ? "bg-gradient-to-br from-[#FFB020] via-[#F79B14] to-[#F07C13]"
    : "bg-gradient-to-br from-[#D91C1C] via-[#C01515] to-[#800C0C]";

  const send = () => {
    const text = message.trim();
    if (!text) return;
    onSendMessage(text);
    setMessage("");
  };

  /* ── Tile sheet ─────────────────────────────────────────────────────── */
  if (openTile) {
    const tint = TINTS[openTile.tint] || TINTS.rose;
    const buttons = resolveTileButtons(category, openTile, variant);

    /* A SERVICE_PROVIDER button is only worth showing if the admin has actually
       configured someone for this service and category — otherwise the sheet
       shows the empty state in its place rather than a button that can only
       fail. */
    const serviceButton = buttons.find((b) => b.action.actionType === "SERVICE_PROVIDER");
    const serviceType =
      serviceButton?.action.actionType === "SERVICE_PROVIDER" ? serviceButton.action.serviceType : null;
    const hasProvider = serviceType
      ? resolveServiceProviders(providers, serviceType, category).length > 0
      : false;

    const actionButtons = buttons.filter((b) => b.action.actionType !== "SERVICE_PROVIDER" || hasProvider);
    const showEmptyProviderNote = Boolean(serviceButton) && !hasProvider;

    return (
      <div className="space-y-3 animate-fade-in">
        <div className="bg-white rounded-[32px] border border-[#EAEAE5] overflow-hidden">
          <div className="flex items-center gap-2.5 px-4 py-3.5">
            <button
              onClick={() => changeTile(null)}
              className="flex items-center gap-1 text-xs font-bold text-[#62625B] hover:text-[#211922] transition-colors cursor-pointer"
            >
              <ArrowLeft size={14} /> Back
            </button>
            <span className={`ml-auto w-8 h-8 rounded-xl ${tint.bg} flex items-center justify-center`}>
              <Icon name={openTile.icon} size={16} className={tint.icon} />
            </span>
            <p className="text-sm font-bold text-[#211922]">{openTile.title}</p>
          </div>

          <div className="px-4 pb-4 space-y-3">
            {/* Action buttons as a grid of flat boxes, not a stacked list */}
            <div className="grid grid-cols-2 gap-2.5">
              {actionButtons.map((b, i) => (
                <button
                  key={i}
                  disabled={busy}
                  onClick={() => onButton(b.action, openTile.title)}
                  className={`${BUTTON_STYLES[b.style] || BUTTON_STYLES.ghost} font-bold text-[12.5px] rounded-2xl flex flex-col items-center justify-center gap-1.5 aspect-square transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed`}
                >
                  {buttonIcon(b.action)}
                  <span className="text-center leading-tight">{b.label}</span>
                </button>
              ))}
            </div>

            {showEmptyProviderNote && (
              <p className="text-[11.5px] font-semibold text-[#62625B] bg-[#F6F6F3] rounded-2xl px-4 py-3 text-center">
                No service provider available — notify the owner or chat instead.
              </p>
            )}

            {/* Resolved providers — name, number, a real dial link */}
            {providerPanel && providerPanel.serviceType === serviceType && (
              <div className="space-y-1.5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#91918C]">
                  {getServiceType(providerPanel.serviceType)?.label || "Service"} providers
                </p>
                {providerPanel.providers.map((p, n) => (
                  <div
                    key={p.id || n}
                    className="p-3 rounded-2xl border border-[#EAEAE5] bg-white flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-[#211922] leading-tight truncate">{p.label}</p>
                      <p className="text-sm font-mono font-bold text-[#33332E] mt-0.5">{p.phone}</p>
                    </div>
                    <a
                      href={`tel:${String(p.phone).replace(/\s/g, "")}`}
                      className="bg-[#F6C000] hover:bg-[#E0AE00] text-[#4A3900] font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 flex-shrink-0 transition-colors"
                    >
                      <Phone size={13} /> Call
                    </a>
                  </div>
                ))}
              </div>
            )}

            {banner && (
              <p className="text-[11px] font-semibold text-[#62625B] bg-[#F6F6F3] rounded-2xl px-3 py-2">
                {banner}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  /* ── Main view ──────────────────────────────────────────────────────── */
  return (
    <div className="space-y-3 animate-fade-in">
      {/* Hero */}
      <div className={`${heroGradient} rounded-3xl p-4 sm:p-5 text-white shadow-lg relative overflow-hidden space-y-3`}>
        <div className="absolute -right-12 -top-12 w-48 h-48 rounded-full border border-white/10 pointer-events-none" />
        <div className="absolute -right-6 -top-6 w-36 h-36 rounded-full border border-white/10 pointer-events-none" />

        <div className="flex items-start justify-between relative z-10 gap-2">
          <div className="min-w-0">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white mb-2 backdrop-blur-xs">
              <Icon name={variant.heroIcon} size={22} className="text-white" />
            </div>
            <h2 className="text-lg sm:text-xl font-black tracking-tight text-white">{variant.title}</h2>
            <p className="text-xs text-white/80 font-medium mt-0.5">{variant.sub}</p>
            <span className="inline-block mt-2.5 bg-white/20 rounded-full px-3 py-1 text-[9.5px] font-black tracking-wider uppercase">
              {tagline || variant.tagline}
            </span>
          </div>

          <div className="flex-shrink-0 pt-1 opacity-90">
            <Icon name={variant.beacon} size={38} className="text-white" />
          </div>
        </div>

        {/* 3 mini stats — each one is a real button */}
        <div className="grid grid-cols-3 divide-x divide-white/20 py-1 border-y border-white/15 text-center text-white relative z-10">
          {variant.mini.map((m, i) => (
            <button
              key={i}
              disabled={busy}
              onClick={() => onAction(m.action, m.line1 + " " + m.line2)}
              className="flex flex-col items-center px-1 py-1.5 rounded-xl hover:bg-white/10 active:scale-98 transition-all cursor-pointer disabled:opacity-60"
            >
              <Icon name={m.icon} size={16} className="text-white mb-1" />
              <span className="text-[11px] font-bold leading-tight">{m.line1}</span>
              <span className="text-[10px] text-white/80">{m.line2}</span>
            </button>
          ))}
        </div>

        <button
          disabled={busy}
          onClick={() => onAction({ kind: "notify", text: variant.alert }, "hero")}
          className={`w-full bg-white hover:bg-gray-50 font-black py-3 px-6 rounded-full flex items-center justify-center gap-3 shadow-md active:scale-98 transition-all cursor-pointer group relative z-10 disabled:opacity-70 ${calm ? "text-[#B45309]" : "text-[#C01515]"}`}
        >
          <span className={`w-8 h-8 rounded-full text-white flex items-center justify-center group-hover:scale-105 transition-transform flex-shrink-0 ${calm ? "bg-[#B45309]" : "bg-[#C01515]"}`}>
            <PhoneCall size={16} className="fill-white text-white" />
          </span>
          <span className="text-base sm:text-lg font-black tracking-wider">{variant.cta}</span>
        </button>

        {banner && (
          <p className="relative z-10 text-[11px] font-bold text-white/90 bg-black/15 rounded-xl px-3 py-2">{banner}</p>
        )}
      </div>

      {/* Quick actions */}
      <div className="bg-white rounded-3xl p-3.5 sm:p-4 border border-gray-100 shadow-sm space-y-2.5">
        <div className="flex items-center justify-between">
          <h3 className="text-sm sm:text-base font-bold text-gray-900">Quick Actions</h3>
          <span className="text-xs text-gray-400 font-normal">Tap on any service</span>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {variant.tiles.map((tile, i) => {
            const tint = TINTS[tile.tint] || TINTS.rose;
            return (
              <button
                key={i}
                onClick={() => changeTile(tile)}
                className={`group ${tint.bg} border ${tint.ring} rounded-2xl p-2.5 flex flex-col items-center gap-1.5 text-center hover:shadow-md active:scale-98 transition-all cursor-pointer`}
              >
                <span className="w-9 h-9 rounded-xl bg-white/80 flex items-center justify-center shadow-xs">
                  <Icon name={tile.icon} size={18} className={tint.icon} />
                </span>
                <span className={`text-[11px] font-bold text-gray-900 leading-tight ${tint.text} transition-colors`}>
                  {tile.title}
                </span>
                <span className="text-[9.5px] text-gray-500 leading-tight">{tile.sub}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Unified Message Owner & AI Assistant Section */}
      <div className="bg-white rounded-3xl p-3.5 sm:p-4 border border-gray-100 shadow-sm space-y-3">
        {/* Message the owner header */}
        <div className="flex items-center gap-2">
          <span className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center">
            <MessageCircle size={17} className="text-emerald-600" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-black text-gray-900 leading-tight">{variant.owner}</p>
            <p className="text-[10.5px] text-gray-400 font-semibold">{variant.ownerSub}</p>
          </div>
        </div>

        {/* Message composer input */}
        <div className="space-y-1">
          <div className="flex gap-2">
            <input
              id="variant-composer"
              value={message}
              maxLength={MAX_MSG}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") send(); }}
              placeholder={variant.placeholder}
              className="flex-1 min-w-0 border border-gray-200 bg-gray-50 rounded-2xl px-3.5 py-3 text-[12.5px] font-medium text-gray-900 outline-none focus:border-gray-400 transition-colors"
            />
            <button
              onClick={send}
              disabled={busy || !message.trim()}
              className="flex-none w-12 rounded-2xl bg-gradient-to-br from-[#FF9A1F] to-[#F0562A] text-white flex items-center justify-center shadow-md active:scale-95 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="Send message"
            >
              <Send size={17} />
            </button>
          </div>
          <p className="text-[10px] text-gray-400 font-semibold text-right">{message.length}/{MAX_MSG}</p>
        </div>

        {/* Subtle section divider */}
        <div className="border-t border-gray-100 pt-0.5" />

        {/* Assistant action row */}
        <button
          type="button"
          onClick={() => onAction({ kind: "ask" }, "assistant")}
          className="w-full bg-gray-50/80 hover:bg-violet-50/60 border border-gray-100 hover:border-violet-200 rounded-2xl p-3 flex items-center gap-3 text-left transition-all active:scale-98 cursor-pointer group"
        >
          <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center flex-shrink-0 shadow-sm group-hover:scale-105 transition-transform">
            <Sparkles size={18} className="text-white" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-black text-gray-900 leading-tight">Ask the RepiQR Assistant</span>
            <span className="block text-[11px] text-gray-400 font-semibold mt-0.5 truncate">{variant.aiHello}</span>
          </span>
          <ChevronRight size={17} className="text-gray-400 group-hover:text-violet-500 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
        </button>
      </div>

    </div>
  );
}

import React, { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft, Check, CheckCircle2, Mail, AlertCircle,
  MapPin, LocateFixed, Search, Plus, Trash2, Sun, Moon, CalendarClock, Zap,
  ShieldCheck, Info, Clock, Shield, Sparkles, Building2, Phone,
} from 'lucide-react';
import lightBgLogo from '../../../assets/logo for wh bg.png';
import PhoneInputWithCountry from '../common/PhoneInputWithCountry';
import AutocompleteField from '../common/AutocompleteField';
import { SERVICE_TYPES } from '../scan/tileActions';
import { getServiceMeta } from '../scan/serviceMeta';
import { STICKER_CATEGORIES } from '../../stickerModules';
import { apiClient } from '../../lib/apiClient';
import { FlowButton } from '../ui/flow-button';
import { INDIAN_CITIES, INDIAN_CITY_NAMES, COUNTRIES } from '../../data/locations';

// Leaflet is heavy and only the Location/Coverage steps need it — load on demand.
const RadiusMap = lazy(() => import('../common/RadiusMap'));

const PIN_PATTERN = /^[1-9]\d{5}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_RADIUS_KM = 1;
const MAX_RADIUS_KM = 150;
const RADIUS_OPTIONS = [5, 10, 15, 25, 50, 75, 100];
const EXPERIENCE_OPTIONS = ['New to this', '1–3 years', '3–5 years', '5–10 years', '10+ years'];

interface JoinUsPageProps {
  onBack: () => void;
  initialServiceType?: string;
}

const JOIN_BENEFITS = [
  {
    title: 'Private Number Masking',
    desc: 'Nearby scans route to your phone through a secure masked bridge. Your real number stays confidential.',
  },
  {
    title: 'Custom Categories & Reach',
    desc: 'Choose the exact sticker categories you service (vehicles, pets, bags, home) and set your travel radius.',
  },
  {
    title: 'Zero Listing or Platform Fees',
    desc: 'Free to join. Every provider profile is vetted for safety before listing to keep trust high.',
  },
];

const WIZARD_STEPS = ['Service', 'Location', 'Coverage', 'Availability', 'Details', 'Review'];

type AvailabilityType = 'always' | 'daytime' | 'night' | 'custom';
type HoursMode = 'same' | 'perday';
interface DayHours { open: string; close: string; closed: boolean }
const DAYS = [
  { key: 'mon', label: 'Monday' }, { key: 'tue', label: 'Tuesday' }, { key: 'wed', label: 'Wednesday' },
  { key: 'thu', label: 'Thursday' }, { key: 'fri', label: 'Friday' }, { key: 'sat', label: 'Saturday' },
  { key: 'sun', label: 'Sunday' },
];
const DEFAULT_DAY_HOURS: DayHours = { open: '09:00', close: '18:00', closed: false };

interface ServiceArea { id: string; name: string; radiusKm: number }

const AVAILABILITY_OPTIONS: { value: AvailabilityType; Icon: typeof Zap; label: string; sub: string }[] = [
  { value: 'always', Icon: Zap, label: '24/7 Service', sub: 'Available round the clock for emergencies' },
  { value: 'daytime', Icon: Sun, label: 'Daytime', sub: 'Standard business hours (Morning to Evening)' },
  { value: 'night', Icon: Moon, label: 'Night Shift', sub: 'Evening to early morning assistance' },
  { value: 'custom', Icon: CalendarClock, label: 'Custom Hours', sub: 'Define your specific operating schedule' },
];

/** Cities in the same state as `cityName` — real, project-defined data, never invented. */
function nearbyCities(cityName: string): string[] {
  const match = INDIAN_CITIES.find((c) => c.name.toLowerCase() === cityName.trim().toLowerCase());
  if (!match) return [];
  return INDIAN_CITIES.filter((c) => c.state === match.state && c.name.toLowerCase() !== match.name.toLowerCase())
    .map((c) => c.name)
    .slice(0, 6);
}

function radiusToPixels(km: number): number {
  const minR = 28;
  const maxR = 100;
  const t = Math.min(1, Math.sqrt(Math.max(km, 0)) / Math.sqrt(MAX_RADIUS_KM));
  return minR + t * (maxR - minR);
}

/** Clean illustrative coverage visual */
function CoverageVisual({ km, city }: { km: number; city: string }) {
  const r = radiusToPixels(km);
  return (
    <div className="flex flex-col items-center gap-3 rounded-md border border-neutral-200 bg-neutral-50/70 p-6">
      <div className="relative flex h-[200px] w-[200px] items-center justify-center">
        <div className="absolute rounded-full border border-dashed border-neutral-300" style={{ width: 190, height: 190 }} />
        <div
          className="absolute rounded-full border-2 border-neutral-900 bg-neutral-900/10 transition-all duration-300"
          style={{ width: r * 2, height: r * 2 }}
        />
        <div className="relative z-10 flex h-9 w-9 items-center justify-center rounded-full bg-neutral-900 text-white shadow-md">
          <MapPin size={16} />
        </div>
      </div>
      <div className="text-center">
        <p className="text-xs font-semibold text-neutral-900">{city || 'Base location'} · ~{km} KM coverage radius</p>
        <p className="mt-1 text-[11px] text-neutral-500">
          Estimated dispatch area for assistance requests
        </p>
      </div>
    </div>
  );
}

export default function JoinUsPage({ onBack, initialServiceType }: JoinUsPageProps) {
  const defaultService = SERVICE_TYPES.some((type) => type.slug === initialServiceType)
    ? initialServiceType!
    : SERVICE_TYPES[0].slug;

  const [step, setStep] = useState(0);
  const [showStepError, setShowStepError] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  // Step 0 — Service
  const [serviceType, setServiceType] = useState(defaultService);
  const [categories, setCategories] = useState<string[]>([]);

  // Step 1 — Location
  const [city, setCity] = useState('');
  const [state, setStateName] = useState('');
  const [country, setCountry] = useState('India');
  const [address, setAddress] = useState('');
  const [area, setArea] = useState('');
  const [pincode, setPincode] = useState('');
  // Map position — the centre of the selected city, then wherever the pin is dragged.
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [mapLoading, setMapLoading] = useState(false);

  // Step 2 — Coverage
  const [radiusKm, setRadiusKm] = useState(15);
  const [customRadius, setCustomRadius] = useState('');
  const [useCustomRadius, setUseCustomRadius] = useState(false);
  const [radiusTouched, setRadiusTouched] = useState(false);
  const [serviceAreas, setServiceAreas] = useState<ServiceArea[]>([]);
  const [addingArea, setAddingArea] = useState(false);
  const [newAreaName, setNewAreaName] = useState('');
  const [newAreaRadius, setNewAreaRadius] = useState(10);

  // Step 3 — Availability
  const [availabilityType, setAvailabilityType] = useState<AvailabilityType>('always');
  const [hoursMode, setHoursMode] = useState<HoursMode>('same');
  const [sameHours, setSameHours] = useState({ open: '09:00', close: '18:00' });
  const [perDayHours, setPerDayHours] = useState<Record<string, DayHours>>(
    DAYS.reduce((acc, d) => ({ ...acc, [d.key]: { ...DEFAULT_DAY_HOURS } }), {})
  );

  // Step 4 — Details
  const [label, setLabel] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsappSame, setWhatsappSame] = useState(true);
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [yearsExperience, setYearsExperience] = useState('');
  const [notes, setNotes] = useState('');
  const [touchedEmail, setTouchedEmail] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [step]);

  const service = useMemo(
    () => SERVICE_TYPES.find((type) => type.slug === serviceType) || SERVICE_TYPES[0],
    [serviceType]
  );
  const serviceMeta = useMemo(() => getServiceMeta(service.slug), [service.slug]);

  const toggleCategory = (val: string) => {
    setCategories((cur) => (cur.includes(val) ? cur.filter((c) => c !== val) : [...cur, val]));
  };

  // The user nudged the pin — it only fine-tunes the base point; typed address fields are never overwritten.
  const handlePinMove = (lat: number, lng: number) => setCoords({ lat, lng });

  // PIN typed by hand → fill area/city/state (only the blanks, never overwriting what the user entered).
  useEffect(() => {
    if (country.trim().toLowerCase() !== 'india' || !PIN_PATTERN.test(pincode)) return;
    const controller = new AbortController();
    apiClient.geo
      .pincode(pincode, controller.signal)
      .then((res) => {
        const d = res.data;
        setArea((cur) => cur || d.area || '');
        setCity((cur) => cur || d.city || '');
        setStateName((cur) => cur || d.state || '');
      })
      .catch(() => { /* optional convenience — ignore failures */ });
    return () => controller.abort();
  }, [pincode, country]);

  // The map loads only once a real city is picked from the list: look its centre
  // up server-side, then let the user fine-tune the pin. Editing the city away
  // from a listed name clears the map again.
  const selectedCity = useMemo(
    () => INDIAN_CITIES.find((c) => c.name.toLowerCase() === city.trim().toLowerCase()) ?? null,
    [city]
  );
  useEffect(() => {
    if (!selectedCity) {
      setCoords(null);
      setMapLoading(false);
      return;
    }
    const controller = new AbortController();
    setMapLoading(true);
    apiClient.geo
      .forward(`${selectedCity.name}, ${selectedCity.state}, India`, controller.signal)
      .then((res) => {
        if (controller.signal.aborted) return;
        setCoords({ lat: res.data.latitude, lng: res.data.longitude });
        setMapLoading(false);
      })
      .catch(() => {
        if (!controller.signal.aborted) setMapLoading(false); // map just stays hidden
      });
    return () => controller.abort();
  }, [selectedCity]);

  const effectiveRadius = useMemo(() => {
    if (useCustomRadius) {
      const n = parseInt(customRadius, 10);
      return Number.isFinite(n) ? n : 0;
    }
    return radiusKm;
  }, [useCustomRadius, customRadius, radiusKm]);

  const radiusValid = effectiveRadius >= MIN_RADIUS_KM && effectiveRadius <= MAX_RADIUS_KM;

  const suggestions = useMemo(() => (city ? nearbyCities(city) : []), [city]);

  const addServiceArea = () => {
    if (!newAreaName.trim()) return;
    setServiceAreas((cur) => [
      ...cur,
      { id: `${Date.now()}-${newAreaName}`, name: newAreaName.trim(), radiusKm: newAreaRadius },
    ]);
    setNewAreaName('');
    setAddingArea(false);
  };

  const removeServiceArea = (id: string) => {
    setServiceAreas((cur) => cur.filter((a) => a.id !== id));
  };

  // A PIN is optional, but if given for India it must be a real 6-digit PIN.
  const pinValid = !pincode.trim() || country.trim().toLowerCase() !== 'india' || PIN_PATTERN.test(pincode.trim());
  const emailValid = !email.trim() || EMAIL_PATTERN.test(email.trim());
  const phoneDigits = phone.replace(/\D/g, '');
  const phoneValid = phoneDigits.length >= 10;
  const whatsappDigits = whatsapp.replace(/\D/g, '');
  const whatsappValid = whatsappSame || (whatsappDigits.length >= 10);

  const stepValid = useMemo(() => {
    switch (step) {
      case 0:
        return !!serviceType;
      case 1:
        return !!city.trim() && pinValid;
      case 2:
        return radiusValid;
      case 3:
        return true;
      case 4:
        return !!label.trim() && phoneValid && whatsappValid && emailValid;
      case 5:
        return true;
      default:
        return false;
    }
  }, [step, serviceType, city, pinValid, radiusValid, label, phoneValid, whatsappValid, emailValid]);

  const goNext = () => {
    if (!stepValid) {
      setShowStepError(true);
      return;
    }
    setShowStepError(false);
    setStep((s) => Math.min(WIZARD_STEPS.length - 1, s + 1));
  };

  const goBack = () => {
    setShowStepError(false);
    if (step === 0) onBack();
    else setStep((s) => s - 1);
  };

  const availabilitySummary = useMemo(() => {
    if (availabilityType === 'always') return '24/7 Round the clock';
    if (availabilityType === 'daytime') return 'Daytime';
    if (availabilityType === 'night') return 'Night hours';
    if (hoursMode === 'same') return `Everyday ${sameHours.open} – ${sameHours.close}`;
    const openDays = DAYS.filter((d) => !perDayHours[d.key]?.closed).length;
    return `${openDays} days/week (Custom hours)`;
  }, [availabilityType, hoursMode, sameHours, perDayHours]);

  const handleSubmit = async () => {
    if (!stepValid) return;
    setSubmitting(true);
    setError('');
    let saved = null;
    try {
      const res = await apiClient.helplines.apply({
        category: service.legacy || service.label,
        serviceType: service.slug,
        categories,
        label: label.trim(),
        phone: phone.trim(),
        email: email.trim(),
        city: city.trim(),
        country: country.trim(),
        address: address.trim() || undefined,
        area: area.trim() || undefined,
        state: state.trim() || undefined,
        pincode: pincode.trim() || undefined,
        latitude: coords?.lat,
        longitude: coords?.lng,
        notes: notes.trim(),
        whatsapp: whatsappSame ? phone.trim() : whatsapp.trim(),
        yearsExperience: yearsExperience || undefined,
        radiusKm: effectiveRadius,
        serviceAreas: serviceAreas.map((a) => ({ name: a.name, radiusKm: a.radiusKm })),
        availability:
          availabilityType === 'always'
            ? { type: 'available_24_7' as const }
            : availabilityType === 'custom'
              ? { type: 'custom' as const, hours: hoursMode === 'same' ? { all: sameHours } : perDayHours }
              : { type: availabilityType },
      });
      saved = res.data || null;
    } catch (err) {
      console.warn('Provider application submit failed:', err);
    }
    setSubmitting(false);
    if (saved) setSubmitted(true);
    else setError("We couldn't submit your application just now. Please try again.");
  };

  const stepLabel = (n: number) => `Step ${n + 1} of ${WIZARD_STEPS.length}`;

  return (
    <main className="min-h-screen bg-neutral-50/50 text-neutral-900">
      {/* HEADER */}
      <header className="sticky top-0 z-30 border-b border-neutral-200 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-8">
          <button
            onClick={goBack}
            className="flex cursor-pointer items-center gap-2 text-xs font-semibold text-neutral-600 transition-colors hover:text-neutral-900"
          >
            <ArrowLeft size={15} /> {step === 0 || submitted ? 'Back to home' : 'Back'}
          </button>
          <div className="flex items-center gap-3">
            <img src={lightBgLogo} alt="RepiQR" className="h-7 w-auto object-contain" />
            <span className="hidden h-4 w-px bg-neutral-200 sm:inline-block" />
            <span className="hidden text-[11px] font-semibold uppercase tracking-wider text-neutral-500 sm:inline-block">
              Partner Network
            </span>
          </div>
          <div className="flex items-center gap-2">
            {!submitted && (
              <span className="rounded-sm bg-neutral-100 px-2.5 py-1 text-[11px] font-medium text-neutral-600">
                {stepLabel(step)}
              </span>
            )}
          </div>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-8 sm:py-12">
        {submitted ? (
          /* SUCCESS SCREEN */
          <div className="mx-auto max-w-lg rounded-md border border-neutral-200 bg-white p-8 sm:p-10 shadow-sm text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-md bg-emerald-50 text-emerald-600">
              <CheckCircle2 size={32} />
            </div>
            <h2 className="mt-5 font-serif text-2xl sm:text-3xl font-medium tracking-tight text-neutral-900">
              Application Submitted
            </h2>
            <p className="mt-3 text-sm text-neutral-600 leading-relaxed">
              Thank you, <span className="font-semibold text-neutral-900">{label}</span>. We have received your {service.label} partner application for <span className="font-semibold text-neutral-900">{city}</span>.
            </p>
            <div className="mt-6 rounded-md bg-neutral-50 p-4 text-left border border-neutral-150 space-y-2 text-xs text-neutral-700">
              <div className="flex items-center gap-2">
                <Check size={14} className="text-emerald-600 shrink-0" />
                <span>Details &amp; coverage radius recorded</span>
              </div>
              <div className="flex items-center gap-2">
                <Check size={14} className="text-emerald-600 shrink-0" />
                <span>Phone number ({phone}) queued for verification</span>
              </div>
              <div className="flex items-center gap-2">
                <Check size={14} className="text-emerald-600 shrink-0" />
                <span>Masked call routing will be activated upon approval</span>
              </div>
            </div>
            <FlowButton tone="dark" size="sm" className="mt-8" onClick={onBack}>
              Return to Homepage
            </FlowButton>
          </div>
        ) : (
          /* 2-COLUMN BALANCED WIZARD LAYOUT */
          <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:gap-12 lg:items-start">
            {/* LEFT COLUMN: HERO CONTEXT (STEP 0) OR LIVE APPLICATION SUMMARY (STEP > 0) */}
            <div className="lg:sticky lg:top-24 space-y-6">
              {step === 0 ? (
                <div>
                  <div className="inline-flex items-center gap-1.5 rounded-sm bg-neutral-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-neutral-700">
                    <Sparkles size={12} className="text-neutral-900" />
                    Service Network
                  </div>
                  <h1 className="mt-4 font-serif text-3xl sm:text-4xl lg:text-5xl font-medium tracking-tight text-neutral-900 leading-[1.08]">
                    Be the help someone finds.
                  </h1>
                  <p className="mt-4 text-sm sm:text-base text-neutral-600 leading-relaxed font-normal">
                    Join the RepiQR service partner network. Connect with nearby customers in need of urgent roadside, medical, or key assistance through privacy-masked calls.
                  </p>

                  <div className="mt-8 space-y-3.5 border-t border-neutral-200 pt-6">
                    {JOIN_BENEFITS.map((benefit) => (
                      <div key={benefit.title} className="rounded-md border border-neutral-200/80 bg-white p-4 shadow-2xs">
                        <div className="flex items-start gap-3">
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-neutral-100 text-neutral-900 mt-0.5">
                            <CheckCircle2 size={16} />
                          </div>
                          <div>
                            <h4 className="text-xs font-semibold text-neutral-900">{benefit.title}</h4>
                            <p className="mt-1 text-xs text-neutral-500 leading-relaxed">{benefit.desc}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 flex items-center gap-2 text-xs text-neutral-500">
                    <ShieldCheck size={16} className="text-neutral-900 shrink-0" />
                    <span>Zero spam guarantee · Verified provider badge upon review</span>
                  </div>
                </div>
              ) : (
                /* LIVE APPLICATION SUMMARY SIDEBAR ON STEPS 1-5 */
                <div className="space-y-4">
                  <div className="rounded-md border border-neutral-200 bg-white p-6 shadow-2xs">
                    <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                          Application Summary
                        </p>
                        <h3 className="mt-0.5 text-base font-semibold text-neutral-900">
                          {label.trim() || 'Service Provider Profile'}
                        </h3>
                      </div>
                      <span className="rounded-sm bg-neutral-100 px-2 py-1 text-[11px] font-semibold text-neutral-700">
                        {stepLabel(step)}
                      </span>
                    </div>

                    <div className="mt-4 space-y-3 text-xs">
                      {/* Service Category */}
                      <div className="flex items-center gap-3 rounded-md bg-neutral-50 p-2.5 border border-neutral-100">
                        <div
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-sm"
                          style={{ backgroundColor: serviceMeta.bg, color: serviceMeta.color }}
                        >
                          <serviceMeta.Icon size={16} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-neutral-900 truncate">{service.label}</p>
                          <p className="text-[11px] text-neutral-500">Primary Service Offering</p>
                        </div>
                      </div>

                      {/* City / Location */}
                      <div className="flex items-center gap-2.5 text-neutral-700">
                        <MapPin size={15} className="text-neutral-400 shrink-0" />
                        <span className="font-medium">
                          {city.trim() ? `${city}${state ? `, ${state}` : ''}` : 'Location pending selection'}
                        </span>
                      </div>

                      {/* Coverage Radius */}
                      <div className="flex items-center gap-2.5 text-neutral-700">
                        <LocateFixed size={15} className="text-neutral-400 shrink-0" />
                        <span className="font-medium">
                          {effectiveRadius > 0 ? `~${effectiveRadius} KM radius` : 'Coverage radius not set'}
                          {serviceAreas.length > 0 && ` (+${serviceAreas.length} extra area${serviceAreas.length > 1 ? 's' : ''})`}
                        </span>
                      </div>

                      {/* Working Hours */}
                      <div className="flex items-center gap-2.5 text-neutral-700">
                        <Clock size={15} className="text-neutral-400 shrink-0" />
                        <span className="font-medium">{availabilitySummary}</span>
                      </div>

                      {/* Contact Preview */}
                      {phone.trim() && (
                        <div className="flex items-center gap-2.5 text-neutral-700">
                          <Phone size={15} className="text-neutral-400 shrink-0" />
                          <span className="font-medium">{phone} (Protected via masked relay)</span>
                        </div>
                      )}
                    </div>

                    {categories.length > 0 && (
                      <div className="mt-4 border-t border-neutral-100 pt-3">
                        <p className="text-[11px] font-medium text-neutral-500 mb-2">Supported Categories:</p>
                        <div className="flex flex-wrap gap-1.5">
                          {categories.map((c) => (
                            <span
                              key={c}
                              className="rounded-sm bg-neutral-100 px-2 py-0.5 text-[11px] font-medium text-neutral-700"
                            >
                              {STICKER_CATEGORIES.find((s) => s.value === c)?.label || c}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Trust assurance card */}
                  <div className="rounded-md border border-neutral-200/80 bg-neutral-50 p-4">
                    <div className="flex items-start gap-3">
                      <Shield size={16} className="text-neutral-800 mt-0.5 shrink-0" />
                      <div>
                        <h5 className="text-xs font-semibold text-neutral-900">Privacy &amp; Safety Standard</h5>
                        <p className="mt-1 text-[11px] text-neutral-600 leading-relaxed">
                          Your phone number is stored on encrypted servers and never displayed publicly. When a user requests assistance, our system connects you via a private masked bridge.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* RIGHT COLUMN: WIZARD FORM CARD */}
            <div className="rounded-md border border-neutral-200 bg-white p-6 sm:p-8 shadow-xs">
              <div className="space-y-6">
                {/* Progress bar */}
                <div className="border-b border-neutral-100 pb-5">
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                      Step {step + 1} of {WIZARD_STEPS.length} · {WIZARD_STEPS[step]}
                    </p>
                    <span className="text-xs font-semibold text-neutral-900">
                      {Math.round(((step + 1) / WIZARD_STEPS.length) * 100)}%
                    </span>
                  </div>
                  <div className="mt-3 flex gap-1.5">
                    {WIZARD_STEPS.map((stepName, idx) => (
                      <div
                        key={stepName}
                        className={`h-1.5 flex-1 rounded-full transition-colors ${
                          idx <= step ? 'bg-neutral-900' : 'bg-neutral-200'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {showStepError && !stepValid && (
                  <div className="flex items-center gap-2 rounded-md bg-red-50 border border-red-200 px-3.5 py-2.5 text-xs font-semibold text-red-700">
                    <AlertCircle size={15} className="shrink-0" />
                    <span>Please complete all required fields before proceeding.</span>
                  </div>
                )}

                {/* STEP 0 — SERVICE SELECTION */}
                {step === 0 && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="font-serif text-xl sm:text-2xl font-medium tracking-tight text-neutral-900">
                        Which service do you provide?
                      </h2>
                      <p className="mt-1 text-xs text-neutral-500">
                        Select your primary specialty. You can adjust this or add more services later.
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                      {SERVICE_TYPES.filter((type) => type.slug !== 'police').map((type) => {
                        const meta = getServiceMeta(type.slug);
                        const selected = serviceType === type.slug;
                        const Icon = meta.Icon;
                        return (
                          <button
                            type="button"
                            key={type.slug}
                            onClick={() => setServiceType(type.slug)}
                            className={`flex min-h-[92px] cursor-pointer flex-col items-start gap-2.5 rounded-md border p-3.5 text-left transition-all ${
                              selected
                                ? 'border-neutral-900 bg-neutral-900 text-white shadow-xs'
                                : 'border-neutral-200 bg-white hover:border-neutral-300'
                            }`}
                          >
                            <div
                              className="flex h-8 w-8 items-center justify-center rounded-md"
                              style={{
                                backgroundColor: selected ? 'rgba(255,255,255,0.15)' : meta.bg,
                                color: selected ? '#FFFFFF' : meta.color,
                              }}
                            >
                              <Icon size={16} />
                            </div>
                            <span className={`text-xs font-semibold leading-tight ${selected ? 'text-white' : 'text-neutral-800'}`}>
                              {type.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    <div className="border-t border-neutral-100 pt-5">
                      <label className="mb-2 block text-xs font-semibold text-neutral-700">
                        Tag categories covered <span className="font-normal text-neutral-400">(optional)</span>
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {STICKER_CATEGORIES.map((category) => {
                          const selected = categories.includes(category.value);
                          return (
                            <button
                              type="button"
                              key={category.value}
                              onClick={() => toggleCategory(category.value)}
                              className={`flex cursor-pointer items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs transition-colors ${
                                selected
                                  ? 'border-neutral-900 bg-neutral-900 text-white font-medium'
                                  : 'border-neutral-200 text-neutral-600 hover:border-neutral-300'
                              }`}
                            >
                              {selected && <Check size={12} />}
                              {category.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 1 — LOCATION */}
                {step === 1 && (
                  <div className="space-y-5">
                    <div>
                      <h2 className="font-serif text-xl sm:text-2xl font-medium tracking-tight text-neutral-900">
                        Where is your base location?
                      </h2>
                      <p className="mt-1 text-xs text-neutral-500">
                        Customers scanning tags nearby will be routed based on your base city.
                      </p>
                    </div>

                    <div>
                      <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-neutral-700">
                        <Search size={13} /> Base city *
                      </label>
                      <AutocompleteField
                        label=""
                        value={city}
                        onChange={(v) => {
                          setCity(v);
                          setStateName('');
                        }}
                        onSelect={(v) => setStateName(INDIAN_CITIES.find((c) => c.name === v)?.state || '')}
                        suggestions={INDIAN_CITY_NAMES}
                        placeholder="Select your city"
                        inputClassName="w-full rounded-md border border-neutral-200 px-3.5 py-2.5 text-sm outline-none focus:border-neutral-900 transition-colors"
                      />
                    </div>

                    {mapLoading && <div className="h-64 w-full animate-pulse rounded-md bg-neutral-100" />}
                    {coords && !mapLoading && (
                      <div className="space-y-1.5">
                        <Suspense fallback={<div className="h-64 w-full animate-pulse rounded-md bg-neutral-100" />}>
                          <RadiusMap latitude={coords.lat} longitude={coords.lng} onMove={handlePinMove} />
                        </Suspense>
                        <p className="text-[11px] text-neutral-500">Drag the pin to fine-tune your base point.</p>
                      </div>
                    )}

                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-neutral-700">
                        Full address <span className="font-normal text-neutral-400">(optional)</span>
                      </label>
                      <input
                        type="text"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="Building, street"
                        className="w-full rounded-md border border-neutral-200 px-3.5 py-2.5 text-sm outline-none focus:border-neutral-900 transition-colors"
                      />
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div>
                        <label className="mb-1.5 block text-xs font-semibold text-neutral-700">
                          Area / locality <span className="font-normal text-neutral-400">(optional)</span>
                        </label>
                        <input
                          type="text"
                          value={area}
                          onChange={(e) => setArea(e.target.value)}
                          className="w-full rounded-md border border-neutral-200 px-3.5 py-2.5 text-sm outline-none focus:border-neutral-900 transition-colors"
                        />
                      </div>
                      <div>
                        <label className="mb-1.5 block text-xs font-semibold text-neutral-700">
                          PIN code <span className="font-normal text-neutral-400">(optional)</span>
                        </label>
                        <input
                          type="text"
                          inputMode="numeric"
                          maxLength={6}
                          value={pincode}
                          onChange={(e) => setPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                          placeholder="6 digits"
                          className="w-full rounded-md border border-neutral-200 px-3.5 py-2.5 text-sm outline-none focus:border-neutral-900 transition-colors"
                        />
                        {!pinValid && (
                          <p className="mt-1 flex items-center gap-1 text-[11px] font-medium text-red-600">
                            <AlertCircle size={12} /> Enter a valid 6-digit PIN code.
                          </p>
                        )}
                      </div>
                      <div className="sm:col-span-2">
                        <label className="mb-1.5 block text-xs font-semibold text-neutral-700">State</label>
                        <input
                          type="text"
                          value={state}
                          onChange={(e) => setStateName(e.target.value)}
                          className="w-full rounded-md border border-neutral-200 px-3.5 py-2.5 text-sm outline-none focus:border-neutral-900 transition-colors"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-neutral-700">
                        Country <span className="font-normal text-neutral-400">(optional)</span>
                      </label>
                      <AutocompleteField
                        label=""
                        value={country}
                        onChange={setCountry}
                        suggestions={COUNTRIES}
                        placeholder="e.g. India"
                        inputClassName="w-full rounded-md border border-neutral-200 px-3.5 py-2.5 text-sm outline-none focus:border-neutral-900 transition-colors"
                      />
                    </div>
                  </div>
                )}

                {/* STEP 2 — COVERAGE */}
                {step === 2 && (
                  <div className="space-y-5">
                    <div>
                      <h2 className="font-serif text-xl sm:text-2xl font-medium tracking-tight text-neutral-900">
                        What is your operational radius?
                      </h2>
                      <p className="mt-1 text-xs text-neutral-500">
                        Specify how far you can travel or dispatch assistance from {city || 'your base'}.
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {RADIUS_OPTIONS.map((km) => {
                        const selected = !useCustomRadius && radiusKm === km;
                        return (
                          <button
                            key={km}
                            type="button"
                            onClick={() => { setUseCustomRadius(false); setRadiusKm(km); }}
                            className={`cursor-pointer rounded-md border px-3.5 py-2 text-xs font-semibold transition-colors ${
                              selected
                                ? 'border-neutral-900 bg-neutral-900 text-white'
                                : 'border-neutral-200 text-neutral-700 hover:border-neutral-300'
                            }`}
                          >
                            {km} KM
                          </button>
                        );
                      })}
                      <button
                        type="button"
                        onClick={() => setUseCustomRadius(true)}
                        className={`cursor-pointer rounded-md border px-3.5 py-2 text-xs font-semibold transition-colors ${
                          useCustomRadius
                            ? 'border-neutral-900 bg-neutral-900 text-white'
                            : 'border-neutral-200 text-neutral-700 hover:border-neutral-300'
                        }`}
                      >
                        Custom Radius
                      </button>
                    </div>

                    {useCustomRadius && (
                      <div>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            value={customRadius}
                            onChange={(e) => setCustomRadius(e.target.value)}
                            onBlur={() => setRadiusTouched(true)}
                            placeholder="e.g. 35"
                            className="w-32 rounded-md border border-neutral-200 px-3.5 py-2.5 text-sm outline-none focus:border-neutral-900"
                          />
                          <span className="text-xs font-medium text-neutral-600">Kilometers</span>
                        </div>
                        {radiusTouched && !radiusValid && (
                          <p className="mt-1.5 flex items-center gap-1 text-[11px] font-medium text-red-600">
                            <AlertCircle size={12} /> Please enter a radius between {MIN_RADIUS_KM} and {MAX_RADIUS_KM} KM.
                          </p>
                        )}
                      </div>
                    )}

                    {coords ? (
                      <div className="space-y-1.5">
                        <Suspense fallback={<div className="h-72 w-full animate-pulse rounded-md bg-neutral-100" />}>
                          <RadiusMap
                            latitude={coords.lat}
                            longitude={coords.lng}
                            radiusKm={radiusValid ? effectiveRadius : 0}
                            className="h-72 w-full rounded-md border border-neutral-200 overflow-hidden z-0"
                          />
                        </Suspense>
                        <p className="text-center text-[11px] text-neutral-500">
                          {city || 'Base location'} · {radiusValid ? `${effectiveRadius} KM` : '—'} coverage radius
                        </p>
                      </div>
                    ) : (
                      <CoverageVisual km={effectiveRadius || 0} city={city} />
                    )}

                    {serviceAreas.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs font-semibold text-neutral-700">Additional coverage zones:</p>
                        {serviceAreas.map((area) => (
                          <div
                            key={area.id}
                            className="flex items-center justify-between gap-2 rounded-md border border-neutral-200 px-3.5 py-2.5 bg-neutral-50"
                          >
                            <div>
                              <p className="text-xs font-semibold text-neutral-800">{area.name}</p>
                              <p className="text-[11px] text-neutral-500">{area.radiusKm} KM radius</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeServiceArea(area.id)}
                              className="cursor-pointer rounded-sm p-1 text-neutral-400 hover:text-red-600 hover:bg-neutral-100"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {addingArea ? (
                      <div className="space-y-3 rounded-md border border-neutral-200 p-4 bg-neutral-50/50">
                        <AutocompleteField
                          label="Additional Service Zone"
                          value={newAreaName}
                          onChange={setNewAreaName}
                          suggestions={suggestions.length ? suggestions : INDIAN_CITY_NAMES}
                          placeholder="e.g. Navi Mumbai"
                          inputClassName="w-full rounded-md border border-neutral-200 px-3.5 py-2.5 text-sm outline-none focus:border-neutral-900 bg-white"
                        />
                        <div className="flex flex-wrap gap-2">
                          {RADIUS_OPTIONS.slice(0, 5).map((km) => (
                            <button
                              key={km}
                              type="button"
                              onClick={() => setNewAreaRadius(km)}
                              className={`cursor-pointer rounded-md border px-3 py-1.5 text-xs font-medium ${
                                newAreaRadius === km
                                  ? 'border-neutral-900 bg-neutral-900 text-white'
                                  : 'border-neutral-200 bg-white text-neutral-700'
                              }`}
                            >
                              {km} KM
                            </button>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={addServiceArea}
                            disabled={!newAreaName.trim()}
                            className="flex-1 cursor-pointer rounded-md bg-neutral-900 py-2 text-xs font-semibold text-white disabled:opacity-40"
                          >
                            Add Area
                          </button>
                          <button
                            type="button"
                            onClick={() => setAddingArea(false)}
                            className="cursor-pointer rounded-md border border-neutral-200 px-4 py-2 text-xs font-semibold text-neutral-600 hover:bg-neutral-100"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {suggestions.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {suggestions.map((s) => (
                              <button
                                key={s}
                                type="button"
                                onClick={() =>
                                  setServiceAreas((cur) =>
                                    cur.some((a) => a.name === s) ? cur : [...cur, { id: `${Date.now()}-${s}`, name: s, radiusKm: 10 }]
                                  )
                                }
                                className="cursor-pointer rounded-md border border-dashed border-neutral-300 px-3 py-1.5 text-xs font-medium text-neutral-600 hover:border-neutral-400 bg-white"
                              >
                                + {s}
                              </button>
                            ))}
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => setAddingArea(true)}
                          className="inline-flex cursor-pointer items-center gap-1.5 text-xs font-semibold text-neutral-700 hover:text-neutral-900"
                        >
                          <Plus size={14} /> Add another nearby area
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* STEP 3 — AVAILABILITY */}
                {step === 3 && (
                  <div className="space-y-5">
                    <div>
                      <h2 className="font-serif text-xl sm:text-2xl font-medium tracking-tight text-neutral-900">
                        When are you available to respond?
                      </h2>
                      <p className="mt-1 text-xs text-neutral-500">
                        Inform users and emergency dispatch when your service line is active.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {AVAILABILITY_OPTIONS.map(({ value, Icon, label: optLabel, sub }) => {
                        const selected = availabilityType === value;
                        return (
                          <button
                            key={value}
                            type="button"
                            onClick={() => setAvailabilityType(value)}
                            className={`flex cursor-pointer flex-col items-start gap-1.5 rounded-md border p-4 text-left transition-all ${
                              selected
                                ? 'border-neutral-900 bg-neutral-900 text-white shadow-xs'
                                : 'border-neutral-200 bg-white hover:border-neutral-300'
                            }`}
                          >
                            <Icon size={18} className={selected ? 'text-white' : 'text-neutral-700'} />
                            <span className="text-xs font-semibold mt-1">{optLabel}</span>
                            <span className={`text-[11px] ${selected ? 'text-neutral-300' : 'text-neutral-500'}`}>{sub}</span>
                          </button>
                        );
                      })}
                    </div>

                    {availabilityType === 'custom' && (
                      <div className="space-y-4 border-t border-neutral-100 pt-5">
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setHoursMode('same')}
                            className={`flex-1 cursor-pointer rounded-md border py-2 text-xs font-semibold ${
                              hoursMode === 'same'
                                ? 'border-neutral-900 bg-neutral-900 text-white'
                                : 'border-neutral-200 text-neutral-600'
                            }`}
                          >
                            Same hours every day
                          </button>
                          <button
                            type="button"
                            onClick={() => setHoursMode('perday')}
                            className={`flex-1 cursor-pointer rounded-md border py-2 text-xs font-semibold ${
                              hoursMode === 'perday'
                                ? 'border-neutral-900 bg-neutral-900 text-white'
                                : 'border-neutral-200 text-neutral-600'
                            }`}
                          >
                            Custom per day
                          </button>
                        </div>

                        {hoursMode === 'same' ? (
                          <div className="flex items-center gap-3">
                            <input
                              type="time"
                              value={sameHours.open}
                              onChange={(e) => setSameHours((h) => ({ ...h, open: e.target.value }))}
                              className="rounded-md border border-neutral-200 px-3 py-2 text-xs outline-none focus:border-neutral-900"
                            />
                            <span className="text-xs text-neutral-400">to</span>
                            <input
                              type="time"
                              value={sameHours.close}
                              onChange={(e) => setSameHours((h) => ({ ...h, close: e.target.value }))}
                              className="rounded-md border border-neutral-200 px-3 py-2 text-xs outline-none focus:border-neutral-900"
                            />
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {DAYS.map((d) => {
                              const hours = perDayHours[d.key];
                              return (
                                <div key={d.key} className="flex items-center gap-2.5">
                                  <label className="flex w-24 shrink-0 items-center gap-2 text-xs font-medium text-neutral-700">
                                    <input
                                      type="checkbox"
                                      checked={!hours.closed}
                                      onChange={(e) =>
                                        setPerDayHours((cur) => ({
                                          ...cur,
                                          [d.key]: { ...cur[d.key], closed: !e.target.checked },
                                        }))
                                      }
                                      className="h-3.5 w-3.5 rounded border-neutral-300"
                                    />
                                    {d.label.slice(0, 3)}
                                  </label>
                                  {hours.closed ? (
                                    <span className="text-xs text-neutral-400">Closed</span>
                                  ) : (
                                    <div className="flex items-center gap-2">
                                      <input
                                        type="time"
                                        value={hours.open}
                                        onChange={(e) =>
                                          setPerDayHours((cur) => ({
                                            ...cur,
                                            [d.key]: { ...cur[d.key], open: e.target.value },
                                          }))
                                        }
                                        className="rounded-md border border-neutral-200 px-2 py-1 text-xs outline-none focus:border-neutral-900"
                                      />
                                      <span className="text-neutral-400 text-xs">to</span>
                                      <input
                                        type="time"
                                        value={hours.close}
                                        onChange={(e) =>
                                          setPerDayHours((cur) => ({
                                            ...cur,
                                            [d.key]: { ...cur[d.key], close: e.target.value },
                                          }))
                                        }
                                        className="rounded-md border border-neutral-200 px-2 py-1 text-xs outline-none focus:border-neutral-900"
                                      />
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* STEP 4 — BUSINESS DETAILS */}
                {step === 4 && (
                  <div className="space-y-4">
                    <div>
                      <h2 className="font-serif text-xl sm:text-2xl font-medium tracking-tight text-neutral-900">
                        Provider &amp; Contact Details
                      </h2>
                      <p className="mt-1 text-xs text-neutral-500">
                        Used solely for internal vetting and private dispatch routing.
                      </p>
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-semibold text-neutral-700">
                        Business / Provider Name *
                      </label>
                      <input
                        value={label}
                        onChange={(e) => setLabel(e.target.value)}
                        placeholder={serviceMeta.placeholder || 'e.g. Apex 24x7 Roadside Assistance'}
                        className="w-full rounded-md border border-neutral-200 px-3.5 py-2.5 text-sm outline-none focus:border-neutral-900"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-semibold text-neutral-700">
                        Official Contact Mobile *
                      </label>
                      <PhoneInputWithCountry value={phone} onChange={setPhone} />
                      <p className="mt-1 flex items-start gap-1.5 text-[11px] text-neutral-500">
                        <Info size={12} className="mt-0.5 shrink-0" />
                        Our team will verify this number. Customers only see a masked routing bridge.
                      </p>
                    </div>

                    <div>
                      <label className="mb-1.5 flex items-center gap-2 text-xs font-medium text-neutral-700">
                        <input
                          type="checkbox"
                          checked={whatsappSame}
                          onChange={(e) => setWhatsappSame(e.target.checked)}
                          className="h-3.5 w-3.5 rounded border-neutral-300"
                        />
                        WhatsApp number is same as contact mobile
                      </label>
                      {!whatsappSame && (
                        <PhoneInputWithCountry value={whatsapp} onChange={setWhatsapp} placeholder="10-digit WhatsApp number" />
                      )}
                      {!whatsappValid && (
                        <p className="mt-1 flex items-center gap-1 text-[11px] font-medium text-red-600">
                          <AlertCircle size={11} /> Enter a valid 10-digit WhatsApp number.
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-semibold text-neutral-700">
                        Business Email <span className="font-normal text-neutral-400">(optional)</span>
                      </label>
                      <div className="relative">
                        <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          onBlur={() => setTouchedEmail(true)}
                          placeholder="support@yourcompany.com"
                          className={`w-full rounded-md border py-2.5 pl-10 pr-3.5 text-sm outline-none ${
                            touchedEmail && !emailValid
                              ? 'border-red-400 focus:border-red-500'
                              : 'border-neutral-200 focus:border-neutral-900'
                          }`}
                        />
                      </div>
                      {touchedEmail && !emailValid && (
                        <p className="mt-1 flex items-center gap-1 text-[11px] font-medium text-red-600">
                          <AlertCircle size={11} /> Enter a valid email address.
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-neutral-700">
                        Experience in service <span className="font-normal text-neutral-400">(optional)</span>
                      </label>
                      <div className="flex flex-wrap gap-1.5">
                        {EXPERIENCE_OPTIONS.map((opt) => (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => setYearsExperience((cur) => cur === opt ? '' : opt)}
                            className={`cursor-pointer rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
                              yearsExperience === opt
                                ? 'border-neutral-900 bg-neutral-900 text-white'
                                : 'border-neutral-200 text-neutral-600 hover:border-neutral-300'
                            }`}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-semibold text-neutral-700">
                        Additional details or license info <span className="font-normal text-neutral-400">(optional)</span>
                      </label>
                      <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={2}
                        placeholder="Fleet size, vehicle types, license info, certifications..."
                        className="w-full resize-none rounded-md border border-neutral-200 px-3.5 py-2.5 text-sm outline-none focus:border-neutral-900"
                      />
                    </div>
                  </div>
                )}

                {/* STEP 5 — REVIEW & SUBMIT */}
                {step === 5 && (
                  <div className="space-y-5">
                    <div>
                      <h2 className="font-serif text-xl sm:text-2xl font-medium tracking-tight text-neutral-900">
                        Review Your Partner Profile
                      </h2>
                      <p className="mt-1 text-xs text-neutral-500">
                        Please confirm your details before submitting for partner onboarding.
                      </p>
                    </div>

                    <div className="rounded-md border border-neutral-200 bg-neutral-50 p-5 space-y-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="flex h-11 w-11 items-center justify-center rounded-md"
                          style={{ backgroundColor: serviceMeta.bg, color: serviceMeta.color }}
                        >
                          <serviceMeta.Icon size={20} />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-neutral-900">{label || 'Provider Name'}</p>
                          <p className="text-xs text-neutral-500">{service.label}</p>
                        </div>
                      </div>

                      <div className="border-t border-neutral-200/60 pt-3 space-y-2 text-xs text-neutral-700">
                        <p className="flex items-center gap-2">
                          <MapPin size={14} className="text-neutral-400" />
                          <span>Base: <strong className="text-neutral-900">{city}{state ? `, ${state}` : ''}</strong></span>
                        </p>
                        <p className="flex items-center gap-2">
                          <LocateFixed size={14} className="text-neutral-400" />
                          <span>Dispatch Radius: <strong className="text-neutral-900">{effectiveRadius} KM</strong> {serviceAreas.length ? ` (+${serviceAreas.length} extra area${serviceAreas.length > 1 ? 's' : ''})` : ''}</span>
                        </p>
                        <p className="flex items-center gap-2">
                          <Clock size={14} className="text-neutral-400" />
                          <span>Availability: <strong className="text-neutral-900">{availabilitySummary}</strong></span>
                        </p>
                        <p className="flex items-center gap-2">
                          <Phone size={14} className="text-neutral-400" />
                          <span>Phone: <strong className="text-neutral-900">{phone}</strong> (Calls routed through masked bridge)</span>
                        </p>
                        {email && (
                          <p className="flex items-center gap-2">
                            <Mail size={14} className="text-neutral-400" />
                            <span>Email: <strong className="text-neutral-900">{email}</strong></span>
                          </p>
                        )}
                      </div>
                    </div>

                    {error && (
                      <div className="rounded-md bg-red-50 border border-red-200 p-3 text-xs font-semibold text-red-700">
                        {error}
                      </div>
                    )}

                    <FlowButton tone="dark" size="md" fullWidth loading={submitting} onClick={handleSubmit}>
                      {submitting ? (
                        'Submitting Application…'
                      ) : (
                        <>
                          <ShieldCheck size={15} />
                          Submit Partner Application
                        </>
                      )}
                    </FlowButton>
                    <p className="text-center text-[11px] text-neutral-500">
                      By submitting, you agree to receive verification calls from the RepiQR team. No fee required.
                    </p>
                  </div>
                )}

                {/* BOTTOM NAVIGATION CONTROLS */}
                {step < 5 && (
                  <div className="flex items-center gap-3 border-t border-neutral-100 pt-5">
                    <button
                      type="button"
                      onClick={goBack}
                      className="cursor-pointer rounded-md border border-neutral-200 px-4 py-2.5 text-xs font-semibold text-neutral-600 hover:bg-neutral-50"
                    >
                      Back
                    </button>
                    <FlowButton tone="dark" size="sm" className="flex-1" onClick={goNext}>
                      Continue
                    </FlowButton>
                  </div>
                )}
                {step === 5 && (
                  <div className="pt-2 text-center">
                    <button
                      type="button"
                      onClick={() => setStep(0)}
                      className="cursor-pointer text-xs font-medium text-neutral-500 hover:text-neutral-900 underline underline-offset-4"
                    >
                      Edit details from start
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

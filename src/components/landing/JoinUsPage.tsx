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
import { useLanguage } from '../../context/LanguageContext';
import { joinUsTranslations } from '../../i18n/joinUsTranslations';

// Leaflet is heavy and only the Location/Coverage steps need it — load on demand.
const RadiusMap = lazy(() => import('../common/RadiusMap'));

const PIN_PATTERN = /^[1-9]\d{5}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_RADIUS_KM = 1;
const MAX_RADIUS_KM = 150;
const RADIUS_OPTIONS = [5, 10, 15, 25, 50, 75, 100];

interface JoinUsPageProps {
  onBack: () => void;
  initialServiceType?: string;
}

const WIZARD_STEP_KEYS = ['service', 'location', 'coverage', 'availability', 'details', 'review'] as const;

type AvailabilityType = 'always' | 'daytime' | 'night' | 'custom';
type HoursMode = 'same' | 'perday';
interface DayHours { open: string; close: string; closed: boolean }
const DAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
const DEFAULT_DAY_HOURS: DayHours = { open: '09:00', close: '18:00', closed: false };

interface ServiceArea { id: string; name: string; radiusKm: number }

const AVAILABILITY_VALUES: AvailabilityType[] = ['always', 'daytime', 'night', 'custom'];
const AVAILABILITY_ICONS: Record<AvailabilityType, typeof Zap> = { always: Zap, daytime: Sun, night: Moon, custom: CalendarClock };

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
  const { language } = useLanguage();
  const t = joinUsTranslations[language].joinUs;
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
        <p className="text-xs font-semibold text-neutral-900">{t.step2.coverageSummary(city, t.step2.radiusLabel(km))}</p>
        <p className="mt-1 text-[11px] text-neutral-500">
          {t.step2.estimatedDispatch}
        </p>
      </div>
    </div>
  );
}

export default function JoinUsPage({ onBack, initialServiceType }: JoinUsPageProps) {
  const { language } = useLanguage();
  const t = joinUsTranslations[language].joinUs;

  const WIZARD_STEPS = WIZARD_STEP_KEYS.map((key) => t.wizardSteps[key]);
  const DAYS = DAY_KEYS.map((key, i) => ({ key, label: t.step3.days[i] }));
  const JOIN_BENEFITS = t.hero.benefits;
  const AVAILABILITY_OPTIONS = AVAILABILITY_VALUES.map((value, i) => ({
    value,
    Icon: AVAILABILITY_ICONS[value],
    label: t.step3.availability[i].label,
    sub: t.step3.availability[i].sub,
  }));
  const EXPERIENCE_OPTIONS = t.step4.experienceOptions;

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
    DAY_KEYS.reduce((acc, key) => ({ ...acc, [key]: { ...DEFAULT_DAY_HOURS } }), {})
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
    if (availabilityType === 'always') return t.step3.summaryAlways;
    if (availabilityType === 'daytime') return t.step3.summaryDaytime;
    if (availabilityType === 'night') return t.step3.summaryNight;
    if (hoursMode === 'same') return t.step3.summaryEveryday(sameHours.open, sameHours.close);
    const openDays = DAY_KEYS.filter((key) => !perDayHours[key]?.closed).length;
    return t.step3.summaryCustom(openDays);
  }, [availabilityType, hoursMode, sameHours, perDayHours, t]);

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
    else setError(t.step5.errorFallback);
  };

  const stepLabel = (n: number) => t.header.stepOf(n + 1, WIZARD_STEPS.length);

  return (
    <main className="min-h-screen bg-neutral-50/50 text-neutral-900">
      {/* HEADER */}
      <header className="sticky top-0 z-30 border-b border-neutral-200 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-8">
          <button
            onClick={goBack}
            className="flex cursor-pointer items-center gap-2 text-xs font-semibold text-neutral-600 transition-colors hover:text-neutral-900"
          >
            <ArrowLeft size={15} /> {step === 0 || submitted ? t.header.backToHome : t.header.back}
          </button>
          <div className="flex items-center gap-3">
            <img src={lightBgLogo} alt="RepiQR" className="h-7 w-auto object-contain" />
            <span className="hidden h-4 w-px bg-neutral-200 sm:inline-block" />
            <span className="hidden text-[11px] font-semibold uppercase tracking-wider text-neutral-500 sm:inline-block">
              {t.header.partnerNetwork}
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
              {t.success.title}
            </h2>
            <p className="mt-3 text-sm text-neutral-600 leading-relaxed">
              {t.success.thankYou(label, service.label, city)}
            </p>
            <div className="mt-6 rounded-md bg-neutral-50 p-4 text-left border border-neutral-150 space-y-2 text-xs text-neutral-700">
              <div className="flex items-center gap-2">
                <Check size={14} className="text-emerald-600 shrink-0" />
                <span>{t.success.detailsRecorded}</span>
              </div>
              <div className="flex items-center gap-2">
                <Check size={14} className="text-emerald-600 shrink-0" />
                <span>{t.success.phoneQueued(phone)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Check size={14} className="text-emerald-600 shrink-0" />
                <span>{t.success.maskedCallActivated}</span>
              </div>
            </div>
            <FlowButton tone="dark" size="sm" className="mt-8" onClick={onBack}>
              {t.success.returnHome}
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
                    {t.hero.badge}
                  </div>
                  <h1 className="mt-4 font-serif text-3xl sm:text-4xl lg:text-5xl font-medium tracking-tight text-neutral-900 leading-[1.08]">
                    {t.hero.headline}
                  </h1>
                  <p className="mt-4 text-sm sm:text-base text-neutral-600 leading-relaxed font-normal">
                    {t.hero.subheading}
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
                    <span>{t.hero.trustLine}</span>
                  </div>
                </div>
              ) : (
                /* LIVE APPLICATION SUMMARY SIDEBAR ON STEPS 1-5 */
                <div className="space-y-4">
                  <div className="rounded-md border border-neutral-200 bg-white p-6 shadow-2xs">
                    <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                          {t.summarySidebar.applicationSummary}
                        </p>
                        <h3 className="mt-0.5 text-base font-semibold text-neutral-900">
                          {label.trim() || t.summarySidebar.profileFallback}
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
                          <p className="text-[11px] text-neutral-500">{t.summarySidebar.primaryServiceOffering}</p>
                        </div>
                      </div>

                      {/* City / Location */}
                      <div className="flex items-center gap-2.5 text-neutral-700">
                        <MapPin size={15} className="text-neutral-400 shrink-0" />
                        <span className="font-medium">
                          {city.trim() ? `${city}${state ? `, ${state}` : ''}` : t.summarySidebar.locationPending}
                        </span>
                      </div>

                      {/* Coverage Radius */}
                      <div className="flex items-center gap-2.5 text-neutral-700">
                        <LocateFixed size={15} className="text-neutral-400 shrink-0" />
                        <span className="font-medium">
                          {effectiveRadius > 0 ? t.summarySidebar.radiusKm(effectiveRadius) : t.summarySidebar.radiusNotSet}
                          {serviceAreas.length > 0 && t.summarySidebar.extraAreas(serviceAreas.length)}
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
                          <span className="font-medium">{phone} {t.summarySidebar.protectedViaMaskedRelay}</span>
                        </div>
                      )}
                    </div>

                    {categories.length > 0 && (
                      <div className="mt-4 border-t border-neutral-100 pt-3">
                        <p className="text-[11px] font-medium text-neutral-500 mb-2">{t.summarySidebar.supportedCategories}</p>
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
                        <h5 className="text-xs font-semibold text-neutral-900">{t.summarySidebar.privacySafetyTitle}</h5>
                        <p className="mt-1 text-[11px] text-neutral-600 leading-relaxed">
                          {t.summarySidebar.privacySafetyDesc}
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
                      {t.header.stepOf(step + 1, WIZARD_STEPS.length)} · {WIZARD_STEPS[step]}
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
                    <span>{t.progress.completeFields}</span>
                  </div>
                )}

                {/* STEP 0 — SERVICE SELECTION */}
                {step === 0 && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="font-serif text-xl sm:text-2xl font-medium tracking-tight text-neutral-900">
                        {t.step0.heading}
                      </h2>
                      <p className="mt-1 text-xs text-neutral-500">
                        {t.step0.sub}
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
                        {t.step0.categoriesLabel} <span className="font-normal text-neutral-400">{t.step0.optional}</span>
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
                        {t.step1.heading}
                      </h2>
                      <p className="mt-1 text-xs text-neutral-500">
                        {t.step1.sub}
                      </p>
                    </div>

                    <div>
                      <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-neutral-700">
                        <Search size={13} /> {t.step1.baseCityLabel}
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
                        placeholder={t.step1.selectCityPlaceholder}
                        inputClassName="w-full rounded-md border border-neutral-200 px-3.5 py-2.5 text-sm outline-none focus:border-neutral-900 transition-colors"
                      />
                    </div>

                    {mapLoading && <div className="h-64 w-full animate-pulse rounded-md bg-neutral-100" />}
                    {coords && !mapLoading && (
                      <div className="space-y-1.5">
                        <Suspense fallback={<div className="h-64 w-full animate-pulse rounded-md bg-neutral-100" />}>
                          <RadiusMap latitude={coords.lat} longitude={coords.lng} onMove={handlePinMove} />
                        </Suspense>
                        <p className="text-[11px] text-neutral-500">{t.step1.dragPin}</p>
                      </div>
                    )}

                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-neutral-700">
                        {t.step1.fullAddressLabel} <span className="font-normal text-neutral-400">{t.step0.optional}</span>
                      </label>
                      <input
                        type="text"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder={t.step1.buildingStreetPlaceholder}
                        className="w-full rounded-md border border-neutral-200 px-3.5 py-2.5 text-sm outline-none focus:border-neutral-900 transition-colors"
                      />
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div>
                        <label className="mb-1.5 block text-xs font-semibold text-neutral-700">
                          {t.step1.areaLocalityLabel} <span className="font-normal text-neutral-400">{t.step0.optional}</span>
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
                          {t.step1.pinCodeLabel} <span className="font-normal text-neutral-400">{t.step0.optional}</span>
                        </label>
                        <input
                          type="text"
                          inputMode="numeric"
                          maxLength={6}
                          value={pincode}
                          onChange={(e) => setPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                          placeholder={t.step1.sixDigitsPlaceholder}
                          className="w-full rounded-md border border-neutral-200 px-3.5 py-2.5 text-sm outline-none focus:border-neutral-900 transition-colors"
                        />
                        {!pinValid && (
                          <p className="mt-1 flex items-center gap-1 text-[11px] font-medium text-red-600">
                            <AlertCircle size={12} /> {t.step1.invalidPin}
                          </p>
                        )}
                      </div>
                      <div className="sm:col-span-2">
                        <label className="mb-1.5 block text-xs font-semibold text-neutral-700">{t.step1.stateLabel}</label>
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
                        {t.step1.countryLabel} <span className="font-normal text-neutral-400">{t.step0.optional}</span>
                      </label>
                      <AutocompleteField
                        label=""
                        value={country}
                        onChange={setCountry}
                        suggestions={COUNTRIES}
                        placeholder={t.step1.countryPlaceholder}
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
                        {t.step2.heading}
                      </h2>
                      <p className="mt-1 text-xs text-neutral-500">
                        {t.step2.sub(city)}
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
                        {t.step2.customRadius}
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
                            placeholder={t.step2.customRadiusPlaceholder}
                            className="w-32 rounded-md border border-neutral-200 px-3.5 py-2.5 text-sm outline-none focus:border-neutral-900"
                          />
                          <span className="text-xs font-medium text-neutral-600">{t.step2.kilometers}</span>
                        </div>
                        {radiusTouched && !radiusValid && (
                          <p className="mt-1.5 flex items-center gap-1 text-[11px] font-medium text-red-600">
                            <AlertCircle size={12} /> {t.step2.radiusRangeError(MIN_RADIUS_KM, MAX_RADIUS_KM)}
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
                          {t.step2.coverageSummary(city, radiusValid ? `${effectiveRadius} KM` : '—')}
                        </p>
                      </div>
                    ) : (
                      <CoverageVisual km={effectiveRadius || 0} city={city} />
                    )}

                    {serviceAreas.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs font-semibold text-neutral-700">{t.step2.additionalZones}</p>
                        {serviceAreas.map((area) => (
                          <div
                            key={area.id}
                            className="flex items-center justify-between gap-2 rounded-md border border-neutral-200 px-3.5 py-2.5 bg-neutral-50"
                          >
                            <div>
                              <p className="text-xs font-semibold text-neutral-800">{area.name}</p>
                              <p className="text-[11px] text-neutral-500">{t.step2.radiusLabel(area.radiusKm)}</p>
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
                          label={t.step2.additionalZoneLabel}
                          value={newAreaName}
                          onChange={setNewAreaName}
                          suggestions={suggestions.length ? suggestions : INDIAN_CITY_NAMES}
                          placeholder={t.step2.newAreaPlaceholder}
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
                            {t.step2.addArea}
                          </button>
                          <button
                            type="button"
                            onClick={() => setAddingArea(false)}
                            className="cursor-pointer rounded-md border border-neutral-200 px-4 py-2 text-xs font-semibold text-neutral-600 hover:bg-neutral-100"
                          >
                            {t.step2.cancel}
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
                          <Plus size={14} /> {t.step2.addAnotherArea}
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
                        {t.step3.heading}
                      </h2>
                      <p className="mt-1 text-xs text-neutral-500">
                        {t.step3.sub}
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
                            {t.step3.sameHoursEveryDay}
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
                            {t.step3.customPerDay}
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
                            <span className="text-xs text-neutral-400">{t.step3.to}</span>
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
                                    <span className="text-xs text-neutral-400">{t.step3.closed}</span>
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
                                      <span className="text-neutral-400 text-xs">{t.step3.to}</span>
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
                        {t.step4.heading}
                      </h2>
                      <p className="mt-1 text-xs text-neutral-500">
                        {t.step4.sub}
                      </p>
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-semibold text-neutral-700">
                        {t.step4.businessNameLabel}
                      </label>
                      <input
                        value={label}
                        onChange={(e) => setLabel(e.target.value)}
                        placeholder={serviceMeta.placeholder || t.step4.businessNamePlaceholder}
                        className="w-full rounded-md border border-neutral-200 px-3.5 py-2.5 text-sm outline-none focus:border-neutral-900"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-semibold text-neutral-700">
                        {t.step4.contactMobileLabel}
                      </label>
                      <PhoneInputWithCountry value={phone} onChange={setPhone} />
                      <p className="mt-1 flex items-start gap-1.5 text-[11px] text-neutral-500">
                        <Info size={12} className="mt-0.5 shrink-0" />
                        {t.step4.verifyNote}
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
                        {t.step4.whatsappSameLabel}
                      </label>
                      {!whatsappSame && (
                        <PhoneInputWithCountry value={whatsapp} onChange={setWhatsapp} placeholder={t.step4.whatsappPlaceholder} />
                      )}
                      {!whatsappValid && (
                        <p className="mt-1 flex items-center gap-1 text-[11px] font-medium text-red-600">
                          <AlertCircle size={11} /> {t.step4.whatsappInvalid}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-semibold text-neutral-700">
                        {t.step4.emailLabel} <span className="font-normal text-neutral-400">{t.step0.optional}</span>
                      </label>
                      <div className="relative">
                        <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          onBlur={() => setTouchedEmail(true)}
                          placeholder={t.step4.emailPlaceholder}
                          className={`w-full rounded-md border py-2.5 pl-10 pr-3.5 text-sm outline-none ${
                            touchedEmail && !emailValid
                              ? 'border-red-400 focus:border-red-500'
                              : 'border-neutral-200 focus:border-neutral-900'
                          }`}
                        />
                      </div>
                      {touchedEmail && !emailValid && (
                        <p className="mt-1 flex items-center gap-1 text-[11px] font-medium text-red-600">
                          <AlertCircle size={11} /> {t.step4.emailInvalid}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-neutral-700">
                        {t.step4.experienceLabel} <span className="font-normal text-neutral-400">{t.step0.optional}</span>
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
                        {t.step4.notesLabel} <span className="font-normal text-neutral-400">{t.step0.optional}</span>
                      </label>
                      <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={2}
                        placeholder={t.step4.notesPlaceholder}
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
                        {t.step5.heading}
                      </h2>
                      <p className="mt-1 text-xs text-neutral-500">
                        {t.step5.sub}
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
                          <p className="text-sm font-semibold text-neutral-900">{label || t.step5.providerNameFallback}</p>
                          <p className="text-xs text-neutral-500">{service.label}</p>
                        </div>
                      </div>

                      <div className="border-t border-neutral-200/60 pt-3 space-y-2 text-xs text-neutral-700">
                        <p className="flex items-center gap-2">
                          <MapPin size={14} className="text-neutral-400" />
                          <span>{t.step5.base} <strong className="text-neutral-900">{city}{state ? `, ${state}` : ''}</strong></span>
                        </p>
                        <p className="flex items-center gap-2">
                          <LocateFixed size={14} className="text-neutral-400" />
                          <span>{t.step5.dispatchRadius} <strong className="text-neutral-900">{effectiveRadius} KM</strong> {serviceAreas.length ? t.step5.extraAreasSuffix(serviceAreas.length) : ''}</span>
                        </p>
                        <p className="flex items-center gap-2">
                          <Clock size={14} className="text-neutral-400" />
                          <span>{t.step5.availabilityLabel} <strong className="text-neutral-900">{availabilitySummary}</strong></span>
                        </p>
                        <p className="flex items-center gap-2">
                          <Phone size={14} className="text-neutral-400" />
                          <span>{t.step5.phoneLabel} <strong className="text-neutral-900">{phone}</strong> {t.step5.phoneSuffix}</span>
                        </p>
                        {email && (
                          <p className="flex items-center gap-2">
                            <Mail size={14} className="text-neutral-400" />
                            <span>{t.step5.emailLabel} <strong className="text-neutral-900">{email}</strong></span>
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
                        t.step5.submitting
                      ) : (
                        <>
                          <ShieldCheck size={15} />
                          {t.step5.submitCta}
                        </>
                      )}
                    </FlowButton>
                    <p className="text-center text-[11px] text-neutral-500">
                      {t.step5.agreementNote}
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
                      {t.nav.back}
                    </button>
                    <FlowButton tone="dark" size="sm" className="flex-1" onClick={goNext}>
                      {t.nav.continue}
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
                      {t.nav.editFromStart}
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

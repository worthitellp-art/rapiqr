import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft, ArrowRight, Check, CheckCircle2, Loader2, Mail, AlertCircle,
  MapPin, LocateFixed, Search, Plus, Trash2, Sun, Moon, CalendarClock, Zap,
  ShieldCheck, Info,
} from 'lucide-react';
import PhoneInputWithCountry from '../common/PhoneInputWithCountry';
import AutocompleteField from '../common/AutocompleteField';
import { SERVICE_TYPES } from '../scan/tileActions';
import { getServiceMeta } from '../scan/serviceMeta';
import { STICKER_CATEGORIES } from '../../stickerModules';
import { apiClient } from '../../lib/apiClient';
import { INDIAN_CITIES, INDIAN_CITY_NAMES, COUNTRIES } from '../../data/locations';

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
  'Nearby scans route to your phone through a private masked bridge.',
  'Choose the sticker categories you cover, or serve every one of them.',
  'No listing fee. Your details are verified before you go live.',
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
  { value: 'always', Icon: Zap, label: '24/7', sub: 'Available round the clock' },
  { value: 'daytime', Icon: Sun, label: 'Daytime', sub: 'Morning to evening' },
  { value: 'night', Icon: Moon, label: 'Night', sub: 'Evening to early morning' },
  { value: 'custom', Icon: CalendarClock, label: 'Specific hours', sub: 'Set your own schedule' },
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
  const maxR = 112;
  const t = Math.min(1, Math.sqrt(Math.max(km, 0)) / Math.sqrt(MAX_RADIUS_KM));
  return minR + t * (maxR - minR);
}

/** Small illustrative coverage visual — not a literal map, since it's not backed by map tiles. */
function CoverageVisual({ km, city }: { km: number; city: string }) {
  const r = radiusToPixels(km);
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-black/10 bg-[#FAFAF7] py-8">
      <div className="relative flex h-[240px] w-[240px] items-center justify-center">
        <div className="absolute rounded-full border border-dashed border-black/15" style={{ width: 224, height: 224 }} />
        <div
          className="absolute rounded-full border-2 border-[#C79E00] bg-[#C79E00]/10 transition-all duration-300"
          style={{ width: r * 2, height: r * 2 }}
        />
        <div className="relative z-10 flex h-9 w-9 items-center justify-center rounded-full bg-[#0B0B0C] text-white shadow-lg">
          <MapPin size={17} />
        </div>
      </div>
      <p className="text-center text-[13px] font-semibold text-black/80">{city || 'Your location'} · ~{km} KM radius</p>
      <p className="max-w-[220px] text-center text-[11px] leading-relaxed text-black/45">
        Your selected service area — not a guarantee of customer leads.
      </p>
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

  // Step 0 — service
  const [serviceType, setServiceType] = useState(defaultService);
  const [categories, setCategories] = useState<string[]>([]);

  // Step 1 — location
  const [city, setCity] = useState('');
  const [state, setStateName] = useState('');
  const [country, setCountry] = useState('India');
  const [locating, setLocating] = useState(false);
  const [locateError, setLocateError] = useState('');

  // Step 2 — coverage
  const [radiusKm, setRadiusKm] = useState(10);
  const [customRadius, setCustomRadius] = useState('');
  const [useCustomRadius, setUseCustomRadius] = useState(false);
  const [radiusTouched, setRadiusTouched] = useState(false);
  const [serviceAreas, setServiceAreas] = useState<ServiceArea[]>([]);
  const [addingArea, setAddingArea] = useState(false);
  const [newAreaName, setNewAreaName] = useState('');
  const [newAreaRadius, setNewAreaRadius] = useState(10);

  // Step 3 — availability
  const [availabilityType, setAvailabilityType] = useState<AvailabilityType>('always');
  const [hoursMode, setHoursMode] = useState<HoursMode>('same');
  const [sameHours, setSameHours] = useState<DayHours>(DEFAULT_DAY_HOURS);
  const [perDayHours, setPerDayHours] = useState<Record<string, DayHours>>(() => {
    const init: Record<string, DayHours> = {};
    DAYS.forEach((d) => { init[d.key] = { ...DEFAULT_DAY_HOURS }; });
    return init;
  });

  // Step 4 — details
  const [label, setLabel] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsappSame, setWhatsappSame] = useState(true);
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [touchedEmail, setTouchedEmail] = useState(false);
  const [yearsExperience, setYearsExperience] = useState('');
  const [notes, setNotes] = useState('');

  const service = useMemo(() => SERVICE_TYPES.find((type) => type.slug === serviceType) || SERVICE_TYPES[0], [serviceType]);
  const serviceMeta = getServiceMeta(serviceType);
  const phoneDigits = phone.replace(/\D/g, '').slice(-10);
  const phoneValid = phoneDigits.length === 10;
  const whatsappDigits = whatsapp.replace(/\D/g, '').slice(-10);
  const whatsappValid = whatsappSame || whatsappDigits.length === 0 || whatsappDigits.length === 10;
  const emailValid = !email.trim() || EMAIL_PATTERN.test(email.trim());
  const effectiveRadius = useCustomRadius ? Number(customRadius) || 0 : radiusKm;
  const radiusValid = effectiveRadius >= MIN_RADIUS_KM && effectiveRadius <= MAX_RADIUS_KM;
  const suggestions = useMemo(() => nearbyCities(city), [city]);

  const toggleCategory = (value: string) => {
    setCategories((current) => current.includes(value)
      ? current.filter((category) => category !== value)
      : [...current, value]);
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocateError('Location is not supported on this device/browser.');
      return;
    }
    setLocating(true);
    setLocateError('');
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const res = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
          );
          const data = await res.json();
          const foundCity = data.city || data.locality || data.principalSubdivision || '';
          if (foundCity) setCity(foundCity);
          if (data.principalSubdivision) setStateName(data.principalSubdivision);
          if (data.countryName) setCountry(data.countryName);
        } catch {
          setLocateError("Couldn't determine your location — please search for it instead.");
        } finally {
          setLocating(false);
        }
      },
      () => {
        setLocateError('Location permission denied — please search for your city instead.');
        setLocating(false);
      },
      { timeout: 10000 }
    );
  };

  const addServiceArea = () => {
    if (!newAreaName.trim()) return;
    setServiceAreas((cur) => [...cur, { id: `${Date.now()}`, name: newAreaName.trim(), radiusKm: newAreaRadius }]);
    setNewAreaName('');
    setNewAreaRadius(10);
    setAddingArea(false);
  };

  const removeServiceArea = (id: string) => setServiceAreas((cur) => cur.filter((a) => a.id !== id));

  const availabilitySummary = useMemo(() => {
    if (availabilityType === 'always') return '24/7, every day';
    if (availabilityType === 'daytime') return 'Daytime hours';
    if (availabilityType === 'night') return 'Night hours';
    if (hoursMode === 'same') return `${sameHours.open} – ${sameHours.close}, every day`;
    const openDays = DAYS.filter((d) => !perDayHours[d.key]?.closed).length;
    return `Custom hours · ${openDays}/7 days`;
  }, [availabilityType, hoursMode, sameHours, perDayHours]);

  const stepValid = useMemo(() => {
    switch (step) {
      case 0: return Boolean(serviceType);
      case 1: return Boolean(city.trim());
      case 2: {
        if (!radiusValid) return false;
        return serviceAreas.every((a) => a.name.trim() && a.radiusKm >= MIN_RADIUS_KM && a.radiusKm <= MAX_RADIUS_KM);
      }
      case 3: {
        if (availabilityType !== 'custom') return true;
        if (hoursMode === 'same') return sameHours.open < sameHours.close;
        return DAYS.some((d) => !perDayHours[d.key]?.closed) &&
          DAYS.every((d) => perDayHours[d.key]?.closed || perDayHours[d.key].open < perDayHours[d.key].close);
      }
      case 4: return Boolean(label.trim() && phoneValid && emailValid && whatsappValid);
      default: return true;
    }
  }, [step, serviceType, city, radiusValid, serviceAreas, availabilityType, hoursMode, sameHours, perDayHours, label, phoneValid, emailValid, whatsappValid]);

  useEffect(() => { setShowStepError(false); }, [step]);

  const goNext = () => {
    if (!stepValid) {
      if (step === 2) setRadiusTouched(true);
      if (step === 4) setTouchedEmail(true);
      setShowStepError(true);
      return;
    }
    setStep((s) => Math.min(s + 1, WIZARD_STEPS.length - 1));
  };
  const goBack = () => {
    if (step === 0) { onBack(); return; }
    setStep((s) => s - 1);
  };

  const handleSubmit = async () => {
    if (submitting) return;
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
        notes: notes.trim(),
        whatsapp: whatsappSame ? phone.trim() : whatsapp.trim(),
        yearsExperience: yearsExperience || undefined,
        radiusKm: effectiveRadius,
        serviceAreas: serviceAreas.map((a) => ({ name: a.name, radiusKm: a.radiusKm })),
        availability: availabilityType === 'always'
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
    <main className="min-h-screen bg-[#FAFAFA] text-[#0B0B0C]">
      <header className="border-b border-black/10 bg-[#FAFAFA]/90 backdrop-blur-md">
        <div className="mx-auto flex h-20 max-w-[1200px] items-center justify-between px-6 sm:px-10">
          <button onClick={goBack} className="flex cursor-pointer items-center gap-2 text-[13px] font-medium text-black/55 transition-colors hover:text-black">
            <ArrowLeft size={16} /> {step === 0 || submitted ? 'Back to home' : 'Back'}
          </button>
          <span className="text-sm font-semibold tracking-[0.16em]">RAPI<span className="text-[#C79E00]">QR</span></span>
          <span className="hidden text-[11px] font-medium uppercase tracking-[0.16em] text-black/60 sm:block">Partner network</span>
        </div>
      </header>

      <div className={`mx-auto grid max-w-[1200px] gap-12 px-6 py-14 sm:px-10 sm:py-20 lg:items-start lg:gap-20 ${step === 0 && !submitted ? 'lg:grid-cols-[0.8fr_1.2fr]' : 'lg:grid-cols-1'}`}>
        {step === 0 && !submitted && (
          <section className="lg:sticky lg:top-10">
            <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-black/60">Join us</p>
            <h1 className="mt-5 max-w-lg text-[clamp(2.8rem,6vw,5.4rem)] font-medium leading-[0.92] tracking-[-0.055em]">
              Be the help someone finds.
            </h1>
            <p className="mt-6 max-w-md text-[15px] font-light leading-relaxed text-black/55">
              Join the RapiQR service network and receive relevant nearby requests without exposing your personal number.
            </p>
            <ul className="mt-10 space-y-5 border-t border-black/10 pt-7">
              {JOIN_BENEFITS.map((benefit) => (
                <li key={benefit} className="flex gap-3 text-[13px] leading-relaxed text-black/60">
                  <CheckCircle2 size={17} className="mt-0.5 shrink-0 text-[#C79E00]" />
                  {benefit}
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className={`mx-auto w-full ${step === 0 && !submitted ? '' : 'max-w-[640px]'} rounded-[1.75rem] border border-black/10 bg-white p-6 shadow-[0_24px_70px_-36px_rgba(0,0,0,0.45)] sm:p-10`}>
          {submitted ? (
            <div className="flex min-h-[520px] flex-col items-center justify-center text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                <CheckCircle2 size={30} />
              </div>
              <h2 className="mt-6 text-2xl font-medium tracking-[-0.03em]">You're on your way to becoming a RepiQR Service Partner.</h2>
              <p className="mt-3 max-w-sm text-[14px] leading-relaxed text-black/55">
                Thanks, {label}. We'll review your {service.label.toLowerCase()} listing for {city} and contact you on {phone}.
              </p>
              <ul className="mt-6 space-y-2.5 text-left text-[13px] text-black/70">
                <li className="flex items-center gap-2"><Check size={14} className="text-emerald-600" /> Details received</li>
                <li className="flex items-center gap-2"><Check size={14} className="text-emerald-600" /> Service area saved</li>
                <li className="flex items-center gap-2"><Check size={14} className="text-emerald-600" /> RepiQR team will contact you</li>
              </ul>
              <button onClick={onBack} className="mt-8 flex cursor-pointer items-center gap-2 rounded-md bg-[#0B0B0C] px-6 py-3.5 text-[13px] font-semibold text-white">
                Return to home <ArrowRight size={15} className="text-[#111111]" />
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="border-b border-black/10 pb-5">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-black/60">Partner application</p>
                  <p className="text-[11px] font-semibold text-black/45">{stepLabel(step)}</p>
                </div>
                <div className="mt-3 flex gap-1.5">
                  {WIZARD_STEPS.map((label2, idx) => (
                    <div key={label2} className={`h-1 flex-1 rounded-full transition-colors ${idx <= step ? 'bg-[#C79E00]' : 'bg-black/10'}`} />
                  ))}
                </div>
              </div>

              {showStepError && !stepValid && (
                <p className="flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-[12.5px] font-semibold text-red-700">
                  <AlertCircle size={14} className="shrink-0" /> Please complete the required fields to continue.
                </p>
              )}

              {/* STEP 0 — SERVICE */}
              {step === 0 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-medium tracking-[-0.03em]">Aap RepiQR customers ko kaunsi service dena chahte hain?</h2>
                    <p className="mt-1.5 text-[13px] text-black/55">Pick the service you handle. You can always update this later.</p>
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
                          className={`flex min-h-[92px] cursor-pointer flex-col items-start gap-2.5 rounded-2xl border p-3.5 text-left transition-all ${selected ? 'border-[#0B0B0C] bg-[#0B0B0C]' : 'border-black/10 bg-white hover:border-black/30'}`}
                        >
                          <div
                            className="flex h-8 w-8 items-center justify-center rounded-lg"
                            style={{ backgroundColor: selected ? 'rgba(255,255,255,0.12)' : meta.bg, color: selected ? '#FFFFFF' : meta.color }}
                          >
                            <Icon size={16} />
                          </div>
                          <span className={`text-[12.5px] font-semibold leading-tight ${selected ? 'text-white' : 'text-black/80'}`}>{type.label}</span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="border-t border-black/10 pt-5">
                    <label className="mb-2.5 block text-[11px] font-medium uppercase tracking-[0.14em] text-black/60">
                      Kaunse tag/vehicle types cover karte hain? <span className="ml-1 normal-case tracking-normal text-black/60">(optional)</span>
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {STICKER_CATEGORIES.map((category) => {
                        const selected = categories.includes(category.value);
                        return (
                          <button type="button" key={category.value} onClick={() => toggleCategory(category.value)} className={`flex cursor-pointer items-center gap-1.5 rounded-full border px-3.5 py-2 text-[12px] transition-colors ${selected ? 'border-[#0B0B0C] bg-[#0B0B0C] text-white' : 'border-black/12 text-black/55 hover:border-black/35'}`}>
                            {selected && <Check size={11} />}{category.label}
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
                    <h2 className="text-2xl font-medium tracking-[-0.03em]">Aapki service kaha se operate hoti hai?</h2>
                    <p className="mt-1.5 text-[13px] text-black/55">Tell us your base city — customers nearby will find you from here.</p>
                  </div>

                  <button
                    type="button"
                    onClick={handleUseCurrentLocation}
                    disabled={locating}
                    className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-black/12 bg-white py-3.5 text-[13px] font-semibold text-black/80 transition-colors hover:border-black/30 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {locating ? <Loader2 size={15} className="animate-spin" /> : <LocateFixed size={15} />}
                    {locating ? 'Finding your location…' : 'Use current location'}
                  </button>
                  {locateError && <p className="flex items-center gap-1 text-[11px] font-semibold text-red-600"><AlertCircle size={11} /> {locateError}</p>}

                  <div className="relative flex items-center gap-3 text-[11px] font-medium uppercase tracking-[0.12em] text-black/35">
                    <div className="h-px flex-1 bg-black/10" /> or search <div className="h-px flex-1 bg-black/10" />
                  </div>

                  <div>
                    <label className="mb-2 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.14em] text-black/60"><Search size={12} /> Search your city *</label>
                    <AutocompleteField
                      label=""
                      value={city}
                      onChange={(v) => { setCity(v); setStateName(''); }}
                      onSelect={(v) => setStateName(INDIAN_CITIES.find((c) => c.name === v)?.state || '')}
                      suggestions={INDIAN_CITY_NAMES}
                      placeholder="e.g. Ahmedabad"
                      inputClassName="w-full rounded-xl border border-black/12 px-4 py-3.5 text-[14px] outline-hidden focus:border-black"
                    />
                  </div>

                  {city.trim() && (
                    <div className="flex items-center gap-2 rounded-xl bg-[#FAFAF7] px-4 py-3">
                      <MapPin size={15} className="text-[#C79E00]" />
                      <span className="text-[13px] font-semibold text-black/80">{city}{state ? `, ${state}` : ''}</span>
                    </div>
                  )}

                  <div>
                    <label className="mb-2 block text-[11px] font-medium uppercase tracking-[0.14em] text-black/60">Country <span className="normal-case tracking-normal text-black/40">(optional)</span></label>
                    <AutocompleteField
                      label=""
                      value={country}
                      onChange={setCountry}
                      suggestions={COUNTRIES}
                      placeholder="e.g. India"
                      inputClassName="w-full rounded-xl border border-black/12 px-4 py-3.5 text-[14px] outline-hidden focus:border-black"
                    />
                  </div>
                </div>
              )}

              {/* STEP 2 — COVERAGE */}
              {step === 2 && (
                <div className="space-y-5">
                  <div>
                    <h2 className="text-2xl font-medium tracking-[-0.03em]">Aap kitne area tak service provide kar sakte hain?</h2>
                    <p className="mt-1.5 text-[13px] text-black/55">How far can you travel from {city || 'your location'}?</p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {RADIUS_OPTIONS.map((km) => {
                      const selected = !useCustomRadius && radiusKm === km;
                      return (
                        <button key={km} type="button" onClick={() => { setUseCustomRadius(false); setRadiusKm(km); }} className={`cursor-pointer rounded-full border px-4 py-2.5 text-[13px] font-semibold transition-colors ${selected ? 'border-[#0B0B0C] bg-[#0B0B0C] text-white' : 'border-black/12 text-black/65 hover:border-black/35'}`}>
                          {km} KM
                        </button>
                      );
                    })}
                    <button type="button" onClick={() => setUseCustomRadius(true)} className={`cursor-pointer rounded-full border px-4 py-2.5 text-[13px] font-semibold transition-colors ${useCustomRadius ? 'border-[#0B0B0C] bg-[#0B0B0C] text-white' : 'border-black/12 text-black/65 hover:border-black/35'}`}>
                      Custom
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
                          placeholder="e.g. 40"
                          className="w-32 rounded-xl border border-black/12 px-4 py-3 text-[14px] outline-hidden focus:border-black"
                        />
                        <span className="text-[13px] font-medium text-black/55">KM</span>
                      </div>
                      {radiusTouched && !radiusValid && (
                        <p className="mt-1.5 flex items-center gap-1 text-[11px] font-semibold text-red-600">
                          <AlertCircle size={11} /> Please enter a radius between {MIN_RADIUS_KM} and {MAX_RADIUS_KM} KM.
                        </p>
                      )}
                    </div>
                  )}

                  <CoverageVisual km={effectiveRadius || 0} city={city} />

                  {serviceAreas.length > 0 && (
                    <div className="space-y-2">
                      {serviceAreas.map((area) => (
                        <div key={area.id} className="flex items-center justify-between gap-2 rounded-xl border border-black/10 px-4 py-3">
                          <div>
                            <p className="text-[13px] font-semibold text-black/80">{area.name}</p>
                            <p className="text-[11px] text-black/45">{area.radiusKm} KM coverage</p>
                          </div>
                          <button type="button" onClick={() => removeServiceArea(area.id)} className="cursor-pointer rounded-lg p-1.5 text-black/35 hover:bg-black/5 hover:text-red-600">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {addingArea ? (
                    <div className="space-y-3 rounded-xl border border-black/10 p-4">
                      <AutocompleteField
                        label="Additional area"
                        value={newAreaName}
                        onChange={setNewAreaName}
                        suggestions={suggestions.length ? suggestions : INDIAN_CITY_NAMES}
                        placeholder="e.g. Gandhinagar"
                        inputClassName="w-full rounded-xl border border-black/12 px-4 py-3 text-[14px] outline-hidden focus:border-black"
                      />
                      <div className="flex flex-wrap gap-2">
                        {RADIUS_OPTIONS.slice(0, 5).map((km) => (
                          <button key={km} type="button" onClick={() => setNewAreaRadius(km)} className={`cursor-pointer rounded-full border px-3.5 py-1.5 text-[12px] font-semibold ${newAreaRadius === km ? 'border-[#0B0B0C] bg-[#0B0B0C] text-white' : 'border-black/12 text-black/60'}`}>{km} KM</button>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <button type="button" onClick={addServiceArea} disabled={!newAreaName.trim()} className="flex-1 cursor-pointer rounded-lg bg-[#0B0B0C] py-2.5 text-[12.5px] font-semibold text-white disabled:opacity-40">Add area</button>
                        <button type="button" onClick={() => setAddingArea(false)} className="cursor-pointer rounded-lg border border-black/12 px-4 py-2.5 text-[12.5px] font-semibold text-black/60">Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {suggestions.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {suggestions.map((s) => (
                            <button key={s} type="button" onClick={() => setServiceAreas((cur) => cur.some((a) => a.name === s) ? cur : [...cur, { id: `${Date.now()}-${s}`, name: s, radiusKm: 10 }])} className="cursor-pointer rounded-full border border-dashed border-black/20 px-3.5 py-1.5 text-[12px] font-medium text-black/55 hover:border-black/40">
                              + {s}
                            </button>
                          ))}
                        </div>
                      )}
                      <button type="button" onClick={() => setAddingArea(true)} className="flex cursor-pointer items-center gap-1.5 text-[13px] font-semibold text-black/70 hover:text-black">
                        <Plus size={14} /> Add another service area
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* STEP 3 — AVAILABILITY */}
              {step === 3 && (
                <div className="space-y-5">
                  <div>
                    <h2 className="text-2xl font-medium tracking-[-0.03em]">Aap kab service provide karte hain?</h2>
                    <p className="mt-1.5 text-[13px] text-black/55">Let customers know when you're reachable.</p>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    {AVAILABILITY_OPTIONS.map(({ value, Icon, label: optLabel, sub }) => {
                      const selected = availabilityType === value;
                      return (
                        <button key={value} type="button" onClick={() => setAvailabilityType(value)} className={`flex cursor-pointer flex-col items-start gap-2 rounded-2xl border p-4 text-left transition-all ${selected ? 'border-[#0B0B0C] bg-[#0B0B0C] text-white' : 'border-black/10 bg-white hover:border-black/30'}`}>
                          <Icon size={17} className={selected ? 'text-[#C79E00]' : 'text-black/60'} />
                          <span className="text-[13px] font-semibold">{optLabel}</span>
                          <span className={`text-[11px] ${selected ? 'text-white/60' : 'text-black/45'}`}>{sub}</span>
                        </button>
                      );
                    })}
                  </div>

                  {availabilityType === 'custom' && (
                    <div className="space-y-4 border-t border-black/10 pt-5">
                      <div className="flex gap-2">
                        <button type="button" onClick={() => setHoursMode('same')} className={`flex-1 cursor-pointer rounded-lg border py-2.5 text-[12.5px] font-semibold ${hoursMode === 'same' ? 'border-[#0B0B0C] bg-[#0B0B0C] text-white' : 'border-black/12 text-black/60'}`}>Same hours every day</button>
                        <button type="button" onClick={() => setHoursMode('perday')} className={`flex-1 cursor-pointer rounded-lg border py-2.5 text-[12.5px] font-semibold ${hoursMode === 'perday' ? 'border-[#0B0B0C] bg-[#0B0B0C] text-white' : 'border-black/12 text-black/60'}`}>Different hours by day</button>
                      </div>

                      {hoursMode === 'same' ? (
                        <div className="flex items-center gap-3">
                          <input type="time" value={sameHours.open} onChange={(e) => setSameHours((h) => ({ ...h, open: e.target.value }))} className="rounded-xl border border-black/12 px-3.5 py-2.5 text-[13px] outline-hidden focus:border-black" />
                          <span className="text-black/40">to</span>
                          <input type="time" value={sameHours.close} onChange={(e) => setSameHours((h) => ({ ...h, close: e.target.value }))} className="rounded-xl border border-black/12 px-3.5 py-2.5 text-[13px] outline-hidden focus:border-black" />
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {DAYS.map((d) => {
                            const hours = perDayHours[d.key];
                            return (
                              <div key={d.key} className="flex items-center gap-2.5">
                                <label className="flex w-24 shrink-0 items-center gap-2 text-[12.5px] font-medium text-black/70">
                                  <input type="checkbox" checked={!hours.closed} onChange={(e) => setPerDayHours((cur) => ({ ...cur, [d.key]: { ...cur[d.key], closed: !e.target.checked } }))} className="h-3.5 w-3.5 rounded border-black/25" />
                                  {d.label.slice(0, 3)}
                                </label>
                                {hours.closed ? (
                                  <span className="text-[12px] text-black/35">Closed</span>
                                ) : (
                                  <div className="flex items-center gap-2">
                                    <input type="time" value={hours.open} onChange={(e) => setPerDayHours((cur) => ({ ...cur, [d.key]: { ...cur[d.key], open: e.target.value } }))} className="rounded-lg border border-black/12 px-2.5 py-1.5 text-[12px] outline-hidden focus:border-black" />
                                    <span className="text-black/30 text-[11px]">to</span>
                                    <input type="time" value={hours.close} onChange={(e) => setPerDayHours((cur) => ({ ...cur, [d.key]: { ...cur[d.key], close: e.target.value } }))} className="rounded-lg border border-black/12 px-2.5 py-1.5 text-[12px] outline-hidden focus:border-black" />
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

              {/* STEP 4 — DETAILS */}
              {step === 4 && (
                <div className="space-y-5">
                  <div>
                    <h2 className="text-2xl font-medium tracking-[-0.03em]">Bas thodi si business details</h2>
                    <p className="mt-1.5 text-[13px] text-black/55">Only what's needed to verify and reach you.</p>
                  </div>

                  <div>
                    <label className="mb-2 block text-[11px] font-medium uppercase tracking-[0.14em] text-black/60">Provider / business name *</label>
                    <input value={label} onChange={(event) => setLabel(event.target.value)} placeholder={serviceMeta.placeholder} className="w-full rounded-xl border border-black/12 px-4 py-3.5 text-[14px] outline-hidden focus:border-black" />
                  </div>

                  <div>
                    <label className="mb-2 block text-[11px] font-medium uppercase tracking-[0.14em] text-black/60">Phone number *</label>
                    <PhoneInputWithCountry value={phone} onChange={setPhone} />
                    <p className="mt-1.5 flex items-start gap-1.5 text-[11px] leading-relaxed text-black/45">
                      <Info size={12} className="mt-0.5 shrink-0" /> RepiQR team aapse verification ke liye contact karegi. Customers ko sirf a masked number dikhega, aapka number kabhi seedha share nahi hota.
                    </p>
                  </div>

                  <div>
                    <label className="mb-2 flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.14em] text-black/60">
                      <input type="checkbox" checked={whatsappSame} onChange={(e) => setWhatsappSame(e.target.checked)} className="h-3.5 w-3.5 rounded border-black/25" />
                      WhatsApp same as phone number
                    </label>
                    {!whatsappSame && (
                      <PhoneInputWithCountry value={whatsapp} onChange={setWhatsapp} placeholder="10-digit WhatsApp number" />
                    )}
                    {!whatsappValid && <p className="mt-1.5 flex items-center gap-1 text-[11px] font-semibold text-red-600"><AlertCircle size={11} /> Enter a valid 10-digit WhatsApp number.</p>}
                  </div>

                  <div>
                    <label className="mb-2 block text-[11px] font-medium uppercase tracking-[0.14em] text-black/60">Email <span className="normal-case tracking-normal text-black/40">(optional)</span></label>
                    <div className="relative">
                      <Mail size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-black/30" />
                      <input
                        type="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        onBlur={() => setTouchedEmail(true)}
                        placeholder="you@company.com"
                        className={`w-full rounded-xl border py-3.5 pl-11 pr-4 text-[14px] outline-hidden ${touchedEmail && !emailValid ? 'border-red-400 focus:border-red-500' : 'border-black/12 focus:border-black'}`}
                      />
                    </div>
                    {touchedEmail && !emailValid && (
                      <p className="mt-1.5 flex items-center gap-1 text-[11px] font-semibold text-red-600">
                        <AlertCircle size={11} /> Enter a valid email address.
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="mb-2.5 block text-[11px] font-medium uppercase tracking-[0.14em] text-black/60">Years of experience <span className="normal-case tracking-normal text-black/60">(optional)</span></label>
                    <div className="flex flex-wrap gap-2">
                      {EXPERIENCE_OPTIONS.map((opt) => (
                        <button key={opt} type="button" onClick={() => setYearsExperience((cur) => cur === opt ? '' : opt)} className={`cursor-pointer rounded-full border px-3.5 py-2 text-[12px] font-medium transition-colors ${yearsExperience === opt ? 'border-[#0B0B0C] bg-[#0B0B0C] text-white' : 'border-black/12 text-black/55 hover:border-black/35'}`}>
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-[11px] font-medium uppercase tracking-[0.14em] text-black/60">Anything else we should know <span className="normal-case tracking-normal text-black/40">(optional)</span></label>
                    <textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={3} placeholder="Fleet size, licence number, specialisations..." className="w-full resize-none rounded-xl border border-black/12 px-4 py-3.5 text-[14px] outline-hidden focus:border-black" />
                  </div>
                </div>
              )}

              {/* STEP 5 — REVIEW */}
              {step === 5 && (
                <div className="space-y-5">
                  <div>
                    <h2 className="text-2xl font-medium tracking-[-0.03em]">Aapka RepiQR Service Profile</h2>
                    <p className="mt-1.5 text-[13px] text-black/55">Is everything correct?</p>
                  </div>

                  <div className="rounded-2xl border border-black/10 bg-[#FAFAF7] p-5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: serviceMeta.bg, color: serviceMeta.color }}>
                        <serviceMeta.Icon size={18} />
                      </div>
                      <div>
                        <p className="text-[15px] font-semibold text-black/90">{label || 'Your business name'}</p>
                        <p className="text-[12px] text-black/50">{service.label}</p>
                      </div>
                    </div>

                    {categories.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {categories.map((c) => (
                          <span key={c} className="rounded-full bg-black/5 px-2.5 py-1 text-[11px] font-medium text-black/60">{STICKER_CATEGORIES.find((s) => s.value === c)?.label || c}</span>
                        ))}
                      </div>
                    )}

                    <div className="mt-4 space-y-2 border-t border-black/10 pt-4 text-[13px] text-black/70">
                      <p className="flex items-center gap-2"><MapPin size={14} className="text-black/40" /> {city}{state ? `, ${state}` : ''}</p>
                      <p className="flex items-center gap-2">📏 Service area: {effectiveRadius} KM{serviceAreas.length ? ` + ${serviceAreas.length} more area${serviceAreas.length > 1 ? 's' : ''}` : ''}</p>
                      <p className="flex items-center gap-2">🕐 Available: {availabilitySummary}</p>
                      <p className="flex items-center gap-2">📞 Contact available through RepiQR (masked)</p>
                    </div>
                  </div>

                  {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-[13px] text-red-700">{error}</p>}

                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-md bg-[#0B0B0C] py-4 text-[14px] font-semibold text-white transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {submitting ? <><Loader2 size={16} className="animate-spin" /> Sending application</> : <><ShieldCheck size={15} className="text-[#C79E00]" /> Join RepiQR</>}
                  </button>
                  <p className="text-center text-[11px] text-black/60">We verify every provider before listing. There is no fee to apply.</p>
                </div>
              )}

              {/* STICKY STEP NAV */}
              {step < 5 && (
                <div className="sticky bottom-0 z-10 -mx-6 mt-2 flex gap-3 border-t border-black/10 bg-white/95 px-6 pb-1 pt-4 backdrop-blur sm:-mx-10 sm:px-10">
                  <button type="button" onClick={goBack} className="cursor-pointer rounded-md border border-black/12 px-5 py-3.5 text-[13px] font-semibold text-black/60 hover:border-black/30">
                    ← Back
                  </button>
                  <button
                    type="button"
                    onClick={goNext}
                    className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-md bg-[#0B0B0C] py-3.5 text-[13px] font-semibold text-white transition-transform hover:-translate-y-0.5"
                  >
                    Continue <ArrowRight size={15} />
                  </button>
                </div>
              )}
              {step === 5 && (
                <button type="button" onClick={() => setStep(0)} className="flex cursor-pointer items-center gap-1.5 text-[12.5px] font-semibold text-black/50 hover:text-black">
                  <ArrowLeft size={13} /> Edit details
                </button>
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

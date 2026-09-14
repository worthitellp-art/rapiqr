import React, { useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, CheckCircle2, Loader2, Mail, AlertCircle } from 'lucide-react';
import PhoneInputWithCountry from '../common/PhoneInputWithCountry';
import AutocompleteField from '../common/AutocompleteField';
import { SERVICE_TYPES } from '../scan/tileActions';
import { getServiceMeta } from '../scan/serviceMeta';
import { STICKER_CATEGORIES } from '../../stickerModules';
import { apiClient } from '../../lib/apiClient';
import { INDIAN_CITY_NAMES, COUNTRIES } from '../../data/locations';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface JoinUsPageProps {
  onBack: () => void;
  initialServiceType?: string;
}

const JOIN_BENEFITS = [
  'Nearby scans route to your phone through a private masked bridge.',
  'Choose the sticker categories you cover, or serve every one of them.',
  'No listing fee. Your details are verified before you go live.',
];

export default function JoinUsPage({ onBack, initialServiceType }: JoinUsPageProps) {
  const defaultService = SERVICE_TYPES.some((type) => type.slug === initialServiceType)
    ? initialServiceType!
    : SERVICE_TYPES[0].slug;
  const [serviceType, setServiceType] = useState(defaultService);
  const [label, setLabel] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [notes, setNotes] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [touchedEmail, setTouchedEmail] = useState(false);

  const service = useMemo(() => SERVICE_TYPES.find((type) => type.slug === serviceType) || SERVICE_TYPES[0], [serviceType]);
  const serviceMeta = getServiceMeta(serviceType);
  const phoneDigits = phone.replace(/\D/g, '').slice(-10);
  const phoneValid = phoneDigits.length === 10;
  const emailValid = !email.trim() || EMAIL_PATTERN.test(email.trim());
  const valid = Boolean(label.trim() && phoneValid && city.trim() && emailValid);

  const toggleCategory = (value: string) => {
    setCategories((current) => current.includes(value)
      ? current.filter((category) => category !== value)
      : [...current, value]);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!valid) return;
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
      });
      saved = res.data || null;
    } catch (err) {
      console.warn('Provider application submit failed:', err);
    }
    setSubmitting(false);
    if (saved) setSubmitted(true);
    else setError("We couldn't submit your application just now. Please try again.");
  };

  return (
    <main className="min-h-screen bg-[#F4F1EC] text-[#0B0B0C]">
      <header className="border-b border-black/10 bg-[#F4F1EC]/90 backdrop-blur-md">
        <div className="mx-auto flex h-20 max-w-[1200px] items-center justify-between px-6 sm:px-10">
          <button onClick={onBack} className="flex cursor-pointer items-center gap-2 text-[13px] font-medium text-black/55 transition-colors hover:text-black">
            <ArrowLeft size={16} /> Back to home
          </button>
          <span className="text-sm font-semibold tracking-[0.16em]">RAPI<span className="text-[#C79E00]">QR</span></span>
          <span className="hidden text-[11px] font-medium uppercase tracking-[0.16em] text-black/60 sm:block">Partner network</span>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1200px] gap-12 px-6 py-14 sm:px-10 sm:py-20 lg:grid-cols-[0.8fr_1.2fr] lg:items-start lg:gap-20">
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

        <section className="rounded-[1.75rem] border border-black/10 bg-white p-6 shadow-[0_24px_70px_-36px_rgba(0,0,0,0.45)] sm:p-10">
          {submitted ? (
            <div className="flex min-h-[520px] flex-col items-center justify-center text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                <CheckCircle2 size={30} />
              </div>
              <h2 className="mt-6 text-2xl font-medium tracking-[-0.03em]">Application received</h2>
              <p className="mt-3 max-w-sm text-[14px] leading-relaxed text-black/55">
                Thanks, {label}. We will review your {service.label.toLowerCase()} listing for {city} and contact you on {phone}.
              </p>
              <button onClick={onBack} className="mt-8 flex cursor-pointer items-center gap-2 rounded-md bg-[#0B0B0C] px-6 py-3.5 text-[13px] font-semibold text-white">
                Return to home <ArrowRight size={15} className="text-[#F6C000]" />
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="border-b border-black/10 pb-6">
                <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-black/60">Partner application</p>
                <h2 className="mt-2 text-2xl font-medium tracking-[-0.03em]">Tell us about your service</h2>
                <p className="mt-2 text-[13px] text-black/60">Only three fields are required to get started.</p>
              </div>

              <div>
                <label className="mb-2 block text-[11px] font-medium uppercase tracking-[0.14em] text-black/60">Service type</label>
                <select value={serviceType} onChange={(event) => setServiceType(event.target.value)} className="w-full cursor-pointer rounded-xl border border-black/12 bg-white px-4 py-3.5 text-[14px] outline-hidden focus:border-black">
                  {SERVICE_TYPES.map((type) => <option key={type.slug} value={type.slug}>{type.label}</option>)}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-[11px] font-medium uppercase tracking-[0.14em] text-black/60">Provider / business name *</label>
                <input value={label} onChange={(event) => setLabel(event.target.value)} placeholder={serviceMeta.placeholder} className="w-full rounded-xl border border-black/12 px-4 py-3.5 text-[14px] outline-hidden focus:border-black" />
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-[11px] font-medium uppercase tracking-[0.14em] text-black/60">Phone *</label>
                  <PhoneInputWithCountry value={phone} onChange={setPhone} />
                </div>
                <div>
                  <label className="mb-2 block text-[11px] font-medium uppercase tracking-[0.14em] text-black/60">City / service area *</label>
                  <AutocompleteField
                    label=""
                    value={city}
                    onChange={setCity}
                    suggestions={INDIAN_CITY_NAMES}
                    placeholder="e.g. Pune"
                    inputClassName="w-full rounded-xl border border-black/12 px-4 py-3.5 text-[14px] outline-hidden focus:border-black"
                  />
                </div>
              </div>

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

              <div>
                <label className="mb-2 block text-[11px] font-medium uppercase tracking-[0.14em] text-black/60">Email</label>
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
                <label className="mb-2.5 block text-[11px] font-medium uppercase tracking-[0.14em] text-black/60">Categories you cover <span className="ml-1 normal-case tracking-normal text-black/60">(optional)</span></label>
                <div className="flex flex-wrap gap-2">
                  {STICKER_CATEGORIES.map((category) => {
                    const selected = categories.includes(category.value);
                    return <button type="button" key={category.value} onClick={() => toggleCategory(category.value)} className={`flex cursor-pointer items-center gap-1.5 rounded-full border px-3.5 py-2 text-[12px] transition-colors ${selected ? 'border-[#0B0B0C] bg-[#0B0B0C] text-white' : 'border-black/12 text-black/55 hover:border-black/35'}`}>{selected && <Check size={11} />}{category.label}</button>;
                  })}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-[11px] font-medium uppercase tracking-[0.14em] text-black/60">Anything else we should know</label>
                <textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={4} placeholder="Hours, coverage radius, fleet size, licence number..." className="w-full resize-none rounded-xl border border-black/12 px-4 py-3.5 text-[14px] outline-hidden focus:border-black" />
              </div>

              {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-[13px] text-red-700">{error}</p>}
              <button type="submit" disabled={!valid || submitting} className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-md bg-[#0B0B0C] py-4 text-[14px] font-semibold text-white transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-35">
                {submitting ? <><Loader2 size={16} className="animate-spin" /> Sending application</> : <>Submit application <ArrowRight size={16} className="text-[#F6C000]" /></>}
              </button>
              <p className="text-center text-[11px] text-black/60">We verify every provider before listing. There is no fee to apply.</p>
            </form>
          )}
        </section>
      </div>
    </main>
  );
}

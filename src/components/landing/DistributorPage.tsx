import React, { useMemo, useState } from 'react';
import { ArrowLeft, CheckCircle2, Handshake } from 'lucide-react';
import { FlowButton } from '../ui/flow-button';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { distributorPageTranslations } from '../../i18n/distributorPageTranslations';
import { saveDistributorApplication, getUserDistributorApplication, DistributorApplication } from '../../lib/distributorService';

// Feature bullet lists stay in English-keyed form here and are rendered as-is;
// everything else on this page is translated via distributorPageTranslations.
const TIER_FEATURES: Record<string, string[]> = {
  'retailer-starter': [
    '50x pre-activated weatherproof smart tags',
    'Free counter display rack',
    'Marketing posters and flyer kit',
    'Dealer dashboard with instant QR restock',
    '48-hour priority doorstep logistics',
  ],
  'city-franchise': [
    'Exclusive city territory rights and protection',
    '500x smart QR tags across all categories',
    'Localised dealer branding and shop sign kit',
    'Dedicated territory account manager',
    'All local website buyer leads redirected to you',
    'Quarterly volume bonuses and tier rebate',
  ],
  'master-partner': [
    'State-wide master distribution exclusivity',
    'Custom white-label QR sticker batches',
    'Enterprise REST API and fleet sync console',
    'Sub-dealer network and commission control',
    '24/7 dedicated enterprise support',
  ],
};

interface DistributorPageProps {
  onBack: () => void;
}

export default function DistributorPage({ onBack }: DistributorPageProps) {
  const { profile } = useAuth();
  const { language } = useLanguage();
  const t = distributorPageTranslations[language];
  const DISTRIBUTOR_TIERS = t.tiers.map((tier) => ({ ...tier, features: TIER_FEATURES[tier.id] || [] }));
  const TIER_OPTIONS = t.tierOptions;
  const BUSINESS_OPTIONS = t.businessOptions;
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [business, setBusiness] = useState(BUSINESS_OPTIONS[0]);
  const [tier, setTier] = useState(TIER_OPTIONS[0]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [existingApp, setExistingApp] = useState<DistributorApplication | null>(null);

  // Re-sync the select values to the newly active language's option strings
  // (BUSINESS_OPTIONS/TIER_OPTIONS are plain translated strings, not stable
  // codes) — keep a ref of the options the current selection was made in.
  const priorOptionsRef = React.useRef({ business: BUSINESS_OPTIONS, tier: TIER_OPTIONS });
  React.useEffect(() => {
    const prior = priorOptionsRef.current;
    if (prior.business !== BUSINESS_OPTIONS) {
      const idx = prior.business.indexOf(business);
      setBusiness(BUSINESS_OPTIONS[idx >= 0 ? idx : 0]);
    }
    if (prior.tier !== TIER_OPTIONS) {
      const idx = prior.tier.indexOf(tier);
      setTier(TIER_OPTIONS[idx >= 0 ? idx : 0]);
    }
    priorOptionsRef.current = { business: BUSINESS_OPTIONS, tier: TIER_OPTIONS };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language]);

  React.useEffect(() => {
    if (profile?.email || profile?.phoneNumber) {
      getUserDistributorApplication(profile?.email || profile?.phoneNumber || '').then(setExistingApp);
    }
  }, [profile]);

  React.useEffect(() => {
    if (profile) {
      setName((current) => current || profile.fullName || '');
      setPhone((current) => current || profile.phoneNumber || '');
    }
  }, [profile]);

  const phoneDigits = phone.replace(/\D/g, '').slice(-10);
  const phoneValid = phoneDigits.length === 10;
  const valid = Boolean(name.trim() && phoneValid && city.trim());

  const selectedTierInfo = useMemo(
    () => DISTRIBUTOR_TIERS.find((dt) => tier.startsWith(dt.name.split(' ')[0])) || DISTRIBUTOR_TIERS[0],
    [tier, language]
  );

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!valid) return;
    setSubmitting(true);
    setError('');
    const saved = await saveDistributorApplication({
      userId: profile?.id,
      userName: name.trim(),
      userEmail: profile?.email || '',
      phone: phone.trim(),
      city: city.trim(),
      business,
      tier,
    });
    setSubmitting(false);
    if (saved) setSubmitted(true);
    else setError(t.submitErrorGeneric);
  };

  return (
    <main className="min-h-screen bg-[#FAFAFA] text-[#0B0B0C]">
      <header className="border-b border-black/10 bg-[#FAFAFA]/90 backdrop-blur-md">
        <div className="mx-auto flex h-20 max-w-[1200px] items-center justify-between px-6 sm:px-10">
          <button onClick={onBack} className="flex cursor-pointer items-center gap-2 text-[13px] font-medium text-black/55 transition-colors hover:text-black">
            <ArrowLeft size={16} /> {t.backToHome}
          </button>
          <span className="text-sm font-semibold tracking-[0.16em]">RAPI<span className="text-[#B8860B]">QR</span></span>
          <span className="hidden text-[11px] font-medium uppercase tracking-[0.16em] text-black/60 sm:block">{t.networkTag}</span>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1200px] gap-12 px-6 py-14 sm:px-10 sm:py-20 lg:grid-cols-[0.8fr_1.2fr] lg:items-start lg:gap-20">
        <section className="lg:sticky lg:top-10">
          <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-black/60">{t.becomePartner}</p>
          <h1 className="mt-5 max-w-lg text-[clamp(2.8rem,6vw,5.4rem)] font-medium leading-[0.92] tracking-[-0.055em]">
            {t.heroTitle}
          </h1>
          <p className="mt-6 max-w-md text-[15px] font-light leading-relaxed text-black/55">
            {t.heroDesc}
          </p>

          <div className="mt-10 space-y-4 border-t border-black/10 pt-7">
            {DISTRIBUTOR_TIERS.map((t) => (
              <div key={t.id} className="rounded-lg border border-black/10 bg-white p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-[15px] font-semibold">{t.name}</h3>
                  <span className="rounded-md bg-[#FFCB56] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[#5B4A17]">
                    {t.badge}
                  </span>
                </div>
                <p className="mt-2 text-[13px] leading-relaxed text-black/55">{t.desc}</p>
                <p className="mt-2 text-[12px] font-semibold text-black/70">
                  {t.minUnits} &middot; {t.margin}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-lg border border-black/10 bg-white p-6 shadow-[0_24px_70px_-36px_rgba(0,0,0,0.45)] sm:p-10">
          {submitted ? (
            <div className="flex min-h-[420px] flex-col items-center justify-center text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                <CheckCircle2 size={30} />
              </div>
              <h2 className="mt-6 text-2xl font-medium tracking-[-0.03em]">{t.applicationReceived}</h2>
              <p className="mt-3 max-w-sm text-[14px] leading-relaxed text-black/55">
                {t.thanksPrefix} {name}. {t.thanksMiddle} {tier.toLowerCase()} {t.thanksFor} {city} {t.contactYouOn} {phone}.
              </p>
              <FlowButton tone="dark" className="mt-8" onClick={onBack}>
                {t.returnHome}
              </FlowButton>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="border-b border-black/10 pb-6">
                <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-black/60">{t.partnerApplication}</p>
                <h2 className="mt-2 text-2xl font-medium tracking-[-0.03em]">{t.tellUsAboutBusiness}</h2>
                <p className="mt-2 text-[13px] text-black/60">{t.threeFieldsRequired}</p>
              </div>

              {existingApp && (
                <div className="flex items-start gap-2.5 rounded-md bg-[#FFCB56]/50 p-4 text-[13px] leading-relaxed text-[#5B4A17]">
                  <Handshake size={16} className="mt-0.5 shrink-0" />
                  <span>
                    {t.existingAppPrefix} <strong>{existingApp.tier}</strong> — {t.existingAppStatus}{' '}
                    <strong className="capitalize">{existingApp.status}</strong>. {t.existingAppNote}
                  </span>
                </div>
              )}

              <div>
                <label className="mb-2 block text-[11px] font-medium uppercase tracking-[0.14em] text-black/60">{t.fullName}</label>
                <input value={name} onChange={(event) => setName(event.target.value)} placeholder={t.namePlaceholder} className="w-full rounded-md border border-black/12 px-4 py-3.5 text-[14px] outline-hidden focus:border-black" />
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-[11px] font-medium uppercase tracking-[0.14em] text-black/60">{t.phone}</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    placeholder={t.phonePlaceholder}
                    className="w-full rounded-md border border-black/12 px-4 py-3.5 text-[14px] outline-hidden focus:border-black"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-[11px] font-medium uppercase tracking-[0.14em] text-black/60">{t.city}</label>
                  <input
                    value={city}
                    onChange={(event) => setCity(event.target.value)}
                    placeholder={t.cityPlaceholder}
                    className="w-full rounded-md border border-black/12 px-4 py-3.5 text-[14px] outline-hidden focus:border-black"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-[11px] font-medium uppercase tracking-[0.14em] text-black/60">{t.businessType}</label>
                <select value={business} onChange={(event) => setBusiness(event.target.value)} className="w-full cursor-pointer rounded-md border border-black/12 bg-white px-4 py-3.5 text-[14px] outline-hidden focus:border-black">
                  {BUSINESS_OPTIONS.map((b) => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-[11px] font-medium uppercase tracking-[0.14em] text-black/60">{t.desiredTier}</label>
                <select value={tier} onChange={(event) => setTier(event.target.value)} className="w-full cursor-pointer rounded-md border border-black/12 bg-white px-4 py-3.5 text-[14px] outline-hidden focus:border-black">
                  {TIER_OPTIONS.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                </select>
                <p className="mt-2 text-[12px] leading-relaxed text-black/50">{selectedTierInfo.margin} — {selectedTierInfo.minUnits}</p>
              </div>

              {error && <p className="rounded-md bg-red-50 px-4 py-3 text-[13px] text-red-700">{error}</p>}
              <FlowButton type="submit" tone="dark" size="lg" fullWidth loading={submitting} disabled={!valid}>
                {submitting ? t.sendingApplication : t.submitApplication}
              </FlowButton>
              <p className="text-center text-[11px] text-black/60">{t.noFeeNote}</p>
            </form>
          )}
        </section>
      </div>
    </main>
  );
}

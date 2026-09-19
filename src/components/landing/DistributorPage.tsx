import React, { useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2, Loader2, Handshake } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { saveDistributorApplication, getUserDistributorApplication, DistributorApplication } from '../../lib/distributorService';

interface DistributorTier {
  id: string;
  name: string;
  badge: string;
  minUnits: string;
  margin: string;
  desc: string;
  features: string[];
}

const DISTRIBUTOR_TIERS: DistributorTier[] = [
  {
    id: 'retailer-starter',
    name: 'Retailer Starter Pack',
    badge: 'Garages & retail shops',
    minUnits: '50 - 100 units',
    margin: '40%+ retail margin',
    desc: 'Ideal for auto garages, bike accessory shops, mobile stores, and local locksmiths.',
    features: [
      '50x pre-activated weatherproof smart tags',
      'Free counter display rack',
      'Marketing posters and flyer kit',
      'Dealer dashboard with instant QR restock',
      '48-hour priority doorstep logistics',
    ],
  },
  {
    id: 'city-franchise',
    name: 'City Exclusive Franchise',
    badge: 'Exclusive territory partner',
    minUnits: '500 - 1,000 units',
    margin: '50%+ exclusive margin',
    desc: 'Sole distributor rights for your city or district, with local buyer leads routed to you.',
    features: [
      'Exclusive city territory rights and protection',
      '500x smart QR tags across all categories',
      'Localised dealer branding and shop sign kit',
      'Dedicated territory account manager',
      'All local website buyer leads redirected to you',
      'Quarterly volume bonuses and tier rebate',
    ],
  },
  {
    id: 'master-partner',
    name: 'Master State / Fleet Partner',
    badge: 'Regional master rights',
    minUnits: '2,500+ units',
    margin: '60%+ master margin',
    desc: 'State-level master franchise and large fleet deployments for corporate and logistics networks.',
    features: [
      'State-wide master distribution exclusivity',
      'Custom white-label QR sticker batches',
      'Enterprise REST API and fleet sync console',
      'Sub-dealer network and commission control',
      '24/7 dedicated enterprise support',
    ],
  },
];

const TIER_OPTIONS = [
  'Retail Kit (50 Units)',
  'City Exclusive (500 Units)',
  'Master State Partner (2500+ Units)',
];

const BUSINESS_OPTIONS = [
  'Auto Accessories Shop',
  'Car Dealership / Garage',
  'Locksmith / Security Store',
  'Regional Distributor',
  'Other',
];

interface DistributorPageProps {
  onBack: () => void;
}

export default function DistributorPage({ onBack }: DistributorPageProps) {
  const { profile } = useAuth();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [business, setBusiness] = useState(BUSINESS_OPTIONS[0]);
  const [tier, setTier] = useState(TIER_OPTIONS[0]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [existingApp, setExistingApp] = useState<DistributorApplication | null>(null);

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
    () => DISTRIBUTOR_TIERS.find((t) => tier.startsWith(t.name.split(' ')[0])) || DISTRIBUTOR_TIERS[0],
    [tier]
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
    else setError("We couldn't submit your application just now. Please try again.");
  };

  return (
    <main className="min-h-screen bg-[#FAFAFA] text-[#0B0B0C]">
      <header className="border-b border-black/10 bg-[#FAFAFA]/90 backdrop-blur-md">
        <div className="mx-auto flex h-20 max-w-[1200px] items-center justify-between px-6 sm:px-10">
          <button onClick={onBack} className="flex cursor-pointer items-center gap-2 text-[13px] font-medium text-black/55 transition-colors hover:text-black">
            <ArrowLeft size={16} /> Back to home
          </button>
          <span className="text-sm font-semibold tracking-[0.16em]">RAPI<span className="text-[#B8860B]">QR</span></span>
          <span className="hidden text-[11px] font-medium uppercase tracking-[0.16em] text-black/60 sm:block">Distributor network</span>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1200px] gap-12 px-6 py-14 sm:px-10 sm:py-20 lg:grid-cols-[0.8fr_1.2fr] lg:items-start lg:gap-20">
        <section className="lg:sticky lg:top-10">
          <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-black/60">Become a partner</p>
          <h1 className="mt-5 max-w-lg text-[clamp(2.8rem,6vw,5.4rem)] font-medium leading-[0.92] tracking-[-0.055em]">
            Sell the tag that sells itself.
          </h1>
          <p className="mt-6 max-w-md text-[15px] font-light leading-relaxed text-black/55">
            Partner with RapiQR to distribute smart QR safety tags in your area, shop, or auto network — three
            tiers, from a single retail counter to a state-wide master franchise.
          </p>

          <div className="mt-10 space-y-4 border-t border-black/10 pt-7">
            {DISTRIBUTOR_TIERS.map((t) => (
              <div key={t.id} className="rounded-2xl border border-black/10 bg-white p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-[15px] font-semibold">{t.name}</h3>
                  <span className="rounded-full bg-[#FFCB56] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[#5B4A17]">
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

        <section className="rounded-[1.75rem] border border-black/10 bg-white p-6 shadow-[0_24px_70px_-36px_rgba(0,0,0,0.45)] sm:p-10">
          {submitted ? (
            <div className="flex min-h-[420px] flex-col items-center justify-center text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                <CheckCircle2 size={30} />
              </div>
              <h2 className="mt-6 text-2xl font-medium tracking-[-0.03em]">Application received</h2>
              <p className="mt-3 max-w-sm text-[14px] leading-relaxed text-black/55">
                Thanks, {name}. Our partnerships team will review your {tier.toLowerCase()} inquiry for {city} and
                contact you on {phone}.
              </p>
              <button onClick={onBack} className="mt-8 flex cursor-pointer items-center gap-2 rounded-md bg-[#0B0B0C] px-6 py-3.5 text-[13px] font-semibold text-white">
                Return to home <ArrowRight size={15} className="text-white" />
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="border-b border-black/10 pb-6">
                <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-black/60">Partner application</p>
                <h2 className="mt-2 text-2xl font-medium tracking-[-0.03em]">Tell us about your business</h2>
                <p className="mt-2 text-[13px] text-black/60">Only three fields are required to get started.</p>
              </div>

              {existingApp && (
                <div className="flex items-start gap-2.5 rounded-xl bg-[#FFCB56]/50 p-4 text-[13px] leading-relaxed text-[#5B4A17]">
                  <Handshake size={16} className="mt-0.5 shrink-0" />
                  <span>
                    You already have an application on file for <strong>{existingApp.tier}</strong> — status:{' '}
                    <strong className="capitalize">{existingApp.status}</strong>. Submitting again adds a new inquiry.
                  </span>
                </div>
              )}

              <div>
                <label className="mb-2 block text-[11px] font-medium uppercase tracking-[0.14em] text-black/60">Full name *</label>
                <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Your name" className="w-full rounded-xl border border-black/12 px-4 py-3.5 text-[14px] outline-hidden focus:border-black" />
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-[11px] font-medium uppercase tracking-[0.14em] text-black/60">Phone *</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    placeholder="10-digit mobile number"
                    className="w-full rounded-xl border border-black/12 px-4 py-3.5 text-[14px] outline-hidden focus:border-black"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-[11px] font-medium uppercase tracking-[0.14em] text-black/60">City *</label>
                  <input
                    value={city}
                    onChange={(event) => setCity(event.target.value)}
                    placeholder="e.g. Pune"
                    className="w-full rounded-xl border border-black/12 px-4 py-3.5 text-[14px] outline-hidden focus:border-black"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-[11px] font-medium uppercase tracking-[0.14em] text-black/60">Business type</label>
                <select value={business} onChange={(event) => setBusiness(event.target.value)} className="w-full cursor-pointer rounded-xl border border-black/12 bg-white px-4 py-3.5 text-[14px] outline-hidden focus:border-black">
                  {BUSINESS_OPTIONS.map((b) => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-[11px] font-medium uppercase tracking-[0.14em] text-black/60">Desired tier</label>
                <select value={tier} onChange={(event) => setTier(event.target.value)} className="w-full cursor-pointer rounded-xl border border-black/12 bg-white px-4 py-3.5 text-[14px] outline-hidden focus:border-black">
                  {TIER_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
                <p className="mt-2 text-[12px] leading-relaxed text-black/50">{selectedTierInfo.margin} — {selectedTierInfo.minUnits}</p>
              </div>

              {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-[13px] text-red-700">{error}</p>}
              <button type="submit" disabled={!valid || submitting} className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-md bg-[#0B0B0C] py-4 text-[14px] font-semibold text-white transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-35">
                {submitting ? <><Loader2 size={16} className="animate-spin" /> Sending application</> : <>Submit application <ArrowRight size={16} className="text-white" /></>}
              </button>
              <p className="text-center text-[11px] text-black/60">No fee to apply. Our partnerships team verifies every inquiry.</p>
            </form>
          )}
        </section>
      </div>
    </main>
  );
}

import { ArrowLeft, ArrowRight, CheckCircle2, QrCode } from 'lucide-react';

interface PricingPlan {
  id: string;
  name: string;
  desc: string;
  features: string[];
  cta: string;
}

const PRICING_PLANS: PricingPlan[] = [
  {
    id: 'solo',
    name: 'Solo Starter',
    desc: 'One vehicle or personal asset.',
    features: [
      '1x weatherproof smart sticker',
      'Masked call and WhatsApp alerts',
      'Lifetime dashboard access',
    ],
    cta: 'Order Now',
  },
  {
    id: 'family',
    name: 'Family Trio',
    desc: 'Three tags for car, bike and gate or pets.',
    features: [
      '3x multi-category smart tags',
      'Multi-responder emergency tree',
      'Free priority 48h shipping',
    ],
    cta: 'Order Now',
  },
  {
    id: 'fleet',
    name: 'Society & Fleet',
    desc: 'Bulk tags for apartments, schools and logistics.',
    features: [
      'Custom branded logo and colours',
      'Admin master fleet dashboard',
      'Dedicated relationship manager',
    ],
    cta: 'Inquire Bulk Quote',
  },
];

interface PricingPageProps {
  onBack: () => void;
  onOrderNow: () => void;
}

export default function PricingPage({ onBack, onOrderNow }: PricingPageProps) {
  return (
    <main className="min-h-screen bg-[#FAFAFA] text-[#0B0B0C]">
      <header className="border-b border-black/10 bg-[#FAFAFA]/90 backdrop-blur-md">
        <div className="mx-auto flex h-20 max-w-[1200px] items-center justify-between px-6 sm:px-10">
          <button onClick={onBack} className="flex cursor-pointer items-center gap-2 text-[13px] font-medium text-black/55 transition-colors hover:text-black">
            <ArrowLeft size={16} /> Back to home
          </button>
          <span className="flex items-center gap-2 text-sm font-semibold tracking-[0.16em]">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#0B0B0C] text-white">
              <QrCode size={14} />
            </span>
            RAPI<span className="text-[#B8860B]">QR</span>
          </span>
          <span className="hidden text-[11px] font-medium uppercase tracking-[0.16em] text-black/60 sm:block">Plans & pricing</span>
        </div>
      </header>

      <div className="mx-auto max-w-[1200px] px-6 py-14 sm:px-10 sm:py-20">
        <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-black/60">Simple pricing</p>
        <h1 className="mt-5 max-w-2xl text-[clamp(2.6rem,5.6vw,4.6rem)] font-medium leading-[0.96] tracking-[-0.05em]">
          Plans &amp; packages for every asset.
        </h1>
        <p className="mt-6 max-w-xl text-[15px] font-light leading-relaxed text-black/55">
          One tag or a hundred — pick the pack that fits, and every plan ships with the same masked-call
          privacy and lifetime dashboard access.
        </p>

        <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-3">
          {PRICING_PLANS.map((plan) => {
            const featured = plan.id === 'family';
            return (
              <div
                key={plan.id}
                className={`flex flex-col rounded-[1.75rem] p-8 ${
                  featured
                    ? 'bg-[#FFCB56] text-[#0B0B0C] shadow-[0_24px_70px_-36px_rgba(0,0,0,0.45)]'
                    : 'border border-black/10 bg-white text-[#0B0B0C]'
                }`}
              >
                {featured && (
                  <span className="mb-4 inline-block w-fit rounded-full bg-black/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wide">
                    Most Popular
                  </span>
                )}
                <h2 className="text-2xl font-medium tracking-[-0.02em]">{plan.name}</h2>
                <p className={`mt-2 text-[14px] leading-relaxed ${featured ? 'text-[#4B3C00]/80' : 'text-black/55'}`}>
                  {plan.desc}
                </p>
                <ul className="mt-8 flex-1 space-y-3">
                  {plan.features.map((feat) => (
                    <li key={feat} className="flex items-start gap-2.5 text-[13.5px] leading-snug">
                      <CheckCircle2 size={16} className="mt-0.5 flex-shrink-0 text-[#16A34A]" />
                      {feat}
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  onClick={onOrderNow}
                  className={`mt-8 flex cursor-pointer items-center justify-center gap-2 rounded-md py-3.5 text-[13.5px] font-semibold transition-transform hover:-translate-y-0.5 ${
                    featured ? 'bg-[#0B0B0C] text-white' : 'bg-[#FFCB56] text-[#0B0B0C]'
                  }`}
                >
                  {plan.cta}
                  <ArrowRight size={15} />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}

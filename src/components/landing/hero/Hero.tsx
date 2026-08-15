import HeroBackground from './HeroBackground';
import HeroBadge from './HeroBadge';
import HeroContent from './HeroContent';
import HeroActions from './HeroActions';
import SocialProof from './SocialProof';
import PhoneMockup from './PhoneMockup';
import FeatureCallouts from './FeatureCallouts';
import HeroFeatureBar from './HeroFeatureBar';

export default function Hero({ onStart }: { onStart: () => void }) {
  return (
    <section
      className="relative overflow-hidden"
      aria-label="RapiQR — India's smartest QR safety network"
      style={{
        background:
          'linear-gradient(180deg, #FFFBF0 0%, #FFFFFF 42%), ' +
          'radial-gradient(1100px circle at 88% 10%, rgba(240,165,0,0.12), transparent 60%), ' +
          'radial-gradient(800px circle at 6% 95%, rgba(240,165,0,0.07), transparent 60%)',
      }}
    >
      <HeroBackground />

      <div
        className="relative mx-auto"
        style={{ maxWidth: 1400, zIndex: 10, padding: '96px 24px 56px' }}
      >
        <div className="grid grid-cols-1 items-center gap-16 lg:grid-cols-[45%_55%] lg:gap-10">
          {/* Left: message + CTAs */}
          <div>
            <HeroBadge />
            <HeroContent />
            <HeroActions onStart={onStart} />
            <SocialProof />
          </div>

          {/* Right: phone showcase + feature callouts */}
          <div className="flex flex-col items-center gap-12 lg:flex-row lg:items-center lg:justify-center lg:gap-8">
            <PhoneMockup />
            <FeatureCallouts />
          </div>
        </div>

        <HeroFeatureBar />
      </div>
    </section>
  );
}

import { Download } from "lucide-react";
import { useInstallPrompt } from "../../lib/pwaInstall";
import PwaInstallModal from "./PwaInstallModal";

/**
 * Floating "Install App" button — same position/sizing as the floating
 * AI-assistant button it replaced, so it reads as part of the same UI
 * language. Always rendered once mounted (unless already installed);
 * see useInstallPrompt for why visibility isn't gated on any single event.
 */
export default function InstallAppFab() {
  const { installed, installing, install, showGuide, setShowGuide } = useInstallPrompt();
  if (installed) return null;

  return (
    <>
      <button
        onClick={install}
        disabled={installing}
        className="fixed bottom-[max(1.25rem,calc(env(safe-area-inset-bottom)+0.5rem))] right-5 z-40 bg-[#111111] hover:bg-black text-white font-black text-xs px-4 py-3 rounded-full shadow-2xl flex items-center gap-2 border-2 border-white/30 active:scale-95 transition-all cursor-pointer disabled:opacity-70"
        aria-label="Install the RapiQR app"
      >
        <Download size={17} />
        <span>{installing ? "Installing…" : "Install App"}</span>
      </button>

      <PwaInstallModal
        isOpen={showGuide}
        onClose={() => setShowGuide(false)}
      />
    </>
  );
}

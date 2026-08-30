import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import {
  isRunningInstalled,
  isIOS,
  isInstallPromptAvailable,
  onInstallPromptChange,
  promptInstall,
} from "../../lib/pwaInstall";

/**
 * Floating "Install App" button — same position/sizing as the floating
 * AI-assistant button it replaced, so it reads as part of the same UI
 * language. Chromium gets a real install prompt; iOS (which never fires
 * beforeinstallprompt) gets a brief manual-instructions hint instead.
 * Renders nothing once already installed.
 */
export default function InstallAppFab() {
  const [visible, setVisible] = useState(false);
  const [canPrompt, setCanPrompt] = useState(isInstallPromptAvailable());
  const [ios] = useState(isIOS());
  const [installing, setInstalling] = useState(false);
  const [showHint, setShowHint] = useState(false);

  useEffect(() => {
    if (isRunningInstalled()) return;
    if (isInstallPromptAvailable() || ios) setVisible(true);
    return onInstallPromptChange(() => {
      setCanPrompt(true);
      setVisible(true);
    });
  }, [ios]);

  if (!visible) return null;

  const handleClick = async () => {
    if (canPrompt) {
      setInstalling(true);
      const outcome = await promptInstall();
      setInstalling(false);
      if (outcome !== "unavailable") setVisible(false);
      return;
    }
    setShowHint(true);
    setTimeout(() => setShowHint(false), 4000);
  };

  return (
    <>
      {showHint && (
        <div className="fixed bottom-[calc(max(1.25rem,calc(env(safe-area-inset-bottom)+0.5rem))+4rem)] right-5 z-40 max-w-[220px] bg-slate-900 text-white text-xs font-semibold rounded-2xl px-3.5 py-2.5 shadow-2xl animate-fade-in">
          Tap Share, then "Add to Home Screen" to install.
        </div>
      )}
      <button
        onClick={handleClick}
        disabled={installing}
        className="fixed bottom-[max(1.25rem,calc(env(safe-area-inset-bottom)+0.5rem))] right-5 z-40 bg-gradient-to-br from-orange-500 to-amber-600 hover:brightness-110 text-white font-black text-xs px-4 py-3 rounded-full shadow-2xl flex items-center gap-2 border-2 border-white/30 active:scale-95 transition-all cursor-pointer disabled:opacity-70"
        aria-label="Install the RapiQR app"
      >
        <Download size={17} />
        <span>{installing ? "Installing…" : "Install App"}</span>
      </button>
    </>
  );
}

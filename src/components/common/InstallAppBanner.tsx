import { useEffect, useState } from "react";
import { Download, X, Share } from "lucide-react";
import {
  isRunningInstalled,
  isIOS,
  isInstallPromptAvailable,
  onInstallPromptChange,
  promptInstall,
} from "../../lib/pwaInstall";

/**
 * Shown automatically at the top of a page (ScanPage) so a visitor is
 * offered the installed app immediately, not buried in a settings menu.
 * Chromium browsers get a real "Install" button; iOS Safari never fires the
 * event that button depends on, so it gets manual Share -> Add to Home
 * Screen instructions instead. Hidden entirely once already installed.
 */
export default function InstallAppBanner() {
  const [visible, setVisible] = useState(false);
  const [canPrompt, setCanPrompt] = useState(isInstallPromptAvailable());
  const [ios] = useState(isIOS());
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    if (isRunningInstalled()) return;
    // Chromium: wait for the real prompt to be ready. iOS: there's nothing to
    // wait for, so show the manual-instructions banner right away.
    if (isInstallPromptAvailable() || ios) setVisible(true);

    return onInstallPromptChange(() => {
      setCanPrompt(true);
      setVisible(true);
    });
  }, [ios]);

  if (!visible) return null;

  const handleInstall = async () => {
    setInstalling(true);
    const outcome = await promptInstall();
    setInstalling(false);
    if (outcome !== 'unavailable') setVisible(false);
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-2 sm:px-4 pt-3 z-20 relative animate-fade-in">
      <div className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50/90 backdrop-blur px-4 py-3 shadow-sm">
        <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-600 flex items-center justify-center flex-shrink-0">
          <Download size={16} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-900">Download this app</p>
          <p className="text-xs text-slate-500 truncate">
            {ios
              ? 'Tap Share, then "Add to Home Screen" for faster access next time.'
              : 'Install RapiQR for faster, app-like access to this sticker.'}
          </p>
        </div>
        {!ios && canPrompt && (
          <button
            onClick={handleInstall}
            disabled={installing}
            className="flex-shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold disabled:opacity-60 cursor-pointer transition-colors"
          >
            <Download size={13} /> {installing ? 'Installing…' : 'Install'}
          </button>
        )}
        {ios && (
          <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-white border border-amber-200 flex items-center justify-center text-amber-600">
            <Share size={14} />
          </div>
        )}
        <button
          onClick={() => setVisible(false)}
          className="flex-shrink-0 w-7 h-7 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-white/60 flex items-center justify-center cursor-pointer transition-colors"
          aria-label="Dismiss"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}

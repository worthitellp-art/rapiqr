import { Download } from "lucide-react";
import { useInstallPrompt } from "../../lib/pwaInstall";

/**
 * Full-width "Install App" call-to-action — takes the spot the "RapiQR AI
 * Assistant" bar used to occupy on the scan page. Renders nothing once
 * already installed; otherwise always shows something clickable (see
 * useInstallPrompt for why this isn't gated on beforeinstallprompt firing).
 */
export default function InstallAppBar() {
  const { installed, installing, hint, install } = useInstallPrompt();
  if (installed) return null;

  return (
    <div className="relative">
      {hint && (
        <div className="absolute -top-2 left-1/2 -translate-x-1/2 -translate-y-full w-full max-w-xs text-center bg-slate-900 text-white text-xs font-semibold rounded-2xl px-3.5 py-2.5 shadow-2xl animate-fade-in z-10">
          {hint}
        </div>
      )}
      <button
        onClick={install}
        disabled={installing}
        className="w-full bg-gradient-to-r from-orange-400 via-amber-400 to-orange-500 hover:from-orange-500 hover:to-amber-500 text-gray-950 rounded-2xl p-4 flex items-center justify-between shadow-md shadow-orange-500/20 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-70"
      >
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-11 h-11 rounded-xl bg-gray-950/15 text-gray-950 flex items-center justify-center font-bold text-xl flex-shrink-0">
            <Download size={22} />
          </div>
          <div className="text-left min-w-0">
            <p className="text-sm font-black text-gray-950 tracking-tight">Install RapiQR App</p>
            <p className="text-[11px] font-medium text-gray-900">Faster, app-like access to this sticker</p>
          </div>
        </div>
        <div className="bg-gray-950 text-amber-400 font-black text-xs px-3.5 py-2 rounded-xl shadow-xs flex items-center gap-1 flex-shrink-0">
          {installing ? "…" : "GET"}
        </div>
      </button>
    </div>
  );
}

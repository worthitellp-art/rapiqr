import darkBgLogo from '../../../assets/darkbglogo.png';

/**
 * Real site footer reused outside the marketing landing page — same brand,
 * legal entity details and contact info as the main footer, trimmed to drop
 * links that only resolve on the landing page itself (cart-linked product
 * list, scroll-to-section "About Us").
 */
export default function SiteFooter() {
  return (
    <footer className="border-t border-[#FFFFFF]/10 bg-[#14120C] text-[#FFFFFF]">
      <div className="mx-auto max-w-5xl px-5 py-10 sm:px-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <img src={darkBgLogo} alt="RepiQR" className="h-7 w-auto object-contain" />
            <p className="text-[13px] font-light text-[#FFFFFF]/50">Scan. Connect. Stay Safe.</p>
          </div>

          <div className="flex flex-wrap gap-x-6 gap-y-2 text-[13px] font-light text-[#FFFFFF]/55">
            <a href="/privacy" className="transition-colors hover:text-[#FFFFFF]">
              Privacy Policy
            </a>
            <a href="mailto:admin@repiqr.com" className="transition-colors hover:text-[#FFFFFF]">
              admin@repiqr.com
            </a>
            <a href="tel:+919313719720" className="transition-colors hover:text-[#FFFFFF]">
              +91 93137 19720
            </a>
          </div>
        </div>

        <div className="mt-8 space-y-1.5 border-t border-[#FFFFFF]/10 pt-6 text-[12px] font-light text-[#FFFFFF]/50">
          <p>
            <span className="font-semibold text-[#FFFFFF]/70">RepiQR</span> is a product of{' '}
            <span className="font-semibold text-[#FFFFFF]/70">Worthite LLP</span> | LLPIN: ADA-2053 | GSTIN:
            24AAFFW7093N1ZH
          </p>
          <p className="text-[#FFFFFF]/35">© {new Date().getFullYear()} Worthite LLP. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

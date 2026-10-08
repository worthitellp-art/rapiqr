import React, { useEffect } from 'react';
import { X, Download } from 'lucide-react';
import { OrderInvoice } from '../../types/invoice';
import { INVOICE_LOGO_BASE64, INVOICE_ICON_BASE64 } from '../../services/invoiceAssets';

interface OrderInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: OrderInvoice | null;
  onPrintInvoice: () => void;
}

function formatCurrency(val: number): string {
  return '₹ ' + val.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function OrderInvoiceModal({
  isOpen,
  onClose,
  invoice,
  onPrintInvoice,
}: OrderInvoiceModalProps) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen || !invoice) {
    return null;
  }

  const {
    invoiceNumber,
    issueDate,
    customerName,
    customerEmail,
    customerPhone,
    shippingAddress,
    items,
    taxBreakdown,
  } = invoice;

  const addressLines = [
    shippingAddress.address,
    [shippingAddress.city, shippingAddress.state].filter(Boolean).join(', '),
    shippingAddress.pincode,
  ].filter(Boolean);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="invoice-modal-title"
    >
      {/* Backdrop click dismiss */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Modal Card Container */}
      <div className="relative z-10 w-full max-w-3xl max-h-[94vh] flex flex-col rounded-3xl bg-slate-100 shadow-2xl border border-slate-200 overflow-hidden text-slate-900">
        {/* Top Control Bar */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-white/95 px-5 py-3.5 sm:px-6">
          <div className="flex items-center gap-2 text-sm font-black text-slate-900">
            <span>Official Tax Invoice</span>
            <span className="rounded-sm bg-yellow-100 px-2 py-0.5 text-xs font-bold text-yellow-900">
              Nº: {invoiceNumber}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onPrintInvoice}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-slate-900 px-4 py-1.5 text-xs font-bold text-white transition-colors hover:bg-slate-800 shadow-xs"
              title="Download PDF"
            >
              <Download size={13} className="text-white" />
              <span>Download PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-slate-100 text-slate-600 transition-colors hover:bg-slate-200 hover:text-slate-900"
              aria-label="Close"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Scrollable Printable Invoice Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8">
          <div
            className="w-full bg-white rounded-3xl p-6 sm:p-10 shadow-xs border border-slate-200/80 relative overflow-hidden"
            style={{
              backgroundImage:
                'radial-gradient(circle at 45% 8%, rgba(254, 240, 138, 0.45) 0%, rgba(255, 255, 255, 0) 48%), radial-gradient(circle at 80% 92%, rgba(254, 240, 138, 0.5) 0%, rgba(255, 255, 255, 0) 42%)',
            }}
          >
            {/* Top Row: Logo & Invoice Pill */}
            <div className="flex items-start justify-between gap-4 mb-8">
              <div className="bg-white rounded-2xl p-3 sm:p-4 shadow-sm border border-slate-100 inline-flex items-center">
                <img src={INVOICE_LOGO_BASE64} alt="RepiQR" className="h-8 sm:h-9 w-auto object-contain" />
              </div>
              <div className="bg-white rounded-full px-5 py-2 text-xs sm:text-sm font-extrabold tracking-widest text-slate-900 shadow-xs border border-slate-100 uppercase">
                INVOICE
              </div>
            </div>

            {/* 3-Column Info Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8 text-xs">
              {/* Col 1: Invoice to */}
              <div>
                <span className="inline-block bg-[#FFD233] text-black font-bold text-[11px] px-2.5 py-1 rounded-md mb-2.5">
                  Invoice to:
                </span>
                <h3 className="text-base font-extrabold text-slate-900 mb-1">{customerName}</h3>
                {customerPhone && <p className="text-slate-600 text-[11px] mb-0.5">{customerPhone}</p>}
                {customerEmail && <p className="text-slate-600 text-[11px] mb-1">{customerEmail}</p>}
                <p className="text-slate-500 text-[11px] leading-relaxed">
                  {addressLines.join(', ')}
                </p>
              </div>

              {/* Col 2: Date & Seller */}
              <div>
                <span className="inline-block bg-[#FFD233] text-black font-bold text-[11px] px-2.5 py-1 rounded-md mb-2.5">
                  Date:
                </span>
                <h3 className="text-base font-extrabold text-slate-900 mb-1">{issueDate}</h3>
                <p className="font-bold text-slate-800 text-[11px] mb-0.5">Worthite LLP</p>
                <p className="font-semibold text-slate-600 text-[11px] mb-1">GSTIN- 24AAFFW7093N1ZH</p>
                <p className="text-slate-500 text-[11px] leading-relaxed">
                  38, KADAMBARI COMPLEX, OPP. ASTHALNI JAGYA, Thangadh, Surendra Nagar, Gujarat, India, 363530.
                </p>
              </div>

              {/* Col 3: Invoice Number */}
              <div>
                <span className="inline-block bg-[#FFD233] text-black font-bold text-[11px] px-2.5 py-1 rounded-md mb-2.5">
                  Invoice number:
                </span>
                <h3 className="text-base font-extrabold text-slate-900">Nº: {invoiceNumber}</h3>
              </div>
            </div>

            {/* Line Items Table */}
            <div className="w-full mb-8 overflow-hidden rounded-xl">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-900 text-xs font-bold">
                    <th className="py-3 px-4 rounded-l-xl">Item</th>
                    <th className="py-3 px-4 text-center">Price</th>
                    <th className="py-3 px-4 text-center">Qty</th>
                    <th className="py-3 px-4 text-right rounded-r-xl">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {items.map((item, idx) => (
                    <tr key={item.id || idx}>
                      <td className="py-3.5 px-4 font-bold text-slate-900">{item.name}</td>
                      <td className="py-3.5 px-4 text-center text-slate-600 font-medium">
                        {formatCurrency(item.unitPrice)}
                      </td>
                      <td className="py-3.5 px-4 text-center text-slate-600 font-medium">
                        {item.quantity}
                      </td>
                      <td className="py-3.5 px-4 text-right font-extrabold text-slate-900">
                        {formatCurrency(item.totalPrice)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Bottom Section: Terms & Totals */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 items-start mb-10 pt-2">
              <div className="text-[11px] text-slate-500 leading-relaxed">
                <div className="font-extrabold text-slate-900 text-xs mb-1.5">Terms &amp; Conditions:</div>
                <p>
                  Product is non-refundable after activation. Customer is responsible for providing accurate
                  information. RepiQR is not liable for service interruptions, misuse, or issues caused by
                  damaged/incorrectly placed QR stickers. Emergency assistance depends on respective service
                  providers. By purchasing, you agree to RepiQR's Terms &amp; Privacy Policy.
                </p>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center py-0.5">
                  <span className="font-bold text-slate-900">Subtotal</span>
                  <span className="font-extrabold text-amber-600 text-sm">
                    {formatCurrency(taxBreakdown.taxableSubtotal)}
                  </span>
                </div>
                <div className="flex justify-between items-center py-0.5 text-slate-600">
                  <span className="font-bold text-slate-800">CGST 9%</span>
                  <span>{formatCurrency(taxBreakdown.centralGstAmount)}</span>
                </div>
                <div className="flex justify-between items-center py-0.5 text-slate-600">
                  <span className="font-bold text-slate-800">SGST 9%</span>
                  <span>{formatCurrency(taxBreakdown.stateGstAmount)}</span>
                </div>
                {taxBreakdown.deliveryFee > 0 && (
                  <div className="flex justify-between items-center py-0.5 text-slate-600">
                    <span className="font-bold text-slate-800">Delivery Fee</span>
                    <span>{formatCurrency(taxBreakdown.deliveryFee)}</span>
                  </div>
                )}
                <div className="bg-slate-50 rounded-xl p-3.5 flex justify-between items-center mt-2 border border-slate-100">
                  <span className="font-extrabold text-sm text-slate-900">Invoice total</span>
                  <span className="font-black text-sm text-slate-950">
                    {formatCurrency(taxBreakdown.grandTotal)}
                  </span>
                </div>
              </div>
            </div>

            {/* Footer: Brand & Glyph */}
            <div className="flex justify-between items-end pt-6 border-t border-slate-100 text-xs">
              <div>
                <div className="font-extrabold text-slate-900 text-sm mb-0.5">RepiQR</div>
                <div className="text-slate-500 text-[11px]">www.repiqr.com</div>
                <div className="text-slate-500 text-[11px]">admin@repiqr.com &nbsp;/&nbsp; +91 93137 19720</div>
              </div>
              <div>
                <img src={INVOICE_ICON_BASE64} alt="R" className="h-10 w-auto object-contain" />
              </div>
            </div>
          </div>
        </div>

        {/* Modal Action Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-slate-200 bg-white px-5 py-3.5 sm:px-6">
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-full border border-slate-300 hover:border-slate-900 bg-white hover:bg-slate-50 px-4 py-2 text-xs font-bold text-slate-700 transition-colors"
          >
            Close
          </button>
          <button
            type="button"
            onClick={onPrintInvoice}
            className="flex cursor-pointer items-center gap-1.5 rounded-full bg-slate-900 hover:bg-slate-800 border border-slate-900 px-5 py-2 text-xs font-bold text-white transition-colors shadow-xs"
          >
            <Download size={13} />
            <span>Download PDF</span>
          </button>
        </div>
      </div>
    </div>
  );
}

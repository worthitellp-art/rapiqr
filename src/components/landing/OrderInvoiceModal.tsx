import React, { useEffect } from 'react';
import {
  Printer,
  X,
  FileText,
  Building2,
  CheckCircle2,
  Download,
  ShieldCheck,
} from 'lucide-react';
import { OrderInvoice } from '../../types/invoice';
import { useLanguage } from '../../context/LanguageContext';
import { orderTranslations } from '../../i18n/orderTranslations';

interface OrderInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: OrderInvoice | null;
  onPrintInvoice: () => void;
}

export default function OrderInvoiceModal({
  isOpen,
  onClose,
  invoice,
  onPrintInvoice,
}: OrderInvoiceModalProps) {
  const { language } = useLanguage();
  const t = orderTranslations[language].invoiceModal;

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
    orderReferenceId,
    orderTimestamp,
    seller,
    customerName,
    customerEmail,
    customerPhone,
    shippingAddress,
    items,
    taxBreakdown,
    paymentMethod,
    paymentStatus,
    paymentTransactionId,
    deliveryType,
  } = invoice;

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
      <div className="relative z-10 w-full max-w-3xl max-h-[92vh] flex flex-col rounded-lg bg-white shadow-2xl border border-slate-200 overflow-hidden text-slate-900">
        {/* Top Control Bar */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/90 px-5 py-3.5 sm:px-6">
          <div className="flex items-center gap-2 text-sm font-black text-slate-900">
            <FileText size={18} className="text-[#111111]" />
            <span id="invoice-modal-title">{t.title}</span>
            <span className="hidden sm:inline-block rounded-sm bg-gray-100 px-2 py-0.5 text-xs font-bold text-gray-900">
              #{invoiceNumber}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onPrintInvoice}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-md bg-slate-900 px-3.5 py-1.5 text-xs font-bold text-white transition-colors hover:bg-slate-800 shadow-xs"
              title="Download PDF"
            >
              <Download size={14} className="text-white" />
              <span>Download PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-md bg-slate-200/80 text-slate-600 transition-colors hover:bg-slate-300 hover:text-slate-900"
              aria-label={t.closeAria}
            >
              <X size={17} />
            </button>
          </div>
        </div>

        {/* Scrollable Printable Invoice Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-8 space-y-6 text-xs sm:text-sm">
          {/* Header row: Brand & Invoice Meta */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b-2 border-slate-900 pb-5">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xl sm:text-2xl font-black tracking-tight text-slate-950">
                  Repi<span className="text-[#EAB308]">QR</span>
                </span>
              </div>
              <div className="mt-1 font-bold text-slate-900 text-sm">Worthite LLP</div>
              <div className="text-[11px] text-slate-500 leading-relaxed max-w-sm mt-0.5">
                Surendranagar, Gujarat - 363530
                <br />
                GSTIN: <span className="font-semibold text-slate-700">{seller.gstin}</span>
              </div>
            </div>

            <div className="sm:text-right space-y-1">
              <div>
                <span className="inline-block rounded-md bg-emerald-100 border border-emerald-300 px-3 py-1 text-xs font-black text-emerald-800 tracking-wider">
                  PAID
                </span>
              </div>
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-1">
                {t.invoiceNumberLabel}
              </div>
              <div className="text-base sm:text-lg font-black font-mono text-slate-950">
                #{invoiceNumber}
              </div>
              <div className="text-xs text-slate-600">
                {t.invoiceDateLabel} <strong className="text-slate-900">{issueDate}</strong>
              </div>
              <div className="text-xs text-slate-500">
                {t.orderIdLabel} <strong className="font-mono text-slate-700">{orderReferenceId}</strong>
              </div>
            </div>
          </div>

          {/* Customer & Order Metadata */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-lg border border-slate-200 bg-slate-50/80 p-4 space-y-1">
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                {t.billedShippedTo}
              </div>
              <div className="font-extrabold text-slate-900">{customerName}</div>
              <div className="text-xs text-slate-600 leading-relaxed">
                {shippingAddress.address}
                <br />
                {shippingAddress.city}, {shippingAddress.state} - {shippingAddress.pincode}
              </div>
              <div className="pt-1 text-[11px] text-slate-500">
                {t.phoneLabel} <strong className="text-slate-700">{customerPhone}</strong>
                <br />
                {t.emailLabel} <strong className="text-slate-700">{customerEmail}</strong>
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-slate-50/80 p-4 space-y-1">
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                {t.orderPaymentStatus}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-extrabold pt-0.5">
                <CheckCircle2 size={14} className="text-emerald-600" />
                <span>{t.paymentStatusPrefix}{paymentStatus}</span>
              </div>
              <div className="text-xs text-slate-600">
                {t.paymentModeLabel} <strong className="text-slate-900">{paymentMethod}</strong>
              </div>
              {paymentTransactionId && (
                <div className="text-[11px] text-slate-500 font-mono">
                  {t.gatewayRefLabel} {paymentTransactionId}
                </div>
              )}
              <div className="text-[11px] text-slate-500">
                {t.fulfilledViaLabel}{' '}
                <strong className="text-slate-700">
                  {deliveryType === 'express' ? t.expressPriority : t.standardDelivery}
                </strong>
              </div>
              <div className="text-[11px] text-slate-400">{t.orderPlacedLabel} {orderTimestamp}</div>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="rounded-lg border border-slate-200 overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900 text-white text-[11px] uppercase tracking-wider">
                  <th className="py-2.5 px-3 w-10 text-center">#</th>
                  <th className="py-2.5 px-3">{t.itemDescriptionHeader}</th>
                  <th className="py-2.5 px-3 text-center w-14">{t.qtyHeader}</th>
                  <th className="py-2.5 px-3 text-right w-24">{t.unitRateHeader}</th>
                  <th className="py-2.5 px-3 text-right w-28">{t.amountHeader}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-xs">
                {items.map((item, index) => (
                  <tr key={item.id || index} className="hover:bg-slate-50/60">
                    <td className="py-2.5 px-3 text-center text-slate-400 font-medium">
                      {index + 1}
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="font-extrabold text-slate-900">{item.name}</div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        {t.hsnSacLabel} {item.hsnSacCode}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-center font-bold text-slate-800">
                      {item.quantity}
                    </td>
                    <td className="py-2.5 px-3 text-right font-medium text-slate-600">
                      ₹{item.unitPrice.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-extrabold text-slate-900">
                      ₹{item.totalPrice.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Financial Calculation Summary */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 pt-2">
            <div className="text-[11px] text-slate-400 space-y-1 max-w-sm">
              <p>Official computer-generated tax invoice issued by Worthite LLP.</p>
            </div>

            <div className="w-full sm:w-72 space-y-1.5 rounded-lg bg-slate-50 p-4 border border-slate-200 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>{t.taxableBaseLabel}</span>
                <span className="font-semibold text-slate-800">
                  ₹{taxBreakdown.taxableSubtotal.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>{t.cgstLabel}</span>
                <span className="font-semibold text-slate-800">
                  ₹{taxBreakdown.centralGstAmount.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>{t.sgstLabel}</span>
                <span className="font-semibold text-slate-800">
                  ₹{taxBreakdown.stateGstAmount.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>{t.shippingFeeLabel}</span>
                <span className="font-semibold text-slate-800">
                  {taxBreakdown.deliveryFee === 0
                    ? t.free
                    : `₹${taxBreakdown.deliveryFee.toFixed(2)}`}
                </span>
              </div>
              <div className="flex justify-between border-t border-slate-300 pt-2 text-sm font-black text-slate-950">
                <span>{t.totalAmountPaidLabel}</span>
                <span className="text-[#111111]">₹{taxBreakdown.grandTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Signature Section */}
          <div className="flex justify-end pt-3">
            <div className="text-center min-w-[200px]">
              <div className="text-xs font-bold text-slate-600 mb-1">For Worthite LLP</div>
              <div className="font-serif italic text-2xl text-slate-900 border-b border-slate-300 pb-1 mb-1 select-none">
                Worthite LLP
              </div>
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Authorized Signatory
              </div>
            </div>
          </div>

          {/* Digital Signature Disclaimer */}
          <div className="border-t border-dashed border-slate-300 pt-4 text-center text-[10px] text-slate-400">
            {t.computerGeneratedNotice}{' '}
            <span className="font-semibold text-slate-600">{seller.supportEmail}</span>
          </div>
        </div>

        {/* Modal Action Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-gray-200 bg-gray-50/50 px-5 py-3.5 sm:px-6">
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-md border border-gray-300 hover:border-black bg-white hover:bg-gray-50 px-4 py-2 text-xs font-semibold text-gray-700 transition-colors"
          >
            {t.closeButton}
          </button>
          <button
            type="button"
            onClick={onPrintInvoice}
            className="flex cursor-pointer items-center gap-1.5 rounded-md bg-slate-900 hover:bg-slate-800 border border-slate-900 px-4 py-2 text-xs font-bold text-white transition-colors shadow-xs"
          >
            <Download size={14} />
            <span>Download PDF</span>
          </button>
        </div>
      </div>
    </div>
  );
}

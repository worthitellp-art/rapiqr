import React from 'react';
import { FileText, Printer, Eye, Download, CheckCircle2 } from 'lucide-react';
import { OrderInvoice } from '../../types/invoice';

interface OrderInvoiceCardProps {
  invoice: OrderInvoice;
  onViewInvoice: () => void;
  onPrintInvoice: () => void;
}

export default function OrderInvoiceCard({
  invoice,
  onViewInvoice,
  onPrintInvoice,
}: OrderInvoiceCardProps) {
  const { invoiceNumber, issueDate, customerName, taxBreakdown, paymentMethod } = invoice;

  return (
    <div className="rounded-2xl border border-slate-200 bg-linear-to-b from-white to-slate-50 p-5 sm:p-6 text-left shadow-sm space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gray-100 text-[#111111]">
            <FileText size={17} />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900">Order Tax Invoice</h3>
            <div className="text-[11px] text-slate-500 font-mono">#{invoiceNumber}</div>
          </div>
        </div>

        <div className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-extrabold text-emerald-700">
          <CheckCircle2 size={12} className="text-emerald-600" />
          <span>GST Paid</span>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Billed To
          </span>
          <span className="font-extrabold text-slate-800 truncate block">{customerName}</span>
        </div>
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Invoice Date
          </span>
          <span className="font-semibold text-slate-700 block">{issueDate}</span>
        </div>
        <div className="col-span-2 sm:col-span-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Amount Paid
          </span>
          <span className="font-black text-[#111111] block">
            ₹{taxBreakdown.grandTotal.toFixed(2)}{' '}
            <span className="text-[10px] font-normal text-slate-400">({paymentMethod})</span>
          </span>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
        <button
          type="button"
          onClick={onPrintInvoice}
          className="flex-1 cursor-pointer rounded-xl bg-[#111111] hover:bg-black px-4 py-2.5 text-xs font-black text-white transition-colors flex items-center justify-center gap-1.5 shadow-xs"
        >
          <Download size={14} />
          <span>Download / Print Invoice</span>
        </button>

        <button
          type="button"
          onClick={onViewInvoice}
          className="cursor-pointer rounded-xl border border-slate-200 bg-white hover:bg-slate-100 px-4 py-2.5 text-xs font-bold text-slate-800 transition-colors flex items-center justify-center gap-1.5"
        >
          <Eye size={14} className="text-slate-500" />
          <span>View Details</span>
        </button>
      </div>
    </div>
  );
}

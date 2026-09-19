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
    <div className="rounded-xl border border-gray-200 bg-white p-5 text-left shadow-xs space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 text-gray-700">
            <FileText size={16} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Order Tax Invoice</h3>
            <div className="text-xs text-gray-500 font-mono">#{invoiceNumber}</div>
          </div>
        </div>

        <div className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-gray-50 px-2.5 py-0.5 text-xs font-medium text-gray-700">
          <CheckCircle2 size={12} className="text-emerald-600" />
          <span>GST Paid</span>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
        <div>
          <span className="text-[11px] font-medium text-gray-500 block mb-0.5">
            Billed To
          </span>
          <span className="font-semibold text-gray-900 truncate block">{customerName}</span>
        </div>
        <div>
          <span className="text-[11px] font-medium text-gray-500 block mb-0.5">
            Invoice Date
          </span>
          <span className="font-medium text-gray-900 block">{issueDate}</span>
        </div>
        <div className="col-span-2 sm:col-span-1">
          <span className="text-[11px] font-medium text-gray-500 block mb-0.5">
            Amount Paid
          </span>
          <span className="font-semibold text-gray-900 block">
            ₹{taxBreakdown.grandTotal.toFixed(2)}{' '}
            <span className="text-[11px] font-normal text-gray-500">({paymentMethod})</span>
          </span>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
        <button
          type="button"
          onClick={onPrintInvoice}
          className="flex-1 cursor-pointer rounded-lg bg-white hover:bg-gray-50 border border-gray-300 hover:border-black px-4 py-2.5 text-xs font-semibold text-black transition-colors flex items-center justify-center gap-2 shadow-xs"
        >
          <Download size={14} />
          <span>Download / Print Invoice</span>
        </button>

        <button
          type="button"
          onClick={onViewInvoice}
          className="cursor-pointer rounded-lg border border-gray-300 hover:border-black bg-white hover:bg-gray-50 px-4 py-2.5 text-xs font-semibold text-black transition-colors flex items-center justify-center gap-2 shadow-xs"
        >
          <Eye size={14} className="text-gray-500" />
          <span>View Details</span>
        </button>
      </div>
    </div>
  );
}

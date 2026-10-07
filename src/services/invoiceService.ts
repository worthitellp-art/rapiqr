import {
  InvoiceAddress,
  InvoiceItem,
  InvoiceTaxCalculation,
  OrderInvoice,
  SellerDetails,
} from '../types/invoice';

const DEFAULT_SELLER_DETAILS: SellerDetails = {
  companyName: 'Worthite LLP',
  brandName: 'RepiQR',
  gstin: '24AAFFW7093N1ZH',
  pan: 'AAFFW7093N',
  addressLine1: 'Surendranagar',
  addressLine2: '',
  city: 'Surendranagar',
  state: 'Gujarat',
  pincode: '363530',
  supportEmail: 'admin@repiqr.com',
  website: 'https://repiqr.com',
};

const STANDARD_HSN_CODE = '4911'; // Printed decals & safety QR stickers
const GST_PERCENTAGE = 18;

/**
 * Calculates GST components from prices that include 18% GST.
 */
export function calculateGstTaxBreakdown(
  subtotal: number,
  deliveryFee: number
): InvoiceTaxCalculation {
  const taxableBase = Math.round((subtotal / (1 + GST_PERCENTAGE / 100)) * 100) / 100;
  const totalTaxAmount = Math.round((subtotal - taxableBase) * 100) / 100;
  const halfTaxAmount = Math.round((totalTaxAmount / 2) * 100) / 100;

  return {
    taxableSubtotal: taxableBase,
    gstRatePercentage: GST_PERCENTAGE,
    totalGstAmount: totalTaxAmount,
    centralGstAmount: halfTaxAmount,
    stateGstAmount: halfTaxAmount,
    deliveryFee,
    grandTotal: subtotal + deliveryFee,
  };
}

/**
 * Formats a clean, structured invoice number from order reference and timestamp.
 */
export function generateInvoiceNumber(orderId: string, timestamp: Date): string {
  const sanitizedId = orderId.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  const yearMonth = `${timestamp.getFullYear()}${String(timestamp.getMonth() + 1).padStart(2, '0')}`;
  return `INV-${yearMonth}-${sanitizedId.slice(-6)}`;
}

interface BuildInvoiceParameters {
  orderId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: InvoiceAddress;
  items: Array<{
    id?: string;
    name: string;
    category?: string;
    qty: number;
    price: number;
  }>;
  subtotal: number;
  deliveryFee: number;
  paymentMethod: string;
  paymentTransactionId?: string;
  deliveryType: 'standard' | 'express';
  timestamp?: Date;
}

/**
 * Constructs a fully normalized OrderInvoice instance for display and printing.
 */
export function buildOrderInvoice({
  orderId,
  customerName,
  customerEmail,
  customerPhone,
  shippingAddress,
  items,
  subtotal,
  deliveryFee,
  paymentMethod,
  paymentTransactionId,
  deliveryType,
  timestamp = new Date(),
}: BuildInvoiceParameters): OrderInvoice {
  const formattedItems: InvoiceItem[] = items.map((cartItem, index) => ({
    id: cartItem.id || `item-${index + 1}`,
    name: cartItem.name,
    category: cartItem.category,
    quantity: cartItem.qty,
    unitPrice: cartItem.price,
    totalPrice: cartItem.price * cartItem.qty,
    hsnSacCode: STANDARD_HSN_CODE,
  }));

  const taxBreakdown = calculateGstTaxBreakdown(subtotal, deliveryFee);
  const invoiceNumber = generateInvoiceNumber(orderId, timestamp);

  return {
    invoiceNumber,
    orderReferenceId: orderId,
    issueDate: timestamp.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }),
    orderTimestamp: timestamp.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }),
    seller: DEFAULT_SELLER_DETAILS,
    customerName,
    customerEmail,
    customerPhone,
    shippingAddress,
    items: formattedItems,
    taxBreakdown,
    paymentMethod: paymentMethod.toUpperCase(),
    paymentTransactionId,
    paymentStatus: 'PAID',
    deliveryType,
  };
}

/**
 * Opens a dedicated print dialog for the invoice with isolated styling.
 */
export function printOrderInvoice(invoice: OrderInvoice): void {
  const printableWindow = window.open('', '_blank', 'width=840,height=1000');
  if (!printableWindow) {
    alert('Please allow popups to print or download your invoice.');
    return;
  }

  const itemsHtml = invoice.items
    .map(
      (item, index) => `
      <tr>
        <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; font-size: 12px;">${index + 1}</td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; font-size: 12px;">
          <strong>${escapeHtml(item.name)}</strong>
          <div style="font-size: 11px; color: #64748b;">HSN: ${item.hsnSacCode}</div>
        </td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; font-size: 12px; text-align: center;">${item.quantity}</td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; font-size: 12px; text-align: right;">₹${item.unitPrice.toFixed(2)}</td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; font-size: 12px; text-align: right;">₹${item.totalPrice.toFixed(2)}</td>
      </tr>
    `
    )
    .join('');

  printableWindow.document.write(`
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <title>Invoice - ${invoice.invoiceNumber}</title>
        <style>
          * {
            box-sizing: border-box;
            font-family: 'Pinterest Sans', 'Pin Sans', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            color: #0f172a;
          }
          body {
            margin: 0;
            padding: 32px;
            background: #ffffff;
          }
          .invoice-container {
            max-width: 780px;
            margin: 0 auto;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 2px solid #0f172a;
            padding-bottom: 20px;
            margin-bottom: 24px;
          }
          .brand-title {
            font-size: 26px;
            font-weight: 900;
            letter-spacing: -0.5px;
            margin: 0 0 4px 0;
          }
          .brand-accent {
            color: #d97706;
          }
          .invoice-badge {
            display: inline-block;
            background: #f1f5f9;
            color: #0f172a;
            font-weight: 800;
            font-size: 12px;
            padding: 4px 10px;
            border-radius: 6px;
            letter-spacing: 0.5px;
            text-transform: uppercase;
          }
          .meta-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 24px;
            margin-bottom: 24px;
          }
          .meta-card {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 10px;
            padding: 14px 16px;
            font-size: 12px;
            line-height: 1.6;
          }
          .meta-title {
            font-size: 11px;
            font-weight: 800;
            text-transform: uppercase;
            color: #64748b;
            margin-bottom: 6px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 24px;
          }
          th {
            background: #0f172a;
            color: #ffffff;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            padding: 10px 12px;
            text-align: left;
          }
          .totals-table {
            width: 320px;
            margin-left: auto;
            border-collapse: collapse;
            margin-bottom: 24px;
          }
          .totals-table td {
            padding: 6px 12px;
            font-size: 12px;
          }
          .totals-table tr.grand-total td {
            border-top: 2px solid #0f172a;
            font-size: 15px;
            font-weight: 900;
            color: #0f172a;
            padding-top: 10px;
          }
          .footer-note {
            border-top: 1px dashed #cbd5e1;
            padding-top: 16px;
            font-size: 11px;
            color: #64748b;
            line-height: 1.5;
            text-align: center;
          }
          @media print {
            body {
              padding: 0;
            }
            .invoice-container {
              max-width: 100%;
            }
            @page {
              margin: 15mm;
            }
          }
        </style>
      </head>
      <body>
        <div class="invoice-container">
          <div class="header">
            <div>
              <div style="font-size: 26px; font-weight: 900; letter-spacing: -0.5px; color: #0f172a; margin-bottom: 6px;">
                Repi<span style="color: #EAB308;">QR</span>
              </div>
              <div style="font-size: 14px; color: #0f172a; font-weight: 800; margin-bottom: 3px;">
                ${invoice.seller.companyName}
              </div>
              <div style="font-size: 11.5px; color: #475569; line-height: 1.5;">
                ${invoice.seller.addressLine1}, ${invoice.seller.state} - ${invoice.seller.pincode}<br />
                GSTIN: <strong>${invoice.seller.gstin}</strong>
              </div>
            </div>
            <div style="text-align: right;">
              <span class="invoice-badge" style="background: #ecfdf5; color: #047857; border: 1px solid #a7f3d0; font-weight: 800; font-size: 12px; padding: 4px 12px;">PAID</span>
              <h2 style="font-size: 18px; margin: 8px 0 2px 0; font-weight: 900; color: #0f172a;">TAX INVOICE</h2>
              <div style="font-size: 13px; color: #0f172a; font-weight: 700; font-family: monospace;"># ${invoice.invoiceNumber}</div>
              <div style="font-size: 11.5px; color: #64748b; margin-top: 2px;">Date: <strong>${invoice.issueDate}</strong></div>
            </div>
          </div>

          <div class="meta-grid">
            <div class="meta-card">
              <div class="meta-title">Billed &amp; Shipped To</div>
              <strong>${escapeHtml(invoice.customerName)}</strong><br />
              ${escapeHtml(invoice.shippingAddress.address)}<br />
              ${escapeHtml(invoice.shippingAddress.city)}, ${escapeHtml(invoice.shippingAddress.state)} - ${escapeHtml(invoice.shippingAddress.pincode)}<br />
              Phone: ${escapeHtml(invoice.customerPhone)}<br />
              Email: ${escapeHtml(invoice.customerEmail)}
            </div>

            <div class="meta-card">
              <div class="meta-title">Order &amp; Payment Details</div>
              Order Reference: <strong>${escapeHtml(invoice.orderReferenceId)}</strong><br />
              Placed On: ${invoice.orderTimestamp}<br />
              Payment Mode: <strong>${invoice.paymentMethod}</strong><br />
              Payment Status: <strong style="color: #16a34a;">${invoice.paymentStatus}</strong><br />
              ${invoice.paymentTransactionId ? `Transaction Ref: <span style="font-family: monospace;">${escapeHtml(invoice.paymentTransactionId)}</span><br />` : ''}
              Delivery Method: ${invoice.deliveryType === 'express' ? 'Express Priority (24-48 hrs)' : 'Standard Tracked Delivery (3-5 days)'}
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 40px;">#</th>
                <th>Item Description</th>
                <th style="width: 60px; text-align: center;">Qty</th>
                <th style="width: 100px; text-align: right;">Unit Price</th>
                <th style="width: 110px; text-align: right;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <table class="totals-table">
            <tr>
              <td style="color: #64748b;">Taxable Base:</td>
              <td style="text-align: right; font-weight: 600;">₹${invoice.taxBreakdown.taxableSubtotal.toFixed(2)}</td>
            </tr>
            <tr>
              <td style="color: #64748b;">CGST (9%):</td>
              <td style="text-align: right; font-weight: 600;">₹${invoice.taxBreakdown.centralGstAmount.toFixed(2)}</td>
            </tr>
            <tr>
              <td style="color: #64748b;">SGST (9%):</td>
              <td style="text-align: right; font-weight: 600;">₹${invoice.taxBreakdown.stateGstAmount.toFixed(2)}</td>
            </tr>
            <tr>
              <td style="color: #64748b;">Shipping Fee:</td>
              <td style="text-align: right; font-weight: 600; color: ${invoice.taxBreakdown.deliveryFee === 0 ? '#16a34a' : '#0f172a'};">
                ${invoice.taxBreakdown.deliveryFee === 0 ? 'FREE' : `₹${invoice.taxBreakdown.deliveryFee.toFixed(2)}`}
              </td>
            </tr>
            <tr class="grand-total">
              <td>Total Paid:</td>
              <td style="text-align: right;">₹${invoice.taxBreakdown.grandTotal.toFixed(2)}</td>
            </tr>
          </table>

          <!-- Signature Section -->
          <div style="display: flex; justify-content: flex-end; margin-top: 36px; margin-bottom: 24px;">
            <div style="text-align: center; min-width: 220px;">
              <div style="font-size: 12px; font-weight: 700; color: #475569; margin-bottom: 8px;">For Worthite LLP</div>
              <div style="font-family: 'Brush Script MT', 'Segoe Script', cursive, sans-serif; font-size: 26px; color: #0f172a; margin-bottom: 4px; border-bottom: 1.5px solid #cbd5e1; padding-bottom: 6px;">
                Worthite LLP
              </div>
              <div style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 4px;">
                Authorized Signatory
              </div>
            </div>
          </div>

          <div class="footer-note">
            This is a computer-generated tax invoice.<br />
            For support queries or corporate fleet orders, contact <strong>${invoice.seller.supportEmail}</strong>
          </div>
        </div>

        <script>
          window.addEventListener('load', () => {
            window.focus();
            window.print();
          });
        </script>
      </body>
    </html>
  `);

  printableWindow.document.close();
}

/**
 * Download / Print PDF helper.
 */
export const downloadOrderInvoice = printOrderInvoice;

/**
 * Basic string sanitizer to prevent injection into printable window.
 */
function escapeHtml(unsafeText: string): string {
  return unsafeText
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

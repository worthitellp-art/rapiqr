import {
  InvoiceAddress,
  InvoiceItem,
  InvoiceTaxCalculation,
  OrderInvoice,
  SellerDetails,
} from '../types/invoice';
import { INVOICE_LOGO_BASE64, INVOICE_ICON_BASE64 } from './invoiceAssets';

export const DEFAULT_SELLER_DETAILS: SellerDetails = {
  companyName: 'Worthite LLP',
  brandName: 'RepiQR',
  gstin: '24AAFFW7093N1ZH',
  pan: 'AAFFW7093N',
  addressLine1: '38, KADAMBARI COMPLEX, OPP. ASTHALNI JAGYA, Thangadh',
  addressLine2: '',
  city: 'Surendra Nagar',
  state: 'Gujarat, India',
  pincode: '363530',
  supportEmail: 'admin@repiqr.com',
  website: 'www.repiqr.com',
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
 * Formats a clean, structured invoice number e.g. 000027.
 */
export function generateInvoiceNumber(orderId: string, _timestamp?: Date): string {
  const digits = orderId.replace(/\D/g, '');
  if (digits.length >= 4) {
    return digits.slice(-6).padStart(6, '0');
  }
  const sanitized = orderId.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  return (sanitized.slice(-6) || '000001').padStart(6, '0');
}

function formatCurrency(val: number): string {
  return '₹ ' + val.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
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
 * Constructs a fully normalized OrderInvoice instance matching the demo template.
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

  // e.g. "June 26, 2024"
  const formattedIssueDate = timestamp.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return {
    invoiceNumber,
    orderReferenceId: orderId,
    issueDate: formattedIssueDate,
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
 * Opens a dedicated print dialog for the invoice styled precisely to invoicedemo.png.
 */
export function printOrderInvoice(invoice: OrderInvoice): void {
  const printableWindow = window.open('', '_blank', 'width=900,height=1100');
  if (!printableWindow) {
    alert('Please allow popups to print or download your invoice.');
    return;
  }

  const itemsHtml = invoice.items
    .map(
      (item) => `
      <tr>
        <td style="padding: 14px 18px; font-size: 13.5px; font-weight: 700; color: #0f172a;">
          ${escapeHtml(item.name)}
        </td>
        <td style="padding: 14px 18px; font-size: 13px; color: #334155; text-align: center;">
          ${formatCurrency(item.unitPrice)}
        </td>
        <td style="padding: 14px 18px; font-size: 13px; color: #334155; text-align: center;">
          ${item.quantity}
        </td>
        <td style="padding: 14px 18px; font-size: 13.5px; font-weight: 800; color: #0f172a; text-align: right;">
          ${formatCurrency(item.totalPrice)}
        </td>
      </tr>
    `
    )
    .join('');

  const addressLines = [
    invoice.shippingAddress.address,
    [invoice.shippingAddress.city, invoice.shippingAddress.state].filter(Boolean).join(', '),
    invoice.shippingAddress.pincode,
  ].filter(Boolean);

  printableWindow.document.write(`
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <title>Invoice - ${invoice.invoiceNumber}</title>
        <style>
          * {
            box-sizing: border-box;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            color: #0f172a;
          }
          body {
            margin: 0;
            padding: 30px;
            background: #e2e8f0;
            display: flex;
            justify-content: center;
            align-items: flex-start;
            min-height: 100vh;
          }
          .invoice-card {
            position: relative;
            width: 100%;
            max-width: 820px;
            background: #ffffff;
            border-radius: 28px;
            overflow: hidden;
            box-shadow: 0 10px 40px rgba(0,0,0,0.08);
            padding: 44px 48px;
            /* Subtle ambient gradient waves from invoicedemo.png */
            background-image: 
              radial-gradient(circle at 45% 8%, rgba(254, 240, 138, 0.45) 0%, rgba(255, 255, 255, 0) 48%),
              radial-gradient(circle at 80% 92%, rgba(254, 240, 138, 0.5) 0%, rgba(255, 255, 255, 0) 42%);
            background-repeat: no-repeat;
          }
          .top-row {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 34px;
          }
          .logo-box {
            background: #ffffff;
            border-radius: 22px;
            padding: 16px 22px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.06);
            display: inline-flex;
            align-items: center;
          }
          .logo-img {
            height: 38px;
            width: auto;
            object-fit: contain;
          }
          .invoice-pill {
            background: #ffffff;
            border-radius: 9999px;
            padding: 9px 26px;
            font-size: 13px;
            font-weight: 800;
            letter-spacing: 1.5px;
            color: #0f172a;
            box-shadow: 0 2px 10px rgba(0,0,0,0.05);
            border: 1px solid rgba(0,0,0,0.05);
            text-transform: uppercase;
          }
          .tag-pill {
            display: inline-block;
            background: #FFD233;
            color: #000000;
            font-weight: 700;
            font-size: 11px;
            padding: 3.5px 12px;
            border-radius: 6px;
            margin-bottom: 12px;
          }
          .info-grid {
            display: grid;
            grid-template-columns: 1.1fr 1.2fr 0.9fr;
            gap: 28px;
            margin-bottom: 36px;
          }
          .info-col h3 {
            margin: 0 0 6px 0;
            font-size: 17px;
            font-weight: 800;
            color: #0f172a;
            letter-spacing: -0.2px;
          }
          .info-col p {
            margin: 0 0 3px 0;
            font-size: 12px;
            color: #475569;
            line-height: 1.5;
          }
          .table-container {
            width: 100%;
            margin-bottom: 30px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
          }
          .table-header th {
            background: #F8FAFC;
            color: #0f172a;
            font-size: 12.5px;
            font-weight: 700;
            padding: 12px 18px;
            text-align: left;
          }
          .table-header th:first-child {
            border-top-left-radius: 10px;
            border-bottom-left-radius: 10px;
          }
          .table-header th:last-child {
            border-top-right-radius: 10px;
            border-bottom-right-radius: 10px;
          }
          .bottom-section {
            display: grid;
            grid-template-columns: 1.15fr 0.95fr;
            gap: 36px;
            align-items: start;
            margin-top: 10px;
            margin-bottom: 48px;
          }
          .terms-box {
            font-size: 10.5px;
            color: #64748b;
            line-height: 1.6;
          }
          .terms-title {
            font-size: 11.5px;
            font-weight: 800;
            color: #0f172a;
            margin-bottom: 6px;
          }
          .totals-list {
            width: 100%;
            space-y: 6px;
          }
          .total-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 4px 0;
            font-size: 12.5px;
          }
          .total-row-accent {
            color: #0f172a;
            font-weight: 700;
          }
          .subtotal-val {
            color: #D97706;
            font-weight: 800;
            font-size: 13.5px;
          }
          .invoice-total-box {
            background: #F8FAFC;
            border-radius: 10px;
            padding: 12px 18px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-top: 10px;
          }
          .invoice-total-box span:first-child {
            font-size: 13.5px;
            font-weight: 800;
            color: #0f172a;
          }
          .invoice-total-box span:last-child {
            font-size: 14.5px;
            font-weight: 900;
            color: #0f172a;
          }
          .footer-row {
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            padding-top: 24px;
            border-top: 1px solid rgba(226, 232, 240, 0.6);
          }
          .footer-brand {
            font-size: 13px;
            font-weight: 800;
            color: #0f172a;
            margin-bottom: 3px;
          }
          .footer-meta {
            font-size: 11px;
            color: #64748b;
            line-height: 1.5;
          }
          .footer-glyph {
            height: 48px;
            width: auto;
            object-fit: contain;
          }

          @media print {
            body {
              padding: 0;
              background: #ffffff;
            }
            .invoice-card {
              max-width: 100%;
              box-shadow: none;
              border-radius: 0;
              padding: 24px 32px;
            }
            @page {
              margin: 10mm;
              size: A4 portrait;
            }
          }
        </style>
      </head>
      <body>
        <div class="invoice-card">
          <!-- Top Row: Logo & Invoice Pill -->
          <div class="top-row">
            <div class="logo-box">
              <img src="${INVOICE_LOGO_BASE64}" alt="RepiQR" class="logo-img" />
            </div>
            <div class="invoice-pill">
              INVOICE
            </div>
          </div>

          <!-- 3-Column Info Grid -->
          <div class="info-grid">
            <!-- Col 1: Invoice to -->
            <div class="info-col">
              <div class="tag-pill">Invoice to:</div>
              <h3>${escapeHtml(invoice.customerName)}</h3>
              ${invoice.customerPhone ? `<p>${escapeHtml(invoice.customerPhone)}</p>` : ''}
              ${invoice.customerEmail ? `<p>${escapeHtml(invoice.customerEmail)}</p>` : ''}
              <p style="color: #64748b; margin-top: 4px;">
                ${addressLines.map(escapeHtml).join(', ')}
              </p>
            </div>

            <!-- Col 2: Date & Seller -->
            <div class="info-col">
              <div class="tag-pill">Date:</div>
              <h3>${escapeHtml(invoice.issueDate)}</h3>
              <p style="font-weight: 700; color: #334155; margin-bottom: 2px;">${escapeHtml(invoice.seller.companyName)}</p>
              <p style="font-weight: 600; color: #475569; margin-bottom: 4px;">GSTIN- ${escapeHtml(invoice.seller.gstin)}</p>
              <p style="color: #64748b; font-size: 11px; line-height: 1.45;">
                ${escapeHtml(invoice.seller.addressLine1)}, ${escapeHtml(invoice.seller.city)}, ${escapeHtml(invoice.seller.state)}, ${escapeHtml(invoice.seller.pincode)}.
              </p>
            </div>

            <!-- Col 3: Invoice Number -->
            <div class="info-col">
              <div class="tag-pill">Invoice number:</div>
              <h3>Nº: ${escapeHtml(invoice.invoiceNumber)}</h3>
            </div>
          </div>

          <!-- Items Table -->
          <div class="table-container">
            <table>
              <thead>
                <tr class="table-header">
                  <th style="width: 48%;">Item</th>
                  <th style="width: 20%; text-align: center;">Price</th>
                  <th style="width: 12%; text-align: center;">Qty</th>
                  <th style="width: 20%; text-align: right;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>
          </div>

          <!-- Bottom Section: Terms & Totals -->
          <div class="bottom-section">
            <div class="terms-box">
              <div class="terms-title">Terms &amp; Conditions:</div>
              Product is non-refundable after activation. Customer is responsible for providing accurate information. RepiQR is not liable for service interruptions, misuse, or issues caused by damaged/incorrectly placed QR stickers. Emergency assistance depends on respective service providers. By purchasing, you agree to RepiQR's Terms &amp; Privacy Policy.
            </div>

            <div class="totals-list">
              <div class="total-row">
                <span class="total-row-accent">Subtotal</span>
                <span class="subtotal-val">${formatCurrency(invoice.taxBreakdown.taxableSubtotal)}</span>
              </div>
              <div class="total-row">
                <span class="total-row-accent">CGST 9%</span>
                <span style="color: #475569;">${formatCurrency(invoice.taxBreakdown.centralGstAmount)}</span>
              </div>
              <div class="total-row">
                <span class="total-row-accent">SGST 9%</span>
                <span style="color: #475569;">${formatCurrency(invoice.taxBreakdown.stateGstAmount)}</span>
              </div>
              ${
                invoice.taxBreakdown.deliveryFee > 0
                  ? `
                <div class="total-row">
                  <span class="total-row-accent">Delivery Fee</span>
                  <span style="color: #475569;">${formatCurrency(invoice.taxBreakdown.deliveryFee)}</span>
                </div>
              `
                  : ''
              }
              <div class="invoice-total-box">
                <span>Invoice total</span>
                <span>${formatCurrency(invoice.taxBreakdown.grandTotal)}</span>
              </div>
            </div>
          </div>

          <!-- Footer: RepiQR Contact & Icon -->
          <div class="footer-row">
            <div>
              <div class="footer-brand">RepiQR</div>
              <div class="footer-meta">www.repiqr.com</div>
              <div class="footer-meta">admin@repiqr.com &nbsp;/&nbsp; +91 93137 19720</div>
            </div>
            <div>
              <img src="${INVOICE_ICON_BASE64}" alt="R" class="footer-glyph" />
            </div>
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

export interface InvoiceAddress {
  address: string;
  city: string;
  state: string;
  pincode: string;
}

export interface InvoiceItem {
  id: string;
  name: string;
  category?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  hsnSacCode: string;
}

export interface InvoiceTaxCalculation {
  taxableSubtotal: number;
  gstRatePercentage: number;
  totalGstAmount: number;
  centralGstAmount: number;
  stateGstAmount: number;
  deliveryFee: number;
  grandTotal: number;
}

export interface SellerDetails {
  companyName: string;
  brandName: string;
  gstin: string;
  pan: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  pincode: string;
  supportEmail: string;
  website: string;
}

export interface OrderInvoice {
  invoiceNumber: string;
  orderReferenceId: string;
  issueDate: string;
  orderTimestamp: string;
  seller: SellerDetails;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: InvoiceAddress;
  items: InvoiceItem[];
  taxBreakdown: InvoiceTaxCalculation;
  paymentMethod: string;
  paymentTransactionId?: string;
  paymentStatus: 'PAID' | 'PENDING';
  deliveryType: 'standard' | 'express';
}

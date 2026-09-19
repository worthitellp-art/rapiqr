import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  Search,
  Package,
  Truck,
  CheckCircle2,
  Clock,
  MapPin,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  RefreshCw,
  Copy,
  Check,
} from 'lucide-react';
import { apiClient } from '../../lib/apiClient';

/* ── Types & Domain Models ─────────────────────────────────────────────────── */

export interface TrackedOrderData {
  id: string;
  status: 'placed' | 'shipped' | 'delivered' | 'cancelled';
  paymentStatus?: string;
  deliveryMethod?: string;
  total?: number;
  createdAt?: string;
  items?: Array<{ name: string; qty: number; price: number }>;
  maskedBuyer?: {
    firstName: string;
    email: string;
    phone: string;
    city: string;
    state: string;
    pincode: string;
  };
  shiprocket?: {
    shipmentId?: number;
    awbCode?: string;
    courierName?: string;
    trackingUrl?: string;
    timeline?: Array<{
      status: string;
      activity?: string;
      location?: string;
      at?: string;
    }>;
  } | null;
}

export interface TrackOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Only used to auto-select the right order once results come back — search itself is phone-only now. */
  initialOrderId?: string;
  /** Phone number to prefill and auto-search with, if provided. */
  initialContact?: string;
  onOpenDashboard?: () => void;
}

const ORDER_STEPS = [
  { id: 'placed', label: 'Placed', description: 'Order received' },
  { id: 'confirmed', label: 'Confirmed', description: 'Payment verified' },
  { id: 'shipped', label: 'Shipped', description: 'Courier picked up' },
  { id: 'delivered', label: 'Delivered', description: 'At your address' },
];

/* ── Pure Helper Functions ─────────────────────────────────────────────────── */

function determineActiveStepIndex(order: TrackedOrderData): number {
  if (order.status === 'delivered') return 3;
  if (order.status === 'shipped') return 2;
  if (order.paymentStatus === 'paid') return 1;
  return 0;
}

/* ── Sub-component: Stepper ────────────────────────────────────────────────── */

interface StepperProps {
  order: TrackedOrderData;
}

function TrackingProgressStepper({ order }: StepperProps) {
  if (order.status === 'cancelled') {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-center">
        <div className="text-sm font-bold text-red-800">Order Cancelled</div>
        <p className="mt-1 text-xs text-red-600">
          This order has been cancelled. If payment was deducted, refund processes within 5-7 business days.
        </p>
      </div>
    );
  }

  const activeIndex = determineActiveStepIndex(order);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        {ORDER_STEPS.map((step, index) => {
          const isDone = index <= activeIndex;
          const isCurrent = index === activeIndex;

          return (
            <React.Fragment key={step.id}>
              {index > 0 && (
                <div
                  className={`h-0.5 flex-1 transition-colors duration-300 ${
                    index <= activeIndex ? 'bg-emerald-500' : 'bg-slate-200'
                  }`}
                />
              )}
              <div className="flex flex-col items-center text-center">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all duration-300 ${
                    isDone
                      ? 'bg-emerald-500 text-white shadow-sm'
                      : 'border border-slate-300 bg-white text-slate-400'
                  } ${isCurrent ? 'ring-4 ring-emerald-100' : ''}`}
                >
                  {isDone ? <CheckCircle2 size={16} /> : index + 1}
                </div>
                <span
                  className={`mt-1.5 text-[11px] font-semibold ${
                    isDone ? 'text-slate-900' : 'text-slate-400'
                  }`}
                >
                  {step.label}
                </span>
              </div>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

/* ── Sub-component: Order Summary ─────────────────────────────────────────── */

interface SummaryProps {
  order: TrackedOrderData;
}

function TrackingOrderSummary({ order }: SummaryProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyOrderId = () => {
    navigator.clipboard.writeText(order.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const buyer = order.maskedBuyer;
  const courier = order.shiprocket;

  return (
    <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-black text-slate-900">{order.id}</span>
            <button
              onClick={handleCopyOrderId}
              className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              title="Copy Order ID"
            >
              {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
            </button>
          </div>
          <span className="text-[11px] text-slate-500">
            Placed on {order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-IN') : 'Recent'}
          </span>
        </div>
        <div className="text-right">
          <span className="text-xs font-bold text-slate-900">
            ₹{(order.total || 0).toLocaleString('en-IN')}
          </span>
          <span className="block text-[10px] font-medium text-emerald-600 uppercase tracking-wide">
            {order.paymentStatus === 'paid' ? 'Paid Online' : 'Payment Pending'}
          </span>
        </div>
      </div>

      {buyer && (
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Recipient</span>
            <p className="font-semibold text-slate-800">{buyer.firstName} ({buyer.phone})</p>
          </div>
          <div>
            <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Destination</span>
            <p className="font-semibold text-slate-800">
              {buyer.city ? `${buyer.city}, ${buyer.state}` : 'Dispatched to address'}
            </p>
          </div>
        </div>
      )}

      {courier?.awbCode && (
        <div className="mt-2 rounded-xl bg-white p-3 border border-slate-200 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Truck size={16} className="text-[#111111]" />
            <div>
              <p className="font-semibold text-slate-900">
                {courier.courierName || 'Expedited Courier'}
              </p>
              <p className="font-mono text-[11px] text-slate-500">AWB: {courier.awbCode}</p>
            </div>
          </div>
          {courier.trackingUrl && (
            <a
              href={courier.trackingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[11px] font-bold text-[#111111] hover:underline"
            >
              <span>Live Courier</span>
              <ExternalLink size={12} />
            </a>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Sub-component: Courier Milestones ─────────────────────────────────────── */

interface MilestonesProps {
  timeline?: Array<{
    status: string;
    activity?: string;
    location?: string;
    at?: string;
  }>;
}

function TrackingMilestones({ timeline }: MilestonesProps) {
  if (!timeline || timeline.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 p-4 text-center text-xs text-slate-500">
        <Clock size={18} className="mx-auto mb-1.5 text-slate-400 opacity-80" />
        Detailed scans will appear once the courier scans your parcel at the dispatch hub.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Dispatch Activity</h4>
      <div className="space-y-3 border-l-2 border-slate-200 pl-4">
        {timeline.map((event, index) => (
          <div key={index} className="relative">
            <div className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-[#111111] ring-4 ring-white" />
            <p className="text-xs font-semibold text-slate-900">{event.activity || event.status}</p>
            <div className="flex items-center gap-2 text-[11px] text-slate-500">
              {event.location && <span>{event.location}</span>}
              {event.at && <span>· {new Date(event.at).toLocaleString('en-IN')}</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Sub-component: Order Result Row (phone lookup can match more than one) ── */

const STATUS_PILL: Record<TrackedOrderData['status'], string> = {
  placed: 'bg-slate-100 text-slate-700',
  shipped: 'bg-blue-50 text-blue-700',
  delivered: 'bg-emerald-50 text-emerald-700',
  cancelled: 'bg-red-50 text-red-700',
};

const OrderResultRow: React.FC<{ order: TrackedOrderData; onSelect: () => void }> = ({ order, onSelect }) => {
  return (
    <button
      onClick={onSelect}
      className="w-full rounded-xl border border-slate-200 bg-white p-3.5 text-left transition-colors hover:border-slate-300 hover:bg-slate-50 cursor-pointer"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-sm font-black text-slate-900">{order.id}</span>
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${STATUS_PILL[order.status]}`}>
          {order.status}
        </span>
      </div>
      <div className="mt-1.5 flex items-center justify-between text-xs text-slate-500">
        <span>{order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-IN') : 'Recent'}</span>
        <span className="font-bold text-slate-900">₹{(order.total || 0).toLocaleString('en-IN')}</span>
      </div>
    </button>
  );
};

/* ── Main Component ────────────────────────────────────────────────────────── */

export default function TrackOrderModal({
  isOpen,
  onClose,
  initialOrderId = '',
  initialContact = '',
  onOpenDashboard,
}: TrackOrderModalProps) {
  const [phone, setPhone] = useState(initialContact);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [orders, setOrders] = useState<TrackedOrderData[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<TrackedOrderData | null>(null);

  // Sync initial phone when modal opens; clear any stale search from last time it was open
  useEffect(() => {
    if (isOpen) {
      if (initialContact) setPhone(initialContact);
      setErrorMessage('');
      setOrders([]);
      setSelectedOrder(null);
    }
  }, [isOpen, initialContact]);

  // Handle ESC key dismiss
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleSearch = useCallback(async (overridePhone?: string) => {
    const raw = (overridePhone ?? phone).trim();
    const digits = raw.replace(/\D/g, '');

    if (digits.length < 10) {
      setErrorMessage('Please enter a valid 10-digit phone number.');
      return;
    }

    setLoading(true);
    setErrorMessage('');
    setSelectedOrder(null);

    try {
      const response = await apiClient.orders.trackByPhone(raw);
      if (response.success && response.data && response.data.length > 0) {
        const results = response.data as TrackedOrderData[];
        setOrders(results);
        const normalizedInitialId = initialOrderId ? `#${initialOrderId.replace(/^#/, '').toUpperCase()}` : '';
        const preselect = normalizedInitialId ? results.find((o) => o.id === normalizedInitialId) : undefined;
        setSelectedOrder(preselect || (results.length === 1 ? results[0] : null));
      } else {
        setOrders([]);
        setErrorMessage(response.error || 'No orders found for this phone number.');
      }
    } catch (error: any) {
      setOrders([]);
      setErrorMessage(error?.message || 'Unable to connect to order tracking service.');
    } finally {
      setLoading(false);
    }
  }, [phone, initialOrderId]);

  // Auto-search once if we already know the phone number when the modal opens
  useEffect(() => {
    if (isOpen && initialContact) {
      handleSearch(initialContact);
    }
    // Deliberately excludes handleSearch: it closes over `phone` state, which the sibling
    // effect above sets asynchronously — re-running on every handleSearch identity change
    // would search on each keystroke instead of once on open.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, initialContact]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in font-body">
      <div className="relative w-full max-w-lg rounded-3xl bg-white p-6 sm:p-7 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 text-[#111111] border border-gray-200">
              <Package size={20} />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900">Track Safety Tag Order</h3>
              <p className="text-xs text-slate-500">Live order status and dispatch updates</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Input Form — phone number only */}
        <div className="mt-5 space-y-3">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
              Phone Number
            </label>
            <input
              type="tel"
              placeholder="10-digit mobile number used at checkout"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-[#111111] focus:outline-none transition-colors"
            />
          </div>

          <button
            onClick={() => handleSearch()}
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-slate-950 hover:bg-slate-900 text-white font-extrabold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-sm"
          >
            {loading ? (
              <>
                <RefreshCw size={14} className="animate-spin text-white" />
                <span>Searching order records...</span>
              </>
            ) : (
              <>
                <Search size={14} className="text-white" />
                <span>Track Delivery Status</span>
              </>
            )}
          </button>
        </div>

        {/* Error banner */}
        {errorMessage && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-800 flex items-start gap-2">
            <AlertCircle size={16} className="text-red-600 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Multiple matches: pick one */}
        {orders.length > 1 && !selectedOrder && (
          <div className="mt-5 space-y-2 animate-fade-in">
            <p className="text-xs font-bold text-slate-600">
              Found {orders.length} orders for this number — select one:
            </p>
            {orders.map((order) => (
              <OrderResultRow key={order.id} order={order} onSelect={() => setSelectedOrder(order)} />
            ))}
          </div>
        )}

        {/* Order Details Body */}
        {selectedOrder && (
          <div className="mt-6 space-y-5 animate-fade-in">
            {orders.length > 1 && (
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-[11px] font-bold text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                ← Back to all {orders.length} orders
              </button>
            )}

            {/* Stepper */}
            <TrackingProgressStepper order={selectedOrder} />

            {/* Order Card */}
            <TrackingOrderSummary order={selectedOrder} />

            {/* Milestones */}
            <TrackingMilestones timeline={selectedOrder.shiprocket?.timeline} />

            {/* Account linking banner if user wants to claim stickers */}
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 text-xs space-y-2">
              <div className="flex items-center gap-2 font-bold text-gray-900">
                <ShieldCheck size={16} className="text-[#111111]" />
                <span>Activate Tag Telephony & Emergency Contacts</span>
              </div>
              <p className="text-gray-700 leading-relaxed text-[11px]">
                Sign in with the phone number used for this order to program your vehicle plate, link emergency responders, and manage private masked calls.
              </p>
              {onOpenDashboard && (
                <button
                  onClick={() => {
                    onClose();
                    onOpenDashboard();
                  }}
                  className="mt-1 font-bold text-gray-900 hover:underline cursor-pointer flex items-center gap-1"
                >
                  <span>Go to Client Dashboard</span>
                  <span>→</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

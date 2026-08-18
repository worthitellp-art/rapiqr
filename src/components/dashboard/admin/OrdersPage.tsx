import { useState, useEffect } from "react";
import {
  ShoppingBag, Search, Package, Truck, CheckCircle2, XCircle, Clock,
  Phone, Mail, MapPin, IndianRupee, CreditCard,
} from "lucide-react";
import { apiClient } from "../../../lib/apiClient";
import { fmtDateTime } from "./helpers";

interface OrderItem { name: string; qty: number; price: number }
interface OrderPayment {
  status: "created" | "paid" | "failed";
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  amount?: number;
  currency?: string;
  paidAt?: string;
}
interface Order {
  id: string;
  userId?: string | null;
  name: string;
  email: string;
  phone: string;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  paymentMethod: string;
  deliveryMethod: string;
  status: "placed" | "shipped" | "delivered" | "cancelled";
  shippingAddress?: { address?: string; city?: string; state?: string; pincode?: string } | null;
  payment?: OrderPayment | null;
  createdAt: string;
}

const PAYMENT_META: Record<OrderPayment["status"], { label: string; color: string; bg: string }> = {
  created: { label: "Awaiting Payment", color: "text-[#B8863F]", bg: "bg-[#FBF3E4]" },
  paid: { label: "Paid", color: "text-[#2E9E5B]", bg: "bg-[#E9F9EF]" },
  failed: { label: "Failed", color: "text-[#DC2626]", bg: "bg-[#FDEAEA]" },
};

const STATUS_META: Record<Order["status"], { label: string; icon: any; color: string; bg: string }> = {
  placed: { label: "Placed", icon: Clock, color: "text-[#B8863F]", bg: "bg-[#FBF3E4]" },
  shipped: { label: "Shipped", icon: Truck, color: "text-[#5271D5]", bg: "bg-[#E8EDFF]" },
  delivered: { label: "Delivered", icon: CheckCircle2, color: "text-[#2E9E5B]", bg: "bg-[#E9F9EF]" },
  cancelled: { label: "Cancelled", icon: XCircle, color: "text-[#DC2626]", bg: "bg-[#FDEAEA]" },
};

const NEXT_STATUS: Record<Order["status"], Order["status"] | null> = {
  placed: "shipped",
  shipped: "delivered",
  delivered: null,
  cancelled: null,
};

export default function OrdersPage({ setToast }: { setToast: (msg: string | null) => void }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | Order["status"]>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadOrders = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await apiClient.orders.list();
      setOrders((res?.data || []) as Order[]);
    } catch (err: any) {
      console.error("Failed to load orders:", err);
      setLoadError(err?.message || "Failed to load orders from the server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const handleStatusChange = async (orderId: string, status: Order["status"]) => {
    setUpdatingStatus(true);
    try {
      const res = await apiClient.orders.updateStatus(orderId, status);
      if (res?.success && res.data) {
        setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: res.data.status } : o)));
        setSelectedOrder((prev) => (prev && prev.id === orderId ? { ...prev, status: res.data.status } : prev));
        setToast(`Order ${orderId} marked as ${res.data.status}.`);
      } else {
        setToast("Failed to update order status.");
      }
    } catch {
      setToast("Failed to update order status.");
    } finally {
      setUpdatingStatus(false);
      setTimeout(() => setToast(null), 2500);
    }
  };

  const filteredOrders = orders.filter((o) => {
    const matchesFilter = filter === "all" || o.status === filter;
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !q ||
      o.id.toLowerCase().includes(q) ||
      (o.name || "").toLowerCase().includes(q) ||
      (o.email || "").toLowerCase().includes(q) ||
      (o.phone || "").includes(q);
    return matchesFilter && matchesSearch;
  });

  const totalCount = orders.length;
  const placedCount = orders.filter((o) => o.status === "placed").length;
  const revenue = orders.filter((o) => o.payment?.status === "paid").reduce((sum, o) => sum + (o.total || 0), 0);

  return (
    <div className="px-8 pt-7 pb-16 space-y-7 text-[#17181A] font-body" style={{ background: "#F7F7F8" }}>
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-[21px] font-semibold text-[#17181A] flex items-center gap-2">
            <ShoppingBag className="text-[#5C78DF]" size={22} />
            Orders
          </h1>
          <p className="text-[13px] text-[#777B80] mt-0.5">
            Every order placed at checkout — track fulfillment and contact customers.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-[4px] bg-[#FBF3E4] text-[#B8863F] text-[12px] font-semibold">
            <Clock size={14} />
            <span className="font-mono font-bold">{placedCount}</span> Awaiting Shipment
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-[4px] bg-[#E9F9EF] text-[#2E9E5B] text-[12px] font-semibold">
            <IndianRupee size={14} />
            <span className="font-mono font-bold">₹{revenue.toLocaleString("en-IN")}</span> Revenue
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto space-y-7">
        {/* Filter and Search Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 border border-[#E5E5E7] shadow-[0_1px_4px_rgba(0,0,0,0.03)]">
          <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
            {(["all", "placed", "shipped", "delivered", "cancelled"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`px-3.5 py-1.5 rounded-[4px] text-[12px] font-semibold transition-all capitalize whitespace-nowrap cursor-pointer ${
                  filter === tab ? "bg-[#17181A] text-white" : "text-[#777B80] hover:bg-[#F3F3F4]"
                }`}
              >
                {tab === "all" ? `All (${totalCount})` : tab}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-72">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9CA0A6]" />
            <input
              type="text"
              placeholder="Search by order ID, name, email, phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-[12.5px] rounded-full border-0 bg-[#EFEFF0] text-[#17181A] placeholder-[#9CA0A6] outline-none transition-all focus:ring-2 focus:ring-[#5C78DF]/25"
            />
          </div>
        </div>

        {/* Orders Grid / Inspector */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-8 space-y-3">
            {loading ? (
              <div className="bg-white p-12 text-center border border-[#E5E5E7] shadow-[0_1px_4px_rgba(0,0,0,0.03)] space-y-2">
                <div className="w-12 h-12 rounded-full bg-[#E8EDFF] text-[#5271D5] flex items-center justify-center mx-auto">
                  <Clock size={22} />
                </div>
                <p className="font-semibold text-[14px] text-[#17181A]">Loading orders…</p>
              </div>
            ) : loadError ? (
              <div className="bg-white p-12 text-center border border-[#E5E5E7] shadow-[0_1px_4px_rgba(0,0,0,0.03)] space-y-2">
                <div className="w-12 h-12 rounded-full bg-[#FDEAEA] text-[#DC2626] flex items-center justify-center mx-auto">
                  <XCircle size={22} />
                </div>
                <p className="font-bold text-[14px] text-[#17181A]">Couldn't load orders.</p>
                <p className="text-[12px] text-[#777B80] font-mono">{loadError}</p>
                <button
                  onClick={loadOrders}
                  className="mt-2 px-4 py-2 rounded-[4px] text-[12px] font-bold bg-[#DC2626] text-white hover:bg-[#B91C1C] transition-colors cursor-pointer"
                >
                  Retry
                </button>
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="bg-white p-12 text-center border border-[#E5E5E7] shadow-[0_1px_4px_rgba(0,0,0,0.03)] space-y-2">
                <div className="w-12 h-12 rounded-full bg-[#E8EDFF] text-[#5271D5] flex items-center justify-center mx-auto">
                  <ShoppingBag size={22} />
                </div>
                <p className="font-bold text-[14px] text-[#17181A]">No orders found.</p>
                <p className="text-[12px] text-[#777B80]">Orders placed by customers on the Checkout page will appear here.</p>
              </div>
            ) : (
              filteredOrders.map((order) => {
                const meta = STATUS_META[order.status] || STATUS_META.placed;
                const StatusIcon = meta.icon;
                const payMeta = PAYMENT_META[order.payment?.status || "created"];
                return (
                  <div
                    key={order.id}
                    onClick={() => setSelectedOrder(order)}
                    className={`bg-white p-5 border transition-all cursor-pointer hover:shadow-[0_1px_4px_rgba(0,0,0,0.06)] shadow-[0_1px_4px_rgba(0,0,0,0.03)] ${
                      selectedOrder?.id === order.id ? "border-[#5C78DF] ring-2 ring-[#5C78DF]/15" : "border-[#E5E5E7]"
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-[14px] ${meta.bg} ${meta.color}`}>
                          {(order.name || "?").charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-display font-semibold text-[14px] text-[#17181A]">{order.name}</h3>
                            <span className="text-[10px] font-mono font-bold text-[#9CA0A6]">{order.id}</span>
                          </div>
                          <p className="text-[12px] text-[#777B80] mt-0.5 flex items-center gap-1.5 flex-wrap">
                            <span>{order.items?.length || 0} item{(order.items?.length || 0) !== 1 ? "s" : ""} · <span className="font-mono">₹{(order.total || 0).toLocaleString("en-IN")}</span></span>
                            {order.userId ? (
                              <span className="text-[10px] font-bold text-[#5C78DF] bg-[#E8EDFF] px-1.5 py-0.5 rounded-[3px]">Registered User</span>
                            ) : (
                              <span className="text-[10px] font-bold text-[#777B80] bg-[#F3F3F4] px-1.5 py-0.5 rounded-[3px]">Guest</span>
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 flex-wrap justify-end">
                        <span className={`px-2.5 py-1 rounded-[4px] text-[11px] font-bold uppercase tracking-wide flex items-center gap-1.5 w-fit ${payMeta.bg} ${payMeta.color}`}>
                          <IndianRupee size={12} />
                          {payMeta.label}
                        </span>
                        <span className={`px-2.5 py-1 rounded-[4px] text-[11px] font-bold uppercase tracking-wide flex items-center gap-1.5 w-fit ${meta.bg} ${meta.color}`}>
                          <StatusIcon size={12} />
                          {meta.label}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 py-3 border-t border-[#F3F3F4] text-[12px]">
                      <div>
                        <span className="text-[#9CA0A6] block text-[10px] font-semibold uppercase tracking-wide">Contact</span>
                        <span className="font-semibold text-[#17181A] flex items-center gap-1 mt-0.5 font-mono">
                          <Phone size={12} className="text-[#9CA0A6]" />
                          {order.phone}
                        </span>
                      </div>
                      <div>
                        <span className="text-[#9CA0A6] block text-[10px] font-semibold uppercase tracking-wide">Payment</span>
                        <span className="font-semibold text-[#17181A] flex items-center gap-1 mt-0.5 uppercase">
                          <CreditCard size={12} className="text-[#9CA0A6]" />
                          {order.paymentMethod}
                        </span>
                      </div>
                      <div>
                        <span className="text-[#9CA0A6] block text-[10px] font-semibold uppercase tracking-wide">Delivery</span>
                        <span className="font-semibold text-[#17181A] flex items-center gap-1 mt-0.5 capitalize">
                          <Package size={12} className="text-[#9CA0A6]" />
                          {order.deliveryMethod}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-[#F3F3F4] mt-1">
                      <span className="text-[10px] font-mono text-[#9CA0A6]">Placed: {fmtDateTime(order.createdAt)}</span>
                      {NEXT_STATUS[order.status] && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleStatusChange(order.id, NEXT_STATUS[order.status]!); }}
                          disabled={updatingStatus}
                          className="px-3.5 py-1.5 rounded-[4px] text-[12px] font-bold bg-[#17181A] text-white hover:bg-[#2A2B2E] transition-all cursor-pointer disabled:opacity-50"
                        >
                          Mark as {STATUS_META[NEXT_STATUS[order.status]!].label}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Details Inspection Sidebar */}
          <div className="lg:col-span-4 bg-white p-6 border border-[#E5E5E7] shadow-[0_1px_4px_rgba(0,0,0,0.03)] sticky top-6">
            <h3 className="font-display font-semibold text-[14px] text-[#17181A] mb-4 pb-3 border-b border-[#F3F3F4] flex items-center justify-between">
              <span>Order Inspector</span>
              {selectedOrder && <span className="text-[12px] font-mono font-bold text-[#5C78DF]">{selectedOrder.id}</span>}
            </h3>

            {selectedOrder ? (
              <div className="space-y-4 text-[12px]">
                <div>
                  <label className="text-[11px] font-semibold text-[#777B80] uppercase tracking-wide block mb-1">Customer</label>
                  <div className="font-bold text-[13.5px] text-[#17181A] bg-[#F7F7F8] border border-[#E5E5E7] p-2.5 rounded-[4px] flex items-center justify-between gap-2">
                    <span>{selectedOrder.name}</span>
                    {selectedOrder.userId ? (
                      <span className="text-[10px] font-bold text-[#5C78DF] bg-[#E8EDFF] px-1.5 py-0.5 rounded-[3px] whitespace-nowrap">Registered User</span>
                    ) : (
                      <span className="text-[10px] font-bold text-[#777B80] bg-[#F3F3F4] px-1.5 py-0.5 rounded-[3px] whitespace-nowrap">Guest</span>
                    )}
                  </div>
                  {selectedOrder.userId && (
                    <div className="text-[10px] font-mono text-[#9CA0A6] mt-1 truncate">User ID: {selectedOrder.userId}</div>
                  )}
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-[#777B80] uppercase tracking-wide block mb-1">Payment (Razorpay)</label>
                  <div className="bg-[#F7F7F8] border border-[#E5E5E7] rounded-[4px] p-2.5 space-y-1">
                    {(() => {
                      const p = selectedOrder.payment;
                      const pMeta = PAYMENT_META[p?.status || "created"];
                      return (
                        <>
                          <div className="flex items-center justify-between">
                            <span className="text-[#777B80]">Status</span>
                            <span className={`px-2 py-0.5 rounded-[3px] text-[10px] font-bold uppercase ${pMeta.bg} ${pMeta.color}`}>{pMeta.label}</span>
                          </div>
                          {p?.razorpayPaymentId && (
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[#777B80]">Payment ID</span>
                              <span className="font-mono text-[10.5px] text-[#17181A] truncate">{p.razorpayPaymentId}</span>
                            </div>
                          )}
                          {p?.razorpayOrderId && (
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[#777B80]">Razorpay Order</span>
                              <span className="font-mono text-[10.5px] text-[#17181A] truncate">{p.razorpayOrderId}</span>
                            </div>
                          )}
                          {p?.paidAt && (
                            <div className="flex items-center justify-between">
                              <span className="text-[#777B80]">Paid At</span>
                              <span className="text-[#17181A]">{fmtDateTime(p.paidAt)}</span>
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-[#777B80] uppercase tracking-wide block mb-1">Phone</label>
                    <div className="font-bold text-[#17181A] bg-[#F7F7F8] border border-[#E5E5E7] p-2.5 rounded-[4px] flex items-center gap-1.5 font-mono">
                      <Phone size={13} className="text-[#5C78DF]" />
                      {selectedOrder.phone}
                    </div>
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-[#777B80] uppercase tracking-wide block mb-1">Email</label>
                    <div className="font-medium text-[#17181A] bg-[#F7F7F8] border border-[#E5E5E7] p-2.5 rounded-[4px] flex items-center gap-1.5 truncate">
                      <Mail size={13} className="text-[#9CA0A6] flex-shrink-0" />
                      <span className="truncate">{selectedOrder.email}</span>
                    </div>
                  </div>
                </div>

                {selectedOrder.shippingAddress && (
                  <div>
                    <label className="text-[11px] font-semibold text-[#777B80] uppercase tracking-wide block mb-1">Shipping Address</label>
                    <div className="font-medium text-[#17181A] bg-[#F7F7F8] border border-[#E5E5E7] p-2.5 rounded-[4px] flex items-start gap-1.5">
                      <MapPin size={13} className="text-[#5C78DF] flex-shrink-0 mt-0.5" />
                      <span>
                        {[selectedOrder.shippingAddress.address, selectedOrder.shippingAddress.city, selectedOrder.shippingAddress.state, selectedOrder.shippingAddress.pincode]
                          .filter(Boolean)
                          .join(", ")}
                      </span>
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-[11px] font-semibold text-[#777B80] uppercase tracking-wide block mb-1">Items</label>
                  <div className="bg-[#F7F7F8] border border-[#E5E5E7] rounded-[4px] divide-y divide-[#E5E5E7]">
                    {(selectedOrder.items || []).map((it, i) => (
                      <div key={i} className="flex items-center justify-between p-2.5">
                        <span className="font-semibold text-[#17181A]">{it.name} × {it.qty}</span>
                        <span className="font-bold text-[#17181A] font-mono">₹{(it.price * it.qty).toLocaleString("en-IN")}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-[#F7F7F8] border border-[#E5E5E7] rounded-[4px] p-3 space-y-1">
                  <div className="flex justify-between text-[#777B80]"><span>Subtotal</span><span className="font-mono">₹{selectedOrder.subtotal.toLocaleString("en-IN")}</span></div>
                  <div className="flex justify-between text-[#777B80]"><span>Delivery</span><span className="font-mono">{selectedOrder.deliveryFee ? `₹${selectedOrder.deliveryFee}` : "Free"}</span></div>
                  <div className="flex justify-between font-black text-[#17181A] text-[13.5px] pt-1 border-t border-[#E5E5E7]"><span>Total</span><span className="font-mono">₹{selectedOrder.total.toLocaleString("en-IN")}</span></div>
                </div>

                <div className="pt-2 border-t border-[#F3F3F4] space-y-2">
                  <label className="text-[11px] font-semibold text-[#777B80] uppercase tracking-wide block">Fulfillment Status</label>
                  <div className="flex flex-wrap gap-2">
                    {(["placed", "shipped", "delivered", "cancelled"] as const).map((s) => {
                      const meta = STATUS_META[s];
                      const isActive = selectedOrder.status === s;
                      return (
                        <button
                          key={s}
                          onClick={() => handleStatusChange(selectedOrder.id, s)}
                          disabled={updatingStatus || isActive}
                          className={`px-3 py-1.5 rounded-[4px] text-[11px] font-bold capitalize transition-all cursor-pointer disabled:cursor-default ${
                            isActive ? `${meta.bg} ${meta.color}` : "bg-[#F7F7F8] text-[#777B80] border border-[#E5E5E7] hover:bg-[#F3F3F4]"
                          }`}
                        >
                          {meta.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-[#9CA0A6] text-[12.5px]">
                Select any order card on the left to inspect items, shipping details, and update fulfillment status.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

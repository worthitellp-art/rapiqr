import { useState, useEffect } from "react";
import {
  ShoppingBag, Search, Package, Truck, CheckCircle2, XCircle, Clock,
  Phone, Mail, MapPin, IndianRupee, CreditCard,
} from "lucide-react";
import { apiClient } from "../../../lib/apiClient";
import { fmtDateTime } from "./helpers";

interface OrderItem { name: string; qty: number; price: number }
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
  createdAt: string;
}

const STATUS_META: Record<Order["status"], { label: string; icon: any; color: string; bg: string }> = {
  placed: { label: "Placed", icon: Clock, color: "text-amber-800", bg: "bg-amber-100 border border-amber-300" },
  shipped: { label: "Shipped", icon: Truck, color: "text-blue-800", bg: "bg-blue-100 border border-blue-300" },
  delivered: { label: "Delivered", icon: CheckCircle2, color: "text-emerald-800", bg: "bg-emerald-100 border border-emerald-300" },
  cancelled: { label: "Cancelled", icon: XCircle, color: "text-red-800", bg: "bg-red-100 border border-red-300" },
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
  const revenue = orders.filter((o) => o.status !== "cancelled").reduce((sum, o) => sum + (o.total || 0), 0);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 text-gray-900">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 flex items-center gap-2">
            <ShoppingBag className="text-amber-500" size={26} />
            Orders
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Every order placed at checkout — track fulfillment and contact customers.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3.5 py-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold flex items-center gap-2">
            <Clock size={16} className="text-amber-600" />
            <span>{placedCount} Awaiting Shipment</span>
          </div>
          <div className="px-3.5 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center gap-2">
            <IndianRupee size={16} className="text-emerald-600" />
            <span>₹{revenue.toLocaleString("en-IN")} Revenue</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
          {(["all", "placed", "shipped", "delivered", "cancelled"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all capitalize whitespace-nowrap cursor-pointer ${
                filter === tab ? "bg-[#111111] text-white shadow-sm" : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {tab === "all" ? `All (${totalCount})` : tab}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by order ID, name, email, phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-xl outline-none focus:bg-white focus:border-amber-500"
          />
        </div>
      </div>

      {/* Orders Grid / Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-8 space-y-3">
          {loading ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-gray-200 text-gray-500">
              Loading orders…
            </div>
          ) : loadError ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-red-200 text-red-700">
              <XCircle size={40} className="mx-auto text-red-300 mb-3" />
              <p className="font-bold text-sm">Couldn't load orders.</p>
              <p className="text-xs text-red-500 mt-1 font-mono">{loadError}</p>
              <button
                onClick={loadOrders}
                className="mt-4 px-4 py-2 rounded-xl text-xs font-bold bg-red-600 text-white hover:bg-red-700 transition-colors cursor-pointer"
              >
                Retry
              </button>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-gray-200 text-gray-500">
              <ShoppingBag size={40} className="mx-auto text-gray-300 mb-3" />
              <p className="font-bold text-sm">No orders found.</p>
              <p className="text-xs text-gray-400 mt-1">Orders placed by customers on the Checkout page will appear here.</p>
            </div>
          ) : (
            filteredOrders.map((order) => {
              const meta = STATUS_META[order.status] || STATUS_META.placed;
              const StatusIcon = meta.icon;
              return (
                <div
                  key={order.id}
                  onClick={() => setSelectedOrder(order)}
                  className={`bg-white rounded-2xl p-5 border transition-all cursor-pointer hover:shadow-md ${
                    selectedOrder?.id === order.id ? "border-amber-500 ring-2 ring-amber-500/20" : "border-gray-200"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm bg-gray-100 text-gray-700">
                        {(order.name || "?").charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-sm text-gray-900">{order.name}</h3>
                          <span className="text-[10px] font-mono font-bold text-gray-400">{order.id}</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {order.items?.length || 0} item{(order.items?.length || 0) !== 1 ? "s" : ""} · ₹{(order.total || 0).toLocaleString("en-IN")}
                        </p>
                      </div>
                    </div>

                    <span className={`px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wide flex items-center gap-1.5 ${meta.bg} ${meta.color}`}>
                      <StatusIcon size={12} />
                      {meta.label}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 py-3 border-t border-gray-100 text-xs">
                    <div>
                      <span className="text-gray-400 block text-[10px]">Contact</span>
                      <span className="font-semibold text-gray-800 flex items-center gap-1 mt-0.5">
                        <Phone size={12} className="text-gray-400" />
                        {order.phone}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400 block text-[10px]">Payment</span>
                      <span className="font-semibold text-gray-800 flex items-center gap-1 mt-0.5 uppercase">
                        <CreditCard size={12} className="text-gray-400" />
                        {order.paymentMethod}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400 block text-[10px]">Delivery</span>
                      <span className="font-semibold text-gray-800 flex items-center gap-1 mt-0.5 capitalize">
                        <Package size={12} className="text-gray-400" />
                        {order.deliveryMethod}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-gray-100 mt-1">
                    <span className="text-[10px] text-gray-400">Placed: {fmtDateTime(order.createdAt)}</span>
                    {NEXT_STATUS[order.status] && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleStatusChange(order.id, NEXT_STATUS[order.status]!); }}
                        disabled={updatingStatus}
                        className="px-3.5 py-1.5 rounded-lg text-xs font-black bg-[#111111] text-white hover:bg-gray-800 transition-all shadow-sm cursor-pointer disabled:opacity-50"
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
        <div className="lg:col-span-4 bg-white rounded-2xl p-6 border border-gray-200 shadow-sm sticky top-6">
          <h3 className="font-extrabold text-base text-gray-900 mb-4 pb-3 border-b border-gray-100 flex items-center justify-between">
            <span>Order Inspector</span>
            {selectedOrder && <span className="text-xs font-mono font-bold text-amber-600">{selectedOrder.id}</span>}
          </h3>

          {selectedOrder ? (
            <div className="space-y-4 text-xs">
              <div>
                <label className="text-gray-400 font-medium block mb-1">Customer</label>
                <div className="font-bold text-sm text-gray-900 bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                  {selectedOrder.name}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-gray-400 font-medium block mb-1">Phone</label>
                  <div className="font-bold text-gray-900 bg-gray-50 p-2.5 rounded-xl border border-gray-100 flex items-center gap-1.5">
                    <Phone size={13} className="text-amber-500" />
                    {selectedOrder.phone}
                  </div>
                </div>
                <div>
                  <label className="text-gray-400 font-medium block mb-1">Email</label>
                  <div className="font-medium text-gray-800 bg-gray-50 p-2.5 rounded-xl border border-gray-100 flex items-center gap-1.5 truncate">
                    <Mail size={13} className="text-gray-400 flex-shrink-0" />
                    <span className="truncate">{selectedOrder.email}</span>
                  </div>
                </div>
              </div>

              {selectedOrder.shippingAddress && (
                <div>
                  <label className="text-gray-400 font-medium block mb-1">Shipping Address</label>
                  <div className="font-medium text-gray-800 bg-gray-50 p-2.5 rounded-xl border border-gray-100 flex items-start gap-1.5">
                    <MapPin size={13} className="text-amber-500 flex-shrink-0 mt-0.5" />
                    <span>
                      {[selectedOrder.shippingAddress.address, selectedOrder.shippingAddress.city, selectedOrder.shippingAddress.state, selectedOrder.shippingAddress.pincode]
                        .filter(Boolean)
                        .join(", ")}
                    </span>
                  </div>
                </div>
              )}

              <div>
                <label className="text-gray-400 font-medium block mb-1">Items</label>
                <div className="bg-gray-50 rounded-xl border border-gray-100 divide-y divide-gray-100">
                  {(selectedOrder.items || []).map((it, i) => (
                    <div key={i} className="flex items-center justify-between p-2.5">
                      <span className="font-semibold text-gray-800">{it.name} × {it.qty}</span>
                      <span className="font-bold text-gray-900">₹{(it.price * it.qty).toLocaleString("en-IN")}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 space-y-1">
                <div className="flex justify-between text-gray-600"><span>Subtotal</span><span>₹{selectedOrder.subtotal.toLocaleString("en-IN")}</span></div>
                <div className="flex justify-between text-gray-600"><span>Delivery</span><span>{selectedOrder.deliveryFee ? `₹${selectedOrder.deliveryFee}` : "Free"}</span></div>
                <div className="flex justify-between font-black text-amber-900 text-sm pt-1 border-t border-amber-200"><span>Total</span><span>₹{selectedOrder.total.toLocaleString("en-IN")}</span></div>
              </div>

              <div className="pt-2 border-t border-gray-100 space-y-2">
                <label className="text-gray-400 font-medium block">Fulfillment Status</label>
                <div className="flex flex-wrap gap-2">
                  {(["placed", "shipped", "delivered", "cancelled"] as const).map((s) => {
                    const meta = STATUS_META[s];
                    const isActive = selectedOrder.status === s;
                    return (
                      <button
                        key={s}
                        onClick={() => handleStatusChange(selectedOrder.id, s)}
                        disabled={updatingStatus || isActive}
                        className={`px-3 py-1.5 rounded-lg text-[11px] font-bold capitalize transition-all cursor-pointer disabled:cursor-default ${
                          isActive ? `${meta.bg} ${meta.color}` : "bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100"
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
            <div className="py-12 text-center text-gray-400">
              Select any order card on the left to inspect items, shipping details, and update fulfillment status.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect, useMemo } from "react";
import {
  ShoppingBag, Search, Truck, CheckCircle2, XCircle, Clock,
  Phone, Mail, MapPin, IndianRupee, Trash2, AlertTriangle, Loader2,
  RefreshCw, ExternalLink, Plus, ArrowUp, ArrowDown, ArrowUpDown,
  ChevronLeft, ChevronRight, X
} from "lucide-react";
import { apiClient, OrderTracking } from "../../../lib/apiClient";
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
  shiprocket?: OrderTracking | null;
  createdAt: string;
}

const PAYMENT_META: Record<OrderPayment["status"], { label: string; color: string; bg: string }> = {
  created: { label: "Awaiting Payment", color: "text-[#B54708]", bg: "bg-[#FEF6E7]" },
  paid: { label: "Paid", color: "text-[#16A34A]", bg: "bg-[#F0FDF4]" },
  failed: { label: "Failed", color: "text-[#EF4444]", bg: "bg-[#FEF2F2]" },
};

const STATUS_META: Record<Order["status"], { label: string; icon: any; color: string; bg: string }> = {
  placed: { label: "Placed", icon: Clock, color: "text-[#B54708]", bg: "bg-[#FEF6E7]" },
  shipped: { label: "Shipped", icon: Truck, color: "text-[var(--fx-accent-ink)]", bg: "bg-[var(--fx-accent-soft)]" },
  delivered: { label: "Delivered", icon: CheckCircle2, color: "text-[#16A34A]", bg: "bg-[#F0FDF4]" },
  cancelled: { label: "Cancelled", icon: XCircle, color: "text-[#EF4444]", bg: "bg-[#FEF2F2]" },
};

const NEXT_STATUS: Record<Order["status"], Order["status"] | null> = {
  placed: "shipped",
  shipped: "delivered",
  delivered: null,
  cancelled: null,
};

const STATUS_TABS: Array<{ key: "all" | Order["status"]; label: string }> = [
  { key: "all", label: "All" },
  { key: "placed", label: "Placed" },
  { key: "shipped", label: "Shipped" },
  { key: "delivered", label: "Delivered" },
  { key: "cancelled", label: "Cancelled" },
];

type SortKey = "name" | "total" | "createdAt";

export default function OrdersPage({ setToast }: { setToast: (msg: string | null) => void }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | Order["status"]>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sort, setSort] = useState<{ key: SortKey; dir: "asc" | "desc" }>({ key: "createdAt", dir: "desc" });
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 8;

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: "single"; order: Order } | { type: "all" } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [shipping, setShipping] = useState(false);
  const [refreshingTrack, setRefreshingTrack] = useState(false);
  const [shipError, setShipError] = useState<string | null>(null);

  const [newOrderOpen, setNewOrderOpen] = useState(false);
  const [savingOrder, setSavingOrder] = useState(false);
  const [draft, setDraft] = useState({
    name: "", email: "", phone: "",
    paymentMethod: "upi", deliveryMethod: "standard",
    address: "", city: "", state: "", pincode: "",
    items: [{ name: "", qty: 1, price: 0 }],
  });

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

  const showToast = (msg: string, ms = 2500) => {
    setToast(msg);
    setTimeout(() => setToast(null), ms);
  };

  const filteredOrders = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const filtered = orders.filter((o) => {
      const matchesFilter = filter === "all" || o.status === filter;
      const matchesSearch =
        !q ||
        o.id.toLowerCase().includes(q) ||
        (o.name || "").toLowerCase().includes(q) ||
        (o.email || "").toLowerCase().includes(q) ||
        (o.phone || "").includes(q);
      return matchesFilter && matchesSearch;
    });
    const sorted = [...filtered].sort((a, b) => {
      let diff = 0;
      if (sort.key === "name") diff = (a.name || "").localeCompare(b.name || "");
      else if (sort.key === "total") diff = (a.total || 0) - (b.total || 0);
      else diff = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      return sort.dir === "asc" ? diff : -diff;
    });
    return sorted;
  }, [orders, filter, searchQuery, sort]);

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / PAGE_SIZE));
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);
  useEffect(() => {
    setPage(1);
  }, [filter, searchQuery, sort]);

  const pageRows = filteredOrders.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const pageAllSelected = pageRows.length > 0 && pageRows.every((o) => selected.has(o.id));

  const totalCount = orders.length;
  const placedCount = orders.filter((o) => o.status === "placed").length;
  const revenue = orders.filter((o) => o.payment?.status === "paid").reduce((sum, o) => sum + (o.total || 0), 0);

  const handleStatusChange = async (orderId: string, status: Order["status"]) => {
    setUpdatingStatus(true);
    try {
      const res = await apiClient.orders.updateStatus(orderId, status);
      if (res?.success && res.data) {
        setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: res.data.status } : o)));
        setSelectedOrder((prev) => (prev && prev.id === orderId ? { ...prev, status: res.data.status } : prev));
        showToast(`Order ${orderId} marked as ${res.data.status}.`);
      } else {
        showToast("Failed to update order status.");
      }
    } catch {
      showToast("Failed to update order status.");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const applyOrder = (updated: Order) => {
    setOrders((prev) => prev.map((o) => (o.id === updated.id ? { ...o, ...updated } : o)));
    setSelectedOrder((prev) => (prev && prev.id === updated.id ? { ...prev, ...updated } : prev));
  };

  const handleCreateShipment = async (order: Order) => {
    setShipping(true);
    setShipError(null);
    try {
      const res = await apiClient.shiprocket.createShipment(order.id);
      if (res?.success && res.data) {
        applyOrder(res.data as Order);
        showToast(`Shipment booked for ${order.id}${res.data.shiprocket?.awbCode ? ` — AWB ${res.data.shiprocket.awbCode}` : ""}.`, 3000);
      } else {
        setShipError(res?.error || "Shiprocket rejected the shipment request.");
      }
    } catch (err: any) {
      setShipError(err?.message || "Failed to reach Shiprocket.");
    } finally {
      setShipping(false);
    }
  };

  const handleRefreshTracking = async (order: Order) => {
    setRefreshingTrack(true);
    setShipError(null);
    try {
      const res = await apiClient.shiprocket.track(order.id);
      if (res?.success && res.data) {
        applyOrder(res.data as Order);
        showToast(`Tracking refreshed for ${order.id}.`);
      } else {
        setShipError("Shiprocket returned no tracking for this shipment yet.");
      }
    } catch (err: any) {
      setShipError(err?.message || "Failed to fetch tracking.");
    } finally {
      setRefreshingTrack(false);
    }
  };

  const handleDeleteSingle = async (orderId: string) => {
    setDeleting(true);
    try {
      const res = await apiClient.orders.delete(orderId);
      if (res?.success) {
        setOrders((prev) => prev.filter((o) => o.id !== orderId));
        setSelected((prev) => { const next = new Set(prev); next.delete(orderId); return next; });
        if (selectedOrder?.id === orderId) setSelectedOrder(null);
        showToast(`Order ${orderId} deleted successfully.`);
        setDeleteConfirm(null);
      } else {
        showToast(res?.message || "Failed to delete order.");
      }
    } catch (err: any) {
      showToast(err?.message || "Failed to delete order.");
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteAll = async () => {
    setDeleting(true);
    try {
      const res = await apiClient.orders.deleteAll();
      if (res?.success) {
        setOrders([]);
        setSelectedOrder(null);
        setSelected(new Set());
        showToast("All orders deleted successfully.");
        setDeleteConfirm(null);
      } else {
        showToast(res?.message || "Failed to delete orders.");
      }
    } catch (err: any) {
      showToast(err?.message || "Failed to delete orders.");
    } finally {
      setDeleting(false);
    }
  };

  // ── Bulk actions ──────────────────────────────────────────────────────────
  const toggleRow = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  const togglePageAll = () => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (pageAllSelected) pageRows.forEach((o) => next.delete(o.id));
      else pageRows.forEach((o) => next.add(o.id));
      return next;
    });
  };

  const bulkStatus = async (status: "shipped" | "delivered") => {
    setBulkBusy(true);
    let ok = 0;
    for (const id of [...selected]) {
      try {
        const res = await apiClient.orders.updateStatus(id, status);
        if (res?.success && res.data) {
          ok += 1;
          setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status: res.data.status } : o)));
        }
      } catch { /* keep going */ }
    }
    setSelected(new Set());
    setBulkBusy(false);
    showToast(ok > 0 ? `${ok} order${ok === 1 ? "" : "s"} marked as ${status}.` : "Couldn't update the selected orders.");
  };

  const bulkDelete = async () => {
    setBulkBusy(true);
    let ok = 0;
    for (const id of [...selected]) {
      try {
        const res = await apiClient.orders.delete(id);
        if (res?.success) ok += 1;
      } catch { /* keep going */ }
    }
    setOrders((prev) => prev.filter((o) => !selected.has(o.id)));
    if (selectedOrder && selected.has(selectedOrder.id)) setSelectedOrder(null);
    setSelected(new Set());
    setBulkBusy(false);
    showToast(`${ok} order${ok === 1 ? "" : "s"} deleted.`);
  };

  const hasShippable = pageRows.some((o) => NEXT_STATUS[o.status] === "shipped");

  // ── New order modal ───────────────────────────────────────────────────────
  const draftSubtotal = draft.items.reduce((sum, it) => sum + (it.price || 0) * (it.qty || 1), 0);
  const draftDelivery = draft.deliveryMethod === "express" ? 99 : draft.deliveryMethod === "standard" ? 49 : 0;
  const draftTotal = draftSubtotal + draftDelivery;

  const openNewOrder = () => {
    setDraft({
      name: "", email: "", phone: "",
      paymentMethod: "upi", deliveryMethod: "standard",
      address: "", city: "", state: "", pincode: "",
      items: [{ name: "", qty: 1, price: 0 }],
    });
    setNewOrderOpen(true);
  };

  const saveNewOrder = async () => {
    if (!draft.name.trim() || !draft.email.trim() || !draft.phone.trim()) {
      showToast("Customer name, email and phone are required.");
      return;
    }
    if (!draft.items.some((it) => it.name.trim() && it.price > 0)) {
      showToast("Add at least one item with a name and price.");
      return;
    }
    setSavingOrder(true);
    try {
      const res = await apiClient.orders.create({
        name: draft.name.trim(),
        email: draft.email.trim(),
        phone: draft.phone.trim(),
        items: draft.items.filter((it) => it.name.trim()).map((it) => ({ name: it.name.trim(), qty: it.qty || 1, price: it.price || 0 })),
        subtotal: draftSubtotal,
        deliveryFee: draftDelivery,
        total: draftTotal,
        paymentMethod: draft.paymentMethod,
        deliveryMethod: draft.deliveryMethod,
        shippingAddress: {
          address: draft.address,
          city: draft.city,
          state: draft.state,
          pincode: draft.pincode,
        },
      });
      if (res?.success) {
        setNewOrderOpen(false);
        showToast("Order created.", 2500);
        loadOrders();
      } else {
        showToast("Failed to create the order.");
      }
    } catch (err: any) {
      showToast(err?.message || "Failed to create the order.");
    } finally {
      setSavingOrder(false);
    }
  };

  const setDraftField = (field: string, value: string) => setDraft((d) => ({ ...d, [field]: value }));
  const updateItem = (i: number, field: "name" | "qty" | "price", value: string | number) => {
    setDraft((d) => {
      const items = d.items.map((it, idx) => (idx === i ? { ...it, [field]: value } : it));
      return { ...d, items };
    });
  };

  // ── Render helpers ────────────────────────────────────────────────────────
  const SortIcon = ({ k }: { k: SortKey }) =>
    sort.key !== k ? (
      <ArrowUpDown size={12} className="text-[var(--fx-faint)]" />
    ) : sort.dir === "asc" ? (
      <ArrowUp size={12} className="text-[var(--fx-accent-ink)]" />
    ) : (
      <ArrowDown size={12} className="text-[var(--fx-accent-ink)]" />
    );

  const sortTh = (k: SortKey, label: string, align = "text-left") => (
    <th className="px-4 py-3 cursor-pointer select-none whitespace-nowrap" onClick={() => { setSort((s) => s.key === k ? { key: k, dir: s.dir === "asc" ? "desc" : "asc" } : { key: k, dir: k === "name" ? "asc" : "desc" }); }}>
      <span className={`inline-flex items-center gap-1 ${align} ${sort.key === k ? "text-[var(--fx-ink)]" : ""}`}>{label}<SortIcon k={k} /></span>
    </th>
  );

  const Badge = ({ meta }: { meta: { label: string; icon: any; color: string; bg: string } }) => {
    const Icon = meta.icon;
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide whitespace-nowrap ${meta.bg} ${meta.color}`}>
        <Icon size={12} />
        {meta.label}
      </span>
    );
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8 pt-5 sm:pt-7 pb-16 space-y-6 sm:space-y-7 text-[var(--fx-ink)] font-body relative" style={{ background: "var(--fx-canvas)" }}>
      {/* ── Page header ─────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-11 h-11 rounded-xl bg-[var(--fx-accent-soft)] text-[var(--fx-accent-ink)] flex items-center justify-center shrink-0">
            <ShoppingBag size={21} />
          </div>
          <div className="min-w-0">
            <h1 className="font-display text-[24px] font-bold text-[var(--fx-ink)] leading-tight tracking-[-0.5px] flex items-center gap-2.5">
              Orders
              <span className="inline-flex items-center px-2.5 h-6 rounded-full bg-[var(--fx-canvas)] text-[var(--fx-ink-2)] text-[11px] font-bold">
                {totalCount} record{totalCount === 1 ? "" : "s"}
              </span>
            </h1>
            <p className="text-[13px] text-[var(--fx-ink-2)] mt-0.5">
              Track fulfillment, manage records, and contact customers right from this list.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="inline-flex items-center gap-2 px-3.5 h-10 rounded-lg bg-[#FEF6E7] text-[#B54708] text-[12px] font-semibold">
            <Clock size={14} />
            <span className="font-mono font-bold">{placedCount}</span> Awaiting Shipment
          </div>
          <div className="inline-flex items-center gap-2 px-3.5 h-10 rounded-lg bg-[#F0FDF4] text-[#16A34A] text-[12px] font-semibold">
            <IndianRupee size={14} />
            <span className="font-mono font-bold">₹{revenue.toLocaleString("en-IN")}</span> Revenue
          </div>
          <button onClick={openNewOrder} className="fx-btn fx-btn-primary">
            <Plus size={15} strokeWidth={2.5} />
            New Order
          </button>
        </div>
      </div>

      {/* ── Toolbar: tabs + search ──────────────────────────────────── */}
      <div className="bg-white border border-[var(--fx-border)] rounded-xl shadow-[0_1px_2px_rgba(24,24,27,0.05)] p-3 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto -mx-1 px-1">
          {STATUS_TABS.map((tab) => {
            const count = tab.key === "all" ? totalCount : orders.filter((o) => o.status === tab.key).length;
            const active = filter === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`flex items-center gap-1.5 h-10 px-4 rounded-[10px] text-[12px] font-semibold transition-all whitespace-nowrap cursor-pointer ${
                  active ? "bg-[var(--fx-accent)] text-white shadow-sm shadow-[var(--fx-accent)]/25" : "text-[var(--fx-ink-2)] hover:bg-[var(--fx-canvas)] hover:text-[var(--fx-ink)]"
                }`}
              >
                {tab.label}
                <span className={`text-[10px] font-bold font-mono ${active ? "text-white/80" : "text-[var(--fx-faint)]"}`}>{count}</span>
              </button>
            );
          })}
        </div>

        <div className="relative w-full lg:w-80 shrink-0">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--fx-faint)]" />
          <input
            type="text"
            placeholder="Search by order ID, name, email, phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 h-10 text-[12.5px] rounded-[10px] border border-[var(--fx-border)] bg-[var(--fx-canvas)] text-[var(--fx-ink)] placeholder-[var(--fx-faint)] outline-none transition-all focus:border-[var(--fx-accent-ink)] focus:bg-white focus:ring-[3px] focus:ring-[var(--fx-accent)]/[0.30]"
          />
        </div>
      </div>

      {/* ── Bulk selection bar ──────────────────────────────────────── */}
      {selected.size > 0 && (
        <div className="bg-[var(--fx-accent-soft)] border border-[var(--fx-accent-ink)]/50 rounded-xl px-4 py-3 flex flex-wrap items-center justify-between gap-3 animate-fade-in">
          <span className="text-[12.5px] font-bold text-[var(--fx-ink)]">
            {selected.size} order{selected.size === 1 ? "" : "s"} selected
          </span>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => bulkStatus("shipped")}
              disabled={bulkBusy || !hasShippable}
              className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-[10px] text-[12px] font-bold bg-[var(--fx-ink)] text-white hover:bg-[var(--fx-ink)] transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              title={hasShippable ? "Mark all selected placed orders as shipped" : "No selected order can be shipped next"}
            >
              <Truck size={13} /> Mark as Shipped
            </button>
            <button
              onClick={() => bulkStatus("delivered")}
              disabled={bulkBusy}
              className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-[10px] text-[12px] font-bold bg-white border border-[var(--fx-border)] text-[var(--fx-ink)] hover:bg-[var(--fx-canvas)] transition-all cursor-pointer disabled:opacity-40"
            >
              <CheckCircle2 size={13} /> Mark as Delivered
            </button>
            <button
              onClick={bulkDelete}
              disabled={bulkBusy}
              className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-[10px] text-[12px] font-bold text-[#EF4444] bg-white border border-[#FECACA] hover:bg-[#FEF2F2] transition-all cursor-pointer disabled:opacity-40"
            >
              {bulkBusy ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />} Delete
            </button>
            <button
              onClick={() => setSelected(new Set())}
              className="inline-flex items-center gap-1.5 h-9 px-3 rounded-[10px] text-[12px] font-semibold text-[var(--fx-ink-2)] hover:bg-white/60 transition-colors cursor-pointer"
            >
              <X size={13} /> Clear
            </button>
          </div>
        </div>
      )}

      {/* ── Main: table + inspector ─────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        <div className="xl:col-span-8 space-y-4 min-w-0">
          {/* Table */}
          <div className="bg-white border border-[var(--fx-border)] rounded-xl shadow-[0_1px_2px_rgba(24,24,27,0.05)] overflow-hidden">
            {loading ? (
              <div className="p-16 text-center space-y-3">
                <div className="w-12 h-12 rounded-xl bg-[var(--fx-accent-soft)] text-[var(--fx-accent-ink)] flex items-center justify-center mx-auto">
                  <Loader2 size={22} className="animate-spin" />
                </div>
                <p className="font-semibold text-[13px] text-[var(--fx-ink)]">Loading orders…</p>
              </div>
            ) : loadError ? (
              <div className="p-16 text-center space-y-3">
                <div className="w-12 h-12 rounded-xl bg-[#FEF2F2] text-[#EF4444] flex items-center justify-center mx-auto">
                  <XCircle size={22} />
                </div>
                <p className="font-bold text-[13px] text-[var(--fx-ink)]">Couldn't load orders.</p>
                <p className="text-[12px] text-[var(--fx-ink-2)] font-mono max-w-[420px] mx-auto">{loadError}</p>
                <button onClick={loadOrders} className="fx-btn fx-btn-danger h-10">
                  <RefreshCw size={14} /> Retry
                </button>
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="p-16 text-center space-y-3">
                <div className="w-12 h-12 rounded-xl bg-[var(--fx-accent-soft)] text-[var(--fx-accent-ink)] flex items-center justify-center mx-auto">
                  <ShoppingBag size={22} />
                </div>
                <p className="font-bold text-[13px] text-[var(--fx-ink)]">
                  {searchQuery || filter !== "all" ? "No orders match your filters." : "No orders yet."}
                </p>
                <p className="text-[12.5px] text-[var(--fx-ink-2)] max-w-[420px] mx-auto">
                  {searchQuery || filter !== "all"
                    ? "Try a different search term or status tab."
                    : "Orders placed by customers on the Checkout page will appear here. You can also add one manually."}
                </p>
                {(searchQuery || filter !== "all") && (
                  <button onClick={() => { setSearchQuery(""); setFilter("all"); }} className="fx-btn fx-btn-secondary h-10">
                    <X size={14} /> Clear filters
                  </button>
                )}
              </div>
            ) : (
              <>
                <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-[var(--fx-canvas)] border-b border-[var(--fx-border)] text-[10px] font-bold uppercase tracking-wide text-[var(--fx-ink-2)]">
                        <th className="px-4 py-3 w-10">
                          <input
                            type="checkbox"
                            checked={pageAllSelected}
                            onChange={togglePageAll}
                            title="Select all orders on this page"
                            className="w-4 h-4 rounded border-[#D0D5DD] text-[var(--fx-accent-ink)] cursor-pointer"
                          />
                        </th>
                        {sortTh("name", "Customer")}
                        <th className="px-4 py-3">Items</th>
                        {sortTh("total", "Total")}
                        <th className="px-4 py-3">Payment</th>
                        <th className="px-4 py-3">Status</th>
                        {sortTh("createdAt", "Placed")}
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--fx-border)]">
                      {pageRows.map((order) => {
                        const meta = STATUS_META[order.status] || STATUS_META.placed;
                        const payMeta = PAYMENT_META[order.payment?.status || "created"];
                        const isBulkSelected = selected.has(order.id);
                        const isInspecting = selectedOrder?.id === order.id;
                        return (
                          <tr
                            key={order.id}
                            onClick={() => { setSelectedOrder(order); setShipError(null); }}
                            className={`group cursor-pointer transition-colors ${
                              isInspecting ? "bg-[var(--fx-accent-soft)]/50" : isBulkSelected ? "bg-[var(--fx-accent)]/[0.07]" : "hover:bg-[var(--fx-canvas)]"
                            }`}
                          >
                            <td className="px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                              <input
                                type="checkbox"
                                checked={isBulkSelected}
                                onChange={() => toggleRow(order.id)}
                                title="Select this order"
                                className="w-4 h-4 rounded border-[#D0D5DD] text-[var(--fx-accent-ink)] cursor-pointer"
                              />
                            </td>
                            <td className="px-4 py-3.5">
                              <div className="flex items-center gap-3">
                                <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-black text-[13px] shrink-0 ${meta.bg} ${meta.color}`}>
                                  {(order.name || "?").charAt(0).toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                  <div className="font-semibold text-[13px] text-[var(--fx-ink)] truncate">
                                    {order.name}
                                    {order.userId && (
                                      <span className="ml-2 text-[9px] font-bold text-[var(--fx-accent-ink)] bg-[var(--fx-accent-soft)] px-1.5 py-0.5 rounded-md align-middle">Registered</span>
                                    )}
                                  </div>
                                  <div className="text-[11px] text-[var(--fx-faint)] truncate">{order.email || "—"}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3.5">
                              <div className="text-[12px] font-semibold text-[var(--fx-ink)]">{order.items?.length || 0} item{(order.items?.length || 0) !== 1 ? "s" : ""}</div>
                              <div className="text-[11px] text-[var(--fx-faint)] max-w-[140px] truncate">{order.items?.[0]?.name || "—"}</div>
                            </td>
                            <td className="px-4 py-3.5">
                              <span className="font-bold font-mono text-[13px] text-[var(--fx-ink)]">₹{(order.total || 0).toLocaleString("en-IN")}</span>
                            </td>
                            <td className="px-4 py-3.5">
                              <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold whitespace-nowrap ${payMeta.bg} ${payMeta.color}`}>
                                {payMeta.label}
                              </span>
                            </td>
                            <td className="px-4 py-3.5"><Badge meta={meta} /></td>
                            <td className="px-4 py-3.5 whitespace-nowrap">
                              <div className="text-[11px] font-semibold text-[var(--fx-ink)]">{fmtDateTime(order.createdAt)}</div>
                              <div className="text-[10px] font-mono text-[var(--fx-faint)]">{order.id}</div>
                            </td>
                            <td className="px-4 py-3.5">
                              <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                                {NEXT_STATUS[order.status] && (
                                  <button
                                    onClick={() => handleStatusChange(order.id, NEXT_STATUS[order.status]!)}
                                    disabled={updatingStatus}
                                    className="flex items-center gap-1.5 h-8 px-3 rounded-[8px] text-[11px] font-bold bg-[var(--fx-accent)] text-white hover:bg-[var(--fx-accent-ink)] transition-all cursor-pointer disabled:opacity-50 shadow-xs"
                                  >
                                    <Truck size={12} />
                                    Mark {STATUS_META[NEXT_STATUS[order.status]!].label}
                                  </button>
                                )}
                                <button
                                  onClick={() => setDeleteConfirm({ type: "single", order })}
                                  className="flex items-center justify-center w-8 h-8 rounded-[8px] text-[var(--fx-faint)] hover:text-[#EF4444] hover:bg-[#FEF2F2] transition-colors cursor-pointer"
                                  title="Delete this order"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                   </tbody>
                 </table>

                 {/* Pagination footer */}
                <div className="px-4 py-3 border-t border-[var(--fx-border)] bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <span className="text-[11.5px] text-[var(--fx-ink-2)]">
                    Showing <span className="font-bold text-[var(--fx-ink)]">{filteredOrders.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}</span>–
                    <span className="font-bold text-[var(--fx-ink)]">{Math.min(page * PAGE_SIZE, filteredOrders.length)}</span> of{" "}
                    <span className="font-bold text-[var(--fx-ink)]">{filteredOrders.length}</span> orders
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="flex items-center justify-center w-9 h-9 rounded-[10px] border border-[var(--fx-border)] bg-white text-[var(--fx-ink)] hover:bg-[var(--fx-canvas)] transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                      aria-label="Previous page"
                    >
                      <ChevronLeft size={15} />
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => {
                      const show = totalPages <= 7 || Math.abs(n - page) <= 1 || n === 1 || n === totalPages;
                      if (!show) return n === totalPages - 1 || n === 2 ? <span key={n} className="px-1 text-[12px] text-[var(--fx-faint)]">…</span> : null;
                      return (
                        <button
                          key={n}
                          onClick={() => setPage(n)}
                          className={`flex items-center justify-center min-w-9 h-9 px-2.5 rounded-[10px] text-[12px] font-semibold transition-all cursor-pointer ${
                            page === n ? "bg-[var(--fx-accent)] text-white shadow-xs" : "text-[var(--fx-ink-2)] hover:bg-[var(--fx-canvas)]"
                          }`}
                        >
                          {n}
                        </button>
                      );
                    })}
                    <button
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="flex items-center justify-center w-9 h-9 rounded-[10px] border border-[var(--fx-border)] bg-white text-[var(--fx-ink)] hover:bg-[var(--fx-canvas)] transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                      aria-label="Next page"
                    >
                      <ChevronRight size={15} />
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* ── Details Inspector ─────────────────────────────────────── */}
        <div className="xl:col-span-4 bg-white border border-[var(--fx-border)] rounded-xl shadow-[0_1px_2px_rgba(24,24,27,0.05)] sticky top-6 min-w-0">
          <div className="px-6 py-4 border-b border-[var(--fx-border)] flex items-center justify-between gap-3">
            <h3 className="font-display font-semibold text-[14.5px] text-[var(--fx-ink)]">Order Inspector</h3>
            {selectedOrder && <span className="text-[11px] font-mono font-bold text-[var(--fx-accent-ink)] bg-[var(--fx-accent-soft)] px-2 py-0.5 rounded-md">{selectedOrder.id}</span>}
          </div>

          {selectedOrder ? (
            <div className="p-6 space-y-5 text-[12px]">
              <div>
                <label className="text-[10px] font-bold text-[var(--fx-ink-2)] uppercase tracking-wide block mb-1.5">Customer</label>
                <div className="font-bold text-[14px] text-[var(--fx-ink)] bg-[var(--fx-canvas)] border border-[var(--fx-border)] p-3 rounded-[10px] flex items-center justify-between gap-2">
                  <span className="truncate">{selectedOrder.name}</span>
                  {selectedOrder.userId ? (
                    <span className="text-[10px] font-bold text-[var(--fx-accent-ink)] bg-[var(--fx-accent-soft)] px-2 py-0.5 rounded-md whitespace-nowrap">Registered</span>
                  ) : (
                    <span className="text-[10px] font-bold text-[var(--fx-ink-2)] bg-[var(--fx-canvas)] px-2 py-0.5 rounded-md whitespace-nowrap">Guest</span>
                  )}
                </div>
                {selectedOrder.userId && (
                  <div className="text-[10.5px] font-mono text-[var(--fx-faint)] mt-1 truncate">User ID: {selectedOrder.userId}</div>
                )}
              </div>

              <div>
                <label className="text-[10px] font-bold text-[var(--fx-ink-2)] uppercase tracking-wide block mb-1.5">Payment (Razorpay)</label>
                <div className="bg-[var(--fx-canvas)] border border-[var(--fx-border)] rounded-[10px] p-3 space-y-1.5">
                  {(() => {
                    const p = selectedOrder.payment;
                    const pMeta = PAYMENT_META[p?.status || "created"];
                    return (
                      <>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[var(--fx-ink-2)]">Status</span>
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${pMeta.bg} ${pMeta.color}`}>{pMeta.label}</span>
                        </div>
                        {p?.razorpayPaymentId && (
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[var(--fx-ink-2)] shrink-0">Payment ID</span>
                            <span className="font-mono text-[11px] text-[var(--fx-ink)] truncate">{p.razorpayPaymentId}</span>
                          </div>
                        )}
                        {p?.razorpayOrderId && (
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[var(--fx-ink-2)] shrink-0">Razorpay Order</span>
                            <span className="font-mono text-[11px] text-[var(--fx-ink)] truncate">{p.razorpayOrderId}</span>
                          </div>
                        )}
                        {p?.paidAt && (
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[var(--fx-ink-2)]">Paid At</span>
                            <span className="text-[var(--fx-ink)]">{fmtDateTime(p.paidAt)}</span>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-[var(--fx-ink-2)] uppercase tracking-wide block mb-1.5">Phone</label>
                  <div className="font-bold text-[var(--fx-ink)] bg-[var(--fx-canvas)] border border-[var(--fx-border)] p-3 rounded-[10px] flex items-center gap-1.5 font-mono">
                    <Phone size={14} className="text-[var(--fx-accent-ink)]" />
                    {selectedOrder.phone}
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-[var(--fx-ink-2)] uppercase tracking-wide block mb-1.5">Email</label>
                  <div className="font-medium text-[var(--fx-ink)] bg-[var(--fx-canvas)] border border-[var(--fx-border)] p-3 rounded-[10px] flex items-center gap-1.5 truncate">
                    <Mail size={14} className="text-[var(--fx-faint)] flex-shrink-0" />
                    <span className="truncate">{selectedOrder.email}</span>
                  </div>
                </div>
              </div>

              {selectedOrder.shippingAddress && (
                <div>
                  <label className="text-[10px] font-bold text-[var(--fx-ink-2)] uppercase tracking-wide block mb-1.5">Shipping Address</label>
                  <div className="font-medium text-[var(--fx-ink)] bg-[var(--fx-canvas)] border border-[var(--fx-border)] p-3 rounded-[10px] flex items-start gap-1.5">
                    <MapPin size={14} className="text-[var(--fx-accent-ink)] flex-shrink-0 mt-0.5" />
                    <span>
                      {[selectedOrder.shippingAddress.address, selectedOrder.shippingAddress.city, selectedOrder.shippingAddress.state, selectedOrder.shippingAddress.pincode]
                        .filter(Boolean)
                        .join(", ")}
                    </span>
                  </div>
                </div>
              )}

              <div>
                <label className="text-[10px] font-bold text-[var(--fx-ink-2)] uppercase tracking-wide block mb-1.5">Items</label>
                <div className="bg-[var(--fx-canvas)] border border-[var(--fx-border)] rounded-[10px] divide-y divide-[var(--fx-border)] overflow-hidden">
                  {(selectedOrder.items || []).map((it, i) => (
                    <div key={i} className="flex items-center justify-between gap-2 p-3">
                      <span className="font-semibold text-[var(--fx-ink)]">{it.name} × {it.qty}</span>
                      <span className="font-bold text-[var(--fx-ink)] font-mono">₹{(it.price * it.qty).toLocaleString("en-IN")}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-[var(--fx-canvas)] border border-[var(--fx-border)] rounded-[10px] p-3.5 space-y-1.5">
                <div className="flex justify-between text-[var(--fx-ink-2)]"><span>Subtotal</span><span className="font-mono">₹{selectedOrder.subtotal.toLocaleString("en-IN")}</span></div>
                <div className="flex justify-between text-[var(--fx-ink-2)]"><span>Delivery</span><span className="font-mono">{selectedOrder.deliveryFee ? `₹${selectedOrder.deliveryFee}` : "Free"}</span></div>
                <div className="flex justify-between font-black text-[var(--fx-ink)] text-[14.5px] pt-2 border-t border-[var(--fx-border)]"><span>Total</span><span className="font-mono">₹{selectedOrder.total.toLocaleString("en-IN")}</span></div>
              </div>

              {/* ── Shiprocket ── */}
              <div className="pt-2 border-t border-[var(--fx-border)] space-y-2">
                <label className="text-[10px] font-bold text-[var(--fx-ink-2)] uppercase tracking-wide block">Delivery (Shiprocket)</label>

                {selectedOrder.shiprocket?.shipmentId ? (
                  <div className="bg-[var(--fx-canvas)] border border-[var(--fx-border)] rounded-[10px] p-3 space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[var(--fx-ink-2)]">Courier</span>
                      <span className="font-semibold text-[var(--fx-ink)] truncate">{selectedOrder.shiprocket.courierName || "Assigning…"}</span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[var(--fx-ink-2)]">AWB</span>
                      <span className="font-mono text-[11px] text-[var(--fx-ink)] truncate">{selectedOrder.shiprocket.awbCode || "Pending"}</span>
                    </div>
                    {selectedOrder.shiprocket.currentStatus && (
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[var(--fx-ink-2)]">Courier Status</span>
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-[var(--fx-accent-soft)] text-[var(--fx-accent-ink)]">
                          {selectedOrder.shiprocket.currentStatus}
                        </span>
                      </div>
                    )}
                    {selectedOrder.shiprocket.etd && (
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[var(--fx-ink-2)]">Expected</span>
                        <span className="text-[var(--fx-ink)]">{selectedOrder.shiprocket.etd}</span>
                      </div>
                    )}

                    {!!selectedOrder.shiprocket.timeline?.length && (
                       <div className="pt-2.5 mt-1 border-t border-[var(--fx-border)] space-y-2.5">
                        {[...selectedOrder.shiprocket.timeline].reverse().map((ev, i) => (
                          <div key={`${ev.status}-${ev.at}-${i}`} className="flex gap-2.5">
                            <span className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${i === 0 ? "bg-[var(--fx-accent-ink)]" : "bg-[#D5D6D9]"}`} />
                            <div className="min-w-0">
                              <div className="text-[12px] font-semibold text-[var(--fx-ink)]">{ev.status}</div>
                              <div className="text-[11px] text-[var(--fx-faint)] font-mono truncate">
                                {[ev.at ? fmtDateTime(ev.at) : null, ev.location].filter(Boolean).join(" · ")}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center gap-2 pt-2.5">
                      <button
                        onClick={() => handleRefreshTracking(selectedOrder)}
                        disabled={refreshingTrack}
                        className="flex-1 flex items-center justify-center gap-1.5 h-10 rounded-[10px] text-[12px] font-bold bg-[var(--fx-ink)] text-white hover:bg-[var(--fx-ink)] transition-colors cursor-pointer disabled:opacity-50"
                      >
                        <RefreshCw size={13} className={refreshingTrack ? "animate-spin" : ""} />
                        {refreshingTrack ? "Refreshing…" : "Refresh Tracking"}
                      </button>
                      {selectedOrder.shiprocket.trackingUrl && (
                        <a
                          href={selectedOrder.shiprocket.trackingUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center justify-center gap-1.5 h-10 px-4 rounded-[10px] text-[12px] font-bold bg-white text-[var(--fx-ink)] border border-[var(--fx-border)] hover:bg-[var(--fx-canvas)] transition-colors"
                        >
                          <ExternalLink size={13} />
                          Open
                        </a>
                      )}
                    </div>
                  </div>
                ) : selectedOrder.status === "cancelled" ? (
                  <p className="text-[12px] text-[var(--fx-faint)]">This order was cancelled — no shipment to book.</p>
                ) : selectedOrder.payment?.status !== "paid" && selectedOrder.paymentMethod !== "cod" ? (
                  <p className="text-[12px] text-[#B54708] bg-[#FEF6E7] rounded-[10px] p-3">
                    Payment hasn't been confirmed yet. Book the shipment once this order shows as Paid (or switch it to COD).
                  </p>
                ) : (
                  <button
                    onClick={() => handleCreateShipment(selectedOrder)}
                    disabled={shipping}
                    className="w-full flex items-center justify-center gap-1.5 h-11 rounded-[10px] text-[12.5px] font-bold bg-[var(--fx-accent)] text-white hover:bg-[var(--fx-accent-ink)] transition-colors cursor-pointer disabled:opacity-50 shadow-sm shadow-[var(--fx-accent)]/20"
                  >
                    {shipping ? <Loader2 size={14} className="animate-spin" /> : <Truck size={14} />}
                    {shipping ? "Booking courier…" : "Book Shipment via Shiprocket"}
                  </button>
                )}

                {shipError && (
                  <p className="text-[12px] text-[#EF4444] bg-[#FEF2F2] rounded-[10px] p-3 leading-relaxed">{shipError}</p>
                )}
              </div>

              {/* ── Fulfillment status ── */}
              <div className="pt-2 border-t border-[var(--fx-border)] space-y-2">
                <label className="text-[10px] font-bold text-[var(--fx-ink-2)] uppercase tracking-wide block">Fulfillment Status</label>
                <div className="flex flex-wrap gap-2">
                  {(["placed", "shipped", "delivered", "cancelled"] as const).map((s) => {
                    const meta = STATUS_META[s];
                    const isActive = selectedOrder.status === s;
                    return (
                      <button
                        key={s}
                        onClick={() => handleStatusChange(selectedOrder.id, s)}
                        disabled={updatingStatus || isActive}
                        className={`h-9 px-4 rounded-[10px] text-[12px] font-bold capitalize transition-all cursor-pointer disabled:cursor-default ${
                          isActive ? `${meta.bg} ${meta.color}` : "bg-[var(--fx-canvas)] text-[var(--fx-ink-2)] border border-[var(--fx-border)] hover:bg-[var(--fx-canvas)]"
                        }`}
                      >
                        {meta.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-3 border-t border-[var(--fx-border)]">
                <button
                  type="button"
                  onClick={() => setDeleteConfirm({ type: "single", order: selectedOrder })}
                  className="w-full flex items-center justify-center gap-1.5 h-10 rounded-[10px] text-[12px] font-bold text-[#EF4444] bg-[#FEF2F2] hover:bg-[#FFE4E6] border border-[#FECACA] transition-colors cursor-pointer"
                >
                  <Trash2 size={14} />
                  Delete Order Record
                </button>
              </div>
            </div>
          ) : (
            <div className="py-20 px-6 text-center text-[var(--fx-faint)] text-[12.5px]">
              Select any order row to inspect items, shipping details, and update fulfillment status.
            </div>
          )}
        </div>
      </div>

      {/* ── New Order Modal ─────────────────────────────────────────── */}
      {newOrderOpen && (
        <div className="fixed inset-0 bg-[var(--fx-ink)]/50 backdrop-blur-[2px] flex items-center justify-center p-4 z-50 animate-fade-in" onClick={() => !savingOrder && setNewOrderOpen(false)}>
           <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-[var(--fx-border)] p-6 space-y-5 animate-modal-pop" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="font-display text-[17px] font-bold text-[var(--fx-ink)] tracking-[-0.3px]">Create new order</h2>
                <p className="text-[12.5px] text-[var(--fx-ink-2)] mt-0.5">Manually record an order placed outside the checkout flow.</p>
              </div>
              <button onClick={() => setNewOrderOpen(false)} className="flex items-center justify-center w-8 h-8 rounded-[8px] text-[var(--fx-ink-2)] hover:bg-[var(--fx-canvas)] cursor-pointer" aria-label="Close">
                <X size={16} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-3">
                  <label className="fx-label mb-1.5 block">Customer name</label>
                  <input type="text" value={draft.name} onChange={(e) => setDraftField("name", e.target.value)} placeholder="e.g. Aarav Sharma" className="fx-input" />
                </div>
                <div>
                  <label className="fx-label mb-1.5 block">Email</label>
                  <input type="email" value={draft.email} onChange={(e) => setDraftField("email", e.target.value)} placeholder="name@example.com" className="fx-input" />
                </div>
                <div>
                  <label className="fx-label mb-1.5 block">Phone</label>
                  <input type="tel" value={draft.phone} onChange={(e) => setDraftField("phone", e.target.value)} placeholder="90XXXXXXXX" className="fx-input font-mono" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="fx-label mb-1.5 block">Payment</label>
                    <select value={draft.paymentMethod} onChange={(e) => setDraftField("paymentMethod", e.target.value)} className="fx-input">
                      <option value="upi">UPI</option>
                      <option value="cod">COD</option>
                      <option value="card">Card</option>
                    </select>
                  </div>
                  <div>
                    <label className="fx-label mb-1.5 block">Delivery</label>
                    <select value={draft.deliveryMethod} onChange={(e) => setDraftField("deliveryMethod", e.target.value)} className="fx-input">
                      <option value="standard">Standard</option>
                      <option value="express">Express</option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="fx-label block">Line items</label>
                  <button
                    onClick={() => setDraft((d) => ({ ...d, items: [...d.items, { name: "", qty: 1, price: 0 }] }))}
                    className="flex items-center gap-1 h-8 px-2.5 rounded-[8px] text-[11.5px] font-bold text-[var(--fx-accent-ink)] bg-[var(--fx-accent-soft)] hover:bg-[var(--fx-accent-soft)] transition-colors cursor-pointer"
                  >
                    <Plus size={12} /> Add item
                  </button>
                </div>
                <div className="space-y-2">
                  {draft.items.map((it, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input type="text" value={it.name} onChange={(e) => updateItem(i, "name", e.target.value)} placeholder="Item name" className="fx-input flex-1 min-w-0" />
                      <input type="number" min={1} value={it.qty} onChange={(e) => updateItem(i, "qty", Math.max(1, Number(e.target.value) || 1))} title="Quantity" className="fx-input w-16 text-center" />
                      <input type="number" min={0} step="1" value={it.price} onChange={(e) => updateItem(i, "price", Number(e.target.value) || 0)} placeholder="₹" title="Unit price" className="fx-input w-24 font-mono" />
                      <button onClick={() => setDraft((d) => ({ ...d, items: d.items.filter((_, idx) => idx !== i) }))} disabled={draft.items.length === 1} className="flex items-center justify-center w-9 h-9 rounded-[8px] text-[var(--fx-faint)] hover:text-[#EF4444] hover:bg-[#FEF2F2] transition-colors cursor-pointer disabled:opacity-40" aria-label="Remove item">
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="fx-label mb-1.5 block">Address</label>
                  <input type="text" value={draft.address} onChange={(e) => setDraftField("address", e.target.value)} placeholder="Street, area" className="fx-input" />
                </div>
                <div>
                  <label className="fx-label mb-1.5 block">City</label>
                  <input type="text" value={draft.city} onChange={(e) => setDraftField("city", e.target.value)} placeholder="City" className="fx-input" />
                </div>
                <div>
                  <label className="fx-label mb-1.5 block">State</label>
                  <input type="text" value={draft.state} onChange={(e) => setDraftField("state", e.target.value)} placeholder="State" className="fx-input" />
                </div>
                <div>
                  <label className="fx-label mb-1.5 block">Pincode</label>
                  <input type="text" value={draft.pincode} onChange={(e) => setDraftField("pincode", e.target.value)} placeholder="Pincode" className="fx-input font-mono" />
                </div>
              </div>

              <div className="bg-[var(--fx-canvas)] border border-[var(--fx-border)] rounded-[10px] px-4 py-3 space-y-1">
                <div className="flex justify-between text-[12.5px] text-[var(--fx-ink-2)]"><span>Subtotal</span><span className="font-mono">₹{draftSubtotal.toLocaleString("en-IN")}</span></div>
                <div className="flex justify-between text-[12.5px] text-[var(--fx-ink-2)]"><span>Delivery</span><span className="font-mono">{draftDelivery ? `₹${draftDelivery}` : "Free"}</span></div>
                <div className="flex justify-between font-bold text-[14.5px] text-[var(--fx-ink)] pt-1 border-t border-[var(--fx-border)]"><span>Total</span><span className="font-mono">₹{draftTotal.toLocaleString("en-IN")}</span></div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button onClick={() => setNewOrderOpen(false)} disabled={savingOrder} className="fx-btn fx-btn-secondary">
                Cancel
              </button>
              <button onClick={saveNewOrder} disabled={savingOrder} className="fx-btn fx-btn-primary">
                {savingOrder ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
                {savingOrder ? "Creating…" : "Create Order"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirmation Modal ────────────────────────────────── */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-[var(--fx-ink)]/50 backdrop-blur-[2px] flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[var(--fx-border)] space-y-4 animate-modal-pop">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-[var(--fx-red-soft)] text-[var(--fx-red)] flex items-center justify-center shrink-0 mt-0.5">
                <AlertTriangle size={20} />
              </div>
              <div>
                <h3 className="font-display text-[15px] font-bold text-[var(--fx-ink)] leading-snug">
                  {deleteConfirm.type === "all" ? "Delete All Orders?" : `Delete Order ${deleteConfirm.order.id}?`}
                </h3>
                <p className="text-[12.5px] text-[var(--fx-ink-2)] mt-1 leading-relaxed">
                  {deleteConfirm.type === "all"
                    ? "This will permanently delete all order records from the database. This action cannot be undone."
                    : `Are you sure you want to delete the order record for "${deleteConfirm.order.name}" (₹${deleteConfirm.order.total.toLocaleString("en-IN")})?`}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--fx-border)]">
              <button
                type="button"
                onClick={() => setDeleteConfirm(null)}
                disabled={deleting}
                className="px-4 h-10 rounded-[10px] text-[12.5px] font-semibold text-[var(--fx-ink-2)] bg-[var(--fx-canvas)] hover:bg-[var(--fx-border)] transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (deleteConfirm.type === "all") handleDeleteAll();
                  else handleDeleteSingle(deleteConfirm.order.id);
                }}
                disabled={deleting}
                className="px-4 h-10 rounded-[10px] text-[12.5px] font-bold text-white bg-[var(--fx-red)] hover:bg-[#A32C24] transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
              >
                {deleting && <Loader2 size={13} className="animate-spin" />}
                <span>{deleting ? "Deleting..." : deleteConfirm.type === "all" ? "Yes, Delete All" : "Yes, Delete"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
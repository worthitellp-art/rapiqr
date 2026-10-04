import type React from "react";
import { useState } from "react";
import { Bell, CheckCircle2, ChevronRight, QrCode, RefreshCw, ShoppingBag, Store, Send, Tag } from "lucide-react";
import StatusPill from "./StatusPill";
import { QrRecord } from "./types";
import { fmtDate } from "./helpers";
import QrRowActions from "./QrRowActions";
import ConfirmModal from "./ConfirmModal";
import { CodeVisibilityToggleButton } from "./StickerCodeComponents";
import { stickerRef, useCodesRevealed } from "../../../lib/codeVisibility";
import { apiClient, AdminSummary } from "../../../lib/apiClient";
import FxTodoList, { FxTodoItem } from "../shared/FxTodoList";
import FxTransactionsTable, { FxTableColumn } from "../shared/FxTransactionsTable";
import FxKpiStrip from "../shared/FxKpiStrip";
import { ActivityDropdown } from "../../ui/activity-dropdown";
import type { ActivityItem } from "../../ui/activity-dropdown";

interface OverviewPageProps {
  qrList: QrRecord[];
  setQrList: React.Dispatch<React.SetStateAction<QrRecord[]>>;
  /** Exact totals + needs-attention counts from GET /api/admin/summary (null until the first response). */
  summary: AdminSummary | null;
  onRefresh: () => void;
  setPage: (p: string) => void;
  openQuickLook: (qr: QrRecord) => void;
  setToast: (msg: string | null) => void;
  openPrintSheet?: (qr: QrRecord) => void;
}

const TYPE_ICON_STYLES = [
  { bg: "var(--fx-accent)", fg: "#FFFFFF" },
  { bg: "var(--fx-canvas)", fg: "var(--fx-ink-2)" },
  { bg: "var(--fx-green-soft)", fg: "var(--fx-green)" },
  { bg: "var(--fx-amber-soft)", fg: "var(--fx-amber)" },
];

function timeAgo(dateStr?: string): string {
  if (!dateStr) return "";
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

const ownerPhoneOf = (q: QrRecord) => q.ownerPhone || q.phoneNumber || (q as any).phone;
const isActivated = (q: QrRecord) => q.status === "active" || Boolean(String(ownerPhoneOf(q) || "").trim());

/** Rows that need a human today — each one jumps to the page where it gets handled. */
function AttentionCard({ summary, setPage }: { summary: AdminSummary | null; setPage: (p: string) => void }) {
  const a = summary?.attention;
  const rows = [
    { id: "alerts", label: "Open alerts", count: a?.unresolvedAlerts, icon: Bell, hot: true },
    { id: "orders", label: "Orders to ship", count: a?.ordersToShip, icon: ShoppingBag },
    { id: "distributors", label: "Partner requests", count: a?.pendingPartners, icon: Store },
    { id: "messages", label: "Failed sends · 24h", count: a?.failedMessages24h, icon: Send, hot: true },
  ];
  const open = rows.reduce((sum, r) => sum + (r.count || 0), 0);

  return (
    <div className="fx-card p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-[15px] font-bold text-[var(--fx-ink)]">Needs attention</h3>
        {summary && open === 0 && (
          <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-[var(--fx-green)]">
            <CheckCircle2 size={14} /> All clear
          </span>
        )}
      </div>
      <ul className="divide-y divide-[var(--fx-border)]">
        {rows.map((r) => {
          const Icon = r.icon;
          const count = r.count ?? 0;
          const live = count > 0;
          return (
            <li key={r.id}>
              <button
                type="button"
                onClick={() => setPage(r.id)}
                className="w-full flex items-center gap-3 h-11 text-left cursor-pointer group"
              >
                <span
                  className={`w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 ${
                    live && r.hot ? "bg-[var(--fx-red-soft)] text-[var(--fx-red)]" : live ? "bg-[var(--fx-amber-soft)] text-[var(--fx-amber)]" : "bg-[var(--fx-canvas)] text-[var(--fx-faint)]"
                  }`}
                >
                  <Icon size={14} />
                </span>
                <span className={`flex-1 text-[13.5px] ${live ? "font-semibold text-[var(--fx-ink)]" : "text-[var(--fx-ink-2)]"}`}>{r.label}</span>
                {summary ? (
                  <span className={`text-[14px] font-semibold tabular-nums ${live ? "text-[var(--fx-ink)]" : "text-[var(--fx-faint)]"}`}>{count}</span>
                ) : (
                  <span className="w-5 h-3.5 rounded bg-[var(--fx-canvas)] animate-pulse" aria-hidden="true" />
                )}
                <ChevronRight size={14} className="text-[var(--fx-faint)] group-hover:text-[var(--fx-ink)] transition-colors" />
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default function OverviewPage({
  qrList,
  setQrList,
  summary,
  onRefresh,
  setPage,
  openQuickLook,
  setToast,
  openPrintSheet,
}: OverviewPageProps) {
  const [deleteTarget, setDeleteTarget] = useState<QrRecord | null>(null);
  const [tableSearch, setTableSearch] = useState("");
  const [spinning, setSpinning] = useState(false);
  const [codesRevealed, setCodesRevealed] = useCodesRevealed();
  const refOf = (q: QrRecord) => stickerRef(q, codesRevealed, `${(q.category || "car").charAt(0).toUpperCase()}${(q.category || "car").slice(1)} tag`);

  // KPIs come from the database totals, not from the fleet list — that list is
  // capped (500 rows), so counting it would under-report a larger fleet. Until the
  // first summary lands, fall back to whatever list is already loaded.
  const activeInList = qrList.filter(isActivated).length;
  const waiting = !summary && qrList.length === 0;
  const total = summary?.tags.total ?? qrList.length;
  const active = summary?.tags.active ?? activeInList;
  const pending = summary?.tags.inactive ?? qrList.length - activeInList;
  const scans = summary?.tags.scans ?? qrList.reduce((sum, q) => sum + (q.scans || 0), 0);
  const show = (n: number) => (waiting ? "—" : n.toLocaleString("en-IN"));
  const activePct = total > 0 ? Math.round((active / total) * 100) : 0;

  const typeCounts = qrList.reduce((acc, q) => {
    const cat = (q.category || "car").toLowerCase();
    const row = (acc[cat] ||= { count: 0, activated: 0 });
    row.count += 1;
    if (isActivated(q)) row.activated += 1;
    return acc;
  }, {} as Record<string, { count: number; activated: number }>);

  const typeItems: FxTodoItem[] = Object.entries(typeCounts)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 5)
    .map(([cat, { count, activated }], i) => ({
      id: cat,
      icon: <Tag size={14} style={{ color: TYPE_ICON_STYLES[i % TYPE_ICON_STYLES.length].fg }} />,
      iconBg: TYPE_ICON_STYLES[i % TYPE_ICON_STYLES.length].bg,
      title: cat.charAt(0).toUpperCase() + cat.slice(1),
      subtitle: `${count} tag${count === 1 ? "" : "s"}`,
      percent: count ? Math.round((activated / count) * 100) : 0,
    }));

  const activityItems: ActivityItem[] = [...qrList]
    .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
    .slice(0, 5)
    .map((q) => {
      const phone = ownerPhoneOf(q);
      const activated = isActivated(q);
      return {
        id: q.id,
        icon: activated ? <CheckCircle2 size={16} /> : <QrCode size={16} />,
        title: `${refOf(q)} ${activated ? "activated" : "created"}`,
        description: phone ? `Assigned to ${phone}` : `${q.category || "car"} · Unassigned`,
        time: timeAgo(q.createdAt),
      };
    });

  const tableRows = qrList
    .filter((q) => {
      const needle = tableSearch.trim().toLowerCase();
      return !needle || q.id.toLowerCase().includes(needle) || (q.vehicleNumber || "").toLowerCase().includes(needle);
    })
    .slice(0, 8);

  const tableColumns: FxTableColumn<QrRecord>[] = [
    {
      key: "id",
      label: codesRevealed ? "Tag ID" : "Tag",
      render: (q) => (
        <div className="flex items-center gap-2.5">
          <span className="w-8 h-8 rounded-full bg-[var(--fx-accent-soft)] text-[var(--fx-accent-ink)] flex items-center justify-center text-[10.5px] font-bold flex-shrink-0">
            {refOf(q).slice(0, 2).toUpperCase()}
          </span>
          <span className="fx-display text-[13.5px] text-[var(--fx-ink)]">{refOf(q)}</span>
        </div>
      ),
    },
    {
      key: "phone",
      label: "Owner",
      render: (q) => {
        const phone = ownerPhoneOf(q);
        return phone ? (
          <span className="font-semibold text-[var(--fx-ink)] text-xs">{phone}</span>
        ) : (
          <span className="text-[var(--fx-faint)] text-xs">—</span>
        );
      },
    },
    { key: "category", label: "Type", render: (q) => <span className="capitalize text-xs font-medium text-[var(--fx-ink-2)]">{q.category || "car"}</span> },
    { key: "date", label: "Added", render: (q) => <span className="text-[11px] text-[var(--fx-faint)]">{fmtDate(q.createdAt)}</span> },
    {
      key: "status",
      label: "Status",
      render: (q) => <StatusPill status={isActivated(q) ? "active" : q.status} />,
    },
    {
      key: "actions",
      label: "",
      align: "right",
      render: (q) => (
        <QrRowActions qr={q} openQuickLook={openQuickLook} setDeleteTarget={setDeleteTarget} openPrintSheet={openPrintSheet} />
      ),
    },
  ];

  const handleRefresh = () => {
    setSpinning(true);
    onRefresh();
    setTimeout(() => setSpinning(false), 800);
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 pb-16 space-y-6">
      {/* ── Page header ─────────────────────────────── */}
      <div className="flex items-center gap-3">
        <h1 className="fx-text-heading-page text-[var(--fx-ink)]">Overview</h1>
        <div className="flex-1" />
        <CodeVisibilityToggleButton isRevealed={codesRevealed} onToggleVisibility={() => setCodesRevealed(!codesRevealed)} />
        <button
          type="button"
          onClick={handleRefresh}
          aria-label="Refresh"
          title="Refresh"
          className="w-9 h-9 flex-shrink-0 rounded-[var(--fx-radius-control)] border border-[var(--fx-border)] bg-[var(--fx-surface)] flex items-center justify-center text-[var(--fx-ink-2)] hover:text-[var(--fx-ink)] hover:border-[var(--fx-accent)]/40 transition-colors cursor-pointer"
        >
          <RefreshCw size={15} className={spinning ? "fx-spin" : ""} />
        </button>
      </div>

      {/* ── KPIs: absolute values, one-word labels, status as a badge ── */}
      <FxKpiStrip
        cards={[
          { key: "total", label: "Tags", value: show(total) },
          { key: "active", label: "Active", value: show(active), tone: "green", badge: waiting ? undefined : { text: `${activePct}%`, tone: "green" } },
          { key: "pending", label: "Pending", value: show(pending), tone: pending > 0 ? "amber" : "neutral" },
          { key: "scans", label: "Scans", value: show(scans) },
        ]}
      />

      {/* ── Main split: content + right rail ─────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-6">
          <FxTransactionsTable
            title="Recent tags"
            columns={tableColumns}
            rows={tableRows}
            searchValue={tableSearch}
            onSearchChange={setTableSearch}
            onViewAll={() => setPage("qr")}
            emptyLabel="No tags yet"
          />
          {typeItems.length > 0 && <FxTodoList title="By type" items={typeItems} onViewAll={() => setPage("qr")} emptyLabel="No tags yet" />}
        </div>

        <div className="lg:col-span-4 space-y-6">
          <AttentionCard summary={summary} setPage={setPage} />

          <ActivityDropdown
            title="Recent activity"
            icon={<Bell className="h-5 w-5" />}
            items={activityItems}
            emptyText="No activity yet"
            action={{ label: "View all", onClick: () => setPage("qr") }}
            defaultOpen
          />
        </div>
      </div>

      {/* Delete confirmation modal */}
      <ConfirmModal
        isOpen={deleteTarget !== null}
        title="Delete QR Sticker?"
        message={
          <>
            Are you sure you want to delete <span className="font-bold text-[var(--fx-ink)]">{deleteTarget?.id}</span>?
            This cannot be undone.
          </>
        }
        onConfirm={async () => {
          if (deleteTarget) {
            const targetId = deleteTarget.id;
            setDeleteTarget(null);
            try {
              const res = await apiClient.qr.deleteQrCode(targetId);
              if (!res?.success) throw new Error('Delete request did not succeed');
            } catch (err: any) {
              // A 404 here means the sticker is already gone (e.g. a prior click's
              // response never reached the UI) — that's the outcome we wanted, so
              // reflect it in the list instead of showing a scary false failure.
              if (err?.status === 404) {
                setQrList((prev) => prev.filter((x) => x.id !== targetId));
                setToast("QR sticker was already removed");
                setTimeout(() => setToast(null), 1500);
                onRefresh();
                return;
              }
              setToast(err?.message || `Failed to delete ${targetId} — please try again.`);
              setTimeout(() => setToast(null), 3000);
              return;
            }
            setQrList((prev) => prev.filter((x) => x.id !== targetId));
            setToast("QR sticker removed from database");
            setTimeout(() => setToast(null), 1500);
            onRefresh();
          }
        }}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}

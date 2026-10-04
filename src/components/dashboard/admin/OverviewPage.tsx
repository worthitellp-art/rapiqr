import type React from "react";
import { useState } from "react";
import { Tag, Plus, Layers, ScanLine, Boxes } from "lucide-react";
import StatusPill from "./StatusPill";
import { QrRecord, Template } from "./types";
import { fmtDate } from "./helpers";
import QrRowActions from "./QrRowActions";
import ConfirmModal from "./ConfirmModal";
import { CodeVisibilityToggleButton } from "./StickerCodeComponents";
import { stickerRef, useCodesRevealed } from "../../../lib/codeVisibility";
import { apiClient } from "../../../lib/apiClient";
import FxAssetCard, { FxAssetTile } from "../shared/FxAssetCard";
import FxTodoList, { FxTodoItem } from "../shared/FxTodoList";
import FxStatTile from "../shared/FxStatTile";
import FxCalendarWidget from "../shared/FxCalendarWidget";
import { ActivityDropdown } from "../../ui/activity-dropdown";
import type { ActivityItem } from "../../ui/activity-dropdown";
import FxTransactionsTable, { FxTableColumn } from "../shared/FxTransactionsTable";
import { FxAvatarTrigger, FxIconButton } from "../shared/FxTopBar";
import FxKpiStrip from "../shared/FxKpiStrip";
import { Bell, CheckCircle2, QrCode } from "lucide-react";

interface OverviewPageProps {
  qrList: QrRecord[];
  setQrList: React.Dispatch<React.SetStateAction<QrRecord[]>>;
  templates: Template[];
  setPage: (p: string) => void;
  openQuickLook: (qr: QrRecord) => void;
  openRestore: () => void;
  setToast: (msg: string | null) => void;
  openPrintSheet?: (qr: QrRecord) => void;
  admin?: { name: string; role?: string };
}

const TILE_STYLES = [
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
  if (hrs < 24) return `${hrs}hrs ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function OverviewPage({
  qrList,
  setQrList,
  templates,
  setPage,
  openQuickLook,
  openRestore: _openRestore,
  setToast,
  openPrintSheet,
  admin,
}: OverviewPageProps) {
  const [deleteTarget, setDeleteTarget] = useState<QrRecord | null>(null);
  const [tableSearch, setTableSearch] = useState("");
  const [codesRevealed, setCodesRevealed] = useCodesRevealed();
  const refOf = (q: QrRecord) => stickerRef(q, codesRevealed, `${(q.category || "car").charAt(0).toUpperCase()}${(q.category || "car").slice(1)} tag`);

  // Exact Real Data Calculations (No Mock Data / Fallbacks)
  const activeTags = qrList.filter((q) => q.status === "active" || Boolean((q.ownerPhone || (q as any).phone)?.trim()));
  const totalScans = qrList.reduce((sum, q) => sum + (q.scans || 0), 0);
  const inactiveCount = qrList.length - activeTags.length;

  const categoriesMap = qrList.reduce((acc, q) => {
    const cat = (q.category || "car").toLowerCase();
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const categoryList = Object.entries(categoriesMap).sort((a, b) => b[1] - a[1]);

  const categoryBreakdown = categoryList.map(([cat, count]) => {
    const activeInCat = qrList.filter((q) => {
      const phone = q.ownerPhone || q.phoneNumber || (q as any).phone;
      return (q.category || "car").toLowerCase() === cat && Boolean(phone && String(phone).trim());
    }).length;
    return { cat, count, activePct: count ? Math.round((activeInCat / count) * 100) : 0 };
  });

  const assetTiles: FxAssetTile[] = categoryBreakdown.slice(0, 4).map(({ cat, count }, i) => ({
    icon: <Tag size={15} />,
    count: `${count} Tags`,
    name: cat.charAt(0).toUpperCase() + cat.slice(1),
    bg: TILE_STYLES[i % TILE_STYLES.length].bg,
    fg: TILE_STYLES[i % TILE_STYLES.length].fg,
    onClick: () => setPage("qr"),
  }));

  const todoItems: FxTodoItem[] = categoryBreakdown.slice(0, 4).map(({ cat, count, activePct }, i) => ({
    id: cat,
    icon: <Tag size={14} />,
    iconBg: TILE_STYLES[i % TILE_STYLES.length].bg,
    title: cat.charAt(0).toUpperCase() + cat.slice(1),
    subtitle: `${count} tag${count === 1 ? "" : "s"} in fleet`,
    percent: activePct,
  }));

  const activityItems: ActivityItem[] = [...qrList]
    .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
    .slice(0, 5)
    .map((q) => {
      const phone = q.ownerPhone || q.phoneNumber || (q as any).phone;
      const isActivated = Boolean(phone && String(phone).trim());
      return {
        id: q.id,
        icon: isActivated ? <CheckCircle2 size={16} /> : <QrCode size={16} />,
        title: `${refOf(q)} ${isActivated ? "activated" : "created"}`,
        description: isActivated ? `Assigned to ${phone}` : `${q.category || "car"} · Unassigned`,
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
      label: codesRevealed ? "Tag ID" : "Vehicle",
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
      label: "Owner Phone",
      render: (q) => {
        const phone = q.ownerPhone || q.phoneNumber || (q as any).phone;
        return phone ? (
          <span className="font-semibold text-[var(--fx-ink)] text-xs">{phone}</span>
        ) : (
          <span className="text-[var(--fx-faint)] text-xs">—</span>
        );
      },
    },
    { key: "category", label: "Type", render: (q) => <span className="capitalize text-xs font-medium text-[var(--fx-ink-2)]">{q.category || "car"}</span> },
    { key: "date", label: "Date", render: (q) => <span className="text-[11px] text-[var(--fx-faint)]">{fmtDate(q.createdAt)}</span> },
    {
      key: "status",
      label: "Status",
      render: (q) => {
        const phone = q.ownerPhone || q.phoneNumber || (q as any).phone;
        const computedStatus = Boolean(phone && String(phone).trim()) ? "active" : q.status;
        return <StatusPill status={computedStatus} />;
      },
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

  return (
    <div className="px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 pb-16 space-y-6">
      {/* ── Page header ─────────────────────────────── */}
      <div className="flex items-center gap-3">
        <h1 className="fx-text-heading-page text-[var(--fx-ink)]">Overview</h1>
        <div className="flex-1" />
        <CodeVisibilityToggleButton isRevealed={codesRevealed} onToggleVisibility={() => setCodesRevealed(!codesRevealed)} />
        <FxIconButton icon={<Bell size={15} />} onClick={() => setPage("alerts")} title="Alerts" badge={inactiveCount > 0} />
        <FxAvatarTrigger name={admin?.name || "Admin"} role={admin?.role} />
        <button onClick={() => setPage("qr")} className="fx-btn fx-btn-primary">
          <Plus size={15} /> Generate Tags
        </button>
      </div>

      {/* ── KPI strip ─────────────────────────────────── */}
      <FxKpiStrip
        cards={[
          { key: "total", label: "Total Registered Tags", value: qrList.length },
          {
            key: "active",
            label: "Active Fleet Tags",
            value: activeTags.length,
            tone: "green",
          },
          { key: "scans", label: "Total Fleet Scans", value: totalScans, tone: "amber" },
        ]}
      />

      {/* ── Main split: content + right rail ─────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Content column */}
        <div className="lg:col-span-8 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <FxAssetCard
              title="My Asset"
              total={qrList.length}
              totalDelta={`+${activeTags.length} active`}
              tiles={assetTiles}
            />
            <FxTodoList title="To-do List" items={todoItems} onViewAll={() => setPage("qr")} />
          </div>

          <FxTransactionsTable
            title="Transactions"
            columns={tableColumns}
            rows={tableRows}
            searchValue={tableSearch}
            onSearchChange={setTableSearch}
            onViewAll={() => setPage("qr")}
            emptyLabel="No fleet tags generated yet."
          />
        </div>

        {/* Right rail */}
        <div className="lg:col-span-4 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <FxStatTile icon={<Boxes size={14} />} label="Total Tags" value={qrList.length} color="blue" progress={100} />
            <FxStatTile icon={<ScanLine size={14} />} label="Total Scans" value={totalScans} color="orange" progress={Math.min(100, totalScans)} />
            <FxStatTile
              icon={<Layers size={14} />}
              label="Categories"
              value={categoryList.length}
              color="purple"
              progress={Math.min(100, categoryList.length * 20)}
            />
            <FxStatTile
              icon={<Tag size={14} />}
              label="Templates"
              value={templates.length}
              color="cream"
              progress={Math.min(100, templates.length * 20)}
            />
          </div>

          <FxCalendarWidget />

          <ActivityDropdown
            title="Activity Log"
            subtitle={`${activityItems.length} recent tag event${activityItems.length === 1 ? "" : "s"}`}
            icon={<Bell className="h-5 w-5" />}
            items={activityItems}
            emptyText="No recent activity."
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
                return;
              }
              setToast(err?.message || `Failed to delete ${targetId} — please try again.`);
              setTimeout(() => setToast(null), 3000);
              return;
            }
            setQrList((prev) => prev.filter((x) => x.id !== targetId));
            setToast("QR sticker removed from database");
            setTimeout(() => setToast(null), 1500);
          }
        }}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}

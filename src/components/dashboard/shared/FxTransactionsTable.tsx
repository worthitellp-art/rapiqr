import type React from "react";
import { FxSearchInput } from "./FxTopBar";
import FxTable from "./FxTable";

export interface FxTableColumn<T> {
  key: string;
  label: string;
  align?: "left" | "right";
  render: (row: T) => React.ReactNode;
}

/** The "Transactions" table — search bar + header + rows, matching the
 * reference's transactions card shell. Column content/data stays fully
 * caller-defined so it can host QR fleet rows, orders, or products. */
export default function FxTransactionsTable<T extends { id: string }>({
  title = "Transactions",
  columns,
  rows,
  searchValue,
  onSearchChange,
  onViewAll,
  emptyLabel = "Nothing to show yet.",
}: {
  title?: string;
  columns: FxTableColumn<T>[];
  rows: T[];
  searchValue?: string;
  onSearchChange?: (v: string) => void;
  onViewAll?: () => void;
  emptyLabel?: string;
}) {
  return (
    <div className="fx-card p-6 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h3 className="text-[15px] font-bold text-[var(--fx-ink)]">{title}</h3>
        <div className="flex items-center gap-2">
          {onSearchChange && (
            <FxSearchInput value={searchValue || ""} onChange={onSearchChange} placeholder={`Search ${title.toLowerCase()}...`} className="w-[200px]" />
          )}
          {onViewAll && (
            <button onClick={onViewAll} className="text-[12.5px] font-semibold text-[var(--fx-accent)] hover:underline cursor-pointer whitespace-nowrap">
              View All
            </button>
          )}
        </div>
      </div>

      <FxTable
        columns={columns.map((c) => ({ key: c.key, header: c.label, render: c.render, align: c.align }))}
        rows={rows}
        rowKey={(row) => row.id}
        emptyState={emptyLabel}
      />
    </div>
  );
}

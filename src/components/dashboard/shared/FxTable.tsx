import type React from "react";

export interface FxTableColumn<T> {
  key: string;
  header: React.ReactNode;
  render: (row: T) => React.ReactNode;
  align?: "left" | "right";
  width?: string;
}

/**
 * Bare list/table primitive — columns + rows in, a `.fx-table` out. No title,
 * search, or "View All" chrome of its own (unlike `FxTransactionsTable`,
 * which wraps this for the Overview card context); pages that already have
 * their own header/search UI (Users, Orders, Distributors, QR Codes) drop
 * this straight in place of a hand-rolled `<table>`.
 */
export default function FxTable<T>({
  columns,
  rows,
  rowKey,
  onRowClick,
  emptyState,
  dense = false,
}: {
  columns: FxTableColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string | number;
  onRowClick?: (row: T) => void;
  emptyState?: React.ReactNode;
  dense?: boolean;
}) {
  return (
    <div className="overflow-x-auto">
      <table className={`fx-table ${dense ? "fx-table-dense" : ""}`}>
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.key} className={`fx-th ${c.align === "right" ? "text-right" : ""}`} style={{ width: c.width }}>
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="fx-td text-center text-[var(--fx-faint)]">
                {emptyState || "Nothing to show yet."}
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr
                key={rowKey(row)}
                className={`fx-tr ${onRowClick ? "cursor-pointer" : ""}`}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
              >
                {columns.map((c) => (
                  <td key={c.key} className={`fx-td ${c.align === "right" ? "text-right" : ""}`}>
                    {c.render(row)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

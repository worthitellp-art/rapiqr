export default function StatusPill({ status }: { status: string }) {
  const active = status === "active" || status === "resolved";
  const isUnread = status === "unread" || status === "pending";
  return (
    <span
      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold tracking-wide"
      style={{
        background: active ? "rgba(15,118,110,0.12)" : isUnread ? "rgba(220,38,38,0.12)" : "rgba(107,114,128,0.12)",
        color: active ? "#0f766e" : isUnread ? "#b91c1c" : "#374151",
      }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: active ? "#0f766e" : isUnread ? "#dc2626" : "#6b7280" }} />
      {status.toUpperCase()}
    </span>
  );
}

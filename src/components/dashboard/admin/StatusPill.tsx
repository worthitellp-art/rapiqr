export default function StatusPill({ status }: { status: string }) {
  const active = status === "active" || status === "resolved";
  const isUnread = status === "unread" || status === "pending";
  return (
    <span
      className="ac-pill"
      style={{
        background: active ? "#F0FDF4" : isUnread ? "#FEF2F2" : "#F4F4F5",
        color: active ? "#16A34A" : isUnread ? "#DC2626" : "#71717A",
      }}
    >
      <span className="ac-pill-dot" style={{ background: active ? "#22C55E" : isUnread ? "#EF4444" : "#A1A1AA" }} />
      <span className="capitalize">{status}</span>
    </span>
  );
}
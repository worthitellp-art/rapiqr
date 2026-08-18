export default function StatusPill({ status }: { status: string }) {
  const active = status === "active" || status === "resolved";
  const isUnread = status === "unread" || status === "pending";
  return (
    <span
      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-[4px] text-[11px] font-semibold tracking-normal capitalize"
      style={{
        background: active ? "#E9F9EF" : isUnread ? "#FDEAEA" : "#F1F1F2",
        color: active ? "#2E9E5B" : isUnread ? "#DC2626" : "#777B80",
      }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: active ? "#4FC47A" : isUnread ? "#DC2626" : "#9CA0A6" }} />
      {status}
    </span>
  );
}

import { FxBadge } from "../shared";

export default function StatusPill({ status }: { status: string }) {
  const normalized = (status || "").toLowerCase();
  const isSuccess = normalized === "active" || normalized === "resolved" || normalized === "success" || normalized === "approved";
  const isPending = normalized === "pending" || normalized === "unread" || normalized === "processing";
  const isFailed = normalized === "failed" || normalized === "rejected" || normalized === "error" || normalized === "inactive";

  const tone = isSuccess ? "success" : isPending ? "pending" : isFailed ? "danger" : "neutral";

  return (
    <FxBadge tone={tone} dot>
      <span className="capitalize font-semibold">{status}</span>
    </FxBadge>
  );
}

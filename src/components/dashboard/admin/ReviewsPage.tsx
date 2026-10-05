import type React from "react";
import { useState, useMemo, useEffect } from "react";
import {
  Star,
  Search,
  MessageSquare,
  Sparkles,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  X,
  Filter,
  Download,
  Loader2,
  Check,
  CornerDownRight,
  ShieldCheck,
  Flag,
} from "lucide-react";
import { useLocalStorage } from "./useLocalStorage";

export interface ReviewItem {
  id: string;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  rating: number; // 1 - 5
  reviewText: string;
  productName: string;
  createdAt: string;
  status: "published" | "flagged" | "pending";
  reply?: {
    text: string;
    repliedAt: string;
    isAiGenerated: boolean;
  };
}

const SEED_REVIEWS: ReviewItem[] = [
  {
    id: "rev-101",
    customerName: "Aarav Sharma",
    customerPhone: "+91 98201 44321",
    rating: 5,
    reviewText: "The metallic matte QR sticker looks premium on my car window. Tested the scan with a stranger's phone and it connected to my call instantly without exposing my number!",
    productName: "Car QR Sticker — Matte Metallic",
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    status: "published",
    reply: {
      text: "Thank you Aarav! We engineered the masked helpline call bridge specifically for instant privacy.",
      repliedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
      isAiGenerated: false,
    },
  },
  {
    id: "rev-102",
    customerName: "Pooja Patel",
    customerPhone: "+91 98765 21098",
    rating: 5,
    reviewText: "Saved my car from being towed! A neighbour scanned the sticker when someone blocked the driveway and we sorted it out in two minutes. Absolutely worth it.",
    productName: "Car QR Sticker — Premium Vinyl",
    createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    status: "published",
    reply: {
      text: "So happy to hear that Pooja! Preventing towing and parking disputes is our #1 goal.",
      repliedAt: new Date(Date.now() - 86400000 * 1 + 3600000).toISOString(),
      isAiGenerated: true,
    },
  },
  {
    id: "rev-103",
    customerName: "Rohan Verma",
    customerPhone: "+91 99100 88765",
    rating: 4,
    reviewText: "Great quality print and very adhesive. Weather-proof in heavy monsoon rain so far. Wish there were more neon color choices for sport bikes.",
    productName: "Bike QR Sticker — Shield Vinyl",
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    status: "published",
  },
  {
    id: "rev-104",
    customerName: "Vikram Malhotra",
    customerPhone: "+91 98450 11223",
    rating: 2,
    reviewText: "The sticker is good, but the courier took 5 days to reach Bengaluru. Please speed up delivery partner shipping times.",
    productName: "Car QR Sticker — Standard",
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    status: "flagged",
    reply: {
      text: "Apologies for the delay Vikram. We have partnered with Shiprocket Air express to cut delivery times down to 48 hours.",
      repliedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      isAiGenerated: false,
    },
  },
  {
    id: "rev-105",
    customerName: "Neha Kulkarni",
    customerPhone: "+91 97654 33211",
    rating: 5,
    reviewText: "Super easy onboarding! Just scanned the QR code with my phone camera and entered OTP to activate. Family emergency contacts feature is wonderful.",
    productName: "Pet Tag QR — Stainless Steel",
    createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
    status: "published",
  },
  {
    id: "rev-106",
    customerName: "Siddharth Nair",
    customerPhone: "+91 98111 22334",
    rating: 1,
    reviewText: "Scratched the sticker while peeling the protective layer. Need a replacement sheet.",
    productName: "Car QR Sticker — Ultra Gloss",
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    status: "pending",
  },
];

interface ReviewsPageProps {
  setToast: (msg: string | null) => void;
}

export default function ReviewsPage({ setToast }: ReviewsPageProps) {
  const [reviews, setReviews] = useLocalStorage<ReviewItem[]>("repiqr-customer-reviews-v1", SEED_REVIEWS);

  // Filter state
  const [searchText, setSearchText] = useState("");
  const [ratingFilter, setRatingFilter] = useState<number | "all">("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [replyFilter, setReplyFilter] = useState<"all" | "replied" | "unreplied">("all");
  const [activeTab, setActiveTab] = useState<"all" | "needs-reply" | "5-star" | "flagged">("all");

  // Pagination
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 8;

  // Modals / Drawer State
  const [replyModalTarget, setReplyModalTarget] = useState<ReviewItem | null>(null);
  const [replyText, setReplyText] = useState("");
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ReviewItem | null>(null);

  // Metrics
  const metrics = useMemo(() => {
    let needsReply = 0;
    let fiveStar = 0;
    let flagged = 0;

    reviews.forEach((r) => {
      if (!r.reply) needsReply += 1;
      if (r.rating === 5) fiveStar += 1;
      if (r.status === "flagged") flagged += 1;
    });

    return {
      total: reviews.length,
      needsReply,
      fiveStar,
      flagged,
    };
  }, [reviews]);

  const handleTabChange = (tab: typeof activeTab) => {
    setActiveTab(tab);
    setPage(1);
  };

  const handleClearFilters = () => {
    setSearchText("");
    setRatingFilter("all");
    setStatusFilter("all");
    setReplyFilter("all");
    setActiveTab("all");
    setPage(1);
  };

  const hasActiveFilters =
    searchText.trim() !== "" ||
    ratingFilter !== "all" ||
    statusFilter !== "all" ||
    replyFilter !== "all" ||
    activeTab !== "all";

  // Filtered Reviews
  const filtered = useMemo(() => {
    let result = reviews;

    // Tab Filter
    if (activeTab === "needs-reply") {
      result = result.filter((r) => !r.reply);
    } else if (activeTab === "5-star") {
      result = result.filter((r) => r.rating === 5);
    } else if (activeTab === "flagged") {
      result = result.filter((r) => r.status === "flagged");
    }

    // Rating Filter
    if (ratingFilter !== "all") {
      result = result.filter((r) => r.rating === ratingFilter);
    }

    // Status Filter
    if (statusFilter !== "all") {
      result = result.filter((r) => r.status === statusFilter);
    }

    // Reply Filter
    if (replyFilter === "replied") {
      result = result.filter((r) => Boolean(r.reply));
    } else if (replyFilter === "unreplied") {
      result = result.filter((r) => !r.reply);
    }

    // Search
    if (searchText.trim()) {
      const q = searchText.toLowerCase().trim();
      result = result.filter(
        (r) =>
          r.customerName.toLowerCase().includes(q) ||
          r.productName.toLowerCase().includes(q) ||
          r.reviewText.toLowerCase().includes(q) ||
          (r.reply?.text || "").toLowerCase().includes(q)
      );
    }

    return result;
  }, [reviews, activeTab, ratingFilter, statusFilter, replyFilter, searchText]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = useMemo(
    () => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filtered, page, PAGE_SIZE]
  );

  // AI Reply Generator logic
  const generateAiReply = (item: ReviewItem) => {
    setIsAiGenerating(true);
    setTimeout(() => {
      let drafted = "";
      if (item.rating >= 4) {
        drafted = `Dear ${item.customerName}, thank you so much for the fantastic ${item.rating}-star review of the ${item.productName}! We're thrilled that our privacy protection and instant QR scanning are giving you peace of mind on the road.`;
      } else if (item.rating === 3) {
        drafted = `Hi ${item.customerName}, thank you for your candid feedback on the ${item.productName}. We're continuously refining our tags and dispatch workflows, and we'd love to make this a 5-star experience for you.`;
      } else {
        drafted = `Hello ${item.customerName}, we sincerely apologize that your experience with the ${item.productName} did not meet expectations. We take this very seriously and our support team would be delighted to send you a complimentary replacement right away.`;
      }
      setReplyText(drafted);
      setIsAiGenerating(false);
    }, 600);
  };

  const handleOpenReplyModal = (item: ReviewItem) => {
    setReplyModalTarget(item);
    setReplyText(item.reply?.text || "");
  };

  const handleSaveReply = () => {
    if (!replyModalTarget || !replyText.trim()) return;

    setReviews((prev) =>
      prev.map((r) =>
        r.id === replyModalTarget.id
          ? {
              ...r,
              reply: {
                text: replyText.trim(),
                repliedAt: new Date().toISOString(),
                isAiGenerated: isAiGenerating || replyText.includes("Dear") || replyText.includes("peace of mind"),
              },
            }
          : r
      )
    );

    setReplyModalTarget(null);
    setReplyText("");
    setToast("Response published successfully.");
    setTimeout(() => setToast(null), 3000);
  };

  const handleDeleteReview = () => {
    if (!deleteTarget) return;
    setReviews((prev) => prev.filter((r) => r.id !== deleteTarget.id));
    setDeleteTarget(null);
    setToast("Review deleted permanently.");
    setTimeout(() => setToast(null), 3000);
  };

  const handleToggleStatus = (item: ReviewItem) => {
    const nextStatus = item.status === "flagged" ? "published" : "flagged";
    setReviews((prev) =>
      prev.map((r) => (r.id === item.id ? { ...r, status: nextStatus } : r))
    );
    setToast(`Review marked as ${nextStatus}.`);
    setTimeout(() => setToast(null), 2500);
  };

  const handleExportCsv = () => {
    const rows = [
      ["Review ID", "Customer", "Rating", "Product", "Review Text", "Reply", "Status", "Date"],
      ...filtered.map((r) => [
        r.id,
        r.customerName,
        `${r.rating} Stars`,
        r.productName,
        r.reviewText,
        r.reply?.text || "No reply",
        r.status,
        new Date(r.createdAt).toLocaleDateString(),
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `rapiqr-customer-reviews-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  return (
    <div className="px-6 lg:px-10 py-8 space-y-6 text-gray-900 bg-gray-50/60 min-h-screen">
      {/* ── 1. Page Header (Matching QR Codes & Reference UI) ───────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center border border-amber-200/50 shadow-2xs shrink-0">
            <Star size={22} strokeWidth={2.2} className="fill-amber-500 text-amber-500" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-gray-950">
              Customer Reviews
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 font-normal">
              Manage customer reviews, ratings and AI responses
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white border border-gray-200/80 text-gray-700 font-semibold text-xs hover:bg-gray-50 hover:text-gray-900 transition-colors shadow-2xs cursor-pointer"
          >
            <Download size={14} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* ── 2. Segmented Capsule Tabs ───────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-200/80 pb-4">
        <div className="inline-flex p-1 rounded-xl bg-gray-200/70 border border-gray-200/80 self-start">
          <button
            type="button"
            onClick={() => handleTabChange("all")}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              activeTab === "all"
                ? "bg-white text-gray-950 shadow-2xs font-bold"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            All Reviews ({metrics.total})
          </button>
          <button
            type="button"
            onClick={() => handleTabChange("needs-reply")}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              activeTab === "needs-reply"
                ? "bg-white text-gray-950 shadow-2xs font-bold"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Needs Reply ({metrics.needsReply})
          </button>
          <button
            type="button"
            onClick={() => handleTabChange("5-star")}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              activeTab === "5-star"
                ? "bg-white text-gray-950 shadow-2xs font-bold"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            5-Star ({metrics.fiveStar})
          </button>
          <button
            type="button"
            onClick={() => handleTabChange("flagged")}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              activeTab === "flagged"
                ? "bg-white text-gray-950 shadow-2xs font-bold"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Flagged ({metrics.flagged})
          </button>
        </div>
      </div>

      {/* ── 3. Unified Filter Bar ───────────────────────────────────────── */}
      <div className="p-3 bg-white border border-gray-200/80 rounded-2xl shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search reviewer, product, feedback..."
              value={searchText}
              onChange={(e) => {
                setSearchText(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-gray-200/90 bg-gray-50/50 text-gray-900 placeholder:text-gray-400 outline-none focus:bg-white focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10 transition-all"
            />
          </div>

          {/* Rating */}
          <select
            value={ratingFilter}
            onChange={(e) => {
              setRatingFilter(e.target.value === "all" ? "all" : Number(e.target.value));
              setPage(1);
            }}
            className="px-3 py-1.5 text-xs font-medium rounded-xl border border-gray-200/90 bg-white text-gray-700 outline-none hover:border-gray-300 focus:border-gray-900 cursor-pointer"
          >
            <option value="all">All Ratings</option>
            <option value="5">5 Stars ★★★★★</option>
            <option value="4">4 Stars ★★★★☆</option>
            <option value="3">3 Stars ★★★☆☆</option>
            <option value="2">2 Stars ★★☆☆☆</option>
            <option value="1">1 Star ★☆☆☆☆</option>
          </select>

          {/* Reply Status */}
          <select
            value={replyFilter}
            onChange={(e) => {
              setReplyFilter(e.target.value as any);
              setPage(1);
            }}
            className="px-3 py-1.5 text-xs font-medium rounded-xl border border-gray-200/90 bg-white text-gray-700 outline-none hover:border-gray-300 focus:border-gray-900 cursor-pointer"
          >
            <option value="all">All Reply Status</option>
            <option value="unreplied">Needs Response</option>
            <option value="replied">Responded</option>
          </select>

          {/* Moderation Status */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-1.5 text-xs font-medium rounded-xl border border-gray-200/90 bg-white text-gray-700 outline-none hover:border-gray-300 focus:border-gray-900 cursor-pointer"
          >
            <option value="all">All Moderation Status</option>
            <option value="published">Published</option>
            <option value="flagged">Flagged</option>
            <option value="pending">Pending</option>
          </select>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleClearFilters}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:text-gray-950 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <X size={13} />
              <span>Clear Filters</span>
            </button>
          )}
        </div>

        <div className="text-xs text-gray-500 font-medium whitespace-nowrap">
          Showing <span className="font-bold text-gray-900">{filtered.length}</span> reviews
        </div>
      </div>

      {/* ── 4. Reviews List / Cards (Matching Reference Style) ──────────── */}
      {filtered.length === 0 ? (
        <div className="bg-white border border-gray-200/80 rounded-2xl p-12 text-center shadow-2xs space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-400 mx-auto">
            <MessageSquare size={26} />
          </div>
          <h3 className="text-base font-bold text-gray-900">No reviews found</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            {hasActiveFilters
              ? "No customer reviews match your active filter settings."
              : "Customer reviews will appear here as soon as orders are delivered."}
          </p>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleClearFilters}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {paginated.map((item) => {
            const initials = item.customerName
              .split(" ")
              .map((w) => w[0])
              .join("")
              .slice(0, 2)
              .toUpperCase();

            return (
              <div
                key={item.id}
                className="bg-white border border-gray-200/80 rounded-2xl p-5 shadow-2xs hover:border-gray-300 transition-all space-y-3.5"
              >
                {/* Header row: Reviewer info, Star Rating, Status pill */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gray-900 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                      {initials}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-gray-950">{item.customerName}</span>
                        <span className="inline-flex items-center gap-0.5 text-[10.5px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-200/60">
                          <ShieldCheck size={11} /> Verified Buyer
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-400 font-medium">
                        Reviewed {item.productName} · {new Date(item.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-start sm:self-auto">
                    {/* Star Rating */}
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          size={14}
                          className={
                            star <= item.rating
                              ? "fill-amber-400 text-amber-400"
                              : "text-gray-200"
                          }
                        />
                      ))}
                    </div>

                    {/* Status Pill */}
                    <span
                      className={`
                        text-[11px] font-semibold px-2 py-0.5 rounded-full border
                        ${
                          item.status === "published"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200/60"
                            : item.status === "flagged"
                            ? "bg-red-50 text-red-700 border-red-200/60"
                            : "bg-gray-100 text-gray-600 border-gray-200/60"
                        }
                      `}
                    >
                      {item.status.toUpperCase()}
                    </span>
                  </div>
                </div>

                {/* Review Text */}
                <p className="text-xs text-gray-800 leading-relaxed font-normal pl-12 sm:pl-12">
                  "{item.reviewText}"
                </p>

                {/* Reply Block (if replied) */}
                {item.reply && (
                  <div className="ml-12 p-3.5 bg-gray-50/90 rounded-xl border border-gray-200/70 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="inline-flex items-center gap-1 font-semibold text-gray-700">
                        <CornerDownRight size={12} className="text-gray-400" />
                        <span>Response from RapiQR Fleet Team</span>
                        {item.reply.isAiGenerated && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] text-purple-700 bg-purple-50 px-1.5 py-0.2 rounded border border-purple-200/60">
                            <Sparkles size={9} /> AI Assisted
                          </span>
                        )}
                      </span>
                      <span className="text-gray-400">
                        {new Date(item.reply.repliedAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-xs text-gray-700 leading-relaxed font-normal">
                      {item.reply.text}
                    </p>
                  </div>
                )}

                {/* Bottom Actions Row */}
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => handleOpenReplyModal(item)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-gray-100 text-gray-800 hover:bg-gray-200/80 transition-colors cursor-pointer"
                  >
                    <MessageSquare size={13} />
                    <span>{item.reply ? "Edit Reply" : "Reply"}</span>
                  </button>

                  {!item.reply && (
                    <button
                      type="button"
                      onClick={() => {
                        handleOpenReplyModal(item);
                        generateAiReply(item);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-purple-50 text-purple-700 border border-purple-200/70 hover:bg-purple-100/70 transition-colors cursor-pointer"
                    >
                      <Sparkles size={13} />
                      <span>Generate AI Reply</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => handleToggleStatus(item)}
                    className={`p-1.5 rounded-xl border transition-colors cursor-pointer ${
                      item.status === "flagged"
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : "border-gray-200 text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                    }`}
                    title={item.status === "flagged" ? "Unflag Review" : "Flag Review"}
                  >
                    <Flag size={13} />
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeleteTarget(item)}
                    className="p-1.5 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                    title="Delete Review"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── 5. Pagination Controls ───────────────────────────────────────── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between gap-4 pt-2">
          <p className="text-xs text-gray-500">
            Showing{" "}
            <span className="font-semibold text-gray-900">
              {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)}
            </span>{" "}
            of <span className="font-semibold text-gray-900">{filtered.length}</span> reviews
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-xl border border-gray-200/80 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-40 transition-colors cursor-pointer"
            >
              <ChevronLeft size={14} />
              <span>Prev</span>
            </button>
            <span className="text-xs font-bold text-gray-700 px-2">
              {page} / {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-xl border border-gray-200/80 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-40 transition-colors cursor-pointer"
            >
              <span>Next</span>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* ── 6. Reply Modal / Drawer ──────────────────────────────────────── */}
      {replyModalTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-950/45 backdrop-blur-xs select-none"
          onClick={() => setReplyModalTarget(null)}
        >
          <div
            className="bg-white rounded-2xl border border-gray-200 shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 pt-5 pb-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center text-gray-900">
                  <MessageSquare size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-950">Reply to Review</h3>
                  <p className="text-xs text-gray-500">{replyModalTarget.customerName} · {replyModalTarget.rating} Stars</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setReplyModalTarget(null)}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Customer original review quote */}
              <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-200/70 text-xs text-gray-700 italic">
                "{replyModalTarget.reviewText}"
              </div>

              {/* Textarea */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-gray-700">Your Official Response</label>
                  <button
                    type="button"
                    onClick={() => generateAiReply(replyModalTarget)}
                    disabled={isAiGenerating}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-purple-700 hover:text-purple-900 cursor-pointer transition-colors"
                  >
                    {isAiGenerating ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <Sparkles size={12} />
                    )}
                    <span>Draft with AI</span>
                  </button>
                </div>
                <textarea
                  rows={4}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Write a courteous and helpful response..."
                  className="w-full p-3 text-xs rounded-xl border border-gray-200/90 bg-white text-gray-900 placeholder:text-gray-400 outline-none focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10 transition-all resize-none"
                />
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setReplyModalTarget(null)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 hover:text-gray-900 rounded-xl hover:bg-gray-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveReply}
                  disabled={!replyText.trim()}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-gray-900 text-white hover:bg-black disabled:opacity-40 cursor-pointer shadow-xs"
                >
                  <Check size={14} />
                  <span>Publish Response</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── 7. Delete Confirmation Modal ─────────────────────────────────── */}
      {deleteTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-950/45 backdrop-blur-xs select-none"
          onClick={() => setDeleteTarget(null)}
        >
          <div
            className="bg-white rounded-2xl border border-gray-200 shadow-2xl p-6 max-w-sm w-full space-y-4 animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shrink-0 border border-red-200/60">
                <AlertTriangle size={20} />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-gray-950">
                  Delete Review?
                </h3>
                <p className="text-xs text-gray-500 font-normal leading-relaxed">
                  Are you sure you want to permanently delete this customer review? This action cannot be undone.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 text-xs font-semibold rounded-xl border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteReview}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-red-600 text-white hover:bg-red-700 cursor-pointer shadow-xs"
              >
                <Trash2 size={13} />
                <span>Delete Permanently</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import { useState, useEffect, useCallback } from "react";
import { MessageCircle, Search } from "lucide-react";
import { apiClient, type ChatSession } from "../../../lib/apiClient";
import RepiChat from "../../chat/RepiChat";

function timeAgo(iso: string | null) {
  if (!iso) return "";
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

export default function RepiChatPage() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadSessions = useCallback(async () => {
    const res = await apiClient.chat.listOwnerSessions().catch(() => null);
    if (res?.success) setSessions(res.data);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadSessions();
    const timer = setInterval(loadSessions, 15000);
    return () => clearInterval(timer);
  }, [loadSessions]);

  const filtered = sessions.filter((s) => {
    const q = searchQuery.toLowerCase();
    return (
      s.customer_name.toLowerCase().includes(q) ||
      (s.vehicle_label || "").toLowerCase().includes(q) ||
      (s.last_message_preview || "").toLowerCase().includes(q)
    );
  });

  const selected = sessions.find((s) => s.id === selectedId) || null;
  const totalUnread = sessions.reduce((sum, s) => sum + (s.unread_owner_count || 0), 0);

  return (
    <div className="px-8 pt-7 pb-16 space-y-7 text-[#17181A] font-body" style={{ background: "#F7F7F8" }}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-[24px] font-semibold text-[#17181A] flex items-center gap-2">
            <MessageCircle className="text-[#5C78DF]" size={26} />
            RepiChat
          </h1>
          <p className="text-[13.5px] text-[#777B80] mt-1">
            Real-time conversations with visitors who scanned your stickers.
          </p>
        </div>
        {totalUnread > 0 && (
          <div className="px-3.5 py-2 rounded-[4px] bg-[#E8EDFF] border border-[#5C78DF]/20 text-[#5271D5] text-xs font-bold flex items-center gap-2">
            <span>{totalUnread} unread</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Conversation list */}
        <div className="lg:col-span-4 space-y-3">
          <div className="relative">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9CA0A6]" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-[12.5px] rounded-full border-0 bg-[#EFEFF0] text-[#17181A] placeholder-[#9CA0A6] outline-none transition-all focus:ring-2 focus:ring-[#5C78DF]/25"
            />
          </div>

          <div className="bg-white border border-[#E5E5E7] shadow-[0_1px_4px_rgba(0,0,0,0.03)] divide-y divide-[#E5E5E7] max-h-[32rem] overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center text-xs text-[#9CA0A6] font-medium">Loading…</div>
            ) : filtered.length === 0 ? (
              <div className="p-8 text-center">
                <div className="w-12 h-12 rounded-[4px] bg-[#E8EDFF] text-[#5271D5] flex items-center justify-center mx-auto mb-3">
                  <MessageCircle size={22} />
                </div>
                <p className="text-xs font-bold text-[#17181A]">No conversations yet</p>
                <p className="text-[11px] text-[#777B80] mt-1">Chats started from a sticker scan will show up here.</p>
              </div>
            ) : (
              filtered.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSelectedId(s.id)}
                  className={`w-full text-left p-3.5 flex items-start gap-3 transition-colors cursor-pointer ${
                    selectedId === s.id ? "bg-[#E8EDFF]" : "hover:bg-[#F3F3F4]"
                  }`}
                >
                  <div className="w-9 h-9 rounded-[4px] bg-[#E8EDFF] text-[#5271D5] flex items-center justify-center font-black text-xs shrink-0">
                    {s.customer_name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-bold text-[#17181A] truncate">{s.customer_name}</p>
                      <span className="text-[10px] font-mono text-[#9CA0A6] shrink-0">{timeAgo(s.last_message_at)}</span>
                    </div>
                    {s.vehicle_label && (
                      <p className="text-[10px] text-[#9CA0A6] truncate">{s.vehicle_label}</p>
                    )}
                    <p className="text-[11px] text-[#777B80] truncate mt-0.5">{s.last_message_preview || "No messages yet"}</p>
                  </div>
                  {s.unread_owner_count > 0 && (
                    <span className="ml-1 shrink-0 text-[10px] font-bold bg-[#5C78DF] text-white rounded-[4px] w-5 h-5 flex items-center justify-center">
                      {s.unread_owner_count}
                    </span>
                  )}
                </button>
              ))
            )}
          </div>
        </div>

        {/* Active thread */}
        <div className="lg:col-span-8 bg-white border border-[#E5E5E7] shadow-[0_1px_4px_rgba(0,0,0,0.03)] overflow-hidden h-[36rem]">
          {selected ? (
            <RepiChat
              key={selected.id}
              mode="owner"
              sessionId={selected.id}
              title={selected.customer_name}
              subtitle={selected.vehicle_label || undefined}
            />
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-[#9CA0A6] gap-2">
              <MessageCircle size={32} className="text-[#9CA0A6]" />
              <p className="text-xs font-medium">Select a conversation to start chatting</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from "react";
import { Terminal, RefreshCw, Trash2, Search, Filter, ShieldAlert, CheckCircle2, Info, AlertTriangle, Activity } from "lucide-react";
import { fetchServerLogsFromDb, clearServerLogsInDb } from "../../../lib/supabaseService";

interface LogItem {
  id: string;
  timestamp: string;
  level: string;
  category?: string;
  service?: string;
  tag: string;
  event?: string;
  message: string;
  details?: any;
  metadata?: any;
  method?: string;
  url?: string;
  status_code?: number;
  duration_ms?: number;
  origin?: string;
  ip?: string;
  request_id?: string;
  user_id?: string;
  resource_id?: string;
  status?: string;
  created_at: string;
}

export default function LiveLogsPage({ setToast }: { setToast: (msg: string) => void }) {
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [filterLevel, setFilterLevel] = useState("ALL");
  const [filterCategory, setFilterCategory] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLog, setSelectedLog] = useState<LogItem | null>(null);

  const fetchLogs = async () => {
    try {
      const data = await fetchServerLogsFromDb(150, filterLevel, filterCategory);
      setLogs(data || []);
    } catch (err) {
      console.error("Failed to load live server logs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    if (!autoRefresh) return;
    const interval = setInterval(fetchLogs, 3000);
    return () => clearInterval(interval);
  }, [autoRefresh, filterLevel, filterCategory]);

  const handleClearLogs = async () => {
    if (!window.confirm("Are you sure you want to clear all server logs from Supabase?")) return;
    const ok = await clearServerLogsInDb();
    if (ok) {
      setLogs([]);
      setToast("Server logs cleared successfully");
    } else {
      setToast("Failed to clear logs");
    }
  };

  const filteredLogs = logs.filter((log) => {
    if (filterLevel !== "ALL" && log.level?.toUpperCase() !== filterLevel.toUpperCase()) return false;
    if (filterCategory !== "ALL" && log.category?.toUpperCase() !== filterCategory.toUpperCase()) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        log.tag?.toLowerCase().includes(q) ||
        log.event?.toLowerCase().includes(q) ||
        log.message?.toLowerCase().includes(q) ||
        log.url?.toLowerCase().includes(q) ||
        log.method?.toLowerCase().includes(q) ||
        log.origin?.toLowerCase().includes(q) ||
        log.request_id?.toLowerCase().includes(q) ||
        log.user_id?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const getLevelBadge = (level: string, statusCode?: number) => {
    const lev = level?.toUpperCase() || "INFO";
    if (lev === "ERROR" || (statusCode && statusCode >= 500)) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-red-100 text-red-700">
          <ShieldAlert size={12} /> {statusCode || "ERROR"}
        </span>
      );
    }
    if (lev === "WARN" || (statusCode && statusCode >= 400)) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-700">
          <AlertTriangle size={12} /> {statusCode || "WARN"}
        </span>
      );
    }
    if (lev === "SUCCESS") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-700">
          <CheckCircle2 size={12} /> OK
        </span>
      );
    }
    if (lev === "EVENT") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-purple-100 text-purple-700">
          <Activity size={12} /> EVENT
        </span>
      );
    }
    if (lev === "HTTP") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-blue-100 text-blue-700">
          <Info size={12} /> {statusCode || "HTTP"}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-700">
        <Info size={12} /> INFO
      </span>
    );
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-5">
      {/* ── Top Banner / Title Bar ────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-emerald-400">
            <Terminal size={20} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              Supabase Live Server Logs
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-600 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Feed
              </span>
            </h1>
            <p className="text-xs text-slate-5-0 mt-0.5">
              Real-time operational events, HTTP requests, and system diagnostics saved in Supabase
            </p>
          </div>
        </div>

        {/* Actions Bar */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-3 py-2 text-xs font-semibold rounded-xl border flex items-center gap-1.5 transition-all ${
              autoRefresh
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : "bg-slate-50 text-slate-600 border-slate-200"
            }`}
          >
            <RefreshCw size={14} className={autoRefresh ? "animate-spin" : ""} />
            {autoRefresh ? "Auto-Refresh ON (3s)" : "Auto-Refresh Paused"}
          </button>

          <button
            onClick={fetchLogs}
            className="p-2 text-slate-600 hover:bg-slate-100 rounded-xl border border-slate-200 transition-all"
            title="Refresh Logs Now"
          >
            <RefreshCw size={16} />
          </button>

          <button
            onClick={handleClearLogs}
            className="px-3 py-2 text-xs font-semibold rounded-xl bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition-all flex items-center gap-1.5"
          >
            <Trash2 size={14} /> Clear Logs
          </button>
        </div>
      </div>

      {/* ── Filters & Search Toolbar ──────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
        {/* Search Box */}
        <div className="relative w-full sm:w-80">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by tag, route, method, message..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 text-slate-800 placeholder-slate-400"
          />
        </div>

        {/* Level Filter Buttons */}
          <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto">
          <Filter size={14} className="text-slate-400 mr-1 hidden sm:inline" />
          {["ALL", "INFO", "SUCCESS", "EVENT", "WARN", "ERROR", "HTTP"].map((lvl) => (
            <button
              key={lvl}
              onClick={() => setFilterLevel(lvl)}
              className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-all ${
                filterLevel === lvl
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {lvl}
            </button>
          ))}
        </div>
      </div>

      {/* ── Category Filter Bar ────────────────────────────────── */}
      <div className="flex items-center gap-2 flex-wrap bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1">
          <Activity size={13} /> Category:
        </span>
        {["ALL", "HTTP", "AUTH", "USER", "BUSINESS", "DB", "EXTERNAL", "SECURITY", "ERROR", "SYSTEM"].map((cat) => (
          <button
            key={cat}
            onClick={() => setFilterCategory(cat)}
            className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-all ${
              filterCategory === cat
                ? "bg-slate-900 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* ── Live Log Console Output Table ──────────────────────── */}
      <div className="bg-slate-950 rounded-2xl border border-slate-800 shadow-xl overflow-hidden text-slate-200 font-mono text-xs">
        {/* Console Header */}
        <div className="bg-slate-900 px-4 py-2.5 border-b border-slate-800 flex items-center justify-between text-slate-400 text-[11px]">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" />
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-500 inline-block" />
            <span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block" />
            <span className="ml-2 font-sans font-semibold text-slate-300">server.log console feed</span>
          </div>
          <span>Total records: {filteredLogs.length}</span>
        </div>

        {/* Log Entries Container */}
        <div className="max-h-[580px] overflow-y-auto divide-y divide-slate-900/60 custom-scrollbar">
          {loading && logs.length === 0 ? (
            <div className="p-8 text-center text-slate-500 font-sans">
              <RefreshCw size={24} className="animate-spin mx-auto mb-2 text-emerald-400" />
              Fetching live logs from Supabase...
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="p-12 text-center text-slate-500 font-sans">
              No server log records matching your filter.
            </div>
          ) : (
            filteredLogs.map((log) => {
              const timeStr = log.created_at || log.timestamp
                ? new Date(log.created_at || log.timestamp).toLocaleTimeString([], { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" })
                : "--:--:--";

              return (
                <div
                  key={log.id}
                  onClick={() => setSelectedLog(log)}
                  className="px-4 py-2.5 hover:bg-slate-900/90 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2 cursor-pointer group"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <span className="text-slate-500 text-[11px] shrink-0">[{timeStr}]</span>
                    <div className="shrink-0">{getLevelBadge(log.level, log.status_code)}</div>
                    <span className="font-bold text-amber-400 shrink-0 text-[11px]">[{log.tag}]</span>
                    {log.category && (
                      <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 shrink-0 text-[10px]">
                        {log.category}
                      </span>
                    )}
                    {log.event && (
                      <span className="text-purple-400 font-semibold shrink-0 text-[11px]">{log.event}</span>
                    )}
                    <span className="text-slate-200 truncate group-hover:text-white transition-colors">
                      {log.message}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-[11px] text-slate-400 shrink-0 ml-auto">
                    {log.duration_ms !== undefined && log.duration_ms !== null && (
                      <span className="text-emerald-400 font-semibold">{log.duration_ms}ms</span>
                    )}
                    {log.status && log.status !== log.status_code && (
                      <span className="text-slate-500">{log.status}</span>
                    )}
                    {log.origin && log.origin !== "Direct API" && (
                      <span className="text-slate-500 max-w-[140px] truncate">{log.origin}</span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ── Log Details Modal ─────────────────────────────────── */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <Terminal size={18} className="text-slate-700" />
                Log Entry Details
              </h3>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-slate-400 hover:text-slate-700 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 text-xs text-slate-700">
              <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <div><span className="font-semibold text-slate-500">ID:</span> {selectedLog.id}</div>
                <div><span className="font-semibold text-slate-500">Timestamp:</span> {selectedLog.timestamp || selectedLog.created_at}</div>
                <div><span className="font-semibold text-slate-500">Tag:</span> {selectedLog.tag}</div>
                <div><span className="font-semibold text-slate-500">Level:</span> {selectedLog.level}</div>
                {selectedLog.category && <div><span className="font-semibold text-slate-500">Category:</span> {selectedLog.category}</div>}
                {selectedLog.event && <div><span className="font-semibold text-slate-500">Event:</span> {selectedLog.event}</div>}
                {selectedLog.service && <div><span className="font-semibold text-slate-500">Service:</span> {selectedLog.service}</div>}
                {selectedLog.status && <div><span className="font-semibold text-slate-500">Status:</span> {selectedLog.status}</div>}
                {selectedLog.method && <div><span className="font-semibold text-slate-500">Method:</span> {selectedLog.method}</div>}
                {selectedLog.url && <div><span className="font-semibold text-slate-500">URL:</span> {selectedLog.url}</div>}
                {selectedLog.status_code && <div><span className="font-semibold text-slate-500">Status Code:</span> {selectedLog.status_code}</div>}
                {selectedLog.duration_ms && <div><span className="font-semibold text-slate-500">Duration:</span> {selectedLog.duration_ms}ms</div>}
                {selectedLog.origin && <div><span className="font-semibold text-slate-500">Origin:</span> {selectedLog.origin}</div>}
                {selectedLog.ip && <div><span className="font-semibold text-slate-500">IP:</span> {selectedLog.ip}</div>}
                {selectedLog.request_id && <div className="col-span-2"><span className="font-semibold text-slate-500">Request ID:</span> <span className="font-mono break-all">{selectedLog.request_id}</span></div>}
                {selectedLog.user_id && <div><span className="font-semibold text-slate-500">User ID:</span> <span className="font-mono break-all">{selectedLog.user_id}</span></div>}
                {selectedLog.resource_id && <div><span className="font-semibold text-slate-500">Resource ID:</span> <span className="font-mono break-all">{selectedLog.resource_id}</span></div>}
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1">Message:</label>
                <div className="p-3 bg-slate-100 rounded-xl font-mono text-slate-900 break-words">
                  {selectedLog.message}
                </div>
              </div>

              {selectedLog.details && Object.keys(selectedLog.details).length > 0 && (
                <div>
                  <label className="font-bold text-slate-800 block mb-1">Payload / Details:</label>
                  <pre className="p-3 bg-slate-950 text-emerald-400 rounded-xl font-mono text-[11px] overflow-x-auto max-h-48">
                    {JSON.stringify(selectedLog.details, null, 2)}
                  </pre>
                </div>
              )}

              {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
                <div>
                  <label className="font-bold text-slate-800 block mb-1">Metadata:</label>
                  <pre className="p-3 bg-slate-950 text-sky-400 rounded-xl font-mono text-[11px] overflow-x-auto max-h-48">
                    {JSON.stringify(selectedLog.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2 border-t">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 text-xs font-semibold bg-slate-900 text-white rounded-xl hover:bg-slate-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

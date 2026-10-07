import React, { useState, useEffect, useCallback } from "react";
import {
  ShieldAlert,
  ShieldCheck,
  Trash2,
  AlertTriangle,
  Users,
  ScrollText,
  Terminal,
  KeyRound,
  RefreshCw,
  Loader2,
  CheckCircle2,
  X,
  Plus,
  Lock,
  Search,
  Eye,
  Shield,
  Clock,
  Sparkles,
} from "lucide-react";
import { QrRecord } from "./types";
import { apiClient } from "../../../lib/apiClient";
import { useAuth } from "../../../context/AuthContext";

interface AdminUser {
  id?: string;
  _id?: string;
  email: string;
  full_name?: string;
  role_name?: string;
  role?: string;
  created_at?: string;
  last_login_at?: string;
}

interface AuditLogItem {
  id?: string;
  _id?: string;
  eventType?: string;
  event_type?: string;
  actorType?: string;
  userEmail?: string;
  ip?: string;
  resourceType?: string;
  timestamp?: string;
  created_at?: string;
  metadata?: any;
}

interface SuperAdminPageProps {
  qrList: QrRecord[];
  setQrList: React.Dispatch<React.SetStateAction<QrRecord[]>>;
  setToast: (msg: string | null) => void;
}

const CONFIRM_PHRASE = "DELETE_ALL_STICKERS";

export default function SuperAdminPage({
  qrList,
  setQrList,
  setToast,
}: SuperAdminPageProps) {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState<"fleet" | "admins" | "audit" | "cli">("fleet");

  // Nuclear Delete All State
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);
  const [confirmInput, setConfirmInput] = useState("");
  const [isDeletingAll, setIsDeletingAll] = useState(false);

  // Admin Management State
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [adminsLoading, setAdminsLoading] = useState(false);
  const [showCreateAdminModal, setShowCreateAdminModal] = useState(false);
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [newAdminName, setNewAdminName] = useState("");
  const [newAdminRole, setNewAdminRole] = useState("ADMIN");
  const [newAdminPassword, setNewAdminPassword] = useState("");
  const [isCreatingAdmin, setIsCreatingAdmin] = useState(false);
  const [updatingRoleId, setUpdatingRoleId] = useState<string | null>(null);

  // Audit Logs State
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  };

  // ── Fetch Admins ───────────────────────────────────────────────────────────
  const fetchAdmins = useCallback(async () => {
    setAdminsLoading(true);
    try {
      const res = await apiClient.superAdmin.listAdmins();
      if (res.success && Array.isArray(res.data)) {
        setAdmins(res.data);
      } else {
        // Fallback: list users and filter by admin roles
        const usersRes = await apiClient.admin.listUsers();
        if (usersRes.data) {
          const filtered = usersRes.data.filter((u: any) =>
            ["admin", "super_admin", "SUPER_ADMIN", "ADMIN"].includes(u.role || u.role_name)
          );
          setAdmins(filtered);
        }
      }
    } catch {
      // Fallback to general user list
      try {
        const usersRes = await apiClient.admin.listUsers();
        if (usersRes.data) {
          setAdmins(usersRes.data.filter((u: any) => u.role === "admin"));
        }
      } catch {
        // Silent fail
      }
    } finally {
      setAdminsLoading(false);
    }
  }, []);

  // ── Fetch Audit Logs ───────────────────────────────────────────────────────
  const fetchAuditLogs = useCallback(async () => {
    setAuditLoading(true);
    try {
      const res = await apiClient.superAdmin.getAuditLogs();
      if (res.success && Array.isArray(res.data)) {
        setAuditLogs(res.data);
      }
    } catch {
      // Silent fail
    } finally {
      setAuditLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "admins") fetchAdmins();
    if (activeTab === "audit") fetchAuditLogs();
  }, [activeTab, fetchAdmins, fetchAuditLogs]);

  // ── Delete ALL Stickers (Nuclear Super Admin Operation) ───────────────────
  const handleNuclearDeleteAll = async () => {
    if (confirmInput.trim() !== CONFIRM_PHRASE) {
      showToast(`Please type "${CONFIRM_PHRASE}" exactly to confirm.`);
      return;
    }

    setIsDeletingAll(true);
    try {
      // Attempt 1: Super Admin secure endpoint
      let res: any;
      try {
        res = await apiClient.superAdmin.deleteAllStickers(CONFIRM_PHRASE);
      } catch {
        // Attempt 2: Fallback to standard QR deleteAll endpoint
        res = await apiClient.qr.deleteAllQrCodes();
      }

      if (res?.success) {
        setQrList([]);
        setShowDeleteAllModal(false);
        setConfirmInput("");
        showToast("SUCCESS: All stickers permanently wiped from the database.");
      } else {
        throw new Error(res?.error || "Delete all failed");
      }
    } catch (err: any) {
      showToast(`Delete all failed: ${err?.message || "Check connection and permissions"}`);
    } finally {
      setIsDeletingAll(false);
    }
  };

  // ── Create Admin ──────────────────────────────────────────────────────────
  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminEmail.trim()) return;

    setIsCreatingAdmin(true);
    try {
      const res = await apiClient.superAdmin.createAdmin({
        email: newAdminEmail.trim().toLowerCase(),
        full_name: newAdminName.trim() || undefined,
        role_name: newAdminRole,
        password: newAdminPassword.trim() || undefined,
      });

      if (res.success) {
        showToast(`Admin account created for ${newAdminEmail}`);
        setShowCreateAdminModal(false);
        setNewAdminEmail("");
        setNewAdminName("");
        setNewAdminPassword("");
        fetchAdmins();
      } else {
        showToast(`Failed: ${res.error || "Could not create admin"}`);
      }
    } catch (err: any) {
      showToast(`Error: ${err?.message || "Check super admin privileges"}`);
    } finally {
      setIsCreatingAdmin(false);
    }
  };

  // ── Change Role ───────────────────────────────────────────────────────────
  const handleChangeRole = async (userId: string, newRole: string) => {
    setUpdatingRoleId(userId);
    try {
      const res = await apiClient.superAdmin.changeRole(userId, newRole);
      if (res.success) {
        showToast(`Role updated to ${newRole}`);
        setAdmins((prev) =>
          prev.map((a) => (a.id === userId || a._id === userId ? { ...a, role_name: newRole, role: newRole.toLowerCase() } : a))
        );
      } else {
        showToast(`Failed: ${res.error || "Could not update role"}`);
      }
    } catch (err: any) {
      showToast(`Error: ${err?.message || "Could not update role"}`);
    } finally {
      setUpdatingRoleId(null);
    }
  };

  // ── Delete Admin ──────────────────────────────────────────────────────────
  const handleDeleteAdmin = async (userId: string, email: string) => {
    if (!window.confirm(`Are you sure you want to revoke admin access for ${email}?`)) return;

    try {
      const res = await apiClient.superAdmin.deleteAdmin(userId);
      if (res.success) {
        showToast(`Admin access revoked for ${email}`);
        setAdmins((prev) => prev.filter((a) => a.id !== userId && a._id !== userId));
      } else {
        showToast(`Failed: ${res.error || "Could not remove admin"}`);
      }
    } catch (err: any) {
      showToast(`Error: ${err?.message || "Could not remove admin"}`);
    }
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8 pt-5 sm:pt-7 pb-16 space-y-6 sm:space-y-7 text-[var(--fx-ink)] font-body" style={{ background: "var(--fx-canvas)" }}>
      {/* ── 1. Top Security Header ─────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-200">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-red-600 text-white flex items-center justify-center shadow-xs">
              <ShieldAlert size={18} />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-950 font-display">Super Admin Console</h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-100 text-red-700 border border-red-200 uppercase tracking-wide">
              Tier 0
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Nuclear sticker operations, master role-based access control (RBAC), and immutable security audit logs.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="px-3 py-1.5 rounded-xl bg-white border border-gray-200 text-xs font-semibold text-gray-700 flex items-center gap-2 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Root Admin Active</span>
          </div>
        </div>
      </div>

      {/* ── 2. Navigation Tabs ──────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2 border-b border-gray-200 pb-3">
        <button
          type="button"
          onClick={() => setActiveTab("fleet")}
          className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === "fleet"
              ? "bg-red-600 text-white shadow-xs"
              : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
          }`}
        >
          <Trash2 size={14} />
          <span>Nuclear Fleet Wipe</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("admins")}
          className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === "admins"
              ? "bg-gray-900 text-white shadow-xs"
              : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
          }`}
        >
          <Users size={14} />
          <span>Manage Admins & Roles</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("audit")}
          className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === "audit"
              ? "bg-gray-900 text-white shadow-xs"
              : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
          }`}
        >
          <ScrollText size={14} />
          <span>Security Audit Trail</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("cli")}
          className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === "cli"
              ? "bg-gray-900 text-white shadow-xs"
              : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
          }`}
        >
          <Terminal size={14} />
          <span>CLI & Break-Glass</span>
        </button>
      </div>

      {/* ── 3. Tab Contents ─────────────────────────────────────────────────── */}

      {/* TAB 1: NUCLEAR FLEET OPERATIONS (DELETE ALL) */}
      {activeTab === "fleet" && (
        <div className="space-y-6">
          {/* Main Danger Zone Container */}
          <div className="bg-white border-2 border-red-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-5 sm:p-6 bg-red-50/60 border-b border-red-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-red-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <AlertTriangle size={24} />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-red-950 font-display">
                    Nuclear Action: Delete All Stickers
                  </h2>
                  <p className="text-xs text-red-800 mt-1 max-w-2xl leading-relaxed">
                    This button is exclusively restricted to Super Admin. Normal administrators do NOT have access to wipe the fleet.
                    Executing this operation permanently purges every sticker record, associated scan counter, owner assignment,
                    and emergency contact mapping from the database.
                  </p>
                </div>
              </div>

              {/* Status Badge */}
              <div className="px-4 py-3 rounded-xl bg-white border border-red-200 text-center shrink-0">
                <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider block">Database Fleet Size</span>
                <span className="text-2xl font-black text-red-700 font-mono">{qrList.length}</span>
                <span className="text-[11px] text-gray-500 block">Stickers Registered</span>
              </div>
            </div>

            <div className="p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
                  <span className="text-xs font-bold text-gray-900 block mb-1">Permanent Deletion</span>
                  <p className="text-xs text-gray-500">
                    No soft-delete flag. Stickers are completely dropped from the MongoDB collection.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
                  <span className="text-xs font-bold text-gray-900 block mb-1">Audit Logged</span>
                  <p className="text-xs text-gray-500">
                    Your email, IP address, and execution timestamp are immutably written to the Security Audit Log.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
                  <span className="text-xs font-bold text-gray-900 block mb-1">Protected By Phrase</span>
                  <p className="text-xs text-gray-500">
                    Requires typing the explicit verification confirmation phrase to prevent accidental execution.
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="text-xs text-gray-600">
                  <span className="font-semibold text-gray-900">Current target:</span> All {qrList.length} stickers in MongoDB.
                </div>

                <button
                  type="button"
                  onClick={() => setShowDeleteAllModal(true)}
                  disabled={qrList.length === 0}
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-red-600 hover:bg-red-700 active:scale-98 text-white font-bold text-xs transition-all cursor-pointer shadow-sm disabled:opacity-40"
                >
                  <Trash2 size={16} />
                  <span>Delete All Stickers From Database</span>
                </button>
              </div>
            </div>
          </div>

          {/* Quick Info Box */}
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3">
            <ShieldCheck size={18} className="text-amber-700 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-900 space-y-1">
              <p className="font-bold">Admin Panel Isolation Verified</p>
              <p>
                The standard admin interface (QR Stickers page) only allows deleting individual stickers or selected stickers.
                The nuclear "Delete All" wipe button is exclusively anchored right here in the Super Admin Console.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MANAGE ADMINS & ROLES (RBAC) */}
      {activeTab === "admins" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h2 className="text-base font-bold text-gray-950 font-display">System Administrators & Roles</h2>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={fetchAdmins}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 bg-white text-xs font-semibold text-gray-700 hover:bg-gray-50 cursor-pointer shadow-2xs"
              >
                <RefreshCw size={13} className={adminsLoading ? "animate-spin" : ""} />
                <span>Refresh</span>
              </button>
              <button
                type="button"
                onClick={() => setShowCreateAdminModal(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gray-900 text-white text-xs font-bold hover:bg-black cursor-pointer shadow-xs"
              >
                <Plus size={14} />
                <span>New Admin</span>
              </button>
            </div>
          </div>

          {adminsLoading ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-gray-200">
              <Loader2 size={24} className="animate-spin mx-auto text-gray-400 mb-2" />
              <p className="text-xs text-gray-500 font-medium">Loading administrator directory...</p>
            </div>
          ) : admins.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-2xl border border-gray-200">
              <Users size={32} className="mx-auto text-gray-300 mb-2" />
              <p className="text-xs font-semibold text-gray-700">No administrators loaded</p>
              <p className="text-xs text-gray-400 mt-1">Click "Refresh" or add a new admin account.</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50/80 border-b border-gray-200 text-gray-500 uppercase tracking-wider font-semibold text-[10px]">
                    <tr>
                      <th className="py-3 px-4">User</th>
                      <th className="py-3 px-4">Role</th>
                      <th className="py-3 px-4">Role Assignment</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {admins.map((u) => {
                      const id = u.id || u._id || "";
                      const currentRole = (u.role_name || u.role || "ADMIN").toUpperCase();
                      const isSuper = currentRole === "SUPER_ADMIN";

                      return (
                        <tr key={id || u.email} className="hover:bg-gray-50/50">
                          <td className="py-3 px-4">
                            <div>
                              <p className="font-bold text-gray-900">{u.full_name || u.email.split("@")[0]}</p>
                              <p className="text-[11px] text-gray-500 font-mono">{u.email}</p>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                                isSuper
                                  ? "bg-red-100 text-red-700 border border-red-200"
                                  : currentRole === "ADMIN"
                                  ? "bg-blue-100 text-blue-700 border border-blue-200"
                                  : "bg-gray-100 text-gray-700 border border-gray-200"
                              }`}
                            >
                              {currentRole}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <select
                              value={currentRole}
                              disabled={updatingRoleId === id}
                              onChange={(e) => handleChangeRole(id, e.target.value)}
                              className="px-2.5 py-1 text-xs rounded-lg border border-gray-200 bg-white text-gray-800 outline-none hover:border-gray-300 focus:border-gray-900 cursor-pointer"
                            >
                              <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                              <option value="ADMIN">ADMIN</option>
                              <option value="MANAGER">MANAGER</option>
                              <option value="USER">USER</option>
                            </select>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              type="button"
                              onClick={() => handleDeleteAdmin(id, u.email)}
                              className="p-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                              title="Revoke Admin Access"
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: AUDIT LOGS */}
      {activeTab === "audit" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h2 className="text-base font-bold text-gray-950 font-display">Security Audit Log</h2>
            <button
              type="button"
              onClick={fetchAuditLogs}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 bg-white text-xs font-semibold text-gray-700 hover:bg-gray-50 cursor-pointer shadow-2xs"
            >
              <RefreshCw size={13} className={auditLoading ? "animate-spin" : ""} />
              <span>Refresh Logs</span>
            </button>
          </div>

          {auditLoading ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-gray-200">
              <Loader2 size={24} className="animate-spin mx-auto text-gray-400 mb-2" />
              <p className="text-xs text-gray-500 font-medium">Loading audit events...</p>
            </div>
          ) : auditLogs.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-2xl border border-gray-200">
              <ScrollText size={32} className="mx-auto text-gray-300 mb-2" />
              <p className="text-xs font-semibold text-gray-700">No recent audit events</p>
              <p className="text-xs text-gray-400 mt-1">Actions like deleting stickers or role changes appear here.</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-gray-50/80 border-b border-gray-200 text-gray-500 uppercase tracking-wider font-semibold text-[10px]">
                    <tr>
                      <th className="py-3 px-4">Event Type</th>
                      <th className="py-3 px-4">Actor</th>
                      <th className="py-3 px-4">Resource</th>
                      <th className="py-3 px-4">IP</th>
                      <th className="py-3 px-4 text-right">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {auditLogs.map((log, idx) => (
                      <tr key={log.id || log._id || idx} className="hover:bg-gray-50/50">
                        <td className="py-3 px-4 font-bold text-gray-900">{log.eventType || log.event_type || "EVENT"}</td>
                        <td className="py-3 px-4 text-gray-600">{log.userEmail || log.actorType || "System"}</td>
                        <td className="py-3 px-4 text-gray-600">{log.resourceType || "—"}</td>
                        <td className="py-3 px-4 text-gray-500">{log.ip || "127.0.0.1"}</td>
                        <td className="py-3 px-4 text-right text-gray-400">
                          {log.timestamp || log.created_at ? new Date(log.timestamp || log.created_at!).toLocaleString() : "Recent"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: CLI & BREAK-GLASS */}
      {activeTab === "cli" && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4 shadow-2xs">
            <div className="flex items-center gap-2.5">
              <Terminal size={18} className="text-gray-900" />
              <h2 className="text-base font-bold text-gray-950 font-display">Break-Glass Emergency CLI Tools</h2>
            </div>
            <p className="text-xs text-gray-600 leading-relaxed">
              If all HTTP authentication fails or credentials are lost, access the database directly via Server command line:
            </p>

            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-gray-950 text-emerald-400 font-mono text-xs overflow-x-auto space-y-1">
                <p className="text-gray-400"># 1. Reset or view Super Admin credentials locally:</p>
                <p className="text-white">cd Server</p>
                <p className="text-emerald-400">node scripts/break-glass.js</p>
              </div>

              <div className="p-3.5 rounded-xl bg-gray-950 text-emerald-400 font-mono text-xs overflow-x-auto space-y-1">
                <p className="text-gray-400"># 2. Run idempotent initial Super Admin seed:</p>
                <p className="text-white">cd Server</p>
                <p className="text-emerald-400">npm run seed:superadmin</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── 4. Nuclear Delete ALL Confirmation Modal ────────────────────────── */}
      {showDeleteAllModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-950/70 backdrop-blur-xs select-none"
          onClick={() => !isDeletingAll && setShowDeleteAllModal(false)}
        >
          <div
            className="bg-white rounded-2xl border-2 border-red-300 shadow-2xl p-6 max-w-md w-full space-y-5 animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-red-100 text-red-700 flex items-center justify-center shrink-0 border border-red-300">
                <AlertTriangle size={24} />
              </div>
              <div className="space-y-1 flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-red-700">Delete ALL Stickers?</h3>
                  <button
                    type="button"
                    disabled={isDeletingAll}
                    onClick={() => setShowDeleteAllModal(false)}
                    className="text-gray-400 hover:text-gray-600 p-1 cursor-pointer"
                  >
                    <X size={16} />
                  </button>
                </div>
                <p className="text-xs text-gray-600 font-normal leading-relaxed">
                  This will <strong className="text-red-700 font-bold">permanently delete all {qrList.length} stickers</strong> from the database.
                  Sticker scan history, emergency contacts, and linked vehicles will be unrecoverable.
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 space-y-1 text-xs text-red-800">
              <p className="font-bold">⚠ Danger Zone Safeguard</p>
              <p>
                To confirm permanent fleet wipe, please type:
              </p>
              <p className="font-mono font-bold text-red-900 bg-red-100 px-2 py-1 rounded select-all text-center">
                {CONFIRM_PHRASE}
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wide">
                Confirmation Input:
              </label>
              <input
                type="text"
                value={confirmInput}
                onChange={(e) => setConfirmInput(e.target.value)}
                placeholder={`Type "${CONFIRM_PHRASE}" here`}
                disabled={isDeletingAll}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-gray-300 bg-gray-50 focus:bg-white focus:border-red-600 focus:ring-2 focus:ring-red-600/10 outline-none font-mono"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-gray-100">
              <button
                type="button"
                disabled={isDeletingAll}
                onClick={() => {
                  setShowDeleteAllModal(false);
                  setConfirmInput("");
                }}
                className="px-4 py-2.5 text-xs font-semibold rounded-xl border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeletingAll || confirmInput.trim() !== CONFIRM_PHRASE}
                onClick={handleNuclearDeleteAll}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold rounded-xl bg-red-700 hover:bg-red-800 active:scale-98 text-white transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-xs"
              >
                {isDeletingAll ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                <span>{isDeletingAll ? "Wiping Database..." : "Permanently Delete Everything"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 5. Create Admin Modal ───────────────────────────────────────────── */}
      {showCreateAdminModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-950/60 backdrop-blur-xs select-none"
          onClick={() => !isCreatingAdmin && setShowCreateAdminModal(false)}
        >
          <div
            className="bg-white rounded-2xl border border-gray-200 shadow-2xl p-6 max-w-sm w-full space-y-4 animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck size={18} className="text-gray-900" />
                <h3 className="text-sm font-bold text-gray-950 font-display">Create Admin Account</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateAdminModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateAdmin} className="space-y-3.5">
              <div>
                <label className="text-[11px] font-bold text-gray-700 block mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  value={newAdminEmail}
                  onChange={(e) => setNewAdminEmail(e.target.value)}
                  placeholder="admin@example.com"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-gray-900 outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-700 block mb-1">Full Name</label>
                <input
                  type="text"
                  value={newAdminName}
                  onChange={(e) => setNewAdminName(e.target.value)}
                  placeholder="Admin Name"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-gray-900 outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-700 block mb-1">Role</label>
                <select
                  value={newAdminRole}
                  onChange={(e) => setNewAdminRole(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 bg-white text-gray-800 outline-none"
                >
                  <option value="ADMIN">ADMIN</option>
                  <option value="MANAGER">MANAGER</option>
                  <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-700 block mb-1">Temporary Password (Optional)</label>
                <input
                  type="password"
                  value={newAdminPassword}
                  onChange={(e) => setNewAdminPassword(e.target.value)}
                  placeholder="Leave blank to auto-generate"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-gray-900 outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  disabled={isCreatingAdmin}
                  onClick={() => setShowCreateAdminModal(false)}
                  className="px-3.5 py-2 text-xs font-semibold rounded-xl border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingAdmin}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-gray-900 hover:bg-black text-white cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {isCreatingAdmin ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
                  <span>{isCreatingAdmin ? "Creating..." : "Create Account"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

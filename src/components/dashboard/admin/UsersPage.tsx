import React, { useState, useEffect, useCallback } from "react";
import {
  Search, Mail, Phone, ShieldCheck, KeyRound, ShieldOff, Loader2, X,
  ChevronRight, QrCode, Pencil, Users as UsersIcon, History, ArrowRightLeft,
  Power, RefreshCcw, Trash2, Copy, Check, AlertTriangle,
} from "lucide-react";
import StatusPill from "./StatusPill";
import { avatarUrl, fmtDate } from "./helpers";
import { apiClient, isApiBackendConfigured } from "../../../lib/apiClient";
import {
  updateProductDetailsInDb, updateProductContactsInDb, setProductStatusInDb,
  transferProductInDb, deleteProductFromDb, getProductHistoryFromDb,
} from "../../../lib/supabaseService";
import { getCategoryIcon, getCategoryLabel } from "../../../stickerModules";
import type { DashboardSticker } from "../client/types";
import { mapProductRow } from "../client/types";
import {
  EditDetailsModal, EditContactsModal, TransferModal, ScanHistoryModal, ConfirmActionModal,
} from "../client/StickerModals";

interface AdminUserRow {
  id: string;
  email: string;
  full_name: string;
  phone_number: string | null;
  role: string;
  subscription_plan: string;
  is_subscribed: boolean;
  created_at: string;
  stickerCount: number;
  metadata?: { twoFactor?: { enabled?: boolean } };
}

type StickerModalState =
  | { type: "editDetails"; sticker: DashboardSticker }
  | { type: "editContacts"; sticker: DashboardSticker }
  | { type: "transfer"; sticker: DashboardSticker }
  | { type: "history"; sticker: DashboardSticker }
  | { type: "deactivate"; sticker: DashboardSticker }
  | { type: "reactivate"; sticker: DashboardSticker }
  | { type: "delete"; sticker: DashboardSticker }
  | null;

type SupportModalState = { type: "resetPassword" | "disable2fa"; user: AdminUserRow } | null;

export default function UsersPage({
  searchQuery, setSearchQuery, setToast,
}: {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  setToast: (msg: string | null) => void;
}) {
  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2500); };

  const [mode, setMode] = useState<"accounts" | "stickers">("accounts");

  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);

  const [stickerRows, setStickerRows] = useState<any[]>([]);
  const [stickersLoading, setStickersLoading] = useState(false);

  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<AdminUserRow | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<DashboardSticker[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);

  const [stickerModal, setStickerModal] = useState<StickerModalState>(null);
  const [supportModal, setSupportModal] = useState<SupportModalState>(null);
  const [actionBusy, setActionBusy] = useState(false);
  const [resetLinkInfo, setResetLinkInfo] = useState<{ email: string; link: string | null; emailSent: boolean } | null>(null);
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const loadUsers = useCallback(async (q: string) => {
    setUsersLoading(true);
    try {
      const res = await apiClient.admin.listUsers(q || undefined);
      setUsers(res.data || []);
    } catch {
      setUsers([]);
    } finally {
      setUsersLoading(false);
    }
  }, []);

  const loadStickers = useCallback(async (q: string) => {
    setStickersLoading(true);
    try {
      const res = await apiClient.admin.searchStickers(q || undefined);
      setStickerRows(res.data || []);
    } catch {
      setStickerRows([]);
    } finally {
      setStickersLoading(false);
    }
  }, []);

  // Debounced search — re-query whichever mode is active as the admin types.
  useEffect(() => {
    if (!isApiBackendConfigured) return;
    const t = setTimeout(() => {
      if (mode === "accounts") loadUsers(searchQuery);
      else loadStickers(searchQuery);
    }, 300);
    return () => clearTimeout(t);
  }, [searchQuery, mode, loadUsers, loadStickers]);

  const openUserDetail = useCallback(async (userId: string) => {
    setSelectedUserId(userId);
    setResetLinkInfo(null);
    setDetailLoading(true);
    try {
      const res = await apiClient.admin.getUserDetail(userId);
      setSelectedProfile(res.data.profile);
      setSelectedProducts((res.data.products || []).map(mapProductRow));
    } catch {
      showToast("Failed to load user details");
      setSelectedUserId(null);
    } finally {
      setDetailLoading(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const refreshSelectedUser = async () => {
    if (!selectedUserId) return;
    const res = await apiClient.admin.getUserDetail(selectedUserId);
    setSelectedProfile(res.data.profile);
    setSelectedProducts((res.data.products || []).map(mapProductRow));
  };

  const refreshCurrentSearch = () => {
    if (mode === "accounts") loadUsers(searchQuery);
    else loadStickers(searchQuery);
  };

  // ─── Sticker management actions (shared by user-detail view & sticker search results) ───
  const handleSaveDetails = async (productId: string, updates: Record<string, any>) => {
    const updated = await updateProductDetailsInDb(productId, updates);
    if (updated) {
      showToast("Sticker details updated");
      setStickerModal(null);
      await refreshSelectedUser();
      refreshCurrentSearch();
    } else {
      showToast("Failed to update sticker details");
    }
  };

  const handleSaveContacts = async (productId: string, contacts: { name: string; phone: string }[]) => {
    const updated = await updateProductContactsInDb(productId, contacts);
    if (updated) {
      showToast("Emergency contacts saved");
      setStickerModal(null);
      await refreshSelectedUser();
    } else {
      showToast("Failed to save contacts");
    }
  };

  const handleSetStatus = async (sticker: DashboardSticker, active: boolean) => {
    setActionBusy(true);
    const updated = await setProductStatusInDb(sticker.id, active, sticker.qrCodeId);
    setActionBusy(false);
    if (updated) {
      showToast(active ? "Sticker reactivated" : "Sticker deactivated");
      setStickerModal(null);
      await refreshSelectedUser();
      refreshCurrentSearch();
    } else {
      showToast("Failed to update sticker status");
    }
  };

  const handleTransfer = async (productId: string, targetEmail: string) => {
    const res = await transferProductInDb(productId, targetEmail);
    if (res.success) {
      showToast("Sticker transferred successfully");
      setStickerModal(null);
      await refreshSelectedUser();
      refreshCurrentSearch();
    }
    return res;
  };

  const handleConfirmDelete = async (sticker: DashboardSticker) => {
    setActionBusy(true);
    const ok = await deleteProductFromDb(sticker.id, sticker.qrCodeId);
    setActionBusy(false);
    if (ok) {
      showToast("Sticker removed");
      setStickerModal(null);
      await refreshSelectedUser();
      refreshCurrentSearch();
    } else {
      showToast("Failed to delete sticker");
    }
  };

  const handleOpenHistory = async (sticker: DashboardSticker) => {
    setStickerModal({ type: "history", sticker });
    setHistoryLoading(true);
    const data = await getProductHistoryFromDb(sticker.id);
    setHistoryData(data);
    setHistoryLoading(false);
  };

  // ─── Lost-access support actions ───
  const handleTriggerPasswordReset = async (user: AdminUserRow) => {
    setActionBusy(true);
    try {
      const res = await apiClient.admin.triggerPasswordReset(user.id);
      setResetLinkInfo({ email: user.email, link: res.actionLink || null, emailSent: !!res.emailSent });
      showToast(res.message || "Password reset triggered");
    } catch (err: any) {
      showToast(err.message || "Failed to trigger password reset");
    } finally {
      setActionBusy(false);
      setSupportModal(null);
    }
  };

  const handleDisable2FA = async (user: AdminUserRow) => {
    setActionBusy(true);
    try {
      const res = await apiClient.admin.disableTwoFactor(user.id);
      showToast(res.message || "2FA disabled");
      await refreshSelectedUser();
    } catch (err: any) {
      showToast(err.message || "Failed to disable 2FA");
    } finally {
      setActionBusy(false);
      setSupportModal(null);
    }
  };

  if (!isApiBackendConfigured) {
    return (
      <div className="px-8 pt-7 pb-10 text-gray-900">
        <div className="bg-white rounded-2xl border p-6" style={{ borderColor: "#f0f0f0" }}>
          <p className="text-sm text-gray-600">
            The admin support console (user accounts, sticker lookup, lost-access recovery) requires the RapiQR backend to be connected.
            Configure <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">VITE_API_BASE_URL</code> to enable this section.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-8 pt-7 pb-10 space-y-6 text-gray-900">
      {/* Mode toggle + search */}
      <div className="bg-white rounded-2xl border p-5" style={{ borderColor: "#f0f0f0" }}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
            <button
              onClick={() => setMode("accounts")}
              className="px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer"
              style={{ background: mode === "accounts" ? "#0F172A" : "transparent", color: mode === "accounts" ? "#fff" : "#64748b" }}
            >
              User Accounts
            </button>
            <button
              onClick={() => setMode("stickers")}
              className="px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer"
              style={{ background: mode === "stickers" ? "#0F172A" : "transparent", color: mode === "stickers" ? "#fff" : "#64748b" }}
            >
              Sticker Lookup
            </button>
          </div>
          <span className="text-[11px] font-semibold text-gray-500">
            {mode === "accounts" ? `${users.length} account${users.length !== 1 ? "s" : ""}` : `${stickerRows.length} sticker${stickerRows.length !== 1 ? "s" : ""}`}
          </span>
        </div>

        <div className="relative">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={mode === "accounts" ? "Search by name, email or phone…" : "Search by sticker ID, owner name, phone or email…"}
            className="w-full pl-10 pr-4 py-3 text-sm rounded-xl border bg-gray-50 outline-none focus:bg-white focus:border-gray-400 transition-all font-semibold text-gray-900"
            style={{ borderColor: "#e2e8f0" }}
          />
        </div>
      </div>

      {/* ── Accounts mode ── */}
      {mode === "accounts" && (
        <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: "#f0f0f0" }}>
          {usersLoading ? (
            <div className="px-6 py-14 text-center flex flex-col items-center gap-3">
              <Loader2 size={20} className="animate-spin text-gray-400" />
              <p className="text-xs font-semibold text-gray-500">Loading accounts…</p>
            </div>
          ) : users.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-sm font-semibold text-gray-700">No matching accounts.</p>
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: "#f7f7f7" }}>
              {users.map((u) => (
                <button
                  key={u.id}
                  onClick={() => openUserDetail(u.id)}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors cursor-pointer text-left"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img src={avatarUrl(u.full_name || u.email)} alt={u.full_name} className="w-8 h-8 rounded-full bg-gray-100 flex-shrink-0" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-gray-900 truncate">{u.full_name || "Unnamed"}</span>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-gray-100 text-gray-800 flex-shrink-0">{u.role}</span>
                        {u.metadata?.twoFactor?.enabled && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-blue-50 text-blue-700 flex-shrink-0 flex items-center gap-1"><ShieldCheck size={9} /> 2FA</span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="text-[10px] text-gray-500 font-medium flex items-center gap-1"><Mail size={10} />{u.email}</span>
                        {u.phone_number && <span className="text-[10px] text-gray-500 font-medium flex items-center gap-1"><Phone size={10} />{u.phone_number}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-[10px] font-bold text-gray-500 flex items-center gap-1"><QrCode size={11} />{u.stickerCount} sticker{u.stickerCount !== 1 ? "s" : ""}</span>
                    <ChevronRight size={15} className="text-gray-300" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Sticker lookup mode ── */}
      {mode === "stickers" && (
        <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: "#f0f0f0" }}>
          {stickersLoading ? (
            <div className="px-6 py-14 text-center flex flex-col items-center gap-3">
              <Loader2 size={20} className="animate-spin text-gray-400" />
              <p className="text-xs font-semibold text-gray-500">Searching stickers…</p>
            </div>
          ) : stickerRows.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-sm font-semibold text-gray-700">{searchQuery ? "No matching stickers." : "Type a sticker ID, name, phone or email to search."}</p>
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: "#f7f7f7" }}>
              {stickerRows.map((row) => {
                const sticker = mapProductRow(row);
                const owner = row.profiles;
                return (
                  <div key={row.id} className="px-6 py-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center text-lg flex-shrink-0">
                        {getCategoryIcon(sticker.category as any) || "🏷️"}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-gray-900 truncate">{sticker.nickname}</span>
                          <StatusPill status={sticker.status === "Active" ? "active" : "inactive"} />
                        </div>
                        <div className="text-[10px] text-gray-500 font-medium mt-0.5 flex items-center gap-2 flex-wrap">
                          <span className="font-mono">{sticker.qrCodeId}</span>
                          {owner ? (
                            <>
                              <span>·</span>
                              <button onClick={() => openUserDetail(owner.id)} className="text-blue-600 hover:underline cursor-pointer">
                                {owner.full_name || owner.email}
                              </button>
                            </>
                          ) : (
                            <span className="text-amber-600 font-bold">· Unclaimed</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button onClick={() => setStickerModal({ type: "transfer", sticker })} title="Transfer ownership" className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-500 cursor-pointer">
                        <ArrowRightLeft size={13} />
                      </button>
                      <button onClick={() => handleOpenHistory(sticker)} title="Scan history" className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-500 cursor-pointer">
                        <History size={13} />
                      </button>
                      {sticker.status === "Active" ? (
                        <button onClick={() => setStickerModal({ type: "deactivate", sticker })} title="Deactivate" className="w-8 h-8 rounded-lg hover:bg-amber-50 hover:text-amber-600 flex items-center justify-center text-gray-500 cursor-pointer">
                          <Power size={13} />
                        </button>
                      ) : (
                        <button onClick={() => setStickerModal({ type: "reactivate", sticker })} title="Reactivate" className="w-8 h-8 rounded-lg hover:bg-emerald-50 hover:text-emerald-600 flex items-center justify-center text-gray-500 cursor-pointer">
                          <RefreshCcw size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── User detail drawer ── */}
      <div
        className={`fixed inset-0 bg-black/40 z-40 transition-opacity duration-300 ${selectedUserId ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
        onClick={() => setSelectedUserId(null)}
      />
      <aside className={`fixed top-0 right-0 bottom-0 w-[460px] max-w-[94vw] bg-gray-50 z-50 shadow-2xl transition-transform duration-300 ease-out flex flex-col ${selectedUserId ? "translate-x-0" : "translate-x-full"}`}>
        {selectedUserId && (
          <>
            <div className="flex justify-between items-center px-6 py-5 border-b bg-white" style={{ borderColor: "#f0f0f0" }}>
              <h3 className="font-bold text-base text-gray-900">Account Detail</h3>
              <button onClick={() => setSelectedUserId(null)} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:text-gray-900 cursor-pointer">
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {detailLoading || !selectedProfile ? (
                <div className="py-14 text-center flex flex-col items-center gap-3">
                  <Loader2 size={20} className="animate-spin text-gray-400" />
                  <p className="text-xs font-semibold text-gray-500">Loading…</p>
                </div>
              ) : (
                <>
                  {/* Profile card */}
                  <div className="bg-white border rounded-2xl p-4 space-y-3" style={{ borderColor: "#f0f0f0" }}>
                    <div className="flex items-center gap-3">
                      <img src={avatarUrl(selectedProfile.full_name || selectedProfile.email)} alt="" className="w-11 h-11 rounded-full bg-gray-100" />
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-gray-900 truncate">{selectedProfile.full_name || "Unnamed"}</p>
                        <p className="text-[11px] text-gray-500 font-medium truncate">{selectedProfile.email}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div className="bg-gray-50 rounded-lg px-3 py-2">
                        <div className="text-gray-400 font-semibold">Phone</div>
                        <div className="font-bold text-gray-900">{selectedProfile.phone_number || "—"}</div>
                      </div>
                      <div className="bg-gray-50 rounded-lg px-3 py-2">
                        <div className="text-gray-400 font-semibold">Joined</div>
                        <div className="font-bold text-gray-900">{selectedProfile.created_at ? fmtDate(selectedProfile.created_at) : "—"}</div>
                      </div>
                      <div className="bg-gray-50 rounded-lg px-3 py-2">
                        <div className="text-gray-400 font-semibold">Plan</div>
                        <div className="font-bold text-gray-900 capitalize">{selectedProfile.subscription_plan || "free"}</div>
                      </div>
                      <div className="bg-gray-50 rounded-lg px-3 py-2">
                        <div className="text-gray-400 font-semibold">2FA</div>
                        <div className="font-bold text-gray-900">{selectedProfile.metadata?.twoFactor?.enabled ? "Enabled" : "Off"}</div>
                      </div>
                    </div>
                  </div>

                  {/* Lost-access support actions */}
                  <div className="bg-white border rounded-2xl p-4 space-y-2" style={{ borderColor: "#f0f0f0" }}>
                    <h4 className="font-bold text-xs text-gray-900 mb-1">Support Actions</h4>
                    <button
                      onClick={() => setSupportModal({ type: "resetPassword", user: selectedProfile })}
                      className="w-full py-2.5 rounded-xl bg-gray-50 border text-xs font-bold text-gray-900 hover:bg-gray-100 cursor-pointer flex items-center justify-center gap-1.5"
                      style={{ borderColor: "#e2e8f0" }}
                    >
                      <KeyRound size={13} /> Trigger Password Reset
                    </button>
                    {selectedProfile.metadata?.twoFactor?.enabled && (
                      <button
                        onClick={() => setSupportModal({ type: "disable2fa", user: selectedProfile })}
                        className="w-full py-2.5 rounded-xl bg-amber-50 border border-amber-200 text-xs font-bold text-amber-700 hover:bg-amber-100 cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <ShieldOff size={13} /> Disable 2FA (Lost Device)
                      </button>
                    )}
                    {resetLinkInfo && resetLinkInfo.email === selectedProfile.email && (
                      <ResetLinkCallout info={resetLinkInfo} onCopied={() => showToast("Link copied")} />
                    )}
                  </div>

                  {/* Stickers */}
                  <div className="bg-white border rounded-2xl p-4 space-y-2" style={{ borderColor: "#f0f0f0" }}>
                    <h4 className="font-bold text-xs text-gray-900 mb-1">Stickers ({selectedProducts.length})</h4>
                    {selectedProducts.length === 0 ? (
                      <p className="text-xs text-gray-500 italic">No stickers linked to this account.</p>
                    ) : (
                      <div className="space-y-2">
                        {selectedProducts.map((s) => (
                          <div key={s.id} className="bg-gray-50 rounded-xl p-3 space-y-2">
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="text-base flex-shrink-0">{getCategoryIcon(s.category as any) || "🏷️"}</span>
                                <div className="min-w-0">
                                  <p className="text-xs font-bold text-gray-900 truncate">{s.nickname}</p>
                                  <p className="text-[10px] text-gray-500 font-mono">{s.qrCodeId}</p>
                                </div>
                              </div>
                              <StatusPill status={s.status === "Active" ? "active" : "inactive"} />
                            </div>
                            <div className="grid grid-cols-4 gap-1.5">
                              <button onClick={() => setStickerModal({ type: "editDetails", sticker: s })} title="Edit details" className="py-1.5 rounded-lg bg-white border text-gray-600 hover:text-gray-900 flex items-center justify-center cursor-pointer" style={{ borderColor: "#e2e8f0" }}>
                                <Pencil size={12} />
                              </button>
                              <button onClick={() => setStickerModal({ type: "editContacts", sticker: s })} title="Edit contacts" className="py-1.5 rounded-lg bg-white border text-gray-600 hover:text-gray-900 flex items-center justify-center cursor-pointer" style={{ borderColor: "#e2e8f0" }}>
                                <UsersIcon size={12} />
                              </button>
                              <button onClick={() => handleOpenHistory(s)} title="Scan history" className="py-1.5 rounded-lg bg-white border text-gray-600 hover:text-gray-900 flex items-center justify-center cursor-pointer" style={{ borderColor: "#e2e8f0" }}>
                                <History size={12} />
                              </button>
                              <button onClick={() => setStickerModal({ type: "transfer", sticker: s })} title="Transfer" className="py-1.5 rounded-lg bg-white border text-gray-600 hover:text-gray-900 flex items-center justify-center cursor-pointer" style={{ borderColor: "#e2e8f0" }}>
                                <ArrowRightLeft size={12} />
                              </button>
                            </div>
                            <div className="flex gap-1.5">
                              {s.status === "Active" ? (
                                <button onClick={() => setStickerModal({ type: "deactivate", sticker: s })} className="flex-1 py-1.5 rounded-lg bg-amber-50 text-amber-700 text-[10px] font-bold hover:bg-amber-100 cursor-pointer flex items-center justify-center gap-1">
                                  <Power size={11} /> Deactivate
                                </button>
                              ) : (
                                <button onClick={() => setStickerModal({ type: "reactivate", sticker: s })} className="flex-1 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 text-[10px] font-bold hover:bg-emerald-100 cursor-pointer flex items-center justify-center gap-1">
                                  <RefreshCcw size={11} /> Reactivate
                                </button>
                              )}
                              <button onClick={() => setStickerModal({ type: "delete", sticker: s })} className="flex-1 py-1.5 rounded-lg bg-red-50 text-red-600 text-[10px] font-bold hover:bg-red-100 cursor-pointer flex items-center justify-center gap-1">
                                <Trash2 size={11} /> Delete
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </aside>

      {/* ── Sticker action modals (reused from the client dashboard for consistency) ── */}
      {stickerModal?.type === "editDetails" && (
        <EditDetailsModal sticker={stickerModal.sticker} onClose={() => setStickerModal(null)} onSave={(updates) => handleSaveDetails(stickerModal.sticker.id, updates)} />
      )}
      {stickerModal?.type === "editContacts" && (
        <EditContactsModal sticker={stickerModal.sticker} onClose={() => setStickerModal(null)} onSave={(contacts) => handleSaveContacts(stickerModal.sticker.id, contacts)} />
      )}
      {stickerModal?.type === "transfer" && (
        <TransferModal sticker={stickerModal.sticker} onClose={() => setStickerModal(null)} onTransfer={(email) => handleTransfer(stickerModal.sticker.id, email)} />
      )}
      {stickerModal?.type === "history" && (
        <ScanHistoryModal sticker={stickerModal.sticker} history={historyData} loading={historyLoading} onClose={() => setStickerModal(null)} />
      )}
      {stickerModal?.type === "deactivate" && (
        <ConfirmActionModal
          title="Deactivate this sticker?"
          description={<>Admin override: <span className="font-bold text-gray-900">{stickerModal.sticker.nickname}</span> will stop triggering alerts until reactivated.</>}
          confirmLabel="Deactivate" tone="warning" busy={actionBusy}
          onCancel={() => setStickerModal(null)} onConfirm={() => handleSetStatus(stickerModal.sticker, false)}
        />
      )}
      {stickerModal?.type === "reactivate" && (
        <ConfirmActionModal
          title="Reactivate this sticker?"
          description={<>Admin override: <span className="font-bold text-gray-900">{stickerModal.sticker.nickname}</span> will go live again.</>}
          confirmLabel="Reactivate" tone="info" busy={actionBusy}
          onCancel={() => setStickerModal(null)} onConfirm={() => handleSetStatus(stickerModal.sticker, true)}
        />
      )}
      {stickerModal?.type === "delete" && (
        <ConfirmActionModal
          title="Delete this sticker?"
          description={<>Admin override: <span className="font-bold text-gray-900">{stickerModal.sticker.nickname}</span> will be permanently removed. This cannot be undone.</>}
          confirmLabel="Delete" tone="danger" busy={actionBusy}
          onCancel={() => setStickerModal(null)} onConfirm={() => handleConfirmDelete(stickerModal.sticker)}
        />
      )}

      {/* ── Support action confirmations ── */}
      {supportModal?.type === "resetPassword" && (
        <ConfirmActionModal
          title="Trigger a password reset?"
          description={<>A password reset link will be generated for <span className="font-bold text-gray-900">{supportModal.user.email}</span> and emailed to them. Use this for lost-phone / locked-out support cases.</>}
          confirmLabel="Send Reset Link" tone="info" busy={actionBusy}
          onCancel={() => setSupportModal(null)} onConfirm={() => handleTriggerPasswordReset(supportModal.user)}
        />
      )}
      {supportModal?.type === "disable2fa" && (
        <ConfirmActionModal
          title="Force-disable 2FA?"
          description={<><AlertTriangle size={14} className="inline mb-0.5 mr-1 text-amber-600" />This bypasses normal password confirmation — only do this after verifying the requester's identity through another channel. <span className="font-bold text-gray-900">{supportModal.user.email}</span> will be able to sign in without their authenticator app.</>}
          confirmLabel="Disable 2FA" tone="warning" busy={actionBusy}
          onCancel={() => setSupportModal(null)} onConfirm={() => handleDisable2FA(supportModal.user)}
        />
      )}
    </div>
  );
}

function ResetLinkCallout({ info, onCopied }: { info: { email: string; link: string | null; emailSent: boolean }; onCopied: () => void }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 space-y-1.5">
      <p className="text-[11px] font-bold text-blue-800">
        {info.emailSent ? `Reset email sent to ${info.email}` : `Email not configured — relay this link to ${info.email} directly`}
      </p>
      {info.link && (
        <div className="flex items-center gap-1.5">
          <code className="flex-1 text-[10px] font-mono bg-white border border-blue-200 rounded-lg px-2 py-1.5 truncate">{info.link}</code>
          <button
            onClick={() => { navigator.clipboard.writeText(info.link!); setCopied(true); onCopied(); setTimeout(() => setCopied(false), 1500); }}
            className="w-7 h-7 flex-shrink-0 rounded-lg bg-white border border-blue-200 flex items-center justify-center cursor-pointer"
          >
            {copied ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} className="text-blue-700" />}
          </button>
        </div>
      )}
    </div>
  );
}

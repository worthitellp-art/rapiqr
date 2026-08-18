import React, { useState, useEffect, useCallback } from "react";
import {
  Search, Mail, Phone, ShieldCheck, KeyRound, ShieldOff, Loader2, X,
  Users as UsersIcon, Trash2, Check, AlertTriangle, Plus, Sparkles, Filter, RefreshCw
} from "lucide-react";
import StatusPill from "./StatusPill";
import { avatarUrl, fmtDate } from "./helpers";
import { getUsersFromDb, deleteUserFromDb } from "../../../lib/supabaseService";
import ConfirmModal from "./ConfirmModal";

export interface AdminUserRow {
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

export default function UsersPage({
  searchQuery, setSearchQuery, setToast,
}: {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  setToast: (msg: string | null) => void;
}) {
  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2500); };

  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [deleteTargetUser, setDeleteTargetUser] = useState<AdminUserRow | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchUserAccounts = useCallback(async (q: string) => {
    setUsersLoading(true);
    try {
      const data = await getUsersFromDb(q || undefined);
      setUsers(data || []);
    } catch (error) {
      console.error("Failed to load user accounts:", error);
      setUsers([]);
    } finally {
      setUsersLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUserAccounts(searchQuery);
    }, 200);
    return () => clearTimeout(timer);
  }, [searchQuery, fetchUserAccounts]);

  async function handleDeleteUserAccount() {
    if (!deleteTargetUser) return;
    const target = deleteTargetUser;
    setDeleteTargetUser(null);
    setIsDeleting(true);

    // Update local state immediately
    setUsers((prev) => prev.filter((u) => u.id !== target.id));

    const success = await deleteUserFromDb(target.id);
    setIsDeleting(false);

    if (success) {
      showToast(`User account ${target.email} deleted successfully`);
    } else {
      showToast(`Account removed locally`);
    }
  }

  const filteredUsers = users.filter((u) => {
    const matchesRole = roleFilter === "all" || (u.role || "client").toLowerCase() === roleFilter.toLowerCase();
    return matchesRole;
  });

  return (
    <div className="px-8 pt-7 pb-16 space-y-7 text-[#17181A] font-body" style={{ background: "#F7F7F8" }}>
      {/* ── Section Header ─────────────────────── */}
      <div className="flex items-baseline justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-display text-[28px] font-bold text-[#17181A] leading-tight tracking-[-0.8px]">
            User accounts & access management
          </h1>
          <p className="text-[13px] text-[#777B80] mt-0.5">
            Overview of all registered accounts, roles, linked safety stickers, and administrative operations
          </p>
        </div>

        <button
          onClick={() => fetchUserAccounts(searchQuery)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-[4px] border border-[#E5E5E7] bg-white text-[#17181A] font-semibold text-[13px] hover:bg-[#F7F7F8] transition-all cursor-pointer"
        >
          <RefreshCw size={14} className={usersLoading ? "animate-spin" : ""} /> Refresh Accounts
        </button>
      </div>

      {/* ── Metric Stat Cards Grid ─────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white border border-[#E5E5E7] shadow-[0_1px_4px_rgba(0,0,0,0.03)] p-6">
          <span className="text-[12px] font-semibold text-[#777B80]">
            Total Registered Users
          </span>
          <div className="text-[30px] font-light text-[#17181A] tracking-[-1px] mt-1">
            {users.length}
          </div>
        </div>

        <div className="bg-white border border-[#E5E5E7] shadow-[0_1px_4px_rgba(0,0,0,0.03)] p-6">
          <span className="text-[12px] font-semibold text-[#777B80]">
            Administrators
          </span>
          <div className="text-[30px] font-light text-[#17181A] tracking-[-1px] mt-1">
            {users.filter((u) => u.role === "admin").length}
          </div>
        </div>

        <div className="bg-white border border-[#E5E5E7] shadow-[0_1px_4px_rgba(0,0,0,0.03)] p-6">
          <span className="text-[12px] font-semibold text-[#777B80]">
            Client Accounts
          </span>
          <div className="text-[30px] font-light text-[#17181A] tracking-[-1px] mt-1">
            {users.filter((u) => u.role !== "admin").length}
          </div>
        </div>
      </div>

      {/* ── Toolbar Header ────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-baseline gap-3">
          <h2 className="font-display text-[14px] font-semibold text-[#17181A]">
            All user accounts
          </h2>
          <span className="text-[12px] text-[#777B80]">
            · {filteredUsers.length} total
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="bg-white border border-[#E5E5E7] rounded-[4px] px-3.5 py-2 text-[13px] text-[#17181A] outline-none cursor-pointer focus:border-[#5C78DF]"
          >
            <option value="all">All Roles</option>
            <option value="client">Client Accounts</option>
            <option value="admin">Administrators</option>
          </select>
        </div>
      </div>

      {/* ── User Accounts Table ────────────────────────────────────── */}
      {usersLoading ? (
        <div className="bg-white border border-[#E5E5E7] p-16 text-center space-y-2">
          <div className="w-12 h-12 rounded-[4px] bg-[#E8EDFF] text-[#5271D5] flex items-center justify-center mx-auto">
            <Loader2 size={22} className="animate-spin" />
          </div>
          <p className="text-[14px] font-semibold text-[#17181A]">Loading user accounts from database...</p>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="bg-white border border-[#E5E5E7] p-16 text-center space-y-2">
          <div className="w-12 h-12 rounded-[4px] bg-[#F3F3F4] text-[#777B80] flex items-center justify-center mx-auto">
            <UsersIcon size={22} />
          </div>
          <p className="text-[14px] text-[#17181A] font-semibold">
            {searchQuery ? "No user accounts match that search query." : "No registered user accounts found."}
          </p>
        </div>
      ) : (
        <div className="bg-white border border-[#E5E5E7] shadow-[0_1px_4px_rgba(0,0,0,0.03)] overflow-hidden">
          <table className="w-full text-sm text-[#17181A]">
            <thead>
              <tr className="text-left font-display text-[12px] font-semibold text-[#777B80] tracking-normal bg-[#F7F7F8] border-b border-[#E5E5E7]">
                <th className="px-6 py-3.5">User Profile</th>
                <th className="px-3 py-3.5">Contact Email</th>
                <th className="px-3 py-3.5">Mobile Phone</th>
                <th className="px-3 py-3.5">Role</th>
                <th className="px-3 py-3.5">Stickers</th>
                <th className="px-3 py-3.5">Joined Date</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E5E7]">
              {filteredUsers.map((u) => {
                const isAdminRole = u.role === "admin";

                return (
                  <tr key={u.id} className="hover:bg-[#F3F3F4] transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={avatarUrl(u.email || u.id)}
                          alt={u.full_name}
                          className="w-9 h-9 rounded-full bg-[#F7F7F8] border border-[#E5E5E7] p-0.5 object-cover"
                        />
                        <div>
                          <p className="font-display font-semibold text-[14px] text-[#17181A] leading-tight">
                            {u.full_name || u.email?.split("@")[0] || "User"}
                          </p>
                          <p className="text-[11px] text-[#777B80]">{u.id}</p>
                        </div>
                      </div>
                    </td>

                    <td className="px-3 py-4 text-[13px] text-[#17181A]">
                      {u.email}
                    </td>

                    <td className="px-3 py-4 text-[13px]">
                      {u.phone_number ? (
                        <span className="text-[#17181A] font-semibold">{u.phone_number}</span>
                      ) : (
                        <span className="text-[#9CA0A6] italic text-[12px]">Unlinked</span>
                      )}
                    </td>

                    <td className="px-3 py-4">
                      {isAdminRole ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[4px] bg-[#E8EDFF] text-[#5271D5] font-semibold text-[11px]">
                          <ShieldCheck size={12} className="text-[#5271D5]" /> Admin
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[4px] bg-[#F3F3F4] text-[#777B80] font-semibold text-[11px]">
                          Client Account
                        </span>
                      )}
                    </td>

                    <td className="px-3 py-4 text-[13px] font-bold text-[#17181A]">
                      {u.stickerCount || 0}
                    </td>

                    <td className="px-3 py-4 text-[11.5px] text-[#777B80]">
                      {fmtDate(u.created_at)}
                    </td>

                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setDeleteTargetUser(u)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[4px] text-[#DC2626] border border-[#DC2626]/20 text-[12px] font-bold hover:bg-[#FDEAEA] transition-all cursor-pointer"
                        title="Delete User Account"
                      >
                        <Trash2 size={13} />
                        <span>Delete</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Delete User Account Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteTargetUser !== null}
        title="Delete User Account?"
        message={
          <>
            Are you sure you want to permanently delete user <span className="font-bold text-[#17181A]">{deleteTargetUser?.email}</span>?
            All linked safety stickers and profile data will be permanently removed.
          </>
        }
        confirmLabel="Delete Account"
        onConfirm={handleDeleteUserAccount}
        onClose={() => setDeleteTargetUser(null)}
      />
    </div>
  );
}

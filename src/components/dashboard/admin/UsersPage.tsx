import React, { useState, useEffect, useCallback } from "react";
import {
  Search, Mail, Phone, ShieldCheck, KeyRound, ShieldOff, Loader2, X,
  Users as UsersIcon, Trash2, Check, AlertTriangle, Plus, Sparkles, Filter, RefreshCw
} from "lucide-react";
import StatusPill from "./StatusPill";
import { fmtDate } from "./helpers";
import InitialAvatar from "../../common/InitialAvatar";
import { apiClient } from "../../../lib/apiClient";
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
   setToast,
 }: {
   setToast: (msg: string | null) => void;
 }) {
  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2500); };

  const [searchQuery, setSearchQuery] = useState("");
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [deleteTargetUser, setDeleteTargetUser] = useState<AdminUserRow | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchUserAccounts = useCallback(async (q: string) => {
    setUsersLoading(true);
    try {
      const res = await apiClient.admin.listUsers(q || undefined);
      setUsers(res.data || []);
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

    try {
      const res = await apiClient.admin.deleteUser(target.id).catch(() => ({ success: false }));
      if (res.success) {
        setUsers((prev) => prev.filter((u) => u.id !== target.id));
        showToast(`User account ${target.email || target.id} deleted successfully`);
        fetchUserAccounts(searchQuery);
      } else {
        showToast(`Failed to delete user account`);
      }
    } catch (err: any) {
      showToast(`Error deleting user: ${err?.message || 'Unknown error'}`);
    } finally {
      setIsDeleting(false);
    }
  }

  const filteredUsers = users.filter((u) => {
    const matchesRole = roleFilter === "all" || (u.role || "client").toLowerCase() === roleFilter.toLowerCase();
    return matchesRole;
  });

  return (
    <div className="px-4 sm:px-6 lg:px-8 pt-5 sm:pt-7 pb-16 space-y-6 sm:space-y-7 text-[#18181B] font-body" style={{ background: "#F8F8F7" }}>
      {/* ── Section Header ─────────────────────── */}
      <div className="flex items-baseline justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-display text-[28px] font-bold text-[#18181B] leading-tight tracking-[-0.8px]">
            User accounts & access management
          </h1>
          <p className="text-[13px] text-[#71717A] mt-0.5">
            Overview of all registered accounts, roles, linked safety stickers, and administrative operations
          </p>
        </div>

        <button
          onClick={() => fetchUserAccounts(searchQuery)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-[#E5E7EB] bg-white text-[#18181B] font-semibold text-[13px] hover:bg-[#F8F8F7] transition-all cursor-pointer"
        >
          <RefreshCw size={14} className={usersLoading ? "animate-spin" : ""} /> Refresh Accounts
        </button>
      </div>

      {/* ── Metric Stat Cards Grid ─────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white border border-[#E5E7EB] rounded-xl shadow-[0_1px_2px_rgba(16,24,40,0.05)] p-6">
          <span className="text-[12px] font-semibold text-[#71717A]">
            Total Registered Users
          </span>
          <div className="text-[30px] font-semibold text-[#18181B] tracking-[-1px] mt-1">
            {users.length}
          </div>
        </div>

        <div className="bg-white border border-[#E5E7EB] rounded-xl shadow-[0_1px_2px_rgba(16,24,40,0.05)] p-6">
          <span className="text-[12px] font-semibold text-[#71717A]">
            Administrators
          </span>
          <div className="text-[30px] font-semibold text-[#18181B] tracking-[-1px] mt-1">
            {users.filter((u) => u.role === "admin").length}
          </div>
        </div>

        <div className="bg-white border border-[#E5E7EB] rounded-xl shadow-[0_1px_2px_rgba(16,24,40,0.05)] p-6">
          <span className="text-[12px] font-semibold text-[#71717A]">
            Client Accounts
          </span>
          <div className="text-[30px] font-semibold text-[#18181B] tracking-[-1px] mt-1">
            {users.filter((u) => u.role !== "admin").length}
          </div>
        </div>
      </div>

      {/* ── Toolbar Header ────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-baseline gap-3">
          <h2 className="font-display text-[14px] font-semibold text-[#18181B]">
            All user accounts
          </h2>
          <span className="text-[12px] text-[#71717A]">
            · {filteredUsers.length} total
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A1A1AA]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search accounts"
              className="w-48 pl-9 pr-3 h-10 text-[13px] rounded-[10px] border border-[#E5E7EB] bg-white text-[#18181B] placeholder-[#A1A1AA] outline-none transition-all focus:border-[#F5C518] focus:ring-[3px] focus:ring-[#F5C518]/[0.35]"
            />
          </div>

          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="bg-white border border-[#E5E7EB] rounded-lg px-3.5 py-2 text-[13px] text-[#18181B] outline-none cursor-pointer focus:border-[#F5C518]"
          >
            <option value="all">All Roles</option>
            <option value="client">Client Accounts</option>
            <option value="admin">Administrators</option>
          </select>
        </div>
      </div>

      {/* ── User Accounts Table ────────────────────────────────────── */}
      {usersLoading ? (
        <div className="bg-white border border-[#E5E7EB] p-16 text-center space-y-2">
          <div className="w-12 h-12 rounded-lg bg-[#FDF4DB] text-[#A16207] flex items-center justify-center mx-auto">
            <Loader2 size={22} className="animate-spin" />
          </div>
          <p className="text-[14px] font-semibold text-[#18181B]">Loading user accounts from database...</p>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="bg-white border border-[#E5E7EB] p-16 text-center space-y-2">
          <div className="w-12 h-12 rounded-lg bg-[#F4F4F5] text-[#71717A] flex items-center justify-center mx-auto">
            <UsersIcon size={22} />
          </div>
          <p className="text-[14px] text-[#18181B] font-semibold">
            {searchQuery ? "No user accounts match that search query." : "No registered user accounts found."}
          </p>
        </div>
      ) : (
        <div className="bg-white border border-[#E5E7EB] rounded-xl shadow-[0_1px_2px_rgba(16,24,40,0.05)] overflow-x-auto">
          <table className="w-full min-w-[880px] text-sm text-[#18181B]">
            <thead>
              <tr className="text-left font-display text-[12px] font-semibold text-[#71717A] tracking-normal bg-[#F8F8F7] border-b border-[#E5E7EB]">
                <th className="px-6 py-3.5">User Profile</th>
                <th className="px-3 py-3.5">Contact Email</th>
                <th className="px-3 py-3.5">Mobile Phone</th>
                <th className="px-3 py-3.5">Role</th>
                <th className="px-3 py-3.5">Stickers</th>
                <th className="px-3 py-3.5">Joined Date</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB]">
              {filteredUsers.map((u) => {
                const isAdminRole = u.role === "admin";

                return (
                  <tr key={u.id} className="hover:bg-[#F4F4F5] transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <InitialAvatar
                          name={u.full_name}
                          email={u.email}
                          size={36}
                          className="border border-[#E5E7EB]"
                        />
                        <div>
                          <p className="font-display font-semibold text-[14px] text-[#18181B] leading-tight">
                            {u.full_name || u.email?.split("@")[0] || "User"}
                          </p>
                          <p className="text-[11px] text-[#71717A]">{u.id}</p>
                        </div>
                      </div>
                    </td>

                    <td className="px-3 py-4 text-[13px] text-[#18181B]">
                      {u.email}
                    </td>

                    <td className="px-3 py-4 text-[13px]">
                      {u.phone_number ? (
                        <span className="text-[#18181B] font-semibold">{u.phone_number}</span>
                      ) : (
                        <span className="text-[#A1A1AA] italic text-[12px]">Unlinked</span>
                      )}
                    </td>

                    <td className="px-3 py-4">
                      {isAdminRole ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#FDF4DB] text-[#A16207] font-semibold text-[11px]">
                          <ShieldCheck size={12} className="text-[#A16207]" /> Admin
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#F4F4F5] text-[#71717A] font-semibold text-[11px]">
                          Client Account
                        </span>
                      )}
                    </td>

                    <td className="px-3 py-4 text-[13px] font-bold text-[#18181B]">
                      {u.stickerCount || 0}
                    </td>

                    <td className="px-3 py-4 text-[11.5px] text-[#71717A]">
                      {fmtDate(u.created_at)}
                    </td>

                    <td className="px-6 py-4 text-right">
                      {!isAdminRole ? (
                        <button
                          onClick={() => setDeleteTargetUser(u)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[#EF4444] border border-[#EF4444]/20 text-[12px] font-bold hover:bg-[#FEF2F2] transition-all cursor-pointer"
                          title="Delete User Account"
                        >
                          <Trash2 size={13} />
                          <span>Delete</span>
                        </button>
                      ) : (
                        <span className="text-[11.5px] font-semibold text-[#A1A1AA] italic">
                          Protected Admin
                        </span>
                      )}
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
            Are you sure you want to permanently delete user <span className="font-bold text-[#18181B]">{deleteTargetUser?.email}</span>?
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

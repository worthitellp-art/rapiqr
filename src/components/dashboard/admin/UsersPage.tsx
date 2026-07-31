import type React from "react";
import { useState } from "react";
import { Plus, UserPlus, Trash2, QrCode, ShieldCheck, ChevronDown } from "lucide-react";
import StatusPill from "./StatusPill";
import { TeamMember, QrRecord } from "./types";
import { avatarUrl, generateActivationCode, dispatchActivationToUserDashboard } from "./helpers";

export default function UsersPage({
  users, setUsers, qrList, setQrList, setToast,
}: {
  users: TeamMember[]; setUsers: React.Dispatch<React.SetStateAction<TeamMember[]>>;
  qrList: QrRecord[]; setQrList: React.Dispatch<React.SetStateAction<QrRecord[]>>;
  setToast: (msg: string | null) => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("Client");
  const [assignUserId, setAssignUserId] = useState<number | null>(null);
  const [selectedStickerId, setSelectedStickerId] = useState("");

  function addUser() {
    if (!name || !email) { setToast("Enter a name and email"); setTimeout(() => setToast(null), 2000); return; }
    setUsers((prev) => [...prev, { id: Date.now(), name, email, role, status: "active" }]);
    setName(""); setEmail("");
    setToast("User added");
    setTimeout(() => setToast(null), 2000);
  }

  function assignStickerToUser(userId: number) {
    if (!selectedStickerId) {
      setToast("Select a sticker to assign");
      setTimeout(() => setToast(null), 2000);
      return;
    }

    const user = users.find((u) => u.id === userId);
    if (!user) return;

    const uniqueCode = generateActivationCode();
    const timestamp = Date.now();

    // Update the sticker in qrList with assignment info and unique activation code
    setQrList((prev) =>
      prev.map((q) =>
        q.id === selectedStickerId
          ? {
              ...q,
              activationCode: uniqueCode,
              assignedTo: user.name,
              assignedUserId: userId,
              status: "inactive",
            }
          : q
      )
    );

    // Find the updated sticker record
    const sticker = qrList.find((q) => q.id === selectedStickerId);
    if (sticker) {
      dispatchActivationToUserDashboard({
        ...sticker,
        activationCode: uniqueCode,
        assignedTo: user.name,
        assignedUserId: userId,
      });
    }

    setSelectedStickerId("");
    setAssignUserId(null);
    setToast(`Sticker ${selectedStickerId} assigned to ${user.name} with code ${uniqueCode}`);
    setTimeout(() => setToast(null), 3000);
  }

  // Available stickers: not yet assigned to any user
  const unassignedStickers = qrList.filter((q) => !q.assignedTo && !q.assignedUserId);

  // Stickers assigned per user
  const getStickersForUser = (userId: number) =>
    qrList.filter((q) => q.assignedUserId === userId);

  const inputCls = "w-full px-3.5 py-2.5 text-sm rounded-xl border bg-gray-50 outline-none focus:bg-white focus:border-gray-400 transition-all font-semibold text-gray-900";

  return (
    <div className="px-8 pt-7 pb-10 space-y-6 text-gray-900">
      {/* Add User */}
      <div className="bg-white rounded-2xl border p-6" style={{ borderColor: "#f0f0f0" }}>
        <h3 className="font-bold text-gray-900 text-sm mb-4 flex items-center gap-2">
          <UserPlus size={15} style={{ color: "var(--accent)" }} /> Add User
        </h3>
        <div className="grid grid-cols-4 gap-3">
          <div>
            <label className="block text-[10px] font-extrabold text-gray-500 mb-1.5 uppercase tracking-wider">Full Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" className={inputCls} style={{ borderColor: "#e2e8f0" }} />
          </div>
          <div>
            <label className="block text-[10px] font-extrabold text-gray-500 mb-1.5 uppercase tracking-wider">Email Address</label>
            <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@company.com" className={inputCls} style={{ borderColor: "#e2e8f0" }} />
          </div>
          <div>
            <label className="block text-[10px] font-extrabold text-gray-500 mb-1.5 uppercase tracking-wider">Role</label>
            <select value={role} onChange={(e) => setRole(e.target.value)} className={inputCls} style={{ borderColor: "#e2e8f0" }}>
              <option>Admin</option><option>Manager</option><option>Client</option>
            </select>
          </div>
          <div className="flex items-end">
            <button onClick={addUser} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-white text-sm font-bold transition-all hover:opacity-90 active:scale-95 cursor-pointer shadow-sm" style={{ background: "var(--accent)" }}>
              <Plus size={14} /> Add User
            </button>
          </div>
        </div>
      </div>

      {/* Users List with Sticker Assignment */}
      <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: "#f0f0f0" }}>
        <div className="px-6 py-4 border-b" style={{ borderColor: "#f7f7f7" }}>
          <h3 className="font-bold text-gray-900 text-sm">All Users <span className="text-gray-500 font-normal">· {users.length}</span></h3>
        </div>
        {users.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-sm font-semibold text-gray-700">No users yet.</p>
            <p className="text-xs text-gray-500 mt-1 font-medium">Add a user above to assign stickers.</p>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: "#f7f7f7" }}>
            {users.map((u) => {
              const userStickers = getStickersForUser(u.id);
              const isAssigning = assignUserId === u.id;

              return (
                <div key={u.id} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <img src={avatarUrl(u.name)} alt={u.name} className="w-8 h-8 rounded-full bg-gray-100" />
                      <div>
                        <span className="text-xs font-bold text-gray-900">{u.name}</span>
                        <span className="text-[10px] text-gray-500 ml-2 font-medium">{u.email}</span>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-gray-100 text-gray-800 ml-2">{u.role}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-gray-500">
                        {userStickers.length} sticker{userStickers.length !== 1 ? "s" : ""}
                      </span>
                      <StatusPill status={u.status === "active" ? "active" : "inactive"} />
                      <button
                        onClick={() => { setAssignUserId(isAssigning ? null : u.id); setSelectedStickerId(""); }}
                        className="px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all hover:opacity-90 cursor-pointer flex items-center gap-1"
                        style={{ background: isAssigning ? "var(--accent)" : "#f3f4f6", color: isAssigning ? "#fff" : "#64748b" }}
                      >
                        <QrCode size={12} /> {isAssigning ? "Cancel" : "Assign Sticker"}
                      </button>
                      <button
                        onClick={() => { setUsers((prev) => prev.filter((x) => x.id !== u.id)); setToast("User removed"); setTimeout(() => setToast(null), 1500); }}
                        className="w-7 h-7 rounded-lg hover:bg-red-50 hover:text-red-500 flex items-center justify-center text-gray-400 transition-all cursor-pointer"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  {/* Assign Sticker UI */}
                  {isAssigning && (
                    <div className="mt-3 pl-10 flex items-center gap-3">
                      <select
                        value={selectedStickerId}
                        onChange={(e) => setSelectedStickerId(e.target.value)}
                        className="flex-1 px-3 py-2 text-xs rounded-xl border bg-gray-50 outline-none focus:bg-white focus:border-gray-400 font-semibold"
                        style={{ borderColor: "#e2e8f0" }}
                      >
                        <option value="">-- Select sticker to assign --</option>
                        {unassignedStickers.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.id} - {s.vehicleName || "Unnamed"}
                          </option>
                        ))}
                        {unassignedStickers.length === 0 && (
                          <option value="" disabled>No unassigned stickers available</option>
                        )}
                      </select>
                      <button
                        onClick={() => assignStickerToUser(u.id)}
                        disabled={!selectedStickerId}
                        className="px-4 py-2 rounded-xl text-[11px] font-bold text-white transition-all hover:opacity-90 disabled:opacity-50 cursor-pointer flex items-center gap-1.5 shadow-sm"
                        style={{ background: "var(--accent)" }}
                      >
                        <ShieldCheck size={12} /> Assign & Generate Code
                      </button>
                    </div>
                  )}

                  {/* Assigned Stickers for this user */}
                  {userStickers.length > 0 && (
                    <div className="mt-2 pl-10 space-y-1">
                      {userStickers.map((s) => (
                        <div key={s.id} className="flex items-center gap-2 text-[11px] font-semibold text-gray-600 bg-gray-50 rounded-lg px-3 py-1.5">
                          <QrCode size={11} className="text-amber-600" />
                          <span className="font-mono font-bold text-gray-800">{s.id}</span>
                          <span className="text-gray-400">—</span>
                          <span>{s.vehicleName || "Unnamed"}</span>
                          <span className="ml-auto font-mono text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            {s.activationCode || "No code"}
                          </span>
                          <StatusPill status={s.status === "active" ? "active" : "inactive"} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

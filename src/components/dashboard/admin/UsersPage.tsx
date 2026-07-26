import { useState } from "react";
import { Plus, UserPlus, Trash2 } from "lucide-react";
import StatusPill from "./StatusPill";
import { TeamMember } from "./types";
import { avatarUrl } from "./helpers";

export default function UsersPage({
  users, setUsers, setToast,
}: {
  users: TeamMember[]; setUsers: React.Dispatch<React.SetStateAction<TeamMember[]>>;
  setToast: (msg: string | null) => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("Operator");

  function addUser() {
    if (!name || !email) { setToast("Enter a name and email"); setTimeout(() => setToast(null), 2000); return; }
    setUsers((prev) => [...prev, { id: Date.now(), name, email, role, status: "invited" }]);
    setName(""); setEmail("");
    setToast("Invite sent");
    setTimeout(() => setToast(null), 2000);
  }

  const inputCls = "w-full px-3.5 py-2.5 text-sm rounded-xl border bg-gray-50 outline-none focus:bg-white focus:border-gray-400 transition-all font-semibold text-gray-900";

  return (
    <div className="px-8 pt-7 pb-10 space-y-6 text-gray-900">
      <div className="bg-white rounded-2xl border p-6" style={{ borderColor: "#f0f0f0" }}>
        <h3 className="font-bold text-gray-900 text-sm mb-4 flex items-center gap-2">
          <UserPlus size={15} style={{ color: "var(--accent)" }} /> Invite Team Member
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
              <option>Admin</option><option>Manager</option><option>Operator</option>
            </select>
          </div>
          <div className="flex items-end">
            <button onClick={addUser} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-white text-sm font-bold transition-all hover:opacity-90 active:scale-95 cursor-pointer shadow-sm" style={{ background: "var(--accent)" }}>
              <Plus size={14} /> Invite
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: "#f0f0f0" }}>
        <div className="px-6 py-4 border-b" style={{ borderColor: "#f7f7f7" }}>
          <h3 className="font-bold text-gray-900 text-sm">Team Members <span className="text-gray-500 font-normal">· {users.length}</span></h3>
        </div>
        {users.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-sm font-semibold text-gray-700">No team members yet.</p>
            <p className="text-xs text-gray-500 mt-1 font-medium">Invite someone above to grant them access.</p>
          </div>
        ) : (
          <table className="w-full text-sm text-gray-900">
            <thead>
              <tr className="text-left text-[11px] text-gray-500 font-bold uppercase tracking-wider border-b" style={{ borderColor: "#f7f7f7" }}>
                <th className="px-6 py-3">Name</th>
                <th className="px-2 py-3">Email</th>
                <th className="px-2 py-3">Role</th>
                <th className="px-2 py-3">Status</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b last:border-0 hover:bg-gray-50/50 transition-colors" style={{ borderColor: "#f7f7f7" }}>
                  <td className="px-6 py-3 flex items-center gap-2.5">
                    <img src={avatarUrl(u.name)} alt={u.name} className="w-7 h-7 rounded-full bg-gray-100" />
                    <span className="text-xs font-bold text-gray-900">{u.name}</span>
                  </td>
                  <td className="px-2 py-3 text-xs text-gray-600 font-medium">{u.email}</td>
                  <td className="px-2 py-3">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-gray-100 text-gray-800">{u.role}</span>
                  </td>
                  <td className="px-2 py-3"><StatusPill status={u.status === "active" ? "active" : "inactive"} /></td>
                  <td className="px-6 py-3 text-right">
                    <button
                      onClick={() => { setUsers((prev) => prev.filter((x) => x.id !== u.id)); setToast("User removed"); setTimeout(() => setToast(null), 1500); }}
                      className="w-7 h-7 rounded-lg hover:bg-red-50 hover:text-red-500 flex items-center justify-center text-gray-400 transition-all cursor-pointer"
                    >
                      <Trash2 size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

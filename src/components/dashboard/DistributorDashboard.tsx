import React, { useState } from 'react';
import { 
  Store, QrCode, ShieldCheck, Plus, CheckCircle2, TrendingUp, 
  MapPin, Phone, Users, Download, ArrowRight, LogOut, Package,
  ExternalLink, Sparkles, Copy, Check
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import groupLogo1 from '../../assets/Group 1000005716-1.png';
import PhoneInputWithCountry from '../common/PhoneInputWithCountry';

interface CustomerTag {
  id: string;
  customerName: string;
  phone: string;
  tagCode: string;
  type: 'Vehicle' | 'Home Gate' | 'Family';
  assignedAt: string;
}

export default function DistributorDashboard({ onBack }: { onBack: () => void }) {
  const { profile, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'activate' | 'pos'>('overview');
  
  // Sample customer activations state
  const [customerTags, setCustomerTags] = useState<CustomerTag[]>(() => {
    const saved = localStorage.getItem('namoqr-distributor-assigned-tags');
    if (saved) return JSON.parse(saved);
    return [
      { id: 'ACT-101', customerName: 'Vikram Sharma', phone: '+91 98112 33445', tagCode: 'CL-DIST-01', type: 'Vehicle', assignedAt: new Date(Date.now() - 3600000 * 4).toISOString() },
      { id: 'ACT-102', customerName: 'Pooja Hegde', phone: '+91 97654 11223', tagCode: 'CL-DIST-02', type: 'Home Gate', assignedAt: new Date(Date.now() - 3600000 * 24).toISOString() },
    ];
  });

  // Activate new customer tag form
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    phone: '',
    tagCode: '',
    type: 'Vehicle' as 'Vehicle' | 'Home Gate' | 'Family',
  });
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  const handleAssignTag = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomer.name || !newCustomer.phone || !newCustomer.tagCode) return;

    const newTag: CustomerTag = {
      id: 'ACT-' + Date.now().toString().slice(-4),
      customerName: newCustomer.name,
      phone: newCustomer.phone,
      tagCode: newCustomer.tagCode.toUpperCase(),
      type: newCustomer.type,
      assignedAt: new Date().toISOString(),
    };

    const updated = [newTag, ...customerTags];
    setCustomerTags(updated);
    try {
      localStorage.setItem('repiqr-distributor-assigned-tags', JSON.stringify(updated));
      localStorage.setItem('namoqr-distributor-assigned-tags', JSON.stringify(updated));
    } catch {}

    setSuccessMsg(`✓ Tag ${newTag.tagCode} successfully assigned to ${newTag.customerName}! Customer notified.`);
    setNewCustomer({ name: '', phone: '', tagCode: '', type: 'Vehicle' });

    setTimeout(() => setSuccessMsg(null), 4000);
  };

  const remainingStock = 300 - customerTags.length;
  const totalRevenue = customerTags.length * 499;
  const partnerProfit = Math.round(totalRevenue * 0.6);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-gray-900 font-sans pb-12">
      {/* ── Top Header Bar ────────────────────────────────────────── */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="flex items-center gap-2 cursor-pointer">
              <div className="w-9 h-9 rounded-xl bg-amber-500 flex items-center justify-center text-gray-950 font-black">
                <img src={groupLogo1} alt="RapiQR" className="h-5 w-auto object-contain" />
              </div>
              <div>
                <span className="font-black text-base text-gray-900 block leading-tight">RapiQR Partner Desk</span>
                <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">Distributor Portal</span>
              </div>
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
              <ShieldCheck size={14} className="text-emerald-600" />
              <span>Verified Partner: {profile?.fullName || 'City Franchise'}</span>
            </div>

            <button
              onClick={onBack}
              className="px-3 py-1.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Exit to Home
            </button>
            <button
              onClick={async () => { await signOut(); onBack(); }}
              className="p-2 rounded-xl text-red-600 hover:bg-red-50 transition-colors"
              title="Log Out"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </header>

      {/* ── Main Container ───────────────────────────────────────── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
        
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-gray-950 via-gray-900 to-amber-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
          <div className="absolute right-0 top-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-amber-500 text-gray-950 uppercase tracking-wider mb-3">
                <Sparkles size={13} /> Verified Master Distributor
              </span>
              <h1 className="text-2xl sm:text-3xl font-black">
                Welcome back, {profile?.fullName || 'Distributor Partner'}!
              </h1>
              <p className="text-xs sm:text-sm text-gray-300 mt-1 max-w-xl">
                Manage your QR sticker inventory, activate tags for retail customers in 5 seconds, and track profit margins.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => setActiveTab('activate')}
                className="px-5 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-gray-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer"
              >
                <Plus size={16} /> Activate Customer Tag
              </button>
            </div>
          </div>
        </div>

        {/* KPI Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-gray-500">Unassigned Inventory</span>
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <Package size={16} />
              </div>
            </div>
            <div className="text-2xl font-black text-gray-900">{remainingStock} <span className="text-xs font-normal text-gray-400">/ 300 Tags</span></div>
            <p className="text-[11px] text-gray-500 mt-1">Ready for retail customer activation</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-gray-500">Partner Profit Earned</span>
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <TrendingUp size={16} />
              </div>
            </div>
            <div className="text-2xl font-black text-emerald-600">₹{partnerProfit.toLocaleString()}</div>
            <p className="text-[11px] text-gray-500 mt-1">60% Profit Margin on activated tags</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-gray-500">Customer Tags Linked</span>
              <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                <Users size={16} />
              </div>
            </div>
            <div className="text-2xl font-black text-gray-900">{customerTags.length} <span className="text-xs font-normal text-gray-400">Active</span></div>
            <p className="text-[11px] text-gray-500 mt-1">Assigned to end-users</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-gray-500">Exclusive Territory</span>
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                <MapPin size={16} />
              </div>
            </div>
            <div className="text-lg font-black text-gray-900 truncate">City Master Lock</div>
            <p className="text-[11px] text-emerald-600 font-bold mt-1">✓ Franchise Rights Protected</p>
          </div>
        </div>

        {/* Tabs Bar */}
        <div className="flex items-center gap-2 border-b border-gray-200 pb-2">
          {[
            { id: 'overview', label: 'Assigned Customer Tags', icon: QrCode },
            { id: 'activate', label: 'Assign New Tag', icon: Plus },
            { id: 'pos', label: 'POS Marketing Kits & Collateral', icon: Download },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  isActive
                    ? 'bg-amber-500 text-gray-950 shadow-sm'
                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                }`}
              >
                <Icon size={15} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab 1: Assigned Tags List */}
        {activeTab === 'overview' && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-extrabold text-base text-gray-900">Your Retail Customer Tags</h3>
                <p className="text-xs text-gray-500">Tags assigned and activated through your distributor portal.</p>
              </div>
              <button
                onClick={() => setActiveTab('activate')}
                className="px-3.5 py-2 rounded-xl bg-gray-900 text-white font-bold text-xs flex items-center gap-1.5 hover:bg-gray-800"
              >
                <Plus size={14} /> Assign Tag
              </button>
            </div>

            {customerTags.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-2xl text-gray-400">
                <QrCode size={40} className="mx-auto mb-2 text-gray-300" />
                <p className="font-bold text-sm text-gray-600">No customer tags assigned yet.</p>
                <p className="text-xs mt-1">Click "Assign New Tag" to activate a QR sticker for your shop buyer.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-gray-100 text-gray-400 font-semibold uppercase tracking-wider text-[10px]">
                      <th className="pb-3">Customer Name</th>
                      <th className="pb-3">Phone</th>
                      <th className="pb-3">Tag Code</th>
                      <th className="pb-3">Category</th>
                      <th className="pb-3">Activation Date</th>
                      <th className="pb-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-medium text-gray-700">
                    {customerTags.map(tag => (
                      <tr key={tag.id} className="hover:bg-gray-50/50">
                        <td className="py-3 font-bold text-gray-900">{tag.customerName}</td>
                        <td className="py-3 font-mono">{tag.phone}</td>
                        <td className="py-3 font-mono font-bold text-amber-600">{tag.tagCode}</td>
                        <td className="py-3">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-700">
                            {tag.type}
                          </span>
                        </td>
                        <td className="py-3 text-gray-400">{new Date(tag.assignedAt).toLocaleDateString()}</td>
                        <td className="py-3 text-right">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            Active ✓
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Activate New Tag Form */}
        {activeTab === 'activate' && (
          <div className="max-w-2xl bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <h3 className="font-extrabold text-base text-gray-900 mb-1">Assign &amp; Activate Customer Tag</h3>
            <p className="text-xs text-gray-500 mb-6">Instantly link an unallocated QR tag ID to a buyer's vehicle or home in 5 seconds.</p>

            {successMsg && (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold mb-6 flex items-center gap-2">
                <CheckCircle2 size={18} className="text-emerald-600 flex-shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            <form onSubmit={handleAssignTag} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Customer Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Anish Kapoor"
                  value={newCustomer.name}
                  onChange={e => setNewCustomer({ ...newCustomer, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl outline-none focus:bg-white focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Customer Phone Number</label>
                  <PhoneInputWithCountry
                    required
                    value={newCustomer.phone}
                    onChange={full => setNewCustomer({ ...newCustomer, phone: full })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">QR Sticker Code ID</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. CL-DIST-05"
                    value={newCustomer.tagCode}
                    onChange={e => setNewCustomer({ ...newCustomer, tagCode: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl outline-none focus:bg-white focus:border-amber-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Tag Application Type</label>
                <select
                  value={newCustomer.type}
                  onChange={e => setNewCustomer({ ...newCustomer, type: e.target.value as any })}
                  className="w-full px-3.5 py-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl outline-none focus:bg-white focus:border-amber-500"
                >
                  <option value="Vehicle">Automobile / Two-Wheeler Safety Tag</option>
                  <option value="Home Gate">Home Gate / Apartment Security Tag</option>
                  <option value="Family">Family / Emergency SOS Card</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-xl font-bold bg-amber-500 text-gray-950 text-xs flex items-center justify-center gap-2 hover:bg-amber-400 transition-all shadow-md mt-4 cursor-pointer"
              >
                <CheckCircle2 size={16} /> Link &amp; Activate Customer Sticker
              </button>
            </form>
          </div>
        )}

        {/* Tab 3: POS Marketing Kits */}
        {activeTab === 'pos' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold mb-4">
                  <Download size={22} />
                </div>
                <h4 className="font-extrabold text-sm text-gray-900 mb-1">Acrylic Counter Display Art</h4>
                <p className="text-xs text-gray-500 leading-relaxed mb-4">
                  High-res printable tabletop display stand graphic with live scan QR demo.
                </p>
              </div>
              <button
                onClick={() => alert("Downloading Counter Stand Artwork PDF...")}
                className="w-full py-2.5 rounded-xl font-bold bg-gray-900 text-white text-xs flex items-center justify-center gap-2 hover:bg-gray-800"
              >
                <Download size={14} /> Download PDF Kit
              </button>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-800 flex items-center justify-center font-bold mb-4">
                  <Sparkles size={22} />
                </div>
                <h4 className="font-extrabold text-sm text-gray-900 mb-1">Retail Banner & Poster Art</h4>
                <p className="text-xs text-gray-500 leading-relaxed mb-4">
                  Standee & flex poster graphics for auto accessory shops and society gates.
                </p>
              </div>
              <button
                onClick={() => alert("Downloading Poster Art Package...")}
                className="w-full py-2.5 rounded-xl font-bold bg-gray-900 text-white text-xs flex items-center justify-center gap-2 hover:bg-gray-800"
              >
                <Download size={14} /> Download Banners (ZIP)
              </button>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold mb-4">
                  <Phone size={22} />
                </div>
                <h4 className="font-extrabold text-sm text-gray-900 mb-1">Sales Pitch & Demo Guide</h4>
                <p className="text-xs text-gray-500 leading-relaxed mb-4">
                  Script to convince vehicle owners & housing society admins in 30 seconds.
                </p>
              </div>
              <button
                onClick={() => alert("Opening Distributor Sales Playbook...")}
                className="w-full py-2.5 rounded-xl font-bold bg-gray-900 text-white text-xs flex items-center justify-center gap-2 hover:bg-gray-800"
              >
                <Download size={14} /> Read Playbook
              </button>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}

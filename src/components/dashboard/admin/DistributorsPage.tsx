import React, { useState, useEffect } from 'react';
import { 
  Store, CheckCircle2, Clock, XCircle, Search, MapPin, 
  Phone, Mail, Briefcase, Zap, ShieldCheck, Filter, ChevronRight 
} from 'lucide-react';
import { 
  getDistributorApplications, 
  updateDistributorApplicationStatus, 
  DistributorApplication 
} from '../../../lib/distributorService';

export default function DistributorsPage({ setToast }: { setToast: (msg: string) => void }) {
  const [apps, setApps] = useState<DistributorApplication[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedApp, setSelectedApp] = useState<DistributorApplication | null>(null);

  const loadApplications = async () => {
    const data = await getDistributorApplications();
    setApps(data);
  };

  useEffect(() => {
    loadApplications();
  }, []);

  const handleStatusChange = async (appId: string, status: 'approved' | 'rejected') => {
    const updated = await updateDistributorApplicationStatus(appId, status);
    if (updated) {
      loadApplications();
      if (selectedApp && selectedApp.id === appId) {
        setSelectedApp(updated);
      }
      setToast(
        status === 'approved' 
          ? `✓ Application ${appId} Verified & Approved! Distributor dashboard access granted.` 
          : `Application ${appId} rejected.`
      );
    }
  };

  const filteredApps = apps.filter(app => {
    const matchesFilter = filter === 'all' || app.status === filter;
    const matchesSearch = 
      app.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.phone.includes(searchQuery) ||
      app.userEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const pendingCount = apps.filter(a => a.status === 'pending').length;
  const approvedCount = apps.filter(a => a.status === 'approved').length;
  const totalCount = apps.length;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 text-gray-900">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 flex items-center gap-2">
            <Store className="text-amber-500" size={26} />
            Distributor & Partner Applications
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Review B2B franchise requests, verify partner credentials, and unlock Distributor Dashboards.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3.5 py-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold flex items-center gap-2">
            <Clock size={16} className="text-amber-600 animate-pulse" />
            <span>{pendingCount} Pending Verification</span>
          </div>
          <div className="px-3.5 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-600" />
            <span>{approvedCount} Active Partners</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
          {(['all', 'pending', 'approved', 'rejected'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all capitalize whitespace-nowrap cursor-pointer ${
                filter === tab
                  ? 'bg-[#111111] text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {tab === 'all' ? `All (${totalCount})` : tab === 'pending' ? `Pending (${pendingCount})` : tab}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, city, phone..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-xl outline-none focus:bg-white focus:border-amber-500"
          />
        </div>
      </div>

      {/* Applications Grid / Table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-8 space-y-3">
          {filteredApps.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-gray-200 text-gray-500">
              <Store size={40} className="mx-auto text-gray-300 mb-3" />
              <p className="font-bold text-sm">No distributor applications found.</p>
              <p className="text-xs text-gray-400 mt-1">Applications submitted by users on the landing page will appear here for verification.</p>
            </div>
          ) : (
            filteredApps.map(app => {
              const isPending = app.status === 'pending';
              const isApproved = app.status === 'approved';

              return (
                <div
                  key={app.id}
                  onClick={() => setSelectedApp(app)}
                  className={`bg-white rounded-2xl p-5 border transition-all cursor-pointer hover:shadow-md ${
                    selectedApp?.id === app.id ? 'border-amber-500 ring-2 ring-amber-500/20' : 'border-gray-200'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm ${
                        isApproved ? 'bg-emerald-100 text-emerald-800' : isPending ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {app.userName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-sm text-gray-900">{app.userName}</h3>
                          <span className="text-[10px] font-mono font-bold text-gray-400">#{app.id}</span>
                        </div>
                        <p className="text-xs text-gray-500 flex items-center gap-1.5 mt-0.5">
                          <MapPin size={12} className="text-amber-500" />
                          {app.city}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wide flex items-center gap-1.5 ${
                        isApproved
                          ? 'bg-emerald-100 text-emerald-800'
                          : isPending
                          ? 'bg-amber-100 text-amber-900 border border-amber-300 animate-pulse'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {isApproved && <CheckCircle2 size={12} />}
                        {isPending && <Clock size={12} />}
                        {app.status === 'rejected' && <XCircle size={12} />}
                        {app.status === 'pending' ? 'Pending Verification' : app.status}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 py-3 border-t border-gray-100 text-xs">
                    <div>
                      <span className="text-gray-400 block text-[10px]">Business Type</span>
                      <span className="font-semibold text-gray-800 flex items-center gap-1 mt-0.5">
                        <Briefcase size={12} className="text-gray-400" />
                        {app.business}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400 block text-[10px]">Requested Package</span>
                      <span className="font-bold text-amber-600 flex items-center gap-1 mt-0.5">
                        <Zap size={12} />
                        {app.tier}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400 block text-[10px]">Contact</span>
                      <span className="font-semibold text-gray-800 flex items-center gap-1 mt-0.5">
                        <Phone size={12} className="text-gray-400" />
                        {app.phone}
                      </span>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100 mt-1">
                    <span className="text-[10px] text-gray-400">
                      Applied: {new Date(app.createdAt).toLocaleDateString()} at {new Date(app.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>

                    <div className="flex items-center gap-2">
                      {isPending && (
                        <>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleStatusChange(app.id, 'rejected'); }}
                            className="px-3 py-1.5 rounded-lg text-xs font-bold text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                          >
                            Reject
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleStatusChange(app.id, 'approved'); }}
                            className="px-3.5 py-1.5 rounded-lg text-xs font-black bg-[#111111] text-white hover:bg-gray-800 transition-all shadow-sm cursor-pointer flex items-center gap-1.5"
                          >
                            <ShieldCheck size={14} /> Verify & Approve Partner
                          </button>
                        </>
                      )}
                      {isApproved && (
                        <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                          <CheckCircle2 size={14} /> Verified Distributor Active
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Details Inspection Sidebar */}
        <div className="lg:col-span-4 bg-white rounded-2xl p-6 border border-gray-200 shadow-sm sticky top-6">
          <h3 className="font-extrabold text-base text-gray-900 mb-4 pb-3 border-b border-gray-100 flex items-center justify-between">
            <span>Application Inspector</span>
            {selectedApp && <span className="text-xs font-mono font-bold text-amber-600">#{selectedApp.id}</span>}
          </h3>

          {selectedApp ? (
            <div className="space-y-4 text-xs">
              <div>
                <label className="text-gray-400 font-medium block mb-1">Company / Partner Name</label>
                <div className="font-bold text-sm text-gray-900 bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                  {selectedApp.userName}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-gray-400 font-medium block mb-1">Phone / WhatsApp</label>
                  <div className="font-bold text-gray-900 bg-gray-50 p-2.5 rounded-xl border border-gray-100 flex items-center gap-1.5">
                    <Phone size={13} className="text-amber-500" />
                    {selectedApp.phone}
                  </div>
                </div>
                <div>
                  <label className="text-gray-400 font-medium block mb-1">City / Region</label>
                  <div className="font-bold text-gray-900 bg-gray-50 p-2.5 rounded-xl border border-gray-100 flex items-center gap-1.5">
                    <MapPin size={13} className="text-amber-500" />
                    {selectedApp.city}
                  </div>
                </div>
              </div>

              <div>
                <label className="text-gray-400 font-medium block mb-1">Account Email</label>
                <div className="font-medium text-gray-800 bg-gray-50 p-2.5 rounded-xl border border-gray-100 flex items-center gap-1.5">
                  <Mail size={13} className="text-gray-400" />
                  {selectedApp.userEmail}
                </div>
              </div>

              <div>
                <label className="text-gray-400 font-medium block mb-1">Interested Partner Tier</label>
                <div className="font-black text-amber-900 bg-amber-50 p-3 rounded-xl border border-amber-200">
                  {selectedApp.tier}
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 space-y-2">
                <label className="text-gray-400 font-medium block">Admin Verification Action</label>
                {selectedApp.status === 'pending' ? (
                  <div className="space-y-2">
                    <button
                      onClick={() => handleStatusChange(selectedApp.id, 'approved')}
                      className="w-full py-3 rounded-xl font-extrabold bg-[#111111] text-white hover:bg-gray-800 transition-all text-xs flex items-center justify-center gap-2 shadow-md cursor-pointer"
                    >
                      <ShieldCheck size={16} /> Approve & Grant Distributor Access
                    </button>
                    <button
                      onClick={() => handleStatusChange(selectedApp.id, 'rejected')}
                      className="w-full py-2.5 rounded-xl font-bold bg-gray-100 text-gray-700 hover:bg-red-50 hover:text-red-700 transition-all text-xs flex items-center justify-center gap-2 cursor-pointer"
                    >
                      Reject Application
                    </button>
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 font-bold text-center">
                    ✓ Verified on {selectedApp.approvedAt ? new Date(selectedApp.approvedAt).toLocaleDateString() : 'Today'}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-gray-400">
              Select any application card on the left to inspect applicant details and verify rights.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

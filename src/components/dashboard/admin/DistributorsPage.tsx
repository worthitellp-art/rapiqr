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
    <div className="px-8 pt-7 pb-16 space-y-7 text-[#17181A] font-body" style={{ background: "#F7F7F8" }}>
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-[21px] font-semibold text-[#17181A] flex items-center gap-2">
            <Store className="text-[#5C78DF]" size={22} />
            Distributor & Partner Applications
          </h1>
          <p className="text-[13px] text-[#777B80] mt-0.5">
            Review B2B franchise requests, verify partner credentials, and unlock Distributor Dashboards.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-[4px] bg-[#FBF3E4] text-[#B8863F] text-[12px] font-semibold">
            <Clock size={14} className="animate-pulse" />
            <span className="font-mono font-bold">{pendingCount}</span> Pending Verification
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-[4px] bg-[#E9F9EF] text-[#2E9E5B] text-[12px] font-semibold">
            <CheckCircle2 size={14} />
            <span className="font-mono font-bold">{approvedCount}</span> Active Partners
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto space-y-7">
        {/* Filter and Search Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 border border-[#E5E5E7] shadow-[0_1px_4px_rgba(0,0,0,0.03)]">
          <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
            {(['all', 'pending', 'approved', 'rejected'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`px-3.5 py-1.5 rounded-[4px] text-[12px] font-semibold transition-all capitalize whitespace-nowrap cursor-pointer ${
                  filter === tab
                    ? 'bg-[#17181A] text-white'
                    : 'text-[#777B80] hover:bg-[#F3F3F4]'
                }`}
              >
                {tab === 'all' ? `All (${totalCount})` : tab === 'pending' ? `Pending (${pendingCount})` : tab}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-72">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9CA0A6]" />
            <input
              type="text"
              placeholder="Search by name, city, phone..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-[12.5px] rounded-full border-0 bg-[#EFEFF0] text-[#17181A] placeholder-[#9CA0A6] outline-none transition-all focus:ring-2 focus:ring-[#5C78DF]/25"
            />
          </div>
        </div>

        {/* Applications Grid / Table */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-8 space-y-3">
            {filteredApps.length === 0 ? (
              <div className="bg-white p-12 text-center border border-[#E5E5E7] shadow-[0_1px_4px_rgba(0,0,0,0.03)] space-y-2">
                <div className="w-12 h-12 rounded-full bg-[#E8EDFF] text-[#5271D5] flex items-center justify-center mx-auto">
                  <Store size={22} />
                </div>
                <p className="font-bold text-[14px] text-[#17181A]">No distributor applications found.</p>
                <p className="text-[12px] text-[#777B80]">Applications submitted by users on the landing page will appear here for verification.</p>
              </div>
            ) : (
              filteredApps.map(app => {
                const isPending = app.status === 'pending';
                const isApproved = app.status === 'approved';

                return (
                  <div
                    key={app.id}
                    onClick={() => setSelectedApp(app)}
                    className={`bg-white p-5 border transition-all cursor-pointer hover:shadow-[0_1px_4px_rgba(0,0,0,0.06)] shadow-[0_1px_4px_rgba(0,0,0,0.03)] ${
                      selectedApp?.id === app.id ? 'border-[#5C78DF] ring-2 ring-[#5C78DF]/15' : 'border-[#E5E5E7]'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-[14px] ${
                          isApproved ? 'bg-[#E9F9EF] text-[#2E9E5B]' : isPending ? 'bg-[#FBF3E4] text-[#B8863F]' : 'bg-[#FDEAEA] text-[#DC2626]'
                        }`}>
                          {app.userName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-display font-semibold text-[14px] text-[#17181A]">{app.userName}</h3>
                            <span className="text-[10px] font-mono font-bold text-[#9CA0A6]">#{app.id}</span>
                          </div>
                          <p className="text-[12px] text-[#777B80] flex items-center gap-1.5 mt-0.5">
                            <MapPin size={12} className="text-[#5C78DF]" />
                            {app.city}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-1 rounded-[4px] text-[11px] font-bold uppercase tracking-wide flex items-center gap-1.5 w-fit ${
                          isApproved
                            ? 'bg-[#E9F9EF] text-[#2E9E5B]'
                            : isPending
                            ? 'bg-[#FBF3E4] text-[#B8863F] animate-pulse'
                            : 'bg-[#FDEAEA] text-[#DC2626]'
                        }`}>
                          {isApproved && <CheckCircle2 size={12} />}
                          {isPending && <Clock size={12} />}
                          {app.status === 'rejected' && <XCircle size={12} />}
                          {app.status === 'pending' ? 'Pending Verification' : app.status}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 py-3 border-t border-[#F3F3F4] text-[12px]">
                      <div>
                        <span className="text-[#9CA0A6] block text-[10px] font-semibold uppercase tracking-wide">Business Type</span>
                        <span className="font-semibold text-[#17181A] flex items-center gap-1 mt-0.5">
                          <Briefcase size={12} className="text-[#9CA0A6]" />
                          {app.business}
                        </span>
                      </div>
                      <div>
                        <span className="text-[#9CA0A6] block text-[10px] font-semibold uppercase tracking-wide">Requested Package</span>
                        <span className="font-bold text-[#B8863F] flex items-center gap-1 mt-0.5">
                          <Zap size={12} />
                          {app.tier}
                        </span>
                      </div>
                      <div>
                        <span className="text-[#9CA0A6] block text-[10px] font-semibold uppercase tracking-wide">Contact</span>
                        <span className="font-semibold text-[#17181A] flex items-center gap-1 mt-0.5 font-mono">
                          <Phone size={12} className="text-[#9CA0A6]" />
                          {app.phone}
                        </span>
                      </div>
                    </div>

                    {/* Actions Bar */}
                    <div className="flex items-center justify-between pt-3 border-t border-[#F3F3F4] mt-1">
                      <span className="text-[10px] font-mono text-[#9CA0A6]">
                        Applied: {new Date(app.createdAt).toLocaleDateString()} at {new Date(app.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>

                      <div className="flex items-center gap-2">
                        {isPending && (
                          <>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleStatusChange(app.id, 'rejected'); }}
                              className="px-3 py-1.5 rounded-[4px] text-[12px] font-semibold text-[#DC2626] hover:bg-[#FDEAEA] transition-colors cursor-pointer"
                            >
                              Reject
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleStatusChange(app.id, 'approved'); }}
                              className="px-3.5 py-1.5 rounded-[4px] text-[12px] font-bold bg-[#17181A] text-white hover:bg-[#2A2B2E] transition-all cursor-pointer flex items-center gap-1.5"
                            >
                              <ShieldCheck size={14} /> Verify & Approve Partner
                            </button>
                          </>
                        )}
                        {isApproved && (
                          <span className="text-[12px] font-bold text-[#2E9E5B] flex items-center gap-1">
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
          <div className="lg:col-span-4 bg-white p-6 border border-[#E5E5E7] shadow-[0_1px_4px_rgba(0,0,0,0.03)] sticky top-6">
            <h3 className="font-display font-semibold text-[14px] text-[#17181A] mb-4 pb-3 border-b border-[#F3F3F4] flex items-center justify-between">
              <span>Application Inspector</span>
              {selectedApp && <span className="text-[12px] font-mono font-bold text-[#5C78DF]">#{selectedApp.id}</span>}
            </h3>

            {selectedApp ? (
              <div className="space-y-4 text-[12px]">
                <div>
                  <label className="text-[11px] font-semibold text-[#777B80] uppercase tracking-wide block mb-1">Company / Partner Name</label>
                  <div className="font-bold text-[13.5px] text-[#17181A] bg-[#F7F7F8] border border-[#E5E5E7] p-2.5 rounded-[4px]">
                    {selectedApp.userName}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-[#777B80] uppercase tracking-wide block mb-1">Phone / WhatsApp</label>
                    <div className="font-bold text-[#17181A] bg-[#F7F7F8] border border-[#E5E5E7] p-2.5 rounded-[4px] flex items-center gap-1.5 font-mono">
                      <Phone size={13} className="text-[#5C78DF]" />
                      {selectedApp.phone}
                    </div>
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-[#777B80] uppercase tracking-wide block mb-1">City / Region</label>
                    <div className="font-bold text-[#17181A] bg-[#F7F7F8] border border-[#E5E5E7] p-2.5 rounded-[4px] flex items-center gap-1.5">
                      <MapPin size={13} className="text-[#5C78DF]" />
                      {selectedApp.city}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-[#777B80] uppercase tracking-wide block mb-1">Account Email</label>
                  <div className="font-medium text-[#17181A] bg-[#F7F7F8] border border-[#E5E5E7] p-2.5 rounded-[4px] flex items-center gap-1.5">
                    <Mail size={13} className="text-[#9CA0A6]" />
                    {selectedApp.userEmail}
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-[#777B80] uppercase tracking-wide block mb-1">Interested Partner Tier</label>
                  <div className="font-black text-[#B8863F] bg-[#FBF3E4] p-3 rounded-[4px]">
                    {selectedApp.tier}
                  </div>
                </div>

                <div className="pt-4 border-t border-[#F3F3F4] space-y-2">
                  <label className="text-[11px] font-semibold text-[#777B80] uppercase tracking-wide block">Admin Verification Action</label>
                  {selectedApp.status === 'pending' ? (
                    <div className="space-y-2">
                      <button
                        onClick={() => handleStatusChange(selectedApp.id, 'approved')}
                        className="w-full py-3 rounded-[4px] font-bold bg-[#17181A] text-white hover:bg-[#2A2B2E] transition-all text-[12.5px] flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <ShieldCheck size={16} /> Approve & Grant Distributor Access
                      </button>
                      <button
                        onClick={() => handleStatusChange(selectedApp.id, 'rejected')}
                        className="w-full py-2.5 rounded-[4px] font-semibold text-[#DC2626] hover:bg-[#FDEAEA] transition-all text-[12.5px] flex items-center justify-center gap-2 cursor-pointer"
                      >
                        Reject Application
                      </button>
                    </div>
                  ) : (
                    <div className="p-3 rounded-[4px] bg-[#E9F9EF] text-[#2E9E5B] font-bold text-center">
                      ✓ Verified on {selectedApp.approvedAt ? new Date(selectedApp.approvedAt).toLocaleDateString() : 'Today'}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-[#9CA0A6] text-[12.5px]">
                Select any application card on the left to inspect applicant details and verify rights.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

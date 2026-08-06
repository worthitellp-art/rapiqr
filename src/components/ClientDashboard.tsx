import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { getCategoryIcon, getCategoryLabel } from '../stickerModules';
import {
  Bell,
  ShieldCheck,
  LogOut,
  Eye,
  Menu,
  Grid,
  History,
  Trash2,
  Loader2,
  Users,
  Settings,
  LifeBuoy,
  X,
  Share2,
  ShoppingBag,
  Pencil,
  ArrowRightLeft,
  Power,
  RefreshCcw,
  Sparkles,
} from 'lucide-react';
import type { DashboardSticker } from './dashboard/client/types';
import { mapProductRow } from './dashboard/client/types';
import { EditDetailsModal, EditContactsModal, TransferModal, ScanHistoryModal, ConfirmActionModal } from './dashboard/client/StickerModals';
import EmergencyContactsPanel from './dashboard/client/EmergencyContactsPanel';
import AccountSettingsPanel from './dashboard/client/AccountSettingsPanel';
import SupportLegalPanel from './dashboard/client/SupportLegalPanel';
import AppLogo from './common/AppLogo';
import {
  getProductsFromDb,
  updateProductDetailsInDb,
  updateProductContactsInDb,
  setProductStatusInDb,
  transferProductInDb,
  deleteProductFromDb,
  getProductHistoryFromDb,
} from '../lib/supabaseService';

interface ClientDashboardProps {
  onBack: () => void;
  switchToDistributor?: () => void;
}

type TabId = 'overview' | 'contacts' | 'history' | 'settings' | 'support';

const NAV_ITEMS: { id: TabId; label: string; icon: React.ComponentType<{ size?: number }> }[] = [
  { id: 'overview', label: 'My Stickers', icon: Grid },
  { id: 'contacts', label: 'Emergency Contacts', icon: Users },
  { id: 'history', label: 'Alert History', icon: History },
  { id: 'settings', label: 'Account Settings', icon: Settings },
  { id: 'support', label: 'Support & Help', icon: LifeBuoy },
];

type ModalState =
  | { type: 'editDetails'; sticker: DashboardSticker }
  | { type: 'editContacts'; sticker: DashboardSticker }
  | { type: 'transfer'; sticker: DashboardSticker }
  | { type: 'history'; sticker: DashboardSticker }
  | { type: 'deactivate'; sticker: DashboardSticker }
  | { type: 'reactivate'; sticker: DashboardSticker }
  | { type: 'delete'; sticker: DashboardSticker }
  | null;

export default function ClientDashboard({ onBack }: ClientDashboardProps) {
  const { profile, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    onBack();
  };

  // Load Google Fraunces Font dynamically for title rendering
  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
  }, []);

  // Active navigation view tab
  const [activeTab, setActiveTab] = useState<TabId>(() => {
    try {
      const saved = localStorage.getItem('repiqr-client-active-tab') || localStorage.getItem('namoqr-client-active-tab');
      if (saved && ['overview', 'activate', 'catalog', 'contacts', 'history', 'settings', 'support'].includes(saved)) {
        return saved as TabId;
      }
    } catch { /* fallback */ }
    return 'overview';
  });

  useEffect(() => {
    try {
      localStorage.setItem('repiqr-client-active-tab', activeTab);
    } catch { /* fallback */ }
  }, [activeTab]);

  // Mobile sidebar toggle
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // ─── PRODUCTS (backed by the real /api/products fleet) ───
  const [products, setProducts] = useState<DashboardSticker[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);

  const loadProducts = useCallback(async () => {
    setProductsLoading(true);
    try {
      const rows = await getProductsFromDb(profile?.id);
      const mapped = Array.isArray(rows) ? rows.map(mapProductRow) : [];
      setProducts(mapped);
      return mapped;
    } finally {
      setProductsLoading(false);
    }
  }, [profile?.id]);

  useEffect(() => {
    if (profile) loadProducts();
  }, [profile?.id, loadProducts]);

  // Drawer & Toast State
  const [drawerProductId, setDrawerProductId] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  }, []);

  const [notifBadgeVisible, setNotifBadgeVisible] = useState(true);
  const [modal, setModal] = useState<ModalState>(null);
  const [modalBusy, setModalBusy] = useState(false);
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // ─── SHARE PROFILE ───
  const handleShareProfile = (code: string) => {
    const url = `${window.location.origin}/verify/${code}`;
    navigator.clipboard.writeText(url);
    showToast(`Safety link copied: ${url}`);
  };

  // ─── EDIT DETAILS ───
  const handleSaveDetails = async (productId: string, updates: Record<string, any>) => {
    const updated = await updateProductDetailsInDb(productId, updates);
    if (updated) {
      setProducts((prev) => prev.map((p) => (p.id === productId ? mapProductRow(updated) : p)));
      showToast('Sticker details updated');
      setModal(null);
    } else {
      showToast('Failed to update sticker details');
    }
  };

  // ─── EDIT CONTACTS (shared by the drawer modal and the Emergency Contacts tab) ───
  const handleSaveContacts = async (productId: string, contacts: { name: string; phone: string }[]) => {
    const updated = await updateProductContactsInDb(productId, contacts);
    if (updated) {
      setProducts((prev) => prev.map((p) => (p.id === productId ? mapProductRow(updated) : p)));
      showToast('Emergency contacts saved');
      setModal((m) => (m && m.type === 'editContacts' && m.sticker.id === productId ? null : m));
    } else {
      showToast('Failed to save contacts');
    }
  };

  // ─── DEACTIVATE / REACTIVATE ───
  const handleSetStatus = async (sticker: DashboardSticker, active: boolean) => {
    setModalBusy(true);
    const updated = await setProductStatusInDb(sticker.id, active, sticker.qrCodeId);
    setModalBusy(false);
    if (updated) {
      setProducts((prev) => prev.map((p) => (p.id === sticker.id ? mapProductRow(updated) : p)));
      showToast(active ? 'Sticker reactivated' : 'Sticker deactivated');
      setModal(null);
    } else {
      showToast('Failed to update sticker status');
    }
  };

  // ─── TRANSFER ───
  const handleTransfer = async (productId: string, targetEmail: string) => {
    const res = await transferProductInDb(productId, targetEmail);
    if (res.success) {
      showToast('Sticker transferred successfully');
      setModal(null);
      setDrawerProductId(null);
      await loadProducts();
    }
    return res;
  };

  // ─── DELETE ───
  const handleConfirmDelete = async (sticker: DashboardSticker) => {
    setModalBusy(true);
    const ok = await deleteProductFromDb(sticker.id, sticker.qrCodeId);
    setModalBusy(false);
    if (ok) {
      setProducts((prev) => prev.filter((p) => p.id !== sticker.id));
      setDrawerProductId(null);
      setModal(null);
      showToast('Sticker removed from dashboard');
    } else {
      showToast('Failed to delete sticker');
    }
  };

  // ─── SCAN / ALERT HISTORY (single sticker, opened from the drawer) ───
  const handleOpenHistory = async (sticker: DashboardSticker) => {
    setModal({ type: 'history', sticker });
    setHistoryLoading(true);
    const data = await getProductHistoryFromDb(sticker.id);
    setHistoryData(data);
    setHistoryLoading(false);
  };

  // ─── EMERGENCY HISTORY TAB (aggregated across every sticker, fetched on demand) ───
  const [allHistory, setAllHistory] = useState<any[]>([]);
  const [allHistoryLoading, setAllHistoryLoading] = useState(false);

  useEffect(() => {
    if (activeTab !== 'history' || products.length === 0) {
      if (activeTab === 'history' && products.length === 0) setAllHistory([]);
      return;
    }
    let cancelled = false;
    (async () => {
      setAllHistoryLoading(true);
      const results = await Promise.all(
        products.map(async (p) => {
          const rows = await getProductHistoryFromDb(p.id);
          return rows.map((r: any) => ({ ...r, stickerNickname: p.nickname, stickerCode: p.qrCodeId }));
        })
      );
      if (!cancelled) {
        const merged = results.flat().sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        setAllHistory(merged);
        setAllHistoryLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [activeTab, products.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const activeProduct = drawerProductId ? products.find((p) => p.id === drawerProductId) || null : null;
  const activeCount = products.filter((p) => p.status === 'Active').length;
  const totalScans = products.reduce((s, p) => s + (p.scans || 0), 0);
  const totalContacts = products.reduce((s, p) => s + (p.contacts?.length || 0), 0);

  return (
    <div className="flex flex-col h-screen bg-[#F5F6FA] text-[#1A1D26] font-sans antialiased overflow-hidden">

      {/* ─── APP HEADER ─── */}
      <header className="h-[72px] flex-shrink-0 bg-white border-b border-[#E8ECF4] flex items-center justify-between px-6 sm:px-8 z-20">
        <div className="flex items-center gap-3.5">
          <button
            onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
            className="md:hidden w-9.5 h-9.5 rounded-xl bg-[#F5F6FA] border border-gray-200 flex items-center justify-center text-gray-700 cursor-pointer"
          >
            <Menu size={20} />
          </button>
          <button onClick={onBack} className="flex items-center cursor-pointer">
            <AppLogo variant="light" className="h-7 w-auto object-contain" />
          </button>
        </div>

        <div className="flex items-center gap-3.5">
          <div className="hidden sm:flex items-center gap-2 bg-[#DCFCE7] text-[#16A34A] px-3.5 py-1.5 rounded-full text-xs font-extrabold">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#16A34A] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#16A34A]"></span>
            </span>
            <span>{activeCount} Active Tags</span>
          </div>

          <button
            onClick={() => {
              setNotifBadgeVisible(false);
              showToast('Notifications are shown in Emergency History');
            }}
            className="relative w-10 h-10 rounded-xl bg-[#F5F6FA] border border-[#E8ECF4] flex items-center justify-center text-[#1A1D26] hover:bg-[#E2E8F0] transition-colors cursor-pointer"
          >
            <Bell size={18} />
            {notifBadgeVisible && (
              <span className="absolute -top-1 -right-1 bg-[#111111] text-white text-[10px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center">
                !
              </span>
            )}
          </button>

          <div className="flex items-center gap-2.5 pl-3 border-l border-[#E8ECF4]">
            <img
              src={profile?.avatarUrl || "https://images.unsplash.com/photo-1633332755192-727a05c4013d?auto=format&fit=crop&q=80&w=100"}
              alt="User Avatar"
              className="w-9 h-9 rounded-full object-cover border-2 border-[#111111]"
            />

            <button onClick={handleSignOut} title="Sign Out" className="text-gray-400 hover:text-red-600 transition-colors ml-1 cursor-pointer">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </header>

      {/* ─── APP BODY LAYOUT ─── */}
      <div className="flex-1 flex overflow-hidden relative">

        {/* ─── SIDEBAR ─── */}
        <aside className={`w-[236px] flex-shrink-0 bg-white border-r border-[#E8ECF4] flex flex-col justify-between p-5 z-30 transition-all duration-300 md:static fixed inset-y-0 left-0 overflow-y-auto ${
          isMobileSidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0'
        }`}>
          <div className="space-y-4">
            <nav className="space-y-1">
              {NAV_ITEMS.map((item) => (
                <button
                  key={item.id}
                  onClick={() => { setActiveTab(item.id); setIsMobileSidebarOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeTab === item.id ? 'bg-[#F1F5F9] text-[#111111]' : 'text-[#64748B] hover:bg-[#F1F5F9]'
                  }`}
                >
                  <item.icon size={17} />
                  <span>{item.label}</span>
                </button>
              ))}
            </nav>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleSignOut}
              className="w-full flex items-center justify-center gap-2 text-xs font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 py-3 rounded-xl transition-all cursor-pointer"
            >
              <LogOut size={15} /> Sign Out
            </button>
          </div>
        </aside>

        {/* ─── MAIN CONTENT VIEW PANEL ─── */}
        <main className="flex-1 overflow-y-auto p-6 sm:p-9 space-y-6">

          {/* ════ VIEW 1: MY PRODUCTS / OVERVIEW ════ */}
          {activeTab === 'overview' && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-[#1A1D26]">
                  My Safety Stickers
                </h1>
                <p className="text-xs sm:text-sm text-[#64748B] mt-1">
                  Manage your active QR tags, emergency contacts, and protection settings.
                </p>
              </div>

              {/* Stat Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white border border-[#E8ECF4] rounded-2xl p-5 shadow-2xs flex flex-col gap-2">
                  <div className="w-9 h-9 rounded-xl bg-[#F1F5F9] text-[#111111] flex items-center justify-center font-bold">
                    <ShieldCheck size={18} />
                  </div>
                  <div className="text-2xl font-bold text-[#1A1D26]">{activeCount}</div>
                  <div className="text-xs font-semibold text-[#64748B]">Active Tags</div>
                </div>

                <div className="bg-white border border-[#E8ECF4] rounded-2xl p-5 shadow-2xs flex flex-col gap-2">
                  <div className="w-9 h-9 rounded-xl bg-[#DBEAFE] text-[#2563EB] flex items-center justify-center font-bold">
                    <Eye size={18} />
                  </div>
                  <div className="text-2xl font-bold text-[#1A1D26]">{totalScans}</div>
                  <div className="text-xs font-semibold text-[#64748B]">Total Scans Received</div>
                </div>

                <div className="bg-white border border-[#E8ECF4] rounded-2xl p-5 shadow-2xs flex flex-col gap-2">
                  <div className="w-9 h-9 rounded-xl bg-[#FEE2E2] text-[#DC2626] flex items-center justify-center font-bold">
                    <Users size={18} />
                  </div>
                  <div className="text-2xl font-bold text-[#1A1D26]">{totalContacts}</div>
                  <div className="text-xs font-semibold text-[#64748B]">Emergency Contacts</div>
                </div>

                <div className="bg-white border border-[#E8ECF4] rounded-2xl p-5 shadow-2xs flex flex-col gap-2">
                  <div className="w-9 h-9 rounded-xl bg-[#DCFCE7] text-[#16A34A] flex items-center justify-center font-bold">
                    <Grid size={18} />
                  </div>
                  <div className="text-2xl font-bold text-[#1A1D26]">{products.length}</div>
                  <div className="text-xs font-semibold text-[#64748B]">Total Connected Tags</div>
                </div>
              </div>

              {/* Product Grid OR Empty / Loading State */}
              {productsLoading ? (
                <div className="bg-white border border-[#E8ECF4] rounded-3xl p-16 text-center shadow-sm flex flex-col items-center gap-3">
                  <Loader2 size={24} className="animate-spin text-[#64748B]" />
                  <p className="text-xs font-semibold text-[#64748B]">Loading your stickers…</p>
                </div>
              ) : products.length === 0 ? (
                <div className="bg-white border border-[#E8ECF4] rounded-3xl p-12 text-center space-y-3 shadow-sm max-w-md mx-auto">
                  <div className="w-14 h-14 rounded-full bg-[#F1F5F9] flex items-center justify-center mx-auto text-2xl">🛡️</div>
                  <h3 className="text-lg font-bold text-[#1A1D26]">No QR Tags Found</h3>
                  <p className="text-xs text-[#64748B] leading-relaxed">
                    Scan the QR code on your physical safety sticker to activate it and connect it to your account.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {products.map(p => (
                    <div
                      key={p.id}
                      className="bg-white border border-[#E8ECF4] rounded-2xl p-5 shadow-2xs hover:shadow-lg hover:-translate-y-1 transition-all relative overflow-hidden flex flex-col justify-between"
                    >
                      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#111111] to-[#3B3B3B]" />
                      <div className="absolute top-0 right-0 w-6.5 h-6.5 bg-[#F5F6FA] rounded-bl-xl" />

                      <div>
                        {/* Top Header */}
                        <div className="flex items-start justify-between gap-2 mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10.5 h-10.5 rounded-xl bg-[#F1F5F9] flex items-center justify-center text-xl flex-shrink-0">
                              {getCategoryIcon(p.category as any) || '🏷️'}
                            </div>
                            <div>
                              <h3 className="font-bold text-base text-[#1A1D26] leading-tight">{p.nickname}</h3>
                              <p className="text-[11px] font-semibold text-[#94A3B8]">{getCategoryLabel(p.category as any) || p.code}</p>
                            </div>
                          </div>

                          <span className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full ${
                            p.status === 'Active' ? 'bg-[#DCFCE7] text-[#16A34A]' :
                            p.status === 'Lost' ? 'bg-[#FEE2E2] text-[#DC2626]' :
                            p.status === 'Replaced' ? 'bg-[#DBEAFE] text-[#2563EB]' :
                            'bg-[#FEF3C7] text-[#B45309]'
                          }`}>
                            {p.status}
                          </span>
                        </div>

                        {/* Meta List */}
                        <div className="space-y-1.5 my-3 text-xs border-y border-dashed border-[#E8ECF4] py-2.5">
                          {p.meta?.map((m, idx) => (
                            <div key={idx} className="flex justify-between">
                              <span className="text-[#94A3B8]">{m[0]}</span>
                              <span className="font-semibold text-[#1A1D26]">{m[1]}</span>
                            </div>
                          ))}
                          <div className="flex justify-between">
                            <span className="text-[#94A3B8]">Total Scans</span>
                            <span className="font-semibold text-[#1A1D26]">{p.scans || 0}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-[#94A3B8]">Last Scan</span>
                            <span className="font-semibold text-[#1A1D26]">{p.lastScan || 'Never'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="pt-3 border-t border-[#E8ECF4] flex items-center gap-2">
                        <button
                          onClick={() => setDrawerProductId(p.id)}
                          className="flex-1 py-2.5 rounded-xl bg-[#111111] hover:bg-black text-xs font-bold text-white transition-colors cursor-pointer"
                        >
                          Manage Tag
                        </button>
                        <button
                          onClick={() => setModal({ type: 'delete', sticker: p })}
                          title="Delete sticker"
                          className="w-10 h-10 rounded-xl bg-[#FEE2E2] text-[#DC2626] hover:bg-[#FECACA] flex items-center justify-center transition-colors cursor-pointer"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ════ VIEW 4: EMERGENCY CONTACTS ════ */}
          {activeTab === 'contacts' && (
            <EmergencyContactsPanel products={products} onSaveContacts={handleSaveContacts} />
          )}

          {/* ════ VIEW 5: EMERGENCY HISTORY (all stickers) ════ */}
          {activeTab === 'history' && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-[#1A1D26]">Emergency &amp; Activity History</h1>
                <p className="text-xs sm:text-sm text-[#64748B] mt-1">Every scan and alert, across all your tags.</p>
              </div>

              <div className="bg-white border border-[#E8ECF4] rounded-3xl p-6 sm:p-8 max-w-3xl space-y-4 shadow-sm">
                {allHistoryLoading ? (
                  <div className="text-center py-12 flex flex-col items-center gap-3">
                    <Loader2 size={22} className="animate-spin text-[#64748B]" />
                    <p className="text-xs font-semibold text-[#64748B]">Loading activity…</p>
                  </div>
                ) : allHistory.length === 0 ? (
                  <div className="text-center py-12 space-y-2">
                    <div className="text-4xl mb-2">🛡️</div>
                    <h3 className="font-bold text-lg text-[#1A1D26]">All clear</h3>
                    <p className="text-xs text-[#64748B] max-w-xs mx-auto">No security logs recorded yet. Your family's network is quiet.</p>
                  </div>
                ) : (
                  allHistory.map((log: any, i: number) => (
                    <div key={log.id || i} className="flex gap-4 relative pb-4 last:pb-0">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 z-10 ${
                        log.status === 'unread' ? 'bg-[#FEE2E2] text-[#DC2626]' :
                        log.status === 'acknowledged' ? 'bg-[#FEF3C7] text-[#B45309]' :
                        'bg-[#DCFCE7] text-[#16A34A]'
                      }`}>
                        {log.status === 'unread' ? '⚠️' : '🛡️'}
                      </div>
                      <div className="flex-1 bg-[#F5F6FA] rounded-xl p-3.5 border border-[#E8ECF4]">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-bold text-xs text-[#1A1D26] capitalize">{log.stickerNickname} — {String(log.type || 'event').replace(/_/g, ' ')}</span>
                          <span className="text-[10px] text-[#94A3B8]">{log.created_at ? new Date(log.created_at).toLocaleString() : ''}</span>
                        </div>
                        <p className="text-xs text-[#64748B]">{log.message} <span className="font-mono text-[10px] text-[#94A3B8]">[{log.stickerCode}]</span></p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* ════ VIEW 6: ACCOUNT SETTINGS ════ */}
          {activeTab === 'settings' && (
            <AccountSettingsPanel showToast={showToast} onAccountDeleted={handleSignOut} />
          )}

          {/* ════ VIEW 7: SUPPORT & LEGAL ════ */}
          {activeTab === 'support' && (
            <SupportLegalPanel showToast={showToast} />
          )}

        </main>
      </div>

      {/* ─── SLIDE-OVER DRAWER ─── */}
      <div
        className={`fixed inset-0 bg-[#111111]/40 z-40 transition-opacity duration-300 ${
          activeProduct ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setDrawerProductId(null)}
      />

      <aside className={`fixed top-0 right-0 bottom-0 w-[440px] max-w-[92vw] bg-[#F5F6FA] z-50 shadow-2xl transition-transform duration-300 ease-out flex flex-col ${
        activeProduct ? 'translate-x-0' : 'translate-x-full'
      }`}>
        {activeProduct && (
          <>
            <div className="flex justify-between items-center px-6 py-5 border-b border-[#E8ECF4] bg-white">
              <h3 className="font-bold text-lg text-[#1A1D26]">{activeProduct.nickname}</h3>
              <button onClick={() => setDrawerProductId(null)} className="w-8 h-8 rounded-full bg-[#F5F6FA] flex items-center justify-center text-gray-500 hover:text-gray-900 cursor-pointer">
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* QR Box */}
              <div className="bg-white border border-[#E8ECF4] rounded-2xl p-5 text-center space-y-3">
                <div className="w-32 h-32 bg-white border border-[#E8ECF4] rounded-2xl p-2 mx-auto shadow-inner flex items-center justify-center">
                  <svg viewBox="0 0 120 120" className="w-full h-full">
                    <rect x="5" y="5" width="26" height="26" rx="4" fill="none" stroke="#201C15" strokeWidth="6"/>
                    <rect x="11" y="11" width="14" height="14" rx="2" fill="#201C15"/>
                    <rect x="89" y="5" width="26" height="26" rx="4" fill="none" stroke="#201C15" strokeWidth="6"/>
                    <rect x="95" y="11" width="14" height="14" rx="2" fill="#201C15"/>
                    <rect x="5" y="89" width="26" height="26" rx="4" fill="none" stroke="#201C15" strokeWidth="6"/>
                    <rect x="11" y="95" width="14" height="14" rx="2" fill="#201C15"/>
                    <rect x="42" y="10" width="8" height="8" fill="#201C15"/>
                    <rect x="62" y="15" width="12" height="6" fill="#201C15"/>
                    <rect x="36" y="44" width="48" height="32" rx="6" fill="#111111"/>
                    <text x="60" y="64" fill="#fff" fontFamily="Inter" fontSize="9" fontWeight="800" textAnchor="middle">NamoQR</text>
                  </svg>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleShareProfile(activeProduct.qrCodeId)}
                    className="flex-1 py-2 rounded-xl bg-[#111111] hover:bg-black text-xs font-bold text-white cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Share2 size={12} /> Share Profile
                  </button>
                  <button
                    onClick={() => { setDrawerProductId(null); onBack(); }}
                    className="flex-1 py-2 rounded-xl bg-[#F5F6FA] border border-[#E8ECF4] text-xs font-bold text-[#1A1D26] hover:bg-[#E2E8F0] cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <ShoppingBag size={12} /> Buy More
                  </button>
                </div>
              </div>

              {/* Stat Grid */}
              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="bg-white border border-[#E8ECF4] rounded-xl p-3">
                  <span className="text-xl font-bold block text-[#1A1D26]">{activeProduct.scans || 0}</span>
                  <span className="text-[10px] font-bold text-[#64748B]">Total Scans</span>
                </div>
                <div className="bg-white border border-[#E8ECF4] rounded-xl p-3">
                  <span className={`text-xl font-bold block ${activeProduct.status === 'Active' ? 'text-[#16A34A]' : 'text-[#B45309]'}`}>{activeProduct.status}</span>
                  <span className="text-[10px] font-bold text-[#64748B]">Status</span>
                </div>
              </div>

              {/* Emergency Contacts Card */}
              <div className="bg-white border border-[#E8ECF4] rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs text-[#1A1D26]">Emergency Contacts</h4>
                  <button
                    onClick={() => setModal({ type: 'editContacts', sticker: activeProduct })}
                    className="text-[10px] font-bold text-[#2563EB] hover:underline cursor-pointer"
                  >
                    Edit
                  </button>
                </div>
                {activeProduct.contacts.length === 0 ? (
                  <p className="text-xs text-[#94A3B8] italic">No emergency contacts added yet.</p>
                ) : (
                  activeProduct.contacts.map((c, idx) => (
                    <div key={idx} className="flex justify-between items-center text-xs">
                      <span className="font-bold text-[#1A1D26]">{c.name}</span>
                      <span className="font-mono text-[#64748B]">{c.phone}</span>
                    </div>
                  ))
                )}
              </div>

              {/* Sticker Actions */}
              <div className="bg-white border border-[#E8ECF4] rounded-2xl p-4 space-y-2">
                <h4 className="font-bold text-xs text-[#1A1D26] mb-1">Sticker Actions</h4>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setModal({ type: 'editDetails', sticker: activeProduct })}
                    className="py-2.5 rounded-xl bg-[#F5F6FA] border border-[#E8ECF4] text-xs font-bold text-[#1A1D26] hover:bg-[#E2E8F0] cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Pencil size={13} /> Edit Details
                  </button>
                  <button
                    onClick={() => setModal({ type: 'editContacts', sticker: activeProduct })}
                    className="py-2.5 rounded-xl bg-[#F5F6FA] border border-[#E8ECF4] text-xs font-bold text-[#1A1D26] hover:bg-[#E2E8F0] cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Users size={13} /> Edit Contacts
                  </button>
                  <button
                    onClick={() => handleOpenHistory(activeProduct)}
                    className="py-2.5 rounded-xl bg-[#F5F6FA] border border-[#E8ECF4] text-xs font-bold text-[#1A1D26] hover:bg-[#E2E8F0] cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <History size={13} /> Scan History
                  </button>
                  <button
                    onClick={() => setModal({ type: 'transfer', sticker: activeProduct })}
                    className="py-2.5 rounded-xl bg-[#F5F6FA] border border-[#E8ECF4] text-xs font-bold text-[#1A1D26] hover:bg-[#E2E8F0] cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <ArrowRightLeft size={13} /> Transfer
                  </button>
                </div>
                {activeProduct.status === 'Active' ? (
                  <button
                    onClick={() => setModal({ type: 'deactivate', sticker: activeProduct })}
                    className="w-full py-2.5 rounded-xl bg-[#FEF3C7] hover:bg-[#FDE68A] text-xs font-bold text-[#B45309] cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Power size={13} /> Deactivate Sticker
                  </button>
                ) : (
                  <button
                    onClick={() => setModal({ type: 'reactivate', sticker: activeProduct })}
                    className="w-full py-2.5 rounded-xl bg-[#DCFCE7] hover:bg-[#BBF7D0] text-xs font-bold text-[#16A34A] cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <RefreshCcw size={13} /> Reactivate Sticker
                  </button>
                )}
              </div>

              {/* Danger Zone */}
              <div className="bg-white border border-[#FECACA] rounded-2xl p-4">
                <button
                  onClick={() => setModal({ type: 'delete', sticker: activeProduct })}
                  className="w-full py-2.5 rounded-xl bg-[#FEE2E2] hover:bg-[#FECACA] text-xs font-bold text-[#DC2626] transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Trash2 size={13} /> Delete Tag
                </button>
              </div>
            </div>
          </>
        )}
      </aside>

      {/* ─── STICKER ACTION MODALS ─── */}
      {modal?.type === 'editDetails' && (
        <EditDetailsModal
          sticker={modal.sticker}
          onClose={() => setModal(null)}
          onSave={(updates) => handleSaveDetails(modal.sticker.id, updates)}
        />
      )}
      {modal?.type === 'editContacts' && (
        <EditContactsModal
          sticker={modal.sticker}
          onClose={() => setModal(null)}
          onSave={(contacts) => handleSaveContacts(modal.sticker.id, contacts)}
        />
      )}
      {modal?.type === 'transfer' && (
        <TransferModal
          sticker={modal.sticker}
          onClose={() => setModal(null)}
          onTransfer={(email) => handleTransfer(modal.sticker.id, email)}
        />
      )}
      {modal?.type === 'history' && (
        <ScanHistoryModal
          sticker={modal.sticker}
          history={historyData}
          loading={historyLoading}
          onClose={() => setModal(null)}
        />
      )}
      {modal?.type === 'deactivate' && (
        <ConfirmActionModal
          title="Deactivate this sticker?"
          description={<><span className="font-bold text-gray-900">{modal.sticker.nickname}</span> will stop triggering alerts and hide contact details on scan until you reactivate it.</>}
          confirmLabel="Deactivate"
          tone="warning"
          busy={modalBusy}
          onCancel={() => setModal(null)}
          onConfirm={() => handleSetStatus(modal.sticker, false)}
        />
      )}
      {modal?.type === 'reactivate' && (
        <ConfirmActionModal
          title="Reactivate this sticker?"
          description={<><span className="font-bold text-gray-900">{modal.sticker.nickname}</span> will go live again — scans will resume triggering alerts.</>}
          confirmLabel="Reactivate"
          tone="info"
          busy={modalBusy}
          onCancel={() => setModal(null)}
          onConfirm={() => handleSetStatus(modal.sticker, true)}
        />
      )}
      {modal?.type === 'delete' && (
        <ConfirmActionModal
          title="Delete this sticker?"
          description={<><span className="font-bold text-gray-900">{modal.sticker.nickname}</span> will be permanently removed from your dashboard. This cannot be undone.</>}
          confirmLabel="Delete"
          tone="danger"
          busy={modalBusy}
          onCancel={() => setModal(null)}
          onConfirm={() => handleConfirmDelete(modal.sticker)}
        />
      )}

      {/* ─── TOAST NOTIFICATION ─── */}
      {toastMsg && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#111111] text-white px-5 py-3 rounded-full text-xs font-bold shadow-2xl animate-bounce flex items-center gap-2">
          <Sparkles size={15} className="text-white" />
          <span>{toastMsg}</span>
        </div>
      )}
    </div>
  );
}

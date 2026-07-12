import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Crown, X, Settings } from 'lucide-react';
import Sidebar from './dashboard/Sidebar';
import Header from './dashboard/Header';
import StatCards from './dashboard/StatCards';
import ProductCard from './dashboard/ProductCard';
import ActivationWizard from './dashboard/ActivationWizard';
import ProductDrawer from './dashboard/ProductDrawer';
import CatalogView from './dashboard/CatalogView';
import HistoryView from './dashboard/HistoryView';
import Toast from './dashboard/Toast';
import { NamoProduct, QRCodeData, Report, UserProfile, ProductCategory, ProductStatus } from '../types';

interface DashboardViewProps {
  user: UserProfile;
  products: NamoProduct[];
  qrCodes: QRCodeData[];
  reports: Report[];
  onLogout: () => void;
  onUpdateProducts: (p: NamoProduct[]) => void;
  onUpdateQrCodes: (q: QRCodeData[]) => void;
  onUpdateReports: (r: Report[]) => void;
  onUpdateUser: (u: UserProfile) => void;
  onSimulatePublicScan: (qrId: string) => void;
}

export default function DashboardView({
  user, products, qrCodes, reports, onLogout, onUpdateProducts, onUpdateQrCodes, onUpdateReports, onUpdateUser, onSimulatePublicScan,
}: DashboardViewProps) {
  const [activeTab, setActiveTab] = useState<string>('my_products');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [drawerProduct, setDrawerProduct] = useState<NamoProduct | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const showToast = useCallback((msg: string) => { setToastMsg(msg); setToastVisible(true); }, []);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editFamily, setEditFamily] = useState('');
  const [editMake, setEditMake] = useState('');
  const [editModel, setEditModel] = useState('');
  const [editColor, setEditColor] = useState('');
  const [editPlate, setEditPlate] = useState('');
  const [editInsurance, setEditInsurance] = useState('');
  const [editHouseProfile, setEditHouseProfile] = useState('');
  const [editInstructions, setEditInstructions] = useState('');
  const [editOwnerName, setEditOwnerName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editNote, setEditNote] = useState('');
  const [editBlood, setEditBlood] = useState('O+');
  const [editConditions, setEditConditions] = useState('');
  const [editAllergies, setEditAllergies] = useState('');
  const [editChildEmail, setEditChildEmail] = useState('');
  const [editChildSchool, setEditChildSchool] = useState('');
  const [editChildBus, setEditChildBus] = useState('');

  const [isReplaceModalOpen, setIsReplaceModalOpen] = useState(false);
  const [replacingProductId, setReplacingProductId] = useState<string | null>(null);
  const [newQrId, setNewQrId] = useState('');
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [transferringProductId, setTransferringProductId] = useState<string | null>(null);
  const [transferEmail, setTransferEmail] = useState('');

  const totalScans = products.reduce((sum, p) => sum + p.scansCount, 0);
  const activeCount = products.filter((p) => p.status === 'active').length;
  const unreadCount = reports.filter((r) => r.status === 'unread').length;

  const handleSimulateScan = (p: NamoProduct) => {
    const updated = products.map((prod) =>
      prod.id === p.id ? { ...prod, scansCount: prod.scansCount + 1, lastScannedAt: new Date().toISOString() } : prod
    );
    onUpdateProducts(updated);
    showToast(`Scan simulated on ${p.name}`);
    if (drawerOpen && drawerProduct?.id === p.id) setDrawerProduct(updated.find((x) => x.id === p.id) || null);
  };
  const handleManage = (p: NamoProduct) => { setDrawerProduct(p); setDrawerOpen(true); };
  const handleChangeStatus = (id: string, status: ProductStatus) => {
    const updated = products.map((p) => (p.id === id ? { ...p, status } : p));
    onUpdateProducts(updated);
    setDrawerProduct(updated.find((x) => x.id === id) || null);
    showToast(`Status updated to ${status}`);
  };
  const handleShareProfile = (p: NamoProduct) => showToast(`Safety link copied: namoqr.com/verify/${p.qrCodeId}`);
  const handleActivateNew = (product: NamoProduct, qrCode: QRCodeData) => {
    onUpdateProducts([product, ...products]);
    const qrExists = qrCodes.some((q) => q.id === qrCode.id);
    if (qrExists) onUpdateQrCodes(qrCodes.map((q) => (q.id === qrCode.id ? { ...q, vehicleId: product.id, status: 'active' as const } : q)));
    else onUpdateQrCodes([qrCode, ...qrCodes]);
    showToast(`${product.name} activated successfully!`);
    setActiveTab('my_products');
  };

  const handleEditClick = (p: NamoProduct) => {
    setEditingProductId(p.id); setEditName(p.name); setEditFamily(p.assignedTo);
    setEditMake(p.details.make || ''); setEditModel(p.details.model || ''); setEditColor(p.details.color || '');
    setEditPlate(p.details.licensePlate || ''); setEditInsurance(p.details.insuranceDetails || '');
    setEditHouseProfile(p.details.houseProfile || ''); setEditInstructions(p.details.emergencyInstructions || '');
    setEditOwnerName(p.details.ownerName || ''); setEditPhone(p.details.recoverySupportPhone || '');
    setEditNote(p.details.lostFoundNote || ''); setEditBlood(p.details.bloodGroup || 'O+');
    setEditConditions(p.details.medicalConditions || ''); setEditAllergies(p.details.allergies || '');
    setEditChildEmail(p.details.parentNotificationEmail || ''); setEditChildSchool(p.details.schoolName || '');
    setEditChildBus(p.details.busDetails || ''); setIsEditModalOpen(true);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProductId) return;
    const updated = products.map((p) => {
      if (p.id !== editingProductId) return p;
      let details: NamoProduct['details'] = {};
      if (p.category === 'car' || p.category === 'bike') details = { make: editMake, model: editModel, color: editColor, licensePlate: editPlate.toUpperCase(), insuranceDetails: editInsurance };
      else if (p.category === 'home') details = { houseProfile: editHouseProfile, emergencyInstructions: editInstructions, availabilityStatus: p.details.availabilityStatus };
      else if (p.category === 'luggage') details = { travelMode: p.details.travelMode, ownerName: editOwnerName, recoverySupportPhone: editPhone, lostFoundNote: editNote };
      else if (p.category === 'keychain') details = { bloodGroup: editBlood, medicalConditions: editConditions, allergies: editAllergies };
      else if (p.category === 'child') details = { parentNotificationEmail: editChildEmail, schoolName: editChildSchool, busDetails: editChildBus, pickupVerificationCode: p.details.pickupVerificationCode };
      return { ...p, name: editName, assignedTo: editFamily, details };
    });
    onUpdateProducts(updated);
    setIsEditModalOpen(false);
    setEditingProductId(null);
    showToast('Product details updated');
  };

  const handleReplaceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replacingProductId || !newQrId.trim()) return;
    const updated = products.map((p) => p.id === replacingProductId ? { ...p, qrCodeId: newQrId.toUpperCase() } : p);
    onUpdateProducts(updated);
    if (!qrCodes.some((q) => q.id === newQrId.toUpperCase())) onUpdateQrCodes([{ id: newQrId.toUpperCase(), vehicleId: replacingProductId, status: 'active', scansCount: 0, createdAt: new Date().toISOString() }, ...qrCodes]);
    setIsReplaceModalOpen(false); setReplacingProductId(null); setNewQrId(''); showToast('Tag replaced successfully');
  };

  const handleTransferSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferringProductId || !transferEmail.trim()) return;
    const target = products.find((p) => p.id === transferringProductId);
    onUpdateProducts(products.filter((p) => p.id !== transferringProductId));
    if (target) onUpdateQrCodes(qrCodes.map((q) => (q.id === target.qrCodeId ? { ...q, vehicleId: null, status: 'unlinked' as const } : q)));
    setIsTransferModalOpen(false); setTransferringProductId(null); setTransferEmail(''); showToast(`Ownership transferred to ${transferEmail}`);
  };

  const handleDeleteProduct = (pId: string) => {
    if (!confirm('Are you sure you want to delete and unlink this safety product?')) return;
    const target = products.find((p) => p.id === pId);
    onUpdateProducts(products.filter((p) => p.id !== pId));
    if (target) onUpdateQrCodes(qrCodes.map((q) => (q.id === target.qrCodeId ? { ...q, vehicleId: null, status: 'unlinked' as const } : q)));
    showToast('Product deleted');
  };

  const handleAcknowledgeReport = (id: string) => onUpdateReports(reports.map((r) => (r.id === id ? { ...r, status: 'acknowledged' as const } : r)));
  const handleResolveReport = (id: string) => onUpdateReports(reports.map((r) => (r.id === id ? { ...r, status: 'resolved' as const } : r)));
  const handleDeleteReport = (id: string) => onUpdateReports(reports.filter((r) => r.id !== id));

  const viewTitles: Record<string, { title: string; sub: string }> = {
    my_products: { title: 'Welcome back, Mihir.', sub: "Here's what's happening across your family's safety network." },
    alerts: { title: 'Emergency & Activity History', sub: 'Every scan and alert, across all your tags.' },
    shop: { title: 'Product Catalog & Pre-orders', sub: 'Expand your family\'s safety network with upcoming products.' },
    settings: { title: 'Account Settings', sub: 'Manage your profile and subscription.' },
  };
  const currentView = viewTitles[activeTab] || viewTitles.my_products;

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#F6F1E7]">
      <Header user={user} activeCount={activeCount} notifCount={unreadCount} onNotifClick={() => { showToast(`${unreadCount} unread alerts`); setActiveTab('alerts'); }} onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar activeTab={activeTab} onTabChange={setActiveTab} onActivateNew={() => setIsWizardOpen(true)} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="flex-1 overflow-y-auto p-[30px_34px_60px] max-md:p-[22px_18px_60px]">
          <div className="flex justify-between items-end mb-6 flex-wrap gap-3.5">
            <div>
              <h1 className="font-['Fraunces',Georgia,serif] text-[26px] font-semibold">{currentView.title}</h1>
              <p className="text-[13.5px] text-[#6E6759] mt-1">{currentView.sub}</p>
            </div>
            {activeTab === 'my_products' && (
              <button onClick={() => setIsWizardOpen(true)} className="inline-flex items-center justify-center gap-2 font-bold text-[13.5px] px-5 py-3 rounded-full bg-[#E25822] text-white shadow-[0_12px_22px_-10px_rgba(226,88,34,0.5)] hover:bg-[#C4471A] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.97] transition-all cursor-pointer">
                <Plus size={14} /> Create Sticker 
              </button>
            )}
          </div>

          {(activeTab === 'my_products' || activeTab === 'dashboard') && (
            <div className="animate-[fadeUp_0.4s_cubic-bezier(.16,1,.3,1)]">
              <StatCards products={products} reports={reports} totalScans={totalScans} />
              {products.length === 0 ? (
                <div className="text-center py-[70px] px-5">
                  <div className="w-[60px] h-[60px] rounded-full bg-[#EEE4CF] flex items-center justify-center text-[26px] mx-auto mb-4">🛡️</div>
                  <h3 className="font-['Fraunces',Georgia,serif] text-[19px] font-semibold mb-1.5">No products yet</h3>
                  <p className="text-[13px] text-[#6E6759] max-w-[320px] mx-auto">Register your first NamoQR sticker to start building your safety network.</p>
                </div>
              ) : (
                <div className="grid grid-cols-[repeat(auto-fill,minmax(290px,1fr))] gap-[18px]">
                  {products.map((p) => <ProductCard key={p.id} product={p} onManage={handleManage} onSimulateScan={handleSimulateScan} />)}
                </div>
              )}
            </div>
          )}

          {activeTab === 'alerts' && (
            <div className="animate-[fadeUp_0.4s_cubic-bezier(.16,1,.3,1)]">
              <HistoryView products={products} onClear={() => { onUpdateProducts(products.map((p) => ({ ...p, scansCount: 0, lastScannedAt: undefined }))); showToast('All logs cleared'); }} />
            </div>
          )}

          {activeTab === 'shop' && (
            <div className="animate-[fadeUp_0.4s_cubic-bezier(.16,1,.3,1)]">
              <CatalogView onPreOrder={(name) => showToast(`${name} pre-order registered!`)} />
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-6 animate-[fadeUp_0.4s_cubic-bezier(.16,1,.3,1)]">
              <div className="bg-[#FFFEFB] border border-[rgba(32,28,21,0.10)] rounded-[18px] p-6">
                <h4 className="font-sans font-bold text-sm text-[#201C15] uppercase tracking-wider mb-4 pb-2 border-b border-[rgba(32,28,21,0.10)]">Profile Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block text-[9px] font-bold uppercase tracking-wider text-[#6E6759] mb-1.5 pl-1">Email Username</label>
                    <input type="text" disabled value={user.email} className="w-full p-3 bg-[#EEE4CF] border border-[rgba(32,28,21,0.10)] rounded cursor-not-allowed opacity-60" />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold uppercase tracking-wider text-[#6E6759] mb-1.5 pl-1">Account Owner Name</label>
                    <input type="text" value={user.fullName} onChange={(e) => onUpdateUser({ ...user, fullName: e.target.value })} className="w-full p-3 bg-[#EEE4CF] border border-[rgba(32,28,21,0.10)] rounded text-[#201C15] outline-none focus:border-[#E25822]" />
                  </div>
                </div>
              </div>
              <div className="bg-[#FFFEFB] border border-[rgba(32,28,21,0.10)] rounded-[18px] p-6">
                <div className="flex justify-between items-start mb-4 pb-2 border-b border-[rgba(32,28,21,0.10)]">
                  <div>
                    <h4 className="font-sans font-bold text-sm text-[#201C15] uppercase tracking-wider">Subscription Tier</h4>
                    <p className="text-xs text-[#6E6759] mt-1 font-sans">Toggle security parameters and priority SOS message limits.</p>
                  </div>
                  <span className="px-2.5 py-1 bg-[#FBEBE1] border border-[rgba(226,88,34,0.2)] rounded-full font-sans text-[10px] font-bold text-[#E25822] uppercase tracking-widest inline-flex items-center gap-1">
                    <Crown size={10} /> {user.subscriptionPlan === 'pro' ? 'PRO ACTIVE' : 'FREE'}
                  </span>
                </div>
                <div className="p-4 bg-[#EEE4CF] border border-[rgba(32,28,21,0.10)] rounded-lg mb-6 flex justify-between items-center">
                  <div className="text-xs space-y-1">
                    <strong className="text-[#201C15] block uppercase tracking-wide">NamoQR Premium Shield</strong>
                    <p className="text-[#6E6759] max-w-lg leading-relaxed">SMS callback forwarding, emergency geolocations, real-time alert logs, and unlimited product profiles.</p>
                  </div>
                  <span className="text-xl font-bold font-mono">$5/mo</span>
                </div>
                <div className="flex justify-end">
                  <button onClick={() => { const next = user.subscriptionPlan === 'pro' ? 'free' : 'pro'; onUpdateUser({ ...user, subscriptionPlan: next, isSubscribed: next === 'pro' }); }} className="py-2.5 px-6 bg-[#EEE4CF] border border-[rgba(32,28,21,0.10)] text-xs font-bold uppercase tracking-wider text-[#201C15] rounded-full transition-all cursor-pointer hover:bg-[#F6F1E7]">
                    Switch to {user.subscriptionPlan === 'pro' ? 'Free basic' : 'Upgrade to Pro'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      <AnimatePresence>
        {isWizardOpen && (
          <div className="fixed inset-0 bg-[rgba(32,28,21,0.6)] backdrop-blur-[2px] flex items-center justify-center p-4 z-50">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="max-w-[800px] w-full">
              <ActivationWizard isOpen={isWizardOpen} onClose={() => setIsWizardOpen(false)} products={products} qrCodes={qrCodes} onActivate={handleActivateNew} />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ProductDrawer isOpen={drawerOpen} product={drawerProduct} onClose={() => setDrawerOpen(false)} onSimulateScan={handleSimulateScan} onChangeStatus={handleChangeStatus} onShareProfile={handleShareProfile} />

      <AnimatePresence>
        {isEditModalOpen && editingProductId && (
          <div className="fixed inset-0 bg-[rgba(32,28,21,0.6)] backdrop-blur-[2px] flex items-center justify-center p-4 z-50">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-[#FFFEFB] border border-[rgba(32,28,21,0.10)] rounded-[22px] max-w-lg w-full overflow-hidden text-left">
              <div className="p-5 border-b border-[rgba(32,28,21,0.10)] flex justify-between items-center bg-[#EEE4CF]">
                <h3 className="text-sm font-bold uppercase tracking-wider text-[#201C15]">Edit Product Details</h3>
                <button onClick={() => setIsEditModalOpen(false)} className="text-[#A79E8B] hover:text-[#201C15] bg-transparent border-none outline-none cursor-pointer"><X size={18} /></button>
              </div>
              <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-[9px] font-bold uppercase tracking-wider text-[#6E6759] mb-1 pl-1">Product Nickname</label>
                  <input type="text" required value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full p-2.5 bg-[#EEE4CF] border border-[rgba(32,28,21,0.10)] rounded text-xs outline-none focus:border-[#E25822]" />
                </div>
                <div>
                  <label className="block text-[9px] font-bold uppercase tracking-wider text-[#6E6759] mb-1 pl-1">Assigned Family Member</label>
                  <input type="text" required value={editFamily} onChange={(e) => setEditFamily(e.target.value)} className="w-full p-2.5 bg-[#EEE4CF] border border-[rgba(32,28,21,0.10)] rounded text-xs outline-none focus:border-[#E25822]" />
                </div>
                {(() => {
                  const p = products.find((prod) => prod.id === editingProductId);
                  if (!p) return null;
                  if (p.category === 'car' || p.category === 'bike') return (
                    <div className="space-y-3 pt-3 border-t border-[rgba(32,28,21,0.10)]">
                      <span className="block text-[9px] font-bold text-[#E25822] uppercase">Vehicle Parameters</span>
                      <div className="grid grid-cols-2 gap-3">
                        <input type="text" placeholder="Make" value={editMake} onChange={(e) => setEditMake(e.target.value)} className="p-2.5 bg-[#EEE4CF] border border-[rgba(32,28,21,0.10)] rounded text-xs outline-none" />
                        <input type="text" placeholder="Model" value={editModel} onChange={(e) => setEditModel(e.target.value)} className="p-2.5 bg-[#EEE4CF] border border-[rgba(32,28,21,0.10)] rounded text-xs outline-none" />
                        <input type="text" placeholder="Color" value={editColor} onChange={(e) => setEditColor(e.target.value)} className="p-2.5 bg-[#EEE4CF] border border-[rgba(32,28,21,0.10)] rounded text-xs outline-none" />
                        <input type="text" placeholder="License Plate" value={editPlate} onChange={(e) => setEditPlate(e.target.value)} className="p-2.5 bg-[#EEE4CF] border border-[rgba(32,28,21,0.10)] rounded text-xs outline-none uppercase font-mono" />
                      </div>
                    </div>
                  );
                  if (p.category === 'home') return (
                    <div className="space-y-3 pt-3 border-t border-[rgba(32,28,21,0.10)]">
                      <span className="block text-[9px] font-bold text-[#E25822] uppercase">Home Gate Parameters</span>
                      <input type="text" placeholder="House Profile" value={editHouseProfile} onChange={(e) => setEditHouseProfile(e.target.value)} className="w-full p-2.5 bg-[#EEE4CF] border border-[rgba(32,28,21,0.10)] rounded text-xs outline-none" />
                      <textarea placeholder="Emergency instructions" value={editInstructions} onChange={(e) => setEditInstructions(e.target.value)} className="w-full p-2.5 bg-[#EEE4CF] border border-[rgba(32,28,21,0.10)] rounded text-xs outline-none resize-none" rows={2} />
                    </div>
                  );
                  if (p.category === 'luggage') return (
                    <div className="space-y-3 pt-3 border-t border-[rgba(32,28,21,0.10)]">
                      <span className="block text-[9px] font-bold text-[#E25822] uppercase">Luggage Parameters</span>
                      <input type="text" placeholder="Owner Name" value={editOwnerName} onChange={(e) => setEditOwnerName(e.target.value)} className="w-full p-2.5 bg-[#EEE4CF] border border-[rgba(32,28,21,0.10)] rounded text-xs outline-none" />
                      <input type="tel" placeholder="Backup Phone" value={editPhone} onChange={(e) => setEditPhone(e.target.value)} className="w-full p-2.5 bg-[#EEE4CF] border border-[rgba(32,28,21,0.10)] rounded text-xs outline-none" />
                      <textarea placeholder="Lost-found note" value={editNote} onChange={(e) => setEditNote(e.target.value)} className="w-full p-2.5 bg-[#EEE4CF] border border-[rgba(32,28,21,0.10)] rounded text-xs outline-none resize-none" rows={2} />
                    </div>
                  );
                  if (p.category === 'keychain') return (
                    <div className="space-y-3 pt-3 border-t border-[rgba(32,28,21,0.10)]">
                      <span className="block text-[9px] font-bold text-[#E25822] uppercase">Medical SOS Records</span>
                      <div className="grid grid-cols-3 gap-3">
                        <select value={editBlood} onChange={(e) => setEditBlood(e.target.value)} className="p-2.5 bg-[#EEE4CF] border border-[rgba(32,28,21,0.10)] rounded text-xs outline-none text-[#201C15]">
                          {['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'].map((b) => (<option key={b} value={b}>{b}</option>))}
                        </select>
                        <input type="text" placeholder="Conditions" value={editConditions} onChange={(e) => setEditConditions(e.target.value)} className="col-span-2 p-2.5 bg-[#EEE4CF] border border-[rgba(32,28,21,0.10)] rounded text-xs outline-none" />
                      </div>
                      <input type="text" placeholder="Allergies" value={editAllergies} onChange={(e) => setEditAllergies(e.target.value)} className="w-full p-2.5 bg-[#EEE4CF] border border-[rgba(32,28,21,0.10)] rounded text-xs outline-none" />
                    </div>
                  );
                  if (p.category === 'child') return (
                    <div className="space-y-3 pt-3 border-t border-[rgba(32,28,21,0.10)]">
                      <span className="block text-[9px] font-bold text-[#E25822] uppercase">School Bag Parameters</span>
                      <input type="email" placeholder="Parent Email" value={editChildEmail} onChange={(e) => setEditChildEmail(e.target.value)} className="w-full p-2.5 bg-[#EEE4CF] border border-[rgba(32,28,21,0.10)] rounded text-xs outline-none" />
                      <div className="grid grid-cols-2 gap-3">
                        <input type="text" placeholder="School Name" value={editChildSchool} onChange={(e) => setEditChildSchool(e.target.value)} className="p-2.5 bg-[#EEE4CF] border border-[rgba(32,28,21,0.10)] rounded text-xs outline-none" />
                        <input type="text" placeholder="Bus Details" value={editChildBus} onChange={(e) => setEditChildBus(e.target.value)} className="p-2.5 bg-[#EEE4CF] border border-[rgba(32,28,21,0.10)] rounded text-xs outline-none" />
                      </div>
                    </div>
                  );
                  return null;
                })()}
                <div className="flex gap-3 pt-4 border-t border-[rgba(32,28,21,0.10)]">
                  <button type="button" onClick={() => setIsEditModalOpen(false)} className="flex-1 py-3 border border-[rgba(32,28,21,0.10)] text-xs font-bold uppercase rounded-full hover:bg-[#F6F1E7] transition-colors cursor-pointer">Cancel</button>
                  <button type="submit" className="flex-1 py-3 bg-[#E25822] text-white text-xs font-bold uppercase rounded-full hover:bg-[#C4471A] transition-colors cursor-pointer">Save Changes</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isReplaceModalOpen && replacingProductId && (
          <div className="fixed inset-0 bg-[rgba(32,28,21,0.6)] backdrop-blur-[2px] flex items-center justify-center p-4 z-50">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-[#FFFEFB] border border-[rgba(32,28,21,0.10)] rounded-[22px] max-w-sm w-full p-6 text-left space-y-4">
              <div className="space-y-1">
                <h4 className="text-sm font-bold uppercase tracking-wider text-[#201C15]">Replace Sticker Serial</h4>
                <p className="text-xs text-[#6E6759] leading-relaxed">Link a fresh physical serial code to preserve configuration.</p>
              </div>
              <form onSubmit={handleReplaceSubmit} className="space-y-4">
                <div>
                  <label className="block text-[9px] font-bold uppercase tracking-wider text-[#6E6759] mb-1.5 pl-1">New QR Serial</label>
                  <input type="text" required value={newQrId} onChange={(e) => setNewQrId(e.target.value.toUpperCase())} placeholder="e.g. QR-2A9X" className="w-full p-3 bg-[#EEE4CF] border border-[rgba(32,28,21,0.10)] rounded-lg text-xs font-mono text-center tracking-widest text-[#E25822] font-bold outline-none focus:border-[#E25822]" />
                </div>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setIsReplaceModalOpen(false)} className="flex-1 py-2.5 border border-[rgba(32,28,21,0.10)] text-xs font-bold uppercase rounded-full hover:bg-[#F6F1E7] transition-colors cursor-pointer">Cancel</button>
                  <button type="submit" className="flex-1 py-2.5 bg-[#E25822] text-white text-xs font-bold uppercase rounded-full hover:bg-[#C4471A] transition-colors cursor-pointer">Update Link</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isTransferModalOpen && transferringProductId && (
          <div className="fixed inset-0 bg-[rgba(32,28,21,0.6)] backdrop-blur-[2px] flex items-center justify-center p-4 z-50">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-[#FFFEFB] border border-[rgba(32,28,21,0.10)] rounded-[22px] max-w-sm w-full p-6 text-left space-y-4">
              <div className="space-y-1">
                <h4 className="text-sm font-bold uppercase tracking-wider text-[#201C15]">Transfer Product Ownership</h4>
                <p className="text-xs text-[#6E6759] leading-relaxed font-medium">Map the physical tag serial to another user's email ID.</p>
              </div>
              <form onSubmit={handleTransferSubmit} className="space-y-4">
                <div>
                  <label className="block text-[9px] font-bold uppercase tracking-wider text-[#6E6759] mb-1.5 pl-1">Recipient Email</label>
                  <input type="email" required value={transferEmail} onChange={(e) => setTransferEmail(e.target.value)} placeholder="e.g. recipient@domain.com" className="w-full p-3 bg-[#EEE4CF] border border-[rgba(32,28,21,0.10)] rounded-lg text-xs outline-none focus:border-[#E25822]" />
                </div>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setIsTransferModalOpen(false)} className="flex-1 py-2.5 border border-[rgba(32,28,21,0.10)] text-xs font-bold uppercase rounded-full hover:bg-[#F6F1E7] transition-colors cursor-pointer">Cancel</button>
                  <button type="submit" className="flex-1 py-2.5 bg-[#E25822] text-white text-xs font-bold uppercase rounded-full hover:bg-[#C4471A] transition-colors cursor-pointer">Assign & Send</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <Toast message={toastMsg} visible={toastVisible} onHide={() => setToastVisible(false)} />
    </div>
  );
}

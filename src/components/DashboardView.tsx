import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  LayoutDashboard,
  QrCode,
  FileText,
  Settings,
  Plus,
  MapPin,
  LogOut,
  AlertTriangle,
  FileCheck,
  CheckCircle,
  Phone,
  Calendar,
  ChevronRight,
  Crown,
  X,
  Package,
  Edit2,
  Trash2,
  Car,
  Bike,
  Home,
  Luggage,
  Key,
  Backpack,
  Activity,
  Flame,
  Droplet,
  ShieldCheck,
  Sparkles,
  Users,
  Compass,
  ArrowRight,
  UserPlus,
  RefreshCw,
  Clock,
  ExternalLink,
  ShieldAlert
} from 'lucide-react';
import TiltCard from './ui/TiltCard';
import MagneticBtn from './ui/MagneticBtn';
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
  user,
  products,
  qrCodes,
  reports,
  onLogout,
  onUpdateProducts,
  onUpdateQrCodes,
  onUpdateReports,
  onUpdateUser,
  onSimulatePublicScan,
}: DashboardViewProps) {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'my_products' | 'alerts' | 'shop' | 'settings'>('dashboard');

  // Modal / Wizard states
  const [isActivationWizardOpen, setIsActivationWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [scannedQrCodeId, setScannedQrCodeId] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory>('car');
  const [newProductName, setNewProductName] = useState('');
  const [newProductFamily, setNewProductFamily] = useState('Self');
  const [verificationProgress, setVerificationProgress] = useState(0);
  const [isVerifying, setIsVerifying] = useState(false);

  // Wizard fields mapping to NamoProduct details
  // Car / Bike Details
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState(new Date().getFullYear());
  const [color, setColor] = useState('');
  const [plate, setPlate] = useState('');
  const [insurance, setInsurance] = useState('');

  // Home Gate Details
  const [gateHouseProfile, setGateHouseProfile] = useState('');
  const [gateInstructions, setGateInstructions] = useState('');
  const [gateDndStatus, setGateDndStatus] = useState<'available' | 'away' | 'do_not_disturb'>('available');

  // Luggage Details
  const [luggageOwner, setLuggageOwner] = useState('');
  const [luggagePhone, setLuggagePhone] = useState('');
  const [luggageNote, setLuggageNote] = useState('');

  // Keychain Details
  const [keychainBlood, setKeychainBlood] = useState('O+');
  const [keychainConditions, setKeychainConditions] = useState('');
  const [keychainAllergies, setKeychainAllergies] = useState('');

  // Child School Details
  const [childEmail, setChildEmail] = useState('');
  const [childSchool, setChildSchool] = useState('');
  const [childBus, setChildBus] = useState('');
  const [childPickupCode, setChildPickupCode] = useState('9574-SAFE');

  // Action Edit states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  
  // Replace Tag flows
  const [isReplaceModalOpen, setIsReplaceModalOpen] = useState(false);
  const [replacingProductId, setReplacingProductId] = useState<string | null>(null);
  const [newReplacementQrId, setNewReplacementQrId] = useState('');

  // Ownership transfer flows
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [transferringProductId, setTransferringProductId] = useState<string | null>(null);
  const [transferEmail, setTransferEmail] = useState('');

  // Filter alerts
  const [reportFilter, setReportFilter] = useState<'all' | 'unread' | 'acknowledged' | 'resolved'>('all');

  // --- Category helpers ---
  const getCategoryMeta = (cat: ProductCategory) => {
    switch (cat) {
      case 'car':
        return { label: 'Car Sticker', icon: Car, bg: 'bg-orange-500/10 border-orange-500/20 text-orange-500' };
      case 'bike':
        return { label: 'Bike Sticker', icon: Bike, bg: 'bg-amber-500/10 border-amber-500/20 text-amber-500' };
      case 'home':
        return { label: 'Home Gate', icon: Home, bg: 'bg-blue-500/10 border-blue-500/20 text-blue-500' };
      case 'luggage':
        return { label: 'Luggage Sticker', icon: Luggage, bg: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-500' };
      case 'keychain':
        return { label: 'Keychain', icon: Key, bg: 'bg-rose-500/10 border-rose-500/20 text-rose-500' };
      case 'child':
        return { label: 'Child Tag', icon: Backpack, bg: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' };
      default:
        return { label: 'Other Smart Tag', icon: Sparkles, bg: 'bg-slate-500/10 border-slate-500/20 text-slate-500' };
    }
  };

  const getStatusBadge = (status: ProductStatus) => {
    switch (status) {
      case 'active':
        return <span className="px-2 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/20 text-[9px] font-bold text-emerald-500 uppercase tracking-widest">Active</span>;
      case 'inactive':
        return <span className="px-2 py-0.5 rounded bg-slate-500/15 border border-slate-500/20 text-[9px] font-bold text-slate-500 uppercase tracking-widest">Inactive</span>;
      case 'lost':
        return <span className="px-2 py-0.5 rounded bg-red-500/15 border border-red-500/20 text-[9px] font-bold text-red-500 uppercase tracking-widest">Lost</span>;
      case 'replaced':
        return <span className="px-2 py-0.5 rounded bg-amber-500/15 border border-amber-500/20 text-[9px] font-bold text-amber-500 uppercase tracking-widest">Replaced</span>;
      default:
        return null;
    }
  };

  // --- Functions ---
  const handleToggleStatus = (pId: string) => {
    const updated = products.map((p) => {
      if (p.id === pId) {
        const nextStatus: ProductStatus = p.status === 'active' ? 'inactive' : 'active';
        return { ...p, status: nextStatus };
      }
      return p;
    });
    onUpdateProducts(updated);
  };

  const handleStartVerifyTag = () => {
    if (!scannedQrCodeId.trim()) return;
    setIsVerifying(true);
    setVerificationProgress(0);
    let prog = 0;
    const t = setInterval(() => {
      prog += 20;
      setVerificationProgress(prog);
      if (prog >= 100) {
        clearInterval(t);
        setIsVerifying(false);
        setWizardStep(2);
      }
    }, 150);
  };

  const handleFinishActivation = () => {
    const nextProdId = `P-${Date.now().toString().slice(-4)}`;
    
    let builtDetails: NamoProduct['details'] = {};
    if (selectedCategory === 'car' || selectedCategory === 'bike') {
      builtDetails = { make, model, year: Number(year), color, licensePlate: plate.toUpperCase(), insuranceDetails: insurance };
    } else if (selectedCategory === 'home') {
      builtDetails = { houseProfile: gateHouseProfile, emergencyInstructions: gateInstructions, availabilityStatus: gateDndStatus };
    } else if (selectedCategory === 'luggage') {
      builtDetails = { travelMode: true, ownerName: luggageOwner, recoverySupportPhone: luggagePhone, lostFoundNote: luggageNote };
    } else if (selectedCategory === 'keychain') {
      builtDetails = { bloodGroup: keychainBlood, medicalConditions: keychainConditions, allergies: keychainAllergies };
    } else if (selectedCategory === 'child') {
      builtDetails = { parentNotificationEmail: childEmail, schoolName: childSchool, busDetails: childBus, pickupVerificationCode: childPickupCode };
    }

    const newProd: NamoProduct = {
      id: nextProdId,
      category: selectedCategory,
      name: newProductName || `My ${selectedCategory.toUpperCase()} Sticker`,
      status: 'active',
      qrCodeId: scannedQrCodeId || `QR-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
      assignedTo: newProductFamily || 'Self',
      createdAt: new Date().toISOString(),
      scansCount: 0,
      details: builtDetails
    };

    onUpdateProducts([newProd, ...products]);

    // Update corresponding QR Code state in list
    const qrExists = qrCodes.some(q => q.id === newProd.qrCodeId);
    if (qrExists) {
      const updatedQrs = qrCodes.map(q => q.id === newProd.qrCodeId ? { ...q, vehicleId: nextProdId, status: 'active' as const } : q);
      onUpdateQrCodes(updatedQrs);
    } else {
      const newQr: QRCodeData = { id: newProd.qrCodeId, vehicleId: nextProdId, status: 'active', scansCount: 0, createdAt: new Date().toISOString() };
      onUpdateQrCodes([newQr, ...qrCodes]);
    }

    // Reset state & close wizard
    setIsActivationWizardOpen(false);
    setWizardStep(1);
    setScannedQrCodeId('');
    setNewProductName('');
    setMake(''); setModel(''); setYear(2026); setColor(''); setPlate(''); setInsurance('');
    setGateHouseProfile(''); setGateInstructions('');
    setLuggageOwner(''); setLuggagePhone(''); setLuggageNote('');
    setKeychainConditions(''); setKeychainAllergies('');
    setChildEmail(''); setChildSchool(''); setChildBus('');
  };

  const handleEditClick = (p: NamoProduct) => {
    setEditingProductId(p.id);
    setNewProductName(p.name);
    setNewProductFamily(p.assignedTo);
    
    // Auto fill category forms
    if (p.category === 'car' || p.category === 'bike') {
      setMake(p.details.make || '');
      setModel(p.details.model || '');
      setYear(p.details.year || 2026);
      setColor(p.details.color || '');
      setPlate(p.details.licensePlate || '');
      setInsurance(p.details.insuranceDetails || '');
    } else if (p.category === 'home') {
      setGateHouseProfile(p.details.houseProfile || '');
      setGateInstructions(p.details.emergencyInstructions || '');
      setGateDndStatus(p.details.availabilityStatus || 'available');
    } else if (p.category === 'luggage') {
      setLuggageOwner(p.details.ownerName || '');
      setLuggagePhone(p.details.recoverySupportPhone || '');
      setLuggageNote(p.details.lostFoundNote || '');
    } else if (p.category === 'keychain') {
      setKeychainBlood(p.details.bloodGroup || 'O+');
      setKeychainConditions(p.details.medicalConditions || '');
      setKeychainAllergies(p.details.allergies || '');
    } else if (p.category === 'child') {
      setChildEmail(p.details.parentNotificationEmail || '');
      setChildSchool(p.details.schoolName || '');
      setChildBus(p.details.busDetails || '');
      setChildPickupCode(p.details.pickupVerificationCode || '');
    }

    setIsEditModalOpen(true);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProductId) return;

    const updated = products.map((p) => {
      if (p.id === editingProductId) {
        let builtDetails: NamoProduct['details'] = {};
        if (p.category === 'car' || p.category === 'bike') {
          builtDetails = { make, model, year: Number(year), color, licensePlate: plate.toUpperCase(), insuranceDetails: insurance };
        } else if (p.category === 'home') {
          builtDetails = { houseProfile: gateHouseProfile, emergencyInstructions: gateInstructions, availabilityStatus: gateDndStatus };
        } else if (p.category === 'luggage') {
          builtDetails = { travelMode: p.details.travelMode, ownerName: luggageOwner, recoverySupportPhone: luggagePhone, lostFoundNote: luggageNote };
        } else if (p.category === 'keychain') {
          builtDetails = { bloodGroup: keychainBlood, medicalConditions: keychainConditions, allergies: keychainAllergies };
        } else if (p.category === 'child') {
          builtDetails = { parentNotificationEmail: childEmail, schoolName: childSchool, busDetails: childBus, pickupVerificationCode: childPickupCode };
        }

        return {
          ...p,
          name: newProductName,
          assignedTo: newProductFamily,
          details: builtDetails
        };
      }
      return p;
    });

    onUpdateProducts(updated);
    setIsEditModalOpen(false);
    setEditingProductId(null);
  };

  const handleReplaceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replacingProductId || !newReplacementQrId.trim()) return;

    // 1. Update product to point to the new QR code
    const updatedProducts = products.map((p) => {
      if (p.id === replacingProductId) {
        return { ...p, qrCodeId: newReplacementQrId, status: 'replaced' as ProductStatus };
      }
      return p;
    });
    onUpdateProducts(updatedProducts);

    // 2. Add the new QR code into the pool if it does not exist
    const qrExists = qrCodes.some((q) => q.id === newReplacementQrId);
    if (!qrExists) {
      const newQr: QRCodeData = {
        id: newReplacementQrId,
        vehicleId: replacingProductId,
        status: 'active',
        scansCount: 0,
        createdAt: new Date().toISOString()
      };
      onUpdateQrCodes([newQr, ...qrCodes]);
    } else {
      const updatedQrs = qrCodes.map(q => q.id === newReplacementQrId ? { ...q, vehicleId: replacingProductId, status: 'active' as const } : q);
      onUpdateQrCodes(updatedQrs);
    }

    setIsReplaceModalOpen(false);
    setReplacingProductId(null);
    setNewReplacementQrId('');
  };

  const handleTransferSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferringProductId || !transferEmail.trim()) return;

    alert(`Ownership of product successfully scheduled to transfer to ${transferEmail}.`);
    
    // Remove the product locally
    const filtered = products.filter((p) => p.id !== transferringProductId);
    onUpdateProducts(filtered);

    // Unlink the QR code
    const targetProduct = products.find(p => p.id === transferringProductId);
    if (targetProduct) {
      const updatedQrs = qrCodes.map((q) => {
        if (q.id === targetProduct.qrCodeId) {
          return { ...q, vehicleId: null, status: 'unlinked' as const };
        }
        return q;
      });
      onUpdateQrCodes(updatedQrs);
    }

    setIsTransferModalOpen(false);
    setTransferringProductId(null);
    setTransferEmail('');
  };

  const handleDeleteProduct = (pId: string) => {
    if (!confirm("Are you sure you want to delete and unlink this safety product?")) return;
    
    const filteredProducts = products.filter((p) => p.id !== pId);
    onUpdateProducts(filteredProducts);

    const targetProduct = products.find(p => p.id === pId);
    if (targetProduct) {
      const updatedQrs = qrCodes.map((q) => {
        if (q.id === targetProduct.qrCodeId) {
          return { ...q, vehicleId: null, status: 'unlinked' as const };
        }
        return q;
      });
      onUpdateQrCodes(updatedQrs);
    }
  };

  // --- Reports logic ---
  const handleAcknowledgeReport = (reportId: string) => {
    const updated = reports.map((r) => r.id === reportId ? { ...r, status: 'acknowledged' as const } : r);
    onUpdateReports(updated);
  };

  const handleResolveReport = (reportId: string) => {
    const updated = reports.map((r) => r.id === reportId ? { ...r, status: 'resolved' as const } : r);
    onUpdateReports(updated);
  };

  const handleDeleteReport = (reportId: string) => {
    const filtered = reports.filter((r) => r.id !== reportId);
    onUpdateReports(filtered);
  };

  const totalScans = products.reduce((sum, p) => sum + p.scansCount, 0);

  return (
    <div id="dashboard-layout" className="min-h-screen bg-[#050508] flex flex-col md:flex-row text-white font-sans relative overflow-hidden">
      
      {/* Sidebar Rail */}
      <aside className="w-full md:w-64 bg-[#111115] border-r border-[#222] shrink-0 flex flex-col justify-between relative z-20">
        <div>
          {/* Logo brand */}
          <div className="h-16 border-b border-[#222] px-6 flex items-center gap-2">
            <div className="text-white font-bold text-lg tracking-wider flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded-full bg-[#f97316]"></span>
              NAMO<span className="text-[#f97316]">QR</span>
            </div>
          </div>

          {/* User profile row */}
          <div className="p-4 border-b border-[#222] flex items-center gap-3 bg-[#18181c]">
            <div className="w-8 h-8 rounded-full bg-[#f97316] text-white flex items-center justify-center font-bold text-xs shrink-0 select-none">
              {user.fullName.slice(0, 2).toUpperCase()}
            </div>
            <div className="overflow-hidden text-left">
              <h4 className="text-xs font-bold text-white truncate tracking-tight">{user.fullName}</h4>
              <p className="text-[10px] text-white/50 truncate mt-0.5">{user.email}</p>
            </div>
          </div>

          {/* Navigation Side Links */}
          <nav className="p-3 space-y-1 relative text-left">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-md text-xs font-bold tracking-wider uppercase transition-all cursor-pointer ${
                activeTab === 'dashboard' ? 'bg-[#f97316] text-white' : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <LayoutDashboard size={14} className="shrink-0" />
              <span>Control Panel</span>
            </button>

            <button
              onClick={() => setActiveTab('my_products')}
              className={`w-full flex items-center justify-between px-4 py-2.5 rounded-md text-xs font-bold tracking-wider uppercase transition-all cursor-pointer ${
                activeTab === 'my_products' ? 'bg-[#f97316] text-white' : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <div className="flex items-center gap-3">
                <QrCode size={14} className="shrink-0" />
                <span>My Products</span>
              </div>
              <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                activeTab === 'my_products' ? 'bg-black/20 text-white' : 'bg-[#222] text-white/50'
              }`}>
                {products.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('alerts')}
              className={`w-full flex items-center justify-between px-4 py-2.5 rounded-md text-xs font-bold tracking-wider uppercase transition-all cursor-pointer ${
                activeTab === 'alerts' ? 'bg-[#f97316] text-white' : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <div className="flex items-center gap-3">
                <FileText size={14} className="shrink-0" />
                <span>Bystander Alerts</span>
              </div>
              {reports.filter(r => r.status === 'unread').length > 0 ? (
                <span className="px-2 py-0.5 bg-[#c81b3a] text-white rounded-md text-[10px] font-bold">
                  {reports.filter(r => r.status === 'unread').length}
                </span>
              ) : (
                <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                  activeTab === 'alerts' ? 'bg-black/20 text-white' : 'bg-[#222] text-white/50'
                }`}>
                  {reports.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('shop')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-md text-xs font-bold tracking-wider uppercase transition-all cursor-pointer ${
                activeTab === 'shop' ? 'bg-[#f97316] text-white' : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <Package size={14} className="shrink-0" />
              <span>Order Stickers</span>
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-md text-xs font-bold tracking-wider uppercase transition-all cursor-pointer ${
                activeTab === 'settings' ? 'bg-[#f97316] text-white' : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <Settings size={14} className="shrink-0" />
              <span>Settings</span>
            </button>
          </nav>
        </div>

        {/* Sidebar Footer Signout */}
        <div className="p-4 border-t border-[#222] bg-transparent">
          <button
            onClick={onLogout}
            className="w-full h-10 inline-flex items-center justify-center gap-2 border border-white/10 rounded-md bg-[#18181c] hover:bg-[#c81b3a]/15 hover:text-[#c81b3a] hover:border-[#c81b3a]/30 text-xs font-bold tracking-wide uppercase transition-all cursor-pointer"
          >
            <LogOut size={12} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Panel Content */}
      <main className="flex-grow flex flex-col min-h-0 bg-transparent overflow-y-auto">
        <header className="h-16 bg-[#111115] border-b border-[#222] px-6 sm:px-8 shrink-0 flex items-center justify-between z-10">
          <h2 className="font-sans font-bold text-sm text-white uppercase tracking-wider">
            {activeTab === 'dashboard' && 'Security Ecosystem'}
            {activeTab === 'my_products' && 'My Active Safety Stickers'}
            {activeTab === 'alerts' && 'Bystander Alert Feed'}
            {activeTab === 'shop' && 'Order Additional Safety Hardware'}
            {activeTab === 'settings' && 'Account Shield settings'}
          </h2>

          <button
            onClick={() => {
              setWizardStep(1);
              setIsActivationWizardOpen(true);
            }}
            className="clay-button-primary px-5 py-2 text-xs flex items-center gap-1.5 cursor-pointer h-9"
          >
            <Plus size={14} /> Link New Sticker
          </button>
        </header>

        <div className="p-6 sm:p-8 max-w-[1440px] w-full mx-auto">
          
          {/* ──────────────────────────────────────────────────────── */}
          {/* TAB: DASHBOARD HOME */}
          {/* ──────────────────────────────────────────────────────── */}
          {activeTab === 'dashboard' && (
            <div className="space-y-8">
              {/* Greetings board */}
              <div className="bg-[#111115] border border-[#222] rounded-xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-left">
                <div>
                  <h3 className="text-lg font-bold text-white uppercase tracking-wide">
                    Ecosystem Shield Active
                  </h3>
                  <p className="text-xs text-white/50 mt-1 font-medium font-sans">
                    Connecting physical QR stickers and keychains under Mihir's verified safety framework.
                  </p>
                </div>
                <div className="flex items-center gap-2 bg-[#18181c] border border-white/5 px-3.5 py-2 rounded-lg shrink-0">
                  <Calendar size={14} className="text-[#f97316]" />
                  <span className="font-sans text-xs text-white font-bold">
                    {new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </div>
              </div>

              {/* Status Metrics Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-[#111115] border border-[#222] rounded-xl p-5 text-left">
                  <span className="text-[10px] font-bold text-white/45 tracking-widest uppercase">Registered Products</span>
                  <h4 className="text-2xl font-bold text-white mt-3">{products.length}</h4>
                  <div className="text-[10px] text-emerald-500 font-bold mt-2 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Active Channels
                  </div>
                </div>

                <div className="bg-[#111115] border border-[#222] rounded-xl p-5 text-left">
                  <span className="text-[10px] font-bold text-white/45 tracking-widest uppercase">Linked QRs</span>
                  <h4 className="text-2xl font-bold text-white mt-3">{qrCodes.filter(q => q.status === 'active').length}</h4>
                  <div className="text-[10px] text-white/40 mt-2 font-semibold">
                    {qrCodes.filter(q => q.status === 'unlinked').length} Unlinked Tag(s)
                  </div>
                </div>

                <div className="bg-[#111115] border border-[#222] rounded-xl p-5 text-left">
                  <span className="text-[10px] font-bold text-white/45 tracking-widest uppercase">Incident Scans</span>
                  <h4 className="text-2xl font-bold text-white mt-3">{totalScans}</h4>
                  <div className="text-[10px] text-white/40 mt-2 font-semibold">Lifetime interactions</div>
                </div>

                <div className="bg-[#111115] border border-[#222] rounded-xl p-5 text-left">
                  <span className="text-[10px] font-bold text-white/45 tracking-widest uppercase">Pending Alerts</span>
                  <h4 className="text-2xl font-bold text-white mt-3">
                    {reports.filter(r => r.status === 'unread').length}
                  </h4>
                  <div className="text-[10px] text-rose-500 font-bold mt-2 flex items-center gap-1.5">
                    {reports.filter(r => r.status === 'unread').length > 0 ? (
                      <>
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping"></span>
                        Action Required
                      </>
                    ) : 'Inbox Clear'}
                  </div>
                </div>
              </div>

              {/* PlayStation Simulator Test Panel */}
              <div className="bg-[#18181c] border border-white/5 p-6 rounded-xl text-left space-y-4">
                <div className="space-y-1">
                  <h4 className="text-sm font-bold uppercase tracking-wider text-white">Simulate Bystander QR Scan</h4>
                  <p className="text-xs text-white/60 leading-relaxed font-sans">
                    Act as an emergency responder, visitor, or helper scanning your physical tag. Select any registered product below to test its customized public response page.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2.5">
                  {products.map((p) => {
                    const meta = getCategoryMeta(p.category);
                    return (
                      <button
                        key={p.id}
                        onClick={() => onSimulatePublicScan(p.qrCodeId)}
                        className="px-4 py-2.5 bg-black hover:bg-[#222] border border-white/10 hover:border-white/20 text-xs font-semibold uppercase tracking-wider text-white rounded-lg flex items-center gap-2 cursor-pointer transition-all active:scale-95"
                      >
                        <meta.icon size={14} className="text-[#f97316]" />
                        <span>{p.name} ({p.qrCodeId})</span>
                        <ExternalLink size={12} className="text-white/40 ml-1" />
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Active products column */}
                <div className="bg-[#111115] border border-[#222] rounded-xl p-5 space-y-4 text-left">
                  <div className="flex justify-between items-center border-b border-white/5 pb-2">
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">Device List</h4>
                    <button onClick={() => setActiveTab('my_products')} className="text-[10px] font-bold text-[#f97316] uppercase hover:underline">
                      See All
                    </button>
                  </div>
                  <div className="space-y-2">
                    {products.slice(0, 3).map((p) => {
                      const meta = getCategoryMeta(p.category);
                      return (
                        <div key={p.id} className="p-3 bg-black/40 border border-white/5 rounded-lg flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded bg-[#f97316]/10 flex items-center justify-center text-[#f97316]">
                              <meta.icon size={16} />
                            </div>
                            <div>
                              <strong className="text-white block truncate max-w-[120px]">{p.name}</strong>
                              <span className="text-[9px] text-white/40 block mt-0.5">{p.assignedTo} &bull; {p.qrCodeId}</span>
                            </div>
                          </div>
                          {getStatusBadge(p.status)}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Recent alerts timeline */}
                <div className="bg-[#111115] border border-[#222] rounded-xl p-5 space-y-4 lg:col-span-2 text-left">
                  <div className="flex justify-between items-center border-b border-white/5 pb-2">
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">Recent Alerts Timeline</h4>
                    <button onClick={() => setActiveTab('alerts')} className="text-[10px] font-bold text-[#f97316] uppercase hover:underline">
                      View Inbox
                    </button>
                  </div>
                  <div className="space-y-3">
                    {reports.length === 0 ? (
                      <div className="text-center py-8 text-white/30 text-xs">No alerts received. Platform secure.</div>
                    ) : (
                      reports.slice(0, 2).map((r) => {
                        const isHigh = r.type === 'accident' || r.type === 'medical_emergency' || r.type === 'fire_emergency' || r.type === 'lost_child';
                        return (
                          <div key={r.id} className="p-3 bg-black/40 border border-white/5 rounded-lg text-xs space-y-2 relative">
                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-2">
                                <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${
                                  isHigh ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-blue-500/10 text-blue-500 border border-blue-500/20'
                                }`}>
                                  {r.type.replace('_', ' ')}
                                </span>
                                <strong className="text-white block">{r.vehicleLabel}</strong>
                              </div>
                              <span className="text-[10px] text-white/40">{new Date(r.createdAt).toLocaleDateString()}</span>
                            </div>
                            <p className="text-white/80 font-sans italic">"{r.message}"</p>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* ──────────────────────────────────────────────────────── */}
          {/* TAB: MY PRODUCTS MODULE */}
          {/* ──────────────────────────────────────────────────────── */}
          {activeTab === 'my_products' && (
            <div className="space-y-6">
              
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#111115] border border-[#222] p-5 rounded-xl text-left">
                <div>
                  <h3 className="text-lg font-bold uppercase tracking-wide">My Connected Ecosystem</h3>
                  <p className="text-xs text-white/50 mt-1 font-sans">
                    View active tags, assign to family members, rename, transfer ownership, or declare items as lost.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setWizardStep(1);
                    setIsActivationWizardOpen(true);
                  }}
                  className="clay-button-primary px-5 py-2.5 text-xs flex items-center gap-1.5 cursor-pointer h-10 font-bold uppercase tracking-wider rounded-full shadow-md transition-all active:scale-[0.98]"
                >
                  <Plus size={14} /> Link New Product
                </button>
              </div>

              {/* Product cards list grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.length === 0 ? (
                  <div className="col-span-full py-16 bg-[#111115] rounded-xl border border-[#222] text-center text-white/40 font-bold text-sm">
                    No safety products registered yet. Click "Link New Product" to begin activation.
                  </div>
                ) : (
                  products.map((p) => {
                    const meta = getCategoryMeta(p.category);
                    const CardIcon = meta.icon;
                    return (
                      <div 
                        key={p.id}
                        className="bg-[#111115] border border-[#222] rounded-xl p-5 text-left flex flex-col justify-between gap-6 hover:border-white/10 transition-all duration-300 relative group"
                      >
                        {/* Top Info section */}
                        <div className="space-y-4">
                          <div className="flex justify-between items-start">
                            <div className="flex items-center gap-2.5">
                              <div className="w-10 h-10 rounded-lg bg-[#f97316]/10 flex items-center justify-center text-[#f97316] shrink-0 border border-[#f97316]/20">
                                <CardIcon size={20} />
                              </div>
                              <div>
                                <h4 className="text-sm font-bold text-white uppercase tracking-wide group-hover:text-[#f97316] transition-colors">{p.name}</h4>
                                <span className="text-[9px] text-[#f97316] uppercase font-bold tracking-widest block mt-0.5">{meta.label}</span>
                              </div>
                            </div>
                            {getStatusBadge(p.status)}
                          </div>

                          {/* Specific Category data parameters */}
                          <div className="space-y-1.5 p-3.5 bg-black/40 border border-white/5 rounded-lg text-xs leading-normal font-sans text-white/70">
                            {p.category === 'car' && (
                              <>
                                <p><strong>License Plate:</strong> <span className="font-mono uppercase text-white font-bold">{p.details.licensePlate || 'N/A'}</span></p>
                                <p><strong>Make / Model:</strong> {p.details.color} {p.details.make} {p.details.model}</p>
                                <p className="truncate"><strong>Insurance:</strong> {p.details.insuranceDetails || 'N/A'}</p>
                              </>
                            )}
                            {p.category === 'bike' && (
                              <>
                                <p><strong>License Plate:</strong> <span className="font-mono uppercase text-white font-bold">{p.details.licensePlate || 'N/A'}</span></p>
                                <p><strong>Make / Model:</strong> {p.details.color} {p.details.make} {p.details.model}</p>
                                <p className="truncate"><strong>Reminders:</strong> {p.details.serviceReminders?.join(', ') || 'None Set'}</p>
                              </>
                            )}
                            {p.category === 'home' && (
                              <>
                                <p className="truncate"><strong>House Profile:</strong> {p.details.houseProfile || 'N/A'}</p>
                                <p className="truncate"><strong>Emergency note:</strong> {p.details.emergencyInstructions || 'None Set'}</p>
                                <p><strong>DND Status:</strong> <span className="text-[#f97316] font-bold uppercase">{p.details.availabilityStatus}</span></p>
                              </>
                            )}
                            {p.category === 'luggage' && (
                              <>
                                <p><strong>Travel Mode:</strong> <span className="text-emerald-500 font-bold uppercase">Enabled</span></p>
                                <p><strong>Owner Name:</strong> {p.details.ownerName || 'Mihir Rathod'}</p>
                                <p className="truncate"><strong>Finder note:</strong> {p.details.lostFoundNote || 'None Set'}</p>
                              </>
                            )}
                            {p.category === 'keychain' && (
                              <>
                                <p><strong>Medical Stamp:</strong> Blood Type <span className="text-[#c81b3a] font-bold">{p.details.bloodGroup || 'O+'}</span></p>
                                <p className="truncate"><strong>Conditions:</strong> {p.details.medicalConditions || 'None Set'}</p>
                                <p className="truncate"><strong>Allergies:</strong> {p.details.allergies || 'None Set'}</p>
                              </>
                            )}
                            {p.category === 'child' && (
                              <>
                                <p><strong>School Name:</strong> {p.details.schoolName || 'Oakridge International'}</p>
                                <p className="truncate"><strong>Bus route:</strong> {p.details.busDetails || 'N/A'}</p>
                                <p><strong>Verification Code:</strong> <span className="font-mono text-emerald-500 font-bold">{p.details.pickupVerificationCode || '9574-SAFE'}</span></p>
                              </>
                            )}
                          </div>

                          {/* Telemetry info row */}
                          <div className="grid grid-cols-2 gap-2 text-[10px] text-white/50 border-t border-white/5 pt-3">
                            <div>
                              <span>Assigned user:</span>
                              <strong className="text-white block mt-0.5">{p.assignedTo}</strong>
                            </div>
                            <div className="text-right">
                              <span>Last scan timeline:</span>
                              <strong className="text-white block mt-0.5 truncate">{p.lastScannedAt ? new Date(p.lastScannedAt).toLocaleDateString() : 'Never Scanned'}</strong>
                            </div>
                          </div>
                        </div>

                        {/* Bottom Action buttons */}
                        <div className="grid grid-cols-2 gap-2 pt-4 border-t border-white/5">
                          <button
                            onClick={() => handleEditClick(p)}
                            className="py-2 px-3 bg-black hover:bg-[#18181c] border border-white/10 text-[10px] font-bold uppercase rounded-lg text-white/80 transition-all flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <Edit2 size={11} /> Edit details
                          </button>

                          <button
                            onClick={() => {
                              setReplacingProductId(p.id);
                              setIsReplaceModalOpen(true);
                            }}
                            className="py-2 px-3 bg-black hover:bg-[#18181c] border border-white/10 text-[10px] font-bold uppercase rounded-lg text-white/80 transition-all flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <RefreshCw size={11} /> Replace Tag
                          </button>

                          <button
                            onClick={() => {
                              setTransferringProductId(p.id);
                              setIsTransferModalOpen(true);
                            }}
                            className="py-2 px-3 bg-black hover:bg-[#18181c] border border-white/10 text-[10px] font-bold uppercase rounded-lg text-white/80 transition-all flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <UserPlus size={11} /> Transfer
                          </button>

                          <button
                            onClick={() => handleToggleStatus(p.id)}
                            className={`py-2 px-3 border text-[10px] font-bold uppercase rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer ${
                              p.status === 'active' 
                                ? 'bg-red-500/10 hover:bg-red-500/15 border-red-500/20 text-red-500' 
                                : 'bg-emerald-500/10 hover:bg-emerald-500/15 border-emerald-500/20 text-emerald-500'
                            }`}
                          >
                            <ShieldAlert size={11} /> {p.status === 'active' ? 'Suspend' : 'Reactivate'}
                          </button>

                          <button
                            onClick={() => onSimulatePublicScan(p.qrCodeId)}
                            className="col-span-2 py-2.5 bg-[#f97316] hover:bg-[#ea580c] text-white text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer border-none"
                          >
                            <QrCode size={13} /> Test Scan Response Page
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* ──────────────────────────────────────────────────────── */}
          {/* TAB: BYSTANDER ALERTS */}
          {/* ──────────────────────────────────────────────────────── */}
          {activeTab === 'alerts' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-left">
                <div>
                  <h3 className="text-lg font-bold uppercase tracking-wide">Alert Inbox</h3>
                  <p className="text-xs text-white/50 font-sans mt-0.5">Manage and review incoming emergency updates received from helper scans.</p>
                </div>

                <div className="flex items-center gap-1 bg-[#18181c] border border-white/5 p-1 rounded-lg">
                  {(['all', 'unread', 'acknowledged', 'resolved'] as const).map((status) => {
                    const count = status === 'all' ? reports.length : reports.filter((r) => r.status === status).length;
                    const isActive = reportFilter === status;
                    return (
                      <button
                        key={status}
                        onClick={() => setReportFilter(status)}
                        className={`px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all cursor-pointer ${
                          isActive ? 'bg-[#f97316] text-white' : 'text-white/60 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        {status} {count > 0 && <span className="ml-1 px-1.5 py-0.2 bg-black/25 text-white/80 rounded text-[9px]">{count}</span>}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="bg-[#111115] border border-[#222] rounded-xl overflow-hidden divide-y divide-white/5">
                {(() => {
                  const filtered = reports.filter((r) => {
                    if (reportFilter === 'all') return true;
                    return r.status === reportFilter;
                  });

                  if (filtered.length === 0) {
                    return (
                      <div className="p-16 text-center text-white/30">
                        <CheckCircle size={36} className="mx-auto text-emerald-500 mb-3" />
                        <h4 className="text-white font-bold text-sm uppercase tracking-wide mb-1">Status Clear</h4>
                        <p className="text-xs text-white/50 max-w-xs mx-auto">No incident alerts found in this inbox classification.</p>
                      </div>
                    );
                  }

                  return filtered.map((r) => {
                    const isHigh = r.type === 'accident' || r.type === 'medical_emergency' || r.type === 'fire_emergency' || r.type === 'lost_child';
                    return (
                      <div key={r.id} className="p-5 flex flex-col md:flex-row gap-4 items-center justify-between text-left relative transition-all hover:bg-white/2 cursor-default">
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#f97316]" style={{ backgroundColor: isHigh ? '#c81b3a' : '#f97316' }} />
                        
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full">
                          <div className="space-y-1.5 w-full sm:flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${
                                isHigh ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-blue-500/10 text-blue-500 border border-blue-500/20'
                              }`}>
                                {r.type.replace('_', ' ')}
                              </span>
                              <strong className="text-sm text-white uppercase tracking-wide">{r.vehicleLabel}</strong>
                            </div>
                            <p className="text-xs text-white/80 font-sans italic">"{r.message}"</p>
                            {r.location && (
                              <div className="flex items-center gap-1 text-[10px] text-[#f97316] font-semibold uppercase tracking-wider">
                                <MapPin size={10} />
                                <span>Coordinates Shared &bull; Lat: {r.location.lat.toFixed(4)}, Lng: {r.location.lng.toFixed(4)}</span>
                              </div>
                            )}
                          </div>

                          <div className="flex flex-col sm:items-end gap-3 shrink-0 w-full sm:w-auto mt-3 sm:mt-0 pt-3 sm:pt-0 border-t sm:border-t-0 border-white/5">
                            <span className="text-[10px] text-white/40 block font-sans">
                              {new Date(r.createdAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </span>
                            
                            <div className="flex gap-2">
                              {r.status === 'unread' && (
                                <button
                                  onClick={() => handleAcknowledgeReport(r.id)}
                                  className="px-3 py-1.5 bg-amber-500/15 border border-amber-500/25 hover:bg-amber-500 text-amber-500 hover:text-white text-[10px] font-bold uppercase rounded-lg transition-all"
                                >
                                  Ack
                                </button>
                              )}
                              {r.status !== 'resolved' && (
                                <button
                                  onClick={() => handleResolveReport(r.id)}
                                  className="px-3 py-1.5 bg-emerald-500/15 border border-emerald-500/25 hover:bg-emerald-500 text-emerald-500 hover:text-white text-[10px] font-bold uppercase rounded-lg transition-all"
                                >
                                  Resolve
                                </button>
                              )}
                              <button
                                onClick={() => handleDeleteReport(r.id)}
                                  className="px-3 py-1.5 bg-black hover:bg-white/5 border border-white/10 text-[10px] font-bold uppercase rounded-lg transition-all"
                              >
                                Archive
                              </button>
                            </div>
                          </div>
                        </div>

                      </div>
                    );
                  });
                })()}
              </div>

            </div>
          )}

          {/* ──────────────────────────────────────────────────────── */}
          {/* TAB: SHOP MODULE */}
          {/* ──────────────────────────────────────────────────────── */}
          {activeTab === 'shop' && (
            <div className="space-y-8 text-left">
              <div className="bg-[#111115] border border-[#222] p-5 rounded-xl">
                <h3 className="text-lg font-bold uppercase tracking-wide">Physical Hardware Catalog</h3>
                <p className="text-xs text-white/50 mt-1 font-sans">Order supplementary weatherproof QR sticker packs and smart metal keychains.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { id: '1', name: 'NamoQR Car Windshield Sticker', price: '$9.99', desc: 'Premium weatherproof adhesive sticker. Anti-scratch visual matrix.', icon: Car },
                  { id: '2', name: 'NamoQR Home Gate Metal Plate', price: '$19.99', desc: 'Pre-drilled brushed aluminium warning shield. Highly readable.', icon: Home },
                  { id: '3', name: 'NamoQR Heavy Keychain Pack', price: '$14.99', desc: 'Durable anodized alloy keyring with custom laser-engraved QR tag.', icon: Key },
                ].map((item) => {
                  const CardIcon = item.icon;
                  return (
                    <div key={item.id} className="p-6 bg-[#111115] border border-[#222] rounded-xl flex flex-col justify-between hover:border-white/10 transition-all duration-300">
                      <div className="space-y-4">
                        <div className="w-12 h-12 bg-[#f97316]/10 border border-[#f97316]/20 text-[#f97316] rounded-lg flex items-center justify-center">
                          <CardIcon size={24} />
                        </div>
                        <div className="space-y-1.5">
                          <h4 className="font-bold text-white uppercase tracking-wide text-sm">{item.name}</h4>
                          <p className="text-xs text-white/50 leading-relaxed font-sans">{item.desc}</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/5">
                        <span className="text-white text-base font-bold font-mono">{item.price}</span>
                        <button 
                          onClick={() => alert(`Sticker order simulated. Checked out ${item.name} under Pro subscription.`)}
                          className="px-4 py-2 bg-[#f97316] hover:bg-[#ea580c] text-white text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all"
                        >
                          Checkout
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ──────────────────────────────────────────────────────── */}
          {/* TAB: SETTINGS & BILLING */}
          {/* ──────────────────────────────────────────────────────── */}
          {activeTab === 'settings' && (
            <div className="space-y-6 text-left">
              <div className="bg-[#111115] border border-[#222] rounded-xl p-6">
                <h4 className="font-sans font-bold text-sm text-white uppercase tracking-wider mb-4 pb-2 border-b border-white/5">Profile Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block text-[9px] font-bold uppercase tracking-wider text-white/50 mb-1.5 pl-1">Email Username</label>
                    <input type="text" disabled value={user.email} className="w-full p-3 bg-black border border-white/10 rounded cursor-not-allowed opacity-60" />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold uppercase tracking-wider text-white/50 mb-1.5 pl-1">Account Owner Name</label>
                    <input
                      type="text"
                      value={user.fullName}
                      onChange={(e) => onUpdateUser({ ...user, fullName: e.target.value })}
                      className="w-full p-3 bg-black border border-white/10 rounded text-white outline-none focus:border-[#f97316]"
                    />
                  </div>
                </div>
              </div>

              {/* Subscriptions */}
              <div className="bg-[#111115] border border-[#222] rounded-xl p-6">
                <div className="flex justify-between items-start mb-4 pb-2 border-b border-white/5">
                  <div>
                    <h4 className="font-sans font-bold text-sm text-white uppercase tracking-wider">Subscription Tier</h4>
                    <p className="text-xs text-white/50 mt-1 font-sans">Toggle security parameters and priority SOS message limits.</p>
                  </div>
                  <span className="px-2.5 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full font-sans text-[10px] font-bold text-amber-500 uppercase tracking-widest inline-flex items-center gap-1">
                    <Crown size={10} className="fill-amber-500" /> PRO ACTIVE
                  </span>
                </div>

                <div className="p-4 bg-black/40 border border-white/5 rounded-lg mb-6 flex justify-between items-center">
                  <div className="text-xs space-y-1">
                    <strong className="text-white block uppercase tracking-wide">NamoQR Premium Shield</strong>
                    <p className="text-white/60 max-w-lg leading-relaxed">SMS callback forwarding, emergency geolocations, real-time alert logs, and unlimited product profiles.</p>
                  </div>
                  <span className="text-xl font-bold font-mono">$5/mo</span>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={() => {
                      const next = user.subscriptionPlan === 'pro' ? 'free' : 'pro';
                      onUpdateUser({ ...user, subscriptionPlan: next, isSubscribed: next === 'pro' });
                    }}
                    className="py-2.5 px-6 bg-black hover:bg-white/5 border border-white/10 text-xs font-bold uppercase tracking-wider text-white rounded-full transition-all cursor-pointer"
                  >
                    Switch to {user.subscriptionPlan === 'pro' ? 'Free basic' : 'Upgrade to Pro'}
                  </button>
                </div>
              </div>

            </div>
          )}

        </div>
      </main>

      {/* ──────────────────────────────────────────────────────── */}
      {/* DIALOG 1: STEP-BY-STEP ACTIVATION WIZARD */}
      {/* ──────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {isActivationWizardOpen && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#111115] border border-[#222] rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden text-left flex flex-col justify-between"
            >
              
              {/* Header */}
              <div className="p-5 border-b border-white/5 flex justify-between items-center bg-[#18181c]">
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">Ecosystem Activation Wizard</h3>
                  <span className="text-[9px] text-[#f97316] font-mono uppercase tracking-widest">Step {wizardStep} of 4</span>
                </div>
                <button onClick={() => setIsActivationWizardOpen(false)} className="p-1 text-white/50 hover:text-white cursor-pointer bg-transparent border-none outline-none">
                  <X size={18} />
                </button>
              </div>

              {/* Steps container */}
              <div className="p-6 max-h-[60vh] overflow-y-auto">
                {/* STEP 1: Scan & Verify Authenticity */}
                {wizardStep === 1 && (
                  <div className="space-y-6">
                    <div className="text-center py-4 space-y-2">
                      <div className="w-12 h-12 bg-[#f97316]/10 text-[#f97316] rounded-full flex items-center justify-center mx-auto border border-[#f97316]/25 animate-pulse">
                        <QrCode size={24} />
                      </div>
                      <h4 className="text-sm font-bold uppercase tracking-wider">Scan & Verify Authenticity</h4>
                      <p className="text-xs text-white/50 max-w-xs mx-auto leading-relaxed">
                        Input the unique alphanumeric ID found printed beneath the QR matrix.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-white/60 pl-1">QR Code Serial Number</label>
                      <input
                        type="text"
                        required
                        value={scannedQrCodeId}
                        onChange={(e) => setScannedQrCodeId(e.target.value.toUpperCase())}
                        placeholder="e.g. QR-8A3F"
                        className="w-full p-3 bg-black border border-white/10 rounded-lg text-xs outline-none font-mono text-center tracking-widest text-lg font-bold text-[#f97316] focus:border-[#f97316]"
                      />
                    </div>

                    {isVerifying ? (
                      <div className="py-2 space-y-2">
                        <div className="flex justify-between text-[10px] font-bold uppercase text-[#f97316] tracking-wider">
                          <span>Verifying Cryptographic Tag Key...</span>
                          <span>{verificationProgress}%</span>
                        </div>
                        <div className="w-full bg-[#18181c] h-1.5 rounded-full overflow-hidden">
                          <div className="bg-[#f97316] h-full transition-all duration-100" style={{ width: `${verificationProgress}%` }} />
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={handleStartVerifyTag}
                        disabled={!scannedQrCodeId.trim()}
                        className="w-full py-3.5 bg-[#f97316] hover:bg-[#ea580c] disabled:opacity-50 text-white text-xs font-bold uppercase tracking-wider rounded-full transition-all cursor-pointer flex items-center justify-center gap-1"
                      >
                        Verify authenticity <ArrowRight size={14} />
                      </button>
                    )}
                  </div>
                )}

                {/* STEP 2: Choose Product Category */}
                {wizardStep === 2 && (
                  <div className="space-y-6">
                    <div className="text-left space-y-1">
                      <h4 className="text-sm font-bold uppercase tracking-wider">Choose Category</h4>
                      <p className="text-xs text-white/50 font-sans leading-relaxed">Select the target hardware category you are linking to this QR serial.</p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { category: 'car', icon: Car, label: 'Car Windshield Sticker' },
                        { category: 'bike', icon: Bike, label: 'Two-Wheeler Sticker' },
                        { category: 'home', icon: Home, label: 'Home Gate Plate' },
                        { category: 'luggage', icon: Luggage, label: 'Luggage Sticker' },
                        { category: 'keychain', icon: Key, label: 'Emergency Keychain' },
                        { category: 'child', icon: Backpack, label: 'Child school Bag tag' },
                      ].map((item) => {
                        const Icon = item.icon;
                        const isSel = selectedCategory === item.category;
                        return (
                          <button
                            key={item.category}
                            type="button"
                            onClick={() => setSelectedCategory(item.category as any)}
                            className={`p-4 rounded-xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
                              isSel ? 'bg-[#f97316]/15 border-[#f97316] text-[#f97316]' : 'bg-black border-white/5 text-white/60 hover:text-white'
                            }`}
                          >
                            <div className={`w-8 h-8 rounded bg-[#18181c] flex items-center justify-center border ${isSel ? 'border-[#f97316]/20' : 'border-white/5'}`}>
                              <Icon size={16} />
                            </div>
                            <div className="text-left">
                              <span className="text-[10px] font-bold uppercase tracking-wider block leading-none">{item.label}</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    <div className="flex gap-3">
                      <button onClick={() => setWizardStep(1)} className="flex-1 py-3 border border-white/10 text-xs font-bold uppercase rounded-full">Back</button>
                      <button onClick={() => setWizardStep(3)} className="flex-1 py-3 bg-[#f97316] text-white text-xs font-bold uppercase rounded-full">Next Step</button>
                    </div>
                  </div>
                )}

                {/* STEP 3: Category parameters */}
                {wizardStep === 3 && (
                  <div className="space-y-4 text-left">
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold uppercase tracking-wider">Configure Asset Information</h4>
                      <p className="text-xs text-white/50 leading-relaxed font-sans">Input details for this category. These help finder communications.</p>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="block text-[9px] font-bold uppercase tracking-wider text-white/50 mb-1 pl-1">Product Custom Nickname</label>
                        <input
                          type="text"
                          required
                          value={newProductName}
                          onChange={(e) => setNewProductName(e.target.value)}
                          placeholder="e.g. My Tesla Model 3 or Front Gate Sticker"
                          className="w-full p-2.5 bg-black border border-white/10 rounded text-xs outline-none focus:border-[#f97316]"
                        />
                      </div>

                      <div>
                        <label className="block text-[9px] font-bold uppercase tracking-wider text-white/50 mb-1 pl-1">Assign to family member</label>
                        <input
                          type="text"
                          value={newProductFamily}
                          onChange={(e) => setNewProductFamily(e.target.value)}
                          placeholder="e.g. Self, Dad, Aarav"
                          className="w-full p-2.5 bg-black border border-white/10 rounded text-xs outline-none focus:border-[#f97316]"
                        />
                      </div>
                    </div>

                    {/* DYNAMIC FORMS BY CATEGORY */}
                    {(selectedCategory === 'car' || selectedCategory === 'bike') && (
                      <div className="space-y-3 pt-3 border-t border-white/5">
                        <span className="block text-[9px] font-bold text-[#f97316] uppercase">Vehicle Parameters</span>
                        <div className="grid grid-cols-2 gap-3">
                          <input type="text" placeholder="Make" value={make} onChange={(e) => setMake(e.target.value)} className="p-2 bg-black border border-white/10 rounded text-xs outline-none" />
                          <input type="text" placeholder="Model" value={model} onChange={(e) => setModel(e.target.value)} className="p-2 bg-black border border-white/10 rounded text-xs outline-none" />
                          <input type="text" placeholder="Color" value={color} onChange={(e) => setColor(e.target.value)} className="p-2 bg-black border border-white/10 rounded text-xs outline-none" />
                          <input type="text" placeholder="License Plate" value={plate} onChange={(e) => setPlate(e.target.value)} className="p-2 bg-black border border-white/10 rounded text-xs outline-none uppercase font-mono" />
                        </div>
                      </div>
                    )}

                    {selectedCategory === 'home' && (
                      <div className="space-y-3 pt-3 border-t border-white/5">
                        <span className="block text-[9px] font-bold text-[#f97316] uppercase">Home Gate Parameters</span>
                        <input type="text" placeholder="House profile (e.g. Apartment 4B, Sector 4)" value={gateHouseProfile} onChange={(e) => setGateHouseProfile(e.target.value)} className="w-full p-2 bg-black border border-white/10 rounded text-xs outline-none" />
                        <textarea placeholder="Resident emergency instructions (e.g. key at gate)" value={gateInstructions} onChange={(e) => setGateInstructions(e.target.value)} className="w-full p-2 bg-black border border-white/10 rounded text-xs outline-none resize-none" rows={2} />
                      </div>
                    )}

                    {selectedCategory === 'luggage' && (
                      <div className="space-y-3 pt-3 border-t border-white/5">
                        <span className="block text-[9px] font-bold text-[#f97316] uppercase">Luggage Parameters</span>
                        <input type="text" placeholder="Verified Owner Name" value={luggageOwner} onChange={(e) => setLuggageOwner(e.target.value)} className="w-full p-2 bg-black border border-white/10 rounded text-xs outline-none" />
                        <input type="tel" placeholder="Backup contact for recovery" value={luggagePhone} onChange={(e) => setLuggagePhone(e.target.value)} className="w-full p-2 bg-black border border-white/10 rounded text-xs outline-none" />
                        <textarea placeholder="Lost-found note (e.g. traveling to London, reward offered)" value={luggageNote} onChange={(e) => setLuggageNote(e.target.value)} className="w-full p-2 bg-black border border-white/10 rounded text-xs outline-none resize-none" rows={2} />
                      </div>
                    )}

                    {selectedCategory === 'keychain' && (
                      <div className="space-y-3 pt-3 border-t border-white/5">
                        <span className="block text-[9px] font-bold text-[#f97316] uppercase">Keychain Emergency Medical</span>
                        <div className="grid grid-cols-3 gap-2">
                          <select value={keychainBlood} onChange={(e) => setKeychainBlood(e.target.value)} className="p-2 bg-black border border-white/10 rounded text-xs outline-none text-white">
                            {['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'].map(b => <option key={b} value={b}>{b}</option>)}
                          </select>
                          <input type="text" placeholder="Medical conditions" value={keychainConditions} onChange={(e) => setKeychainConditions(e.target.value)} className="col-span-2 p-2 bg-black border border-white/10 rounded text-xs outline-none" />
                        </div>
                        <input type="text" placeholder="Allergies (e.g. Peanuts, Penicillin)" value={keychainAllergies} onChange={(e) => setKeychainAllergies(e.target.value)} className="w-full p-2 bg-black border border-white/10 rounded text-xs outline-none" />
                      </div>
                    )}

                    {selectedCategory === 'child' && (
                      <div className="space-y-3 pt-3 border-t border-white/5">
                        <span className="block text-[9px] font-bold text-[#f97316] uppercase">School Bag Parameters</span>
                        <input type="email" placeholder="Notification Email for Parent" value={childEmail} onChange={(e) => setChildEmail(e.target.value)} className="w-full p-2 bg-black border border-white/10 rounded text-xs outline-none" />
                        <div className="grid grid-cols-2 gap-2">
                          <input type="text" placeholder="School Name" value={childSchool} onChange={(e) => setChildSchool(e.target.value)} className="p-2 bg-black border border-white/10 rounded text-xs outline-none" />
                          <input type="text" placeholder="School bus details" value={childBus} onChange={(e) => setChildBus(e.target.value)} className="p-2 bg-black border border-white/10 rounded text-xs outline-none" />
                        </div>
                      </div>
                    )}

                    <div className="flex gap-3 pt-3">
                      <button onClick={() => setWizardStep(2)} className="flex-1 py-3 border border-white/10 text-xs font-bold uppercase rounded-full">Back</button>
                      <button onClick={() => setWizardStep(4)} className="flex-1 py-3 bg-[#f97316] text-white text-xs font-bold uppercase rounded-full">Next Step</button>
                    </div>
                  </div>
                )}

                {/* STEP 4: SOS Settings & Activate */}
                {wizardStep === 4 && (
                  <div className="space-y-6">
                    <div className="text-left space-y-1">
                      <h4 className="text-sm font-bold uppercase tracking-wider">Configure Emergency SOS Settings</h4>
                      <p className="text-xs text-white/50 leading-relaxed font-sans">Finalize cryptographic shield parameters before asset deployment.</p>
                    </div>

                    <div className="space-y-3 border-t border-white/5 pt-4">
                      <div className="flex items-center justify-between p-3.5 bg-black rounded-lg border border-white/5">
                        <div className="text-xs">
                          <span className="font-bold text-white block uppercase tracking-wide">SMS Broadcast Channel</span>
                          <span className="text-white/40 block mt-0.5">Route updates to backup phone numbers instantly</span>
                        </div>
                        <input type="checkbox" defaultChecked className="w-4 h-4 rounded text-[#f97316] border-white/10 bg-black outline-none focus:ring-[#f97316]" />
                      </div>

                      <div className="flex items-center justify-between p-3.5 bg-black rounded-lg border border-white/5">
                        <div className="text-xs">
                          <span className="font-bold text-white block uppercase tracking-wide">Live Location sharing</span>
                          <span className="text-white/40 block mt-0.5">Prompt finders to share approximate GPS pin</span>
                        </div>
                        <input type="checkbox" defaultChecked className="w-4 h-4 rounded text-[#f97316] border-white/10 bg-black outline-none focus:ring-[#f97316]" />
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <button onClick={() => setWizardStep(3)} className="flex-1 py-3 border border-white/10 text-xs font-bold uppercase rounded-full">Back</button>
                      <button 
                        onClick={handleFinishActivation} 
                        className="flex-1 py-3 bg-[#f97316] text-white text-xs font-bold uppercase tracking-wider rounded-full shadow-lg transition-all"
                      >
                        Activate Tag
                      </button>
                    </div>
                  </div>
                )}
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ──────────────────────────────────────────────────────── */}
      {/* DIALOG 2: EDIT MODAL WITH CATEGORY-SPECIFIC FIELDS */}
      {/* ──────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {isEditModalOpen && editingProductId && (
          <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#111115] border border-[#222] rounded-2xl max-w-lg w-full overflow-hidden text-left"
            >
              <div className="p-5 border-b border-white/5 flex justify-between items-center bg-[#18181c]">
                <h3 className="text-sm font-bold uppercase tracking-wider text-white">Configure Safety Device Parameters</h3>
                <button onClick={() => setIsEditModalOpen(false)} className="text-white/40 hover:text-white bg-transparent border-none outline-none cursor-pointer">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-[9px] font-bold uppercase tracking-wider text-white/50 mb-1 pl-1">Product Custom Nickname</label>
                  <input
                    type="text"
                    required
                    value={newProductName}
                    onChange={(e) => setNewProductName(e.target.value)}
                    className="w-full p-2.5 bg-black border border-white/10 rounded text-xs outline-none focus:border-[#f97316]"
                  />
                </div>

                <div>
                  <label className="block text-[9px] font-bold uppercase tracking-wider text-white/50 mb-1 pl-1">Assigned Family Member</label>
                  <input
                    type="text"
                    required
                    value={newProductFamily}
                    onChange={(e) => setNewProductFamily(e.target.value)}
                    className="w-full p-2.5 bg-black border border-white/10 rounded text-xs outline-none focus:border-[#f97316]"
                  />
                </div>

                {/* Categories */}
                {(() => {
                  const p = products.find(prod => prod.id === editingProductId);
                  if (!p) return null;

                  if (p.category === 'car' || p.category === 'bike') {
                    return (
                      <div className="space-y-3 pt-3 border-t border-white/5">
                        <span className="block text-[9px] font-bold text-[#f97316] uppercase">Vehicle Parameters</span>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[8px] text-white/60 mb-0.5 uppercase">Make</label>
                            <input type="text" required value={make} onChange={(e) => setMake(e.target.value)} className="w-full p-2.5 bg-black border border-white/10 rounded text-xs outline-none" />
                          </div>
                          <div>
                            <label className="block text-[8px] text-white/60 mb-0.5 uppercase">Model</label>
                            <input type="text" required value={model} onChange={(e) => setModel(e.target.value)} className="w-full p-2.5 bg-black border border-white/10 rounded text-xs outline-none" />
                          </div>
                          <div>
                            <label className="block text-[8px] text-white/60 mb-0.5 uppercase">Color</label>
                            <input type="text" required value={color} onChange={(e) => setColor(e.target.value)} className="w-full p-2.5 bg-black border border-white/10 rounded text-xs outline-none" />
                          </div>
                          <div>
                            <label className="block text-[8px] text-white/60 mb-0.5 uppercase">License Plate</label>
                            <input type="text" required value={plate} onChange={(e) => setPlate(e.target.value)} className="w-full p-2.5 bg-black border border-white/10 rounded text-xs outline-none uppercase font-mono" />
                          </div>
                        </div>
                      </div>
                    );
                  }

                  if (p.category === 'home') {
                    return (
                      <div className="space-y-3 pt-3 border-t border-white/5">
                        <span className="block text-[9px] font-bold text-[#f97316] uppercase">Home Gate Parameters</span>
                        <div>
                          <label className="block text-[8px] text-white/60 mb-0.5 uppercase">House Profile Address</label>
                          <input type="text" required value={gateHouseProfile} onChange={(e) => setGateHouseProfile(e.target.value)} className="w-full p-2.5 bg-black border border-white/10 rounded text-xs outline-none" />
                        </div>
                        <div>
                          <label className="block text-[8px] text-white/60 mb-0.5 uppercase">Emergency instructions</label>
                          <textarea required value={gateInstructions} onChange={(e) => setGateInstructions(e.target.value)} className="w-full p-2.5 bg-black border border-white/10 rounded text-xs outline-none resize-none" rows={2} />
                        </div>
                      </div>
                    );
                  }

                  if (p.category === 'luggage') {
                    return (
                      <div className="space-y-3 pt-3 border-t border-white/5">
                        <span className="block text-[9px] font-bold text-[#f97316] uppercase">Luggage Recovery Parameters</span>
                        <div>
                          <label className="block text-[8px] text-white/60 mb-0.5 uppercase">Owner Recovery Name</label>
                          <input type="text" required value={luggageOwner} onChange={(e) => setLuggageOwner(e.target.value)} className="w-full p-2.5 bg-black border border-white/10 rounded text-xs outline-none" />
                        </div>
                        <div>
                          <label className="block text-[8px] text-white/60 mb-0.5 uppercase">Backup Phone</label>
                          <input type="tel" required value={luggagePhone} onChange={(e) => setLuggagePhone(e.target.value)} className="w-full p-2.5 bg-black border border-white/10 rounded text-xs outline-none" />
                        </div>
                        <div>
                          <label className="block text-[8px] text-white/60 mb-0.5 uppercase">Lost/Found Message Note</label>
                          <textarea required value={luggageNote} onChange={(e) => setLuggageNote(e.target.value)} className="w-full p-2.5 bg-black border border-white/10 rounded text-xs outline-none resize-none" rows={2} />
                        </div>
                      </div>
                    );
                  }

                  if (p.category === 'keychain') {
                    return (
                      <div className="space-y-3 pt-3 border-t border-white/5">
                        <span className="block text-[9px] font-bold text-[#f97316] uppercase">Keychain Medical SOS Records</span>
                        <div className="grid grid-cols-3 gap-3">
                          <div>
                            <label className="block text-[8px] text-white/60 mb-0.5 uppercase">Blood Group</label>
                            <select value={keychainBlood} onChange={(e) => setKeychainBlood(e.target.value)} className="w-full p-2.5 bg-black border border-white/10 rounded text-xs outline-none text-white">
                              {['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'].map(b => <option key={b} value={b}>{b}</option>)}
                            </select>
                          </div>
                          <div className="col-span-2">
                            <label className="block text-[8px] text-white/60 mb-0.5 uppercase">Medical Conditions</label>
                            <input type="text" value={keychainConditions} onChange={(e) => setKeychainConditions(e.target.value)} className="w-full p-2.5 bg-black border border-white/10 rounded text-xs outline-none" />
                          </div>
                        </div>
                        <div>
                          <label className="block text-[8px] text-white/60 mb-0.5 uppercase">Allergies Details</label>
                          <input type="text" value={keychainAllergies} onChange={(e) => setKeychainAllergies(e.target.value)} className="w-full p-2.5 bg-black border border-white/10 rounded text-xs outline-none" />
                        </div>
                      </div>
                    );
                  }

                  if (p.category === 'child') {
                    return (
                      <div className="space-y-3 pt-3 border-t border-white/5">
                        <span className="block text-[9px] font-bold text-[#f97316] uppercase">Child school Bag tracking</span>
                        <div>
                          <label className="block text-[8px] text-white/60 mb-0.5 uppercase">Parent Notification Email</label>
                          <input type="email" required value={childEmail} onChange={(e) => setChildEmail(e.target.value)} className="w-full p-2.5 bg-black border border-white/10 rounded text-xs outline-none" />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[8px] text-white/60 mb-0.5 uppercase">School Name</label>
                            <input type="text" required value={childSchool} onChange={(e) => setChildSchool(e.target.value)} className="w-full p-2.5 bg-black border border-white/10 rounded text-xs outline-none" />
                          </div>
                          <div>
                            <label className="block text-[8px] text-white/60 mb-0.5 uppercase">School Bus Route Logistics</label>
                            <input type="text" required value={childBus} onChange={(e) => setChildBus(e.target.value)} className="w-full p-2.5 bg-black border border-white/10 rounded text-xs outline-none" />
                          </div>
                        </div>
                      </div>
                    );
                  }

                  return null;
                })()}

                <div className="flex gap-3 pt-4 border-t border-white/5">
                  <button type="button" onClick={() => setIsEditModalOpen(false)} className="flex-1 py-3 border border-white/10 text-xs font-bold uppercase rounded-full">Cancel</button>
                  <button type="submit" className="flex-1 py-3 bg-[#f97316] text-white text-xs font-bold uppercase rounded-full">Save Changes</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ──────────────────────────────────────────────────────── */}
      {/* DIALOG 3: REPLACE TAG SERIAL */}
      {/* ──────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {isReplaceModalOpen && replacingProductId && (
          <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#111115] border border-[#222] rounded-2xl max-w-sm w-full p-6 text-left space-y-4"
            >
              <div className="space-y-1">
                <h4 className="text-sm font-bold uppercase tracking-wider text-white">Replace Sticker serial</h4>
                <p className="text-xs text-white/50 leading-relaxed font-sans">
                  In case of wear, damage, or sticker theft, link a fresh physical serial code to preserve configuration.
                </p>
              </div>

              <form onSubmit={handleReplaceSubmit} className="space-y-4">
                <div>
                  <label className="block text-[9px] font-bold uppercase tracking-wider text-white/50 mb-1.5 pl-1">New Alphanumeric QR Serial</label>
                  <input
                    type="text"
                    required
                    value={newReplacementQrId}
                    onChange={(e) => setNewReplacementQrId(e.target.value.toUpperCase())}
                    placeholder="e.g. QR-2A9X"
                    className="w-full p-3 bg-black border border-white/10 rounded-lg text-xs font-mono text-center tracking-widest text-[#f97316] font-bold outline-none focus:border-[#f97316]"
                  />
                </div>

                <div className="flex gap-3">
                  <button type="button" onClick={() => setIsReplaceModalOpen(false)} className="flex-1 py-2.5 border border-white/10 text-xs font-bold uppercase rounded-full">Cancel</button>
                  <button type="submit" className="flex-1 py-2.5 bg-[#f97316] text-white text-xs font-bold uppercase rounded-full">Update Link</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ──────────────────────────────────────────────────────── */}
      {/* DIALOG 4: TRANSFER OWNERSHIP */}
      {/* ──────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {isTransferModalOpen && transferringProductId && (
          <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#111115] border border-[#222] rounded-2xl max-w-sm w-full p-6 text-left space-y-4"
            >
              <div className="space-y-1">
                <h4 className="text-sm font-bold uppercase tracking-wider text-white">Transfer Product Ownership</h4>
                <p className="text-xs text-white/50 leading-relaxed font-sans font-medium">
                  Relinquish custody and map the physical tag serial directly to another user's email ID.
                </p>
              </div>

              <form onSubmit={handleTransferSubmit} className="space-y-4">
                <div>
                  <label className="block text-[9px] font-bold uppercase tracking-wider text-white/50 mb-1.5 pl-1">Recipient Email Address</label>
                  <input
                    type="email"
                    required
                    value={transferEmail}
                    onChange={(e) => setTransferEmail(e.target.value)}
                    placeholder="e.g. transfer-target@domain.com"
                    className="w-full p-3 bg-black border border-white/10 rounded-lg text-xs outline-none focus:border-[#f97316]"
                  />
                </div>

                <div className="flex gap-3">
                  <button type="button" onClick={() => setIsTransferModalOpen(false)} className="flex-1 py-2.5 border border-white/10 text-xs font-bold uppercase rounded-full">Cancel</button>
                  <button type="submit" className="flex-1 py-2.5 bg-[#f97316] text-white text-xs font-bold uppercase rounded-full">Assign & Send</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

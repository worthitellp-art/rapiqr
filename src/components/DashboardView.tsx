/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  LayoutDashboard,
  Car,
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
  X
} from 'lucide-react';
import TiltCard from './ui/TiltCard';
import MagneticBtn from './ui/MagneticBtn';
import { Vehicle, QRCodeData, Report, UserProfile } from '../types';

interface DashboardViewProps {
  user: UserProfile;
  vehicles: Vehicle[];
  qrCodes: QRCodeData[];
  reports: Report[];
  onLogout: () => void;
  onUpdateVehicles: (v: Vehicle[]) => void;
  onUpdateQrCodes: (q: QRCodeData[]) => void;
  onUpdateReports: (r: Report[]) => void;
  onUpdateUser: (u: UserProfile) => void;
  onSimulatePublicScan: (qrId: string) => void;
}

export default function DashboardView({
  user,
  vehicles,
  qrCodes,
  reports,
  onLogout,
  onUpdateVehicles,
  onUpdateQrCodes,
  onUpdateReports,
  onUpdateUser,
  onSimulatePublicScan,
}: DashboardViewProps) {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'QRWizard' | 'reports' | 'settings'>('dashboard');
  const [selectedTemplate, setSelectedTemplate] = useState<'playstation' | 'street_art' | 'minimal_light' | 'gold_plus'>('playstation');
  const [bulkCount, setBulkCount] = useState<number>(5);
  const [selectedQrCodeIdForLinking, setSelectedQrCodeIdForLinking] = useState<string | null>(null);
  const [selectedQrIds, setSelectedQrIds] = useState<string[]>([]);
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingQrId, setEditingQrId] = useState<string | null>(null);
  const [isActivating, setIsActivating] = useState(false);
  const [activationProgress, setActivationProgress] = useState(0);
  const [isActivationComplete, setIsActivationComplete] = useState(false);
  const [activatedQrId, setActivatedQrId] = useState<string | null>(null);
  const [rowActivationId, setRowActivationId] = useState<string | null>(null);
  const [rowProgress, setRowProgress] = useState(0);
  const [editMake, setEditMake] = useState('');
  const [editModel, setEditModel] = useState('');
  const [editYear, setEditYear] = useState(new Date().getFullYear());
  const [editColor, setEditColor] = useState('');
  const [editPlate, setEditPlate] = useState('');

  const qrWizards = vehicles;
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(vehicles.length > 0 ? vehicles[0].id : null);
  const [isAddVehicleOpen, setIsAddVehicleOpen] = useState(false);
  const [reportFilter, setReportFilter] = useState<'all' | 'unread' | 'acknowledged' | 'resolved'>('all');
  const [qrCurrentPage, setQrCurrentPage] = useState<number>(1);
  const qrItemsPerPage = 10;

  const [rangeFrom, setRangeFrom] = useState<number>(1);
  const [rangeTo, setRangeTo] = useState<number>(10);

  const totalQrPages = Math.ceil(qrCodes.length / qrItemsPerPage);
  const activeQrPage = Math.max(1, Math.min(qrCurrentPage, totalQrPages || 1));
  const startIndex = (activeQrPage - 1) * qrItemsPerPage;
  const paginatedQrCodes = qrCodes.slice(startIndex, startIndex + qrItemsPerPage);

  const getTemplateStyles = (tpl: string) => {
    switch (tpl) {
      case 'playstation':
        return {
          card: { background: '#000000', border: '1px solid rgba(255,255,255,0.15)', color: '#ffffff' },
          textPrimary: 'text-white',
          textSecondary: 'text-white/60',
          accentBorder: 'border-[#0070d1]',
          stickerIdColor: 'text-[#0070d1]',
        };
      case 'street_art':
        return {
          card: { background: '#0a0a0c', border: '1px solid rgba(255,255,255,0.15)', color: '#ffffff', backgroundImage: 'radial-gradient(rgba(0,112,209,0.15) 1px, transparent 0)', backgroundSize: '8px 8px' },
          textPrimary: 'text-white',
          textSecondary: 'text-pink-500',
          accentBorder: 'border-pink-500',
          stickerIdColor: 'text-pink-500',
        };
      case 'gold_plus':
        return {
          card: { background: '#121314', border: '1px solid rgba(255,255,255,0.15)', color: '#ffffff', borderTop: '4px solid #ffce21' },
          textPrimary: 'text-white',
          textSecondary: 'text-amber-400',
          accentBorder: 'border-amber-400',
          stickerIdColor: 'text-amber-400',
        };
      case 'minimal_light':
      default:
        return {
          card: { background: '#ffffff', border: '1px solid #cccccc', color: '#000000' },
          textPrimary: 'text-black',
          textSecondary: 'text-black/60',
          accentBorder: 'border-black',
          stickerIdColor: 'text-black/50',
        };
    }
  };

  // Generate bulk active standalone QR codes (max 1000 stickers)
  const handleGenerateBulkQr = (count: number) => {
    const clampedCount = Math.min(1000, Math.max(1, count));
    const newQrs: QRCodeData[] = [];
    for (let i = 0; i < clampedCount; i++) {
      const newQrId = `QR-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      newQrs.push({
        id: newQrId,
        vehicleId: null,
        status: 'unlinked',
        scansCount: 0,
        createdAt: new Date().toISOString(),
      });
    }
    onUpdateQrCodes([...qrCodes, ...newQrs]);
    setQrCurrentPage(1); // Go to first page to see the new codes
  };

  // Select range of stickers (1-based indices)
  const handleSelectRange = (from: number, to: number) => {
    if (qrCodes.length === 0) return;
    const start = Math.max(1, Math.min(from, qrCodes.length));
    const end = Math.max(1, Math.min(to, qrCodes.length));
    const minIdx = Math.min(start, end) - 1;
    const maxIdx = Math.max(start, end) - 1;
    
    const rangeIds = qrCodes.slice(minIdx, maxIdx + 1).map(q => q.id);
    const newSelection = Array.from(new Set([...selectedQrIds, ...rangeIds]));
    setSelectedQrIds(newSelection);
  };

  // Instant link and activation of standalone tag with default details
  const handleInstantLinkAndActivate = (qrId: string) => {
    const nextVehId = `V-${Date.now().toString().slice(-4)}`;
    const randomPlate = `N-${Math.floor(1000 + Math.random() * 9000)}`;
    const newVehicle: Vehicle = {
      id: nextVehId,
      make: 'Generic',
      model: 'Vehicle',
      year: new Date().getFullYear(),
      color: 'Default',
      licensePlate: randomPlate,
      status: 'active',
      qrCodeUrl: qrId,
      createdAt: new Date().toISOString(),
    };

    const updatedQrs = qrCodes.map(q => 
      q.id === qrId ? { ...q, vehicleId: nextVehId, status: 'active' as const } : q
    );

    onUpdateVehicles([newVehicle, ...vehicles]);
    onUpdateQrCodes(updatedQrs);
  };

  // Start animated progress bar activation process
  const startActivationProcess = () => {
    if (!activatedQrId) return;
    setIsActivating(true);
    setActivationProgress(0);
    setIsActivationComplete(false);

    let progress = 0;
    const interval = setInterval(() => {
      progress += 5;
      setActivationProgress(progress);
      if (progress >= 100) {
        clearInterval(interval);
        
        // Actually link and activate
        const nextVehId = `V-${Date.now().toString().slice(-4)}`;
        const randomPlate = `N-${Math.floor(1000 + Math.random() * 9000)}`;
        const newVehicle: Vehicle = {
          id: nextVehId,
          make: 'Generic',
          model: 'Vehicle',
          year: new Date().getFullYear(),
          color: 'Default',
          licensePlate: randomPlate,
          status: 'active',
          qrCodeUrl: activatedQrId,
          createdAt: new Date().toISOString(),
        };

        const updatedQrs = qrCodes.map(q => 
          q.id === activatedQrId ? { ...q, vehicleId: nextVehId, status: 'active' as const } : q
        );

        onUpdateVehicles([newVehicle, ...vehicles]);
        onUpdateQrCodes(updatedQrs);
        
        setIsActivating(false);
        setIsActivationComplete(true);
      }
    }, 75);
  };

  // Inline row activation handler with progress bar
  const handleInlineRowActivation = (qrId: string) => {
    setRowActivationId(qrId);
    setRowProgress(0);

    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      setRowProgress(progress);
      if (progress >= 100) {
        clearInterval(interval);

        // Link and activate generic profile
        const nextVehId = `V-${Date.now().toString().slice(-4)}`;
        const randomPlate = `N-${Math.floor(1000 + Math.random() * 9000)}`;
        const newVehicle: Vehicle = {
          id: nextVehId,
          make: 'Generic',
          model: 'Vehicle',
          year: new Date().getFullYear(),
          color: 'Default',
          licensePlate: randomPlate,
          status: 'active',
          qrCodeUrl: qrId,
          createdAt: new Date().toISOString(),
        };

        const updatedQrs = qrCodes.map(q => 
          q.id === qrId ? { ...q, vehicleId: nextVehId, status: 'active' as const } : q
        );

        onUpdateVehicles([newVehicle, ...vehicles]);
        onUpdateQrCodes(updatedQrs);
        setSelectedVehicleId(nextVehId);
        
        // Let the tick animation display, then redirect to public scan page
        setTimeout(() => {
          setRowActivationId(null);
          onSimulatePublicScan(qrId);
        }, 800);
      }
    }, 100);
  };

  // Instant create, link, and activate of new tag
  const handleInstantCreateAndActivate = () => {
    const newQrId = `QR-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const nextVehId = `V-${Date.now().toString().slice(-4)}`;
    const randomPlate = `N-${Math.floor(1000 + Math.random() * 9000)}`;
    
    const newVehicle: Vehicle = {
      id: nextVehId,
      make: 'Generic',
      model: 'Vehicle',
      year: new Date().getFullYear(),
      color: 'Default',
      licensePlate: randomPlate,
      status: 'active',
      qrCodeUrl: newQrId,
      createdAt: new Date().toISOString(),
    };

    const newQr: QRCodeData = {
      id: newQrId,
      vehicleId: nextVehId,
      status: 'active',
      scansCount: 0,
      createdAt: new Date().toISOString(),
    };

    onUpdateVehicles([newVehicle, ...vehicles]);
    onUpdateQrCodes([newQr, ...qrCodes]);
    setQrCurrentPage(1);
  };

  const currentSelectedVehicleId = selectedVehicleId && vehicles.some(v => v.id === selectedVehicleId)
    ? selectedVehicleId
    : (vehicles[0]?.id || null);

  // Register vehicle form state
  const [carMake, setCarMake] = useState('');
  const [carModel, setCarModel] = useState('');
  const [carYear, setCarYear] = useState(new Date().getFullYear());
  const [carColor, setCarColor] = useState('');
  const [carPlate, setCarPlate] = useState('');
  const [formError, setFormError] = useState('');

  // Total QR scans calculator
  const totalScans = qrCodes.reduce((sum, q) => sum + q.scansCount, 0);

  // Mark report as acknowledged
  const handleAcknowledgeReport = (reportId: string) => {
    const updated = reports.map((r) =>
      r.id === reportId ? { ...r, status: 'acknowledged' as const } : r
    );
    onUpdateReports(updated);
  };

  // Mark report as resolved
  const handleResolveReport = (reportId: string) => {
    const updated = reports.map((r) =>
      r.id === reportId ? { ...r, status: 'resolved' as const } : r
    );
    onUpdateReports(updated);
  };

  // Delete report entirely
  const handleDeleteReport = (reportId: string) => {
    const filtered = reports.filter((r) => r.id !== reportId);
    onUpdateReports(filtered);
  };

  // Toggle vehicle active status
  const handleToggleVehicleStatus = (vehicleId: string) => {
    const updated = vehicles.map((v) => {
      if (v.id === vehicleId) {
        const nextStatus = v.status === 'active' ? 'inactive' as const : 'active' as const;
        return { ...v, status: nextStatus };
      }
      return v;
    });
    onUpdateVehicles(updated);
  };

  // Delete a vehicle and unlink its QR code
  const handleDeleteVehicle = (vehicleId: string) => {
    const vehicleToDelete = vehicles.find((v) => v.id === vehicleId);
    if (!vehicleToDelete) return;

    // Remove vehicle
    const updatedVehicles = vehicles.filter((v) => v.id !== vehicleId);
    onUpdateVehicles(updatedVehicles);

    // Unlink its mapped QR code in QR pool
    const updatedQrs = qrCodes.map((q) => {
      if (q.vehicleId === vehicleId) {
        return { ...q, vehicleId: null, status: 'unlinked' as const };
      }
      return q;
    });
    onUpdateQrCodes(updatedQrs);
  };

  // Register New Vehicle handler
  const handleRegisterVehicleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!carMake || !carModel || !carColor || !carPlate) {
      setFormError('Please enter all required QR Wizard details.');
      return;
    }

    setFormError('');

    // Formulate a new unique ID
    const nextVehId = `V-${Date.now().toString().slice(-4)}`;
    const nextQrId = selectedQrCodeIdForLinking || `QR-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    const newVehicle: Vehicle = {
      id: nextVehId,
      make: carMake,
      model: carModel,
      year: Number(carYear),
      color: carColor,
      licensePlate: carPlate.toUpperCase(),
      status: 'active',
      qrCodeUrl: nextQrId,
      createdAt: new Date().toISOString(),
    };

    // Check if QR code already exists in our pool (e.g. was generated standalone first)
    const qrExists = qrCodes.some(q => q.id === nextQrId);
    let updatedQrs: QRCodeData[] = [];
    if (qrExists) {
      updatedQrs = qrCodes.map(q => q.id === nextQrId ? { ...q, vehicleId: nextVehId, status: 'active' as const } : q);
    } else {
      const newQr: QRCodeData = {
        id: nextQrId,
        vehicleId: nextVehId,
        status: 'active',
        scansCount: 0,
        createdAt: new Date().toISOString(),
      };
      updatedQrs = [newQr, ...qrCodes];
    }

    onUpdateVehicles([newVehicle, ...vehicles]);
    onUpdateQrCodes(updatedQrs);
    setSelectedQrCodeIdForLinking(null);

    // Cleanup form states
    setCarMake('');
    setCarModel('');
    setCarColor('');
    setCarPlate('');
    setIsAddVehicleOpen(false);
  };

  // Submit changes for sticker edit modal
  const handleEditStickerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingQrId) return;

    // Find if vehicle is currently linked to this QR code
    const v = vehicles.find((vh) => vh.qrCodeUrl === editingQrId || vh.id === (qrCodes.find(qr => qr.id === editingQrId)?.vehicleId));

    if (v) {
      // Update existing vehicle info
      const updatedVehicles = vehicles.map(vh => {
        if (vh.id === v.id) {
          return {
            ...vh,
            make: editMake,
            model: editModel,
            year: Number(editYear),
            color: editColor,
            licensePlate: editPlate.toUpperCase()
          };
        }
        return vh;
      });
      onUpdateVehicles(updatedVehicles);
    } else {
      // Standalone QR tag: If user entered details, link a new vehicle to it
      if (editMake && editModel && editColor && editPlate) {
        const nextVehId = `V-${Date.now().toString().slice(-4)}`;
        const newVehicle: Vehicle = {
          id: nextVehId,
          make: editMake,
          model: editModel,
          year: Number(editYear),
          color: editColor,
          licensePlate: editPlate.toUpperCase(),
          status: 'active',
          qrCodeUrl: editingQrId,
          createdAt: new Date().toISOString(),
        };

        const updatedQrs = qrCodes.map(q => q.id === editingQrId ? { ...q, vehicleId: nextVehId, status: 'active' as const } : q);

        onUpdateVehicles([newVehicle, ...vehicles]);
        onUpdateQrCodes(updatedQrs);
      }
    }

    // Reset editing states
    setIsEditModalOpen(false);
    setEditingQrId(null);
  };

  // Delete all selected stickers in bulk
  const handleBulkDelete = () => {
    const updatedQrs = qrCodes.filter(q => !selectedQrIds.includes(q.id));
    const updatedVehicles = vehicles.filter(v => {
      const qr = qrCodes.find(q => q.id === v.qrCodeUrl || q.id === v.id);
      return !qr || !selectedQrIds.includes(qr.id);
    });
    onUpdateQrCodes(updatedQrs);
    onUpdateVehicles(updatedVehicles);
    setSelectedQrIds([]);
    
    // Adjust page state to prevent showing empty page
    const newTotalPages = Math.ceil(updatedQrs.length / qrItemsPerPage);
    if (qrCurrentPage > newTotalPages) {
      setQrCurrentPage(Math.max(1, newTotalPages));
    }
  };

  // Toggle active/mute status for all selected stickers/vehicles in bulk
  const handleBulkToggleStatus = () => {
    // Find all vehicles linked to the selected QR codes
    const linkedVehicleIds = vehicles
      .filter(v => selectedQrIds.includes(v.qrCodeUrl || v.id))
      .map(v => v.id);
      
    if (linkedVehicleIds.length === 0) return;
    
    // Toggle active status for all these vehicles
    const updatedVehicles = vehicles.map(v => {
      if (linkedVehicleIds.includes(v.id)) {
        const nextStatus = v.status === 'active' ? 'inactive' as const : 'active' as const;
        return { ...v, status: nextStatus };
      }
      return v;
    });
    
    onUpdateVehicles(updatedVehicles);
  };

  // Auto-fill form values for easy onboarding test
  const handleAutoFillVehicle = () => {
    const presets = [
      { make: 'Porsche', model: 'Taycan Turbo', color: 'Chalk Gray', plate: 'P-ELECTRIC' },
      { make: 'Audi', model: 'e-tron GT', color: 'Daytona Gray', plate: 'GT-CHARGER' },
      { make: 'Rivian', model: 'R1T Adventure', color: 'Forest Green', plate: 'R-ADVENT' },
    ];
    const picked = presets[Math.floor(Math.random() * presets.length)];
    setCarMake(picked.make);
    setCarModel(picked.model);
    setCarColor(picked.color);
    setCarPlate(picked.plate);
  };

  // Generate an unassigned stand-alone QR code
  const handleGenerateStandaloneQr = () => {
    const newQrId = `QR-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const newQr: QRCodeData = {
      id: newQrId,
      vehicleId: null,
      status: 'unlinked',
      scansCount: 0,
      createdAt: new Date().toISOString(),
    };
    onUpdateQrCodes([...qrCodes, newQr]);
  };

  return (
    <div id="dashboard-layout" className="min-h-screen bg-[#f3f3f3] flex flex-col md:flex-row text-black font-sans relative overflow-hidden">
      {/* Sidebar Rail (Clean White with Hairline) */}
      <aside className="w-full md:w-64 bg-white border-r border-[#f3f3f3] shrink-0 flex flex-col justify-between relative z-20">
        <div>
          {/* Dashboard Premium Brand Header */}
          <div className="h-16 border-b border-[#f3f3f3] px-6 flex items-center gap-2">
            <div className="text-black font-serif font-light text-lg tracking-tight flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded-full bg-[#0070d1]"></span>
              Namo<span className="font-bold text-[#0070d1]">QR</span>
            </div>
          </div>

          {/* User profile identifier row */}
          <div className="p-4 border-b border-[#f3f3f3] flex items-center gap-3 bg-[#f5f7fa]">
            <div className="w-8 h-8 rounded-full bg-[#0070d1] text-white flex items-center justify-center font-bold text-xs shrink-0 select-none">
              {user.fullName.slice(0, 2).toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <h4 className="text-xs font-bold text-black truncate tracking-tight">{user.fullName}</h4>
              <p className="text-xs text-black/60 truncate mt-0.5">{user.email}</p>
            </div>
          </div>

          {/* Navigation Side Links */}
          <nav className="p-3 space-y-1 relative">
            <button
              id="sidebar-tab-dashboard"
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-md text-left text-xs font-bold tracking-wider uppercase transition-all cursor-pointer ${
                activeTab === 'dashboard' ? 'bg-[#0070d1] text-white' : 'text-black/60 hover:text-black hover:bg-slate-50'
              }`}
            >
              <LayoutDashboard size={14} className="shrink-0" />
              <span>Dashboard</span>
            </button>

            <button
              id="sidebar-tab-QRWizard"
              onClick={() => setActiveTab('QRWizard')}
              className={`w-full flex items-center justify-between px-4 py-2.5 rounded-md text-left text-xs font-bold tracking-wider uppercase transition-all cursor-pointer ${
                activeTab === 'QRWizard' ? 'bg-[#0070d1] text-white' : 'text-black/60 hover:text-black hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <QrCode size={14} className="shrink-0" />
                <span>QR Tags</span>
              </div>
              <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                activeTab === 'QRWizard' ? 'bg-white/20 text-white' : 'bg-slate-100 text-black/60'
              }`}>
                {vehicles.length}
              </span>
            </button>

            <button
              id="sidebar-tab-reports"
              onClick={() => setActiveTab('reports')}
              className={`w-full flex items-center justify-between px-4 py-2.5 rounded-md text-left text-xs font-bold tracking-wider uppercase transition-all cursor-pointer ${
                activeTab === 'reports' ? 'bg-[#0070d1] text-white' : 'text-black/60 hover:text-black hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <FileText size={14} className="shrink-0" />
                <span>Alerts</span>
              </div>
              {reports.filter(r => r.status === 'unread').length > 0 ? (
                <span className="px-2 py-0.5 bg-[#c81b3a] text-white rounded-md text-[10px] font-bold">
                  {reports.filter(r => r.status === 'unread').length}
                </span>
              ) : (
                <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                  activeTab === 'reports' ? 'bg-white/20 text-white' : 'bg-slate-100 text-black/60'
                }`}>
                  {reports.length}
                </span>
              )}
            </button>

            <button
              id="sidebar-tab-settings"
              onClick={() => setActiveTab('settings')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-md text-left text-xs font-bold tracking-wider uppercase transition-all cursor-pointer ${
                activeTab === 'settings' ? 'bg-[#0070d1] text-white' : 'text-black/60 hover:text-black hover:bg-slate-50'
              }`}
            >
              <Settings size={14} className="shrink-0" />
              <span>Settings</span>
            </button>
          </nav>
        </div>

        {/* Sidebar Footer Logout button */}
        <div className="p-4 border-t border-[#f3f3f3] bg-transparent">
          <button
            id="sidebar-logout-btn"
            onClick={onLogout}
            className="w-full h-10 inline-flex items-center justify-center gap-2 border border-slate-200 rounded-md bg-white hover:bg-[#c81b3a]/5 hover:text-[#c81b3a] hover:border-[#c81b3a]/25 text-xs font-bold tracking-wide uppercase transition-all cursor-pointer"
          >
            <LogOut size={12} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-grow flex flex-col min-h-0 bg-transparent overflow-y-auto">
        {/* Dynamic Screen Header (Quiet chrome, clean and fresh) */}
        <header className="h-16 bg-white border-b border-[#f3f3f3] px-6 sm:px-8 shrink-0 flex items-center justify-between z-10">
          <h2 className="font-serif font-light text-base text-black uppercase tracking-wider">
            {activeTab === 'dashboard' && 'Control Dashboard'}
            {activeTab === 'QRWizard' && 'QR Tag Collection'}
            {activeTab === 'reports' && 'Bystander Alerts'}
            {activeTab === 'settings' && 'Account Settings'}
          </h2>

          <div className="flex items-center gap-3">
            <button
              id="register-vehicle-quick-btn"
              onClick={handleInstantCreateAndActivate}
              className="clay-button-primary px-5 py-2 text-xs flex items-center gap-1.5 cursor-pointer h-9"
            >
              <Plus size={14} /> Add QR Sticker
            </button>
          </div>
        </header>

        {/* Inner Content Scaffolder */}
        <div className="p-6 sm:p-8 max-w-[1440px] w-full mx-auto">
          {/* TAB 1: DASHBOARD HOME */}
          {activeTab === 'dashboard' && (
            <div id="dashboard-home-view" className="space-y-8">
              {/* Top Banner Greetings card */}
              <div className="bg-white border border-[#f3f3f3] rounded-md p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-xl font-serif font-light text-black uppercase tracking-tight">
                    Welcome back, {user.fullName}
                  </h3>
                  <p className="text-xs text-black/60 mt-1 font-medium font-sans">
                    Monitor security status, scans, and active vehicle tag channels.
                  </p>
                </div>
                {/* Date stamp indicator */}
                <div className="flex items-center gap-2 bg-[#f5f7fa] border border-[#f3f3f3] px-3.5 py-2 rounded-md shrink-0">
                  <Calendar size={14} className="text-[#0070d1]" />
                  <span className="font-sans text-xs text-black font-bold">
                    {new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </div>
              </div>

              {/* 4 key metrics indicator cards (flat, no drop shadow, clean layout) */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {/* CARD 1 */}
                <div className="bg-white border border-[#f3f3f3] rounded-md p-5">
                  <div className="flex justify-between items-start">
                    <span className="text-[11px] font-bold text-black/50 tracking-wider uppercase">
                      Vehicles Protected
                    </span>
                    <div className="px-2 py-0.5 bg-[#f5f7fa] text-black/70 rounded-[4px] text-[10px] font-bold">
                      Total
                    </div>
                  </div>
                  <h4 className="text-3xl font-serif font-light text-black mt-3">
                    {vehicles.length}
                  </h4>
                  <div className="text-[10px] text-emerald-600 font-bold mt-3 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Shield Active
                  </div>
                </div>

                {/* CARD 2 */}
                <div className="bg-white border border-[#f3f3f3] rounded-md p-5">
                  <div className="flex justify-between items-start">
                    <span className="text-[11px] font-bold text-black/50 tracking-wider uppercase">
                      Active QR Codes
                    </span>
                    <button
                      onClick={handleGenerateStandaloneQr}
                      title="Add blank QR Code"
                      className="p-0.5 hover:bg-slate-50 text-[#0070d1] rounded transition-colors cursor-pointer"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                  <h4 className="text-3xl font-serif font-light text-black mt-3">
                    {qrCodes.length}
                  </h4>
                  <div className="text-[10px] text-black/60 mt-3 font-semibold">
                    {qrCodes.filter((q) => q.status === 'unlinked').length} Unlinked Tag(s)
                  </div>
                </div>

                {/* CARD 3 */}
                <div className="bg-white border border-[#f3f3f3] rounded-md p-5">
                  <div className="flex justify-between items-start">
                    <span className="text-[11px] font-bold text-black/50 tracking-wider uppercase">
                      Total Scans
                    </span>
                    <div className="px-2 py-0.5 bg-amber-50 text-amber-700 rounded-[4px] text-[10px] font-bold border border-amber-100">
                      All Time
                    </div>
                  </div>
                  <h4 className="text-3xl font-serif font-light text-black mt-3">
                    {totalScans}
                  </h4>
                  <div className="text-[10px] text-black/60 mt-3 font-semibold">
                    Scans across tags
                  </div>
                </div>

                {/* CARD 4 */}
                <div className="bg-white border border-[#f3f3f3] rounded-md p-5">
                  <div className="flex justify-between items-start">
                    <span className="text-[11px] font-bold text-black/50 tracking-wider uppercase">
                      Received Alerts
                    </span>
                    {reports.filter(r => r.status === 'unread').length > 0 && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#c81b3a]"></span>
                    )}
                  </div>
                  <h4 className="text-3xl font-serif font-light text-black mt-3">
                    {reports.length}
                  </h4>
                  <div className="text-[10px] text-black/60 mt-3 font-semibold">
                    {reports.filter((r) => r.status === 'unread').length} Unread Notice(s)
                  </div>
                </div>
              </div>

              {/* PlayStation-Style Simulator/Sandbox Banner (Dark full bleed component feel) */}
              <div className="bg-[#121314] p-6 rounded-md border border-white/5 text-white">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                  <div className="md:col-span-2 space-y-2 text-left">
                    <h4 className="font-serif font-light text-lg uppercase tracking-wider text-white">Simulate Bystander QR Scan</h4>
                    <p className="text-xs text-white/70 leading-relaxed font-sans">
                      Test the system by acting as a passerby scanning your vehicle tag. Select any vehicle below to open the public submission form in sandbox mode.
                    </p>
                  </div>
                  <div className="flex flex-col gap-2">
                    {vehicles.slice(0, 3).map((v) => (
                      <button
                        key={v.id}
                        onClick={() => onSimulatePublicScan(v.qrCodeUrl)}
                        className="text-left px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/15 hover:border-white/30 text-xs font-bold uppercase tracking-wider text-white rounded-full transition-all cursor-pointer flex items-center justify-between"
                      >
                        <span>{v.make} ({v.qrCodeUrl})</span>
                        <ChevronRight size={14} className="text-[#0070d1] shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Quick Split View layout */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Active Plates Column */}
                <div className="bg-white border border-[#f3f3f3] rounded-md p-5 lg:col-span-1">
                  <div className="flex justify-between items-center mb-4 pb-2 border-b border-[#f3f3f3]">
                    <h4 className="text-xs font-bold text-black uppercase tracking-wider">Active Tag List</h4>
                    <button
                      onClick={() => setActiveTab('QRWizard')}
                      className="text-[11px] font-bold text-[#0070d1] hover:text-[#0064b7] transition-colors cursor-pointer uppercase tracking-wider"
                    >
                      View All
                    </button>
                  </div>
                  <div className="space-y-3">
                    {vehicles.length === 0 ? (
                      <p className="text-xs text-black/40 text-center py-6">No tags registered</p>
                    ) : (
                      vehicles.slice(0, 3).map((v) => (
                        <div key={v.id} className="flex justify-between items-center p-3 rounded-md bg-[#f5f7fa] border border-[#f3f3f3] text-xs">
                          <div>
                            <span className="font-bold text-black block">{v.make} {v.model}</span>
                            <span className="text-[10px] text-black/60 block mt-0.5">{v.color} &bull; {v.licensePlate}</span>
                          </div>
                          <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full border uppercase tracking-wider ${
                            v.status === 'active' ? 'bg-[#0070d1]/10 text-[#0070d1] border-[#0070d1]/20' : 'bg-slate-100 text-black/40 border-slate-200'
                          }`}>
                            {v.status === 'active' ? 'ON' : 'OFF'}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Recent Alerts Feed Column */}
                <div className="bg-white border border-[#f3f3f3] rounded-md p-5 lg:col-span-2">
                  <div className="flex justify-between items-center mb-4 pb-2 border-b border-[#f3f3f3]">
                    <h4 className="text-xs font-bold text-black uppercase tracking-wider">Recent Alerts</h4>
                    <button
                      onClick={() => setActiveTab('reports')}
                      className="text-[11px] font-bold text-[#0070d1] hover:text-[#0064b7] transition-colors cursor-pointer uppercase tracking-wider"
                    >
                      Alert Feed ({reports.filter(r => r.status === 'unread').length} New)
                    </button>
                  </div>
                  <div className="space-y-3">
                    {reports.length === 0 ? (
                      <div className="text-center py-8 text-black/40 text-xs flex flex-col items-center justify-center gap-1.5">
                        <FileCheck size={24} className="text-black/20" />
                        <p>No alerts received. Status clear.</p>
                      </div>
                    ) : (
                      reports.slice(0, 2).map((r) => (
                        <div key={r.id} className="p-3 rounded-md border border-[#f3f3f3] bg-[#f5f7fa] text-xs space-y-2">
                          <div className="flex justify-between items-start">
                            <div>
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border ${
                                r.type === 'accident'
                                  ? 'bg-[#c81b3a]/10 text-[#c81b3a] border-[#c81b3a]/20'
                                  : r.type === 'wrong_parking'
                                    ? 'bg-[#d53b00]/10 text-[#d53b00] border-[#d53b00]/20'
                                    : 'bg-[#0070d1]/10 text-[#0070d1] border-[#0070d1]/20'
                              }`}>
                                {r.type === 'accident' ? '🚨 Hazard' : r.type === 'wrong_parking' ? '🚗 Parking' : '📞 Contact'}
                              </span>
                              <h5 className="font-bold text-black mt-2 text-sm">
                                {r.vehicleLabel}
                              </h5>
                            </div>
                            <span className="text-[10px] text-black/45">
                              {new Date(r.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-black/85 bg-white p-2.5 rounded-md border border-slate-100 italic leading-relaxed">
                            "{r.message}"
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: VEHICLE & QR LIST */}
          {activeTab === 'QRWizard' && (
            <div id="qr-wizard-tab-view" className="space-y-6">
              
              {/* Inline style block for clean print styling */}
              <style>{`
                @media print {
                  #dashboard-layout, header, aside, .no-print {
                    display: none !important;
                  }
                  .print-only {
                    display: block !important;
                  }
                  .print-page-break {
                    page-break-inside: avoid;
                    break-inside: avoid;
                  }
                }
              `}</style>

              {/* Bulk Actions Banner */}
              {selectedQrIds.length > 0 && (
                <div className="p-3 bg-[#0070d1] text-white rounded-md flex justify-between items-center text-xs md:text-sm animate-fade-in no-print">
                  <div className="flex items-center gap-2 pl-2">
                    <span className="font-bold uppercase tracking-wider">{selectedQrIds.length} Tag(s) Selected</span>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => window.print()}
                      className="px-5 py-2 bg-white text-black font-bold uppercase tracking-wider rounded-full cursor-pointer text-[10px] md:text-xs h-8 flex items-center justify-center transition-all active:scale-[0.97]"
                    >
                      Print Selected
                    </button>
                    <button 
                      onClick={handleBulkDelete}
                      className="px-5 py-2 bg-[#c81b3a] hover:bg-red-700 text-white font-bold uppercase tracking-wider rounded-full cursor-pointer text-[10px] md:text-xs h-8 flex items-center justify-center transition-all active:scale-[0.97]"
                    >
                      Delete Selected
                    </button>
                    <button 
                      onClick={handleBulkToggleStatus}
                      className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold uppercase tracking-wider rounded-full cursor-pointer text-[10px] md:text-xs h-8 flex items-center justify-center transition-all active:scale-[0.97]"
                    >
                      Toggle Status
                    </button>
                    <button 
                      onClick={() => setSelectedQrIds([])}
                      className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold uppercase tracking-wider rounded-full cursor-pointer text-[10px] md:text-xs h-8 flex items-center justify-center transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Header block with Bulk Generation option */}
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white border border-[#f3f3f3] p-4 md:p-5 rounded-md no-print">
                <div>
                  <h3 className="font-sans font-bold text-lg md:text-xl text-black uppercase tracking-tight">Active QR Tags</h3>
                  <p className="text-xs text-black/60 font-sans mt-0.5">Manage active tags, print windshield layouts, or check scan counters.</p>
                </div>
                
                {/* Bulk Tag Generator input & button */}
                <div className="flex items-center gap-2 border border-slate-200 rounded-full bg-slate-50 p-1 shrink-0">
                  <span className="text-[10px] md:text-xs font-bold text-black/55 uppercase pl-3 select-none">Qty:</span>
                  <input 
                    type="number" 
                    min="1" 
                    max="1000" 
                    value={bulkCount}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setBulkCount(isNaN(val) ? 1 : Math.min(1000, Math.max(1, val)));
                    }}
                    className="w-12 bg-transparent text-xs md:text-sm font-bold text-center outline-none"
                  />
                  <button 
                    onClick={() => handleGenerateBulkQr(bulkCount)}
                    className="clay-button-primary px-4 py-1.5 text-[10px] md:text-xs font-bold tracking-wider uppercase h-8 flex items-center justify-center cursor-pointer"
                  >
                    Bulk Generate
                  </button>
                </div>
              </div>

              {/* Clean flat table layout displaying both linked and standalone tags */}
              <div className="bg-white border border-[#f3f3f3] rounded-md overflow-hidden shadow-xs no-print">
                {/* Selection Utility Toolbar */}
                <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-3 bg-slate-50 border-b border-[#f3f3f3]">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedQrIds(qrCodes.map(q => q.id))}
                      className="px-3 py-1.5 bg-white border border-[#cccccc] hover:bg-slate-50 text-black font-bold uppercase tracking-wider rounded-md text-[10px] md:text-xs cursor-pointer transition-all active:scale-[0.98]"
                    >
                      Select All ({qrCodes.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedQrIds([])}
                      className="px-3 py-1.5 bg-white border border-[#cccccc] hover:bg-slate-50 text-black font-bold uppercase tracking-wider rounded-md text-[10px] md:text-xs cursor-pointer transition-all active:scale-[0.98] disabled:opacity-50"
                      disabled={selectedQrIds.length === 0}
                    >
                      Clear Selection
                    </button>
                  </div>
                  
                  {/* Range Selection Form */}
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-[10px] md:text-xs font-bold text-black/55 uppercase select-none">Range Select (1-{qrCodes.length}):</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-black/50 text-[10px] md:text-xs">From</span>
                      <input
                        type="number"
                        min="1"
                        max={qrCodes.length}
                        value={rangeFrom}
                        onChange={(e) => setRangeFrom(Math.max(1, Math.min(qrCodes.length, Number(e.target.value))))}
                        className="w-12 h-7 bg-white border border-slate-200 rounded px-1.5 text-xs text-center font-bold outline-none focus:border-[#0070d1]"
                      />
                      <span className="text-black/50 text-[10px] md:text-xs">To</span>
                      <input
                        type="number"
                        min="1"
                        max={qrCodes.length}
                        value={rangeTo}
                        onChange={(e) => setRangeTo(Math.max(1, Math.min(qrCodes.length, Number(e.target.value))))}
                        className="w-12 h-7 bg-white border border-slate-200 rounded px-1.5 text-xs text-center font-bold outline-none focus:border-[#0070d1]"
                      />
                      <button
                        type="button"
                        onClick={() => handleSelectRange(rangeFrom, rangeTo)}
                        className="clay-button-primary px-3 py-1 text-[10px] md:text-xs font-bold tracking-wider uppercase h-7 flex items-center justify-center cursor-pointer ml-1"
                        disabled={qrCodes.length === 0}
                      >
                        Select Range
                      </button>
                    </div>
                  </div>
                </div>

                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-[#f5f7fa] border-b border-[#f3f3f3]">
                    <tr>
                      <th className="p-3 md:p-4 w-10">
                        <input 
                          type="checkbox" 
                          checked={paginatedQrCodes.length > 0 && paginatedQrCodes.every(q => selectedQrIds.includes(q.id))} 
                          onChange={(e) => {
                            if (e.target.checked) {
                              const toAdd = paginatedQrCodes.map(q => q.id).filter(id => !selectedQrIds.includes(id));
                              setSelectedQrIds([...selectedQrIds, ...toAdd]);
                            } else {
                              const pageIds = paginatedQrCodes.map(q => q.id);
                              setSelectedQrIds(selectedQrIds.filter(id => !pageIds.includes(id)));
                            }
                          }}
                          className="w-4 h-4 rounded border-slate-300 text-[#0070d1] focus:ring-[#0070d1] cursor-pointer" 
                        />
                      </th>
                      <th className="p-3 md:p-4 font-sans uppercase tracking-wider text-black/60 font-bold text-[10px] md:text-xs">Sticker Details</th>
                      <th className="p-3 md:p-4 font-sans uppercase tracking-wider text-black/60 font-bold text-[10px] md:text-xs">License Plate</th>
                      <th className="p-3 md:p-4 font-sans uppercase tracking-wider text-black/60 font-bold text-[10px] md:text-xs">Security Channel</th>
                      <th className="p-3 md:p-4 font-sans uppercase tracking-wider text-black/60 font-bold text-[10px] md:text-xs">QR Code ID</th>
                      <th className="p-3 md:p-4 font-sans uppercase tracking-wider text-black/60 font-bold text-[10px] md:text-xs text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f3f3f3]">
                    {paginatedQrCodes.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-black/40 font-bold font-sans text-xs md:text-sm">
                          No QR tags generated. Use the Bulk Generator above to add tags.
                        </td>
                      </tr>
                    ) : (
                      paginatedQrCodes.map((q) => {
                        const v = vehicles.find((vh) => vh.qrCodeUrl === q.id || vh.id === q.vehicleId);
                        const isLinked = !!v;
                        const isSelected = selectedQrIds.includes(q.id);
                        return (
                          <tr
                            key={q.id}
                            onClick={() => {
                              setEditingQrId(q.id);
                              if (isLinked) {
                                setEditMake(v.make);
                                setEditModel(v.model);
                                setEditYear(v.year);
                                setEditColor(v.color);
                                setEditPlate(v.licensePlate);
                              } else {
                                setEditMake('');
                                setEditModel('');
                                setEditYear(new Date().getFullYear());
                                setEditColor('');
                                setEditPlate('');
                              }
                              setIsEditModalOpen(true);
                            }}
                            className={`group cursor-pointer border-b border-[#f3f3f3] transition-all duration-300 ease-out ${
                              (isLinked && currentSelectedVehicleId === v.id) 
                                ? 'bg-[#0070d1]/5 shadow-[inset_4px_0_0_0_#0070d1]' 
                                : 'hover:bg-slate-50/60 hover:shadow-[inset_4px_0_0_0_#0070d1]/60'
                            }`}
                          >
                            <td className="p-3 md:p-4" onClick={(e) => e.stopPropagation()}>
                              <input 
                                type="checkbox" 
                                checked={isSelected} 
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedQrIds([...selectedQrIds, q.id]);
                                  } else {
                                    setSelectedQrIds(selectedQrIds.filter(id => id !== q.id));
                                  }
                                }}
                                className="w-4 h-4 rounded border-slate-300 text-[#0070d1] focus:ring-[#0070d1] cursor-pointer transition-transform duration-150 active:scale-95" 
                              />
                            </td>
                            <td className="p-3 md:p-4">
                              <div className="flex items-center gap-3">
                                <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 transition-all duration-300 group-hover:scale-105 ${
                                  isLinked 
                                    ? 'bg-[#0070d1]/10 border border-[#0070d1]/20 text-[#0070d1]' 
                                    : 'bg-slate-100 border border-slate-200 text-slate-700'
                                }`}>
                                  {isLinked ? v.make.slice(0, 1).toUpperCase() : <QrCode size={16} className="text-[#0070d1]" />}
                                </div>
                                <div>
                                  <span className="font-bold text-black block text-xs md:text-sm group-hover:text-[#0070d1] transition-colors duration-150">
                                    {isLinked ? `${v.color} ${v.make} ${v.model}` : 'Unlinked Standalone Sticker'}
                                  </span>
                                  <span className="text-[10px] md:text-xs text-black/55 block mt-0.5 font-medium">
                                    {isLinked ? `Linked: ` : `Created: `}
                                    {new Date(q.createdAt).toLocaleDateString()}
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td className="p-3 md:p-4">
                              {isLinked ? (
                                <span className="px-2 py-0.5 bg-slate-100 border border-slate-200 text-slate-700 font-mono font-bold text-[11px] md:text-xs tracking-wider rounded uppercase inline-block">
                                  {v.licensePlate}
                                </span>
                              ) : (
                                <span className="text-black/35 font-medium text-xs md:text-sm">—</span>
                              )}
                            </td>
                            <td className="p-3 md:p-4">
                              {isLinked ? (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleToggleVehicleStatus(v.id);
                                  }}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] md:text-xs font-bold uppercase rounded-full transition-all duration-200 hover:scale-105 active:scale-[0.98] border cursor-pointer select-none"
                                  style={{
                                    background: v.status === 'active' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(241, 245, 249, 1)',
                                    borderColor: v.status === 'active' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(226, 232, 240, 1)',
                                    color: v.status === 'active' ? '#047857' : '#64748b'
                                  }}
                                >
                                  {v.status === 'active' ? (
                                    <>
                                      <span className="relative flex h-1.5 w-1.5">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                                      </span>
                                      Protecting
                                    </>
                                  ) : (
                                    <>
                                      <span className="h-1.5 w-1.5 rounded-full bg-slate-400"></span>
                                      Muted
                                    </>
                                  )}
                                </button>
                              ) : (
                                rowActivationId === q.id ? (
                                  rowProgress >= 100 ? (
                                    <div className="flex items-center gap-1.5 text-emerald-600 font-sans text-xs font-bold uppercase animate-bounce" onClick={(e) => e.stopPropagation()}>
                                      <CheckCircle size={14} className="fill-emerald-100" />
                                      Active!
                                    </div>
                                  ) : (
                                    <div className="flex flex-col gap-1 w-24 text-left select-none" onClick={(e) => e.stopPropagation()}>
                                      <span className="text-[9px] font-bold text-[#0070d1] uppercase animate-pulse">Activating {rowProgress}%</span>
                                      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                        <div className="bg-[#0070d1] h-full transition-all duration-75" style={{ width: `${rowProgress}%` }} />
                                      </div>
                                    </div>
                                  )
                                ) : (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleInlineRowActivation(q.id);
                                    }}
                                    className="px-3 py-1.5 rounded-full font-sans text-[10px] md:text-xs font-bold uppercase cursor-pointer border bg-indigo-500/10 text-indigo-600 border-indigo-500/20 hover:bg-indigo-500/20 hover:scale-105 transition-all duration-200"
                                  >
                                    Activate Tag
                                  </button>
                                )
                              )}
                            </td>
                            <td className="p-3 md:p-4">
                              <div className="flex items-center gap-3">
                                <span className="px-2.5 py-1 bg-slate-900 border border-slate-800 text-white font-sans text-[11px] md:text-xs font-bold rounded-md flex items-center gap-1.5 shadow-xs transition-transform duration-200 group-hover:scale-105">
                                  <QrCode size={12} className="text-[#0070d1]" />
                                  {q.id}
                                </span>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onSimulatePublicScan(q.id);
                                  }}
                                  className="px-2.5 py-1 text-[10px] md:text-xs font-bold text-[#0070d1] hover:text-[#0064b7] hover:bg-[#0070d1]/5 rounded-md uppercase tracking-wider cursor-pointer font-sans transition-all duration-200 border border-transparent hover:border-[#0070d1]/10 active:scale-[0.98]"
                                >
                                  Test Scan
                                </button>
                              </div>
                            </td>
                            <td className="p-3 md:p-4 text-right">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (isLinked) {
                                    handleDeleteVehicle(v.id);
                                  } else {
                                    const updated = qrCodes.filter(qr => qr.id !== q.id);
                                    onUpdateQrCodes(updated);
                                    const newTotalPages = Math.ceil(updated.length / qrItemsPerPage);
                                    if (qrCurrentPage > newTotalPages && newTotalPages >= 1) {
                                      setQrCurrentPage(newTotalPages);
                                    }
                                  }
                                }}
                                className="text-[10px] md:text-xs font-bold text-red-500 hover:text-red-700 hover:bg-red-50 px-2.5 py-1 rounded transition-all duration-200 uppercase tracking-wider cursor-pointer border border-transparent hover:border-red-100 active:scale-[0.97]"
                              >
                                Remove
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>

                {/* Pagination Controls */}
                {totalQrPages > 1 && (
                  <div className="flex items-center justify-between border-t border-[#f3f3f3] px-4 py-3 bg-[#f5f7fa]">
                    <div className="flex flex-1 justify-between sm:hidden">
                      <button
                        onClick={() => setQrCurrentPage(p => Math.max(1, p - 1))}
                        disabled={activeQrPage === 1}
                        className="relative inline-flex items-center rounded-md border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => setQrCurrentPage(p => Math.min(totalQrPages, p + 1))}
                        disabled={activeQrPage === totalQrPages}
                        className="relative ml-3 inline-flex items-center rounded-md border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                      >
                        Next
                      </button>
                    </div>
                    <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                      <div>
                        <p className="text-xs md:text-sm text-black/60 font-sans">
                          Showing <span className="font-bold text-black">{startIndex + 1}</span> to{' '}
                          <span className="font-bold text-black">
                            {Math.min(startIndex + qrItemsPerPage, qrCodes.length)}
                          </span>{' '}
                          of <span className="font-bold text-black">{qrCodes.length}</span> stickers
                        </p>
                      </div>
                      <div>
                        <nav className="isolate inline-flex -space-x-px rounded-md shadow-xs" aria-label="Pagination">
                          <button
                            onClick={() => setQrCurrentPage(p => Math.max(1, p - 1))}
                            disabled={activeQrPage === 1}
                            className="relative inline-flex items-center rounded-l-md px-2 py-2 text-slate-400 ring-1 ring-inset ring-slate-200 hover:bg-slate-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                          >
                            <span className="sr-only">Previous</span>
                            &larr;
                          </button>
                          {Array.from({ length: totalQrPages }, (_, i) => i + 1).map((page) => {
                            const isCurrent = page === activeQrPage;
                            return (
                              <button
                                key={page}
                                onClick={() => setQrCurrentPage(page)}
                                className={`relative inline-flex items-center px-3.5 py-2 text-xs font-semibold focus:z-20 cursor-pointer ${
                                  isCurrent
                                    ? 'z-10 bg-[#0070d1] text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0070d1]'
                                    : 'text-slate-900 ring-1 ring-inset ring-slate-200 hover:bg-slate-50 focus:outline-offset-0'
                                }`}
                              >
                                {page}
                              </button>
                            );
                          })}
                          <button
                            onClick={() => setQrCurrentPage(p => Math.min(totalQrPages, p + 1))}
                            disabled={activeQrPage === totalQrPages}
                            className="relative inline-flex items-center rounded-r-md px-2 py-2 text-slate-400 ring-1 ring-inset ring-slate-200 hover:bg-slate-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                          >
                            <span className="sr-only">Next</span>
                            &rarr;
                          </button>
                        </nav>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Single Premium Windshield Sticker Preview block */}
              {qrCodes.length > 0 && (
                <div id="sticker-section-visual" className="mt-8 bg-white border border-[#f3f3f3] rounded-md p-6 no-print">
                  <div className="mb-6 pb-4 border-b border-[#f3f3f3]">
                    <h4 className="font-serif font-light text-base text-black uppercase tracking-wider">Sticker Design Preview</h4>
                    <p className="text-xs text-black/60 font-sans mt-1">Windshield layout styling sheet (Standard PlayStation Blue Theme).</p>
                  </div>

                  {/* Render the currently selected tag (either linked vehicle or standalone tag) */}
                  <div className="flex justify-center mt-6">
                    {(() => {
                      const currentQr = qrCodes.find(q => {
                        const v = vehicles.find(vh => vh.id === currentSelectedVehicleId);
                        return v ? (q.id === v.qrCodeUrl || q.vehicleId === v.id) : (q.id === selectedQrCodeIdForLinking);
                      }) || qrCodes[0];

                      if (!currentQr) return null;

                      const matchedVehicle = vehicles.find((vh) => vh.qrCodeUrl === currentQr.id || vh.id === currentQr.vehicleId);
                      const scanUrl = `${window.location.origin}${window.location.pathname}#/scan/${currentQr.id}`;
                      const qrImgUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(scanUrl)}`;

                      return (
                        <div className="p-6 bg-[#f5f7fa] border border-[#f3f3f3] rounded-md flex flex-col items-center text-center max-w-sm w-full">
                          <div className="text-[10px] text-black/50 font-sans tracking-wider font-bold uppercase mb-3">
                            STICKER PREVIEW: {currentQr.id}
                          </div>

                          <div 
                            className="border rounded-md p-5 flex flex-col items-center w-full transition-all bg-black text-white border-white/10"
                          >
                            {/* QR Inner Box */}
                            <div className="w-36 h-36 bg-white p-3 rounded-md border flex items-center justify-center shadow-xs border-[#0070d1]">
                              <img src={qrImgUrl} alt={`QR Code ${currentQr.id}`} className="w-full h-full object-contain" />
                            </div>
                            
                            <div className="mt-4">
                              <span className="font-serif font-light text-base block uppercase tracking-tight text-white">
                                {matchedVehicle ? `${matchedVehicle.color} ${matchedVehicle.make}` : 'STANDALONE STICKER'}
                              </span>
                              <span className="text-[10px] font-bold block mt-1 tracking-wider uppercase opacity-80 text-white/60">
                                {matchedVehicle ? `License: ${matchedVehicle.licensePlate}` : 'ACTIVATE VIA WINDSHIELD SCAN'}
                              </span>
                              
                              <span className="text-[8px] font-bold uppercase tracking-widest block mt-2.5 text-[#0070d1]">
                                PlayStation Edition
                              </span>
                            </div>
                          </div>

                          <div className="mt-6 flex gap-3 w-full">
                            <button
                              onClick={() => {
                                setSelectedQrIds([currentQr.id]);
                                setTimeout(() => window.print(), 100);
                              }}
                              className="flex-grow py-2 border border-[#cccccc] bg-white text-xs font-bold uppercase tracking-wider text-black rounded-full transition-all cursor-pointer h-10 flex items-center justify-center"
                            >
                              Print Sticker
                            </button>
                            <button
                              onClick={() => onSimulatePublicScan(currentQr.id)}
                              className="clay-button-primary px-5 py-2 text-xs flex-grow font-sans h-10 flex items-center justify-center"
                            >
                              Test Scan
                            </button>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              )}

              {/* Bulk Print Layout overlay - Hidden on screen, visible during browser print */}
              <div className="hidden print:block print-only w-full">
                <div className="grid grid-cols-2 gap-8 p-4">
                  {qrCodes.filter(q => selectedQrIds.includes(q.id)).map(q => {
                    const matchedVehicle = vehicles.find(vh => vh.qrCodeUrl === q.id || vh.id === q.vehicleId);
                    const scanUrl = `${window.location.origin}${window.location.pathname}#/scan/${q.id}`;
                    const qrImgUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(scanUrl)}`;
                    return (
                      <div key={q.id} className="p-8 bg-black text-white rounded-md border border-white/10 flex flex-col items-center text-center print-page-break max-w-sm mx-auto w-full">
                        <div className="text-[11px] font-bold text-white/50 tracking-wider uppercase mb-4">
                          STICKER ID: {q.id}
                        </div>
                        <div className="w-40 h-40 bg-white p-3 rounded-md border border-[#0070d1] flex items-center justify-center shadow-md">
                          <img src={qrImgUrl} alt={`QR Code ${q.id}`} className="w-full h-full object-contain" />
                        </div>
                        <div className="mt-4">
                          <span className="font-serif font-light text-lg block uppercase tracking-tight text-white">
                            {matchedVehicle ? `${matchedVehicle.color} ${matchedVehicle.make}` : 'STANDALONE STICKER'}
                          </span>
                          <span className="text-[11px] font-bold block mt-1 tracking-wider uppercase text-white/60">
                            {matchedVehicle ? `License: ${matchedVehicle.licensePlate}` : 'ACTIVATE VIA WINDSHIELD SCAN'}
                          </span>
                          <span className="text-[8px] font-bold uppercase tracking-widest block mt-3 text-[#0070d1]">
                            PlayStation Edition
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          )}

          {/* TAB 3: ALERT FEED */}
          {activeTab === 'reports' && (
            <div id="reports-tab-view" className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="font-serif font-light text-2xl text-black uppercase tracking-tight">Alert Inbox</h3>
                  <p className="text-sm text-black/60 font-sans mt-1">Receive notifications and callback requests from community members scanning your vehicle tag.</p>
                </div>

                {/* Clean filter pills */}
                <div className="flex items-center gap-1 bg-[#f5f7fa] border border-[#f3f3f3] p-1 rounded-md">
                  {(['all', 'unread', 'acknowledged', 'resolved'] as const).map((status) => {
                    const count = status === 'all'
                      ? reports.length
                      : reports.filter((r) => r.status === status).length;

                    const isActive = reportFilter === status;

                    return (
                      <button
                        key={status}
                        onClick={() => setReportFilter(status)}
                        className={`px-4 py-1.5 text-xs font-bold uppercase tracking-wider rounded-md transition-all cursor-pointer ${isActive
                          ? 'bg-[#0070d1] text-white'
                          : 'text-black/60 hover:text-black hover:bg-slate-100'
                        }`}
                      >
                        {status}
                        {count > 0 && (
                          <span className={`ml-1.5 px-1.5 py-0.2 rounded-md text-[10px] font-bold ${isActive ? 'bg-white/20 text-white' : 'bg-slate-200 text-black/60'}`}>
                            {count}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* List Feed of Alerts (Minimal List Type) */}
              <div className="bg-white border border-[#f3f3f3] rounded-md overflow-hidden divide-y divide-[#f3f3f3]">
                {(() => {
                  const filteredReports = reports.filter((r) => {
                    if (reportFilter === 'all') return true;
                    return r.status === reportFilter;
                  });

                  if (filteredReports.length === 0) {
                    return (
                      <div className="p-16 text-center text-black/40">
                        <CheckCircle size={36} className="mx-auto text-[#0070d1] mb-3" />
                        <h4 className="text-black font-serif font-light text-lg uppercase tracking-wider mb-1">Status Clear</h4>
                        <p className="text-sm max-w-xs mx-auto text-black/60">
                          No alerts found in the inbox matching this category.
                        </p>
                      </div>
                    );
                  }

                  return filteredReports.map((r) => {
                    const typeAccentColor = r.type === 'accident' ? '#c81b3a' : r.type === 'wrong_parking' ? '#d53b00' : '#0070d1';
                    return (
                      <div
                        key={r.id}
                        className={`p-6 md:p-8 flex flex-col gap-4 relative transition-all duration-150 hover:bg-slate-50/30 ${
                          r.status === 'unread' ? 'bg-[#0070d1]/5 shadow-[inset_4px_0_0_0_#0070d1]' : 'shadow-[inset_4px_0_0_0_transparent]'
                        }`}
                        style={{ shadowColor: typeAccentColor }}
                      >
                        {/* Custom left border edge highlight for state visual matching */}
                        <div 
                          className="absolute left-0 top-0 bottom-0 w-1" 
                          style={{ backgroundColor: typeAccentColor }} 
                        />
                        
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                          <div className="space-y-2 text-left">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`inline-flex items-center px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider border ${
                                r.type === 'accident'
                                  ? 'bg-[#c81b3a]/10 text-[#c81b3a] border-[#c81b3a]/20'
                                  : r.type === 'wrong_parking'
                                    ? 'bg-[#d53b00]/10 text-[#d53b00] border-[#d53b00]/20'
                                    : 'bg-[#0070d1]/10 text-[#0070d1] border-[#0070d1]/20'
                              }`}>
                                {r.type === 'accident' ? 'Critical' : r.type === 'wrong_parking' ? 'Parking' : 'Contact'}
                              </span>

                              {r.status === 'unread' && (
                                <span className="inline-flex items-center px-3 py-1 bg-[#c81b3a]/10 text-[#c81b3a] text-xs font-bold uppercase rounded-md border border-[#c81b3a]/20 animate-pulse">
                                  New
                                </span>
                              )}
                              {r.status === 'acknowledged' && (
                                <span className="inline-flex items-center px-3 py-1 bg-amber-50 text-amber-700 text-xs font-bold uppercase rounded-md border border-amber-200">
                                  Active
                                </span>
                              )}
                              {r.status === 'resolved' && (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold uppercase rounded-md border border-emerald-200">
                                  <CheckCircle size={12} /> Resolved
                                </span>
                              )}
                            </div>

                            <div>
                              <h4 className="text-xl md:text-2xl font-serif font-light text-black uppercase tracking-tight">
                                {r.vehicleLabel}
                              </h4>
                              <p className="text-xs md:text-sm text-black/55 uppercase tracking-wider font-bold mt-1.5">
                                Plate: <span className="text-black font-semibold">{r.licensePlate}</span>
                              </p>
                            </div>
                          </div>

                          <div className="text-left sm:text-right text-xs md:text-sm text-black/55">
                            <span className="block font-bold">{new Date(r.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                            <span className="block mt-1 font-medium">{new Date(r.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        </div>

                        <div className="p-4 bg-[#f5f7fa] border border-[#f3f3f3] rounded-md text-black/85 text-sm md:text-base leading-relaxed italic font-sans font-medium">
                          "{r.message}"
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-[#f3f3f3] text-xs md:text-sm text-black/60 font-sans">
                          <div className="flex items-center gap-2">
                            <Phone size={14} className="text-black/40" />
                            <span>Contact: <span className="font-bold text-black">{r.reporterPhone || 'Anonymous'}</span></span>
                          </div>

                          {r.location && (
                            <div className="flex items-center gap-2">
                              <MapPin size={14} className="text-black/40" />
                              <span>GPS coordinates: <span className="font-bold text-black">{r.location.lat.toFixed(4)}, {r.location.lng.toFixed(4)}</span></span>
                            </div>
                          )}
                        </div>

                        {/* Action items */}
                        <div className="pt-4 border-t border-[#f3f3f3] flex gap-3 justify-end">
                          {r.status === 'unread' && (
                            <button
                              onClick={() => handleAcknowledgeReport(r.id)}
                              className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs md:text-sm font-bold uppercase tracking-wider rounded-md cursor-pointer transition-all active:scale-[0.97] h-10 flex items-center"
                            >
                              Acknowledge
                            </button>
                          )}
                          {r.status !== 'resolved' && (
                            <button
                              onClick={() => handleResolveReport(r.id)}
                              className="px-5 py-2 text-white text-xs md:text-sm font-bold uppercase tracking-wider rounded-md cursor-pointer bg-black hover:bg-slate-900 transition-all active:scale-[0.97] h-10 flex items-center"
                            >
                              Resolve Alert
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteReport(r.id)}
                            className="px-5 py-2 text-black hover:text-red-700 text-xs md:text-sm font-bold uppercase tracking-wider rounded-md bg-white border border-[#cccccc] hover:bg-slate-50 transition-all active:scale-[0.97] h-10 flex items-center"
                          >
                            Archive
                          </button>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          )}

          {/* TAB 4: SETTINGS & BILLING */}
          {activeTab === 'settings' && (
            <div id="settings-tab-view" className="space-y-6">
              <div className="bg-white border border-[#f3f3f3] rounded-md p-6">
                <h4 className="font-serif font-light text-base text-black uppercase tracking-wider mb-4 pb-2 border-b border-[#f3f3f3]">Profile Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-black/55 mb-1.5 pl-1">Email / Username</label>
                    <input
                      type="text"
                      disabled
                      value={user.email}
                      className="clay-input w-full cursor-not-allowed opacity-60"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-black/55 mb-1.5 pl-1">Full Name</label>
                    <input
                      type="text"
                      value={user.fullName}
                      onChange={(e) => onUpdateUser({ ...user, fullName: e.target.value })}
                      className="clay-input w-full"
                    />
                  </div>
                </div>
              </div>

              {/* Pricing subscription details section */}
              <div className="bg-white border border-[#f3f3f3] rounded-md p-6">
                <div className="flex justify-between items-start mb-4 pb-2 border-b border-[#f3f3f3]">
                  <div>
                    <h4 className="font-serif font-light text-base text-black uppercase tracking-wider">Subscription Plan</h4>
                    <p className="text-xs text-black/60 font-sans mt-1">Upgrade or downgrade your vehicle protection status levels.</p>
                  </div>
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-sans text-[10px] font-bold uppercase tracking-wider border ${
                    user.subscriptionPlan === 'pro'
                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                      : 'bg-slate-100 text-slate-500 border-slate-200'
                  }`}>
                    {user.subscriptionPlan === 'pro' ? (
                      <>
                        <Crown size={10} className="fill-amber-400 text-amber-500" /> Pro active
                      </>
                    ) : 'Free Plan'}
                  </span>
                </div>

                <div className="p-4 bg-[#f5f7fa] border border-[#f3f3f3] rounded-md mb-6">
                  <div className="flex justify-between items-center text-xs">
                    <div>
                      <strong className="text-black block font-serif font-light text-sm uppercase tracking-wider">
                        {user.subscriptionPlan === 'pro' ? 'NamoQR Pro Protection' : 'Free Basic protection'}
                      </strong>
                      <span className="text-[11px] text-black/60 block mt-1 leading-relaxed max-w-lg">
                        {user.subscriptionPlan === 'pro'
                          ? 'Includes instant SMS callbacks, high-priority emergency notifications, and unlimited sticker tag creations.'
                          : 'Limited to standard real-time email notifications and 1 active windshield QR sticker.'}
                      </span>
                    </div>
                    <span className="font-serif font-light text-2xl text-black shrink-0">
                      {user.subscriptionPlan === 'pro' ? '$5' : '$0'}/mo
                    </span>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={() => {
                      const nextPlan = user.subscriptionPlan === 'pro' ? 'free' as const : 'pro' as const;
                      onUpdateUser({ ...user, subscriptionPlan: nextPlan, isSubscribed: nextPlan === 'pro' });
                    }}
                    className="py-2.5 px-6 border border-[#cccccc] hover:bg-slate-50 text-xs font-bold uppercase tracking-wider text-black rounded-full transition-all cursor-pointer"
                  >
                    Switch to {user.subscriptionPlan === 'pro' ? 'Free Plan' : 'Upgrade to Pro'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* RENDER DYNAMIC REGISTER NEW QR MODAL BOX */}
      <AnimatePresence>
        {isAddVehicleOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white border border-[#f3f3f3] rounded-2xl max-w-md w-full shadow-2xl overflow-hidden shrink-0 p-6 flex flex-col items-center text-center animate-fade-in"
            >
              {!isActivating && !isActivationComplete ? (
                <>
                  {/* Plus Icon Circle */}
                  <div className="w-12 h-12 bg-[#0070d1] rounded-full flex items-center justify-center text-white mb-4">
                    <Plus size={24} />
                  </div>

                  <h3 className="font-sans font-bold text-xl text-black uppercase tracking-tight mb-2">
                    Link & Activate Tag
                  </h3>
                  <p className="text-sm text-black/60 font-sans max-w-sm mb-6 leading-relaxed">
                    This sticker is currently unlinked. Activate protection below.
                  </p>

                  <div className="flex gap-4 w-full mt-2">
                    <button
                      type="button"
                      onClick={() => setIsAddVehicleOpen(false)}
                      className="flex-1 py-3 border border-slate-200 text-xs font-bold uppercase tracking-wider text-black rounded-full hover:bg-slate-50 transition-all cursor-pointer h-12 flex items-center justify-center"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={startActivationProcess}
                      className="flex-1 py-3 bg-[#0070d1] hover:bg-[#0064b7] text-white text-xs font-bold uppercase tracking-wider rounded-full transition-all cursor-pointer h-12 flex items-center justify-center"
                    >
                      Activate Tag
                    </button>
                  </div>
                </>
              ) : isActivating ? (
                <div className="w-full py-8 px-4 flex flex-col items-center">
                  {/* Rotating/pulsing scanner circle */}
                  <div className="w-16 h-16 rounded-full border-4 border-[#0070d1]/20 border-t-[#0070d1] animate-spin mb-6" />

                  <div className="w-full space-y-3">
                    <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-[#0070d1]">
                      <span>Activating QR Tag...</span>
                      <span>{Math.round(activationProgress)}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                      <div 
                        className="bg-[#0070d1] h-full transition-all duration-75"
                        style={{ width: `${activationProgress}%` }}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                // Success Activated State showing the "user side view" / activated design layout
                <>
                  <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4">
                    <CheckCircle size={22} className="fill-emerald-100" />
                  </div>

                  <h3 className="font-sans font-bold text-lg text-black uppercase tracking-tight mb-1">
                    Sticker Activated!
                  </h3>
                  <p className="text-xs text-black/55 font-sans mb-5">
                    Your vehicle protection channel is now live.
                  </p>

                  {/* Windshield layout visual preview (User Side View) */}
                  {(() => {
                    const matchedVehicle = vehicles.find(v => v.qrCodeUrl === activatedQrId);
                    const scanUrl = `${window.location.origin}${window.location.pathname}#/scan/${activatedQrId}`;
                    const qrImgUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(scanUrl)}`;
                    
                    return (
                      <div className="p-5 bg-black text-white rounded-md border border-white/10 flex flex-col items-center text-center w-full max-w-[240px] shadow-lg mb-6">
                        <div className="text-[9px] font-bold text-white/50 tracking-wider uppercase mb-2.5">
                          STICKER ID: {activatedQrId}
                        </div>
                        <div className="w-28 h-28 bg-white p-2 rounded-md border flex items-center justify-center border-[#0070d1]">
                          <img src={qrImgUrl} alt={`QR Code`} className="w-full h-full object-contain" />
                        </div>
                        <div className="mt-3.5">
                          <span className="font-sans font-bold text-xs block uppercase tracking-tight text-white">
                            {matchedVehicle ? `${matchedVehicle.color} ${matchedVehicle.make}` : 'VEHICLE LINKED'}
                          </span>
                          <span className="text-[9px] font-bold block mt-1 tracking-wider uppercase text-white/60">
                            {matchedVehicle ? `License: ${matchedVehicle.licensePlate}` : 'PROTECTION ACTIVE'}
                          </span>
                          <span className="text-[7px] font-bold uppercase tracking-widest block mt-2 text-[#0070d1]">
                            PlayStation Edition
                          </span>
                        </div>
                      </div>
                    );
                  })()}

                  <button
                    type="button"
                    onClick={() => setIsAddVehicleOpen(false)}
                    className="w-full py-3 bg-[#0070d1] hover:bg-[#0064b7] text-white text-xs font-bold uppercase tracking-wider rounded-full transition-all cursor-pointer h-12 flex items-center justify-center"
                  >
                    Done
                  </button>
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* RENDER DYNAMIC EDIT QR STICKER & PREVIEW MODAL BOX */}
      <AnimatePresence>
        {isEditModalOpen && editingQrId && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white border border-[#f3f3f3] rounded-md max-w-3xl w-full shadow-2xl overflow-hidden shrink-0 p-0"
            >
              <div className="p-6 border-b border-[#f3f3f3] flex justify-between items-center bg-[#f5f7fa]">
                <div>
                  <h3 className="font-serif font-light text-base text-black uppercase tracking-wider">Configure QR Sticker</h3>
                  <p className="text-[10px] text-black/60 mt-1 uppercase font-bold tracking-wider">Preview design and edit asset details in real-time</p>
                </div>
                <button
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setEditingQrId(null);
                  }}
                  className="p-1 text-black/40 hover:text-black rounded cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
                
                {/* Left: Sticker visual preview */}
                <div className="flex flex-col items-center justify-center bg-[#f5f7fa] p-6 rounded-md border border-[#eef1f6]">
                  <span className="text-[9px] font-bold text-black/50 uppercase tracking-widest mb-4">Live Preview</span>
                  
                  {(() => {
                    const scanUrl = `${window.location.origin}${window.location.pathname}#/scan/${editingQrId}`;
                    const qrImgUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(scanUrl)}`;
                    return (
                      <div className="p-6 bg-black text-white rounded-md border border-white/10 flex flex-col items-center text-center w-full max-w-[260px] shadow-lg transition-transform hover:scale-[1.01]">
                        <div className="text-[9px] font-bold text-white/50 tracking-wider uppercase mb-3">
                          STICKER ID: {editingQrId}
                        </div>
                        <div className="w-32 h-32 bg-white p-2 rounded-md border flex items-center justify-center shadow-xs border-[#0070d1]">
                          <img src={qrImgUrl} alt={`QR Code ${editingQrId}`} className="w-full h-full object-contain" />
                        </div>
                        <div className="mt-4">
                          <span className="font-serif font-light text-sm block uppercase tracking-tight text-white line-clamp-1">
                            {editColor || editMake ? `${editColor} ${editMake}` : 'STANDALONE TAG'}
                          </span>
                          <span className="text-[9px] font-bold block mt-1 tracking-wider uppercase text-white/60 line-clamp-1">
                            {editPlate ? `License: ${editPlate.toUpperCase()}` : 'INACTIVE & UNLINKED'}
                          </span>
                          <span className="text-[7px] font-bold uppercase tracking-widest block mt-2.5 text-[#0070d1]">
                            PlayStation Edition
                          </span>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Right: Asset edit fields */}
                <form onSubmit={handleEditStickerSubmit} className="space-y-4 text-left flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-black/55 mb-1 pl-1">Make</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. BMW, Tesla"
                          value={editMake}
                          onChange={(e) => setEditMake(e.target.value)}
                          className="clay-input w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-black/55 mb-1 pl-1">Model</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. M3, Model S"
                          value={editModel}
                          onChange={(e) => setEditModel(e.target.value)}
                          className="clay-input w-full"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-black/55 mb-1 pl-1">Year</label>
                        <input
                          type="number"
                          value={editYear}
                          onChange={(e) => setEditYear(Number(e.target.value))}
                          className="clay-input w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-black/55 mb-1 pl-1">Color</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Alpine White"
                          value={editColor}
                          onChange={(e) => setEditColor(e.target.value)}
                          className="clay-input w-full"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-black/55 mb-1 pl-1">License Plate Number</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. NY-9F81"
                        value={editPlate}
                        onChange={(e) => setEditPlate(e.target.value)}
                        className="clay-input w-full font-mono uppercase font-bold tracking-wider"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 justify-end pt-4 border-t border-[#f3f3f3]">
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditModalOpen(false);
                        setEditingQrId(null);
                      }}
                      className="px-4 py-2 border border-[#cccccc] bg-white text-xs font-bold uppercase tracking-wider text-black rounded-full transition-all cursor-pointer h-10 flex items-center justify-center"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="clay-button-primary px-5 py-2 text-xs h-10 flex items-center justify-center animate-fade-in"
                    >
                      Save Configuration
                    </button>
                  </div>
                </form>

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

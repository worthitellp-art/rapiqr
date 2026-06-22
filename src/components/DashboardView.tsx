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
  TrendingUp,
  MapPin,
  RefreshCw,
  LogOut,
  AlertTriangle,
  FileCheck,
  CheckCircle,
  Phone,
  Calendar,
  Layers,
  ChevronRight,
  Sparkles,
  Link,
  Crown
} from 'lucide-react';
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
  const qrWizards = vehicles;
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(vehicles.length > 0 ? vehicles[0].id : null);
  const [isAddVehicleOpen, setIsAddVehicleOpen] = useState(false);
  const [reportFilter, setReportFilter] = useState<'all' | 'unread' | 'acknowledged' | 'resolved'>('all');

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
    const nextQrId = `QR-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

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

    const newQr: QRCodeData = {
      id: nextQrId,
      vehicleId: nextVehId,
      status: 'active',
      scansCount: 0,
      createdAt: new Date().toISOString(),
    };

    onUpdateVehicles([newVehicle, ...vehicles]);
    onUpdateQrCodes([newQr, ...qrCodes]);

    // Cleanup form states
    setCarMake('');
    setCarModel('');
    setCarColor('');
    setCarPlate('');
    setIsAddVehicleOpen(false);
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

  // Link an unassigned QR tag to a vehicle
  const handleLinkQrToVehicle = (vehicleId: string, qrId: string) => {
    const updatedVehicles = vehicles.map((v) => {
      if (v.id === vehicleId) {
        return { ...v, qrCodeUrl: qrId };
      }
      return v;
    });

    const updatedQrs = qrCodes.map((q) => {
      if (q.id === qrId) {
        return { ...q, vehicleId, status: 'active' as const };
      }
      return q;
    });

    onUpdateVehicles(updatedVehicles);
    onUpdateQrCodes(updatedQrs);
  };

  return (
    <div id="dashboard-layout" className="min-h-screen bg-[#f0f4f8] flex flex-col md:flex-row text-slate-900 font-inter relative overflow-hidden">
      {/* Sidebar Rail */}
      <aside className="w-full md:w-64 clay-morph-white !rounded-none md:!rounded-r-xl shrink-0 flex flex-col justify-between relative z-20">
        <div>
          {/* Dashboard Premium Brand Header */}
          <div className="h-16 border-b border-indigo-50/55 px-6 flex items-center gap-2.5">
            <div className="text-indigo-600 font-helvetica font-bold text-lg tracking-tight flex items-center gap-2">
              <span className="w-4 h-4 rounded-full bg-indigo-500 shadow-[0_2px_6px_rgba(99,102,241,0.5),_inset_0_-2px_4px_rgba(0,0,0,0.35),_inset_0_2px_4px_rgba(255,255,255,0.7)] animate-pulse"></span>
              NamoQR <span className="text-slate-400 font-medium text-xs">v1</span>
            </div>
          </div>

          {/* User profile identifier row */}
          <div className="p-4 border-b border-indigo-50/55 flex items-center gap-3 bg-indigo-50/20">
            <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center border border-white/40 font-semibold text-xs shrink-0 select-none shadow-[0_2px_6px_rgba(99,102,241,0.4),_inset_0_-2px_4px_rgba(0,0,0,0.3),_inset_0_2px_4px_rgba(255,255,255,0.4)]">
              {user.fullName.slice(0, 2).toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <h4 className="text-xs font-bold text-slate-800 truncate tracking-tight font-helvetica">{user.fullName}</h4>
              <p className="text-xs text-slate-500 truncate mt-0.5 font-helvetica">{user.email}</p>
            </div>
          </div>

          {/* Navigation Side Links */}
          <nav className="p-3 space-y-1.5 relative">
            <button
              id="sidebar-tab-dashboard"
              onClick={() => setActiveTab('dashboard')}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-md text-left text-xs font-bold tracking-tight font-helvetica cursor-pointer outline-none focus:outline-none relative transition-colors duration-150"
            >
              {activeTab === 'dashboard' && (
                <motion.div
                  layoutId="active-sidebar-tab"
                  className="absolute inset-0 clay-morph-indigo rounded-md"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
              <LayoutDashboard size={14} className={`relative z-10 transition-colors ${activeTab === 'dashboard' ? 'text-white' : 'text-slate-500'}`} />
              <span className={`relative z-10 transition-colors ${activeTab === 'dashboard' ? 'text-white' : 'text-slate-600 hover:text-slate-900'}`}>Dashboard</span>
            </button>

            <button
              id="sidebar-tab-QRWizard"
              onClick={() => setActiveTab('QRWizard')}
              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-md text-left text-xs font-bold tracking-tight font-helvetica cursor-pointer outline-none focus:outline-none relative transition-colors duration-150"
            >
              {activeTab === 'QRWizard' && (
                <motion.div
                  layoutId="active-sidebar-tab"
                  className="absolute inset-0 clay-morph-indigo rounded-md"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
              <div className="flex items-center gap-3 relative z-10">
                <QrCode size={14} className={activeTab === 'QRWizard' ? 'text-white' : 'text-slate-500'} />
                <span className={activeTab === 'QRWizard' ? 'text-white' : 'text-slate-600 hover:text-slate-900'}>QR Wizard</span>
              </div>
              <span className={`relative z-10 px-2 py-0.5 rounded font-helvetica text-xs font-bold transition-all ${activeTab === 'QRWizard' ? 'bg-indigo-700/50 text-white' : 'bg-slate-100 text-slate-500 border border-slate-200/80 shadow-xs'}`}>
                {vehicles.length}
              </span>
            </button>

            <button
              id="sidebar-tab-reports"
              onClick={() => setActiveTab('reports')}
              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-md text-left text-xs font-bold tracking-tight font-helvetica cursor-pointer outline-none focus:outline-none relative transition-colors duration-150"
            >
              {activeTab === 'reports' && (
                <motion.div
                  layoutId="active-sidebar-tab"
                  className="absolute inset-0 clay-morph-indigo rounded-md"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
              <div className="flex items-center gap-3 relative z-10">
                <FileText size={14} className={activeTab === 'reports' ? 'text-white' : 'text-slate-500'} />
                <span className={activeTab === 'reports' ? 'text-white' : 'text-slate-600 hover:text-slate-900'}>Alerts</span>
              </div>
              {reports.filter(r => r.status === 'unread').length > 0 ? (
                <span className="relative z-10 px-1.5 py-0.5 bg-red-50 text-white rounded text-xs font-bold animate-pulse shadow-[0_2px_8px_rgba(239,68,68,0.4)]">
                  {reports.filter(r => r.status === 'unread').length}
                </span>
              ) : (
                <span className={`relative z-10 px-2 py-0.5 rounded-md font-helvetica text-xs font-bold transition-all ${activeTab === 'reports' ? 'bg-indigo-700/50 text-white' : 'bg-slate-100 text-slate-500 border border-slate-200/80 shadow-xs'}`}>
                  {reports.length}
                </span>
              )}
            </button>

            <button
              id="sidebar-tab-settings"
              onClick={() => setActiveTab('settings')}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-md text-left text-xs font-bold tracking-tight font-helvetica cursor-pointer outline-none focus:outline-none relative transition-colors duration-150"
            >
              {activeTab === 'settings' && (
                <motion.div
                  layoutId="active-sidebar-tab"
                  className="absolute inset-0 clay-morph-indigo rounded-md"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
              <Settings size={14} className={`relative z-10 transition-colors ${activeTab === 'settings' ? 'text-white' : 'text-slate-500'}`} />
              <span className={`relative z-10 transition-colors ${activeTab === 'settings' ? 'text-white' : 'text-slate-600 hover:text-slate-900'}`}>Settings</span>
            </button>
          </nav>
        </div>

        {/* Sidebar Footer Logout bar */}
        <div className="p-4 border-t border-indigo-50/55 bg-transparent md:block">
          <button
            id="sidebar-logout-btn"
            onClick={onLogout}
            className="w-full h-10 inline-flex items-center justify-center gap-2 px-3 border border-indigo-150 rounded-md bg-white hover:bg-red-50 hover:text-red-600 hover:border-red-200 text-xs font-bold tracking-tight transition-all font-helvetica cursor-pointer shadow-[inset_2px_2px_4px_rgba(255,255,255,1),_inset_-2px_-2px_4px_rgba(0,0,0,0.03),_2px_2px_8px_rgba(0,0,0,0.02)] outline-none focus:outline-none"
          >
            <LogOut size={12} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-grow flex flex-col min-h-0 bg-transparent overflow-y-auto">
        {/* Dynamic Screen Navbar */}
        <header className="h-16 bg-white/35 backdrop-blur-xl border-b border-white/40 px-6 sm:px-8 shrink-0 flex items-center justify-between z-10">
          <h2 className="font-serif font-black text-base text-slate-800 tracking-tight">
            {activeTab === 'dashboard' && 'Control Dashboard'}
            {activeTab === 'QRWizard' && 'QR Wizard Collection'}
            {activeTab === 'reports' && 'Bystander Alert Inbox'}
            {activeTab === 'settings' && 'Account Settings'}
          </h2>

          <div className="flex items-center gap-3">
            {/* Quick launch registered trigger */}
            <button
              id="register-vehicle-quick-btn"
              onClick={() => setIsAddVehicleOpen(true)}
              className="px-4 py-2.5 clay-morph-indigo-btn text-xs flex items-center gap-1.5 cursor-pointer shadow-md !border-none"
            >
              <Plus size={14} /> Submit QR Wizard
            </button>
          </div>
        </header>

        {/* Inner Content Scaffolder */}
        <div className="p-6 sm:p-8 max-w-[1600px] w-full mx-auto lg:px-12">
          {/* TAB 1: DASHBOARD HOME */}
          {activeTab === 'dashboard' && (
            <div id="dashboard-home-view" className="space-y-8 animate-fadeIn">
              {/* Top Banner Greetings card */}
              <div className="clay-morph-white p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fadeIn border border-white/60 relative z-10">
                <div>
                  <h3 className="text-2xl font-serif font-black text-slate-900 tracking-tight">
                    Welcome Back!
                  </h3>
                  <p className="text-sm text-slate-500 mt-1 font-medium font-inter">
                    Control Panel for Admin Suites
                  </p>
                </div>
                {/* Simulated timestamp container */}
                <div className="flex items-center gap-2 bg-blue-50/50 border border-blue-100/60 px-3.5 py-2 rounded-md shrink-0 shadow-[inset_-2px_-2px_6px_rgba(59,130,246,0.05),_inset_2px_2px_6px_rgba(255,255,255,0.9)]">
                  <Calendar size={14} className="text-blue-600" />
                  <span className="font-helvetica text-sm text-blue-900 font-bold">
                    {new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </div>
              </div>

              {/* Only 4 key metrics indicator cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
                {/* CARD 1: QR WIZARDS */}
                <div id="stat-card-vehicles" className="clay-morph-white p-5 border border-white/60 shadow-md">
                  <div className="flex justify-between items-start">
                    <span className="text-sm font-bold text-slate-500 tracking-tight font-helvetica">
                      QR Wizards Registered
                    </span>
                    <div className="p-0.5 px-2 bg-blue-50 text-blue-700 rounded-md text-xs font-bold font-helvetica">
                      Total
                    </div>
                  </div>
                  <h4 className="text-4xl font-extrabold text-slate-900 mt-2.5 tracking-tight font-serif">
                    {vehicles.length}
                  </h4>
                  <div className="text-xs text-emerald-600 font-semibold mt-2.5 flex items-center gap-1 font-inter">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Shield Active
                  </div>
                </div>

                {/* CARD 2: QR CODES */}
                <div id="stat-card-qrcodes" className="clay-morph-white p-5 border border-white/60 shadow-md">
                  <div className="flex justify-between items-start">
                    <span className="text-sm font-bold text-slate-500 tracking-tight font-helvetica">
                      QR Codes Active
                    </span>
                    <button
                      onClick={handleGenerateStandaloneQr}
                      title="Add blank QR Code"
                      className="p-1 hover:bg-blue-50 text-blue-600 hover:text-blue-800 rounded-md transition-colors cursor-pointer"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                  <h4 className="text-4xl font-extrabold text-slate-900 mt-2.5 tracking-tight font-serif">
                    {qrCodes.length}
                  </h4>
                  <div className="text-xs text-slate-500 mt-2.5 font-medium font-inter">
                    {qrCodes.filter((q) => q.status === 'unlinked').length} {qrCodes.filter((q) => q.status === 'unlinked').length === 1 ? 'Unassigned Tag' : 'Unassigned Tags'}
                  </div>
                </div>

                {/* CARD 3: TOTAL SCANS */}
                <div id="stat-card-scans" className="clay-morph-white p-5 border border-white/60 shadow-md">
                  <div className="flex justify-between items-start">
                    <span className="text-sm font-bold text-slate-500 tracking-tight font-helvetica">
                      Recorded Scans
                    </span>
                    <div className="p-0.5 px-2 bg-amber-50 text-amber-700 rounded-md text-xs font-bold border border-amber-100 font-helvetica">
                      All Time
                    </div>
                  </div>
                  <h4 className="text-4xl font-extrabold text-slate-900 mt-2.5 tracking-tight font-serif">
                    {totalScans}
                  </h4>
                  <div className="text-xs text-slate-500 mt-2.5 font-medium font-inter">
                    Summed Scans Check
                  </div>
                </div>

                {/* CARD 4: RECEIVED REPORTS */}
                <div id="stat-card-reports" className="clay-morph-white p-5 border border-white/60 shadow-md">
                  <div className="flex justify-between items-start">
                    <span className="text-sm font-bold text-slate-500 tracking-tight font-helvetica">
                      Active Reports
                    </span>
                    {reports.filter(r => r.status === 'unread').length > 0 && (
                      <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.6)]"></span>
                    )}
                  </div>
                  <h4 className="text-4xl font-extrabold text-slate-900 mt-2.5 tracking-tight font-serif">
                    {reports.length}
                  </h4>
                  <div className="text-xs text-slate-500 mt-2.5 font-medium font-inter">
                    {reports.filter((r) => r.status === 'unread').length} {reports.filter((r) => r.status === 'unread').length === 1 ? 'Unread Notice' : 'Unread Notices'}
                  </div>
                </div>
              </div>

              {/* QR Code Quick Sandbox Trigger */}
              <div className="clay-morph-indigo p-6 relative overflow-hidden border border-white/20">
                <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                  <div className="md:col-span-2 space-y-1.5">
                    <h4 className="font-serif text-lg font-bold text-slate-105 tracking-tight">Simulate Scanning Windshield Code</h4>
                    <p className="text-xs text-indigo-100 leading-normal max-w-lg font-medium font-inter">
                      Want to act as a passerby who scanned your car? Click any card below to launch the **Public QR View** in our simulator. Dispatch an alert and watch it appear in your inbox immediately!
                    </p>
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    {vehicles.slice(0, 3).map((v) => (
                      <button
                        key={v.id}
                        onClick={() => onSimulatePublicScan(v.qrCodeUrl)}
                        className="text-left p-2.5 px-3.5 bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/45 rounded-md text-xs font-bold font-helvetica text-white transition-all cursor-pointer truncate flex items-center justify-between tracking-wider shadow-sm"
                      >
                        <span>{v.make} ({v.qrCodeUrl})</span>
                        <ChevronRight size={14} className="shrink-0 text-blue-400" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* quick split view of qr wizards and recent received reports */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* mini list of qr wizards */}
                <div className="clay-morph-white p-5 lg:col-span-1 border border-white/60 shadow-md">
                  <div className="flex justify-between items-center mb-4 pb-3 border-b border-blue-50">
                    <h4 className="text-sm font-bold text-slate-800 tracking-tight font-serif">Active Plates</h4>
                    <button
                      onClick={() => setActiveTab('QRWizard')}
                      className="text-xs font-bold text-blue-500 hover:text-blue-700 font-helvetica transition-colors cursor-pointer"
                    >
                      View All
                    </button>
                  </div>
                  <div className="space-y-3">
                    {vehicles.length === 0 ? (
                      <p className="text-xs text-slate-400 text-center py-6 font-medium font-inter">No QR Wizards Registered</p>
                    ) : (
                      vehicles.slice(0, 3).map((v) => (
                        <div key={v.id} className="flex justify-between items-center p-3 rounded-md hover:bg-white/50 border border-slate-100 text-xs text-slate-800 font-medium transition-all shadow-[inset_-2px_-2px_6px_rgba(59,130,246,0.02),_inset_2px_2px_6px_rgba(255,255,255,0.7)]">
                          <div>
                            <span className="font-bold text-slate-900 font-helvetica">{v.make} {v.model}</span>
                            <span className="block font-helvetica text-xs text-slate-500 mt-1 font-semibold">{v.color} &bull; {v.licensePlate}</span>
                          </div>
                          <span className={`px-2 py-0.5 font-helvetica text-xs font-bold rounded border tracking-wider ${v.status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-250 shadow-sm' : 'bg-slate-100 text-slate-400 border-slate-200'
                            }`}>
                            {v.status === 'active' ? 'Active' : 'Off'}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Recent Alert Feed */}
                <div className="clay-morph-white p-5 lg:col-span-2 border border-white/60 shadow-md">
                  <div className="flex justify-between items-center mb-4 pb-3 border-b border-blue-50">
                    <h4 className="text-sm font-bold text-slate-800 tracking-tight font-serif">Recent Community Alerts</h4>
                    <button
                      onClick={() => setActiveTab('reports')}
                      className="text-xs font-bold text-blue-500 hover:text-blue-700 font-helvetica transition-colors cursor-pointer"
                    >
                      All Feed ({reports.filter(r => r.status === 'unread').length} Unread)
                    </button>
                  </div>
                  <div className="space-y-4">
                    {reports.length === 0 ? (
                      <div className="text-center py-10 text-slate-400 text-xs flex flex-col items-center justify-center gap-2 font-medium">
                        <FileCheck size={28} className="text-slate-300" />
                        <p>No active incidents registered. Your fleet is safe!</p>
                      </div>
                    ) : (
                      reports.slice(0, 2).map((r) => (
                        <div key={r.id} className="relative p-4 rounded-md border border-slate-100 hover:border-slate-200 transition-all text-xs space-y-2.5 bg-slate-50/50">
                          <div className="flex justify-between items-start">
                            <div>
                              <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded font-helvetica text-xs font-bold tracking-wider border ${r.type === 'accident'
                                ? 'bg-red-50 text-red-700 border-red-100'
                                : r.type === 'wrong_parking'
                                  ? 'bg-amber-50 text-amber-850 border-amber-200'
                                  : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                                }`}>
                                {r.type === 'accident' ? '🚨 Hazard/Damage' : r.type === 'wrong_parking' ? '🚗 Parking Obstruction' : '📞 Callback Request'}
                              </span>
                              <h5 className="font-semibold text-slate-900 mt-2 tracking-tight text-sm">
                                {r.vehicleLabel}
                              </h5>
                            </div>
                            <span className="text-xs font-helvetica font-medium text-slate-400">
                              {new Date(r.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>

                          <p className="text-slate-600 line-clamp-2 leading-relaxed bg-white p-3 rounded-md border border-slate-100 italic font-normal">
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

          {/* TAB 2: QR WIZARD */}
          {activeTab === 'QRWizard' && (
            <div id="qr-wizard-tab-view" className="space-y-6 animate-fadeIn font-inter">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-serif font-black text-xl text-slate-900 tracking-tight">Protected Fleet</h3>
                  <p className="text-sm text-slate-500 font-medium font-inter">Enable, disable, delete, or retrieve windshield stickers for each registered asset.</p>
                </div>
              </div>

              {/* Simple Table (No over-engineered charts or lists) */}
              <div className="bg-white border border-slate-100/80 rounded-lg overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-50 border-b border-slate-100">
                    <tr>
                      <th className="p-4 font-helvetica tracking-wider text-slate-400 font-bold text-xs">QR Wizard</th>
                      <th className="p-4 font-helvetica tracking-wider text-slate-400 font-bold text-xs">License Plate</th>
                      <th className="p-4 font-helvetica tracking-wider text-slate-400 font-bold text-xs">Security Channel</th>
                      <th className="p-4 font-helvetica tracking-wider text-slate-400 font-bold text-xs">Windshield Tag</th>
                      <th className="p-4 font-helvetica tracking-wider text-slate-400 font-bold text-xs text-right">Settings</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y-2 divide-slate-100">
                    {qrWizards.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-slate-400 font-bold block font-inter">
                          No QR Wizards Registered. Click 'Submit QR Wizard' above to create one.
                        </td>
                      </tr>
                    ) : (
                      qrWizards.map((v) => (
                        <tr
                          key={v.id}
                          onClick={() => setSelectedVehicleId(v.id)}
                          className={`cursor-pointer transition-colors ${
                            currentSelectedVehicleId === v.id ? 'bg-indigo-50/45 font-medium' : 'hover:bg-slate-50/70'
                          }`}
                        >
                          <td className={`p-4 transition-all ${
                            currentSelectedVehicleId === v.id ? 'border-l-4 border-indigo-600 pl-3' : 'border-l-4 border-transparent pl-4'
                          }`}>
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-md bg-slate-900 text-white flex items-center justify-center font-helvetica font-bold text-xs shrink-0">
                                {v.make.slice(0, 1)}
                              </div>
                              <div>
                                <span className="font-bold text-slate-900 text-sm block tracking-tight font-helvetica">
                                  {v.color} {v.make} {v.model}
                                </span>
                                <span className="text-xs text-slate-500 block font-helvetica font-semibold">Registered: {new Date(v.createdAt).toLocaleDateString()}</span>
                              </div>
                            </div>
                          </td>
                          <td className="p-4 font-mono text-sm tracking-widest font-black text-slate-900">
                            {v.licensePlate}
                          </td>
                          <td className="p-4">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleVehicleStatus(v.id);
                              }}
                              className={`px-3 py-1.5 rounded-md font-helvetica text-xs font-black transition-all inline-flex items-center gap-1.5 cursor-pointer border ${v.status === 'active'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-220'
                                : 'bg-slate-100 text-slate-400 border-slate-200'
                                }`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${v.status === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></span>
                              {v.status === 'active' ? 'Protecting (On)' : 'Muted (Off)'}
                            </button>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="p-1 px-2.5 bg-slate-900 text-white font-mono text-xs font-bold rounded-md flex items-center gap-1 tracking-wider">
                                <QrCode size={12} className="shrink-0 text-blue-400" />
                                {v.qrCodeUrl}
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onSimulatePublicScan(v.qrCodeUrl);
                                }}
                                className="text-xs font-bold text-blue-600 hover:text-blue-800 font-helvetica tracking-wider cursor-pointer"
                              >
                                Scan Link
                              </button>
                            </div>
                          </td>
                          <td className="p-4 text-right">
                            <button
                              onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteVehicle(v.id);
                              }}
                              className="px-2.5 py-1.5 text-xs text-red-650 hover:bg-red-50 hover:text-red-700 font-bold font-helvetica tracking-wide rounded-md transition-all cursor-pointer"
                            >
                              Deregister
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Dynamic Tag Sticker printable visual */}
              {qrWizards.length > 0 && (
                <div id="sticker-section-visual" className="mt-8 bg-white border border-slate-100 rounded-lg p-6 shadow-sm">
                  <h4 className="font-serif font-black text-base text-slate-900 tracking-tight">Your Windshield Sticker Tag</h4>
                  <p className="text-sm text-slate-500 font-medium font-inter">Click a record in the list above to view its printable windshield sticker tag preview.</p>

                  <div className="flex justify-center mt-6">
                    {vehicles.filter(vh => vh.id === currentSelectedVehicleId).map((vh) => {
                      const scanUrl = `${window.location.origin}${window.location.pathname}#/scan/${vh.qrCodeUrl}`;
                      const qrImgUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(scanUrl)}`;
                      return (
                        <div key={vh.id} className="clay-morph-white p-6 flex flex-col items-center text-center relative overflow-hidden border border-white/60 shadow-md max-w-sm w-full mx-auto">
                          {/* Minimalist Card Branding */}
                          <div className="text-xs text-slate-400 font-mono tracking-widest font-black uppercase mb-3">
                            Sticker ID: {vh.qrCodeUrl}
                          </div>

                          {/* Minimalist QR Frame */}
                          <div className="bg-white/80 border border-slate-200/60 rounded-xl p-4 shadow-[inset_2px_2px_4px_rgba(0,0,0,0.02)] flex flex-col items-center w-full">
                            {/* QR Code */}
                            <div className="w-36 h-36 bg-white p-2 rounded-lg border border-slate-100 shadow-sm flex items-center justify-center">
                              <img src={qrImgUrl} alt={`QR Code ${vh.qrCodeUrl}`} className="w-full h-full object-contain" />
                            </div>
                            
                            {/* Reduced Text Details */}
                            <div className="mt-4">
                              <span className="font-serif font-black text-sm text-slate-900 block tracking-tight">
                                {vh.color} {vh.make}
                              </span>
                              <span className="text-xs font-mono text-slate-500 block mt-1 tracking-wider">
                                Plate: {vh.licensePlate}
                              </span>
                            </div>
                          </div>

                          {/* Simplified Print & Test buttons */}
                          <div className="mt-5 flex gap-2 w-full">
                            <button
                              onClick={() => window.print()}
                              className="flex-grow py-2 border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold font-helvetica tracking-wider text-slate-700 rounded-md transition-all cursor-pointer shadow-xs"
                            >
                              Print Layout
                            </button>
                            <button
                              onClick={() => onSimulatePublicScan(vh.qrCodeUrl)}
                              className="py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-xs font-bold font-helvetica tracking-wider text-white rounded-md transition-all cursor-pointer clay-button-primary border-none"
                            >
                              Scan Test
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: COMMUNITY ALERTS FEED */}
          {activeTab === 'reports' && (
            <div id="reports-tab-view" className="space-y-6 animate-fadeIn">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-xl font-semibold text-slate-900 tracking-tight">Community Alerts Feed</h3>
                  <p className="text-xs text-slate-500 font-normal mt-0.5">Bystander alerts, convenience calls, and active incident feed details.</p>
                </div>

                {/* Nice minimalist filter pills on status (unread, acknowledged, resolved) */}
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-md self-start sm:self-auto border border-slate-200">
                  {(['all', 'unread', 'acknowledged', 'resolved'] as const).map((status) => {
                    const count = status === 'all'
                      ? reports.length
                      : reports.filter((r) => r.status === status).length;

                    const isActive = reportFilter === status;

                    return (
                      <button
                        key={status}
                        onClick={() => setReportFilter(status)}
                        className={`px-3 py-1.5 rounded-md text-xs font-semibold tracking-wide transition-all cursor-pointer ${isActive
                          ? 'bg-slate-900 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                          }`}
                      >
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                        {count > 0 && (
                          <span className={`ml-1.5 px-1.5 py-0.2 rounded text-xs font-medium ${isActive ? 'bg-slate-800 text-slate-100' : 'bg-slate-200 text-slate-700'
                            }`}>
                            {count}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* List Feed of Alerts */}
              <div className="space-y-4">
                {(() => {
                  const filteredReports = reports.filter((r) => {
                    if (reportFilter === 'all') return true;
                    return r.status === reportFilter;
                  });

                  if (filteredReports.length === 0) {
                    return (
                      <div className="clay-morph-white p-12 text-center text-slate-400 border border-white/60">
                        <CheckCircle size={32} className="mx-auto text-emerald-500 mb-2" />
                        <h4 className="text-slate-900 font-semibold text-sm mb-1">Status Clear</h4>
                        <p className="text-xs max-w-xs mx-auto text-slate-500 leading-relaxed">
                          No {reportFilter !== 'all' ? reportFilter : ''} alerts match these criteria.
                        </p>
                      </div>
                    );
                  }

                  return filteredReports.map((r) => (
                    <div
                      key={r.id}
                      className={`clay-morph-white p-5 transition-all border border-white/60 shadow-md ${r.status === 'unread'
                        ? 'border-blue-300 ring-2 ring-blue-50/50 shadow-xs'
                        : 'border-slate-200 bg-white shadow-xs'
                        }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded font-helvetica text-xs font-bold tracking-wider border ${r.type === 'accident'
                              ? 'bg-red-50 text-red-700 border-red-200'
                              : r.type === 'wrong_parking'
                                ? 'bg-amber-50 text-amber-805 border-amber-200'
                                : 'bg-blue-50 text-blue-700 border-blue-200'
                              }`}>
                              {r.type === 'accident' ? '🚨 Critical Hazard' : r.type === 'wrong_parking' ? '🚗 Parking Obstruction' : '📞 Callback'}
                            </span>

                            {r.status === 'unread' && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.2 bg-red-50 text-red-700 text-xs font-medium rounded border border-red-150">
                                Unread
                              </span>
                            )}
                            {r.status === 'acknowledged' && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.2 bg-amber-50 text-amber-700 text-xs font-medium rounded border border-amber-150">
                                Acknowledged
                              </span>
                            )}
                            {r.status === 'resolved' && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.2 bg-emerald-50 text-emerald-700 text-xs font-medium rounded border border-emerald-150">
                                <CheckCircle size={10} /> Resolved
                              </span>
                            )}
                          </div>

                          <div>
                            <h4 className="text-base font-semibold text-slate-900 tracking-tight">
                              {r.vehicleLabel}
                            </h4>
                            <p className="text-[11px] text-slate-500 font-normal mt-0.5">
                              Plate: <span className="font-semibold">{r.licensePlate}</span>
                            </p>
                          </div>
                        </div>

                        {/* Datetime indicator */}
                        <div className="text-left sm:text-right text-[11px] text-slate-500 font-normal">
                          <span className="block font-medium">{new Date(r.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                          <span className="text-slate-400 block mt-0.5">{new Date(r.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>

                      {/* message details bubble */}
                      <div className="mt-3 bg-slate-50 border border-slate-100 rounded-md p-3 text-slate-700 text-xs leading-relaxed font-normal">
                        "{r.message}"
                      </div>

                      {/* Simplified location and reporter specs - 30% info reduction */}
                      <div className="flex flex-wrap items-center justify-between gap-2 mt-3 pt-3 border-t border-slate-100 text-[11px] text-slate-500 font-normal">
                        {/* Reporter details */}
                        <div className="flex items-center gap-1.5">
                          <Phone size={13} className="text-slate-400" />
                          <span>Contact: <span className="font-medium text-slate-800">{r.reporterPhone || 'Anonymous'}</span></span>
                        </div>

                        {/* Geotag - Hidden if not exists, much cleaner */}
                        {r.location && (
                          <div className="flex items-center gap-1.5">
                            <MapPin size={13} className="text-slate-400" />
                            <span>Geotag: <span className="font-medium text-slate-800">{r.location.lat.toFixed(4)}, {r.location.lng.toFixed(4)}</span></span>
                          </div>
                        )}
                      </div>

                      {/* Action items */}
                      <div className="mt-4 pt-3 border-t border-slate-100 flex gap-2 justify-end">
                        {r.status === 'unread' && (
                          <button
                            onClick={() => handleAcknowledgeReport(r.id)}
                            className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-[11px] font-semibold tracking-wider rounded-md shadow-xs transition-all cursor-pointer"
                          >
                            Acknowledge
                          </button>
                        )}
                        {r.status !== 'resolved' && (
                          <button
                            onClick={() => handleResolveReport(r.id)}
                            className="px-3.5 py-1.5 text-white text-[11px] font-semibold tracking-wider rounded-md shadow-xs transition-all cursor-pointer bg-slate-900 hover:bg-slate-850"
                          >
                            Resolve Alert
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteReport(r.id)}
                          className="px-3.5 py-1.5 text-slate-600 hover:text-slate-900 text-[11px] font-semibold tracking-wider rounded-md transition-all cursor-pointer bg-white border border-slate-200 hover:bg-slate-50"
                        >
                          Archive Notice
                        </button>
                      </div>
                    </div>
                  ));
                })()}
              </div>
            </div>
          )}

          {/* TAB 4: SETTINGS & BILLING */}
          {activeTab === 'settings' && (
            <div id="settings-tab-view" className="space-y-6 animate-fadeIn">
              <div className="clay-morph-white p-6 border border-white/60 shadow-md">
                <h4 className="font-serif font-black text-base text-slate-900 mb-4 pb-2 border-b border-slate-100 tracking-tight">Profile Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block text-xs font-helvetica tracking-wider text-slate-500 mb-1.5 font-bold">Email / Username</label>
                    <input
                      type="text"
                      disabled
                      value={user.email}
                      className="w-full px-3.5 py-2.5 bg-slate-100/85 border border-slate-200 text-slate-400 rounded-md outline-none font-helvetica cursor-not-allowed font-semibold shadow-inner"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-helvetica tracking-wider text-slate-500 mb-1.5 font-bold">Full Name</label>
                    <input
                      type="text"
                      value={user.fullName}
                      onChange={(e) => onUpdateUser({ ...user, fullName: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-white/80 border border-slate-200/80 rounded-md placeholder-slate-400 font-semibold shadow-[inset_2px_2px_4px_rgba(0,0,0,0.02),_inset_-2px_-2px_4px_rgba(255,255,255,0.9)] focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all font-inter"
                    />
                  </div>
                </div>
              </div>

              {/* Pricing subscription details section */}
              <div className="clay-morph-white p-6 border border-white/60 shadow-md">
                <div className="flex justify-between items-start mb-4 pb-2 border-b border-slate-100">
                  <div>
                    <h4 className="font-serif font-black text-base text-slate-900 tracking-tight">Premium Subscription Plan</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5 font-medium font-inter">Toggle tier level to witness responsive plan changes.</p>
                  </div>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-helvetica text-xs font-black tracking-wider border ${user.subscriptionPlan === 'pro'
                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                    : 'bg-slate-100 text-slate-500 border-slate-200'
                    }`}>
                    {user.subscriptionPlan === 'pro' ? (
                      <>
                        <Crown size={10} className="fill-amber-400 text-amber-500" /> Pro Shield Active
                      </>
                    ) : 'Basic Free Plan'}
                  </span>
                </div>

                <div className="p-4 bg-white/50 border border-slate-200/85 rounded-md mb-6 shadow-inner">
                  <div className="flex justify-between items-center text-xs">
                    <div>
                      <strong className="text-slate-950 block font-serif font-black tracking-tight">
                        {user.subscriptionPlan === 'pro' ? 'Pro Tag Shield Unlimited' : 'Basic Tier Limits'}
                      </strong>
                      <span className="text-[11px] text-slate-500 block mt-0.5 font-medium font-inter">
                        {user.subscriptionPlan === 'pro'
                          ? 'Includes priority SMS callbacks, customizable vectors, dynamic QR sticker packs, and high density tag channels.'
                          : 'Limited to standard real-time email-based routing alerts and printable default QR tags.'}
                      </span>
                    </div>
                    <span className="font-serif font-black text-2xl text-slate-950 shrink-0">
                      {user.subscriptionPlan === 'pro' ? '$5' : '$0'}/mo
                    </span>
                  </div>
                </div>

                <div className="flex justify-end gap-2.5">
                  <button
                    onClick={() => {
                      const nextPlan = user.subscriptionPlan === 'pro' ? 'free' as const : 'pro' as const;
                      onUpdateUser({ ...user, subscriptionPlan: nextPlan, isSubscribed: nextPlan === 'pro' });
                    }}
                    className="px-4 py-2.5 clay-morph-white-btn text-xs font-bold font-helvetica tracking-wide rounded-md transition-all cursor-pointer shadow-sm"
                  >
                    Switch to {user.subscriptionPlan === 'pro' ? 'Free Basic Tier' : 'Upgrade to Pro'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* RENDER DYNAMIC REGISTER NEW QR WIZARD MODAL BOX */}
      <AnimatePresence>
        {isAddVehicleOpen && (
          <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="clay-morph-white border border-white/80 max-w-md w-full shadow-2xl overflow-hidden shrink-0 p-0 bg-white/95"
            >
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <div>
                  <h3 className="font-serif font-black text-slate-900 tracking-tight">Register New QR Wizard</h3>
                  <p className="text-[11px] text-slate-555 mt-0.5 font-medium">Fill in standard physical QR Wizard specifications.</p>
                </div>
                <button
                  onClick={() => setIsAddVehicleOpen(false)}
                  className="p-1.5 text-slate-450 hover:text-slate-900 rounded hover:bg-slate-100 transition-colors"
                >
                  <ChevronRight size={18} className="transform rotate-90" />
                </button>
              </div>

              {formError && (
                <div className="p-4 bg-red-50 border-b border-red-200 text-red-700 text-xs font-bold font-helvetica">
                  {formError}
                </div>
              )}

              <form onSubmit={handleRegisterVehicleSubmit} className="p-5 space-y-4">
                <div className="grid grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-helvetica tracking-wider text-slate-500 mb-1 font-black">Make</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Tesla, Porsche"
                      value={carMake}
                      onChange={(e) => setCarMake(e.target.value)}
                      className="w-full px-3 py-2.5 text-slate-800 text-xs bg-white/85 border border-slate-200/80 rounded-md placeholder-slate-400 font-semibold shadow-[inset_1.5px_1.5px_3px_rgba(0,0,0,0.02),_inset_-1.5px_-1.5px_3px_rgba(255,255,255,0.8)] focus:outline-none focus:border-indigo-650 focus:ring-2 focus:ring-indigo-100 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-helvetica tracking-wider text-slate-500 mb-1 font-black">Model</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Model Y, GT3"
                      value={carModel}
                      onChange={(e) => setCarModel(e.target.value)}
                      className="w-full px-3 py-2.5 text-slate-800 text-xs bg-white/85 border border-slate-200/80 rounded-md placeholder-slate-400 font-semibold shadow-[inset_1.5px_1.5px_3px_rgba(0,0,0,0.02),_inset_-1.5px_-1.5px_3px_rgba(255,255,255,0.8)] focus:outline-none focus:border-indigo-650 focus:ring-2 focus:ring-indigo-100 transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-helvetica tracking-wider text-slate-500 mb-1 font-black">Year</label>
                    <input
                      type="number"
                      placeholder="2026"
                      value={carYear}
                      onChange={(e) => setCarYear(Number(e.target.value))}
                      className="w-full px-3 py-2.5 text-slate-800 text-xs bg-white/85 border border-slate-200/80 rounded-md placeholder-slate-400 font-semibold shadow-[inset_1.5px_1.5px_3px_rgba(0,0,0,0.02),_inset_-1.5px_-1.5px_3px_rgba(255,255,255,0.8)] focus:outline-none focus:border-indigo-650 focus:ring-2 focus:ring-indigo-100 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-helvetica tracking-wider text-slate-500 mb-1 font-black">Color</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Space Gray"
                      value={carColor}
                      onChange={(e) => setCarColor(e.target.value)}
                      className="w-full px-3 py-2.5 text-slate-800 text-xs bg-white/85 border border-slate-200/80 rounded-md placeholder-slate-400 font-semibold shadow-[inset_1.5px_1.5px_3px_rgba(0,0,0,0.02),_inset_-1.5px_-1.5px_3px_rgba(255,255,255,0.8)] focus:outline-none focus:border-indigo-650 focus:ring-2 focus:ring-indigo-100 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-helvetica tracking-wider text-slate-500 mb-1 font-black">License Plate Number</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. california 7a9f4"
                    value={carPlate}
                    onChange={(e) => setCarPlate(e.target.value)}
                    className="w-full px-3 py-2.5 text-slate-800 text-xs bg-white/85 border border-slate-200/80 rounded-md placeholder-slate-400 font-semibold shadow-[inset_1.5px_1.5px_3px_rgba(0,0,0,0.02),_inset_-1.5px_-1.5px_3px_rgba(255,255,255,0.8)] focus:outline-none focus:border-indigo-650 focus:ring-2 focus:ring-indigo-100 font-mono font-black"
                  />
                </div>

                <div className="flex gap-2.5 pt-4 border-t border-slate-100 justify-between items-center">
                  <button
                    type="button"
                    onClick={handleAutoFillVehicle}
                    className="py-2.5 px-3.5 border border-dashed border-slate-200 hover:bg-slate-50 text-xs font-black text-slate-500 hover:text-indigo-650 rounded-md transition-all cursor-pointer"
                  >
                    ⚡ Auto Fill Demo
                  </button>
                  <div className="flex gap-2.5">
                    <button
                      type="button"
                      onClick={() => setIsAddVehicleOpen(false)}
                      className="px-4 py-2.5 clay-morph-white-btn text-xs font-bold tracking-wider rounded-md transition-all cursor-pointer shadow-xs"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      id="save-vehicle-btn"
                      className="px-5 py-2.5 clay-morph-indigo-btn text-xs font-bold tracking-wider rounded-md shadow-sm transition-all cursor-pointer"
                    >
                      Save and Link Tag
                    </button>
                  </div>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

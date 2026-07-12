import React from 'react';
import { ShieldCheck, ShieldOff, MapPin, Clock, Scan } from 'lucide-react';
import { NamoProduct } from '../../types';

interface ProductCardProps {
  product: NamoProduct;
  onManage: (p: NamoProduct) => void;
  onSimulateScan: (p: NamoProduct) => void;
}

const CATEGORY_ICONS: Record<string, string> = {
  car: '🚗', bike: '🏍️', home: '🏠', luggage: '🧳',
  keychain: '🔑', child: '🎒', pet: '🐾', wallet: '👛',
  employee: '🪪', senior: '👴', helmet: '⛑️', bicycle: '🚲',
  door: '🚪', apartment: '🏢', nfc: '📡', travel: '✈️', wristband: '⌚',
};

const STATUS_STYLES: Record<string, { label: string; color: string; bg: string; border: string }> = {
  active: { label: 'Active', color: '#16a34a', bg: '#f0fdf4', border: 'rgba(22,163,74,0.2)' },
  inactive: { label: 'Inactive', color: '#6E6759', bg: '#F6F1E7', border: 'rgba(110,103,89,0.2)' },
  lost: { label: 'Lost', color: '#dc2626', bg: '#fef2f2', border: 'rgba(220,38,38,0.2)' },
  replaced: { label: 'Replaced', color: '#9333ea', bg: '#faf5ff', border: 'rgba(147,51,234,0.2)' },
};

export default function ProductCard({ product, onManage, onSimulateScan }: ProductCardProps) {
  const icon = CATEGORY_ICONS[product.category] || '🏷️';
  const statusStyle = STATUS_STYLES[product.status] || STATUS_STYLES.inactive;

  const subtitle = (() => {
    const d = product.details;
    if (product.category === 'car' || product.category === 'bike') return [d.make, d.model, d.licensePlate].filter(Boolean).join(' · ');
    if (product.category === 'home') return d.houseProfile || 'Home Gate';
    if (product.category === 'keychain') return `Blood: ${d.bloodGroup || 'N/A'}`;
    if (product.category === 'luggage') return d.ownerName || 'Luggage';
    if (product.category === 'child') return d.schoolName || 'School Bag';
    return product.assignedTo;
  })();

  return (
    <div className="bg-[#FFFEFB] border border-[rgba(32,28,21,0.09)] rounded-[18px] p-5 flex flex-col h-full hover:shadow-[0_8px_28px_-8px_rgba(32,28,21,0.12)] transition-all duration-200 hover:-translate-y-0.5">
      <div className="flex items-start justify-between mb-3">
        <div className="w-11 h-11 rounded-xl bg-[#F0EBE0] flex items-center justify-center text-[22px]">
          {icon}
        </div>
        <span
          className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest inline-flex items-center gap-1"
          style={{ color: statusStyle.color, background: statusStyle.bg, border: `1px solid ${statusStyle.border}` }}
        >
          {product.status === 'active' ? <ShieldCheck size={9} /> : <ShieldOff size={9} />}
          {statusStyle.label}
        </span>
      </div>

      <h3 className="font-bold text-[#201C15] text-sm leading-tight mb-1">{product.name}</h3>
      <p className="text-[11px] text-[#A79E8B] mb-1 truncate">{subtitle}</p>
      <p className="text-[10px] text-[#A79E8B] mb-3">
        Assigned to <span className="font-semibold text-[#6E6759]">{product.assignedTo}</span>
      </p>

      <div className="flex items-center gap-3 text-[10px] text-[#A79E8B] mb-4">
        <span className="flex items-center gap-1"><Scan size={10} /> {product.scansCount} scans</span>
        {product.lastScannedAt && (
          <span className="flex items-center gap-1">
            <Clock size={10} /> {new Date(product.lastScannedAt).toLocaleDateString()}
          </span>
        )}
        <span className="flex items-center gap-1"><MapPin size={10} /> {product.qrCodeId}</span>
      </div>

      <div className="flex gap-2 mt-auto">
        <button
          onClick={() => onSimulateScan(product)}
          className="flex-1 py-2 text-[11px] font-bold uppercase tracking-wider border border-[rgba(32,28,21,0.12)] text-[#6E6759] rounded-lg hover:bg-[#F0EBE0] transition-colors cursor-pointer bg-transparent"
        >
          Simulate Scan
        </button>
        <button
          onClick={() => onManage(product)}
          className="flex-1 py-2 text-[11px] font-bold uppercase tracking-wider bg-[#E25822] text-white rounded-lg hover:bg-[#C4471A] transition-colors cursor-pointer border-none"
        >
          Manage
        </button>
      </div>
    </div>
  );
}

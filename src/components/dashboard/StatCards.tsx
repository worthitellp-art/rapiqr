import React from 'react';
import { ShieldCheck, QrCode, AlertTriangle, Scan } from 'lucide-react';
import { NamoProduct, Report } from '../../types';

interface StatCardsProps {
  products: NamoProduct[];
  reports: Report[];
  totalScans: number;
}

export default function StatCards({ products, reports, totalScans }: StatCardsProps) {
  const activeCount = products.filter((p) => p.status === 'active').length;
  const unreadCount = reports.filter((r) => r.status === 'unread').length;

  const stats = [
    {
      label: 'Active Tags',
      value: activeCount,
      icon: ShieldCheck,
      color: '#22c55e',
      bg: '#f0fdf4',
      border: 'rgba(34,197,94,0.15)',
    },
    {
      label: 'Total Tags',
      value: products.length,
      icon: QrCode,
      color: '#E25822',
      bg: '#FBEBE1',
      border: 'rgba(226,88,34,0.15)',
    },
    {
      label: 'Unread Alerts',
      value: unreadCount,
      icon: AlertTriangle,
      color: '#f59e0b',
      bg: '#fffbeb',
      border: 'rgba(245,158,11,0.15)',
    },
    {
      label: 'Total Scans',
      value: totalScans,
      icon: Scan,
      color: '#6366f1',
      bg: '#eef2ff',
      border: 'rgba(99,102,241,0.15)',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      {stats.map(({ label, value, icon: Icon, color, bg, border }) => (
        <div
          key={label}
          className="rounded-[16px] p-4 flex flex-col gap-3"
          style={{ background: bg, border: `1px solid ${border}` }}
        >
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: `${color}18` }}
          >
            <Icon size={16} style={{ color }} />
          </div>
          <div>
            <p className="text-[24px] font-bold text-[#201C15] leading-none">{value}</p>
            <p className="text-[11px] text-[#6E6759] mt-1 font-medium">{label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

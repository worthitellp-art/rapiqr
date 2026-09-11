import React from "react";
import { CheckCircle2 } from "lucide-react";

export default function PrintSheetSpecifications() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <div className="p-3 bg-[#F8F8F7] rounded-lg border border-[#E5E7EB] text-center">
        <span className="block text-[11px] text-[#71717A] uppercase font-bold tracking-wider">Sheet Size</span>
        <span className="font-bold text-[14px] text-[#18181B]">18 × 12 inches</span>
      </div>
      <div className="p-3 bg-[#F8F8F7] rounded-lg border border-[#E5E7EB] text-center">
        <span className="block text-[11px] text-[#71717A] uppercase font-bold tracking-wider">Resolution</span>
        <span className="font-bold text-[14px] text-[#18181B]">300 DPI (5400×3600)</span>
      </div>
      <div className="p-3 bg-[#F8F8F7] rounded-lg border border-[#E5E7EB] text-center">
        <span className="block text-[11px] text-[#71717A] uppercase font-bold tracking-wider">Grid Layout</span>
        <span className="font-bold text-[14px] text-[#18181B]">3 × 3 (9 Stickers)</span>
      </div>
      <div className="p-3 bg-[#F8F8F7] rounded-lg border border-[#E5E7EB] text-center">
        <span className="block text-[11px] text-[#71717A] uppercase font-bold tracking-wider">Finishing</span>
        <span className="font-bold text-[14px] text-[#16A34A] flex items-center justify-center gap-1">
          <CheckCircle2 size={13} /> Cut Lines
        </span>
      </div>
    </div>
  );
}

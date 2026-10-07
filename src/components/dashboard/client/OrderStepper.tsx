import React, { useState } from 'react';
import { Check, ChevronLeft, ChevronRight } from 'lucide-react';

export interface OrderStepperOrder {
  status: string;
  createdAt?: string | null;
  shiprocket?: { courierName?: string | null; etd?: string | null } | null;
}

type StepState = 'completed' | 'in_progress' | 'pending';

interface Step {
  key: string;
  title: string;
  state: StepState;
  date: string | null;
  detail: string;
}

const formatDate = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : null;

/**
 * The four stages of a sticker order, derived from the order's fulfilment status.
 * `placed` → Processing is in progress, `shipped` → Shipping is, `delivered` → all done.
 */
export function getOrderSteps(order: OrderStepperOrder): Step[] {
  const rank = order.status === 'delivered' ? 3 : order.status === 'shipped' ? 2 : 1;
  const courier = order.shiprocket?.courierName || null;
  const etd = order.shiprocket?.etd || null;
  const stateAt = (stage: number): StepState => (rank > stage ? 'completed' : rank === stage ? 'in_progress' : 'pending');

  return [
    {
      key: 'placed',
      title: 'Order Placed',
      state: 'completed',
      date: formatDate(order.createdAt),
      detail: 'We received your order.',
    },
    {
      key: 'processing',
      title: 'Processing',
      state: stateAt(1),
      date: null,
      detail: 'We are preparing your sticker kit.',
    },
    {
      key: 'shipping',
      title: 'Shipping',
      state: stateAt(2),
      date: rank < 3 && etd ? `Estimated: ${etd}` : null,
      detail: courier ? `Dispatched with ${courier}.` : 'Courier details appear once it is dispatched.',
    },
    {
      key: 'delivered',
      title: 'Delivered',
      state: stateAt(3),
      date: rank < 3 && etd ? `Estimated: ${etd}` : null,
      detail: 'Delivered to your address.',
    },
  ];
}

const PILL: Record<StepState, { label: string; cls: string }> = {
  completed: { label: 'Completed', cls: 'bg-[#E9F9EF] text-[#2E9E5B]' },
  in_progress: { label: 'In Progress', cls: 'bg-[#E8F0FE] text-[#1A5FD9]' },
  pending: { label: 'Pending', cls: 'bg-[var(--fx-canvas)] text-[var(--fx-faint)]' },
};

/** Vertical stage list with Previous / Next to step through each stage's detail. */
export default function OrderStepper({ order }: { order: OrderStepperOrder }) {
  const steps = getOrderSteps(order);
  const currentIdx = Math.max(0, steps.findIndex((s) => s.state === 'in_progress'));
  const lastIdx = steps.length - 1;
  const [focus, setFocus] = useState<number | null>(null);
  const idx = focus ?? (steps.every((s) => s.state === 'completed') ? lastIdx : currentIdx);

  return (
    <div className="rounded-[var(--fx-radius-card)] border border-[var(--fx-border)] bg-white p-4 sm:p-5">
      <ol>
        {steps.map((s, i) => {
          const isLast = i === lastIdx;
          const done = s.state === 'completed';
          return (
            <li key={s.key} className="relative flex gap-4 pb-6 last:pb-0">
              {!isLast && (
                <span
                  aria-hidden
                  className={`absolute left-[15px] top-8 bottom-0 w-[2px] ${done ? 'bg-[#111111]' : 'bg-[var(--fx-border)]'}`}
                />
              )}
              <div
                className={`relative z-10 w-8 h-8 shrink-0 rounded-full flex items-center justify-center border-2 text-sm font-bold ${
                  done
                    ? 'bg-[#111111] border-[#111111] text-white'
                    : s.state === 'in_progress'
                      ? 'bg-white border-[#111111] text-[#111111]'
                      : 'bg-white border-[var(--fx-border)] text-[var(--fx-faint)]'
                }`}
                aria-hidden
              >
                {done ? <Check size={15} strokeWidth={3} /> : i + 1}
              </div>
              <button
                type="button"
                onClick={() => setFocus(i)}
                aria-current={i === idx ? 'step' : undefined}
                className="min-w-0 flex-1 text-left cursor-pointer rounded-md"
              >
                <p className={`text-[15px] font-bold ${s.state === 'pending' ? 'text-[var(--fx-faint)]' : 'text-[var(--fx-ink)]'}`}>
                  {s.title}
                </p>
                <span className={`mt-1 inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${PILL[s.state].cls}`}>
                  {PILL[s.state].label}
                </span>
                {s.date && <p className="mt-1 text-[12px] text-[var(--fx-faint)]">{s.date}</p>}
                {i === idx && <p className="mt-1.5 text-[12.5px] text-[var(--fx-ink-2)]">{s.detail}</p>}
              </button>
            </li>
          );
        })}
      </ol>

      <div className="mt-5 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setFocus(Math.max(0, idx - 1))}
          disabled={idx === 0}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[var(--fx-radius-control)] border border-[var(--fx-border)] bg-white text-xs font-semibold text-[var(--fx-ink)] hover:bg-[var(--fx-canvas)] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
        >
          <ChevronLeft size={14} /> Previous
        </button>
        <button
          type="button"
          onClick={() => setFocus(Math.min(lastIdx, idx + 1))}
          disabled={idx === lastIdx}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[var(--fx-radius-control)] bg-[#111111] text-xs font-semibold text-white hover:bg-black disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
        >
          Next <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}

'use client';

import { useRef, useState, KeyboardEvent } from 'react';
import { useDraggable } from '@dnd-kit/core';

export type Lead = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  revenue_range: string | null;
  appointment_at: string | null;
  pipeline_stage: string | null;
  sold_amount: number | null;
};

type Props = {
  lead: Lead;
  isSoldColumn: boolean;
  error?: string;
  onSoldAmountChange: (leadId: string, amount: number | null) => void;
};

export default function LeadCard({ lead, isSoldColumn, error, onSoldAmountChange }: Props) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: lead.id });

  const [editingSold, setEditingSold] = useState(false);
  const [soldInput, setSoldInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const fullName = [lead.first_name, lead.last_name].filter(Boolean).join(' ') || 'Unknown';

  const appointmentStr = lead.appointment_at
    ? new Date(lead.appointment_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) +
      ', ' +
      new Date(lead.appointment_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    : null;

  function startEdit(e: React.MouseEvent) {
    e.stopPropagation();
    setSoldInput(lead.sold_amount?.toString() ?? '');
    setEditingSold(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  function confirmSoldEdit() {
    const trimmed = soldInput.trim();
    const amount = trimmed === '' ? null : parseFloat(trimmed);

    if (amount === null && lead.sold_amount !== null) {
      const ok = window.confirm('Clear the sold amount for this lead?');
      if (!ok) {
        setSoldInput(lead.sold_amount?.toString() ?? '');
        setEditingSold(false);
        return;
      }
    }

    if (amount !== null && isNaN(amount)) {
      setEditingSold(false);
      return;
    }

    onSoldAmountChange(lead.id, amount);
    setEditingSold(false);
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') confirmSoldEdit();
    if (e.key === 'Escape') {
      setSoldInput(lead.sold_amount?.toString() ?? '');
      setEditingSold(false);
    }
  }

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={{ visibility: isDragging ? 'hidden' : 'visible' }}
      className={`bg-canvas-white rounded-xl p-card-padding shadow-[0_4px_20px_rgba(0,0,0,0.05)] border cursor-grab active:cursor-grabbing select-none ${
        appointmentStr
          ? 'border-outline-gray/20 border-l-4 border-l-mint-accent'
          : 'border-outline-gray/20'
      }`}
    >
      {/* Error banner */}
      {error && (
        <div className="mb-md px-sm py-xs bg-error-container text-on-error-container text-label font-label rounded-lg flex items-center gap-xs">
          <span
            className="material-symbols-outlined text-[14px]"
            style={{ fontVariationSettings: "'FILL' 1, 'wght' 400" }}
          >
            error
          </span>
          {error}
        </div>
      )}

      {/* Name + revenue badge */}
      <div className="flex justify-between items-start mb-md">
        <h4 className="text-body font-heading font-bold text-text-black">{fullName}</h4>
        {lead.revenue_range && (
          <span className="bg-stone-beige text-text-black text-[10px] font-label px-sm py-[2px] rounded-full shrink-0 ml-sm">
            {lead.revenue_range}
          </span>
        )}
      </div>

      {/* Contact info */}
      <div className="flex flex-col gap-xs mb-md">
        {lead.phone && (
          <p className="text-secondary text-label font-body flex items-center gap-xs">
            <span className="material-symbols-outlined text-[14px]">phone</span>
            {lead.phone}
          </p>
        )}
        {lead.email && (
          <p className="text-secondary text-label font-body flex items-center gap-xs">
            <span className="material-symbols-outlined text-[14px]">mail</span>
            {lead.email}
          </p>
        )}
      </div>

      {/* Appointment row */}
      <div className="pt-sm border-t border-outline-gray/30">
        {appointmentStr ? (
          <div className="flex items-center gap-xs text-primary">
            <span className="material-symbols-outlined text-[14px]">event</span>
            <span className="text-[11px] font-body font-bold">{appointmentStr}</span>
          </div>
        ) : (
          <div className="flex items-center gap-xs text-subtle-sage">
            <span className="material-symbols-outlined text-[14px]">calendar_clock</span>
            <span className="text-[11px] font-body">No appt set</span>
          </div>
        )}
      </div>

      {/* Sold amount — Sold column only */}
      {isSoldColumn && (
        <div className="mt-md pt-md border-t border-outline-gray/30">
          <p className="text-label font-label text-secondary mb-xs">Sold for:</p>
          {editingSold ? (
            <div
              className="flex items-center gap-xs"
              onPointerDown={(e) => e.stopPropagation()}
            >
              <input
                ref={inputRef}
                type="number"
                min="0"
                step="0.01"
                value={soldInput}
                onChange={(e) => setSoldInput(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-1 border border-primary rounded-lg px-sm py-xs text-body font-body text-text-black focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="0.00"
              />
              <button
                type="button"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => { e.stopPropagation(); confirmSoldEdit(); }}
                className="text-primary hover:text-primary/80 transition-colors"
              >
                <span
                  className="material-symbols-outlined text-[22px]"
                  style={{ fontVariationSettings: "'FILL' 1, 'wght' 400" }}
                >
                  check_circle
                </span>
              </button>
            </div>
          ) : (
            <button
              type="button"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={startEdit}
              className="text-left w-full"
            >
              {lead.sold_amount != null ? (
                <span className="text-body font-body font-bold text-text-black hover:text-primary transition-colors">
                  {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(
                    lead.sold_amount
                  )}
                </span>
              ) : (
                <span className="text-muted-ash text-label hover:text-secondary transition-colors">
                  Click to add amount
                </span>
              )}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

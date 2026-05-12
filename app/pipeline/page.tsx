'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  pointerWithin,
} from '@dnd-kit/core';
import { supabase } from '@/lib/supabase';
import { useAdminAuth, clearAdminAuth } from '@/hooks/useAdminAuth';
import KanbanColumn from './_components/KanbanColumn';
import { Lead } from './_components/LeadCard';
import AvailabilityGrid from './_components/AvailabilityGrid';

const STAGES = [
  { id: 'lead', label: 'Lead' },
  { id: 'appointment', label: 'Appointment' },
  { id: 'qualified', label: 'Qualified' },
  { id: 'sold', label: 'Sold' },
  { id: 'not_interested', label: 'Not Interested' },
] as const;

export default function PipelinePage() {
  useAdminAuth();
  const router = useRouter();

  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [cardErrors, setCardErrors] = useState<Record<string, string>>({});
  const [activeDragLead, setActiveDragLead] = useState<Lead | null>(null);
  const [blockedSlots, setBlockedSlots] = useState<string[]>([]);
  const [gridSaveError, setGridSaveError] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  useEffect(() => {
    fetchLeads();
  }, []);

  async function fetchLeads() {
    const [leadsRes, configRes] = await Promise.all([
      supabase
        .from('leads')
        .select('id, first_name, last_name, email, phone, revenue_range, appointment_at, pipeline_stage, sold_amount')
        .eq('row_type', 'lead')
        .order('created_at', { ascending: false }),
      supabase
        .from('leads')
        .select('blocked_slots')
        .eq('id', '00000000-0000-0000-0000-000000000001')
        .single(),
    ]);

    if (!leadsRes.error && leadsRes.data) setLeads(leadsRes.data as Lead[]);
    if (!configRes.error && configRes.data) {
      setBlockedSlots((configRes.data.blocked_slots as string[]) ?? []);
    }
    setLoading(false);
  }

  async function handleToggleSlot(slotIso: string) {
    const prev = blockedSlots;
    const isBlocked = prev.includes(slotIso);
    const next = isBlocked ? prev.filter((s) => s !== slotIso) : [...prev, slotIso];

    // Optimistic update
    setBlockedSlots(next);

    const { error } = await supabase
      .from('leads')
      .update({ blocked_slots: next })
      .eq('id', '00000000-0000-0000-0000-000000000001');

    if (error) {
      setBlockedSlots(prev);
      setGridSaveError('Failed to save. Try again.');
      setTimeout(() => setGridSaveError(null), 4000);
    }
  }

  function setCardError(leadId: string, message: string) {
    setCardErrors((prev) => ({ ...prev, [leadId]: message }));
    setTimeout(() => {
      setCardErrors((prev) => {
        const next = { ...prev };
        delete next[leadId];
        return next;
      });
    }, 4000);
  }

  function handleDragStart(event: DragStartEvent) {
    const lead = leads.find((l) => l.id === event.active.id);
    setActiveDragLead(lead ?? null);
  }

  async function handleDragEnd(event: DragEndEvent) {
    setActiveDragLead(null);
    const { active, over } = event;
    if (!over) return;

    const leadId = active.id as string;
    const newStage = over.id as string;
    const lead = leads.find((l) => l.id === leadId);
    if (!lead || lead.pipeline_stage === newStage) return;

    const oldStage = lead.pipeline_stage;

    // Optimistic update
    setLeads((prev) => prev.map((l) => (l.id === leadId ? { ...l, pipeline_stage: newStage } : l)));

    const { error } = await supabase
      .from('leads')
      .update({ pipeline_stage: newStage })
      .eq('id', leadId);

    if (error) {
      // Revert on failure
      setLeads((prev) => prev.map((l) => (l.id === leadId ? { ...l, pipeline_stage: oldStage } : l)));
      setCardError(leadId, 'Failed to save. Try again.');
    }
  }

  async function handleSoldAmountChange(leadId: string, amount: number | null) {
    const lead = leads.find((l) => l.id === leadId);
    if (!lead) return;
    const oldAmount = lead.sold_amount;

    // Optimistic update
    setLeads((prev) => prev.map((l) => (l.id === leadId ? { ...l, sold_amount: amount } : l)));

    const { error } = await supabase
      .from('leads')
      .update({ sold_amount: amount })
      .eq('id', leadId);

    if (error) {
      setLeads((prev) => prev.map((l) => (l.id === leadId ? { ...l, sold_amount: oldAmount } : l)));
      setCardError(leadId, 'Failed to save amount. Try again.');
    }
  }

  function handleLogout() {
    clearAdminAuth();
    router.replace('/pipeline/login');
  }

  const fullName = (lead: Lead) =>
    [lead.first_name, lead.last_name].filter(Boolean).join(' ') || 'Unknown';

  const appointmentStr = (lead: Lead) =>
    lead.appointment_at
      ? new Date(lead.appointment_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) +
        ', ' +
        new Date(lead.appointment_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
      : null;

  return (
    <div className="bg-background min-h-screen flex flex-col font-body text-body text-on-surface">
      {/* Top bar */}
      <header className="bg-deep-forest-bg px-xl py-md flex items-center justify-between sticky top-0 z-20 shadow-md">
        <h1 className="text-heading font-heading text-canvas-white">Pipeline</h1>
        <button
          onClick={handleLogout}
          className="flex items-center gap-xs text-subtle-sage hover:text-canvas-white text-label font-label transition-colors"
        >
          <span
            className="material-symbols-outlined text-[18px]"
            style={{ fontVariationSettings: "'FILL' 0, 'wght' 300" }}
          >
            logout
          </span>
          Logout
        </button>
      </header>

      {/* Board */}
      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-md text-secondary">
          <span
            className="material-symbols-outlined text-[48px] text-muted-ash"
            style={{ animation: 'spin 1s linear infinite' }}
          >
            progress_activity
          </span>
          <p className="text-label font-label">Loading leads…</p>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={pointerWithin}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-section overflow-x-auto px-xl py-xl pb-3xl items-start">
            {STAGES.map((stage) => (
              <KanbanColumn
                key={stage.id}
                stage={stage}
                leads={leads.filter((l) => l.pipeline_stage === stage.id)}
                cardErrors={cardErrors}
                onSoldAmountChange={handleSoldAmountChange}
              />
            ))}
          </div>

          {/* Drag overlay — ghost card following the cursor */}
          <DragOverlay dropAnimation={null} >
            {activeDragLead ? (
              <div className="bg-canvas-white rounded-xl p-card-padding shadow-2xl border border-outline-gray/30 w-[300px] rotate-2 opacity-95 cursor-grabbing">
                <div className="flex justify-between items-start mb-md">
                  <h4 className="text-body font-heading font-bold text-text-black">
                    {fullName(activeDragLead)}
                  </h4>
                  {activeDragLead.revenue_range && (
                    <span className="bg-stone-beige text-text-black text-[10px] font-label px-sm py-[2px] rounded-full shrink-0 ml-sm">
                      {activeDragLead.revenue_range}
                    </span>
                  )}
                </div>
                <div className="flex flex-col gap-xs mb-md">
                  {activeDragLead.phone && (
                    <p className="text-secondary text-label font-body flex items-center gap-xs">
                      <span className="material-symbols-outlined text-[14px]">phone</span>
                      {activeDragLead.phone}
                    </p>
                  )}
                  {activeDragLead.email && (
                    <p className="text-secondary text-label font-body flex items-center gap-xs">
                      <span className="material-symbols-outlined text-[14px]">mail</span>
                      {activeDragLead.email}
                    </p>
                  )}
                </div>
                <div className="pt-sm border-t border-outline-gray/30">
                  {appointmentStr(activeDragLead) ? (
                    <div className="flex items-center gap-xs text-primary">
                      <span className="material-symbols-outlined text-[14px]">event</span>
                      <span className="text-[11px] font-body font-bold">
                        {appointmentStr(activeDragLead)}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-xs text-subtle-sage">
                      <span className="material-symbols-outlined text-[14px]">calendar_clock</span>
                      <span className="text-[11px] font-body">No appt set</span>
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      {/* Availability Blocker — below Kanban */}
      {!loading && (
        <AvailabilityGrid
          blockedSlots={blockedSlots}
          onToggle={handleToggleSlot}
          saveError={gridSaveError}
        />
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

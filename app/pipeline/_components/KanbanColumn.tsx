'use client';

import { useDroppable } from '@dnd-kit/core';
import LeadCard, { Lead } from './LeadCard';

type Stage = { id: string; label: string };

type Props = {
  stage: Stage;
  leads: Lead[];
  cardErrors: Record<string, string>;
  onSoldAmountChange: (leadId: string, amount: number | null) => void;
};

export default function KanbanColumn({ stage, leads, cardErrors, onSoldAmountChange }: Props) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.id });

  const badgeBg = stage.id === 'appointment' ? 'bg-mint-accent' : 'bg-outline-gray';

  return (
    <div
      ref={setNodeRef}
      className={`min-w-[300px] w-[300px] flex flex-col gap-md bg-surface-container-low rounded-xl p-md transition-all ${
        isOver ? 'ring-2 ring-primary ring-offset-2 bg-primary-container/20' : ''
      }`}
    >
      {/* Column header */}
      <div className="flex justify-between items-center px-xs py-sm border-b border-outline-gray">
        <h3 className="text-subheading font-heading text-text-black">{stage.label}</h3>
        <span
          className={`${badgeBg} text-text-black text-caption font-label px-sm py-[2px] rounded-full min-w-[22px] text-center`}
        >
          {leads.length}
        </span>
      </div>

      {/* Cards */}
      <div className="flex flex-col gap-md mt-sm min-h-[80px]">
        {leads.length === 0 ? (
          <div className="border-2 border-dashed border-outline-gray/50 rounded-xl p-xl flex flex-col items-center justify-center text-center opacity-50">
            <span className="material-symbols-outlined text-[32px] text-secondary mb-sm">
              inventory_2
            </span>
            <p className="text-label font-body text-secondary">Drop leads here</p>
          </div>
        ) : (
          leads.map((lead) => (
            <LeadCard
              key={lead.id}
              lead={lead}
              isSoldColumn={stage.id === 'sold'}
              error={cardErrors[lead.id]}
              onSoldAmountChange={onSoldAmountChange}
            />
          ))
        )}
      </div>
    </div>
  );
}

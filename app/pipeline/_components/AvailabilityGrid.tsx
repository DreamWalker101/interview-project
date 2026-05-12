'use client';

import { useState, useMemo } from 'react';
import { startOfWeek, addDays, addWeeks, set, format } from 'date-fns';
import { toZonedTime, fromZonedTime } from 'date-fns-tz';
import { BOOKING_TZ } from '@/lib/constants';

const TIME_SLOTS = Array.from({ length: 26 }, (_, i) => {
  const totalMinutes = 8 * 60 + i * 30;
  return { hours: Math.floor(totalMinutes / 60), minutes: totalMinutes % 60 };
});

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

type Props = {
  blockedSlots: string[];
  onToggle: (slotIso: string) => void;
  saveError: string | null;
};

function formatChipLabel(hours: number, minutes: number): string {
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const h = hours % 12 === 0 ? 12 : hours % 12;
  const m = minutes.toString().padStart(2, '0');
  return `${h}:${m} ${ampm}`;
}

export default function AvailabilityGrid({ blockedSlots, onToggle, saveError }: Props) {
  const [weekOffset, setWeekOffset] = useState(0);
  const blockedSet = useMemo(() => new Set(blockedSlots), [blockedSlots]);

  const weekDays = useMemo(() => {
    const nowInTZ = toZonedTime(new Date(), BOOKING_TZ);
    const baseStart = startOfWeek(nowInTZ, { weekStartsOn: 1 });
    const weekStart = addWeeks(baseStart, weekOffset);
    return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  }, [weekOffset]);

  const weekLabel = useMemo(() => {
    const start = weekDays[0];
    const end = weekDays[6];
    if (format(start, 'MMM') === format(end, 'MMM')) {
      return `${format(start, 'MMM d')} – ${format(end, 'd, yyyy')}`;
    }
    return `${format(start, 'MMM d')} – ${format(end, 'MMM d, yyyy')}`;
  }, [weekDays]);

  function getSlotISO(day: Date, hours: number, minutes: number): string {
    const slotInTZ = set(day, { hours, minutes, seconds: 0, milliseconds: 0 });
    return fromZonedTime(slotInTZ, BOOKING_TZ).toISOString();
  }

  return (
    <section className="px-xl pb-3xl">
      <div className="bg-graphite-inset rounded-[24px] p-section text-canvas-white shadow-xl">

        {/* Header row */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-section border-b border-canvas-white/10 pb-md gap-md">
          <div>
            <h2 className="text-heading font-heading text-canvas-white flex items-center gap-sm">
              <span className="material-symbols-outlined">schedule</span>
              Manage Availability
            </h2>
            <p className="text-subtle-sage text-body font-body mt-xs">
              Click any slot to block or unblock it. Blocked slots won&apos;t appear on the booking calendar.
            </p>
          </div>

          {/* Week navigator */}
          <div className="flex items-center gap-sm bg-canvas-white/10 rounded-xl px-md py-sm shrink-0">
            <button
              onClick={() => setWeekOffset((o) => o - 1)}
              disabled={weekOffset <= 0}
              aria-label="Previous week"
              className="p-1 rounded-lg hover:bg-canvas-white/10 transition-colors disabled:opacity-25 disabled:cursor-not-allowed"
            >
              <svg className="w-4 h-4 text-canvas-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <span className="text-label font-label text-canvas-white w-48 text-center select-none">
              {weekLabel}
            </span>
            <button
              onClick={() => setWeekOffset((o) => o + 1)}
              aria-label="Next week"
              className="p-1 rounded-lg hover:bg-canvas-white/10 transition-colors"
            >
              <svg className="w-4 h-4 text-canvas-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>
        </div>

        {saveError && (
          <div className="flex items-center gap-xs bg-red-500/20 border border-red-400/40 text-red-300 rounded-xl px-md py-sm text-label font-label mb-md">
            <span className="material-symbols-outlined text-[15px]" style={{ fontVariationSettings: "'FILL' 1" }}>error</span>
            {saveError}
          </div>
        )}

        {/* Per-day rows */}
        <div className="flex flex-col gap-sm">
          {weekDays.map((day, i) => {
            const slots = TIME_SLOTS.map(({ hours, minutes }) => ({
              hours,
              minutes,
              iso: getSlotISO(day, hours, minutes),
              label: formatChipLabel(hours, minutes),
            }));
            const blockedCount = slots.filter((s) => blockedSet.has(s.iso)).length;

            return (
              <div key={i} className="bg-canvas-white/5 rounded-2xl px-md py-md">
                {/* Day label row */}
                <div className="flex items-center justify-between mb-sm">
                  <div className="flex items-center gap-sm">
                    <span className="text-canvas-white font-bold text-sm w-9 shrink-0">
                      {DAY_LABELS[i]}
                    </span>
                    <span className="text-subtle-sage text-label font-label">
                      {format(day, 'MMM d')}
                    </span>
                  </div>
                  <span className="text-[11px] text-subtle-sage font-label shrink-0">
                    {blockedCount === 0
                      ? 'All available'
                      : blockedCount === slots.length
                        ? 'Fully blocked'
                        : `${blockedCount} of ${slots.length} blocked`}
                  </span>
                </div>

                {/* Slot chips */}
                <div className="flex flex-wrap gap-xs">
                  {slots.map((slot) => {
                    const isBlocked = blockedSet.has(slot.iso);
                    return (
                      <button
                        key={slot.iso}
                        type="button"
                        onClick={() => onToggle(slot.iso)}
                        className={`px-sm py-[3px] rounded-lg text-[11px] font-medium border transition-colors ${
                          isBlocked
                            ? 'bg-red-500/20 border-red-400/40 text-red-300 hover:bg-red-500/30'
                            : 'bg-mint-accent/10 border-mint-accent/25 text-mint-accent hover:bg-mint-accent/20'
                        }`}
                      >
                        {slot.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}

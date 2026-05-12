'use client';

import { useMemo } from 'react';
import { startOfWeek, addDays, set, format } from 'date-fns';
import { toZonedTime, fromZonedTime } from 'date-fns-tz';
import { BOOKING_TZ } from '@/lib/constants';

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const TIME_SLOTS = Array.from({ length: 26 }, (_, i) => {
  const totalMinutes = 8 * 60 + i * 30;
  return { hours: Math.floor(totalMinutes / 60), minutes: totalMinutes % 60 };
});

type Props = {
  blockedSlots: string[];
  onToggle: (slotIso: string) => void;
  saveError: string | null;
};

export default function AvailabilityGrid({ blockedSlots, onToggle, saveError }: Props) {
  const blockedSet = useMemo(() => new Set(blockedSlots), [blockedSlots]);

  const weekDays = useMemo(() => {
    const nowInTZ = toZonedTime(new Date(), BOOKING_TZ);
    const weekStart = startOfWeek(nowInTZ, { weekStartsOn: 1 });
    return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  }, []);

  function getSlotISO(day: Date, hours: number, minutes: number): string {
    const slotInTZ = set(day, { hours, minutes, seconds: 0, milliseconds: 0 });
    return fromZonedTime(slotInTZ, BOOKING_TZ).toISOString();
  }

  return (
    <section className="px-xl pb-3xl">
      <div className="bg-graphite-inset rounded-[24px] p-section text-canvas-white shadow-xl">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-section border-b border-outline-variant/20 pb-md gap-md">
          <div>
            <h2 className="text-heading font-heading text-canvas-white flex items-center gap-sm">
              <span className="material-symbols-outlined">schedule</span>
              Manage Availability
            </h2>
            <p className="text-subtle-sage text-body font-body mt-xs">
              Click a slot to block or unblock it. Blocked slots won&apos;t appear on the booking calendar.
            </p>
          </div>
          {saveError && (
            <div className="flex items-center gap-xs bg-error/20 border border-error/50 text-error rounded-xl px-md py-sm text-label font-label">
              <span
                className="material-symbols-outlined text-[16px]"
                style={{ fontVariationSettings: "'FILL' 1, 'wght' 400" }}
              >
                error
              </span>
              {saveError}
            </div>
          )}
        </div>

        {/* Grid */}
        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            {/* Days header */}
            <div className="grid grid-cols-8 gap-xs mb-sm">
              <div />
              {weekDays.map((day, i) => (
                <div key={i} className="text-center py-sm">
                  <div className="text-subtle-sage text-label font-label">{DAY_LABELS[i]}</div>
                  <div className="text-subtle-sage text-[10px] opacity-60">{format(day, 'M/d')}</div>
                </div>
              ))}
            </div>

            {/* Time rows */}
            <div className="flex flex-col gap-xs">
              {TIME_SLOTS.map(({ hours, minutes }) => {
                const label = format(set(new Date(2000, 0, 1, hours, minutes), {}), 'h:mm a');
                return (
                  <div key={`${hours}-${minutes}`} className="grid grid-cols-8 gap-xs items-center">
                    <div className="text-right pr-md text-subtle-sage text-caption font-label whitespace-nowrap">
                      {label}
                    </div>
                    {weekDays.map((day, di) => {
                      const iso = getSlotISO(day, hours, minutes);
                      const isBlocked = blockedSet.has(iso);
                      return (
                        <button
                          key={di}
                          type="button"
                          onClick={() => onToggle(iso)}
                          className={`h-10 rounded-md border flex items-center justify-center transition-colors ${
                            isBlocked
                              ? 'bg-error/20 border-error/50 text-error/80 hover:bg-error/30'
                              : 'bg-canvas-white/10 border-outline-variant/20 text-mint-accent hover:bg-canvas-white/20'
                          }`}
                        >
                          <span className="material-symbols-outlined text-[16px]">
                            {isBlocked ? 'close' : 'check'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

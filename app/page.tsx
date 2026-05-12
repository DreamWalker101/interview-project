"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { BOOKING_TZ } from "@/lib/constants";
import {
  toZonedTime,
  fromZonedTime,
  format as formatTZ,
} from "date-fns-tz";
import {
  addDays,
  addMinutes,
  startOfDay,
  isSameDay,
  format,
  startOfMonth,
  getDay,
  getDaysInMonth,
  addMonths,
  isSameMonth,
} from "date-fns";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  notes: string;
  employeeRange: string;
  revenueRange: string;
  appointmentAt: Date | null;
}

const EMPLOYEE_OPTIONS = [
  "1–5 employees",
  "6–15 employees",
  "16–30 employees",
  "31–100 employees",
  "100+ employees",
];

const REVENUE_OPTIONS = [
  { label: "$0 – $200,000", value: "$0-$200K" },
  { label: "$200,000 – $500,000", value: "$200K-$500K" },
  { label: "$500,000 – $1,000,000", value: "$500K-$1M" },
  { label: "$1,000,000+", value: "$1M+" },
];

// ---------------------------------------------------------------------------
// Calendar helpers
// ---------------------------------------------------------------------------

function getTodayInTZ(tz: string): Date {
  return startOfDay(toZonedTime(new Date(), tz));
}

function getSlotsForDay(day: Date): Date[] {
  // 26 slots: 8:00 AM through 8:30 PM (30-min increments)
  return Array.from({ length: 26 }, (_, i) => addMinutes(day, 8 * 60 + i * 30));
}

function slotToUTCISO(slot: Date, tz: string): string {
  return fromZonedTime(slot, tz).toISOString();
}

function formatSlotTime(slot: Date): string {
  const h = slot.getHours();
  const m = slot.getMinutes();
  const ampm = h >= 12 ? "PM" : "AM";
  const hour = h % 12 === 0 ? 12 : h % 12;
  const min = m.toString().padStart(2, "0");
  return `${hour}:${min} ${ampm}`;
}

function formatAppointment(date: Date, tz: string): string {
  return formatTZ(fromZonedTime(date, tz), "EEEE, MMMM d 'at' h:mm a zzz", {
    timeZone: tz,
  });
}

// ---------------------------------------------------------------------------
// Progress Bar
// ---------------------------------------------------------------------------

function ProgressBar({ step, total }: { step: number; total: number }) {
  return (
    <div className="flex justify-between items-center mb-md px-md">
      <span className="text-label font-label text-muted-ash">
        Step {step} of {total}
      </span>
      <div className="flex gap-xs">
        {Array.from({ length: total }, (_, i) => (
          <div
            key={i}
            className={`h-1 w-8 rounded-full transition-colors duration-300 ${
              i < step ? "bg-mint-accent" : "bg-outline-gray/30"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 1 — Contact Info
// ---------------------------------------------------------------------------

interface StepProps {
  data: FormData;
  onChange: (updates: Partial<FormData>) => void;
  onNext: () => void;
  onBack?: () => void;
  errors: Record<string, string>;
}

function Step1({ data, onChange, onNext, errors }: StepProps) {
  return (
    <div className="flex flex-col gap-lg">
      <div>
        <h1 className="text-heading-lg font-heading-lg text-text-black mb-xs">
          Contact Information
        </h1>
        <p className="text-body font-body text-secondary">
          Let&apos;s start with the basics to get you set up.
        </p>
      </div>

      <div className="flex flex-col gap-lg">
        <div className="flex flex-col sm:flex-row gap-lg">
          <div className="flex flex-col gap-gap-element w-full">
            <label className="text-label font-label text-text-black" htmlFor="firstName">
              First Name <span className="text-red-500">*</span>
            </label>
            <input
              id="firstName"
              type="text"
              value={data.firstName}
              onChange={(e) => onChange({ firstName: e.target.value })}
              placeholder="Jane"
              className={`w-full bg-transparent border rounded-full px-lg py-md text-body font-body focus:outline-none focus:ring-1 transition-colors placeholder:text-muted-ash ${
                errors.firstName
                  ? "border-red-400 focus:border-red-400 focus:ring-red-400"
                  : "border-outline-gray focus:border-graphite-inset focus:ring-graphite-inset"
              }`}
            />
            {errors.firstName && (
              <span className="text-xs text-red-500">{errors.firstName}</span>
            )}
          </div>
          <div className="flex flex-col gap-gap-element w-full">
            <label className="text-label font-label text-text-black" htmlFor="lastName">
              Last Name <span className="text-red-500">*</span>
            </label>
            <input
              id="lastName"
              type="text"
              value={data.lastName}
              onChange={(e) => onChange({ lastName: e.target.value })}
              placeholder="Doe"
              className={`w-full bg-transparent border rounded-full px-lg py-md text-body font-body focus:outline-none focus:ring-1 transition-colors placeholder:text-muted-ash ${
                errors.lastName
                  ? "border-red-400 focus:border-red-400 focus:ring-red-400"
                  : "border-outline-gray focus:border-graphite-inset focus:ring-graphite-inset"
              }`}
            />
            {errors.lastName && (
              <span className="text-xs text-red-500">{errors.lastName}</span>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-gap-element">
          <label className="text-label font-label text-text-black" htmlFor="email">
            Email Address <span className="text-red-500">*</span>
          </label>
          <input
            id="email"
            type="email"
            value={data.email}
            onChange={(e) => onChange({ email: e.target.value })}
            placeholder="jane@company.com"
            className={`w-full bg-transparent border rounded-full px-lg py-md text-body font-body focus:outline-none focus:ring-1 transition-colors placeholder:text-muted-ash ${
              errors.email
                ? "border-red-400 focus:border-red-400 focus:ring-red-400"
                : "border-outline-gray focus:border-graphite-inset focus:ring-graphite-inset"
            }`}
          />
          {errors.email && (
            <span className="text-xs text-red-500">{errors.email}</span>
          )}
        </div>

        <div className="flex flex-col gap-gap-element">
          <label className="text-label font-label text-text-black" htmlFor="phone">
            Phone Number <span className="text-red-500">*</span>
          </label>
          <input
            id="phone"
            type="tel"
            value={data.phone}
            onChange={(e) => onChange({ phone: e.target.value })}
            placeholder="+1 (555) 000-0000"
            className={`w-full bg-transparent border rounded-full px-lg py-md text-body font-body focus:outline-none focus:ring-1 transition-colors placeholder:text-muted-ash ${
              errors.phone
                ? "border-red-400 focus:border-red-400 focus:ring-red-400"
                : "border-outline-gray focus:border-graphite-inset focus:ring-graphite-inset"
            }`}
          />
          {errors.phone && (
            <span className="text-xs text-red-500">{errors.phone}</span>
          )}
        </div>

        <div className="flex flex-col gap-gap-element">
          <label className="text-label font-label text-text-black" htmlFor="notes">
            Additional Notes{" "}
            <span className="text-muted-ash font-normal">(optional)</span>
          </label>
          <textarea
            id="notes"
            value={data.notes}
            onChange={(e) => onChange({ notes: e.target.value })}
            placeholder="Anything else you'd like us to know?"
            rows={3}
            className="w-full bg-transparent border border-outline-gray rounded-xl px-lg py-md text-body font-body focus:outline-none focus:border-graphite-inset focus:ring-1 focus:ring-graphite-inset transition-colors resize-none placeholder:text-muted-ash"
          />
        </div>
      </div>

      <div className="flex justify-end pt-xl border-t border-outline-gray/30">
        <button
          onClick={onNext}
          className="bg-mint-accent text-text-black text-label font-label rounded-full px-xl py-md hover:opacity-90 transition-opacity flex items-center gap-sm"
        >
          Next Step
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 2 — Employee Range
// ---------------------------------------------------------------------------

function Step2({ data, onChange, onNext, onBack, errors }: StepProps) {
  return (
    <div className="flex flex-col gap-lg">
      <div>
        <h1 className="text-heading-lg font-heading-lg text-text-black mb-xs">
          How many employees do you have?
        </h1>
        <p className="text-body font-body text-secondary">
          Select the range that best describes your team.
        </p>
      </div>

      <div className="flex flex-col gap-sm">
        {EMPLOYEE_OPTIONS.map((option) => {
          const selected = data.employeeRange === option;
          return (
            <button
              key={option}
              onClick={() => onChange({ employeeRange: option })}
              className={`w-full text-left px-lg py-md rounded-xl border transition-all duration-150 text-body font-body ${
                selected
                  ? "border-graphite-inset bg-graphite-inset text-canvas-white"
                  : "border-outline-gray bg-canvas-white text-text-black hover:border-graphite-inset/40 hover:bg-stone-beige/40"
              }`}
            >
              <div className="flex items-center gap-sm">
                <div
                  className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
                    selected ? "border-mint-accent bg-mint-accent" : "border-outline-gray"
                  }`}
                >
                  {selected && <div className="w-2 h-2 rounded-full bg-graphite-inset" />}
                </div>
                {option}
              </div>
            </button>
          );
        })}
        {errors.employeeRange && (
          <span className="text-xs text-red-500">{errors.employeeRange}</span>
        )}
      </div>

      <div className="flex justify-between pt-xl border-t border-outline-gray/30">
        <button
          onClick={onBack}
          className="text-body font-body text-secondary border border-outline-gray rounded-full px-xl py-md hover:bg-stone-beige/50 transition-colors"
        >
          Back
        </button>
        <button
          onClick={onNext}
          className="bg-mint-accent text-text-black text-label font-label rounded-full px-xl py-md hover:opacity-90 transition-opacity flex items-center gap-sm"
        >
          Next Step
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 3 — Revenue Range
// ---------------------------------------------------------------------------

function Step3({ data, onChange, onNext, onBack, errors }: StepProps) {
  return (
    <div className="flex flex-col gap-lg">
      <div>
        <h1 className="text-heading-lg font-heading-lg text-text-black mb-xs">
          What is your company&apos;s annual revenue?
        </h1>
        <p className="text-body font-body text-secondary">
          Select the range that best fits your business.
        </p>
      </div>

      <div className="flex flex-col gap-sm">
        {REVENUE_OPTIONS.map((option) => {
          const selected = data.revenueRange === option.value;
          return (
            <button
              key={option.value}
              onClick={() => onChange({ revenueRange: option.value })}
              className={`w-full text-left px-lg py-md rounded-xl border transition-all duration-150 text-body font-body ${
                selected
                  ? "border-graphite-inset bg-graphite-inset text-canvas-white"
                  : "border-outline-gray bg-canvas-white text-text-black hover:border-graphite-inset/40 hover:bg-stone-beige/40"
              }`}
            >
              <div className="flex items-center gap-sm">
                <div
                  className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
                    selected ? "border-mint-accent bg-mint-accent" : "border-outline-gray"
                  }`}
                >
                  {selected && <div className="w-2 h-2 rounded-full bg-graphite-inset" />}
                </div>
                <span>{option.label}</span>
              </div>
            </button>
          );
        })}
        {errors.revenueRange && (
          <span className="text-xs text-red-500">{errors.revenueRange}</span>
        )}
      </div>

      <div className="flex justify-between pt-xl border-t border-outline-gray/30">
        <button
          onClick={onBack}
          className="text-body font-body text-secondary border border-outline-gray rounded-full px-xl py-md hover:bg-stone-beige/50 transition-colors"
        >
          Back
        </button>
        <button
          onClick={onNext}
          className="bg-mint-accent text-text-black text-label font-label rounded-full px-xl py-md hover:opacity-90 transition-opacity flex items-center gap-sm"
        >
          Next Step
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 4 — Calendar Booking (3-column layout)
// ---------------------------------------------------------------------------

function Step4({
  data,
  onChange,
  onNext,
  onBack,
}: {
  data: FormData;
  onChange: (updates: Partial<FormData>) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const today = getTodayInTZ(BOOKING_TZ);
  const availableDays = Array.from({ length: 5 }, (_, i) => addDays(today, i));

  const [calendarMonth, setCalendarMonth] = useState<Date>(() => startOfMonth(today));
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [blockedSlots, setBlockedSlots] = useState<Set<string>>(new Set());
  const [bookedSlots, setBookedSlots] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [skipped, setSkipped] = useState(false);

  const fetchCalendarData = useCallback(async () => {
    setLoading(true);
    try {
      const [configRes, leadsRes] = await Promise.all([
        supabase
          .from("leads")
          .select("blocked_slots")
          .eq("id", "00000000-0000-0000-0000-000000000001")
          .single(),
        supabase
          .from("leads")
          .select("appointment_at")
          .eq("row_type", "lead")
          .not("appointment_at", "is", null),
      ]);

      const blocked: string[] = configRes.data?.blocked_slots ?? [];
      const booked: string[] = ((leadsRes.data ?? []) as { appointment_at: string }[])
        .map((r) => r.appointment_at)
        .filter(Boolean);

      setBlockedSlots(new Set(blocked));
      setBookedSlots(new Set(booked));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCalendarData();
  }, [fetchCalendarData]);

  // Restore selected date from existing appointmentAt on mount (e.g. after Back)
  useEffect(() => {
    if (data.appointmentAt && !selectedDate) {
      const zonedDate = toZonedTime(data.appointmentAt, BOOKING_TZ);
      const match = availableDays.find((d) => isSameDay(d, zonedDate));
      if (match) setSelectedDate(match);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isSlotUnavailable = (slot: Date): boolean => {
    const iso = slotToUTCISO(slot, BOOKING_TZ);
    return blockedSlots.has(iso) || bookedSlots.has(iso);
  };

  // Find matching "properly zoned" Date from availableDays by (year, month, day)
  const findAvailableDay = (year: number, month: number, day: number): Date | null =>
    availableDays.find(
      (d) => d.getFullYear() === year && d.getMonth() === month && d.getDate() === day
    ) ?? null;

  const isDayAvailable = (year: number, month: number, day: number): boolean => {
    const d = findAvailableDay(year, month, day);
    if (!d) return false;
    return getSlotsForDay(d).some((s) => !isSlotUnavailable(s));
  };

  // Build 42-cell calendar grid (6 rows × 7 cols)
  const firstOfMonth = startOfMonth(calendarMonth);
  const daysInMonth = getDaysInMonth(calendarMonth);
  const startOffset = getDay(firstOfMonth); // 0=Sun
  const yr = calendarMonth.getFullYear();
  const mo = calendarMonth.getMonth();

  const prevMonth = addMonths(firstOfMonth, -1);
  const prevMonthDays = getDaysInMonth(prevMonth);
  const nextMonth = addMonths(firstOfMonth, 1);

  type GridCell = { day: number; year: number; month: number; inCurrentMonth: boolean };
  const grid: GridCell[] = [];

  for (let i = startOffset - 1; i >= 0; i--) {
    grid.push({ day: prevMonthDays - i, year: prevMonth.getFullYear(), month: prevMonth.getMonth(), inCurrentMonth: false });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    grid.push({ day: d, year: yr, month: mo, inCurrentMonth: true });
  }
  let nextDay = 1;
  while (grid.length < 42) {
    grid.push({ day: nextDay++, year: nextMonth.getFullYear(), month: nextMonth.getMonth(), inCurrentMonth: false });
  }

  const slots = selectedDate ? getSlotsForDay(selectedDate) : [];
  const availableSlots = slots.filter((s) => !isSlotUnavailable(s));

  const isSlotSelected = (slot: Date): boolean => {
    if (!data.appointmentAt) return false;
    return slotToUTCISO(slot, BOOKING_TZ) === data.appointmentAt.toISOString();
  };

  const handleDateSelect = (year: number, month: number, day: number) => {
    const zonedDay = findAvailableDay(year, month, day);
    if (!zonedDay) return;
    setSelectedDate(zonedDay);
    onChange({ appointmentAt: null });
    setSkipped(false);
  };

  const handleSlotSelect = (slot: Date) => {
    onChange({ appointmentAt: fromZonedTime(slot, BOOKING_TZ) });
    setSkipped(false);
  };

  const handleSkip = () => {
    onChange({ appointmentAt: null });
    setSkipped(true);
  };

  const canGoPrev = !isSameMonth(calendarMonth, today);

  return (
    <div className="flex flex-col gap-lg">
      {/* 3-column booking panel */}
      <div className="flex flex-col md:flex-row border border-outline-gray rounded-2xl overflow-hidden">

        {/* Left: Meeting info */}
        <aside className="w-full md:w-[210px] p-6 border-b md:border-b-0 md:border-r border-outline-gray shrink-0">
          {/* Brand */}
          <div className="flex items-center gap-2 mb-8">
            <div className="w-7 h-7 bg-mint-accent rounded-md shrink-0 flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-deep-forest-bg" viewBox="0 0 24 24" fill="currentColor">
                <path d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="font-semibold text-text-black text-sm tracking-tight">AigentFlow</span>
          </div>

          {/* Meeting details */}
          <p className="text-xs text-muted-ash font-medium mb-1">Meeting with our team</p>
          <h3 className="text-lg font-bold text-text-black mb-5 leading-tight">Free Consultation</h3>
          <div className="flex flex-col gap-3 text-sm text-secondary">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-muted-ash shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              <span>30 min</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-muted-ash shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <polygon points="23 7 16 12 23 17 23 7" />
                <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
              </svg>
              <span>Video Call</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-muted-ash shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" />
                <line x1="2" y1="12" x2="22" y2="12" />
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
              </svg>
              <span>Eastern Time (ET)</span>
            </div>
          </div>
        </aside>

        {/* Center: Month calendar */}
        <section className="flex-1 p-6 border-b md:border-b-0 md:border-r border-outline-gray flex flex-col">
          <h3 className="font-bold text-text-black text-sm mb-5">Select a Date</h3>

          <div className="max-w-[280px] mx-auto w-full">
            {/* Month navigation */}
            <div className="flex justify-center items-center gap-3 mb-5">
              <button
                onClick={() => setCalendarMonth((m) => addMonths(m, -1))}
                disabled={!canGoPrev}
                aria-label="Previous month"
                className="p-1.5 hover:bg-stone-beige rounded-full text-muted-ash hover:text-text-black transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} viewBox="0 0 24 24">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>
              <span className="font-medium text-sm text-text-black w-28 text-center">
                {format(calendarMonth, "MMMM yyyy")}
              </span>
              <button
                onClick={() => setCalendarMonth((m) => addMonths(m, 1))}
                aria-label="Next month"
                className="p-1.5 hover:bg-stone-beige rounded-full text-muted-ash hover:text-text-black transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} viewBox="0 0 24 24">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            </div>

            {/* Day of week headers */}
            <div className="grid grid-cols-7 gap-0.5 text-center mb-2">
              {["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map((d) => (
                <div key={d} className="text-[0.6rem] font-bold text-muted-ash tracking-wider py-1">
                  {d}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-y-0.5 text-center">
              {grid.map(({ day, year, month, inCurrentMonth }, i) => {
                if (!inCurrentMonth) {
                  return (
                    <div key={i} className="py-2 text-[0.7rem] text-outline-gray/50">
                      {day}
                    </div>
                  );
                }
                const available = isDayAvailable(year, month, day);
                const isSelected =
                  selectedDate !== null &&
                  selectedDate.getFullYear() === year &&
                  selectedDate.getMonth() === month &&
                  selectedDate.getDate() === day;

                if (!available) {
                  return (
                    <div key={i} className="py-2 text-[0.75rem] text-muted-ash/40 font-medium">
                      {day}
                    </div>
                  );
                }
                return (
                  <button
                    key={i}
                    onClick={() => handleDateSelect(year, month, day)}
                    className={`py-2 rounded-full transition-colors text-[0.75rem] font-semibold ${
                      isSelected
                        ? "bg-mint-accent text-slate-900 shadow-sm"
                        : "bg-mint-accent/20 text-slate-800 hover:bg-mint-accent/40"
                    }`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Timezone */}
          <div className="mt-auto pt-5 border-t border-outline-gray/30">
            <p className="text-[0.65rem] font-bold text-text-black mb-1.5 uppercase tracking-wide">
              Time zone
            </p>
            <div className="flex items-center gap-1.5 text-xs text-muted-ash">
              <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" />
                <line x1="2" y1="12" x2="22" y2="12" />
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
              </svg>
              <span>Eastern time — US &amp; Canada</span>
            </div>
          </div>
        </section>

        {/* Right: Time slots */}
        <aside className="w-full md:w-[200px] p-6 bg-slate-50/40">
          {!selectedDate ? (
            <p className="text-xs text-muted-ash leading-relaxed mt-2">
              ← Select a date to view available times
            </p>
          ) : loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-5 h-5 border-2 border-graphite-inset border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              <p className="text-sm font-semibold text-text-black mb-4">
                {format(selectedDate, "EEEE, MMMM d")}
              </p>
              {availableSlots.length === 0 ? (
                <p className="text-xs text-muted-ash">No available slots for this day.</p>
              ) : (
                <div className="flex flex-col gap-2 max-h-80 overflow-y-auto pr-0.5">
                  {availableSlots.map((slot, i) => {
                    const selected = isSlotSelected(slot);
                    if (selected) {
                      return (
                        <div key={i} className="flex gap-2" style={{ height: "46px" }}>
                          <div className="flex-1 flex items-center justify-center bg-graphite-inset text-canvas-white rounded text-sm font-medium border border-graphite-inset">
                            {formatSlotTime(slot)}
                          </div>
                          <button
                            onClick={onNext}
                            className="flex-1 bg-mint-accent text-slate-900 rounded text-sm font-bold border border-mint-accent hover:brightness-95 transition-all shadow-sm focus:outline-none"
                          >
                            Confirm
                          </button>
                        </div>
                      );
                    }
                    return (
                      <button
                        key={i}
                        onClick={() => handleSlotSelect(slot)}
                        className="w-full py-3 border border-outline-gray bg-canvas-white rounded text-sm font-medium text-text-black hover:border-graphite-inset/40 hover:bg-stone-beige/30 transition-colors"
                      >
                        {formatSlotTime(slot)}
                      </button>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </aside>
      </div>

      {/* Skip */}
      <div className="text-center">
        <button
          onClick={handleSkip}
          className={`text-sm underline transition-colors ${
            skipped ? "text-graphite-inset font-medium" : "text-muted-ash hover:text-secondary"
          }`}
        >
          {skipped ? "✓ Skipped — no appointment" : "Skip — I'll book later"}
        </button>
      </div>

      <div className="flex justify-between pt-xl border-t border-outline-gray/30">
        <button
          onClick={onBack}
          className="text-body font-body text-secondary border border-outline-gray rounded-full px-xl py-md hover:bg-stone-beige/50 transition-colors"
        >
          Back
        </button>
        {skipped && (
          <button
            onClick={onNext}
            className="bg-mint-accent text-text-black text-label font-label rounded-full px-xl py-md hover:opacity-90 transition-opacity flex items-center gap-sm"
          >
            Next Step
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 5 — Review & Submit
// ---------------------------------------------------------------------------

function Step5({
  data,
  onBack,
  onSubmit,
  submitting,
  submitError,
}: {
  data: FormData;
  onBack: () => void;
  onSubmit: () => void;
  submitting: boolean;
  submitError: string | null;
}) {
  const appointmentLabel = data.appointmentAt
    ? formatAppointment(toZonedTime(data.appointmentAt, BOOKING_TZ), BOOKING_TZ)
    : "No appointment booked";

  const revenueLabel =
    REVENUE_OPTIONS.find((o) => o.value === data.revenueRange)?.label ?? data.revenueRange;

  const rows = [
    { label: "Full Name", value: `${data.firstName} ${data.lastName}` },
    { label: "Email", value: data.email },
    { label: "Phone", value: data.phone },
    ...(data.notes ? [{ label: "Notes", value: data.notes }] : []),
    { label: "Team Size", value: data.employeeRange },
    { label: "Annual Revenue", value: revenueLabel },
    { label: "Appointment", value: appointmentLabel, highlight: !!data.appointmentAt },
  ];

  return (
    <div className="flex flex-col gap-lg">
      <div>
        <h1 className="text-heading-lg font-heading-lg text-text-black mb-xs">
          Review your information
        </h1>
        <p className="text-body font-body text-secondary">
          Make sure everything looks right before submitting.
        </p>
      </div>

      <div className="bg-stone-beige/40 rounded-2xl p-lg flex flex-col gap-sm border border-outline-gray/40">
        {rows.map(({ label, value, highlight }) => (
          <div key={label} className="flex flex-col sm:flex-row sm:items-start gap-xs sm:gap-lg">
            <span className="text-label font-label text-muted-ash w-32 flex-shrink-0">
              {label}
            </span>
            <span
              className={`text-body font-body ${
                highlight ? "text-shadow-green-bg font-medium" : "text-text-black"
              }`}
            >
              {value}
            </span>
          </div>
        ))}
      </div>

      {submitError && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-lg py-md text-sm text-red-700">
          {submitError}
        </div>
      )}

      <div className="flex justify-between pt-xl border-t border-outline-gray/30">
        <button
          onClick={onBack}
          disabled={submitting}
          className="text-body font-body text-secondary border border-outline-gray rounded-full px-xl py-md hover:bg-stone-beige/50 transition-colors disabled:opacity-50"
        >
          Back
        </button>
        <button
          onClick={onSubmit}
          disabled={submitting}
          className="bg-primary text-canvas-white text-label font-label rounded-full px-xl py-md hover:opacity-90 transition-opacity flex items-center gap-sm disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {submitting ? (
            <>
              <div className="w-4 h-4 border-2 border-canvas-white border-t-transparent rounded-full animate-spin" />
              Submitting…
            </>
          ) : (
            <>
              Submit
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Success Screen
// ---------------------------------------------------------------------------

function SuccessScreen({ appointmentAt }: { appointmentAt: Date | null }) {
  const apptText = appointmentAt
    ? `Your meeting is scheduled for ${formatAppointment(toZonedTime(appointmentAt, BOOKING_TZ), BOOKING_TZ)}.`
    : "";

  return (
    <div className="flex flex-col items-center text-center gap-lg py-xl">
      <div className="w-20 h-20 rounded-full bg-mint-accent flex items-center justify-center shadow-card">
        <svg
          className="w-10 h-10 text-deep-forest-bg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <div>
        <h1 className="text-heading-lg font-heading-lg text-text-black mb-xs">
          You&apos;re all set!
        </h1>
        <p className="text-body font-body text-secondary max-w-sm mx-auto">
          We&apos;ve received your information.{apptText && ` ${apptText}`} We&apos;ll be
          in touch soon.
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

function validateStep1(data: FormData): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!data.firstName.trim()) errors.firstName = "First name is required.";
  if (!data.lastName.trim()) errors.lastName = "Last name is required.";
  if (!data.email.trim()) {
    errors.email = "Email is required.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.email = "Enter a valid email address.";
  }
  if (!data.phone.trim()) errors.phone = "Phone number is required.";
  return errors;
}

function validateStep2(data: FormData): Record<string, string> {
  return data.employeeRange ? {} : { employeeRange: "Please select a team size." };
}

function validateStep3(data: FormData): Record<string, string> {
  return data.revenueRange ? {} : { revenueRange: "Please select a revenue range." };
}

// ---------------------------------------------------------------------------
// Stage assignment
// ---------------------------------------------------------------------------

function deriveStage(data: FormData): string {
  if (!data.appointmentAt) return "lead";
  if (data.revenueRange === "$1M+") return "qualified";
  return "appointment";
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

const INITIAL_FORM: FormData = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  notes: "",
  employeeRange: "",
  revenueRange: "",
  appointmentAt: null,
};

export default function IntakeForm() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const updateForm = (updates: Partial<FormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
    const cleared = { ...errors };
    Object.keys(updates).forEach((k) => delete cleared[k]);
    setErrors(cleared);
  };

  const goNext = (validate?: () => Record<string, string>) => {
    if (validate) {
      const errs = validate();
      if (Object.keys(errs).length > 0) {
        setErrors(errs);
        return;
      }
    }
    setErrors({});
    setStep((s) => s + 1);
  };

  const goBack = () => {
    setErrors({});
    setStep((s) => s - 1);
  };

  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);
    setSubmitError(null);

    try {
      const { error } = await supabase.from("leads").insert({
        row_type: "lead",
        first_name: formData.firstName.trim(),
        last_name: formData.lastName.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        notes: formData.notes.trim() || null,
        employee_range: formData.employeeRange,
        revenue_range: formData.revenueRange,
        appointment_at: formData.appointmentAt?.toISOString() ?? null,
        pipeline_stage: deriveStage(formData),
      });

      if (error) throw error;
      setSubmitted(true);
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "Something went wrong. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Step 4 uses a wider card to accommodate the 3-column calendar layout
  const isCalendarStep = step === 4 && !submitted;

  return (
    <div className="min-h-screen bg-background flex flex-col font-body text-text-black antialiased selection:bg-mint-accent selection:text-text-black">
      <header className="bg-canvas-white flex justify-between items-center w-full px-xl py-md border-b border-outline-gray">
        <span className="text-heading font-heading font-bold text-text-black">
          AigentFlow
        </span>
      </header>

      <main className="flex-grow flex items-center justify-center p-xl py-3xl">
        <div
          className={`w-full bg-canvas-white rounded-3xl shadow-card-lg p-xl flex flex-col gap-section relative overflow-hidden transition-all duration-300 ${
            isCalendarStep ? "max-w-[960px]" : "max-w-[600px]"
          }`}
        >
          {submitted ? (
            <SuccessScreen appointmentAt={formData.appointmentAt} />
          ) : (
            <>
              <ProgressBar step={step} total={5} />
              {step === 1 && (
                <Step1
                  data={formData}
                  onChange={updateForm}
                  errors={errors}
                  onNext={() => goNext(() => validateStep1(formData))}
                />
              )}
              {step === 2 && (
                <Step2
                  data={formData}
                  onChange={updateForm}
                  errors={errors}
                  onNext={() => goNext(() => validateStep2(formData))}
                  onBack={goBack}
                />
              )}
              {step === 3 && (
                <Step3
                  data={formData}
                  onChange={updateForm}
                  errors={errors}
                  onNext={() => goNext(() => validateStep3(formData))}
                  onBack={goBack}
                />
              )}
              {step === 4 && (
                <Step4
                  data={formData}
                  onChange={updateForm}
                  onNext={() => goNext()}
                  onBack={goBack}
                />
              )}
              {step === 5 && (
                <Step5
                  data={formData}
                  onBack={goBack}
                  onSubmit={handleSubmit}
                  submitting={submitting}
                  submitError={submitError}
                />
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}

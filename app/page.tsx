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
  { label: "$0 – $200,000", value: "$0-$200K", premium: false },
  { label: "$200,000 – $500,000", value: "$200K-$500K", premium: false },
  { label: "$500,000 – $1,000,000", value: "$500K-$1M", premium: false },
  { label: "$1,000,000+", value: "$1M+", premium: true },
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
              className={`w-full text-left px-lg py-md rounded-xl border transition-all duration-150 ${
                option.premium
                  ? selected
                    ? "border-shadow-green-bg bg-shadow-green-bg text-canvas-white"
                    : "border-shadow-green-bg/30 bg-shadow-green-bg/5 text-text-black hover:border-shadow-green-bg/60 hover:bg-shadow-green-bg/10"
                  : selected
                    ? "border-graphite-inset bg-graphite-inset text-canvas-white"
                    : "border-outline-gray bg-canvas-white text-text-black hover:border-graphite-inset/40 hover:bg-stone-beige/40"
              }`}
            >
              <div className="flex items-center justify-between gap-sm">
                <div className="flex items-center gap-sm">
                  <div
                    className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
                      selected
                        ? "border-mint-accent bg-mint-accent"
                        : option.premium
                          ? "border-shadow-green-bg/40"
                          : "border-outline-gray"
                    }`}
                  >
                    {selected && (
                      <div
                        className={`w-2 h-2 rounded-full ${
                          option.premium ? "bg-shadow-green-bg" : "bg-graphite-inset"
                        }`}
                      />
                    )}
                  </div>
                  <span className="text-body font-body">{option.label}</span>
                </div>
                {option.premium && (
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      selected
                        ? "bg-mint-accent text-deep-forest-bg"
                        : "bg-shadow-green-bg/20 text-shadow-green-bg"
                    }`}
                  >
                    Qualified
                  </span>
                )}
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
// Step 4 — Calendar Booking
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
  const days = Array.from({ length: 5 }, (_, i) => addDays(today, i));

  const [selectedDate, setSelectedDate] = useState<Date>(today);
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

  const slots = getSlotsForDay(selectedDate);

  const isSlotUnavailable = (slot: Date): boolean => {
    const iso = slotToUTCISO(slot, BOOKING_TZ);
    return blockedSlots.has(iso) || bookedSlots.has(iso);
  };

  const isSlotSelected = (slot: Date): boolean => {
    if (!data.appointmentAt) return false;
    return slotToUTCISO(slot, BOOKING_TZ) === data.appointmentAt.toISOString();
  };

  const hasAvailableSlots = (day: Date): boolean =>
    getSlotsForDay(day).some((s) => !isSlotUnavailable(s));

  const handleDateSelect = (day: Date) => {
    setSelectedDate(day);
    onChange({ appointmentAt: null });
    setSkipped(false);
  };

  const handleSlotSelect = (slot: Date) => {
    const utcDate = fromZonedTime(slot, BOOKING_TZ);
    onChange({ appointmentAt: utcDate });
    setSkipped(false);
  };

  const handleSkip = () => {
    onChange({ appointmentAt: null });
    setSkipped(true);
  };

  const canProceed = data.appointmentAt !== null || skipped;

  return (
    <div className="flex flex-col gap-lg">
      <div>
        <h1 className="text-heading-lg font-heading-lg text-text-black mb-xs">
          Pick a date and time
        </h1>
        <p className="text-body font-body text-secondary">
          Choose from the next 5 available days, 8:00 AM – 9:00 PM (ET).
        </p>
      </div>

      {/* Date selector */}
      <div className="flex gap-sm overflow-x-auto pb-1">
        {days.map((day) => {
          const available = hasAvailableSlots(day);
          const selected = isSameDay(day, selectedDate);
          return (
            <button
              key={day.toISOString()}
              onClick={() => available && handleDateSelect(day)}
              disabled={!available}
              className={`flex-shrink-0 flex flex-col items-center px-md py-sm rounded-xl border transition-all duration-150 min-w-[80px] ${
                !available
                  ? "border-outline-gray/30 bg-stone-beige/30 text-muted-ash cursor-not-allowed opacity-50"
                  : selected
                    ? "border-graphite-inset bg-graphite-inset text-canvas-white"
                    : "border-outline-gray bg-canvas-white text-text-black hover:border-graphite-inset/40 hover:bg-stone-beige/40"
              }`}
            >
              <span className="text-xs font-medium">{format(day, "EEE")}</span>
              <span className="text-sm font-bold mt-0.5">{format(day, "d")}</span>
              <span className="text-xs mt-0.5 opacity-70">{format(day, "MMM")}</span>
            </button>
          );
        })}
      </div>

      {/* Time slots */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="w-6 h-6 border-2 border-graphite-inset border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-sm max-h-56 overflow-y-auto pr-1">
          {slots.map((slot) => {
            const unavailable = isSlotUnavailable(slot);
            const selected = isSlotSelected(slot);
            return (
              <button
                key={slot.toISOString()}
                onClick={() => !unavailable && handleSlotSelect(slot)}
                disabled={unavailable}
                className={`px-sm py-sm rounded-xl border text-xs font-medium transition-all duration-150 ${
                  unavailable
                    ? "border-outline-gray/20 bg-stone-beige/20 text-muted-ash/50 cursor-not-allowed line-through"
                    : selected
                      ? "border-graphite-inset bg-graphite-inset text-canvas-white"
                      : "border-outline-gray bg-canvas-white text-text-black hover:border-graphite-inset/40 hover:bg-stone-beige/40"
                }`}
              >
                {formatSlotTime(slot)}
              </button>
            );
          })}
        </div>
      )}

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
        <button
          onClick={onNext}
          disabled={!canProceed}
          className={`text-label font-label rounded-full px-xl py-md flex items-center gap-sm transition-all ${
            canProceed
              ? "bg-mint-accent text-text-black hover:opacity-90"
              : "bg-outline-gray/30 text-muted-ash cursor-not-allowed"
          }`}
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

  return (
    <div className="min-h-screen bg-background flex flex-col font-body text-text-black antialiased selection:bg-mint-accent selection:text-text-black">
      <header className="bg-canvas-white flex justify-between items-center w-full px-xl py-md border-b border-outline-gray">
        <span className="text-heading font-heading font-bold text-text-black">
          AigentFlow
        </span>
      </header>

      <main className="flex-grow flex items-center justify-center p-xl py-3xl">
        <div className="w-full max-w-[600px] bg-canvas-white rounded-3xl shadow-card-lg p-xl flex flex-col gap-section relative overflow-hidden">
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

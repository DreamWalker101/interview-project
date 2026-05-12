'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAdminAuth, clearAdminAuth } from '@/hooks/useAdminAuth';
import { supabase } from '@/lib/supabase';

type Lead = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  pipeline_stage: string | null;
  appointment_at: string | null;
  revenue_range: string | null;
};

const STAGE_LABELS: Record<string, string> = {
  lead: 'Lead',
  appointment: 'Appointment',
  qualified: 'Qualified',
  sold: 'Sold',
  not_interested: 'Not Interested',
};

export default function UpdatePage() {
  useAdminAuth();
  const router = useRouter();

  const [phone, setPhone] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [view, setView] = useState<'search' | 'multi' | 'detail' | 'success'>('search');
  const [results, setResults] = useState<Lead[]>([]);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [outcome, setOutcome] = useState<'sold' | 'not_interested' | null>(null);
  const [soldAmount, setSoldAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<{
    name: string;
    outcome: 'sold' | 'not_interested';
    amount: number | null;
  } | null>(null);

  function handleLogout() {
    clearAdminAuth();
    router.replace('/pipeline/login');
  }

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = phone.trim();
    if (!trimmed) return;

    setSearching(true);
    setSearchError(null);

    const { data, error } = await supabase
      .from('leads')
      .select('id, first_name, last_name, email, phone, pipeline_stage, appointment_at, revenue_range')
      .eq('row_type', 'lead')
      .eq('phone', trimmed);

    setSearching(false);

    if (error) {
      setSearchError('Search failed. Please try again.');
      return;
    }

    if (!data || data.length === 0) {
      setSearchError('No lead found with this phone number.');
      return;
    }

    if (data.length === 1) {
      goToDetail(data[0] as Lead);
    } else {
      setResults(data as Lead[]);
      setView('multi');
    }
  }

  function goToDetail(lead: Lead) {
    setSelectedLead(lead);
    setOutcome(null);
    setSoldAmount('');
    setSubmitError(null);
    setView('detail');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedLead || !outcome) return;

    const amount =
      outcome === 'sold' && soldAmount.trim() !== '' ? parseFloat(soldAmount.trim()) : null;

    if (outcome === 'sold' && soldAmount.trim() !== '' && isNaN(amount!)) {
      setSubmitError('Please enter a valid amount.');
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    const { error } = await supabase
      .from('leads')
      .update({ pipeline_stage: outcome, sold_amount: amount })
      .eq('id', selectedLead.id);

    setSubmitting(false);

    if (error) {
      setSubmitError('Update failed. Please try again.');
      return;
    }

    const name =
      [selectedLead.first_name, selectedLead.last_name].filter(Boolean).join(' ') || 'Lead';
    setSuccessData({ name, outcome, amount });
    setView('success');
  }

  function resetSearch() {
    setPhone('');
    setSearchError(null);
    setResults([]);
    setSelectedLead(null);
    setOutcome(null);
    setSoldAmount('');
    setSubmitError(null);
    setSuccessData(null);
    setView('search');
  }

  const leadName = (lead: Lead) =>
    [lead.first_name, lead.last_name].filter(Boolean).join(' ') || 'Unknown';

  const apptStr = (lead: Lead) =>
    lead.appointment_at
      ? new Date(lead.appointment_at).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        }) +
        ', ' +
        new Date(lead.appointment_at).toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
        })
      : null;

  return (
    <div className="bg-background min-h-screen flex flex-col font-body text-body text-on-surface">
      {/* Top bar */}
      <header className="bg-deep-forest-bg px-xl py-md flex items-center justify-between sticky top-0 z-20 shadow-md">
        <h1 className="text-heading font-heading text-canvas-white">Update Lead</h1>
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

      <main className="flex-1 flex flex-col items-center justify-start p-section">
        <div className="w-full max-w-[500px] mt-2xl flex flex-col gap-section">

          {/* ── Success ── */}
          {view === 'success' && successData && (
            <div className="bg-graphite-inset rounded-[24px] p-card-padding text-center flex flex-col items-center py-2xl relative overflow-hidden">
              <div
                className="absolute inset-0 opacity-20"
                style={{
                  background: 'linear-gradient(90deg, #82ff87 0%, #a3fda7 50%, #deff82 100%)',
                }}
              />
              <div className="w-16 h-16 rounded-full bg-mint-accent flex items-center justify-center text-text-black mb-lg relative z-10 shadow-[0_0_30px_rgba(163,253,167,0.3)]">
                <span className="material-symbols-outlined text-[32px]">check</span>
              </div>
              <h3 className="text-heading font-heading text-canvas-white mb-xs relative z-10">
                Lead Updated!
              </h3>
              <p className="text-body font-body text-subtle-sage mb-xl relative z-10">
                {successData.name} marked as{' '}
                {successData.outcome === 'sold'
                  ? successData.amount != null
                    ? `Sold for ${new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: 'USD',
                      }).format(successData.amount)}`
                    : 'Sold'
                  : 'Not Interested'}
                .
              </p>
              <button
                onClick={resetSearch}
                className="bg-transparent text-canvas-white border border-subtle-sage rounded-full px-lg py-sm text-label font-label font-bold hover:bg-canvas-white/10 transition-colors relative z-10 flex items-center gap-xs"
              >
                <span className="material-symbols-outlined text-[16px]">refresh</span>
                Search Another
              </button>
            </div>
          )}

          {/* ── Search card (always shown unless success) ── */}
          {view !== 'success' && (
            <div className="bg-canvas-white rounded-[24px] p-card-padding shadow-[0_4px_24px_rgba(0,0,0,0.09)]">
              <div className="mb-lg">
                <h2 className="text-heading font-heading text-text-black mb-xs">
                  Admin Update Tool
                </h2>
                <p className="text-body font-body text-secondary">
                  Search for a lead to update their status.
                </p>
              </div>
              <form onSubmit={handleSearch} className="flex flex-col gap-gap-element">
                <label className="text-label font-label text-secondary px-sm">
                  Phone Number Lookup
                </label>
                <div className="flex items-center border border-outline-gray rounded-full px-md py-sm focus-within:border-primary transition-colors">
                  <span className="material-symbols-outlined text-muted-ash mr-sm text-[18px]">
                    phone
                  </span>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      setSearchError(null);
                    }}
                    placeholder="(555) 123-4567"
                    className="bg-transparent border-none outline-none text-body font-body text-text-black w-full"
                  />
                </div>
                {searchError && (
                  <p className="text-error text-label font-label flex items-center gap-xs px-sm">
                    <span
                      className="material-symbols-outlined text-[14px]"
                      style={{ fontVariationSettings: "'FILL' 1, 'wght' 400" }}
                    >
                      error
                    </span>
                    {searchError}
                  </p>
                )}
                <button
                  type="submit"
                  disabled={searching || !phone.trim()}
                  className="w-full bg-mint-accent text-text-black rounded-full py-md text-subheading font-heading font-bold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-sm mt-sm"
                >
                  {searching ? (
                    <>
                      <span
                        className="material-symbols-outlined text-[18px]"
                        style={{ animation: 'spin 1s linear infinite' }}
                      >
                        progress_activity
                      </span>
                      Searching…
                    </>
                  ) : (
                    'Search'
                  )}
                </button>
              </form>
            </div>
          )}

          {/* ── Multi-result picker ── */}
          {view === 'multi' && (
            <div className="bg-canvas-white rounded-[24px] p-card-padding shadow-[0_4px_24px_rgba(0,0,0,0.09)]">
              <h3 className="text-subheading font-heading font-bold text-text-black mb-xs">
                Multiple Leads Found
              </h3>
              <p className="text-label font-label text-secondary mb-lg">
                Select the lead you want to update:
              </p>
              <div className="flex flex-col gap-sm">
                {results.map((lead) => (
                  <button
                    key={lead.id}
                    type="button"
                    onClick={() => goToDetail(lead)}
                    className="flex items-center gap-md p-md rounded-xl border border-outline-gray hover:border-primary hover:bg-surface-container-low transition-all text-left"
                  >
                    <div className="w-10 h-10 rounded-full bg-graphite-inset flex items-center justify-center text-canvas-white shrink-0">
                      <span className="material-symbols-outlined text-[18px]">person</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-body font-heading font-bold text-text-black">
                        {leadName(lead)}
                      </p>
                      <p className="text-label font-label text-secondary truncate">{lead.email}</p>
                    </div>
                    <span className="bg-stone-beige text-text-black text-[10px] font-label px-sm py-[2px] rounded-full shrink-0">
                      {STAGE_LABELS[lead.pipeline_stage ?? ''] ?? lead.pipeline_stage ?? '—'}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── Lead detail + status update ── */}
          {view === 'detail' && selectedLead && (
            <div className="bg-canvas-white rounded-[24px] p-card-padding shadow-[0_4px_24px_rgba(0,0,0,0.09)]">
              {/* Lead header */}
              <div className="flex items-start justify-between border-b border-outline-gray pb-lg mb-lg">
                <div className="flex items-center gap-md">
                  <div className="w-12 h-12 rounded-full bg-graphite-inset flex items-center justify-center text-canvas-white shrink-0">
                    <span className="material-symbols-outlined">person</span>
                  </div>
                  <div>
                    <h3 className="text-subheading font-heading font-bold text-text-black">
                      {leadName(selectedLead)}
                    </h3>
                    <p className="text-label font-label text-secondary">{selectedLead.email}</p>
                  </div>
                </div>
                <span className="bg-stone-beige text-text-black text-[10px] font-label px-sm py-[2px] rounded-full shrink-0 ml-sm">
                  {STAGE_LABELS[selectedLead.pipeline_stage ?? ''] ??
                    selectedLead.pipeline_stage ??
                    'Unknown'}
                </span>
              </div>

              {/* Details grid */}
              <div className="grid grid-cols-2 gap-md mb-lg">
                <div className="bg-surface-container-lowest border border-outline-gray rounded-xl p-md">
                  <p className="text-caption font-label text-secondary mb-xs uppercase tracking-wide">
                    Phone
                  </p>
                  <p className="text-body font-body text-text-black">{selectedLead.phone ?? '—'}</p>
                </div>
                <div className="bg-surface-container-lowest border border-outline-gray rounded-xl p-md">
                  <p className="text-caption font-label text-secondary mb-xs uppercase tracking-wide">
                    Appointment
                  </p>
                  <p className="text-body font-body text-text-black">
                    {apptStr(selectedLead) ?? 'None booked'}
                  </p>
                </div>
              </div>

              {/* Status selector + submit */}
              <form onSubmit={handleSubmit} className="flex flex-col gap-md">
                <div className="bg-surface rounded-xl p-md">
                  <h4 className="text-label font-label text-secondary mb-md">Update Status</h4>
                  <div className="flex gap-md mb-md">
                    <button
                      type="button"
                      onClick={() => setOutcome('sold')}
                      className={`flex-1 rounded-full py-sm text-label font-label font-bold flex items-center justify-center gap-xs border transition-all ${
                        outcome === 'sold'
                          ? 'bg-primary text-canvas-white border-primary'
                          : 'bg-canvas-white text-secondary border-outline-gray hover:border-primary hover:text-primary'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[16px]">check_circle</span>
                      Sold
                    </button>
                    <button
                      type="button"
                      onClick={() => setOutcome('not_interested')}
                      className={`flex-1 rounded-full py-sm text-label font-label font-bold flex items-center justify-center gap-xs border transition-all ${
                        outcome === 'not_interested'
                          ? 'bg-stone-beige text-text-black border-outline-gray'
                          : 'bg-canvas-white text-secondary border-outline-gray hover:bg-stone-beige/50'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[16px]">cancel</span>
                      Not Interested
                    </button>
                  </div>

                  {/* Sold amount — only when Sold selected */}
                  {outcome === 'sold' && (
                    <div className="flex flex-col gap-gap-element mt-md">
                      <label className="text-label font-label text-secondary px-sm">
                        Sold Amount ($)
                      </label>
                      <div className="flex items-center bg-canvas-white border border-outline-gray rounded-full px-md py-sm focus-within:border-primary transition-colors">
                        <span className="text-secondary font-body mr-xs">$</span>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={soldAmount}
                          onChange={(e) => setSoldAmount(e.target.value)}
                          placeholder="0.00"
                          className="bg-transparent border-none outline-none text-body font-body text-text-black w-full"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {submitError && (
                  <p className="text-error text-label font-label flex items-center gap-xs px-sm">
                    <span
                      className="material-symbols-outlined text-[14px]"
                      style={{ fontVariationSettings: "'FILL' 1, 'wght' 400" }}
                    >
                      error
                    </span>
                    {submitError}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={!outcome || submitting}
                  className="w-full bg-mint-accent text-text-black rounded-full py-md text-subheading font-heading font-bold hover:opacity-90 transition-opacity disabled:opacity-40 flex items-center justify-center gap-sm"
                >
                  {submitting ? (
                    <>
                      <span
                        className="material-symbols-outlined text-[18px]"
                        style={{ animation: 'spin 1s linear infinite' }}
                      >
                        progress_activity
                      </span>
                      Saving…
                    </>
                  ) : (
                    'Submit Update'
                  )}
                </button>
              </form>
            </div>
          )}
        </div>
      </main>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

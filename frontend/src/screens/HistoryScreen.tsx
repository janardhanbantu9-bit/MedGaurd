import React, { useEffect, useState } from 'react';
import { ArrowRight, CheckCircle2, Clock3, History, Loader2, ShieldAlert, TriangleAlert } from 'lucide-react';
import { Button } from '../components/ui';
import { getSafetyHistory } from '../services/api';

type AnalysisRow = {
  id: string;
  created_at: string;
  status: string;
  summary?: { high?: number; review?: number; safe?: number };
  findings?: unknown[];
  extracted_medications?: { name?: string }[];
  prescription_text?: string;
};

export default function HistoryScreen({ patientId, setView }: { patientId?: string; setView: (view: string) => void }) {
  const [items, setItems] = useState<AnalysisRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    if (!patientId || !/^[0-9a-f-]{36}$/i.test(patientId)) {
      setItems([]);
      setLoading(false);
      return () => { active = false; };
    }
    setLoading(true);
    getSafetyHistory(patientId)
      .then((rows) => { if (active) setItems(rows); })
      .catch((err) => { if (active) setError(err?.message || 'Could not load your history.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [patientId]);

  return (
    <section className="mx-auto max-w-5xl px-6 py-10 md:px-10 md:py-14">
      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-[#087F5B]">Your record</p>
      <div className="mb-10 flex flex-wrap items-end justify-between gap-5">
        <div>
          <h1 className="font-serif text-4xl tracking-tight text-[#17211B] md:text-5xl">Safety history</h1>
          <p className="mt-3 max-w-xl text-[#66736B]">A private log of prescriptions you’ve checked.</p>
        </div>
        <Button icon={ArrowRight} size="lg" disabled={false} onClick={() => setView('input-rx')}>Scan a Prescription</Button>
      </div>
      {loading && <div className="flex items-center gap-3 py-10 text-sm text-[#66736B]"><Loader2 className="animate-spin" size={18} />Loading your history…</div>}
      {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</p>}
      {!loading && !error && items.length === 0 && (
        <div className="rounded-3xl border border-dashed border-[#C8D7CE] bg-white/70 px-6 py-16 text-center">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-[#E8F5EF] text-[#087F5B]"><History size={24} /></div>
          <h2 className="font-serif text-2xl text-[#17211B]">No safety checks yet</h2>
          <p className="mx-auto mt-2 max-w-sm text-sm text-[#66736B]">Your completed prescription reviews will appear here.</p>
          <Button className="mt-6" disabled={false} icon={undefined} onClick={() => setView('input-rx')}>Scan a Prescription</Button>
        </div>
      )}
      <div className="space-y-3">
        {items.map((item) => {
          const counts = item.summary ?? {};
          const high = Number(counts.high ?? 0);
          const review = Number(counts.review ?? 0);
          const meds = item.extracted_medications ?? [];
          const passed = high === 0 && review === 0;
          return (
            <article key={item.id} className="rounded-2xl border border-[#DCE5DF] bg-white p-5 shadow-sm md:p-6">
              <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-xs text-[#66736B]"><Clock3 size={14} />{new Date(item.created_at).toLocaleString()}</div>
                  <p className="mt-3 font-medium text-[#17211B]">{meds.length ? meds.map((m) => m.name).filter(Boolean).join(', ') : 'Prescription check'}</p>
                  <p className="mt-1 text-sm text-[#66736B]">{meds.length} {meds.length === 1 ? 'medication' : 'medications'} checked</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {high > 0 && <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1.5 text-xs font-medium text-red-800"><ShieldAlert size={14} />{high} high risk</span>}
                  {review > 0 && <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-900"><TriangleAlert size={14} />{review} review</span>}
                  {passed && <span className="inline-flex items-center gap-1.5 rounded-full bg-[#E8F5EF] px-3 py-1.5 text-xs font-medium text-[#065F46]"><CheckCircle2 size={14} />No conflicts found</span>}
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

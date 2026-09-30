import React from 'react';
import { ArrowDownRight, ArrowRight, HeartPulse, Pill, ShieldCheck, Sparkles } from 'lucide-react';
import { Badge, Button } from '../components/ui';

const DashboardScreen = ({ patient, setView }: any) => {
  const medications = patient?.currentMeds ?? [];
  const allergies = patient?.allergies ?? [];
  const conditions = patient?.diagnoses ?? [];
  return (
    <div className="mx-auto max-w-6xl px-6 py-8 md:px-10 md:py-12">
      <section className="relative isolate mb-12 overflow-hidden rounded-[2rem] bg-[#EAF4ED] px-7 py-9 md:min-h-[340px] md:px-12 md:py-12">
        <div className="pointer-events-none absolute -right-20 -top-40 -z-10 h-[460px] w-[460px] rounded-full bg-[radial-gradient(circle,rgba(8,127,91,0.17),rgba(8,127,91,0)_68%)]" />
        <div className="grid gap-9 md:grid-cols-[1.15fr_.85fr] md:items-center">
          <div className="max-w-xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#BBD8C7] bg-white/65 px-3 py-1.5 text-xs font-medium text-[#286249]"><Sparkles size={14} /> A clearer check before your next dose</div>
            <h1 className="font-serif text-[2.8rem] leading-[1.04] tracking-tight text-[#173A2C] md:text-6xl">Medication safety,<br className="hidden md:block" /> simplified.</h1>
            <p className="mt-5 max-w-lg text-base leading-7 text-[#526B5C]">Check a new prescription against your medications, allergies and health context before you take it.</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button size="lg" icon={ArrowRight} disabled={false} onClick={() => setView('input-rx')}>Scan Prescription</Button>
              <Button variant="outline" size="lg" icon={ArrowDownRight} disabled={false} onClick={() => setView('history')}>Safety History</Button>
            </div>
          </div>
          <div className="relative hidden min-h-[230px] items-center justify-center md:flex">
            <div className="absolute right-4 top-1 h-56 w-56 rotate-6 rounded-[2.5rem] border border-white/80 bg-white/40" />
            <div className="relative w-full max-w-[330px] -rotate-2 rounded-[1.75rem] border border-white bg-white/90 p-5 shadow-[0_24px_60px_-34px_rgba(23,58,44,0.42)] transition-transform duration-500 hover:rotate-0">
              <div className="mb-5 flex items-center justify-between"><span className="text-xs font-semibold uppercase tracking-[0.16em] text-[#789083]">Your next step</span><span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#E8F5EF] text-[#087F5B]"><ShieldCheck size={17} /></span></div>
              <p className="font-serif text-2xl text-[#173A2C]">A little more peace of mind.</p>
              <div className="mt-5 flex items-center gap-3 rounded-xl bg-[#F4F8F5] p-3"><div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-[#087F5B]"><Pill size={17} /></div><div><p className="text-sm font-semibold text-[#24372D]">Review, then decide</p><p className="mt-0.5 text-xs text-[#738279]">You stay in control at every step.</p></div></div>
            </div>
          </div>
        </div>
      </section>

      <section className="mb-12">
        <div className="mb-4 flex items-end justify-between"><div><p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#087F5B]">A quick snapshot</p><h2 className="mt-2 font-serif text-3xl text-[#17211B]">My health context</h2></div><span className="hidden items-center gap-1.5 text-xs text-[#66736B] sm:flex"><HeartPulse size={14} className="text-[#087F5B]" />Private to you</span></div>
        <div className="grid grid-cols-3 gap-3 md:gap-5">
          {[[medications.length, 'Medications', 'text-[#087F5B]', 'bg-[#E8F5EF]'], [allergies.length, 'Allergies', 'text-[#A85A16]', 'bg-[#FFF3E6]'], [conditions.length, 'Conditions', 'text-[#536D83]', 'bg-[#EFF4F7]']].map(([value, label, color, bg]) => <div key={label as string} className="rounded-2xl border border-[#E0E8E2] bg-white/80 p-4 md:p-6"><div className={`mb-4 flex h-9 w-9 items-center justify-center rounded-xl ${bg}`}><span className={`text-lg font-semibold ${color}`}>{value}</span></div><p className="text-sm text-[#66736B]">{label}</p></div>)}
        </div>
      </section>

      <section className="pb-8">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3"><div><p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#087F5B]">Your list</p><h2 className="mt-2 font-serif text-3xl text-[#17211B]">My medications</h2></div><Badge variant="green">{medications.length} active</Badge></div>
        <div className="divide-y divide-[#E7ECE8] overflow-hidden rounded-2xl border border-[#E0E8E2] bg-white">
          {medications.length === 0 && <p className="p-7 text-sm text-[#66736B]">No current medications listed yet.</p>}
          {medications.map((med: any) => <div key={med.id ?? med.name} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 md:px-6"><div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F1F6F2] text-[#087F5B]"><Pill size={18} /></span><div><p className="font-medium text-[#17211B]">{med.name}</p><p className="mt-0.5 text-xs text-[#78867D]">{[med.route, med.freq ?? med.frequency].filter(Boolean).join(' · ')}</p></div></div><span className="rounded-full bg-[#F5F7F5] px-3 py-1 text-xs text-[#66736B]">{med.dose || 'Dose not listed'}</span></div>)}
        </div>
        <p className="mt-4 text-xs leading-relaxed text-[#78867D]">A new prescription is reviewed first and is not added to your current list automatically.</p>
      </section>
    </div>
  );
};

export default DashboardScreen;

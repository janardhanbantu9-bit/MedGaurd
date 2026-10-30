import React, { useState } from 'react';
import { ArrowDownRight, ArrowRight, HeartPulse, Pill, ShieldCheck, Sparkles, Plus, AlertCircle, Check, X, ShieldAlert } from 'lucide-react';
import { Badge, Button } from '../components/ui';
import { addMedicationToProfile } from '../services/api';

const DashboardScreen = ({ patient, setView, onProfileUpdated }: any) => {
  const [showAddMed, setShowAddMed] = useState(false);
  const [newMedName, setNewMedName] = useState('');
  const [newMedDose, setNewMedDose] = useState('');
  const [newMedFreq, setNewMedFreq] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [addError, setAddError] = useState('');

  const medications = patient?.currentMeds ?? [];
  const allergies = patient?.allergies ?? [];
  const conditions = patient?.diagnoses ?? [];

  const handleAddMedication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMedName.trim()) {
      setAddError('Medication name is required');
      return;
    }
    setAddError('');
    setIsSubmitting(true);
    try {
      const updatedProfile = await addMedicationToProfile({
        name: newMedName.trim(),
        dose: newMedDose.trim() || undefined,
        frequency: newMedFreq.trim() || undefined,
      });
      if (onProfileUpdated) {
        onProfileUpdated(updatedProfile);
      }
      setNewMedName('');
      setNewMedDose('');
      setNewMedFreq('');
      setShowAddMed(false);
    } catch (err) {
      setAddError(err instanceof Error ? err.message : 'Could not add medication');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-6 py-8 md:px-10 md:py-12">
      <section className="relative isolate mb-12 overflow-hidden rounded-[2rem] bg-[#EAF4ED] px-7 py-9 md:min-h-[340px] md:px-12 md:py-12">
        <div className="pointer-events-none absolute -right-20 -top-40 -z-10 h-[460px] w-[460px] rounded-full bg-[radial-gradient(circle,rgba(8,127,91,0.17),rgba(8,127,91,0)_68%)]" />
        <div className="grid gap-9 md:grid-cols-[1.15fr_.85fr] md:items-center">
          <div className="max-w-xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#BBD8C7] bg-white/65 px-3 py-1.5 text-xs font-medium text-[#286249]">
              <Sparkles size={14} /> A clearer check before your next dose
            </div>
            <h1 className="font-serif text-[2.8rem] leading-[1.04] tracking-tight text-[#173A2C] md:text-6xl">
              Medication safety,<br className="hidden md:block" /> simplified.
            </h1>
            <p className="mt-5 max-w-lg text-base leading-7 text-[#526B5C]">
              Check a new prescription against your medications, allergies, and health context before you take it.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button size="lg" icon={ArrowRight} onClick={() => setView('input-rx')}>
                Scan Prescription
              </Button>
              <Button variant="outline" size="lg" icon={ArrowDownRight} onClick={() => setView('history')}>
                Safety History
              </Button>
            </div>
          </div>
          <div className="relative hidden min-h-[230px] items-center justify-center md:flex">
            <div className="absolute right-4 top-1 h-56 w-56 rotate-6 rounded-[2.5rem] border border-white/80 bg-white/40" />
            <div className="relative w-full max-w-[330px] -rotate-2 rounded-[1.75rem] border border-white bg-white/90 p-5 shadow-[0_24px_60px_-34px_rgba(23,58,44,0.42)] transition-transform duration-500 hover:rotate-0">
              <div className="mb-5 flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[#789083]">Your next step</span>
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#E8F5EF] text-[#087F5B]">
                  <ShieldCheck size={17} />
                </span>
              </div>
              <p className="font-serif text-2xl text-[#173A2C]">A little more peace of mind.</p>
              <div className="mt-5 flex items-center gap-3 rounded-xl bg-[#F4F8F5] p-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-[#087F5B]">
                  <Pill size={17} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#24372D]">Review, then decide</p>
                  <p className="mt-0.5 text-xs text-[#738279]">You stay in control at every step.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Snapshot cards */}
      <section className="mb-12">
        <div className="mb-4 flex items-end justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#087F5B]">A quick snapshot</p>
            <h2 className="mt-2 font-serif text-3xl text-[#17211B]">My health context</h2>
          </div>
          <span className="hidden items-center gap-1.5 text-xs text-[#66736B] sm:flex">
            <HeartPulse size={14} className="text-[#087F5B]" />
            Private to you
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-5">
          <div className="rounded-2xl border border-[#E0E8E2] bg-white/80 p-4 md:p-6">
            <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-xl bg-[#E8F5EF]">
              <span className="text-lg font-semibold text-[#087F5B]">{medications.length}</span>
            </div>
            <p className="font-medium text-[#17211B]">Medications</p>
            <p className="text-xs text-[#78867D] mt-1">{medications.length > 0 ? `${medications.length} active in profile` : 'No current medications'}</p>
          </div>
          <div className="rounded-2xl border border-[#E0E8E2] bg-white/80 p-4 md:p-6">
            <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-xl bg-[#FFF3E6]">
              <span className="text-lg font-semibold text-[#A85A16]">{allergies.length}</span>
            </div>
            <p className="font-medium text-[#17211B]">Allergies</p>
            <p className="text-xs text-[#78867D] mt-1">
              {allergies.length > 0 ? allergies.map((a: any) => a.name).join(', ') : 'No allergies recorded'}
            </p>
          </div>
          <div className="rounded-2xl border border-[#E0E8E2] bg-white/80 p-4 md:p-6">
            <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-xl bg-[#EFF4F7]">
              <span className="text-lg font-semibold text-[#536D83]">{conditions.length}</span>
            </div>
            <p className="font-medium text-[#17211B]">Conditions</p>
            <p className="text-xs text-[#78867D] mt-1">
              {conditions.length > 0 ? conditions.map((c: any) => c.name).join(', ') : 'No conditions recorded'}
            </p>
          </div>
        </div>
      </section>

      {/* Medications list */}
      <section className="pb-8">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#087F5B]">Your list</p>
            <h2 className="mt-2 font-serif text-3xl text-[#17211B]">My medications</h2>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="green">{medications.length} active</Badge>
            <Button
              size="sm"
              variant="outline"
              icon={Plus}
              onClick={() => setShowAddMed((prev) => !prev)}
            >
              Add Medication
            </Button>
          </div>
        </div>

        {/* Inline Add Medication form */}
        {showAddMed && (
          <form onSubmit={handleAddMedication} className="mb-6 rounded-2xl border border-[#BBD8C7] bg-[#F2F8F5] p-5 animate-in slide-in-from-bottom-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-[#173A2C]">Add a medication to your active profile</h3>
              <button
                type="button"
                onClick={() => setShowAddMed(false)}
                className="text-gray-400 hover:text-gray-600"
                aria-label="Cancel adding medication"
              >
                <X size={18} />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
              <div>
                <label className="block text-xs font-medium text-[#526057] mb-1">Medication Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Lisinopril"
                  value={newMedName}
                  onChange={(e) => setNewMedName(e.target.value)}
                  className="w-full rounded-xl border border-[#DCE5DF] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#087F5B]/30"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#526057] mb-1">Dose</label>
                <input
                  type="text"
                  placeholder="e.g. 10 mg"
                  value={newMedDose}
                  onChange={(e) => setNewMedDose(e.target.value)}
                  className="w-full rounded-xl border border-[#DCE5DF] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#087F5B]/30"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#526057] mb-1">Frequency</label>
                <input
                  type="text"
                  placeholder="e.g. once daily"
                  value={newMedFreq}
                  onChange={(e) => setNewMedFreq(e.target.value)}
                  className="w-full rounded-xl border border-[#DCE5DF] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#087F5B]/30"
                />
              </div>
            </div>
            {addError && (
              <p className="text-xs text-red-600 mb-3">{addError}</p>
            )}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setShowAddMed(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Save to Profile'}
              </Button>
            </div>
          </form>
        )}

        <div className="divide-y divide-[#E7ECE8] overflow-hidden rounded-2xl border border-[#E0E8E2] bg-white">
          {medications.length === 0 ? (
            <div className="p-8 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#E8F5EF] text-[#087F5B]">
                <Pill size={22} />
              </div>
              <p className="font-medium text-[#17211B]">No current medications recorded</p>
              <p className="mt-1 text-xs text-[#66736B]">Add your active prescriptions so new scans can check for interactions.</p>
              <Button
                size="sm"
                variant="outline"
                icon={Plus}
                onClick={() => setShowAddMed(true)}
                className="mt-4"
              >
                Add Your First Medication
              </Button>
            </div>
          ) : (
            medications.map((med: any) => (
              <div key={med.id ?? med.name} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 md:px-6">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F1F6F2] text-[#087F5B]">
                    <Pill size={18} />
                  </span>
                  <div>
                    <p className="font-medium text-[#17211B]">{med.name}</p>
                    <p className="mt-0.5 text-xs text-[#78867D]">
                      {[med.route, med.freq ?? med.frequency].filter(Boolean).join(' · ') || 'Active schedule'}
                    </p>
                  </div>
                </div>
                <span className="rounded-full bg-[#F5F7F5] px-3 py-1 text-xs text-[#66736B]">
                  {med.dose || 'Dose not listed'}
                </span>
              </div>
            ))
          )}
        </div>
        <p className="mt-4 text-xs leading-relaxed text-[#78867D]">
          Scanned prescriptions are evaluated first and are not added to your permanent list without confirmation.
        </p>
      </section>
    </div>
  );
};

export default DashboardScreen;

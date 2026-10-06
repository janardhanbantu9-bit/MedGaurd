// @ts-nocheck
import React, { useMemo, useState } from 'react';
import {
  Activity,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Check,
  HeartPulse,
  Loader2,
  Pill,
  Plus,
  ShieldCheck,
  Sparkles,
  Trash2,
} from 'lucide-react';

export const ONBOARDING_STEPS = [
  { id: 'basics', label: 'Basics', hint: 'Age, weight, height' },
  { id: 'medications', label: 'Medications', hint: 'What you take now' },
  { id: 'current', label: 'Current conditions', hint: 'Ongoing health context' },
  { id: 'previous', label: 'Previous conditions', hint: 'Past health context' },
  { id: 'allergies', label: 'Allergies', hint: 'Reactions to avoid' },
  { id: 'review', label: 'Review', hint: 'Confirm and finish' },
];

function ChipInput({ values, onAdd, onRemove, placeholder }) {
  const [draft, setDraft] = useState('');
  const add = () => {
    const name = draft.trim();
    if (!name) return;
    onAdd(name);
    setDraft('');
  };
  return (
    <div>
      <div className="flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              add();
            }
          }}
          placeholder={placeholder}
          className="min-w-0 flex-1 rounded-xl border border-[#D5E0D9] bg-[#FBFCFB] px-3 py-2.5 text-sm outline-none transition focus:border-[#087F5B] focus:ring-2 focus:ring-[#087F5B]/10"
        />
        <button
          type="button"
          onClick={add}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-[#087F5B] px-3.5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#066F50]"
        >
          <Plus size={15} /> Add
        </button>
      </div>
      {values.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-2">
          {values.map((value, index) => (
            <li
              key={`${value}-${index}`}
              className="inline-flex items-center gap-2 rounded-full border border-[#DCE5DF] bg-white px-3 py-1.5 text-sm text-[#24372D]"
            >
              <span className="max-w-[220px] truncate">{value}</span>
              <button
                type="button"
                aria-label={`Remove ${value}`}
                onClick={() => onRemove(index)}
                className="text-[#87958C] transition hover:text-red-600"
              >
                <Trash2 size={13} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}


export default function OnboardingScreen({ onComplete }) {
  const [step, setStep] = useState(0);
  const [age, setAge] = useState('');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [medications, setMedications] = useState([]);
  const [medDraft, setMedDraft] = useState({ name: '', dose: '', frequency: '', route: '' });
  const [currentConditions, setCurrentConditions] = useState([]);
  const [previousConditions, setPreviousConditions] = useState([]);
  const [allergies, setAllergies] = useState([]);
  const [allergyDraft, setAllergyDraft] = useState({ name: '', severity: '', reaction: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const basicsError = useMemo(() => {
    const parsedAge = Number(String(age).trim());
    if (!Number.isInteger(parsedAge) || parsedAge < 1 || parsedAge > 130) {
      return 'Enter your age as a whole number between 1 and 130.';
    }
    const parsedWeight = Number(String(weight).trim());
    if (!Number.isFinite(parsedWeight) || parsedWeight <= 0 || parsedWeight > 1000) {
      return 'Enter your weight in kilograms.';
    }
    const parsedHeight = Number(String(height).trim());
    if (!Number.isFinite(parsedHeight) || parsedHeight <= 0 || parsedHeight > 300) {
      return 'Enter your height in centimeters.';
    }
    return '';
  }, [age, weight, height]);

  const addMedication = () => {
    const name = medDraft.name.trim();
    if (!name) {
      setError('Give each medication a name before adding it.');
      return;
    }
    setError('');
    setMedications((items) => [
      ...items,
      { name, dose: medDraft.dose.trim(), frequency: medDraft.frequency.trim(), route: medDraft.route.trim() },
    ]);
    setMedDraft({ name: '', dose: '', frequency: '', route: '' });
  };

  const addAllergy = () => {
    const name = allergyDraft.name.trim();
    if (!name) {
      setError('Give each allergy a name before adding it.');
      return;
    }
    setError('');
    setAllergies((items) => [
      ...items,
      { name, severity: allergyDraft.severity.trim(), reaction: allergyDraft.reaction.trim() },
    ]);
    setAllergyDraft({ name: '', severity: '', reaction: '' });
  };

  const removeMedication = (index: number) => {
    setMedications((items) => items.filter((_, i) => i !== index));
  };

  const addCondition = (
    name: string,
    setList: React.Dispatch<React.SetStateAction<string[]>>,
  ) => {
    const clean = name.trim();
    if (!clean) return;
    setError('');
    setList((items) => (items.includes(clean) ? items : [...items, clean]));
  };

  const addCurrent = (name: string) => addCondition(name, setCurrentConditions);
  const addPrevious = (name: string) => addCondition(name, setPreviousConditions);
  const removeCurrent = (index: number) => {
    setCurrentConditions((items) => items.filter((_, i) => i !== index));
  };
  const removePrevious = (index: number) => {
    setPreviousConditions((items) => items.filter((_, i) => i !== index));
  };
  const removeAllergy = (index: number) => {
    setAllergies((items) => items.filter((_, i) => i !== index));
  };

  const goNext = () => {
    setError('');
    if (ONBOARDING_STEPS[step].id === 'basics' && basicsError) {
      setError(basicsError);
      return;
    }
    setStep((value) => Math.min(value + 1, ONBOARDING_STEPS.length - 1));
  };

  const goBack = () => {
    setError('');
    setStep((value) => Math.max(value - 1, 0));
  };

  const handleFinish = async () => {
    if (saving) return;
    if (basicsError) {
      setError(basicsError);
      setStep(0);
      return;
    }
    setSaving(true);
    setError('');
    try {
      await onComplete({
        age: Number(String(age).trim()),
        weight: Number(String(weight).trim()),
        height: Number(String(height).trim()),
        medications: medications.map((m) => ({
          name: m.name,
          dose: m.dose || undefined,
          frequency: m.frequency || undefined,
          route: m.route || undefined,
        })),
        currentConditions,
        previousConditions,
        allergies: allergies.map((a) => ({
          name: a.name,
          severity: a.severity || undefined,
          reaction: a.reaction || undefined,
        })),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save your health profile.');
      setSaving(false);
    }
  };

  const isLast = step === ONBOARDING_STEPS.length - 1;
  const progress = ((step + 1) / ONBOARDING_STEPS.length) * 100;

  const titles = [
    'Let’s start with the basics.',
    'Which medications do you take?',
    'Any ongoing health conditions?',
    'Any previous health conditions?',
    'Any allergies we should know about?',
    'Review everything before we finish.',
  ];
  const subtitles = [
    'This helps MediGuard interpret doses and safety checks in your context.',
    'Add each current medication. Details like dose and frequency are optional.',
    'These stay part of your active health context for future safety checks.',
    'Past conditions are stored separately as history and are not treated as active.',
    'Include medicine, food, or other allergies and what happens, if you know.',
    'Use Finish Up once. Your profile is saved privately to your account.',
  ];

  return (
    <div className="min-h-screen bg-[#F7FAF8] px-5 py-10 text-[#17211B]">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#087F5B] text-white">
            <ShieldCheck size={20} />
          </div>
          <div>
            <p className="text-sm font-semibold tracking-wide">MEDIGUARD</p>
            <p className="text-xs text-[#718078]">Your first-time health setup</p>
          </div>
        </div>

        <section className="rounded-[2rem] border border-[#DCE5DF] bg-white p-7 shadow-[0_24px_70px_-42px_rgba(23,58,44,0.35)] md:p-9">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#087F5B]">
            Step {step + 1} of {ONBOARDING_STEPS.length} · {ONBOARDING_STEPS[step].label}
          </p>
          <h1 className="font-serif text-3xl tracking-tight text-[#173A2C] md:text-4xl">{titles[step]}</h1>
          <p className="mt-2 text-sm leading-6 text-[#66736B]">{subtitles[step]}</p>

          <div className="mt-6">
            <div className="mb-2 flex items-center justify-between text-xs text-[#66736B]">
              <span className="inline-flex items-center gap-1.5">
                <Sparkles size={13} className="text-[#087F5B]" />
                {ONBOARDING_STEPS[step].hint}
              </span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-[#EDF3EF]">
              <div className="h-full rounded-full bg-[#087F5B] transition-all duration-500" style={{ width: `${progress}%` }} />
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {ONBOARDING_STEPS.map((item, index) => (
                <span
                  key={item.id}
                  className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${
                    index === step
                      ? 'bg-[#087F5B] text-white'
                      : index < step
                        ? 'bg-[#E8F5EF] text-[#064E3B]'
                        : 'bg-[#F2F6F3] text-[#87958C]'
                  }`}
                >
                  {item.label}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-7 min-h-[240px]">
            {step === 0 && (
              <div className="grid gap-4 md:grid-cols-3">
                <label className="block">
                  <span className="mb-1.5 block text-xs font-medium text-[#526057]">Age</span>
                  <input
                    value={age}
                    inputMode="numeric"
                    onChange={(e) => setAge(e.target.value)}
                    placeholder="32"
                    className="w-full rounded-xl border border-[#D5E0D9] bg-[#FBFCFB] px-3 py-3 text-sm outline-none transition focus:border-[#087F5B] focus:ring-2 focus:ring-[#087F5B]/10"
                  />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-xs font-medium text-[#526057]">Weight (kg)</span>
                  <input
                    value={weight}
                    inputMode="decimal"
                    onChange={(e) => setWeight(e.target.value)}
                    placeholder="68"
                    className="w-full rounded-xl border border-[#D5E0D9] bg-[#FBFCFB] px-3 py-3 text-sm outline-none transition focus:border-[#087F5B] focus:ring-2 focus:ring-[#087F5B]/10"
                  />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-xs font-medium text-[#526057]">Height (cm)</span>
                  <input
                    value={height}
                    inputMode="decimal"
                    onChange={(e) => setHeight(e.target.value)}
                    placeholder="170"
                    className="w-full rounded-xl border border-[#D5E0D9] bg-[#FBFCFB] px-3 py-3 text-sm outline-none transition focus:border-[#087F5B] focus:ring-2 focus:ring-[#087F5B]/10"
                  />
                </label>
              </div>
            )}
            {step === 1 && (
              <div>
                <div className="grid gap-3 md:grid-cols-2">
                  <label className="block">
                    <span className="mb-1.5 block text-xs font-medium text-[#526057]">Medication name *</span>
                    <input
                      value={medDraft.name}
                      onChange={(e) => setMedDraft((v) => ({ ...v, name: e.target.value }))}
                      placeholder="e.g. Metformin"
                      className="w-full rounded-xl border border-[#D5E0D9] bg-[#FBFCFB] px-3 py-2.5 text-sm outline-none transition focus:border-[#087F5B] focus:ring-2 focus:ring-[#087F5B]/10"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1.5 block text-xs font-medium text-[#526057]">Dose</span>
                    <input
                      value={medDraft.dose}
                      onChange={(e) => setMedDraft((v) => ({ ...v, dose: e.target.value }))}
                      placeholder="e.g. 500 mg"
                      className="w-full rounded-xl border border-[#D5E0D9] bg-[#FBFCFB] px-3 py-2.5 text-sm outline-none transition focus:border-[#087F5B] focus:ring-2 focus:ring-[#087F5B]/10"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1.5 block text-xs font-medium text-[#526057]">Frequency</span>
                    <input
                      value={medDraft.frequency}
                      onChange={(e) => setMedDraft((v) => ({ ...v, frequency: e.target.value }))}
                      placeholder="e.g. Twice daily"
                      className="w-full rounded-xl border border-[#D5E0D9] bg-[#FBFCFB] px-3 py-2.5 text-sm outline-none transition focus:border-[#087F5B] focus:ring-2 focus:ring-[#087F5B]/10"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1.5 block text-xs font-medium text-[#526057]">Route</span>
                    <input
                      value={medDraft.route}
                      onChange={(e) => setMedDraft((v) => ({ ...v, route: e.target.value }))}
                      placeholder="e.g. Oral"
                      className="w-full rounded-xl border border-[#D5E0D9] bg-[#FBFCFB] px-3 py-2.5 text-sm outline-none transition focus:border-[#087F5B] focus:ring-2 focus:ring-[#087F5B]/10"
                    />
                  </label>
                </div>
                <button
                  type="button"
                  onClick={addMedication}
                  className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-[#087F5B] px-3.5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#066F50]"
                >
                  <Plus size={15} /> Add medication
                </button>
                {medications.length > 0 ? (
                  <ul className="mt-4 divide-y divide-[#E7ECE8] overflow-hidden rounded-2xl border border-[#E0E8E2]">
                    {medications.map((med, index) => (
                      <li key={`${med.name}-${index}`} className="flex items-center justify-between gap-3 bg-white px-4 py-3">
                        <div className="flex min-w-0 items-center gap-3">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#E8F5EF] text-[#087F5B]"><Pill size={16} /></span>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-[#17211B]">{med.name}</p>
                            <p className="truncate text-xs text-[#78867D]">{[med.dose, med.frequency, med.route].filter(Boolean).join(' · ') || 'No details added'}</p>
                          </div>
                        </div>
                        <button type="button" aria-label={`Remove ${med.name}`} onClick={() => removeMedication(index)} className="text-[#87958C] transition hover:text-red-600"><Trash2 size={15} /></button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-4 rounded-2xl border border-dashed border-[#D5E0D9] bg-[#FBFCFB] px-4 py-3 text-sm text-[#66736B]">No medications added yet. If you take none daily, just continue.</p>
                )}
              </div>
            )}
            {step === 2 && (
              <div>
                <ChipInput values={currentConditions} onAdd={addCurrent} onRemove={removeCurrent} placeholder="e.g. Hypertension" />
                <p className="mt-3 text-xs leading-relaxed text-[#78867D]">Stored as active diagnoses for current safety context.</p>
              </div>
            )}
            {step === 3 && (
              <div>
                <ChipInput values={previousConditions} onAdd={addPrevious} onRemove={removePrevious} placeholder="e.g. Childhood asthma" />
                <p className="mt-3 text-xs leading-relaxed text-[#78867D]">Stored as resolved history, not active conditions.</p>
              </div>
            )}
            {step === 4 && (
              <div>
                <div className="grid gap-3 md:grid-cols-3">
                  <label className="block">
                    <span className="mb-1.5 block text-xs font-medium text-[#526057]">Allergy *</span>
                    <input
                      value={allergyDraft.name}
                      onChange={(e) => setAllergyDraft((v) => ({ ...v, name: e.target.value }))}
                      placeholder="e.g. Penicillin"
                      className="w-full rounded-xl border border-[#D5E0D9] bg-[#FBFCFB] px-3 py-2.5 text-sm outline-none transition focus:border-[#087F5B] focus:ring-2 focus:ring-[#087F5B]/10"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1.5 block text-xs font-medium text-[#526057]">Severity</span>
                    <input
                      value={allergyDraft.severity}
                      onChange={(e) => setAllergyDraft((v) => ({ ...v, severity: e.target.value }))}
                      placeholder="e.g. Severe"
                      className="w-full rounded-xl border border-[#D5E0D9] bg-[#FBFCFB] px-3 py-2.5 text-sm outline-none transition focus:border-[#087F5B] focus:ring-2 focus:ring-[#087F5B]/10"
                    />
                  </label>
                </div>
                <button type="button" onClick={addAllergy} className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-[#087F5B] px-3.5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#066F50]">
                  <Plus size={15} /> Add allergy
                </button>
                {allergies.length > 0 ? (
                  <ul className="mt-4 divide-y divide-[#E7ECE8] overflow-hidden rounded-2xl border border-[#E0E8E2]">
                    {allergies.map((allergy, index) => (
                      <li key={`${allergy.name}-${index}`} className="flex items-center justify-between gap-3 bg-white px-4 py-3">
                        <p className="truncate text-sm font-semibold text-[#17211B]">{allergy.name}</p>
                        <button type="button" aria-label={`Remove ${allergy.name}`} onClick={() => removeAllergy(index)} className="text-[#87958C] transition hover:text-red-600"><Trash2 size={15} /></button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-4 rounded-2xl border border-dashed border-[#D5E0D9] bg-[#FBFCFB] px-4 py-3 text-sm text-[#66736B]">No allergies added yet.</p>
                )}
              </div>
            )}
            {step === 5 && (
              <div className="space-y-4">
                <div className="rounded-2xl border border-[#E0E8E2] bg-[#FBFCFB] p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#66736B]">Basics</p>
                  <p className="mt-1.5 text-sm text-[#24372D]">Age {age} and {weight} kg and {height} cm</p>
                </div>
                <div className="rounded-2xl border border-[#E0E8E2] bg-[#FBFCFB] p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#66736B]">Medications</p>
                  <p className="mt-1.5 text-sm leading-6 text-[#24372D]">{medications.length > 0 ? medications.map((m) => m.name).join(', ') : 'None added'}</p>
                </div>
                <div className="rounded-2xl border border-[#E0E8E2] bg-[#FBFCFB] p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#66736B]">Conditions</p>
                  <p className="mt-1.5 text-sm leading-6 text-[#24372D]">{currentConditions.length > 0 ? currentConditions.join(', ') : 'None added'}</p>
                </div>
                <div className="rounded-2xl border border-[#E0E8E2] bg-[#FBFCFB] p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#66736B]">Previous</p>
                  <p className="mt-1.5 text-sm leading-6 text-[#24372D]">{previousConditions.length > 0 ? previousConditions.join(', ') : 'None added'}</p>
                </div>
                <div className="rounded-2xl border border-[#E0E8E2] bg-[#FBFCFB] p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#66736B]">Allergies</p>
                  <p className="mt-1.5 text-sm leading-6 text-[#24372D]">{allergies.length > 0 ? allergies.map((a) => a.name).join(', ') : 'None added'}</p>
                </div>
              </div>
            )}
          </div>
          {error && (
            <p role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-800">{error}</p>
          )}
          <div className="mt-7 flex items-center justify-between gap-3">
            <button type="button" onClick={goBack} disabled={step === 0 || saving} className="inline-flex items-center gap-1.5 rounded-xl border border-[#DCE5DF] bg-white px-4 py-2.5 text-sm font-medium text-[#526057]">
              <ArrowLeft size={15} /> Back
            </button>
            {isLast ? (
              <button type="button" onClick={handleFinish} disabled={saving} className="inline-flex items-center gap-1.5 rounded-xl bg-[#087F5B] px-5 py-2.5 text-sm font-semibold text-white">
                {saving ? (<><Loader2 size={15} className="animate-spin" /> Saving</>) : (<><Check size={15} /> Finish Up</>)}
              </button>
            ) : (
              <button type="button" onClick={goNext} disabled={saving} className="inline-flex items-center gap-1.5 rounded-xl bg-[#087F5B] px-5 py-2.5 text-sm font-semibold text-white">
                Continue <ArrowRight size={15} />
              </button>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

// @ts-nocheck
import React, { useState } from 'react';
import { ArrowRight, Check, Loader2, Plus, X } from 'lucide-react';

const generateId = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;

// Reference-style input used for medications, conditions, and allergies.
const SurveyListInput = ({
  items,
  onAdd,
  onRemove,
  placeholder,
  buttonText = 'Add',
  requireStatus = false,
  inputValue,
  onInputValueChange,
  statusValue = 'Resolved',
  onStatusValueChange,
}) => {
  const handleAdd = () => {
    const name = inputValue.trim();
    if (!name) return;

    onAdd(
      requireStatus
        ? { id: generateId(), name, status: statusValue }
        : { id: generateId(), name }
    );

    onInputValueChange('');
  };

  return (
    <div className="w-full">
      <div className="mb-6 flex gap-3">
        <input
          type="text"
          value={inputValue}
          onChange={(event) => onInputValueChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              handleAdd();
            }
          }}
          placeholder={placeholder}
          className="min-w-0 flex-1 rounded-xl border border-[#E4EDE8] bg-white px-4 py-3 text-[#111814] transition-all placeholder:text-gray-400 focus:border-[#087F5B] focus:outline-none focus:ring-1 focus:ring-[#087F5B]"
        />

        {requireStatus && (
          <select
            value={statusValue}
            onChange={(event) => onStatusValueChange(event.target.value)}
            aria-label="Condition status"
            className="w-32 shrink-0 rounded-xl border border-[#E4EDE8] bg-white px-2 py-3 text-sm text-[#111814] focus:border-[#087F5B] focus:outline-none sm:w-36 sm:px-4"
          >
            <option value="Ongoing">Ongoing</option>
            <option value="Resolved">Resolved</option>
          </select>
        )}

        <button
          type="button"
          onClick={handleAdd}
          disabled={!inputValue.trim()}
          className="shrink-0 rounded-xl bg-[#F0F8F5] px-4 py-3 font-medium text-[#087F5B] transition-colors hover:bg-[#E4EDE8] disabled:opacity-50 sm:px-5"
        >
          {buttonText}
        </button>
      </div>

      {items.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {items.map((item) => (
            <div
              key={item.id}
              className="group flex items-center gap-2 rounded-xl border border-[#E4EDE8] bg-white px-3 py-2 shadow-sm"
            >
              <div className="flex min-w-0 flex-col">
                <span className="max-w-[220px] break-words text-sm font-medium text-[#111814]">
                  {item.name}
                </span>
                {item.status && (
                  <span className="text-[10px] uppercase tracking-wider text-[#5C6B64]">
                    {item.status}
                  </span>
                )}
              </div>

              <button
                type="button"
                aria-label={`Remove ${item.name}`}
                onClick={() => onRemove(item.id)}
                className="ml-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default function OnboardingScreen({ onComplete }) {
  // Step 0 is the welcome screen. Steps 1-8 are the survey.
  const [step, setStep] = useState(0);
  const [reveal, setReveal] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    age: '',
    weight: '',
    height: '',
    medications: [],
    currentConditions: [],
    previousConditions: [],
    allergies: [],
  });
  const [drafts, setDrafts] = useState({
  medications: '',
  currentConditions: '',
  previousConditions: '',
  previousConditionStatus: 'Resolved',
  allergies: '',
});

const updateDraft = (field, value) => {
  setDrafts((previous) => ({
    ...previous,
    [field]: value,
  }));
};

  const updateField = (field, value) => {
    setFormData((previous) => ({ ...previous, [field]: value }));
    setError('');
  };

  const handleStart = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setReveal({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2, active: false });

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setReveal((previous) => previous ? { ...previous, active: true } : null);
      });
    });

    window.setTimeout(() => setStep(1), 450);
    window.setTimeout(() => setReveal(null), 800);
  };

  const handleNext = () => {
    setError('');
    if (step === 1 && (!Number.isInteger(Number(formData.age)) || Number(formData.age) < 1 || Number(formData.age) > 130)) {
      setError('Enter an age from 1 to 130.');
      return;
    }
    if (step === 2 && (!Number.isFinite(Number(formData.weight)) || Number(formData.weight) <= 0 || Number(formData.weight) > 1000)) {
      setError('Enter your weight in kilograms.');
      return;
    }
    if (step === 3 && (!Number.isFinite(Number(formData.height)) || Number(formData.height) <= 0 || Number(formData.height) > 300)) {
      setError('Enter your height in centimeters.');
      return;
    }
    const fieldByStep = {
  4: 'medications',
  5: 'currentConditions',
  6: 'previousConditions',
  7: 'allergies',
};

const field = fieldByStep[step];

if (field) {
  const name = drafts[field].trim();

  if (name) {
    const item =
      step === 6
        ? {
            id: generateId(),
            name,
            status: drafts.previousConditionStatus,
          }
        : {
            id: generateId(),
            name,
          };

    setFormData((previous) => ({
      ...previous,
      [field]: [...previous[field], item],
    }));

    setDrafts((previous) => ({
      ...previous,
      [field]: '',
    }));
  }
}

setStep((current) => Math.min(current + 1, 8));
  };

  const handleFinish = async () => {
    if (saving) return;

    const age = Number(String(formData.age).trim());
    const weight = Number(String(formData.weight).trim());
    const height = Number(String(formData.height).trim());
    if (!Number.isInteger(age) || age < 1 || age > 130) {
      setError('Enter an age from 1 to 130.');
      setStep(1);
      return;
    }
    if (!Number.isFinite(weight) || weight <= 0 || weight > 1000) {
      setError('Enter your weight in kilograms.');
      setStep(2);
      return;
    }
    if (!Number.isFinite(height) || height <= 0 || height > 300) {
      setError('Enter your height in centimeters.');
      setStep(3);
      return;
    }

    setSaving(true);
    setError('');
    try {
      // Match the payload already expected by frontend/src/services/api.ts and /api/profile.
      // The reference survey captures names only, so optional medication/allergy details are omitted.
      await onComplete({
        age,
        weight,
        height,
        medications: formData.medications.map((item) => ({ name: item.name })),
        currentConditions: [
          ...formData.currentConditions.map((item) => item.name),
          ...formData.previousConditions.filter((item) => item.status === 'Ongoing').map((item) => item.name),
        ],
        previousConditions: formData.previousConditions
          .filter((item) => item.status !== 'Ongoing')
          .map((item) => item.name),
        allergies: formData.allergies.map((item) => ({ name: item.name })),
      });
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Could not save your health profile.');
      setSaving(false);
    }
  };

  const SurveyQuestionLayout = ({ questionNum, title, subtitle, children, isNextDisabled = false }) => (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-[#FAFCFB] p-6">
      <div className="absolute left-0 right-0 top-8 flex flex-col items-center gap-3 px-6 sm:top-12">
        <span className="text-center text-xs font-bold uppercase tracking-widest text-[#5C6B64]">
          Question {questionNum} of 8
        </span>
        <div className="flex w-full max-w-xs gap-1.5" aria-label={`Progress: question ${questionNum} of 8`}>
          {[1, 2, 3, 4, 5, 6, 7, 8].map((number) => (
            <div
              key={number}
              className={`h-1 flex-1 rounded-full transition-colors duration-500 ${questionNum >= number ? 'bg-[#087F5B]' : 'bg-[#E4EDE8]'}`}
            />
          ))}
        </div>
      </div>

      <div className="mt-12 flex w-full max-w-xl animate-in fade-in slide-in-from-bottom-4 flex-col items-center duration-500 ease-out">
        <h2 className="mb-3 text-center text-3xl font-light tracking-tight text-[#111814] sm:text-4xl">{title}</h2>
        {subtitle && <p className="mb-10 text-center text-lg font-light text-[#5C6B64]">{subtitle}</p>}

        <div className="mb-8 flex min-h-[160px] w-full justify-center sm:mb-12">{children}</div>

        {error && (
          <p role="alert" className="mb-4 w-full rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        )}

        <button
          type="button"
          onClick={questionNum === 8 ? handleFinish : handleNext}
          disabled={isNextDisabled || saving}
          className="group flex items-center justify-center gap-2 rounded-full bg-[#087F5B] px-8 py-3.5 text-base font-medium text-white shadow-[0_4px_14px_0_rgba(8,127,91,0.2)] transition-all hover:bg-[#043A2B] hover:shadow-[0_6px_20px_rgba(8,127,91,0.3)] active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-[#087F5B]"
        >
          {saving ? (
            <><Loader2 size={18} className="animate-spin" /> Saving...</>
          ) : questionNum === 8 ? (
            <>Finish Up <Check size={18} /></>
          ) : (
            <>Next <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" /></>
          )}
        </button>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[9999] min-h-screen overflow-y-auto bg-[#FAFCFB] text-[#111814]">
      {step === 0 && (
        <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#087F5B] p-6">
          <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-8 duration-700">
            <span className="mb-4 block text-[11px] font-bold uppercase tracking-widest text-emerald-100">Let's get you started</span>
            <h1 className="mb-4 text-4xl font-light leading-tight tracking-tight text-white sm:text-5xl">
              Your health context, <br />in one place.
            </h1>
            <p className="mb-10 text-lg font-light leading-relaxed text-emerald-50 text-opacity-90">
              Tell Mediguard a little about yourself so prescription checks can be personalized to your medications, conditions, and allergies.
            </p>
            <div className="flex justify-start">
              <button
                type="button"
                onClick={handleStart}
                className="group relative flex items-center gap-3 overflow-hidden rounded-full bg-white px-8 py-3.5 text-base font-medium text-[#087F5B] shadow-[0_4px_14px_0_rgba(0,0,0,0.1)] transition-all hover:bg-gray-50 hover:shadow-[0_6px_20px_rgba(0,0,0,0.15)] active:scale-95"
              >
                <span className="relative z-10">Next</span>
                <ArrowRight size={18} className="relative z-10 transition-transform group-hover:translate-x-1" />
              </button>
            </div>
          </div>
        </div>
      )}

      {reveal && (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed z-[100] rounded-full bg-white transition-transform duration-[600ms] ease-[cubic-bezier(0.4,0,0.2,1)]"
          style={{
            left: reveal.x,
            top: reveal.y,
            width: '20px',
            height: '20px',
            transform: reveal.active ? 'translate(-50%, -50%) scale(150)' : 'translate(-50%, -50%) scale(1)',
            opacity: reveal.active ? 1 : 0,
          }}
        />
      )}

      {step === 1 && (
        <SurveyQuestionLayout questionNum={1} title="How old are you?" isNextDisabled={!formData.age}>
          <div className="flex w-full max-w-xs flex-col items-center">
            <input
              type="number"
              min="1"
              max="130"
              autoFocus
              value={formData.age}
              onChange={(event) => updateField('age', event.target.value)}
              aria-label="Age in years"
              className="w-full border-b-2 border-[#E4EDE8] bg-transparent pb-4 text-center text-5xl font-light text-[#111814] transition-colors placeholder:text-gray-300 focus:border-[#087F5B] focus:outline-none"
              placeholder="0"
            />
            <span className="mt-3 text-xs font-medium uppercase tracking-widest text-[#5C6B64]">Years Old</span>
          </div>
        </SurveyQuestionLayout>
      )}

      {step === 2 && (
        <SurveyQuestionLayout questionNum={2} title="What's your current weight?" isNextDisabled={!formData.weight}>
          <div className="relative flex w-full max-w-xs flex-col items-center">
            <div className="relative flex items-end">
              <input
                type="number"
                min="1"
                max="1000"
                autoFocus
                value={formData.weight}
                onChange={(event) => updateField('weight', event.target.value)}
                aria-label="Weight in kilograms"
                className="w-32 border-b-2 border-[#E4EDE8] bg-transparent pb-4 text-center text-5xl font-light text-[#111814] transition-colors placeholder:text-gray-300 focus:border-[#087F5B] focus:outline-none"
                placeholder="0"
              />
              <span className="absolute bottom-6 right-[-40px] text-lg font-medium text-[#5C6B64]">kg</span>
            </div>
          </div>
        </SurveyQuestionLayout>
      )}

      {step === 3 && (
        <SurveyQuestionLayout questionNum={3} title="What's your height?" isNextDisabled={!formData.height}>
          <div className="relative flex w-full max-w-xs flex-col items-center">
            <div className="relative flex items-end">
              <input
                type="number"
                min="1"
                max="300"
                autoFocus
                value={formData.height}
                onChange={(event) => updateField('height', event.target.value)}
                aria-label="Height in centimeters"
                className="w-32 border-b-2 border-[#E4EDE8] bg-transparent pb-4 text-center text-5xl font-light text-[#111814] transition-colors placeholder:text-gray-300 focus:border-[#087F5B] focus:outline-none"
                placeholder="0"
              />
              <span className="absolute bottom-6 right-[-45px] text-lg font-medium text-[#5C6B64]">cm</span>
            </div>
          </div>
        </SurveyQuestionLayout>
      )}

      {step === 4 && (
        <SurveyQuestionLayout questionNum={4} title="Current active prescriptions" subtitle="What medications are you currently taking?">
          <SurveyListInput
            placeholder="e.g. Lisinopril 10mg"
            items={formData.medications}
            onAdd={(item) => updateField('medications', [...formData.medications, item])}
            onRemove={(id) => updateField('medications', formData.medications.filter((item) => item.id !== id))}
            inputValue={drafts.medications}
onInputValueChange={(value) => updateDraft('medications', value)}
          />
        </SurveyQuestionLayout>
      )}

      {step === 5 && (
        <SurveyQuestionLayout questionNum={5} title="Currently diagnosed diseases" subtitle="Do you currently have any diagnosed conditions?">
          <SurveyListInput
            placeholder="e.g. Hypertension"
            items={formData.currentConditions}
            onAdd={(item) => updateField('currentConditions', [...formData.currentConditions, item])}
            onRemove={(id) => updateField('currentConditions', formData.currentConditions.filter((item) => item.id !== id))}
            inputValue={drafts.currentConditions}
onInputValueChange={(value) => updateDraft('currentConditions', value)}
          />
        </SurveyQuestionLayout>
      )}

      {step === 6 && (
        <SurveyQuestionLayout questionNum={6} title="Previous diagnoses" subtitle="Have you ever been diagnosed with any other conditions?">
          <SurveyListInput
            placeholder="e.g. Asthma"
            requireStatus
            items={formData.previousConditions}
            onAdd={(item) => updateField('previousConditions', [...formData.previousConditions, item])}
            onRemove={(id) => updateField('previousConditions', formData.previousConditions.filter((item) => item.id !== id))}
            inputValue={drafts.previousConditions}
onInputValueChange={(value) => updateDraft('previousConditions', value)}
statusValue={drafts.previousConditionStatus}
onStatusValueChange={(value) => updateDraft('previousConditionStatus', value)}
          />
        </SurveyQuestionLayout>
      )}

      {step === 7 && (
        <SurveyQuestionLayout questionNum={7} title="Allergies" subtitle="Do you have any known allergies?">
          <SurveyListInput
            placeholder="e.g. Penicillin"
            items={formData.allergies}
            onAdd={(item) => updateField('allergies', [...formData.allergies, item])}
            onRemove={(id) => updateField('allergies', formData.allergies.filter((item) => item.id !== id))}
            inputValue={drafts.allergies}
onInputValueChange={(value) => updateDraft('allergies', value)}
          />
        </SurveyQuestionLayout>
      )}

      {step === 8 && (
        <SurveyQuestionLayout questionNum={8} title="You're all set." subtitle="Here is a quick summary of your profile.">
          <div className="w-full max-w-md rounded-3xl border border-[#E4EDE8] bg-white p-6 text-left shadow-sm">
            <div className="grid grid-cols-3 gap-x-4 gap-y-6">
              <div className="col-span-1 border-r border-[#E4EDE8]">
                <span className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-[#5C6B64]">Age</span>
                <span className="text-lg font-medium text-[#111814]">{formData.age}</span>
              </div>
              <div className="col-span-1 border-r border-[#E4EDE8] pl-2">
                <span className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-[#5C6B64]">Weight</span>
                <span className="text-lg font-medium text-[#111814]">{formData.weight} kg</span>
              </div>
              <div className="col-span-1 pl-2">
                <span className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-[#5C6B64]">Height</span>
                <span className="text-lg font-medium text-[#111814]">{formData.height} cm</span>
              </div>

              <div className="col-span-3 border-t border-[#E4EDE8] pt-4">
                <span className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-[#5C6B64]">Medications</span>
                <div className="flex flex-wrap gap-1.5">
                  {formData.medications.length ? formData.medications.map((item) => (
                    <span key={item.id} className="rounded bg-[#F0F8F5] px-2 py-1 text-xs font-medium text-[#043A2B]">{item.name}</span>
                  )) : <span className="text-sm text-gray-400">None added</span>}
                </div>
              </div>

              <div className="col-span-3 border-t border-[#E4EDE8] pt-4">
                <span className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-[#5C6B64]">Conditions</span>
                <div className="flex flex-wrap gap-1.5">
                  {[...formData.currentConditions, ...formData.previousConditions].length ? (
                    [...formData.currentConditions, ...formData.previousConditions].map((item) => (
                      <span key={item.id} className="rounded border border-[#E4EDE8] px-2 py-1 text-xs font-medium text-[#111814]">
                        {item.name}{item.status ? ` (${item.status})` : ''}
                      </span>
                    ))
                  ) : <span className="text-sm text-gray-400">None added</span>}
                </div>
              </div>

              <div className="col-span-3 border-t border-[#E4EDE8] pt-4">
                <span className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-[#5C6B64]">Allergies</span>
                <div className="flex flex-wrap gap-1.5">
                  {formData.allergies.length ? formData.allergies.map((item) => (
                    <span key={item.id} className="rounded bg-red-50 px-2 py-1 text-xs font-medium text-red-600">{item.name}</span>
                  )) : <span className="text-sm text-gray-400">None added</span>}
                </div>
              </div>
            </div>
          </div>
        </SurveyQuestionLayout>
      )}
    </div>
  );
}

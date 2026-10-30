import React, { useState } from 'react';
import { Edit2, Trash2, Plus, ShieldCheck, Loader2, Check, AlertCircle, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import { Button, Card } from '../components/ui';
import { analyzeMedications } from '../services/api';

const cellInput =
  'w-full border border-[#DCE5DF] rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-[#087F5B]/30';

interface ExtractedRxScreenProps {
  setView: (view: string) => void;
  patient: any;
  meds: any[];
  setMeds: React.Dispatch<React.SetStateAction<any[]>>;
  setAnalysis: (analysis: any) => void;
}

const ExtractedRxScreen: React.FC<ExtractedRxScreenProps> = ({ setView, patient, meds, setMeds, setAnalysis }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [showOcrText, setShowOcrText] = useState(false);

  const ocrText = (meds as any)?.ocrText || (meds?.[0] as any)?.ocrText;

  const updateMed = (id: string, field: string, value: string) =>
    setMeds(meds.map((m) => (m.id === id ? { ...m, [field]: value } : m)));

  const removeMed = (id: string) => {
    setMeds(meds.filter((m) => m.id !== id));
    if (editingId === id) setEditingId(null);
  };

  const addMed = () => {
    const id = `em${Date.now()}`;
    setMeds([...meds, { id, name: '', dose: '', freq: '', route: '', intendedDuration: '' }]);
    setEditingId(id);
  };

  const handleRunSafetyCheck = async () => {
    const valid = meds.filter((m) => m.name && m.name.trim());
    if (valid.length === 0) {
      setError('Add at least one medication with a valid name.');
      return;
    }
    setError('');
    setIsAnalyzing(true);
    try {
      const result = await analyzeMedications(patient, valid);
      setAnalysis(result);
      setView('analysis');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto animate-in slide-in-from-right-4 duration-300">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-[#17211B] mb-2 tracking-tight">Prescription Review</h1>
        <p className="text-[#66736B]">Verify and edit the extracted medications before running the safety analysis.</p>
      </div>

      {ocrText && (
        <div className="mb-6 rounded-2xl border border-[#DCE5DF] bg-white p-4">
          <button
            type="button"
            onClick={() => setShowOcrText((prev) => !prev)}
            className="flex w-full items-center justify-between text-left text-xs font-semibold text-[#173A2C]"
          >
            <span className="flex items-center gap-2">
              <FileText size={15} className="text-[#087F5B]" />
              Compare with Image Transcription (OCR)
            </span>
            {showOcrText ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          {showOcrText && (
            <div className="mt-3 rounded-xl bg-[#F8FBF9] p-3 text-xs leading-relaxed text-[#55695C] whitespace-pre-wrap border border-[#E2EBE5]">
              {ocrText}
            </div>
          )}
        </div>
      )}

      <Card noPadding className="mb-8 border-t-4 border-t-[#087F5B]">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b border-[#DCE5DF] text-[#66736B]">
              <tr>
                <th className="px-6 py-4 font-medium">Medication</th>
                <th className="px-6 py-4 font-medium">Dose</th>
                <th className="px-6 py-4 font-medium">Frequency</th>
                <th className="px-6 py-4 font-medium">Duration</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DCE5DF]">
              {meds.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-[#66736B]">
                    No medications listed. Add one below or return to prescription input.
                  </td>
                </tr>
              )}
              {meds.map((med) => {
                const editing = editingId === med.id;
                return (
                  <tr key={med.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="px-6 py-4">
                      {editing ? (
                        <input
                          className={cellInput}
                          value={med.name}
                          placeholder="e.g. Amoxicillin"
                          onChange={(e) => updateMed(med.id, 'name', e.target.value)}
                          autoFocus
                        />
                      ) : (
                        <>
                          <span className="font-medium text-[#17211B]">{med.name}</span>
                          {med.route && <span className="block text-xs text-[#66736B] mt-0.5">{med.route}</span>}
                        </>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {editing ? (
                        <input
                          className={cellInput}
                          value={med.dose}
                          placeholder="e.g. 500 mg"
                          onChange={(e) => updateMed(med.id, 'dose', e.target.value)}
                        />
                      ) : (
                        med.dose || <span className="text-xs text-gray-400">Not specified</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {editing ? (
                        <input
                          className={cellInput}
                          value={med.freq}
                          placeholder="e.g. three times daily"
                          onChange={(e) => updateMed(med.id, 'freq', e.target.value)}
                        />
                      ) : (
                        med.freq || <span className="text-xs text-gray-400">Not specified</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-[#66736B]">
                      {editing ? (
                        <input
                          className={cellInput}
                          value={med.intendedDuration}
                          placeholder="e.g. 7 days"
                          onChange={(e) => updateMed(med.id, 'intendedDuration', e.target.value)}
                        />
                      ) : (
                        med.intendedDuration || <span className="text-xs text-gray-400">Not specified</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => setEditingId(editing ? null : med.id)}
                        className="text-[#66736B] hover:text-[#087F5B] p-1.5 rounded hover:bg-[#E8F5EF] transition-colors inline-flex"
                        aria-label={editing ? 'Save medication edits' : `Edit ${med.name || 'medication'}`}
                      >
                        {editing ? <Check size={16} /> : <Edit2 size={16} />}
                      </button>
                      <button
                        type="button"
                        onClick={() => removeMed(med.id)}
                        className="text-[#66736B] hover:text-red-600 p-1.5 ml-1 rounded hover:bg-red-50 transition-colors inline-flex"
                        aria-label={`Remove ${med.name || 'medication'}`}
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="p-4 border-t border-[#DCE5DF] bg-white flex justify-center rounded-b-xl">
          <Button variant="ghost" size="sm" icon={Plus} onClick={addMed}>
            Add Medication Manually
          </Button>
        </div>
      </Card>

      {error && (
        <div role="alert" className="mb-6 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white shadow-sm p-6 rounded-xl border border-[#DCE5DF]">
        <div className="flex items-start gap-4 max-w-2xl">
          <div className="w-10 h-10 rounded-full bg-[#E8F5EF] flex items-center justify-center shrink-0">
            <ShieldCheck className="text-[#087F5B]" size={20} />
          </div>
          <div>
            <h3 className="font-semibold text-[#17211B] mb-1">Ready for Safety Analysis</h3>
            <p className="text-sm text-[#66736B] leading-relaxed">
              MediGuard will check these <span className="font-semibold text-[#17211B]">{meds.length} medications</span> against your active medications, recorded allergies, and health conditions.
            </p>
          </div>
        </div>
        <div className="shrink-0 w-full md:w-auto">
          <Button size="lg" onClick={handleRunSafetyCheck} disabled={isAnalyzing || meds.length === 0} className="w-full md:min-w-[200px]">
            {isAnalyzing ? (
              <>
                <Loader2 size={18} className="animate-spin mr-2" />
                Analyzing...
              </>
            ) : (
              'Run Safety Analysis'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ExtractedRxScreen;

// @ts-nocheck
import React, { useState } from 'react';
import { Loader2, UploadCloud, FileText, ArrowRight } from 'lucide-react';
import { Button, Card } from '../components/ui';
import { analyzePrescription } from '../services/api';

const InputRxScreen = ({ patient, onAnalysisStart, onAnalysisComplete, setView }) => {
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressStep, setProgressStep] = useState(0);
  const [error, setError] = useState('');

  const steps = [
    'Extracting medication entities...',
    'Normalizing drug nomenclature...',
    'Checking medication evidence...',
    'Saving analysis...',
  ];

  const handleAnalyze = async () => {
    if (!inputText.trim() || !patient?.id) return;

    setIsProcessing(true);
    setError('');
    onAnalysisStart?.();

    try {
      setProgressStep(0);
      const result = await analyzePrescription({
        patientId: patient.id,
        prescription: inputText.trim(),
      });

      setProgressStep(steps.length);
      onAnalysisComplete?.(result);
      setView('extract-rx');
    } catch (err) {
      setError(err?.message || 'Analysis failed');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto animate-in fade-in duration-300">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-[#17211B] mb-2 tracking-tight">Input New Prescription</h1>
        <p className="text-[#66736B]">Provide prescription details to check against the patient's existing clinical profile.</p>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
        {isProcessing && (
          <div className="absolute inset-0 z-10 bg-white/70 backdrop-blur-sm flex flex-col items-center justify-center rounded-xl border border-gray-100">
            <div className="w-16 h-16 bg-white rounded-full shadow-lg flex items-center justify-center mb-6">
              <Loader2 size={32} className="animate-spin text-[#087F5B]" />
            </div>
            <p className="text-[#087F5B] font-medium text-lg mb-2">Processing Prescription</p>
            <p className="text-[#66736B] text-sm font-mono h-6 transition-all">
              {steps[Math.min(progressStep, steps.length - 1)]}
            </p>
          </div>
        )}

        <Card className="flex flex-col border-dashed border-2 bg-gray-50/50 items-center justify-center text-center p-12 hover:bg-gray-50 hover:border-[#087F5B]/30 transition-all cursor-not-allowed group">
          <div className="w-16 h-16 bg-[#E8F5EF] rounded-full flex items-center justify-center text-[#087F5B] mb-4 group-hover:scale-110 transition-transform">
            <UploadCloud size={32} />
          </div>
          <h3 className="font-semibold text-[#17211B] mb-1">Upload Document</h3>
          <p className="text-sm text-[#66736B] mb-6">Upload support comes after the text pipeline is working.</p>
          <Button variant="secondary" disabled>Browse Files</Button>
        </Card>

        <Card className="flex flex-col p-6 shadow-sm">
          <h3 className="font-semibold text-[#17211B] mb-4 flex items-center gap-2">
            <FileText size={18} className="text-[#087F5B]" /> Paste Prescription Text
          </h3>
          <textarea
            className="w-full flex-grow min-h-[260px] p-4 border border-[#DCE5DF] rounded-lg resize-none focus:ring-2 focus:ring-[#087F5B]/30 focus:border-[#087F5B] outline-none text-sm font-mono bg-gray-50/30"
            placeholder={'E.g., Ibuprofen 600mg TID for 7 days\nGlimepiride 2mg PO daily\nVitamin D3 2000 IU daily...'}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
          />
        </Card>
      </div>

      <div className="mt-8 flex justify-end">
        <Button
          size="lg"
          icon={ArrowRight}
          className="shadow-sm min-w-[220px]"
          onClick={handleAnalyze}
          disabled={inputText.trim().length === 0 || isProcessing || !patient?.id}
        >
          Analyze Prescription
        </Button>
      </div>
    </div>
  );
};

export default InputRxScreen;

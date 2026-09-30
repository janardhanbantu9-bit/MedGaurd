// @ts-nocheck
import React, { useRef, useState } from 'react';
import { Loader2, UploadCloud, FileText, ArrowRight, AlertCircle } from 'lucide-react';
import { Button, Card } from '../components/ui';
import { extractMedications } from '../services/api';

const InputRxScreen = ({ setView, setExtractedMeds }) => {
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressStep, setProgressStep] = useState(0);
  const [error, setError] = useState('');
  const fileInput = useRef(null);

  const steps = [
    'Initializing Mediguard engine...',
    'Extracting medication entities...',
    'Normalizing drug nomenclature...',
    'Cross-referencing clinical context...',
    'Preparing safety review...'
  ];

  const handleAnalyze = async () => {
    setError('');
    setIsProcessing(true);
    setProgressStep(0);

    // Purely cosmetic progress while the real request runs; it stops before the last step.
    const interval = setInterval(() => {
      setProgressStep((s) => Math.min(s + 1, steps.length - 1));
    }, 900);

    try {
      const meds = await extractMedications(inputText);
      if (meds.length === 0) {
        throw new Error('No medications were found in that text. Try adding the drug name, dose and frequency.');
      }
      setExtractedMeds(meds);
      setView('extract-rx');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      clearInterval(interval);
      setIsProcessing(false);
    }
  };

  const handleFile = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    if (!/\.(txt|text|csv)$/i.test(file.name) && !file.type.startsWith('text/')) {
      setError('Only plain-text files are supported right now. Paste the prescription text instead.');
      return;
    }
    setError('');
    setInputText(await file.text());
  };

  return (
    <div className="p-8 max-w-4xl mx-auto animate-in fade-in duration-300">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-[#17211B] mb-2 tracking-tight">Input New Prescription</h1>
        <p className="text-[#66736B]">Provide prescription details to check against the patient's existing clinical profile.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
        {/* Overlay during processing */}
        {isProcessing && (
          <div className="absolute inset-0 z-10 bg-white/60 backdrop-blur-sm flex flex-col items-center justify-center rounded-xl border border-gray-100">
             <div className="w-16 h-16 bg-white rounded-full shadow-lg flex items-center justify-center mb-6">
                <Loader2 size={32} className="animate-spin text-[#087F5B]" />
             </div>
             <p className="text-[#087F5B] font-medium text-lg mb-2">Processing Prescription</p>
             <p className="text-[#66736B] text-sm font-mono h-6 transition-all">{steps[progressStep] || steps[steps.length-1]}</p>
          </div>
        )}

        <Card
          onClick={() => fileInput.current?.click()}
          className="flex flex-col border-dashed border-2 bg-gray-50/50 items-center justify-center text-center p-12 hover:bg-gray-50 hover:border-[#087F5B]/30 transition-all cursor-pointer group"
        >
          <input ref={fileInput} type="file" accept=".txt,.text,.csv,text/plain" className="hidden" onChange={handleFile} />
          <div className="w-16 h-16 bg-[#E8F5EF] rounded-full flex items-center justify-center text-[#087F5B] mb-4 group-hover:scale-110 transition-transform">
            <UploadCloud size={32} />
          </div>
          <h3 className="font-semibold text-[#17211B] mb-1">Upload Document</h3>
          <p className="text-sm text-[#66736B] mb-6">Upload a plain-text (.txt) prescription</p>
          <Button variant="secondary">Browse Files</Button>
        </Card>

        <Card className="flex flex-col p-6 shadow-sm">
          <h3 className="font-semibold text-[#17211B] mb-4 flex items-center gap-2">
            <FileText size={18} className="text-[#087F5B]" /> Paste Text Instructions
          </h3>
          <textarea 
            className="w-full flex-grow p-4 border border-[#DCE5DF] rounded-lg resize-none focus:ring-2 focus:ring-[#087F5B]/30 focus:border-[#087F5B] outline-none text-sm font-mono bg-gray-50/30"
            placeholder="E.g., Ibuprofen 600mg TID for 7 days&#10;Glimepiride 2mg PO daily&#10;Vitamin D3 2000 IU daily..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
          />
        </Card>
      </div>

      {error && (
        <div className="mt-6 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="mt-8 flex justify-end">
        <Button 
          size="lg" 
          icon={ArrowRight}
          className="shadow-sm min-w-[200px]"
          onClick={handleAnalyze}
          disabled={inputText.trim().length === 0 || isProcessing}
        >
          Extract Medications
        </Button>
      </div>
    </div>
  );
};

export default InputRxScreen;

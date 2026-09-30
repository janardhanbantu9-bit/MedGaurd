import React, { useRef, useState } from 'react';
import { AlertCircle, ArrowRight, Camera, FileText, ImagePlus, Loader2, ScanLine, ShieldCheck } from 'lucide-react';
import { Button } from '../components/ui';
import { extractMedicationImage, extractMedications } from '../services/api';

const InputRxScreen = ({ setView, setExtractedMeds }: any) => {
  const [mode, setMode] = useState<'photo' | 'text'>('photo');
  const [inputText, setInputText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const fileInput = useRef<HTMLInputElement>(null);

  const handleFile = (selected?: File) => {
    if (!selected) return;
    setError('');
    if (!selected.type.startsWith('image/')) { setError('Choose a photo or image of your prescription.'); return; }
    if (selected.size > 4 * 1024 * 1024) { setError('Choose an image smaller than 4 MB.'); return; }
    setFile(selected);
    setPreview(URL.createObjectURL(selected));
  };

  const handleSubmit = async () => {
    setError('');
    setIsProcessing(true);
    try {
      const medications = mode === 'photo'
        ? file ? await extractMedicationImage(file) : (() => { throw new Error('Choose a prescription image first.'); })()
        : await extractMedications(inputText);
      if (medications.length === 0) throw new Error('No medications were found. Try a clearer image or add the prescription as text.');
      setExtractedMeds(medications);
      setView('extract-rx');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not read the prescription.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <section className="mx-auto max-w-5xl px-6 py-10 md:px-10 md:py-14">
      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-[#087F5B]">A thoughtful first check</p>
      <div className="mb-9 max-w-2xl"><h1 className="font-serif text-4xl tracking-tight text-[#17211B] md:text-5xl">Let’s read your prescription.</h1><p className="mt-3 text-base leading-7 text-[#66736B]">Take a clear photo or paste the text. You’ll review every detail before anything is checked.</p></div>

      <div className="mb-6 inline-flex rounded-full border border-[#DCE5DF] bg-white p-1 shadow-sm" role="tablist" aria-label="Prescription input type">
        <button role="tab" aria-selected={mode === 'photo'} onClick={() => { setMode('photo'); setError(''); }} className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors ${mode === 'photo' ? 'bg-[#087F5B] text-white' : 'text-[#66736B] hover:bg-[#F3F7F4]'}`}><Camera size={16} />Photo</button>
        <button role="tab" aria-selected={mode === 'text'} onClick={() => { setMode('text'); setError(''); }} className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors ${mode === 'text' ? 'bg-[#087F5B] text-white' : 'text-[#66736B] hover:bg-[#F3F7F4]'}`}><FileText size={16} />Text</button>
      </div>

      {mode === 'photo' ? <div className="grid gap-6 md:grid-cols-[1.2fr_.8fr]">
        <div className="rounded-3xl border border-[#DCE5DF] bg-white p-5 md:p-7">
          <input ref={fileInput} type="file" accept="image/*" capture="environment" className="hidden" onChange={(event) => handleFile(event.target.files?.[0])} />
          {preview ? <div className="overflow-hidden rounded-2xl bg-[#F3F6F4]"><img src={preview} alt="Prescription preview" className="max-h-[420px] w-full object-contain" /></div> : <button onClick={() => fileInput.current?.click()} className="group flex min-h-[300px] w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#C9D9CE] bg-[#F8FBF9] px-5 text-center transition-colors hover:border-[#087F5B] hover:bg-[#F0F7F2]"><span className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#E8F5EF] text-[#087F5B] transition-transform group-hover:scale-105"><ImagePlus size={27} /></span><span className="font-medium text-[#173A2C]">Add a prescription photo</span><span className="mt-2 text-sm text-[#78867D]">Take a photo or choose an image from your device</span><span className="mt-4 rounded-full bg-white px-3 py-1 text-xs text-[#78867D]">JPG, PNG or WEBP · up to 4 MB</span></button>}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">{file ? <><p className="truncate text-xs text-[#66736B]">{file.name}</p><button className="text-xs font-medium text-[#087F5B] hover:underline" onClick={() => fileInput.current?.click()}>Change photo</button></> : <p className="text-xs text-[#87958C]">Keep the full prescription in focus and use good lighting.</p>}</div>
        </div>
        <aside className="flex flex-col justify-between rounded-3xl bg-[#EAF4ED] p-6 md:p-7"><div><div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-[#087F5B]"><ScanLine size={20} /></div><h2 className="font-serif text-2xl text-[#173A2C]">From image to review</h2><p className="mt-3 text-sm leading-6 text-[#587061]">We’ll transcribe what’s visible, then find medication details for you to check. Unclear text stays marked for your review.</p></div><div className="mt-8 flex items-start gap-3 rounded-2xl border border-[#C9DDCF] bg-white/60 p-4"><ShieldCheck size={17} className="mt-0.5 shrink-0 text-[#087F5B]" /><p className="text-xs leading-5 text-[#587061]">Nothing is added to your medication list. You’ll verify the extracted details before the safety check.</p></div></aside>
      </div> : <div className="rounded-3xl border border-[#DCE5DF] bg-white p-5 md:p-7"><label htmlFor="prescription-text" className="mb-3 flex items-center gap-2 text-sm font-semibold text-[#173A2C]"><FileText size={17} className="text-[#087F5B]" />Prescription text</label><textarea id="prescription-text" className="min-h-[280px] w-full resize-y rounded-2xl border border-[#DCE5DF] bg-[#FAFCFA] p-5 text-sm leading-6 text-[#17211B] outline-none transition focus:border-[#087F5B] focus:ring-4 focus:ring-[#087F5B]/10" placeholder="Example: Ibuprofen 600 mg three times daily for 7 days" value={inputText} onChange={(e) => setInputText(e.target.value)} /><p className="mt-3 text-xs text-[#87958C]">Add the wording as written. You’ll confirm the medication details next.</p></div>}

      {error && <div role="alert" className="mt-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"><AlertCircle size={18} className="mt-0.5 shrink-0" /><span>{error}</span></div>}
      <div className="mt-7 flex flex-wrap items-center justify-between gap-4"><p className="text-xs text-[#87958C]">Your prescription details are used to prepare this safety review.</p><Button size="lg" icon={isProcessing ? undefined : ArrowRight} disabled={isProcessing || (mode === 'photo' ? !file : !inputText.trim())} onClick={handleSubmit} className="min-w-[220px]">{isProcessing ? <><Loader2 size={17} className="animate-spin" />{mode === 'photo' ? 'Reading prescription…' : 'Reading text…'}</> : 'Review medications'}</Button></div>
    </section>
  );
};

export default InputRxScreen;

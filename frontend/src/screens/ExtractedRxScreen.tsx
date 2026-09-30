// @ts-nocheck
import React from 'react';
import { ShieldCheck, CheckCircle2 } from 'lucide-react';
import { Button, Card } from '../components/ui';

const ExtractedRxScreen = ({ analysisResult, setView }) => {
  const medications = analysisResult?.medications || [];

  return (
    <div className="p-8 max-w-4xl mx-auto animate-in slide-in-from-right-4 duration-300">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-[#17211B] mb-2 tracking-tight">Prescription Review</h1>
        <p className="text-[#66736B]">These medications were extracted and normalized from the submitted prescription.</p>
      </div>

      <Card noPadding className="mb-8 border-t-4 border-t-[#087F5B]">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b border-[#DCE5DF] text-[#66736B]">
              <tr>
                <th className="px-6 py-4 font-medium">Medication</th>
                <th className="px-6 py-4 font-medium">Dose</th>
                <th className="px-6 py-4 font-medium">Frequency</th>
                <th className="px-6 py-4 font-medium">RxCUI</th>
                <th className="px-6 py-4 font-medium">Label</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DCE5DF]">
              {medications.map((med, index) => (
                <tr key={`${med.name}-${index}`} className="hover:bg-gray-50/80 transition-colors">
                  <td className="px-6 py-4">
                    <span className="font-medium text-[#17211B]">{med.name}</span>
                    <span className="block text-xs text-[#66736B] mt-0.5">{med.route || 'Route not specified'}</span>
                  </td>
                  <td className="px-6 py-4">{med.dose || 'Not specified'}</td>
                  <td className="px-6 py-4">{med.frequency || 'Not specified'}</td>
                  <td className="px-6 py-4 font-mono text-xs text-[#66736B]">{med.rxCui || 'Not found'}</td>
                  <td className="px-6 py-4">
                    <span className={med.labelAvailable ? 'text-emerald-700' : 'text-amber-700'}>
                      {med.labelAvailable ? 'Available' : 'Not found'}
                    </span>
                  </td>
                </tr>
              ))}
              {medications.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-[#66736B]">No medications were extracted.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="flex justify-between items-center bg-white shadow-sm p-6 rounded-xl border border-[#DCE5DF]">
        <div className="flex items-start gap-4 max-w-2xl">
          <div className="w-10 h-10 rounded-full bg-[#E8F5EF] flex items-center justify-center shrink-0">
            <ShieldCheck className="text-[#087F5B]" size={20} />
          </div>
          <div>
            <h3 className="font-semibold text-[#17211B] mb-1">Extraction complete</h3>
            <p className="text-sm text-[#66736B] leading-relaxed">
              Analysis ID <span className="font-mono text-xs">{analysisResult?.analysisId}</span> was saved. Safety rules are the next layer to connect.
            </p>
          </div>
        </div>
        <Button size="lg" icon={CheckCircle2} onClick={() => setView('analysis')}>
          View Safety Analysis
        </Button>
      </div>
    </div>
  );
};

export default ExtractedRxScreen;

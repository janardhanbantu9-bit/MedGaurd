// @ts-nocheck
import React, { useState } from 'react';
import { Edit2, Trash2, Plus, ShieldCheck, Loader2 } from 'lucide-react';
import { Button, Card } from '../components/ui';
import { demoExtractedMeds } from '../data/mockData';

const ExtractedRxScreen = ({ setView }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleRunSafetyCheck = () => {
    setIsAnalyzing(true);
    setTimeout(() => {
      setView('analysis');
    }, 1200);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto animate-in slide-in-from-right-4 duration-300">
       <div className="mb-8">
        <h1 className="text-2xl font-semibold text-[#17211B] mb-2 tracking-tight">Prescription Review</h1>
        <p className="text-[#66736B]">Verify the extracted medications before running the full safety analysis.</p>
      </div>

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
              {demoExtractedMeds.map(med => (
                <tr key={med.id} className="hover:bg-gray-50/80 transition-colors">
                  <td className="px-6 py-4">
                    <span className="font-medium text-[#17211B]">{med.name}</span>
                    <span className="block text-xs text-[#66736B] mt-0.5">{med.route}</span>
                  </td>
                  <td className="px-6 py-4">{med.dose}</td>
                  <td className="px-6 py-4">{med.freq}</td>
                  <td className="px-6 py-4 text-[#66736B]">{med.intendedDuration}</td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-[#66736B] hover:text-[#087F5B] p-1.5 rounded hover:bg-[#E8F5EF] transition-colors inline-flex"><Edit2 size={16}/></button>
                    <button className="text-[#66736B] hover:text-red-600 p-1.5 ml-1 rounded hover:bg-red-50 transition-colors inline-flex"><Trash2 size={16}/></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-4 border-t border-[#DCE5DF] bg-white flex justify-center rounded-b-xl">
          <Button variant="ghost" size="sm" icon={Plus}>Add Medication Manually</Button>
        </div>
      </Card>

      <div className="flex justify-between items-center bg-white shadow-sm p-6 rounded-xl border border-[#DCE5DF]">
        <div className="flex items-start gap-4 max-w-2xl">
          <div className="w-10 h-10 rounded-full bg-[#E8F5EF] flex items-center justify-center shrink-0">
             <ShieldCheck className="text-[#087F5B]" size={20} />
          </div>
          <div>
            <h3 className="font-semibold text-[#17211B] mb-1">Ready for Safety Analysis</h3>
            <p className="text-sm text-[#66736B] leading-relaxed">
              Mediguard will compare these <span className="font-semibold text-[#17211B]">{demoExtractedMeds.length} new medications</span> against the patient's existing active medications, known allergies, and active diagnoses.
            </p>
          </div>
        </div>
        <div className="shrink-0 ml-6">
          <Button 
            size="lg"
            onClick={handleRunSafetyCheck} 
            disabled={isAnalyzing}
            className="min-w-[200px]"
          >
            {isAnalyzing ? (
              <><Loader2 size={18} className="animate-spin mr-2" /> Analyzing...</>
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

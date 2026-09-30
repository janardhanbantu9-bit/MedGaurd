// @ts-nocheck
import React from 'react';
import { X, Info, Pill, Activity, BookOpen } from 'lucide-react';
import { Badge, Button } from '../components/ui';

const FindingDetailPanel = ({ finding, onClose }) => {
  if (!finding) return null;

  const isHigh = finding.severity === 'high';
  const isReview = finding.severity === 'review';
  const isSafe = finding.severity === 'safe';

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity animate-in fade-in"
        onClick={onClose}
      />
      <div className="fixed inset-y-0 right-0 w-full max-w-2xl bg-white shadow-2xl z-50 flex flex-col animate-in slide-in-from-right-8 duration-300 border-l border-[#DCE5DF]">

        {/* Header */}
        <div className={`px-8 py-6 border-b flex items-start justify-between
          ${isHigh ? 'bg-red-50/50 border-red-100' : isReview ? 'bg-amber-50/50 border-amber-100' : 'bg-emerald-50/50 border-emerald-100'}
        `}>
          <div className="flex items-start gap-4">
             <div className={`mt-1 p-2.5 rounded-full bg-white shadow-sm shrink-0
               ${isHigh ? 'text-red-600' : isReview ? 'text-amber-600' : 'text-emerald-600'}
             `}>
                <finding.icon size={24} strokeWidth={2.5} />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-[#66736B]">{finding.category}</span>
                  <Badge variant={isHigh ? 'red' : isReview ? 'amber' : 'green'}>{finding.status}</Badge>
                </div>
                <h2 className="text-2xl font-semibold text-[#17211B] leading-tight">{finding.title}</h2>
              </div>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-700 hover:bg-white rounded-full transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8">

           <div className="mb-8">
             <h3 className="text-sm font-semibold text-[#17211B] uppercase tracking-wider mb-3">Detected Entities</h3>
             <div className="flex flex-wrap gap-2">
               {finding.affectedMeds.map((med, idx) => (
                 <div key={idx} className="flex items-center gap-2 bg-gray-50 border border-[#DCE5DF] px-3 py-1.5 rounded-lg text-sm font-medium text-[#17211B]">
                   <Pill size={14} className="text-[#66736B]"/> {med}
                 </div>
               ))}
               {finding.patientContext && finding.patientContext.map((ctx, idx) => (
                 <div key={idx} className="flex items-center gap-2 bg-gray-50 border border-[#DCE5DF] px-3 py-1.5 rounded-lg text-sm font-medium text-[#17211B]">
                   <Activity size={14} className="text-[#66736B]"/> {ctx}
                 </div>
               ))}
             </div>
           </div>

           <div className="space-y-8">
             <section>
               <h3 className="text-sm font-semibold text-[#17211B] uppercase tracking-wider mb-2">Summary</h3>
               <p className="text-[#17211B] leading-relaxed">{finding.summary}</p>
             </section>

             {finding.mechanism && finding.mechanism !== 'N/A' && (
               <section>
                 <h3 className="text-sm font-semibold text-[#17211B] uppercase tracking-wider mb-2">Mechanism of Action / Conflict</h3>
                 <p className="text-[#66736B] leading-relaxed">{finding.mechanism}</p>
               </section>
             )}

             <section className="bg-blue-50/50 border border-blue-100 rounded-xl p-5">
               <h3 className="text-sm font-semibold text-blue-900 uppercase tracking-wider mb-2 flex items-center gap-2">
                  <Info size={16} /> Clinical Considerations
               </h3>
               <p className="text-blue-800 text-sm leading-relaxed">{finding.clinicalConsiderations}</p>
             </section>

             <section>
               <h3 className="text-sm font-semibold text-[#17211B] uppercase tracking-wider mb-2">Recommended Action</h3>
               <div className={`p-4 rounded-lg font-medium border
                 ${isHigh ? 'bg-red-50 text-red-800 border-red-200' : 
                   isReview ? 'bg-amber-50 text-amber-800 border-amber-200' : 
                   'bg-emerald-50 text-emerald-800 border-emerald-200'}
               `}>
                 {finding.action}
               </div>
             </section>
           </div>

           <div className="mt-12 pt-6 border-t border-[#DCE5DF]">
              <h3 className="text-xs font-semibold text-[#66736B] uppercase tracking-wider mb-2">Evidence & Source</h3>
              <p className="text-sm text-[#66736B] flex items-center gap-2">
                <BookOpen size={14} />
                {finding.evidenceSource}
              </p>
           </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-[#DCE5DF] bg-gray-50 flex justify-between items-center shrink-0">
           <p className="text-xs text-[#66736B] max-w-sm">
             Clinical decision support. Final decisions remain with a qualified healthcare professional.
           </p>
           <Button variant="outline" onClick={onClose}>Close Detail</Button>
        </div>
      </div>
    </>
  );
};

export default FindingDetailPanel;

// @ts-nocheck
import React from 'react';
import { Database, AlertTriangle, AlertCircle, ChevronRight } from 'lucide-react';
import { Badge, Button, Card } from '../components/ui';

const AnalysisScreen = ({ analysis, setSelectedFinding, setView }) => {
  if (!analysis) {
    return (
      <div className="p-8 max-w-3xl mx-auto text-center">
        <h1 className="text-2xl font-semibold text-[#17211B] mb-2">No analysis yet</h1>
        <p className="text-[#66736B] mb-6">Review a prescription to see your safety findings here.</p>
        <Button onClick={() => setView('input-rx')}>Scan a Prescription</Button>
      </div>
    );
  }

  const findings = analysis.findings;
  const highRiskCount = analysis.summary.high;
  const reviewCount = analysis.summary.review;

  return (
    <div className="p-8 max-w-5xl mx-auto animate-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-[#17211B] mb-3 tracking-tight">Your safety check</h1>
        {analysis.persistence?.saved === false && <p className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">{analysis.persistence.reason}</p>}

        {/* Summary Metrics */}
        <div className="flex gap-4 mt-6">
          <div className="bg-white border border-[#DCE5DF] rounded-lg p-4 flex-1 flex items-center gap-4 shadow-sm">
            <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center">
              <Database className="text-gray-400" size={20}/>
            </div>
            <div>
              <div className="text-2xl font-semibold text-[#17211B]">{analysis.checksPerformed}</div>
              <div className="text-xs text-[#66736B] uppercase tracking-wider font-medium">Checks Performed</div>
            </div>
          </div>

          <div className="bg-white border border-red-200 rounded-lg p-4 flex-1 flex items-center gap-4 shadow-sm relative overflow-hidden">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500"></div>
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
              <AlertTriangle className="text-red-500" size={20}/>
            </div>
            <div>
              <div className="text-2xl font-semibold text-[#17211B]">{highRiskCount}</div>
              <div className="text-xs text-red-700 uppercase tracking-wider font-medium">High Risk Findings</div>
            </div>
          </div>

          <div className="bg-white border border-amber-200 rounded-lg p-4 flex-1 flex items-center gap-4 shadow-sm relative overflow-hidden">
             <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-400"></div>
            <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center">
              <AlertCircle className="text-amber-500" size={20}/>
            </div>
            <div>
              <div className="text-2xl font-semibold text-[#17211B]">{reviewCount}</div>
              <div className="text-xs text-amber-700 uppercase tracking-wider font-medium">Require Review</div>
            </div>
          </div>
        </div>

        {analysis.warnings?.length > 0 && (
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            <ul className="list-disc pl-5 space-y-1">
              {analysis.warnings.map((w, i) => <li key={i}>{w}</li>)}
            </ul>
          </div>
        )}
      </div>

      <div className="space-y-4">
        <h2 className="text-sm font-semibold text-[#66736B] uppercase tracking-wider mb-4 border-b border-[#DCE5DF] pb-2">
          Detailed Findings
        </h2>

        {findings.map(finding => {
          const isHigh = finding.severity === 'high';
          const isReview = finding.severity === 'review';
          const isSafe = finding.severity === 'safe';

          let borderClass = 'border-[#DCE5DF] hover:border-gray-300';
          let iconBg = 'bg-gray-100';
          let iconColor = 'text-gray-500';

          if (isHigh) {
            borderClass = 'border-red-200 hover:border-red-300';
            iconBg = 'bg-red-50';
            iconColor = 'text-red-600';
          } else if (isReview) {
            borderClass = 'border-amber-200 hover:border-amber-300';
            iconBg = 'bg-amber-50';
            iconColor = 'text-amber-600';
          } else if (isSafe) {
            borderClass = 'border-emerald-200 hover:border-emerald-300';
            iconBg = 'bg-emerald-50';
            iconColor = 'text-emerald-600';
          }

          return (
            <Card 
              key={finding.id} 
              onClick={() => setSelectedFinding(finding)}
              className={`transition-all duration-200 ${borderClass}`}
            >
              <div className="flex items-start gap-4">
                <div className={`mt-1 p-2.5 rounded-full ${iconBg} ${iconColor} shrink-0`}>
                  <finding.icon size={20} strokeWidth={2.5} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-xs font-semibold uppercase tracking-wider text-[#66736B]">{finding.category}</span>
                    <span className="text-gray-300">•</span>
                    <Badge variant={isHigh ? 'red' : isReview ? 'amber' : 'green'}>{finding.status}</Badge>
                  </div>

                  <h3 className="text-lg font-semibold text-[#17211B] mb-2">{finding.title}</h3>
                  <p className="text-sm text-[#66736B] line-clamp-2 leading-relaxed mb-4 max-w-3xl">
                    {finding.summary}
                  </p>

                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                       <span className="text-xs text-[#66736B]">Involves:</span>
                       <div className="flex gap-1.5">
                         {finding.affectedMeds.map((med, idx) => (
                           <span key={idx} className="text-xs font-medium bg-gray-100 text-gray-700 px-2 py-0.5 rounded border border-gray-200">
                             {med}
                           </span>
                         ))}
                       </div>
                    </div>
                  </div>
                </div>

                <div className="shrink-0 flex items-center justify-center h-full pt-4">
                   <Button variant="ghost" size="sm" icon={ChevronRight} className="text-[#087F5B]">View Details</Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default AnalysisScreen;

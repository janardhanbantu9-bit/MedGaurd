// @ts-nocheck
import React from 'react';
import { Database, AlertTriangle, AlertCircle, CheckCircle2, Pill, ChevronRight } from 'lucide-react';
import { Badge, Button, Card } from '../components/ui';
import { demoFindings } from '../data/mockData';

const AnalysisScreen = ({ setSelectedFinding }) => {
  const highRiskCount = demoFindings.filter(f => f.severity === 'high').length;
  const reviewCount = demoFindings.filter(f => f.severity === 'review').length;
  const safeCount = demoFindings.filter(f => f.severity === 'safe').length;

  return (
    <div className="p-8 max-w-5xl mx-auto animate-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-[#17211B] mb-3 tracking-tight">Medication Safety Analysis</h1>

        {/* Summary Metrics */}
        <div className="flex gap-4 mt-6">
          <div className="bg-white border border-[#DCE5DF] rounded-lg p-4 flex-1 flex items-center gap-4 shadow-sm">
            <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center">
              <Database className="text-gray-400" size={20}/>
            </div>
            <div>
              <div className="text-2xl font-semibold text-[#17211B]">6</div>
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
      </div>

      <div className="space-y-4">
        <h2 className="text-sm font-semibold text-[#66736B] uppercase tracking-wider mb-4 border-b border-[#DCE5DF] pb-2">
          Detailed Findings
        </h2>

        {demoFindings.map(finding => {
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

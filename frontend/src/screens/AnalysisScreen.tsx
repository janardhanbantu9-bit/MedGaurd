// @ts-nocheck
import React from 'react';
import { Database, AlertTriangle, AlertCircle, CheckCircle2, ChevronRight } from 'lucide-react';
import { Badge, Button, Card } from '../components/ui';

const AnalysisScreen = ({ analysisResult, setSelectedFinding }) => {
  const findings = analysisResult?.findings || [];
  const highRiskCount = analysisResult?.summary?.high ?? 0;
  const reviewCount = analysisResult?.summary?.review ?? 0;
  const safeCount = analysisResult?.summary?.safe ?? 0;
  const checksPerformed = Math.max(0, highRiskCount + reviewCount + safeCount);

  return (
    <div className="p-8 max-w-5xl mx-auto animate-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-[#17211B] mb-3 tracking-tight">Medication Safety Analysis</h1>
        <p className="text-[#66736B]">Live backend result from analysis <span className="font-mono text-xs">{analysisResult?.analysisId}</span>.</p>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-white border border-[#DCE5DF] rounded-lg p-4 flex items-center gap-4 shadow-sm">
            <Database className="text-gray-400" size={20}/>
            <div><div className="text-2xl font-semibold">{checksPerformed}</div><div className="text-xs text-[#66736B] uppercase tracking-wider font-medium">Findings returned</div></div>
          </div>
          <div className="bg-white border border-red-200 rounded-lg p-4 flex items-center gap-4 shadow-sm relative overflow-hidden">
            <AlertTriangle className="text-red-500" size={20}/>
            <div><div className="text-2xl font-semibold">{highRiskCount}</div><div className="text-xs text-red-700 uppercase tracking-wider font-medium">High Risk</div></div>
          </div>
          <div className="bg-white border border-amber-200 rounded-lg p-4 flex items-center gap-4 shadow-sm relative overflow-hidden">
            <AlertCircle className="text-amber-500" size={20}/>
            <div><div className="text-2xl font-semibold">{reviewCount}</div><div className="text-xs text-amber-700 uppercase tracking-wider font-medium">Require Review</div></div>
          </div>
          <div className="bg-white border border-emerald-200 rounded-lg p-4 flex items-center gap-4 shadow-sm relative overflow-hidden">
            <CheckCircle2 className="text-emerald-600" size={20}/>
            <div><div className="text-2xl font-semibold">{safeCount}</div><div className="text-xs text-emerald-700 uppercase tracking-wider font-medium">Passed</div></div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-sm font-semibold text-[#66736B] uppercase tracking-wider mb-4 border-b border-[#DCE5DF] pb-2">Detailed Findings</h2>

        {findings.length === 0 ? (
          <Card className="border-dashed">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-[#E8F5EF] flex items-center justify-center">
                <CheckCircle2 className="text-[#087F5B]" size={20} />
              </div>
              <div>
                <h3 className="font-semibold text-[#17211B]">Analysis pipeline connected</h3>
                <p className="text-sm text-[#66736B] mt-1">No safety findings were generated yet because the deterministic safety rules are the next backend layer. This screen intentionally does not invent warnings.</p>
              </div>
            </div>
          </Card>
        ) : (
          findings.map((finding) => {
            const isHigh = finding.severity === 'high';
            const isReview = finding.severity === 'review';
            const variant = isHigh ? 'red' : isReview ? 'amber' : 'green';
            return (
              <Card key={finding.id || `${finding.category}-${finding.title}`} onClick={() => setSelectedFinding(finding)} className={isHigh ? 'border-red-200' : isReview ? 'border-amber-200' : 'border-emerald-200'}>
                <div className="flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-xs font-semibold uppercase tracking-wider text-[#66736B]">{finding.category}</span>
                      <Badge variant={variant}>{finding.status || (isHigh ? 'High Risk' : isReview ? 'Needs Review' : 'Passed')}</Badge>
                    </div>
                    <h3 className="text-lg font-semibold text-[#17211B] mb-2">{finding.title}</h3>
                    <p className="text-sm text-[#66736B] line-clamp-2 leading-relaxed">{finding.summary}</p>
                  </div>
                  <Button variant="ghost" size="sm" icon={ChevronRight} className="text-[#087F5B]">View Details</Button>
                </div>
              </Card>
            );
          })
        )}
      </div>

      <div className="mt-8 text-xs text-[#66736B]">Clinical decision support. Final decisions remain with a qualified healthcare professional.</div>
    </div>
  );
};

export default AnalysisScreen;

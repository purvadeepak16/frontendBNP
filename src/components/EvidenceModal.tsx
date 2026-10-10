import React from 'react';
import { X, BookOpen, ExternalLink, ShieldAlert, CheckCircle, HelpCircle } from 'lucide-react';
import { ComplianceResultItem } from '../types';

interface EvidenceModalProps {
  item: ComplianceResultItem | null;
  onClose: () => void;
}

export const EvidenceModal: React.FC<EvidenceModalProps> = ({ item, onClose }) => {
  if (!item) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs">
      <div className="w-full max-w-2xl rounded-xl border border-slate-700 bg-slate-900 shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-950/60 border border-blue-800/40 text-blue-400">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-slate-100 text-base">Regulatory Evidence Inspector</h3>
                <span className="text-xs text-slate-400 font-mono">[{item.jurisdiction}]</span>
              </div>
              <p className="text-xs text-slate-400">{item.document_name} · Page {item.page ?? 'N/A'}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-6 space-y-5">
          {/* Status Bar */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs">
            <span className="text-slate-400">Compliance Conclusion</span>
            <div className="flex items-center gap-1.5">
              {item.conclusion === 'conflict_identified' && (
                <>
                  <ShieldAlert className="h-4 w-4 text-rose-400" />
                  <span className="font-semibold text-rose-400">Conflict Identified</span>
                </>
              )}
              {item.conclusion === 'no_conflict_identified' && (
                <>
                  <CheckCircle className="h-4 w-4 text-emerald-400" />
                  <span className="font-semibold text-emerald-400">No Conflict Identified</span>
                </>
              )}
              {item.conclusion === 'insufficient_evidence' && (
                <>
                  <HelpCircle className="h-4 w-4 text-amber-400" />
                  <span className="font-semibold text-amber-400">Insufficient Evidence</span>
                </>
              )}
            </div>
          </div>

          {/* Clause Title */}
          <div>
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Applicable Clause / Standard</span>
            <p className="mt-1 font-mono text-sm text-blue-300 font-medium bg-slate-950/80 p-2.5 rounded border border-slate-800">
              {item.clause}
            </p>
          </div>

          {/* Verbatim Regulatory Quotation */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Direct Source Quotation (Unmodified Legal Text)</span>
              <span className="text-xs text-slate-500">Source: {item.document_name}</span>
            </div>
            <div className="rounded-lg border border-slate-700/80 bg-slate-950 p-4 text-xs font-mono text-slate-300 leading-relaxed border-l-2 border-l-blue-500">
              "{item.evidence_quote}"
            </div>
          </div>

          {/* AI-Generated Analysis */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Legal Impact Analysis (AI-Assisted Interpretation)</span>
              <span className="text-xs text-amber-400/80">Subject to Human Review</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed bg-slate-800/40 p-3 rounded border border-slate-700/50">
              {item.impact_summary}
            </p>
          </div>

          {/* Recommended Action */}
          <div>
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Recommended Next Action</span>
            <p className="mt-1 text-xs text-slate-200 bg-slate-800/60 p-3 rounded border border-slate-700">
              {item.recommended_action}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-800 px-6 py-4 bg-slate-950/50">
          <span className="text-xs text-slate-500">Classification: Strictly Grounded Retrieval</span>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};

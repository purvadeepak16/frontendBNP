import React, { useEffect, useState } from 'react';
import {
  Grid,
  ShieldAlert,
  CheckCircle,
  HelpCircle,
  Filter,
  Info,
  ExternalLink
} from 'lucide-react';
import { getAssessmentHistory } from '../services/api';
import { AssessmentRecord, ComplianceResultItem, Jurisdiction } from '../types';
import { HumanReviewBanner } from '../components/HumanReviewBanner';
import { EvidenceModal } from '../components/EvidenceModal';

const JURISDICTIONS: Jurisdiction[] = ['EMIR', 'UKEMIR', 'ASIC', 'MAS', 'HKMA'];

const CHANGE_CATEGORIES = [
  { id: 'deadline', label: 'Reporting Window (T+1 vs T+2)', fieldMatch: ['deadline', 'window', 't+1', 't+2', '1.3'] },
  { id: 'uti', label: 'UTI Formatting (52-Char Alphanumeric)', fieldMatch: ['uti', '2.1', 'transaction identifier'] },
  { id: 'upi', label: 'UPI Implementation (ISO 4914)', fieldMatch: ['upi', '2.15', 'product identifier'] },
  { id: 'counterparty', label: 'Counterparty Masking & Secrecy', fieldMatch: ['counterparty', 'masking', 'lei', '1.2'] },
  { id: 'timestamp', label: 'Execution Timestamp (ISO 8601 UTC)', fieldMatch: ['timestamp', '2.89', 'timezone'] },
  { id: 'direction', label: 'Direction Enumeration (BYER/SELR)', fieldMatch: ['direction', '1.15', 'byer', 'make'] }
];

export const ConflictHeatmap: React.FC = () => {
  const [history, setHistory] = useState<AssessmentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCellEvidence, setSelectedCellEvidence] = useState<ComplianceResultItem | null>(null);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const data = await getAssessmentHistory();
      setHistory(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Find the most recent compliance finding for a jurisdiction and category
  const getCellData = (jur: Jurisdiction, category: typeof CHANGE_CATEGORIES[0]) => {
    for (const record of history) {
      const match = record.results.find(r => {
        if (r.jurisdiction !== jur) return false;
        const targetString = `${record.parsed_cr.affected_field} ${r.clause} ${r.impact_summary}`.toLowerCase();
        return category.fieldMatch.some(k => targetString.includes(k));
      });
      if (match) {
        return { item: match, recordId: record.assessment_id, recordTitle: record.cr_title };
      }
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pb-2 border-b border-slate-800">
        <h1 className="text-xl font-bold text-white tracking-tight">
          Cross-Jurisdictional Conflict Heatmap
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Matrix view of regulatory harmonization and conflict hot-spots across monitored regimes.
        </p>
      </div>

      <HumanReviewBanner />

      {/* Legend & Guidance */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-xs text-xs">
        <div className="flex items-center gap-2">
          <Info className="h-4 w-4 text-blue-400" />
          <span className="text-slate-300 font-medium">Click any active cell to inspect verified regulatory evidence and clauses:</span>
        </div>
        <div className="flex items-center gap-5">
          <div className="flex items-center gap-1.5 text-rose-400">
            <div className="w-3 h-3 rounded-xs bg-rose-950 border border-rose-600/60" />
            <span className="font-medium">Conflict Identified</span>
          </div>
          <div className="flex items-center gap-1.5 text-emerald-400">
            <div className="w-3 h-3 rounded-xs bg-emerald-950 border border-emerald-600/60" />
            <span className="font-medium">No Conflict Identified</span>
          </div>
          <div className="flex items-center gap-1.5 text-amber-400">
            <div className="w-3 h-3 rounded-xs bg-amber-950 border border-amber-600/60" />
            <span className="font-medium">Insufficient Evidence</span>
          </div>
        </div>
      </div>

      {/* The Matrix Heatmap Table */}
      <div className="rounded-xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950">
                <th className="py-3.5 px-5 font-semibold text-slate-300 border-r border-slate-800 w-[160px] sticky left-0 bg-slate-950 z-10">
                  Jurisdiction
                </th>
                {CHANGE_CATEGORIES.map(col => (
                  <th key={col.id} className="py-3.5 px-4 font-semibold text-slate-300 min-w-[170px] text-center border-r border-slate-800/80">
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {JURISDICTIONS.map(jur => (
                <tr key={jur} className="hover:bg-slate-850/40 transition-colors">
                  {/* Row Header (Jurisdiction) */}
                  <td className="py-4 px-5 font-mono font-bold text-slate-200 border-r border-slate-800 sticky left-0 bg-slate-900 z-10">
                    <div className="flex items-center justify-between">
                      <span>{jur}</span>
                      <span className="text-[10px] text-slate-500 font-sans font-normal">
                        {jur === 'EMIR' && 'ESMA'}
                        {jur === 'UKEMIR' && 'FCA/BoE'}
                        {jur === 'ASIC' && 'Australia'}
                        {jur === 'MAS' && 'Singapore'}
                        {jur === 'HKMA' && 'Hong Kong'}
                      </span>
                    </div>
                  </td>

                  {/* Matrix Cells */}
                  {CHANGE_CATEGORIES.map(cat => {
                    const data = getCellData(jur, cat);

                    if (!data) {
                      return (
                        <td key={cat.id} className="py-3 px-3 text-center border-r border-slate-800/60">
                          <div className="py-3 px-2 rounded-lg bg-slate-950/40 border border-slate-800/40 text-slate-600 text-[11px] font-mono">
                            Not Evaluated
                          </div>
                        </td>
                      );
                    }

                    const conclusion = data.item.conclusion;
                    const isConflict = conclusion === 'conflict_identified';
                    const isNoConflict = conclusion === 'no_conflict_identified';
                    const isInsufficient = conclusion === 'insufficient_evidence';

                    return (
                      <td key={cat.id} className="py-3 px-3 border-r border-slate-800/60">
                        <button
                          onClick={() => setSelectedCellEvidence(data.item)}
                          className={`w-full text-left p-2.5 rounded-lg border transition-all cursor-pointer group ${
                            isConflict
                              ? 'bg-rose-950/40 border-rose-800/60 hover:bg-rose-900/50 hover:border-rose-500'
                              : isNoConflict
                              ? 'bg-emerald-950/40 border-emerald-800/60 hover:bg-emerald-900/50 hover:border-emerald-500'
                              : 'bg-amber-950/30 border-amber-800/50 hover:bg-amber-900/40 hover:border-amber-500'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span
                              className={`text-[11px] font-semibold flex items-center gap-1 ${
                                isConflict
                                  ? 'text-rose-400'
                                  : isNoConflict
                                  ? 'text-emerald-400'
                                  : 'text-amber-400'
                              }`}
                            >
                              {isConflict && <ShieldAlert className="h-3.5 w-3.5" />}
                              {isNoConflict && <CheckCircle className="h-3.5 w-3.5" />}
                              {isInsufficient && <HelpCircle className="h-3.5 w-3.5" />}
                              <span>
                                {isConflict ? 'Conflict' : isNoConflict ? 'Compliant' : 'Uncertain'}
                              </span>
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono">
                              p.{data.item.page ?? 'N/A'}
                            </span>
                          </div>
                          <div className="mt-1 text-[10px] text-slate-300 font-mono truncate group-hover:text-white">
                            {data.item.clause}
                          </div>
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Heatmap Evidence Drawer / Modal */}
      <EvidenceModal
        item={selectedCellEvidence}
        onClose={() => setSelectedCellEvidence(null)}
      />
    </div>
  );
};

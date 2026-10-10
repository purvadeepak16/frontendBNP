import React, { useEffect, useState } from 'react';
import {
  BookOpen,
  Search,
  Filter,
  Layers,
  ExternalLink,
  ShieldAlert,
  HelpCircle,
  CheckCircle,
  FileText
} from 'lucide-react';
import { getRegulatoryCorpus } from '../services/api';
import { RegulatoryClause, Jurisdiction } from '../types';
import { HumanReviewBanner } from '../components/HumanReviewBanner';
import { EvidenceModal } from '../components/EvidenceModal';

const JURISDICTIONS = ['ALL', 'EMIR', 'UKEMIR', 'ASIC', 'MAS', 'HKMA'];

export const EvidenceExplorer: React.FC = () => {
  const [clauses, setClauses] = useState<RegulatoryClause[]>([]);
  const [selectedJurisdiction, setSelectedJurisdiction] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeClauseModal, setActiveClauseModal] = useState<any | null>(null);

  useEffect(() => {
    loadClauses();
  }, [selectedJurisdiction, searchQuery]);

  const loadClauses = async () => {
    try {
      setLoading(true);
      const data = await getRegulatoryCorpus(
        selectedJurisdiction === 'ALL' ? undefined : selectedJurisdiction,
        searchQuery || undefined
      );
      setClauses(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pb-2 border-b border-slate-800">
        <h1 className="text-xl font-bold text-white tracking-tight">
          Regulatory Evidence & Reasoning Explorer
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Inspect verified source clauses across ASIC, EMIR, UK EMIR, MAS, and HKMA regulatory libraries.
        </p>
      </div>

      <HumanReviewBanner />

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-xs">
        {/* Jurisdiction Filter Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
          {JURISDICTIONS.map(jur => {
            const isActive = selectedJurisdiction === jur;
            return (
              <button
                key={jur}
                onClick={() => setSelectedJurisdiction(jur)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800/80'
                }`}
              >
                {jur}
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative min-w-[280px]">
          <Search className="h-4 w-4 absolute left-3 top-2.5 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search clauses, fields, keywords..."
            className="w-full pl-9 pr-3.5 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Clauses Grid */}
      {loading ? (
        <div className="p-16 text-center text-xs text-slate-400">Loading regulatory corpus...</div>
      ) : clauses.length === 0 ? (
        <div className="p-12 text-center text-slate-400 bg-slate-900 rounded-xl border border-slate-800">
          <BookOpen className="h-8 w-8 mx-auto mb-2 text-slate-600" />
          <p className="text-sm font-medium text-slate-300">No regulatory clauses match the search filter</p>
          <p className="text-xs text-slate-500 mt-1">Try broadening your search term or switching jurisdiction tabs.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {clauses.map((cl, idx) => (
            <div
              key={idx}
              className="rounded-xl bg-slate-900 border border-slate-800 p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-slate-700 transition-colors"
            >
              <div>
                {/* Jurisdiction & Document Header */}
                <div className="flex items-center justify-between pb-2.5 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-blue-400">
                      [{cl.jurisdiction}]
                    </span>
                    <span className="text-xs text-slate-400 truncate max-w-[220px]">
                      {cl.document_name}
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-500">
                    Page {cl.page}
                  </span>
                </div>

                {/* Clause Title */}
                <h3 className="font-semibold text-xs text-slate-200 mt-3 font-mono">
                  {cl.clause}
                </h3>

                {/* Verbatim Regulatory Quotation */}
                <div className="mt-2.5 rounded-lg bg-slate-950 border border-slate-800/80 p-3 text-xs font-mono text-slate-300 leading-relaxed border-l-2 border-l-blue-500">
                  "{cl.text}"
                </div>

                {/* Keywords list */}
                {cl.keywords && cl.keywords.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {cl.keywords.map((kw, ki) => (
                      <span key={ki} className="text-[10px] text-slate-400 bg-slate-800/60 px-1.5 py-0.5 rounded">
                        #{kw}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Card Footer */}
              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                <span className="text-[10px] text-slate-500">
                  Verified Ingestion: PyMuPDF / OpenPyXL
                </span>
                <button
                  onClick={() =>
                    setActiveClauseModal({
                      jurisdiction: cl.jurisdiction,
                      document_name: cl.document_name,
                      clause: cl.clause,
                      page: cl.page,
                      conclusion: 'no_conflict_identified',
                      impact_summary: `Direct regulatory mandate grounded in ${cl.document_name}.`,
                      evidence_quote: cl.text,
                      recommended_action: `Cross-reference with ${cl.jurisdiction} Trade Repository technical specifications.`,
                      rule_type: 'source_library',
                      severity: 'informational'
                    })
                  }
                  className="text-xs text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1"
                >
                  <span>Detailed View</span>
                  <ExternalLink className="h-3 w-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      <EvidenceModal
        item={activeClauseModal}
        onClose={() => setActiveClauseModal(null)}
      />
    </div>
  );
};

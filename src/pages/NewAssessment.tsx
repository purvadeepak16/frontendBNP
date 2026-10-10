import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Send,
  Sparkles,
  AlertCircle,
  HelpCircle,
  CheckCircle,
  ChevronRight,
  Bookmark
} from 'lucide-react';
import { createAssessment } from '../services/api';
import { Jurisdiction } from '../types';
import { HumanReviewBanner } from '../components/HumanReviewBanner';

const PRESET_TEMPLATES = [
  {
    name: 'T+2 Reporting Cutoff Harmonization',
    title: 'Harmonize Global Derivative Batch Reporting Cutoff to T+2',
    description: 'We propose adjusting the automated end-of-day trade submission workflow to dispatch all OTC derivative trade records on a T+2 batch cadence rather than the current T+1 window, to simplify cross-time-zone reconciliations with offshore execution desks.',
    field: 'Field 1.3 (Reporting Deadline / Window)',
    currentVal: 'T+1 by 23:59 UTC',
    proposedVal: 'T+2 by 23:59 Local Time',
    jurisdictions: ['EMIR', 'UKEMIR', 'ASIC', 'MAS', 'HKMA'] as Jurisdiction[]
  },
  {
    name: 'UTI CPMI-IOSCO Special Characters',
    title: 'Refactor Unique Transaction Identifier Generation with Hyphens',
    description: 'Refactor our internal trade identifier generator to embed booking unit sub-codes separated by hyphens (e.g., BNP-PAR-2024-00192) and mixed-case letters across all trade repositories.',
    field: 'Field 2.1 (Unique Transaction Identifier / UTI)',
    currentVal: 'Standard CPMI-IOSCO 52-character uppercase alphanumeric',
    proposedVal: 'Custom 64-character format including hyphens and lowercase entity codes',
    jurisdictions: ['EMIR', 'UKEMIR', 'ASIC', 'MAS', 'HKMA'] as Jurisdiction[]
  },
  {
    name: 'Counterparty Masking for APAC Secrecy',
    title: 'Enable Counterparty LEI Masking Under Singapore Banking Secrecy',
    description: 'Enable automated masking of client legal entity identifiers for Singapore and APAC non-financial commercial counterparties when statutory banking secrecy restricts public disclosure.',
    field: 'Field 1.2 (Counterparty 2 Identifier / LEI)',
    currentVal: 'Mandatory 20-character LEI verified in GLEIF',
    proposedVal: 'Masked synthetic identifier with internal mapping table',
    jurisdictions: ['EMIR', 'MAS', 'HKMA'] as Jurisdiction[]
  },
  {
    name: 'Execution Timestamp Local Offset',
    title: 'Switch Execution Timestamp from UTC to Paris Local Time',
    description: 'Update the trade capture adapter to record execution timestamp in Central European Time with local numeric offset (+01:00) rather than standard UTC Z notation.',
    field: 'Field 2.89 (Execution Timestamp)',
    currentVal: 'ISO 8601 UTC (YYYY-MM-DDThh:mm:ssZ)',
    proposedVal: 'ISO 8601 with local Paris timezone offset (+01:00)',
    jurisdictions: ['EMIR', 'UKEMIR', 'ASIC'] as Jurisdiction[]
  },
  {
    name: 'Direction Tagging MAKE / TAKE',
    title: 'Pass Electronic Liquidity Venue MAKE/TAKE Direction Tags',
    description: 'Directly pass execution venue fill sides (MAKE or TAKE) into the regulatory trade direction field instead of mapping to BYER or SELR.',
    field: 'Field 1.15 (Direction of Trade)',
    currentVal: 'Statutory BYER or SELR',
    proposedVal: 'Electronic platform MAKE or TAKE',
    jurisdictions: ['EMIR', 'UKEMIR'] as Jurisdiction[]
  }
];

const ALL_JURISDICTIONS: Jurisdiction[] = ['EMIR', 'UKEMIR', 'ASIC', 'MAS', 'HKMA'];

export const NewAssessment: React.FC = () => {
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [affectedField, setAffectedField] = useState('');
  const [currentValue, setCurrentValue] = useState('');
  const [proposedValue, setProposedValue] = useState('');
  const [selectedJurisdictions, setSelectedJurisdictions] = useState<Jurisdiction[]>([...ALL_JURISDICTIONS]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleJurisdiction = (jur: Jurisdiction) => {
    if (selectedJurisdictions.includes(jur)) {
      if (selectedJurisdictions.length === 1) return; // Keep at least one
      setSelectedJurisdictions(selectedJurisdictions.filter(j => j !== jur));
    } else {
      setSelectedJurisdictions([...selectedJurisdictions, jur]);
    }
  };

  const selectAllJurisdictions = () => {
    setSelectedJurisdictions([...ALL_JURISDICTIONS]);
  };

  const applyTemplate = (t: typeof PRESET_TEMPLATES[0]) => {
    setTitle(t.title);
    setDescription(t.description);
    setAffectedField(t.field);
    setCurrentValue(t.currentVal);
    setProposedValue(t.proposedVal);
    setSelectedJurisdictions(t.jurisdictions);
  };

  // Validation warnings
  const isDescriptionTooShort = description.trim().length > 0 && description.trim().length < 25;
  const isMissingField = !affectedField && description.trim().length > 30;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      setError('Please provide a Change Request description.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      const res = await createAssessment({
        title: title || 'Change Request Evaluation',
        description,
        affected_field: affectedField || undefined,
        current_value: currentValue || undefined,
        proposed_value: proposedValue || undefined,
        jurisdictions: selectedJurisdictions
      });
      navigate(`/assessment/${res.assessment_id}`);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Assessment generation failed');
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="pb-2 border-b border-slate-800">
        <h1 className="text-xl font-bold text-white tracking-tight">
          New Change Request (CR) Assessment
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Submit natural-language technical specifications to retrieve cross-jurisdictional regulatory conflicts and evidence.
        </p>
      </div>

      <HumanReviewBanner />

      {/* Preset Example Change Requests */}
      <div className="rounded-xl bg-slate-900 border border-slate-800 p-4 shadow-xs">
        <div className="flex items-center gap-2 mb-3">
          <Bookmark className="h-4 w-4 text-blue-400" />
          <h2 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Example Change Request Templates
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {PRESET_TEMPLATES.map((tpl, i) => (
            <button
              key={i}
              type="button"
              onClick={() => applyTemplate(tpl)}
              className="text-left p-3 rounded-lg bg-slate-950 border border-slate-800 hover:border-blue-500/50 hover:bg-slate-800/60 transition-all group"
            >
              <div className="font-semibold text-xs text-slate-200 group-hover:text-blue-300 transition-colors">
                {tpl.name}
              </div>
              <div className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                {tpl.title}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Submission Form */}
      <form onSubmit={handleSubmit} className="rounded-xl bg-slate-900 border border-slate-800 p-6 space-y-6 shadow-xs">
        {/* Title */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
            Change Request Title <span className="text-slate-500 font-normal">(Optional summary)</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="e.g. Standardize Derivative Submission Batch Window to T+2"
            className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        {/* Natural Language Change Request Description */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Natural-Language Change Request <span className="text-rose-400">*</span>
            </label>
            <span className="text-[11px] text-slate-500">
              {description.length} characters
            </span>
          </div>
          <textarea
            rows={5}
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Describe the proposed change, system logic, timing, or technical field alteration in plain technical language. For example: 'We propose shifting our global end-of-day trade submission cutoff from T+1 23:59 UTC to T+2 23:59 local market time to accommodate regional clearing batch dependencies...'"
            className="w-full px-3.5 py-3 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors leading-relaxed"
            required
          />

          {/* Clarification prompt warning if too short */}
          {isDescriptionTooShort && (
            <div className="mt-2 flex items-center gap-2 p-2.5 rounded-lg bg-amber-950/30 border border-amber-800/40 text-amber-300 text-xs">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>
                <strong>Clarification prompt:</strong> Change request is very brief. Providing specific field names, formats, or trading scopes will improve retrieval accuracy.
              </span>
            </div>
          )}
        </div>

        {/* Technical Fields Breakdown (Optional Parameters) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-lg bg-slate-950/60 border border-slate-800/80">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              Affected Field / Parameter
            </label>
            <input
              type="text"
              value={affectedField}
              onChange={e => setAffectedField(e.target.value)}
              placeholder="e.g. Field 1.3 (Reporting Deadline)"
              className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              Current Production Baseline
            </label>
            <input
              type="text"
              value={currentValue}
              onChange={e => setCurrentValue(e.target.value)}
              placeholder="e.g. T+1 by 23:59 UTC"
              className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              Proposed Configuration
            </label>
            <input
              type="text"
              value={proposedValue}
              onChange={e => setProposedValue(e.target.value)}
              placeholder="e.g. T+2 by 23:59 Local Time"
              className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* Target Jurisdictions Selector */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Applicable Regulatory Jurisdictions
            </label>
            <button
              type="button"
              onClick={selectAllJurisdictions}
              className="text-xs text-blue-400 hover:text-blue-300 font-medium"
            >
              Select All (5)
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {ALL_JURISDICTIONS.map(jur => {
              const isSelected = selectedJurisdictions.includes(jur);
              return (
                <button
                  key={jur}
                  type="button"
                  onClick={() => toggleJurisdiction(jur)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-950 text-slate-400 border border-slate-800 hover:bg-slate-850'
                  }`}
                >
                  <span>{jur}</span>
                  {isSelected && <CheckCircle className="h-3.5 w-3.5" />}
                </button>
              );
            })}
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-800 text-rose-300 text-xs">
            {error}
          </div>
        )}

        {/* Submit Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-800">
          <span className="text-xs text-slate-500">
            Pipeline: Deterministic validation + Hybrid RAG + Grounded citation verification
          </span>
          <button
            type="submit"
            disabled={submitting || !description.trim()}
            className="flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-xs"
          >
            {submitting ? (
              <>
                <div className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Evaluating Compliance...</span>
              </>
            ) : (
              <>
                <Send className="h-3.5 w-3.5" />
                <span>Submit for Assessment</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

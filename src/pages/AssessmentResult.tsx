import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ShieldAlert,
  CheckCircle,
  HelpCircle,
  Download,
  FileSpreadsheet,
  FileText,
  ArrowLeft,
  BookOpen,
  Share2,
  ExternalLink,
  ShieldCheck,
  Save
} from 'lucide-react';
import { getAssessmentById, updateAssessmentReview, downloadExcelReport } from '../services/api';
import { AssessmentRecord, ComplianceResultItem, ReviewerStatus } from '../types';
import { HumanReviewBanner } from '../components/HumanReviewBanner';
import { EvidenceModal } from '../components/EvidenceModal';

export const AssessmentResult: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [assessment, setAssessment] = useState<AssessmentRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEvidence, setSelectedEvidence] = useState<ComplianceResultItem | null>(null);

  // Reviewer sign-off form state
  const [reviewerStatus, setReviewerStatus] = useState<ReviewerStatus>('pending_review');
  const [reviewerNotes, setReviewerNotes] = useState('');
  const [savingReview, setSavingReview] = useState(false);
  const [reviewSavedSuccess, setReviewSavedSuccess] = useState(false);

  // Text report preview modal
  const [showTextReport, setShowTextReport] = useState(false);

  useEffect(() => {
    if (id) {
      loadAssessment(id);
    }
  }, [id]);

  const loadAssessment = async (assessmentId: string) => {
    try {
      setLoading(true);
      const data = await getAssessmentById(assessmentId);
      setAssessment(data);
      setReviewerStatus(data.reviewer_status || 'pending_review');
      setReviewerNotes(data.reviewer_notes || '');
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to load assessment');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveReview = async () => {
    if (!assessment) return;
    try {
      setSavingReview(true);
      const updated = await updateAssessmentReview(assessment.assessment_id, reviewerStatus, reviewerNotes);
      setAssessment(updated);
      setReviewSavedSuccess(true);
      setTimeout(() => setReviewSavedSuccess(false), 3000);
    } catch (err: any) {
      alert('Failed to save review sign-off: ' + err.message);
    } finally {
      setSavingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="p-16 text-center space-y-3">
        <div className="h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <div className="text-xs text-slate-400">Loading regulatory assessment findings...</div>
      </div>
    );
  }

  if (error || !assessment) {
    return (
      <div className="max-w-2xl mx-auto p-8 text-center space-y-4">
        <div className="text-sm font-semibold text-rose-400">Assessment Record Not Found</div>
        <p className="text-xs text-slate-400">{error || 'The requested assessment ID does not exist.'}</p>
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-slate-800 rounded-lg hover:bg-slate-700"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Return to Dashboard</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Top Breadcrumb & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <Link
            to="/history"
            className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors border border-slate-800"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-white tracking-tight">Assessment Report</h1>
              <span className="text-xs font-mono text-blue-400 bg-blue-950/60 px-2 py-0.5 rounded border border-blue-800/40">
                {assessment.assessment_id}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Evaluated on {new Date(assessment.created_at).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Export buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => downloadExcelReport(assessment.assessment_id)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors border border-slate-700"
            title="Download Excel Spreadsheet with all evidence citations"
          >
            <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-400" />
            <span>Export Excel</span>
          </button>
          <button
            onClick={() => setShowTextReport(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors border border-slate-700"
          >
            <FileText className="h-3.5 w-3.5 text-blue-400" />
            <span>Audit Text</span>
          </button>
        </div>
      </div>

      <HumanReviewBanner
        reviewerStatus={assessment.reviewer_status}
        reviewerNotes={assessment.reviewer_notes}
      />

      {/* Change Request Context Card */}
      <div className="rounded-xl bg-slate-900 border border-slate-800 p-5 shadow-xs space-y-4">
        <div>
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Evaluated Change Request
          </span>
          <h2 className="text-base font-semibold text-white mt-1">
            {assessment.cr_title}
          </h2>
          <p className="text-xs text-slate-300 mt-1 leading-relaxed bg-slate-950 p-3 rounded-lg border border-slate-800 font-sans">
            {assessment.cr_description}
          </p>
        </div>

        {/* Parsed Technical Parameters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-3 border-t border-slate-800/80 text-xs">
          <div>
            <span className="text-slate-400">Affected Field:</span>
            <div className="font-mono text-slate-200 font-medium mt-0.5">
              {assessment.parsed_cr.affected_field}
            </div>
          </div>
          <div>
            <span className="text-slate-400">Current Production State:</span>
            <div className="font-mono text-slate-300 mt-0.5">
              {assessment.parsed_cr.current_state}
            </div>
          </div>
          <div>
            <span className="text-slate-400">Proposed Configuration:</span>
            <div className="font-mono text-blue-300 mt-0.5">
              {assessment.parsed_cr.proposed_change}
            </div>
          </div>
        </div>
      </div>

      {/* Primary Results Table */}
      <div className="rounded-xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-white">Cross-Jurisdictional Findings Matrix</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Summary: {assessment.conflict_count} Conflicts · {assessment.no_conflict_count} No Conflicts · {assessment.insufficient_evidence_count} Insufficient Evidence
            </p>
          </div>
          <Link
            to="/heatmap"
            className="text-xs text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1"
          >
            <span>View in Heatmap</span>
            <ExternalLink className="h-3 w-3" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/80 text-slate-400 font-medium">
                <th className="py-3 px-4">Jurisdiction</th>
                <th className="py-3 px-4">Conclusion</th>
                <th className="py-3 px-4">Regulation & Source Clause</th>
                <th className="py-3 px-4">Impact Explanation</th>
                <th className="py-3 px-4">Verbatim Evidence Quote</th>
                <th className="py-3 px-4">Recommended Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {assessment.results.map((item, idx) => {
                const isConflict = item.conclusion === 'conflict_identified';
                const isNoConflict = item.conclusion === 'no_conflict_identified';
                const isInsufficient = item.conclusion === 'insufficient_evidence';

                return (
                  <tr key={idx} className="hover:bg-slate-850/50 transition-colors align-top">
                    {/* Jurisdiction */}
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-200">
                      {item.jurisdiction}
                    </td>

                    {/* Conclusion with explicit text label and icon */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {isConflict && (
                        <div className="flex items-center gap-1.5 text-rose-400 font-semibold">
                          <ShieldAlert className="h-4 w-4 shrink-0" />
                          <span>Conflict Identified</span>
                        </div>
                      )}
                      {isNoConflict && (
                        <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
                          <CheckCircle className="h-4 w-4 shrink-0" />
                          <span>No Conflict Identified</span>
                        </div>
                      )}
                      {isInsufficient && (
                        <div className="flex items-center gap-1.5 text-amber-400 font-medium">
                          <HelpCircle className="h-4 w-4 shrink-0" />
                          <span>Insufficient Evidence</span>
                        </div>
                      )}
                    </td>

                    {/* Regulation & Source */}
                    <td className="py-3.5 px-4 min-w-[200px]">
                      <div className="font-medium text-blue-300 font-mono">
                        {item.clause}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {item.document_name} {item.page ? `· p.${item.page}` : ''}
                      </div>
                    </td>

                    {/* Impact Explanation */}
                    <td className="py-3.5 px-4 min-w-[220px] text-slate-300 leading-relaxed">
                      {item.impact_summary}
                    </td>

                    {/* Verbatim Evidence Quote */}
                    <td className="py-3.5 px-4 min-w-[240px]">
                      <button
                        onClick={() => setSelectedEvidence(item)}
                        className="text-left w-full p-2 rounded bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-300 hover:border-blue-500/60 hover:text-white transition-colors cursor-pointer group"
                        title="Click to inspect full verified regulatory text"
                      >
                        <div className="line-clamp-3 italic">
                          "{item.evidence_quote}"
                        </div>
                        <div className="mt-1 text-[10px] text-blue-400 group-hover:underline flex items-center gap-1">
                          <BookOpen className="h-2.5 w-2.5" />
                          <span>Inspect Full Citation</span>
                        </div>
                      </button>
                    </td>

                    {/* Recommended Action */}
                    <td className="py-3.5 px-4 min-w-[180px] text-slate-400">
                      {item.recommended_action}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Compliance Officer Sign-Off & Review Governance Panel */}
      <div className="rounded-xl bg-slate-900 border border-slate-800 p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-blue-400" />
            <h2 className="text-sm font-semibold text-white">
              Compliance Officer Review & Sign-Off
            </h2>
          </div>
          <span className="text-xs text-slate-500 font-mono">
            Audit Trail Standard: 21 CFR / MiFID II
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">
              Reviewer Decision
            </label>
            <select
              value={reviewerStatus}
              onChange={e => setReviewerStatus(e.target.value as ReviewerStatus)}
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
            >
              <option value="pending_review">Pending Review</option>
              <option value="approved">Approved — Compliant with all Rules</option>
              <option value="approved_with_conditions">Approved with Conditions (Exceptions Noted)</option>
              <option value="rejected">Rejected — Remediation Required</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-slate-400 mb-1.5">
              Legal Reasoning / Condition Notes
            </label>
            <input
              type="text"
              value={reviewerNotes}
              onChange={e => setReviewerNotes(e.target.value)}
              placeholder="e.g. Approved for MAS & HKMA desks; dual dispatch pipeline required for EMIR T+1 trades."
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          {reviewSavedSuccess ? (
            <span className="text-xs text-emerald-400 flex items-center gap-1 font-medium">
              <CheckCircle className="h-4 w-4" />
              Sign-off recorded in compliance audit log.
            </span>
          ) : (
            <span className="text-xs text-slate-500">
              Decisions are permanently watermarked in exported audit documentation.
            </span>
          )}

          <button
            onClick={handleSaveReview}
            disabled={savingReview}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-500 disabled:opacity-50 transition-colors shadow-xs"
          >
            <Save className="h-3.5 w-3.5" />
            <span>{savingReview ? 'Saving...' : 'Save Decision Sign-off'}</span>
          </button>
        </div>
      </div>

      {/* Evidence Inspector Modal */}
      <EvidenceModal
        item={selectedEvidence}
        onClose={() => setSelectedEvidence(null)}
      />

      {/* Text Audit Report Modal */}
      {showTextReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs">
          <div className="w-full max-w-3xl rounded-xl border border-slate-700 bg-slate-900 shadow-2xl flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-400" />
                <h3 className="font-semibold text-white text-base">Plain Text Audit Report</h3>
              </div>
              <button
                onClick={() => setShowTextReport(false)}
                className="text-xs text-slate-400 hover:text-white"
              >
                Close
              </button>
            </div>
            <div className="overflow-y-auto p-6 font-mono text-xs text-slate-300 leading-relaxed whitespace-pre-wrap bg-slate-950">
              {`================================================================================
BNP PARIBAS — IMPART REGULATORY COMPLIANCE ASSESSMENT REPORT
CONFIDENTIAL // DECISION-SUPPORT AUDIT TRAIL // NOT AN AUTONOMOUS LEGAL DECISION
================================================================================
Assessment ID : ${assessment.assessment_id}
Created At    : ${assessment.created_at}
Review Status : ${assessment.reviewer_status.toUpperCase()}
CR Title      : ${assessment.cr_title}
CR Description: ${assessment.cr_description}
Affected Field: ${assessment.parsed_cr.affected_field}
--------------------------------------------------------------------------------
FINDINGS SUMMARY:
  • Conflicts Identified      : ${assessment.conflict_count}
  • No Conflicts Identified   : ${assessment.no_conflict_count}
  • Insufficient Evidence     : ${assessment.insufficient_evidence_count}
--------------------------------------------------------------------------------
ATTENTION: ALL ASSESSMENTS ARE AI-GENERATED AND REQUIRE HUMAN LEGAL REVIEW.
================================================================================

DETAILED JURISDICTIONAL EVIDENCE & RECOMMENDATIONS:

` +
                assessment.results
                  .map(
                    (r, idx) =>
                      `[${idx + 1}] JURISDICTION: ${r.jurisdiction} — CONCLUSION: ${r.conclusion.toUpperCase()}\n` +
                      `    Source Document : ${r.document_name}\n` +
                      `    Clause / Rule   : ${r.clause} (Page: ${r.page ?? 'N/A'})\n` +
                      `    Impact Summary  : ${r.impact_summary}\n` +
                      `    Evidence Quote  : "${r.evidence_quote}"\n` +
                      `    Recommended Act : ${r.recommended_action}\n` +
                      `    Severity Level  : ${r.severity.toUpperCase()}\n` +
                      `--------------------------------------------------------------------------------`
                  )
                  .join('\n\n')}
            </div>
            <div className="flex items-center justify-between border-t border-slate-800 px-6 py-4 bg-slate-950">
              <span className="text-xs text-slate-500">ReportLab / Audit compatible plain text view</span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(
                    `BNP PARIBAS IMPART REPORT - ${assessment.assessment_id}\n\n${assessment.cr_title}\nConflicts: ${assessment.conflict_count}`
                  );
                  alert('Copied summary to clipboard!');
                }}
                className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-500"
              >
                Copy to Clipboard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

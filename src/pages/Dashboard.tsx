import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldAlert,
  CheckCircle,
  FileText,
  AlertTriangle,
  ArrowRight,
  PlusCircle,
  ExternalLink,
  Layers,
  Scale
} from 'lucide-react';
import { getAssessmentHistory, getHealth } from '../services/api';
import { AssessmentRecord } from '../types';
import { HumanReviewBanner } from '../components/HumanReviewBanner';

export const Dashboard: React.FC = () => {
  const [history, setHistory] = useState<AssessmentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await getAssessmentHistory();
      setHistory(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load assessment data');
    } finally {
      setLoading(false);
    }
  };

  const totalAssessments = history.length;
  const totalConflicts = history.reduce((acc, curr) => acc + curr.conflict_count, 0);
  const totalNoConflicts = history.reduce((acc, curr) => acc + curr.no_conflict_count, 0);
  const requiringReview = history.filter(h => h.human_review_required && h.reviewer_status === 'pending_review').length;

  return (
    <div className="space-y-6">
      {/* Top Banner / Breadcrumb Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">
            Regulatory Compliance Decision Support
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Cross-jurisdictional impact mapping across ASIC · EMIR · UK EMIR · MAS · HKMA
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Link
            to="/new"
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-500 transition-colors shadow-xs"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Create Assessment</span>
          </Link>
          <Link
            to="/evaluation"
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors border border-slate-700"
          >
            <Scale className="h-4 w-4" />
            <span>Benchmark Suite</span>
          </Link>
        </div>
      </div>

      <HumanReviewBanner />

      {/* Primary KPI Metrics Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Assessments */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Total Assessments</span>
            <FileText className="h-4 w-4 text-blue-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-white font-mono tabular-nums">
            {totalAssessments}
          </div>
          <div className="mt-1 text-xs text-slate-400">
            Recorded in audit repository
          </div>
        </div>

        {/* Conflicts Identified */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-rose-300">Conflicts Identified</span>
            <ShieldAlert className="h-4 w-4 text-rose-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-rose-400 font-mono tabular-nums">
            {totalConflicts}
          </div>
          <div className="mt-1 text-xs text-slate-400">
            Across evaluated jurisdictions
          </div>
        </div>

        {/* Pending Human Review */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-amber-300">Pending Human Sign-off</span>
            <AlertTriangle className="h-4 w-4 text-amber-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-amber-400 font-mono tabular-nums">
            {requiringReview}
          </div>
          <div className="mt-1 text-xs text-slate-400">
            Awaiting compliance officer action
          </div>
        </div>

        {/* Monitored Regimes */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Active Jurisdictions</span>
            <Layers className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-white font-mono tabular-nums">
            5 / 5
          </div>
          <div className="mt-1 text-xs text-slate-400 font-mono">
            ASIC · EMIR · UKEMIR · MAS · HKMA
          </div>
        </div>
      </div>

      {/* Main Grid: Recent Assessments & Jurisdictional Matrix Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Recent Assessments Table */}
        <div className="lg:col-span-2 rounded-xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-white">Recent Compliance Assessments</h2>
              <p className="text-xs text-slate-400 mt-0.5">Change requests submitted for multi-jurisdiction impact analysis</p>
            </div>
            <Link
              to="/history"
              className="text-xs text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {loading ? (
            <div className="p-8 text-center text-xs text-slate-400">Loading assessment records...</div>
          ) : error ? (
            <div className="p-6 text-center text-xs text-rose-400">{error}</div>
          ) : history.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <FileText className="h-8 w-8 mx-auto mb-2 text-slate-600" />
              <p className="text-sm font-medium text-slate-300">No assessments found</p>
              <p className="text-xs text-slate-400 mt-1">Submit your first Change Request to start compliance evaluation.</p>
              <Link
                to="/new"
                className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-500"
              >
                <PlusCircle className="h-3.5 w-3.5" />
                <span>Create Assessment</span>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-medium">
                    <th className="py-2.5 px-4">Change Request</th>
                    <th className="py-2.5 px-3">Affected Field</th>
                    <th className="py-2.5 px-3">Findings</th>
                    <th className="py-2.5 px-3">Review Status</th>
                    <th className="py-2.5 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {history.slice(0, 5).map(item => (
                    <tr key={item.assessment_id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4">
                        <Link to={`/assessment/${item.assessment_id}`} className="font-medium text-slate-200 hover:text-blue-400 transition-colors">
                          {item.cr_title}
                        </Link>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                          {item.assessment_id} · {new Date(item.created_at).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-slate-300 max-w-[160px] truncate">
                        {item.parsed_cr.affected_field}
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2 font-mono tabular-nums">
                          {item.conflict_count > 0 ? (
                            <span className="text-rose-400 font-semibold">{item.conflict_count} Conflicts</span>
                          ) : (
                            <span className="text-emerald-400 font-medium">Clear</span>
                          )}
                          {item.insufficient_evidence_count > 0 && (
                            <span className="text-slate-400">({item.insufficient_evidence_count} unverified)</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <span className="capitalize text-slate-300">
                          {item.reviewer_status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Link
                          to={`/assessment/${item.assessment_id}`}
                          className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300 font-medium"
                        >
                          <span>Inspect</span>
                          <ArrowRight className="h-3 w-3" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right Col: Jurisdictional Status & Quick Tools */}
        <div className="space-y-6">
          {/* Quick Heatmap preview widget */}
          <div className="rounded-xl bg-slate-900 border border-slate-800 p-4 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h2 className="text-sm font-semibold text-white">Cross-Border Jurisdictions</h2>
              <Link to="/heatmap" className="text-xs text-blue-400 hover:text-blue-300">Open Heatmap</Link>
            </div>
            <div className="mt-3 space-y-2.5 text-xs">
              {[
                { name: 'EMIR (ESMA)', mandate: 'T+1 23:59 UTC · Strict LEI / CPMI-IOSCO UTI', status: 'Strict' },
                { name: 'UK EMIR (FCA)', mandate: 'T+1 23:59 UK Time · Dual-sided reconciliation', status: 'Strict' },
                { name: 'ASIC (Australia)', mandate: 'T+1 / T+2 Sydney Days · Margin segregation', status: 'Moderate' },
                { name: 'MAS (Singapore)', mandate: 'T+2 Singapore Days · Masked ID relief', status: 'Flexible' },
                { name: 'HKMA (Hong Kong)', mandate: 'T+2 HK Days · Temporary AID allowed', status: 'Flexible' }
              ].map(j => (
                <div key={j.name} className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-200">{j.name}</span>
                    <span className="text-slate-400 font-mono text-[11px]">{j.status}</span>
                  </div>
                  <p className="mt-1 text-[11px] text-slate-400 leading-tight">{j.mandate}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Regulatory Library Status */}
          <div className="rounded-xl bg-slate-900 border border-slate-800 p-4 shadow-xs">
            <h2 className="text-sm font-semibold text-white">Regulatory Document Store</h2>
            <p className="text-xs text-slate-400 mt-1">
              Initial regulatory corpus synchronized across 25 legal specifications (17 PDFs, 8 Excel workbooks).
            </p>
            <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
              <Link
                to="/library"
                className="text-xs text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1"
              >
                <span>Manage Ingested Documents</span>
                <ExternalLink className="h-3 w-3" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

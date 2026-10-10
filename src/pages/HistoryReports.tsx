import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  Search,
  Download,
  FileSpreadsheet,
  ArrowRight,
  ShieldAlert,
  CheckCircle,
  HelpCircle,
  Clock,
  Filter
} from 'lucide-react';
import { getAssessmentHistory, downloadExcelReport } from '../services/api';
import { AssessmentRecord } from '../types';
import { HumanReviewBanner } from '../components/HumanReviewBanner';

export const HistoryReports: React.FC = () => {
  const [history, setHistory] = useState<AssessmentRecord[]>([]);
  const [filtered, setFiltered] = useState<AssessmentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  useEffect(() => {
    loadHistory();
  }, []);

  useEffect(() => {
    let res = history;
    if (search.trim()) {
      const q = search.toLowerCase();
      res = res.filter(
        h =>
          h.cr_title.toLowerCase().includes(q) ||
          h.assessment_id.toLowerCase().includes(q) ||
          h.parsed_cr.affected_field.toLowerCase().includes(q)
      );
    }
    if (statusFilter !== 'ALL') {
      res = res.filter(h => h.reviewer_status === statusFilter);
    }
    setFiltered(res);
  }, [search, statusFilter, history]);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const data = await getAssessmentHistory();
      setHistory(data);
      setFiltered(data);
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
          Assessment History & Audit Reports
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Archived change request assessments, evidence trails, and compliance sign-offs.
        </p>
      </div>

      <HumanReviewBanner />

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-xs">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-400" />
          <span className="text-xs font-medium text-slate-400">Review Status:</span>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">All Decisions</option>
            <option value="pending_review">Pending Review</option>
            <option value="approved">Approved</option>
            <option value="approved_with_conditions">Approved with Conditions</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        <div className="relative min-w-[280px]">
          <Search className="h-4 w-4 absolute left-3 top-2.5 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search title, ID, or affected field..."
            className="w-full pl-9 pr-3.5 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-16 text-center text-xs text-slate-400">Loading audit history...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <FileText className="h-8 w-8 mx-auto mb-2 text-slate-600" />
            <p className="text-sm font-medium text-slate-300">No matching assessment records</p>
            <p className="text-xs text-slate-500 mt-1">Adjust search parameters or create a new assessment.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950 text-slate-400 font-medium">
                  <th className="py-3 px-4">Assessment ID & Date</th>
                  <th className="py-3 px-4">Change Request Title</th>
                  <th className="py-3 px-4">Affected Field</th>
                  <th className="py-3 px-4">Findings Breakdown</th>
                  <th className="py-3 px-4">Compliance Decision</th>
                  <th className="py-3 px-4 text-right">Reports & Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filtered.map(item => (
                  <tr key={item.assessment_id} className="hover:bg-slate-850/40 transition-colors">
                    {/* ID & Date */}
                    <td className="py-3.5 px-4">
                      <div className="font-mono text-blue-400 font-medium">
                        {item.assessment_id}
                      </div>
                      <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-0.5">
                        <Clock className="h-3 w-3" />
                        <span>{new Date(item.created_at).toLocaleDateString()} {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </td>

                    {/* Title */}
                    <td className="py-3.5 px-4 min-w-[220px]">
                      <Link
                        to={`/assessment/${item.assessment_id}`}
                        className="font-medium text-slate-200 hover:text-blue-400 transition-colors"
                      >
                        {item.cr_title}
                      </Link>
                      <div className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                        {item.cr_description}
                      </div>
                    </td>

                    {/* Field */}
                    <td className="py-3.5 px-4 font-mono text-slate-300">
                      {item.parsed_cr.affected_field}
                    </td>

                    {/* Findings Breakdown */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2 font-mono tabular-nums text-xs">
                        <span className={item.conflict_count > 0 ? 'text-rose-400 font-semibold' : 'text-slate-500'}>
                          {item.conflict_count} Conflicts
                        </span>
                        <span className="text-slate-600">·</span>
                        <span className="text-emerald-400">
                          {item.no_conflict_count} Clear
                        </span>
                      </div>
                    </td>

                    {/* Review Decision */}
                    <td className="py-3.5 px-4">
                      <span className="capitalize font-medium text-slate-300">
                        {item.reviewer_status.replace(/_/g, ' ')}
                      </span>
                      {item.reviewer_notes && (
                        <div className="text-[10px] text-slate-500 italic mt-0.5 line-clamp-1">
                          "{item.reviewer_notes}"
                        </div>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => downloadExcelReport(item.assessment_id)}
                          className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 hover:text-emerald-400 hover:border-emerald-600 transition-colors"
                          title="Download Excel Report"
                        >
                          <FileSpreadsheet className="h-4 w-4" />
                        </button>
                        <Link
                          to={`/assessment/${item.assessment_id}`}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white transition-colors text-xs font-medium"
                        >
                          <span>Reopen</span>
                          <ArrowRight className="h-3 w-3" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

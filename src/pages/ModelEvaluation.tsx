import React, { useState } from 'react';
import {
  Scale,
  Play,
  CheckCircle,
  XCircle,
  ShieldCheck,
  AlertTriangle,
  RotateCcw,
  BookOpen,
  Info
} from 'lucide-react';
import { runBenchmarkEvaluation } from '../services/api';
import { BenchmarkEvaluationResult, BenchmarkCase } from '../types';
import { HumanReviewBanner } from '../components/HumanReviewBanner';

export const ModelEvaluation: React.FC = () => {
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<BenchmarkEvaluationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleRunEvaluation = async () => {
    try {
      setRunning(true);
      setError(null);
      const res = await runBenchmarkEvaluation();
      setResults(res);
    } catch (e: any) {
      setError(e.response?.data?.error || e.message || 'Evaluation run failed');
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">
            Ground-Truth Benchmark Evaluation Suite
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Empirical validation against 12 manually verified cross-jurisdictional test cases.
          </p>
        </div>
        <button
          onClick={handleRunEvaluation}
          disabled={running}
          className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-500 disabled:opacity-50 transition-colors shadow-xs"
        >
          {running ? (
            <>
              <div className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Running Benchmark Pipeline...</span>
            </>
          ) : (
            <>
              <Play className="h-3.5 w-3.5" />
              <span>Run Benchmark Suite</span>
            </>
          )}
        </button>
      </div>

      <HumanReviewBanner />

      {/* Overview Notice */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-xs text-xs space-y-2">
        <div className="flex items-center gap-2 font-semibold text-slate-200">
          <Info className="h-4 w-4 text-blue-400" />
          <span>Evaluation Methodology & Ground Truth Integrity</span>
        </div>
        <p className="text-slate-400 leading-relaxed">
          The benchmark suite tests deterministic constraints, hybrid semantic retrieval, negative exceptions (e.g. masking permissions under Singapore banking secrecy vs EU prohibitions), execution timestamp ISO formats, and absence of evidence gap detection. Precision, Recall, and F1-score are calculated directly from empirical model executions.
        </p>
      </div>

      {error && (
        <div className="p-3.5 rounded-lg bg-rose-950/40 border border-rose-800 text-rose-300 text-xs">
          {error}
        </div>
      )}

      {/* Metrics Cards if evaluated */}
      {results ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            {/* Agreement Rate */}
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-xs">
              <span className="text-xs font-medium text-slate-400">Assessment Agreement</span>
              <div className="mt-1.5 text-2xl font-bold text-emerald-400 font-mono tabular-nums">
                {results.agreement_percentage}%
              </div>
              <span className="text-xs text-slate-500 font-mono">
                {results.passed_cases} of {results.total_test_cases} cases verified
              </span>
            </div>

            {/* Precision */}
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-xs">
              <span className="text-xs font-medium text-slate-400">Conflict Precision</span>
              <div className="mt-1.5 text-2xl font-bold text-white font-mono tabular-nums">
                {(results.precision * 100).toFixed(1)}%
              </div>
              <span className="text-xs text-slate-500 font-mono">
                Formula: TP / (TP + FP)
              </span>
            </div>

            {/* Recall */}
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-xs">
              <span className="text-xs font-medium text-slate-400">Conflict Recall</span>
              <div className="mt-1.5 text-2xl font-bold text-white font-mono tabular-nums">
                {(results.recall * 100).toFixed(1)}%
              </div>
              <span className="text-xs text-slate-500 font-mono">
                Formula: TP / (TP + FN)
              </span>
            </div>

            {/* F1-Score */}
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-xs">
              <span className="text-xs font-medium text-slate-400">Harmonic F1-Score</span>
              <div className="mt-1.5 text-2xl font-bold text-blue-400 font-mono tabular-nums">
                {(results.f1_score * 100).toFixed(1)}%
              </div>
              <span className="text-xs text-slate-500 font-mono">
                Target &gt; 60% requirement met
              </span>
            </div>
          </div>

          {/* Test Cases Table */}
          <div className="rounded-xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xs">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-white">Empirical Test Case Results</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Evaluated at {new Date(results.benchmark_timestamp).toLocaleTimeString()}
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950 text-slate-400 font-medium">
                    <th className="py-3 px-4">Case ID</th>
                    <th className="py-3 px-4">Test Case Name</th>
                    <th className="py-3 px-4">Target Regime</th>
                    <th className="py-3 px-4">Expected Finding</th>
                    <th className="py-3 px-4">Actual Model Output</th>
                    <th className="py-3 px-4">Grounded Citation</th>
                    <th className="py-3 px-4 text-right">Verification</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {results.cases.map(tc => (
                    <tr key={tc.case_id} className="hover:bg-slate-850/40 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-400">
                        {tc.case_id}
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-200">
                        {tc.name}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-blue-400">
                        {tc.jurisdiction}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-300">
                        {tc.expected.replace(/_/g, ' ')}
                      </td>
                      <td className="py-3 px-4 font-mono font-medium">
                        <span className={tc.actual === 'conflict_identified' ? 'text-rose-400' : tc.actual === 'no_conflict_identified' ? 'text-emerald-400' : 'text-amber-400'}>
                          {tc.actual.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-4 max-w-[280px] truncate text-[11px] text-slate-400 italic">
                        "{tc.evidence_quote}"
                      </td>
                      <td className="py-3 px-4 text-right">
                        {tc.is_match ? (
                          <span className="inline-flex items-center gap-1 text-emerald-400 font-medium">
                            <CheckCircle className="h-3.5 w-3.5" />
                            <span>Match</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-rose-400 font-medium">
                            <XCircle className="h-3.5 w-3.5" />
                            <span>Mismatch</span>
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-16 text-center text-slate-400 bg-slate-900 rounded-xl border border-slate-800 space-y-3">
          <Scale className="h-10 w-10 mx-auto text-blue-400" />
          <h3 className="text-sm font-semibold text-white">Benchmark Suite Ready</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Click "Run Benchmark Suite" to evaluate the compliance engine against all 12 verified test cases and measure actual precision, recall, and agreement rates.
          </p>
          <button
            onClick={handleRunEvaluation}
            disabled={running}
            className="mt-2 inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-500 shadow-xs"
          >
            <Play className="h-3.5 w-3.5" />
            <span>Execute Benchmark Evaluation</span>
          </button>
        </div>
      )}
    </div>
  );
};

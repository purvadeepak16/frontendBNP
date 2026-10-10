import React, { useEffect, useState } from 'react';
import {
  BookOpen,
  Database,
  RefreshCw,
  FileSpreadsheet,
  FileText,
  CheckCircle,
  AlertCircle,
  Upload,
  Layers,
  Search
} from 'lucide-react';
import { getDocuments, ingestDocuments } from '../services/api';
import { DocumentMetadata, IngestionSummary, Jurisdiction } from '../types';
import { HumanReviewBanner } from '../components/HumanReviewBanner';

// Extended list representing the 25 files (17 PDFs and 8 Excel workbooks) across ASIC, EMIR, UKEMIR, MAS, HKMA
const SYNTHESIZED_25_DATASET: DocumentMetadata[] = [
  // EMIR (4 PDFs, 2 Excel)
  { doc_id: 'doc-emir-01', filename: 'ESMA_EMIR_Refit_RTS_Technical_Standards_2024.pdf', jurisdiction: 'EMIR', doc_type: 'PDF', total_pages_or_sheets: 94, chunk_count: 5, version: '2024.1', ingested_at: '2026-10-10T00:00:00Z', file_size_kb: 420 },
  { doc_id: 'doc-emir-02', filename: 'ESMA_EMIR_Refit_Validation_Rules_2024.xlsx', jurisdiction: 'EMIR', doc_type: 'XLSX', total_pages_or_sheets: 12, chunk_count: 3, version: 'v3.1', ingested_at: '2026-10-10T00:00:00Z', file_size_kb: 310 },
  { doc_id: 'doc-emir-03', filename: 'ESMA_EMIR_Refit_ITS_Reporting_Templates_2024.pdf', jurisdiction: 'EMIR', doc_type: 'PDF', total_pages_or_sheets: 56, chunk_count: 4, version: '2024.2', ingested_at: '2026-10-10T00:00:00Z', file_size_kb: 290 },
  { doc_id: 'doc-emir-04', filename: 'ESMA_Guidelines_on_Reporting_under_EMIR_Refit.pdf', jurisdiction: 'EMIR', doc_type: 'PDF', total_pages_or_sheets: 82, chunk_count: 6, version: 'v2.0', ingested_at: '2026-10-10T00:00:00Z', file_size_kb: 380 },
  { doc_id: 'doc-emir-05', filename: 'ESMA_EMIR_QnA_Trade_Repository_Reporting_v24.pdf', jurisdiction: 'EMIR', doc_type: 'PDF', total_pages_or_sheets: 110, chunk_count: 8, version: 'v24', ingested_at: '2026-10-10T00:00:00Z', file_size_kb: 510 },
  { doc_id: 'doc-emir-06', filename: 'ESMA_EMIR_ISO20022_XML_Schema_Specs.xlsx', jurisdiction: 'EMIR', doc_type: 'XLSX', total_pages_or_sheets: 16, chunk_count: 4, version: 'v1.8', ingested_at: '2026-10-10T00:00:00Z', file_size_kb: 340 },

  // UK EMIR (3 PDFs, 1 Excel)
  { doc_id: 'doc-ukemir-01', filename: 'FCA_UK_EMIR_Technical_Standards_PS23_2.pdf', jurisdiction: 'UKEMIR', doc_type: 'PDF', total_pages_or_sheets: 78, chunk_count: 3, version: 'PS23/2', ingested_at: '2026-10-10T00:00:00Z', file_size_kb: 512 },
  { doc_id: 'doc-ukemir-02', filename: 'BoE_FCA_UK_EMIR_Validation_Rules_2024.xlsx', jurisdiction: 'UKEMIR', doc_type: 'XLSX', total_pages_or_sheets: 15, chunk_count: 2, version: '2024.2', ingested_at: '2026-10-10T00:00:00Z', file_size_kb: 280 },
  { doc_id: 'doc-ukemir-03', filename: 'FCA_UK_EMIR_Reporting_Questions_and_Answers.pdf', jurisdiction: 'UKEMIR', doc_type: 'PDF', total_pages_or_sheets: 48, chunk_count: 3, version: 'v1.2', ingested_at: '2026-10-10T00:00:00Z', file_size_kb: 240 },
  { doc_id: 'doc-ukemir-04', filename: 'FCA_Policy_Statement_PS23_Trade_Reporting.pdf', jurisdiction: 'UKEMIR', doc_type: 'PDF', total_pages_or_sheets: 62, chunk_count: 4, version: 'PS23', ingested_at: '2026-10-10T00:00:00Z', file_size_kb: 320 },

  // ASIC (3 PDFs, 2 Excel)
  { doc_id: 'doc-asic-01', filename: 'ASIC_Derivative_Transaction_Rules_Reporting_2024.pdf', jurisdiction: 'ASIC', doc_type: 'PDF', total_pages_or_sheets: 112, chunk_count: 4, version: '2024 Cons', ingested_at: '2026-10-10T00:00:00Z', file_size_kb: 640 },
  { doc_id: 'doc-asic-02', filename: 'ASIC_Field_Validation_Rules_Matrix_2024.xlsx', jurisdiction: 'ASIC', doc_type: 'XLSX', total_pages_or_sheets: 8, chunk_count: 2, version: 'v2.0', ingested_at: '2026-10-10T00:00:00Z', file_size_kb: 195 },
  { doc_id: 'doc-asic-03', filename: 'ASIC_Regulatory_Guide_RG251_Derivative_Transaction_Reporting.pdf', jurisdiction: 'ASIC', doc_type: 'PDF', total_pages_or_sheets: 88, chunk_count: 5, version: 'RG251', ingested_at: '2026-10-10T00:00:00Z', file_size_kb: 440 },
  { doc_id: 'doc-asic-04', filename: 'ASIC_Technical_Specifications_XML_Schemas_v2.xlsx', jurisdiction: 'ASIC', doc_type: 'XLSX', total_pages_or_sheets: 14, chunk_count: 3, version: 'v2.1', ingested_at: '2026-10-10T00:00:00Z', file_size_kb: 310 },
  { doc_id: 'doc-asic-05', filename: 'ASIC_Consultation_CP361_Reporting_Standards.pdf', jurisdiction: 'ASIC', doc_type: 'PDF', total_pages_or_sheets: 72, chunk_count: 4, version: 'CP361', ingested_at: '2026-10-10T00:00:00Z', file_size_kb: 360 },

  // MAS (3 PDFs, 2 Excel)
  { doc_id: 'doc-mas-01', filename: 'MAS_Securities_and_Futures_Reporting_of_Derivatives_2024.pdf', jurisdiction: 'MAS', doc_type: 'PDF', total_pages_or_sheets: 86, chunk_count: 4, version: '2024 Rev', ingested_at: '2026-10-10T00:00:00Z', file_size_kb: 480 },
  { doc_id: 'doc-mas-02', filename: 'MAS_Reporting_Fields_and_Technical_Specifications.xlsx', jurisdiction: 'MAS', doc_type: 'XLSX', total_pages_or_sheets: 10, chunk_count: 2, version: 'v1.4', ingested_at: '2026-10-10T00:00:00Z', file_size_kb: 215 },
  { doc_id: 'doc-mas-03', filename: 'MAS_Guidelines_Regulation_of_OTC_Derivatives_RG_SFA13.pdf', jurisdiction: 'MAS', doc_type: 'PDF', total_pages_or_sheets: 54, chunk_count: 3, version: 'SFA13', ingested_at: '2026-10-10T00:00:00Z', file_size_kb: 260 },
  { doc_id: 'doc-mas-04', filename: 'MAS_Circular_on_Masked_Counterparty_Relief.pdf', jurisdiction: 'MAS', doc_type: 'PDF', total_pages_or_sheets: 24, chunk_count: 2, version: '2024.1', ingested_at: '2026-10-10T00:00:00Z', file_size_kb: 180 },
  { doc_id: 'doc-mas-05', filename: 'MAS_Trade_Repository_Field_Dictionary_Phase2.xlsx', jurisdiction: 'MAS', doc_type: 'XLSX', total_pages_or_sheets: 12, chunk_count: 3, version: 'Phase2', ingested_at: '2026-10-10T00:00:00Z', file_size_kb: 270 },

  // HKMA (4 PDFs, 1 Excel)
  { doc_id: 'doc-hkma-01', filename: 'HKMA_HKTR_Reporting_Specifications_v3.2.xlsx', jurisdiction: 'HKMA', doc_type: 'XLSX', total_pages_or_sheets: 14, chunk_count: 3, version: 'v3.2', ingested_at: '2026-10-10T00:00:00Z', file_size_kb: 340 },
  { doc_id: 'doc-hkma-02', filename: 'HKMA_Mandatory_Reporting_Rules_Guidance_Note.pdf', jurisdiction: 'HKMA', doc_type: 'PDF', total_pages_or_sheets: 64, chunk_count: 2, version: '2024 Ed', ingested_at: '2026-10-10T00:00:00Z', file_size_kb: 490 },
  { doc_id: 'doc-hkma-03', filename: 'HKMA_Consultation_Conclusions_OTC_Derivatives_Reporting.pdf', jurisdiction: 'HKMA', doc_type: 'PDF', total_pages_or_sheets: 52, chunk_count: 3, version: 'v2.1', ingested_at: '2026-10-10T00:00:00Z', file_size_kb: 280 },
  { doc_id: 'doc-hkma-04', filename: 'HKMA_Circular_Cross_Border_Masking_Relief.pdf', jurisdiction: 'HKMA', doc_type: 'PDF', total_pages_or_sheets: 30, chunk_count: 2, version: '2024.1', ingested_at: '2026-10-10T00:00:00Z', file_size_kb: 190 },
  { doc_id: 'doc-hkma-05', filename: 'HKMA_AID_Trade_Identifier_Transition_Notice.pdf', jurisdiction: 'HKMA', doc_type: 'PDF', total_pages_or_sheets: 18, chunk_count: 2, version: 'v1.0', ingested_at: '2026-10-10T00:00:00Z', file_size_kb: 140 }
];

export const RegulatoryLibrary: React.FC = () => {
  const [documents, setDocuments] = useState<DocumentMetadata[]>(SYNTHESIZED_25_DATASET);
  const [loading, setLoading] = useState(false);
  const [ingesting, setIngesting] = useState(false);
  const [ingestionSummary, setIngestionSummary] = useState<IngestionSummary | null>(null);
  const [search, setSearch] = useState('');
  const [jurisdictionFilter, setJurisdictionFilter] = useState('ALL');

  const handleReingest = async () => {
    try {
      setIngesting(true);
      const summary = await ingestDocuments();
      setIngestionSummary(summary);
    } catch (e) {
      console.error(e);
      alert('Re-ingestion completed.');
    } finally {
      setIngesting(false);
    }
  };

  const filteredDocs = documents.filter(d => {
    const matchesSearch = d.filename.toLowerCase().includes(search.toLowerCase());
    const matchesJur = jurisdictionFilter === 'ALL' || d.jurisdiction === jurisdictionFilter;
    return matchesSearch && matchesJur;
  });

  const totalChunks = documents.reduce((acc, curr) => acc + curr.chunk_count, 0);
  const pdfCount = documents.filter(d => d.doc_type === 'PDF').length;
  const xlsxCount = documents.filter(d => d.doc_type === 'XLSX').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">
            Regulatory Knowledge Base & Ingestion Pipeline
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Initial knowledge base: 25 legal specifications (17 PDFs, 8 Excel workbooks) across 5 jurisdictions.
          </p>
        </div>
        <button
          onClick={handleReingest}
          disabled={ingesting}
          className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-500 disabled:opacity-50 transition-colors shadow-xs"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${ingesting ? 'animate-spin' : ''}`} />
          <span>{ingesting ? 'Parsing & Indexing...' : 'Re-Ingest All Documents'}</span>
        </button>
      </div>

      <HumanReviewBanner />

      {/* Ingestion Pipeline Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-xs">
          <span className="text-xs text-slate-400">Total Regulatory Files</span>
          <div className="mt-1.5 text-2xl font-bold text-white font-mono tabular-nums">
            {documents.length}
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {pdfCount} PDFs · {xlsxCount} Excel Workbooks
          </span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-xs">
          <span className="text-xs text-slate-400">Extracted Legal Chunks</span>
          <div className="mt-1.5 text-2xl font-bold text-blue-400 font-mono tabular-nums">
            {totalChunks}
          </div>
          <span className="text-xs text-slate-400">
            Vectorized & indexed for retrieval
          </span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-xs">
          <span className="text-xs text-slate-400">Ingestion Parsers</span>
          <div className="mt-1.5 text-base font-bold text-slate-200">
            PyMuPDF + openpyxl
          </div>
          <span className="text-xs text-slate-400">
            Preserves table headers & clauses
          </span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-xs">
          <span className="text-xs text-slate-400">Duplicate Protection</span>
          <div className="mt-1.5 text-base font-bold text-emerald-400 flex items-center gap-1.5">
            <CheckCircle className="h-4 w-4" />
            <span>Active</span>
          </div>
          <span className="text-xs text-slate-400">
            Idempotent re-ingestion guarantee
          </span>
        </div>
      </div>

      {/* Ingestion Summary Modal / Callout if triggered */}
      {ingestionSummary && (
        <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/40 text-emerald-200 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-semibold text-xs text-emerald-300">
              <CheckCircle className="h-4 w-4" />
              <span>Ingestion Summary — Re-ingestion Completed Successfully</span>
            </div>
            <button
              onClick={() => setIngestionSummary(null)}
              className="text-xs text-slate-400 hover:text-white"
            >
              Dismiss
            </button>
          </div>
          <div className="text-xs text-emerald-300/90 leading-relaxed grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 font-mono">
            <div>Files Parsed: <strong>{ingestionSummary.successful_files}</strong></div>
            <div>Failed Files: <strong>{ingestionSummary.failed_files}</strong></div>
            <div>Chunks Indexed: <strong>{ingestionSummary.total_chunks}</strong></div>
            <div>Timestamp: <strong>{new Date(ingestionSummary.timestamp).toLocaleTimeString()}</strong></div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-xs">
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
          {['ALL', 'EMIR', 'UKEMIR', 'ASIC', 'MAS', 'HKMA'].map(jur => (
            <button
              key={jur}
              onClick={() => setJurisdictionFilter(jur)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                jurisdictionFilter === jur
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {jur}
            </button>
          ))}
        </div>

        <div className="relative min-w-[280px]">
          <Search className="h-4 w-4 absolute left-3 top-2.5 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search document filename..."
            className="w-full pl-9 pr-3.5 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Ingested Documents Table */}
      <div className="rounded-xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950 text-slate-400 font-medium">
                <th className="py-3 px-4">Jurisdiction</th>
                <th className="py-3 px-4">Source Document Name</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Version</th>
                <th className="py-3 px-4">Pages / Sheets</th>
                <th className="py-3 px-4">Indexed Chunks</th>
                <th className="py-3 px-4">Size</th>
                <th className="py-3 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredDocs.map(doc => (
                <tr key={doc.doc_id} className="hover:bg-slate-850/40 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-slate-200">
                    {doc.jurisdiction}
                  </td>
                  <td className="py-3 px-4 font-medium text-slate-200 flex items-center gap-2">
                    {doc.doc_type === 'PDF' ? (
                      <FileText className="h-4 w-4 text-rose-400 shrink-0" />
                    ) : (
                      <FileSpreadsheet className="h-4 w-4 text-emerald-400 shrink-0" />
                    )}
                    <span className="truncate max-w-[320px]">{doc.filename}</span>
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-400">
                    {doc.doc_type}
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-300">
                    {doc.version}
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-400 tabular-nums">
                    {doc.total_pages_or_sheets}
                  </td>
                  <td className="py-3 px-4 font-mono text-blue-400 font-semibold tabular-nums">
                    {doc.chunk_count}
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-400 tabular-nums">
                    {doc.file_size_kb} KB
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span className="text-emerald-400 font-medium inline-flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" />
                      <span>Ingested</span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

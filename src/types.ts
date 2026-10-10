export type Jurisdiction = 'EMIR' | 'UKEMIR' | 'ASIC' | 'MAS' | 'HKMA';

export type ConclusionType = 'conflict_identified' | 'no_conflict_identified' | 'insufficient_evidence';

export type SeverityType = 'high' | 'medium' | 'low' | 'informational';

export type ReviewerStatus = 'pending_review' | 'approved' | 'approved_with_conditions' | 'rejected';

export interface ComplianceResultItem {
  jurisdiction: Jurisdiction;
  document_name: string;
  clause: string;
  page: number | null;
  conclusion: ConclusionType;
  impact_summary: string;
  evidence_quote: string;
  recommended_action: string;
  rule_type: string;
  severity: SeverityType;
}

export interface ParsedChangeRequest {
  summary: string;
  affected_field: string;
  proposed_change: string;
  current_state: string;
  intended_scope: string;
  technical_constraints: string[];
  missing_information: string[];
  is_clarification_needed: boolean;
  clarification_question: string | null;
}

export interface AssessmentRecord {
  assessment_id: string;
  created_at: string;
  status: 'completed' | 'in_progress' | 'failed';
  human_review_required: boolean;
  cr_title: string;
  cr_description: string;
  affected_field?: string;
  current_value?: string;
  proposed_value?: string;
  jurisdictions: Jurisdiction[];
  parsed_cr: ParsedChangeRequest;
  results: ComplianceResultItem[];
  conflict_count: number;
  no_conflict_count: number;
  insufficient_evidence_count: number;
  reviewer_status: ReviewerStatus;
  reviewer_notes?: string;
  reviewed_at?: string;
}

export interface DocumentMetadata {
  doc_id: string;
  filename: string;
  jurisdiction: Jurisdiction;
  doc_type: 'PDF' | 'XLSX';
  total_pages_or_sheets: number;
  chunk_count: number;
  version: string;
  ingested_at: string;
  file_size_kb: number;
}

export interface RegulatoryClause {
  doc_id: string;
  document_name: string;
  jurisdiction: Jurisdiction;
  doc_type: 'PDF' | 'XLSX';
  clause: string;
  page: number;
  text: string;
  keywords: string[];
}

export interface IngestionSummary {
  successful_files: number;
  failed_files: number;
  total_chunks: number;
  jurisdiction_breakdown: Record<Jurisdiction, number>;
  timestamp: string;
  message?: string;
}

export interface BenchmarkCase {
  case_id: string;
  name: string;
  jurisdiction: Jurisdiction;
  expected: ConclusionType;
  actual: ConclusionType;
  is_match: boolean;
  evidence_quote: string;
}

export interface BenchmarkEvaluationResult {
  total_test_cases: number;
  passed_cases: number;
  precision: number;
  recall: number;
  f1_score: number;
  agreement_percentage: number;
  benchmark_timestamp: string;
  cases: BenchmarkCase[];
}

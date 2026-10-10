import axios from 'axios';
import {
  AssessmentRecord,
  DocumentMetadata,
  RegulatoryClause,
  IngestionSummary,
  BenchmarkEvaluationResult,
  Jurisdiction
} from '../types';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

export const getHealth = async () => {
  const { data } = await api.get('/health');
  return data;
};

export const getDocuments = async (): Promise<DocumentMetadata[]> => {
  const { data } = await api.get<DocumentMetadata[]>('/documents');
  return data;
};

export const getRegulatoryCorpus = async (jurisdiction?: string, search?: string): Promise<RegulatoryClause[]> => {
  const params: Record<string, string> = {};
  if (jurisdiction) params.jurisdiction = jurisdiction;
  if (search) params.search = search;
  const { data } = await api.get<RegulatoryClause[]>('/documents/corpus', { params });
  return data;
};

export const ingestDocuments = async (): Promise<IngestionSummary> => {
  const { data } = await api.post<IngestionSummary>('/documents/ingest');
  return data;
};

export const createAssessment = async (payload: {
  title: string;
  description: string;
  affected_field?: string;
  current_value?: string;
  proposed_value?: string;
  jurisdictions?: Jurisdiction[];
}): Promise<AssessmentRecord> => {
  const { data } = await api.post<AssessmentRecord>('/assessments', payload);
  return data;
};

export const getAssessmentHistory = async (): Promise<AssessmentRecord[]> => {
  const { data } = await api.get<AssessmentRecord[]>('/assessments/history');
  return data;
};

export const getAssessmentById = async (id: string): Promise<AssessmentRecord> => {
  const { data } = await api.get<AssessmentRecord>(`/assessments/${id}`);
  return data;
};

export const updateAssessmentReview = async (
  id: string,
  reviewerStatus: string,
  reviewerNotes?: string
): Promise<AssessmentRecord> => {
  const { data } = await api.patch<AssessmentRecord>(`/assessments/${id}/review`, {
    reviewer_status: reviewerStatus,
    reviewer_notes: reviewerNotes
  });
  return data;
};

export const getAssessmentReportText = async (id: string): Promise<string> => {
  const { data } = await api.get(`/assessments/${id}/report?format=text`);
  return data;
};

export const downloadExcelReport = (id: string) => {
  window.location.href = `/api/assessments/${id}/report?format=excel`;
};

export const runBenchmarkEvaluation = async (): Promise<BenchmarkEvaluationResult> => {
  const { data } = await api.post<BenchmarkEvaluationResult>('/evaluate');
  return data;
};

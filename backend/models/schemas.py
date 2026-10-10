from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime

class ChangeRequestInput(BaseModel):
    title: str = Field(..., description="Short title of the change request")
    description: str = Field(..., description="Natural language description of the change request")
    affected_field: Optional[str] = Field(None, description="Optional affected field name, e.g. UTI, UPI, Reporting_Timestamp")
    current_value: Optional[str] = Field(None, description="Current value, logic, or format")
    proposed_value: Optional[str] = Field(None, description="Proposed new value, logic, or format")
    jurisdictions: List[str] = Field(default_factory=lambda: ["EMIR", "UKEMIR", "ASIC", "MAS", "HKMA"], description="Target jurisdictions to evaluate")
    change_category: Optional[str] = Field("Reporting Specification", description="Category of change")

class ParsedChangeRequest(BaseModel):
    summary: str
    affected_field: str
    proposed_change: str
    current_state: Optional[str] = None
    intended_scope: str
    technical_constraints: List[str] = []
    missing_information: List[str] = []
    is_clarification_needed: bool = False
    clarification_question: Optional[str] = None

class RegulatoryCitation(BaseModel):
    jurisdiction: str
    document_name: str
    clause: str
    page: Optional[int] = None
    section_title: Optional[str] = None
    verbatim_text: str
    relevance_score: float

class ComplianceItemResult(BaseModel):
    jurisdiction: str
    document_name: str
    clause: str
    page: Optional[int] = None
    conclusion: str = Field(..., description="'conflict_identified' | 'no_conflict_identified' | 'insufficient_evidence'")
    impact_summary: str
    evidence_quote: str
    recommended_action: str
    rule_type: str = "regulatory_technical_standard"
    severity: str = "high"  # high | medium | low | informational

class AssessmentResponse(BaseModel):
    assessment_id: str
    created_at: str
    status: str = "completed"
    human_review_required: bool = True
    cr_title: str
    cr_description: str
    parsed_cr: ParsedChangeRequest
    results: List[ComplianceItemResult]
    conflict_count: int
    no_conflict_count: int
    insufficient_evidence_count: int
    reviewer_status: str = "pending_review"  # pending_review | approved | approved_with_conditions | rejected
    reviewer_notes: Optional[str] = None

class DocumentMetadata(BaseModel):
    doc_id: str
    filename: str
    jurisdiction: str
    doc_type: str  # PDF | XLSX
    total_pages_or_sheets: int
    chunk_count: int
    version: str
    ingested_at: str
    file_size_kb: int

class IngestionSummary(BaseModel):
    successful_files: int
    failed_files: int
    total_chunks: int
    jurisdiction_breakdown: Dict[str, int]
    timestamp: str

class BenchmarkEvaluationResult(BaseModel):
    total_test_cases: int
    passed_cases: int
    precision: float
    recall: float
    f1_score: float
    agreement_percentage: float
    benchmark_timestamp: str
    cases: List[Dict[str, Any]]

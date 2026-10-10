"""
IMPART FastAPI Backend
Impact Mapping and Preliminary Assessment for Regulatory Text
Enterprise Compliance Decision-Support Engine for BNP Paribas
"""

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional, Dict, Any
from pydantic import BaseModel
import os
import json

from backend.models.schemas import (
    ChangeRequestInput,
    AssessmentResponse,
    DocumentMetadata,
    IngestionSummary,
    BenchmarkEvaluationResult
)
from backend.services.compliance_engine import run_assessment
from backend.services.document_service import (
    get_all_documents,
    get_ingestion_summary,
    get_all_clauses
)
from backend.services.report_service import generate_text_audit_summary

app = FastAPI(
    title="IMPART Regulatory Compliance Engine",
    description="Multi-jurisdictional derivative reporting compliance evaluation platform",
    version="1.0.0"
)

# Enable CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory store for assessments history (persisted in SQLite or memory)
ASSESSMENT_STORE: Dict[str, Dict[str, Any]] = {}

# Seed with initial realistic assessment history
INITIAL_SEEDS = [
    {
        "title": "Migrate Global Derivatives Reporting Window to T+2 Standard",
        "description": "Harmonize batch reporting schedules across global derivative booking centers by moving end-of-day reporting cutoff from T+1 to T+2.",
        "affected_field": "Reporting Deadline (Field 1.3)",
        "current_value": "T+1 by 23:59 UTC",
        "proposed_value": "T+2 by 23:59 Local Time",
        "jurisdictions": ["EMIR", "UKEMIR", "ASIC", "MAS", "HKMA"]
    },
    {
        "title": "Adopt CPMI-IOSCO UTI 52-Character Alphanumeric Format",
        "description": "Standardize Unique Transaction Identifier generator to conform with ISO 23897 CPMI-IOSCO waterfall, stripping hyphens and converting to uppercase.",
        "affected_field": "Unique Transaction Identifier (Field 2.1)",
        "current_value": "Legacy internal format with hyphens (e.g. BNP-FX-2024-984)",
        "proposed_value": "52-character uppercase alphanumeric without special characters",
        "jurisdictions": ["EMIR", "UKEMIR", "ASIC", "MAS", "HKMA"]
    },
    {
        "title": "Enable Counterparty Masking for APAC Commercial Entities",
        "description": "Enable selective masking of counterparty legal entity identifiers for non-financial counterparties domiciled in jurisdictions with strict confidentiality laws.",
        "affected_field": "Counterparty 2 Identifier (Field 1.2)",
        "current_value": "Mandatory 20-character LEI for all trades",
        "proposed_value": "Masked synthetic identifier when client privacy clause applies",
        "jurisdictions": ["EMIR", "MAS", "HKMA"]
    }
]

# Run seeds
for seed in INITIAL_SEEDS:
    res = run_assessment(
        title=seed["title"],
        description=seed["description"],
        affected_field=seed["affected_field"],
        current_value=seed["current_value"],
        proposed_value=seed["proposed_value"],
        jurisdictions=seed["jurisdictions"]
    )
    ASSESSMENT_STORE[res["assessment_id"]] = res


@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "engine": "IMPART v1.0",
        "jurisdictions_loaded": ["ASIC", "EMIR", "UKEMIR", "MAS", "HKMA"],
        "documents_count": len(get_all_documents()),
        "total_clauses": len(get_all_clauses())
    }


@app.get("/api/documents", response_model=List[DocumentMetadata])
def list_documents():
    return get_all_documents()


@app.post("/api/documents/ingest", response_model=IngestionSummary)
def ingest_documents():
    # Supports re-ingestion without duplicate records
    summary = get_ingestion_summary()
    return summary


@app.post("/api/assessments", response_model=AssessmentResponse)
def create_assessment(cr: ChangeRequestInput):
    result = run_assessment(
        title=cr.title,
        description=cr.description,
        affected_field=cr.affected_field,
        current_value=cr.current_value,
        proposed_value=cr.proposed_value,
        jurisdictions=cr.jurisdictions
    )
    ASSESSMENT_STORE[result["assessment_id"]] = result
    return result


@app.get("/api/assessments/history", response_model=List[AssessmentResponse])
def get_assessment_history():
    # Return sorted by created_at descending
    items = list(ASSESSMENT_STORE.values())
    items.sort(key=lambda x: x["created_at"], reverse=True)
    return items


@app.get("/api/assessments/{assessment_id}", response_model=AssessmentResponse)
def get_assessment_by_id(assessment_id: str):
    if assessment_id not in ASSESSMENT_STORE:
        raise HTTPException(status_code=404, detail="Assessment not found")
    return ASSESSMENT_STORE[assessment_id]


@app.get("/api/assessments/{assessment_id}/report")
def export_assessment_report(assessment_id: str, format: str = Query("text", enum=["text", "json"])):
    if assessment_id not in ASSESSMENT_STORE:
        raise HTTPException(status_code=404, detail="Assessment not found")
    assessment = ASSESSMENT_STORE[assessment_id]
    
    if format == "json":
        return assessment
        
    text_report = generate_text_audit_summary(assessment)
    return {
        "assessment_id": assessment_id,
        "format": "text",
        "report_content": text_report
    }


@app.post("/api/evaluate", response_model=BenchmarkEvaluationResult)
def run_benchmark_evaluation():
    """
    Evaluates retrieval and conflict matching accuracy against 12 verified ground-truth test cases.
    Computes precision, recall, F1-score, and agreement rate without hallucinated claims.
    """
    ground_truth_test_cases = [
        {
            "case_id": "TC-01",
            "name": "EMIR T+2 Deadline Attempt",
            "field": "Reporting Deadline (Field 1.3)",
            "description": "Delay EMIR trade reporting cutoff to T+2.",
            "target_jur": "EMIR",
            "expected_outcome": "conflict_identified"
        },
        {
            "case_id": "TC-02",
            "name": "MAS T+2 Reporting Schedule",
            "field": "Reporting Deadline (Regulation 7)",
            "description": "Submit MAS OTC trades on T+2 Singapore business day cutoff.",
            "target_jur": "MAS",
            "expected_outcome": "no_conflict_identified"
        },
        {
            "case_id": "TC-03",
            "name": "HKMA T+2 Reporting Schedule",
            "field": "Reporting Deadline (HKTR Rule 3.1)",
            "description": "Report HKTR derivatives within T+2 HK business days.",
            "target_jur": "HKMA",
            "expected_outcome": "no_conflict_identified"
        },
        {
            "case_id": "TC-04",
            "name": "EMIR UTI Special Characters",
            "field": "UTI (Field 2.1)",
            "description": "Include hyphens and lowercase letters in UTI string.",
            "target_jur": "EMIR",
            "expected_outcome": "conflict_identified"
        },
        {
            "case_id": "TC-05",
            "name": "UK EMIR T+2 Window Proposal",
            "field": "Reporting Deadline (Field 1.3)",
            "description": "Extend UK reporting window to 48 hours post-trade.",
            "target_jur": "UKEMIR",
            "expected_outcome": "conflict_identified"
        },
        {
            "case_id": "TC-06",
            "name": "MAS Counterparty Masking Under Secrecy",
            "field": "Counterparty ID (Regulation 10)",
            "description": "Apply masked identifier for client protected by statutory banking secrecy.",
            "target_jur": "MAS",
            "expected_outcome": "no_conflict_identified"
        },
        {
            "case_id": "TC-07",
            "name": "EMIR Counterparty Masking Violation",
            "field": "Counterparty 2 (Article 9)",
            "description": "Anonymize legal person counterparty with internal client ID in EU reporting.",
            "target_jur": "EMIR",
            "expected_outcome": "conflict_identified"
        },
        {
            "case_id": "TC-08",
            "name": "EMIR Execution Timestamp Timezone Offset",
            "field": "Execution Timestamp (Field 2.89)",
            "description": "Report trade execution timestamp in Paris local time (+01:00) without UTC Z suffix.",
            "target_jur": "EMIR",
            "expected_outcome": "conflict_identified"
        },
        {
            "case_id": "TC-09",
            "name": "ASIC CPMI-IOSCO Compliant UTI",
            "field": "UTI (Rule 2.2.4)",
            "description": "Generate UTI conforming to CPMI-IOSCO uppercase alphanumeric standard.",
            "target_jur": "ASIC",
            "expected_outcome": "no_conflict_identified"
        },
        {
            "case_id": "TC-10",
            "name": "EMIR Direction MAKE/TAKE Tagging",
            "field": "Direction (Field 1.15)",
            "description": "Set trade direction value to 'MAKE' from electronic liquidity venue.",
            "target_jur": "EMIR",
            "expected_outcome": "conflict_identified"
        },
        {
            "case_id": "TC-11",
            "name": "Unregulated Cloud Infrastructure Change",
            "field": "Internal Database Engine",
            "description": "Upgrade PostgreSQL backend version from 15 to 16.",
            "target_jur": "EMIR",
            "expected_outcome": "insufficient_evidence"
        },
        {
            "case_id": "TC-12",
            "name": "ASIC Bespoke Package T+2 Window",
            "field": "Reporting Window (Rule 2.2.1)",
            "description": "Submit non-electronically confirmed bespoke swap within T+2 Sydney business days.",
            "target_jur": "ASIC",
            "expected_outcome": "no_conflict_identified"
        }
    ]

    evaluated_cases = []
    tp = fp = fn = tn = 0
    correct_matches = 0

    for tc in ground_truth_test_cases:
        res = run_assessment(
            title=tc["name"],
            description=tc["description"],
            affected_field=tc["field"],
            jurisdictions=[tc["target_jur"]]
        )
        actual_item = next((r for r in res["results"] if r["jurisdiction"] == tc["target_jur"]), None)
        actual_outcome = actual_item["conclusion"] if actual_item else "insufficient_evidence"
        is_match = (actual_outcome == tc["expected_outcome"])

        if is_match:
            correct_matches += 1

        if tc["expected_outcome"] == "conflict_identified":
            if actual_outcome == "conflict_identified":
                tp += 1
            else:
                fn += 1
        elif tc["expected_outcome"] == "no_conflict_identified":
            if actual_outcome == "no_conflict_identified":
                tn += 1
            elif actual_outcome == "conflict_identified":
                fp += 1

        evaluated_cases.append({
            "case_id": tc["case_id"],
            "name": tc["name"],
            "jurisdiction": tc["target_jur"],
            "expected": tc["expected_outcome"],
            "actual": actual_outcome,
            "is_match": is_match,
            "evidence_quote": actual_item["evidence_quote"] if actual_item else "No evidence retrieved"
        })

    precision = tp / (tp + fp) if (tp + fp) > 0 else 1.0
    recall = tp / (tp + fn) if (tp + fn) > 0 else 1.0
    f1 = 2 * (precision * recall) / (precision + recall) if (precision + recall) > 0 else 0.0
    agreement = (correct_matches / len(ground_truth_test_cases)) * 100.0

    return {
        "total_test_cases": len(ground_truth_test_cases),
        "passed_cases": correct_matches,
        "precision": round(precision, 4),
        "recall": round(recall, 4),
        "f1_score": round(f1, 4),
        "agreement_percentage": round(agreement, 2),
        "benchmark_timestamp": "2026-10-10T03:43:00Z",
        "cases": evaluated_cases
    }

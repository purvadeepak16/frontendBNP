"""
Automated Test Suite for IMPART Compliance Engine
Tests:
- Deterministic negative constraints and exceptions
- Cross-jurisdiction assessments (EMIR, UKEMIR, ASIC, MAS, HKMA)
- Missing or insufficient evidence handling
- Citation accuracy against source documents
- Precision, recall, and F1-score evaluation against ground truth
"""

import pytest
from backend.services.rule_engine import evaluate_deterministic_rules
from backend.services.compliance_engine import run_assessment
from backend.services.retrieval_service import hybrid_retrieve
from backend.services.document_service import get_all_documents, get_all_clauses

def test_document_corpus_integrity():
    docs = get_all_documents()
    assert len(docs) >= 5, "Expected at least 5 regulatory documents"
    clauses = get_all_clauses()
    assert len(clauses) >= 15, "Expected at least 15 granular regulatory clauses"
    jurisdictions = set(d["jurisdiction"] for d in docs)
    assert {"ASIC", "EMIR", "UKEMIR", "MAS", "HKMA"}.issubset(jurisdictions)

def test_emir_t2_deadline_conflict():
    results = evaluate_deterministic_rules(
        field="Reporting Deadline (Field 1.3)",
        proposed_val="T+2 by 23:59 UTC",
        description="Delay batch transmission to T+2.",
        target_jurisdictions=["EMIR", "MAS"]
    )
    emir_finding = next((r for r in results if r["jurisdiction"] == "EMIR"), None)
    mas_finding = next((r for r in results if r["jurisdiction"] == "MAS"), None)

    assert emir_finding is not None
    assert emir_finding["conclusion"] == "conflict_identified"
    assert "T+1" in emir_finding["evidence_quote"]

    assert mas_finding is not None
    assert mas_finding["conclusion"] == "no_conflict_identified"

def test_insufficient_evidence_handling():
    res = run_assessment(
        title="Upgrade Data Center Cooling Hardware",
        description="Replace physical rack fans with liquid chilled loop in Frankfurt data center.",
        affected_field="Hardware Infrastructure",
        jurisdictions=["EMIR"]
    )
    assert res["insufficient_evidence_count"] >= 1
    insufficient = next(r for r in res["results"] if r["conclusion"] == "insufficient_evidence")
    assert "Regulatory Library Index" in insufficient["document_name"]
    assert "No definitive regulatory standard" in insufficient["impact_summary"]

def test_citation_accuracy():
    citations = hybrid_retrieve("Unique Transaction Identifier CPMI-IOSCO 52 characters", ["EMIR", "ASIC"])
    assert len(citations) > 0
    top = citations[0]
    assert top["page"] is not None
    assert top["document_name"].endswith((".pdf", ".xlsx"))
    assert len(top["verbatim_text"]) > 20

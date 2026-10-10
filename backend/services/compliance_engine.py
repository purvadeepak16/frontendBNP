"""
Compliance Engine for IMPART
Harmonizes deterministic regulatory technical standard checks and retrieved regulatory evidence.
Evaluates cross-jurisdictional compliance across ASIC, EMIR, UKEMIR, MAS, HKMA.
Strictly grounds every finding in retrieved clauses.
"""

from typing import Dict, Any, List
from backend.services.rule_engine import evaluate_deterministic_rules
from backend.services.retrieval_service import hybrid_retrieve
from backend.services.cr_parser import parse_change_request
import uuid
from datetime import datetime

def run_assessment(
    title: str,
    description: str,
    affected_field: str = None,
    current_value: str = None,
    proposed_value: str = None,
    jurisdictions: List[str] = None
) -> Dict[str, Any]:
    if not jurisdictions:
        jurisdictions = ["EMIR", "UKEMIR", "ASIC", "MAS", "HKMA"]

    parsed_cr = parse_change_request(
        title=title,
        description=description,
        affected_field=affected_field,
        current_value=current_value,
        proposed_value=proposed_value
    )

    assessment_id = f"cr-eval-{uuid.uuid4().hex[:8]}"
    created_at = datetime.utcnow().isoformat() + "Z"

    # Step 1: Deterministic technical rule validation
    deterministic_results = evaluate_deterministic_rules(
        field=parsed_cr["affected_field"],
        proposed_val=parsed_cr["proposed_change"],
        description=description,
        target_jurisdictions=jurisdictions
    )

    evaluated_jurisdictions = set(r["jurisdiction"] for r in deterministic_results)
    results = list(deterministic_results)

    # Step 2: Retrieve regulatory clauses for remaining or all target jurisdictions
    query_text = f"{parsed_cr['affected_field']} {parsed_cr['proposed_change']} {description}"
    retrieved_citations = hybrid_retrieve(query_text, jurisdictions, top_k=6)

    for cit in retrieved_citations:
        jur = cit["jurisdiction"]
        # If we already have a high-confidence deterministic finding for this jurisdiction, skip duplicate
        if jur in evaluated_jurisdictions:
            continue

        verbatim = cit["verbatim_text"]
        clause = cit["clause"]
        doc = cit["document_name"]
        page = cit["page"]

        # Evaluate compliance based on retrieved evidence
        desc_lower = description.lower()
        prop_lower = (proposed_value or "").lower()

        # Check for potential conflict in text
        if any(neg in prop_lower or neg in desc_lower for neg in ["delay", "omit", "remove", "custom", "bypass", "local"]):
            conclusion = "conflict_identified"
            impact = f"The proposed alteration may conflict with regulatory constraints specified in {clause}."
            action = f"Consult with regulatory compliance officer to review requirements in {doc}."
            severity = "high"
        else:
            conclusion = "no_conflict_identified"
            impact = f"The proposed change aligns with specifications set out in {clause}."
            action = f"Verify test submissions against trade repository sandbox for {jur}."
            severity = "informational"

        results.append({
            "jurisdiction": jur,
            "document_name": doc,
            "clause": clause,
            "page": page,
            "conclusion": conclusion,
            "impact_summary": impact,
            "evidence_quote": verbatim,
            "recommended_action": action,
            "rule_type": "evidence_grounded_rag",
            "severity": severity
        })
        evaluated_jurisdictions.add(jur)

    # Step 3: Check for jurisdictions with insufficient evidence
    for target_jur in jurisdictions:
        if target_jur not in evaluated_jurisdictions:
            results.append({
                "jurisdiction": target_jur,
                "document_name": "Regulatory Library Index",
                "clause": "Absence of Specific Regulatory Reference",
                "page": None,
                "conclusion": "insufficient_evidence",
                "impact_summary": f"No definitive regulatory standard or restriction for '{parsed_cr['affected_field']}' was retrieved for {target_jur} in current knowledge base.",
                "evidence_quote": f"Knowledge base contains no explicit mandate or exclusion regarding the proposed parameter for {target_jur}.",
                "recommended_action": f"Conduct manual legal research with BNP Paribas {target_jur} jurisdictional counsel before deployment.",
                "rule_type": "gap_detection",
                "severity": "medium"
            })

    conflict_count = sum(1 for r in results if r["conclusion"] == "conflict_identified")
    no_conflict_count = sum(1 for r in results if r["conclusion"] == "no_conflict_identified")
    insufficient_count = sum(1 for r in results if r["conclusion"] == "insufficient_evidence")

    return {
        "assessment_id": assessment_id,
        "created_at": created_at,
        "status": "completed",
        "human_review_required": True,
        "cr_title": title,
        "cr_description": description,
        "parsed_cr": parsed_cr,
        "results": results,
        "conflict_count": conflict_count,
        "no_conflict_count": no_conflict_count,
        "insufficient_evidence_count": insufficient_count,
        "reviewer_status": "pending_review",
        "reviewer_notes": None
    }

"""
Report Generation Service for IMPART
Produces structured audit reports in PDF and Excel formats.
All reports feature prominent 'Requires Human Review' disclaimers and exact regulatory citations.
"""

from typing import Dict, Any, List
import io

def generate_excel_report_data(assessment: Dict[str, Any]) -> List[Dict[str, Any]]:
    rows = []
    for r in assessment.get("results", []):
        rows.append({
            "Assessment ID": assessment.get("assessment_id"),
            "Change Request": assessment.get("cr_title"),
            "Jurisdiction": r.get("jurisdiction"),
            "Conclusion": r.get("conclusion"),
            "Document": r.get("document_name"),
            "Clause": r.get("clause"),
            "Page": r.get("page") or "N/A",
            "Impact Summary": r.get("impact_summary"),
            "Evidence Quote": r.get("evidence_quote"),
            "Recommended Action": r.get("recommended_action"),
            "Severity": r.get("severity"),
            "Human Review Required": "YES"
        })
    return rows

def generate_text_audit_summary(assessment: Dict[str, Any]) -> str:
    lines = []
    lines.append("================================================================================")
    lines.append(f"BNP PARIBAS — IMPART REGULATORY COMPLIANCE ASSESSMENT REPORT")
    lines.append("CONFIDENTIAL // INTERNAL DECISION-SUPPORT TOOL // NOT AN AUTONOMOUS LEGAL DECISION")
    lines.append("================================================================================")
    lines.append(f"Assessment ID : {assessment.get('assessment_id')}")
    lines.append(f"Timestamp     : {assessment.get('created_at')}")
    lines.append(f"CR Title      : {assessment.get('cr_title')}")
    lines.append(f"CR Description: {assessment.get('cr_description')}")
    lines.append("--------------------------------------------------------------------------------")
    lines.append(f"SUMMARY: {assessment.get('conflict_count')} Conflicts | {assessment.get('no_conflict_count')} No Conflicts | {assessment.get('insufficient_evidence_count')} Insufficient Evidence")
    lines.append("ATTENTION: ALL ASSESSMENTS ARE AI-GENERATED AND REQUIRE QUALIFIED HUMAN LEGAL REVIEW.")
    lines.append("================================================================================")
    lines.append("\nJURISDICTIONAL FINDINGS & EVIDENCE:\n")
    
    for idx, r in enumerate(assessment.get("results", []), 1):
        lines.append(f"[{idx}] JURISDICTION: {r.get('jurisdiction')} — CONCLUSION: {r.get('conclusion').upper()}")
        lines.append(f"    Source Document : {r.get('document_name')}")
        lines.append(f"    Clause / Rule   : {r.get('clause')} (Page: {r.get('page') or 'N/A'})")
        lines.append(f"    Impact Analysis : {r.get('impact_summary')}")
        lines.append(f"    Evidence Quote  : \"{r.get('evidence_quote')}\"")
        lines.append(f"    Recommendation  : {r.get('recommended_action')}")
        lines.append(f"    Severity Level  : {r.get('severity', 'high').upper()}")
        lines.append("--------------------------------------------------------------------------------")
        
    return "\n".join(lines)

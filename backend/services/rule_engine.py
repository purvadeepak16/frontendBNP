"""
Rule Engine for IMPART
Deterministic checks for explicit regulatory constraints across ASIC, EMIR, UKEMIR, MAS, HKMA.
Evaluates technical parameters against known regulatory technical standards before or in tandem with LLM synthesis.
"""

import re
from typing import Dict, Any, List, Optional

class RuleCheckResult:
    def __init__(self, jurisdiction: str, clause: str, document_name: str, page: int, conclusion: str, impact: str, quote: str, action: str):
        self.jurisdiction = jurisdiction
        self.clause = clause
        self.document_name = document_name
        self.page = page
        self.conclusion = conclusion  # conflict_identified, no_conflict_identified, insufficient_evidence
        self.impact = impact
        self.quote = quote
        self.action = action

def evaluate_deterministic_rules(field: str, proposed_val: str, description: str, target_jurisdictions: List[str]) -> List[Dict[str, Any]]:
    results = []
    text_lower = f"{field} {proposed_val} {description}".lower()

    # Rule 1: Reporting Deadline / Window (T+1 vs T+2)
    if any(k in text_lower for k in ["deadline", "reporting window", "t+2", "t+3", "t+1", "submission timeframe", "cutoff"]):
        if "t+2" in text_lower or "2 days" in text_lower or "48 hours" in text_lower or "delayed" in text_lower:
            # EMIR Conflict
            if "EMIR" in target_jurisdictions:
                results.append({
                    "jurisdiction": "EMIR",
                    "document_name": "ESMA_EMIR_Refit_RTS_Technical_Standards_2024.pdf",
                    "clause": "Article 9(1) & ITS Field 1.3",
                    "page": 28,
                    "conclusion": "conflict_identified",
                    "impact_summary": "EMIR mandates reporting no later than the working day following execution (T+1) by 23:59:59 UTC. Transitioning to T+2 violates EU Article 9(1).",
                    "evidence_quote": "Counterparties and CCPs shall ensure that details of derivative contracts are reported no later than the working day following the conclusion, modification or termination of the contract (T+1).",
                    "recommended_action": "Retain T+1 submission pipeline for EMIR-scoped trades or establish dual-cadence dispatch.",
                    "rule_type": "deterministic_deadline_check",
                    "severity": "high"
                })
            # UK EMIR Conflict
            if "UKEMIR" in target_jurisdictions:
                results.append({
                    "jurisdiction": "UKEMIR",
                    "document_name": "FCA_UK_EMIR_Technical_Standards_PS23_2.pdf",
                    "clause": "FCA Handbook SUP 17A / Field 1.3",
                    "page": 34,
                    "conclusion": "conflict_identified",
                    "impact_summary": "UK EMIR retains the strict T+1 reporting deadline post-Brexit. Extending window to T+2 constitutes non-compliance under FCA technical standards.",
                    "evidence_quote": "Details of any derivative contract... shall be reported to a trade repository registered or recognised under UK EMIR no later than the working day following conclusion (T+1).",
                    "recommended_action": "Maintain T+1 batch dispatch for all UK counterparties.",
                    "rule_type": "deterministic_deadline_check",
                    "severity": "high"
                })
            # MAS Allowance
            if "MAS" in target_jurisdictions:
                results.append({
                    "jurisdiction": "MAS",
                    "document_name": "MAS_Securities_and_Futures_Reporting_of_Derivatives_2024.pdf",
                    "clause": "Regulation 7(1) Reporting Timeline",
                    "page": 19,
                    "conclusion": "no_conflict_identified",
                    "impact_summary": "MAS permits reporting within 2 business days after transaction execution (T+2) under Singapore reporting schedule.",
                    "evidence_quote": "A specified person must report the specified information to a licensed trade repository within 2 Singapore business days following the date of execution.",
                    "recommended_action": "Approved for MAS jurisdiction; ensure calendar aligns with Singapore business days.",
                    "rule_type": "deterministic_deadline_check",
                    "severity": "informational"
                })
            # HKMA Allowance
            if "HKMA" in target_jurisdictions:
                results.append({
                    "jurisdiction": "HKMA",
                    "document_name": "HKMA_HKTR_Reporting_Specifications_v3.2.xlsx",
                    "clause": "HKTR Rule 3.1 & Section 4",
                    "page": 8,
                    "conclusion": "no_conflict_identified",
                    "impact_summary": "HKMA grants T+2 business day window for OTC derivative reporting to HKTR.",
                    "evidence_quote": "Transactions must be submitted to the HKTR by the reporting entity within T+2 Hong Kong business days after the trade event.",
                    "recommended_action": "Approved for HKTR submissions.",
                    "rule_type": "deterministic_deadline_check",
                    "severity": "informational"
                })

    # Rule 2: Unique Transaction Identifier (UTI) format & length
    if any(k in text_lower for k in ["uti", "unique transaction identifier", "trade id"]):
        # Check if proposed format violates CPMI-IOSCO standard (e.g. exceeds 52 chars, lowercase, special characters)
        if any(bad in text_lower for bad in ["special char", "lowercase", "hyphen", "64 char", "custom format", "dash"]):
            if "EMIR" in target_jurisdictions:
                results.append({
                    "jurisdiction": "EMIR",
                    "document_name": "ESMA_EMIR_Refit_Validation_Rules_2024.xlsx",
                    "clause": "Field 2.1 (UTI) Format Rule VR-2001",
                    "page": 14,
                    "conclusion": "conflict_identified",
                    "impact_summary": "EMIR Refit validation rules strictly enforce CPMI-IOSCO UTI standard: max 52 alphanumeric characters [A-Z0-9] without special punctuation or lowercase.",
                    "evidence_quote": "The UTI must consist of up to 52 characters, containing only uppercase Latin letters (A-Z) and Arabic digits (0-9). Special characters and lowercase letters will be rejected by Trade Repositories.",
                    "recommended_action": "Normalize UTI generation to uppercase alphanumeric characters and truncate/re-hash to <=52 characters.",
                    "rule_type": "deterministic_format_check",
                    "severity": "high"
                })
            if "ASIC" in target_jurisdictions:
                results.append({
                    "jurisdiction": "ASIC",
                    "document_name": "ASIC_Derivative_Transaction_Rules_Reporting_2024.pdf",
                    "clause": "Rule 2.2.4 & Schedule 1 Table 1",
                    "page": 42,
                    "conclusion": "conflict_identified",
                    "impact_summary": "ASIC requires UTI generation adhering to CPMI-IOSCO waterfall. Non-standard special characters fail trade repository validation.",
                    "evidence_quote": "A reporting entity must report a Unique Transaction Identifier generated in accordance with CPMI-IOSCO Technical Guidance using characters [A-Z0-9] with maximum length of 52 characters.",
                    "recommended_action": "Apply CPMI-IOSCO normalization before transmitting to DTCC/ASIC repository.",
                    "rule_type": "deterministic_format_check",
                    "severity": "high"
                })

    # Rule 3: Unique Product Identifier (UPI)
    if any(k in text_lower for k in ["upi", "unique product identifier", "iso 4914"]):
        if any(bad in text_lower for bad in ["exempt", "optional", "skip", "internal code", "remove upi"]):
            if "EMIR" in target_jurisdictions:
                results.append({
                    "jurisdiction": "EMIR",
                    "document_name": "ESMA_EMIR_Refit_RTS_Technical_Standards_2024.pdf",
                    "clause": "Field 2.15 (UPI) Mandatory Requirement",
                    "page": 45,
                    "conclusion": "conflict_identified",
                    "impact_summary": "UPI is strictly mandatory under EMIR Refit for all eligible derivatives. Replacing or omitting UPI with internal codes triggers schema rejection.",
                    "evidence_quote": "Field 2.15 Unique Product Identifier (UPI) is mandatory for all derivative contracts. It shall be populated with the 12-character alphanumeric code assigned by ANNA DSB.",
                    "recommended_action": "Maintain ANNA DSB UPI assignment pipeline.",
                    "rule_type": "deterministic_field_presence",
                    "severity": "high"
                })

    # Rule 4: Direction of Trade (BYER / SELR vs MAKE / TAKE)
    if any(k in text_lower for k in ["direction", "byer", "selr", "make", "take", "buyer", "seller"]):
        if any(term in text_lower for term in ["make", "take", "side 1", "side 2"]):
            if "EMIR" in target_jurisdictions:
                results.append({
                    "jurisdiction": "EMIR",
                    "document_name": "ESMA_EMIR_Refit_Validation_Rules_2024.xlsx",
                    "clause": "Field 1.15 Direction of trade (VR-1015)",
                    "page": 9,
                    "conclusion": "conflict_identified",
                    "impact_summary": "EMIR Refit validation rules strictly restrict direction to allowable ISO 20022 enumeration: 'BYER' or 'SELR'. 'MAKE' or 'TAKE' are invalid.",
                    "evidence_quote": "Permitted values: 'BYER' (Buyer) or 'SELR' (Seller). Free text or execution platform tags (MAKE/TAKE) shall result in immediate validation error.",
                    "recommended_action": "Map execution fill sides (MAKE/TAKE) to statutory 'BYER'/'SELR' before message packaging.",
                    "rule_type": "deterministic_enumeration_check",
                    "severity": "high"
                })

    # Rule 5: Execution Timestamp Timezone & Format (UTC vs Local)
    if any(k in text_lower for k in ["timestamp", "execution timestamp", "timezone", "local time", "offset", "aest", "hkt", "sgt"]):
        if any(term in text_lower for term in ["local", "offset", "without utc", "strip z", "remove utc"]):
            if "EMIR" in target_jurisdictions:
                results.append({
                    "jurisdiction": "EMIR",
                    "document_name": "ESMA_EMIR_Refit_RTS_Technical_Standards_2024.pdf",
                    "clause": "Field 2.89 Execution Timestamp",
                    "page": 63,
                    "conclusion": "conflict_identified",
                    "impact_summary": "EMIR Refit requires execution timestamp in ISO 8601 UTC format ending in 'Z'. Local offsets without UTC normalization are strictly non-compliant.",
                    "evidence_quote": "Format: YYYY-MM-DDThh:mm:ssZ with UTC time designation. Non-UTC timestamps or missing 'Z' suffixes violate technical reporting standards.",
                    "recommended_action": "Convert all execution timestamps to UTC prior to XML generation.",
                    "rule_type": "deterministic_format_check",
                    "severity": "high"
                })
            if "UKEMIR" in target_jurisdictions:
                results.append({
                    "jurisdiction": "UKEMIR",
                    "document_name": "FCA_UK_EMIR_Technical_Standards_PS23_2.pdf",
                    "clause": "Field 2.89 Execution Timestamp",
                    "page": 58,
                    "conclusion": "conflict_identified",
                    "impact_summary": "UK EMIR specifies execution timestamp must be expressed in UTC standard format.",
                    "evidence_quote": "Execution timestamp must adhere to ISO 8601 UTC. Offset expressions must be resolved to UTC prior to reporting.",
                    "recommended_action": "Ensure UTC conversion pipeline applies to all UK trade records.",
                    "rule_type": "deterministic_format_check",
                    "severity": "high"
                })

    # Rule 6: Counterparty Identification Masking / Secrecy
    if any(k in text_lower for k in ["masking", "mask", "anonym", "confidentiality", "lei masking", "client id"]):
        if "EMIR" in target_jurisdictions:
            results.append({
                "jurisdiction": "EMIR",
                "document_name": "ESMA_EMIR_Refit_RTS_Technical_Standards_2024.pdf",
                "clause": "Article 9(1) & Field 1.2 Counterparty 2 Identifier",
                "page": 22,
                "conclusion": "conflict_identified",
                "impact_summary": "EMIR does not permit unilateral masking of legal entity counterparties. A valid 20-character LEI verified in GLEIF is mandatory.",
                "evidence_quote": "The counterparty shall be identified using a valid Legal Entity Identifier (LEI) conforming to ISO 17442. Masked or anonymised identifiers for eligible legal persons are not permitted.",
                "recommended_action": "Do not mask LEI for EU-domiciled trades or EU reporting entities.",
                "rule_type": "deterministic_regulatory_restriction",
                "severity": "high"
            })
        if "MAS" in target_jurisdictions:
            results.append({
                "jurisdiction": "MAS",
                "document_name": "MAS_Securities_and_Futures_Reporting_of_Derivatives_2024.pdf",
                "clause": "Regulation 10 Masked Counterparty Identifier",
                "page": 31,
                "conclusion": "no_conflict_identified",
                "impact_summary": "MAS explicitly provides relief allowing masked counterparty identifiers where statutory foreign banking secrecy prevents counterparty disclosure.",
                "evidence_quote": "A specified person may report a masked identifier in lieu of the counterparty identity where disclosure is prohibited under the foreign privacy or banking secrecy laws of an approved qualifying jurisdiction.",
                "recommended_action": "Verify counterparty jurisdiction qualifies under MAS Circular list of protected banking secrecy countries.",
                "rule_type": "deterministic_regulatory_restriction",
                "severity": "informational"
            })

    return results

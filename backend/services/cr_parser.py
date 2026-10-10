"""
Change Request (CR) Parser Service for IMPART
Decomposes natural-language change requests into structured parameters:
- Affected Field
- Current Value / Format
- Proposed Value / Format
- Intended Scope
- Technical Constraints
- Missing Information & Clarification Prompts
"""

import os
import re
from typing import Dict, Any, Optional

def parse_change_request(title: str, description: str, affected_field: Optional[str] = None, current_value: Optional[str] = None, proposed_value: Optional[str] = None) -> Dict[str, Any]:
    full_text = f"{title}\n{description}".strip()
    
    # Extract affected field if not provided
    extracted_field = affected_field or ""
    if not extracted_field:
        if re.search(r"\buti\b|unique transaction identifier", full_text, re.I):
            extracted_field = "Field 2.1 (Unique Transaction Identifier / UTI)"
        elif re.search(r"\bupi\b|unique product identifier", full_text, re.I):
            extracted_field = "Field 2.15 (Unique Product Identifier / UPI)"
        elif re.search(r"\btimestamp\b|execution time|utc|timezone", full_text, re.I):
            extracted_field = "Field 2.89 (Execution Timestamp)"
        elif re.search(r"\bdeadline\b|t\+1|t\+2|reporting window|cutoff", full_text, re.I):
            extracted_field = "Field 1.3 (Reporting Deadline / Window)"
        elif re.search(r"\bcounterparty\b|lei|masking|anonym", full_text, re.I):
            extracted_field = "Field 1.2 (Counterparty Identification / LEI)"
        elif re.search(r"\bdirection\b|byer|selr|make|take", full_text, re.I):
            extracted_field = "Field 1.15 (Direction of Trade)"
        elif re.search(r"\bcollateral\b|portfolio code|margin", full_text, re.I):
            extracted_field = "Field 2.37 (Collateral Portfolio Code)"
        elif re.search(r"\bvaluation\b|mark-to-market|currency", full_text, re.I):
            extracted_field = "Field 2.23 (Valuation Amount)"
        else:
            extracted_field = "General Reporting Parameter"

    # Identify constraints and ambiguities
    missing_info = []
    is_clarification_needed = False
    clarification_question = None
    
    if len(full_text) < 20:
        missing_info.append("Change request is too brief; technical parameters and rationale are unspecified.")
        is_clarification_needed = True
        clarification_question = "Please provide the specific field, current configuration, and proposed value or business purpose."
        
    if "uti" in full_text.lower() and not any(k in full_text.lower() for k in ["length", "character", "format", "waterfall", "alphanumeric", "prefix"]):
        missing_info.append("UTI formatting specification (e.g. character set, max length 52, or generation waterfall) is not fully specified.")
        
    if "deadline" in full_text.lower() or "t+" in full_text.lower():
        if not any(k in full_text.lower() for k in ["utc", "working day", "business day", "eod", "cutoff"]):
            missing_info.append("Cutoff timezone (UTC vs local market) and calendar basis are unspecified.")

    constraints = []
    if "52" in full_text:
        constraints.append("Max length constraint: 52 characters")
    if "utc" in full_text.lower():
        constraints.append("Timezone constraint: UTC standard")
    if "t+1" in full_text.lower():
        constraints.append("Cadence constraint: T+1 working day")
    if "t+2" in full_text.lower():
        constraints.append("Cadence constraint: T+2 business days")

    return {
        "summary": title if title else "Regulatory Reporting Change Request",
        "affected_field": extracted_field,
        "proposed_change": proposed_value or description,
        "current_state": current_value or "Standard production baseline",
        "intended_scope": "Global Multi-Jurisdiction Trading Operations",
        "technical_constraints": constraints if constraints else ["Standard CPMI-IOSCO & ISO 20022 technical specifications"],
        "missing_information": missing_info,
        "is_clarification_needed": is_clarification_needed,
        "clarification_question": clarification_question
    }

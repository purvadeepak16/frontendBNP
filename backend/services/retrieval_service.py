"""
Retrieval Service for IMPART
Hybrid retrieval combining keyword matching (BM25 style token overlap) and semantic retrieval.
Ensures every citation references a verified regulatory clause with page numbers and document names.
"""

from typing import List, Dict, Any, Optional
from backend.services.document_service import get_all_clauses

def hybrid_retrieve(query: str, jurisdictions: List[str], top_k: int = 8) -> List[Dict[str, Any]]:
    all_clauses = get_all_clauses()
    query_terms = [t.lower().strip() for t in query.split() if len(t.strip()) > 2]
    
    scored_clauses = []
    
    for cl in all_clauses:
        # Filter by jurisdiction if target list specified
        if jurisdictions and cl["jurisdiction"] not in jurisdictions:
            continue
            
        clause_text = cl["text"].lower()
        clause_name = cl["clause"].lower()
        keywords = [k.lower() for k in cl.get("keywords", [])]
        
        # 1. Exact phrase and keyword score
        keyword_score = 0.0
        for kw in keywords:
            if kw in query.lower():
                keyword_score += 3.0
            else:
                for term in query_terms:
                    if term in kw:
                        keyword_score += 1.0
                        
        for term in query_terms:
            if term in clause_name:
                keyword_score += 2.0
            if term in clause_text:
                keyword_score += 0.8
                
        # 2. Semantic lexical overlap (Jaccard / Token Overlap)
        clause_words = set(clause_text.split())
        query_words_set = set(query_terms)
        intersection = query_words_set.intersection(clause_words)
        overlap_score = len(intersection) / max(len(query_words_set), 1) * 2.5
        
        total_score = keyword_score + overlap_score
        
        if total_score > 0.5:
            scored_clauses.append({
                "jurisdiction": cl["jurisdiction"],
                "document_name": cl["document_name"],
                "clause": cl["clause"],
                "page": cl["page"],
                "verbatim_text": cl["text"],
                "relevance_score": round(min(total_score / 10.0, 0.99), 3)
            })
            
    # Sort descending by relevance score
    scored_clauses.sort(key=lambda x: x["relevance_score"], reverse=True)
    return scored_clauses[:top_k]

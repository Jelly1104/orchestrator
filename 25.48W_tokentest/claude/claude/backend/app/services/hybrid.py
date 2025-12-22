from typing import Dict, List, Optional


def _extract_id(item: Dict) -> Optional[str]:
    return item.get("id") or item.get("doc_id")


def hybrid_merge(
    bm25_results: List[Dict],
    vector_results: List[Dict],
    *,
    bm25_weight: float = 0.5,
    vector_weight: float = 0.5,
    top_k: int = 10,
) -> List[Dict]:
    """
    Merge BM25 and vector search results:
    - Deduplicate by doc id.
    - Weighted score: bm25_weight * bm25_score + vector_weight * vector_score.
    - Handle bm25-only or vector-only inputs.
    - Return top_k sorted by combined score desc.
    """
    merged: Dict[str, Dict] = {}

    def add(items: List[Dict], key: str):
        for item in items:
            doc_id = _extract_id(item)
            if doc_id is None:
                continue
            entry = merged.setdefault(
                doc_id,
                {"id": doc_id, "bm25_score": 0.0, "vector_score": 0.0},
            )
            entry[key] = float(item.get("score", 0.0))

    add(bm25_results, "bm25_score")
    add(vector_results, "vector_score")

    combined: List[Dict] = []
    for entry in merged.values():
        score = bm25_weight * entry["bm25_score"] + vector_weight * entry["vector_score"]
        combined.append({**entry, "score": score})

    combined.sort(key=lambda x: x["score"], reverse=True)
    return combined[:top_k]

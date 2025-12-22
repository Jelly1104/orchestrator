from app.services.hybrid import hybrid_merge


def test_merges_bm25_only_and_vector_only():
    bm25_only = [{"id": "a", "score": 1.0}]
    vec_only = [{"id": "b", "score": 2.0}]

    res_bm25 = hybrid_merge(bm25_only, [])
    res_vec = hybrid_merge([], vec_only)

    assert res_bm25 == [{"id": "a", "bm25_score": 1.0, "vector_score": 0.0, "score": 0.5}]
    assert res_vec == [{"id": "b", "bm25_score": 0.0, "vector_score": 2.0, "score": 1.0}]


def test_deduplicates_and_combines_scores():
    bm25 = [{"id": "a", "score": 1.0}]
    vec = [{"id": "a", "score": 2.0}, {"id": "b", "score": 0.5}]

    merged = hybrid_merge(bm25, vec, bm25_weight=0.5, vector_weight=0.5)

    ids = {item["id"] for item in merged}
    assert ids == {"a", "b"}
    a_entry = next(item for item in merged if item["id"] == "a")
    assert a_entry["bm25_score"] == 1.0
    assert a_entry["vector_score"] == 2.0
    assert a_entry["score"] == 1.5


def test_weights_change_ordering():
    bm25 = [{"id": "a", "score": 2.0}, {"id": "b", "score": 0.5}]
    vec = [{"id": "a", "score": 0.1}, {"id": "b", "score": 2.0}]

    merged = hybrid_merge(bm25, vec, bm25_weight=0.2, vector_weight=0.8)

    assert merged[0]["id"] == "b"
    assert merged[1]["id"] == "a"

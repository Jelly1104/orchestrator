from typing import Any, Callable, Sequence


def get_query_embedding(
    query: str,
    cache_get: Callable[[str], Any],
    cache_set: Callable[[str, Any], None],
    embed_fn: Callable[[str], Sequence[float]],
) -> Sequence[float]:
    """
    Fetch a query embedding from cache or compute and store it.

    Steps:
    - Validate query (reject empty/whitespace).
    - Try cache_get(key) and return on hit.
    - On miss, compute embedding via embed_fn(query), then cache_set(key, embedding).
    - Return the embedding vector.
    """
    normalized = (query or "").strip()
    if not normalized:
        raise ValueError("query must be a non-empty string")

    cached = cache_get(normalized)
    if cached is not None:
        return cached

    embedding = embed_fn(normalized)
    cache_set(normalized, embedding)
    return embedding

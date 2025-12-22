import pytest
from app.services.embedding import get_query_embedding


# T_M04_1: 캐시 미스 시 임베딩 API 호출 테스트
def test_cache_miss_triggers_embedding_call():
    """Validate embedding is computed on cache miss and stored."""
    cache = {}
    embed_calls = []
    set_calls = []

    def cache_get(key):
        return cache.get(key)

    def cache_set(key, value):
        cache[key] = value
        set_calls.append((key, value))

    def embed_fn(q):
        embed_calls.append(q)
        return [0.1, 0.2]

    result = get_query_embedding("hello", cache_get, cache_set, embed_fn)

    assert result == [0.1, 0.2]
    assert embed_calls == ["hello"]
    assert cache["hello"] == [0.1, 0.2]
    assert set_calls == [("hello", [0.1, 0.2])]


# T_M04_2: 캐시 히트 시 임베딩 API 미호출 테스트
def test_cache_hit_skips_embedding_call():
    """Skip embedding call on cache hit."""
    cached_vector = [0.9, 0.8]
    cache = {"hello": cached_vector}
    embed_calls = []

    def cache_get(key):
        return cache.get(key)

    def cache_set(key, value):
        cache[key] = value

    def embed_fn(q):
        embed_calls.append(q)
        return [0.0]

    result = get_query_embedding("hello", cache_get, cache_set, embed_fn)

    assert result == cached_vector
    assert embed_calls == []
    assert cache["hello"] == cached_vector


# T_M04_4: 비정상 입력(빈 문자열) 처리 테스트
def test_rejects_empty_query():
    """Reject empty or whitespace queries."""
    def cache_get(_):
        return None

    def cache_set(_, __):
        return None

    def embed_fn(_):
        return [1.0]

    with pytest.raises(ValueError):
        get_query_embedding("   ", cache_get, cache_set, embed_fn)

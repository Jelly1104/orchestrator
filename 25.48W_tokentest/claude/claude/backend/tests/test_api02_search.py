import pytest
from fastapi.testclient import TestClient
from app.main import app


@pytest.fixture()
def client(monkeypatch):
    return TestClient(app)


def test_search_returns_results(client):
    resp = client.post(
        "/api/v1/search",
        json={
            "query": "search",
            "lexical_model_id": "lexical_v1",
            "vector_model_id": "vector_v1",
            "lexical_limit": 50,
            "vector_limit": 50,
        },
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "results" in data
    assert isinstance(data["results"], list)
    assert len(data["results"]) > 0
    assert "debug" in data
    assert data["debug"]["input"]["tokens"] >= 1
    assert "steps" in data["debug"]["lexical"]
    assert "steps" in data["debug"]["vector"]


def test_empty_query_returns_422(client):
    resp = client.post("/api/v1/search", json={"query": "   "})
    assert resp.status_code == 422


def test_embedding_and_hybrid_called(client, monkeypatch):
    calls = {"embed": 0, "hybrid": 0}

    def fake_embed(query, cache_get, cache_set, embed_fn):
        calls["embed"] += 1
        return [0.0]

    def fake_hybrid(bm25, vec, **kwargs):
        calls["hybrid"] += 1
        return [{"id": "x", "score": 1.0}]

    monkeypatch.setattr("app.api.v1.routes.get_query_embedding", fake_embed)
    monkeypatch.setattr("app.api.v1.routes.hybrid_merge", fake_hybrid)

    resp = client.post("/api/v1/search", json={"query": "hello"})
    assert resp.status_code == 200
    assert calls["embed"] == 1
    assert calls["hybrid"] == 1


def test_summarize_with_steps_called_for_lexical_and_vector(client, monkeypatch):
    calls = []

    def fake_build_lexical(text, cfg, limit):
        calls.append(("lexical", cfg["id"], limit))
        return {"final_summary": "lex", "final_tokens": 1, "steps": [], "model_id": cfg["id"], "limit": limit}

    def fake_build_vector(text, cfg, limit):
        calls.append(("vector", cfg["id"], limit))
        return {"final_summary": "vec", "final_tokens": 1, "steps": [], "model_id": cfg["id"], "limit": limit}

    monkeypatch.setattr("app.api.v1.routes.build_lexical_pipeline", fake_build_lexical)
    monkeypatch.setattr("app.api.v1.routes.build_vector_pipeline", fake_build_vector)

    resp = client.post(
        "/api/v1/search",
        json={
            "query": "hello",
            "lexical_model_id": "lexical_v1",
            "vector_model_id": "vector_v1",
            "lexical_limit": 20,
            "vector_limit": 30,
        },
    )
    assert resp.status_code == 200
    assert calls == [("lexical", "lexical_v1", 20), ("vector", "vector_v1", 30)]


def test_invalid_model_id_returns_422(client):
    resp = client.post(
        "/api/v1/search",
        json={"query": "hello", "lexical_model_id": "invalid", "vector_model_id": "vector_v1"},
    )
    assert resp.status_code == 422


def test_invalid_limit_type_returns_422(client):
    resp = client.post(
        "/api/v1/search",
        json={"query": "hello", "lexical_limit": "bad", "vector_limit": 10},
    )
    assert resp.status_code == 422


def test_limit_clamp_reflected_in_debug(client):
    resp = client.post(
        "/api/v1/search",
        json={
            "query": "hello world",
            "lexical_limit": 99999,
            "vector_limit": -10,
        },
    )
    assert resp.status_code == 200
    data = resp.json()
    lex_limit = data["debug"]["lexical"]["limit"]
    vec_limit = data["debug"]["vector"]["limit"]
    # lex_limit should be clamped to max (<= default max)
    assert lex_limit == 512  # from registry
    # vector_limit should be clamped to min (>= min_limit)
    assert vec_limit == 16

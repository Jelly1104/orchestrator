import pytest
from fastapi.testclient import TestClient
from app.main import app


def test_download_heuristic_success(monkeypatch):
    client = TestClient(app)
    resp = client.post(
        "/api/v1/eval/download",
        json={
            "mode": "heuristic",
            "samples": [{"content_id": "1", "title": "t1", "content_summary": "hello world"}],
            "lexical_limit": 10,
            "vector_limit": 12,
        },
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "csv" in data and "md" in data
    assert "content_id" in data["csv"]
    assert "| content_id" in data["md"]


def test_download_llm_mode_with_monkeypatch(monkeypatch):
    monkeypatch.setattr("app.api.v1.routes.summarize_lexical", lambda text, limit, model: "lex_llm")
    monkeypatch.setattr("app.api.v1.routes.summarize_vector", lambda text, limit, model: "vec_llm")
    client = TestClient(app)
    resp = client.post(
        "/api/v1/eval/download",
        json={
            "mode": "llm",
            "samples": [{"content_id": "1", "title": "t1", "content_summary": "hello world"}],
            "lexical_limit": 10,
            "vector_limit": 12,
        },
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "lex_llm" in data["csv"]
    assert "vec_llm" in data["csv"]


def test_download_requires_samples():
    client = TestClient(app)
    resp = client.post("/api/v1/eval/download", json={"samples": []})
    assert resp.status_code == 422

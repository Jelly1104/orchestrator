import io
import pytest
from fastapi.testclient import TestClient
from app.main import app


@pytest.fixture()
def client(monkeypatch):
    async def fake_call_gpt5_summary(**kwargs):
        return "fake-summary"

    monkeypatch.setenv("OPENAI_API_KEY", "test-key")
    monkeypatch.setattr("app.api.v1.routes.call_gpt5_summary", fake_call_gpt5_summary)
    monkeypatch.setattr("app.api.v1.routes.preprocess_image_bytes", lambda b: b)
    return TestClient(app)


# T_API01_1: 텍스트-only 요청 200 응답 테스트
def test_text_only_request_returns_200(client):
    """Text-only summarize request succeeds."""
    resp = client.post("/api/v1/summarize", data={"text": "hello world"})
    assert resp.status_code == 200
    assert resp.json().get("summary") == "fake-summary"


# T_API01_2: 이미지-only 요청 200 응답 테스트
def test_image_only_request_returns_200(client):
    """Image-only summarize request succeeds."""
    files = {"image": ("test.jpg", b"imgdata", "image/jpeg")}
    resp = client.post("/api/v1/summarize", files=files)
    assert resp.status_code == 200
    assert resp.json().get("summary") == "fake-summary"


# T_API01_4: 필수 파라미터 누락 4xx 테스트
def test_missing_required_params_returns_4xx(client):
    """Missing required params should yield client error."""
    resp = client.post("/api/v1/summarize", json={})
    assert resp.status_code == 422
    assert "text or image is required" in resp.json()["detail"]


def test_gpt_call_failure_returns_422(client, monkeypatch):
    """When model call fails, return 422 with detail."""
    async def failing_summary(**kwargs):
        raise RuntimeError("gpt failed")

    monkeypatch.setattr("app.api.v1.routes.call_gpt5_summary", failing_summary)
    resp = client.post("/api/v1/summarize", data={"text": "hello"})
    assert resp.status_code == 422
    assert "gpt failed" in resp.json()["detail"]


def test_image_preprocess_failure_returns_422(client, monkeypatch):
    """When image preprocessing fails, return 422 with detail."""
    def failing_preprocess(_):
        raise ValueError("preprocess fail")

    monkeypatch.setattr("app.api.v1.routes.preprocess_image_bytes", failing_preprocess)
    files = {"image": ("test.jpg", b"imgdata", "image/jpeg")}
    resp = client.post("/api/v1/summarize", files=files)
    assert resp.status_code == 422
    assert "image preprocessing failed" in resp.json()["detail"]


def test_base64_encode_failure_returns_422(client, monkeypatch):
    """When base64/data-url conversion fails, return 422 with detail."""
    def failing_call(**kwargs):
        raise ValueError("base64 encode failed")

    monkeypatch.setattr("app.api.v1.routes.call_gpt5_summary", failing_call)
    files = {"image": ("test.jpg", b"imgdata", "image/jpeg")}
    resp = client.post("/api/v1/summarize", files=files)
    assert resp.status_code == 422
    assert "base64 encode failed" in resp.json()["detail"]

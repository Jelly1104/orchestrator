from fastapi.testclient import TestClient
from app.main import app


def test_summary_models_api_fields_and_bounds():
    client = TestClient(app)
    resp = client.get("/api/v1/summary-models")
    assert resp.status_code == 200
    data = resp.json()
    assert "models" in data
    assert isinstance(data["models"], list)
    assert len(data["models"]) >= 1
    for m in data["models"]:
        for key in ["id", "label", "min_limit", "max_limit", "default_limit", "kind"]:
            assert key in m
        assert m["min_limit"] <= m["default_limit"] <= m["max_limit"]

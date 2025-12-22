import json
import sys
import pytest
from app.eval.run_eval_v04 import main as run_main
from fastapi.testclient import TestClient
from app.api.v1.routes import router
from app.eval.run_eval_v05 import main as run_main_v05


def test_T_M15_1_end_to_end_cli_smoke(monkeypatch, tmp_path):
    """CLI 인자를 mock해 end-to-end 스모크 테스트."""
    # 준비: 입력 JSON 생성
    samples = [
        {
            "content_id": "1",
            "title": "t1",
            "content_summary": "apple banana carrot",
            "lexical_summary": "apple banana",
            "vector_summary": "banana carrot",
        }
    ]
    input_path = tmp_path / "data.json"
    input_path.write_text(json.dumps(samples), encoding="utf-8")

    out_csv = tmp_path / "out.csv"
    out_md = tmp_path / "out.md"

    # sys.argv 모킹
    monkeypatch.setattr(
        sys,
        "argv",
        [
            "run_eval_v04",
            "--input",
            str(input_path),
            "--output-csv",
            str(out_csv),
            "--output-md",
            str(out_md),
        ],
    )

    # main 실행
    run_main()

    # 결과 파일 존재 확인
    assert out_csv.exists()
    assert out_md.exists()
    assert "content_id" in out_csv.read_text()
    assert "| content_id" in out_md.read_text()


def test_T_M19_1_run_eval_v05_cli(monkeypatch, tmp_path):
    samples = [
        {
            "content_id": "1",
            "title": "t1",
            "content_summary": "apple banana carrot",
        }
    ]
    input_path = tmp_path / "data.json"
    input_path.write_text(json.dumps(samples), encoding="utf-8")
    out_csv = tmp_path / "out.csv"
    out_md = tmp_path / "out.md"

    monkeypatch.setattr(
        sys,
        "argv",
        [
            "run_eval_v05",
            "--input",
            str(input_path),
            "--output-csv",
            str(out_csv),
            "--output-md",
            str(out_md),
        ],
    )
    run_main_v05()
    assert out_csv.exists()
    assert out_md.exists()
    assert "content_id" in out_csv.read_text()
    assert "| content_id" in out_md.read_text()


def test_T_M18_1_eval_preview_llm_mode(monkeypatch):
    # monkeypatch LLM wrappers to avoid real calls
    monkeypatch.setattr("app.api.v1.routes.summarize_lexical", lambda text, limit, model, retries=2: "lex_llm")
    monkeypatch.setattr("app.api.v1.routes.summarize_vector", lambda text, limit, model, retries=2: "vec_llm")

    from app.main import app
    client = TestClient(app)
    resp = client.post(
        "/api/v1/eval/preview",
        json={
            "mode": "llm",
            "samples": [{"content_id": "1", "title": "t1", "content_summary": "hello world"}],
            "lexical_limit": 10,
            "vector_limit": 12,
        },
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["debug"]["mode"] == "llm"
    row = data["rows"][0]
    assert row["lexical_tokens"] > 0
    assert row["vector_tokens"] > 0
    assert row["lexical_summary"] == "lex_llm"
    assert row["vector_summary"] == "vec_llm"

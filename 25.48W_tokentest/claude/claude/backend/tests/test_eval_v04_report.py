import pytest

from app.eval import metrics_v04
from app.eval.report_v04 import EvalRow, build_rows, write_csv, write_md


def test_T_M14_1_build_rows_shape():
    samples = [
        {
            "content_id": "1",
            "title": "t1",
            "content_summary": "apple banana carrot",
            "lexical_summary": "apple banana",
            "vector_summary": "banana carrot",
        }
    ]

    rows = build_rows(samples, metrics_v04)
    assert len(rows) == 1

    r = rows[0]
    assert r.content_id == "1"
    assert isinstance(r.orig_tokens, int)
    assert isinstance(r.keyword_cov, float)


def test_T_M14_2_write_outputs(tmp_path):
    rows = [EvalRow("1", "t1", 10, 8, 9, 0.5)]

    csv_p = tmp_path / "out.csv"
    md_p = tmp_path / "out.md"

    write_csv(rows, csv_p)
    write_md(rows, md_p)

    assert csv_p.exists()
    assert md_p.exists()
    assert "content_id" in csv_p.read_text()
    assert "| content_id" in md_p.read_text()

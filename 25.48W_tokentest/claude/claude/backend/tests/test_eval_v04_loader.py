import json
import pytest

from app.eval.loader_v04 import load_content_summaries


def test_T_M10_1_loads_json_and_validates_schema(tmp_path):
    doc = [{"content_id": "c1", "title": "t1", "content_summary": "s1"}]
    path = tmp_path / "data.json"
    path.write_text(json.dumps(doc), encoding="utf-8")

    loaded = load_content_summaries(str(path))
    assert isinstance(loaded, list)
    assert loaded[0]["content_id"] == "c1"
    assert loaded[0]["title"] == "t1"
    assert loaded[0]["content_summary"] == "s1"


def test_T_M10_2_missing_required_field_raises(tmp_path):
    bad = [{"content_id": "c1", "title": "t1"}]  # missing content_summary
    path = tmp_path / "bad.json"
    path.write_text(json.dumps(bad), encoding="utf-8")

    with pytest.raises(ValueError):
        load_content_summaries(str(path))

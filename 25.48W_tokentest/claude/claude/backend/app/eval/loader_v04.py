from typing import List, Dict
import json
from pathlib import Path


def load_content_summaries(path: str) -> List[Dict]:
    """
    Load content_summary_100_samples.json and validate minimal schema.

    Expected fields:
      - content_id
      - title
      - content_summary
    """
    p = Path(path)
    if not p.exists():
        raise ValueError(f"file not found: {path}")

    with p.open("r", encoding="utf-8") as f:
        data = json.load(f)

    if not isinstance(data, list):
        raise ValueError("JSON root must be a list")

    required = {"content_id", "title", "content_summary"}
    for idx, item in enumerate(data):
        if not isinstance(item, dict):
            raise ValueError(f"item at index {idx} is not an object")
        missing = required - item.keys()
        if missing:
            raise ValueError(f"missing fields {missing} at index {idx}")

    return data

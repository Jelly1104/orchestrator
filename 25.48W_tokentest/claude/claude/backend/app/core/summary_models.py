from typing import Dict, Any

SUMMARY_MODELS: Dict[str, Dict[str, Any]] = {
    "lexical_v1": {
        "id": "lexical_v1",
        "label": "Lexical v1 (키워드 유지)",
        "kind": "lexical",
        "min_limit": 16,
        "max_limit": 512,
        "default_limit": 128,
    },
    "vector_v1": {
        "id": "vector_v1",
        "label": "Vector v1 (의미 압축)",
        "kind": "vector",
        "min_limit": 16,
        "max_limit": 512,
        "default_limit": 128,
    },
}


def get_model_config(model_id: str) -> Dict[str, Any]:
    if model_id not in SUMMARY_MODELS:
        raise KeyError(f"unknown model_id: {model_id}")
    return SUMMARY_MODELS[model_id]


def clamp_limit(user_value, cfg: Dict[str, Any]) -> int:
    if user_value is None:
        return cfg["default_limit"]
    try:
        value = int(user_value)
    except Exception as e:
        raise ValueError("limit must be an integer") from e
    value = max(cfg["min_limit"], value)
    value = min(cfg["max_limit"], value)
    return value

import pytest
from app.core.summary_models import SUMMARY_MODELS, get_model_config, clamp_limit


def test_get_model_config_valid():
    cfg = get_model_config("lexical_v1")
    assert cfg["id"] == "lexical_v1"


def test_get_model_config_invalid():
    with pytest.raises(KeyError):
        get_model_config("unknown_model")


def test_clamp_limit_none_returns_default():
    cfg = SUMMARY_MODELS["lexical_v1"]
    assert clamp_limit(None, cfg) == cfg["default_limit"]


def test_clamp_limit_below_min():
    cfg = SUMMARY_MODELS["lexical_v1"]
    assert clamp_limit(-10, cfg) == cfg["min_limit"]


def test_clamp_limit_above_max():
    cfg = SUMMARY_MODELS["lexical_v1"]
    assert clamp_limit(9999, cfg) == cfg["max_limit"]


def test_clamp_limit_invalid_type():
    cfg = SUMMARY_MODELS["lexical_v1"]
    with pytest.raises(ValueError):
        clamp_limit("not-an-int", cfg)

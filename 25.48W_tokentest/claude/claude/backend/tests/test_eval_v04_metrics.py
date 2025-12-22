import pytest

from app.eval.metrics_v04 import (
    token_count_tiktoken,
    extract_keywords,
    keyword_coverage,
)


def test_T_M11_1_token_count_basic():
    """tiktoken 기반 토큰 카운트 기본 동작 테스트."""
    assert token_count_tiktoken("") == 0

    n1 = token_count_tiktoken("hello")
    n2 = token_count_tiktoken("hello world")
    # 토큰 수는 양수이고, 더 긴 문장이 토큰이 더 많아야 한다.
    assert n1 > 0
    assert n2 > n1


def test_T_M13_1_keyword_coverage_basic():
    """키워드 추출 + 커버리지 계산 기본 테스트."""
    orig = "apple banana carrot"
    lex = "apple banana"

    orig_kws = extract_keywords(orig)
    lex_kws = extract_keywords(lex)
    assert orig_kws == {"apple", "banana", "carrot"}
    assert lex_kws == {"apple", "banana"}

    cov = keyword_coverage(orig, lex)
    assert pytest.approx(cov, rel=1e-6) == 2 / 3

    assert keyword_coverage("", "anything") == 0.0

from typing import Set
from functools import lru_cache
import re

try:
    import tiktoken
except ImportError:  # fallback for environments without tiktoken installed
    class _DummyEncoding:
        def encode(self, text: str):
            return (text or "").split()

    class tiktoken:  # type: ignore
        @staticmethod
        def get_encoding(name: str):
            return _DummyEncoding()


@lru_cache(maxsize=1)
def _get_encoding():
    return tiktoken.get_encoding("o200k_base")


def token_count_tiktoken(text: str) -> int:
    """
    tiktoken(o200k_base) 기반 토큰 카운트.

    - None/빈 문자열 → 0
    - 일반 문자열 → enc.encode() 길이 반환
    """
    enc = _get_encoding()
    if not text:
        return 0
    return len(enc.encode(text))


def _normalize_token(tok: str) -> str:
    """소문자 + 양끝 특수문자 제거 + 길이 1짜리 토큰 제거용 헬퍼."""
    if not tok:
        return ""
    tok = re.sub(r"^[^\w가-힣]+|[^\w가-힣]+$", "", tok.lower())
    if len(tok) <= 1:
        return ""
    return tok


def extract_keywords(text: str) -> Set[str]:
    """
    키워드 셋 추출:
    - 공백 기준 split
    - _normalize_token() 적용
    - 빈 문자열은 제거
    """
    if not text:
        return set()
    kws = set()
    for raw in text.split():
        norm = _normalize_token(raw)
        if norm:
            kws.add(norm)
    return kws


def keyword_coverage(orig: str, lexical: str) -> float:
    """
    coverage = |KW_orig ∩ KW_lex| / |KW_orig|
    - 원문 키워드가 0개면 0.0 반환
    """
    orig_kws = extract_keywords(orig)
    if not orig_kws:
        return 0.0
    lex_kws = extract_keywords(lexical)
    inter = orig_kws & lex_kws
    return len(inter) / len(orig_kws)

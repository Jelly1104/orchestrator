from typing import Callable, Tuple
from app.eval.metrics_v04 import token_count_tiktoken


class LLMClientNotConfigured(Exception):
    pass


def _default_client(prompt: str, model: str) -> str:
    # Deterministic stub: just echo prompt (used in offline mode)
    return prompt


def _summarize_with_retry(
    text: str,
    limit: int,
    model: str,
    style: str,
    retries: int,
    client: Callable[[str, str], str],
    fallback: str,
    return_meta: bool,
) -> Tuple[str, dict]:
    prompt = (
        "너는 한국어 요약기다. 아래 규칙을 반드시 지켜서 1문단 요약을 생성한다.\n"
        "규칙:\n"
        "- 최종 토큰 수는 반드시 limit 이하가 되도록 문장 단위로 재작성한다.\n"
        "- 단어를 자르는 truncate/split 금지, bullet/list/템플릿 금지.\n"
        "- 자연스러운 문장 형태 유지. Lexical: 핵심 키워드/명사구 최대한 보존. Vector: 의미 중심 재구성.\n"
        "- 먼저 자연 요약 → limit 초과 시 더 축약 → 다시 초과 시 핵심 문장만 남기고 재작성 → 그래도 초과면 최소 문장으로 압축.\n"
        f"- limit: {limit}\n"
        f"- mode: {style}\n"
        f"[SUMMARY]\n"
        f"{text}"
    )
    meta = {"attempts": 0, "last_error": None}
    for _ in range(max(1, retries)):
        meta["attempts"] += 1
        try:
            result = client(prompt, model)
            return (result, meta) if return_meta else result
        except Exception as e:
            meta["last_error"] = str(e)
            continue
    return (fallback, meta) if return_meta else fallback


def summarize_lexical(
    text: str,
    limit: int,
    model: str,
    retries: int = 3,
    client: Callable[[str, str], str] = None,
    fallback: str = "SUMMARY_FAIL",
    return_meta: bool = False,
):
    client = client or _default_client
    summary = _summarize_with_retry(
        text=text,
        limit=limit,
        model=model,
        style="lexical",
        retries=retries,
        client=client,
        fallback=fallback,
        return_meta=return_meta,
    )
    return summary


def summarize_vector(
    text: str,
    limit: int,
    model: str,
    retries: int = 3,
    client: Callable[[str, str], str] = None,
    fallback: str = "SUMMARY_FAIL",
    return_meta: bool = False,
):
    client = client or _default_client
    summary = _summarize_with_retry(
        text=text,
        limit=limit,
        model=model,
        style="vector",
        retries=retries,
        client=client,
        fallback=fallback,
        return_meta=return_meta,
    )
    return summary

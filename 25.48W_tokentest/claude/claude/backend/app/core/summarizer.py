from typing import Callable, Dict, List, Tuple
from app.core.token_utils import token_count
from app.eval.metrics_v04 import token_count_tiktoken
import re


def make_shorten_fn(model_id: str, style: str):
    """
    Factory for shorten functions by model/style.
    This is a deterministic placeholder that trims tokens and can be mocked in tests.
    """

    def shorten(text: str, aggressive: bool) -> str:
        if not text:
            return ""
        # 문장 단위로 나누어 자연스러운 형태 유지
        sentences = [s.strip() for s in re.split(r"(?<=[.!?。！？])\s+|\n+", text) if s.strip()]
        if not sentences:
            sentences = [text.strip()]

        # limit 정보를 직접 받을 수 없으므로 비율로 축약하되 과도하게 줄이지 않음
        ratio = 0.85 if not aggressive else 0.65
        target_tokens = int(max(1, token_count_tiktoken(text) * ratio))

        if style == "vector":
            # 뒤쪽 의미 중심으로 선택
            out: List[str] = []
            total = 0
            for sent in reversed(sentences):
                sent_tokens = token_count_tiktoken(sent)
                if total + sent_tokens <= target_tokens or not out:
                    out.insert(0, sent)
                    total += sent_tokens
                else:
                    break
        else:
            out = []
            total = 0
            for sent in sentences:
                sent_tokens = token_count_tiktoken(sent)
                if total + sent_tokens <= target_tokens or not out:
                    out.append(sent)
                    total += sent_tokens
                else:
                    break

        return " ".join(out).strip()

    shorten.model_id = model_id  # type: ignore[attr-defined]
    shorten.style = style  # type: ignore[attr-defined]
    return shorten


def summarize_with_steps(
    text: str,
    limit: int,
    shorten_fn: Callable[[str, bool], str],
    counter_fn: Callable[[str], int] = token_count,
) -> Tuple[str, List[Dict]]:
    steps: List[Dict] = []

    def add_step(current: str):
        steps.append({"summary": current, "tokens": counter_fn(current)})

    current = text
    add_step(current)
    if steps[-1]["tokens"] <= limit:
        return current, steps

    current = shorten_fn(current, False)
    add_step(current)
    if steps[-1]["tokens"] <= limit:
        return current, steps

    current = shorten_fn(current, True)
    add_step(current)
    return current, steps


def build_pipeline(text: str, model_cfg: Dict, limit: int) -> Dict:
    shorten = make_shorten_fn(model_cfg["id"], model_cfg.get("kind", "lexical"))
    summary, steps = summarize_with_steps(text, limit=limit, shorten_fn=shorten)
    return {
        "final_summary": summary,
        "final_tokens": token_count(summary),
        "steps": steps,
        "model_id": model_cfg["id"],
        "limit": limit,
    }


def build_lexical_pipeline(text: str, model_cfg: Dict, limit: int) -> Dict:
    return build_pipeline(text, model_cfg, limit)


def build_vector_pipeline(text: str, model_cfg: Dict, limit: int) -> Dict:
    return build_pipeline(text, model_cfg, limit)

from typing import Callable


def token_count(text: str) -> int:
    """Naive token counter based on whitespace splitting."""
    return len((text or "").split())


def enforce_token_limit(
    text: str,
    limit: int,
    shorten_fn: Callable[[str, bool], str],
    counter_fn: Callable[[str], int] = token_count,
) -> str:
    """
    Ensure text does not exceed token limit using up to two summarization passes.

    Flow:
    - If counter_fn(text) <= limit: return text.
    - Else: shorten_fn(text, aggressive=False) once.
    - Re-count; if still > limit: shorten_fn(result, aggressive=True).
    - Return the final text (even if still over, to avoid infinite loops).
    """
    if text is None:
        raise ValueError("text is required")

    current = text
    if counter_fn(current) <= limit:
        return current

    current = shorten_fn(current, False)
    if counter_fn(current) <= limit:
        return current

    current = shorten_fn(current, True)
    return current

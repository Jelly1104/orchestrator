import pytest
from app.core.token_utils import enforce_token_limit


def test_returns_text_when_under_limit():
    text = "short text"

    def shorten_fn(_, aggressive):
        raise AssertionError("shorten_fn should not be called")

    def counter_fn(t):
        return 2  # below limit

    result = enforce_token_limit(text, limit=10, shorten_fn=shorten_fn, counter_fn=counter_fn)
    assert result == text


def test_calls_shorten_once_when_over_limit_and_second_pass_not_needed():
    text = "this text is too long"
    calls = []

    def counter_fn(t):
        # initial over limit, after shorten returns below limit
        return 6 if t == text else 2

    def shorten_fn(t, aggressive):
        calls.append((t, aggressive))
        return "shortened once"

    result = enforce_token_limit(text, limit=5, shorten_fn=shorten_fn, counter_fn=counter_fn)
    assert result == "shortened once"
    assert calls == [(text, False)]


def test_calls_shorten_twice_when_still_over_after_first_pass():
    text = "this text is way too long for the limit"
    calls = []

    def counter_fn(t):
        if t == text:
            return 10  # initial over
        if t == "shortened once":
            return 8  # still over
        return 3  # final within limit

    def shorten_fn(t, aggressive):
        calls.append((t, aggressive))
        return "shortened once" if not aggressive else "shortened twice"

    result = enforce_token_limit(text, limit=5, shorten_fn=shorten_fn, counter_fn=counter_fn)
    assert result == "shortened twice"
    assert calls == [(text, False), ("shortened once", True)]

import pytest
from app.core.summarizer import summarize_with_steps, make_shorten_fn


def test_steps_single_when_under_limit():
    shorten_calls = []

    def shorten_fn(text, aggressive):
        shorten_calls.append((text, aggressive))
        return text

    summary, steps = summarize_with_steps("short text", limit=10, shorten_fn=shorten_fn)
    assert summary == "short text"
    assert len(steps) == 1
    assert steps[0]["tokens"] == len("short text".split())
    assert shorten_calls == []


def test_steps_two_when_one_shorten_needed():
    shorten_calls = []

    def shorten_fn(text, aggressive):
        shorten_calls.append((text, aggressive))
        return "shortened"

    def counter_fn(text):
        if text == "orig too long":
            return 5
        return 2

    summary, steps = summarize_with_steps("orig too long", limit=3, shorten_fn=shorten_fn, counter_fn=counter_fn)
    assert summary == "shortened"
    assert len(steps) == 2
    assert shorten_calls == [("orig too long", False)]
    assert steps[0]["tokens"] == 5
    assert steps[1]["tokens"] == 2


def test_steps_three_when_two_shorten_needed():
    shorten_calls = []

    def shorten_fn(text, aggressive):
        shorten_calls.append((text, aggressive))
        if not aggressive:
            return "mid shorten"
        return "final shorten"

    def counter_fn(text):
        return {"orig": 6, "mid shorten": 5, "final shorten": 2}.get(text, len(text.split()))

    summary, steps = summarize_with_steps("orig", limit=3, shorten_fn=shorten_fn, counter_fn=counter_fn)
    assert summary == "final shorten"
    assert len(steps) == 3
    assert shorten_calls == [("orig", False), ("mid shorten", True)]
    assert steps[0]["tokens"] == 6
    assert steps[1]["tokens"] == 5
    assert steps[2]["tokens"] == 2
    assert steps[0]["summary"] == "orig"
    assert steps[1]["summary"] == "mid shorten"
    assert steps[2]["summary"] == "final shorten"

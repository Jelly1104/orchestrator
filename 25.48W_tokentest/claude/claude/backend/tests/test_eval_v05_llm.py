from app.eval.llm_v05 import summarize_lexical, summarize_vector


def test_lexical_prompt_contains_limit_and_style():
    calls = []

    def client(prompt, model):
        calls.append((prompt, model))
        return "ok"

    out = summarize_lexical("hello", limit=50, model="m1", client=client)
    assert out == "ok"
    assert "mode: lexical" in calls[0][0]
    assert "limit: 50" in calls[0][0]
    assert calls[0][1] == "m1"


def test_retry_and_fallback_on_failure():
    calls = []

    def client(prompt, model):
        calls.append((prompt, model))
        raise RuntimeError("fail")

    out = summarize_vector("text", limit=20, model="m2", retries=2, client=client, fallback="SUMMARY_FAIL")
    assert out == "SUMMARY_FAIL"
    assert len(calls) == 2


def test_retry_then_success():
    calls = []

    def client(prompt, model):
        calls.append((prompt, model))
        if len(calls) < 2:
            raise RuntimeError("temp")
        return "done"

    out = summarize_lexical("text", limit=10, model="m3", retries=3, client=client)
    assert out == "done"
    assert len(calls) == 2

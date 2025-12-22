from app.core.summarizer import make_shorten_fn


def test_make_shorten_fn_lexical_trims_front():
    fn = make_shorten_fn("lexical_v1", "lexical")
    out = fn("one two three four five six", aggressive=False)
    # should keep front portion
    assert out.startswith("one")
    # aggressive should trim more
    out_aggr = fn("one two three four five six", aggressive=True)
    assert len(out_aggr.split()) <= len(out.split())


def test_make_shorten_fn_vector_trims_back():
    fn = make_shorten_fn("vector_v1", "vector")
    out = fn("one two three four five six", aggressive=False)
    # should keep back portion
    assert out.endswith("six")
    out_aggr = fn("one two three four five six", aggressive=True)
    assert len(out_aggr.split()) <= len(out.split())

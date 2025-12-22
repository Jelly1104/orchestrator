"""
CLI entrypoint for ver05 batch evaluation with LLM/heuristic modes.
"""
import argparse
import sys

from app.eval.loader_v04 import load_content_summaries
from app.eval.metrics_v04 import token_count_tiktoken, keyword_coverage
from app.eval.llm_v05 import summarize_lexical, summarize_vector
from app.core.summarizer import build_lexical_pipeline, build_vector_pipeline
from app.core.summary_models import SUMMARY_MODELS
from app.eval.report_v04 import write_csv, write_md, EvalRow


def build_rows(samples, mode: str, lexical_limit: int, vector_limit: int):
    rows = []
    for item in samples:
        text = (item.get("content_summary") or "").strip()
        if not text:
            continue
        if mode == "llm":
            lex_s = summarize_lexical(text, lexical_limit, model="gpt-5-mini")
            vec_s = summarize_vector(text, vector_limit, model="gpt-5-mini")
        else:
            lex_pipe = build_lexical_pipeline(text, SUMMARY_MODELS["lexical_v1"], lexical_limit)
            vec_pipe = build_vector_pipeline(text, SUMMARY_MODELS["vector_v1"], vector_limit)
            lex_s = lex_pipe["final_summary"]
            vec_s = vec_pipe["final_summary"]
        rows.append(
            EvalRow(
                content_id=item.get("content_id", ""),
                title=item.get("title", ""),
                orig_tokens=token_count_tiktoken(text),
                lexical_tokens=token_count_tiktoken(lex_s),
                vector_tokens=token_count_tiktoken(vec_s),
                keyword_cov=keyword_coverage(text, lex_s),
            )
        )
    return rows


def main() -> None:
    parser = argparse.ArgumentParser(description="Run ver05 batch evaluation")
    parser.add_argument("--input", required=True, help="Path to content_summary JSON")
    parser.add_argument("--output-csv", required=True, help="Per-document CSV output")
    parser.add_argument("--output-md", required=True, help="Markdown summary output")
    parser.add_argument("--mode", default="heuristic", choices=["heuristic", "llm"], help="Evaluation mode")
    parser.add_argument("--lexical-limit", type=int, default=128)
    parser.add_argument("--vector-limit", type=int, default=128)
    args = parser.parse_args()

    samples = load_content_summaries(args.input)
    rows = build_rows(samples, args.mode, args.lexical_limit, args.vector_limit)
    write_csv(rows, args.output_csv)
    write_md(rows, args.output_md)


if __name__ == "__main__":
    main()

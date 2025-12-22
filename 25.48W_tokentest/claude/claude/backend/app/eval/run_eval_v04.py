"""
CLI entrypoint for ver04 batch evaluation.

Example:
    python -m app.eval.run_eval_v04 \
        --input data/content_summary_100_samples.json \
        --output-csv reports/v04_eval.csv \
        --output-md  reports/v04_eval_summary.md
"""

import argparse

from app.eval.loader_v04 import load_content_summaries
from app.eval.report_v04 import build_rows, write_csv, write_md
from app.eval import metrics_v04


def main() -> None:
    parser = argparse.ArgumentParser(description="Run ver04 batch evaluation")
    parser.add_argument("--input", required=True, help="Path to content_summary JSON")
    parser.add_argument("--output-csv", required=True, help="Per-document CSV output")
    parser.add_argument("--output-md", required=True, help="Markdown summary output")
    args = parser.parse_args()

    samples = load_content_summaries(args.input)
    rows = build_rows(samples, metrics_v04)
    write_csv(rows, args.output_csv)
    write_md(rows, args.output_md)


if __name__ == "__main__":
    main()

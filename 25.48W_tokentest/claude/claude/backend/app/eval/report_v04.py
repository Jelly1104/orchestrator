from dataclasses import dataclass
from typing import List, Dict
import csv


@dataclass
class EvalRow:
    content_id: str
    title: str
    orig_tokens: int
    lexical_tokens: int
    vector_tokens: int
    keyword_cov: float


def build_rows(samples: List[Dict], metrics) -> List[EvalRow]:
    """
    Core evaluation loop: per-document 요약/토큰/커버리지 계산.
    samples: load_content_summaries() 결과.
    metrics: token_count_tiktoken, keyword_coverage 등을 갖는 모듈/객체.
    """
    rows: List[EvalRow] = []
    for item in samples:
        cid = item["content_id"]
        title = item.get("title", "")
        orig = item.get("content_summary", "")
        lex = item.get("lexical_summary", "")
        vec = item.get("vector_summary", "")
        rows.append(
            EvalRow(
                content_id=cid,
                title=title,
                orig_tokens=metrics.token_count_tiktoken(orig),
                lexical_tokens=metrics.token_count_tiktoken(lex),
                vector_tokens=metrics.token_count_tiktoken(vec),
                keyword_cov=metrics.keyword_coverage(orig, lex),
            )
        )
    return rows


def write_csv(rows: List[EvalRow], path: str) -> None:
    """Write per-document results to CSV."""
    fieldnames = [
        "content_id",
        "title",
        "orig_tokens",
        "lexical_tokens",
        "vector_tokens",
        "keyword_cov",
    ]
    with open(path, "w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        for r in rows:
            writer.writerow(
                {
                    "content_id": r.content_id,
                    "title": r.title,
                    "orig_tokens": r.orig_tokens,
                    "lexical_tokens": r.lexical_tokens,
                    "vector_tokens": r.vector_tokens,
                    "keyword_cov": r.keyword_cov,
                }
            )


def write_md(rows: List[EvalRow], path: str) -> None:
    """Aggregate stats and write Markdown summary."""
    header = "| content_id | title | orig_tokens | lexical_tokens | vector_tokens | keyword_cov |\n"
    sep = "|------------|-------|-------------|----------------|----------------|-------------|\n"
    lines = [header, sep]
    for r in rows:
        lines.append(
            f"| {r.content_id} | {r.title} | {r.orig_tokens} | {r.lexical_tokens} | {r.vector_tokens} | {r.keyword_cov} |\n"
        )
    with open(path, "w", encoding="utf-8") as f:
        f.writelines(lines)

import httpx
import json
import io
import csv
import os
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Body
from app.schemas import SummarizeRequest, SummarizeResponse
from app.services.image_utils import preprocess_image_bytes
from app.services.providers.gpt5_provider import (
    build_pipeline_instruction,
    call_gpt5_summary,
)
from app.core.token_utils import enforce_token_limit, token_count
from app.services.embedding import get_query_embedding
from app.services.hybrid import hybrid_merge
from app.core.summary_models import SUMMARY_MODELS, get_model_config, clamp_limit
from app.core.summarizer import build_lexical_pipeline, build_vector_pipeline, make_shorten_fn
from app.eval import metrics_v04
from app.eval.llm_v05 import summarize_lexical, summarize_vector
from app.eval.report_v04 import write_csv, write_md
from app.eval.metrics_v04 import token_count_tiktoken, keyword_coverage
import re

router = APIRouter()
_EMBED_CACHE = {}
_DOCS = [
    {"id": "d1", "title": "Search demo document", "snippet": "Sample text about search and ranking."},
    {"id": "d2", "title": "Hybrid retrieval", "snippet": "Combining BM25 and vector results."},
    {"id": "d3", "title": "Embedding cache", "snippet": "Cache hits speed up query processing."},
]


def _trim_to_limit(text: str, limit: int, style: str) -> str:
    shorten = make_shorten_fn(style, style)
    candidate = shorten(text, aggressive=False)
    if token_count_tiktoken(candidate) > limit:
        candidate = shorten(text, aggressive=True)
    if token_count_tiktoken(candidate) > limit:
        # sentence-wise fallback
        sentences = [s.strip() for s in re.split(r"(?<=[.!?。！？])\s+|\n+", text) if s.strip()]
        out = []
        total = 0
        for sent in sentences:
            t = token_count_tiktoken(sent)
            if total + t <= limit or not out:
                out.append(sent)
                total += t
            else:
                break
        candidate = " ".join(out).strip() if out else candidate
    return candidate


def _clean_summary(text: str) -> str:
    if not text:
        return ""
    # 프롬프트/규칙이 섞여 들어온 경우 [SUMMARY] 이후만 사용
    if "[SUMMARY]" in text:
        text = text.split("[SUMMARY]", 1)[1]
    # 불필요한 규칙 문구 제거
    text = re.sub(r"너는 한국어 요약기다[^\\n]*\n?", "", text, flags=re.IGNORECASE)
    text = text.strip()
    return text


@router.get("/summary-models")
async def list_summary_models():
    return {"models": list(SUMMARY_MODELS.values())}


@router.post("/eval/preview")
async def eval_preview(payload: dict = Body(...)):
    samples = payload.get("samples")
    if samples is None:
        raise HTTPException(status_code=422, detail="samples is required")
    try:
        data = samples if isinstance(samples, list) else json.loads(samples)
    except Exception as e:
        raise HTTPException(status_code=422, detail="invalid samples JSON") from e
    if not isinstance(data, list):
        raise HTTPException(status_code=422, detail="samples must be a list")

    lexical_model_id = payload.get("lexical_model_id", "lexical_v1")
    vector_model_id = payload.get("vector_model_id", "vector_v1")
    try:
        lexical_cfg = get_model_config(lexical_model_id)
        vector_cfg = get_model_config(vector_model_id)
    except KeyError as e:
        raise HTTPException(status_code=422, detail=str(e)) from e

    try:
        lexical_limit = clamp_limit(payload.get("lexical_limit"), lexical_cfg)
        vector_limit = clamp_limit(payload.get("vector_limit"), vector_cfg)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e)) from e

    mode = payload.get("mode", "heuristic")
    if mode == "llm" and not os.getenv("OPENAI_API_KEY"):
        # LLM 키 없으면 heuristic으로 폴백해 프롬프트 노출 방지
        mode = "heuristic"

    rows = []
    for item in data:
        if not isinstance(item, dict):
            raise HTTPException(status_code=422, detail="each sample must be an object")
        if "content_summary" not in item:
            raise HTTPException(status_code=422, detail="content_summary is required in each sample")
        text = item.get("content_summary", "")
        if mode == "llm":
            lex_shorten = make_shorten_fn(lexical_cfg["id"], lexical_cfg.get("kind", "lexical"))
            vec_shorten = make_shorten_fn(vector_cfg["id"], vector_cfg.get("kind", "vector"))
            lexical_raw = summarize_lexical(
                text=text,
                limit=lexical_limit,
                model=lexical_cfg["id"],
                retries=payload.get("retries", 2),
            )
            lexical_summary = _clean_summary(lexical_raw)
            lexical_summary = enforce_token_limit(lexical_summary, lexical_limit, lex_shorten)
            lexical_summary = _trim_to_limit(lexical_summary, lexical_limit, "lexical")
            vector_raw = summarize_vector(
                text=text,
                limit=vector_limit,
                model=vector_cfg["id"],
                retries=payload.get("retries", 2),
            )
            vector_summary = _clean_summary(vector_raw)
            vector_summary = enforce_token_limit(vector_summary, vector_limit, vec_shorten)
            vector_summary = _trim_to_limit(vector_summary, vector_limit, "vector")
        else:
            lexical_pipeline = build_lexical_pipeline(text, lexical_cfg, lexical_limit)
            vector_pipeline = build_vector_pipeline(text, vector_cfg, vector_limit)
            lexical_summary = lexical_pipeline["final_summary"]
            vector_summary = vector_pipeline["final_summary"]
        rows.append(
            {
                "content_id": item.get("content_id", ""),
                "title": item.get("title", ""),
                "orig_text": text,
                "orig_tokens": metrics_v04.token_count_tiktoken(text),
                "lexical_tokens": metrics_v04.token_count_tiktoken(lexical_summary),
                "vector_tokens": metrics_v04.token_count_tiktoken(vector_summary),
                "keyword_cov": metrics_v04.keyword_coverage(text, lexical_summary),
                "lexical_summary": lexical_summary,
                "vector_summary": vector_summary,
            }
        )

    return {
        "debug": {
            "lexical_model_id": lexical_cfg["id"],
            "vector_model_id": vector_cfg["id"],
            "lexical_limit": lexical_limit,
            "vector_limit": vector_limit,
            "mode": mode,
        },
        "rows": rows,
    }

@router.post("/summarize", response_model=SummarizeResponse)
async def summarize(
    provider: str = Form("gpt5"),
    model: str = Form("gpt-5-mini"),
    system_prompt: str = Form(None),
    output_mode: str = Form("내용 요약"),
    text: str = Form(None),
    image: UploadFile = File(None),
):
    print("=== summarize 호출 ===")
    print("provider:", provider, "/ model:", model)
    print("output_mode:", output_mode, "/ system_prompt:", system_prompt)
    cleaned_text = text.strip() if text and text.strip() else None
    print("text length:", len(cleaned_text) if cleaned_text else 0)

    if cleaned_text is None and image is None:
        raise HTTPException(status_code=422, detail="text or image is required")

    processed_image = None
    if image is not None:
        try:
            contents = await image.read()
            size = len(contents)
            print("image filename:", image.filename, "size:", size)
            # 선택: 간단 전처리(예외 처리)
            try:
                processed_image = preprocess_image_bytes(contents)
                print("processed image size:", len(processed_image))
            except Exception as e:
                print("image preprocessing 실패:", e)
                raise HTTPException(status_code=422, detail="image preprocessing failed") from e
        except HTTPException:
            raise
        except Exception as e:
            print("image read 실패:", e)
            raise HTTPException(status_code=422, detail="image read failed") from e
    else:
        print("image: None")

    instruction_text = build_pipeline_instruction(output_mode)
    if system_prompt:
        instruction_text = system_prompt + "\n" + instruction_text

    try:
        summary_text = await call_gpt5_summary(
            text=cleaned_text,
            image_bytes=processed_image,
            instructions=instruction_text,
            model=model,
        )
    except RuntimeError as e:
        raise HTTPException(status_code=422, detail=str(e)) from e
    except httpx.HTTPStatusError as e:
        print("gpt-5-mini 호출 HTTP 오류:", e.response.text)
        raise HTTPException(status_code=422, detail="model call failed (http error)") from e
    except Exception as e:
        print("gpt-5-mini 호출 실패:", e)
        raise HTTPException(status_code=422, detail=str(e)) from e
    return {"summary": summary_text, "provider": provider, "model": model}


@router.post("/search")
async def search(payload: dict = Body(...)):
    query = (payload.get("query") or "").strip()
    if not query:
        raise HTTPException(status_code=422, detail="query is required")

    lexical_model_id = payload.get("lexical_model_id", "lexical_v1")
    vector_model_id = payload.get("vector_model_id", "vector_v1")
    try:
        lexical_cfg = get_model_config(lexical_model_id)
        vector_cfg = get_model_config(vector_model_id)
    except KeyError as e:
        raise HTTPException(status_code=422, detail=str(e)) from e

    try:
        lexical_limit = clamp_limit(payload.get("lexical_limit"), lexical_cfg)
        vector_limit = clamp_limit(payload.get("vector_limit"), vector_cfg)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e)) from e

    lexical_pipeline = build_lexical_pipeline(query, lexical_cfg, lexical_limit)
    vector_pipeline = build_vector_pipeline(query, vector_cfg, vector_limit)

    safe_query = enforce_token_limit(query, limit=50, shorten_fn=lambda t, a: t)

    def cache_get(key: str):
        return _EMBED_CACHE.get(key)

    def cache_set(key: str, value):
        _EMBED_CACHE[key] = value

    def embed_fn(q: str):
        # very naive embedding vector mock
        return [float(len(q)), float(len(q) % 7)]

    _ = get_query_embedding(safe_query, cache_get, cache_set, embed_fn)

    # Mock BM25/vector scores from static docs
    bm25_results = []
    tokens = safe_query.lower().split()
    for doc in _DOCS:
        hay = (doc["title"] + " " + doc["snippet"]).lower()
        score = float(sum(hay.count(tok) for tok in tokens))
        bm25_results.append({"id": doc["id"], "score": score})

    vector_results = [{"id": doc["id"], "score": float(1.0 / (idx + 1))} for idx, doc in enumerate(_DOCS)]

    merged = hybrid_merge(bm25_results, vector_results, bm25_weight=0.5, vector_weight=0.5, top_k=10)

    doc_lookup = {d["id"]: d for d in _DOCS}
    results = []
    for item in merged:
        doc = doc_lookup.get(item["id"], {})
        results.append(
            {
                "id": item["id"],
                "score": item["score"],
                "title": doc.get("title", ""),
                "snippet": doc.get("snippet", ""),
            }
        )

    debug = {
        "input": {"text": query, "tokens": token_count(query)},
        "lexical": lexical_pipeline,
        "vector": vector_pipeline,
    }

    return {"results": results, "debug": debug}


@router.post("/eval/preview")
async def eval_preview(payload: dict = Body(...)):
    samples = payload.get("samples")
    if samples is None:
        raise HTTPException(status_code=422, detail="samples is required")
    try:
        data = samples if isinstance(samples, list) else json.loads(samples)
    except Exception as e:
        raise HTTPException(status_code=422, detail="invalid samples JSON") from e
    if not isinstance(data, list):
        raise HTTPException(status_code=422, detail="samples must be a list")

    lexical_model_id = payload.get("lexical_model_id", "lexical_v1")
    vector_model_id = payload.get("vector_model_id", "vector_v1")
    try:
        lexical_cfg = get_model_config(lexical_model_id)
        vector_cfg = get_model_config(vector_model_id)
    except KeyError as e:
        raise HTTPException(status_code=422, detail=str(e)) from e

    try:
        lexical_limit = clamp_limit(payload.get("lexical_limit"), lexical_cfg)
        vector_limit = clamp_limit(payload.get("vector_limit"), vector_cfg)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e)) from e

    mode = payload.get("mode", "heuristic")

    rows = []
    for item in data:
        if not isinstance(item, dict):
            raise HTTPException(status_code=422, detail="each sample must be an object")
        if "content_summary" not in item:
            raise HTTPException(status_code=422, detail="content_summary is required in each sample")
        text = item.get("content_summary", "")
        if mode == "llm":
            lexical_summary = summarize_lexical(
                text=text,
                limit=lexical_limit,
                model=lexical_cfg["id"],
                retries=payload.get("retries", 2),
            )
            vector_summary = summarize_vector(
                text=text,
                limit=vector_limit,
                model=vector_cfg["id"],
                retries=payload.get("retries", 2),
            )
        else:
            lexical_pipeline = build_lexical_pipeline(text, lexical_cfg, lexical_limit)
            vector_pipeline = build_vector_pipeline(text, vector_cfg, vector_limit)
            lexical_summary = lexical_pipeline["final_summary"]
            vector_summary = vector_pipeline["final_summary"]
        rows.append(
            {
                "content_id": item.get("content_id", ""),
                "title": item.get("title", ""),
                "orig_tokens": metrics_v04.token_count_tiktoken(text),
                "lexical_tokens": metrics_v04.token_count_tiktoken(lexical_summary),
                "vector_tokens": metrics_v04.token_count_tiktoken(vector_summary),
                "keyword_cov": metrics_v04.keyword_coverage(text, lexical_summary),
                "lexical_summary": lexical_summary,
                "vector_summary": vector_summary,
            }
        )

    return {
        "debug": {
            "lexical_model_id": lexical_cfg["id"],
            "vector_model_id": vector_cfg["id"],
            "lexical_limit": lexical_limit,
            "vector_limit": vector_limit,
            "mode": mode,
        },
        "rows": rows,
    }


@router.post("/eval/download")
async def eval_download(payload: dict = Body(...)):
    mode = (payload.get("mode") or "heuristic").lower()
    if mode == "llm" and not os.getenv("OPENAI_API_KEY"):
        mode = "heuristic"
    lexical_limit = int(payload.get("lexical_limit") or 128)
    vector_limit = int(payload.get("vector_limit") or 128)
    samples = payload.get("samples")
    if not isinstance(samples, list) or not samples:
        raise HTTPException(status_code=422, detail="samples must be non-empty list")

    rows = []
    for item in samples:
        if not isinstance(item, dict):
            raise HTTPException(status_code=422, detail="each sample must be an object")
        text = (item.get("content_summary") or "").strip()
        if not text:
            continue

        if mode == "llm":
            lex_shorten = make_shorten_fn("lexical_v1", "lexical")
            vec_shorten = make_shorten_fn("vector_v1", "vector")
            lex_raw = summarize_lexical(text, lexical_limit, model="gpt-5-mini")
            vec_raw = summarize_vector(text, vector_limit, model="gpt-5-mini")
            lex_s = _clean_summary(lex_raw)
            vec_s = _clean_summary(vec_raw)
            lex_s = enforce_token_limit(lex_s, lexical_limit, lex_shorten)
            vec_s = enforce_token_limit(vec_s, vector_limit, vec_shorten)
            lex_s = _trim_to_limit(lex_s, lexical_limit, "lexical")
            vec_s = _trim_to_limit(vec_s, vector_limit, "vector")
        else:
            lex_pipe = build_lexical_pipeline(text, SUMMARY_MODELS["lexical_v1"], lexical_limit)
            vec_pipe = build_vector_pipeline(text, SUMMARY_MODELS["vector_v1"], vector_limit)
            lex_s = lex_pipe["final_summary"]
            vec_s = vec_pipe["final_summary"]

        lex_tok = token_count_tiktoken(lex_s)
        vec_tok = token_count_tiktoken(vec_s)
        cov = keyword_coverage(text, lex_s)
        flags = []
        if lex_s == "SUMMARY_FAIL" or vec_s == "SUMMARY_FAIL":
            flags.append("LLM_FAIL")
        if cov < 0.6:
            flags.append("LOW_COVERAGE")

        rows.append(
            {
                "content_id": item.get("content_id", ""),
                "title": item.get("title", ""),
                "orig_text": text,
                "orig_tok": token_count_tiktoken(text),
                "lex_tok": lex_tok,
                "vec_tok": vec_tok,
                "lex_cov": cov,
                "flags": ";".join(flags),
                "lexical_summary": lex_s,
                "vector_summary": vec_s,
            }
        )

    # reuse report_v04 writers
    # Map rows to EvalRow-like dicts for convenience
    csv_buf = io.StringIO()
    writer = csv.DictWriter(
        csv_buf,
        fieldnames=[
            "content_id",
            "title",
            "orig_text",
            "lexical_summary",
            "vector_summary",
            "orig_tok",
            "lex_tok",
            "vec_tok",
            "lex_cov",
            "flags",
        ],
    )
    writer.writeheader()
    for r in rows:
        writer.writerow(
            {
                "content_id": r["content_id"],
                "title": r["title"],
                "orig_text": r["orig_text"],
                "lexical_summary": r["lexical_summary"],
                "vector_summary": r["vector_summary"],
                "orig_tok": r["orig_tok"],
                "lex_tok": r["lex_tok"],
                "vec_tok": r["vec_tok"],
                "lex_cov": f"{r['lex_cov']:.3f}",
                "flags": r["flags"],
            }
        )

    md_lines = [
        "# Eval v05 Report",
        "",
        "| content_id | orig_tok | lex_tok | vec_tok | lex_cov | flags |",
        "| --- | --- | --- | --- | --- | --- |",
    ]
    for r in rows:
        md_lines.append(
            f"| {r['content_id']} | {r['orig_tok']} | {r['lex_tok']} | {r['vec_tok']} | {r['lex_cov']:.3f} | {r['flags']} |"
        )

    return {
        "csv": csv_buf.getvalue(),
        "md": "\n".join(md_lines),
        "debug": {
            "mode": mode,
            "lexical_limit": lexical_limit,
            "vector_limit": vector_limit,
            "count": len(rows),
        },
    }

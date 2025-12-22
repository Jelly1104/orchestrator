"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";

type ModelMeta = {
  id: string;
  label: string;
  kind: string;
  min_limit: number;
  max_limit: number;
  default_limit: number;
};

type PreviewRow = {
  content_id: string;
  title: string;
  orig_tokens: number;
  lexical_tokens: number;
  vector_tokens: number;
  keyword_cov: number;
  lexical_summary: string;
  vector_summary: string;
};

export default function TokenLabPage() {
  const [models, setModels] = useState<ModelMeta[]>([]);
  const [lexModel, setLexModel] = useState("lexical_v1");
  const [vecModel, setVecModel] = useState("vector_v1");
  const [lexLimit, setLexLimit] = useState<string>("");
  const [vecLimit, setVecLimit] = useState<string>("");
  const [mode, setMode] = useState<"heuristic" | "llm">("heuristic");
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [samplesText, setSamplesText] = useState<string>("");
  const [rows, setRows] = useState<PreviewRow[]>([]);
  const [debug, setDebug] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadModels = async () => {
      try {
        const base = (process.env.NEXT_PUBLIC_BACKEND_URL || "").replace(/\/$/, "");
        const url = base ? `${base}/api/v1/summary-models` : "/api/v1/summary-models";
        const resp = await axios.get(url);
        setModels(resp?.data?.models ?? []);
      } catch (err) {
        console.error("모델 목록 로드 실패:", err);
      }
    };
    loadModels();
  }, []);

  const handleFile = async (file: File | null) => {
    if (!file) return;
    const text = await file.text();
    setSamplesText(text);
  };

  const handleSubmit = async () => {
    setError(null);
    setRows([]);
    setDebug(null);
    setLoading(true);
    try {
      const samples = JSON.parse(samplesText);
      const base = (process.env.NEXT_PUBLIC_BACKEND_URL || "").replace(/\/$/, "");
      const url = base ? `${base}/api/v1/eval/preview` : "/api/v1/eval/preview";
      const payload: any = {
        samples,
        lexical_model_id: lexModel,
        vector_model_id: vecModel,
        mode,
      };
      if (lexLimit) payload.lexical_limit = Number(lexLimit);
      if (vecLimit) payload.vector_limit = Number(vecLimit);
      const resp = await axios.post(url, payload);
      setRows(resp?.data?.rows ?? []);
      setDebug(resp?.data?.debug ?? null);
    } catch (err: any) {
      console.error("preview 실패:", err);
      if (err.name === "SyntaxError") {
        setError("JSON 파싱 실패: 올바른 리스트 형태인지 확인하세요.");
      } else if (err.response) {
        setError(`서버 오류: ${err.response.status} ${JSON.stringify(err.response.data)}`);
      } else {
        setError(String(err.message || err));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    setDownloadError(null);
    setDownloading(true);
    try {
      const base = (process.env.NEXT_PUBLIC_BACKEND_URL || "").replace(/\/$/, "");
      const url = base ? `${base}/api/v1/eval/download` : "/api/v1/eval/download";
      const samples = JSON.parse(samplesText);
      const payload: any = {
        samples,
        mode,
        lexical_limit: Number(lexLimit || 128),
        vector_limit: Number(vecLimit || 128),
        lexical_model_id: lexModel,
        vector_model_id: vecModel,
      };
      const resp = await axios.post(url, payload);
      const { csv, md } = resp.data;

      const blobCsv = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const urlCsv = URL.createObjectURL(blobCsv);
      const a1 = document.createElement("a");
      a1.href = urlCsv;
      a1.download = "eval_v05.csv";
      a1.click();
      URL.revokeObjectURL(urlCsv);

      const blobMd = new Blob([md], { type: "text/markdown;charset=utf-8;" });
      const urlMd = URL.createObjectURL(blobMd);
      const a2 = document.createElement("a");
      a2.href = urlMd;
      a2.download = "eval_v05.md";
      a2.click();
      URL.revokeObjectURL(urlMd);
    } catch (err: any) {
      setDownloadError(
        err.response
          ? `서버 오류: ${err.response.status} ${JSON.stringify(err.response.data)}`
          : String(err.message || err),
      );
    } finally {
      setDownloading(false);
    }
  };

  return (
    <main style={{ padding: 24, display: "flex", flexDirection: "column", gap: 12 }}>
      <h1>토큰 실험실 (ver04 preview)</h1>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <div>
            <label>Mode</label>
            <select value={mode} onChange={(e) => setMode(e.target.value as any)} style={{ marginLeft: 8 }}>
              <option value="heuristic">heuristic</option>
              <option value="llm">llm</option>
            </select>
          </div>
          <div>
            <label>Lexical 모델</label>
          <select value={lexModel} onChange={(e) => setLexModel(e.target.value)} style={{ marginLeft: 8 }}>
            {models
              .filter((m) => m.kind === "lexical" || m.kind === undefined)
              .map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label || m.id}
                </option>
              ))}
          </select>
          <input
            type="number"
            placeholder={(() => {
              const cfg = models.find((m) => m.id === lexModel);
              return cfg ? `${cfg.min_limit}~${cfg.max_limit}` : "limit";
            })()}
            value={lexLimit}
            onChange={(e) => setLexLimit(e.target.value)}
            style={{ marginLeft: 8, width: 120 }}
          />
        </div>
        <div>
          <label>Vector 모델</label>
          <select value={vecModel} onChange={(e) => setVecModel(e.target.value)} style={{ marginLeft: 8 }}>
            {models
              .filter((m) => m.kind === "vector" || m.kind === undefined)
              .map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label || m.id}
                </option>
              ))}
          </select>
          <input
            type="number"
            placeholder={(() => {
              const cfg = models.find((m) => m.id === vecModel);
              return cfg ? `${cfg.min_limit}~${cfg.max_limit}` : "limit";
            })()}
            value={vecLimit}
            onChange={(e) => setVecLimit(e.target.value)}
            style={{ marginLeft: 8, width: 120 }}
          />
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <input type="file" accept=".json" onChange={(e) => handleFile(e.target.files?.[0] || null)} />
        <button onClick={handleSubmit} disabled={loading || !samplesText}>
          {loading ? "실행 중..." : "Preview 실행"}
        </button>
      </div>
      <textarea
        placeholder="또는 JSON을 직접 붙여넣으세요 (list 형태)"
        value={samplesText}
        onChange={(e) => setSamplesText(e.target.value)}
        style={{ width: "100%", height: 160, padding: 8 }}
      />

      {error && (
        <div style={{ color: "red" }}>
          <strong>에러:</strong> {error}
        </div>
      )}

      {debug && (
        <div style={{ border: "1px solid #ddd", padding: 12, borderRadius: 6 }}>
          <div>Lexical 모델: {debug.lexical_model_id} (limit: {debug.lexical_limit})</div>
          <div>Vector 모델: {debug.vector_model_id} (limit: {debug.vector_limit})</div>
        </div>
      )}

      {rows.length > 0 && (
        <div style={{ overflowX: "auto" }}>
          <table style={{ borderCollapse: "collapse", width: "100%" }}>
            <thead>
              <tr>
                <th>content_id</th>
                <th>title</th>
                <th>orig_tokens</th>
                <th>lexical_tokens</th>
                <th>vector_tokens</th>
                <th>keyword_cov</th>
                <th>lexical_summary</th>
                <th>vector_summary</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.content_id}>
                  <td>{r.content_id}</td>
                  <td>{r.title}</td>
                  <td>{r.orig_tokens}</td>
                  <td>{r.lexical_tokens}</td>
                  <td>{r.vector_tokens}</td>
                  <td>{r.keyword_cov.toFixed(3)}</td>
                  <td>{r.lexical_summary}</td>
                  <td>{r.vector_summary}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div style={{ marginTop: 12, display: "flex", gap: 12, alignItems: "center" }}>
        <button onClick={handleDownload} disabled={downloading || !samplesText}>
          {downloading ? "리포트 생성 중..." : "CSV/MD 다운로드"}
        </button>
        {downloadError && <div style={{ color: "red" }}>{downloadError}</div>}
      </div>
    </main>
  );
}

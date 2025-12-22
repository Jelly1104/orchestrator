"use client";
import React, { useState } from "react";
import ModelSelector from "../components/ModelSelector";
import SystemPromptEditor from "../components/SystemPromptEditor";
import UploadInput from "../components/UploadInput";
import ResultViewer from "../components/ResultViewer";
import axios from "axios";

export default function Page() {
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [systemPrompt, setSystemPrompt] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<
    { id: string; score: number; title: string; snippet: string }[]
  >([]);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchDebug, setSearchDebug] = useState<any>(null);
  const [models, setModels] = useState<any[]>([]);
  const [lexicalModel, setLexicalModel] = useState<string>("lexical_v1");
  const [vectorModel, setVectorModel] = useState<string>("vector_v1");
  const [lexicalLimit, setLexicalLimit] = useState<string>("");
  const [vectorLimit, setVectorLimit] = useState<string>("");

  React.useEffect(() => {
    const loadModels = async () => {
      try {
        const base = (process.env.NEXT_PUBLIC_BACKEND_URL || "").replace(
          /\/$/,
          ""
        );
        const url = base
          ? `${base}/api/v1/summary-models`
          : "/api/v1/summary-models";
        const resp = await axios.get(url);
        setModels(resp?.data?.models ?? []);
      } catch (err) {
        console.error("모델 목록 로드 실패:", err);
      }
    };
    loadModels();
  }, []);

  const handleSubmit = async (formData: FormData) => {
    setError(null);
    setResult(null);
    setLoading(true);
    try {
      const base = (process.env.NEXT_PUBLIC_BACKEND_URL || "").replace(
        /\/$/,
        ""
      );
      const url = base ? `${base}/api/v1/summarize` : "/api/v1/summarize";
      console.log("요청 URL:", url);
      console.log("전송 FormData keys:", Array.from(formData.keys()));
      // 주의: headers를 직접 설정하지 않음 (브라우저가 multipart boundary를 자동 설정)
      const resp = await axios.post(url, formData);
      console.log("응답 전체:", resp);
      const summary = resp?.data?.summary ?? JSON.stringify(resp?.data);
      setResult(summary);
    } catch (err: any) {
      console.error("요약 요청 실패:", err);
      if (err.response)
        setError(
          `서버 오류: ${err.response.status} ${JSON.stringify(
            err.response.data
          )}`
        );
      else setError(String(err.message || err));
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    setSearchError(null);
    setSearchResults([]);
    setSearchDebug(null);
    setSearchLoading(true);
    try {
      const base = (process.env.NEXT_PUBLIC_BACKEND_URL || "").replace(
        /\/$/,
        ""
      );
      const url = base ? `${base}/api/v1/search` : "/api/v1/search";
      const payload: any = {
        query: searchQuery,
        lexical_model_id: lexicalModel,
        vector_model_id: vectorModel,
      };
      if (lexicalLimit) payload.lexical_limit = Number(lexicalLimit);
      if (vectorLimit) payload.vector_limit = Number(vectorLimit);
      const resp = await axios.post(url, payload);
      setSearchResults(resp?.data?.results ?? []);
      setSearchDebug(resp?.data?.debug ?? null);
    } catch (err: any) {
      if (err.response)
        setSearchError(
          `서버 오류: ${err.response.status} ${JSON.stringify(
            err.response.data
          )}`
        );
      else setSearchError(String(err.message || err));
    } finally {
      setSearchLoading(false);
    }
  };

  return (
    <main style={{ padding: 24 }}>
      <h1>이미지 요약 데모 (gpt-5-mini)</h1>
      <ModelSelector />
      <SystemPromptEditor value={systemPrompt} onChange={setSystemPrompt} />
      <UploadInput onSubmit={handleSubmit} systemPrompt={systemPrompt} />
      {loading && <div>요약 중...</div>}
      {error && (
        <div style={{ color: "red" }}>
          <strong>오류:</strong> {error}
        </div>
      )}
      <ResultViewer result={result} />

      <hr style={{ margin: "24px 0" }} />
      <h2>토큰 데모</h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input
            type="text"
            placeholder="검색어를 입력하세요"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ flex: 1, padding: 8 }}
          />
          <button onClick={handleSearch} disabled={searchLoading}>
            {searchLoading ? "검색 중..." : "검색"}
          </button>
        </div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <div>
            <label>Lexical 모델</label>
            <select
              value={lexicalModel}
              onChange={(e) => setLexicalModel(e.target.value)}
              style={{ marginLeft: 8 }}
            >
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
                const cfg = models.find((m) => m.id === lexicalModel);
                return cfg ? `${cfg.min_limit}~${cfg.max_limit}` : "limit";
              })()}
              value={lexicalLimit}
              onChange={(e) => setLexicalLimit(e.target.value)}
              style={{ marginLeft: 8, width: 120 }}
            />
          </div>
          <div>
            <label>Vector 모델</label>
            <select
              value={vectorModel}
              onChange={(e) => setVectorModel(e.target.value)}
              style={{ marginLeft: 8 }}
            >
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
                const cfg = models.find((m) => m.id === vectorModel);
                return cfg ? `${cfg.min_limit}~${cfg.max_limit}` : "limit";
              })()}
              value={vectorLimit}
              onChange={(e) => setVectorLimit(e.target.value)}
              style={{ marginLeft: 8, width: 120 }}
            />
          </div>
        </div>
      </div>
      {searchError && (
        <div style={{ color: "red", marginTop: 8 }}>
          <strong>에러:</strong> {searchError}
        </div>
      )}
      {searchDebug && (
        <div
          style={{
            marginTop: 12,
            padding: 12,
            border: "1px solid #ddd",
            borderRadius: 6,
          }}>
          <h3>토큰 디버그</h3>
          <div>입력 토큰: {searchDebug.input?.tokens}</div>
          <div style={{ marginTop: 8 }}>
            <h4>Lexical Summary (모델: {searchDebug.lexical?.model_id})</h4>
            <div>토큰 제한: {searchDebug.lexical?.limit}</div>
            <div>최종 토큰: {searchDebug.lexical?.final_tokens}</div>
            <div style={{ fontWeight: "bold" }}>
              {searchDebug.lexical?.final_summary}
            </div>
            {(searchDebug.lexical?.steps || []).map((s: any, i: number) => (
              <div key={i}>
                {i + 1}차 ({s.tokens}): {s.summary}
              </div>
            ))}
          </div>
          <div style={{ marginTop: 8 }}>
            <h4>Vector Summary (모델: {searchDebug.vector?.model_id})</h4>
            <div>토큰 제한: {searchDebug.vector?.limit}</div>
            <div>최종 토큰: {searchDebug.vector?.final_tokens}</div>
            <div style={{ fontWeight: "bold" }}>
              {searchDebug.vector?.final_summary}
            </div>
            {(searchDebug.vector?.steps || []).map((s: any, i: number) => (
              <div key={i}>
                {i + 1}차 ({s.tokens}): {s.summary}
              </div>
            ))}
          </div>
        </div>
      )}
      <div style={{ marginTop: 12 }}>
        {searchResults.length === 0 && !searchLoading && (
          <div>검색 결과 없음</div>
        )}
        {searchResults.map((item) => (
          <div
            key={item.id}
            style={{
              border: "1px solid #ddd",
              padding: 12,
              borderRadius: 6,
              marginBottom: 8,
            }}>
            <div style={{ fontWeight: "bold" }}>
              {item.title} (score: {item.score.toFixed(3)})
            </div>
            <div>{item.snippet}</div>
          </div>
        ))}
      </div>
    </main>
  );
}

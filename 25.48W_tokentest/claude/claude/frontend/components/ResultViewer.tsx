import React from "react";

export default function ResultViewer({ result }: { result: string | null }) {
  return (
    <div>
      <h3>결과</h3>
      <pre>{result ?? "결과 없음"}</pre>
    </div>
  );
}

import React from "react";

export default function ModelSelector() {
  return (
    <div>
      <label>모델 선택: </label>
      <select defaultValue="gpt-5-mini">
        <option value="gpt-5-mini">gpt-5-mini</option>
      </select>
    </div>
  );
}

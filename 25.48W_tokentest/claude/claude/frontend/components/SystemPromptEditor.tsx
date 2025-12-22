import React from "react";

type Props = {
  value: string;
  onChange: (val: string) => void;
};

export default function SystemPromptEditor({ value, onChange }: Props) {
  return (
    <div>
      <label>시스템 인스트럭션:</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="예: 요약은 3문장 이내로."
      ></textarea>
    </div>
  );
}

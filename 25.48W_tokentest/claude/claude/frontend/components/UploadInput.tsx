import React, { useRef } from "react";

type Props = {
  onSubmit: (fd: FormData) => void;
  systemPrompt: string;
};

export default function UploadInput({ onSubmit, systemPrompt }: Props) {
  const textRef = useRef<HTMLTextAreaElement | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const fd = new FormData();
    fd.append("provider", "gpt5");
    fd.append("model", "gpt-5-mini");
    fd.append("output_mode", "내용 요약");
    if (systemPrompt.trim()) fd.append("system_prompt", systemPrompt.trim());
    if (textRef.current?.value) fd.append("text", textRef.current.value);
    if (fileRef.current?.files?.[0]) fd.append("image", fileRef.current.files[0]);
    onSubmit(fd);
  };

  return (
    <form onSubmit={submit}>
      <div>
        <textarea ref={textRef} placeholder="요약할 텍스트를 입력하세요." />
      </div>
      <div>
        <input ref={fileRef} type="file" accept="image/*" />
      </div>
      <button type="submit">요약 실행</button>
    </form>
  );
}

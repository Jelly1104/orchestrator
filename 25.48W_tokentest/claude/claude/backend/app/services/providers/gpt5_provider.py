import base64
import os
from typing import List, Optional

import httpx

# 환경 변수에서 API 키를 읽음 (.env 로딩은 앱 진입점에서 처리)
BASE_URL = os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1").rstrip("/")
CHAT_COMPLETIONS_URL = f"{BASE_URL}/chat/completions"


def build_pipeline_instruction(output_mode: str = "요약") -> str:
    """
    이미지 → 캡션/속성 추출 → 사용자 텍스트와 결합 → gpt-5-mini 요약
    파이프라인을 자연어로 정의한 시스템 프롬프트를 생성한다.
    """
    return (
        "다음 파이프라인으로 작업한다: "
        "1) input_image로 들어온 장면을 보고 한 줄 캡션과 핵심 속성(주제, 배경, 색상/재질, 동작 등)을 bullet로 뽑는다. "
        "2) input_text(사용자 추가 설명)에서 요약에 필요한 키 포인트를 추려낸다. "
        "3) 1과 2의 정보를 합쳐 한국어로 간결히 {output_mode}한다. "
        "이미지가 없으면 텍스트만 요약하고, 텍스트가 없으면 이미지 정보만 정리한다. "
        "필요 이상의 추측은 하지 말고, 결과는 3~5문장 이내로 제공한다."
    ).format(output_mode=output_mode)


def _encode_image_to_data_url(image_bytes: bytes) -> str:
    """이미지 바이너리를 data URL(base64)로 변환."""
    b64 = base64.b64encode(image_bytes).decode("utf-8")
    return f"data:image/jpeg;base64,{b64}"


async def call_gpt5_summary(
    *,
    text: Optional[str],
    image_bytes: Optional[bytes],
    instructions: str,
    model: str = "gpt-5-mini",
) -> str:
    """
    gpt-5-mini에 텍스트 + 이미지(옵션)를 전달해 요약을 받는다.
    """
    openai_key = os.getenv("OPENAI_API_KEY")
    if not openai_key:
        raise RuntimeError("OPENAI_API_KEY가 설정되지 않았습니다.")

    user_content: List[dict] = []
    if text:
        user_content.append({"type": "text", "text": f"input_text:\n{text}"})

    if image_bytes:
        data_url = _encode_image_to_data_url(image_bytes)
        user_content.append(
            {
                "type": "image_url",
                "image_url": {
                    "url": data_url,
                },
            }
        )

    if not user_content:
        user_content.append(
            {"type": "text", "text": "요약할 input_text나 input_image가 없습니다."}
        )

    payload = {
        "model": model,
        "messages": [
            {"role": "system", "content": instructions},
            {"role": "user", "content": user_content},
        ],
    }

    headers = {
        "Authorization": f"Bearer {openai_key}",
        "Content-Type": "application/json",
    }

    async with httpx.AsyncClient(timeout=60) as client:
        resp = await client.post(CHAT_COMPLETIONS_URL, headers=headers, json=payload)
        resp.raise_for_status()
        data = resp.json()

    try:
        return data["choices"][0]["message"]["content"]
    except Exception:
        # 응답 포맷이 예상과 다르면 원본 JSON을 반환해 디버깅에 활용
        return str(data)

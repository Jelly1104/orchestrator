# Config JSON Schema (DB Config)

목표:
- 가격/상품/문구/템플릿/i18n/피처플래그를 코드 배포 없이 변경
- 리포트 재현성 보장: "Report.version + Template.version" 고정
- 운영 안정성: 잘못된 설정 배포 시 fallback 가능

---

## A) Config Keys 목록(권장)
- pricing: 결제 상품/플랜/통화/표시 문구(Stripe priceId 포함)
- templates: 리포트/결과 템플릿(로케일/버전)
- locales: 지원 로케일/표기/날짜 포맷/기본값
- features: Feature flag (rollout, kill switch 일부)
- job_settings: 러너/TTL/백오프/원가 상한 등 운영 파라미터

각 Config는 공통적으로 다음 메타를 가진다:
- schemaVersion: number
- updatedBy: string (optional)
- updatedAt: ISO string (optional)
- data: 실제 설정

---

## B) pricing (예시)
key: "pricing"

data 구조:
- currencyDefault: "KRW" | "USD"
- products: 상품 목록(단건/구독)
  - productKey: 내부키 (ex: "FULL_REPORT")
  - kind: "one_time" | "subscription"
  - active: boolean
  - display: locale별 표시
  - stripe: priceId(환경별 분리 권장)
  - entitlements: 제공 기능(리포트 타입/다운로드 횟수 등)

예시 JSON:
{
  "schemaVersion": 1,
  "data": {
    "currencyDefault": "USD",
    "products": [
      {
        "productKey": "FULL_REPORT",
        "kind": "one_time",
        "active": true,
        "display": {
          "en-US": { "name": "Full Saju Report (PDF)", "subtitle": "Detailed strengths, risks, and action plan" },
          "ko-KR": { "name": "상세 사주 리포트(PDF)", "subtitle": "강점/리스크/액션 플랜" }
        },
        "stripe": { "priceId_prod": "price_xxx", "priceId_test": "price_test_xxx" },
        "pricing": { "USD": 6.99, "KRW": 9900 },
        "entitlements": { "reportType": "FULL", "downloads": 10 }
      },
      {
        "productKey": "MONTHLY_PLAN",
        "kind": "subscription",
        "active": true,
        "display": {
          "en-US": { "name": "Monthly Plan", "subtitle": "Monthly update + archive + comparisons" },
          "ko-KR": { "name": "월간 플랜", "subtitle": "매달 업데이트 + 보관 + 비교" }
        },
        "stripe": { "priceId_prod": "price_sub_xxx", "priceId_test": "price_sub_test_xxx" },
        "pricing": { "USD": 4.99, "KRW": 6900 },
        "entitlements": { "reportType": "MONTHLY", "downloads": 9999 }
      }
    ]
  }
}

---

## C) templates (예시)
key: "templates"

원칙:
- templateId + locale + version 조합이 "결과물 재현"의 기준
- Report.version에는 사용한 template version을 반드시 저장
- 텍스트는 IP 안전(특정 작품/인물 직접 언급 금지)
- 한류 감성은 톤/서사 구조로 구현: "K-Character Archetype", "K-style Action Plan"

data 구조:
- templates: []
  - templateId: "FREE_SUMMARY" | "FULL_PDF" | "MONTHLY"
  - locale: "en-US" | "ko-KR"
  - version: "1.0.0"
  - blocks: 렌더 블록
    - type: "title"|"bullets"|"paragraph"|"table"|"share_card"
    - content: 템플릿 문자열(변수 치환)
    - variables: 사용 변수 목록(검증에 사용)

예시 JSON(일부):
{
  "schemaVersion": 1,
  "data": {
    "templates": [
      {
        "templateId": "FREE_SUMMARY",
        "locale": "en-US",
        "version": "1.0.0",
        "blocks": [
          { "type": "title", "content": "Your Korean Four Pillars Snapshot", "variables": [] },
          { "type": "bullets", "content": [
              "Top strength: {{topStrength}}",
              "Key risk: {{topRisk}}",
              "This week action: {{action1}}"
            ],
            "variables": ["topStrength","topRisk","action1"]
          },
          { "type": "paragraph", "content": "Note: This is guidance, not certainty.", "variables": [] }
        ]
      },
      {
        "templateId": "SHARE_CARD_ARCHETYPE",
        "locale": "en-US",
        "version": "1.0.0",
        "blocks": [
          { "type": "share_card", "content": {
              "headline": "K-Character Archetype: {{archetypeName}}",
              "tagline": "{{tagline}}",
              "actions": ["{{action1}}","{{action2}}","{{action3}}"]
            },
            "variables": ["archetypeName","tagline","action1","action2","action3"]
          }
        ]
      }
    ]
  }
}

---

## D) locales (예시)
key: "locales"

{
  "schemaVersion": 1,
  "data": {
    "supported": ["en-US", "ko-KR"],
    "default": "en-US",
    "dateFormat": { "en-US": "MMM d, yyyy", "ko-KR": "yyyy.MM.dd" },
    "timezoneDefault": { "en-US": "America/Los_Angeles", "ko-KR": "Asia/Seoul" }
  }
}

---

## E) features (예시)
key: "features"

- rollout은 % 또는 allowlist로
- 리스크 기능은 기본 OFF

{
  "schemaVersion": 1,
  "data": {
    "shareCard": { "enabled": true, "rollout": 100 },
    "compatReport": { "enabled": false, "rollout": 0 },
    "adminJobs": { "enabled": true, "allowlistEmails": ["ops@company.com"] }
  }
}

---

## F) job_settings (예시)
key: "job_settings"

{
  "schemaVersion": 1,
  "data": {
    "jobsEnabled": true,
    "lockTtlMinutes": 15,
    "maxAttempts": 5,
    "backoffBaseMinutes": 2,
    "costGuardrails": {
      "maxPdfCostKRW": 50,
      "maxLlmCostKRW": 300
    }
  }
}

---

## G) 검증 규칙(필수)
- templates.blocks[].variables에 선언된 변수는 렌더 시 모두 제공되어야 함(누락 시 실패)
- pricing.products[].stripe.priceId_* 가 환경에 맞게 존재해야 함
- report 생성 시 사용된 templateId/locale/version을 Report에 저장해야 함

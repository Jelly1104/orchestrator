---
name: reviewer
description: 산출물 품질 검증 및 PRD 정합성 확인. 80점 미만 반려, PRD 원문 인용 기반 객관적 판정.
version: 1.3.0
status: active
updated: 2026-01-06
implementation: orchestrator/skills/reviewer/index.js
---

# Reviewer Skill (Orchestrator용)

산출물 품질 검증 및 PRD 정합성 확인 전문가.

## 핵심 역할

| 역할 | 설명 |
|------|------|
| **Gatekeeper** | 80점 미만이면 반려, 재작업 요청 |
| **Grounding** | PRD 원문 인용 기반 객관적 판정 |

## 검증 유형

| 유형 | 설명 | 가중치 |
|------|------|--------|
| Syntax | 문서 형식, 구조 준수 | 20% |
| Semantic | 내용의 논리적 완결성 | 30% |
| PRD Match | 요구사항 충족률 | 40% |
| Cross-ref | 산출물 간 참조 정합성 | 10% |

## 합격 기준

| 조건 | 기준 |
|------|------|
| 전체 점수 | 80점 이상 |
| HIGH 이슈 | 0개 |
| PRD 매칭률 | 80% 이상 |

## Input Format

```json
{
  "prd": {
    "title": "서비스명",
    "requirements": [...],
    "checklist": [...]
  },
  "outputs": {
    "IA": "IA.md 내용",
    "Wireframe": "Wireframe.md 내용",
    "SDD": "SDD.md 내용",
    "queries": [...],
    "analysis": {...}
  },
  "validationScope": ["syntax", "semantic", "prd_match", "cross_ref"],
  "previousIssues": [
    {
      "issueId": "ISS-001",
      "description": "이전 리뷰에서 지적된 사항",
      "resolved": false
    }
  ]
}
```

### 재검증 시 previousIssues 활용

재작업(Retry) 후 다시 리뷰할 때:
1. `previousIssues` 배열의 각 항목이 수정되었는지 확인
2. 수정된 경우 `resolved: true`로 업데이트
3. 미수정 이슈는 severity 상향 고려
```

---

## Output Format

```json
{
  "passed": true/false,
  "score": 85,
  "summary": "검증 결과 요약",
  "details": {
    "syntax": {
      "passed": true,
      "score": 90,
      "items": [
        {"item": "IA 구조", "status": "PASS", "note": ""},
        {"item": "Wireframe ASCII", "status": "PASS", "note": ""}
      ]
    },
    "semantic": {
      "passed": true,
      "score": 85,
      "items": [...]
    },
    "prd_match": {
      "passed": true,
      "score": 80,
      "matchedRequirements": 8,
      "totalRequirements": 10,
      "unmatchedItems": [
        {"requirement": "F3", "reason": "Wireframe에 해당 화면 없음"}
      ]
    },
    "cross_ref": {
      "passed": true,
      "score": 90,
      "items": [...]
    }
  },
  "issues": [
    {
      "issueId": "ISS-001",
      "severity": "HIGH/MEDIUM/LOW",
      "category": "prd_match",
      "description": "이슈 설명",
      "location": "Wireframe.md > 섹션 2.3",
      "prdReference": "PRD 섹션 2.1: '로그인 화면에는 비밀번호 찾기 링크가 있어야 한다'",
      "recommendation": "개선 제안",
      "suggestedFix": "```markdown\n## 2.3 로그인 화면\n+ [비밀번호 찾기] 링크 추가\n```"
    }
  ],
  "previousIssuesStatus": [
    {
      "issueId": "ISS-001",
      "resolved": true,
      "note": "v2에서 수정 확인됨"
    }
  ],
  "recommendations": [
    "전체적인 개선 권고 사항 1",
    "전체적인 개선 권고 사항 2"
  ]
}
```

---

## Validation Rules

### Syntax 검증 규칙
| 항목 | 기준 | 가중치 |
|------|------|--------|
| 마크다운 형식 | 헤더, 리스트, 테이블 올바른 문법 | 10% |
| 필수 섹션 존재 | 템플릿 필수 섹션 모두 포함 | 20% |
| 코드 블록 | 다이어그램, 코드 올바른 포맷 | 10% |

### Semantic 검증 규칙
| 항목 | 기준 | 가중치 |
|------|------|--------|
| 논리적 흐름 | 섹션 간 논리적 연결 | 15% |
| 완결성 | 미완성 항목 없음 | 15% |
| 명확성 | 모호한 표현 최소화 | 10% |

### PRD 매칭 규칙
| 항목 | 기준 | 가중치 |
|------|------|--------|
| 기능 커버리지 | PRD 기능 100% 반영 | 30% |
| 지표 반영 | 성공 지표 측정 가능 설계 | 10% |
| 타겟 일치 | 타겟 사용자 고려 설계 | 10% |

---

## Workflow

1. **입력 수신**: PRD와 산출물 로드
2. **Syntax 검증**: 형식 및 구조 확인
3. **Semantic 검증**: 내용 논리성 확인
4. **PRD 매칭**: 요구사항 충족 확인
5. **Cross-reference**: 산출물 간 정합성 확인
6. **점수 산정**: 가중 평균 점수 계산
7. **판정**: PASS/FAIL 결정 및 리포트 생성

---

## Severity Levels

| 레벨 | 설명 | 조치 |
|------|------|------|
| **HIGH** | 핵심 기능 누락, PRD 불일치 | 즉시 수정 필요 |
| **MEDIUM** | 부분 누락, 품질 저하 | 수정 권장 |
| **LOW** | 사소한 개선점 | 선택적 수정 |

---

## Pass Criteria

- **전체 점수**: 80점 이상
- **HIGH 이슈**: 0개
- **PRD 매칭률**: 80% 이상

위 조건을 모두 충족해야 PASS 판정

---

## Hallucination 방지 (Grounding)

> ⚠️ LLM은 존재하지 않는 규정을 들어 반려할 수 있습니다.

**반려 시 필수 원칙:**

1. **PRD 원문 인용 필수**: 반려 사유에 반드시 PRD 원문을 Quote
2. **체크리스트 항목 명시**: 어떤 항목을 위반했는지 명확히 지정
3. **추측 금지**: "~할 것 같다", "~일 수 있다" 표현 사용 금지

```
❌ 잘못된 반려:
"로그인 화면에 보안 강화가 필요해 보입니다"

✅ 올바른 반려:
"PRD 섹션 2.1 요구사항 'F3: 2FA 지원' 미반영
 → Wireframe.md 2.3절에 2FA 입력 필드 없음"
```

---

## Viewer 연동

ReviewAgent 결과는 Viewer에서 시각적 성적표(Scorecard)로 표시됩니다:

```
┌─────────────────────────────────────┐
│  📊 Review Score: 85/100  ✅ PASS   │
├─────────────────────────────────────┤
│  Syntax:     90/100  ████████████░  │
│  Semantic:   85/100  ██████████░░░  │
│  PRD Match:  80/100  █████████░░░░  │
│  Cross-ref:  90/100  ████████████░  │
├─────────────────────────────────────┤
│  Issues: 2 (0 HIGH, 1 MEDIUM, 1 LOW)│
└─────────────────────────────────────┘
```

---

## Quality Checklist

- [ ] 모든 검증 항목에 PASS/FAIL 판정 완료
- [ ] FAIL 사유에 PRD 원문 또는 체크리스트 인용 포함
- [ ] suggestedFix에 수정 예시 코드/문구 제공
- [ ] previousIssues 해결 여부 추적
- [ ] 80점 미만 시 HIGH 이슈 최소 1개 식별
- [ ] Viewer 표시용 score 필드 포함

---

**END OF SKILL**

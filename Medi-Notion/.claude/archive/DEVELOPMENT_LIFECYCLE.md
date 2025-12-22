# DEVELOPMENT_LIFECYCLE.md - 기능 개발 라이프사이클

> **문서 버전**: 1.0.0
> **최종 업데이트**: 2025-12-17
> **상위 문서**: `CLAUDE.md`
> **대상**: 설계자 (사용자), AI Agent

---

## 1. 개요

### 1.1 목적

AI 기반 기능 개발의 **전체 라이프사이클**을 정의합니다.
PRD 작성부터 피드백 기반 버전업까지의 순환 구조를 통해 지속적인 개선을 보장합니다.

### 1.2 핵심 원칙

```
1. 설계자 주도: PRD 작성 및 버전업 방향 결정은 설계자(사용자)가 담당
2. AI 보조: 기획검증, 개발, 검토는 AI Agent가 자동화
3. 피드백 기반: 사용/검토 후 피드백을 반영하여 PRD 버전업
4. 버전 관리: 모든 변경은 버전으로 추적 가능
```

---

## 2. 라이프사이클 다이어그램

```
┌─────────────────────────────────────────────────────────────────────┐
│                    기능 개발 라이프사이클 v1.0                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐         │
│  │ PRD 작성  │ → │ 기획검증  │ → │   개발   │ → │   검토   │         │
│  │ (설계자)  │   │ Gap Check│   │ SubAgent │   │ Validator│         │
│  └──────────┘   └──────────┘   └──────────┘   └──────────┘         │
│       ↑                                              │               │
│       │         ┌──────────────────────────────────┐ │               │
│       │         │        사용 & 피드백              │ ↓               │
│       │         │  ┌────────────────────────────┐  │               │
│       │         │  │ 1. 산출물 사용/검토        │  │               │
│       │         │  │ 2. 피드백 작성 (노션)      │  │               │
│       │         │  │ 3. 버전 저장 (git tag)     │  │               │
│       │         │  │ 4. 회고 & 개선안 도출      │  │               │
│       │         │  └────────────────────────────┘  │               │
│       │         └──────────────────────────────────┘               │
│       │                         │                                   │
│       │    ┌────────────────────┘                                   │
│       │    ↓                                                        │
│       │  ┌──────────────────────────────────┐                      │
│       └──│ PRD v2.0 작성 (디벨롭 방향 반영)  │                      │
│          └──────────────────────────────────┘                      │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 3. 역할 정의

| 역할 | 담당 | 책임 | 도구 |
|------|------|------|------|
| **설계자** | 사용자 | PRD 작성, 피드백, 버전업 방향 결정 | 노션, Claude Code |
| **전략가** | Leader Agent | Gap Check, 설계 문서 생성 (IA/Wireframe/SDD) | prd-analyzer.js, leader.js |
| **구현자** | SubAgent | 코드/SQL/분석 생성 | subagent.js |
| **검증자** | Output Validator | 품질 검증 (Syntax, PRD 매칭, Schema) | output-validator.js |
| **조정자** | Feedback Loop | 검증 실패 시 재작업 트리거 | feedback-loop.js |

---

## 4. 단계별 상세

### 4.1 PRD 작성 (설계자)

```yaml
담당: 설계자 (사용자)
입력: 비즈니스 요구사항, 이전 피드백
출력: PRD.md (버전 포함)

필수 항목:
  - 목적 (Objective)
  - 타겟 유저 (Target User)
  - 핵심 기능 (Core Features)
  - 성공 지표 (Success Criteria)
  - 산출물 체크리스트

선택 항목:
  - 데이터 요구사항
  - 제약사항
  - 레퍼런스

참조 문서:
  - PRD_TEMPLATE.md
  - PRD_REFERENCE_MAP.md
```

### 4.2 기획검증 (Gap Check)

```yaml
담당: Leader Agent
입력: PRD.md
출력: Gap Check 결과, 확정된 HANDOFF

검증 항목:
  1. 필수 4개 항목 충족 여부
  2. 산출물 체크리스트 추출
  3. 레퍼런스 매칭
  4. 데이터 요구사항 검증 (DOMAIN_SCHEMA.md 기반)

참조 문서:
  - PRD_GAP_CHECK.md
  - PRD_TYPE_PIPELINE.md
```

### 4.3 개발 (SubAgent)

```yaml
담당: SubAgent
입력: HANDOFF.md
출력: 코드, SQL, 분석 리포트

작업 유형:
  - QUANTITATIVE: SQL 쿼리, 데이터 분석
  - QUALITATIVE: 설계 문서, 와이어프레임
  - MIXED: 분석 + 제안서

제약:
  - HANDOFF 기반으로만 작업
  - DOMAIN_SCHEMA.md 컬럼명 준수
  - SELECT 쿼리만 허용
```

### 4.4 검토 (Output Validator)

```yaml
담당: Output Validator
입력: 산출물 목록, PRD 분석 결과
출력: 검증 결과 (PASSED/FAILED)

검증 3단계:
  1. Syntax/Lint 검증
     - SQL 위험문 차단 (INSERT/UPDATE/DELETE)
     - Markdown 구조 확인

  2. PRD 체크리스트 매칭
     - 산출물 ↔ 체크리스트 fuzzy 매칭
     - 누락 항목 식별

  3. 스키마 정합성
     - 테이블/컬럼 존재 여부
     - JOIN 패턴 검증

참조 문서:
  - OUTPUT_VALIDATION.md
```

### 4.5 사용 & 피드백 (설계자)

```yaml
담당: 설계자 (사용자)
입력: 검증 통과된 산출물
출력: 피드백 문서, 버전 태그

활동:
  1. 산출물 사용/검토
     - SQL 실행 및 결과 확인
     - 리포트 검토
     - 실제 비즈니스 적용 테스트

  2. 피드백 작성 (노션)
     - 잘된 점 / 개선 필요 사항
     - 추가 요구사항
     - 버그/오류 리포트

  3. 버전 저장 (git tag)
     - 산출물 + 대화 로그 저장
     - 버전 태그: v{major}.{minor}.{patch}

  4. 회고 & 개선안 도출
     - 근본 원인 분석
     - 다음 버전 방향 결정

피드백 템플릿:
  - 아래 섹션 6 참조
```

### 4.6 PRD 버전업 (설계자)

```yaml
담당: 설계자 (사용자)
입력: 피드백 문서, 대화 로그
출력: PRD v{N+1}.md

버전업 유형:
  - Patch (v1.0.0 → v1.0.1): 버그 수정, 미세 조정
  - Minor (v1.0.0 → v1.1.0): 기능 추가/개선
  - Major (v1.0.0 → v2.0.0): 방향 전환, 대규모 변경

버전업 체크리스트:
  - [ ] 이전 버전 피드백 반영
  - [ ] 새로운 요구사항 추가
  - [ ] 산출물 체크리스트 업데이트
  - [ ] 성공 지표 조정
```

---

## 5. 버전 관리 규칙

### 5.1 PRD 버전 명명

```
PRD v{major}.{minor}.{patch}

major: 방향 전환 또는 대규모 변경
minor: 기능 추가/개선
patch: 버그 수정, 미세 조정

예시:
  - PRD v1.0.0: 초기 버전
  - PRD v1.1.0: 산출물 추가
  - PRD v1.1.1: 오타 수정
  - PRD v2.0.0: 새로운 접근 방식
```

### 5.2 Git 태그 규칙

```bash
# 버전 태그 생성
git tag -a prd-v1.0.0 -m "PRD v1.0.0: 활성 회원 패턴 분석"
git push origin prd-v1.0.0

# 태그 목록 확인
git tag -l "prd-*"
```

### 5.3 대화 로그 보존

```yaml
저장 위치: .claude/logs/{date}_{prd_version}.md
내용:
  - 대화 요약
  - 주요 결정 사항
  - 피드백 내용
  - 다음 버전 방향
```

---

## 6. 피드백 템플릿

```markdown
# 피드백: PRD v{version}

## 1. 버전 정보
- PRD: v{version}
- 실행일: YYYY-MM-DD
- 설계자: {이름}

## 2. 산출물 평가

| 산출물 | 상태 | 평가 | 비고 |
|--------|------|------|------|
| {산출물1} | ✅/⚠️/❌ | 5/5 | - |
| {산출물2} | ✅/⚠️/❌ | 4/5 | 개선 필요 |

## 3. 잘된 점
-

## 4. 개선 필요 사항
-

## 5. 추가 요구사항
-

## 6. 다음 버전 방향
- [ ]
- [ ]

## 7. 버전업 유형
- [ ] Patch (버그 수정)
- [ ] Minor (기능 추가)
- [ ] Major (방향 전환)
```

---

## 7. 적용 예시: Case #4

### v1.0.0 (초기)
```
PRD: 활성 회원 패턴 분석 PoC
결과: ❌ FAILED (1/6 산출물)
문제: Dashboard UI만 생성, PRD 체크리스트 무시
```

### v1.1.0 (Gap Check 적용 후)
```
PRD: (동일)
결과: ✅ PASSED (6/6 산출물)
개선: Gap Check + Output Validator 적용
```

### v2.0.0 (피드백 반영)
```
PRD: HEAVY 세그먼트 심층 분석 + CRM 연동
추가:
  - 이탈 예측 모델 요구사항
  - CRM 시스템 연동 설계
```

---

## 8. 관련 문서

| 문서 | 역할 | 위치 |
|------|------|------|
| PRD_TEMPLATE.md | PRD 작성 템플릿 | .claude/global/ |
| PRD_REFERENCE_MAP.md | 레퍼런스 매핑 | .claude/global/ |
| PRD_GAP_CHECK.md | Gap Check 명세 | .claude/global/ |
| PRD_TYPE_PIPELINE.md | 유형별 파이프라인 | .claude/global/ |
| OUTPUT_VALIDATION.md | 검증 명세 | .claude/global/ |
| DOMAIN_SCHEMA.md | 데이터 스키마 | .claude/global/ |

---

## 9. 구현 파일

| 파일 | 역할 | 위치 |
|------|------|------|
| prd-analyzer.js | PRD 분석, Gap Check | orchestrator/agents/ |
| leader.js | 설계 문서 생성 | orchestrator/agents/ |
| subagent.js | 코드/분석 생성 | orchestrator/agents/ |
| output-validator.js | 산출물 검증 | orchestrator/agents/ |
| feedback-loop.js | 재작업 루프 | orchestrator/agents/ |

---

**END OF DEVELOPMENT_LIFECYCLE.MD**

*지속적인 피드백과 버전업을 통해 기능 개발의 품질을 높입니다.*

# Archive - 삭제된 내용 기록

> **목적**: 문서 다이어트 과정에서 삭제된 내용의 기록
> **최종 업데이트**: 2025-12-29
> **참고**: 각 섹션에 원본 위치와 대체 문서 정보 포함

---

## 1. ROLE_ARCHITECTURE.md에서 삭제된 내용

### 1.1 Role-Based Pipeline Flow (Mermaid)

> **삭제 위치**: ROLE_ARCHITECTURE.md 섹션 0.0
> **이동 위치**: README.md 섹션 1.1

(상세 Mermaid 시퀀스 다이어그램 - README.md로 이동)

### 1.2 문서 로딩 토폴로지 (Mermaid)

> **삭제 위치**: ROLE_ARCHITECTURE.md 섹션 0.1
> **이동 위치**: README.md 섹션 1.2

(Role별 컨텍스트 주입 Mermaid 그래프 - README.md로 이동)

### 1.3 Phase 기반 파이프라인 흐름 (Mermaid)

> **삭제 위치**: ROLE_ARCHITECTURE.md 섹션 0.7
> **이동 위치**: README.md 섹션 2.1

(Phase A/B/C 플로우 Mermaid 그래프 - README.md로 이동)

### 1.4 협업 사이클 (Mermaid)

> **삭제 위치**: ROLE_ARCHITECTURE.md 섹션 2
> **이동 위치**: README.md 섹션 2.2

(Orchestrator-Leader-SubAgent 협업 Mermaid 그래프 - README.md로 이동)

### 1.5 시스템 다이어그램 (ASCII)

> **삭제 위치**: ROLE_ARCHITECTURE.md 섹션 1.2
> **이동 위치**: README.md 섹션 3.1

(Role-Based Collaboration Model ASCII 다이어그램 - README.md로 이동)

### 1.6 Role 상세 정의 (Section 3 전체)

> **삭제 위치**: ROLE_ARCHITECTURE.md 섹션 3.1~3.6
> **대체 문서**: ROLES_DEFINITION.md
> **사유**: ROLES_DEFINITION.md와 완전 중복

삭제된 Role:
- 3.1 Orchestrator → ROLES_DEFINITION.md 참조
- 3.2 Leader → ROLES_DEFINITION.md 섹션 2
- 3.3 Analyzer → ROLES_DEFINITION.md 섹션 3
- 3.4 Designer → ROLES_DEFINITION.md 섹션 4
- 3.5 Implementation Leader → ROLES_DEFINITION.md 섹션 5
- 3.6 Coder → ROLES_DEFINITION.md 섹션 6

### 1.7 보안 아키텍처 상세 (Section 4)

> **삭제 위치**: ROLE_ARCHITECTURE.md 섹션 4
> **대체 문서**: DB_ACCESS_POLICY.md
> **사유**: DB_ACCESS_POLICY.md에 더 상세한 보안 정책 존재

### 1.8 Handoff 프로토콜 상세 (Section 5)

> **삭제 위치**: ROLE_ARCHITECTURE.md 섹션 5
> **대체 문서**: HANDOFF_PROTOCOL.md
> **사유**: HANDOFF_PROTOCOL.md에 완전한 프로토콜 정의 존재

### 1.9 문서 분리 원칙 (ASCII)

> **삭제 위치**: ROLE_ARCHITECTURE.md 섹션 0 (문서 책임 경계)
> **이동 위치**: README.md 섹션 3.2

```
(원본)
┌─────────────────────────────────────────────────────────────────────────────┐
│  문서 분리 원칙                                                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ROLE_ARCHITECTURE.md (지도)           ROLES_DEFINITION.md (매뉴얼)         │
│  ──────────────────────────────        ──────────────────────────────       │
│  • 전체 파이프라인 Topology             • Role별 시스템 프롬프트              │
│  • Phase 정의 (A/B/C)                  • Role별 입출력 정의 (I/O)            │
│  • Role-Skill 권한 매트릭스             • 검증 항목 상세                      │
│  • HITL 체크포인트 위치                 • Actionable Feedback 규칙           │
│  • Orchestrator 스위칭 규칙             • Role간 보고 양식                    │
│                                                                             │
│  참조: Orchestrator, 개발자             참조: 각 LLM Role (Leader, Coder 등)  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 1.10 핵심 원칙 박스 (ASCII)

> **삭제 위치**: ROLE_ARCHITECTURE.md 섹션 1.1
> **이동 위치**: README.md 섹션 5.1

### 1.11 Orchestrator vs Leader 역할 구분 박스 (ASCII)

> **삭제 위치**: ROLE_ARCHITECTURE.md 섹션 0.8
> **이동 위치**: README.md 섹션 5.2

### 1.12 Task ID 네이밍 규칙 상세

> **삭제 위치**: ROLE_ARCHITECTURE.md 섹션 0.6
> **대체 문서**: SYSTEM_MANIFEST.md 섹션 6/7 (Workspace/Docs Paths)
> **사유**: 경로 규칙은 MANIFEST가 담당

삭제된 내용:
- 키워드 자동 추출 JavaScript 코드
- Viewer 표시 규칙
- 산출물 경로 규칙 상세
- caseId 추출 규칙

---

## 2. SYSTEM_MANIFEST.md에서 삭제된 내용

### 2.1 Document Topology Mermaid

> **삭제 위치**: SYSTEM_MANIFEST.md 섹션 2.2
> **이동 위치**: README.md 섹션 1.2
> **사유**: 인간 이해용 다이어그램

### 2.2 Context Loading Topology Mermaid

> **삭제 위치**: SYSTEM_MANIFEST.md 섹션 3-1
> **이동 위치**: README.md 섹션 1.2
> **사유**: 인간 이해용 다이어그램

(추후 SYSTEM_MANIFEST 다이어트 시 추가 예정)

---

## 3. VALIDATION_GUIDE.md에서 삭제된 내용

### 3.1 검증 파이프라인 개요 (ASCII)

> **삭제 위치**: VALIDATION_GUIDE.md 섹션 1
> **이동 위치**: README.md 섹션 4
> **사유**: 인간 이해용 다이어그램

### 3.2 보안 게이트 상세 (Section 8)

> **삭제 위치**: VALIDATION_GUIDE.md 섹션 8
> **대체 문서**: DB_ACCESS_POLICY.md
> **사유**: DB_ACCESS_POLICY.md에 보안 정책 통합

(추후 VALIDATION_GUIDE 다이어트 시 추가 예정)

---

## 4. ANALYSIS_GUIDE.md에서 삭제된 내용

### 4.1 DB 접근 정책 상세 (Section 3)

> **삭제 위치**: ANALYSIS_GUIDE.md 섹션 3 (상세 부분)
> **대체 문서**: DB_ACCESS_POLICY.md (SSOT)
> **사유**: DB_ACCESS_POLICY.md와 중복, 핵심 요약만 유지

삭제된 내용:
- 환경별 .env 설정 예시 (약 20줄)
- 위반 시 대응 로깅 코드 (약 15줄)

### 4.2 SQL 생성 프롬프트 상세 (Section 4.3)

> **삭제 위치**: ANALYSIS_GUIDE.md 섹션 4.3
> **대체**: 핵심 제약사항만 유지
> **사유**: 프롬프트 템플릿 압축

삭제된 내용:
- 분석 요구사항/스키마 정보 플레이스홀더 상세 (약 15줄)
- 결과 해석 프롬프트 상세 요청사항 (약 10줄)

### 4.3 Agent 역할 비교 설명 (Section 1)

> **삭제 위치**: ANALYSIS_GUIDE.md 섹션 1.1 배경 설명
> **대체**: 문제-원인-해결 테이블
> **사유**: 서술형 → 테이블 압축

---

## 5. PRD_GUIDE.md에서 삭제된 내용

### 5.1 Pipeline Router Mermaid

> **삭제 위치**: PRD_GUIDE.md 섹션 1.6
> **이동 위치**: README.md 섹션 7
> **사유**: 인간 이해용 다이어그램

### 5.2 필수 항목 상세 예시 (Section 1.1~1.6)

> **삭제 위치**: PRD_GUIDE.md 섹션 1.1~1.6 예시 박스
> **대체**: 테이블 형식으로 압축 (섹션 1)
> **사유**: 예시 중복 제거, 핵심만 유지

삭제된 내용:
- 각 필수 항목별 예시 코드 블록 (약 50줄)
- 검증 상세 설명

### 5.3 유형 판별 매트릭스 상세 (Section 2.1)

> **삭제 위치**: PRD_GUIDE.md 섹션 2.1 상세 매트릭스
> **대체**: 키워드 기반 판별 + 산출물 기반 판별로 단순화
> **사유**: 중복되는 체크박스 매트릭스

### 5.4 파이프라인 상세 Flow (Section 3)

> **삭제 위치**: PRD_GUIDE.md 섹션 3.1~3.3 상세 Step 목록
> **대체**: 한 줄 요약 플로우
> **사유**: ANALYSIS_GUIDE.md에 더 상세한 파이프라인 정의 존재

삭제된 내용:
- 정량적 파이프라인 Step 1~5 상세 (약 25줄)
- 정성적 파이프라인 Step 1~5 상세 (약 30줄)
- 혼합 파이프라인 Phase A/B 상세 (약 20줄)

### 5.5 레퍼런스 매칭 흐름 (Section 4.2)

> **삭제 위치**: PRD_GUIDE.md 섹션 4.2
> **대체**: 테이블만 유지
> **사유**: 플로우 다이어그램은 README.md에서 커버

### 5.6 관련 문서 물리적 경로

> **삭제 위치**: PRD_GUIDE.md 섹션 8 물리적 경로 컬럼
> **대체**: 문서명만 유지
> **사유**: 경로는 SYSTEM_MANIFEST.md가 SSOT

---

## 6. DB_ACCESS_POLICY.md에서 삭제된 내용

### 6.1 마스킹 구현 코드 (Section 4.3)

> **삭제 위치**: DB_ACCESS_POLICY.md 섹션 4.3
> **사유**: 구현 코드는 실제 소스 코드에서 참조

### 6.2 검토 주기 섹션 (Section 9)

> **삭제 위치**: DB_ACCESS_POLICY.md 섹션 9
> **사유**: 운영 프로세스는 별도 문서로 관리

### 6.3 로그 저장 위치 상세 (Section 5.2)

> **삭제 위치**: DB_ACCESS_POLICY.md 섹션 5.2
> **대체**: SYSTEM_MANIFEST.md Workspace Paths
> **사유**: 경로 정보는 MANIFEST가 SSOT

### 6.4 validateQuery 함수 상세 (Section 6.1)

> **삭제 위치**: DB_ACCESS_POLICY.md 섹션 6.1 상세 함수
> **대체**: 체크리스트 배열만 유지
> **사유**: 구현 상세는 소스 코드에서 관리

---

---

## 7. DOCUMENT_PIPELINE.md에서 삭제된 내용

### 7.1 전체 파이프라인 Mermaid 다이어그램

> **삭제 위치**: DOCUMENT_PIPELINE.md 섹션 전체 파이프라인
> **이동 위치**: README.md 섹션 8
> **사유**: 인간 이해용 다이어그램

삭제된 내용:
- Mermaid flowchart (약 47줄)
- PRD→GapCheck→Design→Code→Review→Deploy 플로우

---

## 8. INCIDENT_PLAYBOOK.md에서 삭제된 내용

### 8.1 Post-Mortem 템플릿 상세 (Section 6.1)

> **삭제 위치**: INCIDENT_PLAYBOOK.md 섹션 6.1
> **대체**: 테이블 형식 필수 항목 요약
> **사유**: 마크다운 템플릿 → 한 줄 요약으로 압축

삭제된 내용:
- 장애 리포트 마크다운 템플릿 (약 20줄)

### 8.2 체크리스트 상세 (Section 7)

> **삭제 위치**: INCIDENT_PLAYBOOK.md 섹션 7.1~7.2
> **대체**: 압축된 체크리스트
> **사유**: 개별 항목 → 플로우 형식으로 통합

삭제된 내용:
- 장애 발생 시 체크리스트 7개 항목
- 일일 점검 체크리스트 4개 항목

---

## 9. ROLES_DEFINITION.md에서 삭제된 내용

### 9.1 JIT Injection ASCII 다이어그램

> **삭제 위치**: ROLES_DEFINITION.md 문서 책임 경계 섹션
> **이동 위치**: README.md 섹션 9
> **사유**: 인간 이해용 다이어그램

삭제된 내용:
- JIT Injection 원칙 ASCII 박스 (약 17줄)

### 9.2 Actionable Feedback 예시 상세

> **삭제 위치**: ROLES_DEFINITION.md 섹션 5.2.1
> **대체**: 한 줄 비교 예시
> **사유**: 코드 블록 예시 → 한 줄 압축

삭제된 내용:
- Bad Example 코드 블록 (3줄)
- Good Example 코드 블록 (약 20줄)

---

## 10. DOMAIN_SCHEMA.md에서 삭제된 내용

### 10.1 Footer 문구

> **삭제 위치**: DOMAIN_SCHEMA.md 문서 끝
> **사유**: 줄 수 최적화 (303→299)

삭제된 내용:
- `*도메인 지식은 올바른 설계의 기초입니다.*`
- 구분선 1개

---

## 변경 이력

| 날짜 | 작업 | 영향 문서 |
|------|------|----------|
| 2025-12-29 | DOMAIN_SCHEMA 다이어트 (303→299) | DOMAIN_SCHEMA.md |
| 2025-12-29 | DOCUMENT_PIPELINE 다이어트 (237→198) | DOCUMENT_PIPELINE.md |
| 2025-12-29 | INCIDENT_PLAYBOOK 다이어트 (334→299) | INCIDENT_PLAYBOOK.md |
| 2025-12-29 | ROLES_DEFINITION 다이어트 (338→294) | ROLES_DEFINITION.md |
| 2025-12-29 | ANALYSIS_GUIDE 다이어트 (365→204) | ANALYSIS_GUIDE.md |
| 2025-12-29 | DB_ACCESS_POLICY 다이어트 (371→246) | DB_ACCESS_POLICY.md |
| 2025-12-29 | PRD_GUIDE 다이어트 (436→181) | PRD_GUIDE.md |
| 2025-12-29 | 초기 아카이브 생성 | ROLE_ARCHITECTURE.md |
| 2025-12-29 | AI_CONTEXT.md 삭제 | context/ (중복 문서 제거) |

---

## 11. AI_CONTEXT.md (삭제됨)

> **삭제 위치**: `.claude/context/AI_CONTEXT.md`
> **사유**: 다른 문서들과 100% 중복
> **삭제일**: 2025-12-29

### 중복 분석

| 삭제된 섹션 | 대체 문서 |
|------------|----------|
| 코드 품질 3대 원칙 | CODE_STYLE.md §1 |
| 개발 3대 금기 | CODE_STYLE.md §1.1 |
| 보안 게이트 | VALIDATION_GUIDE.md §6, DB_ACCESS_POLICY.md |
| 절대 금지 사항 | CLAUDE.md 안전 수칙 |
| Leader/Sub-agent 역할 분리 | ROLES_DEFINITION.md §2~§7 |
| 권한 경계 | ROLE_ARCHITECTURE.md |

### 삭제된 전문 (130줄)

```markdown
# AI_CONTEXT.md - 에이전트 행동 지침서

> **문서 버전**: 2.3.2
> **최종 업데이트**: 2025-12-22
> **물리적 경로**: `.claude/context/AI_CONTEXT.md`
> **상위 문서**: `.claude/CLAUDE.md`
> **대상**: 모든 AI 에이전트 (리더 + 서브)

---

## 🎯 이 문서의 목적

에이전트가 **어떻게 행동해야 하는지** 규칙·절차·금지사항을 명확히 정의합니다.

- **CLAUDE.md**: "무엇을 해야 하는가" (What)
- **AI_CONTEXT.md**: "어떻게 해야 하는가" (How) ← 이 문서
- **AI_Playbook.md**: "왜 이렇게 하는가" (Why)

---

## 📖 읽는 방법

### 당신이 **리더 에이전트**라면:

1. ✅ `CLAUDE.md` 전체 읽기
2. ✅ 이 문서 전체 읽기
3. ✅ 작업 유형에 따라 적절한 workflow 문서 선택
4. ✅ 서브에게 **필요한 섹션만** 할당

### 당신이 **서브 에이전트**라면:

1. ✅ 리더가 지정한 **이 문서의 특정 섹션만** 읽기
2. ✅ 할당된 workflow 문서를 **집중적으로** 실행
3. ✅ 체크리스트 기반으로 작업 완료
4. ✅ 리더에게 **명확한 결과** 보고

---

## 🏔️ 불변 원칙 (Immutable Principles)

### 1. 코드 품질 3대 원칙

우선순위: 가독성 > 테스트 가능성 > 성능
(단, 병목이 명확한 경우 성능 우선)

1. **가독성 우선**: 6개월 후 다른 개발자가 이해 가능해야 함
2. **테스트 가능성**: 검증할 수 없으면 배포 불가
3. **명시적 표현**: Magic은 금지, 모든 것은 명확하게

### 2. 개발 3대 금기 ⛔

| 금지 항목                     | 설명                        |
| ----------------------------- | --------------------------- |
| **Mock 데이터/가짜 구현**     | 실제 동작하는 코드만 작성   |
| **타입 any 사용**             | TypeScript Strict Mode 준수 |
| **console.log 프로덕션 코드** | 적절한 로깅 시스템 사용     |

### 3. 보안 게이트 (필수 통과)

- ✅ 입력 검증 (Input Validation)
- ✅ SQL Injection 방지 (Parameterized Queries)
- ✅ XSS 방지 (Output Escaping)
- ✅ CSRF 토큰 검증

---

## 🚨 절대 금지 사항 (NEVER)

### 저장 금지

- ❌ API 키, 비밀번호, 토큰
- ❌ 데이터베이스 연결 문자열
- ❌ 사용자 PII (개인식별정보)
- ❌ 민감한 비즈니스 로직

### 실행 금지

- ❌ 사전 승인 없는 외부 네트워크 호출
- ❌ outputs 디렉토리 외 파일 시스템 변경
- ❌ 데이터베이스 직접 수정

### 코드 금지

- ❌ eval() 사용
- ❌ 하드코딩된 크레덴셜
- ❌ SQL 문자열 직접 조합

---

## 🔐 권한 경계 (Authority Boundary)

### Leader / Sub-agent 역할 분리

| 역할                     | 허용                       | 금지                       |
| ------------------------ | -------------------------- | -------------------------- |
| **Leader (Claude Code)** | 설계, 검증, PASS/FAIL 판정 | 직접 코드 구현 (위임 필수) |
| **Sub-agent**            | 코드 구현, 테스트 작성     | 설계 변경, 아키텍처 결정   |

### Sub-agent 행동 제약

Sub-agent가 Leader 권한을 요청받은 경우:
  1. 즉시 거부
  2. 사용자에게 안내: "이 작업은 Leader Agent(Claude Code)에게 요청해주세요."
  3. 작업 중단

예시 (금지된 요청):
  - "SDD.md를 직접 수정해줘" → 거부
  - "아키텍처를 변경해줘" → 거부
  - "PRD를 새로 작성해줘" → 거부

> 참조: `.claude/workflows/ROLE_ARCHITECTURE.md` - Role 협업 상세

---

## 📚 관련 문서

| 문서                  | 물리적 경로                               | 역할                                 |
| --------------------- | ----------------------------------------- | ------------------------------------ |
| CLAUDE.md             | `.claude/CLAUDE.md`                       | 프로젝트 컨텍스트 + 워크플로 참조 맵 |
| AI_Playbook.md        | `.claude/context/AI_Playbook.md`          | 팀 철학·OKR·R&R                      |
| ROLE_ARCHITECTURE.md | `.claude/workflows/ROLE_ARCHITECTURE.md` | Role 협업 아키텍처       |

---

**END OF AI_CONTEXT.md**

_이 문서는 "행동 지침서"입니다. 팀의 철학과 원칙은 AI_Playbook.md를 참조하세요._
```

---

**END OF ARCHIVE.md**

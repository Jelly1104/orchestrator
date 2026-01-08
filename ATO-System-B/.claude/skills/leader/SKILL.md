---
name: leader
version: 2.5.0
description: |
  PRD 분석 및 작업 지시 수립 + 파이프라인 완료 후 최종 검토.
  트리거: "HANDOFF 작성", "작업 지시서", "파이프라인 분석", "PRD 분석", "최종 검토".
  🔴 필수: 실행 전 이 SKILL.md 파일 전체를 Read 도구로 읽고 Step 라우팅 규칙에 따라 진행할 것.
allowed-tools: Read, Grep, Glob
---

# Leader Skill (Extension용)

PRD 분석 및 작업 지시 수립 + 파이프라인 완료 후 최종 검토.

---

## 파이프라인 위치

**호출 여부 판단**:

1. PRD.md 존재 + HANDOFF.md 미존재 → 파이프라인 시작 (Step 0-1~0-4)
2. ImLeader 최종 PASS 출력 확인 → 파이프라인 종료 (Step F)

> **상세 파이프라인 흐름**: `.claude/workflows/ROLE_ARCHITECTURE.md` - 파이프라인 타입 섹션 참조

---

## Step 라우팅 규칙 🔴

> **Step 0-1은 항상 필수**. 이후 Step은 직전 컨텍스트를 확인하여 분기.
> **참고**: Pipeline Phase (A/B/C)와 Leader Skill 내부 Step은 별개 개념입니다.

| 호출 시점                               | 진입 Step                  | 설명                   |
| --------------------------------------- | -------------------------- | ---------------------- |
| 파이프라인 시작                         | Step 0-1 → 0-2 → 0-3 → 0-4 | PRD 분석, HANDOFF 생성 |
| 파이프라인 완료 (ImLeader 최종 PASS 후) | Step 0-1 → F               | 최종 검토, 사용자 안내 |

**분기 판단 기준**:

- 직전 턴에 ImLeader PASS 출력이 있는가? → **Step F**
- HANDOFF.md가 아직 없는가? → **Step 0-2 ~ 0-4**

---

## ⚠️ 실행 프로토콜 (위반 시 산출물 무효)

### Step 0-1: 문서 참조 (필수) 🔴

> **전체 문서 읽기 금지** - 해당 섹션만 선택적 Read

#### 참조 디렉토리 구조

```
.claude/
├── SYSTEM_MANIFEST.md              # Quick Context, Role별 필수 로딩
├── rules/
│   └── DOMAIN_SCHEMA.md            # 핵심 레거시 스키마 섹션
├── workflows/
│   ├── ROLES_DEFINITION.md         # Leader 섹션만
│   ├── DOCUMENT_PIPELINE.md        # 파이프라인 타입별 산출물
│   ├── HANDOFF_PROTOCOL.md         # HANDOFF.md 양식, 필수 섹션
│   └── PRD_GUIDE.md                # PRD Gap Check, PRD 완성도 체크
├── context/
│   └── AI_Playbook.md              # 팀 운영 원칙 섹션만
└── project/
    └── PROJECT_STACK.md            # 기술 스택
```

#### 확인 체크리스트

- [ ] `SYSTEM_MANIFEST.md` → Quick Context, Role별 필수 로딩
- [ ] `DOMAIN_SCHEMA.md` → 핵심 레거시 스키마
- [ ] `PROJECT_STACK.md` → 기술 스택
- [ ] `DOCUMENT_PIPELINE.md` → 파이프라인 타입별 산출물
- [ ] `ROLES_DEFINITION.md` → Leader 섹션
- [ ] `HANDOFF_PROTOCOL.md` → HANDOFF.md 양식
- [ ] `PRD_GUIDE.md` → PRD Gap Check, PRD 완성도 체크
- [ ] `AI_Playbook.md` → 팀 운영 원칙

> **참조 가이드**: `docs/reports/Role-reference-guide.md`

---

### Step 0-2: PRD 분석 + Gap Check 🔴

- PRD.md 읽기
- 요구사항에서 목표, 범위, 제약사항 도출
- **PRD Gap Check**: `.claude/workflows/PRD_GUIDE.md`의 **PRD Gap Check** 섹션 참조
- 필수 4개 항목 (목적, 타겟, 기능, 지표) 확인 → 누락 시 HANDOFF 생성 중단, 사용자에게 보완 요청

### Step 0-3: 파이프라인 결정

| 파이프라인        | 조건                   |
| ----------------- | ---------------------- |
| `analysis`        | 데이터 분석만 필요     |
| `design`          | 설계만 필요            |
| `code`            | SDD 존재 + 코드만 필요 |
| `ui_mockup`       | 설계 → 코드            |
| `analyzed_design` | 분석 → 설계            |
| `full`            | 분석 → 설계 → 코드     |

### Step 0-4: HANDOFF 생성 및 보고서 출력

---

## 파이프라인 완료 후 최종 검토

> **시점**: ImLeader 최종 PASS 후, Leader가 PRD 대비 산출물 검토

### Step F: 최종 검토 (Final Review) 🔴

파이프라인 완료 후 Leader는 아래 절차를 수행합니다.

#### F-1. PRD 대비 산출물 검토

| 검토 항목 | 확인 내용                          |
| --------- | ---------------------------------- |
| 목적 달성 | PRD 목적이 산출물에 반영되었는가?  |
| 기능 완성 | PRD 핵심 기능이 모두 구현되었는가? |
| 제약 준수 | PRD 제약사항이 위반되지 않았는가?  |

#### F-2. 사용자 안내 출력 (필수)

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎉 [파이프라인 완료]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📂 산출물 위치:
  - 문서: docs/cases/{caseId}/{taskId}/
  - 코드: frontend/src/features/{feature}/

{코드 산출물이 있는 경우}
🖥️ 실행 방법:
  cd frontend
  npm install
  npm run dev

🌐 접속: http://localhost:5173
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

#### F-3. PRD 충족 체크리스트

| PRD 항목 | 산출물 반영 | 비고   |
| -------- | :---------: | ------ |
| {목적}   |    ✅/❌    | {설명} |
| {기능1}  |    ✅/❌    | {설명} |
| {기능2}  |    ✅/❌    | {설명} |
| ...      |     ...     | ...    |

> ⚠️ 미충족 항목이 있으면 사용자에게 보고 후 추가 작업 여부 확인

---

## 핵심 역할

| 역할                | 설명                                                |
| ------------------- | --------------------------------------------------- |
| **PRD 분석**        | 요구사항에서 목표, 범위, 제약사항 도출              |
| **파이프라인 결정** | analysis / design / code / ui_mockup / full 중 선택 |
| **HANDOFF 생성**    | 하위 Skill이 참조할 작업 지시서 작성                |
| **최종 검토**       | PRD 대비 산출물 검토, 사용자 안내                   |

## 제약사항

| 제약            | 설명                                     |
| --------------- | ---------------------------------------- |
| 직접 실행 금지  | SQL 작성, 설계 문서 생성, 코드 작성 금지 |
| 파이프라인 명시 | 반드시 파이프라인 타입 결정              |
| HANDOFF 필수    | 하위 Role 실행을 위한 작업 지시서 생성   |

---

## Skill Report (필수 출력)

### 파이프라인 시작 시 (Step 0-1 ~ 0-4)

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 [Leader Skill Report - 시작]
🔧 사용된 Skill: leader v2.2
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📥 입력: PRD.md
🔍 Gap Check (Step 0-2): {n}/4개 충족 → {PASS / FAIL}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
{Gap Check PASS 시}
📤 출력: HANDOFF.md
✅ 파이프라인 (Step 0-3): {pipeline_type}
✅ 포함 Skill: {skill_list}

{Gap Check FAIL 시}
🛑 HANDOFF 생성 중단
❓ 보완 필요 항목: {누락 항목 목록}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### 파이프라인 완료 시 (Step F)

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 [Leader Skill Report - 완료]
🔧 사용된 Skill: leader v2.2
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 PRD 충족 검토 (Step F): {n}/{total}개 항목 충족
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📂 산출물 위치:
  - 문서: docs/cases/{caseId}/{taskId}/
  - 코드: frontend/src/features/{feature}/

{코드 산출물이 있는 경우}
🖥️ 실행 방법:
  cd frontend && npm install && npm run dev

🌐 접속: http://localhost:5173
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

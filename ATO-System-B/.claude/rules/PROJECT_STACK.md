# PROJECT_STACK.md - 프로젝트별 기술 스택 템플릿

> **문서 버전**: 1.3.0
> **최종 업데이트**: 2025-12-22
> **물리적 경로**: `.claude/rules/PROJECT_STACK.md`
> **상위 문서**: `.claude/CLAUDE.md` > **용도**: AI 에이전트에게 **"이 프로젝트만의 기술적 제약"**을 주입

---

## 🎯 프로젝트 개요 (Overview)

| 항목       | 내용                                           |
| ---------- | ---------------------------------------------- |
| 프로젝트명 | 공지사항 목록 PoC (케이스 #1)                  |
| 기반 PRD   | `docs/case1-notice-list/PRD.md`                |
| 승인 상태  | [x] Draft (AI 추천) / [ ] Approved (사람 승인) |
| 승인자     | -                                              |
| 승인일     | 2025-12-16                                     |

**⚠️ Legacy Integration 체크 시 주의사항**

이 프로젝트는 `.claude/rules/DOMAIN_SCHEMA.md`의 제약을 엄격히 따릅니다.
DB 컬럼명 변경 금지 및 대용량 테이블 조회 시 인덱스 전략이 필수입니다.

---

## 2. 기술 스택 (Tech Stack)

_해당하지 않는 영역은 삭제하거나 비워두세요._

### 🟦 FE (Frontend)

| 카테고리    | 기술         | 버전 | 비고            |
| ----------- | ------------ | ---- | --------------- |
| Framework   | React (Vite) | 18.x | PoC용 단순 구성 |
| Language    | TypeScript   | 5.x  | Strict Mode     |
| Styling     | Tailwind CSS | 3.x  |                 |
| HTTP Client | fetch        | -    | 내장 API        |
| Pkg Manager | npm          | 10.x |                 |

### ☕ BE (Backend)

| 카테고리  | 기술       | 버전 | 비고                    |
| --------- | ---------- | ---- | ----------------------- |
| Runtime   | Node.js    | 20.x | LTS                     |
| Framework | Express    | 4.x  | 빠른 구현용             |
| Language  | TypeScript | 5.x  |                         |
| Database  | MySQL      | 8.x  | Legacy DB               |
| ORM       | mysql2     | 3.x  | Raw Query (레거시 호환) |
| Testing   | Vitest     | 1.x  |                         |

### 📱 APP (Mobile)

| 카테고리  | 기술     | 버전  | 비고              |
| --------- | -------- | ----- | ----------------- |
| Framework | Flutter  | x.x.x |                   |
| Language  | Dart     | x.x.x | Sound Null Safety |
| State     | Riverpod | x.x.x |                   |

### ☁️ Infra

| 카테고리  | 기술      | 버전 | 비고 |
| --------- | --------- | ---- | ---- |
| Cloud     | AWS       | -    |      |
| IaC       | Terraform | x.x  |      |
| Container | Docker    | x.x  |      |

---

## 3. 의존성 정책 (Dependency Policy)

### 필수 devDependencies

| 패키지             | 권장 버전 | 용도            |
| ------------------ | --------- | --------------- |
| `react`            | ^18.2.0   | UI 라이브러리   |
| `@types/react`     | ^18.2.0   | React 타입      |
| `@types/react-dom` | ^18.2.0   | ReactDOM 타입   |
| `jsdom`            | ^24.0.0   | 테스트 DOM 환경 |
| `vitest`           | ^1.0.0    | 테스트 러너     |

### 🚨 금지 버전 (보안 취약점)

| 패키지         | 금지 버전     | 안전 버전   |
| -------------- | ------------- | ----------- |
| `react` (19.x) | 19.0.0~19.0.2 | 19.0.3 이상 |

> ⚠️ 참고: 버전 규칙은 `.claude/rules/PROJECT_STACK.md` (이 문서)가 `package.json`보다 우선합니다.

### 버전 고정 (Resolutions)

_의존성 충돌 방지를 위한 강제 버전 지정_

```json
{
  "resolutions": {
    "react": "18.2.0",
    "react-dom": "18.2.0",
    "@types/react": "18.2.0"
  }
}
```

---

## 4. 프로젝트 특이사항 (Specifics)

### ⚠️ 제약사항 (Constraints)

- **PHI 보호**: 환자 정보가 포함된 로그는 마스킹 필수.
- **Legacy Header**: 레거시 API 호출 시 `X-Medi-Auth` 헤더 필수 포함.

### 📦 추가 라이브러리 (Major Libs)

- [주요 라이브러리 1]
- [주요 라이브러리 2]

### 🔑 환경 변수 (Env Vars)

- `NEXT_PUBLIC_API_URL`: API 엔드포인트
- `DB_HOST`: (Secret)

---

## 5. 프로젝트 경로 구조 (SYSTEM_MANIFEST v4.0.0)

ATO-System-B의 실제 코드 경로입니다.

| 경로 | 설명 | 에이전트 권한 |
| ---- | ---- | ------------- |
| `backend/src/` | Express API 서버 코드 | ✅ 수정 가능 |
| `frontend/src/` | React 프론트엔드 코드 | ✅ 수정 가능 |
| `mcp-server/` | MCP 서버 모듈 | ✅ 수정 가능 |
| `orchestrator/skills/` | 에이전트 스킬 정의 | ⚠️ 제한적 |
| `workspace/` | 분석 결과 및 산출물 | ✅ 수정 가능 |
| `src/` | 레거시 코드 | ⚠️ 읽기 전용 |

---

## 6. 스크립트 명령어 (Scripts)

AI는 아래 명령어를 사용하여 프로젝트를 실행하고 검증합니다.

| 목적        | 명령어      | 설명                               |
| ----------- | ----------- | ---------------------------------- |
| 개발 서버   | `[command]` | 예: `yarn dev`                     |
| 전체 테스트 | `[command]` | 예: `yarn test`                    |
| 커버리지    | `[command]` | 예: `yarn test:coverage`           |
| 린트/타입   | `[command]` | 예: `yarn lint && yarn type-check` |
| 빌드        | `[command]` | 예: `yarn build`                   |

---

## 📚 관련 문서

| 문서                             | 역할                                      |
| -------------------------------- | ----------------------------------------- |
| `CLAUDE.md`                      | [Root] 팀 아키텍처 원칙 및 헌법           |
| `.claude/rules/DOMAIN_SCHEMA.md` | [Rules] DB 스키마 및 비즈니스 데이터 구조 |
| `.claude/rules/CODE_STYLE.md`    | [Rules] 언어별 코딩 스타일 가이드         |

---

**END OF PROJECT_STACK.md**

이 파일은 프로젝트의 "기술적 신분증"입니다. 변경 시 반드시 업데이트하세요.

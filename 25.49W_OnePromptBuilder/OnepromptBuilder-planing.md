```markdown
# AI-Native One-Prompt App Builder Platform

### 단 한 줄의 프롬프트로 실행 가능한 앱 생성 및 생애주기 관리 시스템

---

## 1. 프로젝트 개요

### 1.1 사용자 중심의 문제 정의 (Problems)

| ID     | 문제 정의 (Pain Points)               | 배경 설명                                                                               |
| ------ | ------------------------------------- | --------------------------------------------------------------------------------------- |
| **P1** | **개발의 높은 진입 장벽과 시간 비용** | 아이디어는 있지만 코딩 지식이 부족하거나 MVP 제작에 시간이 오래 걸려 시장 검증이 늦어짐 |
| **P2** | **워크플로우 단절**                   | 기획, 디자인, 개발, 배포 툴이 분리되어 흐름이 끊기고 생산성 저하                        |
| **P3** | **프롬프트 엔지니어링 난이도**        | 원하는 결과를 얻기 위한 구조화된 프롬프트 작성이 어려움                                 |
| **P4** | **생애주기 관리 부재**                | 생성된 코드와 MVP의 지속적인 개선 프로세스가 존재하지 않음                              |

---

### 1.2 해결책 제시 (Solutions)

- **One-Prompt to App Engine:** 자연어 한 줄 입력만으로 PRD → 코드 생성 → 즉시 앱 실행
- **Lifecycle Orchestrator:** 앱 상태(MVP→Alpha→Beta)에 맞춰 개선 가이드 자동 생성
- **Local-First Architecture:** 서버 없이 LocalStorage 기반 저장/로드로 빠른 실행

---

## 2. 비즈니스 가치 및 산출물

### 2.1 기대 결과물

- **타입:** 웹 SaaS (Client-Side SPA)
- **가치:**
  - 개발 기간 **2주 → 10분**
  - 인프라비용 없이 MVP 검증 가능
  - PRD / 코드 등 정형 아티팩트 자동 생성

### 2.2 수익모델

| 모델                | 설명                              |
| ------------------- | --------------------------------- |
| **Freemium (무료)** | 로컬 기반 무제한 사용             |
| **Pro ($29/월)**    | 협업/클라우드 저장/GitHub 연결    |
| **Enterprise API**  | 사내 자동화된 내부 도구 빌더 제공 |

---

## 3. 데이터 수집 및 처리 방식

### 3.1 Data Collection

- 사용자 입력 프롬프트
- 사용 패턴 기반 암묵적 컨텍스트

### 3.2 Data Processing

1. **Intent Analysis → 기능 요구 추출**
2. **Planner/Designer/Coder Agents → HTML/JS 코드 생성**
3. **Validator → 코드 오류 검사 후 실행**

---

## 4. 시스템 설계 (Serverless MVP)
```

+---------------------------------------------------------------+
| User Browser (Client-Side Only) |
| |
| +------------------+ +---------------------------------+ |
| | Input Interface | | Lifecycle Dashboard (HTML Ref) | |
| +--------+---------+ +----------------+----------------+ |
| | | |
| v v |
| +------------------+ +---------------------------------+ |
| | AI Logic Core |<---| LocalStorage (DB 대체) | |
| | (API Caller JS) | | (Projects, Prompts, Artifacts) | |
| +--------+---------+ +---------------------------------+ |
| | |
| v |
| +------------------+ |
| | Preview Engine | |
| | (Iframe Sandbox) | |
| +------------------+ |
+-----------+---------------------------------------------------+
| (Secure API Call)
v
+-----------------------+
| LLM API (OpenAI) |
+-----------------------+

```

---

## 5. 상세 기능 정의 (MoSCoW)

| Priority | 기능명 | 내용 |
|---|---|---|
| **Must** | One-Prompt Generator | PRD + 코드 + 미리보기 즉시 생성 |
| **Must** | Lifecycle Manager | 프로젝트 단계 시각화 |
| **Must** | Code Preview | Iframe 실행환경 제공 |
| **Should** | Local Save/Load | LocalStorage CRUD |
| **Should** | File Export | HTML/JSON 다운로드 |
| **Could** | Cloud Sync | 추후 DB 연동 |
| **Won't** | Auth / DB | MVP 제외 |

---

## 6. 기술 설계

### 6.1 Tech Stack

| 구성 | 선택 |
|---|---|
| Frontend | React + Tailwind + Monaco Editor |
| Backend | 없음 (Serverless) |
| AI | GPT-4o API |
| Storage | LocalStorage/IndexedDB |
| Runtime | Iframe Sandbox |

### 6.2 LocalStorage 구조

| Key | Description | Example |
|---|---|---|
| `projects` | 프로젝트 리스트 | `[{id:1, name:"Todo", stage:"MVP"}]` |
| `project_{id}` | 상세 데이터 | `{prompts:{}, artifacts:{html:"..."}}` |
| `settings` | 환경 설정 | `{theme:"dark", apiKey:"..."}` |

### 6.3 API 스펙

| Method | Target | Purpose |
|---|---|---|
| `POST` | OpenAI API | 코드/PRD 생성 요청 |
| Local | LocalStorage CRUD | 프로젝트 저장 |

---

## 7. 사용자 흐름

1. 사용자가 프롬프트 입력
2. AI가 즉시 PRD 및 구조 설계 생성
3. Code Agent가 HTML/JS 코드 생성
4. Preview Engine에서 실행
5. LocalStorage 저장

---

## 8. MVP (3일)

| 일정 | 단계 | 작업 | 결과물 |
|---|---|---|---|
| Day 1 | UI/Logic | 세팅, 대시보드 이식, Local CRUD | 기본 UI |
| Day 2 | AI 연동 | OpenAI + Streaming | 생성 모듈 |
| Day 3 | Preview | Iframe Sandbox + 버그픽스 | 실행 가능한 제품 |

---

## 9. 확장 계획

| 아이디어 |
|---|
| Voice-to-App |
| Image-to-Code |
| Prompt/App Marketplace |
| Figma/GitHub Sync |

---
```

완료됨. Markdown 그대로 `.md` 저장하면 바로 사용 가능.

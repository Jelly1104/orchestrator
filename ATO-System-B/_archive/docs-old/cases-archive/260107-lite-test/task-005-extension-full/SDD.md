# SDD.md - 무찌마 일간 베스트 팟캐스트

> **문서 버전**: 1.0.0
> **최종 업데이트**: 2026-01-08
> **관련 PRD**: 260107-lite-test/task-005-extension-full/PRD.md

---

## 1. 개요

### 1.1 문서 정보

| 항목 | 내용 |
|------|------|
| 기능명 | 무찌마 일간 베스트 팟캐스트 |
| 버전 | 1.0.0 |
| 작성일 | 2026-01-08 |
| 관련 PRD | PRD - 무찌마 일간 베스트 팟캐스트 페이지 |

### 1.2 기능 요약

24시간 내 무찌마 커뮤니티 인기 게시물을 분석하여 2인 대화(Host-Guest) 형식의 팟캐스트 대본을 생성하고, 웹 플레이어 UI를 통해 재생(TTS 시뮬레이션)하는 기능.

---

## 2. 기술 스택

| 영역 | 기술 |
|------|------|
| Frontend | React 18+, TypeScript 5.x, TailwindCSS 3.x |
| Backend | Node.js 20.x, Express 4.x |
| Database | MySQL 8.x (레거시 연동) |

---

## 3. 데이터 모델

### 3.1 레거시 테이블 매핑 (DOMAIN_SCHEMA 준수)

| 논리명 | 물리 테이블 | 물리 컬럼 | 타입 | 설명 |
|--------|-------------|-----------|------|------|
| 게시글 ID | BOARD_MUZZIMA | BOARD_IDX | INT | PK |
| 카테고리 | BOARD_MUZZIMA | CTG_CODE | CHAR(6) | 카테고리 코드 |
| 제목 | BOARD_MUZZIMA | TITLE | VARCHAR(200) | 게시글 제목 |
| 본문 | BOARD_MUZZIMA | CONTENT | MEDIUMTEXT | 게시글 내용 |
| 조회수 | BOARD_MUZZIMA | READ_CNT | INT | 조회수 |
| 추천수 | BOARD_MUZZIMA | AGREE_CNT | INT | 추천수 |
| 작성일 | BOARD_MUZZIMA | REG_DATE | DATETIME | 작성일시 |
| 댓글 ID | COMMENT | COMMENT_IDX | INT UNSIGNED | PK |
| 댓글 게시글 | COMMENT | BOARD_IDX | INT UNSIGNED | FK |

### 3.2 API Response 타입

```typescript
// 베스트 게시물 응답
interface BestPostsResponse {
  posts: BestPost[];
}

interface BestPost {
  BOARD_IDX: number;
  TITLE: string;
  READ_CNT: number;
  AGREE_CNT: number;
  COMMENT_CNT: number;
  REG_DATE: string;
}

// 팟캐스트 대본 응답
interface PodcastScriptResponse {
  script: ScriptLine[];
  metadata: ScriptMetadata;
}

interface ScriptLine {
  speaker: 'HOST' | 'GUEST';
  text: string;
}

interface ScriptMetadata {
  generatedAt: string;
  wordCount: number;
  estimatedDuration: string;
}
```

### 3.3 Frontend 상태 타입

```typescript
// 플레이어 상태
type PlayerStatus = 'idle' | 'playing' | 'paused' | 'completed';

// 데이터 로딩 상태
type LoadingStatus = 'loading' | 'success' | 'error';

// 플레이어 전체 상태
interface PlayerState {
  status: PlayerStatus;
  currentLineIndex: number;
  script: ScriptLine[];
  metadata: ScriptMetadata | null;
}
```

---

## 4. API 설계

### 4.1 GET /api/podcast/best-posts

24시간 내 베스트 게시물 목록 조회

| 항목 | 내용 |
|------|------|
| Method | GET |
| Endpoint | /api/podcast/best-posts |
| Query Params | 없음 |

**Response**
```json
{
  "posts": [
    {
      "BOARD_IDX": 3679759,
      "TITLE": "게시글 제목",
      "READ_CNT": 100,
      "AGREE_CNT": 27,
      "COMMENT_CNT": 9,
      "REG_DATE": "2026-01-07T06:31:52.000Z"
    }
  ]
}
```

### 4.2 GET /api/podcast/script

팟캐스트 대본 생성

| 항목 | 내용 |
|------|------|
| Method | GET |
| Endpoint | /api/podcast/script |
| Query Params | 없음 |

**Response**
```json
{
  "script": [
    { "speaker": "HOST", "text": "안녕하세요, 오늘의 무찌마 베스트를 전해드립니다." },
    { "speaker": "GUEST", "text": "네, 오늘도 핫한 게시물들이 많았네요." }
  ],
  "metadata": {
    "generatedAt": "2026-01-08T06:00:00.000Z",
    "wordCount": 450,
    "estimatedDuration": "약 3분"
  }
}
```

---

## 5. 컴포넌트 설계

### 5.1 컴포넌트 계층

```
frontend/src/features/podcast-player/
├── index.tsx              # 메인 엔트리포인트
├── types.ts               # 타입 정의
├── PodcastPlayer.tsx      # 메인 컴포넌트 (컨테이너)
├── hooks/
│   └── usePodcast.ts      # 커스텀 훅 (상태 관리)
└── components/
    ├── ScriptDisplay.tsx  # 대본 표시 컴포넌트
    └── PlayButton.tsx     # 재생 버튼 컴포넌트
```

### 5.2 Props 인터페이스

```typescript
// types.ts

// 스크립트 라인
export interface ScriptLine {
  speaker: 'HOST' | 'GUEST';
  text: string;
}

// 메타데이터
export interface ScriptMetadata {
  generatedAt: string;
  wordCount: number;
  estimatedDuration: string;
}

// 플레이어 상태
export type PlayerStatus = 'idle' | 'playing' | 'paused' | 'completed';

// ScriptDisplay Props
export interface ScriptDisplayProps {
  script: ScriptLine[];
  currentLineIndex: number;
  isPlaying: boolean;
}

// PlayButton Props
export interface PlayButtonProps {
  status: PlayerStatus;
  onToggle: () => void;
  disabled?: boolean;
}
```

### 5.3 컴포넌트 명세

| 컴포넌트 | Props | 설명 |
|----------|-------|------|
| PodcastPlayer | - | 메인 컨테이너 (API 호출, 상태 관리) |
| ScriptDisplay | ScriptDisplayProps | 대본 목록 렌더링, 현재 라인 강조 |
| PlayButton | PlayButtonProps | 재생/일시정지 버튼 |

---

## 6. 엔트리포인트 연결 (필수)

### 6.1 연결 위치

```
frontend/src/main.tsx
```

### 6.2 연결 방법

```typescript
// frontend/src/main.tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import { PodcastPlayer } from './features/podcast-player'  // ← import 추가

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <PodcastPlayer />  {/* ← 렌더링 */}
  </React.StrictMode>,
)
```

### 6.3 검증 체크리스트

- [ ] `main.tsx`에서 PodcastPlayer import
- [ ] `main.tsx`에서 PodcastPlayer 렌더링
- [ ] `npm run build` 성공
- [ ] `npm run dev` 후 브라우저에서 확인

---

## 7. 스타일 가이드

### 7.1 TailwindCSS 클래스 규칙

| 용도 | 클래스 예시 |
|------|-------------|
| 레이아웃 | `flex`, `flex-col`, `items-center`, `justify-center` |
| 간격 | `p-4`, `p-6`, `gap-4`, `space-y-4` |
| 색상 | `bg-white`, `bg-gray-50`, `text-gray-900` |
| 버튼 | `bg-blue-600`, `hover:bg-blue-700`, `text-white` |
| 반응형 | `sm:`, `md:`, `lg:` |
| 크기 | `max-w-2xl`, `w-full` |

### 7.2 색상 팔레트

| 요소 | 색상 |
|------|------|
| 배경 | `bg-gray-50` |
| 카드 배경 | `bg-white` |
| HOST 발언 | `bg-blue-50`, `border-l-4 border-blue-500` |
| GUEST 발언 | `bg-green-50`, `border-l-4 border-green-500` |
| 재생 버튼 | `bg-blue-600` |
| 일시정지 버튼 | `bg-gray-600` |

### 7.3 금지 사항

- [ ] inline style 사용 금지 (`style={{ }}`)
- [ ] CSS 파일 별도 생성 지양

---

## 8. 에러 처리

| 상황 | 처리 방법 |
|------|-----------|
| 로딩 중 | "대본을 불러오는 중..." 텍스트 |
| API 에러 | "대본을 불러오지 못했습니다. 잠시 후 다시 시도해주세요." |
| 빈 대본 | "오늘의 베스트 게시물이 없습니다." |

---

## 9. Backend 구현 가이드

### 9.1 라우터 구조

```
backend/src/routes/podcast/
├── index.ts          # 라우터 등록
├── controller.ts     # 컨트롤러
├── service.ts        # 서비스 로직
└── types.ts          # 타입 정의
```

### 9.2 엔트리포인트 연결 (Backend)

```typescript
// backend/src/index.ts 또는 app.ts
import express from 'express';
import podcastRouter from './routes/podcast';  // ← import 추가

const app = express();

app.use('/api/podcast', podcastRouter);  // ← 라우터 등록
```

---

## 10. 구현 순서 권장

1. **타입 정의** (`types.ts`)
2. **Backend API** (`routes/podcast/`)
3. **Frontend 컴포넌트** (PlayButton → ScriptDisplay → PodcastPlayer)
4. **커스텀 훅** (`usePodcast.ts`)
5. **엔트리포인트 연결** (`main.tsx`)
6. **빌드/구동 테스트**

---

**END OF SDD.MD**

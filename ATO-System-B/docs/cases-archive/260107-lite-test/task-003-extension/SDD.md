# SDD.md - 무찌마 일간 베스트 팟캐스트

| 항목 | 내용 |
|------|------|
| 기능명 | 무찌마 일간 베스트 팟캐스트 플레이어 |
| 버전 | 1.0.0 |
| 작성일 | 2026-01-07 |
| 관련 PRD | 260107-lite-test/task-003-extension |

---

## 1. 개요

### 1.1 기능 요약

BOARD_MUZZIMA 테이블에서 24시간 내 인기 게시물 상위 5건을 추출하여 2인 대화(Host-Guest) 형식의 팟캐스트 대본을 생성하고, 웹 페이지에서 재생 가능한 팟캐스트 플레이어를 제공한다.

### 1.2 핵심 기능

| 기능 | 설명 |
|------|------|
| 대본 생성 | 베스트 게시물 기반 450~500 단어 대본 |
| 플레이어 UI | Host/Guest 대화형 대본 표시 |
| 재생 컨트롤 | 재생/일시정지, 진행률 표시 |

---

## 2. 기술 스택

| 영역 | 기술 |
|------|------|
| Frontend | React 18.x, TypeScript 5.x, TailwindCSS 3.x |
| Backend | Node.js 20.x, Express 4.x, TypeScript 5.x |
| Database | MySQL 8.x (레거시 - BOARD_MUZZIMA) |

---

## 3. 데이터 모델

### 3.1 타입 정의 (공통)

```typescript
// types.ts

// 대본 라인 (Host 또는 Guest 대사)
export interface ScriptLine {
  speaker: 'host' | 'guest';
  speakerName: string;  // "Dr. AI" 또는 "Guest"
  content: string;
  section: 'opening' | 'topic' | 'closing';
  order: number;
}

// 전체 팟캐스트 대본
export interface PodcastScript {
  title: string;
  date: string;  // YYYY-MM-DD
  duration: string;  // "약 3분"
  wordCount: number;
  lines: ScriptLine[];
}

// 베스트 게시물
export interface BestPost {
  boardIdx: number;
  title: string;
  contentPreview: string;  // 200자 미리보기
  readCnt: number;
  agreeCnt: number;
  regDate: string;
  popularityScore: number;
  category: '의료분쟁' | '감성에세이' | '기타';
}

// API 응답 타입
export interface ScriptResponse {
  success: boolean;
  data: PodcastScript;
}

export interface BestPostsResponse {
  success: boolean;
  data: BestPost[];
}
```

### 3.2 레거시 테이블 매핑

| 논리명 | 물리 컬럼명 | 타입 | 설명 |
|--------|-------------|------|------|
| 게시글 ID | BOARD_IDX | INT | PK |
| 제목 | TITLE | VARCHAR(200) | 게시글 제목 |
| 본문 | CONTENT | MEDIUMTEXT | 게시글 본문 |
| 조회수 | READ_CNT | INT | 조회수 |
| 추천수 | AGREE_CNT | INT | 추천수 |
| 작성일 | REG_DATE | DATETIME | 작성일시 |

### 3.3 인기 점수 계산

```sql
popularity_score = READ_CNT + (AGREE_CNT * 10)
```

---

## 4. API 설계

### 4.1 GET /api/podcast/best-posts

베스트 게시물 목록 조회

**Request**
```
GET /api/podcast/best-posts
```

**Response**
```json
{
  "success": true,
  "data": [
    {
      "boardIdx": 3676349,
      "title": "의료분쟁 경험담.. 이나라 바이탈은...",
      "contentPreview": "제가 몇번 글올린걸 본 분들은...",
      "readCnt": 0,
      "agreeCnt": 736,
      "regDate": "2026-01-02T03:05:25.000Z",
      "popularityScore": 7360,
      "category": "의료분쟁"
    }
  ]
}
```

### 4.2 GET /api/podcast/script

팟캐스트 대본 조회

**Request**
```
GET /api/podcast/script
```

**Response**
```json
{
  "success": true,
  "data": {
    "title": "무찌마 일간 베스트",
    "date": "2026-01-07",
    "duration": "약 3분",
    "wordCount": 475,
    "lines": [
      {
        "speaker": "host",
        "speakerName": "Dr. AI",
        "content": "안녕하세요, 무찌마 일간 베스트 팟캐스트입니다.",
        "section": "opening",
        "order": 1
      },
      {
        "speaker": "guest",
        "speakerName": "Guest",
        "content": "네, 오늘도 뜨거운 이야기들이 많네요.",
        "section": "opening",
        "order": 2
      }
    ]
  }
}
```

---

## 5. 컴포넌트 설계

### 5.1 컴포넌트 계층

```
frontend/src/features/podcast-player/
├── index.ts                    # 배럴 export
├── types.ts                    # 타입 정의
├── data.ts                     # 정적 대본 데이터
├── PodcastPlayer.tsx           # 메인 컴포넌트
└── components/
    ├── ScriptDisplay.tsx       # 대본 표시
    ├── ScriptLine.tsx          # 개별 대사
    ├── PlayButton.tsx          # 재생 버튼
    ├── ProgressBar.tsx         # 진행률
    └── BestPostList.tsx        # 베스트 게시물 목록
```

### 5.2 컴포넌트 명세

| 컴포넌트 | Props | 설명 |
|----------|-------|------|
| PodcastPlayer | - | 메인 컨테이너, 상태 관리 |
| ScriptDisplay | `lines: ScriptLine[]`, `currentIndex: number` | 대본 표시 영역 |
| ScriptLine | `line: ScriptLine`, `isActive: boolean` | 개별 대사 렌더링 |
| PlayButton | `isPlaying: boolean`, `onToggle: () => void` | 재생/일시정지 버튼 |
| ProgressBar | `progress: number` (0~100) | 진행률 표시 |
| BestPostList | `posts: BestPost[]` | 베스트 게시물 요약 |

### 5.3 Props 인터페이스

```typescript
// ScriptDisplay Props
interface ScriptDisplayProps {
  lines: ScriptLine[];
  currentIndex: number;
}

// ScriptLine Props
interface ScriptLineProps {
  line: ScriptLine;
  isActive: boolean;
}

// PlayButton Props
interface PlayButtonProps {
  isPlaying: boolean;
  isLoading: boolean;
  onToggle: () => void;
}

// ProgressBar Props
interface ProgressBarProps {
  progress: number;  // 0~100
}

// BestPostList Props
interface BestPostListProps {
  posts: BestPost[];
}
```

### 5.4 상태 관리

```typescript
// PodcastPlayer 내부 상태
interface PlayerState {
  status: 'idle' | 'loading' | 'ready' | 'playing' | 'paused' | 'error';
  script: PodcastScript | null;
  bestPosts: BestPost[];
  currentLineIndex: number;
  progress: number;
}
```

---

## 6. 엔트리포인트 연결 ⚠️ 필수

### 6.1 Frontend 엔트리포인트

**파일 위치**: `frontend/src/main.tsx`

```typescript
// frontend/src/main.tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { PodcastPlayer } from './features/podcast-player'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <PodcastPlayer />
  </React.StrictMode>,
)
```

### 6.2 Backend 엔트리포인트

**파일 위치**: `backend/src/index.ts`

```typescript
// backend/src/index.ts
import express from 'express'
import podcastRouter from './routes/podcast'

const app = express()

// 미들웨어
app.use(express.json())

// 라우터 등록
app.use('/api/podcast', podcastRouter)

// 서버 시작
const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
```

### 6.3 Backend 라우터 구조

```typescript
// backend/src/routes/podcast/index.ts
import { Router } from 'express'
import { getBestPosts } from './best-posts'
import { getScript } from './script'

const router = Router()

router.get('/best-posts', getBestPosts)
router.get('/script', getScript)

export default router
```

### 6.4 검증 체크리스트

- [ ] `frontend/src/main.tsx`에서 PodcastPlayer import
- [ ] `frontend/src/main.tsx`에서 PodcastPlayer 렌더링
- [ ] `backend/src/index.ts`에서 podcastRouter 등록
- [ ] `npm run build` 성공 (Frontend)
- [ ] `npm run build` 성공 (Backend)
- [ ] `npm run dev` 후 브라우저에서 UI 확인
- [ ] API 응답 확인 (`/api/podcast/script`)

---

## 7. 스타일 가이드

### 7.1 TailwindCSS 클래스 규칙

| 용도 | 클래스 예시 |
|------|-------------|
| 레이아웃 | `max-w-2xl mx-auto`, `flex flex-col` |
| 간격 | `p-4`, `gap-4`, `space-y-4` |
| Host 대사 | `bg-blue-50 border-l-4 border-blue-500` |
| Guest 대사 | `bg-green-50 border-l-4 border-green-500` |
| 버튼 | `bg-blue-500 hover:bg-blue-600 text-white rounded-lg` |
| 반응형 | `sm:px-6`, `md:h-80`, `lg:max-w-3xl` |

### 7.2 색상 팔레트

| 요소 | 색상 | Tailwind |
|------|------|----------|
| Host 배경 | 연한 파랑 | `bg-blue-50` |
| Host 강조 | 파랑 | `border-blue-500` |
| Guest 배경 | 연한 초록 | `bg-green-50` |
| Guest 강조 | 초록 | `border-green-500` |
| Primary | 파랑 | `bg-blue-500` |
| 배경 | 회색 | `bg-gray-50` |

### 7.3 금지 사항

- [x] inline style 사용 금지 (`style={{ }}`)
- [x] CSS 파일 별도 생성 지양 (Tailwind 사용)
- [x] 하드코딩 색상값 금지 (`#3B82F6` → `blue-500`)

---

## 8. 에러 처리

| 상황 | UI 표시 | 코드 |
|------|---------|------|
| 로딩 중 | "대본을 불러오는 중..." + 스피너 | `status === 'loading'` |
| 에러 발생 | "대본을 불러올 수 없습니다." | `status === 'error'` |
| 빈 데이터 | "오늘의 베스트 게시물이 없습니다." | `bestPosts.length === 0` |

---

## 9. PII 마스킹 가이드

대본 생성 시 다음 항목은 마스킹 처리:

| 항목 | 원본 | 마스킹 |
|------|------|--------|
| 병원명 | "삼성서울병원" | "A 대학병원" |
| 의사명 | "김OO 교수" | "모 교수" |
| 환자 정보 | "80세 남성" | "고령 환자" |
| 금액 | "3억원" | "상당한 금액" |
| 지역 | "강남구" | "서울의 한 지역" |

---

## 10. 테스트 계획

| 테스트 유형 | 대상 | 도구 |
|-------------|------|------|
| Unit Test | 컴포넌트 렌더링 | Vitest, React Testing Library |
| Type Check | 타입 정합성 | `tsc --noEmit` |
| API Test | 엔드포인트 응답 | Vitest |

### 테스트 케이스

```typescript
// PodcastPlayer.test.tsx
describe('PodcastPlayer', () => {
  it('renders without crashing', () => {})
  it('shows loading state initially', () => {})
  it('displays script lines when loaded', () => {})
  it('toggles play/pause on button click', () => {})
})
```

---

**END OF SDD.MD**

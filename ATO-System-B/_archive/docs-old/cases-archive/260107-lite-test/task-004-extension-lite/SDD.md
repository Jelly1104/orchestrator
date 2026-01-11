# SDD.md - 무찌마 일간 베스트 팟캐스트

> **문서 버전**: 1.0.0
> **최종 업데이트**: 2026-01-08
> **상위 문서**: PRD - 무찌마 일간 베스트 팟캐스트

---

## 1. 개요

### 1.1 문서 정보

| 항목 | 내용 |
|------|------|
| 기능명 | 무찌마 일간 베스트 팟캐스트 플레이어 |
| 버전 | 1.0.0 |
| 작성일 | 2026-01-08 |
| 관련 PRD | 260107-lite-test/task-004-extension-lite/PRD.md |

### 1.2 기능 요약

24시간 내 무찌마 커뮤니티 인기 게시물을 분석하여 Host/Guest 2인 대화 형식의 팟캐스트 대본을 생성하고, 웹 플레이어 UI로 제공한다.

---

## 2. 기술 스택

| 영역 | 기술 |
|------|------|
| Frontend | React 18+, TypeScript, TailwindCSS |
| Backend | Node.js, Express |
| Database | MySQL (레거시 연동) |

---

## 3. 데이터 모델

### 3.1 레거시 테이블 매핑 (DOMAIN_SCHEMA.md 준수)

#### BOARD_MUZZIMA

| 논리명 | 물리 컬럼명 | 타입 | 설명 |
|--------|-------------|------|------|
| 게시글 ID | BOARD_IDX | INT | PK |
| 카테고리 | CTG_CODE | CHAR(6) | 카테고리 코드 |
| 작성자 ID | U_ID | VARCHAR(20) | FK |
| 제목 | TITLE | VARCHAR(200) | 게시글 제목 |
| 본문 | CONTENT | MEDIUMTEXT | 게시글 내용 |
| 조회수 | READ_CNT | INT | 조회수 |
| 추천수 | AGREE_CNT | INT | 추천수 |
| 등록일 | REG_DATE | DATETIME | 등록일시 |

#### COMMENT

| 논리명 | 물리 컬럼명 | 타입 | 설명 |
|--------|-------------|------|------|
| 댓글 ID | COMMENT_IDX | INT UNSIGNED | PK |
| 게시글 ID | BOARD_IDX | INT UNSIGNED | FK |
| 게시판 구분 | SVC_CODE | VARCHAR(10) | 서비스 코드 |
| 내용 | CONTENT | MEDIUMTEXT | 댓글 내용 |
| 등록일 | REG_DATE | DATETIME | 등록일시 |

### 3.2 API 응답 타입

```typescript
// 베스트 게시물 타입
interface BestPost {
  BOARD_IDX: number;
  TITLE: string;
  CONTENT: string;
  READ_CNT: number;
  AGREE_CNT: number;
  REG_DATE: string;
  comment_count: number;
  engagement_score: number;
}

// 팟캐스트 대본 타입
interface PodcastScript {
  date: string;
  duration: number; // 초 단위
  topics: Topic[];
}

interface Topic {
  id: number;
  title: string;         // 마스킹 처리된 제목
  host_comment: string;  // Host 대사
  guest_comment: string; // Guest 대사
}
```

### 3.3 API 엔드포인트

| API | Method | Endpoint | 설명 |
|-----|--------|----------|------|
| 베스트 목록 | GET | `/api/podcast/best` | 상위 5건 반환 |
| 대본 생성 | GET | `/api/podcast/script` | 팟캐스트 대본 |

#### GET /api/podcast/best

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "BOARD_IDX": 3676349,
      "TITLE": "의료분쟁 경험담...",
      "engagement_score": 513,
      "comment_count": 171
    }
  ]
}
```

#### GET /api/podcast/script

**Response:**
```json
{
  "success": true,
  "data": {
    "date": "2026-01-08",
    "duration": 180,
    "topics": [
      {
        "id": 1,
        "title": "의료 현장의 어려움",
        "host_comment": "첫 번째 주제는...",
        "guest_comment": "네, 정말 공감되는..."
      }
    ]
  }
}
```

---

## 4. 컴포넌트 설계

### 4.1 컴포넌트 계층

```
frontend/src/features/podcast-player/
├── index.ts                    # 배럴 export
├── types.ts                    # 타입 정의
├── PodcastPlayer.tsx           # 메인 컴포넌트
├── data.ts                     # Mock 데이터 (개발용)
└── components/
    ├── ScriptViewer.tsx        # 대본 표시
    ├── PlayControls.tsx        # 재생 컨트롤
    └── BestPostList.tsx        # 베스트 목록
```

### 4.2 Props 인터페이스

```typescript
// types.ts

// 베스트 게시물
export interface BestPost {
  BOARD_IDX: number;
  TITLE: string;
  engagement_score: number;
  comment_count: number;
}

// 토픽 (대본 단위)
export interface Topic {
  id: number;
  title: string;
  host_comment: string;
  guest_comment: string;
}

// 팟캐스트 대본
export interface PodcastScript {
  date: string;
  duration: number;
  topics: Topic[];
}

// 재생 상태
export type PlayState = 'LOADING' | 'READY' | 'PLAYING' | 'PAUSED' | 'ENDED' | 'ERROR';

// 컴포넌트 Props
export interface ScriptViewerProps {
  topics: Topic[];
  currentTopicIndex: number;
  isPlaying: boolean;
}

export interface PlayControlsProps {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  onPlayPause: () => void;
  onSeek: (time: number) => void;
  onPrev: () => void;
  onNext: () => void;
}

export interface BestPostListProps {
  posts: BestPost[];
  onPostClick: (index: number) => void;
}
```

### 4.3 컴포넌트 명세

| 컴포넌트 | Props | 설명 |
|----------|-------|------|
| PodcastPlayer | - | 메인 컨테이너, 상태 관리 |
| ScriptViewer | ScriptViewerProps | Host/Guest 대화 표시 |
| PlayControls | PlayControlsProps | 재생/일시정지/진행바 |
| BestPostList | BestPostListProps | 베스트 게시물 목록 |

---

## 5. 엔트리포인트 연결

### 5.1 연결 위치

| 유형 | 엔트리포인트 |
|------|-------------|
| Frontend | `frontend/src/main.tsx` |
| Backend | `backend/src/index.ts` (라우터 등록) |

### 5.2 Frontend 연결 방법

```typescript
// frontend/src/main.tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { PodcastPlayer } from './features/podcast-player'  // ← import 추가
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <PodcastPlayer />  {/* ← 렌더링 */}
  </React.StrictMode>,
)
```

### 5.3 Backend 연결 방법

```typescript
// backend/src/index.ts (또는 app.ts)
import express from 'express';
import podcastRouter from './routes/podcast';  // ← import 추가

const app = express();

app.use('/api/podcast', podcastRouter);  // ← 라우터 등록
```

### 5.4 검증 체크리스트

- [ ] `main.tsx`에서 PodcastPlayer import
- [ ] `main.tsx`에서 PodcastPlayer 렌더링
- [ ] `npm run build` 성공
- [ ] `npm run dev` 후 브라우저에서 확인

---

## 6. 스타일 가이드

### 6.1 TailwindCSS 클래스 규칙

| 용도 | 클래스 예시 |
|------|-------------|
| 레이아웃 | `flex`, `grid`, `gap-4` |
| 간격 | `p-4`, `m-2`, `space-y-4` |
| 색상 | `bg-gray-50`, `text-gray-900`, `bg-blue-500` |
| 반응형 | `sm:grid-cols-1`, `md:grid-cols-2`, `lg:flex-row` |
| 인터랙션 | `hover:bg-gray-100`, `active:scale-95` |

### 6.2 색상 팔레트

| 용도 | 색상 |
|------|------|
| 배경 | `bg-gray-50`, `bg-white` |
| 텍스트 | `text-gray-900`, `text-gray-600` |
| Host | `bg-blue-100`, `text-blue-800` |
| Guest | `bg-green-100`, `text-green-800` |
| 액션 | `bg-blue-500`, `hover:bg-blue-600` |

### 6.3 금지 사항

- [x] inline style 사용 금지 (`style={{ }}`)
- [x] CSS 파일 별도 생성 지양

---

## 7. PII 마스킹 규칙

### 7.1 마스킹 대상

| 패턴 | 정규식 | 대체값 |
|------|--------|--------|
| 이름 | `/[가-힣]{2,4}(?=선생님\|의사\|원장)/g` | `[이름]` |
| 병원명 | `/[가-힣]+(?:병원\|의원\|클리닉)/g` | `[병원명]` |
| 지역 | `/[가-힣]+(?:구\|시\|동\|읍\|면)/g` | `[지역]` |
| 전화번호 | `/\d{2,3}-\d{3,4}-\d{4}/g` | `[연락처]` |
| 금액 | `/\d+(?:억\|만원\|원)/g` | `[금액]` |

### 7.2 적용 시점

Backend API (`/api/podcast/script`)에서 대본 생성 시 마스킹 처리

---

## 8. 에러 처리

| 상황 | 처리 방법 |
|------|-----------|
| API 로딩 중 | `로딩 중...` 스피너 표시 |
| API 에러 | `데이터를 불러올 수 없습니다` 메시지 |
| 빈 데이터 | `오늘의 베스트 게시물이 없습니다` 메시지 |
| 재생 에러 | 자동 복구 시도 후 에러 메시지 |

---

## 9. 테스트 계획

| 테스트 유형 | 대상 | 도구 |
|-------------|------|------|
| Type Check | 타입 정합성 | `tsc --noEmit` |
| Build Test | 빌드 성공 | `npm run build` |
| 수동 테스트 | UI 렌더링 | 브라우저 확인 |

---

**END OF SDD.MD**

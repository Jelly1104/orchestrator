# SDD.md - 무찌마 일간 베스트 팟캐스트 기술 명세

> **문서 버전**: 1.0.0
> **최종 업데이트**: 2026-01-07
> **Case ID**: 260107-lite-test/task-002-extension
> **관련 PRD**: 무찌마 일간 베스트 팟캐스트

---

## 1. 개요

### 1.1 문서 정보

| 항목 | 내용 |
|------|------|
| 기능명 | 무찌마 일간 베스트 팟캐스트 대본 생성 |
| 버전 | 1.0.0 |
| 작성일 | 2026-01-07 |
| 관련 PRD | docs/cases/260107-lite-test/task-002-extension/PRD.md |

### 1.2 기능 요약

무찌마 커뮤니티의 24시간 내 인기 게시물 TOP 5를 분석하여, Host/Guest 2인 대화 형식의 3분 팟캐스트 대본을 자동 생성한다.

---

## 2. 기술 스택

| 영역 | 기술 |
|------|------|
| Frontend | React 18+, TypeScript, TailwindCSS |
| Backend | Node.js, Express (필요시) |
| Database | MySQL (레거시 연동) |
| 라이브러리 | mysql2 (DB 연결) |

---

## 3. 데이터 모델

### 3.1 입력 데이터 (analysis_report.md 기반)

```typescript
// types.ts
export interface BestPost {
  boardIdx: number;       // BOARD_IDX
  title: string;          // TITLE
  readCnt: number;        // READ_CNT
  agreeCnt: number;       // AGREE_CNT
  commentCount: number;   // 댓글 수
  popularityScore: number; // READ_CNT + AGREE_CNT
  summary: string;        // 핵심 내용 요약
  sentiment: string;      // 감성 (부정적/정보성/분석적)
  suitability: 'high' | 'medium' | 'low'; // 팟캐스트 적합성
}

export interface AnalysisData {
  posts: BestPost[];
  trendKeywords: string[];
  generatedAt: string;
}
```

### 3.2 출력 데이터 (Podcast_Script.md)

```typescript
export interface PodcastScript {
  episodeId: string;
  createdAt: string;
  totalDuration: number;  // 초 단위 (180초 = 3분)
  wordCount: number;      // 450~500
  sections: Section[];
}

export interface Section {
  id: string;
  type: 'intro' | 'main' | 'outro';
  title: string;
  duration: number;       // 초 단위
  dialogues: Dialogue[];
}

export interface Dialogue {
  speaker: 'host' | 'guest';
  text: string;
  startTime?: number;
}
```

### 3.3 레거시 테이블 매핑

| 논리명 | 물리 컬럼명 | 타입 | 설명 |
|--------|-------------|------|------|
| 게시물 ID | BOARD_IDX | INT | PK |
| 제목 | TITLE | VARCHAR(200) | 게시물 제목 |
| 내용 | CONTENT | MEDIUMTEXT | 게시물 본문 |
| 조회수 | READ_CNT | INT | 조회수 |
| 공감수 | AGREE_CNT | INT | 공감/좋아요 수 |
| 작성일 | REG_DATE | DATETIME | 게시 일시 |

> ⚠️ **주의**: `U_ID` 컬럼은 PII로 조회하지 않음 (비식별화)

---

## 4. 컴포넌트 설계

### 4.1 컴포넌트 계층

```
podcast-script/
├── index.ts                    # 배럴 export
├── types.ts                    # 타입 정의
├── PodcastScript.tsx           # 메인 컴포넌트
├── data.ts                     # 정적 데이터 (분석 결과)
└── components/
    ├── ScriptHeader.tsx        # 에피소드 헤더
    ├── SectionBlock.tsx        # 섹션 컨테이너
    ├── DialogueLine.tsx        # 발화자별 대사 라인
    └── TimeCode.tsx            # 타임코드 표시
```

### 4.2 Props 인터페이스

```typescript
// types.ts
export interface ScriptHeaderProps {
  episodeId: string;
  createdAt: string;
  totalDuration: number;
}

export interface SectionBlockProps {
  section: Section;
}

export interface DialogueLineProps {
  dialogue: Dialogue;
}

export interface TimeCodeProps {
  seconds: number;
}
```

### 4.3 컴포넌트 명세

| 컴포넌트 | Props | 설명 |
|----------|-------|------|
| PodcastScript | - | 메인 컨테이너, 전체 대본 렌더링 |
| ScriptHeader | episodeId, createdAt, totalDuration | 에피소드 정보 헤더 |
| SectionBlock | section | Intro/Main/Outro 섹션 블록 |
| DialogueLine | dialogue | Host/Guest 대사 라인 |
| TimeCode | seconds | "00:00" 형식 타임코드 |

### 4.4 핵심 함수 명세

```typescript
// 대본 생성 메인 함수
function generateScript(analysisData: AnalysisData): PodcastScript {
  // 1. 게시물 우선순위 정렬
  // 2. 섹션별 대화 생성
  // 3. PII 마스킹 적용
  // 4. 단어 수 검증 (450~500)
  return script;
}

// PII 마스킹 함수
function maskPII(text: string): string {
  // 환자 정보 마스킹
  // 의사 식별정보 마스킹
  // 비속어 순화
  return maskedText;
}

// 타임코드 포맷 함수
function formatTimeCode(seconds: number): string {
  const min = Math.floor(seconds / 60);
  const sec = seconds % 60;
  return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
}
```

---

## 5. 엔트리포인트 연결 ⚠️ 필수

> **v1.0.0**: 코드 구현 후 반드시 엔트리포인트에 연결해야 합니다.

### 5.1 연결 위치

```
frontend/src/main.tsx
```

### 5.2 연결 방법

```typescript
// frontend/src/main.tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { PodcastScript } from './features/podcast-script'  // ← import 추가

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <PodcastScript />  {/* ← 렌더링 */}
  </React.StrictMode>,
)
```

### 5.3 검증 체크리스트

- [ ] `main.tsx`에서 컴포넌트 import
- [ ] `main.tsx`에서 컴포넌트 렌더링
- [ ] `npm run build` 성공
- [ ] `npm run dev` 후 브라우저에서 확인

---

## 6. 스타일 가이드

### 6.1 TailwindCSS 클래스 규칙

| 용도 | 클래스 예시 |
|------|-------------|
| 컨테이너 | `max-w-4xl mx-auto p-6` |
| 섹션 블록 | `border rounded-lg p-4 mb-4` |
| Host 대사 | `bg-blue-50 text-blue-800 p-3 rounded` |
| Guest 대사 | `bg-green-50 text-green-800 p-3 rounded` |
| 타임코드 | `text-gray-500 text-sm font-mono` |

### 6.2 발화자별 색상

| 발화자 | 배경색 | 텍스트색 | 아이콘 |
|--------|--------|----------|--------|
| Host | `bg-blue-50` | `text-blue-800` | 🎤 |
| Guest | `bg-green-50` | `text-green-800` | 🎧 |

### 6.3 금지 사항

- [ ] inline style 사용 금지 (`style={{ }}`)
- [ ] CSS 파일 별도 생성 지양
- [ ] `any` 타입 사용 금지

---

## 7. PII 마스킹 로직 명세

### 7.1 마스킹 규칙

```typescript
const PII_PATTERNS = {
  // 환자 정보 패턴
  patientName: /환자\s*[가-힣]{2,4}/g,
  hospitalName: /[가-힣]+병원|[가-힣]+의원/g,

  // 비속어 패턴 (일부)
  profanity: /시[발빠]/g,

  // 실명 패턴
  realName: /[가-힣]{2,4}\s*선생님/g,
};

function maskPII(text: string): string {
  let result = text;

  // 환자 정보 → "환자분"
  result = result.replace(PII_PATTERNS.patientName, '환자분');

  // 병원명 → "한 병원"
  result = result.replace(PII_PATTERNS.hospitalName, '한 병원');

  // 비속어 → 순화
  result = result.replace(PII_PATTERNS.profanity, '답답할 때');

  // 실명 → "한 선생님"
  result = result.replace(PII_PATTERNS.realName, '한 선생님');

  return result;
}
```

### 7.2 마스킹 적용 시점

| 시점 | 적용 여부 |
|------|-----------|
| DB 조회 결과 | ❌ (원본 유지) |
| 분석 리포트 | ⚠️ (부분 적용) |
| 대본 생성 시 | ✅ (전체 적용) |
| 최종 출력 | ✅ (검증 필수) |

---

## 8. 에러 처리

| 상황 | 처리 방법 |
|------|-----------|
| 분석 결과 없음 | "분석 결과를 불러올 수 없습니다" 표시 |
| 게시물 5건 미만 | 있는 게시물만으로 대본 생성 |
| 단어 수 미달/초과 | 경고 표시 후 조정 |
| PII 탐지 실패 | 수동 검토 요청 알림 |

---

## 9. 테스트 계획

| 테스트 유형 | 대상 | 도구 |
|-------------|------|------|
| Unit Test | 컴포넌트 렌더링, maskPII 함수 | Vitest, RTL |
| Type Check | 타입 정합성 | `tsc --noEmit` |
| Integration | 전체 대본 생성 플로우 | Vitest |

### 9.1 필수 테스트 케이스

```typescript
describe('maskPII', () => {
  it('환자 정보를 마스킹해야 한다', () => {
    expect(maskPII('환자 김철수가')).toBe('환자분이');
  });

  it('비속어를 순화해야 한다', () => {
    expect(maskPII('시발')).not.toContain('시발');
  });
});

describe('generateScript', () => {
  it('450~500 단어 범위를 충족해야 한다', () => {
    const script = generateScript(mockData);
    expect(script.wordCount).toBeGreaterThanOrEqual(450);
    expect(script.wordCount).toBeLessThanOrEqual(500);
  });
});
```

---

## 10. 정적 데이터 예시 (data.ts)

```typescript
// frontend/src/features/podcast-script/data.ts
import { AnalysisData } from './types';

export const ANALYSIS_DATA: AnalysisData = {
  posts: [
    {
      boardIdx: 3679154,
      title: "한국 떠나고싶다",
      readCnt: 0,
      agreeCnt: 19,
      commentCount: 8,
      popularityScore: 19,
      summary: "의사 번아웃, 환자 스트레스, 해외 이민 고민",
      sentiment: "부정적/고백적",
      suitability: "high"
    },
    {
      boardIdx: 3679134,
      title: "손종원이 누구냐고?",
      readCnt: 0,
      agreeCnt: 13,
      commentCount: 12,
      popularityScore: 13,
      summary: "미슐랭 스타쉐프 손종원 소개",
      sentiment: "정보성/감탄",
      suitability: "medium"
    },
    {
      boardIdx: 3679128,
      title: "직원들 꼴보기 싫다",
      readCnt: 0,
      agreeCnt: 12,
      commentCount: 9,
      popularityScore: 12,
      summary: "병원 직원 관리 스트레스, 호의의 권리화",
      sentiment: "분노/하소연",
      suitability: "high"
    },
    // ... 추가 게시물
  ],
  trendKeywords: ["번아웃", "이민", "직원 관리", "세대론"],
  generatedAt: "2026-01-07T00:00:00Z"
};
```

---

**END OF SDD.MD**

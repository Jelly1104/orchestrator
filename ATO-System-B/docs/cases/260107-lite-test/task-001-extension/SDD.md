# SDD.md - Skill Dashboard Lite

> **문서 버전**: 1.0.0
> **최종 업데이트**: 2026-01-06
> **관련 HANDOFF**: docs/cases/260106-lite-test/HANDOFF.md

---

## 1. 개요

### 1.1 문서 정보

| 항목 | 내용 |
|------|------|
| 기능명 | Skill Dashboard Lite |
| 버전 | 1.0.0 |
| 작성일 | 2026-01-06 |
| Case ID | 260106-lite-test |

### 1.2 기능 요약

ATO 시스템의 7개 Skill(leader, designer, coder, reviewer, imleader, query, profiler)을 카드 형식으로 표시하는 React 대시보드. 각 Skill의 이름, 버전, 상태(active/inactive), 설명을 시각화한다.

---

## 2. 기술 스택

| 영역 | 기술 |
|------|------|
| Frontend | React 18+, TypeScript (strict mode) |
| Styling | TailwindCSS (inline style 금지) |
| Build | Vite |
| Pattern | FSD (Feature-Sliced Design) |

---

## 3. 데이터 모델

### 3.1 Static Data (정적 데이터)

```typescript
// types.ts
export type SkillStatus = 'active' | 'inactive';

export interface Skill {
  name: string;
  version: string;
  status: SkillStatus;
  description: string;
}

export const SKILLS_DATA: Skill[] = [
  { name: 'leader', version: '1.3.0', status: 'active', description: 'PRD 분석, HANDOFF 생성' },
  { name: 'designer', version: '2.4.0', status: 'active', description: 'IA/Wireframe/SDD 생성' },
  { name: 'coder', version: '1.5.0', status: 'active', description: 'SDD 기반 코드 구현' },
  { name: 'reviewer', version: '1.4.0', status: 'active', description: '품질 검증' },
  { name: 'imleader', version: '1.1.0', status: 'active', description: '구현 검증' },
  { name: 'query', version: '1.2.0', status: 'active', description: 'SQL 쿼리 생성' },
  { name: 'profiler', version: '1.0.0', status: 'inactive', description: '프로필 분석' },
];
```

### 3.2 API 연동

N/A - 정적 데이터 기반 (API 연동 없음)

### 3.3 레거시 테이블 매핑

N/A - DB 연동 없음

---

## 4. 컴포넌트 설계

### 4.1 컴포넌트 계층

```
frontend/src/features/skills-dashboard-lite/
├── index.ts                      # 배럴 export
├── types.ts                      # Skill, SkillStatus 타입 정의
├── SkillsDashboardLite.tsx       # 메인 컴포넌트
└── components/
    └── SkillCard.tsx             # 개별 카드 컴포넌트
```

### 4.2 Props 인터페이스

```typescript
// types.ts
export type SkillStatus = 'active' | 'inactive';

export interface Skill {
  name: string;
  version: string;
  status: SkillStatus;
  description: string;
}

export interface SkillCardProps {
  skill: Skill;
}

export interface StatusBadgeProps {
  status: SkillStatus;
}
```

### 4.3 컴포넌트 명세

| 컴포넌트 | Props | 설명 |
|----------|-------|------|
| SkillsDashboardLite | - | 메인 컨테이너 (Header + Grid + Footer) |
| SkillCard | Skill | 개별 Skill 카드 |
| StatusBadge | SkillStatus | 상태 뱃지 (SkillCard 내장) |

---

## 5. 엔트리포인트 연결 (필수)

### 5.1 연결 위치

```
frontend/src/main.tsx
```

### 5.2 연결 방법

```typescript
// frontend/src/main.tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { SkillsDashboardLite } from './features/skills-dashboard-lite'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <SkillsDashboardLite />
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

| 용도 | 클래스 |
|------|--------|
| 컨테이너 | `min-h-screen bg-gray-50 p-8` |
| 헤더 | `flex justify-between items-center mb-8` |
| Grid | `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4` |
| 카드 | `bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow` |
| Active dot | `w-2 h-2 rounded-full bg-green-500` |
| Inactive dot | `w-2 h-2 rounded-full bg-gray-400` |
| 버튼 | `px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600` |
| Footer | `mt-8 p-4 bg-gray-100 rounded-lg text-center` |

### 6.2 색상 팔레트

| 용도 | 색상 | TailwindCSS |
|------|------|-------------|
| 배경 | #f9fafb | `bg-gray-50` |
| 카드 배경 | #ffffff | `bg-white` |
| Active 상태 | #22c55e | `bg-green-500` |
| Inactive 상태 | #9ca3af | `bg-gray-400` |
| 텍스트 (기본) | #111827 | `text-gray-900` |
| 텍스트 (보조) | #6b7280 | `text-gray-500` |

### 6.3 금지 사항

- [x] inline style 사용 금지 (`style={{ }}`)
- [x] CSS 파일 별도 생성 지양 (TailwindCSS 클래스 사용)

---

## 7. 에러 처리

| 상황 | 처리 방법 |
|------|-----------|
| 데이터 없음 | "등록된 Skill이 없습니다" 표시 |

> **참고**: 정적 데이터이므로 로딩/에러 상태는 불필요

---

## 8. 파일 생성 목록

| 파일 | 역할 |
|------|------|
| `frontend/src/features/skills-dashboard-lite/index.ts` | 배럴 export |
| `frontend/src/features/skills-dashboard-lite/types.ts` | 타입 정의 + SKILLS_DATA |
| `frontend/src/features/skills-dashboard-lite/SkillsDashboardLite.tsx` | 메인 컴포넌트 |
| `frontend/src/features/skills-dashboard-lite/components/SkillCard.tsx` | 카드 컴포넌트 |
| `frontend/src/main.tsx` | 엔트리포인트 수정 |

---

**END OF SDD.md**

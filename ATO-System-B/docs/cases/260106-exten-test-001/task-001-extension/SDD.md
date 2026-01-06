# SDD.md - Skills Dashboard 기술 명세

> **문서 버전**: 1.0.0
> **최종 업데이트**: 2026-01-06
> **상위 문서**: PRD - Extension Skills 테스트 대시보드, IA.md, Wireframe.md

---

## 1. 개요

### 1.1 목적

Skills Dashboard UI의 기술 명세를 정의합니다. Coder는 이 문서를 기반으로 React 컴포넌트를 구현합니다.

### 1.2 기술 스택

| 항목 | 기술 | 버전 |
|------|------|------|
| Framework | React | 18+ |
| Language | TypeScript | 5.0+ |
| Styling | TailwindCSS | 3.0+ |
| Build | Vite | 5.0+ |

### 1.3 산출물

| 파일 | 경로 | 설명 |
|------|------|------|
| types.ts | `frontend/src/features/skills-dashboard/` | 타입 정의 |
| SkillCard.tsx | `frontend/src/features/skills-dashboard/components/` | 카드 컴포넌트 |
| SkillsDashboard.tsx | `frontend/src/features/skills-dashboard/` | 메인 대시보드 |

---

## 2. 타입 정의

### 2.1 types.ts

```typescript
/**
 * Skill 상태 타입
 */
export type SkillStatus = "active" | "inactive";

/**
 * Skill 인터페이스
 */
export interface Skill {
  /** Skill 고유 ID */
  id: string;
  /** Skill 이름 (표시용) */
  name: string;
  /** 버전 정보 (v{major}.{minor}.{patch}) */
  version: string;
  /** 활성화 상태 */
  status: SkillStatus;
  /** 설명 텍스트 */
  description: string;
}

/**
 * SkillCard 컴포넌트 Props
 */
export interface SkillCardProps {
  skill: Skill;
}

/**
 * StatusBadge 컴포넌트 Props
 */
export interface StatusBadgeProps {
  status: SkillStatus;
}
```

---

## 3. 컴포넌트 명세

### 3.1 SkillsDashboard

메인 대시보드 컴포넌트. Skills 목록을 그리드 형태로 렌더링합니다.

#### 파일 정보

| 항목 | 값 |
|------|-----|
| 파일명 | `SkillsDashboard.tsx` |
| 경로 | `frontend/src/features/skills-dashboard/` |
| 타입 | Page Component |

#### Props

없음 (내부에서 Static Data 사용)

#### 구현 요구사항

```typescript
/**
 * SkillsDashboard 컴포넌트
 *
 * @description 5개 Skills의 현황을 카드 그리드로 표시
 * @returns {JSX.Element} 대시보드 UI
 */
export const SkillsDashboard: React.FC = () => {
  // 1. Static Data 정의 (SKILLS_DATA)
  // 2. 반응형 그리드 레이아웃
  // 3. SkillCard 컴포넌트 매핑
};
```

#### Static Data

```typescript
const SKILLS_DATA: Skill[] = [
  {
    id: "query",
    name: "Query",
    version: "1.3.0",
    status: "active",
    description: "SQL 쿼리 생성 및 데이터 분석"
  },
  {
    id: "profiler",
    name: "Profiler",
    version: "1.3.0",
    status: "active",
    description: "회원 프로필 분석"
  },
  {
    id: "designer",
    name: "Designer",
    version: "2.3.0",
    status: "active",
    description: "IA/Wireframe/SDD 설계 문서 생성"
  },
  {
    id: "coder",
    name: "Coder",
    version: "1.4.0",
    status: "active",
    description: "SDD 기반 코드 구현"
  },
  {
    id: "reviewer",
    name: "Reviewer",
    version: "1.3.0",
    status: "active",
    description: "산출물 품질 검증"
  }
];
```

#### 레이아웃 구조

```
<main>
  <header>
    <h1>Skills Dashboard</h1>
  </header>
  <section className="grid">
    {skills.map(skill => <SkillCard />)}
  </section>
</main>
```

#### TailwindCSS 클래스

| 요소 | 클래스 |
|------|--------|
| 컨테이너 | `min-h-screen bg-gray-50 p-6` |
| 헤더 | `mb-8` |
| 타이틀 | `text-2xl font-bold text-gray-900` |
| 그리드 | `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6` |

---

### 3.2 SkillCard

개별 Skill 정보를 표시하는 카드 컴포넌트.

#### 파일 정보

| 항목 | 값 |
|------|-----|
| 파일명 | `SkillCard.tsx` |
| 경로 | `frontend/src/features/skills-dashboard/components/` |
| 타입 | Presentational Component |

#### Props

| Prop | Type | Required | Default | 설명 |
|------|------|----------|---------|------|
| `skill` | `Skill` | Yes | - | Skill 데이터 객체 |

#### 구현 요구사항

```typescript
/**
 * SkillCard 컴포넌트
 *
 * @description 개별 Skill 정보를 카드 형태로 표시
 * @param {SkillCardProps} props - Skill 데이터
 * @returns {JSX.Element} 카드 UI
 */
export const SkillCard: React.FC<SkillCardProps> = ({ skill }) => {
  // 1. 카드 레이아웃 (border, shadow, padding)
  // 2. Header: name + StatusBadge
  // 3. Body: version
  // 4. Footer: description
};
```

#### 레이아웃 구조

```
<article>
  <header>
    <h3>{name}</h3>
    <StatusBadge status={status} />
  </header>
  <div className="body">
    <span className="version">v{version}</span>
  </div>
  <footer>
    <p>{description}</p>
  </footer>
</article>
```

#### TailwindCSS 클래스

| 요소 | 클래스 |
|------|--------|
| 카드 컨테이너 | `bg-white rounded-lg border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow` |
| 헤더 | `flex items-center justify-between mb-3` |
| 이름 | `text-lg font-semibold text-gray-900` |
| 버전 | `text-xl font-mono text-gray-700 mb-3` |
| 설명 | `text-sm text-gray-600 line-clamp-2` |

---

### 3.3 StatusBadge

상태를 표시하는 뱃지 컴포넌트.

#### 파일 정보

| 항목 | 값 |
|------|-----|
| 파일명 | `SkillCard.tsx` 내부 또는 별도 분리 |
| 타입 | Presentational Component |

#### Props

| Prop | Type | Required | Default | 설명 |
|------|------|----------|---------|------|
| `status` | `SkillStatus` | Yes | - | 상태 값 |

#### 스타일 매핑

```typescript
const statusStyles: Record<SkillStatus, string> = {
  active: "bg-green-100 text-green-800",
  inactive: "bg-gray-100 text-gray-500"
};
```

#### 레이아웃

```
<span className="badge">
  <span className="dot">●</span>
  <span className="label">{status}</span>
</span>
```

#### TailwindCSS 클래스

| 요소 | 클래스 |
|------|--------|
| 뱃지 컨테이너 | `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium` |
| Active | `bg-green-100 text-green-800` |
| Inactive | `bg-gray-100 text-gray-500` |

---

## 4. 폴더 구조

```
frontend/src/features/skills-dashboard/
├── index.ts                    # 모듈 export
├── types.ts                    # 타입 정의
├── SkillsDashboard.tsx         # 메인 컴포넌트
└── components/
    └── SkillCard.tsx           # 카드 컴포넌트
```

### 4.1 index.ts (모듈 Export)

```typescript
export { SkillsDashboard } from "./SkillsDashboard";
export { SkillCard } from "./components/SkillCard";
export type { Skill, SkillStatus, SkillCardProps } from "./types";
```

---

## 5. 품질 요구사항

### 5.1 TypeScript

| 항목 | 요구사항 |
|------|----------|
| strict 모드 | 필수 |
| any 타입 | 금지 |
| 타입 추론 | Props는 명시적 타입 정의 |
| as 캐스팅 | 지양 (타입 가드 사용) |

### 5.2 컴포넌트

| 항목 | 요구사항 |
|------|----------|
| 함수 컴포넌트 | 필수 (Class 컴포넌트 금지) |
| React.FC | Props 타입과 함께 사용 |
| 불변성 | Props 직접 수정 금지 |
| Key | 리스트 렌더링 시 고유 key 필수 |

### 5.3 스타일

| 항목 | 요구사항 |
|------|----------|
| TailwindCSS | 필수 |
| inline style | 금지 |
| CSS 파일 | 지양 (Tailwind 클래스 사용) |

---

## 6. 검증 체크리스트

### 6.1 Coder 구현 체크리스트

- [ ] `types.ts` - Skill, SkillStatus, SkillCardProps 정의
- [ ] `SkillCard.tsx` - 카드 컴포넌트 구현
- [ ] `SkillsDashboard.tsx` - 메인 대시보드 구현
- [ ] `index.ts` - 모듈 export

### 6.2 품질 체크리스트

- [ ] TypeScript 컴파일 에러 없음
- [ ] any 타입 사용 없음
- [ ] TailwindCSS 클래스만 사용 (inline style 없음)
- [ ] 반응형 그리드 동작 (1열 → 2열 → 3열)
- [ ] 5개 카드 정상 렌더링
- [ ] StatusBadge 색상 정확 (active=녹색, inactive=회색)

---

**END OF SDD.MD**

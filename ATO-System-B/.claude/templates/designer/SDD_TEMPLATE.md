# SDD Template v1.0

> **템플릿 버전**: 1.0.0
> **최종 업데이트**: 2026-01-06
> **목적**: Software Design Document 작성 표준 템플릿

---

## 1. 개요

### 1.1 문서 정보

| 항목 | 내용 |
|------|------|
| 기능명 | {feature_name} |
| 버전 | 1.0.0 |
| 작성일 | {date} |
| 관련 PRD | {prd_reference} |

### 1.2 기능 요약

{기능에 대한 간단한 설명}

---

## 2. 기술 스택

| 영역 | 기술 |
|------|------|
| Frontend | React 18+, TypeScript, TailwindCSS |
| Backend | Node.js, Express (필요시) |
| Database | MySQL (레거시 연동, 필요시) |

---

## 3. 데이터 모델

### 3.1 Static Data (정적 데이터)

```typescript
// 하드코딩 데이터 예시
const DATA: Type[] = [
  { id: "1", name: "Item 1", ... },
];
```

### 3.2 API 연동 (필요시)

| API | Method | Endpoint | 설명 |
|-----|--------|----------|------|
| 목록 조회 | GET | /api/v1/{resource} | 리스트 반환 |

### 3.3 레거시 테이블 매핑 (필요시)

| 논리명 | 물리 컬럼명 | 타입 | 설명 |
|--------|-------------|------|------|
| 사용자 ID | U_ID | VARCHAR(14) | PK |

---

## 4. 컴포넌트 설계

### 4.1 컴포넌트 계층

```
{FeatureName}/
├── index.ts              # 배럴 export
├── types.ts              # 타입 정의
├── {FeatureName}.tsx     # 메인 컴포넌트
└── components/
    └── {SubComponent}.tsx
```

### 4.2 Props 인터페이스

```typescript
// types.ts
export interface {TypeName} {
  id: string;
  name: string;
  // ...
}

export interface {ComponentName}Props {
  data: {TypeName};
}
```

### 4.3 컴포넌트 명세

| 컴포넌트 | Props | 설명 |
|----------|-------|------|
| {MainComponent} | - | 메인 컨테이너 |
| {SubComponent} | {TypeName} | 개별 아이템 |

---

## 5. 엔트리포인트 연결 ⚠️ 필수

> **v1.0.0 추가**: 코드 구현 후 반드시 엔트리포인트에 연결해야 합니다.

### 5.1 연결 위치

```
frontend/src/main.tsx
```

### 5.2 연결 방법

```typescript
// frontend/src/main.tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { {FeatureName} } from './features/{feature-name}'  // ← import 추가

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <{FeatureName} />  {/* ← 렌더링 */}
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
| 레이아웃 | `grid`, `flex`, `gap-{n}` |
| 간격 | `p-{n}`, `m-{n}` |
| 색상 | `bg-gray-50`, `text-gray-900` |
| 반응형 | `sm:`, `md:`, `lg:` |

### 6.2 금지 사항

- [ ] inline style 사용 금지 (`style={{ }}`)
- [ ] CSS 파일 별도 생성 지양

---

## 7. 에러 처리

| 상황 | 처리 방법 |
|------|-----------|
| 로딩 중 | `로딩 중...` 텍스트 또는 스피너 |
| 에러 발생 | 에러 메시지 표시 |
| 빈 데이터 | `데이터가 없습니다` 표시 |

---

## 8. 테스트 계획 (선택)

| 테스트 유형 | 대상 | 도구 |
|-------------|------|------|
| Unit Test | 컴포넌트 렌더링 | Jest, RTL |
| Type Check | 타입 정합성 | `tsc --noEmit` |

---

## 작성 가이드

1. `{placeholder}` 형식은 실제 값으로 치환
2. 필요없는 섹션은 "N/A" 또는 삭제
3. **섹션 5 (엔트리포인트 연결)은 필수**로 작성
4. Coder Skill이 이 문서를 기반으로 구현

---

**END OF SDD_TEMPLATE.md**

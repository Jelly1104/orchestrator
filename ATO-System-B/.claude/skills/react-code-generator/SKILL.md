---
name: react-code-generator
description: Wireframe 문서(ASCII 레이아웃)를 React 컴포넌트 코드로 변환. 트리거 키워드: "React 코드 생성", "React로 변환", "컴포넌트 생성", "Wireframe → React". Wireframe.md의 ASCII 레이아웃, 컴포넌트 정의, 상호작용 정의를 분석하여 실행 가능한 React 코드를 생성한다.
---

# React Code Generator

Wireframe 문서를 분석하여 React 컴포넌트 코드를 생성한다.

## 입력 요구사항

Wireframe 문서에서 다음 정보를 추출:

1. **ASCII 레이아웃** → 컴포넌트 구조 및 배치
2. **컴포넌트 정의 테이블** → Props 인터페이스
3. **상호작용 정의** → 이벤트 핸들러
4. **데이터 바인딩** → Mock 데이터 구조

## 출력 규격

### 파일 구조

```
output/
├── App.jsx              # 메인 컴포넌트 (단일 파일)
└── data.js              # Mock 데이터 (선택)
```

### 기술 스택

- React 18+ (Functional Components, Hooks)
- Tailwind CSS (Core utility classes only)
- Recharts (차트가 필요한 경우)
- Lucide React (아이콘)

### 코드 컨벤션

```jsx
// 1. 단일 파일 구조 (App.jsx에 모든 컴포넌트 포함)
// 2. Mock 데이터는 파일 상단에 const로 정의
// 3. 컴포넌트는 Wireframe의 컴포넌트 ID와 매핑

const kpiData = { /* Wireframe 데이터 바인딩 참조 */ };

function KpiCard({ title, value, trend }) {
  return (/* Tailwind 스타일링 */);
}

export default function App() {
  const [state, setState] = useState(/* 초기값 */);
  return (/* 레이아웃 */);
}
```

## 변환 규칙

### ASCII → Tailwind 매핑

| ASCII 패턴 | Tailwind 클래스 |
|-----------|----------------|
| `┌─────┐` 박스 | `rounded-2xl border bg-white p-5 shadow-sm` |
| 가로 3열 배치 | `grid grid-cols-1 md:grid-cols-3 gap-4` |
| 가로 2열 배치 | `grid grid-cols-1 md:grid-cols-2 gap-4` |
| 세로 스택 | `space-y-4` or `flex flex-col gap-4` |
| `▲ +3.2%` 상승 | `text-emerald-700 bg-emerald-50` |
| `▼ -1.5%` 하락 | `text-rose-700 bg-rose-50` |
| `████░░░` 프로그레스 | `<div className="h-2 rounded-full bg-slate-100">` |

### 컴포넌트 타입 → React 구현

| Wireframe 타입 | React 구현 |
|---------------|-----------|
| StatCard | KPI 카드 컴포넌트 |
| HorizontalBarChart | Tailwind 프로그레스 바 |
| PieChart | Recharts `<PieChart>` |
| MultiLineChart | Recharts `<LineChart>` |
| DataTable | `<table>` + useState (검색, 정렬) |
| FilterBar | `<select>` + `<button>` 그룹 |
| DateRangePicker | `<input type="date">` 쌍 |
| CheckboxGroup | `<input type="checkbox">` 배열 |
| RadioGroup | `<input type="radio">` 배열 |

### 상호작용 → 이벤트 핸들러

| Wireframe 액션 | React 구현 |
|---------------|-----------|
| `openModal()` | `useState` + 조건부 렌더링 |
| `openPanel()` | `useState` + 슬라이드 패널 |
| `applyFilters()` | `useState` + 필터 상태 |
| `sortBy()` | `useMemo` + 정렬 로직 |
| `setPage()` | `useState` + 페이지네이션 |
| `toggleOption()` | `useState` + 체크박스 상태 |

## 생성 프로세스

1. **분석**: Wireframe의 화면 목록, 컴포넌트 정의 테이블 파싱
2. **데이터 구조화**: 데이터 바인딩 테이블 → Mock 데이터 객체 생성
3. **컴포넌트 생성**: ASCII 레이아웃 → React 컴포넌트 트리
4. **상호작용 연결**: 상호작용 정의 → useState/이벤트 핸들러
5. **스타일링**: Tailwind 클래스 적용

## Skill Report (필수)

⚠️ **반드시 출력 마지막에 아래 형식으로 Skill Report를 포함해야 한다.**
이 리포트가 없으면 Skill이 적용되지 않은 것으로 간주한다.

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 [React Code Generator Report]
🔧 사용된 Skill: react-code-generator v1.0
📥 입력: {wireframe_filename}
📤 출력: {output_filename}.jsx
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ 컴포넌트: {n}개 생성
✅ 이벤트 핸들러: {n}개 연결
✅ Mock 데이터: {n}개 객체
✅ Tailwind 클래스: 적용됨
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**필수 포함 항목:**
- `🔧 사용된 Skill`: 반드시 `react-code-generator` 명시
- `📥 입력`: 원본 Wireframe 파일명
- `📤 출력`: 생성된 React 파일명

## 제약사항

- localStorage/sessionStorage 사용 금지 (React state만 사용)
- 외부 API 호출 금지 (Mock 데이터만 사용)
- CSS 파일 분리 금지 (Tailwind inline만 사용)
- TypeScript 타입 선언 생략 (JSX만 출력)

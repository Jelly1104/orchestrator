---
name: react-preview
description: React 코드를 브라우저에서 렌더링하여 미리보기. 트리거 키워드: "미리보기", "렌더링", "브라우저에서 보기", "웹앱 실행", "Preview", "화면에 띄워". 생성된 React 컴포넌트를 실제 웹 브라우저에서 확인할 수 있도록 환경을 구성하고 실행한다.
---

# React Preview

생성된 React 코드를 브라우저에서 렌더링한다.

## 실행 환경 선택

### 환경 A: Claude.ai 아티팩트 (즉시 렌더링)

Claude.ai 대화창에서 바로 렌더링. 별도 설정 불필요.

**지원 라이브러리:**
- React 18 (useState, useEffect, useMemo 등)
- Recharts (LineChart, PieChart, BarChart 등)
- Tailwind CSS (Core utilities)
- Lucide React (아이콘)
- D3, Three.js, Chart.js, Tone.js

**제약사항:**
- localStorage/sessionStorage 사용 불가
- 외부 API fetch 불가 (Anthropic API 제외)
- 파일 업로드/다운로드 제한적

**출력 방식:**
```
파일 생성: /mnt/user-data/outputs/{name}.jsx
→ present_files 도구로 렌더링
```

### 환경 B: VSCode + Vite (로컬 개발)

로컬 개발 서버에서 실행. Hot reload 지원.

**프로젝트 초기화:**
```bash
# 1. Vite 프로젝트 생성
npm create vite@latest preview-app -- --template react
cd preview-app

# 2. 의존성 설치
npm install
npm install recharts lucide-react

# 3. Tailwind 설정
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

**tailwind.config.js:**
```javascript
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: { extend: {} },
  plugins: [],
}
```

**src/index.css:**
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

**실행:**
```bash
npm run dev
# → http://localhost:5173
```

### 환경 C: Claude Code CLI (터미널)

Claude Code에서 직접 실행.

```bash
# 프로젝트 디렉토리에서
claude "이 React 코드를 실행해줘" --file App.jsx
```

## 코드 검증 체크리스트

렌더링 전 확인사항:

| 항목 | 확인 |
|-----|-----|
| `export default function App()` 존재 | ☐ |
| localStorage/sessionStorage 미사용 | ☐ |
| 외부 API fetch 미사용 | ☐ |
| import 경로 올바름 | ☐ |
| Tailwind 클래스만 사용 (커스텀 CSS 없음) | ☐ |

## 일반적인 오류 해결

### 오류: "localStorage is not defined"

```jsx
// ❌ 잘못된 코드
const [data, setData] = useState(
  JSON.parse(localStorage.getItem('data'))
);

// ✅ 수정된 코드
const [data, setData] = useState(initialData);
```

### 오류: "fetch is not allowed"

```jsx
// ❌ 잘못된 코드
useEffect(() => {
  fetch('/api/data').then(r => r.json()).then(setData);
}, []);

// ✅ 수정된 코드
const mockData = { /* ... */ };
const [data, setData] = useState(mockData);
```

### 오류: Recharts 렌더링 안됨

```jsx
// ❌ 높이 없음
<ResponsiveContainer>
  <LineChart data={data}>

// ✅ 높이 명시
<div className="h-64">
  <ResponsiveContainer width="100%" height="100%">
    <LineChart data={data}>
```

### 오류: Tailwind 스타일 미적용

```jsx
// ❌ 커스텀 CSS
<div style={{ backgroundColor: '#0f172a' }}>

// ✅ Tailwind 클래스
<div className="bg-slate-900">
```

## Skill Report (필수)

⚠️ **반드시 출력 마지막에 아래 형식으로 Skill Report를 포함해야 한다.**
이 리포트가 없으면 Skill이 적용되지 않은 것으로 간주한다.

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 [React Preview Report]
🔧 사용된 Skill: react-preview v1.0
📥 입력: {react_filename}.jsx
🖥️ 환경: {Claude.ai 아티팩트 | VSCode + Vite | Claude Code}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ 렌더링: 성공
✅ 컴포넌트: {n}개 렌더링됨
✅ 검증 통과: localStorage 미사용, 외부 API 미사용
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**필수 포함 항목:**
- `🔧 사용된 Skill`: 반드시 `react-preview` 명시
- `📥 입력`: 렌더링한 React 파일명
- `🖥️ 환경`: 실행 환경 명시

## 환경별 권장 사용 시나리오

| 시나리오 | 권장 환경 |
|---------|----------|
| 빠른 프로토타입 확인 | Claude.ai 아티팩트 |
| 반복적 수정/테스트 | VSCode + Vite |
| CI/CD 통합 | Claude Code CLI |
| 팀 공유/데모 | VSCode + Vite → Deploy |

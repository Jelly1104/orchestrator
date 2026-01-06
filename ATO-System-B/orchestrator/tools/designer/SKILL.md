---
name: designer
description: IA/Wireframe/SDD 설계 문서 생성 및 시각화. HANDOFF/PRD 기반으로 정보구조, 화면설계, 기술명세를 작성한다. v2.4.0에서 SDD 엔트리포인트 연결 섹션 필수화.
version: 2.4.0
status: active
updated: 2026-01-06
implementation: orchestrator/skills/designer/index.js
---

# Designer Skill (Orchestrator용)

설계 문서(IA/Wireframe/SDD) 생성 및 시각화 전문가.

## 핵심 역할

| 산출물 | 설명 |
|--------|------|
| **IA.md** | 정보 구조 (화면 계층, 네비게이션) |
| **Wireframe.md** | 화면 설계 (ASCII 레이아웃, 컴포넌트) |
| **SDD.md** | 기술 명세 (API, 데이터 모델) |
| **HTML Preview** | 인터랙티브 시각화 (옵션) |

## 역할 분담

| Role | 역할 | 산출물 |
|------|------|--------|
| **LeaderAgent** | 설계 문서 초안 | Markdown + Mermaid |
| **Designer Skill** | 시각화 고도화 | HTML + SVG |

## 제약사항

| 제약 | 설명 |
|------|------|
| 스키마 준수 | 기존 테이블 활용 우선, 신규 생성 지양 |
| 템플릿 준수 | IA_TEMPLATE.md, WF_TEMPLATE.md, SDD_TEMPLATE.md 형식 |
| 레거시 매핑 | SDD에 실제 컬럼명 매핑 필수 |
| 원본 보존 | Markdown 원본 수정 금지 (별도 HTML 생성) |
| **엔트리포인트** | SDD에 엔트리포인트 연결 섹션 필수 포함 (v2.4.0) |

### SDD 엔트리포인트 필수 섹션 (v2.4.0 추가)

SDD.md 작성 시 반드시 다음 섹션을 포함해야 합니다:

```markdown
## 5. 엔트리포인트 연결 ⚠️ 필수

### 5.1 연결 위치
frontend/src/main.tsx

### 5.2 연결 방법
(코드 예시)

### 5.3 검증 체크리스트
- [ ] main.tsx에서 컴포넌트 import
- [ ] main.tsx에서 컴포넌트 렌더링
- [ ] npm run build 성공
- [ ] npm run dev 후 브라우저에서 확인
```

> ⚠️ 이 섹션이 없는 SDD는 Reviewer에서 FAIL 처리됩니다.

## Input Format

```json
{
  "documents": {
    "ia": "IA.md 내용 (Mermaid 포함)",
    "wireframe": "Wireframe.md 내용 (ASCII 포함)",
    "sdd": "SDD.md 내용 (ERD/API 포함)"
  },
  "options": {
    "theme": "light" | "dark",
    "interactive": true,
    "animation": true,
    "mermaidConfig": {
      "theme": "base",
      "themeVariables": { "primaryColor": "#e94560" },
      "securityLevel": "loose"
    },
    "singleFile": true
  }
}
```

### Mermaid 인터랙션 지원

Mermaid 노드 클릭 시 상세 정보 표시를 위해:
- `securityLevel: 'loose'` 설정 필수
- 노드 ID와 Markdown 섹션 매핑 로직 포함
- 예: `A[Login]` 클릭 → `## Login` 섹션 팝업

---

## Output Format

### 1. IA_VISUAL.html

```html
<!DOCTYPE html>
<html>
<head>
  <title>IA - 정보 구조</title>
  <script src="https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js"></script>
</head>
<body>
  <div id="ia-tree">
    <!-- Mermaid → SVG 렌더링 -->
    <!-- 노드 클릭 시 상세 정보 표시 -->
  </div>
  <div id="navigation-flow">
    <!-- 화면 간 이동 흐름 애니메이션 -->
  </div>
</body>
</html>
```

### 2. WIREFRAME_PREVIEW.html

```html
<!DOCTYPE html>
<html>
<head>
  <title>Wireframe Preview</title>
  <style>/* Tailwind-like utility classes */</style>
</head>
<body>
  <div class="device-frame mobile">
    <!-- ASCII → HTML 변환된 UI -->
    <!-- 클릭 시 다음 화면으로 전환 -->
  </div>
  <nav class="screen-navigator">
    <!-- 화면 목록 썸네일 -->
  </nav>
</body>
</html>
```

### 3. SDD_DIAGRAM.html

```html
<!DOCTYPE html>
<html>
<head>
  <title>SDD - 시스템 다이어그램</title>
</head>
<body>
  <section id="architecture">
    <!-- 시스템 아키텍처 SVG -->
  </section>
  <section id="erd">
    <!-- ERD 인터랙티브 다이어그램 -->
    <!-- 테이블 클릭 시 컬럼 상세 -->
  </section>
  <section id="api-flow">
    <!-- API 요청/응답 시퀀스 -->
  </section>
</body>
</html>
```

---

## Workflow (Internal Logic)

```
1. **Parsing**:
   - Wireframe.md를 읽어 [화면 이름, 구성 요소 목록, ASCII 구조] 추출
   - 텍스트 설명(Components 목록)을 우선 참고 (ASCII 파싱 오류 방지)
   ↓
2. **Structure Mapping**:
   - 추출된 요소를 HTML 시맨틱 태그(<nav>, <main>, <section>)로 매핑
   - TailwindCSS 클래스 적용으로 레이아웃 구현 용이
   ↓
3. **Styling**:
   - ASCII 시각적 배치를 CSS Grid/Flex로 변환
   - 테마 변수(CSS Variables) 적용
   ↓
4. **Interactivity**:
   - 버튼(`[ ]`) 감지 → `onclick` 이벤트 연결
   - 링크 감지 → 화면 전환(`showScreen()`) 함수 연결
   - Mermaid 노드 클릭 → 상세 정보 팝업
   ↓
5. **Merging (Single File)**:
   - HTML + CSS + JS를 하나의 파일로 인라인 결합
   - 외부 의존성은 CDN + 로컬 fallback 포함
   ↓
6. **Output**:
   - docs/cases/{caseId}/visuals/*.html 저장
   - 더블클릭만으로 완벽 동작하는 독립 파일
```

### ASCII 파싱 보완 전략

LLM이 ASCII Art를 정확히 파싱하기 어려울 수 있으므로:
1. **텍스트 설명 우선**: Wireframe.md의 `## Components` 섹션 먼저 참조
2. **구조적 힌트 활용**: `+---+`, `|   |` 패턴으로 영역 구분
3. **Tailwind CSS 활용**: 복잡한 레이아웃을 클래스로 간소화

---

## 기술 스택

| 용도 | 라이브러리 |
|------|-----------|
| Mermaid 렌더링 | mermaid.js |
| SVG 조작 | svg.js / D3.js |
| 애니메이션 | anime.js / CSS Animation |
| 레이아웃 | CSS Grid / Flexbox |
| 테마 | CSS Variables |

---

## 사용 예시

### Orchestrator 호출

```javascript
// LeaderAgent가 설계 완료 후
const planResult = await leaderAgent.plan(prd);

// Designer Skill이 시각화
const visualResult = await designerSkill.visualize({
  documents: {
    ia: planResult.ia,
    wireframe: planResult.wireframe,
    sdd: planResult.sdd
  },
  options: { theme: 'light', interactive: true }
});

// 결과: docs/cases/{caseId}/visuals/*.html 생성
```

---

## Coder Skill과의 관계

> ⚠️ **중요**: Designer Skill 산출물은 **검증용(Verification)**입니다.

| Skill | 참조 대상 | 산출물 |
|-------|----------|--------|
| **Coder Skill** | `Wireframe.md` (원본) | React/Vue 컴포넌트 |
| **Designer Skill** | `Wireframe.md` (원본) | HTML 프리뷰 (검증용) |

- Coder Skill은 Designer Skill의 HTML을 참조하지 않음
- Designer Skill 산출물은 이해관계자 커뮤니케이션 도구
- 실제 코드 생성은 항상 Markdown 원본 기반

---

## Single File 패키징 (Portability)

사내망 등 CDN 차단 환경을 고려한 독립 실행 가능 HTML:

```html
<!DOCTYPE html>
<html>
<head>
  <style>/* 모든 CSS 인라인 */</style>
  <script>
    // CDN 로드 실패 시 fallback
    if (typeof mermaid === 'undefined') {
      console.warn('Mermaid CDN 로드 실패 - 로컬 렌더링 사용');
      // 로컬 fallback 로직
    }
  </script>
  <script src="https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js"></script>
</head>
<body>
  <!-- 모든 콘텐츠 -->
  <script>/* 모든 JS 인라인 */</script>
</body>
</html>
```

---

## 향후 로드맵

- [ ] Figma 플러그인 연동 (HTML → Figma 임포트)
- [ ] 실시간 협업 (다중 사용자 편집)
- [ ] 버전 비교 (diff 시각화)
- [ ] PDF 익스포트
- [x] Single File Component 방식 채택
- [x] Mermaid 인터랙션 (click events) 지원
- [x] ASCII 파싱 보완 전략 문서화

---

**END OF SKILL**

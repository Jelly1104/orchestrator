# IA.md - Skill Dashboard Lite 정보 구조

> **문서 버전**: 1.0.0
> **최종 업데이트**: 2026-01-06
> **상위 문서**: HANDOFF.md (260106-lite-test)

---

## 1. 서비스 정보 계층 구조

```
SkillsDashboardLite
├── 1. Header
│   ├── 1.1 타이틀 ("Skill Dashboard")
│   └── 1.2 Refresh 버튼
│
├── 2. Skills Grid
│   ├── 2.1 SkillCard (x7)
│   │   ├── 이름
│   │   ├── 버전
│   │   ├── 상태 (active/inactive)
│   │   └── 설명
│   └── 2.2 Grid Layout (3열 반응형)
│
└── 3. Footer
    └── 3.1 통계 요약 (Total/Active/Inactive)
```

---

## 2. 네비게이션 구조

### 2.1 진입점 (Entry Points)

| 위치 | 라우팅 | 설명 |
|------|--------|------|
| 메인 | `/` | SkillsDashboardLite 직접 렌더링 |

### 2.2 페이지 라우팅

```
/ (SkillsDashboardLite)
└── 단일 페이지 (SPA)
```

> **참고**: 라우팅 없이 단일 대시보드 화면으로 구성

---

## 3. 데이터 흐름 (Data Flow)

### 3.1 데이터 흐름도

```
[정적 데이터]
     │
     ▼
┌─────────────┐
│ SKILLS_DATA │ (types.ts)
└─────────────┘
     │
     ▼
┌───────────────────┐
│ SkillsDashboardLite │
│   - 통계 계산      │
│   - Grid 렌더링    │
└───────────────────┘
     │
     ▼
┌───────────┐
│ SkillCard │ (x7)
└───────────┘
```

### 3.2 데이터 소스

| 데이터 | 소스 | 업데이트 주기 |
|--------|------|---------------|
| Skill 목록 | 정적 데이터 (SKILLS_DATA) | 없음 (하드코딩) |

---

## 4. 컨텐츠 구조

### 4.1 SkillCard 정보 구성

```yaml
SkillCard:
  - name: string (Skill 이름)
  - version: string (버전)
  - status: 'active' | 'inactive' (상태)
  - description: string (설명)
```

### 4.2 정보 우선순위

| 우선순위 | 항목 | 가중치 |
|----------|------|--------|
| 1 | 이름 + 상태 | 50% |
| 2 | 버전 | 30% |
| 3 | 설명 | 20% |

---

## 5. 상태 관리 (State Management)

### 5.1 상태 정의

```yaml
상태:
  - 없음 (정적 렌더링)
```

> **참고**: 정적 데이터 기반으로 별도 상태 관리 불필요

---

## 6. 반응형 고려사항

### 6.1 브레이크포인트

| 브레이크포인트 | Grid 열 수 |
|----------------|-----------|
| Mobile (< 640px) | 1열 |
| Tablet (640px ~ 1024px) | 2열 |
| Desktop (> 1024px) | 3열 |

---

**END OF IA.md**

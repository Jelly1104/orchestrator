# IA.md - Skills Dashboard 정보 구조

> **문서 버전**: 1.0.0
> **최종 업데이트**: 2026-01-06
> **상위 문서**: PRD - Extension Skills 테스트 대시보드, HANDOFF.md

---

## 1. 서비스 정보 계층 구조

```
Skills Dashboard
├── 1. Header
│   └── 1.1 Title ("Skills Dashboard")
│
├── 2. Skills Grid
│   ├── 2.1 SkillCard (Query)
│   │   ├── Name
│   │   ├── Version
│   │   ├── Status Badge
│   │   └── Description
│   │
│   ├── 2.2 SkillCard (Profiler)
│   │   ├── Name
│   │   ├── Version
│   │   ├── Status Badge
│   │   └── Description
│   │
│   ├── 2.3 SkillCard (Designer)
│   │   ├── Name
│   │   ├── Version
│   │   ├── Status Badge
│   │   └── Description
│   │
│   ├── 2.4 SkillCard (Coder)
│   │   ├── Name
│   │   ├── Version
│   │   ├── Status Badge
│   │   └── Description
│   │
│   └── 2.5 SkillCard (Reviewer)
│       ├── Name
│       ├── Version
│       ├── Status Badge
│       └── Description
│
└── 3. Footer (Optional)
    └── 3.1 Version Info
```

---

## 2. 네비게이션 구조

### 2.1 진입점 (Entry Points)

| 위치 | 라우팅 | 설명 |
|------|--------|------|
| Extension Menu | `/skills` | Skills 대시보드 메인 진입점 |

### 2.2 페이지 라우팅

```
/skills (메인 - 단일 페이지)
└── 현재 버전에서는 단일 페이지로 구성
```

> **참고**: 이 대시보드는 단일 페이지 컴포넌트로 설계됨. 향후 확장 시 `/skills/:skillId` 상세 페이지 추가 가능.

---

## 3. 데이터 흐름 (Data Flow)

### 3.1 데이터 흐름도

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│ Static Data     │ ──→ │ SkillsDashboard  │ ──→ │ UI Rendering    │
│ (skills array)  │     │ Component        │     │ (Cards Grid)    │
└─────────────────┘     └──────────────────┘     └─────────────────┘
```

### 3.2 데이터 소스

| 데이터 | 타입 | 업데이트 주기 |
|--------|------|---------------|
| Skills 목록 | Static Array | 빌드 시 고정 |
| Skill 정보 | Skill Interface | 변경 없음 |

---

## 4. 컨텐츠 구조

### 4.1 주요 정보 구성

```yaml
Skill 컨텐츠 구조:
  - name: string       # Skill 이름 (query, profiler 등)
  - version: string    # 버전 정보 (v1.3.0 형식)
  - status: enum       # 상태 (active | inactive)
  - description: string # 설명 텍스트
```

### 4.2 정보 우선순위

| 우선순위 | 항목 | 가중치 | 표시 위치 |
|----------|------|--------|-----------|
| 1 | Skill Name | 40% | 카드 상단 |
| 2 | Status | 30% | 이름 옆 뱃지 |
| 3 | Version | 20% | 카드 중앙 |
| 4 | Description | 10% | 카드 하단/툴팁 |

---

## 5. 상태 관리 (State Management)

### 5.1 상태 정의

```yaml
Skill 상태:
  - active: 활성화됨 (녹색 뱃지)
  - inactive: 비활성화됨 (회색 뱃지)
```

### 5.2 UI 상태

| 상태 | 스타일 | 설명 |
|------|--------|------|
| active | `bg-green-100 text-green-800` | 정상 작동 중 |
| inactive | `bg-gray-100 text-gray-500` | 비활성화 상태 |

---

## 6. 컴포넌트 계층

```
SkillsDashboard (Page Component)
├── Header
│   └── Title
│
└── SkillsGrid (Container)
    └── SkillCard (Repeated x5)
        ├── CardHeader
        │   ├── SkillName
        │   └── StatusBadge
        ├── CardBody
        │   └── Version
        └── CardFooter (Optional)
            └── Description
```

---

## 7. 반응형 고려사항

### 7.1 Breakpoints

| 디바이스 | 너비 | 그리드 열 |
|----------|------|-----------|
| Mobile | ~639px | 1열 |
| Tablet | 640~1023px | 2열 |
| Desktop | 1024px~ | 3열 |

### 7.2 레이아웃 변화

**Mobile (1열)**
```
┌─────────┐
│ Card 1  │
└─────────┘
┌─────────┐
│ Card 2  │
└─────────┘
...
```

**Desktop (3열)**
```
┌─────────┐ ┌─────────┐ ┌─────────┐
│ Card 1  │ │ Card 2  │ │ Card 3  │
└─────────┘ └─────────┘ └─────────┘
┌─────────┐ ┌─────────┐
│ Card 4  │ │ Card 5  │
└─────────┘ └─────────┘
```

---

**END OF IA.MD**

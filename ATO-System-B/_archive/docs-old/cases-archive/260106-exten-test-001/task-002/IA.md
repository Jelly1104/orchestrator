# IA.md

> **생성일**: 2026-01-06T09:18:18.838Z
> **생성 도구**: DesignAgent v1.0.0

---

# Information Architecture Document

## 1. 페이지 계층 구조

```
├── /dashboard
│   ├── /dashboard/skills
│   │   ├── /dashboard/skills/overview
│   │   ├── /dashboard/skills/:id
│   │   └── /dashboard/skills/settings
│   └── /dashboard/reports
```

## 2. 네비게이션 설계

### GNB (Global Navigation Bar)
- 홈 (`/dashboard`)
- 스킬 대시보드 (`/dashboard/skills`)
- 리포트 (`/dashboard/reports`)

### LNB (Local Navigation Bar) for `/dashboard/skills`
- 스킬 개요 (`/dashboard/skills/overview`)
- 스킬 상세 정보 (`/dashboard/skills/:id`)
- 설정 (`/dashboard/skills/settings`)

### 탭 구조 for `/dashboard/skills/:id`
- 상태 뱃지 (active/inactive)
- 버전 정보

## 3. 데이터 매핑

- **/dashboard/skills**: 
  - 데이터 소스: Skills API
  - 표시 정보: Skills 목록, 상태 뱃지, 버전 정보

- **/dashboard/skills/:id**: 
  - 데이터 소스: Skill Detail API
  - 표시 정보: 특정 Skill 정보, 상태 뱃지, 버전 정보

## 4. 라우팅 설계

- **/dashboard**: 대시보드 메인 페이지, Skills 및 Reports로의 네비게이션을 포함
- **/dashboard/skills**: Skills 목록 페이지, 각 Skill 정보 카드 형태로 표시 (최대 5개 카드)
- **/dashboard/skills/overview**: Skills의 개요 페이지
- **/dashboard/skills/:id**: 특정 Skill 상세 페이지
- **/dashboard/skills/settings**: Skills 관련 설정 페이지
- **/dashboard/reports**: Reports 페이지

이 IA 문서는 사용자의 경로를 명확하게 이해하고 설계의 일관성을 유지하기 위한 참고 문서로 사용됩니다.
# IA.md

> **생성일**: 2026-01-06T10:17:13.225Z
> **생성 도구**: DesignAgent v1.0.0

---

## Information Architecture Document

### 1. 페이지 계층 구조

```
├── /dashboard
│   ├── /dashboard/skills
│   │   ├── /dashboard/skills/:skillId
│   │   ├── /dashboard/skills/:skillId/edit
│   └── /dashboard/settings
```

### 2. 네비게이션 설계

- **GNB (Global Navigation Bar)**
  - Dashboard
  - Settings

- **LNB (Local Navigation Bar) for `/dashboard/skills`**
  - Skills Overview
  - Add New Skill

- **탭 구조 within a Skill Detail page (`/dashboard/skills/:skillId`)**
  - Overview
  - Edit Skill
  - Version History

### 3. 데이터 매핑

- **/dashboard/skills**
  - 데이터 소스: Skills API
  - 데이터: Skill 목록 (이름, 상태 뱃지, 버전 정보 등)

- **/dashboard/skills/:skillId**
  - 데이터 소스: Skill Detail API
  - 데이터: Skill 세부 정보 (이름, 상태, 버전 정보 등)

- **/dashboard/skills/:skillId/edit**
  - 데이터 소스: Skill Update API
  - 데이터: Skill 편집 가능한 정보

### 4. 라우팅 설계

- **URL 패턴 및 라우트 정의**
  - `/dashboard` - 대시보드 메인
  - `/dashboard/skills` - Skills 목록 페이지
  - `/dashboard/skills/:skillId` - Skill 세부 정보 페이지
  - `/dashboard/skills/:skillId/edit` - Skill 편집 페이지
  - `/dashboard/settings` - 설정 페이지
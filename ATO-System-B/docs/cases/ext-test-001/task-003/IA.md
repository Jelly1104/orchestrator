# IA.md

> **생성일**: 2026-01-06T09:32:14.435Z
> **생성 도구**: DesignAgent v1.0.0

---

# 정보 구조 문서 (IA.md)

## 1. 페이지 계층 구조

```
├── /skills
│   ├── /skills/list
│   │   ├── /skills/list/overview
│   │   └── /skills/list/details/:id
│   ├── /skills/categories
└── /skills/settings
```

## 2. 네비게이션 설계

### 글로벌 네비게이션 바 (GNB)

- Skills
  - 목록
  - 카테고리
- 설정

### 로컬 네비게이션 바 (LNB)

#### /skills

- 목록
  - 개요
  - 세부정보
- 카테고리

## 3. 데이터 매핑

- **/skills/list/overview**
  - 데이터 소스: Skills 목록 API
  - 표시 요소: 5개 Skills 카드, 상태 뱃지, 버전 정보

- **/skills/list/details/:id**
  - 데이터 소스: Skill 상세 정보 API (ID 기반)
  - 표시 요소: Skill 상세 정보, 상태 및 버전 정보

- **/skills/categories**
  - 데이터 소스: Skill 카테고리 목록 API

- **/skills/settings**
  - 데이터 소스: 사용자 설정 및 Preferences API

## 4. 라우팅 설계

- **/skills**
  - URL 패턴: `/skills`

- **/skills/list**
  - URL 패턴: `/skills/list`

- **/skills/list/overview**
  - URL 패턴: `/skills/list/overview`

- **/skills/list/details/:id**
  - URL 패턴: `/skills/list/details/:id`
  - 설명: Skill ID에 해당하는 상세 정보를 가져옴

- **/skills/categories**
  - URL 패턴: `/skills/categories`

- **/skills/settings**
  - URL 패턴: `/skills/settings`

이 정보 구조는 지정된 PRD에 기반하여 유저가 Skills를 효율적으로 탐색하고 관리할 수 있도록 설계되었습니다.
# IA.md: 공지사항 목록 정보 구조

> **생성일**: 2025-12-16
> **케이스**: #1 (L1)
> **Leader**: Claude Code

---

## 1. 라우팅 구조

```
/notice                    # 공지사항 목록
/notice/:id                # 공지사항 상세
```

## 2. 페이지 계층

```
[공지사항 목록] (/notice)
├── [Header]
│   └── 페이지 타이틀: "공지사항"
├── [Notice List]
│   ├── [Notice Item] x N
│   │   ├── [Badge] (중요/일반)
│   │   ├── [Title]
│   │   ├── [Date]
│   │   └── [Views]
│   └── [Empty State] (목록 없을 때)
├── [Pagination]
│   ├── [Prev]
│   ├── [Page Numbers]
│   └── [Next]
└── [Footer]

[공지사항 상세] (/notice/:id)
├── [Header]
│   └── 뒤로가기 + 타이틀
├── [Content]
│   ├── [Title]
│   ├── [Meta] (작성일, 조회수)
│   └── [Body] (HTML 렌더링)
└── [Footer]
    └── 목록으로 돌아가기
```

## 3. 데이터 흐름

```
[사용자] → [목록 페이지 진입]
         → [API: GET /api/notice?page=1]
         → [DB: BOARD_NOTICE 조회]
         → [목록 렌더링]

[사용자] → [공지 클릭]
         → [API: GET /api/notice/:id]
         → [DB: 단건 조회 + 조회수 증가]
         → [상세 렌더링]
```

---

**END OF IA.md**

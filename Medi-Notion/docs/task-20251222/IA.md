# IA.md - 정보 구조

## 페이지 계층
```
/
└── Todo App (Single Page)
    ├── Header
    │   └── Title: "할 일 관리"
    ├── Input Section
    │   ├── Task Input Field
    │   └── Add Button
    └── Todo List Section
        └── Todo Items
            ├── Task Text
            └── Delete Button
```

## 라우팅 구조
```
/ (Root) - Todo App Main Page
```

## 정보 흐름
```
1. 사용자 입력 (새 할 일)
2. 추가 버튼 클릭
3. 할 일 목록에 표시
4. 삭제 버튼 클릭 시 목록에서 제거
```
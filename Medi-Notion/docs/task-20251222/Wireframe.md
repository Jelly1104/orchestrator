# Wireframe.md - 화면 설계

## Main Page Layout
```
┌─────────────────────────────────┐
│           할 일 관리            │
├─────────────────────────────────┤
│ [텍스트 입력창     ] [추가]      │
├─────────────────────────────────┤
│ ☐ 할 일 1              [삭제]   │
│ ☐ 할 일 2              [삭제]   │
│ ☐ 할 일 3              [삭제]   │
└─────────────────────────────────┘
```

## 컴포넌트 구조
### Header Component
- Title: "할 일 관리"

### TodoInput Component
- Input Field: placeholder="새 할 일을 입력하세요"
- Add Button: "추가"
- State: inputValue

### TodoList Component
- TodoItem Component (반복)
  - Task Text Display
  - Delete Button: "삭제"

## 상태 관리
```javascript
state = {
  todos: [
    { id: 1, text: "할 일 1" },
    { id: 2, text: "할 일 2" }
  ],
  inputValue: ""
}
```

## 사용자 인터랙션
1. 텍스트 입력 → inputValue 업데이트
2. 추가 버튼 클릭 → todos 배열에 새 항목 추가
3. 삭제 버튼 클릭 → 해당 id의 항목 제거
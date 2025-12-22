# SDD.md - 시스템 설계

## 1. 아키텍처 개요
```
┌──────────────┐    ┌──────────────┐
│   Frontend   │    │  Local State │
│   (React)    │────│ Management   │
└──────────────┘    └──────────────┘
```

## 2. 데이터 모델
### Todo Item
```javascript
{
  id: number,        // 고유 식별자
  text: string,      // 할 일 내용
  createdAt: Date    // 생성 시간
}
```

### Application State
```javascript
{
  todos: Todo[],
  nextId: number,
  inputValue: string
}
```

## 3. 컴포넌트 설계
### App.js (Main Container)
- 전체 상태 관리
- 할 일 추가/삭제 로직

### TodoInput.js
- Props: { onAddTodo, inputValue, onInputChange }
- 입력 처리 및 추가 기능

### TodoList.js
- Props: { todos, onDeleteTodo }
- 할 일 목록 렌더링

### TodoItem.js
- Props: { todo, onDelete }
- 개별 할 일 항목 표시

## 4. 주요 함수
```javascript
// 할 일 추가
addTodo(text) {
  const newTodo = {
    id: this.state.nextId,
    text: text,
    createdAt: new Date()
  };
  this.setState({
    todos: [...this.state.todos, newTodo],
    nextId: this.state.nextId + 1,
    inputValue: ''
  });
}

// 할 일 삭제
deleteTodo(id) {
  this.setState({
    todos: this.state.todos.filter(todo => todo.id !== id)
  });
}
```

## 5. 기술 스택
- React (함수형 컴포넌트 + Hooks)
- CSS Modules 또는 Styled Components
- 로컬 스토리지 없음 (메모리 상태만)

## 6. 제약사항
- 서버 연동 없음
- 브라우저 새로고침 시 데이터 초기화
- 단순 추가/삭제 기능만 제공
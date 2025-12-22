// Todo 앱 타입 정의
export interface Todo {
  id: number;
  text: string;
  createdAt: Date;
}

export interface AppState {
  todos: Todo[];
  nextId: number;
  inputValue: string;
}

export interface TodoInputProps {
  onAddTodo: (text: string) => void;
  inputValue: string;
  onInputChange: (value: string) => void;
}

export interface TodoListProps {
  todos: Todo[];
  onDeleteTodo: (id: number) => void;
}

export interface TodoItemProps {
  todo: Todo;
  onDelete: (id: number) => void;
}
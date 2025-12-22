export interface TodoItem {
  TODO_ID: number;
  U_ID: string;
  CONTENT: string;
  REG_DATE: string;
  DEL_FLAG: 'Y' | 'N';
}

export interface TodoCreateRequest {
  content: string;
}

export interface TodoCreateResponse {
  todo_id: number;
  message: string;
}

export interface TodoDeleteResponse {
  message: string;
}

export interface TodoListResponse {
  todos: TodoItem[];
}

// API 응답 래퍼
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
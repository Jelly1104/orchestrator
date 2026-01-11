import { useState, useCallback } from 'react';
import { TodoResponse, TodoCreateRequest } from '../../../shared/types/todo.dto';

export const useTodos = () => {
  const [todos, setTodos] = useState<TodoResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const apiCall = async (url: string, options: RequestInit = {}) => {
    const response = await fetch(`/api/todos${url}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || '요청에 실패했습니다.');
    }

    return response.json();
  };

  const refreshTodos = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await apiCall('');
      setTodos(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '할일 목록을 불러오는데 실패했습니다.');
      console.error('할일 목록 조회 실패:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const addTodo = useCallback(async (content: string): Promise<boolean> => {
    setError(null);
    
    try {
      const requestData: TodoCreateRequest = { content };
      await apiCall('', {
        method: 'POST',
        body: JSON.stringify(requestData),
      });
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : '할일 추가에 실패했습니다.');
      console.error('할일 추가 실패:', err);
      return false;
    }
  }, []);

  const deleteTodo = useCallback(async (todoId: number): Promise<boolean> => {
    setError(null);
    
    try {
      await apiCall(`/${todoId}`, {
        method: 'DELETE',
      });
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : '할일 삭제에 실패했습니다.');
      console.error('할일 삭제 실패:', err);
      return false;
    }
  }, []);

  return {
    todos,
    loading,
    error,
    addTodo,
    deleteTodo,
    refreshTodos,
  };
};
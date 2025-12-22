// 컴포넌트 관련 타입 정의
export interface HomePageProps {
  initialMessage?: string;
}

export interface ApiTestButtonProps {
  onApiCall: (response: ApiResponse) => void;
  loading?: boolean;
}

export interface ResponseDisplayProps {
  response: ApiResponse | null;
  loading: boolean;
  error?: string;
}

export interface AppState {
  apiResponse: ApiResponse | null;
  isLoading: boolean;
  error: string | null;
}
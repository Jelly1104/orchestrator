export class RecommendationError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = 'RecommendationError';
  }
}

export class UserNotFoundError extends RecommendationError {
  constructor(userId: string) {
    super(
      `사용자 프로필을 찾을 수 없습니다: ${userId}`,
      'USER_NOT_FOUND',
      404
    );
  }
}

export class UnauthorizedError extends RecommendationError {
  constructor(message: string = '권한이 없습니다.') {
    super(message, 'UNAUTHORIZED', 403);
  }
}

export class ValidationError extends RecommendationError {
  constructor(message: string, field?: string) {
    super(
      field ? `${field}: ${message}` : message,
      'VALIDATION_ERROR',
      400
    );
  }
}

export class DatabaseError extends RecommendationError {
  constructor(message: string, originalError?: Error) {
    super(`데이터베이스 오류: ${message}`, 'DATABASE_ERROR', 500);
    if (originalError) {
      this.stack = originalError.stack;
    }
  }
}
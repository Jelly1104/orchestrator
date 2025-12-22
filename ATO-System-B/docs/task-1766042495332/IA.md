# IA.md - 정보 구조

## 라우팅 구조
```
/
├── / (홈 페이지 - Hello World 표시)
└── /api/
    └── hello (GET) - Hello World API 엔드포인트
```

## 페이지 계층
- **레벨 1**: 루트 페이지 (`/`)
  - 목적: Hello World 메시지 표시 및 API 테스트 UI 제공
  - 접근성: 공개 (인증 불필요)

## 네비게이션 플로우
```mermaid
graph TD
    A[사용자 접속] --> B[홈 페이지 로드]
    B --> C[Hello World 메시지 표시]
    B --> D[API 호출 버튼 클릭]
    D --> E[/api/hello 호출]
    E --> F[응답 결과 표시]
```

## 컨텐츠 우선순위
1. **Primary**: Hello World 메시지
2. **Secondary**: API 테스트 기능
3. **Tertiary**: 시스템 상태 정보
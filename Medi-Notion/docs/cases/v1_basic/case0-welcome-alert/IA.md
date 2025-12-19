# IA.md - 환영 알림 정보 구조

## 페이지 구조
```
/
├── App.jsx (메인 컨테이너)
│   └── WelcomeNotification.jsx (환영 알림 컴포넌트)
```

## 컴포넌트 계층
```
App
└── WelcomeNotification
    ├── NotificationContainer (알림 래퍼)
    ├── NotificationContent (메시지 영역)
    └── CloseButton (닫기 버튼)
```

## 상태 관리
- `isVisible`: 알림 표시 여부 (boolean)
- `hasShown`: 세션 중 알림 표시 이력 (boolean)

## 라이프사이클
1. 페이지 로드 → 컴포넌트 마운트
2. 3초 후 자동 알림 표시
3. 사용자 액션 또는 5초 후 자동 사라짐
# SDD.md - 환영 알림 시스템 설계

## 1. 아키텍처 개요
```
Frontend Only Architecture
┌─────────────────┐
│   React App     │
│  ┌─────────────┐│
│  │ Welcome     ││
│  │ Notification││
│  └─────────────┘│
└─────────────────┘
```

## 2. 레거시 스키마 매핑
**해당 없음** - 순수 Frontend 기능으로 DB 연동 불필요

## 3. 컴포넌트 설계

### WelcomeNotification.jsx
```javascript
// Props Interface
interface WelcomeNotificationProps {
  message?: string;           // 기본값: "Welcome to Medi-Notion!"
  autoShowDelay?: number;     // 기본값: 3000ms
  autoHideDelay?: number;     // 기본값: 5000ms
  position?: 'top-right' | 'top-left' | 'center';
}

// State Management
const [isVisible, setIsVisible] = useState(false);
const [hasShown, setHasShown] = useState(false);
```

## 4. 스타일 시스템

### CSS-in-JS (styled-components 또는 emotion)
```scss
.notification-container {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 9999;
  
  // 메디게이트 브랜드 컬러
  background: linear-gradient(135deg, #4A90E2 0%, #357ABD 100%);
  
  // 애니메이션
  transform: translateX(100%);
  transition: transform 0.3s ease-in-out, opacity 0.3s ease-in-out;
  
  &.visible {
    transform: translateX(0);
    opacity: 1;
  }
}
```

## 5. 애니메이션 로직
```javascript
// 마운트 후 자동 표시
useEffect(() => {
  if (!hasShown) {
    const showTimer = setTimeout(() => {
      setIsVisible(true);
      setHasShown(true);
    }, autoShowDelay);

    return () => clearTimeout(showTimer);
  }
}, [hasShown, autoShowDelay]);

// 자동 숨김
useEffect(() => {
  if (isVisible) {
    const hideTimer = setTimeout(() => {
      setIsVisible(false);
    }, autoHideDelay);

    return () => clearTimeout(hideTimer);
  }
}, [isVisible, autoHideDelay]);
```

## 6. 접근성 고려사항
- ARIA 속성 적용
- 키보드 네비게이션 지원
- 스크린 리더 호환
- 움직임 감소 옵션 지원 (prefers-reduced-motion)

## 7. 성능 최적화
- React.memo로 불필요한 리렌더링 방지
- CSS 애니메이션 활용 (transform, opacity)
- 타이머 정리로 메모리 누수 방지

## 8. 테스트 케이스
- 컴포넌트 마운트 시 3초 후 표시 확인
- X 버튼 클릭 시 즉시 숨김 확인
- 5초 후 자동 숨김 확인
- 세션 중 중복 표시 방지 확인
# HANDOFF.md - Sub-agent 작업 지시서

## Mode: Coding

## Input 문서
- IA.md: 컴포넌트 구조 및 상태 관리
- Wireframe.md: 레이아웃 및 스타일 가이드
- SDD.md: 기술적 구현 세부사항

## Output 기대
1. **WelcomeNotification.jsx** - 메인 알림 컴포넌트
2. **App.jsx** - 컴포넌트 통합 예제
3. **styles.css** - 스타일시트 (또는 styled-components)
4. **README.md** - 사용법 및 설치 가이드

## 완료 기준
- [ ] 페이지 로드 3초 후 알림 자동 표시
- [ ] 5초 후 또는 X 버튼 클릭 시 알림 숨김
- [ ] 반응형 디자인 적용 (Desktop/Mobile)
- [ ] 부드러운 슬라이드 인/아웃 애니메이션
- [ ] 세션 중 중복 표시 방지
- [ ] TypeScript 또는 PropTypes로 타입 안정성 확보

## 제약사항
- **React 18+ Hooks 사용 필수**
- **Styled-components 또는 CSS Modules 권장**
- **외부 라이브러리 최소화** (react-spring 등 애니메이션 라이브러리 사용 가능)
- **접근성 기준 준수** (ARIA, 키보드 네비게이션)
- **성능 최적화 적용** (React.memo, useCallback 등)

## 브랜드 가이드
- **메인 컬러**: #4A90E2 (메디게이트 블루)
- **서브 컬러**: #357ABD
- **폰트**: 'Noto Sans KR' 또는 시스템 폰트
- **아이콘**: 🎉 (환영 이모지) + ✕ (닫기 버튼)

## 추가 요구사항
- 컴포넌트는 재사용 가능하도록 props로 커스터마이징 지원
- 에러 바운더리 적용으로 안정성 확보
- 개발자 도구에서 디버깅 가능하도록 명확한 컴포넌트명 사용

---
**Sub-agent 담당자**: Frontend Specialist Agent
**예상 작업 시간**: 2-3시간
**우선순위**: High